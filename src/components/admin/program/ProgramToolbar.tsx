import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Contest, ProgramRow } from './programTypes';

interface ProgramToolbarProps {
  contests: Contest[];
  selectedContestId: string;
  onSelectedContestIdChange: (id: string) => void;
  rows: ProgramRow[];
  showAddForm: boolean;
  onShowAddForm: () => void;
  onExportExcel: () => void;
  onShowPrintModal: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableFormats: string[];
  formatFilter: string;
  onFormatFilterChange: (value: string) => void;
}

const ProgramToolbar = ({
  contests,
  selectedContestId,
  onSelectedContestIdChange,
  rows,
  showAddForm,
  onShowAddForm,
  onExportExcel,
  onShowPrintModal,
  onImportExcel,
  availableFormats,
  formatFilter,
  onFormatFilterChange,
}: ProgramToolbarProps) => {
  const now = new Date();
  const activeContests = contests.filter(c => !c.end_date || new Date(c.end_date) >= now);
  const pastContests = contests.filter(c => c.end_date && new Date(c.end_date) < now);
  const archiveYears = Array.from(
    new Set(pastContests.map(c => new Date(c.end_date!).getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="w-96">
          <Select value={selectedContestId} onValueChange={onSelectedContestIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите конкурс" />
            </SelectTrigger>
            <SelectContent>
              {activeContests.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Текущие</div>
                  {activeContests.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-medium">{c.title}</span>
                      {(c.event_date || c.location) && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {[c.event_date, c.location].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </>
              )}
              {archiveYears.map(year => (
                <>
                  <div key={`y-${year}`} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">Архив {year}</div>
                  {pastContests
                    .filter(c => new Date(c.end_date!).getFullYear() === year)
                    .map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-medium text-muted-foreground">{c.title}</span>
                        {(c.event_date || c.location) && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {[c.event_date, c.location].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedContestId && (() => {
          const c = contests.find(c => String(c.id) === selectedContestId);
          return (c?.location || c?.event_date) ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {c?.location && <span className="flex items-center gap-1"><Icon name="MapPin" size={14} />{c.location}</span>}
              {c?.event_date && <span className="flex items-center gap-1"><Icon name="Calendar" size={14} />{c.event_date}</span>}
            </div>
          ) : null;
        })()}
        {selectedContestId && (
          <>
            <Button onClick={onShowAddForm} disabled={showAddForm}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить строку
            </Button>
            <Button variant="outline" onClick={onExportExcel} disabled={rows.length === 0}>
              <Icon name="Download" className="mr-2 h-4 w-4" />
              Экспорт Excel
            </Button>
            <Button variant="outline" onClick={onShowPrintModal} disabled={rows.length === 0}>
              <Icon name="Printer" className="mr-2 h-4 w-4" />
              Напечатать дипломы
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  <Icon name="Upload" className="mr-2 h-4 w-4" />
                  Импорт Excel
                </span>
              </Button>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportExcel} />
            </label>
          </>
        )}
      </div>

      {selectedContestId && availableFormats.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Формат участия:</span>
          <div className="w-56">
            <Select value={formatFilter} onValueChange={onFormatFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все ({rows.length})</SelectItem>
                {availableFormats.map(fmt => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt} ({rows.filter(r => r.participation_format === fmt).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgramToolbar;
