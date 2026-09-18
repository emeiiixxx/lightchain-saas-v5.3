import { ProgressiveImage } from './ProgressiveImage';
import { PromptTools } from './PromptTools';
import { useEffect, useId, useRef, useState } from 'react';
import { assets } from '../assets';
import { fusionReferences, workflowReferenceLimit, type CanvasImage, type FusionSettings } from '../canvas';
import { ReferenceSourceMenu } from './ReferenceSourceMenu';
import { GenerateTaskButton } from './GenerateTaskButton';
import type { Locale } from '../i18n';
import { Button, Divider, Icon } from './ui';
import { SettingSelect } from './SettingSelect';

const copy = {
  'zh-CN': { title: '一键融合', tip: '可通过指令和参考图一键融合', main: '主图', mask: '添加示意', reference: '参考图', add: '添加参考图', canvas: '从画布中选择', replace: '替换参考图', remove: '移除参考图', prompt: '融合指令', placeholder: '请输入融合指令', expand: '展开编辑', save: '保存指令', library: '提示词库', count: '字数', clear: '清空', settings: '生成设置', ratio: '图片比例', auto: '自动', resolution: '分辨率', generate: '开始 AI 生成', required: '请输入融合指令', saved: '指令已保存', empty: '暂无保存的指令', close: '关闭', done: '完成' },
  en: { title: 'Instant fusion', tip: 'Fuse with a prompt and reference image', main: 'Main image', mask: 'Edit mask', reference: 'Reference image', add: 'Add reference', canvas: 'Choose from canvas', replace: 'Replace reference', remove: 'Remove reference', prompt: 'Fusion prompt', placeholder: 'Enter a fusion prompt', expand: 'Expand editor', save: 'Save prompt', library: 'Prompt library', count: 'Characters', clear: 'Clear', settings: 'Generation settings', ratio: 'Aspect ratio', auto: 'Auto', resolution: 'Resolution', generate: 'Start AI generation', required: 'Enter a fusion prompt', saved: 'Prompt saved', empty: 'No saved prompts', close: 'Close', done: 'Done' },
  ja: { title: 'ワンクリック融合', tip: '指示と参考画像でワンクリック融合', main: 'メイン画像', mask: 'マスク編集', reference: '参考画像', add: '参考画像を追加', canvas: 'キャンバスから選択', replace: '参考画像を変更', remove: '参考画像を削除', prompt: '融合の指示', placeholder: '融合の指示を入力', expand: '拡大編集', save: '指示を保存', library: 'プロンプト集', count: '文字数', clear: 'クリア', settings: '生成設定', ratio: '画像比率', auto: '自動', resolution: '解像度', generate: 'AI 生成を開始', required: '融合の指示を入力してください', saved: '指示を保存しました', empty: '保存した指示はありません', close: '閉じる', done: '完了' },
};


const lingerieCopy = {
  'zh-CN': { title: '内衣试衣', tip: '内衣专用AI试衣工具', main: '服装图', addMain: '添加服装图', reference: '模特图', add: '添加模特图', remove: '移除模特图', prompt: '试衣描述', placeholder: '请输入试衣描述', required: '请输入试衣描述' },
  en: { title: 'Lingerie try-on', tip: 'AI try-on for lingerie', main: 'Garment image', addMain: 'Add garment image', reference: 'Model image', add: 'Add model image', remove: 'Remove model image', prompt: 'Try-on description', placeholder: 'Enter a try-on description', required: 'Enter a try-on description' },
  ja: { title: '下着試着', tip: '下着専用AI試着ツール', main: '衣服画像', addMain: '衣服画像を追加', reference: 'モデル画像', add: 'モデル画像を追加', remove: 'モデル画像を削除', prompt: '試着の説明', placeholder: '試着の説明を入力', required: '試着の説明を入力してください' },
};

const mergeCopy = {
  'zh-CN': { title: '合拼生图', tip: '上传多张参考图,合并生成新图', uploaded: '最多4张，已上传' },
  en: { title: 'Merge & generate', tip: 'Combine reference images into a new image', uploaded: 'Up to 4, added' },
  ja: { title: '結合して生成', tip: '複数の参考画像を結合して新しい画像を生成', uploaded: '最大4枚、追加済み' },
};

type Props = { image: CanvasImage; locale: Locale; onChange: (patch: Partial<FusionSettings>) => void; onAddMain: () => void; onReference: (source: 'upload' | 'canvas') => void; onDemo: () => void; onGenerate: () => void };
export function FusionNode({ image, locale, onChange, onAddMain, onReference, onDemo, onGenerate }: Props) {
  const settings = image.fusion!;
  const lingerie = settings.kind === 'lingerie';
  const merge = settings.kind === 'merge';
  const t = merge ? { ...copy[locale], ...mergeCopy[locale] } : lingerie ? { ...copy[locale], ...lingerieCopy[locale] } : copy[locale];
  const referenceLimit = workflowReferenceLimit(settings);
  const references = fusionReferences(settings);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLElement>(null);
  const [error, setError] = useState(false);
  const promptId = useId();
  useEffect(() => {
    const blur = (event: PointerEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement && root.current?.contains(active) && event.target !== active) active.blur();
    };
    document.addEventListener('pointerdown', blur, true);
    return () => document.removeEventListener('pointerdown', blur, true);
  }, []);
  useEffect(() => { if (image.nodeOnly) setError(false); }, [image.nodeOnly]);
  function updatePrompt(value: string) { onChange({ prompt: value.slice(0, 2000) }); setError(false); }
  return <section ref={root} className={`fusion-node${!merge && image.nodeOnly ? ' is-empty' : ''}${lingerie ? ' lingerie-node' : ''}${merge ? ' merge-node' : ''}`} data-overlay data-node-id={merge ? (!references.length ? '177:6191' : references.length === 4 ? '177:6100' : '177:7186') : lingerie ? (image.nodeOnly ? '136:17414' : '136:17371') : (image.nodeOnly ? '107:5118' : '35:6422')} data-source-image={image.id} aria-label={t.title}>
    <header className="fusion-header"><h2>{t.title}</h2><div className="fusion-tip"><img src={assets.fusionTip} alt="" width={20} height={20} /><span>{t.tip}</span></div></header>
    <div className="fusion-content">
      {!merge && <>{image.nodeOnly ? <button className="fusion-add-main" onClick={onAddMain}><Icon name="fusionAddImage" size={20}/>{lingerie ? lingerieCopy[locale].addMain : locale === 'zh-CN' ? '添加主图' : locale === 'ja' ? 'メイン画像を追加' : 'Add main image'}</button> : <div className="fusion-main"><ProgressiveImage src={image.url} alt={t.main} width={40} height={40}/><span>{t.main}</span>{!lingerie && <Button variant="outline" className="fusion-mask" aria-label={t.mask} onClick={onDemo}><Icon name="fusionBrush" size={20}/></Button>}</div>}<Divider /></>}
      <div className="fusion-field"><span className="fusion-label">{t.reference}{merge ? <><span className="merge-count-divider"/><span className="merge-reference-count">{mergeCopy[locale].uploaded} <span>{references.length}</span>/{referenceLimit}</span></> : !lingerie && <span className="fusion-reference-count">{references.length} / {referenceLimit}</span>}</span>
        <div className="fusion-references">
          {references.map((reference, index) => <div className="fusion-reference-wrap" key={merge ? reference.id : reference.url}>
            <div className="fusion-reference"><ProgressiveImage src={reference.url} alt={reference.name} /></div>
            <Button variant="tonal" className="fusion-reference-remove" aria-label={`${t.remove} ${index + 1}`} onClick={() => onChange({ references: references.filter((_, i) => i !== index), reference: undefined })}><Icon name="close" size={merge ? 12 : 16} /></Button>
          </div>)}
          {references.length < referenceLimit && <ReferenceSourceMenu addLabel={t.add} canvasLabel={t.canvas} onChoose={onReference} />}
        </div>
      </div>
      <div className="fusion-field"><label className="fusion-label" htmlFor={promptId}>{t.prompt}<span className="fusion-required">*</span></label><div className={`fusion-textarea${error ? ' has-error' : ''}`}>
        <textarea ref={prompt} id={promptId} value={settings.prompt} placeholder={t.placeholder} required maxLength={2000} aria-invalid={error} aria-describedby={error ? `${promptId}-error` : undefined} onChange={e => updatePrompt(e.target.value)} />
        <div className="fusion-textarea-footer"><div className="fusion-prompt-actions"><PromptTools key={image.nodeOnly ? 'empty' : 'main'} value={settings.prompt} onChange={updatePrompt} labels={t} /></div><span className="fusion-counter" aria-label={t.count}>{settings.prompt.length}/2000</span><Button variant="secondary" className="fusion-clear" onClick={() => updatePrompt('')}>{t.clear}</Button></div>
      </div>{error && <p className={merge ? 'sr-only' : 'fusion-error'} id={`${promptId}-error`} role="alert">{t.required}</p>}</div>
      <div className="fusion-field"><span className="fusion-label">{t.settings}</span><div className="fusion-settings"><SettingSelect label={t.ratio} value={settings.ratio} icon="fusionRatio" options={['auto', '1:1', '3:4', '4:3', '9:16', '16:9'].map(value => ({value, label: value === 'auto' ? t.auto : value}))} onChange={ratio => onChange({ ratio })} /><SettingSelect label={t.resolution} value={settings.resolution} icon="fusionHd" options={['1K', '2K', '4K'].map(value => ({value,label:value}))} onChange={resolution => onChange({ resolution })} /></div></div>
    </div>
    <footer className="fusion-node-action">
      <GenerateTaskButton label={t.generate} cost="999" className="fusion-generate" onClick={() => { if (merge ? !references.length : image.nodeOnly) { if (merge) onReference('upload'); else onAddMain(); return; } if (!lingerie && !settings.prompt.trim()) { setError(true); prompt.current?.focus(); } else onGenerate(); }} />
    </footer>
  </section>;
}
