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

interface Participant {
  full_name: string;
  email: string;
  phone: string;
  city: string;
}

interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  options: string;
  is_required: boolean;
}

interface NewApplicationModalProps {
  participant: Participant;
  onClose: () => void;
  onSuccess: () => void;
  initialContestId?: string;
}

const NewApplicationModal = ({ participant, onClose, onSuccess, initialContestId }: NewApplicationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [contests, setContests] = useState<Array<{ id: number; title: string; location?: string; event_date?: string }>>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [contestId, setContestId] = useState(initialContestId || '');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customFileValues, setCustomFileValues] = useState<Record<string, File>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);

  const CUSTOM_FILE_MAX_SIZE = 15 * 1024 * 1024;
  const totalSteps = 2;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(CONTESTS_URL);
        const data = await res.json();
        setContests((data.contests || []).filter((c: { status: string }) => c.status === 'active'));
      } catch { setContests([]); }
      finally { setLoadingContests(false); }
    };
    load();
  }, []);

  // Загружаем доп. поля формы, назначенные выбранному конкурсу
  useEffect(() => {
    if (!contestId) { setCustomFields([]); return; }
    const load = async () => {
      setLoadingCustomFields(true);
      try {
        const res = await fetch(`${CONTESTS_URL}?action=contest_form&contest_id=${contestId}`);
        const data = await res.json();
        setCustomFields(data.fields || []);
        setCustomValues({});
        setCustomFileValues({});
      } catch { setCustomFields([]); }
      finally { setLoadingCustomFields(false); }
    };
    load();
  }, [contestId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Загружаем файлы из кастомных полей и получаем их URL перед отправкой заявки
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
        finalCustomValues = { ...customValues, ...uploadedUrls };
      }

      const res = await fetch(APPLICATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: participant.full_name,
          email: participant.email,
          phone: participant.phone,
          city: participant.city,
          password: '',
          contestId,
          customFields: finalCustomValues,
        }),
      });
      const result = await res.json();

      if (result.success) {
        // Обновляем данные в localStorage
        const stored = localStorage.getItem('participantData');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.applications = [
            {
              id: result.applicationId,
              contest_title: contests.find(c => String(c.id) === contestId)?.title || '',
              category: '',
              performance_title: '',
              participation_format: '',
              nomination: '',
              status: 'pending',
              submitted_at: new Date().toISOString(),
              start_date: '',
              end_date: '',
              contest_status: 'active',
            },
            ...parsed.applications,
          ];
          localStorage.setItem('participantData', JSON.stringify(parsed));
        }

        toast({ title: 'Заявка отправлена!', description: 'Мы рассмотрим её в течение 3 дней.' });
        onSuccess();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отправить заявку', variant: 'destructive' });
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

        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div>
            <h2 className="text-xl font-heading font-bold">Новая заявка</h2>
            <p className="text-sm text-muted-foreground">Шаг {step} из {totalSteps}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Прогресс */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-secondary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Шаг 1: Выбор конкурса */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium mb-2">Конкурс <span className="text-destructive">*</span></label>
                <Select value={contestId} onValueChange={setContestId} disabled={loadingContests}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingContests ? 'Загрузка...' : contests.length === 0 ? 'Нет активных конкурсов' : 'Выберите конкурс'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contests.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {contestId && (() => {
                const selected = contests.find(c => String(c.id) === contestId);
                if (!selected || (!selected.location && !selected.event_date)) return null;
                return (
                  <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                    {selected.location && (
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={16} className="text-muted-foreground" />
                        <span>{selected.location}</span>
                      </div>
                    )}
                    {selected.event_date && (
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={16} className="text-muted-foreground" />
                        <span>{selected.event_date}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Шаг 2: Дополнительные вопросы организатора */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
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
                            id={`custom-file-${f.id}`}
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
                          <label htmlFor={`custom-file-${f.id}`}>
                            <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                              <span>
                                <Icon name="Upload" size={16} className="mr-2" />
                                {customFileValues[f.field_name] ? customFileValues[f.field_name].name : 'Выбрать файл'}
                              </span>
                            </Button>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Максимум 15 МБ</p>
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
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 p-6 border-t shrink-0">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={() => setStep(s => s + 1)}
              disabled={!contestId}
            >
              Далее <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={handleSubmit}
              disabled={submitting || customFields.some(f => f.is_required && !customValues[f.field_name]?.trim())}
            >
              {submitting ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</> : <><Icon name="Send" size={16} className="mr-2" />Отправить заявку</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewApplicationModal;