import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ctx = vm.createContext({ console }); ctx.window = ctx;
vm.runInContext(read('scene/vendor/three.min.js'), ctx);
vm.runInContext(read('tools/build_avatar.mjs').match(/const banner = `([\s\S]*?)`;/)[1], ctx);
function load(file, extra = []) {
  const src = read(file), names = [...src.matchAll(/export\s+(?:function|class|const)\s+(\w+)/g)].map(m => m[1]);
  const js = src.replace(/^import .*;\s*$/gm, '').replace(/\bexport\s+(?=(?:function|class|const)\b)/g, '');
  const values = vm.runInContext('(function(){' + js + '\nreturn {' + [...names, ...extra].join(',') + '};})()', ctx, { filename: file });
  Object.assign(ctx, values); return values;
}
load('avatar/src/js/sdf.js');
const R = load('avatar/src/js/rig.js');
const C = load('avatar/src/js/items/clothing.js', ['topGeometry']);
const { THREE } = ctx;
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, skinning: true });
function posed(mesh, i) {
  return mesh.boneTransform(i, new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i));
}
function deform(mesh) {
  const g = mesh.geometry.clone(), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = posed(mesh, i).applyMatrix4(mesh.matrixWorld); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeBoundingSphere(); const m = new THREE.Mesh(g, material); m.updateMatrixWorld(); return m;
}
const poses = [
  ['rest', 0, .09, -.09, 0],
  ['walk-forward', .4, .09, -.09, -.37],
  ['walk-back', -.4, .09, -.09, -.37],
  ['wave', -.15, .09, -2.55, -.35],
  ['stretch', -.15, 2.95, -2.95, -.1],
  ['seated-laptop', -.55, .12, -.12, -.95],
];

test('short and long sleeves cover shoulders/upper arms while walking, waving and seated', t => {
  const rig = R.buildRig({ build: 'vua', height: 1 }), M = rig.model;
  const ray = new THREE.Raycaster(); ray.far = .4;
  let comparisons = 0, exposed = 0, worst = 0;
  for (const sleeve of ['short', 'long']) {
    const options = { sleeve, collar: 'crew' };
    const shirt = new THREE.SkinnedMesh(C.topGeometry(M, options), material); R.attachSkinned(rig, shirt);
    const clothPos = shirt.geometry.attributes.position, hem = [];
    for (let i = 0; i < clothPos.count; i += 3) {
      const x = clothPos.getX(i), y = clothPos.getY(i), z = clothPos.getZ(i), side = x >= 0 ? 'L' : 'R';
      if (y < M.P[1] + .12 && Math.abs(x) < M.shoulderX - .025
          && M.trunk(x, y, z) < M.arm(side, x, y, z, 0, { withHand: false }) - .006) hem.push(i);
    }
    for (const side of ['L', 'R']) { rig.joints['shoulder' + side].rotation.set(0, 0, 0); rig.joints['elbow' + side].rotation.set(0, 0, 0); }
    rig.root.updateMatrixWorld(true); rig.skeleton.update();
    const hemRest = hem.map(i => posed(shirt, i));
    R.setBodyCoverage(rig, null, options);
    const body = rig.bodyMesh, p = body.geometry.attributes.position;
    const samples = [];
    for (let i = 0; i < p.count; i += 3) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), side = x >= 0 ? 'L' : 'R', arm = M.arms[side];
      const along = ctx.segT(x, y, z, arm.sh, arm.wr) * .53;
      if (along < .025 || along > (sleeve === 'short' ? .125 : .46)) continue;
      if (M.arm(side, x, y, z) > M.trunk(x, y, z) + .025) continue;
      samples.push({ i, side, along });
    }
    for (const [name, swing, leftZ, rightZ, elbow] of poses) {
      const j = rig.joints;
      j.shoulderL.rotation.set(name.startsWith('walk') ? -swing : swing, 0, leftZ);
      j.shoulderR.rotation.set(swing, 0, rightZ);
      j.elbowL.rotation.set(elbow, 0, 0); j.elbowR.rotation.set(elbow, 0, name === 'wave' ? .4 : 0);
      rig.root.updateMatrixWorld(true); rig.skeleton.update();
      for (let k = 0; k < hem.length; k++) assert.ok(posed(shirt, hem[k]).distanceTo(hemRest[k]) < 1e-6, `${sleeve}/${name}: raising an arm pulled the shirt hem`);
      const skin = deform(body), cloth = deform(shirt);
      const cp = cloth.geometry.attributes.position;
      let longest = 0;
      for (let i = 0; i < cp.count; i += 3) for (let k = 0; k < 3; k++) {
        const a = new THREE.Vector3().fromBufferAttribute(cp, i + k), b = new THREE.Vector3().fromBufferAttribute(cp, i + (k + 1) % 3);
        longest = Math.max(longest, a.distanceTo(b));
      }
      assert.ok(longest < .16, `${sleeve}/${name}: cloth stretched into a ${(longest * 100).toFixed(1)}cm spike`);
      let n = 0, bad = 0;
      for (const { i, side, along } of samples) {
        const arm = M.arms[side], s = along / .53;
        const normal = new THREE.Vector3(p.getX(i) - arm.sh[0] - (arm.wr[0] - arm.sh[0]) * s, 0, p.getZ(i));
        if (normal.lengthSq() < 1e-5) continue;
        normal.normalize();
        // A camera outside the avatar can see the front/back and outer sleeve.
        // An inward ray origin between an arm and the chest can start INSIDE
        // the torso and incorrectly compare exit surfaces with entry surfaces.
        if (normal.x * arm.s < 0 && Math.abs(normal.z) < .75) continue;
        normal.transformDirection(j[(along < .28 ? 'shoulder' : 'elbow') + side].matrixWorld);
        const origin = posed(body, i).applyMatrix4(body.matrixWorld).addScaledVector(normal, .18);
        ray.set(origin, normal.negate());
        const a = ray.intersectObject(skin)[0], b = ray.intersectObject(cloth)[0];
        if (!b) continue;
        // In a raised pose a bare hand/head may correctly occlude the sleeve.
        // Compare only skin faces belonging to the sleeve area in bind pose.
        let sleeveSkin = false;
        if (a) {
          const v = new THREE.Vector3();
          for (const k of ['a', 'b', 'c']) v.add(new THREE.Vector3().fromBufferAttribute(p, a.face[k]));
          v.multiplyScalar(1 / 3);
          const hitSide = v.x >= 0 ? 'L' : 'R', A = M.arms[hitSide];
          const hitAlong = ctx.segT(v.x, v.y, v.z, A.sh, A.wr) * .53;
          sleeveSkin = hitAlong >= .025 && hitAlong <= (sleeve === 'short' ? .125 : .46)
            && M.arm(hitSide, v.x, v.y, v.z) < M.trunk(v.x, v.y, v.z) + .025;
        }
        n++; if (sleeveSkin && a.distance + .003 < b.distance) { bad++; worst = Math.max(worst, b.distance - a.distance); }
      }
      t.diagnostic(`${sleeve}/${name}: ${n} rays, ${bad} exposed`);
      comparisons += n; exposed += bad;
      skin.geometry.dispose(); cloth.geometry.dispose();
    }
    shirt.parent.remove(shirt); shirt.geometry.dispose();
  }
  t.diagnostic(`${comparisons} sleeve rays; worst skin protrusion ${(worst * 1000).toFixed(1)} mm`);
  assert.ok(comparisons > 100);
  assert.equal(exposed, 0, 'skin protrudes through swinging sleeves');
});

test('changing sleeves restores exposed arms and preserves hands, neck and trouser coverage', () => {
  for (const build of ['thon', 'vua', 'dam']) {
    const rig = R.buildRig({ build, height: 1 }), M = rig.model, source = rig.bodyMesh.geometry;
    const count = source.index.count, p = source.attributes.position, ids = source.attributes.skinIndex, originalSeen = new Set(source.index.array);
    R.setBodyCoverage(rig, {}, { sleeve: 'long' });
    const long = rig.bodyMesh.geometry;
    const longSeen = new Set(long.index.array);
    for (let i = 0; i < p.count; i++) {
      if (!originalSeen.has(i)) continue;
      const side = p.getX(i) >= 0 ? 'L' : 'R', A = M.arms[side], dominant = ids.getX(i);
      const along = ctx.segT(p.getX(i), p.getY(i), p.getZ(i), A.sh, A.wr) * .53;
      if (p.getY(i) > M.P[1] + .49 || (dominant >= 2 && dominant <= 7 && along > .52)) {
        assert.ok(longSeen.has(i), `${build}: long sleeve removed hands/head/neck`);
      }
    }
    R.setBodyCoverage(rig, {}, { sleeve: 'short' });
    const short = rig.bodyMesh.geometry;
    assert.ok(short.index.count > long.index.count, `${build}: short sleeves restore forearms`);
    assert.equal(source.index.count, count); assert.equal(source.userData.keep, true);
    assert.notEqual(short.userData, source.userData);
    const seen = new Set(short.index.array);
    for (let i = 0; i < p.count; i++) {
      if (!originalSeen.has(i)) continue;
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), side = x >= 0 ? 'L' : 'R', A = M.arms[side];
      const along = ctx.segT(x, y, z, A.sh, A.wr) * .53;
      const dominant = ids.getX(i);
      if (y > M.P[1] + .49 || (dominant >= 2 && dominant <= 7 && along > .20)) {
        assert.ok(seen.has(i), `${build}: exposed skin outside sleeves was removed`);
      }
    }
    R.setBodyCoverage(rig, {}, null); const trousersOnly = rig.bodyMesh.geometry;
    assert.ok(trousersOnly.index.count > short.index.count, 'removing shirt restores upper arms');
    R.setBodyCoverage(rig, {}, { sleeve: 'none' });
    const sleeveless = new Set(rig.bodyMesh.geometry.index.array);
    for (let i = 0; i < p.count; i++) {
      const dominant = ids.getX(i);
      if (originalSeen.has(i) && dominant >= 2 && dominant <= 7 && Math.abs(p.getX(i)) > M.shoulderX + .025) {
        assert.ok(sleeveless.has(i), 'sleeveless shirt must restore bare arms');
      }
    }
    R.setBodyCoverage(rig, null, null); assert.equal(rig.bodyMesh.geometry, source);
    rig.root.traverse(o => { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); });
  }
});

test('open V-neck and untucked/tucked hems restore skin when the cut changes', () => {
  const rig = R.buildRig({ build: 'vua', height: 1 }), P = rig.model.P[1], original = rig.bodyMesh.geometry;
  R.setBodyCoverage(rig, null, { sleeve: 'short', collar: 'crew' });
  const crew = new Set(rig.bodyMesh.geometry.index.array);
  R.setBodyCoverage(rig, null, { sleeve: 'short', vneck: true, tucked: true });
  const open = new Set(rig.bodyMesh.geometry.index.array), p = original.attributes.position;
  let chest = 0, waist = 0;
  for (const i of original.index.array) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (Math.abs(x) < .02 && z > .075 && y > P + .43 && y < P + .47) {
      assert.ok(open.has(i), 'V-neck must expose chest skin'); if (!crew.has(i)) chest++;
    }
    if (Math.abs(x) < .05 && z > .08 && y > P - .06 && y < P + .01) {
      assert.ok(open.has(i), 'tucked hem restores waist when no trousers cover it'); if (!crew.has(i)) waist++;
    }
  }
  assert.ok(chest > 0 && waist > 0);
  R.setBodyCoverage(rig, null, null); assert.equal(rig.bodyMesh.geometry, original);
});
