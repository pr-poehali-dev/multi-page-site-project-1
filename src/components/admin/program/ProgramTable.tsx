import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { NominationOption, ProgramRow } from './programTypes';

export const columns = [
  { key: 'order_number', label: '№', width: 'w-12' },
  { key: 'diploma_number', label: 'Номер диплома', width: 'w-32' },
  { key: 'region', label: 'Регион', width: 'w-28' },
  { key: 'directing_party', label: 'Направляющая сторона', width: 'w-40' },
  { key: 'participant_name', label: 'ФИО / Коллектив', width: 'w-40' },
  { key: 'director_name', label: 'ФИО руководителя', width: 'w-40' },
  { key: 'age', label: 'Возраст', width: 'w-20' },
  { key: 'nomination', label: 'Номинация', width: 'w-32' },
  { key: 'piece_title', label: 'Произведение / номер', width: 'w-40' },
  { key: 'duration', label: 'Хронометраж', width: 'w-28' },
  { key: 'participation_format', label: 'Формат участия', width: 'w-28' },
] as const;

interface ProgramTableProps {
  loading: boolean;
  rows: ProgramRow[];
  filteredRows: ProgramRow[];
  editingRow: ProgramRow | null;
  onSetEditingRow: (row: ProgramRow | null) => void;
  nominationOptions: NominationOption[];
  onUpdateRow: () => void;
  onDeleteRow: (id: number) => void;
}

const ProgramTable = ({
  loading,
  rows,
  filteredRows,
  editingRow,
  onSetEditingRow,
  nominationOptions,
  onUpdateRow,
  onDeleteRow,
}: ProgramTableProps) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;
  }
  if (rows.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Программа пуста. Добавьте первую строку.</div>;
  }
  if (filteredRows.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Нет строк с выбранным форматом участия.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map(col => (
              <th key={col.key} className={`text-left py-2 px-2 font-medium text-muted-foreground ${col.width}`}>{col.label}</th>
            ))}
            <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map(row => (
            <tr key={row.id} className="border-b hover:bg-muted/30">
              {editingRow?.id === row.id ? (
                <>
                  {columns.map(col => (
                    <td key={col.key} className="py-1 px-2">
                      {col.key === 'nomination' && nominationOptions.length > 0 ? (
                        <Select
                          value={editingRow.nomination_id ? String(editingRow.nomination_id) : ''}
                          onValueChange={v => {
                            const opt = nominationOptions.find(o => String(o.id) === v);
                            onSetEditingRow(editingRow ? { ...editingRow, nomination_id: opt?.id ?? null, nomination: opt?.name ?? '' } : null);
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Номинация" /></SelectTrigger>
                          <SelectContent>
                            {nominationOptions.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={String(editingRow[col.key])}
                          onChange={e => onSetEditingRow(editingRow ? { ...editingRow, [col.key]: col.key === 'order_number' ? Number(e.target.value) : e.target.value } : null)}
                          className="h-7 text-xs"
                        />
                      )}
                    </td>
                  ))}
                  <td className="py-1 px-2">
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 px-2" onClick={onUpdateRow}>
                        <Icon name="Check" size={12} />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onSetEditingRow(null)}>
                        <Icon name="X" size={12} />
                      </Button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  {columns.map(col => (
                    <td key={col.key} className="py-2 px-2">{row[col.key]}</td>
                  ))}
                  <td className="py-2 px-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onSetEditingRow({ ...row })}>
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onDeleteRow(row.id)}>
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgramTable;
