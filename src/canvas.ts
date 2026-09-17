import { compactBox, type HierarchyData } from '@antv/hierarchy';
import { rememberImagePreview } from './image-previews';
export type Viewport = { x: number; y: number; zoom: number };
export type FusionReference = { id: string; name: string; url: string };
export const MAX_FUSION_REFERENCES = 4;
export type WorkflowKind = 'fusion' | 'lingerie' | 'directed' | 'flat';
export type FlatRegion = 'top' | 'bottom' | 'full';
export type FlatFace = 'front' | 'back';
export type DirectedFusionPoint = { id: string; reference: FusionReference };
export const MAX_DIRECTED_POINTS = 3;
export type FusionSettings = { kind?: WorkflowKind; position?: { x: number; y: number }; prompt: string; ratio: string; resolution: string; reference?: FusionReference; references?: FusionReference[]; directedPoints?: DirectedFusionPoint[]; flatRegion?: FlatRegion; flatFace?: FlatFace };
export const fusionReferences = (settings?: FusionSettings): FusionReference[] => settings?.references ?? (settings?.reference ? [settings.reference] : []);
export const workflowReferenceLimit = (settings?: FusionSettings) => settings?.kind === 'lingerie' ? 1 : MAX_FUSION_REFERENCES;
export const defaultFusion = (kind: WorkflowKind = 'fusion'): FusionSettings => ({ kind, prompt: '', ratio: 'auto', resolution: '2K', ...(kind === 'directed' ? { directedPoints: [] } : {}), ...(kind === 'flat' ? { flatRegion: 'top', flatFace: 'front' } : {}) });
export const FUSION_GAP = 80;
export const GROUP_GAP = 120;
export const FUSION_WIDTH = 280;
export const FUSION_HEIGHT = 579;
// Figma: 269px with no points, plus 129px card + 12px gap per point.
// The 56px add entry and its 12px gap disappear at the three-point limit.
export function workflowHeight(settings?: FusionSettings) {
  if (settings?.kind === 'flat') return 417;
  if (settings?.kind !== 'directed') return FUSION_HEIGHT;
  const count = Math.min(MAX_DIRECTED_POINTS, settings.directedPoints?.length ?? 0);
  return 269 + count * 141 - (count === MAX_DIRECTED_POINTS ? 68 : 0);
}
export type CanvasImage = { id: string; name: string; url: string; x: number; y: number; width: number; height: number; role?: 'main'; nodeOnly?: boolean; editorSourceId?: string; generatedByEditorId?: string; sourceImageId?: string; fusion?: FusionSettings; operation?: 'cutout' | 'fusion' | 'directed' | 'lingerie' | 'flat' };
export const CANVAS_GRID_SIZE = 32;

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
    rememberImagePreview(url, image);
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
  // Layout the visible graph: an image and its editor are separate vertices.
  type Vertex = { id: string; width: number; height: number; editor: boolean; children: string[] };
  type Placement = { id: string; x: number; y: number };
  type Block = { width: number; height: number; nodes: Placement[] };
  const vertices = new Map<string, Vertex>();
  for (const item of items) {
    if (!item.nodeOnly) vertices.set(item.id, {id:item.id, width:item.width, height:item.height, editor:false, children:[]});
    if (item.fusion) vertices.set(`${item.id}:fusion`, {id:`${item.id}:fusion`, width:FUSION_WIDTH, height:workflowHeight(item.fusion), editor:true, children:[]});
  }
  const parents = new Map<string, string>();
  const connect = (parent: string | undefined, child: string) => {
    if (!parent || !vertices.has(parent) || !vertices.has(child) || parent === child) return;
    parents.set(child, parent);
  };
  for (const item of items) {
    if (!item.nodeOnly) connect(item.sourceImageId ?? (item.generatedByEditorId ? `${item.generatedByEditorId}:fusion` : undefined), item.id);
    if (item.fusion) connect(item.editorSourceId ?? (!item.nodeOnly ? item.id : undefined), `${item.id}:fusion`);
  }
  // Normalize only the layout graph. Missing sources become roots; malformed
  // cycles lose one deterministic layout edge without changing saved relations.
  const resolved = new Set<string>();
  for (const id of vertices.keys()) {
    const path = new Set<string>();
    let current: string | undefined = id;
    while (current !== undefined && !resolved.has(current)) {
      if (path.has(current)) { parents.delete(current); break; }
      path.add(current);
      current = parents.get(current);
    }
    for (const member of path) resolved.add(member);
  }
  // Map insertion order is the stable sibling order, independent of dragged positions.
  for (const [child, parent] of parents) vertices.get(parent)!.children.push(child);
  const moved = (block: Block, x: number, y: number) => block.nodes.map(node => ({...node, x:node.x+x, y:node.y+y}));
  const related: Block[] = [], independent: Block[] = [];
  for (const root of vertices.values()) {
    if (parents.has(root.id)) continue;
    const queue = [{ id: root.id, depth: 0 }];
    const widths: number[] = [];
    const tree = new Map<string, HierarchyData>();
    for (let index = 0; index < queue.length; index++) {
      const { id, depth } = queue[index];
      const vertex = vertices.get(id)!;
      widths[depth] = Math.max(widths[depth] ?? 0, vertex.width);
      tree.set(id, { id, height: vertex.height, children: [] });
      for (const child of vertex.children) queue.push({ id: child, depth: depth + 1 });
    }
    for (const { id, depth } of queue) {
      const data = tree.get(id)!;
      // Reserve the widest node at each depth BEFORE contour compaction.
      // Shifting columns afterwards would invalidate the computed separation.
      data.width = widths[depth];
      data.children = vertices.get(id)!.children.map(child => tree.get(child)!);
    }
    const layout = compactBox(tree.get(root.id)!, {
      direction: 'LR', fixedRoot: false,
      getId: data => data.id!,
      getWidth: data => data.width!,
      getHeight: data => data.height!,
      // AntV pads BOTH sides: 40+40 = 80 horizontally, 60+60 = 120 vertically.
      getHGap: () => FUSION_GAP / 2,
      getVGap: () => GROUP_GAP / 2,
    });
    const nodes: Placement[] = [];
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    layout.eachNode(node => {
      const x = node.x + node.hgap, y = node.y + node.vgap;
      const vertex = vertices.get(node.id)!;
      nodes.push({ id: node.id, x, y });
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + vertex.width); bottom = Math.max(bottom, y + vertex.height);
    });
    // Outer packing uses actual rendered bounds, without phantom padding.
    const block: Block = { width: right - left, height: bottom - top,
      nodes: nodes.map(node => ({ ...node, x: node.x - left, y: node.y - top })) };
    (nodes.length > 1 || root.editor ? related : independent).push(block);
  }
  function pack(blocks: Block[], columns: number): Block {
    const nodes: Placement[] = [];
    let width = 0, y = 0;
    for (let row=0;row<blocks.length;row+=columns) {
      let x=0, rowHeight=0;
      for (const block of blocks.slice(row,row+columns)) {
        nodes.push(...moved(block,x,y)); x += block.width+GROUP_GAP; rowHeight=Math.max(rowHeight,block.height);
      }
      width=Math.max(width,x-GROUP_GAP); y+=rowHeight+GROUP_GAP;
    }
    return {nodes, width, height:Math.max(0,y-GROUP_GAP)};
  }
  const relatedLayouts = Array.from({length:Math.max(1,related.length)},(_,i)=>pack(related,i+1));
  const independentLayouts = Array.from({length:Math.max(1,independent.length)},(_,i)=>pack(independent,i+1));
  let best: Placement[] = [], bestScore = -Infinity;
  for (const left of relatedLayouts) for (const right of independentLayouts) {
    const offset = left.nodes.length && right.nodes.length ? left.width+GROUP_GAP*2 : 0;
    const width = Math.max(left.width,offset+right.width), height = Math.max(left.height,right.height);
    const score = Math.min(area.width/Math.max(1,width),area.height/Math.max(1,height));
    if (score>bestScore+1e-9) { bestScore=score; best=[...left.nodes,...moved(right,offset,0)]; }
  }
  const positions = new Map(best.map(node=>[node.id,{x:node.x+startX,y:node.y}]));
  return items.map(item=>{
    const image = positions.get(item.id), editor = positions.get(`${item.id}:fusion`);
    return {...item, ...(image ?? (item.nodeOnly ? editor : undefined)),
      fusion:item.fusion && editor ? {...item.fusion,position:editor} : item.fusion};
  });
}

export function fusionPosition(image: CanvasImage) {
  return image.fusion?.position ?? { x: image.x + image.width + FUSION_GAP, y: image.y - 7 };
}

// Include workflow nodes in navigation without treating them as uploaded images.
export function canvasNodes(images: CanvasImage[]): CanvasImage[] {
  return images.flatMap(image => image.fusion ? [...(image.nodeOnly ? [] : [image]), { ...image, id: `${image.id}:fusion`, fusion: undefined, ...fusionPosition(image), width: FUSION_WIDTH, height: workflowHeight(image.fusion) }] : image.nodeOnly ? [] : [image]);
}

// Keep an empty workflow record when its source image is removed.
export function deleteCanvasSelection(items: CanvasImage[], selected: string[]): CanvasImage[] {
  const ids = new Set(selected);
  return items.flatMap(item => {
    const deleteImage = ids.has(item.id), deleteNode = ids.has(`${item.id}:fusion`);
    if (deleteNode && (item.nodeOnly || deleteImage)) return [];
    if (item.editorSourceId && ids.has(item.editorSourceId) && item.fusion) {
      return [{...item, editorSourceId: undefined, name: '', url: '', fusion: {...defaultFusion(item.fusion.kind), position: fusionPosition(item)}}];
    }
    if (deleteImage) {
      if (!item.fusion) return [];
      return [{...item, nodeOnly: true, name: '', url: '', role: undefined, sourceImageId: undefined,
        operation: undefined, fusion: {...defaultFusion(item.fusion.kind), position: fusionPosition(item)}}];
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
      // A cutout's direct image source takes precedence over legacy inherited metadata.
      const cutoutSourceId = visible.has(n.id) ? n.sourceImageId : undefined;
      const sourceId = cutoutSourceId ?? n.generatedByEditorId ?? n.editorSourceId;
      if (!sourceId || (!cutoutSourceId && n.generatedByEditorId ? !items.some(item => item.id === sourceId && item.fusion) : !visible.has(sourceId))) continue;
      if (ids.has(n.id) === ids.has(sourceId)) continue;
      ids.add(n.id); ids.add(sourceId); changed = true;
    }
  }
  return ids;
}

// Separate editor records share one source image without copying its canvas media.
export function createFusionEditor(items: CanvasImage[], sourceId: string, id: string, kind: WorkflowKind = 'fusion'): CanvasImage | null {
  const source = items.find(n => n.id === sourceId && !n.nodeOnly);
  if (!source) return null;
  const x = source.x + source.width + FUSION_GAP;
  const height = workflowHeight(defaultFusion(kind));
  let y = source.y;
  const occupied = canvasNodes(items);
  while (occupied.some(n => x < n.x + n.width + 16 && x + FUSION_WIDTH + 16 > n.x && y < n.y + n.height + 16 && y + height + 16 > n.y)) y += height + FUSION_GAP;
  return {id, name: source.name, url: '', x, y, width: FUSION_WIDTH, height,
    nodeOnly: true, editorSourceId: source.id, fusion: {...defaultFusion(kind), position: {x,y}}};
}
