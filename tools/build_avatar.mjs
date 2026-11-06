// Đóng gói "Phòng thay đồ" (ES module, viết cho three bản mới) thành 3 file chạy với three r128 toàn cục:
//   avatar/avatar-kit.js      → window.AvatarKit (dùng trong web chính để dựng nhân vật)
//   avatar/phong-thay-do.js   → giao diện phòng thay đồ (phong-thay-do.html)
//   avatar/avatar-geo-worker.js → luồng nền (Web Worker) tính hình khối áo/quần/tóc cho web chính
// Cách chạy (cần Node 18+):  npm i esbuild@0.21.5  &&  node tools/build_avatar.mjs
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 'three' và các addon trỏ về biến toàn cục THREE (r128 + OrbitControls + RoundedBoxGeometry)
const threeGlobal = {
  name: 'three-global',
  setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, (a) => ({ path: a.path, namespace: 'three-global' }));
    b.onLoad({ filter: /.*/, namespace: 'three-global' }, (a) => {
      if (a.path === 'three') return { contents: 'module.exports = window.THREE;', loader: 'js' };
      if (a.path.includes('OrbitControls')) return { contents: 'module.exports = { OrbitControls: window.THREE.OrbitControls };', loader: 'js' };
      if (a.path.includes('RoundedBoxGeometry')) return { contents: 'module.exports = { RoundedBoxGeometry: window.THREE.RoundedBoxGeometry };', loader: 'js' };
      throw new Error('Chưa có bản r128 cho ' + a.path);
    });
  },
};
// CapsuleGeometry chỉ có từ r139 → bổ sung đúng cách dựng của three
const banner = `/* Tự sinh bởi tools/build_avatar.mjs — đừng sửa tay, sửa trong avatar/src rồi đóng gói lại */
(function(T){ if (T && !T.CapsuleGeometry) { T.CapsuleGeometry = class CapsuleGeometry extends T.LatheGeometry {
  constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
    const p = new T.Path(); p.absarc(0, -length / 2, radius, Math.PI * 1.5, 0); p.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
    super(p.getPoints(capSegments), radialSegments); this.type = 'CapsuleGeometry';
  } }; } })(window.THREE);`;
const common = { bundle: true, format: 'iife', target: 'es2018', plugins: [threeGlobal], banner: { js: banner }, legalComments: 'none', charset: 'utf8' };
await build({ ...common, entryPoints: [path.join(root, 'avatar/src/kit.js')], globalName: 'AvatarKit', outfile: path.join(root, 'avatar/avatar-kit.js') });
await build({ ...common, entryPoints: [path.join(root, 'avatar/src/js/main.js')], outfile: path.join(root, 'avatar/phong-thay-do.js') });
// luồng nền tính hình khối: không có window/document ⇒ trỏ window về self và tự nạp three r128 trước
await build({ ...common, entryPoints: [path.join(root, 'avatar/src/geo-worker.js')], outfile: path.join(root, 'avatar/avatar-geo-worker.js'),
  banner: { js: "self.window = self; importScripts('../scene/vendor/three.min.js');\n" + banner } });
console.log('Đã đóng gói avatar/avatar-kit.js, avatar/phong-thay-do.js và avatar/avatar-geo-worker.js');
