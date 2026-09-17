import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui';
import { messages, type Locale } from '../i18n';

type Props = {
  anchor: HTMLElement;
  locale: Locale;
  phase: 'enter' | 'exit';
  kind: 'improve' | 'dislike';
  onClose: () => void;
  onSubmit: (text: string, reasons: string[]) => boolean;
};
export function ResultFeedbackPopover({ anchor, locale, phase, kind, onClose, onSubmit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const negative = kind === 'dislike';
  const t = messages[locale];
  useLayoutEffect(() => {
    const el = ref.current!;
    el.showPopover();
    let frame = 0;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      el.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - el.offsetWidth / 2, innerWidth - el.offsetWidth - 8))}px`;
      const below = rect.bottom + 8;
      el.style.top = `${Math.max(8, below + el.offsetHeight <= innerHeight - 8 ? below : rect.top - el.offsetHeight - 8)}px`;
      frame = requestAnimationFrame(place);
    };
    place();
    el.querySelector<HTMLElement>('textarea, button')?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(frame);
  }, [anchor, kind]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target) && !anchor.contains(event.target)) onClose();
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [anchor, onClose]);
  const close = () => { onClose(); if (anchor.isConnected) anchor.focus({ preventScroll: true }); };
  return createPortal(<div ref={ref} popover="manual" className={`result-feedback-popover${negative ? ' result-dislike-popover' : ''}`} data-overlay data-select-popup data-phase={phase} inert={phase === 'exit'} role="dialog" aria-label={negative ? t.resultDislike : t.resultImprove}
    onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); close(); } }}>
    <form onSubmit={event => { event.preventDefault(); if ((negative ? reasons.length > 0 : !!text.trim()) && onSubmit(text.trim(), reasons)) close(); }}>
      {negative ? <div className="result-dislike-reasons" role="group" aria-label={t.resultDislikeReasons}>
        {[t.resultReasonBody, t.resultReasonGender, t.resultReasonProportions, t.resultReasonFace, t.resultReasonEdges, t.resultReasonOther].map(reason => <Button key={reason} variant="outline" aria-pressed={reasons.includes(reason)} onClick={() => setReasons(previous => previous.includes(reason) ? previous.filter(item => item !== reason) : [...previous, reason])}>{reason}</Button>)}
      </div> : <textarea aria-label={t.resultFeedbackInput} placeholder={t.resultFeedbackPlaceholder} value={text} onChange={event => setText(event.target.value)} />}
      <footer>{negative && <Button variant="secondary" onClick={close}>{t.cancel}</Button>}<Button variant="primary" type="submit" disabled={negative ? !reasons.length : !text.trim()}>{t.resultFeedbackSubmit}</Button></footer>
    </form>
  </div>, document.body);
}
