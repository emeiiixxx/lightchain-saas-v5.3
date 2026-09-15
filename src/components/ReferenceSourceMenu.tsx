import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '../usePresence';
import { Icon } from './ui';

export function ReferenceSourceMenu({ addLabel, canvasLabel, onChoose }: { addLabel: string; canvasLabel: string; onChoose: (source: 'upload' | 'canvas') => void }) {
  const [open, setOpen] = useState(false);
  const shown = usePresence(open ? true : null);
  const trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null);
  const keyboard = useRef(false);
  const id = useId();
  useEffect(() => {
    const outside = (target: EventTarget | null) => target instanceof Node && !trigger.current?.contains(target) && !popup.current?.contains(target);
    const dismiss = (e: PointerEvent) => { if (outside(e.target)) { setOpen(false); trigger.current?.blur(); } };
    const focus = (e: FocusEvent) => { if (outside(e.target)) setOpen(false); };
    const other = (e: Event) => { if ((e as CustomEvent).detail !== id) setOpen(false); };
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('focusin', focus, true);
    document.addEventListener('lc-select-open', other);
    return () => { document.removeEventListener('pointerdown', dismiss, true); document.removeEventListener('focusin', focus, true); document.removeEventListener('lc-select-open', other); };
  }, [id]);
  useLayoutEffect(() => {
    if (!shown.value || !popup.current) return;
    const menu = popup.current;
    if (!menu.matches(':popover-open')) menu.showPopover();
    let frame = 0;
    const position = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) { setOpen(false); return; }
      const above = r.bottom + menu.offsetHeight + 12 > innerHeight;
      menu.dataset.side = above ? 'top' : 'bottom';
      menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8))}px`;
      menu.style.top = `${Math.max(8, above ? r.top - menu.offsetHeight - 4 : r.bottom + 4)}px`;
      if (open) frame = requestAnimationFrame(position);
    };
    position();
    if (open && keyboard.current) { menu.querySelector<HTMLButtonElement>('button')?.focus(); keyboard.current = false; }
    return () => cancelAnimationFrame(frame);
  }, [shown.value, open]);
  const expand = (keys: boolean) => { keyboard.current = keys; document.dispatchEvent(new CustomEvent('lc-select-open', { detail: id })); setOpen(true); };
  return <>
    <button ref={trigger} type="button" className="fusion-reference" aria-label={addLabel} data-tooltip={addLabel} aria-haspopup="menu" aria-controls={id} aria-expanded={open}
      onClick={() => open ? setOpen(false) : expand(false)} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); expand(true); } if (e.key === 'Escape') setOpen(false); }}><Icon name="fusionAddImage" size={20} /></button>
    {shown.value && createPortal(<div ref={popup} popover="manual" role="menu" id={id} aria-label={addLabel} className="lc-select-popup" data-select-popup data-overlay data-phase={shown.phase} inert={shown.phase === 'exit'}
      onKeyDown={e => {
        const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % 2 : e.key === 'ArrowUp' ? (i + 1) % 2 : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : -1;
        if (next >= 0) { e.preventDefault(); e.stopPropagation(); buttons[next].focus(); }
        if (e.key === 'Escape' || e.key === 'Tab') { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
      }}>
      {(['upload', 'canvas'] as const).map(source => <button type="button" role="menuitem" className="lc-select-option" key={source} onClick={() => { setOpen(false); onChoose(source); }}>{source === 'upload' ? addLabel : canvasLabel}</button>)}
    </div>, document.body)}
  </>;
}
