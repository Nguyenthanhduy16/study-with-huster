/* =====================================================================
   TÍNH LƯỚI DI CHUYỂN CHO SÂN THƯ VIỆN TỪ FILE GLB
   Chạy một lần bằng tools/tao_luoi_san.html → lưu scene/exterior/luoi-di-chuyen.json.
   Nếu thiếu file json, web tự tính lại lúc chạy (chậm hơn vài giây).
   Cách tính:
     1. Bắn tia từ trên xuống ở mỗi ô 0,5 m → độ cao mặt sàn (sân, bậc thềm, bục 1,5 m…)
     2. Mọi bề mặt nằm trong khoảng ngang người (0,45 m → 1,9 m trên mặt sàn) là vật cản
     3. Chỉ giữ các ô đi tới được từ điểm xuất phát, bước lên xuống ≤ 0,4 m (bậc thềm đi được, bục cao thì không)
   ===================================================================== */
(function () {
  'use strict';
  const SKIP = /^(Nguoi_|Dau$)/;   // hình người minh hoạ trong file GLB — bỏ qua

  window.buildWalkGrid = function (root, opt = {}) {
    const x0 = opt.x0 ?? -60, x1 = opt.x1 ?? 60, z0 = opt.z0 ?? -48, z1 = opt.z1 ?? 46, cell = opt.cell ?? 0.5;
    const start = opt.start || { x: 0, z: 16 };
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell);
    const floor = new Float32Array(nx * nz), block = new Uint8Array(nx * nz);
    root.updateMatrixWorld(true);
    const meshes = [];
    root.traverse(o => { if (o.isMesh && o.visible && !SKIP.test(o.material.name || '')) meshes.push(o); });

    // ---- 1. mặt sàn: tia từ y = 2,4 m xuống (bắt được bục 1,5 m, bỏ qua mái sảnh 7 m) ----
    const B = 4, bx = Math.ceil((x1 - x0) / B), bz = Math.ceil((z1 - z0) / B), buckets = Array.from({ length: bx * bz }, () => []);
    const box = new THREE.Box3();
    for (const m of meshes) {
      box.setFromObject(m);
      if (box.min.y > 2.4 || box.max.x < x0 || box.min.x > x1 || box.max.z < z0 || box.min.z > z1) continue;
      const i0 = Math.max(0, Math.floor((box.min.x - x0) / B)), i1 = Math.min(bx - 1, Math.floor((box.max.x - x0) / B));
      const j0 = Math.max(0, Math.floor((box.min.z - z0) / B)), j1 = Math.min(bz - 1, Math.floor((box.max.z - z0) / B));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) buckets[j * bx + i].push(m);
    }
    const ray = new THREE.Raycaster(), o = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0), nm = new THREE.Matrix3();
    ray.far = 3;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
      o.set(x, 2.4, z); ray.set(o, down);
      const cand = buckets[Math.floor((z - z0) / B) * bx + Math.floor((x - x0) / B)];
      const hits = ray.intersectObjects(cand, false);
      let y = 0;
      for (const h of hits) {
        if (!h.face) continue;
        nm.getNormalMatrix(h.object.matrixWorld);
        const n = h.face.normal.clone().applyMatrix3(nm).normalize();
        if (Math.abs(n.y) > 0.5) { y = h.point.y; break; }
      }
      floor[j * nx + i] = y;
    }

    // ---- 2. vật cản: lấy mẫu bề mặt mọi tam giác, điểm nào nằm ngang người thì chặn ô ----
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), p = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
    const STEP = 0.18;
    for (const m of meshes) {
      const g = m.geometry, pos = g.attributes.position, idx = g.index;
      const tri = idx ? idx.count / 3 : pos.count / 3;
      box.setFromObject(m);
      if (box.max.y < 0.3 || box.min.y > 3.6 || box.max.x < x0 || box.min.x > x1 || box.max.z < z0 || box.min.z > z1) continue;
      for (let t = 0; t < tri; t++) {
        const ia = idx ? idx.getX(t * 3) : t * 3, ib = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, ic = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        a.fromBufferAttribute(pos, ia).applyMatrix4(m.matrixWorld);
        b.fromBufferAttribute(pos, ib).applyMatrix4(m.matrixWorld);
        c.fromBufferAttribute(pos, ic).applyMatrix4(m.matrixWorld);
        const ymin = Math.min(a.y, b.y, c.y), ymax = Math.max(a.y, b.y, c.y);
        if (ymax < 0.4 || ymin > 3.5) continue;
        ab.subVectors(b, a); ac.subVectors(c, a);
        const lab = ab.length(), lac = ac.length();
        const nu = Math.max(1, Math.ceil(lab / STEP)), nv = Math.max(1, Math.ceil(lac / STEP));
        for (let u = 0; u <= nu; u++) for (let v = 0; v <= nv - (u * nv / nu); v++) {
          const fu = u / nu, fv = v / nv;
          if (fu + fv > 1.0001) continue;
          p.copy(a).addScaledVector(ab, fu).addScaledVector(ac, fv);
          const i = Math.floor((p.x - x0) / cell), j = Math.floor((p.z - z0) / cell);
          if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
          const f = floor[j * nx + i];
          if (p.y > f + 0.45 && p.y < f + 1.9) block[j * nx + i] = 1;
        }
      }
    }

    // ---- 3. chỉ giữ vùng đi tới được từ điểm xuất phát ----
    const walk = new Uint8Array(nx * nz);
    const si = Math.floor((start.x - x0) / cell), sj = Math.floor((start.z - z0) / cell);
    const q = [sj * nx + si]; walk[q[0]] = 1;
    while (q.length) {
      const k = q.pop(), i = k % nx, j = (k / nx) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const kk = jj * nx + ii;
        if (walk[kk] || block[kk] || Math.abs(floor[kk] - floor[k]) > 0.4) continue;
        walk[kk] = 1; q.push(kk);
      }
    }
    return new Grid(x0, z0, cell, nx, nz, walk, floor);
  };
})();
