#!/usr/bin/env node
/* =====================================================================
   KIỂM THỬ GIAO DIỆN ĐIỆN THOẠI (cảnh WebGL thật, Chromium giả lập iPhone/Android)
   Chạy:  node tools/kiem_tra_mobile.mjs [--port=3170] [--out=thu-muc-anh]
   Kiểm (dọc 390×664, ngang 750×342, Android 412×839):
     · mọi nút trên thanh trên cùng nằm trong màn hình (kể cả ☰)
     · thông báo không đè cần điều khiển / nút ✋
     · chạm nhanh vào ✋ mở được vòng hành động (không tự đóng), chạm một ô thì chọn
     · mở bảng chat: ô nhập và nút Gửi nằm trong màn hình, không bị nút nổi đè
   Chạy ngoại tuyến (config.js được thay bằng bản để trống khi thử).
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 3170), BASE = `http://localhost:${PORT}`, OUT = args.out ? path.resolve(args.out) : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (c, m) => { console.log((c ? '  ĐẠT  ' : '  LỖI  ') + m); if (!c) failed++; };

const srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT, '--offline'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ dừng: ' + c))); });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const T = 300000;
const inView = (r, vw, vh) => r && r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1;
const overlap = (a, b) => a && b && a.width && b.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e || e.hidden || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; }, sel);
try {
  for (const [name, dev] of [['doc', devices['iPhone 13']], ['ngang', devices['iPhone 13 landscape']], ['android', devices['Pixel 7']]]) {
    console.log(`— ${name} ${dev.viewport.width}×${dev.viewport.height}`);
    const { width: vw, height: vh } = dev.viewport;
    const ctx = await browser.newContext({ ...dev });
    await ctx.route('**/config.js', async r => {
      const res = await r.fetch();
      const t = (await res.text()).replace(/^window\.SUPABASE_URL = .*$/m, "window.SUPABASE_URL = '';").replace(/^window\.SUPABASE_ANON_KEY = .*$/m, "window.SUPABASE_ANON_KEY = '';");
      await r.fulfill({ response: res, body: t });
    });
    await ctx.addInitScript(() => { localStorage.setItem('pota:welcomed', '1'); });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/', { timeout: T });
    await p.waitForSelector('.po-login-card', { timeout: T });
    await p.fill('#f-name', 'Thử Điện Thoại'); await p.fill('#f-mssv', '20230012');
    await p.click('.po-login-card button[type=submit]');
    await p.waitForSelector('#po-hud:not([hidden])', { timeout: T });
    await p.waitForTimeout(3000);
    if (OUT) await p.screenshot({ path: path.join(OUT, name + '-1-san.png'), timeout: 120000 });

    ok(await p.evaluate(() => document.getElementById('po-side').classList.contains('closed')), 'bảng bên đóng sẵn');
    const tools = await p.evaluate(() => [...document.querySelectorAll('.po-top .po-stat, .po-top .po-ibtn')].map(e => { const r = e.getBoundingClientRect(); return { id: e.id, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width }; }));
    const out = tools.filter(r => !inView(r, vw, vh)).map(r => r.id);
    ok(tools.length >= 9 && !out.length, 'mọi nút thanh trên nằm trong màn hình' + (out.length ? ': ngoài ' + out.join(', ') : ''));
    const toast = await rect(p, '#po-toasts'), joy = await rect(p, '#po-joy'), wheelBtn = await rect(p, '#po-wheel-btn');
    const toastBox = await p.evaluate(() => { const e = document.querySelector('#po-toasts .po-toast'); if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width }; });
    ok(!overlap(toastBox, joy) && !overlap(toastBox, wheelBtn), 'thông báo không đè cần điều khiển / nút ✋' + (toast ? '' : ''));
    ok(inView(joy, vw, vh) && inView(wheelBtn, vw, vh), 'cần điều khiển và nút ✋ nằm trong màn hình');

    // vòng hành động: chạm nhanh mở và giữ nguyên
    await p.tap('#po-wheel-btn'); await p.waitForTimeout(900);
    ok(await p.evaluate(() => document.body.classList.contains('po-wheel-on')), 'chạm nhanh ✋ mở vòng hành động (không tự đóng)');
    if (OUT) await p.screenshot({ path: path.join(OUT, name + '-2-vong.png'), timeout: 120000 });
    const item = await rect(p, '.po-wheel-it');
    if (item) { await p.touchscreen.tap(item.left + item.width / 2, item.top + item.height / 2); await p.waitForTimeout(900); }
    ok(!(await p.evaluate(() => document.body.classList.contains('po-wheel-on'))), 'chạm một ô: chọn và đóng vòng');

    // bảng chat
    await p.tap('#po-panel-btn'); await p.waitForTimeout(700);
    await p.tap('.po-tabs [data-tab=chat]'); await p.waitForTimeout(900);
    if (OUT) await p.screenshot({ path: path.join(OUT, name + '-3-chat.png'), timeout: 120000 });
    const inp = await rect(p, '.po-pane[data-pane=chat] .po-compose-row .po-in'), send = await rect(p, '.po-pane[data-pane=chat] .po-compose-row .po-btn');
    ok(inView(inp, vw, vh) && inView(send, vw, vh), 'mở chat: ô nhập và nút Gửi nằm trong màn hình');
    const floating = await p.evaluate(() => ['#po-joy', '#po-wheel-btn', '#po-mini', '#po-mini-btn'].filter(s => { const e = document.querySelector(s); return e && !e.hidden && getComputedStyle(e).display !== 'none'; }));
    ok(!floating.length, 'mở chat: nút nổi được ẩn' + (floating.length ? ' (còn ' + floating.join(', ') + ')' : ''));
    await p.tap('#po-side-x'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('po-joy')).display !== 'none'), 'đóng chat: cần điều khiển hiện lại');
    ok(!errs.length, 'không có lỗi JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await ctx.close();
  }
} catch (e) { ok(false, 'lỗi khi chạy: ' + e.message.split('\n')[0]); }
finally { await browser.close(); srv.kill(); }
console.log(failed ? `\n${failed} mục LỖI` : '\nTẤT CẢ ĐẠT: giao diện điện thoại');
process.exit(failed ? 1 : 0);
