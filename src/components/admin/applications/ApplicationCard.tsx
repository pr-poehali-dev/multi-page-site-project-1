import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Application, CustomFieldDef } from './applicationTypes';
import ApplicationDetails from './ApplicationDetails';
import ApplicationEditForm, { ApplicationEditPayload } from './ApplicationEditForm';

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

interface ApplicationCardProps {
  app: Application;
  expandedId: number | null;
  editingId: number | null;
  savingEdit: boolean;
  fieldDefsByContest: Record<number, CustomFieldDef[]>;
  onToggleExpand: (app: Application) => void;
  onUpdateStatus: (applicationId: number, newStatus: string, adminComment?: string) => void;
  onDeleteApplication: (applicationId: number) => void;
  onToggleEditingLock: (applicationId: number, locked: boolean) => void;
  onToggleContestLock: (contestId: number, locked: boolean) => void;
  onOpenRejectDialog: (appId: number, status: 'rejected' | 'pending') => void;
  onStartEdit: (app: Application) => void;
  onCancelEdit: () => void;
  onSaveEdit: (payload: ApplicationEditPayload) => void;
}

const ApplicationCard = ({
  app,
  expandedId,
  editingId,
  savingEdit,
  fieldDefsByContest,
  onToggleExpand,
  onUpdateStatus,
  onDeleteApplication,
  onToggleEditingLock,
  onToggleContestLock,
  onOpenRejectDialog,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: ApplicationCardProps) => {
  return (
    <Card className="overflow-hidden">
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
              {app.contact_position && (
                <div className="flex items-center gap-2">
                  <Icon name="Briefcase" size={16} />
                  <span>{app.contact_position}</span>
                </div>
              )}
              {app.vk_link && (
                <div className="flex items-center gap-2">
                  <Icon name="Link" size={16} />
                  <a href={app.vk_link} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline truncate">
                    {app.vk_link}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {app.status !== 'approved' && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:bg-green-50"
                onClick={() => onUpdateStatus(app.id, 'approved')}
              >
                <Icon name="Check" size={16} className="mr-1" />
                Одобрить
              </Button>
            )}
            {app.status !== 'pending' && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-600 hover:bg-amber-50"
                onClick={() => onOpenRejectDialog(app.id, 'pending')}
              >
                <Icon name="RotateCcw" size={16} className="mr-1" />
                На доработку
              </Button>
            )}
            {app.status !== 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onOpenRejectDialog(app.id, 'rejected')}
              >
                <Icon name="X" size={16} className="mr-1" />
                Отклонить
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className={app.editing_locked ? 'text-secondary hover:bg-secondary/10' : 'text-gray-600 hover:bg-muted'}
              onClick={() => onToggleEditingLock(app.id, !app.editing_locked)}
              title={app.editing_locked ? 'Разрешить участнику редактировать заявку' : app.applications_locked ? 'Заявка открыта, но весь конкурс закрыт отдельной настройкой ниже' : 'Закрыть редактирование заявки участником'}
            >
              <Icon name={app.editing_locked ? 'Lock' : 'LockOpen'} size={16} className="mr-1" />
              {app.editing_locked ? 'Закрыто' : 'Открыто'}
            </Button>
            {app.applications_locked && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-600 hover:bg-amber-50"
                onClick={() => onToggleContestLock(app.contest_id, false)}
                title="Весь конкурс закрыт для редактирования — эта настройка перекрывает статус отдельной заявки"
              >
                <Icon name="Lock" size={16} className="mr-1" />
                Конкурс закрыт
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-gray-600 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                if (confirm('Удалить заявку? Это действие нельзя отменить.')) {
                  onDeleteApplication(app.id);
                }
              }}
            >
              <Icon name="Trash2" size={16} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={editingId === app.id ? 'text-primary hover:bg-primary/10' : ''}
              onClick={() => (editingId === app.id ? onCancelEdit() : onStartEdit(app))}
            >
              <Icon name="Pencil" size={16} className="mr-1" />
              Редактировать
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleExpand(app)}
            >
              <Icon
                name={expandedId === app.id ? "ChevronUp" : "ChevronDown"}
                size={16}
              />
            </Button>
          </div>
        </div>

        {editingId !== app.id && (
          <>
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
                <p className="text-sm font-medium">{app.nomination_name || app.nomination || '—'}</p>
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
          </>
        )}

        {editingId === app.id ? (
          <ApplicationEditForm
            app={app}
            fieldDefsByContest={fieldDefsByContest}
            saving={savingEdit}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : expandedId === app.id && (
          <ApplicationDetails app={app} fieldDefsByContest={fieldDefsByContest} />
        )}
      </div>
    </Card>
  );
};

export default ApplicationCard;