// Утилита для автоматического подбора размера шрифта, чтобы текст помещался в область поля.
// Использует offscreen canvas для измерения ширины текста (без реального рендеринга в DOM).

let measureCtx: CanvasRenderingContext2D | null = null;

const getCtx = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
};

const wrapLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
): number => {
  ctx.font = `${fontWeight === 'bold' ? 'bold' : fontWeight === 'normal' ? 'normal' : fontWeight} ${fontSize}px ${fontFamily}`;
  const paragraphs = text.split('\n');
  let totalLines = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let line = '';
    let lineCount = paragraph === '' ? 1 : 0;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidthPx && line) {
        lineCount += 1;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lineCount += 1;
    totalLines += Math.max(1, lineCount);
  }
  return totalLines;
};

interface AutoFitOptions {
  widthPx: number;
  heightPx: number;
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
  maxFontSize: number;
  minFontSize?: number;
  paddingPx?: number;
}

/**
 * Подбирает наибольший размер шрифта (не превышающий maxFontSize),
 * при котором текст с переносами по словам помещается в заданную область.
 */
export const computeAutoFitFontSize = (text: string, opts: AutoFitOptions): number => {
  const ctx = getCtx();
  const minFontSize = opts.minFontSize ?? 6;
  const padding = opts.paddingPx ?? 4;
  const availWidth = Math.max(0, opts.widthPx - padding * 2);
  const availHeight = Math.max(0, opts.heightPx - padding * 2);
  if (!ctx || !text.trim() || availWidth <= 0 || availHeight <= 0) return opts.maxFontSize;

  for (let size = opts.maxFontSize; size >= minFontSize; size -= 0.5) {
    const lines = wrapLines(ctx, text, availWidth, size, opts.fontFamily, opts.fontWeight);
    const totalHeight = lines * size * opts.lineHeight;
    if (totalHeight <= availHeight) return size;
  }
  return minFontSize;
};
