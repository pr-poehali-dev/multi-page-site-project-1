import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=gallery';
const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface GalleryItem {
  id: number;
  title: string;
  file_url: string;
  media_type: 'photo' | 'video';
  is_featured: boolean;
}

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  poster_url?: string;
}

const HomePage = () => {
  const [featuredPhotos, setFeaturedPhotos] = useState<GalleryItem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [contestsLoading, setContestsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [galleryResponse, contestsResponse] = await Promise.all([
          fetch(GALLERY_URL),
          fetch(CONTESTS_URL)
        ]);
        
        const galleryData = await galleryResponse.json();
        const featured = (galleryData.items || [])
          .filter((item: GalleryItem) => item.is_featured && item.media_type === 'photo')
          .slice(0, 8);
        setFeaturedPhotos(featured);
        
        const contestsData = await contestsResponse.json();
        const upcomingContests = (contestsData.contests || [])
          .filter((c: Contest) => c.status === 'active' || c.status === 'upcoming')
          .sort((a: Contest, b: Contest) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .slice(0, 3);
        setContests(upcomingContests);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        setContestsLoading(false);
      }
    };
    loadData();
  }, []);

  const defaultPhotos = [
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/kids_performing_ballet.jpg', side: 'left' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/young_musicians_orchestra.jpg', side: 'right' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/theater_kids_stage.jpg', side: 'left' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/kids_singing_choir.jpg', side: 'right' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/dance_group_performance.jpg', side: 'left' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/piano_student_concert.jpg', side: 'right' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/art_class_children.jpg', side: 'left' },
    { img: 'https://cdn.poehali.dev/projects/YCAJEN8rI13s0AqZ17mRuWyAY-fEaxQ-/bucket/kids_drama_performance.jpg', side: 'right' },
  ];

  const photosToShow = featuredPhotos.length > 0
    ? featuredPhotos.map((photo, i) => ({
        img: photo.file_url,
        side: i % 2 === 0 ? 'left' : 'right',
        title: photo.title
      }))
    : defaultPhotos;

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

  const getContestColor = (index: number) => {
    const colors = ['bg-secondary/10', 'bg-primary/10', 'bg-muted'];
    return colors[index % colors.length];
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.toLocaleDateString('ru-RU', options)} ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString('ru-RU', options)} — ${end.toLocaleDateString('ru-RU', options)} ${start.getFullYear()}`;
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in relative">
            {/* Вращающиеся фотографии вокруг логотипа */}
            <div className="relative inline-block mb-8">
              {!loading && (
                <div className="orbit-container animate-fade-in">
                  {photosToShow.map((item, i) => {
                    const isLeft = item.side === 'left';
                    const startX = isLeft ? -550 : 550;
                    const midX = isLeft ? -530 : 530;
                    const endX = isLeft ? -570 : 570;
                    const rotateStart = isLeft ? -15 : 15;
                    const rotateMid = isLeft ? -5 : 5;
                    const rotateEnd = isLeft ? -20 : 20;
                    
                    return (
                      <div
                        key={i}
                        className="orbit-item"
                        style={{
                          '--orbit-delay': `${i * 1.2}s`,
                          '--orbit-duration': '8s',
                          '--start-x': `${startX}px`,
                          '--mid-x': `${midX}px`,
                          '--end-x': `${endX}px`,
                          '--rotate-start': `${rotateStart}deg`,
                          '--rotate-mid': `${rotateMid}deg`,
                          '--rotate-end': `${rotateEnd}deg`,
                        } as React.CSSProperties}
                      >
                        <img
                          src={item.img}
                          alt={item.title || `Фото ${i + 1}`}
                          className="orbit-photo"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              
              <img 
                src="https://cdn.poehali.dev/files/лого 2.png" 
                alt="ИНДИГО" 
                className="h-48 md:h-64 w-auto mx-auto relative z-20"
              />
            </div>
            
            <p className="md:text-2xl text-muted-foreground max-w-2xl text-4xl mx-[111px] my-[17px]">Здесь рождаются звезды!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-lg px-8 animate-scale-in">
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Подать заявку
                </Button>
              </Link>
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

          {contestsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
            </div>
          ) : contests.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="Calendar" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">
                Скоро здесь появятся новые конкурсы
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {contests.map((contest, index) => (
                <Link key={contest.id} to={`/contests`}>
                  <Card
                    className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className={`h-40 ${getContestColor(index)} flex items-center justify-center overflow-hidden`}>
                      {contest.poster_url ? (
                        <img 
                          src={contest.poster_url} 
                          alt={contest.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl opacity-20">🎭</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full mb-3">
                        {contest.status === 'active' ? 'Идет сейчас' : 'Скоро'}
                      </div>
                      <h3 className="text-xl font-heading font-semibold mb-2">{contest.title}</h3>
                      {contest.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {contest.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <Icon name="Calendar" size={16} />
                        {formatDateRange(contest.start_date, contest.end_date)}
                      </p>
                      <Button variant="outline" className="w-full">
                        Подробнее
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
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