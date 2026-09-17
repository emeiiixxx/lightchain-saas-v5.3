import { useEffect, useRef, useState } from 'react';
import { Button, Divider, Icon, type IconName } from './ui';
import { messages, type Locale } from '../i18n';
import { usePresence } from '../usePresence';
import type { CanvasImage, Viewport } from '../canvas';
import { CanvasMinimap } from './CanvasMinimap';
import { ToggleButton } from './ToggleButton';
import { CanvasTaskList, type CanvasTask } from './CanvasTaskList';

type Props = { locale: Locale; mode: 'select' | 'hand'; onMode: (mode: 'select' | 'hand') => void; zoom: number;
  tasks?: CanvasTask[];
  snapToGrid: boolean; onToggleSnap: () => void;
  view: Viewport; canvasSize: { width: number; height: number };
  onNavigateMinimap: (x: number, y: number) => void; onMinimapInteraction: (active: boolean) => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; onUpload: () => void; onZoom: (factor: number, animated?: boolean) => void;
  onFit: () => void; onArrange: () => void; onHelp: () => void; onDemo: () => void; images: CanvasImage[];
};
export function CanvasChrome(p: Props) {
  const t = messages[p.locale];
  const isMac = /Mac/i.test(navigator.platform);
  const shortcutModifier = isMac ? '⌘' : 'Ctrl';
  const shortcutKey = isMac ? 'Meta' : 'Control';
  const [map, setMap] = useState(false);
  const [search, setSearch] = useState(false);
  const [zoomMenu, setZoomMenu] = useState(false);
  const zoomControl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const control = zoomControl.current;
      if (!control || control.contains(event.target as Node)) return;
      setZoomMenu(false);
      // Canvas pointer handling prevents native blur. Explicitly release focus,
      // including when the menu was already dismissed with Escape or the trigger.
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && control.contains(focused)) focused.blur();
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (zoomMenu && event.key === 'Escape') { setZoomMenu(false); zoomControl.current?.querySelector<HTMLButtonElement>('.canvas-zoom-value')?.focus(); } };
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeOnEscape, true);
    return () => { document.removeEventListener('pointerdown', closeOutside, true); document.removeEventListener('keydown', closeOnEscape, true); };
  }, [zoomMenu]);
  const shownMap = usePresence(map ? 'map' : null);
  const shownSearch = usePresence(search ? 'search' : null);
  const shownZoom = usePresence(zoomMenu ? 'zoom' : null);
  const iconButton = (label: string, icon: IconName, onClick: () => void, extra = {}) => <Button className="canvas-icon-button" aria-label={label} title={label} onClick={onClick} {...extra}><Icon name={icon} size={20} /></Button>;
  return <>
    <div className="canvas-nav-toolbar" data-overlay role="toolbar" aria-label={t.canvas}>
      {iconButton(t.selectTool, 'move', () => p.onMode('select'), { 'aria-pressed': p.mode === 'select' })}
      {iconButton(t.handTool, 'hand', () => p.onMode('hand'), { 'aria-pressed': p.mode === 'hand' })}
      {iconButton(t.upload, 'canvasUpload', p.onUpload)}<Divider vertical />
      {iconButton(t.undo, 'undoIcon', p.onUndo, { disabled: !p.canUndo, title: `${t.undo} ${shortcutModifier}+Z`, 'aria-keyshortcuts': `${shortcutKey}+Z` })}
      {iconButton(t.redo, 'redoIcon', p.onRedo, { disabled: !p.canRedo, title: `${t.redoHint} · ${shortcutModifier}+Shift+Z`, 'aria-keyshortcuts': `${shortcutKey}+Shift+Z` })}
    </div>
    <div className="canvas-side-toolbar" data-overlay role="toolbar" aria-label={t.assetSources}>
      {iconButton(t.platformAssets, 'platformIcon', p.onUpload)}
    </div>
    <div className="canvas-bottom-left" data-overlay>
      <CanvasTaskList tasks={p.tasks} locale={p.locale} />
    </div>
    <div className="canvas-bottom-right" data-overlay data-node-id="89:3853">
      <div ref={zoomControl} className="canvas-zoom-control" data-node-id="89:3854">
        <div className="canvas-zoom-buttons" data-node-id="57:25924">
          {iconButton(t.zoomOut, 'zoomOutIcon', () => p.onZoom(1 / 1.2))}
          <Button className="canvas-zoom-value" aria-haspopup="menu" aria-controls="canvas-zoom-menu" aria-expanded={zoomMenu} onClick={() => setZoomMenu(!zoomMenu)}>{Math.round(p.zoom * 100)}%<Icon name="imgChevron" size={16} /></Button>
          {iconButton(t.zoomIn, 'zoomInIcon', () => p.onZoom(1.2))}
        </div>
        {shownZoom.value && <div id="canvas-zoom-menu" role="menu" className="popover canvas-zoom-menu" data-node-id="57:26492" data-phase={shownZoom.phase} inert={shownZoom.phase === 'exit'}
          onKeyDown={event => {
            const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
            const index = options.indexOf(document.activeElement as HTMLButtonElement);
            const next = event.key === 'ArrowDown' ? (index + 1) % options.length : event.key === 'ArrowUp' ? (index - 1 + options.length) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1;
            if (next >= 0) { event.preventDefault(); event.stopPropagation(); options[next].focus(); }
          }}>
          {[2, 1, .5, .3, .1, .05, .03].map(zoom => <button key={zoom} role="menuitemradio" aria-checked={Math.abs(p.zoom - zoom) < .0001} className="zoom-menu-option" onClick={() => {p.onZoom(zoom / p.zoom, true);setZoomMenu(false)}}>
            <span>{zoom * 100}%</span>{Math.abs(p.zoom - zoom) < .0001 && <Icon name="check" size={16} />}
          </button>)}
          <button role="menuitem" className="zoom-menu-option" onClick={() => {p.onFit();setZoomMenu(false)}}>{t.fitScreen}</button>
        </div>}
      </div>
      <div className="canvas-floating-icon" data-node-id="89:3860">{iconButton(t.arrange, 'arrangeIcon', p.onArrange)}</div>
      <div className="canvas-map-control"><div className="canvas-floating-icon" data-node-id="89:3862">
        <ToggleButton label={t.minimap} icon="mapIcon" pressed={map} onClick={() => setMap(!map)} aria-expanded={map} aria-controls="canvas-minimap" data-node-id="89:3863" />
      </div>
        {shownMap.value && <div id="canvas-minimap" className="canvas-minimap" data-phase={shownMap.phase} inert={shownMap.phase === 'exit'}>
          <CanvasMinimap images={p.images} view={p.view} canvasSize={p.canvasSize} label={t.minimap} viewportLabel={t.visibleArea} onNavigate={p.onNavigateMinimap} onInteraction={p.onMinimapInteraction} />
        </div>}
      </div>
      <div className="canvas-floating-icon canvas-grid-control" data-node-id="89:3864">
        <ToggleButton label={t.gridSnap} icon={p.snapToGrid ? 'gridSnapOn' : 'gridSnapOff'} pressed={p.snapToGrid} onClick={p.onToggleSnap} data-node-id="89:3865" title={`${t.gridSnap} · ${p.snapToGrid ? t.snapOn : t.snapOff} · ${isMac ? 'Option' : 'Alt'} ${t.snapBypass}`} />
      </div>
      <div className="canvas-floating-icon">{iconButton(t.canvasGuide, 'guideIcon', p.onHelp)}</div>
      <div className="canvas-floating-icon">{iconButton(t.shortcuts, 'keyboardIcon', p.onHelp)}</div>
    </div>
    <section className={`canvas-search-widget ${search ? 'is-expanded' : ''}`} data-overlay aria-label={t.smartSearch} data-node-id={shownSearch.value ? '103:4783' : '103:4747'}>
      <header><div className="canvas-search-label"><Icon name="smartSearch" size={20} /><span>{t.smartSearch}</span></div>
        {iconButton(t.history, 'historyIcon', p.onDemo)}{iconButton(t.newSearch, 'newChat', p.onUpload)}<Divider vertical />
        {iconButton(search ? t.collapse : t.expand, 'panelChevron', () => setSearch(!search), {'aria-expanded': search, 'aria-controls': 'canvas-smart-search-content'})}
      </header>
      {shownSearch.value && <div id="canvas-smart-search-content" className="canvas-search-content" data-phase={shownSearch.phase} inert={shownSearch.phase === 'exit'}>
        <div className="canvas-search-intro"><img src="/assets/canvas/smartSearchIntro.svg" width={64} height={64} alt="" className="canvas-search-intro-icon" /><p>{t.smartSearchIntro}</p></div>
        <button type="button" className="canvas-search-tile" onClick={p.onUpload}><Icon name="fusionAddImage" size={32} /><span>{t.smartSearchUpload}</span></button>
        <button type="button" className="canvas-search-tile" onClick={p.onDemo}><Icon name="chooseFromCanvas" size={32} /><span>{t.smartSearchCanvas}</span></button>
      </div>}
    </section>
  </>;
}
