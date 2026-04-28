import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  rules?: string;
  prizes?: string;
  categories?: string;
  pdf_url?: string;
}

const GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=gallery';

interface GalleryItem {
  id: number;
  title: string;
  file_url: string;
  media_type: 'photo' | 'video';
  contest_id?: number;
}

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

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [photosToShow, setPhotosToShow] = useState<{ img: string; side: string; title?: string }[]>([]);

  useEffect(() => {
    loadContest();
    loadPhotos();
  }, [id]);

  const loadContest = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      const foundContest = data.contests?.find((c: Contest) => c.id === Number(id));
      setContest(foundContest || null);
    } catch (error) {
      console.error('Ошибка загрузки конкурса:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await fetch(GALLERY_URL);
      const data = await response.json();
      const photos = (data.items || [])
        .filter((item: GalleryItem) => item.media_type === 'photo')
        .slice(0, 8);
      if (photos.length >= 4) {
        setPhotosToShow(photos.map((p: GalleryItem, i: number) => ({
          img: p.file_url,
          side: i % 2 === 0 ? 'left' : 'right',
          title: p.title,
        })));
      } else {
        setPhotosToShow(defaultPhotos);
      }
    } catch {
      setPhotosToShow(defaultPhotos);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="text-center py-12">
            <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <Icon name="AlertCircle" size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-2xl font-semibold mb-2">Конкурс не найден</h3>
            <p className="text-muted-foreground mb-6">Такого конкурса не существует или он был удалён</p>
            <Button onClick={() => navigate('/contests')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Вернуться к списку
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  const now = new Date();
  const isActive = contest.status === 'active';
  const isPast = endDate < now;
  const isFuture = startDate > now;

  const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Водопад фото по бокам */}
      <div className="orbit-container" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1 }}>
        {photosToShow.map((item, i) => {
          const isLeft = item.side === 'left';
          const startX = isLeft ? -750 : 750;
          const midX = isLeft ? -730 : 730;
          const endX = isLeft ? -770 : 770;
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
              <img src={item.img} alt={item.title || `Фото ${i + 1}`} className="orbit-photo" />
            </div>
          );
        })}
      </div>

      <section className="pt-32 pb-20 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/contests')}
            className="mb-6"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            К списку конкурсов
          </Button>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <img 
                  src={contest.title.toLowerCase().includes('зимняя') 
                    ? 'https://cdn.poehali.dev/files/3D_логотип_фестиваля__Зимняя_мелодия__с_зимними_мо-no-bg-preview (carve.photos).png'
                    : 'https://cdn.poehali.dev/files/лого таланты.png'
                  }
                  alt="Логотип" 
                  className="w-32 h-32 object-contain"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold">
                      {contest.title}
                    </h1>
                    <Badge 
                      className={`ml-4 ${
                        isPast ? 'bg-gray-500' :
                        isActive ? 'bg-green-500' : 
                        'bg-orange-500'
                      }`}
                    >
                      {isPast ? 'Завершён' : isActive ? 'Активен' : 'Скоро'}
                    </Badge>
                  </div>
                  <p className="text-xl text-muted-foreground mb-6 whitespace-pre-wrap">
                    {contest.description}
                  </p>

                  {!isPast && (
                    <div className="flex items-center gap-2 p-4 bg-secondary/20 rounded-lg mb-6">
                      <Icon name="Clock" size={20} className="text-secondary" />
                      <span className="font-medium">
                        {isFuture ? (
                          `Старт через ${daysUntilStart} ${daysUntilStart === 1 ? 'день' : daysUntilStart < 5 ? 'дня' : 'дней'}`
                        ) : isActive ? (
                          daysUntilEnd > 0 
                            ? `Осталось ${daysUntilEnd} ${daysUntilEnd === 1 ? 'день' : daysUntilEnd < 5 ? 'дня' : 'дней'} до окончания`
                            : 'Последний день приёма заявок!'
                        ) : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg"
                      className="bg-secondary hover:bg-secondary/90"
                      disabled={isPast || isFuture}
                      onClick={() => navigate('/register')}
                    >
                      <Icon name="Send" size={20} className="mr-2" />
                      {isPast ? 'Конкурс завершён' : isFuture ? 'Скоро откроется приём заявок' : 'Подать заявку'}
                    </Button>
                    {contest.pdf_url && (
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => window.open(contest.pdf_url, '_blank')}
                      >
                        <Icon name="FileText" size={20} className="mr-2" />
                        Скачать положение (PDF)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="info">
                    <Icon name="Info" size={18} className="mr-2" />
                    Информация
                  </TabsTrigger>
                  <TabsTrigger value="rules">
                    <Icon name="FileText" size={18} className="mr-2" />
                    Правила
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                    <Icon name="List" size={18} className="mr-2" />
                    Категории
                  </TabsTrigger>
                  <TabsTrigger value="prizes">
                    <Icon name="Trophy" size={18} className="mr-2" />
                    Призы
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon name="Calendar" size={24} className="text-primary" />
                      Даты проведения
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="CalendarDays" size={20} className="text-green-500" />
                          <h4 className="font-semibold">Начало приёма заявок</h4>
                        </div>
                        <p className="text-2xl font-bold">
                          {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {startDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                        </p>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="CalendarX" size={20} className="text-red-500" />
                          <h4 className="font-semibold">Окончание приёма</h4>
                        </div>
                        <p className="text-2xl font-bold">
                          {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {endDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                        </p>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon name="Users" size={24} className="text-primary" />
                      Кто может участвовать
                    </h3>
                    <Card className="p-6">
                      <p className="text-muted-foreground">
                        В конкурсе могут принять участие все желающие независимо от возраста. 
                        Участники делятся на возрастные категории для справедливого оценивания.
                      </p>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon name="FileCheck" size={24} className="text-primary" />
                      Как подать заявку
                    </h3>
                    <Card className="p-6">
                      <ol className="space-y-3 list-decimal list-inside">
                        <li>Заполните форму заявки на сайте</li>
                        <li>Укажите свои контактные данные</li>
                        <li>Выберите категорию участия</li>
                        <li>Дождитесь подтверждения на email</li>
                        <li>Следуйте инструкциям организаторов</li>
                      </ol>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Общие правила</h3>
                    {contest.rules ? (
                      <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-wrap">{contest.rules}</p>
                      </div>
                    ) : (
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                          <span>Участие бесплатное</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                          <span>Один участник может подать несколько заявок в разных категориях</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                          <span>Все материалы должны быть авторскими</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                          <span>Решение жюри является окончательным</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                          <span>Результаты будут опубликованы на сайте</span>
                        </li>
                      </ul>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Категории участия</h3>
                    {contest.categories ? (
                      <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-wrap">{contest.categories}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Дети (до 12 лет)</h4>
                          <p className="text-sm text-muted-foreground">Младшая возрастная категория</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Подростки (13-17 лет)</h4>
                          <p className="text-sm text-muted-foreground">Средняя возрастная категория</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Молодёжь (18-25 лет)</h4>
                          <p className="text-sm text-muted-foreground">Старшая возрастная категория</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Взрослые (26+ лет)</h4>
                          <p className="text-sm text-muted-foreground">Взрослая категория</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="prizes" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Призовой фонд</h3>
                    {contest.prizes ? (
                      <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-wrap">{contest.prizes}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6 border-2 border-yellow-500/50 bg-yellow-500/5">
                          <div className="text-center">
                            <Icon name="Trophy" size={48} className="mx-auto mb-3 text-yellow-500" />
                            <h4 className="text-2xl font-bold mb-2">1 место</h4>
                            <p className="text-3xl font-bold text-yellow-600 mb-2">🥇</p>
                            <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                          </div>
                        </Card>
                        <Card className="p-6 border-2 border-gray-400/50 bg-gray-400/5">
                          <div className="text-center">
                            <Icon name="Award" size={48} className="mx-auto mb-3 text-gray-500" />
                            <h4 className="text-2xl font-bold mb-2">2 место</h4>
                            <p className="text-3xl font-bold text-gray-500 mb-2">🥈</p>
                            <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                          </div>
                        </Card>
                        <Card className="p-6 border-2 border-orange-500/50 bg-orange-500/5">
                          <div className="text-center">
                            <Icon name="Medal" size={48} className="mx-auto mb-3 text-orange-600" />
                            <h4 className="text-2xl font-bold mb-2">3 место</h4>
                            <p className="text-3xl font-bold text-orange-600 mb-2">🥉</p>
                            <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                          </div>
                        </Card>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-6 text-center">
                      Все участники получают сертификаты участия
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestDetailPage;