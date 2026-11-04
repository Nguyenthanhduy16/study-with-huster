// Regression coverage for the lift fixes on main, without a browser or WebGL.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('old scene frame cannot update World after a lift crosses from A to B', () => {
  const A = { api: { camera: {} } }, B = { api: { camera: {} } }, C = {}, D = {};
  let frames = 0, afters = 0; const events = [];
  const context = vm.createContext({ A, B, C, D, H: { cur: B }, performance,
    switching: false, cur: 'A', listeners: [() => frames++], after: [() => afters++],
    emit: (...args) => events.push(args) });
  const src = source('scene/adapter.js');
  const start = src.indexOf('    let last = performance.now(), staleFrame = false;');
  const end = src.indexOf('    /* đi bộ ra khỏi cửa thư viện', start);
  assert.ok(start >= 0 && end > start, 'test executes actual scene bridge');
  vm.runInContext(src.slice(start, end), context);
  A.onFrame(1 / 60, 1, A.api.camera); A.afterFrame();
  assert.equal(frames, 0); assert.equal(afters, 0); assert.equal(events.length, 0);
  B.onFrame(1 / 60, 2, B.api.camera); B.afterFrame();
  assert.equal(frames, 1); assert.equal(afters, 1);
  assert.deepEqual(events, [['space-changed', 'B']]);
});

test('third-person camera restoration targets its original scene after a lift transfer', () => {
  const context = vm.createContext({ console, window: {} });
  vm.runInContext(source('scene/vendor/three.min.js'), context);
  const { THREE } = context;
  const previous = new THREE.PerspectiveCamera(), current = new THREE.PerspectiveCamera();
  previous.position.set(20.5, 1.6, -2.9); current.position.set(17.5, 1.6, -2.9);
  const savedPos = previous.position.clone(), savedQ = previous.quaternion.clone();
  previous.position.set(23, 3, -4); // temporary third-person render position
  Object.assign(context, { hooks: { after: [] }, S: { camera: () => current },
    sp: () => ({ camera: current }), rcam: new THREE.PerspectiveCamera(), rcamOk: false,
    saved: { cam: previous, p: savedPos, q: savedQ } });
  const src = source('js/world.js');
  const start = src.indexOf('  function afterFrame() {'), end = src.indexOf('  function moveCampus(', start);
  assert.ok(start >= 0 && end > start, 'test executes actual World restoration');
  vm.runInContext(src.slice(start, end) + '\nafterFrame();', context);
  assert.equal(previous.position.x, 20.5);
  assert.equal(current.position.x, 17.5, 'new cabin camera must never inherit old scene coordinates');
  assert.equal(context.rcam.userData.of, current);
  assert.equal(context.saved, null);
});
