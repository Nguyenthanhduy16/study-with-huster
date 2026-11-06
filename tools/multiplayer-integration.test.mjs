// Runs the shipped networking code for three independent clients over real local HTTP/SSE.
// This verifies the simulator contract; it does not verify Supabase JWT/RLS or 3D rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, message, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await wait(50); }
  assert.fail(message);
}

// Minimal SSE transport for the existing fake Supabase client, not a browser implementation.
class SSE {
  constructor(url) { this.abort = new AbortController(); this.closed = false; this.run(url); }
  async run(url) {
    try {
      const response = await fetch(url, { signal: this.abort.signal });
      if (!response.ok) throw new Error(`SSE ${response.status}`);
      this.onopen?.();
      const decoder = new TextDecoder(); let buffer = '';
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let at;
        while ((at = buffer.indexOf('\n\n')) >= 0) {
          const event = buffer.slice(0, at); buffer = buffer.slice(at + 2);
          const data = event.split('\n').filter(s => s.startsWith('data:')).map(s => s.slice(5).trimStart()).join('\n');
          if (data) this.onmessage?.({ data });
        }
      }
      if (!this.closed) this.onerror?.(new Error('SSE ended'));
    } catch (e) { if (!this.closed) this.onerror?.(e); }
  }
  close() { this.closed = true; this.abort.abort(); }
}

function client(base, who) {
  const memory = new Map(), timers = new Set(), intervals = new Set();
  const context = {
    console, URLSearchParams, fetch, EventSource: SSE, atob, crypto, performance,
    location: { search: '?nguoi=' + who, origin: base }, navigator: { onLine: true },
    matchMedia: () => ({ matches: false }), innerWidth: 1280,
    localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) },
    document: { hidden: false, addEventListener() {} }, addEventListener() {},
    setTimeout(fn, ms, ...args) { const t = setTimeout(() => { timers.delete(t); fn(...args); }, ms); timers.add(t); return t; },
    clearTimeout(t) { clearTimeout(t); timers.delete(t); },
    setInterval(fn, ms) { const t = setInterval(fn, ms); intervals.add(t); return t; },
    clearInterval(t) { clearInterval(t); intervals.delete(t); }
  };
  context.window = context; vm.createContext(context);
  for (const file of ['config.js', 'js/util.js', 'tools/fake-supabase.js', 'js/net.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  context.SUPABASE_URL = base + '/fake'; context.SUPABASE_ANON_KEY = 'fake-anon-key';
  context.REALTIME_URL = '';   // bài này thử đường Supabase Realtime; đường Railway: realtime-server.test.mjs và kiem_tra_nhieu_nguoi.mjs --railway
  const net = context.createNet(), events = {}, latest = { presence: [] };
  for (const name of ['presence', 'pos', 'emote', 'message', 'message-hidden', 'piano', 'cheer']) {
    events[name] = []; net.ev.on(name, value => { events[name].push(value); latest[name] = value; });
  }
  return { net, events, latest, close() {
    net.presence.leave(); net.leaveZone(); net.sb.realtime.disconnect();
    for (const t of timers) clearTimeout(t); for (const t of intervals) clearInterval(t);
  } };
}

test('three clients: presence, position, seats, activities, chat, moderation, piano and reconnect', { timeout: 45000 }, async t => {
  const port = 18743, base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ['tools/fake-supabase-server.mjs', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const clients = [];
  t.after(() => { for (const c of clients) c.close(); server.kill(); });
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Simulator exited ${code}`))); });
  const ctl = async body => (await fetch(base + '/fake/ctl', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
  const profiles = [['Nguyễn Văn An', '20231111'], ['Trần Thị Bình', '20232222'], ['Lê Minh Cường', '20233333']];
  for (let i = 0; i < 3; i++) {
    const c = client(base, i + 1); clients.push(c);
    await c.net.init();
    assert.equal((await c.net.register({ name: profiles[i][0], mssv: profiles[i][1], quiz: true, style: {} })).ok, true);
    await c.net.startSession('campus');
    c.net.presence.join({ uid: c.net.me.id, zone: 'campus', seat: -1, sts: 0, st: 'hoc', p: [0, 0, 0, 0], act: null });
    c.net.joinZone('campus');
  }
  const [A, B, C] = clients;
  await until(() => clients.every(c => c.latest.presence.length === 3 && c.net.status() === 'online'), 'all clients see three users and online status');
  assert.equal(new Set(clients.map(c => c.net.me.id)).size, 3);

  A.net.sendPos({ x: 2, z: 3, y: 0, r: 0, vx: 1, vz: 0, s: 1 });
  await until(() => B.events.pos.some(p => p.u === A.net.me.id && p.x === 2), 'position reaches another client');
  A.net.presence.update({ seat: 4, sts: Date.now() });
  await until(() => B.latest.presence.some(p => p.uid === A.net.me.id && p.seat === 4), 'seat claim reaches other client promptly', 2000);
  A.net.presence.update({ act: { k: 'doc', t: Date.now() } });
  await until(() => B.latest.presence.some(p => p.uid === A.net.me.id && p.act?.k === 'doc'), 'reading activity reaches other client promptly', 2000);
  A.net.sendEmote('vay');
  await until(() => B.events.emote.some(e => e.u === A.net.me.id && e.k === 'vay'), 'wave broadcast received');

  const sent = await A.net.sendMessage('campus', 'Xin chào cả phòng kiểm thử');
  assert.equal(sent.ok, true);
  await until(() => B.events.message.some(m => m.id === sent.id), 'chat delivered');
  assert.equal((await A.net.sendMessage('campus', 'Tin quá nhanh')).ok, false);
  const moderation = await A.net.sb.rpc('admin_moderate', { pw: 'admin-thu', p_kind: 'message', p_id: sent.id, p_action: 'hide' });
  assert.equal(moderation.data.ok, true);
  await until(() => B.events['message-hidden'].includes(sent.id), 'hidden chat emits removal event despite row RLS');

  const dm = await A.net.sendDm(B.net.me.id, 0);
  assert.equal(dm.ok, true);
  await until(() => B.events.cheer.some(m => m.from_uid === A.net.me.id), 'private message received by intended client');
  assert.equal(C.events.cheer.length, 0, 'private message not sent to third client');

  for (const c of [A, B]) { c.net.presence.update({ zone: 'lib_b', seat: -1, act: null }); c.net.joinZone('lib_b'); }
  await until(() => A.net.status() === 'online' && B.net.status() === 'online', 'zone channels ready');
  const posCount = C.events.pos.length;
  A.net.sendPos({ x: 5, z: 6, y: 0, r: 0, s: 0 });
  await until(() => B.events.pos.some(p => p.x === 5), 'new zone receives movement');
  assert.equal(C.events.pos.length, posCount, 'other zone does not receive movement');
  A.net.sendPiano({ s: 1, t: 100, e: [[0, 'd', 60, 100], [100, 'u', 60, 0]] });
  await until(() => B.events.piano.some(p => p.u === A.net.me.id), 'shared piano reaches same zone');
  assert.equal(C.events.piano.length, 0, 'shared piano stays in its zone');

  await ctl({ op: 'kill', uid: B.net.me.id, blockMs: 2200 });
  await until(() => B.net.status() !== 'online', 'disconnect detected');
  await until(() => B.net.status() === 'online' && B.latest.presence.length === 3, 'automatic reconnect restores presence', 15000);
  const received = B.events.emote.length;
  A.net.sendEmote('thich');
  await until(() => B.events.emote.length > received, 'messages flow after reconnect');

  C.close();
  await until(() => A.latest.presence.length === 2 && B.latest.presence.length === 2, 'leaving client removed from presence');
  const stats = await ctl({ op: 'stats' });
  assert.equal(stats.stats.rest_broadcast, 0, 'no broadcast sent through unjoined-channel REST fallback');
  t.diagnostic('Three isolated networking clients passed over simulator HTTP/SSE; no live Supabase or rendered WebGL assertion.');
});
