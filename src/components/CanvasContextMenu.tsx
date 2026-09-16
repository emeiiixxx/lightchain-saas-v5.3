import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from '../i18n';
import { usePresence } from '../usePresence';
import { Icon } from './ui';

type Props = {
  point: { x: number; y: number; kind?: 'image' } | null;
  canPaste: boolean;
  locale: Locale;
  onClose: () => void;
  onUpload: () => void;
  onPaste: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function CanvasContextMenu({ point, canPaste, locale, onClose, onUpload, onPaste, onDownload, onCopy, onDuplicate, onDelete }: Props) {
  const shown = usePresence(point);
  const ref = useRef<HTMLDivElement>(null);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const imageMenu = shown.value?.kind === 'image';
  const imageLabels = locale === 'zh-CN' ? ['图片菜单', '下载', '复制', '复制并粘贴', '删除'] : locale === 'ja' ? ['画像メニュー', 'ダウンロード', 'コピー', '複製', '削除'] : ['Image menu', 'Download', 'Copy', 'Duplicate', 'Delete'];
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
  return createPortal(<div ref={ref} popover="manual" data-canvas-context-menu data-image-menu={imageMenu || undefined} data-overlay role="menu" aria-label={imageMenu ? imageLabels[0] : labels[0]}
    className="lc-select-popup canvas-context-menu" data-phase={shown.phase} inert={shown.phase === 'exit'}
    onContextMenu={event => event.preventDefault()}
    onKeyDown={event => {
      event.stopPropagation();
      if (imageMenu && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 'c' || key === 'd') { event.preventDefault(); (key === 'c' ? onCopy : onDuplicate)(); return; }
      }
      if (imageMenu && (event.key === 'Delete' || event.key === 'Backspace')) { event.preventDefault(); onDelete(); return; }
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'ArrowDown' ? (index + 1) % buttons.length : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); buttons[next]?.focus(); }
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') onClose();
    }}>
    {imageMenu ? <>
      <button type="button" role="menuitem" className="lc-select-option" onClick={onDownload}><Icon name="contextDownload" size={20} /><span className="canvas-context-label">{imageLabels[1]}</span></button>
      <div className="canvas-context-divider" role="separator" />
      <button type="button" role="menuitem" className="lc-select-option" aria-keyshortcuts={isMac ? 'Meta+C' : 'Control+C'} onClick={onCopy}><Icon name="contextCopy" size={20} /><span className="canvas-context-label">{imageLabels[2]}</span><span className="canvas-context-shortcut">Ctrl/⌘ + C</span></button>
      <button type="button" role="menuitem" className="lc-select-option" aria-keyshortcuts={isMac ? 'Meta+D' : 'Control+D'} onClick={onDuplicate}><Icon name="contextCopy" size={20} /><span className="canvas-context-label">{imageLabels[3]}</span><span className="canvas-context-shortcut">Ctrl/⌘ + D</span></button>
      <button type="button" role="menuitem" className="lc-select-option" aria-keyshortcuts="Backspace Delete" onClick={onDelete}><Icon name="contextTrash" size={20} /><span className="canvas-context-label">{imageLabels[4]}</span><span className="canvas-context-shortcut">←/del</span></button>
    </> : <><button type="button" role="menuitem" className="lc-select-option" onClick={onUpload}><Icon name="canvasUpload" size={20} /><span className="canvas-context-label">{labels[1]}</span></button>
    <button type="button" role="menuitem" className="lc-select-option" disabled={!canPaste} aria-keyshortcuts={isMac ? 'Meta+V' : 'Control+V'} onClick={onPaste}>
      <Icon name="canvasPaste" size={20} /><span className="canvas-context-label">{labels[2]}</span><span className="canvas-context-shortcut">{isMac ? '⌘+V' : 'Ctrl+V'}</span>
    </button></>}
  </div>, document.body);
}
