import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

export interface ContestOption {
  id: number;
  title: string;
  location?: string;
  event_date?: string;
  status: string;
  end_date?: string;
}

interface NewApplicationStep1Props {
  contests: ContestOption[];
  loadingContests: boolean;
  selectedCity: string;
  contestId: string;
  step1Attempted: boolean;
  cities: string[];
  contestsInCity: ContestOption[];
  onCityChange: (city: string) => void;
  onContestIdChange: (id: string) => void;
}

const NewApplicationStep1 = ({
  contests,
  loadingContests,
  selectedCity,
  contestId,
  step1Attempted,
  cities,
  contestsInCity,
  onCityChange,
  onContestIdChange,
}: NewApplicationStep1Props) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="block text-sm font-medium mb-2">Город <span className="text-destructive">*</span></label>
        <Select value={selectedCity} onValueChange={onCityChange} disabled={loadingContests}>
          <SelectTrigger className={step1Attempted && !selectedCity ? 'border-destructive ring-1 ring-destructive' : ''}>
            <SelectValue placeholder={loadingContests ? 'Загрузка...' : cities.length === 0 ? 'Нет активных конкурсов' : 'Выберите город'} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>
        {step1Attempted && !selectedCity && (
          <p className="text-xs text-destructive mt-1">Выберите город</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Конкурс <span className="text-destructive">*</span></label>
        <Select value={contestId} onValueChange={onContestIdChange} disabled={!selectedCity}>
          <SelectTrigger className={step1Attempted && !contestId ? 'border-destructive ring-1 ring-destructive' : ''}>
            <SelectValue placeholder={!selectedCity ? 'Сначала выберите город' : contestsInCity.length === 0 ? 'Нет конкурсов в этом городе' : 'Выберите конкурс'} />
          </SelectTrigger>
          <SelectContent>
            {contestsInCity.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {step1Attempted && !contestId && (
          <p className="text-xs text-destructive mt-1">Выберите конкурс</p>
        )}
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
  );
};

export default NewApplicationStep1;
