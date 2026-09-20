import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from './ui';
import { ProgressiveImage } from './ProgressiveImage';
import { notify } from './Toast';
import type { LibraryImage } from '../asset-library';
import type { Locale } from '../i18n';
import { createPortal } from 'react-dom';
import { usePresence } from '../usePresence';

type Category = 'all' | 'men' | 'women' | 'kids';
const categories: Category[] = ['all', 'men', 'women', 'kids'];
const copy = {
  'zh-CN': { all: '全部', men: '男装', women: '女装', kids: '童装', label: '模特套图分类', group: '模特套图', use: '使用', selected: '已选用', empty: '暂无该分类套图', tip: '没找到心仪模特？使用模特企划库可定制专属模特！', customize: '立即定制', unavailable: '模特企划库暂未接入' },
  en: { all: 'All', men: 'Menswear', women: 'Womenswear', kids: 'Kidswear', label: 'Model set category', group: 'Model set', use: 'Use', selected: 'Selected', empty: 'No model sets in this category', tip: 'Looking for another model? Create your own in the model library.', customize: 'Customize', unavailable: 'The model library is not connected yet.' },
  ja: { all: 'すべて', men: 'メンズ', women: 'レディース', kids: 'キッズ', label: 'モデルセット分類', group: 'モデルセット', use: '使用', selected: '選択中', empty: 'この分類のセットはありません', tip: 'お好みのモデルが見つかりませんか？モデルライブラリで作成できます。', customize: 'カスタマイズ', unavailable: 'モデルライブラリは未接続です。' },
};
// Ten display groups reusing the two user-provided sets; each group has its own selection IDs.
const sets = Array.from({ length: 10 }, (_, index) => {
  const group = index % 2 === 0 ? 3 : 6;
  return {
    id: `user-model-set-${index + 1}`, category: 'women' as Category,
    images: ['', '.1', '.2', '.3'].map((suffix): LibraryImage => ({ id: `user-model-set-${index + 1}-${group}${suffix}`, name: `${group}${suffix}.webp`, url: `/assets/try-on/model-sets/${group}${suffix}.webp` })),
  };
});
export function TryOnModelSets({ active, locale, selected, onSelect }: { active: boolean; locale: Locale; selected: LibraryImage[]; onSelect: (images: LibraryImage[]) => void }) {
  const t = copy[locale];
  const [category, setCategory] = useState<Category>('all');
  const [hovered, setHovered] = useState<{ set: typeof sets[number]; anchor: HTMLButtonElement } | null>(null);
  const preview = usePresence(active ? hovered : null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, height: 0 });
  function keepOpen() { if (timer.current) clearTimeout(timer.current); }
  function closeSoon() { keepOpen(); timer.current = setTimeout(() => setHovered(null), 100); }
  function show(set: typeof sets[number], anchor: HTMLButtonElement) { keepOpen(); setHovered({ set, anchor }); }
  useLayoutEffect(() => {
    if (!preview.value) return;
    const anchor = preview.value.anchor.getBoundingClientRect();
    const sidebar = preview.value.anchor.closest('.tryon-sidebar')?.getBoundingClientRect();
    const right = (sidebar?.right ?? anchor.right) + 8;
    const fitsRight = window.innerWidth - right >= 240;
    const left = fitsRight ? right : 8;
    const availableWidth = Math.max(0, Math.min(1160, window.innerWidth - left - 8));
    const frame = 18; // 8px padding + 1px border on each side.
    const imageHeight = Math.max(0, Math.min(480, window.innerHeight - 16 - frame, (availableWidth - 24 - frame) / 4 * (16 / 9)));
    const height = imageHeight + frame;
    const width = imageHeight * (9 / 16) * 4 + 24 + frame;
    const top = fitsRight ? Math.max(8, Math.min(anchor.top + anchor.height / 2 - height / 2, window.innerHeight - height - 8)) : Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - height - 8));
    setPosition({ left, top, width, height });
  }, [preview.value]);
  useEffect(() => {
    if (!hovered) return;
    const close = () => setHovered(null);
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close); window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); window.removeEventListener('keydown', escape); };
  }, [hovered]);
  useEffect(() => { setHovered(null); }, [active, category]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const visible = sets.filter(set => category === 'all' || set.category === category);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, current: Category) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = categories.indexOf(current);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + categories.length) % categories.length;
    setCategory(categories[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
  return <div className="tryon-model-sets" data-node-id="102:24178">
    <div className="tryon-set-filters" role="tablist" aria-label={t.label}>
      {categories.map(value => <button type="button" key={value} role="tab" id={`tryon-set-filter-${value}`} aria-controls="tryon-set-list" aria-selected={category === value} tabIndex={category === value ? 0 : -1} onClick={() => setCategory(value)} onKeyDown={event => navigate(event, value)}><span>{t[value]}</span></button>)}
    </div>
    <div className="tryon-set-list" id="tryon-set-list" role="tabpanel" aria-labelledby={`tryon-set-filter-${category}`}>
      {visible.map((set, index) => {
        const chosen = selected.length === 4 && set.images.every((image, i) => selected[i]?.id === image.id);
        return <button type="button" key={set.id} className={`tryon-set-card${chosen ? ' is-selected' : ''}`} aria-label={`${t.group} ${index + 1}`} aria-pressed={chosen}
          onMouseEnter={event => show(set, event.currentTarget)} onMouseLeave={closeSoon} onFocus={event => show(set, event.currentTarget)} onBlur={closeSoon}
          onClick={() => onSelect(set.images.map(image => ({ ...image })))}>
          <span className="tryon-set-row">{set.images.map(image => <ProgressiveImage key={image.id} src={image.url} alt={image.name} />)}</span>
        </button>;
      })}
      {!visible.length && <p className="tryon-set-empty">{t.empty}</p>}
      <div className="tryon-set-customize"><p>{t.tip}</p><Button className="tryon-set-customize-link" onClick={() => notify(t.unavailable)}>{t.customize}</Button></div>
    </div>
    {preview.value && createPortal(<div className="tryon-set-preview" data-phase={preview.phase} role="region" aria-label={t.group} style={position} onMouseEnter={keepOpen} onMouseLeave={closeSoon}>
      {preview.value.set.images.map(image => <img key={image.id} src={image.url} alt={image.name} />)}
    </div>, document.body)}
  </div>;
}
