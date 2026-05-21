import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Contest {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface ProgramRow {
  id: number;
  order_number: number;
  participant_name: string;
  age: string;
  nomination: string;
  piece_title: string;
  duration: string;
  region: string;
  directing_party: string;
  score: number | null;
  comment: string | null;
  score_id: number | null;
}

const JuryPanelPage = () => {
  const [juryName, setJuryName] = useState('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('jury_token') || '';

  const verifyAuth = useCallback(async () => {
    const token = getToken();
    const name = localStorage.getItem('jury_name');
    if (!token || !name) { navigate('/jury-login'); return; }
    try {
      const res = await fetch(`${API}?action=verify`, { headers: { 'X-Jury-Token': token } });
      if (!res.ok) { localStorage.clear(); navigate('/jury-login'); return; }
      setJuryName(name);
    } catch {
      navigate('/jury-login');
    }
  }, [navigate]);

  const loadContests = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API}?action=jury_contests`, { headers: { 'X-Jury-Token': token } });
      const data = await res.json();
      setContests(data.contests || []);
    } catch {
      setContests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth().then(loadContests);
  }, [verifyAuth, loadContests]);

  const handleContestSelect = async (contest: Contest) => {
    setSelectedContest(contest);
    setCurrentIndex(0);
    setLoadingRows(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}?action=jury_program&contest_id=${contest.id}`, {
        headers: { 'X-Jury-Token': token },
      });
      const data = await res.json();
      setRows(data.rows || []);
    } catch {
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  const handleScore = async (score: number) => {
    const row = rows[currentIndex];
    if (!row || row.score !== null || !selectedContest) return;
    setSaving(true);
    const token = getToken();
    try {
      await fetch(`${API}?action=program_score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Jury-Token': token },
        body: JSON.stringify({ program_row_id: row.id, contest_id: selectedContest.id, score, comment: '' }),
      });
      setRows(prev => prev.map((r, i) => i === currentIndex ? { ...r, score } : r));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/jury-login'); };

  const currentRow = rows[currentIndex] ?? null;
  const isScored = currentRow?.score !== null && currentRow?.score !== undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader" size={40} className="animate-spin text-secondary" />
      </div>
    );
  }

  // Экран выбора конкурса
  if (!selectedContest) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b px-4 py-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Панель жюри</p>
            <p className="font-semibold">{juryName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />Выйти
          </Button>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-heading font-bold mb-2 text-center">Добро пожаловать!</h1>
          <p className="text-muted-foreground text-center mb-10">Выберите конкурс для оценивания</p>

          {contests.length === 0 ? (
            <Card className="p-12 text-center">
              <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Вам пока не назначены конкурсы</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {contests.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleContestSelect(c)}
                  className="group w-full text-left border rounded-xl p-5 hover:border-secondary hover:bg-secondary/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold group-hover:text-secondary transition-colors">{c.title}</span>
                    <Icon name="ChevronRight" size={20} className="text-muted-foreground group-hover:text-secondary" />
                  </div>
                  {c.start_date && (
                    <p className="text-sm text-muted-foreground mt-1">{new Date(c.start_date).toLocaleDateString('ru-RU')}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Экран оценивания
  const scoredCount = rows.filter(r => r.score !== null).length;
  const progress = rows.length > 0 ? Math.round((scoredCount / rows.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Шапка */}
      <header className="border-b px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedContest(null); setRows([]); }} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <p className="font-semibold text-sm leading-tight">{selectedContest.title}</p>
            <p className="text-xs text-muted-foreground">{juryName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{scoredCount}/{rows.length} оценено</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <Icon name="LogOut" size={16} />
          </Button>
        </div>
      </header>

      {/* Прогресс-бар */}
      <div className="h-1 bg-muted shrink-0">
        <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {loadingRows ? (
        <div className="flex-1 flex items-center justify-center">
          <Icon name="Loader" size={40} className="animate-spin text-secondary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Участники не назначены</p>
            <Button className="mt-6" variant="outline" onClick={() => { setSelectedContest(null); setRows([]); }}>
              Назад к конкурсам
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">

          {/* Карточка участника */}
          {currentRow && (
            <Card className="p-6 mb-6 flex-grow flex flex-col justify-between">
              <div>
                {/* Номер и навигация */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-bold text-secondary">#{currentRow.order_number}</span>
                  <span className="text-sm text-muted-foreground">{currentIndex + 1} из {rows.length}</span>
                </div>

                {/* Информация */}
                <h2 className="text-3xl font-heading font-bold mb-5 leading-tight">{currentRow.participant_name}</h2>
                <div className="flex flex-col gap-3 mb-4">
                  {currentRow.piece_title && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Название номера</p>
                      <p className="text-xl font-semibold">{currentRow.piece_title}</p>
                    </div>
                  )}
                  {currentRow.nomination && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Номинация</p>
                      <p className="text-xl font-semibold">{currentRow.nomination}</p>
                    </div>
                  )}
                  {currentRow.age && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Возраст</p>
                      <p className="text-xl font-semibold">{currentRow.age}</p>
                    </div>
                  )}
                  {(currentRow.region || currentRow.duration) && (
                    <div className="flex gap-6">
                      {currentRow.region && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Регион</p>
                          <p className="text-sm font-medium">{currentRow.region}</p>
                        </div>
                      )}
                      {currentRow.duration && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Хронометраж</p>
                          <p className="text-sm font-medium">{currentRow.duration}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Блок оценивания */}
              <div className="mt-4">
                {isScored ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-xl px-6 py-3 mb-3">
                      <Icon name="CheckCircle" size={20} />
                      <span className="font-semibold">Оценка выставлена: {currentRow.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Оценку изменить нельзя</p>
                    {/* Неактивные кнопки для отображения */}
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {SCORES.map(s => (
                        <button
                          key={s}
                          disabled
                          className={`h-12 rounded-lg text-lg font-bold border-2 transition-all
                            ${s === currentRow.score
                              ? 'border-green-500 bg-green-500 text-white opacity-100'
                              : 'border-border bg-muted/30 text-muted-foreground opacity-40 cursor-not-allowed'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-center mb-3">Выберите балл</p>
                    <div className="grid grid-cols-5 gap-2">
                      {SCORES.map(s => (
                        <button
                          key={s}
                          disabled={saving}
                          onClick={() => handleScore(s)}
                          className="h-12 rounded-lg text-lg font-bold border-2 border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500 hover:text-white active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? <Icon name="Loader" size={16} className="mx-auto animate-spin" /> : s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Навигация */}
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline"
              className="flex-1 h-12"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
            >
              <Icon name="ChevronLeft" size={18} className="mr-2" />Назад
            </Button>
            <Button
              className="flex-1 h-12 bg-secondary hover:bg-secondary/90"
              disabled={currentIndex >= rows.length - 1}
              onClick={() => setCurrentIndex(i => i + 1)}
            >
              Далее<Icon name="ChevronRight" size={18} className="ml-2" />
            </Button>
          </div>

          {/* Счётчик снизу */}
          <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
            {rows.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setCurrentIndex(i)}
                title={r.participant_name}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all
                  ${i === currentIndex ? 'ring-2 ring-secondary ring-offset-1' : ''}
                  ${r.score !== null ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
              >
                {r.order_number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JuryPanelPage;