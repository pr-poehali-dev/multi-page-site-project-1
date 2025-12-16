import { useState } from 'react';

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

export const useAdminScoring = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);

  const loadScores = async (contestId: number) => {
    setLoading(true);
    setSelectedContest(contestId);
    
    try {
      const response = await fetch(
        `https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d?action=scores&contest_id=${contestId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load scores');
      }
      
      const data = await response.json();
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (contestId: number) => {
    if (contestId) {
      loadScores(contestId);
    } else {
      setSelectedContest(null);
      setParticipants([]);
    }
  };

  const exportProtocol = () => {
    if (!selectedContest || participants.length === 0) return;

    const sortedParticipants = [...participants].sort((a, b) => {
      const scoreA = a.avg_score ?? 0;
      const scoreB = b.avg_score ?? 0;
      return scoreB - scoreA;
    });

    let csv = 'Место,ФИО,Возраст,Номинация,Средний балл,Количество оценок\n';
    
    sortedParticipants.forEach((participant, index) => {
      const avgScore = participant.avg_score !== null 
        ? participant.avg_score.toFixed(2) 
        : '—';
      
      csv += `${index + 1},"${participant.name}",${participant.age},"${participant.nomination}",${avgScore},${participant.scores_count}\n`;
    });

    csv += '\n\nДетальные оценки жюри:\n';
    csv += 'Участник,Член жюри,Оценка,Комментарий\n';

    sortedParticipants.forEach((participant) => {
      participant.jury_scores.forEach((juryScore) => {
        const comment = juryScore.comment ? juryScore.comment.replace(/"/g, '""') : '';
        csv += `"${participant.name}","${juryScore.jury_name}",${juryScore.score.toFixed(1)},"${comment}"\n`;
      });
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `protocol_contest_${selectedContest}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    participants,
    loading,
    selectedContest,
    handleContestChange,
    exportProtocol
  };
};