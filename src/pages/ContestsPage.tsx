import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import { useSEO } from '@/hooks/useSEO';

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

const palettes = [
  { header: 'from-violet-600 to-purple-500', border: 'border-violet-300', text: 'text-white', badge: 'bg-violet-600' },
  { header: 'from-pink-500 to-rose-500', border: 'border-pink-300', text: 'text-white', badge: 'bg-pink-500' },
  { header: 'from-indigo-600 to-violet-500', border: 'border-indigo-300', text: 'text-white', badge: 'bg-indigo-600' },
  { header: 'from-fuchsia-500 to-pink-500', border: 'border-fuchsia-300', text: 'text-white', badge: 'bg-fuchsia-500' },
  { header: 'from-purple-600 to-fuchsia-500', border: 'border-purple-300', text: 'text-white', badge: 'bg-purple-600' },
];

const ContestCard = ({ contest, index, isPast }: { contest: Contest; index: number; isPast: boolean }) => {
  const navigate = useNavigate();
  const endDate = new Date(contest.end_date);
  const startDate = new Date(contest.start_date);
  const now = new Date();
  const isActive = contest.status === 'active';
  const isFuture = startDate > now;

  const statusDot = isPast ? 'bg-gray-400' : isActive ? 'bg-green-500' : 'bg-orange-400';
  const statusLabel = isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро';

  const palette = palettes[index % palettes.length];

  return (
    <div
      onClick={() => navigate(`/contests/${contest.id}`)}
      className={`rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer animate-scale-in border ${palette.border} ${isPast ? 'opacity-70' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className={`bg-gradient-to-br ${palette.header} px-5 pt-5 pb-4`}>
        <h2 className={`text-lg font-heading font-bold leading-tight ${palette.text}`}>
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
  );
};

const ContestsPage = () => {
  useSEO({
    title: 'Календарь конкурсов и фестивалей — вокал, хореография, театр, музыка',
    description: 'Календарь международных и всероссийских конкурсов ИНДИГО: вокальные, хореографические, театральные и инструментальные номинации. Очно, заочно и онлайн. Подайте заявку и станьте лауреатом!',
    keywords: 'календарь конкурсов, конкурс вокала, конкурс хореографии, конкурс танцев, театральный конкурс, конкурс инструментальной музыки, всероссийский конкурс, международный конкурс, подать заявку на конкурс',
    path: '/contests',
  });
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'active' | 'archive'>('active');
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      const now = new Date();
      const sorted = (data.contests || []).sort((a: Contest, b: Contest) => {
        const endA = new Date(a.end_date);
        const endB = new Date(b.end_date);
        const isPastA = endA < now;
        const isPastB = endB < now;
        if (isPastA !== isPastB) return isPastA ? 1 : -1;
        return endA.getTime() - endB.getTime();
      });
      setContests(sorted);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const q = search.toLowerCase().trim();
  const activeContests = contests.filter(c => new Date(c.end_date) >= now && (!q || c.title.toLowerCase().includes(q)));
  const pastContests = contests.filter(c => new Date(c.end_date) < now && (!q || c.title.toLowerCase().includes(q)));

  const archiveYears = Array.from(
    new Set(pastContests.map(c => new Date(c.end_date).getFullYear()))
  ).sort((a, b) => b - a);

  const selectedYear = archiveYear ?? archiveYears[0] ?? null;

  const archiveContests = selectedYear
    ? pastContests.filter(c => new Date(c.end_date).getFullYear() === selectedYear)
    : [];

  const tabClass = (active: boolean) =>
    `px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-primary text-primary-foreground shadow'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`;

  const yearTabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-secondary text-secondary-foreground shadow'
        : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-3 text-center animate-fade-in">
            Календарь конкурсов
          </h1>
          <p className="text-lg text-muted-foreground text-center mb-10 animate-fade-in">
            Выберите направление и начните свой путь к победе
          </p>

          <div className="relative max-w-md mx-auto mb-8">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Загрузка конкурсов...</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 justify-center mb-8">
                <button className={tabClass(mainTab === 'active')} onClick={() => setMainTab('active')}>
                  Текущие
                  {activeContests.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-primary-foreground/20">
                      {activeContests.length}
                    </span>
                  )}
                </button>
                <button className={tabClass(mainTab === 'archive')} onClick={() => setMainTab('archive')}>
                  Архив
                  {pastContests.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-primary-foreground/20">
                      {pastContests.length}
                    </span>
                  )}
                </button>
              </div>

              {mainTab === 'active' && (
                activeContests.length === 0 ? (
                  <div className="text-center py-20">
                    <Icon name="Calendar" size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="text-2xl font-semibold mb-2">Конкурсы пока не запланированы</h3>
                    <p className="text-muted-foreground">Следите за обновлениями — скоро здесь появятся новые конкурсы!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeContests.map((contest, index) => (
                      <ContestCard key={contest.id} contest={contest} index={index} isPast={false} />
                    ))}
                  </div>
                )
              )}

              {mainTab === 'archive' && (
                pastContests.length === 0 ? (
                  <div className="text-center py-20">
                    <Icon name="Archive" size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="text-2xl font-semibold mb-2">Архив пока пуст</h3>
                    <p className="text-muted-foreground">Здесь будут отображаться завершённые конкурсы.</p>
                  </div>
                ) : (
                  <>
                    {archiveYears.length > 1 && (
                      <div className="flex gap-2 justify-center mb-8 flex-wrap">
                        {archiveYears.map(year => (
                          <button
                            key={year}
                            className={yearTabClass(selectedYear === year)}
                            onClick={() => setArchiveYear(year)}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {archiveContests.map((contest, index) => (
                        <ContestCard key={contest.id} contest={contest} index={index} isPast={true} />
                      ))}
                    </div>
                  </>
                )
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContestsPage;