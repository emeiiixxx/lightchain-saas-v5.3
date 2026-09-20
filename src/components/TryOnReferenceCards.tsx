import { useEffect, useRef, useState } from 'react';
import { Button, Divider, Icon } from './ui';
import { ProgressiveImage } from './ProgressiveImage';
import { readImage } from '../canvas';
import type { LibraryImage } from '../asset-library';
import type { Locale } from '../i18n';
import { messages } from '../i18n';
import { notify } from './Toast';

export type ReferenceTarget = 'references' | 'poses' | 'backgrounds';
const copy = {
  'zh-CN': { references: '试衣模特图', poses: '姿势调整', backgrounds: '背景调整', upload: '点击上传', or: '或', library: '参考图库', choose: '选择', required: '必填', example: '示例图', remove: '删除图片', replace: '替换图片', single: '每个区域最多添加 1 张图片' },
  en: { references: 'Try-on model', poses: 'Adjust pose', backgrounds: 'Adjust background', upload: 'Upload', or: 'or', library: 'Reference library', choose: '', required: 'Required', example: 'Example', remove: 'Remove image', replace: 'Replace image', single: 'Choose one image per section.' },
  ja: { references: '試着モデル画像', poses: 'ポーズ調整', backgrounds: '背景調整', upload: 'アップロード', or: 'または', library: '参考画像集', choose: 'から選択', required: '必須', example: 'サンプル', remove: '画像を削除', replace: '画像を変更', single: '各エリアに1枚まで追加できます。' },
};
const targets: ReferenceTarget[] = ['references', 'poses', 'backgrounds'];
// User-provided reference examples; original files preserved.
const examples = { references: '/assets/try-on/model-example.png', poses: '/assets/try-on/pose-example.png', backgrounds: '/assets/try-on/background-example.png' };
type Props = { locale: Locale; images: Record<ReferenceTarget, LibraryImage[]>; onPick: (target: ReferenceTarget) => void; onChange: (target: ReferenceTarget, images: LibraryImage[]) => void; onUpload: (image: LibraryImage) => void };
function ReferenceCard({ target, locale, images, onPick, onChange, onUpload }: Props & { target: ReferenceTarget }) {
  const t = copy[locale], input = useRef<HTMLInputElement>(null), alive = useRef(true), locked = useRef(false);
  const [reading, setReading] = useState(false), [over, setOver] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function upload(files: File[]) {
    if (!files.length || locked.current) return;
    if (files.length > 1) { notify(t.single); return; }
    locked.current = true; setReading(true);
    try {
      const image = await readImage(files[0]);
      if (!alive.current) { URL.revokeObjectURL(image.url); return; }
      onUpload(image); onChange(target, [image]);
    } catch { if (alive.current) notify(messages[locale].uploadError); }
    finally { locked.current = false; if (alive.current) setReading(false); }
  }
  const selected = images[target][0];
  return <section className={`tryon-reference-card${over ? ' is-dragging-over' : ''}`} aria-label={t[target]} aria-busy={reading}
    onDragOver={event => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setOver(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
    onDrop={event => { event.preventDefault(); setOver(false); void upload(Array.from(event.dataTransfer.files)); }}>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { void upload(Array.from(event.target.files || [])); event.target.value = ''; }} />
    {selected ? <div className="tryon-reference-selected">
      <ProgressiveImage src={selected.url} alt={selected.name} />
      <div className="tryon-reference-actions"><Button variant="tonal" aria-label={t.replace} disabled={reading} onClick={() => onPick(target)}><Icon name="fusionAddImage" size={20} /></Button><Button variant="tonal" aria-label={t.remove} disabled={reading} onClick={() => onChange(target, [])}><Icon name="contextTrash" size={20} /></Button></div>
      <span className="tryon-reference-caption">{t[target]}</span>
    </div> : <div className="tryon-reference-entry">
      <Icon name="fusionAddImage" size={32} className="tryon-reference-upload-icon" />
      <strong>{t[target]}</strong>
      <div className="tryon-reference-links"><button type="button" disabled={reading} onClick={() => input.current?.click()}>{reading ? messages[locale].reading : t.upload}</button><span>{t.or}</span><button type="button" disabled={reading} onClick={() => onPick(target)}>{t.library}</button><span>{t.choose}</span></div>
      {target === 'references' && <span className="tryon-reference-required">{t.required}</span>}
    </div>}
    <Divider vertical />
    <div className="tryon-reference-example"><img src={examples[target]} alt={`${t[target]} · ${t.example}`} /><span>{t.example}</span></div>
  </section>;
}
export function TryOnReferenceCards(props: Props) {
  return <div className="tryon-reference-cards">{targets.map(target => <ReferenceCard key={target} {...props} target={target} />)}</div>;
}
