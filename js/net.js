/* =====================================================================
   LỚP MẠNG: một giao diện chung cho 2 chế độ
     - SupaNet  : nhiều người thật qua Supabase (RPC + Realtime)
     - LocalNet : ngoại tuyến, chỉ mình bạn, lưu trên trình duyệt
   Phần giao diện (app.js) chỉ gọi các hàm ở đây, không quan tâm đang ở chế độ nào.
   ===================================================================== */
(function () {
  'use strict';
  const { store } = U;

  /* =================================================================
     CHẾ ĐỘ NGOẠI TUYẾN
     ================================================================= */
  function LocalNet() {
    const ev = U.emitter();
    const me = { id: store.get('local:uid') || U.uid() };
    store.set('local:uid', me.id);
    let sessionStart = 0, lastHb = 0, lastState = 'nghi', zone = 'campus', lastMsg = 0;
    const settings = () => Object.assign({}, DEFAULT_SETTINGS, store.get('local:settings', {}));
    const stats = () => store.get('local:stats', {});
    const bank = () => store.get('local:questions', null) || window.QUESTION_BANK || [];
    const today = () => U.hanoiDay();

    function bump(fields) {
      const s = stats(), d = today();
      s[d] = s[d] || { seconds: 0, stars: 0, correct: 0, answered: 0 };
      for (const k in fields) s[d][k] += fields[k];
      store.set('local:stats', s);
      return s[d];
    }
    function streak() {
      const s = stats(), min = settings().streak_min * 60;
      let n = 0, t = U.now();
      if (!(s[U.hanoiDay(t)] && s[U.hanoiDay(t)].seconds >= min)) t -= 86400e3;
      while (s[U.hanoiDay(t)] && s[U.hanoiDay(t)].seconds >= min) { n++; t -= 86400e3; }
      return n;
    }
    const wal = () => Object.assign({ spent: 0, vol: 0, vday: '', vtoday: 0, lastTrash: 0, mango: 0, mday: '', cup: null, cupUntil: 0 }, store.get('local:wallet', {}));
    function profile() {
      const p = store.get('local:profile', null);
      if (!p) return null;
      const s = stats(), d = s[today()] || { seconds: 0, stars: 0, correct: 0, answered: 0 };
      const tot = Object.values(s).reduce((a, x) => ({ seconds: a.seconds + x.seconds, stars: a.stars + x.stars, correct: a.correct + x.correct, answered: a.answered + x.answered }), { seconds: 0, stars: 0, correct: 0, answered: 0 });
      const w = wal(), td = today();
      return Object.assign({}, p, { id: me.id, display_name: p.full_name, pending_name: false, today: d, total: tot, streak: streak(),
        wallet: Math.max(0, tot.stars - w.spent), spent: w.spent, volunteer: w.vol, volunteer_today: w.vday === td ? w.vtoday : 0,
        mango_total: w.mango, mango_today: w.mday === td, cup: w.cupUntil > Date.now() ? { kind: w.cup, until: new Date(w.cupUntil).toISOString() } : null });
    }

    /* câu hỏi: mỗi "slot" thời gian một câu, luân phiên môn rồi xoay vòng chương */
    function slotInfo(t = U.now()) {
      const q = settings().quiz, period = Math.max(60, q.period_min * 60) * 1000;
      const ans = Math.min(Math.max(q.answer_sec, 10), period / 1000 - 15) * 1000;
      const slot = Math.floor(t / period);
      return { q, period, ans, slot, opens: slot * period, closes: slot * period + ans, next: (slot + 1) * period };
    }
    function pickFor(slot, subjects) {
      const el = bank().filter(x => x.dungChoCauChung !== false && subjects.includes(x.mon) && x.lua && x.lua.length >= 2);
      if (!el.length) return null;
      const subs = subjects.filter(m => el.some(x => x.mon === m));
      const mon = subs[slot % subs.length];
      const chs = [...new Set(el.filter(x => x.mon === mon).map(x => x.chuong))].sort();
      const ch = chs[Math.floor(slot / subs.length) % chs.length];
      const pool = el.filter(x => x.mon === mon && x.chuong === ch);
      let h = slot * 2654435761 % 4294967296;
      return pool[Math.floor(h / 4294967296 * pool.length * 7) % pool.length];
    }

    return {
      mode: 'offline', ev, me,
      async init() { return { settings: settings(), banned: U.DEFAULT_BANNED }; },
      settings,
      async myProfile() { return profile(); },
      async register(f) {
        const e = U.checkName(f.name) || U.checkMssv(f.mssv);
        if (e) return { ok: false, error: e };
        store.set('local:profile', { full_name: U.titleName(f.name), mssv: f.mssv.trim(), quiz: !!f.quiz, style: f.style, hide_rank: !!f.hideRank, hide_status: !!f.hideStatus });
        return { ok: true, profile: profile() };
      },
      async updatePrefs(style, hideRank, hideStatus) {
        const p = store.get('local:profile', {}); Object.assign(p, { style, hide_rank: hideRank, hide_status: hideStatus });
        store.set('local:profile', p); return profile();
      },
      async signOut() { store.del('local:profile'); },
      async adminLogin() { return { ok: true }; },
      async startSession(z) { sessionStart = U.now(); lastHb = U.now(); lastState = 'nghi'; zone = z; return { ok: true, profile: profile() }; },
      async heartbeat(z, state) {
        const gap = (U.now() - lastHb) / 1000;
        if (['hoc', 'tap_trung', 'quiz'].includes(lastState) && gap > 0 && gap <= 120) bump({ seconds: Math.round(Math.min(gap, 90)) });
        lastHb = U.now(); lastState = state; zone = z;
        return { ok: true, profile: profile() };
      },
      async getRound() {
        const s = slotInfo();
        if (!s.q.enabled) return { enabled: false };
        const q = pickFor(s.slot, s.q.subjects);
        if (!q) return { enabled: true, empty: true };
        const my = store.get('local:answers', {})[s.slot];
        const p = store.get('local:profile', {});
        return {
          enabled: true, id: s.slot, opens_at: s.opens, closes_at: s.closes, next_at: s.next, now: U.now(),
          eligible: !!p.quiz && sessionStart > 0 && sessionStart <= s.opens,
          question: { id: q.id, mon: q.mon, chuong: q.chuong, do_kho: q.doKho, de: q.de, lua: q.lua }, my_choice: my == null ? null : my.c
        };
      },
      async submitAnswer(id, choice) {
        const s = slotInfo();
        if (id !== s.slot || U.now() > s.closes + 2000) return { ok: false, error: 'Đã hết thời gian trả lời.' };
        if (sessionStart > s.opens) return { ok: false, error: 'Bạn vào phòng khi vòng đã bắt đầu, hãy chờ vòng sau nhé.' };
        const a = store.get('local:answers', {});
        if (a[id]) return { ok: false, error: 'Bạn đã trả lời vòng này rồi.' };
        const q = pickFor(id, s.q.subjects), ok = choice === q.dap;
        a[id] = { c: choice, ok }; store.set('local:answers', a);
        bump({ answered: 1, correct: ok ? 1 : 0, stars: ok ? s.q.stars : 0 });
        return { ok: true };
      },
      async getRoundResult(id) {
        const s = slotInfo(id * slotInfo().period);
        if (U.now() < s.closes) return { ok: false, error: 'Vòng chưa kết thúc' };
        const q = pickFor(id, s.q.subjects), my = store.get('local:answers', {})[id];
        const dist = {}; if (my) dist[my.c] = 1;
        return { ok: true, id, dap: q.dap, giai: q.giai, dist, total: my ? 1 : 0, correct: my && my.ok ? 1 : 0, my_choice: my ? my.c : null, my_correct: my ? my.ok : null, stars: my && my.ok ? s.q.stars : 0 };
      },
      async leaderboard(metric, period) {
        const p = profile(); if (!p || p.hide_rank) return { rows: [], me: null };
        let v;
        if (metric === 'streak') v = p.streak;
        else {
          const s = stats(), from = period === 'today' ? today() : settings().season_start;
          v = Object.entries(s).filter(([d]) => d >= from).reduce((a, [, x]) => a + x[metric === 'stars' ? 'stars' : 'seconds'], 0);
        }
        return v > 0 ? { rows: [{ rank: 1, id: me.id, name: p.display_name, v }], me: { rank: 1, v } } : { rows: [], me: null };
      },
      async globalStats() { const p = profile(); return { seconds_today: p ? p.today.seconds : 0, answers_today: p ? p.today.answered : 0, learners_today: p && p.today.seconds ? 1 : 0 }; },
      async profileCard(uid) {
        const p = profile(); if (!p || uid !== me.id) return null;
        return { id: me.id, name: p.display_name, mssv: U.maskMssv(p.mssv), style: p.style, today_seconds: p.today.seconds, today_stars: p.today.stars, total_seconds: p.total.seconds, total_stars: p.total.stars, total_correct: p.total.correct, streak: p.streak, state: lastState, zone };
      },
      async publicProfiles(ids) {
        const p = profile(), out = {};
        if (p && ids.includes(me.id)) out[me.id] = { id: me.id, display_name: p.display_name, mssv_masked: U.maskMssv(p.mssv), style: p.style };
        return out;
      },
      async sendMessage(z, text, target, near) {
        const st = settings();
        if (Date.now() - lastMsg < st.chat.cooldown_sec * 1000) return { ok: false, error: `Chậm lại một chút nhé (mỗi ${st.chat.cooldown_sec} giây một tin).` };
        if (U.badWord(text, 'all')) return { ok: false, error: 'Tin nhắn có từ ngữ không phù hợp.' };
        lastMsg = Date.now();
        const m = { id: Date.now(), uid: me.id, zone: z, text, target, near: near || null, created_at: new Date().toISOString() };
        const all = store.get('local:msgs:' + z, []); all.push(m); store.set('local:msgs:' + z, all.slice(-40));
        setTimeout(() => ev.emit('message', m), 30);
        return { ok: true };
      },
      async recentMessages(z) { return store.get('local:msgs:' + z, []).slice().reverse(); },
      async sendCheer() { return { ok: false, error: 'Chế độ ngoại tuyến chỉ có mình bạn trong phòng.' }; },
      async sendDm() { return { ok: false, error: 'Chế độ ngoại tuyến chỉ có mình bạn trong phòng.' }; },
      async buyItem(item) {
        const cost = { coffee: 2, water: 0 }[item]; if (cost == null) return { ok: false, error: 'Không có món này.' };
        const pr = profile(); if (pr.wallet < cost) return { ok: false, error: 'Ví chưa đủ sao (cần ' + cost + ' ⭐).' };
        const w = wal(); w.spent += cost; w.cup = item; w.cupUntil = Date.now() + (item === 'coffee' ? 30 : 10) * 60e3; store.set('local:wallet', w);
        return { ok: true, profile: profile() };
      },
      async pickTrash() {
        const w = wal(), td = today(); if (Date.now() - w.lastTrash < 8000) return { ok: false, error: 'Từ từ thôi, nhặt từng cái một nhé.' };
        const n = w.vday === td ? w.vtoday : 0; if (n >= 30) return { ok: false, error: 'Hôm nay bạn đã nhặt đủ 30 lần rồi. Cảm ơn bạn! 🌱' };
        w.vol++; w.vday = td; w.vtoday = n + 1; w.lastTrash = Date.now(); store.set('local:wallet', w); return { ok: true, total: w.vol, today: n + 1 };
      },
      async claimMango() {
        const w = wal(), td = today(); if (w.mday === td) return { ok: false, already: true, total: w.mango };
        w.mday = td; w.mango++; store.set('local:wallet', w); return { ok: true, total: w.mango };
      },
      async myDms() { return []; },
      async sendFeedback(kind, body) { const f = store.get('local:feedback', []); f.push({ kind, body, created_at: new Date().toISOString() }); store.set('local:feedback', f); return { ok: true }; },
      async qaList() { return store.get('local:qa', []).slice().sort((a, b) => (b.pinned - a.pinned) || (b.id - a.id)); },
      async qaAnswers(qid) { return store.get('local:qa_ans', []).filter(a => a.qid === qid); },
      async qaAsk(subject, title, body) {
        if (U.badWord(title + ' ' + body, 'all')) return { ok: false, error: 'Nội dung có từ ngữ không phù hợp.' };
        const q = store.get('local:qa', []); const id = Date.now();
        q.push({ id, uid: me.id, subject, title, body, answers_count: 0, pinned: false, created_at: new Date().toISOString() });
        store.set('local:qa', q); return { ok: true, id };
      },
      async qaReply(qid, body) {
        if (U.badWord(body, 'all')) return { ok: false, error: 'Nội dung có từ ngữ không phù hợp.' };
        const a = store.get('local:qa_ans', []); a.push({ id: Date.now(), qid, uid: me.id, body, created_at: new Date().toISOString() }); store.set('local:qa_ans', a);
        const q = store.get('local:qa', []); const x = q.find(y => y.id === qid); if (x) x.answers_count++; store.set('local:qa', q);
        return { ok: true };
      },
      async qaReport() { return { ok: true }; },
      async notices() { return []; },
      /* realtime: chỉ có mình */
      presence: {
        join(meta) { setTimeout(() => ev.emit('presence', [Object.assign({ uid: me.id }, meta)]), 10); this.meta = meta; },
        update(meta) { this.meta = Object.assign(this.meta || {}, meta); ev.emit('presence', [Object.assign({ uid: me.id }, this.meta)]); },
        leave() { }
      },
      joinZone(z) { zone = z; }, leaveZone() { }, sendPos() { }, sendEmote() { },
      sendPiano() { },   // [piano-net] ngoại tuyến: không ai nghe
      status: () => 'offline'
    };
  }

  /* =================================================================
     CHẾ ĐỘ TRỰC TUYẾN — SUPABASE
     ================================================================= */
  function SupaNet(url, key) {
    const ev = U.emitter();
    const sb = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pota-auth' },
      realtime: { params: { eventsPerSecond: 10 }, heartbeatIntervalMs: 25000 }
    });
    const me = { id: null };
    let cfg = null, presCh = null, zoneCh = null, msgCh = null, dbCh = null, presMeta = {}, status = 'connecting';
    let curZone = null;
    /* số đếm tin realtime của máy này (xem trong Console: __potaNet.rt) — để ước lượng lưu lượng */
    const rt = { sent: {}, recv: {}, since: Date.now() };
    const cnt = (o, k) => { o[k] = (o[k] || 0) + 1; };

    /* lỗi thường gặp ⇒ câu tiếng Việt dễ hiểu */
    function friendly(e) {
      const m = String((e && (e.message || e.error_description || e.msg)) || e || '');
      if (/rate limit|too many|429/i.test(m)) return 'Quá nhiều lượt vào từ cùng một mạng trong thời gian ngắn. Hãy thử lại sau ít phút. (Ban tổ chức: nâng giới hạn "anonymous sign-ins" trong Supabase → Authentication → Rate Limits.)';
      if (/anonymous sign-ins are disabled|signups not allowed|anonymous/i.test(m)) return 'Máy chủ chưa bật đăng nhập ẩn danh. (Ban tổ chức: Supabase → Authentication → Sign In / Providers → bật "Allow anonymous sign-ins".)';
      if (/failed to fetch|networkerror|load failed|network request failed|fetch/i.test(m)) return 'Không tới được máy chủ: kiểm tra kết nối mạng, hoặc dự án Supabase đang tạm dừng.';
      if (/jwt|invalid api key|no api key/i.test(m)) return 'Khoá kết nối máy chủ không đúng (ban tổ chức kiểm tra SUPABASE_URL / SUPABASE_ANON_KEY trong config.js).';
      return m || 'Lỗi máy chủ';
    }
    const isNetErr = e => (e && e.net) || /failed to fetch|networkerror|load failed|network request failed|fetch|timeout|503|502|504/i.test(String((e && e.message) || e || ''));
    async function rpc(name, args) {
      const { data, error } = await sb.rpc(name, args || {});
      if (error) { console.warn('RPC', name, error); const e = new Error(friendly(error)); e.net = isNetErr(error); throw e; }
      return data;
    }
    /* thử lại vài lần khi lỗi mạng (lúc mở trang, mạng di động hay chập chờn) */
    async function retry(fn, n = 3) {
      for (let i = 0; ; i++) {
        try { return await fn(); } catch (e) { if (i >= n - 1 || !isNetErr(e)) throw e; await U.sleep(800 * (i + 1) * (i + 1)); }
      }
    }

    /* ----- trạng thái kết nối: gộp từ các kênh + sự kiện mạng của trình duyệt -----
       'connecting' (lần đầu) · 'online' · 'reconnecting' (mất kết nối, đang tự nối lại) · 'nonet' (máy đang mất mạng) */
    const chOk = {}, chGen = {};
    let everOnline = false, stTimer = null;
    const setStatus = s => { if (s !== status) { status = s; ev.emit('status', s); } };
    function recompute() {
      let s;
      const vals = Object.values(chOk);
      if (navigator.onLine === false) s = 'nonet';
      else if (vals.some(v => v === false)) s = everOnline ? 'reconnecting' : 'connecting';
      else if (vals.some(v => v === true)) s = 'online';
      else s = everOnline ? 'reconnecting' : 'connecting';
      if (s === 'online') { everOnline = true; clearTimeout(stTimer); stTimer = null; setStatus(s); return; }
      /* trễ 1,5 giây trước khi báo xấu: tránh nháy "đang kết nối lại" khi chỉ đổi khu */
      if (!stTimer) stTimer = setTimeout(() => { stTimer = null; const v = Object.values(chOk); setStatus(navigator.onLine === false ? 'nonet' : v.some(x => x === false) || !v.some(x => x === true) ? (everOnline ? 'reconnecting' : 'connecting') : 'online'); }, 1500);
    }
    /* trả về hàm nhận trạng thái của channel.subscribe(); bỏ qua thông báo của kênh cũ đã thay */
    function watch(name, onJoined) {
      const g = chGen[name] = (chGen[name] || 0) + 1;
      chOk[name] = null;
      return (s, err) => {
        if (chGen[name] !== g) return;
        if (s === 'SUBSCRIBED') { chOk[name] = true; if (onJoined) try { onJoined(); } catch (e) { console.error(e); } }
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { chOk[name] = false; if (err) console.warn('Realtime', name, s, err.message || err); }
        else if (s === 'CLOSED') delete chOk[name];
        recompute();
      };
    }
    /* mạng trở lại / mở lại tab sau khi ngủ: nối lại ngay thay vì chờ bộ hẹn giờ (có thể bị trình duyệt làm chậm) */
    let hiddenAt = 0;
    function wake() {
      try { if (!sb.realtime.conn) sb.realtime.connect(); } catch (_) { }
      if (presCh && chOk.pres === true) scheduleTrack();
      recompute();
    }
    addEventListener('online', wake);
    addEventListener('offline', recompute);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (hiddenAt && Date.now() - hiddenAt > 20e3) wake();
      hiddenAt = 0;
    });

    /* ----- hiện diện (presence) -----
       Mỗi lần track() Supabase gửi cho MỌI người trong kênh ⇒ chỉ gửi khi nội dung thật sự đổi,
       gộp lại tối đa 1 lần / presenceGapMs (giãn thêm khi đông), và không gửi vị trí nghỉ khi chỉ có mình trong khu. */
    let presList = [], lastTracked = '', lastTrackAt = 0, trackTimer = null;
    const liveMeta = new Map();
    // Presence has its own per-client limit (5 calls/30s). Fast seat/activity changes use Broadcast.
    const presGap = () => Math.max(8000, APP.presenceGapMs || 8000) * (presList.length > 150 ? 3 : presList.length > 60 ? 2 : 1);
    async function doTrack(force) {
      if (!presCh || chOk.pres !== true) return;          // chưa vào kênh: SUBSCRIBED sẽ tự gửi
      const k = JSON.stringify(presMeta);
      if (!force && k === lastTracked) return;
      lastTracked = k; lastTrackAt = Date.now(); cnt(rt.sent, 'track');
      let r = 'error';
      try { r = await presCh.track(Object.assign({}, presMeta, { ts: Date.now() })); } catch (_) { }
      if (r !== 'ok') lastTracked = '';                    // lỗi ⇒ lần sau gửi lại
    }
    function scheduleTrack() {
      if (trackTimer) return;
      trackTimer = setTimeout(() => { trackTimer = null; doTrack(false); }, Math.max(0, lastTrackAt + presGap() - Date.now()));
    }
    const fin = v => typeof v === 'number' && isFinite(v);
    function cleanMeta(m, uid) {
      const o = Object.assign({}, m, { uid });
      const live = liveMeta.get(uid);
      if (live && live.at > (m.ts || 0) && Date.now() - live.received < 30000) Object.assign(o, live.meta);
      else if (live) liveMeta.delete(uid);
      delete o.presence_ref;
      if (o.p && !(Array.isArray(o.p) && o.p.length >= 3 && o.p.slice(0, 4).every(fin))) delete o.p;
      return o;
    }
    function sendMeta() {
      const m = {};
      for (const k of ['zone', 'seat', 'sts', 'act', 'st', 'p']) if (k in presMeta) m[k] = presMeta[k];
      zoneSend('meta', { u: me.id, t: Date.now(), m });
    }
    function receiveMeta(p) {
      if (!p || typeof p.u !== 'string' || p.u === me.id || !fin(p.t) || !p.m || p.m.zone !== curZone) return;
      const m = { zone: curZone };
      if (Number.isInteger(p.m.seat) && p.m.seat >= -1 && p.m.seat < 10000) m.seat = p.m.seat;
      if (fin(p.m.sts)) m.sts = p.m.sts;
      if (typeof p.m.st === 'string' && p.m.st.length < 30) m.st = p.m.st;
      if (p.m.act === null || (p.m.act && [null, '', 'doc', 'dien-thoai', 'laptop', 'chup-anh'].includes(p.m.act.k) && fin(p.m.act.t))) m.act = p.m.act;
      if (Array.isArray(p.m.p) && p.m.p.length === 4 && p.m.p.every(fin)) m.p = p.m.p;
      const old = liveMeta.get(p.u);
      if (old && old.at > p.t) return;
      liveMeta.set(p.u, { at: p.t, received: Date.now(), meta: m });
      heard(p.u); emitPresence();
    }
    const emitPresence = U.throttle(() => {
      if (!presCh) return;
      const st = presCh.presenceState(), list = [];
      for (const uid in st) {
        const metas = st[uid]; if (!metas || !metas.length) continue;
        /* cùng một người mở nhiều tab: lấy bản cập nhật mới nhất */
        const m = metas.reduce((a, b) => ((b.ts || 0) > (a.ts || 0) ? b : a));
        list.push(cleanMeta(m, uid));
      }
      presList = list;
      if (zonePeers() > 0 && JSON.stringify(presMeta) !== lastTracked) scheduleTrack();
      ev.emit('presence', list);
    }, 400);

    /* ----- người cùng khu: từ hiện diện + những ai vừa phát tin trong kênh khu ----- */
    const recentPeers = new Map();     // uid → lúc nghe thấy gần nhất
    function zonePeers() {
      const now = Date.now(), set = new Set();
      for (const p of presList) if (p.uid !== me.id && p.zone === curZone) set.add(p.uid);
      for (const [u, t] of recentPeers) { if (now - t > 60e3) recentPeers.delete(u); else set.add(u); }
      return set.size;
    }
    const heard = u => { if (typeof u === 'string' && u !== me.id) recentPeers.set(u, Date.now()); };

    /* ----- vị trí: chỉ gửi khi có người cùng khu nghe; đông người thì thưa hơn ----- */
    let lastPos = null, lastPosAt = 0, lastSentPos = 0, posTimer = null;
    function posGap() {
      const n = zonePeers(), b = APP.posIntervalMs || 1200;
      return n <= 8 ? 0 : n <= 20 ? b * 1.5 : n <= 40 ? b * 2.5 : b * 4;
    }
    function zoneSend(event, payload) {
      /* chỉ gửi khi kênh đã vào xong — nếu không supabase-js chuyển sang gửi từng gói qua HTTP */
      if (!zoneCh || chOk.zone !== true || zoneCh.state !== 'joined') return false;
      cnt(rt.sent, event);
      Promise.resolve(zoneCh.send({ type: 'broadcast', event, payload })).catch(() => { });
      return true;
    }
    function aged(p) {
      /* gói gửi trễ: đẩy vị trí theo vận tốc cho khớp thời điểm gửi */
      if (!p.s) return p;
      const dt = Math.min(3, (Date.now() - lastPosAt) / 1000);
      return Object.assign({}, p, { x: +(p.x + (p.vx || 0) * dt).toFixed(2), z: +(p.z + (p.vz || 0) * dt).toFixed(2) });
    }
    function okPos(p) {
      if (!p || typeof p.u !== 'string' || p.u === me.id || !fin(p.x) || !fin(p.z)) return false;
      if (!fin(p.y)) p.y = 0;
      for (const k of ['r', 'vx', 'vz']) if (p[k] != null && !fin(p[k])) p[k] = 0;
      return true;
    }

    function subscribeDb() {
      dbCh = sb.channel('db-common')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'public_profiles' }, p => ev.emit('profile', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_profiles' }, p => ev.emit('profile', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, p => ev.emit('notice', p.new))
        /* 'hide_msg' (Đợt 3): tin nhắn vừa bị ẩn ⇒ gỡ khỏi màn hình (RLS không cho Realtime gửi chính dòng đã ẩn) */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, p => {
          const e = p.new || {};
          if (e.kind === 'hide_msg') ev.emit('message-hidden', +e.text); else ev.emit('event', e);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, p => { cfg.settings = p.new.data; ev.emit('settings', p.new.data); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cheers', filter: 'to_uid=eq.' + me.id }, p => ev.emit('cheer', p.new))
        .subscribe(watch('db'));
    }

    const net = {
      mode: 'online', ev, me, sb, rt,
      async init() {
        let session = null;
        try { session = (await sb.auth.getSession()).data.session; } catch (_) { }
        if (!session) {
          const { data, error } = await retry(async () => {
            const r = await sb.auth.signInAnonymously();
            if (r.error && isNetErr(r.error)) throw r.error;
            return r;
          });
          if (error) throw new Error('Không đăng nhập ẩn danh được. ' + friendly(error));
          session = data.session;
        }
        me.id = session.user.id;
        /* đảm bảo Realtime dùng vé đăng nhập của người dùng (RLS của bảng chỉ cho vai trò authenticated đọc) */
        try { sb.realtime.setAuth(session.access_token); } catch (_) { }
        const t0 = Date.now();
        cfg = await retry(() => rpc('get_config'));
        U.serverOffset = new Date(cfg.now).getTime() - (t0 + Date.now()) / 2;
        subscribeDb();
        return { settings: cfg.settings, banned: cfg.banned };
      },
      settings: () => cfg.settings,
      async myProfile() { return await rpc('my_profile'); },
      async checkIdentity(name, mssv) { return await rpc('check_identity', { p_name: name, p_mssv: mssv }); },
      async register(f) {
        return await rpc('register_profile', { p_name: U.titleName(f.name), p_mssv: f.mssv.trim(), p_quiz: !!f.quiz, p_style: f.style, p_hide_rank: !!f.hideRank, p_hide_status: !!f.hideStatus });
      },
      async updatePrefs(style, hideRank, hideStatus) { return await rpc('update_prefs', { p_style: style, p_hide_rank: hideRank, p_hide_status: hideStatus }); },
      async signOut() { /* giữ phiên ẩn danh để không mất thống kê; chỉ xoá hồ sơ cục bộ */ },
      async adminLogin(pw) { return await rpc('admin_login', { pw }); },
      async startSession(z) { return await rpc('start_session', { p_zone: z }); },
      async heartbeat(z, state) { return await rpc('heartbeat', { p_zone: z, p_state: state }); },
      async getRound() { const r = await rpc('get_round'); if (r && r.now) U.serverOffset = U.serverOffset * .7 + (new Date(r.now).getTime() - Date.now()) * .3; return r; },
      async submitAnswer(id, choice) { return await rpc('submit_answer', { p_round: id, p_choice: choice }); },
      async getRoundResult(id) { return await rpc('get_round_result', { p_round: id }); },
      async leaderboard(metric, period) { return await rpc('leaderboard', { p_metric: metric, p_period: period }); },
      async globalStats() { return await rpc('global_stats'); },
      async profileCard(uid) { return await rpc('profile_card', { p_uid: uid }); },
      async publicProfiles(ids) {
        const out = {};
        for (let i = 0; i < ids.length; i += 100) {
          const { data } = await sb.from('public_profiles').select('*').in('id', ids.slice(i, i + 100));
          (data || []).forEach(p => out[p.id] = p);
        }
        return out;
      },
      async sendMessage(z, text, target, near) { return await rpc('send_message', { p_zone: z, p_text: text, p_target: target || null, p_near: near || null }); },
      async recentMessages(z) {
        const { data } = await sb.from('messages').select('id,uid,zone,text,target,near,created_at').eq('zone', z).order('created_at', { ascending: false }).limit(40);
        return data || [];
      },
      async sendCheer(uid, idx) { return await rpc('send_cheer', { p_to: uid, p_idx: idx }); },
      /* nhắn riêng: chỉ câu mẫu; chỉ người gửi và người nhận đọc được (RLS) */
      async sendDm(uid, idx) { return await rpc('send_dm', { p_to: uid, p_idx: idx }); },
      async buyItem(item) { return await rpc('buy_item', { p_item: item }); },
      async pickTrash() { return await rpc('pick_trash'); },
      async claimMango() { return await rpc('claim_mango'); },
      async myDms() {
        const { data } = await sb.from('cheers').select('id,from_uid,to_uid,text,kind,created_at').or(`from_uid.eq.${me.id},to_uid.eq.${me.id}`).order('created_at', { ascending: false }).limit(80);
        return data || [];
      },
      async sendFeedback(kind, body) { return await rpc('send_feedback', { p_kind: kind, p_body: body }); },
      async qaList() {
        const { data } = await sb.from('qa_questions').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(80);
        return data || [];
      },
      async qaAnswers(qid) { const { data } = await sb.from('qa_answers').select('*').eq('qid', qid).order('created_at'); return data || []; },
      async qaAsk(s, t, b) { return await rpc('qa_ask', { p_subject: s, p_title: t, p_body: b }); },
      async qaReply(qid, b) { return await rpc('qa_reply', { p_qid: qid, p_body: b }); },
      async qaReport(kind, id) { return await rpc('qa_report', { p_kind: kind, p_id: id }); },
      async notices() { const { data } = await sb.from('notices').select('*').order('created_at', { ascending: false }).limit(3); return data || []; },

      /* ----- hiện diện: ai đang online, ở khu nào, ngồi ghế nào ----- */
      presence: {
        join(meta) {
          presMeta = Object.assign({}, meta);
          if (presCh) { scheduleTrack(); return; }          // gọi lại lần hai: chỉ cập nhật
          presCh = sb.channel('presence-global', { config: { presence: { key: me.id } } });
          presCh.on('presence', { event: 'sync' }, () => { cnt(rt.recv, 'presence'); emitPresence(); });
          /* (lại) vào kênh xong — kể cả sau khi mất mạng — luôn gửi lại hiện diện của mình */
          presCh.subscribe(watch('pres', () => doTrack(true)));
        },
        update(meta) {
          presMeta = Object.assign({}, presMeta, meta);
          if (['seat', 'sts', 'act', 'zone', 'st'].some(k => k in meta)) sendMeta();
          /* chỉ đổi vị trí nghỉ mà không ai cùng khu ⇒ để dành, gửi khi có người tới */
          if (Object.keys(meta).length === 1 && 'p' in meta && zonePeers() === 0) return;
          if (JSON.stringify(presMeta) !== lastTracked) scheduleTrack();
        },
        leave() { clearTimeout(trackTimer); trackTimer = null; if (presCh) presCh.untrack().catch(() => { }); lastTracked = ''; }
      },

      /* ----- kênh của khu: vị trí nhân vật, cử chỉ (broadcast, không lưu) + tin nhắn (bảng messages) ----- */
      joinZone(z) {
        if (curZone === z) return;
        net.leaveZone(); curZone = z;
        recentPeers.clear(); lastPos = null;
        const channel = zoneCh = sb.channel('zone-' + z, { config: { broadcast: { self: false, ack: false } } });
        const active = () => zoneCh === channel && curZone === z;
        channel.on('broadcast', { event: 'pos' }, ({ payload }) => { if (!active()) return; cnt(rt.recv, 'pos'); if (okPos(payload)) { heard(payload.u); ev.emit('pos', payload); } })
          .on('broadcast', { event: 'meta' }, ({ payload }) => { if (!active()) return; cnt(rt.recv, 'meta'); receiveMeta(payload); })
          .on('broadcast', { event: 'emo' }, ({ payload }) => { if (!active()) return; cnt(rt.recv, 'emo'); if (payload && typeof payload.u === 'string' && typeof payload.k === 'string' && payload.k.length < 40) { heard(payload.u); ev.emit('emote', payload); } })
          /* 'hi': một bạn vừa vào khu ⇒ ai đang đi thì gửi ngay vị trí (khỏi chờ), ai có vị trí nghỉ chưa gửi thì gửi */
          .on('broadcast', { event: 'hi' }, ({ payload }) => {
            if (!active()) return; cnt(rt.recv, 'hi'); if (!payload || typeof payload.u !== 'string') return;
            heard(payload.u);
            sendMeta();
            const dirty = JSON.stringify(presMeta) !== lastTracked;
            if (lastPos && (lastPos.s ? Date.now() - lastPosAt < 3000 : dirty)) setTimeout(() => { if (active() && lastPos) { zoneSend('pos', aged(lastPos)); lastSentPos = Date.now(); } }, 150 + Math.random() * 600);
            if (dirty) scheduleTrack();
          })
          .on('broadcast', { event: 'pno' }, ({ payload }) => { if (active() && z === 'lib_b' && payload && typeof payload.u === 'string' && payload.u !== me.id && Array.isArray(payload.e) && payload.e.length <= 64 && fin(payload.t)) { cnt(rt.recv, 'pno'); ev.emit('piano', payload); } })
          .subscribe(watch('zone', () => { zoneSend('hi', { u: me.id }); sendMeta(); }));
        const messages = msgCh = sb.channel('msg-' + z);
        messages.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'zone=eq.' + z }, p => { if (msgCh !== messages || curZone !== z) return; cnt(rt.recv, 'msg'); ev.emit('message', p.new); })
          .subscribe(watch('msg'));
      },
      leaveZone() {
        clearTimeout(posTimer); posTimer = null;
        // removeChannel resolves asynchronously: ignore CLOSED/error callbacks from the old generation.
        for (const name of ['zone', 'msg']) { chGen[name] = (chGen[name] || 0) + 1; delete chOk[name]; }
        if (zoneCh) sb.removeChannel(zoneCh).catch(() => { }); if (msgCh) sb.removeChannel(msgCh).catch(() => { });
        zoneCh = msgCh = null; curZone = null; liveMeta.clear(); recompute();
      },
      sendPos(p) {
        if (!p || !fin(p.x) || !fin(p.z)) return;
        const msg = Object.assign({ u: me.id }, p);
        lastPos = msg; lastPosAt = Date.now();
        if (document.hidden || !zonePeers()) return;        // một mình trong khu (hoặc tab ẩn): không ai cần nghe
        if (!p.s) { clearTimeout(posTimer); posTimer = null; if (zoneSend('pos', msg)) lastSentPos = Date.now(); return; }
        const wait = lastSentPos + posGap() - Date.now();
        if (wait <= 0) { if (zoneSend('pos', msg)) lastSentPos = Date.now(); }
        else if (!posTimer) posTimer = setTimeout(() => { posTimer = null; if (lastPos && lastPos.s && zoneSend('pos', aged(lastPos))) lastSentPos = Date.now(); }, wait);
      },
      /* cử chỉ (vẫy tay…): gửi thẳng cho người cùng khu, không lưu */
      sendEmote(k) { if (zonePeers()) zoneSend('emo', { u: me.id, k }); },
      /* [piano-net] gói nốt đàn (js/piano-net.js gom ≤ 25 gói/giây). Chỉ gửi khi kênh đã vào xong — nếu không
         supabase-js sẽ chuyển sang gửi qua HTTP từng gói. */
      sendPiano(b) { if (curZone === 'lib_b' && b && Array.isArray(b.e) && b.e.length <= 64 && fin(b.t) && !(sb.realtime && sb.realtime.isConnected && !sb.realtime.isConnected())) return zoneSend('pno', Object.assign({}, b, { u: me.id })); return false; },
      status: () => status
    };
    return net;
  }

  window.createNet = function () {
    let net = null;
    let secretKey = /^sb_secret_/.test(String(window.SUPABASE_ANON_KEY || ''));
    try { secretKey = secretKey || JSON.parse(atob(String(window.SUPABASE_ANON_KEY).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch (_) { }
    if (secretKey) {
      /* khoá bí mật lọt vào config.js: KHÔNG dùng (ai mở trang cũng lấy được khoá này) */
      console.error('[net] config.js đang chứa khoá service_role / secret — KHÔNG được để khoá này trên web! Hãy đổi khoá trong Supabase ngay và dùng khoá anon. Tạm chạy ngoại tuyến.');
    } else if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      if (!window.supabase) console.error('[net] Đã điền SUPABASE_URL nhưng không tải được vendor/supabase/supabase.js — chạy chế độ ngoại tuyến.');
      else {
        try { net = SupaNet(String(window.SUPABASE_URL).trim().replace(/\/+$/, ''), String(window.SUPABASE_ANON_KEY).trim()); }
        catch (e) { console.error('[net] Cấu hình Supabase trong config.js không hợp lệ — chạy chế độ ngoại tuyến.', e); }
      }
    }
    net = net || LocalNet();
    window.__potaNet = net;     // để xem nhanh trong Console: __potaNet.rt (đếm tin realtime), __potaNet.status()
    return net;
  };
})();
