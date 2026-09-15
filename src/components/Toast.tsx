import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '../usePresence';
import './toast.css';

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent('lc-toast', { detail: message }));
}

export function ToastHost() {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const shown = usePresence(notice);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const receive = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      clearTimeout(timer);
      setNotice({ message });
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
  return shown.value ? createPortal(<div ref={ref} popover="manual" className="lc-toast" data-phase={shown.phase} role="status" aria-live="polite">{shown.value.message}</div>, document.body) : null;
}
