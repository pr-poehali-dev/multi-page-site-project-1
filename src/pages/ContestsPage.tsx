import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
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

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const pluralDays = (n: number) =>
    n === 1 ? 'день' : n < 5 ? 'дня' : 'дней';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
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
            <div className="flex flex-col gap-8">
              {contests.map((contest, index) => {
                const startDate = new Date(contest.start_date);
                const endDate = new Date(contest.end_date);
                const now = new Date();
                const isActive = contest.status === 'active';
                const isPast = endDate < now;
                const isFuture = startDate > now;
                const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                const statusColor = isPast
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : isActive
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-orange-50 text-orange-600 border-orange-200';

                const statusDot = isPast ? 'bg-gray-400' : isActive ? 'bg-green-500' : 'bg-orange-400';
                const statusLabel = isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро';

                return (
                  <div
                    key={contest.id}
                    className={`rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-scale-in ${isPast ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {/* Шапка карточки */}
                    <div className="relative bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 px-6 pt-6 pb-5 border-b border-border">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-heading font-bold leading-tight flex-1">
                          {contest.title}
                        </h2>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap ${statusColor}`}>
                          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                          {statusLabel}
                        </span>
                      </div>

                      {/* Даты */}
                      <div className="flex flex-wrap gap-6 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="CalendarDays" size={16} className="text-primary shrink-0" />
                          <span className="text-muted-foreground">Начало:</span>
                          <span className="font-semibold">{formatDate(startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="CalendarX" size={16} className="text-secondary shrink-0" />
                          <span className="text-muted-foreground">Окончание:</span>
                          <span className="font-semibold">{formatDate(endDate)}</span>
                        </div>
                        {!isPast && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="Clock" size={16} className="text-amber-500 shrink-0" />
                            <span className="font-semibold text-amber-600">
                              {isFuture
                                ? `Старт через ${daysUntilStart} ${pluralDays(daysUntilStart)}`
                                : daysUntilEnd > 0
                                ? `Осталось ${daysUntilEnd} ${pluralDays(daysUntilEnd)}`
                                : 'Последний день приёма!'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Тело карточки */}
                    <div className="flex flex-col md:flex-row">
                      {contest.poster_url && (
                        <div className="md:w-56 shrink-0 border-r border-border overflow-hidden">
                          <img
                            src={contest.poster_url}
                            alt={contest.title}
                            className="w-full h-48 md:h-full object-contain p-3"
                          />
                        </div>
                      )}

                      <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                        {contest.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                            {contest.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <Button
                            className="bg-secondary hover:bg-secondary/90 text-white"
                            disabled={isPast || isFuture || !contest.application_form_url}
                            onClick={() => contest.application_form_url && window.open(contest.application_form_url, '_blank')}
                          >
                            <Icon name="Send" size={16} className="mr-2" />
                            {isPast ? 'Конкурс завершён' : isFuture ? 'Скоро откроется' : 'Подать заявку'}
                          </Button>
                          {contest.pdf_url && (
                            <Button variant="outline" onClick={() => window.open(contest.pdf_url, '_blank')}>
                              <Icon name="FileText" size={16} className="mr-2" />
                              Положение
                            </Button>
                          )}
                          {contest.application_form_url && (
                            <Button variant="outline" onClick={() => window.open(contest.application_form_url, '_blank')}>
                              <Icon name="FileDown" size={16} className="mr-2" />
                              Бланк заявки
                            </Button>
                          )}
                          <Button variant="ghost" onClick={() => navigate(`/contests/${contest.id}`)}>
                            <Icon name="Info" size={16} className="mr-2" />
                            Подробнее
                          </Button>
                        </div>
                      </div>
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
