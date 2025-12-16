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

interface Application {
  id: number;
  participant_id: number;
  contest_id: number;
  status: string;
  submitted_at: string;
}

interface ApplicationsTabProps {
  applications: Application[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  contestFilter: string;
  setContestFilter: (filter: string) => void;
  updateStatus: (applicationId: number, newStatus: string) => void;
}

const ApplicationsTab = ({
  applications,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  contestFilter,
  setContestFilter,
  updateStatus,
}: ApplicationsTabProps) => {
  const statuses: Record<string, string> = {
    pending: 'На рассмотрении',
    approved: 'Одобрена',
    rejected: 'Отклонена',
  };

  const contestsMap: Record<number, string> = {
    1: 'Весенний Бриз',
    2: 'Летние Звёзды',
    3: 'Осенняя Мелодия',
    4: 'Зимняя Сказка',
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Поиск</label>
            <Input
              placeholder="Поиск по ID или участнику..."
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
                {Object.entries(contestsMap).map(([id, title]) => (
                  <SelectItem key={id} value={id}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <Icon
            name="Loader"
            size={48}
            className="mx-auto mb-4 animate-spin text-primary"
          />
          <p className="text-muted-foreground">Загрузка заявок...</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Участник
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Конкурс
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Дата</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications
                  .filter(
                    (app) =>
                      searchQuery === '' ||
                      app.id.toString().includes(searchQuery) ||
                      app.participant_id.toString().includes(searchQuery)
                  )
                  .map((app) => (
                    <tr key={app.id} className="border-t hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm font-medium">#{app.id}</td>
                      <td className="px-6 py-4 text-sm">
                        Участник #{app.participant_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {contestsMap[app.contest_id] || `Конкурс #${app.contest_id}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(app.submitted_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                            app.status
                          )}`}
                        >
                          {statuses[app.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {app.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => updateStatus(app.id, 'approved')}
                            >
                              <Icon name="Check" size={16} />
                            </Button>
                          )}
                          {app.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => updateStatus(app.id, 'rejected')}
                            >
                              <Icon name="X" size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {applications.length === 0 && (
              <div className="text-center py-12">
                <Icon
                  name="Inbox"
                  size={48}
                  className="mx-auto mb-4 text-muted-foreground"
                />
                <p className="text-muted-foreground">Заявок не найдено</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Всего заявок: {applications.length}
      </div>
    </>
  );
};

export default ApplicationsTab;
