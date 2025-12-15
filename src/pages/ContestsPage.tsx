import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const ContestsPage = () => {
  const [filter, setFilter] = useState('all');

  const contests = [
    {
      title: 'Весенний конкурс пианистов',
      date: '15-20 марта 2025',
      category: 'piano',
      categoryLabel: 'Фортепиано',
      status: 'open',
      prize: '500 000 ₽',
      participants: 45,
    },
    {
      title: 'Летний вокальный марафон',
      date: '1-7 июня 2025',
      category: 'vocal',
      categoryLabel: 'Вокал',
      status: 'soon',
      prize: '300 000 ₽',
      participants: 0,
    },
    {
      title: 'Осенний танцевальный фестиваль',
      date: '10-15 сентября 2025',
      category: 'dance',
      categoryLabel: 'Хореография',
      status: 'soon',
      prize: '400 000 ₽',
      participants: 0,
    },
    {
      title: 'Зимний оркестровый конкурс',
      date: '5-10 декабря 2025',
      category: 'orchestra',
      categoryLabel: 'Оркестр',
      status: 'soon',
      prize: '600 000 ₽',
      participants: 0,
    },
  ];

  const categories = [
    { id: 'all', label: 'Все', icon: 'LayoutGrid' },
    { id: 'piano', label: 'Фортепиано', icon: 'Music' },
    { id: 'vocal', label: 'Вокал', icon: 'Mic' },
    { id: 'dance', label: 'Хореография', icon: 'Footprints' },
    { id: 'orchestra', label: 'Оркестр', icon: 'Music2' },
  ];

  const filteredContests = filter === 'all' 
    ? contests 
    : contests.filter(c => c.category === filter);

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

          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={filter === cat.id ? 'default' : 'outline'}
                onClick={() => setFilter(cat.id)}
                className={filter === cat.id ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name={cat.icon as any} size={18} className="mr-2" />
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {filteredContests.map((contest, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 relative">
                  <Badge 
                    className={`absolute top-4 right-4 ${
                      contest.status === 'open' 
                        ? 'bg-green-500' 
                        : 'bg-orange-500'
                    }`}
                  >
                    {contest.status === 'open' ? 'Идёт приём заявок' : 'Скоро'}
                  </Badge>
                  <h3 className="text-2xl font-heading font-bold mb-2">{contest.title}</h3>
                  <p className="text-muted-foreground">{contest.categoryLabel}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Calendar" size={18} className="text-secondary" />
                    <span>{contest.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Trophy" size={18} className="text-secondary" />
                    <span>Призовой фонд: {contest.prize}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Users" size={18} className="text-secondary" />
                    <span>{contest.participants} участников</span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-secondary hover:bg-secondary/90">
                      Подать заявку
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Подробнее
                    </Button>
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

export default ContestsPage;
