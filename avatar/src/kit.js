// =============================================================
//  kit.js — bộ dựng nhân vật dùng trong Phòng ôn thi ảo (window.AvatarKit)
//  Đóng gói từ "Phòng thay đồ" (rig, quần áo, phụ kiện, thẻ SV) — xem tools/build_avatar.mjs
// =============================================================
import { buildRig, attachSkinned, linearize, DIM } from './js/rig.js';
import { BUILDERS } from './js/items/index.js';
import { loadImage, loadImageSet, drawEmblem, drawStudentCard } from './js/textures.js';
import CATALOG from './data/catalog.js';

export const SLOT_ORDER = ['hair', 'top', 'bottom', 'footwear', 'hat', 'bag', 'card', 'eyewear', 'mask', 'audio', 'handheld'];
export function mountParts(rig, parts) {
  return parts.map((p) => {
    if (p.skinned) { attachSkinned(rig, p.skinned); return { joint: 'root', obj: p.skinned }; }
    rig.joints[p.joint].add(p.obj);
    return p;
  });
}
export { buildRig, linearize, BUILDERS, loadImage, loadImageSet, drawEmblem, drawStudentCard, CATALOG, DIM };
