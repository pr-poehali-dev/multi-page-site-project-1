import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import NewApplicationStep1, { ContestOption } from './NewApplicationStep1';
import NewApplicationStep2, { CustomField, NominationOption } from './NewApplicationStep2';
import NewApplicationFooter from './NewApplicationFooter';
import { useNewApplicationSubmit } from './useNewApplicationSubmit';

const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface Participant {
  full_name: string;
  email: string;
  phone: string;
  city: string;
}

interface NewApplicationModalProps {
  participant: Participant;
  onClose: () => void;
  onSuccess: () => void;
  initialContestId?: string;
}

const NewApplicationModal = ({ participant, onClose, onSuccess, initialContestId }: NewApplicationModalProps) => {
  const [step, setStep] = useState(1);
  const [contests, setContests] = useState<ContestOption[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);

  const [selectedCity, setSelectedCity] = useState('');
  const [contestId, setContestId] = useState(initialContestId || '');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customFileValues, setCustomFileValues] = useState<Record<string, File>>({});
  const [customAudioFileValues, setCustomAudioFileValues] = useState<Record<string, File>>({});
  const [noAudioValues, setNoAudioValues] = useState<Record<string, boolean>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [nominationOptions, setNominationOptions] = useState<NominationOption[]>([]);
  const [nominationId, setNominationId] = useState<number | null>(null);
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);

  const totalSteps = 2;

  const { submitting, handleSubmit } = useNewApplicationSubmit({
    participant,
    contests,
    contestId,
    nominationId,
    customValues,
    customFileValues,
    customAudioFileValues,
    onSuccess,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(CONTESTS_URL);
        const data = await res.json();
        const now = new Date();
        const activeContests = (data.contests || []).filter((c: { status: string; end_date?: string }) => {
          if (c.status !== 'active') return false;
          if (!c.end_date) return true;
          return new Date(c.end_date) >= now;
        });
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

  // Загружаем доп. поля формы и номинации, назначенные выбранному конкурсу
  useEffect(() => {
    if (!contestId) { setCustomFields([]); setNominationOptions([]); return; }
    const load = async () => {
      setLoadingCustomFields(true);
      try {
        const res = await fetch(`${CONTESTS_URL}?action=contest_form&contest_id=${contestId}`);
        const data = await res.json();
        setCustomFields(data.fields || []);
        setNominationOptions(data.nominations || []);
        setCustomValues({});
        setCustomFileValues({});
        setCustomAudioFileValues({});
        setNoAudioValues({});
        setNominationId(null);
      } catch { setCustomFields([]); setNominationOptions([]); }
      finally { setLoadingCustomFields(false); }
    };
    load();
  }, [contestId]);

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
            <NewApplicationStep1
              contests={contests}
              loadingContests={loadingContests}
              selectedCity={selectedCity}
              contestId={contestId}
              step1Attempted={step1Attempted}
              cities={cities}
              contestsInCity={contestsInCity}
              onCityChange={handleCityChange}
              onContestIdChange={setContestId}
            />
          )}

          {/* Шаг 2: Дополнительные вопросы организатора */}
          {step === 2 && (
            <NewApplicationStep2
              loadingCustomFields={loadingCustomFields}
              customFields={customFields}
              customValues={customValues}
              customFileValues={customFileValues}
              customAudioFileValues={customAudioFileValues}
              noAudioValues={noAudioValues}
              nominationOptions={nominationOptions}
              nominationId={nominationId}
              step2Attempted={step2Attempted}
              onCustomValuesChange={setCustomValues}
              onCustomFileValuesChange={setCustomFileValues}
              onCustomAudioFileValuesChange={setCustomAudioFileValues}
              onNoAudioValuesChange={setNoAudioValues}
              onNominationIdChange={setNominationId}
            />
          )}
        </div>

        {/* Кнопки */}
        <NewApplicationFooter
          step={step}
          totalSteps={totalSteps}
          submitting={submitting}
          onBack={() => setStep(s => s - 1)}
          onNext={() => {
            if (!selectedCity || !contestId) {
              setStep1Attempted(true);
              return;
            }
            setStep(s => s + 1);
          }}
          onSubmit={() => {
            if (customFields.some(f => f.is_required && !(f.field_type === 'audio' && noAudioValues[f.field_name]) && !customValues[f.field_name]?.trim())) {
              setStep2Attempted(true);
              return;
            }
            handleSubmit();
          }}
        />
      </div>
    </div>
  );
};

export default NewApplicationModal;
