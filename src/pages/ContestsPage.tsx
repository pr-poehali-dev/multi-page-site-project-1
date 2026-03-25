import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  poster_url?: string;
}

const ContestsPage = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      const sortedContests = (data.contests || []).sort((a: Contest, b: Contest) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateA - dateB;
      });
      setContests(sortedContests);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Календарь конкурсов
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Выберите направление и начните свой путь к победе
          </p>

          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Загрузка конкурсов...</p>
            </div>
          ) : contests.length === 0 ? (
            <Card className="p-12 text-center max-w-2xl mx-auto">
              <Icon name="Calendar" size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-2xl font-semibold mb-2">Конкурсы пока не запланированы</h3>
              <p className="text-muted-foreground">Следите за обновлениями - скоро здесь появятся новые конкурсы!</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {contests.map((contest, index) => {
                const startDate = new Date(contest.start_date);
                const endDate = new Date(contest.end_date);
                const now = new Date();
                const isActive = contest.status === 'active';
                const isPast = endDate < now;
                const isFuture = startDate > now;
                
                const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <Card
                    key={contest.id}
                    className={`overflow-hidden hover:shadow-xl transition-all duration-300 animate-scale-in ${
                      isPast ? 'opacity-60' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-72 relative flex flex-col items-center justify-center border-r shrink-0 overflow-hidden min-h-[280px]">
                        {contest.poster_url ? (
                          <img 
                            src={contest.poster_url}
                            alt={contest.title} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-8xl">🎭</div>
                        )}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                          <Badge 
                            className={`${
                              isPast ? 'bg-gray-500' :
                              isActive ? 'bg-green-500' : 
                              'bg-orange-500'
                            }`}
                          >
                            {isPast ? 'Завершён' : isActive ? 'Активен' : 'Скоро'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex-1 p-8 flex flex-col justify-between">
                        <div>
                          <h3 className="text-3xl font-heading font-bold mb-6">{contest.title}</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div className="flex items-center gap-3 text-sm">
                              <Icon name="CalendarDays" size={20} className="text-primary shrink-0" />
                              <div>
                                <div className="font-medium">Начало приёма заявок</div>
                                <div className="text-muted-foreground">
                                  {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                              <Icon name="CalendarX" size={20} className="text-destructive shrink-0" />
                              <div>
                                <div className="font-medium">Окончание приёма</div>
                                <div className="text-muted-foreground">
                                  {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {!isPast && (
                            <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg mb-5 w-fit">
                              <Icon name="Clock" size={18} className="text-secondary shrink-0" />
                              <span className="text-sm font-medium">
                                {isFuture ? (
                                  `Старт через ${daysUntilStart} ${daysUntilStart === 1 ? 'день' : daysUntilStart < 5 ? 'дня' : 'дней'}`
                                ) : isActive ? (
                                  daysUntilEnd > 0 
                                    ? `Осталось ${daysUntilEnd} ${daysUntilEnd === 1 ? 'день' : daysUntilEnd < 5 ? 'дня' : 'дней'}`
                                    : 'Последний день приёма заявок!'
                                ) : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            className="bg-secondary hover:bg-secondary/90"
                            disabled={isPast || isFuture}
                          >
                            <Icon name="Send" size={18} className="mr-2" />
                            {isPast ? 'Конкурс завершён' : isFuture ? 'Скоро откроется' : 'Подать заявку'}
                          </Button>
                          <Button variant="outline" onClick={() => navigate(`/contests/${contest.id}`)}>
                            <Icon name="Info" size={18} className="mr-2" />
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestsPage;