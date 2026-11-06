import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseNetlifyHeaders, toCloudflareHeaders } from './build-cloudflare.mjs';

const toml = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');

test('_headers cho Cloudflare giữ nguyên CSP, bộ nhớ đệm và không nối trùng giá trị', () => {
  const rules = parseNetlifyHeaders(toml);
  const out = toCloudflareHeaders(rules);
  const blocks = Object.fromEntries(out.split('\n\n').filter(b => b.startsWith('/')).map(b => { const [p, ...l] = b.split('\n'); return [p, l.map(x => x.trim())]; }));
  const csp = rules.find(r => r.path === '/*').values.find(([k]) => k === 'Content-Security-Policy')[1];
  assert.ok(blocks['/*'].includes('Content-Security-Policy: ' + csp), 'CSP áp cho mọi trang');
  assert.match(csp, /'wasm-unsafe-eval'/);
  assert.ok(blocks['/config.js'].includes('Cache-Control: no-cache'));
  assert.ok(blocks['/scene/exterior/thu-vien-ta-quang-buu.draco.glb'].includes('Content-Type: model/gltf-binary'));
  // /admin.html được nhân cho /admin (Cloudflare đổi /x.html → /x)
  assert.deepEqual(blocks['/admin'], blocks['/admin.html']);
  // quy tắc con trùng giá trị quy tắc cha thì bỏ (Cloudflare sẽ nối "a, a")
  assert.equal(blocks['/scene/vendor/draco/*'], undefined);
  // mọi header của Netlify đều còn (trực tiếp hoặc qua quy tắc rộng hơn)
  for (const r of rules) for (const [k] of r.values) {
    const has = Object.entries(blocks).some(([p, l]) => (p === r.path || (p.endsWith('*') && r.path.startsWith(p.slice(0, -1)))) && l.some(x => x.startsWith(k + ':')));
    assert.ok(has, `${r.path} thiếu ${k}`);
  }
  assert.ok(Object.keys(blocks).length <= 100);
  for (const l of out.split('\n')) assert.ok(l.length <= 2000, 'dòng _headers quá 2000 ký tự');
});
