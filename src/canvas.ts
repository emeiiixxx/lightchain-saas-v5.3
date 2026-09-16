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
export type CanvasImage = { id: string; name: string; url: string; x: number; y: number; width: number; height: number; role?: 'main'; nodeOnly?: boolean; editorSourceId?: string; generatedByEditorId?: string; sourceImageId?: string; fusion?: FusionSettings; operation?: 'cutout' | 'fusion' | 'directed' | 'flat' };
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
  // Layout the visible graph: an image and its editor are separate vertices.
  type Vertex = { id: string; width: number; height: number; editor: boolean; children: string[] };
  type Placement = { id: string; x: number; y: number };
  type Block = { width: number; height: number; nodes: Placement[] };
  const vertices = new Map<string, Vertex>();
  for (const item of items) {
    if (!item.nodeOnly) vertices.set(item.id, {id:item.id, width:item.width, height:item.height, editor:false, children:[]});
    if (item.fusion) vertices.set(`${item.id}:fusion`, {id:`${item.id}:fusion`, width:FUSION_WIDTH, height:FUSION_HEIGHT, editor:true, children:[]});
  }
  const parents = new Map<string, string>();
  const connect = (parent: string | undefined, child: string) => {
    if (!parent || !vertices.has(parent) || !vertices.has(child) || parent === child) return;
    vertices.get(parent)!.children.push(child); parents.set(child, parent);
  };
  for (const item of items) {
    if (!item.nodeOnly) connect(item.sourceImageId ?? (item.generatedByEditorId ? `${item.generatedByEditorId}:fusion` : undefined), item.id);
    if (item.fusion) connect(item.editorSourceId ?? (!item.nodeOnly ? item.id : undefined), `${item.id}:fusion`);
  }
  const moved = (block: Block, x: number, y: number) => block.nodes.map(node => ({...node, x:node.x+x, y:node.y+y}));
  const emitted = new Set<string>();
  function branch(id: string): Block {
    const vertex = vertices.get(id)!;
    emitted.add(id);
    const rows: Block[] = [];
    for (const childId of vertex.children) {
      if (emitted.has(childId)) continue;
      // Images, editors and continuing workflows all participate individually;
      // no pre-grouping into fixed two-column result rows.
      rows.push(branch(childId));
    }
    // Siblings share a semantic column. Only a real downstream edge advances
    // the workflow; fitting the viewport must never turn siblings into stages.
    const children = pack(rows,1);
    const height = Math.max(vertex.height,children.height);
    const nodes: Placement[] = [{id, x:0, y:(height-vertex.height)/2},
      ...moved(children,vertex.width+FUSION_GAP,(height-children.height)/2)];
    return {nodes, height, width:vertex.width+(rows.length ? FUSION_GAP+children.width : 0)};

  }
  const related: Block[] = [], independent: Block[] = [];
  const roots = [...vertices.keys()].filter(id=>!parents.has(id));
  // The second pass also keeps malformed cyclic legacy records visible.
  for (const id of [...roots,...vertices.keys()]) {
    if (emitted.has(id)) continue;
    const block = branch(id);
    const members = new Set(block.nodes.map(node=>node.id));
    const depths = new Map<string,number>([[id,0]]);
    const queue = [id];
    for (let index=0;index<queue.length;index++) {
      const parent = queue[index];
      for (const child of vertices.get(parent)!.children) {
        if (!members.has(child) || depths.has(child)) continue;
        depths.set(child,depths.get(parent)!+1); queue.push(child);
      }
    }
    const widths: number[] = [];
    for (const node of block.nodes) {
      const depth = depths.get(node.id) ?? 0;
      widths[depth] = Math.max(widths[depth] ?? 0, vertices.get(node.id)!.width);
    }
    const columns: number[] = [];
    let offset = 0;
    for (let depth=0;depth<widths.length;depth++) {
      columns[depth] = offset; offset += widths[depth]+FUSION_GAP;
    }
    // Different image aspect ratios still share the same next-stage column.
    block.nodes = block.nodes.map(node=>({...node,x:columns[depths.get(node.id) ?? 0]}));
    block.width = Math.max(0,offset-FUSION_GAP);
    (block.nodes.length>1 || vertices.get(id)!.editor ? related : independent).push(block);
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
