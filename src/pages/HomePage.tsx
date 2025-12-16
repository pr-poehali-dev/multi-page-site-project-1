import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const features = [
    {
      icon: 'Trophy',
      title: 'Конкурсы',
      description: 'Участвуйте в престижных творческих конкурсах',
    },
    {
      icon: 'Music',
      title: 'Концерты',
      description: 'Посещайте выступления лучших артистов',
    },
    {
      icon: 'Users',
      title: 'Жюри',
      description: 'Профессиональное жюри высшего уровня',
    },
    {
      icon: 'Award',
      title: 'Награды',
      description: 'Ценные призы и дипломы победителям',
    },
  ];

  const upcomingContests = [
    {
      title: 'Весенний конкурс пианистов',
      date: '15-20 марта 2025',
      category: 'Фортепиано',
      color: 'bg-secondary/10',
    },
    {
      title: 'Летний вокальный марафон',
      date: '1-7 июня 2025',
      category: 'Вокал',
      color: 'bg-primary/10',
    },
    {
      title: 'Осенний танцевальный фестиваль',
      date: '10-15 сентября 2025',
      category: 'Хореография',
      color: 'bg-muted',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <img 
              src="https://cdn.poehali.dev/files/лого 2.png" 
              alt="ИНДИГО" 
              className="h-48 md:h-64 w-auto mx-auto mb-8"
            />
            <p className="md:text-2xl text-muted-foreground max-w-2xl text-4xl mx-[111px] my-[17px]">Здесь рождаются звезды!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-lg px-8 animate-scale-in">
                <Icon name="Sparkles" size={20} className="mr-2" />
                Подать заявку
              </Button>
              <Link to="/contests">
                <Button size="lg" variant="outline" className="text-lg px-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  Смотреть конкурсы
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              let linkPath = '#';
              if (feature.title === 'Конкурсы') linkPath = '/contests';
              if (feature.title === 'Концерты') linkPath = '/concerts';
              if (feature.title === 'Жюри') linkPath = '/jury';
              if (feature.title === 'Награды') linkPath = '/results';
              
              const CardContent = (
                <Card
                  key={index}
                  className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-6 hover:rotate-12 transition-transform">
                    <Icon name={feature.icon as any} size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );

              return linkPath !== '#' ? (
                <Link key={index} to={linkPath}>
                  {CardContent}
                </Link>
              ) : (
                CardContent
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Ближайшие конкурсы
            </h2>
            <p className="text-lg text-muted-foreground">
              Выберите направление и покажите свой талант
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {upcomingContests.map((contest, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`h-40 ${contest.color} flex items-center justify-center`}>
                  <div className="text-6xl opacity-20">🎭</div>
                </div>
                <div className="p-6">
                  <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full mb-3">
                    {contest.category}
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2">{contest.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                    <Icon name="Calendar" size={16} />
                    {contest.date}
                  </p>
                  <Button variant="outline" className="w-full">
                    Подробнее
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Готовы показать свой талант?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Регистрируйтесь на платформе, загружайте свои работы и участвуйте в конкурсах
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8">
            Начать прямо сейчас
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;