/* =====================================================================
   LỚP CẢNH (SceneAPI) — "hợp đồng" giữa web và mô hình 3D
   ---------------------------------------------------------------------
   Web CHỈ dùng các hàm/thuộc tính dưới đây (xem docs/HOP_DONG_CANH.md).

   SceneAPI.ready              Promise — mô hình + sân thư viện đã dựng xong
   SceneAPI.spaces             { campus, A, B }
     campus: sân thư viện (file GLB)   A: thư viện tầng 1–4 (có phòng 401)   B: tầng 6–7   D: sân thượng tầng 10
   Mỗi space:
     kind        'campus' | 'room'
     group       nhóm 3D để thêm nhân vật vào
     camera      camera đang dùng
     seats       [{x,y,z,ry,floor,kind}] — mọi chỗ ngồi được (ghế, sofa, ghế đá, đàn piano)
     floors      danh sách mặt sàn (campus: [0]; A: [0,4.5,9,13.5]; B: [6,7,10])
     grid(floor) lưới đi được của một mặt sàn (Grid, js/grid.js)
     free(x,z,floor)  điểm có đi được không
     ceil(floor)      độ cao trần (để camera không xuyên trần)
     floorOf(y)       mặt sàn ứng với độ cao chân y
     place(x,y,z)     tên vị trí dễ hiểu ("Phòng 401", "Tầng 6"…)
     camFree(x,z,base) điểm camera đặt được không (phòng)   solid(x,y,z) điểm nằm trong toà nhà (sân)
   Phòng (A, B) thêm: walkNow(x,y,z,yaw), stopWalk(), isWalking(), eye() — dùng bộ đi bộ có sẵn của mô hình
   SceneAPI.enter(id, text)    chuyển không gian (màn mờ)
   SceneAPI.setNight(t)        0 ngày … 1 đêm
   SceneAPI.onFrame(fn) / afterFrame(fn)
   SceneAPI.on('exit-library' | 'space-changed' | 'enter-door', fn)
   ===================================================================== */
(function () {
  'use strict';
  const listeners = [], after = [], ev = {};
  const on = (n, f) => (ev[n] = ev[n] || []).push(f);
  const emit = (n, ...a) => (ev[n] || []).forEach(f => f(...a));
  let H, cur = 'campus', switching = false, night = 0;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /* đường dẫn gốc của web (để trang công cụ trong tools/ cũng tải được file GLB) */
  const ROOT = ((document.currentScript && document.currentScript.src) || '').replace(/scene\/adapter\.js.*$/, '');

  const SceneAPI = {
    spaces: {}, buildings: [], on,
    onFrame(fn) { listeners.push(fn); },
    afterFrame(fn) { after.push(fn); },
    current: () => cur,
    nightLevel: () => night,
    camera: () => H.cur.api.camera,
    setNight(t) { night = t; if (!H) return; for (const m of [H.A, H.B, H.C, H.D]) if (m) m.api.setNight(t); applyExteriorNight(t); },
    status: msg => { const el = document.getElementById('po-splash-msg'); if (el && msg) el.textContent = msg; }
  };

  /* ------------------------------------------------------------------
     SÂN THƯ VIỆN (GLB)
     ------------------------------------------------------------------ */
  const EXT = { root: null, grid: null, mixer: null, door: null, doorT: 0, hands: {}, nightMats: [], seats: [], mango: [] };
  function loadExterior() {
    return new Promise((res, rej) => {
      SceneAPI.status('Đang tải sân thư viện…');
      new THREE.GLTFLoader().load(ROOT + 'scene/exterior/thu-vien-ta-quang-buu.glb', g => res(g), undefined, e => rej(e));
    });
  }
  async function loadGrid(root) {
    try {
      const r = await fetch(ROOT + 'scene/exterior/luoi-di-chuyen.json');
      if (r.ok) return Grid.fromJSON(await r.json());
    } catch (_) { }
    SceneAPI.status('Đang tính lối đi trên sân (lần đầu, vài giây)…');
    await new Promise(r => setTimeout(r, 30));
    return window.buildWalkGrid(root);
  }
  function applyExteriorNight(t) {
    for (const [m, d, n] of EXT.nightMats) m.emissiveIntensity = d + (n - d) * t;
    // ánh sáng của mô hình chỉ xuống "chạng vạng" → làm tối thêm màu vật liệu sân cho ra buổi tối (ánh xanh nhẹ)
    for (const [m, c] of EXT.dimMats || []) m.color.setRGB(c.r * (1 - 0.62 * t), c.g * (1 - 0.58 * t), c.b * (1 - 0.4 * t));
  }

  /* ------------------------------------------------------------------
     DỌN SÂN (sửa lỗi đồ hoạ của file GLB, không cần xuất lại file):
       • chân của các hình người mẫu (phần thấp < 1 m trong khối cột đen Khoi_Cot_Den)
       • 2 khối đá xám cuối sân (Khoi_Tuong_Da + bệ đá trong Khoi_Da_Bac_Thang)
       • vạch vàng trên mặt đường trước thư viện (nằm trong ảnh vân mặt đường)
     Ô lưới đi bộ ở những chỗ vừa dọn được mở lại.
     ------------------------------------------------------------------ */
  function openCells(b) {
    const g = EXT.grid; if (!g) return;
    for (let z = b.min.z - 0.25; z <= b.max.z + 0.25; z += g.cell / 2) for (let x = b.min.x - 0.25; x <= b.max.x + 0.25; x += g.cell / 2) {
      const i = g.ci(x), j = g.cj(z); if (i < 0 || j < 0 || i >= g.nx || j >= g.nz) continue;
      const k = j * g.nx + i;
      let f = 9; for (const [di, dj] of [[0, -3], [0, 3], [-3, 0], [3, 0]]) { const ii = i + di, jj = j + dj; if (g.ok(ii, jj)) f = Math.min(f, g.floor[jj * g.nx + ii]); }
      g.walk[k] = 1; g.floor[k] = f === 9 ? 0 : f;
    }
  }
  /* bỏ các phần rời (mảnh liền nhau) của một khối gộp mà hộp bao thoả điều kiện drop(box) */
  function dropParts(mesh, drop) {
    const g = mesh.geometry, pos = g.attributes.position, n = pos.count;
    const idx = g.index ? g.index.array : Uint32Array.from({ length: n }, (_, i) => i);
    const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
    const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
    const key = new Map();
    for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 200) + ',' + Math.round(pos.getY(i) * 200) + ',' + Math.round(pos.getZ(i) * 200); const o = key.get(k); if (o == null) key.set(k, i); else uni(i, o); }
    for (let t = 0; t < idx.length; t += 3) { uni(idx[t], idx[t + 1]); uni(idx[t], idx[t + 2]); }
    mesh.updateMatrixWorld(true);
    const v = new THREE.Vector3(), top = new Map(), boxes = new Map();
    for (let i = 0; i < n; i++) {
      const r = find(i); v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      top.set(r, Math.max(top.has(r) ? top.get(r) : -1e9, v.y));
      let b = boxes.get(r); if (!b) boxes.set(r, b = new THREE.Box3()); b.expandByPoint(v);
    }
    const keep = [], dropped = [];
    const gone = new Set(); for (const [r, b] of boxes) if (drop(b)) { gone.add(r); dropped.push(b); }
    for (let t = 0; t < idx.length; t += 3) { if (gone.has(find(idx[t]))) continue; keep.push(idx[t], idx[t + 1], idx[t + 2]); }
    if (dropped.length) { g.setIndex(keep); g.computeBoundingSphere(); }
    return dropped;
  }
  function cleanExterior(root) {
    const legs = root.getObjectByName('Khoi_Cot_Den');
    if (legs && legs.isMesh) { const d = dropParts(legs, b => b.max.y < 1.0); d.forEach(openCells); EXT.cleaned = (EXT.cleaned || 0) + d.length; }
    // 2 khối đá xám cuối sân (cạnh 2 thùng rác): phần đá phía trên + bệ đá bên dưới
    const rock = root.getObjectByName('Khoi_Tuong_Da');
    if (rock) { rock.visible = false; openCells(new THREE.Box3().setFromObject(rock)); }
    const steps = root.getObjectByName('Khoi_Da_Bac_Thang');
    if (steps && steps.isMesh) dropParts(steps, b => b.min.z > 23 && b.max.z < 27.5 && Math.abs((b.min.x + b.max.x) / 2) < 7 && b.max.x - b.min.x < 3).forEach(openCells);
    const road = root.getObjectByName('Duong'), map = road && road.material && road.material.map;
    if (map && map.image) {
      const img = map.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
      let sr = 0, sg = 0, sb = 0, sn = 0;
      for (let i = 0; i < a.length; i += 16) { const r = a[i], g = a[i + 1], b = a[i + 2]; if (Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r < 150) { sr += r; sg += g; sb += b; sn++; } }
      const ar = sn ? sr / sn : 70, ag = sn ? sg / sn : 70, ab = sn ? sb / sn : 72;
      let hit = 0;
      for (let i = 0; i < a.length; i += 4) { const r = a[i], g = a[i + 1], b = a[i + 2]; if (r - b > 16 && g - b > 6 && r > 60) { /* vàng + viền pha trộn với nhựa đường */ a[i] = ar; a[i + 1] = ag; a[i + 2] = ab; hit++; } }
      if (hit) { x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); for (const k of ['wrapS', 'wrapT', 'flipY', 'encoding', 'magFilter', 'minFilter', 'anisotropy']) t[k] = map[k]; t.repeat.copy(map.repeat); t.offset.copy(map.offset); t.needsUpdate = true; road.material.map = t; road.material.needsUpdate = true; }
      EXT.roadYellow = hit;
    }
  }

  SceneAPI.ready = new Promise(res => {
    if (window.HUST3D) res(); else window.addEventListener('hust3d-ready', () => res(), { once: true });
  }).then(async () => {
    H = window.HUST3D;
    const gltf = await loadExterior();
    EXT.grid = await loadGrid(gltf.scene);
    return init(gltf);
  });

  function init(gltf) {
    const { A, B, C, D } = H;
    SceneAPI.renderer = H.renderer;
    const log = window.__SEATLOG || [];

    /* ---- thay khuôn viên cũ bằng sân thư viện mới: giữ đèn, bầu trời, mây ---- */
    C.group.children.slice().forEach(o => {
      if (o.isLight || (o.target && o.target.isObject3D) ) return;
      let keep = false;
      o.traverse(x => { if (x.material && x.material.fog === false) keep = true; });
      if (!keep) o.visible = false;
    });
    const root = gltf.scene; EXT.root = root;
    root.traverse(o => {
      if (!o.isMesh) return;
      const n = o.material.name || '';
      if (/^(Nguoi_|Dau$)/.test(n)) { o.visible = false; return; }
      o.receiveShadow = true;
      o.castShadow = !/^(Nen_Co|QuangTruong|San_|Duong|ViaHe)/.test(o.name || '') && n !== 'Co';
    });
    C.group.add(root);
    cleanExterior(root);
    const fog = C.api.fog; if (fog) { fog.near = 110; fog.far = 420; }
    // đồng hồ, cửa kính, đèn đêm
    ['KimGio', 'KimPhut', 'KimGiay'].forEach(k => EXT.hands[k] = root.getObjectByName(k));
    if (gltf.animations && gltf.animations[0]) {
      EXT.mixer = new THREE.AnimationMixer(root);
      EXT.door = EXT.mixer.clipAction(gltf.animations[0]); EXT.door.play(); EXT.door.paused = true;
    }
    const NIGHT = { Kinh_Sang: [0, 0.95], Kinh: [0, 0.12], Bong_Den: [0.15, 1.8], Mat_Den_Pha: [0.05, 2.4], Kinh_Sanh: [0.18, 0.9] };
    const seenM = new Set();
    root.traverse(o => { if (o.isMesh && NIGHT[o.material.name] && !seenM.has(o.material)) { seenM.add(o.material); EXT.nightMats.push([o.material, ...NIGHT[o.material.name]]); } });
    EXT.dimMats = [];
    root.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial && !seenM.has(o.material)) { seenM.add(o.material); EXT.dimMats.push([o.material, o.material.color.clone()]); } });
    // ghế đá trên sân: mỗi ghế dài 1,8 m → 3 chỗ, tựa lưng ở phía ngoài
    root.traverse(o => {
      if (!/^GheDai_/.test(o.name)) return;
      const b = new THREE.Box3().setFromObject(o), cx = (b.min.x + b.max.x) / 2, side = cx < 0 ? 1 : -1;  // nhìn vào giữa sân
      for (const dz of [-0.6, 0, 0.6]) { const z = (b.min.z + b.max.z) / 2 + dz, x = cx + side * 0.05; EXT.seats.push({ x, y: EXT.grid.floorAt(x - side * 0.6, z), z, ry: side > 0 ? Math.PI / 2 : -Math.PI / 2, floor: 0, kind: 'bench' }); }
    });
    // khối đặc để camera không chui vào toà nhà (hộp bao đơn giản, rẻ hơn bắn tia vào lưới)
    EXT.solids = [
      [-28.9, 0, -40, 28.9, 48, -2.1],        // thân thư viện
      [-28.9, 8.4, -2.1, 28.9, 48, 4.6]       // mặt tiền phía trên mái sảnh
    ];
    for (const n of ['NhaD3', 'NhaD5', 'NhaD9', 'NhaPhai']) { const o = root.getObjectByName(n); if (o) { const b = new THREE.Box3().setFromObject(o); EXT.solids.push([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]); } }
    root.traverse(o => { if (/^CayXoai_[^_]+_\d+$/.test(o.name)) { const b = new THREE.Box3().setFromObject(o); EXT.mango.push({ name: o.name, x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2 }); } });
    // quả xoài trên cây (QuaXoai_*): gán cho cây gần nhất để mini-game hái xoài làm rơi đúng quả
    root.traverse(o => {
      if (!/^QuaXoai_.+_\d+$/.test(o.name)) return;          // mỗi quả là một nhóm nhỏ (thân quả + cuống)
      const p = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      let best = null, bd = 1e9; for (const t of EXT.mango) { const d = Math.hypot(t.x - p.x, t.z - p.z); if (d < bd) { bd = d; best = t; } }
      if (best && bd < 6) (best.fruits = best.fruits || []).push(o);
    });
    H.renderer.shadowMap.needsUpdate = true;

    /* ---- ghế trong thư viện ---- */
    A.group.updateMatrixWorld(true);
    const mA = new THREE.Matrix4().copy(A.group.matrixWorld).invert().multiply(A.api.roomG.matrixWorld);
    const v = new THREE.Vector3();
    const expand = (s, out, floorOf) => {
      const push = (x, z, kind) => out.push({ x, y: s.y, z, ry: s.ry, floor: floorOf(s.y), kind });
      if (/^sofa/.test(s.n)) for (const lx of [-0.5, 0, 0.5]) push(s.x + Math.cos(s.ry) * lx, s.z - Math.sin(s.ry) * lx, 'sofa');
      else push(s.x, s.z, /^arm/.test(s.n) ? 'arm' : /^(bench|booth|island)/.test(s.n) ? 'bench' : /^cube/.test(s.n) ? 'stool' : 'chair');
    };
    const FH = A.api.FH, floorA = y => Math.round(y / FH) * FH;
    const seatsA = [];
    for (const s of log) {
      if (s.tag === 'r401') { v.set(s.x, s.y, s.z).applyMatrix4(mA); expand(Object.assign({}, s, { x: v.x, y: v.y, z: v.z }), seatsA, floorA); seatsA[seatsA.length - 1].room = '401'; }
      else if (s.tag === 'A') expand(s, seatsA, floorA);
    }
    /* tầng 6–7(–10) của module B: "mặt sàn" luôn tính bằng ĐỘ CAO (m) như module A; mô hình dùng số tầng 6/7/10 */
    const BMZ = B.api.MZ, BROOF = B.api.ROOF;
    const lvlB = y => y < BMZ / 2 ? 6 : y < (BMZ + BROOF) / 2 ? 7 : 10;
    const hB = lv => lv === 6 ? 0 : lv === 7 ? BMZ : BROOF;
    const levelB = y => hB(lvlB(y));
    const seatsB = [];
    for (const s of log) if (s.tag === 'B') expand(s, seatsB, levelB);
    // ghế đàn piano (tầng 6): ngồi vào là mở bàn phím đàn
    { const P = B.api.PIANO, a = P.localToWorld(V(0, 0, 1.0)), c = P.localToWorld(V(0, 0, 0));
      B.group.worldToLocal(a); B.group.worldToLocal(c);
      seatsB.push({ x: a.x, y: B.api.groundY(a.x, a.z), z: a.z, ry: Math.atan2(c.x - a.x, c.z - a.z), floor: 0, kind: 'piano' }); }

    /* ---- lưới đi được theo từng tầng (lấy mẫu lười, khi cần) ---- */
    const gridCache = {};
    function roomSpace(mod, seats, o) {
      const api = mod.api;
      return Object.assign({
        kind: 'room', module: mod, group: mod.group, seats,
        get camera() { return api.camera; },
        grid(f) {
          const k = (mod === A ? 'A' : mod === B ? 'B' : 'D') + f;
          if (!gridCache[k]) gridCache[k] = Grid.sample(o.bx[0], o.bz[0], o.bx[1], o.bz[1], 0.4, (x, z) => this.free(x, z, f), 0);
          if (mod === B && f === 0) { const g = gridCache[k]; for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) g.floor[j * g.nx + i] = api.groundY(g.cx(i), g.cz(j)); }
          return gridCache[k];
        },
        isWalking: () => api.getMode() === 'walk',
        mode: () => api.getMode(),
        stopWalk() { api.ext(true); },
        eye() { return api.camera.position; },
        get yaw() { return api.yaw; }, set yaw(v) { api.yaw = v; },
        get pitch() { return api.pitch; }, set pitch(v) { api.pitch = v; },
        keys: api.keys
      }, o);
    }
    const Y4 = A.api.Y4, ROOMZ = A.api.ROOMZ;
    SceneAPI.spaces = {
      campus: {
        kind: 'campus', module: C, group: C.group, seats: EXT.seats, floors: [0], grid: () => EXT.grid,
        get camera() { return C.api.camera; },
        free: (x, z, r) => EXT.grid.free(x, z, r), floorAt: (x, z) => EXT.grid.floorAt(x, z), hit: (x, z) => !EXT.grid.free(x, z),
        /* tia bấm có trúng cửa kính chính không (mặt phẳng cửa z ≈ −2,3) */
        doorHit(ray) { const o = ray.ray.origin, d = ray.ray.direction; if (Math.abs(d.z) < 1e-3) return false; const t = (-2.3 - o.z) / d.z; if (t < 0 || t > 80) return false; const x = o.x + d.x * t, y = o.y + d.y * t; return Math.abs(x) < 4 && y > 1.4 && y < 5.2; },
        solid(x, y, z) { for (const b of EXT.solids) if (x > b[0] && y > b[1] && z > b[2] && x < b[3] && y < b[4] && z < b[5]) return true; return false; },
        ceil: () => 60, floorOf: () => 0,
        spawn: { x: 0, z: 17, yaw: Math.PI }, mango: EXT.mango,
        place(x, y, z) { return y > 1 && z < 5 ? 'Thềm trước thư viện' : z > 29 ? 'Đường trước thư viện' : Math.abs(x) > 36 ? 'Vườn xoài' : z < -24 ? 'Nhà để xe' : 'Sân trước thư viện'; }
      },
      A: roomSpace(A, seatsA, {
        floors: [0, FH, 2 * FH, 3 * FH], bx: [-32, 24], bz: [-40, 15],
        free(x, z, f) { const y = A.api.surface(x, z, f); return y !== null && Math.abs(y - f) < 0.3; },
        ceil: () => 4.2,
        camFree: (x, z, base) => A.api.surface(x, z, base) !== null,
        /* cửa chính tầng 1 (bên trong): bấm vào sàn sát cửa hoặc vào khung cửa */
        doorHit(ray, base) { if (base > 0.5) return false; const o = ray.ray.origin, d = ray.ray.direction; if (Math.abs(d.z) < 1e-3) return false; const t = (12.95 - o.z) / d.z; if (t < 0 || t > 60) return false; const x = o.x + d.x * t, y = o.y + d.y * t; return Math.abs(x) < 2.6 && y > -0.2 && y < 3.2; },
        exitPoint: { x: 0, z: 12.35 },
        floorOf: y => Math.max(0, Math.min(3, Math.round(y / FH))) * FH,
        place(x, y, z) { const fl = Math.round(y / FH) + 1; return fl === 4 && z < -13 ? 'Phòng 401' : 'Tầng ' + fl; },
        walkNow(x, y, z, yaw) { A.api.walkNow(V(x, y + 1.6, z), yaw); }
      }),
      B: roomSpace(B, seatsB, {
        floors: [0, BMZ], bx: [-18.5, 19], bz: [-25, 25],
        free(x, z, f) { return !B.api.blockedAt(x, z, lvlB(f)); },
        camFree: (x, z, base) => !B.api.blockedAt(x, z, lvlB(base)),
        ceil: f => lvlB(f) === 6 ? 3.9 : lvlB(f) === 7 ? 4.3 : 8,
        floorOf: y => levelB(y),
        place(x, y, z) { const l = lvlB(y); return l === 6 ? 'Tầng 6' : l === 7 ? 'Tầng 7' : 'Tầng 10'; },
        walkNow(x, y, z, yaw) { const l = lvlB(y), h = l === 6 ? B.api.groundY(x, z) : hB(l); B.api.walkNow(V(x, h + 1.6, z), yaw, l); },
        piano: B.api.PIANO,
        sitPiano() { B.api.sit(); }
      })
    };
    /* sân thượng tầng 10 (module D): mặt sàn phẳng y = 0, trời mở */
    if (D) {
      const dapi = D.api, KS = dapi.KS;
      SceneAPI.spaces.D = roomSpace(D, dapi.seats(), {
        floors: [0], bx: [dapi.X0, dapi.X1], bz: [dapi.Z0, dapi.Z1],
        free: (x, z) => !dapi.blocked(x, z), camFree: (x, z) => x > dapi.X0 - 1 && x < dapi.X1 + 1 && z > dapi.Z0 - 1 && z < dapi.Z1 + 1 && !(x < KS.x1 + 0.3 && x > KS.x0 - 0.3 && Math.abs(z) < 4.3),
        ceil: () => 30, floorOf: () => 0,
        place(x, y, z) { return Math.hypot(x - dapi.SD.x, z - dapi.SD.z) < dapi.SD.r + 0.5 ? 'Tầng 10 · Đài ngắm sao' : z < -2.6 && x < 3 ? 'Tầng 10 · Giàn đèn' : 'Tầng 10 · Sân thượng'; },
        walkNow(x, y, z, yaw) { dapi.walkNow(V(x, 1.6, z), yaw); },
        lift: { x: KS.x1 + 2.2, z: 0, yaw: Math.PI / 2 },           // cửa thang máy (nhìn ra sân thượng)
        scope: () => dapi.scope(), gaze: (x, z) => dapi.gaze(x, z), leave: () => dapi.leave(), mount: dapi.MOUNT
      });
    }
    // nhãn toà nhà trên sân: chỉ thư viện
    SceneAPI.buildings = [{ id: 'library', name: 'Thư viện Tạ Quang Bửu', door: { x: 0, z: -1.2 }, out: { x: 0, z: 3.5, yaw: 0 }, label: { x: 0, y: 9.5, z: 4 } }];

    /* ---- mỗi khung hình ---- */
    let last = performance.now();
    const frameFn = (dt, now, cam) => {
      if (!switching) {
        const sp = H.cur === C ? 'campus' : H.cur === A ? 'A' : H.cur === B ? 'B' : 'D';
        if (sp !== cur && cur !== 'campus' && sp !== 'campus' && sp !== 'D' && cur !== 'D') { cur = sp; emit('space-changed', sp); } // đi thang máy A ⇄ B
      }
      if (H.cur === C) {
        // đồng hồ mặt tiền theo giờ Hà Nội
        const p = U.hanoiParts(), sec = p.s + (Date.now() % 1000) / 1000, mi = p.mi + sec / 60, hr = (p.h % 12) + mi / 60;
        if (EXT.hands.KimGiay) EXT.hands.KimGiay.rotation.z = -sec / 60 * Math.PI * 2;
        if (EXT.hands.KimPhut) EXT.hands.KimPhut.rotation.z = -mi / 60 * Math.PI * 2;
        if (EXT.hands.KimGio) EXT.hands.KimGio.rotation.z = -hr / 12 * Math.PI * 2;
        if (EXT.door) { EXT.door.time = EXT.doorT * 1.2; EXT.mixer.update(0); }
      }
      for (const f of listeners) f(dt, now, cam);
    };
    A.onFrame = B.onFrame = C.onFrame = frameFn;
    A.afterFrame = B.afterFrame = C.afterFrame = () => { for (const f of after) f(); };
    if (D) { D.onFrame = frameFn; D.afterFrame = A.afterFrame; }

    /* đi bộ ra khỏi cửa thư viện (bên trong) */
    H.ctx.exitLibrary = () => emit('exit-library');
    H.ctx.enterLibrary = () => { };
    SceneAPI.setDoor = t => { EXT.doorT = Math.max(0, Math.min(1, t)); };
    /* màn mờ ngắn khi dịch chuyển trong cùng một khu (đỡ chóng mặt) */
    SceneAPI.fade = async (fn, text) => {
      const f = document.getElementById('fade');
      if (f) { f.textContent = text || ''; f.classList.add('on'); }
      await new Promise(r => setTimeout(r, 350));
      try { fn(); } finally { setTimeout(() => f && f.classList.remove('on'), 150); }
    };

    const fade = document.getElementById('fade');
    /* arr: đến bằng thang máy, ví dụ { floor: 6, idx: 1 } (mô hình tự đặt bạn trong cabin) */
    SceneAPI.enter = async function (id, text, arr) {
      if (switching) return;
      switching = true;
      if (fade) { fade.textContent = text || ''; fade.classList.add('on'); }
      await new Promise(r => setTimeout(r, 420));
      try {
        const sp = SceneAPI.spaces[id];
        H.show(sp.module, arr || undefined);
        if (sp.kind === 'campus') C.api.ext(true); else if (!arr) sp.module.api.ext(true);
        sp.camera.fov = 60; sp.camera.updateProjectionMatrix();
        cur = id;
      } finally {
        await new Promise(r => setTimeout(r, 180));
        if (fade) fade.classList.remove('on');
        switching = false;
      }
    };
    C.api.ext(true);
    for (const m of [A, B, C, D]) if (m) { m.api.camera.fov = 60; m.api.camera.updateProjectionMatrix(); }
    SceneAPI.setNight(night);
    return SceneAPI;
  }

  window.SceneAPI = SceneAPI;
})();
