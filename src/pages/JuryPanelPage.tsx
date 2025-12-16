import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Contest {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface Participant {
  id: number;
  full_name: string;
  age: number;
  category: string;
  performance_title: string;
  score: number | null;
  comment: string | null;
}

const JuryPanelPage = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [juryName, setJuryName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    verifyAuth();
    loadContests();
  }, []);

  const verifyAuth = async () => {
    const token = localStorage.getItem('jury_token');
    const name = localStorage.getItem('jury_name');

    if (!token || !name) {
      navigate('/jury-login');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d?action=verify', {
        headers: { 'X-Jury-Token': token }
      });

      if (!response.ok) {
        localStorage.clear();
        navigate('/jury-login');
        return;
      }

      setJuryName(name);
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      navigate('/jury-login');
    }
  };

  const loadContests = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/d0e15426-bf1e-4ccc-adb9-d36f47a65401');
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (contestId: number) => {
    setLoading(true);
    const token = localStorage.getItem('jury_token');

    try {
      const response = await fetch(
        `https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d?action=scores&contest_id=${contestId}`,
        { headers: { 'X-Jury-Token': token || '' } }
      );
      const data = await response.json();
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContestSelect = (contestId: number) => {
    setSelectedContest(contestId);
    loadParticipants(contestId);
  };

  const handleScoreSubmit = async (participantId: number, score: number, comment: string) => {
    setSaving(participantId);
    const token = localStorage.getItem('jury_token');

    try {
      const response = await fetch('https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Jury-Token': token || ''
        },
        body: JSON.stringify({
          participant_id: participantId,
          contest_id: selectedContest,
          score,
          comment
        })
      });

      if (response.ok) {
        if (selectedContest) {
          loadParticipants(selectedContest);
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения оценки:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/jury-login');
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-heading font-bold mb-2">Панель оценивания</h1>
            <p className="text-muted-foreground">
              Добро пожаловать, <span className="font-semibold">{juryName}</span>
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>

        {loading && !selectedContest ? (
          <div className="text-center py-12">
            <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
            <p className="text-muted-foreground">Загрузка конкурсов...</p>
          </div>
        ) : (
          <>
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Выберите конкурс</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contests.map((contest) => (
                  <Button
                    key={contest.id}
                    onClick={() => handleContestSelect(contest.id)}
                    variant={selectedContest === contest.id ? 'default' : 'outline'}
                    className={selectedContest === contest.id ? 'bg-secondary hover:bg-secondary/90' : ''}
                  >
                    {contest.title}
                  </Button>
                ))}
              </div>
            </Card>

            {selectedContest && (
              <>
                {loading ? (
                  <div className="text-center py-12">
                    <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
                    <p className="text-muted-foreground">Загрузка участников...</p>
                  </div>
                ) : participants.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">В этом конкурсе пока нет утвержденных участников</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        onSubmit={handleScoreSubmit}
                        saving={saving === participant.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

interface ParticipantCardProps {
  participant: Participant;
  onSubmit: (id: number, score: number, comment: string) => void;
  saving: boolean;
}

const ParticipantCard = ({ participant, onSubmit, saving }: ParticipantCardProps) => {
  const [score, setScore] = useState(participant.score?.toString() || '');
  const [comment, setComment] = useState(participant.comment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreValue = parseFloat(score);
    if (scoreValue >= 0 && scoreValue <= 10) {
      onSubmit(participant.id, scoreValue, comment);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <h3 className="text-xl font-heading font-bold mb-2">{participant.full_name}</h3>
          <div className="flex gap-4 text-sm text-muted-foreground mb-3">
            <span>Возраст: {participant.age}</span>
            <span>Категория: {participant.category}</span>
          </div>
          <p className="text-muted-foreground mb-4">
            <span className="font-medium">Номер:</span> {participant.performance_title}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Оценка (0-10)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Комментарий (необязательно)
              </label>
              <Input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ваш комментарий"
              />
            </div>

            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary/90"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Icon name="Loader" size={18} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={18} className="mr-2" />
                  {participant.score !== null ? 'Обновить оценку' : 'Сохранить оценку'}
                </>
              )}
            </Button>
          </form>
        </div>

        {participant.score !== null && (
          <div className="md:w-32 flex md:flex-col items-center md:items-end gap-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary">{participant.score.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Текущая оценка</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default JuryPanelPage;