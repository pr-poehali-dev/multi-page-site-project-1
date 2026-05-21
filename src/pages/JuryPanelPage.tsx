import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';

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
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [juryName, setJuryName] = useState('');
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

  const loadRows = async (contestId: number) => {
    setLoadingRows(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}?action=jury_program&contest_id=${contestId}`, { headers: { 'X-Jury-Token': token } });
      const data = await res.json();
      setRows(data.rows || []);
    } catch {
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  const handleContestSelect = (contestId: number) => {
    setSelectedContest(contestId);
    loadRows(contestId);
  };

  const handleScoreSubmit = async (rowId: number, score: number, comment: string) => {
    setSaving(rowId);
    const token = getToken();
    try {
      await fetch(`${API}?action=program_score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Jury-Token': token },
        body: JSON.stringify({ program_row_id: rowId, contest_id: selectedContest, score, comment }),
      });
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, score, comment } : r));
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/jury-login'); };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-heading font-bold mb-2">Панель оценивания</h1>
            <p className="text-muted-foreground">Добро пожаловать, <span className="font-semibold">{juryName}</span></p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <Icon name="LogOut" size={18} className="mr-2" />Выйти
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : (
          <>
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Выберите конкурс</h2>
              {contests.length === 0 ? (
                <p className="text-muted-foreground">Вам не назначены конкурсы для оценивания</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contests.map(c => (
                    <Button
                      key={c.id}
                      onClick={() => handleContestSelect(c.id)}
                      variant={selectedContest === c.id ? 'default' : 'outline'}
                      className={selectedContest === c.id ? 'bg-secondary hover:bg-secondary/90' : ''}
                    >
                      {c.title}
                    </Button>
                  ))}
                </div>
              )}
            </Card>

            {selectedContest && (
              loadingRows ? (
                <div className="text-center py-12">
                  <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
                  <p className="text-muted-foreground">Загрузка участников...</p>
                </div>
              ) : rows.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Вам не назначены участники в этом конкурсе</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rows.map(row => (
                    <RowCard
                      key={row.id}
                      row={row}
                      onSubmit={handleScoreSubmit}
                      saving={saving === row.id}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

interface RowCardProps {
  row: ProgramRow;
  onSubmit: (id: number, score: number, comment: string) => void;
  saving: boolean;
}

const RowCard = ({ row, onSubmit, saving }: RowCardProps) => {
  const [score, setScore] = useState(row.score?.toString() || '');
  const [comment, setComment] = useState(row.comment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(score);
    if (!isNaN(v) && v >= 0 && v <= 100) onSubmit(row.id, v, comment);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-secondary">#{row.order_number}</span>
            <h3 className="text-xl font-heading font-bold">{row.participant_name}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
            {row.age && <span>Возраст: {row.age}</span>}
            {row.nomination && <span>Номинация: {row.nomination}</span>}
            {row.region && <span>Регион: {row.region}</span>}
            {row.directing_party && <span>Направляющая: {row.directing_party}</span>}
            {row.duration && <span>Хронометраж: {row.duration}</span>}
          </div>
          {row.piece_title && (
            <p className="text-muted-foreground mb-4">
              <span className="font-medium">Произведение:</span> {row.piece_title}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="w-36">
              <label className="block text-sm font-medium mb-1">Оценка (0–100)</label>
              <Input type="number" min="0" max="100" step="0.1" value={score} onChange={e => setScore(e.target.value)} placeholder="0" required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Комментарий</label>
              <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Необязательно" />
            </div>
            <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={saving}>
              {saving ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />Сохранение...</> : <><Icon name="Save" size={16} className="mr-2" />{row.score !== null ? 'Обновить' : 'Сохранить'}</>}
            </Button>
          </form>
        </div>
        {row.score !== null && (
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 shrink-0">
            <span className="text-2xl font-bold text-secondary">{row.score}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default JuryPanelPage;
