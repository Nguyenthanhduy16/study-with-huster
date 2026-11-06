/* =====================================================================
   SERVER REALTIME — Học Online Cùng Huster (chạy trên Railway)
   Thay phần Realtime của Supabase cho các tin nhiều nhất: vị trí, cử chỉ, đàn piano (kênh khu "zone-…")
   và danh sách ai đang online (kênh "presence-global"). Đăng nhập, dữ liệu, tin nhắn vẫn ở Supabase.

   Giao thức (JSON qua WebSocket):
     máy khách → server
       { t:'auth', token }                 vé đăng nhập Supabase (phải gửi đầu tiên, trong 10 s)
       { t:'join', ch } / { t:'leave', ch }
       { t:'bc', ch, ev, p }               phát cho người khác cùng kênh (server gắn p.u = mã người dùng thật)
       { t:'track', ch, p } / { t:'untrack', ch }   hiện diện của mình trong kênh
     server → máy khách
       { t:'ready', uid } · { t:'joined', ch } · { t:'err', m }
       { t:'bc', ch, ev, p }
       { t:'pstate', ch, s:{ key:{u,m} } } · { t:'pset', ch, k, u, m } · { t:'pdel', ch, k }

   Biến môi trường (Railway → Variables):
     SUPABASE_URL, SUPABASE_ANON_KEY   địa chỉ + khoá CÔNG KHAI (như config.js) — dùng để kiểm tra vé đăng nhập
     ALLOWED_ORIGINS                    các trang được kết nối, cách nhau dấu phẩy; cho phép "https://*.pages.dev"
     PORT                               Railway tự đặt
     MAX_CONNECTIONS                    mặc định 3000
   ===================================================================== */
import http from 'node:http';
import { WebSocketServer } from 'ws';

const env = process.env;
const PORT = +(env.PORT || 8080);
const SUPABASE_URL = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = String(env.SUPABASE_ANON_KEY || '').trim();
const ALLOWED = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
const MAX_CONNECTIONS = +(env.MAX_CONNECTIONS || 3000);
const MAX_PER_USER = 6;               // cùng một người mở nhiều tab
const MAX_CHANNELS = 4;
const MAX_MSG = 16 * 1024;
const RATE = 40, BURST = 120;          // tin/giây mỗi kết nối (đàn piano ≤ 25 gói/giây)
const TRACK_GAP = 500;                 // gộp cập nhật hiện diện tối đa 2 lần/giây
const CHANNEL_RE = /^(presence-global|zone-[a-z0-9_]{1,32})$/;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) console.warn('[rt] Thiếu SUPABASE_URL / SUPABASE_ANON_KEY — không kiểm tra được đăng nhập, mọi kết nối sẽ bị từ chối.');
if (!ALLOWED.length) console.warn('[rt] ALLOWED_ORIGINS trống — trang nào cũng kết nối được (chỉ nên dùng khi thử).');

/* ---------- kiểm tra vé đăng nhập bằng chính Supabase (không cần khoá bí mật) ---------- */
const tokenCache = new Map();          // vé → { uid, until }
async function verify(token) {
  if (typeof token !== 'string' || !token || token.length > 4096) return null;
  const c = tokenCache.get(token);
  if (c && c.until > Date.now()) return c.uid;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_ANON_KEY, authorization: 'Bearer ' + token }, signal: ctl.signal });
    if (r.status === 401 || r.status === 403) return null;
    if (!r.ok) throw new Error('auth ' + r.status);
    const u = await r.json();
    if (!u || typeof u.id !== 'string') return null;
    if (tokenCache.size > 20000) tokenCache.clear();
    tokenCache.set(token, { uid: u.id, until: Date.now() + 5 * 60e3 });
    return u.id;
  } finally { clearTimeout(to); }
}

function originOk(origin) {
  if (!ALLOWED.length) return true;
  if (!origin) return false;
  return ALLOWED.some(a => {
    if (a === origin) return true;
    const m = /^(https?:\/\/)\*\.(.+)$/.exec(a);          // https://*.pages.dev
    return !!m && origin.startsWith(m[1]) && origin.endsWith('.' + m[2]);
  });
}

/* ---------- trạng thái ---------- */
let seq = 0;
const channels = new Map();            // tên kênh → Set(kết nối)
const presence = new Map();            // tên kênh → Map(khoá kết nối → { u, m })
const byUser = new Map();              // uid → số kết nối
const stats = { conns: 0, msgsIn: 0, msgsOut: 0, dropped: 0, started: Date.now() };

const send = (c, s) => { if (c.ws.readyState === 1) { c.ws.send(s); stats.msgsOut++; } };
function fanout(ch, obj, except) {
  const set = channels.get(ch); if (!set) return;
  const s = JSON.stringify(obj);
  for (const c of set) if (c !== except) send(c, s);
}
function join(c, ch) {
  if (c.chans.has(ch)) { send(c, JSON.stringify({ t: 'joined', ch })); return; }
  if (c.chans.size >= MAX_CHANNELS) return send(c, JSON.stringify({ t: 'err', m: 'quá nhiều kênh' }));
  c.chans.add(ch);
  if (!channels.has(ch)) channels.set(ch, new Set());
  channels.get(ch).add(c);
  send(c, JSON.stringify({ t: 'joined', ch }));
  const ps = presence.get(ch);
  if (ch === 'presence-global') send(c, JSON.stringify({ t: 'pstate', ch, s: ps ? Object.fromEntries(ps) : {} }));
}
function untrack(c, ch) {
  const ps = presence.get(ch); if (!ps || !ps.has(c.key)) return;
  ps.delete(c.key); if (!ps.size) presence.delete(ch);
  const p = c.pending.get(ch); if (p) { clearTimeout(p.timer); c.pending.delete(ch); }
  fanout(ch, { t: 'pdel', ch, k: c.key });
}
function leave(c, ch) {
  if (!c.chans.delete(ch)) return;
  untrack(c, ch);
  const set = channels.get(ch); if (set) { set.delete(c); if (!set.size) channels.delete(ch); }
}
function track(c, ch, meta) {
  if (!c.chans.has(ch) || !meta || typeof meta !== 'object' || Array.isArray(meta)) return;
  const flush = () => {
    const p = c.pending.get(ch); if (!p) return;
    c.pending.delete(ch); c.lastTrack = Date.now();
    if (!presence.has(ch)) presence.set(ch, new Map());
    presence.get(ch).set(c.key, { u: c.uid, m: p.meta });
    fanout(ch, { t: 'pset', ch, k: c.key, u: c.uid, m: p.meta });
  };
  const p = c.pending.get(ch);
  if (p) { p.meta = meta; return; }                         // đã hẹn gửi: chỉ thay nội dung
  const wait = (c.lastTrack || 0) + TRACK_GAP - Date.now();
  c.pending.set(ch, { meta, timer: wait > 0 ? setTimeout(flush, wait) : null });
  if (wait <= 0) flush();
}

function onMessage(c, raw) {
  stats.msgsIn++;
  // giới hạn tốc độ (xô token)
  const now = Date.now();
  c.tokens = Math.min(BURST, c.tokens + (now - c.refill) / 1000 * RATE); c.refill = now;
  if (c.tokens < 1) { stats.dropped++; if (++c.strikes > 400) c.ws.close(1008, 'quá nhiều tin'); return; }
  c.tokens--;
  if (raw.length > MAX_MSG) { stats.dropped++; return; }
  let m; try { m = JSON.parse(raw); } catch (_) { return; }
  if (!m || typeof m !== 'object') return;
  if (!c.uid) {
    if (m.t !== 'auth' || c.authing) return;
    c.authing = true;
    verify(m.token).then(uid => {
      c.authing = false;
      if (c.closed) return;
      if (!uid) { send(c, JSON.stringify({ t: 'err', m: 'auth' })); return c.ws.close(4001, 'auth'); }
      const n = byUser.get(uid) || 0;
      if (n >= MAX_PER_USER) { send(c, JSON.stringify({ t: 'err', m: 'quá nhiều tab' })); return c.ws.close(4003, 'too many tabs'); }
      byUser.set(uid, n + 1); c.uid = uid; clearTimeout(c.authTimer);
      send(c, JSON.stringify({ t: 'ready', uid }));
    }, e => { c.authing = false; console.warn('[rt] không kiểm tra được đăng nhập:', e.message); if (!c.closed) c.ws.close(1011, 'auth unavailable'); });
    return;
  }
  const ch = typeof m.ch === 'string' && CHANNEL_RE.test(m.ch) ? m.ch : null;
  if (!ch) return;
  switch (m.t) {
    case 'join': return join(c, ch);
    case 'leave': return leave(c, ch);
    case 'bc':
      if (!c.chans.has(ch) || ch === 'presence-global' || typeof m.ev !== 'string' || m.ev.length > 16 || !m.p || typeof m.p !== 'object' || Array.isArray(m.p)) return;
      m.p.u = c.uid;                                         // chống giả mạo người gửi
      return fanout(ch, { t: 'bc', ch, ev: m.ev, p: m.p }, c);
    case 'track': return track(c, ch, m.p);
    case 'untrack': return untrack(c, ch);
  }
}

/* ---------- HTTP (kiểm tra sức khoẻ cho Railway) + WebSocket ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (req.url === '/stats') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ conns: stats.conns, users: byUser.size, channels: channels.size, online: (presence.get('presence-global') || new Map()).size, msgsIn: stats.msgsIn, msgsOut: stats.msgsOut, dropped: stats.dropped, uptimeS: Math.round((Date.now() - stats.started) / 1000) }));
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Học Online Cùng Huster — realtime server');
});
const wss = new WebSocketServer({ server, maxPayload: MAX_MSG * 2, perMessageDeflate: false });
wss.on('connection', (ws, req) => {
  if (!originOk(req.headers.origin)) return ws.close(4002, 'origin');
  if (stats.conns >= MAX_CONNECTIONS) return ws.close(1013, 'busy');
  const c = { ws, key: 'c' + (++seq).toString(36), uid: null, chans: new Set(), pending: new Map(), tokens: BURST, refill: Date.now(), strikes: 0, closed: false, authing: false, lastTrack: 0 };
  stats.conns++;
  c.authTimer = setTimeout(() => { if (!c.uid) ws.close(4001, 'auth timeout'); }, 10000);
  ws.on('pong', () => { ws._dead = false; });
  ws.on('message', (data, isBinary) => { if (!isBinary) onMessage(c, data.toString()); });
  ws.on('close', () => {
    c.closed = true; stats.conns--; clearTimeout(c.authTimer);
    for (const ch of [...c.chans]) leave(c, ch);
    if (c.uid) { const n = (byUser.get(c.uid) || 1) - 1; if (n > 0) byUser.set(c.uid, n); else byUser.delete(c.uid); }
  });
  ws.on('error', () => { });
});
// nhịp kiểm tra kết nối chết (mạng di động rớt mà không báo đóng): không trả lời ping trong 25 s ⇒ cắt
const beat = setInterval(() => { for (const ws of wss.clients) { if (ws._dead) { ws.terminate(); continue; } ws._dead = true; ws.ping(); } }, 25000);
wss.on('close', () => clearInterval(beat));

server.listen(PORT, () => console.log(`[rt] realtime server tại cổng ${PORT}`));
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { for (const ws of wss.clients) ws.close(1012, 'restart'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); });
