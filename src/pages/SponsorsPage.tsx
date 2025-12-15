import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

const SponsorsPage = () => {
  const sponsors = [
    {
      name: 'Министерство культуры РФ',
      type: 'Генеральный партнёр',
      description: 'Поддержка развития культуры и искусства',
      emoji: '🏛️',
    },
    {
      name: 'Газпром',
      type: 'Главный спонсор',
      description: 'Инвестиции в образование и культуру',
      emoji: '⚡',
    },
    {
      name: 'Сбербанк',
      type: 'Главный спонсор',
      description: 'Развитие творческих талантов России',
      emoji: '🏦',
    },
    {
      name: 'Яндекс',
      type: 'Технологический партнёр',
      description: 'Цифровые решения для конкурсов',
      emoji: '💻',
    },
    {
      name: 'Московская консерватория',
      type: 'Образовательный партнёр',
      description: 'Подготовка профессиональных кадров',
      emoji: '🎓',
    },
    {
      name: 'Третьяковская галерея',
      type: 'Культурный партнёр',
      description: 'Площадка для гала-концертов',
      emoji: '🎨',
    },
  ];

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {sponsors.map((sponsor, index) => (
              <Card
                key={index}
                className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-7xl mb-4">{sponsor.emoji}</div>
                <h3 className="text-xl font-heading font-bold mb-2">{sponsor.name}</h3>
                <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full mb-3">
                  {sponsor.type}
                </div>
                <p className="text-sm text-muted-foreground">{sponsor.description}</p>
              </Card>
            ))}
          </div>

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
