export type PromptEntry = { id: string; name: string; content: string };
export type PromptGeneration = {
  id: string;
  promptId: string;
  prompt: string; // Exact prompt snapshot at generation time, independent of later edits.
  main: { url: string; name: string };
  results: { url: string; name: string }[];
};
// Requested review fixtures. These are not real account generation history.
export const demoPrompts: PromptEntry[] = [
  { id: 'demo-prompt-surreal', name: '超现实海岛大片 · 演示', content: '保留主图的梦幻色彩与创意氛围，转换为海边超现实场景：金色流线建筑悬浮在沙滩上，远处是清澈海面和蓝天，加入小比例人物，突出空间层次与柔和日光。' },
  { id: 'demo-prompt-resort', name: '夏日度假穿搭 · 演示', content: '以主图人物为基础，呈现轻松自然的夏日度假穿搭。采用浅蓝与柔和中性色，背景为阳光下的石墙与海岛建筑，保留衣物材质、自然褶皱和完整人物比例。' },
  { id: 'demo-prompt-studio', name: '彩色创意造型 · 演示', content: '围绕主图的彩色毛绒服装制作创意时尚大片，强调丰富材质与高饱和配色。使用简洁背景和柔和光线，保持人物主体清晰，展示服装轮廓与细节。' },
];
const demoGenerations: PromptGeneration[] = [
  { id:'demo-generation-1', promptId:demoPrompts[0].id, prompt:demoPrompts[0].content, main:{url:'/assets/prompts/main.png',name:'创意人物主图'}, results:Array.from({length:7},(_,i)=>({url:'/assets/prompts/result.png',name:`海岛创意效果 ${i+1}`})) },
  { id:'demo-generation-2', promptId:demoPrompts[1].id, prompt:demoPrompts[1].content, main:{url:'/assets/upload/imgAsset7.png',name:'浅蓝吊带裙'}, results:[{url:'/assets/upload/imgAsset6.png',name:'紫色连衣裙效果'},{url:'/assets/upload/imgAsset3.png',name:'度假连衣裙效果'}] },
  { id:'demo-generation-3', promptId:demoPrompts[2].id, prompt:demoPrompts[2].content, main:{url:'/assets/upload/single-select-asset.png',name:'彩色毛绒穿搭'}, results:[{url:'/assets/prompts/main.png',name:'创意造型效果'}] },
];
export function associatedImages(entry: PromptEntry | undefined) {
  if (!entry) return [];
  return demoGenerations.filter(record=>record.promptId===entry.id && record.prompt===entry.content).flatMap(record=>[
    {id:`${record.id}:main`,...record.main,role:'主图'},
    ...record.results.map((result,index)=>({id:`${record.id}:${index}`,...result,role:'AI生成'})),
  ]);
}
