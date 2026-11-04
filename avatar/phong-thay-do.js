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

  // three-global:three/addons/controls/OrbitControls.js
  var require_OrbitControls = __commonJS({
    "three-global:three/addons/controls/OrbitControls.js"(exports, module) {
      module.exports = { OrbitControls: window.THREE.OrbitControls };
    }
  });

  // three-global:three/addons/geometries/RoundedBoxGeometry.js
  var require_RoundedBoxGeometry = __commonJS({
    "three-global:three/addons/geometries/RoundedBoxGeometry.js"(exports, module) {
      module.exports = { RoundedBoxGeometry: window.THREE.RoundedBoxGeometry };
    }
  });

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/studio.js
  var THREE6 = __toESM(require_three());
  var import_OrbitControls = __toESM(require_OrbitControls());

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/rig.js
  var THREE2 = __toESM(require_three());

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/sdf.js
  var THREE = __toESM(require_three());
  function smin(a, b, k) {
    const h2 = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h2 * h2 * k * 0.25;
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

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/rig.js
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
  function limb(len, rTop, rBot, mat, radial = 8, openEnded = false) {
    const g = new THREE2.CylinderGeometry(rTop, rBot, len, radial, 1, openEnded);
    g.translate(0, -len / 2, 0);
    const m = new THREE2.Mesh(g, mat);
    m.castShadow = true;
    return m;
  }
  function lowpolyMat(color, extra = {}) {
    return new THREE2.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, flatShading: true, ...extra });
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
  var BONE_NAMES = ["torso", "head", "shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR", "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR"];
  var bodyGeoCache = /* @__PURE__ */ new Map();
  function bodyGeometry(model) {
    if (bodyGeoCache.has(model.name)) return bodyGeoCache.get(model.name);
    const g = surfaceNets(model.body, [-0.45, -0.02, -0.2], [0.45, 1.86, 0.3], 0.0105);
    relax(g, 1, 0.45);
    skinByDistance(g, model.segments);
    g.userData.keep = true;
    bodyGeoCache.set(model.name, g);
    return g;
  }
  function attachSkinned(rig, mesh) {
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      m.skinning = true;
      m.needsUpdate = true;
    }
    rig.root.add(mesh);
    rig.root.updateMatrixWorld(true);
    mesh.bind(rig.skeleton, mesh.matrixWorld);
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    return mesh;
  }
  function linearize(obj) {
    obj.traverse((o) => {
      const ms = o.material ? Array.isArray(o.material) ? o.material : [o.material] : [];
      for (const m of ms) {
        if (m.userData.lin) continue;
        m.userData.lin = true;
        if (m.color) m.color.convertSRGBToLinear();
        if (m.emissive) m.emissive.convertSRGBToLinear();
      }
    });
    return obj;
  }
  function buildRig(body = {}) {
    const model = bodyModel(body.build);
    const b = model.b;
    const skinColor = new THREE2.Color(body.skin || "#e8b896");
    const skin = new THREE2.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0 });
    const dark = new THREE2.MeshStandardMaterial({ color: body.eyeColor || "#241a19", roughness: 0.25 });
    const white = new THREE2.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 });
    const brow = new THREE2.MeshStandardMaterial({ color: body.browColor || "#2a201c", roughness: 0.8 });
    const lip = new THREE2.MeshStandardMaterial({ color: skinColor.clone().lerp(new THREE2.Color("#a8424e"), 0.4), roughness: 0.55 });
    const blush = new THREE2.MeshStandardMaterial({ color: skinColor.clone().lerp(new THREE2.Color("#ff7a7a"), 0.35), transparent: true, opacity: 0.35, roughness: 0.8, depthWrite: false });
    const root = new THREE2.Group();
    root.name = "avatar";
    const bone = (name) => {
      const bn = new THREE2.Bone();
      bn.name = name;
      return bn;
    };
    const torso = bone("torso");
    torso.position.y = DIM.pelvisY;
    root.add(torso);
    const head = bone("head");
    head.position.y = DIM.headY;
    torso.add(head);
    const joints = { torso, head };
    for (const [side, s] of [["L", 1], ["R", -1]]) {
      const sh = bone("shoulder" + side);
      sh.position.set(s * model.shoulderX, DIM.shoulderY, 0);
      sh.rotation.z = s * 0.09;
      torso.add(sh);
      const el = bone("elbow" + side);
      el.position.y = -DIM.upperArm;
      sh.add(el);
      const wr = bone("wrist" + side);
      wr.position.y = -DIM.foreArm;
      wr.rotation.y = s * 0.25;
      el.add(wr);
      Object.assign(joints, { ["shoulder" + side]: sh, ["elbow" + side]: el, ["wrist" + side]: wr });
    }
    for (const [side, s] of [["L", 1], ["R", -1]]) {
      const hp = bone("hip" + side);
      hp.position.set(s * 0.083 * b.sx, -0.045, 0);
      torso.add(hp);
      const kn = bone("knee" + side);
      kn.position.y = -DIM.thigh;
      hp.add(kn);
      const an = bone("ankle" + side);
      an.position.y = -DIM.shin;
      kn.add(an);
      Object.assign(joints, { ["hip" + side]: hp, ["knee" + side]: kn, ["ankle" + side]: an });
    }
    root.scale.setScalar(body.height || 0.97);
    root.updateMatrixWorld(true);
    const skeleton = new THREE2.Skeleton(BONE_NAMES.map((n) => joints[n]));
    const rig = { root, joints, skeleton, model, build: b, body, materials: { skin, dark, brow, lip } };
    const bodyMesh = new THREE2.SkinnedMesh(bodyGeometry(model), skin);
    bodyMesh.name = "body";
    attachSkinned(rig, bodyMesh);
    rig.bodyMesh = bodyMesh;
    const face = new THREE2.Group();
    face.name = "face";
    head.add(face);
    for (const s of [-1, 1]) {
      const eyeG = new THREE2.SphereGeometry(0.0155, 14, 10);
      eyeG.scale(1, 1.32, 0.5);
      const eye = new THREE2.Mesh(eyeG, dark);
      eye.position.set(s * 0.037, 0.115, 0.099);
      eye.rotation.y = s * 0.3;
      face.add(eye);
      const hl = new THREE2.Mesh(new THREE2.SphereGeometry(38e-4, 8, 6), white);
      hl.position.set(s * 0.037 + 5e-3, 0.123, 0.1065);
      face.add(hl);
      const brG = new THREE2.CapsuleGeometry(42e-4, 0.026, 3, 6);
      brG.rotateZ(Math.PI / 2);
      const br = new THREE2.Mesh(brG, brow);
      br.position.set(s * 0.039, 0.148, 0.098);
      br.rotation.set(0, s * 0.35, -s * 0.12);
      face.add(br);
      const ch = new THREE2.Mesh(new THREE2.CircleGeometry(0.014, 14), blush);
      ch.position.set(s * 0.052, 0.088, 0.094);
      ch.rotation.y = s * 0.55;
      face.add(ch);
    }
    const mouth = new THREE2.Mesh(new THREE2.TorusGeometry(0.012, 28e-4, 6, 12, Math.PI * 0.8), lip);
    mouth.rotation.z = Math.PI + Math.PI * 0.1;
    mouth.position.set(0, 0.061, 0.111);
    face.add(mouth);
    return rig;
  }

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/items/clothing.js
  var THREE4 = __toESM(require_three());

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/textures.js
  var THREE3 = __toESM(require_three());
  function makeCanvas(w, h2) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h2;
    return c;
  }
  function toTexture(cnv, { repeat = null, srgb = true } = {}) {
    const t = new THREE3.CanvasTexture(cnv);
    if (srgb) t.encoding = THREE3.sRGBEncoding;
    t.anisotropy = 4;
    if (repeat) {
      t.wrapS = t.wrapT = THREE3.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  }
  var imageCache = /* @__PURE__ */ new Map();
  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve) => {
      const img = new Image();
      if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("[avatar-studio] Không tải được ảnh:", src);
        resolve(null);
      };
      img.src = src;
    });
    imageCache.set(src, p);
    return p;
  }
  async function loadImageSet(set = {}) {
    const out = {};
    await Promise.all(Object.entries(set || {}).map(async ([k, v]) => {
      out[k] = await loadImage(v);
    }));
    return out;
  }
  function shade(hex, amt) {
    const c = new THREE3.Color(hex);
    const hsl = {};
    c.getHSL(hsl);
    c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
    return "#" + c.getHexString();
  }
  function isDark(hex) {
    const c = new THREE3.Color(hex);
    return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b < 0.5;
  }
  function drawWeave(ctx, w, h2, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h2);
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h2; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "#fff";
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h2);
    ctx.globalAlpha = 1;
  }
  function drawPattern(ctx, w, h2, img, scale = 0.25) {
    const tw = Math.max(16, img.width * scale), th = Math.max(16, img.height * scale);
    for (let y = 0; y < h2; y += th) for (let x = 0; x < w; x += tw) ctx.drawImage(img, x, y, tw, th);
  }
  function drawContain(ctx, img, cx, top, maxW, maxH) {
    const r = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * r, h2 = img.height * r;
    ctx.drawImage(img, cx - w / 2, top, w, h2);
  }
  function composeGarment(opts) {
    var _a, _b;
    const W = 1024, H = 512;
    const cnv = makeCanvas(W, H);
    const ctx = cnv.getContext("2d");
    const { color = "#ffffff", imgs = {}, emblem, emblemPos, accent = "#333" } = opts;
    if (imgs.pattern) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      drawPattern(ctx, W, H, imgs.pattern, (_a = opts.patternScale) != null ? _a : 0.25);
    } else drawWeave(ctx, W, H, color);
    if (opts.plaid) drawPlaid(ctx, W, H, opts.plaid, 64);
    if (opts.breton) drawBreton(ctx, W, H, opts.breton, 22);
    const trim = opts.trim || "#ffffff";
    if (opts.piping) {
      ctx.strokeStyle = trim;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      for (const c of [0.25, 0.75]) {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(W * (c + s * 0.055), 2);
          ctx.bezierCurveTo(W * (c + s * 0.09), H * 0.14, W * (c + s * 0.2), H * 0.2, W * (c + s * 0.25), H * 0.36);
          ctx.stroke();
        }
      }
    }
    if (opts.sidePiping) {
      ctx.strokeStyle = trim;
      ctx.lineWidth = 5;
      for (const u of [0, 0.5, 1]) {
        ctx.beginPath();
        ctx.moveTo(W * u, H * 0.34);
        ctx.bezierCurveTo(W * (u + (u === 0.5 ? -0.025 : 0.02)), H * 0.6, W * (u + (u === 0.5 ? 0.02 : -0.02)), H * 0.85, W * u, H);
        ctx.stroke();
      }
    }
    if (opts.vneck) {
      const vc = opts.vneck;
      for (const [w, col] of [[16, vc[0]], [6, vc[1] || "#ffffff"]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(W * 0.25 - 62, 0);
        ctx.lineTo(W * 0.25, H * 0.2);
        ctx.lineTo(W * 0.25 + 62, 0);
        ctx.stroke();
      }
    }
    if (opts.hemBand) {
      ctx.fillStyle = shade(color, -0.07);
      ctx.fillRect(0, H * 0.93, W, H * 0.07);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let x = 0; x < W; x += 6) ctx.fillRect(x, H * 0.93, 2, H * 0.07);
    }
    if (opts.weltPockets) {
      ctx.strokeStyle = shade(color, -0.22);
      ctx.lineWidth = 5;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(W * (0.25 + s * 0.09), H * 0.62);
        ctx.lineTo(W * (0.25 + s * 0.115), H * 0.86);
        ctx.stroke();
      }
    }
    if (opts.stripes) {
      ctx.fillStyle = accent;
      for (const s of opts.stripes) ctx.fillRect(0, s[0] * H, W, (s[1] - s[0]) * H);
    }
    if (opts.placket) {
      const [y0, y1] = opts.placket;
      ctx.fillStyle = shade(color, -0.06);
      ctx.fillRect(W * 0.25 - 14, y0 * H, 28, (y1 - y0) * H);
      ctx.fillStyle = isDark(color) ? "#ddd" : "#9aa0a8";
      for (let y = y0 * H + 22; y < y1 * H; y += 52) {
        ctx.beginPath();
        ctx.arc(W * 0.25, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (opts.zipper) {
      ctx.fillStyle = opts.zipperColor || shade(color, -0.25);
      ctx.fillRect(W * 0.25 - 3, 0, 6, H);
      ctx.fillStyle = "#c9ccd1";
      ctx.fillRect(W * 0.25 - 5, H * 0.22, 10, 20);
    }
    if (opts.kangaroo) {
      ctx.fillStyle = shade(color, -0.05);
      ctx.strokeStyle = shade(color, -0.16);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.25 - 100, H * 0.98);
      ctx.lineTo(W * 0.25 - 70, H * 0.66);
      ctx.lineTo(W * 0.25 + 70, H * 0.66);
      ctx.lineTo(W * 0.25 + 100, H * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (opts.pocket) {
      ctx.strokeStyle = shade(color, -0.18);
      ctx.lineWidth = 3;
      ctx.strokeRect(W * 0.25 + 38, H * 0.3, 70, 78);
    }
    if (imgs.front) drawContain(ctx, imgs.front, W * 0.25, H * ((_b = opts.frontTop) != null ? _b : 0.22), W * 0.22, H * 0.5);
    if (imgs.back) drawContain(ctx, imgs.back, W * 0.75, H * 0.16, W * 0.26, H * 0.6);
    if (emblem && emblemPos) {
      const pos = {
        "chest-left": [W * 0.25 + 72, H * 0.24, 76],
        "chest-center": [W * 0.25, H * 0.22, 130],
        "back": [W * 0.75, H * 0.2, 200]
      }[emblemPos];
      if (pos) ctx.drawImage(emblem, pos[0] - pos[2] / 2, pos[1], pos[2], pos[2]);
    }
    if (opts.wordmark && opts.wordmarkText) {
      const big = opts.wordmark === "chest-big";
      drawWordmark(ctx, opts.wordmarkText, big ? W * 0.25 : W * 0.25 + 70, big ? H * 0.3 : H * 0.2, big ? W * 0.3 : 96, big ? 92 : 28, opts.printColor || "#ffffff");
      if (opts.wordmarkBack) drawWordmark(ctx, opts.wordmarkText, W * 0.75, H * 0.14, W * 0.18, 40, opts.printColor || "#ffffff");
    }
    if (opts.archText) drawArchText(ctx, opts.archText, W * 0.25 + 92, H * 0.2, 74, opts.printColor || "#ffffff", opts.archSub);
    return cnv;
  }
  function drawPlaid(ctx, W, H, [a, b], step) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = a;
    for (let x = 0; x < W; x += step) ctx.fillRect(x, 0, step * 0.42, H);
    for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, step * 0.42);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = b;
    for (let x = step * 0.7; x < W; x += step) ctx.fillRect(x, 0, 3, H);
    for (let y = step * 0.7; y < H; y += step) ctx.fillRect(0, y, W, 3);
    ctx.globalAlpha = 1;
  }
  function drawBreton(ctx, W, H, color, step) {
    ctx.fillStyle = color;
    for (let y = step * 1.6; y < H; y += step) ctx.fillRect(0, y, W, step * 0.38);
  }
  function drawWordmark(ctx, text, cx, top, maxW, px, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let size = px;
    const font = (s) => `italic 800 ${s}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.font = font(size);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(size * 0.06)}px`;
    while (ctx.measureText(text).width > maxW && size > 10) {
      size -= 2;
      ctx.font = font(size);
    }
    ctx.fillText(text, cx, top);
    ctx.restore();
  }
  function drawArchText(ctx, text, cx, top, radius, color, sub) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const chars = [...text.toUpperCase()];
    const size = Math.max(11, Math.min(20, 300 / chars.length));
    ctx.font = `800 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
    const span = Math.min(Math.PI * 0.95, chars.length * 0.12);
    const cy = top + radius;
    chars.forEach((ch, i) => {
      const a = -Math.PI / 2 - span / 2 + span * (i + 0.5) / chars.length;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    if (sub) {
      ctx.font = `700 ${size + 2}px "Be Vietnam Pro", system-ui, sans-serif`;
      ctx.fillText(sub.toUpperCase(), cx, cy - radius * 0.45);
    }
    ctx.restore();
  }
  function ribbonTexture(text, bg, fg) {
    const W = 2048, H = 96;
    const cnv = makeCanvas(W, H);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 6, W, 3);
    ctx.fillRect(0, H - 9, W, 3);
    ctx.font = `800 40px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    const unit = `${text}   `;
    const uw = ctx.measureText(unit).width;
    for (let x = 40; x < W * 0.7; x += uw) ctx.fillText(unit, x, H / 2 + 2);
    for (let i = 0; i < 6; i++) {
      const x = W * 0.76 + i * 72, r = 22;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        ctx.lineTo(x + Math.cos(a) * r, H / 2 + Math.sin(a) * r);
      }
      ctx.closePath();
      if (i % 2) ctx.fill();
      else {
        ctx.lineWidth = 5;
        ctx.strokeStyle = fg;
        ctx.stroke();
      }
    }
    return cnv;
  }
  var slideBandCache = null;
  function slideBandAlpha() {
    if (slideBandCache) return slideBandCache;
    const W = 512, H = 256;
    const cnv = makeCanvas(W, H);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    const dx = 30, dy = 26, r = 9;
    for (let row = 0, y = 34; y < H - 28; row++, y += dy) {
      for (let x = 70 + (row % 2 ? dx / 2 : 0); x < W - 70; x += dx) {
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * 0.8, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r * 0.8, y);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (const x of [26, W - 26]) {
      ctx.beginPath();
      ctx.roundRect(x - 8, 70, 16, 120, 8);
      ctx.fill();
    }
    slideBandCache = toTexture(cnv, { srgb: false });
    return slideBandCache;
  }
  function slideBandMap(color) {
    const cnv = makeCanvas(256, 128);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = shade(color, -0.08);
    ctx.lineWidth = 2;
    for (let i = -128; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
    ctx.strokeStyle = shade(color, 0.05);
    for (let i = 0; i < 384; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - 128, 128);
      ctx.stroke();
    }
    return cnv;
  }
  function maskTexture(color, { pleats = true, edge = true } = {}) {
    const W = 256, H = 128;
    const cnv = makeCanvas(W, H);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#fff";
    for (let y = 0; y < H; y += 3) for (let x = y % 6 ? 1 : 0; x < W; x += 3) ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
    if (pleats) {
      for (const y of [0.36, 0.56, 0.76]) {
        const g = ctx.createLinearGradient(0, H * y - 8, 0, H * y + 4);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.7, "rgba(0,0,0,0.16)");
        g.addColorStop(1, "rgba(255,255,255,0.12)");
        ctx.fillStyle = g;
        ctx.fillRect(0, H * y - 8, W, 12);
      }
    }
    if (edge) {
      const band = shade(color, 0.12);
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, 12);
      ctx.fillRect(0, H - 12, W, 12);
      ctx.fillRect(0, 0, 12, H);
      ctx.fillRect(W - 12, 0, 12, H);
      ctx.fillStyle = shade(color, -0.12);
      for (let x = 4; x < W; x += 6) {
        ctx.fillRect(x, 3, 3, 2);
        ctx.fillRect(x, 7, 3, 2);
        ctx.fillRect(x, H - 9, 3, 2);
        ctx.fillRect(x, H - 5, 3, 2);
      }
      for (let y = 4; y < H; y += 6) {
        ctx.fillRect(3, y, 2, 3);
        ctx.fillRect(7, y, 2, 3);
        ctx.fillRect(W - 9, y, 2, 3);
        ctx.fillRect(W - 5, y, 2, 3);
      }
    }
    return cnv;
  }
  function composePlain(color, imgs = {}, opts = {}) {
    var _a;
    const cnv = makeCanvas(256, 256);
    const ctx = cnv.getContext("2d");
    if (imgs.pattern) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 256, 256);
      drawPattern(ctx, 256, 256, imgs.pattern, ((_a = opts.patternScale) != null ? _a : 0.25) * 0.5);
    } else drawWeave(ctx, 256, 256, color);
    if (opts.plaid) drawPlaid(ctx, 256, 256, opts.plaid, 32);
    if (opts.breton) drawBreton(ctx, 256, 256, opts.breton, 22);
    if (opts.sleeveStripes) {
      ctx.fillStyle = opts.trim || "#ffffff";
      const n = opts.sleeveStripes;
      for (const c of [64, 192]) for (let i = 0; i < n; i++) ctx.fillRect(c - n * 14 / 2 + i * 14, 0, 7, 256);
    }
    if (opts.denim) {
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      for (let i = -256; i < 256; i += 5) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 256, 256);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (opts.sideStripe) {
      ctx.fillStyle = opts.sideStripe;
      ctx.fillRect(0, 0, 10, 256);
      ctx.fillRect(246, 0, 10, 256);
      ctx.fillRect(123, 0, 10, 256);
    }
    return cnv;
  }
  function nonLaTexture(color = "#e9d9a8") {
    const cnv = makeCanvas(512, 256);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 10) {
      ctx.fillStyle = x / 10 % 2 ? shade(color, -0.05) : shade(color, 0.03);
      ctx.fillRect(x, 0, 10, 256);
    }
    ctx.strokeStyle = shade(color, -0.22);
    ctx.lineWidth = 2;
    for (let y = 16; y < 256; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    return cnv;
  }
  function calculatorFace(color = "#2b2f36", accent = "#e86a33") {
    const cnv = makeCanvas(128, 224);
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 224);
    ctx.fillStyle = "#b9c6a2";
    ctx.fillRect(14, 14, 100, 40);
    ctx.fillStyle = "#4a5240";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "right";
    ctx.fillText("3.1415", 108, 42);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
      ctx.fillStyle = r === 5 && c === 4 ? accent : r < 2 ? shade(color, 0.2) : shade(color, 0.32);
      ctx.fillRect(12 + c * 21, 68 + r * 25, 16, 17);
    }
    return cnv;
  }
  function pathShape(ctx, shape, cx, cy, s) {
    ctx.beginPath();
    if (shape === "tron") {
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
    } else if (shape === "luc-giac") {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 3;
        ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
      }
    } else if (shape === "co-hieu") {
      ctx.moveTo(cx - s * 0.8, cy - s);
      ctx.lineTo(cx + s * 0.8, cy - s);
      ctx.lineTo(cx + s * 0.8, cy + s * 0.55);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s * 0.8, cy + s * 0.55);
    } else {
      ctx.moveTo(cx - s * 0.85, cy - s * 0.9);
      ctx.quadraticCurveTo(cx, cy - s * 1.05, cx + s * 0.85, cy - s * 0.9);
      ctx.lineTo(cx + s * 0.85, cy + s * 0.05);
      ctx.quadraticCurveTo(cx + s * 0.8, cy + s * 0.7, cx, cy + s);
      ctx.quadraticCurveTo(cx - s * 0.8, cy + s * 0.7, cx - s * 0.85, cy + s * 0.05);
    }
    ctx.closePath();
  }
  function drawMotif(ctx, motif, cx, cy, s, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.09;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (motif === "sao") {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.42 : s;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else if (motif === "sach") {
      ctx.moveTo(cx, cy - s * 0.35);
      ctx.quadraticCurveTo(cx - s * 0.5, cy - s * 0.65, cx - s, cy - s * 0.45);
      ctx.lineTo(cx - s, cy + s * 0.55);
      ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.35, cx, cy + s * 0.65);
      ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.35, cx + s, cy + s * 0.55);
      ctx.lineTo(cx + s, cy - s * 0.45);
      ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.65, cx, cy - s * 0.35);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.35);
      ctx.lineTo(cx, cy + s * 0.65);
      ctx.stroke();
    } else if (motif === "banh-rang") {
      const teeth = 10;
      for (let i = 0; i < teeth * 2; i++) {
        const a = i * Math.PI / teeth, r = i % 2 ? s * 0.78 : s;
        ctx.lineTo(cx + Math.cos(a - 0.12) * r, cy + Math.sin(a - 0.12) * r);
        ctx.lineTo(cx + Math.cos(a + 0.12) * r, cy + Math.sin(a + 0.12) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
    } else if (motif === "la") {
      ctx.moveTo(cx, cy + s);
      ctx.quadraticCurveTo(cx - s * 0.95, cy, cx, cy - s);
      ctx.quadraticCurveTo(cx + s * 0.95, cy, cx, cy + s);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.8);
      ctx.lineTo(cx, cy - s * 0.7);
      ctx.stroke();
    } else if (motif === "song") {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const y = cy - s * 0.45 + k * s * 0.45;
        ctx.moveTo(cx - s, y);
        for (let i = 0; i <= 4; i++) ctx.quadraticCurveTo(cx - s + (i + 0.25) * s * 0.5, y - s * 0.22 * (i % 2 ? -1 : 1), cx - s + (i + 0.5) * s * 0.5, y);
        ctx.stroke();
      }
    } else if (motif === "to-ong") {
      const r = s * 0.36;
      const cells = [[0, 0], [1, 0], [-1, 0], [0.5, -1], [-0.5, -1], [0.5, 1], [-0.5, 1]];
      for (const [i, j] of cells) {
        const x = cx + i * r * 1.85, y = cy + j * r * 1.6;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + k * Math.PI / 3;
          ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawEmblem(emblem, size = 512) {
    const e = { shape: "khien", motif: "sach", main: "#4b2e9a", accent: "#f0b53a", short: "TO", year: "2026", ...emblem };
    const cnv = makeCanvas(size, size);
    const ctx = cnv.getContext("2d");
    const k = size / 512, cx = 256 * k, cy = 256 * k, s = 230 * k;
    pathShape(ctx, e.shape, cx, cy, s);
    ctx.fillStyle = e.main;
    ctx.fill();
    ctx.lineWidth = 14 * k;
    ctx.strokeStyle = e.accent;
    ctx.stroke();
    pathShape(ctx, e.shape, cx, cy, s * 0.86);
    ctx.lineWidth = 4 * k;
    ctx.strokeStyle = shade(e.accent, 0.15);
    ctx.stroke();
    drawMotif(ctx, e.motif, cx, cy - 40 * k, 88 * k, e.accent);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const short = (e.short || "").toUpperCase().slice(0, 4);
    ctx.font = `800 ${(short.length > 2 ? 78 : 98) * k}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.fillText(short, cx, cy + 92 * k);
    if (e.year) {
      ctx.font = `700 ${26 * k}px "Be Vietnam Pro", system-ui, sans-serif`;
      ctx.fillStyle = e.accent;
      ctx.fillText(`TL ${e.year}`, cx, cy + 160 * k);
    }
    return cnv;
  }
  function hashStr(s) {
    let h2 = 2166136261;
    for (const ch of s) {
      h2 ^= ch.charCodeAt(0);
      h2 = Math.imul(h2, 16777619);
    }
    return h2 >>> 0;
  }
  function drawStudentCard(card, emblemCanvas, emblem) {
    const W = 1024, H = 646;
    const cnv = makeCanvas(W, H);
    const ctx = cnv.getContext("2d");
    const main = (emblem == null ? void 0 : emblem.main) || "#4b2e9a", accent = (emblem == null ? void 0 : emblem.accent) || "#f0b53a";
    const font = (w, px2) => `${w} ${px2}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 34);
    ctx.clip();
    if (card.template) {
      ctx.drawImage(card.template, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#f7f6fb";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = main;
      ctx.lineWidth = 2;
      for (let y = 0; y < H + 40; y += 46) for (let x = y / 46 % 2 ? 26 : 0; x < W + 40; x += 52) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + i * Math.PI / 3;
          ctx.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(W * 0.62, H);
      ctx.lineTo(W, H * 0.42);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(W * 0.56, H);
      ctx.lineTo(W * 0.6, H);
      ctx.lineTo(W, H * 0.36);
      ctx.lineTo(W, H * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    if (card.drawHeader !== false) {
      ctx.fillStyle = main;
      ctx.fillRect(0, 0, W, 138);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 138, W, 8);
      if (emblemCanvas) ctx.drawImage(emblemCanvas, 30, 14, 112, 112);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = font(800, 40);
      ctx.fillText((card.school || "Trường Đại học Mẫu").toUpperCase(), 160, 70, W - 190);
      ctx.font = font(600, 26);
      ctx.fillStyle = shade(accent, 0.2);
      ctx.fillText(card.title || "THẺ SINH VIÊN", 160, 112);
    }
    const px = 46, py = 180, pw = 250, ph = 320;
    ctx.fillStyle = "#e4e2ec";
    ctx.fillRect(px, py, pw, ph);
    if (card.photo) {
      const im = card.photo, r = Math.max(pw / im.width, ph / im.height);
      const w = im.width * r, h3 = im.height * r;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      ctx.drawImage(im, px + (pw - w) / 2, py + (ph - h3) / 2, w, h3);
      ctx.restore();
    } else {
      ctx.fillStyle = "#c3bfd3";
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 125, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph, 105, 120, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.strokeStyle = main;
    ctx.lineWidth = 4;
    ctx.strokeRect(px, py, pw, ph);
    const fx = 336;
    const rows = [
      ["Họ và tên", card.name || "Nguyễn Minh An"],
      ["MSSV", card.id || "26A0001"],
      ["Ngành", card.major || "Thiết kế đồ họa"],
      ["Khóa", card.cohort || "K66 · 2026–2030"]
    ];
    ctx.textAlign = "left";
    rows.forEach(([label, val], i) => {
      const y = 214 + i * 76;
      ctx.fillStyle = "#6b6680";
      ctx.font = font(600, 22);
      ctx.fillText(label.toUpperCase(), fx, y);
      ctx.fillStyle = "#1d1a2b";
      ctx.font = font(i === 0 ? 800 : 700, i === 0 ? 40 : 32);
      ctx.fillText(val, fx, y + (i === 0 ? 42 : 36), W - fx - 40);
    });
    let h2 = hashStr((card.id || "") + (card.name || ""));
    let bx = 336;
    ctx.fillStyle = "#1d1a2b";
    while (bx < 640) {
      h2 = Math.imul(h2 ^ h2 >>> 13, 1274126177) >>> 0;
      const bw = 2 + h2 % 5;
      ctx.fillRect(bx, 548, bw, 58);
      bx += bw + 2 + (h2 >>> 8) % 4;
    }
    ctx.save();
    ctx.translate(W * 0.55, H * 0.56);
    ctx.rotate(-0.32);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#c0392b";
    ctx.font = font(900, 150);
    ctx.textAlign = "center";
    ctx.fillText("MẪU", 0, 40);
    ctx.restore();
    ctx.fillStyle = "#c0392b";
    ctx.font = font(700, 18);
    ctx.textAlign = "left";
    ctx.fillText("THẺ MẪU · KHÔNG CÓ GIÁ TRỊ SỬ DỤNG", 46, 620);
    ctx.restore();
    return cnv;
  }
  function blobShadow() {
    const c = makeCanvas(128, 128), x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(20,16,40,0.42)");
    g.addColorStop(1, "rgba(20,16,40,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return toTexture(c);
  }
  function composeSleeve(color, imgs = {}, opts = {}) {
    var _a;
    const S = 512;
    const cnv = makeCanvas(S, S);
    const ctx = cnv.getContext("2d");
    if (imgs.pattern) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, S, S);
      drawPattern(ctx, S, S, imgs.pattern, (_a = opts.patternScale) != null ? _a : 0.25);
    } else drawWeave(ctx, S, S, color);
    if (opts.plaid) drawPlaid(ctx, S, S, opts.plaid, 64);
    if (opts.breton) drawBreton(ctx, S, S, opts.breton, 30);
    if (opts.sleeveStripes) {
      ctx.fillStyle = opts.trim || "#ffffff";
      const n = opts.sleeveStripes, w = 16, gap = 14;
      const total = n * w + (n - 1) * gap;
      for (let i = 0; i < n; i++) ctx.fillRect(S / 2 - total / 2 + i * (w + gap), 0, w, S);
    }
    if (opts.piping) {
      ctx.fillStyle = opts.trim || "#ffffff";
      ctx.fillRect(S / 2 - 4, 0, 8, S);
    }
    if (opts.cuff) {
      ctx.fillStyle = shade(color, -0.08);
      ctx.fillRect(0, S * 0.9, S, S * 0.1);
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      for (let x = 0; x < S; x += 8) ctx.fillRect(x, S * 0.9, 3, S * 0.1);
    } else if (opts.hem) {
      ctx.fillStyle = shade(color, -0.06);
      ctx.fillRect(0, S * 0.94, S, 4);
    }
    if (opts.emblem) ctx.drawImage(opts.emblem, S / 2 - 60, S * 0.16, 120, 120);
    return cnv;
  }
  function composeTopAtlas(bodyCanvas, leftCanvas, rightCanvas) {
    const cnv = makeCanvas(1024, 1024);
    const ctx = cnv.getContext("2d");
    ctx.drawImage(bodyCanvas, 0, 0, 1024, 512);
    ctx.drawImage(leftCanvas, 0, 512, 512, 512);
    ctx.drawImage(rightCanvas, 512, 512, 512, 512);
    return cnv;
  }

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/items/clothing.js
  var TAU = Math.PI * 2;
  var wrap = (u) => u - Math.floor(u);
  var clamp01 = (v) => Math.max(0, Math.min(1, v));
  var smooth = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  var geoCache = /* @__PURE__ */ new Map();
  function cached(key, make) {
    if (!geoCache.has(key)) {
      const g = make();
      g.userData.keep = true;
      geoCache.set(key, g);
    }
    return geoCache.get(key);
  }
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
  function garmentMaterial(canvas, extra = {}) {
    const tex = toTexture(canvas);
    tex.wrapS = THREE4.RepeatWrapping;
    return new THREE4.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0, ...extra });
  }
  function skinnedPart(geo, mat) {
    const m = new THREE4.SkinnedMesh(geo, mat);
    m.castShadow = true;
    return { skinned: m };
  }
  function hairGeometry(M, style, hatOn) {
    const H = M.head;
    const C = H.cranium.c;
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
  function buildHair(ctx) {
    var _a;
    const { item, rig } = ctx;
    const style = ((_a = item.options) == null ? void 0 : _a.style) || "ngan";
    const hatOn = !!ctx.hatOn;
    const M = rig.model;
    const geo = cached(`hair|${M.name}|${style}|${hatOn}`, () => hairGeometry(M, style, hatOn));
    const mat = new THREE4.MeshStandardMaterial({ color: item.colors.main, roughness: 0.62, flatShading: true });
    const hair = new THREE4.Mesh(geo, mat);
    const g = new THREE4.Group();
    g.add(hair);
    if (style === "buoc") {
      const C = M.head.cranium.c, hb = M.head.bone;
      const tie = new THREE4.Mesh(new THREE4.TorusGeometry(0.03, 9e-3, 6, 12), lowpolyMat(item.colors.accent || "#d24b6a"));
      tie.position.set(0, C[1] - hb[1] - 5e-3, C[2] - 0.135);
      tie.rotation.x = Math.PI / 2 - 0.25;
      g.add(tie);
    }
    return { parts: [{ joint: "head", obj: g }] };
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
    const field = (x, y, z) => {
      const flare = o.tucked ? 0 : 0.013 * smooth(P + 0.15, P + 0.08, y);
      let d = M.trunk(x, y, z, base + flare);
      for (const s of ["L", "R"]) {
        d = smin(d, M.deltoid(s, x, y, z, base * 0.6), 0.04);
        if (!o.tucked) {
          d = smin(d, M.glute(s, x, y, z, base + flare - 2e-3), 0.04);
          if (y > hemY - 0.02) d = smin(d, M.leg(s, x, y, z, base + flare + 4e-3, { thighOnly: true }), 0.03);
        }
      }
      if (sleeveLen > 0) {
        for (const s of ["L", "R"]) {
          const A = M.arms[s];
          const st = segT(x, y, z, A.sh, A.wr) * fullArm;
          const loose = (o.sleeve === "long" ? 0.011 : 0.012) + (o.sleeve === "short" ? 8e-3 * smooth(0.05, 0.15, st) : 0) + (jacket ? 4e-3 : 0);
          let a = M.arm(s, x, y, z, loose, { upTo: sleeveLen, withHand: false });
          a = Math.max(a, st - sleeveLen);
          d = smin(d, a, 0.02);
        }
      }
      d = Math.max(d, hemY - y);
      d = Math.max(d, y - neckY(z));
      if (o.vneck) d = Math.max(d, -Math.max(P + 0.395 + 1.5 * Math.abs(x) - y, 0.03 - z));
      if (o.collar === "polo" || o.collar === "shirt") {
        d = smin(d, torusY(x, y, z, [0, P + 0.497, 4e-3], 0.064, 0.014, 1.06, 0.92), 0.012);
      } else if (o.collar === "crew") {
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
    skinByDistance(g, M.segments);
    return perTriangleUV(g, (x, y, z, cx, cy, cz) => {
      if (sleeveLen > 0) {
        for (const s of ["L", "R"]) {
          const A = M.arms[s];
          if (Math.sign(cx) !== A.s) continue;
          const tFrac = segT(cx, cy, cz, A.sh, A.wr);
          if (tFrac > 0.06 && M.arm(s, cx, cy, cz) < M.trunk(cx, cy, cz) - 0.01) {
            const st = segT(x, y, z, A.sh, A.wr);
            const ax = A.sh[0] + (A.wr[0] - A.sh[0]) * st, az = A.sh[2] + (A.wr[2] - A.sh[2]) * st;
            const th2 = Math.atan2(x - ax, z - az);
            const ul = wrap(s === "L" ? (th2 + Math.PI / 2) / TAU : (th2 - Math.PI / 2) / TAU);
            const f = clamp01(st * fullArm / Math.max(sleeveLen, 0.01));
            return [(s === "L" ? 0 : 0.5) + 0.5 * ul, 0.5 * (1 - f), 0.5, s === "L" ? 0 : 0.5, true];
          }
        }
      }
      const th = Math.atan2(x / M.b.sx, z / M.b.sz);
      const v = clamp01((y - hemY) / (neckY(z) - hemY));
      return [wrap(0.25 + th / TAU), 0.5 + 0.5 * v, 1, 0, false];
    });
  }
  function buildTop(ctx) {
    const { item, rig, imgs, emblemCanvas, emblem } = ctx;
    const o = item.options || {};
    const M = rig.model;
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
    const trim = item.colors.trim || "#ffffff";
    const printColor = item.colors.print || "#ffffff";
    const keyOpts = { sleeve: o.sleeve, collar: o.collar, tucked: o.tucked, zipper: o.zipper, cuffs: o.cuffs, placket: !!o.placket, vneck: o.vneck };
    const geo = cached(`top|${M.name}|${JSON.stringify(keyOpts)}`, () => topGeometry(M, o));
    const bodyCanvas = composeGarment({
      color: main,
      accent,
      imgs,
      trim,
      printColor,
      emblem: item.emblem ? emblemCanvas : null,
      emblemPos: item.emblem,
      stripes: o.stripes,
      placket: o.placket,
      zipper: o.zipper,
      zipperColor: item.colors.zipper,
      pocket: o.pocket,
      kangaroo: o.kangaroo,
      patternScale: o.patternScale,
      piping: o.piping,
      sidePiping: o.sidePiping,
      weltPockets: o.weltPockets,
      hemBand: o.hemBand,
      vneck: o.vneck ? [accent, trim] : null,
      plaid: o.plaid,
      breton: o.breton,
      wordmark: o.wordmark,
      wordmarkText: emblem == null ? void 0 : emblem.wordmark,
      wordmarkBack: o.wordmarkBack,
      archText: o.arch ? (emblem == null ? void 0 : emblem.name) || "" : null,
      archSub: o.arch ? emblem == null ? void 0 : emblem.short : null
    });
    if (o.collarAccent) {
      const c = bodyCanvas.getContext("2d");
      c.fillStyle = accent;
      c.fillRect(0, 0, 1024, 18);
    }
    const sleeveColor = o.accentSleeves ? accent : main;
    const sl = { cuff: o.cuffs && o.sleeve === "long", hem: o.sleeve === "short", sleeveStripes: o.sleeveStripes, trim, plaid: o.plaid, breton: o.breton, patternScale: o.patternScale };
    const sleeveImgs = o.accentSleeves ? {} : { pattern: imgs.pattern };
    const left = composeSleeve(sleeveColor, sleeveImgs, { ...sl, emblem: o.sleeveEmblem ? emblemCanvas : null });
    const right = composeSleeve(sleeveColor, sleeveImgs, sl);
    const parts = [skinnedPart(geo, garmentMaterial(composeTopAtlas(bodyCanvas, left, right)))];
    if (o.collar === "hood" && !o.zipper) {
      const g = new THREE4.Group();
      const cordMat = lowpolyMat("#f2f2f2", { flatShading: false });
      for (const s of [-1, 1]) {
        const cord = new THREE4.Mesh(new THREE4.CylinderGeometry(45e-4, 45e-4, 0.13, 6), cordMat);
        cord.position.set(s * 0.032, 0.425, trunkRadius(0.425) * M.b.sz + 0.026);
        g.add(cord);
      }
      parts.push({ joint: "torso", obj: g });
    }
    return { parts };
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
            const flare = o.fit === "wide" ? 0.03 : o.cuff ? -0.012 : 2e-3;
            lg = M.leg(s, x, y, z, fitT, { flare });
            lg = Math.max(lg, G.an[1] + (length === "capri" ? 0.16 : 0.035) - y);
          }
          d = smin(d, lg, 0.03);
        }
      }
      return Math.max(d, y - waistTop);
    };
    const g = surfaceNets(field, [-0.36, -0.02, -0.25], [0.36, P + 0.1, 0.25], o.skirt ? 85e-4 : 95e-4);
    relax(g, 1, 0.4);
    skinByDistance(g, M.segments);
    return perTriangleUV(g, (x, y, z, cx, cy) => {
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
  function buildBottom(ctx) {
    const { item, rig, imgs } = ctx;
    const o = item.options || {};
    const M = rig.model;
    const main = item.colors.main, accent = item.colors.accent || shade(main, 0.4);
    const keyOpts = { skirt: o.skirt, skirtLen: o.skirtLen, pleats: o.pleats, fit: o.fit, length: o.length, cuff: o.cuff };
    const geo = cached(`bottom|${M.name}|${JSON.stringify(keyOpts)}`, () => bottomGeometry(M, o));
    const plain = composePlain(main, imgs, { denim: o.denim, sideStripe: o.sideStripe ? accent : null, patternScale: o.patternScale });
    const mat = garmentMaterial(plain, { roughness: o.denim ? 0.95 : 0.88 });
    mat.map.wrapT = THREE4.RepeatWrapping;
    const parts = [skinnedPart(geo, mat)];
    const b = M.b, kz = Math.min(b.sx, b.sz);
    if (!o.skirt && o.belt !== false) {
      const g = new THREE4.Group();
      const r = trunkRadius(0.058) + 0.025 / kz;
      const beltG = new THREE4.CylinderGeometry(1, 1, 0.028, 28, 1, true);
      beltG.scale(r * b.sx, 1, r * b.sz);
      g.add(new THREE4.Mesh(beltG, lowpolyMat("#2a2420", { side: THREE4.DoubleSide, flatShading: false })));
      const buckle = new THREE4.Mesh(new THREE4.BoxGeometry(0.042, 0.03, 8e-3), lowpolyMat("#c9b98f", { metalness: 0.6, roughness: 0.35, flatShading: false }));
      buckle.position.set(0, 0, r * b.sz + 4e-3);
      g.add(buckle);
      g.position.y = 0.058;
      g.userData.belt = true;
      parts.push({ joint: "torso", obj: g });
    }
    if (o.cargo) {
      for (const [side, s] of [["L", 1], ["R", -1]]) {
        const holder = new THREE4.Group();
        const pk = new THREE4.Mesh(new THREE4.BoxGeometry(0.022, 0.11, 0.1), lowpolyMat(shade(main, -0.05)));
        pk.position.set(s * 0.08 * b.limb, -0.27, 0);
        const flap = new THREE4.Mesh(new THREE4.BoxGeometry(0.026, 0.026, 0.104), lowpolyMat(shade(main, -0.12)));
        flap.position.set(s * 0.082 * b.limb, -0.215, 0);
        holder.add(pk, flap);
        parts.push({ joint: "hip" + side, obj: holder });
      }
    }
    return { parts };
  }

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/items/gear.js
  var THREE5 = __toESM(require_three());
  var import_RoundedBoxGeometry = __toESM(require_RoundedBoxGeometry());
  var DS = THREE5.DoubleSide;
  var GROUND = -0.07;
  function shadowed(obj) {
    obj.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    return obj;
  }
  function rbox(w, h2, d, r, mat, seg = 2) {
    return new THREE5.Mesh(new import_RoundedBoxGeometry.RoundedBoxGeometry(w, h2, d, seg, r), mat);
  }
  function tube(points, radius, mat, flat = 1) {
    const curve = new THREE5.CatmullRomCurve3(points.map((p) => new THREE5.Vector3(...p)));
    curve.curveType = "centripetal";
    const g = new THREE5.TubeGeometry(curve, 32, radius, 5, false);
    if (flat !== 1) g.scale(1, 1, 1);
    return new THREE5.Mesh(g, mat);
  }
  function decal(canvasOrTex, w, h2, extra = {}) {
    const tex = canvasOrTex.isTexture ? canvasOrTex : toTexture(canvasOrTex);
    const m = new THREE5.Mesh(new THREE5.PlaneGeometry(w, h2), new THREE5.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7, ...extra }));
    return m;
  }
  function imageCanvas(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c;
  }
  function oneShoe(item, side, imgs) {
    var _a;
    const o = item.options || {};
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "sneaker";
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.2);
    const g = new THREE5.Group();
    if (type === "to-ong") {
      const soleMat = lowpolyMat(shade(main, -0.03), { roughness: 0.55 });
      const sole2 = rbox(0.108, 0.034, 0.27, 0.014, soleMat, 3);
      sole2.position.set(0, GROUND + 0.017, 0.045);
      g.add(sole2);
      const bed = document.createElement("canvas");
      bed.width = 128;
      bed.height = 320;
      const bx = bed.getContext("2d");
      bx.fillStyle = shade(main, 0.04);
      bx.fillRect(0, 0, 128, 320);
      bx.strokeStyle = shade(main, -0.1);
      bx.lineWidth = 4;
      bx.beginPath();
      bx.ellipse(64, 220, 34, 70, 0, 0, Math.PI * 2);
      bx.stroke();
      bx.beginPath();
      bx.ellipse(64, 70, 40, 46, 0, 0, Math.PI * 2);
      bx.stroke();
      const footbed = decal(bed, 0.094, 0.25, { transparent: false, roughness: 0.6 });
      footbed.rotation.x = -Math.PI / 2;
      footbed.rotation.z = Math.PI;
      footbed.position.set(0, GROUND + 0.0345, 0.045);
      g.add(footbed);
      const alpha = slideBandAlpha();
      const bandMap = imgs.upper ? toTexture(imageCanvas(imgs.upper)) : toTexture(slideBandMap(main));
      const bandMat = new THREE5.MeshStandardMaterial({ color: imgs.upper ? "#ffffff" : "#ffffff", map: bandMap, alphaMap: alpha, alphaTest: 0.5, side: DS, roughness: 0.5, flatShading: true });
      const archG = new THREE5.CylinderGeometry(0.058, 0.058, 0.125, 18, 1, true, -Math.PI / 2, Math.PI);
      archG.rotateX(-Math.PI / 2);
      archG.scale(1, 0.84, 1);
      const arch = new THREE5.Mesh(archG, bandMat);
      arch.position.set(0, GROUND + 0.032, 0.072);
      g.add(arch);
      const rimMat = lowpolyMat(main, { roughness: 0.5 });
      for (const z of [95e-4, 0.1345]) {
        const rim = new THREE5.Mesh(new THREE5.TorusGeometry(0.058, 45e-4, 4, 16, Math.PI), rimMat);
        rim.scale.set(1, 0.84, 1);
        rim.position.set(0, GROUND + 0.032, z);
        g.add(rim);
      }
      if (o.strap) {
        const strap = new THREE5.Mesh(new THREE5.TorusGeometry(0.054, 8e-3, 4, 14, Math.PI), rimMat);
        strap.rotation.x = -Math.PI / 2 - 0.35;
        strap.position.set(0, GROUND + 0.04, -5e-3);
        g.add(strap);
        for (const s of [-1, 1]) {
          const rivet = new THREE5.Mesh(new THREE5.CylinderGeometry(8e-3, 8e-3, 6e-3, 6), lowpolyMat(shade(main, -0.15)));
          rivet.rotation.z = Math.PI / 2;
          rivet.position.set(s * 0.057, GROUND + 0.04, -5e-3);
          g.add(rivet);
        }
      }
      return g;
    }
    if (type === "tong") {
      const sole2 = rbox(0.1, 0.018, 0.262, 8e-3, lowpolyMat(accent, { roughness: 0.6 }));
      sole2.position.set(0, GROUND + 9e-3, 0.045);
      g.add(sole2);
      const top = GROUND + 0.018;
      const sm = lowpolyMat(main, { roughness: 0.5 });
      for (const s of [-1, 1]) g.add(tube([[0, top + 4e-3, 0.125], [s * 0.022, top + 0.032, 0.09], [s * 0.044, top + 0.02, 0.05], [s * 0.05, top, 0.03]], 55e-4, sm));
      const post = new THREE5.Mesh(new THREE5.CylinderGeometry(4e-3, 4e-3, 0.012, 5), sm);
      post.position.set(0, top + 4e-3, 0.125);
      g.add(post);
      return g;
    }
    if (type === "bata" || type === "boot") {
      const boot = type === "boot";
      const soleH2 = boot ? 0.034 : 0.03;
      const sole2 = rbox(0.104, soleH2, 0.266, 0.01, lowpolyMat(boot ? "#2a221c" : "#f2efe6", { roughness: 0.75 }));
      sole2.position.set(0, GROUND + soleH2 / 2, 0.045);
      g.add(sole2);
      if (!boot) {
        const line = rbox(0.106, 6e-3, 0.268, 3e-3, lowpolyMat(accent));
        line.position.set(0, GROUND + 0.02, 0.045);
        g.add(line);
      }
      const capG2 = new THREE5.CapsuleGeometry(0.048, 0.13, 4, 10);
      capG2.rotateX(Math.PI / 2);
      capG2.scale(1, 0.8, 1);
      const upper2 = new THREE5.Mesh(capG2, lowpolyMat(main, { roughness: boot ? 0.45 : 0.95 }));
      upper2.position.set(0, GROUND + soleH2 + 0.017, 0.05);
      g.add(upper2);
      if (!boot) {
        const toeG = new THREE5.SphereGeometry(0.05, 10, 6, 0, Math.PI, 0, Math.PI / 2);
        toeG.scale(1, 0.75, 0.9);
        const toe = new THREE5.Mesh(toeG, lowpolyMat("#f2efe6", { roughness: 0.7 }));
        toe.position.set(0, GROUND + soleH2 + 2e-3, 0.12);
        g.add(toe);
      }
      const shaftH = boot ? 0.13 : 0.06;
      const shaft = new THREE5.Mesh(new THREE5.CylinderGeometry(boot ? 0.05 : 0.047, 0.052, shaftH, 10, 1, true), lowpolyMat(main, { side: DS, roughness: boot ? 0.45 : 0.95 }));
      shaft.position.set(0, GROUND + soleH2 + shaftH / 2, -0.01);
      g.add(shaft);
      const laceMat = lowpolyMat(boot ? "#c9a46a" : "#ffffff");
      for (let i = 0; i < (boot ? 6 : 4); i++) {
        const lace = new THREE5.Mesh(new THREE5.BoxGeometry(0.045, 4e-3, 7e-3), laceMat);
        lace.position.set(0, GROUND + soleH2 + 0.05 + (boot ? i * 0.016 : -i * 4e-3), boot ? 0.04 - i * 2e-3 : 0.03 + i * 0.026);
        lace.rotation.x = boot ? -0.6 : -0.25;
        g.add(lace);
      }
      return g;
    }
    if (type === "quai-hau" || type === "le") {
      const sole2 = rbox(0.1, type === "le" ? 0.026 : 0.022, 0.255, 0.01, lowpolyMat(accent, { roughness: 0.6 }));
      sole2.position.set(0, GROUND + 0.012, 0.045);
      g.add(sole2);
      const strapMat = lowpolyMat(main, { roughness: 0.6, side: DS });
      if (type === "le") {
        const bandG = new THREE5.CylinderGeometry(0.054, 0.054, 0.075, 12, 1, true, -Math.PI / 2, Math.PI);
        bandG.rotateX(-Math.PI / 2);
        bandG.scale(1, 0.8, 1);
        const band = new THREE5.Mesh(bandG, strapMat);
        band.position.set(0, GROUND + 0.024, 0.085);
        g.add(band);
        if (item.emblemOnStrap !== false && imgs.upper) {
          const d = decal(imageCanvas(imgs.upper), 0.05, 0.03);
          d.position.set(0, GROUND + 0.07, 0.085);
          d.rotation.x = -Math.PI / 2;
          g.add(d);
        }
      } else {
        for (const z of [0.02, 0.105]) {
          const s = new THREE5.Mesh(new THREE5.TorusGeometry(0.05, 9e-3, 4, 12, Math.PI), strapMat);
          s.scale.set(1, 0.9, 1);
          s.position.set(0, GROUND + 0.022, z);
          g.add(s);
        }
        const heel = new THREE5.Mesh(new THREE5.TorusGeometry(0.05, 9e-3, 4, 12, Math.PI), strapMat);
        heel.rotation.x = -Math.PI / 2;
        heel.position.set(0, GROUND + 0.04, 0);
        g.add(heel);
      }
      return g;
    }
    const loafer = type === "loafer";
    const runner = type === "runner";
    const soleH = runner ? 0.038 : loafer ? 0.018 : 0.03;
    const sole = rbox(0.102, soleH, 0.262, 0.01, lowpolyMat(runner ? accent : loafer ? "#2a1d17" : "#f4f3ef", { roughness: 0.7 }));
    sole.position.set(0, GROUND + soleH / 2, 0.045);
    g.add(sole);
    const upperMat = lowpolyMat(main, { roughness: loafer ? 0.32 : 0.8, metalness: loafer ? 0.05 : 0 });
    const capG = new THREE5.CapsuleGeometry(0.049, 0.13, 4, 10);
    capG.rotateX(Math.PI / 2);
    capG.scale(1, loafer ? 0.66 : 0.82, 1);
    const upper = new THREE5.Mesh(capG, upperMat);
    upper.position.set(0, GROUND + soleH + (loafer ? 0.012 : 0.018), 0.05);
    g.add(upper);
    const collar = new THREE5.Mesh(new THREE5.CylinderGeometry(0.046, 0.05, loafer ? 0.03 : 0.05, 10, 1, true), lowpolyMat(loafer ? main : shade(main, -0.08), { side: DS }));
    collar.position.set(0, GROUND + soleH + 0.03, -0.01);
    g.add(collar);
    if (!loafer) {
      const laceMat = lowpolyMat(item.colors.lace || "#ffffff");
      for (let i = 0; i < 4; i++) {
        const lace = new THREE5.Mesh(new THREE5.BoxGeometry(0.05, 5e-3, 8e-3), laceMat);
        lace.position.set(0, GROUND + soleH + 0.05 - i * 4e-3, 0.03 + i * 0.028);
        lace.rotation.x = -0.25;
        g.add(lace);
      }
      const tab = new THREE5.Mesh(new THREE5.BoxGeometry(0.03, 0.04, 0.01), lowpolyMat(accent));
      tab.position.set(0, GROUND + soleH + 0.035, -0.072);
      g.add(tab);
      const stripe = new THREE5.Mesh(new THREE5.BoxGeometry(4e-3, 0.012, 0.12), lowpolyMat(accent));
      stripe.position.set(side * 0.05, GROUND + soleH + 0.018, 0.04);
      stripe.rotation.x = -0.15;
      g.add(stripe);
    } else {
      const band = new THREE5.Mesh(new THREE5.BoxGeometry(0.07, 0.01, 0.02), lowpolyMat(shade(main, -0.15)));
      band.position.set(0, GROUND + soleH + 0.047, 0.05);
      band.rotation.x = -0.3;
      g.add(band);
    }
    return g;
  }
  function buildFootwear(ctx) {
    const { item, imgs } = ctx;
    return {
      parts: [
        { joint: "ankleL", obj: shadowed(oneShoe(item, 1, imgs)) },
        { joint: "ankleR", obj: shadowed(oneShoe(item, -1, imgs)) }
      ]
    };
  }
  function buildHat(ctx) {
    var _a;
    const { item, emblemCanvas, imgs } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "luoi-trai";
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.2);
    const mat = lowpolyMat(main, { side: DS });
    const acc = lowpolyMat(accent, { side: DS });
    const g = new THREE5.Group();
    let hideHairTop = true;
    if (type === "luoi-trai") {
      const crownG = new THREE5.SphereGeometry(0.134, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      crownG.scale(0.97, 0.92, 1.05);
      const crown = new THREE5.Mesh(crownG, mat);
      crown.position.y = 0.135;
      crown.rotation.x = -0.12;
      g.add(crown);
      if (item.colors.front) {
        const fG = new THREE5.SphereGeometry(0.1355, 14, 8, Math.PI / 2 - 1.15, 2.3, 0, Math.PI * 0.5);
        fG.scale(0.97, 0.92, 1.05);
        const front = new THREE5.Mesh(fG, lowpolyMat(item.colors.front, { side: DS }));
        front.position.y = 0.135;
        front.rotation.x = -0.12;
        g.add(front);
      }
      const brimG = new THREE5.CylinderGeometry(0.11, 0.11, 8e-3, 14, 1, false, -Math.PI / 2, Math.PI);
      brimG.scale(1, 1, 0.85);
      const brim = new THREE5.Mesh(brimG, acc);
      brim.position.set(0, 0.14, 0.09);
      brim.rotation.x = 0.14;
      g.add(brim);
      const btn = new THREE5.Mesh(new THREE5.SphereGeometry(0.012, 6, 4), acc);
      btn.position.set(0, 0.258, -0.012);
      g.add(btn);
      const art = imgs.front ? imageCanvas(imgs.front) : item.emblem ? emblemCanvas : null;
      if (art) {
        const d = decal(art, 0.07, 0.07);
        d.position.set(0, 0.19, 0.122);
        d.rotation.x = -0.45;
        g.add(d);
      }
    } else if (type === "bucket") {
      const crown = new THREE5.Mesh(new THREE5.CylinderGeometry(0.112, 0.13, 0.1, 14), mat);
      crown.position.y = 0.2;
      g.add(crown);
      const brim = new THREE5.Mesh(new THREE5.CylinderGeometry(0.13, 0.19, 0.05, 16, 1, true), mat);
      brim.position.y = 0.13;
      g.add(brim);
      const band = new THREE5.Mesh(new THREE5.CylinderGeometry(0.131, 0.132, 0.02, 14, 1, true), acc);
      band.position.y = 0.16;
      g.add(band);
    } else if (type === "non-la") {
      const coneMat = new THREE5.MeshStandardMaterial({ map: toTexture(nonLaTexture(main)), side: DS, roughness: 0.9, flatShading: true });
      const cone = new THREE5.Mesh(new THREE5.ConeGeometry(0.25, 0.16, 28, 1, true), coneMat);
      cone.position.y = 0.26;
      g.add(cone);
      const strap = new THREE5.Mesh(new THREE5.TorusGeometry(0.115, 4e-3, 4, 16, Math.PI), acc);
      strap.rotation.z = Math.PI;
      strap.position.set(0, 0.17, 0.015);
      g.add(strap);
    } else if (type === "bao-hiem") {
      const shellG = new THREE5.SphereGeometry(0.145, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      shellG.scale(0.97, 0.95, 1.06);
      const shell = new THREE5.Mesh(shellG, lowpolyMat(main, { roughness: 0.28, side: DS }));
      shell.position.y = 0.13;
      g.add(shell);
      const ring = new THREE5.Mesh(new THREE5.CylinderGeometry(0.142, 0.143, 0.024, 16, 1, true), acc);
      ring.scale.set(0.97, 1, 1.06);
      ring.position.y = 0.142;
      g.add(ring);
      const visorG = new THREE5.CylinderGeometry(0.1, 0.1, 6e-3, 12, 1, false, -Math.PI / 2, Math.PI);
      visorG.scale(1, 1, 0.55);
      const visor = new THREE5.Mesh(visorG, acc);
      visor.position.set(0, 0.15, 0.13);
      visor.rotation.x = 0.25;
      g.add(visor);
      for (const s of [-1, 1]) {
        const st = limb(0.13, 4e-3, 4e-3, lowpolyMat("#222"), 4);
        st.position.set(s * 0.1, 0.14, 0.02);
        st.rotation.z = s * -0.25;
        g.add(st);
      }
      if (item.emblem && emblemCanvas) {
        const d = decal(emblemCanvas, 0.06, 0.06);
        d.position.set(0.1, 0.21, 0.07);
        d.rotation.set(-0.3, 0.9, 0.3);
        g.add(d);
      }
    } else if (type === "len") {
      const crownG = new THREE5.SphereGeometry(0.132, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
      crownG.scale(0.97, 1.12, 1.05);
      const crown = new THREE5.Mesh(crownG, mat);
      crown.position.y = 0.122;
      g.add(crown);
      const fold = new THREE5.Mesh(new THREE5.CylinderGeometry(0.133, 0.136, 0.05, 14, 1, true), acc);
      fold.scale.set(0.98, 1, 1.06);
      fold.position.y = 0.13;
      g.add(fold);
      const pom = new THREE5.Mesh(new THREE5.IcosahedronGeometry(0.035, 1), acc);
      pom.position.y = 0.282;
      g.add(pom);
    } else if (type === "tot-nghiep") {
      const cap = new THREE5.Mesh(new THREE5.CylinderGeometry(0.126, 0.13, 0.08, 14), mat);
      cap.position.y = 0.2;
      g.add(cap);
      const board = new THREE5.Mesh(new THREE5.BoxGeometry(0.3, 0.012, 0.3), mat);
      board.position.y = 0.245;
      board.rotation.y = Math.PI / 4;
      g.add(board);
      const btn = new THREE5.Mesh(new THREE5.CylinderGeometry(0.012, 0.012, 0.01, 8), acc);
      btn.position.y = 0.255;
      g.add(btn);
      const cord = limb(0.15, 3e-3, 3e-3, acc, 4);
      cord.position.set(0, 0.255, 0);
      cord.rotation.z = Math.PI / 2 + 0.05;
      g.add(cord);
      const tassel = limb(0.09, 6e-3, 0.016, acc, 6);
      tassel.position.set(0.15, 0.25, 0);
      g.add(tassel);
    }
    return { parts: [{ joint: "head", obj: shadowed(g) }], hideHairTop };
  }
  function buildBag(ctx) {
    var _a;
    const { item, rig, emblemCanvas, imgs } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "balo";
    const b = rig.build;
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
    const mat = lowpolyMat(main, { roughness: 0.85 });
    const acc = lowpolyMat(accent, { roughness: 0.8 });
    const g = new THREE5.Group();
    const chestZ = (y) => trunkRadius(y) * b.sz + 0.03;
    if (type === "balo" || type === "balo-laptop") {
      const slim = type === "balo-laptop";
      const d = slim ? 0.085 : 0.13;
      const backZ = -(trunkRadius(0.28) * b.sz + 0.028) - d / 2;
      const body = rbox(slim ? 0.29 : 0.28, slim ? 0.38 : 0.37, d, slim ? 0.02 : 0.045, mat, 3);
      body.position.set(0, 0.26, backZ);
      g.add(body);
      const pocket = rbox(slim ? 0.22 : 0.2, slim ? 0.12 : 0.15, 0.05, 0.02, acc, 2);
      pocket.position.set(0, slim ? 0.2 : 0.17, backZ - d / 2 - 0.012);
      g.add(pocket);
      const art = imgs.front ? imageCanvas(imgs.front) : item.emblem ? emblemCanvas : null;
      if (art) {
        const p = decal(art, 0.075, 0.075);
        p.position.set(0, slim ? 0.32 : 0.33, backZ - d / 2 - 2e-3);
        p.rotation.y = Math.PI;
        g.add(p);
      }
      const handle = new THREE5.Mesh(new THREE5.TorusGeometry(0.03, 7e-3, 4, 10, Math.PI), acc);
      handle.position.set(0, 0.45, backZ);
      g.add(handle);
      const strapMat = lowpolyMat(shade(main, -0.12), { roughness: 0.85 });
      for (const s of [-1, 1]) {
        const x = s * 0.085 * b.sx;
        g.add(tube([
          [x, 0.42, backZ + d / 2 - 0.01],
          [x * 1.1, 0.505, -0.02],
          [x * 1.12, 0.44, chestZ(0.44)],
          [x * 1.15, 0.3, chestZ(0.3)],
          [x * 1.3, 0.17, chestZ(0.17)],
          [s * (trunkRadius(0.16) * b.sx + 0.012), 0.15, 0],
          [x * 1.5, 0.13, backZ + d / 2]
        ], 0.011, strapMat));
        const buckle = new THREE5.Mesh(new THREE5.BoxGeometry(0.028, 0.02, 8e-3), lowpolyMat("#1c1c1e"));
        buckle.position.set(x * 1.15, 0.3, chestZ(0.3) + 0.01);
        g.add(buckle);
      }
    } else if (type === "tote") {
      const bx = -(0.2 * b.sx + 0.11);
      const bag = rbox(0.035, 0.31, 0.28, 8e-3, mat);
      bag.position.set(bx, -0.02, -0.06);
      g.add(bag);
      const art = imgs.front ? imageCanvas(imgs.front) : item.emblem ? emblemCanvas : null;
      if (art) {
        const p = decal(art, 0.15, 0.15);
        p.position.set(bx - 0.019, -0.02, -0.06);
        p.rotation.y = -Math.PI / 2;
        g.add(p);
      }
      for (const z of [-0.14, 0.02]) {
        g.add(tube([[bx, 0.13, z], [bx * 0.85, 0.36, z * 0.5 - 0.02], [-0.12 * b.sx, 0.5, -0.01]], 8e-3, acc));
      }
    } else if (type === "cap-sach") {
      const bx = -(0.2 * b.sx + 0.1);
      const bag = rbox(0.07, 0.25, 0.33, 0.02, mat, 3);
      bag.position.set(bx, -0.03, -0.02);
      g.add(bag);
      const flap = rbox(0.074, 0.15, 0.335, 0.02, acc, 2);
      flap.position.set(bx - 2e-3, 0.03, -0.02);
      g.add(flap);
      for (const z of [-0.1, 0.06]) {
        const clasp = new THREE5.Mesh(new THREE5.BoxGeometry(8e-3, 0.03, 0.022), lowpolyMat("#c9b98f", { metalness: 0.6, roughness: 0.35 }));
        clasp.position.set(bx - 0.04, -0.03, z);
        g.add(clasp);
      }
      const art = imgs.front ? imageCanvas(imgs.front) : item.emblem ? emblemCanvas : null;
      if (art) {
        const p = decal(art, 0.07, 0.07);
        p.position.set(bx - 0.04, 0.04, -0.02);
        p.rotation.y = -Math.PI / 2;
        g.add(p);
      }
      const handle = new THREE5.Mesh(new THREE5.TorusGeometry(0.045, 8e-3, 4, 10, Math.PI), acc);
      handle.rotation.y = Math.PI / 2;
      handle.position.set(bx, 0.095, -0.02);
      g.add(handle);
      g.add(tube([[bx, 0.09, 0.12], [-0.13 * b.sx, 0.3, chestZ(0.3) + 4e-3], [0.11 * b.sx, 0.5, 0], [0.05, 0.38, -chestZ(0.38)], [bx * 0.8, 0.12, -0.14], [bx, 0.09, -0.16]], 8e-3, acc));
    } else if (type === "deo-cheo") {
      const pts = [
        [0.12 * b.sx, 0.5, -0.03],
        [0.09 * b.sx, 0.47, chestZ(0.45)],
        [0, 0.32, chestZ(0.32) + 4e-3],
        [-0.12 * b.sx, 0.13, chestZ(0.13)],
        [-0.17 * b.sx, 0.02, chestZ(0.02) + 0.02]
      ];
      g.add(tube(pts, 9e-3, acc));
      g.add(tube([[0.12 * b.sx, 0.5, -0.03], [0.04, 0.38, -chestZ(0.38)], [-0.13 * b.sx, 0.15, -chestZ(0.15)], [-0.2 * b.sx, 0.03, -0.02]], 9e-3, acc));
      const bag = rbox(0.17, 0.13, 0.055, 0.02, mat);
      bag.position.set(-0.15 * b.sx, -0.03, chestZ(-0.03) + 0.035);
      bag.rotation.y = -0.35;
      g.add(bag);
      const flap = rbox(0.172, 0.06, 0.058, 0.015, acc);
      flap.position.set(-0.15 * b.sx, 0.01, chestZ(-0.03) + 0.037);
      flap.rotation.y = -0.35;
      g.add(flap);
    }
    return { parts: [{ joint: "torso", obj: shadowed(g) }] };
  }
  function ribbon(points, width, mat) {
    const curve = new THREE5.CatmullRomCurve3(points.map((p) => new THREE5.Vector3(...p)));
    curve.curveType = "centripetal";
    const N = 64;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const out = new THREE5.Vector3(p.x, 0, p.z).normalize();
      const side = new THREE5.Vector3().crossVectors(tan, out).normalize().multiplyScalar(width / 2);
      pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
      uv.push(t, 0, t, 1);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE5.BufferGeometry();
    g.setAttribute("position", new THREE5.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE5.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return new THREE5.Mesh(g, mat);
  }
  function buildCard(ctx) {
    var _a;
    const { item, rig, cardCanvas, emblem } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "day-deo";
    const b = rig.build;
    const g = new THREE5.Group();
    const main = item.colors.main || (emblem == null ? void 0 : emblem.main) || "#b3141d";
    const textColor = item.colors.text || "#ffffff";
    const holderColor = item.colors.accent || main;
    const chestZ = (y) => trunkRadius(y) * b.sz + 0.026;
    const metal = lowpolyMat("#c8ccd2", { metalness: 0.75, roughness: 0.3 });
    const cardTex = toTexture(cardCanvas);
    const makeCard = (scale, holder) => {
      const c = new THREE5.Group();
      const w = 0.12 * scale, h2 = 0.0757 * scale;
      if (holder === "silicone") {
        const frame = rbox(w + 0.016, h2 + 0.022, 8e-3, 8e-3, lowpolyMat(holderColor, { roughness: 0.6 }), 3);
        frame.position.y = -3e-3;
        c.add(frame);
        const slot = new THREE5.Mesh(new THREE5.BoxGeometry(0.026, 5e-3, 2e-3), lowpolyMat(shade(holderColor, -0.3)));
        slot.position.set(0, h2 / 2 + 2e-3, 42e-4);
        c.add(slot);
      } else {
        c.add(rbox(w + 0.012, h2 + 0.012, 5e-3, 4e-3, new THREE5.MeshStandardMaterial({ color: "#eef3f8", transparent: true, opacity: 0.35, roughness: 0.1 })));
      }
      const face = decal(cardTex, w, h2, { transparent: false });
      face.position.z = 45e-4;
      c.add(face);
      return c;
    };
    if (type === "day-deo") {
      const ribbonMat = new THREE5.MeshStandardMaterial({
        map: toTexture(ribbonTexture(`${((emblem == null ? void 0 : emblem.name) || "").toUpperCase()}  ·  ${(emblem == null ? void 0 : emblem.wordmark) || ""}`, main, textColor)),
        side: DS,
        roughness: 0.7
      });
      for (const s of [-1, 1]) {
        g.add(ribbon([
          [0, 0.508, -0.07],
          [s * 0.05, 0.5, -0.045],
          [s * 0.078, 0.488, 0.03],
          [s * 0.066, 0.41, chestZ(0.41)],
          [s * 0.034, 0.31, chestZ(0.31) + 4e-3],
          [s * 8e-3, 0.25, chestZ(0.25) + 8e-3]
        ], 0.02, ribbonMat));
      }
      const ring = new THREE5.Mesh(new THREE5.TorusGeometry(8e-3, 25e-4, 4, 10), metal);
      ring.position.set(0, 0.246, chestZ(0.25) + 0.01);
      g.add(ring);
      const hook = new THREE5.Mesh(new THREE5.CapsuleGeometry(45e-4, 0.018, 2, 6), metal);
      hook.position.set(0, 0.229, chestZ(0.23) + 0.012);
      g.add(hook);
      const card = makeCard(1, "silicone");
      card.position.set(0, 0.168, chestZ(0.17) + 0.016);
      card.rotation.x = -0.06;
      g.add(card);
    } else {
      const card = makeCard(0.85, "clear");
      const x = 0.075 * b.sx;
      card.position.set(x, 0.28, chestZ(0.28) + 6e-3);
      card.rotation.set(-0.1, 0.32, 0);
      g.add(card);
      const clip = new THREE5.Mesh(new THREE5.BoxGeometry(0.02, 0.025, 6e-3), metal);
      clip.position.set(x - 4e-3, 0.325, chestZ(0.32) + 8e-3);
      clip.rotation.y = 0.32;
      g.add(clip);
    }
    return { parts: [{ joint: "torso", obj: shadowed(g) }] };
  }
  function buildEyewear(ctx) {
    var _a;
    const { item } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "tron";
    const frame = lowpolyMat(item.colors.main, { roughness: 0.35, metalness: type === "tron" || type === "nua" ? 0.5 : 0.1 });
    const g = new THREE5.Group();
    g.position.y = 0.114;
    const sq = type !== "tron";
    for (const s of [-1, 1]) {
      const ring = new THREE5.Mesh(new THREE5.TorusGeometry(sq ? 0.03 : 0.025, 36e-4, 4, sq ? 4 : 16), frame);
      if (sq) {
        ring.rotation.z = Math.PI / 4;
        ring.scale.set(1.15, 0.85, 1);
      }
      ring.position.set(s * 0.039, 0, 0.117);
      g.add(ring);
      if (type === "ram") {
        const lens = new THREE5.Mesh(new THREE5.CircleGeometry(sq ? 0.03 : 0.025, sq ? 4 : 16), new THREE5.MeshStandardMaterial({ color: item.colors.accent || "#1b1f2a", transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.3 }));
        lens.rotation.z = Math.PI / 4;
        lens.scale.set(1.15, 0.85, 1);
        lens.position.set(s * 0.039, 0, 0.117);
        g.add(lens);
      }
      const temple = new THREE5.Mesh(new THREE5.BoxGeometry(4e-3, 5e-3, 0.12), frame);
      temple.position.set(s * 0.1, 4e-3, 0.06);
      g.add(temple);
    }
    if (type === "nua") {
      for (const s of [-1, 1]) {
        const brow = new THREE5.Mesh(new THREE5.BoxGeometry(0.07, 0.011, 8e-3), lowpolyMat(item.colors.accent || "#1b1b1d", { roughness: 0.4 }));
        brow.position.set(s * 0.039, 0.018, 0.118);
        g.add(brow);
      }
    }
    const bridge = new THREE5.Mesh(new THREE5.BoxGeometry(0.022, 4e-3, 4e-3), frame);
    bridge.position.set(0, 6e-3, 0.119);
    g.add(bridge);
    return { parts: [{ joint: "head", obj: shadowed(g) }] };
  }
  function buildHandheld(ctx) {
    var _a;
    const { item, emblemCanvas } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "laptop";
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
    const g = new THREE5.Group();
    let pose = {};
    if (type === "laptop") {
      const lap = rbox(0.022, 0.215, 0.305, 8e-3, lowpolyMat(main, { roughness: 0.35, metalness: 0.4 }));
      lap.position.set(0.035, -0.135, 0.06);
      g.add(lap);
      if (item.emblem && emblemCanvas) {
        const st = decal(emblemCanvas, 0.06, 0.06);
        st.position.set(0.035 - 0.0115, -0.13, 0.06);
        st.rotation.y = -Math.PI / 2;
        g.add(st);
      }
    } else if (type === "vo") {
      const book = rbox(0.018, 0.21, 0.15, 4e-3, lowpolyMat(main));
      book.position.set(0.032, -0.12, 0.04);
      g.add(book);
      const label = new THREE5.Mesh(new THREE5.PlaneGeometry(0.09, 0.05), lowpolyMat("#ffffff"));
      label.position.set(0.032 - 95e-4, -0.1, 0.04);
      label.rotation.y = -Math.PI / 2;
      g.add(label);
      const pen = limb(0.14, 5e-3, 5e-3, lowpolyMat(accent), 6);
      pen.position.set(0.012, -0.03, 0.08);
      pen.rotation.x = 0.3;
      g.add(pen);
    } else if (type === "binh-nuoc") {
      const bottle = new THREE5.Mesh(new THREE5.CylinderGeometry(0.032, 0.032, 0.19, 10), lowpolyMat(main, { roughness: 0.3, metalness: 0.35 }));
      bottle.position.set(0.02, -0.07, 0.02);
      g.add(bottle);
      const lid = new THREE5.Mesh(new THREE5.CylinderGeometry(0.026, 0.03, 0.035, 10), lowpolyMat(accent));
      lid.position.set(0.02, 0.04, 0.02);
      g.add(lid);
      pose = { elbowR: -0.75 };
    } else if (type === "o") {
      const shaft = limb(0.7, 75e-4, 75e-4, lowpolyMat("#3a3a3a", { metalness: 0.5 }), 6);
      shaft.position.set(0.012, -0.03, 0.02);
      g.add(shaft);
      const fold = new THREE5.Mesh(new THREE5.ConeGeometry(0.04, 0.46, 8), lowpolyMat(main));
      fold.rotation.x = Math.PI;
      fold.position.set(0.012, -0.47, 0.02);
      g.add(fold);
      const hook = new THREE5.Mesh(new THREE5.TorusGeometry(0.03, 8e-3, 4, 10, Math.PI), lowpolyMat(accent));
      hook.position.set(0.012, -0.03, 0.05);
      hook.rotation.y = Math.PI / 2;
      hook.rotation.z = Math.PI;
      g.add(hook);
    } else if (type === "may-tinh") {
      const calc = rbox(0.085, 0.16, 0.016, 6e-3, lowpolyMat(main));
      const face = decal(calculatorFace(main, accent), 0.078, 0.15);
      face.position.z = 85e-4;
      calc.add(face);
      calc.position.set(0.02, -0.09, 0.03);
      calc.rotation.set(-0.3, -0.6, 0);
      g.add(calc);
      pose = { elbowR: -1.05 };
    } else if (type === "sach") {
      const book = rbox(0.045, 0.24, 0.17, 4e-3, lowpolyMat(main));
      book.position.set(0.04, -0.13, 0.04);
      g.add(book);
      const pages = new THREE5.Mesh(new THREE5.BoxGeometry(0.038, 0.232, 4e-3), lowpolyMat("#f6f2e6"));
      pages.position.set(0.04, -0.13, 0.04 + 0.085);
      g.add(pages);
      const band = new THREE5.Mesh(new THREE5.BoxGeometry(0.0455, 0.03, 0.172), lowpolyMat(accent));
      band.position.set(0.04, -0.06, 0.04);
      g.add(band);
      const book2 = rbox(0.022, 0.21, 0.15, 4e-3, lowpolyMat(item.colors.second || "#e8b93a"));
      book2.position.set(0.075, -0.12, 0.035);
      g.add(book2);
    } else if (type === "but") {
      const pen = limb(0.15, 55e-4, 45e-4, lowpolyMat(main, { roughness: 0.35 }), 6);
      pen.position.set(0.012, -0, 0.03);
      pen.rotation.x = 0.9;
      g.add(pen);
      const clip = new THREE5.Mesh(new THREE5.BoxGeometry(3e-3, 0.04, 4e-3), lowpolyMat(accent, { metalness: 0.6 }));
      clip.position.set(0.018, -0.012, 0.035);
      clip.rotation.x = 0.9;
      g.add(clip);
      pose = { elbowR: -0.9 };
    } else if (type === "hop-but") {
      const pouch = new THREE5.Mesh(new THREE5.CapsuleGeometry(0.035, 0.15, 4, 8), lowpolyMat(main));
      pouch.rotation.x = Math.PI / 2;
      pouch.scale.set(1, 1, 0.75);
      pouch.position.set(0.02, -0.08, 0.04);
      g.add(pouch);
      const zip = new THREE5.Mesh(new THREE5.BoxGeometry(4e-3, 6e-3, 0.2), lowpolyMat(accent));
      zip.position.set(0.02, -0.052, 0.04);
      g.add(zip);
      pose = { elbowR: -0.6 };
    } else if (type === "dien-thoai") {
      const phone = rbox(0.074, 0.155, 9e-3, 8e-3, lowpolyMat(main, { roughness: 0.3, metalness: 0.3 }));
      const scr = new THREE5.Mesh(new THREE5.PlaneGeometry(0.068, 0.145), new THREE5.MeshStandardMaterial({ color: "#1d2433", emissive: "#2a3f66", emissiveIntensity: 0.6, roughness: 0.2 }));
      scr.position.z = 48e-4;
      phone.add(scr);
      phone.position.set(0.02, -0.08, 0.035);
      phone.rotation.set(-0.35, -0.7, 0);
      g.add(phone);
      pose = { elbowR: -1.1 };
    } else if (type === "ong-ban-ve") {
      const tubeM = new THREE5.Mesh(new THREE5.CylinderGeometry(0.038, 0.038, 0.64, 10), lowpolyMat(main));
      tubeM.position.set(0.04, -0.22, 0.02);
      g.add(tubeM);
      for (const y of [0.1, -0.54]) {
        const capM = new THREE5.Mesh(new THREE5.CylinderGeometry(0.041, 0.041, 0.05, 10), lowpolyMat(accent));
        capM.position.set(0.04, y, 0.02);
        g.add(capM);
      }
      const strap = limb(0.6, 6e-3, 6e-3, lowpolyMat("#222"), 4);
      strap.position.set(0.075, 0.08, 0.02);
      g.add(strap);
    }
    return { parts: [{ joint: "wristR", obj: shadowed(g) }], pose };
  }
  function buildMask(ctx) {
    var _a;
    const { item, imgs } = ctx;
    const cloth = ((_a = item.options) == null ? void 0 : _a.type) === "vai";
    const rows = 6;
    const geo = new THREE5.CylinderGeometry(0.133, 0.122, 0.088, 18, rows, true, -1.12, 2.24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const row = Math.round((y + 0.044) / 0.088 * rows);
      if (!cloth && row > 0 && row < rows && row % 2 === 1) {
        pos.setX(i, pos.getX(i) * 1.03);
        pos.setZ(i, pos.getZ(i) * 1.03);
      }
    }
    geo.computeVertexNormals();
    geo.scale(0.9, 1, 1);
    const tex = imgs.front ? toTexture(imageCanvas(imgs.front)) : toTexture(maskTexture(item.colors.main, { pleats: !cloth, edge: !cloth }));
    const mask = new THREE5.Mesh(geo, new THREE5.MeshStandardMaterial({ map: tex, side: DS, roughness: 0.95, flatShading: true }));
    mask.position.y = 0.064;
    const g = new THREE5.Group();
    g.add(mask);
    const loopMat = lowpolyMat(item.colors.accent || "#f4f6f8");
    for (const s of [-1, 1]) {
      for (const y of [0.098, 0.032]) {
        g.add(tube([[s * 0.104, y, 0.056], [s * 0.118, (y + 0.11) / 2 + 0.012, 0.012], [s * 0.114, 0.11, -0.03]], 24e-4, loopMat));
      }
    }
    return { parts: [{ joint: "head", obj: g }] };
  }
  function buildAudio(ctx) {
    var _a;
    const { item } = ctx;
    const type = ((_a = item.options) == null ? void 0 : _a.type) || "chup-tai";
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
    const mat = lowpolyMat(main, { roughness: 0.4 });
    const pad = lowpolyMat(accent, { roughness: 0.9 });
    const g = new THREE5.Group();
    const cup = () => {
      const c = new THREE5.Group();
      const shell = new THREE5.Mesh(new THREE5.CylinderGeometry(0.044, 0.046, 0.028, 14), mat);
      shell.rotation.z = Math.PI / 2;
      c.add(shell);
      const cushion = new THREE5.Mesh(new THREE5.TorusGeometry(0.034, 0.012, 6, 14), pad);
      cushion.rotation.y = Math.PI / 2;
      c.add(cushion);
      return c;
    };
    if (type === "chup-tai") {
      const band = new THREE5.Mesh(new THREE5.TorusGeometry(0.138, 8e-3, 5, 22, Math.PI), mat);
      band.scale.set(0.98, 1.02, 1.6);
      band.position.y = 0.105;
      g.add(band);
      const top = new THREE5.Mesh(new THREE5.TorusGeometry(0.135, 0.011, 5, 12, Math.PI * 0.5), pad);
      top.rotation.z = Math.PI / 4;
      top.position.y = 0.105;
      g.add(top);
      for (const s of [-1, 1]) {
        const c = cup();
        c.position.set(s * 0.122, 0.1, 0);
        if (s < 0) c.rotation.y = Math.PI;
        g.add(c);
      }
      return { parts: [{ joint: "head", obj: shadowed(g) }] };
    }
    if (type === "deo-co") {
      const band = new THREE5.Mesh(new THREE5.TorusGeometry(0.095, 8e-3, 5, 22, Math.PI), mat);
      band.rotation.x = -Math.PI / 2 - 0.25;
      band.position.set(0, 0.5, -5e-3);
      g.add(band);
      for (const s of [-1, 1]) {
        const c = cup();
        c.position.set(s * 0.1, 0.49, 0.03);
        c.rotation.set(0, 0, s * 0.9);
        g.add(c);
      }
      return { parts: [{ joint: "torso", obj: shadowed(g) }] };
    }
    for (const s of [-1, 1]) {
      const bud = new THREE5.Mesh(new THREE5.IcosahedronGeometry(0.012, 1), mat);
      bud.position.set(s * 0.112, 0.112, 4e-3);
      g.add(bud);
      const stem = limb(0.03, 45e-4, 45e-4, mat, 6);
      stem.position.set(s * 0.114, 0.106, 6e-3);
      g.add(stem);
    }
    return { parts: [{ joint: "head", obj: g }] };
  }

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/items/index.js
  var BUILDERS = {
    hair: buildHair,
    top: buildTop,
    bottom: buildBottom,
    footwear: buildFootwear,
    hat: buildHat,
    bag: buildBag,
    card: buildCard,
    eyewear: buildEyewear,
    handheld: buildHandheld,
    mask: buildMask,
    audio: buildAudio
  };

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/studio.js
  var SLOT_ORDER = ["hair", "top", "bottom", "footwear", "hat", "bag", "card", "eyewear", "mask", "audio", "handheld"];
  var clone = (o) => JSON.parse(JSON.stringify(o));
  function merge(base, over) {
    if (!over) return clone(base);
    const out = clone(base);
    for (const [k, v] of Object.entries(over)) {
      if (v && typeof v === "object" && !Array.isArray(v)) out[k] = { ...out[k] || {}, ...v };
      else out[k] = v;
    }
    return out;
  }
  function mountParts(rig, parts) {
    return parts.map((p) => {
      if (p.skinned) {
        attachSkinned(rig, p.skinned);
        return { joint: "root", obj: p.skinned };
      }
      rig.joints[p.joint].add(p.obj);
      return p;
    });
  }
  function disposeTree(obj) {
    obj.traverse((o) => {
      if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      }
    });
  }
  var FOCUS = {
    full: { target: [0, 0.86, 0], dist: 3.9, polar: 1.45 },
    head: { target: [0, 1.52, 0], dist: 1.15, polar: 1.48 },
    card: { target: [0, 1.12, 0], dist: 1, polar: 1.5 },
    feet: { target: [0, 0.1, 0.05], dist: 1.05, polar: 1.1 }
  };
  var AvatarStudio = class {
    /**
     * @param {HTMLElement} container nơi chứa canvas 3D
     * @param {{catalog, state?, onChange?, idle?}} opts
     */
    constructor(container, opts = {}) {
      var _a, _b, _c;
      this.container = container;
      this.catalog = opts.catalog;
      this.onChange = opts.onChange || (() => {
      });
      this.items = new Map(this.catalog.items.map((it) => [it.id, it]));
      this.state = merge(clone(this.catalog.defaults), opts.state || {});
      this.state.equipped = { ...this.catalog.defaults.equipped, ...((_a = opts.state) == null ? void 0 : _a.equipped) || {} };
      this.state.overrides = ((_b = opts.state) == null ? void 0 : _b.overrides) || {};
      this.idle = (_c = opts.idle) != null ? _c : !matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.slots = {};
      this._tokens = {};
      this._pose = { elbowR: 0 };
      this._initScene();
      this.ready = this._rebuildAll();
    }
    // -------------------------------------------------- Cảnh
    _initScene() {
      const r = new THREE6.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputEncoding = THREE6.sRGBEncoding;
      r.toneMapping = THREE6.NoToneMapping;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE6.PCFSoftShadowMap;
      r.domElement.style.display = "block";
      r.domElement.style.width = "100%";
      r.domElement.style.height = "100%";
      r.domElement.setAttribute("aria-label", "Nhân vật 3D — kéo để xoay, cuộn để phóng to");
      r.domElement.setAttribute("role", "img");
      this.container.appendChild(r.domElement);
      this.renderer = r;
      const scene = new THREE6.Scene();
      this.scene = scene;
      const cam = new THREE6.PerspectiveCamera(30, 1, 0.05, 50);
      this.camera = cam;
      scene.add(new THREE6.HemisphereLight("#ffffff", "#b5a990", 0.62));
      const key = new THREE6.DirectionalLight("#fff6ea", 0.95);
      key.position.set(2.2, 4, 3);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 2.2, bottom: -0.4, near: 0.5, far: 10 });
      key.shadow.bias = -5e-4;
      key.shadow.normalBias = 0.02;
      scene.add(key);
      const rim = new THREE6.DirectionalLight("#c9d6ff", 0.4);
      rim.position.set(-3, 2.5, -2.5);
      scene.add(rim);
      const ground = new THREE6.Mesh(new THREE6.PlaneGeometry(8, 8), new THREE6.ShadowMaterial({ opacity: 0.14 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      const blob = new THREE6.Mesh(new THREE6.PlaneGeometry(0.9, 0.9), new THREE6.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2;
      blob.position.y = 2e-3;
      scene.add(blob);
      const controls = new import_OrbitControls.OrbitControls(cam, r.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 0.7;
      controls.maxDistance = 6;
      controls.maxPolarAngle = Math.PI * 0.62;
      controls.autoRotateSpeed = 1.6;
      this.controls = controls;
      this._setFocusImmediate("full");
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this.container);
      this._resize();
      this.clock = new THREE6.Clock();
      r.setAnimationLoop(() => this._tick());
    }
    _resize() {
      const w = this.container.clientWidth || 1, h2 = this.container.clientHeight || 1;
      this.renderer.setSize(w, h2, false);
      this.camera.aspect = w / h2;
      this.camera.updateProjectionMatrix();
    }
    _tick() {
      var _a;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      if (this._anim) {
        const a = this._anim;
        a.t = Math.min(1, a.t + dt / 0.6);
        const k = 1 - Math.pow(1 - a.t, 3);
        this.controls.target.lerpVectors(a.fromT, a.toT, k);
        this.camera.position.lerpVectors(a.fromP, a.toP, k);
        if (a.t >= 1) this._anim = null;
      }
      this.controls.update();
      const j = (_a = this.rig) == null ? void 0 : _a.joints;
      if (j) {
        const s = this.idle ? 1 : 0;
        j.torso.rotation.y = s * Math.sin(t * 0.6) * 0.035;
        j.torso.position.y = 0.965 + s * Math.sin(t * 1.8) * 3e-3;
        j.head.rotation.y = s * Math.sin(t * 0.45 + 1) * 0.16;
        j.head.rotation.x = s * Math.sin(t * 0.7) * 0.03;
        j.shoulderL.rotation.z = 0.09 + s * Math.sin(t * 1.2) * 0.018;
        j.shoulderR.rotation.z = -0.09 - s * Math.sin(t * 1.2 + 0.4) * 0.018;
        j.shoulderL.rotation.x = s * Math.sin(t * 0.9) * 0.03;
        j.shoulderR.rotation.x = s * Math.sin(t * 0.9 + 2) * 0.03 + this._pose.elbowR * 0.15;
        j.elbowR.rotation.x += (this._pose.elbowR - j.elbowR.rotation.x) * Math.min(1, dt * 6);
        j.elbowL.rotation.x = -0.06;
      }
      this.renderer.render(this.scene, this.camera);
    }
    // -------------------------------------------------- Camera
    _focusPose(name) {
      const f = FOCUS[name] || FOCUS.full;
      const target = new THREE6.Vector3(...f.target);
      let az = 0.35;
      if (this.camera.position.lengthSq() > 0) {
        const d = this.camera.position.clone().sub(this.controls.target);
        az = Math.atan2(d.x, d.z);
      }
      if (name === "card" || name === "feet") az = 0.3;
      const narrow = this.camera.aspect < 0.8 && name === "full" ? 1.25 : 1;
      const dist = f.dist * narrow;
      const pos = new THREE6.Vector3(
        target.x + dist * Math.sin(f.polar) * Math.sin(az),
        target.y + dist * Math.cos(f.polar),
        target.z + dist * Math.sin(f.polar) * Math.cos(az)
      );
      return { target, pos };
    }
    _setFocusImmediate(name) {
      const { target, pos } = this._focusPose(name);
      this.controls.target.copy(target);
      this.camera.position.copy(pos);
    }
    focus(name) {
      const { target, pos } = this._focusPose(name);
      if (!this.idle) {
        this.controls.target.copy(target);
        this.camera.position.copy(pos);
        return;
      }
      this._anim = { t: 0, fromT: this.controls.target.clone(), toT: target, fromP: this.camera.position.clone(), toP: pos };
    }
    setAutoRotate(on) {
      this.controls.autoRotate = !!on;
    }
    // -------------------------------------------------- Dữ liệu
    resolveItem(id) {
      const base = this.items.get(id);
      if (!base) return null;
      return merge(base, this.state.overrides[id]);
    }
    itemsForSlot(slot) {
      return this.catalog.items.filter((i) => i.slot === slot);
    }
    _emit() {
      clearTimeout(this._emitT);
      this._emitT = setTimeout(() => this.onChange(this.getState()), 60);
    }
    getState() {
      return clone(this.state);
    }
    async setState(state) {
      this.state = merge(clone(this.catalog.defaults), state);
      this.state.equipped = { ...this.catalog.defaults.equipped, ...state.equipped || {} };
      this.state.overrides = state.overrides || {};
      await this._rebuildAll();
      this._emit();
    }
    // -------------------------------------------------- Huy hiệu & thẻ
    _drawEmblem() {
      this.emblemCanvas = drawEmblem(this.state.emblem);
    }
    async _drawCard() {
      const c = this.state.card || {};
      const [photo, template] = await Promise.all([loadImage(c.photo), loadImage(c.template)]);
      this.cardCanvas = drawStudentCard({ ...c, photo, template }, this.emblemCanvas, this.state.emblem);
      return this.cardCanvas;
    }
    // -------------------------------------------------- Mặc đồ
    async _rebuildAll() {
      var _a, _b;
      if ((_a = document.fonts) == null ? void 0 : _a.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {
        }
      }
      this._drawEmblem();
      await this._drawCard();
      if (this.rig) {
        this.scene.remove(this.rig.root);
        disposeTree(this.rig.root);
      }
      for (const s of Object.values(this.slots)) for (const p of s.parts) disposeTree(p.obj);
      this.slots = {};
      const hairItem = this.resolveItem(this.state.equipped.hair);
      this.rig = buildRig({ ...this.state.body, browColor: (_b = hairItem == null ? void 0 : hairItem.colors) == null ? void 0 : _b.main });
      linearize(this.rig.root);
      this.scene.add(this.rig.root);
      await Promise.all(SLOT_ORDER.map((s) => this._buildSlot(s)));
      this._applyRules();
    }
    async _buildSlot(slot) {
      var _a;
      const token = (this._tokens[slot] || 0) + 1;
      this._tokens[slot] = token;
      const id = this.state.equipped[slot];
      const item = id ? this.resolveItem(id) : null;
      const imgs = item ? await loadImageSet(item.textures) : {};
      if (this._tokens[slot] !== token) return;
      const old = this.slots[slot];
      if (old) for (const p of old.parts) {
        (_a = p.obj.parent) == null ? void 0 : _a.remove(p.obj);
        disposeTree(p.obj);
      }
      delete this.slots[slot];
      if (!item) return;
      const builder = BUILDERS[slot];
      if (!builder) {
        console.warn("[avatar-studio] Chưa có builder cho slot", slot);
        return;
      }
      const res = builder({ item, rig: this.rig, imgs, emblemCanvas: this.emblemCanvas, cardCanvas: this.cardCanvas, emblem: this.state.emblem, hatOn: !!this.state.equipped.hat });
      res.parts = mountParts(this.rig, res.parts);
      for (const p of res.parts) linearize(p.obj);
      this.slots[slot] = { id, ...res };
    }
    _applyRules() {
      var _a, _b, _c, _d;
      const hat = this.slots.hat;
      const hair = this.slots.hair;
      if (hair == null ? void 0 : hair.hideUnderHat) for (const m of hair.hideUnderHat) m.visible = !(hat && hat.hideHairTop);
      this._pose = { elbowR: 0, ...((_a = this.slots.handheld) == null ? void 0 : _a.pose) || {} };
      const tucked = !!((_c = (_b = this.resolveItem(this.state.equipped.top)) == null ? void 0 : _b.options) == null ? void 0 : _c.tucked);
      for (const p of ((_d = this.slots.bottom) == null ? void 0 : _d.parts) || []) if (p.obj.userData.belt) p.obj.visible = tucked;
    }
    async equip(slot, id) {
      this.state.equipped[slot] = id || null;
      if (slot === "hair") {
        await this._rebuildAll();
      } else {
        await this._buildSlot(slot);
        if (slot === "hat") await this._buildSlot("hair");
        this._applyRules();
      }
      this._emit();
    }
    _override(id) {
      var _a;
      return (_a = this.state.overrides)[id] || (_a[id] = {});
    }
    async setItemColor(id, key, color) {
      const ov = this._override(id);
      ov.colors = { ...ov.colors || {}, [key]: color };
      await this._refreshItem(id);
    }
    /** key: 'front' | 'back' | 'pattern' | 'upper'; url có thể là đường dẫn file hoặc dataURL */
    async setItemTexture(id, key, url) {
      const ov = this._override(id);
      ov.textures = { ...ov.textures || {}, [key]: url || null };
      await this._refreshItem(id);
    }
    async setItemEmblem(id, pos) {
      this._override(id).emblem = pos || null;
      await this._refreshItem(id);
    }
    resetItem(id) {
      delete this.state.overrides[id];
      return this._refreshItem(id);
    }
    async _refreshItem(id) {
      var _a;
      const slot = (_a = this.items.get(id)) == null ? void 0 : _a.slot;
      if (slot && this.state.equipped[slot] === id) {
        if (slot === "hair") await this._rebuildAll();
        else {
          await this._buildSlot(slot);
          this._applyRules();
        }
      }
      this._emit();
    }
    async setBody(patch) {
      this.state.body = { ...this.state.body, ...patch };
      await this._rebuildAll();
      this._emit();
    }
    async setEmblem(patch) {
      this.state.emblem = { ...this.state.emblem, ...patch };
      this._drawEmblem();
      await this._drawCard();
      await Promise.all(SLOT_ORDER.map((s) => this._buildSlot(s)));
      this._applyRules();
      this._emit();
    }
    async setCard(patch) {
      this.state.card = { ...this.state.card, ...patch };
      await this._drawCard();
      await this._buildSlot("card");
      this._emit();
    }
    // -------------------------------------------------- Ảnh
    /** Chụp ảnh khung hình hiện tại (PNG dataURL) */
    screenshot() {
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL("image/png");
    }
    /** Ảnh chân dung chính diện (dùng cho thẻ sinh viên) */
    portrait(w = 300, h2 = 400) {
      const cam = new THREE6.PerspectiveCamera(22, w / h2, 0.05, 20);
      const headY = (0.965 + 0.572 + 0.11) * (this.state.body.height || 0.97);
      cam.position.set(0, headY + 0.02, 1.25);
      cam.lookAt(0, headY - 0.03, 0);
      const j = this.rig.joints;
      const saved2 = [j.head.rotation.y, j.head.rotation.x, j.torso.rotation.y];
      j.head.rotation.set(0, 0, 0);
      j.torso.rotation.y = 0;
      const size = new THREE6.Vector2();
      this.renderer.getSize(size);
      const pr = this.renderer.getPixelRatio();
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(w, h2, false);
      const out = makeCanvas(w, h2);
      const ctx = out.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, h2);
      g.addColorStop(0, "#dfe8f7");
      g.addColorStop(1, "#b9c9e6");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h2);
      this.renderer.render(this.scene, cam);
      ctx.drawImage(this.renderer.domElement, 0, 0, w, h2);
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(size.x, size.y, false);
      [j.head.rotation.y, j.head.rotation.x, j.torso.rotation.y] = saved2;
      return out;
    }
    dispose() {
      this.renderer.setAnimationLoop(null);
      this._ro.disconnect();
      this.controls.dispose();
      disposeTree(this.scene);
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  };

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/thumbs.js
  var THREE7 = __toESM(require_three());
  var VIEW = {
    hair: [0.5, 0.25, 1],
    top: [0.45, 0.15, 1],
    bottom: [0.45, 0.1, 1],
    footwear: [0.9, 0.7, 1],
    hat: [0.6, 0.45, 1],
    bag: [-0.75, 0.25, -1],
    card: [0.2, 0.05, 1],
    eyewear: [0.35, 0.1, 1],
    handheld: [-1, 0.25, 0.55]
  };
  var ThumbMaker = class {
    constructor(size = 160) {
      this.size = size;
      this.renderer = new THREE7.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(size, size, false);
      this.renderer.outputEncoding = THREE7.sRGBEncoding;
      this.renderer.toneMapping = THREE7.NoToneMapping;
      this.scene = new THREE7.Scene();
      this.scene.add(new THREE7.HemisphereLight("#ffffff", "#b5a990", 0.75));
      const d = new THREE7.DirectionalLight("#ffffff", 0.85);
      d.position.set(2, 3, 3);
      this.scene.add(d);
      const back = new THREE7.DirectionalLight("#ffffff", 0.4);
      back.position.set(-2, 2, -3);
      this.scene.add(back);
      this.camera = new THREE7.PerspectiveCamera(28, 1, 0.01, 20);
      this.cache = /* @__PURE__ */ new Map();
      this.queue = Promise.resolve();
    }
    _mannequin(body) {
      if (this.rig) {
        this.scene.remove(this.rig.root);
      }
      this.rig = buildRig(body);
      this.rig.root.traverse((o) => {
        if (o.isMesh) o.visible = false;
      });
      this.scene.add(this.rig.root);
    }
    /** Trả về dataURL (xếp hàng để không chạy đồng thời) */
    make(item, ctx) {
      const key = item.id + "|" + JSON.stringify([item.colors, item.textures, item.emblem, ctx.emblemKey]);
      if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
      const job = this.queue.then(() => this._make(item, ctx, key)).catch((e) => {
        console.warn(e);
        return null;
      });
      this.queue = job;
      return job;
    }
    async _make(item, ctx, key) {
      await new Promise((r2) => setTimeout(r2, 16));
      if (!this.rig || this.rig.model.name !== (ctx.body.build || "vua")) this._mannequin(ctx.body);
      const imgs = await loadImageSet(item.textures);
      const res = BUILDERS[item.slot]({ item, rig: this.rig, imgs, emblemCanvas: ctx.emblemCanvas, cardCanvas: ctx.cardCanvas, emblem: ctx.emblem });
      res.parts = mountParts(this.rig, res.parts);
      for (const p of res.parts) linearize(p.obj);
      for (const p of res.parts) if (p.obj.userData.belt) p.obj.visible = false;
      this.rig.root.updateMatrixWorld(true);
      const box = new THREE7.Box3();
      for (const p of res.parts) box.expandByObject(p.obj);
      if (item.slot === "footwear") {
        box.makeEmpty();
        box.expandByObject(res.parts[0].obj);
      }
      const center = box.getCenter(new THREE7.Vector3());
      const size = box.getSize(new THREE7.Vector3());
      const r = Math.max(size.x, size.y, size.z) * 0.5;
      const dir = new THREE7.Vector3(...VIEW[item.slot] || [0.5, 0.3, 1]).normalize();
      const dist = r / Math.sin(THREE7.MathUtils.degToRad(this.camera.fov / 2)) * 1.12;
      this.camera.position.copy(center).addScaledVector(dir, dist);
      this.camera.lookAt(center);
      this.renderer.setClearColor(0, 0);
      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL("image/png");
      for (const p of res.parts) {
        p.obj.parent.remove(p.obj);
        p.obj.traverse((o) => {
          var _a;
          if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
          if (o.material) {
            (_a = o.material.map) == null ? void 0 : _a.dispose();
            o.material.dispose();
          }
        });
      }
      this.cache.set(key, url);
      return url;
    }
  };

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/data/catalog.js
  var RED = "#b3141d";
  var WINE = "#7a1c26";
  var CREAM = "#f6e7c8";
  var NAVY = "#1f2a44";
  var SLOTS = [
    { id: "hair", label: "Tóc", allowNone: true },
    { id: "top", label: "Áo", allowNone: false },
    { id: "bottom", label: "Quần · váy", allowNone: false },
    { id: "footwear", label: "Giày dép", allowNone: true },
    { id: "card", label: "Thẻ SV", allowNone: true },
    { id: "hat", label: "Mũ", allowNone: true },
    { id: "bag", label: "Balo · cặp", allowNone: true },
    { id: "eyewear", label: "Kính", allowNone: true },
    { id: "mask", label: "Khẩu trang", allowNone: true },
    { id: "audio", label: "Tai nghe", allowNone: true },
    { id: "handheld", label: "Đồ cầm tay", allowNone: true }
  ];
  var HAIR_COLORS = ["#1c1714", "#3b2a20", "#5a3a26", "#8a5a36", "#b98a52", "#6d6d72", "#7b2f3a", "#2f3f6b"];
  var SCHOOL_TOPS = [RED, WINE, "#f4f2ee", NAVY, "#a9abb0"];
  var ITEMS = [
    // ---------------------------------------------------------------- TÓC
    { id: "toc-ngan", slot: "hair", name: "Tóc ngắn", colors: { main: "#1c1714" }, palette: HAIR_COLORS, options: { style: "ngan" } },
    { id: "toc-mai-lech", slot: "hair", name: "Mái lệch", colors: { main: "#2b201a" }, palette: HAIR_COLORS, options: { style: "mai-lech" } },
    { id: "toc-cua", slot: "hair", name: "Đầu cua", colors: { main: "#1c1714" }, palette: HAIR_COLORS, options: { style: "cua" } },
    { id: "toc-bob", slot: "hair", name: "Tóc bob", colors: { main: "#3b2a20" }, palette: HAIR_COLORS, options: { style: "bob" } },
    { id: "toc-dai", slot: "hair", name: "Tóc dài", colors: { main: "#1c1714" }, palette: HAIR_COLORS, options: { style: "dai" } },
    { id: "toc-buoc", slot: "hair", name: "Buộc đuôi ngựa", colors: { main: "#2b201a", accent: "#d24b6a" }, palette: HAIR_COLORS, options: { style: "buoc" } },
    { id: "toc-bui", slot: "hair", name: "Búi cao", colors: { main: "#3b2a20" }, palette: HAIR_COLORS, options: { style: "bui" } },
    // ---------------------------------------------------------------- ÁO — phong cách áo trường (data của bạn)
    {
      id: "ao-polo-truong",
      slot: "top",
      group: "truong",
      name: "Polo lớp viền trắng",
      colors: { main: RED, accent: RED, trim: "#ffffff", print: "#ffffff" },
      palette: SCHOOL_TOPS,
      textures: { front: null, back: null, pattern: null },
      accepts: ["front", "back", "pattern"],
      options: { sleeve: "short", collar: "polo", placket: [0, 0.26], piping: true, wordmark: "chest-left", sleeveEmblem: true }
    },
    {
      id: "ao-thun-truong",
      slot: "top",
      group: "truong",
      name: "Áo thun thể thao lớp",
      colors: { main: RED, trim: "#ffffff", print: "#ffffff" },
      palette: SCHOOL_TOPS,
      textures: { front: null, back: null },
      accepts: ["front", "back"],
      options: { sleeve: "short", collar: "crew", sidePiping: true, wordmark: "chest-left", sleeveEmblem: true }
    },
    {
      id: "ao-khoac-gio",
      slot: "top",
      group: "truong",
      name: "Áo khoác gió có mũ",
      colors: { main: RED, trim: "#ffffff", print: "#ffffff", zipper: WINE },
      palette: SCHOOL_TOPS,
      textures: { front: null, back: null },
      accepts: ["front", "back"],
      options: { sleeve: "long", collar: "hood", zipper: true, piping: true, weltPockets: true, hemBand: true, cuffs: true, wordmark: "chest-left", sleeveEmblem: true }
    },
    {
      id: "ao-khoac-the-thao",
      slot: "top",
      group: "truong",
      name: "Áo khoác thể thao",
      colors: { main: "#c8231f", accent: "#c8231f", trim: "#ffffff", print: "#fff4ea", zipper: "#ffffff" },
      palette: ["#c8231f", "#d9481f", NAVY, "#1f5c46"],
      textures: { front: null, back: null },
      accepts: ["front", "back"],
      // 2 sọc tay (không dùng 3 sọc — đó là nhãn hiệu thể thao đã đăng ký)
      options: { sleeve: "long", collar: "stand", zipper: true, sleeveStripes: 2, cuffs: true, hemBand: true, arch: true }
    },
    {
      id: "ao-so-mi-xanh",
      slot: "top",
      group: "truong",
      name: "Sơ mi xanh nhạt",
      colors: { main: "#cfe0f2", accent: "#b8cde6" },
      palette: ["#cfe0f2", "#f4f7fb", "#fdf1f3", "#e9f1e4"],
      textures: { front: null, back: null, pattern: null },
      accepts: ["front", "back", "pattern"],
      emblem: "chest-left",
      options: { sleeve: "long", collar: "shirt", placket: [0, 1], pocket: true, tucked: true, cuffs: true }
    },
    {
      id: "ao-ni-truong",
      slot: "top",
      group: "truong",
      name: "Áo nỉ không mũ",
      colors: { main: NAVY, print: "#ffffff" },
      palette: [NAVY, "#f3f1ec", RED, "#a9abb0"],
      textures: { front: null, back: null },
      accepts: ["front", "back"],
      options: { sleeve: "long", collar: "crew", cuffs: true, hemBand: true, wordmark: "chest-big", sleeveEmblem: true }
    },
    {
      id: "ao-hoodie-truong",
      slot: "top",
      group: "truong",
      name: "Hoodie lớp",
      colors: { main: RED, print: "#ffffff" },
      palette: [RED, "#a9abb0", NAVY, "#f3f1ec"],
      textures: { front: null, back: null },
      accepts: ["front", "back"],
      options: { sleeve: "long", collar: "hood", kangaroo: true, cuffs: true, hemBand: true, wordmark: "chest-big", sleeveEmblem: true }
    },
    // ---------------------------------------------------------------- ÁO — thông dụng
    { id: "ao-raglan-co-tim", slot: "top", name: "Áo raglan cổ tim", colors: { main: "#e7e9ee", accent: "#2f7be0", trim: "#ffffff" }, palette: ["#e7e9ee", "#ffffff", "#f2efe6"], accepts: ["front"], textures: {}, options: { sleeve: "short", collar: "crew", collarAccent: true, accentSleeves: true, vneck: true } },
    { id: "ao-thun", slot: "top", name: "Áo thun trơn", colors: { main: "#f2efe8" }, palette: ["#f2efe8", "#1f1f22", "#e65a4f", "#3d7bd9", "#f2c94c", "#7bc4a4"], textures: {}, accepts: ["front", "back"], options: { sleeve: "short", collar: "crew" } },
    { id: "ao-ke-ngang", slot: "top", name: "Áo thun kẻ ngang", colors: { main: "#f4f1ea", accent: "#24324f" }, palette: ["#f4f1ea", "#fff7e0"], options: { sleeve: "long", collar: "crew", breton: "#24324f" } },
    { id: "ao-so-mi-caro", slot: "top", name: "Sơ mi caro", colors: { main: "#b8423a" }, palette: ["#b8423a", "#3a5f8a", "#4d6b3c", "#6b6f78"], options: { sleeve: "long", collar: "shirt", placket: [0, 1], pocket: true, cuffs: true, plaid: ["#22324d", "#f1e4c9"] } },
    { id: "ao-the-thao", slot: "top", name: "Áo thể thao sọc", colors: { main: "#2e6fd6", accent: "#ffffff" }, palette: ["#2e6fd6", "#d63a3a", "#1aa36f", "#ff8a1f", "#222"], accepts: ["front", "back"], textures: {}, options: { sleeve: "short", collar: "crew", collarAccent: true, stripes: [[0.62, 0.66], [0.69, 0.71]] } },
    { id: "ao-hoodie", slot: "top", name: "Hoodie trơn", colors: { main: "#8a95a8" }, palette: ["#8a95a8", "#2a2d34", "#e8e2d6", "#b45f4a", "#4f6b52"], accepts: ["front", "back"], textures: {}, options: { sleeve: "long", collar: "hood", kangaroo: true, cuffs: true, hemBand: true } },
    { id: "ao-ba-lo", slot: "top", name: "Áo ba lỗ", colors: { main: "#f2efe8" }, palette: ["#f2efe8", "#1f1f22", "#5c7da8"], options: { sleeve: "none", collar: "crew" } },
    // ---------------------------------------------------------------- QUẦN · VÁY
    { id: "quan-au", slot: "bottom", group: "truong", name: "Quần âu", colors: { main: "#23252d" }, palette: ["#23252d", "#1f2c4a", "#8f9196", "#4a3a2c"], options: { fit: "regular" } },
    { id: "vay-xep-ly", slot: "bottom", group: "truong", name: "Chân váy xếp ly", colors: { main: "#b5b6ba" }, palette: ["#b5b6ba", "#23252d", "#1f2c4a", WINE], accepts: ["pattern"], textures: {}, options: { skirt: true, skirtLen: 0.36 } },
    { id: "vay-chu-a", slot: "bottom", name: "Chân váy chữ A", colors: { main: "#1e1e22" }, palette: ["#1e1e22", "#c4ae86", "#6f8db5", "#7a2238"], options: { skirt: true, skirtLen: 0.34, pleats: false } },
    { id: "quan-jean", slot: "bottom", name: "Quần jean", colors: { main: "#3d5a86" }, palette: ["#3d5a86", "#26344d", "#6f8db5", "#2a2a2a"], options: { denim: true, fit: "slim", rolled: true } },
    { id: "quan-kaki", slot: "bottom", name: "Quần kaki", colors: { main: "#c4ae86" }, palette: ["#c4ae86", "#7d7357", "#e8dfcc", "#566048"], options: { fit: "regular" } },
    { id: "quan-the-thao", slot: "bottom", name: "Quần jogger", colors: { main: NAVY, accent: "#f2f2f2" }, palette: [NAVY, "#2b2e36", "#7a7f8a"], options: { fit: "regular", cuff: true, sideStripe: true } },
    { id: "quan-tui-hop", slot: "bottom", name: "Quần túi hộp", colors: { main: "#2a2b2f" }, palette: ["#2a2b2f", "#5d6247", "#a39272"], options: { fit: "regular", cargo: true, cuff: true } },
    { id: "quan-ong-rong", slot: "bottom", name: "Quần ống rộng", colors: { main: "#d9cdb8" }, palette: ["#d9cdb8", "#1e1e22", "#8f9196", "#6f8db5"], options: { fit: "wide" } },
    { id: "quan-short", slot: "bottom", name: "Quần short", colors: { main: "#5c6b7d" }, palette: ["#5c6b7d", "#c4ae86", "#2a2a2a", "#3d5a86"], options: { length: "shorts", fit: "wide" } },
    { id: "quan-short-the-thao", slot: "bottom", name: "Short thể thao", colors: { main: NAVY, accent: "#ffffff" }, palette: [NAVY, RED, "#2a2a2a"], options: { length: "shorts", fit: "wide", sideStripe: true } },
    // ---------------------------------------------------------------- GIÀY DÉP
    {
      id: "dep-to-ong",
      slot: "footwear",
      group: "truong",
      name: "Dép tổ ong",
      colors: { main: "#efe4b8" },
      palette: ["#efe4b8", "#f6f1e1", "#9fd0ea", "#f0b8c8", "#b9dcb0", "#3c4655"],
      textures: { upper: null },
      accepts: ["upper"],
      options: { type: "to-ong" }
    },
    {
      id: "dep-to-ong-quai-hau",
      slot: "footwear",
      group: "truong",
      name: "Dép tổ ong quai hậu",
      colors: { main: "#8cc9ea" },
      palette: ["#8cc9ea", "#efe4b8", "#f6f1e1", "#f0b8c8", "#3c4655"],
      textures: { upper: null },
      accepts: ["upper"],
      options: { type: "to-ong", strap: true }
    },
    { id: "giay-sneaker", slot: "footwear", name: "Sneaker trắng", colors: { main: "#f4f4f1", accent: RED }, palette: ["#f4f4f1", "#202125", "#d9dfe9", "#efe3cf"], options: { type: "sneaker" } },
    { id: "giay-bata", slot: "footwear", name: "Giày vải bata", colors: { main: "#4f6b45", accent: "#c0392b" }, palette: ["#4f6b45", "#f2efe6", "#2b4f8c", "#1f1f22"], options: { type: "bata" } },
    { id: "giay-chay", slot: "footwear", name: "Giày chạy bộ", colors: { main: "#3a4150", accent: "#ff7a3d" }, palette: ["#3a4150", "#e8eaee", "#1e5bd8", "#2b8a5e"], options: { type: "runner" } },
    { id: "giay-luoi", slot: "footwear", name: "Giày lười da", colors: { main: "#5a3423" }, palette: ["#5a3423", "#1e1a18", "#8a5a3a"], options: { type: "loafer" } },
    { id: "giay-bot", slot: "footwear", name: "Bốt cổ cao", colors: { main: "#4a3021" }, palette: ["#4a3021", "#1e1a18", "#8a6a48"], options: { type: "boot" } },
    { id: "dep-quai-hau", slot: "footwear", name: "Sandal quai hậu", colors: { main: "#2f2f33", accent: "#3a3a3e" }, palette: ["#2f2f33", "#6b4a33", "#3c5a7a"], options: { type: "quai-hau" } },
    { id: "dep-le", slot: "footwear", name: "Dép lê", colors: { main: "#e6e2da", accent: "#4a4f5a" }, palette: ["#e6e2da", "#202125", "#6d8fc7", "#e66a5b"], textures: { upper: null }, accepts: ["upper"], options: { type: "le" } },
    { id: "dep-tong", slot: "footwear", name: "Dép tông", colors: { main: "#2f6fd6", accent: "#f2efe6" }, palette: ["#2f6fd6", "#e14b4b", "#1f1f22", "#f2c94c"], options: { type: "tong" } },
    // ---------------------------------------------------------------- THẺ SINH VIÊN
    { id: "the-sv-day-deo", slot: "card", group: "truong", name: "Dây đeo + vỏ silicone", colors: { main: RED, accent: RED, text: "#ffffff" }, palette: [RED, WINE, NAVY, "#1aa36f", "#202125"], options: { type: "day-deo" } },
    { id: "the-sv-kep-ao", slot: "card", group: "truong", name: "Thẻ kẹp ngực", colors: { main: RED }, options: { type: "kep-ao" } },
    // ---------------------------------------------------------------- MŨ
    { id: "mu-luoi-trai", slot: "hat", group: "truong", name: "Mũ lưỡi trai lớp", colors: { main: RED, accent: WINE }, palette: [RED, "#f2efe8", "#202125", NAVY], emblem: "front", textures: { front: null }, accepts: ["front"], options: { type: "luoi-trai" } },
    { id: "mu-trucker", slot: "hat", name: "Mũ trucker", colors: { main: "#1f1f22", accent: "#1f1f22", front: "#f6f6f3" }, palette: ["#1f1f22", NAVY, RED], options: { type: "luoi-trai" } },
    { id: "mu-bao-hiem", slot: "hat", name: "Mũ bảo hiểm", colors: { main: "#e9e6df", accent: "#3a3f4a" }, palette: ["#e9e6df", "#d23b3b", "#2a2d34", "#f2c94c", "#6fb2d9"], emblem: "side", options: { type: "bao-hiem" } },
    { id: "non-la", slot: "hat", name: "Nón lá", colors: { main: "#ead9a4", accent: "#c94a4a" }, palette: ["#ead9a4", "#e2cfa0", "#f0e3c2"], options: { type: "non-la" } },
    { id: "mu-bucket", slot: "hat", name: "Mũ bucket", colors: { main: "#cbbf9e", accent: "#3a3a3a" }, palette: ["#cbbf9e", "#2a2d34", "#8a9c7a", "#e8e2d6"], options: { type: "bucket" } },
    { id: "mu-len", slot: "hat", name: "Mũ len", colors: { main: "#c0463f", accent: "#f2efe8" }, palette: ["#c0463f", "#2a3b5c", "#e8c547", "#3d3d3d"], options: { type: "len" } },
    { id: "mu-tot-nghiep", slot: "hat", group: "truong", name: "Mũ tốt nghiệp", colors: { main: "#1d1b26", accent: "#e3a52a" }, palette: ["#1d1b26", "#1f2c4a"], options: { type: "tot-nghiep" } },
    // ---------------------------------------------------------------- BALO · CẶP · TÚI
    { id: "balo", slot: "bag", group: "truong", name: "Balo trường", colors: { main: "#2b2d33", accent: RED }, palette: ["#2b2d33", "#2f3a52", "#8a95a8", RED, "#3c6e5a"], emblem: "patch", textures: { front: null }, accepts: ["front"], options: { type: "balo" } },
    { id: "balo-laptop", slot: "bag", name: "Balo laptop", colors: { main: "#25272d", accent: "#3a3d45" }, palette: ["#25272d", "#5c6470", "#d9d4c8"], options: { type: "balo-laptop" } },
    { id: "cap-sach", slot: "bag", name: "Cặp sách đeo vai", colors: { main: "#6b4a33", accent: "#4e3524" }, palette: ["#6b4a33", "#1f1f22", NAVY, "#7a2238"], emblem: "front", textures: { front: null }, accepts: ["front"], options: { type: "cap-sach" } },
    { id: "tui-tote", slot: "bag", group: "truong", name: "Túi tote vải", colors: { main: "#efe6d2", accent: "#c9b893" }, palette: ["#efe6d2", "#2a2d34", "#d9e4ef", RED], emblem: "front", textures: { front: null }, accepts: ["front"], options: { type: "tote" } },
    { id: "tui-deo-cheo", slot: "bag", name: "Túi đeo chéo", colors: { main: "#3d4450", accent: "#202227" }, palette: ["#3d4450", "#7a5a3c", "#c0463f", "#e8e2d6"], options: { type: "deo-cheo" } },
    // ---------------------------------------------------------------- KÍNH
    { id: "kinh-vuong", slot: "eyewear", name: "Kính gọng vuông", colors: { main: "#1b1b1d" }, palette: ["#1b1b1d", "#6b4a33", "#3d5a86"], options: { type: "vuong" } },
    { id: "kinh-nua", slot: "eyewear", name: "Kính nửa gọng", colors: { main: "#b9bcc2", accent: "#1b1b1d" }, palette: ["#b9bcc2", "#b08d57"], options: { type: "nua" } },
    { id: "kinh-tron", slot: "eyewear", name: "Kính gọng tròn", colors: { main: "#b08d57" }, palette: ["#b08d57", "#202125", "#a8adb5"], options: { type: "tron" } },
    { id: "kinh-ram", slot: "eyewear", name: "Kính râm", colors: { main: "#202125", accent: "#1b1f2a" }, palette: ["#202125", "#b08d57"], options: { type: "ram" } },
    // ---------------------------------------------------------------- KHẨU TRANG
    { id: "khau-trang-y-te", slot: "mask", name: "Khẩu trang y tế", colors: { main: "#8ec5ea", accent: "#f4f6f8" }, palette: ["#8ec5ea", "#f4f6f8", "#2a2d34", "#f3b9c9", "#9fd8b5"], options: { type: "y-te" } },
    { id: "khau-trang-vai", slot: "mask", name: "Khẩu trang vải", colors: { main: "#25262b", accent: "#25262b" }, palette: ["#25262b", "#e9e4da", "#5c6b7d"], textures: { front: null }, accepts: ["front"], options: { type: "vai" } },
    // ---------------------------------------------------------------- TAI NGHE
    { id: "tai-nghe-chup", slot: "audio", name: "Tai nghe chụp tai", colors: { main: "#25262b", accent: "#3a3b42" }, palette: ["#25262b", "#efece6", "#9db4cf", "#e3b7c4"], options: { type: "chup-tai" } },
    { id: "tai-nghe-deo-co", slot: "audio", name: "Tai nghe đeo cổ", colors: { main: "#efece6", accent: "#c9c4ba" }, palette: ["#efece6", "#25262b", "#9db4cf"], options: { type: "deo-co" } },
    { id: "tai-nghe-nhet", slot: "audio", name: "Tai nghe nhét tai", colors: { main: "#f6f6f4" }, palette: ["#f6f6f4", "#25262b"], options: { type: "nhet-tai" } },
    // ---------------------------------------------------------------- ĐỒ CẦM TAY
    { id: "laptop", slot: "handheld", name: "Laptop", colors: { main: "#b9bec7" }, palette: ["#b9bec7", "#2a2d34", "#e8d9c4"], emblem: "sticker", options: { type: "laptop" } },
    { id: "sach", slot: "handheld", name: "Giáo trình", colors: { main: "#2d4f86", accent: "#e3a52a", second: "#c94a4a" }, palette: ["#2d4f86", RED, "#2e6b4f", "#4a3a6b"], options: { type: "sach" } },
    { id: "vo-but", slot: "handheld", name: "Vở ô ly + bút", colors: { main: "#4a7fd1", accent: "#e14b4b" }, palette: ["#4a7fd1", "#e8b93a", "#5bb07a", "#d8577a"], options: { type: "vo" } },
    { id: "but", slot: "handheld", name: "Bút bi", colors: { main: "#2c5fd1", accent: "#c8ccd2" }, palette: ["#2c5fd1", "#1f1f22", "#e14b4b"], options: { type: "but" } },
    { id: "hop-but", slot: "handheld", name: "Hộp bút vải", colors: { main: "#e9c46a", accent: "#2a2d34" }, palette: ["#e9c46a", "#9fc2e7", "#f2a6c4", "#2a2d34"], options: { type: "hop-but" } },
    { id: "binh-nuoc", slot: "handheld", name: "Bình giữ nhiệt", colors: { main: "#6fb7a6", accent: "#2a2d34" }, palette: ["#6fb7a6", "#e8e2d6", "#d96b5a", "#2a2d34"], options: { type: "binh-nuoc" } },
    { id: "dien-thoai", slot: "handheld", name: "Điện thoại", colors: { main: "#2a2d34" }, palette: ["#2a2d34", "#e8e2d6", "#9db4cf"], options: { type: "dien-thoai" } },
    { id: "o-du", slot: "handheld", name: "Ô gấp", colors: { main: "#2a3b5c", accent: "#6b4a33" }, palette: ["#2a3b5c", "#c0463f", "#3d3d3d", "#e8c547"], options: { type: "o" } },
    { id: "may-tinh", slot: "handheld", name: "Máy tính cầm tay", colors: { main: "#2b2f36", accent: "#e86a33" }, palette: ["#2b2f36", "#3a5b8c", "#e8e2d6"], options: { type: "may-tinh" } },
    { id: "ong-ban-ve", slot: "handheld", name: "Ống đựng bản vẽ", colors: { main: "#3a3f4a", accent: "#e8b93a" }, palette: ["#3a3f4a", "#1f3b6e", "#c0463f"], options: { type: "ong-ban-ve" } }
  ];
  var DEFAULTS = {
    body: { skin: "#e2b08c", build: "vua", height: 0.97 },
    equipped: {
      hair: "toc-ngan",
      top: "ao-polo-truong",
      bottom: "quan-au",
      footwear: "dep-to-ong",
      card: "the-sv-day-deo",
      hat: null,
      bag: "balo",
      eyewear: null,
      mask: null,
      audio: null,
      handheld: null
    },
    // Thương hiệu TỰ TẠO — thay cho logo, chữ "HUST" và con dấu thật của trường
    emblem: {
      name: "Trường Đại học Kỹ thuật Tổ Ong",
      short: "KTO",
      wordmark: "TỔ ONG",
      year: "2026",
      shape: "khien",
      motif: "banh-rang",
      main: RED,
      accent: CREAM
    },
    // Thẻ SV mẫu — toàn bộ là dữ liệu giả
    card: {
      school: "Trường Đại học Kỹ thuật Tổ Ong",
      title: "THẺ SINH VIÊN",
      name: "Nguyễn Minh An",
      id: "26A0001",
      major: "Kỹ thuật phần mềm",
      cohort: "K71 · 2026–2030",
      photo: null,
      // dataURL hoặc đường dẫn ảnh
      template: null,
      // 'assets/textures/the-sv-nen.png' — ảnh nền thẻ của bạn (1024×646)
      drawHeader: true
    }
  };
  var SKIN_TONES = ["#f3d2b8", "#e8bf9e", "#e2b08c", "#c98e66", "#a86f4c", "#7a4e34"];
  var CATALOG = { slots: SLOTS, items: ITEMS, defaults: DEFAULTS, skinTones: SKIN_TONES };
  var catalog_default = CATALOG;

  // ../../../../../../home/claude/phong-on-thi-ao/avatar/src/js/main.js
  var STORE_KEY = "avatar-studio:v1";
  var $ = (s, el = document) => el.querySelector(s);
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  }
  function loadSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }
  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_) {
      try {
        const lite = JSON.parse(JSON.stringify(state));
        for (const ov of Object.values(lite.overrides || {})) if (ov.textures) {
          for (const k in ov.textures) if (String(ov.textures[k]).startsWith("data:")) ov.textures[k] = null;
        }
        if (lite.card) {
          if (String(lite.card.photo).startsWith("data:")) lite.card.photo = null;
          if (String(lite.card.template).startsWith("data:")) lite.card.template = null;
        }
        localStorage.setItem(STORE_KEY, JSON.stringify(lite));
      } catch (__) {
      }
    }
  }
  function readFile(file, maxSide = 1024) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, maxSide / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  var TEX_LABEL = {
    front: "Hình in mặt trước",
    back: "Hình in sau lưng",
    pattern: "Hoa văn vải (lặp lại)",
    upper: "Ảnh phủ quai / mũ dép"
  };
  var EMBLEM_POS_LABEL = { "chest-left": "ngực trái", "chest-center": "giữa ngực", back: "sau lưng", front: "phía trước", patch: "miếng vá", side: "bên hông", sticker: "nhãn dán" };
  var SHAPES = [["khien", "Khiên"], ["tron", "Tròn"], ["luc-giac", "Lục giác"], ["co-hieu", "Cờ hiệu"]];
  var MOTIFS = [["sach", "Sách mở"], ["sao", "Ngôi sao"], ["banh-rang", "Bánh răng"], ["la", "Chiếc lá"], ["song", "Sóng"], ["to-ong", "Tổ ong"]];
  var BUILDS2 = [["thon", "Thon"], ["vua", "Vừa"], ["dam", "Đậm"]];
  var EMBED = new URLSearchParams(location.search).has("nhung") && window.parent !== window;
  function liteState(state) {
    const lite = JSON.parse(JSON.stringify(state));
    for (const ov of Object.values(lite.overrides || {})) if (ov.textures) {
      for (const k in ov.textures) if (String(ov.textures[k]).startsWith("data:")) ov.textures[k] = null;
    }
    if (lite.card) {
      lite.card.photo = null;
      lite.card.template = null;
    }
    return lite;
  }
  var saved = loadSaved();
  var stageEl = $("#stage3d");
  var studio = new AvatarStudio(stageEl, {
    catalog: catalog_default,
    state: saved || void 0,
    onChange: (s) => {
      save(s);
      updateLabel();
    }
  });
  var thumbs = new ThumbMaker(160);
  var TABS = [
    { id: "body", label: "Cơ thể" },
    ...catalog_default.slots.map((s) => ({ id: s.id, label: s.label, slot: s })),
    { id: "emblem", label: "Huy hiệu" }
  ];
  var current = "top";
  function renderTabs() {
    const nav = $("#tabs");
    nav.replaceChildren(...TABS.map((t) => h("button", {
      class: "tab",
      role: "tab",
      id: "tab-" + t.id,
      "aria-selected": String(t.id === current),
      "aria-controls": "tabpanel",
      onclick: () => {
        current = t.id;
        renderTabs();
        renderPanel();
        if (t.id === "card") studio.focus("card");
        if (t.id === "footwear") studio.focus("feet");
        if (["hair", "hat", "eyewear", "mask", "audio"].includes(t.id)) studio.focus("head");
      }
    }, t.label)));
    const active = $("#tab-" + current);
    active == null ? void 0 : active.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function thumbCtx() {
    var _a;
    const s = studio.state;
    return { body: s.body, emblemCanvas: studio.emblemCanvas, cardCanvas: studio.cardCanvas, emblem: s.emblem, emblemKey: JSON.stringify(s.emblem) + (((_a = s.card) == null ? void 0 : _a.name) || "") };
  }
  function renderPanel() {
    const body = $("#tabpanel");
    body.setAttribute("aria-labelledby", "tab-" + current);
    const tab = TABS.find((t) => t.id === current);
    if (current === "body") body.replaceChildren(bodyPanel());
    else if (current === "emblem") body.replaceChildren(emblemPanel());
    else body.replaceChildren(slotPanel(tab.slot));
  }
  function section(title, ...kids) {
    return h("section", { class: "sec" }, h("h3", { class: "sec-title" }, title), ...kids);
  }
  function swatches(colors, value, onPick, name) {
    const wrap2 = h("div", { class: "swatches", role: "radiogroup", "aria-label": name });
    for (const c of colors) {
      wrap2.append(h("button", {
        class: "sw",
        style: `--c:${c}`,
        role: "radio",
        "aria-checked": String(c.toLowerCase() === (value || "").toLowerCase()),
        "aria-label": c,
        title: c,
        onclick: () => onPick(c)
      }));
    }
    const id = "pick-" + name.replace(/\W+/g, "-");
    const input = h("input", { type: "color", id, value: value || "#ffffff", "aria-label": name + " — chọn màu khác" });
    input.addEventListener("input", () => onPick(input.value));
    wrap2.append(h("label", { class: "sw sw-custom", for: id, title: "Màu khác" }, input));
    return wrap2;
  }
  function segmented(options, value, onPick, label) {
    return h(
      "div",
      { class: "seg", role: "radiogroup", "aria-label": label },
      options.map(([v, l]) => h("button", { role: "radio", "aria-checked": String(v === value), onclick: () => onPick(v) }, l))
    );
  }
  function itemCard(item, equipped, onPick) {
    var _a;
    const img = h("img", { alt: "", width: 80, height: 80, loading: "lazy" });
    const fig = h("span", { class: "thumb", style: `--c:${((_a = item.colors) == null ? void 0 : _a.main) || "#ccc"}` }, img);
    const resolved = studio.resolveItem(item.id);
    thumbs.make(resolved, thumbCtx()).then((url) => {
      if (url) {
        img.src = url;
        fig.classList.add("ready");
      }
    });
    return h(
      "button",
      { class: "item", "aria-pressed": String(equipped), onclick: onPick },
      fig,
      h("span", { class: "item-name" }, item.name),
      item.group === "truong" ? h("span", { class: "tag" }, "Data trường") : null
    );
  }
  async function busy(fn) {
    const stage = document.querySelector(".stage");
    const t = setTimeout(() => stage.classList.add("busy"), 120);
    try {
      return await fn();
    } finally {
      clearTimeout(t);
      stage.classList.remove("busy");
    }
  }
  function slotPanel(slot) {
    const equippedId = studio.state.equipped[slot.id];
    const items = studio.itemsForSlot(slot.id);
    const grid = h("div", { class: "grid" });
    if (slot.allowNone) {
      grid.append(h(
        "button",
        { class: "item none", "aria-pressed": String(!equippedId), onclick: async () => {
          await busy(() => studio.equip(slot.id, null));
          renderPanel();
        } },
        h("span", { class: "thumb" }, h("span", { class: "none-mark", "aria-hidden": "true" }, "∅")),
        h("span", { class: "item-name" }, "Không dùng")
      ));
    }
    for (const it of items) {
      grid.append(itemCard(it, it.id === equippedId, async () => {
        await busy(() => studio.equip(slot.id, it.id));
        renderPanel();
      }));
    }
    const parts = [section(slot.label, grid)];
    const item = equippedId ? studio.resolveItem(equippedId) : null;
    if (item) parts.push(customizer(item));
    if (slot.id === "card") parts.push(cardEditor());
    return h("div", { class: "stack" }, parts);
  }
  function customizer(item) {
    const rows = [];
    const base = catalog_default.items.find((i) => i.id === item.id);
    rows.push(h(
      "div",
      { class: "field" },
      h("span", { class: "label" }, item.colors.accent ? "Màu chính" : "Màu"),
      swatches(base.palette || [base.colors.main], item.colors.main, async (c) => {
        await studio.setItemColor(item.id, "main", c);
        refreshThumbs();
      }, `Màu ${item.name}`)
    ));
    if (item.colors.accent) {
      const accents = [base.colors.accent, "#ffffff", "#202125", item.colors.main === "#ffffff" ? "#4b2e9a" : "#f0b53a"];
      rows.push(h(
        "div",
        { class: "field" },
        h("span", { class: "label" }, "Màu phối"),
        swatches([...new Set(accents)], item.colors.accent, async (c) => {
          await studio.setItemColor(item.id, "accent", c);
          refreshThumbs();
        }, `Màu phối ${item.name}`)
      ));
    }
    if (base.emblem) {
      const id = "emb-" + item.id;
      const cb = h("input", { type: "checkbox", id, checked: item.emblem ? true : null });
      cb.addEventListener("change", async () => {
        await studio.setItemEmblem(item.id, cb.checked ? base.emblem : null);
        refreshThumbs();
      });
      rows.push(h("label", { class: "check", for: id }, cb, h("span", {}, `In huy hiệu (${EMBLEM_POS_LABEL[base.emblem] || base.emblem})`)));
    }
    for (const key of base.accepts || []) rows.push(uploadRow(item, key));
    if (base.group === "truong" && (base.accepts || []).length) {
      rows.push(h("p", { class: "hint" }, "Ảnh bạn tải lên chỉ nằm trong trình duyệt này. Để cố định cho mọi người, đặt file vào ", h("code", {}, "assets/textures/"), " và khai báo trong ", h("code", {}, "data/catalog.js"), "."));
    }
    rows.push(h("button", { class: "btn ghost small", onclick: async () => {
      await studio.resetItem(item.id);
      renderPanel();
    } }, "Khôi phục mặc định"));
    return section("Tùy chỉnh · " + item.name, ...rows);
  }
  function uploadRow(item, key) {
    var _a;
    const id = `up-${item.id}-${key}`;
    const has = (_a = item.textures) == null ? void 0 : _a[key];
    const input = h("input", { type: "file", id, accept: "image/png,image/jpeg,image/webp", class: "sr-only" });
    input.addEventListener("change", async () => {
      var _a2;
      const f = (_a2 = input.files) == null ? void 0 : _a2[0];
      if (!f) return;
      const url = await readFile(f, key === "pattern" ? 512 : 1024);
      await studio.setItemTexture(item.id, key, url);
      renderPanel();
      refreshThumbs();
    });
    return h(
      "div",
      { class: "upload" },
      h("span", { class: "label" }, TEX_LABEL[key] || key),
      h(
        "div",
        { class: "upload-row" },
        has ? h("img", { class: "up-preview", src: has, alt: "" }) : h("span", { class: "up-empty" }, "Chưa có ảnh"),
        h("label", { class: "btn small", for: id }, has ? "Đổi ảnh" : "Tải ảnh lên"),
        input,
        has ? h("button", { class: "btn ghost small", onclick: async () => {
          await studio.setItemTexture(item.id, key, null);
          renderPanel();
          refreshThumbs();
        } }, "Gỡ") : null
      )
    );
  }
  function refreshThumbs() {
    if (!["body", "emblem"].includes(current)) renderPanel();
  }
  function bodyPanel() {
    const b = studio.state.body;
    const hid = "height-range";
    const range = h("input", { type: "range", id: hid, min: "0.9", max: "1.04", step: "0.01", value: String(b.height) });
    range.addEventListener("change", () => studio.setBody({ height: +range.value }));
    return h(
      "div",
      { class: "stack" },
      section("Màu da", swatches(catalog_default.skinTones, b.skin, async (c) => {
        await studio.setBody({ skin: c });
        renderPanel();
      }, "Màu da")),
      section("Dáng người", segmented(BUILDS2, b.build, async (v) => {
        await busy(() => studio.setBody({ build: v }));
        renderPanel();
      }, "Dáng người")),
      section("Chiều cao", h("div", { class: "field" }, h("label", { class: "label", for: hid }, "Tỉ lệ so với chuẩn"), range))
    );
  }
  function emblemPanel() {
    const e = studio.state.emblem;
    const preview = h("div", { class: "emblem-preview" });
    const paint = () => {
      const c = drawEmblem(studio.state.emblem, 320);
      c.setAttribute("role", "img");
      c.setAttribute("aria-label", "Xem trước huy hiệu");
      preview.replaceChildren(c);
    };
    paint();
    const update = async (patch) => {
      await studio.setEmblem(patch);
      paint();
      updateLabel();
    };
    const text = (id, label, key, attrs = {}) => {
      const input = h("input", { type: "text", id, value: e[key] || "", ...attrs });
      input.addEventListener("change", () => update({ [key]: input.value }));
      return h("div", { class: "field" }, h("label", { class: "label", for: id }, label), input);
    };
    return h(
      "div",
      { class: "stack" },
      section(
        "Huy hiệu tự tạo",
        h(
          "div",
          { class: "emblem-wrap" },
          preview,
          h(
            "div",
            { class: "stack tight" },
            text("em-name", "Tên trường (hư cấu hoặc đã được phép)", "name"),
            text("em-short", "Chữ viết tắt trên huy hiệu (tối đa 4)", "short", { maxlength: "4" }),
            text("em-word", "Chữ in trên áo và dây đeo", "wordmark", { maxlength: "14" }),
            text("em-year", "Năm thành lập", "year", { inputmode: "numeric", maxlength: "4" })
          )
        ),
        h("div", { class: "field" }, h("span", { class: "label" }, "Hình dạng"), segmented(SHAPES, e.shape, async (v) => {
          await update({ shape: v });
          renderPanel();
        }, "Hình dạng")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Biểu tượng"), segmented(MOTIFS, e.motif, async (v) => {
          await update({ motif: v });
          renderPanel();
        }, "Biểu tượng")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Màu nền"), swatches(["#b3141d", "#7a1c26", "#1f2a44", "#1d5c4a", "#4b2e9a", "#20242c"], e.main, async (c) => {
          await update({ main: c });
          renderPanel();
        }, "Màu nền huy hiệu")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Màu viền"), swatches(["#f6e7c8", "#ffffff", "#f0b53a", "#9fd3ff", "#1f2a44"], e.accent, async (c) => {
          await update({ accent: c });
          renderPanel();
        }, "Màu viền huy hiệu"))
      ),
      section(
        "Vì sao không dùng logo thật",
        h("p", { class: "note" }, "Logo chữ, con dấu, tên và mẫu thẻ của trường là tài sản được bảo hộ. Ở đây chỉ giữ những thứ chung ai cũng dùng được — màu đỏ, viền trắng, dáng áo khoác gió, dây đeo thẻ — còn chữ in, huy hiệu và hoa văn dây đeo đều được vẽ mới."),
        h("p", { class: "note" }, 'Nếu web của bạn là dự án chính thức của trường, cách chắc chắn nhất là xin phép dùng logo bằng văn bản rồi đặt ảnh logo vào ô "Hình in" của từng món.')
      )
    );
  }
  function cardEditor() {
    const c = studio.state.card;
    const preview = h("div", { class: "card-preview" });
    const paint = () => {
      const cnv = studio.cardCanvas;
      cnv.setAttribute("role", "img");
      cnv.setAttribute("aria-label", "Xem trước thẻ sinh viên mẫu");
      preview.replaceChildren(cnv);
    };
    paint();
    const update = async (patch) => {
      await studio.setCard(patch);
      paint();
      updateLabel();
    };
    const text = (id, label, key) => {
      const input = h("input", { type: "text", id, value: c[key] || "" });
      input.addEventListener("change", () => update({ [key]: input.value }));
      return h("div", { class: "field" }, h("label", { class: "label", for: id }, label), input);
    };
    const photoIn = h("input", { type: "file", id: "card-photo", accept: "image/*", class: "sr-only" });
    photoIn.addEventListener("change", async () => {
      var _a;
      const f = (_a = photoIn.files) == null ? void 0 : _a[0];
      if (f) await update({ photo: await readFile(f, 600) });
    });
    const tplIn = h("input", { type: "file", id: "card-tpl", accept: "image/*", class: "sr-only" });
    tplIn.addEventListener("change", async () => {
      var _a;
      const f = (_a = tplIn.files) == null ? void 0 : _a[0];
      if (f) await update({ template: await readFile(f, 1024) });
      renderPanel();
    });
    const headerId = "card-header";
    const headerCb = h("input", { type: "checkbox", id: headerId, checked: c.drawHeader !== false ? true : null });
    headerCb.addEventListener("change", () => update({ drawHeader: headerCb.checked }));
    return section(
      "Nội dung thẻ (dữ liệu mẫu)",
      preview,
      h(
        "div",
        { class: "two" },
        text("card-name", "Họ và tên", "name"),
        text("card-id", "MSSV", "id"),
        text("card-major", "Ngành", "major"),
        text("card-cohort", "Khóa", "cohort")
      ),
      text("card-school", "Tên trường trên thẻ", "school"),
      h(
        "div",
        { class: "btn-row" },
        h("button", { class: "btn small", onclick: () => update({ photo: studio.portrait(300, 400).toDataURL("image/png") }) }, "Chụp chân dung từ avatar"),
        h("label", { class: "btn ghost small", for: "card-photo" }, "Tải ảnh thẻ"),
        photoIn,
        c.photo ? h("button", { class: "btn ghost small", onclick: () => update({ photo: null }) }, "Gỡ ảnh") : null
      ),
      h(
        "div",
        { class: "upload" },
        h("span", { class: "label" }, "Ảnh nền thẻ (1024 × 646)"),
        h(
          "div",
          { class: "upload-row" },
          h("label", { class: "btn small", for: "card-tpl" }, c.template ? "Đổi nền" : "Tải nền thẻ"),
          tplIn,
          c.template ? h("button", { class: "btn ghost small", onclick: async () => {
            await update({ template: null });
            renderPanel();
          } }, "Gỡ nền") : null
        )
      ),
      h("label", { class: "check", for: headerId }, headerCb, h("span", {}, "Vẽ dải tên trường + huy hiệu ở đầu thẻ")),
      h("p", { class: "hint" }, 'Dấu "MẪU" luôn được in lên thẻ để không ai nhầm với thẻ thật. Không dùng MSSV, ảnh hay mã vạch của sinh viên thật.')
    );
  }
  function updateLabel() {
    var _a, _b, _c;
    const s = studio.state;
    $("#lbl-name").textContent = ((_a = s.card) == null ? void 0 : _a.name) || "";
    $("#lbl-class").textContent = ((_b = s.card) == null ? void 0 : _b.major) || "";
    $("#lbl-school").textContent = ((_c = s.emblem) == null ? void 0 : _c.name) || "";
  }
  function randomize() {
    var _a;
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const st = studio.getState();
    for (const slot of catalog_default.slots) {
      const items = studio.itemsForSlot(slot.id);
      const optional = ["hat", "eyewear", "handheld", "mask", "audio"].includes(slot.id);
      st.equipped[slot.id] = optional && Math.random() < 0.45 ? null : pick(items).id;
      const it = items.find((i) => i.id === st.equipped[slot.id]);
      if (it == null ? void 0 : it.palette) st.overrides[it.id] = { ...st.overrides[it.id] || {}, colors: { ...((_a = st.overrides[it.id]) == null ? void 0 : _a.colors) || {}, main: pick(it.palette) } };
    }
    st.body.skin = pick(catalog_default.skinTones);
    busy(() => studio.setState(st)).then(renderPanel);
  }
  function openModal(title, content) {
    const dlg = $("#modal");
    $("#modal-title").textContent = title;
    $("#modal-body").replaceChildren(content);
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  function shotDialog() {
    const url = studio.screenshot();
    openModal("Ảnh chụp nhân vật", h(
      "div",
      { class: "stack" },
      h("img", { src: url, alt: "Ảnh chụp nhân vật hiện tại", class: "shot" }),
      h("p", { class: "hint" }, "Nhấn giữ (điện thoại) hoặc chuột phải → Lưu ảnh.")
    ));
  }
  function exportDialog() {
    const ta = h("textarea", { id: "json-io", rows: "12", spellcheck: "false" });
    ta.value = JSON.stringify(studio.getState(), null, 2);
    const status = h("p", { class: "hint", "aria-live": "polite" });
    openModal("Cấu hình nhân vật (JSON)", h(
      "div",
      { class: "stack" },
      h("p", { class: "hint" }, "Gửi chuỗi này lên server của bạn để lưu tủ đồ cho từng người dùng. Dán chuỗi khác vào rồi bấm Áp dụng để nạp lại."),
      ta,
      h(
        "div",
        { class: "btn-row" },
        h("button", { class: "btn small", onclick: () => {
          var _a;
          (_a = navigator.clipboard) == null ? void 0 : _a.writeText(ta.value).then(() => {
            status.textContent = "Đã sao chép.";
          }, () => {
            ta.select();
            status.textContent = "Hãy nhấn Ctrl+C để sao chép.";
          });
        } }, "Sao chép"),
        h("button", { class: "btn ghost small", onclick: async () => {
          try {
            await studio.setState(JSON.parse(ta.value));
            renderPanel();
            status.textContent = "Đã áp dụng cấu hình.";
          } catch (err) {
            status.textContent = "JSON không hợp lệ: " + err.message;
          }
        } }, "Áp dụng")
      ),
      status
    ));
  }
  if (EMBED) {
    const acts = $(".actions");
    acts.prepend(h("button", { class: "btn ghost", type: "button", onclick: () => window.parent.postMessage({ type: "pota-avatar-cancel" }, location.origin) }, "Huỷ"));
    acts.append(h("button", { class: "btn", type: "button", id: "btn-wear", onclick: () => {
      save(studio.getState());
      window.parent.postMessage({ type: "pota-avatar", state: liteState(studio.getState()) }, location.origin);
    } }, "✓ Mặc vào phòng"));
    $("#btn-export").classList.add("ghost");
  }
  $("#btn-random").addEventListener("click", randomize);
  $("#btn-shot").addEventListener("click", shotDialog);
  $("#btn-export").addEventListener("click", exportDialog);
  $("#btn-spin").addEventListener("click", (e) => {
    const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", String(on));
    studio.setAutoRotate(on);
  });
  $("#modal-close").addEventListener("click", () => {
    var _a, _b, _c;
    return (_c = (_b = (_a = $("#modal")).close) == null ? void 0 : _b.call(_a)) != null ? _c : $("#modal").removeAttribute("open");
  });
  for (const b of document.querySelectorAll("[data-focus]")) b.addEventListener("click", () => studio.focus(b.dataset.focus));
  studio.ready.then(() => {
    document.body.classList.add("loaded");
    renderTabs();
    renderPanel();
    updateLabel();
  }).catch((err) => {
    console.error(err);
    $("#stage-error").hidden = false;
  });
  window.avatarStudio = studio;
})();
