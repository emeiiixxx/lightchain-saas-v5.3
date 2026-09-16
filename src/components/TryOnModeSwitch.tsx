import { useRef } from 'react';
import { Icon } from './ui';
import { TryOnAnnouncement } from './TryOnAnnouncement';
import type { Locale } from '../i18n';

export type TryOnMode = 'regular' | 'lingerie';
const labels = {
  'zh-CN': { regular: '常规', lingerie: '内衣', group: '试衣模式' },
  en: { regular: 'Regular', lingerie: 'Lingerie', group: 'Try-on mode' },
  ja: { regular: '通常', lingerie: '下着', group: '試着モード' },
};

// The moving indicator belongs to the track; only the selected item has a label.
export function TryOnModeSwitch({ value, onChange, locale, active = false }: { active?: boolean; value: TryOnMode; onChange: (mode: TryOnMode) => void; locale: Locale }) {
  const t = labels[locale];
  const anchor = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <><div ref={anchor} className="tryon-mode-switch" data-mode={value} data-node-id={value === 'regular' ? '136:16116' : '136:16144'} role="tablist" aria-label={t.group}>
    <span className="tryon-mode-indicator" aria-hidden="true" />
    {(['regular', 'lingerie'] as const).map((mode, index) => <button key={mode} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={`tryon-mode-${mode}`} aria-controls="tryon-form" aria-selected={value === mode} aria-label={t[mode]} data-tooltip={value === mode ? undefined : t[mode]} tabIndex={value === mode ? 0 : -1}
      onClick={() => onChange(mode)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
        onChange(next === 0 ? 'regular' : 'lingerie'); buttons.current[next]?.focus();
      }}>
      <Icon name={mode === 'regular' ? 'aiTryOn' : 'lingerieTryOn'} size={16} /><span className="tryon-mode-label" aria-hidden={value !== mode}>{t[mode]}</span>
    </button>)}
  </div><TryOnAnnouncement active={active} anchor={anchor} locale={locale} onTry={() => { onChange('lingerie'); buttons.current[1]?.focus({ preventScroll: true }); }} /></>;
}
