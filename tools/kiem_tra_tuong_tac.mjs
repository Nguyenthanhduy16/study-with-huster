#!/usr/bin/env node
// DOM/VM regressions for radial controls, chat moderation and startup without a GPU.
// Run: node tools/kiem_tra_tuong_tac.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const source = file => fs.readFileSync(repo + file, 'utf8');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('ĐẠT ' + name); }
function dom() {
  const ids = new Map(), globalEvents = new Map();
  let document;
  class Node {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}; this.events = new Map(); this.hidden = false; this.nodeType = 1; this.isConnected = true; this.textContent = ''; const names = new Set(); this.classList = { add: (...a) => a.forEach(x => names.add(x)), remove: (...a) => a.forEach(x => names.delete(x)), contains: x => names.has(x), toggle: (x, on = !names.has(x)) => on ? names.add(x) : names.delete(x), toString: () => [...names].join(' ') }; }
    setAttribute(k, v) { v = String(v); this.attrs[k] = v; if (k === 'class') this.classList.add(...v.split(/\s+/)); if (k === 'id') { this.id = v; ids.set(v, this); } if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; if (k === 'hidden') this.hidden = true; }
    getAttribute(k) { return this.attrs[k]; }
    append(...nodes) { for (let n of nodes.flat()) { if (n == null || n === false) continue; if (typeof n !== 'object') n = Object.assign(new Node('text'), { textContent: String(n) }); n.parentElement = this; this.children.push(n); } }
    appendChild(n) { this.append(n); return n; }
    replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(n => n !== this); this.isConnected = false; }
    get firstElementChild() { return this.children[0]; }
    contains(n) { return n === this || this.children.some(c => c.contains(n)); }
    querySelectorAll(selector) { const part = selector.split(' ').at(-1), klass = part.startsWith('.') ? part.slice(1) : null; const all = this.children.flatMap(c => [c, ...c.querySelectorAll('*')]); return selector === '*' ? all : all.filter(n => klass ? n.classList.contains(klass) : n.tagName.toLowerCase() === part); }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    addEventListener(k, f) { if (!this.events.has(k)) this.events.set(k, []); this.events.get(k).push(f); }
    dispatch(k, data = {}) { const e = { target: this, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...data }; for (const f of this.events.get(k) || []) f(e); }
    focus() { document.activeElement = this; }
    setPointerCapture() {}
  }
  document = { body: new Node('body'), activeElement: null, hidden: false, createElement: t => new Node(t), createElementNS: (_, t) => new Node(t), getElementById: id => ids.get(id) || null, querySelector: s => s.startsWith('#') ? ids.get(s.slice(1)) : document.body.querySelector(s), addEventListener: (k, f) => { if (!globalEvents.has(k)) globalEvents.set(k, []); globalEvents.get(k).push(f); } };
  const h = (sel, attrs, ...kids) => { const n = new Node(sel.match(/^[a-z0-9]+/i)?.[0] || 'div'); for (const m of sel.matchAll(/[.#][\w-]+/g)) m[0][0] === '.' ? n.classList.add(m[0].slice(1)) : n.setAttribute('id', m[0].slice(1)); for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (k === 'style') Object.assign(n.style, v); else if (k === 'text') n.textContent = v; else n.setAttribute(k, v); } n.append(...kids.flat()); return n; };
  const emit = (k, data = {}) => { for (const fn of globalEvents.get(k) || []) fn({ target: document.body, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...data }); };
  const remove = (k, f) => globalEvents.set(k, (globalEvents.get(k) || []).filter(x => x !== f));
  const U = { h, isTouch: false, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
  return { document, h, emit, U, addEventListener: document.addEventListener, removeEventListener: remove };
}
const D = dom(), { h, document, U, emit } = D;
const button = h('button#po-wheel-btn'), modal = h('div#po-modal', { hidden: true }), login = h('div#po-login', { hidden: true }); document.body.append(button, modal, login); button.focus();
const calls = [], activities = new Map();
const World = { me: { mode: 'campus' }, actOf: id => activities.get(id), setAct: (id, k) => { activities.set(id, k); calls.push(['act', k]); return true; }, emote: (id, k) => { calls.push(['emote', k]); return true; }, freeze: on => calls.push(['freeze', on]) };
const AV2 = { ACTS: { doc: { label: 'Đọc sách', icon: '📖' }, 'dien-thoai': { label: 'Bấm điện thoại', icon: '📱' }, laptop: { label: 'Dùng laptop', icon: '💻' } }, EMOTES: Object.fromEntries(['vay', 'co-vu', 'thich', 'cui-chao', 'vuon-vai'].map(k => [k, { label: k, icon: '👋' }])) };
const timers = [];
const context = vm.createContext({ ...D, h, U, $: s => document.querySelector(s), World, AV2, net: { me: { id: 'self' } }, toast() {}, innerWidth: 1024, innerHeight: 768, performance: { now: () => 100 }, requestAnimationFrame: f => f(), setTimeout: f => { timers.push(f); return timers.length; }, clearTimeout() {} }); context.window = context;
const app = source('js/app.js'), start = app.indexOf('  const Wheel = (() => {'), end = app.indexOf('  function updateMini()', start);
vm.runInContext(app.slice(start, end) + '\nglobalThis.Wheel = Wheel;', context);
context.Wheel.bindButton(button);
const key = (code, extra = {}) => emit('keydown', { code, key: code, timeStamp: 100, ...extra });
check('Q opens wheel and pauses movement', () => { key('KeyQ'); assert.equal(context.Wheel.open, true); assert.deepEqual(calls.at(-1), ['freeze', true]); assert.equal(button.attrs['aria-expanded'], 'true'); });
check('Holding Q, selecting number sends wave and closes', () => { key('Digit1'); assert.equal(context.Wheel.open, false); assert.deepEqual(calls.slice(-2), [['freeze', false], ['emote', 'vay']]); });
check('Quick Q tap keeps wheel open and traps keyboard focus', () => { key('KeyQ'); emit('keyup', { code: 'KeyQ', timeStamp: 150 }); assert.equal(context.Wheel.open, true); assert.equal(document.activeElement.classList.contains('po-wheel-hub'), true); key('Tab', { key: 'Tab' }); assert.equal(document.activeElement.classList.contains('po-wheel-it'), true); });
check('Arrow/Enter select activity; stop clears it', () => { key('ArrowRight', { key: 'ArrowRight' }); key('Enter', { key: 'Enter' }); assert.equal(activities.get('self'), 'doc'); key('KeyQ'); key('Digit3'); assert.equal(activities.get('self'), 'dien-thoai'); key('Digit0'); assert.equal(activities.get('self'), null); });
check('Pointer cancel never selects a gesture', () => { const count = calls.filter(x => x[0] === 'emote').length; button.dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 900, clientY: 700, timeStamp: 200 }); button.dispatch('pointercancel', { pointerId: 2 }); assert.equal(context.Wheel.open, false); assert.equal(calls.filter(x => x[0] === 'emote').length, count); });
check('Background blur closes wheel and releases movement', () => { key('KeyQ'); emit('blur'); assert.equal(context.Wheel.open, false); assert.deepEqual(calls.at(-1), ['freeze', false]); });
check('Typing Q does not open a wheel', () => { key('KeyQ', { target: { tagName: 'INPUT' } }); assert.equal(context.Wheel.open, false); });

const label = h('div.po-tag', null, h('div.po-bubbles'), h('div.po-name')); document.body.append(label);
const others = new Map([['peer', { label, av: { setAct() {} } }]]), me = { uid: 'self', mode: 'campus', avatar: { setAct() {} } };
Object.assign(context, { labelsEl: document.body, others, me, AVK: AV2, observe: false, performance: { now: () => 0 }, bubblesOn: true, turnHeads() {}, updateLabel() {}, updateMyLabel() {}, ev: { emit() {} } });
const world = source('js/world.js');
vm.runInContext(world.slice(world.indexOf('  const acts = new Map();'), world.indexOf('  /* mình đi (phím')) + '\nglobalThis.actMap=acts;', context);
vm.runInContext(world.slice(world.indexOf('  function clearBubbles('), world.indexOf('\n  /* ------------------------------------------------------------------\n     ĐẦU VÀO')), context);
check('Newer activity survives delayed presence; departed peers are pruned', () => { assert.equal(context.setAct('peer', 'doc', 100), true); assert.equal(context.setAct('peer', 'laptop', 99), false); assert.equal(context.actMap.get('peer').k, 'doc'); assert.equal(context.setAct('peer', 'made-up', 101), false); context.pruneActs([{ uid: 'self' }]); assert.equal(context.actMap.has('peer'), false); });
check('Bubble text stays literal and moderated bubble disappears by id', () => { context.bubble('peer', '<img src=x onerror=alert(1)>', false, null, 22); const b = label.querySelector('.po-bubble'); assert.equal(b.children[0].textContent, '<img src=x onerror=alert(1)>'); assert.equal(b.dataset.messageId, '22'); context.clearBubbles(22); assert.equal(label.querySelector('.po-bubbles').children.length, 0); assert.equal(label.classList.contains('talk'), false); });
check('Only two overhead bubbles retained', () => { for (let i = 0; i < 5; i++) context.bubble('peer', 'message ' + i, false, null, i); assert.equal(label.querySelector('.po-bubbles').children.length, 2); context.clearBubbles(); });

const S = dom(), splash = S.h('div#po-splash', null, S.h('div.po-splash-in', null, S.h('p#po-splash-msg'), S.h('div.po-bar'))); S.document.body.append(splash);
const startup = vm.createContext({ ...S, location: { reload() {} }, setTimeout, clearTimeout, Error, Promise, console }); startup.window = startup;
vm.runInContext(source('js/startup.js'), startup);
check('WebGL startup failure stops infinite loading with retry instructions', () => { S.emit('error', { error: new Error('Error creating WebGL context.') }); assert.equal(startup.PotaStartup.failed, true); assert.match(S.document.getElementById('po-splash-msg').textContent, /WebGL/); assert.equal(splash.querySelector('.po-bar').hidden, true); assert.equal(splash.querySelectorAll('button').length, 1); });
await assert.rejects(startup.PotaStartup.waitForScene(new Promise(() => {})), /WebGL/); checks++;
console.log(`TẤT CẢ ĐẠT: ${checks} kiểm tra tương tác.`);
