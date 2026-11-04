// =============================================================
//  sdf.js — dựng hình liền khối bằng hàm khoảng cách (SDF)
//  + Surface Nets để biến SDF thành lưới tam giác
//
//  Nhờ phép "hợp mềm" (smooth union), vai nối liền thân, cổ nối liền đầu,
//  tay áo nối liền thân áo... thay vì là các khối rời ghép lại.
// =============================================================
import * as THREE from 'three';

// ---------------------------------------------------------- phép toán
export function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function smax(a, b, k) { return -smin(-a, -b, k); }

// Elip (gần đúng) — tâm c, bán trục r
export function ellipsoid(x, y, z, c, r) {
  const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  const qx = px / r[0], qy = py / r[1], qz = pz / r[2];
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz);
  return k1 === 0 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
}

// Nón bo tròn (đoạn thẳng a→b, bán kính r1 → r2) — công thức của Inigo Quilez
export function roundCone(x, y, z, a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = x - a[0], pay = y - a[1], paz = z - a[2];
  const yy = pax * bax + pay * bay + paz * baz;
  const zz = yy - l2;
  const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = yy * yy * l2;
  const z2 = zz * zz * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
}

// Hộp bo góc trong hệ toạ độ cục bộ (đã biến đổi sẵn)
export function roundBox(px, py, pz, b, r) {
  const qx = Math.abs(px) - b[0] + r, qy = Math.abs(py) - b[1] + r, qz = Math.abs(pz) - b[2] + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
}

// Xuyến nằm ngang (cổ áo)
export function torusY(x, y, z, c, R, r, sx = 1, sz = 1) {
  const dx = (x - c[0]) / sx, dz = (z - c[2]) / sz;
  const q = Math.sqrt(dx * dx + dz * dz) - R;
  const dy = y - c[1];
  return Math.sqrt(q * q + dy * dy) - r;
}

// Khoảng cách từ điểm tới đoạn thẳng (dùng cho trọng số xương)
export function segDist(x, y, z, a, b) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const pax = x - a[0], pay = y - a[1], paz = z - a[2];
  const t = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * t, dy = pay - bay * t, dz = paz - baz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
// Tham số t (chưa kẹp) của hình chiếu lên đoạn a→b
export function segT(x, y, z, a, b) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  return ((x - a[0]) * bax + (y - a[1]) * bay + (z - a[2]) * baz) / (bax * bax + bay * bay + baz * baz);
}

// ---------------------------------------------------------- Surface Nets
/**
 * Lấy mẫu field(x,y,z) trên lưới đều trong hộp [min,max] với bước `cell`,
 * trả về BufferGeometry có index (pháp tuyến mượt).
 */
export function surfaceNets(field, min, max, cell) {
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
  const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
  const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const F = new Float32Array(nx * ny * nz);
  const id = (i, j, k) => i + nx * (j + ny * k);
  // Lấy mẫu theo khối 4×4×4: khối nằm xa bề mặt thì chỉ cần 1 lần tính (tăng tốc ~5–10 lần)
  const B = 4;
  const far = B * cell * 0.87 * 1.6 + cell;
  for (let bk = 0; bk < nz; bk += B) for (let bj = 0; bj < ny; bj += B) for (let bi = 0; bi < nx; bi += B) {
    const ei = Math.min(bi + B, nx), ej = Math.min(bj + B, ny), ek = Math.min(bk + B, nz);
    const cx = min[0] + (bi + (ei - bi - 1) / 2) * cell;
    const cy = min[1] + (bj + (ej - bj - 1) / 2) * cell;
    const cz = min[2] + (bk + (ek - bk - 1) / 2) * cell;
    const dc = field(cx, cy, cz);
    if (Math.abs(dc) > far) {
      for (let k = bk; k < ek; k++) for (let j = bj; j < ej; j++) for (let i = bi; i < ei; i++) F[id(i, j, k)] = dc;
    } else {
      for (let k = bk; k < ek; k++) {
        const z = min[2] + k * cell;
        for (let j = bj; j < ej; j++) {
          const y = min[1] + j * cell;
          for (let i = bi; i < ei; i++) F[id(i, j, k)] = field(min[0] + i * cell, y, z);
        }
      }
    }
  }

  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cid = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  let nv = 0;
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const [a, b, d] = corners[c];
      v[c] = F[id(i + a, j + b, k + d)];
      if (v[c] < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [e0, e1] of edges) {
      const a0 = v[e0], a1 = v[e1];
      if ((a0 < 0) === (a1 < 0)) continue;
      const t = a0 / (a0 - a1);
      const c0 = corners[e0], c1 = corners[e1];
      sx += c0[0] + (c1[0] - c0[0]) * t;
      sy += c0[1] + (c1[1] - c0[1]) * t;
      sz += c0[2] + (c1[2] - c0[2]) * t;
      n++;
    }
    pos.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
    cellVert[cid(i, j, k)] = nv++;
  }

  const idx = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const s0 = F[id(i, j, k)] < 0;
    // cạnh theo X: các ô lệch theo (y,z)
    if (i < nx - 1 && s0 !== (F[id(i + 1, j, k)] < 0)) {
      quad(cellVert[cid(i, j - 1, k - 1)], cellVert[cid(i, j, k - 1)], cellVert[cid(i, j, k)], cellVert[cid(i, j - 1, k)], !s0);
    }
    // cạnh theo Y: các ô lệch theo (z,x)
    if (j < ny - 1 && s0 !== (F[id(i, j + 1, k)] < 0)) {
      quad(cellVert[cid(i - 1, j, k - 1)], cellVert[cid(i - 1, j, k)], cellVert[cid(i, j, k)], cellVert[cid(i, j, k - 1)], !s0);
    }
    // cạnh theo Z: các ô lệch theo (x,y)
    if (k < nz - 1 && s0 !== (F[id(i, j, k + 1)] < 0)) {
      quad(cellVert[cid(i - 1, j - 1, k)], cellVert[cid(i, j - 1, k)], cellVert[cid(i, j, k)], cellVert[cid(i - 1, j, k)], !s0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Làm mượt nhẹ vị trí đỉnh (Laplacian) để bớt bậc thang của lưới */
export function relax(geo, iterations = 1, amount = 0.5) {
  const pos = geo.attributes.position;
  const index = geo.index.array;
  const n = pos.count;
  const nbr = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < index.length; i += 3) {
    const a = index[i], b = index[i + 1], c = index[i + 2];
    nbr[a].add(b); nbr[a].add(c); nbr[b].add(a); nbr[b].add(c); nbr[c].add(a); nbr[c].add(b);
  }
  const p = pos.array;
  for (let it = 0; it < iterations; it++) {
    const next = new Float32Array(p);
    for (let i = 0; i < n; i++) {
      const s = nbr[i]; if (!s.size) continue;
      let x = 0, y = 0, z = 0;
      for (const j of s) { x += p[j * 3]; y += p[j * 3 + 1]; z += p[j * 3 + 2]; }
      x /= s.size; y /= s.size; z /= s.size;
      next[i * 3] += (x - p[i * 3]) * amount;
      next[i * 3 + 1] += (y - p[i * 3 + 1]) * amount;
      next[i * 3 + 2] += (z - p[i * 3 + 2]) * amount;
    }
    p.set(next);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Gán trọng số xương cho từng đỉnh theo khoảng cách tới các đoạn xương.
 * segments: [{ bone: index, a:[x,y,z], b:[x,y,z] }]
 */
export function skinByDistance(geo, segments) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  const tmp = segments.map(() => 0);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    for (let s = 0; s < segments.length; s++) {
      const d = segDist(x, y, z, segments[s].a, segments[s].b);
      tmp[s] = 1 / Math.pow(d * d + 1e-4, 2);
    }
    // 4 xương gần nhất
    const order = tmp.map((w, s) => s).sort((a, b) => tmp[b] - tmp[a]).slice(0, 4);
    let sum = 0;
    for (const s of order) sum += tmp[s];
    order.forEach((s, k) => { si[i * 4 + k] = segments[s].bone; sw[i * 4 + k] = tmp[s] / sum; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}
