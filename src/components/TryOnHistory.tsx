import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Button, Dialog, Divider, Icon, type IconName } from './ui';
import { ProgressiveImage } from './ProgressiveImage';
import { FullImageViewer } from './FullImageViewer';
import { notify } from './Toast';
import { createTryOnDemoRecord, type TryOnRecord, type TryOnResult } from '../try-on-history';
import { downloadImages } from '../download-images';
import { usePresence } from '../usePresence';
import { messages, type Locale } from '../i18n';
import type { CanvasImage } from '../canvas';
import type { LibraryImage } from '../asset-library';
import './try-on-history.css';

const copy = {
  'zh-CN': { title: '生成记录', function: 'AI试衣', retention: '生成记录可存14天，到期后将被删除', clear: '全部清空', guide: '操作指南', empty: '还没有生成记录', regular: '常规模式', lingerie: '内衣模式', garments: '服装图', single: '单品', description: '描述生成', reference: '参考图', set: '模特套图', auto: '智能比例', fast: '快速', quality: '高质量', downloadGroup: '下载该组图片', edit: '编辑', retry: '重新生成', deleteGroup: '删除该组结果', download: '下载', favorite: '收藏', unfavorite: '取消收藏', delete: '删除', models: '模特企划库', video: '视频生成', imageEdit: '图片编辑', send: '发送至', failed: '生成失败', copy: '复制提示词', copied: '提示词已复制', copyError: '复制失败，请重试', downloadError: '下载失败，请重试', clearTitle: '清空生成记录', clearBody: '确定清空全部生成记录？清空后无法恢复。', cancel: '取消', confirm: '清空', unavailable: '此功能暂未接入，当前可演示生成记录操作。' },
  en: { title: 'Generation history', function: 'AI try-on', retention: 'Generation records expire after 14 days', clear: 'Clear all', guide: 'Guide', empty: 'No generations yet', regular: 'Regular', lingerie: 'Lingerie', garments: 'Garments', single: 'Garment', description: 'Description', reference: 'Reference', set: 'Model set', auto: 'Auto ratio', fast: 'Fast', quality: 'Quality', downloadGroup: 'Download group', edit: 'Edit', retry: 'Regenerate', deleteGroup: 'Delete group', download: 'Download', favorite: 'Favorite', unfavorite: 'Unfavorite', delete: 'Delete', models: 'Model library', video: 'Generate video', imageEdit: 'Edit image', send: 'Send to', failed: 'Generation failed', copy: 'Copy prompt', copied: 'Prompt copied', copyError: 'Copy failed. Try again.', downloadError: 'Download failed. Try again.', clearTitle: 'Clear generation history', clearBody: 'Clear all generation records? This cannot be undone.', cancel: 'Cancel', confirm: 'Clear', unavailable: 'This feature is not connected in the demo.' },
  ja: { title: '生成履歴', function: 'AI試着', retention: '生成履歴は14日後に削除されます', clear: 'すべてクリア', guide: '操作ガイド', empty: '生成履歴はありません', regular: '通常モード', lingerie: '下着モード', garments: '衣服画像', single: '単品', description: '説明から生成', reference: '参考画像', set: 'モデル画像集', auto: '自動比率', fast: '高速', quality: '高品質', downloadGroup: 'グループをダウンロード', edit: '編集', retry: '再生成', deleteGroup: 'グループを削除', download: 'ダウンロード', favorite: 'お気に入り', unfavorite: 'お気に入りを解除', delete: '削除', models: 'モデルライブラリ', video: '動画生成', imageEdit: '画像編集', send: '送信先', failed: '生成に失敗しました', copy: 'プロンプトをコピー', copied: 'コピーしました', copyError: 'コピーに失敗しました', downloadError: 'ダウンロードに失敗しました', clearTitle: '生成履歴をクリア', clearBody: 'すべての生成履歴を削除しますか？元に戻せません。', cancel: 'キャンセル', confirm: 'クリア', unavailable: 'この機能はデモに接続されていません。' },
};
type Props = { active: boolean; locale: Locale; records: TryOnRecord[]; onChange: Dispatch<SetStateAction<TryOnRecord[]>>; onEdit: (record: TryOnRecord) => void; onGuide: () => void };
function ImageTag({ label, images }: { label: string; images: LibraryImage[] }) {
  return <span className="tryon-record-tag"><span className="tryon-record-thumbs">{images.map((image, index) => <ProgressiveImage key={`${image.id}-${index}`} src={image.url} alt={image.name} />)}</span>{label}</span>;
}
export function TryOnHistory({ active, locale, records, onChange, onEdit, onGuide }: Props) {
  const t = copy[locale], common = messages[locale];
  const [preview, setPreview] = useState<CanvasImage | null>(null), shownPreview = usePresence(active ? preview : null);
  const [clear, setClear] = useState(false), shownClear = usePresence(active && clear ? true : null);
  const [downloading, setDownloading] = useState(false), downloadLock = useRef(false);
  const content = useRef<HTMLDivElement>(null), firstId = useRef(records[0]?.id);
  useEffect(() => { if (!active) { setPreview(null); setClear(false); } }, [active]);
  useEffect(() => { if (records[0]?.id !== firstId.current) { content.current?.scrollTo({ top: 0 }); firstId.current = records[0]?.id; } }, [records]);
  const removeRecord = (id: string) => onChange(previous => previous.filter(record => record.id !== id));
  function changeResult(recordId: string, resultId: string, patch: Partial<TryOnResult> | null) {
    onChange(previous => previous.map(record => record.id !== recordId ? record : { ...record, results: record.results.flatMap(result => result.id !== resultId ? [result] : patch === null ? [] : [{ ...result, ...patch }]) }).filter(record => record.results.length));
  }
  function regenerate(record: TryOnRecord, single?: TryOnResult) {
    const next = createTryOnDemoRecord(record.draft, record.mode);
    if (single) next.results = [{ ...single, id: crypto.randomUUID(), failed: false, favorite: false }];
    onChange(previous => [next, ...previous]);
  }
  async function download(results: TryOnResult[], id: string) {
    if (downloadLock.current) return;
    downloadLock.current = true; setDownloading(true);
    try { await downloadImages(results.filter(result => !result.failed).map((result, i) => ({ url: result.url, name: `AI-try-on-${i + 1}.png` })), `AI-try-on-${id}.zip`); }
    catch { notify(t.downloadError); }
    finally { downloadLock.current = false; setDownloading(false); }
  }
  function showImage(result: TryOnResult) { setPreview({ ...result, name: t.function, x: 0, y: 0 }); }
  async function copyPrompt(value: string) { try { await navigator.clipboard.writeText(value); notify(t.copied); } catch { notify(t.copyError); } }
  const action = (label: string, icon: IconName, onClick: () => void, disabled = false, pressed?: boolean) => <Button className="tryon-record-action" aria-label={label} disabled={disabled} aria-pressed={pressed} onClick={onClick}><Icon name={icon} size={20} /></Button>;
  return <main className="tryon-history">
    <header><div className="tryon-history-title"><h2>{t.title}</h2><Button className="tryon-info" aria-label={t.retention}><Icon name="tryOnInfo" size={16} /></Button></div><Divider vertical /><Button icon="promptTrash" disabled={!records.length} onClick={() => setClear(true)}>{t.clear}</Button><Button icon="guideIcon" className="tryon-guide" onClick={onGuide}>{t.guide}</Button></header>
    <div ref={content} className={`tryon-history-content${records.length ? ' has-records' : ''}`}>
      {records.length ? <div className="tryon-record-list" data-node-id="254:7720">{records.map(record => <article className="tryon-record" key={record.id}>
        <header className="tryon-record-header"><span className="tryon-record-title">{t.function}<time dateTime={new Date(record.createdAt).toISOString()}>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(record.createdAt)}</time></span><Divider vertical />
          <div className="tryon-record-tags"><span className="tryon-record-tag">{t[record.mode]}</span><ImageTag label={record.draft.garments.length === 1 ? t.single : t.garments} images={record.draft.garments} />
            {record.draft.source === 'description' ? <span className="tryon-record-tag">{t.description}</span> : <ImageTag label={t[record.draft.source]} images={record.draft.source === 'reference' ? record.draft.references : record.draft.models} />}
            <span className="tryon-record-tag">{record.draft.ratio === 'auto' ? t.auto : record.draft.ratio}</span><span className="tryon-record-tag">{record.draft.speed === 'quality' ? t.quality : t.fast}</span></div>
          <div className="tryon-record-actions">{action(t.downloadGroup, 'historyDownload', () => void download(record.results, record.id), downloading || record.results.every(result => result.failed))}{action(t.edit, 'historyEdit', () => onEdit(record))}{action(t.retry, 'historyRetry', () => regenerate(record))}{action(t.deleteGroup, 'historyTrash', () => removeRecord(record.id))}</div>
        </header>
        {record.draft.source === 'description' && record.draft.prompt && <div className="tryon-record-description"><p>{record.draft.prompt}</p><Button icon="historyCopy" className="tryon-record-copy" onClick={() => void copyPrompt(record.draft.prompt)}>{t.copy}</Button></div>}
        <div className="tryon-results">{record.results.map(result => <div key={result.id} className={`tryon-result${result.failed ? ' is-failed' : ''}`} style={{ aspectRatio: result.aspectRatio }}>
          {result.failed ? <div className="tryon-result-failure" data-node-id="254:8249"><div className="tryon-failure-content"><span className="tryon-failure-art" aria-hidden="true"><img src="/assets/try-on/history/failed.png" alt="" width={227} height={215} /></span><span>{t.failed}</span></div></div> : <><button className="tryon-result-preview" aria-label={common.viewFull} onClick={() => showImage(result)}><ProgressiveImage src={result.url} alt={t.function} /></button><img className="tryon-result-watermark" src="/assets/try-on/history/watermark.png" alt="" /></>}
          {!result.failed && <div className="tryon-result-top">{action(t.retry, 'historyRetry', () => regenerate(record, result))}{action(t.download, 'historyDownload', () => void download([result], result.id), downloading)}{action(result.favorite ? t.unfavorite : t.favorite, 'historyFavorite', () => changeResult(record.id, result.id, { favorite: !result.favorite }), false, !!result.favorite)}{action(t.delete, 'historyTrash', () => changeResult(record.id, result.id, null))}</div>}
          {!result.failed && <div className="tryon-result-bottom">{action(t.models, 'historyModels', () => notify(t.unavailable))}{action(t.video, 'historyVideo', () => notify(t.unavailable))}{action(t.imageEdit, 'historyImageEdit', () => notify(t.unavailable))}{action(t.send, 'historySend', () => notify(t.unavailable))}</div>}
        </div>)}</div>
      </article>)}</div> : <div className="tryon-history-empty"><img src="/assets/try-on/empty-model.png" alt="" width={128} height={128} /><h3>{t.empty}</h3><p>{t.retention}</p></div>}
    </div>
    {shownPreview.value && <FullImageViewer key={shownPreview.value.id} image={shownPreview.value} locale={locale} phase={shownPreview.phase} onClose={() => setPreview(null)} />}
    {shownClear.value && <Dialog title={t.clearTitle} closeLabel={common.close} phase={shownClear.phase} onClose={() => setClear(false)}><p>{t.clearBody}</p><div className="tryon-clear-actions"><Button variant="secondary" onClick={() => setClear(false)}>{t.cancel}</Button><Button variant="primary" onClick={() => { onChange([]); setClear(false); }}>{t.confirm}</Button></div></Dialog>}
  </main>;
}
