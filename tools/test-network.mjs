#!/usr/bin/env node
// Deterministic transport/clock tests. No browser or live Supabase account required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PianoNet = require('../js/piano-net.js');

function clock() {
  let t = 100000, id = 0;
  const timers = new Map();
  return {
    now: () => t,
    setTimeout: (f, ms = 0) => { timers.set(++id, { f, at: t + ms }); return id; },
    clearTimeout: i => timers.delete(i),
    advance(ms) {
      const end = t + ms;
      for (;;) {
        const next = [...timers].filter(([, v]) => v.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]); t = next[1].at; next[1].f();
      }
      t = end;
    }
  };
}

{
  const c = clock(), sent = []; let allowed = true;
  const tx = PianoNet.createSender({ ...c, send: p => sent.push(p), shouldSend: () => allowed });
  tx.push({ t: 'd', m: 60, v: .8 }); tx.push({ t: 'd', m: 200 });
  c.advance(50);
  assert.equal(sent.length, 1); assert.equal(sent[0].e.length, 1);
  tx.push({ t: 'u', m: 60 }); allowed = false; c.advance(50);
  assert.equal(sent.length, 1, 'queued notes must not send after leaving piano zone');
  allowed = true; tx.push({ t: 'd', m: 62 }); tx.reset(); c.advance(100);
  assert.equal(sent.length, 1, 'reset cancels pending sender batch');
}
{
  const c = clock(), played = [];
  const rx = PianoNet.createReceiver({ ...c, play: e => played.push(e) });
  const packet = (s, e) => ({ u: 'peer', s, t: c.now(), e });
  assert.equal(rx.onMsg(packet(1, [[0, 'd', 60, 100]])), 1);
  assert.equal(rx.onMsg(packet(1, [[0, 'd', 61, 100]])), 0, 'duplicate batch ignored');
  c.advance(120); assert.equal(played.length, 1);
  rx.reset(); assert.equal(played.at(-1).t, 'u', 'reset releases held notes');
  played.length = 0;
  rx.onMsg(packet(2, [[0, 'd', 62, 100]])); rx.reset();
  rx.onMsg(packet(3, [[0, 'd', 64, 100]])); c.advance(120);
  assert.deepEqual(played.map(e => e.m), [64], 'delayed callback from old zone cannot replay');
  assert.equal(rx.onMsg(packet(4, [[0, 'd', 500, 100], [NaN, 'u', 64, 0], [0, 'p', 3, 0]])), 0);
  c.advance(9000); rx.tick(); assert.equal(played.at(-1).t, 'u', 'disconnect watchdog releases stuck note');
}

{
  const c = clock(), channels = [], tracks = [], sent = [], listeners = {};
  let rawPresence = { peer: [{ zone: 'lib_a', seat: -1, ts: c.now() }] };
  function channel(topic) {
    const callbacks = [];
    const ch = { topic, state: 'joined', callbacks,
      on(type, filter, cb) { callbacks.push({ type, filter, cb }); return ch; },
      subscribe(cb) { ch.status = cb; cb('SUBSCRIBED'); return ch; },
      track(meta) { tracks.push(meta); return Promise.resolve('ok'); },
      untrack() { return Promise.resolve('ok'); },
      presenceState: () => rawPresence,
      send(msg) { sent.push({ topic, ...msg }); return Promise.resolve('ok'); },
      receive(type, event, payload) { for (const h of callbacks) if (h.type === type && (h.filter.event === event || h.filter.event === '*')) h.cb(payload); }
    };
    channels.push(ch); return ch;
  }
  const sb = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'self' }, access_token: 'token' } } }) },
    realtime: { conn: {}, setAuth() {}, isConnected: () => true },
    rpc: async () => ({ data: { now: new Date(c.now()).toISOString(), settings: {}, banned: [] } }),
    channel, removeChannel: async () => 'ok'
  };
  const FakeDate = class extends Date { static now() { return c.now(); } };
  const context = { window: { supabase: { createClient: () => sb }, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public' },
    U: { store: {}, sleep: async () => {}, throttle: fn => fn, emitter: () => ({ on: (k, f) => { (listeners[k] ||= []).push(f); }, emit: (k, p) => (listeners[k] || []).forEach(f => f(p)) }) },
    APP: { presenceGapMs: 8000 }, navigator: { onLine: true }, document: { hidden: false, addEventListener() {} },
    addEventListener() {}, console, Date: FakeDate, setTimeout: c.setTimeout, clearTimeout: c.clearTimeout, atob: s => Buffer.from(s, 'base64').toString()
  };
  vm.runInNewContext(fs.readFileSync(new URL('../js/net.js', import.meta.url), 'utf8'), context);
  const net = context.window.createNet(); await net.init();
  net.presence.join({ zone: 'lib_a', seat: -1 }); net.joinZone('lib_a');
  const pres = channels.find(ch => ch.topic === 'presence-global');
  const zoneA = channels.find(ch => ch.topic === 'zone-lib_a');
  let latest = [];
  net.ev.on('presence', p => { latest = p; }); pres.receive('presence', 'sync', {});
  net.presence.update({ seat: 5, sts: c.now() });
  assert.equal(tracks.length, 1, 'seat update does not exceed Presence rate limit');
  assert(sent.some(p => p.event === 'meta' && p.payload.m.seat === 5), 'seat changes broadcast immediately');
  zoneA.receive('broadcast', 'meta', { payload: { u: 'peer', t: c.now() + 1, m: { zone: 'lib_a', seat: 7, sts: 99, act: { k: 'doc', t: c.now() } } } });
  assert.equal(latest[0].seat, 7, 'fast seat claim overlays older presence');
  assert.equal(latest[0].act.k, 'doc');
  c.advance(8000); await Promise.resolve(); assert.equal(tracks.length, 2);
  rawPresence = { peer: [{ zone: 'lib_a', seat: 8, ts: c.now() }] }; pres.receive('presence', 'sync', {});
  assert.equal(latest[0].seat, 8, 'new authoritative presence supersedes broadcast overlay');
  let messages = 0; net.ev.on('message', () => messages++);
  const msgA = channels.find(ch => ch.topic === 'msg-lib_a');
  net.joinZone('lib_b'); zoneA.status('CHANNEL_ERROR'); msgA.status('CLOSED');
  assert.equal(net.status(), 'online', 'old channel callbacks cannot corrupt new zone status');
  msgA.receive('postgres_changes', 'INSERT', { new: { zone: 'lib_a', text: 'late' } });
  assert.equal(messages, 0, 'late old-zone chat ignored');
  const pno = { s: 1, t: c.now(), e: [[0, 'd', 60, 100]] };
  assert.equal(net.sendPiano(pno), true);
  const oldB = channels.find(ch => ch.topic === 'zone-lib_b');
  const oldMsgB = channels.find(ch => ch.topic === 'msg-lib_b');
  net.sendPos({ x: 1, y: 0, z: 2, s: 1 });
  oldB.receive('broadcast', 'hi', { payload: { u: 'peer' } });
  net.joinZone('lib_a'); net.joinZone('lib_b');
  const freshB = channels.filter(ch => ch.topic === 'zone-lib_b').at(-1);
  const events = { pos: 0, emote: 0, piano: 0, presence: 0 };
  for (const event of Object.keys(events)) net.ev.on(event, () => events[event]++);
  const sentBefore = sent.length;
  oldB.receive('broadcast', 'pos', { payload: { u: 'peer', x: 3, y: 0, z: 4 } });
  oldB.receive('broadcast', 'meta', { payload: { u: 'peer', t: c.now() + 10, m: { zone: 'lib_b', seat: 50 } } });
  oldB.receive('broadcast', 'emo', { payload: { u: 'peer', k: 'vay' } });
  oldB.receive('broadcast', 'hi', { payload: { u: 'peer' } });
  oldB.receive('broadcast', 'pno', { payload: { ...pno, u: 'peer' } });
  oldMsgB.receive('postgres_changes', 'INSERT', { new: { zone: 'lib_b', text: 'stale same-zone' } });
  assert.deepEqual(events, { pos: 0, emote: 0, piano: 0, presence: 0 }, 'all handlers reject stale channel after B → A → B');
  assert.equal(messages, 0);
  assert.equal(sent.length, sentBefore, 'stale hello does not send metadata');
  net.sendPos({ x: 8, y: 0, z: 9, s: 1 });
  const posBefore = sent.filter(p => p.event === 'pos').length;
  c.advance(1000);
  assert.equal(sent.filter(p => p.event === 'pos').length, posBefore, 'old delayed hello cannot send on new same-zone channel');
  freshB.receive('broadcast', 'pos', { payload: { u: 'peer', x: 3, y: 0, z: 4 } });
  freshB.receive('broadcast', 'pno', { payload: { ...pno, u: 'peer' } });
  assert.equal(events.pos, 1); assert.equal(events.piano, 1, 'current same-zone channel still works');
  net.joinZone('campus'); assert.equal(net.sendPiano(pno), false, 'piano never broadcasts into another zone');
}
console.log('PASS: piano batches, validation, duplicate suppression, reset/disconnect release, presence rate, fast seat/activity metadata, stale channel callbacks.');
