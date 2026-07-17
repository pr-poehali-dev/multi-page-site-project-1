// Общая (framework-agnostic) логика раскладки текстовых полей диплома.
// Используется и живым предпросмотром (DiplomaTemplateCanvas, рендерится в DOM),
// и генератором PDF (renderDiplomaToCanvas, рисует напрямую через Canvas 2D API).
// Вынесена в отдельный модуль намеренно: раньше PDF получался через html2canvas
// (снимок DOM-рендера), из-за чего между "как выглядит в браузере" и "как легло
// в файл" возникали расхождения — html2canvas по-своему считает перенос строк
// и межстрочный интервал, особенно с кастомными шрифтами. Когда оба места вызывают
// один и тот же код раскладки, расхождений быть не может в принципе.

import { DiplomaTemplateField, DIPLOMA_DATA_FIELDS } from '@/types/diploma';

export const fieldPreviewText = (field: DiplomaTemplateField, previewValues?: Record<string, string>): string => {
  const prefix = field.prefix_text ? `${field.prefix_text} ` : '';
  if (field.data_key === 'custom') return prefix + (field.custom_text || 'Текст');
  if (previewValues && previewValues[field.data_key] !== undefined) return prefix + (previewValues[field.data_key] || '—');
  return prefix + (DIPLOMA_DATA_FIELDS.find(f => f.key === field.data_key)?.label || field.data_key);
};

export const canvasFont = (fontWeight: string, fontSize: number, fontFamily: string): string =>
  `${fontWeight === 'bold' ? 'bold' : fontWeight === 'normal' ? 'normal' : fontWeight} ${fontSize}px ${fontFamily}`;

/** Разбивает текст на строки по словам так, чтобы каждая строка помещалась в maxWidthPx. */
export const wrapTextLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
): string[] => {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph === '') { lines.push(''); continue; }
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidthPx && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [''];
};

export interface GroupLayoutOverride {
  xPx: number;
  wPx: number;
  yPx: number;
  hPx: number;
  fontSize: number;
}

interface MeasureTextFn {
  (text: string, fontFamily: string, fontSize: number, fontWeight: string): number;
}

interface AutoFitFn {
  (text: string, opts: {
    widthPx: number; heightPx: number; fontFamily: string; fontWeight: string;
    lineHeight: number; maxFontSize: number;
  }): number;
}

/**
 * Для объединённых (сгруппированных) полей вычисляет авто-раскладку в одну строку:
 * каждое поле сжимается по факту заполнения текстом, а вся строка центрируется
 * в общей области, которую эти поля занимали изначально.
 */
export const computeGroupLayout = (
  fields: DiplomaTemplateField[],
  pageWidthPx: number,
  pageHeightPx: number,
  previewValues: Record<string, string> | undefined,
  measureTextWidth: MeasureTextFn,
  computeAutoFitFontSize: AutoFitFn,
): Map<number, GroupLayoutOverride> => {
  const overrides = new Map<number, GroupLayoutOverride>();
  const groupIds = new Set(fields.map(f => f.group_id).filter((g): g is number => g != null));

  groupIds.forEach(gid => {
    const idxs = fields.reduce<number[]>((acc, f, i) => (f.group_id === gid ? [...acc, i] : acc), []);
    if (idxs.length < 2) return;
    const sorted = [...idxs].sort((a, b) => fields[a].pos_x - fields[b].pos_x);

    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    sorted.forEach(idx => {
      const f = fields[idx];
      const x = (f.pos_x / 100) * pageWidthPx;
      const y = (f.pos_y / 100) * pageHeightPx;
      const w = (f.width / 100) * pageWidthPx;
      const h = (f.height / 100) * pageHeightPx;
      left = Math.min(left, x);
      right = Math.max(right, x + w);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + h);
    });

    const measured = sorted.map(idx => {
      const f = fields[idx];
      const text = fieldPreviewText(f, previewValues);
      const origWPx = (f.width / 100) * pageWidthPx;
      const origHPx = (f.height / 100) * pageHeightPx;
      const fontSize = f.auto_fit !== false
        ? computeAutoFitFontSize(text, {
            widthPx: origWPx,
            heightPx: origHPx,
            fontFamily: f.font_family,
            fontWeight: f.font_weight,
            lineHeight: f.line_height,
            maxFontSize: f.font_size,
          })
        : f.font_size;
      const measuredWidth = measureTextWidth(text, f.font_family, fontSize, f.font_weight);
      return { idx, width: (measuredWidth || origWPx) + 8, fontSize };
    });

    const avgFontSize = measured.reduce((s, m) => s + m.fontSize, 0) / measured.length;
    const gap = Math.max(4, avgFontSize * 0.35);
    const totalWidth = measured.reduce((s, m) => s + m.width, 0) + gap * (measured.length - 1);
    let cursorX = left + Math.max(0, (right - left - totalWidth) / 2);

    measured.forEach(m => {
      overrides.set(m.idx, { xPx: cursorX, wPx: m.width, yPx: top, hPx: bottom - top, fontSize: m.fontSize });
      cursorX += m.width + gap;
    });
  });

  return overrides;
};
