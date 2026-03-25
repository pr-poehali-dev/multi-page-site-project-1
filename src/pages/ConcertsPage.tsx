import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Concert = {
  id: number;
  title: string;
  description: string;
  poster_url?: string;
  ticket_link?: string;
  details_link?: string;
  location?: string;
  event_date?: string;
};

const ConcertsPage = () => {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/de057f50-7d1e-49bc-a61f-f23335190f32');
        const data = await response.json();
        const sortedConcerts = (data.concerts || []).sort((a: Concert, b: Concert) => {
          const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
          const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
          return dateA - dateB;
        });
        setConcerts(sortedConcerts);
      } catch (error) {
        console.error('Ошибка загрузки концертов:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConcerts();
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Афиша концертов
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Посетите выступления лучших артистов и победителей конкурсов
          </p>

          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={48} className="mx-auto animate-spin text-primary" />
              <p className="text-muted-foreground mt-4">Загрузка концертов...</p>
            </div>
          ) : concerts.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Пока нет запланированных концертов</p>
            </div>
          ) : (
          <div className="space-y-8">
            {concerts.map((concert, index) => {
              const eventDate = concert.event_date ? new Date(concert.event_date) : null;
              const dateStr = eventDate ? eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
              const timeStr = eventDate ? eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

              return (
              <Card
                key={concert.id}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="md:flex min-h-[320px]">
                  {concert.poster_url ? (
                    <div className="md:w-2/5 min-h-[280px] md:min-h-full">
                      <img 
                        src={concert.poster_url} 
                        alt={concert.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="md:w-2/5 bg-gradient-to-br from-primary to-secondary p-16 flex flex-col justify-center items-center text-white">
                      <div className="text-8xl mb-6">🎵</div>
                      <div className="text-center">
                        {eventDate && (
                          <>
                            <div className="text-5xl font-heading font-bold mb-2">
                              {eventDate.getDate()}
                            </div>
                            <div className="text-xl opacity-90">
                              {eventDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="md:w-3/5 p-10 md:p-14 flex flex-col justify-center">
                    <h3 className="text-3xl md:text-4xl font-heading font-bold mb-5">{concert.title}</h3>
                    
                    {concert.description && (
                      <p className="text-lg text-muted-foreground mb-6">{concert.description}</p>
                    )}
                    
                    <div className="space-y-4 mb-8">
                      {eventDate && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Icon name="Clock" size={22} className="text-secondary" />
                          <span className="text-lg">{dateStr} в {timeStr}</span>
                        </div>
                      )}

                      {concert.location && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Icon name="MapPin" size={22} className="text-secondary" />
                          <span className="text-lg">{concert.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {concert.ticket_link && (
                        <a href={concert.ticket_link} target="_blank" rel="noopener noreferrer">
                          <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-base px-8">
                            <Icon name="Ticket" size={20} className="mr-2" />
                            Купить билет
                          </Button>
                        </a>
                      )}
                      {concert.details_link && (
                        <a href={concert.details_link} target="_blank" rel="noopener noreferrer">
                          <Button size="lg" variant="outline" className="text-base px-8">
                            <Icon name="Info" size={20} className="mr-2" />
                            Подробнее
                          </Button>
                        </a>
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
      </section>

      <Footer />
    </div>
  );
};

export default ConcertsPage;