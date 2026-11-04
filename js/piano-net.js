/* =====================================================================
   [piano-net] ĐÀN PIANO QUA MẠNG — người khác ở tầng 6–7 nghe bạn chơi đàn
   - Gửi: scene/hust3d.js gọi window.__PIANO_NET.out({t:'d'|'u'|'p', m, v, on}) mỗi khi
     bạn nhấn / nhả phím hoặc pedal. Ở đây gom lại mỗi ~50 ms thành MỘT gói broadcast
     'pno' trên kênh của khu (zone-lib_b):
        { u, s: số thứ tự, t: mốc giờ (ms, đồng hồ máy gửi), e: [[dtMs, 'd'|'u'|'p', midi|pedal(0/1), vel 0–127], …] }
     Giới hạn: ≤ 25 gói/giây (cách nhau ≥ 40 ms), ≤ 64 nốt/gói, hàng đợi ≤ 512 (đầy thì bỏ
     nốt nhấn cũ, giữ nốt nhả để không treo). Không ai khác ở tầng 6–7 thì không gửi gì.
   - Nhận: đệm rung ~120 ms rồi phát lại đúng nhịp tương đối của người chơi, qua
     api.pianoRemote(ev) của tầng 6–7 (scene/hust3d.js) — bus âm lượng riêng.
   - Âm lượng: chỉ khi bật "Âm thanh" và mức "🎹 Tiếng đàn của bạn khác" > 0 (js/audio.js);
     nghe rõ trong ~4 m quanh đàn, nhỏ dần tới 0 ở ~25 m; đứng ở tầng 7 thì × 0,35.
   Phần lõi (createSender / createReceiver) không phụ thuộc trình duyệt để kiểm thử bằng Node.
   ===================================================================== */
(function (root) {
  'use strict';
  const perfNow = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());

  /* ---------- gửi: gom gói + giới hạn tốc độ ---------- */
  function createSender(o) {
    const BATCH = o.batchMs || 50, GAP = o.minGapMs || 40, MAXE = o.maxEvents || 64, MAXQ = o.maxQueue || 512;
    const now = o.now || perfNow, later = o.setTimeout || setTimeout;
    let q = [], seq = 0, timer = null, last = -1e9;
    const stats = { msgs: 0, events: 0, dropped: 0 };
    function schedule() {
      if (timer || !q.length) return;
      const due = Math.max(q[0][0] + BATCH, last + GAP);
      timer = later(flush, Math.max(0, due - now()));
    }
    function flush() {
      timer = null; if (!q.length) return;
      const t = now(); if (t < last + GAP) { schedule(); return; }
      const part = q.splice(0, MAXE), base = part[0][0];
      const msg = { s: ++seq, t: Math.round(base), e: part.map(x => [Math.min(60000, Math.round(x[0] - base)), x[1], x[2], x[3]]) };
      last = t; stats.msgs++; stats.events += part.length;
      try { o.send(msg); } catch (_) { }
      if (q.length) schedule();
    }
    function push(e) {
      if (!e || (e.t !== 'd' && e.t !== 'u' && e.t !== 'p')) return;
      if (o.shouldSend && !o.shouldSend()) { q.length = 0; return; }
      if (q.length >= MAXQ) {
        if (e.t === 'd') { stats.dropped++; return; }
        const i = q.findIndex(x => x[1] === 'd'); if (i < 0) { stats.dropped++; return; }
        q.splice(i, 1); stats.dropped++;
      }
      const a = e.t === 'p' ? (e.on ? 1 : 0) : (e.m | 0);
      const v = e.t === 'd' ? Math.max(1, Math.min(127, Math.round((e.v == null ? 0.78 : +e.v) * 127))) : 0;
      q.push([now(), e.t, a, v]);
      schedule();
    }
    return { push, flush, stats, get queued() { return q.length; } };
  }

  /* ---------- nhận: đệm rung + phát lại theo nhịp ---------- */
  function createReceiver(o) {
    const J = o.jitterMs == null ? 120 : o.jitterMs, now = o.now || perfNow, later = o.setTimeout || setTimeout;
    const peers = new Map();
    function track(s, ev) {
      if (ev.t === 'd') s.held.add(ev.m); else if (ev.t === 'u') s.held.delete(ev.m); else s.ped = ev.on;
    }
    function onMsg(p) {
      if (!p || typeof p !== 'object' || !Array.isArray(p.e) || !isFinite(p.t)) return 0;
      if (o.selfId && p.u === o.selfId()) return 0;
      const t = now(); let s = peers.get(p.u);
      if (!s) { s = { held: new Set(), ped: false, off: null, seq: 0, at: t }; peers.set(p.u, s); }
      if (t - s.at > 3000) { s.off = null; s.seq = 0; }               // lâu không nghe: đo lại độ trễ
      if (typeof p.s === 'number') { if (p.s <= s.seq && s.seq - p.s < 1000) return 0; s.seq = p.s; }  // gói trùng / đến muộn
      s.at = t;
      const est = t - p.t;                                             // độ lệch đồng hồ + trễ mạng
      if (s.off == null || est < s.off) s.off = est; else s.off += (est - s.off) * 0.02;
      let n = 0;
      for (const x of p.e.slice(0, 64)) {
        if (!Array.isArray(x)) continue;
        const ty = x[1]; if (ty !== 'd' && ty !== 'u' && ty !== 'p') continue;
        const dt = Math.max(0, Math.min(2000, +x[0] || 0)), a = x[2] | 0;
        const ev = ty === 'p' ? { t: 'p', on: !!a } : { t: ty, m: a, v: Math.max(0, Math.min(127, x[3] | 0)) / 127 };
        const delay = Math.max(0, Math.min(1500, p.t + dt + s.off + J - t));
        later(() => { track(s, ev); o.play(ev, p.u); }, delay); n++;
      }
      return n;
    }
    /* người chơi im quá lâu (rời đàn, rớt mạng): nhả hết phím + pedal của họ */
    function tick(idleMs = 8000) {
      const t = now();
      for (const [u, s] of peers) if (t - s.at > idleMs) {
        for (const m of s.held) o.play({ t: 'u', m }, u);
        if (s.ped) o.play({ t: 'p', on: false }, u);
        peers.delete(u);
      }
    }
    function reset() { peers.clear(); }
    return { onMsg, tick, reset, peers };
  }

  /* ---------- nối vào trò chơi (gọi một lần từ js/app.js) ---------- */
  function init(cfg) {
    const { net, World, Sound } = cfg;
    const api = () => { try { return cfg.getApi(); } catch (_) { return null; } };
    let lastRemote = -1e9, toasted = false;
    function gain() {
      if (!Sound || !Sound.enabled) return 0;
      const v = Sound.vol && Sound.vol.pianoNet, vol = v == null ? 1 : +v; if (!(vol > 0)) return 0;
      const me = World.me, a = api(); if (!me || me.zone !== 'lib_b' || !a || !a.PIANO) return 0;
      const P = a.PIANO.position, d = Math.hypot(me.x - P.x, me.z - P.z);
      let k = d <= 4 ? 1 : d >= 25 ? 0 : 1 - (d - 4) / 21; k *= k;
      if (me.y > (a.MZ || 5.25) / 2) k *= 0.35;                       // đàn ở tầng 6, mình ở tầng 7
      return k * vol;
    }
    function maybeToast(u) {
      if (toasted || !cfg.toast) return; toasted = true;
      const nm = (cfg.nameOf && cfg.nameOf(u)) || 'Một bạn';
      cfg.toast('🎵 ' + nm + ' đang chơi đàn ở tầng 6' + (Sound && !Sound.enabled ? ' — bật 🔊 Âm thanh để nghe' : ''));
    }
    const rx = createReceiver({
      selfId: () => net.me && net.me.id,
      play(ev, u) {
        const a = api(); if (!a || !a.pianoRemote || World.me.zone !== 'lib_b') return;
        ev.g = gain(); a.pianoRemote(ev); lastRemote = perfNow();
        if (ev.t === 'd' && Sound && Sound.vol && Sound.vol.pianoNet !== 0) maybeToast(u);
      }
    });
    const tx = createSender({
      send: b => net.sendPiano && net.sendPiano(b),
      shouldSend: () => net.mode !== 'offline' && World.me && World.me.zone === 'lib_b' && (!World.peopleHere || World.peopleHere().length > 0)
    });
    net.ev.on('piano', p => rx.onMsg(p));
    root.__PIANO_NET = { out: e => tx.push(e), tx, rx, gain };
    setInterval(() => {
      rx.tick();
      if (perfNow() - lastRemote < 15000) { const a = api(); if (a && a.pianoRemoteGain) a.pianoRemoteGain(gain()); }  // đi xa / tắt tiếng khi nốt còn ngân
    }, 250);
    if (World.ev) World.ev.on('zone-changed', z => {
      toasted = false;
      if (z !== 'lib_b') { rx.reset(); const a = api(); if (a && a.pianoRemoteReset) a.pianoRemoteReset(); }
    });
  }

  const PianoNet = { init, createSender, createReceiver };
  root.PianoNet = PianoNet;
  if (typeof module !== 'undefined' && module.exports) module.exports = PianoNet;
})(typeof window !== 'undefined' ? window : globalThis);
