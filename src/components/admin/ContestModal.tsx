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

interface ContestModalProps {
  show: boolean;
  mode: 'create' | 'edit';
  formData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    rules?: string;
    prizes?: string;
    categories?: string;
    pdf_url?: string;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  contestId?: number;
}

const ContestModal = ({
  show,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  contestId,
}: ContestModalProps) => {
  const { toast } = useToast();
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (!contestId && mode === 'edit') {
      toast({
        title: 'Ошибка',
        description: 'Сначала сохраните конкурс',
        variant: 'destructive'
      });
      return;
    }

    setUploadingPdf(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = (event.target?.result as string).split(',')[1];

        const response = await fetch('https://functions.poehali.dev/b0d40cbb-41ff-48a1-a800-101845d59a03', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_base64: base64String,
            file_name: file.name,
            contest_id: contestId || 0
          })
        });

        const data = await response.json();

        if (data.pdf_url) {
          setFormData({ ...formData, pdf_url: data.pdf_url });
          toast({
            title: 'Успешно',
            description: 'PDF загружен'
          });
        }
      };
      reader.readAsDataURL(file);
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Создать конкурс' : 'Редактировать конкурс'}
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
              placeholder="Введите название конкурса"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Описание</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Введите описание конкурса"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Дата начала
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Дата окончания
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
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
              <Icon name="FileText" size={16} />
              Положение конкурса (PDF)
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
                disabled={uploadingPdf || (mode === 'create')}
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
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground mt-1">
                PDF можно будет загрузить после создания конкурса
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Правила (опционально)</label>
            <Textarea
              value={formData.rules || ''}
              onChange={(e) =>
                setFormData({ ...formData, rules: e.target.value })
              }
              placeholder="Правила участия в конкурсе"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Категории (опционально)</label>
            <Textarea
              value={formData.categories || ''}
              onChange={(e) =>
                setFormData({ ...formData, categories: e.target.value })
              }
              placeholder="Категории участия"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Призы (опционально)</label>
            <Textarea
              value={formData.prizes || ''}
              onChange={(e) =>
                setFormData({ ...formData, prizes: e.target.value })
              }
              placeholder="Призовой фонд"
              rows={3}
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

export default ContestModal;