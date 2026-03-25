import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { ContestFormData } from './ContestModalTypes';
import ContestBasicFields from './ContestBasicFields';
import ContestUploadFields from './ContestUploadFields';
import ContestEventFields from './ContestEventFields';

interface ContestModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: ContestFormData;
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  contestId?: number;
}

const ContestModal = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  contestId,
}: ContestModalProps) => {
  const { toast } = useToast();
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingForm, setUploadingForm] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Ошибка', description: 'Можно загружать только PDF файлы', variant: 'destructive' });
      return;
    }

    if (!contestId && mode === 'edit') {
      toast({ title: 'Ошибка', description: 'Сначала сохраните конкурс', variant: 'destructive' });
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
          body: JSON.stringify({ file_base64: base64String, file_name: file.name, contest_id: contestId || 0 })
        });

        const data = await response.json();

        if (data.pdf_url) {
          setFormData({ ...formData, pdf_url: data.pdf_url });
          toast({ title: 'Успешно', description: 'PDF загружен' });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить PDF', variant: 'destructive' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Ошибка', description: 'Можно загружать только изображения', variant: 'destructive' });
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
              applicationId: 0,
              files: [{ fileName: `logo_${file.name}`, fileType: file.type, fileSize: file.size, fileData: base64String }]
            })
          });

          const data = await response.json();

          if (data.files && data.files.length > 0) {
            setFormData({ ...formData, poster_url: data.files[0].fileUrl });
            toast({ title: 'Успешно', description: 'Логотип загружен' });
          } else {
            toast({ title: 'Ошибка', description: 'Не удалось получить URL файла', variant: 'destructive' });
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({ title: 'Ошибка', description: 'Не удалось загрузить логотип', variant: 'destructive' });
        } finally {
          setUploadingPoster(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('FileReader error:', error);
      toast({ title: 'Ошибка', description: 'Не удалось прочитать файл', variant: 'destructive' });
      setUploadingPoster(false);
    }
  };

  const handleFormUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Ошибка', description: 'Можно загружать только файлы Word (.docx, .doc)', variant: 'destructive' });
      return;
    }

    if (!contestId && mode === 'edit') {
      toast({ title: 'Ошибка', description: 'Сначала сохраните конкурс', variant: 'destructive' });
      return;
    }

    setUploadingForm(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const response = await fetch('https://functions.poehali.dev/511414f3-ced6-45f9-a821-bfcc988e50b0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: base64String, file_name: file.name, contest_id: contestId || 0 })
        });
        const data = await response.json();
        if (data.form_url) {
          setFormData({ ...formData, application_form_url: data.form_url });
          toast({ title: 'Успешно', description: 'Бланк заявки загружен' });
        } else {
          toast({ title: 'Ошибка', description: 'Не удалось загрузить бланк', variant: 'destructive' });
        }
        setUploadingForm(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить бланк', variant: 'destructive' });
      setUploadingForm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Создать конкурс' : 'Редактировать конкурс'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <ContestBasicFields formData={formData} setFormData={setFormData} />

          <ContestUploadFields
            formData={formData}
            setFormData={setFormData}
            mode={mode}
            contestId={contestId}
            uploadingPdf={uploadingPdf}
            uploadingPoster={uploadingPoster}
            uploadingForm={uploadingForm}
            onPdfUpload={handlePdfUpload}
            onPosterUpload={handlePosterUpload}
            onFormUpload={handleFormUpload}
          />

          <ContestEventFields formData={formData} setFormData={setFormData} />
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={onSubmit}>
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
