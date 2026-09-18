import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// Exercise the real React Flow adapter and DOM event propagation, including
// its native mousedown drag listener. No browser or production data is used.
test('marquee selection supports Shift removal/addition without dragging or intercepting controls', async () => {
  const dom = new JSDOM('<main tabindex="0"><div id="root"></div></main>', { pretendToBeVisual: true, url: 'http://localhost' });
  const { window } = dom;
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
  }
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = globalThis.ResizeObserver;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { get: () => 1000 });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { get: () => 800 });
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};

  const cache = path.resolve('node_modules/.cache/lc-selection-test');
  await mkdir(cache, { recursive: true });
  const bundled = await build({ entryPoints: ['src/components/ReactFlowCanvas.tsx'], bundle: true, packages: 'external', format: 'esm', jsx: 'automatic', loader: { '.css': 'empty' }, write: false });
  const modulePath = path.join(cache, 'adapter.mjs');
  await writeFile(modulePath, bundled.outputFiles[0].text);
  const { createElement: h, useState, act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { ReactFlowCanvas } = await import(pathToFileURL(modulePath).href);
  let selected = [], moves = 0, starts = 0, controlClicks = 0;
  const noop = () => {};
  function Fixture() {
    const [ids, setIds] = useState([]);
    selected = ids;
    return h(ReactFlowCanvas, {
      view: { x: 0, y: 0, zoom: 1 }, selectedIds: ids, hand: false, referenceMode: false, snap: false,
      onView: noop, onSelection: setIds, onPositions: () => moves++, onSelecting: noop,
      onDragStart: () => starts++, onDragEnd: noop, onGuides: noop,
    }, ...['a', 'b', 'editor'].map((id, i) => h('div', {
      key: id, [id === 'editor' ? 'data-fusion-id' : 'data-canvas-id']: id,
      style: { left: 100 + i * 200, top: 100, width: 100, height: 100 },
    }, id === 'editor' ? h('button', { onClick: () => controlClicks++ }, 'control') : id)));
  }
  const root = createRoot(document.getElementById('root'));
  const mouse = (target, type, shiftKey = false, x = 120, y = 120) => target.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, buttons: type === 'mouseup' ? 0 : 1, clientX: x, clientY: y, shiftKey }));
  const pointer = (target, type, x, y, shiftKey = false) => {
    const event = new window.MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, clientX: x, clientY: y, shiftKey });
    Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true }, pointerType: { value: 'mouse' } });
    return target.dispatchEvent(event);
  };
  const click = async (target, shift = false) => {
    await act(async () => {
      pointer(target, 'pointerdown', 120, 120, shift);
      mouse(target, 'mousedown', shift);
      pointer(target, 'pointerup', 120, 120, shift);
      mouse(target, 'mouseup', shift);
      mouse(target, 'click', shift);
    });
  };
  try {
    await act(async () => { root.render(h(Fixture)); });
    const pane = document.querySelector('.react-flow__pane');
    await act(async () => { pointer(pane, 'pointerdown', 50, 50); });
    await act(async () => { pointer(pane, 'pointermove', 650, 250); });
    await act(async () => { pointer(pane, 'pointerup', 650, 250); mouse(pane, 'click', false, 650, 250); });
    assert.deepEqual(selected, ['a', 'b', 'editor:fusion'], 'marquee must select images and editor');
    const before = { moves, starts };
    // Shift may have been pressed outside the page before focus returned.
    // Its mouse flag is authoritative even without a preceding keydown here.
    await click(document.querySelector('[data-canvas-id="a"]'), true);
    assert.deepEqual(selected, ['b', 'editor:fusion'], 'Shift click removes only its target');
    await act(async () => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft', shiftKey: true, bubbles: true })); });
    await click(document.querySelector('[data-fusion-id="editor"]'), true);
    assert.deepEqual(selected, ['b'], 'mixed selection supports removing the editor');
    await click(document.querySelector('[data-canvas-id="b"]'), true);
    assert.deepEqual(selected, [], 'last removal clears selection');
    await click(document.querySelector('[data-canvas-id="a"]'), true);
    await click(document.querySelector('[data-canvas-id="b"]'), true);
    assert.deepEqual(selected, ['a', 'b'], 'Shift adds unselected images');
    await click(document.querySelector('[data-fusion-id="editor"] button'), true);
    assert.equal(controlClicks, 1, 'Shift must not intercept editor controls');
    assert.deepEqual(selected, ['a', 'b']);
    assert.deepEqual({ moves, starts }, before, 'Shift toggles must not enter the group drag lifecycle');
    await act(async () => { window.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftLeft', bubbles: true })); });
    await act(async () => {
      const a = document.querySelector('[data-canvas-id="a"]');
      pointer(a, 'pointerdown', 120, 120);
      mouse(a, 'mousedown');
      mouse(window, 'mousemove', false, 160, 150);
      mouse(window, 'mouseup', false, 160, 150);
    });
    assert.deepEqual(selected, ['a', 'b'], 'ordinary dragging retains the selected group');
    assert.ok(moves > before.moves && starts > before.starts, 'ordinary dragging remains enabled');
  } finally {
    await act(async () => { root.unmount(); });
    dom.window.close();
    await rm(cache, { recursive: true, force: true });
  }
});
