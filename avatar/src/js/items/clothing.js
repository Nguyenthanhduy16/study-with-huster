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
import { smin, ellipsoid, roundCone, torusY, surfaceNets, relax, skinByDistance, segDist, segT } from '../sdf.js';
import { composeGarment, composePlain, composeSleeve, composeTopAtlas, toTexture, shade, drawEmblem } from '../textures.js';

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

// Thân áo theo thân người; chỉ phần tay áo được nhận trọng số xương tay.
// Khoảng cách tới mọi xương sẽ khiến bàn tay ở gần hông kéo cả gấu áo/váy.
function skinTop(geo, M, options, garmentParts = null) {
  const fullArm = DIM.upperArm + DIM.foreArm;
  const sleeveLen = options.sleeve === 'long' ? fullArm - 0.025 : options.sleeve === 'none' ? 0 : 0.15;
  const p = geo.attributes.position;
  const indices = new Uint16Array(p.count * 4), weights = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const trunk = Math.min(M.trunk(x, y, z), M.neck(x, y, z), M.glute('L', x, y, z), M.glute('R', x, y, z));
    const arms = ['L', 'R'].map(side => {
      const A = M.arms[side], along = segT(x, y, z, A.sh, A.wr) * fullArm;
      // Restrict influence to the actual sleeve. A wrist next to the waist
      // must never pull the hem up when the avatar raises an arm.
      return Math.max(Math.min(M.arm(side, x, y, z, 0, { upTo: sleeveLen, withHand: false }),
        M.deltoid(side, x, y, z)), along - sleeveLen);
    });
    const sideIndex = arms[0] <= arms[1] ? 0 : 1, side = sideIndex === 0 ? 'L' : 'R';
    // Include the deltoid, then blend continuously through the armpit instead
    // of switching chains abruptly (which stretches a triangle into a spike).
    const shoulderBlend = smooth(M.P[1] + 0.20, M.P[1] + 0.28, y);
    let blend = sleeveLen ? smooth(-0.035 * shoulderBlend, 0.035, trunk - arms[sideIndex]) : 0;
    if (options.sleeve === 'long' && garmentParts) {
      // Use the SAME inflated surfaces as the geometric slit. Body-distance
      // classification differs at the flared hem and would weld the new cap
      // back to the torso through partial forearm weights.
      const parts = garmentParts(x, y, z);
      const separated = 1 - smooth(M.P[1] + 0.20, M.P[1] + 0.30, y);
      const width = 0.006 + 0.035 * (1 - separated);
      const sleeveWeight = smooth(-width, width, parts.trunk - Math.min(...parts.arms));
      blend = blend * (1 - separated) + sleeveWeight * separated;
    }
    const base = side === 'L' ? 2 : 5;
    const candidates = M.segments.filter(s => s.bone >= base && s.bone <= base + 2).map(s => {
      const d = segDist(x, y, z, s.a, s.b); return { bone: s.bone, w: 1 / Math.pow(d * d + 1e-4, 2) };
    });
    const sum = candidates.reduce((n, s) => n + s.w, 0);
    indices[i * 4] = 0; weights[i * 4] = 1 - blend;
    candidates.forEach((s, k) => { indices[i * 4 + k + 1] = s.bone; weights[i * 4 + k + 1] = blend * s.w / sum; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  return geo;
}

// ---------------------------------------------------------- TÓC
// Tóc = đầu nới dày ra, cắt theo đường chân tóc, cộng thêm mái / búi / đuôi.
// Gắn cứng vào xương đầu.
function hairGeometry(M, style, hatOn) {
  const H = M.head;
  const C = H.cranium.c;
  if (style === 'moi' || style === 'moi-nape') {
    const nape = style === 'moi-nape';
    // Build strand endpoints once, not for every cell sampled by Surface Nets.
    const locks = nape ? Array.from({ length: 9 }, (_, k) => {
      const i = k - 4, ax = i * 0.019, length = 0.192 + 0.025 * Math.cos(i * 1.9);
      return [[C[0] + ax, C[1] - 0.09, C[2] - 0.104],
        [C[0] + ax + Math.sin(i * 2.1) * 0.011, C[1] - length, C[2] - 0.119 - 0.009 * Math.cos(i)]];
    }) : Array.from({ length: 11 }, (_, k) => {
      const i = k - 5, ax = i * 0.014, tip = 0.012 + 0.012 * (0.5 + 0.5 * Math.sin(i * 2.3 + 0.4));
      return [[C[0] + ax, C[1] + 0.063, C[2] + 0.084],
        [C[0] + ax + Math.sin(i * 1.7) * 0.004, C[1] + tip, C[2] + 0.117]];
    });
    const field = (x, y, z) => {
      const rx = x - C[0], ry = y - C[1], rz = z - C[2];
      let d;
      if (nape) {
        // Long shaggy back stays behind the ears; the temples remain shaved.
        d = ellipsoid(x, y, z, [C[0], C[1] - 0.068, C[2] - 0.092], [0.096, 0.121, 0.046]);
        for (const [a, b] of locks) d = smin(d, roundCone(x, y, z, a, b, 0.019, 0.0035), 0.006);
        return Math.max(d, rz + 0.038);
      }
      // Raised side hairline exposes skin above the ear, unlike a smooth bowl cut.
      const front = smooth(0.025, 0.09, rz);
      const side = smooth(0.045, 0.092, Math.abs(rx)) * smooth(-0.085, -0.02, rz);
      const brokenEdge = Math.sin(rx * 205 + 0.8) * 0.004 + Math.sin(rx * 337) * 0.003;
      const hairline = -0.018 + 0.057 * side + (0.045 + brokenEdge) * front;
      const texture = (Math.sin(rx * 175 + rz * 65) * Math.cos(rz * 155) + Math.sin(rx * 91 - rz * 147)) * 0.0025;
      const thickness = hatOn ? 0.006 : 0.014 + texture * smooth(0.02, 0.08, ry);
      d = Math.max(M.headSDF(x, y, z, thickness, { features: false }), hairline - ry);
      // Individual short fringe locks give the brow an uneven, pointed outline.
      if (!hatOn) for (const [a, b] of locks) d = smin(d, roundCone(x, y, z, a, b, 0.012, 0.0025), 0.003);
      return d;
    };
    const g = surfaceNets(field, [C[0] - 0.16, C[1] - (nape ? 0.25 : 0.06), C[2] - 0.17],
      [C[0] + 0.16, C[1] + (nape ? 0.08 : 0.17), C[2] + (nape ? -0.025 : 0.16)], 0.0052);
    relax(g, 1, 0.15); // Keep the chopped fringe/nape instead of smoothing it into a helmet.
    g.translate(-H.bone[0], -H.bone[1], -H.bone[2]);
    return g;
  }
  if (style === 'xoan') {
    // Tóc xoăn bồng: khối dày quanh đầu, phồng hai bên tai và sau gáy (dài tới ngang cằm, thu dần về cuối),
    // vài lọn mái xoăn rủ lệch trước trán (vẫn lộ một phần trán), chừa khuôn mặt; bề mặt gợn thành các lọn xoăn tròn
    // (hoạ tiết 3D, rẻ hơn nhiều so với hàng trăm khối cầu).
    const curls = (x, y, z) => {
      const a = 78;
      const c = Math.sin(x * a + 1.3) * Math.sin(y * a * 0.95 + 0.7) * Math.sin(z * a + 2.1)
        + 0.5 * Math.sin(x * a * 1.9 + z * 31) * Math.sin(y * a * 1.8 - 0.4) * Math.cos(z * a * 1.7 + x * 20);
      return Math.max(0, c);                     // các "hạt" tròn tách nhau ⇒ thấy rõ từng lọn
    };
    const field = (x, y, z) => {
      const rx = x - C[0], ry = y - C[1], rz = z - C[2];
      const puff = hatOn ? 0.012 : 0.03 + 0.012 * smooth(0.0, 0.09, ry);           // đỉnh đầu bồng nhất
      let d = M.headSDF(x, y, z, puff, { features: false });
      if (!hatOn) d = smin(d, ellipsoid(x, y, z, [C[0], C[1] + 0.05, C[2] - 0.012], [0.118, 0.085, 0.124]), 0.04);   // vòm tóc
      for (const s of [-1, 1]) {
        d = smin(d, ellipsoid(x, y, z, [C[0] + s * 0.086, C[1] - 0.02, C[2] - 0.02], [0.058, 0.075, 0.08]), 0.04);  // phồng ngang tai
        d = smin(d, ellipsoid(x, y, z, [C[0] + s * 0.07, C[1] - 0.105, C[2] - 0.035], [0.042, 0.06, 0.06]), 0.04);   // thu dần xuống cằm
      }
      d = smin(d, ellipsoid(x, y, z, [C[0], C[1] - 0.06, C[2] - 0.075], [0.112, 0.105, 0.068]), 0.05);         // sau gáy
      // chừa khuôn mặt: từ giữa trán trở xuống, giữa hai thái dương
      const face = Math.max(0.022 - rz, Math.abs(rx) - 0.07, ry - 0.062);
      d = Math.max(d, -face);
      if (!hatOn) {                                                                                                   // lọn mái xoăn rủ lệch
        d = smin(d, ellipsoid(x, y, z, [C[0] - 0.048, C[1] + 0.05, C[2] + 0.09], [0.034, 0.03, 0.026]), 0.022);
        d = smin(d, ellipsoid(x, y, z, [C[0] + 0.008, C[1] + 0.066, C[2] + 0.094], [0.028, 0.024, 0.024]), 0.02);
        d = smin(d, ellipsoid(x, y, z, [C[0] + 0.055, C[1] + 0.04, C[2] + 0.084], [0.028, 0.034, 0.026]), 0.022);
      }
      d = Math.max(d, -0.165 - ry);                                                                                   // dài tới ngang cằm
      if (!hatOn || ry < 0.02) d -= 0.016 * curls(x, y, z) * smooth(-0.165, -0.12, ry);                               // lọn xoăn
      // khoét lại mặt từ lông mày trở xuống sau khi thêm lọn xoăn: không lọn nào lấn vào má / mắt
      return Math.max(d, -Math.max(0.03 - rz, Math.abs(rx) - 0.064, ry - 0.028));
    };
    const g = surfaceNets(field, [C[0] - 0.2, C[1] - 0.185, C[2] - 0.21], [C[0] + 0.2, C[1] + 0.2, C[2] + 0.17], 0.0062);
    relax(g, 1, 0.15);                           // giữ gợn lọn xoăn, không làm mượt thành mũ bảo hiểm
    g.translate(-H.bone[0], -H.bone[1], -H.bone[2]);
    return g;
  }
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
  const mat = new THREE.MeshStandardMaterial({ color: item.colors.main, roughness: style === 'moi' || style === 'xoan' ? 0.88 : 0.62, flatShading: true });
  const hair = new THREE.Mesh(geo, mat);
  const g = new THREE.Group();
  g.add(hair);
  if (style === 'moi') {
    hair.name = 'hair-moi-crop';
    const back = new THREE.Mesh(cached(`hair|${M.name}|moi-nape`, () => hairGeometry(M, 'moi-nape', false)), mat);
    back.name = 'hair-moi-nape'; g.add(back);
    // Caps hide the crown/fringe while the visible mullet tail remains at the nape.
    return { parts: [{ joint: 'head', obj: g }], hideUnderHat: [hair] };
  }
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

  const garmentParts = (x, y, z) => {
    // áo bỏ ngoài: dày hơn quanh hông để phủ kín cạp quần
    const flare = o.tucked ? 0 : 0.013 * smooth(P + 0.15, P + 0.08, y);
    const waistTaper = o.waistFit ? 0.005 * Math.exp(-(((y - P - 0.17) / 0.13) ** 2)) : 0;
    let d = M.trunk(x, y, z, base + flare - waistTaper);
    for (const s of ['L', 'R']) {
      d = smin(d, M.deltoid(s, x, y, z, base * 0.6), 0.04);
      if (!o.tucked) {
        d = smin(d, M.glute(s, x, y, z, base + flare - 0.002), 0.04);
        if (y > hemY - 0.02) d = smin(d, M.leg(s, x, y, z, base + flare + 0.004, { thighOnly: true }), 0.03);
      }
    }
    const arms = [];
    if (sleeveLen > 0) {
      for (const s of ['L', 'R']) {
        const A = M.arms[s];
        const st = segT(x, y, z, A.sh, A.wr) * fullArm;
        const loose = (o.sleeve === 'long' ? 0.011 : 0.012) + (o.sleeve === 'short' ? 0.008 * smooth(0.05, 0.15, st) : 0) + (jacket ? 0.004 : 0);
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
    if (o.sleeve === 'long') {
      // Resting cuffs touch the hip. A smooth SDF union otherwise makes an
      // actual cloth bridge from wrist to hem that stretches on every step.
      // Carve a resolvable separation below the armpit; iso-surfaces close
      // both sides, and the shoulder remains attached above the fade band.
      const gap = 0.012 * (1 - smooth(P + 0.20, P + 0.30, y));
      if (gap > 0) d = Math.max(d, gap - Math.abs(parts.trunk - Math.min(...parts.arms)));
    }
    d = Math.max(d, hemY - y);       // gấu
    // lỗ cổ tròn quanh cổ (không cắt phẳng → vai áo phủ kín tới chân cổ)
    d = Math.max(d, -Math.max(Math.hypot(x, (z - 0.004) * 1.08) - 0.058, neckY(z) - 0.03 - y));
    d = Math.max(d, y - (P + 0.56));
    if (o.vneck) d = Math.max(d, -Math.max(P + 0.395 + 1.5 * Math.abs(x) - y, 0.03 - z));
    if (!o.sportsCollar && (o.collar === 'polo' || o.collar === 'shirt')) {
      d = smin(d, torusY(x, y, z, [0, P + 0.51, 0.004], 0.066, 0.016, 1.06, 0.94), 0.01);
      // hai vạt cổ bẻ xuống ngực
      for (const s of [-1, 1]) {
        const cx = s * 0.038, cy = P + 0.47, cz = trunkRadius(0.47) * M.b.sz + base + 0.01;
        const ux = x - cx, uy = y - cy, uz = z - cz;
        // xoay vạt cho dốc theo ngực và chĩa mũi xuống giữa
        const a = 0.55, r = s * 0.5;
        const y1 = uy * Math.cos(a) - uz * Math.sin(a), z1 = uy * Math.sin(a) + uz * Math.cos(a);
        const x2 = ux * Math.cos(r) - y1 * Math.sin(r), y2 = ux * Math.sin(r) + y1 * Math.cos(r);
        d = smin(d, ellipsoid(x2, y2, z1, [0, 0, 0], [0.03, 0.04, 0.008]), 0.006);
      }
    } else if (!o.sportsCollar && o.collar === 'crew') {
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
  skinTop(g, M, o, garmentParts);

  return perTriangleUV(g, (x, y, z, cx, cy, cz) => {
    // Áo raglan dùng một hệ UV cho toàn bộ thân/tay; màu mảng được tính
    // theo vị trí trên lưới để tránh đường phân loại tam giác tay áo bị răng cưa.
    if (sleeveLen > 0 && !o.sportsCollar) {
      for (const s of ['L', 'R']) {
        const A = M.arms[s];
        if (Math.sign(cx) !== A.s) continue;
        const tFrac = segT(cx, cy, cz, A.sh, A.wr);
        const bomberSeamX = M.shoulderX - 0.035 + 0.045 * (1 - smooth(P + 0.23, P + 0.39, cy));
        const sleeveRegion = o.bomber ? Math.abs(cx) > bomberSeamX : M.arm(s, cx, cy, cz) < M.trunk(cx, cy, cz) - 0.01;
        if (tFrac > (o.bomber ? -0.09 : 0.06) && sleeveRegion) {
          const st = segT(x, y, z, A.sh, A.wr);
          const ax = A.sh[0] + (A.wr[0] - A.sh[0]) * st, az = A.sh[2] + (A.wr[2] - A.sh[2]) * st;
          const th = Math.atan2(x - ax, z - az);
          const ul = wrap(s === 'L' ? (th + Math.PI / 2) / TAU : (th - Math.PI / 2) / TAU);
          const f = clamp01((st * fullArm) / Math.max(sleeveLen, 0.01));
          const v = o.bomber ? 0.002 + 0.496 * (1 - f) : 0.5 * (1 - f);
          return [(s === 'L' ? 0 : 0.5) + 0.5 * ul, v, 0.5, s === 'L' ? 0 : 0.5, true];
        }
      }
    }
    const th = Math.atan2(x / M.b.sx, z / M.b.sz);
    const v = clamp01((y - hemY) / (neckY(z) - hemY));
    return [wrap(0.25 + th / TAU), o.bomber ? 0.502 + 0.496 * v : 0.5 + 0.5 * v, 1, 0, false];
  });
}

// Cổ thể dục: hai lá cổ bẻ phẳng và nẹp chữ V bắt chéo, ôm theo mặt ngực.
// Tách phần này khỏi UV để cổ luôn xanh và hai viền trắng luôn liền nét.
function sportsCollar(M, blue, white) {
  const group = new THREE.Group();
  const blueMat = lowpolyMat(blue, { flatShading: false, side: THREE.DoubleSide });
  const whiteMat = lowpolyMat(white, { flatShading: false, side: THREE.DoubleSide });
  const frontZ = (x, y, lift = 0) => {
    const r = trunkRadius(y), rx = r * M.b.sx + 0.014;
    return r * M.b.sz * Math.sqrt(Math.max(0.04, 1 - (x / rx) ** 2)) + 0.022 + lift;
  };
  const mesh = (verts, indices, material) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(indices); g.computeVertexNormals();
    const m = new THREE.Mesh(g, material); m.castShadow = true; group.add(m);
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
      if (i) { const p = i * 2; indices.push(p - 2, p - 1, p, p - 1, p + 1, p); }
    }
    mesh(vertices, indices, material);
  };
  for (const side of [-1, 1]) {
    const points = [[side * 0.038, 0.502], [side * 0.076, 0.508], [side * 0.112, 0.468], [side * 0.069, 0.449]];
    mesh(points.flatMap(([x, y]) => [x, y, frontZ(x, y, 0.004)]), [0, 1, 2, 0, 2, 3], blueMat);
    // Hai đường trắng ở mép ngoài lá cổ, giống phần bo dệt trên áo mẫu.
    const a = [side * 0.074, 0.500], b = [side * 0.104, 0.468];
    for (const offset of [-0.003, 0.003]) strip(a, b, 0.0018, whiteMat, 0.006, offset);
  }
  for (const side of [-1, 1]) {
    const a = [side * 0.066, 0.491], b = [-side * 0.006, side < 0 ? 0.386 : 0.378];
    const lift = side < 0 ? 0.003 : 0.005;
    strip(a, b, 0.018, blueMat, lift);
    for (const offset of [-0.0048, 0.0048]) strip(a, b, 0.0022, whiteMat, lift + 0.001, offset);
  }
  return group;
}

export function buildTop(ctx) {
  const { item, rig, imgs, emblem } = ctx;
  const emblemCanvas = imgs.badge ? drawEmblem({
    ...emblem, logo: item.textures.badge, logoCrop: item.badgeCrop, logoClip: item.badgeClip,
  }) : ctx.emblemCanvas;
  const o = item.options || {};
  const M = rig.model;
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
  const trim = item.colors.trim || '#ffffff';
  const printColor = item.colors.print || '#ffffff';

  const keyOpts = { sleeve: o.sleeve, collar: o.collar, tucked: o.tucked, zipper: o.zipper, cuffs: o.cuffs, placket: !!o.placket, vneck: o.vneck, sportsCollar: o.sportsCollar, bomber: o.bomber, waistFit: o.waistFit };
  let geo = cached(`top|${M.name}|${JSON.stringify(keyOpts)}`, () => topGeometry(M, o));
  if (o.sportsCollar || o.bomber) {
    // Chỉ nhân bản hình học cho áo phối màu; đổi màu không sửa lưới dùng chung.
    geo = geo.clone(); geo.userData.keep = false;
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), panelMix = new Float32Array(pos.count);
    // [r128] Color('#hex') của r128 không tự đổi sRGB → tuyến tính như bản mới; màu đỉnh phải đổi tay
    const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const blue = lin(accent), white = lin('#ffffff'), bodyColor = lin(main);
    for (let i = 0; i < pos.count; i++) {
      const x = Math.abs(pos.getX(i)) / M.b.sx;
      const y = pos.getY(i) - M.P[1];
      const seamX = Math.min(0.165, 0.059 + Math.max(0, 0.50 - y) * 0.65) + Math.max(0, 0.23 - y) * 2.5;
      const bomberSeamX = M.shoulderX - 0.035 + 0.045 * (1 - smooth(0.23, 0.39, y));
      const blend = o.bomber ? smooth(bomberSeamX - 0.006, bomberSeamX + 0.006, Math.abs(pos.getX(i))) : smooth(seamX - 0.003, seamX + 0.003, x);
      const c = (o.bomber ? bodyColor : white).clone().lerp(blue, blend);
      panelMix[i] = blend;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (o.bomber) geo.setAttribute('panelMix', new THREE.BufferAttribute(panelMix, 1));
  }

  const bodyCanvas = composeGarment({
    color: main, accent, imgs, trim, printColor,
    emblem: item.emblem ? emblemCanvas : null, emblemPos: item.emblem,
    stripes: o.stripes, placket: o.placket, zipper: o.zipper, zipperColor: item.colors.zipper, pocket: o.pocket, kangaroo: o.kangaroo,
    patternScale: o.patternScale,
    piping: o.piping, shoulderPiping: o.shoulderPiping, sidePiping: o.sidePiping, weltPockets: o.weltPockets, hemBand: o.hemBand,
    vneck: o.vneck && !o.sportsCollar ? [accent, trim] : null, plaid: o.plaid, breton: o.breton,
    wordmark: o.wordmark, wordmarkText: emblem?.wordmark, wordmarkBack: o.wordmarkBack,
    archText: o.arch ? (emblem?.name || '') : null, archSub: o.arch ? emblem?.short : null,
  });
  if (!o.sportsCollar && (o.collar === 'polo' || o.collar === 'shirt')) { // cổ bẻ: đậm hơn thân một chút để nổi khối
    const c = bodyCanvas.getContext('2d');
    c.fillStyle = shade(o.collarAccent ? accent : main, -0.05); c.fillRect(0, 0, 1024, 12);
  }
  if (o.collarAccent && !o.sportsCollar) { // cổ áo phối màu
    const c = bodyCanvas.getContext('2d');
    c.fillStyle = accent; c.fillRect(0, 0, 1024, 18);
  }
  if (o.poloTrim) {
    const c = bodyCanvas.getContext('2d');
    c.fillStyle = item.colors.ribAccent || '#1f2a44'; c.fillRect(0, 3, 1024, 4);
    c.fillStyle = trim; c.fillRect(0, 8, 1024, 3);
  }
  if (o.bomber) {
    const c = bodyCanvas.getContext('2d');
    c.fillStyle = main; c.fillRect(0, 0, 1024, 25); c.fillRect(0, 512 * 0.92, 1024, 512 * 0.08);
    c.fillStyle = trim;
    for (const y of [5, 15, 512 * 0.94, 512 * 0.973]) c.fillRect(0, y, 1024, y < 25 ? 4 : 5);
    // Nẹp bấm bạc thay cho khoá kéo; nẹp che các sọc bo ở chính giữa.
    c.fillStyle = shade(main, -0.03); c.fillRect(244, 0, 24, 512);
    for (let y = 22; y < 506; y += 78) {
      c.fillStyle = '#7c828a'; c.beginPath(); c.arc(256, y, 5.2, 0, TAU); c.fill();
      c.fillStyle = '#dce0e4'; c.beginPath(); c.arc(255, y - 1, 3.8, 0, TAU); c.fill();
    }
    if (o.weltPockets) {
      c.strokeStyle = trim; c.lineWidth = 10;
      for (const side of [-1, 1]) { c.beginPath(); c.moveTo(256 + side * 95, 512 * 0.65); c.lineTo(256 + side * 114, 512 * 0.86); c.stroke(); }
    }
  }
  const sleeveColor = o.accentSleeves ? accent : main;
  const sl = { cuff: o.cuffs && o.sleeve === 'long', hem: o.sleeve === 'short', sleeveStripes: o.sleeveStripes, trim, plaid: o.plaid, breton: o.breton, patternScale: o.patternScale };
  const sleeveImgs = o.accentSleeves ? {} : { pattern: imgs.pattern };
  // viền vai chạy dọc mặt ngoài-sau của tay áo (tránh miếng huy hiệu)
  // kích thước huy hiệu tay áo theo mét → px (ô tay áo bị kéo giãn khác nhau theo 2 chiều)
  const sleeveLen = o.sleeve === 'long' ? DIM.upperArm + DIM.foreArm - 0.025 : 0.15;
  const pxU = 512 / (TAU * 0.064 * M.L), pxV = 512 / sleeveLen;
  const emblemBox = [0.055 * pxU, 0.055 * pxV, 0.03 * pxV];
  const left = composeSleeve(sleeveColor, sleeveImgs, { ...sl, piping: o.shoulderPiping, pipingU: 0.68, emblem: o.sleeveEmblem ? emblemCanvas : null, emblemBox });
  const right = composeSleeve(sleeveColor, sleeveImgs, { ...sl, piping: o.shoulderPiping, pipingU: 0.32 });
  if (o.poloTrim || o.bomber) for (const sleeve of [left, right]) {
    const c = sleeve.getContext('2d');
    if (o.bomber) {
      c.fillStyle = main; c.fillRect(0, 512 * 0.89, 512, 512 * 0.11);
      c.fillStyle = trim;
      for (const y of [512 * 0.918, 512 * 0.965]) c.fillRect(0, y, 512, 7);
    } else {
      c.fillStyle = item.colors.ribAccent || '#1f2a44'; c.fillRect(0, 512 * 0.94, 512, 9);
      c.fillStyle = trim; c.fillRect(0, 512 * 0.965, 512, 8);
    }
  }
  const material = garmentMaterial(composeTopAtlas(bodyCanvas, left, right), { vertexColors: !!o.sportsCollar });
  if (o.bomber) {
    // Pha mảng màu sau khi lấy mẫu atlas, thay vì đổi ô atlas theo từng
    // tam giác: đường ráp vai liền nét và logo/chữ in giữ đúng màu gốc.
    material.userData.bomberPanels = { main, accent };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.bomberBody = { value: new THREE.Color(main).convertSRGBToLinear() }; // [r128]
      shader.uniforms.bomberSleeve = { value: new THREE.Color(accent).convertSRGBToLinear() }; // [r128]
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float panelMix;\nvarying float vPanelMix;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPanelMix = panelMix;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPanelMix;\nuniform vec3 bomberBody;\nuniform vec3 bomberSleeve;').replace('#include <map_fragment>', `#include <map_fragment>
        #ifdef USE_MAP
          vec3 atlasBase = vUv.y < 0.5 ? bomberSleeve : bomberBody; // [r128] vUv (bản mới: vMapUv)
          vec3 panelColor = mix(bomberBody, bomberSleeve, vPanelMix);
          diffuseColor.rgb *= panelColor / max(atlasBase, vec3(0.001));
        #endif`);
    };
    material.customProgramCacheKey = () => 'hust-bomber-panels-v1';
  }
  const parts = [skinnedPart(geo, material)];
  if (o.sportsCollar) parts.push({ joint: 'torso', obj: sportsCollar(M, accent, trim) });

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
function bottomHemY(G, o) {
  return o.length === 'shorts' ? G.kn[1] + 0.16 : G.an[1] + (o.length === 'capri' ? 0.16 : 0.035);
}

// Match the body's anatomical leg chains. Distance to *both* legs makes an
// inner trouser seam follow the opposite knee when the legs step apart.
function skinBottom(geo, M, options) {
  const lower = M.segments.filter(s => s.bone === 0 || s.bone >= 8);
  skinByDistance(geo, lower);
  // A skirt spans both legs; retain its continuous pelvis/leg blending.
  if (options.skirt) return geo;
  const p = geo.attributes.position, ids = geo.attributes.skinIndex, weights = geo.attributes.skinWeight;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const trunk = Math.min(M.trunk(x, y, z), M.glute('L', x, y, z), M.glute('R', x, y, z));
    const left = Math.min(M.leg('L', x, y, z), M.foot(M.legs.L, x, y, z));
    const right = Math.min(M.leg('R', x, y, z), M.foot(M.legs.R, x, y, z));
    if (trunk <= Math.min(left, right)) continue; // shared pelvis, same rule as skinBody
    const base = left <= right ? 8 : 11;
    const candidates = lower.filter(s => (s.bone >= base && s.bone <= base + 2) || (s.bone === 0 && y > M.P[1] - 0.16))
      .map(s => { const d = segDist(x, y, z, s.a, s.b); return { bone: s.bone, w: 1 / Math.pow(d * d + 1e-4, 2) }; })
      .sort((a, b) => b.w - a.w);
    const sum = candidates.reduce((n, c) => n + c.w, 0);
    ids.setXYZW(i, 0, 0, 0, 0); weights.setXYZW(i, 0, 0, 0, 0);
    candidates.forEach((c, k) => { ids.array[i * 4 + k] = c.bone; weights.array[i * 4 + k] = c.w / sum; });
  }
  return geo;
}

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
          // Quần thể thao ống suông: giữ độ rộng từ gối tới gấu, không bo cổ chân.
          const flare = o.track ? (o.cuff ? -0.008 : 0.023) : (o.fit === 'wide' ? 0.03 : (o.cuff ? -0.012 : 0.002));
          lg = M.leg(s, x, y, z, fitT, { flare });
          lg = Math.max(lg, (G.an[1] + (length === 'capri' ? 0.16 : 0.035)) - y);
        }
        d = smin(d, lg, 0.03);
      }
    }
    if (o.track && length === 'shorts' && !o.skirt && y < P - 0.17) {
      // Tách rõ hai cửa ống của quần sooc rộng; phép hợp mềm không được
      // nối kín khoảng giữa hai đùi thành một gấu chung như chân váy.
      const gap = 0.012 * M.b.sx * smooth(P - 0.17, P - 0.31, y);
      d = Math.max(d, gap - Math.abs(x));
    }
    return Math.max(d, y - waistTop);
  };
  const g = surfaceNets(field, [-0.36, -0.02, -0.25], [0.36, P + 0.1, 0.25], o.skirt ? 0.0085 : 0.0095);
  relax(g, 1, 0.4);
  // Quần/váy chỉ theo thân và chân, không chịu tác động của tay hay đầu.
  skinBottom(g, M, o);
  return perTriangleUV(g, (x, y, z, cx, cy) => {
    if (o.track && !o.skirt) {
      // Mỗi chân có một nửa atlas riêng; u=0/1 chỉ nằm ở đường may NGOÀI.
      // Ở phần hông, trục chân chuyển dần về giữa chậu để sọc nối tới cạp.
      const G = M.legs[cx >= 0 ? 'L' : 'R'];
      const axisX = G.hp[0] * (1 - smooth(P - 0.18, P - 0.035, y));
      const th = Math.atan2(x - axisX, z);
      const u = wrap((th - G.s * Math.PI / 2) / TAU);
      const origin = G.s > 0 ? 0 : 0.5;
      const hemY = bottomHemY(G, o);
      return [origin + u * 0.5, clamp01((y - hemY) / (waistTop - hemY)), 0.5, origin, true];
    }
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

// Atlas riêng cho quần thể thao: sọc trắng ở mép ngoài của từng ống quần,
// chữ HUST chỉ in một lần ở đùi trái, không lặp xuống ống chân.
function trackPantsCanvas(main, accent, imgs, o, M, printColor) {
  const W = 1024, H = 1024, half = W / 2;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const fabric = composePlain(main, imgs, { patternScale: o.patternScale });
  const G = M.legs.L;
  const hemY = bottomHemY(G, o), waistY = M.P[1] + 0.078;
  const py = (y) => (1 - (y - hemY) / (waistY - hemY)) * H;
  for (let side = 0; side < 2; side++) {
    const x = side * half;
    c.drawImage(fabric, x, 0, half, H);
    if (o.sideStripe) {
      // Dải phối vẫn ôm đường may ngoài, nhích nhẹ về phía trước để thấy
      // rõ cả hai sọc khi nhìn thẳng thay vì chỉ thấy một đường ở bóng viền.
      const stripeWidth = o.trackStripeWidth ?? 0.08;
      const bias = Math.min(o.trackStripeBias ?? 0.035, stripeWidth * 0.45);
      c.fillStyle = accent;
      for (let row = 0; row < H; row++) {
        const worldY = hemY + (1 - (row + 0.5) / H) * (waistY - hemY);
        // Vòng hông lớn hơn vòng ống chân: giảm bề rộng góc tại cạp để
        // giữ sọc hẹp đều, không nở thành hai mảng trắng lớn bên hông.
        const fit = 1 - 0.60 * smooth(M.P[1] - 0.18, M.P[1] - 0.035, worldY);
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
    c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(0, 0, W, bandH);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2;
    for (let y = 8; y < bandH; y += 12) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1;
    for (let x = 0; x < W; x += 7) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 2, bandH); c.stroke();
    }
  }
  if (o.zipPockets) {
    for (let side = 0; side < 2; side++) {
      const x = half * (side + (side === 0 ? 0.89 : 0.11));
      const slant = side === 0 ? -1 : 1;
      const y0 = py(waistY - 0.07), y1 = py(waistY - 0.205);
      c.strokeStyle = shade(main, -0.05); c.lineWidth = 9;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x + slant * 12, y1); c.stroke();
      c.strokeStyle = shade(main, 0.10); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 2, y0); c.lineTo(x + slant * 12 + 2, y1); c.stroke();
      c.fillStyle = '#4b5361'; c.fillRect(x - 3, y0 - 3, 6, 10);
    }
  }
  // Đường may gấu / bo gấu theo chiều dài thực, không lặp lại trên ống.
  c.fillStyle = 'rgba(0,0,0,0.10)';
  const hemH = (o.cuff ? 0.045 : 0.012) / (waistY - hemY) * H;
  c.fillRect(0, H - hemH, W, hemH);
  c.fillRect(0, H - hemH - 3, W, 2);
  if (o.sideTag) {
    const x = half * 1.13, y = py(M.P[1] - 0.17);
    c.fillStyle = '#161918'; c.fillRect(x - 10, y, 20, 61);
    c.fillStyle = '#f5f4ee'; c.font = '800 12px "Be Vietnam Pro", system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    [...'HUST'].forEach((ch, i) => c.fillText(ch, x, y + 9 + i * 14));
  }
  if (o.wordmark) {
    const printY = o.wordmarkVertical ? hemY + 0.075 : M.P[1] - 0.15;
    const y = py(printY);
    c.fillStyle = printColor;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (o.wordmarkVertical) {
      c.save(); c.translate(half * 0.86, y); c.rotate(-Math.PI / 2);
      c.font = '800 34px "Be Vietnam Pro", system-ui, sans-serif';
      c.fillText('HUST', 0, 0, 146); c.restore();
    } else {
      c.font = 'italic 800 28px "Be Vietnam Pro", system-ui, sans-serif';
      c.fillText('HUST', half * 0.78, y, 112);
    }
  }
  return canvas;
}

export function buildBottom(ctx) {
  const { item, rig, imgs } = ctx;
  const o = item.options || {};
  const M = rig.model;
  const main = item.colors.main, accent = item.colors.accent || shade(main, 0.4);
  const keyOpts = { skirt: o.skirt, skirtLen: o.skirtLen, pleats: o.pleats, fit: o.fit, length: o.length, cuff: o.cuff, track: o.track };
  const geo = cached(`bottom|${M.name}|${JSON.stringify(keyOpts)}`, () => bottomGeometry(M, o));
  const plain = o.track
    ? trackPantsCanvas(main, accent, imgs, o, M, item.colors.print || accent)
    : composePlain(main, imgs, { denim: o.denim, sideStripe: o.sideStripe ? accent : null, patternScale: o.patternScale });
  const mat = garmentMaterial(plain, { roughness: o.fleece ? 0.98 : (o.denim ? 0.95 : 0.88) });
  mat.map.wrapT = o.track ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
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
