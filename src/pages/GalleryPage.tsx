import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useSEO } from '@/hooks/useSEO';

const GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=gallery';
const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url?: string;
  media_type: 'photo' | 'video';
  contest_id?: number;
  is_featured: boolean;
  created_at: string;
}

interface Contest {
  id: number;
  title: string;
  status: string;
}

const ASPECTS = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[4/3]'];

const GalleryPage = () => {
  useSEO({
    title: 'Галерея — фото и видео с конкурсов вокала, хореографии и театра',
    description: 'Фото и видео лучших выступлений участников конкурсов ИНДИГО: вокал, хореография, театр, инструментальная музыка. Яркие моменты детских творческих фестивалей.',
    keywords: 'галерея конкурса, фото конкурсов для детей, видео выступлений детей, конкурс вокала фото, конкурс хореографии видео',
    path: '/gallery',
  });
  const [filter, setFilter] = useState<number | 'all' | 'featured'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [galleryResponse, contestsResponse] = await Promise.all([
        fetch(GALLERY_URL),
        fetch(CONTESTS_URL)
      ]);

      const galleryData = await galleryResponse.json();
      const contestsData = await contestsResponse.json();

      setItems(galleryData.items || []);
      setContests(contestsData.contests || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить галерею',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    let filtered = items;

    if (filter === 'featured') {
      filtered = filtered.filter(item => item.is_featured);
    } else if (filter !== 'all') {
      filtered = filtered.filter(item => item.contest_id === filter);
    }

    if (mediaFilter !== 'all') {
      filtered = filtered.filter(item => item.media_type === mediaFilter);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const selectedItem = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const showPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
  };
  const showNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % filteredItems.length);
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-10 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />

        <div className="container mx-auto relative">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Icon name="Sparkles" size={16} />
              Яркие моменты
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4">
              Галерея
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">Моменты которые остаются в сердце навсегда!</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in">
            <Select
              value={String(filter)}
              onValueChange={(value) => {
                if (value === 'all' || value === 'featured') {
                  setFilter(value);
                } else {
                  setFilter(Number(value));
                }
              }}
            >
              <SelectTrigger className="w-64 rounded-full">
                <SelectValue placeholder="Выберите конкурс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все работы</SelectItem>
                <SelectItem value="featured">
                  <span className="inline-flex items-center gap-2">
                    <Icon name="Star" size={16} />
                    Избранное
                  </span>
                </SelectItem>
                {contests.map((contest) => (
                  <SelectItem key={contest.id} value={String(contest.id)}>
                    {contest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="inline-flex bg-muted rounded-full p-1 gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMediaFilter('all')}
                className={`rounded-full ${mediaFilter === 'all' ? 'bg-white shadow text-secondary' : 'text-muted-foreground'}`}
              >
                Все
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMediaFilter('photo')}
                className={`rounded-full gap-1.5 ${mediaFilter === 'photo' ? 'bg-white shadow text-secondary' : 'text-muted-foreground'}`}
              >
                <Icon name="Image" size={15} />
                Фото
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMediaFilter('video')}
                className={`rounded-full gap-1.5 ${mediaFilter === 'video' ? 'bg-white shadow text-secondary' : 'text-muted-foreground'}`}
              >
                <Icon name="Video" size={15} />
                Видео
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="ImageOff" size={64} className="mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-xl text-muted-foreground">
                В этой категории пока нет работ
              </p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 max-w-7xl mx-auto">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`break-inside-avoid mb-3 group cursor-pointer relative overflow-hidden rounded-2xl bg-muted animate-scale-in ${ASPECTS[index % ASPECTS.length]}`}
                  style={{ animationDelay: `${(index % 12) * 0.05}s` }}
                  onClick={() => setSelectedIndex(index)}
                >
                  {item.media_type === 'photo' ? (
                    <img
                      src={item.file_url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <>
                      <video
                        src={item.file_url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Icon name="Play" size={24} className="text-secondary ml-0.5" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
                      <Icon name="Maximize2" size={18} className="text-secondary" />
                    </div>
                  </div>

                  {item.is_featured && (
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-secondary/90 backdrop-blur-sm flex items-center justify-center shadow">
                      <Icon name="Star" size={14} className="text-white fill-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={() => setSelectedIndex(null)}
          >
            <Icon name="X" size={22} />
          </button>

          {filteredItems.length > 1 && (
            <>
              <button
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
              >
                <Icon name="ChevronLeft" size={24} />
              </button>
              <button
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); showNext(); }}
              >
                <Icon name="ChevronRight" size={24} />
              </button>
            </>
          )}

          <div
            className="max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.media_type === 'photo' ? (
              <img
                src={selectedItem.file_url}
                alt=""
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <video
                src={selectedItem.file_url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default GalleryPage;