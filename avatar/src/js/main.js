// =============================================================
//  main.js — giao diện tủ đồ (HTML/JS thuần)
// =============================================================
import { AvatarStudio, SLOT_ORDER } from './studio.js';
import { ThumbMaker } from './thumbs.js';
import { drawEmblem } from './textures.js';
import CATALOG from '../data/catalog.js';

const STORE_KEY = 'avatar-studio:v1';
const $ = (s, el = document) => el.querySelector(s);

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (_) { return null; }
}
function save(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (_) {
    // ảnh tải lên quá lớn → lưu bản không kèm ảnh
    try {
      const lite = JSON.parse(JSON.stringify(state));
      for (const ov of Object.values(lite.overrides || {})) if (ov.textures) for (const k in ov.textures) if (String(ov.textures[k]).startsWith('data:')) ov.textures[k] = null;
      if (lite.card) { if (String(lite.card.photo).startsWith('data:')) lite.card.photo = null; if (String(lite.card.template).startsWith('data:')) lite.card.template = null; }
      localStorage.setItem(STORE_KEY, JSON.stringify(lite));
    } catch (__) { /* bỏ qua */ }
  }
}

function readFile(file, maxSide = 1024) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        // thu nhỏ ảnh quá to để nhẹ bộ nhớ
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

const TEX_LABEL = {
  front: 'Hình in mặt trước',
  back: 'Hình in sau lưng',
  pattern: 'Hoa văn vải (lặp lại)',
  upper: 'Ảnh phủ quai / mũ dép',
};
const EMBLEM_POS_LABEL = { 'chest-left': 'ngực trái', 'chest-center': 'giữa ngực', back: 'sau lưng', front: 'phía trước', patch: 'miếng vá', side: 'bên hông', sticker: 'nhãn dán' };
const SHAPES = [['khien', 'Khiên'], ['tron', 'Tròn'], ['luc-giac', 'Lục giác'], ['co-hieu', 'Cờ hiệu']];
const MOTIFS = [['sach', 'Sách mở'], ['sao', 'Ngôi sao'], ['banh-rang', 'Bánh răng'], ['la', 'Chiếc lá'], ['song', 'Sóng'], ['to-ong', 'Tổ ong']];
const BUILDS = [['thon', 'Thon'], ['vua', 'Vừa'], ['dam', 'Đậm']];

// ------------------------------------------------------------ nhúng trong Phòng ôn thi ảo
// Mở bằng phong-thay-do.html?nhung=1 trong khung (iframe): thêm nút "Mặc vào phòng" gửi cấu hình về web chính.
const EMBED = new URLSearchParams(location.search).has('nhung') && window.parent !== window;
/** bỏ ảnh tải lên (dataURL) trước khi gửi qua mạng — ảnh chỉ giữ trên máy */
function liteState(state) {
  const lite = JSON.parse(JSON.stringify(state));
  for (const ov of Object.values(lite.overrides || {})) if (ov.textures) for (const k in ov.textures) if (String(ov.textures[k]).startsWith('data:')) ov.textures[k] = null;
  if (lite.card) { lite.card.photo = null; lite.card.template = null; }
  return lite;
}

// ------------------------------------------------------------ khởi động
const saved = loadSaved();
const stageEl = $('#stage3d');
const studio = new AvatarStudio(stageEl, {
  catalog: CATALOG,
  state: saved || undefined,
  onChange: (s) => { save(s); updateLabel(); },
});
const thumbs = new ThumbMaker(160);

const TABS = [
  { id: 'body', label: 'Cơ thể' },
  ...CATALOG.slots.map((s) => ({ id: s.id, label: s.label, slot: s })),
  { id: 'emblem', label: 'Huy hiệu' },
];
let current = 'top';

function renderTabs() {
  const nav = $('#tabs');
  nav.replaceChildren(...TABS.map((t) => h('button', {
    class: 'tab', role: 'tab', id: 'tab-' + t.id, 'aria-selected': String(t.id === current), 'aria-controls': 'tabpanel',
    onclick: () => { current = t.id; renderTabs(); renderPanel(); if (t.id === 'card') studio.focus('card'); if (t.id === 'footwear') studio.focus('feet'); if (['hair', 'hat', 'eyewear', 'mask', 'audio'].includes(t.id)) studio.focus('head'); },
  }, t.label)));
  const active = $('#tab-' + current);
  active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function thumbCtx() {
  const s = studio.state;
  return { body: s.body, emblemCanvas: studio.emblemCanvas, cardCanvas: studio.cardCanvas, emblem: s.emblem, emblemKey: JSON.stringify(s.emblem) + (s.card?.name || '') };
}

// ------------------------------------------------------------ bảng điều khiển
function renderPanel() {
  const body = $('#tabpanel');
  body.setAttribute('aria-labelledby', 'tab-' + current);
  const tab = TABS.find((t) => t.id === current);
  if (current === 'body') body.replaceChildren(bodyPanel());
  else if (current === 'emblem') body.replaceChildren(emblemPanel());
  else body.replaceChildren(slotPanel(tab.slot));
}

function section(title, ...kids) {
  return h('section', { class: 'sec' }, h('h3', { class: 'sec-title' }, title), ...kids);
}

function swatches(colors, value, onPick, name) {
  const wrap = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': name });
  for (const c of colors) {
    wrap.append(h('button', {
      class: 'sw', style: `--c:${c}`, role: 'radio', 'aria-checked': String(c.toLowerCase() === (value || '').toLowerCase()), 'aria-label': c, title: c,
      onclick: () => onPick(c),
    }));
  }
  const id = 'pick-' + name.replace(/\W+/g, '-');
  const input = h('input', { type: 'color', id, value: value || '#ffffff', 'aria-label': name + ' — chọn màu khác' });
  input.addEventListener('input', () => onPick(input.value));
  wrap.append(h('label', { class: 'sw sw-custom', for: id, title: 'Màu khác' }, input));
  return wrap;
}

function segmented(options, value, onPick, label) {
  return h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label },
    options.map(([v, l]) => h('button', { role: 'radio', 'aria-checked': String(v === value), onclick: () => onPick(v) }, l)));
}

function itemCard(item, equipped, onPick) {
  const img = h('img', { alt: '', width: 80, height: 80, loading: 'lazy' });
  const fig = h('span', { class: 'thumb', style: `--c:${item.colors?.main || '#ccc'}` }, img);
  const resolved = studio.resolveItem(item.id);
  thumbs.make(resolved, thumbCtx()).then((url) => { if (url) { img.src = url; fig.classList.add('ready'); } });
  return h('button', { class: 'item', 'aria-pressed': String(equipped), onclick: onPick },
    fig,
    h('span', { class: 'item-name' }, item.name),
    item.group === 'truong' ? h('span', { class: 'tag' }, 'Data trường') : null,
  );
}

// Hiện "đang may đồ…" trong lúc dựng lưới lần đầu
async function busy(fn) {
  const stage = document.querySelector('.stage');
  const t = setTimeout(() => stage.classList.add('busy'), 120);
  try { return await fn(); } finally { clearTimeout(t); stage.classList.remove('busy'); }
}

function slotPanel(slot) {
  const equippedId = studio.state.equipped[slot.id];
  const items = studio.itemsForSlot(slot.id);
  const grid = h('div', { class: 'grid' });
  if (slot.allowNone) {
    grid.append(h('button', { class: 'item none', 'aria-pressed': String(!equippedId), onclick: async () => { await busy(() => studio.equip(slot.id, null)); renderPanel(); } },
      h('span', { class: 'thumb' }, h('span', { class: 'none-mark', 'aria-hidden': 'true' }, '∅')), h('span', { class: 'item-name' }, 'Không dùng')));
  }
  for (const it of items) {
    grid.append(itemCard(it, it.id === equippedId, async () => { await busy(() => studio.equip(slot.id, it.id)); renderPanel(); }));
  }
  const parts = [section(slot.label, grid)];
  const item = equippedId ? studio.resolveItem(equippedId) : null;
  if (item) parts.push(customizer(item));
  if (slot.id === 'card') parts.push(cardEditor());
  return h('div', { class: 'stack' }, parts);
}

function customizer(item) {
  const rows = [];
  const base = CATALOG.items.find((i) => i.id === item.id);
  rows.push(h('div', { class: 'field' }, h('span', { class: 'label' }, item.colors.accent ? 'Màu chính' : 'Màu'),
    swatches(base.palette || [base.colors.main], item.colors.main, async (c) => { await studio.setItemColor(item.id, 'main', c); refreshThumbs(); }, `Màu ${item.name}`)));
  if (item.colors.accent) {
    const accents = [base.colors.accent, '#ffffff', '#202125', item.colors.main === '#ffffff' ? '#4b2e9a' : '#f0b53a'];
    rows.push(h('div', { class: 'field' }, h('span', { class: 'label' }, 'Màu phối'),
      swatches([...new Set(accents)], item.colors.accent, async (c) => { await studio.setItemColor(item.id, 'accent', c); refreshThumbs(); }, `Màu phối ${item.name}`)));
  }
  if (base.emblem) {
    const id = 'emb-' + item.id;
    const cb = h('input', { type: 'checkbox', id, checked: item.emblem ? true : null });
    cb.addEventListener('change', async () => { await studio.setItemEmblem(item.id, cb.checked ? base.emblem : null); refreshThumbs(); });
    rows.push(h('label', { class: 'check', for: id }, cb, h('span', {}, `In huy hiệu (${EMBLEM_POS_LABEL[base.emblem] || base.emblem})`)));
  }
  for (const key of base.accepts || []) rows.push(uploadRow(item, key));
  if (base.group === 'truong' && (base.accepts || []).length) {
    rows.push(h('p', { class: 'hint' }, 'Ảnh bạn tải lên chỉ nằm trong trình duyệt này. Để cố định cho mọi người, đặt file vào ', h('code', {}, 'assets/textures/'), ' và khai báo trong ', h('code', {}, 'data/catalog.js'), '.'));
  }
  rows.push(h('button', { class: 'btn ghost small', onclick: async () => { await studio.resetItem(item.id); renderPanel(); } }, 'Khôi phục mặc định'));
  return section('Tùy chỉnh · ' + item.name, ...rows);
}

function uploadRow(item, key) {
  const id = `up-${item.id}-${key}`;
  const has = item.textures?.[key];
  const input = h('input', { type: 'file', id, accept: 'image/png,image/jpeg,image/webp', class: 'sr-only' });
  input.addEventListener('change', async () => {
    const f = input.files?.[0]; if (!f) return;
    const url = await readFile(f, key === 'pattern' ? 512 : 1024);
    await studio.setItemTexture(item.id, key, url);
    renderPanel(); refreshThumbs();
  });
  return h('div', { class: 'upload' },
    h('span', { class: 'label' }, TEX_LABEL[key] || key),
    h('div', { class: 'upload-row' },
      has ? h('img', { class: 'up-preview', src: has, alt: '' }) : h('span', { class: 'up-empty' }, 'Chưa có ảnh'),
      h('label', { class: 'btn small', for: id }, has ? 'Đổi ảnh' : 'Tải ảnh lên'), input,
      has ? h('button', { class: 'btn ghost small', onclick: async () => { await studio.setItemTexture(item.id, key, null); renderPanel(); refreshThumbs(); } }, 'Gỡ') : null,
    ));
}

function refreshThumbs() {
  // chỉ vẽ lại lưới đang mở
  if (!['body', 'emblem'].includes(current)) renderPanel();
}

// ------------------------------------------------------------ Cơ thể
function bodyPanel() {
  const b = studio.state.body;
  const hid = 'height-range';
  const range = h('input', { type: 'range', id: hid, min: '0.9', max: '1.04', step: '0.01', value: String(b.height) });
  range.addEventListener('change', () => studio.setBody({ height: +range.value }));
  return h('div', { class: 'stack' },
    section('Màu da', swatches(CATALOG.skinTones, b.skin, async (c) => { await studio.setBody({ skin: c }); renderPanel(); }, 'Màu da')),
    section('Dáng người', segmented(BUILDS, b.build, async (v) => { await busy(() => studio.setBody({ build: v })); renderPanel(); }, 'Dáng người')),
    section('Chiều cao', h('div', { class: 'field' }, h('label', { class: 'label', for: hid }, 'Tỉ lệ so với chuẩn'), range)),
  );
}

// ------------------------------------------------------------ Huy hiệu
function emblemPanel() {
  const e = studio.state.emblem;
  const preview = h('div', { class: 'emblem-preview' });
  const paint = () => { const c = drawEmblem(studio.state.emblem, 320); c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Xem trước huy hiệu'); preview.replaceChildren(c); };
  paint();
  const update = async (patch) => { await studio.setEmblem(patch); paint(); updateLabel(); };
  const text = (id, label, key, attrs = {}) => {
    const input = h('input', { type: 'text', id, value: e[key] || '', ...attrs });
    input.addEventListener('change', () => update({ [key]: input.value }));
    return h('div', { class: 'field' }, h('label', { class: 'label', for: id }, label), input);
  };
  return h('div', { class: 'stack' },
    section('Huy hiệu tự tạo',
      h('div', { class: 'emblem-wrap' }, preview,
        h('div', { class: 'stack tight' },
          text('em-name', 'Tên trường (hư cấu hoặc đã được phép)', 'name'),
          text('em-short', 'Chữ viết tắt trên huy hiệu (tối đa 4)', 'short', { maxlength: '4' }),
          text('em-word', 'Chữ in trên áo và dây đeo', 'wordmark', { maxlength: '14' }),
          text('em-year', 'Năm thành lập', 'year', { inputmode: 'numeric', maxlength: '4' }),
        )),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Hình dạng'), segmented(SHAPES, e.shape, async (v) => { await update({ shape: v }); renderPanel(); }, 'Hình dạng')),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Biểu tượng'), segmented(MOTIFS, e.motif, async (v) => { await update({ motif: v }); renderPanel(); }, 'Biểu tượng')),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Màu nền'), swatches(['#b3141d', '#7a1c26', '#1f2a44', '#1d5c4a', '#4b2e9a', '#20242c'], e.main, async (c) => { await update({ main: c }); renderPanel(); }, 'Màu nền huy hiệu')),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Màu viền'), swatches(['#f6e7c8', '#ffffff', '#f0b53a', '#9fd3ff', '#1f2a44'], e.accent, async (c) => { await update({ accent: c }); renderPanel(); }, 'Màu viền huy hiệu')),
    ),
    section('Vì sao không dùng logo thật',
      h('p', { class: 'note' }, 'Logo chữ, con dấu, tên và mẫu thẻ của trường là tài sản được bảo hộ. Ở đây chỉ giữ những thứ chung ai cũng dùng được — màu đỏ, viền trắng, dáng áo khoác gió, dây đeo thẻ — còn chữ in, huy hiệu và hoa văn dây đeo đều được vẽ mới.'),
      h('p', { class: 'note' }, 'Nếu web của bạn là dự án chính thức của trường, cách chắc chắn nhất là xin phép dùng logo bằng văn bản rồi đặt ảnh logo vào ô "Hình in" của từng món.'),
    ),
  );
}

// ------------------------------------------------------------ Thẻ SV
function cardEditor() {
  const c = studio.state.card;
  const preview = h('div', { class: 'card-preview' });
  const paint = () => { const cnv = studio.cardCanvas; cnv.setAttribute('role', 'img'); cnv.setAttribute('aria-label', 'Xem trước thẻ sinh viên mẫu'); preview.replaceChildren(cnv); };
  paint();
  const update = async (patch) => { await studio.setCard(patch); paint(); updateLabel(); };
  const text = (id, label, key) => {
    const input = h('input', { type: 'text', id, value: c[key] || '' });
    input.addEventListener('change', () => update({ [key]: input.value }));
    return h('div', { class: 'field' }, h('label', { class: 'label', for: id }, label), input);
  };
  const photoIn = h('input', { type: 'file', id: 'card-photo', accept: 'image/*', class: 'sr-only' });
  photoIn.addEventListener('change', async () => { const f = photoIn.files?.[0]; if (f) await update({ photo: await readFile(f, 600) }); });
  const tplIn = h('input', { type: 'file', id: 'card-tpl', accept: 'image/*', class: 'sr-only' });
  tplIn.addEventListener('change', async () => { const f = tplIn.files?.[0]; if (f) await update({ template: await readFile(f, 1024) }); renderPanel(); });

  const headerId = 'card-header';
  const headerCb = h('input', { type: 'checkbox', id: headerId, checked: c.drawHeader !== false ? true : null });
  headerCb.addEventListener('change', () => update({ drawHeader: headerCb.checked }));

  return section('Nội dung thẻ (dữ liệu mẫu)',
    preview,
    h('div', { class: 'two' },
      text('card-name', 'Họ và tên', 'name'), text('card-id', 'MSSV', 'id'),
      text('card-major', 'Ngành', 'major'), text('card-cohort', 'Khóa', 'cohort'),
    ),
    text('card-school', 'Tên trường trên thẻ', 'school'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn small', onclick: () => update({ photo: studio.portrait(300, 400).toDataURL('image/png') }) }, 'Chụp chân dung từ avatar'),
      h('label', { class: 'btn ghost small', for: 'card-photo' }, 'Tải ảnh thẻ'), photoIn,
      c.photo ? h('button', { class: 'btn ghost small', onclick: () => update({ photo: null }) }, 'Gỡ ảnh') : null,
    ),
    h('div', { class: 'upload' },
      h('span', { class: 'label' }, 'Ảnh nền thẻ (1024 × 646)'),
      h('div', { class: 'upload-row' },
        h('label', { class: 'btn small', for: 'card-tpl' }, c.template ? 'Đổi nền' : 'Tải nền thẻ'), tplIn,
        c.template ? h('button', { class: 'btn ghost small', onclick: async () => { await update({ template: null }); renderPanel(); } }, 'Gỡ nền') : null,
      )),
    h('label', { class: 'check', for: headerId }, headerCb, h('span', {}, 'Vẽ dải tên trường + huy hiệu ở đầu thẻ')),
    h('p', { class: 'hint' }, 'Dấu "MẪU" luôn được in lên thẻ để không ai nhầm với thẻ thật. Không dùng MSSV, ảnh hay mã vạch của sinh viên thật.'),
  );
}

// ------------------------------------------------------------ nhãn vở trên sân khấu
function updateLabel() {
  const s = studio.state;
  $('#lbl-name').textContent = s.card?.name || '';
  $('#lbl-class').textContent = s.card?.major || '';
  $('#lbl-school').textContent = s.emblem?.name || '';
}

// ------------------------------------------------------------ thanh công cụ
function randomize() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const st = studio.getState();
  for (const slot of CATALOG.slots) {
    const items = studio.itemsForSlot(slot.id);
    const optional = ['hat', 'eyewear', 'handheld', 'mask', 'audio'].includes(slot.id);
    st.equipped[slot.id] = optional && Math.random() < 0.45 ? null : pick(items).id;
    const it = items.find((i) => i.id === st.equipped[slot.id]);
    if (it?.palette) st.overrides[it.id] = { ...(st.overrides[it.id] || {}), colors: { ...(st.overrides[it.id]?.colors || {}), main: pick(it.palette) } };
  }
  st.body.skin = pick(CATALOG.skinTones);
  busy(() => studio.setState(st)).then(renderPanel);
}

function openModal(title, content) {
  const dlg = $('#modal');
  $('#modal-title').textContent = title;
  $('#modal-body').replaceChildren(content);
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}

function shotDialog() {
  const url = studio.screenshot();
  openModal('Ảnh chụp nhân vật', h('div', { class: 'stack' },
    h('img', { src: url, alt: 'Ảnh chụp nhân vật hiện tại', class: 'shot' }),
    h('p', { class: 'hint' }, 'Nhấn giữ (điện thoại) hoặc chuột phải → Lưu ảnh.')));
}

function exportDialog() {
  const ta = h('textarea', { id: 'json-io', rows: '12', spellcheck: 'false' });
  ta.value = JSON.stringify(studio.getState(), null, 2);
  const status = h('p', { class: 'hint', 'aria-live': 'polite' });
  openModal('Cấu hình nhân vật (JSON)', h('div', { class: 'stack' },
    h('p', { class: 'hint' }, 'Gửi chuỗi này lên server của bạn để lưu tủ đồ cho từng người dùng. Dán chuỗi khác vào rồi bấm Áp dụng để nạp lại.'),
    ta,
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn small', onclick: () => {
        navigator.clipboard?.writeText(ta.value).then(() => { status.textContent = 'Đã sao chép.'; }, () => { ta.select(); status.textContent = 'Hãy nhấn Ctrl+C để sao chép.'; });
      } }, 'Sao chép'),
      h('button', { class: 'btn ghost small', onclick: async () => {
        try { await studio.setState(JSON.parse(ta.value)); renderPanel(); status.textContent = 'Đã áp dụng cấu hình.'; }
        catch (err) { status.textContent = 'JSON không hợp lệ: ' + err.message; }
      } }, 'Áp dụng'),
    ), status));
}

if (EMBED) {
  const acts = $('.actions');
  acts.prepend(h('button', { class: 'btn ghost', type: 'button', onclick: () => window.parent.postMessage({ type: 'pota-avatar-cancel' }, location.origin) }, 'Huỷ'));
  acts.append(h('button', { class: 'btn', type: 'button', id: 'btn-wear', onclick: () => {
    save(studio.getState());
    window.parent.postMessage({ type: 'pota-avatar', state: liteState(studio.getState()) }, location.origin);
  } }, '✓ Mặc vào phòng'));
  $('#btn-export').classList.add('ghost');
}
$('#btn-random').addEventListener('click', randomize);
$('#btn-shot').addEventListener('click', shotDialog);
$('#btn-export').addEventListener('click', exportDialog);
$('#btn-spin').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  studio.setAutoRotate(on);
});
$('#modal-close').addEventListener('click', () => $('#modal').close?.() ?? $('#modal').removeAttribute('open'));
for (const b of document.querySelectorAll('[data-focus]')) b.addEventListener('click', () => studio.focus(b.dataset.focus));

studio.ready.then(() => {
  document.body.classList.add('loaded');
  renderTabs();
  renderPanel();
  updateLabel();
}).catch((err) => {
  console.error(err);
  $('#stage-error').hidden = false;
});

// Cho phép web của bạn điều khiển từ bên ngoài: window.avatarStudio.equip('hat','non-la')
window.avatarStudio = studio;
export { studio, SLOT_ORDER };
