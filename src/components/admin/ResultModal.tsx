import { useState, useRef, useEffect } from 'react';
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

interface Contest {
  id: number;
  title: string;
}

interface ResultModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: {
    contest_id: number;
    title: string;
    description: string;
    pdf_url: string;
    published_date: string;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  resultId?: number;
}

const ResultModal = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  resultId,
}: ResultModalProps) => {
  const { toast } = useToast();
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [contests, setContests] = useState<Contest[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadContests = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
        const data = await response.json();
        setContests(data.contests || []);
      } catch (error) {
        console.error('Ошибка загрузки конкурсов:', error);
      }
    };
    if (show) {
      loadContests();
    }
  }, [show]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Ошибка',
        description: 'Можно загружать только PDF файлы',
        variant: 'destructive'
      });
      return;
    }

    setUploadingPdf(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = (event.target?.result as string).split(',')[1];

          const response = await fetch('https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: 0,
              files: [{
                fileName: `result_${file.name}`,
                fileType: file.type,
                fileSize: file.size,
                fileData: base64String
              }]
            })
          });

          const data = await response.json();

          if (data.files && data.files.length > 0) {
            setFormData({ ...formData, pdf_url: data.files[0].fileUrl });
            toast({
              title: 'Успешно',
              description: 'PDF загружен'
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
            description: 'Не удалось загрузить PDF',
            variant: 'destructive'
          });
        } finally {
          setUploadingPdf(false);
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
      setUploadingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Опубликовать итоги' : 'Редактировать итоги'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Конкурс *</label>
            <Select
              value={formData.contest_id.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, contest_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите конкурс" />
              </SelectTrigger>
              <SelectContent>
                {contests.map((contest) => (
                  <SelectItem key={contest.id} value={contest.id.toString()}>
                    {contest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Название *</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Например: Итоги конкурса 2024"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Описание</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Краткое описание итогов"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Дата публикации</label>
            <Input
              type="date"
              value={formData.published_date}
              onChange={(e) =>
                setFormData({ ...formData, published_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Icon name="FileText" size={16} />
              PDF файл с итогами
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf}
                className="flex-1"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                {uploadingPdf ? 'Загрузка...' : formData.pdf_url ? 'Заменить PDF' : 'Загрузить PDF'}
              </Button>
              {formData.pdf_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(formData.pdf_url, '_blank')}
                >
                  <Icon name="ExternalLink" size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={onSubmit}
          >
            {mode === 'create' ? 'Опубликовать' : 'Сохранить'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResultModal;