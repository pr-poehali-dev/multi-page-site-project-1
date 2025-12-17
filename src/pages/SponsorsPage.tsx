import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

type Partner = {
  id: number;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
};

const SponsorsPage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?active=true');
        const data = await response.json();
        setPartners(data.partners || []);
      } catch (error) {
        console.error('Ошибка загрузки партнёров:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPartners();
  }, []);

  const benefits = [
    {
      title: 'Развитие талантов',
      description: 'Мы помогаем молодым артистам раскрыть свой потенциал',
      emoji: '✨',
    },
    {
      title: 'Культурное наследие',
      description: 'Сохраняем и развиваем традиции русского искусства',
      emoji: '🎭',
    },
    {
      title: 'Международное признание',
      description: 'Участники получают мировое признание и возможности',
      emoji: '🌍',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Нас поддерживают
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto animate-fade-in">
            Благодарим партнёров за вклад в развитие искусства и культуры
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
            </div>
          ) : partners.length === 0 ? (
            <Card className="p-12 text-center max-w-2xl mx-auto mb-20">
              <Icon name="Handshake" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">Партнёры появятся скоро</h3>
              <p className="text-muted-foreground">
                Мы работаем над расширением списка наших партнёров
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20">
              {partners.map((partner, index) => (
                <Card
                  key={partner.id}
                  className="p-6 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-h-24 max-w-full object-contain"
                      />
                      <span className="text-sm text-center text-muted-foreground hover:text-primary transition-colors">
                        {partner.name}
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-h-24 max-w-full object-contain"
                      />
                      <span className="text-sm text-center text-muted-foreground">
                        {partner.name}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-12 max-w-5xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">
              Почему нас поддерживают
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-6xl mb-4">{benefit.emoji}</div>
                  <h3 className="text-xl font-heading font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-lg mb-4">Хотите стать партнёром?</p>
              <a 
                href="/contacts" 
                className="inline-block px-8 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
              >
                Свяжитесь с нами
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SponsorsPage;
