import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { AssetPicker } from './AssetPicker';
import { Button, Dialog, Divider, Icon } from './ui';
import { ProgressiveImage } from './ProgressiveImage';
import { SettingSelect } from './SettingSelect';
import { GenerateTaskButton } from './GenerateTaskButton';
import { TryOnModeSwitch, type TryOnMode } from './TryOnModeSwitch';
import { notify } from './Toast';
import { readImage } from '../canvas';
import type { LibraryImage } from '../asset-library';
import { messages, type Locale } from '../i18n';
import { usePresence } from '../usePresence';
import { TryOnReferenceCards, type ReferenceTarget } from './TryOnReferenceCards';
import { TryOnModelSets } from './TryOnModelSets';
import { TryOnHistory } from './TryOnHistory';
import { createTryOnDemoRecord, emptyTryOnDraft, initialTryOnHistory, type TryOnDraft as Draft } from '../try-on-history';
import '../try-on.css';

const copy = {
  'zh-CN': { title: 'AI 试衣', single: '单任务', multi: '多任务', taskMode: '任务类型', garments: '服装图', flatten: '自动转为服装平铺图', upload: '上传服装图', more: '继续上传', drop: '点击/拖放到此处', choose: '请选择', category: '服装类型', categories: ['上装', '下装', '连身装', '不处理'], description: '描述生成', reference: '参考图', set: '模特套图', modelSource: '模特来源', placeholder: '请描述模特外貌、姿势及试衣场景', expand: '提示词扩写', expansionUnavailable: '提示词扩写服务暂未接入', imagePrompt: '图片反推提示词', copy: '复制提示词', clear: '清空', save: '保存提示词', library: '提示词库', ratio: '图片比例', smart: '智能', speed: '生成模式', fast: '快速', quality: '高质量', generate: '开始 AI 生成', history: '生成记录', clearAll: '全部清空', guide: '操作指南', empty: '还没有生成记录', retention: '生成记录可存14天，到期后将被删除', addReference: '添加模特参考图', addSet: '添加模特套图', remove: '移除图片', limit: '服装图最多支持 4 张，请减少选择数量后重试。', modelLimit: '模特套图最多支持 4 张。', needGarment: '请先添加服装图', needCategory: '请为每张服装图选择类型', needPrompt: '请输入试衣描述', needModel: '请先添加模特图', copied: '提示词已复制', copyFailed: '复制失败，请手动选中文字复制', guideSteps: ['添加服装图并选择服装类型，最多 4 张。', '选择常规或内衣模式，填写试衣描述或添加模特参考图。', '单任务组合当前服装；多任务为各张服装分别配置生成。', '选择图片比例和生成模式，再点击开始 AI 生成。'], backend: '当前为本地交互演示，AI 试衣尚未接入生成服务。' },
  en: { title: 'AI try-on', single: 'Single', multi: 'Multiple', taskMode: 'Task type', garments: 'Garment images', flatten: 'Auto-convert to flat-lay', upload: 'Upload garments', more: 'Upload more', drop: 'Click or drop here', choose: 'Select type', category: 'Garment type', categories: ['Top', 'Bottom', 'One-piece', 'Do not process'], description: 'Description', reference: 'Reference', set: 'Model set', modelSource: 'Model source', placeholder: 'Describe the model, pose and setting', expand: 'Expand prompt', expansionUnavailable: 'Prompt expansion is not connected yet', imagePrompt: 'Image to prompt', copy: 'Copy prompt', clear: 'Clear', save: 'Save prompt', library: 'Prompt library', ratio: 'Aspect ratio', smart: 'Auto', speed: 'Generation mode', fast: 'Fast', quality: 'Quality', generate: 'Generate', history: 'Generation history', clearAll: 'Clear all', guide: 'Guide', empty: 'No generations yet', retention: 'Generation records expire after 14 days', addReference: 'Add model reference', addSet: 'Add model images', remove: 'Remove image', limit: 'Choose up to 4 garment images.', modelLimit: 'Choose up to 4 model images.', needGarment: 'Add a garment image first', needCategory: 'Select a type for each garment', needPrompt: 'Enter a try-on description', needModel: 'Add a model image first', copied: 'Prompt copied', copyFailed: 'Copy failed. Select and copy the text manually.', guideSteps: ['Add up to 4 garment images and select their types.', 'Choose Regular or Lingerie and add a description or model reference.', 'Single combines garments; Multiple configures separate generations.', 'Choose your settings, then select Generate.'], backend: 'This local demo is not connected to the AI try-on service.' },
  ja: { title: 'AI 試着', single: '単一', multi: '複数', taskMode: 'タスク種別', garments: '衣服画像', flatten: '平置き画像に自動変換', upload: '衣服画像を追加', more: '追加アップロード', drop: 'クリック／ドロップ', choose: '選択してください', category: '衣服の種類', categories: ['トップス', 'ボトムス', 'ワンピース', '処理しない'], description: '説明から生成', reference: '参考画像', set: 'モデル画像集', modelSource: 'モデルの指定', placeholder: 'モデルの外見、ポーズ、シーンを入力', expand: 'プロンプトを拡張', expansionUnavailable: 'プロンプト拡張サービスは未接続です', imagePrompt: '画像からプロンプト', copy: 'プロンプトをコピー', clear: 'クリア', save: 'プロンプトを保存', library: 'プロンプト集', ratio: '画像比率', smart: '自動', speed: '生成モード', fast: '高速', quality: '高品質', generate: 'AI 生成を開始', history: '生成履歴', clearAll: 'すべてクリア', guide: '操作ガイド', empty: '生成履歴はありません', retention: '生成履歴は14日後に削除されます', addReference: 'モデル参考画像を追加', addSet: 'モデル画像集を追加', remove: '画像を削除', limit: '衣服画像は4枚までです。', modelLimit: 'モデル画像は4枚までです。', needGarment: '衣服画像を追加してください', needCategory: '衣服の種類を選択してください', needPrompt: '試着の説明を入力してください', needModel: 'モデル画像を追加してください', copied: 'コピーしました', copyFailed: 'コピーできませんでした。手動でコピーしてください。', guideSteps: ['衣服画像を4枚まで追加し、種類を選びます。', '通常または下着モードを選び、説明や参考画像を追加します。', '単一は衣服を組み合わせ、複数は個別に生成を設定します。', '画像比率とモードを選び、生成を開始します。'], backend: 'このデモはAI試着サービスに接続されていません。' },
};
const garmentCopy = {
  'zh-CN': { upload: '支持上传多件穿搭', drop: '点击/拖放到此处添加单品', required: '必填', example: '示例图', previous: '上一次使用的服装图', reuse: '再次使用', mask: '涂抹蒙版', delete: '删除', maskPending: '涂抹蒙版编辑暂未接入' },
  en: { upload: 'Upload multiple garments', drop: 'Click or drop garments here', required: 'Required', example: 'Example', previous: 'Previously used garments', reuse: 'Use again', mask: 'Paint mask', delete: 'Delete', maskPending: 'Mask editing is not connected yet.' },
  ja: { upload: '複数の衣服をアップロード', drop: 'クリック／ドロップで追加', required: '必須', example: 'サンプル', previous: '前回使用した衣服画像', reuse: '再利用', mask: 'マスクを描画', delete: '削除', maskPending: 'マスク編集は未接続です。' },
};
type ModelSource = 'description' | 'reference' | 'set';
type Picker = { mode: TryOnMode; target: 'garments' | 'models' | ReferenceTarget };

export function AiTryOnPage({ active, locale, uploads, onUpload }: { active: boolean; locale: Locale; uploads: LibraryImage[]; onUpload: (image: LibraryImage) => void }) {
  const t = copy[locale], common = messages[locale];
  const [mode, setMode] = useState<TryOnMode>('regular');
  const [drafts, setDrafts] = useState<Record<TryOnMode, Draft>>(() => ({ regular: emptyTryOnDraft(), lingerie: emptyTryOnDraft() }));
  const draft = drafts[mode], garmentText = garmentCopy[locale];
  const [lastGarments, setLastGarments] = useState<Record<TryOnMode, Draft['garments']>>({ regular: [], lingerie: [] });
  const previousGarments = useRef<Record<TryOnMode, Draft['garments']>>({ regular: [], lingerie: [] });
  useEffect(() => {
    const previous = previousGarments.current[mode];
    const current = draft.garments;
    // Removing images must not overwrite the last complete selection.
    const removalOnly = current.length < previous.length && current.every(image => previous.some(item => item.id === image.id));
    if (current.length && !removalOnly && current !== previous) {
      setLastGarments(saved => ({ ...saved, [mode]: structuredClone(current) }));
    }
    previousGarments.current[mode] = current;
  }, [mode, draft.garments]);
  const reusableGarments = lastGarments[mode];
  const [history, setHistory] = useState(initialTryOnHistory);
  const [picker, setPicker] = useState<Picker | null>(null), shownPicker = usePresence(active ? picker : null);
  const [guide, setGuide] = useState(false), shownGuide = usePresence(active && guide ? true : null);
  const [over, setOver] = useState(false), [reading, setReading] = useState(false);
  const locked = useRef(false), epoch = useRef(0), prompt = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { epoch.current++; locked.current = false; setReading(false); setOver(false); setPicker(null); setGuide(false); return () => { epoch.current++; }; }, [active, mode]);
  function update(patch: Partial<Draft>, targetMode = mode) { setDrafts(previous => ({ ...previous, [targetMode]: { ...previous[targetMode], ...patch } })); }
  function add(items: LibraryImage[], target: Picker) {
    setDrafts(previous => {
      const current = previous[target.mode];
      const single = target.target !== 'garments' && target.target !== 'models';
      const all = [...(single ? [] : current[target.target]), ...items].filter((image, i, list) => list.findIndex(item => item.url === image.url) === i);
      const limit = single ? 1 : 4;
      if (all.length > limit) return previous;
      return { ...previous, [target.mode]: { ...current, [target.target]: target.target === 'garments' ? all.map(item => ({ ...item, category: current.garments.find(existing => existing.id === item.id)?.category ?? '' })) : all } };
    });
  }
  async function dropFiles(event: DragEvent) {
    event.preventDefault(); setOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (!files.length || locked.current) return;
    if (draft.garments.length + files.length > 4) { notify(t.limit); return; }
    locked.current = true; setReading(true); const request = ++epoch.current, targetMode = mode;
    const results = await Promise.allSettled(files.map(readImage));
    const loaded = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    if (request !== epoch.current) { loaded.forEach(image => URL.revokeObjectURL(image.url)); return; }
    loaded.forEach(onUpload); add(loaded, { mode: targetMode, target: 'garments' });
    if (results.some(result => result.status === 'rejected')) notify(common.uploadError);
    locked.current = false; setReading(false);
  }
  function selectTab(event: KeyboardEvent, values: string[], current: string, change: (value: string) => void) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const i = values.indexOf(current);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + values.length) % values.length;
    change(values[next]); (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next])?.focus();
  }
  async function copyPrompt() {
    if (!draft.prompt.trim()) { notify(t.needPrompt); return; }
    try { await navigator.clipboard.writeText(draft.prompt); notify(t.copied); } catch { notify(t.copyFailed); }
  }
  function generate() {
    if (!draft.garments.length) { notify(t.needGarment); return; }
    if (draft.flatten && draft.garments.some(image => !image.category)) { notify(t.needCategory); return; }
    if (draft.source === 'description' && !draft.prompt.trim()) { notify(t.needPrompt); prompt.current?.focus(); return; }
    if (draft.source !== 'description' && !(draft.source === 'reference' ? draft.references : draft.models).length) { notify(t.needModel); return; }
    setHistory(previous => [createTryOnDemoRecord(draft, mode), ...previous]);
  }
  const pickingDraft = shownPicker.value ? drafts[shownPicker.value.mode] : null;
  const pickedImages = shownPicker.value && pickingDraft ? pickingDraft[shownPicker.value.target] : [];
  const categories = ['top', 'bottom', 'one-piece', 'skip'];
  return <section className="tryon-page" hidden={!active} inert={!active} aria-label={t.title} data-node-id="136:12198">
    <aside className="tryon-sidebar">
      <header className="tryon-sidebar-header"><div className="tryon-heading"><h1>{t.title}</h1><TryOnModeSwitch active={active} value={mode} locale={locale} onChange={setMode} /></div>
        <div className="tryon-task-tabs" role="tablist" aria-label={t.taskMode}>
          {(['single', 'multi'] as const).map(task => <button key={task} type="button" role="tab" aria-selected={draft.task === task} tabIndex={draft.task === task ? 0 : -1} onClick={() => update({ task })} onKeyDown={event => selectTab(event, ['single', 'multi'], task, value => update({ task: value as Draft['task'] }))}>{t[task]}</button>)}
        </div>
      </header>
      <div className="tryon-form" id="tryon-form" role="tabpanel" aria-labelledby={`tryon-mode-${mode}`}>
        <section className="tryon-garments" aria-label={t.garments}>
          <div className="tryon-garment-heading"><h2>{t.garments}（{draft.garments.length}/4）</h2><div className="tryon-flatten"><span id="tryon-flatten-label">{t.flatten}</span><button type="button" role="switch" aria-checked={draft.flatten} aria-labelledby="tryon-flatten-label" onClick={() => update({ flatten: !draft.flatten })}><span /></button></div></div>
          <div className={`tryon-garment-grid${draft.garments.length === 0 ? ' is-empty' : ''}${draft.flatten ? ' has-garment-types' : ''}${over ? ' is-dragging-over' : ''}`} aria-busy={reading} onDragOver={event => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setOver(true); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }} onDrop={event => void dropFiles(event)}>
            {draft.garments.map(image => <div className="tryon-garment-card" key={image.id}>
              <div className="tryon-garment-image"><ProgressiveImage src={image.url} alt={image.name} />
                <div className="tryon-garment-actions">
                  <Button variant="tonal" aria-label={garmentText.mask} onClick={() => notify(garmentText.maskPending)}><Icon name="fusionBrush" size={20} /></Button>
                  <Button variant="tonal" aria-label={garmentText.delete} onClick={() => update({ garments: draft.garments.filter(item => item.id !== image.id) })}><Icon name="contextTrash" size={20} /></Button>
                </div>
              </div>
              {draft.flatten && <SettingSelect label={`${t.category} · ${image.name}`} value={image.category} placeholder={t.choose} options={categories.map((value, index) => ({ value, label: t.categories[index] }))} onChange={category => update({ garments: draft.garments.map(item => item.id === image.id ? { ...item, category } : item) })} />}
            </div>)}
            {draft.garments.length < 4 && <button type="button" className="tryon-upload" disabled={reading} onClick={() => setPicker({ mode, target: 'garments' })}><Icon name="fusionAddImage" size={32} /><strong>{reading ? common.reading : draft.garments.length ? t.more : garmentText.upload}</strong><span>{draft.garments.length ? t.drop : garmentText.drop}</span>{!draft.garments.length && <span className="tryon-required">{garmentText.required}</span>}</button>}
            {!draft.garments.length && <>
              <Divider vertical />
              <div className={`tryon-garment-example${reusableGarments.length ? ' has-previous' : ''}`}>
                <video className="tryon-example-art" src="/assets/try-on/single-item-60fps.mp4" poster="/assets/try-on/garment-example.png" aria-label={garmentText.example} autoPlay loop muted playsInline />
                <span className="tryon-example-label">{garmentText.example}</span>
                {reusableGarments.length > 0 && <div className="tryon-previous-garments">
                  <div className="tryon-previous-images" data-count={reusableGarments.length} aria-label={garmentText.previous}>
                    {reusableGarments.map(image => <ProgressiveImage key={image.id} src={image.url} alt={image.name} />)}
                  </div>
                  <Button variant="tonal" className="tryon-reuse" disabled={reading} onClick={() => update({ garments: structuredClone(reusableGarments) })}>{garmentText.reuse}</Button>
                </div>}
              </div>
            </>}
          </div>
        </section>
        <Divider />
        <section className="tryon-model" aria-label={t.modelSource}>
          <div className="tryon-source-tabs" role="tablist" aria-label={t.modelSource}>
            {(['description', 'reference', 'set'] as const).map(source => <button key={source} type="button" role="tab" id={`tryon-source-${source}`} aria-controls={`tryon-content-${source}`} aria-selected={draft.source === source} tabIndex={draft.source === source ? 0 : -1} onClick={() => update({ source })} onKeyDown={event => selectTab(event, ['description', 'reference', 'set'], source, value => update({ source: value as ModelSource }))}>{t[source]}</button>)}
          </div>
          <div className="tryon-model-content" role="tabpanel" id={`tryon-content-${draft.source}`} aria-labelledby={`tryon-source-${draft.source}`}>
            {draft.source === 'description' ? <div className="tryon-description">
              <textarea ref={prompt} aria-label={t.description} placeholder={t.placeholder} value={draft.prompt} maxLength={2000} onChange={event => update({ prompt: event.target.value })} />
              <footer className="tryon-prompt-footer"><div className="tryon-prompt-actions"><Button aria-label={t.expand} disabled={!draft.prompt.trim()} onClick={() => notify(t.expansionUnavailable)}><Icon name="promptEdit" size={20} /></Button><Button aria-label={t.imagePrompt} onClick={() => notify(t.backend)}><Icon name="tryOnImagePrompt" size={20} /></Button><Button aria-label={t.copy} onClick={() => void copyPrompt()}><Icon name="tryOnCopyPrompt" size={20} /></Button></div><Divider vertical /><span className="tryon-counter">{draft.prompt.length}/2000</span><Button className="tryon-clear" aria-label={t.clear} disabled={!draft.prompt} onClick={() => update({ prompt: '' })}><Icon name="cutoutClear" size={16} /></Button></footer>
            </div> : draft.source === 'reference' ? <TryOnReferenceCards key={mode} locale={locale} images={{ references: draft.references, poses: draft.poses ?? [], backgrounds: draft.backgrounds ?? [] }} onUpload={onUpload} onPick={target => setPicker({ mode, target })} onChange={(target, images) => update({ [target]: images })} /> : <TryOnModelSets active={active} key={mode} locale={locale} selected={draft.models} onSelect={models => update({ models })} />}
          </div>
        </section>
      </div>
      <footer className="tryon-generate-footer"><SettingSelect label={t.ratio} icon="fusionRatio" value={draft.ratio} options={['auto', '1:1', '3:4', '4:3', '9:16', '16:9', '21:9'].map(value => ({ value, label: value === 'auto' ? t.smart : value }))} onChange={ratio => update({ ratio })} /><SettingSelect label={t.speed} icon="tryOnLightning" value={draft.speed} options={[{ value: 'fast', label: t.fast }, { value: 'quality', label: t.quality }]} onChange={speed => update({ speed })} /><GenerateTaskButton label={t.generate} cost="99" onClick={generate} /></footer>
    </aside>
    <TryOnHistory active={active} locale={locale} records={history} onChange={setHistory} onGuide={() => setGuide(true)} onEdit={record => {
      setMode(record.mode); setDrafts(previous => ({ ...previous, [record.mode]: structuredClone(record.draft) }));
      document.getElementById('tryon-form')?.scrollTo({ top: 0 });
    }} />
    {shownPicker.value && <AssetPicker key={`${shownPicker.value.mode}:${shownPicker.value.target}`} locale={locale} phase={shownPicker.phase} uploads={uploads} onUpload={onUpload} maxCount={shownPicker.value.target === 'garments' || shownPicker.value.target === 'models' ? 4 - pickedImages.length : 1} excludedUrls={pickedImages.map(image => image.url)} limitMessage={shownPicker.value.target === 'garments' ? t.limit : t.modelLimit} onClose={() => setPicker(null)} onConfirm={image => { add([image], shownPicker.value!); setPicker(null); }} onConfirmBatch={shownPicker.value.target !== 'garments' && shownPicker.value.target !== 'models' ? undefined : items => { add(items, shownPicker.value!); setPicker(null); }} />}
    {shownGuide.value && <Dialog title={t.guide} closeLabel={common.close} phase={shownGuide.phase} onClose={() => setGuide(false)}><ol className="tryon-guide-steps">{t.guideSteps.map(step => <li key={step}>{step}</li>)}</ol><p className="tryon-guide-note">{t.backend}</p></Dialog>}
  </section>;
}
