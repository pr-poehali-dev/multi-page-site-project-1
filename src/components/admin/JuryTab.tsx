import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface JuryMember {
  id: number;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
}

interface JuryTabProps {
  juryMembers: JuryMember[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (member: JuryMember) => void;
  onDeleteClick: (id: number) => void;
}

const JuryTab = ({ juryMembers, loading, onCreateClick, onEditClick, onDeleteClick }: JuryTabProps) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
        <p className="text-muted-foreground">Загрузка жюри...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-bold">Управление жюри</h2>
        <Button onClick={onCreateClick} className="gap-2 bg-secondary hover:bg-secondary/90">
          <Icon name="Plus" size={18} />
          Добавить члена жюри
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {juryMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 h-48 flex items-center justify-center">
              {member.image_url ? (
                <img 
                  src={member.image_url} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="User" size={64} className="text-muted-foreground" />
              )}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold mb-1">{member.name}</h3>
              <p className="text-secondary font-medium text-sm mb-2">{member.role}</p>
              <div className="inline-block px-3 py-1 bg-muted text-xs font-semibold rounded-full mb-3">
                {member.specialty}
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {member.bio}
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditClick(member)}
                  className="flex-1"
                >
                  <Icon name="Edit" size={14} className="mr-1" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteClick(member.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {juryMembers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Члены жюри не добавлены</p>
        </div>
      )}
    </div>
  );
};

export default JuryTab;
