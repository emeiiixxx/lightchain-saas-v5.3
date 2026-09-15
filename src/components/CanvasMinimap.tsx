import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { boundsOf, type CanvasImage, type Viewport } from '../canvas';

type Projection = { left: number; top: number; scale: number; offsetX: number; offsetY: number };
type Props = { images: CanvasImage[]; view: Viewport; canvasSize: { width: number; height: number }; label: string; viewportLabel: string; onNavigate: (x: number, y: number) => void; onInteraction: (active: boolean) => void };
export function CanvasMinimap({ images, view, canvasSize, label, viewportLabel, onNavigate, onInteraction }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 198, height: 198 * 9 / 16 });
  const [locked, setLocked] = useState<Projection | null>(null);
  const gesture = useRef<{ pointer: number; x: number; y: number; centerX: number; centerY: number; scale: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => { if (gesture.current) onInteraction(false); }, [onInteraction]);
  const content = boundsOf(images);
  const viewport = { x: -view.x / view.zoom, y: -view.y / view.zoom, width: canvasSize.width / view.zoom, height: canvasSize.height / view.zoom };
  // One scale preserves every image's aspect ratio, spacing and overlap. Include
  // the visible canvas so a lone portrait never expands to fill the overview.
  const left = Math.min(content?.x ?? viewport.x, viewport.x);
  const top = Math.min(content?.y ?? viewport.y, viewport.y);
  const right = Math.max(content ? content.x + content.width : viewport.x, viewport.x + viewport.width);
  const bottom = Math.max(content ? content.y + content.height : viewport.y, viewport.y + viewport.height);
  const scale = Math.min((size.width - 20) / Math.max(1, right - left), (size.height - 20) / Math.max(1, bottom - top));
  const projection = locked ?? { left, top, scale, offsetX: (size.width - (right - left) * scale) / 2, offsetY: (size.height - (bottom - top) * scale) / 2 };
  const project = (rect: { x: number; y: number; width: number; height: number }) => ({ left: projection.offsetX + (rect.x - projection.left) * projection.scale, top: projection.offsetY + (rect.y - projection.top) * projection.scale, width: rect.width * projection.scale, height: rect.height * projection.scale });
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const frame = project(viewport);
    const inside = x >= frame.left && x <= frame.left + frame.width && y >= frame.top && y <= frame.top + frame.height;
    const centerX = inside ? viewport.x + viewport.width / 2 : projection.left + (x - projection.offsetX) / projection.scale;
    const centerY = inside ? viewport.y + viewport.height / 2 : projection.top + (y - projection.offsetY) / projection.scale;
    // Freeze the overview transform throughout the gesture, avoiding feedback
    // drift as panning changes the union of the viewport and the image bounds.
    gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, centerX, centerY, scale: projection.scale };
    setLocked(projection); onInteraction(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!inside) onNavigate(centerX, centerY);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    onNavigate(g.centerX + (event.clientX - g.x) / g.scale, g.centerY + (event.clientY - g.y) / g.scale);
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (!gesture.current || gesture.current.pointer !== event.pointerId) return;
    event.stopPropagation(); gesture.current = null; setLocked(null); onInteraction(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div ref={ref} className={`minimap-images${locked ? ' is-navigating' : ''}`} role="group" tabIndex={0} aria-label={label}
    onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    onKeyDown={event => {
      const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      if (dx || dy) { event.preventDefault(); event.stopPropagation(); onNavigate(viewport.x + viewport.width / 2 + dx * viewport.width * .1, viewport.y + viewport.height / 2 + dy * viewport.height * .1); }
    }}>
    {images.map(image => <span key={image.id} className="minimap-image" data-image-id={image.id} aria-hidden="true" style={{ ...project(image), borderRadius: Math.min(2, 16 * projection.scale) }} />)}
    <span className="minimap-viewport" aria-label={viewportLabel} style={project(viewport)} />
  </div>;
}
