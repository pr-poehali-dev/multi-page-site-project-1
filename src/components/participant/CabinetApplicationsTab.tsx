import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface Application {
  id: number;
  contest_id: number;
  contest_title: string;
  category: string;
  performance_title: string | null;
  participation_format: string | null;
  nomination: string | null;
  status: string;
  submitted_at: string;
  start_date: string;
  end_date: string;
  contest_status: string;
  custom_fields?: Record<string, string>;
  editing_locked?: boolean;
  applications_locked?: boolean;
  is_editable?: boolean;
  location?: string;
  event_date?: string;
  admin_comment?: string;
}

interface CabinetApplicationsTabProps {
  applications: Application[];
  fieldLabelsByContest: Record<number, Record<string, string>>;
  onNewApplication: () => void;
  onEditApplication: (application: Application) => void;
}

const getStatusBadge = (status: string) => {
  const statusMap = {
    pending: { label: 'На рассмотрении', variant: 'secondary' as const },
    approved: { label: 'Одобрена', variant: 'default' as const },
    rejected: { label: 'Отклонена', variant: 'destructive' as const }
  };
  const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
  return (
    <Badge variant={statusInfo.variant} className={statusInfo.variant === 'default' ? 'bg-green-600 hover:bg-green-700' : ''}>
      {statusInfo.label}
    </Badge>
  );
};

const isPastApplication = (app: Application) => {
  if (!app.end_date) return false;
  const endDate = new Date(app.end_date);
  if (Number.isNaN(endDate.getTime())) return false;
  return endDate < new Date();
};

const CabinetApplicationsTab = ({ applications, fieldLabelsByContest, onNewApplication, onEditApplication }: CabinetApplicationsTabProps) => {
  const [view, setView] = useState<'current' | 'archive'>('current');

  const { currentApplications, archiveApplications } = useMemo(() => {
    const current: Application[] = [];
    const archive: Application[] = [];
    applications.forEach((app) => {
      (isPastApplication(app) ? archive : current).push(app);
    });
    return { currentApplications: current, archiveApplications: archive };
  }, [applications]);

  const visibleApplications = view === 'current' ? currentApplications : archiveApplications;

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-heading font-bold">Заявки на конкурсы</h2>
        <Button size="lg" onClick={onNewApplication} className="bg-secondary hover:bg-secondary/90 gap-2 text-base">
          <Icon name="Plus" size={20} /> Подать заявку
        </Button>
      </div>

      {applications.length > 0 && (
        <div className="flex gap-3 mb-6">
          <Button
            variant={view === 'current' ? 'default' : 'outline'}
            onClick={() => setView('current')}
            className="gap-2 text-base"
          >
            <Icon name="FileText" size={18} /> Текущие
            {currentApplications.length > 0 && (
              <span className="ml-1 bg-background/20 rounded-full text-sm px-2">{currentApplications.length}</span>
            )}
          </Button>
          <Button
            variant={view === 'archive' ? 'default' : 'outline'}
            onClick={() => setView('archive')}
            className="gap-2 text-base"
          >
            <Icon name="Archive" size={18} /> Архив
            {archiveApplications.length > 0 && (
              <span className="ml-1 bg-background/20 rounded-full text-sm px-2">{archiveApplications.length}</span>
            )}
          </Button>
        </div>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-4">У вас пока нет заявок</p>
            <Button onClick={onNewApplication} className="bg-secondary hover:bg-secondary/90">
              Подать первую заявку
            </Button>
          </CardContent>
        </Card>
      ) : visibleApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Archive" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {view === 'archive' ? 'В архиве пока нет заявок' : 'Нет текущих заявок'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleApplications.map((app) => {
            const isArchived = view === 'archive';
            const isLocked = !app.is_editable || isArchived;
            return (
            <Card key={app.id} className={isArchived ? 'opacity-80' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-xl">{app.contest_title}</CardTitle>
                      {isArchived && (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Icon name="Archive" size={12} /> Архив
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      Подано: {new Date(app.submitted_at).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(app.status)}
                    {!isArchived && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        disabled={isLocked}
                        onClick={() => onEditApplication(app)}
                        title={isLocked ? 'Редактирование закрыто организатором' : 'Редактировать заявку'}
                      >
                        <Icon name={isLocked ? 'Lock' : 'Pencil'} size={16} />
                        {isLocked ? 'Закрыто' : 'Редактировать'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {app.admin_comment && (app.status === 'rejected' || app.status === 'pending') && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                      <Icon name="MessageSquare" size={14} /> Комментарий организатора
                    </p>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{app.admin_comment}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {app.category && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Возраст</p>
                      <p className="text-lg font-medium">{app.category}</p>
                    </div>
                  )}
                  {app.performance_title && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Название номера</p>
                      <p className="text-lg font-medium">{app.performance_title}</p>
                    </div>
                  )}
                  {app.nomination && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Номинация</p>
                      <p className="text-lg font-medium">{app.nomination}</p>
                    </div>
                  )}
                  {app.participation_format && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Формат</p>
                      <p className="text-lg font-medium">{app.participation_format === 'offline' ? 'Очное' : 'Заочное'}</p>
                    </div>
                  )}
                </div>
                {app.custom_fields && Object.keys(app.custom_fields).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Ответы на вопросы организатора</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(app.custom_fields).map(([key, value]) => {
                        const label = fieldLabelsByContest[app.contest_id]?.[key] || key;
                        return (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                            <p className="text-sm font-medium">{value === 'true' ? 'Да' : value === 'false' ? 'Нет' : (value || '—')}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {app.start_date && app.end_date && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Даты конкурса</p>
                    <p className="text-sm">
                      {new Date(app.start_date).toLocaleDateString('ru-RU')} — {new Date(app.end_date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                )}
                {isLocked && !isArchived && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Lock" size={14} />
                    Организатор закрыл редактирование этой заявки
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default CabinetApplicationsTab;