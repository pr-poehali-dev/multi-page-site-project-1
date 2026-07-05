import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { ContestFormData } from './ContestModalTypes';

const CONTESTS_API = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface Template {
  id: number;
  name: string;
  fields_count: number;
}

const APPLICATION_TYPES = [
  { value: 'external', label: 'Внешняя ссылка', description: 'Кнопка «Подать заявку» откроет ссылку, указанную ниже (Google Forms, Яндекс Формы и т.д.)' },
  { value: 'internal', label: 'Форма в личном кабинете', description: 'Кнопка «Подать заявку» откроет регистрацию/форму подачи заявки прямо на сайте' },
] as const;

interface ContestUploadFieldsProps {
  formData: ContestFormData;
  setFormData: (data: ContestFormData) => void;
  mode: 'create' | 'edit';
  contestId?: number;
  uploadingPdf: boolean;
  uploadingPoster: boolean;
  uploadingForm: boolean;
  uploadingLogo: boolean;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPosterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContestUploadFields = ({
  formData,
  setFormData,
  mode,
  uploadingPdf,
  uploadingPoster,
  uploadingForm,
  uploadingLogo,
  onPdfUpload,
  onPosterUpload,
  onFormUpload,
  onLogoUpload,
}: ContestUploadFieldsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (formData.application_type !== 'internal') return;
    fetch(`${CONTESTS_API}?action=templates`)
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(() => setTemplates([]));
  }, [formData.application_type]);

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
          <Icon name="MousePointerClick" size={16} />
          Куда ведёт кнопка «Подать заявку»
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {APPLICATION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFormData({ ...formData, application_type: t.value })}
              className={`text-left p-3 rounded-lg border transition-colors ${
                (formData.application_type || 'external') === t.value
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {(formData.application_type || 'external') === 'external' && (
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Icon name="Link" size={16} />
            Ссылка на форму заявки
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://forms.google.com/..."
              value={formData.application_form_url || ''}
              onChange={(e) => setFormData({ ...formData, application_form_url: e.target.value })}
              className="flex-1"
            />
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
          <p className="text-xs text-muted-foreground mt-1">Вставьте ссылку на Google Forms, Яндекс Формы или любую другую форму</p>
        </div>
      )}

      {formData.application_type === 'internal' && (
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Icon name="ListChecks" size={16} />
            Дополнительные вопросы в форме заявки
          </label>
          <Select
            value={formData.form_template_id ? String(formData.form_template_id) : 'none'}
            onValueChange={(v) => setFormData({ ...formData, form_template_id: v === 'none' ? null : Number(v) })}
          >
            <SelectTrigger><SelectValue placeholder="Без доп. вопросов" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без доп. вопросов</SelectItem>
              {templates.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.fields_count} полей)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Шаблоны создаются во вкладке «Конструктор заявок». Выбранный шаблон добавит свои поля в форму подачи заявки на этот конкурс.
          </p>
        </div>
      )}

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
        </div>
        {mode === 'create' && (
          <p className="text-xs text-muted-foreground mt-1">Бланк можно загрузить после создания конкурса</p>
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

      <div>
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Icon name="Star" size={16} />
          Логотип на странице конкурса
        </label>
        <p className="text-xs text-muted-foreground mb-2">Отображается рядом с названием на странице «Подробнее»</p>
        <div className="flex gap-2">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={onLogoUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="flex-1"
          >
            <Icon name="Upload" size={16} className="mr-2" />
            {uploadingLogo ? 'Загрузка...' : formData.logo_url ? 'Заменить логотип страницы' : 'Загрузить логотип страницы'}
          </Button>
          {formData.logo_url && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(formData.logo_url, '_blank')}
            >
              <Icon name="ExternalLink" size={16} />
            </Button>
          )}
        </div>
        {formData.logo_url && (
          <div className="mt-2">
            <img
              src={formData.logo_url}
              alt="Логотип страницы"
              className="w-24 h-24 object-contain border rounded p-2"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ContestUploadFields;