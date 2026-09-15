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
export type CanvasImage = { id: string; name: string; url: string; x: number; y: number; width: number; height: number; role?: 'main'; nodeOnly?: boolean; editorSourceId?: string; sourceImageId?: string; fusion?: FusionSettings; operation?: 'cutout' | 'fusion' | 'directed' | 'flat' };
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
  // Connected source/result records form one layout block; the attached editor
  // belongs to its image. Missing/deleted sources never create phantom groups.
  const byId = new Map(items.map(n => [n.id, n]));
  const neighbors = new Map(items.map(n => [n.id, new Set<string>()]));
  for (const n of items) {
    const sourceId = n.editorSourceId ?? (!n.nodeOnly ? n.sourceImageId : undefined);
    if (sourceId && byId.has(sourceId) && !byId.get(sourceId)!.nodeOnly) {
      neighbors.get(n.id)!.add(sourceId);
      neighbors.get(sourceId)!.add(n.id);
    }
  }
  const visited = new Set<string>();
  const related: CanvasImage[][] = [], independent: CanvasImage[][] = [];
  for (const n of items) {
    if (visited.has(n.id)) continue;
    const ids = new Set<string>(), queue = [n.id];
    while (queue.length) {
      const id = queue.pop()!;
      if (ids.has(id)) continue;
      ids.add(id); visited.add(id);
      queue.push(...neighbors.get(id)!);
    }
    const members = items.filter(item => ids.has(item.id));
    // Source first, then its descendants. The fallback also handles malformed cycles.
    const ordered: CanvasImage[] = [], emitted = new Set<string>();
    const emit = (item: CanvasImage) => {
      if (emitted.has(item.id)) return;
      emitted.add(item.id); ordered.push(item);
      for (const child of members) if ((child.editorSourceId ?? child.sourceImageId) === item.id) emit(child);
    };
    members.filter(item => !(item.editorSourceId ?? item.sourceImageId) || !ids.has((item.editorSourceId ?? item.sourceImageId)!)).forEach(emit);
    members.forEach(emit);
    (members.length > 1 || members.some(item => item.fusion) ? related : independent).push(ordered);
  }
  function layout(groups: CanvasImage[][], columns: number) {
    const result: CanvasImage[] = [];
    let y = 0;
    for (let row = 0; row < groups.length; row += columns) {
      let x = 0, rowHeight = 0;
      for (const group of groups.slice(row, row + columns)) {
        for (const n of group) {
          result.push({ ...n, x, y, fusion: n.fusion ? { ...n.fusion, position: { x: n.nodeOnly ? x : x + n.width + FUSION_GAP, y } } : undefined });
          x += (n.nodeOnly ? FUSION_WIDTH : n.width + (n.fusion ? FUSION_GAP + FUSION_WIDTH : 0)) + FUSION_GAP;
          rowHeight = Math.max(rowHeight, n.nodeOnly ? 0 : n.height, n.fusion ? FUSION_HEIGHT : 0);
        }
        x += GROUP_GAP - FUSION_GAP;
      }
      y += rowHeight + GROUP_GAP;
    }
    return result;
  }
  const shift = (nodes: CanvasImage[], dx: number) => nodes.map(n => ({...n, x: n.x + dx,
    fusion: n.fusion ? {...n.fusion, position: {...fusionPosition(n), x: fusionPosition(n).x + dx}} : undefined}));
  let best: CanvasImage[] = [], bestScore = -Infinity;
  const relatedLayouts = Array.from({length: Math.max(1, related.length)}, (_, i) => layout(related, i + 1));
  const independentLayouts = Array.from({length: Math.max(1, independent.length)}, (_, i) => layout(independent, i + 1));
  for (const left of relatedLayouts) for (const right of independentLayouts) {
    const leftBounds = boundsOf(canvasNodes(left));
    const candidate = [...left, ...shift(right, leftBounds ? leftBounds.width + GROUP_GAP * 2 : 0)];
    const bounds = boundsOf(canvasNodes(candidate));
    if (!bounds) continue;
    const score = Math.min(area.width / bounds.width, area.height / bounds.height);
    if (score > bestScore + 1e-9) { best = candidate; bestScore = score; }
  }
  const positioned = new Map(shift(best, startX).map(n => [n.id, n]));
  return items.map(n => positioned.get(n.id) ?? n);
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
    if (item.editorSourceId && ids.has(item.editorSourceId) && item.fusion) {
      return [{...item, editorSourceId: undefined, name: '', url: '', fusion: {...defaultFusion(), position: fusionPosition(item)}}];
    }
    if (deleteImage) {
      if (!item.fusion) return [];
      return [{...item, nodeOnly: true, name: '', url: '', role: undefined, sourceImageId: undefined,
        operation: undefined, fusion: {...defaultFusion(), position: fusionPosition(item)}}];
    }
    return [deleteNode ? {...item, fusion: undefined} : item];
  });
}

// Selection raises the connected workflow visually without reordering saved data.
export function relatedCanvasIds(items: CanvasImage[], selected: string[]): Set<string> {
  const ids = new Set(items.filter(n => selected.includes(n.id) || selected.includes(`${n.id}:fusion`)).map(n => n.id));
  const visible = new Set(items.filter(n => !n.nodeOnly).map(n => n.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of items) {
      const sourceId = n.editorSourceId ?? (visible.has(n.id) ? n.sourceImageId : undefined);
      if (!sourceId || !visible.has(sourceId)) continue;
      if (ids.has(n.id) === ids.has(sourceId)) continue;
      ids.add(n.id); ids.add(sourceId); changed = true;
    }
  }
  return ids;
}

// Separate editor records share one source image without copying its canvas media.
export function createFusionEditor(items: CanvasImage[], sourceId: string, id: string): CanvasImage | null {
  const source = items.find(n => n.id === sourceId && !n.nodeOnly);
  if (!source) return null;
  const x = source.x + source.width + FUSION_GAP;
  let y = source.y;
  const occupied = canvasNodes(items);
  while (occupied.some(n => x < n.x + n.width + 16 && x + FUSION_WIDTH + 16 > n.x && y < n.y + n.height + 16 && y + FUSION_HEIGHT + 16 > n.y)) y += FUSION_HEIGHT + FUSION_GAP;
  return {id, name: source.name, url: '', x, y, width: FUSION_WIDTH, height: FUSION_HEIGHT,
    nodeOnly: true, editorSourceId: source.id, fusion: {...defaultFusion(), position: {x,y}}};
}
