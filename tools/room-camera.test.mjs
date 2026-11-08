// Geometry/near-plane regressions; construct real Three.js meshes without WebGL.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
class Element {
  classList = { add() {}, remove() {}, toggle() {} }; dataset = {}; style = {}; value = ''; hidden = false;
  addEventListener() {} removeEventListener() {} setAttribute() {} appendChild() {} setPointerCapture() {}
  querySelectorAll() { return []; } querySelector() { return new Element(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 500 }; }
}
const draw = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), measureText: () => ({ width: 1 }) }, { get: (o, k) => o[k] ?? (() => {}) });
const context = vm.createContext({ console, performance, setTimeout, clearTimeout, innerWidth: 800, innerHeight: 500,
  matchMedia: () => ({ matches: false }), addEventListener() {}, removeEventListener() {},
  document: { createElement: () => Object.assign(new Element(), { getContext: () => draw }) } });
context.window = context;
vm.runInContext(read('scene/vendor/three.min.js'), context);
const { THREE } = context;
THREE.OrbitControls = class { target = new THREE.Vector3(); addEventListener() {} update() {} };
vm.runInContext(read('scene/tang10.js'), context);
const roof = context.moduleD({ canvas: new Element(), renderer: { getPixelRatio: () => 1, capabilities: { getMaxAnisotropy: () => 1 }, render() {} } }, new Element());
roof.group.updateMatrixWorld(true);
const world = read('js/world.js');
Object.assign(context, { cam: { cur: null, ready: false }, opt: { reduce: false } });
vm.runInContext(world.slice(world.indexOf('  function placeCam('), world.indexOf('  /* ------------------------------------------------------------------\n     MỖI KHUNG HÌNH', world.indexOf('  function placeCam('))), context);
// Execute the actual A/B footprint functions with their actual scene constants.
const library = read('scene/hust3d.js');
const cameraInsideFunctions = [...library.matchAll(/function cameraInside\(x,z,foot\)\{[\s\S]*?\n\}/g)].map(m => m[0]);
const stadiums = [...library.matchAll(/const inside=\(x,z,r\)=>\{[^\n]+\};/g)].map(m => m[0]);
assert.equal(cameraInsideFunctions.length, 2);
function footprintA() {
  const ctx = vm.createContext({ Math, Number });
  const lines = [/^const XW=.*$/m, /^const liftZ=.*$/m, /^const LAND=.*$/m, /^const BRM=.*$/m, /^const levelOf=.*$/m].map(re => library.match(re)[0]);
  const dims = library.match(/^const X0=-21\.5,.*$/m)[0];
  vm.runInContext(dims + '\nconst ROOM={X0,X1,Z0,Z1};\n' + lines.join('\n') + '\n' + stadiums[0] + '\n' + cameraInsideFunctions[0], ctx);
  return ctx.cameraInside;
}
function footprintB() {
  const ctx = vm.createContext({ Math, Number });
  const lines = [/^const L=7\.5;.*$/m, /^const FR=11, WR=.*$/m, /^const SL=4\.1, MZ=.*$/m, /^const ROOF=CH.*$/m].map(re => library.match(re)[0]);
  vm.runInContext(lines.join('\n') + '\n' + stadiums[1] + '\n' + cameraInsideFunctions[1], ctx);
  return ctx.cameraInside;
}
const insideA = footprintA(), insideB = footprintB();

function pose(x, z, pitch = 0, distance = 3.4) {
  const focus = new THREE.Vector3(x, 1.5, z), el = .32 + pitch * .55;
  const c = new THREE.PerspectiveCamera(62, 1.6, .1, 4000);
  c.position.copy(focus).add(new THREE.Vector3(0, Math.sin(el), -Math.cos(el)).multiplyScalar(distance)); c.lookAt(focus);
  return { focus, camera: c, distance };
}
function rayTo(focus, camera, far = 3.6) {
  const ray = new THREE.Raycaster(focus, camera.position.clone().sub(focus).normalize(), .02, far);
  ray.params.Line.threshold = .045; return ray;
}
test('old roof camera intersects actual pergola beam; near-plane sweep keeps the camera before it', () => {
  const { focus, camera, distance } = pose(-5.24, -2.7, .3);
  const hit = rayTo(focus, camera).intersectObjects(roof.group.children, true).find(h => h.object.geometry.type === 'BoxGeometry');
  assert(hit && hit.distance < distance, 'old camera boom crosses the actual dark wood beam');
  const bounds = new THREE.Box3().setFromObject(hit.object);
  assert(bounds.containsPoint(camera.position), 'reported intermittent stripe reproduced: camera is inside the beam');
  const safe = roof.api.constrainCamera(camera, focus.x, focus.y, focus.z);
  assert(safe < distance - .15); assert(!bounds.containsPoint(camera.position));
  assert.equal(rayTo(focus, camera, safe + .08).intersectObjects([hit.object], false).length, 0, 'near camera no longer clips through beam');
});
test('default roof view cannot land on the dark sagging light strand', () => {
  const { focus, camera, distance } = pose(-8.1333333333, -1.9226);
  const hit = rayTo(focus, camera).intersectObjects(roof.group.children, true).find(h => h.object.isLine);
  assert(hit && Math.abs(hit.distance - distance) < .05, 'actual hanging strand passes through old camera position');
  const safe = roof.api.constrainCamera(camera, focus.x, focus.y, focus.z);
  assert(safe < distance - .1);
  assert.equal(rayTo(focus, camera, safe + .08).intersectObjects([hit.object], false).length, 0);
});
test('unobstructed rooftop view retains chosen distance and camera position', () => {
  const { focus, camera, distance } = pose(6, 0), before = camera.position.clone();
  assert.equal(roof.api.constrainCamera(camera, focus.x, focus.y, focus.z), distance);
  assert.equal(camera.position.distanceTo(before), 0);
});

function floorCamera(x, z, base, az, el, distance, inside = insideA) {
  const camera = new THREE.PerspectiveCamera(62, 1.8, .1, 100), ceil = base + 4;
  const space = { module: { api: { cameraInside: inside } } };
  const free = context.roomCameraFree(space, camera, base, ceil, az, el);
  const focus = new THREE.Vector3(x, base + 1.5, z);
  const old = focus.clone().add(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(distance));
  context.placeCam(camera, 1 / 60, focus.x, focus.y, focus.z, az, el, distance, free, false);
  return { camera, old, free, focus, ceil };
}
function nearCorners(camera) {
  camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
  return [-1, 1].flatMap(x => [-1, 1].map(y => new THREE.Vector3(x, y, -1).unproject(camera)));
}
test('floor-4 outer corner keeps centre and all near-plane corners inside its floor footprint', () => {
  const f = floorCamera(18.8, 12, 13.5, Math.PI / 4, .32, 3.4);
  assert.equal(f.free(f.old.x, f.old.y, f.old.z), false, 'old camera leaves library through corner');
  assert(f.free(f.camera.position.x, f.camera.position.y, f.camera.position.z), 'new camera near plane remains fully inside');
  assert(f.camera.position.distanceTo(f.focus) < 3.4);
  assert(f.camera.position.y > 13.5 && f.camera.position.y < f.ceil);
  for (const p of nearCorners(f.camera)) {
    assert(p.x < 19.42 && p.x > -19.42 && p.z < 12.92 && p.z > -12.92, 'independent projection keeps each corner inside the physical walls');
    assert(p.y > 13.5 && p.y < f.ceil);
  }
});
test('near-plane ceiling clearance works on each floor and after changing floors', () => {
  for (const base of [0, 4.5, 9, 13.5]) {
    const f = floorCamera(14, 8, base, Math.PI / 4, 1, 5.5);
    assert(!f.free(f.old.x, f.old.y, f.old.z));
    assert(f.free(f.camera.position.x, f.camera.position.y, f.camera.position.z));
    assert(f.camera.position.y < base + 4);
    for (const p of nearCorners(f.camera)) assert(p.y > base && p.y < base + 4, 'actual projected near-plane corner remains below ceiling');
  }
});
test('swept near-plane test checks requested endpoint between regular samples', () => {
  const f = floorCamera(0, 0, 0, 0, .02, 3.4, (_x, z) => z < 3.23);
  assert(!f.free(f.old.x, f.old.y, f.old.z));
  assert(f.free(f.camera.position.x, f.camera.position.y, f.camera.position.z));
});
test('actual A footprint preserves room401/lending wings, separating walls and the upper-floor atrium', () => {
  assert(insideA(-23, 0, 0)); assert(!insideA(-23, 0, 4.5));
  assert(insideA(20, -20, 13.5)); assert(!insideA(20, -12.5, 13.5), 'room401 expansion starts behind main back wall');
  assert(!insideA(21.6, -20, 13.5)); assert(!insideA(0, -39, 13.5));
  assert(insideA(0, 0, 0)); assert(!insideA(0, 0, 4.5)); assert(!insideA(0, 0, 9));
  assert(insideA(19.1, 10, 13.5), 'camera footprint uses physical margin rather than avatar furniture clearance');
});
test('room 419 on floor 4: through its doorways only, outside the lift core, not on lower floors', () => {
  assert(insideA(30, 0, 13.5)); assert(!insideA(30, 0, 9)); assert(!insideA(30, 0, 0));
  assert(insideA(19.6, 7.3, 13.5), 'doorway north of the lifts'); assert(insideA(19.6, -7.3, 13.5), 'doorway south of the lifts');
  assert(!insideA(19.6, 5, 13.5), 'solid wall between door and lifts'); assert(!insideA(21, 0, 13.5), 'lift core');
  assert(!insideA(30, 11, 13.5)); assert(!insideA(37, 0, 13.5));
});
test('actual B stadium footprint protects rounded corners, upper atrium and near-plane width', () => {
  assert(insideB(16, 0, 0)); assert(!insideB(16, 20, 0));
  assert(insideB(0, 0, 0)); assert(!insideB(0, 0, 5.25)); assert(insideB(0, 0, 10.8));
  const f = floorCamera(15.95, 5, 5.25, Math.PI / 2, .32, 3.4, insideB);
  assert(!insideB(f.old.x, f.old.z, 5.25));
  for (const p of nearCorners(f.camera)) assert(insideB(p.x, p.z, 5.25));
  assert(!insideB(NaN, 0, 0)); assert(!insideA(0, Infinity, 0));
});
