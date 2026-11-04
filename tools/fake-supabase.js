/* =====================================================================
   SUPABASE GIẢ LẬP — PHÍA TRÌNH DUYỆT (chỉ để kiểm thử nhiều người trên một máy)
   Thay cho vendor/supabase/supabase.js khi chạy tools/fake-supabase-server.mjs.
   Cài đúng phần API supabase-js v2 mà js/net.js và js/admin.js dùng:
     createClient(url, key, { auth: { storageKey, persistSession } })
     .auth.getSession / signInAnonymously / onAuthStateChange / signOut
     .rpc(name, args)  ·  .from(t).select().eq().in().or().order().limit()  (thenable)
     .channel(name, { config: { presence: { key }, broadcast: { self, ack } } })
        .on('presence', { event: 'sync' }, cb) · .on('broadcast', { event }, cb) · .on('postgres_changes', { event, table, filter }, cb)
        .subscribe(cb(status: SUBSCRIBED | CHANNEL_ERROR | TIMED_OUT | CLOSED)) · .track / .untrack / .presenceState / .send · .state
     .removeChannel(ch) · .realtime.{ conn, connect(), isConnected(), setAuth(), disconnect() }
   Giống bản thật ở những điểm dễ sai: mất kết nối ⇒ mọi kênh nhận CHANNEL_ERROR rồi tự vào lại (SUBSCRIBED lần nữa),
   hiện diện KHÔNG tự gửi lại sau khi nối lại (máy khách phải track lại), gửi broadcast khi kênh chưa vào xong
   ⇒ bản thật chuyển sang HTTP (ở đây đếm vào thống kê 'rest_broadcast' để phát hiện).
   Khác bản thật: vận chuyển bằng Server-Sent Events + POST thay vì WebSocket; không có JWT thật / RLS thật
   (máy chủ giả mô phỏng vài luật RLS chính).
   Nhiều "người" trong cùng một trình duyệt: thêm ?nguoi=1, ?nguoi=2 … vào địa chỉ.
   ===================================================================== */
(function () {
  'use strict';
  const who = new URLSearchParams(location.search).get('nguoi') || '';

  function createClient(url, key, opts) {
    opts = opts || {};
    const base = String(url).replace(/\/+$/, '');
    const authOpt = opts.auth || {};
    const persist = authOpt.persistSession !== false;
    const storeKey = (authOpt.storageKey || 'sb-fake-auth') + (who ? ':' + who : '');
    let session = null;
    if (persist) { try { session = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (_) { } }
    const authCbs = [];

    async function post(p, body) {
      try {
        const r = await fetch(base + p, {
          method: 'POST',
          headers: { 'content-type': 'application/json', apikey: key, authorization: session ? 'Bearer ' + session.access_token : '' },
          body: JSON.stringify(body || {})
        });
        if (!r.ok) return { error: { message: 'HTTP ' + r.status, status: r.status } };
        return await r.json();
      } catch (e) { return { error: { message: 'TypeError: Failed to fetch' } }; }
    }

    const auth = {
      async getSession() { return { data: { session }, error: null }; },
      async signInAnonymously() {
        const r = await post('/auth/anon');
        if (r.error) return { data: { session: null, user: null }, error: r.error };
        session = { access_token: r.uid, refresh_token: 'x', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: r.uid, is_anonymous: true } };
        if (persist) { try { localStorage.setItem(storeKey, JSON.stringify(session)); } catch (_) { } }
        rt.setAuth(session.access_token);
        authCbs.forEach(f => { try { f('SIGNED_IN', session); } catch (_) { } });
        return { data: { session, user: session.user }, error: null };
      },
      onAuthStateChange(f) { authCbs.push(f); return { data: { subscription: { unsubscribe() { const i = authCbs.indexOf(f); if (i >= 0) authCbs.splice(i, 1); } } } }; },
      async signOut() { session = null; try { localStorage.removeItem(storeKey); } catch (_) { } return { error: null }; }
    };

    async function rpc(name, args) {
      const r = await post('/rpc/' + name, args);
      return r.error ? { data: null, error: r.error } : { data: r.data === undefined ? null : r.data, error: null };
    }

    function from(table) {
      const q = { table, filters: [], order: [], limit: null, or: null };
      const b = {
        select() { return b; },
        eq(c, v) { q.filters.push(['eq', c, v]); return b; },
        in(c, v) { q.filters.push(['in', c, v]); return b; },
        or(s) { q.or = s; return b; },
        order(c, o) { q.order.push({ col: c, asc: !(o && o.ascending === false) }); return b; },
        limit(n) { q.limit = n; return b; },
        then(res, rej) { return post('/rest', q).then(r => (r.error ? { data: null, error: r.error } : { data: r.data, error: null })).then(res, rej); }
      };
      return b;
    }

    /* ---------------- realtime ---------------- */
    const rt = {
      conn: null, accessToken: null, channels: [], cid: Math.random().toString(36).slice(2) + Date.now().toString(36),
      _tries: 0, _open: false, _timer: null,
      setAuth(t) { rt.accessToken = t; },
      isConnected() { return rt._open; },
      connectionState() { return rt._open ? 'open' : rt.conn ? 'connecting' : 'closed'; },
      connect() {
        if (rt.conn) return;
        clearTimeout(rt._timer);
        const uid = rt.accessToken || (session && session.access_token) || '';
        const es = rt.conn = new EventSource(base + '/rt?cid=' + rt.cid + '&uid=' + encodeURIComponent(uid));
        es.onopen = () => { if (rt.conn !== es) return; rt._open = true; rt._tries = 0; rt.channels.slice().forEach(c => c._rejoin()); };
        es.onmessage = e => {
          let m; try { m = JSON.parse(e.data); } catch (_) { return; }
          rt.channels.filter(c => c.topic === m.topic).forEach(c => c._recv(m));
        };
        es.onerror = () => {
          es.close();
          if (rt.conn !== es) return;
          rt.conn = null; rt._open = false;
          rt.channels.slice().forEach(c => c._error());
          rt._timer = setTimeout(() => rt.connect(), [1000, 2000, 5000, 10000][Math.min(rt._tries++, 3)]);
        };
      },
      disconnect() { if (rt.conn) { const es = rt.conn; rt.conn = null; rt._open = false; es.close(); } clearTimeout(rt._timer); }
    };

    function channel(name, chOpts) {
      const cfg = (chOpts && chOpts.config) || {};
      const ch = {
        topic: 'realtime:' + name, subTopic: name, state: 'closed', joinedOnce: false, params: chOpts || { config: {} },
        bindings: [], _cb: null, _pres: {}, _left: false,
        on(type, filter, cb) { ch.bindings.push({ type, filter: filter || {}, cb }); return ch; },
        subscribe(cb) {
          if (ch.joinedOnce) throw "tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance";
          ch.joinedOnce = true; ch._cb = cb || (() => { }); rt.channels.push(ch); ch.state = 'joining';
          if (rt._open) ch._rejoin(); else rt.connect();
          return ch;
        },
        async _rejoin() {
          if (ch._left) return;
          ch.state = 'joining';
          const pg = ch.bindings.filter(b => b.type === 'postgres_changes').map(b => b.filter);
          const r = await post('/rt', { op: 'join', cid: rt.cid, topic: ch.topic, config: { broadcast: cfg.broadcast || {}, presence: cfg.presence || {} }, pg });
          if (ch._left) return;
          if (r.error) { ch.state = 'errored'; ch._cb('CHANNEL_ERROR', new Error(r.error.message)); setTimeout(() => { if (rt._open && ch.state === 'errored') ch._rejoin(); }, 2000); return; }
          ch.state = 'joined'; ch._cb('SUBSCRIBED');
        },
        _error() { if (!ch._left && ch.state !== 'errored') { ch.state = 'errored'; ch._cb && ch._cb('CHANNEL_ERROR', new Error('mất kết nối')); } },
        _recv(m) {
          if (m.t === 'broadcast') ch.bindings.filter(b => b.type === 'broadcast' && (b.filter.event === m.event || b.filter.event === '*')).forEach(b => b.cb({ type: 'broadcast', event: m.event, payload: m.payload }));
          else if (m.t === 'presence') { ch._pres = m.state || {}; ch.bindings.filter(b => b.type === 'presence' && b.filter.event === 'sync').forEach(b => b.cb()); }
          else if (m.t === 'pg') {
            const b = ch.bindings.filter(x => x.type === 'postgres_changes')[m.idx];
            if (b) b.cb({ schema: 'public', table: m.table, eventType: m.eventType, commit_timestamp: new Date().toISOString(), new: m.new || {}, old: m.old || {}, errors: null });
          }
        },
        presenceState() { return ch._pres; },
        async track(meta) {
          if (!ch.joinedOnce) throw "tried to push 'presence' to '" + ch.topic + "' before joining. Use channel.subscribe() before pushing events";
          if (ch.state !== 'joined') return 'timed out';
          const r = await post('/rt', { op: 'track', cid: rt.cid, topic: ch.topic, payload: meta });
          return r.error ? 'error' : 'ok';
        },
        async untrack() {
          if (ch.state !== 'joined') return 'ok';
          const r = await post('/rt', { op: 'untrack', cid: rt.cid, topic: ch.topic });
          return r.error ? 'error' : 'ok';
        },
        async send(msg) {
          if (!msg || msg.type !== 'broadcast') return 'error';
          /* bản thật: chưa vào kênh ⇒ gửi qua HTTP /api/broadcast (tốn một lượt HTTP mỗi gói) */
          const rest = !(ch.state === 'joined' && rt._open);
          const r = await post('/rt', { op: 'broadcast', cid: rt.cid, topic: ch.topic, event: msg.event, payload: msg.payload, rest });
          return r.error ? 'error' : 'ok';
        },
        async unsubscribe() {
          ch._left = true; ch.state = 'leaving';
          if (rt._open) await post('/rt', { op: 'leave', cid: rt.cid, topic: ch.topic });
          ch.state = 'closed'; rt.channels = rt.channels.filter(c => c !== ch);
          ch._cb && ch._cb('CLOSED');
          return 'ok';
        }
      };
      return ch;
    }

    return {
      auth, rpc, from, channel, realtime: rt,
      getChannels: () => rt.channels.slice(),
      removeChannel: ch => ch.unsubscribe(),
      removeAllChannels: () => Promise.all(rt.channels.slice().map(c => c.unsubscribe()))
    };
  }

  window.supabase = { createClient, __fake: true };
})();
