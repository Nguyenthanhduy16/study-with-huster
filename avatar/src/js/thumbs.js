// =============================================================
//  thumbs.js — chụp ảnh nhỏ cho từng món đồ (dùng renderer riêng)
// =============================================================
import * as THREE from 'three';
import { buildRig, linearize } from './rig.js';
import { mountParts } from './studio.js';
import { BUILDERS } from './items/index.js';
import { loadImageSet } from './textures.js';

const VIEW = {
  hair: [0.5, 0.25, 1], top: [0.45, 0.15, 1], bottom: [0.45, 0.1, 1], footwear: [0.9, 0.7, 1],
  hat: [0.6, 0.45, 1], bag: [-0.75, 0.25, -1], card: [0.2, 0.05, 1], eyewear: [0.35, 0.1, 1], handheld: [-1, 0.25, 0.55],
};

export class ThumbMaker {
  constructor(size = 160) {
    this.size = size;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(size, size, false);
    this.renderer.outputEncoding = THREE.sRGBEncoding; // [r128]
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b5a990', 0.75));
    const d = new THREE.DirectionalLight('#ffffff', 0.85);
    d.position.set(2, 3, 3);
    this.scene.add(d);
    const back = new THREE.DirectionalLight('#ffffff', 0.4);
    back.position.set(-2, 2, -3);
    this.scene.add(back);
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.01, 20);
    this.cache = new Map();
    this.queue = Promise.resolve();
  }

  _mannequin(body) {
    if (this.rig) { this.scene.remove(this.rig.root); }
    this.rig = buildRig(body);
    this.rig.root.traverse((o) => { if (o.isMesh) o.visible = false; });
    this.scene.add(this.rig.root);
  }

  /** Trả về dataURL (xếp hàng để không chạy đồng thời) */
  make(item, ctx) {
    const key = item.id + '|' + JSON.stringify([item.colors, item.textures, item.emblem, ctx.emblemKey]);
    if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
    const job = this.queue.then(() => this._make(item, ctx, key)).catch((e) => { console.warn(e); return null; });
    this.queue = job;
    return job;
  }

  async _make(item, ctx, key) {
    await new Promise((r) => setTimeout(r, 16)); // nhường khung hình cho giao diện
    if (!this.rig || this.rig.model.name !== (ctx.body.build || 'vua')) this._mannequin(ctx.body);
    const imgs = await loadImageSet(item.textures);
    const res = BUILDERS[item.slot]({ item, rig: this.rig, imgs, emblemCanvas: ctx.emblemCanvas, cardCanvas: ctx.cardCanvas, emblem: ctx.emblem });
    res.parts = mountParts(this.rig, res.parts);
    for (const p of res.parts) linearize(p.obj);
    for (const p of res.parts) if (p.obj.userData.belt) p.obj.visible = false;
    this.rig.root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const p of res.parts) box.expandByObject(p.obj);
    // giày dép: chỉ khung một chiếc cho to rõ
    if (item.slot === 'footwear') { box.makeEmpty(); box.expandByObject(res.parts[0].obj); }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y, size.z) * 0.5;
    const dir = new THREE.Vector3(...(VIEW[item.slot] || [0.5, 0.3, 1])).normalize();
    const dist = r / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 1.12;
    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.camera.lookAt(center);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    for (const p of res.parts) {
      p.obj.parent.remove(p.obj);
      p.obj.traverse((o) => { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
    }
    this.cache.set(key, url);
    return url;
  }
}
