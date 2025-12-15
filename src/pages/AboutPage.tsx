import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const AboutPage = () => {
  const stats = [
    { number: '500+', label: 'Участников' },
    { number: '50+', label: 'Конкурсов' },
    { number: '12', label: 'Стран' },
    { number: '100+', label: 'Призов' },
  ];

  const values = [
    {
      icon: 'Heart',
      title: 'Страсть к искусству',
      description: 'Мы верим в силу творчества и поддерживаем таланты',
    },
    {
      icon: 'Users',
      title: 'Профессионализм',
      description: 'Высокие стандарты оценки и экспертное жюри',
    },
    {
      icon: 'Globe',
      title: 'Открытость',
      description: 'Участвуйте из любой точки мира онлайн',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            О платформе
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Art Seasons — это современная конкурсная платформа для артистов всех направлений
          </p>

          <div className="prose prose-lg max-w-none mb-16 animate-fade-in">
            <p className="text-lg leading-relaxed">
              Мы создали Art Seasons с одной целью — дать возможность талантливым артистам 
              показать свое мастерство и получить признание на международном уровне. 
              Наша платформа объединяет музыкантов, вокалистов, танцоров и других творческих личностей.
            </p>
            <p className="text-lg leading-relaxed">
              С момента основания мы провели более 50 конкурсов, в которых приняли участие 
              артисты из 12 стран мира. Каждый конкурс оценивается профессиональным жюри, 
              состоящим из известных деятелей искусства.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="p-6 text-center hover:shadow-lg transition-shadow animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl font-heading font-bold text-secondary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-heading font-bold mb-8 text-center">
            Наши ценности
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card 
                key={index} 
                className="p-8 text-center hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={value.icon as any} size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
