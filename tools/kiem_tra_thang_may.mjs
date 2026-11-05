#!/usr/bin/env node
/* =====================================================================
   KIỂM THỬ THANG MÁY (cảnh WebGL thật, Chromium không giao diện)
   Chạy:  node tools/kiem_tra_thang_may.mjs [--port=3130]
   Kiểm:  đi thang máy tầng 1 → tầng 6 (cabin chuyển từ khối A sang khối B) và tầng 6 → tầng 1:
          tới nơi nhân vật phải ĐỨNG TRONG CABIN (không lệch ra ngoài tường) và bước ra sàn được.
   Hồi quy lỗi: khung hình cũ của khối A chạy nốt sau khi đã chuyển sang khối B ⇒ toạ độ bị lệch OFF.
   Để không phải chờ cabin chạy hết (đồ hoạ phần mềm rất chậm), bài thử đặt cabin ở cuối hành trình.
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { console.error('Cần Playwright: npm install --no-save playwright && npx playwright install chromium'); process.exit(2); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 3130), BASE = `http://localhost:${PORT}`;
let failed = 0;
const ok = (c, m) => { console.log((c ? '  ĐẠT  ' : '  LỖI  ') + m); if (!c) failed++; };

let srv = null, browser = null;
const T = 300000;
try {
  // Start the browser first so a missing Chromium binary cannot leave a test server behind.
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT, '--offline'], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('error', rej); srv.once('exit', c => rej(new Error('máy chủ dừng: ' + c))); });
  const ctx = await browser.newContext({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    localStorage.setItem('pota:welcomed', '1'); localStorage.setItem('pota:quality', '"low"');
    localStorage.setItem('pota:tip:controls', '1'); localStorage.setItem('pota:login', JSON.stringify({ start: 'library' }));
  });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/', { timeout: T });
  await p.waitForSelector('#f-name', { timeout: T });
  await p.fill('#f-name', 'Thử Thang Máy'); await p.fill('#f-mssv', '20230001');
  await p.click('.po-login-card button[type=submit]');
  await p.waitForSelector('#po-hud:not([hidden])', { timeout: T });
  // game luôn bắt đầu ở sân trước thư viện: bước vào sảnh trước
  await p.waitForFunction(() => World.me.mode === 'campus' || World.me.space === 'A', null, { timeout: T });
  await p.evaluate(() => World.me.space !== 'A' && World.go('lib_a', { entrance: true }));
  await p.waitForFunction(() => World.me.space === 'A' && World.me.zone === 'lib_a', null, { timeout: T });
  await p.evaluate(() => World.me.mode === 'seat' && World.standUp());
  await p.waitForFunction(() => World.me.mode === 'walk', null, { timeout: T });

  /* cabin đang ở cuối hành trình tới tầng đích ⇒ khung hình kế tiếp chuyển sang khối kia */
  const finishRide = (mod, target) => p.evaluate(([m, t]) => {
    const api = HUST3D[m].api, l = api.rider;
    l.target = t; l.phase = 'moving'; l.t = 0.9; l.y0 = l.y; l.y1 = l.y; l.dur = 0.05; l.door = 0;
    HUST3D.ctx.crossStart(HUST3D[m], l.i);
  }, [mod, target]);
  const walkOut = async (mod, xMax) => {
    await p.evaluate(m => { HUST3D[m].api.yaw = -Math.PI / 2; }, mod);       // quay mặt ra cửa cabin
    await p.keyboard.down('KeyW');
    await p.waitForFunction(x => World.me.x < x, xMax, { timeout: T }).catch(() => { });
    await p.keyboard.up('KeyW'); await p.waitForTimeout(800);
  };

  // 1) tầng 1 → tầng 6
  await p.evaluate(() => SceneAPI.spaces.A.walkNow(20.5, 0, -2.9, -Math.PI / 2));   // vào cabin số 0 (đang ở tầng 1)
  await p.waitForFunction(() => !!HUST3D.A.api.rider, null, { timeout: T });
  await finishRide('A', 6);
  await p.waitForFunction(() => World.me.space === 'B', null, { timeout: T });
  await p.waitForTimeout(2500);
  let r = await p.evaluate(() => ({ x: World.me.x, z: World.me.z, rider: !!HUST3D.B.api.rider, eye: HUST3D.B.api.camera.position.x }));
  ok(r.rider && Math.abs(r.x - 17.5) < 0.3 && Math.abs(r.eye - r.x) < 0.01, `tới tầng 6: đứng trong cabin (x=${r.x.toFixed(2)}, z=${r.z.toFixed(2)})`);
  await walkOut('B', 14);
  r = await p.evaluate(() => ({ x: World.me.x, z: World.me.z, rider: !!HUST3D.B.api.rider, free: SceneAPI.spaces.B.free(World.me.x, World.me.z, 0), zone: World.me.zone }));
  ok(!r.rider && r.free && r.zone === 'lib_b' && r.x < 14.5, `bước ra sàn tầng 6 (x=${r.x.toFixed(2)})`);

  // 2) tầng 6 → tầng 1
  await p.evaluate(() => SceneAPI.spaces.B.walkNow(17.5, 0, -2.9, -Math.PI / 2));
  await p.waitForFunction(() => !!HUST3D.B.api.rider, null, { timeout: T });
  await finishRide('B', 1);
  await p.waitForFunction(() => World.me.space === 'A', null, { timeout: T });
  await p.waitForTimeout(2500);
  r = await p.evaluate(() => ({ x: World.me.x, rider: !!HUST3D.A.api.rider, base: HUST3D.A.api.base }));
  ok(r.rider && Math.abs(r.x - 20.5) < 0.3 && r.base === 0, `tới tầng 1: đứng trong cabin (x=${r.x.toFixed(2)})`);
  await walkOut('A', 17);
  r = await p.evaluate(() => ({ x: World.me.x, rider: !!HUST3D.A.api.rider, zone: World.me.zone }));
  ok(!r.rider && r.zone === 'lib_a' && r.x < 17.5, `bước ra sảnh tầng 1 (x=${r.x.toFixed(2)})`);

  // 3) sân thượng → tầng 6 (đi bằng cửa thang máy trên sân thượng)
  await p.evaluate(() => World.go('lib_b', { arrive: { floor: 6, idx: 1 }, text: 'Xuống tầng 6…' }));
  await p.waitForFunction(() => World.me.space === 'B' && World.me.mode === 'walk', null, { timeout: T });
  await p.waitForTimeout(1500);
  r = await p.evaluate(() => ({ x: World.me.x, z: World.me.z, rider: !!HUST3D.B.api.rider }));
  ok(r.rider && Math.abs(r.z) < 0.7, `từ sân thượng xuống tầng 6: đứng trong cabin (x=${r.x.toFixed(2)}, z=${r.z.toFixed(2)})`);
  ok(!errs.length, 'không có lỗi JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} catch (e) {
  ok(false, 'lỗi khi chạy: ' + e.message.split('\n')[0]);
  if (/Executable doesn't exist|browserType.launch/.test(e.message)) console.error('Cài trình duyệt kiểm thử bằng: npx playwright install chromium');
}
finally { try { if (browser) await browser.close(); } finally { if (srv) srv.kill(); } }
console.log(failed ? `\n${failed} mục LỖI` : '\nTẤT CẢ ĐẠT: thang máy');
process.exit(failed ? 1 : 0);
