import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NominationOption, ProgramRow } from './programTypes';

interface ProgramAddRowFormProps {
  newRow: Omit<ProgramRow, 'id' | 'order_number'>;
  onNewRowChange: (updater: (p: Omit<ProgramRow, 'id' | 'order_number'>) => Omit<ProgramRow, 'id' | 'order_number'>) => void;
  nominationOptions: NominationOption[];
  onAddRow: () => void;
  onCancel: () => void;
}

const ProgramAddRowForm = ({ newRow, onNewRowChange, nominationOptions, onAddRow, onCancel }: ProgramAddRowFormProps) => {
  return (
    <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
      <h4 className="font-medium">Новая строка</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Регион</label>
          <Input value={newRow.region} onChange={e => onNewRowChange(p => ({ ...p, region: e.target.value }))} placeholder="Регион" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Направляющая сторона</label>
          <Input value={newRow.directing_party} onChange={e => onNewRowChange(p => ({ ...p, directing_party: e.target.value }))} placeholder="Организация" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">ФИО / Коллектив</label>
          <Input value={newRow.participant_name} onChange={e => onNewRowChange(p => ({ ...p, participant_name: e.target.value }))} placeholder="ФИО или название" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">ФИО руководителя</label>
          <Input value={newRow.director_name} onChange={e => onNewRowChange(p => ({ ...p, director_name: e.target.value }))} placeholder="ФИО руководителя" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Возраст</label>
          <Input value={newRow.age} onChange={e => onNewRowChange(p => ({ ...p, age: e.target.value }))} placeholder="Возраст" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Номинация</label>
          {nominationOptions.length > 0 ? (
            <Select
              value={newRow.nomination_id ? String(newRow.nomination_id) : ''}
              onValueChange={v => {
                const opt = nominationOptions.find(o => String(o.id) === v);
                onNewRowChange(p => ({ ...p, nomination_id: opt?.id ?? null, nomination: opt?.name ?? '' }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Выберите номинацию" /></SelectTrigger>
              <SelectContent>
                {nominationOptions.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={newRow.nomination} onChange={e => onNewRowChange(p => ({ ...p, nomination: e.target.value }))} placeholder="Номинация (создайте номинации во вкладке «Оценивание»)" />
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium mb-1 block">Произведение / номер</label>
          <Input value={newRow.piece_title} onChange={e => onNewRowChange(p => ({ ...p, piece_title: e.target.value }))} placeholder="Название" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Хронометраж</label>
          <Input value={newRow.duration} onChange={e => onNewRowChange(p => ({ ...p, duration: e.target.value }))} placeholder="мм:сс" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Формат участия</label>
          <Input value={newRow.participation_format} onChange={e => onNewRowChange(p => ({ ...p, participation_format: e.target.value }))} placeholder="Очно / Заочно / Онлайн" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddRow}>Добавить</Button>
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  );
};

export default ProgramAddRowForm;
