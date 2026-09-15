import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './ui';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & { pressed: boolean; label: string; icon: IconName };
// Figma ToggleButton 89:4047: independent persistent state, not a Tool selection.
export function ToggleButton({ pressed, label, icon, title, className = '', ...props }: Props) {
  return <button type="button" className={`lc-toggle-button ${className}`} aria-label={label} aria-pressed={pressed} data-tooltip={title || label} {...props}>
    <Icon name={icon} size={24} />
  </button>;
}
