import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const ConcertsPage = () => {
  const concerts = [
    {
      title: 'Людмила Николаева - Жить не пережить',
      date: '1 мая 2025',
      time: '18:00',
      venue: 'ГДК',
      city: 'Воронеж',
      price: '0+',
      image: 'https://cdn.poehali.dev/files/260 Воронеж.png',
      ticketUrl: 'https://iframeab-pre11992.intickets.ru/seance/68895381/',
    },
    {
      title: 'Людмила Николаева - Жить не пережить',
      date: '3 мая 2025',
      time: '18:00',
      venue: 'ОЦКНТ',
      city: 'Липецк',
      price: '0+',
      image: 'https://cdn.poehali.dev/files/250 Липецк.png',
    },
    {
      title: 'Симфонический оркестр',
      date: '10 мая 2025',
      time: '20:00',
      venue: 'Большой театр',
      city: 'Москва',
      price: 'от 2500 ₽',
    },
    {
      title: 'Вокальный вечер',
      date: '8 июня 2025',
      time: '19:30',
      venue: 'Филармония',
      city: 'Казань',
      price: 'от 800 ₽',
    },
  ];

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

          <div className="max-w-4xl mx-auto space-y-6">
            {concerts.map((concert, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="md:flex">
                  {concert.image ? (
                    <div className="md:w-1/3">
                      <img 
                        src={concert.image} 
                        alt={concert.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="md:w-1/3 bg-gradient-to-br from-primary to-secondary p-12 flex flex-col justify-center items-center text-white">
                      <div className="text-6xl mb-4">🎵</div>
                      <div className="text-center">
                        <div className="text-3xl font-heading font-bold mb-2">
                          {concert.date.split(' ')[0]}
                        </div>
                        <div className="text-lg opacity-90">
                          {concert.date.split(' ').slice(1).join(' ')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-heading font-bold mb-4">{concert.title}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Icon name="Clock" size={18} className="text-secondary" />
                        <span>{concert.time}</span>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Icon name="MapPin" size={18} className="text-secondary" />
                        <span>{concert.venue}, {concert.city}</span>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Icon name="Ticket" size={18} className="text-secondary" />
                        <span>{concert.price}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {concert.ticketUrl ? (
                        <a href={concert.ticketUrl} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-secondary hover:bg-secondary/90">
                            Купить билет
                          </Button>
                        </a>
                      ) : (
                        <Button className="bg-secondary hover:bg-secondary/90">
                          Купить билет
                        </Button>
                      )}
                      <Button variant="outline">
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConcertsPage;