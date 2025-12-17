import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

type ContestResult = {
  id: number;
  contest_id: number;
  title: string;
  description: string;
  pdf_url: string;
  published_date: string;
  contest_title?: string;
  start_date?: string;
  end_date?: string;
};

interface ResultsManagementTabProps {
  results: ContestResult[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (result: ContestResult) => void;
  onDeleteClick: (resultId: number) => void;
}

const ResultsManagementTab = ({
  results,
  loading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: ResultsManagementTabProps) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
          <h2 className="text-2xl font-heading font-bold">Итоги конкурсов</h2>
          <p className="text-muted-foreground">
            Всего опубликовано: {results.length}
          </p>
        </div>
        <Button onClick={onCreateClick} className="bg-secondary hover:bg-secondary/90">
          <Icon name="Plus" size={18} className="mr-2" />
          Опубликовать итоги
        </Button>
      </div>

      {results.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Trophy" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Нет опубликованных итогов</h3>
          <p className="text-muted-foreground mb-6">
            Нажмите кнопку "Опубликовать итоги" чтобы добавить результаты конкурса
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="p-6">
              <div className="flex gap-6">
                <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Icon name="Trophy" size={32} className="text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-1">
                        {result.title}
                      </h3>
                      {result.contest_title && (
                        <Badge variant="outline" className="mb-2">
                          {result.contest_title}
                        </Badge>
                      )}
                      {result.description && (
                        <p className="text-sm text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditClick(result)}
                      >
                        <Icon name="Edit" size={16} className="mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Удалить итоги конкурса?')) {
                            onDeleteClick(result.id);
                          }
                        }}
                      >
                        <Icon name="Trash2" size={16} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} className="text-primary" />
                      <span>Опубликовано: {formatDate(result.published_date)}</span>
                    </div>

                    {result.pdf_url && (
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" size={16} className="text-green-600" />
                        <a
                          href={result.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Скачать PDF
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsManagementTab;
