import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adoptUserNodes, getEdgePosition, type InternalNodeBase, type NodeBase } from '@xyflow/system';
import { flowNodeGeometry } from '../src/react-flow-geometry.ts';

test('connections survive controlled updates and directed-node resizing before DOM measurement', () => {
  const lookup = new Map<string, InternalNodeBase>();
  const parents = new Map();
  // Add/remove fusion points, undo/redo, and move the editor. No browser
  // measurement is injected between updates: the edge must always resolve.
  for (const [height, y] of [[269, 0], [410, 0], [551, 0], [624, 0], [410, 0], [269, 0], [410, 120], [410, 120]]) {
    const nodes: NodeBase[] = [
      { id: 'image', position: { x: 0, y: 0 }, data: {}, ...flowNodeGeometry(360, 480) },
      { id: 'editor', position: { x: 600, y }, data: {}, ...flowNodeGeometry(280, height) },
      { id: 'result', position: { x: 1000, y: 0 }, data: {}, ...flowNodeGeometry(360, 480) },
    ];
    adoptUserNodes(nodes, lookup, parents);
    for (const [source, target] of [['image', 'editor'], ['editor', 'result']]) {
      const edge = getEdgePosition({ id: `${source}-${target}`, sourceNode: lookup.get(source)!, targetNode: lookup.get(target)!, sourceHandle: 'source-right', targetHandle: 'target-left' });
      assert.ok(edge, `missing ${source}->${target} at editor height ${height}`);
      if (target === 'editor') assert.equal(edge.targetY, y + height / 2);
      if (source === 'editor') assert.equal(edge.sourceY, y + height / 2);
    }
  }
});
