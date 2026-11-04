import * as THREE from 'three';

// Small planar bitten-apple mark; geometry is shared by wardrobe and activity props.
let geometry = null;
const materials = new Map();
export function createLaptopLogo({ height = 0.046, color = '#f4f5f7' } = {}) {
  if (!geometry) {
    const fruit = new THREE.Shape();
    fruit.moveTo(0, 0.21);
    fruit.bezierCurveTo(-0.10, 0.29, -0.27, 0.28, -0.33, 0.10);
    fruit.bezierCurveTo(-0.41, -0.10, -0.22, -0.37, -0.11, -0.34);
    fruit.bezierCurveTo(-0.03, -0.30, 0.01, -0.30, 0.10, -0.34);
    fruit.bezierCurveTo(0.20, -0.37, 0.29, -0.21, 0.33, -0.10);
    fruit.bezierCurveTo(0.15, -0.05, 0.14, 0.10, 0.31, 0.17);
    fruit.bezierCurveTo(0.24, 0.29, 0.10, 0.28, 0, 0.21);
    const leaf = new THREE.Shape();
    leaf.moveTo(0.01, 0.28);
    leaf.bezierCurveTo(0.00, 0.39, 0.11, 0.48, 0.21, 0.47);
    leaf.bezierCurveTo(0.21, 0.37, 0.12, 0.28, 0.01, 0.28);
    geometry = new THREE.ShapeGeometry([fruit, leaf], 18);
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, 0); geometry.scale(1 / size.y, 1 / size.y, 1);
    geometry.userData.keep = true;
  }
  if (!materials.has(color)) {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    material.userData.keep = true; materials.set(color, material);
  }
  const mark = new THREE.Mesh(geometry, materials.get(color));
  mark.name = 'laptop-apple-logo'; mark.scale.setScalar(height);
  return mark;
}
