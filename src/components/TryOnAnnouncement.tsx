import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '../usePresence';
import type { Locale } from '../i18n';
import { Button, Icon } from './ui';
import type { TryOnMode } from './TryOnModeSwitch';

const storageKey = 'lc-tryon-lingerie-announcement-dismissed';
const copy = {
  'zh-CN': { text: '🎉 新增内衣试衣模式，点击试试看吧！', close: '关闭提示' },
  en: { text: '🎉 New lingerie try-on mode. Give it a try!', close: 'Dismiss announcement' },
  ja: { text: '🎉 下着試着モードが登場！試してみましょう', close: 'お知らせを閉じる' },
};

export function TryOnAnnouncement({ active, mode, anchor, locale, onTry }: { active: boolean; mode: TryOnMode; anchor: RefObject<HTMLDivElement | null>; locale: Locale; onTry: () => void }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true'; } catch { return false; }
  });
  const shown = usePresence(active && mode === 'regular' && !dismissed ? true : null);
  const popup = useRef<HTMLDivElement>(null);
  const t = copy[locale];
  function dismiss() {
    setDismissed(true);
    if (popup.current?.contains(document.activeElement)) anchor.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
    try { localStorage.setItem(storageKey, 'true'); } catch { /* Keep the session dismissal. */ }
  }
  useEffect(() => { if (active && mode === 'lingerie') dismiss(); }, [active, mode]);
  useEffect(() => {
    if (!active || dismissed) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open], [popover]:popover-open')) dismiss();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [active, dismissed]);
  useLayoutEffect(() => {
    if (!shown.value || !popup.current || !anchor.current) return;
    const element = popup.current, target = anchor.current;
    const position = () => {
      const rect = target.getBoundingClientRect();
      const width = element.offsetWidth, height = element.offsetHeight;
      const right = rect.right + 1;
      const below = right + width > innerWidth - 12;
      element.dataset.side = below ? 'bottom' : 'right';
      element.style.left = `${below ? Math.max(12, Math.min(rect.left, innerWidth - width - 12)) : right}px`;
      element.style.top = `${below ? rect.bottom + 8 : rect.top + rect.height / 2 - height / 2}px`;
      element.style.setProperty('--arrow-left', `${Math.max(16, Math.min(width - 24, rect.right - 16 - parseFloat(element.style.left)))}px`);
      element.style.visibility = active && rect.bottom > 48 && rect.top < innerHeight ? 'visible' : 'hidden';
    };
    position();
    const observer = new ResizeObserver(position); observer.observe(target); observer.observe(element);
    window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [shown.value, active, anchor, locale]);
  if (!shown.value) return null;
  return createPortal(<div ref={popup} className="tryon-announcement" data-node-id="136:17833" data-phase={shown.phase} inert={shown.phase === 'exit'} role="region" aria-label={t.text} style={{ visibility: 'hidden' }}>
    <img className="tryon-announcement-arrow" src="/assets/try-on/announcement-arrow.svg" alt="" width={8} height={24} />
    <div className="tryon-announcement-body"><button className="tryon-announcement-message" type="button" onClick={() => { dismiss(); onTry(); }}>{t.text}</button><Button className="tryon-announcement-close" aria-label={t.close} onClick={dismiss}><Icon name="close" size={16} /></Button></div>
  </div>, document.body);
}
