import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface GalleryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    media_type: 'photo' | 'video';
    contest_id?: number;
    is_featured: boolean;
    file_base64: string;
    file_name: string;
  }) => Promise<void>;
  contests: Array<{ id: number; title: string }>;
}

export default function GalleryUploadModal({ open, onClose, onSubmit, contests }: GalleryUploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [contestId, setContestId] = useState<string>('none');
  const [isFeatured, setIsFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Ограничиваем максимальный размер 1920px
          const maxSize = 1920;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Сжимаем до 80% качества
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Для изображений - сжимаем
      if (selectedFile.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(selectedFile);
          setPreview(compressed);
        } catch (error) {
          console.error('Compression error:', error);
          // Fallback на оригинал
          const reader = new FileReader();
          reader.onload = (event) => {
            setPreview(event.target?.result as string);
          };
          reader.readAsDataURL(selectedFile);
        }
      } else {
        // Для видео - показываем как есть
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || !file) return;

    setLoading(true);
    try {
      let base64String: string;
      
      // Для изображений используем сжатый preview
      if (file.type.startsWith('image/') && preview) {
        base64String = preview.split(',')[1];
      } else {
        // Для видео читаем напрямую
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            const result = (event.target?.result as string).split(',')[1];
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64String = fileData;
      }
      
      await onSubmit({
        title,
        description,
        media_type: mediaType,
        contest_id: contestId !== 'none' ? parseInt(contestId) : undefined,
        is_featured: isFeatured,
        file_base64: base64String,
        file_name: file.name
      });

      setTitle('');
      setDescription('');
      setMediaType('photo');
      setContestId('none');
      setIsFeatured(false);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Загрузить файл в галерею</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="file">Файл *</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Icon name="Upload" size={18} className="mr-2" />
                {file ? file.name : 'Выбрать файл'}
              </Button>
              
              {preview && (
                <div className="mt-4 relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {mediaType === 'photo' ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={preview} className="w-full h-full object-cover" controls />
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="media_type">Тип *</Label>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as 'photo' | 'video')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Фото</SelectItem>
                <SelectItem value="video">Видео</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опционально"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="contest">Конкурс</Label>
            <Select value={contestId} onValueChange={setContestId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите конкурс (опционально)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без привязки</SelectItem>
                {contests.map((contest) => (
                  <SelectItem key={contest.id} value={contest.id.toString()}>
                    {contest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Избранное (показывать на главной)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !file || loading}>
            {loading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}