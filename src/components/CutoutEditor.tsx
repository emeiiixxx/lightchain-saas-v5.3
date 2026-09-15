import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, Divider, Icon, type IconName } from './ui';
import type { CanvasImage } from '../canvas';
import './cutout-editor.css';

type Tool = 'brush' | 'lasso' | 'rect' | 'pen';
type Point = { x: number; y: number };
type Mark = { tool: Tool; subtract: boolean; size: number; points: Point[] };
type Props = { image: CanvasImage; phase: 'enter' | 'exit'; onClose: () => void; onApply: (url: string) => void };
export function CutoutEditor({ image, phase, onClose, onApply }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const mask = useRef<HTMLCanvasElement>(null);
  const brushCursor = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const active = useRef<Mark | null>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [subtract, setSubtract] = useState(false);
  const [size, setSize] = useState(40);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [future, setFuture] = useState<Mark[][]>([]);
  const history = useRef<Mark[][]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  // Editing coordinates are normalized to a 1000px-wide image.
  const height = 1000 * image.height / image.width;
  function paint(items: Mark[], color = '#20d0c4') {
    const c = mask.current!; const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const mark of items) {
      if (!mark.points.length) continue;
      ctx.globalCompositeOperation = mark.subtract ? 'destination-out' : 'source-over';
      ctx.fillStyle = ctx.strokeStyle = color; ctx.lineWidth = mark.size; ctx.lineCap = ctx.lineJoin = 'round';
      const first = mark.points[0]; ctx.beginPath(); ctx.moveTo(first.x, first.y);
      if (mark.tool === 'rect') {
        const last = mark.points.at(-1)!; ctx.rect(first.x, first.y, last.x - first.x, last.y - first.y); ctx.fill();
      } else if (mark.tool === 'brush') {
        if (mark.points.length === 1) {ctx.arc(first.x, first.y, mark.size / 2, 0, Math.PI * 2); ctx.fill();}
        else { for (const p of mark.points.slice(1)) ctx.lineTo(p.x, p.y); ctx.stroke(); }
      } else {for (const p of mark.points.slice(1)) ctx.lineTo(p.x, p.y); ctx.closePath(); ctx.fill();}
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  useEffect(() => { paint(marks); }, [marks]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = dialog.current!; el.showModal();
    return () => {el.close(); previous?.isConnected && previous.focus({preventScroll: true});};
  }, []);
  function save(next: Mark[]) { history.current.push(marks); setFuture([]); setMarks(next); setNotice(''); }
  function undo() {const previous = history.current.pop(); if (previous) {setFuture(f => [...f, marks]); setMarks(previous);}}
  function redo() {const next = future.at(-1); if (next) {history.current.push(marks); setFuture(f => f.slice(0, -1)); setMarks(next);}}
  function point(e: PointerEvent<HTMLCanvasElement>): Point {const r = e.currentTarget.getBoundingClientRect(); return {x: Math.max(0, Math.min(1000, (e.clientX-r.left)/r.width*1000)), y: Math.max(0, Math.min(height, (e.clientY-r.top)/r.height*height))};}
  function start(e: PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0 || busy) return;
    showCursor(e);
    if (tool === 'pen') { e.preventDefault(); const p = point(e); active.current = active.current?.tool === 'pen' ? {...active.current, points: [...active.current.points, p]} : {tool, subtract, size, points:[p]}; paint([...marks, active.current]); return; }
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    active.current = {tool, subtract, size, points: [point(e)]}; paint([...marks, active.current]);
  }
  function showCursor(e: PointerEvent<HTMLCanvasElement>) {
    const cursor = brushCursor.current;
    if (!cursor || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    cursor.style.left = `${(e.clientX - r.left) / r.width * 100}%`;
    cursor.style.top = `${(e.clientY - r.top) / r.height * 100}%`;
    cursor.style.visibility = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom ? 'visible' : 'hidden';
  }
  function hideCursor() { if (brushCursor.current) brushCursor.current.style.visibility = 'hidden'; }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    showCursor(e);
    if (!active.current || tool === 'pen') return;
    active.current.points.push(point(e)); paint([...marks, active.current]);
  }
  function end(e: PointerEvent<HTMLCanvasElement>) {
    if (!active.current || tool === 'pen') return;
    const mark = active.current; active.current = null; save([...marks, mark]);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  async function apply() {
    if (!marks.length || !picture.current?.complete) {setNotice('请先绘制想要抠出的区域'); return;}
    setBusy(true);
    try {
      const source = picture.current;
      const output = document.createElement('canvas'); output.width = source.naturalWidth; output.height = source.naturalHeight;
      const ctx = output.getContext('2d')!;
      paint(marks, '#fff');
      if (!mask.current!.getContext('2d')!.getImageData(0,0,1000,Math.round(height)).data.some((v,i) => i%4===3 && v>0)) throw new Error('empty');
      ctx.drawImage(source, 0, 0); ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask.current!, 0, 0, output.width, output.height);
      const blob = await new Promise<Blob | null>(resolve => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('export');
      onApply(URL.createObjectURL(blob));
    } catch {setNotice('未能抠出图片，请检查选区后重试');} finally {paint(marks); setBusy(false);}
  }
  const tools: {id: Tool; label: string; icon: IconName}[] = [
    {id:'brush',label:'涂抹',icon:'cutoutBrush'}, {id:'lasso',label:'套索',icon:'cutoutLasso'}, {id:'rect',label:'框选',icon:'cutoutRect'}, {id:'pen',label:'钢笔',icon:'cutoutPen'},
  ];
  return <dialog ref={dialog} className="cutout-editor" data-phase={phase} data-node-id="35:5131" inert={phase === 'exit'} aria-label="抠图" onCancel={e => {e.preventDefault(); onClose();}}
    onKeyDown={e => {if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {e.preventDefault(); e.stopPropagation(); if (e.shiftKey) redo(); else undo();}}}>
    <div className="cutout-layout">
      <div className="cutout-controls">
        <div className="cutout-toolbar" role="toolbar" aria-label="抠图工具">
          <span className="cutout-title">抠图</span><Divider vertical />
          <button className="cutout-tool" onClick={() => setNotice('AI 蒙版识别暂未接入，可先使用手动工具绘制')}><Icon name="cutoutAi" size={16}/>AI蒙版识别</button>
          {tools.map(item => <button key={item.id} className="cutout-tool" aria-pressed={tool===item.id} onClick={() => {active.current = null; paint(marks); setTool(item.id); if(item.id==='pen') setNotice('点击添加锚点，双击闭合选区'); else setNotice('');}}><Icon name={item.icon} size={16}/>{item.label}</button>)}
          <Divider vertical /><Button size="m" icon="cutoutClear" onClick={() => save([])}>清除选区</Button><Divider vertical />
          <Button size="m" aria-label="撤销" disabled={!history.current.length} onClick={undo}><Icon name="undoIcon" size={24}/></Button>
          <Button size="m" aria-label="重做" disabled={!future.length} onClick={redo}><Icon name="redoIcon" size={24}/></Button><Divider vertical />
          <Button size="m" variant="secondary" onClick={onClose}>取消</Button><Button size="m" variant="primary" disabled={busy} onClick={() => void apply()}>抠出</Button><Divider vertical />
          <Button size="m" icon="cutoutLibrary" onClick={() => setNotice('资源库暂未接入')}>收藏至资源库</Button>
        </div>
        <div className="cutout-brush-bar" role="toolbar" aria-label="选区设置">
          <button aria-pressed={!subtract} onClick={() => setSubtract(false)}><Icon name="cutoutAdd" size={16}/>加选</button>
          <button aria-pressed={subtract} onClick={() => setSubtract(true)}><Icon name="cutoutSubtract" size={16}/>减选</button><Divider vertical />
          <div className="cutout-slider"><Button aria-label="减小笔刷" onClick={() => setSize(v => Math.max(1,v-5))}><Icon name="cutoutMinus"/></Button>
            <input type="range" min="1" max="100" value={size} style={{ '--slider-progress': `${(size - 1) / 99 * 100}%` } as CSSProperties} aria-label="笔刷大小" onChange={e => setSize(Number(e.target.value))}/>
            <Button aria-label="增大笔刷" onClick={() => setSize(v => Math.min(100,v+5))}><Icon name="cutoutPlus"/></Button></div>
        </div>
      </div>
      <section className="cutout-image-panel"><header>绘制想要抠出的区域</header><div className="cutout-image-stage"><div className="cutout-image" style={{aspectRatio: `${image.width}/${image.height}`, width: `${Math.min(1, image.width/image.height)*100}%`}}>
        <img ref={picture} src={image.url} alt={image.name} crossOrigin="anonymous" draggable={false}/>
        <canvas data-brush={tool === 'brush'} onPointerEnter={showCursor} onPointerLeave={hideCursor} ref={mask} width={1000} height={Math.round(height)} aria-label="绘制抠图选区" onDoubleClick={() => {if(tool === 'pen' && active.current && active.current.points.length >= 3) {save([...marks, active.current]); active.current=null;}}} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={() => {hideCursor(); active.current=null; paint(marks);}}/>
        <div ref={brushCursor} aria-hidden="true" className="cutout-brush-cursor" hidden={tool !== 'brush'} style={{width: `${size / 10}%`}}/>
      </div></div></section>
      {notice && <p className="cutout-notice" role="status">{notice}</p>}
    </div>
  </dialog>;
}
