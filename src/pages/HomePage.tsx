import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';

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
  application_form_url?: string;
  pdf_url?: string;
  location?: string;
  event_date?: string;
}

const HomePage = () => {
  useSEO({
    title: 'Конкурсы и фестивали для детей: вокал, хореография, театр',
    description: 'ИНДИГО — международные и всероссийские творческие конкурсы и фестивали для детей: вокал, хореография, театр, инструментальная музыка. Очно, заочно и онлайн — участники из России, Беларуси, Казахстана и Узбекистана.',
    keywords: 'детский конкурс, детский фестиваль, конкурсы для детей, творческий конкурс для детей, вокальный конкурс, хореографический конкурс, международный конкурс для детей, всероссийский конкурс для детей, конкурс ИНДИГО',
    path: '/',
  });
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
        const now = new Date();
        const upcomingContests = (contestsData.contests || [])
          .filter((c: Contest) => new Date(c.end_date) >= now)
          .sort((a: Contest, b: Contest) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
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


  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/bucket/2ed1068b-f0ff-4a37-bd51-5148f07c1d8c.mp4"
        />
        <div className="absolute inset-0 bg-background/70 z-0" />
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
                src="https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/bucket/02cf2a9d-772a-4e52-a691-79f2bf6e4461.png" 
                alt="ИНДИГО" 
                className="w-auto mx-auto relative z-20 object-contain" style={{ height: 'clamp(128px, 48vw, 768px)' }}
              />
            </div>
            
            <img src="https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/bucket/d7969e35-7237-45a5-a6f9-1478e611b8d5.png" alt="Здесь рождаются звезды!" className="mx-auto mt-[-80px] mb-[10px] w-auto max-w-3xl" style={{ height: 'clamp(90px, 22vw, 200px)', filter: 'contrast(1.3) brightness(0.85)' }} />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contests">
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
                    <Icon name={feature.icon} size={32} className="text-white" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {contests.map((contest, index) => {
                const now = new Date();
                const end = new Date(contest.end_date);
                const start = new Date(contest.start_date);
                const isPast = end < now;
                const isActive = start <= now && end >= now;
                const statusDot = isPast ? 'bg-gray-400' : isActive ? 'bg-green-500' : 'bg-orange-400';
                const statusLabel = isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро';
                const palettes = [
                  { header: 'from-violet-600 to-purple-500', border: 'border-violet-300', badge: 'bg-violet-600' },
                  { header: 'from-pink-500 to-rose-500', border: 'border-pink-300', badge: 'bg-pink-500' },
                  { header: 'from-indigo-600 to-violet-500', border: 'border-indigo-300', badge: 'bg-indigo-600' },
                  { header: 'from-fuchsia-500 to-pink-500', border: 'border-fuchsia-300', badge: 'bg-fuchsia-500' },
                  { header: 'from-purple-600 to-fuchsia-500', border: 'border-purple-300', badge: 'bg-purple-600' },
                ];
                const palette = palettes[index % palettes.length];
                return (
                  <Link key={contest.id} to={`/contests/${contest.id}`}>
                    <div
                      className={`rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer animate-scale-in border ${palette.border} ${isPast ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className={`bg-gradient-to-br ${palette.header} px-5 pt-5 pb-4`}>
                        <h2 className="text-lg font-heading font-bold leading-tight text-white">
                          {contest.title}
                        </h2>
                        {contest.location && (
                          <p className="text-sm text-white/75 mt-1 font-normal">{contest.location}</p>
                        )}
                        {contest.event_date && (
                          <span className="inline-block mt-2 px-4 py-1.5 rounded-md text-sm font-bold bg-black/30 text-white">
                            {contest.event_date}
                          </span>
                        )}
                      </div>
                      <div className="relative bg-muted" style={{ aspectRatio: '4/3' }}>
                        {contest.poster_url ? (
                          <img
                            src={contest.poster_url}
                            alt={contest.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-6xl">
                            🎭
                          </div>
                        )}
                        <span className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${palette.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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