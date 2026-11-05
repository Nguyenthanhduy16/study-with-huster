#!/usr/bin/env node
/* =====================================================================
   KIỂM THỬ ĐỘ MƯỢT CHUYỂN ĐỘNG NGƯỜI KHÁC (2 trình duyệt thật qua Supabase giả lập)
   Chạy:  node tools/kiem_tra_chuyen_dong.mjs [--port=3190]
   A đi bằng phím (thẳng, vừa đi vừa rẽ, dừng, lùi, dừng); ghi theo đồng hồ thật vị trí của A trên máy A và
   vị trí + tốc độ bước chân của A mà máy B đang vẽ, rồi so sánh.
   Đồ hoạ phần mềm làm khung hình rất thấp (vài fps) — đúng trường hợp khó: dt khung hình bị chặn 0,05 s nên
   "thời gian game" chậm hơn đồng hồ thật. Vận tốc/nội suy phải theo đồng hồ thật, nếu không người xem thấy
   nhân vật vượt lên trước rồi giật lùi và bước chân chạy rất nhanh.
   ===================================================================== */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 3190), BASE = `http://localhost:${PORT}`, T = 600000;
let failed = 0;
const ok = (c, m) => { console.log((c ? '  ĐẠT  ' : '  LỖI  ') + m); if (!c) failed++; };

const srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ dừng: ' + c))); });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const enter = async (n, name, mssv) => {
    const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
    await ctx.route('**api.open-meteo.com**', r => r.abort());
    await ctx.addInitScript(() => { localStorage.setItem('pota:welcomed', '1'); localStorage.setItem('pota:quality', '"low"'); localStorage.setItem('pota:tip:controls2', '1'); });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/?nguoi=${n}`, { timeout: T });
    await p.waitForSelector('#f-name', { timeout: T });
    await p.fill('#f-name', name); await p.fill('#f-mssv', mssv);
    await p.click('.po-login-card button[type=submit]');
    await p.waitForSelector('#po-hud:not([hidden])', { timeout: T });
    return p;
  };
  const A = await enter(1, 'Nguyễn Văn An', '20231111'), B = await enter(2, 'Trần Thị Bình', '20232222');
  const uid = await A.evaluate(() => __potaNet.me.id);
  await B.waitForFunction(u => World.others.has(u), uid, { timeout: 120000 });
  await A.waitForTimeout(2500);
  await A.evaluate(() => { window.__rec = []; const f = () => { __rec.push([Date.now(), World.me.x, World.me.z]); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await B.evaluate(u => { window.__rec = []; const f = () => { const o = World.others.get(u); if (o) __rec.push([Date.now(), o.x, o.z, o.speed || 0]); requestAnimationFrame(f); }; requestAnimationFrame(f); }, uid);
  const k = A.keyboard; await A.bringToFront();
  await k.down('KeyW'); await A.waitForTimeout(4000);
  await k.down('ArrowLeft'); await A.waitForTimeout(3000); await k.up('ArrowLeft');
  await A.waitForTimeout(2000); await k.up('KeyW');
  await A.waitForTimeout(3000);
  await k.down('KeyS'); await A.waitForTimeout(3000); await k.up('KeyS');
  await A.waitForTimeout(3000);
  const ra = await A.evaluate(() => __rec), rb = await B.evaluate(() => __rec);

  if (args.dump) fs.writeFileSync(args.dump, JSON.stringify({ ra, rb }));   // --dump=tep.json: lưu số liệu để xem kỹ
  const ta = ra.map(r => r[0]);
  const truth = t => { let i = ta.findIndex(x => x >= t); if (i <= 0) return ra[Math.max(0, i)].slice(1, 3); const a = ra[i - 1], b = ra[i], f = (t - a[0]) / Math.max(1, b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  const speeds = r => { const out = []; for (let i = 0; i < r.length; i++) { let j = i; while (j < r.length && r[j][0] - r[i][0] < 500) j++; if (j >= r.length) break; out.push(Math.hypot(r[j][1] - r[i][1], r[j][2] - r[i][2]) / ((r[j][0] - r[i][0]) / 1000)); } return out; };
  const fps = (ra.length - 1) / ((ra.at(-1)[0] - ra[0][0]) / 1000);
  const errs = rb.slice(3).map(([t, x, z]) => { const [tx, tz] = truth(t); return Math.hypot(x - tx, z - tz); });
  const avgErr = errs.reduce((a, b) => a + b, 0) / errs.length, maxErr = Math.max(...errs);
  const trueMax = Math.max(...speeds(ra)), animMax = Math.max(...rb.map(r => r[3]));
  const last = rb.slice(-3), truthEnd = truth(last.at(-1)[0]);
  console.log(`        ${fps.toFixed(1)} fps · lệch TB ${avgErr.toFixed(2)} m, lớn nhất ${maxErr.toFixed(2)} m · tốc độ thật tối đa ${trueMax.toFixed(2)} m/s, bước chân tối đa ${animMax.toFixed(2)} m/s`);
  ok(ra.length > 10 && rb.length > 10, 'ghi đủ dữ liệu ở hai máy');
  ok(avgErr < 0.3, `B vẽ A sát vị trí thật (lệch TB ${avgErr.toFixed(2)} m < 0,3 m)`);
  ok(maxErr < 0.8, `không vượt lên trước / giật lùi xa (lệch lớn nhất ${maxErr.toFixed(2)} m < 0,8 m)`);
  ok(animMax < trueMax * 2 + 0.8, `bước chân không nhanh hơn chuyển động thật (${animMax.toFixed(2)} so với ${trueMax.toFixed(2)} m/s)`);
  ok(last.every(r => r[3] < 0.2) && Math.hypot(last.at(-1)[1] - truthEnd[0], last.at(-1)[2] - truthEnd[1]) < 0.15, 'A dừng: B thấy A đứng yên đúng chỗ');
} catch (e) { ok(false, 'lỗi khi chạy: ' + e.message.split('\n')[0]); }
finally { await browser.close(); srv.kill(); }
console.log(failed ? `\n${failed} mục LỖI` : '\nTẤT CẢ ĐẠT: chuyển động người khác');
process.exit(failed ? 1 : 0);
