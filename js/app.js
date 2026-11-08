/* =====================================================================
   ỨNG DỤNG HỌC ONLINE CÙNG HUSTER — điều phối giao diện
   Mục lục: 1 khởi động · 2 chào mừng & đăng nhập · 3 vào phòng · 4 hiện diện & tên
            5 giờ học & trạng thái · 6 câu hỏi chung · 7 nhắc nghỉ & tập trung
            8 bảng bên (xếp hạng, trò chuyện, hỏi bài, của tôi) · 9 hộp thoại
            10 môi trường (ngày đêm, thời tiết) · 11 thông báo
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, h, esc, store } = U;
  const net = window.createNet();
  const A = {
    settings: DEFAULT_SETTINGS, banned: [], profile: null, zone: null, names: new Map(), presence: [],
    paused: false, focus: null, idleFlag: false, idleAsk: false, lastInput: Date.now(), hiddenAt: 0,
    todayBase: 0, lastHbAt: 0, lastHbState: 'nghi', hbBusy: false, sessionStart: 0,
    round: null, roundBusy: false, quiz: null, rem: { eye: 0, move: 0, water: 0 }, modalLock: false,
    tab: 'rank', lb: { metric: 'seconds', period: 'today' }, tag: null, unread: 0, weather: null, starsShown: 0
  };
  window.__APP = A;
  const S = () => A.settings;
  const T = v => typeof v === 'number' ? v : new Date(v).getTime();
  const COUNTING = ['hoc', 'tap_trung', 'quiz'];

  /* =================================================================
     1. KHỞI ĐỘNG
     ================================================================= */
  async function boot() {
    const msg = $('#po-splash-msg');
    if (PotaStartup.failed) return;
    let init;
    try {
      msg.textContent = net.mode === 'online' ? 'Đang kết nối máy chủ…' : 'Đang chuẩn bị (chế độ ngoại tuyến)…';
      init = await net.init();
    } catch (e) {
      console.error(e);
      msg.innerHTML = 'Không kết nối được máy chủ.<br><small>' + esc(e.message) + '</small>';
      $('.po-bar').hidden = true;
      $('.po-splash-in').append(h('div', { style: { marginTop: '14px' } }, h('button.po-btn', { onclick: () => location.reload() }, 'Thử lại')));
      return;
    }
    A.settings = init.settings || DEFAULT_SETTINGS; A.banned = init.banned || [];
    if (PotaStartup.failed) return;
    msg.textContent = 'Đang dựng khuôn viên trường…';
    await PotaStartup.waitForScene(SceneAPI.ready);
    World.init(SceneAPI); Games.init(SceneAPI);
    bindWorld(); bindNet(); bindHud();
    applyEnv(); fetchWeather(); setInterval(applyEnv, 60e3); setInterval(fetchWeather, 15 * 60e3);
    PotaStartup.complete();
    $('#po-splash').classList.add('out'); setTimeout(() => $('#po-splash').remove(), 700);
    if (!S().room_open) { roomClosed(); return; }
    const prof = await net.myProfile().catch(() => null);
    if (!store.get('welcomed')) welcome(() => login(prof)); else login(prof);
  }

  /* =================================================================
     2. CHÀO MỪNG & ĐĂNG NHẬP
     ================================================================= */
  function welcome(done) {
    const feats = [
      ['🏫', 'Học cùng nhau', 'Thấy ai đang học, ở toà nào, ngồi ghế nào — như đang ở trường.'],
      ['⏱️', 'Ghi nhận giờ học', 'Vào phòng là bắt đầu tính giờ. Có bảng xếp hạng giờ học, sao và chuỗi ngày.'],
      ['📝', 'Câu hỏi chung', `Mỗi ${S().quiz.period_min} phút một câu Giải tích/Đại số cho cả phòng. Đúng được +1 ⭐.`],
      ['💬', 'Trò chuyện & hỏi bài', 'Gửi lời cổ vũ, đặt câu hỏi bài tập và trả lời giúp bạn khác.'],
      ['👀', 'Nhắc nghỉ khoa học', 'Nghỉ mắt 20-20-20, đứng dậy vận động, uống nước đúng lúc.'],
      ['🎧', 'Tập trung & âm thanh', 'Pomodoro 25/5, tiếng mưa, thư viện, piano nhẹ — bật tắt tuỳ ý.']
    ];
    modal(close => h('div.po-dlg',
      null,
      h('h2', null, 'Chào mừng đến Học Online Cùng Huster 👋'),
      h('p.po-muted', { style: { margin: 0, fontSize: '14px', lineHeight: 1.55 } },
        'Một góc ôn thi chung cho sinh viên trong mùa thi: bạn học ở nhà nhưng vẫn thấy rất nhiều bạn đang ôn cùng mình — trong khuôn viên trường và Thư viện Tạ Quang Bửu dựng lại bằng 3D.'),
      h('div.po-feats', null, feats.map(f => h('div.po-feat', null, h('div.i', { text: f[0] }), h('div', null, h('b', { text: f[1] }), h('span', { text: f[2] }))))),
      h('div.po-steps', null,
        h('div.po-step', null, h('i', null, '1'), 'Điền họ tên, MSSV và chọn nhân vật'),
        h('div.po-step', null, h('i', null, '2'), 'Bắt đầu ở sân trước thư viện rồi đi bộ vào học (WASD / bấm chuột)'),
        h('div.po-step', null, h('i', null, '3'), 'Học thôi! Bấm vào bạn khác để xem hồ sơ, gửi lời động viên')),
      h('p.po-note', null, APP.disclaimer),
      h('div.po-dlg-foot', null, h('button.po-btn', { onclick: () => { store.set('welcomed', 1); close(); done(); } }, 'Bắt đầu →'))
    ), { noClose: true });
  }

  /* trình chọn nhân vật (dùng ở đăng nhập & "Của tôi") */
  function avatarEditor(style, onChange) {
    let s = AV.normStyle(style || AV.randomStyle());
    const cv = h('canvas', { width: 300, height: 400, title: 'Kéo để xoay' });
    const opts = h('div.po-opts');
    let pv = null;
    const row = (label, items, key, swatch) => h('div.po-opt-row', null, h('span', { text: label }),
      h('div', null, items.map(it => {
        const b = swatch
          ? h('button.po-sw' + (s[key] === it.id ? '.on' : ''), { type: 'button', title: it.label, style: { background: it.c }, onclick: () => set(key, it.id) })
          : h('button.po-chip' + (s[key] === it.id ? '.on' : ''), { type: 'button', onclick: () => set(key, it.id) }, it.label);
        return b;
      })));
    function render() {
      opts.replaceChildren(
        row('Giới tính', AV.STYLE.gender, 'g'),
        row('Màu da', AV.STYLE.skin, 'skin', true),
        row('Kiểu tóc', AV.STYLE.hair[s.g], 'hair'),
        row('Màu tóc', AV.STYLE.hairColor, 'hc', true),
        row('Áo', AV.STYLE.top, 'top'),
        row('Quần', AV.STYLE.bottom.filter(b => !b.onlyNu || s.g === 'nu'), 'bot'),
        row('Mũ', AV.STYLE.hat, 'hat'),
        h('div', null, h('button.po-btn.line.sm', { type: 'button', onclick: () => { s = AV.randomStyle(); render(); } }, '🎲 Ngẫu nhiên')));
      if (pv) pv.set(s);
      onChange && onChange(s);
    }
    function set(k, v) { s[k] = v; s = AV.normStyle(s); render(); }
    const box = h('div.po-avbox', null, cv, opts);
    requestAnimationFrame(() => { pv = AV.Preview(cv); pv.set(s); });
    render();
    return { el: box, get: () => s, stop: () => pv && pv.stop() };
  }

  /* ---------- nhân vật: Phòng thay đồ (phong-thay-do.html) ---------- */
  /* chỉ giữ phần cần để người khác dựng lại nhân vật — bỏ thẻ SV (có MSSV) và ảnh tự tải lên */
  function cleanStyle(st) {
    if (!st || !st.equipped) return st;
    const o = { body: st.body, equipped: st.equipped, overrides: {} };
    for (const [id, ov] of Object.entries(st.overrides || {})) if (ov && ov.colors) o.overrides[id] = { colors: ov.colors };
    if (st.emblem) o.emblem = st.emblem;
    return o;
  }
  const STUDIO_KEY = 'avatar-studio:v1';
  /* mở phòng thay đồ trong khung; done(state) khi bấm "Mặc vào phòng" */
  function openDressing(state, card, done) {
    try {   // đưa nhân vật hiện tại + tên/MSSV vào phòng thay đồ (giữ ảnh bạn đã tải lên trước đó)
      const old = JSON.parse(localStorage.getItem(STUDIO_KEY) || 'null') || {};
      const nx = Object.assign({}, old);
      if (state && state.equipped) {
        nx.body = state.body; nx.equipped = state.equipped; nx.overrides = nx.overrides || {};
        for (const [id, ov] of Object.entries(state.overrides || {})) nx.overrides[id] = Object.assign({}, nx.overrides[id], { colors: ov.colors });
        if (state.emblem) nx.emblem = state.emblem;
      }
      nx.card = Object.assign({}, old.card, { name: card.name || (old.card || {}).name, id: card.mssv || (old.card || {}).id });
      if (Object.keys(nx).length) localStorage.setItem(STUDIO_KEY, JSON.stringify(nx));
    } catch (_) { }
    const fr = h('iframe.po-dress-fr', { src: 'phong-thay-do.html?nhung=1', title: 'Phòng thay đồ' });
    const close = modal(c => h('div.po-dress', null, fr), { noClose: true, wide: true });
    const onMsg = e => {
      if (e.origin !== location.origin || e.source !== fr.contentWindow || !e.data) return;
      if (e.data.type === 'pota-avatar' && e.data.state) { removeEventListener('message', onMsg); close(); done(cleanStyle(e.data.state)); }
      if (e.data.type === 'pota-avatar-cancel') { removeEventListener('message', onMsg); close(); }
    };
    addEventListener('message', onMsg);
  }
  function avatarPicker(style, card) {
    if (!window.AV2) return avatarEditor(style);
    let s = style && style.equipped ? style : cleanStyle(AV2.randomState());
    const cv = h('canvas', { width: 300, height: 400, title: 'Kéo để xoay' });
    let pv = null;
    const box = h('div.po-avbox', null, cv, h('div.po-av2', null,
      h('p.po-muted.po-small', { style: { margin: 0 } }, 'Chọn dáng người, tóc, quần áo, giày, túi, thẻ sinh viên… trong Phòng thay đồ. Thẻ đeo cổ hiện tên bạn và MSSV dạng 2023****.'),
      h('button.po-btn', { type: 'button', onclick: () => openDressing(s, card(), ns => { s = ns; pv && pv.set(s, card().name, U.maskMssv(card().mssv)); }) }, '👕 Mở phòng thay đồ'),
      h('button.po-btn.line.sm', { type: 'button', onclick: () => { s = cleanStyle(AV2.randomState()); pv && pv.set(s, card().name, U.maskMssv(card().mssv)); } }, '🎲 Ngẫu nhiên')));
    requestAnimationFrame(() => { pv = AV2.Preview(cv); pv.set(s, card().name, U.maskMssv(card().mssv)); });
    return { el: box, get: () => s, stop: () => pv && pv.stop(), refresh: () => pv && pv.set(s, card().name, U.maskMssv(card().mssv)) };
  }

  function login(prof) {
    const root = $('#po-login'); root.hidden = false;
    const saved = store.get('login', {});
    const f = {
      name: h('input.po-in', { id: 'f-name', autocomplete: 'name', placeholder: 'Nguyễn Văn An', maxlength: 40, value: prof ? prof.full_name : (saved.name || '') }),
      mssv: h('input.po-in', { id: 'f-mssv', inputmode: 'numeric', placeholder: '20231234', maxlength: 9, value: prof ? prof.mssv : (saved.mssv || '') }),
      hideRank: h('input', { type: 'checkbox', checked: prof ? prof.hide_rank : false }),
      hideStatus: h('input', { type: 'checkbox', checked: prof ? prof.hide_status : false })
    };
    const eName = h('div.err'), eMssv = h('div.err'), eForm = h('div.err');
    const ed = avatarPicker(prof && prof.style && Object.keys(prof.style).length ? prof.style : saved.style, () => ({ name: U.titleName(f.name.value || ''), mssv: f.mssv.value }));
    const checkN = () => { const e = U.checkName(f.name.value, A.banned); eName.textContent = f.name.value ? (e || '') : ''; f.name.classList.toggle('bad', !!e && !!f.name.value); return !e; };
    const checkM = () => { const e = U.checkMssv(f.mssv.value); eMssv.textContent = f.mssv.value ? (e || '') : ''; f.mssv.classList.toggle('bad', !!e && !!f.mssv.value); return !e; };
    f.name.addEventListener('blur', () => { if (f.name.value.trim()) f.name.value = U.titleName(f.name.value); checkN(); ed.refresh && ed.refresh(); });
    f.mssv.addEventListener('change', () => ed.refresh && ed.refresh());
    f.name.addEventListener('input', () => { if (eName.textContent) checkN(); });
    f.mssv.addEventListener('input', () => { f.mssv.value = f.mssv.value.replace(/\D/g, ''); if (eMssv.textContent || f.mssv.value.length >= 8) checkM(); });

    const go = h('button.po-btn', { type: 'submit', style: { width: '100%', padding: '13px' } }, 'Học ngay');
    const form = h('form.po-card.po-login-card', { onsubmit: submit },
      h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
        h('div.po-logo.sm', { html: $('.po-logo').innerHTML }),
        h('div', null, h('div.po-eyebrow', null, 'Bản demo'), h('h1', null, prof ? 'Chào lại, ' + prof.display_name.split(' ').slice(-1)[0] + '!' : 'Học Online Cùng Huster'))),
      h('p.lead', null, net.mode === 'online'
        ? 'Điền đúng họ tên và MSSV của bạn. Mọi người chỉ thấy MSSV dạng 2023****.'
        : 'Đang chạy CHẾ ĐỘ NGOẠI TUYẾN: chỉ có mình bạn, dữ liệu lưu trên trình duyệt này.'),
      h('div.po-grid2', null,
        h('div.po-field', null, h('label', { for: 'f-name' }, 'Họ và tên'), f.name, eName),
        h('div.po-field', null, h('label', { for: 'f-mssv' }, 'Mã số sinh viên'), f.mssv, eMssv)),
      h('div.po-field', null, h('label', null, 'Nhân vật của bạn'), ed.el),
      h('details.po-more', null, h('summary', null, 'Quyền riêng tư & cách tính giờ'),
        h('div', null,
          h('label.po-check', null, f.hideRank, 'Ẩn tôi khỏi bảng xếp hạng'),
          h('label.po-check', null, f.hideStatus, 'Ẩn trạng thái học của tôi (đang học/nghỉ, đang ở đâu)'),
          h('p.po-note', { style: { margin: 0 } }, 'Thời gian học là "thời gian hệ thống ghi nhận": tính khi bạn ở trong phòng, không bấm Nghỉ, tab không bị ẩn quá 5 phút và vẫn phản hồi câu hỏi "Bạn vẫn đang học chứ?" sau 30 phút không thao tác. Mở nhiều tab không làm tăng giờ.'))),
      eForm, go,
      h('p.po-note', { style: { margin: 0 } }, 'Thông tin (họ tên, MSSV, giờ học, câu trả lời) chỉ dùng cho bản demo ôn thi trong đợt này. ' + APP.disclaimer));
    root.replaceChildren(form);

    async function submit(e) {
      e.preventDefault();
      const okN = checkN(), okM = checkM();
      if (!f.name.value.trim()) { eName.textContent = 'Vui lòng nhập họ và tên.'; }
      if (!f.mssv.value.trim()) { eMssv.textContent = 'Vui lòng nhập MSSV.'; }
      if (!okN || !okM || !f.name.value.trim() || !f.mssv.value.trim()) return;
      go.disabled = true; go.textContent = 'Đang vào…'; eForm.textContent = '';
      const data = { name: U.titleName(f.name.value), mssv: f.mssv.value.trim(), quiz: false, style: ed.get(), hideRank: f.hideRank.checked, hideStatus: f.hideStatus.checked };
      try {
        const r = await net.register(data);
        if (!r || !r.ok) {
          const m = (r && r.error) || 'Không vào được, thử lại nhé.';
          if (r && r.field === 'name') eName.textContent = m; else if (r && r.field === 'mssv') eMssv.textContent = m; else eForm.textContent = m;
          go.disabled = false; go.textContent = 'Học ngay'; return;
        }
        store.set('login', { name: data.name, mssv: data.mssv, quiz: false, style: data.style, start: 'campus' });
        ed.stop(); root.hidden = true; root.replaceChildren();
        A.profile = r.profile;
        enterRoom('campus');
      } catch (err) { eForm.textContent = err.message; go.disabled = false; go.textContent = 'Học ngay'; }
    }
  }

  function roomClosed() {
    modal(() => h('div.po-dlg', null, h('h2', null, 'Học Online Cùng Huster đang tạm đóng'),
      h('p.po-muted', null, 'Ban tổ chức đang tạm đóng phòng. Bạn quay lại sau nhé!'),
      h('div.po-dlg-foot', null, h('button.po-btn', { onclick: () => location.reload() }, 'Tải lại'))), { noClose: true });
  }

  /* =================================================================
     3. VÀO PHÒNG
     ================================================================= */
  async function enterRoom(zone) {
    const p = A.profile;
    World.setMe(net.me.id, p.style, p.display_name, U.maskMssv(p.mssv));
    World.attachMinimap($('#po-mini-cv'));
    if (p.cup && T(p.cup.until) > Date.now()) setTimeout(() => wearCup(p.cup.kind, T(p.cup.until)), 3000);
    A.names.set(net.me.id, { name: p.display_name });
    World.setInfo(net.me.id, { name: p.display_name, stars: p.total ? p.total.stars : 0 });
    $('#po-hud').hidden = false;
    Sound.unlock();
    await World.go(zone, { text: zone === 'campus' ? 'Ra sân thư viện…' : 'Đang vào Thư viện Tạ Quang Bửu…' });
    if (new URLSearchParams(location.search).has('quan-sat')) setTimeout(observeLogin, 800);
    try {
      const r = await net.startSession(zone);
      if (r && r.ok === false) { toast(r.error, 'err'); }
      if (r && r.profile) setProfile(r.profile);
    } catch (e) { toast('Không bắt đầu được phiên học: ' + e.message, 'err'); }
    A.sessionStart = Date.now(); A.lastHbAt = Date.now(); A.lastHbState = 'nghi';
    net.presence.join(presMeta());
    net.joinZone(World.me.zone);
    setTimeout(() => heartbeat(true), 1500);
    setInterval(() => heartbeat(false), APP.heartbeatSec * 1000);
    setInterval(tick, 1000);
    setInterval(refreshStats, 60e3); refreshStats();
    loadNotices(); if (net.mode === 'online') loadDms();
    renderTab(); updateActions(); updateZoneLabel();
    if (U.isSmall()) $('#po-side').classList.add('closed');
    if (!store.get('tip:controls2')) {
      store.set('tip:controls2', 1);
      setTimeout(() => toast(U.isTouch ? '👆 Chạm xuống sàn để tự đi tới · chạm vào ghế để ngồi · kéo cần điều khiển để đi, vuốt để xoay · giữ nút ✋ để vẫy tay, đọc sách, dùng laptop…' : '🖱️ Bấm xuống sàn để tự đi tới · bấm vào ghế để ngồi · W A S D để đi (Shift chạy) · kéo chuột để xoay · giữ Q để mở vòng hành động (vẫy tay, đọc sách, laptop…).', '', 9000), 1200);
    }
  }
  function presMeta() {
    const m = World.me;
    const hide = A.profile && A.profile.hide_status, pr = A.profile || {};
    const cup = pr.cup && T(pr.cup.until) > Date.now() ? { k: pr.cup.kind, u: T(pr.cup.until) } : null;
    return { act: A.act || null, cup, via: store.get('via:day', ''), q: A.queue ? A.queue.ts : null, zone: m.zone, seat: m.seat, sts: m.seatTs, st: hide ? 'hoc' : currentState(), pl: hide ? '' : m.place, sty: m.style, p: [+m.x.toFixed(1), +m.z.toFixed(1), +m.yaw.toFixed(2), +m.y.toFixed(1)], sr: A.profile && A.profile.total ? A.profile.total.stars : 0 };
  }
  function setProfile(p) {
    if (!p) return;
    A.profile = p;
    A.todayBase = p.today ? p.today.seconds : 0;
    $('#po-mystars b').textContent = p.today ? p.today.stars : 0;
    $('#po-mystreak b').textContent = p.streak || 0;
    const tot = p.total ? p.total.stars : 0;
    if (tot !== A.starsShown) { A.starsShown = tot; World.setInfo(net.me.id, { stars: tot, name: p.display_name }); net.presence.update({ sr: tot }); }
    if (A.tab === 'me') renderTab();
  }

  function bindWorld() {
    const E = World.ev;
    E.on('zone-changed', z => {
      A.zone = z; Sound.setPlace(z === 'campus' ? 'outdoor' : z === 'lib_c' ? 'roof' : 'indoor'); updateZoneLabel(); updateActions();
      net.presence.update(presMeta()); net.joinZone(z);
      if (A.tab === 'chat') renderTab(); else loadChatCache(z);
      heartbeat(true);
      updateMini();
    });
    E.on('seat-changed', () => { net.presence.update({ seat: World.me.seat, sts: World.me.seatTs, st: A.profile && A.profile.hide_status ? 'hoc' : currentState() }); updateActions(); });
    E.on('mode-changed', m => { document.body.classList.toggle('po-piano', m === 'piano'); if (m === 'piano') $('#po-side').classList.add('closed'); updateActions(); updateMini(); World.setStatus(currentState()); net.presence.update({ st: A.profile && A.profile.hide_status ? 'hoc' : currentState() }); });
    E.on('place-changed', pl => { $('#po-place').textContent = pl ? '📍 ' + pl : ''; if (!(A.profile && A.profile.hide_status)) net.presence.update({ pl }); });
    E.on('observe', on => { $('#po-observe').hidden = !on; $('#po-actions').hidden = on; });
    E.on('pos', p => net.sendPos(p));
    E.on('rest', p => net.presence.update({ p }));
    E.on('near-building', () => updateActions());
    E.on('near-thing', () => updateActions());
    E.on('npc-click', def => {
      if (A.play && def.id === 'thu-khoa') return viaJoin();
      if (A.play && def.id === 'tho-anh') return takePhoto();
      npcDialog(def);
    });
    E.on('emote', k => net.sendEmote(k));
    /* [act] hoạt động kéo dài của mình (đọc sách / điện thoại / laptop / dừng):
       - phát ngay cho người cùng khu qua kênh cử chỉ: k = 'act:<loại>:<thời điểm>' ('act::<t>' = dừng)
         (máy bản cũ nhận được chỉ bỏ qua vì không phải tên cử chỉ)
       - ghi vào hiện diện { act: { k, t } } để người vào sau / đổi khu cũng thấy */
    E.on('act', a => { A.act = a; net.sendEmote('act:' + (a.k || '') + ':' + a.t); net.presence.update({ act: a }); updateActions(); });
    /* ghế ngay cạnh (world.js phát 'near-seat' với số ghế hoặc null) → lời nhắc "🪑 Ngồi xuống [E]" */
    E.on('near-seat', idx => { const v = idx == null || idx < 0 ? null : idx; if (v !== A.nearSeat) { A.nearSeat = v; updateActions(); } });
    { const wb = $('#po-wheel-btn'); if (wb) Wheel.bindButton(wb); }
    Games.ev.on('trash', async t => {
      const r = await net.pickTrash().catch(e => ({ ok: false, error: e.message }));
      if (r && r.ok) { Games.removeTrash(t); toast(`🌱 +1 Điểm tình nguyện ảo (hôm nay ${r.today}/30). Cảm ơn bạn giữ sân sạch!`, 'gold'); if (A.profile) { A.profile.volunteer = r.total; A.profile.volunteer_today = r.today; } }
      else toast((r && r.error) || 'Chưa nhặt được.', 'err');
    });
    $('#po-observe-x').onclick = () => World.setObserve(false);
    $('#po-mini-x').onclick = () => { World.setOpt({ minimap: false }); updateMini(); };
    $('#po-mini-btn').onclick = () => { World.setOpt({ minimap: true }); updateMini(); };
    // nhãn toà nhà: không dịch chuyển nữa — nhân vật đi bộ tới cửa chính rồi tự bước vào
    E.on('building-click', id => {
      if (World.me.space !== 'campus') return;
      World.gotoBuildingDoor(id);
      if (World.me.mode === 'campus') toast('🚶 Đang đi bộ tới cửa chính ' + ((BUILDING_ROOMS[id] || {}).name || '') + '…', '', 3000);
    });
    E.on('avatar-click', uid => profileDialog(uid));
    E.on('toast', m => toast(m));
  }

  function updateZoneLabel() {
    const z = ZONES[A.zone]; if (!z) return;
    $('#po-zone').textContent = z.name;
    document.title = z.short + ' · Học Online Cùng Huster';
  }

  /* Lời nhắc theo ngữ cảnh (KHÔNG còn nút dịch chuyển): nhân vật tự đi bộ tới mọi nơi —
     cửa chính ⇄ sân, thang máy/cầu thang giữa các tầng. Chỉ hiện nút khi đứng cạnh thứ dùng được. */
  function updateActions() {
    const box = $('#po-actions'), m = World.me;
    const kb = k => U.isTouch ? null : h('kbd', null, k);
    const btn = (label, fn, cls = '', title, key) => h('button.po-btn.po-ctx' + cls, { onclick: fn, title: title || '', 'aria-label': (title || label) }, label, kb(key));
    const items = [];
    if (m.mode === 'seat') {
      items.push(btn('🧍 Đứng dậy', () => World.standUp(), '.ghost', 'Đứng dậy (hoặc bấm W / ↑)', 'W'));
    } else if (m.mode === 'walk' || m.mode === 'campus') {
      if (A.nearSeat != null && A.nearSeat >= 0) items.push(btn('🪑 Ngồi xuống', () => World.goSit(A.nearSeat), '', 'Ngồi vào ghế ngay cạnh (phím E)', 'E'));
    } else if (m.mode === 'piano') {
      items.push(btn(m.special === 'scope' ? '🔭 Rời kính thiên văn' : m.special === 'gaze' ? '🧍 Ngồi dậy' : '🧍 Rời đàn', () => World.standUp(), '', 'Hoặc bấm Esc', 'Esc'));
    }
    if (m.mode === 'walk' && World.nearThing() === 'scope') items.unshift(btn('🔭 Nhìn qua kính thiên văn', () => World.special('scope')));
    if ((m.mode === 'walk' || m.mode === 'seat') && World.nearThing() === 'piano') items.unshift(btn('🎹 Ngồi chơi đàn', () => World.sitPiano(), '', 'Ngồi vào đàn piano (phím E)', 'E'));
    if (m.mode === 'seat' && World.seatKind() === 'lounger') items.unshift(btn('✨ Nằm ngắm sao', () => World.special('gaze')));
    if (A.play && m.space === 'campus' && !Games.busy) {
      const nt = World.nearThing();
      if (nt === 'mango') items.unshift(btn('🥭 Hái xoài', mangoGame));
      if (nt === 'via') items.unshift(btn(A.queue ? '🙏 Đang xếp hàng…' : '🙏 Xin vía chăm chỉ', viaJoin));
      if (nt === 'photo') items.unshift(btn('📸 Chụp ảnh với chữ HUST', takePhoto));
    }
    const act = World.actOf && World.actOf(net.me.id);
    if (act && window.AV2 && AV2.ACTS[act]) items.push(btn('⏹ Dừng ' + AV2.ACTS[act].label.toLowerCase(), () => World.setAct(net.me.id, null), '.line', 'Dừng hoạt động (hoặc bước đi)', '0'));
    if (new URLSearchParams(location.search).has('quan-sat') && m.mode !== 'idle') items.push(btn('👁️ Quan sát', observeLogin, '.line'));
    box.replaceChildren(...items);
    const wb = $('#po-wheel-btn'); if (wb) wb.hidden = !(window.AV2 && (m.mode === 'campus' || m.mode === 'walk' || m.mode === 'seat'));
    if (Wheel.open && !(m.mode === 'campus' || m.mode === 'walk' || m.mode === 'seat')) Wheel.close();
    $('#po-joy').hidden = !(U.isTouch && (m.mode === 'campus' || m.mode === 'walk' || m.mode === 'seat'));
  }
  /* =================================================================
     CHẾ ĐỘ DẠO CHƠI, VÍ SAO & MINI-GAME (đợt 2 phần 4)
     ================================================================= */
  function togglePlay() {
    A.play = !A.play;
    $('#po-play').classList.toggle('on', A.play);
    $('#po-play').querySelector('span').textContent = A.play ? '📚' : '🌳';
    $('#po-play').querySelector('em').textContent = A.play ? 'Ôn thi' : 'Dạo chơi';
    World.setPlay(A.play); Games.setPlay(A.play);
    if (!A.play && A.queue) viaLeave();
    World.setStatus(currentState()); heartbeat(true); net.presence.update(presMeta()); updateActions();
    toast(A.play ? '🌳 Chế độ Dạo chơi: ra sân trước thư viện để hái xoài, xin vía chăm chỉ, chụp ảnh với chữ HUST, nhặt rác. Thời gian này KHÔNG tính giờ học.' : '📚 Quay lại chế độ Ôn thi — bắt đầu tính giờ học.', '', 7000);
  }
  /* đồ uống cầm trên tay (mình + người khác thấy qua presence) */
  let cupTimer = null;
  function wearCup(kind, until) {
    World.setCup(kind); clearTimeout(cupTimer);
    cupTimer = setTimeout(() => { World.setCup(null); if (A.profile) A.profile.cup = null; net.presence.update({ cup: null }); }, Math.max(1000, until - Date.now()));
    net.presence.update({ cup: { k: kind, u: until } });
  }
  async function buy(item) {
    const r = await net.buyItem(item).catch(e => ({ ok: false, error: e.message }));
    if (!r || !r.ok) { toast((r && r.error) || 'Chưa mua được.', 'err'); return; }
    setProfile(r.profile);
    const c = r.profile && r.profile.cup; if (c) wearCup(c.kind, T(c.until));
    if (item === 'water') { A.rem.water = 0; toast('💧 Uống nước rồi! Lời nhắc uống nước tính lại từ đầu.'); }
    else toast('☕ Cà phê nóng đây! Cầm trên tay 30 phút cho tỉnh táo (đồ trang trí, không cộng giờ học).', 'gold');
  }
  function walletSec(p) {
    return h('div.po-sec', null, h('h3', null, '⭐ Ví sao & hoạt động vui'),
      h('div.po-kpis', null,
        h('div.po-kpi', null, h('b', null, (p.wallet != null ? p.wallet : ((p.total || {}).stars || 0)) + ' ⭐'), h('span', null, 'Trong ví')),
        h('div.po-kpi', null, h('b', null, (p.volunteer || 0) + ' 🌱'), h('span', null, 'Điểm tình nguyện ảo')),
        h('div.po-kpi', null, h('b', null, (p.mango_total || 0) + ' 🥭'), h('span', null, 'Giấy hái xoài'))),
      h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        h('button.po-btn.sm', { onclick: () => buy('coffee') }, '☕ Mua cà phê · 2⭐'),
        h('button.po-btn.line.sm', { onclick: () => buy('water') }, '💧 Uống nước · miễn phí'),
        h('button.po-btn.line.sm', { disabled: true, title: 'Sắp có' }, '📚 Sách · sắp có')),
      h('p.po-note', { style: { margin: 0 } }, 'Ví = tổng sao đã kiếm − sao đã tiêu. Tiêu sao không làm giảm thứ hạng (bảng xếp hạng tính sao đã kiếm). "Điểm tình nguyện ảo" chỉ để vui, không phải điểm rèn luyện.'));
  }

  /* ---- 🥭 hái xoài ---- */
  function mangoGame() {
    World.setAct(net.me.id, null);
    if (!Games.mangoStart()) return;
    updateActions();
    let prog = 0, done = false, last = Date.now();
    const bar = h('i'), tip = h('div.po-muted.po-small', null, 'Bấm "Chọc!" liên tục (hoặc phím Space) để gậy chạm cuống quả.');
    const poke = () => { if (done) return; Games.mangoPoke(); prog = Math.min(100, prog + 6 + Math.random() * 10); last = Date.now(); draw(); if (prog >= 100) drop(); };
    const draw = () => { bar.style.width = prog + '%'; };
    const card = h('div.po-game.po-card', null, h('b', null, '🥭 Hái xoài sân thư viện'), tip, h('div.po-bprog', null, bar),
      h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center' } }, h('button.po-btn', { onclick: poke }, '🪵 Chọc!'), h('button.po-btn.line', { onclick: () => end() }, 'Thôi')));
    const key = e => { if (e.code === 'Space' && !done) { e.preventDefault(); poke(); } };
    addEventListener('keydown', key);
    const decay = setInterval(() => { if (!done && Date.now() - last > 1200) { prog = Math.max(0, prog - 2); draw(); } }, 250);
    $('.po-bottom').prepend(card);
    function drop() {
      done = true; tip.textContent = 'Rụng rồi! 🎉';
      Games.mangoDrop(() => {
        card.replaceChildren(h('b', null, 'Bạn hái được quả XOÀI THẦN! 🥭✨'), h('div.po-muted.po-small', null, 'Chấm muối tôm để lấy vía qua môn nào!'),
          h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
            h('button.po-btn', { onclick: eat }, '🌶️ Chấm muối tôm · lấy vía qua môn'), h('button.po-btn.line', { onclick: () => end() }, 'Cất đi')));
      });
    }
    async function eat() {
      Games.mangoEat();
      const r = await net.claimMango().catch(e => ({ ok: false, error: e.message }));
      end();
      if (r && r.ok) { if (A.profile) { A.profile.mango_total = r.total; A.profile.mango_today = true; } certificate(); }
      else if (r && r.already) { toast('Vía qua môn vẫn còn nguyên! Hôm nay bạn đã nhận giấy Xoài thần rồi — mai quay lại hái tiếp nhé 🥭'); afterMango(); }
      else toast((r && r.error) || 'Ngon quá!', 'err');
    }
    function end() { clearInterval(decay); removeEventListener('keydown', key); card.remove(); setTimeout(() => Games.mangoEnd(), done ? 2200 : 0); setTimeout(updateActions, done ? 2300 : 50); }
  }
  function certificate() {
    const name = (A.profile && A.profile.display_name) || 'Bạn học', c = document.createElement('canvas'); c.width = 1200; c.height = 850;
    const g = c.getContext('2d'), F = (w, sz) => `${w} ${sz}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 1200, 850);
    g.strokeStyle = '#c99a2e'; g.lineWidth = 14; g.strokeRect(30, 30, 1140, 790); g.lineWidth = 3; g.strokeRect(54, 54, 1092, 742);
    for (const [x, y] of [[90, 90], [1110, 90], [90, 760], [1110, 760]]) { g.fillStyle = '#f2b23a'; g.beginPath(); g.ellipse(x, y, 20, 26, 0.5, 0, 7); g.fill(); g.fillStyle = '#4f8a2b'; g.beginPath(); g.ellipse(x + 10, y - 26, 6, 14, 0.9, 0, 7); g.fill(); }
    g.textAlign = 'center'; g.fillStyle = '#7a4d0d'; g.font = F(800, 60); g.fillText('GIẤY CHỨNG NHẬN XOÀI THẦN', 600, 180, 1000);
    g.font = F(600, 26); g.fillStyle = '#a0742a'; g.fillText('(mang tính giải trí)', 600, 222);
    g.fillStyle = '#3b2c14'; g.font = F(500, 30); g.fillText('Học Online Cùng Huster trân trọng chứng nhận bạn', 600, 320);
    g.font = F(800, 56); g.fillStyle = '#1f4f2a'; g.fillText(name, 600, 400);
    g.font = F(500, 30); g.fillStyle = '#3b2c14';
    g.fillText('đã hái được quả XOÀI THẦN ở sân Thư viện Tạ Quang Bửu,', 600, 470, 1060);
    g.font = F(700, 32); g.fillStyle = '#9b2c1a'; g.fillText('chấm muối tôm và lấy vía QUA MÔN. Thi đâu trúng đó!', 600, 518, 1060);
    g.font = F(500, 30); g.fillStyle = '#3b2c14';
    const d = U.hanoiParts(); g.font = F(600, 28); g.fillText(`Ngày ${d.d}/${d.mo}/${d.y}`, 600, 600);
    g.font = F(400, 19); g.fillStyle = '#8a7a5c';
    g.fillText(APP.disclaimer, 600, 742, 1060);
    g.fillText('Giấy này chỉ để vui, không có giá trị như giấy tờ chính thức.', 600, 772, 1060);
    showImage('🥭 Giấy chứng nhận Xoài thần', c, 'giay-chung-nhan-xoai-than.png', 'Đã lấy vía qua môn! Mỗi ngày nhận được một giấy.', afterMango);
  }
  function showImage(title, canvas, file, note, onClose) {
    const url = canvas.toDataURL(file.endsWith('.png') ? 'image/png' : 'image/jpeg', 0.92);
    modal(close => h('div.po-dlg', null, h('button.x', { onclick: close }, '✕'), h('h2', null, title),
      h('img', { src: url, alt: title, style: { width: '100%', borderRadius: '10px', display: 'block' } }),
      note ? h('p.po-muted.po-small', null, note) : null,
      h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Đóng'), h('a.po-btn', { href: url, download: file }, '⬇️ Tải về máy'))), { onClose });
  }
  /* lấy vía xong: lên thư viện ôn thi hay dạo tiếp? */
  function afterMango() {
    modal(close => h('div.po-dlg', null, h('h2', null, '🍀 Đã lấy vía qua môn!'),
      h('p.po-muted', null, 'Giờ bạn muốn làm gì tiếp?'),
      h('div.po-dlg-foot', null,
        h('button.po-btn.line', { onclick: close }, '🌳 Đi dạo tiếp'),
        h('button.po-btn', { onclick: () => { close(); if (A.play) togglePlay(); World.gotoBuildingDoor('library'); toast('🚶 Đi bộ tới cửa chính thư viện — bước qua cửa là vào sảnh.', '', 4000); } }, '📚 Lên thư viện ôn thi'))));
  }

  /* ---- 🙏 xin vía chăm chỉ: xếp hàng trước anh thủ khoa ---- */
  function viaQueue() {
    const now = Date.now();
    return A.presence.filter(p => p.uid !== net.me.id && p.zone === 'campus' && p.q && now - p.q < 120e3 && A.queue && p.q < A.queue.ts).length;
  }
  function viaJoin() {
    if (A.queue) return;
    if (store.get('via:day', '') === U.hanoiDay()) { toast('Hôm nay bạn đã có vía chăm chỉ rồi ✨ Mai quay lại nhé!'); World.npcSay(World.npcs().find(n => n.def.id === 'thu-khoa').def, 'Em có vía rồi mà, học thôi! 📚'); return; }
    A.queue = { ts: Date.now(), turnAt: 0 }; net.presence.update({ q: A.queue.ts }); updateActions();
    const step = () => {
      if (!A.queue) return;
      const k = viaQueue(), spot = Games.queueSpot(k), a = Games.npcAt('thu-khoa');
      if (!spot || !a) { viaLeave(); return; }
      if (A.queue.k !== k) { A.queue.k = k; Games.standAt(spot, a.x, a.z); if (k > 0) toast(`🙏 Bạn đang xếp hàng thứ ${k + 1}. Chờ chút nhé…`); }
      if (k === 0) {
        if (!A.queue.turnAt) A.queue.turnAt = Date.now() + 2500;
        else if (Date.now() >= A.queue.turnAt) { give(); return; }
      } else A.queue.turnAt = 0;
      A.queue.t = setTimeout(step, 1000);
    };
    const give = () => {
      const def = World.npcs().find(n => n.def.id === 'thu-khoa').def;
      World.npcEmote('thu-khoa', 'co-vu'); World.npcSay(def, 'Truyền vía chăm chỉ cho em! Học đâu nhớ đó ✨');
      setTimeout(() => World.emote(net.me.id, 'cui-chao'), 900);
      store.set('via:day', U.hanoiDay());
      setTimeout(() => { viaLeave(); toast('✨ Bạn đã nhận "vía chăm chỉ" hôm nay! Tên bạn có thêm ✨ tới hết ngày. Giờ thì về học thôi 📚', 'gold', 7000); World.setInfo(net.me.id, {}); }, 2400);
    };
    step();
  }
  function viaLeave() { if (A.queue) clearTimeout(A.queue.t); A.queue = null; net.presence.update({ q: null, via: store.get('via:day', '') }); updateActions(); }

  /* ---- 📸 chụp ảnh với chữ HUST ---- */
  async function takePhoto() {
    World.setAct(net.me.id, null);
    if (Games.busy) return; Games.busy = true; updateActions();
    $('#po-side').classList.add('closed');
    Games.photoPose([...World.others.values()]);
    const def = (World.npcs().find(n => n.def.id === 'tho-anh') || {}).def;
    const cd = h('div.po-countdown', null, '3'); document.body.append(cd);
    for (const n of ['3', '2', '1']) { cd.textContent = n; if (def) World.npcSay(def, n + '…'); await U.sleep(800); }
    World.emote(net.me.id, ['vay', 'thich', 'co-vu'][Math.floor(Math.random() * 3)]);
    cd.textContent = '📸'; await U.sleep(700);
    const shotCv = await Games.photoCapture(); cd.remove();
    $('#labels').style.visibility = '';
    Games.photoEnd(); Games.busy = false; updateActions();
    // khung ảnh lưu niệm
    const W = 1200, Hc = 900, out = document.createElement('canvas'); out.width = W; out.height = Hc + 130;
    const g = out.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, Hc + 130);
    const sw = shotCv.width, sh = shotCv.height, k = Math.max(W / sw, Hc / sh), dw = sw * k, dh = sh * k;
    g.save(); g.beginPath(); g.rect(24, 24, W - 48, Hc - 24); g.clip(); g.drawImage(shotCv, (W - dw) / 2, (Hc - dh) / 2, dw, dh); g.restore();
    const d = U.hanoiParts(), F = (w, sz) => `${w} ${sz}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.fillStyle = '#1f2a44'; g.font = F(800, 34); g.textAlign = 'left'; g.fillText('Học Online Cùng Huster · Sân Thư viện Tạ Quang Bửu', 32, Hc + 52);
    g.font = F(500, 24); g.fillStyle = '#5b6478'; g.fillText(((A.profile && A.profile.display_name) || '') + ' · ' + `${d.d}/${d.mo}/${d.y} ${String(d.h).padStart(2, '0')}:${String(d.mi).padStart(2, '0')}`, 32, Hc + 92);
    g.textAlign = 'right'; g.font = F(400, 18); g.fillText('Ảnh lưu niệm · bản demo', W - 32, Hc + 92);
    showImage('📸 Ảnh lưu niệm', out, 'anh-luu-niem-thu-vien.jpg', 'Ảnh chụp trong Học Online Cùng Huster. Bạn có thể tải về và chia sẻ.');
  }

  /* =================================================================
     VÒNG HÀNH ĐỘNG NHANH (radial menu) — giữ Q hoặc giữ nút ✋ ở góc phải dưới:
     rê chuột / kéo ngón tay về một ô rồi thả để chọn · bấm nhanh Q / chạm nút: vòng đứng yên, bấm vào ô ·
     phím 1–9 chọn nhanh, 0 dừng hoạt động, Esc đóng.
     ================================================================= */
  const Wheel = (() => {
    const ITEMS = [
      { k: 'vay', type: 'emo' }, { k: 'doc', type: 'act' }, { k: 'dien-thoai', type: 'act' }, { k: 'laptop', type: 'act' },
      { k: 'co-vu', type: 'emo' }, { k: 'thich', type: 'emo' }, { k: 'cui-chao', type: 'emo' }, { k: 'vuon-vai', type: 'emo' },
      { k: 'chup-anh', type: 'act' }
    ];
    const N = ITEMS.length, STEP = Math.PI * 2 / N;
    const W = { open: false };
    let root = null, ring = null, hub = null, hubT = null, hint = null, paths = [], btns = [], st = null, mouse = null, returnFocus = null;
    const info = it => (it.type === 'act' ? AV2.ACTS : AV2.EMOTES)[it.k] || { icon: '?', label: it.k };
    const can = () => { const m = World.me.mode; return window.AV2 && (m === 'campus' || m === 'walk' || m === 'seat'); };
    const busyUi = () => !$('#po-modal').hidden || !$('#po-login').hidden || document.body.classList.contains('po-piano');
    function build() {
      const NS = 'http://www.w3.org/2000/svg';
      root = h('div#po-wheel.po-wheel', { hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Vòng hành động nhanh' });
      ring = h('div.po-wheel-ring', { role: 'group', 'aria-label': 'Chọn hành động' });
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('aria-hidden', 'true');
      const R = 98, r = 38, gap = 0.035;
      ITEMS.forEach((it, i) => {
        const a0 = -Math.PI / 2 + (i - 0.5) * STEP + gap, a1 = -Math.PI / 2 + (i + 0.5) * STEP - gap;
        const P = (rad, a) => `${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`;
        const d = `M ${P(r, a0)} L ${P(R, a0)} A ${R} ${R} 0 0 1 ${P(R, a1)} L ${P(r, a1)} A ${r} ${r} 0 0 0 ${P(r, a0)} Z`;
        const path = document.createElementNS(NS, 'path'); path.setAttribute('d', d); path.setAttribute('class', 'po-wheel-sl'); svg.appendChild(path); paths.push(path);
        const E = info(it), a = -Math.PI / 2 + i * STEP;
        const b = h('button.po-wheel-it' + (it.type === 'act' ? '.act' : ''), {
          type: 'button', 'aria-label': `${i + 1}. ${E.label}${it.type === 'act' ? ' (làm tới khi bạn đi hoặc bấm Dừng)' : ''}`,
          style: { left: (50 + Math.cos(a) * 34) + '%', top: (50 + Math.sin(a) * 34) + '%' },
          onclick: e => { e.stopPropagation(); choose(i); }
        }, h('span.ic', null, E.icon), h('em', null, E.label), h('i', null, String(i + 1)));
        btns.push(b);
      });
      hub = h('button.po-wheel-hub', { type: 'button', onclick: e => { e.stopPropagation(); if (st && st.openedAt != null && e.timeStamp - st.openedAt < 400) return; hubAction(); } }, h('span.ic'), hubT = h('em'));
      ring.append(svg, ...btns, hub);
      hint = h('div#po-wheel-hint.po-wheel-hint', { role: 'status' });
      root.setAttribute('aria-describedby', 'po-wheel-hint');
      root.append(ring, hint);
      root.addEventListener('click', e => {
        if (!st || st.mode !== 'toggle') return;
        // chạm nhanh vào ✋ trên điện thoại: trình duyệt phát thêm một 'click' ở đúng chỗ vừa chạm, rơi vào nền vòng
        // vừa mở ⇒ đừng coi là "bấm ra ngoài" mà đóng ngay
        if (st.openedAt != null && e.timeStamp - st.openedAt < 400) return;
        const dx = e.clientX - st.cx, dy = e.clientY - st.cy, i = sectorAt(dx, dy, true);
        if (i >= 0) choose(i); else if (Math.hypot(dx, dy) < st.R * 0.38) hubAction(); else close();
      });
      root.addEventListener('pointermove', e => { if (st && st.mode === 'toggle') { const i = sectorAt(e.clientX - st.cx, e.clientY - st.cy, true); setSel(i); } });
      document.body.append(root);
    }
    /* góc → ô (0 = trên cùng, theo chiều kim đồng hồ) */
    function sectorAt(dx, dy, ringOnly) {
      const d = Math.hypot(dx, dy);
      if (ringOnly) { if (d < st.R * 0.38 || d > st.R * 1.25) return -1; }
      else if (d < 26) return -1;
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      return ((Math.round(a / STEP) % N) + N) % N;
    }
    function setSel(i) {
      if (!st || st.sel === i) return; st.sel = i;
      paths.forEach((p, k) => p.classList.toggle('on', k === i)); btns.forEach((b, k) => b.classList.toggle('on', k === i));
      drawHub();
    }
    function drawHub() {
      const act = World.actOf(net.me.id);
      const it = st && st.sel >= 0 ? ITEMS[st.sel] : null;
      const E = it ? info(it) : null;
      hub.querySelector('.ic').textContent = E ? E.icon : act ? '⏹' : '✕';
      hubT.textContent = E ? (it.type === 'act' && act === it.k ? 'Dừng ' + E.label.toLowerCase() : E.label) : act ? 'Dừng ' + AV2.ACTS[act].label.toLowerCase() : 'Đóng';
      hub.setAttribute('aria-label', act ? 'Dừng hoạt động đang làm' : 'Đóng vòng hành động');
      hub.classList.toggle('stop', !E && !!act);
      btns.forEach((b, k) => b.classList.toggle('cur', ITEMS[k].type === 'act' && ITEMS[k].k === act));
    }
    function open(mode, src, x, y, pid, ts) {
      if (W.open || !can() || busyUi()) return false;
      if (!root) build();
      const vw = innerWidth, vh = innerHeight, R = Math.max(48, Math.min(165, (vw - 24) / 2, (vh - 64) / 2));
      let cx = vw / 2, cy = vh / 2;
      if (src === 'key' && mouse) { cx = U.clamp(mouse.x, R + 12, vw - R - 12); cy = U.clamp(mouse.y, R + 12, vh - R - 40); }
      else cy = U.clamp(cy, R + 12, vh - R - 40);
      returnFocus = document.activeElement;
      st = { mode, src, pid, sel: -2, t: ts == null ? performance.now() : ts, cx, cy, R, ax: x != null ? x : (mouse ? mouse.x : cx), ay: y != null ? y : (mouse ? mouse.y : cy), moved: false };
      // Pause travel before choosing an activity; closing the wheel never resumes an old route.
      World.freeze(true);
      const toggle = $('#po-wheel-btn'); if (toggle) toggle.setAttribute('aria-expanded', 'true');
      ring.style.width = ring.style.height = (R * 2) + 'px';
      ring.style.left = (cx - R) + 'px'; ring.style.top = (cy - R) + 'px';
      hint.style.top = (cy + R + 10) + 'px'; hint.style.left = (vw / 2) + 'px';
      setSel(-1);
      hintText();
      root.hidden = false; W.open = true; document.body.classList.add('po-wheel-on');
      requestAnimationFrame(() => { if (W.open) root.classList.add('in'); });
      if (mode === 'toggle') hub.focus({ preventScroll: true });
      return true;
    }
    function hintText() {
      hint.textContent = st.mode === 'hold'
        ? (st.src === 'key' ? 'Rê chuột về một ô rồi thả Q · phím 1–9 · Esc để huỷ' : 'Kéo ngón tay về một ô rồi thả')
        : (U.isTouch ? 'Chạm vào một ô để chọn · chạm ra ngoài để đóng' : 'Bấm vào một ô hoặc phím 1–9 · 0 để dừng · Esc hoặc Q để đóng');
    }
    function close() {
      if (!W.open) return;
      W.open = false; st = null; root.classList.remove('in'); root.hidden = true; document.body.classList.remove('po-wheel-on');
      World.freeze(false);
      const toggle = $('#po-wheel-btn'); if (toggle) toggle.setAttribute('aria-expanded', 'false');
      if (root.contains(document.activeElement) && returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }
    function hubAction() { if (World.actOf(net.me.id)) stopAct(); close(); }
    function stopAct() { if (World.actOf(net.me.id)) { World.setAct(net.me.id, null); toast('⏹ Đã dừng.', '', 1800); } }
    function choose(i) {
      const it = ITEMS[i]; close(); if (!it) return;
      const E = info(it);
      if (it.type === 'emo') { if (!World.emote(net.me.id, it.k)) toast(World.me.mode === 'piano' ? 'Rời đàn rồi mới làm cử chỉ được nhé.' : 'Đợi một chút rồi làm cử chỉ tiếp nhé.'); return; }
      if (World.actOf(net.me.id) === it.k) { stopAct(); return; }
      if (World.setAct(net.me.id, it.k)) toast(`${E.icon} ${E.label} — bước đi hoặc chọn "Dừng" để cất đi.`, '', 3500);
      else toast('Lúc này chưa làm được việc đó.');
    }
    /* giữ Q / giữ nút: con trỏ nằm trên vòng → chọn đúng ô dưới con trỏ (tính từ TÂM vòng). Vòng bị đẩy vào trong khi
       chuột/nút ở sát mép màn hình nên tâm vòng có thể lệch khỏi chỗ bắt đầu giữ — tính theo chỗ bắt đầu thì sáng nhầm ô bên cạnh.
       Con trỏ ngoài vòng (vuốt nhanh từ nút ✋) → chọn theo hướng kéo tính từ chỗ bắt đầu giữ. */
    function moveHold(x, y) {
      if (!st || st.mode !== 'hold') return;
      if (Math.hypot(x - st.ax, y - st.ay) > 10) st.moved = true;
      const dc = Math.hypot(x - st.cx, y - st.cy);
      if (dc < st.R * 0.38) { setSel(-1); return; }                        // giữa vòng = không chọn
      const onRing = sectorAt(x - st.cx, y - st.cy, true);
      setSel(onRing >= 0 ? onRing : st.moved ? sectorAt(x - st.ax, y - st.ay, false) : -1);
    }
    /* thả: bấm nhanh không rê (theo thời điểm của sự kiện, không phụ thuộc khung hình chậm) → vòng đứng yên;
       có ô đang sáng → chọn; còn lại → đóng */
    function release(ts) {
      if (!st || st.mode !== 'hold') return;
      const quick = (ts == null ? performance.now() : ts) - st.t < 320 && !st.moved;
      if (quick) { st.mode = 'toggle'; st.openedAt = ts == null ? performance.now() : ts; hintText(); setSel(-1); hub.focus({ preventScroll: true }); }
      else if (st.sel >= 0) choose(st.sel);
      else close();
    }
    /* ---- phím ---- */
    const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
    addEventListener('pointermove', e => { mouse = { x: e.clientX, y: e.clientY }; if (st && st.mode === 'hold' && (st.src === 'key' || e.pointerId === st.pid)) moveHold(e.clientX, e.clientY); }, true);
    addEventListener('keydown', e => {
      if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyQ') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.repeat) return;
        if (W.open && st.mode === 'toggle') { close(); return; }
        if (!W.open && !open('hold', 'key', null, null, null, e.timeStamp) && World.me.mode === 'piano') toast('Rời đàn rồi mới mở vòng hành động được nhé.');
        return;
      }
      if (!W.open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
      const n = /^Digit([0-9])$/.exec(e.code) || /^Numpad([0-9])$/.exec(e.code);
      if (n) { e.preventDefault(); e.stopImmediatePropagation(); const d = +n[1]; if (d === 0) { stopAct(); close(); } else if (d <= N) choose(d - 1); return; }
      if (e.key === 'Tab') {
        e.preventDefault(); e.stopImmediatePropagation();
        const controls = [...btns, hub], at = controls.indexOf(document.activeElement);
        const next = (at + (e.shiftKey ? -1 : 1) + controls.length) % controls.length;
        setSel(next < N ? next : -1); controls[next].focus({ preventScroll: true });
        return;
      }
      if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
        e.preventDefault(); e.stopImmediatePropagation();
        const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        const next = st.sel < 0 ? (step > 0 ? 0 : N - 1) : (st.sel + step + N) % N;
        setSel(next); btns[next].focus({ preventScroll: true }); return;
      }
      if (e.key === 'Enter' && st && st.sel >= 0) { e.preventDefault(); e.stopImmediatePropagation(); choose(st.sel); }
    }, true);
    addEventListener('keyup', e => { if (e.code === 'KeyQ' && W.open && st && st.src === 'key') { e.stopImmediatePropagation(); release(e.timeStamp); } }, true);
    addEventListener('keydown', e => {                       // phím 0 = dừng hoạt động (khi vòng đang đóng)
      if (W.open || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.code === 'Digit0' || e.code === 'Numpad0') && World.actOf && World.actOf(net.me.id) && World.me.mode !== 'piano') { stopAct(); }
    });
    addEventListener('blur', () => close());
    document.addEventListener('visibilitychange', () => { if (document.hidden) close(); });
    addEventListener('resize', () => close());
    /* ---- nút tròn (chuột + chạm) ---- */
    function bindButton(b) {
      b.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        e.preventDefault();
        if (W.open) { close(); return; }
        if (!open('hold', 'pointer', e.clientX, e.clientY, e.pointerId, e.timeStamp)) return;
        try { b.setPointerCapture(e.pointerId); } catch (_) { }
      });
      const up = e => { if (st && st.src === 'pointer' && e.pointerId === st.pid) release(e.timeStamp); };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', e => { if (st && st.src === 'pointer' && e.pointerId === st.pid) close(); });
      b.addEventListener('lostpointercapture', e => { if (st && st.mode === 'hold' && st.src === 'pointer' && e.pointerId === st.pid) close(); });
      b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !W.open) { e.preventDefault(); open('toggle', 'kbd'); setTimeout(() => btns[0] && btns[0].focus(), 0); } });
    }
    W.close = close; W.bindButton = bindButton; W.items = ITEMS;
    return W;
  })();
  function updateMini() {
    const m = World.me, on = m.mode !== 'idle' && m.mode !== 'piano' && m.mode !== 'observe';
    $('#po-mini').hidden = !(on && World.opt.minimap);
    $('#po-mini-btn').hidden = !(on && !World.opt.minimap);
  }
  /* chế độ quan sát: chỉ ban tổ chức (cần mật khẩu quản trị) — mở bằng index.html?quan-sat */
  function observeLogin() {
    const pw = h('input.po-in', { type: 'password', placeholder: 'Mật khẩu quản trị', autocomplete: 'current-password' });
    const err = h('div.err');
    modal(close => h('form.po-dlg', {
      onsubmit: async e => {
        e.preventDefault(); err.textContent = '';
        const r = await net.adminLogin(pw.value).catch(x => ({ ok: false, error: x.message }));
        if (r && r.ok) { close(); World.setObserve(true); toast('Đang ở chế độ quan sát. Nhân vật của bạn vẫn ở chỗ cũ.'); }
        else err.textContent = (r && r.error) || 'Sai mật khẩu.';
      }
    }, h('button.x', { type: 'button', onclick: close }, '✕'), h('h2', null, '👁️ Chế độ quan sát'),
      h('p.po-muted.po-small', null, 'Camera bay tự do để ban tổ chức xem toàn cảnh. Người học bình thường không dùng được chế độ này.'),
      pw, err, h('div.po-dlg-foot', null, h('button.po-btn', { type: 'submit' }, 'Vào chế độ quan sát'))));
    setTimeout(() => pw.focus(), 50);
  }

  /* =================================================================
     4. HIỆN DIỆN & TÊN
     ================================================================= */
  let nameQueue = new Set(), nameTimer = null;
  function wantNames(ids) {
    for (const id of ids) if (!A.names.has(id)) nameQueue.add(id);
    if (nameQueue.size && !nameTimer) nameTimer = setTimeout(async () => {
      const ids2 = [...nameQueue]; nameQueue = new Set(); nameTimer = null;
      try {
        const r = await net.publicProfiles(ids2);
        for (const id of ids2) {
          const p = r[id];
          A.names.set(id, p ? { name: p.display_name, mssv: p.mssv_masked, hidden: p.hidden } : { name: 'Bạn học' });
          World.setInfo(id, { name: p ? p.display_name : 'Bạn học', hidden: p ? p.hidden : false });
        }
      } catch (_) { }
    }, 300);
  }
  const drawPeopleSoon = U.throttle(() => A.tab === 'people' && A.drawPeople && A.drawPeople(), 2500);
  function bindNet() {
    const E = net.ev;
    E.on('presence', list => {
      A.presence = list;
      World.setPresence(list);
      World.pruneActs(list);
      wantNames(list.map(p => p.uid));
      for (const p of list) if (p.sr != null && p.uid !== net.me.id) World.setInfo(p.uid, { stars: p.sr });
      if (World.setAct) for (const p of list) if (p.uid !== net.me.id && p.act && typeof p.act === 'object') World.setAct(p.uid, p.act.k, p.act.t);   // [act]
      const n = list.length;
      $('#po-online b').textContent = n;
      $('#po-online span').textContent = n > 1 ? 'đang học' : 'đang online';
      if (A.tab === 'chat') renderTagBar();
      if (A.tab === 'people' && A.drawPeople && !$('#po-side').classList.contains('closed')) drawPeopleSoon();
    });
    E.on('pos', p => World.onPos(p));
    E.on('emote', p => {
      if (!p || p.u === net.me.id) return;
      const m = typeof p.k === 'string' && /^act:([a-z-]*):(\d+)$/.exec(p.k);   // [act] hoạt động kéo dài của bạn khác
      if (m) World.setAct && World.setAct(p.u, m[1] || null, +m[2]);
      else World.emote(p.u, p.k);
    });
    // [piano-net] tiếng đàn của bạn khác ở tầng 6–7: gom/gửi nốt mình chơi + phát nốt người khác (js/piano-net.js)
    if (window.PianoNet && !A.pianoNet) A.pianoNet = PianoNet.init({ net, World, Sound, getApi: () => SceneAPI.spaces.B.module.api, nameOf: u => (A.names.get(u) || {}).name, toast }) || 1;
    E.on('message', m => onMessage(m));
    E.on('message-hidden', id => {
      $$('.po-msg[data-id]').filter(e => e.dataset.id === String(id)).forEach(e => e.remove());
      A.chatCache = (A.chatCache || []).filter(x => String(x.id) !== String(id));
      World.clearBubbles(id);
    });
    E.on('profile', p => {
      A.names.set(p.id, { name: p.display_name, mssv: p.mssv_masked, hidden: p.hidden });
      World.setInfo(p.id, { name: p.display_name, hidden: p.hidden });
      if (p.id === net.me.id) {
        if (p.kicked_at && T(p.kicked_at) > A.sessionStart - 5000 && A.sessionStart) kicked();
        if (A.profile && A.profile.display_name !== p.display_name) { A.profile.display_name = p.display_name; A.profile.pending_name = p.pending_name; toast('Tên hiển thị của bạn: ' + p.display_name); renderTab(); }
      }
    });
    E.on('notice', n => showNotice(n));
    E.on('event', e => { if (e.uid !== net.me.id) toast(e.text, 'gold', 4500); });
    E.on('cheer', c => {
      if (c.kind === 'dm') { onDm(c); return; }
      if (A.dms) A.dms.push(c);
      const nm = (A.names.get(c.from_uid) || {}).name || 'Một bạn';
      toast('💌 ' + nm + ' gửi bạn: ' + c.text, 'gold', 7000); Sound.chime('cheer');
      if (!A.names.has(c.from_uid)) wantNames([c.from_uid]);
    });
    E.on('settings', s => { A.settings = s; applyEnv(); if (!s.room_open) toast('Ban tổ chức vừa tạm đóng phòng.', 'err'); });
    E.on('status', st => netIndicator(st));
    netIndicator(net.mode === 'online' ? net.status() : 'offline');
  }
  function netIndicator(st) {
    const el = $('#po-net');
    el.className = 'po-net' + (st === 'offline' ? ' off' : st === 'online' ? '' : ' bad');
    el.textContent = st === 'offline' ? '· Ngoại tuyến (chỉ mình bạn)' : st === 'online' ? '' : '· Đang kết nối lại…';
  }
  function kicked() {
    if (A.kicked) return; A.kicked = true;
    net.presence.leave();
    modal(() => h('div.po-dlg', null, h('h2', null, 'Bạn đã được mời ra khỏi phòng'),
      h('p.po-muted', null, 'Ban tổ chức đã mời bạn rời Học Online Cùng Huster. Nếu có nhầm lẫn, hãy liên hệ ban tổ chức.'),
      h('div.po-dlg-foot', null, h('button.po-btn', { onclick: () => location.reload() }, 'Đã hiểu'))), { noClose: true });
  }

  /* =================================================================
     5. GIỜ HỌC & TRẠNG THÁI
     ================================================================= */
  function currentState() {
    if (A.idleFlag) return 'treo';
    if (World.me.mode === 'piano') return World.me.special || 'piano';   // chơi đàn, ngắm sao: không tính giờ học
    if (A.play) return 'choi';                                          // chế độ Dạo chơi: không tính giờ học
    if (document.hidden && A.hiddenAt && Date.now() - A.hiddenAt > APP.hiddenPauseMin * 60e3) return 'treo';
    if (A.paused) return 'nghi';
    if (A.focus && A.focus.phase === 'rest') return 'nghi';
    if (A.quiz && A.quiz.stage !== 'result') return 'quiz';
    if (A.focus) return 'tap_trung';
    return 'hoc';
  }
  let lastHbCall = 0;
  async function heartbeat(force) {
    if (A.hbBusy || A.kicked) return;
    const st = currentState();
    if (!force && Date.now() - lastHbCall < 8000) return;
    A.hbBusy = true; lastHbCall = Date.now();
    try {
      const r = await net.heartbeat(A.zone || 'campus', st);
      A.lastHbAt = Date.now(); A.lastHbState = st;
      if (r && r.profile) setProfile(r.profile);
    } catch (e) { /* mất mạng: thử lại ở nhịp sau */ }
    A.hbBusy = false;
    World.setStatus(st);
    net.presence.update({ st: A.profile && A.profile.hide_status ? 'hoc' : st });
  }
  function displaySeconds() {
    const extra = COUNTING.includes(A.lastHbState) ? Math.min(90, (Date.now() - A.lastHbAt) / 1000) : 0;
    return A.todayBase + extra;
  }
  let prevState = 'hoc';
  function tick() {
    const st = currentState();
    if (st !== prevState) { prevState = st; heartbeat(true); }
    $('#po-clock').textContent = U.fmtClock() + ' · ' + U.dateVN();
    const t = $('#po-mytime');
    t.querySelector('b').textContent = U.fmtDur(displaySeconds());
    t.classList.toggle('counting', COUNTING.includes(st)); t.classList.toggle('paused', !COUNTING.includes(st));
    t.title = COUNTING.includes(st) ? 'Đang tính giờ học hôm nay' : st === 'treo' ? 'Tạm ngừng tính giờ (không thấy hoạt động)' : 'Đang nghỉ — không tính giờ';
    quizTick();
    focusTick();
    reminderTick(st);
    idleTick();
  }
  function bindActivity() {
    const act = () => {
      A.lastInput = Date.now();
      if (A.idleFlag) { A.idleFlag = false; toast('Chào mừng bạn quay lại! Tiếp tục tính giờ học.'); heartbeat(true); }
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, act, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) A.hiddenAt = Date.now();
      else { const away = Date.now() - A.hiddenAt; A.hiddenAt = 0; if (away > APP.hiddenPauseMin * 60e3) toast('Bạn vừa rời tab ' + Math.round(away / 60e3) + ' phút — khoảng đó không được tính giờ.'); heartbeat(true); }
    });
  }
  function idleTick() {
    if (A.idleAsk || A.idleFlag || A.modalLock) return;
    if (Date.now() - A.lastInput < APP.idleCheckMin * 60e3) return;
    if (!COUNTING.includes(currentState())) return;
    A.idleAsk = true; let left = 120;
    let timer = null;
    const cd = h('div.cd', null, '2:00');
    modal(close => {
      timer = setInterval(() => {
        left--; cd.textContent = U.fmtDur(left);
        if (left <= 0) { clearInterval(timer); A.idleFlag = true; A.idleAsk = false; close(); heartbeat(true); toast('Đã tạm ngừng tính giờ. Thao tác bất kỳ để tiếp tục.', '', 8000); }
      }, 1000);
      return h('div.po-dlg.po-break', null, h('div.big', null, '👋'), h('h2', null, 'Bạn vẫn đang học chứ?'),
        h('p.po-muted', null, `Đã ${APP.idleCheckMin} phút không thấy thao tác. Bấm nút dưới đây để tiếp tục tính giờ.`), cd,
        h('div.po-dlg-foot', { style: { justifyContent: 'center' } }, h('button.po-btn', { onclick: () => { clearInterval(timer); A.idleAsk = false; A.lastInput = Date.now(); close(); } }, '✋ Mình vẫn đang học')));
    }, { noClose: true, onClose: () => { clearInterval(timer); A.idleAsk = false; } });
    Sound.chime('remind');
  }

  /* =================================================================
     6. CÂU HỎI CHUNG
     ================================================================= */
  const LETTERS = 'ABCDEFGH';
  async function fetchRound() {
    if (A.roundBusy) return; A.roundBusy = true;
    try { A.round = await net.getRound(); A.roundFetched = U.now(); A.jitter = Math.random() * 2500; }
    catch (_) { A.round = null; A.roundFetched = U.now(); }
    A.roundBusy = false;
  }
  function quizTick() {
    const chip = $('#po-quizchip');
    if (!A.profile || !A.profile.quiz || !S().quiz.enabled) { chip.hidden = true; return; }
    const now = U.now(), r = A.round;
    if (!r) { if (!A.roundFetched || now - A.roundFetched > 15000) fetchRound(); chip.hidden = true; return; }
    if (r.enabled === false || r.empty) { chip.hidden = true; if (now - A.roundFetched > 60000) fetchRound(); return; }
    const opens = T(r.opens_at), closes = T(r.closes_at), next = T(r.next_at);
    if (now >= next + (A.jitter || 0)) { fetchRound(); return; }
    const q = A.quiz && A.quiz.id === r.id ? A.quiz : null;
    if (now >= opens && now < closes) {
      if (r.eligible && r.my_choice == null && !q && !A.focus && !A.play && !A.modalLock) openQuiz(r);
      if (q && q.stage !== 'result') updateQuizTimer(closes - now, r.closes_at);
      if (!r.eligible) { chip.hidden = false; chip.className = 'po-quizchip'; chip.textContent = `📝 Vòng này đã bắt đầu trước khi bạn vào — chờ vòng sau (${U.fmtDur((next - now) / 1000)})`; chip.onclick = null; }
      else if ((A.focus || A.play) && !q) { chip.hidden = false; chip.className = 'po-quizchip hot'; chip.textContent = `📝 Đang có câu hỏi chung (${U.fmtDur((closes - now) / 1000)}) — bạn đang tập trung, bấm để mở`; chip.onclick = () => openQuiz(r); }
      else if (q && q.min) { chip.hidden = false; chip.className = 'po-quizchip hot'; chip.textContent = `📝 Câu hỏi chung · còn ${U.fmtDur((closes - now) / 1000)} — bấm để mở`; chip.onclick = () => { q.min = false; $('#po-quiz').hidden = false; }; }
      else chip.hidden = true;
    } else if (now >= closes) {
      if (q && q.stage !== 'result' && !q.fetchingRes && now >= closes + 800 + (A.jitter || 0) / 2) loadResult(q);
      const cardVisible = !$('#po-quiz').hidden;
      if (q && q.min && q.stage === 'result') { chip.hidden = false; chip.className = 'po-quizchip hot'; chip.textContent = '📊 Xem kết quả câu hỏi chung'; chip.onclick = () => { q.min = false; $('#po-quiz').hidden = false; }; }
      else if (!cardVisible) { chip.hidden = false; chip.className = 'po-quizchip'; chip.textContent = `📝 Câu hỏi chung tiếp theo sau ${U.fmtDur((next - now) / 1000)}`; chip.onclick = null; }
      else chip.hidden = true;
    }
  }
  function openQuiz(r) {
    const qq = r.question, box = $('#po-quiz');
    A.quiz = { id: r.id, r, stage: 'question', choice: r.my_choice, min: false };
    const sub = SUBJECTS[qq.mon] ? SUBJECTS[qq.mon].name : qq.mon;
    const ops = h('div.po-q-ops', null, qq.lua.map((t, i) => h('button.po-q-op', { 'data-i': i, onclick: () => answer(i) },
      h('i.fill', { style: { width: 0 } }), h('span.k', null, LETTERS[i]), h('span.tx', { html: esc(t) }), h('span.pct'))));
    box.replaceChildren(
      h('div.po-quiz-h', null,
        h('div.po-ring', { html: '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="var(--line)" stroke-width="3"/><circle class="arc" cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg><b></b>' }),
        h('div.lbl', null, h('b', null, '📝 Câu hỏi chung · ' + sub), h('span', null, (CHAPTERS[qq.chuong] || qq.chuong) + ' · ' + '★'.repeat(qq.do_kho || 1))),
        h('button.po-btn.ghost.sm', { title: 'Thu nhỏ', onclick: () => { A.quiz.min = true; box.hidden = true; } }, '—')),
      h('div.po-q-de', { html: esc(qq.de) }), ops,
      h('div.po-q-foot', null, h('span.po-muted', { id: 'po-q-status' }, 'Chọn một đáp án trước khi hết giờ. Đúng được +' + S().quiz.stars + ' ⭐'), h('span')));
    U.math(box);
    box.hidden = false;
    Sound.chime('quiz');
    heartbeat(true);
  }
  function updateQuizTimer(ms, closesIso) {
    const box = $('#po-quiz'); if (box.hidden && !(A.quiz && A.quiz.min)) return;
    const total = S().quiz.answer_sec * 1000, left = Math.max(0, ms);
    const arc = box.querySelector('.arc'), b = box.querySelector('.po-ring b');
    if (arc) arc.setAttribute('stroke-dashoffset', (100.5 * (1 - left / total)).toFixed(1));
    if (b) b.textContent = Math.ceil(left / 1000);
  }
  async function answer(i) {
    const q = A.quiz; if (!q || q.stage !== 'question') return;
    q.stage = 'sending';
    $$('.po-q-op', $('#po-quiz')).forEach(b => { b.disabled = true; b.classList.toggle('picked', +b.dataset.i === i); });
    try {
      const r = await net.submitAnswer(q.id, i);
      if (r && r.ok) { q.choice = i; q.stage = 'submitted'; $('#po-q-status').textContent = '✅ Đã ghi nhận đáp án ' + LETTERS[i] + '. Chờ hết giờ để xem kết quả…'; Sound.chime('msg'); }
      else { q.stage = 'submitted'; $('#po-q-status').textContent = (r && r.error) || 'Không gửi được đáp án.'; }
    } catch (e) { q.stage = 'question'; $$('.po-q-op', $('#po-quiz')).forEach(b => b.disabled = false); toast('Không gửi được: ' + e.message, 'err'); }
    heartbeat(true);
  }
  async function loadResult(q) {
    q.fetchingRes = true;
    let r;
    try { r = await net.getRoundResult(q.id); } catch (_) { }
    if (!r || !r.ok) { q.fetchingRes = false; return; }
    q.stage = 'result';
    const box = $('#po-quiz');
    const tot = r.total || 0;
    $$('.po-q-op', box).forEach(b => {
      const i = +b.dataset.i, n = (r.dist && r.dist[i]) || 0, pc = tot ? Math.round(n * 100 / tot) : 0;
      b.disabled = true;
      b.classList.toggle('right', i === r.dap);
      b.classList.toggle('wrong', i === r.my_choice && i !== r.dap);
      b.querySelector('.fill').style.width = pc + '%';
      b.querySelector('.pct').textContent = n + ' · ' + pc + '%';
    });
    const ring = box.querySelector('.po-ring'); if (ring) ring.style.visibility = 'hidden';
    let res;
    if (r.cancelled) res = h('span.po-q-res', null, 'Vòng này đã bị huỷ (không tính sao).');
    else if (r.my_choice == null) res = h('span.po-q-res', null, 'Bạn chưa trả lời câu này.');
    else if (r.my_correct) { res = h('span.po-q-res.ok', null, `🎉 Chính xác! +${r.stars} ⭐`); Sound.chime('correct'); }
    else { res = h('span.po-q-res.no', null, '😅 Chưa đúng — đáp án ' + LETTERS[r.dap]); Sound.chime('wrong'); }
    const foot = box.querySelector('.po-q-foot');
    foot.replaceChildren(res, h('span.po-muted', null, `${r.correct}/${tot} người trả lời đúng`), h('button.po-btn.sm', { onclick: () => { box.hidden = true; A.quiz.min = false; A.quiz.closed = true; } }, 'Đóng'));
    if (r.giai) { const g = h('div.po-q-giai', { html: '<b>Lời giải:</b> ' + esc(r.giai) }); box.append(g); U.math(g); }
    if (!q.min) box.hidden = false;
    heartbeat(true);
  }

  /* =================================================================
     7. NHẮC NGHỈ & TẬP TRUNG
     ================================================================= */
  const remPrefs = () => Object.assign({ eye: true, move: true, water: true }, store.get('rem:prefs', {}));
  function reminderTick(st) {
    if (!COUNTING.includes(st) || A.modalLock || A.focus) return;
    A.rem.eye++; A.rem.move++; A.rem.water++;
    if (A.quiz && A.quiz.stage !== 'result' && !$('#po-quiz').hidden) return;   // không làm phiền khi đang trả lời
    const R = S().reminders, P = remPrefs();
    if (P.eye && A.rem.eye >= R.eye_min * 60) { A.rem.eye = 0; breakDialog('eye'); }
    else if (P.move && A.rem.move >= R.move_min * 60) { A.rem.move = 0; A.rem.eye = 0; breakDialog('move'); }
    else if (P.water && A.rem.water >= R.water_min * 60) { A.rem.water = 0; toast('💧 Uống một ngụm nước nhé! Não cần nước để tập trung.', '', 8000); Sound.chime('remind'); }
  }
  function breakDialog(kind) {
    const R = S().reminders;
    const cfg = kind === 'eye'
      ? { icon: '👀', title: `Nghỉ mắt ${R.eye_sec} giây`, sec: R.eye_sec, tips: ['Nhìn ra xa khoảng 6 mét (cửa sổ, cuối phòng)', 'Chớp mắt chậm vài lần cho mắt đỡ khô', 'Quy tắc 20-20-20: cứ 20 phút, nhìn xa 20 feet (~6 m) trong 20 giây'] }
      : { icon: '🧘', title: `Đứng dậy vận động ${Math.round(R.move_sec / 60) || 1} phút`, sec: R.move_sec, tips: ['Đứng dậy, vươn vai và duỗi lưng', 'Xoay cổ, xoay vai nhẹ nhàng mỗi bên 5 lần', 'Đi lại vài bước, uống thêm ngụm nước'] };
    A.modalLock = true; Sound.chime('remind');
    if (kind === 'move') setTimeout(() => World.emote(net.me.id, 'vuon-vai'), 400);   // nhân vật cũng vươn vai cùng bạn
    let left = cfg.sec, timer;
    const cd = h('div.cd', null, U.fmtDur(left)), bar = h('i', { style: { width: '0%' } });
    modal(close => {
      timer = setInterval(() => {
        left--; cd.textContent = U.fmtDur(Math.max(0, left)); bar.style.width = (100 * (1 - left / cfg.sec)) + '%';
        if (left <= 0) { clearInterval(timer); close(); toast('Xong! Tiếp tục học thôi 💪'); }
      }, 1000);
      return h('div.po-dlg.po-break', null, h('div.big', null, cfg.icon), h('h2', null, cfg.title),
        h('ul', null, cfg.tips.map(t => h('li', null, t))), cd, h('div.po-bprog', null, bar),
        h('p.po-note', null, 'Trong lúc nghỉ, giờ học vẫn được tính. Lời nhắc theo khuyến nghị phổ biến về sức khoẻ mắt và vận động; bạn có thể tắt trong mục "Của tôi".'),
        R.allow_skip !== false ? h('div.po-dlg-foot', { style: { justifyContent: 'center' } }, h('button.po-btn.line.sm', { onclick: () => { clearInterval(timer); close(); } }, 'Bỏ qua lần này')) : null);
    }, { noClose: true, lock: true, onClose: () => { clearInterval(timer); A.modalLock = false; } });
  }

  function toggleFocus() {
    if (A.focus) { A.focus = null; $('#po-focus').classList.remove('on'); $('#po-focusring').hidden = true; toast('Đã tắt chế độ tập trung.'); heartbeat(true); return; }
    A.paused = false; $('#po-pause').classList.remove('on');
    A.focus = { phase: 'focus', until: Date.now() + APP.pomodoro.focus * 60e3, n: 1 };
    $('#po-focus').classList.add('on'); $('#po-focusring').hidden = false;
    toast(`🎯 Tập trung ${APP.pomodoro.focus} phút: tạm ẩn câu hỏi chung và lời nhắc. Cố lên!`);
    heartbeat(true);
  }
  function focusTick() {
    const f = A.focus, el = $('#po-focusring'); if (!f) return;
    const left = Math.max(0, f.until - Date.now());
    el.className = 'po-focusring po-card';
    el.replaceChildren(h('span', { style: { fontSize: '18px' } }, f.phase === 'focus' ? '🎯' : '☕'),
      h('div', null, h('b', null, (f.phase === 'focus' ? 'Tập trung · ' : 'Nghỉ ngắn · ') + U.fmtDur(left / 1000)), h('div.po-muted.po-small', null, 'Phiên thứ ' + f.n)),
      h('button.po-btn.ghost.sm', { onclick: toggleFocus }, 'Dừng'));
    if (left > 0) return;
    if (f.phase === 'focus') {
      f.phase = 'rest'; f.until = Date.now() + APP.pomodoro.rest * 60e3; Sound.chime('remind');
      A.rem.eye = 0; A.rem.move = Math.max(0, A.rem.move - 300);
      toast(`⏰ Xong ${APP.pomodoro.focus} phút tập trung! Nghỉ ${APP.pomodoro.rest} phút: đứng dậy, nhìn xa, uống nước nhé.`, 'gold', 9000);
    } else {
      f.phase = 'focus'; f.until = Date.now() + APP.pomodoro.focus * 60e3; f.n++; Sound.chime('quiz');
      toast(`🎯 Bắt đầu phiên tập trung thứ ${f.n}!`, '', 5000);
    }
    heartbeat(true);
  }
  function togglePause() {
    A.paused = !A.paused;
    $('#po-pause').classList.toggle('on', A.paused);
    if (A.paused && A.focus) { A.focus = null; $('#po-focus').classList.remove('on'); $('#po-focusring').hidden = true; }
    toast(A.paused ? '☕ Đang nghỉ — thời gian nghỉ không được tính. Bấm lại để học tiếp.' : '📖 Tiếp tục học! Đồng hồ đang chạy.');
    heartbeat(true);
  }

  /* =================================================================
     8. BẢNG BÊN
     ================================================================= */
  function bindHud() {
    bindActivity();
    $$('.po-tabs [data-tab]').forEach(b => b.addEventListener('click', () => { A.tab = b.dataset.tab; $('#po-side').classList.remove('closed'); renderTab(); }));
    $('#po-side-x').onclick = () => $('#po-side').classList.add('closed');
    $('#po-panel-btn').onclick = () => $('#po-side').classList.toggle('closed');
    $('#po-focus').onclick = toggleFocus;
    $('#po-pause').onclick = togglePause;
    $('#po-play').onclick = togglePlay;
    $('#po-sound').onclick = soundDialog;
    $('#po-online').onclick = () => { A.tab = 'rank'; $('#po-side').classList.remove('closed'); renderTab(); };
    $('#po-mytime').onclick = $('#po-mystars').onclick = $('#po-mystreak').onclick = () => { A.tab = 'me'; $('#po-side').classList.remove('closed'); renderTab(); };
    updateSoundBtn();
  }
  function renderTab() {
    $$('.po-tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === A.tab));
    $$('.po-pane').forEach(p => p.hidden = p.dataset.pane !== A.tab);
    const pane = $(`.po-pane[data-pane="${A.tab}"]`);
    if (A.tab === 'rank') paneRank(pane);
    if (A.tab === 'chat') { unread(0); paneChat(pane); }
    if (A.tab === 'people') panePeople(pane);
    if (A.tab === 'qa') paneQa(pane);
    if (A.tab === 'me') paneMe(pane);
  }

  /* ---------- xếp hạng ---------- */
  let gstats = null;
  async function refreshStats() {
    try { gstats = await net.globalStats(); } catch (_) { }
    const tk = $('#po-ticker');
    if (gstats) tk.innerHTML = `Hôm nay cả phòng đã học <b>${U.fmtHours(gstats.seconds_today)} giờ</b> · <b>${gstats.learners_today}</b> bạn đã vào học · <b>${gstats.answers_today}</b> câu đã trả lời`;
    if (A.tab === 'rank' && !$('#po-side').classList.contains('closed')) paneRank($('.po-pane[data-pane=rank]'));
  }
  async function paneRank(pane) {
    const L = A.lb;
    const seg = (items, key) => h('div.po-seg', null, items.map(([v, l]) => h('button' + (L[key] === v ? '.on' : ''), { onclick: () => { L[key] = v; paneRank(pane); } }, l)));
    const list = h('div.po-lb', null, h('div.po-empty', null, 'Đang tải…'));
    const p = A.profile || {};
    pane.replaceChildren(
      h('div.po-kpis', null,
        h('div.po-kpi', null, h('b', null, U.fmtDur(displaySeconds())), h('span', null, 'Giờ học hôm nay')),
        h('div.po-kpi', null, h('b', null, (p.today ? p.today.stars : 0) + ' ⭐'), h('span', null, 'Sao hôm nay')),
        h('div.po-kpi', null, h('b', null, (p.streak || 0) + ' 🔥'), h('span', null, 'Chuỗi ngày'))),
      h('h3', null, '🏆 Bảng xếp hạng'),
      seg([['seconds', '⏱️ Giờ học'], ['stars', '⭐ Sao'], ['streak', '🔥 Chuỗi']], 'metric'),
      L.metric !== 'streak' ? seg([['today', 'Hôm nay'], ['season', 'Cả đợt']], 'period') : h('p.po-muted.po-small', { style: { margin: 0 } }, `Chuỗi = số ngày liên tiếp học ≥ ${S().streak_min} phút.`),
      list,
      h('p.po-note', { style: { margin: 0 } }, 'Giờ học là thời gian hệ thống ghi nhận khi bạn ở trong phòng và không nghỉ. Bạn có thể ẩn mình khỏi bảng xếp hạng trong mục "Của tôi".'));
    try {
      const r = await net.leaderboard(L.metric, L.metric === 'streak' ? 'season' : L.period);
      const fmt = v => L.metric === 'seconds' ? U.fmtDur(v, true) : L.metric === 'stars' ? v + ' ⭐' : v + ' ngày';
      const medal = k => ['🥇', '🥈', '🥉'][k - 1] || k;
      const rows = (r.rows || []).map(x => h('div.po-lb-row' + (x.rank <= 3 ? '.top' + x.rank : '') + (x.id === net.me.id ? '.me' : ''), { onclick: () => profileDialog(x.id) },
        h('span.rk', null, String(medal(x.rank))), h('span.nm', null, x.name), h('span.v', null, fmt(x.v))));
      list.replaceChildren(...(rows.length ? rows : [h('div.po-empty', null, 'Chưa có ai trên bảng. Bạn sẽ là người đầu tiên! 🚀')]));
      if (r.me && !(r.rows || []).some(x => x.id === net.me.id)) list.append(h('div.po-lb-me', null, h('div.po-lb-row.me', null, h('span.rk', null, String(r.me.rank)), h('span.nm', null, 'Bạn'), h('span.v', null, fmt(r.me.v)))));
      if (p.hide_rank) list.append(h('p.po-muted.po-small', null, 'Bạn đang ẩn mình khỏi bảng xếp hạng.'));
    } catch (e) { list.replaceChildren(h('div.po-empty', null, 'Không tải được bảng xếp hạng.')); }
  }

  /* ---------- trò chuyện: Cả khu · Gần tôi · Nhắn riêng ---------- */
  const NEAR_R = () => S().near_radius || DEFAULT_SETTINGS.near_radius || 8;
  async function loadChatCache(z) {
    try { A.chatCache = (await net.recentMessages(z)).reverse().filter(m => !m.near || m.uid === net.me.id || World.isNear(m.near, NEAR_R())); A.chatZone = z; } catch (_) { A.chatCache = []; }
    wantNames(A.chatCache.map(m => m.uid));
  }
  const nameOf = uid => (A.names.get(uid) || {}).name || 'Bạn học';
  function msgEl(m) {
    const tagName = m.target ? nameOf(m.target) : null;
    return h('div.po-msg' + (m.uid === net.me.id ? '.mine' : '') + (m.target === net.me.id ? '.hl' : ''), { 'data-id': m.id },
      m.near ? h('span.po-near', { title: 'Tin "Gần tôi"' }, '📍') : null,
      h('span.who', { onclick: () => profileDialog(m.uid) }, nameOf(m.uid)),
      tagName ? h('span.tag', null, '@' + tagName + ' ') : null,
      h('span', null, m.text), h('span.t', null, U.fmtClock(T(m.created_at))),
      net.mode === 'online' && m.uid !== net.me.id ? h('button.rep', { title: 'Báo cáo tin nhắn', onclick: async e => { e.stopPropagation(); await net.qaReport('m', m.id); toast('Đã báo cáo. Cảm ơn bạn!'); } }, '⚑') : null);
  }
  function onMessage(m) {
    if (!m || m.zone !== A.zone || typeof m.text !== 'string') return;
    if (m.id != null && (A.chatCache || []).some(x => String(x.id) === String(m.id))) return;
    // tin "Gần tôi" của người ở xa: bỏ qua hẳn (không hiện, không bong bóng)
    if (m.near && m.uid !== net.me.id && !World.isNear(m.near, NEAR_R())) return;
    A.chatCache = (A.chatCache || []).concat(m).slice(-80);
    if (!A.names.has(m.uid)) wantNames([m.uid]);
    const mention = m.target === net.me.id;
    World.bubble(m.uid, (m.target ? '@' + nameOf(m.target) + ' ' : '') + m.text, mention, null, m.id);
    const list = $('.po-pane[data-pane=chat] .po-chat');
    const showHere = A.tab === 'chat' && !$('#po-side').classList.contains('closed') && A.chan === (m.near ? 'near' : 'zone');
    if (list && showHere) { list.querySelectorAll('.po-empty').forEach(e => e.remove()); list.append(msgEl(m)); list.scrollTop = list.scrollHeight; }
    else if (m.uid !== net.me.id) unread(1);
    if (mention) { toast('💬 ' + nameOf(m.uid) + ' nhắc tới bạn: ' + m.text, 'gold', 6000); Sound.chime('msg'); }
  }
  function unread(n) {
    A.unread = n ? A.unread + n : 0;
    const b = $('.po-tabs [data-tab=chat] .po-badge'); b.hidden = !A.unread; b.textContent = A.unread > 9 ? '9+' : A.unread || '';
  }
  function renderTagBar() {
    const bar = $('.po-pane[data-pane=chat] .po-tagbar'); if (!bar) return;
    bar.replaceChildren();
    if (A.tag) bar.append(h('span', null, 'Gửi tới '), h('span.po-chip.on', null, '@' + A.tag.name), h('button.po-chip', { onclick: () => { A.tag = null; renderTagBar(); } }, '✕'));
    else bar.append(h('span.po-muted.po-small', null, 'Gõ @ để nhắc tên một bạn'));
  }
  /* những người có thể nhắc tên: cùng khu (kênh Gần tôi: chỉ người ở gần) */
  function mentionable() {
    return World.peopleHere().filter(p => !(A.names.get(p.uid) || {}).hidden && (A.chan !== 'near' || (() => { const w = World.whereIs(p.uid); return w && World.isNear(w, NEAR_R()); })()))
      .map(p => ({ uid: p.uid, name: nameOf(p.uid) }));
  }
  /* gợi ý @tên khi gõ */
  function attachMention(inp, box) {
    let items = [], idx = 0;
    const close = () => { box.hidden = true; items = []; };
    const pick = it => { inp.value = inp.value.replace(/@([^\s@]*)$/, ''); A.tag = it; renderTagBar(); close(); inp.focus(); };
    const draw = () => {
      box.replaceChildren(...items.map((it, i) => h('button.po-at-item' + (i === idx ? '.on' : ''), { type: 'button', onmousedown: e => { e.preventDefault(); pick(it); } }, '@' + it.name)));
      box.hidden = !items.length;
    };
    inp.addEventListener('input', () => {
      const m = inp.value.match(/@([^\s@]*)$/); if (!m) return close();
      const q = U.unaccent(m[1].toLowerCase());
      items = mentionable().filter(it => U.unaccent(it.name.toLowerCase()).split(' ').some(w => w.startsWith(q)) || U.unaccent(it.name.toLowerCase()).includes(q)).slice(0, 6);
      if (!items.length) box.replaceChildren(h('div.po-muted.po-small', { style: { padding: '6px 8px' } }, A.chan === 'near' ? 'Không có ai ở gần bạn trùng tên này.' : 'Không có ai ở khu này trùng tên này.'));
      idx = 0; if (items.length) draw(); else box.hidden = false;
    });
    inp.addEventListener('keydown', e => {
      if (box.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length; draw(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); pick(items[idx]); }
      else if (e.key === 'Escape') close();
    });
    inp.addEventListener('blur', () => setTimeout(close, 150));
  }
  async function sendChat(text) {
    text = (text || '').trim(); if (!text) return false;
    if (U.badWord(text, 'all', A.banned)) { toast('Tin nhắn có từ ngữ không phù hợp.', 'err'); return false; }
    const m = World.me, near = A.chan === 'near' ? { x: +m.x.toFixed(1), y: +m.y.toFixed(1), z: +m.z.toFixed(1) } : null;
    try {
      const r = await net.sendMessage(A.zone, text, A.tag ? A.tag.uid : null, near);
      if (!r || !r.ok) { toast((r && r.error) || 'Không gửi được.', 'err'); return false; }
      if (/^(chào|xin chào|hello|hi)\b/i.test(text)) World.emote(net.me.id, 'vay');
      else if (/cố lên|qua môn|thi tốt/i.test(text)) World.emote(net.me.id, 'co-vu');
      A.tag = null; renderTagBar(); return true;
    } catch (e) { toast('Không gửi được: ' + e.message, 'err'); return false; }
  }
  async function paneChat(pane) {
    A.chan = A.chan || 'zone';
    const seg = h('div.po-seg', null, [['zone', '💬 Cả khu'], ['near', '📍 Gần tôi'], ['dm', '✉️ Nhắn riêng']].map(([v, l]) =>
      h('button' + (A.chan === v ? '.on' : ''), { onclick: () => { A.chan = v; A.tag = null; paneChat(pane); } }, l, v === 'dm' && A.dmUnread ? h('i.po-dot') : null)));
    if (A.chan === 'dm') return paneDm(pane, seg);
    if (A.chatZone !== A.zone) await loadChatCache(A.zone);
    const near = A.chan === 'near';
    const list = h('div.po-chat');
    (A.chatCache || []).filter(m => !!m.near === near).forEach(m => list.append(msgEl(m)));
    if (!list.children.length) list.append(h('div.po-empty', null, near ? `Chưa có tin nào gần bạn. Tin ở kênh này chỉ những bạn đứng trong khoảng ${NEAR_R()} m (cùng tầng) mới thấy.` : 'Chưa có tin nhắn nào ở khu này.'));
    const C = S().chat, free = C.free_text !== false;
    const inp = h('input.po-in', { placeholder: free ? (near ? 'Nhắn cho các bạn ở gần…' : 'Nhắn cho mọi người ở ' + ((ZONES[A.zone] || {}).short || '') + '… (gõ @ để nhắc tên)') : 'Chọn một mẫu câu bên dưới', maxlength: C.max_len || 80, disabled: !free });
    const atBox = h('div.po-at', { hidden: true });
    const send = async () => { if (await sendChat(inp.value)) inp.value = ''; };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && atBox.hidden) { e.preventDefault(); send(); } });
    attachMention(inp, atBox);
    pane.replaceChildren(seg,
      h('div.po-muted.po-small', null, near ? `📍 Chỉ những bạn trong khoảng ${NEAR_R()} m quanh bạn (cùng tầng) nhận được tin này.` : '💬 Mọi người ở ' + ((ZONES[A.zone] || {}).name || '') + ' đều thấy. Tin hiện trên đầu nhân vật khoảng 5 giây.'),
      list,
      h('div.po-compose', null,
        h('div.po-tagbar'),
        h('div.po-tpls', null, (S().templates || []).map(t => h('button.po-chip', { onclick: () => sendChat(t) }, t))),
        free ? h('div.po-compose-row', { style: { position: 'relative' } }, atBox, inp, h('button.po-btn.sm', { onclick: send }, 'Gửi')) : null,
        h('p.po-note', { style: { margin: 0 } }, 'Hãy lịch sự nhé. Tin nhắn có từ ngữ không phù hợp sẽ bị chặn; bấm ⚑ để báo cáo tin nhắn xấu.')));
    renderTagBar();
    if (A.tab === 'chat') unread(0);
    requestAnimationFrame(() => list.scrollTop = list.scrollHeight);
  }

  /* ---------- nhắn riêng (chỉ câu mẫu; chỉ hai người đọc được) ---------- */
  const dmTpls = () => S().dm_templates || DEFAULT_SETTINGS.dm_templates || [];
  async function loadDms() {
    try { A.dms = (await net.myDms()).reverse(); } catch (_) { A.dms = A.dms || []; }
    wantNames(A.dms.map(d => d.from_uid === net.me.id ? d.to_uid : d.from_uid));
  }
  function onDm(c) {
    A.dms = (A.dms || []).concat(c).slice(-200);
    const other = c.from_uid === net.me.id ? c.to_uid : c.from_uid;
    if (!A.names.has(other)) wantNames([other]);
    if (c.from_uid !== net.me.id) {
      const open = A.tab === 'chat' && A.chan === 'dm' && A.dmWith === other && !$('#po-side').classList.contains('closed');
      if (open) paneChat($('.po-pane[data-pane=chat]'));
      else { A.dmUnread = (A.dmUnread || 0) + 1; unread(1); toast('✉️ ' + nameOf(other) + ': ' + c.text, 'gold', 6000); Sound.chime('msg'); }
    }
  }
  function openDm(uid) { A.tab = 'chat'; A.chan = 'dm'; A.dmWith = uid; $('#po-side').classList.remove('closed'); renderTab(); }
  async function paneDm(pane, seg) {
    if (!A.dms) await loadDms();
    A.dmUnread = 0;
    if (net.mode !== 'online') { pane.replaceChildren(seg, h('div.po-empty', null, 'Nhắn riêng cần chế độ trực tuyến (có máy chủ). Ở chế độ ngoại tuyến chỉ có mình bạn.')); return; }
    const threads = new Map();
    for (const d of A.dms) { const o = d.from_uid === net.me.id ? d.to_uid : d.from_uid; threads.set(o, d); }
    if (!A.dmWith) {
      const rows = [...threads.entries()].reverse();
      pane.replaceChildren(seg,
        h('p.po-muted.po-small', { style: { margin: 0 } }, 'Nhắn riêng chỉ gửi được câu mẫu, chỉ bạn và người nhận đọc được. Bắt đầu cuộc trò chuyện từ tab 👥 Mọi người hoặc bấm vào một bạn.'),
        rows.length ? h('div.po-people', null, rows.map(([o, d]) => h('button.po-person', { onclick: () => { A.dmWith = o; paneChat(pane); } },
          h('div', null, h('b', null, nameOf(o)), h('div.po-muted.po-small', null, (d.from_uid === net.me.id ? 'Bạn: ' : '') + d.text)),
          h('span.po-muted.po-small', null, U.fmtClock(T(d.created_at)))))) : h('div.po-empty', null, 'Chưa có tin nhắn riêng nào.'));
      return;
    }
    const o = A.dmWith;
    const list = h('div.po-chat', null, A.dms.filter(d => d.from_uid === o || d.to_uid === o).map(d =>
      h('div.po-msg' + (d.from_uid === net.me.id ? '.mine' : ''), null, h('span.who', null, d.from_uid === net.me.id ? 'Bạn' : nameOf(o)), h('span', null, (d.kind === 'cheer' ? '💌 ' : '') + d.text), h('span.t', null, U.fmtClock(T(d.created_at))))));
    if (!list.children.length) list.append(h('div.po-empty', null, 'Chọn một câu bên dưới để bắt đầu.'));
    const send = async (i, btn) => {
      btn.disabled = true;
      const r = await net.sendDm(o, i).catch(x => ({ ok: false, error: x.message }));
      if (r && r.ok) { onDm({ id: Date.now(), from_uid: net.me.id, to_uid: o, text: dmTpls()[i], kind: 'dm', created_at: new Date().toISOString() }); paneChat(pane); }
      else { toast((r && r.error) || 'Không gửi được', 'err'); btn.disabled = false; }
    };
    pane.replaceChildren(seg,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, h('button.po-btn.line.sm', { onclick: () => { A.dmWith = null; paneChat(pane); } }, '←'), h('b', { style: { cursor: 'pointer' }, onclick: () => profileDialog(o) }, nameOf(o))),
      list,
      h('div.po-compose', null, h('div.po-tpls', null, dmTpls().map((t, i) => h('button.po-chip', { onclick: e => send(i, e.currentTarget) }, t))),
        h('p.po-note', { style: { margin: 0 } }, 'Chỉ gửi được câu mẫu để giữ an toàn cho mọi người.')));
    requestAnimationFrame(() => list.scrollTop = list.scrollHeight);
  }

  /* ---------- mọi người: tìm bạn, xem đang ở đâu, tới chỗ, nhắc tên, nhắn riêng ---------- */
  const ST_ICON = { hoc: '📖', tap_trung: '🎯', quiz: '📝', nghi: '☕', treo: '💤', piano: '🎹', scope: '🔭', gaze: '✨', choi: '🌳' };
  function panePeople(pane) {
    const q = h('input.po-in', { type: 'search', placeholder: 'Tìm theo tên…', value: A.peopleQ || '' });
    const list = h('div.po-people');
    const draw = () => {
      A.peopleQ = q.value;
      const k = U.unaccent(q.value.trim().toLowerCase());
      const me = World.me;
      const ppl = A.presence.filter(p => p.uid !== net.me.id && !(A.names.get(p.uid) || {}).hidden)
        .map(p => ({ p, name: nameOf(p.uid), w: p.pl !== '' ? World.whereIs(p.uid) : null }))
        .filter(x => !k || U.unaccent(x.name.toLowerCase()).includes(k));
      const dist = x => x.p.zone === me.zone && x.w ? Math.hypot(x.w.x - me.x, x.w.z - me.z) + Math.abs(x.w.y - me.y) * 5 : 1e6;
      ppl.sort((a, b) => dist(a) - dist(b) || a.name.localeCompare(b.name, 'vi'));
      const row = x => {
        const z = ZONES[x.p.zone] || {}, here = x.p.zone === me.zone;
        const loc = x.p.pl === '' ? 'Đang online · ẩn vị trí' : x.p.pl ? (z.space === 'campus' ? x.p.pl : 'Thư viện · ' + x.p.pl) : (z.name || '');
        const d = here && x.w ? Math.round(dist(x)) : null;
        return h('div.po-person', null,
          h('div', { style: { minWidth: 0, cursor: 'pointer' }, onclick: () => profileDialog(x.p.uid) },
            h('b', null, (ST_ICON[x.p.st] ? ST_ICON[x.p.st] + ' ' : '') + x.name),
            h('div.po-muted.po-small', null, '📍 ' + loc + (d != null && d < 1e5 ? ' · cách ' + d + ' m' : ''))),
          h('div.po-person-act', null,
            x.w ? (sameFloor(x.p.zone, x.w)
              ? h('button.po-btn.sm', { title: 'Đi bộ tới chỗ bạn ấy', 'aria-label': 'Đi bộ tới chỗ ' + x.name, onclick: () => { if (goTo(x.p.zone, x.w, x.name) && U.isSmall()) $('#po-side').classList.add('closed'); } }, '🚶')
              : h('button.po-btn.line.sm', { title: 'Bạn ấy ở tầng/khu khác — xem đường đi', 'aria-label': 'Xem đường tới chỗ ' + x.name, onclick: () => goTo(x.p.zone, x.w, x.name) }, '🧭')) : null,
            here ? h('button.po-btn.line.sm', { title: 'Nhắc tên trong chat', onclick: () => { A.tag = { uid: x.p.uid, name: x.name }; A.chan = 'zone'; A.tab = 'chat'; renderTab(); } }, '@') : null,
            net.mode === 'online' ? h('button.po-btn.line.sm', { title: 'Nhắn riêng', onclick: () => openDm(x.p.uid) }, '✉️') : null));
      };
      const npcs = World.npcs().filter(n => (!n.def.play || A.play) && (!k || U.unaccent(n.def.name.toLowerCase()).includes(k)));
      list.replaceChildren(
        ...(ppl.length ? ppl.map(row) : [h('div.po-empty', null, k ? 'Không tìm thấy ai tên như vậy đang online.' : 'Chưa có bạn nào khác đang online.')]),
        npcs.length ? h('h3', { style: { margin: '10px 0 2px' } }, 'Nhân viên thư viện (NPC)') : null,
        ...npcs.map(n => h('div.po-person.npc', null,
          h('div', { style: { minWidth: 0 } }, h('b', null, n.def.icon + ' ' + n.def.name + ' '), h('span.po-npc', null, 'NPC'),
            h('div.po-muted.po-small', null, '📍 ' + n.def.where + (n.open ? '' : ' · đã hết giờ làm (8:00–21:00)'))),
          n.open ? h('div.po-person-act', null, sameFloor(n.def.zone, n.at)
            ? h('button.po-btn.sm', { title: 'Đi bộ tới', onclick: () => { if (goTo(n.def.zone, n.at, n.def.name) && U.isSmall()) $('#po-side').classList.add('closed'); } }, '🚶')
            : h('button.po-btn.line.sm', { title: 'Ở tầng/khu khác — xem đường đi', onclick: () => goTo(n.def.zone, n.at, n.def.name) }, '🧭')) : null)));
    };
    q.addEventListener('input', draw);
    A.drawPeople = draw;
    pane.replaceChildren(
      h('p.po-muted.po-small', { style: { margin: 0 } }, 'Ai đang học và đang ở đâu. 🚶 tự đi bộ tới bạn ở cùng tầng; 🧭 chỉ đường khi bạn ấy ở tầng/khu khác. @ để nhắc tên trong chat, ✉️ để nhắn riêng. Bạn nào bật "Ẩn trạng thái & vị trí" thì không hiện vị trí.'),
      q, list);
    draw();
  }
  function npcDialog(def) {
    let i = Math.floor(Math.random() * def.lines.length);
    const line = h('p', { style: { fontSize: '15px', lineHeight: 1.55, margin: '10px 0' } }, '“' + def.lines[i] + '”');
    World.npcSay(def, def.lines[i]);
    modal(close => h('div.po-dlg', null, h('button.x', { onclick: close }, '✕'),
      h('h2', null, def.icon + ' ' + def.name + ' ', h('span.po-npc', null, 'NPC')),
      h('div.po-muted.po-small', null, def.role + ' · ' + def.where),
      line,
      h('p.po-note', { style: { margin: 0 } }, 'Đây là nhân vật ảo do ban tổ chức đặt để hướng dẫn (có mặt 8:00–21:00), không phải người thật và không tính vào số người đang học.'),
      h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Cảm ơn'),
        h('button.po-btn', { onclick: () => { i = (i + 1) % def.lines.length; line.textContent = '“' + def.lines[i] + '”'; World.npcSay(def, def.lines[i]); } }, 'Hỏi thêm'))));
  }

  /* ---------- hỏi bài ---------- */
  async function paneQa(pane, view) {
    view = view || { mode: 'list' };
    if (view.mode === 'list') {
      const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '7px' } }, h('div.po-empty', null, 'Đang tải…'));
      pane.replaceChildren(
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
          h('h3', null, '❓ Hỏi bài'), h('button.po-btn.sm', { onclick: () => paneQa(pane, { mode: 'ask' }) }, '+ Đặt câu hỏi')),
        h('p.po-muted.po-small', { style: { margin: 0 } }, 'Hỏi bài tập, kinh nghiệm ôn thi. Bấm vào câu hỏi để xem và trả lời. Viết công thức giữa hai dấu $, ví dụ $x^2$.'),
        list);
      try {
        const qs = await net.qaList();
        wantNames(qs.map(q => q.uid));
        list.replaceChildren(...(qs.length ? qs.map(q => {
          const it = h('div.po-qa-item' + (q.pinned ? '.pin' : ''), { onclick: () => paneQa(pane, { mode: 'detail', q }) },
            h('div.tt', { html: (q.pinned ? '📌 ' : '') + esc(q.title) }),
            h('div.mt', null, h('span.po-subj', null, q.subject === 'GT1' ? 'Giải tích' : q.subject === 'DS' ? 'Đại số' : 'Khác'),
              h('span', null, '💬 ' + q.answers_count + ' trả lời'), h('span', null, ((A.names.get(q.uid) || {}).name || 'Bạn học') + ' · ' + U.ago(q.created_at))));
          U.math(it); return it;
        }) : [h('div.po-empty', null, 'Chưa có câu hỏi nào. Hãy là người đầu tiên!')]));
      } catch (e) { list.replaceChildren(h('div.po-empty', null, 'Không tải được danh sách.')); }
    } else if (view.mode === 'ask') {
      const subj = h('select.po-in', null, h('option', { value: 'GT1' }, 'Giải tích'), h('option', { value: 'DS' }, 'Đại số'), h('option', { value: 'Khác' }, 'Khác / kinh nghiệm'));
      const title = h('input.po-in', { placeholder: 'Tiêu đề ngắn gọn (5–150 ký tự)', maxlength: 150 });
      const body = h('textarea.po-in', { placeholder: 'Mô tả chi tiết: đề bài, chỗ bạn đang vướng…', maxlength: 1500, rows: 5 });
      const err = h('div.po-small', { style: { color: 'var(--po-red)' } });
      pane.replaceChildren(h('button.po-btn.line.sm', { onclick: () => paneQa(pane), style: { alignSelf: 'flex-start' } }, '← Quay lại'),
        h('h3', null, 'Đặt câu hỏi'), subj, title, body, err,
        h('button.po-btn', {
          onclick: async e => {
            const t = title.value.trim(), b = body.value.trim();
            if (t.length < 5) { err.textContent = 'Tiêu đề cần ít nhất 5 ký tự.'; return; }
            if (U.badWord(t + ' ' + b, 'all', A.banned)) { err.textContent = 'Nội dung có từ ngữ không phù hợp.'; return; }
            e.currentTarget.disabled = true;
            const r = await net.qaAsk(subj.value, t, b).catch(x => ({ ok: false, error: x.message }));
            if (r && r.ok) { toast('Đã đăng câu hỏi!'); paneQa(pane); } else { err.textContent = (r && r.error) || 'Không đăng được.'; e.currentTarget.disabled = false; }
          }
        }, 'Đăng câu hỏi'),
        h('p.po-note', null, 'Câu hỏi bị 3 người báo cáo sẽ tự ẩn chờ ban tổ chức xem xét.'));
    } else {
      const q = view.q;
      const ans = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, h('div.po-empty', null, 'Đang tải câu trả lời…'));
      const reply = h('textarea.po-in', { placeholder: 'Viết câu trả lời…', rows: 3, maxlength: 1500 });
      const head = h('div', null, h('div.tt', { style: { fontWeight: 700, fontSize: '15px' }, html: esc(q.title) }),
        h('div.po-muted.po-small', null, ((A.names.get(q.uid) || {}).name || 'Bạn học') + ' · ' + U.ago(q.created_at)),
        q.body ? h('div.po-qa-body', { html: U.richText(q.body), style: { marginTop: '8px' } }) : null);
      pane.replaceChildren(h('button.po-btn.line.sm', { onclick: () => paneQa(pane), style: { alignSelf: 'flex-start' } }, '← Danh sách'), head,
        h('div.po-sec', null, h('h3', null, 'Câu trả lời'), ans),
        h('div.po-sec', null, reply, h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'space-between' } },
          net.mode === 'online' ? h('button.po-btn.line.sm', { onclick: async () => { await net.qaReport('q', q.id); toast('Đã báo cáo câu hỏi. Cảm ơn bạn!'); } }, '⚑ Báo cáo') : h('span'),
          h('button.po-btn.sm', {
            onclick: async e => {
              const b = reply.value.trim(); if (b.length < 2) return;
              if (U.badWord(b, 'all', A.banned)) { toast('Nội dung có từ ngữ không phù hợp.', 'err'); return; }
              e.currentTarget.disabled = true;
              const r = await net.qaReply(q.id, b).catch(x => ({ ok: false, error: x.message }));
              if (r && r.ok) { q.answers_count++; paneQa(pane, { mode: 'detail', q }); } else { toast((r && r.error) || 'Không gửi được', 'err'); e.currentTarget.disabled = false; }
            }
          }, 'Trả lời'))));
      U.math(head);
      try {
        const list = await net.qaAnswers(q.id);
        wantNames(list.map(a => a.uid));
        setTimeout(() => {
          ans.replaceChildren(...(list.length ? list.map(a => {
            const el = h('div.po-ans', null, h('div.who', null, ((A.names.get(a.uid) || {}).name || 'Bạn học') + ' · ' + U.ago(a.created_at)), h('div', { html: U.richText(a.body) }),
              net.mode === 'online' && a.uid !== net.me.id ? h('button.rep', { style: { border: 0, background: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--muted)', padding: 0 }, onclick: async () => { await net.qaReport('a', a.id); toast('Đã báo cáo.'); } }, '⚑ Báo cáo') : null);
            U.math(el); return el;
          }) : [h('div.po-empty', null, 'Chưa có câu trả lời. Bạn giúp nhé!')]));
        }, 350);
      } catch (_) { ans.replaceChildren(h('div.po-empty', null, 'Không tải được.')); }
    }
  }

  /* ---------- của tôi ---------- */
  function paneMe(pane) {
    const p = A.profile; if (!p) return;
    const sw = (checked, onchange) => { const i = h('input', { type: 'checkbox', checked }); i.addEventListener('change', () => onchange(i.checked)); return h('label.po-switch', null, i, h('i')); };
    const P = remPrefs(), R = S().reminders;
    const setPrivacy = async (k, v) => {
      p[k] = v;
      try { const r = await net.updatePrefs(World.me.style, p.hide_rank, p.hide_status); if (r) setProfile(r); toast('Đã lưu.'); } catch (e) { toast(e.message, 'err'); }
      net.presence.update({ st: p.hide_status ? 'hoc' : currentState() });
    };
    const fb = h('textarea.po-in', { rows: 3, maxlength: 1000, placeholder: 'Góp ý, báo lỗi, ý tưởng cho Học Online Cùng Huster…' });
    const fbKind = h('select.po-in', null, h('option', { value: 'gop_y' }, 'Góp ý'), h('option', { value: 'bao_loi' }, 'Báo lỗi'), h('option', { value: 'bao_cao' }, 'Báo cáo vi phạm'));
    const q = store.get('quality', U.isTouch ? 'low' : 'mid');
    pane.replaceChildren(...[
      h('div.po-me-card', null, cardThumb(net.me.id, p.display_name, U.maskMssv(p.mssv))),
      h('div.po-me-head', null,
        h('div', null, h('div.po-me-name', null, p.display_name), h('div.po-muted.po-small', null, 'MSSV ' + U.maskMssv(p.mssv) + (p.quiz ? ' · nhận câu hỏi GT + ĐS' : '')),
          h('div', { style: { marginTop: '6px' } }, h('button.po-btn.line.sm', { onclick: editAvatar }, '👕 Đổi trang phục')))),
      p.pending_name ? h('div.po-pending', null, `Tên "${p.full_name}" không giống mẫu tên tiếng Việt nên đang chờ ban tổ chức duyệt. Trong lúc chờ, mọi người thấy bạn là "${p.display_name}".`) : null,
      h('div.po-kpis', null,
        h('div.po-kpi', null, h('b', null, U.fmtDur(displaySeconds())), h('span', null, 'Hôm nay')),
        h('div.po-kpi', null, h('b', null, U.fmtHours((p.total || {}).seconds) + 'h'), h('span', null, 'Tổng giờ')),
        h('div.po-kpi', null, h('b', null, ((p.total || {}).stars || 0) + ' ⭐'), h('span', null, 'Tổng sao'))),
      h('div.po-kpis', null,
        h('div.po-kpi', null, h('b', null, (p.streak || 0) + ' 🔥'), h('span', null, 'Chuỗi ngày')),
        h('div.po-kpi', null, h('b', null, ((p.total || {}).correct || 0) + '/' + ((p.total || {}).answered || 0)), h('span', null, 'Câu đúng')),
        h('div.po-kpi', null, h('b', null, (p.today || {}).stars || 0), h('span', null, 'Sao hôm nay'))),
      h('div.po-sec', null, h('h3', null, '🔒 Quyền riêng tư'),
        h('div.po-row', null, h('span', null, 'Ẩn tôi khỏi bảng xếp hạng'), sw(p.hide_rank, v => setPrivacy('hide_rank', v))),
        h('div.po-row', null, h('span', null, 'Ẩn trạng thái & vị trí của tôi'), sw(p.hide_status, v => setPrivacy('hide_status', v))),
        h('div.po-row', null, h('span', null, 'Hiện bong bóng chat của người khác'), sw(store.get('bubbles', true), v => { store.set('bubbles', v); World.setBubbles(v); }))),
      h('div.po-sec', null, h('h3', null, '⏰ Lời nhắc sức khoẻ'),
        h('div.po-row', null, h('span', null, `Nghỉ mắt mỗi ${R.eye_min} phút (${R.eye_sec} giây)`), sw(P.eye, v => store.set('rem:prefs', Object.assign(remPrefs(), { eye: v })))),
        h('div.po-row', null, h('span', null, `Vận động mỗi ${R.move_min} phút`), sw(P.move, v => store.set('rem:prefs', Object.assign(remPrefs(), { move: v })))),
        h('div.po-row', null, h('span', null, `Nhắc uống nước mỗi ${R.water_min} phút`), sw(P.water, v => store.set('rem:prefs', Object.assign(remPrefs(), { water: v }))))),
      walletSec(p),
      viewSettings(),
      h('div.po-sec', null, h('h3', null, '🖥️ Đồ hoạ'),
        h('div.po-seg', null, [['low', 'Nhẹ'], ['mid', 'Vừa'], ['high', 'Đẹp']].map(([v, l]) => h('button' + (q === v ? '.on' : ''), { onclick: () => { store.set('quality', v); toast('Tải lại trang để áp dụng…'); setTimeout(() => location.reload(), 900); } }, l))),
        h('p.po-note', { style: { margin: 0 } }, 'Máy yếu hoặc nóng máy: chọn "Nhẹ" (tắt bóng đổ, giảm độ phân giải).')),
      h('div.po-sec', null, h('h3', null, '📮 Gửi góp ý cho ban tổ chức'), fbKind, fb,
        h('button.po-btn.sm', {
          style: { alignSelf: 'flex-end' }, onclick: async () => {
            const r = await net.sendFeedback(fbKind.value, fb.value).catch(e => ({ ok: false, error: e.message }));
            if (r && r.ok) { fb.value = ''; toast('Cảm ơn bạn! Ban tổ chức đã nhận được.'); } else toast((r && r.error) || 'Không gửi được.', 'err');
          }
        }, 'Gửi riêng cho ban tổ chức')),
      h('div.po-sec', null, h('h3', null, 'ℹ️ Cách tính giờ học'),
        h('p.po-small.po-muted', { style: { margin: 0, lineHeight: 1.5 } }, 'Giờ học là thời gian hệ thống ghi nhận: máy chủ cộng thời gian giữa hai nhịp (mỗi ~1 phút) khi bạn ở trạng thái Học, Tập trung hoặc đang trả lời câu hỏi. Không tính khi bấm Nghỉ, khi tab bị ẩn quá 5 phút, hoặc khi không phản hồi câu hỏi "Bạn vẫn đang học chứ?". Mở nhiều tab không cộng thêm. Một ngày được tính vào chuỗi nếu học ≥ ' + S().streak_min + ' phút.')),
      h('div.po-sec', null, h('button.po-btn.line.sm', { onclick: signOut }, '↩︎ Đổi người dùng / thoát')),
      h('p.po-note', null, APP.disclaimer)].filter(Boolean));
  }
  /* góc nhìn & di chuyển — chống chóng mặt */
  function viewSettings() {
    const o = World.opt;
    const sw = (checked, onchange) => { const i = h('input', { type: 'checkbox', checked }); i.addEventListener('change', () => onchange(i.checked)); return h('label.po-switch', null, i, h('i')); };
    const range = (v, min, max, step, onchange) => { const i = h('input.po-range', { type: 'range', min, max, step, value: v }); i.addEventListener('input', () => onchange(+i.value)); return i; };
    return h('div.po-sec', null, h('h3', null, '🎥 Góc nhìn & di chuyển'),
      h('div.po-seg', null, [['third', 'Sau lưng nhân vật'], ['first', 'Nhìn bằng mắt']].map(([v, l]) => h('button' + (o.view === v ? '.on' : ''), { onclick: e => { World.setOpt({ view: v }); $$('button', e.currentTarget.parentNode).forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, l))),
      h('div.po-row', null, h('span', null, 'Độ nhạy xoay góc nhìn'), range(o.look, 0.25, 1.2, 0.05, v => World.setOpt({ look: v }))),
      h('div.po-row', null, h('span', null, 'Tốc độ đi bộ'), range(o.speed, 0.6, 1.4, 0.05, v => World.setOpt({ speed: v }))),
      h('div.po-row', null, h('span', null, 'Giảm chuyển động (đỡ chóng mặt)'), sw(o.reduce, v => { World.setOpt({ reduce: v }); document.documentElement.classList.toggle('po-reduce', v); })),
      h('div.po-row', null, h('span', null, 'Bản đồ nhỏ ở góc màn hình'), sw(o.minimap, v => { World.setOpt({ minimap: v }); updateMini(); })));
  }
  function editAvatar() {
    const save = async st => {
      World.setStyle(st); net.presence.update({ sty: st });
      try { const r = await net.updatePrefs(st, A.profile.hide_rank, A.profile.hide_status); if (r) setProfile(r); } catch (_) { }
      const L = store.get('login', {}); L.style = st; store.set('login', L);
      toast('Đẹp quá! 👕');
    };
    if (window.AV2) { openDressing(World.me.style, { name: A.profile.display_name, mssv: A.profile.mssv }, save); return; }
    let ed;
    modal(close => {
      ed = avatarEditor(World.me.style);
      return h('div.po-dlg', null, h('button.x', { onclick: close }, '✕'), h('h2', null, 'Đổi trang phục'), ed.el,
        h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Huỷ'), h('button.po-btn', { onclick: () => { save(ed.get()); close(); } }, 'Lưu')));
    }, { onClose: () => ed && ed.stop() });
  }
  function signOut() {
    modal(close => h('div.po-dlg', null, h('h2', null, 'Thoát khỏi phòng?'),
      h('p.po-muted', null, net.mode === 'online' ? 'Bạn sẽ quay về màn đăng nhập. Giờ học và sao đã ghi nhận vẫn được giữ trên trình duyệt này.' : 'Hồ sơ trên trình duyệt này sẽ bị xoá (giờ học ngoại tuyến vẫn giữ).'),
      h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Ở lại'),
        h('button.po-btn', { onclick: async () => { net.presence.leave(); if (net.mode !== 'online') await net.signOut(); location.reload(); } }, 'Thoát'))));
  }

  /* =================================================================
     9. HỘP THOẠI
     ================================================================= */
  function modal(build, opts = {}) {
    const root = $('#po-modal');
    let done = false;
    const close = () => { if (done) return; done = true; root.hidden = true; root.classList.remove('lock'); root.replaceChildren(); opts.onClose && opts.onClose(); };
    const dlg = build(close);
    root.replaceChildren(dlg); root.hidden = false;
    root.classList.toggle('lock', !!opts.lock);
    root.classList.toggle('wide', !!opts.wide);
    root.onclick = e => { if (e.target === root && !opts.noClose) close(); };
    if (!opts.noClose) { const k = e => { if (e.key === 'Escape') { close(); removeEventListener('keydown', k); } }; addEventListener('keydown', k); }
    return close;
  }
  /* ---- tới chỗ một bạn / NPC: KHÔNG dịch chuyển. Cùng khu & cùng tầng → tự đi bộ tới; khác tầng/khu → chỉ đường ---- */
  function sameFloor(zone, at) {
    const m = World.me, sp = World.sp && World.sp();
    if (!at || zone !== m.zone || !sp) return false;
    return sp.kind === 'campus' || Math.abs(sp.floorOf((at.y || 0) + 0.1) - sp.floorOf(m.y + 0.1)) < 0.5;
  }
  function placeName(zone, at) {
    const Z = ZONES[zone] || {}, sp = SceneAPI.spaces[Z.space];
    let pl = ''; try { pl = sp && sp.place && at ? sp.place(at.x, at.y || 0, at.z) : ''; } catch (_) { }
    return Z.space === 'campus' ? (pl || Z.name) : 'Thư viện · ' + (pl || Z.short);
  }
  function routeHint(zone, at) {
    const from = (ZONES[World.me.zone] || {}).space, to = (ZONES[zone] || {}).space;
    const sp = SceneAPI.spaces[to];
    let pl = ''; try { pl = sp && sp.place && at ? sp.place(at.x, at.y || 0, at.z) : ''; } catch (_) { }
    const fl = to === 'D' ? 'tầng 10 (sân thượng)' : (pl.match(/Tầng \d+/) || [''])[0].toLowerCase() || ((/^Phòng ([45])\d\d$/.exec(pl) || [])[1] ? 'tầng ' + /^Phòng ([45])\d\d$/.exec(pl)[1] : '');
    if (to === 'campus') return from === 'campus' ? '' : 'Xuống sảnh tầng 1 rồi đi ra cửa chính để ra sân nhé.';
    if (from === 'campus') return 'Đi bộ vào cửa chính thư viện' + (fl && fl !== 'tầng 1' ? ', rồi đi thang máy ở sảnh lên ' + fl : '') + ' nhé.';
    return fl ? 'Đi thang máy' + (to === 'A' && from === 'A' ? ' (hoặc cầu thang bộ)' : '') + ' tới ' + fl + ' nhé.' : 'Đi thang máy tới đó nhé.';
  }
  function goTo(zone, at, name) {
    const m = World.me;
    if (!at || !ZONES[zone]) { toast('Chưa biết ' + name + ' đang ở đâu.'); return false; }
    if (sameFloor(zone, at)) {
      if (m.mode === 'piano') { toast('Rời đàn trước rồi hãy đi nhé.'); return false; }
      if (m.mode === 'seat') World.standUp();
      if (World.walkTo(at.x, at.z, null, 1.3)) { toast('🚶 Đang đi bộ tới chỗ ' + name + '…', '', 2500); return true; }
      return false;
    }
    toast('📍 ' + name + ' đang ở ' + placeName(zone, at) + '. ' + routeHint(zone, at), '', 8000);
    return false;
  }
  function countIn(zone) { return A.presence.filter(p => p.zone === zone).length; }
  /* thẻ sinh viên của một người (như thẻ đeo trên nhân vật) — MSSV luôn ở dạng đã che */
  function cardThumb(uid, name, mssvMasked) {
    if (!window.AV2) return h('div', { style: { fontSize: '40px' } }, '🧑‍🎓');
    const sty = uid === net.me.id ? World.me.style : ((A.presence.find(p => p.uid === uid) || {}).sty || AV2.randomState(AV2.seeded(uid)));
    try { const c = AV2.cardImage(sty && sty.equipped ? sty : AV2.randomState(AV2.seeded(uid)), name, mssvMasked, 340); c.className = 'po-idcard'; return c; }
    catch (_) { return h('div', { style: { fontSize: '40px' } }, '🧑‍🎓'); }
  }
  async function profileDialog(uid) {
    const isMe = uid === net.me.id;
    if (isMe) { A.tab = 'me'; $('#po-side').classList.remove('closed'); renderTab(); return; }
    const body = h('div', null, h('div.po-empty', null, 'Đang tải…'));
    const close = modal(c => h('div.po-dlg', null, h('button.x', { onclick: c }, '✕'), body));
    let d = null;
    try { d = await net.profileCard(uid); } catch (_) { }
    if (!d) { body.replaceChildren(h('div.po-empty', null, 'Không xem được hồ sơ này.')); return; }
    const ST = { hoc: '📖 Đang học', tap_trung: '🎯 Đang tập trung', quiz: '📝 Đang làm câu hỏi', nghi: '☕ Đang nghỉ', treo: '💤 Tạm vắng', choi: '🌳 Đang dạo chơi', offline: '⚪ Ngoại tuyến' };
    const cheers = S().cheers || [];
    const sel = h('select.po-in', null, cheers.map((c, i) => h('option', { value: i }, c)));
    body.replaceChildren(
      h('div.po-card-prof', null, cardThumb(uid, d.name, d.mssv),
        h('div', null, h('h2', { style: { margin: 0 } }, d.name), h('div.po-muted.po-small', null, 'MSSV ' + d.mssv + (d.pending_name ? ' · tên đang chờ duyệt' : '')),
          d.state ? h('div.po-small', { style: { marginTop: '4px' } }, (ST[d.state] || '') + (d.zone && ZONES[d.zone] ? ' · ' + ZONES[d.zone].name : '')) : null)),
      h('div.po-kpis', null,
        h('div.po-kpi', null, h('b', null, U.fmtDur(d.today_seconds)), h('span', null, 'Hôm nay')),
        h('div.po-kpi', null, h('b', null, U.fmtHours(d.total_seconds) + 'h'), h('span', null, 'Tổng giờ')),
        h('div.po-kpi', null, h('b', null, d.total_stars + ' ⭐'), h('span', null, 'Tổng sao'))),
      h('div.po-kpis', { style: { marginTop: '6px' } },
        h('div.po-kpi', null, h('b', null, d.streak + ' 🔥'), h('span', null, 'Chuỗi ngày')),
        h('div.po-kpi', null, h('b', null, d.total_correct), h('span', null, 'Câu đúng')),
        h('div.po-kpi', null, h('b', null, d.today_stars), h('span', null, 'Sao hôm nay'))),
      h('div.po-sec', { style: { marginTop: '12px' } }, h('h3', null, '💌 Gửi lời động viên riêng'), sel,
        h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' } },
          (() => {                                         // chỉ đi bộ khi cùng tầng; khác tầng/khu thì chỉ đường
            const pr = A.presence.find(x => x.uid === uid), w = pr && pr.pl !== '' ? World.whereIs(uid) : null;
            if (!w || !d.zone) return null;
            return sameFloor(pr.zone, w) ? h('button.po-btn.line.sm', { onclick: () => { close(); goTo(pr.zone, w, d.name); } }, '🚶 Đi tới chỗ bạn ấy')
              : h('button.po-btn.line.sm', { onclick: () => goTo(pr.zone, w, d.name) }, '🧭 Bạn ấy ở đâu?');
          })(),
          h('button.po-btn.line.sm', { onclick: () => { close(); A.tag = { uid, name: d.name }; A.chan = 'zone'; A.tab = 'chat'; $('#po-side').classList.remove('closed'); renderTab(); } }, '@ Nhắc tên'),
          net.mode === 'online' ? h('button.po-btn.line.sm', { onclick: () => { close(); openDm(uid); } }, '✉️ Nhắn riêng') : null,
          h('button.po-btn.line.sm', { onclick: () => { close(); A.tab = 'me'; $('#po-side').classList.remove('closed'); renderTab(); setTimeout(() => { const s = $('.po-pane[data-pane=me] select'); const t = $('.po-pane[data-pane=me] textarea'); if (s && t) { s.value = 'bao_cao'; t.value = 'Báo cáo người dùng "' + d.name + '" (' + d.mssv + '): '; t.focus(); } }, 50); } }, '⚑ Báo cáo'),
          h('button.po-btn.sm', {
            onclick: async e => {
              e.currentTarget.disabled = true;
              const r = await net.sendCheer(uid, +sel.value).catch(x => ({ ok: false, error: x.message }));
              if (r && r.ok) { toast('Đã gửi lời động viên tới ' + d.name + ' 💌'); close(); } else { toast((r && r.error) || 'Không gửi được', 'err'); e.currentTarget.disabled = false; }
            }
          }, 'Gửi'))));
  }
  function soundDialog() {
    modal(close => h('div.po-dlg', null, h('button.x', { onclick: close }, '✕'), h('h2', null, '🎧 Âm thanh'),
      h('p.po-muted.po-small', null, 'Toàn bộ âm thanh được máy tự tạo (không dùng nhạc có bản quyền). Đeo tai nghe để nghe rõ hơn.'),
      h('div.po-row', null, h('b', null, 'Bật âm thanh'), (() => { const i = h('input', { type: 'checkbox', checked: Sound.enabled }); i.onchange = () => { Sound.toggle(i.checked); updateSoundBtn(); }; return h('label.po-switch', null, i, h('i')); })()),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' } },
        Sound.CHANNELS.map(c => { const r = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: Sound.vol[c.id] }); r.oninput = () => { Sound.setVol(c.id, +r.value); if (!Sound.enabled && +r.value > 0) { Sound.toggle(true); updateSoundBtn(); } }; return h('div.po-range', null, h('span', null, c.label), r); })),
      h('div.po-row', { style: { marginTop: '8px' } }, h('span', null, 'Âm thanh theo nơi đứng (ngoài sân nghe chim, trong thư viện nghe lật sách)'), (() => { const i = h('input', { type: 'checkbox', checked: Sound.byPlace }); i.onchange = () => Sound.setByPlace(i.checked); return h('label.po-switch', null, i, h('i')); })()),
      A.weather && A.weather.kind === 'rain' ? h('p.po-note', null, '🌧️ Ở Bách Khoa đang mưa — thử bật tiếng mưa cho đúng không khí nhé.') : null));
  }
  function updateSoundBtn() { const b = $('#po-sound'); b.querySelector('span').textContent = Sound.enabled ? '🔊' : '🔇'; b.classList.toggle('on', Sound.enabled); }

  /* =================================================================
     10. MÔI TRƯỜNG: ngày/đêm theo giờ Hà Nội, thời tiết thật tại Bách Khoa
     ================================================================= */
  function nightFromClock() {
    const p = U.hanoiParts(), t = p.h + p.mi / 60;
    if (t >= 6.5 && t <= 16.8) return 0;
    if (t > 16.8 && t < 18.2) return (t - 16.8) / 1.4;
    if (t >= 5.3 && t < 6.5) return 1 - (t - 5.3) / 1.2;
    return 1;
  }
  const WICON = { clear: ['☀️', 'Trời quang'], cloudy: ['☁️', 'Nhiều mây'], partly: ['⛅', 'Có mây'], rain: ['🌧️', 'Mưa'], storm: ['⛈️', 'Dông'], fog: ['🌫️', 'Sương mù'] };
  async function fetchWeather() {
    const w = APP.weather;
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FBangkok`);
      const j = await r.json(), c = j.current, code = c.weather_code;
      const kind = code >= 95 ? 'storm' : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) ? 'rain' : code >= 45 && code <= 48 ? 'fog' : code === 3 ? 'cloudy' : code >= 1 ? 'partly' : 'clear';
      A.weather = { kind, temp: Math.round(c.temperature_2m) };
    } catch (_) { A.weather = null; }
    applyEnv();
  }
  function applyEnv() {
    const env = S().env || {};
    const night = env.time === 'day' ? 0 : env.time === 'night' ? 1 : nightFromClock();
    let kind = env.weather && env.weather !== 'auto' ? env.weather : (A.weather ? A.weather.kind : 'clear');
    const rainy = kind === 'rain' || kind === 'storm';
    const dim = rainy ? 0.32 : (kind === 'cloudy' || kind === 'fog') ? 0.2 : kind === 'partly' ? 0.06 : 0;
    if (window.SceneAPI && SceneAPI.renderer) SceneAPI.setNight(Math.min(1, Math.max(night, dim)));
    if (window.World && World.setRain) World.setRain(rainy);
    const [ic, lb] = WICON[kind] || WICON.clear;
    const el = $('#po-weather');
    if (el) el.textContent = (night > 0.6 && kind === 'clear' ? '🌙 Đêm' : ic + ' ' + lb) + (A.weather && (!env.weather || env.weather === 'auto') ? ' ' + A.weather.temp + '°C' : '');
  }

  /* =================================================================
     11. THÔNG BÁO
     ================================================================= */
  function toast(msg, kind = '', ms = 4000) {
    if (!msg) return;
    const el = h('div.po-toast' + (kind ? '.' + kind : ''), null, msg);
    const box = $('#po-toasts'); box.append(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
  }
  async function loadNotices() {
    try { const ns = await net.notices(); if (ns.length) showNotice(ns[0]); } catch (_) { }
  }
  function showNotice(n) {
    const seen = store.get('notices:seen', []);
    if (seen.includes(n.id)) return;
    const el = $('#po-notice');
    el.replaceChildren(h('b', null, '📢 Ban tổ chức:'), n.text, h('button', { title: 'Đóng', onclick: () => { el.hidden = true; store.set('notices:seen', seen.concat(n.id).slice(-30)); } }, '✕'));
    el.hidden = false; Sound.chime('remind');
  }

  World.setBubbles && setTimeout(() => World.setBubbles(store.get('bubbles', true)), 0);
  boot().catch(e => { console.error(e); PotaStartup.fail(e); });
})();
