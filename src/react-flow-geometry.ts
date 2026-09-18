import { Position, type Node } from '@xyflow/react';

// Canvas nodes have explicit dimensions. Supply handles from the same geometry
// so controlled updates never wait for a ResizeObserver to reconnect edges.
export function flowNodeGeometry(width: number, height: number): Pick<Node, 'width' | 'height' | 'handles'> {
  return {
    width,
    height,
    handles: [Position.Left, Position.Right].flatMap(position =>
      (['source', 'target'] as const).map(type => ({
        id: `${type}-${position}`, type, position,
        x: (position === Position.Left ? 0 : width) - 0.5,
        y: height / 2 - 0.5,
        width: 1, height: 1,
      }))),
  };
}
