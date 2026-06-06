import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface ScoringJuryAccessCardProps {
  juryList: JuryMember[];
  programRows: ProgramRow[];
  assignments: Assignment[];
  togglingJury: number | null;
  togglingAssign: string | null;
  expandedRow: number | null;
  onToggleJuryAccess: (juryMember: JuryMember) => void;
  onToggleAssignment: (rowId: number, juryMember: JuryMember) => void;
  onSetExpandedRow: (id: number | null) => void;
}

const ScoringJuryAccessCard = ({
  juryList,
  programRows,
  assignments,
  togglingJury,
  togglingAssign,
  expandedRow,
  onToggleJuryAccess,
  onToggleAssignment,
  onSetExpandedRow,
}: ScoringJuryAccessCardProps) => {
  const accessibleJury = juryList.filter(j => j.has_access);

  return (
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
                <Button size="sm" variant={j.has_access ? 'default' : 'outline'} className={j.has_access ? 'bg-green-600 hover:bg-green-700' : ''} disabled={togglingJury === j.id} onClick={() => onToggleJuryAccess(j)}>
                  {togglingJury === j.id ? <Icon name="Loader" size={14} className="animate-spin" /> : j.has_access ? <><Icon name="Check" size={14} className="mr-1" />Доступ</> : <><Icon name="Plus" size={14} className="mr-1" />Дать</>}
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
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left" onClick={() => onSetExpandedRow(isExpanded ? null : row.id)}>
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
                              <button key={j.id} disabled={togglingAssign === key} onClick={() => onToggleAssignment(row.id, j)}
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
  );
};

export default ScoringJuryAccessCard;
