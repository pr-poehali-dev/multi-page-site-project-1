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

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'contests'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'upcoming'
  });

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

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else {
      loadContests();
    }
  }, [statusFilter, contestFilter, activeTab]);

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

  const loadContests = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка создания конкурса:', error);
    }
  };

  const handleEditContest = async () => {
    if (!selectedContest) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedContest.id, ...formData })
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setSelectedContest(null);
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка обновления конкурса:', error);
    }
  };

  const handleDeleteContest = async (contestId: number) => {
    if (!confirm('Удалить конкурс?')) return;
    
    try {
      const response = await fetch(`https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3?id=${contestId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка удаления конкурса:', error);
    }
  };

  const openEditModal = (contest: Contest) => {
    setSelectedContest(contest);
    setFormData({
      title: contest.title,
      description: contest.description,
      start_date: contest.start_date.split('T')[0],
      end_date: contest.end_date.split('T')[0],
      status: contest.status
    });
    setShowEditModal(true);
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
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-heading font-bold">Список конкурсов</h2>
                  <p className="text-muted-foreground text-sm">Всего конкурсов: {contests.length}</p>
                </div>
                <Button 
                  className="bg-secondary hover:bg-secondary/90"
                  onClick={() => {
                    setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
                    setShowCreateModal(true);
                  }}
                >
                  <Icon name="Plus" size={18} className="mr-2" />
                  Создать конкурс
                </Button>
              </div>

              {loading ? (
                <Card className="p-12 text-center">
                  <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Загрузка конкурсов...</p>
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
                        {contests.map((contest) => (
                          <tr key={contest.id} className="border-t hover:bg-muted/30">
                            <td className="px-6 py-4 text-sm font-medium">#{contest.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{contest.title}</div>
                              <div className="text-sm text-muted-foreground">{contest.description}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {new Date(contest.start_date).toLocaleDateString('ru-RU')} - {new Date(contest.end_date).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                contest.status === 'active' ? 'bg-green-100 text-green-800' :
                                contest.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {contest.status === 'active' ? 'Активный' :
                                 contest.status === 'upcoming' ? 'Предстоящий' : 'Завершён'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(contest)}
                                >
                                  <Icon name="Edit" size={16} className="mr-1" />
                                  Изменить
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteContest(contest.id)}
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

              {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-2xl mx-4 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-heading font-bold">Создать конкурс</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                        <Icon name="X" size={20} />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Название</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Введите название конкурса"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Описание</label>
                        <textarea
                          className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Введите описание конкурса"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Дата начала</label>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Дата окончания</label>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Статус</label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Предстоящий</SelectItem>
                            <SelectItem value="active">Активный</SelectItem>
                            <SelectItem value="completed">Завершён</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button
                        className="flex-1 bg-secondary hover:bg-secondary/90"
                        onClick={handleCreateContest}
                      >
                        Создать
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCreateModal(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {showEditModal && selectedContest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-2xl mx-4 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-heading font-bold">Редактировать конкурс</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                        <Icon name="X" size={20} />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Название</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Введите название конкурса"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Описание</label>
                        <textarea
                          className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Введите описание конкурса"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Дата начала</label>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Дата окончания</label>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Статус</label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Предстоящий</SelectItem>
                            <SelectItem value="active">Активный</SelectItem>
                            <SelectItem value="completed">Завершён</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button
                        className="flex-1 bg-secondary hover:bg-secondary/90"
                        onClick={handleEditContest}
                      >
                        Сохранить
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowEditModal(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;