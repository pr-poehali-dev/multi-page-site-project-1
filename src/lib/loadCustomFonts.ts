import { DiplomaFont } from '@/types/diploma';

const injectedFonts = new Set<string>();

// Динамически подключает загруженные пользователем шрифты через @font-face,
// чтобы их можно было использовать в конструкторе дипломов и при рендере готового диплома.
export const loadCustomFonts = (fonts: DiplomaFont[]) => {
  fonts.forEach(font => {
    if (injectedFonts.has(font.name)) return;
    const style = document.createElement('style');
    style.setAttribute('data-diploma-font', font.name);
    style.innerHTML = `
      @font-face {
        font-family: "${font.name}";
        src: url("${font.font_url}");
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    injectedFonts.add(font.name);
  });
};
