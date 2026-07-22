import { Fragment } from 'react';

// Красиво форматирует многострочный текст (например, новость или отзыв):
// пустая строка = новый абзац, одинарный перенос = <br/> внутри абзаца.
// Используется везде, где нужно отобразить полный текст с сохранением
// форматирования, введённого автором в textarea.
export const formatMultilineText = (text: string) => {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim() !== '');

  return paragraphs.map((paragraph, pIdx) => (
    <p key={pIdx} className={pIdx > 0 ? 'mt-4' : ''}>
      {paragraph.split('\n').map((line, lIdx, arr) => (
        <Fragment key={lIdx}>
          {line}
          {lIdx < arr.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  ));
};
