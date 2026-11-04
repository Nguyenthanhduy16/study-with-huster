#!/usr/bin/env node
/* =====================================================================
   KIỂM THỬ NHIỀU NGƯỜI (tự động) — 3 trình duyệt Chromium không giao diện cùng vào một phòng
   qua Supabase GIẢ LẬP (tools/fake-supabase-server.mjs + tools/fake-supabase.js).
   Chạy:   node tools/kiem_tra_nhieu_nguoi.mjs [--port=8741] [--out=thu-muc-anh] [--headed]
   Cần:    Node 18+, gói playwright (npm i -D playwright && npx playwright install chromium)
   Kiểm:   đăng nhập 3 người · đếm người online · thấy nhân vật của nhau cùng khu · di chuyển truyền sang máy khác ·
           tin nhắn · cử chỉ · đổi khu (người ở khu khác không hiện) · mất kết nối rồi tự nối lại ·
           QTV ẩn tin ⇒ tin biến mất ở máy khác · đóng tab ⇒ biến mất khỏi phòng · đếm lưu lượng realtime.
   LƯU Ý: đây là giả lập — đúng giao thức supabase-js v2 mà js/net.js dùng, nhưng KHÔNG phải máy chủ Supabase thật.
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 8741), BASE = `http://localhost:${PORT}`;
const OUT = args.out ? path.resolve(args.out) : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const results = []; let failed = 0;
const ok = (cond, msg) => { results.push((cond ? '  ĐẠT  ' : '  LỖI  ') + msg); console.log((cond ? '  ĐẠT  ' : '  LỖI  ') + msg); if (!cond) failed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 20000, step = 250) { const t = Date.now(); while (Date.now() - t < ms) { try { const v = await fn(); if (v) return v; } catch (_) { } await sleep(step); } return null; }
const ctl = body => fetch(BASE + '/fake/ctl', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
const rpc = (name, body) => fetch(BASE + '/fake/rpc/' + name, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());

const srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ giả lập dừng: ' + c))); });
const browser = await chromium.launch({ headless: !args.headed });
const people = [
  { tag: 'A', name: 'Nguyễn Văn An', mssv: '20231111' },
  { tag: 'B', name: 'Trần Thị Bình', mssv: '20232222' },
  { tag: 'C', name: 'Lê Minh Cường', mssv: '20233333' }
];
const errors = [], T0 = Date.now();
try {
  /* ---------- 1. ba người vào phòng ---------- */
  for (const p of people) {
    p.ctx = await browser.newContext({ viewport: { width: 720, height: 480 }, deviceScaleFactor: 1 });
    await p.ctx.addInitScript(() => {
      localStorage.setItem('pota:welcomed', '1');
      localStorage.setItem('pota:quality', '"low"');
      localStorage.setItem('pota:tip:controls', '1');
      localStorage.setItem('pota:login', JSON.stringify({ start: 'campus' }));
    });
    p.page = await p.ctx.newPage();
    p.page.on('console', m => { if (m.type() === 'error') errors.push(p.tag + ': ' + m.text()); });
    p.page.on('pageerror', e => errors.push(p.tag + ' (pageerror): ' + e.message));
    await p.page.goto(BASE + '/', { waitUntil: 'commit', timeout: 180000 });
  }
  for (const p of people) {
    await p.page.waitForSelector('#f-name', { timeout: 180000 });
    await p.page.fill('#f-name', p.name); await p.page.fill('#f-mssv', p.mssv);
    await p.page.click('.po-login-card button[type=submit]', { noWaitAfter: true, timeout: 120000 });
  }
  for (const p of people) {
    await p.page.waitForSelector('#po-hud:not([hidden])', { timeout: 180000 });
    p.uid = await p.page.evaluate(() => __potaNet.me.id);
  }
  ok(people.every(p => p.uid) && new Set(people.map(p => p.uid)).size === 3, '3 người đăng nhập ẩn danh, mỗi người một mã riêng');
  let counts = [];
  ok(await until(async () => (counts = await Promise.all(people.map(p => p.page.textContent('#po-online b')))).every(t => t === '3'), 90000), 'cả 3 máy đều thấy "3 đang học" (' + counts.join(', ') + ')');
  ok(await until(async () => (await Promise.all(people.map(p => p.page.evaluate(() => __potaNet.status())))).every(s => s === 'online'), 15000), 'trạng thái kết nối: online ở cả 3 máy');
  const [A, B, C] = people;
  const seesAvatar = (viewer, target) => viewer.page.evaluate(u => World.others.has(u), target.uid);
  ok(await until(async () => (await seesAvatar(A, B)) && (await seesAvatar(B, A)) && (await seesAvatar(C, A)), 30000), 'nhân vật của người khác hiện ra (cùng sân trước thư viện)');
  if (OUT) await B.page.screenshot({ path: path.join(OUT, '1-B-thay-A-C.png') });

  /* ---------- 2. di chuyển ---------- */
  await ctl({ op: 'reset-stats' });
  const posOf = (viewer, target) => viewer.page.evaluate(u => { const o = World.others.get(u); return o ? { x: o.px, z: o.pz } : null; }, target.uid);
  const before = await posOf(B, A);
  const walked = await A.page.evaluate(() => {
    const m = World.me, x0 = m.x, z0 = m.z;
    for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3], [6, 0], [0, 6]]) if (World.walkTo(x0 + dx, z0 + dz)) return { x0, z0, dx, dz };
    return null;
  });
  ok(!!walked, 'A tự đi tới một điểm trên sân (tìm đường)');
  const moved = await until(async () => { const p = await posOf(B, A); return p && before && Math.hypot(p.x - before.x, p.z - before.z) > 1 ? p : null; }, 40000);
  ok(!!moved, 'B thấy A di chuyển (vị trí qua kênh khu) ' + (moved ? `(${before.x.toFixed(1)},${before.z.toFixed(1)}) → (${moved.x.toFixed(1)},${moved.z.toFixed(1)})` : ''));
  await until(() => A.page.evaluate(() => !World.me.vx && !World.me.vz && World.me.mode !== 'walk' || false), 30000);
  await sleep(1500);
  const st1 = await ctl({ op: 'stats' });
  const aSent = await A.page.evaluate(() => __potaNet.rt.sent);
  ok(st1.stats.rest_broadcast === 0, 'không gói nào phải gửi qua HTTP (chỉ gửi khi kênh đã vào xong)');
  console.log('        lưu lượng khi A đi bộ: A gửi', JSON.stringify(aSent), '· máy chủ chuyển', JSON.stringify(st1.stats.delivered));

  /* ---------- 3. tin nhắn ---------- */
  const r = await A.page.evaluate(() => __potaNet.sendMessage('campus', 'Xin chào cả phòng (kiểm thử)'));
  ok(r && r.ok, 'A gửi tin nhắn');
  ok(await until(() => B.page.evaluate(() => (__APP.chatCache || []).some(m => m.text === 'Xin chào cả phòng (kiểm thử)')), 10000), 'B nhận được tin nhắn của A ngay (Realtime)');
  const r2 = await A.page.evaluate(() => __potaNet.sendMessage('campus', 'gửi liền tin thứ hai'));
  ok(r2 && r2.ok === false && /Chậm lại/.test(r2.error || ''), 'chống spam: tin thứ hai trong 10 giây bị từ chối');

  /* ---------- 4. QTV ẩn tin ⇒ biến mất ở máy B ---------- */
  const mid = r.id;
  const hid = await rpc('admin_moderate', { pw: 'admin-thu', p_kind: 'message', p_id: mid, p_action: 'hide' });
  ok(hid.data && hid.data.ok, 'QTV ẩn tin');
  ok(await until(() => B.page.evaluate(id => !(__APP.chatCache || []).some(m => m.id === id), mid), 10000), 'tin bị ẩn biến khỏi máy B ngay (sự kiện hide_msg)');

  /* ---------- 5. cử chỉ ---------- */
  const recvBefore = await B.page.evaluate(() => __potaNet.rt.recv.emo || 0);
  await sleep(2600);
  const emoted = await A.page.evaluate(() => World.emote(__potaNet.me.id, 'vay'));
  ok(emoted, 'A vẫy tay');
  ok(await until(async () => (await B.page.evaluate(() => __potaNet.rt.recv.emo || 0)) > recvBefore, 8000), 'B nhận cử chỉ vẫy tay của A');

  /* ---------- 6. đổi khu ---------- */
  await C.page.evaluate(() => World.go('lib_a'));
  ok(await until(() => A.page.evaluate(u => (__APP.presence || []).some(p => p.uid === u && p.zone === 'lib_a'), C.uid), 30000), 'C vào thư viện: A thấy C ở khu "lib_a" trong danh sách');
  ok(await until(async () => !(await seesAvatar(A, C)), 15000), 'nhân vật C không còn đứng trên sân ở máy A');
  ok(await until(async () => !(await C.page.evaluate(u => World.others.has(u), A.uid)), 15000), 'C (trong thư viện) không vẽ A (đang ở sân)');
  ok((await A.page.textContent('#po-online b')) === '3', 'vẫn đếm đủ 3 người online');
  if (OUT) await C.page.screenshot({ path: path.join(OUT, '2-C-thu-vien.png') });

  /* ---------- 7. mất kết nối rồi tự nối lại ---------- */
  await ctl({ op: 'kill', uid: B.uid, blockMs: 5000 });
  ok(await until(() => B.page.evaluate(() => __potaNet.status() !== 'online' && /kết nối|mạng/i.test(document.querySelector('#po-net').textContent)), 8000), 'B mất kết nối: góc trên báo "Đang kết nối lại…"');
  ok(await until(async () => (await A.page.textContent('#po-online b')) === '2', 10000), 'A thấy B tạm rời (2 người)');
  ok(await until(() => B.page.evaluate(() => __potaNet.status() === 'online'), 30000), 'B tự nối lại sau khi mạng có lại');
  ok(await until(async () => (await A.page.textContent('#po-online b')) === '3' && (await seesAvatar(A, B)), 20000), 'B quay lại: A lại thấy 3 người và nhân vật của B');

  /* ---------- 8. rời phòng ---------- */
  await C.ctx.close(); C.closed = true;
  ok(await until(async () => (await A.page.textContent('#po-online b')) === '2' && (await B.page.textContent('#po-online b')) === '2', 15000), 'C đóng tab: A và B thấy còn 2 người');

  /* ---------- 9. tổng kết lưu lượng ---------- */
  const st = await ctl({ op: 'stats' });
  console.log('        máy chủ: kết nối', st.clients.length, '· hiện diện', JSON.stringify(st.presence), '· tổng tin đã chuyển', JSON.stringify(st.stats.delivered));
  for (const p of [A, B]) console.log('        ' + p.tag + ' gửi', JSON.stringify(await p.page.evaluate(() => __potaNet.rt.sent)), '· nhận', JSON.stringify(await p.page.evaluate(() => __potaNet.rt.recv)));
  if (OUT) await A.page.screenshot({ path: path.join(OUT, '3-A-cuoi.png') });
} catch (e) {
  ok(false, 'lỗi khi chạy kiểm thử: ' + (e && e.stack || e));
} finally {
  const errs = errors.filter(e => !/open-meteo|ERR_NAME|ERR_INTERNET|ERR_CONNECTION|net::ERR_TUNNEL|Failed to load resource/i.test(e));
  ok(errs.length === 0, 'không có lỗi JavaScript trong Console' + (errs.length ? ':\n        ' + errs.slice(0, 15).join('\n        ') : ''));
  srv.kill(); await Promise.race([browser.close(), sleep(15000)]);
  console.log((failed ? `\n${failed} mục LỖI` : '\nTẤT CẢ ĐẠT') + ` (${Math.round((Date.now() - T0) / 1000)} giây)`);
  process.exit(failed ? 1 : 0);
}
