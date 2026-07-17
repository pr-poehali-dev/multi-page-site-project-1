// Утилита для автоматического подбора размера шрифта, чтобы текст помещался в область поля.
// Использует offscreen canvas для измерения ширины текста (без реального рендеринга в DOM).
// Разбивка на строки берётся из diplomaLayout.ts — того же кода, которым при экспорте PDF
// рисуется финальный текст в Canvas 2D, чтобы подобранный здесь размер шрифта гарантированно
// совпадал с тем, что реально поместится на сохранённом дипломе.

import { wrapTextLines, canvasFont } from './diplomaLayout';

let measureCtx: CanvasRenderingContext2D | null = null;

const getCtx = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
};

const countWrappedLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
): number => {
  ctx.font = canvasFont(fontWeight, fontSize, fontFamily);
  return wrapTextLines(ctx, text, maxWidthPx).length;
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
    const lines = countWrappedLines(ctx, text, availWidth, size, opts.fontFamily, opts.fontWeight);
    const totalHeight = lines * size * opts.lineHeight;
    if (totalHeight <= availHeight) return size;
  }
  return minFontSize;
};

/**
 * Измеряет фактическую ширину однострочного текста при заданном шрифте.
 * Используется для авто-раскладки объединённых (сгруппированных) полей —
 * чтобы центрировать их по реальному заполнению текстом, а не по заданной ширине рамки.
 */
export const measureTextWidth = (text: string, fontFamily: string, fontSize: number, fontWeight: string): number => {
  const ctx = getCtx();
  if (!ctx || !text) return 0;
  ctx.font = canvasFont(fontWeight, fontSize, fontFamily);
  return ctx.measureText(text).width;
};