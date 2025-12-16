import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'contests'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');

  const statuses: Record<string, string> = {
    pending: 'На рассмотрении',
    approved: 'Одобрена',
    rejected: 'Отклонена',
  };

  const contests: Record<number, string> = {
    1: 'Весенний Бриз',
    2: 'Летние Звёзды',
    3: 'Осенняя Мелодия',
    4: 'Зимняя Сказка',
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, contestFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (contestFilter !== 'all') params.append('contest_id', contestFilter);

      const response = await fetch(
        `https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?${params}`
      );
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: applicationId,
            status: newStatus,
          }),
        }
      );

      if (response.ok) {
        loadApplications();
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
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
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold mb-2">
              Админ-панель жюри
            </h1>
            <p className="text-muted-foreground">
              Управление заявками и конкурсами
            </p>
            
            <div className="flex gap-4 mt-6">
              <Button
                variant={activeTab === 'applications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('applications')}
                className={activeTab === 'applications' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="FileText" size={18} className="mr-2" />
                Заявки
              </Button>
              <Button
                variant={activeTab === 'contests' ? 'default' : 'outline'}
                onClick={() => setActiveTab('contests')}
                className={activeTab === 'contests' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Trophy" size={18} className="mr-2" />
                Конкурсы
              </Button>
            </div>
          </div>

          {activeTab === 'applications' && (
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
                    {Object.entries(contests).map(([id, title]) => (
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
                            {contests[app.contest_id] || `Конкурс #${app.contest_id}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(app.submitted_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                app.status
                              )}`}
                            >
                              {statuses[app.status] || app.status}
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
          )}

          {activeTab === 'contests' && (
            <div className="text-center py-12">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 text-primary" />
              <p className="text-xl font-semibold mb-2">Управление конкурсами</p>
              <p className="text-muted-foreground mb-6">
                Здесь будет интерфейс для создания и редактирования конкурсов
              </p>
              <Button className="bg-secondary hover:bg-secondary/90">
                <Icon name="Plus" size={18} className="mr-2" />
                Создать конкурс
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;