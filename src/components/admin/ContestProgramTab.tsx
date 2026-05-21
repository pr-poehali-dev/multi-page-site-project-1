import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

const API_URL = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

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

interface ScoringRules {
  grand_prix_min: number;
  laureate_1_min: number;
  laureate_2_min: number;
  laureate_3_min: number;
}

interface Contest {
  id: number;
  title: string;
}

interface ContestProgramTabProps {
  contests: Contest[];
}

const emptyRow = (): Omit<ProgramRow, 'id' | 'order_number'> => ({
  region: '',
  directing_party: '',
  participant_name: '',
  age: '',
  nomination: '',
  piece_title: '',
  duration: '',
});

const defaultScoring: ScoringRules = {
  grand_prix_min: 95,
  laureate_1_min: 85,
  laureate_2_min: 75,
  laureate_3_min: 65,
};

const ContestProgramTab = ({ contests }: ContestProgramTabProps) => {
  const { toast } = useToast();
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [scoring, setScoring] = useState<ScoringRules>(defaultScoring);
  const [loading, setLoading] = useState(false);
  const [savingScoring, setSavingScoring] = useState(false);
  const [editingRow, setEditingRow] = useState<ProgramRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState(emptyRow());

  const handleExportExcel = () => {
    const contestName = contests.find(c => String(c.id) === selectedContestId)?.title || 'программа';

    const wsData = [
      ['№', 'Регион', 'Направляющая сторона', 'ФИО / Коллектив', 'Возраст', 'Номинация', 'Произведение / номер', 'Хронометраж'],
      ...rows.map(r => [r.order_number, r.region, r.directing_party, r.participant_name, r.age, r.nomination, r.piece_title, r.duration]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Программа');
    XLSX.writeFile(wb, `${contestName}_программа.xlsx`);
  };

  const loadProgram = useCallback(async (contestId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?contest_id=${contestId}`);
      const data = await res.json();
      setRows(data.rows || []);
      setScoring(data.scoring || defaultScoring);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить программу', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedContestId) {
      loadProgram(selectedContestId);
    }
  }, [selectedContestId, loadProgram]);

  const handleAddRow = async () => {
    if (!selectedContestId) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(selectedContestId), ...newRow }),
      });
      const data = await res.json();
      if (data.row) {
        setRows(prev => [...prev, data.row]);
        setNewRow(emptyRow());
        setShowAddForm(false);
        toast({ title: 'Добавлено', description: 'Строка добавлена в программу' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось добавить строку', variant: 'destructive' });
    }
  };

  const handleUpdateRow = async () => {
    if (!editingRow) return;
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      });
      setRows(prev => prev.map(r => r.id === editingRow.id ? editingRow : r));
      setEditingRow(null);
      toast({ title: 'Сохранено' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  const handleDeleteRow = async (id: number) => {
    try {
      await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setRows(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Удалено' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить строку', variant: 'destructive' });
    }
  };

  const handleSaveScoring = async () => {
    if (!selectedContestId) return;
    setSavingScoring(true);
    try {
      await fetch(`${API_URL}/scoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(selectedContestId), ...scoring }),
      });
      toast({ title: 'Система оценивания сохранена' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить систему оценивания', variant: 'destructive' });
    } finally {
      setSavingScoring(false);
    }
  };

  const columns = [
    { key: 'order_number', label: '№', width: 'w-12' },
    { key: 'region', label: 'Регион', width: 'w-28' },
    { key: 'directing_party', label: 'Направляющая сторона', width: 'w-40' },
    { key: 'participant_name', label: 'ФИО / Коллектив', width: 'w-40' },
    { key: 'age', label: 'Возраст', width: 'w-20' },
    { key: 'nomination', label: 'Номинация', width: 'w-32' },
    { key: 'piece_title', label: 'Произведение / номер', width: 'w-40' },
    { key: 'duration', label: 'Хронометраж', width: 'w-28' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-72">
          <Select value={selectedContestId} onValueChange={setSelectedContestId}>
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
        {selectedContestId && (
          <>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить строку
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={rows.length === 0}>
              <Icon name="Download" className="mr-2 h-4 w-4" />
              Экспорт Excel
            </Button>
          </>
        )}
      </div>

      {selectedContestId && (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Система оценивания</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: 'grand_prix_min', label: 'Гран-При (от баллов)' },
                { key: 'laureate_1_min', label: 'Лауреат 1 степени (от)' },
                { key: 'laureate_2_min', label: 'Лауреат 2 степени (от)' },
                { key: 'laureate_3_min', label: 'Лауреат 3 степени (от)' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-1 block">{label}</label>
                  <Input
                    type="number"
                    value={scoring[key]}
                    onChange={e => setScoring(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    min={0}
                    max={100}
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={handleSaveScoring} disabled={savingScoring}>
              {savingScoring ? 'Сохраняю...' : 'Сохранить систему оценивания'}
            </Button>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Программа конкурса</h3>

            {showAddForm && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                <h4 className="font-medium">Новая строка</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Регион</label>
                    <Input value={newRow.region} onChange={e => setNewRow(p => ({ ...p, region: e.target.value }))} placeholder="Регион" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Направляющая сторона</label>
                    <Input value={newRow.directing_party} onChange={e => setNewRow(p => ({ ...p, directing_party: e.target.value }))} placeholder="Организация" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">ФИО / Коллектив</label>
                    <Input value={newRow.participant_name} onChange={e => setNewRow(p => ({ ...p, participant_name: e.target.value }))} placeholder="ФИО или название" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Возраст</label>
                    <Input value={newRow.age} onChange={e => setNewRow(p => ({ ...p, age: e.target.value }))} placeholder="Возраст" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Номинация</label>
                    <Input value={newRow.nomination} onChange={e => setNewRow(p => ({ ...p, nomination: e.target.value }))} placeholder="Номинация" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium mb-1 block">Произведение / номер</label>
                    <Input value={newRow.piece_title} onChange={e => setNewRow(p => ({ ...p, piece_title: e.target.value }))} placeholder="Название" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Хронометраж</label>
                    <Input value={newRow.duration} onChange={e => setNewRow(p => ({ ...p, duration: e.target.value }))} placeholder="мм:сс" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddRow}>Добавить</Button>
                  <Button variant="outline" onClick={() => { setShowAddForm(false); setNewRow(emptyRow()); }}>Отмена</Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Программа пуста. Добавьте первую строку.</div>
            ) : (
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
                    {rows.map(row => (
                      <tr key={row.id} className="border-b hover:bg-muted/30">
                        {editingRow?.id === row.id ? (
                          <>
                            {columns.map(col => (
                              <td key={col.key} className="py-1 px-2">
                                <Input
                                  value={String(editingRow[col.key])}
                                  onChange={e => setEditingRow(prev => prev ? { ...prev, [col.key]: col.key === 'order_number' ? Number(e.target.value) : e.target.value } : null)}
                                  className="h-7 text-xs"
                                />
                              </td>
                            ))}
                            <td className="py-1 px-2">
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 px-2" onClick={handleUpdateRow}>
                                  <Icon name="Check" size={12} />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setEditingRow(null)}>
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
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingRow({ ...row })}>
                                  <Icon name="Pencil" size={14} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => handleDeleteRow(row.id)}>
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
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ContestProgramTab;