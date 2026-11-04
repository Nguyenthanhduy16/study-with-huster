#!/usr/bin/env node
/* =====================================================================
   KIỂM TRA NGỒI GHẾ TRONG CẢNH RENDER THẬT (Chromium + WebGL phần mềm)
   Chạy:   node tools/kiem_tra_ghe_render.mjs [--port=3101] [--all] [--zones=lib_a,lib_b,lib_c,campus]
                                              [--per=3] [--out=thu-muc-anh] [--headed]
   Cần:    gói playwright + Chromium. Nếu cổng chưa có máy chủ, script tự bật
           tools/fake-supabase-server.mjs --offline --csp trên cổng đó.
   Kiểm:   với mỗi loại ghế ở mỗi tầng của mỗi khu (mặc định lấy --per ghế trải đều, --all là mọi ghế):
           · đứng cách ghế vài mét trên lối đi rồi ngồi bằng luồng thật goSit (tìm đường A*, đi bộ, sitAt)
           · chế độ 'seat' (đàn: 'piano'), đúng chỉ số ghế
           · gốc nhân vật trùng vị trí/độ cao/hướng của ghế; khớp hông thật nằm trên mặt ngồi
             (bắn tia xuống cảnh), mặt ngồi đỡ đủ quanh hông, không có vật đè lên đùi/ngực (không xuyên bàn)
           · ghế có bàn: bàn ở phía trước mặt, không ở sau lưng
           · đứng dậy: về chế độ đi bộ, đứng trên ô đi được, cùng tầng, ngay cạnh ghế
           · ngồi bằng phím E khi đứng cạnh ghế và bằng cách bấm chuột vào ghế (mỗi khu một ghế)
           · ghế ở tầng khác: không dịch chuyển, có thông báo
           Ảnh chụp (deviceScaleFactor 1) lưu vào --out (mặc định thư mục tạm của hệ điều hành).
   LƯU Ý: SwiftShader vẽ cảnh rất chậm (~1 hình/giây) nên trong lúc nhân vật đi bộ, bài thử tạm
   bỏ qua lệnh vẽ của renderer (logic khung hình, tìm đường, va chạm vẫn chạy như thật) và chỉ
   vẽ lại khi chụp ảnh. Việc đặt người chơi đứng gần ghế trước mỗi lần thử là bước chuẩn bị của
   bài thử (World.placeNear), không phải luồng của người chơi.
   ===================================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]; if (!a.startsWith('--')) continue;
  const [k, ...v] = a.slice(2).split('=');
  args[k] = v.length ? v.join('=') : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true);
}
const PORT = +(args.port || 3101), BASE = `http://localhost:${PORT}`;
const PER = args.all ? Infinity : +(args.per || 3);
const ZONES = String(args.zones || 'lib_a,lib_b,lib_c,campus').split(',');
const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'kiem-tra-ghe-render'));
fs.mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { console.error('Chưa có gói playwright (npm i -D playwright && npx playwright install chromium).'); process.exit(2); }

let failed = 0, passed = 0;
const ok = (cond, msg) => { console.log((cond ? '  ĐẠT  ' : '  LỖI  ') + msg); if (cond) passed++; else failed++; return cond; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- máy chủ ---------- */
let srv = null;
const alive = () => fetch(BASE + '/', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
if (!(await alive())) {
  srv = spawn(process.execPath, [path.join(HERE, 'fake-supabase-server.mjs'), '--port=' + PORT, '--offline', '--csp'], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => { srv.stdout.once('data', res); srv.once('exit', c => rej(new Error('máy chủ dừng: ' + c))); });
}

const browser = await chromium.launch({ headless: !args.headed, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    localStorage.setItem('pota:welcomed', '1');
    localStorage.setItem('pota:quality', '"low"');
    localStorage.setItem('pota:tip:controls', '1');
    localStorage.setItem('pota:login', JSON.stringify({ start: 'library' }));
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/open-meteo|Failed to load resource|ERR_/.test(m.text())) errors.push(m.text()); });
  const T0 = Date.now();
  await page.goto(BASE + '/', { timeout: 180000 });
  await page.waitForSelector('#f-name', { timeout: 180000 });
  await page.fill('#f-name', 'Kiểm Tra Ghế'); await page.fill('#f-mssv', '20239999');
  await page.click('.po-login-card button[type=submit]');
  await page.waitForSelector('#po-hud:not([hidden])', { timeout: 300000 });
  // HUD hiện trước khi World.go() lần đầu xong: chờ nhân vật vào khu rồi mới đổi khu (tránh hai lần đổi khu chồng nhau)
  await page.waitForFunction(() => window.World && World.me.zone && World.me.mode !== 'idle' && World.sp(), null, { timeout: 120000 });
  await sleep(1500);
  console.log(`Đã vào thư viện sau ${((Date.now() - T0) / 1000).toFixed(0)} s. Ảnh: ${OUT}`);

  /* ---------- công cụ trong trang ---------- */
  await page.evaluate(() => {
    // Hiệu ứng mờ nền/animation của giao diện làm trình tổng hợp phần mềm rất chậm; tắt cho bài thử.
    const st = document.createElement('style');
    st.textContent = '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important}';
    document.head.appendChild(st);
    const R = HUST3D.renderer, draw = R.render.bind(R);
    const T = window.__KT = { draw, paused: false };
    T.pause = on => { T.paused = on; R.render = on ? () => { } : draw; };
    const V = THREE.Vector3, rc = new THREE.Raycaster();
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    T.sleep = sleep;
    /* ảnh chụp quanh nhân vật bằng camera riêng (không đụng camera của trò chơi) */
    T.snap = (az = 0.75, el = 0.42, dist = 2.5) => {
      const av = World.me.avatar.root; av.updateMatrixWorld(true);
      const p = av.getWorldPosition(new V()); p.y += 0.75;
      const e = new THREE.Euler().setFromQuaternion(av.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
      const a = e.y + az, c = new THREE.PerspectiveCamera(55, R.domElement.width / R.domElement.height, 0.05, 300);
      c.position.set(p.x + Math.sin(a) * Math.cos(el) * dist, p.y + Math.sin(el) * dist, p.z + Math.cos(a) * Math.cos(el) * dist); c.lookAt(p);
      draw(HUST3D.world, c);
      return R.domElement.toDataURL('image/png');
    };
    /* đo một ghế: tia bắn vào cảnh (bỏ qua mọi nhân vật) */
    T.measure = (space, i) => {
      const s = space.seats[i], g = space.group; g.updateMatrixWorld(true);
      const avRoots = new Set([World.me.avatar.root]);
      for (const o of World.others.values()) if (o.av) avRoots.add(o.av.root);
      const isAv = o => { for (; o; o = o.parent) if (avRoots.has(o)) return true; return false; };
      const meshes = []; g.traverse(o => { if (o.isMesh && o.visible && !isAv(o)) meshes.push(o); });
      const W = (x, y, z) => g.localToWorld(new V(x, y, z)), D = (x, y, z) => new V(x, y, z).transformDirection(g.matrixWorld);
      const cast = (o, d, far) => { rc.set(o, d); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
      const topAt = (x, y0, z, far = 1.2) => { const h = cast(W(x, y0, z), D(0, -1, 0), far); return h ? g.worldToLocal(h.point.clone()).y : null; };
      const av = World.me.avatar; av.root.updateMatrixWorld(true);
      const rp = g.worldToLocal(av.root.getWorldPosition(new V()));
      const j = av.rig && av.rig.joints;
      let hip = null;
      if (j) { const a = j.hipL.getWorldPosition(new V()), b = j.hipR.getWorldPosition(new V()); hip = g.worldToLocal(a.add(b).multiplyScalar(0.5)); }
      const yaw = av.root.rotation.y, fx = Math.sin(yaw), fz = Math.cos(yaw);
      const m = {
        root: [rp.x, rp.y, rp.z], d: Math.hypot(rp.x - s.x, rp.z - s.z), dy: rp.y - s.y,
        dyaw: Math.abs(Math.atan2(Math.sin(yaw - s.ry), Math.cos(yaw - s.ry))), hip: hip && [hip.x, hip.y, hip.z]
      };
      if (!hip) return m;
      // mặt ngồi ngay dưới hông và quanh hông (trái/phải 0,12 m, trước/sau 0,1 m)
      const top = topAt(hip.x, hip.y + 0.25, hip.z);
      m.gap = top == null ? null : hip.y - top;
      m.ring = [[0.12, 0], [-0.12, 0], [0, 0.1], [0, -0.1]].map(([a, b]) => { const t = topAt(hip.x + fz * a + fx * b, hip.y + 0.25, hip.z - fx * a + fz * b); return t == null || top == null ? null : t - top; });
      // vật đè lên hông/đùi: tia từ hông đi lên
      const up = cast(W(hip.x, hip.y + 0.04, hip.z), D(0, 1, 0), 1); m.up = up ? up.distance : null;
      // ngực chạm vật phía trước
      const fr = cast(W(hip.x, hip.y + 0.32, hip.z), D(fx, 0, fz), 2); m.chest = fr ? fr.distance : null;
      // đùi (từ hông ra trước ~0,45 m, cao hơn hông 0,06 m): vật cản ở đây là nhân vật ngồi xuyên vào nó
      const th = cast(W(hip.x, hip.y + 0.06, hip.z), D(fx, 0, fz), 1); m.thigh = th ? th.distance : null;
      // đầu gối (trước hông ~0,42 m): tia đi lên — khoảng hở tới mặt dưới bàn
      const kn = cast(W(hip.x + fx * 0.42, hip.y + 0.03, hip.z + fz * 0.42), D(0, 1, 0), 1); m.knee = kn ? kn.distance : null;
      // bàn trước mặt / sau lưng: mặt phẳng cao hơn hông 0,12–0,40 m
      const desk = sgn => { for (const r of [0.4, 0.55, 0.7, 0.85]) { const t = topAt(hip.x + fx * r * sgn, hip.y + 0.6, hip.z + fz * r * sgn, 0.9); if (t != null && t - hip.y > 0.12 && t - hip.y < 0.4) return +(r).toFixed(2); } return null; };
      m.deskFront = desk(1); m.deskBack = desk(-1);
      return m;
    };
    /* ngồi ghế i bằng luồng thật: đứng cách ghế vài mét → goSit → chờ đi tới và ngồi */
    T.trySeat = async (i, how = 'goSit') => {
      const space = World.sp(), s = space.seats[i];
      let toast = null; const off = World.ev.on('toast', t => { toast = t; });
      try {
        if (World.me.mode === 'seat' || World.me.mode === 'piano') { World.standUp(); await sleep(300); }
        if (World.me.mode === 'piano') await sleep(800);
        const back = how === 'goSit' ? 2.6 : how === 'E' ? 0 : -1.8;   // bấm chuột: đứng sau lưng ghế để camera nhìn thấy ghế
        World.placeNear(space, { x: s.x + Math.sin(s.ry) * back, y: s.floor || 0, z: s.z + Math.cos(s.ry) * back });
        await sleep(250); toast = null;
        const start = [World.me.x, World.me.z];
        let started;
        if (how === 'goSit') started = World.goSit(i);
        else started = true;                                   // E / bấm chuột: Playwright gửi phím/chuột từ ngoài
        return { started, start, off, getToast: () => toast };
      } catch (e) { off(); throw e; }
    };
    T.waitSeat = async (i, ms = 25000) => {
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        if ((World.me.mode === 'seat' || World.me.mode === 'piano') && World.me.seat === i) break;
        await sleep(150);
      }
      return Math.round(performance.now() - t0);
    };
  });

  /* ---------- chạy một ghế ---------- */
  const snap = async (name, az, el, dist) => {
    const url = await page.evaluate(([a, e, d]) => window.__KT.snap(a, e, d), [az, el, dist]);
    const f = path.join(OUT, name + '.png');
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    return f;
  };
  const LIM = { d: 0.03, dy: 0.03, dyaw: 0.05 };
  async function checkSeat(zone, i, label, how = 'goSit', shot = false) {
    await page.evaluate(() => window.__KT.pause(true));
    const info = await page.evaluate(async ([i, how]) => {
      const T = window.__KT, space = World.sp(), s = space.seats[i];
      const r = await T.trySeat(i, how);
      window.__try = r;
      return { s, started: r.started, start: r.start, toast: r.getToast(), near: World.nearSeat(), me: [World.me.x, World.me.z] };
    }, [i, how]);
    if (how === 'E') {
      // đứng cạnh ghế: ghế được gợi ý "E · Ngồi" là ghế sẽ ngồi
      const n = await page.waitForFunction(() => World.nearSeat(), null, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => null);
      if (n == null) { ok(false, `${label}: đứng cạnh ghế #${i} nhưng không có gợi ý nhấn E`); return false; }
      i = n; info.s = await page.evaluate(i => World.sp().seats[i], i);
      await page.keyboard.press('KeyE');
    }
    if (how === 'click') {
      // Đứng ở vài chỗ quanh ghế tới khi con trỏ đặt lên ghế đổi thành biểu tượng chọn ghế (ghế không bị bàn/tường che)
      let clicked = false;
      for (const back of [-1.8, 2.4, -2.6, 1.6]) {
        if (back !== -1.8) await page.evaluate(([i, back]) => { const space = World.sp(), s = space.seats[i]; World.placeNear(space, { x: s.x + Math.sin(s.ry) * back, y: s.floor || 0, z: s.z + Math.cos(s.ry) * back }); }, [i, back]);
        await page.waitForTimeout(1200);                     // camera ngôi thứ ba bám theo nhân vật
        const pt = await page.evaluate(i => {
          const space = World.sp(), s = space.seats[i], c = World.camera;
          const v = new THREE.Vector3(s.x, s.y + 0.45, s.z); space.group.localToWorld(v); v.project(c);
          const r = HUST3D.renderer.domElement.getBoundingClientRect();
          return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, z: v.z };
        }, i);
        if (pt.z >= 1 || pt.x < 5 || pt.y < 5 || pt.x > 955 || pt.y > 595) continue;
        await page.mouse.move(pt.x, pt.y);
        if (await page.evaluate(() => HUST3D.renderer.domElement.style.cursor) !== 'cell') continue;
        await page.mouse.down(); await page.mouse.up(); clicked = true; break;
      }
      if (!clicked) { ok(false, `${label}: không tìm được góc nhìn để bấm vào ghế #${i}`); return false; }
      // bấm có thể trúng ghế bên cạnh (ghế gần con trỏ nhất): kiểm tra ghế thực sự được chọn
      const got = await page.waitForFunction(() => World.me.mode === 'seat' ? World.me.seat : null, null, { timeout: 25000 }).then(h => h.jsonValue()).catch(() => null);
      if (got != null && got !== i) { i = got; info.s = await page.evaluate(i => World.sp().seats[i], i); }
    }
    const res = await page.evaluate(async i => {
      const T = window.__KT, r = window.__try;
      const ms = await T.waitSeat(i);
      r.off();
      const space = World.sp();
      const seated = (World.me.mode === 'seat' || World.me.mode === 'piano') && World.me.seat === i;
      await T.sleep(400);                                    // vài khung hình để tư thế ngồi cập nhật khớp
      return { ms, seated, mode: World.me.mode, seat: World.me.seat, toast: r.getToast(), me: [World.me.x, World.me.z], m: seated ? T.measure(space, i) : null };
    }, i);
    if (!res.seated && /có bạn ngồi/.test(res.toast || info.toast || '')) return 'busy';   // NPC/người khác đang ngồi
    const s = info.s, m = res.m, tag = `${label} #${i} (${s.kind}, x=${s.x.toFixed(2)} z=${s.z.toFixed(2)})`;
    const wantMode = s.kind === 'piano' ? 'piano' : 'seat';
    if (!ok(info.started && res.seated && res.mode === wantMode, `${tag}: ${how === 'goSit' ? 'đi tới và ngồi' : how === 'E' ? 'nhấn E để ngồi' : 'bấm vào ghế để ngồi'}` + (res.seated ? ` (${(res.ms / 1000).toFixed(1)} s)` : ` — chế độ ${res.mode}, ghế ${res.seat}, thông báo: ${res.toast || info.toast || 'không có'}`))) {
      await page.evaluate(() => window.__KT.pause(false));
      await snap(`LOI-${zone}-${i}`, 0.75, 0.42, 3.2);
      return false;
    }
    const probs = [];
    if (m.d > LIM.d || Math.abs(m.dy) > LIM.dy || m.dyaw > LIM.dyaw) probs.push(`gốc lệch ${m.d.toFixed(3)} m, cao ${m.dy.toFixed(3)} m, hướng ${m.dyaw.toFixed(3)} rad`);
    if (s.kind !== 'piano') {
      const lie = s.kind === 'lounger';
      if (m.gap == null) probs.push('không có mặt ghế dưới hông');
      else if (m.gap < (lie ? -0.12 : -0.08) || m.gap > (lie ? 0.25 : 0.12)) probs.push(`hông cách mặt ghế ${m.gap.toFixed(3)} m`);
      const offRing = m.ring.filter(v => v == null || Math.abs(v) > 0.15).length;
      if (!lie && offRing > 1) probs.push(`hông nằm ở mép ghế (${offRing}/4 điểm quanh hông hụt mặt ngồi: ${m.ring.map(v => v == null ? '—' : v.toFixed(2)).join(', ')})`);
      if (m.up != null && m.up < 0.45) probs.push(`có vật đè ngay trên hông (${m.up.toFixed(2)} m)`);
      if (!lie && m.chest != null && m.chest < 0.12) probs.push(`ngực xuyên vào vật phía trước (${m.chest.toFixed(2)} m)`);
      if (!lie && m.thigh != null && m.thigh < 0.4) probs.push(`đùi xuyên vào vật phía trước (${m.thigh.toFixed(2)} m)`);
      if (!lie && m.knee != null && m.knee < 0.03) probs.push(`đầu gối xuyên mặt dưới bàn (${m.knee.toFixed(2)} m)`);
      if ((s.kind === 'chair' || s.kind === 'stool') && m.deskBack != null && m.deskFront == null) probs.push('bàn ở sau lưng, nhân vật quay lưng vào bàn');
    }
    ok(!probs.length, `${tag}: tư thế đúng chỗ (hông ${m.gap == null ? '—' : m.gap.toFixed(3)} m trên mặt ghế${m.deskFront != null ? ', bàn trước mặt' : ''})` + (probs.length ? ' — ' + probs.join('; ') : ''));
    if (shot || probs.length) {
      await page.evaluate(() => window.__KT.pause(false));
      await snap(`${probs.length ? 'LOI-' : ''}${zone}-${s.kind}-${String(s.floor).replace('.', '_')}-${i}`, 0.75, 0.42, 2.5);
      await snap(`${probs.length ? 'LOI-' : ''}${zone}-${s.kind}-${String(s.floor).replace('.', '_')}-${i}-ben`, 1.57, 0.12, 2.2);
      await page.evaluate(() => window.__KT.pause(true));
    }
    // đứng dậy
    const st = await page.evaluate(async i => {
      const space = World.sp(), s = space.seats[i];
      let toast = null; const off = World.ev.on('toast', t => { toast = t; });
      const okUp = World.standUp(); await window.__KT.sleep(s.kind === 'piano' ? 900 : 300); off();
      const x = World.me.x, z = World.me.z, fl = space.kind === 'campus' ? 0 : space.floorOf(World.me.y + 0.1);
      const free = space.kind === 'campus' ? space.free(x, z) : space.free(x, z, fl);
      return { okUp, toast, mode: World.me.mode, seat: World.me.seat, free, dist: Math.hypot(x - s.x, z - s.z), same: space.kind === 'campus' || Math.abs(fl - space.floorOf(s.y + 0.1)) < 0.3 };
    }, i);
    ok(st.mode === (zone === 'campus' ? 'campus' : 'walk') && st.seat === -1 && st.free && st.same && st.dist > 0.3 && st.dist < 2.2,
      `${tag}: đứng dậy ra chỗ đi được cạnh ghế (${st.dist.toFixed(2)} m, chế độ ${st.mode}${st.toast ? ', ' + st.toast : ''})`);
    return true;
  }

  /* ---------- chọn ghế mẫu ---------- */
  /* mỗi nhóm (loại ghế @ tầng): thứ tự thử trải đều trong nhóm; ghế đang có NPC ngồi thì lấy ghế kế tiếp */
  const pickSamples = async () => page.evaluate(() => {
    const space = World.sp(), groups = {};
    space.seats.forEach((s, i) => { const k = s.kind + '@' + (s.floor || 0); (groups[k] = groups[k] || []).push(i); });
    return Object.entries(groups).map(([k, all]) => {
      const order = [], seen = new Set();
      for (let step = all.length; step >= 1 && order.length < all.length; step = Math.floor(step / 2))
        for (let q = 0; q < all.length; q += step) if (!seen.has(q)) { seen.add(q); order.push(all[q]); }
      if (!seen.has(all.length - 1)) order.splice(1, 0, all[all.length - 1]);
      else { const p = order.indexOf(all[all.length - 1]); order.splice(p, 1); order.splice(Math.min(1, order.length), 0, all[all.length - 1]); }
      return { k, order: [...new Set(order)], total: all.length };
    });
  });

  for (const zone of ZONES) {
    console.log(`\n== Khu ${zone} ==`);
    await page.evaluate(async zone => { window.__KT.pause(true); if (World.me.mode === 'seat' || World.me.mode === 'piano') World.standUp(); if (World.me.zone !== zone) await World.go(zone); await window.__KT.sleep(1200); }, zone);
    const groups = await pickSamples();
    for (const g of groups) {
      const want = Math.min(PER, g.total);
      console.log(`  -- ${g.k}: ${g.total} ghế, thử ${want}`);
      g.done = [];
      for (const i of g.order) {
        if (g.done.length >= want) break;
        const r = await checkSeat(zone, i, zone + ' ' + g.k, 'goSit', !g.done.length);
        if (r === 'busy') { console.log(`        (ghế #${i} đang có NPC ngồi, bỏ qua)`); continue; }
        g.done.push(i);
      }
    }
    // E và bấm chuột: mỗi khu một ghế (không phải đàn)
    const alt = groups.find(g => !/^piano/.test(g.k) && g.done.length);
    if (alt) {
      await checkSeat(zone, alt.done[alt.done.length - 1], zone + ' ' + alt.k, 'E');
      await checkSeat(zone, alt.done[0], zone + ' ' + alt.k, 'click');
    }
    // ghế ở tầng khác: không dịch chuyển
    const other = await page.evaluate(async () => {
      const space = World.sp(); if (World.me.mode === 'seat') World.standUp();
      const myF = space.floorOf(World.me.y + 0.1);
      const i = space.seats.findIndex(s => space.kind === 'room' && Math.abs(space.floorOf(s.y + 0.1) - myF) > 0.5);
      if (i < 0) return null;
      let toast = null; const off = World.ev.on('toast', t => { toast = t; });
      const before = [World.me.x, World.me.y, World.me.z], r = World.goSit(i);
      await window.__KT.sleep(1500); off();
      return { r, toast, moved: Math.hypot(World.me.x - before[0], World.me.y - before[1], World.me.z - before[2]), mode: World.me.mode };
    });
    if (other) ok(!other.r && other.moved < 0.05 && !!other.toast, `${zone}: bấm ghế ở tầng khác không dịch chuyển (thông báo: ${other.toast})`);
  }
  await page.evaluate(() => window.__KT.pause(false));
  ok(!errors.length, 'không có lỗi JavaScript trong trang' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
} finally {
  await browser.close();
  if (srv) srv.kill();
}
console.log(`\n${passed} đạt, ${failed} lỗi. Ảnh chụp: ${OUT}`);
process.exitCode = failed ? 1 : 0;
