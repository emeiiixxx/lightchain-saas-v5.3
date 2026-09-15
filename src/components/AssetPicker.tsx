import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Divider, Icon } from './ui';
import { demoAssets, multiDemoAssets, prepareMainImage, type LibraryImage } from '../asset-library';
import { readImage, type CanvasImage } from '../canvas';
import { messages, type Locale } from '../i18n';

const sources = ['historyUploads', 'generationHistory', 'personalAssets', 'teamAssets', 'platformAssets'] as const;
type Props = {
  maxCount?: number;
  excludedUrls?: string[];
  limitMessage?: string;
  locale: Locale;
  phase: 'enter' | 'exit';
  uploads: LibraryImage[];
  onUpload: (image: LibraryImage) => void;
  onConfirm: (image: Omit<CanvasImage, 'x' | 'y'>) => void;
  onConfirmBatch?: (images: Omit<CanvasImage, 'x' | 'y'>[]) => void;
  onClose: () => void;
};

export function AssetPicker({ locale, phase, uploads, onUpload, onConfirm, onConfirmBatch, onClose, maxCount = 20, excludedUrls = [], limitMessage }: Props) {
  const t = messages[locale];
  const multiple = !!onConfirmBatch;
  const [chosen, setChosen] = useState<LibraryImage[]>([]);
  const [source, setSource] = useState<(typeof sources)[number]>('historyUploads');
  const [query, setQuery] = useState('');
  const [usingId, setUsingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'limit' | 'read' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const locked = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = phase === 'enter';
    return () => { active.current = false; request.current++; };
  }, [phase]);
  const candidates = source === 'historyUploads' ? [...new Map([...uploads, ...(multiple ? multiDemoAssets : demoAssets)].map(asset => [asset.url, asset])).values()] : [];
  const visible = candidates.filter(asset => !excludedUrls.includes(asset.url)).filter(asset => asset.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  async function upload(files: FileList | File[]) {
    if (!active.current || locked.current || !files.length) return;
    if (multiple ? files.length + chosen.length > maxCount : files.length !== 1) { setError('limit'); return; }
    const id = ++request.current;
    locked.current = true; setBusy(true); setError(null);
    try {
      const results = await Promise.allSettled(Array.from(files).map(readImage));
      const loaded = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
      if (!active.current || id !== request.current) { loaded.forEach(asset => URL.revokeObjectURL(asset.url)); return; }
      loaded.forEach(onUpload);
      if (multiple) setChosen(previous => [...previous, ...loaded]);
      if (results.some(result => result.status === 'rejected')) setError('read');
      setSource('historyUploads'); setQuery('');
    } catch { if (active.current && id === request.current) setError('read'); }
    finally { if (active.current && id === request.current) { locked.current = false; setBusy(false); } }
  }

  async function useAsset(asset: LibraryImage) {
    if (locked.current || !active.current) return;
    const id = ++request.current;
    locked.current = true; setBusy(true); setError(null);
    try {
      setUsingId(asset.id);
      const image = await prepareMainImage(asset);
      if (active.current && id === request.current) onConfirm(image);
    } catch { if (active.current && id === request.current) setError('read'); }
    finally { if (active.current && id === request.current) { locked.current = false; setBusy(false); } }
  }

  function toggleAsset(asset: LibraryImage) {
    if (locked.current || !active.current) return;
    if (chosen.some(item => item.id === asset.id)) {
      setChosen(previous => previous.filter(item => item.id !== asset.id)); setError(null);
    } else if (chosen.length >= maxCount) setError('limit');
    else { setChosen(previous => [...previous, asset]); setError(null); }
  }

  async function confirmBatch() {
    if (!onConfirmBatch || !chosen.length || chosen.length > maxCount || locked.current || !active.current) return;
    const id = ++request.current;
    locked.current = true; setBusy(true); setError(null);
    try {
      const prepared = await Promise.all(chosen.map(prepareMainImage));
      if (active.current && id === request.current) onConfirmBatch(prepared);
    } catch { if (active.current && id === request.current) setError('read'); }
    finally { if (active.current && id === request.current) { locked.current = false; setBusy(false); } }
  }

  return <Dialog title={t.chooseAssets} closeLabel={t.close} onClose={onClose} phase={phase} className="asset-picker">
    <div className="asset-filters" data-node-id={multiple ? "17:1864" : "50:24167"}>
      <div className="asset-tabs" role="tablist" aria-label={t.assetSources}>
        {sources.map((item, index) => <button type="button" key={item} role="tab" id={`asset-tab-${item}`} aria-controls="asset-grid" aria-selected={source === item} tabIndex={source === item ? 0 : -1}
          onClick={() => setSource(item)} onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (index + 1) % sources.length : event.key === 'ArrowLeft' ? (index + sources.length - 1) % sources.length : event.key === 'Home' ? 0 : event.key === 'End' ? sources.length - 1 : -1;
            if (next >= 0) { event.preventDefault(); setSource(sources[next]); document.getElementById(`asset-tab-${sources[next]}`)?.focus(); }
          }}>{t[item]}</button>)}
      </div>
      <label className="asset-search"><Icon name="search" size={20} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchAssets} aria-label={t.searchAssets} /></label>
    </div>
    <Divider />
    <div className="asset-grid" id="asset-grid" role="tabpanel" aria-labelledby={`asset-tab-${source}`} data-node-id={multiple ? "17:1938" : "50:24177"} aria-busy={busy}>
      {source === 'historyUploads' && !query.trim() && <button type="button" className={`asset-upload ${dragOver ? 'is-over' : ''}`} disabled={busy} aria-label={t.localUpload} onClick={() => input.current?.click()}
        onDragOver={event => { event.preventDefault(); if (event.dataTransfer.types.includes('Files')) setDragOver(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false); }}
        onDrop={event => { event.preventDefault(); event.stopPropagation(); setDragOver(false); void upload(event.dataTransfer.files); }}>
        <Icon name="upload" size={32} /><span className="asset-upload-title">{busy ? t.reading : dragOver ? t.dropImagesHere : t.localUpload}</span><span className="asset-upload-hint">{dragOver && !busy ? t.releaseToUpload : t.localUploadHint}</span>
      </button>}
      {visible.map(asset => multiple ? <button type="button" key={asset.id} className="asset-card asset-card--multiple" aria-label={asset.name} aria-pressed={chosen.some(item => item.id === asset.id)} disabled={busy} onClick={() => toggleAsset(asset)}>
        <img src={asset.url} alt="" loading="lazy" draggable={false} />
        <span className="asset-checkbox" aria-hidden="true"><Icon name="selectionCheck" size={24} /></span>
      </button> : <div key={asset.id} className="asset-card" onClick={() => void useAsset(asset)}>
        <img src={asset.url} alt={asset.name} loading="lazy" draggable={false} />
        <span className="asset-card-scrim" aria-hidden="true" />
        <div className="asset-card-actions">
          <Button variant="primary" size="m" disabled={busy} aria-label={`${t.useAsset} · ${asset.name}`}>
            {busy && usingId === asset.id ? t.reading : t.useAsset}
          </Button>
        </div>
      </div>)}
      {!visible.length && (source !== 'historyUploads' || query.trim()) && <div className="asset-empty">{query.trim() ? t.noSearchResults : t.noAssets}</div>}
    </div>
    <input ref={input} type="file" hidden multiple={multiple} accept="image/png,image/jpeg,image/webp" onChange={event => { if (event.target.files) void upload(event.target.files); event.target.value = ''; }} />
    {error && <p className="asset-error error-message" role="alert">{error === 'limit' ? (multiple ? (limitMessage || t.batchImageLimit) : t.mainImageLimit) : t.uploadError}</p>}
    {multiple && <footer className="asset-footer" data-node-id="17:1865">
      <div className="asset-counter" role="status"><span>{t.selectedCount}</span><strong>{chosen.length} / {maxCount}</strong></div>
      <Button variant="secondary" size="m" onClick={onClose}>{t.cancel}</Button>
      <Button variant="primary" size="m" disabled={!chosen.length || busy} onClick={() => void confirmBatch()}>{busy ? t.reading : t.confirm}</Button>
    </footer>}
  </Dialog>;
}
