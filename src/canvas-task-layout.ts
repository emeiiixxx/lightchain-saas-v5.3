import { fusionReferences, isMultiInputWorkflow, type CanvasImage } from './canvas';
import type { LayoutBlock } from './canvas-merge-layout';

// Remember which previously unconnected materials entered this task. Existing
// workflows keep their ownership when another task references their images.
export function standaloneTaskInputs(items: CanvasImage[]): Set<string> {
  const connected = new Set<string>();
  for (const item of items) {
    if (item.sourceImageId) { connected.add(item.id); connected.add(item.sourceImageId); }
    if (item.generatedByEditorId) { connected.add(item.id); connected.add(item.generatedByEditorId); }
    if (item.fusion) {
      connected.add(item.id);
      if (item.editorSourceId) connected.add(item.editorSourceId);
      for (const reference of fusionReferences(item.fusion)) if (reference.sourceImageId) connected.add(reference.sourceImageId);
    }
  }
  return new Set(items.filter(item => !item.nodeOnly && !connected.has(item.id)).map(item => item.id));
}

const offset = (block: LayoutBlock, x: number, y: number) => block.nodes.map(node => ({ ...node, x: node.x + x, y: node.y + y }));
const rootImage = (items: CanvasImage[], block: LayoutBlock) => items.find(item => !item.nodeOnly && block.nodes.some(node => node.id === item.id && node.x === 0));

export function groupTaskBlocks(items: CanvasImage[], related: LayoutBlock[], tasks: LayoutBlock[]) {
  const members = new Map<string, { block: LayoutBlock; taskId: string }>();
  for (const block of related) {
    const root = rootImage(items, block);
    if (root) members.set(root.id, { block, taskId: root.layoutTaskId ?? '' });
  }
  for (const editor of items) {
    if (!isMultiInputWorkflow(editor.fusion)) continue;
    const task = tasks.find(block => block.nodes.some(node => node.id === `${editor.id}:fusion`));
    if (!task) continue;
    const adopted: LayoutBlock[] = [];
    for (const ref of fusionReferences(editor.fusion)) {
      const member = ref.sourceImageId ? members.get(ref.sourceImageId) : undefined;
      if (!member || !items.some(item => item.id === ref.sourceImageId && item.url === ref.url)) continue;
      // Single-image blocks support tasks created before ownership was recorded.
      if (member.taskId ? member.taskId !== editor.id : member.block.nodes.length !== 1) continue;
      if (!related.includes(member.block)) continue;
      adopted.push(member.block);
      related.splice(related.indexOf(member.block), 1);
      members.delete(ref.sourceImageId!);
    }
    if (adopted.length) {
      const inputWidth = Math.max(...adopted.map(block => block.width));
      const inputHeight = adopted.reduce((sum, block) => sum + block.height, 0) + (adopted.length - 1) * 120;
      const height = Math.max(task.height, inputHeight);
      let y = (height - inputHeight) / 2;
      const nodes = adopted.flatMap(block => { const placed = offset(block, 0, y); y += block.height + 120; return placed; });
      nodes.push(...offset(task, inputWidth + 80, (height - task.height) / 2));
      task.nodes = nodes; task.width += inputWidth + 80; task.height = height;
    }
  }
  // A task containing all its canvas inputs is a normal complete group, not a
  // cross-group stage that must be separated from every other workflow.
  for (const task of [...tasks]) {
    const ids = new Set(task.nodes.map(node => node.id));
    const editors = items.filter(item => isMultiInputWorkflow(item.fusion) && ids.has(`${item.id}:fusion`));
    const external = editors.some(editor => fusionReferences(editor.fusion).some(ref => ref.sourceImageId &&
      !ids.has(ref.sourceImageId) && items.some(item => !item.nodeOnly && item.id === ref.sourceImageId && item.url === ref.url)));
    if (!external) { tasks.splice(tasks.indexOf(task), 1); related.push(task); }
  }
  // Direct batch operations have no shared editor: keep each source/result pair
  // intact, and pack the newly owned pairs together as one task.
  const batches = new Map<string, LayoutBlock[]>();
  for (const block of related) {
    const root = rootImage(items, block);
    if (!root?.layoutTaskId || items.some(item => item.id === root.layoutTaskId && item.fusion)) continue;
    const blocks = batches.get(root.layoutTaskId) ?? [];
    blocks.push(block); batches.set(root.layoutTaskId, blocks);
  }
  for (const blocks of batches.values()) {
    if (blocks.length < 2) continue;
    let y = 0;
    const combined: LayoutBlock = { width: Math.max(...blocks.map(block => block.width)), height: 0, nodes: [] };
    for (const block of blocks) { combined.nodes.push(...offset(block, 0, y)); y += block.height + 120; }
    combined.height = y - 120;
    const index = related.indexOf(blocks[0]);
    for (const block of blocks) related.splice(related.indexOf(block), 1);
    related.splice(index, 0, combined);
  }
}
