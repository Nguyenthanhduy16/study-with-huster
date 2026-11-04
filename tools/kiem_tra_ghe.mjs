#!/usr/bin/env node
/* Regression tests for actual World seating logic, without WebGL or a backend.
   Run: node tools/kiem_tra_ghe.mjs
   The VM seam only replaces rendering/network dependencies, not seating logic. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = file => fs.readFileSync(root + file, 'utf8');
const events = [], stored = new Map();
const context = vm.createContext({ console, performance, setTimeout, clearTimeout, Date, Math,
  document: { currentScript: { src: '/scene/adapter.js' } },
  U: { isTouch: false, isSmall: () => false, hanoiDay: () => '2026-11-04',
    clamp: (n, a, b) => Math.max(a, Math.min(b, n)),
    store: { get: (k, d) => stored.has(k) ? stored.get(k) : d, set: (k, v) => stored.set(k, v) },
    emitter: () => ({ emit: (n, ...args) => events.push([n, ...args]), on() {} }) },
  APP: { maxAvatars: { mobile: 16, desktop: 40 } },
  ZONES: { lib_a: { space: 'A', name: 'Tầng 1–4' }, lib_b: { space: 'B', name: 'Tầng 6–7' }, campus: { space: 'campus', name: 'Sân' } }
});
context.window = context;
context.addEventListener = () => {};
vm.runInContext(source('scene/vendor/three.min.js'), context);
vm.runInContext(source('js/grid.js'), context);
vm.runInContext(source('scene/adapter.js').replace('window.SceneAPI = SceneAPI;',
  'window.SceneAPI = SceneAPI; window.__librarySeat = librarySeat; window.__roofSeat = roofSeat;'), context);
vm.runInContext(source('js/world.js').replace('window.World = {', `
  window.__seatTest = {
    sitAt, pickSeat, seatSpots, followRoute, findNearSeat,
    route: () => route,
    occupants: list => { presence = list; },
    npcSeats: list => { Npc.reservedSeats = () => list; },
    reset(space) {
      S = { spaces: { A: space, B: space, campus: space } };
      me.uid = 'local'; me.zone = 'lib_a'; me.space = 'A'; me.mode = 'walk';
      me.x = me.y = me.z = me.yaw = me.speed = me.vx = me.vz = 0;
      me.seat = -1; me.special = null; route = null; presence = [];
      me.avatar = { root: new THREE.Group(), setSit(on) { this.sit = on; } };
      // Non-seating dependencies: no rendering, DOM labels, or remote avatars.
      showMarker = () => {}; syncOthers = () => {};
      Npc.list = () => []; Npc.reservedSeats = () => []; Npc.sync = Npc.clear = () => {};
    }
  };
  window.World = {`), context);
const { World, THREE, Grid, __seatTest: test, __librarySeat: seatFor } = context;
function makeSpace(overrides = {}) {
  const free = (x, z) => Math.abs(x) < 12 && Math.abs(z) < 12;
  const grid = Grid.sample(-12, -12, 12, 12, 0.25, free, 0);
  return Object.assign({ kind: 'room', seats: [{ x: 2, y: 0, z: 0, ry: 0, floor: 0, kind: 'chair' }],
    free, grid: () => grid, floorOf: y => Math.round(y / 4.5) * 4.5,
    group: new THREE.Group(), stopWalk() {},
    walkNow(x, y, z, yaw) { this.lastWalk = { x, y, z, yaw }; },
    place: () => 'Tầng 1', sitPiano() {}, module: { api: {} } }, overrides);
}
let passed = 0;
async function check(name, fn) {
  await fn(); passed++; console.log('  ĐẠT  ' + name);
}
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, message + ` (${actual} != ${expected})`);

await check('Mặt đệm/hông trùng đúng ghế 401, ghế tựa, sofa, ghế bành, ghế đôn, ghế băng và đảo thuyền', () => {
  for (const [n, top] of [['chair', 0.495], ['chairB', 0.485], ['sofa', 0.48], ['arm', 0.46], ['cube', 0.48], ['benchA', 0.5], ['benchM', 0.5], ['bench7', 0.48], ['booth', 0.5], ['island', 0.53]]) {
    for (const yaw of [0, Math.PI / 2, Math.PI, -0.7]) {
      const s = seatFor({ n, x: 3, y: 4.5, z: -2, ry: yaw }, n, y => y);
      // The avatar's seated hip is 0.53m high; its underside is 0.49m,
      // and its local hip is 0.1m behind root. Sofa cushion centre is +0.04m.
      close(s.y + 0.49, 4.5 + top, n + ' surface');
      close(s.x - Math.sin(yaw) * 0.1, 3 + Math.sin(yaw) * (n === 'sofa' ? 0.04 : 0), n + ' hip x');
      close(s.z - Math.cos(yaw) * 0.1, -2 + Math.cos(yaw) * (n === 'sofa' ? 0.04 : 0), n + ' hip z');
      assert.equal(s.floor, 4.5);
    }
  }
});
await check('Phòng đầy không chọn lại ghế đã có người', () => {
  const space = makeSpace(); test.reset(space);
  test.occupants([{ uid: 'other', zone: 'lib_a', seat: 0 }]);
  assert.equal(test.pickSeat(space, 0), -1);
  assert.equal(test.sitAt(0), false);
  assert.equal(World.me.seat, -1);
});
await check('Dành chỗ của NPC ngay lúc vào khu, trước khi vẽ NPC', () => {
  const space = makeSpace(); test.reset(space);
  test.npcSeats([{ id: 'thu-thu', seat: 0 }]);
  assert.equal(test.pickSeat(space, 0), -1); assert.equal(World.goSit(0), false);
  assert.equal(World.me.seat, -1);
});
await check('Sân thượng: ghế băng bù vị trí hông, ghế nằm chạm mặt đệm, gối lười giữ hướng', () => {
  const bench = context.__roofSeat({ x: 3, y: 0.18, z: 1, ry: Math.PI / 2, kind: 'bench' });
  close(bench.x - 0.1, 3, 'roof bench hip'); close(bench.y + 0.49, 0.67, 'deck bench surface');
  const lounger = context.__roofSeat({ x: 3, y: 0, z: 1.35, ry: 0, kind: 'lounger' });
  close(lounger.y + 0.5, 0.46, 'lounger cushion top'); assert.equal(lounger.z, 1.35);
  const beanbag = context.__roofSeat({ x: 3.1, y: 0.06, z: 1, ry: Math.PI / 2, kind: 'beanbag' });
  assert.equal(beanbag.ry, Math.PI / 2); close(beanbag.x - 0.1, 3, 'beanbag hip');
});
await check('Đi tới ghế bằng đường đi bộ rồi mới ngồi đúng vị trí/hướng', () => {
  const space = makeSpace(); test.reset(space);
  assert.equal(World.goSit(0), true);
  assert.equal(World.me.seat, -1);
  const route = test.route(); assert.ok(route && route.pts.length);
  const end = route.pts.at(-1); World.me.x = end.x; World.me.z = end.z;
  test.followRoute(1 / 60);
  assert.equal(World.me.mode, 'seat'); assert.equal(World.me.seat, 0);
  close(World.me.avatar.root.position.x, 2, 'seated root x');
  close(World.me.avatar.root.rotation.y, 0, 'seated facing');
});
await check('Ghế bị chiếm trong lúc đi tới không bị ngồi đè', () => {
  const space = makeSpace(); test.reset(space);
  assert.equal(World.goSit(0), true);
  const end = test.route().pts.at(-1); World.me.x = end.x; World.me.z = end.z;
  test.occupants([{ uid: 'other', zone: 'lib_a', seat: 0 }]);
  test.followRoute(1 / 60);
  assert.equal(World.me.seat, -1); assert.equal(World.me.mode, 'walk');
});
await check('Đứng dậy tìm lối trống, giải phóng ghế và phát vị trí nghỉ ngay', () => {
  const space = makeSpace({ free: (x, z) => x > 1.5 && z > 0.7 }); test.reset(space);
  assert.equal(test.sitAt(0), true); events.length = 0;
  assert.equal(World.standUp(), true);
  assert.equal(World.me.seat, -1); assert.equal(World.me.mode, 'walk');
  assert.ok(space.free(World.me.x, World.me.z));
  assert.ok(events.some(e => e[0] === 'rest'));
  assert.ok(events.some(e => e[0] === 'seat-changed' && e[1] === -1));
});
await check('Không đặt người vào vật cản nếu quanh ghế chưa có lối đứng', () => {
  const space = makeSpace({ free: () => false }); test.reset(space);
  test.sitAt(0);
  assert.equal(World.standUp(), false); assert.equal(World.me.seat, 0);
  assert.equal(World.me.mode, 'seat');
});
await check('Ghế ở tầng khác hoặc không có đường tới không gây dịch chuyển', () => {
  const space = makeSpace(); test.reset(space);
  space.seats.push({ x: 3, y: 4.5, z: 0, ry: 0, floor: 4.5, kind: 'chair' });
  assert.equal(World.goSit(1), false); assert.equal(World.me.x, 0); assert.equal(World.me.y, 0);
  space.grid = () => ({ path: () => null });
  assert.equal(World.goSit(0), false); assert.equal(World.me.x, 0); assert.equal(World.me.seat, -1);
});
await check('Trùng ghế đàn qua presence: người đến sau đứng dậy thay vì chiếm đàn', () => {
  const space = makeSpace(); space.seats[0].kind = 'piano'; test.reset(space);
  test.sitAt(0); assert.equal(World.me.mode, 'piano');
  World.setPresence([{ uid: 'earlier', zone: 'lib_a', seat: 0, sts: 1 }]);
  assert.equal(World.me.seat, -1); assert.equal(World.me.mode, 'walk');
});
await check('Đến chỗ bạn khác khu/tầng chỉ hướng dẫn, không dịch chuyển', async () => {
  test.reset(makeSpace());
  assert.equal(await World.goNear('lib_b', { x: 3, y: 0, z: 0 }), false);
  assert.equal(await World.goNear('lib_a', { x: 3, y: 4.5, z: 0 }), false);
  assert.equal(World.me.zone, 'lib_a'); assert.equal(World.me.x, 0); assert.equal(World.me.y, 0);
});
await check('Sân dùng bán kính va chạm nhân vật, không nhầm floor=0 thành radius=0', () => {
  const radii = [], space = makeSpace({ kind: 'campus', floorOf: () => 0, floorAt: () => 0,
    free: (x, z, radius) => { radii.push(radius); return true; } });
  test.reset(space); World.me.space = 'campus'; World.me.zone = 'campus'; World.me.mode = 'campus';
  assert.ok(test.seatSpots(space, space.seats[0]).length);
  assert.ok(radii.every(r => r === 0.22));
});
await check('Điểm rẽ giữa đường chỉ bỏ qua khi đã sát (không cắt góc bàn/hàng ghế)', () => {
  const space = makeSpace(); test.reset(space);
  World.goSit(0); const r = test.route();
  r.pts = [{ x: 0.35, z: 0 }, { x: 0.35, z: 3 }];
  const d = test.followRoute(1 / 60);
  assert.ok(d && d.x > 0.99, 'vẫn đi tới điểm rẽ cách 0,35 m');
  World.me.x = 0.2; test.followRoute(1 / 60);
  assert.equal(test.route().pts.length, 1, 'tới sát 0,15 m mới sang đoạn kế');
});
await check('Kẹt giữa đường: tìm lại đường một lần, vẫn kẹt thì báo và không dịch chuyển', () => {
  const space = makeSpace(); test.reset(space);
  World.goSit(0); const r = test.route(); r.pts = [{ x: 0, z: 5 }]; events.length = 0;
  for (let k = 0; k < 120; k++) test.followRoute(1 / 60);       // đứng yên 2 giây
  assert.ok(test.route() && test.route().replanned, 'tìm lại đường từ chỗ đang đứng');
  for (let k = 0; k < 120; k++) test.followRoute(1 / 60);
  assert.equal(test.route(), null);
  assert.ok(events.some(e => e[0] === 'toast' && /vướng/.test(e[1])), 'có thông báo cho người chơi');
  assert.equal(World.me.x, 0); assert.equal(World.me.z, 0); assert.equal(World.me.seat, -1);
});
console.log(`\n${passed} nhóm kiểm thử ghế ĐẠT (không thay thế kiểm tra hình ảnh WebGL).`);
