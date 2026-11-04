// =============================================================
//  gear.js — giày dép, mũ, balo/túi, thẻ sinh viên, kính, dụng cụ
// =============================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DIM, trunkRadius, limb, lowpolyMat } from '../rig.js';
import { toTexture, nonLaTexture, calculatorFace, shade, slideBandAlpha, slideBandMap, ribbonTexture, maskTexture } from '../textures.js';

const DS = THREE.DoubleSide;
const GROUND = -0.07; // mặt đất trong hệ toạ độ khớp cổ chân

function shadowed(obj) { obj.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return obj; }
function rbox(w, h, d, r, mat, seg = 2) { return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat); }
function tube(points, radius, mat, flat = 1) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  curve.curveType = 'centripetal';
  const g = new THREE.TubeGeometry(curve, 32, radius, 5, false);
  if (flat !== 1) g.scale(1, 1, 1); // giữ chỗ nếu muốn dẹt
  return new THREE.Mesh(g, mat);
}
// Mặt phẳng có hình (in huy hiệu, ảnh lên đồ vật)
function decal(canvasOrTex, w, h, extra = {}) {
  const tex = canvasOrTex.isTexture ? canvasOrTex : toTexture(canvasOrTex);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7, ...extra }));
  return m;
}
function imageCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0); return c;
}

// ---------------------------------------------------------- GIÀY DÉP
function oneShoe(item, side, imgs) {
  const o = item.options || {};
  const type = item.options?.type || 'sneaker';
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.2);
  const g = new THREE.Group();

  if (type === 'to-ong') {
    // ---- DÉP TỔ ONG (dạng quai ngang, hở mũi): đế dày + quai rộng lỗ hình thoi
    const soleMat = lowpolyMat(shade(main, -0.03), { roughness: 0.55 });
    const sole = rbox(0.108, 0.034, 0.27, 0.014, soleMat, 3);
    sole.position.set(0, GROUND + 0.017, 0.045);
    g.add(sole);
    // lòng dép có rãnh
    const bed = document.createElement('canvas'); bed.width = 128; bed.height = 320;
    const bx = bed.getContext('2d');
    bx.fillStyle = shade(main, 0.04); bx.fillRect(0, 0, 128, 320);
    bx.strokeStyle = shade(main, -0.1); bx.lineWidth = 4;
    bx.beginPath(); bx.ellipse(64, 220, 34, 70, 0, 0, Math.PI * 2); bx.stroke();
    bx.beginPath(); bx.ellipse(64, 70, 40, 46, 0, 0, Math.PI * 2); bx.stroke();
    const footbed = decal(bed, 0.094, 0.25, { transparent: false, roughness: 0.6 });
    footbed.rotation.x = -Math.PI / 2; footbed.rotation.z = Math.PI;
    footbed.position.set(0, GROUND + 0.0345, 0.045);
    g.add(footbed);
    // quai
    const alpha = slideBandAlpha();
    const bandMap = imgs.upper ? toTexture(imageCanvas(imgs.upper)) : toTexture(slideBandMap(main));
    const bandMat = new THREE.MeshStandardMaterial({ color: imgs.upper ? '#ffffff' : '#ffffff', map: bandMap, alphaMap: alpha, alphaTest: 0.5, side: DS, roughness: 0.5, flatShading: true });
    const archG = new THREE.CylinderGeometry(0.058, 0.058, 0.125, 18, 1, true, -Math.PI / 2, Math.PI);
    archG.rotateX(-Math.PI / 2);
    archG.scale(1, 0.84, 1);
    const arch = new THREE.Mesh(archG, bandMat);
    arch.position.set(0, GROUND + 0.032, 0.072);
    g.add(arch);
    const rimMat = lowpolyMat(main, { roughness: 0.5 });
    for (const z of [0.0095, 0.1345]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0045, 4, 16, Math.PI), rimMat);
      rim.scale.set(1, 0.84, 1);
      rim.position.set(0, GROUND + 0.032, z);
      g.add(rim);
    }
    if (o.strap) {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.008, 4, 14, Math.PI), rimMat);
      strap.rotation.x = -Math.PI / 2 - 0.35;
      strap.position.set(0, GROUND + 0.04, -0.005);
      g.add(strap);
      for (const s of [-1, 1]) {
        const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 6), lowpolyMat(shade(main, -0.15)));
        rivet.rotation.z = Math.PI / 2;
        rivet.position.set(s * 0.057, GROUND + 0.04, -0.005);
        g.add(rivet);
      }
    }
    return g;
  }

  if (type === 'tong') {
    // ---- DÉP TÔNG (xỏ ngón)
    const sole = rbox(0.1, 0.018, 0.262, 0.008, lowpolyMat(accent, { roughness: 0.6 }));
    sole.position.set(0, GROUND + 0.009, 0.045);
    g.add(sole);
    const top = GROUND + 0.018;
    const sm = lowpolyMat(main, { roughness: 0.5 });
    for (const s of [-1, 1]) g.add(tube([[0, top + 0.004, 0.125], [s * 0.022, top + 0.032, 0.09], [s * 0.044, top + 0.02, 0.05], [s * 0.05, top, 0.03]], 0.0055, sm));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 5), sm);
    post.position.set(0, top + 0.004, 0.125);
    g.add(post);
    return g;
  }

  if (type === 'bata' || type === 'boot') {
    // ---- GIÀY VẢI BATA / BỐT CỔ CAO
    const boot = type === 'boot';
    const soleH = boot ? 0.034 : 0.03;
    const sole = rbox(0.104, soleH, 0.266, 0.01, lowpolyMat(boot ? '#2a221c' : '#f2efe6', { roughness: 0.75 }));
    sole.position.set(0, GROUND + soleH / 2, 0.045);
    g.add(sole);
    if (!boot) {
      const line = rbox(0.106, 0.006, 0.268, 0.003, lowpolyMat(accent));
      line.position.set(0, GROUND + 0.02, 0.045);
      g.add(line);
    }
    const capG = new THREE.CapsuleGeometry(0.048, 0.13, 4, 10);
    capG.rotateX(Math.PI / 2); capG.scale(1, 0.8, 1);
    const upper = new THREE.Mesh(capG, lowpolyMat(main, { roughness: boot ? 0.45 : 0.95 }));
    upper.position.set(0, GROUND + soleH + 0.017, 0.05);
    g.add(upper);
    if (!boot) {
      const toeG = new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI, 0, Math.PI / 2);
      toeG.scale(1.0, 0.75, 0.9);
      const toe = new THREE.Mesh(toeG, lowpolyMat('#f2efe6', { roughness: 0.7 }));
      toe.position.set(0, GROUND + soleH + 0.002, 0.12);
      g.add(toe);
    }
    const shaftH = boot ? 0.13 : 0.06;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(boot ? 0.05 : 0.047, 0.052, shaftH, 10, 1, true), lowpolyMat(main, { side: DS, roughness: boot ? 0.45 : 0.95 }));
    shaft.position.set(0, GROUND + soleH + shaftH / 2, -0.01);
    g.add(shaft);
    const laceMat = lowpolyMat(boot ? '#c9a46a' : '#ffffff');
    for (let i = 0; i < (boot ? 6 : 4); i++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.004, 0.007), laceMat);
      lace.position.set(0, GROUND + soleH + 0.05 + (boot ? i * 0.016 : -i * 0.004), boot ? 0.04 - i * 0.002 : 0.03 + i * 0.026);
      lace.rotation.x = boot ? -0.6 : -0.25;
      g.add(lace);
    }
    return g;
  }

  if (type === 'quai-hau' || type === 'le') {
    const sole = rbox(0.1, type === 'le' ? 0.026 : 0.022, 0.255, 0.01, lowpolyMat(accent, { roughness: 0.6 }));
    sole.position.set(0, GROUND + 0.012, 0.045);
    g.add(sole);
    const strapMat = lowpolyMat(main, { roughness: 0.6, side: DS });
    if (type === 'le') {
      const bandG = new THREE.CylinderGeometry(0.054, 0.054, 0.075, 12, 1, true, -Math.PI / 2, Math.PI);
      bandG.rotateX(-Math.PI / 2); bandG.scale(1, 0.8, 1);
      const band = new THREE.Mesh(bandG, strapMat);
      band.position.set(0, GROUND + 0.024, 0.085);
      g.add(band);
      if (item.emblemOnStrap !== false && imgs.upper) {
        const d = decal(imageCanvas(imgs.upper), 0.05, 0.03);
        d.position.set(0, GROUND + 0.07, 0.085); d.rotation.x = -Math.PI / 2;
        g.add(d);
      }
    } else {
      for (const z of [0.02, 0.105]) {
        const s = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 4, 12, Math.PI), strapMat);
        s.scale.set(1, 0.9, 1);
        s.position.set(0, GROUND + 0.022, z);
        g.add(s);
      }
      const heel = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 4, 12, Math.PI), strapMat);
      heel.rotation.x = -Math.PI / 2;
      heel.position.set(0, GROUND + 0.04, 0.0);
      g.add(heel);
    }
    return g;
  }

  // ---- Giày kín: sneaker / runner / loafer
  const loafer = type === 'loafer';
  const runner = type === 'runner';
  const soleH = runner ? 0.038 : loafer ? 0.018 : 0.03;
  const sole = rbox(0.102, soleH, 0.262, 0.01, lowpolyMat(runner ? accent : (loafer ? '#2a1d17' : '#f4f3ef'), { roughness: 0.7 }));
  sole.position.set(0, GROUND + soleH / 2, 0.045);
  g.add(sole);
  const upperMat = lowpolyMat(main, { roughness: loafer ? 0.32 : 0.8, metalness: loafer ? 0.05 : 0 });
  const capG = new THREE.CapsuleGeometry(0.049, 0.13, 4, 10);
  capG.rotateX(Math.PI / 2);
  capG.scale(1, loafer ? 0.66 : 0.82, 1);
  const upper = new THREE.Mesh(capG, upperMat);
  upper.position.set(0, GROUND + soleH + (loafer ? 0.012 : 0.018), 0.05);
  g.add(upper);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.05, loafer ? 0.03 : 0.05, 10, 1, true), lowpolyMat(loafer ? main : shade(main, -0.08), { side: DS }));
  collar.position.set(0, GROUND + soleH + 0.03, -0.01);
  g.add(collar);
  if (!loafer) {
    const laceMat = lowpolyMat(item.colors.lace || '#ffffff');
    for (let i = 0; i < 4; i++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.008), laceMat);
      lace.position.set(0, GROUND + soleH + 0.05 - i * 0.004, 0.03 + i * 0.028);
      lace.rotation.x = -0.25;
      g.add(lace);
    }
    // miếng gót + sọc hông (không dùng logo thương hiệu nào)
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.01), lowpolyMat(accent));
    tab.position.set(0, GROUND + soleH + 0.035, -0.072);
    g.add(tab);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.12), lowpolyMat(accent));
    stripe.position.set(side * 0.05, GROUND + soleH + 0.018, 0.04);
    stripe.rotation.x = -0.15;
    g.add(stripe);
  } else {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.02), lowpolyMat(shade(main, -0.15)));
    band.position.set(0, GROUND + soleH + 0.047, 0.05); band.rotation.x = -0.3;
    g.add(band);
  }
  return g;
}

export function buildFootwear(ctx) {
  const { item, imgs } = ctx;
  return {
    parts: [
      { joint: 'ankleL', obj: shadowed(oneShoe(item, 1, imgs)) },
      { joint: 'ankleR', obj: shadowed(oneShoe(item, -1, imgs)) },
    ],
  };
}

// ---------------------------------------------------------- MŨ
export function buildHat(ctx) {
  const { item, emblemCanvas, imgs } = ctx;
  const type = item.options?.type || 'luoi-trai';
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.2);
  const mat = lowpolyMat(main, { side: DS });
  const acc = lowpolyMat(accent, { side: DS });
  const g = new THREE.Group();
  let hideHairTop = true;

  if (type === 'luoi-trai') {
    const crownG = new THREE.SphereGeometry(0.134, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    crownG.scale(0.97, 0.92, 1.05);
    const crown = new THREE.Mesh(crownG, mat);
    crown.position.y = 0.135; crown.rotation.x = -0.12;
    g.add(crown);
    if (item.colors.front) {
      const fG = new THREE.SphereGeometry(0.1355, 14, 8, Math.PI / 2 - 1.15, 2.3, 0, Math.PI * 0.5);
      fG.scale(0.97, 0.92, 1.05);
      const front = new THREE.Mesh(fG, lowpolyMat(item.colors.front, { side: DS }));
      front.position.y = 0.135; front.rotation.x = -0.12;
      g.add(front);
    }
    const brimG = new THREE.CylinderGeometry(0.11, 0.11, 0.008, 14, 1, false, -Math.PI / 2, Math.PI);
    brimG.scale(1, 1, 0.85);
    const brim = new THREE.Mesh(brimG, acc);
    brim.position.set(0, 0.14, 0.09); brim.rotation.x = 0.14;
    g.add(brim);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), acc);
    btn.position.set(0, 0.258, -0.012);
    g.add(btn);
    const art = imgs.front ? imageCanvas(imgs.front) : (item.emblem ? emblemCanvas : null);
    if (art) {
      const d = decal(art, 0.07, 0.07);
      d.position.set(0, 0.19, 0.122); d.rotation.x = -0.45;
      g.add(d);
    }
  } else if (type === 'bucket') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.13, 0.1, 14), mat);
    crown.position.y = 0.2;
    g.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.05, 16, 1, true), mat);
    brim.position.y = 0.13;
    g.add(brim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.131, 0.132, 0.02, 14, 1, true), acc);
    band.position.y = 0.16;
    g.add(band);
  } else if (type === 'non-la') {
    const coneMat = new THREE.MeshStandardMaterial({ map: toTexture(nonLaTexture(main)), side: DS, roughness: 0.9, flatShading: true });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.16, 28, 1, true), coneMat);
    cone.position.y = 0.26;
    g.add(cone);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.004, 4, 16, Math.PI), acc);
    strap.rotation.z = Math.PI; strap.position.set(0, 0.17, 0.015);
    g.add(strap);
  } else if (type === 'bao-hiem') {
    const shellG = new THREE.SphereGeometry(0.145, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    shellG.scale(0.97, 0.95, 1.06);
    const shell = new THREE.Mesh(shellG, lowpolyMat(main, { roughness: 0.28, side: DS }));
    shell.position.y = 0.13;
    g.add(shell);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.143, 0.024, 16, 1, true), acc);
    ring.scale.set(0.97, 1, 1.06); ring.position.y = 0.142;
    g.add(ring);
    const visorG = new THREE.CylinderGeometry(0.1, 0.1, 0.006, 12, 1, false, -Math.PI / 2, Math.PI);
    visorG.scale(1, 1, 0.55);
    const visor = new THREE.Mesh(visorG, acc);
    visor.position.set(0, 0.15, 0.13); visor.rotation.x = 0.25;
    g.add(visor);
    for (const s of [-1, 1]) {
      const st = limb(0.13, 0.004, 0.004, lowpolyMat('#222'), 4);
      st.position.set(s * 0.1, 0.14, 0.02); st.rotation.z = s * -0.25;
      g.add(st);
    }
    if (item.emblem && emblemCanvas) {
      const d = decal(emblemCanvas, 0.06, 0.06);
      d.position.set(0.1, 0.21, 0.07); d.rotation.set(-0.3, 0.9, 0.3);
      g.add(d);
    }
  } else if (type === 'len') {
    const crownG = new THREE.SphereGeometry(0.132, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    crownG.scale(0.97, 1.12, 1.05);
    const crown = new THREE.Mesh(crownG, mat);
    crown.position.y = 0.122;
    g.add(crown);
    const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.133, 0.136, 0.05, 14, 1, true), acc);
    fold.scale.set(0.98, 1, 1.06); fold.position.y = 0.13;
    g.add(fold);
    const pom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1), acc);
    pom.position.y = 0.282;
    g.add(pom);
  } else if (type === 'tot-nghiep') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.126, 0.13, 0.08, 14), mat);
    cap.position.y = 0.2;
    g.add(cap);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.3), mat);
    board.position.y = 0.245; board.rotation.y = Math.PI / 4;
    g.add(board);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), acc);
    btn.position.y = 0.255;
    g.add(btn);
    const cord = limb(0.15, 0.003, 0.003, acc, 4);
    cord.position.set(0, 0.255, 0); cord.rotation.z = Math.PI / 2 + 0.05;
    g.add(cord);
    const tassel = limb(0.09, 0.006, 0.016, acc, 6);
    tassel.position.set(0.15, 0.25, 0);
    g.add(tassel);
  }
  return { parts: [{ joint: 'head', obj: shadowed(g) }], hideHairTop };
}

// ---------------------------------------------------------- BALO / TÚI
export function buildBag(ctx) {
  const { item, rig, emblemCanvas, imgs } = ctx;
  const type = item.options?.type || 'balo';
  const b = rig.build;
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
  const mat = lowpolyMat(main, { roughness: 0.85 });
  const acc = lowpolyMat(accent, { roughness: 0.8 });
  const g = new THREE.Group();
  const chestZ = (y) => trunkRadius(y) * b.sz + 0.03;

  if (type === 'balo' || type === 'balo-laptop') {
    const slim = type === 'balo-laptop';
    const d = slim ? 0.085 : 0.13;
    const backZ = -(trunkRadius(0.28) * b.sz + 0.028) - d / 2;
    const body = rbox(slim ? 0.29 : 0.28, slim ? 0.38 : 0.37, d, slim ? 0.02 : 0.045, mat, 3);
    body.position.set(0, 0.26, backZ);
    g.add(body);
    const pocket = rbox(slim ? 0.22 : 0.2, slim ? 0.12 : 0.15, 0.05, 0.02, acc, 2);
    pocket.position.set(0, slim ? 0.2 : 0.17, backZ - d / 2 - 0.012);
    g.add(pocket);
    const art = imgs.front ? imageCanvas(imgs.front) : (item.emblem ? emblemCanvas : null);
    if (art) {
      const p = decal(art, 0.075, 0.075);
      p.position.set(0, slim ? 0.32 : 0.33, backZ - d / 2 - 0.002);
      p.rotation.y = Math.PI;
      g.add(p);
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 4, 10, Math.PI), acc);
    handle.position.set(0, 0.45, backZ);
    g.add(handle);
    const strapMat = lowpolyMat(shade(main, -0.12), { roughness: 0.85 });
    for (const s of [-1, 1]) {
      const x = s * 0.085 * b.sx;
      g.add(tube([
        [x, 0.42, backZ + d / 2 - 0.01], [x * 1.1, 0.505, -0.02], [x * 1.12, 0.44, chestZ(0.44)],
        [x * 1.15, 0.3, chestZ(0.3)], [x * 1.3, 0.17, chestZ(0.17)],
        [s * (trunkRadius(0.16) * b.sx + 0.012), 0.15, 0.0], [x * 1.5, 0.13, backZ + d / 2],
      ], 0.011, strapMat));
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.02, 0.008), lowpolyMat('#1c1c1e'));
      buckle.position.set(x * 1.15, 0.3, chestZ(0.3) + 0.01);
      g.add(buckle);
    }
  } else if (type === 'tote') {
    const bx = -(0.2 * b.sx + 0.11);
    const bag = rbox(0.035, 0.31, 0.28, 0.008, mat);
    bag.position.set(bx, -0.02, -0.06);
    g.add(bag);
    const art = imgs.front ? imageCanvas(imgs.front) : (item.emblem ? emblemCanvas : null);
    if (art) {
      const p = decal(art, 0.15, 0.15);
      p.position.set(bx - 0.019, -0.02, -0.06); p.rotation.y = -Math.PI / 2;
      g.add(p);
    }
    for (const z of [-0.14, 0.02]) {
      g.add(tube([[bx, 0.13, z], [bx * 0.85, 0.36, z * 0.5 - 0.02], [-0.12 * b.sx, 0.5, -0.01]], 0.008, acc));
    }
  } else if (type === 'cap-sach') {
    const bx = -(0.2 * b.sx + 0.1);
    const bag = rbox(0.07, 0.25, 0.33, 0.02, mat, 3);
    bag.position.set(bx, -0.03, -0.02);
    g.add(bag);
    const flap = rbox(0.074, 0.15, 0.335, 0.02, acc, 2);
    flap.position.set(bx - 0.002, 0.03, -0.02);
    g.add(flap);
    for (const z of [-0.1, 0.06]) {
      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.022), lowpolyMat('#c9b98f', { metalness: 0.6, roughness: 0.35 }));
      clasp.position.set(bx - 0.04, -0.03, z);
      g.add(clasp);
    }
    const art = imgs.front ? imageCanvas(imgs.front) : (item.emblem ? emblemCanvas : null);
    if (art) {
      const p = decal(art, 0.07, 0.07);
      p.position.set(bx - 0.04, 0.04, -0.02); p.rotation.y = -Math.PI / 2;
      g.add(p);
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 10, Math.PI), acc);
    handle.rotation.y = Math.PI / 2; handle.position.set(bx, 0.095, -0.02);
    g.add(handle);
    g.add(tube([[bx, 0.09, 0.12], [-0.13 * b.sx, 0.3, chestZ(0.3) + 0.004], [0.11 * b.sx, 0.5, 0.0], [0.05, 0.38, -chestZ(0.38)], [bx * 0.8, 0.12, -0.14], [bx, 0.09, -0.16]], 0.008, acc));
  } else if (type === 'deo-cheo') {
    const pts = [
      [0.12 * b.sx, 0.5, -0.03], [0.09 * b.sx, 0.47, chestZ(0.45)], [0, 0.32, chestZ(0.32) + 0.004],
      [-0.12 * b.sx, 0.13, chestZ(0.13)], [-0.17 * b.sx, 0.02, chestZ(0.02) + 0.02],
    ];
    g.add(tube(pts, 0.009, acc));
    g.add(tube([[0.12 * b.sx, 0.5, -0.03], [0.04, 0.38, -chestZ(0.38)], [-0.13 * b.sx, 0.15, -chestZ(0.15)], [-0.2 * b.sx, 0.03, -0.02]], 0.009, acc));
    const bag = rbox(0.17, 0.13, 0.055, 0.02, mat);
    bag.position.set(-0.15 * b.sx, -0.03, chestZ(-0.03) + 0.035);
    bag.rotation.y = -0.35;
    g.add(bag);
    const flap = rbox(0.172, 0.06, 0.058, 0.015, acc);
    flap.position.set(-0.15 * b.sx, 0.01, chestZ(-0.03) + 0.037);
    flap.rotation.y = -0.35;
    g.add(flap);
  }
  return { parts: [{ joint: 'torso', obj: shadowed(g) }] };
}

// ---------------------------------------------------------- THẺ SINH VIÊN
// Dải ruy băng dẹt chạy theo đường cong, mặt phẳng áp sát thân
function ribbon(points, width, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  curve.curveType = 'centripetal';
  const N = 64;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const out = new THREE.Vector3(p.x, 0, p.z).normalize();
    const side = new THREE.Vector3().crossVectors(tan, out).normalize().multiplyScalar(width / 2);
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
    uv.push(t, 0, t, 1);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

export function buildCard(ctx) {
  const { item, rig, cardCanvas, emblem } = ctx;
  const type = item.options?.type || 'day-deo';
  const b = rig.build;
  const g = new THREE.Group();
  const main = item.colors.main || emblem?.main || '#b3141d';
  const textColor = item.colors.text || '#ffffff';
  const holderColor = item.colors.accent || main;
  const chestZ = (y) => trunkRadius(y) * b.sz + 0.026;
  const metal = lowpolyMat('#c8ccd2', { metalness: 0.75, roughness: 0.3 });
  const cardTex = toTexture(cardCanvas);

  const makeCard = (scale, holder) => {
    const c = new THREE.Group();
    const w = 0.12 * scale, h = 0.0757 * scale;
    if (holder === 'silicone') {
      // vỏ silicone màu, ô cửa sổ trong suốt, khe ngón cái phía dưới
      const frame = rbox(w + 0.016, h + 0.022, 0.008, 0.008, lowpolyMat(holderColor, { roughness: 0.6 }), 3);
      frame.position.y = -0.003;
      c.add(frame);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.005, 0.002), lowpolyMat(shade(holderColor, -0.3)));
      slot.position.set(0, h / 2 + 0.002, 0.0042);
      c.add(slot);
    } else {
      c.add(rbox(w + 0.012, h + 0.012, 0.005, 0.004, new THREE.MeshStandardMaterial({ color: '#eef3f8', transparent: true, opacity: 0.35, roughness: 0.1 })));
    }
    const face = decal(cardTex, w, h, { transparent: false });
    face.position.z = 0.0045;
    c.add(face);
    return c;
  };

  if (type === 'day-deo') {
    const ribbonMat = new THREE.MeshStandardMaterial({
      map: toTexture(ribbonTexture(`${(emblem?.name || '').toUpperCase()}  ·  ${emblem?.wordmark || ''}`, main, textColor)),
      side: DS, roughness: 0.7,
    });
    for (const s of [-1, 1]) {
      g.add(ribbon([
        [0, 0.508, -0.07], [s * 0.05, 0.5, -0.045], [s * 0.078, 0.488, 0.03], [s * 0.066, 0.41, chestZ(0.41)],
        [s * 0.034, 0.31, chestZ(0.31) + 0.004], [s * 0.008, 0.25, chestZ(0.25) + 0.008],
      ], 0.02, ribbonMat));
    }
    // móc kim loại
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0025, 4, 10), metal);
    ring.position.set(0, 0.246, chestZ(0.25) + 0.01);
    g.add(ring);
    const hook = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.018, 2, 6), metal);
    hook.position.set(0, 0.229, chestZ(0.23) + 0.012);
    g.add(hook);
    const card = makeCard(1, 'silicone');
    card.position.set(0, 0.168, chestZ(0.17) + 0.016);
    card.rotation.x = -0.06;
    g.add(card);
  } else {
    const card = makeCard(0.85, 'clear');
    const x = 0.075 * b.sx;
    card.position.set(x, 0.28, chestZ(0.28) + 0.006);
    card.rotation.set(-0.1, 0.32, 0);
    g.add(card);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.006), metal);
    clip.position.set(x - 0.004, 0.325, chestZ(0.32) + 0.008);
    clip.rotation.y = 0.32;
    g.add(clip);
  }
  return { parts: [{ joint: 'torso', obj: shadowed(g) }] };
}

// ---------------------------------------------------------- KÍNH
export function buildEyewear(ctx) {
  const { item } = ctx;
  const type = item.options?.type || 'tron';
  const frame = lowpolyMat(item.colors.main, { roughness: 0.35, metalness: type === 'tron' || type === 'nua' ? 0.5 : 0.1 });
  const g = new THREE.Group();
  g.position.y = 0.114;
  const sq = type !== 'tron';
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(sq ? 0.03 : 0.025, 0.0036, 4, sq ? 4 : 16), frame);
    if (sq) { ring.rotation.z = Math.PI / 4; ring.scale.set(1.15, 0.85, 1); }
    ring.position.set(s * 0.039, 0, 0.117);
    g.add(ring);
    if (type === 'ram') {
      const lens = new THREE.Mesh(new THREE.CircleGeometry(sq ? 0.03 : 0.025, sq ? 4 : 16), new THREE.MeshStandardMaterial({ color: item.colors.accent || '#1b1f2a', transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.3 }));
      lens.rotation.z = Math.PI / 4; lens.scale.set(1.15, 0.85, 1);
      lens.position.set(s * 0.039, 0, 0.117);
      g.add(lens);
    }
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.12), frame);
    temple.position.set(s * 0.1, 0.004, 0.06);
    g.add(temple);
  }
  if (type === 'nua') {
    for (const s of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.011, 0.008), lowpolyMat(item.colors.accent || '#1b1b1d', { roughness: 0.4 }));
      brow.position.set(s * 0.039, 0.018, 0.118);
      g.add(brow);
    }
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.004, 0.004), frame);
  bridge.position.set(0, 0.006, 0.119);
  g.add(bridge);
  return { parts: [{ joint: 'head', obj: shadowed(g) }] };
}

// ---------------------------------------------------------- DỤNG CỤ (tay phải)
export function buildHandheld(ctx) {
  const { item, emblemCanvas } = ctx;
  const type = item.options?.type || 'laptop';
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
  const g = new THREE.Group();
  let pose = {};

  if (type === 'laptop') {
    const lap = rbox(0.022, 0.215, 0.305, 0.008, lowpolyMat(main, { roughness: 0.35, metalness: 0.4 }));
    lap.position.set(0.035, -0.135, 0.06);
    g.add(lap);
    if (item.emblem && emblemCanvas) {
      const st = decal(emblemCanvas, 0.06, 0.06);
      st.position.set(0.035 - 0.0115, -0.13, 0.06); st.rotation.y = -Math.PI / 2;
      g.add(st);
    }
  } else if (type === 'vo') {
    const book = rbox(0.018, 0.21, 0.15, 0.004, lowpolyMat(main));
    book.position.set(0.032, -0.12, 0.04);
    g.add(book);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), lowpolyMat('#ffffff'));
    label.position.set(0.032 - 0.0095, -0.1, 0.04); label.rotation.y = -Math.PI / 2;
    g.add(label);
    const pen = limb(0.14, 0.005, 0.005, lowpolyMat(accent), 6);
    pen.position.set(0.012, -0.03, 0.08); pen.rotation.x = 0.3;
    g.add(pen);
  } else if (type === 'binh-nuoc') {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.19, 10), lowpolyMat(main, { roughness: 0.3, metalness: 0.35 }));
    bottle.position.set(0.02, -0.07, 0.02);
    g.add(bottle);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.035, 10), lowpolyMat(accent));
    lid.position.set(0.02, 0.04, 0.02);
    g.add(lid);
    pose = { elbowR: -0.75 };
  } else if (type === 'o') {
    const shaft = limb(0.7, 0.0075, 0.0075, lowpolyMat('#3a3a3a', { metalness: 0.5 }), 6);
    shaft.position.set(0.012, -0.03, 0.02);
    g.add(shaft);
    const fold = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.46, 8), lowpolyMat(main));
    fold.rotation.x = Math.PI;
    fold.position.set(0.012, -0.47, 0.02);
    g.add(fold);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 10, Math.PI), lowpolyMat(accent));
    hook.position.set(0.012, -0.03, 0.05); hook.rotation.y = Math.PI / 2; hook.rotation.z = Math.PI;
    g.add(hook);
  } else if (type === 'may-tinh') {
    const calc = rbox(0.085, 0.16, 0.016, 0.006, lowpolyMat(main));
    const face = decal(calculatorFace(main, accent), 0.078, 0.15);
    face.position.z = 0.0085;
    calc.add(face);
    calc.position.set(0.02, -0.09, 0.03);
    calc.rotation.set(-0.3, -0.6, 0);
    g.add(calc);
    pose = { elbowR: -1.05 };
  } else if (type === 'sach') {
    const book = rbox(0.045, 0.24, 0.17, 0.004, lowpolyMat(main));
    book.position.set(0.04, -0.13, 0.04);
    g.add(book);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.232, 0.004), lowpolyMat('#f6f2e6'));
    pages.position.set(0.04, -0.13, 0.04 + 0.085);
    g.add(pages);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.0455, 0.03, 0.172), lowpolyMat(accent));
    band.position.set(0.04, -0.06, 0.04);
    g.add(band);
    const book2 = rbox(0.022, 0.21, 0.15, 0.004, lowpolyMat(item.colors.second || '#e8b93a'));
    book2.position.set(0.075, -0.12, 0.035);
    g.add(book2);
  } else if (type === 'but') {
    const pen = limb(0.15, 0.0055, 0.0045, lowpolyMat(main, { roughness: 0.35 }), 6);
    pen.position.set(0.012, -0.0, 0.03); pen.rotation.x = 0.9;
    g.add(pen);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.04, 0.004), lowpolyMat(accent, { metalness: 0.6 }));
    clip.position.set(0.018, -0.012, 0.035); clip.rotation.x = 0.9;
    g.add(clip);
    pose = { elbowR: -0.9 };
  } else if (type === 'hop-but') {
    const pouch = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.15, 4, 8), lowpolyMat(main));
    pouch.rotation.x = Math.PI / 2; pouch.scale.set(1, 1, 0.75);
    pouch.position.set(0.02, -0.08, 0.04);
    g.add(pouch);
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.2), lowpolyMat(accent));
    zip.position.set(0.02, -0.052, 0.04);
    g.add(zip);
    pose = { elbowR: -0.6 };
  } else if (type === 'dien-thoai') {
    const phone = rbox(0.074, 0.155, 0.009, 0.008, lowpolyMat(main, { roughness: 0.3, metalness: 0.3 }));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshStandardMaterial({ color: '#1d2433', emissive: '#2a3f66', emissiveIntensity: 0.6, roughness: 0.2 }));
    scr.position.z = 0.0048;
    phone.add(scr);
    phone.position.set(0.02, -0.08, 0.035);
    phone.rotation.set(-0.35, -0.7, 0);
    g.add(phone);
    pose = { elbowR: -1.1 };
  } else if (type === 'ong-ban-ve') {
    const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.64, 10), lowpolyMat(main));
    tubeM.position.set(0.04, -0.22, 0.02);
    g.add(tubeM);
    for (const y of [0.1, -0.54]) {
      const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.05, 10), lowpolyMat(accent));
      capM.position.set(0.04, y, 0.02);
      g.add(capM);
    }
    const strap = limb(0.6, 0.006, 0.006, lowpolyMat('#222'), 4);
    strap.position.set(0.075, 0.08, 0.02);
    g.add(strap);
  }
  return { parts: [{ joint: 'wristR', obj: shadowed(g) }], pose };
}

// ---------------------------------------------------------- KHẨU TRANG
export function buildMask(ctx) {
  const { item, imgs } = ctx;
  const cloth = item.options?.type === 'vai';
  const rows = 6;
  const geo = new THREE.CylinderGeometry(0.133, 0.122, 0.088, 18, rows, true, -1.12, 2.24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const row = Math.round(((y + 0.044) / 0.088) * rows);
    if (!cloth && row > 0 && row < rows && row % 2 === 1) { pos.setX(i, pos.getX(i) * 1.03); pos.setZ(i, pos.getZ(i) * 1.03); }
  }
  geo.computeVertexNormals();
  geo.scale(0.9, 1, 1);
  const tex = imgs.front ? toTexture(imageCanvas(imgs.front)) : toTexture(maskTexture(item.colors.main, { pleats: !cloth, edge: !cloth }));
  const mask = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: DS, roughness: 0.95, flatShading: true }));
  mask.position.y = 0.064;
  const g = new THREE.Group();
  g.add(mask);
  const loopMat = lowpolyMat(item.colors.accent || '#f4f6f8');
  for (const s of [-1, 1]) {
    for (const y of [0.098, 0.032]) {
      g.add(tube([[s * 0.104, y, 0.056], [s * 0.118, (y + 0.11) / 2 + 0.012, 0.012], [s * 0.114, 0.11, -0.03]], 0.0024, loopMat));
    }
  }
  return { parts: [{ joint: 'head', obj: g }] };
}

// ---------------------------------------------------------- TAI NGHE
export function buildAudio(ctx) {
  const { item } = ctx;
  const type = item.options?.type || 'chup-tai';
  const main = item.colors.main, accent = item.colors.accent || shade(main, -0.25);
  const mat = lowpolyMat(main, { roughness: 0.4 });
  const pad = lowpolyMat(accent, { roughness: 0.9 });
  const g = new THREE.Group();

  const cup = () => {
    const c = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.046, 0.028, 14), mat);
    shell.rotation.z = Math.PI / 2;
    c.add(shell);
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.012, 6, 14), pad);
    cushion.rotation.y = Math.PI / 2;
    c.add(cushion);
    return c;
  };

  if (type === 'chup-tai') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.138, 0.008, 5, 22, Math.PI), mat);
    band.scale.set(0.98, 1.02, 1.6);
    band.position.y = 0.105;
    g.add(band);
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.011, 5, 12, Math.PI * 0.5), pad);
    top.rotation.z = Math.PI / 4; top.position.y = 0.105;
    g.add(top);
    for (const s of [-1, 1]) {
      const c = cup();
      c.position.set(s * 0.122, 0.1, 0);
      if (s < 0) c.rotation.y = Math.PI;
      g.add(c);
    }
    return { parts: [{ joint: 'head', obj: shadowed(g) }] };
  }
  if (type === 'deo-co') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.008, 5, 22, Math.PI), mat);
    band.rotation.x = -Math.PI / 2 - 0.25;
    band.position.set(0, 0.5, -0.005);
    g.add(band);
    for (const s of [-1, 1]) {
      const c = cup();
      c.position.set(s * 0.1, 0.49, 0.03);
      c.rotation.set(0, 0, s * 0.9);
      g.add(c);
    }
    return { parts: [{ joint: 'torso', obj: shadowed(g) }] };
  }
  // nhét tai
  for (const s of [-1, 1]) {
    const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(0.012, 1), mat);
    bud.position.set(s * 0.112, 0.112, 0.004);
    g.add(bud);
    const stem = limb(0.03, 0.0045, 0.0045, mat, 6);
    stem.position.set(s * 0.114, 0.106, 0.006);
    g.add(stem);
  }
  return { parts: [{ joint: 'head', obj: g }] };
}
