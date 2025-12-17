import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

type Concert = {
  id: number;
  title: string;
  description: string;
  poster_url?: string;
  ticket_link?: string;
  details_link?: string;
  location?: string;
  event_date?: string;
  status: string;
};

interface ConcertsManagementTabProps {
  concerts: Concert[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (concert: Concert) => void;
  onDeleteClick: (concertId: number) => void;
}

const ConcertsManagementTab = ({
  concerts,
  loading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: ConcertsManagementTabProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500">Предстоящий</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Завершён</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const concertsWithEvents = concerts.filter(c => c.event_date && c.location);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold">Управление концертами</h2>
          <p className="text-muted-foreground">
            Всего мероприятий: {concertsWithEvents.length}
          </p>
        </div>
        <Button onClick={onCreateClick} className="bg-secondary hover:bg-secondary/90">
          <Icon name="Plus" size={18} className="mr-2" />
          Добавить концерт
        </Button>
      </div>

      {concertsWithEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Нет концертов</h3>
          <p className="text-muted-foreground mb-6">
            Добавьте информацию о концерте через редактирование конкурса
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {concertsWithEvents.map((concert) => {
            const eventDate = concert.event_date ? new Date(concert.event_date) : null;
            const dateStr = eventDate
              ? eventDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <Card key={concert.id} className="p-6">
                <div className="flex gap-6">
                  {concert.poster_url ? (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={concert.poster_url}
                        alt={concert.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Icon name="Music" size={48} className="text-primary" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-heading font-bold mb-2">
                          {concert.title}
                        </h3>
                        {getStatusBadge(concert.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditClick(concert)}
                        >
                          <Icon name="Edit" size={16} className="mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Удалить информацию о концерте?')) {
                              onDeleteClick(concert.id);
                            }
                          }}
                        >
                          <Icon name="Trash2" size={16} className="mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </div>

                    {concert.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {concert.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {eventDate && (
                        <div className="flex items-center gap-2">
                          <Icon name="Calendar" size={16} className="text-primary" />
                          <span>{dateStr}</span>
                        </div>
                      )}

                      {concert.location && (
                        <div className="flex items-center gap-2">
                          <Icon name="MapPin" size={16} className="text-primary" />
                          <span>{concert.location}</span>
                        </div>
                      )}

                      {concert.ticket_link && (
                        <div className="flex items-center gap-2">
                          <Icon name="Ticket" size={16} className="text-green-600" />
                          <a
                            href={concert.ticket_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ссылка на билеты
                          </a>
                        </div>
                      )}

                      {concert.details_link && (
                        <div className="flex items-center gap-2">
                          <Icon name="Info" size={16} className="text-blue-600" />
                          <a
                            href={concert.details_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Подробности
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConcertsManagementTab;
