#!/usr/bin/env node
/* =====================================================================
   MÁY CHỦ SUPABASE GIẢ LẬP + MÁY CHỦ WEB TĨNH (chỉ để kiểm thử, không dùng thật)
   Chạy:  node tools/fake-supabase-server.mjs [--port=8741] [--root=.] [--admin=admin-thu] [--csp] [--offline]
          --csp     : gửi kèm Content-Security-Policy lấy từ netlify.toml (kiểm tra CSP không chặn gì)
          --offline : không thay config.js / supabase.js ⇒ chạy đúng chế độ ngoại tuyến như khi chưa điền Supabase
   Rồi mở  http://localhost:8741/?nguoi=1  và  http://localhost:8741/?nguoi=2  (hai "người" khác nhau)
   hoặc mở trên hai trình duyệt / hai máy trong cùng mạng LAN.

   - Phục vụ toàn bộ thư mục dự án như hosting tĩnh, NHƯNG:
       /config.js                    → config.js thật, chỉ thay SUPABASE_URL = <địa chỉ này>/fake
       /vendor/supabase/supabase.js  → tools/fake-supabase.js (thay supabase-js)
   - /fake/...  : đăng nhập ẩn danh, RPC (các hàm chính trong supabase/schema.sql, rút gọn),
                  đọc bảng (có mô phỏng RLS chính), Realtime (presence / broadcast / postgres_changes)
                  qua Server-Sent Events.
   - /fake/ctl  : điều khiển cho bài kiểm thử: {op:'stats'} · {op:'reset-stats'} ·
                  {op:'kill', uid, blockMs} (cắt kết nối realtime của một người, chặn nối lại blockMs ms)
   Dữ liệu chỉ nằm trong bộ nhớ; tắt máy chủ là mất.
   ===================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(args.port || 8741);
const ROOT = path.resolve(args.root || path.join(HERE, '..'));
const ADMIN_PW = args.admin || 'admin-thu';
const SHIM = path.join(HERE, 'fake-supabase.js');
/* --csp: gửi kèm Content-Security-Policy y như netlify.toml để kiểm tra CSP không chặn gì */
let CSP = null;
if (args.csp) { const m = /Content-Security-Policy\s*=\s*"([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8')); CSP = m && m[1]; }
const htmlHeaders = () => (CSP ? { 'content-security-policy': CSP } : {});

/* ---------- cấu hình mặc định lấy từ config.js ---------- */
const cfgCtx = { window: {}, location: { origin: '' } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'), cfgCtx);
let SETTINGS = JSON.parse(JSON.stringify(cfgCtx.window.DEFAULT_SETTINGS || {}));

/* ---------- dữ liệu trong bộ nhớ ---------- */
const db = { profiles: new Map(), public_profiles: new Map(), messages: [], cheers: [], events: [], notices: [], qa_questions: [], qa_answers: [], feedback: [] };
let seq = 1;
const nowIso = () => new Date().toISOString();
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const stats = { delivered: {}, received: {}, rest_broadcast: 0, http: 0 };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

/* ---------- realtime ---------- */
const clients = new Map();      // cid → { cid, uid, res, topics: Map(topic → { cfg, pg }) }
const presence = new Map();     // topic → Map(cid → { key, meta, ref })
const blocked = new Map();      // cid → đến lúc nào

function sse(c, msg, kind) {
  if (!c.res) return;
  c.res.write('data: ' + JSON.stringify(msg) + '\n\n');
  bump(stats.delivered, kind || msg.t);
}
function members(topic) { return [...clients.values()].filter(c => c.res && c.topics.has(topic)); }
function presenceState(topic) {
  const st = {}, m = presence.get(topic);
  if (m) for (const p of m.values()) (st[p.key] = st[p.key] || []).push(Object.assign({}, p.meta, { presence_ref: p.ref }));
  return st;
}
function pushPresence(topic) { const st = presenceState(topic); for (const c of members(topic)) sse(c, { t: 'presence', topic, state: st }, 'presence'); }
function dropClient(c) {
  for (const topic of c.topics.keys()) { const m = presence.get(topic); if (m && m.delete(c.cid)) pushPresence(topic); }
  c.topics.clear();
}
/* postgres_changes kèm mô phỏng RLS */
function rlsOk(table, row, uid) {
  if (!uid) return table === 'app_settings';
  if (table === 'messages' || table === 'qa_questions' || table === 'qa_answers') return !row.hidden;
  if (table === 'cheers') return row.to_uid === uid || row.from_uid === uid;
  return true;
}
function matchFilter(f, row) {
  if (!f) return true;
  const m = /^(\w+)=eq\.(.*)$/.exec(f); if (!m) return true;
  return String(row[m[1]]) === m[2];
}
function notify(table, eventType, row) {
  for (const c of clients.values()) {
    if (!c.res) continue;
    for (const [topic, t] of c.topics) {
      t.pg.forEach((b, idx) => {
        if (b.table !== table || (b.event !== '*' && b.event !== eventType)) return;
        if (!matchFilter(b.filter, row) || !rlsOk(table, row, c.uid)) return;
        sse(c, { t: 'pg', topic, idx, table, eventType, new: row }, 'pg:' + table);
      });
    }
  }
}

/* ---------- hồ sơ ---------- */
function pubOf(p) {
  return { id: p.id, display_name: p.full_name, mssv_masked: p.mssv.slice(0, 4) + '*'.repeat(Math.max(0, p.mssv.length - 4)), style: p.style || {}, hidden: !!(p.hidden || p.blocked),
    hide_rank: !!p.hide_rank, hide_status: !!p.hide_status, pending_name: false, kicked_at: p.kicked_at || null, updated_at: nowIso() };
}
function syncPub(p) {
  const had = db.public_profiles.has(p.id), np = pubOf(p);
  db.public_profiles.set(p.id, np); notify('public_profiles', had ? 'UPDATE' : 'INSERT', np);
}
function dayStats(p, d = today()) { return (p.stats[d] = p.stats[d] || { seconds: 0, stars: 0, correct: 0, answered: 0 }); }
function myProfile(uid) {
  const p = db.profiles.get(uid); if (!p) return null;
  const tot = Object.values(p.stats).reduce((a, x) => ({ seconds: a.seconds + x.seconds, stars: a.stars + x.stars, correct: a.correct + x.correct, answered: a.answered + x.answered }), { seconds: 0, stars: 0, correct: 0, answered: 0 });
  return { id: p.id, full_name: p.full_name, mssv: p.mssv, display_name: p.full_name, pending_name: false, quiz: p.quiz, style: p.style, hide_rank: p.hide_rank, hide_status: p.hide_status,
    today: Object.assign({}, dayStats(p)), total: tot, streak: 0, wallet: tot.stars, spent: 0, volunteer: 0, volunteer_today: 0, mango_total: 0, mango_today: false, cup: null };
}

/* ---------- RPC ---------- */
const NEED_PROFILE = { ok: false, error: 'Chưa có hồ sơ' };
const RPC = {
  server_now: () => nowIso(),
  get_config: () => ({ settings: SETTINGS, banned: [], now: nowIso() }),
  check_identity: () => ({ ok: true }),
  my_profile: (a, uid) => myProfile(uid),
  register_profile(a, uid) {
    if (!uid) throw new Error('Chưa đăng nhập');
    if (!/^202[1-6]\d{4,5}$/.test(a.p_mssv || '')) return { ok: false, field: 'mssv', error: 'MSSV không hợp lệ' };
    const p = db.profiles.get(uid) || { id: uid, stats: {}, created_at: nowIso() };
    Object.assign(p, { full_name: a.p_name, mssv: a.p_mssv, quiz: !!a.p_quiz, style: a.p_style || {}, hide_rank: !!a.p_hide_rank, hide_status: !!a.p_hide_status });
    db.profiles.set(uid, p); syncPub(p);
    return { ok: true, profile: myProfile(uid) };
  },
  update_prefs(a, uid) { const p = db.profiles.get(uid); if (!p) return null; Object.assign(p, { style: a.p_style, hide_rank: !!a.p_hide_rank, hide_status: !!a.p_hide_status }); syncPub(p); return myProfile(uid); },
  start_session(a, uid) { const p = db.profiles.get(uid); if (!p) return NEED_PROFILE; Object.assign(p, { zone: a.p_zone, last_hb: Date.now(), hb_state: 'nghi' }); return { ok: true, profile: myProfile(uid), now: nowIso() }; },
  heartbeat(a, uid) {
    const p = db.profiles.get(uid); if (!p) return { ok: false };
    const gap = (Date.now() - (p.last_hb || Date.now())) / 1000; let add = 0;
    if (['hoc', 'tap_trung', 'quiz'].includes(p.hb_state) && gap > 0 && gap <= 120) add = Math.round(Math.min(gap, 90));
    dayStats(p).seconds += add; Object.assign(p, { last_hb: Date.now(), hb_state: a.p_state, zone: a.p_zone });
    return { ok: true, added: add, profile: myProfile(uid) };
  },
  get_round: () => ({ enabled: false }),
  submit_answer: () => ({ ok: false, error: 'Máy chủ giả lập không có câu hỏi chung.' }),
  get_round_result: () => ({ ok: false, error: 'Không có' }),
  leaderboard(a, uid) {
    const rows = [...db.profiles.values()].filter(p => !p.hide_rank).map(p => ({ id: p.id, name: p.full_name, v: a.p_metric === 'stars' ? dayStats(p).stars : dayStats(p).seconds }))
      .filter(r => r.v > 0).sort((x, y) => y.v - x.v).map((r, i) => Object.assign(r, { rank: i + 1 }));
    return { rows: rows.slice(0, 50), me: rows.find(r => r.id === uid) || null };
  },
  global_stats: () => ({ seconds_today: [...db.profiles.values()].reduce((s, p) => s + dayStats(p).seconds, 0), answers_today: 0, learners_today: db.profiles.size }),
  profile_card(a) {
    const p = db.profiles.get(a.p_uid); if (!p) return null;
    const pr = myProfile(p.id);
    return { id: p.id, name: p.full_name, mssv: pubOf(p).mssv_masked, style: p.style, today_seconds: pr.today.seconds, today_stars: pr.today.stars, total_seconds: pr.total.seconds,
      total_stars: pr.total.stars, total_correct: pr.total.correct, streak: 0, state: p.hb_state, zone: p.zone };
  },
  send_message(a, uid) {
    const p = db.profiles.get(uid); if (!p) return NEED_PROFILE;
    const t = String(a.p_text || '').trim().replace(/\s+/g, ' ');
    if (!t) return { ok: false, error: 'Tin nhắn trống.' };
    const cd = (SETTINGS.chat && SETTINGS.chat.cooldown_sec) || 10;
    if (p.last_msg_at && Date.now() - p.last_msg_at < cd * 1000) return { ok: false, error: 'Chậm lại một chút nhé (mỗi ' + cd + ' giây một tin).' };
    p.last_msg_at = Date.now();
    const near = a.p_near ? { x: Math.round(a.p_near.x * 10) / 10, y: Math.round(a.p_near.y * 10) / 10, z: Math.round(a.p_near.z * 10) / 10 } : null;
    const m = { id: seq++, uid, zone: String(a.p_zone).slice(0, 20), text: t, target: a.p_target || null, near, hidden: false, created_at: nowIso() };
    db.messages.push(m); notify('messages', 'INSERT', m);
    return { ok: true, id: m.id };
  },
  send_cheer(a, uid) { return addCheer(uid, a.p_to, (SETTINGS.cheers || [])[a.p_idx], 'cheer'); },
  send_dm(a, uid) { return addCheer(uid, a.p_to, (SETTINGS.dm_templates || [])[a.p_idx], 'dm'); },
  buy_item: (a, uid) => ({ ok: true, profile: myProfile(uid) }),
  pick_trash: () => ({ ok: true, total: 1, today: 1 }),
  claim_mango: () => ({ ok: true, total: 1 }),
  send_feedback(a, uid) { db.feedback.push({ id: seq++, uid, kind: a.p_kind, body: a.p_body, created_at: nowIso() }); return { ok: true }; },
  qa_ask(a, uid) { const q = { id: seq++, uid, subject: a.p_subject, title: a.p_title, body: a.p_body, answers_count: 0, pinned: false, hidden: false, reports: 0, created_at: nowIso() }; db.qa_questions.push(q); return { ok: true, id: q.id }; },
  qa_reply(a, uid) { const q = db.qa_questions.find(x => x.id === a.p_qid); if (!q) return { ok: false, error: 'Không có câu hỏi' }; db.qa_answers.push({ id: seq++, qid: q.id, uid, body: a.p_body, hidden: false, created_at: nowIso() }); q.answers_count++; return { ok: true }; },
  qa_report: () => ({ ok: true }),
  /* quản trị (rút gọn) */
  admin_login: a => adminOk(a) || { ok: true },
  admin_overview: a => adminOk(a) || { ok: true, online: clients.size, by_zone: {}, by_state: {}, users_total: db.profiles.size, users_today: db.profiles.size, pending_names: 0, seconds_today: 0, seconds_total: 0,
    answered_today: 0, correct_today: 0, messages_today: db.messages.length, qa_open: db.qa_questions.length, feedback_new: db.feedback.length, reported: 0, by_day: [], questions: 0, questions_active: 0 },
  admin_users: a => adminOk(a) || { ok: true, rows: [...db.profiles.values()].map(p => ({ id: p.id, full_name: p.full_name, display_name: p.full_name, mssv: p.mssv, name_ok: true, quiz: p.quiz, online: true, seconds: 0, seconds_today: 0, stars: 0, correct: 0, answered: 0, same_mssv: 1 })) },
  admin_user_action(a) {
    const d = adminOk(a); if (d) return d;
    const p = db.profiles.get(a.p_uid); if (!p) return { ok: false, error: 'Không có người này' };
    if (a.p_action === 'kick') p.kicked_at = nowIso();
    else if (a.p_action === 'hide') p.hidden = true; else if (a.p_action === 'unhide') p.hidden = false;
    syncPub(p); return { ok: true };
  },
  admin_set_settings(a) {
    const d = adminOk(a); if (d) return d;
    for (const k in a.p_patch) SETTINGS[k] = (a.p_patch[k] && typeof a.p_patch[k] === 'object' && !Array.isArray(a.p_patch[k])) ? Object.assign({}, SETTINGS[k], a.p_patch[k]) : a.p_patch[k];
    notify('app_settings', 'UPDATE', { id: 1, data: SETTINGS, updated_at: nowIso() });
    return { ok: true, settings: SETTINGS };
  },
  admin_notice(a) { const d = adminOk(a); if (d) return d; const n = { id: seq++, text: a.p_text, created_at: nowIso(), expires_at: new Date(Date.now() + (a.p_minutes || 30) * 60e3).toISOString() }; db.notices.push(n); notify('notices', 'INSERT', n); return { ok: true }; },
  admin_moderate(a) {
    const d = adminOk(a); if (d) return d;
    if (a.p_kind === 'message') {
      const m = db.messages.find(x => x.id === a.p_id); if (!m) return { ok: false, error: 'Không có tin' };
      const was = m.hidden; m.hidden = a.p_action === 'hide';
      notify('messages', 'UPDATE', m);                        // RLS chặn bản đã ẩn — giống Supabase thật
      if (m.hidden && !was) { const e = { id: seq++, kind: 'hide_msg', uid: null, text: String(m.id), created_at: nowIso() }; db.events.push(e); notify('events', 'INSERT', e); }   // trigger trg_msg_hidden_event
    }
    return { ok: true };
  },
  admin_content: a => adminOk(a) || { ok: true, rows: a.p_kind === 'messages' ? db.messages.slice(-100).reverse() : [] },
  admin_questions: a => adminOk(a) || { ok: true, rows: [], rounds: [] }
};
function adminOk(a) { return a && a.pw === ADMIN_PW ? null : { ok: false, error: 'Sai mật khẩu quản trị (sai nhiều lần sẽ bị khoá 5 phút).' }; }
function addCheer(from, to, text, kind) {
  if (!db.profiles.get(from)) return NEED_PROFILE;
  if (!text || to === from || !db.profiles.get(to)) return { ok: false, error: 'Không gửi được.' };
  const c = { id: seq++, from_uid: from, to_uid: to, text, kind, created_at: nowIso() };
  db.cheers.push(c); notify('cheers', 'INSERT', c); return { ok: true };
}

/* ---------- đọc bảng (PostgREST rút gọn) ---------- */
function rest(q, uid) {
  const src = { public_profiles: [...db.public_profiles.values()], messages: db.messages, cheers: db.cheers, qa_questions: db.qa_questions, qa_answers: db.qa_answers,
    notices: db.notices.filter(n => n.expires_at > nowIso()), events: db.events }[q.table];
  if (!src) return { error: { message: 'relation "' + q.table + '" does not exist' } };
  let rows = src.filter(r => rlsOk(q.table, r, uid));
  for (const [op, c, v] of q.filters || []) rows = rows.filter(r => op === 'eq' ? String(r[c]) === String(v) : op === 'in' ? v.map(String).includes(String(r[c])) : true);
  if (q.or) { const conds = q.or.split(',').map(s => s.split('.')); rows = rows.filter(r => conds.some(([c, op, ...v]) => op === 'eq' && String(r[c]) === v.join('.'))); }
  for (const o of (q.order || []).slice().reverse()) rows = rows.slice().sort((a, b) => (a[o.col] > b[o.col] ? 1 : a[o.col] < b[o.col] ? -1 : 0) * (o.asc ? 1 : -1));
  if (q.limit) rows = rows.slice(0, q.limit);
  return { data: rows };
}

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
function readBody(req) { return new Promise(r => { let s = ''; req.on('data', d => (s += d)); req.on('end', () => { try { r(JSON.parse(s || '{}')); } catch (_) { r({}); } }); }); }
function json(res, obj, code = 200) { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
const uidOf = req => { const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); return m ? m[1] : null; };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = decodeURIComponent(u.pathname);
  if (p.startsWith('/fake/')) {
    stats.http++;
    if (p === '/fake/rt' && req.method === 'GET') {
      const cid = u.searchParams.get('cid'), uid = u.searchParams.get('uid') || null;
      if (blocked.get(cid) > Date.now()) { res.writeHead(503); res.end(); return; }
      let c = clients.get(cid);
      if (c && c.res) { try { c.res.end(); } catch (_) { } dropClient(c); }
      c = { cid, uid, res, topics: new Map() }; clients.set(cid, c);
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(': ok\n\n');
      const ka = setInterval(() => res.write(': ka\n\n'), 15000);
      req.on('close', () => { clearInterval(ka); if (c.res === res) { c.res = null; dropClient(c); if (clients.get(cid) === c) clients.delete(cid); } });
      return;
    }
    const body = await readBody(req);
    if (p === '/fake/auth/anon') return json(res, { uid: crypto.randomUUID() });
    if (p.startsWith('/fake/rpc/')) {
      const name = p.slice(10), f = RPC[name];
      if (!f) return json(res, { error: { message: 'Could not find the function public.' + name, code: 'PGRST202' } });
      try { return json(res, { data: f(body, uidOf(req)) }); } catch (e) { return json(res, { error: { message: e.message } }); }
    }
    if (p === '/fake/rest') return json(res, rest(body, uidOf(req)));
    if (p === '/fake/rt') {
      const c = clients.get(body.cid);
      if (body.op === 'broadcast' && body.rest) {      // đường HTTP của supabase-js (kênh chưa vào xong)
        stats.rest_broadcast++; bump(stats.received, 'rest:' + body.event);
        for (const m of members(body.topic)) if (m.cid !== body.cid) sse(m, { t: 'broadcast', topic: body.topic, event: body.event, payload: body.payload }, 'b:' + body.event);
        return json(res, { ok: true });
      }
      if (!c || !c.res) return json(res, { error: { message: 'chưa kết nối' } });
      if (body.op === 'join') {
        c.topics.set(body.topic, { cfg: body.config || {}, pg: body.pg || [] });
        json(res, { ok: true });
        if (body.config && body.config.presence && body.config.presence.key !== undefined) setTimeout(() => sse(c, { t: 'presence', topic: body.topic, state: presenceState(body.topic) }, 'presence'), 5);
        return;
      }
      if (body.op === 'leave') { c.topics.delete(body.topic); const m = presence.get(body.topic); if (m && m.delete(c.cid)) pushPresence(body.topic); return json(res, { ok: true }); }
      const t = c.topics.get(body.topic);
      if (!t) return json(res, { error: { message: 'chưa vào kênh' } });
      if (body.op === 'track') {
        bump(stats.received, 'track');
        const key = (t.cfg.presence && t.cfg.presence.key) || c.cid;
        if (!presence.has(body.topic)) presence.set(body.topic, new Map());
        presence.get(body.topic).set(c.cid, { key, meta: body.payload || {}, ref: crypto.randomBytes(6).toString('hex') });
        pushPresence(body.topic); return json(res, { ok: true });
      }
      if (body.op === 'untrack') { const m = presence.get(body.topic); if (m && m.delete(c.cid)) pushPresence(body.topic); return json(res, { ok: true }); }
      if (body.op === 'broadcast') {
        bump(stats.received, 'b:' + body.event);
        const self = t.cfg.broadcast && t.cfg.broadcast.self;
        for (const m of members(body.topic)) if (self || m.cid !== c.cid) sse(m, { t: 'broadcast', topic: body.topic, event: body.event, payload: body.payload }, 'b:' + body.event);
        return json(res, { ok: true });
      }
      return json(res, { error: { message: 'op?' } });
    }
    if (p === '/fake/ctl') {
      if (body.op === 'stats') return json(res, { stats, clients: [...clients.values()].map(c => ({ cid: c.cid, uid: c.uid, topics: [...c.topics.keys()] })), presence: Object.fromEntries([...presence].map(([t, m]) => [t, m.size])), messages: db.messages.length, profiles: db.profiles.size });
      if (body.op === 'reset-stats') { stats.delivered = {}; stats.received = {}; stats.rest_broadcast = 0; stats.http = 0; return json(res, { ok: true }); }
      if (body.op === 'kill') {
        let n = 0;
        for (const c of clients.values()) if (c.uid === body.uid || c.cid === body.cid) { n++; if (body.blockMs) blocked.set(c.cid, Date.now() + body.blockMs); try { c.res.destroy(); } catch (_) { } }
        return json(res, { ok: true, killed: n });
      }
      return json(res, { error: { message: 'op?' } });
    }
    return json(res, { error: { message: 'not found' } }, 404);
  }
  /* ---------- web tĩnh ---------- */
  if (p === '/config.js' && !args.offline) {
    const src = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8')
      .replace(/^window\.SUPABASE_URL\s*=\s*['"][^'"]*['"]\s*;/m, "window.SUPABASE_URL = location.origin + '/fake';")
      .replace(/^window\.SUPABASE_ANON_KEY\s*=\s*['"][^'"]*['"]\s*;/m, "window.SUPABASE_ANON_KEY = 'fake-anon-key';");
    res.writeHead(200, { 'content-type': MIME['.js'], 'cache-control': 'no-store' }); return res.end(src);
  }
  if (p === '/vendor/supabase/supabase.js' && !args.offline) { res.writeHead(200, { 'content-type': MIME['.js'], 'cache-control': 'no-store' }); return res.end(fs.readFileSync(SHIM)); }
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (_) { res.writeHead(404); return res.end('not found'); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(f).toLowerCase();
    res.writeHead(200, Object.assign({ 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-store' }, ext === '.html' ? htmlHeaders() : {})); res.end(data);
  });
});
server.listen(PORT, () => console.log(`Supabase giả lập: http://localhost:${PORT}/?nguoi=1  ·  http://localhost:${PORT}/?nguoi=2  ·  admin: ${PORT}/admin.html (mật khẩu: ${ADMIN_PW})`));
