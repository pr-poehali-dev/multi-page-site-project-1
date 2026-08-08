import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import DiplomaPrintModal from './diploma/DiplomaPrintModal';
import { Contest, NominationOption, ProgramRow } from './program/programTypes';
import ProgramToolbar from './program/ProgramToolbar';
import ProgramAddRowForm from './program/ProgramAddRowForm';
import ProgramTable from './program/ProgramTable';
import { adminHeaders } from '@/config/adminApi';

const API_URL = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

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
  diploma_number: '',
  director_name: '',
  participation_format: '',
  nomination_id: null,
});

const ContestProgramTab = ({ contests }: ContestProgramTabProps) => {
  const { toast } = useToast();
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<ProgramRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState(emptyRow());
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [nominationOptions, setNominationOptions] = useState<NominationOption[]>([]);

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
            director_name: String(row[4] ?? ''),
            age: String(row[5] ?? ''),
            nomination: String(row[6] ?? ''),
            piece_title: String(row[7] ?? ''),
            duration: String(row[8] ?? ''),
            participation_format: String(row[9] ?? ''),
          };
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: adminHeaders(),
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
      ['№', 'Регион', 'Направляющая сторона', 'ФИО / Коллектив', 'ФИО руководителя', 'Возраст', 'Номинация', 'Произведение / номер', 'Хронометраж', 'Формат участия'],
      ...filteredRows.map(r => [r.order_number, r.region, r.directing_party, r.participant_name, r.director_name, r.age, r.nomination, r.piece_title, r.duration, r.participation_format]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Программа');
    XLSX.writeFile(wb, `${contestName}_программа.xlsx`);
  };

  const loadProgram = useCallback(async (contestId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?contest_id=${contestId}`, { headers: adminHeaders() });
      const data = await res.json();
      setRows(data.rows || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить программу', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadNominations = useCallback(async (contestId: string) => {
    try {
      const res = await fetch(`${API_URL}?action=nominations&contest_id=${contestId}`, { headers: adminHeaders() });
      const data = await res.json();
      setNominationOptions((data.nominations || []).map((n: { id: number; name: string }) => ({ id: n.id, name: n.name })));
    } catch {
      setNominationOptions([]);
    }
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      setFormatFilter('all');
      loadProgram(selectedContestId);
      loadNominations(selectedContestId);
    }
  }, [selectedContestId, loadProgram, loadNominations]);

  const availableFormats = Array.from(new Set(rows.map(r => r.participation_format).filter(Boolean)));
  const filteredRows = formatFilter === 'all' ? rows : rows.filter(r => r.participation_format === formatFilter);

  const handleAddRow = async () => {
    if (!selectedContestId) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: adminHeaders(),
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
        headers: adminHeaders(),
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
        headers: adminHeaders(),
        body: JSON.stringify({ id }),
      });
      setRows(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Удалено' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить строку', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <ProgramToolbar
        contests={contests}
        selectedContestId={selectedContestId}
        onSelectedContestIdChange={setSelectedContestId}
        rows={rows}
        showAddForm={showAddForm}
        onShowAddForm={() => setShowAddForm(true)}
        onExportExcel={handleExportExcel}
        onShowPrintModal={() => setShowPrintModal(true)}
        onImportExcel={handleImportExcel}
        availableFormats={availableFormats}
        formatFilter={formatFilter}
        onFormatFilterChange={setFormatFilter}
      />

      {selectedContestId && (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Программа конкурса</h3>

            {showAddForm && (
              <ProgramAddRowForm
                newRow={newRow}
                onNewRowChange={setNewRow}
                nominationOptions={nominationOptions}
                onAddRow={handleAddRow}
                onCancel={() => { setShowAddForm(false); setNewRow(emptyRow()); }}
              />
            )}

            <ProgramTable
              loading={loading}
              rows={rows}
              filteredRows={filteredRows}
              editingRow={editingRow}
              onSetEditingRow={setEditingRow}
              nominationOptions={nominationOptions}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
            />
          </Card>
        </>
      )}

      {showPrintModal && selectedContestId && (() => {
        const contest = contests.find(c => String(c.id) === selectedContestId);
        if (!contest) return null;
        return (
          <DiplomaPrintModal
            contest={contest}
            rows={filteredRows}
            onClose={() => setShowPrintModal(false)}
          />
        );
      })()}
    </div>
  );
};

export default ContestProgramTab;