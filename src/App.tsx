import { notify, ToastHost } from './components/Toast';
import { CutoutEditor } from './components/CutoutEditor';
import { fusionReferences, MAX_FUSION_REFERENCES, type FusionReference } from './canvas';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { assets } from './assets';
import { Button, Dialog, Divider, Icon, type IconName } from './components/ui';
import { DEFAULT_VIEW, createFusionEditor, relatedCanvasIds, deleteCanvasSelection, CANVAS_GRID_SIZE, gridDragDelta, canvasSafeArea, GROUP_GAP, canvasNodes, defaultFusion, fusionPosition, arrangeImages, boundsOf, fitImages, readImage, zoomAt, type CanvasImage, type FusionSettings, type Viewport } from './canvas';
import { locales, messages, type Locale } from './i18n';
import { usePresence } from './usePresence';
import { AssetPicker } from './components/AssetPicker';
import type { LibraryImage } from './asset-library';
import { SelectionToolbar } from './components/SelectionToolbar';
import { CanvasChrome } from './components/CanvasChrome';
import { FullImageViewer } from './components/FullImageViewer';
import { FusionNode } from './components/FusionNode';
import { ImageConnection } from './components/FusionConnection';

type Theme = 'dark' | 'light' | 'system';
type Tool = 'cutout' | 'fusion' | 'directed' | 'flat';
type Modal = Tool | 'upload' | 'help' | 'support' | 'credits' | 'project' | null;
type PendingImage = Omit<CanvasImage, 'x' | 'y'>;
const tools: { id: Tool; icon: IconName; nodeId: string }[] = [
  { id: 'cutout', icon: 'imgIconImageEditingTool', nodeId: '57:25873' },
  { id: 'fusion', icon: 'imgIconBusinessAi', nodeId: '14:3571' },
  { id: 'directed', icon: 'imgIconBusinessApparelDesign', nodeId: '14:3579' },
  { id: 'flat', icon: 'imgIconBusinessTryOnModel', nodeId: '14:3610' },
];
function saved(key: string, fallback: string) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function save(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable in private browsing. */ } }
const isField = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable="true"]');

export default function App() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.focusNavigation = 'pointer';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') root.dataset.focusNavigation = 'keyboard';
    };
    const onPointerDown = () => { root.dataset.focusNavigation = 'pointer'; };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      delete root.dataset.focusNavigation;
    };
  }, []);
  const gridPatternId = useId();
  const [locale, setLocale] = useState<Locale>(() => { const v = saved('lc-flow-locale', 'zh-CN'); return v === 'en' || v === 'ja' ? v : 'zh-CN'; });
  const [theme, setTheme] = useState<Theme>(() => { const v = saved('lc-flow-theme', 'dark'); return v === 'light' || v === 'system' ? v : 'dark'; });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [projectName, setProjectName] = useState(() => saved('lc-flow-project-name', 'Untitle'));
  const [menu, setMenu] = useState<'language' | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [referenceTarget, setReferenceTarget] = useState<string | null>(null);
  const shownReference = usePresence(referenceTarget);
  const [canvasReference, setCanvasReference] = useState<{ target: string; ids: string[] } | null>(null);
  const shownCanvasReference = usePresence(canvasReference);
  const canvasReferenceCount = canvasReference ? fusionReferences(images.find(n => n.id === canvasReference.target)?.fusion).length + canvasReference.ids.length : 0;
  const [uploads, setUploads] = useState<LibraryImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const raisedIds = useMemo(() => relatedCanvasIds(images, canvasReference ? canvasReference.ids : selectedIds), [images, selectedIds, canvasReference]);
  const foregroundIds = useMemo(() => {
    const ids = new Set(canvasReference ? canvasReference.ids : selectedIds);
    if (canvasReference) return ids;
    const editors = images.filter(item => item.fusion && selectedIds.includes(`${item.id}:fusion`));
    const editorIds = new Set(editors.map(item => item.id));
    for (const editor of editors) {
      const sourceId = editor.editorSourceId ?? (!editor.nodeOnly ? editor.id : undefined);
      if (sourceId) ids.add(sourceId);
    }
    for (const image of images) {
      if (!image.nodeOnly && !image.sourceImageId && image.generatedByEditorId && editorIds.has(image.generatedByEditorId)) ids.add(image.id);
    }
    return ids;
  }, [images, selectedIds, canvasReference]);
  const [snapToGrid, setSnapToGrid] = useState(() => localStorage.getItem('lc-flow-grid-snap') !== 'off');
  const [canvasMode, setCanvasMode] = useState<'select' | 'hand'>('select');
  const [snapGuide, setSnapGuide] = useState<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [mainTarget, setMainTarget] = useState<string | null>(null);
  const shownMainTarget = usePresence(mainTarget);
  const [cutoutImage, setCutoutImage] = useState<CanvasImage | null>(null);
  const shownCutout = usePresence(cutoutImage);
  const [previewImage, setPreviewImage] = useState<CanvasImage | null>(null);
  const [view, commitView] = useState<Viewport>(DEFAULT_VIEW);
  const cameraFrame = useRef<number | null>(null);
  const setView = useCallback((next: Viewport | ((previous: Viewport) => Viewport)) => {
    if (cameraFrame.current !== null) cancelAnimationFrame(cameraFrame.current);
    cameraFrame.current = null;
    commitView(next);
  }, []);
  useEffect(() => () => {
    if (cameraFrame.current !== null) cancelAnimationFrame(cameraFrame.current);
  }, []);
  const canvasTransform = `matrix(${view.zoom}, 0, 0, ${view.zoom}, ${view.x}, ${view.y})`;
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight - 48 });
  const measuredCanvasSize = useRef(canvasSize);
  const [reading, setReading] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [initialDropActive, setInitialDropActive] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const t = messages[locale];
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const canvas = useRef<HTMLDivElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const ownedUrls = useRef(new Set<string>());
  type Snapshot = { images: CanvasImage[]; selectedIds: string[] };
  const history = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const selectedRef = useRef(selectedIds); selectedRef.current = selectedIds;
  const gesture = useRef<{ pointerId: number; type: 'pan' | 'image' | 'fusion' | 'marquee'; clickedId?: string; ids: string[]; additive: boolean; x: number; y: number; view: Viewport; images: CanvasImage[]; changed: boolean } | null>(null);
  const viewRef = useRef(view); viewRef.current = view;
  const animateView = useCallback((target: Viewport) => {
    if (cameraFrame.current !== null) cancelAnimationFrame(cameraFrame.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setView(target); return; }
    const from = viewRef.current;
    const started = performance.now();
    // CSS ease-out = cubic-bezier(0, 0, .58, 1); solve its time axis.
    const frame = (now: number) => {
      const progress = Math.min(1, (now - started) / 200);
      let low = 0, high = 1;
      for (let i = 0; i < 20; i++) {
        const t = (low + high) / 2;
        const x = 1.74 * (1 - t) * t * t + t * t * t;
        if (x < progress) low = t; else high = t;
      }
      const t = (low + high) / 2;
      const eased = 3 * (1 - t) * t * t + t * t * t;
      const next = progress === 1 ? target : {
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        zoom: from.zoom + (target.zoom - from.zoom) * eased,
      };
      viewRef.current = next;
      commitView(next);
      cameraFrame.current = progress < 1 ? requestAnimationFrame(frame) : null;
    };
    cameraFrame.current = requestAnimationFrame(frame);
  }, [setView]);
  const imageRef = useRef(images); imageRef.current = images;
  const uploadEpoch = useRef(0);
  const shownMenu = usePresence(menu);
  const shownModal = usePresence(modal);
  const shownPreview = usePresence(previewImage);
  const selection = useMemo(() => {
    const items = canvasNodes(images).filter(n => selectedIds.includes(n.id));
    const hasWorkflow = images.some(n => n.fusion && selectedIds.includes(`${n.id}:fusion`));
    const bounds = boundsOf(items);
    return bounds && (!hasWorkflow || items.length > 1) ? { bounds, count: items.length, showToolbar: !hasWorkflow } : null;
  }, [images, selectedIds]);
  const shownSelection = usePresence(selection);
  const shownSnapGuide = usePresence(snapGuide);
  const shownDrop = usePresence(dropActive ? 'drop' : null);
  const navigationNodes = useMemo(() => canvasNodes(images), [images]);
  const nodesOutsideView = images.length > 0 && !navigationNodes.some(image => {
    const left = image.x * view.zoom + view.x;
    const top = image.y * view.zoom + view.y;
    return left < canvasSize.width && top < canvasSize.height && left + image.width * view.zoom > 0 && top + image.height * view.zoom > 0;
  });
  const shownReturnToNodes = usePresence(nodesOutsideView ? 'return' : null);
  const activeTool = tools.find(tool => tool.id === shownModal.value);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setSystemDark(media.matches);
    media.addEventListener('change', listener); return () => media.removeEventListener('change', listener);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = resolvedTheme; document.documentElement.style.colorScheme = resolvedTheme; save('lc-flow-theme', theme); }, [theme, resolvedTheme]);
  useEffect(() => { document.documentElement.lang = locale; save('lc-flow-locale', locale); }, [locale]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const update = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      const previous = measuredCanvasSize.current;
      measuredCanvasSize.current = next;
      if (next.width === previous.width && next.height === previous.height) return;
      setCanvasSize(next);
      // Resize preserves the world point at the viewport center and zoom.
      setView(v => ({ ...v, x: v.x + (next.width - previous.width) / 2, y: v.y + (next.height - previous.height) / 2 }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { save('lc-flow-project-name', projectName); }, [projectName]);
  useEffect(() => {
    const blurProjectName = (event: PointerEvent) => {
      const input = projectInput.current;
      if (input && document.activeElement === input && event.target !== input) input.blur();
    };
    // Run before canvas gestures prevent the browser's default focus transfer.
    document.addEventListener('pointerdown', blurProjectName, true);
    return () => document.removeEventListener('pointerdown', blurProjectName, true);
  }, []);
  useEffect(() => () => { for (const url of ownedUrls.current) URL.revokeObjectURL(url); }, []);
  useEffect(() => {
    if (!menu) return;
    const dismiss = (e: PointerEvent) => { if (!(e.target instanceof Element) || !e.target.closest('[data-menu]')) setMenu(null); };
    // Dismiss before canvas gestures stop pointer events from bubbling.
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [menu]);

  const announce = notify;
  const remember = useCallback((previous: CanvasImage[], selection = selectedRef.current) => { history.current = [...history.current.slice(-39), {images: previous, selectedIds: selection}]; future.current = []; setCanUndo(true); setCanRedo(false); }, []);
  const undo = useCallback(() => { const previous = history.current.pop(); if (previous) { future.current.push({ images: imageRef.current, selectedIds: selectedRef.current }); setImages(previous.images); setSelectedIds(previous.selectedIds); } setCanUndo(history.current.length > 0); setCanRedo(future.current.length > 0); }, []);
  const redo = useCallback(() => { const next = future.current.pop(); if (next) { history.current.push({ images: imageRef.current, selectedIds: selectedRef.current }); setImages(next.images); setSelectedIds(next.selectedIds); } setCanUndo(history.current.length > 0); setCanRedo(future.current.length > 0); }, []);
  const fit = useCallback(() => { const rect = canvas.current?.getBoundingClientRect(); if (rect) setView(fitImages(canvasNodes(imageRef.current), rect.width, rect.height)); }, []);
  const navigateMinimap = useCallback((x: number, y: number) => {
    const element = canvas.current;
    if (element) setView(current => ({ ...current, x: element.clientWidth / 2 - x * current.zoom, y: element.clientHeight / 2 - y * current.zoom }));
  }, []);
  const removeSelected = useCallback(() => { if (selectedIds.length) { remember(imageRef.current); setImages(items => deleteCanvasSelection(items, selectedIds)); setSelectedIds([]); } }, [selectedIds, remember]);
  const closeModal = useCallback(() => { uploadEpoch.current++; setModal(null); setReading(false); }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      // Preserve typing and keyboard activation; mouse-focused controls still allow canvas shortcuts.
      if (event.isComposing || isField(event.target)) return;
      if (event.code === 'Space' && document.documentElement.dataset.focusNavigation === 'keyboard' && event.target instanceof Element && event.target.closest('button, [role="button"]')) return;
      if (event.key === 'Alt' || event.key === 'Escape') setSnapGuide(null);
      if (canvasReference) { if (event.key === 'Escape') { setCanvasReference(null); setSpaceDown(false); } else if (event.code === 'Space') { event.preventDefault(); setSpaceDown(true); } return; }
      if (event.key === 'Escape') { if (previewImage) {setPreviewImage(null); return;} if (modal || referenceTarget || document.querySelector('dialog[open]')) return; setSelectedIds([]); setMenu(null); setSpaceDown(false); return; }
      if (isField(event.target) || (event.target instanceof Element && event.target.closest('.fusion-node')) || modal || referenceTarget || menu || previewImage || document.querySelector('dialog[open]')) return;
      if (event.code === 'Space' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setSpaceDown(true); }
      if (event.key.toLowerCase() === 'v' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setCanvasMode('select'); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') { event.preventDefault(); setSelectedIds(canvasNodes(imageRef.current).map(n => n.id)); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); }
      if (event.key === '0') { event.preventDefault(); fit(); }
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') setSpaceDown(false); };
    const blur = () => { setSpaceDown(false); gesture.current = null; setDragging(false); setMarquee(null); setSnapGuide(null); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [modal, referenceTarget, canvasReference, menu, previewImage, fit, undo, redo, removeSelected]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-overlay]')) return;
      event.preventDefault(); const rect = element.getBoundingClientRect();
      setView(v => event.ctrlKey || event.metaKey || event.altKey
        ? zoomAt(v, Math.exp(-event.deltaY * 0.005), event.clientX - rect.left, event.clientY - rect.top)
        : { ...v, x: v.x - event.deltaX, y: v.y - event.deltaY });
    };
    element.addEventListener('wheel', wheel, { passive: false }); return () => element.removeEventListener('wheel', wheel);
  }, []);

  function beginPointer(event: ReactPointerEvent, id?: string, fusion = false) {
    if (event.button !== 0 && event.button !== 1) return;
    if (!fusion && event.target instanceof Element && event.target.closest('[data-overlay]')) return;
    event.preventDefault(); event.stopPropagation();
    if (canvasReference && !spaceDown && canvasMode !== 'hand' && event.button === 0 && id && !fusion) { toggleCanvasReference(id); return; }
    const pan = !!canvasReference || spaceDown || canvasMode === 'hand' || event.button === 1 || !images.length;
    let ids = selectedRef.current;
    if (!pan && id) {
      if (event.shiftKey) ids = ids.includes(id) ? ids.filter(n => n !== id) : [...ids, id];
      else if (!ids.includes(id)) ids = [id];
      setSelectedIds(ids);
      if (!ids.includes(id)) return;
    } else if (!pan && !event.shiftKey) { ids = []; setSelectedIds([]); }
    setSnapGuide(null);
    gesture.current = { pointerId: event.pointerId, type: pan ? 'pan' : fusion ? 'fusion' : id ? 'image' : 'marquee', clickedId: id, ids, additive: event.shiftKey, x: event.clientX, y: event.clientY, view, images, changed: false };
    event.currentTarget.setPointerCapture(event.pointerId); setDragging(true);
  }
  function movePointer(event: ReactPointerEvent) {
    const g = gesture.current; if (!g || event.pointerId !== g.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (Math.abs(dx) + Math.abs(dy) < 3 && !g.changed) return;
    g.changed = true;
    if (g.type === 'pan') setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
    else if (g.type === 'image' || g.type === 'fusion') {
      const anchor = canvasNodes(g.images).find(n => n.id === g.clickedId);
      if (!anchor) return;
      const snapping = snapToGrid && !event.altKey;
      const delta = gridDragDelta(anchor, dx, dy, g.view.zoom, snapping);
      setSnapGuide(snapping ? { x: anchor.x + delta.x, y: anchor.y + delta.y } : null);
      setImages(g.images.map(n => {
      const imageSelected = g.ids.includes(n.id), nodeSelected = g.ids.includes(`${n.id}:fusion`);
      if (!imageSelected && !nodeSelected) return n;
      const position = fusionPosition(n);
      return { ...n, x: n.x + (imageSelected ? delta.x : 0), y: n.y + (imageSelected ? delta.y : 0),
        fusion: n.fusion ? { ...n.fusion, position: { x: position.x + (nodeSelected ? delta.x : 0), y: position.y + (nodeSelected ? delta.y : 0) } } : undefined };
    }));
    } else {
      const r = canvas.current!.getBoundingClientRect();
      const box = { x: Math.min(g.x, event.clientX) - r.left, y: Math.min(g.y, event.clientY) - r.top, width: Math.abs(dx), height: Math.abs(dy) };
      setMarquee(box);
      const picked = canvasNodes(g.images).filter(n => {
        const x = n.x * g.view.zoom + g.view.x, y = n.y * g.view.zoom + g.view.y;
        return x < box.x + box.width && x + n.width * g.view.zoom > box.x && y < box.y + box.height && y + n.height * g.view.zoom > box.y;
      }).map(n => n.id);
      setSelectedIds([...new Set([...(g.additive ? g.ids : []), ...picked])]);
    }
  }
  function endPointer(event: ReactPointerEvent) {
    const g = gesture.current; if (!g || event.pointerId !== g.pointerId) return;
    if ((g.type === 'image' || g.type === 'fusion') && g.changed) remember(g.images, g.ids);
    if ((g.type === 'image' || g.type === 'fusion') && !g.changed && !g.additive && g.clickedId) setSelectedIds([g.clickedId]);
    gesture.current = null; setDragging(false); setMarquee(null); setSnapGuide(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function addImages(items: PendingImage[], point?: { x: number; y: number } | null) {
    const item = items[0];
    if (!item) return;
    const rect = canvas.current!.getBoundingClientRect();
    const v = viewRef.current;
    const created: CanvasImage = { ...item, fusion: item.operation === 'fusion' ? defaultFusion() : undefined, role: 'main', x: point?.x ?? (rect.width / 2 - v.x) / v.zoom - item.width / 2, y: point?.y ?? (rect.height / 2 - v.y) / v.zoom - item.height / 2 };
    remember(imageRef.current); setImages(previous => [...previous.filter(n => n.role !== 'main' || n.nodeOnly), created]); setSelectedIds([created.id]);
    if (created.operation === 'cutout') setCutoutImage(created);
    if (created.fusion) revealFusion(created);
    else announce(t.mainImageReady);
  }
  function addBatchImages(items: PendingImage[]) {
    if (!items.length || items.length > 20) return;
    const rect = canvas.current!.getBoundingClientRect();
    const previous = imageRef.current;
    const startX = previous.length ? Math.max(...canvasNodes(previous).map(item => item.x + item.width)) + GROUP_GAP : 0;
    const created = arrangeImages(items.map(item => ({ ...item, role: undefined, operation: undefined, x: 0, y: 0 })), startX, rect);
    const next = [...previous, ...created];
    remember(previous); setImages(next); setSelectedIds(created.map(n => n.id));
    setView(fitImages(canvasNodes(next), rect.width, rect.height)); announce(t.ready);
  }
  function arrange() {
    const rect = canvas.current!.getBoundingClientRect();
    const next = arrangeImages(imageRef.current, 0, rect);
    if (!next.length) return;
    remember(imageRef.current); setImages(next);
    setView(fitImages(canvasNodes(next), rect.width, rect.height));
  }
  async function downloadSelected() {
    const items = imageRef.current.filter(n => selectedRef.current.includes(n.id));
    try {
      for (const item of items) {
        const response = await fetch(item.url); if (!response.ok) throw new Error('download');
        const blob = await response.blob(); const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = /\.[a-z0-9]+$/i.test(item.name) ? item.name : `${item.name}.png`; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch { announce(t.downloadError); }
  }
  function openUpload() { uploadEpoch.current++; setReading(false); setMenu(null); setModal('upload'); }
  function rememberUpload(image: LibraryImage) { ownedUrls.current.add(image.url); setUploads(previous => [image, ...previous]); }
  async function loadFiles(files: FileList | File[]) {
    if (!files.length || reading) return;
    if (files.length > 20) { announce(t.batchImageLimit); return; }
    const epoch = ++uploadEpoch.current;
    setReading(true);
    const results = await Promise.allSettled(Array.from(files).map(readImage));
    const successful = results.flatMap(r => r.status === 'fulfilled' ? [r.value] : []);
    if (epoch !== uploadEpoch.current) { successful.forEach(n => URL.revokeObjectURL(n.url)); return; }
    successful.forEach(rememberUpload);
    const failed = results.some(r => r.status === 'rejected');
    setReading(false);
    if (successful.length) addBatchImages(successful);
    if (failed) announce(t.uploadError);

  }
  function openTool(id: Tool) { uploadEpoch.current++; setReading(false); setMenu(null); setModal(id); }
  function revealFusion(image: CanvasImage) {
    const r = canvas.current!.getBoundingClientRect();
    const current = viewRef.current;
    const bounds = boundsOf(canvasNodes([image]))!;
    const area = canvasSafeArea(r.width, r.height);
    if (bounds.x * current.zoom + current.x < area.x || (bounds.x + bounds.width) * current.zoom + current.x > area.x + area.width || bounds.y * current.zoom + current.y < area.y || (bounds.y + bounds.height) * current.zoom + current.y > area.y + area.height) {
      setView(fitImages(canvasNodes([image]), r.width, r.height));
    }
  }
  function openFusion() {
    const image = imageRef.current.find(n => selectedRef.current.includes(n.id));
    if (!image) return;
    const next = createFusionEditor(imageRef.current, image.id, crypto.randomUUID());
    if (!next) return;
    remember(imageRef.current);
    setImages(items => [...items, next]);
    setSelectedIds([image.id]); revealFusion({...image, fusion: next.fusion});
  }
  function generateDemo(editorId: string) {
    const current = imageRef.current;
    const editor = current.find(item => item.id === editorId && item.fusion);
    if (!editor) return;
    const source = editor.editorSourceId ? current.find(item => item.id === editor.editorSourceId && !item.nodeOnly) : !editor.nodeOnly ? editor : undefined;
    if (!source) return;
    const position = fusionPosition(editor);
    const width = 360, height = 360, x = position.x + 280 + 80;
    let y = position.y;
    const occupied = canvasNodes(current);
    while (occupied.some(item => x < item.x + item.width + 16 && x + width + 16 > item.x && y < item.y + item.height + 16 && y + height + 16 > item.y)) y += height + 80;
    const result: CanvasImage = {id: crypto.randomUUID(), name: '融合结果 · 演示', url: '/assets/prompts/result.png', x, y, width, height, generatedByEditorId: editorId};
    remember(current);
    setImages([...current, result]);
    setSelectedIds([result.id]);
    announce('已添加示例图，可点击整理查看连接布局');
  }

  function updateFusion(id: string, patch: Partial<FusionSettings>) {
    if ('references' in patch) remember(imageRef.current);
    setImages(items => items.map(n => n.id === id && n.fusion ? { ...n, fusion: { ...n.fusion, ...patch } } : n));
  }
  function addReferences(target: string, additions: FusionReference[]) {
    const owner = imageRef.current.find(n => n.id === target);
    if (!owner?.fusion) return;
    const references = [...new Map([...fusionReferences(owner.fusion), ...additions].map(n => [n.url, { id: n.id, name: n.name, url: n.url }])).values()];
    if (references.length > MAX_FUSION_REFERENCES) { announce(t.referenceLimit); return; }
    updateFusion(target, { references, reference: undefined });
  }
  function toggleCanvasReference(id: string) {
    if (!canvasReference) return;
    const candidate = images.find(n => n.id === id);
    const existing = fusionReferences(images.find(n => n.id === canvasReference.target)?.fusion);
    if (!candidate || existing.some(n => n.url === candidate.url)) return;
    const picked = canvasReference.ids.includes(id);
    if (!picked && canvasReferenceCount >= MAX_FUSION_REFERENCES) { announce(t.referenceLimit); return; }
    if (!picked && canvasReference.ids.some(other => images.find(n => n.id === other)?.url === candidate.url)) return;
    setCanvasReference({ ...canvasReference, ids: picked ? canvasReference.ids.filter(n => n !== id) : [...canvasReference.ids, id] });
  }
  function changeZoom(factor: number, animated = false) { const r = canvas.current!.getBoundingClientRect(); if (animated) animateView(zoomAt(viewRef.current, factor, r.width / 2, r.height / 2)); else setView(v => zoomAt(v, factor, r.width / 2, r.height / 2)); }

  return <div className="app-shell" data-library="Lightchain SaaS v5.1 libraries Beta" data-node-id="12:3127">
    <header className="topbar flex items-center justify-between gap-2 px-6" data-node-id="12:3148">
      <div className="flex items-center gap-6 min-w-0">
        <div className="brand flex items-center gap-2 shrink-0" aria-label="Lightchain">
          <img src={assets.imgContainerLightchainLogo01} alt="" width="24" height="24" />
          <Icon name="imgContainerLightchainLogo02" size={113} className="wordmark" />
        </div>
        <div className="flex items-center gap-2">
        <div className="relative" data-menu>
          <button className="language-trigger flex items-center gap-2 h-8 px-2 rounded-lg" aria-label={t.language} aria-expanded={menu === 'language'} onClick={() => setMenu(menu === 'language' ? null : 'language')}>
            <Icon name="imgIconSystem" /><span className="language-label">{locales.find(l => l.value === locale)?.label}</span><Icon name="imgChevron" size={16} />
          </button>
          {shownMenu.value === 'language' && <div className="popover language-menu" data-phase={shownMenu.phase} inert={shownMenu.phase === 'exit'} aria-label={t.language}>
            {locales.map(l => <button key={l.value} className="menu-option" aria-pressed={locale === l.value} onClick={() => { setLocale(l.value); setMenu(null); }}>{l.label}<Icon name="check" size={16} className={locale === l.value ? 'option-check is-selected' : 'option-check'} /></button>)}
          </div>}
        </div>
        <Button
          className="theme-toggle !w-8 !p-0"
          aria-label={resolvedTheme === 'dark' ? t.switchLight : t.switchDark}
          title={resolvedTheme === 'dark' ? t.switchLight : t.switchDark}
          onClick={() => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); setMenu(null); }}
        >
          <Icon name={resolvedTheme === 'dark' ? 'themeMoon' : 'themeSun'} size={18} />
        </Button>
        </div>
      </div>
      <div className="topbar-actions flex items-center gap-4 shrink-0">
        <Button icon="imgIconSystem1" className="help-button" onClick={() => setModal('help')} title={t.help}><span className="header-action-label">{t.help}</span></Button>
        <Button icon="imgIconSystem2" className="support-button" onClick={() => setModal('support')} title={t.support}><span className="header-action-label">{t.support}</span></Button>
        <button className="purchase-button" onClick={() => setModal('credits')} data-node-id="35:6267">
          <span>{t.credits}</span><Divider vertical /><span className="purchase-cost"><Icon name="imgIconSystem3" size={16} /><span className="purchase-balance">99999</span></span>
        </button>
        <span className="avatar"><img src={assets.imgImageFill} alt="" width="32" height="32" /></span>
      </div>
    </header>

    <main ref={canvas} className={`canvas ${spaceDown || canvasMode === 'hand' ? 'is-panning' : ''} ${dragging ? 'is-dragging' : ''}`} aria-label={t.canvas}
      onPointerDown={e => beginPointer(e)} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer}
      onDoubleClick={e => { if (!(e.target instanceof Element) || e.target.closest('[data-overlay], [data-image]')) return; openUpload(); }}
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropActive(true); } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropActive(false); }}
      onDrop={e => { e.preventDefault(); setDropActive(false); void loadFiles(e.dataTransfer.files); }}>

      <svg className="canvas-grid" aria-hidden="true" width="100%" height="100%">
        <defs><pattern id={gridPatternId} width={CANVAS_GRID_SIZE} height={CANVAS_GRID_SIZE} patternUnits="userSpaceOnUse" patternTransform={canvasTransform}>
          <circle cx="1" cy="1" r="1" fill="var(--canvas-dot)" />
        </pattern></defs>
        <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
      </svg>
      <section className="project-panel" data-overlay data-node-id="12:3128" aria-label={t.project}>
        <div className="project-heading flex items-center gap-1 px-3 py-2">
          <div className="workspace-icon relative size-5 shrink-0"><img src={assets.img} alt="" width="20" height="20" /><img className="workspace-artwork" src={assets.imgIcon} alt="" width="20" height="20" /></div>
          <span className="text-xs leading-4 text-muted">{t.workspace}</span>
        </div>
        <div className="mx-3"><Divider /></div>
        <div className="flex items-center gap-2 p-2">
          <Button size="m" icon="imgIcon1" className="!w-8 !p-0" aria-label={t.back} title={t.back} onClick={() => setModal('project')} />
          <Divider vertical />
          <input ref={projectInput} className="project-input min-w-0 flex-1" aria-label={t.projectName} placeholder={t.rename} value={projectName} maxLength={80}
            onChange={e => setProjectName(e.target.value)} onBlur={() => { if (!projectName.trim()) setProjectName('Untitle'); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        </div>
      </section>

      {images.length === 0 && <section className="empty-state flex flex-col items-center gap-8" data-overlay data-node-id="14:3674">
        <p className="empty-intro font-medium text-base leading-6 text-muted text-center">{t.intro}</p>
        <div className="tool-grid flex items-center gap-4" data-node-id="14:3688">
          {tools.map(tool => <Button key={tool.id} variant="outline" size="l" icon={tool.icon} className="entry-tool" onClick={() => openTool(tool.id)} data-node-id={tool.nodeId}>{t[tool.id]}</Button>)}
        </div>
        <button type="button" className={`asset-upload empty-upload ${initialDropActive ? 'is-over' : ''}`} data-node-id="62:27018"
          aria-label={t.addImagesPrompt} disabled={reading} onClick={openUpload}
          onDragOver={event => { event.preventDefault(); event.stopPropagation(); if (event.dataTransfer.types.includes('Files')) { setDropActive(false); setInitialDropActive(true); } }}
          onDragLeave={event => { event.stopPropagation(); if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInitialDropActive(false); }}
          onDrop={event => { event.preventDefault(); event.stopPropagation(); setInitialDropActive(false); setDropActive(false); void loadFiles(event.dataTransfer.files); }}>
          <Icon name="upload" size={32} />
          <span className="asset-upload-title">{reading ? t.reading : initialDropActive ? t.dropImagesHere : t.addImagesPrompt}</span>
          <span className="asset-upload-hint">{initialDropActive && !reading ? t.releaseToUpload : t.initialUploadFormats}</span>
        </button>
      </section>}

      <div className="canvas-world" style={{ transform: canvasTransform, '--canvas-inverse-scale': 1 / view.zoom } as React.CSSProperties}>
        {images.filter(result => !result.nodeOnly && !result.sourceImageId && result.generatedByEditorId).map(result => {
          const editor = images.find(item => item.id === result.generatedByEditorId && item.fusion);
          if (!editor) return null;
          const sourceId = editor.editorSourceId ?? (!editor.nodeOnly ? editor.id : undefined);
          return <ImageConnection zoom={view.zoom} key={`generation:${result.id}`} image={{...editor, ...fusionPosition(editor), id:`${editor.id}:fusion`, width:280, height:579}} target={result} active={selectedIds.includes(result.id) || selectedIds.includes(`${editor.id}:fusion`) || (!!sourceId && selectedIds.includes(sourceId))} />;
        })}
        {images.filter(result => !result.nodeOnly && result.sourceImageId).map(result => {
          const source = images.find(item => !item.nodeOnly && item.id === result.sourceImageId);
          return source ? <ImageConnection zoom={view.zoom} key={`cutout:${result.id}`} image={source} target={result} active={selectedIds.includes(source.id) || selectedIds.includes(result.id)} /> : null;
        })}
        {images.filter(n => !n.nodeOnly).map(n => <div key={n.id} data-image className={`canvas-image ${(canvasReference ? canvasReference.ids.includes(n.id) : selectedIds.includes(n.id)) ? 'selected' : ''}`} style={{ left: n.x, top: n.y, width: n.width, height: n.height, zIndex: foregroundIds.has(n.id) ? 3 : raisedIds.has(n.id) ? 2 : undefined } as React.CSSProperties}
          tabIndex={0} role="button" aria-label={`${t.image}: ${n.name}`} aria-pressed={canvasReference ? canvasReference.ids.includes(n.id) : selectedIds.includes(n.id)}
          onFocus={e => { if (!canvasReference && e.target === e.currentTarget && !selectedRef.current.includes(n.id)) setSelectedIds([n.id]); }} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || (e.key === ' ' && document.documentElement.dataset.focusNavigation === 'keyboard'))) { e.preventDefault(); if (canvasReference) { toggleCanvasReference(n.id); return; } setSelectedIds(e.shiftKey ? selectedIds.includes(n.id) ? selectedIds.filter(id => id !== n.id) : [...selectedIds, n.id] : [n.id]); } }}
          onPointerDown={e => beginPointer(e, n.id)}>
          <Button hidden={!!canvasReference} variant="tonal" className="image-preview-button" aria-label={`${t.viewFull} · ${n.name}`} title={t.viewFull} data-overlay onClick={() => setPreviewImage(n)}><Icon name="viewFull" size={20} /></Button>
          <img src={n.url} alt={n.name} draggable={false} width={n.width} height={n.height} />
        </div>)}
        {images.filter(n => n.fusion).map(n => {
          const source = n.editorSourceId ? images.find(item => item.id === n.editorSourceId && !item.nodeOnly) : !n.nodeOnly ? n : undefined;
          const editorImage = source ? {...source, id: n.id, fusion: n.fusion, nodeOnly: false} : n;
          return <div key={`${n.id}:fusion`}>
          {source && <ImageConnection zoom={view.zoom} image={source} target={{...fusionPosition(n),id:`${n.id}:fusion`,width:280,height:579}} active={selectedIds.includes(source.id) || selectedIds.includes(`${n.id}:fusion`)} />}
          <div className="fusion-position" data-fusion-id={n.id} data-selected={selectedIds.includes(`${n.id}:fusion`)} tabIndex={0} role="group" aria-label={`${t.fusion} · ${n.name}`}
            style={{ left: fusionPosition(n).x, top: fusionPosition(n).y, zIndex: foregroundIds.has(`${n.id}:fusion`) ? 3 : raisedIds.has(n.id) ? 2 : undefined } as React.CSSProperties}
            onFocus={() => { if (!canvasReference && !selectedRef.current.includes(`${n.id}:fusion`)) setSelectedIds([`${n.id}:fusion`]); }}
            onPointerDownCapture={e => {
              if (canvasReference) { e.preventDefault(); e.stopPropagation(); return; }
              if (e.button !== 0 && e.button !== 1) return;
              if (e.target instanceof Element && e.target.closest('[data-select-popup]')) return;
              if (e.target instanceof Element && e.target.closest('button, input, textarea, select, dialog')) {
                if (e.button === 0 && !selectedRef.current.includes(`${n.id}:fusion`)) setSelectedIds([`${n.id}:fusion`]);
                return;
              }
              beginPointer(e, `${n.id}:fusion`, true);
            }}>
            <FusionNode image={editorImage} locale={locale} onAddMain={() => setMainTarget(n.id)} onChange={patch => updateFusion(n.id, patch)} onReference={source => { if (source === 'upload') setReferenceTarget(n.id); else { setCanvasMode('select'); setCanvasReference({ target: n.id, ids: [] }); } }} onDemo={() => announce(t.noBackend)} onGenerate={() => generateDemo(n.id)} onNotify={announce} />
          </div>
        </div>;})}
      </div>

      {shownSelection.value && !marquee && !canvasReference && <div className="selection-overlay" data-phase={shownSelection.phase} aria-label={t.groupSelection} style={{
        left: shownSelection.value.bounds.x * view.zoom + view.x, top: shownSelection.value.bounds.y * view.zoom + view.y,
        width: shownSelection.value.bounds.width * view.zoom, height: shownSelection.value.bounds.height * view.zoom,
      }}>
        {shownSelection.value.count > 1 && <div className="group-selection-frame" data-selection-count={shownSelection.value.count} />}
        {shownSelection.value.showToolbar && <div className="media-toolbar-anchor" data-overlay inert={shownSelection.phase === 'exit'}>
          <SelectionToolbar locale={locale} multiple={shownSelection.value.count > 1} onAction={action => action === 'fusion' ? openFusion() : action === 'cutout' ? setCutoutImage(imageRef.current.find(n => selectedRef.current.includes(n.id)) ?? null) : announce(t.noBackend)} onDownload={() => void downloadSelected()} />
        </div>}
      </div>}
      {shownSnapGuide.value && <div className="canvas-snap-guides" aria-hidden="true" data-phase={shownSnapGuide.phase}>
        <span className="canvas-snap-guide canvas-snap-guide--vertical" style={{ left: shownSnapGuide.value.x * view.zoom + view.x }} />
        <span className="canvas-snap-guide canvas-snap-guide--horizontal" style={{ top: shownSnapGuide.value.y * view.zoom + view.y }} />
      </div>}
      {marquee && <div className="selection-marquee" style={{left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height}} />}
      {shownReturnToNodes.value && !canvasReference && <div className="canvas-return-hint" data-overlay data-phase={shownReturnToNodes.phase} inert={shownReturnToNodes.phase === 'exit'}>
        <p role="status">{t.noNodesInView}</p>
        <Button variant="primary" size="s" onClick={fit}>{t.returnToNodes}</Button>
      </div>}
      {shownCanvasReference.value && <div className="canvas-return-hint canvas-reference-hint" data-overlay data-phase={shownCanvasReference.phase} inert={shownCanvasReference.phase === 'exit'}>
        <p role="status">{t.referencePickHint} · {fusionReferences(images.find(n => n.id === shownCanvasReference.value!.target)?.fusion).length + shownCanvasReference.value.ids.length} / {MAX_FUSION_REFERENCES}</p>
        <Button variant="secondary" onClick={() => setCanvasReference(null)}>{t.cancel}</Button>
        <Button variant="primary" disabled={!canvasReference?.ids.length} onClick={() => { if (canvasReference) addReferences(canvasReference.target, images.filter(n => canvasReference.ids.includes(n.id))); setCanvasReference(null); }}>{t.confirm}</Button>
      </div>}
      {images.length > 0 && <CanvasChrome locale={locale} mode={spaceDown ? 'hand' : canvasMode} onMode={setCanvasMode} zoom={view.zoom} view={view} canvasSize={canvasSize} images={navigationNodes}
        snapToGrid={snapToGrid} onToggleSnap={() => setSnapToGrid(current => { localStorage.setItem('lc-flow-grid-snap', current ? 'off' : 'on'); return !current; })}
        onNavigateMinimap={navigateMinimap} onMinimapInteraction={setDragging}
        canUndo={canUndo && !canvasReference} canRedo={canRedo && !canvasReference} onUndo={() => { if (!canvasReference) undo(); }} onRedo={() => { if (!canvasReference) redo(); }} onUpload={() => { if (!canvasReference) openUpload(); }} onZoom={changeZoom} onFit={fit} onArrange={() => { if (!canvasReference) arrange(); }}
        onHelp={() => setModal('help')} onDemo={() => announce(t.noBackend)} />}
      <span className="sr-only" role="status">{images.filter(n => !n.nodeOnly).length} {t.image} · {selectedIds.length} {t.selected}</span>
      {shownDrop.value && <div className="drop-overlay flex items-center justify-center pointer-events-none" data-phase={shownDrop.phase}><span>{t.drop}</span></div>}
      {reading && !modal && <div className="canvas-message" role="status">{t.reading}</div>}
    </main>

    <ToastHost />

    {shownCutout.value && <CutoutEditor key={shownCutout.value.id} image={shownCutout.value} phase={shownCutout.phase} onClose={() => setCutoutImage(null)} onApply={url => {
      const source = shownCutout.value!;
      ownedUrls.current.add(url);
      const result: CanvasImage = {...source, id: crypto.randomUUID(), name: `${source.name}-cutout.png`, sourceImageId: source.id, generatedByEditorId: undefined, editorSourceId: undefined, url, x: source.x + source.width + 80, role: undefined, fusion: undefined, operation: undefined};
      remember(imageRef.current); setImages(previous => [...previous, result]); setSelectedIds([result.id]); setCutoutImage(null);
    }} />}
    {shownPreview.value && <FullImageViewer key={shownPreview.value.id} image={shownPreview.value} locale={locale} phase={shownPreview.phase} onClose={() => setPreviewImage(null)} />}
    {shownMainTarget.value && <AssetPicker key={`main:${shownMainTarget.value}`} locale={locale} phase={shownMainTarget.phase} uploads={uploads} onUpload={rememberUpload} onClose={() => setMainTarget(null)} onConfirm={item => {
      const target = imageRef.current.find(n => n.id === mainTarget && n.nodeOnly && n.fusion);
      if (!target) { setMainTarget(null); return; }
      const position = fusionPosition(target);
      const id = crypto.randomUUID();
      remember(imageRef.current);
      setImages(previous => previous.map(n => n.id === target.id ? {...item, id, x: position.x - item.width - 80, y: position.y, fusion: {...target.fusion!, position}, nodeOnly: false} : n));
      setSelectedIds([`${id}:fusion`]); setMainTarget(null);
    }} />}
    {shownReference.value && <AssetPicker key={`reference:${shownReference.value}`} locale={locale} phase={shownReference.phase} uploads={uploads} onUpload={rememberUpload} onClose={() => setReferenceTarget(null)}
      maxCount={MAX_FUSION_REFERENCES - fusionReferences(images.find(n => n.id === shownReference.value)?.fusion).length}
      excludedUrls={fusionReferences(images.find(n => n.id === shownReference.value)?.fusion).map(n => n.url)} limitMessage={t.referenceLimit}
      onConfirm={image => { addReferences(shownReference.value!, [image]); setReferenceTarget(null); }}
      onConfirmBatch={items => { addReferences(shownReference.value!, items); setReferenceTarget(null); }} />}

    {activeTool && <AssetPicker key={activeTool.id} locale={locale} phase={shownModal.phase} uploads={uploads} onUpload={rememberUpload}
      onClose={closeModal} onConfirm={image => { addImages([{ ...image, operation: activeTool.id }]); closeModal(); }} />}
    {shownModal.value === 'upload' && <AssetPicker key="upload" locale={locale} phase={shownModal.phase} uploads={uploads} onUpload={rememberUpload}
      onClose={closeModal} onConfirm={image => { addImages([image]); closeModal(); }} onConfirmBatch={items => { addBatchImages(items); closeModal(); }} />}
    {shownModal.value && shownModal.value !== 'upload' && !activeTool && <Dialog title={t[shownModal.value as 'help' | 'support' | 'credits' | 'project']} onClose={closeModal} closeLabel={t.close} phase={shownModal.phase}>
      {shownModal.value === 'help' ? <div className="text-sm leading-6"><p className="font-medium mb-3">{t.helpIntro}</p><ul className="help-list space-y-3 text-muted"><li>{t.helpUpload}</li><li>{t.shortcutSelect}</li><li>{t.helpPan}</li><li>{t.helpZoom}</li><li>{t.helpKeys}</li></ul><p className="text-xs text-muted mt-6">{t.localNote}</p></div>
        : shownModal.value === 'project' ? <><div className="project-summary p-4 rounded-xl mb-4"><p className="font-medium mb-1">{projectName}</p><p className="text-xs text-muted">{t.workspace} · {images.filter(n => !n.nodeOnly).length} {t.image}</p></div><p className="text-xs leading-5 text-muted">{t.localNote}</p><div className="flex justify-end mt-6"><Button variant="outline" size="m" onClick={closeModal}>{t.returnCanvas}</Button></div></>
        : <p className="text-sm leading-6 text-muted">{shownModal.value === 'support' ? t.supportNote : t.creditsNote}</p>}
    </Dialog>}
  </div>;
}
