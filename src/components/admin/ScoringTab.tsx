import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';
const PROGRAM_API = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

const JURY_COUNTS = [1, 2, 3, 4, 5];
const LEVELS = [
  { key: 'grand_prix_min', label: 'Гран-При' },
  { key: 'laureate_1_min', label: 'Лауреат I' },
  { key: 'laureate_2_min', label: 'Лауреат II' },
  { key: 'laureate_3_min', label: 'Лауреат III' },
] as const;

type ScoringKey = `jury_count_${1|2|3|4|5}_${'grand_prix_min'|'laureate_1_min'|'laureate_2_min'|'laureate_3_min'}`;
type ScoringRules = Record<ScoringKey, number>;

const buildDefault = (): ScoringRules => {
  const d: Partial<ScoringRules> = {};
  const defaults = { grand_prix_min: 95, laureate_1_min: 85, laureate_2_min: 75, laureate_3_min: 65 };
  for (const n of JURY_COUNTS) {
    for (const lvl of LEVELS) {
      (d as Record<string, number>)[`jury_count_${n}_${lvl.key}`] = n * defaults[lvl.key];
    }
  }
  return d as ScoringRules;
};

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

interface ResultRow {
  id: number;
  order_number: number;
  participant_name: string;
  nomination: string;
  jury_scores: Array<{ order: number; score: number | null }>;
  jury_count: number;
  total: number | null;
  award: string;
  all_scored: boolean;
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

const AWARD_COLORS: Record<string, string> = {
  'Гран-При': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Лауреат I': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Лауреат II': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Лауреат III': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Диплом': 'bg-muted text-muted-foreground',
};

const ScoringTab = ({ contests, selectedContest, onContestChange }: ScoringTabProps) => {
  const { toast } = useToast();
  const [programRows, setProgramRows] = useState<ProgramRow[]>([]);
  const [juryList, setJuryList] = useState<JuryMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scoring, setScoring] = useState<ScoringRules>(buildDefault());
  const [results, setResults] = useState<ResultRow[]>([]);
  const [savingScoring, setSavingScoring] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [togglingJury, setTogglingJury] = useState<number | null>(null);
  const [togglingAssign, setTogglingAssign] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'results'>('setup');

  const loadData = useCallback(async (contestId: string) => {
    setLoadingData(true);
    try {
      const [progRes, juryRes, assignRes, scoringRes] = await Promise.all([
        fetch(`${API}?action=program_scores&contest_id=${contestId}`),
        fetch(`${API}?action=jury_access&contest_id=${contestId}`),
        fetch(`${API}?action=program_assignments&contest_id=${contestId}`),
        fetch(`${PROGRAM_API}?contest_id=${contestId}`),
      ]);
      const [prog, jury, assign, scoringData] = await Promise.all([progRes.json(), juryRes.json(), assignRes.json(), scoringRes.json()]);
      setProgramRows(prog.rows || []);
      setJuryList(jury.jury || []);
      setAssignments(assign.assignments || []);
      setScoring(scoringData.scoring || buildDefault());
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  const loadResults = useCallback(async (contestId: string) => {
    setLoadingResults(true);
    try {
      const res = await fetch(`${API}?action=results_table&contest_id=${contestId}`);
      const data = await res.json();
      setResults(data.rows || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить результаты', variant: 'destructive' });
    } finally {
      setLoadingResults(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedContest) {
      loadData(selectedContest);
      loadResults(selectedContest);
      setExpandedRow(null);
    } else {
      setProgramRows([]);
      setJuryList([]);
      setAssignments([]);
      setResults([]);
    }
  }, [selectedContest, loadData, loadResults]);

  const handleSaveScoring = async () => {
    if (!selectedContest) return;
    setSavingScoring(true);
    try {
      await fetch(`${PROGRAM_API}?action=scoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(selectedContest), ...scoring }),
      });
      toast({ title: 'Система оценивания сохранена' });
      loadResults(selectedContest);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSavingScoring(false);
    }
  };

  const toggleJuryAccess = async (juryMember: JuryMember) => {
    setTogglingJury(juryMember.id);
    try {
      await fetch(`${API}?action=jury_access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(selectedContest), jury_member_id: juryMember.id, has_access: !juryMember.has_access }),
      });
      setJuryList(prev => prev.map(j => j.id === juryMember.id ? { ...j, has_access: !j.has_access } : j));
      if (juryMember.has_access) setAssignments(prev => prev.filter(a => a.jury_member_id !== juryMember.id));
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
  const maxJury = results.reduce((m, r) => Math.max(m, r.jury_count), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-72">
          <Select value={selectedContest || ''} onValueChange={onContestChange}>
            <SelectTrigger><SelectValue placeholder="Выберите конкурс" /></SelectTrigger>
            <SelectContent>
              {contests.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedContest && (
          <div className="flex gap-1 border rounded-lg p-1">
            <button onClick={() => setActiveTab('setup')} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'setup' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Настройка
            </button>
            <button onClick={() => { setActiveTab('results'); loadResults(selectedContest); }} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'results' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Результаты
            </button>
          </div>
        )}
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
      ) : activeTab === 'setup' ? (
        <>
          {/* Система оценивания */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-1">Система оценивания</h3>
            <p className="text-sm text-muted-foreground mb-4">Задайте пороговые значения сумм баллов для каждого количества судей</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28">Судей</th>
                    {LEVELS.map(l => <th key={l.key} className="text-left py-2 px-3 font-medium text-muted-foreground">{l.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {JURY_COUNTS.map(n => (
                    <tr key={n} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-3">
                        <span className="font-semibold">{n} {n === 1 ? 'судья' : n < 5 ? 'судьи' : 'судей'}</span>
                      </td>
                      {LEVELS.map(lvl => {
                        const k = `jury_count_${n}_${lvl.key}` as ScoringKey;
                        return (
                          <td key={lvl.key} className="py-2 px-3">
                            <Input
                              type="number"
                              className="w-24 h-8 text-sm"
                              value={(scoring as Record<string, number>)[k] ?? ''}
                              onChange={e => setScoring(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                              min={0}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="mt-4" onClick={handleSaveScoring} disabled={savingScoring}>
              {savingScoring ? <><Icon name="Loader" size={14} className="mr-2 animate-spin" />Сохраняю...</> : 'Сохранить систему оценивания'}
            </Button>
          </Card>

          {/* Доступ жюри */}
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
                    <Button size="sm" variant={j.has_access ? 'default' : 'outline'} className={j.has_access ? 'bg-green-600 hover:bg-green-700' : ''} disabled={togglingJury === j.id} onClick={() => toggleJuryAccess(j)}>
                      {togglingJury === j.id ? <Icon name="Loader" size={14} className="animate-spin" /> : j.has_access ? <><Icon name="Check" size={14} className="mr-1" />Доступ</> : <><Icon name="Plus" size={14} className="mr-1" />Дать</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Назначение жюри */}
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
                      <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left" onClick={() => setExpandedRow(isExpanded ? null : row.id)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-secondary font-bold shrink-0 w-8">#{row.order_number}</span>
                          <span className="font-medium truncate">{row.participant_name}</span>
                          {row.nomination && <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">— {row.nomination}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {rowAssignments.length > 0 ? (
                            <div className="flex gap-1 flex-wrap justify-end max-w-48">
                              {rowAssignments.map((a, i) => <span key={a.jury_member_id} className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full whitespace-nowrap">Судья {i+1}</span>)}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">Нет назначений</span>}
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t p-3 bg-muted/10">
                          {accessibleJury.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Сначала дайте доступ жюри к конкурсу выше</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {accessibleJury.map((j, idx) => {
                                const assigned = assignments.some(a => a.program_row_id === row.id && a.jury_member_id === j.id);
                                const key = `${row.id}-${j.id}`;
                                return (
                                  <button key={j.id} disabled={togglingAssign === key} onClick={() => toggleAssignment(row.id, j)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${assigned ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-background border-border hover:border-secondary hover:text-secondary'}`}>
                                    {togglingAssign === key ? <Icon name="Loader" size={12} className="animate-spin" /> : assigned ? <Icon name="UserCheck" size={12} /> : <Icon name="UserPlus" size={12} />}
                                    Судья {idx+1} — {j.name}
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
      ) : (
        /* Вкладка Результаты */
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Результаты оценивания</h3>
            <Button variant="outline" size="sm" onClick={() => loadResults(selectedContest)} disabled={loadingResults}>
              <Icon name={loadingResults ? 'Loader' : 'RefreshCw'} size={14} className={`mr-2 ${loadingResults ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
          {loadingResults ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
              <p>Загрузка...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="BarChart3" size={40} className="mx-auto mb-3" />
              <p>Нет участников в программе</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground w-10">№</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Участник</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden md:table-cell">Номинация</th>
                    {Array.from({ length: Math.max(maxJury, 1) }, (_, i) => (
                      <th key={i} className="text-center py-2 px-2 font-medium text-muted-foreground w-20">Судья {i+1}</th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground w-20">Итог</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground w-28">Звание</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(row => (
                    <tr key={row.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-2 text-secondary font-bold">{row.order_number}</td>
                      <td className="py-2 px-2 font-medium">{row.participant_name}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">{row.nomination}</td>
                      {Array.from({ length: Math.max(maxJury, 1) }, (_, i) => {
                        const entry = row.jury_scores.find(s => s.order === i + 1);
                        return (
                          <td key={i} className="py-2 px-2 text-center">
                            {i < row.jury_count ? (
                              entry?.score != null
                                ? <span className="font-semibold text-foreground">{entry.score}</span>
                                : <span className="text-muted-foreground text-xs">—</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center">
                        {row.total != null
                          ? <span className="font-bold text-secondary">{row.total}</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-2 px-2">
                        {row.award
                          ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${AWARD_COLORS[row.award] || 'bg-muted text-muted-foreground'}`}>{row.award}</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ScoringTab;
