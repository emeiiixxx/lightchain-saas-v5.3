import { useId } from 'react';
import { assets } from '../assets';
import type { CanvasImage, FlatFace, FlatRegion, FusionSettings } from '../canvas';
import type { Locale } from '../i18n';
import { GenerateTaskButton } from './GenerateTaskButton';
import { ProgressiveImage } from './ProgressiveImage';
import { SettingSelect } from './SettingSelect';
import { Divider, Icon } from './ui';

const copy = {
  'zh-CN': { title: '转3D平铺', tip: '将指定区域转为3D平铺效果', main: '主图', addMain: '添加主图', region: '选择区域', top: '上装', bottom: '下装', full: '连身装', face: '生成面', front: '正面', back: '背面', settings: '生成设置', ratio: '图片比例', auto: '自动', resolution: '分辨率', generate: '开始 AI 生成' },
  en: { title: '3D to flat', tip: 'Turn the selected area into a 3D flat lay', main: 'Main image', addMain: 'Add main image', region: 'Select area', top: 'Top', bottom: 'Bottom', full: 'One-piece', face: 'Generate view', front: 'Front', back: 'Back', settings: 'Generation settings', ratio: 'Aspect ratio', auto: 'Auto', resolution: 'Resolution', generate: 'Start AI generation' },
  ja: { title: '3D平置き', tip: '指定エリアを3D平置き画像に変換', main: 'メイン画像', addMain: 'メイン画像を追加', region: 'エリアを選択', top: 'トップス', bottom: 'ボトムス', full: 'ワンピース', face: '生成する面', front: '正面', back: '背面', settings: '生成設定', ratio: '画像比率', auto: '自動', resolution: '解像度', generate: 'AI 生成を開始' },
};

type Props = { image: CanvasImage; locale: Locale; onChange: (patch: Partial<FusionSettings>) => void; onAddMain: () => void; onGenerate: () => void };

export function FlatLayNode({ image, locale, onChange, onAddMain, onGenerate }: Props) {
  const t = copy[locale];
  const settings = image.fusion!;
  const faceLabel = useId();
  return <section className={`fusion-node flat-lay-node${image.nodeOnly ? ' is-empty' : ''}`} data-overlay data-source-image={image.id} data-node-id={image.nodeOnly ? '136:18657' : '136:18488'} aria-label={t.title}>
    <header className="fusion-header"><h2>{t.title}</h2><div className="fusion-tip"><img src={assets.fusionTip} alt="" width={20} height={20} /><span>{t.tip}</span></div></header>
    <div className="fusion-content">
      {image.nodeOnly
        ? <button type="button" className="fusion-add-main" onClick={onAddMain}><Icon name="fusionAddImage" size={20} />{t.addMain}</button>
        : <div className="fusion-main"><ProgressiveImage src={image.url} alt={t.main} width={40} height={40} /><span>{t.main}</span></div>}
      <Divider />
      <div className="fusion-field"><span className="fusion-label">{t.region}</span>
        <SettingSelect label={t.region} value={settings.flatRegion ?? 'top'} options={(['top', 'bottom', 'full'] as FlatRegion[]).map(value => ({ value, label: t[value] }))} onChange={value => onChange({ flatRegion: value as FlatRegion })} />
      </div>
      <div className="fusion-field"><span className="fusion-label" id={faceLabel}>{t.face}</span>
        <div className="flat-lay-faces" role="group" aria-labelledby={faceLabel}>
          {(['front', 'back'] as FlatFace[]).map(value => <button key={value} type="button" className="flat-lay-face" aria-pressed={(settings.flatFace ?? 'front') === value} onClick={() => onChange({ flatFace: value })}>{t[value]}</button>)}
        </div>
      </div>
      <div className="fusion-field"><span className="fusion-label">{t.settings}</span><div className="fusion-settings">
        <SettingSelect label={t.ratio} value={settings.ratio} icon="fusionRatio" options={['auto', '1:1', '3:4', '4:3', '9:16', '16:9'].map(value => ({ value, label: value === 'auto' ? t.auto : value }))} onChange={ratio => onChange({ ratio })} />
        <SettingSelect label={t.resolution} value={settings.resolution} icon="fusionHd" options={['1K', '2K', '4K'].map(value => ({ value, label: value }))} onChange={resolution => onChange({ resolution })} />
      </div></div>
    </div>
    <GenerateTaskButton label={t.generate} cost="999" className="fusion-generate" onClick={() => image.nodeOnly ? onAddMain() : onGenerate()} />
  </section>;
}
