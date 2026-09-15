import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './ui';

// Business Button/GenerateTask, separate from the primitive Primary button.
export function GenerateTaskButton({ label, cost, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; cost?: string }) {
  return <button type="button" className={`generate-task-button ${className}`} data-node-id="88:32168" {...props}>
    <span>{label}</span>{cost !== undefined && <><Icon name="fusionStar" size={16} /><span className="generate-task-cost">{cost}</span></>}
  </button>;
}
