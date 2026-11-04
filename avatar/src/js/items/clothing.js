// =============================================================
//  clothing.js — tóc, áo, quần/váy LIỀN KHỐI, ôm theo cơ thể
//
//  Mỗi món được sinh từ chính các chi tiết SDF của cơ thể (bodyModel),
//  nới rộng ra một khoảng, rồi cắt ở gấu / cổ / cổ tay. Vì vậy:
//   • tay áo nối liền thân áo, ống quần nối liền cạp quần
//   • đồ luôn ôm theo dáng người (thon / vừa / đậm)
//   • áo, quần là SkinnedMesh dùng chung xương với cơ thể → cử động cùng nhau
// =============================================================
import * as THREE from 'three';
import { DIM, trunkRadius, lowpolyMat } from '../rig.js';
import { smin, ellipsoid, roundCone, torusY, surfaceNets, relax, skinByDistance, segT } from '../sdf.js';
import { composeGarment, composePlain, composeSleeve, composeTopAtlas, toTexture, shade } from '../textures.js';

const TAU = Math.PI * 2;
const wrap = (u) => u - Math.floor(u);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// Lưới dùng lại giữa các lần mặc (chỉ phụ thuộc kiểu dáng, không phụ thuộc màu)
const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) { const g = make(); g.userData.keep = true; geoCache.set(key, g); }
  return geoCache.get(key);
}

/**
 * Gán UV cho từng tam giác (lưới không index).
 * uvOf trả [u, v, chuKỳ, gốc, kẹp] — chuKỳ/gốc dùng để vá đường nối vòng quanh.
 */
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
      if (clampIt) for (const p of tri) p[0] = Math.min(p[0], origin + period - 0.001);
    }
    tri.forEach((p, k) => { uv[(t + k) * 2] = p[0]; uv[(t + k) * 2 + 1] = p[1]; });
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

function garmentMaterial(canvas, extra = {}) {
  const tex = toTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0, ...extra });
}

function skinnedPart(geo, mat) {
  const m = new THREE.SkinnedMesh(geo, mat);
  m.castShadow = true;
  return { skinned: m };
}

// ---------------------------------------------------------- TÓC
// Tóc = đầu nới dày ra, cắt theo đường chân tóc, cộng thêm mái / búi / đuôi.
// Gắn cứng vào xương đầu.
function hairGeometry(M, style, hatOn) {
  const H = M.head;
  const C = H.cranium.c;
  const tight = style === 'cua' || style === 'buoc' || style === 'bui';
  const longish = style === 'bob' || style === 'dai';
  const field = (x, y, z) => {
    const rel = y - C[1];
    let t = style === 'cua' ? 0.006 : (tight ? 0.009 : 0.012);
    if (hatOn) t = Math.min(t, 0.008);
    if (longish) t += 0.018 * smooth(0.04, -0.07, rel);
    let d = M.headSDF(x, y, z, t, { features: false });
    // đường chân tóc: cao ở trán, thấp ở gáy
    const th = Math.atan2(x, z - C[2]);
    let hl = 0.052 * Math.cos(th) - 0.008 + (style === 'cua' ? 0.012 : 0);
    if (longish) hl = Math.min(hl, -0.075);
    d = Math.max(d, hl - rel);
    if (longish) {
      // chừa khuôn mặt
      const face = Math.max(0.03 - (z - C[2]), Math.abs(x) - 0.077, rel - 0.058);
      d = Math.max(d, -face);
    }
    // mái
    if (style === 'ngan' || longish || style === 'buoc' || style === 'bui') {
      d = smin(d, ellipsoid(x, y, z, [C[0], C[1] + 0.058, C[2] + 0.084], [longish ? 0.085 : 0.08, 0.026, 0.034]), 0.028);
    }
    if (style === 'mai-lech') {
      d = smin(d, ellipsoid(x, y, z, [C[0] + 0.02, C[1] + 0.078, C[2] + 0.08], [0.085, 0.028, 0.036]), 0.03);
      d = smin(d, ellipsoid(x, y, z, [C[0] - 0.045, C[1] + 0.06, C[2] + 0.085], [0.03, 0.035, 0.03]), 0.025);
    }
    if (!hatOn && (style === 'ngan' || style === 'mai-lech')) {
      d = smin(d, ellipsoid(x, y, z, [C[0] - (style === 'mai-lech' ? 0.02 : 0), C[1] + 0.09, C[2] + 0.01], [0.098, 0.052, 0.1]), 0.045);
    }
    if (style === 'dai') {
      d = smin(d, roundCone(x * 0.62, y, z, [0, C[1] - 0.03, C[2] - 0.088], [0, C[1] - 0.36, C[2] - 0.13], 0.07, 0.05), 0.05);
    }
    if (style === 'buoc') {
      d = smin(d, roundCone(x, y, z, [0, C[1] + 0.01, C[2] - 0.13], [0, C[1] - 0.22, C[2] - 0.17], 0.034, 0.018), 0.02);
    }
    if (style === 'bui' && !hatOn) d = smin(d, ellipsoid(x, y, z, [0, C[1] + 0.125, C[2] - 0.05], [0.052, 0.046, 0.05]), 0.03);
    return d;
  };
  const down = style === 'dai' ? 0.44 : style === 'buoc' ? 0.3 : 0.16;
  const g = surfaceNets(field, [C[0] - 0.17, C[1] - down, C[2] - 0.22], [C[0] + 0.17, C[1] + 0.2, C[2] + 0.17], 0.0072);
  relax(g, 1, 0.35);
  g.translate(-H.bone[0], -H.bone[1], -H.bone[2]); // về hệ toạ độ xương đầu
  return g;
}

export function buildHair(ctx) {
  const { item, rig } = ctx;
  const style = item.options?.style || 'ngan';
  const hatOn = !!ctx.hatOn;
  const M = rig.model;
  const geo = cached(`hair|${M.name}|${style}|${hatOn}`, () => hairGeometry(M, style, hatOn));
  const mat = new THREE.MeshStandardMaterial({ color: item.colors.main, roughness: 0.62, flatShading: true });
  const hair = new THREE.Mesh(geo, mat);
  const g = new THREE.Group();
  g.add(hair);
  if (style === 'buoc') {
    const C = M.head.cranium.c, hb = M.head.bone;
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12), lowpolyMat(item.colors.accent || '#d24b6a'));
    tie.position.set(0, C[1] - hb[1] - 0.005, C[2] - 0.135);
    tie.rotation.x = Math.PI / 2 - 0.25;
    g.add(tie);
  }
  return { parts: [{ joint: 'head', obj: g }] };
}

// ---------------------------------------------------------- ÁO
function topGeometry(M, o) {
  const P = M.P[1];
  const jacket = (o.collar === 'hood' && o.zipper) || o.collar === 'stand';
  const base = jacket ? 0.017 : (o.collar === 'hood' || (o.sleeve === 'long' && o.cuffs && !o.placket) ? 0.017 : 0.014);
  const hemY = P + (o.tucked ? 0.035 : -0.095);
  const fullArm = DIM.upperArm + DIM.foreArm;
  const sleeveLen = o.sleeve === 'long' ? fullArm - 0.025 : (o.sleeve === 'none' ? 0 : 0.15);
  const neckFront = o.collar === 'hood' ? 0.475 : 0.488;
  const neckY = (z) => P + neckFront + 0.02 - 0.03 * clamp01((z + 0.02) / 0.08);

  const field = (x, y, z) => {
    // áo bỏ ngoài: dày hơn quanh hông để phủ kín cạp quần
    const flare = o.tucked ? 0 : 0.013 * smooth(P + 0.15, P + 0.08, y);
    let d = M.trunk(x, y, z, base + flare);
    for (const s of ['L', 'R']) {
      d = smin(d, M.deltoid(s, x, y, z, base * 0.6), 0.04);
      if (!o.tucked) {
        d = smin(d, M.glute(s, x, y, z, base + flare - 0.002), 0.04);
        if (y > hemY - 0.02) d = smin(d, M.leg(s, x, y, z, base + flare + 0.004, { thighOnly: true }), 0.03);
      }
    }
    if (sleeveLen > 0) {
      for (const s of ['L', 'R']) {
        const A = M.arms[s];
        const st = segT(x, y, z, A.sh, A.wr) * fullArm;
        const loose = (o.sleeve === 'long' ? 0.011 : 0.012) + (o.sleeve === 'short' ? 0.008 * smooth(0.05, 0.15, st) : 0) + (jacket ? 0.004 : 0);
        let a = M.arm(s, x, y, z, loose, { upTo: sleeveLen, withHand: false });
        a = Math.max(a, st - sleeveLen);
        d = smin(d, a, 0.02);
      }
    }
    d = Math.max(d, hemY - y);       // gấu
    d = Math.max(d, y - neckY(z));   // cổ
    if (o.vneck) d = Math.max(d, -Math.max(P + 0.395 + 1.5 * Math.abs(x) - y, 0.03 - z));
    if (o.collar === 'polo' || o.collar === 'shirt') {
      d = smin(d, torusY(x, y, z, [0, P + 0.497, 0.004], 0.064, 0.014, 1.06, 0.92), 0.012);
    } else if (o.collar === 'crew') {
      d = smin(d, torusY(x, y, z, [0, neckY(0.06) - 0.004, 0.006], 0.057, 0.0085, 1.02, 0.95), 0.008);
    } else if (o.collar === 'stand') {
      const ring = Math.max(Math.abs(Math.hypot(x, (z - 0.004) * 1.05) - 0.064) - 0.009, Math.abs(y - (P + 0.515)) - 0.032);
      d = smin(d, ring, 0.012);
    } else if (o.collar === 'hood') {
      d = smin(d, ellipsoid(x, y, z, [0, P + 0.525, -0.098], [0.118, 0.088, 0.072]), 0.035);
      d = smin(d, torusY(x, y, z, [0, P + 0.49, 0.0], 0.068, 0.014, 1.05, 0.95), 0.015);
    }
    return d;
  };
  const g = surfaceNets(field, [-0.43, P - 0.2, -0.27], [0.43, P + 0.64, 0.25], 0.0095);
  relax(g, 1, 0.4);
  skinByDistance(g, M.segments);

  return perTriangleUV(g, (x, y, z, cx, cy, cz) => {
    if (sleeveLen > 0) {
      for (const s of ['L', 'R']) {
        const A = M.arms[s];
        if (Math.sign(cx) !== A.s) continue;
        const tFrac = segT(cx, cy, cz, A.sh, A.wr);
        if (tFrac > 0.06 && M.arm(s, cx, cy, cz) < M.trunk(cx, cy, cz) - 0.01) {
          const st = segT(x, y, z, A.sh, A.wr);
          const ax = A.sh[0] + (A.wr[0] - A.sh[0]) * st, az = A.sh[2] + (A.wr[2] - A.sh[2]) * st;
          const th = Math.atan2(x - ax, z - az);
          const ul = wrap(s === 'L' ? (th + Math.PI / 2) / TAU : (th - Math.PI / 2) / TAU);
          const f = clamp01((st * fullArm) / Math.max(sleeveLen, 0.01));
          return [(s === 'L' ? 0 : 0.5) + 0.5 * ul, 0.5 * (1 - f), 0.5, s === 'L' ? 0 : 0.5, true];
        }
      }
    }
    const th = Math.atan2(x / M.b.sx, z / M.b.sz);
    const v = clamp01((y - hemY) / (neckY(z) - hemY));
    return [wrap(0.25 + th / TAU), 0.5 + 0.5 * v, 1, 0, false];
  });
}

export function buildTop(ctx) {
  const { item, rig, imgs, emblemCanvas, emblem } = ctx;
  const o = item.options || {};
  const M = rig.model;
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
  const trim = item.colors.trim || '#ffffff';
  const printColor = item.colors.print || '#ffffff';

  const keyOpts = { sleeve: o.sleeve, collar: o.collar, tucked: o.tucked, zipper: o.zipper, cuffs: o.cuffs, placket: !!o.placket, vneck: o.vneck };
  const geo = cached(`top|${M.name}|${JSON.stringify(keyOpts)}`, () => topGeometry(M, o));

  const bodyCanvas = composeGarment({
    color: main, accent, imgs, trim, printColor,
    emblem: item.emblem ? emblemCanvas : null, emblemPos: item.emblem,
    stripes: o.stripes, placket: o.placket, zipper: o.zipper, zipperColor: item.colors.zipper, pocket: o.pocket, kangaroo: o.kangaroo,
    patternScale: o.patternScale,
    piping: o.piping, sidePiping: o.sidePiping, weltPockets: o.weltPockets, hemBand: o.hemBand,
    vneck: o.vneck ? [accent, trim] : null, plaid: o.plaid, breton: o.breton,
    wordmark: o.wordmark, wordmarkText: emblem?.wordmark, wordmarkBack: o.wordmarkBack,
    archText: o.arch ? (emblem?.name || '') : null, archSub: o.arch ? emblem?.short : null,
  });
  if (o.collarAccent) { // cổ áo phối màu
    const c = bodyCanvas.getContext('2d');
    c.fillStyle = accent; c.fillRect(0, 0, 1024, 18);
  }
  const sleeveColor = o.accentSleeves ? accent : main;
  const sl = { cuff: o.cuffs && o.sleeve === 'long', hem: o.sleeve === 'short', sleeveStripes: o.sleeveStripes, trim, plaid: o.plaid, breton: o.breton, patternScale: o.patternScale };
  const sleeveImgs = o.accentSleeves ? {} : { pattern: imgs.pattern };
  const left = composeSleeve(sleeveColor, sleeveImgs, { ...sl, emblem: o.sleeveEmblem ? emblemCanvas : null });
  const right = composeSleeve(sleeveColor, sleeveImgs, sl);
  const parts = [skinnedPart(geo, garmentMaterial(composeTopAtlas(bodyCanvas, left, right)))];

  if (o.collar === 'hood' && !o.zipper) { // dây rút mũ hoodie
    const g = new THREE.Group();
    const cordMat = lowpolyMat('#f2f2f2', { flatShading: false });
    for (const s of [-1, 1]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.13, 6), cordMat);
      cord.position.set(s * 0.032, 0.425, trunkRadius(0.425) * M.b.sz + 0.026);
      g.add(cord);
    }
    parts.push({ joint: 'torso', obj: g });
  }
  return { parts };
}

// ---------------------------------------------------------- QUẦN / VÁY
function bottomGeometry(M, o) {
  const P = M.P[1];
  const fitT = { slim: 0.008, regular: 0.013, wide: 0.02 }[o.fit || 'regular'];
  const waistTop = P + 0.078;
  const length = o.length || 'full';

  const field = (x, y, z) => {
    let d = M.trunk(x, y, z, 0.021);
    for (const s of ['L', 'R']) d = smin(d, M.glute(s, x, y, z, 0.016), 0.04);
    if (o.skirt) {
      d = Math.max(d, P - 0.035 - y); // cạp váy
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
      for (const s of ['L', 'R']) {
        const G = M.legs[s];
        let lg;
        if (length === 'shorts') {
          lg = M.leg(s, x, y, z, fitT + 0.008, { thighOnly: true, flare: 0.02 });
          lg = Math.max(lg, (G.kn[1] + 0.16) - y);
        } else {
          const flare = o.fit === 'wide' ? 0.03 : (o.cuff ? -0.012 : 0.002);
          lg = M.leg(s, x, y, z, fitT, { flare });
          lg = Math.max(lg, (G.an[1] + (length === 'capri' ? 0.16 : 0.035)) - y);
        }
        d = smin(d, lg, 0.03);
      }
    }
    return Math.max(d, y - waistTop);
  };
  const g = surfaceNets(field, [-0.36, -0.02, -0.25], [0.36, P + 0.1, 0.25], o.skirt ? 0.0085 : 0.0095);
  relax(g, 1, 0.4);
  skinByDistance(g, M.segments);
  return perTriangleUV(g, (x, y, z, cx, cy) => {
    if (!o.skirt && cy < P - 0.1) {
      const G = M.legs[cx >= 0 ? 'L' : 'R'];
      const th = Math.atan2(x - G.hp[0], z);
      const u = wrap(G.s > 0 ? (th - Math.PI / 2) / TAU : (th + Math.PI / 2) / TAU);
      return [u, y * 2.4, 1, 0, false];
    }
    const th = Math.atan2(x / M.b.sx, z / M.b.sz);
    return [wrap((th - Math.PI / 2) / TAU), y * 2.4, 1, 0, false];
  });
}

export function buildBottom(ctx) {
  const { item, rig, imgs } = ctx;
  const o = item.options || {};
  const M = rig.model;
  const main = item.colors.main, accent = item.colors.accent || shade(main, 0.4);
  const keyOpts = { skirt: o.skirt, skirtLen: o.skirtLen, pleats: o.pleats, fit: o.fit, length: o.length, cuff: o.cuff };
  const geo = cached(`bottom|${M.name}|${JSON.stringify(keyOpts)}`, () => bottomGeometry(M, o));
  const plain = composePlain(main, imgs, { denim: o.denim, sideStripe: o.sideStripe ? accent : null, patternScale: o.patternScale });
  const mat = garmentMaterial(plain, { roughness: o.denim ? 0.95 : 0.88 });
  mat.map.wrapT = THREE.RepeatWrapping;
  const parts = [skinnedPart(geo, mat)];

  const b = M.b, kz = Math.min(b.sx, b.sz);
  if (!o.skirt && o.belt !== false) { // thắt lưng — chỉ lộ ra khi áo sơ vin
    const g = new THREE.Group();
    const r = trunkRadius(0.058) + 0.025 / kz;
    const beltG = new THREE.CylinderGeometry(1, 1, 0.028, 28, 1, true);
    beltG.scale(r * b.sx, 1, r * b.sz);
    g.add(new THREE.Mesh(beltG, lowpolyMat('#2a2420', { side: THREE.DoubleSide, flatShading: false })));
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.03, 0.008), lowpolyMat('#c9b98f', { metalness: 0.6, roughness: 0.35, flatShading: false }));
    buckle.position.set(0, 0, r * b.sz + 0.004);
    g.add(buckle);
    g.position.y = 0.058;
    g.userData.belt = true; // studio chỉ hiện khi áo sơ vin
    parts.push({ joint: 'torso', obj: g });
  }
  if (o.cargo) { // túi hộp
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const holder = new THREE.Group();
      const pk = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.11, 0.1), lowpolyMat(shade(main, -0.05)));
      pk.position.set(s * 0.08 * b.limb, -0.27, 0);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.104), lowpolyMat(shade(main, -0.12)));
      flap.position.set(s * 0.082 * b.limb, -0.215, 0);
      holder.add(pk, flap);
      parts.push({ joint: 'hip' + side, obj: holder });
    }
  }
  return { parts };
}
