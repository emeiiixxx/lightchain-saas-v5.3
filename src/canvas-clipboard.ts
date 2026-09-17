import { workflowHeight, FUSION_WIDTH, fusionPosition, fusionReferences, type CanvasImage } from './canvas';

// Snapshot visible vertices independently, including legacy image/editor pairs.
// Relationships in this snapshot use snapshot IDs (editor IDs end in :fusion).
// Keep only edges whose two endpoints are copied; never attach to the originals.
export function copyCanvasSelection(items: CanvasImage[], selected: string[]): CanvasImage[] {
  const ids = new Set(selected);
  const imageIds = new Set(items.filter(item => !item.nodeOnly && ids.has(item.id)).map(item => item.id));
  const editorIds = new Set(items.filter(item => item.fusion && ids.has(`${item.id}:fusion`)).map(item => item.id));
  return items.flatMap(item => {
    const copies: CanvasImage[] = [];
    if (imageIds.has(item.id)) {
      // Cutout provenance wins over inherited legacy generation metadata, even
      // when its source is outside the selection. Do not resurrect a stale edge.
      const sourceImageId = item.sourceImageId && imageIds.has(item.sourceImageId) ? item.sourceImageId : undefined;
      const generatedByEditorId = item.sourceImageId == null && item.generatedByEditorId && editorIds.has(item.generatedByEditorId)
        ? `${item.generatedByEditorId}:fusion` : undefined;
      copies.push({ id: item.id, name: item.name, url: item.url, x: item.x, y: item.y, width: item.width, height: item.height,
        sourceImageId, generatedByEditorId });
    }
    if (item.fusion && editorIds.has(item.id)) {
      const position = { ...fusionPosition(item) };
      const sourceId = item.editorSourceId ?? (!item.nodeOnly ? item.id : undefined);
      copies.push({
        id: `${item.id}:fusion`, name: '', url: '', ...position,
        width: FUSION_WIDTH, height: workflowHeight(item.fusion), nodeOnly: true,
        editorSourceId: sourceId && imageIds.has(sourceId) ? sourceId : undefined,
        fusion: {
          kind: item.fusion.kind, position, prompt: item.fusion.prompt, ratio: item.fusion.ratio, resolution: item.fusion.resolution,
          flatRegion: item.fusion.flatRegion, flatFace: item.fusion.flatFace,
          references: fusionReferences(item.fusion).map(reference => ({ ...reference })),
          directedPoints: item.fusion.directedPoints?.map(point => ({ ...point, reference: { ...point.reference } })),
        },
      });
    }
    return copies;
  });
}

export function pasteCanvasSelection(items: CanvasImage[], dx: number, dy: number): CanvasImage[] {
  // Allocate all IDs first so forward edges, branches and repeated pastes map
  // exclusively to this batch, regardless of the order of snapshot records.
  const newIds = new Map(items.map(item => [item.id, crypto.randomUUID()]));
  const imageIds = new Set(items.filter(item => !item.nodeOnly).map(item => item.id));
  const editorIds = new Set(items.filter(item => item.fusion).map(item => item.id));
  const remapImage = (id?: string) => id && imageIds.has(id) ? newIds.get(id) : undefined;
  const remapEditor = (id?: string) => id && editorIds.has(id) ? newIds.get(id) : undefined;
  return items.map(item => {
    const position = { x: item.x + dx, y: item.y + dy };
    return {
      ...item, id: newIds.get(item.id)!, ...position,
      editorSourceId: remapImage(item.editorSourceId),
      sourceImageId: remapImage(item.sourceImageId),
      generatedByEditorId: item.sourceImageId == null ? remapEditor(item.generatedByEditorId) : undefined,
      fusion: item.fusion ? {
        ...item.fusion, position,
        references: fusionReferences(item.fusion).map(reference => ({ ...reference })),
        directedPoints: item.fusion.directedPoints?.map(point => ({ ...point, id: crypto.randomUUID(), reference: { ...point.reference } })),
      } : undefined,
    };
  });
}
