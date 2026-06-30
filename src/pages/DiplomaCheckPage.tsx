import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useSEO } from '@/hooks/useSEO';

const DIPLOMA_CHECK_URL = 'https://functions.poehali.dev/1806f979-38b3-442e-b8ef-fa6827104251';

const AWARD_COLORS: Record<string, string> = {
  'Гран-При': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Лауреат I': 'bg-amber-100 text-amber-800 border-amber-300',
  'Лауреат II': 'bg-orange-100 text-orange-800 border-orange-300',
  'Лауреат III': 'bg-blue-100 text-blue-800 border-blue-300',
  'Дипломант I': 'bg-teal-100 text-teal-800 border-teal-300',
  'Дипломант II': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Дипломант III': 'bg-sky-100 text-sky-800 border-sky-300',
  'Участник': 'bg-gray-100 text-gray-700 border-gray-300',
};

interface DiplomaResult {
  diploma_number: string;
  participant_name: string;
  director_name: string;
  directing_party: string;
  piece_title: string;
  nomination: string;
  award: string;
  contest_title: string;
  contest_location: string;
  contest_event_date: string;
  jury_members: Array<{ name: string; photo_url?: string; title?: string }>;
}

const DiplomaCheckPage = () => {
  useSEO({
    title: 'Проверка диплома',
    description: 'Проверьте подлинность диплома ИНДИГО по серии и номеру. Получите сведения об участнике, номинации и присвоенном звании.',
    keywords: 'проверка диплома ИНДИГО, подлинность диплома, номер диплома, лауреат, дипломант',
    path: '/diploma-check',
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiplomaResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    const num = input.trim().toUpperCase();
    if (!num) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`${DIPLOMA_CHECK_URL}?diploma_number=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Диплом не найден');
      }
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const awardClass = result?.award ? (AWARD_COLORS[result.award] || 'bg-muted text-muted-foreground border-border') : '';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Icon name="Award" size={32} className="text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">
              Проверка диплома
            </h1>
            <p className="text-muted-foreground text-lg">
              Введите серию и номер диплома для получения сведений об участнике
            </p>
          </div>

          <Card className="p-6 mb-8 animate-scale-in">
            <label className="block text-sm font-medium mb-2">Номер диплома</label>
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                placeholder="Например: AB000001"
                className="text-lg font-mono tracking-widest uppercase"
                maxLength={8}
              />
              <Button
                onClick={handleCheck}
                disabled={loading || !input.trim()}
                className="shrink-0"
              >
                {loading
                  ? <Icon name="Loader" size={18} className="animate-spin mr-2" />
                  : <Icon name="Search" size={18} className="mr-2" />}
                Проверить
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Формат: 2 буквы серии + 6 цифр номера (например, AB000123)
            </p>
          </Card>

          {error && (
            <Card className="p-5 border-destructive/40 bg-destructive/5 animate-fade-in">
              <div className="flex items-center gap-3">
                <Icon name="XCircle" size={20} className="text-destructive shrink-0" />
                <p className="text-destructive font-medium">{error}</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">{result.diploma_number}</p>
                    <h2 className="text-2xl font-heading font-bold">{result.participant_name}</h2>
                    {result.director_name && (
                      <p className="text-muted-foreground mt-1">Руководитель: {result.director_name}</p>
                    )}
                    {result.directing_party && (
                      <p className="text-muted-foreground mt-0.5">Направляющая сторона: {result.directing_party}</p>
                    )}
                  </div>
                  {result.award && (
                    <span className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border ${awardClass}`}>
                      {result.award}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Icon name="Trophy" size={12} /> Конкурс
                    </p>
                    <p className="font-semibold">{result.contest_title}</p>
                  </div>
                  {result.contest_location && (
                    <div className="p-4 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="MapPin" size={12} /> Город проведения
                      </p>
                      <p className="font-semibold">{result.contest_location}</p>
                    </div>
                  )}
                  {result.contest_event_date && (
                    <div className="p-4 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="Calendar" size={12} /> Дата проведения
                      </p>
                      <p className="font-semibold">{result.contest_event_date}</p>
                    </div>
                  )}
                  {result.piece_title && (
                    <div className="p-4 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="Music" size={12} /> Номер / произведение
                      </p>
                      <p className="font-semibold">{result.piece_title}</p>
                    </div>
                  )}
                  {result.nomination && (
                    <div className="p-4 rounded-xl bg-muted/40 sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="Tag" size={12} /> Номинация
                      </p>
                      <p className="font-semibold">{result.nomination}</p>
                    </div>
                  )}
                </div>
              </Card>

              {result.jury_members && result.jury_members.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Icon name="Users" size={16} className="text-primary" />
                    Состав жюри конкурса
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {result.jury_members.map((j, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 w-20">
                        {j.photo_url ? (
                          <img
                            src={j.photo_url}
                            alt={j.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Icon name="User" size={24} className="text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-center font-medium leading-tight">{j.name}</p>
                        {j.title && (
                          <p className="text-xs text-center text-muted-foreground leading-tight">{j.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DiplomaCheckPage;