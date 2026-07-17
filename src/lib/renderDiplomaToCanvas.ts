// Рисует диплом для сохранения в PDF напрямую через Canvas 2D API — без html2canvas.
//
// Почему не html2canvas: он делает "снимок" DOM через собственный движок вёрстки
// (или через SVG foreignObject), и в обоих случаях расчёт переноса строк и межстрочного
// интервала для кастомных шрифтов (загруженных через FontFace API) даёт другой результат,
// чем в живом браузерном рендере — из-за этого текст в сохранённом PDF "уезжал" и
// накладывался, хотя в предпросмотре всё было ровно. Прямая отрисовка через Canvas 2D
// использует ту же ctx.measureText(), что и живой предпросмотр (см. diplomaLayout.ts),
// поэтому расхождений быть не может в принципе — это один и тот же код.

import { DiplomaTemplateField } from '@/types/diploma';
import { computeAutoFitFontSize, measureTextWidth } from './autoFitText';
import { fieldPreviewText, computeGroupLayout, wrapTextLines, canvasFont } from './diplomaLayout';

interface RenderOptions {
  pageWidthPx: number;
  pageHeightPx: number;
  backgroundDataUrl: string;
  fields: DiplomaTemplateField[];
  previewValues: Record<string, string>;
  scale?: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const renderDiplomaToCanvas = async (opts: RenderOptions): Promise<HTMLCanvasElement> => {
  const scale = opts.scale ?? 2;
  const canvas = document.createElement('canvas');
  canvas.width = opts.pageWidthPx * scale;
  canvas.height = opts.pageHeightPx * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D недоступен');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, opts.pageWidthPx, opts.pageHeightPx);

  if (opts.backgroundDataUrl) {
    const img = await loadImage(opts.backgroundDataUrl);
    // object-cover: заполняем область целиком, обрезая лишнее по краям — как в живом предпросмотре.
    const areaRatio = opts.pageWidthPx / opts.pageHeightPx;
    const imgRatio = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > areaRatio) {
      sw = img.height * areaRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / areaRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, opts.pageWidthPx, opts.pageHeightPx);
  }

  const groupLayout = computeGroupLayout(
    opts.fields, opts.pageWidthPx, opts.pageHeightPx, opts.previewValues, measureTextWidth, computeAutoFitFontSize,
  );

  opts.fields.forEach((field, i) => {
    const override = groupLayout.get(i);
    const xPx = override ? override.xPx : (field.pos_x / 100) * opts.pageWidthPx;
    const yPx = override ? override.yPx : (field.pos_y / 100) * opts.pageHeightPx;
    const wPx = override ? override.wPx : (field.width / 100) * opts.pageWidthPx;
    const hPx = override ? override.hPx : (field.height / 100) * opts.pageHeightPx;

    const text = fieldPreviewText(field, opts.previewValues);
    const autoFit = field.auto_fit !== false;
    const fontSize = override
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

    const padding = 2;
    const availWidth = Math.max(0, wPx - padding * 2);
    ctx.font = canvasFont(field.font_weight, fontSize, field.font_family);
    const lines = wrapTextLines(ctx, text, availWidth);
    const lineHeightPx = fontSize * field.line_height;
    const totalTextHeight = lines.length * lineHeightPx;

    ctx.fillStyle = field.font_color;
    ctx.textBaseline = 'alphabetic';
    // Вертикальное центрирование блока строк внутри поля — соответствует align-items: center
    // у живого предпросмотра (см. DiplomaTemplateCanvas.tsx).
    let cursorY = yPx + (hPx - totalTextHeight) / 2 + lineHeightPx * 0.8;

    lines.forEach(line => {
      const lineWidth = ctx.measureText(line).width;
      let lineX: number;
      if (field.text_align === 'center') lineX = xPx + (wPx - lineWidth) / 2;
      else if (field.text_align === 'right') lineX = xPx + wPx - padding - lineWidth;
      else lineX = xPx + padding;
      ctx.fillText(line, lineX, cursorY);
      cursorY += lineHeightPx;
    });
  });

  return canvas;
};
