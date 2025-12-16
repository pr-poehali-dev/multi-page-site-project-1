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

      {loading ? (
        <Card className="p-12 text-center">
          <Icon
            name="Loader"
            size={48}
            className="mx-auto mb-4 animate-spin text-primary"
          />
          <p className="text-muted-foreground">Загрузка конкурсов...</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Название
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Даты
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {contests.map((contest) => (
                  <tr key={contest.id} className="border-t hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">
                      #{contest.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{contest.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {contest.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(contest.start_date).toLocaleDateString('ru-RU')}{' '}
                      - {new Date(contest.end_date).toLocaleDateString('ru-RU')}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditClick(contest)}
                        >
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
