import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deleteCanvasSelection, canvasNodes, arrangeImages, type CanvasImage } from '../src/canvas.ts';
const source: CanvasImage = {id:'a',name:'source',url:'/a.png',x:0,y:0,width:300,height:400,fusion:{prompt:'keep',ratio:'1:1',resolution:'4K',references:[{id:'ref',url:'/ref.png',name:'ref'}],position:{x:700,y:90}}};
test('deleting image clears content, preserves workflow geometry and original snapshot',()=>{
 const [empty]=deleteCanvasSelection([source],['a']);
 assert.equal(empty.nodeOnly,true); assert.equal(empty.url,''); assert.equal(empty.fusion?.prompt,''); assert.equal(empty.fusion?.references,undefined);
 assert.deepEqual(empty.fusion?.position,{x:700,y:90}); assert.equal(canvasNodes([empty]).length,1);
 const arranged=canvasNodes(arrangeImages([empty])); assert.equal(arranged.length,1); assert.equal(arranged[0].x,0);
 assert.equal(source.fusion?.prompt,'keep'); assert.equal(source.url,'/a.png');
 assert.deepEqual(deleteCanvasSelection([empty],['a:fusion']),[]);
});
test('node-only deletion preserves image; mixed deletion removes both',()=>{
 const [image]=deleteCanvasSelection([source],['a:fusion']);assert.equal(image.url,source.url);assert.equal(image.fusion,undefined);
 assert.deepEqual(deleteCanvasSelection([source],['a','a:fusion']),[]);
});
