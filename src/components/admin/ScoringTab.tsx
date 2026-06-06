import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import ScoringRulesCard, { ScoringRules } from './ScoringRulesCard';
import ScoringJuryAccessCard from './ScoringJuryAccessCard';
import ScoringResultsCard from './ScoringResultsCard';

const API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';
const PROGRAM_API = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

const JURY_COUNTS = [1, 2, 3, 4, 5];
const LEVELS = [
  { key: 'grand_prix_min', label: 'Гран-При' },
  { key: 'laureate_1_min', label: 'Лауреат I' },
  { key: 'laureate_2_min', label: 'Лауреат II' },
  { key: 'laureate_3_min', label: 'Лауреат III' },
] as const;

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
  region: string;
  directing_party: string;
  participant_name: string;
  age: string;
  nomination: string;
  piece_title: string;
  duration: string;
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
  const [exportingPdf, setExportingPdf] = useState(false);

  const contestTitle = contests.find(c => String(c.id) === selectedContest)?.title || 'результаты';

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
          <ScoringRulesCard
            scoring={scoring}
            savingScoring={savingScoring}
            onScoringChange={setScoring}
            onSave={handleSaveScoring}
          />
          <ScoringJuryAccessCard
            juryList={juryList}
            programRows={programRows}
            assignments={assignments}
            togglingJury={togglingJury}
            togglingAssign={togglingAssign}
            expandedRow={expandedRow}
            onToggleJuryAccess={toggleJuryAccess}
            onToggleAssignment={toggleAssignment}
            onSetExpandedRow={setExpandedRow}
          />
        </>
      ) : (
        <ScoringResultsCard
          results={results}
          loadingResults={loadingResults}
          exportingPdf={exportingPdf}
          contestTitle={contestTitle}
          selectedContest={selectedContest}
          onRefresh={() => loadResults(selectedContest)}
          onSetExportingPdf={setExportingPdf}
        />
      )}
    </div>
  );
};

export default ScoringTab;
