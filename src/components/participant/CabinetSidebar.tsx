import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import NewsDetailModal, { NewsItem } from '@/components/participant/NewsDetailModal';

const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';
const NEWS_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?entity=news&action=public';

interface Contest {
  id: number;
  title: string;
  location?: string;
  event_date?: string;
  end_date: string;
  poster_url?: string;
}

const CabinetSidebar = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const loadContests = async () => {
      try {
        const res = await fetch(CONTESTS_URL);
        const data = await res.json();
        const now = new Date();
        const upcoming = (data.contests || [])
          .filter((c: Contest) => c.location && new Date(c.end_date) >= now)
          .sort((a: Contest, b: Contest) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
          .slice(0, 4);
        setContests(upcoming);
      } catch {
        setContests([]);
      } finally {
        setLoadingContests(false);
      }
    };

    const loadNews = async () => {
      try {
        const res = await fetch(NEWS_URL);
        const data = await res.json();
        setNews((data.news || []).slice(0, 4));
      } catch {
        setNews([]);
      } finally {
        setLoadingNews(false);
      }
    };

    loadContests();
    loadNews();
  }, []);

  return (
    <div className="space-y-8">
      {/* Ближайшие очные конкурсы */}
      <Card className="overflow-hidden border-primary/15">
        <div className="bg-gradient-to-br from-primary to-purple-500 px-6 py-5">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">Ближайшие конкурсы</h3>
        </div>
        <div className="p-4">
          {loadingContests ? (
            <div className="py-8 flex justify-center">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          ) : contests.length === 0 ? (
            <p className="text-base text-muted-foreground text-center py-6">Пока нет запланированных очных туров</p>
          ) : (
            <div className="space-y-3">
              {contests.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/contests/${c.id}`)}
                  className="w-full text-left rounded-xl p-4 hover:bg-muted/70 transition-colors group flex items-start gap-4"
                >
                  {c.poster_url ? (
                    <img src={c.poster_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="Trophy" size={26} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                      {c.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{c.location}</p>
                    {c.event_date && (
                      <span className="inline-block mt-1.5 text-sm font-medium text-secondary">{c.event_date}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Новости ИНДИГО */}
      <Card className="overflow-hidden border-secondary/15">
        <div className="bg-gradient-to-br from-secondary to-pink-500 px-6 py-5">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Icon name="Newspaper" size={22} />
            Новости ИНДИГО
          </h3>
        </div>
        <div className="p-4">
          {loadingNews ? (
            <div className="py-8 flex justify-center">
              <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
            </div>
          ) : news.length === 0 ? (
            <p className="text-base text-muted-foreground text-center py-6">Новостей пока нет</p>
          ) : (
            <div className="divide-y">
              {news.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNews(n)}
                  className="w-full text-left p-4 first:pt-2 last:pb-2 hover:bg-muted/70 transition-colors rounded-lg group"
                >
                  {n.image_url && (
                    <img src={n.image_url} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <p className="text-base font-semibold leading-tight mb-1.5 group-hover:text-secondary transition-colors">{n.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
};

export default CabinetSidebar;