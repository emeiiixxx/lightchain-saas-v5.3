import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '../usePresence';
import { Icon } from './ui';
import './toast.css';

type ToastNotice = { message: string; tone?: 'default' | 'error' };

export function notify(message: string, tone: ToastNotice['tone'] = 'default') {
  window.dispatchEvent(new CustomEvent<ToastNotice>('lc-toast', { detail: { message, tone } }));
}

export function ToastHost() {
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const shown = usePresence(notice);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<ToastNotice | string>).detail;
      clearTimeout(timer);
      setNotice(typeof detail === 'string' ? { message: detail } : detail);
      timer = setTimeout(() => setNotice(null), 5000);
    };
    window.addEventListener('lc-toast', receive);
    return () => { clearTimeout(timer); window.removeEventListener('lc-toast', receive); };
  }, []);
  useLayoutEffect(() => {
    if (notice && ref.current) {
      // Reopen above the current modal without moving keyboard focus.
      ref.current.hidePopover();
      ref.current.showPopover();
    }
  }, [notice]);
  return shown.value ? createPortal(<div ref={ref} popover="manual" className="lc-toast" data-tone={shown.value.tone} data-phase={shown.phase} role={shown.value.tone === 'error' ? 'alert' : 'status'} aria-live={shown.value.tone === 'error' ? 'assertive' : 'polite'}>{shown.value.tone === 'error' && <Icon name="toastExclamation" size={16} />}<span>{shown.value.message}</span></div>, document.body) : null;
}
