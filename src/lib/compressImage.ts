// Сжимает изображение на клиенте перед загрузкой на сервер.
// Нужно, потому что облачная инфраструктура отклоняет запросы больше определённого
// размера (HTTP 413), а подложки дипломов часто приходят прямо с телефона/сканера
// и весят десятки мегабайт. Изображение уменьшается по большей стороне и пережимается
// в JPEG с постепенным снижением качества, пока не уложится в лимит.

interface CompressOptions {
  maxDimension?: number;
  maxSizeBytes?: number;
  mimeType?: string;
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

export const compressImage = async (file: File, opts: CompressOptions = {}): Promise<File> => {
  const maxDimension = opts.maxDimension ?? 2500;
  const maxSizeBytes = opts.maxSizeBytes ?? 8 * 1024 * 1024;
  const mimeType = opts.mimeType ?? 'image/jpeg';

  if (file.size <= maxSizeBytes && !file.type.includes('png') && !file.type.includes('webp')) {
    return file;
  }

  const img = await loadImage(file);
  URL.revokeObjectURL(img.src);

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.92;
  let blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

  while (blob && blob.size > maxSizeBytes && quality > 0.3) {
    quality -= 0.1;
    blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
  }

  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: mimeType });
};
