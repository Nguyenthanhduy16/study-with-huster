import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../js/world.js', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('  let hudRects ='), source.indexOf('  function labels(camera)'));
function fixture() {
  let now = 0, hud = { left: 0, right: 390, top: 0, bottom: 120, width: 390, height: 120 }, scans = 0;
  const labelsEl = { clientWidth: 390, clientHeight: 760 };
  const document = { fonts: { status: 'loading' }, querySelectorAll: () => { scans++; return [{ getBoundingClientRect: () => hud }]; } };
  const box = { textContent: 'Xin chào bạn' }, name = { textContent: 'Nguyễn Văn An' };
  let width = 200, height = 80;
  const el = { querySelector: () => box, lastElementChild: name, classList: { contains: () => false }, get offsetWidth() { return width; }, get offsetHeight() { return height; } };
  const ctx = vm.createContext({ document, labelsEl, performance: { now: () => now }, U: { clamp: (v, a, b) => Math.max(a, Math.min(v, b)) } });
  vm.runInContext(helpers, ctx);
  return { ctx, labelsEl, document, el, box, at: (x, y) => ctx.keepBubbleVisible(el, x, y), get scans() { return scans; }, resize: (w, h, ew = width, eh = height) => { labelsEl.clientWidth = w; labelsEl.clientHeight = h; width = ew; height = eh; }, setHud: r => { hud = r; }, setNow: n => { now = n; } };
}
test('overhead chat stays within left/right/bottom edges and below the mobile HUD', () => {
  const f = fixture();
  const first = f.at(3, 10);
  assert.equal(f.scans, 1, 'HUD is measured on the very first frame');
  assert.equal(first.x, 104); assert.equal(first.y, 206);
  const right = f.at(389, 900);
  assert.equal(right.x, 286); assert.equal(right.y, 756);
  assert(right.x + f.el.offsetWidth / 2 <= 390 - 4);
  assert(right.y <= 760 - 4);
});
test('viewport rotation immediately refreshes HUD geometry and text dimensions', () => {
  const f = fixture(); f.at(100, 120);
  f.setNow(10); // still inside the normal HUD cache interval
  f.resize(568, 260, 180, 70);
  f.setHud({ left: 0, right: 568, top: 0, bottom: 128, width: 568, height: 128 });
  const at = f.at(550, 50);
  assert.equal(f.scans, 2); assert.equal(at.x, 474); assert.equal(at.y, 204);
  assert.equal(f.el._sz.h, 70, 'dimensions remeasured after landscape rotation');
});
test('same-length changed text and completed fonts invalidate cached bubble size', () => {
  const f = fixture(); f.box.textContent = 'iiii'; f.at(100, 100);
  f.box.textContent = 'WWWW'; f.resize(390, 760, 240, 90); f.at(100, 100);
  assert.equal(f.el._sz.w, 240, 'length alone cannot identify rendered text size');
  f.document.fonts.status = 'loaded'; f.resize(390, 760, 230, 100); f.at(100, 100);
  assert.equal(f.el._sz.h, 100, 'font completion triggers remeasurement');
});
test('label projection updates the camera matrix before using the current frame', () => {
  const f = fixture(); let updated = false, projected = false;
  const el = { style: {}, classList: { contains: () => false } };
  const vector = { x: 0, y: 0, z: 0, project() { assert(updated, 'projected using a stale camera matrix'); projected = true; this.y = 0; return this; } };
  const root = { visible: true, getWorldPosition: v => { v.x = v.y = v.z = 0; return v; } };
  Object.assign(f.ctx, { tmp: vector, me: { space: 'campus', mode: 'campus', y: 0 }, others: { list: [{ uid: 'peer', av: { root, act: null, headY: () => 1.8 }, label: el, seat: -1, d: 5, y: 0 }] }, acts: new Map(), myLabel: null, bLabels: [], U: { clamp: (v, a, b) => Math.max(a, Math.min(v, b)) } });
  vm.runInContext(source.slice(source.indexOf('  function labels(camera)'), source.indexOf('  function effects(dt, camera)')), f.ctx);
  f.ctx.labels({ updateMatrixWorld() { updated = true; } });
  assert(projected); assert.match(el.style.transform, /^translate\(/);
});
