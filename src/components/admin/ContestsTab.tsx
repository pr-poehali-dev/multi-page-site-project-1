import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  location?: string;
}

interface ContestsTabProps {
  contests: Contest[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (contest: Contest) => void;
  onDeleteClick: (contestId: number) => void;
}

const ContestsTab = ({
  contests,
  loading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: ContestsTabProps) => {
  const [mainTab, setMainTab] = useState<'active' | 'archive'>('active');
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const now = new Date();
  const q = search.toLowerCase().trim();

  const activeContests = contests.filter(
    c => new Date(c.end_date) >= now && (!q || c.title.toLowerCase().includes(q))
  );
  const pastContests = contests.filter(
    c => new Date(c.end_date) < now && (!q || c.title.toLowerCase().includes(q))
  );

  const archiveYears = Array.from(
    new Set(pastContests.map(c => new Date(c.end_date).getFullYear()))
  ).sort((a, b) => b - a);

  const selectedYear = archiveYear ?? archiveYears[0] ?? null;

  const archiveContests = selectedYear
    ? pastContests.filter(c => new Date(c.end_date).getFullYear() === selectedYear)
    : [];

  const displayContests = mainTab === 'active' ? activeContests : archiveContests;

  const tabClass = (active: boolean) =>
    `px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-primary text-primary-foreground shadow'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`;

  const yearTabClass = (active: boolean) =>
    `px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-secondary text-secondary-foreground shadow'
        : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`;

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Список конкурсов</h2>
          <p className="text-muted-foreground text-sm">
            Всего конкурсов: {contests.length}
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary/90"
          onClick={onCreateClick}
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Создать конкурс
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex gap-2">
          <button className={tabClass(mainTab === 'active')} onClick={() => setMainTab('active')}>
            Текущие
            {activeContests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-primary-foreground/20">{activeContests.length}</span>
            )}
          </button>
          <button className={tabClass(mainTab === 'archive')} onClick={() => setMainTab('archive')}>
            Архив
            {pastContests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-primary-foreground/20">{pastContests.length}</span>
            )}
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {mainTab === 'archive' && archiveYears.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {archiveYears.map(year => (
            <button
              key={year}
              className={yearTabClass(selectedYear === year)}
              onClick={() => setArchiveYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Card className="p-12 text-center">
          <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка конкурсов...</p>
        </Card>
      ) : displayContests.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Archive" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">
            {mainTab === 'archive' ? 'Архив пуст' : 'Нет текущих конкурсов'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Название</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Даты</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayContests.map((contest) => (
                  <tr key={contest.id} className="border-t hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">#{contest.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{contest.title}</div>
                      {contest.location && (
                        <div className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                          <Icon name="MapPin" size={12} />
                          {contest.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(contest.start_date).toLocaleDateString('ru-RU')} —{' '}
                      {new Date(contest.end_date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          contest.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : contest.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contest.status === 'active'
                          ? 'Активный'
                          : contest.status === 'upcoming'
                          ? 'Предстоящий'
                          : 'Завершён'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEditClick(contest)}>
                          <Icon name="Edit" size={16} className="mr-1" />
                          Изменить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteClick(contest.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Icon name="Trash2" size={16} className="mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};

export default ContestsTab;