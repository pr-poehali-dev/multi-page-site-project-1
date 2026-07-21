import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

const CabinetSidebar = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

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
    <div className="space-y-6">
      {/* Ближайшие очные конкурсы */}
      <Card className="overflow-hidden border-primary/15">
        <div className="bg-gradient-to-br from-primary to-purple-500 px-5 py-4">
          <h3 className="font-heading font-bold text-white flex items-center gap-2">
            <Icon name="MapPin" size={18} />
            Ближайшие очные конкурсы
          </h3>
        </div>
        <div className="p-3">
          {loadingContests ? (
            <div className="py-6 flex justify-center">
              <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : contests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Пока нет запланированных очных туров</p>
          ) : (
            <div className="space-y-2">
              {contests.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/contests/${c.id}`)}
                  className="w-full text-left rounded-xl p-3 hover:bg-muted/70 transition-colors group flex items-start gap-3"
                >
                  {c.poster_url ? (
                    <img src={c.poster_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="Trophy" size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.location}</p>
                    {c.event_date && (
                      <span className="inline-block mt-1 text-xs font-medium text-secondary">{c.event_date}</span>
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
        <div className="bg-gradient-to-br from-secondary to-pink-500 px-5 py-4">
          <h3 className="font-heading font-bold text-white flex items-center gap-2">
            <Icon name="Newspaper" size={18} />
            Новости ИНДИГО
          </h3>
        </div>
        <div className="p-3">
          {loadingNews ? (
            <div className="py-6 flex justify-center">
              <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : news.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Новостей пока нет</p>
          ) : (
            <div className="divide-y">
              {news.map((n) => (
                <div key={n.id} className="p-3 first:pt-2 last:pb-2">
                  {n.image_url && (
                    <img src={n.image_url} alt="" className="w-full h-28 object-cover rounded-lg mb-2" />
                  )}
                  <p className="text-sm font-semibold leading-tight mb-1">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CabinetSidebar;
