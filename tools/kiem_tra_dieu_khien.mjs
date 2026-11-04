#!/usr/bin/env node
// Exercise the actual World input handlers without requiring WebGL or a browser.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../js/world.js', import.meta.url), 'utf8');
class Surface {
  events = new Map(); style = {};
  addEventListener(type, fn) { const list = this.events.get(type) || []; list.push(fn); this.events.set(type, list); }
  send(type, value = {}) {
    const event = { type, target: this, code: '', key: '', pointerId: 1, pointerType: 'mouse', button: 0, clientX: 300, clientY: 200,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...value };
    for (const fn of this.events.get(type) || []) fn(event);
    return event;
  }
  setPointerCapture() {} releasePointerCapture() {}
  focus() { this.focused = true; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
}
const windowEvents = new Surface(), document = new Surface(), canvas = new Surface(), joystick = new Surface();
const knob = { style: {} }; joystick.querySelector = () => knob;
// nhãn tên của người khác (nằm đè lên khung 3D): bắt đầu kéo trên nhãn vẫn phải xoay camera
const labelsEl = new Surface(), tag = { classList: { contains: () => false }, isConnected: true, clicks: 0, click() { this.clicks++; } };
tag.closest = sel => (sel === '.po-tag' ? tag : null);
document.head = { appendChild() {} }; document.getElementById = () => joystick;
const api = { yaw: 0, pitch: 0, keys: {} }, room = { kind: 'room', module: { api } };
const sandbox = {
  document, canvas, labelsEl, performance, Math, Map, console,
  addEventListener: windowEvents.addEventListener.bind(windowEvents),
  U: { clamp: (v, min, max) => Math.max(min, Math.min(max, v)), h: () => ({}) },
  me: { mode: 'walk' }, keys: { f: 0, b: 0, l: 0, r: 0, tl: 0, tr: 0, run: 0 },
  joy: { x: 0, y: 0, on: false }, opt: { view: 'third', look: .55, reduce: false },
  cam: { az: 0, el: .45 }, frozen: false, observe: null, going: false, camHold: null, route: null, autoDrive: false,
  sp: () => room, click: () => { sandbox.clicks++; }, clicks: 0, hover() {}, standUp() {}, useKey() {},
  curDist: () => sandbox.distance, setDist: d => { sandbox.distance = d; }, distance: 3.4
};
const ctx = vm.createContext(sandbox);
vm.runInContext(source.slice(source.indexOf('  function liftCameraLocked()'), source.indexOf('  function applyOpt()')), ctx);
vm.runInContext(source.slice(source.indexOf('  const KMAP ='), source.indexOf('  function curKind()')) + '\nbindInput();', ctx);
// Also register the real embedded scene look handlers on the same canvas. They must
// leave look to World, otherwise every drag rotates twice or another finger steals it.
const sceneSource = fs.readFileSync(new URL('../scene/hust3d.js', import.meta.url), 'utf8');
const sceneCtx = vm.createContext({ canvas, mode: 'walk', yaw: 0, pitch: 0, touch: false, window: { __POTA: true, __LOOK_K: .55 } });
const startScene = sceneSource.indexOf('let look=null;');
vm.runInContext(sceneSource.slice(startScene, sceneSource.indexOf("$('#t-night')", startScene)), sceneCtx);
const key = (type, code, extra = {}) => windowEvents.send(type, { code, key: code.replace(/^Key/, '').toLowerCase(), ...extra });
const pointer = (type, x, y, extra = {}) => canvas.send(type, { clientX: x, clientY: y, ...extra });
const run = code => vm.runInContext(code, ctx);

key('keydown', 'KeyW'); key('keydown', 'KeyD');
pointer('pointerdown', 300, 200); pointer('pointermove', 420, 230);
assert(api.yaw > .2 && api.pitch > 0, 'drag rotates room view while W+D remain held');
assert.equal(sceneCtx.yaw, 0, 'embedded scene cannot apply a second look rotation');
assert.equal(api.keys.f, 1); assert.equal(api.keys.r, 1);
assert.equal(canvas.focused, true, 'clicking scene takes keyboard focus back from chat');
const yaw = api.yaw;
pointer('pointermove', 800, 500, { pointerId: 99 }); assert.equal(api.yaw, yaw, 'untracked pointer cannot turn view');
pointer('pointerup', 420, 230); assert.equal(sandbox.clicks, 0, 'drag cannot become click-to-walk');
key('keyup', 'KeyW'); key('keyup', 'KeyD'); assert.equal(api.keys.f + api.keys.r, 0);

pointer('pointerdown', 200, 200, { pointerType: 'touch', pointerId: 2 });
pointer('pointerdown', 300, 200, { pointerType: 'touch', pointerId: 3 });
pointer('pointermove', 400, 200, { pointerType: 'touch', pointerId: 3 });
assert.equal(api.yaw, yaw, 'two-finger zoom does not rotate view'); assert(sandbox.distance < 3.4);
pointer('pointerup', 200, 200, { pointerType: 'touch', pointerId: 2 });
pointer('pointerup', 400, 200, { pointerType: 'touch', pointerId: 3 }); assert.equal(sandbox.clicks, 0);

joystick.send('pointerdown', { pointerType: 'touch', pointerId: 7, clientX: 50, clientY: 10 });
pointer('pointerdown', 300, 200, { pointerType: 'touch', pointerId: 8 });
pointer('pointermove', 350, 200, { pointerType: 'touch', pointerId: 8 }); run('driveRoom()');
assert(sandbox.joy.on && api.keys.f > .7 && api.yaw > yaw, 'joystick and independent look finger work simultaneously');
pointer('pointerup', 350, 200, { pointerType: 'touch', pointerId: 8 }); assert(sandbox.joy.on);
windowEvents.send('blur'); assert.equal(sandbox.joy.on, false); assert.equal(api.keys.f, 0);

key('keydown', 'KeyW');
document.send('focusin', { target: { tagName: 'INPUT', type: 'text' } }); assert.equal(api.keys.f, 0, 'chat focus immediately releases movement');
key('keydown', 'KeyW', { ctrlKey: true }); assert.equal(api.keys.f, 0, 'browser shortcuts cannot move avatar');
key('keydown', 'KeyW'); run('frozen = true; resetInput()'); assert.equal(api.keys.f, 0, 'opening a modal stops held movement');
const beforeFrozen = api.yaw; pointer('pointerdown', 300, 200); pointer('pointermove', 400, 200); assert.equal(api.yaw, beforeFrozen);
run('frozen = false; me.mode = "campus"');
pointer('pointerdown', 300, 200, { button: 2 }); pointer('pointermove', 400, 200, { button: 2 });
assert(sandbox.cam.az < 0, 'right drag turns campus camera'); pointer('pointerup', 400, 200, { button: 2 }); assert.equal(sandbox.clicks, 0);
run('me.mode = "walk"');
const yawTag = api.yaw; key('keydown', 'KeyW');
labelsEl.send('pointerdown', { target: tag, clientX: 300, clientY: 200 }); pointer('pointermove', 360, 200);
assert(api.yaw > yawTag, 'kéo bắt đầu trên nhãn tên của người khác vẫn xoay camera khi đang giữ W');
pointer('pointerup', 360, 200); assert.equal(tag.clicks, 0, 'kéo trên nhãn không mở hồ sơ'); assert.equal(api.keys.f, 1);
const nativeLabelClick = (target = tag, extra = {}) => {
  const event = labelsEl.send('click', { target, isTrusted: true, detail: 1, ...extra });
  if (!event.stopped) target.click();
  return event;
};
assert(nativeLabelClick().stopped, 'trusted compatibility click after label drag is suppressed');
assert.equal(tag.clicks, 0);
labelsEl.send('pointerdown', { target: tag, clientX: 300, clientY: 200 }); pointer('pointerup', 301, 200);
assert.equal(tag.clicks, 1, 'bấm nhanh trên nhãn vẫn mở hồ sơ'); assert.equal(sandbox.clicks, 0, 'bấm nhãn không thành bấm-để-đi');
assert(nativeLabelClick().stopped, 'native click after programmatic label tap cannot open twice');
assert.equal(tag.clicks, 1);
labelsEl.send('pointerdown', { target: tag, pointerId: 12, clientX: 300, clientY: 200 });
pointer('pointercancel', 300, 200, { pointerId: 12 });
const canceledYaw = api.yaw;
pointer('pointermove', 430, 200, { pointerId: 12 });
assert.equal(api.yaw, canceledYaw, 'canceled label pointer is no longer tracked');
assert(nativeLabelClick().stopped, 'cancel cannot open a profile through compatibility click');
labelsEl.send('pointerdown', { target: tag, pointerId: 13, clientX: 300, clientY: 200 });
pointer('lostpointercapture', 300, 200, { pointerId: 13 });
pointer('pointerup', 300, 200, { pointerId: 13 });
assert.equal(tag.clicks, 1, 'lost pointer capture cannot synthesize a profile tap');
assert(nativeLabelClick().stopped);
assert.equal(nativeLabelClick(tag, { detail: 0 }).stopped, undefined, 'keyboard-generated label clicks remain accessible');
const otherTag = { ...tag, clicks: 0 }; otherTag.closest = () => otherTag;
assert.equal(nativeLabelClick(otherTag).stopped, undefined, 'a different label is not suppressed by the previous gesture');
key('keyup', 'KeyW'); assert.equal(api.keys.f, 0);
console.log('ĐẠT: WASD + kéo chuột/nhãn; cần điều khiển + vuốt; pinch; cancel/lost capture; chống mở hồ sơ hai lần; blur/chat/modal xoá đầu vào.');
