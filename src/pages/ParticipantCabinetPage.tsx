import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Application {
  id: number;
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
}

interface Participant {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  city: string;
}

const ParticipantCabinetPage = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('participantEmail');
    const data = localStorage.getItem('participantData');
    
    if (!email || !data) {
      navigate('/participant-login');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setParticipant(parsedData.participant);
      setApplications(parsedData.applications);
    } catch (error) {
      console.error('Error parsing participant data:', error);
      navigate('/participant-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('participantEmail');
    localStorage.removeItem('participantData');
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!'
    });
    navigate('/');
  };

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

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">
                  Личный кабинет
                </h1>
                <p className="text-muted-foreground">
                  Управление заявками на участие
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="gap-2"
              >
                <Icon name="LogOut" size={18} />
                Выйти
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="User" size={24} />
                Мои данные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-medium">{participant.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{participant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{participant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Город</p>
                  <p className="font-medium">{participant.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold">Мои заявки</h2>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-secondary hover:bg-secondary/90 gap-2"
            >
              <Icon name="Plus" size={18} />
              Подать новую заявку
            </Button>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  У вас пока нет заявок
                </p>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  Подать первую заявку
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{app.contest_title}</CardTitle>
                        <CardDescription>
                          Подано: {new Date(app.submitted_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Категория</p>
                        <p className="font-medium">
                          {app.category === 'child' && 'Детская'}
                          {app.category === 'teen' && 'Подростковая'}
                          {app.category === 'youth' && 'Молодежная'}
                          {app.category === 'adult' && 'Взрослая'}
                        </p>
                      </div>
                      {app.performance_title && (
                        <div>
                          <p className="text-sm text-muted-foreground">Название номера</p>
                          <p className="font-medium">{app.performance_title}</p>
                        </div>
                      )}
                      {app.nomination && (
                        <div>
                          <p className="text-sm text-muted-foreground">Номинация</p>
                          <p className="font-medium">{app.nomination}</p>
                        </div>
                      )}
                      {app.participation_format && (
                        <div>
                          <p className="text-sm text-muted-foreground">Формат</p>
                          <p className="font-medium">{app.participation_format}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Даты проведения конкурса</p>
                      <p className="text-sm">
                        {new Date(app.start_date).toLocaleDateString('ru-RU')} — {new Date(app.end_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParticipantCabinetPage;
