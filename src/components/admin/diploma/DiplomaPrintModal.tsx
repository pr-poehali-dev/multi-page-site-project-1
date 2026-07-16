import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDiplomaTemplates } from '@/hooks/useDiplomaTemplates';
import { loadCustomFonts } from '@/lib/loadCustomFonts';
import { DiplomaTemplateField, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/types/diploma';
import DiplomaTemplateCanvas from './DiplomaTemplateCanvas';

const RESULTS_API = 'https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d';

interface ProgramRow {
  id: number;
  participant_name: string;
  director_name: string;
  region: string;
  directing_party: string;
  age: string;
  nomination: string;
  piece_title: string;
  duration: string;
  diploma_number: string;
  participation_format: string;
}

interface ContestInfo {
  id: number;
  title: string;
  location?: string;
  event_date?: string;
}

interface DiplomaPrintModalProps {
  contest: ContestInfo;
  rows: ProgramRow[];
  onClose: () => void;
}

const DiplomaPrintModal = ({ contest, rows, onClose }: DiplomaPrintModalProps) => {
  const { toast } = useToast();
  const { templates, fonts, loadTemplate } = useDiplomaTemplates();
  const [templateId, setTemplateId] = useState('');
  const [fields, setFields] = useState<DiplomaTemplateField[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(rows.map(r => r.id)));
  const [awardsById, setAwardsById] = useState<Record<number, string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewRow, setPreviewRow] = useState<ProgramRow | null>(rows[0] || null);
  const [, setFontsVersion] = useState(0);

  useEffect(() => { loadCustomFonts(fonts).then(() => setFontsVersion(v => v + 1)); }, [fonts]);

  useEffect(() => {
    fetch(`${RESULTS_API}?action=results_table&contest_id=${contest.id}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<number, string> = {};
        (d.rows || []).forEach((r: { id: number; award?: string }) => { if (r.award) map[r.id] = r.award; });
        setAwardsById(map);
      })
      .catch(() => {});
  }, [contest.id]);

  useEffect(() => {
    if (!templateId) { setFields([]); return; }
    setLoadingTemplate(true);
    loadTemplate(Number(templateId)).then(data => {
      if (data) {
        setFields(data.fields);
        setOrientation(data.template.orientation);
        setBackgroundUrl(data.template.background_url);
      }
      setLoadingTemplate(false);
    });
  }, [templateId, loadTemplate]);

  const buildPreviewValues = (row: ProgramRow): Record<string, string> => ({
    participant_name: row.participant_name,
    director_name: row.director_name,
    region: row.region,
    directing_party: row.directing_party,
    age: row.age,
    nomination: row.nomination,
    piece_title: row.piece_title,
    duration: row.duration,
    participation_format: row.participation_format,
    diploma_number: row.diploma_number,
    award: awardsById[row.id] || '',
    contest_title: contest.title,
    contest_location: contest.location || '',
    contest_event_date: contest.event_date || '',
  });

  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));
  };

  const selectedRows = useMemo(() => rows.filter(r => selectedIds.has(r.id)), [rows, selectedIds]);

  const renderRowToCanvas = async (row: ProgramRow, container: HTMLDivElement) => {
    const root = createRoot(container);
    await new Promise<void>(resolve => {
      root.render(
        <DiplomaTemplateCanvas
          orientation={orientation}
          backgroundUrl={backgroundUrl}
          fields={fields}
          selectedIndex={null}
          onSelect={() => {}}
          onUpdateField={() => {}}
          previewMode
          previewValues={buildPreviewValues(row)}
        />
      );
      setTimeout(resolve, 150);
    });
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    root.unmount();
    return canvas;
  };

  const handlePrint = async () => {
    if (!templateId || selectedRows.length === 0) return;
    setGenerating(true);
    try {
      await loadCustomFonts(fonts);
      await document.fonts.ready;
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const widthMm = orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
      const heightMm = orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

      for (let i = 0; i < selectedRows.length; i++) {
        const canvas = await renderRowToCanvas(selectedRows[i], container);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage('a4', orientation);
        pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
      }

      document.body.removeChild(container);

      const templateName = templates.find(t => String(t.id) === templateId)?.name || 'дипломы';
      pdf.save(`${contest.title}_${templateName}.pdf`);
      toast({ title: 'Готово', description: `Сгенерировано дипломов: ${selectedRows.length}` });
    } catch {
      toast({ title: 'Ошибка генерации PDF', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Печать дипломов — {contest.title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><Icon name="X" size={16} /></Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r p-4 overflow-y-auto shrink-0 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Шаблон диплома</label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Выберите шаблон" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Участники</label>
                <button className="text-xs text-primary" onClick={toggleAll}>
                  {selectedIds.size === rows.length ? 'Снять всё' : 'Выбрать всё'}
                </button>
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto border rounded-lg p-2">
                {rows.map(row => (
                  <label key={row.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer" onMouseEnter={() => setPreviewRow(row)}>
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} className="w-3.5 h-3.5" />
                    <span className="truncate">{row.participant_name || '—'}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handlePrint} disabled={!templateId || selectedRows.length === 0 || generating}>
              {generating ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Printer" size={16} className="mr-2" />}
              Сформировать PDF ({selectedRows.length})
            </Button>
          </div>

          <div className="flex-1 overflow-auto bg-muted/40 p-6 flex items-start justify-center">
            {loadingTemplate ? (
              <Icon name="Loader" size={32} className="animate-spin text-muted-foreground mt-16" />
            ) : !templateId ? (
              <p className="text-muted-foreground mt-16">Выберите шаблон, чтобы увидеть предпросмотр</p>
            ) : previewRow ? (
              <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}>
                <DiplomaTemplateCanvas
                  orientation={orientation}
                  backgroundUrl={backgroundUrl}
                  fields={fields}
                  selectedIndex={null}
                  onSelect={() => {}}
                  onUpdateField={() => {}}
                  previewMode
                  previewValues={buildPreviewValues(previewRow)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
};

export default DiplomaPrintModal;