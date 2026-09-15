import { useEffect, useState } from 'react';

// Retain closing content until the shared exit curve finishes. Reopening cancels
// the pending removal, so rapid menu/dialog interactions remain reversible.
export function usePresence<T>(value: T | null) {
  const [retained, setRetained] = useState<T | null>(value);
  useEffect(() => {
    if (value !== null) { setRetained(value); return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration')) || 200;
    const timer = window.setTimeout(() => setRetained(null), reduced ? 0 : duration);
    return () => window.clearTimeout(timer);
  }, [value]);
  return { value: value ?? retained, phase: value === null ? 'exit' as const : 'enter' as const };
}
