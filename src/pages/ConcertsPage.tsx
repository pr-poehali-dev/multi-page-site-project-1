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
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
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
          <div className="max-w-4xl mx-auto space-y-6">
            {concerts.map((concert, index) => {
              const eventDate = concert.event_date ? new Date(concert.event_date) : null;
              const dateStr = eventDate ? eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
              const timeStr = eventDate ? eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

              return (
              <Card
                key={concert.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="md:flex">
                  {concert.poster_url ? (
                    <div className="md:w-1/3">
                      <img 
                        src={concert.poster_url} 
                        alt={concert.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="md:w-1/3 bg-gradient-to-br from-primary to-secondary p-12 flex flex-col justify-center items-center text-white">
                      <div className="text-6xl mb-4">🎵</div>
                      <div className="text-center">
                        {eventDate && (
                          <>
                            <div className="text-3xl font-heading font-bold mb-2">
                              {eventDate.getDate()}
                            </div>
                            <div className="text-lg opacity-90">
                              {eventDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-heading font-bold mb-4">{concert.title}</h3>
                    
                    {concert.description && (
                      <p className="text-muted-foreground mb-4">{concert.description}</p>
                    )}
                    
                    <div className="space-y-3 mb-6">
                      {eventDate && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Icon name="Clock" size={18} className="text-secondary" />
                          <span>{dateStr} в {timeStr}</span>
                        </div>
                      )}

                      {concert.location && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Icon name="MapPin" size={18} className="text-secondary" />
                          <span>{concert.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {concert.ticket_link && (
                        <a href={concert.ticket_link} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-secondary hover:bg-secondary/90">
                            <Icon name="Ticket" size={18} className="mr-2" />
                            Купить билет
                          </Button>
                        </a>
                      )}
                      {concert.details_link && (
                        <a href={concert.details_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline">
                            <Icon name="Info" size={18} className="mr-2" />
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