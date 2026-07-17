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

const buildContestFolderName = (title: string, location?: string, eventDate?: string) => {
  const parts = [title, location, eventDate].filter(Boolean);
  return parts.join(', ');
};

const NewApplicationModal = ({ participant, onClose, onSuccess, initialContestId }: NewApplicationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [contests, setContests] = useState<Array<{ id: number; title: string; location?: string; event_date?: string; status: string }>>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [contestId, setContestId] = useState(initialContestId || '');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customFileValues, setCustomFileValues] = useState<Record<string, File>>({});
  const [customAudioFileValues, setCustomAudioFileValues] = useState<Record<string, File>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);

  const CUSTOM_FILE_MAX_SIZE = 15 * 1024 * 1024;
  const CUSTOM_AUDIO_MAX_SIZE = 50 * 1024 * 1024;
  const totalSteps = 2;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(CONTESTS_URL);
        const data = await res.json();
        const activeContests = (data.contests || []).filter((c: { status: string }) => c.status === 'active');
        setContests(activeContests);

        if (initialContestId) {
          const preselected = activeContests.find((c: { id: number }) => String(c.id) === initialContestId);
          if (preselected?.location) setSelectedCity(preselected.location);
        }
      } catch { setContests([]); }
      finally { setLoadingContests(false); }
    };
    load();
  }, [initialContestId]);

  const cities = Array.from(new Set(contests.map(c => c.location).filter((l): l is string => Boolean(l))));
  const contestsInCity = selectedCity ? contests.filter(c => c.location === selectedCity) : [];

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setContestId('');
  };

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
        setCustomAudioFileValues({});
      } catch { setCustomFields([]); }
      finally { setLoadingCustomFields(false); }
    };
    load();
  }, [contestId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedContest = contests.find(c => String(c.id) === contestId);
      const contestTitle = buildContestFolderName(selectedContest?.title || '', selectedContest?.location, selectedContest?.event_date);

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
              body: JSON.stringify({ target: 'yandex', contestTitle, fileName: file.name }),
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

        {/* Предупреждение о точности заполнения */}
        <div className="mx-6 mt-4 shrink-0 p-4 rounded-lg border-2 border-red-500 bg-red-50 flex gap-3">
          <Icon name="AlertTriangle" size={22} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-700 leading-snug">
            Просим предельно точно и внимательно заполнять поля заявки! Данные заносятся во все документы автоматически! Стоимость исправления 150р.
          </p>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Шаг 1: Выбор конкурса */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium mb-2">Город <span className="text-destructive">*</span></label>
                <Select value={selectedCity} onValueChange={handleCityChange} disabled={loadingContests}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingContests ? 'Загрузка...' : cities.length === 0 ? 'Нет активных конкурсов' : 'Выберите город'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Конкурс <span className="text-destructive">*</span></label>
                <Select value={contestId} onValueChange={setContestId} disabled={!selectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCity ? 'Сначала выберите город' : contestsInCity.length === 0 ? 'Нет конкурсов в этом городе' : 'Выберите конкурс'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contestsInCity.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
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
                      ) : f.field_type === 'audio' ? (
                        <div>
                          <input
                            type="file"
                            accept="audio/*"
                            id={`custom-audio-${f.id}`}
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
                          <label htmlFor={`custom-audio-${f.id}`}>
                            <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                              <span>
                                <Icon name="Music" size={16} className="mr-2" />
                                {customAudioFileValues[f.field_name] ? customAudioFileValues[f.field_name].name : 'Выбрать фонограмму'}
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