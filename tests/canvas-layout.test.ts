import assert from 'node:assert/strict';
import { test } from 'node:test';
import { arrangeImages, canvasNodes, canvasSafeArea, fitImages, boundsOf, type CanvasImage } from '../src/canvas.ts';
const fixtures = (count: number): CanvasImage[] => Array.from({ length: count }, (_, i) => ({
  id: String(i), name: String(i), url: '', x: i * 17, y: -i * 53,
  width: 240 + i % 3 * 60, height: 300 + i % 4 * 90,
  fusion: i % 3 !== 0 ? { prompt: 'keep me', ratio: 'auto', resolution: '2K' } : undefined,
}));
for (const viewport of [{width:1816,height:1180},{width:1280,height:752},{width:1024,height:852},{width:640,height:1100}]) {
  test(`arrange and fit ${viewport.width}x${viewport.height}`, () => {
    for (const count of [1,2,3,7,20]) {
      const input = fixtures(count), original = JSON.stringify(input);
      const arranged = arrangeImages(input, 0, viewport);
      assert.equal(JSON.stringify(input), original);
      assert.deepEqual(arranged.map(n=>n.id),input.map(n=>n.id));
      assert.deepEqual(arrangeImages(arranged,0,viewport),arranged);
      const rows = [...new Set(arranged.map(n=>n.y))];
      for(const n of arranged) if(n.fusion) {
        assert.equal(n.fusion.position!.x - n.x - n.width,80);
        assert.equal(n.fusion.position!.y,n.y);
        assert.equal(n.fusion.prompt,'keep me');
      }
      rows.forEach((y,index)=>{
        const row=arranged.filter(n=>n.y===y);
        row.slice(1).forEach((n,i)=>{
          const previous=boundsOf(canvasNodes([row[i]]))!;
          assert.equal(n.x-previous.x-previous.width,120);
        });
        if(index+1<rows.length){const b=boundsOf(canvasNodes(row))!;assert.equal(rows[index+1]-b.y-b.height,120);}
      });
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
  const input=fixtures(12);
  const wide=arrangeImages(input,0,{width:2000,height:650});
  const tall=arrangeImages(input,0,{width:700,height:1200});
  assert(wide.filter(n=>n.y===0).length>tall.filter(n=>n.y===0).length);
});
test('empty and minimum zoom are defined',()=>{
  assert.deepEqual(arrangeImages([]),[]);
  assert.deepEqual(fitImages([],100,100),{x:0,y:0,zoom:1});
  assert.equal(fitImages([{...fixtures(1)[0],width:1e6,height:1e6}],1000,800).zoom,.03);
});
