import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Participant {
  id: number;
  name: string;
  age: number;
  nomination: string;
  avg_score: number | null;
  scores_count: number;
  jury_scores: Array<{
    jury_name: string;
    score: number;
    comment: string | null;
  }>;
}

interface ScoringTabProps {
  contests: Array<{ id: number; title: string }>;
  selectedContest: number | null;
  participants: Participant[];
  loading: boolean;
  onContestChange: (contestId: number) => void;
  onExportProtocol: () => void;
}

const ScoringTab = ({
  contests,
  selectedContest,
  participants,
  loading,
  onContestChange,
  onExportProtocol
}: ScoringTabProps) => {
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const scoreA = a.avg_score ?? 0;
      const scoreB = b.avg_score ?? 0;
      return scoreB - scoreA;
    });
  }, [participants]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Выберите конкурс:</label>
          <select
            value={selectedContest || ''}
            onChange={(e) => onContestChange(Number(e.target.value))}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">Все конкурсы</option>
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </select>
        </div>

        {selectedContest && participants.length > 0 && (
          <Button
            onClick={onExportProtocol}
            className="bg-secondary hover:bg-secondary/90 gap-2"
          >
            <Icon name="FileDown" size={18} />
            Скачать протокол
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : !selectedContest ? (
        <div className="text-center py-8">
          <Icon name="BarChart3" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Выберите конкурс для просмотра оценок</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Нет участников с оценками</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              Всего участников: {participants.length}
            </h3>
            <p className="text-sm text-muted-foreground">
              Участники отсортированы по среднему баллу (от большего к меньшему)
            </p>
          </div>

          <div className="space-y-4">
            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-full">
                      <span className="text-xl font-bold text-secondary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{participant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {participant.age} {participant.age >= 5 && participant.age <= 20 ? 'лет' : participant.age === 1 ? 'год' : 'года'} • {participant.nomination}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-secondary">
                      {participant.avg_score !== null 
                        ? participant.avg_score.toFixed(2) 
                        : '—'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {participant.scores_count} {participant.scores_count === 1 ? 'оценка' : participant.scores_count >= 2 && participant.scores_count <= 4 ? 'оценки' : 'оценок'}
                    </p>
                  </div>
                </div>

                {participant.jury_scores.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">Оценки жюри:</h4>
                    <div className="space-y-2">
                      {participant.jury_scores.map((juryScore, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between bg-muted/30 rounded p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{juryScore.jury_name}</p>
                            {juryScore.comment && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {juryScore.comment}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-lg font-semibold text-secondary">
                            {juryScore.score.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringTab;