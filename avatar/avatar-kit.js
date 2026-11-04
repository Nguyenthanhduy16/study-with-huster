/* Tự sinh bởi tools/build_avatar.mjs — đừng sửa tay, sửa trong avatar/src rồi đóng gói lại */
(function(T){ if (T && !T.CapsuleGeometry) { T.CapsuleGeometry = class CapsuleGeometry extends T.LatheGeometry {
  constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
    const p = new T.Path(); p.absarc(0, -length / 2, radius, Math.PI * 1.5, 0); p.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
    super(p.getPoints(capSegments), radialSegments); this.type = 'CapsuleGeometry';
  } }; } })(window.THREE);
var AvatarKit = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // three-global:three
  var require_three = __commonJS({
    "three-global:three"(exports, module) {
      module.exports = window.THREE;
    }
  });

  // three-global:three/addons/geometries/RoundedBoxGeometry.js
  var require_RoundedBoxGeometry = __commonJS({
    "three-global:three/addons/geometries/RoundedBoxGeometry.js"(exports, module) {
      module.exports = { RoundedBoxGeometry: window.THREE.RoundedBoxGeometry };
    }
  });

  // avatar/src/kit.js
  var kit_exports = {};
  __export(kit_exports, {
    BUILDERS: () => BUILDERS2,
    CATALOG: () => catalog_default,
    DIM: () => DIM,
    SLOT_ORDER: () => SLOT_ORDER,
    buildRig: () => buildRig,
    cachedImage: () => cachedImage,
    drawEmblem: () => drawEmblem2,
    drawStudentCard: () => drawStudentCard2,
    isReady: () => isReady,
    linearize: () => linearize,
    loadImage: () => loadImage,
    loadImageSet: () => loadImageSet,
    mountParts: () => mountParts,
    normEmblem: () => normEmblem,
    normalizeState: () => normalizeState,
    ready: () => ready
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

  // avatar/src/js/items/clothing.js
  var THREE4 = __toESM(require_three());

  // avatar/src/js/textures.js
  var THREE3 = __toESM(require_three());
  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
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
  var resolvedImages = /* @__PURE__ */ new Map();
  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve) => {
      const img = new Image();
      if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
      img.onload = () => {
        resolvedImages.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn("[avatar-studio] Không tải được ảnh:", src);
        resolve(null);
      };
      img.src = src;
    });
    imageCache.set(src, p);
    return p;
  }
  function cachedImage(src) {
    return src && resolvedImages.get(src) || null;
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
  function drawWeave(ctx, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "#fff";
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
    ctx.globalAlpha = 1;
  }
  function drawPattern(ctx, w, h, img, scale = 0.25) {
    const tw = Math.max(16, img.width * scale), th = Math.max(16, img.height * scale);
    for (let y = 0; y < h; y += th) for (let x = 0; x < w; x += tw) ctx.drawImage(img, x, y, tw, th);
  }
  function drawContain(ctx, img, cx, top, maxW, maxH) {
    const r = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * r, h = img.height * r;
    ctx.drawImage(img, cx - w / 2, top, w, h);
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
    if (opts.shoulderPiping) {
      ctx.fillStyle = trim;
      for (const u of [0.5, 0, 1]) ctx.fillRect(W * u - 3, 0, 6, H * 0.17);
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
      ctx.fillStyle = isDark(color) ? shade(color, 0.14) : "#9aa0a8";
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
      drawWordmark(ctx, opts.wordmarkText, big ? W * 0.25 : W * 0.25 + 88, big ? H * 0.3 : H * 0.17, big ? W * 0.3 : 84, big ? 92 : 24, opts.printColor || "#ffffff");
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
  function ribbonTexture(text, bg, fg, { logo = null, wordmark = "HUST" } = {}) {
    const W = 2048, H = 128;
    const cnv = makeCanvas(W, H), ctx = cnv.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = "#fff";
    for (let y = 1; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.textBaseline = "middle";
    const school = (text || "ĐẠI HỌC BÁCH KHOA HÀ NỘI").toUpperCase();
    for (const x of [290, 985]) {
      if (logo) ctx.drawImage(logo, x, 27, 74, 74);
      ctx.font = '800 30px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText(school, x + 87, 29, 520);
      ctx.font = '600 16px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("HANOI UNIVERSITY OF SCIENCE AND TECHNOLOGY", x + 87, 58, 520);
      drawWordmark(ctx, wordmark || "HUST", x + 225, 72, 280, 47, fg);
    }
    ctx.fillStyle = fg;
    for (const x of [18, 91, 164, 1788, 1861, 1934]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 76, H / 2);
      ctx.lineTo(x + 32, H);
      ctx.lineTo(x, H);
      ctx.lineTo(x + 44, H / 2);
      ctx.closePath();
      ctx.fill();
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
    const e = { shape: "tron", motif: "banh-rang", main: "#b3141d", accent: "#ffffff", short: "HUST", year: "1956", ...emblem };
    const cnv = makeCanvas(size, size);
    const ctx = cnv.getContext("2d");
    const logo = e.logo && resolvedImages.get(e.logo);
    if (logo) {
      const [sx, sy, sw, sh] = e.logoCrop || [0, 0, logo.width, logo.height];
      const scale = size * 0.94 / Math.max(sw, sh);
      const w = sw * scale, h = sh * scale;
      if (e.logoClip === "circle") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.drawImage(logo, sx, sy, sw, sh, (size - w) / 2, (size - h) / 2, w, h);
      return cnv;
    }
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
    let h = 2166136261;
    for (const ch of s) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function drawPortraitStudentCard(card, emblemCanvas) {
    const W = 646, H = 1024, canvas = makeCanvas(W, H), ctx = canvas.getContext("2d");
    const font = (weight, size) => `${weight} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 16);
    ctx.clip();
    ctx.fillStyle = "#fafaf7";
    ctx.fillRect(0, 0, W, H);
    if (card.template) ctx.drawImage(card.template, 0, 0, W, H);
    if (card.drawHeader !== false) {
      if (emblemCanvas) ctx.drawImage(emblemCanvas, 24, 16, 91, 91);
      ctx.textAlign = "left";
      ctx.fillStyle = "#b51d2b";
      ctx.font = font(800, 24);
      ctx.fillText((card.school || "Đại học Bách khoa Hà Nội").toUpperCase(), 123, 46, 493);
      ctx.fillStyle = "#777b80";
      ctx.font = font(500, 13);
      ctx.fillText("HANOI UNIVERSITY OF SCIENCE AND TECHNOLOGY", 123, 72, 493);
      ctx.fillStyle = "#35373b";
      ctx.font = font(700, 23);
      ctx.fillText(card.title || "THẺ SINH VIÊN", 123, 104);
      ctx.fillStyle = "#c9cbce";
      ctx.fillRect(28, 124, 590, 1);
    }
    const px = 211, py = 153, pw = 224, ph = 282;
    ctx.fillStyle = "#eeefed";
    ctx.fillRect(px, py, pw, ph);
    if (card.photo) {
      const image = card.photo, ratio = Math.max(pw / image.width, ph / image.height);
      const w = image.width * ratio, h = image.height * ratio;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      ctx.drawImage(image, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#bfc2c0";
      ctx.beginPath();
      ctx.arc(W / 2, py + 98, 51, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W / 2, py + ph, 94, 110, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.strokeStyle = "#c5c8c6";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    const rows = [
      ["Họ và tên", card.name || "Nguyễn Minh An"],
      ["MSSV", card.id || "26A0001"],
      ["Ngành", card.major || "Kỹ thuật phần mềm"],
      ["Khóa", card.cohort || "K71 · 2026–2030"]
    ];
    rows.forEach(([label, value], i) => {
      const y = 480 + i * 86;
      ctx.textAlign = "left";
      ctx.fillStyle = "#777b80";
      ctx.font = font(500, 18);
      ctx.fillText(label.toUpperCase(), 46, y);
      ctx.fillStyle = "#35373b";
      ctx.font = font(i ? 600 : 800, i ? 28 : 34);
      ctx.fillText(value, 46, y + 38, 554);
    });
    let hash = hashStr((card.id || "") + (card.name || "")), x = 79;
    ctx.fillStyle = "#35373b";
    while (x < 567) {
      hash = Math.imul(hash ^ hash >>> 13, 1274126177) >>> 0;
      const width = 2 + hash % 5;
      ctx.fillRect(x, 861, width, 54);
      x += width + 2 + (hash >>> 8) % 4;
    }
    ctx.fillStyle = "#777b80";
    ctx.font = font(500, 18);
    ctx.textAlign = "center";
    ctx.fillText(card.id || "26A0001", W / 2, 946);
    ctx.save();
    ctx.translate(W / 2, H * 0.65);
    ctx.rotate(-0.32);
    ctx.globalAlpha = 0.065;
    ctx.fillStyle = "#b51d2b";
    ctx.font = font(800, 120);
    ctx.fillText("MẪU", 0, 0);
    ctx.restore();
    ctx.fillStyle = "#b51d2b";
    ctx.font = font(600, 15);
    ctx.fillText("THẺ MẪU · KHÔNG CÓ GIÁ TRỊ SỬ DỤNG", W / 2, 995, 580);
    ctx.restore();
    return canvas;
  }
  function drawStudentCard(card, emblemCanvas, emblem) {
    if (card.orientation === "portrait") return drawPortraitStudentCard(card, emblemCanvas);
    const W = 1024, H = 646, cnv = makeCanvas(W, H), ctx = cnv.getContext("2d");
    const red = "#b51d2b", ink = "#35373b";
    const font = (weight, size) => `${weight} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 16);
    ctx.clip();
    ctx.fillStyle = "#fafaf7";
    ctx.fillRect(0, 0, W, H);
    if (card.template) ctx.drawImage(card.template, 0, 0, W, H);
    if (card.drawHeader !== false) {
      if (emblemCanvas) ctx.drawImage(emblemCanvas, 35, 14, 100, 100);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = red;
      ctx.font = font(800, 31);
      ctx.fillText((card.school || "Đại học Bách khoa Hà Nội").toUpperCase(), 150, 52, 830);
      ctx.fillStyle = "#777b80";
      ctx.font = font(500, 16);
      ctx.fillText("HANOI UNIVERSITY OF SCIENCE AND TECHNOLOGY", 150, 78, 830);
      ctx.fillStyle = ink;
      ctx.font = font(700, 25);
      ctx.fillText(card.title || "THẺ SINH VIÊN", 150, 111);
      ctx.fillStyle = "#c9cbce";
      ctx.fillRect(38, 132, 948, 1);
    }
    const px = 48, py = 162, pw = 242, ph = 306;
    ctx.fillStyle = "#eeefed";
    ctx.fillRect(px, py, pw, ph);
    if (card.photo) {
      const im = card.photo, ratio = Math.max(pw / im.width, ph / im.height);
      const w = im.width * ratio, h = im.height * ratio;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      ctx.drawImage(im, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#bfc2c0";
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 107, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph, 103, 120, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.strokeStyle = "#c5c8c6";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    const rows = [
      ["Họ và tên", card.name || "Nguyễn Minh An"],
      ["MSSV", card.id || "26A0001"],
      ["Ngành", card.major || "Kỹ thuật phần mềm"],
      ["Khóa", card.cohort || "K71 · 2026–2030"]
    ];
    ctx.textAlign = "left";
    rows.forEach(([label, value], i) => {
      const y = 188 + i * 77;
      ctx.fillStyle = "#777b80";
      ctx.font = font(500, 20);
      ctx.fillText(label.toUpperCase(), 332, y);
      ctx.fillStyle = ink;
      ctx.font = font(i ? 600 : 800, i ? 29 : 37);
      ctx.fillText(value, 332, y + 37, 645);
    });
    let hash = hashStr((card.id || "") + (card.name || "")), x = 333;
    ctx.fillStyle = ink;
    while (x < 827) {
      hash = Math.imul(hash ^ hash >>> 13, 1274126177) >>> 0;
      const width = 2 + hash % 5;
      ctx.fillRect(x, 521, width, 49);
      x += width + 2 + (hash >>> 8) % 4;
    }
    ctx.fillStyle = "#777b80";
    ctx.font = font(500, 18);
    ctx.fillText(card.id || "26A0001", 333, 596);
    ctx.save();
    ctx.translate(W * 0.54, H * 0.55);
    ctx.rotate(-0.3);
    ctx.globalAlpha = 0.065;
    ctx.fillStyle = red;
    ctx.font = font(800, 130);
    ctx.textAlign = "center";
    ctx.fillText("MẪU", 0, 35);
    ctx.restore();
    ctx.fillStyle = red;
    ctx.font = font(600, 17);
    ctx.fillText("THẺ MẪU · KHÔNG CÓ GIÁ TRỊ SỬ DỤNG", 48, 625);
    ctx.restore();
    return cnv;
  }
  function composeSleeve(color, imgs = {}, opts = {}) {
    var _a, _b;
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
      ctx.fillRect(S * ((_b = opts.pipingU) != null ? _b : 0.5) - 3, 0, 6, S);
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
    if (opts.emblem) {
      const [w, h, top] = opts.emblemBox || [120, 120, S * 0.16];
      ctx.drawImage(opts.emblem, S / 2 - w / 2, top, w, h);
    }
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

  // avatar/src/js/items/clothing.js
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
  function skinTop(geo, M, options) {
    const fullArm = DIM.upperArm + DIM.foreArm;
    const sleeveLen = options.sleeve === "long" ? fullArm - 0.025 : options.sleeve === "none" ? 0 : 0.15;
    skinByDistance(geo, M.segments.filter((segment) => segment.bone === 0 || segment.bone >= 2 && segment.bone <= 7));
    const p = geo.attributes.position, indices = geo.attributes.skinIndex, weights = geo.attributes.skinWeight;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const side = x >= 0 ? "L" : "R", arm = M.arms[side], base = side === "L" ? 2 : 5;
      const along = segT(x, y, z, arm.sh, arm.wr) * fullArm;
      const armDistance = Math.max(M.arm(side, x, y, z, 0.012, { upTo: sleeveLen, withHand: false }), along - sleeveLen);
      const blend = sleeveLen ? smooth(-0.018, 0.018, M.trunk(x, y, z, 0.014) - armDistance) : 0;
      const armWeights = [0, 0, 0];
      for (let k = 0; k < 4; k++) {
        const bone = indices.array[i * 4 + k];
        if (bone >= base && bone <= base + 2) armWeights[bone - base] += weights.array[i * 4 + k];
      }
      const sum = armWeights[0] + armWeights[1] + armWeights[2];
      indices.setXYZW(i, 0, base, base + 1, base + 2);
      weights.setXYZW(
        i,
        1 - blend,
        blend * (sum ? armWeights[0] / sum : 1),
        blend * (sum ? armWeights[1] / sum : 0),
        blend * (sum ? armWeights[2] / sum : 0)
      );
    }
    return geo;
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
      const waistTaper = o.waistFit ? 5e-3 * Math.exp(-(((y - P - 0.17) / 0.13) ** 2)) : 0;
      let d = M.trunk(x, y, z, base + flare - waistTaper);
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
    skinTop(g, M, o);
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
  function sportsCollar(M, blue, white) {
    const group = new THREE4.Group();
    const blueMat = lowpolyMat(blue, { flatShading: false, side: THREE4.DoubleSide });
    const whiteMat = lowpolyMat(white, { flatShading: false, side: THREE4.DoubleSide });
    const frontZ = (x, y, lift = 0) => {
      const r = trunkRadius(y), rx = r * M.b.sx + 0.014;
      return r * M.b.sz * Math.sqrt(Math.max(0.04, 1 - (x / rx) ** 2)) + 0.022 + lift;
    };
    const mesh = (verts, indices, material) => {
      const g = new THREE4.BufferGeometry();
      g.setAttribute("position", new THREE4.Float32BufferAttribute(verts, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      const m = new THREE4.Mesh(g, material);
      m.castShadow = true;
      group.add(m);
    };
    const strip = (a, b, width, material, lift = 0, offset = 0) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len, vertices = [], indices = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        for (const side of [-1, 1]) {
          const d = offset + side * width * 0.5;
          const x = a[0] + dx * t + nx * d, y = a[1] + dy * t + ny * d;
          vertices.push(x, y, frontZ(x, y, lift));
        }
        if (i) {
          const p = i * 2;
          indices.push(p - 2, p - 1, p, p - 1, p + 1, p);
        }
      }
      mesh(vertices, indices, material);
    };
    for (const side of [-1, 1]) {
      const points = [[side * 0.038, 0.502], [side * 0.076, 0.508], [side * 0.112, 0.468], [side * 0.069, 0.449]];
      mesh(points.flatMap(([x, y]) => [x, y, frontZ(x, y, 4e-3)]), [0, 1, 2, 0, 2, 3], blueMat);
      const a = [side * 0.074, 0.5], b = [side * 0.104, 0.468];
      for (const offset of [-3e-3, 3e-3]) strip(a, b, 18e-4, whiteMat, 6e-3, offset);
    }
    for (const side of [-1, 1]) {
      const a = [side * 0.066, 0.491], b = [-side * 6e-3, side < 0 ? 0.386 : 0.378];
      const lift = side < 0 ? 3e-3 : 5e-3;
      strip(a, b, 0.018, blueMat, lift);
      for (const offset of [-48e-4, 48e-4]) strip(a, b, 22e-4, whiteMat, lift + 1e-3, offset);
    }
    return group;
  }
  function buildTop(ctx) {
    const { item, rig, imgs, emblem } = ctx;
    const emblemCanvas = imgs.badge ? drawEmblem({
      ...emblem,
      logo: item.textures.badge,
      logoCrop: item.badgeCrop,
      logoClip: item.badgeClip
    }) : ctx.emblemCanvas;
    const o = item.options || {};
    const M = rig.model;
    const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
    const trim = item.colors.trim || "#ffffff";
    const printColor = item.colors.print || "#ffffff";
    const keyOpts = { sleeve: o.sleeve, collar: o.collar, tucked: o.tucked, zipper: o.zipper, cuffs: o.cuffs, placket: !!o.placket, vneck: o.vneck, sportsCollar: o.sportsCollar, bomber: o.bomber, waistFit: o.waistFit };
    let geo = cached(`top|${M.name}|${JSON.stringify(keyOpts)}`, () => topGeometry(M, o));
    if (o.sportsCollar || o.bomber) {
      geo = geo.clone();
      geo.userData.keep = false;
      const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), panelMix = new Float32Array(pos.count);
      const lin = (hex) => new THREE4.Color(hex).convertSRGBToLinear();
      const blue = lin(accent), white = lin("#ffffff"), bodyColor = lin(main);
      for (let i = 0; i < pos.count; i++) {
        const x = Math.abs(pos.getX(i)) / M.b.sx;
        const y = pos.getY(i) - M.P[1];
        const seamX = Math.min(0.165, 0.059 + Math.max(0, 0.5 - y) * 0.65) + Math.max(0, 0.23 - y) * 2.5;
        const bomberSeamX = M.shoulderX - 0.035 + 0.045 * (1 - smooth(0.23, 0.39, y));
        const blend = o.bomber ? smooth(bomberSeamX - 6e-3, bomberSeamX + 6e-3, Math.abs(pos.getX(i))) : smooth(seamX - 3e-3, seamX + 3e-3, x);
        const c = (o.bomber ? bodyColor : white).clone().lerp(blue, blend);
        panelMix[i] = blend;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new THREE4.BufferAttribute(colors, 3));
      if (o.bomber) geo.setAttribute("panelMix", new THREE4.BufferAttribute(panelMix, 1));
    }
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
      shoulderPiping: o.shoulderPiping,
      sidePiping: o.sidePiping,
      weltPockets: o.weltPockets,
      hemBand: o.hemBand,
      vneck: o.vneck && !o.sportsCollar ? [accent, trim] : null,
      plaid: o.plaid,
      breton: o.breton,
      wordmark: o.wordmark,
      wordmarkText: emblem == null ? void 0 : emblem.wordmark,
      wordmarkBack: o.wordmarkBack,
      archText: o.arch ? (emblem == null ? void 0 : emblem.name) || "" : null,
      archSub: o.arch ? emblem == null ? void 0 : emblem.short : null
    });
    if (!o.sportsCollar && (o.collar === "polo" || o.collar === "shirt")) {
      const c = bodyCanvas.getContext("2d");
      c.fillStyle = shade(o.collarAccent ? accent : main, -0.05);
      c.fillRect(0, 0, 1024, 12);
    }
    if (o.collarAccent && !o.sportsCollar) {
      const c = bodyCanvas.getContext("2d");
      c.fillStyle = accent;
      c.fillRect(0, 0, 1024, 18);
    }
    if (o.poloTrim) {
      const c = bodyCanvas.getContext("2d");
      c.fillStyle = item.colors.ribAccent || "#1f2a44";
      c.fillRect(0, 3, 1024, 4);
      c.fillStyle = trim;
      c.fillRect(0, 8, 1024, 3);
    }
    if (o.bomber) {
      const c = bodyCanvas.getContext("2d");
      c.fillStyle = main;
      c.fillRect(0, 0, 1024, 25);
      c.fillRect(0, 512 * 0.92, 1024, 512 * 0.08);
      c.fillStyle = trim;
      for (const y of [5, 15, 512 * 0.94, 512 * 0.973]) c.fillRect(0, y, 1024, y < 25 ? 4 : 5);
      c.fillStyle = shade(main, -0.03);
      c.fillRect(244, 0, 24, 512);
      for (let y = 22; y < 506; y += 78) {
        c.fillStyle = "#7c828a";
        c.beginPath();
        c.arc(256, y, 5.2, 0, TAU);
        c.fill();
        c.fillStyle = "#dce0e4";
        c.beginPath();
        c.arc(255, y - 1, 3.8, 0, TAU);
        c.fill();
      }
      if (o.weltPockets) {
        c.strokeStyle = trim;
        c.lineWidth = 10;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(256 + side * 95, 512 * 0.65);
          c.lineTo(256 + side * 114, 512 * 0.86);
          c.stroke();
        }
      }
    }
    const sleeveColor = o.accentSleeves ? accent : main;
    const sl = { cuff: o.cuffs && o.sleeve === "long", hem: o.sleeve === "short", sleeveStripes: o.sleeveStripes, trim, plaid: o.plaid, breton: o.breton, patternScale: o.patternScale };
    const sleeveImgs = o.accentSleeves ? {} : { pattern: imgs.pattern };
    const sleeveLen = o.sleeve === "long" ? DIM.upperArm + DIM.foreArm - 0.025 : 0.15;
    const pxU = 512 / (TAU * 0.064 * M.L), pxV = 512 / sleeveLen;
    const emblemBox = [0.055 * pxU, 0.055 * pxV, 0.03 * pxV];
    const left = composeSleeve(sleeveColor, sleeveImgs, { ...sl, piping: o.shoulderPiping, pipingU: 0.68, emblem: o.sleeveEmblem ? emblemCanvas : null, emblemBox });
    const right = composeSleeve(sleeveColor, sleeveImgs, { ...sl, piping: o.shoulderPiping, pipingU: 0.32 });
    if (o.poloTrim || o.bomber) for (const sleeve of [left, right]) {
      const c = sleeve.getContext("2d");
      if (o.bomber) {
        c.fillStyle = main;
        c.fillRect(0, 512 * 0.89, 512, 512 * 0.11);
        c.fillStyle = trim;
        for (const y of [512 * 0.918, 512 * 0.965]) c.fillRect(0, y, 512, 7);
      } else {
        c.fillStyle = item.colors.ribAccent || "#1f2a44";
        c.fillRect(0, 512 * 0.94, 512, 9);
        c.fillStyle = trim;
        c.fillRect(0, 512 * 0.965, 512, 8);
      }
    }
    const material = garmentMaterial(composeTopAtlas(bodyCanvas, left, right), { vertexColors: !!o.sportsCollar });
    if (o.bomber) {
      material.userData.bomberPanels = { main, accent };
      material.onBeforeCompile = (shader) => {
        shader.uniforms.bomberBody = { value: new THREE4.Color(main).convertSRGBToLinear() };
        shader.uniforms.bomberSleeve = { value: new THREE4.Color(accent).convertSRGBToLinear() };
        shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nattribute float panelMix;\nvarying float vPanelMix;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvPanelMix = panelMix;");
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vPanelMix;\nuniform vec3 bomberBody;\nuniform vec3 bomberSleeve;").replace("#include <map_fragment>", `#include <map_fragment>
        #ifdef USE_MAP
          vec3 atlasBase = vUv.y < 0.5 ? bomberSleeve : bomberBody; // [r128] vUv (bản mới: vMapUv)
          vec3 panelColor = mix(bomberBody, bomberSleeve, vPanelMix);
          diffuseColor.rgb *= panelColor / max(atlasBase, vec3(0.001));
        #endif`);
      };
      material.customProgramCacheKey = () => "hust-bomber-panels-v1";
    }
    const parts = [skinnedPart(geo, material)];
    if (o.sportsCollar) parts.push({ joint: "torso", obj: sportsCollar(M, accent, trim) });
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
  function bottomHemY(G, o) {
    return o.length === "shorts" ? G.kn[1] + 0.16 : G.an[1] + (o.length === "capri" ? 0.16 : 0.035);
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
    skinByDistance(g, M.segments.filter((segment) => segment.bone === 0 || segment.bone >= 8));
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
  function trackPantsCanvas(main, accent, imgs, o, M, printColor) {
    var _a, _b;
    const W = 1024, H = 1024, half = W / 2;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext("2d");
    const fabric = composePlain(main, imgs, { patternScale: o.patternScale });
    const G = M.legs.L;
    const hemY = bottomHemY(G, o), waistY = M.P[1] + 0.078;
    const py = (y) => (1 - (y - hemY) / (waistY - hemY)) * H;
    for (let side = 0; side < 2; side++) {
      const x = side * half;
      c.drawImage(fabric, x, 0, half, H);
      if (o.sideStripe) {
        const stripeWidth = (_a = o.trackStripeWidth) != null ? _a : 0.08;
        const bias = Math.min((_b = o.trackStripeBias) != null ? _b : 0.035, stripeWidth * 0.45);
        c.fillStyle = accent;
        for (let row = 0; row < H; row++) {
          const worldY = hemY + (1 - (row + 0.5) / H) * (waistY - hemY);
          const fit = 1 - 0.6 * smooth(M.P[1] - 0.18, M.P[1] - 0.035, worldY);
          const center = side === 0 ? 1 - bias * fit : bias * fit;
          const start = center - stripeWidth * fit / 2, end = center + stripeWidth * fit / 2;
          c.fillRect(x + Math.max(0, start) * half, row, (Math.min(1, end) - Math.max(0, start)) * half, 1);
          if (start < 0) c.fillRect(x + (1 + start) * half, row, -start * half, 1);
          if (end > 1) c.fillRect(x, row, (end - 1) * half, 1);
        }
      }
    }
    if (o.elasticWaist) {
      const bandH = py(waistY - 0.043);
      c.fillStyle = "rgba(0,0,0,0.10)";
      c.fillRect(0, 0, W, bandH);
      c.strokeStyle = "rgba(0,0,0,0.18)";
      c.lineWidth = 2;
      for (let y = 8; y < bandH; y += 12) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      c.strokeStyle = "rgba(255,255,255,0.10)";
      c.lineWidth = 1;
      for (let x = 0; x < W; x += 7) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 2, bandH);
        c.stroke();
      }
    }
    if (o.zipPockets) {
      for (let side = 0; side < 2; side++) {
        const x = half * (side + (side === 0 ? 0.89 : 0.11));
        const slant = side === 0 ? -1 : 1;
        const y0 = py(waistY - 0.07), y1 = py(waistY - 0.205);
        c.strokeStyle = shade(main, -0.05);
        c.lineWidth = 9;
        c.beginPath();
        c.moveTo(x, y0);
        c.lineTo(x + slant * 12, y1);
        c.stroke();
        c.strokeStyle = shade(main, 0.1);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x + 2, y0);
        c.lineTo(x + slant * 12 + 2, y1);
        c.stroke();
        c.fillStyle = "#4b5361";
        c.fillRect(x - 3, y0 - 3, 6, 10);
      }
    }
    c.fillStyle = "rgba(0,0,0,0.10)";
    const hemH = (o.cuff ? 0.045 : 0.012) / (waistY - hemY) * H;
    c.fillRect(0, H - hemH, W, hemH);
    c.fillRect(0, H - hemH - 3, W, 2);
    if (o.sideTag) {
      const x = half * 1.13, y = py(M.P[1] - 0.17);
      c.fillStyle = "#161918";
      c.fillRect(x - 10, y, 20, 61);
      c.fillStyle = "#f5f4ee";
      c.font = '800 12px "Be Vietnam Pro", system-ui, sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      [..."HUST"].forEach((ch, i) => c.fillText(ch, x, y + 9 + i * 14));
    }
    if (o.wordmark) {
      const printY = o.wordmarkVertical ? hemY + 0.075 : M.P[1] - 0.15;
      const y = py(printY);
      c.fillStyle = printColor;
      c.textAlign = "center";
      c.textBaseline = "middle";
      if (o.wordmarkVertical) {
        c.save();
        c.translate(half * 0.86, y);
        c.rotate(-Math.PI / 2);
        c.font = '800 34px "Be Vietnam Pro", system-ui, sans-serif';
        c.fillText("HUST", 0, 0, 146);
        c.restore();
      } else {
        c.font = 'italic 800 28px "Be Vietnam Pro", system-ui, sans-serif';
        c.fillText("HUST", half * 0.78, y, 112);
      }
    }
    return canvas;
  }
  function buildBottom(ctx) {
    const { item, rig, imgs } = ctx;
    const o = item.options || {};
    const M = rig.model;
    const main = item.colors.main, accent = item.colors.accent || shade(main, 0.4);
    const keyOpts = { skirt: o.skirt, skirtLen: o.skirtLen, pleats: o.pleats, fit: o.fit, length: o.length, cuff: o.cuff, track: o.track };
    const geo = cached(`bottom|${M.name}|${JSON.stringify(keyOpts)}`, () => bottomGeometry(M, o));
    const plain = o.track ? trackPantsCanvas(main, accent, imgs, o, M, item.colors.print || accent) : composePlain(main, imgs, { denim: o.denim, sideStripe: o.sideStripe ? accent : null, patternScale: o.patternScale });
    const mat = garmentMaterial(plain, { roughness: o.fleece ? 0.98 : o.denim ? 0.95 : 0.88 });
    mat.map.wrapT = o.track ? THREE4.ClampToEdgeWrapping : THREE4.RepeatWrapping;
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

  // avatar/src/js/items/gear.js
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
  function rbox(w, h, d, r, mat, seg = 2) {
    return new THREE5.Mesh(new import_RoundedBoxGeometry.RoundedBoxGeometry(w, h, d, seg, r), mat);
  }
  function tube(points, radius, mat, flat = 1) {
    const curve = new THREE5.CatmullRomCurve3(points.map((p) => new THREE5.Vector3(...p)));
    curve.curveType = "centripetal";
    const g = new THREE5.TubeGeometry(curve, 32, radius, 5, false);
    if (flat !== 1) g.scale(1, 1, 1);
    return new THREE5.Mesh(g, mat);
  }
  function decal(canvasOrTex, w, h, extra = {}) {
    const tex = canvasOrTex.isTexture ? canvasOrTex : toTexture(canvasOrTex);
    const m = new THREE5.Mesh(new THREE5.PlaneGeometry(w, h), new THREE5.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7, ...extra }));
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
    const { item, rig, cardCanvas, emblem, emblemCanvas } = ctx;
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
      const portrait = cardCanvas.height > cardCanvas.width;
      const w = (portrait ? 0.0757 : 0.12) * scale, h = (portrait ? 0.12 : 0.0757) * scale;
      c.userData.holderHeight = h + (holder === "silicone" ? 0.026 : 0.012);
      if (holder === "silicone") {
        const roundedPath = (Path2, width, height, radius) => {
          const p = new Path2(), x = -width / 2, y = -height / 2;
          p.moveTo(x + radius, y);
          p.lineTo(x + width - radius, y);
          p.quadraticCurveTo(x + width, y, x + width, y + radius);
          p.lineTo(x + width, y + height - radius);
          p.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          p.lineTo(x + radius, y + height);
          p.quadraticCurveTo(x, y + height, x, y + height - radius);
          p.lineTo(x, y + radius);
          p.quadraticCurveTo(x, y, x + radius, y);
          return p;
        };
        const outerW = w + 0.024, outerH = h + 0.026;
        const plastic = lowpolyMat(holderColor, { roughness: 0.42 });
        const outline = roundedPath(THREE5.Shape, outerW, outerH, 9e-3);
        outline.holes.push(roundedPath(THREE5.Path, w - 2e-3, h - 2e-3, 3e-3));
        const geometry = new THREE5.ExtrudeGeometry(outline, { depth: 5e-3, steps: 1, bevelEnabled: true, bevelThickness: 8e-4, bevelSize: 8e-4, bevelSegments: 2, curveSegments: 10 });
        const frame = new THREE5.Mesh(geometry, plastic);
        frame.position.z = -2e-3;
        frame.name = "red-card-frame";
        c.add(frame);
        const backing = rbox(outerW - 2e-3, outerH - 2e-3, 2e-3, 8e-3, plastic, 3);
        backing.position.z = -4e-3;
        c.add(backing);
        const slotMat = lowpolyMat(shade(holderColor, -0.38));
        const slot = rbox(0.026, 4e-3, 1e-3, 18e-4, slotMat, 3);
        slot.position.set(0, outerH / 2 - 6e-3, 38e-4);
        slot.name = "holder-attachment-slot";
        c.add(slot);
        c.userData.attachmentLocal = slot.position.toArray();
      } else {
        c.add(rbox(w + 0.012, h + 0.012, 5e-3, 4e-3, new THREE5.MeshStandardMaterial({ color: "#eef3f8", transparent: true, opacity: 0.35, roughness: 0.1 })));
      }
      const face = decal(cardTex, w, h, { transparent: false });
      face.position.z = holder === "silicone" ? 22e-4 : 45e-4;
      c.add(face);
      return c;
    };
    if (type === "day-deo") {
      const ribbonMat = new THREE5.MeshStandardMaterial({
        map: toTexture(ribbonTexture(((emblem == null ? void 0 : emblem.name) || "Đại học Bách khoa Hà Nội").toUpperCase(), main, textColor, { logo: emblemCanvas, wordmark: (emblem == null ? void 0 : emblem.wordmark) || "HUST" })),
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
      const hardwareZ = chestZ(0.25) + 0.013;
      for (const side of [-1, 1]) {
        const rivet = new THREE5.Mesh(new THREE5.CylinderGeometry(28e-4, 28e-4, 14e-4, 12), metal);
        rivet.rotation.x = Math.PI / 2;
        rivet.position.set(side * 8e-3, 0.257, hardwareZ);
        g.add(rivet);
      }
      const ring = new THREE5.Mesh(new THREE5.TorusGeometry(8e-3, 13e-4, 6, 24), metal);
      ring.position.set(0, 0.244, hardwareZ);
      ring.name = "lanyard-split-ring";
      g.add(ring);
      const swivel = new THREE5.Mesh(new THREE5.CylinderGeometry(27e-4, 27e-4, 9e-3, 10), metal);
      swivel.position.set(0, 0.231, hardwareZ);
      g.add(swivel);
      const hook = tube([
        [0, 0.228, hardwareZ],
        [-7e-3, 0.224, hardwareZ],
        [-9e-3, 0.213, hardwareZ],
        [-4e-3, 0.207, hardwareZ],
        [5e-3, 0.208, hardwareZ],
        [9e-3, 0.217, hardwareZ],
        [6e-3, 0.223, hardwareZ]
      ], 135e-5, metal);
      hook.name = "lanyard-lobster-clasp";
      g.add(hook);
      const gate = tube([[6e-3, 0.223, hardwareZ], [5e-3, 0.215, hardwareZ], [3e-3, 0.209, hardwareZ]], 9e-4, metal);
      g.add(gate);
      const card = makeCard(1, "silicone");
      card.rotation.x = -0.06;
      const attachment = new THREE5.Vector3(...card.userData.attachmentLocal).applyEuler(card.rotation);
      card.position.set(0, 0.211 - attachment.y, hardwareZ - attachment.z);
      card.name = "student-card-holder";
      g.add(card);
    } else {
      const card = makeCard(0.85, "clear");
      const x = 0.075 * b.sx;
      card.position.set(x, 0.28, chestZ(0.28) + 6e-3);
      card.rotation.set(-0.1, 0.32, 0);
      g.add(card);
      const clip = new THREE5.Mesh(new THREE5.BoxGeometry(0.02, 0.025, 6e-3), metal);
      clip.position.set(x - 4e-3, card.position.y + card.userData.holderHeight / 2 + 5e-3, chestZ(0.32) + 8e-3);
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

  // avatar/src/js/items/index.js
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

  // avatar/src/data/catalog.js
  var RED = "#b3141d";
  var WINE = "#7a1c26";
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
      "id": "ao-polo-truong",
      "slot": "top",
      "group": "truong",
      "name": "Polo cotton HUST đỏ đô",
      "colors": {
        "main": "#a51f28",
        "accent": "#a51f28",
        "trim": "#ffffff",
        "ribAccent": "#101c35",
        "print": "#ffffff"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "polo",
        "placket": [
          0,
          0.2
        ],
        "poloTrim": true,
        "wordmark": "chest-left",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo polo cộc tay (Sản phẩm Best Seller học đường)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-polo-coc-tay-san-pham-best-seller-hoc-duong"
      }
    },
    {
      "id": "ao-thun-truong",
      "slot": "top",
      "group": "truong",
      "name": "Áo thể thao cổ tròn HUST",
      "colors": {
        "main": "#a51f28",
        "trim": "#ffffff",
        "print": "#ffffff"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "crew",
        "wordmark": "chest-left",
        "sleeveEmblem": true,
        "shoulderPiping": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thể thao cổ tròn",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-the-thao-co-tron"
      }
    },
    {
      "id": "ao-khoac-gio",
      "slot": "top",
      "group": "truong",
      "name": "Áo khoác gió HUST có mũ",
      "colors": {
        "main": "#a51f28",
        "trim": "#ffffff",
        "print": "#ffffff",
        "zipper": "#333236"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "hood",
        "zipper": true,
        "piping": true,
        "weltPockets": true,
        "hemBand": true,
        "cuffs": true,
        "wordmark": "chest-left",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo khoác gió",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-gio"
      }
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
      "id": "ao-ni-truong",
      "slot": "top",
      "group": "truong",
      "name": "Sweater HUST xanh tím than",
      "colors": {
        "main": "#101c35",
        "print": "#ffffff"
      },
      "palette": [
        "#101c35",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "crew",
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo Sweater màu xanh tím than",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-sweater-mau-xanh-tim-than"
      }
    },
    {
      "id": "ao-hoodie-truong",
      "slot": "top",
      "group": "truong",
      "name": "Hoodie HUST đỏ đô",
      "colors": {
        "main": "#a51f28",
        "print": "#ffffff"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "hood",
        "kangaroo": true,
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo Hoodie màu đỏ đô (Trang phục best seller học đường)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-hoodie-mau-do-do-trang-phuc-best-seller-hoc-duong"
      }
    },
    // ---------------------------------------------------------------- CÁC MẪU HUST TỪ MAY PHƯƠNG THẢO
    {
      "id": "ao-so-mi-nam-hust",
      "slot": "top",
      "group": "truong",
      "name": "Sơ mi HUST nam màu ghi",
      "colors": {
        "main": "#c5c8cd",
        "accent": "#b3b7bc"
      },
      "palette": [
        "#c5c8cd",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "shirt",
        "placket": [
          0,
          1
        ],
        "cuffs": true,
        "pocket": false,
        "tucked": false
      },
      "emblem": "chest-left",
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo sơ mi Nam",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-so-mi-nam"
      }
    },
    {
      "id": "ao-so-mi-nu-hust",
      "slot": "top",
      "group": "truong",
      "name": "Sơ mi HUST nữ màu ghi",
      "colors": {
        "main": "#c5c8cd",
        "accent": "#b3b7bc"
      },
      "palette": [
        "#c5c8cd",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "shirt",
        "placket": [
          0,
          1
        ],
        "cuffs": true,
        "pocket": false,
        "tucked": false,
        "waistFit": true
      },
      "emblem": "chest-left",
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo sơ mi nữ",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-so-mi-nu"
      }
    },
    {
      "id": "ao-thun-trang-nguc-trai-hust",
      "slot": "top",
      "group": "truong",
      "name": "Áo thun HUST trắng · ngực trái",
      "colors": {
        "main": "#f8f8f6",
        "print": "#a51f28"
      },
      "palette": [
        "#f8f8f6",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "crew",
        "wordmark": "chest-left",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thun cổ tròn màu trắng (thêu ngực trái)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-trang-theu-nguc-trai"
      }
    },
    {
      "id": "ao-thun-trang-giua-nguc-hust",
      "slot": "top",
      "group": "truong",
      "name": "Áo thun HUST trắng · giữa ngực",
      "colors": {
        "main": "#f8f8f6",
        "print": "#a51f28"
      },
      "palette": [
        "#f8f8f6",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "crew",
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thun cổ tròn màu trắng (thêu giữa ngực)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-trang-theu-giua-nguc"
      }
    },
    {
      "id": "ao-thun-do-giua-nguc-hust",
      "slot": "top",
      "group": "truong",
      "name": "Áo thun HUST đỏ đô · giữa ngực",
      "colors": {
        "main": "#a51f28",
        "print": "#ffffff"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "crew",
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thun cổ tròn màu đỏ đô (thêu giữa ngực)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-do-do-theu-giua-nguc"
      }
    },
    {
      "id": "ao-thun-ghi-nguc-trai-hust",
      "slot": "top",
      "group": "truong",
      "name": "Áo thun HUST ghi · ngực trái",
      "colors": {
        "main": "#aeb0b2",
        "print": "#a51f28"
      },
      "palette": [
        "#aeb0b2",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "crew",
        "wordmark": "chest-left",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thun cổ tròn màu ghi (thêu ngực trái)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-thun-co-tron-mau-ghi-theu-nguc-trai"
      }
    },
    {
      "id": "ao-polo-the-thao-hust",
      "slot": "top",
      "group": "truong",
      "name": "Áo thể thao có cổ HUST",
      "colors": {
        "main": "#a51f28",
        "accent": "#a51f28",
        "trim": "#ffffff",
        "print": "#ffffff"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "short",
        "collar": "polo",
        "placket": [
          0,
          0.2
        ],
        "shoulderPiping": true,
        "wordmark": "chest-left",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo thể thao có cổ",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-the-thao-co-co"
      }
    },
    {
      "id": "ao-bomber-xanh-hust",
      "slot": "top",
      "group": "truong",
      "name": "Bomber HUST xanh than · tay trắng",
      "colors": {
        "main": "#101c35",
        "accent": "#f5f4ef",
        "trim": "#ffffff",
        "print": "#ffffff",
        "ribAccent": "#ffffff"
      },
      "palette": [
        "#101c35",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "stand",
        "bomber": true,
        "accentSleeves": true,
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-left",
        "sleeveEmblem": true,
        "weltPockets": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo khoác Bomber màu xanh than",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-bomber-mau-xanh-than"
      }
    },
    {
      "id": "ao-bomber-do-hust",
      "slot": "top",
      "group": "truong",
      "name": "Bomber HUST đỏ đô · tay ghi",
      "colors": {
        "main": "#a51f28",
        "accent": "#bdc0c2",
        "trim": "#e7e7e4",
        "print": "#ffffff",
        "ribAccent": "#e7e7e4"
      },
      "palette": [
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "stand",
        "bomber": true,
        "accentSleeves": true,
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-left",
        "sleeveEmblem": true,
        "weltPockets": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo khoác Bomber màu đỏ đô",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-khoac-bomber-mau-do-do"
      }
    },
    {
      "id": "ao-ni-trang-hust",
      "slot": "top",
      "group": "truong",
      "name": "Sweater HUST trắng",
      "colors": {
        "main": "#f7f7f3",
        "print": "#a51f28"
      },
      "palette": [
        "#f7f7f3",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "crew",
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo Sweater màu trắng",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-sweater-mau-trang"
      }
    },
    {
      "id": "ao-hoodie-ghi-hust",
      "slot": "top",
      "group": "truong",
      "name": "Hoodie HUST màu ghi",
      "colors": {
        "main": "#bdbfbe",
        "print": "#a51f28"
      },
      "palette": [
        "#bdbfbe",
        "#a51f28",
        "#7a1c26",
        "#ffffff",
        "#101c35",
        "#a9abb0"
      ],
      "textures": {
        "front": null,
        "back": null,
        "pattern": null
      },
      "accepts": [
        "front",
        "back",
        "pattern"
      ],
      "options": {
        "sleeve": "long",
        "collar": "hood",
        "kangaroo": true,
        "cuffs": true,
        "hemBand": true,
        "wordmark": "chest-big",
        "sleeveEmblem": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Áo Hoodie màu ghi",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/ao-hoodie-mau-ghi"
      }
    },
    // ---------------------------------------------------------------- ÁO — thông dụng
    { id: "ao-raglan-co-tim", slot: "top", group: "truong", name: "Áo GDTC HUST trắng · xanh", colors: { main: "#ffffff", accent: "#1689ca", trim: "#ffffff" }, palette: ["#ffffff", "#e7e9ee", "#f2efe6"], accepts: ["front"], textures: {}, emblem: "chest-left", options: { sleeve: "short", collar: "polo", collarAccent: true, accentSleeves: true, vneck: true, sportsCollar: true } },
    { id: "ao-thun", slot: "top", name: "Áo thun trơn", colors: { main: "#f2efe8" }, palette: ["#f2efe8", "#1f1f22", "#e65a4f", "#3d7bd9", "#f2c94c", "#7bc4a4"], textures: {}, accepts: ["front", "back"], options: { sleeve: "short", collar: "crew" } },
    { id: "ao-ke-ngang", slot: "top", name: "Áo thun kẻ ngang", colors: { main: "#f4f1ea", accent: "#24324f" }, palette: ["#f4f1ea", "#fff7e0"], options: { sleeve: "long", collar: "crew", breton: "#24324f" } },
    { id: "ao-so-mi-caro", slot: "top", name: "Sơ mi caro", colors: { main: "#b8423a" }, palette: ["#b8423a", "#3a5f8a", "#4d6b3c", "#6b6f78"], options: { sleeve: "long", collar: "shirt", placket: [0, 1], pocket: true, cuffs: true, plaid: ["#22324d", "#f1e4c9"] } },
    { id: "ao-the-thao", slot: "top", name: "Áo thể thao sọc", colors: { main: "#2e6fd6", accent: "#ffffff" }, palette: ["#2e6fd6", "#d63a3a", "#1aa36f", "#ff8a1f", "#222"], accepts: ["front", "back"], textures: {}, options: { sleeve: "short", collar: "crew", collarAccent: true, stripes: [[0.62, 0.66], [0.69, 0.71]] } },
    { id: "ao-hoodie", slot: "top", name: "Hoodie trơn", colors: { main: "#8a95a8" }, palette: ["#8a95a8", "#2a2d34", "#e8e2d6", "#b45f4a", "#4f6b52"], accepts: ["front", "back"], textures: {}, options: { sleeve: "long", collar: "hood", kangaroo: true, cuffs: true, hemBand: true } },
    { id: "ao-ba-lo", slot: "top", name: "Áo ba lỗ", colors: { main: "#f2efe8" }, palette: ["#f2efe8", "#1f1f22", "#5c7da8"], options: { sleeve: "none", collar: "crew" } },
    // ---------------------------------------------------------------- QUẦN THỂ THAO HUST
    {
      "id": "quan-the-thao-hust",
      "slot": "bottom",
      "group": "truong",
      "name": "Quần thể thao HUST · ống suông",
      "colors": {
        "main": "#101c35",
        "accent": "#ffffff",
        "print": "#ffffff"
      },
      "palette": [
        "#101c35",
        "#1f2a44",
        "#23252d"
      ],
      "textures": {},
      "accepts": [
        "pattern"
      ],
      "options": {
        "fit": "regular",
        "track": true,
        "sideStripe": true,
        "wordmark": true,
        "belt": false,
        "elasticWaist": true,
        "zipPockets": true,
        "sideTag": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Quần thể thao",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-the-thao"
      }
    },
    {
      "id": "quan-the-thao-ni-hust",
      "slot": "bottom",
      "group": "truong",
      "name": "Quần thể thao HUST · nỉ ấm",
      "colors": {
        "main": "#101c35",
        "accent": "#ffffff",
        "print": "#ffffff"
      },
      "palette": [
        "#101c35",
        "#1f2a44",
        "#23252d"
      ],
      "textures": {},
      "accepts": [
        "pattern"
      ],
      "options": {
        "fit": "slim",
        "track": true,
        "sideStripe": true,
        "wordmark": true,
        "belt": false,
        "elasticWaist": true,
        "zipPockets": true,
        "sideTag": true,
        "fleece": true
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Quần thể thao cao cấp (Vải nỉ ấm áp)",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-the-thao-cao-cap-vai-ni-am-ap"
      }
    },
    {
      "id": "quan-short-hust",
      "slot": "bottom",
      "group": "truong",
      "name": "Quần sooc thể thao HUST",
      "colors": {
        "main": "#101c35",
        "accent": "#ffffff",
        "print": "#ffffff"
      },
      "palette": [
        "#101c35",
        "#1f2a44",
        "#23252d"
      ],
      "textures": {},
      "accepts": [
        "pattern"
      ],
      "options": {
        "fit": "wide",
        "track": true,
        "sideStripe": true,
        "wordmark": true,
        "belt": false,
        "elasticWaist": true,
        "zipPockets": true,
        "sideTag": true,
        "length": "shorts",
        "wordmarkVertical": true,
        "trackStripeWidth": 0.1
      },
      "collection": "hust-phuong-thao",
      "source": {
        "name": "May Phương Thảo",
        "title": "Quần sooc thể thao cao cấp",
        "url": "https://shop.mayphuongthao.com/dai-hoc-bach-khoa-ha-noi/products/quan-sooc-the-thao-cao-cap"
      }
    },
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
    { id: "the-sv-day-deo", slot: "card", group: "truong", name: "Dây đeo HUST + vỏ thẻ đỏ", fixedColors: true, colors: { main: "#df1930", accent: "#e31b34", text: "#ffffff" }, palette: ["#df1930"], options: { type: "day-deo" } },
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
  for (const item of ITEMS) {
    if (item.slot !== "top") continue;
    const rectangular = item.id === "ao-raglan-co-tim";
    item.textures = {
      ...item.textures,
      badge: rectangular ? "avatar/assets/textures/hust-logo.png" : "avatar/assets/textures/hust-logo-round.png"
    };
    item.badgeCrop = rectangular ? [261, 40, 246, 370] : [16, 12, 224, 224];
    item.badgeClip = rectangular ? null : "circle";
  }
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
    // Nhận diện HUST — dùng logo Bách khoa do người dùng cung cấp
    emblem: {
      name: "Đại học Bách khoa Hà Nội",
      short: "HUST",
      wordmark: "HUST",
      year: "1956",
      shape: "tron",
      motif: "banh-rang",
      main: RED,
      accent: "#ffffff",
      logo: "avatar/assets/textures/hust-logo.png",
      logoCrop: [261, 40, 246, 370]
    },
    // Thẻ SV mẫu — toàn bộ là dữ liệu giả
    card: {
      school: "Đại học Bách khoa Hà Nội",
      title: "THẺ SINH VIÊN",
      orientation: "landscape",
      name: "Nguyễn Minh An",
      id: "26A0001",
      major: "Kỹ thuật phần mềm",
      cohort: "K71 · 2026–2030",
      photo: null,
      // dataURL hoặc đường dẫn ảnh
      template: null,
      // 'avatar/assets/textures/the-sv-nen.png' — ảnh nền thẻ của bạn (1024×646)
      drawHeader: true
    }
  };
  var SKIN_TONES = ["#f3d2b8", "#e8bf9e", "#e2b08c", "#c98e66", "#a86f4c", "#7a4e34"];
  var CATALOG = { slots: SLOTS, items: ITEMS, defaults: DEFAULTS, skinTones: SKIN_TONES };
  var catalog_default = CATALOG;

  // avatar/src/kit.js
  var SLOT_ORDER = ["hair", "top", "bottom", "footwear", "hat", "bag", "card", "eyewear", "mask", "audio", "handheld"];
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
  var ITEMS2 = new Map(catalog_default.items.map((i) => [i.id, i]));
  var DEF_EMBLEM = catalog_default.defaults.emblem;
  var IMAGE_PATHS = /* @__PURE__ */ new Set();
  for (const it of catalog_default.items) for (const v of Object.values(it.textures || {})) if (typeof v === "string" && v) IMAGE_PATHS.add(v);
  if (DEF_EMBLEM.logo) IMAGE_PATHS.add(DEF_EMBLEM.logo);
  var readyFlag = false;
  var ready = Promise.all([...IMAGE_PATHS].map(loadImage)).then(() => {
    readyFlag = true;
  });
  var isReady = () => readyFlag;
  function knownPath(src) {
    if (typeof src !== "string") return null;
    if (IMAGE_PATHS.has(src)) return src;
    if (IMAGE_PATHS.has("avatar/" + src)) return "avatar/" + src;
    return null;
  }
  function normEmblem(em) {
    const d = DEF_EMBLEM, e = Object.assign({}, d, em && typeof em === "object" ? em : {});
    const legacy = e.name === "Trường Đại học Kỹ thuật Tổ Ong" || e.wordmark === "TỔ ONG" || e.short === "KTO";
    if (e.name === "Trường Đại học Kỹ thuật Tổ Ong") e.name = d.name;
    if (e.short === "KTO") e.short = d.short;
    if (e.wordmark === "TỔ ONG") e.wordmark = d.wordmark;
    if (legacy && e.year === "2026") e.year = d.year;
    if (legacy && e.accent === "#f6e7c8") e.accent = d.accent;
    if (e.logo) {
      const p = knownPath(e.logo);
      if (!p) {
        e.logo = d.logo;
        e.logoCrop = d.logoCrop;
      } else e.logo = p;
    }
    if (!(Array.isArray(e.logoCrop) && e.logoCrop.length === 4 && e.logoCrop.every((n) => typeof n === "number"))) e.logoCrop = d.logoCrop;
    return e;
  }
  var emblemCache = /* @__PURE__ */ new Map();
  function emblemFor(em) {
    const e = normEmblem(em), key = JSON.stringify(e);
    if (emblemCache.has(key)) return emblemCache.get(key);
    const c = drawEmblem(e);
    if (!e.logo || cachedImage(e.logo) || readyFlag) {
      if (emblemCache.size > 64) emblemCache.clear();
      emblemCache.set(key, c);
    }
    return c;
  }
  function drawEmblem2(em, size) {
    return size ? drawEmblem(normEmblem(em), size) : emblemFor(em);
  }
  function drawStudentCard2(card, emblemCanvas, emblem) {
    return drawStudentCard(card, emblem ? emblemFor(emblem) : emblemCanvas, emblem ? normEmblem(emblem) : emblem);
  }
  var BUILDERS2 = {};
  for (const [slot, fn] of Object.entries(BUILDERS)) {
    BUILDERS2[slot] = (ctx) => {
      let item = ctx.item;
      const base = item && ITEMS2.get(item.id);
      if (base && base.fixedColors) item = Object.assign({}, item, { colors: Object.assign({}, base.colors) });
      const imgs = {};
      for (const [k, v] of Object.entries(item && item.textures || {})) {
        const im = cachedImage(knownPath(v));
        if (im) imgs[k] = im;
      }
      for (const [k, v] of Object.entries(ctx.imgs || {})) if (v) imgs[k] = v;
      const emblem = normEmblem(ctx.emblem);
      return fn(Object.assign({}, ctx, { item, imgs, emblem, emblemCanvas: emblemFor(emblem) }));
    };
  }
  function normalizeState(s) {
    const d = catalog_default.defaults;
    s = s && typeof s === "object" ? s : {};
    const equipped = Object.assign({}, d.equipped);
    for (const [slot, id] of Object.entries(s.equipped || {})) {
      if (!(slot in d.equipped)) continue;
      if (id === null) equipped[slot] = null;
      else if (ITEMS2.has(id) && ITEMS2.get(id).slot === slot) equipped[slot] = id;
    }
    const overrides = {};
    for (const [id, ov] of Object.entries(s.overrides || {})) {
      const it = ITEMS2.get(id);
      if (it && !it.fixedColors && ov && ov.colors && typeof ov.colors === "object") overrides[id] = { colors: ov.colors };
    }
    const out = { body: Object.assign({}, d.body, s.body || {}), equipped, overrides };
    if (s.emblem) out.emblem = normEmblem(s.emblem);
    return out;
  }
  return __toCommonJS(kit_exports);
})();
