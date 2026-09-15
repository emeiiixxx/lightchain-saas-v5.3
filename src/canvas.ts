export type Viewport = { x: number; y: number; zoom: number };
export type FusionReference = { id: string; name: string; url: string };
export const MAX_FUSION_REFERENCES = 4;
export type FusionSettings = { position?: { x: number; y: number }; prompt: string; ratio: string; resolution: string; reference?: FusionReference; references?: FusionReference[] };
export const fusionReferences = (settings?: FusionSettings): FusionReference[] => settings?.references ?? (settings?.reference ? [settings.reference] : []);
export const defaultFusion = (): FusionSettings => ({ prompt: '', ratio: 'auto', resolution: '2K' });
export const FUSION_GAP = 80;
export const GROUP_GAP = 120;
export const FUSION_WIDTH = 280;
export const FUSION_HEIGHT = 579;
export type CanvasImage = { id: string; name: string; url: string; x: number; y: number; width: number; height: number; role?: 'main'; nodeOnly?: boolean; sourceImageId?: string; fusion?: FusionSettings; operation?: 'cutout' | 'fusion' | 'directed' | 'flat' };
export const CANVAS_GRID_SIZE = 32;

// Snap one shared drag delta so multi-selection spacing never changes.
export function gridDragDelta(anchor: { x: number; y: number }, dx: number, dy: number, zoom: number, enabled: boolean) {
  const x = dx / zoom, y = dy / zoom;
  return enabled
    ? { x: Math.round((anchor.x + x) / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE - anchor.x,
        y: Math.round((anchor.y + y) / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE - anchor.y }
    : { x, y };
}
export const DEFAULT_VIEW: Viewport = { x: 0, y: 0, zoom: 1 };
export function zoomAt(view: Viewport, factor: number, x: number, y: number): Viewport {
  const zoom = Math.min(4, Math.max(0.03, view.zoom * factor));
  return { zoom, x: x - (x - view.x) * zoom / view.zoom, y: y - (y - view.y) * zoom / view.zoom };
}
// Screen-space reserves for persistent chrome and the selected-image toolbar.
export function canvasSafeArea(width: number, height: number) {
  const narrow = width <= 680;
  const left = Math.min(96, width * .2), right = Math.min(32, width * .1);
  const top = Math.min(narrow ? 224 : 176, height * .35);
  const bottom = Math.min(width <= 1100 ? 144 : 88, height * .25);
  return { x: left, y: top, width: Math.max(1, width - left - right), height: Math.max(1, height - top - bottom) };
}
export function fitImages(images: CanvasImage[], width: number, height: number): Viewport {
  const bounds = boundsOf(images);
  if (!bounds) return DEFAULT_VIEW;
  const area = canvasSafeArea(width, height);
  const zoom = Math.min(1, Math.max(.03, Math.min(area.width / Math.max(1, bounds.width), area.height / Math.max(1, bounds.height))));
  return { zoom, x: area.x + area.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: area.y + area.height / 2 - (bounds.y + bounds.height / 2) * zoom };
}
export async function readImage(file: File): Promise<Omit<CanvasImage, 'x' | 'y'>> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('invalid_image');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const width = Math.min(360, image.naturalWidth);
    return { id: crypto.randomUUID(), name: file.name, url, width, height: width * image.naturalHeight / image.naturalWidth };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

export type Bounds = { x: number; y: number; width: number; height: number };
export function boundsOf(images: CanvasImage[]): Bounds | null {
  if (!images.length) return null;
  const x = Math.min(...images.map(n => n.x)), y = Math.min(...images.map(n => n.y));
  return { x, y, width: Math.max(...images.map(n => n.x + n.width)) - x, height: Math.max(...images.map(n => n.y + n.height)) - y };
}
export function arrangeImages(items: CanvasImage[], startX = 0, viewport = { width: 1440, height: 852 }): CanvasImage[] {
  if (!items.length) return [];
  const area = canvasSafeArea(viewport.width, viewport.height);
  function layout(columns: number) {
    const result: CanvasImage[] = [];
    let y = 0;
    for (let row = 0; row < items.length; row += columns) {
      let x = startX, rowHeight = 0;
      for (const n of items.slice(row, row + columns)) {
        result.push({ ...n, x, y, fusion: n.fusion ? { ...n.fusion, position: { x: n.nodeOnly ? x : x + n.width + FUSION_GAP, y } } : undefined });
        x += (n.nodeOnly ? FUSION_WIDTH : n.width + (n.fusion ? FUSION_GAP + FUSION_WIDTH : 0)) + GROUP_GAP;
        rowHeight = Math.max(rowHeight, n.nodeOnly ? 0 : n.height, n.fusion ? FUSION_HEIGHT : 0);
      }
      y += rowHeight + GROUP_GAP;
    }
    return result;
  }
  let best = layout(1), bestScore = -Infinity;
  // Compare the uncapped fit ratio; this also avoids arbitrary choices when
  // several layouts fit at 100%. Stable ties retain the smaller column count.
  for (let columns = 1; columns <= items.length; columns++) {
    const candidate = layout(columns), bounds = boundsOf(canvasNodes(candidate))!;
    const score = Math.min(area.width / bounds.width, area.height / bounds.height);
    if (score > bestScore + 1e-9) { best = candidate; bestScore = score; }
  }
  return best;
}

export function fusionPosition(image: CanvasImage) {
  return image.fusion?.position ?? { x: image.x + image.width + FUSION_GAP, y: image.y - 7 };
}

// Include workflow nodes in navigation without treating them as uploaded images.
export function canvasNodes(images: CanvasImage[]): CanvasImage[] {
  return images.flatMap(image => image.fusion ? [...(image.nodeOnly ? [] : [image]), { ...image, id: `${image.id}:fusion`, fusion: undefined, ...fusionPosition(image), width: FUSION_WIDTH, height: FUSION_HEIGHT }] : image.nodeOnly ? [] : [image]);
}

// Keep an empty workflow record when its source image is removed.
export function deleteCanvasSelection(items: CanvasImage[], selected: string[]): CanvasImage[] {
  const ids = new Set(selected);
  return items.flatMap(item => {
    const deleteImage = ids.has(item.id), deleteNode = ids.has(`${item.id}:fusion`);
    if (deleteNode && (item.nodeOnly || deleteImage)) return [];
    if (deleteImage) {
      if (!item.fusion) return [];
      return [{...item, nodeOnly: true, name: '', url: '', role: undefined, sourceImageId: undefined,
        operation: undefined, fusion: {...defaultFusion(), position: fusionPosition(item)}}];
    }
    return [deleteNode ? {...item, fusion: undefined} : item];
  });
}
