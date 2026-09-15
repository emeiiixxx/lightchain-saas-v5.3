import assert from 'node:assert/strict';
import {test} from 'node:test';
import {relatedCanvasIds, type CanvasImage} from '../src/canvas.ts';
const image=(id:string,sourceImageId?:string):CanvasImage=>({id,sourceImageId,name:id,url:'',x:0,y:0,width:100,height:100});
const items=[image('root'),image('child','root'),image('grandchild','child'),image('unrelated')];
test('selecting an image or its editor raises the full source chain only',()=>{
 for(const id of ['root','child','grandchild','root:fusion'])assert.deepEqual([...relatedCanvasIds(items,[id])].sort(),['child','grandchild','root']);
 assert.deepEqual([...relatedCanvasIds(items,['unrelated'])],['unrelated']);
 assert.equal(relatedCanvasIds(items,[]).size,0);
});
test('deleted sources and empty editor records do not link unrelated images',()=>{
 const empty={...image('root'),nodeOnly:true};
 assert.deepEqual([...relatedCanvasIds([empty,...items.slice(1)],['root:fusion'])],['root']);
});
