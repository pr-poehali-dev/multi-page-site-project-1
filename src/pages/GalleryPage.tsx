import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GalleryPage = () => {
  const [filter, setFilter] = useState('all');

  const works = [
    { title: 'Лунная соната', author: 'Мария Иванова', category: 'piano', year: 2024, emoji: '🎹' },
    { title: 'Весенний вальс', author: 'Алексей Петров', category: 'dance', year: 2024, emoji: '💃' },
    { title: 'Ария из оперы', author: 'Анна Смирнова', category: 'vocal', year: 2024, emoji: '🎤' },
    { title: 'Симфония №5', author: 'Дмитрий Козлов', category: 'orchestra', year: 2023, emoji: '🎻' },
    { title: 'Джазовая импровизация', author: 'Ольга Новикова', category: 'piano', year: 2024, emoji: '🎹' },
    { title: 'Современный балет', author: 'Игорь Волков', category: 'dance', year: 2023, emoji: '🩰' },
  ];

  const categories = [
    { id: 'all', label: 'Все работы' },
    { id: 'piano', label: 'Фортепиано' },
    { id: 'vocal', label: 'Вокал' },
    { id: 'dance', label: 'Хореография' },
    { id: 'orchestra', label: 'Оркестр' },
  ];

  const filteredWorks = filter === 'all' 
    ? works 
    : works.filter(w => w.category === filter);

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Галерея работ
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Лучшие выступления наших участников
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={filter === cat.id ? 'default' : 'outline'}
                onClick={() => setFilter(cat.id)}
                className={filter === cat.id ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredWorks.map((work, index) => (
              <Card
                key={index}
                className="overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                  <div className="text-8xl group-hover:scale-110 transition-transform duration-300">
                    {work.emoji}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-primary hover:bg-white/90"
                    >
                      Смотреть
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-heading font-semibold text-lg mb-1">{work.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{work.author}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{work.year}</span>
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

export default GalleryPage;
