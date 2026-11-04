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
      realtime: { params: { eventsPerSecond: 8 } }
    });
    const me = { id: null };
    let cfg = null, presCh = null, zoneCh = null, msgCh = null, dbCh = null, presMeta = {}, status = 'connecting';
    let curZone = null;

    async function rpc(name, args) {
      const { data, error } = await sb.rpc(name, args || {});
      if (error) { console.warn('RPC', name, error); throw new Error(error.message || 'Lỗi máy chủ'); }
      return data;
    }
    const setStatus = s => { if (s !== status) { status = s; ev.emit('status', s); } };
    /* Supabase giới hạn ~5 lần cập nhật hiện diện / 30 giây cho mỗi người ⇒ gộp lại, tối đa 1 lần / 8 giây */
    const pushTrack = U.throttle(() => { if (presCh) presCh.track(Object.assign({}, presMeta, { ts: Date.now() })).catch(() => { }); }, APP.presenceGapMs || 8000);

    function subscribeDb() {
      dbCh = sb.channel('db-common')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'public_profiles' }, p => ev.emit('profile', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_profiles' }, p => ev.emit('profile', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, p => ev.emit('notice', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, p => ev.emit('event', p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, p => { cfg.settings = p.new.data; ev.emit('settings', p.new.data); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cheers', filter: 'to_uid=eq.' + me.id }, p => ev.emit('cheer', p.new))
        .subscribe(s => { if (s === 'SUBSCRIBED') setStatus('online'); else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('reconnecting'); });
    }

    const net = {
      mode: 'online', ev, me, sb,
      async init() {
        let { data: { session } } = await sb.auth.getSession();
        if (!session) {
          const { data, error } = await sb.auth.signInAnonymously();
          if (error) throw new Error('Không đăng nhập ẩn danh được: ' + error.message + ' (đã bật Anonymous Sign-ins trong Supabase chưa?)');
          session = data.session;
        }
        me.id = session.user.id;
        const t0 = Date.now();
        cfg = await rpc('get_config');
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
          presMeta = meta;
          presCh = sb.channel('presence-global', { config: { presence: { key: me.id } } });
          presCh.on('presence', { event: 'sync' }, () => {
            const st = presCh.presenceState(), list = [];
            for (const uid in st) {
              const metas = st[uid]; if (!metas.length) continue;
              const m = metas.reduce((a, b) => ((b.ts || 0) > (a.ts || 0) ? b : a));
              list.push(Object.assign({}, m, { uid }));
            }
            ev.emit('presence', list);
          });
          presCh.subscribe(async s => {
            if (s === 'SUBSCRIBED') { await presCh.track(Object.assign({}, presMeta, { ts: Date.now() })); setStatus('online'); }
            else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('reconnecting');
          });
        },
        update(meta) { presMeta = Object.assign({}, presMeta, meta); pushTrack(); },
        leave() { if (presCh) presCh.untrack(); }
      },

      /* ----- kênh của khu: vị trí nhân vật + tin nhắn ----- */
      joinZone(z) {
        if (curZone === z) return;
        net.leaveZone(); curZone = z;
        zoneCh = sb.channel('zone-' + z, { config: { broadcast: { self: false } } });
        zoneCh.on('broadcast', { event: 'pos' }, ({ payload }) => ev.emit('pos', payload))
          .on('broadcast', { event: 'emo' }, ({ payload }) => ev.emit('emote', payload)).subscribe();
        msgCh = sb.channel('msg-' + z)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'zone=eq.' + z }, p => ev.emit('message', p.new))
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'zone=eq.' + z }, p => { if (p.new.hidden) ev.emit('message-hidden', p.new.id); })
          .subscribe();
      },
      leaveZone() {
        if (zoneCh) sb.removeChannel(zoneCh); if (msgCh) sb.removeChannel(msgCh);
        zoneCh = msgCh = null; curZone = null;
      },
      sendPos(p) { if (zoneCh) zoneCh.send({ type: 'broadcast', event: 'pos', payload: Object.assign({ u: me.id }, p) }); },
      /* cử chỉ (vẫy tay…): gửi thẳng cho người cùng khu, không lưu */
      sendEmote(k) { if (zoneCh) zoneCh.send({ type: 'broadcast', event: 'emo', payload: { u: me.id, k } }); },
      status: () => status
    };
    return net;
  }

  window.createNet = function () {
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) return SupaNet(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return LocalNet();
  };
})();
