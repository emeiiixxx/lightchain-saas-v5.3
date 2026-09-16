import { workflowHeight, fusionPosition, type CanvasImage } from '../canvas';

// This SVG is dynamic graph geometry, not an icon asset. Both endpoints derive
// from world-space node bounds and remain attached during independent dragging.
export function FusionConnection({ image, active, zoom = 1 }: { image: CanvasImage; active: boolean; zoom?: number }) {
  const node = fusionPosition(image);
  return <ImageConnection image={image} target={{...node, id: `${image.id}:fusion`, width: 280, height: workflowHeight(image.fusion)}} active={active} zoom={zoom} />;
}

export function ImageConnection({ image, target: node, active, zoom }: { image: CanvasImage; target: Pick<CanvasImage, 'id' | 'x' | 'y' | 'width' | 'height'>; active: boolean; zoom: number }) {
  const rightward = node.x + node.width / 2 >= image.x + image.width / 2;
  const direction = rightward ? 1 : -1;
  // Offset only the endpoints, never mask the curve where it crosses media.
  // Include the active underlay's 2px round cap to leave a visible 2px gap.
  const gap = (active ? 4 : 2) / zoom;
  const start = { x: image.x + (rightward ? image.width : 0) + gap * direction, y: image.y + image.height / 2 };
  const end = { x: node.x + (rightward ? 0 : node.width) - gap * direction, y: node.y + node.height / 2 };
  const handle = Math.max(48, Math.abs(end.x - start.x) * .45);
  const d = `M ${start.x} ${start.y} C ${start.x + handle * direction} ${start.y}, ${end.x - handle * direction} ${end.y}, ${end.x} ${end.y}`;
  return <svg className="fusion-connection" aria-hidden="true" data-active={active} data-source={image.id} data-target={node.id}>
    {active && <path className="fusion-connection-backdrop" d={d} fill="none" />}
    <path className="fusion-connection-line" d={d} fill="none" />
  </svg>;
}
