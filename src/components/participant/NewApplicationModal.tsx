import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';

const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';
const APPLICATIONS_URL = 'https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface Participant {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
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
  const [contests, setContests] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [contestId, setContestId] = useState(initialContestId || '');
  const [category, setCategory] = useState('');
  const [performanceTitle, setPerformanceTitle] = useState('');
  const [participationFormat, setParticipationFormat] = useState('');
  const [nomination, setNomination] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);

  const totalSteps = customFields.length > 0 ? 4 : 3;

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
      } catch { setCustomFields([]); }
      finally { setLoadingCustomFields(false); }
    };
    load();
  }, [contestId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(APPLICATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: participant.full_name,
          email: participant.email,
          phone: participant.phone,
          birthDate: participant.birth_date,
          city: participant.city,
          password: '',
          contestId,
          category,
          performanceTitle,
          participationFormat,
          nomination,
          additionalInfo,
          filesCount: files.length,
          customFields: customValues,
        }),
      });
      const result = await res.json();

      if (result.success) {
        if (files.length > 0) {
          const filesData = await Promise.all(files.map(file =>
            new Promise<{ fileName: string; fileType: string; fileSize: number; fileData: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  fileData: (reader.result as string).split(',')[1],
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
          ));
          await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: result.applicationId, files: filesData }),
          });
        }

        // Обновляем данные в localStorage
        const stored = localStorage.getItem('participantData');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.applications = [
            {
              id: result.applicationId,
              contest_title: contests.find(c => String(c.id) === contestId)?.title || '',
              category,
              performance_title: performanceTitle,
              participation_format: participationFormat,
              nomination,
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
      setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div>
            <h2 className="text-xl font-heading font-bold">Новая заявка</h2>
            <p className="text-sm text-muted-foreground">Шаг {step} из 3</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Прогресс */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-secondary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Шаг 1: Конкурс */}
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
              <div>
                <label className="block text-sm font-medium mb-2">Возраст участника(ов) <span className="text-destructive">*</span></label>
                <Input placeholder="Например: 12 лет, или 10-14 лет" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Название номера <span className="text-destructive">*</span></label>
                <Input placeholder="Например: 'Танец с огнём'" value={performanceTitle} onChange={e => setPerformanceTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Формат <span className="text-destructive">*</span></label>
                  <Select value={participationFormat} onValueChange={setParticipationFormat}>
                    <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Очное</SelectItem>
                      <SelectItem value="online">Заочное</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Номинация <span className="text-destructive">*</span></label>
                  <Input placeholder="Например: Вокал" value={nomination} onChange={e => setNomination(e.target.value)} />
                </div>
              </div>

              {loadingCustomFields && (
                <div className="text-center py-2">
                  <Icon name="Loader2" size={20} className="mx-auto animate-spin text-muted-foreground" />
                </div>
              )}

              {customFields.length > 0 && (
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Дополнительные вопросы организатора</p>
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
                      ) : (
                        <Input
                          type={f.field_type === 'file' ? 'text' : f.field_type}
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

          {/* Шаг 2: Файлы */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">ВНИМАНИЕ!</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Обязательно приложите заполненный бланк заявки в формате Word</li>
                  <li>ДЛЯ ОЧНОГО: минусовую фонограмму или фото работ</li>
                  <li>ДЛЯ ЗАОЧНОГО: видео конкурсного номера или фото работ</li>
                </ol>
              </div>
              <FileUpload
                files={files}
                onChange={setFiles}
                accept="image/*,video/*,.pdf,.doc,.docx"
                maxSize={50}
              />
            </div>
          )}

          {/* Шаг 3: Завершение */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium mb-2">Дополнительная информация</label>
                <Textarea
                  placeholder="Любая другая информация..."
                  rows={4}
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="CheckCircle2" size={18} className="text-primary" /> Проверьте данные
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="text-foreground font-medium">Участник:</span> {participant.full_name}</p>
                  <p><span className="text-foreground font-medium">Конкурс:</span> {contests.find(c => String(c.id) === contestId)?.title}</p>
                  <p><span className="text-foreground font-medium">Номинация:</span> {nomination}</p>
                  <p><span className="text-foreground font-medium">Номер:</span> {performanceTitle}</p>
                  <p><span className="text-foreground font-medium">Формат:</span> {participationFormat === 'offline' ? 'Очное' : 'Заочное'}</p>
                  <p><span className="text-foreground font-medium">Файлов:</span> {files.length}</p>
                </div>
              </div>
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
          {step < 3 ? (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (
                !contestId || !category || !performanceTitle || !participationFormat || !nomination ||
                customFields.some(f => f.is_required && !customValues[f.field_name]?.trim())
              )}
            >
              Далее <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={handleSubmit}
              disabled={submitting}
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