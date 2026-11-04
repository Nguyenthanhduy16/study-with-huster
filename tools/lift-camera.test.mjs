// Actual World camera/input functions + actual scene cabin queries, without WebGL.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const sceneSource = read('scene/hust3d.js');
const queries = [...sceneSource.matchAll(/inLift:\(\)=>[\s\S]*?\)\),/g)].map(m => m[0]);
assert.equal(queries.length, 2, 'both library scene APIs expose actual cabin queries');
const cabinTests = [...sceneSource.matchAll(/const inCab=\(l,x,z\)=>[^;]+;/g)].map(m => m[0]);
assert.equal(cabinTests.length, 2);

class Surface {
  events = new Map();
  addEventListener(type, fn) { this.events.set(type, [...(this.events.get(type) || []), fn]); }
  fire(type, values = {}) {
    const e = { type, target: this, pointerId: 1, pointerType: 'touch', button: 0,
      clientX: 300, clientY: 200, preventDefault() {}, stopImmediatePropagation() {}, ...values };
    for (const fn of this.events.get(type) || []) fn(e);
  }
  setPointerCapture() {} releasePointerCapture() {} focus() {}
}
function fixture() {
  const storage = new Map(), canvas = new Surface(), labels = new Surface(), document = new Surface();
  document.head = { appendChild() {} }; document.getElementById = () => null;
  const context = vm.createContext({ console, performance, setTimeout, clearTimeout, document,
    addEventListener() {}, APP: { maxAvatars: { mobile: 16, desktop: 40 } },
    U: { isSmall: () => false, isTouch: false, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), h: () => ({}),
      store: { get: (k, fallback) => storage.get(k) ?? fallback, set: (k, v) => storage.set(k, structuredClone(v)) },
      emitter: () => ({ emit() {}, on() {} }) }, ZONES: {} });
  context.window = context;
  vm.runInContext(read('scene/vendor/three.min.js'), context);
  vm.runInContext(read('js/world.js').replace('  window.World = {', `
  window.__liftCamera = {
    use(space, id) {
      S = { spaces: { [id]: space }, camera: () => space.camera };
      me.space = id; me.zone = id === 'A' ? 'lib_a' : 'lib_b'; me.mode = 'walk';
      me.avatar = { root: new THREE.Group(), setSit() {} };
      me.x = space.camera.position.x; me.y = space.camera.position.y - 1.6; me.z = space.camera.position.z;
      me.yaw = me.speed = me.vx = me.vz = 0; me.seat = -1;
      saved = null; going = false; observe = null; route = null;
      followRoute = () => null; updatePlace = sendPos = () => {};
    },
    frame: roomFrame, restore: afterFrame, locked: liftCameraLocked, view: effectiveView, zoom: setDist,
    distance: () => cam.dist.walk, saved: () => saved,
    bind(c, labels) { canvas = c; labelsEl = labels; bindInput(); },
    setMode, setObserveMode(on) { observe = on ? {} : null; },
    routeStep(fn) { followRoute = fn; }
  };
  window.World = {`), context);
  const { THREE, World, __liftCamera: control } = context;
  function makeScene(id) {
    const i = id === 'A' ? 0 : 1, camera = new THREE.PerspectiveCamera(62);
    const cabin = { z: -2.9, floor: i ? 6 : 1, y: 0, phase: 'idle' };
    camera.position.set(i ? 15 : 18, 1.6, cabin.z);
    const state = vm.createContext({ camera, mode: 'walk', LIFTS: [cabin], rider: null,
      base: 0, level: 6, XW: 19.5, WR: 16.5, CX1: i ? 18.65 : 21.65, Math });
    vm.runInContext(cabinTests[i], state);
    const api = vm.runInContext('({' + queries[i] + '})', state);
    Object.assign(api, { camera, keys: {}, yaw: 0, pitch: 0, getMode: () => state.mode, busy: () => false });
    Object.defineProperty(api, 'rider', { get: () => state.rider });
    const space = { kind: 'room', camera, module: { api }, seats: [], floorOf: () => 0,
      ceil: () => 4.2, free: () => true, camFree: () => true };
    return { id, state, api, camera, cabin, space,
      enter() { camera.position.set(i ? 17.5 : 20.5, cabin.y + 1.6, cabin.z); },
      leave() { camera.position.set(i ? 15 : 18, cabin.y + 1.6, cabin.z); state.rider = null; } };
  }
  const A = makeScene('A'), B = makeScene('B');
  control.use(A.space, 'A'); control.bind(canvas, labels);
  return { context, World, control, canvas, storage, A, B,
    frame(scene = A) { control.frame(1 / 60, scene.camera); },
    use(scene) { control.use(scene.space, scene.id); } };
}

test('entering either cabin forces eye camera before rider state updates, then restores preferred view on exit', () => {
  for (const id of ['A', 'B']) {
    const f = fixture(), scene = f[id]; f.use(scene); scene.enter();
    assert.equal(scene.state.rider, null, 'entry frame has not assigned rider yet');
    assert.equal(f.control.locked(), true);
    const eye = scene.camera.position.clone(); f.frame(scene);
    assert.equal(f.control.view(), 'first'); assert.equal(f.control.saved(), null, 'no third-person displacement');
    assert.equal(scene.camera.position.distanceTo(eye), 0); assert.equal(scene.camera.fov, 70);
    assert.equal(f.World.me.avatar.root.visible, false); assert.equal(f.World.opt.view, 'third');
    scene.leave(); f.frame(scene);
    assert.equal(f.control.view(), 'third'); assert.equal(scene.camera.fov, 62);
    assert.equal(f.World.me.avatar.root.visible, true); assert(f.control.saved(), 'third-person camera restored on exit');
  }
});

test('closing, moving, cross-scene transfer and repeated entry keep the cabin camera at eye height', () => {
  const f = fixture();
  for (const scene of [f.A, f.B, f.A]) {
    f.use(scene); scene.enter(); scene.state.rider = scene.cabin;
    for (const phase of ['closing', 'moving', 'xfer', 'idle']) {
      scene.cabin.phase = phase;
      assert.equal(f.control.locked(), true, scene.id + ': ' + phase);
      f.frame(scene); assert.equal(f.control.saved(), null); assert.equal(f.World.me.avatar.root.visible, false);
      assert.equal(f.World.opt.view, 'third');
    }
    scene.leave(); assert.equal(f.control.locked(), false);
  }
  f.World.me.mode = 'campus'; assert.equal(f.control.view(), 'third', 'no stale lock after leaving library');
});

test('a cabin on another floor or an unoccupied moving car cannot force the view', () => {
  const f = fixture(); f.A.enter(); f.A.cabin.y = 4.5;
  assert.equal(f.control.locked(), false);
  f.use(f.B); f.B.enter(); f.B.cabin.floor = 7; assert.equal(f.control.locked(), false);
  f.B.cabin.phase = 'moving'; f.B.state.rider = null; assert.equal(f.control.locked(), false);
  f.B.state.rider = f.B.cabin; assert.equal(f.control.locked(), true);
});

test('view toggles, wheel, pinch and direct zoom cannot escape first-person or alter the previous distance', () => {
  const f = fixture(); f.A.enter(); f.frame();
  const distance = f.control.distance();
  f.World.setOpt({ view: 'first', look: .75 });
  assert.equal(f.World.opt.view, 'third', 'toggle ignored until cabin exit'); assert.equal(f.World.opt.look, .75);
  assert.equal(f.storage.get('view').view, 'third', 'temporary lift camera is never persisted');
  f.control.zoom(5); f.canvas.fire('wheel', { deltaY: 100 });
  f.canvas.fire('pointerdown', { pointerId: 1, clientX: 200 });
  f.canvas.fire('pointerdown', { pointerId: 2, clientX: 300 });
  f.canvas.fire('pointermove', { pointerId: 2, clientX: 500 });
  f.canvas.fire('pointerup', { pointerId: 1, clientX: 200 });
  f.canvas.fire('pointerup', { pointerId: 2, clientX: 500 });
  assert.equal(f.control.distance(), distance); f.frame(); assert.equal(f.control.saved(), null);
  f.A.leave(); f.frame(); assert.equal(f.World.opt.view, 'third');
  f.control.restore(); f.canvas.fire('wheel', { deltaY: 100 }); assert(f.control.distance() > distance, 'zoom available outside cabin');
});

test('a previously chosen first-person view remains first-person after leaving the cabin', () => {
  const f = fixture(); f.World.setOpt({ view: 'first' }); f.A.enter();
  f.World.setOpt({ view: 'third' }); assert.equal(f.World.opt.view, 'first');
  f.A.leave(); f.frame(); assert.equal(f.control.view(), 'first');
  assert.equal(f.World.me.avatar.root.visible, false); assert.equal(f.control.saved(), null);
});

test('click-walk entering the cabin during World update locks before third-person render', () => {
  const f = fixture();
  f.control.routeStep(() => { f.A.enter(); return null; });
  f.frame(); assert.equal(f.control.view(), 'first'); assert.equal(f.control.saved(), null);
  assert.equal(f.A.camera.position.x, 20.5); assert.equal(f.World.me.avatar.root.visible, false);
});

test('actual walk frame clamps a wall-corner camera using the current floor footprint', () => {
  const f = fixture(); f.A.camera.position.set(18.8, 15.1, 12); f.A.state.base = 13.5;
  f.A.api.yaw = -Math.PI / 4;
  f.A.space.floorOf = () => 13.5;
  f.A.api.cameraInside = (x, z, foot) => { assert.equal(foot, 13.5); return x < 19.42 && x > -19.42 && z < 12.92 && z > -12.92; };
  f.frame();
  assert(f.A.camera.position.x < 19.42 && f.A.camera.position.z < 12.92, 'camera remains inside instead of exposing the lower floor');
  const { THREE } = f.context; f.A.camera.updateMatrixWorld(true);
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const corner = new THREE.Vector3(x, y, -1).unproject(f.A.camera);
    assert(corner.x < 19.42 && corner.z < 12.92 && corner.y > 13.5);
  }
  assert.equal(f.World.opt.view, 'third');
});

test('actual walk frame invokes rooftop geometry clearance and restores the avatar after a close obstruction', () => {
  const f = fixture(); let calls = 0;
  f.A.api.constrainCamera = (camera, x, y, z) => { calls++; assert.equal(x, 18); assert.equal(y, 1.5); assert.equal(z, -2.9); camera.position.set(x, y + .1, z - Math.sqrt(.08)); camera.lookAt(x, y, z); return .3; };
  f.frame(); assert.equal(calls, 1); assert.equal(f.World.me.avatar.root.visible, false);
  f.control.restore(); delete f.A.api.constrainCamera; f.frame();
  assert.equal(f.World.me.avatar.root.visible, true, 'avatar visibility returns when no close geometry obstructs camera');
});


test('both library cameras hide the own head when a wall permits only a short boom, then restore it', () => {
  for (const id of ['A', 'B']) {
    const f = fixture(), scene = f[id]; f.use(scene);
    const focus = scene.camera.position.clone(); focus.y -= .1;
    scene.api.cameraInside = (x, z) => Math.hypot(x - focus.x, z - focus.z) < .38;
    f.frame(scene);
    assert(f.control.saved(), 'valid short boom is used');
    assert(scene.camera.position.distanceTo(focus) < .45);
    assert.equal(f.World.me.avatar.root.visible, false, id + ': own hair cannot cover close camera');
    f.control.restore(); delete scene.api.cameraInside; f.frame(scene);
    assert.equal(f.World.me.avatar.root.visible, true);
  }
});

test('door strips before cabin detection and impossible wall corners use the walking eye without changing preferences', () => {
  for (const id of ['A', 'B']) {
    const f = fixture(), scene = f[id]; f.use(scene);
    const edge = id === 'A' ? 19.5 : 16.5;
    scene.camera.position.set(edge + .1, 1.6, scene.cabin.z);
    scene.api.cameraInside = (x, z) => x < edge - .08;
    assert.equal(f.control.locked(), false, 'door strip is not inside the cabin yet');
    const eye = scene.camera.position.clone(), distance = f.control.distance();
    f.frame(scene);
    assert.equal(scene.camera.position.distanceTo(eye), 0, 'eye is preserved instead of rendering outside the floor');
    assert.equal(f.control.saved(), null); assert.equal(scene.camera.fov, 70);
    assert.equal(f.World.me.avatar.root.visible, false); assert.equal(f.World.opt.view, 'third');
    assert.equal(f.control.distance(), distance);
    scene.enter(); f.frame(scene); assert.equal(f.control.locked(), true);
    assert.equal(f.control.saved(), null, 'cabin keeps existing first-person lock');
    scene.leave(); f.frame(scene);
    assert.equal(scene.camera.fov, 62); assert.equal(f.World.me.avatar.root.visible, true);
    assert(f.control.saved(), 'third person returns after doorway exit');
  }
});
