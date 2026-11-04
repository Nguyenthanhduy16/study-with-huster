import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Actual shipped Three r128 + procedural source; no renderer or GPU required.
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ctx = vm.createContext({ console }); ctx.window = ctx;
vm.runInContext(read('scene/vendor/three.min.js'), ctx);
function load(file, extra = []) {
  const src = read(file), names = [...src.matchAll(/export\s+(?:function|class|const)\s+(\w+)/g)].map(m => m[1]);
  const js = src.replace(/^import .*;\s*$/gm, '').replace(/^export default .*;\s*$/gm, '').replace(/\bexport\s+(?=(?:function|class|const)\b)/g, '');
  const values = vm.runInContext('(function(){' + js + '\nreturn {' + [...names, ...extra].join(',') + '};})()', ctx, { filename: file });
  Object.assign(ctx, values); return values;
}
load('avatar/src/js/sdf.js');
const R = load('avatar/src/js/rig.js');
const C = load('avatar/src/js/items/clothing.js', ['hairGeometry']);
const catalog = load('avatar/src/data/catalog.js');
const { THREE } = ctx, M = R.bodyModel('vua');
const item = catalog.ITEMS.find(i => i.id === 'toc-dau-moi');
let hairstyle;
const getHair = () => hairstyle || (hairstyle = C.buildHair({ item, rig: { model: M }, hatOn: false }));
function meshes() { const g = getHair().parts[0].obj; return { top: g.getObjectByName('hair-moi-crop'), back: g.getObjectByName('hair-moi-nape') }; }

test('Đầu moi is a distinct selectable catalog hairstyle with existing colour customisation', () => {
  assert.ok(item); assert.equal(item.name, 'Đầu moi'); assert.equal(item.slot, 'hair'); assert.equal(item.options.style, 'moi');
  assert.ok(item.palette.includes(item.colors.main)); assert.ok(item.palette.length >= 6);
  assert.equal(new Set(catalog.ITEMS.map(i => i.id)).size, catalog.ITEMS.length);
});

test('mullet crop and long nape produce finite bounded geometry rather than the old short bowl', () => {
  const { top, back } = meshes();
  for (const mesh of [top, back]) {
    const g = mesh.geometry, positions = g.attributes.position;
    assert.ok(positions.count > 100); assert.ok(g.index.count > 300);
    for (const v of positions.array) assert.ok(Number.isFinite(v));
    g.computeBoundingBox(); const size = g.boundingBox.getSize(new THREE.Vector3());
    assert.ok(size.x < .35 && size.y < .5 && size.z < .4, 'hair stays in head/neck dimensions');
  }
  const old = C.hairGeometry(M, 'ngan', false); old.computeBoundingBox();
  assert.ok(back.geometry.boundingBox.min.y < old.boundingBox.min.y - .08, 'mullet has a visibly longer nape');
  assert.ok(back.geometry.boundingBox.max.z < -.035, 'long tail stays behind the ears instead of covering the face');
  assert.equal(top.material.roughness, .88, 'textured cut avoids a polished helmet appearance');
});

test('close-cut temples leave the side of the head exposed above the ear', () => {
  const { top, back } = meshes();
  top.material.side = THREE.DoubleSide; back.material.side = THREE.DoubleSide;
  getHair().parts[0].obj.updateMatrixWorld(true);
  const y = M.head.cranium.c[1] - M.head.bone[1] + .018;
  const ray = new THREE.Raycaster(new THREE.Vector3(.25, y, 0), new THREE.Vector3(-1, 0, 0));
  const hits = ray.intersectObjects([top, back]);
  assert.ok(!hits.length || hits[0].point.x < .088, 'thick hair must not blanket the shaved temple at x≈0.10m');
});

test('front fringe contains uneven short locks instead of a single smooth bowl edge', () => {
  const p = meshes().top.geometry.attributes.position, bins = new Map();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    if (Math.abs(x) > .08 || z < .112) continue;
    const bin = Math.floor((x + .08) / .014), y = p.getY(i);
    bins.set(bin, Math.min(bins.get(bin) ?? Infinity, y));
  }
  const edges = [...bins.values()]; assert.ok(edges.length >= 7, 'test samples several real fringe locks');
  assert.ok(Math.max(...edges) - Math.min(...edges) > .008, 'fringe tips have a choppy silhouette');
});

test('caps hide the crown while the nape remains visible and reusable', () => {
  const base = getHair(), { top, back } = meshes();
  assert.equal(base.hideUnderHat.length, 1); assert.equal(base.hideUnderHat[0], top);
  for (const mesh of base.hideUnderHat) mesh.visible = false;
  assert.equal(top.visible, false); assert.equal(back.visible, true);
  const capped = C.buildHair({ item, rig: { model: M }, hatOn: true });
  const again = C.buildHair({ item: { ...item, colors: { main: '#8a5a36' } }, rig: { model: M }, hatOn: false });
  assert.equal(capped.parts[0].joint, 'head');
  assert.equal(capped.parts[0].obj.getObjectByName('hair-moi-nape').geometry, back.geometry);
  assert.equal(again.parts[0].obj.getObjectByName('hair-moi-crop').geometry, top.geometry);
  assert.equal(top.geometry.userData.keep, true); assert.equal(back.geometry.userData.keep, true);
  assert.equal(again.parts[0].obj.getObjectByName('hair-moi-crop').material.color.getHexString(), '8a5a36');
});
