import { Children, cloneElement, isValidElement, memo, useCallback, useMemo, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Handle, Position, ReactFlow, SelectionMode, type Edge, type EdgeProps, type Node, type NodeChange, type NodeProps } from '@xyflow/react';
import { boundsOf, type CanvasImage, type Viewport } from '../canvas';
import { magneticDragDelta, type DragSnapContext, type SnapGuides } from '../canvas-snapping';
import { ImageConnection } from './ImageConnection';
import { flowNodeGeometry } from '../react-flow-geometry';
import './react-flow-canvas.css';

type ContentProps = { children?: ReactNode; style?: CSSProperties; className?: string; 'data-canvas-id'?: string; 'data-fusion-id'?: string; image?: CanvasImage; target?: CanvasImage; active?: boolean; zoom?: number };
type ContentNode = Node<{ content: ReactElement<ContentProps> }, 'lightchain'>;
type ConnectionEdge = Edge<{ image: CanvasImage; target: CanvasImage; active: boolean; zoom: number }, 'lightchain'>;
const handles = [Position.Left, Position.Right];
const LightchainNode = memo(({ data }: NodeProps<ContentNode>) => <>
  {handles.flatMap(side => ['source', 'target'].map(type => <Handle key={`${type}-${side}`} id={`${type}-${side}`} type={type as 'source' | 'target'} position={side} isConnectable={false} className="lc-flow-handle" />))}
  {data.content}
</>);
const LightchainEdge = memo(({ data }: EdgeProps<ConnectionEdge>) => {
  if (!data) return null;
  const { image, target, active, zoom } = data;
  const right = target.x + target.width / 2 >= image.x + image.width / 2;
  const direction = right ? 1 : -1, gap = (active ? 4 : 2) / zoom;
  const sx = image.x + (right ? image.width : 0) + gap * direction, sy = image.y + image.height / 2;
  const tx = target.x + (right ? 0 : target.width) - gap * direction, ty = target.y + target.height / 2;
  const handle = Math.max(48, Math.abs(tx - sx) * .45);
  const d = `M ${sx} ${sy} C ${sx + handle * direction} ${sy}, ${tx - handle * direction} ${ty}, ${tx} ${ty}`;
  // React Flow scales an HTML viewport around the SVG. Compensate explicitly
  // for that scale instead of relying on SVG-only non-scaling-stroke behavior.
  return <g className="lc-flow-connection" data-active={active} style={{ '--canvas-inverse-scale': 1 / zoom } as CSSProperties}>
    {active && <path d={d} className="lc-flow-edge-underlay" />}
    <path d={d} className="lc-flow-edge-line" />
  </g>;
});
const nodeTypes = { lightchain: LightchainNode };
const edgeTypes = { lightchain: LightchainEdge };
const controlSelector = 'button,input,textarea,select,[contenteditable="true"],[data-select-popup]';

type Props = {
  children: ReactNode; view: Viewport; selectedIds: string[]; hand: boolean; referenceMode: boolean; snap: boolean;
  onView: (view: Viewport) => void; onSelection: (ids: string[]) => void;
  onPositions: (positions: Map<string, { x: number; y: number }>) => void;
  onSelecting: (active: boolean) => void; onDragStart: () => void; onDragEnd: () => void; onGuides: (guides: SnapGuides | null) => void;
};

// Adapts the existing product components/data to real React Flow nodes and edges.
// Business operations and their history continue to use the shared canvas model.
export function ReactFlowCanvas(props: Props) {
  const latest = useRef(props); latest.current = props;
  const selectionRef = useRef(props.selectedIds); selectionRef.current = props.selectedIds;
  const shiftClick = useRef(false);
  const setSelection = useCallback((ids: string[]) => {
    // React Flow can emit several changes before the controlled props render.
    selectionRef.current = ids;
    latest.current.onSelection(ids);
  }, []);
  const drag = useRef<{ anchor: string; start: Map<string, {x: number; y: number}>; snap: DragSnapContext } | null>(null);
  const bypass = useRef(false);
  const graph = useMemo(() => {
    const nodes: ContentNode[] = [], edges: ConnectionEdge[] = [];
    const visit = (children: ReactNode) => Children.forEach(children, child => {
      if (!isValidElement<ContentProps>(child)) return;
      const p = child.props;
      if (child.type === ImageConnection && p.image && p.target) {
        const right = p.target.x + p.target.width / 2 >= p.image.x + p.image.width / 2;
        edges.push({ id: `${p.image.id}->${p.target.id}`, source: p.image.id, target: p.target.id, type: 'lightchain',
          sourceHandle: `source-${right ? 'right' : 'left'}`, targetHandle: `target-${right ? 'left' : 'right'}`,
          selectable: false, focusable: false, zIndex: p.active ? 4 : -1,
          data: { image: p.image, target: p.target, active: !!p.active, zoom: props.view.zoom } });
      } else if (p['data-canvas-id'] || p['data-fusion-id']) {
        const id = p['data-canvas-id'] ?? `${p['data-fusion-id']}:fusion`;
        const style = p.style ?? {};
        nodes.push({ id, type: 'lightchain', position: { x: Number(style.left), y: Number(style.top) },
          ...flowNodeGeometry(Number(style.width) || 280, Number(style.height) || 400),
          selected: props.selectedIds.includes(id), zIndex: Number(style.zIndex) || 1,
          data: { content: cloneElement(child, { style: { ...style, left: 0, top: 0, position: 'relative', zIndex: undefined } }) } });
      } else visit(p.children);
    });
    visit(props.children);
    return { nodes, edges };
  }, [props.children, props.selectedIds, props.view.zoom]);
  const graphRef = useRef(graph); graphRef.current = graph;
  const onChanges = useCallback((changes: NodeChange<ContentNode>[]) => {
    const p = latest.current;
    if (!p.referenceMode) {
      const selection = changes.filter(change => change.type === 'select');
      if (selection.length) {
        const ids = new Set(selectionRef.current);
        for (const change of selection) change.selected ? ids.add(change.id) : ids.delete(change.id);
        setSelection([...ids]);
      }
    }
    const positions = new Map<string, {x: number; y: number}>();
    for (const change of changes) if (change.type === 'position' && change.position) positions.set(change.id, change.position);
    const g = drag.current, anchor = g && positions.get(g.anchor), start = g && g.start.get(g.anchor);
    if (g && anchor && start) {
      const delta = magneticDragDelta(g.snap, (anchor.x - start.x) * p.view.zoom, (anchor.y - start.y) * p.view.zoom, p.view.zoom, p.snap && !bypass.current);
      p.onGuides(delta.guides);
      for (const [id, initial] of g.start) positions.set(id, { x: initial.x + delta.x, y: initial.y + delta.y });
    }
    if (positions.size) p.onPositions(positions);
  }, [setSelection]);
  const beginDrag = useCallback((event: MouseEvent | TouchEvent | React.MouseEvent, node: ContentNode, selected?: ContentNode[]) => {
    bypass.current = event.altKey;
    const all = graphRef.current.nodes.map(n => ({ id: n.id, ...n.position, width: n.width ?? 280, height: n.height ?? 400 })) as CanvasImage[];
    const moving = new Set((selected?.length ? selected : [node]).map(n => n.id)); moving.add(node.id);
    const anchor = all.find(n => n.id === node.id)!;
    const bounds = boundsOf(all.filter(n => moving.has(n.id)))!;
    drag.current = { anchor: node.id, start: new Map(all.filter(n => moving.has(n.id)).map(n => [n.id, { x: n.x, y: n.y }])), snap: { anchor, bounds, targets: all.filter(n => !moving.has(n.id)), locks: {} } };
    latest.current.onDragStart();
  }, []);
  const endDrag = useCallback(() => { drag.current = null; latest.current.onGuides(null); latest.current.onDragEnd(); }, []);
  const onViewport = useCallback((v: Viewport) => {
    const current = latest.current.view;
    // Controlled viewport updates also emit this event. Only user/store changes
    // feed back into App, so its preset-zoom animation is not cancelled by echo.
    if (v.x !== current.x || v.y !== current.y || v.zoom !== current.zoom) latest.current.onView(v);
  }, []);
  return <div className="lc-react-flow" data-hand={props.hand} style={{ '--canvas-inverse-scale': 1 / props.view.zoom } as CSSProperties}
    onPointerMoveCapture={e => { bypass.current = e.altKey; }}
    onPointerDownCapture={e => {
      if (e.target instanceof Element) {
        const control = e.target.closest(controlSelector);
        control?.classList.add('nodrag');
        if (!control) e.currentTarget.closest<HTMLElement>('main')?.focus({ preventScroll: true });
        const field = e.target.closest('textarea,[data-canvas-scroll]');
        field?.classList.add('nodrag');
      }
    }}
    onMouseDownCapture={e => {
      shiftClick.current = false;
      if (!e.shiftKey || e.button !== 0 || props.hand || props.referenceMode || !(e.target instanceof Element)) return;
      if (e.target.closest(controlSelector)) return;
      const id = e.target.closest('.react-flow__node')?.getAttribute('data-id');
      if (!id) return;
      // Handle additive clicks before XYDrag's native mousedown listener.
      // A deselected node would otherwise still become the drag anchor. Reading
      // the mouse modifier also works if Shift was held before canvas focus.
      e.preventDefault();
      e.stopPropagation();
      shiftClick.current = true;
      const ids = selectionRef.current;
      setSelection(ids.includes(id) ? ids.filter(selected => selected !== id) : [...ids, id]);
    }}
    onClickCapture={e => {
      if (!shiftClick.current) return;
      shiftClick.current = false;
      e.stopPropagation();
    }}
    onWheelCapture={e => {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.target instanceof Element) {
        const field = e.target.closest('textarea,[data-canvas-scroll]');
        if (field && field.scrollHeight > field.clientHeight) e.stopPropagation();
      }
    }}>
    <ReactFlow<ContentNode, ConnectionEdge> nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
      defaultViewport={props.view} viewport={props.view} onViewportChange={onViewport} onNodesChange={onChanges}
      onSelectionStart={() => latest.current.onSelecting(true)} onSelectionEnd={() => latest.current.onSelecting(false)}
      onNodeDragStart={beginDrag} onNodeDragStop={endDrag}
      onSelectionDragStart={(e, nodes) => { if (nodes[0]) beginDrag(e, nodes[0], nodes); }} onSelectionDragStop={endDrag}
      nodeDragThreshold={0}
      nodesDraggable={!props.hand && !props.referenceMode} elementsSelectable={!props.hand && !props.referenceMode}
      // Blank-space dragging already enables marquee selection. Binding Shift
      // to it too makes Pane capture node clicks before additive selection.
      selectionOnDrag={!props.hand && !props.referenceMode} selectionMode={SelectionMode.Partial} selectionKeyCode={null} multiSelectionKeyCode="Shift"
      panOnDrag={props.hand || props.referenceMode ? true : [1]} panActivationKeyCode="Space"
      panOnScroll panOnScrollSpeed={1} zoomOnScroll={false} zoomOnPinch zoomActivationKeyCode={['Alt','Meta','Control']}
      proOptions={{ hideAttribution: true }}
      minZoom={0.03} maxZoom={2} zoomOnDoubleClick={false} deleteKeyCode={null}
      nodesConnectable={false} edgesReconnectable={false} elevateNodesOnSelect={false} elevateEdgesOnSelect={false}
      autoPanOnNodeDrag={false} autoPanOnSelection={false} disableKeyboardA11y
      onPaneClick={() => { if (!latest.current.referenceMode && !latest.current.hand) setSelection([]); }} />
  </div>;
}
