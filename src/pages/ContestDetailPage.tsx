import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ContestDetailHero from '@/components/contest/ContestDetailHero';
import ContestDetailTabs from '@/components/contest/ContestDetailTabs';
import ContestPhotoBackground from '@/components/contest/ContestPhotoBackground';

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
  application_form_url?: string;
  event_date?: string;
  poster_url?: string;
  logo_url?: string;
  application_type?: 'external' | 'internal';
}

interface GalleryItem {
  id: number;
  title: string;
  file_url: string;
  media_type: 'photo' | 'video';
  contest_id?: number;
}

interface JuryMember {
  id: number;
  name: string;
  role: string;
  specialty?: string;
  image_url?: string;
  has_access: boolean;
}

const GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=gallery';
const SCORING_API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';

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
  const [juryMembers, setJuryMembers] = useState<JuryMember[]>([]);

  useEffect(() => {
    loadContest();
    loadPhotos();
    if (id) loadJury(id);
  }, [id]);

  const loadJury = async (contestId: string) => {
    try {
      const res = await fetch(`${SCORING_API}?action=jury_access&contest_id=${contestId}`);
      const data = await res.json();
      setJuryMembers((data.jury || []).filter((j: JuryMember) => j.has_access));
    } catch {
      // silent
    }
  };

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

      <ContestPhotoBackground photos={photosToShow} />

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

          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <ContestDetailHero
              contest={contest}
              isPast={isPast}
              isActive={isActive}
              isFuture={isFuture}
              daysUntilStart={daysUntilStart}
              daysUntilEnd={daysUntilEnd}
            />
            <ContestDetailTabs
              contest={contest}
              juryMembers={juryMembers}
            />
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestDetailPage;