import { assets } from '../assets';
import { MAX_DIRECTED_POINTS, type CanvasImage, type FusionSettings } from '../canvas';
import type { Locale } from '../i18n';
import { GenerateTaskButton } from './GenerateTaskButton';
import { ProgressiveImage } from './ProgressiveImage';
import { Button, Divider, Icon } from './ui';

const copy = {
  'zh-CN': { title: '定向融合', tip: '单张主图最多可以进行三处定向融合', main: '主图', addMain: '添加主图', point: '融合点', add: '添加融合点', replace: '替换融合点', remove: '删除融合点', mask: '调整蒙版', reference: '参考图', generate: '开始 AI 生成', required: '请先添加融合点', maskPending: '定向融合蒙版编辑暂未接入', generatePending: '定向融合生成暂未接入服务' },
  en: { title: 'Directed fusion', tip: 'Up to three fusion points per main image', main: 'Main image', addMain: 'Add main image', point: 'Point ', add: 'Add fusion point', replace: 'Replace fusion point', remove: 'Delete fusion point', mask: 'Edit mask', reference: 'Reference', generate: 'Start AI generation', required: 'Add a fusion point first', maskPending: 'Directed fusion mask editing is not connected yet', generatePending: 'Directed fusion generation is not connected yet' },
  ja: { title: '指定融合', tip: 'メイン画像1枚につき最大3か所まで融合可能', main: 'メイン画像', addMain: 'メイン画像を追加', point: '融合点', add: '融合点を追加', replace: '融合点を変更', remove: '融合点を削除', mask: 'マスク調整', reference: '参考画像', generate: 'AI 生成を開始', required: '先に融合点を追加してください', maskPending: '指定融合のマスク編集は未接続です', generatePending: '指定融合の生成サービスは未接続です' },
};

type Props = {
  image: CanvasImage;
  locale: Locale;
  onChange: (patch: Partial<FusionSettings>) => void;
  onAddMain: () => void;
  onChoosePoint: (pointId?: string) => void;
  onGenerate: () => void;
  onNotify: (message: string) => void;
};

export function DirectedFusionNode({ image, locale, onChange, onAddMain, onChoosePoint, onGenerate, onNotify }: Props) {
  const t = copy[locale];
  const points = (image.fusion?.directedPoints ?? []).slice(0, MAX_DIRECTED_POINTS);
  return <section className={`fusion-node directed-node${image.nodeOnly ? ' is-empty' : ''}`} data-overlay data-source-image={image.id}
    data-node-id={image.nodeOnly ? '136:18424' : points.length ? '136:17987' : '136:17846'} aria-label={t.title}>
    <header className="fusion-header"><h2>{t.title}</h2><div className="fusion-tip"><img src={assets.fusionTip} alt="" width={20} height={20} /><span>{t.tip}</span></div></header>
    <div className="fusion-content">
      {image.nodeOnly ? <button type="button" className="fusion-add-main" data-node-id="136:18477" onClick={onAddMain}><Icon name="fusionAddImage" size={20} />{t.addMain}</button>
        : <div className="fusion-main"><ProgressiveImage src={image.url} alt={t.main} width={40} height={40} /><span>{t.main}</span></div>}
      <Divider />
      {points.map((point, index) => <div key={point.id} className="directed-point" data-phase="enter">
        <div className="directed-point-header">
          <div className="directed-point-title"><span>{t.point}{index + 1}</span><Button className="directed-point-action" aria-label={`${t.replace} ${index + 1}`} onClick={() => onChoosePoint(point.id)}><Icon name="directedReplace" size={20} /></Button></div>
          <Button className="directed-point-action" aria-label={`${t.remove} ${index + 1}`} onClick={() => onChange({ directedPoints: points.filter(item => item.id !== point.id) })}><Icon name="contextTrash" size={20} /></Button>
        </div>
        <Divider />
        <div className="directed-point-preview">
          <div className="directed-point-images">
            {image.nodeOnly ? <div className="directed-point-empty"><Icon name="fusionAddImage" size={20} /></div> : <ProgressiveImage src={point.maskSourceUrl === image.url && point.maskPreviewUrl ? point.maskPreviewUrl : image.url} alt={`${t.main} · ${t.point}${index + 1}`} className="directed-mask-preview" width={56} height={56} fit="contain" />}
            <ProgressiveImage src={point.reference.url.endsWith("/assets/workflow-examples/directed-neckline-reference.png") ? point.reference.url.replace("directed-neckline-reference.png", "directed-neckline-reference-mask-teal.png") : point.reference.url} alt={`${t.reference} · ${point.reference.name}`} className="directed-mask-preview" width={56} height={56} fit="contain" />
          </div>
          <button type="button" className="directed-mask" onClick={() => image.nodeOnly ? onAddMain() : onNotify(t.maskPending)}><span>{t.mask}</span><Icon name="directedChevron" size={16} /></button>
        </div>
      </div>)}
      {points.length < MAX_DIRECTED_POINTS && <button type="button" className="fusion-add-main" onClick={() => image.nodeOnly ? onAddMain() : onChoosePoint()}><Icon name="directedAdd" size={20} />{t.add}</button>}
    </div>
    <footer className="fusion-node-action">
      <GenerateTaskButton label={t.generate} cost="999" className="fusion-generate" disabled={points.length === 0} onClick={() => image.nodeOnly ? onAddMain() : onGenerate()} />
    </footer>
  </section>;
}
