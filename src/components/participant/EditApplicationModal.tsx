import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';
const APPLICATIONS_URL = 'https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  options: string;
  is_required: boolean;
}

interface ApplicationToEdit {
  id: number;
  contest_id: number;
  contest_title: string;
  custom_fields?: Record<string, string>;
}

interface EditApplicationModalProps {
  application: ApplicationToEdit;
  onClose: () => void;
  onSuccess: () => void;
}

const EditApplicationModal = ({ application, onClose, onSuccess }: EditApplicationModalProps) => {
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>(application.custom_fields || {});
  const [customFileValues, setCustomFileValues] = useState<Record<string, File>>({});
  const [customAudioFileValues, setCustomAudioFileValues] = useState<Record<string, File>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const CUSTOM_FILE_MAX_SIZE = 15 * 1024 * 1024;
  const CUSTOM_AUDIO_MAX_SIZE = 50 * 1024 * 1024;

  useEffect(() => {
    const load = async () => {
      setLoadingCustomFields(true);
      try {
        const res = await fetch(`${CONTESTS_URL}?action=contest_form&contest_id=${application.contest_id}`);
        const data = await res.json();
        setCustomFields(data.fields || []);
      } catch {
        setCustomFields([]);
      } finally {
        setLoadingCustomFields(false);
      }
    };
    load();
  }, [application.contest_id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let finalCustomValues = customValues;
      const fileEntries = Object.entries(customFileValues);
      if (fileEntries.length > 0) {
        const uploadedUrls: Record<string, string> = {};
        for (const [fieldName, file] of fileEntries) {
          const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const uploadRes = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: [{ fileName: file.name, fileType: file.type, fileSize: file.size, fileData }],
            }),
          });
          const uploadData = await uploadRes.json();
          if (uploadData.files?.[0]?.fileUrl) {
            uploadedUrls[fieldName] = uploadData.files[0].fileUrl;
          }
        }
        finalCustomValues = { ...finalCustomValues, ...uploadedUrls };
      }

      // Загружаем фонограммы напрямую на Яндекс.Диск (минуя наш сервер, без ограничения по размеру)
      const audioEntries = Object.entries(customAudioFileValues);
      if (audioEntries.length > 0) {
        const uploadedAudioUrls: Record<string, string> = {};
        for (const [fieldName, file] of audioEntries) {
          try {
            const urlRes = await fetch(UPLOAD_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'yandex', contestTitle: application.contest_title, fileName: file.name }),
            });
            const urlData = await urlRes.json();
            if (!urlData.uploadUrl) {
              throw new Error(urlData.error || 'Не удалось получить ссылку для загрузки');
            }

            const putRes = await fetch(urlData.uploadUrl, { method: 'PUT', body: file });
            if (!putRes.ok) {
              throw new Error('Не удалось загрузить файл на Яндекс.Диск');
            }

            const finalizeRes = await fetch(UPLOAD_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'yandex', step: 'finalize', path: urlData.path }),
            });
            const finalizeData = await finalizeRes.json();
            if (finalizeData.fileUrl) {
              uploadedAudioUrls[fieldName] = finalizeData.fileUrl;
            } else {
              throw new Error(finalizeData.error || 'Не удалось опубликовать файл');
            }
          } catch (err) {
            toast({ title: 'Ошибка загрузки фонограммы', description: err instanceof Error ? err.message : file.name, variant: 'destructive' });
          }
        }
        finalCustomValues = { ...finalCustomValues, ...uploadedAudioUrls };
      }

      const res = await fetch(APPLICATIONS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          customFields: finalCustomValues,
        }),
      });
      const result = await res.json();

      if (result.success) {
        const stored = localStorage.getItem('participantData');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.applications = (parsed.applications || []).map((a: { id: number; custom_fields?: Record<string, string> }) =>
            a.id === application.id ? { ...a, custom_fields: finalCustomValues } : a
          );
          localStorage.setItem('participantData', JSON.stringify(parsed));
        }
        toast({ title: 'Заявка обновлена' });
        onSuccess();
      } else {
        toast({ title: 'Ошибка', description: result.error || 'Не удалось сохранить заявку', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div>
            <h2 className="text-xl font-heading font-bold">Редактирование заявки</h2>
            <p className="text-sm text-muted-foreground">{application.contest_title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingCustomFields && (
            <div className="text-center py-4">
              <Icon name="Loader2" size={20} className="mx-auto animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingCustomFields && customFields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 opacity-40" />
              <p>Для этого конкурса нет дополнительных вопросов</p>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="space-y-4">
              {customFields.map(f => (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-2">
                    {f.field_label} {f.is_required && <span className="text-destructive">*</span>}
                  </label>
                  {f.field_type === 'textarea' ? (
                    <Textarea
                      value={customValues[f.field_name] || ''}
                      onChange={e => setCustomValues(v => ({ ...v, [f.field_name]: e.target.value }))}
                    />
                  ) : f.field_type === 'select' ? (
                    <Select
                      value={customValues[f.field_name] || ''}
                      onValueChange={val => setCustomValues(v => ({ ...v, [f.field_name]: val }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>
                        {f.options.split(',').map(o => o.trim()).filter(Boolean).map(o => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.field_type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customValues[f.field_name] === 'true'}
                        onChange={e => setCustomValues(v => ({ ...v, [f.field_name]: e.target.checked ? 'true' : 'false' }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-muted-foreground">Да</span>
                    </div>
                  ) : f.field_type === 'file' ? (
                    <div>
                      <input
                        type="file"
                        id={`edit-custom-file-${f.id}`}
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > CUSTOM_FILE_MAX_SIZE) {
                            toast({ title: 'Файл слишком большой', description: `${file.name} превышает 15 МБ`, variant: 'destructive' });
                            e.target.value = '';
                            return;
                          }
                          setCustomFileValues(v => ({ ...v, [f.field_name]: file }));
                          setCustomValues(v => ({ ...v, [f.field_name]: file.name }));
                        }}
                      />
                      <label htmlFor={`edit-custom-file-${f.id}`}>
                        <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                          <span>
                            <Icon name="Upload" size={16} className="mr-2" />
                            {customFileValues[f.field_name]?.name || customValues[f.field_name] || 'Выбрать файл'}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Максимум 15 МБ</p>
                    </div>
                  ) : f.field_type === 'audio' ? (
                    <div>
                      <input
                        type="file"
                        accept="audio/*"
                        id={`edit-custom-audio-${f.id}`}
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > CUSTOM_AUDIO_MAX_SIZE) {
                            toast({ title: 'Файл слишком большой', description: `${file.name} превышает 50 МБ`, variant: 'destructive' });
                            e.target.value = '';
                            return;
                          }
                          setCustomAudioFileValues(v => ({ ...v, [f.field_name]: file }));
                          setCustomValues(v => ({ ...v, [f.field_name]: file.name }));
                        }}
                      />
                      <label htmlFor={`edit-custom-audio-${f.id}`}>
                        <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                          <span>
                            <Icon name="Music" size={16} className="mr-2" />
                            {customAudioFileValues[f.field_name]?.name || customValues[f.field_name] || 'Выбрать фонограмму'}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Загрузится на Яндекс.Диск, максимум 50 МБ</p>
                    </div>
                  ) : (
                    <Input
                      type={f.field_type}
                      value={customValues[f.field_name] || ''}
                      onChange={e => setCustomValues(v => ({ ...v, [f.field_name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={handleSubmit}
            disabled={submitting || loadingCustomFields || customFields.some(f => f.is_required && !customValues[f.field_name]?.trim())}
          >
            {submitting ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Сохранение...</> : <><Icon name="Save" size={16} className="mr-2" />Сохранить изменения</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditApplicationModal;