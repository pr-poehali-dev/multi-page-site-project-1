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

interface Assignment {
  program_row_id: number;
  jury_member_id: number;
  jury_name: string;
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [togglingJury, setTogglingJury] = useState<number | null>(null);
  const [togglingAssign, setTogglingAssign] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const loadData = useCallback(async (contestId: string) => {
    setLoadingData(true);
    try {
      const [progRes, juryRes, assignRes] = await Promise.all([
        fetch(`${API}?action=program_scores&contest_id=${contestId}`),
        fetch(`${API}?action=jury_access&contest_id=${contestId}`),
        fetch(`${API}?action=program_assignments&contest_id=${contestId}`),
      ]);
      const [prog, jury, assign] = await Promise.all([progRes.json(), juryRes.json(), assignRes.json()]);
      setProgramRows(prog.rows || []);
      setJuryList(jury.jury || []);
      setAssignments(assign.assignments || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedContest) {
      loadData(selectedContest);
      setExpandedRow(null);
    } else {
      setProgramRows([]);
      setJuryList([]);
      setAssignments([]);
    }
  }, [selectedContest, loadData]);

  const toggleJuryAccess = async (juryMember: JuryMember) => {
    setTogglingJury(juryMember.id);
    try {
      await fetch(`${API}?action=jury_access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(selectedContest), jury_member_id: juryMember.id, has_access: !juryMember.has_access }),
      });
      setJuryList(prev => prev.map(j => j.id === juryMember.id ? { ...j, has_access: !j.has_access } : j));
      if (juryMember.has_access) {
        setAssignments(prev => prev.filter(a => a.jury_member_id !== juryMember.id));
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить доступ', variant: 'destructive' });
    } finally {
      setTogglingJury(null);
    }
  };

  const toggleAssignment = async (rowId: number, juryMember: JuryMember) => {
    const key = `${rowId}-${juryMember.id}`;
    setTogglingAssign(key);
    const isAssigned = assignments.some(a => a.program_row_id === rowId && a.jury_member_id === juryMember.id);
    try {
      await fetch(`${API}?action=program_assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_row_id: rowId, jury_member_id: juryMember.id, contest_id: Number(selectedContest), assigned: !isAssigned }),
      });
      if (isAssigned) {
        setAssignments(prev => prev.filter(a => !(a.program_row_id === rowId && a.jury_member_id === juryMember.id)));
      } else {
        setAssignments(prev => [...prev, { program_row_id: rowId, jury_member_id: juryMember.id, jury_name: juryMember.name }]);
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить назначение', variant: 'destructive' });
    } finally {
      setTogglingAssign(null);
    }
  };

  const accessibleJury = juryList.filter(j => j.has_access);

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
      ) : loadingData ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
          <p>Загрузка...</p>
        </div>
      ) : (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Доступ жюри к конкурсу</h3>
            {juryList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Нет членов жюри</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {juryList.map(j => (
                  <div key={j.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${j.has_access ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border bg-muted/20'}`}>
                    <div>
                      <p className="font-medium text-sm">{j.name}</p>
                      <p className="text-xs text-muted-foreground">{j.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={j.has_access ? 'default' : 'outline'}
                      className={j.has_access ? 'bg-green-600 hover:bg-green-700' : ''}
                      disabled={togglingJury === j.id}
                      onClick={() => toggleJuryAccess(j)}
                    >
                      {togglingJury === j.id
                        ? <Icon name="Loader" size={14} className="animate-spin" />
                        : j.has_access
                        ? <><Icon name="Check" size={14} className="mr-1" />Доступ</>
                        : <><Icon name="Plus" size={14} className="mr-1" />Дать</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-1">Назначение жюри к участникам</h3>
            <p className="text-sm text-muted-foreground mb-4">Нажмите на участника, чтобы назначить или снять жюри</p>
            {programRows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Программа ещё не заполнена.</p>
                <p className="text-sm mt-1">Добавьте участников на вкладке «Программа».</p>
              </div>
            ) : (
              <div className="space-y-2">
                {programRows.map(row => {
                  const rowAssignments = assignments.filter(a => a.program_row_id === row.id);
                  const isExpanded = expandedRow === row.id;

                  return (
                    <div key={row.id} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-secondary font-bold shrink-0 w-8">#{row.order_number}</span>
                          <span className="font-medium truncate">{row.participant_name}</span>
                          {row.nomination && <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">— {row.nomination}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {rowAssignments.length > 0 ? (
                            <div className="flex gap-1 flex-wrap justify-end max-w-48">
                              {rowAssignments.map(a => (
                                <span key={a.jury_member_id} className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full whitespace-nowrap">{a.jury_name.split(' ')[0]}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Нет назначений</span>
                          )}
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t p-3 bg-muted/10">
                          <p className="text-xs text-muted-foreground mb-2">
                            {row.piece_title && <span className="mr-3">🎵 {row.piece_title}</span>}
                            {row.age && <span className="mr-3">Возраст: {row.age}</span>}
                            {row.duration && <span>Хрон: {row.duration}</span>}
                          </p>
                          {accessibleJury.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Сначала дайте доступ жюри к конкурсу выше</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {accessibleJury.map(j => {
                                const assigned = assignments.some(a => a.program_row_id === row.id && a.jury_member_id === j.id);
                                const key = `${row.id}-${j.id}`;
                                return (
                                  <button
                                    key={j.id}
                                    disabled={togglingAssign === key}
                                    onClick={() => toggleAssignment(row.id, j)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${assigned ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-background border-border hover:border-secondary hover:text-secondary'}`}
                                  >
                                    {togglingAssign === key
                                      ? <Icon name="Loader" size={12} className="animate-spin" />
                                      : assigned
                                      ? <Icon name="UserCheck" size={12} />
                                      : <Icon name="UserPlus" size={12} />}
                                    {j.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ScoringTab;
