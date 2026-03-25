import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ContestFormData } from './ContestModalTypes';

interface ContestUploadFieldsProps {
  formData: ContestFormData;
  setFormData: (data: ContestFormData) => void;
  mode: 'create' | 'edit';
  contestId?: number;
  uploadingPdf: boolean;
  uploadingPoster: boolean;
  uploadingForm: boolean;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPosterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContestUploadFields = ({
  formData,
  mode,
  uploadingPdf,
  uploadingPoster,
  uploadingForm,
  onPdfUpload,
  onPosterUpload,
  onFormUpload,
}: ContestUploadFieldsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
            onChange={onPdfUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf || mode === 'create'}
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
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Icon name="FileDown" size={16} />
          Бланк заявки (Word .docx)
        </label>
        <div className="flex gap-2">
          <input
            ref={formFileInputRef}
            type="file"
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={onFormUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => formFileInputRef.current?.click()}
            disabled={uploadingForm || mode === 'create'}
            className="flex-1"
          >
            <Icon name="Upload" size={16} className="mr-2" />
            {uploadingForm ? 'Загрузка...' : formData.application_form_url ? 'Заменить бланк' : 'Загрузить бланк (.docx)'}
          </Button>
          {formData.application_form_url && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(formData.application_form_url, '_blank')}
            >
              <Icon name="ExternalLink" size={16} />
            </Button>
          )}
        </div>
        {mode === 'create' && (
          <p className="text-xs text-muted-foreground mt-1">Бланк можно загрузить после создания конкурса</p>
        )}
        {formData.application_form_url && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Icon name="CheckCircle" size={12} />
            Бланк загружен
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Icon name="Image" size={16} />
          Логотип конкурса
        </label>
        <div className="flex gap-2">
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            onChange={onPosterUpload}
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
            {uploadingPoster ? 'Загрузка...' : formData.poster_url ? 'Заменить логотип' : 'Загрузить логотип'}
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
              alt="Логотип"
              className="w-24 h-24 object-contain border rounded p-2"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ContestUploadFields;
