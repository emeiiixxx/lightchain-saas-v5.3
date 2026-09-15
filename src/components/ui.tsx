import { isValidElement, useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { assets } from '../assets';

export type IconName = keyof typeof assets;

// Monochrome artwork uses the exact exported SVG as a mask, so both themes
// inherit the component foreground instead of locking the exported dark color.
export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <span aria-hidden="true" className={`icon ${className}`} style={{ width: size, height: size, '--icon-url': `url("${assets[name]}")` } as CSSProperties} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'ghost' | 'primary' | 'secondary' | 'tonal'; size?: 's' | 'm' | 'l'; icon?: IconName };
export function Button({ variant = 'ghost', size = 's', icon, children, className = '', title, ...props }: ButtonProps) {
  const iconOnly = (!children && !!icon) || (isValidElement(children) && children.type === Icon);
  const tooltip = title || (iconOnly ? props['aria-label'] : undefined);
  return <button type="button" className={`lc-button lc-button--${variant} lc-button--${size} ${iconOnly ? 'lc-button--icon' : ''} ${className}`} {...props} data-tooltip={tooltip}>
    {icon && <Icon name={icon} size={size === 'l' ? 24 : size === 'm' ? 20 : 16} />}{children}
  </button>;
}

export function Divider({ vertical = false }: { vertical?: boolean }) {
  return <span aria-hidden="true" className={vertical ? 'divider divider--vertical' : 'divider'} />;
}

export function Dialog({ title, children, onClose, closeLabel, phase = 'enter', className = '' }: { title: string; children: ReactNode; onClose: () => void; closeLabel: string; phase?: 'enter' | 'exit'; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`lc-dialog ${className}`} data-phase={phase} inert={phase === 'exit'} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <div className="dialog-header flex items-center justify-between gap-4 mb-6">
      <h2 id="dialog-title" className="text-base font-medium">{title}</h2>
      <Button onClick={onClose} aria-label={closeLabel} className="!w-8 !p-0"><Icon name="close" size={20} /></Button>
    </div>
    {children}
  </dialog>;
}
