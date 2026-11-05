/* =====================================================================
   THẾ GIỚI 3D: nhân vật của bạn & người khác, camera ngôi thứ ba, đi bộ,
   bấm để tới nơi (tìm đường A*), ghế ngồi, đàn piano, bản đồ nhỏ, nhãn tên.
   Chỉ dùng SceneAPI (scene/adapter.js) để chạm vào mô hình 3D.

   Chế độ của bạn (me.mode):
     idle    — màn đăng nhập, camera bay quanh sân
     campus  — đi bộ trên sân thư viện (bộ điều khiển của web)
     walk    — đi bộ trong thư viện (dùng bộ đi bộ của mô hình, camera đặt sau lưng)
     seat    — đang ngồi (ghế, sofa, ghế đá)
     piano   — chế độ đặc biệt do mô hình điều khiển camera (me.special):
               'piano' ngồi đàn tầng 6 · 'scope' kính thiên văn tầng 10 · 'gaze' nằm ngắm sao tầng 10
     observe — chế độ quan sát của ban tổ chức (camera tự do)
   ===================================================================== */
(function () {
  'use strict';
  const ev = U.emitter();
  const V3 = THREE.Vector3;
  const AVK = window.AV2 || null;
  let S = null, labelsEl = null, canvas = null;
  const MAXAV = U.isTouch ? APP.maxAvatars.mobile : APP.maxAvatars.desktop;

  const me = {
    uid: null, style: null, name: '', mssv: '', avatar: null, zone: null, space: null, mode: 'idle',
    seat: -1, seatTs: 0, x: 0, y: 0, z: 0, yaw: 0, speed: 0, vx: 0, vz: 0, floor: 0, place: '', status: 'hoc'
  };
  /* tuỳ chọn hiển thị (lưu trên máy) — chống chóng mặt */
  const opt = Object.assign({ view: 'third', look: 0.55, speed: 1, reduce: false, minimap: !U.isSmall() }, U.store.get('view', {}));
  const others = new Map(), info = new Map();
  let presence = [];
  const cam = { az: 0, el: 0.45, dist: { campus: 7.5, walk: 3.4, seat: 2.4 }, cur: null, ready: false };
  const keys = { f: 0, b: 0, l: 0, r: 0, tl: 0, tr: 0, run: 0 };   // tl/tr: ←/→ xoay góc nhìn
  const joy = { x: 0, y: 0, on: false };
  let idleT = 0, nearB = null, lastSend = 0, wasMoving = false, rain = null, rainOn = false, bubblesOn = true;
  let route = null;     // đường đang tự đi: { pts:[{x,z}], done(), stuck, last }
  let observe = null, going = false, nearThing = null, playMode = false, camHold = null, frozen = false;
  const hooks = { frame: [], pick: [], zone: [], after: [] };       // cho js/games.js (mini-game)
  const bLabels = [];
  const sp = () => S && S.spaces[me.space];
  const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
  const tmp = new V3(), tmp2 = new V3();

  // Chỉ ép góc nhìn tạm thời trong cabin; không sửa lựa chọn đã lưu của người chơi.
  // inLift() kiểm tra vị trí mắt sau bước đi, kể cả khung hình đầu vừa bước vào cabin.
  function liftCameraLocked() {
    const space = sp(), api = space && space.module && space.module.api;
    return !observe && me.mode === 'walk' && space?.kind === 'room' && !!api &&
      (typeof api.inLift === 'function' ? api.inLift() : !!api.rider);
  }
  function effectiveView() { return liftCameraLocked() ? 'first' : opt.view; }
  function syncCameraView(camera) {
    const first = effectiveView() === 'first';
    if (camera) {
      const fov = first ? 70 : 62;
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    }
    if (me.avatar) me.avatar.root.visible = me.mode !== 'piano' && !(me.mode === 'walk' && first);
    return first;
  }
  function applyOpt() {
    window.__LOOK_K = opt.look * (opt.reduce ? 0.75 : 1);
    window.__WALK_K = 0.75 * opt.speed;
    const fov = opt.view === 'first' ? 70 : 62;
    if (S) for (const k in S.spaces) { const c = S.spaces[k].camera; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }
    syncCameraView(sp()?.camera);
  }

  /* ------------------------------------------------------------------
     KHỞI TẠO
     ------------------------------------------------------------------ */
  function init(scene) {
    S = scene; canvas = S.renderer.domElement;
    labelsEl = document.getElementById('labels');
    const c = S.spaces.campus;
    me.x = c.spawn.x; me.z = c.spawn.z; me.yaw = c.spawn.yaw;
    for (const b of S.buildings) {
      const el = U.h('button.po-blabel', { type: 'button', onclick: () => ev.emit('building-click', b.id) },
        U.h('b', { text: b.name }), U.h('span', { text: '0 người' }));
      labelsEl.appendChild(el); bLabels.push({ b, el, cnt: el.querySelector('span') });
    }
    window.__POTA = true;
    applyOpt();
    S.onFrame(frame);
    S.afterFrame(afterFrame);
    S.on('exit-library', () => { if (me.mode === 'walk') go('campus', { from: 'library' }); });
    S.on('space-changed', id => {            // đi thang máy giữa tầng 1–4 (A) và tầng 6–7 (B)
      if (me.mode !== 'walk') return;
      const z = Object.keys(ZONES).find(k => ZONES[k].space === id);
      if (!z || z === me.zone) return;
      clearOthers(); route = null;
      me.zone = z; me.space = id; S.spaces[id].group.add(me.avatar.root);
      applyOpt(); Mini.reset();
      ev.emit('zone-changed', z); syncOthers(); Npc.sync();
    });
    bindInput(); buildSeatHint(); buildRain(); buildLife();
  }
  function avatarFor(style, o) {
    if (AVK) {
      let st = style && style.equipped ? style : null;
      if (!st && o.uid) st = AVK.randomState(AVK.seeded(o.uid));     // người dùng bản cũ: nhân vật cố định theo mã
      return new AVK.Avatar(st, o);
    }
    return new AV.Avatar(style, o);
  }
  function ensureMe() {
    if (!me.avatar) me.avatar = avatarFor(me.style, { me: true, uid: me.uid, name: me.name, mssv: me.mssv });
    return me.avatar;
  }

  /* ------------------------------------------------------------------
     VÀO / RA KHU VỰC
     opts: { from:'library' } ra sân từ cửa · { entrance:true } bước vào cửa thư viện · { seat } ngồi ghế
     ------------------------------------------------------------------ */
  async function go(zone, opts = {}) {
    const Z = ZONES[zone]; if (!Z || observe) return;
    const id = Z.space, space = S.spaces[id];
    const prevZone = me.zone;
    route = null; clearOthers(); Npc.clear();
    going = true;
    try { await S.enter(id, opts.text || (id === 'campus' ? 'Ra sân thư viện…' : 'Đang vào ' + Z.name + '…'), opts.arrive); } finally { going = false; }
    me.zone = zone; me.space = id; me.speed = 0;
    const av = ensureMe(); av.root.visible = true; av.setSit(false);
    space.group.add(av.root);
    applyOpt(); Mini.reset(); cam.cur = null; cam.ready = false;
    if (id === 'campus') {
      const b = opts.from && S.buildings.find(x => x.id === opts.from);
      const p = b ? b.out : space.spawn;
      me.x = p.x; me.z = p.z; me.y = space.floorAt(p.x, p.z); me.yaw = p.yaw; me.seat = -1;
      setMode('campus');
      cam.az = me.yaw + Math.PI + (b ? 0.35 : 0); cam.el = b ? 0.5 : 0.42;
    } else if (opts.entrance) {
      me.seat = -1;
      const e = space.lift || { x: 0, z: 12.0, yaw: 0 };  // tầng 1: sảnh, ngay sau cửa (trước quầy lễ tân tròn) · tầng 10: cửa thang máy
      space.walkNow(e.x, 0, e.z, e.yaw);
      me.x = e.x; me.y = 0; me.z = e.z; me.yaw = Math.PI - e.yaw;
      setMode('walk');
    } else if (opts.arrive) {                              // ra khỏi thang máy ở một tầng
      const c = space.camera.position;
      me.x = c.x; me.z = c.z; me.y = c.y - 1.6; me.seat = -1;
      setMode('walk');
    } else if (opts.at) {                                  // tới gần một người / một chỗ
      me.seat = -1; placeNear(space, opts.at);
    } else if (prevZone && opts.seat == null) {
      // Cửa/thang máy đưa người chơi tới lối vào, không tự chọn ghế ở tầng khác.
      placeNear(space, space.lift || { x: 0, y: 0, z: 12 });
    } else {
      const seat = opts.seat != null ? opts.seat : pickSeat(space, prevZone === zone ? me.seat : U.store.get('seat:' + zone, -1));
      if (!sitAt(seat, true)) placeNear(space, space.lift || { x: 0, y: 0, z: 12 });
    }
    ev.emit('zone-changed', zone);
    Npc.sync(); for (const f of hooks.zone) f(zone);
    syncOthers();
  }
  function setMode(m) {
    if (me.mode === m) return;
    me.mode = m;
    syncCameraView(sp()?.camera);
    ev.emit('mode-changed', m);
  }

  /* ------------------------------------------------------------------
     GHẾ
     ------------------------------------------------------------------ */
  function occupiedSeats() {
    const s = new Map();
    for (const p of presence) if (p.uid !== me.uid && p.zone === me.zone && p.seat >= 0) s.set(p.seat, p);
    // Dành chỗ cho NPC kể cả trước lần sync đầu tiên (lúc vừa vào khu).
    for (const n of Npc.reservedSeats()) s.set(n.seat, { npc: n.id });
    return s;
  }
  /* ngồi vào ghế trống gần nhất trên cùng tầng */
  function sitNearest() {
    const space = sp(); if (!space) return false;
    const occ = occupiedSeats(); let best = -1, bd = 1e9;
    space.seats.forEach((s, i) => { if (occ.has(i) || s.kind === 'piano' || space.floorOf(s.y + 0.1) !== space.floorOf(me.y + 0.1)) return; const d = Math.hypot(s.x - me.x, s.z - me.z); if (d < bd) { bd = d; best = i; } });
    return best >= 0 && goSit(best);
  }

  /* ------------------------------------------------------------------
     ĐẾN CHỖ MỘT NGƯỜI / MỘT ĐIỂM
     ------------------------------------------------------------------ */
  /* chỗ trống cách điểm (x,z) khoảng 1–2 m, ưu tiên phía mình đang đứng */
  function spotNear(space, fl, x, z) {
    const free = (a, b) => space.kind === 'campus' ? space.free(a, b) && Math.abs(space.floorAt(a, b) - space.floorAt(x, z)) < 0.5 : space.free(a, b, fl);
    const a0 = Math.atan2(me.x - x, me.z - z);
    for (const r of [1.1, 1.6, 2.3]) for (let k = 0; k < 8; k++) {
      const a = a0 + Math.ceil(k / 2) * (k % 2 ? 1 : -1) * Math.PI / 4, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
      if (free(px, pz)) return { x: px, z: pz };
    }
    const g = space.grid(fl), n = g.nearest(x, z, 5);
    return n ? { x: g.cx(n[0]), z: g.cz(n[1]) } : null;
  }
  /* đặt mình đứng ngay cạnh điểm at {x,y,z} (dịch chuyển, không đi bộ) */
  function placeNear(space, at) {
    const fl = space.kind === 'campus' ? 0 : space.floorOf(at.y + 0.1);
    const p = spotNear(space, fl, at.x, at.z) || { x: at.x, z: at.z };
    const face = Math.atan2(at.x - p.x, at.z - p.z);       // quay mặt về phía người đó
    route = null; me.avatar.setSit(false); me.seat = -1; cam.ready = false; cam.cur = null;
    if (space.kind === 'campus') { me.x = p.x; me.z = p.z; me.y = space.floorAt(p.x, p.z); me.yaw = face; cam.az = face + Math.PI; setMode('campus'); }
    else { space.walkNow(p.x, fl, p.z, Math.PI - face); me.x = p.x; me.z = p.z; me.y = fl; me.yaw = face; setMode('walk'); }
    ev.emit('seat-changed', -1); sendRest();
  }
  /* tới gần bạn bằng đường đi bộ; tầng/khu khác phải đi qua cửa và thang máy */
  async function goNear(zone, at) {
    if (observe || !ZONES[zone] || !at) return false;
    if (zone !== me.zone) { ev.emit('toast', 'Bạn ấy ở ' + ZONES[zone].name + '. Hãy đi qua cửa hoặc thang máy để tới đó.'); return false; }
    const space = sp();
    if (me.mode === 'seat' || me.mode === 'piano') standUp();
    const fl = space.kind === 'campus' ? 0 : space.floorOf(at.y + 0.1);
    const p = spotNear(space, fl, at.x, at.z);
    if (Math.abs(fl - space.floorOf(me.y + 0.1)) > 0.5) { ev.emit('toast', 'Bạn ấy ở tầng khác. Hãy dùng cầu thang hoặc thang máy.'); return false; }
    return !!p && walkTo(p.x, p.z, null, 0.35);
  }
  /* vị trí hiện tại của một người (đang ngồi thì lấy chỗ ghế) */
  function whereIs(uid) {
    const p = presence.find(x => x.uid === uid); if (!p) return null;
    const space = S.spaces[(ZONES[p.zone] || {}).space]; if (!space) return null;
    if (p.seat >= 0 && space.seats[p.seat]) { const s = space.seats[p.seat]; return { zone: p.zone, x: s.x, y: s.y, z: s.z }; }
    const o = others.get(uid);
    if (o && o.init && p.zone === me.zone) return { zone: p.zone, x: o.x, y: o.y, z: o.z };
    if (p.p) return { zone: p.zone, x: p.p[0], y: p.p[3] || 0, z: p.p[1] };
    return null;
  }
  /* tin "Gần tôi": người gửi đứng trong bán kính và cùng tầng */
  function isNear(n, R) {
    if (!n) return true;
    R = R || (window.DEFAULT_SETTINGS && DEFAULT_SETTINGS.near_radius) || 8;
    return Math.hypot(n.x - me.x, n.z - me.z) <= R && Math.abs((n.y || 0) - me.y) < 2.6;
  }
  function pickSeat(space, prefer) {
    const occ = occupiedSeats(), n = space.seats.length;
    if (prefer >= 0 && prefer < n && !occ.has(prefer) && space.seats[prefer].kind !== 'piano') return prefer;
    let free = []; for (let i = 0; i < n; i++) if (!occ.has(i) && space.seats[i].kind !== 'piano' && space.seats[i].kind !== 'bench') free.push(i);
    if (!free.length) for (let i = 0; i < n; i++) if (!occ.has(i)) free.push(i);
    if (!free.length) return -1;
    const in401 = free.filter(i => space.seats[i].room === '401');
    if (in401.length > 4) free = in401;                   // mặc định: phòng tự học 401
    if (!occ.size) return free[Math.floor(Math.random() * free.length)];
    const taken = [...occ.keys()].map(i => space.seats[i]).filter(Boolean);
    const score = i => { const s = space.seats[i]; let d = 1e9; for (const t of taken) d = Math.min(d, Math.hypot(s.x - t.x, s.z - t.z) + Math.abs(s.y - t.y) * 4); return Math.abs(d - 2.2) + Math.random() * 1.5; };
    free.sort((a, b) => score(a) - score(b));
    return free[0];
  }
  function placeSeated(av, s) {
    av.root.position.set(s.x, s.y, s.z);
    av.root.rotation.y = s.ry;
    av.setSit(true, s.kind === 'chair', s.kind);
  }
  /* ngồi xuống ghế idx của khu hiện tại */
  function sitAt(idx, instant) {
    const space = sp(), s = space && space.seats[idx]; if (!s) return false;
    // Ghế có thể vừa được người khác chọn trong lúc mình đang đi tới.
    if (occupiedSeats().has(idx)) { ev.emit('toast', 'Ghế này vừa có bạn ngồi. Hãy chọn ghế trống khác.'); return false; }
    route = null;
    if (space.kind === 'room') space.stopWalk();
    me.seat = idx; me.seatTs = Date.now();
    if (s.kind !== 'piano') U.store.set('seat:' + me.zone, idx);
    me.x = s.x; me.y = s.y; me.z = s.z; me.yaw = s.ry; me.speed = 0;
    placeSeated(me.avatar, s);
    if (s.kind === 'piano') { me.special = 'piano'; setMode('piano'); space.sitPiano(); }
    else {
      setMode('seat');
      cam.az = s.ry + Math.PI + 0.35; cam.el = 0.62; cam.cur = null; cam.ready = !instant ? cam.ready : false;
    }
    sendRest(); updatePlace();
    ev.emit('seat-changed', idx);
    return true;
  }
  // Cả điểm tiếp cận và điểm đứng dậy đều phải nằm trên lối đi thật.
  // Thử nhiều hướng: ghế quanh bàn thường chỉ tới được từ sau lưng/hai bên.
  function seatSpots(space, s) {
    const fl = s.floor != null ? s.floor : space.floorOf(s.y + 0.1), out = [];
    const fx = Math.sin(s.ry), fz = Math.cos(s.ry);
    for (const r of [0.65, 0.9, 1.2, 1.5, 1.8]) for (const [a, b] of [[-1, 0], [0, 1], [0, -1], [1, 0], [-0.707, 0.707], [-0.707, -0.707], [0.707, 0.707], [0.707, -0.707]]) {
      const x = s.x + r * (fx * a + fz * b), z = s.z + r * (fz * a - fx * b);
      const free = space.kind === 'campus' ? space.free(x, z, 0.22) && Math.abs(space.floorAt(x, z) - s.y) < 0.65 : space.free(x, z, fl);
      if (free) out.push({ x, z, dx: x - s.x, dz: z - s.z, floor: fl });
    }
    return out;
  }
  /* đứng dậy: tìm chỗ trống cạnh ghế (sau lưng, hai bên, phía trước) */
  function standUp() {
    const space = sp(); if (!space || (me.mode !== 'seat' && me.mode !== 'piano')) return false;
    if (me.mode === 'piano' && me.special !== 'piano') { space.leave(); return false; }   // rời kính / thôi nằm ngắm sao
    const s = space.seats[me.seat] || { x: me.x, y: me.y, z: me.z, ry: me.yaw };
    const fl = s.floor != null ? s.floor : space.floorOf(s.y + 0.1), spot = seatSpots(space, s)[0];
    if (!spot) { ev.emit('toast', 'Chưa tìm được lối đứng cạnh ghế.'); return false; }
    route = null; me.seat = -1; me.special = null; me.avatar.setSit(false);
    const yawFace = Math.atan2(spot.dx, spot.dz);          // quay lưng khỏi ghế
    if (space.kind === 'campus') {
      me.x = spot.x; me.z = spot.z; me.y = space.floorAt(spot.x, spot.z); me.yaw = yawFace;
      setMode('campus'); cam.az = yawFace + Math.PI;
    } else {
      space.stopWalk();                                     // rời đàn: mô hình tự đóng bàn phím đàn
      space.walkNow(spot.x, fl, spot.z, Math.atan2(spot.dx, -spot.dz));
      me.x = spot.x; me.z = spot.z; me.y = fl; me.yaw = yawFace;
      setMode('walk');
    }
    me.vx = me.vz = me.speed = 0;
    sendRest(); updatePlace(); ev.emit('seat-changed', -1);
    return true;
  }
  /* bấm vào một ghế: đứng dậy (nếu đang ngồi), đi tới rồi ngồi */
  function goSit(idx) {
    const space = sp(), s = space && space.seats[idx]; if (!s) return false;
    if (occupiedSeats().has(idx)) { ev.emit('toast', 'Ghế này có bạn ngồi rồi.'); return false; }
    if (idx === me.seat) return false;
    if ((me.mode === 'seat' || me.mode === 'piano') && !standUp()) return false;
    const fl = space.floorOf(s.y + 0.1);
    if (Math.abs(fl - space.floorOf(me.y + 0.1)) > 0.5) { ev.emit('toast', 'Ghế ở tầng khác. Hãy đi cầu thang hoặc thang máy tới tầng đó.'); return false; }
    const g = space.grid(fl), zone = me.zone;
    for (const ap of seatSpots(space, s)) {
      const pts = g && g.path(me.x, me.z, ap.x, ap.z);
      if (!pts) continue;
      const end = pts[pts.length - 1] || { x: me.x, z: me.z };
      if (Math.hypot(end.x - ap.x, end.z - ap.z) > 0.45) continue;
      const done = () => { if (me.zone === zone && sp() === space) sitAt(idx); };
      if (!pts.length || Math.hypot(me.x - ap.x, me.z - ap.z) < 0.35) done();
      else { route = { pts, done, near: 0.25, stuck: 0, lx: me.x, lz: me.z }; showMarker(ap.x, me.y, ap.z); }
      return true;
    }
    ev.emit('toast', 'Không tìm được lối tới ghế. Hãy đi gần hơn hoặc chọn ghế khác.');
    return false;
  }
  function changeSeat(idx) {
    const space = sp(); if (!space) return false;
    if (idx == null) return sitNearest();
    return goSit(idx);
  }

  /* ---- ghế trống gần mình: nhấn E (hoặc F) để ngồi; trên màn hình hiện "E · Ngồi" ngay trên ghế (chạm vào cũng ngồi).
     Phát sự kiện 'near-seat' (chỉ số ghế | null) để giao diện hiện gợi ý nếu muốn. ---- */
  let nearSeat = -1, nearT = 0, seatHint = null;
  const SIT_WORD = { lounger: 'Nằm', piano: 'Chơi đàn' };
  function findNearSeat() {
    const space = sp(); if (!space || !space.seats.length || !(me.mode === 'campus' || me.mode === 'walk') || route || going || observe || frozen || camHold) return -1;
    const occ = occupiedSeats(), fx = Math.sin(me.yaw), fz = Math.cos(me.yaw);
    let best = -1, bs = 1e9;
    space.seats.forEach((s, i) => {
      if (occ.has(i) || s.kind === 'piano') return;                       // đàn: dùng nút/E của đàn
      const dx = s.x - me.x, dz = s.z - me.z, d = Math.hypot(dx, dz);
      if (d > 1.5 || Math.abs(s.y - me.y) > 0.9) return;
      const score = d - 0.35 * (dx * fx + dz * fz) / Math.max(d, 1e-3);    // ưu tiên ghế phía trước mặt
      if (score < bs) { bs = score; best = i; }
    });
    return best;
  }
  function nearSeatFrame(dt, camera) {
    nearT -= dt;
    if (nearT <= 0) {
      nearT = 0.2;
      const n = findNearSeat();
      if (n !== nearSeat) { nearSeat = n; ev.emit('near-seat', n >= 0 ? n : null); }
    }
    if (!seatHint) return;
    const space = sp(), s = nearSeat >= 0 && space && space.seats[nearSeat];
    if (!s) { seatHint.style.display = 'none'; return; }
    tmp.set(s.x, s.y + 1.05, s.z); space.group.localToWorld(tmp); tmp.project(camera);
    if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) { seatHint.style.display = 'none'; return; }
    const W = labelsEl.clientWidth, Hh = labelsEl.clientHeight, word = SIT_WORD[s.kind] || 'Ngồi';
    if (seatHint.dataset.w !== word) { seatHint.dataset.w = word; seatHint.lastChild.textContent = word; }
    seatHint.style.display = '';
    seatHint.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px,${((1 - tmp.y) / 2 * Hh).toFixed(1)}px) translate(-50%,-100%)`;
  }
  function buildSeatHint() {
    document.head.appendChild(U.h('style', { text:
      '.po-seat-hint{position:absolute;left:0;top:0;display:flex;align-items:center;gap:6px;pointer-events:auto;cursor:pointer;border:0;' +
      'border-radius:999px;padding:4px 11px 4px 5px;background:rgba(18,22,34,.84);color:#fff;font:600 13px/1.2 inherit;' +
      'box-shadow:0 3px 10px rgba(0,0,0,.25);white-space:nowrap;will-change:transform;z-index:2}' +
      '.po-seat-hint kbd{font:700 12px/1 inherit;background:#fff;color:#1d2433;border-radius:6px;padding:4px 7px;box-shadow:inset 0 -2px 0 #c9cfdb}' +
      '.po-seat-hint:hover{background:rgba(34,140,84,.95)}' }));
    seatHint = U.h('button.po-seat-hint', { type: 'button', title: U.isTouch ? 'Chạm để ngồi' : 'Nhấn E để ngồi', onclick: e => { e.stopPropagation(); if (nearSeat >= 0) goSit(nearSeat); } },
      U.h('kbd', { text: U.isTouch ? '🪑' : 'E' }), U.h('span', { text: 'Ngồi' }));
    seatHint.style.display = 'none';
    labelsEl.appendChild(seatHint);
  }
  /* phím E / F theo ngữ cảnh: đứng gần ghế → ngồi; đang ngồi → đứng dậy; gần đàn / kính thiên văn → dùng */
  function useKey(e) {
    if (observe || going || frozen || me.mode === 'idle') return;
    if (me.mode === 'piano') { if (me.special && me.special !== 'piano') standUp(); return; }   // khi chơi đàn, E là một nốt nhạc
    if (me.mode === 'seat') { standUp(); return; }
    if (!(me.mode === 'campus' || me.mode === 'walk')) return;
    const space = sp(); if (!space) return;
    if (space.kind === 'room' && space.module.api.getMode() === 'piano') return;   // mô hình vừa cho ngồi đàn (E cạnh đàn)
    const n = findNearSeat();
    if (n >= 0) { goSit(n); return; }
    if (nearThing === 'piano') { const i = space.seats.findIndex(x => x.kind === 'piano'); if (i >= 0) goSit(i); return; }
    if (nearThing === 'scope' && space.scope) { route = null; me.special = 'scope'; setMode('piano'); space.scope(); }
  }

  /* ------------------------------------------------------------------
     TỰ ĐI TỚI MỘT ĐIỂM (A* trên lưới của mặt sàn hiện tại)
     ------------------------------------------------------------------ */
  function walkTo(x, z, done, near = 0.3) {
    const space = sp(); if (!space) return false;
    if (me.mode === 'seat') standUp();
    if (me.mode !== 'campus' && me.mode !== 'walk') return false;
    const g = space.grid(space.floorOf(me.y + 0.1));
    const pts = g && g.path(me.x, me.z, x, z);
    if (pts && !pts.length && Math.hypot(x - me.x, z - me.z) <= near + 0.1) { route = null; if (done) done(); return true; }
    if (!pts || !pts.length) { ev.emit('toast', 'Không tìm được lối tới chỗ đó.'); return false; }
    route = { pts, done, near, stuck: 0, lx: me.x, lz: me.z };
    showMarker(pts[pts.length - 1].x, me.y, pts[pts.length - 1].z);
    return true;
  }
  /* bị vướng giữa đường: tìm lại đường một lần từ chỗ đang đứng; vẫn vướng thì báo cho người chơi (không dịch chuyển) */
  function routeStuck() {
    const space = sp(), g0 = route.goal;
    if (!route.replanned && space && g0) {
      const g = space.grid(space.kind === 'campus' ? 0 : space.floorOf(me.y + 0.1)), pts = g && g.path(me.x, me.z, g0.x, g0.z);
      const end = pts && (pts[pts.length - 1] || { x: me.x, z: me.z });
      // Grid.path có thể thay đích bị chặn bằng ô gần đó. Chỉ tiếp tục khi vẫn
      // tới sát đích cũ; nếu không, callback ngồi ghế sẽ kéo người xuyên vật cản.
      if (end && Math.hypot(end.x - g0.x, end.z - g0.z) <= 0.45) {
        if (!pts.length) { const done = route.done; route = null; if (done) done(); return null; }
        route.pts = pts; route.replanned = true; route.stuck = 0; return null;
      }
    }
    route = null;
    ev.emit('toast', 'Bị vướng đường nên chưa tới được chỗ đó. Hãy đi gần hơn rồi thử lại.');
    return null;
  }
  /* trả về hướng cần đi (đơn vị) hoặc null khi đã tới */
  function followRoute(dt) {
    if (!route) return null;
    if (!route.goal && route.pts.length) route.goal = route.pts[route.pts.length - 1];
    let t = route.pts[0];
    // Điểm giữa đường chỉ coi là tới khi thật sát (0,2 m): bỏ điểm sớm ở góc bàn/hàng ghế
    // làm đoạn kế tiếp cắt qua góc vật cản và nhân vật kẹt lại ở đó.
    while (t && Math.hypot(t.x - me.x, t.z - me.z) < (route.pts.length === 1 ? route.near : 0.2)) { route.pts.shift(); t = route.pts[0]; }
    if (!t) { const d = route.done; route = null; d && d(); return null; }
    const moved = Math.hypot(me.x - route.lx, me.z - route.lz); route.lx = me.x; route.lz = me.z;
    if (moved < 0.2 * dt) { if ((route.stuck += dt) > 1.6) return routeStuck(); } else route.stuck = 0;
    const dx = t.x - me.x, dz = t.z - me.z, l = Math.hypot(dx, dz);
    return { x: dx / l, z: dz / l };
  }

  /* ------------------------------------------------------------------
     NGƯỜI KHÁC
     ------------------------------------------------------------------ */
  function clearOthers() {
    for (const o of others.values()) { o.av.dispose(); o.label.remove(); }
    others.clear();
  }
  function setPresence(list) {
    presence = list;
    syncOthers();
    // trùng ghế: ai nhận ghế trước thì giữ, người sau tự đổi
    if (me.seat >= 0 && (me.mode === 'seat' || me.mode === 'piano')) {
      const clash = list.find(p => p.uid !== me.uid && p.zone === me.zone && p.seat === me.seat && ((p.sts || 0) < me.seatTs || ((p.sts || 0) === me.seatTs && p.uid < me.uid)));
      if (clash) { standUp(); ev.emit('toast', 'Ghế vừa có bạn khác ngồi trước. Hãy chọn ghế trống khác.'); }
    }
    const cnt = {};
    for (const p of list) { const z = ZONES[p.zone]; if (z && z.building) cnt[z.building] = (cnt[z.building] || 0) + 1; }
    for (const l of bLabels) { const n = cnt[l.b.id] || 0; l.cnt.textContent = n + ' người'; l.el.classList.toggle('busy', n > 0); }
    return cnt;
  }
  function syncOthers() {
    if (!me.zone || !S) return;
    const space = sp(); if (!space) return;
    const want = new Set();
    for (const p of presence) {
      if (p.uid === me.uid || p.zone !== me.zone) continue;
      if (info.get(p.uid) && info.get(p.uid).hidden) continue;
      want.add(p.uid);
      let o = others.get(p.uid);
      const sk = JSON.stringify(p.sty || {});
      if (!o) {
        const i = info.get(p.uid) || {};
        o = { uid: p.uid, av: avatarFor(p.sty, { uid: p.uid, name: i.name, mssv: i.mssv }), x: 0, y: 0, z: 0, yaw: 0, px: 0, pz: 0, vx: 0, vz: 0, pt: 0, ty: 0, tyaw: 0, seat: -2, speed: 0, init: false, label: makeLabel(p.uid), styKey: sk };
        space.group.add(o.av.root);
        others.set(p.uid, o);
      } else if (sk !== o.styKey) { o.styKey = sk; o.av.setStyle(p.sty && p.sty.equipped ? p.sty : (AVK ? AVK.randomState(AVK.seeded(p.uid)) : p.sty)); }
      o.status = p.st; o.via = p.via === U.hanoiDay();
      if (o.av.setHeld) o.av.setHeld(p.cup && p.cup.u > Date.now() ? p.cup.k : null);
      if (p.seat >= 0 && space.seats[p.seat]) {
        if (o.seat !== p.seat) { const s = space.seats[p.seat]; placeSeated(o.av, s); o.seat = p.seat; o.x = s.x; o.y = s.y; o.z = s.z; }
      } else {
        if (o.seat >= 0 || o.seat === -2) { o.av.setSit(false); o.seat = -1; }
        if (p.p && (!o.init || !o.movingRecently)) { o.px = p.p[0]; o.pz = p.p[1]; o.tyaw = p.p[2] || 0; o.ty = p.p[3] || 0; o.vx = o.vz = 0; o.pt = performance.now(); if (!o.init) { o.x = o.px; o.z = o.pz; o.y = o.ty; o.yaw = o.tyaw; o.init = true; } }
      }
      updateLabel(o);
    }
    for (const [uid, o] of others) if (!want.has(uid)) { o.av.dispose(); o.label.remove(); others.delete(uid); }
  }
  /* vị trí người khác: nhận vị trí + vận tốc thưa (≈1 lần/giây), giữa hai lần thì tự ngoại suy */
  function onPos(m) {
    const o = others.get(m.u); if (!o || o.seat >= 0) return;
    o.px = m.x; o.pz = m.z; o.ty = m.y || 0; o.tyaw = m.r; o.vx = m.s ? (m.vx || 0) : 0; o.vz = m.s ? (m.vz || 0) : 0;
    o.pt = performance.now(); o.movingRecently = !!m.s;
    if (!o.init) { o.x = o.px; o.z = o.pz; o.y = o.ty; o.yaw = o.tyaw; o.init = true; }
  }

  /* ------------------------------------------------------------------
     NHÃN TÊN & BONG BÓNG
     ------------------------------------------------------------------ */
  const STATUS_ICON = { nghi: '☕', tap_trung: '🎯', quiz: '📝', treo: '💤', piano: '🎹', scope: '🔭', gaze: '✨', choi: '🌳' };
  function makeLabel(uid) {
    // [bong bóng] nhiều bong bóng xếp chồng (mới nhất ở dưới, sát tên) — xem bubble()
    const el = U.h('div.po-tag', null, U.h('div.po-bubbles', { 'aria-live': 'polite' }), U.h('div.po-name'));
    el.addEventListener('click', () => ev.emit('avatar-click', uid));
    labelsEl.appendChild(el); return el;
  }
  function updateLabel(o) {
    const i = info.get(o.uid) || {};
    const nm = o.label.querySelector('.po-name');
    const st = STATUS_ICON[o.status] ? STATUS_ICON[o.status] + ' ' : '';
    const ac = actIcon(o.uid);
    const txt = st + (i.name || '…') + (o.via ? ' ✨' : '') + (i.stars ? ' · ⭐' + i.stars : '') + (ac ? ' ' + ac : '');
    if (nm.textContent !== txt) nm.textContent = txt;
    if (i.name && o.av.setCard) o.av.setCard(i.name, i.mssv || '');
  }
  function setInfo(uid, data) {
    info.set(uid, Object.assign(info.get(uid) || {}, data));
    const o = others.get(uid); if (o) updateLabel(o);
    if (uid === me.uid) updateMyLabel();
    if (data.hidden) syncOthers();
  }
  let myLabel = null;
  function updateMyLabel() {
    if (!myLabel) { myLabel = makeLabel(me.uid); myLabel.classList.add('me'); }
    const i = info.get(me.uid) || {};
    const st = me.mode === 'piano' ? me.special : me.status;
    const ac = actIcon(me.uid);
    myLabel.querySelector('.po-name').textContent = (STATUS_ICON[st] ? STATUS_ICON[st] + ' ' : '') + (i.name || me.name) + (U.store.get('via:day', '') === U.hanoiDay() ? ' ✨' : '') + (i.stars ? ' · ⭐' + i.stars : '') + (ac ? ' ' + ac : '');
  }
  /* ---- [act] hoạt động kéo dài: đọc sách / bấm điện thoại / dùng laptop ----
     acts: uid → { k: 'doc'|'dien-thoai'|'laptop'|null, t: thời điểm người đó chọn (đồng hồ máy người đó) }
     Tin cũ hơn (t nhỏ hơn) bị bỏ qua, nên tin phát ngay (broadcast) và tin hiện diện (presence, chậm ≤ 8 giây) không giẫm lên nhau. */
  const acts = new Map();
  const actIcon = uid => { const a = acts.get(uid), A2 = AVK && AVK.ACTS; return a && a.k && A2 && A2[a.k] ? A2[a.k].icon : ''; };
  let actGrace = 0, actMode = null;          // actGrace: mốc thời gian (ms) — đổi tư thế ngồi/đứng không tính là "đi" 
  function pruneActs(list) {
    const present = new Set(list.map(p => p.uid));
    for (const uid of acts.keys()) if (uid !== me.uid && !present.has(uid)) acts.delete(uid);
  }
  function setAct(uid, kind, t) {
    if (!uid || (kind && !(AVK && AVK.ACTS && Object.prototype.hasOwnProperty.call(AVK.ACTS, kind)))) return false;
    kind = kind || null;
    const cur = acts.get(uid);
    if (uid === me.uid) {
      if (kind && (me.mode === 'idle' || me.mode === 'piano' || observe)) return false;
      if ((cur ? cur.k : null) === kind) return true;
      t = Math.max(Date.now(), cur ? cur.t + 1 : 0); acts.set(uid, { k: kind, t });
      me.act = kind; actMode = me.mode; actGrace = performance.now() + 400;
      if (me.avatar && me.avatar.setAct) me.avatar.setAct(kind);
      if (kind) { const A2 = AVK.ACTS[kind]; bubble(uid, A2.icon, false, 1500); }
      updateMyLabel(); ev.emit('act', { k: kind, t });
      return true;
    }
    t = +t;
    if (!Number.isFinite(t) || t < 0) return false;
    if (cur && cur.t > t) return false;                    // tin cũ đến muộn
    if (cur && cur.t === t && cur.k === kind) return true;
    acts.set(uid, { k: kind, t });
    const o = others.get(uid);
    if (o) { if (o.av.setAct) o.av.setAct(kind); updateLabel(o); }
    return true;
  }
  /* mình đi (phím, cần điều khiển, bấm để tới) → dừng hoạt động; vào đàn / quan sát cũng dừng */
  function actFrame() {
    if (!me.act) return;
    const now = performance.now();
    if (me.mode !== actMode) { actMode = me.mode; actGrace = now + 400; }
    if (me.mode === 'piano' || me.mode === 'idle' || observe) { setAct(me.uid, null); return; }
    if (now < actGrace) return;
    if (me.speed > 0.6 || route) setAct(me.uid, null);
  }
  hooks.frame.push(actFrame);
  function avOf(uid) { return uid === me.uid ? me.avatar : (others.get(uid) || {}).av; }
  /* người đang nói: các bạn đứng gần quay đầu nhìn về phía người đó vài giây */
  function turnHeads(uid) {
    const sp0 = avOf(uid); if (!sp0 || !sp0.root.parent) return;
    const p = sp0.root.getWorldPosition(new V3()); p.y += sp0.sit ? 1.25 : 1.65;
    const list = [...others.values()].map(o => o.av).concat(me.avatar ? [me.avatar] : []);
    for (const av of list) { if (av === sp0 || !av.lookAt || !av.root.visible) continue; const q = av.root.getWorldPosition(tmp2); if (q.distanceTo(p) < 7) av.lookAt(p, 3); }
  }
  /* cử chỉ (vẫy tay, cổ vũ…): của mình thì phát và báo cho mọi người; của người khác thì phát lại */
  let lastEmote = 0;
  function emote(uid, kind) {
    const av = avOf(uid), E = AVK && AVK.EMOTES[kind]; if (!av || !E || !av.playEmote) return false;
    if (uid === me.uid) {
      if (me.mode === 'piano' || me.mode === 'idle') return false;
      if (performance.now() - lastEmote < 2500) return false; lastEmote = performance.now();
      ev.emit('emote', kind);
    }
    av.playEmote(kind); bubble(uid, E.icon, false, 1800);
    return true;
  }
  /* bong bóng trên đầu: tin chat (ms bỏ trống → 5–7,5 giây tuỳ độ dài) hoặc biểu tượng cử chỉ (ms ngắn).
     Tối đa 2 bong bóng chồng nhau, cái cũ thu nhỏ & mờ đi; hết giờ thì mờ dần rồi biến mất. */
  function clearBubbles(messageId) {
    if (!labelsEl) return;
    for (const b of labelsEl.querySelectorAll('.po-bubbles .po-bubble')) {
      if (messageId != null && b.dataset.messageId !== String(messageId)) continue;
      const box = b.parentElement, label = box.parentElement;
      clearTimeout(b._fadeTimer); clearTimeout(b._removeTimer); b.remove();
      if (!box.children.length) label.classList.remove('talk');
    }
  }
  function bubble(uid, text, mention, ms, messageId) {
    if (!bubblesOn && uid !== me.uid) return;
    if (!ms) turnHeads(uid);
    const el = uid === me.uid ? (updateMyLabel(), myLabel) : (others.get(uid) || {}).label;
    if (!el) return;
    const box = el.querySelector('.po-bubbles'); if (!box) return;
    const icon = !!ms && String(text).length <= 4;
    const life = ms || U.clamp(4000 + String(text).length * 45, 5000, 7500);
    const b = U.h('div.po-bubble' + (mention ? '.mention' : '') + (icon ? '.icon' : ''), messageId == null ? null : { 'data-message-id': String(messageId) }, U.h('span', { text: String(text) }));
    if (icon) for (const x of [...box.children]) if (x.classList.contains('icon')) x.remove();   // cử chỉ mới thay cử chỉ cũ
    for (const x of box.children) x.classList.add('old');
    box.append(b);
    while (box.children.length > 2) box.firstElementChild.remove();
    el.classList.add('talk');
    const gone = () => { b.remove(); if (!box.children.length) el.classList.remove('talk'); };
    b._fadeTimer = setTimeout(() => { b.classList.add('out'); b._removeTimer = setTimeout(gone, 450); }, life);
  }

  /* ------------------------------------------------------------------
     ĐẦU VÀO
     ------------------------------------------------------------------ */
  /* Phím: W/S/↑/↓ đi tới/lùi, A/D đi ngang (theo hướng camera), ←/→ xoay góc nhìn (như Roblox — dùng được cả khi
     bàn di chuột laptop bị khoá lúc đang giữ phím), Shift chạy, E ngồi/đứng dậy ở ghế gần.
     Web giữ trạng thái phím của riêng mình (keys) và ghi đè keys của bộ đi bộ trong mô hình mỗi lần có phím/khung hình,
     nên gõ chat không làm nhân vật đi, phím không bị kẹt, và cần điều khiển ảo cũng đi theo hướng camera. */
  const KMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr' };
  const typing = e => {
    const t = e.target; if (!t || !t.tagName) return false;
    if (t.tagName === 'INPUT') return !/^(checkbox|radio|button|submit|reset|range|color)$/i.test(t.type || '') || (t.type === 'range' && /^Arrow/.test(e.code));
    return t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
  };
  const moving = () => me.mode === 'campus' || me.mode === 'walk';
  function clearKeys() { for (const k in keys) keys[k] = 0; driveRoom(); }
  let resetInput = clearKeys;
  /* hướng muốn đi theo phím + cần điều khiển: ix sang phải, iy tới trước (−1…1) */
  function moveInput() {
    if (frozen) return { ix: 0, iy: 0 };
    let jx = joy.x, jy = joy.y; if (Math.hypot(jx, jy) < 0.18) jx = jy = 0;
    return { ix: U.clamp((keys.r - keys.l) + jx, -1, 1), iy: U.clamp((keys.f - keys.b) - jy, -1, 1) };
  }
  /* trong thư viện / sân thượng: ghi phím của web vào bộ đi bộ của mô hình (mô hình đi theo hướng nhìn api.yaw) */
  function driveRoom() {
    const space = sp(); if (!space || space.kind !== 'room') return;
    const K = space.module.api.keys; if (!K) return;
    const { ix, iy } = me.mode === 'walk' && !route ? moveInput() : { ix: 0, iy: 0 };
    K.f = Math.max(0, iy); K.b = Math.max(0, -iy); K.r = Math.max(0, ix); K.l = Math.max(0, -ix);
    K.run = me.mode === 'walk' && (keys.run || Math.hypot(joy.x, joy.y) > 0.95) ? 1 : 0;
  }
  function bindInput() {
    canvas.tabIndex = 0;  // click/vuốt vào cảnh trả bàn phím từ ô chat về điều khiển nhân vật
    /* nhãn tên của chính mình nằm ngay giữa màn hình (trên đầu nhân vật): không chặn thao tác kéo để xoay camera */
    document.head.appendChild(U.h('style', { text: '#labels .po-tag.me{pointer-events:none}' }));
    // Web sở hữu đầu vào khi nhúng; bộ đi bộ chỉ nhận trạng thái đã lọc qua driveRoom().
    addEventListener('keydown', e => {
      if (typing(e) || e.ctrlKey || e.metaKey || e.altKey || frozen || observe || going) { clearKeys(); return; }
      if ((e.code === 'KeyE' || e.code === 'KeyF') && !e.ctrlKey && !e.metaKey && !e.altKey) { if (!e.repeat) useKey(e); }
      const k = KMAP[e.code];
      if (k && me.mode === 'seat' && k === 'f') standUp();    // ngồi: W / ↑ là đứng dậy (giữ phím thì đi tiếp)
      if (k && moving()) {
        if (route && k !== 'tl' && k !== 'tr') { route = null; autoDrive = false; }   // tự điều khiển thì huỷ đường đang đi
        keys[k] = 1; e.preventDefault();
      }
      if (e.key === 'Shift') keys.run = 1;
      driveRoom();
    });
    addEventListener('keyup', e => {
      if (KMAP[e.code]) keys[KMAP[e.code]] = 0;
      if (e.key === 'Shift') keys.run = 0;
      if (e.key === 'Meta') clearKeys();                      // macOS: khi giữ ⌘ trình duyệt không gửi keyup của phím khác
      driveRoom();
    });
    addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeys(); });
    document.addEventListener('focusin', e => { if (typing(e)) clearKeys(); });

    /* chuột / chạm trên khung 3D: kéo (chuột trái hoặc phải, một ngón) để xoay camera, hai ngón để phóng to/thu nhỏ,
       chạm/bấm nhanh không kéo (chuột trái) mới là "bấm để tới". Bắt con trỏ để kéo qua nhãn tên, bảng HUD vẫn xoay tiếp. */
    let pinch = null, multi = false; const pts = new Map();
    const orbiting = () => me.mode === 'campus' || me.mode === 'seat';
    const canLook = () => !observe && !frozen && !going && !camHold && (orbiting() || me.mode === 'walk');
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    const down = (e, tag) => {
      if (!canLook() || (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2)) return;
      canvas.focus?.({ preventScroll: true });
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, btn: e.button, tag });
      if (pts.size > 1) multi = true;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: curDist() }; }
      e.preventDefault();
    };
    canvas.addEventListener('pointerdown', e => down(e, null));
    /* nhãn tên / bong bóng của người khác và NPC nằm đè lên khung 3D (bấm vào để xem hồ sơ). Bắt đầu kéo trên nhãn vẫn phải
       xoay được camera (nhất là khi đang giữ W/A/S/D giữa đám đông): kéo → xoay; bấm nhanh không kéo → mở như bấm vào nhãn. */
    let tagLook = null;
    const finishTagLook = tag => { if (tag) tagLook = { tag, until: performance.now() + 500 }; };
    labelsEl.addEventListener('pointerdown', e => {
      const tag = e.target.closest && e.target.closest('.po-tag');
      if (tag && !tag.classList.contains('me')) down(e, tag);
    });
    labelsEl.addEventListener('click', e => {
      const tag = e.target.closest && e.target.closest('.po-tag');
      // The programmatic click below opens the profile once. A drag/cancel must
      // also consume the browser's compatibility click; keyboard clicks still work.
      if (e.isTrusted && e.detail !== 0 && tagLook && tag === tagLook.tag && performance.now() < tagLook.until) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    }, true);
    canvas.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId);
      if (!p) { if (!pts.size && e.pointerType === 'mouse') hover(e); return; }
      if (!canLook()) { p.x = e.clientX; p.y = e.clientY; p.moved = true; return; }
      if (pinch && pts.size === 2 && (me.mode !== 'walk' || effectiveView() !== 'first')) {
        p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pts.values()];
        setDist(pinch.dist * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)));
      } else if (pts.size === 1) {
        const touch = e.pointerType === 'touch';
        const k = (touch ? 0.009 : 0.0065) * opt.look * (opt.reduce ? 0.75 : 1);
        if (orbiting()) {
          cam.az -= (e.clientX - p.x) * k; cam.el = U.clamp(cam.el + (e.clientY - p.y) * k * 0.7, 0.08, 1.15);
        } else {
          const api = sp().module.api, s = (touch ? 0.006 : 0.0045) * opt.look * (opt.reduce ? 0.75 : 1);
          api.yaw += (e.clientX - p.x) * s;
          api.pitch = U.clamp(api.pitch + (e.clientY - p.y) * s, -1.2, 1.2);
        }
      }
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 7) p.moved = true;
    });
    const up = e => {
      const p = pts.get(e.pointerId); if (!p) return;
      finishTagLook(p.tag);
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
      if (e.type === 'pointerup' && canLook() && !multi && !p.moved && p.btn === 0 && performance.now() - p.t < 600) {
        if (p.tag) { if (p.tag.isConnected) p.tag.click(); } else click(e);
      }
      if (!pts.size) multi = false;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', e => { if (pts.has(e.pointerId)) { finishTagLook(pts.get(e.pointerId).tag); pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) multi = false; } });
    canvas.addEventListener('wheel', e => {
      if (me.mode === 'campus' || me.mode === 'seat' || (me.mode === 'walk' && effectiveView() !== 'first')) { setDist(curDist() * (1 + Math.sign(e.deltaY) * 0.1)); e.preventDefault(); }
    }, { passive: false });

    // cần điều khiển ảo (điện thoại): đi theo hướng camera như phím W/A/S/D; ngón kia vẫn kéo trên màn hình để xoay
    const j = document.getElementById('po-joy');
    let resetJoy = () => { joy.x = joy.y = 0; joy.on = false; };
    if (j) {
      const knob = j.querySelector('i'); let jid = null, c = null;
      j.addEventListener('pointerdown', e => { if (jid != null || frozen || observe || going) return; canvas.focus?.({ preventScroll: true }); jid = e.pointerId; try { j.setPointerCapture(jid); } catch (_) { } const r = j.getBoundingClientRect(); c = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 }; joy.on = true; jm(e); e.preventDefault(); });
      const jm = e => { if (e.pointerId !== jid) return; let dx = e.clientX - c.x, dy = e.clientY - c.y; const l = Math.hypot(dx, dy); if (l > c.R) { dx *= c.R / l; dy *= c.R / l; } joy.x = dx / c.R; joy.y = dy / c.R; knob.style.transform = `translate(${dx}px,${dy}px)`; if (Math.hypot(joy.x, joy.y) > 0.25) route = null; if (me.mode === 'seat' && joy.y < -0.5) standUp(); };
      j.addEventListener('pointermove', jm);
      const je = e => { if (e.pointerId !== jid) return; const id = jid; jid = null; joy.x = joy.y = 0; joy.on = false; knob.style.transform = ''; try { j.releasePointerCapture(id); } catch (_) { } driveRoom(); };
      j.addEventListener('pointerup', je); j.addEventListener('pointercancel', je); j.addEventListener('lostpointercapture', je);
      resetJoy = () => { if (jid != null) je({ pointerId: jid }); };
      addEventListener('blur', resetJoy);
      document.addEventListener('visibilitychange', () => { if (document.hidden) resetJoy(); });
    }
    const resetLook = () => { for (const [id, p] of pts) { finishTagLook(p.tag); try { canvas.releasePointerCapture(id); } catch (_) { } } pts.clear(); pinch = null; multi = false; };
    resetInput = () => { resetJoy(); resetLook(); clearKeys(); };
    addEventListener('blur', resetLook);
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetLook(); });
  }
  function curKind() { return me.mode === 'campus' ? 'campus' : me.mode === 'seat' ? 'seat' : 'walk'; }
  function curDist() { return cam.dist[curKind()]; }
  function setDist(d) {
    if (liftCameraLocked()) return;
    const k = curKind(), lim = { campus: [3, 14], walk: [1.6, 5.5], seat: [1.3, 4.5] }[k];
    cam.dist[k] = U.clamp(d, lim[0], lim[1]);
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function setRay(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, viewCam());
    return r;
  }
  /* camera đúng như hình đang hiện trên màn hình. Trong thư viện (ngôi thứ ba) camera của mô hình được trả về vị trí
     "mắt" sau mỗi lần vẽ (afterFrame), nên giữa hai khung hình phải dùng bản sao này để bấm trúng ghế/sàn/người. */
  const rcam = new THREE.PerspectiveCamera();
  let rcamOk = false;
  function viewCam() { return rcamOk && rcam.userData.of === S.camera() ? rcam : S.camera(); }
  function pickAvatar(e) {
    setRay(e);
    const objs = [];
    for (const o of others.values()) if (o.av.root.visible) objs.push(o.av.hit || o.av.inner);
    if (me.avatar && me.avatar.root.visible && me.mode !== 'walk') objs.push(me.avatar.hit || me.avatar.inner);
    const hit = ray.intersectObjects(objs, true)[0];
    if (!hit) return null;
    let av = hit.object.userData.avatar;
    if (!av) for (let o = hit.object; o && !av; o = o.parent) av = o.userData.avatar;
    if (av === me.avatar) return me.uid;
    for (const o of others.values()) if (o.av === av) return o.uid;
    return null;
  }
  /* ghế gần điểm bấm trên màn hình (cùng tầng hoặc nhìn thấy được) */
  function seatAtScreen(e, deep) {
    const space = sp(); if (!space || !space.seats.length) return -1;
    const r = canvas.getBoundingClientRect(), c = viewCam(), v = new V3();
    // deep (khi bấm): bắn tia vào cảnh — trúng thẳng ghế nào thì chọn ghế đó; ghế khuất sau tường/bàn thì bỏ qua
    let hitP = null, hitD = Infinity;
    if (deep) {
      setRay(e);
      const hs = ray.intersectObject(space.group, true);
      for (const h of hs) { if (sceneHit(h.object, space.group)) { hitP = h.point; hitD = h.distance; break; } }
    }
    let best = -1, bd = U.isTouch ? 34 : 26;
    space.seats.forEach((s, i) => {
      if (i === me.seat) return;
      if (Math.abs(s.y - me.y) > 3 && space.kind === 'room') return;
      v.set(s.x, s.y + 0.45, s.z); space.group.localToWorld(v);
      const dist = v.distanceTo(c.position);
      if (dist > 30) return;
      if (hitP) { const dh = v.distanceTo(hitP); if (dh < 0.7) { if (dh - 1000 < bd) { bd = dh - 1000; best = i; } return; } }
      if (dist > hitD + 0.9) return;
      v.project(c);
      if (v.z > 1) return;
      const d = Math.hypot((v.x + 1) / 2 * r.width - (e.clientX - r.left), (1 - v.y) / 2 * r.height - (e.clientY - r.top));
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  /* vật trúng tia có phải là một phần cảnh nhìn thấy được (không phải nhân vật, vòng đích, vật đang ẩn) */
  function sceneHit(o, top) {
    for (let x = o; x && x !== top; x = x.parent) { if (x.visible === false || (x.userData && x.userData.avatar) || x === marker) return false; }
    if (o.material && (o.material.visible === false || (o.material.transparent && o.material.opacity < 0.05))) return false;
    return true;
  }
  /* điểm trên mặt sàn dưới con trỏ */
  function floorAtScreen(e) {
    const space = sp(); if (!space) return null;
    setRay(e);
    const o = ray.ray.origin, d = ray.ray.direction;
    if (space.kind === 'campus') {
      for (let t = 0.5; t < 220; t += 0.25) {
        const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
        if (y <= space.floorAt(x, z) + 0.05) return { x, z };
      }
      return null;
    }
    const fy = space.floorOf(me.y + 0.1);
    if (d.y > -1e-3) return null;
    const t = (fy - o.y) / d.y; if (t < 0 || t > 60) return null;
    return { x: o.x + d.x * t, z: o.z + d.z * t };
  }
  function hover(e) {
    if (me.mode === 'idle' || me.mode === 'piano' || observe) { canvas.style.cursor = ''; return; }
    const a = pickAvatar(e);
    const si = a ? -1 : seatAtScreen(e);
    canvas.style.cursor = a ? 'pointer' : si >= 0 ? (occupiedSeats().has(si) ? 'not-allowed' : 'cell') : '';
  }
  function click(e) {
    if (me.mode === 'idle' || me.mode === 'piano' || observe) return;
    const a = pickAvatar(e);
    if (a) { ev.emit('avatar-click', a); return; }
    const npc = Npc.pick();                                   // pickAvatar vừa đặt tia từ con trỏ
    if (npc) { ev.emit('npc-click', npc); return; }
    for (const f of hooks.pick) if (f(ray)) return;
    { const space = sp();
      // đàn piano: bấm vào thân đàn cũng ngồi vào ghế đàn
      if (space.piano && ray.intersectObject(space.piano, true).length) { const i = space.seats.findIndex(x => x.kind === 'piano'); if (i >= 0) { goSit(i); return; } }
      // cửa chính: ngoài sân bấm cửa → đi vào; trong sảnh bấm cửa → đi ra
      if (space.doorHit && space.doorHit(ray, space.floorOf(me.y + 0.1))) {
        if (space.kind === 'campus') { if (me.mode === 'seat') standUp(); if (Math.hypot(me.x, me.z + 1.6) < 2.2) enterLibrary(); else walkTo(0, -1.6, enterLibrary, 0.6); }
        else { if (me.mode === 'seat') standUp(); const ex = space.exitPoint, out = () => go('campus', { from: 'library' }); if (!walkTo(ex.x, ex.z, out, 0.5)) out(); }
        return;
      } }
    const s = seatAtScreen(e, true);
    if (s >= 0) { goSit(s); return; }
    const p = floorAtScreen(e);
    if (p && (me.mode === 'campus' || me.mode === 'walk' || me.mode === 'seat')) {
      const space = sp(), g = space.grid(space.floorOf(me.y + 0.1));
      if (g && g.nearest(p.x, p.z, 1.5)) walkTo(p.x, p.z);
    }
  }
  let marker = null;
  function showMarker(x, y, z) {
    if (!marker) {
      marker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.34, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, depthWrite: false }));
      marker.rotation.x = -Math.PI / 2; marker.renderOrder = 3;
    }
    const space = sp(); space.group.add(marker);
    const fy = space.kind === 'campus' ? space.floorAt(x, z) : space.floorOf(y + 0.1);
    marker.position.set(x, fy + 0.04, z); marker.userData.t = 1;
  }

  /* ------------------------------------------------------------------
     MƯA (chỉ ngoài sân)
     ------------------------------------------------------------------ */
  /* ---- sân thư viện sống động hơn: chim bay ban ngày, đom đóm quanh vườn xoài buổi tối ---- */
  let birds = null, flies = null;
  function buildLife() {
    const c = S.spaces.campus;
    birds = new THREE.Group(); birds.userData.list = [];
    const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, 0, 0, -0.12, -0.42, 0.06, 0, 0, 0, 0.12, 0, 0, -0.12, 0.42, 0.06, 0], 3));
    wingG.computeVertexNormals();
    const bm = new THREE.MeshBasicMaterial({ color: 0x2a2f3a, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(wingG, bm); b.userData = { r: 14 + Math.random() * 22, h: 16 + Math.random() * 12, a: Math.random() * 6.28, sp: (0.12 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1), ph: Math.random() * 6, cx: (Math.random() - 0.5) * 30, cz: 8 + Math.random() * 14 };
      b.scale.setScalar(1.3); birds.add(b); birds.userData.list.push(b);
    }
    c.group.add(birds);
    const N = 70, pos = new Float32Array(N * 3), seed = [];
    const spots = (c.mango && c.mango.length ? c.mango : [{ x: -40, z: 16 }, { x: 40, z: 16 }]).concat([{ x: -12, z: 20 }, { x: 12, z: 20 }]);
    for (let i = 0; i < N; i++) { const s0 = spots[i % spots.length]; seed.push({ x: s0.x + (Math.random() - 0.5) * 9, z: s0.z + (Math.random() - 0.5) * 9, y: 0.6 + Math.random() * 2.4, ph: Math.random() * 6.28, f: 0.6 + Math.random() }); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dot = document.createElement('canvas'); dot.width = dot.height = 32; { const x = dot.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,200,1)'); gr.addColorStop(.3, 'rgba(220,255,120,.8)'); gr.addColorStop(1, 'rgba(180,255,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); }
    flies = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.35, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8ff8a }));
    flies.userData.seed = seed; flies.frustumCulled = false; c.group.add(flies);
  }
  function updateLife(dt, now) {
    if (!birds) return;
    const outside = S.current() === 'campus', n = S.nightLevel ? S.nightLevel() : 0, t = now / 1000;
    birds.visible = outside && n < 0.5 && !rainOn;
    if (birds.visible) for (const b of birds.userData.list) {
      const u = b.userData; u.a += u.sp * dt;
      b.position.set(u.cx + Math.cos(u.a) * u.r, u.h + Math.sin(t * 0.7 + u.ph) * 1.2, u.cz + Math.sin(u.a) * u.r);
      b.rotation.y = -u.a + (u.sp > 0 ? 0 : Math.PI);
      b.scale.y = 1.3 * (0.35 + Math.abs(Math.sin(t * 9 + u.ph)) * 0.9);   // vỗ cánh
    }
    flies.visible = outside && n > 0.55;
    if (flies.visible) {
      const a = flies.geometry.attributes.position.array, sd = flies.userData.seed;
      for (let i = 0; i < sd.length; i++) { const q = sd[i]; a[i * 3] = q.x + Math.sin(t * 0.4 * q.f + q.ph) * 1.5; a[i * 3 + 1] = q.y + Math.sin(t * 0.9 * q.f + q.ph * 2) * 0.4; a[i * 3 + 2] = q.z + Math.cos(t * 0.35 * q.f + q.ph) * 1.5; }
      flies.geometry.attributes.position.needsUpdate = true;
      flies.material.opacity = 0.55 + 0.45 * Math.sin(t * 2.3);
    }
  }
  function buildRain() {
    const N = U.isTouch ? 900 : 1800, pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) { const x = (Math.random() - .5) * 80, y = Math.random() * 40, z = (Math.random() - .5) * 80; pos.set([x, y, z, x + .05, y - .9, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaac4dd, transparent: true, opacity: .45 }));
    rain.frustumCulled = false; rain.visible = false; S.spaces.campus.group.add(rain);
  }
  function setRain(on) { rainOn = on; }

  /* ------------------------------------------------------------------
     CAMERA: đặt sau lưng / quanh nhân vật, không xuyên tường & trần
     ------------------------------------------------------------------ */
  /* endOnly: chỉ xét điểm đặt camera (lùi dần), không xét đường nối — dùng khi ngồi để lưng ghế, bàn không kéo camera sát đầu */
  function placeCam(camera, dt, tx, ty, tz, az, el, want, ok, smooth, endOnly) {
    const ux = Math.sin(az) * Math.cos(el), uy = Math.sin(el), uz = Math.cos(az) * Math.cos(el);
    let dist = want;
    if (endOnly) { dist = 0.35; for (let r = want; r >= 0.4; r -= 0.2) if (ok(tx + ux * r, ty + uy * r, tz + uz * r)) { dist = r; break; } }
    else for (let r = 0.4; r < want + 0.25; r += 0.25) {
      const step = Math.min(r, want); // include the requested endpoint even between sample steps
      if (!ok(tx + ux * step, ty + uy * step, tz + uz * step)) { dist = Math.max(0.35, step - 0.35); break; }
      if (step === want) break;
    }
    cam.cur = dist;
    const cx = tx + ux * cam.cur, cy = ty + uy * cam.cur, cz = tz + uz * cam.cur;
    if (!cam.ready || !smooth) { camera.position.set(cx, cy, cz); cam.ready = true; }
    else { const k = Math.min(1, dt * (opt.reduce ? 12 : 8)); camera.position.x += (cx - camera.position.x) * k; camera.position.y += (cy - camera.position.y) * k; camera.position.z += (cz - camera.position.z) * k; }
    camera.lookAt(tx, ty, tz);
  }
  // Sweep the actual near-plane footprint, including corners at walls/ceilings.
  // A/B provide a floor footprint without furniture; legacy scenes fall back to camFree.
  function roomCameraFree(space, camera, base, ceil, az, el) {
    const near = camera.near, halfH = near * Math.tan(camera.fov * Math.PI / 360), halfW = halfH * camera.aspect;
    const sx = Math.sin(az), cx = Math.cos(az), se = Math.sin(el), ce = Math.cos(el);
    const offsets = [[0, 0, 0]];
    for (const x of [-halfW, halfW]) for (const y of [-halfH, halfH])
      offsets.push([-sx * ce * near + cx * x - sx * se * y, -se * near + ce * y, -cx * ce * near - sx * x - cx * se * y]);
    const api = space.module.api;
    const inside = typeof api.cameraInside === 'function' ? (x, z) => api.cameraInside(x, z, base) : (x, z) => space.camFree(x, z, base);
    return (x, y, z) => offsets.every(([dx, dy, dz]) => y + dy > base + 0.12 && y + dy < ceil && inside(x + dx, z + dz));
  }

  /* ------------------------------------------------------------------
     MỖI KHUNG HÌNH
     ------------------------------------------------------------------ */
  let saved = null;      // vị trí mắt của bộ đi bộ trong mô hình (trả lại sau khi vẽ)
  function frame(dt, now, camera) {
    if (!S) return;
    if (observe) { /* camera tự do do OrbitControls điều khiển */ }
    else if (me.mode === 'idle') {
      idleT += dt * 0.035;
      if (S.current() === 'campus') { camera.position.set(Math.sin(idleT) * 105, 42, Math.cos(idleT) * 105 + 10); camera.lookAt(0, 12, -8); }
    } else if (me.mode === 'campus') moveCampus(dt, camera);
    else if (me.mode === 'seat') seatCam(dt, camera);
    if (me.mode === 'walk' || me.mode === 'piano') roomFrame(dt, camera);
    if (me.avatar) me.avatar.update(dt, me.speed);
    for (const f of hooks.frame) f(dt, now, camera);
    if (camHold) { camera.position.copy(camHold.p); camera.lookAt(camHold.t); }
    camera.updateMatrixWorld();
    nearSeatFrame(dt, camera);
    others3D(dt, camera);
    Npc.frame(dt, camera);
    labels(camera);
    effects(dt, camera);
    updateLife(dt, now);
    Mini.frame(now);
  }
  function afterFrame() {
    for (const f of hooks.after) f();
    { const c = S.camera(); rcam.copy(c); rcam.userData.of = c; rcam.updateMatrixWorld(true); rcam.updateProjectionMatrix(); rcamOk = true; }
    if (saved) { const c = saved.cam || sp().camera; c.position.copy(saved.p); c.quaternion.copy(saved.q); saved = null; }   // trả mắt về đúng camera đã lưu
  }

  function moveCampus(dt, camera) {
    const space = sp();
    if (!frozen) cam.az -= (keys.tr - keys.tl) * dt * TURN * opt.look;   // ←/→ xoay camera
    const fx = -Math.sin(cam.az), fz = -Math.cos(cam.az);   // "tới trước" theo hướng camera (đổi liên tục khi kéo chuột)
    const { ix, iy } = moveInput();
    let mx = fx * iy - fz * ix, mz = fz * iy + fx * ix, len = Math.hypot(mx, mz);
    let auto = false;
    if (len < 0.05) { const d = followRoute(dt); if (me.mode !== 'campus' || sp() !== space) return; if (d) { mx = d.x; mz = d.z; len = 1; auto = true; } }
    else route = null;
    const run = keys.run || Math.hypot(joy.x, joy.y) > 0.95;
    const speed = (run ? 6 : 3.2) * opt.speed;
    const ox = me.x, oz = me.z;
    if (len > 0.05) {
      const k = Math.min(1, len) * speed * dt / len, f0 = space.floorAt(me.x, me.z);
      const okAt = (x, z) => space.free(x, z, auto ? 0.08 : 0.22) && Math.abs(space.floorAt(x, z) - f0) < 0.45;
      if (okAt(me.x + mx * k, me.z)) me.x += mx * k;
      if (okAt(me.x, me.z + mz * k)) me.z += mz * k;
      const want = Math.atan2(mx, mz); me.yaw += ang(want - me.yaw) * Math.min(1, dt * (opt.reduce ? 7 : 10));
    }
    const d = Math.max(dt, 1e-3);
    me.vx = (me.x - ox) / d; me.vz = (me.z - oz) / d; me.speed = Math.hypot(me.vx, me.vz);
    me.y += (space.floorAt(me.x, me.z) - me.y) * Math.min(1, dt * 12);
    me.avatar.root.position.set(me.x, me.y, me.z); me.avatar.root.rotation.y = me.yaw;
    placeCam(camera, dt, me.x, me.y + 1.45, me.z, cam.az, cam.el, cam.dist.campus, () => true, false);   // bám chặt, không tự phóng to/thu nhỏ
    sendPos(performance.now(), me.speed > 0.1);
    // cửa chính thư viện: tới gần thì cửa kính mở, bước qua cửa là vào sảnh
    const dd = Math.hypot(me.x, me.z + 2.3);
    S.setDoor && S.setDoor(dd < 7 ? 1 - Math.max(0, dd - 3) / 4 : 0);
    if (me.y > 1.2 && Math.abs(me.x) < 2.6 && me.z < -1.35 && (auto || me.vz < -0.1)) { enterLibrary(); return; }
    let nb = null;
    for (const b of S.buildings) if (Math.hypot(b.door.x - me.x, b.door.z - me.z) < 9) nb = b.id;
    if (nb !== nearB) { nearB = nb; ev.emit('near-building', nb); }
    updatePlace();
  }
  function enterLibrary() { route = null; go('lib_a', { entrance: true, text: 'Vào sảnh thư viện…' }); }
  function seatCam(dt, camera) {
    const space = sp(), s = space.seats[me.seat]; if (!s) return;
    const fl = space.floorOf(s.y + 0.1), ceil = fl + space.ceil(fl) - 0.25;
    const ok = space.kind === 'campus' ? (x, y, z) => !space.solid(x, y, z) && y > space.floorAt(x, z) + 0.3
      : (x, y, z) => y < ceil && y > fl + 0.25 && (y > fl + 1.6 || space.camFree(x, z, fl));   // cao hơn bàn ghế thì không bị kéo sát
    placeCam(camera, dt, s.x, s.y + 1.15, s.z, cam.az, cam.el, cam.dist.seat, ok, true, space.kind === 'room');
  }
  /* trong thư viện: bộ đi bộ của mô hình di chuyển "mắt"; web đặt nhân vật tại đó và camera sau lưng */
  function roomFrame(dt, camera) {
    const space = sp(), api = space.module.api, md = api.getMode();
    if (me.mode === 'walk' && md === 'piano') {           // bấm E cạnh đàn (phím tắt của mô hình)
      const i = space.seats.findIndex(s => s.kind === 'piano');
      if (i < 0 || occupiedSeats().has(i)) {
        space.stopWalk(); space.walkNow(me.x, space.floorOf(me.y + 0.1), me.z, Math.PI - me.yaw);
        ev.emit('toast', 'Ghế đàn đã có bạn sử dụng.'); return;
      }
      me.seat = i; me.seatTs = Date.now(); me.special = 'piano'; setMode('piano'); placeSeated(me.avatar, space.seats[i]); ev.emit('seat-changed', i); sendRest(); return;
    }
    if (me.mode === 'piano') {
      if (md === me.special || api.busy()) return;
      if (me.special === 'piano') {                        // rời đàn: mô hình đặt bạn đứng cạnh đàn
        me.seat = -1; me.avatar.setSit(false); me.special = null; setMode('walk'); ev.emit('seat-changed', -1);
        if (md !== 'walk') { space.walkNow(me.x, space.floorOf(me.y + 0.1), me.z, Math.PI - me.yaw); return; }
      } else {                                             // rời kính thiên văn / thôi nằm ngắm sao
        me.special = null;
        if (me.seat >= 0) { setMode('seat'); cam.cur = null; cam.ready = false; return; }
        space.walkNow(me.x, 0, me.z, Math.PI - me.yaw); setMode('walk'); return;
      }
    }
    if (going) return;
    // thang máy lên tầng 10 → sân thượng; bước vào cửa thang máy trên sân thượng → xuống tầng 6
    if (me.space === 'B' && api.level === 10 && S.spaces.D) { go('lib_c', { entrance: true, text: 'Lên sân thượng tầng 10…' }); return; }
    if (me.space === 'D' && me.x < space.lift.x - 1.1 && Math.abs(me.z) < 1.1 && me.vx < -0.2) { go('lib_b', { arrive: { floor: 6, idx: 1 }, text: 'Xuống tầng 6…' }); return; }
    if (md === 'orbit' || md === 'ext') { space.walkNow(me.x, space.floorOf(me.y + 0.1), me.z, Math.PI - me.yaw); return; }
    // tự đi theo đường đã tìm: dời "mắt" của bộ đi bộ thẳng theo đường, KHÔNG xoay góc nhìn (chỉ người dùng mới xoay camera)
    const eye = camera.position, d = Math.max(dt, 1e-3);
    const r = followRoute(dt);
    if (me.mode !== 'walk' || sp() !== space) return;
    if (r) {
      api.keys.f = api.keys.b = api.keys.l = api.keys.r = api.keys.run = 0;
      const sp = 3 * (window.__WALK_K || 0.75) * dt, fl0 = space.floorOf(eye.y - 1.5);
      const tx = eye.x + r.x * sp, tz = eye.z + r.z * sp;
      // Trượt theo từng trục như trên sân: đường A* làm mượt có thể cắt sát góc bàn/ghế,
      // đi chéo bị chặn thì vẫn trượt dọc mép thay vì đứng im rồi bỏ đường giữa chừng.
      const okAt = (x, z) => space.free(x, z, fl0) || space.camFree(x, z, eye.y - 1.6);
      if (okAt(tx, tz)) { eye.x = tx; eye.z = tz; }
      else if (Math.abs(r.x) > 0.01 && okAt(tx, eye.z)) eye.x = tx;
      else if (Math.abs(r.z) > 0.01 && okAt(eye.x, tz)) eye.z = tz;
      else if (route) route.stuck += dt;
      if (space.module === S.spaces.B?.module || space.module === S.spaces.D?.module) { /* độ cao mắt do mô hình tự tính */ }
    }
    // phím + cần điều khiển → bộ đi bộ của mô hình (đi theo hướng camera, A/D đi ngang); ←/→ xoay góc nhìn
    if (!frozen && me.mode === 'walk') api.yaw += (keys.tr - keys.tl) * dt * TURN * opt.look;
    driveRoom();
    const inp = moveInput(), fy = api.yaw;
    const nx = eye.x, nz = eye.z, ny = eye.y - 1.6;
    me.vx = (nx - me.x) / d; me.vz = (nz - me.z) / d; me.speed = Math.min(8, Math.hypot(me.vx, me.vz));
    me.x = nx; me.z = nz; me.y = ny;
    // nhân vật quay dần về hướng MUỐN đi (phím/cần, theo camera); tự đi theo đường thì quay theo hướng đang đi
    if (!r && Math.hypot(inp.ix, inp.iy) > 0.05) { const wx = inp.iy * Math.sin(fy) + inp.ix * Math.cos(fy), wz = -inp.iy * Math.cos(fy) + inp.ix * Math.sin(fy); me.yaw += ang(Math.atan2(wx, wz) - me.yaw) * Math.min(1, dt * (opt.reduce ? 7 : 10)); }
    else if (me.speed > 0.4) me.yaw += ang(Math.atan2(me.vx, me.vz) - me.yaw) * Math.min(1, dt * 10);
    me.avatar.root.position.set(me.x, me.y, me.z); me.avatar.root.rotation.y = me.yaw;
    sendPos(performance.now(), me.speed > 0.1);
    updatePlace();
    const pi = space.piano ? space.seats.find(x => x.kind === 'piano') : null;
    const nt = space.mount && Math.hypot(me.x - space.mount.x, me.z - space.mount.z) < 2.6 ? 'scope'
      : pi && Math.abs(me.y - pi.y) < 1.5 && Math.hypot(me.x - pi.x, me.z - pi.z) < 3.2 ? 'piano' : null;
    if (nt !== nearThing) { nearThing = nt; ev.emit('near-thing', nt); }
    if (syncCameraView(camera)) return;
    // Keep the selected boom in open space; shorten it at walls/ceilings or fixtures.
    saved = { cam: camera, p: camera.position.clone(), q: camera.quaternion.clone() };
    const fl = space.floorOf(me.y + 0.1), base = me.y, ceil = Math.max(base, fl) + space.ceil(fl) - 0.2;
    const el = U.clamp(0.32 + api.pitch * 0.55, 0.02, 1.0);
    const want = cam.dist.walk;
    const az = Math.PI - api.yaw + Math.PI, elevation = Math.min(el, Math.asin(U.clamp((ceil - (me.y + 1.5)) / want, -1, 1)));
    const cameraFree = roomCameraFree(space, camera, base, ceil, az, elevation);
    placeCam(camera, dt, me.x, me.y + 1.5, me.z, az, elevation, want, cameraFree, false);
    if (api.constrainCamera) api.constrainCamera(camera, me.x, me.y + 1.5, me.z);
    // A doorway/corner may leave no safe third-person boom, even at its minimum.
    // Render the original walking eye until there is room again; preserve view/zoom preferences.
    if (!cameraFree(camera.position.x, camera.position.y, camera.position.z)) {
      camera.position.copy(saved.p); camera.quaternion.copy(saved.q); saved = null;
      camera.fov = 70; camera.updateProjectionMatrix(); me.avatar.root.visible = false;
      return;
    }
    const actualDistance = camera.position.distanceTo(tmp.set(me.x, me.y + 1.5, me.z));
    if (actualDistance < 0.45) me.avatar.root.visible = false; // do not replace a wall obstruction with the avatar's head
  }
  let autoDrive = false;
  const TURN = 2.6;      // rad/s ở độ nhạy 1 khi giữ ←/→

  let othersT = 0;
  function others3D(dt, camera) {
    const list = [];
    /* thời gian thật giữa hai khung hình (dt của khung hình bị chặn 0,05 s; vị trí đoán thì theo đồng hồ thật) */
    const tNow = performance.now(), rdt = othersT ? Math.min(0.25, Math.max(0.001, (tNow - othersT) / 1000)) : dt; othersT = tNow;
    for (const o of others.values()) {
      if (o.seat < 0) {
        const dt = rdt;
        /* đoán vị trí hiện tại = gói gần nhất + vận tốc × thời gian (tối đa 2,5 s; quá lâu không có gói thì đứng chờ).
           Nhân vật đi theo vận tốc nhận được (không trễ sau vị trí thật) và chỉ được kéo nhẹ về chỗ đoán,
           nên gói mới tới không làm giật; bước chân và hướng mặt lấy theo vận tốc nên không rung. */
        const el = Math.min(2.5, (performance.now() - o.pt) / 1000), going = (o.vx || o.vz) && el < 2.5;
        const tx = o.px + o.vx * el, tz = o.pz + o.vz * el;
        const ox = o.x, oz = o.z;
        if (Math.hypot(tx - o.x, tz - o.z) > 25) { o.x = tx; o.z = tz; }
        if (going) { o.x += o.vx * dt; o.z += o.vz * dt; }
        const k = Math.min(1, dt * (going ? 3 : 6)); o.x += (tx - o.x) * k; o.z += (tz - o.z) * k; o.y += (o.ty - o.y) * Math.min(1, dt * 8);
        const meas = Math.min(9, Math.hypot(o.x - ox, o.z - oz) / Math.max(dt, 1e-3));
        o.speed = (o.speed || 0) + (meas - (o.speed || 0)) * Math.min(1, dt * 8);
        // bước chân không nhanh hơn vận tốc thật nhận được: những lần kéo nhẹ về chỗ đoán không biến thành chạy
        if (going) o.speed = Math.min(o.speed, Math.hypot(o.vx, o.vz) * 1.15 + 0.2);
        if (going && Math.hypot(o.vx, o.vz) > 0.3) o.tyaw = Math.atan2(o.vx, o.vz);
        else if (o.speed > 0.3 && meas > 0.3) o.tyaw = Math.atan2(o.x - ox, o.z - oz);
        // xoay người dần, tối đa ~4 rad/s: gói mới đổi hướng không làm nhân vật quay giật
        o.yaw += Math.max(-4 * dt, Math.min(4 * dt, ang(o.tyaw - o.yaw) * Math.min(1, dt * 8)));
        o.av.root.position.set(o.x, o.y, o.z); o.av.root.rotation.y = o.yaw;
      } else o.speed = 0;
      o.av.update(dt, o.speed);
      o.av.root.getWorldPosition(tmp); o.d = tmp.distanceTo(camera.position); list.push(o);
    }
    list.sort((a, b) => a.d - b.d);
    list.forEach((o, i) => { o.av.root.visible = i < MAXAV; if (o.av.setDetail) o.av.setDetail(o.d < 14); });
    if (me.avatar && me.avatar.setDetail) me.avatar.setDetail(true);
    others.list = list;
  }
  /* bong bóng chat nằm trên nhãn tên: màn hình thấp (điện thoại xoay ngang, cửa sổ nhỏ) hoặc camera nhìn từ dưới lên thì
     bong bóng trồi lên tận thanh trên cùng và bị các thẻ HUD che mất. Dời cả nhãn xuống vừa đủ để bong bóng hiện dưới thẻ HUD
     nằm phía trên nó (đè lên đầu nhân vật một chút còn hơn không đọc được). Kích thước nhãn chỉ đo lại khi nội dung đổi. */
  let hudRects = [], hudT = -Infinity, hudSize = '';
  function hudTop(now) {
    const size = labelsEl.clientWidth + ':' + labelsEl.clientHeight;
    if (size === hudSize && now - hudT < 1000) return hudRects;
    hudSize = size;
    hudT = now;
    hudRects = [...document.querySelectorAll('.po-top .po-card, .po-top-r > *')].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
    return hudRects;
  }
  function keepBubbleVisible(el, px, py) {
    const box = el.querySelector('.po-bubbles');
    const W = labelsEl.clientWidth, Hh = labelsEl.clientHeight;
    const key = W + ':' + Hh + ':' + (document.fonts ? document.fonts.status : '') + ':' +
      (box ? box.textContent : '') + ':' + el.lastElementChild.textContent + ':' + el.classList.contains('pinned');
    if (el._szKey !== key) { el._szKey = key; el._sz = { w: el.offsetWidth, h: el.offsetHeight }; }
    const { w, h } = el._sz;
    px = U.clamp(px, Math.min(W / 2, w / 2 + 4), Math.max(W / 2, W - w / 2 - 4));
    let safe = 4;
    for (const r of hudTop(performance.now())) if (r.left < px + w / 2 && r.right > px - w / 2 && r.bottom > safe) safe = r.bottom + 6;
    return { x: px, y: Math.min(Hh - 4, Math.max(py, safe + h)) };
  }
  function labels(camera) {
    const W = labelsEl.clientWidth, Hh = labelsEl.clientHeight, maxD = me.space === 'campus' ? 45 : 20;
    // camera vừa được đặt lại trong khung hình này (placeCam/lookAt) nhưng ma trận chỉ được tính khi vẽ:
    // tính ngay ở đây, nếu không nhãn tên + bong bóng chiếu theo camera của khung trước → trễ một khung, rung khi vừa đi vừa xoay
    camera.updateMatrixWorld();
    const place = (el, obj, y, d, hide) => {
      if (hide || !obj.visible || d > maxD) { el.style.display = 'none'; return; }
      obj.getWorldPosition(tmp); tmp.y += y; tmp.project(camera);
      if (tmp.z > 1 || tmp.x < -1.2 || tmp.x > 1.2 || tmp.y < -1.2 || tmp.y > 1.2) { el.style.display = 'none'; return; }
      el.style.display = '';
      let px = (tmp.x + 1) / 2 * W, py = (1 - tmp.y) / 2 * Hh;
      if (el.classList.contains('talk')) { const at = keepBubbleVisible(el, px, py); px = at.x; py = at.y; }
      el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%)`;
      el.style.opacity = d > maxD * 0.7 && !el.classList.contains('talk') ? '0.55' : '1';
      // người gần đè lên người xa; ai đang nói thì bong bóng nổi lên trên mọi nhãn tên
      el.style.zIndex = String((el.classList.contains('talk') ? 3000 : 1000) - Math.round(d * 10));
    };
    // độ cao nhãn = đỉnh đầu thật của nhân vật (đứng / ngồi / nằm, cao / thấp) + khoảng hở
    const topOf = (av, seated) => (av && av.headY ? av.headY() : seated ? 1.32 : 1.77) + 0.18;
    const room = me.space !== 'campus';
    for (const o of others.list || []) {
      const a = acts.get(o.uid), k = a ? a.k : null;           // [act] nhân vật vừa dựng lại (đổi khu…) thì gắn lại hoạt động
      if (o.av.setAct && (o.av.act || null) !== k) { o.av.setAct(k); updateLabel(o); }
      place(o.label, o.av.root, topOf(o.av, o.seat >= 0), o.d, room && Math.abs(o.y - me.y) > 2.6);
    }
    if (myLabel) {
      myLabel.classList.remove('pinned');
      if (me.avatar && me.avatar.root.visible && me.mode !== 'idle' && me.mode !== 'piano' && !(me.mode === 'walk' && effectiveView() === 'first')) { me.avatar.root.getWorldPosition(tmp2); place(myLabel, me.avatar.root, topOf(me.avatar, me.mode === 'seat'), tmp2.distanceTo(camera.position)); }
      else if (me.mode !== 'idle' && myLabel.classList.contains('talk')) {
        // không thấy nhân vật của mình (nhìn bằng mắt / đang chơi đàn): bong bóng của mình ghim giữa màn hình
        myLabel.classList.add('pinned'); myLabel.style.display = ''; myLabel.style.opacity = '1'; myLabel.style.zIndex = '4000';
        const at = keepBubbleVisible(myLabel, W / 2, Hh * 0.6);
        myLabel.style.transform = `translate(${at.x.toFixed(1)}px,${at.y.toFixed(1)}px) translate(-50%,-100%)`;
      }
      else myLabel.style.display = 'none';
    }
    const showB = me.space === 'campus' && me.mode !== 'idle';
    for (const l of bLabels) {
      if (!showB) { l.el.style.display = 'none'; continue; }
      tmp.set(l.b.label.x, l.b.label.y, l.b.label.z); S.spaces.campus.group.localToWorld(tmp); tmp.project(camera);
      if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) { l.el.style.display = 'none'; continue; }
      l.el.style.display = ''; l.el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px,${((1 - tmp.y) / 2 * Hh).toFixed(1)}px) translate(-50%,-100%)`;
    }
  }
  function effects(dt, camera) {
    if (rain) {
      rain.visible = rainOn && S.current() === 'campus';
      if (rain.visible) {
        rain.position.set(camera.position.x, 0, camera.position.z);
        const a = rain.geometry.attributes.position.array, fall = dt * 28;
        for (let i = 0; i < a.length; i += 6) { a[i + 1] -= fall; a[i + 4] -= fall; if (a[i + 4] < 0) { const y = 38 + Math.random() * 4; a[i + 1] = y; a[i + 4] = y - .9; } }
        rain.geometry.attributes.position.needsUpdate = true;
      }
    }
    if (marker && marker.parent) { marker.userData.t -= dt * 0.7; marker.material.opacity = Math.max(0, marker.userData.t); marker.scale.setScalar(1 + (1 - marker.userData.t) * .5); if (marker.userData.t <= 0) marker.parent.remove(marker); }
  }
  function updatePlace() {
    const space = sp(); if (!space || !space.place) return;
    const pl = space.place(me.x, me.y, me.z);
    if (pl !== me.place) { me.place = pl; me.floor = space.floorOf(me.y + 0.1); ev.emit('place-changed', pl); }
  }

  /* Gửi vị trí THƯA để tiết kiệm lượt tin realtime: khi bắt đầu đi, khi rẽ gấp, tối đa ~1 lần/1,2 giây khi đang đi,
     và một lần khi dừng. Người nhận tự ngoại suy theo vận tốc. */
  /* Gửi theo kiểu "dead reckoning": người xem đoán vị trí = gói trước + vận tốc × thời gian. Chỉ gửi khi cần:
     lúc bắt đầu đi, tối đa mỗi posIntervalMs, và khi vị trí thật lệch khỏi chỗ người xem đang đoán > 0,35 m
     (đi vòng / kéo chuột đổi hướng) — đi thẳng thì vẫn thưa, rẽ thì gửi dày hơn (cách nhau ≥ 250 ms).
     Vận tốc gửi đi được làm mượt (~0,15 s) thay vì vận tốc của đúng một khung hình.
     Một khung hình đứng yên (vướng va chạm, cầu thang) không tính là dừng: phải đứng yên liên tục ≥ 0,25 s. */
  /* Vận tốc gửi đi tính theo THỜI GIAN THẬT (quãng đường thật / thời gian thật). me.vx tính theo dt của khung hình,
     mà dt bị chặn ở 0,05 s: máy chậm (điện thoại, tab bận) thì nhân vật thật đi chậm hơn me.vx ⇒ người xem đoán
     vượt lên trước rồi bị kéo lùi (giật, trông như chạy nhanh). */
  let lastPosCall = 0, svx = 0, svz = 0, stillSince = 0, sent = null;
  const posHist = [];          // [thời điểm, x, z] trong ~0,4 s gần nhất
  function sendPos(now, movingNow) {
    const dt = lastPosCall ? Math.min(0.5, Math.max(0, (now - lastPosCall) / 1000)) : 0; lastPosCall = now;
    // vận tốc thật đo trên một khoảng ≥ 0,2 s (một khung hình đơn lẻ có thể rất ngắn ⇒ vận tốc vọt lên)
    const prev = posHist[posHist.length - 1];
    if (prev && Math.hypot(me.x - prev[1], me.z - prev[2]) > 3) posHist.length = 0;    // đổi khu / ngồi ghế: không phải đi bộ
    posHist.push([now, me.x, me.z]);
    while (posHist.length > 2 && now - posHist[1][0] >= 200) posHist.shift();
    while (posHist.length > 1 && now - posHist[0][0] > 400) posHist.shift();
    const h0 = posHist[0], span = (now - h0[0]) / 1000;
    let rvx = 0, rvz = 0;
    if (span >= 0.03) { rvx = (me.x - h0[1]) / span; rvz = (me.z - h0[2]) / span; }
    const rv = Math.hypot(rvx, rvz), vmax = 7 * (opt.speed || 1);
    if (rv > vmax) { rvx *= vmax / rv; rvz *= vmax / rv; }
    if (!wasMoving) { svx = rvx; svz = rvz; }
    else { const a = Math.min(1, dt / 0.15); svx += (rvx - svx) * a; svz += (rvz - svz) * a; }
    if (movingNow) stillSince = 0; else if (!stillSince) stillSince = now;
    const moving = movingNow || (wasMoving && now - stillSince < 250);
    const POS_MS = APP.posIntervalMs || 1200;
    if (moving) {
      let err = Infinity;
      if (sent) { const t = (now - sent.t) / 1000; err = Math.hypot(sent.x + sent.vx * t - me.x, sent.z + sent.vz * t - me.z); }
      if (!wasMoving || now - lastSend > POS_MS || (err > 0.35 && now - lastSend > 250)) {
        lastSend = now; sent = { t: now, x: me.x, z: me.z, vx: svx, vz: svz };
        ev.emit('pos', { x: +me.x.toFixed(2), y: +me.y.toFixed(2), z: +me.z.toFixed(2), r: +me.yaw.toFixed(2), vx: +svx.toFixed(2), vz: +svz.toFixed(2), s: 1 });
      }
      wasMoving = true;
    } else if (wasMoving) {
      wasMoving = false; lastSend = now; sent = null; svx = svz = 0;
      ev.emit('pos', { x: +me.x.toFixed(2), y: +me.y.toFixed(2), z: +me.z.toFixed(2), r: +me.yaw.toFixed(2), s: 0 });
      sendRest();
    }
  }
  function sendRest() { ev.emit('rest', [+me.x.toFixed(1), +me.z.toFixed(1), +me.yaw.toFixed(2), +me.y.toFixed(1)]); }

  /* ------------------------------------------------------------------
     BẢN ĐỒ NHỎ (góc màn hình): lối đi của mặt sàn hiện tại, chấm người, bấm để đi tới
     ------------------------------------------------------------------ */
  const Mini = (() => {
    let cv = null, ctx = null, base = null, key = '', box = null, last = 0;
    function attach(canvasEl) {
      cv = canvasEl; ctx = cv.getContext('2d');
      cv.addEventListener('click', e => {
        if (!box) return;
        const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * cv.width, py = (e.clientY - r.top) / r.height * cv.height;
        const x = box.x0 + (px - box.ox) / box.s, z = box.z0 + (py - box.oy) / box.s;
        if (me.mode === 'seat') standUp();
        walkTo(x, z);
      });
    }
    function build(g) {
      let i0 = g.nx, i1 = 0, j0 = g.nz, j1 = 0;
      for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) if (g.walk[j * g.nx + i]) { i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
      if (i1 < i0) return null;
      const w = i1 - i0 + 1, hgt = j1 - j0 + 1, img = document.createElement('canvas');
      img.width = w; img.height = hgt;
      const c2 = img.getContext('2d'), id = c2.createImageData(w, hgt);
      for (let j = 0; j < hgt; j++) for (let i = 0; i < w; i++) {
        const k = (j + j0) * g.nx + (i + i0), o = (j * w + i) * 4;
        if (g.walk[k]) { const f = g.floor[k], up = f > 1.2 ? 26 : f > 0.2 ? 13 : 0; id.data[o] = 238 - up; id.data[o + 1] = 242 - up; id.data[o + 2] = 250 - up / 2; id.data[o + 3] = 255; }
      }
      c2.putImageData(id, 0, 0);
      const s = Math.min((cv.width - 8) / w, (cv.height - 8) / hgt);
      return { img, x0: g.x0 + i0 * g.cell, z0: g.z0 + j0 * g.cell, s: s / g.cell, ox: (cv.width - w * s) / 2, oy: (cv.height - hgt * s) / 2, w: w * s, h: hgt * s };
    }
    function frame(now) {
      if (!cv || !opt.minimap || cv.offsetParent === null || now - last < 100) return;
      last = now;
      const space = sp(); if (!space || me.mode === 'idle') return;
      const fl = space.floorOf(me.y + 0.1), k = me.space + ':' + fl;
      if (k !== key) { key = k; box = null; setTimeout(() => { const g = space.grid(fl); if (key === k) box = build(g); }, 0); }
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!box) return;
      ctx.drawImage(box.img, box.ox, box.oy, box.w, box.h);
      const P = (x, z) => [box.ox + (x - box.x0) * box.s, box.oy + (z - box.z0) * box.s];
      ctx.fillStyle = '#3b82f6';
      for (const o of others.values()) if (Math.abs(o.y - me.y) < 2.6) { const [x, y] = P(o.x, o.z); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
      if (route && route.pts.length) { const t = route.pts[route.pts.length - 1], [x, y] = P(t.x, t.z); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.stroke(); }
      if (me.space === 'campus') { const [x, y] = P(0, -2.2); ctx.fillStyle = '#7c3aed'; ctx.fillRect(x - 6, y - 2, 12, 4); }
      if (playMode && me.space === 'campus' && window.Games) { ctx.fillStyle = '#f97316'; for (const t of Games.trashItems()) { const [x, y] = P(t.x, t.z); ctx.fillRect(x - 2, y - 2, 4, 4); } }   // rác cần nhặt
      const [x, y] = P(me.x, me.z);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-me.yaw + Math.PI);
      ctx.fillStyle = '#16a34a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    return { attach, frame, reset() { key = ''; box = null; } };
  })();

  /* ------------------------------------------------------------------
     NHÂN VIÊN ẢO (NPC): bảo vệ, thủ thư, thầy/cô trực phòng 401
     Chỉ xuất hiện 8:00–21:00 giờ Hà Nội, có nhãn "NPC", KHÔNG tính vào số người online.
     Mỗi máy tự dựng nên ai cũng thấy họ ở cùng chỗ.
     ------------------------------------------------------------------ */
  const Npc = (() => {
    const outfit = (eq, colors, body) => ({ body: Object.assign({ skin: '#e2b48f', build: 'vua', height: 0.97 }, body || {}), equipped: Object.assign({ hair: null, top: null, bottom: null, footwear: null, card: null, hat: null, bag: null, eyewear: null, mask: null, audio: null, handheld: null }, eq), overrides: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, { colors: { main: v } }])) });
    const DEFS = [
      { id: 'bao-ve', icon: '🛡️', name: 'Chú bảo vệ', role: 'Bảo vệ thư viện', zone: 'campus', where: 'Cửa chính thư viện',
        style: outfit({ hair: 'toc-ngan', top: 'ao-so-mi-xanh', bottom: 'quan-au', footwear: 'giay-luoi', hat: 'mu-luoi-trai' }, { 'ao-so-mi-xanh': '#5d7a52', 'quan-au': '#2b2f36', 'mu-luoi-trai': '#33452f' }, { build: 'dam', height: 1.0, skin: '#c99872' }),
        place: () => ({ x: 3.3, y: 1.5, z: -0.9, ry: 0.35 }),
        lines: ['Chào bạn! Thư viện mở cửa từ 8 giờ sáng đến 9 giờ tối.', 'Nhớ giữ trật tự và đeo thẻ sinh viên nhé.', 'Muốn lên tầng 6, 7 hay sân thượng tầng 10 thì đi thang máy trong sảnh.', 'Trời tối rồi thì về sớm, giữ sức khoẻ cho mùa thi nhé!'] },
      { id: 'thu-thu', icon: '📚', name: 'Cô thủ thư', role: 'Thủ thư', zone: 'lib_a', where: 'Quầy lễ tân tầng 1',
        style: outfit({ hair: 'toc-buoc', top: 'ao-so-mi-xanh', bottom: 'vay-chu-a', footwear: 'giay-luoi', eyewear: 'kinh-tron' }, { 'ao-so-mi-xanh': '#f1ece2', 'vay-chu-a': '#3b3f58' }, { build: 'thon', height: 0.95 }),
        seatNear: { x: 0, z: 9.4, y: 0 },
        lines: ['Chào bạn, phòng tự học 401 ở tầng 4 nhé.', 'Trong thư viện mình nói khẽ thôi nha 🤫', 'Tầng 6 có đàn piano, tầng 10 có kính thiên văn để ngắm sao.', 'Bạn bấm vào ghế trống nào cũng ngồi được.'] },
      { id: 'giang-vien', icon: '👩‍🏫', name: 'Cô trực phòng 401', role: 'Giảng viên trực phòng tự học', zone: 'lib_a', where: 'Phòng 401 (tầng 4)',
        style: outfit({ hair: 'toc-bob', top: 'ao-so-mi-caro', bottom: 'quan-kaki', footwear: 'giay-luoi', eyewear: 'kinh-vuong', handheld: 'sach' }, { 'quan-kaki': '#4a4f5c' }, { build: 'vua', height: 0.96, skin: '#e8bf9e' }),
        front401: true,
        lines: ['Học 25 phút rồi nghỉ 5 phút cho đầu óc tỉnh táo nhé.', 'Bài nào khó thì đăng lên mục Hỏi bài, các bạn sẽ giúp.', 'Mỗi 5 phút có một câu hỏi chung, làm thử để ôn lại kiến thức.', 'Cố lên, mùa thi sắp qua rồi! 💪', 'Ngủ đủ giấc trước hôm thi quan trọng không kém ôn bài đâu.'] }
    ];
    DEFS.push(
      { id: 'thu-khoa', icon: '🎓', name: 'Anh thủ khoa', role: 'Cho "vía chăm chỉ" (chế độ Dạo chơi)', zone: 'campus', where: 'Sân trước thư viện, cạnh ghế đá trái', play: true,
        style: outfit({ hair: 'toc-mai-lech', top: 'ao-polo-truong', bottom: 'quan-kaki', footwear: 'giay-sneaker', hat: 'mu-tot-nghiep', eyewear: 'kinh-vuong' }, { 'quan-kaki': '#3d4350' }, { height: 1.0 }),
        place: () => ({ x: -10.5, y: 0, z: 13.2, ry: Math.PI / 2 }),
        lines: ['Xếp hàng xin vía chăm chỉ nào! Học đâu nhớ đó, thi đâu trúng đó ✨', 'Bí quyết của anh: ngủ đủ, học đều mỗi ngày một chút.', 'Làm lại đề các năm trước là cách ôn hiệu quả nhất đó.'] },
      { id: 'tho-anh', icon: '📸', name: 'Chị thợ ảnh', role: 'Chụp ảnh lưu niệm với chữ HUST (chế độ Dạo chơi)', zone: 'campus', where: 'Trước chữ HUST trên sân', play: true,
        style: outfit({ hair: 'toc-bui', top: 'ao-khoac-gio', bottom: 'quan-jean', footwear: 'giay-chay', bag: 'tui-deo-cheo', hat: 'mu-bucket' }, { 'ao-khoac-gio': '#e46b4a' }, { build: 'thon' }),
        place: () => ({ x: 2.6, y: 0, z: 19.6, ry: Math.PI + 0.25 }),
        lines: ['Đứng trước chữ HUST, cười tươi nào! 📸', 'Ảnh lưu niệm tải về máy được nhé.', 'Rủ bạn bè đứng cạnh cho ảnh vui hơn!'] });
    let live = [], lastCheck = 0, hoursOpen = null;
    const open = () => { const h = U.hanoiParts().h; return h >= 8 && h < 21; };
    /* vị trí từng NPC trong không gian hiện tại */
    function pose(def, space) {
      if (def.place) return Object.assign({ seat: -1 }, def.place());
      if (def.seatNear) {
        let best = -1, bd = 1.6;
        space.seats.forEach((s, i) => { const d = Math.hypot(s.x - def.seatNear.x, s.z - def.seatNear.z) + Math.abs(s.y - def.seatNear.y); if (d < bd) { bd = d; best = i; } });
        if (best >= 0) { const s = space.seats[best]; return { x: s.x, y: s.y, z: s.z, ry: s.ry, seat: best }; }
        return null;
      }
      if (def.front401) {   // đứng trước các dãy ghế phòng 401, quay mặt về phía sinh viên
        const ss = space.seats.filter(s => s.room === '401'); if (!ss.length) return null;
        let cx = 0, cz = 0, fx = 0, fz = 0; for (const s of ss) { cx += s.x; cz += s.z; fx += Math.sin(s.ry); fz += Math.cos(s.ry); }
        cx /= ss.length; cz /= ss.length; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        let d = 0; for (const s of ss) d = Math.max(d, (s.x - cx) * fx + (s.z - cz) * fz);
        const y = ss[0].y, f = space.floorOf(y + 0.1);
        for (const k of [1.6, 1.2, 2.2, 0.8]) { const x = cx + fx * (d + k), z = cz + fz * (d + k); if (space.free(x, z, f)) return { x, y: f, z, ry: Math.atan2(-fx, -fz), seat: -1 }; }
        return { x: cx + fx * (d + 1.4), y: f, z: cz + fz * (d + 1.4), ry: Math.atan2(-fx, -fz), seat: -1 };
      }
      return null;
    }
    function clear() { for (const n of live) { n.av.dispose(); n.label.remove(); } live = []; }
    function sync() {
      clear();
      hoursOpen = open();
      if (!AVK || !S || !me.zone || !hoursOpen) return;
      const space = sp(); if (!space) return;
      for (const def of DEFS) {
        if (def.zone !== me.zone || (def.play && !playMode)) continue;
        const p = pose(def, space); if (!p) continue;
        const av = new AVK.Avatar(def.style, { name: def.name });
        av.root.position.set(p.x, p.y, p.z); av.root.rotation.y = p.ry;
        if (p.seat >= 0) av.setSit(true, true, 'chair');
        space.group.add(av.root);
        const label = U.h('div.po-tag.npc', null, U.h('div.po-bubble'), U.h('div.po-name', { text: def.icon + ' ' + def.name }), U.h('span.po-npc', { text: 'NPC' }));
        label.addEventListener('click', () => ev.emit('npc-click', def));
        labelsEl.appendChild(label);
        live.push({ def, av, label, x: p.x, y: p.y, z: p.z, seat: p.seat, t: Math.random() * 10 });
      }
    }
    function frame(dt, camera) {
      const now = performance.now();
      if (now - lastCheck > 30000) { lastCheck = now; if (open() !== hoursOpen) sync(); }
      const W = labelsEl.clientWidth, Hh = labelsEl.clientHeight;
      for (const n of live) {
        n.t += dt; n.av.update(dt, 0);
        n.av.root.getWorldPosition(tmp); const d = tmp.distanceTo(camera.position);
        n.av.setDetail && n.av.setDetail(d < 14);
        const el = n.label;
        if (d > 22 || (me.space !== 'campus' && Math.abs(n.y - me.y) > 2.6)) { el.style.display = 'none'; continue; }
        tmp.y += n.seat >= 0 ? 1.5 : 1.95; tmp.project(camera);
        if (tmp.z > 1 || Math.abs(tmp.x) > 1.2 || Math.abs(tmp.y) > 1.2) { el.style.display = 'none'; continue; }
        el.style.display = ''; el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px,${((1 - tmp.y) / 2 * Hh).toFixed(1)}px) translate(-50%,-100%)`;
      }
    }
    /* bấm vào NPC trên màn hình */
    function pick() {
      const hits = ray.intersectObjects(live.map(n => n.av.hit), false);
      return hits[0] ? live.find(n => n.av.hit === hits[0].object).def : null;
    }
    function say(def, text) { const n = live.find(x => x.def === def); if (!n) return; const b = n.label.querySelector('.po-bubble'); b.textContent = text; n.label.classList.add('talk'); clearTimeout(n.label._bt); n.label._bt = setTimeout(() => n.label.classList.remove('talk'), 5000); }
    /* danh sách cho tab "Mọi người" (cả những NPC ở khu khác) */
    function directory() {
      const out = [];
      for (const def of DEFS) {
        const space = S.spaces[(ZONES[def.zone] || {}).space]; if (!space) continue;
        const p = pose(def, space); if (p) out.push({ def, at: { x: p.x, y: p.y, z: p.z }, open: open() });
      }
      return out;
    }
    const emote = (id, k) => { const n = live.find(x => x.def.id === id); if (n) n.av.playEmote(k); };
    function reservedSeats() {
      const space = sp(); if (!space || !open()) return [];
      const out = [];
      for (const def of DEFS) {
        if (def.zone !== me.zone || (def.play && !playMode)) continue;
        const p = pose(def, space); if (p && p.seat >= 0) out.push({ id: def.id, seat: p.seat });
      }
      return out;
    }
    return { sync, clear, frame, pick, say, emote, list: () => live, directory, open, reservedSeats };
  })();

  /* ------------------------------------------------------------------
     CHẾ ĐỘ QUAN SÁT (chỉ ban tổ chức)
     ------------------------------------------------------------------ */
  function setObserve(on) {
    const space = sp(); if (!space) return;
    if (on && !observe) {
      route = null; observe = { mode: me.mode };
      const api = space.module.api;
      if (space.kind === 'room' && me.mode === 'walk') api.ext(true);
      api.orbit(me.x, me.y + 1.5, me.z);
      ev.emit('observe', true);
    } else if (!on && observe) {
      const m = observe.mode; observe = null;
      space.module.api.ext(true); cam.ready = false; cam.cur = null;
      if (m === 'walk') { space.walkNow(me.x, space.floorOf(me.y + 0.1), me.z, Math.PI - me.yaw); }
      ev.emit('observe', false);
    }
  }

  window.World = {
    ev, me, opt, init, go, setPresence, onPos, setInfo, bubble, changeSeat, goSit, standUp, walkTo, setRain, setObserve,
    attachMinimap: c => Mini.attach(c),
    setMe(uid, style, name, mssv) {
      me.uid = uid; me.style = style; me.name = name; me.mssv = mssv || '';
      if (me.avatar) { me.avatar.setStyle(style); me.avatar.setCard && me.avatar.setCard(name, me.mssv); }
      updateMyLabel();
    },
    setStyle(style) { me.style = style; if (me.avatar) me.avatar.setStyle(style); },
    setStatus(st) { me.status = st; updateMyLabel(); },
    setBubbles(on) {
      bubblesOn = on;
      if (!on) for (const o of others.values()) {
        const box = o.label.querySelector('.po-bubbles'); if (box) box.replaceChildren();
        o.label.classList.remove('talk');
      }
    },
    setOpt(o) { const next = Object.assign({}, o); if (liftCameraLocked()) delete next.view; Object.assign(opt, next); U.store.set('view', opt); applyOpt(); },
    others, info, presence: () => presence,
    peopleHere() { return presence.filter(p => p.zone === me.zone && p.uid !== me.uid); },
    nearBuilding: () => nearB,
    seatKind: () => { const s = sp() && sp().seats[me.seat]; return s ? s.kind : null; },
    nearThing: () => nearThing,
    nearSeat: () => (nearSeat >= 0 ? nearSeat : null),
    sitPiano() { const space = sp(), i = space ? space.seats.findIndex(x => x.kind === 'piano') : -1; if (i >= 0) goSit(i); },
    sitNearest, goNear, whereIs, isNear, emote,
    setAct, pruneActs, clearBubbles, actOf: uid => (acts.get(uid) || {}).k || null,      // [act]
    /* chế độ Dạo chơi: hiện NPC mini-game, rác trên sân… */
    setPlay(on) { playMode = !!on; Npc.sync(); for (const f of hooks.zone) f(me.zone); },
    get play() { return playMode; },
    setCup(kind) { if (me.avatar && me.avatar.setHeld) me.avatar.setHeld(kind); },
    /* dùng cho js/games.js */
    hooks, sp, placeNear, avOf, setNear(t) { if (t !== nearThing) { nearThing = t; ev.emit('near-thing', t); } },
    holdCam(p, t) { camHold = p ? { p, t } : null; }, freeze(on) { frozen = !!on; if (on) { route = null; resetInput(); } },
    get camera() { return viewCam(); },                    // camera như đang hiện trên màn hình
    goToPerson(uid) { const w = whereIs(uid); if (w) goNear(w.zone, w); return !!w; },
    npcs: () => Npc.directory(), npcSay: (def, t) => Npc.say(def, t), npcEmote: (id, k) => Npc.emote(id, k),
    /* kính thiên văn (đứng gần) hoặc nằm ngắm sao (đang ngồi ghế nằm) — chỉ có ở sân thượng tầng 10 */
    special(kind) {
      const space = sp(); if (!space || !space.scope) return;
      route = null;
      if (kind === 'scope' && me.mode === 'walk') { me.special = 'scope'; setMode('piano'); space.scope(); }
      if (kind === 'gaze' && me.mode === 'seat') { const s = space.seats[me.seat]; if (!s || s.kind !== 'lounger') return; me.special = 'gaze'; setMode('piano'); space.gaze(s.x, s.z - 0.35); }
    },
    gotoBuildingDoor(id) { const b = S.buildings.find(x => x.id === id); if (b && (me.mode === 'campus' || me.mode === 'seat') && me.space === 'campus') walkTo(b.door.x, b.door.z, enterLibrary, 0.6); },
    enterLibrary
  };
})();
