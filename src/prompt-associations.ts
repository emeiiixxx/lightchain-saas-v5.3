export type PromptEntry = { id: string; name: string; content: string; pinned?: boolean };
export type PromptImage = { id: string; url: string; name: string };
export type PromptGeneration = {
  id: string;
  promptId: string;
  prompt: string; // Exact prompt snapshot at generation time, independent of later edits.
  main: PromptImage;
  results: PromptImage[];
};
export type PromptImageGroup = {
  id: string;
  main: PromptImage;
  results: PromptImage[];
  historical: boolean;
};
// Requested review fixtures. These are not real account generation history.
export const demoPrompts: PromptEntry[] = [
  { id: 'demo-prompt-surreal', name: '超现实海岛大片 · 演示', content: '保留主图的梦幻色彩与创意氛围，转换为海边超现实场景：金色流线建筑悬浮在沙滩上，远处是清澈海面和蓝天，加入小比例人物，突出空间层次与柔和日光。' },
  { id: 'demo-prompt-resort', name: '夏日度假穿搭 · 演示', content: '以主图人物为基础，呈现轻松自然的夏日度假穿搭。采用浅蓝与柔和中性色，背景为阳光下的石墙与海岛建筑，保留衣物材质、自然褶皱和完整人物比例。' },
  { id: 'demo-prompt-studio', name: '彩色创意造型 · 演示', content: '围绕主图的彩色毛绒服装制作创意时尚大片，强调丰富材质与高饱和配色。使用简洁背景和柔和光线，保持人物主体清晰，展示服装轮廓与细节。' },
];
const demoGenerations: PromptGeneration[] = [
  { id:'demo-generation-1', promptId:demoPrompts[0].id, prompt:demoPrompts[0].content, main:{id:'demo-main-surreal',url:'/assets/prompts/main.png',name:'创意人物主图'}, results:Array.from({length:6},(_,i)=>({id:`demo-surreal-result-${i}`,url:'/assets/prompts/result.png',name:`海岛创意效果 ${i+1}`})) },
  { id:'demo-generation-1-b', promptId:demoPrompts[0].id, prompt:demoPrompts[0].content, main:{id:'demo-main-surreal-b',url:'/assets/prompts/group-main-2.jpg',name:'第二组主图'}, results:Array.from({length:2},(_,i)=>({id:`demo-surreal-b-result-${i}`,url:'/assets/prompts/result.png',name:`第二组效果 ${i+1}`})) },
  { id:'demo-generation-1-c', promptId:demoPrompts[0].id, prompt:demoPrompts[0].content, main:{id:'demo-main-surreal-c',url:'/assets/prompts/group-main-3.jpg',name:'第三组主图'}, results:Array.from({length:4},(_,i)=>({id:`demo-surreal-c-result-${i}`,url:'/assets/prompts/result.png',name:`第三组效果 ${i+1}`})) },
  { id:'demo-generation-2', promptId:demoPrompts[1].id, prompt:demoPrompts[1].content, main:{id:'demo-main-resort',url:'/assets/upload/imgAsset7.png',name:'浅蓝吊带裙'}, results:[{id:'demo-resort-result-1',url:'/assets/upload/imgAsset6.png',name:'紫色连衣裙效果'},{id:'demo-resort-result-2',url:'/assets/upload/imgAsset3.png',name:'度假连衣裙效果'}] },
  { id:'demo-generation-3', promptId:demoPrompts[2].id, prompt:demoPrompts[2].content, main:{id:'demo-main-studio',url:'/assets/upload/single-select-asset.png',name:'彩色毛绒穿搭'}, results:[{id:'demo-studio-result-1',url:'/assets/prompts/main.png',name:'创意造型效果'}] },
];
export function associatedImageGroups(entry: PromptEntry | undefined, records: readonly PromptGeneration[] = demoGenerations): PromptImageGroup[] {
  if (!entry) return [];
  const groups = new Map<string, PromptImageGroup>();
  const seenResults = new Set<string>();
  for (const record of records) {
    // Identity owns the gallery; text determines the historical label, never ownership.
    if (record.promptId !== entry.id) continue;
    const key = JSON.stringify([record.promptId, record.prompt, record.main.id]);
    for (const result of record.results) {
      if (seenResults.has(result.id)) continue;
      seenResults.add(result.id);
      let group = groups.get(key);
      if (!group) {
        group = { id: record.id, main: record.main, results: [], historical: record.prompt !== entry.content };
        groups.set(key, group);
      }
      group.results.push(result);
    }
  }
  return [...groups.values()];
}
