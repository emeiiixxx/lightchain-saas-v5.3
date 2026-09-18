import type { CanvasImage } from '../canvas';

type Props = {
  image: CanvasImage;
  target: Pick<CanvasImage, 'id' | 'x' | 'y' | 'width' | 'height'>;
  active: boolean;
  zoom: number;
};

// Declarative edge consumed by ReactFlowCanvas when building its graph.
// Rendering and animation belong to its custom React Flow edge renderer.
export function ImageConnection(_props: Props) {
  return null;
}
