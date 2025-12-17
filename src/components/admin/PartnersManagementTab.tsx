import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

type Partner = {
  id: number;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
};

interface PartnersManagementTabProps {
  partners: Partner[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (partner: Partner) => void;
  onDeleteClick: (partnerId: number) => void;
}

const PartnersManagementTab = ({
  partners,
  loading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: PartnersManagementTabProps) => {
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
          <h2 className="text-2xl font-heading font-bold">Партнёры и спонсоры</h2>
          <p className="text-muted-foreground">
            Всего партнёров: {partners.length}
          </p>
        </div>
        <Button onClick={onCreateClick} className="bg-secondary hover:bg-secondary/90">
          <Icon name="Plus" size={18} className="mr-2" />
          Добавить партнёра
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Handshake" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Нет добавленных партнёров</h3>
          <p className="text-muted-foreground mb-6">
            Нажмите кнопку "Добавить партнёра" чтобы добавить логотип спонсора или партнёра
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                    {partner.is_active ? 'Активен' : 'Скрыт'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    #{partner.display_order}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center mb-4 bg-muted/30 rounded-lg p-4 min-h-[120px]">
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-lg">{partner.name}</h3>

                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Icon name="ExternalLink" size={14} />
                      Перейти на сайт
                    </a>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditClick(partner)}
                      className="flex-1"
                    >
                      <Icon name="Edit" size={16} className="mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Удалить партнёра "${partner.name}"?`)) {
                          onDeleteClick(partner.id);
                        }
                      }}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
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

export default PartnersManagementTab;
