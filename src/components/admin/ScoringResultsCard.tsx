import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AWARD_COLORS: Record<string, string> = {
  'Гран-При': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Лауреат I': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Лауреат II': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Лауреат III': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Дипломант I': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Дипломант II': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Дипломант III': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'Участник': 'bg-muted text-muted-foreground',
};

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

interface ScoringResultsCardProps {
  results: ResultRow[];
  loadingResults: boolean;
  exportingPdf: boolean;
  contestTitle: string;
  selectedContest: string;
  onRefresh: () => void;
  onSetExportingPdf: (val: boolean) => void;
}

const ScoringResultsCard = ({
  results,
  loadingResults,
  exportingPdf,
  contestTitle,
  onRefresh,
  onSetExportingPdf,
}: ScoringResultsCardProps) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const maxJury = results.reduce((m, r) => Math.max(m, r.jury_count), 0);

  const exportExcel = () => {
    if (!results.length) return;
    const juryCount = Math.max(...results.map(r => r.jury_count), 1);
    const juryHeaders = Array.from({ length: juryCount }, (_, i) => `Судья ${i + 1}`);
    const headers = ['№', 'Регион', 'Направляющая сторона', 'ФИО / Коллектив', 'Возраст', 'Номинация', 'Произведение / номер', 'Хронометраж', ...juryHeaders, 'Итог', 'Звание'];
    const rows = results.map(row => {
      const juryScores = Array.from({ length: juryCount }, (_, i) => {
        const entry = row.jury_scores.find(s => s.order === i + 1);
        return i < row.jury_count ? (entry?.score ?? '') : '';
      });
      return [row.order_number, row.region, row.directing_party, row.participant_name, row.age, row.nomination, row.piece_title, row.duration, ...juryScores, row.total ?? '', row.award];
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 4 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 8 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, ...Array(juryCount).fill({ wch: 10 }), { wch: 8 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Результаты');
    XLSX.writeFile(wb, `${contestTitle}_результаты.xlsx`);
  };

  const exportPdf = async () => {
    if (!tableRef.current || !results.length) return;
    onSetExportingPdf(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 10;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 5;
      pdf.setFontSize(12);
      pdf.text(`Результаты оценивания: ${contestTitle}`, 5, y + 5);
      y += 10;
      if (imgH <= pageH - y) {
        pdf.addImage(imgData, 'PNG', 5, y, imgW, imgH);
      } else {
        let srcY = 0;
        const sliceH = ((pageH - y) / imgH) * canvas.height;
        while (srcY < canvas.height) {
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(sliceH, canvas.height - srcY);
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, -srcY);
          const sliceImg = sliceCanvas.toDataURL('image/png');
          const sliceImgH = (sliceCanvas.height * imgW) / canvas.width;
          pdf.addImage(sliceImg, 'PNG', 5, y, imgW, sliceImgH);
          srcY += sliceH;
          if (srcY < canvas.height) { pdf.addPage(); y = 5; }
        }
      }
      pdf.save(`${contestTitle}_результаты.pdf`);
    } finally {
      onSetExportingPdf(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Результаты оценивания</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingResults}>
            <Icon name={loadingResults ? 'Loader' : 'RefreshCw'} size={14} className={`mr-2 ${loadingResults ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={!results.length}>
            <Icon name="FileSpreadsheet" size={14} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={!results.length || exportingPdf}>
            <Icon name={exportingPdf ? 'Loader' : 'FileText'} size={14} className={`mr-2 ${exportingPdf ? 'animate-spin' : ''}`} />
            PDF
          </Button>
        </div>
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
        <div ref={tableRef} className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">№</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Регион</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Направляющая сторона</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">ФИО / Коллектив</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Возраст</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Номинация</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Произведение / номер</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Хронометраж</th>
                {Array.from({ length: Math.max(maxJury, 1) }, (_, i) => (
                  <th key={i} className="text-center py-2 px-2 font-medium text-muted-foreground">Судья {i+1}</th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Итог</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Звание</th>
              </tr>
            </thead>
            <tbody>
              {results.map(row => (
                <tr key={row.id} className="border-b hover:bg-muted/20">
                  <td className="py-2 px-2 text-secondary font-bold">{row.order_number}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.region || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.directing_party || '—'}</td>
                  <td className="py-2 px-2 font-medium">{row.participant_name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.age || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.nomination || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.piece_title || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.duration || '—'}</td>
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
  );
};

export default ScoringResultsCard;