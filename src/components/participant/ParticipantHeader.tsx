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
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-heading font-bold mb-3">Личный кабинет</h1>
          <p className="text-lg text-muted-foreground">{participant.full_name}</p>
        </div>
        <Button size="lg" variant="outline" onClick={onLogout} className="gap-2 text-base">
          <Icon name="LogOut" size={20} /> Выйти
        </Button>
      </div>

      {/* Данные участника */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-2xl">
            <Icon name="User" size={24} /> Мои данные
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">ФИО контактного лица</p>
              <p className="text-lg font-medium">{participant.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Должность</p>
              <p className="text-lg font-medium">{participant.contact_position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Телефон</p>
              <p className="text-lg font-medium">{participant.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-lg font-medium">{participant.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Страница в ВК</p>
              <p className="text-lg font-medium">
                <a href={participant.vk_link} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                  {participant.vk_link}
                </a>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Место проживания</p>
              <p className="text-lg font-medium">{participant.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ParticipantHeader;