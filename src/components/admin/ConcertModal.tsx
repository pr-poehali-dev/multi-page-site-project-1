import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConcertModalProps {
  show: boolean;
  mode: 'create' | 'edit';
  formData: {
    title: string;
    description: string;
    poster_url?: string;
    ticket_link?: string;
    details_link?: string;
    location?: string;
    event_date?: string;
    status: string;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  concertId?: number;
}

const ConcertModal = ({
  show,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  concertId,
}: ConcertModalProps) => {
  const { toast } = useToast();
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Можно загружать только изображения',
        variant: 'destructive'
      });
      return;
    }

    setUploadingPoster(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = (event.target?.result as string).split(',')[1];

          const response = await fetch('https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: concertId || 0,
              files: [{
                fileName: `concert_poster_${file.name}`,
                fileType: file.type,
                fileSize: file.size,
                fileData: base64String
              }]
            })
          });

          const data = await response.json();

          if (data.files && data.files.length > 0) {
            setFormData({ ...formData, poster_url: data.files[0].fileUrl });
            toast({
              title: 'Успешно',
              description: 'Афиша загружена'
            });
          } else {
            toast({
              title: 'Ошибка',
              description: 'Не удалось получить URL файла',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить афишу',
            variant: 'destructive'
          });
        } finally {
          setUploadingPoster(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('FileReader error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось прочитать файл',
        variant: 'destructive'
      });
      setUploadingPoster(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Создать концерт' : 'Редактировать концерт'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Название</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Введите название концерта"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Описание</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Введите описание концерта"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Дата и время мероприятия</label>
            <Input
              type="datetime-local"
              value={formData.event_date || ''}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Место проведения</label>
            <Input
              value={formData.location || ''}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Например: ГДК, Воронеж"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Статус</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Предстоящий</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Icon name="Image" size={16} />
              Афиша концерта (изображение)
            </label>
            <div className="flex gap-2">
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                onChange={handlePosterUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => posterInputRef.current?.click()}
                disabled={uploadingPoster}
                className="flex-1"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                {uploadingPoster ? 'Загрузка...' : formData.poster_url ? 'Заменить афишу' : 'Загрузить афишу'}
              </Button>
              {formData.poster_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(formData.poster_url, '_blank')}
                >
                  <Icon name="ExternalLink" size={16} />
                </Button>
              )}
            </div>
            {formData.poster_url && (
              <div className="mt-2">
                <img 
                  src={formData.poster_url} 
                  alt="Афиша" 
                  className="w-24 h-24 object-contain border rounded p-2"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Icon name="Ticket" size={16} />
              Ссылка на покупку билетов
            </label>
            <Input
              value={formData.ticket_link || ''}
              onChange={(e) =>
                setFormData({ ...formData, ticket_link: e.target.value })
              }
              placeholder="https://example.com/tickets"
              type="url"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Icon name="Info" size={16} />
              Ссылка на подробности
            </label>
            <Input
              value={formData.details_link || ''}
              onChange={(e) =>
                setFormData({ ...formData, details_link: e.target.value })
              }
              placeholder="https://example.com/details"
              type="url"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={onSubmit}
          >
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConcertModal;