/* =====================================================================
   TIỆN ÍCH CHUNG: DOM, thời gian, lưu trữ, lọc từ cấm, kiểm tra tên
   ===================================================================== */
(function () {
  'use strict';
  const U = {};

  U.$ = (s, r = document) => r.querySelector(s);
  U.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* tạo phần tử: U.h('div.lop#id', {thuộc tính}, con...) */
  U.h = (sel, attrs, ...kids) => {
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
    const e = document.createElement(m[1] || 'div');
    (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? e.classList.add(t.slice(1)) : (e.id = t.slice(1)));
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  U.sleep = ms => new Promise(r => setTimeout(r, ms));
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  }));
  U.isTouch = matchMedia('(pointer: coarse)').matches;
  U.isSmall = () => innerWidth < 720;

  /* ---------- lưu trữ an toàn (có thể bị chặn ở chế độ riêng tư) ---------- */
  U.store = {
    get(k, d) { try { const v = localStorage.getItem('pota:' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem('pota:' + k, JSON.stringify(v)); } catch (_) { } },
    del(k) { try { localStorage.removeItem('pota:' + k); } catch (_) { } }
  };

  /* ---------- thời gian (giờ Hà Nội) ---------- */
  U.serverOffset = 0;                       // ms: giờ máy chủ - giờ máy
  U.now = () => Date.now() + U.serverOffset;
  U.hanoiParts = (t = U.now()) => {
    const d = new Date(t + 7 * 3600e3);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), wd: d.getUTCDay() };
  };
  U.hanoiDay = (t = U.now()) => { const p = U.hanoiParts(t); return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };
  U.fmtDur = (sec, long) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (long) return h ? `${h} giờ ${m} phút` : m ? `${m} phút` : `${s} giây`;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };
  U.fmtHours = sec => { const h = (sec || 0) / 3600; return h >= 10 ? Math.round(h).toLocaleString('vi-VN') : h.toFixed(1).replace('.', ','); };
  U.fmtClock = (t = U.now()) => { const p = U.hanoiParts(t); return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`; };
  U.ago = t => {
    const s = Math.max(0, (U.now() - new Date(t).getTime()) / 1000);
    if (s < 45) return 'vừa xong'; if (s < 3600) return Math.round(s / 60) + ' phút trước';
    if (s < 86400) return Math.round(s / 3600) + ' giờ trước'; return Math.round(s / 86400) + ' ngày trước';
  };
  U.dateVN = (t = U.now()) => {
    const p = U.hanoiParts(t), wd = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][p.wd];
    return `${wd}, ${p.d}/${p.mo}`;
  };

  /* ---------- chuẩn hoá & kiểm tra tên (giống hàm check_identity trên máy chủ) ---------- */
  const VN_LOWER = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
  const NAME_RE = new RegExp('^[A-Za-z' + VN_LOWER + VN_LOWER.toUpperCase() + ' ]+$');
  U.unaccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  U.titleName = s => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
    .split(' ').map(w => w ? w[0].toLocaleUpperCase('vi') + w.slice(1) : w).join(' ');
  U.isVnName = n => {
    const ws = U.unaccent(n.toLowerCase()).trim().split(/\s+/);
    return ws.length >= 2 && ws.length <= 6 &&
      ws.every(w => /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnprstvx])?[aeiouy]{1,3}(ng|nh|ch|[cmnpt])?$/.test(w));
  };
  U.checkName = (name, banned) => {
    const n = (name || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!n) return 'Vui lòng nhập họ và tên.';
    if (!NAME_RE.test(n)) return 'Họ tên chỉ gồm chữ cái và khoảng trắng.';
    if (n.length < 4 || n.length > 40 || n.split(' ').length < 2) return 'Vui lòng nhập đầy đủ họ và tên (2–6 chữ).';
    if (U.badWord(n, 'name', banned)) return 'Tên chứa từ không phù hợp. Vui lòng dùng họ tên thật.';
    return null;
  };
  U.checkMssv = m => /^202[1-6]\d{4,5}$/.test((m || '').trim()) ? null : 'MSSV gồm 8–9 chữ số, bắt đầu từ 2021 đến 2026 (vd 20231234).';
  U.maskMssv = m => (m || '').slice(0, 4) + '*'.repeat(Math.max(0, (m || '').length - 4));

  /* ---------- lọc từ cấm (bản sao phía trình duyệt; máy chủ vẫn kiểm tra lại) ---------- */
  const leet = s => s.replace(/[013457@$]/g, c => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' }[c]));
  const normAcc = s => leet((s || '').normalize('NFC').toLocaleLowerCase('vi')).replace(new RegExp('[^a-z' + VN_LOWER + ' ]', 'g'), ' ').replace(/\s+/g, ' ').trim();
  const normPlain = s => U.unaccent(normAcc(s)).replace(/(.)\1+/g, '$1');
  U.DEFAULT_BANNED = [
    ['lồn', 1, 't'], ['cặc', 1, 't'], ['buồi', 1, 't'], ['địt', 1, 't'], ['đéo', 1, 't'], ['đụ', 1, 't'], ['đĩ', 1, 't'],
    ['chó đẻ', 1, 's'], ['óc chó', 1, 's'], ['mẹ mày', 1, 's'], ['bố mày', 1, 's'],
    ['dit', 0, 't'], ['djt', 0, 't'], ['loz', 0, 't'], ['dcm', 0, 't'], ['dkm', 0, 't'], ['dmm', 0, 't'], ['dm', 0, 't'],
    ['vcl', 0, 't'], ['vkl', 0, 't'], ['vl', 0, 't'], ['clm', 0, 't'], ['cmm', 0, 't'], ['cl', 0, 't'], ['cc', 0, 't'],
    ['dume', 0, 's'], ['duma', 0, 's'], ['fuck', 0, 's'], ['shit', 0, 's'], ['bitch', 0, 's'], ['porn', 0, 's'], ['sex', 0, 't'],
    ['admin', 0, 't', 'name'], ['quan tri', 0, 's', 'name'], ['clb', 0, 't', 'name'], ['hust', 0, 't', 'name'], ['bach khoa', 0, 's', 'name']
  ].map(([w, a, m, s]) => ({ w, a: !!a, m: m === 's' ? 'substr' : 'token', s: s || 'all' }));
  U.badWord = (text, scope, list) => {
    list = list && list.length ? list : U.DEFAULT_BANNED;
    const acc = ' ' + normAcc(text) + ' ', pla = ' ' + normPlain(text) + ' ';
    const accJ = acc.replace(/ /g, ''), plaJ = pla.replace(/ /g, '');
    for (const b of list) {
      if (b.s !== 'all' && b.s !== scope) continue;
      const w = b.a ? normAcc(b.w) : normPlain(b.w), src = b.a ? acc : pla, srcJ = b.a ? accJ : plaJ;
      if (b.m === 'token' ? src.includes(' ' + w + ' ') : (src.includes(w) || srcJ.includes(w.replace(/ /g, '')))) return b.w;
    }
    return null;
  };

  /* ---------- công thức toán (KaTeX nếu tải được) ---------- */
  U.math = (el) => {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }],
          throwOnError: false
        });
      } catch (_) { }
    }
    return el;
  };
  U.richText = (s) => U.esc(s).replace(/\n/g, '<br>');

  /* ---------- sự kiện nhỏ ---------- */
  U.emitter = () => {
    const m = {};
    return {
      on(n, f) { (m[n] = m[n] || []).push(f); return () => { m[n] = m[n].filter(x => x !== f); }; },
      emit(n, ...a) { (m[n] || []).forEach(f => { try { f(...a); } catch (e) { console.error(e); } }); }
    };
  };
  U.throttle = (f, ms) => { let t = 0, timer = null, last; return (...a) => { last = a; const n = Date.now(); if (n - t >= ms) { t = n; f(...a); } else if (!timer) timer = setTimeout(() => { timer = null; t = Date.now(); f(...last); }, ms - (n - t)); }; };

  window.U = U;
})();
