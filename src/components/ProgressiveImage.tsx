import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { imagePreview, rememberImagePreview } from '../image-previews';
import '../progressive-image.css';

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  fit?: 'contain' | 'cover';
  eager?: boolean;
};

// Reset all request state on source changes, including unresolved decode promises.
export const ProgressiveImage = memo(function ProgressiveImage(props: Props) {
  return <ImageRequest key={props.src} {...props} />;
});

function ImageRequest({ src, alt, width, height, className = '', style, fit = 'cover', eager = false }: Props) {
  const host = useRef<HTMLSpanElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const [started, setStarted] = useState(eager);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [preview] = useState(() => imagePreview(src));

  useEffect(() => {
    if (started) return;
    if (eager || typeof IntersectionObserver === 'undefined') { setStarted(true); return; }
    // Observe the rendered bounds, including canvas transforms and scroll clipping.
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setStarted(true);
        observer.disconnect();
      }
    }, { rootMargin: '240px' });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, [started, eager]);

  useEffect(() => {
    if (!started || !picture.current) return;
    const image = picture.current;
    let cancelled = false;
    let decoding = false;
    const fail = () => { if (!cancelled) setState('error'); };
    const reveal = async () => {
      if (decoding || cancelled) return;
      decoding = true;
      try {
        // Download completion alone does not mean a large image is decoded.
        if (typeof image.decode === 'function') await image.decode();
        if (cancelled) return;
        if (!image.naturalWidth) { fail(); return; }
        if (!preview) rememberImagePreview(src, image);
        setState('ready');
      } catch { fail(); }
    };
    image.addEventListener('load', reveal);
    image.addEventListener('error', fail);
    if (image.complete) { if (image.naturalWidth) void reveal(); else fail(); }
    return () => {
      cancelled = true;
      image.removeEventListener('load', reveal);
      image.removeEventListener('error', fail);
    };
  }, [started, src, preview]);

  const language = document.documentElement.lang;
  const failure = language === 'ja' ? '画像を読み込めませんでした' : language === 'en' ? 'Image failed to load' : '图片加载失败';
  return <span ref={host} className={`progressive-image ${className}`} data-image-state={state}
    aria-busy={state === 'loading'} style={{ ...style, '--image-fit': fit } as CSSProperties}>
    {preview ? <img className="progressive-image-preview" src={preview} alt="" aria-hidden="true" draggable={false} />
      : <span className="progressive-image-placeholder" aria-hidden="true" />}
    <img ref={picture} className="progressive-image-full" src={started ? src : undefined} alt={state === 'error' ? '' : alt}
      width={width} height={height} decoding="async" draggable={false} />
    {state === 'error' && <span className="progressive-image-error" role="img" aria-label={`${alt} · ${failure}`}>{failure}</span>}
  </span>;
}
