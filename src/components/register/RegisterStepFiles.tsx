import Icon from '@/components/ui/icon';
import FileUpload from '@/components/FileUpload';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  contestId: string;
  category: string;
  performanceTitle: string;
  participationFormat: string;
  nomination: string;
  experience: string;
  files: File[];
  achievements: string;
  additionalInfo: string;
};

interface RegisterStepFilesProps {
  formData: FormData;
  handleFilesChange: (files: File[]) => void;
}

const RegisterStepFiles = ({ formData, handleFilesChange }: RegisterStepFilesProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-heading font-bold mb-6">Загрузка работ</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Портфолио / Видео выступлений <span className="text-destructive">*</span>
        </label>
        <p className="text-sm text-muted-foreground mb-4">
          Загрузите фото, видео или документы (макс. 50 МБ каждый)
        </p>
        <FileUpload
          files={formData.files}
          onChange={handleFilesChange}
          accept="image/*,video/*,.pdf,.doc,.docx"
          maxSize={50}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Рекомендации по загрузке:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Видео: формат MP4, длительность до 10 минут</li>
              <li>Фото: высокое разрешение, формат JPG или PNG</li>
              <li>Документы: резюме, дипломы, сертификаты в PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStepFiles;
