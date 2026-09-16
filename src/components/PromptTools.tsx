import { ProgressiveImage } from './ProgressiveImage';
import { notify } from './Toast';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from './ui';
import { usePresence } from '../usePresence';
import './prompt-tools.css';
import { associatedImages, demoPrompts, type PromptEntry as Entry } from '../prompt-associations';
const KEY='lc-flow-fusion-prompts';
function readSaved(): Entry[] {try {const raw=JSON.parse(localStorage.getItem(KEY)||'[]');const data: unknown=raw?.version===2?raw.entries:raw;return Array.isArray(data)?data.flatMap((v,i)=>typeof v==='string'?[{id:`legacy-${i}`,name:v.slice(0,50),content:v}]:v && typeof v.name==='string' && typeof v.content==='string'?[{id:v.id||`legacy-${i}`,name:v.name,content:v.content,pinned:v.pinned===true}]:[]):[];}catch{return [];}}
function read(): Entry[] {const saved=readSaved();try{if(JSON.parse(localStorage.getItem(KEY)||'null')?.version===2)return saved;}catch{}return [...saved,...demoPrompts.filter(d=>!saved.some(e=>e.id===d.id))];}
export function PromptTools({value,onChange,labels}:{value:string;onChange:(v:string)=>void;labels:{expand:string;save:string;library:string;prompt:string;clear:string;close:string}}){
 const [editorOpen,setEditorOpen]=useState(false), editorShown=usePresence(editorOpen?true:null);
 const [libraryOpen,setLibraryOpen]=useState(false), libraryShown=usePresence(libraryOpen?true:null);
 const [anchor,setAnchor]=useState<HTMLElement|null>(null), saveShown=usePresence(anchor);
 const [entries,setEntries]=useState<Entry[]>(read);
 const store=(next:Entry[])=>{try{localStorage.setItem(KEY,JSON.stringify({version:2,entries:next}));setEntries(next);window.dispatchEvent(new Event('lc-prompts-changed'));return true;}catch{notify('保存失败，请检查浏览器存储空间');return false;}};
 useEffect(()=>{const refresh=()=>setEntries(read());window.addEventListener('storage',refresh);window.addEventListener('lc-prompts-changed',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('lc-prompts-changed',refresh);};},[]);
 const save=(el:HTMLElement)=>{if(!value.trim()){notify('请输入提示词后再保存');return;}setAnchor(el);};
 const openLibrary=()=>{setEntries(read());setLibraryOpen(true);};
 const actions=(large=false)=><><Button className={large?'':'fusion-xs-icon'} aria-label={labels.save} onClick={e=>save(e.currentTarget)}><Icon name="fusionSave" size={large?20:16}/></Button><Button className={large?'':'fusion-xs-icon'} aria-label={labels.library} onClick={openLibrary}><Icon name="fusionPrompts" size={large?20:16}/></Button></>;
 return <><Button className="fusion-xs-icon" aria-label={labels.expand} onClick={()=>setEditorOpen(true)}><Icon name="fusionExpand" size={16}/></Button>{actions()}
 {editorShown.value&&createPortal(<ExpandedPrompt phase={editorShown.phase} title={labels.prompt} value={value} onChange={onChange} onClose={()=>setEditorOpen(false)} actions={actions(true)} clear={labels.clear}/>,document.body)}
 {libraryShown.value&&createPortal(<PromptLibrary phase={libraryShown.phase} entries={entries} onStore={store} onClose={()=>setLibraryOpen(false)} onApply={(text,mode)=>{const next=mode==='append'&&value.trim()?value+(value.endsWith('\n')?'':'\n')+text:text;if(next.length>2000){notify('合并后超过 2000 字，请先精简原文或选择覆盖');return;}onChange(next);setLibraryOpen(false);}}/>,document.body)}
 {saveShown.value&&createPortal(<SavePrompt anchor={saveShown.value} phase={saveShown.phase} onClose={()=>setAnchor(null)} onSave={name=>{if(store([{id:crypto.randomUUID(),name,content:value},...entries]))setAnchor(null);}}/>, saveShown.value.closest('dialog')??document.body)}
 </>;
}
function SavePrompt({anchor,phase,onClose,onSave}:{anchor:HTMLElement;phase:'enter'|'exit';onClose:()=>void;onSave:(name:string)=>void}){
 const ref=useRef<HTMLDivElement>(null);const [name,setName]=useState('');
 useLayoutEffect(()=>{const el=ref.current!;el.showPopover();let frame=0;const place=()=>{const r=anchor.getBoundingClientRect();el.style.left=`${Math.max(8,Math.min(r.left,innerWidth-el.offsetWidth-8))}px`;el.style.top=`${Math.max(8,r.top-el.offsetHeight-8>=8?r.top-el.offsetHeight-8:Math.min(r.bottom+8,innerHeight-el.offsetHeight-8))}px`;frame=requestAnimationFrame(place);};place();el.querySelector('input')?.focus({preventScroll:true});return()=>cancelAnimationFrame(frame);},[anchor]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!ref.current?.contains(e.target)&&!anchor.contains(e.target))onClose();};document.addEventListener('pointerdown',outside,true);return()=>document.removeEventListener('pointerdown',outside,true);},[anchor,onClose]);
 return <div ref={ref} popover="manual" data-overlay data-select-popup role="dialog" aria-label="保存提示词" className="prompt-save-popover" data-phase={phase} inert={phase==='exit'} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();anchor.focus({preventScroll:true});}if(e.key==='Enter'&&name.trim()){e.preventDefault();onSave(name.trim());}}}>
 <header><h3>保存提示词</h3><Button aria-label="关闭" onClick={onClose}><Icon name="close" size={16}/></Button></header>
 <label className="prompt-name-input"><input aria-label="提示词名称" placeholder="请输入名称" value={name} maxLength={50} onChange={e=>setName(e.target.value)}/><span>{name.length}/50</span></label>
 <footer><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" disabled={!name.trim()} onClick={()=>onSave(name.trim())}>保存</Button></footer></div>;
}
function useModal(ref:React.RefObject<HTMLDialogElement|null>){useEffect(()=>{const old=document.activeElement as HTMLElement|null;const el=ref.current!;el.showModal();return()=>{el.close();if(old?.isConnected)old.focus({preventScroll:true});};},[]);}
function ExpandedPrompt({phase,title,value,onChange,onClose,actions,clear}:{phase:'enter'|'exit';title:string;value:string;onChange:(v:string)=>void;onClose:()=>void;actions:React.ReactNode;clear:string}){
 const ref=useRef<HTMLDialogElement>(null);useModal(ref);
 const [box,setBox]=useState(()=>({x:Math.max(16,(innerWidth-960)/2),y:Math.max(96,(innerHeight-680)/2),w:Math.min(960,innerWidth-32),h:Math.min(640,innerHeight-152)}));
 const drag=useRef<{x:number;y:number;box:typeof box;corner:string}|null>(null);
 useEffect(()=>{const resize=()=>setBox(b=>({...b,w:Math.min(b.w,innerWidth-32),h:Math.min(b.h,innerHeight-152),x:Math.max(16,Math.min(b.x,innerWidth-Math.min(b.w,innerWidth-32)-16)),y:Math.max(96,Math.min(b.y,innerHeight-Math.min(b.h,innerHeight-152)-56))}));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const move=(e:ReactPointerEvent)=>{const d=drag.current;if(!d)return;const west=d.corner.includes('w'),north=d.corner.includes('n');const w=Math.max(Math.min(320,innerWidth-32),Math.min(1280,west?d.box.x+d.box.w-16:innerWidth-d.box.x-16,d.box.w+(e.clientX-d.x)*(west?-1:1)));const h=Math.max(160,Math.min(720,north?d.box.y+d.box.h-96:innerHeight-d.box.y-56,d.box.h+(e.clientY-d.y)*(north?-1:1)));setBox({x:west?d.box.x+d.box.w-w:d.box.x,y:north?d.box.y+d.box.h-h:d.box.y,w,h});};
 return <dialog ref={ref} data-overlay data-select-popup className="prompt-fullscreen" data-phase={phase} inert={phase==='exit'} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
 <p className="prompt-screen-tip">💡Tips：支持按 esc 或点击空白处退出全屏输入框</p>
 <section className="prompt-expanded" style={{left:box.x,top:box.y,width:box.w}}><header><h2>{title}</h2><Button aria-label="收起输入框" onClick={onClose}><Icon name="promptCollapse"/></Button></header>
 <div className="prompt-expanded-field" style={{height:box.h}}><textarea autoFocus aria-label={title} value={value} maxLength={2000} onChange={e=>onChange(e.target.value)}/><footer><div>{actions}</div><span>{value.length}/2000</span><Button variant="secondary" onClick={()=>onChange('')}>{clear}</Button></footer>
 {['nw','ne','sw','se'].map(c=><span key={c} className={`prompt-resize ${c}`} aria-hidden="true" onPointerDown={e=>{e.preventDefault();drag.current={x:e.clientX,y:e.clientY,box,corner:c};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>)}<img className="prompt-resize-mark" src="/assets/fusion/promptResize.svg" alt=""/></div></section></dialog>;
}
function PromptLibrary({phase,entries,onStore,onApply,onClose}:{phase:'enter'|'exit';entries:Entry[];onStore:(e:Entry[])=>boolean;onApply:(text:string,mode:'append'|'replace')=>void;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);useModal(ref);const [selected,setSelected]=useState(entries[0]?.id??'');const [query,setQuery]=useState('');const [draft,setDraft]=useState<Entry|null>(null);
 const [menu,setMenu]=useState<{entry:Entry;anchor:HTMLElement}|null>(null);
 const previousSelection=useRef(selected);
 const isNew=!!draft&&!entries.some(e=>e.id===draft.id);
 const cancelDraft=()=>{if(isNew)setSelected(entries.some(e=>e.id===previousSelection.current)?previousSelection.current:(entries[0]?.id??''));setDraft(null);};
 const addPrompt=()=>{setQuery('');if(isNew)return;previousSelection.current=selected;const entry={id:crypto.randomUUID(),name:'',content:''};setDraft(entry);setSelected(entry.id);};
 useEffect(()=>{if(isNew){ref.current?.querySelector('nav')?.scrollTo({top:0});ref.current?.querySelector<HTMLInputElement>('[aria-label="编辑提示词名称"]')?.focus({preventScroll:true});}},[isNew]);
 const related=associatedImages(entries.find(e=>e.id===selected));
 const sorted=[...entries].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
 const listed=isNew?[draft!,...sorted]:sorted;
 const removeEntry=(id:string)=>{const next=entries.filter(e=>e.id!==id);if(onStore(next)){if(selected===id){setSelected([...next].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned))[0]?.id??'');setDraft(null);}setMenu(null);}};
 const togglePin=()=>{
   if(!menu)return;
   const entry=entries.find(e=>e.id===menu.entry.id);if(!entry)return;
   const pinned=!entry.pinned;
   const updated={...entry,pinned};
   // Most recently pinned goes first, including ahead of older pinned entries.
   const rest=entries.filter(e=>e.id!==entry.id);
   const next=pinned?[updated,...rest]:[...rest.filter(e=>e.pinned),updated,...rest.filter(e=>!e.pinned)];
   if(onStore(next)){
     if(draft?.id===entry.id)setDraft({...draft,pinned});
     setMenu(null);
     requestAnimationFrame(()=>ref.current?.querySelector('nav')?.scrollTo({top:0}));
     notify(pinned?'已置顶':'已取消置顶');
   }
 };
 const visible=listed.filter(e=>(e.name+' '+e.content).toLowerCase().includes(query.toLowerCase()));const current=entries.find(e=>e.id===selected);
 return <dialog ref={ref} data-overlay data-select-popup className="prompt-library" data-phase={phase} inert={phase==='exit'} aria-label="提示词库" onCancel={e=>{e.preventDefault();onClose();}}>
 <aside><header><div><h2>提示词库</h2><Button aria-label="新增提示词" onClick={addPrompt}><Icon name="cutoutPlus"/></Button></div><label className="prompt-library-search"><Icon name="search"/><input aria-label="搜索提示词" placeholder="请输入关键词搜索" value={query} onChange={e=>setQuery(e.target.value)}/></label></header>
 <nav>{visible.map(entry=><div className="prompt-list-card" key={entry.id} data-selected={selected===entry.id}>
 <button className="prompt-card-select" aria-pressed={selected===entry.id} onClick={()=>{setSelected(entry.id);if(entry.id!==draft?.id)setDraft(null);}}><strong>{entry.pinned&&<span className="prompt-pinned-tag">置顶</span>}<span className="prompt-card-title">{entry.name||'Untitled'}</span></strong><p>{entry.content||'请输入提示词内容...'}</p></button>
 {entries.some(e=>e.id===entry.id)&&<Button className="prompt-card-more" aria-label={`更多 · ${entry.name||'Untitled'}`} aria-haspopup="menu" aria-expanded={menu?.entry.id===entry.id} onClick={e=>setMenu(menu?.entry.id===entry.id?null:{entry,anchor:e.currentTarget})}><Icon name="promptMore" size={20}/></Button>}
 </div>)}{!visible.length&&<p className="prompt-empty">{entries.length?'没有匹配的提示词':'暂无保存的提示词'}</p>}</nav></aside>
 {menu&&<PromptCardMenu anchor={menu.anchor} pinned={!!menu.entry.pinned} onClose={()=>setMenu(null)} onPin={togglePin} onDelete={()=>removeEntry(menu.entry.id)}/>}

 <section><header><h2>{isNew?'新增提示词':'提示词详情'}</h2><Button aria-label="关闭" onClick={onClose}><Icon name="close"/></Button></header>
 <div className={`prompt-library-body ${!draft&&related.length?'has-related':''}`}>{draft?<><label><span>提示词标题 <em className="prompt-required">*</em></span><div className="prompt-edit-title"><input aria-label="编辑提示词名称" placeholder="请输入名称" required maxLength={50} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><span>{draft.name.length}/50</span></div></label><label className="prompt-content-edit"><span>提示词内容 <em className="prompt-required">*</em></span><div className="prompt-edit-content"><textarea aria-label="编辑提示词内容" placeholder="请输入提示词内容..." required maxLength={2000} value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})}/><span>{draft.content.length}/2000</span></div></label></>:current?<><div className="prompt-detail-card" data-node-id="111:5494"><h3>{current.name}</h3><p className="prompt-detail-content">{current.content}</p></div>{related.length>0&&<div className="prompt-related" data-node-id="107:5226"><h3>关联图片</h3><div className="prompt-related-scroll"><div className="prompt-related-grid">{related.map(image=><figure key={image.id}><ProgressiveImage src={image.url} alt={image.name}/><figcaption>{image.role}</figcaption></figure>)}</div></div></div>}</>:<p className="prompt-empty">选择或新增一条提示词</p>}</div>
 <footer>{draft?<>{<Button variant="outline" className="prompt-delete" size="m" onClick={()=>{if(isNew){cancelDraft();return;}const next=entries.filter(entry=>entry.id!==draft.id);if(onStore(next)){setSelected(next[0]?.id??'');setDraft(null);}}}><Icon name="promptTrash" size={20}/>删除</Button>}<Button variant="secondary" size="m" onClick={cancelDraft}>取消</Button><Button variant="primary" size="m" disabled={!draft.name.trim()||!draft.content.trim()} onClick={()=>{const entry={...draft,name:draft.name.trim()};if(onStore([entry,...entries.filter(e=>e.id!==entry.id)])){setSelected(entry.id);setDraft(null);}}}>保存</Button></>:<><Button variant="outline" size="m" disabled={!current} onClick={()=>setDraft(current??null)}><Icon name="promptEdit" size={20}/>编辑</Button><Button variant="outline" size="m" disabled={!current} onClick={()=>{if(current)onApply(current.content,'append');}}>在已有输入后插入</Button><Button variant="primary" size="m" disabled={!current} onClick={()=>{if(current)onApply(current.content,'replace');}}>应用并覆盖原文</Button></>}</footer></section></dialog>;
}

function PromptCardMenu({anchor,pinned,onClose,onPin,onDelete}:{anchor:HTMLElement;pinned:boolean;onClose:()=>void;onPin:()=>void;onDelete:()=>void}){
 const ref=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
   const el=ref.current!;el.showPopover();
   const place=()=>{const r=anchor.getBoundingClientRect();el.style.left=`${Math.max(8,Math.min(r.right-el.offsetWidth,innerWidth-el.offsetWidth-8))}px`;el.style.top=`${r.bottom+4+el.offsetHeight>innerHeight-8?Math.max(8,r.top-el.offsetHeight-4):r.bottom+4}px`;};
   place();el.querySelector<HTMLElement>('[role="menuitem"]')?.focus({preventScroll:true});
   window.addEventListener('resize',place);document.addEventListener('scroll',place,true);
   return()=>{window.removeEventListener('resize',place);document.removeEventListener('scroll',place,true);};
 },[anchor]);
 return <div ref={ref} popover="auto" role="menu" aria-label="提示词操作" className="prompt-card-menu" onToggle={e=>{if(e.newState==='closed')onClose();}} onKeyDown={e=>{const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const i=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();anchor.focus({preventScroll:true});}}}>
 <button role="menuitem" onClick={()=>{onPin();anchor.focus({preventScroll:true});}}><Icon name="promptPin"/>{pinned?'取消置顶':'置顶'}</button>
 <button role="menuitem" onClick={onDelete}><Icon name="promptTrash"/>删除</button>
 </div>;
}
