import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { DiplomaTemplateField, DiplomaGuide, MM_TO_PX, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/types/diploma';
import { computeAutoFitFontSize, measureTextWidth } from '@/lib/autoFitText';
import { fieldPreviewText, computeGroupLayout } from '@/lib/diplomaLayout';

interface DiplomaTemplateCanvasProps {
  orientation: 'portrait' | 'landscape';
  backgroundUrl: string;
  fields: DiplomaTemplateField[];
  selectedIndices?: number[];
  onSelect?: (indices: number[]) => void;
  onUpdateField: (index: number, updates: Partial<DiplomaTemplateField>) => void;
  previewMode?: boolean;
  previewValues?: Record<string, string>;
  guides?: DiplomaGuide[];
  onGuidesChange?: (guides: DiplomaGuide[]) => void;
}

const SNAP_THRESHOLD = 6;

const nearestSnap = (edges: number[], targets: number[]): number | null => {
  for (const edge of edges) {
    for (const t of targets) {
      if (Math.abs(edge - t) <= SNAP_THRESHOLD) return t - edge;
    }
  }
  return null;
};

interface DragOffset {
  activeIndex: number;
  moveSet: number[];
  dx: number;
  dy: number;
}

const DiplomaTemplateCanvas = ({
  orientation,
  backgroundUrl,
  fields,
  selectedIndices = [],
  onSelect,
  onUpdateField,
  previewMode = false,
  previewValues,
  guides = [],
  onGuidesChange,
}: DiplomaTemplateCanvasProps) => {
  const [dragOffset, setDragOffset] = useState<DragOffset | null>(null);
  const [draggingGuideId, setDraggingGuideId] = useState<string | null>(null);

  const widthMm = orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const heightMm = orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageWidthPx = widthMm * MM_TO_PX;
  const pageHeightPx = heightMm * MM_TO_PX;

  const groupLayout = computeGroupLayout(fields, pageWidthPx, pageHeightPx, previewValues, measureTextWidth, computeAutoFitFontSize);

  const computeMoveSet = (index: number): number[] => {
    const field = fields[index];
    if (field.group_id != null) {
      return fields.reduce<number[]>((acc, f, i) => (f.group_id === field.group_id ? [...acc, i] : acc), []);
    }
    if (selectedIndices.includes(index) && selectedIndices.length > 1) return selectedIndices;
    return [index];
  };

  const snapTargetsX = [0, pageWidthPx / 2, pageWidthPx, ...guides.filter(g => g.orientation === 'v').map(g => (g.pos / 100) * pageWidthPx)];
  const snapTargetsY = [0, pageHeightPx / 2, pageHeightPx, ...guides.filter(g => g.orientation === 'h').map(g => (g.pos / 100) * pageHeightPx)];

  const snapXY = (x: number, y: number, w: number, h: number) => {
    const dx = nearestSnap([x, x + w / 2, x + w], snapTargetsX);
    const dy = nearestSnap([y, y + h / 2, y + h], snapTargetsY);
    return { x: dx !== null ? x + dx : x, y: dy !== null ? y + dy : y };
  };

  const handleFieldClick = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewMode || !onSelect) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const next = selectedIndices.includes(i) ? selectedIndices.filter(x => x !== i) : [...selectedIndices, i];
      onSelect(next);
    } else {
      onSelect([i]);
    }
  };

  const startGuideDrag = (guide: DiplomaGuide, pageEl: HTMLElement) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingGuideId(guide.id);
    const move = (ev: MouseEvent) => {
      const rect = pageEl.getBoundingClientRect();
      let pos = guide.orientation === 'h'
        ? ((ev.clientY - rect.top) / rect.height) * 100
        : ((ev.clientX - rect.left) / rect.width) * 100;
      pos = Math.max(0, Math.min(100, pos));
      onGuidesChange?.(guides.map(g => (g.id === guide.id ? { ...g, pos } : g)));
    };
    const up = () => {
      setDraggingGuideId(null);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      id="diploma-canvas-page"
      className="relative bg-white shadow-lg mx-auto shrink-0"
      style={{ width: pageWidthPx, height: pageHeightPx }}
      onClick={() => !previewMode && onSelect?.([])}
    >
      {backgroundUrl && (
        <img src={backgroundUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
      )}

      {!previewMode && (
        <>
          <div className="absolute top-0 bottom-0 border-l border-dashed border-primary/30 pointer-events-none" style={{ left: pageWidthPx / 2 }} />
          <div className="absolute left-0 right-0 border-t border-dashed border-primary/30 pointer-events-none" style={{ top: pageHeightPx / 2 }} />
        </>
      )}

      {!previewMode && guides.map(guide => {
        const isH = guide.orientation === 'h';
        const posPx = isH ? (guide.pos / 100) * pageHeightPx : (guide.pos / 100) * pageWidthPx;
        return (
          <div
            key={guide.id}
            onMouseDown={(e) => startGuideDrag(guide, e.currentTarget.parentElement as HTMLElement)(e)}
            onDoubleClick={(e) => { e.stopPropagation(); onGuidesChange?.(guides.filter(g => g.id !== guide.id)); }}
            title="Двойной клик — удалить направляющую"
            className={`absolute z-20 ${isH ? 'left-0 right-0 h-2 -mt-1 cursor-row-resize' : 'top-0 bottom-0 w-2 -ml-1 cursor-col-resize'}`}
            style={isH ? { top: posPx } : { left: posPx }}
          >
            <div
              className={`bg-cyan-500 ${draggingGuideId === guide.id ? 'opacity-100' : 'opacity-60 hover:opacity-90'} ${isH ? 'h-px w-full mt-1' : 'w-px h-full ml-1'}`}
              style={{ borderStyle: 'dashed', borderColor: '#06b6d4', borderWidth: isH ? '1px 0 0 0' : '0 0 0 1px' }}
            />
          </div>
        );
      })}

      {fields.map((field, i) => {
        const override = groupLayout.get(i);
        const baseXPx = override ? override.xPx : (field.pos_x / 100) * pageWidthPx;
        const baseYPx = override ? override.yPx : (field.pos_y / 100) * pageHeightPx;
        const wPx = override ? override.wPx : (field.width / 100) * pageWidthPx;
        const hPx = override ? override.hPx : (field.height / 100) * pageHeightPx;

        const offsetActive = dragOffset && dragOffset.moveSet.includes(i);
        const xPx = baseXPx + (offsetActive ? dragOffset!.dx : 0);
        const yPx = baseYPx + (offsetActive ? dragOffset!.dy : 0);

        const text = fieldPreviewText(field, previewValues);
        const autoFit = field.auto_fit !== false;
        const effectiveFontSize = override
          ? override.fontSize
          : autoFit
            ? computeAutoFitFontSize(text, {
                widthPx: wPx,
                heightPx: hPx,
                fontFamily: field.font_family,
                fontWeight: field.font_weight,
                lineHeight: field.line_height,
                maxFontSize: field.font_size,
              })
            : field.font_size;

        const textStyle: React.CSSProperties = {
          fontFamily: field.font_family,
          fontSize: effectiveFontSize,
          color: field.font_color,
          fontWeight: field.font_weight,
          // html2canvas некорректно вычисляет межстрочный интервал для unitless line-height
          // (например 1.2) — строки съезжают и накладываются друг на друга при экспорте в PDF,
          // хотя в живом браузере (превью) это отображается верно. Переводим в px явно —
          // это исключает расхождение между рендером браузера и html2canvas.
          lineHeight: `${effectiveFontSize * field.line_height}px`,
          textAlign: field.text_align,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: 2,
        };

        if (previewMode) {
          return (
            <div key={i} style={{ position: 'absolute', left: xPx, top: yPx, width: wPx, height: hPx }}>
              <div style={textStyle}>{text}</div>
            </div>
          );
        }

        const isSelected = selectedIndices.includes(i);

        return (
          <Rnd
            key={i}
            bounds="parent"
            size={{ width: wPx, height: hPx }}
            position={{ x: xPx, y: yPx }}
            enableResizing={!override}
            onClick={(e: React.MouseEvent) => handleFieldClick(i, e)}
            onDragStart={() => setDragOffset({ activeIndex: i, moveSet: computeMoveSet(i), dx: 0, dy: 0 })}
            onDrag={(_e, d) => {
              const snapped = snapXY(d.x, d.y, wPx, hPx);
              setDragOffset(prev => (prev ? { ...prev, dx: snapped.x - baseXPx, dy: snapped.y - baseYPx } : prev));
            }}
            onDragStop={(_e, d) => {
              const snapped = snapXY(d.x, d.y, wPx, hPx);
              const dxPercent = ((snapped.x - baseXPx) / pageWidthPx) * 100;
              const dyPercent = ((snapped.y - baseYPx) / pageHeightPx) * 100;
              const moveSet = dragOffset?.moveSet || [i];
              moveSet.forEach(j => {
                onUpdateField(j, {
                  pos_x: fields[j].pos_x + dxPercent,
                  pos_y: fields[j].pos_y + dyPercent,
                });
              });
              setDragOffset(null);
            }}
            onResizeStop={(_e, _dir, ref, _delta, pos) => {
              onUpdateField(i, {
                width: (ref.offsetWidth / pageWidthPx) * 100,
                height: (ref.offsetHeight / pageHeightPx) * 100,
                pos_x: (pos.x / pageWidthPx) * 100,
                pos_y: (pos.y / pageHeightPx) * 100,
              });
            }}
            className={isSelected ? 'ring-2 ring-primary z-10' : 'ring-1 ring-transparent hover:ring-primary/40 z-0'}
          >
            <div className="relative w-full h-full">
              <div style={textStyle}>{text}</div>
              {isSelected && selectedIndices.length === 1 && (
                <>
                  <div className="absolute left-0 right-0 border-t border-dashed border-fuchsia-500/70 pointer-events-none" style={{ top: '50%' }} />
                  <div className="absolute top-0 bottom-0 border-l border-dashed border-fuchsia-500/70 pointer-events-none" style={{ left: '50%' }} />
                </>
              )}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
};

export default DiplomaTemplateCanvas;