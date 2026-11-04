// =============================================================
//  studio.js — engine 3D: cảnh, camera, mặc đồ, API cho web của bạn
//
//  import { AvatarStudio } from './js/studio.js';
//  const studio = new AvatarStudio(document.querySelector('#stage'), { catalog: CATALOG });
//  await studio.ready;
//  studio.equip('footwear', 'dep-to-ong');
//  const json = studio.getState();   // lưu lên server của bạn
// =============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildRig, attachSkinned, linearize } from './rig.js';
import { BUILDERS } from './items/index.js';
import { loadImage, loadImageSet, drawEmblem, drawStudentCard, blobShadow, makeCanvas } from './textures.js';

export const SLOT_ORDER = ['hair', 'top', 'bottom', 'footwear', 'hat', 'bag', 'card', 'eyewear', 'mask', 'audio', 'handheld'];

const clone = (o) => JSON.parse(JSON.stringify(o));
function merge(base, over) {
  if (!over) return clone(base);
  const out = clone(base);
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...(out[k] || {}), ...v };
    else out[k] = v;
  }
  return out;
}
// Gắn các phần của một món: phần cứng vào khớp, phần mềm (SkinnedMesh) vào bộ xương
export function mountParts(rig, parts) {
  return parts.map((p) => {
    if (p.skinned) { attachSkinned(rig, p.skinned); return { joint: 'root', obj: p.skinned }; }
    rig.joints[p.joint].add(p.obj);
    return p;
  });
}

function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        // không huỷ alphaMap tổ ong vì dùng chung ảnh nguồn
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}

const FOCUS = {
  full: { target: [0, 0.86, 0], dist: 3.9, polar: 1.45 },
  head: { target: [0, 1.52, 0], dist: 1.15, polar: 1.48 },
  card: { target: [0, 1.12, 0], dist: 1.0, polar: 1.5 },
  feet: { target: [0, 0.1, 0.05], dist: 1.05, polar: 1.1 },
};

export class AvatarStudio {
  /**
   * @param {HTMLElement} container nơi chứa canvas 3D
   * @param {{catalog, state?, onChange?, idle?}} opts
   */
  constructor(container, opts = {}) {
    this.container = container;
    this.catalog = opts.catalog;
    this.onChange = opts.onChange || (() => {});
    this.items = new Map(this.catalog.items.map((it) => [it.id, it]));
    this.state = merge(clone(this.catalog.defaults), opts.state || {});
    this.state.equipped = { ...this.catalog.defaults.equipped, ...(opts.state?.equipped || {}) };
    this.state.overrides = opts.state?.overrides || {};
    this.idle = opts.idle ?? !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.slots = {};
    this._tokens = {};
    this._pose = { elbowR: 0 };
    this._initScene();
    this.ready = this._rebuildAll();
  }

  // -------------------------------------------------- Cảnh
  _initScene() {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding; // [r128]
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.display = 'block';
    r.domElement.style.width = '100%';
    r.domElement.style.height = '100%';
    r.domElement.setAttribute('aria-label', 'Nhân vật 3D — kéo để xoay, cuộn để phóng to');
    r.domElement.setAttribute('role', 'img');
    this.container.appendChild(r.domElement);
    this.renderer = r;

    const scene = new THREE.Scene();
    this.scene = scene;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    this.camera = cam;

    scene.add(new THREE.HemisphereLight('#ffffff', '#b5a990', 0.62)); // [r128] cường độ đèn kiểu cũ
    const key = new THREE.DirectionalLight('#fff6ea', 0.95);
    key.position.set(2.2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 2.2, bottom: -0.4, near: 0.5, far: 10 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#c9d6ff', 0.4);
    rim.position.set(-3, 2.5, -2.5);
    scene.add(rim);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.14 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.002;
    scene.add(blob);

    const controls = new OrbitControls(cam, r.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.7;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.autoRotateSpeed = 1.6;
    this.controls = controls;
    this._setFocusImmediate('full');

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.container);
    this._resize();

    this.clock = new THREE.Clock();
    r.setAnimationLoop(() => this._tick());
  }

  _resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // màn hình hẹp: lùi camera để thấy trọn người
    this.camera.updateProjectionMatrix();
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    if (this._anim) {
      const a = this._anim;
      a.t = Math.min(1, a.t + dt / 0.6);
      const k = 1 - Math.pow(1 - a.t, 3);
      this.controls.target.lerpVectors(a.fromT, a.toT, k);
      this.camera.position.lerpVectors(a.fromP, a.toP, k);
      if (a.t >= 1) this._anim = null;
    }
    this.controls.update();
    const j = this.rig?.joints;
    if (j) {
      const s = this.idle ? 1 : 0;
      j.torso.rotation.y = s * Math.sin(t * 0.6) * 0.035;
      j.torso.position.y = 0.965 + s * Math.sin(t * 1.8) * 0.003;
      j.head.rotation.y = s * Math.sin(t * 0.45 + 1) * 0.16;
      j.head.rotation.x = s * Math.sin(t * 0.7) * 0.03;
      j.shoulderL.rotation.z = 0.09 + s * Math.sin(t * 1.2) * 0.018;
      j.shoulderR.rotation.z = -0.09 - s * Math.sin(t * 1.2 + 0.4) * 0.018;
      j.shoulderL.rotation.x = s * Math.sin(t * 0.9) * 0.03;
      j.shoulderR.rotation.x = s * Math.sin(t * 0.9 + 2) * 0.03 + this._pose.elbowR * 0.15;
      j.elbowR.rotation.x += (this._pose.elbowR - j.elbowR.rotation.x) * Math.min(1, dt * 6);
      j.elbowL.rotation.x = -0.06;
    }
    this.renderer.render(this.scene, this.camera);
  }

  // -------------------------------------------------- Camera
  _focusPose(name) {
    const f = FOCUS[name] || FOCUS.full;
    const target = new THREE.Vector3(...f.target);
    let az = 0.35;
    if (this.camera.position.lengthSq() > 0) {
      const d = this.camera.position.clone().sub(this.controls.target);
      az = Math.atan2(d.x, d.z);
    }
    if (name === 'card' || name === 'feet') az = 0.3;
    const narrow = this.camera.aspect < 0.8 && name === 'full' ? 1.25 : 1;
    const dist = f.dist * narrow;
    const pos = new THREE.Vector3(
      target.x + dist * Math.sin(f.polar) * Math.sin(az),
      target.y + dist * Math.cos(f.polar),
      target.z + dist * Math.sin(f.polar) * Math.cos(az),
    );
    return { target, pos };
  }
  _setFocusImmediate(name) {
    const { target, pos } = this._focusPose(name);
    this.controls.target.copy(target);
    this.camera.position.copy(pos);
  }
  focus(name) {
    const { target, pos } = this._focusPose(name);
    if (!this.idle) { this.controls.target.copy(target); this.camera.position.copy(pos); return; }
    this._anim = { t: 0, fromT: this.controls.target.clone(), toT: target, fromP: this.camera.position.clone(), toP: pos };
  }
  setAutoRotate(on) { this.controls.autoRotate = !!on; }

  // -------------------------------------------------- Dữ liệu
  resolveItem(id) {
    const base = this.items.get(id);
    if (!base) return null;
    return merge(base, this.state.overrides[id]);
  }
  itemsForSlot(slot) { return this.catalog.items.filter((i) => i.slot === slot); }

  _emit() {
    clearTimeout(this._emitT);
    this._emitT = setTimeout(() => this.onChange(this.getState()), 60);
  }
  getState() { return clone(this.state); }
  async setState(state) {
    this.state = merge(clone(this.catalog.defaults), state);
    this.state.equipped = { ...this.catalog.defaults.equipped, ...(state.equipped || {}) };
    this.state.overrides = state.overrides || {};
    await this._rebuildAll();
    this._emit();
  }

  // -------------------------------------------------- Huy hiệu & thẻ
  _drawEmblem() { this.emblemCanvas = drawEmblem(this.state.emblem); }
  async _drawCard() {
    const c = this.state.card || {};
    const [photo, template] = await Promise.all([loadImage(c.photo), loadImage(c.template)]);
    this.cardCanvas = drawStudentCard({ ...c, photo, template }, this.emblemCanvas, this.state.emblem);
    return this.cardCanvas;
  }

  // -------------------------------------------------- Mặc đồ
  async _rebuildAll() {
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch (_) { /* bỏ qua */ } }
    this._drawEmblem();
    await this._drawCard();
    if (this.rig) { this.scene.remove(this.rig.root); disposeTree(this.rig.root); }
    for (const s of Object.values(this.slots)) for (const p of s.parts) disposeTree(p.obj);
    this.slots = {};
    const hairItem = this.resolveItem(this.state.equipped.hair);
    this.rig = buildRig({ ...this.state.body, browColor: hairItem?.colors?.main });
    linearize(this.rig.root);
    this.scene.add(this.rig.root);
    await Promise.all(SLOT_ORDER.map((s) => this._buildSlot(s)));
    this._applyRules();
  }

  async _buildSlot(slot) {
    const token = (this._tokens[slot] || 0) + 1;
    this._tokens[slot] = token;
    const id = this.state.equipped[slot];
    const item = id ? this.resolveItem(id) : null;
    const imgs = item ? await loadImageSet(item.textures) : {};
    if (this._tokens[slot] !== token) return; // đã có yêu cầu mới hơn
    const old = this.slots[slot];
    if (old) for (const p of old.parts) { p.obj.parent?.remove(p.obj); disposeTree(p.obj); }
    delete this.slots[slot];
    if (!item) return;
    const builder = BUILDERS[slot];
    if (!builder) { console.warn('[avatar-studio] Chưa có builder cho slot', slot); return; }
    const res = builder({ item, rig: this.rig, imgs, emblemCanvas: this.emblemCanvas, cardCanvas: this.cardCanvas, emblem: this.state.emblem, hatOn: !!this.state.equipped.hat });
    res.parts = mountParts(this.rig, res.parts);
    for (const p of res.parts) linearize(p.obj);
    this.slots[slot] = { id, ...res };
  }

  _applyRules() {
    const hat = this.slots.hat;
    const hair = this.slots.hair;
    if (hair?.hideUnderHat) for (const m of hair.hideUnderHat) m.visible = !(hat && hat.hideHairTop);
    this._pose = { elbowR: 0, ...(this.slots.handheld?.pose || {}) };
    // thắt lưng chỉ lộ ra khi áo sơ vin
    const tucked = !!this.resolveItem(this.state.equipped.top)?.options?.tucked;
    for (const p of this.slots.bottom?.parts || []) if (p.obj.userData.belt) p.obj.visible = tucked;
  }

  async equip(slot, id) {
    this.state.equipped[slot] = id || null;
    if (slot === 'hair') { await this._rebuildAll(); } // màu lông mày theo màu tóc
    else {
      await this._buildSlot(slot);
      if (slot === 'hat') await this._buildSlot('hair'); // tóc gọn lại khi đội mũ
      this._applyRules();
    }
    this._emit();
  }

  _override(id) { return (this.state.overrides[id] ||= {}); }

  async setItemColor(id, key, color) {
    const ov = this._override(id);
    ov.colors = { ...(ov.colors || {}), [key]: color };
    await this._refreshItem(id);
  }
  /** key: 'front' | 'back' | 'pattern' | 'upper'; url có thể là đường dẫn file hoặc dataURL */
  async setItemTexture(id, key, url) {
    const ov = this._override(id);
    ov.textures = { ...(ov.textures || {}), [key]: url || null };
    await this._refreshItem(id);
  }
  async setItemEmblem(id, pos) {
    this._override(id).emblem = pos || null;
    await this._refreshItem(id);
  }
  resetItem(id) { delete this.state.overrides[id]; return this._refreshItem(id); }
  async _refreshItem(id) {
    const slot = this.items.get(id)?.slot;
    if (slot && this.state.equipped[slot] === id) {
      if (slot === 'hair') await this._rebuildAll();
      else { await this._buildSlot(slot); this._applyRules(); }
    }
    this._emit();
  }

  async setBody(patch) {
    this.state.body = { ...this.state.body, ...patch };
    await this._rebuildAll();
    this._emit();
  }
  async setEmblem(patch) {
    this.state.emblem = { ...this.state.emblem, ...patch };
    this._drawEmblem();
    await this._drawCard();
    // huy hiệu + chữ in xuất hiện ở nhiều món → dựng lại tất cả
    await Promise.all(SLOT_ORDER.map((s) => this._buildSlot(s)));
    this._applyRules();
    this._emit();
  }
  async setCard(patch) {
    this.state.card = { ...this.state.card, ...patch };
    await this._drawCard();
    await this._buildSlot('card');
    this._emit();
  }

  // -------------------------------------------------- Ảnh
  /** Chụp ảnh khung hình hiện tại (PNG dataURL) */
  screenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /** Ảnh chân dung chính diện (dùng cho thẻ sinh viên) */
  portrait(w = 300, h = 400) {
    const cam = new THREE.PerspectiveCamera(22, w / h, 0.05, 20);
    const headY = (0.965 + 0.572 + 0.11) * (this.state.body.height || 0.97);
    cam.position.set(0, headY + 0.02, 1.25);
    cam.lookAt(0, headY - 0.03, 0);
    const j = this.rig.joints;
    const saved = [j.head.rotation.y, j.head.rotation.x, j.torso.rotation.y];
    j.head.rotation.set(0, 0, 0); j.torso.rotation.y = 0;
    const size = new THREE.Vector2(); this.renderer.getSize(size);
    const pr = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h, false);
    const out = makeCanvas(w, h);
    const ctx = out.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#dfe8f7'); g.addColorStop(1, '#b9c9e6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    this.renderer.render(this.scene, cam);
    ctx.drawImage(this.renderer.domElement, 0, 0, w, h);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(size.x, size.y, false);
    [j.head.rotation.y, j.head.rotation.x, j.torso.rotation.y] = saved;
    return out;
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this._ro.disconnect();
    this.controls.dispose();
    disposeTree(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
