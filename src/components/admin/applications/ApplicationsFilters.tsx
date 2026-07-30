import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Application } from './applicationTypes';

interface ApplicationsFiltersProps {
  applications: Application[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  contestFilter: string;
  setContestFilter: (filter: string) => void;
  onToggleContestLock: (contestId: number, locked: boolean) => void;
}

const ApplicationsFilters = ({
  applications,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  contestFilter,
  setContestFilter,
  onToggleContestLock,
}: ApplicationsFiltersProps) => {
  return (
    <Card className="p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Поиск</label>
          <Input
            placeholder="Имя, email или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Статус</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">На рассмотрении</SelectItem>
              <SelectItem value="approved">Одобрены</SelectItem>
              <SelectItem value="rejected">Отклонены</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Конкурс</label>
          <Select value={contestFilter} onValueChange={setContestFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Все конкурсы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все конкурсы</SelectItem>
              {Array.from(new Set(applications.map(app => app.contest_id))).map((contestId) => {
                const app = applications.find(a => a.contest_id === contestId);
                return (
                  <SelectItem key={contestId} value={contestId.toString()}>
                    {app?.contest_title || `Конкурс #${contestId}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {contestFilter !== 'all' && (() => {
        const contestId = Number(contestFilter);
        const appOfContest = applications.find(a => a.contest_id === contestId);
        const isContestLocked = Boolean(appOfContest?.applications_locked);
        return (
          <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Icon name={isContestLocked ? 'Lock' : 'LockOpen'} size={14} />
              Редактирование заявок этого конкурса {isContestLocked ? 'закрыто для участников' : 'открыто для участников'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleContestLock(contestId, !isContestLocked)}
            >
              <Icon name={isContestLocked ? 'LockOpen' : 'Lock'} size={14} className="mr-1.5" />
              {isContestLocked ? 'Открыть редактирование всем' : 'Закрыть редактирование всем'}
            </Button>
          </div>
        );
      })()}
    </Card>
  );
};

export default ApplicationsFilters;
