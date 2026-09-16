import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from '../i18n';
import { usePresence } from '../usePresence';
import { Icon } from './ui';

type Props = {
  point: { x: number; y: number } | null;
  canPaste: boolean;
  locale: Locale;
  onClose: () => void;
  onUpload: () => void;
  onPaste: () => void;
};

export function CanvasContextMenu({ point, canPaste, locale, onClose, onUpload, onPaste }: Props) {
  const shown = usePresence(point);
  const ref = useRef<HTMLDivElement>(null);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const labels = locale === 'zh-CN' ? ['画布菜单', '上传图片', '粘贴'] : locale === 'ja' ? ['キャンバスメニュー', '画像をアップロード', '貼り付け'] : ['Canvas menu', 'Upload images', 'Paste'];
  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu || !shown.value) return;
    if (!menu.matches(':popover-open')) menu.showPopover();
    menu.style.left = `${Math.max(8, Math.min(shown.value.x, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(shown.value.y, innerHeight - menu.offsetHeight - 8))}px`;
    if (point) menu.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, [point, shown.value]);
  useEffect(() => {
    if (!point) return;
    const outside = (event: Event) => { if (!(event.target instanceof Node) || !ref.current?.contains(event.target)) onClose(); };
    const otherMenu = (event: Event) => { if ((event as CustomEvent).detail !== 'canvas-context') onClose(); };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('wheel', outside, true);
    document.addEventListener('focusin', outside, true);
    document.addEventListener('lc-select-open', otherMenu);
    window.addEventListener('resize', onClose);
    window.addEventListener('blur', onClose);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('wheel', outside, true);
      document.removeEventListener('focusin', outside, true);
      document.removeEventListener('lc-select-open', otherMenu);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('blur', onClose);
    };
  }, [point, onClose]);
  if (!shown.value) return null;
  return createPortal(<div ref={ref} popover="manual" data-canvas-context-menu data-overlay role="menu" aria-label={labels[0]}
    className="lc-select-popup canvas-context-menu" data-phase={shown.phase} inert={shown.phase === 'exit'}
    onContextMenu={event => event.preventDefault()}
    onKeyDown={event => {
      event.stopPropagation();
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'ArrowDown' ? (index + 1) % buttons.length : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); buttons[next]?.focus(); }
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') onClose();
    }}>
    <button type="button" role="menuitem" className="lc-select-option" onClick={onUpload}><Icon name="canvasUpload" size={20} /><span className="canvas-context-label">{labels[1]}</span></button>
    <button type="button" role="menuitem" className="lc-select-option" disabled={!canPaste} aria-keyshortcuts={isMac ? 'Meta+V' : 'Control+V'} onClick={onPaste}>
      <Icon name="canvasPaste" size={20} /><span className="canvas-context-label">{labels[2]}</span><span className="canvas-context-shortcut">{isMac ? '⌘+V' : 'Ctrl+V'}</span>
    </button>
  </div>, document.body);
}
