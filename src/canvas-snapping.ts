import { CANVAS_GRID_SIZE, type Bounds } from './canvas';

type Axis = 'x' | 'y';
type Snap = { target: number; offset: number; kind: 'element' | 'grid'; node?: Bounds };
export type SnapGuides = { x?: number; y?: number };
export type DragSnapContext = {
  bounds: Bounds;
  anchor: Bounds;
  targets: Bounds[];
  locks: Partial<Record<Axis, Snap>>;
};

// Screen-pixel thresholds keep the magnetic feel consistent across zoom levels.
const ALIGN_ENTER = 8;
const ALIGN_RELEASE = 12;
const ALIGN_REACH = 240;

function nearby(a: Bounds, b: Bounds, axis: Axis, zoom: number) {
  const cross = axis === 'x' ? 'y' : 'x';
  const size = axis === 'x' ? 'height' : 'width';
  const gap = Math.max(0, a[cross] - b[cross] - b[size], b[cross] - a[cross] - a[size]);
  return gap * zoom <= ALIGN_REACH;
}

function snapAxis(context: DragSnapContext, proposed: Bounds, axis: Axis, zoom: number): Snap | undefined {
  const size = axis === 'x' ? 'width' : 'height';
  const previous = context.locks[axis];
  const distance = (snap: Snap) => Math.abs(proposed[axis] + snap.offset - snap.target) * zoom;
  // Hold an established alignment slightly longer than acquisition to avoid flicker.
  if (previous?.kind === 'element' && previous.node && nearby(proposed, previous.node, axis, zoom)
    && distance(previous) <= ALIGN_RELEASE) return previous;

  let best: Snap | undefined;
  let closest = ALIGN_ENTER;
  for (const node of context.targets) {
    if (!nearby(proposed, node, axis, zoom)) continue;
    for (const offset of [0, context.bounds[size] / 2, context.bounds[size]]) {
      for (const target of [node[axis], node[axis] + node[size] / 2, node[axis] + node[size]]) {
        const candidate: Snap = { target, offset, kind: 'element', node };
        const gap = distance(candidate);
        if (gap <= closest && (!best || gap < closest)) { best = candidate; closest = gap; }
      }
    }
  }
  if (best) return best;

  // Dense grid points at small zooms must not turn the entire canvas into a magnet.
  if (CANVAS_GRID_SIZE * zoom < 8) return undefined;
  const enter = Math.min(6, CANVAS_GRID_SIZE * zoom * .2);
  const release = Math.min(9, CANVAS_GRID_SIZE * zoom * .3);
  if (previous?.kind === 'grid' && distance(previous) <= release) return previous;
  const offset = context.anchor[axis] - context.bounds[axis];
  const target = Math.round((proposed[axis] + offset) / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
  const grid: Snap = { target, offset, kind: 'grid' };
  return distance(grid) <= enter ? grid : undefined;
}

export function magneticDragDelta(context: DragSnapContext, dx: number, dy: number, zoom: number, enabled: boolean) {
  const raw = { x: dx / zoom, y: dy / zoom };
  if (!enabled) { context.locks = {}; return { ...raw, guides: null }; }
  const proposed = { ...context.bounds, x: context.bounds.x + raw.x, y: context.bounds.y + raw.y };
  const x = snapAxis(context, proposed, 'x', zoom);
  const y = snapAxis(context, proposed, 'y', zoom);
  context.locks = { x, y };
  return {
    x: x ? x.target - x.offset - context.bounds.x : raw.x,
    y: y ? y.target - y.offset - context.bounds.y : raw.y,
    guides: x || y ? { x: x?.target, y: y?.target } : null,
  };
}
