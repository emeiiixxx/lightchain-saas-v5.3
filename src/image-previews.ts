import bundledPreviews from './image-previews.json';

const previews: Record<string, string> = bundledPreviews;
const uploadedPreviews = new Map<string, string>();

export function imagePreview(url: string): string | undefined {
  if (uploadedPreviews.has(url)) return uploadedPreviews.get(url);
  // Works in local development and under the GitHub Pages project prefix.
  const resolved = new URL(url, window.location.href);
  if (resolved.origin !== window.location.origin) return undefined;
  const path = resolved.pathname;
  const base = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
  const key = path.startsWith(base) ? '/' + path.slice(base.length) : path;
  return previews[key.replace(/^\/assets\//, '')];
}

export function rememberImagePreview(url: string, image: HTMLImageElement): void {
  if (uploadedPreviews.has(url) || !image.naturalWidth || !image.naturalHeight) return;
  try {
    const scale = Math.min(1, 32 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    uploadedPreviews.set(url, canvas.toDataURL('image/webp', .35));
    // Retain only small previews; never keep decoded full-size images alive.
    if (uploadedPreviews.size > 128) uploadedPreviews.delete(uploadedPreviews.keys().next().value!);
  } catch { /* Remote images without CORS still work with a neutral placeholder. */ }
}
