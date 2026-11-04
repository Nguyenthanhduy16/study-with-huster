/* =====================================================================
   NHÂN VẬT TRONG PHÒNG — dựng bằng AvatarKit (từ "Phòng thay đồ")
   Cơ thể liền khối có xương → đi, ngồi, gõ bàn phím bằng cách xoay khớp.
   Giữ cùng giao diện với nhân vật cũ (js/avatar.js) để world.js dùng chung:
     root, update(dt, speed), setSit(on), setStyle(state), setCard(name, mssv), setDetail(near), dispose()
   ===================================================================== */
(function () {
  'use strict';
  const K = window.AvatarKit;
  if (!K) { console.warn('Không có AvatarKit — dùng nhân vật khối cũ'); return; }
  const CAT = K.CATALOG, ITEMS = new Map(CAT.items.map(i => [i.id, i]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const HIP_STAND = (0.965 - 0.045);      // độ cao khớp hông khi đứng (chưa nhân chiều cao)

  /* cấu hình gọn gửi qua mạng: cơ thể + đồ đang mặc + màu đã đổi (không kèm ảnh) */
  function normState(s) {
    const d = CAT.defaults;
    if (!s || !s.equipped) s = randomState();
    const out = { body: Object.assign({}, d.body, s.body || {}), equipped: Object.assign({}, d.equipped, s.equipped || {}), overrides: {} };
    for (const [id, ov] of Object.entries(s.overrides || {})) if (ITEMS.has(id) && ov && ov.colors) out.overrides[id] = { colors: ov.colors };
    for (const k in out.equipped) { const id = out.equipped[k]; if (id && !(ITEMS.has(id) && ITEMS.get(id).slot === k)) out.equipped[k] = d.equipped[k] || null; }   // món không còn trong tủ đồ → món mặc định
    if (s.emblem) out.emblem = s.emblem;
    return out;
  }
  /* rng: hàm ngẫu nhiên tuỳ chọn — truyền hàm có hạt giống để mọi máy dựng ra cùng một nhân vật */
  function randomState(rng) {
    const R = rng || Math.random, pick = a => a[Math.floor(R() * a.length)];
    const st = clone(CAT.defaults); st.overrides = {};
    for (const slot of CAT.slots) {
      const items = CAT.items.filter(i => i.slot === slot.id);
      const optional = ['hat', 'eyewear', 'handheld', 'mask', 'audio'].includes(slot.id);
      st.equipped[slot.id] = optional && R() < 0.6 ? null : pick(items).id;
      const it = items.find(i => i.id === st.equipped[slot.id]);
      if (it && it.palette) st.overrides[it.id] = { colors: { main: pick(it.palette) } };
    }
    st.body.skin = pick(CAT.skinTones);
    st.body.build = pick(['thon', 'vua', 'vua', 'dam']);
    return st;
  }
  function seeded(str) {
    let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  function resolve(state, id) {
    const base = ITEMS.get(id); if (!base) return null;
    const it = clone(base), ov = state.overrides && state.overrides[id];
    if (ov && ov.colors) it.colors = Object.assign({}, it.colors, ov.colors);
    return it;
  }

  /* ---- thu nhỏ ảnh vải để tiết kiệm bộ nhớ đồ hoạ khi có nhiều người ---- */
  function shrinkMaps(obj, max) {
    obj.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) for (const k of ['map', 'alphaMap']) {
        const t = m[k], img = t && t.image;
        if (!img || !img.width || img.width <= max || !(img instanceof HTMLCanvasElement)) continue;
        const r = max / Math.max(img.width, img.height), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * r)); c.height = Math.max(1, Math.round(img.height * r));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        t.image = c; t.needsUpdate = true;
      }
    });
  }
  const emblemCache = new Map();
  function emblemCanvas(em) { const k = JSON.stringify(em); if (!emblemCache.has(k)) emblemCache.set(k, K.drawEmblem(em)); return emblemCache.get(k); }

  /* ---- hàng đợi dựng: mỗi lần một nhân vật để không giật khung hình ---- */
  const queue = []; let busy = false;
  function enqueue(fn) { queue.push(fn); if (!busy) pump(); }
  function pump() {
    if (K.isReady && !K.isReady()) { busy = true; K.ready.then(pump, pump); return; }   // chờ ảnh logo/huy hiệu của tủ đồ tải xong
    const fn = queue.shift(); if (!fn) { busy = false; return; }
    busy = true;
    setTimeout(() => { try { fn(); } catch (e) { console.error(e); } pump(); }, 30);
  }

  const EMOTES_HIDDEN = { 'choc': { d: 1.2 }, 'an': { d: 2.2 } };
  const EMOTES = {
    'vay': { d: 2.2, icon: '👋', label: 'Vẫy tay' }, 'co-vu': { d: 2.4, icon: '🙌', label: 'Cổ vũ' }, 'thich': { d: 1.8, icon: '👍', label: 'Thích' },
    'cui-chao': { d: 1.6, icon: '🙇', label: 'Cúi chào' }, 'vuon-vai': { d: 3.0, icon: '🤸', label: 'Vươn vai' }
  };
  /* hoạt động kéo dài (cầm đồ + tư thế lặp) tới khi người chơi đi, chọn cái khác hoặc bấm "Dừng" */
  const ACTS = {
    'doc': { icon: '📖', label: 'Đọc sách' },
    'dien-thoai': { icon: '📱', label: 'Bấm điện thoại' },
    'laptop': { icon: '💻', label: 'Dùng laptop' }
  };
  /* ---- đạo cụ dựng bằng khối đơn giản (đơn vị: mét của bộ xương, gắn vào xương thân) ---- */
  const PROP_MAT = {};
  const pmat = (c, o) => { const k = c + JSON.stringify(o || {}); return PROP_MAT[k] || (PROP_MAT[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.65 }, o || {}))); };
  const PROP_GEO = {};
  const box = (w, h, d) => { const k = w + ':' + h + ':' + d; if (!PROP_GEO[k]) { PROP_GEO[k] = new THREE.BoxGeometry(w, h, d); PROP_GEO[k].userData.keep = true; } return PROP_GEO[k]; };
  const BOOK_COVERS = ['#2f5d9e', '#a8432f', '#2f7a4f', '#7a3f8f', '#c58a1e'];
  function buildProp(kind, seed) {
    const g = new THREE.Group(); g.name = 'act-prop';
    const add = (geo, m, x, y, z, rx, ry, rz, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; (parent || g).add(o); return o; };
    if (kind === 'doc') {                      // sách mở hình chữ V, gáy sách chạy theo trục Z của sách
      const cover = pmat(BOOK_COVERS[Math.abs(seed | 0) % BOOK_COVERS.length]), paper = pmat('#f6f1e4', { roughness: 0.9 }), ink = pmat('#9aa0ad', { roughness: 0.9 });
      for (const s of [1, -1]) {
        const half = new THREE.Group(); half.rotation.z = s * 0.16; g.add(half);
        add(box(0.13, 0.006, 0.19), cover, s * 0.065, -0.006, 0, 0, 0, 0, half);
        add(box(0.122, 0.014, 0.18), paper, s * 0.063, 0.004, 0, 0, 0, 0, half);
        for (let i = 0; i < 6; i++) add(box(0.09, 0.001, 0.007), ink, s * 0.065, 0.0115, -0.06 + i * 0.024, 0, 0, 0, half);
      }
    } else if (kind === 'dien-thoai') {
      add(box(0.072, 0.009, 0.15), pmat('#22252c', { roughness: 0.35 }), 0, 0, 0);
      add(box(0.064, 0.002, 0.136), pmat('#7fc4ff', { emissive: '#3b8fe0', emissiveIntensity: 0.9, roughness: 0.2 }), 0, 0.0055, 0);
    } else if (kind === 'laptop') {          // phía người dùng = −Z, bản lề ở +Z
      const al = pmat('#b9bec8', { metalness: 0.4, roughness: 0.4 });
      add(box(0.32, 0.018, 0.22), al, 0, 0, 0);
      add(box(0.28, 0.003, 0.1), pmat('#2b2f38'), 0, 0.0095, 0.025);
      add(box(0.09, 0.002, 0.05), pmat('#9298a4'), 0, 0.0095, -0.07);
      const hinge = new THREE.Group(); hinge.position.set(0, 0.009, 0.108); hinge.rotation.x = 0.32; g.add(hinge);
      add(box(0.32, 0.21, 0.01), al, 0, 0.105, 0, 0, 0, 0, hinge);
      add(box(0.29, 0.18, 0.002), pmat('#9fd0ff', { emissive: '#4a8fd8', emissiveIntensity: 0.85, roughness: 0.25 }), 0, 0.108, -0.006, 0, 0, 0, hinge);
      if (K.createLaptopLogo) {
        const logo = K.createLaptopLogo({ height: 0.046 });
        logo.position.set(0, 0.108, 0.0058); hinge.add(logo);
      }
    }
    return g;
  }
  const _o = new THREE.Object3D(), _v = new THREE.Vector3();
  const POLE_L = new THREE.Vector3(0.6, -1, -0.35), POLE_R = new THREE.Vector3(-0.6, -1, -0.35);
  /* pos/rot: đạo cụ trong toạ độ xương thân (gốc ở khớp hông, +Z phía trước, +X bên trái nhân vật)
     L/R: cổ tay trái/phải trong toạ độ đạo cụ · head: cúi đầu · tap: tay nào gõ */
  const ACT_PLACE = {
    'doc': {
      stand: { pos: [0, 0.24, 0.3], rot: [-0.8, 0, 0], L: [0.17, -0.03, -0.02], R: [-0.17, -0.03, -0.02], head: 0.4 },
      desk: { pos: [0, 0.22, 0.31], rot: [-0.8, 0, 0], L: [0.17, -0.03, -0.02], R: [-0.17, -0.03, -0.02], head: 0.38 },
      lap: { pos: [0, 0.22, 0.3], rot: [-0.8, 0, 0], L: [0.17, -0.03, -0.02], R: [-0.17, -0.03, -0.02], head: 0.38 },
      lie: { pos: [0, 0.45, 0.33], rot: [-1.05, 0, 0], L: [0.17, -0.03, -0.02], R: [-0.17, -0.03, -0.02], head: 0.12 }
    },
    'dien-thoai': {
      stand: { pos: [-0.03, 0.21, 0.27], rot: [-0.8, 0, 0.1], R: [-0.015, -0.02, 0.0], L: [0.04, -0.02, 0.03], head: 0.5, tap: 'L' },
      desk: { pos: [-0.03, 0.2, 0.28], rot: [-0.8, 0, 0.1], R: [-0.015, -0.02, 0.0], L: [0.04, -0.02, 0.03], head: 0.48, tap: 'L' },
      lap: { pos: [-0.03, 0.2, 0.28], rot: [-0.8, 0, 0.1], R: [-0.015, -0.02, 0.0], L: [0.04, -0.02, 0.03], head: 0.48, tap: 'L' },
      lie: { pos: [-0.03, 0.46, 0.3], rot: [-1.0, 0, 0.1], R: [-0.015, -0.02, 0.0], L: [0.04, -0.02, 0.03], head: 0.15, tap: 'L' }
    },
    'laptop': {
      stand: { pos: [0.02, 0.17, 0.28], rot: [-0.05, 0.1, 0], L: [0.03, -0.035, 0.02], R: [-0.06, 0.03, -0.1], head: 0.34, tap: 'R' },
      desk: { pos: [0, 0.25, 0.42], rot: [-0.06, 0, 0], L: [0.08, 0.03, -0.12], R: [-0.08, 0.03, -0.12], head: 0.3, tap: 'both' },
      lap: { pos: [0, 0.08, 0.3], rot: [-0.06, 0, 0], L: [0.08, 0.03, -0.12], R: [-0.08, 0.03, -0.12], head: 0.4, tap: 'both' },
      lie: { pos: [0, 0.2, 0.26], rot: [0.8, 0, 0], L: [0.08, 0.03, -0.12], R: [-0.08, 0.03, -0.12], head: 0.15, tap: 'both' }
    }
  };
  /* IK hai đoạn: đưa cổ tay tới điểm T (toạ độ của xương thân), khuỷu tay hướng theo P (cũng theo xương thân) */
  const _t = new THREE.Vector3(), _w0 = new THREE.Vector3(), _e = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Vector3();
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  function reach(j, side, T, pole, w) {
    const sh = j['shoulder' + side], el = j['elbow' + side], wr = j['wrist' + side]; if (!sh || !el || !wr) return;
    const L1 = Math.abs(el.position.y) || 0.28, L2 = Math.abs(wr.position.y) || 0.25;
    _t.copy(T).sub(sh.position);
    const d = Math.max(Math.abs(L1 - L2) + 0.03, Math.min(L1 + L2 - 0.004, _t.length()));
    const bend = Math.PI - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
    _w0.set(0, -L1 - L2 * Math.cos(bend), L2 * Math.sin(bend)).normalize();
    _t.normalize(); _q.setFromUnitVectors(_w0, _t);
    // xoay quanh trục vai→cổ tay để khuỷu tay chỉ về phía "pole" (ra ngoài, xuống dưới)
    _e.set(0, -1, 0).applyQuaternion(_q); _e.addScaledVector(_t, -_e.dot(_t));
    _p.copy(pole).addScaledVector(_t, -pole.dot(_t));
    if (_e.lengthSq() > 1e-6 && _p.lengthSq() > 1e-6) { const a = Math.atan2(_t.dot(_c.crossVectors(_e, _p)), _e.dot(_p)); _q2.setFromAxisAngle(_t, a); _q.premultiply(_q2); }
    sh.quaternion.slerp(_q, w);
    el.rotation.x += (-bend - el.rotation.x) * w; el.rotation.y *= 1 - w; el.rotation.z *= 1 - w;
  }
  /* ảnh thẻ sinh viên (tên + MSSV đã che) để hiện trong hồ sơ */
  function cardImage(style, name, mssv, w = 340) {
    const st = normState(style), em = st.emblem || CAT.defaults.emblem;
    const big = K.drawStudentCard(Object.assign({}, CAT.defaults.card, { name: name || 'Sinh viên', id: mssv || '', major: 'Phòng ôn thi ảo', cohort: 'Mùa thi 2026', photo: null, template: null }), emblemCanvas(em), em);
    const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * big.height / big.width);
    c.getContext('2d').drawImage(big, 0, 0, c.width, c.height); return c;
  }
  const HITBOX = new THREE.BoxGeometry(0.62, 1.8, 0.5); HITBOX.translate(0, 0.9, 0);
  const HITMAT = new THREE.MeshBasicMaterial({ visible: false });
  const FAR_HIDE = new Set(['card', 'bag', 'eyewear', 'mask', 'audio', 'handheld', 'hat', 'footwear']);

  class Avatar {
    constructor(state, opts = {}) {
      this.opts = opts;
      this.root = new THREE.Group();
      this.inner = new THREE.Group(); this.root.add(this.inner);
      this.hit = new THREE.Mesh(HITBOX, HITMAT); this.root.add(this.hit);
      this.phase = Math.random() * 10; this.walk = 0; this.sit = false; this.near = true; this.desk = true;
      this.name = opts.name || ''; this.mssv = opts.mssv || '';
      if (opts.me) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 28), new THREE.MeshBasicMaterial({ color: 0x3ad17a, transparent: true, opacity: .8, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.renderOrder = 2; this.ring = ring; this.root.add(ring);
      }
      this.placeholder();
      this.setStyle(state);
      this.root.traverse(o => { o.userData.avatar = this; });
    }
    placeholder() {
      if (this.ph) return;
      const g = typeof THREE.CapsuleGeometry === 'function' ? new THREE.CapsuleGeometry(0.22, 1.1, 4, 8) : new THREE.CylinderGeometry(0.22, 0.22, 1.5, 8);
      this.ph = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x8a93a8, transparent: true, opacity: 0.55 }));
      this.ph.position.y = 0.85; this.inner.add(this.ph);
    }
    setStyle(state) {
      this.state = normState(state);
      const token = this.token = (this.token || 0) + 1;
      enqueue(() => { if (token === this.token && !this.disposed) this.build(); });
    }
    setCard(name, mssv) {
      if (name === this.name && mssv === this.mssv) return;
      this.name = name || ''; this.mssv = mssv || '';
      if (this.rig) enqueue(() => { if (!this.disposed && this.rig) this.buildSlot('card'); });
    }
    cardCanvas() {
      const em = this.state.emblem || CAT.defaults.emblem;
      const c = Object.assign({}, CAT.defaults.card, { name: this.name || 'Sinh viên', id: this.mssv || '', major: 'Phòng ôn thi ảo', cohort: 'Mùa thi 2026', photo: null, template: null });
      const big = K.drawStudentCard(c, emblemCanvas(em), em);
      const sm = document.createElement('canvas'), w = this.opts.me ? 512 : 256;
      sm.width = w; sm.height = Math.round(w * big.height / big.width);
      sm.getContext('2d').drawImage(big, 0, 0, sm.width, sm.height);
      return sm;
    }
    build() {
      const st = this.state, em = st.emblem || CAT.defaults.emblem;
      const hair = resolve(st, st.equipped.hair);
      const rig = K.buildRig(Object.assign({}, st.body, { browColor: hair && hair.colors.main }));
      K.linearize(rig.root);
      rig.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.avatar = this; } });
      if (this.rig) { this.inner.remove(this.rig.root); this.disposeTree(this.rig.root); }
      this.rig = rig; this.slots = {};
      { const face = rig.joints.head.getObjectByName('face'); this.eyes = face ? [face.children[0], face.children[1], face.children[4], face.children[5]].filter(Boolean) : []; }
      for (const s of K.SLOT_ORDER) this.buildSlot(s, em);
      this.inner.add(rig.root);
      this.heldObj = null; if (this.heldKind) this.mountHeld();
      this.propObj = null; if (this.act) this.mountProp();
      if (this.ph) { this.inner.remove(this.ph); this.ph.geometry.dispose(); this.ph = null; }
      this.applyDetail();
      this.update(0, 0);
    }
    buildSlot(slot, em) {
      em = em || this.state.emblem || CAT.defaults.emblem;
      const old = this.slots[slot];
      if (old) for (const p of old.parts) { p.obj.parent && p.obj.parent.remove(p.obj); this.disposeTree(p.obj); }
      delete this.slots[slot];
      const id = this.state.equipped[slot]; if (!id) return;
      const item = resolve(this.state, id); if (!item || !K.BUILDERS[slot]) return;
      const res = K.BUILDERS[slot]({ item, rig: this.rig, imgs: {}, emblemCanvas: emblemCanvas(em), cardCanvas: slot === 'card' ? this.cardCanvas() : null, emblem: em, hatOn: !!this.state.equipped.hat });
      // gắn đồ khi bộ xương đang tách khỏi cảnh, để ma trận gắn (bind) không dính vị trí nhân vật
      const par = this.rig.root.parent; if (par) par.remove(this.rig.root);
      this.rig.root.position.set(0, 0, 0); this.rig.root.updateMatrixWorld(true);
      const parts = K.mountParts(this.rig, res.parts);
      if (par) par.add(this.rig.root);
      for (const p of parts) {
        K.linearize(p.obj); shrinkMaps(p.obj, this.opts.me ? 512 : 256);
        p.obj.traverse(o => { o.userData.avatar = this; o.userData.slot = slot; if (o.isMesh) o.castShadow = true; });
      }
      this.slots[slot] = Object.assign({}, res, { parts });
      this.rules();
    }
    /* quy tắc giống phòng thay đồ: tóc gọn khi đội mũ, thắt lưng chỉ lộ khi áo sơ vin, tay cầm đồ */
    rules() {
      const bottom = resolve(this.state, this.state.equipped.bottom);
      if (K.setBodyCoverage) K.setBodyCoverage(this.rig, bottom ? (bottom.options || {}) : null);
      const hat = this.slots.hat, hair = this.slots.hair;
      if (hair && hair.hideUnderHat) for (const m of hair.hideUnderHat) m.visible = !(hat && hat.hideHairTop);
      this.pose = Object.assign({ elbowR: 0 }, (this.slots.handheld && this.slots.handheld.pose) || {});
      const top = resolve(this.state, this.state.equipped.top), tucked = !!(top && top.options && top.options.tucked);
      for (const p of (this.slots.bottom && this.slots.bottom.parts) || []) if (p.obj.userData.belt) p.obj.visible = tucked;
    }
    disposeTree(obj) {
      obj.traverse(o => {
        if (o.geometry && !o.geometry.userData.keep && o.geometry !== HITBOX) o.geometry.dispose();
        const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of ms) { if (m === HITMAT || m.userData.keep) continue; if (m.map) m.map.dispose(); m.dispose(); }
      });
    }
    /* gần: hiện đủ chi tiết; xa: chỉ còn người + tóc + quần áo (ít lệnh vẽ) */
    setDetail(near) { if (near !== this.near) { this.near = near; this.applyDetail(); } }
    applyDetail() {
      if (!this.rig) return;
      for (const [slot, sl] of Object.entries(this.slots)) if (FAR_HIDE.has(slot)) for (const p of sl.parts) p.obj.visible = this.near;
      const face = this.rig.joints.head.getObjectByName('face'); if (face) face.visible = this.near;
      if (this.act && this.slots.handheld) for (const p of this.slots.handheld.parts) p.obj.visible = false;   // đang đọc sách/dùng máy: cất đồ cầm tay của tủ đồ
    }
    setSit(on, desk = true, kind) { this.sit = on; this.desk = desk; this.lie = kind === 'lounger'; if (this.ring) this.ring.visible = !on; this.hit.scale.y = on ? 0.75 : 1; }
    /* hoạt ảnh bằng xương: đứng thở, đi, ngồi (gõ bàn phím khi có bàn) */
    /* hoạt ảnh = tư thế nền (đứng/đi/ngồi) + cử chỉ (vẫy tay…) + chớp mắt + quay đầu nhìn người đang nói */
    update(dt, speed) {
      this.basePose(dt, speed);
      const j = this.rig && this.rig.joints; if (!j) return;
      if (this.heldObj) this.heldObj.visible = !this.act;           // đang đọc sách / dùng máy thì cất ly cà phê
      if (this.heldObj && !this.emo && !this.act && (this.heldKind === 'coffee' || this.heldKind === 'water' || this.heldKind === 'mango') && !(this.sit && this.desk)) { j.shoulderR.rotation.x -= 0.35; j.elbowR.rotation.x -= 0.95; }
      this.applyAct(dt, j);
      this.applyEmote(dt, j);
      this.applyLook(dt, j);
      this.blink(dt);
    }
    /* đồ cầm tay ngoài tủ đồ: 'coffee' (ly cà phê), 'water' (chai nước), 'stick' (gậy hái xoài), 'mango' (quả xoài) */
    setHeld(kind) {
      if (kind === this.heldKind) return; this.heldKind = kind || null;
      if (this.heldObj) { this.heldObj.parent && this.heldObj.parent.remove(this.heldObj); this.disposeTree(this.heldObj); this.heldObj = null; }
      if (kind && this.rig) this.mountHeld();
    }
    mountHeld() {
      const k = this.heldKind; if (!k || !this.rig) return;
      const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));
      if (k === 'coffee') {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.1, 14), M('#f4efe6')); g.add(cup);
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.0335, 0.03, 0.045, 14), M('#8a5a36')); g.add(sleeve);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.014, 14), M('#3b2a22')); lid.position.y = 0.056; g.add(lid);
      } else if (k === 'water') {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.17, 12), M('#9fd3ff', { transparent: true, opacity: 0.6, roughness: 0.1 })); g.add(b);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.025, 10), M('#2f7de1')); cap.position.y = 0.097; g.add(cap);
        const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.0265, 0.0265, 0.05, 12), M('#ffffff')); g.add(lb);
      } else if (k === 'stick') {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 2.4, 6), M('#8b6a3e')); st.position.y = 1.05; g.add(st);
        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 5, 10, Math.PI), M('#8b6a3e')); hook.position.y = 2.25; g.add(hook);
      } else if (k === 'mango') {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), M('#f2b23a')); m.scale.set(0.8, 1.15, 0.8); g.add(m);
      }
      g.position.set(0, -0.06, 0.035); g.rotation.x = k === 'stick' ? -0.15 : 0;
      K.linearize(g); g.traverse(o => { o.userData.avatar = this; });
      this.rig.joints.wristR.add(g); this.heldObj = g;
    }
    /* ---- hoạt động kéo dài: 'doc' (đọc sách) | 'dien-thoai' (bấm điện thoại) | 'laptop' (dùng laptop) | null (dừng) ---- */
    setAct(kind) {
      kind = ACTS[kind] ? kind : null;
      if (kind === this.act) return;
      if (kind) this.actPose = kind;
      this.act = kind; this.actSeed = (this.actSeed || Math.floor(Math.random() * 97)) + 1;
      if (this.propObj) { this.propObj.parent && this.propObj.parent.remove(this.propObj); this.propObj = null; }
      if (kind && this.rig) this.mountProp();
      this.applyDetail();
    }
    mountProp() {
      if (!this.act || !this.rig) return;
      const g = buildProp(this.act, this.actSeed);
      K.linearize && K.linearize(g);
      g.traverse(o => { o.userData.avatar = this; if (o.material) o.material.userData.keep = true; });
      this.rig.joints.torso.add(g); this.propObj = g;
    }
    /* chỗ đặt đạo cụ (toạ độ xương thân) + điểm cổ tay (toạ độ đạo cụ) theo tư thế: đứng · ngồi bàn · ngồi không bàn · nằm */
    actPlace(kind) {
      const post = this.sit ? (this.lie ? 'lie' : this.desk ? 'desk' : 'lap') : 'stand';
      const P = ACT_PLACE[kind] || ACT_PLACE.doc;
      return P[post] || P.stand;
    }
    applyAct(dt, j) {
      const want = this.act ? 1 : 0;
      this.actW = (this.actW || 0) + (want - (this.actW || 0)) * Math.min(1, dt * 6);
      if (!this.act && this.actW < 0.02) { this.actW = 0; return; }
      const kind = this.act || this.actPose; if (!kind) return;
      const P = this.actPlace(kind), w = this.actW, t = this.phase;
      const o = this.propObj || _o;
      o.position.set(P.pos[0], P.pos[1], P.pos[2]); o.rotation.set(P.rot[0], P.rot[1], P.rot[2]); o.updateMatrix();
      if (this.propObj) { const s = 0.4 + 0.6 * Math.min(1, w * 1.5); this.propObj.scale.setScalar(s); }
      for (const side of ['L', 'R']) {
        const h = P[side]; if (!h) continue;
        let dy = 0, dx = 0;
        if (P.tap === side || P.tap === 'both') {            // gõ phím / chạm màn hình
          const f = side === 'L' ? 0 : 1.7, burst = Math.sin(t * 0.8 + f) > -0.3 ? 1 : 0.2;
          dy = Math.max(0, Math.sin(t * 13 + f)) * 0.012 * burst; dx = Math.sin(t * 2.1 + f) * 0.012;
        }
        _v.set(h[0] + dx, h[1] + dy, h[2]).applyMatrix4(o.matrix);
        reach(j, side, _v, side === 'L' ? POLE_L : POLE_R, w);
      }
      j.head.rotation.x += (P.head + Math.sin(t * 0.6) * 0.02 - j.head.rotation.x) * w;
      j.head.rotation.y *= 1 - 0.7 * w;
    }
    /* cử chỉ: kind = 'vay' | 'co-vu' | 'thich' | 'cui-chao' | 'vuon-vai' | 'choc' (chọc xoài) | 'an' (ăn) */
    playEmote(kind) { const E = EMOTES[kind] || EMOTES_HIDDEN[kind]; this.emo = { kind, t: 0, d: E ? E.d : 2 }; }
    applyEmote(dt, j) {
      const e = this.emo; if (!e) return;
      e.t += dt; if (e.t >= e.d) { this.emo = null; return; }
      const w = Math.max(0, Math.min(1, e.t / 0.25, (e.d - e.t) / 0.35)), t = e.t;
      const mix = (o, k, v) => { o[k] += (v - o[k]) * w; };
      if (e.kind === 'vay') {                          // giơ tay phải vẫy
        mix(j.shoulderR.rotation, 'z', -2.55); mix(j.shoulderR.rotation, 'x', -0.15);
        mix(j.elbowR.rotation, 'x', -0.35); j.elbowR.rotation.z = Math.sin(t * 11) * 0.45 * w;
        mix(j.head.rotation, 'z', 0.08);
      } else if (e.kind === 'co-vu') {                  // hai tay giơ cao, nhún người
        mix(j.shoulderR.rotation, 'z', -2.75); mix(j.shoulderL.rotation, 'z', 2.75);
        mix(j.elbowR.rotation, 'x', -0.2); mix(j.elbowL.rotation, 'x', -0.2);
        if (!this.sit) j.torso.position.y += Math.abs(Math.sin(t * 7)) * 0.05 * w;
        j.shoulderR.rotation.x = Math.sin(t * 7) * 0.2 * w; j.shoulderL.rotation.x = -Math.sin(t * 7) * 0.2 * w;
      } else if (e.kind === 'thich') {                  // giơ ngón cái
        mix(j.shoulderR.rotation, 'x', -1.25); mix(j.shoulderR.rotation, 'z', -0.25); mix(j.elbowR.rotation, 'x', -0.9);
        mix(j.head.rotation, 'x', -0.05);
      } else if (e.kind === 'cui-chao') {               // cúi chào
        const b = Math.sin(Math.min(1, t / (e.d * 0.8)) * Math.PI);
        j.torso.rotation.x += (this.sit ? 0.25 : 0.5) * b; j.head.rotation.x += 0.25 * b;
      } else if (e.kind === 'choc') {                   // giơ gậy chọc lên cây
        mix(j.shoulderR.rotation, 'x', -2.6 + Math.sin(t * 9) * 0.25); mix(j.elbowR.rotation, 'x', -0.15);
        mix(j.shoulderL.rotation, 'x', -2.3 + Math.sin(t * 9) * 0.2); mix(j.elbowL.rotation, 'x', -0.3); mix(j.head.rotation, 'x', -0.45);
      } else if (e.kind === 'an') {                     // đưa xoài lên miệng
        mix(j.shoulderR.rotation, 'x', -1.1); mix(j.elbowR.rotation, 'x', -1.9 + Math.sin(t * 6) * 0.12); mix(j.head.rotation, 'x', 0.12);
      } else if (e.kind === 'vuon-vai') {               // vươn vai
        mix(j.shoulderR.rotation, 'z', -2.95); mix(j.shoulderL.rotation, 'z', 2.95);
        mix(j.elbowR.rotation, 'x', -0.1); mix(j.elbowL.rotation, 'x', -0.1);
        mix(j.torso.rotation, 'x', -0.12); mix(j.head.rotation, 'x', -0.25);
        j.torso.rotation.z = Math.sin(t * 1.6) * 0.08 * w;
      }
    }
    /* quay đầu nhìn về một điểm (toạ độ thế giới) trong một lúc */
    lookAt(p, dur = 3) { this.look = { p: p.clone(), t: 0, d: dur }; }
    applyLook(dt, j) {
      const L = this.look; if (!L || this.emo) { if (L && this.emo) this.look = null; return; }
      L.t += dt; if (L.t > L.d) { this.look = null; return; }
      const w = Math.max(0, Math.min(1, L.t / 0.4, (L.d - L.t) / 0.5));
      this.root.updateMatrixWorld(); const loc = this.root.worldToLocal(L.p.clone());
      const yaw = Math.max(-1.0, Math.min(1.0, Math.atan2(loc.x, loc.z)));
      j.head.rotation.y += (yaw - j.head.rotation.y) * w;
    }
    /* chớp mắt mỗi 2–6 giây */
    blink(dt) {
      if (!this.near || !this.eyes) return;
      this.blinkT = (this.blinkT == null ? 2 + Math.random() * 4 : this.blinkT) - dt;
      const closed = this.blinkT < 0.12 && this.blinkT > 0;
      for (const e of this.eyes) e.scale.y = closed ? 0.12 : 1;
      if (this.blinkT <= 0) this.blinkT = 2 + Math.random() * 4;
    }
    basePose(dt, speed) {
      this.phase += dt;
      const j = this.rig && this.rig.joints; if (!j) { if (this.ph) this.ph.position.y = this.sit ? 0.45 : 0.85; return; }
      const t = this.phase, H = this.state.body.height || 0.97;
      if (this.sit && this.lie) {                         // ghế nằm: ngả lưng, duỗi chân, nhìn lên trời
        this.inner.position.set(0, (0.5 - HIP_STAND * H), 0);
        j.torso.position.y = 0.965 + Math.sin(t * 1.2) * 0.003; j.torso.rotation.set(-0.95, 0, 0);
        j.hipL.rotation.set(-Math.PI / 2 + 0.95 + 0.04, 0, -0.05); j.hipR.rotation.set(-Math.PI / 2 + 0.95 + 0.04, 0, 0.05);
        j.kneeL.rotation.x = j.kneeR.rotation.x = 0.12; j.ankleL.rotation.x = j.ankleR.rotation.x = 0;
        j.shoulderL.rotation.set(-0.1, 0, 0.3); j.shoulderR.rotation.set(-0.1, 0, -0.3);
        j.elbowL.rotation.x = j.elbowR.rotation.x = -0.35;
        j.head.rotation.set(0.25, Math.sin(t * 0.25) * 0.15, 0);
        return;
      }
      if (this.sit) {
        this.inner.position.set(0, (0.53 - HIP_STAND * H), -0.1);
        j.torso.position.y = 0.965; j.torso.rotation.set(0.06, 0, 0);
        j.hipL.rotation.set(-Math.PI / 2 + 0.06, 0, -0.04); j.hipR.rotation.set(-Math.PI / 2 + 0.06, 0, 0.04);
        j.kneeL.rotation.x = j.kneeR.rotation.x = Math.PI / 2 - 0.08;
        j.ankleL.rotation.x = j.ankleR.rotation.x = 0;
        const typing = this.desk && Math.sin(t * 0.37) > 0.55 ? Math.sin(t * 11) * 0.05 : 0;
        j.shoulderL.rotation.set(this.desk ? -0.55 : -0.1, 0, 0.12); j.shoulderR.rotation.set(this.desk ? -0.55 + typing : -0.1, 0, -0.12);
        j.elbowL.rotation.x = this.desk ? -0.95 : -0.5; j.elbowR.rotation.x = this.desk ? -0.95 - typing : -0.5;
        j.head.rotation.set(this.desk ? 0.18 + Math.sin(t * 0.5) * 0.03 : 0, Math.sin(t * 0.3) * 0.12, 0);
        return;
      }
      this.inner.position.set(0, 0, 0);
      const target = Math.min(1, speed / 1.6);
      this.walk += (target - this.walk) * Math.min(1, dt * 8);
      const a = this.walk, ph = t * (5.2 + speed * 1.4), s = Math.sin(ph);
      j.torso.position.y = 0.965 + Math.abs(Math.sin(ph)) * 0.012 * a + Math.sin(t * 1.8) * 0.003 * (1 - a);
      j.torso.rotation.set(0.04 * a, Math.sin(ph) * 0.05 * a + Math.sin(t * 0.6) * 0.03 * (1 - a), 0);
      j.hipL.rotation.set(-s * 0.5 * a, 0, 0); j.hipR.rotation.set(s * 0.5 * a, 0, 0);
      j.kneeL.rotation.x = (0.1 + 0.75 * Math.max(0, Math.cos(ph))) * a; j.kneeR.rotation.x = (0.1 + 0.75 * Math.max(0, -Math.cos(ph))) * a;
      j.ankleL.rotation.x = j.ankleR.rotation.x = 0;
      j.shoulderL.rotation.set(s * 0.4 * a + Math.sin(t * 0.9) * 0.03 * (1 - a), 0, 0.09 + Math.sin(t * 1.2) * 0.015);
      j.shoulderR.rotation.set(-s * 0.4 * a + Math.sin(t * 0.9 + 2) * 0.03 * (1 - a), 0, -0.09 - Math.sin(t * 1.2 + 0.4) * 0.015);
      j.elbowL.rotation.x = -0.12 - 0.25 * a; j.elbowR.rotation.x = -0.12 - 0.25 * a + ((this.pose && this.pose.elbowR) || 0);
      j.head.rotation.set(Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.45 + 1) * 0.14 * (1 - a), 0);
    }
    headY() { return (this.sit ? (this.lie ? 1.0 : 1.32) : 1.82) * ((this.state && this.state.body.height) || 0.97); }
    dispose() { this.disposed = true; this.root.parent && this.root.parent.remove(this.root); if (this.rig) this.disposeTree(this.rig.root); }
  }

  /* ---- xem trước nhỏ (màn đăng nhập) ---- */
  function Preview(canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = THREE.sRGBEncoding;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
    cam.position.set(0, 1.05, 4.4); cam.lookAt(0, 0.92, 0);
    sc.add(new THREE.HemisphereLight(0xffffff, 0xb5a990, 0.62));
    const dl = new THREE.DirectionalLight(0xfff6ea, 0.95); dl.position.set(2.2, 4, 3); sc.add(dl);
    const rim = new THREE.DirectionalLight(0xc9d6ff, 0.4); rim.position.set(-3, 2.5, -2.5); sc.add(rim);
    let av = null, rot = 0.4, run = true, last = performance.now(), drag = null;
    canvas.addEventListener('pointerdown', e => { drag = e.clientX; try { canvas.setPointerCapture(e.pointerId); } catch (_) { } });
    canvas.addEventListener('pointermove', e => { if (drag != null) { rot += (e.clientX - drag) * 0.012; drag = e.clientX; } });
    canvas.addEventListener('pointerup', () => drag = null);
    function size() { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (canvas.width !== Math.round(w * r.getPixelRatio()))) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
    function loop(t) {
      if (!run) return;
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      if (drag == null) rot += dt * 0.3;
      if (av) { av.root.rotation.y = Math.sin(rot) * 0.8; av.update(dt, 0); }
      size(); r.render(sc, cam); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return {
      set(state, name, mssv) { if (av) { sc.remove(av.root); av.dispose(); } av = new Avatar(state, { me: true, name, mssv }); if (av.ring) av.ring.visible = false; sc.add(av.root); },
      stop() { run = false; if (av) av.dispose(); r.dispose(); }
    };
  }

  window.AV2 = { Avatar, Preview, normState, randomState, seeded, cardImage, EMOTES, ACTS, catalog: CAT };
})();
