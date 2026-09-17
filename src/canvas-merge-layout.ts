import { isMultiInputWorkflow, type CanvasImage } from './canvas';

export type LayoutBlock = { width: number; height: number; nodes: { id: string; x: number; y: number }[] };
export const MERGE_OUTPUT_GAP = 160;
export const MERGE_GROUP_GAP = 480;

// Cross-group input edges affect the order of merge groups, never source ownership.
// A merge and its own downstream operations form a separate block.
export function mergeGroupStages(items: CanvasImage[], blocks: LayoutBlock[]): LayoutBlock[][] {
  const owner = new Map<string, number>();
  blocks.forEach((block, index) => block.nodes.forEach(node => owner.set(node.id, index)));
  const dependencies = blocks.map(() => new Set<number>());
  for (const item of items) {
    if (!item.fusion || !isMultiInputWorkflow(item.fusion)) continue;
    const target = owner.get(`${item.id}:fusion`);
    if (target === undefined) continue;
    for (const reference of item.fusion.references ?? []) {
      const source = reference.sourceImageId && items.find(image => !image.nodeOnly && image.id === reference.sourceImageId && image.url === reference.url);
      const parent = source ? owner.get(source.id) : undefined;
      if (parent !== undefined && parent !== target) dependencies[target].add(parent);
    }
  }
  const pending = new Set(blocks.map((_, index) => index));
  const stages: LayoutBlock[][] = [];
  while (pending.size) {
    const ready = [...pending].filter(index => [...dependencies[index]].every(parent => !pending.has(parent)));
    // Legacy malformed cycles must not omit content or change stored edges.
    if (!ready.length) ready.push(pending.values().next().value!);
    stages.push(ready.map(index => blocks[index]));
    ready.forEach(index => pending.delete(index));
  }
  return stages;
}
