import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
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
    title: 'Итоги конкурсов',
    description: 'Результаты и итоги конкурсов ИНДИГО. Протоколы оценивания, списки лауреатов и дипломантов.',
    keywords: 'итоги конкурса ИНДИГО, результаты, лауреаты, дипломанты, протоколы',
    path: '/results',
  });
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);

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

  const uniqueContests = Array.from(
    new Map(results.map(r => [r.contest_id, { id: r.contest_id, title: r.contest_title }])).values()
  );

  const filteredResults = selectedContest
    ? results.filter(r => r.contest_id === selectedContest)
    : results;

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
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Итоги конкурсов
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Результаты прошедших конкурсов и награждения
          </p>

          {uniqueContests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button
                variant={selectedContest === null ? 'default' : 'outline'}
                onClick={() => setSelectedContest(null)}
                className={selectedContest === null ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                Все конкурсы
              </Button>
              {uniqueContests.map((contest) => (
                <Button
                  key={contest.id}
                  variant={selectedContest === contest.id ? 'default' : 'outline'}
                  onClick={() => setSelectedContest(contest.id)}
                  className={selectedContest === contest.id ? 'bg-secondary hover:bg-secondary/90' : ''}
                >
                  {contest.title}
                </Button>
              ))}
            </div>
          )}

          {filteredResults.length === 0 ? (
            <Card className="p-12 text-center max-w-2xl mx-auto">
              <Icon name="Trophy" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">Пока нет опубликованных итогов</h3>
              <p className="text-muted-foreground">
                Результаты конкурсов появятся здесь после их завершения
              </p>
            </Card>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              {filteredResults.map((result, index) => (
                <div
                  key={result.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-primary to-secondary text-white p-8">
                      <h2 className="text-3xl font-heading font-bold mb-2">{result.title}</h2>
                      <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-2">
                          <Icon name="Trophy" size={18} />
                          <span>{result.contest_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Calendar" size={18} />
                          <span>Опубликовано: {formatDate(result.published_date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      {result.description && (
                        <p className="text-lg text-muted-foreground mb-6 whitespace-pre-wrap">
                          {result.description}
                        </p>
                      )}

                      {result.pdf_url && (
                        <div className="flex justify-center">
                          <Button
                            size="lg"
                            className="bg-secondary hover:bg-secondary/90"
                            onClick={() => window.open(result.pdf_url, '_blank')}
                          >
                            <Icon name="Download" size={20} className="mr-2" />
                            Скачать протокол (PDF)
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center bg-muted/30 rounded-3xl p-12 max-w-3xl mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-heading font-bold mb-4">
              Хотите стать следующим победителем?
            </h3>
            <p className="text-muted-foreground mb-6">
              Регистрируйтесь на открытые конкурсы и покажите свой талант
            </p>
            <a 
              href="/contests" 
              className="inline-block px-8 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
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