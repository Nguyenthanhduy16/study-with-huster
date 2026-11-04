/* =====================================================================
   TRANG QUẢN TRỊ PHÒNG ÔN THI ẢO (admin.html)
   Trực tuyến: gọi các hàm admin_* trên Supabase kèm mật khẩu quản trị.
   Ngoại tuyến: chỉnh cấu hình & ngân hàng câu hỏi lưu trên trình duyệt này (để xem thử).
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, h, esc, store } = U;
  const online = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
  const sb = online ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }) : null;
  let PW = sessionStorage.getItem('pota-admin') || '';
  let settings = null, tab = 'overview';

  /* ---------- lớp gọi dữ liệu ---------- */
  async function call(fn, args = {}) {
    if (online) {
      const { data, error } = await sb.rpc(fn, Object.assign({ pw: PW }, args));
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error || 'Lỗi');
      return data;
    }
    return local(fn, args);
  }
  const lset = () => Object.assign({}, DEFAULT_SETTINGS, store.get('local:settings', {}));
  const lbank = () => store.get('local:questions', null) || (window.QUESTION_BANK || []).map(q => Object.assign({ active: true }, q));
  function local(fn, a) {
    const stats = store.get('local:stats', {}), prof = store.get('local:profile', null), today = U.hanoiDay();
    switch (fn) {
      case 'admin_login': return { ok: true };
      case 'admin_overview': {
        const t = stats[today] || { seconds: 0, answered: 0, correct: 0 };
        return { ok: true, online: prof ? 1 : 0, by_zone: {}, by_state: {}, users_total: prof ? 1 : 0, users_today: t.seconds ? 1 : 0, pending_names: 0,
          seconds_today: t.seconds, seconds_total: Object.values(stats).reduce((x, s) => x + s.seconds, 0), answered_today: t.answered, correct_today: t.correct,
          messages_today: 0, qa_open: store.get('local:qa', []).length, feedback_new: store.get('local:feedback', []).length, reported: 0,
          by_day: Object.entries(stats).sort().slice(-14).map(([day, s]) => ({ day, hours: +(s.seconds / 3600).toFixed(1), users: 1, answered: s.answered })),
          questions: lbank().length, questions_active: lbank().filter(q => q.active !== false && q.dungChoCauChung !== false).length };
      }
      case 'admin_users': return { ok: true, rows: prof ? [{ id: 'local', full_name: prof.full_name, display_name: prof.full_name, mssv: prof.mssv, name_ok: true, quiz: prof.quiz, online: true, seconds: Object.values(stats).reduce((x, s) => x + s.seconds, 0), seconds_today: (stats[today] || {}).seconds || 0, stars: Object.values(stats).reduce((x, s) => x + s.stars, 0), correct: 0, answered: 0, same_mssv: 1 }] : [] };
      case 'admin_set_settings': { const cur = store.get('local:settings', {}); for (const k in a.p_patch) cur[k] = (typeof a.p_patch[k] === 'object' && !Array.isArray(a.p_patch[k])) ? Object.assign({}, lset()[k], a.p_patch[k]) : a.p_patch[k]; store.set('local:settings', cur); return { ok: true, settings: lset() }; }
      case 'admin_questions': return { ok: true, rows: lbank().map(q => ({ id: q.id, mon: q.mon, chuong: q.chuong, do_kho: q.doKho, kieu: q.kieu, de: q.de, lua: q.lua, dap: q.dap, giai: q.giai, dung_cho_cau_chung: q.dungChoCauChung !== false, active: q.active !== false, use_count: 0 })), rounds: [] };
      case 'admin_upsert_questions': {
        const b = lbank(); let n = 0; const bad = [];
        for (const it of a.p_items) {
          if (!it.id || !it.de || !Array.isArray(it.lua) || it.lua.length < 2 || !(it.dap >= 0 && it.dap < it.lua.length)) { bad.push(it.id || '(thiếu id)'); continue; }
          const q = { id: it.id, mon: it.mon || 'GT1', chuong: it.chuong || (it.mon || 'GT1') + '.1', doKho: it.doKho || it.do_kho || 1, kieu: it.kieu || 'mc', de: it.de, lua: it.lua, dap: it.dap, giai: it.giai, dungChoCauChung: it.dungChoCauChung ?? it.dung_cho_cau_chung ?? true, active: it.active ?? true };
          const i = b.findIndex(x => x.id === q.id); if (i >= 0) b[i] = q; else b.push(q); n++;
        }
        store.set('local:questions', b); return { ok: true, saved: n, rejected: bad };
      }
      case 'admin_question_action': { const b = lbank(), i = b.findIndex(x => x.id === a.p_id); if (i >= 0) { if (a.p_action === 'delete') b.splice(i, 1); else b[i].active = a.p_action === 'enable'; } store.set('local:questions', b); return { ok: true }; }
      case 'admin_content': return { ok: true, rows: a.p_kind === 'feedback' ? store.get('local:feedback', []).map((f, i) => Object.assign({ id: i }, f)) : a.p_kind === 'qa' ? store.get('local:qa', []).map(q => Object.assign({ answers: [] }, q)) : a.p_kind === 'words' ? U.DEFAULT_BANNED.map(w => ({ word: w.w, accent: w.a, mode: w.m, scope: w.s })) : [] };
      case 'admin_reset': if (a.p_confirm !== 'XOA DU LIEU') throw new Error('Gõ đúng "XOA DU LIEU" để xác nhận.'); store.del('local:stats'); store.del('local:answers'); if (a.p_scope !== 'stats') { store.del('local:qa'); store.del('local:qa_ans'); store.del('local:feedback'); } if (a.p_scope === 'all') store.del('local:profile'); return { ok: true };
      default: throw new Error('Chức năng này cần kết nối Supabase (chế độ trực tuyến).');
    }
  }
  async function loadSettings() {
    if (online) { const { data } = await sb.from('app_settings').select('data').eq('id', 1).single(); settings = Object.assign({}, DEFAULT_SETTINGS, data ? data.data : {}); }
    else settings = lset();
  }

  /* ---------- tiện ích giao diện ---------- */
  function toast(msg, kind = '') { const el = h('div.po-toast' + (kind ? '.' + kind : ''), null, msg); $('#po-toasts').append(el); setTimeout(() => el.remove(), 3500); }
  async function act(fn, args, okMsg) { try { const r = await call(fn, args); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'err'); throw e; } }
  function modal(build) {
    const root = $('#po-modal'); const close = () => { root.hidden = true; root.replaceChildren(); };
    root.replaceChildren(build(close)); root.hidden = false; root.onclick = e => { if (e.target === root) close(); }; return close;
  }
  const fmtH = s => U.fmtHours(s) + ' giờ';
  const dt = t => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
  function csv(rows, cols, name) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const s = '﻿' + cols.map(c => q(c[1])).join(',') + '\n' + rows.map(r => cols.map(c => q(typeof c[0] === 'function' ? c[0](r) : r[c[0]])).join(',')).join('\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' })), download: name }); document.body.append(a); a.click(); a.remove();
  }

  /* ---------- đăng nhập ---------- */
  function loginView() {
    const pw = h('input.po-in', { type: 'password', placeholder: 'Mật khẩu quản trị', autocomplete: 'current-password' });
    const err = h('div.po-small', { style: { color: 'var(--po-red)' } });
    const go = async e => {
      e.preventDefault(); PW = pw.value;
      try { await call('admin_login'); sessionStorage.setItem('pota-admin', PW); start(); }
      catch (x) { err.textContent = x.message; }
    };
    $('#app').replaceChildren(h('div.ad-login', null, h('form.po-card', { onsubmit: go },
      h('div.po-eyebrow', null, 'Phòng ôn thi ảo'), h('h1', { style: { margin: 0 } }, 'Quản trị'),
      online ? h('p.po-muted.po-small', { style: { margin: 0 } }, 'Nhập mật khẩu quản trị đã đặt trong Supabase (xem hướng dẫn cài đặt).')
        : h('p.ad-off', { style: { margin: 0 } }, 'Chưa cấu hình Supabase: trang quản trị chạy NGOẠI TUYẾN, chỉ chỉnh cấu hình & câu hỏi cho trình duyệt này. Nhập mật khẩu bất kỳ để vào.'),
      pw, err, h('button.po-btn', { type: 'submit' }, 'Đăng nhập'), h('a.po-small', { href: 'index.html' }, '← Về Phòng ôn thi ảo'))));
    pw.focus();
  }

  /* ---------- khung chính ---------- */
  const TABS = [['overview', '📊 Tổng quan'], ['users', '👥 Người dùng'], ['questions', '📝 Câu hỏi'], ['content', '💬 Nội dung'], ['settings', '⚙️ Thiết đặt'], ['data', '🗄️ Dữ liệu']];
  async function start() {
    await loadSettings().catch(() => { settings = lset(); });
    $('#app').replaceChildren(h('div.ad', null,
      h('nav.ad-nav', null, h('div.brand', null, h('div.po-logo.sm', { html: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#34489a"/><path d="M14 24l18-8 18 8-18 8z" fill="#ffd166"/><path d="M22 29v10c0 4 20 4 20 0V29l-10 5z" fill="#fff"/></svg>' }), h('div', null, h('div.po-eyebrow', null, 'Quản trị'), h('b', null, 'Phòng ôn thi ảo'))),
        TABS.map(([id, l]) => h('button', { 'data-t': id, onclick: () => { tab = id; render(); } }, l)), h('div.sp'),
        h('button', { onclick: () => { sessionStorage.removeItem('pota-admin'); location.reload(); } }, '↩︎ Đăng xuất')),
      h('main.ad-main', { id: 'main' })));
    render();
  }
  function render() {
    $$('.ad-nav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const m = $('#main'); m.replaceChildren(online ? '' : h('div.ad-off', null, '⚠️ Chế độ ngoại tuyến: thay đổi chỉ áp dụng cho trình duyệt này. Điền SUPABASE_URL và SUPABASE_ANON_KEY trong config.js để quản trị thật.'));
    ({ overview, users, questions, content, settingsView, data })[tab === 'settings' ? 'settingsView' : tab](m);
  }

  /* ---------- 1. tổng quan ---------- */
  let ovTimer = null;
  async function overview(m) {
    clearInterval(ovTimer);
    const box = h('div');
    m.append(h('h1', null, 'Tổng quan'), h('p.ad-sub', null, (settings.season_name || '') + ' · tự làm mới mỗi 30 giây'), box);
    const load = async () => {
      if (tab !== 'overview') { clearInterval(ovTimer); return; }
      let o; try { o = await call('admin_overview'); } catch (e) { box.replaceChildren(h('p', null, e.message)); return; }
      const kpi = (v, l, w) => h('div.ad-kpi' + (w ? '.warn' : ''), null, h('b', null, v), h('span', null, l));
      const maxH = Math.max(1, ...o.by_day.map(d => d.hours));
      box.replaceChildren(
        h('div.ad-grid', null,
          kpi(o.online, 'Đang online (3 phút gần nhất)'), kpi(o.users_today, 'Người học hôm nay'), kpi(o.users_total, 'Tổng tài khoản'),
          kpi(U.fmtHours(o.seconds_today), 'Giờ học hôm nay'), kpi(U.fmtHours(o.seconds_total), 'Tổng giờ học'),
          kpi(o.answered_today ? Math.round(o.correct_today * 100 / o.answered_today) + '%' : '–', `Tỉ lệ đúng hôm nay (${o.answered_today} câu)`),
          kpi(o.pending_names, 'Tên chờ duyệt', o.pending_names > 0), kpi(o.reported, 'Nội dung bị báo cáo', o.reported > 0),
          kpi(o.feedback_new, 'Góp ý chưa xử lý', o.feedback_new > 0), kpi(o.messages_today, 'Tin nhắn 24 giờ qua'),
          kpi(o.qa_open, 'Câu hỏi bài đang mở'), kpi(o.questions_active + '/' + o.questions, 'Câu hỏi dùng được / tổng')),
        h('div.ad-box', null, h('h2', null, 'Đang ở đâu & làm gì'),
          h('div', null, Object.entries(o.by_zone).map(([z, n]) => h('span.ad-tag', null, ((ZONES[z] || {}).name || z) + ': ' + n)), Object.keys(o.by_zone).length ? null : h('span.po-muted', null, 'Chưa có ai online.')),
          h('div', { style: { marginTop: '6px' } }, Object.entries(o.by_state).map(([s, n]) => h('span.ad-tag.g', null, ({ hoc: 'Đang học', tap_trung: 'Tập trung', quiz: 'Làm câu hỏi', nghi: 'Nghỉ', treo: 'Tạm vắng' }[s] || s) + ': ' + n)))),
        h('div.ad-box', null, h('h2', null, 'Giờ học theo ngày'),
          o.by_day.length ? h('div.ad-chart', null, o.by_day.map(d => h('div', null, h('b', null, d.hours), h('i', { style: { height: (d.hours / maxH * 110) + 'px' } }), h('span', null, d.day.slice(8) + '/' + d.day.slice(5, 7)), h('span', null, d.users + ' người')))) : h('p.po-muted', null, 'Chưa có dữ liệu.')));
    };
    load(); ovTimer = setInterval(load, 30000);
  }

  /* ---------- 2. người dùng ---------- */
  async function users(m) {
    const q = h('input.po-in', { placeholder: 'Tìm theo tên hoặc MSSV…' });
    const f = h('select.po-in', { style: { flex: '0 0 auto', width: 'auto' } }, [['all', 'Tất cả'], ['online', 'Đang online'], ['pending', 'Tên chờ duyệt'], ['flagged', 'Bị ẩn/khoá/cấm chat']].map(([v, l]) => h('option', { value: v }, l)));
    const tbody = h('tbody'); let rows = [];
    const load = async () => {
      try { rows = (await call('admin_users', { p_search: q.value.trim(), p_filter: f.value })).rows || []; } catch (e) { return; }
      tbody.replaceChildren(...rows.map(u => h('tr', null,
        h('td', null, h('b', null, u.full_name), u.display_name !== u.full_name ? h('div.po-muted.po-small', null, 'Hiển thị: ' + u.display_name) : null,
          h('div', null, u.online ? h('span.ad-tag.g', null, 'online') : null, !u.name_ok && !u.approved ? h('span.ad-tag.y', null, 'chờ duyệt tên') : null,
            u.hidden ? h('span.ad-tag.r', null, 'ẩn') : null, u.blocked ? h('span.ad-tag.r', null, 'khoá') : null, u.chat_banned ? h('span.ad-tag.r', null, 'cấm chat') : null,
            u.same_mssv > 1 ? h('span.ad-tag.y', null, u.same_mssv + ' hồ sơ trùng MSSV') : null)),
        h('td', null, u.mssv), h('td', null, ((ZONES[u.zone] || {}).short || u.zone || '') + (u.hb_state ? ' · ' + u.hb_state : '')),
        h('td', null, U.fmtDur(u.seconds_today)), h('td', null, fmtH(u.seconds)), h('td', null, u.stars + ' ⭐'), h('td', null, u.correct + '/' + u.answered),
        h('td', null, h('div.ad-acts', null,
          !u.name_ok && !u.approved ? h('button', { onclick: () => doAct(u.id, 'approve') }, 'Duyệt tên') : null,
          h('button', { onclick: () => { const v = prompt('Đổi tên hiển thị thành:', u.full_name); if (v) doAct(u.id, 'rename', v); } }, 'Đổi tên'),
          h('button', { onclick: () => doAct(u.id, u.hidden ? 'unhide' : 'hide') }, u.hidden ? 'Hiện' : 'Ẩn'),
          h('button', { onclick: () => doAct(u.id, u.chat_banned ? 'unban_chat' : 'ban_chat') }, u.chat_banned ? 'Bỏ cấm chat' : 'Cấm chat'),
          h('button', { onclick: () => doAct(u.id, 'kick') }, 'Mời ra'),
          h('button.d', { onclick: () => doAct(u.id, u.blocked ? 'unblock' : 'block') }, u.blocked ? 'Mở khoá' : 'Khoá'),
          h('button.d', { onclick: () => { if (confirm('Xoá hẳn hồ sơ và thống kê của ' + u.full_name + '?')) doAct(u.id, 'delete'); } }, 'Xoá'))))));
      if (!rows.length) tbody.replaceChildren(h('tr', null, h('td', { colspan: 8 }, h('div.po-empty', null, 'Không có người dùng phù hợp.'))));
    };
    const doAct = async (uid, a, v) => { await act('admin_user_action', { p_uid: uid, p_action: a, p_value: v || null }, 'Đã cập nhật'); load(); };
    q.addEventListener('input', U.throttle(load, 400)); f.addEventListener('change', load);
    m.append(h('h1', null, 'Người dùng'), h('p.ad-sub', null, 'Tên không giống mẫu tên tiếng Việt sẽ hiện "Bạn học xxxx" cho tới khi được duyệt. Mọi thao tác đều được ghi nhật ký.'),
      h('div.ad-box', null, h('div.ad-bar', null, q, f,
        h('button.po-btn.line.sm', { onclick: () => csv(rows, [['full_name', 'Họ tên'], [r => U.maskMssv(r.mssv), 'MSSV (che)'], [r => Math.round(r.seconds / 60), 'Tổng phút'], ['stars', 'Sao'], ['correct', 'Câu đúng'], ['answered', 'Câu trả lời']], 'nguoi-dung.csv') }, '⬇ CSV (che MSSV)'),
        h('button.po-btn.line.sm', { onclick: () => { if (confirm('Xuất CSV có MSSV đầy đủ? Chỉ dùng nội bộ, không chia sẻ công khai.')) csv(rows, [['full_name', 'Họ tên'], ['mssv', 'MSSV'], [r => Math.round(r.seconds / 60), 'Tổng phút'], ['stars', 'Sao'], ['correct', 'Câu đúng'], ['answered', 'Câu trả lời']], 'nguoi-dung-day-du.csv'); } }, '⬇ CSV đầy đủ')),
        h('div.ad-scroll', null, h('table.ad-t', null, h('thead', null, h('tr', null, ['Họ tên', 'MSSV', 'Đang ở', 'Hôm nay', 'Tổng giờ', 'Sao', 'Đúng', 'Thao tác'].map(t => h('th', null, t)))), tbody))));
    load();
  }

  /* ---------- 3. câu hỏi ---------- */
  async function questions(m) {
    const Q = settings.quiz || {};
    const en = h('input', { type: 'checkbox', checked: Q.enabled !== false });
    const per = h('input.po-in', { type: 'number', min: 1, max: 60, value: Q.period_min || 5 });
    const ans = h('input.po-in', { type: 'number', min: 10, max: 300, value: Q.answer_sec || 45 });
    const st = h('input.po-in', { type: 'number', min: 0, max: 10, value: Q.stars ?? 1 });
    const gt = h('input', { type: 'checkbox', checked: (Q.subjects || []).includes('GT1') }), ds = h('input', { type: 'checkbox', checked: (Q.subjects || []).includes('DS') });
    const fMon = h('select.po-in', { style: { width: 'auto', flex: '0 0 auto' } }, h('option', { value: '' }, 'Mọi môn'), h('option', { value: 'GT1' }, 'Giải tích 1'), h('option', { value: 'DS' }, 'Đại số'));
    const fq = h('input.po-in', { placeholder: 'Tìm trong đề / mã câu…' });
    const tbody = h('tbody'), rtbody = h('tbody'); let rows = [];
    const draw = () => {
      const k = fq.value.trim().toLowerCase();
      const list = rows.filter(r => (!fMon.value || r.mon === fMon.value) && (!k || r.id.toLowerCase().includes(k) || r.de.toLowerCase().includes(k)));
      tbody.replaceChildren(...list.slice(0, 300).map(r => {
        const tr = h('tr', null, h('td', null, h('b', null, r.id), h('div.po-small.po-muted', null, (CHAPTERS[r.chuong] || r.chuong) + ' · ' + '★'.repeat(r.do_kho || 1) + ' · ' + r.kieu)),
          h('td.ad-q', null, h('div', { html: esc(r.de) }), h('div.po-small', null, (r.lua || []).map((l, i) => h('span.ad-tag' + (i === r.dap ? '.g' : ''), { html: 'ABCD'[i] + '. ' + esc(l) })))),
          h('td', null, r.active ? h('span.ad-tag.g', null, 'bật') : h('span.ad-tag.r', null, 'tắt'), r.dung_cho_cau_chung ? null : h('span.ad-tag.y', null, 'không dùng làm câu chung'), h('div.po-small.po-muted', null, 'đã phát ' + (r.use_count || 0) + ' lần')),
          h('td', null, h('div.ad-acts', null, h('button', { onclick: () => editQ(r) }, 'Sửa'),
            h('button', { onclick: async () => { await act('admin_question_action', { p_id: r.id, p_action: r.active ? 'disable' : 'enable' }, 'Đã cập nhật'); reload(); } }, r.active ? 'Tắt' : 'Bật'),
            h('button.d', { onclick: async () => { if (confirm('Xoá câu ' + r.id + '? (Câu đã từng phát sẽ chỉ bị tắt)')) { await act('admin_question_action', { p_id: r.id, p_action: 'delete' }, 'Đã xoá'); reload(); } } }, 'Xoá'))));
        U.math(tr); return tr;
      }));
    };
    const reload = async () => {
      let r; try { r = await call('admin_questions'); } catch (_) { return; }
      rows = r.rows || []; draw();
      rtbody.replaceChildren(...(r.rounds || []).map(x => h('tr', null, h('td', null, dt(x.opens_at)), h('td', null, x.question_id + ' · ' + x.mon), h('td', { html: esc(x.de) }),
        h('td', null, x.total ? `${x.correct}/${x.total} (${Math.round(x.correct * 100 / x.total)}%)` : '0'),
        h('td', null, x.cancelled ? h('span.ad-tag.r', null, 'đã huỷ') : h('div.ad-acts', null, h('button.d', { onclick: async () => { if (confirm('Huỷ vòng này và thu hồi sao đã cộng?')) { await act('admin_cancel_round', { p_round: x.id }, 'Đã huỷ vòng'); reload(); } } }, 'Huỷ vòng'))))));
      if (!(r.rounds || []).length) rtbody.replaceChildren(h('tr', null, h('td', { colspan: 5 }, h('div.po-empty', null, online ? 'Chưa có vòng nào.' : 'Lịch sử vòng chỉ có ở chế độ trực tuyến.'))));
    };
    fMon.onchange = draw; fq.oninput = U.throttle(draw, 300);
    const saveQuiz = async () => {
      const subs = [gt.checked && 'GT1', ds.checked && 'DS'].filter(Boolean);
      if (!subs.length) { toast('Chọn ít nhất một môn', 'err'); return; }
      const r = await act('admin_set_settings', { p_patch: { quiz: { enabled: en.checked, period_min: +per.value, answer_sec: +ans.value, stars: +st.value, subjects: subs } } }, 'Đã lưu. Áp dụng từ vòng kế tiếp.');
      if (r && r.settings) settings = r.settings;
    };
    m.append(h('h1', null, 'Câu hỏi ôn tập'),
      h('p.ad-sub', null, 'Máy chủ tự chọn câu cân bằng: luân phiên môn, ưu tiên chương ít xuất hiện, tránh lặp câu trong 20 vòng gần nhất, đổi dạng câu.'),
      h('div.ad-box', null, h('h2', null, 'Nhịp câu hỏi chung'),
        h('div.ad-form', null, h('label.ck', null, en, 'Bật câu hỏi chung'),
          h('label', null, 'Mỗi bao nhiêu phút một câu', per), h('label', null, 'Thời gian trả lời (giây)', ans), h('label', null, 'Sao cho câu đúng', st),
          h('label.ck', null, gt, 'Giải tích 1'), h('label.ck', null, ds, 'Đại số')),
        h('div', { style: { marginTop: '12px' } }, h('button.po-btn', { onclick: saveQuiz }, 'Lưu'))),
      h('div.ad-box', null, h('h2', null, 'Ngân hàng câu hỏi'),
        h('div.ad-bar', null, fq, fMon, h('button.po-btn.sm', { onclick: () => editQ(null) }, '+ Thêm câu'), h('button.po-btn.line.sm', { onclick: importQ }, '⬆ Nhập JSON'),
          h('button.po-btn.line.sm', { onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(rows.map(r => ({ id: r.id, mon: r.mon, chuong: r.chuong, doKho: r.do_kho, kieu: r.kieu, dungChoCauChung: r.dung_cho_cau_chung, de: r.de, lua: r.lua, dap: r.dap, giai: r.giai, active: r.active })), null, 1)], { type: 'application/json' })), download: 'ngan-hang-cau-hoi.json' }); document.body.append(a); a.click(); a.remove(); } }, '⬇ Xuất JSON')),
        h('div.ad-scroll', null, h('table.ad-t', null, h('thead', null, h('tr', null, ['Mã', 'Đề & lựa chọn (xanh = đáp án)', 'Trạng thái', ''].map(t => h('th', null, t)))), tbody))),
      h('div.ad-box', null, h('h2', null, 'Các vòng gần đây'),
        h('div.ad-scroll', null, h('table.ad-t', null, h('thead', null, h('tr', null, ['Giờ mở', 'Câu', 'Đề', 'Đúng', ''].map(t => h('th', null, t)))), rtbody))));
    reload();

    function editQ(r) {
      r = r || { id: '', mon: 'GT1', chuong: 'GT1.1', do_kho: 1, kieu: 'mc', de: '', lua: ['', '', '', ''], dap: 0, giai: '', dung_cho_cau_chung: true, active: true };
      const F = {
        id: h('input.po-in', { value: r.id, disabled: !!r.id }), mon: h('select.po-in', null, ['GT1', 'DS'].map(v => h('option', { value: v, selected: r.mon === v }, SUBJECTS[v].name))),
        chuong: h('select.po-in', null, Object.entries(CHAPTERS).map(([k, v]) => h('option', { value: k, selected: r.chuong === k }, k + ' · ' + v))),
        do_kho: h('input.po-in', { type: 'number', min: 1, max: 3, value: r.do_kho || 1 }), kieu: h('input.po-in', { value: r.kieu || 'mc' }),
        de: h('textarea.po-in', { rows: 3 }, r.de), giai: h('textarea.po-in', { rows: 3 }, r.giai || ''),
        lua: [0, 1, 2, 3].map(i => h('input.po-in', { value: (r.lua || [])[i] || '', placeholder: 'Lựa chọn ' + 'ABCD'[i] + (i >= 2 ? ' (để trống nếu chỉ có 2 lựa chọn)' : '') })),
        dap: h('select.po-in', null, [0, 1, 2, 3].map(i => h('option', { value: i, selected: r.dap === i }, 'ABCD'[i]))),
        chung: h('input', { type: 'checkbox', checked: r.dung_cho_cau_chung !== false })
      };
      const prev = h('div.po-q-giai');
      const upd = () => { prev.innerHTML = '<b>Xem trước:</b> ' + esc(F.de.value) + '<br>' + F.lua.map((l, i) => l.value ? 'ABCD'[i] + '. ' + esc(l.value) : '').filter(Boolean).join(' · '); U.math(prev); };
      [F.de, ...F.lua].forEach(x => x.addEventListener('input', U.throttle(upd, 300))); upd();
      modal(close => h('div.po-dlg', { style: { width: 'min(720px,100%)' } }, h('button.x', { onclick: close }, '✕'), h('h2', null, r.id ? 'Sửa câu ' + r.id : 'Thêm câu hỏi'),
        h('div.ad-form', null, h('label', null, 'Mã câu (duy nhất)', F.id), h('label', null, 'Môn', F.mon), h('label', null, 'Chương', F.chuong), h('label', null, 'Độ khó (1–3)', F.do_kho), h('label', null, 'Dạng câu', F.kieu)),
        h('label.po-field', { style: { marginTop: '10px' } }, h('span.po-small', null, 'Đề bài (công thức viết giữa $…$)'), F.de),
        h('div.ad-form', { style: { marginTop: '10px' } }, F.lua.map((x, i) => h('label', null, 'Lựa chọn ' + 'ABCD'[i], x)), h('label', null, 'Đáp án đúng', F.dap), h('label.ck', null, F.chung, 'Dùng làm câu hỏi chung')),
        h('label.po-field', { style: { marginTop: '10px' } }, h('span.po-small', null, 'Lời giải (hiện sau khi hết giờ)'), F.giai), prev,
        h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Huỷ'), h('button.po-btn', {
          onclick: async () => {
            const lua = F.lua.map(x => x.value.trim()).filter((x, i) => x || i < 2);
            while (lua.length > 2 && !lua[lua.length - 1]) lua.pop();
            const it = { id: F.id.value.trim(), mon: F.mon.value, chuong: F.chuong.value, doKho: +F.do_kho.value, kieu: F.kieu.value.trim() || 'mc', de: F.de.value.trim(), lua, dap: +F.dap.value, giai: F.giai.value.trim(), dungChoCauChung: F.chung.checked, active: r.active !== false };
            const res = await act('admin_upsert_questions', { p_items: [it] });
            if (res && res.saved) { toast('Đã lưu câu ' + it.id); close(); reload(); } else toast('Câu chưa hợp lệ: cần mã, đề, ≥2 lựa chọn, đáp án nằm trong các lựa chọn.', 'err');
          }
        }, 'Lưu'))));
    }
    function importQ() {
      const ta = h('textarea.po-in', { rows: 12, placeholder: '[{"id":"GT1-001","mon":"GT1","chuong":"GT1.1","doKho":1,"kieu":"mc","dungChoCauChung":true,"de":"…","lua":["…","…","…","…"],"dap":0,"giai":"…"}]' });
      const file = h('input', { type: 'file', accept: '.json,application/json' });
      file.onchange = async () => { ta.value = await file.files[0].text(); };
      modal(close => h('div.po-dlg', { style: { width: 'min(720px,100%)' } }, h('button.x', { onclick: close }, '✕'), h('h2', null, 'Nhập câu hỏi từ JSON'),
        h('p.po-muted.po-small', null, 'Dán một mảng JSON (cùng định dạng ngân hàng câu hỏi của bản "Mùa Ôn Thi") hoặc chọn tệp .json. Câu trùng mã sẽ được cập nhật. Trong JSON, dấu \\ của LaTeX phải viết thành \\\\.'),
        file, ta,
        h('div.po-dlg-foot', null, h('button.po-btn.line', { onclick: close }, 'Huỷ'), h('button.po-btn', {
          onclick: async () => {
            let items; try { items = JSON.parse(ta.value); if (!Array.isArray(items)) throw new Error('Cần một mảng [...]'); } catch (e) { toast('JSON không hợp lệ: ' + e.message, 'err'); return; }
            const r = await act('admin_upsert_questions', { p_items: items });
            if (r) { toast(`Đã lưu ${r.saved} câu` + (r.rejected && r.rejected.length ? `, bỏ qua ${r.rejected.length} câu lỗi: ${r.rejected.slice(0, 8).join(', ')}` : '')); close(); reload(); }
          }
        }, 'Nhập'))));
    }
  }

  /* ---------- 4. nội dung ---------- */
  async function content(m) {
    let kind = 'messages';
    const body = h('div');
    const seg = h('div.po-seg', { style: { maxWidth: '560px', marginBottom: '12px' } });
    const draw = () => { seg.replaceChildren(...[['messages', 'Tin nhắn'], ['qa', 'Hỏi bài'], ['feedback', 'Góp ý'], ['notices', 'Thông báo']].map(([k, l]) => h('button' + (kind === k ? '.on' : ''), { onclick: () => { kind = k; draw(); } }, l))); load(); };
    const mod = async (k, id, a) => { await act('admin_moderate', { p_kind: k, p_id: id, p_action: a }, 'Đã cập nhật'); load(); };
    async function load() {
      if (kind === 'notices') {
        const t = h('textarea.po-in', { rows: 2, maxlength: 300, placeholder: 'Ví dụ: 20h tối nay có buổi chữa đề Giải tích!' });
        const mins = h('input.po-in', { type: 'number', value: 60, min: 1, max: 1440, style: { width: '110px' } });
        let rows = []; try { rows = (await call('admin_content', { p_kind: 'notices' })).rows; } catch (_) { }
        body.replaceChildren(h('div.ad-box', null, h('h2', null, 'Gửi thông báo tới mọi người trong phòng'), t,
          h('div.ad-bar', { style: { marginTop: '8px' } }, h('span.po-small', null, 'Hiện trong (phút):'), mins, h('button.po-btn.sm', { onclick: async () => { await act('admin_notice', { p_text: t.value, p_minutes: +mins.value }, 'Đã gửi thông báo'); load(); } }, '📢 Gửi'))),
          h('div.ad-box', null, h('h2', null, 'Đã gửi'), rows.length ? rows.map(n => h('div.po-row', null, h('span', null, n.text), h('span.po-small.po-muted', null, dt(n.created_at) + ' → ' + dt(n.expires_at)),
            new Date(n.expires_at) > new Date() ? h('div.ad-acts', null, h('button', { onclick: () => mod('notice', n.id, 'expire') }, 'Gỡ')) : h('span.ad-tag', null, 'hết hạn'))) : h('p.po-muted', null, 'Chưa có.')));
        return;
      }
      let rows = []; try { rows = (await call('admin_content', { p_kind: kind })).rows || []; } catch (_) { }
      if (kind === 'messages') body.replaceChildren(h('div.ad-box', null, h('div.ad-scroll', null, h('table.ad-t', null, h('thead', null, h('tr', null, ['Lúc', 'Khu', 'Người gửi', 'Nội dung', ''].map(x => h('th', null, x)))),
        h('tbody', null, rows.length ? rows.map(r => h('tr', null, h('td', null, dt(r.created_at)), h('td', null, (ZONES[r.zone] || {}).short || r.zone), h('td', null, r.full_name, h('div.po-small.po-muted', null, r.mssv)),
          h('td', null, r.text, r.hidden ? h('span.ad-tag.r', null, 'đã ẩn') : null), h('td', null, h('div.ad-acts', null, h('button', { onclick: () => mod('message', r.id, r.hidden ? 'show' : 'hide') }, r.hidden ? 'Hiện' : 'Ẩn'))))) : h('tr', null, h('td', { colspan: 5 }, h('div.po-empty', null, 'Chưa có tin nhắn.'))))))));
      if (kind === 'qa') body.replaceChildren(...(rows.length ? rows.map(q => h('div.ad-box', null,
        h('div.po-row', null, h('div', null, h('b', { html: (q.pinned ? '📌 ' : '') + esc(q.title) }), h('div.po-small.po-muted', null, q.subject + ' · ' + (q.full_name || '') + ' ' + (q.mssv || '') + ' · ' + dt(q.created_at))),
          h('div.ad-acts', null, q.reports ? h('span.ad-tag.r', null, q.reports + ' báo cáo') : null, q.hidden ? h('span.ad-tag.r', null, 'đang ẩn') : null,
            h('button', { onclick: () => mod('qa', q.id, q.pinned ? 'unpin' : 'pin') }, q.pinned ? 'Bỏ ghim' : 'Ghim'),
            h('button', { onclick: () => mod('qa', q.id, q.hidden ? 'show' : 'hide') }, q.hidden ? 'Hiện' : 'Ẩn'),
            h('button.d', { onclick: () => { if (confirm('Xoá hẳn câu hỏi này?')) mod('qa', q.id, 'delete'); } }, 'Xoá'))),
        q.body ? h('div.ad-pre', { style: { margin: '6px 0' } }, q.body) : null,
        (q.answers || []).map(a => h('div.po-ans', { style: { margin: '6px 0' } }, h('div.who', null, a.name + ' · ' + dt(a.created_at) + (a.reports ? ' · ' + a.reports + ' báo cáo' : '') + (a.hidden ? ' · đang ẩn' : '')), h('div.ad-pre', null, a.body),
          h('div.ad-acts', null, h('button', { onclick: () => mod('qa_answer', a.id, a.hidden ? 'show' : 'hide') }, a.hidden ? 'Hiện' : 'Ẩn')))))) : [h('div.ad-box', null, h('p.po-muted', null, 'Chưa có câu hỏi.'))]));
      if (kind === 'feedback') body.replaceChildren(h('div.ad-box', null, rows.length ? rows.map(f => h('div.po-row', { style: { borderBottom: '1px solid var(--line)', padding: '8px 0', alignItems: 'flex-start' } },
        h('div', null, h('span.ad-tag' + (f.kind === 'bao_cao' ? '.r' : f.kind === 'bao_loi' ? '.y' : ''), null, { gop_y: 'Góp ý', bao_loi: 'Báo lỗi', bao_cao: 'Báo cáo' }[f.kind] || f.kind),
          h('div.ad-pre', null, f.body), h('div.po-small.po-muted', null, (f.full_name || 'Ẩn danh') + ' ' + (f.mssv || '') + ' · ' + dt(f.created_at))),
        online ? h('div.ad-acts', null, h('button', { onclick: () => mod('feedback', f.id, f.handled ? 'reopen' : 'done') }, f.handled ? '↺ Mở lại' : '✓ Đã xử lý')) : null)) : h('p.po-muted', null, 'Chưa có góp ý.')));
    }
    m.append(h('h1', null, 'Nội dung'), h('p.ad-sub', null, 'Kiểm duyệt tin nhắn, câu hỏi bài, đọc góp ý và gửi thông báo. Nội dung bị 3 người báo cáo sẽ tự ẩn chờ xem xét.'), seg, body);
    draw();
  }

  /* ---------- 5. thiết đặt ---------- */
  function settingsView(m) {
    const s = settings, E = s.env || {}, R = s.reminders || {}, C = s.chat || {};
    const I = (v, t = 'text', o = {}) => h('input.po-in', Object.assign({ type: t, value: v }, o));
    const sel = (v, opts) => h('select.po-in', null, opts.map(([k, l]) => h('option', { value: k, selected: v === k }, l)));
    const F = {
      open: h('input', { type: 'checkbox', checked: s.room_open !== false }), season: I(s.season_name || ''), start: I(s.season_start || '', 'date'), streak: I(s.streak_min || 25, 'number'),
      time: sel(E.time || 'auto', [['auto', 'Tự động theo giờ Hà Nội'], ['day', 'Luôn ban ngày'], ['night', 'Luôn ban đêm']]),
      weather: sel(E.weather || 'auto', [['auto', 'Thời tiết thật tại Bách Khoa'], ['clear', 'Nắng'], ['partly', 'Có mây'], ['cloudy', 'Âm u'], ['rain', 'Mưa']]),
      eye: I(R.eye_min || 20, 'number'), eyeS: I(R.eye_sec || 20, 'number'), move: I(R.move_min || 50, 'number'), moveS: I(R.move_sec || 60, 'number'), water: I(R.water_min || 60, 'number'),
      skip: h('input', { type: 'checkbox', checked: R.allow_skip !== false }),
      free: h('input', { type: 'checkbox', checked: C.free_text !== false }), cd: I(C.cooldown_sec || 10, 'number'), len: I(C.max_len || 80, 'number'),
      tpl: h('textarea.po-in', { rows: 8 }, (s.templates || []).join('\n')), cheers: h('textarea.po-in', { rows: 6 }, (s.cheers || []).join('\n')),
      dm: h('textarea.po-in', { rows: 6 }, (s.dm_templates || DEFAULT_SETTINGS.dm_templates || []).join('\n')), near: h('input.po-in', { type: 'number', min: 3, max: 30, value: s.near_radius || 8 })
    };
    const save = async patch => { const r = await act('admin_set_settings', { p_patch: patch }, 'Đã lưu — mọi người nhận cấu hình mới ngay.'); if (r && r.settings) settings = Object.assign({}, DEFAULT_SETTINGS, r.settings); };
    const words = h('div');
    const loadWords = async () => {
      let rows = []; try { rows = (await call('admin_content', { p_kind: 'words' })).rows || []; } catch (_) { }
      words.replaceChildren(h('div', null, rows.map(w => h('span.ad-tag' + (w.scope === 'name' ? '.y' : ''), { title: (w.accent ? 'so khớp có dấu' : 'so khớp không dấu') + ' · ' + (w.mode === 'token' ? 'nguyên từ' : 'chuỗi con') + ' · ' + (w.scope === 'name' ? 'chỉ tên' : 'tên + tin nhắn') },
        w.word, online ? h('button', { style: { border: 0, background: 'none', cursor: 'pointer', marginLeft: '4px' }, onclick: async () => { await act('admin_words', { p_op: 'remove', p_word: w.word }, 'Đã xoá'); loadWords(); } }, '✕') : null))));
    };
    const nw = I(''), nwA = h('input', { type: 'checkbox' }), nwM = sel('token', [['token', 'Nguyên từ'], ['substr', 'Chuỗi con']]), nwS = sel('all', [['all', 'Tên + tin nhắn'], ['name', 'Chỉ tên']]);
    const op = I('', 'password', { placeholder: 'Mật khẩu hiện tại' }), np = I('', 'password', { placeholder: 'Mật khẩu mới (≥ 8 ký tự)' });
    m.append(...[h('h1', null, 'Thiết đặt'), h('p.ad-sub', null, 'Các thay đổi được gửi tới mọi người đang ở trong phòng ngay lập tức.'),
      h('div.ad-box', null, h('h2', null, 'Đợt ôn thi'), h('div.ad-form', null, h('label.ck', null, F.open, 'Mở phòng (tắt = đóng toàn bộ tính năng)'), h('label', null, 'Tên đợt', F.season), h('label', null, 'Ngày bắt đầu (cho bảng "Cả đợt")', F.start), h('label', null, 'Số phút/ngày để tính chuỗi', F.streak)),
        h('div', { style: { marginTop: '12px' } }, h('button.po-btn', { onclick: () => save({ room_open: F.open.checked, season_name: F.season.value, season_start: F.start.value, streak_min: +F.streak.value }) }, 'Lưu'))),
      h('div.ad-box', null, h('h2', null, 'Ngày đêm & thời tiết'), h('div.ad-form', null, h('label', null, 'Bầu trời', F.time), h('label', null, 'Thời tiết', F.weather)),
        h('div', { style: { marginTop: '12px' } }, h('button.po-btn', { onclick: () => save({ env: { time: F.time.value, weather: F.weather.value } }) }, 'Áp dụng'))),
      h('div.ad-box', null, h('h2', null, 'Nhắc nghỉ (mặc định cho mọi người)'), h('div.ad-form', null, h('label', null, 'Nghỉ mắt mỗi (phút)', F.eye), h('label', null, 'Thời gian nghỉ mắt (giây)', F.eyeS), h('label', null, 'Vận động mỗi (phút)', F.move), h('label', null, 'Thời gian vận động (giây)', F.moveS), h('label', null, 'Nhắc uống nước mỗi (phút)', F.water), h('label.ck', null, F.skip, 'Cho phép "Bỏ qua lần này"')),
        h('div', { style: { marginTop: '12px' } }, h('button.po-btn', { onclick: () => save({ reminders: { eye_min: +F.eye.value, eye_sec: +F.eyeS.value, move_min: +F.move.value, move_sec: +F.moveS.value, water_min: +F.water.value, allow_skip: F.skip.checked } }) }, 'Lưu'))),
      h('div.ad-box', null, h('h2', null, 'Trò chuyện'), h('div.ad-form', null, h('label.ck', null, F.free, 'Cho phép nhắn tự do (tắt = chỉ mẫu câu)'), h('label', null, 'Giãn cách giữa 2 tin (giây)', F.cd), h('label', null, 'Độ dài tối đa', F.len)),
        h('div.ad-form', { style: { marginTop: '10px' } }, h('label', null, 'Mẫu câu (mỗi dòng một câu)', F.tpl), h('label', null, 'Lời động viên riêng (mỗi dòng một câu)', F.cheers), h('label', null, 'Câu mẫu "Nhắn riêng" (mỗi dòng một câu — sửa thứ tự thì tin cũ vẫn giữ chữ cũ)', F.dm), h('label', null, 'Bán kính kênh "Gần tôi" (mét)', F.near)),
        h('div', { style: { marginTop: '12px' } }, h('button.po-btn', { onclick: () => save({ chat: { free_text: F.free.checked, cooldown_sec: +F.cd.value, max_len: +F.len.value }, templates: F.tpl.value.split('\n').map(x => x.trim()).filter(Boolean), cheers: F.cheers.value.split('\n').map(x => x.trim()).filter(Boolean), dm_templates: F.dm.value.split('\n').map(x => x.trim()).filter(Boolean), near_radius: Math.max(3, Math.min(30, +F.near.value || 8)) }) }, 'Lưu'))),
      h('div.ad-box', null, h('h2', null, 'Từ cấm'), h('p.po-small.po-muted', { style: { marginTop: 0 } }, 'Vàng = chỉ áp dụng cho tên. "Có dấu" để không chặn nhầm (vd chặn "lồn" mà không chặn "lớn"). Di chuột lên từ để xem cách so khớp.'), words,
        online ? h('div.ad-bar', { style: { marginTop: '10px' } }, nw, h('label.ck.po-small', null, nwA, 'So khớp có dấu'), nwM, nwS, h('button.po-btn.sm', { onclick: async () => { await act('admin_words', { p_op: 'add', p_word: nw.value, p_accent: nwA.checked, p_mode: nwM.value, p_scope: nwS.value }, 'Đã thêm'); nw.value = ''; loadWords(); } }, '+ Thêm')) : h('p.po-small.po-muted', null, 'Sửa danh sách từ cấm cần chế độ trực tuyến.')),
      online ? h('div.ad-box', null, h('h2', null, 'Đổi mật khẩu quản trị'), h('div.ad-bar', null, op, np, h('button.po-btn.sm', { onclick: async () => { PW = op.value; await act('admin_change_password', { newpw: np.value }, 'Đã đổi mật khẩu'); PW = np.value; sessionStorage.setItem('pota-admin', PW); op.value = np.value = ''; } }, 'Đổi'))) : null].filter(Boolean));
    loadWords();
  }

  /* ---------- 6. dữ liệu ---------- */
  async function data(m) {
    const conf = h('input.po-in', { placeholder: 'Gõ XOA DU LIEU để xác nhận', style: { maxWidth: '280px' } });
    const scope = h('select.po-in', { style: { maxWidth: '360px' } }, h('option', { value: 'stats' }, 'Chỉ thống kê (giờ học, sao, câu trả lời, vòng câu hỏi)'), h('option', { value: 'content' }, 'Chỉ nội dung (tin nhắn, hỏi bài, góp ý, thông báo)'), h('option', { value: 'all' }, 'TẤT CẢ (kể cả hồ sơ người dùng)'));
    const log = h('div');
    m.append(h('h1', null, 'Dữ liệu'),
      h('div.ad-box', null, h('h2', null, 'Chính sách lưu dữ liệu (đề xuất)'), h('p.po-small', { style: { lineHeight: 1.6, margin: 0 } },
        'Bản thử nghiệm lưu: họ tên, MSSV, trang phục nhân vật, giờ học theo ngày, sao, câu trả lời, tin nhắn, hỏi bài, góp ý. MSSV đầy đủ chỉ quản trị viên xem được. Đề xuất xoá/ẩn danh hồ sơ sau khi kết thúc đợt (ví dụ 30 ngày) — cần người phụ trách phê duyệt trước khi công bố chính thức (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 có hiệu lực từ 01/01/2026).')),
      h('div.ad-box', null, h('h2', null, 'Xoá dữ liệu'), h('p.po-small.po-muted', { style: { marginTop: 0 } }, 'Không thể hoàn tác. Nên xuất CSV người dùng trước khi xoá.'),
        h('div.ad-bar', null, scope, conf, h('button.po-btn.warn.sm', { onclick: async () => { if (confirm('Chắc chắn xoá?')) { await act('admin_reset', { p_scope: scope.value, p_confirm: conf.value.trim() }, 'Đã xoá dữ liệu'); conf.value = ''; } } }, 'Xoá'))),
      h('div.ad-box', null, h('h2', null, 'Nhật ký quản trị'), log));
    if (!online) { log.replaceChildren(h('p.po-muted', null, 'Nhật ký chỉ có ở chế độ trực tuyến.')); return; }
    try {
      const rows = (await call('admin_content', { p_kind: 'log' })).rows || [];
      log.replaceChildren(h('div.ad-scroll', null, h('table.ad-t', null, h('thead', null, h('tr', null, h('th', null, 'Lúc'), h('th', null, 'Thao tác'), h('th', null, 'Chi tiết'))),
        h('tbody', null, rows.map(r => h('tr', null, h('td', null, dt(r.created_at)), h('td', null, r.action), h('td.po-small', null, JSON.stringify(r.detail))))))));
    } catch (_) { }
  }

  /* ---------- bắt đầu ---------- */
  (async () => {
    if (PW) { try { await call('admin_login'); return start(); } catch (_) { sessionStorage.removeItem('pota-admin'); PW = ''; } }
    loginView();
  })();
})();
