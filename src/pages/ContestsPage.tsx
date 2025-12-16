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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {contests.map((contest, index) => (
                <Card
                  key={contest.id}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 relative">
                    <Badge 
                      className={`absolute top-4 right-4 ${
                        contest.status === 'active' 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                      }`}
                    >
                      {contest.status === 'active' ? 'Идёт приём заявок' : 'Скоро'}
                    </Badge>
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={contest.title.toLowerCase().includes('зимняя') 
                          ? 'https://cdn.poehali.dev/files/3D_логотип_фестиваля__Зимняя_мелодия__с_зимними_мо-no-bg-preview (carve.photos).png'
                          : 'https://cdn.poehali.dev/files/лого таланты.png'
                        }
                        alt="Логотип конкурса" 
                        className="w-16 h-16 object-contain"
                      />
                      <h3 className="text-2xl font-heading font-bold">{contest.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{contest.description}</p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Icon name="Calendar" size={18} className="text-secondary" />
                      <span>
                        {new Date(contest.start_date).toLocaleDateString('ru-RU')} - {new Date(contest.end_date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button className="flex-1 bg-secondary hover:bg-secondary/90">
                        Подать заявку
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestsPage;