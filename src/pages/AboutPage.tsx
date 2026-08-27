import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';

const GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=gallery';

interface GalleryItem {
  id: number;
  title: string;
  file_url: string;
  media_type: 'photo' | 'video';
}

const AboutPage = () => {
  useSEO({
    title: 'О нас — международный конкурсный проект для детей',
    description: 'ИНДИГО — международный и всероссийский конкурсный проект для детей и творческих коллективов. Более 600 участников, 67+ конкурсов, признание в 5 странах, включая Беларусь и Южную Осетию.',
    keywords: 'о конкурсе ИНДИГО, международный творческий конкурс, всероссийский конкурс для детей, творческое объединение, детский конкурс отзывы, конкурс-фестиваль, фонд поддержки детского творчества, фестиваль детского и юношеского творчества, юные таланты, творческие коллективы, тур на конкурс, поездка на фестиваль',
    path: '/about',
  });
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryItem[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const response = await fetch(GALLERY_URL);
        const data = await response.json();
        const photos = (data.items || []).filter((item: GalleryItem) => item.media_type === 'photo');
        setGalleryPhotos(photos);
      } catch (error) {
        console.error('Error loading gallery:', error);
      }
    };
    loadGallery();
  }, []);

  useEffect(() => {
    if (galleryPhotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [galleryPhotos]);

  const stats = [
    { icon: 'Trophy', value: '50+', label: 'Конкурсов в год' },
    { icon: 'Users', value: '2500+', label: 'Участников в год' },
    { icon: 'Award', value: '250+', label: 'Грантов вручено' },
    { icon: 'Star', value: '30+', label: 'Экспертов в жюри' },
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

  const getFanPhotos = (side: 'left' | 'right') => {
    if (galleryPhotos.length === 0) return [];
    const startIndex = side === 'left' ? currentPhotoIndex : currentPhotoIndex + 4;
    return Array.from({ length: 5 }, (_, i) => {
      const index = (startIndex + i) % galleryPhotos.length;
      return galleryPhotos[index];
    });
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative">
        {galleryPhotos.length > 0 && (
          <>
            <div className="fan-container fan-left">
              {getFanPhotos('left').map((photo, i) => (
                <div
                  key={`left-${photo?.id || i}`}
                  className="fan-photo"
                  style={{
                    '--fan-index': i,
                    '--fan-rotation': `${-40 + i * 20}deg`,
                  } as React.CSSProperties}
                >
                  <img src={photo?.file_url} alt={photo?.title} />
                </div>
              ))}
            </div>

            <div className="fan-container fan-right">
              {getFanPhotos('right').map((photo, i) => (
                <div
                  key={`right-${photo?.id || i}`}
                  className="fan-photo"
                  style={{
                    '--fan-index': i,
                    '--fan-rotation': `${40 - i * 20}deg`,
                  } as React.CSSProperties}
                >
                  <img src={photo?.file_url} alt={photo?.title} />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="container mx-auto max-w-5xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 text-center animate-fade-in bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            О платформе ИНДИГО
          </h1>
          <p className="text-2xl md:text-3xl text-center mb-16 animate-fade-in font-medium leading-relaxed">
            Современная конкурсная платформа для артистов всех направлений
          </p>

          <div className="max-w-3xl mx-auto mb-20 space-y-8 animate-fade-in">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-white to-muted/30 shadow-xl">
              <p className="text-xl md:text-2xl leading-relaxed text-center font-light">
                Мы создали творческое объединение <span className="font-bold text-secondary">"ИНДИГО"</span> с одной целью — дать возможность талантливым артистам показать свое мастерство и получить признание на международном уровне.
              </p>
            </Card>
            
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl">
              <p className="text-lg md:text-xl leading-relaxed text-center">
                Наша платформа объединяет музыкантов, вокалистов, танцоров и других творческих личностей. С момента основания мы провели более <span className="font-bold text-primary">67 конкурсов</span>, в которых приняли участие артисты из <span className="font-bold text-secondary">5 стран мира</span>.
              </p>
            </Card>

            <Card className="p-8 md:p-12 bg-gradient-to-br from-secondary/5 to-primary/5 shadow-xl">
              <p className="text-lg md:text-xl leading-relaxed text-center">
                Каждый конкурс оценивается профессиональным жюри, состоящим из известных деятелей искусства. Мы создаем возможности для роста и развития талантов на большой сцене.
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 rounded-2xl bg-gradient-to-br from-primary to-secondary py-10 px-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon name={stat.icon} size={26} className="text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-heading font-bold mb-1 text-white">{stat.value}</div>
                <div className="text-sm text-white/90">{stat.label}</div>
              </div>
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