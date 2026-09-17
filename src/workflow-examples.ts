import { prepareMainImage } from './asset-library';
import { defaultFusion, FUSION_WIDTH, workflowHeight, type CanvasImage, type WorkflowKind } from './canvas';

// Local onboarding fixtures: the images illustrate a workflow, not a live AI run.
const examples = {
  fusion: {
    title: '一键融合',
    main: { name: '乳白色蕾丝家居服套装 · 示例主图', url: '/assets/workflow-examples/fusion-loungewear.png' },
    reference: null,
    result: { name: '复古卧室家居服大片 · 一键融合演示', url: '/assets/workflow-examples/fusion-loungewear-result.png' },
    prompt: '视觉主旨： 高端时尚社论，一位拥有空灵气质的模特双腿自然叠放坐在复古单人沙发上。 核心焦点： 姜黄色自然短发。模特身着图中服饰。 环境细节： 70年代复古风格卧室，乳白色淡淡的碎花壁纸，复古格纹沙发，旁边有复古木制床头柜和黄铜灯杆的布艺灯罩台灯。 摄影标准： 采用35mm高端电影镜头，光线明亮干净、阴影浅淡自然，主光从模特正面 45° 角打光，辅光弱化阴影，无强烈明暗对比，整体光线均匀通透，画面色彩饱，高宽容度，呈现出极致的细节纹理。没有任何病态感，整体氛围是空灵、温馨、自然随性的艺术瞬间。',
  },
  directed: {
    title: '定向融合',
    main: { name: '黄裙模特棚拍 · 示例主图', url: '/assets/workflow-examples/fusion-main.png' },
    reference: { name: '蓝色碎花裹身裙 · 示例参考图', url: '/assets/workflow-examples/directed-reference.png' },
    result: { name: '局部替换蓝色花裙 · 定向融合演示', url: '/assets/workflow-examples/directed-result.png' },
    prompt: '',
  },
  flat: {
    title: '转3D平铺',
    main: { name: '黑白水手领连身装 · 示例主图', url: '/assets/workflow-examples/flat-main.jpg' },
    reference: null,
    result: { name: '黑白连身装3D平铺 · 演示结果', url: '/assets/workflow-examples/flat-result.png' },
    prompt: '',
  },
  lingerie: {
    title: '内衣试衣',
    main: { name: '黄紫拼色内衣套装 · 示例主图', url: '/assets/workflow-examples/lingerie-product.jpeg' },
    reference: { name: '金发模特 · 示例参考图', url: '/assets/workflow-examples/lingerie-model.png' },
    result: { name: '黄紫拼色内衣上身 · 试衣演示', url: '/assets/workflow-examples/lingerie-result.png' },
    prompt: '将主图中的黄紫拼色内衣套装穿到参考模特身上，保留淡黄色蕾丝、浅紫色罩杯、黑色肩带与包边，以及配套高腰内裤的拼色和侧边镂空细节。保留模特的金色长发、双臂抬起的姿势，搭配暖桃色背景与粉色球形布景，呈现自然贴合、柔和光影的内衣产品大片。',
  },
} satisfies Record<Exclude<WorkflowKind, 'merge'>, unknown>;

// Preserve each supplied result image’s original aspect ratio.
export function workflowExampleResult(kind: WorkflowKind) {
  if (kind === 'merge') return { ...examples.fusion.result, name: '合拼生图结果 · 演示', width: 360, height: 360 * 2400 / 1792 };
  return { ...examples[kind].result, width: 360, height: kind === 'lingerie' ? 360 * 1064 / 794 : kind === 'fusion' || kind === 'flat' ? 360 * 2400 / 1792 : 540 };
}

export async function createWorkflowExample(kind: Exclude<WorkflowKind, 'merge'>): Promise<CanvasImage[]> {
  const example = examples[kind];
  const [main, reference, output] = await Promise.all([
    prepareMainImage({ id: 'example-main', ...example.main }),
    example.reference ? prepareMainImage({ id: 'example-reference', ...example.reference }) : null,
    prepareMainImage({ id: 'example-result', ...example.result }),
  ]);
  const editorId = crypto.randomUUID();
  const referenceImage = reference ? { id: reference.id, name: reference.name, url: reference.url } : undefined;
  const fusion = {
    ...defaultFusion(kind), prompt: example.prompt, position: { x: 440, y: 0 },
    ...(kind === 'flat' ? { flatRegion: 'full' as const } : {}),
    ...(kind === 'directed' && referenceImage
      ? { directedPoints: [{ id: crypto.randomUUID(), reference: referenceImage }] }
      : { references: referenceImage ? [referenceImage] : [] }),
  };
  return [
    { ...main, x: 0, y: 0, role: 'main' },
    { id: editorId, name: example.title, url: '', nodeOnly: true, editorSourceId: main.id,
      x: 440, y: 0, width: FUSION_WIDTH, height: workflowHeight(fusion), fusion },
    { ...output, role: undefined, x: 800, y: 0, generatedByEditorId: editorId },
  ];
}
