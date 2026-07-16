import { Rnd } from 'react-rnd';
import { DiplomaTemplateField, DIPLOMA_DATA_FIELDS, MM_TO_PX, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/types/diploma';

interface DiplomaTemplateCanvasProps {
  orientation: 'portrait' | 'landscape';
  backgroundUrl: string;
  fields: DiplomaTemplateField[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onUpdateField: (index: number, updates: Partial<DiplomaTemplateField>) => void;
  previewMode?: boolean;
  previewValues?: Record<string, string>;
}

const fieldPreviewText = (field: DiplomaTemplateField, previewValues?: Record<string, string>): string => {
  if (field.data_key === 'custom') return field.custom_text || 'Текст';
  if (previewValues && previewValues[field.data_key] !== undefined) return previewValues[field.data_key] || '—';
  return DIPLOMA_DATA_FIELDS.find(f => f.key === field.data_key)?.label || field.data_key;
};

const DiplomaTemplateCanvas = ({
  orientation,
  backgroundUrl,
  fields,
  selectedIndex,
  onSelect,
  onUpdateField,
  previewMode = false,
  previewValues,
}: DiplomaTemplateCanvasProps) => {
  const widthMm = orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const heightMm = orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageWidthPx = widthMm * MM_TO_PX;
  const pageHeightPx = heightMm * MM_TO_PX;

  return (
    <div
      id="diploma-canvas-page"
      className="relative bg-white shadow-lg mx-auto shrink-0"
      style={{ width: pageWidthPx, height: pageHeightPx }}
      onClick={() => !previewMode && onSelect(null)}
    >
      {backgroundUrl && (
        <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
      )}

      {fields.map((field, i) => {
        const xPx = (field.pos_x / 100) * pageWidthPx;
        const yPx = (field.pos_y / 100) * pageHeightPx;
        const wPx = (field.width / 100) * pageWidthPx;
        const hPx = (field.height / 100) * pageHeightPx;

        const textStyle: React.CSSProperties = {
          fontFamily: field.font_family,
          fontSize: field.font_size,
          color: field.font_color,
          fontWeight: field.font_weight,
          lineHeight: field.line_height,
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
              <div style={textStyle}>{fieldPreviewText(field, previewValues)}</div>
            </div>
          );
        }

        return (
          <Rnd
            key={i}
            bounds="parent"
            size={{ width: wPx, height: hPx }}
            position={{ x: xPx, y: yPx }}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect(i); }}
            onDragStop={(_e, d) => {
              onUpdateField(i, {
                pos_x: (d.x / pageWidthPx) * 100,
                pos_y: (d.y / pageHeightPx) * 100,
              });
            }}
            onResizeStop={(_e, _dir, ref, _delta, pos) => {
              onUpdateField(i, {
                width: (ref.offsetWidth / pageWidthPx) * 100,
                height: (ref.offsetHeight / pageHeightPx) * 100,
                pos_x: (pos.x / pageWidthPx) * 100,
                pos_y: (pos.y / pageHeightPx) * 100,
              });
            }}
            className={selectedIndex === i ? 'ring-2 ring-primary z-10' : 'ring-1 ring-transparent hover:ring-primary/40 z-0'}
          >
            <div style={textStyle}>{fieldPreviewText(field, previewValues)}</div>
          </Rnd>
        );
      })}
    </div>
  );
};

export default DiplomaTemplateCanvas;
