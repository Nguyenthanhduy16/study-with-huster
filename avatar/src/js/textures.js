// =============================================================
//  textures.js — mọi texture vẽ bằng canvas (không cần file ảnh)
//  + tải ảnh do bạn cung cấp (áo, dép, thẻ SV...) và ghép vào vải
// =============================================================
import * as THREE from 'three';

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function toTexture(cnv, { repeat = null, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(cnv);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

// ---------- Tải ảnh (có cache, lỗi thì trả null chứ không làm hỏng cả cảnh)
const imageCache = new Map();
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('[avatar-studio] Không tải được ảnh:', src);
      resolve(null);
    };
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

// Tải mọi ảnh trong object { front: url, back: url, ... } → { front: Image, ... }
export async function loadImageSet(set = {}) {
  const out = {};
  await Promise.all(Object.entries(set || {}).map(async ([k, v]) => { out[k] = await loadImage(v); }));
  return out;
}

// ---------- Màu
export function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return '#' + c.getHexString();
}
export function isDark(hex) {
  const c = new THREE.Color(hex);
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) < 0.5;
}

// ---------- Vải: màu nền + sợi dệt nhẹ
function drawWeave(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = '#fff';
  for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
  ctx.globalAlpha = 1;
}

function drawPattern(ctx, w, h, img, scale = 0.25) {
  const tw = Math.max(16, img.width * scale), th = Math.max(16, img.height * scale);
  for (let y = 0; y < h; y += th) for (let x = 0; x < w; x += tw) ctx.drawImage(img, x, y, tw, th);
}

// vẽ ảnh vừa khung (contain), canh giữa tại (cx, top)
function drawContain(ctx, img, cx, top, maxW, maxH) {
  const r = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * r, h = img.height * r;
  ctx.drawImage(img, cx - w / 2, top, w, h);
}

/**
 * Ghép texture cho thân áo (LatheGeometry, phiStart = -π/2):
 *   u = 0.25 là chính giữa NGỰC, u = 0.75 là giữa LƯNG.
 *   canvas trên cùng = cổ áo, dưới cùng = gấu áo.
 * opts: { color, imgs:{front,back,pattern}, emblem(canvas), emblemPos, stripes, buttons, zipper, accent }
 */
export function composeGarment(opts) {
  const W = 1024, H = 512;
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  const { color = '#ffffff', imgs = {}, emblem, emblemPos, accent = '#333' } = opts;

  if (imgs.pattern) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); drawPattern(ctx, W, H, imgs.pattern, opts.patternScale ?? 0.25); }
  else drawWeave(ctx, W, H, color);
  if (opts.plaid) drawPlaid(ctx, W, H, opts.plaid, 64);
  if (opts.breton) drawBreton(ctx, W, H, opts.breton, 22);

  const trim = opts.trim || '#ffffff';
  // Viền raglan: đường cong từ cổ xuống nách, trước và sau
  if (opts.piping) {
    ctx.strokeStyle = trim; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const c of [0.25, 0.75]) {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(W * (c + s * 0.055), 2);
        ctx.bezierCurveTo(W * (c + s * 0.09), H * 0.14, W * (c + s * 0.2), H * 0.2, W * (c + s * 0.25), H * 0.36);
        ctx.stroke();
      }
    }
  }
  // Viền sườn (áo thun thể thao)
  if (opts.sidePiping) {
    ctx.strokeStyle = trim; ctx.lineWidth = 5;
    for (const u of [0.0, 0.5, 1.0]) {
      ctx.beginPath();
      ctx.moveTo(W * u, H * 0.34);
      ctx.bezierCurveTo(W * (u + (u === 0.5 ? -0.025 : 0.02)), H * 0.6, W * (u + (u === 0.5 ? 0.02 : -0.02)), H * 0.85, W * u, H);
      ctx.stroke();
    }
  }
  // Cổ tim phối viền (đồng phục kiểu raglan)
  if (opts.vneck) {
    const vc = opts.vneck;
    for (const [w, col] of [[16, vc[0]], [6, vc[1] || '#ffffff']]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(W * 0.25 - 62, 0); ctx.lineTo(W * 0.25, H * 0.2); ctx.lineTo(W * 0.25 + 62, 0);
      ctx.stroke();
    }
  }
  // Bo gấu áo
  if (opts.hemBand) {
    ctx.fillStyle = shade(color, -0.07);
    ctx.fillRect(0, H * 0.93, W, H * 0.07);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let x = 0; x < W; x += 6) ctx.fillRect(x, H * 0.93, 2, H * 0.07);
  }
  // Túi mổ chéo (áo khoác)
  if (opts.weltPockets) {
    ctx.strokeStyle = shade(color, -0.22); ctx.lineWidth = 5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(W * (0.25 + s * 0.09), H * 0.62);
      ctx.lineTo(W * (0.25 + s * 0.115), H * 0.86);
      ctx.stroke();
    }
  }

  // Sọc ngang (áo thể thao)
  if (opts.stripes) {
    ctx.fillStyle = accent;
    for (const s of opts.stripes) ctx.fillRect(0, s[0] * H, W, (s[1] - s[0]) * H);
  }
  // Nẹp khuy (sơ mi / polo)
  if (opts.placket) {
    const [y0, y1] = opts.placket;
    ctx.fillStyle = shade(color, -0.06);
    ctx.fillRect(W * 0.25 - 14, y0 * H, 28, (y1 - y0) * H);
    ctx.fillStyle = isDark(color) ? '#ddd' : '#9aa0a8';
    for (let y = y0 * H + 22; y < y1 * H; y += 52) { ctx.beginPath(); ctx.arc(W * 0.25, y, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  // Khóa kéo (áo khoác)
  if (opts.zipper) {
    ctx.fillStyle = opts.zipperColor || shade(color, -0.25);
    ctx.fillRect(W * 0.25 - 3, 0, 6, H);
    ctx.fillStyle = '#c9ccd1';
    ctx.fillRect(W * 0.25 - 5, H * 0.22, 10, 20);
  }
  // Túi hoodie trước bụng
  if (opts.kangaroo) {
    ctx.fillStyle = shade(color, -0.05);
    ctx.strokeStyle = shade(color, -0.16); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.25 - 100, H * 0.98); ctx.lineTo(W * 0.25 - 70, H * 0.66);
    ctx.lineTo(W * 0.25 + 70, H * 0.66); ctx.lineTo(W * 0.25 + 100, H * 0.98);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // Túi ngực trái
  if (opts.pocket) {
    ctx.strokeStyle = shade(color, -0.18); ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.25 + 38, H * 0.3, 70, 78);
  }

  // Ảnh in mặt trước / sau (data của bạn)
  if (imgs.front) drawContain(ctx, imgs.front, W * 0.25, H * (opts.frontTop ?? 0.22), W * 0.22, H * 0.5);
  if (imgs.back) drawContain(ctx, imgs.back, W * 0.75, H * 0.16, W * 0.26, H * 0.6);

  // Huy hiệu tự tạo
  if (emblem && emblemPos) {
    const pos = {
      'chest-left': [W * 0.25 + 72, H * 0.24, 76],
      'chest-center': [W * 0.25, H * 0.22, 130],
      'back': [W * 0.75, H * 0.2, 200],
    }[emblemPos];
    if (pos) ctx.drawImage(emblem, pos[0] - pos[2] / 2, pos[1], pos[2], pos[2]);
  }
  // Chữ in (wordmark) — lấy từ huy hiệu tự tạo, KHÔNG dùng logo chữ thật của trường
  if (opts.wordmark && opts.wordmarkText) {
    const big = opts.wordmark === 'chest-big';
    drawWordmark(ctx, opts.wordmarkText, big ? W * 0.25 : W * 0.25 + 70, big ? H * 0.3 : H * 0.2, big ? W * 0.3 : 96, big ? 92 : 28, opts.printColor || '#ffffff');
    if (opts.wordmarkBack) drawWordmark(ctx, opts.wordmarkText, W * 0.75, H * 0.14, W * 0.18, 40, opts.printColor || '#ffffff');
  }
  if (opts.archText) drawArchText(ctx, opts.archText, W * 0.25 + 92, H * 0.2, 74, opts.printColor || '#ffffff', opts.archSub);
  return cnv;
}

// ---------- Hoa văn vải
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

// Chữ in thân áo: đậm, nghiêng nhẹ, giãn chữ
export function drawWordmark(ctx, text, cx, top, maxW, px, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  let size = px;
  const font = (s) => `italic 800 ${s}px "Be Vietnam Pro", system-ui, sans-serif`;
  ctx.font = font(size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.06)}px`;
  while (ctx.measureText(text).width > maxW && size > 10) { size -= 2; ctx.font = font(size); }
  ctx.fillText(text, cx, top);
  ctx.restore();
}

// Chữ uốn vòng cung (kiểu tên trường in trên áo khoác thể thao)
export function drawArchText(ctx, text, cx, top, radius, color, sub) {
  ctx.save();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const chars = [...text.toUpperCase()];
  const size = Math.max(11, Math.min(20, 300 / chars.length));
  ctx.font = `800 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
  const span = Math.min(Math.PI * 0.95, chars.length * 0.12);
  const cy = top + radius;
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 - span / 2 + (span * (i + 0.5)) / chars.length;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  if (sub) { ctx.font = `700 ${size + 2}px "Be Vietnam Pro", system-ui, sans-serif`; ctx.fillText(sub.toUpperCase(), cx, cy - radius * 0.45); }
  ctx.restore();
}

// Dây đeo thẻ: chữ chạy dọc + chuỗi lục giác ở hai đầu (thay cho mũi tên/vạch của mẫu gốc)
export function ribbonTexture(text, bg, fg) {
  const W = 2048, H = 96;
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = fg;
  ctx.fillRect(0, 6, W, 3); ctx.fillRect(0, H - 9, W, 3);
  ctx.font = `800 40px "Be Vietnam Pro", system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  const unit = `${text}   `;
  const uw = ctx.measureText(unit).width;
  for (let x = 40; x < W * 0.7; x += uw) ctx.fillText(unit, x, H / 2 + 2);
  // chuỗi lục giác phía đầu gần thẻ
  for (let i = 0; i < 6; i++) {
    const x = W * 0.76 + i * 72, r = 22;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r, H / 2 + Math.sin(a) * r); }
    ctx.closePath();
    if (i % 2) ctx.fill(); else { ctx.lineWidth = 5; ctx.strokeStyle = fg; ctx.stroke(); }
  }
  return cnv;
}

// Quai dép tổ ong: lỗ hình thoi xếp so le + khe dài hai bên, viền đặc
let slideBandCache = null;
export function slideBandAlpha() {
  if (slideBandCache) return slideBandCache;
  const W = 512, H = 256; // W: vòng quanh mu bàn chân, H: dọc theo bàn chân
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  const dx = 30, dy = 26, r = 9;
  for (let row = 0, y = 34; y < H - 28; row++, y += dy) {
    for (let x = 70 + (row % 2 ? dx / 2 : 0); x < W - 70; x += dx) {
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y);
      ctx.closePath(); ctx.fill();
    }
  }
  // khe dài hai bên sát đế
  for (const x of [26, W - 26]) {
    ctx.beginPath(); ctx.roundRect(x - 8, 70, 16, 120, 8); ctx.fill();
  }
  slideBandCache = toTexture(cnv, { srgb: false });
  return slideBandCache;
}
// Vân đan nổi trên quai (map màu)
export function slideBandMap(color) {
  const cnv = makeCanvas(256, 128);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = shade(color, -0.08); ctx.lineWidth = 2;
  for (let i = -128; i < 256; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke(); }
  ctx.strokeStyle = shade(color, 0.05);
  for (let i = 0; i < 384; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 128, 128); ctx.stroke(); }
  return cnv;
}

// Khẩu trang: vải không dệt + viền ép chấm ở 4 cạnh
export function maskTexture(color, { pleats = true, edge = true } = {}) {
  const W = 256, H = 128;
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.06; ctx.fillStyle = '#fff';
  for (let y = 0; y < H; y += 3) for (let x = (y % 6) ? 1 : 0; x < W; x += 3) ctx.fillRect(x, y, 1, 1);
  ctx.globalAlpha = 1;
  if (pleats) {
    for (const y of [0.36, 0.56, 0.76]) {
      const g = ctx.createLinearGradient(0, H * y - 8, 0, H * y + 4);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = g; ctx.fillRect(0, H * y - 8, W, 12);
    }
  }
  if (edge) {
    const band = shade(color, 0.12);
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, W, 12); ctx.fillRect(0, H - 12, W, 12); ctx.fillRect(0, 0, 12, H); ctx.fillRect(W - 12, 0, 12, H);
    ctx.fillStyle = shade(color, -0.12);
    for (let x = 4; x < W; x += 6) { ctx.fillRect(x, 3, 3, 2); ctx.fillRect(x, 7, 3, 2); ctx.fillRect(x, H - 9, 3, 2); ctx.fillRect(x, H - 5, 3, 2); }
    for (let y = 4; y < H; y += 6) { ctx.fillRect(3, y, 2, 3); ctx.fillRect(7, y, 2, 3); ctx.fillRect(W - 9, y, 2, 3); ctx.fillRect(W - 5, y, 2, 3); }
  }
  return cnv;
}

// Vải trơn cho tay áo, ống quần (chỉ màu + hoa văn, không có hình in)
export function composePlain(color, imgs = {}, opts = {}) {
  const cnv = makeCanvas(256, 256);
  const ctx = cnv.getContext('2d');
  if (imgs.pattern) { ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256); drawPattern(ctx, 256, 256, imgs.pattern, (opts.patternScale ?? 0.25) * 0.5); }
  else drawWeave(ctx, 256, 256, color);
  if (opts.plaid) drawPlaid(ctx, 256, 256, opts.plaid, 32);
  if (opts.breton) drawBreton(ctx, 256, 256, opts.breton, 22);
  // Sọc dọc tay áo — ở u = 0.25 và 0.75 (mặt ngoài của tay trái / tay phải)
  if (opts.sleeveStripes) {
    ctx.fillStyle = opts.trim || '#ffffff';
    const n = opts.sleeveStripes;
    for (const c of [64, 192]) for (let i = 0; i < n; i++) ctx.fillRect(c - (n * 14) / 2 + i * 14, 0, 7, 256);
  }
  if (opts.denim) {
    ctx.globalAlpha = 0.12; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (let i = -256; i < 256; i += 5) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (opts.sideStripe) {
    ctx.fillStyle = opts.sideStripe;
    // u = 0/1 là mặt ngoài ống quần; u = 0.5 cho phía hông còn lại
    ctx.fillRect(0, 0, 10, 256); ctx.fillRect(246, 0, 10, 256); ctx.fillRect(123, 0, 10, 256);
  }
  return cnv;
}

// ---------- Dép tổ ong: alphaMap lỗ lục giác (đen = lỗ, trắng = nhựa)
let honeycombCache = null;
export function honeycombAlpha() {
  if (honeycombCache) return honeycombCache;
  const W = 256, H = 256;
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  const r = 13, dx = r * Math.sqrt(3) + 7, dy = r * 1.5 + 6;
  for (let row = -1, y = 0; y < H + r * 2; row++, y = row * dy) {
    for (let x = (row % 2 ? dx / 2 : 0) - dx; x < W + dx; x += dx) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  honeycombCache = toTexture(cnv, { srgb: false, repeat: [1, 1] });
  return honeycombCache;
}

// Ảnh hoa văn tổ ong để hiển thị trong UI (nút / thumbnail)
export function honeycombPreview(color) {
  const c = makeCanvas(64, 64), x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 64, 64);
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(honeycombAlpha().image, 0, 0, 64, 64);
  return c;
}

// ---------- Nón lá: các nan tre đồng tâm
export function nonLaTexture(color = '#e9d9a8') {
  const cnv = makeCanvas(512, 256);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 10) {
    ctx.fillStyle = (x / 10) % 2 ? shade(color, -0.05) : shade(color, 0.03);
    ctx.fillRect(x, 0, 10, 256);
  }
  ctx.strokeStyle = shade(color, -0.22); ctx.lineWidth = 2;
  for (let y = 16; y < 256; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  return cnv;
}

// ---------- Bàn phím máy tính cầm tay
export function calculatorFace(color = '#2b2f36', accent = '#e86a33') {
  const cnv = makeCanvas(128, 224);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 224);
  ctx.fillStyle = '#b9c6a2'; ctx.fillRect(14, 14, 100, 40);
  ctx.fillStyle = '#4a5240'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'right'; ctx.fillText('3.1415', 108, 42);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
    ctx.fillStyle = (r === 5 && c === 4) ? accent : (r < 2 ? shade(color, 0.2) : shade(color, 0.32));
    ctx.fillRect(12 + c * 21, 68 + r * 25, 16, 17);
  }
  return cnv;
}

// =============================================================
//  HUY HIỆU TỰ TẠO — thay cho logo thật của trường
//  Thiết kế gốc từ: hình dạng + biểu tượng + chữ viết tắt + màu
// =============================================================
function pathShape(ctx, shape, cx, cy, s) {
  ctx.beginPath();
  if (shape === 'tron') {
    ctx.arc(cx, cy, s, 0, Math.PI * 2);
  } else if (shape === 'luc-giac') {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    }
  } else if (shape === 'co-hieu') { // cờ hiệu đuôi nhọn
    ctx.moveTo(cx - s * 0.8, cy - s);
    ctx.lineTo(cx + s * 0.8, cy - s);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.55);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s * 0.8, cy + s * 0.55);
  } else { // khiên
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
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = s * 0.09; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  if (motif === 'sao') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.42 : s;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  } else if (motif === 'sach') {
    ctx.moveTo(cx, cy - s * 0.35);
    ctx.quadraticCurveTo(cx - s * 0.5, cy - s * 0.65, cx - s, cy - s * 0.45);
    ctx.lineTo(cx - s, cy + s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.35, cx, cy + s * 0.65);
    ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.35, cx + s, cy + s * 0.55);
    ctx.lineTo(cx + s, cy - s * 0.45);
    ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.65, cx, cy - s * 0.35);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.35); ctx.lineTo(cx, cy + s * 0.65); ctx.stroke();
  } else if (motif === 'banh-rang') {
    const teeth = 10;
    for (let i = 0; i < teeth * 2; i++) {
      const a = i * Math.PI / teeth, r = i % 2 ? s * 0.78 : s;
      ctx.lineTo(cx + Math.cos(a - 0.12) * r, cy + Math.sin(a - 0.12) * r);
      ctx.lineTo(cx + Math.cos(a + 0.12) * r, cy + Math.sin(a + 0.12) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2); ctx.fill();
  } else if (motif === 'la') {
    ctx.moveTo(cx, cy + s);
    ctx.quadraticCurveTo(cx - s * 0.95, cy, cx, cy - s);
    ctx.quadraticCurveTo(cx + s * 0.95, cy, cx, cy + s);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.8); ctx.lineTo(cx, cy - s * 0.7); ctx.stroke();
  } else if (motif === 'song') {
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const y = cy - s * 0.45 + k * s * 0.45;
      ctx.moveTo(cx - s, y);
      for (let i = 0; i <= 4; i++) ctx.quadraticCurveTo(cx - s + (i + 0.25) * s * 0.5, y - s * 0.22 * (i % 2 ? -1 : 1), cx - s + (i + 0.5) * s * 0.5, y);
      ctx.stroke();
    }
  } else if (motif === 'to-ong') {
    const r = s * 0.36;
    const cells = [[0, 0], [1, 0], [-1, 0], [0.5, -1], [-0.5, -1], [0.5, 1], [-0.5, 1]];
    for (const [i, j] of cells) {
      const x = cx + i * r * 1.85, y = cy + j * r * 1.6;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); }
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * emblem = { name, short, year, shape, motif, main, accent }
 * Trả về canvas 512×512 nền trong suốt
 */
export function drawEmblem(emblem, size = 512) {
  const e = { shape: 'khien', motif: 'sach', main: '#4b2e9a', accent: '#f0b53a', short: 'TO', year: '2026', ...emblem };
  const cnv = makeCanvas(size, size);
  const ctx = cnv.getContext('2d');
  const k = size / 512, cx = 256 * k, cy = 256 * k, s = 230 * k;

  pathShape(ctx, e.shape, cx, cy, s);
  ctx.fillStyle = e.main; ctx.fill();
  ctx.lineWidth = 14 * k; ctx.strokeStyle = e.accent; ctx.stroke();
  pathShape(ctx, e.shape, cx, cy, s * 0.86);
  ctx.lineWidth = 4 * k; ctx.strokeStyle = shade(e.accent, 0.15); ctx.stroke();

  drawMotif(ctx, e.motif, cx, cy - 40 * k, 88 * k, e.accent);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const short = (e.short || '').toUpperCase().slice(0, 4);
  ctx.font = `800 ${(short.length > 2 ? 78 : 98) * k}px "Be Vietnam Pro", system-ui, sans-serif`;
  ctx.fillText(short, cx, cy + 92 * k);

  if (e.year) {
    ctx.font = `700 ${26 * k}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.fillStyle = e.accent;
    ctx.fillText(`TL ${e.year}`, cx, cy + 160 * k);
  }
  return cnv;
}

// =============================================================
//  THẺ SINH VIÊN MẪU (tỉ lệ thẻ CR80: 85.6 × 54 mm)
//  card = { school, title, name, id, major, cohort, photo(Image|canvas), template(Image), drawHeader }
// =============================================================
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function drawStudentCard(card, emblemCanvas, emblem) {
  const W = 1024, H = 646;
  const cnv = makeCanvas(W, H);
  const ctx = cnv.getContext('2d');
  const main = emblem?.main || '#4b2e9a', accent = emblem?.accent || '#f0b53a';
  const font = (w, px) => `${w} ${px}px "Be Vietnam Pro", system-ui, sans-serif`;

  // Nền
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 34); ctx.clip();
  if (card.template) {
    ctx.drawImage(card.template, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#f7f6fb'; ctx.fillRect(0, 0, W, H);
    // hoa văn lục giác chìm
    ctx.globalAlpha = 0.06; ctx.strokeStyle = main; ctx.lineWidth = 2;
    for (let y = 0; y < H + 40; y += 46) for (let x = (y / 46) % 2 ? 26 : 0; x < W + 40; x += 52) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); } ctx.closePath(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // dải màu chéo
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.moveTo(W * 0.62, H); ctx.lineTo(W, H * 0.42); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(W * 0.56, H); ctx.lineTo(W * 0.6, H); ctx.lineTo(W, H * 0.36); ctx.lineTo(W, H * 0.42); ctx.closePath(); ctx.fill();
  }

  if (card.drawHeader !== false) {
    ctx.fillStyle = main; ctx.fillRect(0, 0, W, 138);
    ctx.fillStyle = accent; ctx.fillRect(0, 138, W, 8);
    if (emblemCanvas) ctx.drawImage(emblemCanvas, 30, 14, 112, 112);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = font(800, 40); ctx.fillText((card.school || 'Trường Đại học Mẫu').toUpperCase(), 160, 70, W - 190);
    ctx.font = font(600, 26); ctx.fillStyle = shade(accent, 0.2); ctx.fillText(card.title || 'THẺ SINH VIÊN', 160, 112);
  }

  // Ảnh
  const px = 46, py = 180, pw = 250, ph = 320;
  ctx.fillStyle = '#e4e2ec'; ctx.fillRect(px, py, pw, ph);
  if (card.photo) {
    const im = card.photo, r = Math.max(pw / im.width, ph / im.height);
    const w = im.width * r, h = im.height * r;
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.drawImage(im, px + (pw - w) / 2, py + (ph - h) / 2, w, h); ctx.restore();
  } else {
    ctx.fillStyle = '#c3bfd3';
    ctx.beginPath(); ctx.arc(px + pw / 2, py + 125, 62, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph, 105, 120, 0, Math.PI, 0); ctx.fill();
  }
  ctx.strokeStyle = main; ctx.lineWidth = 4; ctx.strokeRect(px, py, pw, ph);

  // Thông tin
  const fx = 336;
  const rows = [
    ['Họ và tên', card.name || 'Nguyễn Minh An'],
    ['MSSV', card.id || '26A0001'],
    ['Ngành', card.major || 'Thiết kế đồ họa'],
    ['Khóa', card.cohort || 'K66 · 2026–2030'],
  ];
  ctx.textAlign = 'left';
  rows.forEach(([label, val], i) => {
    const y = 214 + i * 76;
    ctx.fillStyle = '#6b6680'; ctx.font = font(600, 22); ctx.fillText(label.toUpperCase(), fx, y);
    ctx.fillStyle = '#1d1a2b'; ctx.font = font(i === 0 ? 800 : 700, i === 0 ? 40 : 32); ctx.fillText(val, fx, y + (i === 0 ? 42 : 36), W - fx - 40);
  });

  // Mã vạch trang trí (sinh từ chuỗi giả, không mã hoá dữ liệu thật)
  let h = hashStr((card.id || '') + (card.name || ''));
  let bx = 336;
  ctx.fillStyle = '#1d1a2b';
  while (bx < 640) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const bw = 2 + (h % 5);
    ctx.fillRect(bx, 548, bw, 58);
    bx += bw + 2 + ((h >>> 8) % 4);
  }

  // Dấu MẪU — bắt buộc giữ để thẻ không bị dùng như thẻ thật
  ctx.save();
  ctx.translate(W * 0.55, H * 0.56); ctx.rotate(-0.32);
  ctx.globalAlpha = 0.1; ctx.fillStyle = '#c0392b'; ctx.font = font(900, 150); ctx.textAlign = 'center';
  ctx.fillText('MẪU', 0, 40);
  ctx.restore();
  ctx.fillStyle = '#c0392b'; ctx.font = font(700, 18); ctx.textAlign = 'left';
  ctx.fillText('THẺ MẪU · KHÔNG CÓ GIÁ TRỊ SỬ DỤNG', 46, 620);
  ctx.restore();
  return cnv;
}

// Bóng mờ dưới chân
export function blobShadow() {
  const c = makeCanvas(128, 128), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(20,16,40,0.42)'); g.addColorStop(1, 'rgba(20,16,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

// ---------- Tay áo (ô 512×512 trong atlas): u = 0.5 là mặt NGOÀI của tay
export function composeSleeve(color, imgs = {}, opts = {}) {
  const S = 512;
  const cnv = makeCanvas(S, S);
  const ctx = cnv.getContext('2d');
  if (imgs.pattern) { ctx.fillStyle = color; ctx.fillRect(0, 0, S, S); drawPattern(ctx, S, S, imgs.pattern, opts.patternScale ?? 0.25); }
  else drawWeave(ctx, S, S, color);
  if (opts.plaid) drawPlaid(ctx, S, S, opts.plaid, 64);
  if (opts.breton) drawBreton(ctx, S, S, opts.breton, 30);
  if (opts.sleeveStripes) {
    ctx.fillStyle = opts.trim || '#ffffff';
    const n = opts.sleeveStripes, w = 16, gap = 14;
    const total = n * w + (n - 1) * gap;
    for (let i = 0; i < n; i++) ctx.fillRect(S / 2 - total / 2 + i * (w + gap), 0, w, S);
  }
  if (opts.piping) { ctx.fillStyle = opts.trim || '#ffffff'; ctx.fillRect(S / 2 - 4, 0, 8, S); }
  if (opts.cuff) {
    ctx.fillStyle = shade(color, -0.08); ctx.fillRect(0, S * 0.9, S, S * 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let x = 0; x < S; x += 8) ctx.fillRect(x, S * 0.9, 3, S * 0.1);
  } else if (opts.hem) {
    ctx.fillStyle = shade(color, -0.06); ctx.fillRect(0, S * 0.94, S, 4);
  }
  if (opts.emblem) ctx.drawImage(opts.emblem, S / 2 - 60, S * 0.16, 120, 120);
  return cnv;
}

// Atlas áo 1024×1024: nửa trên = thân (u .25 ngực, .75 lưng); nửa dưới = tay trái | tay phải
export function composeTopAtlas(bodyCanvas, leftCanvas, rightCanvas) {
  const cnv = makeCanvas(1024, 1024);
  const ctx = cnv.getContext('2d');
  ctx.drawImage(bodyCanvas, 0, 0, 1024, 512);
  ctx.drawImage(leftCanvas, 0, 512, 512, 512);
  ctx.drawImage(rightCanvas, 512, 512, 512, 512);
  return cnv;
}
