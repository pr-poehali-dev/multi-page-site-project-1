import { useState, useMemo, useCallback } from 'react';
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
  contest_title: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  city: string;
  category: string;
  performance_title?: string;
  participation_format?: string;
  nomination?: string;
  experience: string;
  achievements: string;
  additional_info: string;
  status: string;
  submitted_at: string;
  files?: Array<{
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
  }>;
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
  deleteApplication: (applicationId: number) => void;
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
  deleteApplication,
}: ApplicationsTabProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statuses: Record<string, string> = {
    pending: 'На рассмотрении',
    approved: 'Одобрена',
    rejected: 'Отклонена',
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

  const calculateAge = useCallback((birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter(
      (app) =>
        searchQuery === '' ||
        app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toString().includes(searchQuery)
    );
  }, [applications, searchQuery]);

  return (
    <>
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
      ) : filteredApplications.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon
            name="Inbox"
            size={48}
            className="mx-auto mb-4 text-muted-foreground"
          />
          <p className="text-muted-foreground">Заявок не найдено</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{app.full_name}</h3>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                          app.status
                        )}`}
                      >
                        {statuses[app.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="Mail" size={16} />
                        <span>{app.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={16} />
                        <span>{app.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={16} />
                        <span>{app.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={16} />
                        <span>{calculateAge(app.birth_date)} лет</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {app.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => updateStatus(app.id, 'approved')}
                      >
                        <Icon name="Check" size={16} className="mr-1" />
                        Одобрить
                      </Button>
                    )}
                    {app.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => updateStatus(app.id, 'rejected')}
                      >
                        <Icon name="X" size={16} className="mr-1" />
                        Отклонить
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (confirm('Удалить заявку? Это действие нельзя отменить.')) {
                          deleteApplication(app.id);
                        }
                      }}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      <Icon 
                        name={expandedId === app.id ? "ChevronUp" : "ChevronDown"} 
                        size={16} 
                      />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Конкурс</p>
                    <p className="text-sm font-medium">{app.contest_title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Категория</p>
                    <p className="text-sm font-medium">{app.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Название номера</p>
                    <p className="text-sm font-medium">{app.performance_title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Номинация</p>
                    <p className="text-sm font-medium">{app.nomination || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Формат</p>
                    <p className="text-sm font-medium">{app.participation_format === 'offline' ? 'Очное' : app.participation_format === 'online' ? 'Заочное' : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Опыт</p>
                    <p className="text-sm font-medium">{app.experience || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Дата подачи</p>
                    <p className="text-sm font-medium">
                      {new Date(app.submitted_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                {expandedId === app.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                    {app.achievements && (
                      <div>
                        <p className="text-sm font-medium mb-1">Достижения:</p>
                        <p className="text-sm text-muted-foreground">{app.achievements}</p>
                      </div>
                    )}
                    {app.additional_info && (
                      <div>
                        <p className="text-sm font-medium mb-1">Дополнительная информация:</p>
                        <p className="text-sm text-muted-foreground">{app.additional_info}</p>
                      </div>
                    )}
                    {app.files && app.files.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Прикреплённые файлы ({app.files.length}):</p>
                        <div className="space-y-2">
                          {app.files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                              <Icon name="File" size={16} className="text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Button size="sm" variant="ghost" asChild>
                                <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                                  <Icon name="Download" size={14} />
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="Hash" size={14} />
                      <span>ID заявки: {app.id}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Показано заявок: {filteredApplications.length} из {applications.length}
      </div>
    </>
  );
};

export default ApplicationsTab;