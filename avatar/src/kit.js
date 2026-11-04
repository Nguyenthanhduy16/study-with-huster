// =============================================================
//  kit.js — bộ dựng nhân vật dùng trong Phòng ôn thi ảo (window.AvatarKit)
//  Đóng gói từ "Phòng thay đồ" (rig, quần áo, phụ kiện, thẻ SV) — xem tools/build_avatar.mjs
//
//  Khác với phòng thay đồ (chờ Promise tải ảnh rồi mới dựng), web chính dựng nhân vật đồng bộ.
//  Vì vậy kit:
//   - tải trước mọi ảnh trong tủ đồ (logo HUST, huy hiệu áo) ngay khi nạp → `ready`;
//   - bọc BUILDERS / drawEmblem / drawStudentCard: tự lấy ảnh đã tải, tự chuẩn hoá huy hiệu
//     (cấu hình cũ "Tổ Ong" → nhận diện mới, chỉ nhận logo có sẵn trong tủ đồ), giữ màu cố định
//     của món `fixedColors` (dây đeo + vỏ thẻ đỏ).
// =============================================================
import { buildRig, attachSkinned, linearize, DIM } from './js/rig.js';
import { BUILDERS as RAW_BUILDERS } from './js/items/index.js';
import { loadImage, loadImageSet, cachedImage, drawEmblem as rawDrawEmblem, drawStudentCard as rawDrawStudentCard } from './js/textures.js';
import CATALOG from './data/catalog.js';

export const SLOT_ORDER = ['hair', 'top', 'bottom', 'footwear', 'hat', 'bag', 'card', 'eyewear', 'mask', 'audio', 'handheld'];
export function mountParts(rig, parts) {
  return parts.map((p) => {
    if (p.skinned) { attachSkinned(rig, p.skinned); return { joint: 'root', obj: p.skinned }; }
    rig.joints[p.joint].add(p.obj);
    return p;
  });
}

const ITEMS = new Map(CATALOG.items.map((i) => [i.id, i]));
const DEF_EMBLEM = CATALOG.defaults.emblem;

// ---------- ảnh của tủ đồ: tải trước một lần
const IMAGE_PATHS = new Set();
for (const it of CATALOG.items) for (const v of Object.values(it.textures || {})) if (typeof v === 'string' && v) IMAGE_PATHS.add(v);
if (DEF_EMBLEM.logo) IMAGE_PATHS.add(DEF_EMBLEM.logo);
let readyFlag = false;
/** Promise: mọi ảnh của tủ đồ đã tải (hoặc lỗi — khi đó dùng huy hiệu vẽ tay) */
export const ready = Promise.all([...IMAGE_PATHS].map(loadImage)).then(() => { readyFlag = true; });
export const isReady = () => readyFlag;

/** chỉ nhận đường dẫn ảnh có trong tủ đồ (cấu hình của người khác đến qua mạng) */
function knownPath(src) {
  if (typeof src !== 'string') return null;
  if (IMAGE_PATHS.has(src)) return src;
  if (IMAGE_PATHS.has('avatar/' + src)) return 'avatar/' + src;   // cấu hình lưu từ bản phòng thay đồ độc lập
  return null;
}

/** huy hiệu đầy đủ: mặc định + phần đã chỉnh; đổi nhận diện cũ "Tổ Ong" như phòng thay đồ */
export function normEmblem(em) {
  const d = DEF_EMBLEM, e = Object.assign({}, d, em && typeof em === 'object' ? em : {});
  const legacy = e.name === 'Trường Đại học Kỹ thuật Tổ Ong' || e.wordmark === 'TỔ ONG' || e.short === 'KTO';
  if (e.name === 'Trường Đại học Kỹ thuật Tổ Ong') e.name = d.name;
  if (e.short === 'KTO') e.short = d.short;
  if (e.wordmark === 'TỔ ONG') e.wordmark = d.wordmark;
  if (legacy && e.year === '2026') e.year = d.year;
  if (legacy && e.accent === '#f6e7c8') e.accent = d.accent;
  if (e.logo) {
    const p = knownPath(e.logo);
    if (!p) { e.logo = d.logo; e.logoCrop = d.logoCrop; } else e.logo = p;
  }
  if (!(Array.isArray(e.logoCrop) && e.logoCrop.length === 4 && e.logoCrop.every((n) => typeof n === 'number'))) e.logoCrop = d.logoCrop;
  return e;
}

const emblemCache = new Map();
/** canvas huy hiệu (chỉ lưu đệm khi logo đã tải xong, để không giữ mãi bản vẽ tạm) */
function emblemFor(em) {
  const e = normEmblem(em), key = JSON.stringify(e);
  if (emblemCache.has(key)) return emblemCache.get(key);
  const c = rawDrawEmblem(e);
  if (!e.logo || cachedImage(e.logo) || readyFlag) { if (emblemCache.size > 64) emblemCache.clear(); emblemCache.set(key, c); }
  return c;
}
export function drawEmblem(em, size) { return size ? rawDrawEmblem(normEmblem(em), size) : emblemFor(em); }
export function drawStudentCard(card, emblemCanvas, emblem) {
  return rawDrawStudentCard(card, emblem ? emblemFor(emblem) : emblemCanvas, emblem ? normEmblem(emblem) : emblem);
}

/** builder của từng vị trí mặc, tự gắn ảnh đã tải + huy hiệu chuẩn hoá */
export const BUILDERS = {};
for (const [slot, fn] of Object.entries(RAW_BUILDERS)) {
  BUILDERS[slot] = (ctx) => {
    let item = ctx.item;
    const base = item && ITEMS.get(item.id);
    if (base && base.fixedColors) item = Object.assign({}, item, { colors: Object.assign({}, base.colors) });
    const imgs = {};
    for (const [k, v] of Object.entries((item && item.textures) || {})) { const im = cachedImage(knownPath(v)); if (im) imgs[k] = im; }
    for (const [k, v] of Object.entries(ctx.imgs || {})) if (v) imgs[k] = v;
    const emblem = normEmblem(ctx.emblem);
    return fn(Object.assign({}, ctx, { item, imgs, emblem, emblemCanvas: emblemFor(emblem) }));
  };
}

/**
 * Cấu hình gọn, an toàn để dựng: món không còn trong tủ đồ → món mặc định của vị trí đó,
 * màu chỉ giữ cho món có thật và không cố định màu, huy hiệu chuẩn hoá.
 */
export function normalizeState(s) {
  const d = CATALOG.defaults;
  s = s && typeof s === 'object' ? s : {};
  const equipped = Object.assign({}, d.equipped);
  for (const [slot, id] of Object.entries(s.equipped || {})) {
    if (!(slot in d.equipped)) continue;
    if (id === null) equipped[slot] = null;
    else if (ITEMS.has(id) && ITEMS.get(id).slot === slot) equipped[slot] = id;
  }
  const overrides = {};
  for (const [id, ov] of Object.entries(s.overrides || {})) {
    const it = ITEMS.get(id);
    if (it && !it.fixedColors && ov && ov.colors && typeof ov.colors === 'object') overrides[id] = { colors: ov.colors };
  }
  const out = { body: Object.assign({}, d.body, s.body || {}), equipped, overrides };
  if (s.emblem) out.emblem = normEmblem(s.emblem);
  return out;
}

export { buildRig, linearize, loadImage, loadImageSet, cachedImage, CATALOG, DIM };
