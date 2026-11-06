// =============================================================
//  geo-worker.js — luồng nền tính hình khối áo/quần/tóc (SDF) cho web chính
//  Đóng gói thành avatar/avatar-geo-worker.js (tools/build_avatar.mjs). Web chính gửi { id, kind, build, args },
//  nhận lại các mảng thuộc tính (chuyển quyền sở hữu, không sao chép) rồi dựng BufferGeometry ở luồng chính.
// =============================================================
import { bodyModel, BODY_GEOMETRY } from './js/rig.js';
import { hairGeometry, topGeometry, bottomGeometry } from './js/items/clothing.js';

function pack(g) {
  const attrs = {}, transfer = [];
  for (const [name, a] of Object.entries(g.attributes)) {
    const array = a.array.slice();            // bản riêng để chuyển quyền sở hữu
    attrs[name] = { array, itemSize: a.itemSize, normalized: !!a.normalized }; transfer.push(array.buffer);
  }
  let index = null;
  if (g.index) { const array = g.index.array.slice(); index = { array }; transfer.push(array.buffer); }
  if (!g.boundingSphere) g.computeBoundingSphere();
  const s = g.boundingSphere, bs = s ? [s.center.x, s.center.y, s.center.z, s.radius] : null;
  return { data: { attrs, index, groups: g.groups.map(x => ({ start: x.start, count: x.count, materialIndex: x.materialIndex })), bs }, transfer };
}

self.onmessage = (e) => {
  const { id, kind, build, args } = e.data || {};
  try {
    const M = bodyModel(build);
    const g = kind === 'body' ? BODY_GEOMETRY(build)
      : kind === 'hair' ? hairGeometry(M, args.style, args.hatOn)
      : kind === 'top' ? topGeometry(M, args.o)
      : kind === 'bottom' ? bottomGeometry(M, args.o) : null;
    if (!g) throw new Error('Không rõ loại hình khối: ' + kind);
    const { data, transfer } = pack(g);
    if (kind !== 'body') g.dispose();   // thân người nằm trong bộ nhớ đệm của luồng nền
    self.postMessage({ id, ok: true, data }, transfer);
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
