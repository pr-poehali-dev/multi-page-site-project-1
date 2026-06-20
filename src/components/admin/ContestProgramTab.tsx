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

interface Contest {
  id: number;
  title: string;
  location?: string;
  event_date?: string;
  end_date?: string;
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

const ContestProgramTab = ({ contests }: ContestProgramTabProps) => {
  const { toast } = useToast();
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<ProgramRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState(emptyRow());

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContestId) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as unknown[][];

        const dataRows = rawRows.slice(1).filter(r => Array.isArray(r) && r.some(cell => cell !== undefined && cell !== ''));

        if (dataRows.length === 0) {
          toast({ title: 'Файл пуст', description: 'Не найдено строк для импорта', variant: 'destructive' });
          return;
        }

        let imported = 0;
        const newRows: ProgramRow[] = [];
        for (const r of dataRows) {
          const row = r as (string | number)[];
          const payload = {
            contest_id: Number(selectedContestId),
            order_number: Number(row[0]) || (rows.length + imported + 1),
            region: String(row[1] ?? ''),
            directing_party: String(row[2] ?? ''),
            participant_name: String(row[3] ?? ''),
            age: String(row[4] ?? ''),
            nomination: String(row[5] ?? ''),
            piece_title: String(row[6] ?? ''),
            duration: String(row[7] ?? ''),
          };
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (result.row) {
            newRows.push(result.row);
            imported++;
          }
        }

        setRows(prev => [...prev, ...newRows]);
        toast({ title: 'Импорт завершён', description: `Добавлено строк: ${imported}` });
      } catch {
        toast({ title: 'Ошибка', description: 'Не удалось прочитать файл', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

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

  const now = new Date();
  const activeContests = contests.filter(c => !c.end_date || new Date(c.end_date) >= now);
  const pastContests = contests.filter(c => c.end_date && new Date(c.end_date) < now);
  const archiveYears = Array.from(
    new Set(pastContests.map(c => new Date(c.end_date!).getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-96">
          <Select value={selectedContestId} onValueChange={setSelectedContestId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите конкурс" />
            </SelectTrigger>
            <SelectContent>
              {activeContests.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Текущие</div>
                  {activeContests.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-medium">{c.title}</span>
                      {(c.event_date || c.location) && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {[c.event_date, c.location].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </>
              )}
              {archiveYears.map(year => (
                <>
                  <div key={`y-${year}`} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">Архив {year}</div>
                  {pastContests
                    .filter(c => new Date(c.end_date!).getFullYear() === year)
                    .map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-medium text-muted-foreground">{c.title}</span>
                        {(c.event_date || c.location) && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {[c.event_date, c.location].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedContestId && (() => {
          const c = contests.find(c => String(c.id) === selectedContestId);
          return (c?.location || c?.event_date) ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {c?.location && <span className="flex items-center gap-1"><Icon name="MapPin" size={14} />{c.location}</span>}
              {c?.event_date && <span className="flex items-center gap-1"><Icon name="Calendar" size={14} />{c.event_date}</span>}
            </div>
          ) : null;
        })()}
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
            <label>
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  <Icon name="Upload" className="mr-2 h-4 w-4" />
                  Импорт Excel
                </span>
              </Button>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>
          </>
        )}
      </div>

      {selectedContestId && (
        <>
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