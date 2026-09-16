import { FUSION_HEIGHT, FUSION_WIDTH, fusionPosition, fusionReferences, type CanvasImage } from './canvas';

// Copy the visible selection, not the storage record (which may hold both an
// image and its editor). Whitelist fields so old graph relationships never leak.
export function copyCanvasSelection(items: CanvasImage[], selected: string[]): CanvasImage[] {
  const ids = new Set(selected);
  return items.flatMap(item => {
    const copies: CanvasImage[] = [];
    if (!item.nodeOnly && ids.has(item.id)) {
      copies.push({ id: item.id, name: item.name, url: item.url, x: item.x, y: item.y, width: item.width, height: item.height });
    }
    if (item.fusion && ids.has(`${item.id}:fusion`)) {
      const position = { ...fusionPosition(item) };
      copies.push({
        id: `${item.id}:fusion`, name: '', url: '', ...position,
        width: FUSION_WIDTH, height: FUSION_HEIGHT, nodeOnly: true,
        fusion: {
          position, prompt: item.fusion.prompt, ratio: item.fusion.ratio, resolution: item.fusion.resolution,
          references: fusionReferences(item.fusion).map(reference => ({ ...reference })),
        },
      });
    }
    return copies;
  });
}

export function pasteCanvasSelection(items: CanvasImage[], dx: number, dy: number): CanvasImage[] {
  return items.map(item => {
    const position = { x: item.x + dx, y: item.y + dy };
    return {
      ...item, id: crypto.randomUUID(), ...position,
      fusion: item.fusion ? {
        ...item.fusion, position,
        references: fusionReferences(item.fusion).map(reference => ({ ...reference })),
      } : undefined,
    };
  });
}
