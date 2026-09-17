import { boundsOf, canvasNodes, type CanvasImage } from './canvas';

export type ImageOutput = { sourceId: string; sourceUrl: string; url: string; name: string; width?: number; height?: number };

export function createImageResults(current: CanvasImage[], outputs: ImageOutput[]): CanvasImage[] {
  const pairs = outputs.flatMap(output => {
    const source = current.find(item => item.id === output.sourceId && item.url === output.sourceUrl && !item.nodeOnly);
    return source ? [{ source, output }] : [];
  }).sort((a, b) => a.source.y - b.source.y || a.source.x - b.source.x);
  const bounds = boundsOf(pairs.map(pair => pair.source));
  if (!bounds) return [];
  const occupied = canvasNodes(current);
  const results: CanvasImage[] = [];
  const x = bounds.x + bounds.width + 80;
  for (const { source, output } of pairs) {
    const width = output.width ?? source.width, height = output.height ?? source.height;
    let y = source.y;
    let collisions;
    while ((collisions = occupied.filter(item => x < item.x + item.width + 16 && x + width + 16 > item.x && y < item.y + item.height + 16 && y + height + 16 > item.y)).length) {
      y = Math.max(...collisions.map(item => item.y + item.height)) + 80;
    }
    // New image identity and exactly one direct-source edge; never inherit an
    // editor, its result edge, or the source's own upstream relationship.
    const result: CanvasImage = { id: crypto.randomUUID(), name: output.name, url: output.url, x, y, width, height, sourceImageId: source.id };
    results.push(result);
    occupied.push(result);
  }
  return results;
}
