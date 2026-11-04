/* =====================================================================
   MINI-GAME Ở SÂN TRƯỚC THƯ VIỆN (chỉ trong chế độ "Dạo chơi")
     🗑️ Nhặt rác      → +1 "Điểm tình nguyện ảo 🌱" (máy chủ giới hạn 30 lần/ngày)
     🥭 Hái xoài      → chọc gậy cho quả rơi, chấm muối tôm, nhận giấy chứng nhận (mang tính giải trí) 1 lần/ngày
     🙏 Xin vía       → xếp hàng trước "Anh thủ khoa" (NPC), tới lượt thì nhận "vía chăm chỉ" hôm nay ✨
     📸 Chụp ảnh      → đứng trước chữ HUST, "Chị thợ ảnh" (NPC) chụp ảnh lưu niệm tải về được
   Phần giao diện (nút, hộp thoại, giấy chứng nhận) nằm ở js/app.js; file này lo phần 3D.
   ===================================================================== */
(function () {
  'use strict';
  const ev = U.emitter();
  const V3 = THREE.Vector3;
  let W = null, S = null, play = false, zone = null;
  const trash = { group: null, items: [], hour: -1 };
  let nearTree = null, falling = [];

  function init(scene) {
    S = scene; W = window.World;
    W.hooks.frame.push(frame);
    W.hooks.pick.push(pick);
    W.hooks.zone.push(z => { zone = z; refresh(); });
    W.hooks.after.push(() => { if (shot.want) { shot.want = false; shot.done(S.renderer.domElement); } });
  }
  function setPlay(on) { play = !!on; refresh(); }
  function refresh() {
    const on = play && zone === 'campus';
    if (on) spawnTrash(); else clearTrash();
    if (!on) W.setNear(null);
  }
  const campus = () => S.spaces.campus;

  /* ---------------- RÁC ---------------- */
  const TRASH_KINDS = [
    { k: 'giay', mk: () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.9, flatShading: true })), y: 0.07 },
    { k: 'chai', mk: () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.7, roughness: 0.15 })); m.rotation.z = Math.PI / 2; return m; }, y: 0.036 },
    { k: 'lon', mk: () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xc8352f, roughness: 0.35, metalness: 0.6 })); m.rotation.z = Math.PI / 2; return m; }, y: 0.034 },
    { k: 'tui', mk: () => new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, transparent: true, opacity: 0.85 })), y: 0.012 }
  ];
  const HITG = new THREE.SphereGeometry(0.4, 8, 6), HITM = new THREE.MeshBasicMaterial({ visible: false });
  function rng(seed) { let h = seed >>> 0; return () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; }; }
  /* mỗi giờ một bộ vị trí (mọi máy giống nhau); nhặt rồi thì vài phút sau rác mới xuất hiện chỗ khác */
  function spawnTrash() {
    const c = campus(); if (!c) return;
    const hour = Math.floor(U.now() / 3600e3);
    if (trash.group && trash.hour === hour) return;
    clearTrash(); trash.hour = hour;
    trash.group = new THREE.Group(); c.group.add(trash.group);
    const R = rng(hour * 7919 + 13);
    for (let i = 0; i < 12; i++) addTrash(R);
  }
  function addTrash(R) {
    const c = campus(), g = c.grid();
    for (let tries = 0; tries < 60; tries++) {
      const x = -32 + R() * 64, z = 3 + R() * 26;
      if (!c.free(x, z) || Math.abs(x) < 4 && z > 10.5 && z < 14.5) continue;     // không rơi vào chữ HUST
      const K = TRASH_KINDS[Math.floor(R() * TRASH_KINDS.length)], m = K.mk(), y = c.floorAt(x, z);
      m.position.set(x, y + K.y, z); m.rotation.y = R() * 6.28; m.castShadow = true;
      const hit = new THREE.Mesh(HITG, HITM); hit.position.copy(m.position);
      trash.group.add(m, hit);
      trash.items.push({ m, hit, x, z, y });
      return;
    }
  }
  function clearTrash() {
    if (!trash.group) return;
    trash.group.traverse(o => { if (o.geometry && o.geometry !== HITG) o.geometry.dispose(); if (o.material && o.material !== HITM) o.material.dispose(); });
    trash.group.parent && trash.group.parent.remove(trash.group);
    trash.group = null; trash.items = []; trash.hour = -1;
  }
  function pick(ray) {
    if (!play || zone !== 'campus' || !trash.items.length) return false;
    const h = ray.intersectObjects(trash.items.map(t => t.hit), false)[0]; if (!h) return false;
    const t = trash.items.find(x => x.hit === h.object), me = W.me;
    if (Math.hypot(t.x - me.x, t.z - me.z) < 2.6) ev.emit('trash', t);
    else W.walkTo(t.x, t.z, () => ev.emit('trash', t), 1.4);
    return true;
  }
  /* app gọi sau khi máy chủ xác nhận */
  function removeTrash(t) {
    const i = trash.items.indexOf(t); if (i < 0) return;
    trash.items.splice(i, 1); trash.group.remove(t.m, t.hit); t.m.geometry.dispose(); t.m.material.dispose();
    W.emote(W.me.uid, 'cui-chao');
    setTimeout(() => { if (trash.group) addTrash(Math.random); }, 150e3);
  }

  /* ---------------- XOÀI ---------------- */
  function frame(dt, now) {
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i]; f.v -= 9.8 * dt; f.m.position.y += f.v * dt; f.m.rotation.x += dt * 4;
      if (f.m.position.y <= f.ground + 0.06) { if (f.bounce) { f.v = -f.v * 0.3; f.bounce--; f.m.position.y = f.ground + 0.06; } else { f.m.position.y = f.ground + 0.06; falling.splice(i, 1); f.done && f.done(); } }
    }
    if (!play || zone !== 'campus' || !W.me || (W.me.mode !== 'campus' && W.me.mode !== 'seat') || game.busy) return;
    const me = W.me, c = campus();
    // gần cây xoài / anh thủ khoa / chữ HUST?
    let near = null; nearTree = null;
    for (const t of c.mango || []) if (Math.hypot(t.x - me.x, t.z - me.z) < 5.2) { near = 'mango'; nearTree = t; break; }
    if (!near) for (const n of W.npcs()) {
      if (!n.open || n.def.zone !== 'campus') continue;
      const d = Math.hypot(n.at.x - me.x, n.at.z - me.z);
      if (n.def.id === 'thu-khoa' && d < 6) near = 'via';
      if (n.def.id === 'tho-anh' && d < 6) near = 'photo';
    }
    if (!near && Math.hypot(me.x, me.z - 14.5) < 4.5) near = 'photo';
    W.setNear(near);
  }
  const game = { busy: false };
  /* bắt đầu hái: cầm gậy, quay mặt vào cây */
  function mangoStart() {
    const t = nearTree; if (!t) return null;
    game.busy = true; game.tree = t;
    const me = W.me; if (me.mode === 'seat') W.standUp();
    me.yaw = Math.atan2(t.x - me.x, t.z - me.z);
    W.freeze(true); W.setCup('stick');
    return t;
  }
  function mangoPoke() { W.avOf(W.me.uid).playEmote('choc'); }
  /* quả rơi xuống trước mặt mình */
  function mangoDrop(done) {
    const t = game.tree, me = W.me, c = campus();
    let src = (t.fruits || []).find(f => f.visible), from;
    if (src) { from = src.getWorldPosition(new V3()); src.visible = false; setTimeout(() => { src.visible = true; }, 90e3); }
    else from = new V3(t.x, 4.5, t.z);
    c.group.worldToLocal(from);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshStandardMaterial({ color: 0x8cbf3f, roughness: 0.5 }));
    m.scale.set(0.8, 1.2, 0.8); m.position.copy(from);
    const tx = me.x + Math.sin(me.yaw) * 0.7, tz = me.z + Math.cos(me.yaw) * 0.7;
    m.position.x += (tx - m.position.x) * 0.6; m.position.z += (tz - m.position.z) * 0.6;
    c.group.add(m);
    falling.push({ m, v: 0, ground: c.floorAt(m.position.x, m.position.z), bounce: 1, done: () => setTimeout(() => { c.group.remove(m); m.geometry.dispose(); m.material.dispose(); W.setCup('mango'); done && done(); }, 500) });
    W.setCup(null);
  }
  function mangoEat() { W.avOf(W.me.uid).playEmote('an'); }
  function mangoEnd() { game.busy = false; W.freeze(false); W.setCup(null); }

  /* ---------------- XIN VÍA ---------------- */
  function npcAt(id) { const n = W.npcs().find(x => x.def.id === id); return n ? n.at : null; }
  /* chỗ đứng thứ k trong hàng (hàng kéo dài về phía đông, trước mặt anh thủ khoa) */
  function queueSpot(k) { const a = npcAt('thu-khoa'); return a ? { x: a.x + 1.3 + k * 0.95, z: a.z } : null; }
  function standAt(p, faceX, faceZ) {
    const me = W.me; if (me.mode === 'seat') W.standUp();
    W.walkTo(p.x, p.z, () => { me.yaw = Math.atan2(faceX - me.x, faceZ - me.z); }, 0.3);
  }

  /* ---------------- CHỤP ẢNH ---------------- */
  const shot = { want: false, done: null };
  /* đặt mình đứng trước chữ HUST, camera của thợ ảnh nhìn vào; trả Promise ảnh (canvas) */
  function photoPose(others) {
    const me = W.me; if (me.mode === 'seat') W.standUp();
    let x = 0; for (const dx of [0, -0.9, 0.9, -1.8, 1.8]) { if (!others.some(o => Math.hypot(o.x - dx, o.z - 14.2) < 0.6)) { x = dx; break; } }
    me.x = x; me.z = 14.2; me.y = campus().floorAt(x, 14.2); me.yaw = 0;
    W.freeze(true);
    W.holdCam(new V3(0, 1.75, 20.4), new V3(0, 1.75, 12.6));
  }
  function photoCapture() {
    return new Promise(res => { shot.done = cv => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); res(c); }; shot.want = true; });
  }
  function photoEnd() { W.holdCam(null); W.freeze(false); }

  window.Games = { ev, init, setPlay, removeTrash, trashItems: () => trash.items, mangoStart, mangoPoke, mangoDrop, mangoEat, mangoEnd, queueSpot, npcAt, standAt, photoPose, photoCapture, photoEnd, get busy() { return game.busy; }, set busy(v) { game.busy = v; } };
})();
