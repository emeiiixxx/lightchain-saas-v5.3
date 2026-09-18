import assert from 'node:assert/strict';
import { test } from 'node:test';
import { arrangeImages, canvasNodes, canvasSafeArea, fitImages, boundsOf, type CanvasImage } from '../src/canvas.ts';
const fixtures = (count: number): CanvasImage[] => Array.from({ length: count }, (_, i) => ({
  id: String(i), name: String(i), url: '', x: i * 17, y: -i * 53,
  width: 240 + i % 3 * 60, height: 300 + i % 4 * 90,
  fusion: i % 3 !== 0 ? { prompt: 'keep me', ratio: 'auto', resolution: '2K' } : undefined,
}));
function assertNoOverlap(items: CanvasImage[]) {
  const nodes = canvasNodes(items);
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    assert(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y,
      `${a.id} overlaps ${b.id}`);
  }
}
for (const viewport of [{width:1816,height:1180},{width:1280,height:752},{width:1024,height:852},{width:640,height:1100}]) {
  test(`arrange and fit ${viewport.width}x${viewport.height}`, () => {
    for (const count of [1,2,3,7,20]) {
      const input = fixtures(count), original = JSON.stringify(input);
      const arranged = arrangeImages(input, 0, viewport);
      assert.equal(JSON.stringify(input), original);
      assert.deepEqual(arranged.map(n=>n.id),input.map(n=>n.id));
      assert.deepEqual(arrangeImages(arranged,0,viewport),arranged);
      for(const n of arranged) if(n.fusion) {
        assert.equal(n.fusion.position!.x - n.x - n.width,80);
        const editor = canvasNodes([n]).find(node => node.id === `${n.id}:fusion`)!;
        assert.equal(editor.y + editor.height / 2,n.y + n.height / 2);
        assert.equal(n.fusion.prompt,'keep me');
      }
      assertNoOverlap(arranged);
      const related = boundsOf(canvasNodes(arranged.filter(n=>n.fusion)));
      if (related) for (const standalone of arranged.filter(n=>!n.fusion)) {
        assert(standalone.y > related.y + related.height);
      }
      const nodes=canvasNodes(arranged),b=boundsOf(nodes)!,a=canvasSafeArea(viewport.width,viewport.height),v=fitImages(nodes,viewport.width,viewport.height);
      assert(v.zoom<=1&&v.zoom>=.03);
      assert(b.x*v.zoom+v.x>=a.x-1e-6);
      assert(b.y*v.zoom+v.y>=a.y-1e-6);
      assert((b.x+b.width)*v.zoom+v.x<=a.x+a.width+1e-6);
      assert((b.y+b.height)*v.zoom+v.y<=a.y+a.height+1e-6);
    }
  });
}
test('viewport aspect ratio changes the arranged column count',()=>{
  const input=fixtures(12).map(n=>({...n, width:240, height:300, fusion:undefined}));
  const wide=arrangeImages(input,0,{width:2000,height:650});
  const tall=arrangeImages(input,0,{width:700,height:1200});
  assert(wide.filter(n=>n.y===0).length>tall.filter(n=>n.y===0).length);
});
test('empty and minimum zoom are defined',()=>{
  assert.deepEqual(arrangeImages([]),[]);
  assert.deepEqual(fitImages([],100,100),{x:0,y:0,zoom:1});
  assert.equal(fitImages([{...fixtures(1)[0],width:1e6,height:1e6}],1000,800).zoom,.03);
});

test('source chains retain their relationships and standalone images occupy the bottom zone',()=>{
 const image=(id:string,sourceImageId?:string):CanvasImage=>({id,name:id,url:'',x:20,y:90,width:100,height:150,sourceImageId});
 const input=[image('solo'),image('child','root'),{...image('root'),fusion:{prompt:'keep',ratio:'auto',resolution:'2K'}},image('grandchild','child'),image('orphan','deleted')];
 const arranged=arrangeImages(input,50);
 const get=(id:string)=>arranged.find(n=>n.id===id)!;
 assert.equal(get('root').x,50);
 assert(get('child').x>=get('root').x+get('root').width+80);
 assert(get('grandchild').x>=get('child').x+get('child').width+80);
 assert.deepEqual(arranged.map(n=>[n.id,n.sourceImageId]),input.map(n=>[n.id,n.sourceImageId]));
 assertNoOverlap(arranged);
 const group=boundsOf(canvasNodes(arranged.filter(n=>['root','child','grandchild'].includes(n.id))))!;
 for(const id of ['solo','orphan']) assert(get(id).y>group.y+group.height);
 assert.deepEqual(arrangeImages(arranged,50),arranged);
});
