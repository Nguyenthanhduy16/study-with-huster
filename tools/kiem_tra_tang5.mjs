#!/usr/bin/env node
/* =====================================================================
   KIỂM TRA TẦNG 5 TRONG CẢNH RENDER THẬT (Chromium + WebGL phần mềm)
   Chạy:   node tools/kiem_tra_tang5.mjs [--port=3150] [--out=thu-muc-anh] [--headed]
   Cần:    gói playwright + Chromium (tự bật máy chủ ngoại tuyến nếu cổng còn trống).
   Kiểm:   · đi thang máy từ tầng 1 lên tầng 5 (phím 5 trong cabin), bước ra hành lang tầng 5
           · tên vị trí "Tầng 5" / "Phòng 518", mặt sàn tầng 5 = 4 × 4,5 m
           · ghế phòng 518 có trong danh sách ghế, ngồi được bằng luồng thật goSit, đứng dậy
           · thang máy tầng 5 → tầng 6 (chuyển sang khối B) và tầng 6 → tầng 5 (về khối A)
           · ảnh chụp: hành lang (biển 509, 511, 518, 525, 526, Phòng học nhóm), trong phòng 518, giếng trời 5 tầng
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 3150), BASE = `http://localhost:${PORT}`;
const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'kiem-tra-tang5'));
fs.mkdirSync(OUT, { recursive: true });
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { console.error('Chưa có gói playwright.'); process.exit(2); }

let failed = 0, passed = 0;
const ok = (cond, msg) => { console.log((cond ? '  ĐẠT  ' : '  LỖI  ') + msg); if (cond) passed++; else failed++; return cond; };
const browser = await chromium.launch({ headless: !args.headed, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let srv = null; const errors = [];
const alive = () => fetch(BASE + '/', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
try {
  if (!(await alive())) {
    srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT, '--offline', '--csp'], { stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ dừng: ' + c))); });
  }
  const ctx = await browser.newContext({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    localStorage.setItem('pota:welcomed', '1'); localStorage.setItem('pota:quality', '"low"');
    localStorage.setItem('pota:tip:controls', '1'); localStorage.setItem('pota:tip:controls2', '1');
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/open-meteo|Failed to load resource|ERR_/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/', { timeout: 180000 });
  await page.waitForSelector('#f-name', { timeout: 180000 });
  await page.fill('#f-name', 'Kiểm Tra Tầng'); await page.fill('#f-mssv', '20239998');
  await page.click('.po-login-card button[type=submit]');
  await page.waitForSelector('#po-hud:not([hidden])', { timeout: 300000 });
  await page.waitForFunction(() => window.World && World.me.zone && World.me.mode !== 'idle' && World.sp(), null, { timeout: 180000 });
  await page.evaluate(() => {
    const st = document.createElement('style');
    st.textContent = '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important}' +
      'body.kt-chup #po-side,body.kt-chup .po-hud,body.kt-chup #po-hud,body.kt-chup #po-mini,body.kt-chup .po-bottom,body.kt-chup #labels,body.kt-chup #po-wheel-btn{visibility:hidden!important}';
    document.head.appendChild(st);
    const R = HUST3D.renderer, draw = R.render.bind(R);
    const T = window.__KT = { sleep: ms => new Promise(r => setTimeout(r, ms)) };
    T.pause = on => { R.render = on ? () => { } : draw; };
    /* ảnh từ một camera riêng (toạ độ của khối đang hiện) */
    T.shot = (p, t, fov = 62) => {
      const c = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.05, 400); c.position.set(...p); c.lookAt(...t); c.updateMatrixWorld(true);
      draw(HUST3D.world, c);
    };
    T.key = k => { for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { key: k, code: 'Digit' + k, bubbles: true })); };
  });
  const snap = async (name, p, t, fov) => {
    await page.evaluate(([p, t, fov]) => { document.body.classList.add('kt-chup'); __KT.pause(true); __KT.shot(p, t, fov); }, [p, t, fov]);
    await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 180000 });
    await page.evaluate(() => { document.body.classList.remove('kt-chup'); __KT.pause(false); });
    console.log('        ảnh: ' + path.join(OUT, name + '.png'));
  };

  /* ---------- vào thư viện, đi thang máy lên tầng 5 ---------- */
  await page.evaluate(async () => { __KT.pause(true); await World.go('lib_a'); await __KT.sleep(1500); });
  ok(await page.evaluate(() => World.me.space === 'A' && JSON.stringify(World.sp().floors) === JSON.stringify([0, 4.5, 9, 13.5, 18])), 'khối A có 5 mặt sàn [0, 4.5, 9, 13.5, 18]');
  // đứng trong cabin thang máy số 1 (đang đỗ ở tầng 1)
  await page.evaluate(async () => { World.sp().walkNow(20.75, 0, -2.9, -Math.PI / 2); await __KT.sleep(2500); });
  ok(await page.evaluate(() => !!HUST3D.A.api.rider), 'đứng trong cabin thang máy ở tầng 1');
  await page.evaluate(() => __KT.key('5'));
  const up = await page.waitForFunction(() => { const r = HUST3D.A.api.rider; return r && r.phase === 'idle' && r.floor === 5 && Math.abs(HUST3D.A.api.base - 18) < 0.05; }, null, { timeout: 90000 }).then(() => true).catch(() => false);
  ok(up, 'bấm phím 5 trong cabin → thang máy lên tầng 5 (mặt sàn 18 m)');
  await page.waitForTimeout(2500);
  ok(await page.evaluate(() => Math.abs(World.me.y - 18) < 0.1), 'nhân vật theo thang máy lên độ cao 18 m');

  /* ---------- bước ra hành lang tầng 5 ---------- */
  await page.evaluate(async () => { World.placeNear(World.sp(), { x: 12, y: 18, z: 4 }); await __KT.sleep(1500); });
  const pl = await page.evaluate(() => ({ here: World.sp().place(World.me.x, World.me.y, World.me.z), room: World.sp().place(0, 18, -20), fl4: World.sp().place(0, 13.5, -20), y: World.me.y, mode: World.me.mode, fo: World.sp().floorOf(18.2) }));
  ok(pl.mode === 'walk' && Math.abs(pl.y - 18) < 0.1, `đứng trên hành lang tầng 5 (y = ${pl.y})`);
  ok(pl.here === 'Tầng 5' && pl.room === 'Phòng 518' && pl.fl4 === 'Phòng 401' && pl.fo === 18, `tên vị trí: "${pl.here}", "${pl.room}", tầng 4 vẫn "${pl.fl4}"`);
  /* so mặt sàn đi được của tầng 5 với tầng 4 trên cả hai lưới (hành lang + phòng 518 / 401 có cùng bố cục) */
  const cmp = await page.evaluate(() => { const s = World.sp(); let same = 0, diff = [], n = 0, walk5 = 0;
    for (let x = -21; x <= 19; x += 0.5) for (let z = -38; z <= 12.5; z += 0.5) { n++; const a = s.free(x, z, 13.5), b = s.free(x, z, 18); if (b) walk5++; if (a === b) same++; else if (diff.length < 8) diff.push([x, z, a, b]); }
    return { n, same, diff, walk5, corridor: s.free(10, 4, 18) || s.free(12, 9, 18), voidC: s.free(0, 0, 18) }; });
  console.log('        so lưới tầng 4/5:', JSON.stringify(cmp));
  ok(cmp.corridor && !cmp.voidC && cmp.walk5 > 500, `đi được hành lang tầng 5 (${cmp.walk5} ô), không bước vào giếng trời`);
  ok(cmp.same / cmp.n > 0.97, `mặt sàn đi được tầng 5 khớp tầng 4 ở ${(100 * cmp.same / cmp.n).toFixed(1)}% ô (khác nhau do bàn ghế hành lang bố trí lại)`);
  await snap('1-hanh-lang-sau-518', [3, 19.8, 7], [-6, 19.6, -13]);
  await snap('2-tuong-trai-509-511', [6, 19.8, 3], [-19.5, 19.4, -3.5]);
  await snap('3-tuong-phai-525-526', [-5, 19.8, 1], [19.5, 19.4, 1.5]);
  await snap('4-truoc-phong-hoc-nhom', [0, 19.8, -2], [0, 19.4, 13]);

  /* ---------- ngồi ghế phòng 518 ---------- */
  const seats = await page.evaluate(() => World.sp().seats.map((s, i) => ({ i, room: s.room, y: s.y, floor: s.floor })).filter(s => s.room === '518'));
  const n401 = await page.evaluate(() => World.sp().seats.filter(s => s.room === '401').length);
  ok(seats.length > 0 && seats.length === n401 && seats.every(s => s.floor === 18), `phòng 518 có ${seats.length} chỗ ngồi (bằng phòng 401: ${n401}), tất cả ở mặt sàn 18 m`);
  if (seats.length) {
    const i = seats[Math.floor(seats.length / 2)].i;
    await page.evaluate(i => { const s = World.sp().seats[i]; World.placeNear(World.sp(), { x: s.x + Math.sin(s.ry) * 1.6, y: 18, z: s.z + Math.cos(s.ry) * 1.6 }); }, i);
    await page.waitForTimeout(1500);
    // như tools/kiem_tra_ghe_render.mjs: tạm bỏ lệnh vẽ (SwiftShader ~1 hình/giây) để logic khung hình chạy nhanh trong lúc đi/ngồi
    await page.evaluate(i => { __KT.pause(true); World.goSit(i); }, i);
    const sat = await page.waitForFunction(i => { const s = World.sp().seats[i]; return World.me.mode === 'seat' && World.me.seat === i && Math.hypot(World.me.x - s.x, World.me.z - s.z) < 0.05; }, i, { timeout: 60000 }).then(() => true).catch(() => false);
    await page.evaluate(() => __KT.pause(false));
    const pos = await page.evaluate(i => { const s = World.sp().seats[i]; return { dx: Math.hypot(World.me.x - s.x, World.me.z - s.z), dy: Math.abs(World.me.y - s.y), y: World.me.y }; }, i);
    ok(sat && pos.dx < 0.05 && pos.dy < 0.05, `ngồi vào ghế ${i} phòng 518 bằng goSit (lệch ${pos.dx.toFixed(3)} m, y = ${pos.y.toFixed(2)})`);
    await snap('5-ngoi-phong-518', [-1.5, 21.2, -15], [3, 18.6, -26]);
    await page.evaluate(() => World.standUp()); await page.waitForTimeout(1500);
    ok(await page.evaluate(() => World.me.mode === 'walk' && Math.abs(World.me.y - 18) < 0.1), 'đứng dậy, vẫn ở tầng 5');
  }
  await snap('6-gieng-troi-5-tang', [-3, 1.7, 1], [2, 21, -1.5], 80);

  /* ---------- thang máy tầng 5 ⇄ tầng 6 ---------- */
  await page.evaluate(async () => { World.sp().walkNow(20.75, 18, -2.9, -Math.PI / 2); await __KT.sleep(2500); });
  const inCab5 = await page.waitForFunction(() => { const r = HUST3D.A.api.rider; return r && r.floor === 5; }, null, { timeout: 60000 }).then(() => true).catch(() => false);
  ok(inCab5, 'vào cabin thang máy ở tầng 5');
  await page.evaluate(() => __KT.key('6'));
  const toB = await page.waitForFunction(() => World.me.space === 'B' && HUST3D.cur === HUST3D.B, null, { timeout: 120000 }).then(() => true).catch(() => false);
  ok(toB, 'tầng 5 → tầng 6: chuyển sang khối tầng 6–7');
  await page.waitForTimeout(3000);
  await page.evaluate(() => __KT.key('5'));
  const back = await page.waitForFunction(() => World.me.space === 'A' && HUST3D.cur === HUST3D.A && HUST3D.A.api.rider && HUST3D.A.api.rider.floor === 5 && Math.abs(HUST3D.A.api.base - 18) < 0.05, null, { timeout: 120000 }).then(() => true).catch(() => false);
  ok(back, 'tầng 6 → tầng 5: về khối A, đúng mặt sàn 18 m');

  ok(!errors.length, 'không có lỗi JavaScript' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
} catch (e) { ok(false, 'lỗi khi chạy: ' + (e && e.stack || e)); }
finally { await browser.close(); if (srv) srv.kill(); }
console.log(`\n${failed ? failed + ' mục LỖI' : 'TẤT CẢ ĐẠT'} (${passed} đạt)`);
process.exit(failed ? 1 : 0);
