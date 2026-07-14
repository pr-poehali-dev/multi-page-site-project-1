import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface Participant {
  id: number;
  full_name: string;
  contact_position: string;
  email: string;
  phone: string;
  vk_link: string;
  city: string;
}

interface ParticipantHeaderProps {
  participant: Participant;
  onLogout: () => void;
}

const ParticipantHeader = ({ participant, onLogout }: ParticipantHeaderProps) => {
  return (
    <>
      {/* Шапка */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">Личный кабинет</h1>
          <p className="text-muted-foreground">{participant.full_name}</p>
        </div>
        <Button variant="outline" onClick={onLogout} className="gap-2">
          <Icon name="LogOut" size={18} /> Выйти
        </Button>
      </div>

      {/* Данные участника */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="User" size={20} /> Мои данные
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ФИО контактного лица</p>
              <p className="font-medium">{participant.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Должность</p>
              <p className="font-medium">{participant.contact_position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Телефон</p>
              <p className="font-medium">{participant.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{participant.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Страница в ВК</p>
              <p className="font-medium">
                <a href={participant.vk_link} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                  {participant.vk_link}
                </a>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Место проживания</p>
              <p className="font-medium">{participant.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ParticipantHeader;
