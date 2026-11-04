import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the actual geometry/rig modules with the shipped Three r128, without WebGL.
const ctx = vm.createContext({ console, window: {} });
ctx.window = ctx;
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
vm.runInContext(read('scene/vendor/three.min.js'), ctx);
// Use the same r128 CapsuleGeometry compatibility code as both shipped bundles.
vm.runInContext(read('tools/build_avatar.mjs').match(/const banner = `([\s\S]*?)`;/)[1], ctx);
function load(file, extra = []) {
  const src = read(file);
  const names = [...src.matchAll(/export\s+(?:function|class|const)\s+(\w+)/g)].map(m => m[1]);
  const js = src.replace(/^import .*;\s*$/gm, '').replace(/\bexport\s+(?=(?:function|class|const)\b)/g, '');
  const exports = vm.runInContext('(function(){' + js + '\nreturn {' + [...names, ...extra].join(',') + '};})()', ctx, { filename: file });
  Object.assign(ctx, exports); return exports;
}
load('avatar/src/js/sdf.js');
const R = load('avatar/src/js/rig.js');
const C = load('avatar/src/js/items/clothing.js', ['bottomGeometry']);
const { THREE } = ctx;
let walkingRig;
const getRig = () => walkingRig || (walkingRig = R.buildRig({ build: 'vua', height: 1 }));

function meshFor(rig, options) {
  const geometry = C.bottomGeometry(rig.model, options);
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial({ skinning: true }));
  R.attachSkinned(rig, mesh); return mesh;
}
function posed(mesh, i) {
  const p = new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i);
  mesh.boneTransform(i, p); return p;
}

test('trouser legs never inherit the opposite leg bones below the crotch', () => {
  for (const build of ['thon', 'vua', 'dam']) {
    const M = R.bodyModel(build);
    for (const options of [{ fit: 'slim' }, { fit: 'regular', cuff: true }, { fit: 'wide' }, { fit: 'regular', track: true }, { fit: 'wide', length: 'shorts' }]) {
      const g = C.bottomGeometry(M, options), { position: p, skinIndex: ids, skinWeight: w } = g.attributes;
      let checked = 0;
      for (let i = 0; i < p.count; i++) {
        if (p.getY(i) >= M.P[1] - 0.25) continue;
        const base = p.getX(i) >= 0 ? 8 : 11;
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          const weight = w.array[i * 4 + k], bone = ids.array[i * 4 + k]; sum += weight;
          if (weight > 1e-7) assert.ok(bone >= base && bone <= base + 2, `${build} ${JSON.stringify(options)}: opposite-chain weight ${weight} on bone ${bone}`);
        }
        assert.ok(Math.abs(sum - 1) < 1e-6); checked++;
      }
      assert.ok(checked > 30, 'test includes real lower-leg triangles');
    }
  }
});

test('moving the right leg cannot tear the left trouser leg, and vice versa', () => {
  const rig = getRig(), pants = meshFor(rig, { fit: 'regular', cuff: true });
  const p = pants.geometry.attributes.position;
  const vertices = [];
  for (let i = 0; i < p.count; i += 7) if (p.getY(i) < 0.70 && p.getY(i) > 0.22) vertices.push(i);
  rig.root.updateMatrixWorld(true); rig.skeleton.update();
  const baseline = vertices.map(i => posed(pants, i));
  for (const side of ['R', 'L']) {
    rig.joints.hipL.rotation.set(0, 0, 0); rig.joints.hipR.rotation.set(0, 0, 0);
    rig.joints.kneeL.rotation.x = rig.joints.kneeR.rotation.x = 0;
    rig.joints['hip' + side].rotation.x = -0.5;
    rig.joints['knee' + side].rotation.x = 0.85;
    rig.root.updateMatrixWorld(true); rig.skeleton.update();
    for (let k = 0; k < vertices.length; k++) {
      const i = vertices[k], onOtherLeg = side === 'R' ? p.getX(i) > 0 : p.getX(i) < 0;
      if (onOtherLeg) assert.ok(posed(pants, i).distanceTo(baseline[k]) < 1e-6, 'opposite motion displaced the stationary trouser leg');
    }
  }
});

test('pants cover the skin through a complete walk cycle and seated knee bend', t => {
  const rig = getRig();
  rig.joints.hipL.rotation.set(0, 0, 0); rig.joints.hipR.rotation.set(0, 0, 0);
  rig.joints.kneeL.rotation.x = rig.joints.kneeR.rotation.x = 0;
  const pants = meshFor(rig, { fit: 'regular', cuff: true });
  R.setBodyCoverage(rig, { fit: 'regular', cuff: true });
  const body = rig.bodyMesh, p = body.geometry.attributes.position;
  const samples = [];
  for (let i = 0; i < p.count; i += 37) if (p.getY(i) > 0.25 && p.getY(i) < 0.70) samples.push(i);
  const rc = new THREE.Raycaster(), material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const deformed = mesh => {
    const geometry = mesh.geometry.clone(), attr = geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) { const v = posed(mesh, i).applyMatrix4(mesh.matrixWorld); attr.setXYZ(i, v.x, v.y, v.z); }
    geometry.computeBoundingSphere(); return new THREE.Mesh(geometry, material);
  };
  let checked = 0, exposed = 0;
  for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, 'sit']) {
    const j = rig.joints;
    j.hipL.rotation.x = phase === 'sit' ? -Math.PI / 2 + 0.06 : -Math.sin(phase) * 0.5;
    j.hipR.rotation.x = phase === 'sit' ? -Math.PI / 2 + 0.06 : Math.sin(phase) * 0.5;
    j.kneeL.rotation.x = phase === 'sit' ? Math.PI / 2 - 0.08 : 0.1 + 0.75 * Math.max(0, Math.cos(phase));
    j.kneeR.rotation.x = phase === 'sit' ? Math.PI / 2 - 0.08 : 0.1 + 0.75 * Math.max(0, -Math.cos(phase));
    rig.root.updateMatrixWorld(true); rig.skeleton.update();
    const skinMesh = deformed(body), trouserMesh = deformed(pants);
    skinMesh.updateMatrixWorld(); trouserMesh.updateMatrixWorld();
    for (const i of samples) {
      const side = p.getX(i) >= 0 ? 'L' : 'R', leg = rig.model.legs[side];
      const normal = new THREE.Vector3(p.getX(i) - leg.hp[0], 0, p.getZ(i));
      if (normal.lengthSq() < 1e-5) continue;
      normal.transformDirection(j[(p.getY(i) > leg.kn[1] ? 'hip' : 'knee') + side].matrixWorld);
      const origin = posed(body, i).applyMatrix4(body.matrixWorld).addScaledVector(normal, 0.18);
      rc.set(origin, normal.negate()); rc.far = 0.35;
      const skin = rc.intersectObject(skinMesh)[0], cloth = rc.intersectObject(trouserMesh)[0];
      if (!cloth) continue;
      checked++;
      if (skin && skin.distance + 0.003 < cloth.distance) exposed++;
    }
    skinMesh.geometry.dispose(); trouserMesh.geometry.dispose();
  }
  t.diagnostic(`${checked} posed skin/cloth ray comparisons; ${exposed} exposed beyond 3mm tolerance`);
  assert.ok(checked > 100);
  assert.equal(exposed, 0, 'walking/seated skin protrudes through trouser fabric');
});

test('changing trousers to shorts/skirt restores exposed skin without mutating the cached body', () => {
  const rig = getRig(), source = rig.uncoveredGeometry;
  const count = source.index.count;
  R.setBodyCoverage(rig, {}); const full = rig.bodyMesh.geometry;
  assert.ok(full.index.count < count); assert.equal(source.index.count, count);
  assert.equal(source.userData.keep, true, 'per-avatar mask must not mark cached body geometry for disposal');
  assert.notEqual(full.userData, source.userData);
  R.setBodyCoverage(rig, { length: 'shorts' });
  const shorts = rig.bodyMesh.geometry;
  assert.ok(shorts.index.count > full.index.count, 'shorts restore exposed calves');
  const index = shorts.index, p = shorts.attributes.position, seen = new Set(index.array);
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.6) assert.ok(seen.has(i), 'shorts must not remove lower-leg skin');
  R.setBodyCoverage(rig, { skirt: true }); assert.equal(rig.bodyMesh.geometry, source);
  R.setBodyCoverage(rig, null); assert.equal(rig.bodyMesh.geometry, source);
  const p0 = source.attributes.position, ids = source.attributes.skinIndex;
  R.setBodyCoverage(rig, {}); const remaining = new Set(rig.bodyMesh.geometry.index.array);
  for (let i = 0; i < p0.count; i++) if (ids.getX(i) >= 2 && ids.getX(i) <= 7) assert.ok(remaining.has(i), 'pants must never hide the hands');
});

test('laptop apple mark is on the outer lid and uses shared disposable-safe geometry', () => {
  const { createLaptopLogo } = load('avatar/src/js/items/laptop-logo.js');
  const a = createLaptopLogo(), b = createLaptopLogo();
  assert.equal(a.geometry, b.geometry); assert.equal(a.material, b.material);
  assert.equal(a.geometry.userData.keep, true); assert.equal(a.material.userData.keep, true);
  a.geometry.computeBoundingBox();
  const size = a.geometry.boundingBox.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.y * a.scale.y - 0.046) < 1e-6);
  const src = read('js/avatar2.js'), start = src.indexOf('  const PROP_MAT ='), end = src.indexOf('  const _o =', start);
  ctx.K = { createLaptopLogo };
  const buildProp = vm.runInContext('(function(){' + src.slice(start, end) + '\nreturn buildProp;})()', ctx);
  const prop = buildProp('laptop', 0), mark = prop.getObjectByName('laptop-apple-logo');
  assert.ok(mark); assert.ok(mark.position.z > 0.005, 'logo sits outside the rear face of the lid');
  assert.equal(mark.parent.children.length, 3, 'logo is attached to the hinge along with lid and display');
  const body = prop.children.find(o => o.isMesh); assert.ok(body);
});
