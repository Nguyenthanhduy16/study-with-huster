/* Kiểm thử server/server.js (server realtime trên Railway) bằng WebSocket thật.
   Cần đã cài phụ thuộc của server:  npm --prefix server ci   (thiếu thì bỏ qua bài thử này). */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const SERVER = new URL('../server/server.js', import.meta.url);
const hasWs = fs.existsSync(new URL('../server/node_modules/ws/package.json', import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('server realtime: đăng nhập, kênh khu, chống giả mạo, hiện diện, nguồn trang', { skip: !hasWs && 'chưa cài phụ thuộc: npm --prefix server ci' }, async () => {
  // máy chủ đăng nhập giả: vé "tok-<uid>" hợp lệ
  const auth = http.createServer((req, res) => {
    const m = /^Bearer tok-(.+)$/.exec(req.headers.authorization || '');
    if (req.url !== '/auth/v1/user' || req.headers.apikey !== 'anon' || !m) { res.writeHead(401); return res.end('{}'); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id: m[1] }));
  });
  await new Promise(r => auth.listen(0, r));
  const PORT = 30000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [SERVER.pathname], { env: { ...process.env, PORT: String(PORT), SUPABASE_URL: `http://127.0.0.1:${auth.address().port}`, SUPABASE_ANON_KEY: 'anon', ALLOWED_ORIGINS: 'https://studywithhuster.cyou,https://*.pages.dev' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let err = ''; proc.stderr.on('data', d => { err += d; }); proc.stdout.on('data', d => { err += d; });
  await new Promise(r => proc.stdout.once('data', r));
  const WS = createRequire(new URL('../server/package.json', import.meta.url))('ws');   // gửi được header Origin như trình duyệt
  const url = `ws://127.0.0.1:${PORT}`;
  const open = (origin = 'https://studywithhuster.cyou') => new Promise((res, rej) => {
    const ws = new WS(url, { headers: { origin } }); const c = { ws, msgs: [], closed: null };
    ws.onmessage = e => c.msgs.push(JSON.parse(e.data));
    ws.onclose = e => { c.closed = e.code; };
    ws.onopen = () => res(c); ws.onerror = () => { };
    setTimeout(() => rej(new Error('không mở được kết nối')), 5000);
  });
  const tx = (c, o) => c.ws.send(JSON.stringify(o));
  const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await sleep(20); } return null; };
  try {
    // 1. trang lạ bị chặn; trang *.pages.dev được nhận
    const bad = await open('https://trang-la.example'); await until(() => bad.closed != null);
    assert.equal(bad.closed, 4002, 'chặn trang không nằm trong ALLOWED_ORIGINS');
    const pg = await open('https://abc.hoc-online-huster.pages.dev'); tx(pg, { t: 'auth', token: 'tok-p' });
    assert.ok(await until(() => pg.msgs.find(m => m.t === 'ready')), 'nhận trang *.pages.dev ' + JSON.stringify({ msgs: pg.msgs, closed: pg.closed, err })); pg.ws.close();

    // 2. vé sai bị từ chối; chưa đăng nhập thì không vào kênh được
    const x = await open(); tx(x, { t: 'join', ch: 'zone-campus' }); tx(x, { t: 'auth', token: 'sai' });
    await until(() => x.closed != null); assert.equal(x.closed, 4001);
    assert.ok(!x.msgs.some(m => m.t === 'joined'));

    // 3. ba người: A, B cùng sân, C trong thư viện
    const A = await open(), B = await open(), C = await open();
    for (const [c, u] of [[A, 'a'], [B, 'b'], [C, 'c']]) tx(c, { t: 'auth', token: 'tok-' + u });
    for (const [c, u] of [[A, 'a'], [B, 'b'], [C, 'c']]) assert.equal((await until(() => c.msgs.find(m => m.t === 'ready'))).uid, u);
    for (const c of [A, B]) tx(c, { t: 'join', ch: 'zone-campus' });
    tx(C, { t: 'join', ch: 'zone-lib_a' });
    for (const c of [A, B, C]) tx(c, { t: 'join', ch: 'presence-global' });
    for (const c of [A, B, C]) assert.ok(await until(() => c.msgs.filter(m => m.t === 'joined').length === 2));

    // 4. phát vị trí: tới B, không tới A (chính mình) và C (khu khác); mạo danh bị sửa thành người gửi thật
    tx(A, { t: 'bc', ch: 'zone-campus', ev: 'pos', p: { u: 'b', x: 1, z: 2, s: 1 } });
    const got = await until(() => B.msgs.find(m => m.t === 'bc' && m.ev === 'pos'));
    assert.equal(got.p.u, 'a', 'server ghi đè mã người gửi');
    await sleep(150);
    assert.ok(!A.msgs.some(m => m.t === 'bc') && !C.msgs.some(m => m.t === 'bc'));
    // không phát được vào kênh chưa vào / kênh hiện diện / tên kênh lạ
    tx(C, { t: 'bc', ch: 'zone-campus', ev: 'pos', p: { x: 0, z: 0 } });
    tx(A, { t: 'bc', ch: 'presence-global', ev: 'x', p: {} });
    tx(A, { t: 'join', ch: '../admin' });
    await sleep(150);
    assert.equal(B.msgs.filter(m => m.t === 'bc').length, 1);

    // 5. hiện diện: B thấy A; A ngắt ⇒ B nhận pdel
    tx(A, { t: 'track', ch: 'presence-global', p: { zone: 'campus', seat: -1 } });
    const ps = await until(() => B.msgs.find(m => m.t === 'pset'));
    assert.equal(ps.u, 'a'); assert.equal(ps.m.zone, 'campus');
    const D = await open(); tx(D, { t: 'auth', token: 'tok-d' }); await until(() => D.msgs.find(m => m.t === 'ready'));
    tx(D, { t: 'join', ch: 'presence-global' });
    const st = await until(() => D.msgs.find(m => m.t === 'pstate'));
    assert.ok(Object.values(st.s).some(v => v.u === 'a'), 'người mới vào nhận ngay danh sách đang online');
    A.ws.close();
    assert.ok(await until(() => B.msgs.find(m => m.t === 'pdel' && m.k === ps.k)), 'người rời đi bị gỡ khỏi danh sách');

    // 6. giới hạn tốc độ: gửi dồn 400 tin chỉ một phần được chuyển tiếp
    const before = C.msgs.length;
    const E = await open(); tx(E, { t: 'auth', token: 'tok-e' }); await until(() => E.msgs.find(m => m.t === 'ready'));
    tx(E, { t: 'join', ch: 'zone-lib_a' }); await until(() => E.msgs.find(m => m.t === 'joined'));
    for (let i = 0; i < 400; i++) tx(E, { t: 'bc', ch: 'zone-lib_a', ev: 'pno', p: { e: [], t: i } });
    await sleep(500);
    const n = C.msgs.length - before;
    assert.ok(n > 50 && n < 260, 'bị giới hạn tốc độ: ' + n);

    const stats = await (await fetch(`http://127.0.0.1:${PORT}/stats`)).json();
    assert.ok(stats.dropped > 0 && stats.users >= 3);
    assert.equal((await fetch(`http://127.0.0.1:${PORT}/health`)).status, 200);
    for (const c of [B, C, D, E]) c.ws.close();
  } finally { proc.kill(); auth.close(); }
});
