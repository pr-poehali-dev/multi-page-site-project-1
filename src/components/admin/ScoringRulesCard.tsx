import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const JURY_COUNTS = [1, 2, 3, 4, 5];
const LEVELS = [
  { key: 'grand_prix_min', label: 'ОБЛАДАТЕЛЯ ГРАН-ПРИ' },
  { key: 'laureate_1_min', label: 'ЛАУРЕАТА I СТЕПЕНИ' },
  { key: 'laureate_2_min', label: 'ЛАУРЕАТА II СТЕПЕНИ' },
  { key: 'laureate_3_min', label: 'ЛАУРЕАТА III СТЕПЕНИ' },
  { key: 'diplom_1_min', label: 'ДИПЛОМАНТА I СТЕПЕНИ' },
  { key: 'diplom_2_min', label: 'ДИПЛОМАНТА II СТЕПЕНИ' },
  { key: 'diplom_3_min', label: 'ДИПЛОМАНТА III СТЕПЕНИ' },
] as const;

type ScoringKey = `jury_count_${1|2|3|4|5}_${'grand_prix_min'|'laureate_1_min'|'laureate_2_min'|'laureate_3_min'|'diplom_1_min'|'diplom_2_min'|'diplom_3_min'}`;
export type ScoringRules = Record<ScoringKey, number>;

interface ScoringRulesCardProps {
  scoring: ScoringRules;
  savingScoring: boolean;
  onScoringChange: (scoring: ScoringRules) => void;
  onSave: () => void;
}

const ScoringRulesCard = ({ scoring, savingScoring, onScoringChange, onSave }: ScoringRulesCardProps) => {
  return (
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
                        onChange={e => onScoringChange({ ...scoring, [k]: Number(e.target.value) })}
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
      <Button className="mt-4" onClick={onSave} disabled={savingScoring}>
        {savingScoring ? <><Icon name="Loader" size={14} className="mr-2 animate-spin" />Сохраняю...</> : 'Сохранить систему оценивания'}
      </Button>
    </Card>
  );
};

export default ScoringRulesCard;