import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';

interface ProgramRow {
  id: number;
  order_number: number;
  region: string;
  directing_party: string;
  participant_name: string;
  age: string;
  nomination: string;
  piece_title: string;
  duration: string;
}

interface JuryMember {
  id: number;
  name: string;
  role: string;
  has_access: boolean;
}

interface ScoringTabProps {
  contests: Array<{ id: number; title: string }>;
  selectedContest: string;
  participants: unknown[];
  loading: boolean;
  onContestChange: (contestId: string) => void;
  onExportProtocol: () => void;
  onDeleteParticipant: (id: number) => Promise<void>;
}

const ScoringTab = ({ contests, selectedContest, onContestChange }: ScoringTabProps) => {
  const { toast } = useToast();
  const [programRows, setProgramRows] = useState<ProgramRow[]>([]);
  const [juryList, setJuryList] = useState<JuryMember[]>([]);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [loadingJury, setLoadingJury] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadData = useCallback(async (contestId: string) => {
    setLoadingProgram(true);
    setLoadingJury(true);

    try {
      const [progRes, juryRes] = await Promise.all([
        fetch(`${API}?action=program_scores&contest_id=${contestId}`),
        fetch(`${API}?action=jury_access&contest_id=${contestId}`),
      ]);
      const progData = await progRes.json();
      const juryData = await juryRes.json();
      setProgramRows(progData.rows || []);
      setJuryList(juryData.jury || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoadingProgram(false);
      setLoadingJury(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedContest) {
      loadData(selectedContest);
    } else {
      setProgramRows([]);
      setJuryList([]);
    }
  }, [selectedContest, loadData]);

  const toggleJuryAccess = async (juryMember: JuryMember) => {
    setTogglingId(juryMember.id);
    try {
      await fetch(`${API}?action=jury_access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contest_id: Number(selectedContest),
          jury_member_id: juryMember.id,
          has_access: !juryMember.has_access,
        }),
      });
      setJuryList(prev =>
        prev.map(j => j.id === juryMember.id ? { ...j, has_access: !j.has_access } : j)
      );
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить доступ', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    { key: 'order_number', label: '№' },
    { key: 'region', label: 'Регион' },
    { key: 'directing_party', label: 'Направляющая сторона' },
    { key: 'participant_name', label: 'ФИО / Коллектив' },
    { key: 'age', label: 'Возраст' },
    { key: 'nomination', label: 'Номинация' },
    { key: 'piece_title', label: 'Произведение / номер' },
    { key: 'duration', label: 'Хронометраж' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="w-72">
        <Select value={selectedContest || ''} onValueChange={onContestChange}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите конкурс" />
          </SelectTrigger>
          <SelectContent>
            {contests.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedContest ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="BarChart3" size={48} className="mx-auto mb-4" />
          <p>Выберите конкурс для просмотра</p>
        </div>
      ) : (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Доступ жюри к конкурсу</h3>
            {loadingJury ? (
              <p className="text-muted-foreground text-sm">Загрузка...</p>
            ) : juryList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Нет членов жюри</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {juryList.map(j => (
                  <div
                    key={j.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${j.has_access ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border bg-muted/20'}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{j.name}</p>
                      <p className="text-xs text-muted-foreground">{j.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={j.has_access ? 'default' : 'outline'}
                      className={j.has_access ? 'bg-green-600 hover:bg-green-700' : ''}
                      disabled={togglingId === j.id}
                      onClick={() => toggleJuryAccess(j)}
                    >
                      {togglingId === j.id ? (
                        <Icon name="Loader" size={14} className="animate-spin" />
                      ) : j.has_access ? (
                        <><Icon name="Check" size={14} className="mr-1" />Доступ</>
                      ) : (
                        <><Icon name="Plus" size={14} className="mr-1" />Дать</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Программа конкурса</h3>
            {loadingProgram ? (
              <p className="text-muted-foreground text-sm">Загрузка...</p>
            ) : programRows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Программа ещё не заполнена.</p>
                <p className="text-sm mt-1">Добавьте участников на вкладке «Программа».</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {columns.map(col => (
                        <th key={col.key} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {programRows.map(row => (
                      <tr key={row.id} className="border-b hover:bg-muted/30">
                        {columns.map(col => (
                          <td key={col.key} className="py-2 px-2">{row[col.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ScoringTab;
