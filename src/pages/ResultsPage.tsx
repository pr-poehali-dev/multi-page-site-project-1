import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSEO } from '@/hooks/useSEO';

type ContestResult = {
  id: number;
  contest_id: number;
  title: string;
  description: string;
  pdf_url: string;
  published_date: string;
  contest_title: string;
  start_date: string;
  end_date: string;
};

const ResultsPage = () => {
  useSEO({
    title: 'Итоги и результаты конкурсов — списки лауреатов и дипломантов',
    description: 'Результаты и итоги конкурсов ИНДИГО по вокалу, хореографии, театру и музыке. Протоколы оценивания, списки лауреатов и дипломантов, гран-при.',
    keywords: 'результаты конкурса, итоги конкурса, список лауреатов конкурса, дипломанты конкурса, протоколы оценивания, гран при конкурса',
    path: '/results',
  });
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/7ff9bf2f-1648-49f2-9137-02fe1da936eb');
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Ошибка загрузки итогов:', error);
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getYear = (dateStr: string) => {
    if (!dateStr) return null;
    const y = new Date(dateStr).getFullYear();
    return Number.isNaN(y) ? null : y;
  };

  const years = Array.from(
    new Set(results.map(r => getYear(r.published_date)).filter((y): y is number => y !== null))
  ).sort((a, b) => b - a);

  const uniqueContests = Array.from(
    new Map(results.map(r => [r.contest_id, { id: r.contest_id, title: r.contest_title }])).values()
  );

  const filteredResults = results
    .filter(r => (selectedContest ? r.contest_id === selectedContest : true))
    .filter(r => (selectedYear !== 'all' ? getYear(r.published_date) === Number(selectedYear) : true));

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center py-20">
              <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-10 -left-24 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 -right-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />

        <div className="container mx-auto relative">
          <div className="text-center mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Icon name="Trophy" size={16} />
              Результаты конкурсов
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
              Итоги конкурсов
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Протоколы, лауреаты и гран-при прошедших конкурсов ИНДИГО
            </p>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12 animate-fade-in">
              <Card className="p-5 text-center border-2 border-secondary/10">
                <div className="text-3xl font-heading font-bold text-secondary mb-1">{results.length}</div>
                <div className="text-xs text-muted-foreground">Опубликовано итогов</div>
              </Card>
              <Card className="p-5 text-center border-2 border-secondary/10">
                <div className="text-3xl font-heading font-bold text-secondary mb-1">{uniqueContests.length}</div>
                <div className="text-xs text-muted-foreground">Конкурсов</div>
              </Card>
              <Card className="p-5 text-center border-2 border-secondary/10 col-span-2 sm:col-span-1">
                <div className="text-3xl font-heading font-bold text-secondary mb-1">{years.length}</div>
                <div className="text-xs text-muted-foreground">Сезонов</div>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in">
            {years.length > 0 && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48 rounded-full">
                  <Icon name="CalendarDays" size={16} className="mr-2 text-secondary" />
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все годы</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {uniqueContests.length > 0 && (
              <Select
                value={selectedContest === null ? 'all' : String(selectedContest)}
                onValueChange={(value) => setSelectedContest(value === 'all' ? null : Number(value))}
              >
                <SelectTrigger className="w-64 rounded-full">
                  <Icon name="Trophy" size={16} className="mr-2 text-secondary" />
                  <SelectValue placeholder="Конкурс" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все конкурсы</SelectItem>
                  {uniqueContests.map((contest) => (
                    <SelectItem key={contest.id} value={String(contest.id)}>
                      {contest.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <Card className="p-12 text-center max-w-2xl mx-auto">
              <Icon name="Trophy" size={64} className="mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-2xl font-semibold mb-2">Пока нет опубликованных итогов</h3>
              <p className="text-muted-foreground">
                Результаты конкурсов появятся здесь после их завершения
              </p>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary/40 via-secondary/20 to-transparent sm:-translate-x-1/2" />

              <div className="space-y-10">
                {filteredResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="relative pl-16 sm:pl-0 animate-fade-in"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="absolute left-6 sm:left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full bg-secondary border-4 border-background shadow z-10" />

                    <div className={`sm:flex ${index % 2 === 0 ? 'sm:justify-start' : 'sm:justify-end'}`}>
                      <div className="sm:w-[46%]">
                        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 border-transparent hover:border-secondary/20">
                          <div className="bg-gradient-to-br from-primary to-secondary text-white p-6 relative overflow-hidden">
                            <Icon name="Trophy" size={80} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative">
                              {getYear(result.published_date) && (
                                <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3">
                                  {getYear(result.published_date)}
                                </span>
                              )}
                              <h2 className="text-2xl font-heading font-bold mb-2">{result.title}</h2>
                              <div className="flex items-center gap-2 text-white/90 text-sm">
                                <Icon name="Trophy" size={16} />
                                <span className="line-clamp-1">{result.contest_title}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <Icon name="Calendar" size={16} />
                              <span>Опубликовано: {formatDate(result.published_date)}</span>
                            </div>

                            {result.description && (
                              <p className="text-muted-foreground mb-5 whitespace-pre-wrap line-clamp-4">
                                {result.description}
                              </p>
                            )}

                            {result.pdf_url && (
                              <Button
                                className="w-full bg-secondary hover:bg-secondary/90 gap-2"
                                onClick={() => window.open(result.pdf_url, '_blank')}
                              >
                                <Icon name="Download" size={18} />
                                Скачать протокол (PDF)
                              </Button>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-20 text-center bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl p-12 max-w-3xl mx-auto relative overflow-hidden">
            <Icon name="Sparkles" size={120} className="absolute -top-6 -right-6 text-secondary/10" />
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-heading font-bold mb-4">
              Хотите стать следующим победителем?
            </h3>
            <p className="text-muted-foreground mb-6">
              Регистрируйтесь на открытые конкурсы и покажите свой талант
            </p>
            <a
              href="/contests"
              className="inline-block px-8 py-3 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors font-semibold shadow-lg"
            >
              Посмотреть конкурсы
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResultsPage;