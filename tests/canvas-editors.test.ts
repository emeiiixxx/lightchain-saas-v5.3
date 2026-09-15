import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFusionEditor, canvasNodes, deleteCanvasSelection, arrangeImages, relatedCanvasIds, type CanvasImage} from '../src/canvas.ts';
const source:CanvasImage={id:'main',name:'main',url:'main.png',x:0,y:0,width:360,height:480};
test('repeated creation produces independent editors, one source and no overlapping bounds',()=>{
 const items=[source];
 for(let i=0;i<8;i++)items.push(createFusionEditor(items,'main',`editor-${i}`)!);
 assert.equal(items.filter(n=>!n.nodeOnly).length,1);
 assert.equal(canvasNodes(items).length,9);
 items[1].fusion!.prompt='first';assert.equal(items[2].fusion!.prompt,'');
 const nodes=canvasNodes(items);
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y));}
 assert.equal(relatedCanvasIds(items,['editor-3:fusion']).size,9);
 const arranged=arrangeImages(items);assert.equal(arranged.length,9);assert.equal(relatedCanvasIds(arranged,['main']).size,9);
 const deleted=deleteCanvasSelection(items,['editor-1:fusion']);assert.equal(deleted.length,8);assert(deleted.some(n=>n.id==='main'));
 const cleared=deleteCanvasSelection(items,['main']);assert.equal(cleared.length,8);assert(cleared.every(n=>n.nodeOnly&&!n.editorSourceId&&n.fusion?.prompt===''));
 assert.equal(createFusionEditor(items,'missing','new'),null);
});
