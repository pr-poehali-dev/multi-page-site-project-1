import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';

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
}

const ContestsPage = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      const now = new Date();
      const sortedContests = (data.contests || []).sort((a: Contest, b: Contest) => {
        const endA = new Date(a.end_date);
        const endB = new Date(b.end_date);
        const isPastA = endA < now;
        const isPastB = endB < now;
        if (isPastA !== isPastB) return isPastA ? 1 : -1;
        return endA.getTime() - endB.getTime();
      });
      setContests(sortedContests);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-3 text-center animate-fade-in">
            Календарь конкурсов
          </h1>
          <p className="text-lg text-muted-foreground text-center mb-14 animate-fade-in">
            Выберите направление и начните свой путь к победе
          </p>

          {loading ? (
            <div className="text-center py-20">
              <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Загрузка конкурсов...</p>
            </div>
          ) : contests.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="Calendar" size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-2xl font-semibold mb-2">Конкурсы пока не запланированы</h3>
              <p className="text-muted-foreground">Следите за обновлениями — скоро здесь появятся новые конкурсы!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((contest, index) => {
                const endDate = new Date(contest.end_date);
                const startDate = new Date(contest.start_date);
                const now = new Date();
                const isActive = contest.status === 'active';
                const isPast = endDate < now;
                const isFuture = startDate > now;

                const statusColor = isPast
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : isActive
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-orange-50 text-orange-600 border-orange-200';
                const statusDot = isPast ? 'bg-gray-400' : isActive ? 'bg-green-500' : 'bg-orange-400';
                const statusLabel = isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро';

                const palettes = [
                  { header: 'from-violet-600 to-purple-500', border: 'border-violet-300', text: 'text-white', badge: 'bg-violet-600' },
                  { header: 'from-pink-500 to-rose-500', border: 'border-pink-300', text: 'text-white', badge: 'bg-pink-500' },
                  { header: 'from-indigo-600 to-violet-500', border: 'border-indigo-300', text: 'text-white', badge: 'bg-indigo-600' },
                  { header: 'from-fuchsia-500 to-pink-500', border: 'border-fuchsia-300', text: 'text-white', badge: 'bg-fuchsia-500' },
                  { header: 'from-purple-600 to-fuchsia-500', border: 'border-purple-300', text: 'text-white', badge: 'bg-purple-600' },
                ];
                const palette = palettes[index % palettes.length];

                return (
                  <div
                    key={contest.id}
                    onClick={() => navigate(`/contests/${contest.id}`)}
                    className={`rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer animate-scale-in border ${palette.border} ${isPast ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className={`bg-gradient-to-br ${palette.header} px-5 pt-5 pb-4`}>
                      <h2 className={`text-lg font-heading font-bold leading-tight ${palette.text}`}>
                        {contest.title}
                      </h2>
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
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestsPage;