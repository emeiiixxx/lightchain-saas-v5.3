import type { LibraryImage } from './asset-library';
import type { TryOnMode } from './components/TryOnModeSwitch';

export type ModelSource = 'description' | 'reference' | 'set';
export type Garment = LibraryImage & { category: string };
export type TryOnDraft = { garments: Garment[]; flatten: boolean; task: 'single' | 'multi'; source: ModelSource; prompt: string; references: LibraryImage[]; poses: LibraryImage[]; backgrounds: LibraryImage[]; models: LibraryImage[]; ratio: string; speed: string };
export type TryOnResult = { id: string; url: string; width: number; height: number; aspectRatio: string; failed?: boolean; favorite?: boolean };
export type TryOnRecord = { id: string; createdAt: number; mode: TryOnMode; draft: TryOnDraft; results: TryOnResult[] };
export const emptyTryOnDraft = (): TryOnDraft => ({ garments: [], flatten: false, task: 'single', source: 'description', prompt: '', references: [], poses: [], backgrounds: [], models: [], ratio: 'auto', speed: 'fast' });
const image = (name: string): LibraryImage => ({ id: `tryon-demo-${name}`, name, url: `/assets/try-on/history/${name}.png` });
const dimensions: Record<string, [number, number]> = {
  'lingerie-purple': [793, 1062], 'lingerie-yellow': [794, 1064],
  'regular-1': [1024, 1536], 'regular-2': [1024, 1536], 'regular-3': [1024, 1536], 'regular-4': [1024, 1536],
  'regular-5': [2048, 2048], landscape: [2730, 1535],
};
const result = (name: string, index: number, wide = false): TryOnResult => ({ id: `${name}-${index}`, url: image(name).url, width: dimensions[name][0], height: dimensions[name][1], aspectRatio: wide ? '21 / 9' : '3 / 4' });

// Figma 254:7720 review fixtures. Separate from the user's empty input drafts.
// History is session-only; no AI requests, billing or account history writes.
export function initialTryOnHistory(): TryOnRecord[] {
  const now = Date.now();
  const garments = Array.from({ length: 4 }, (_, i) => ({ ...image('garment'), id: `demo-garment-${i}`, category: 'one-piece' }));
  const models = [image('model'), ...garments.slice(1)];
  return [
    { id: 'tryon-demo-lingerie', createdAt: now, mode: 'lingerie', draft: { ...emptyTryOnDraft(), garments, source: 'set', models }, results: [result('lingerie-purple', 0), result('lingerie-yellow', 1), { ...result('lingerie-yellow', 2), failed: true }, result('lingerie-yellow', 3)] },
    { id: 'tryon-demo-description', createdAt: now - 60000, mode: 'regular', draft: { ...emptyTryOnDraft(), garments: garments.slice(0, 2), prompt: '自然光下的度假穿搭，模特姿态自然放松，背景为浅色建筑与海岸，保留服装的版型、材质和细节。' }, results: [1, 2, 3, 4].map((n, i) => result(`regular-${n}`, i)) },
    { id: 'tryon-demo-regular', createdAt: now - 120000, mode: 'regular', draft: { ...emptyTryOnDraft(), garments }, results: Array.from({ length: 4 }, (_, i) => result('regular-5', i)) },
    { id: 'tryon-demo-landscape', createdAt: now - 180000, mode: 'regular', draft: { ...emptyTryOnDraft(), garments: [{ ...image('single-garment'), category: 'top' }], source: 'reference', references: [image('reference')], ratio: '21:9' }, results: Array.from({ length: 4 }, (_, i) => result('landscape', i, true)) },
  ];
}
export function createTryOnDemoRecord(draft: TryOnDraft, mode: TryOnMode): TryOnRecord {
  const id = crypto.randomUUID();
  const wide = ['21:9', '16:9'].includes(draft.ratio);
  const names = wide ? ['landscape'] : mode === 'lingerie' ? ['lingerie-purple', 'lingerie-yellow'] : ['regular-1', 'regular-2', 'regular-3', 'regular-4'];
  return { id, createdAt: Date.now(), mode, draft: structuredClone(draft), results: Array.from({ length: 4 }, (_, i) => ({ ...result(names[i % names.length], i, wide), id: `${id}-${i}`, aspectRatio: draft.ratio === 'auto' ? '3 / 4' : draft.ratio.replace(':', ' / ') })) };
}
