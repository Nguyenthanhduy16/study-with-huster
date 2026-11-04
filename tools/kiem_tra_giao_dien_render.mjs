#!/usr/bin/env node
/* =====================================================================
   KIỂM THỬ GIAO DIỆN TRÊN ẢNH RENDER THẬT (Chromium + WebGL phần mềm SwiftShader)
   Chạy:   node tools/kiem_tra_giao_dien_render.mjs [--port=3102] [--out=thu-muc-anh] [--headed]
                   [--phan=dichuyen,dienthoai,hanhdong]   (mặc định: cả ba phần)
           Nếu cổng chưa có máy chủ, script tự chạy tools/fake-supabase-server.mjs --csp ở cổng đó.
   Cần:    Node 18+, gói playwright + Chromium (npx playwright install chromium).
   Kiểm:   1. giữ W/A/S/D + kéo chuột vẫn xoay camera đều (sân, thư viện A, B, sân thượng), nhãn tên không trễ khung,
              thả phím là dừng, không kẹt phím; điện thoại: cần điều khiển + vuốt ngón khác + hai ngón thu phóng
           2. thanh dưới (#po-actions) không có nút dịch chuyển
           3. vòng hành động (giữ Q / nút ✋): vẫy tay, đọc sách, điện thoại, laptop — có hoạt ảnh trên nhân vật
              khi đứng và khi ngồi, máy B thấy hoạt động của A
           4. bong bóng chat trên đầu: hiện ở cả máy gửi và máy nhận, đúng chỗ trên nhãn tên, không bị HUD che,
              khi đứng và khi ngồi, vài giây sau tự biến mất
   LƯU Ý: SwiftShader chỉ đạt vài khung hình/giây nên hoạt ảnh chạy chậm hơn máy thật; các ngưỡng đã tính tới điều đó.
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 3102), BASE = `http://localhost:${PORT}`;
const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'kiem-tra-giao-dien-render'));
fs.mkdirSync(OUT, { recursive: true });
const PHAN = new Set(String(args.phan || 'dichuyen,dienthoai,hanhdong').split(','));

let failed = 0; const T0 = Date.now();
const ok = (cond, msg) => { console.log((cond ? '  ĐẠT  ' : '  LỖI  ') + msg); if (!cond) failed++; return !!cond; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 20000, step = 250) { const t = Date.now(); while (Date.now() - t < ms) { try { const v = await fn(); if (v) return v; } catch (_) { } await sleep(step); } return null; }
const shot = async (p, name) => { try { await p.page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 120000 }); } catch (e) { console.log('        (không chụp được ảnh ' + name + ': ' + e.message.split('\n')[0] + ')'); } };

/* ---------- máy chủ Supabase giả lập ---------- */
let srv = null;
if (!(await fetch(BASE + '/').then(r => r.ok, () => false))) {
  srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT, '--csp'], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ giả lập dừng: ' + c))); });
}
const browser = await chromium.launch({ headless: !args.headed, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];

async function enter(tag, n, name, mssv, ctxOpts) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 1, ...ctxOpts });
  await ctx.addInitScript(() => {
    localStorage.setItem('pota:welcomed', '1');
    localStorage.setItem('pota:quality', '"low"');
    localStorage.setItem('pota:tip:controls', '1');
    localStorage.setItem('pota:login', JSON.stringify({ start: 'campus' }));
  });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(tag + ': ' + m.text()); });
  page.on('pageerror', e => errors.push(tag + ' (pageerror): ' + e.message));
  await page.goto(BASE + '/?nguoi=' + n, { waitUntil: 'commit', timeout: 180000 });
  await page.waitForSelector('#f-name', { timeout: 180000 });
  await page.fill('#f-name', name); await page.fill('#f-mssv', mssv);
  await page.click('.po-login-card button[type=submit]', { noWaitAfter: true, timeout: 180000 });
  await page.waitForSelector('#po-hud:not([hidden])', { timeout: 180000 });
  await until(() => page.evaluate(() => World.me.zone === 'campus' && World.me.mode === 'campus'), 60000);
  await sleep(2500);                                         // để lượt vào sân đầu tiên của ứng dụng xong hẳn
  await page.evaluate(() => document.getElementById('po-side').classList.add('closed'));
  return { tag, ctx, page, uid: await page.evaluate(() => __potaNet.me.id), vp: ctxOpts && ctxOpts.viewport || { width: 800, height: 500 } };
}
/* tới khu bằng hàm của World (chỉ để dựng tình huống kiểm thử nhanh — người dùng tới đó bằng cửa/cầu thang/thang máy) */
async function goZone(p, zone, opts = { entrance: true }) {
  if (zone === 'campus') opts = {};
  await p.page.evaluate(([z, o]) => World.go(z, o), [zone, opts]);
  await until(() => p.page.evaluate(z => World.me.zone === z && World.me.mode !== 'idle', zone), 60000);
  await p.page.evaluate(() => { document.getElementById('po-side').classList.add('closed'); document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  await sleep(1500);
}
/* trong nhà: quay mặt về hướng thoáng nhất (không đâm vào quầy/tường ngay khi bắt đầu thử) */
const faceOpen = p => p.page.evaluate(() => {
  const sp = World.sp(); if (!sp || sp.kind !== 'room') return;
  const me = World.me, fl = sp.floorOf(me.y + 0.1); let best = 0, bn = -1;
  for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8; let n = 0;
    for (let r = 0.5; r <= 4; r += 0.5) { if (!sp.free(me.x + Math.sin(a) * r, me.z - Math.cos(a) * r, fl)) break; n++; }
    if (n > bn) { bn = n; best = a; }
  }
  sp.module.api.yaw = best; sp.module.api.pitch = 0;
});
/* trạng thái camera / nhân vật ngay trong trang */
const state = p => p.page.evaluate(() => {
  const c = World.camera, v = new THREE.Vector3(); c.getWorldDirection(v);
  const sp = World.sp(), K = sp && sp.kind === 'room' && sp.module.api.keys;
  return { cy: Math.atan2(v.x, v.z), x: World.me.x, z: World.me.z, speed: World.me.speed, mode: World.me.mode, roomKeys: K ? K.f + K.b + K.l + K.r + K.run : 0 };
});
const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
/* ghi lại mỗi khung hình (sau khi vẽ): hướng camera, khoảng cách camera–nhân vật, độ lệch nhãn tên so với đỉnh đầu chiếu lên màn hình */
const startProbe = p => p.page.evaluate(() => {
  window.__probe = { cy: [], dist: [], lag: [], pos: [] };
  if (window.__probeHooked) return;
  window.__probeHooked = true;
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  World.hooks.after.push(() => {
    const Q = window.__probe; if (!Q || Q.off) return;
    const c = SceneAPI.camera(); c.getWorldDirection(v); Q.cy.push(Math.atan2(v.x, v.z));
    const av = World.me.avatar; if (!av) return;
    av.root.getWorldPosition(w); Q.dist.push(c.position.distanceTo(w)); Q.pos.push([+w.x.toFixed(2), +w.z.toFixed(2), World.me.zone, World.me.mode].join(' '));
    const lab = document.querySelector('#labels .po-tag.me');
    if (!lab || lab.style.display === 'none' || lab.classList.contains('talk')) return;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(lab.style.transform); if (!m) return;
    w.y += av.headY() + 0.18; c.updateMatrixWorld(); w.project(c);
    const el = document.getElementById('labels'), x = (w.x + 1) / 2 * el.clientWidth, y = (1 - w.y) / 2 * el.clientHeight;
    Q.lag.push(Math.hypot(x - +m[1], y - +m[2]));
  });
});
const readProbe = p => p.page.evaluate(() => { const Q = window.__probe; Q.off = true; return Q; });
const restartProbe = p => p.page.evaluate(() => { window.__probe = { cy: [], dist: [], lag: [], pos: [] }; });

/* giữ một phím đi + kéo chuột trên khung 3D */
async function dragWhileKey(p, key, label) {
  const { width: W, height: H } = p.vp, x0 = Math.round(W * 0.3), y0 = Math.round(H * 0.62);
  await p.page.mouse.move(x0, y0);
  const s0 = await state(p);
  await restartProbe(p);
  await p.page.keyboard.down(key); await sleep(300);
  await p.page.mouse.down();
  const ys = [];
  for (let i = 1; i <= 12; i++) { await p.page.mouse.move(x0 + i * 14, y0 + (i % 2)); await sleep(60); ys.push((await state(p)).cy); }
  const mid = await state(p);
  await p.page.mouse.up(); await p.page.keyboard.up(key);
  const pr = await readProbe(p);
  // hướng camera đổi đều theo một chiều (kéo sang phải), không giật ngược; khoảng cách camera không nhảy
  const steps = ys.map((y, i) => ang(y - (i ? ys[i - 1] : s0.cy)));
  const total = steps.reduce((a, b) => a + b, 0), dir = Math.sign(total);
  const fsteps = pr.cy.slice(1).map((y, i) => ang(y - pr.cy[i]));
  const back = fsteps.filter(d => Math.sign(d) === -dir && Math.abs(d) > 0.004).length;
  const jump = Math.max(0, ...pr.dist.slice(1).map((d, i) => Math.abs(d - pr.dist[i])));
  const lag = pr.lag.length ? Math.max(...pr.lag) : 0;
  const moved = Math.hypot(mid.x - s0.x, mid.z - s0.z);
  ok(Math.abs(total) > 0.15 && steps.every(d => Math.sign(d) === dir || Math.abs(d) < 1e-4) && back === 0,
    `${label}: giữ ${key.toUpperCase()} + kéo chuột → camera xoay đều (${total.toFixed(2)} rad, ${pr.cy.length} khung, ${back} khung giật ngược)`);
  if (key === 'w' || label === 'campus') ok(moved > 0.15, `${label}: vẫn đi khi đang kéo chuột (${moved.toFixed(2)} m)`);
  else console.log(`        ${label}: ${key.toUpperCase()} đi được ${moved.toFixed(2)} m (có thể vướng đồ vật)`);
  if (!ok(jump < 0.6, `${label}: khoảng cách camera không nhảy (lớn nhất ${jump.toFixed(2)} m/khung)`)) console.log('        khoảng cách: ' + pr.dist.map(d => d.toFixed(2)).join(' ') + '\n        vị trí: ' + pr.pos.join(' | '));
  ok(lag < 3, `${label}: nhãn tên bám đúng đỉnh đầu từng khung (lệch tối đa ${lag.toFixed(1)} px)`);
  await sleep(1200);
  const a = await state(p); await sleep(900); const b = await state(p);
  ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.05 && b.roomKeys === 0, `${label}: thả ${key.toUpperCase()} là dừng, không kẹt phím`);
}
/* kéo trước, nhấn rồi thả D giữa chừng, kéo tiếp: camera không khựng, nhân vật dừng sau khi thả */
async function keyDuringDrag(p, label) {
  const { width: W, height: H } = p.vp, x0 = Math.round(W * 0.6), y0 = Math.round(H * 0.6);
  await p.page.mouse.move(x0, y0); await p.page.mouse.down();
  const ys = [];
  for (let i = 1; i <= 15; i++) {
    if (i === 4) await p.page.keyboard.down('d');
    if (i === 9) await p.page.keyboard.up('d');
    await p.page.mouse.move(x0 - i * 12, y0); await sleep(50); ys.push((await state(p)).cy);
  }
  await p.page.mouse.up();
  const after = ys.slice(9).map((y, i) => Math.abs(ang(y - ys[8 + i])));
  ok(after.filter(d => d > 1e-4).length >= 4, `${label}: thả phím giữa lúc kéo, camera vẫn xoay tiếp theo chuột`);
  await sleep(1200); const a = await state(p); await sleep(900); const b = await state(p);
  ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.05 && b.roomKeys === 0, `${label}: sau đó nhân vật đứng yên (không kẹt D)`);
}
/* thanh dưới: chỉ có nút theo ngữ cảnh, không nút dịch chuyển */
async function noTeleport(p, label) {
  const texts = await p.page.evaluate(() => [...document.querySelectorAll('#po-actions button')].map(b => b.textContent.trim()));
  const bad = texts.filter(t => /dịch chuyển|teleport|đi tới|tới (tầng|khu)|lên tầng|xuống tầng|vào thư viện|ra sân|sân thượng|tầng \d/i.test(t));
  ok(bad.length === 0, `${label}: thanh dưới không có nút dịch chuyển [${texts.join(' | ') || 'trống'}]`);
}

const wheelItem = (p, i) => p.page.evaluate(i => { const b = document.querySelectorAll('.po-wheel-it')[i]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, i);
/* giữ Q với chuột sát mép phải (vòng bị đẩy vào trong), rê tới ô rồi thả */
async function wheelHoldQ(p, i) {
  await p.page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await p.page.mouse.move(p.vp.width - 8, Math.round(p.vp.height * 0.45));
  await p.page.keyboard.down('q'); await sleep(250);
  const at = await wheelItem(p, i);
  await p.page.mouse.move(at.x, at.y, { steps: 5 }); await sleep(450);
  await p.page.keyboard.up('q'); await sleep(300);
}
/* bấm nút ✋ (vòng đứng yên) rồi bấm vào ô */
async function wheelButton(p, i) {
  const r = await p.page.evaluate(() => { const b = document.getElementById('po-wheel-btn'); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, vis: !b.hidden }; });
  if (!r.vis) return false;
  await p.page.mouse.click(r.x, r.y); await sleep(400);
  const at = await wheelItem(p, i); await p.page.mouse.click(at.x, at.y); await sleep(300);
  return true;
}
/* hoạt ảnh thật trên khớp xương của nhân vật (mình: me.avatar · người khác: World.others) */
const avState = (p, uid) => p.page.evaluate(u => {
  const av = u === __potaNet.me.id ? World.me.avatar : (World.others.get(u) || {}).av; if (!av || !av.rig) return null;
  const j = av.rig.joints, w = new THREE.Vector3(), r = new THREE.Vector3();
  av.root.getWorldPosition(r); j.wristR.getWorldPosition(w);
  return { emo: av.emo ? av.emo.kind : null, act: av.act || null, actW: av.actW || 0, sit: !!av.sit, shZ: j.shoulderR.rotation.z,
    prop: !!(av.propObj && av.propObj.parent === j.torso && av.propObj.visible), wristUp: w.y - r.y };
}, uid);
async function checkActs(A, B, label, seated) {
  for (const [how, i, k] of [['nút ✋', 0, 'vay'], ['giữ Q', 1, 'doc'], ['giữ Q', 2, 'dien-thoai'], ['giữ Q', 3, 'laptop']]) {
    if (k === 'vay') await sleep(2600);                       // cử chỉ cách nhau ≥ 2,5 giây
    if (how === 'nút ✋') ok(await wheelButton(A, i), `${label}: nút ✋ hiện và mở được vòng hành động`);
    else await wheelHoldQ(A, i);
    if (k === 'vay') {
      const me = await until(async () => { const s = await avState(A, A.uid); return s && s.emo === 'vay' && s.shZ < -1.2 ? s : null; }, 20000);
      ok(!!me, `${label}: A vẫy tay — tay phải giơ lên (${me ? me.shZ.toFixed(2) : '?'} rad)`);
      const seen = await until(async () => { const s = await avState(B, A.uid); return s && s.emo === 'vay' && s.shZ < -1.2 ? s : null; }, 20000);
      ok(!!seen, `${label}: B thấy A vẫy tay (hoạt ảnh chạy trên nhân vật của A ở máy B)`);
      continue;
    }
    const me = await until(async () => { const s = await avState(A, A.uid); return s && s.act === k && s.prop && s.actW > 0.6 ? s : null; }, 25000);
    ok(!!me && (!seated || me.sit), `${label}: A ${k} — có đồ vật trên tay, tư thế chuyển sang hoạt động (w=${me ? me.actW.toFixed(2) : '?'}${seated ? ', đang ngồi' : ''})`);
    const seen = await until(async () => { const s = await avState(B, A.uid); return s && s.act === k && s.prop && s.actW > 0.6 ? s : null; }, 25000);
    ok(!!seen, `${label}: B thấy A ${k} (đồ vật + tư thế trên nhân vật của A)`);
    if (k === 'doc') await shot(B, `B-thay-A-${seated ? 'ngoi' : 'dung'}-doc-sach`);
  }
  await A.page.keyboard.press('Digit0');
  ok(await until(async () => { const s = await avState(B, A.uid); return s && !s.act; }, 15000), `${label}: phím 0 dừng hoạt động, B thấy A cất đồ`);
}
/* bong bóng: tìm theo nội dung trong nhãn của người nói ở một máy */
const bubbleGeo = (p, uid, text) => p.page.evaluate(([u, text]) => {
  const el = u === __potaNet.me.id ? document.querySelector('#labels .po-tag.me') : (World.others.get(u) || {}).label;
  if (!el) return { none: 'không có nhãn' };
  const bb = [...el.querySelectorAll('.po-bubble')].find(b => b.textContent === text);
  if (!bb) return null;
  const R = x => x.getBoundingClientRect(), b = R(bb), n = R(el.querySelector('.po-name'));
  const hud = [...document.querySelectorAll('.po-top .po-card')].map(R).filter(r => r.width && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
  return { shown: el.style.display !== 'none' && getComputedStyle(bb).display !== 'none' && b.width > 0, above: b.bottom <= n.top + 1, dx: Math.abs((b.left + b.right) / 2 - (n.left + n.right) / 2),
    inView: b.top >= 0 && b.left >= -2 && b.right <= innerWidth + 2, underHud: hud.length };
}, [uid, text]);
async function chatUi(p, text) {
  await p.page.evaluate(() => document.querySelector('.po-tabs [data-tab=chat]').click());
  await p.page.waitForSelector('.po-pane[data-pane=chat] input.po-in', { timeout: 60000 });
  await p.page.fill('.po-pane[data-pane=chat] input.po-in', text);
  await p.page.press('.po-pane[data-pane=chat] input.po-in', 'Enter');
  await until(() => p.page.evaluate(t => (__APP.chatCache || []).some(m => m.text === t), text), 15000);
  await p.page.evaluate(() => { document.getElementById('po-side').classList.add('closed'); document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
}
async function checkChat(A, B, label, text) {
  await chatUi(A, text);
  for (const [p, who] of [[A, 'máy A (người gửi)'], [B, 'máy B (người nhận)']]) {
    const g = await until(async () => { const g = await bubbleGeo(p, A.uid, text); return g && g.shown ? g : null; }, 15000);
    ok(!!g, `${label}: bong bóng "${text.slice(0, 18)}…" hiện trên đầu A ở ${who}`);
    if (g) ok(g.above && g.dx < 4 && g.inView && !g.underHud, `${label}: ở ${who} bong bóng nằm ngay trên nhãn tên, giữa, trong màn hình, không bị HUD che ${JSON.stringify(g)}`);
  }
  await shot(B, `B-thay-bong-bong-${label.includes('ngồi') ? 'ngoi' : 'dung'}`);
  const t = Date.now();
  const gone = await until(async () => !(await bubbleGeo(A, A.uid, text)) && !(await bubbleGeo(B, A.uid, text)), 15000, 300);
  ok(!!gone, `${label}: bong bóng tự biến mất ở cả hai máy (sau ~${Math.round((Date.now() - t) / 1000) + 1} giây)`);
}

try {
  console.log('Đăng nhập A, B (desktop) và M (điện thoại)…');
  const A = await enter('A', 1, 'Nguyễn Văn An', '20231111');
  const B = PHAN.has('hanhdong') ? await enter('B', 2, 'Trần Thị Bình', '20232222') : null;

  /* ---------- 1. di chuyển + camera trên desktop ---------- */
  if (PHAN.has('dichuyen')) for (const zone of ['campus', 'lib_a', 'lib_b', 'lib_c']) {
    if (zone !== 'campus') await goZone(A, zone);
    const st = await state(A);
    if (!ok(st.mode === (zone === 'campus' ? 'campus' : 'walk'), `${zone}: A đang đi bộ (chế độ ${st.mode})`)) continue;
    await startProbe(A);
    await faceOpen(A); await sleep(600);
    await dragWhileKey(A, 'w', zone);
    if (zone === 'campus' || zone === 'lib_a') for (const k of ['a', 's', 'd']) await dragWhileKey(A, k, zone);
    await keyDuringDrag(A, zone);
    await noTeleport(A, zone);
    await shot(A, 'A-' + zone);
  }
  // giữ W rồi mở vòng hành động: thả W lúc vòng đang mở → đóng vòng không còn đi
  if (PHAN.has('dichuyen')) {
  await goZone(A, 'lib_a');
  await A.page.keyboard.down('w'); await sleep(300); await A.page.keyboard.down('q'); await sleep(200); await A.page.keyboard.up('w');
  await A.page.keyboard.press('Escape'); await A.page.keyboard.up('q'); await sleep(1200);
  { const a = await state(A); await sleep(900); const b = await state(A); ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.05 && b.roomKeys === 0, 'lib_a: giữ W → mở vòng → thả W → Esc: nhân vật không tự đi tiếp'); }
  }

  /* ---------- 1b. điện thoại: cần điều khiển + vuốt + hai ngón ---------- */
  if (PHAN.has('dienthoai')) {
  const M = await enter('M', 3, 'Lê Minh Cường', '20233333', { viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });
  const cdp = await M.ctx.newCDPSession(M.page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([id, x, y]) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 })) });
  for (const zone of ['campus', 'lib_a']) {
    if (zone !== 'campus') await goZone(M, zone);
    const joy = await M.page.evaluate(() => { const j = document.getElementById('po-joy'); const r = j.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2, shown: !j.hidden && r.width > 0 }; });
    ok(joy.shown, `điện thoại ${zone}: cần điều khiển #po-joy hiện`);
    await faceOpen(M); await sleep(600);
    const s0 = await state(M), jy = joy.y - joy.R * 0.9;
    await touch('touchStart', [[1, joy.x, joy.y]]); await touch('touchMove', [[1, joy.x, jy]]); await sleep(300);
    await touch('touchStart', [[1, joy.x, jy], [2, 260, 330]]);
    const ys = [];
    for (let i = 1; i <= 12; i++) { await touch('touchMove', [[1, joy.x, jy], [2, 260 - i * 9, 330]]); await sleep(50); ys.push((await state(M)).cy); }
    const s1 = await state(M);
    await touch('touchEnd', [[1, joy.x, jy]]); await touch('touchEnd', []);
    const steps = ys.map((y, i) => ang(y - (i ? ys[i - 1] : s0.cy))), total = steps.reduce((a, b) => a + b, 0);
    if (!ok(Math.abs(total) > 0.15 && steps.every(d => Math.sign(d) === Math.sign(total) || Math.abs(d) < 1e-4), `điện thoại ${zone}: giữ cần điều khiển + ngón khác vuốt → camera xoay đều (${total.toFixed(2)} rad)`))
      console.log('        từng bước: ' + steps.map(d => d.toFixed(3)).join(' '));
    ok(Math.hypot(s1.x - s0.x, s1.z - s0.z) > 0.15, `điện thoại ${zone}: vừa đi bằng cần điều khiển vừa xoay (${Math.hypot(s1.x - s0.x, s1.z - s0.z).toFixed(2)} m)`);
    await sleep(1200); { const a = await state(M); await sleep(900); const b = await state(M); ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.05 && b.roomKeys === 0, `điện thoại ${zone}: thả hai ngón là dừng`); }
    const dist = () => M.page.evaluate(() => { const w = new THREE.Vector3(); World.me.avatar.root.getWorldPosition(w); return World.camera.position.distanceTo(w); });
    const d0 = await dist();
    await touch('touchStart', [[3, 150, 330], [4, 240, 330]]);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', [[3, 150 - i * 9, 330], [4, 240 + i * 9, 330]]); await sleep(50); }
    await touch('touchEnd', []); await sleep(1500);
    const d1 = await dist();
    ok(d1 < d0 - 0.3, `điện thoại ${zone}: hai ngón kéo ra → camera lại gần (${d0.toFixed(2)} → ${d1.toFixed(2)} m)`);
    await noTeleport(M, 'điện thoại ' + zone);
    await shot(M, 'M-' + zone);
  }
  await M.ctx.close();
  }

  /* ---------- 2–4. vòng hành động + bong bóng chat, hai người ---------- */
  if (PHAN.has('hanhdong')) {
  await goZone(A, 'lib_a'); await goZone(B, 'lib_a');
  const placeB = async (x, z) => {
    await B.page.evaluate(([x, z]) => World.go('lib_a', { at: { x, y: 0, z } }), [x, z]); await sleep(1500);
    await until(() => B.page.evaluate(u => World.others.has(u), A.uid), 60000);
    await B.page.evaluate(u => { const o = World.others.get(u), api = World.sp().module.api; api.yaw = Math.atan2(o.x - World.me.x, -(o.z - World.me.z)); api.pitch = 0.15; document.getElementById('po-side').classList.add('closed'); }, A.uid);
    await sleep(1500);
  };
  // đứng (chế độ đi bộ)
  const aPos = await A.page.evaluate(() => ({ x: World.me.x, z: World.me.z }));
  await placeB(aPos.x + 2.5, aPos.z - 0.5);
  ok(await B.page.evaluate(u => World.others.has(u), A.uid), 'B (cùng sảnh tầng 1) thấy nhân vật của A');
  await checkActs(A, B, 'đứng', false);
  await sleep(1000);
  await checkChat(A, B, 'đứng', 'Chào mọi người, mình đang ôn Giải tích 1!');
  // ngồi: A ngồi ghế băng gần đó, B đứng cạnh nhìn sang
  const seat = await A.page.evaluate(() => { const sp = World.sp(); let best = -1, bd = 1e9; sp.seats.forEach((s, i) => { if (s.kind !== 'bench' || s.y > 1) return; const d = Math.hypot(s.x - World.me.x, s.z - World.me.z); if (d < bd) { bd = d; best = i; } }); return best >= 0 ? { i: best, x: sp.seats[best].x, z: sp.seats[best].z } : null; });
  if (ok(!!seat, 'có ghế băng ở tầng 1 để thử khi ngồi')) {
    await A.page.evaluate(i => World.go('lib_a', { seat: i }), seat.i); await sleep(1500);
    ok(await until(() => A.page.evaluate(() => World.me.mode === 'seat' && World.me.avatar.sit), 20000), 'A đang ngồi');
    await noTeleport(A, 'đang ngồi');
    await placeB(seat.x + (seat.x < 0 ? 2.5 : -2.5), seat.z);
    ok(await until(() => B.page.evaluate(u => { const o = World.others.get(u); return o && o.av.sit; }, A.uid), 20000), 'B thấy A ngồi');
    await checkActs(A, B, 'ngồi', true);
    await sleep(11000);                                     // chống spam: tin thứ hai sau ≥ 10 giây
    await checkChat(A, B, 'ngồi', 'Ai ôn Vật lý đại cương thì ngồi cùng nhé');
  }
  }
} catch (e) {
  ok(false, 'lỗi khi chạy kiểm thử: ' + (e && e.stack || e));
} finally {
  const errs = errors.filter(e => !/open-meteo|ERR_NAME|ERR_INTERNET|ERR_CONNECTION|net::ERR_TUNNEL|Failed to load resource/i.test(e));
  ok(errs.length === 0, 'không có lỗi JavaScript trong Console' + (errs.length ? ':\n        ' + errs.slice(0, 15).join('\n        ') : ''));
  if (srv) srv.kill();
  await Promise.race([browser.close(), sleep(15000)]);
  console.log(`        ảnh chụp: ${OUT}`);
  console.log((failed ? `\n${failed} mục LỖI` : '\nTẤT CẢ ĐẠT') + ` (${Math.round((Date.now() - T0) / 1000)} giây)`);
  process.exit(failed ? 1 : 0);
}
