import { useState, useEffect } from 'react';
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
}

const ContestsPage = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
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
            <div className="space-y-6 max-w-5xl mx-auto">
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
                      <div className="md:w-48 bg-gradient-to-br from-primary/10 to-secondary/10 p-6 flex flex-col items-center justify-center border-r">
                        <img 
                          src={contest.title.toLowerCase().includes('зимняя') 
                            ? 'https://cdn.poehali.dev/files/3D_логотип_фестиваля__Зимняя_мелодия__с_зимними_мо-no-bg-preview (carve.photos).png'
                            : 'https://cdn.poehali.dev/files/лого таланты.png'
                          }
                          alt="Логотип" 
                          className="w-24 h-24 object-contain mb-3"
                        />
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

                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-2xl font-heading font-bold mb-2">{contest.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {contest.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="CalendarDays" size={18} className="text-primary" />
                            <div>
                              <div className="font-medium">Начало приёма заявок</div>
                              <div className="text-muted-foreground">
                                {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="CalendarX" size={18} className="text-destructive" />
                            <div>
                              <div className="font-medium">Окончание приёма</div>
                              <div className="text-muted-foreground">
                                {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isPast && (
                          <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg mb-4">
                            <Icon name="Clock" size={18} className="text-secondary" />
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

                        <div className="flex gap-3">
                          <Button 
                            className="bg-secondary hover:bg-secondary/90"
                            disabled={isPast || isFuture}
                          >
                            <Icon name="Send" size={18} className="mr-2" />
                            {isPast ? 'Конкурс завершён' : isFuture ? 'Скоро откроется' : 'Подать заявку'}
                          </Button>
                          <Button variant="outline">
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