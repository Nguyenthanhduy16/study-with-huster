self.window = self; importScripts('../scene/vendor/three.min.js');
/* Tự sinh bởi tools/build_avatar.mjs — đừng sửa tay, sửa trong avatar/src rồi đóng gói lại */
(function(T){ if (T && !T.CapsuleGeometry) { T.CapsuleGeometry = class CapsuleGeometry extends T.LatheGeometry {
  constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
    const p = new T.Path(); p.absarc(0, -length / 2, radius, Math.PI * 1.5, 0); p.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
    super(p.getPoints(capSegments), radialSegments); this.type = 'CapsuleGeometry';
  } }; } })(window.THREE);
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // three-global:three
  var require_three = __commonJS({
    "three-global:three"(exports, module) {
      module.exports = window.THREE;
    }
  });

  // avatar/src/js/rig.js
  var THREE2 = __toESM(require_three());

  // avatar/src/js/sdf.js
  var THREE = __toESM(require_three());
  function smin(a, b, k) {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }
  function ellipsoid(x, y, z, c, r) {
    const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
    const k0 = Math.sqrt(px * px + py * py + pz * pz);
    const qx = px / r[0], qy = py / r[1], qz = pz / r[2];
    const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz);
    return k1 === 0 ? -Math.min(r[0], r[1], r[2]) : k0 * (k0 - 1) / k1;
  }
  function roundCone(x, y, z, a, b, r1, r2) {
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
  function roundBox(px, py, pz, b, r) {
    const qx = Math.abs(px) - b[0] + r, qy = Math.abs(py) - b[1] + r, qz = Math.abs(pz) - b[2] + r;
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
  }
  function torusY(x, y, z, c, R, r, sx = 1, sz = 1) {
    const dx = (x - c[0]) / sx, dz = (z - c[2]) / sz;
    const q = Math.sqrt(dx * dx + dz * dz) - R;
    const dy = y - c[1];
    return Math.sqrt(q * q + dy * dy) - r;
  }
  function segDist(x, y, z, a, b) {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    const pax = x - a[0], pay = y - a[1], paz = z - a[2];
    const t = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
    const dx = pax - bax * t, dy = pay - bay * t, dz = paz - baz * t;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function segT(x, y, z, a, b) {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    return ((x - a[0]) * bax + (y - a[1]) * bay + (z - a[2]) * baz) / (bax * bax + bay * bay + baz * baz);
  }
  function surfaceNets(field, min, max, cell) {
    const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
    const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
    const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
    const F = new Float32Array(nx * ny * nz);
    const id = (i, j, k) => i + nx * (j + ny * k);
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
        if (a0 < 0 === a1 < 0) continue;
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
      if (flip) idx.push(a, c, b, a, d, c);
      else idx.push(a, b, c, a, c, d);
    };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const s0 = F[id(i, j, k)] < 0;
      if (i < nx - 1 && s0 !== F[id(i + 1, j, k)] < 0) {
        quad(cellVert[cid(i, j - 1, k - 1)], cellVert[cid(i, j, k - 1)], cellVert[cid(i, j, k)], cellVert[cid(i, j - 1, k)], !s0);
      }
      if (j < ny - 1 && s0 !== F[id(i, j + 1, k)] < 0) {
        quad(cellVert[cid(i - 1, j, k - 1)], cellVert[cid(i - 1, j, k)], cellVert[cid(i, j, k)], cellVert[cid(i, j, k - 1)], !s0);
      }
      if (k < nz - 1 && s0 !== F[id(i, j, k + 1)] < 0) {
        quad(cellVert[cid(i - 1, j - 1, k)], cellVert[cid(i, j - 1, k)], cellVert[cid(i, j, k)], cellVert[cid(i - 1, j, k)], !s0);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function relax(geo, iterations = 1, amount = 0.5) {
    const pos = geo.attributes.position;
    const index = geo.index.array;
    const n = pos.count;
    const nbr = Array.from({ length: n }, () => /* @__PURE__ */ new Set());
    for (let i = 0; i < index.length; i += 3) {
      const a = index[i], b = index[i + 1], c = index[i + 2];
      nbr[a].add(b);
      nbr[a].add(c);
      nbr[b].add(a);
      nbr[b].add(c);
      nbr[c].add(a);
      nbr[c].add(b);
    }
    const p = pos.array;
    for (let it = 0; it < iterations; it++) {
      const next = new Float32Array(p);
      for (let i = 0; i < n; i++) {
        const s = nbr[i];
        if (!s.size) continue;
        let x = 0, y = 0, z = 0;
        for (const j of s) {
          x += p[j * 3];
          y += p[j * 3 + 1];
          z += p[j * 3 + 2];
        }
        x /= s.size;
        y /= s.size;
        z /= s.size;
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
  function skinByDistance(geo, segments) {
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
      const order = tmp.map((w, s) => s).sort((a, b) => tmp[b] - tmp[a]).slice(0, 4);
      let sum = 0;
      for (const s of order) sum += tmp[s];
      order.forEach((s, k) => {
        si[i * 4 + k] = segments[s].bone;
        sw[i * 4 + k] = tmp[s] / sum;
      });
    }
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    return geo;
  }

  // avatar/src/js/rig.js
  var DIM = {
    pelvisY: 0.965,
    // khớp hông so với mặt đất
    thigh: 0.43,
    shin: 0.42,
    upperArm: 0.28,
    foreArm: 0.25,
    shoulderY: 0.4,
    // vai so với khung chậu
    headY: 0.572,
    // gốc xương đầu so với khung chậu
    headR: 0.115
  };
  var BUILDS = {
    thon: { sx: 1, sz: 0.62, limb: 0.92 },
    vua: { sx: 1.1, sz: 0.66, limb: 1 },
    dam: { sx: 1.22, sz: 0.74, limb: 1.12 }
  };
  var PROFILE = [
    [-0.13, 0.1],
    [-0.08, 0.14],
    [-0.02, 0.148],
    [0.05, 0.142],
    [0.12, 0.134],
    [0.2, 0.142],
    [0.28, 0.16],
    [0.36, 0.17],
    [0.42, 0.164],
    [0.47, 0.125],
    [0.51, 0.06]
  ];
  function trunkRadius(y) {
    const P = PROFILE;
    if (y <= P[0][0]) return P[0][1];
    if (y >= P[P.length - 1][0]) return P[P.length - 1][1];
    let i = 0;
    while (P[i + 1][0] < y) i++;
    const p0 = P[Math.max(0, i - 1)][1], p1 = P[i][1], p2 = P[i + 1][1], p3 = P[Math.min(P.length - 1, i + 2)][1];
    const t = (y - P[i][0]) / (P[i + 1][0] - P[i][0]);
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  }
  var rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
  var add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  var modelCache = /* @__PURE__ */ new Map();
  function bodyModel(buildName = "vua") {
    if (modelCache.has(buildName)) return modelCache.get(buildName);
    const b = BUILDS[buildName] || BUILDS.vua;
    const L = b.limb;
    const P = [0, DIM.pelvisY, 0];
    const shoulderX = trunkRadius(DIM.shoulderY + 0.02) * b.sx + 0.03;
    const kz = Math.min(b.sx, b.sz);
    const arms = {};
    for (const [side, s] of [["L", 1], ["R", -1]]) {
      const sh = [s * shoulderX, P[1] + DIM.shoulderY, 0];
      const dir = rotZ([0, -1, 0], s * 0.09);
      const el = add(sh, dir, DIM.upperArm);
      const wr = add(el, dir, DIM.foreArm);
      const az = -s * 0.09, ay = -s * 0.25;
      arms[side] = {
        s,
        sh,
        el,
        wr,
        dir,
        upper: [0.05 * L, 0.04 * L],
        fore: [0.04 * L, 0.031 * L],
        deltoid: { c: add(sh, [s * 4e-3, -0.028, 0]), r: [0.06 * L, 0.078 * L, 0.062 * L] },
        toLocal(x, y, z) {
          let px = x - wr[0], py = y - wr[1], pz = z - wr[2];
          const cz = Math.cos(az), sz = Math.sin(az);
          const x1 = px * cz - py * sz, y1 = px * sz + py * cz;
          const cy = Math.cos(ay), sy = Math.sin(ay);
          return [x1 * cy + pz * sy, y1, -x1 * sy + pz * cy];
        }
      };
    }
    const legs = {};
    for (const [side, s] of [["L", 1], ["R", -1]]) {
      const hp = [s * 0.083 * b.sx, P[1] - 0.045, 0];
      const kn = [hp[0], hp[1] - DIM.thigh, 0];
      const an = [hp[0], kn[1] - DIM.shin, 0];
      legs[side] = {
        s,
        hp,
        kn,
        an,
        thigh: { a: add(hp, [0, 0.05, 0]), r: [0.084 * L, 0.056 * L] },
        shin: [0.055 * L, 0.036 * L],
        calf: { c: add(kn, [0, -0.13, -0.014]), r: [0.05 * L, 0.11, 0.05 * L] },
        glute: { c: [s * 0.062 * b.sx, P[1] - 0.055, -0.05 * b.sz / 0.66], r: [0.074 * b.sx / 1.1, 0.085, 0.07 * b.sz / 0.66] }
      };
    }
    const headBone = [0, P[1] + DIM.headY, 0];
    const head = {
      bone: headBone,
      cranium: { c: add(headBone, [0, 0.115, 0]), r: [0.1, 0.113, 0.11] },
      jaw: { c: add(headBone, [0, 0.062, 0.026]), r: [0.074, 0.07, 0.08] },
      nose: { c: add(headBone, [0, 0.086, 0.106]), r: [0.013, 0.021, 0.016] },
      ears: [1, -1].map((s) => ({ c: add(headBone, [s * 0.098, 0.11, -6e-3]), r: [0.013, 0.03, 0.02] })),
      neck: { a: [0, P[1] + 0.44, 0], b: [0, P[1] + 0.64, 4e-3], r: [0.052, 0.045] }
    };
    function trunk(x, y, z, inflate = 0) {
      const ty = y - P[1];
      const yc = Math.min(0.51, Math.max(-0.13, ty));
      const q = Math.sqrt((x / b.sx) ** 2 + (z / b.sz) ** 2);
      const dr = (q - trunkRadius(yc)) * kz - inflate;
      const dy = Math.max(-0.13 - ty, ty - 0.51);
      return dy > 0 ? Math.hypot(Math.max(dr, 0), dy) + Math.min(Math.max(dr, dy), 0) : dr;
    }
    function hand(arm2, x, y, z) {
      const [lx, ly, lz] = arm2.toLocal(x, y, z);
      const s = arm2.s;
      const palm = roundBox(lx, ly + 0.048, lz - 2e-3, [0.015, 0.036, 0.033], 0.013);
      const fing = roundBox(lx + s * 5e-3, ly + 0.108, lz - 4e-3, [0.012, 0.034, 0.03], 0.011);
      const thumb = roundCone(lx, ly, lz, [-s * 0.01, -0.03, 0.026], [-s * 0.016, -0.074, 0.04], 0.012, 9e-3);
      return smin(smin(palm, fing, 0.02), thumb, 0.012);
    }
    function arm(side, x, y, z, inflate = 0, { upTo = Infinity, withHand = true } = {}) {
      const A = arms[side];
      let d = roundCone(x, y, z, A.sh, A.el, A.upper[0] + inflate, A.upper[1] + inflate);
      if (upTo > DIM.upperArm) {
        const fa = roundCone(x, y, z, A.el, A.wr, A.fore[0] + inflate, A.fore[1] + inflate);
        d = smin(d, fa, 0.02);
        if (withHand && upTo === Infinity) d = smin(d, hand(A, x, y, z) - inflate, 0.018);
      }
      return d;
    }
    function deltoid(side, x, y, z, inflate = 0) {
      const D = arms[side].deltoid;
      return ellipsoid(x, y, z, D.c, [D.r[0] + inflate, D.r[1] + inflate, D.r[2] + inflate]);
    }
    function foot(leg2, x, y, z) {
      const px = x - leg2.an[0], py = y - leg2.an[1], pz = z - leg2.an[2];
      const f = roundBox(px, py + 0.046, pz - 0.048, [0.038, 0.024, 0.098], 0.021);
      const heel = ellipsoid(px, py, pz, [0, -0.04, -0.02], [0.034, 0.034, 0.038]);
      return smin(f, heel, 0.02);
    }
    function leg(side, x, y, z, inflate = 0, { thighOnly = false, shinTo = 1, flare = 0 } = {}) {
      const G = legs[side];
      let d = roundCone(x, y, z, G.thigh.a, G.kn, G.thigh.r[0] + inflate, G.thigh.r[1] + inflate + flare * 0.3);
      if (!thighOnly) {
        const end = add(G.kn, [0, -DIM.shin * shinTo, 0]);
        const shin = roundCone(x, y, z, G.kn, end, G.shin[0] + inflate + flare * 0.3, G.shin[1] + inflate + flare);
        d = smin(d, shin, 0.03);
        const calf = ellipsoid(x, y, z, G.calf.c, [G.calf.r[0] + inflate, G.calf.r[1], G.calf.r[2] + inflate]);
        d = smin(d, calf, 0.035);
      }
      return d;
    }
    function glute(side, x, y, z, inflate = 0) {
      const G = legs[side].glute;
      return ellipsoid(x, y, z, G.c, [G.r[0] + inflate, G.r[1] + inflate, G.r[2] + inflate]);
    }
    function headSDF(x, y, z, inflate = 0, { features = true } = {}) {
      const H = head;
      let d = smin(
        ellipsoid(x, y, z, H.cranium.c, H.cranium.r.map((r) => r + inflate)),
        ellipsoid(x, y, z, H.jaw.c, H.jaw.r.map((r) => r + inflate)),
        0.05
      );
      if (features) {
        d = smin(d, ellipsoid(x, y, z, H.nose.c, H.nose.r), 0.014);
        for (const e of H.ears) d = smin(d, ellipsoid(x, y, z, e.c, e.r), 0.01);
      }
      return d;
    }
    function neck(x, y, z, inflate = 0) {
      return roundCone(x, y, z, head.neck.a, head.neck.b, head.neck.r[0] + inflate, head.neck.r[1] + inflate);
    }
    function body(x, y, z) {
      let d = trunk(x, y, z);
      for (const s of ["L", "R"]) {
        d = smin(d, deltoid(s, x, y, z), 0.045);
        d = smin(d, glute(s, x, y, z), 0.04);
      }
      d = smin(d, neck(x, y, z), 0.04);
      d = smin(d, headSDF(x, y, z), 0.035);
      for (const s of ["L", "R"]) {
        d = smin(d, arm(s, x, y, z), 0.012);
        const lg = smin(leg(s, x, y, z), foot(legs[s], x, y, z), 0.025);
        d = smin(d, lg, 0.03);
      }
      return d;
    }
    const segments = [
      { bone: 0, a: add(P, [0, -0.1, 0]), b: add(P, [0, 0.46, 0]) },
      { bone: 1, a: add(P, [0, 0.6, 0]), b: add(P, [0, 0.8, 0]) }
    ];
    ["L", "R"].forEach((s, k) => {
      const A = arms[s], base = 2 + k * 3;
      segments.push({ bone: base, a: A.sh, b: A.el }, { bone: base + 1, a: A.el, b: A.wr }, { bone: base + 2, a: A.wr, b: add(A.wr, A.dir, 0.12) });
    });
    ["L", "R"].forEach((s, k) => {
      const G = legs[s], base = 8 + k * 3;
      segments.push({ bone: base, a: G.hp, b: G.kn }, { bone: base + 1, a: G.kn, b: G.an }, { bone: base + 2, a: G.an, b: add(G.an, [0, -0.04, 0.14]) });
    });
    const model = { name: buildName, b, L, P, shoulderX, arms, legs, head, segments, trunk, arm, deltoid, leg, glute, foot, hand, headSDF, neck, body };
    modelCache.set(buildName, model);
    return model;
  }
  var bodyGeoCache = /* @__PURE__ */ new Map();
  function skinBody(geo, M) {
    const p = geo.attributes.position, count = p.count;
    const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const distances = [
        Math.min(M.trunk(x, y, z), M.neck(x, y, z), M.glute("L", x, y, z), M.glute("R", x, y, z)),
        M.headSDF(x, y, z),
        Math.min(M.arm("L", x, y, z), M.deltoid("L", x, y, z)),
        Math.min(M.arm("R", x, y, z), M.deltoid("R", x, y, z)),
        Math.min(M.leg("L", x, y, z), M.foot(M.legs.L, x, y, z)),
        Math.min(M.leg("R", x, y, z), M.foot(M.legs.R, x, y, z))
      ];
      let region = 0;
      for (let k = 1; k < distances.length; k++) if (distances[k] < distances[region]) region = k;
      const allowed = /* @__PURE__ */ new Set();
      const addChain = (base) => {
        allowed.add(base);
        allowed.add(base + 1);
        allowed.add(base + 2);
      };
      if (region === 0) {
        allowed.add(0);
        if (y > M.P[1] + 0.47) allowed.add(1);
        if (y > M.P[1] + 0.24) {
          if (distances[2] - distances[0] < 0.04) addChain(2);
          if (distances[3] - distances[0] < 0.04) addChain(5);
        }
        if (y < M.P[1] + 0.08) {
          addChain(8);
          addChain(11);
        }
      } else if (region === 1) {
        allowed.add(1);
        if (y < M.P[1] + 0.66) allowed.add(0);
      } else if (region === 2 || region === 3) {
        const side = region === 2 ? "L" : "R", arm = M.arms[side];
        addChain(region === 2 ? 2 : 5);
        if (y > M.P[1] + 0.24 && segT(x, y, z, arm.sh, arm.wr) < 0.3) allowed.add(0);
      } else {
        addChain(region === 4 ? 8 : 11);
        if (y > M.P[1] - 0.16) allowed.add(0);
      }
      const candidates = M.segments.filter((segment) => allowed.has(segment.bone)).map((segment) => {
        const d = segDist(x, y, z, segment.a, segment.b);
        return { bone: segment.bone, weight: 1 / Math.pow(d * d + 1e-4, 2) };
      }).sort((a, b) => b.weight - a.weight).slice(0, 4);
      const sum = candidates.reduce((total, entry) => total + entry.weight, 0);
      candidates.forEach((entry, k) => {
        indices[i * 4 + k] = entry.bone;
        weights[i * 4 + k] = entry.weight / sum;
      });
    }
    geo.setAttribute("skinIndex", new THREE2.Uint16BufferAttribute(indices, 4));
    geo.setAttribute("skinWeight", new THREE2.Float32BufferAttribute(weights, 4));
    return geo;
  }
  function bodyGeometry(model) {
    if (bodyGeoCache.has(model.name)) return bodyGeoCache.get(model.name);
    const g = surfaceNets(model.body, [-0.45, -0.02, -0.2], [0.45, 1.86, 0.3], 0.0105);
    relax(g, 1, 0.45);
    skinBody(g, model);
    g.userData.keep = true;
    bodyGeoCache.set(model.name, g);
    return g;
  }
  var BODY_GEOMETRY = (buildName) => bodyGeometry(bodyModel(buildName));

  // avatar/src/js/items/clothing.js
  var THREE4 = __toESM(require_three());

  // avatar/src/js/textures.js
  var THREE3 = __toESM(require_three());

  // avatar/src/js/items/clothing.js
  var TAU = Math.PI * 2;
  var wrap = (u) => u - Math.floor(u);
  var clamp01 = (v) => Math.max(0, Math.min(1, v));
  var smooth = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  function perTriangleUV(geo, uvOf) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let t = 0; t < pos.count; t += 3) {
      const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
      const cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
      const cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
      const tri = [0, 1, 2].map((k) => uvOf(pos.getX(t + k), pos.getY(t + k), pos.getZ(t + k), cx, cy, cz));
      const period = tri[0][2], origin = tri[0][3], clampIt = tri[0][4];
      const us = tri.map((p) => p[0]);
      if (Math.max(...us) - Math.min(...us) > period * 0.5) {
        for (const p of tri) if (p[0] < origin + period * 0.5) p[0] += period;
        if (clampIt) for (const p of tri) p[0] = Math.min(p[0], origin + period - 1e-3);
      }
      tri.forEach((p, k) => {
        uv[(t + k) * 2] = p[0];
        uv[(t + k) * 2 + 1] = p[1];
      });
    }
    g.setAttribute("uv", new THREE4.BufferAttribute(uv, 2));
    return g;
  }
  function skinTop(geo, M, options, garmentParts = null) {
    const fullArm = DIM.upperArm + DIM.foreArm;
    const sleeveLen = options.sleeve === "long" ? fullArm - 0.025 : options.sleeve === "none" ? 0 : 0.15;
    const p = geo.attributes.position;
    const indices = new Uint16Array(p.count * 4), weights = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const trunk = Math.min(M.trunk(x, y, z), M.neck(x, y, z), M.glute("L", x, y, z), M.glute("R", x, y, z));
      const arms = ["L", "R"].map((side2) => {
        const A = M.arms[side2], along = segT(x, y, z, A.sh, A.wr) * fullArm;
        return Math.max(Math.min(
          M.arm(side2, x, y, z, 0, { upTo: sleeveLen, withHand: false }),
          M.deltoid(side2, x, y, z)
        ), along - sleeveLen);
      });
      const sideIndex = arms[0] <= arms[1] ? 0 : 1, side = sideIndex === 0 ? "L" : "R";
      const shoulderBlend = smooth(M.P[1] + 0.2, M.P[1] + 0.28, y);
      let blend = sleeveLen ? smooth(-0.035 * shoulderBlend, 0.035, trunk - arms[sideIndex]) : 0;
      if (options.sleeve === "long" && garmentParts) {
        const parts = garmentParts(x, y, z);
        const separated = 1 - smooth(M.P[1] + 0.2, M.P[1] + 0.3, y);
        const width = 6e-3 + 0.035 * (1 - separated);
        const sleeveWeight = smooth(-width, width, parts.trunk - Math.min(...parts.arms));
        blend = blend * (1 - separated) + sleeveWeight * separated;
      }
      const base = side === "L" ? 2 : 5;
      const candidates = M.segments.filter((s) => s.bone >= base && s.bone <= base + 2).map((s) => {
        const d = segDist(x, y, z, s.a, s.b);
        return { bone: s.bone, w: 1 / Math.pow(d * d + 1e-4, 2) };
      });
      const sum = candidates.reduce((n, s) => n + s.w, 0);
      indices[i * 4] = 0;
      weights[i * 4] = 1 - blend;
      candidates.forEach((s, k) => {
        indices[i * 4 + k + 1] = s.bone;
        weights[i * 4 + k + 1] = blend * s.w / sum;
      });
    }
    geo.setAttribute("skinIndex", new THREE4.Uint16BufferAttribute(indices, 4));
    geo.setAttribute("skinWeight", new THREE4.Float32BufferAttribute(weights, 4));
    return geo;
  }
  function hairGeometry(M, style, hatOn) {
    const H = M.head;
    const C = H.cranium.c;
    if (style === "moi" || style === "moi-nape") {
      const nape = style === "moi-nape";
      const locks = nape ? Array.from({ length: 9 }, (_, k) => {
        const i = k - 4, ax = i * 0.019, length = 0.192 + 0.025 * Math.cos(i * 1.9);
        return [
          [C[0] + ax, C[1] - 0.09, C[2] - 0.104],
          [C[0] + ax + Math.sin(i * 2.1) * 0.011, C[1] - length, C[2] - 0.119 - 9e-3 * Math.cos(i)]
        ];
      }) : Array.from({ length: 11 }, (_, k) => {
        const i = k - 5, ax = i * 0.014, tip = 0.012 + 0.012 * (0.5 + 0.5 * Math.sin(i * 2.3 + 0.4));
        return [
          [C[0] + ax, C[1] + 0.063, C[2] + 0.084],
          [C[0] + ax + Math.sin(i * 1.7) * 4e-3, C[1] + tip, C[2] + 0.117]
        ];
      });
      const field2 = (x, y, z) => {
        const rx = x - C[0], ry = y - C[1], rz = z - C[2];
        let d;
        if (nape) {
          d = ellipsoid(x, y, z, [C[0], C[1] - 0.068, C[2] - 0.092], [0.096, 0.121, 0.046]);
          for (const [a, b] of locks) d = smin(d, roundCone(x, y, z, a, b, 0.019, 35e-4), 6e-3);
          return Math.max(d, rz + 0.038);
        }
        const front = smooth(0.025, 0.09, rz);
        const side = smooth(0.045, 0.092, Math.abs(rx)) * smooth(-0.085, -0.02, rz);
        const brokenEdge = Math.sin(rx * 205 + 0.8) * 4e-3 + Math.sin(rx * 337) * 3e-3;
        const hairline = -0.018 + 0.057 * side + (0.045 + brokenEdge) * front;
        const texture = (Math.sin(rx * 175 + rz * 65) * Math.cos(rz * 155) + Math.sin(rx * 91 - rz * 147)) * 25e-4;
        const thickness = hatOn ? 6e-3 : 0.014 + texture * smooth(0.02, 0.08, ry);
        d = Math.max(M.headSDF(x, y, z, thickness, { features: false }), hairline - ry);
        if (!hatOn) for (const [a, b] of locks) d = smin(d, roundCone(x, y, z, a, b, 0.012, 25e-4), 3e-3);
        return d;
      };
      const g2 = surfaceNets(
        field2,
        [C[0] - 0.16, C[1] - (nape ? 0.25 : 0.06), C[2] - 0.17],
        [C[0] + 0.16, C[1] + (nape ? 0.08 : 0.17), C[2] + (nape ? -0.025 : 0.16)],
        52e-4
      );
      relax(g2, 1, 0.15);
      g2.translate(-H.bone[0], -H.bone[1], -H.bone[2]);
      return g2;
    }
    if (style === "xoan") {
      const curls = (x, y, z) => {
        const a = 78;
        const c = Math.sin(x * a + 1.3) * Math.sin(y * a * 0.95 + 0.7) * Math.sin(z * a + 2.1) + 0.5 * Math.sin(x * a * 1.9 + z * 31) * Math.sin(y * a * 1.8 - 0.4) * Math.cos(z * a * 1.7 + x * 20);
        return Math.max(0, c);
      };
      const field2 = (x, y, z) => {
        const rx = x - C[0], ry = y - C[1], rz = z - C[2];
        const puff = hatOn ? 0.012 : 0.03 + 0.012 * smooth(0, 0.09, ry);
        let d = M.headSDF(x, y, z, puff, { features: false });
        if (!hatOn) d = smin(d, ellipsoid(x, y, z, [C[0], C[1] + 0.05, C[2] - 0.012], [0.118, 0.085, 0.124]), 0.04);
        for (const s of [-1, 1]) {
          d = smin(d, ellipsoid(x, y, z, [C[0] + s * 0.086, C[1] - 0.02, C[2] - 0.02], [0.058, 0.075, 0.08]), 0.04);
          d = smin(d, ellipsoid(x, y, z, [C[0] + s * 0.07, C[1] - 0.105, C[2] - 0.035], [0.042, 0.06, 0.06]), 0.04);
        }
        d = smin(d, ellipsoid(x, y, z, [C[0], C[1] - 0.06, C[2] - 0.075], [0.112, 0.105, 0.068]), 0.05);
        const face = Math.max(0.022 - rz, Math.abs(rx) - 0.07, ry - 0.062);
        d = Math.max(d, -face);
        if (!hatOn) {
          d = smin(d, ellipsoid(x, y, z, [C[0] - 0.048, C[1] + 0.05, C[2] + 0.09], [0.034, 0.03, 0.026]), 0.022);
          d = smin(d, ellipsoid(x, y, z, [C[0] + 8e-3, C[1] + 0.066, C[2] + 0.094], [0.028, 0.024, 0.024]), 0.02);
          d = smin(d, ellipsoid(x, y, z, [C[0] + 0.055, C[1] + 0.04, C[2] + 0.084], [0.028, 0.034, 0.026]), 0.022);
        }
        d = Math.max(d, -0.165 - ry);
        if (!hatOn || ry < 0.02) d -= 0.016 * curls(x, y, z) * smooth(-0.165, -0.12, ry);
        return Math.max(d, -Math.max(0.03 - rz, Math.abs(rx) - 0.064, ry - 0.028));
      };
      const g2 = surfaceNets(field2, [C[0] - 0.2, C[1] - 0.185, C[2] - 0.21], [C[0] + 0.2, C[1] + 0.2, C[2] + 0.17], 62e-4);
      relax(g2, 1, 0.15);
      g2.translate(-H.bone[0], -H.bone[1], -H.bone[2]);
      return g2;
    }
    const tight = style === "cua" || style === "buoc" || style === "bui";
    const longish = style === "bob" || style === "dai";
    const field = (x, y, z) => {
      const rel = y - C[1];
      let t = style === "cua" ? 6e-3 : tight ? 9e-3 : 0.012;
      if (hatOn) t = Math.min(t, 8e-3);
      if (longish) t += 0.018 * smooth(0.04, -0.07, rel);
      let d = M.headSDF(x, y, z, t, { features: false });
      const th = Math.atan2(x, z - C[2]);
      let hl = 0.052 * Math.cos(th) - 8e-3 + (style === "cua" ? 0.012 : 0);
      if (longish) hl = Math.min(hl, -0.075);
      d = Math.max(d, hl - rel);
      if (longish) {
        const face = Math.max(0.03 - (z - C[2]), Math.abs(x) - 0.077, rel - 0.058);
        d = Math.max(d, -face);
      }
      if (style === "ngan" || longish || style === "buoc" || style === "bui") {
        d = smin(d, ellipsoid(x, y, z, [C[0], C[1] + 0.058, C[2] + 0.084], [longish ? 0.085 : 0.08, 0.026, 0.034]), 0.028);
      }
      if (style === "mai-lech") {
        d = smin(d, ellipsoid(x, y, z, [C[0] + 0.02, C[1] + 0.078, C[2] + 0.08], [0.085, 0.028, 0.036]), 0.03);
        d = smin(d, ellipsoid(x, y, z, [C[0] - 0.045, C[1] + 0.06, C[2] + 0.085], [0.03, 0.035, 0.03]), 0.025);
      }
      if (!hatOn && (style === "ngan" || style === "mai-lech")) {
        d = smin(d, ellipsoid(x, y, z, [C[0] - (style === "mai-lech" ? 0.02 : 0), C[1] + 0.09, C[2] + 0.01], [0.098, 0.052, 0.1]), 0.045);
      }
      if (style === "dai") {
        d = smin(d, roundCone(x * 0.62, y, z, [0, C[1] - 0.03, C[2] - 0.088], [0, C[1] - 0.36, C[2] - 0.13], 0.07, 0.05), 0.05);
      }
      if (style === "buoc") {
        d = smin(d, roundCone(x, y, z, [0, C[1] + 0.01, C[2] - 0.13], [0, C[1] - 0.22, C[2] - 0.17], 0.034, 0.018), 0.02);
      }
      if (style === "bui" && !hatOn) d = smin(d, ellipsoid(x, y, z, [0, C[1] + 0.125, C[2] - 0.05], [0.052, 0.046, 0.05]), 0.03);
      return d;
    };
    const down = style === "dai" ? 0.44 : style === "buoc" ? 0.3 : 0.16;
    const g = surfaceNets(field, [C[0] - 0.17, C[1] - down, C[2] - 0.22], [C[0] + 0.17, C[1] + 0.2, C[2] + 0.17], 72e-4);
    relax(g, 1, 0.35);
    g.translate(-H.bone[0], -H.bone[1], -H.bone[2]);
    return g;
  }
  function topGeometry(M, o) {
    const P = M.P[1];
    const jacket = o.collar === "hood" && o.zipper || o.collar === "stand";
    const base = jacket ? 0.017 : o.collar === "hood" || o.sleeve === "long" && o.cuffs && !o.placket ? 0.017 : 0.014;
    const hemY = P + (o.tucked ? 0.035 : -0.095);
    const fullArm = DIM.upperArm + DIM.foreArm;
    const sleeveLen = o.sleeve === "long" ? fullArm - 0.025 : o.sleeve === "none" ? 0 : 0.15;
    const neckFront = o.collar === "hood" ? 0.475 : 0.488;
    const neckY = (z) => P + neckFront + 0.02 - 0.03 * clamp01((z + 0.02) / 0.08);
    const garmentParts = (x, y, z) => {
      const flare = o.tucked ? 0 : 0.013 * smooth(P + 0.15, P + 0.08, y);
      const waistTaper = o.waistFit ? 5e-3 * Math.exp(-(((y - P - 0.17) / 0.13) ** 2)) : 0;
      let d = M.trunk(x, y, z, base + flare - waistTaper);
      for (const s of ["L", "R"]) {
        d = smin(d, M.deltoid(s, x, y, z, base * 0.6), 0.04);
        if (!o.tucked) {
          d = smin(d, M.glute(s, x, y, z, base + flare - 2e-3), 0.04);
          if (y > hemY - 0.02) d = smin(d, M.leg(s, x, y, z, base + flare + 4e-3, { thighOnly: true }), 0.03);
        }
      }
      const arms = [];
      if (sleeveLen > 0) {
        for (const s of ["L", "R"]) {
          const A = M.arms[s];
          const st = segT(x, y, z, A.sh, A.wr) * fullArm;
          const loose = (o.sleeve === "long" ? 0.011 : 0.012) + (o.sleeve === "short" ? 8e-3 * smooth(0.05, 0.15, st) : 0) + (jacket ? 4e-3 : 0);
          let a = M.arm(s, x, y, z, loose, { upTo: sleeveLen, withHand: false });
          a = Math.max(a, st - sleeveLen);
          arms.push(a);
        }
      }
      return { trunk: d, arms };
    };
    const field = (x, y, z) => {
      const parts = garmentParts(x, y, z);
      let d = parts.trunk;
      for (const a of parts.arms) d = smin(d, a, 0.02);
      if (o.sleeve === "long") {
        const gap = 0.012 * (1 - smooth(P + 0.2, P + 0.3, y));
        if (gap > 0) d = Math.max(d, gap - Math.abs(parts.trunk - Math.min(...parts.arms)));
      }
      d = Math.max(d, hemY - y);
      d = Math.max(d, -Math.max(Math.hypot(x, (z - 4e-3) * 1.08) - 0.058, neckY(z) - 0.03 - y));
      d = Math.max(d, y - (P + 0.56));
      if (o.vneck) d = Math.max(d, -Math.max(P + 0.395 + 1.5 * Math.abs(x) - y, 0.03 - z));
      if (!o.sportsCollar && (o.collar === "polo" || o.collar === "shirt")) {
        d = smin(d, torusY(x, y, z, [0, P + 0.51, 4e-3], 0.066, 0.016, 1.06, 0.94), 0.01);
        for (const s of [-1, 1]) {
          const cx = s * 0.038, cy = P + 0.47, cz = trunkRadius(0.47) * M.b.sz + base + 0.01;
          const ux = x - cx, uy = y - cy, uz = z - cz;
          const a = 0.55, r = s * 0.5;
          const y1 = uy * Math.cos(a) - uz * Math.sin(a), z1 = uy * Math.sin(a) + uz * Math.cos(a);
          const x2 = ux * Math.cos(r) - y1 * Math.sin(r), y2 = ux * Math.sin(r) + y1 * Math.cos(r);
          d = smin(d, ellipsoid(x2, y2, z1, [0, 0, 0], [0.03, 0.04, 8e-3]), 6e-3);
        }
      } else if (!o.sportsCollar && o.collar === "crew") {
        d = smin(d, torusY(x, y, z, [0, neckY(0.06) - 4e-3, 6e-3], 0.057, 85e-4, 1.02, 0.95), 8e-3);
      } else if (o.collar === "stand") {
        const ring = Math.max(Math.abs(Math.hypot(x, (z - 4e-3) * 1.05) - 0.064) - 9e-3, Math.abs(y - (P + 0.515)) - 0.032);
        d = smin(d, ring, 0.012);
      } else if (o.collar === "hood") {
        d = smin(d, ellipsoid(x, y, z, [0, P + 0.525, -0.098], [0.118, 0.088, 0.072]), 0.035);
        d = smin(d, torusY(x, y, z, [0, P + 0.49, 0], 0.068, 0.014, 1.05, 0.95), 0.015);
      }
      return d;
    };
    const g = surfaceNets(field, [-0.43, P - 0.2, -0.27], [0.43, P + 0.64, 0.25], 95e-4);
    relax(g, 1, 0.4);
    skinTop(g, M, o, garmentParts);
    return perTriangleUV(g, (x, y, z, cx, cy, cz) => {
      if (sleeveLen > 0 && !o.sportsCollar) {
        for (const s of ["L", "R"]) {
          const A = M.arms[s];
          if (Math.sign(cx) !== A.s) continue;
          const tFrac = segT(cx, cy, cz, A.sh, A.wr);
          const bomberSeamX = M.shoulderX - 0.035 + 0.045 * (1 - smooth(P + 0.23, P + 0.39, cy));
          const sleeveRegion = o.bomber ? Math.abs(cx) > bomberSeamX : M.arm(s, cx, cy, cz) < M.trunk(cx, cy, cz) - 0.01;
          if (tFrac > (o.bomber ? -0.09 : 0.06) && sleeveRegion) {
            const st = segT(x, y, z, A.sh, A.wr);
            const ax = A.sh[0] + (A.wr[0] - A.sh[0]) * st, az = A.sh[2] + (A.wr[2] - A.sh[2]) * st;
            const th2 = Math.atan2(x - ax, z - az);
            const ul = wrap(s === "L" ? (th2 + Math.PI / 2) / TAU : (th2 - Math.PI / 2) / TAU);
            const f = clamp01(st * fullArm / Math.max(sleeveLen, 0.01));
            const v2 = o.bomber ? 2e-3 + 0.496 * (1 - f) : 0.5 * (1 - f);
            return [(s === "L" ? 0 : 0.5) + 0.5 * ul, v2, 0.5, s === "L" ? 0 : 0.5, true];
          }
        }
      }
      const th = Math.atan2(x / M.b.sx, z / M.b.sz);
      const v = clamp01((y - hemY) / (neckY(z) - hemY));
      return [wrap(0.25 + th / TAU), o.bomber ? 0.502 + 0.496 * v : 0.5 + 0.5 * v, 1, 0, false];
    });
  }
  function bottomHemY(G, o) {
    return o.length === "shorts" ? G.kn[1] + 0.16 : G.an[1] + (o.length === "capri" ? 0.16 : 0.035);
  }
  function skinBottom(geo, M, options) {
    const lower = M.segments.filter((s) => s.bone === 0 || s.bone >= 8);
    skinByDistance(geo, lower);
    if (options.skirt) return geo;
    const p = geo.attributes.position, ids = geo.attributes.skinIndex, weights = geo.attributes.skinWeight;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const trunk = Math.min(M.trunk(x, y, z), M.glute("L", x, y, z), M.glute("R", x, y, z));
      const left = Math.min(M.leg("L", x, y, z), M.foot(M.legs.L, x, y, z));
      const right = Math.min(M.leg("R", x, y, z), M.foot(M.legs.R, x, y, z));
      if (trunk <= Math.min(left, right)) continue;
      const base = left <= right ? 8 : 11;
      const candidates = lower.filter((s) => s.bone >= base && s.bone <= base + 2 || s.bone === 0 && y > M.P[1] - 0.16).map((s) => {
        const d = segDist(x, y, z, s.a, s.b);
        return { bone: s.bone, w: 1 / Math.pow(d * d + 1e-4, 2) };
      }).sort((a, b) => b.w - a.w);
      const sum = candidates.reduce((n, c) => n + c.w, 0);
      ids.setXYZW(i, 0, 0, 0, 0);
      weights.setXYZW(i, 0, 0, 0, 0);
      candidates.forEach((c, k) => {
        ids.array[i * 4 + k] = c.bone;
        weights.array[i * 4 + k] = c.w / sum;
      });
    }
    return geo;
  }
  function bottomGeometry(M, o) {
    const P = M.P[1];
    const fitT = { slim: 8e-3, regular: 0.013, wide: 0.02 }[o.fit || "regular"];
    const waistTop = P + 0.078;
    const length = o.length || "full";
    const field = (x, y, z) => {
      let d = M.trunk(x, y, z, 0.021);
      for (const s of ["L", "R"]) d = smin(d, M.glute(s, x, y, z, 0.016), 0.04);
      if (o.skirt) {
        d = Math.max(d, P - 0.035 - y);
        const len = o.skirtLen || 0.4;
        const top = P - 0.02, rTop = trunkRadius(-0.02) + 0.03, rBot = rTop + 0.12;
        const q = Math.hypot(x / M.b.sx, z / (M.b.sz * 1.15));
        const th = Math.atan2(x, z);
        const k = clamp01((top - y) / len);
        const pleat = o.pleats === false ? 0 : 0.035 * Math.abs(Math.sin(th * 12)) * k;
        const R = (rTop + (rBot - rTop) * (0.8 * k * k + 0.2 * k)) * (1 + pleat);
        const dc = (q - R) * Math.min(M.b.sx, M.b.sz);
        let shell = Math.max(dc, -dc - 0.024);
        shell = Math.max(shell, Math.max(y - (top + 0.02), top - len - y));
        d = smin(d, shell, 0.02);
      } else {
        for (const s of ["L", "R"]) {
          const G = M.legs[s];
          let lg;
          if (length === "shorts") {
            lg = M.leg(s, x, y, z, fitT + 8e-3, { thighOnly: true, flare: 0.02 });
            lg = Math.max(lg, G.kn[1] + 0.16 - y);
          } else {
            const flare = o.track ? o.cuff ? -8e-3 : 0.023 : o.fit === "wide" ? 0.03 : o.cuff ? -0.012 : 2e-3;
            lg = M.leg(s, x, y, z, fitT, { flare });
            lg = Math.max(lg, G.an[1] + (length === "capri" ? 0.16 : 0.035) - y);
          }
          d = smin(d, lg, 0.03);
        }
      }
      if (o.track && length === "shorts" && !o.skirt && y < P - 0.17) {
        const gap = 0.012 * M.b.sx * smooth(P - 0.17, P - 0.31, y);
        d = Math.max(d, gap - Math.abs(x));
      }
      return Math.max(d, y - waistTop);
    };
    const g = surfaceNets(field, [-0.36, -0.02, -0.25], [0.36, P + 0.1, 0.25], o.skirt ? 85e-4 : 95e-4);
    relax(g, 1, 0.4);
    skinBottom(g, M, o);
    return perTriangleUV(g, (x, y, z, cx, cy) => {
      if (o.track && !o.skirt) {
        const G = M.legs[cx >= 0 ? "L" : "R"];
        const axisX = G.hp[0] * (1 - smooth(P - 0.18, P - 0.035, y));
        const th2 = Math.atan2(x - axisX, z);
        const u = wrap((th2 - G.s * Math.PI / 2) / TAU);
        const origin = G.s > 0 ? 0 : 0.5;
        const hemY = bottomHemY(G, o);
        return [origin + u * 0.5, clamp01((y - hemY) / (waistTop - hemY)), 0.5, origin, true];
      }
      if (!o.skirt && cy < P - 0.1) {
        const G = M.legs[cx >= 0 ? "L" : "R"];
        const th2 = Math.atan2(x - G.hp[0], z);
        const u = wrap(G.s > 0 ? (th2 - Math.PI / 2) / TAU : (th2 + Math.PI / 2) / TAU);
        return [u, y * 2.4, 1, 0, false];
      }
      const th = Math.atan2(x / M.b.sx, z / M.b.sz);
      return [wrap((th - Math.PI / 2) / TAU), y * 2.4, 1, 0, false];
    });
  }

  // avatar/src/geo-worker.js
  function pack(g) {
    const attrs = {}, transfer = [];
    for (const [name, a] of Object.entries(g.attributes)) {
      const array = a.array.slice();
      attrs[name] = { array, itemSize: a.itemSize, normalized: !!a.normalized };
      transfer.push(array.buffer);
    }
    let index = null;
    if (g.index) {
      const array = g.index.array.slice();
      index = { array };
      transfer.push(array.buffer);
    }
    if (!g.boundingSphere) g.computeBoundingSphere();
    const s = g.boundingSphere, bs = s ? [s.center.x, s.center.y, s.center.z, s.radius] : null;
    return { data: { attrs, index, groups: g.groups.map((x) => ({ start: x.start, count: x.count, materialIndex: x.materialIndex })), bs }, transfer };
  }
  self.onmessage = (e) => {
    const { id, kind, build, args } = e.data || {};
    try {
      const M = bodyModel(build);
      const g = kind === "body" ? BODY_GEOMETRY(build) : kind === "hair" ? hairGeometry(M, args.style, args.hatOn) : kind === "top" ? topGeometry(M, args.o) : kind === "bottom" ? bottomGeometry(M, args.o) : null;
      if (!g) throw new Error("Không rõ loại hình khối: " + kind);
      const { data, transfer } = pack(g);
      if (kind !== "body") g.dispose();
      self.postMessage({ id, ok: true, data }, transfer);
    } catch (err) {
      self.postMessage({ id, ok: false, error: String(err && err.message || err) });
    }
  };
})();
