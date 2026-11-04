/* =====================================================================
   NHÂN VẬT CHIBI 3D (khối đơn giản, tô màu theo đỉnh để vẽ ít lệnh)
   Mỗi nhân vật = 1 khối thân (đầu, tóc, mũ, áo) + 2 chân + 2 tay để đung đưa khi đi.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- các lựa chọn trang phục ---------- */
  const STYLE = {
    gender: [{ id: 'nam', label: 'Nam' }, { id: 'nu', label: 'Nữ' }],
    skin: [{ id: 's1', label: 'Sáng', c: '#f6d3b8' }, { id: 's2', label: 'Trung bình', c: '#e8b894' }, { id: 's3', label: 'Ngăm', c: '#c98f68' }],
    hair: {
      nam: [{ id: 'ngan', label: 'Ngắn' }, { id: 'vuot', label: 'Vuốt' }, { id: 'xoan', label: 'Xoăn' }],
      nu: [{ id: 'dai', label: 'Dài' }, { id: 'duoi', label: 'Đuôi ngựa' }, { id: 'bui', label: 'Búi' }, { id: 'bob', label: 'Bob' }]
    },
    hairColor: [{ id: 'den', label: 'Đen', c: '#1f1b1b' }, { id: 'nau', label: 'Nâu', c: '#5a3a22' }, { id: 'hatde', label: 'Hạt dẻ', c: '#8a5a34' }],
    top: [
      { id: 'dongphuc', label: 'Áo đồng phục đỏ', c: '#a5162d', trim: '#26305c' },
      { id: 'khoac', label: 'Áo khoác xanh than', c: '#26305c', trim: '#c4122f' },
      { id: 'thun', label: 'Áo thun trắng', c: '#f1f1ec', trim: '#c9ccd6' },
      { id: 'hoodie', label: 'Hoodie xám', c: '#858b98', trim: '#5f6572' }
    ],
    bottom: [
      { id: 'au', label: 'Quần âu đen', c: '#24262c' },
      { id: 'jean', label: 'Quần jean', c: '#3c5a8a' },
      { id: 'kaki', label: 'Quần kaki', c: '#b39a6c' },
      { id: 'vay', label: 'Chân váy', c: '#2b3047', onlyNu: true }
    ],
    hat: [
      { id: 'khong', label: 'Không đội' }, { id: 'luoitrai', label: 'Mũ lưỡi trai', c: '#c4122f' },
      { id: 'len', label: 'Mũ len', c: '#e7b847' }, { id: 'tainghe', label: 'Tai nghe', c: '#2a2d36' }
    ]
  };
  const DEFAULT_STYLE = { g: 'nam', skin: 's1', hair: 'ngan', hc: 'den', top: 'dongphuc', bot: 'au', hat: 'khong' };
  const find = (arr, id) => arr.find(x => x.id === id) || arr[0];
  function normStyle(s) {
    s = Object.assign({}, DEFAULT_STYLE, s || {});
    if (!STYLE.gender.some(x => x.id === s.g)) s.g = 'nam';
    if (!STYLE.hair[s.g].some(x => x.id === s.hair)) s.hair = STYLE.hair[s.g][0].id;
    if (s.bot === 'vay' && s.g !== 'nu') s.bot = 'au';
    for (const [k, arr] of [['skin', STYLE.skin], ['hc', STYLE.hairColor], ['top', STYLE.top], ['bot', STYLE.bottom], ['hat', STYLE.hat]])
      if (!arr.some(x => x.id === s[k])) s[k] = arr[0].id;
    return s;
  }
  function randomStyle() {
    const r = a => a[Math.floor(Math.random() * a.length)].id, g = Math.random() < .5 ? 'nam' : 'nu';
    return normStyle({ g, skin: r(STYLE.skin), hair: r(STYLE.hair[g]), hc: r(STYLE.hairColor), top: r(STYLE.top), bot: r(STYLE.bottom.filter(b => !b.onlyNu || g === 'nu')), hat: Math.random() < .6 ? 'khong' : r(STYLE.hat) });
  }

  /* ---------- ghép nhiều khối thành 1 hình có màu theo đỉnh ---------- */
  const tmpC = new THREE.Color();
  function merge(parts) {
    const pos = [], nor = [], col = [];
    for (const p of parts) {
      const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
      g.applyMatrix4(p.m);
      tmpC.set(p.c).convertSRGBToLinear();
      const P = g.attributes.position.array, N = g.attributes.normal.array;
      for (let i = 0; i < P.length; i++) { pos.push(P[i]); nor.push(N[i]); }
      for (let i = 0; i < P.length / 3; i++) col.push(tmpC.r, tmpC.g, tmpC.b);
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  }
  const M = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 14, 10), HEMI = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    CYL = new THREE.CylinderGeometry(1, 1, 1, 12), TOR = new THREE.TorusGeometry(1, .12, 6, 16, Math.PI);

  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  const cache = {};
  const HEAD_Y = 1.24, HEAD_R = 0.29, HIP_Y = 0.55, SH_Y = 0.96;

  /* thân: áo + đầu + mặt + tóc + mũ */
  function bodyGeo(s) {
    const key = 'b' + [s.g, s.skin, s.hair, s.hc, s.top, s.hat].join(':');
    if (cache[key]) return cache[key];
    const skin = find(STYLE.skin, s.skin).c, hc = find(STYLE.hairColor, s.hc).c, top = find(STYLE.top, s.top), hat = find(STYLE.hat, s.hat);
    const P = [];
    // áo
    P.push({ g: BOX, m: M(0, 0.78, 0, 0.44, 0.46, 0.27), c: top.c });
    if (top.id === 'dongphuc') { P.push({ g: BOX, m: M(0, 0.99, 0.02, 0.3, 0.06, 0.25), c: top.trim }); P.push({ g: BOX, m: M(0.12, 0.86, 0.138, 0.07, 0.05, 0.01), c: '#ffffff' }); }
    if (top.id === 'khoac') { P.push({ g: BOX, m: M(0, 0.78, 0.137, 0.035, 0.44, 0.01), c: '#d8d9e0' }); P.push({ g: BOX, m: M(0, 0.6, 0, 0.45, 0.05, 0.28), c: top.trim }); }
    if (top.id === 'hoodie') { P.push({ g: BOX, m: M(0, 1.0, -0.1, 0.36, 0.12, 0.12), c: top.trim }); P.push({ g: BOX, m: M(0, 0.68, 0.137, 0.26, 0.12, 0.01), c: top.trim }); }
    if (top.id === 'thun') P.push({ g: BOX, m: M(0, 1.0, 0.04, 0.2, 0.03, 0.2), c: top.trim });
    P.push({ g: CYL, m: M(0, 1.03, 0, 0.08, 0.08, 0.08), c: skin });                   // cổ
    P.push({ g: SPH, m: M(0, HEAD_Y, 0, HEAD_R, HEAD_R * 0.96, HEAD_R * 0.95), c: skin }); // đầu
    // mắt + má
    P.push({ g: BOX, m: M(-0.095, HEAD_Y - 0.01, HEAD_R * 0.9, 0.05, 0.075, 0.03), c: '#2a2224' });
    P.push({ g: BOX, m: M(0.095, HEAD_Y - 0.01, HEAD_R * 0.9, 0.05, 0.075, 0.03), c: '#2a2224' });
    P.push({ g: SPH, m: M(-0.16, HEAD_Y - 0.08, HEAD_R * 0.82, 0.04, 0.025, 0.02), c: '#f2a2a2' });
    P.push({ g: SPH, m: M(0.16, HEAD_Y - 0.08, HEAD_R * 0.82, 0.04, 0.025, 0.02), c: '#f2a2a2' });
    // tóc
    const cap = (sy = 1) => P.push({ g: HEMI, m: M(0, HEAD_Y + 0.02, -0.02, HEAD_R * 1.08, HEAD_R * 1.05 * sy, HEAD_R * 1.08), c: hc });
    switch (s.hair) {
      case 'ngan': cap(); P.push({ g: BOX, m: M(0, HEAD_Y + 0.13, 0.2, 0.42, 0.1, 0.12, -0.3), c: hc }); break;
      case 'vuot': cap(1.1); P.push({ g: BOX, m: M(0.04, HEAD_Y + 0.27, 0.12, 0.36, 0.14, 0.2, -0.5, 0, 0.2), c: hc }); break;
      case 'xoan': for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; P.push({ g: SPH, m: M(Math.cos(a) * 0.2, HEAD_Y + 0.2 + (i % 2) * 0.04, Math.sin(a) * 0.18 - 0.03, 0.12, 0.12, 0.12), c: hc }); } cap(); break;
      case 'dai': cap(); P.push({ g: BOX, m: M(0, HEAD_Y - 0.2, -0.17, 0.56, 0.62, 0.16), c: hc }); P.push({ g: BOX, m: M(0, HEAD_Y + 0.13, 0.2, 0.44, 0.1, 0.12, -0.3), c: hc }); break;
      case 'duoi': cap(); P.push({ g: SPH, m: M(0, HEAD_Y + 0.05, -0.36, 0.1, 0.22, 0.1, 0.5), c: hc }); P.push({ g: BOX, m: M(0, HEAD_Y + 0.13, 0.2, 0.44, 0.1, 0.12, -0.3), c: hc }); break;
      case 'bui': cap(); P.push({ g: SPH, m: M(0, HEAD_Y + 0.33, -0.1, 0.13, 0.13, 0.13), c: hc }); break;
      case 'bob': cap(); P.push({ g: BOX, m: M(0, HEAD_Y - 0.07, -0.08, 0.64, 0.3, 0.44), c: hc }); P.push({ g: BOX, m: M(0, HEAD_Y + 0.15, 0.2, 0.46, 0.1, 0.1, -0.2), c: hc }); break;
    }
    // mũ
    if (hat.id === 'luoitrai') { P.push({ g: HEMI, m: M(0, HEAD_Y + 0.06, 0, HEAD_R * 1.12, HEAD_R * 0.95, HEAD_R * 1.12), c: hat.c }); P.push({ g: BOX, m: M(0, HEAD_Y + 0.08, 0.32, 0.36, 0.03, 0.22), c: hat.c }); }
    if (hat.id === 'len') { P.push({ g: HEMI, m: M(0, HEAD_Y + 0.07, 0, HEAD_R * 1.13, HEAD_R * 1.15, HEAD_R * 1.13), c: hat.c }); P.push({ g: CYL, m: M(0, HEAD_Y + 0.08, 0, HEAD_R * 1.15, 0.08, HEAD_R * 1.15), c: '#f5f0e6' }); P.push({ g: SPH, m: M(0, HEAD_Y + 0.41, 0, 0.07, 0.07, 0.07), c: '#f5f0e6' }); }
    if (hat.id === 'tainghe') { P.push({ g: TOR, m: M(0, HEAD_Y + 0.02, 0, HEAD_R * 1.12, HEAD_R * 1.15, HEAD_R), c: hat.c }); P.push({ g: CYL, m: M(-HEAD_R * 1.05, HEAD_Y - 0.02, 0, 0.09, 0.06, 0.09, 0, 0, Math.PI / 2), c: hat.c }); P.push({ g: CYL, m: M(HEAD_R * 1.05, HEAD_Y - 0.02, 0, 0.09, 0.06, 0.09, 0, 0, Math.PI / 2), c: hat.c }); }
    return cache[key] = merge(P);
  }
  /* chân: gốc ở hông để đung đưa */
  function legGeo(s) {
    const key = 'l' + s.bot + s.skin;
    if (cache[key]) return cache[key];
    const b = find(STYLE.bottom, s.bot), skin = find(STYLE.skin, s.skin).c;
    const P = b.id === 'vay'
      ? [{ g: BOX, m: M(0, -0.08, 0, 0.17, 0.16, 0.2), c: b.c }, { g: BOX, m: M(0, -0.32, 0, 0.11, 0.34, 0.12), c: skin }]
      : [{ g: BOX, m: M(0, -0.22, 0, 0.15, 0.44, 0.17), c: b.c }];
    P.push({ g: BOX, m: M(0, -0.5, 0.03, 0.16, 0.09, 0.24), c: '#2b2b30' });
    return cache[key] = merge(P);
  }
  /* tay: gốc ở vai */
  function armGeo(s) {
    const key = 'a' + s.top + s.skin;
    if (cache[key]) return cache[key];
    const top = find(STYLE.top, s.top), skin = find(STYLE.skin, s.skin).c;
    const P = [{ g: BOX, m: M(0, -0.15, 0, 0.12, 0.3, 0.13), c: top.id === 'thun' ? skin : top.c },
    { g: BOX, m: M(0, -0.08, 0, 0.13, 0.16, 0.14), c: top.c },
    { g: SPH, m: M(0, -0.33, 0, 0.07, 0.07, 0.07), c: skin }];
    return cache[key] = merge(P);
  }
  const SKIRT_GEO = (() => merge([{ g: CYL, m: M(0, 0.47, 0, 0.27, 0.2, 0.22), c: '#2b3047' }]))();

  /* ---------- một nhân vật ---------- */
  class Avatar {
    constructor(style, opts = {}) {
      this.root = new THREE.Group();
      this.inner = new THREE.Group(); this.root.add(this.inner);
      this.phase = Math.random() * 10; this.walk = 0; this.sit = false; this.anim = 'idle';
      this.setStyle(style);
      if (opts.me) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 28), new THREE.MeshBasicMaterial({ color: 0x3ad17a, transparent: true, opacity: .85, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.renderOrder = 2; this.ring = ring; this.root.add(ring);
      }
      this.root.traverse(o => { o.userData.avatar = this; });
    }
    setStyle(style) {
      const s = this.style = normStyle(style);
      this.inner.clear();
      this.body = new THREE.Mesh(bodyGeo(s), MAT); this.body.castShadow = true;
      this.legL = new THREE.Mesh(legGeo(s), MAT); this.legL.position.set(-0.1, HIP_Y, 0);
      this.legR = new THREE.Mesh(legGeo(s), MAT); this.legR.position.set(0.1, HIP_Y, 0);
      this.armL = new THREE.Mesh(armGeo(s), MAT); this.armL.position.set(-0.29, SH_Y, 0);
      this.armR = new THREE.Mesh(armGeo(s), MAT); this.armR.position.set(0.29, SH_Y, 0);
      this.inner.add(this.body, this.legL, this.legR, this.armL, this.armR);
      if (s.bot === 'vay') { this.skirt = new THREE.Mesh(SKIRT_GEO, MAT); this.inner.add(this.skirt); } else this.skirt = null;
      this.inner.traverse(o => { o.userData.avatar = this; });
    }
    /* t: giây; speed: m/s (0 = đứng yên) */
    update(dt, speed) {
      this.phase += dt;
      const p = this.phase;
      if (this.sit) {
        this.inner.position.y = -0.08 + Math.sin(p * 1.6) * 0.004;
        this.legL.rotation.x = this.legR.rotation.x = -Math.PI / 2 + 0.1;
        // tay đặt lên bàn, thỉnh thoảng "viết"
        const w = (Math.sin(p * 0.37) > 0.6) ? Math.sin(p * 9) * 0.06 : 0;
        this.armL.rotation.x = -1.05; this.armR.rotation.x = -1.15 + w;
        this.armL.rotation.z = this.armR.rotation.z = 0;
        this.body.rotation.x = 0.08;
        return;
      }
      this.body.rotation.x = 0;
      const target = Math.min(1, speed / 4);
      this.walk += (target - this.walk) * Math.min(1, dt * 8);
      const sw = Math.sin(p * (6 + speed * 1.2)) * 0.7 * this.walk;
      this.legL.rotation.x = sw; this.legR.rotation.x = -sw;
      this.armL.rotation.x = -sw * 0.8; this.armR.rotation.x = sw * 0.8;
      this.armL.rotation.z = 0.08; this.armR.rotation.z = -0.08;
      this.inner.position.y = Math.abs(Math.sin(p * (6 + speed * 1.2))) * 0.05 * this.walk + Math.sin(p * 2) * 0.006;
    }
    setSit(on) { this.sit = on; if (this.ring) this.ring.visible = !on; }
    dispose() { this.root.parent && this.root.parent.remove(this.root); }
  }

  /* ---------- xem trước nhân vật (dùng ở màn đăng nhập) ---------- */
  function Preview(canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = THREE.sRGBEncoding;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    cam.position.set(0, 1.05, 3.6); cam.lookAt(0, 0.82, 0);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7); dl.position.set(2, 3, 4); sc.add(dl);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .08 }));
    floor.rotation.x = -Math.PI / 2; sc.add(floor);
    let av = null, rot = 0.5, run = true, last = performance.now(), drag = null;
    canvas.addEventListener('pointerdown', e => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (drag != null) { rot += (e.clientX - drag) * 0.012; drag = e.clientX; } });
    canvas.addEventListener('pointerup', () => drag = null);
    function size() { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
    function loop(t) {
      if (!run) return;
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      if (drag == null) rot += dt * 0.35;
      if (av) { av.root.rotation.y = Math.sin(rot) * 0.9; av.update(dt, 0); }
      size(); r.render(sc, cam); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return {
      set(style) { if (av) sc.remove(av.root); av = new Avatar(style); sc.add(av.root); },
      stop() { run = false; r.dispose(); }
    };
  }

  window.AV = { STYLE, DEFAULT_STYLE, normStyle, randomStyle, Avatar, Preview, find };
})();
