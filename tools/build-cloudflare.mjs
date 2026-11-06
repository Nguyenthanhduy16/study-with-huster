#!/usr/bin/env node
/* =====================================================================
   DỰNG BẢN CHO CLOUDFLARE PAGES (lệnh build: npm run build:cloudflare · thư mục xuất bản: dist)
   - Chép phần web chạy thật vào dist/ (không kèm tools/, supabase/, docs/, file .md, cấu hình Netlify/Vercel).
   - Sinh dist/_headers từ netlify.toml ⇒ một nguồn cấu hình duy nhất cho CSP, bảo mật và bộ nhớ đệm.
     Cloudflare GỘP (nối bằng dấu phẩy) các giá trị khi nhiều quy tắc cùng khớp một đường dẫn, nên quy tắc cụ thể
     hơn sẽ "! Tên-header" (bỏ giá trị của quy tắc rộng hơn) trước khi đặt giá trị riêng.
   - Cloudflare tự đổi /trang.html → /trang ("pretty URLs"): quy tắc cho /x.html được nhân thêm cho /x.
   Không cần gói npm nào. Netlify không dùng file này (Netlify đọc thẳng netlify.toml).
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const INCLUDE = ['index.html', 'admin.html', 'phong-thay-do.html', 'config.js', 'avatar', 'css', 'data', 'js', 'scene', 'vendor'];
const MAX_FILE = 25 * 1024 * 1024;           // giới hạn mỗi file của Cloudflare Pages

/* ---------- đọc [[headers]] trong netlify.toml (đủ cho cú pháp file này dùng) ---------- */
export function parseNetlifyHeaders(toml) {
  const rules = []; let cur = null, inValues = false;
  for (const raw of toml.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line === '[[headers]]') { cur = { path: null, values: [] }; rules.push(cur); inValues = false; continue; }
    if (line === '[headers.values]') { inValues = !!cur; continue; }
    if (line.startsWith('[')) { cur = null; inValues = false; continue; }
    const m = /^([A-Za-z0-9-]+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/.exec(line);
    if (!m || !cur) continue;
    if (!inValues && m[1] === 'for') cur.path = m[2];
    else if (inValues) cur.values.push([m[1], m[2].replace(/\\"/g, '"')]);
  }
  return rules.filter(r => r.path && r.values.length);
}

/* đường dẫn p (có thể có *) có khớp mọi URL của q không — đủ cho các mẫu "/x", "/dir/*", "/*" */
function covers(p, q) {
  if (p === q) return true;
  if (!p.endsWith('*')) return false;
  const pre = p.slice(0, -1);
  return q.startsWith(pre);
}

export function toCloudflareHeaders(rules) {
  // nhân quy tắc /x.html cho /x (Cloudflare chuyển hướng /x.html → /x); /index.html → / đã có sẵn
  const all = [];
  for (const r of rules) {
    all.push(r);
    const m = /^(\/.+)\.html$/.exec(r.path);
    if (m && m[1] !== '/index' && !rules.some(x => x.path === m[1])) all.push({ path: m[1], values: r.values });
  }
  const lines = ['# Tự sinh bởi tools/build-cloudflare.mjs từ netlify.toml — đừng sửa tay.', ''];
  for (const r of all) {
    const broader = all.filter(o => o !== r && o.path !== r.path && covers(o.path, r.path));
    const out = [];
    for (const [k, v] of r.values) {
      const prev = broader.flatMap(o => o.values.filter(([k2]) => k2.toLowerCase() === k.toLowerCase()).map(([, v2]) => v2));
      if (prev.length && prev.every(v2 => v2 === v)) continue;          // quy tắc rộng hơn đã đặt đúng giá trị này
      if (prev.length) out.push(`  ! ${k}`);                            // bỏ giá trị của quy tắc rộng hơn
      out.push(`  ${k}: ${v}`);
    }
    if (!out.length) continue;
    lines.push(r.path, ...out, '');
  }
  return lines.join('\n');
}

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f)); return 0; }
  if (st.size > MAX_FILE) throw new Error(`File quá 25 MB (Cloudflare Pages không nhận): ${path.relative(ROOT, src)}`);
  fs.copyFileSync(src, dst); return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
  for (const f of INCLUDE) copy(path.join(ROOT, f), path.join(OUT, f));
  const headers = toCloudflareHeaders(parseNetlifyHeaders(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8')));
  fs.writeFileSync(path.join(OUT, '_headers'), headers);
  // trang 404 thật: không có file này Cloudflare trả index.html với mã 200 cho mọi đường dẫn sai
  // (thiếu file JS sẽ nhận nhầm HTML, khó tìm lỗi) — Netlify trả 404
  fs.writeFileSync(path.join(OUT, '404.html'), '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Không tìm thấy trang</title><body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 16px;background:#f4f5f8;color:#222">'
    + '<h1>Không tìm thấy trang</h1><p><a href="/">Về Học Online Cùng Huster</a></p></body></html>\n');
  const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
  const n = count(OUT);
  if (n > 20000) throw new Error('Quá 20.000 file (giới hạn Cloudflare Pages)');
  const rules = headers.split('\n').filter(l => l.startsWith('/')).length;
  if (rules > 100) throw new Error('_headers quá 100 quy tắc (giới hạn Cloudflare Pages)');
  console.log(`Đã dựng dist/: ${n} file, _headers ${rules} quy tắc.`);
}
