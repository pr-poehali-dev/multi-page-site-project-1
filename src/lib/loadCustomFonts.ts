import { DiplomaFont } from '@/types/diploma';

const loadedFonts = new Set<string>();

const fontFormat = (url: string): string => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'otf') return 'opentype';
  if (ext === 'woff2') return 'woff2';
  if (ext === 'woff') return 'woff';
  return 'truetype';
};

// Динамически подключает загруженные пользователем шрифты через FontFace API,
// чтобы их можно было использовать в конструкторе дипломов и при рендере готового диплома.
// В отличие от вставки <style>@font-face</style>, здесь можно дождаться реальной загрузки
// шрифта перед отрисовкой (важно для генерации PDF через html2canvas).
export const loadCustomFonts = async (fonts: DiplomaFont[]): Promise<void> => {
  const toLoad = fonts.filter(f => f.font_url && !loadedFonts.has(f.name));
  if (toLoad.length === 0) return;

  await Promise.all(toLoad.map(async font => {
    try {
      const fontFace = new FontFace(font.name, `url("${font.font_url}") format("${fontFormat(font.font_url)}")`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      loadedFonts.add(font.name);
    } catch (e) {
      console.error(`Не удалось загрузить шрифт "${font.name}"`, e);
    }
  }));
};