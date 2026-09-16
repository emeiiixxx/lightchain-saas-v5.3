import { ProgressiveImage } from './ProgressiveImage';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Button, Icon } from './ui';
import type { CanvasImage } from '../canvas';
import { messages, type Locale } from '../i18n';

type Props = { image: CanvasImage; locale: Locale; phase: 'enter' | 'exit'; onClose: () => void };
export function FullImageViewer({ image, locale, phase, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ pointer: number; clientX: number; clientY: number; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, zoom: 1 });
  const current = useRef(position); current.current = position;
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const t = messages[locale];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); element.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const element = stage.current!;
    const wheel = (event: WheelEvent) => {
      if (element.closest('[inert]')) return;
      event.preventDefault(); event.stopPropagation();
      const rect = element.getBoundingClientRect();
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      setPosition(previous => {
        const zoom = Math.max(.1, Math.min(8, previous.zoom * Math.exp(-Math.max(-600, Math.min(600, delta)) * .0015)));
        const ratio = zoom / previous.zoom;
        return { zoom, x: px - (px - previous.x) * ratio, y: py - (py - previous.y) * ratio };
      });
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (phase === 'exit' || event.button !== 0) return;
    event.preventDefault();
    gesture.current = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: current.current.x, y: current.current.y };
    event.currentTarget.setPointerCapture(event.pointerId); setDragging(true);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    setPosition(previous => ({ ...previous, x: g.x + event.clientX - g.clientX, y: g.y + event.clientY - g.clientY }));
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointer !== event.pointerId) return;
    gesture.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const fit = Math.min(800 / image.width, 800 / image.height, Math.max(1, size.width - (size.width <= 680 ? 32 : 80)) / image.width, Math.max(1, size.height - 160) / image.height);
  return <dialog ref={dialog} className="full-image-viewer" data-phase={phase} data-node-id="68:27657" inert={phase === 'exit'} aria-label={`${t.viewFull} · ${image.name}`}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div ref={stage} className={`full-image-stage${dragging ? ' is-panning' : ''}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="full-image-center" style={{ width: image.width * fit, height: image.height * fit }}>
        <ProgressiveImage className="full-image-content" src={image.url} alt={image.name} eager fit="contain" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${position.zoom})` }} />
      </div>
    </div>
    <div className="full-image-instructions" role="status" data-node-id="68:27757">{t.fullImageInstructions}</div>
    <Button className="full-image-close" aria-label={t.close} onClick={onClose} data-node-id="68:28013"><Icon name="close" size={20} /></Button>
  </dialog>;
}
