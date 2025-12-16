import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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

const GalleryPage = () => {
  const [filter, setFilter] = useState<number | 'all' | 'featured'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
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

  const getContestTitle = (contestId?: number) => {
    if (!contestId) return null;
    const contest = contests.find(c => c.id === contestId);
    return contest?.title;
  };

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

          <div className="mb-8 animate-fade-in">
            <h3 className="text-sm font-medium mb-3 text-center">Фильтр по конкурсам</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                Все работы
              </Button>
              <Button
                variant={filter === 'featured' ? 'default' : 'outline'}
                onClick={() => setFilter('featured')}
                className={filter === 'featured' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Star" size={16} className="mr-2" />
                Избранное
              </Button>
              {contests.map((contest) => (
                <Button
                  key={contest.id}
                  variant={filter === contest.id ? 'default' : 'outline'}
                  onClick={() => setFilter(contest.id)}
                  className={filter === contest.id ? 'bg-secondary hover:bg-secondary/90' : ''}
                >
                  {contest.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-8 animate-fade-in">
            <h3 className="text-sm font-medium mb-3 text-center">Тип медиа</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="sm"
                variant={mediaFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setMediaFilter('all')}
                className={mediaFilter === 'all' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                Все
              </Button>
              <Button
                size="sm"
                variant={mediaFilter === 'photo' ? 'default' : 'outline'}
                onClick={() => setMediaFilter('photo')}
                className={mediaFilter === 'photo' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Image" size={16} className="mr-2" />
                Фото
              </Button>
              <Button
                size="sm"
                variant={mediaFilter === 'video' ? 'default' : 'outline'}
                onClick={() => setMediaFilter('video')}
                className={mediaFilter === 'video' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Video" size={16} className="mr-2" />
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
              <Icon name="ImageOff" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">
                В этой категории пока нет работ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filteredItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    {item.media_type === 'photo' ? (
                      <img 
                        src={item.file_url} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <>
                        <video 
                          src={item.file_url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Icon name="Play" size={48} className="text-white" />
                        </div>
                      </>
                    )}
                    {item.is_featured && (
                      <div className="absolute top-2 right-2 bg-secondary text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Icon name="Star" size={12} />
                        Избранное
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-lg mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      {item.contest_id && (
                        <span className="text-xs bg-muted px-2 py-1 rounded line-clamp-1">
                          {getContestTitle(item.contest_id)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(item.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-heading font-bold">{selectedItem.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                <Icon name="X" size={24} />
              </Button>
            </div>
            
            <div className="p-6">
              {selectedItem.media_type === 'photo' ? (
                <img 
                  src={selectedItem.file_url} 
                  alt={selectedItem.title}
                  className="w-full rounded-lg"
                />
              ) : (
                <video 
                  src={selectedItem.file_url}
                  controls
                  className="w-full rounded-lg"
                  autoPlay
                />
              )}
              
              {selectedItem.description && (
                <p className="mt-4 text-muted-foreground">
                  {selectedItem.description}
                </p>
              )}
              
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                {selectedItem.contest_id && (
                  <div className="flex items-center gap-2">
                    <Icon name="Trophy" size={16} />
                    {getContestTitle(selectedItem.contest_id)}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={16} />
                  {new Date(selectedItem.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default GalleryPage;
