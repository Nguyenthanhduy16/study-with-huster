// =============================================================
//  rig.js — cơ thể LIỀN KHỐI có xương (đơn vị: mét)
//  Nhân vật nhìn về +Z. Bên TRÁI của nhân vật = +X.
//
//  Hình cơ thể là một SDF duy nhất (thân, vai, cổ, đầu, tay, chân hợp mềm),
//  được lưới hoá bằng Surface Nets rồi gắn vào bộ xương (SkinnedMesh).
//  Quần áo dùng lại chính các "chi tiết" này, nới rộng ra → ôm sát người.
// =============================================================
import * as THREE from 'three';
import { smin, ellipsoid, roundCone, roundBox, surfaceNets, relax, segDist, segT } from './sdf.js';

export const DIM = {
  pelvisY: 0.965,     // khớp hông so với mặt đất
  thigh: 0.43,
  shin: 0.42,
  upperArm: 0.28,
  foreArm: 0.25,
  shoulderY: 0.40,    // vai so với khung chậu
  headY: 0.572,       // gốc xương đầu so với khung chậu
  headR: 0.115,
};

// Dáng người → hệ số bề ngang / độ dày thân
export const BUILDS = {
  thon: { sx: 1.0, sz: 0.62, limb: 0.92 },
  vua: { sx: 1.1, sz: 0.66, limb: 1.0 },
  dam: { sx: 1.22, sz: 0.74, limb: 1.12 },
};

// Hồ sơ bán kính thân theo chiều cao (từ đáy chậu lên cổ)
const PROFILE = [
  [-0.13, 0.10], [-0.08, 0.14], [-0.02, 0.148], [0.05, 0.142], [0.12, 0.134],
  [0.20, 0.142], [0.28, 0.16], [0.36, 0.17], [0.42, 0.164], [0.47, 0.125], [0.51, 0.06],
];
export function trunkRadius(y) {
  const P = PROFILE;
  if (y <= P[0][0]) return P[0][1];
  if (y >= P[P.length - 1][0]) return P[P.length - 1][1];
  let i = 0; while (P[i + 1][0] < y) i++;
  const p0 = P[Math.max(0, i - 1)][1], p1 = P[i][1], p2 = P[i + 1][1], p3 = P[Math.min(P.length - 1, i + 2)][1];
  const t = (y - P[i][0]) / (P[i + 1][0] - P[i][0]);
  // Catmull-Rom cho đường cong mượt
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}

/**
 * Vỏ thân (Lathe) từ y0 → y1, nới rộng thêm `offset`.
 * UV: u=0.25 giữa ngực, u=0.75 giữa lưng; v=0 dưới, v=1 trên.
 */
export function trunkShell(y0, y1, offset, build, { steps = 12, segs = 16, flare = 0, capTop = 0, capBottom = false } = {}) {
  const pts = [];
  if (capBottom) pts.push(new THREE.Vector2(0.001, y0 - 0.01));
  for (let i = 0; i <= steps; i++) {
    const y = y0 + (y1 - y0) * i / steps;
    const f = flare * Math.pow(1 - i / steps, 2);   // loe gấu áo / váy
    pts.push(new THREE.Vector2(trunkRadius(y) + offset + f, y));
  }
  if (capTop) pts.push(new THREE.Vector2(capTop, y1 + 0.004));
  const g = new THREE.LatheGeometry(pts, segs, -Math.PI / 2, Math.PI * 2);
  g.scale(build.sx, 1, build.sz);
  return g;
}

// Đoạn chi: trụ thuôn, gốc tại khớp, kéo xuống -Y
export function limb(len, rTop, rBot, mat, radial = 8, openEnded = false) {
  const g = new THREE.CylinderGeometry(rTop, rBot, len, radial, 1, openEnded);
  g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

export function lowpolyMat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, flatShading: true, ...extra });
}

// -------------------------------------------------------------------
//  MÔ HÌNH CƠ THỂ: vị trí khớp lúc đứng nghỉ + các chi tiết SDF
// -------------------------------------------------------------------
const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

const modelCache = new Map();

/** Thông số hình học (dùng chung cho cơ thể, quần áo, tóc) */
export function bodyModel(buildName = 'vua') {
  if (modelCache.has(buildName)) return modelCache.get(buildName);
  const b = BUILDS[buildName] || BUILDS.vua;
  const L = b.limb;
  const P = [0, DIM.pelvisY, 0];
  const shoulderX = trunkRadius(DIM.shoulderY + 0.02) * b.sx + 0.03;
  const kz = Math.min(b.sx, b.sz);

  const arms = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const sh = [s * shoulderX, P[1] + DIM.shoulderY, 0];
    const dir = rotZ([0, -1, 0], s * 0.09);
    const el = add(sh, dir, DIM.upperArm);
    const wr = add(el, dir, DIM.foreArm);
    // ma trận nghịch của cổ tay (Rz(s·0.09)·Ry(s·0.25)) để đặt bàn tay trong hệ cục bộ
    const az = -s * 0.09, ay = -s * 0.25;
    arms[side] = {
      s, sh, el, wr, dir,
      upper: [0.05 * L, 0.04 * L], fore: [0.04 * L, 0.031 * L],
      deltoid: { c: add(sh, [s * 0.004, -0.028, 0]), r: [0.06 * L, 0.078 * L, 0.062 * L] },
      toLocal(x, y, z) {
        let px = x - wr[0], py = y - wr[1], pz = z - wr[2];
        // Rz^-1
        const cz = Math.cos(az), sz = Math.sin(az);
        const x1 = px * cz - py * sz, y1 = px * sz + py * cz;
        // Ry^-1
        const cy = Math.cos(ay), sy = Math.sin(ay);
        return [x1 * cy + pz * sy, y1, -x1 * sy + pz * cy];
      },
    };
  }
  const legs = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const hp = [s * 0.083 * b.sx, P[1] - 0.045, 0];
    const kn = [hp[0], hp[1] - DIM.thigh, 0];
    const an = [hp[0], kn[1] - DIM.shin, 0];
    legs[side] = {
      s, hp, kn, an,
      thigh: { a: add(hp, [0, 0.05, 0]), r: [0.084 * L, 0.056 * L] },
      shin: [0.055 * L, 0.036 * L],
      calf: { c: add(kn, [0, -0.13, -0.014]), r: [0.05 * L, 0.11, 0.05 * L] },
      glute: { c: [s * 0.062 * b.sx, P[1] - 0.055, -0.05 * b.sz / 0.66], r: [0.074 * b.sx / 1.1, 0.085, 0.07 * b.sz / 0.66] },
    };
  }
  const headBone = [0, P[1] + DIM.headY, 0];
  const head = {
    bone: headBone,
    cranium: { c: add(headBone, [0, 0.115, 0]), r: [0.1, 0.113, 0.11] },
    jaw: { c: add(headBone, [0, 0.062, 0.026]), r: [0.074, 0.07, 0.08] },
    nose: { c: add(headBone, [0, 0.086, 0.106]), r: [0.013, 0.021, 0.016] },
    ears: [1, -1].map((s) => ({ c: add(headBone, [s * 0.098, 0.11, -0.006]), r: [0.013, 0.03, 0.02] })),
    neck: { a: [0, P[1] + 0.44, 0], b: [0, P[1] + 0.64, 0.004], r: [0.052, 0.045] },
  };

  // ---- các hàm SDF thành phần (toạ độ "rig" lúc đứng nghỉ)
  function trunk(x, y, z, inflate = 0) {
    const ty = y - P[1];
    const yc = Math.min(0.51, Math.max(-0.13, ty));
    const q = Math.sqrt((x / b.sx) ** 2 + (z / b.sz) ** 2);
    const dr = (q - trunkRadius(yc)) * kz - inflate;
    const dy = Math.max(-0.13 - ty, ty - 0.51);
    return dy > 0 ? Math.hypot(Math.max(dr, 0), dy) + Math.min(Math.max(dr, dy), 0) : dr;
  }
  function hand(arm, x, y, z) {
    const [lx, ly, lz] = arm.toLocal(x, y, z);
    const s = arm.s;
    const palm = roundBox(lx, ly + 0.048, lz - 0.002, [0.015, 0.036, 0.033], 0.013);
    const fing = roundBox(lx + s * 0.005, ly + 0.108, lz - 0.004, [0.012, 0.034, 0.03], 0.011);
    const thumb = roundCone(lx, ly, lz, [-s * 0.01, -0.03, 0.026], [-s * 0.016, -0.074, 0.04], 0.012, 0.009);
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
  function foot(leg, x, y, z) {
    const px = x - leg.an[0], py = y - leg.an[1], pz = z - leg.an[2];
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
      ellipsoid(x, y, z, H.jaw.c, H.jaw.r.map((r) => r + inflate)), 0.05);
    if (features) {
      d = smin(d, ellipsoid(x, y, z, H.nose.c, H.nose.r), 0.014);
      for (const e of H.ears) d = smin(d, ellipsoid(x, y, z, e.c, e.r), 0.01);
    }
    return d;
  }
  function neck(x, y, z, inflate = 0) {
    return roundCone(x, y, z, head.neck.a, head.neck.b, head.neck.r[0] + inflate, head.neck.r[1] + inflate);
  }

  /** SDF toàn thân */
  function body(x, y, z) {
    let d = trunk(x, y, z);
    for (const s of ['L', 'R']) {
      d = smin(d, deltoid(s, x, y, z), 0.045);
      d = smin(d, glute(s, x, y, z), 0.04);
    }
    d = smin(d, neck(x, y, z), 0.04);
    d = smin(d, headSDF(x, y, z), 0.035);
    for (const s of ['L', 'R']) {
      d = smin(d, arm(s, x, y, z), 0.012);
      const lg = smin(leg(s, x, y, z), foot(legs[s], x, y, z), 0.025);
      d = smin(d, lg, 0.03);
    }
    return d;
  }

  // Đoạn xương để tính trọng số (index khớp với BONE_NAMES)
  const segments = [
    { bone: 0, a: add(P, [0, -0.1, 0]), b: add(P, [0, 0.46, 0]) },
    { bone: 1, a: add(P, [0, 0.6, 0]), b: add(P, [0, 0.8, 0]) },
  ];
  ['L', 'R'].forEach((s, k) => {
    const A = arms[s], base = 2 + k * 3;
    segments.push({ bone: base, a: A.sh, b: A.el }, { bone: base + 1, a: A.el, b: A.wr }, { bone: base + 2, a: A.wr, b: add(A.wr, A.dir, 0.12) });
  });
  ['L', 'R'].forEach((s, k) => {
    const G = legs[s], base = 8 + k * 3;
    segments.push({ bone: base, a: G.hp, b: G.kn }, { bone: base + 1, a: G.kn, b: G.an }, { bone: base + 2, a: G.an, b: add(G.an, [0, -0.04, 0.14]) });
  });

  const model = { name: buildName, b, L, P, shoulderX, arms, legs, head, segments, trunk, arm, deltoid, leg, glute, foot, hand, headSDF, neck, body };
  modelCache.set(buildName, model);
  return model;
}

export const BONE_NAMES = ['torso', 'head', 'shoulderL', 'elbowL', 'wristL', 'shoulderR', 'elbowR', 'wristR', 'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR'];

// Lưới cơ thể (cache theo dáng người — đổi màu da không cần dựng lại)
const bodyGeoCache = new Map();

// Chỉ trộn xương trong cùng bộ phận và các khớp nối trực tiếp.
// Nếu xét toàn bộ xương theo khoảng cách, cổ tay gần hông sẽ kéo da hông
// ra khỏi quần/váy khi nhân vật cầm đồ, dù quần áo đã có trọng số đúng.
function skinBody(geo, M) {
  const p = geo.attributes.position, count = p.count;
  const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const distances = [
      Math.min(M.trunk(x, y, z), M.neck(x, y, z), M.glute('L', x, y, z), M.glute('R', x, y, z)),
      M.headSDF(x, y, z),
      Math.min(M.arm('L', x, y, z), M.deltoid('L', x, y, z)),
      Math.min(M.arm('R', x, y, z), M.deltoid('R', x, y, z)),
      Math.min(M.leg('L', x, y, z), M.foot(M.legs.L, x, y, z)),
      Math.min(M.leg('R', x, y, z), M.foot(M.legs.R, x, y, z)),
    ];
    let region = 0;
    for (let k = 1; k < distances.length; k++) if (distances[k] < distances[region]) region = k;
    const allowed = new Set();
    const addChain = (base) => { allowed.add(base); allowed.add(base + 1); allowed.add(base + 2); };
    if (region === 0) {
      allowed.add(0);
      if (y > M.P[1] + 0.47) allowed.add(1);
      if (y > M.P[1] + 0.24) {
        if (distances[2] - distances[0] < 0.04) addChain(2);
        if (distances[3] - distances[0] < 0.04) addChain(5);
      }
      if (y < M.P[1] + 0.08) { addChain(8); addChain(11); }
    } else if (region === 1) {
      allowed.add(1);
      if (y < M.P[1] + 0.66) allowed.add(0);
    } else if (region === 2 || region === 3) {
      const side = region === 2 ? 'L' : 'R', arm = M.arms[side];
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
    candidates.forEach((entry, k) => { indices[i * 4 + k] = entry.bone; weights[i * 4 + k] = entry.weight / sum; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
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

/** Gắn một SkinnedMesh (cơ thể / quần áo / tóc) vào bộ xương của rig */
export function attachSkinned(rig, mesh) {
  // [r128] vật liệu của SkinnedMesh phải bật skinning
  for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) { m.skinning = true; m.needsUpdate = true; }
  rig.root.add(mesh);
  rig.root.updateMatrixWorld(true);
  mesh.bind(rig.skeleton, mesh.matrixWorld);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

/** [r128] three r128 không tự đổi màu hex (sRGB) sang tuyến tính như bản mới → đổi một lần cho mọi vật liệu */
export function linearize(obj) {
  obj.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      if (m.userData.lin) continue;
      m.userData.lin = true;
      if (m.color) m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear();
    }
  });
  return obj;
}

export const BODY_GEOMETRY = (buildName) => bodyGeometry(bodyModel(buildName));

/**
 * body = { skin, build: 'thon'|'vua'|'dam', height, browColor, eyeColor }
 * Trả về { root, joints, skeleton, model, build, materials }
 */
export function buildRig(body = {}) {
  const model = bodyModel(body.build);
  const b = model.b;
  const skinColor = new THREE.Color(body.skin || '#e8b896');
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0 });
  const dark = new THREE.MeshStandardMaterial({ color: body.eyeColor || '#241a19', roughness: 0.25 });
  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
  const brow = new THREE.MeshStandardMaterial({ color: body.browColor || '#2a201c', roughness: 0.8 });
  const lip = new THREE.MeshStandardMaterial({ color: skinColor.clone().lerp(new THREE.Color('#a8424e'), 0.4), roughness: 0.55 });
  const blush = new THREE.MeshStandardMaterial({ color: skinColor.clone().lerp(new THREE.Color('#ff7a7a'), 0.35), transparent: true, opacity: 0.35, roughness: 0.8, depthWrite: false });

  const root = new THREE.Group();
  root.name = 'avatar';

  // ---- Bộ xương (cùng vị trí khớp với bodyModel)
  const bone = (name) => { const bn = new THREE.Bone(); bn.name = name; return bn; };
  const torso = bone('torso'); torso.position.y = DIM.pelvisY; root.add(torso);
  const head = bone('head'); head.position.y = DIM.headY; torso.add(head);
  const joints = { torso, head };
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const sh = bone('shoulder' + side);
    sh.position.set(s * model.shoulderX, DIM.shoulderY, 0);
    sh.rotation.z = s * 0.09;
    torso.add(sh);
    const el = bone('elbow' + side); el.position.y = -DIM.upperArm; sh.add(el);
    const wr = bone('wrist' + side); wr.position.y = -DIM.foreArm; wr.rotation.y = s * 0.25; el.add(wr);
    Object.assign(joints, { ['shoulder' + side]: sh, ['elbow' + side]: el, ['wrist' + side]: wr });
  }
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const hp = bone('hip' + side); hp.position.set(s * 0.083 * b.sx, -0.045, 0); torso.add(hp);
    const kn = bone('knee' + side); kn.position.y = -DIM.thigh; hp.add(kn);
    const an = bone('ankle' + side); an.position.y = -DIM.shin; kn.add(an);
    Object.assign(joints, { ['hip' + side]: hp, ['knee' + side]: kn, ['ankle' + side]: an });
  }
  root.scale.setScalar(body.height || 0.97);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(BONE_NAMES.map((n) => joints[n]));

  const rig = { root, joints, skeleton, model, build: b, body, materials: { skin, dark, brow, lip } };

  const bodyMesh = new THREE.SkinnedMesh(bodyGeometry(model), skin);
  bodyMesh.name = 'body';
  attachSkinned(rig, bodyMesh);
  rig.bodyMesh = bodyMesh;

  // ---- Gương mặt (gắn vào xương đầu)
  const face = new THREE.Group();
  face.name = 'face';
  head.add(face);
  for (const s of [-1, 1]) {
    const eyeG = new THREE.SphereGeometry(0.0155, 14, 10);
    eyeG.scale(1, 1.32, 0.5);
    const eye = new THREE.Mesh(eyeG, dark);
    eye.position.set(s * 0.037, 0.115, 0.099);
    eye.rotation.y = s * 0.3;
    face.add(eye);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.0038, 8, 6), white);
    hl.position.set(s * 0.037 + 0.005, 0.123, 0.1065);
    face.add(hl);
    const brG = new THREE.CapsuleGeometry(0.0042, 0.026, 3, 6);
    brG.rotateZ(Math.PI / 2);
    const br = new THREE.Mesh(brG, brow);
    br.position.set(s * 0.039, 0.148, 0.098);
    br.rotation.set(0, s * 0.35, -s * 0.12);
    face.add(br);
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.014, 14), blush);
    ch.position.set(s * 0.052, 0.088, 0.094);
    ch.rotation.y = s * 0.55;
    face.add(ch);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0028, 6, 12, Math.PI * 0.8), lip);
  mouth.rotation.z = Math.PI + Math.PI * 0.1;
  mouth.position.set(0, 0.061, 0.111);
  face.add(mouth);

  return rig;
}
