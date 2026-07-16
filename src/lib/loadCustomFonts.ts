import { DiplomaFont } from '@/types/diploma';

const loadedFonts = new Set<string>();
const failedFonts = new Set<string>();

// Динамически подключает загруженные пользователем шрифты через FontFace API,
// чтобы их можно было использовать в конструкторе дипломов и при рендере готового диплома.
// Шрифт сначала скачивается через fetch в ArrayBuffer (а не передаётся в FontFace как URL) —
// так браузер не делает повторный CORS-запрос и ошибки загрузки видны явно, а не как
// непрозрачный DOMException.
export const loadCustomFonts = async (fonts: DiplomaFont[]): Promise<void> => {
  const toLoad = fonts.filter(f => f.font_url && !loadedFonts.has(f.name));
  if (toLoad.length === 0) return;

  await Promise.all(toLoad.map(async font => {
    try {
      const res = await fetch(font.font_url);
      if (!res.ok) throw new Error(`HTTP ${res.status} при загрузке файла шрифта`);
      const buffer = await res.arrayBuffer();
      const fontFace = new FontFace(font.name, buffer);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      loadedFonts.add(font.name);
      failedFonts.delete(font.name);
    } catch (e) {
      if (!failedFonts.has(font.name)) {
        const message = e instanceof Error ? e.message : (e as { message?: string })?.message || String(e);
        console.error(`Не удалось загрузить шрифт "${font.name}": ${message}`);
        failedFonts.add(font.name);
      }
    }
  }));
};