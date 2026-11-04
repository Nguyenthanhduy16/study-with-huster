#!/usr/bin/env node
// Static release checks: parse shipped JavaScript and catch broken local HTML/CSS assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirs = ['js', 'scene', 'avatar', 'css', 'tools'];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const files = [...dirs.flatMap(d => walk(path.join(root, d))), path.join(root, 'config.js')];
let failures = 0, parsed = 0, assets = 0;
for (const f of files.filter(f => /\.(?:js|mjs)$/.test(f))) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.error); failures++; }
  parsed++;
}
const html = ['index.html', 'admin.html', 'phong-thay-do.html'].map(f => path.join(root, f));
for (const f of [...html, ...files.filter(f => f.endsWith('.css'))]) {
  const src = fs.readFileSync(f, 'utf8');
  const pattern = f.endsWith('.html') ? /(?:src|href)\s*=\s*["']([^"']+)["']/g : /url\(\s*["']?([^\s"')]+)["']?\s*\)/g;
  for (const [, ref] of src.matchAll(pattern)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref) || /[<>${}]/.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    const target = path.resolve(clean.startsWith('/') ? root : path.dirname(f), clean.replace(/^\//, ''));
    assets++;
    if (!fs.existsSync(target)) { console.error(`Missing asset: ${path.relative(root, f)} → ${ref}`); failures++; }
  }
}
const model = fs.openSync(path.join(root, 'scene/exterior/thu-vien-ta-quang-buu.glb'), 'r');
const header = Buffer.alloc(12);
fs.readSync(model, header, 0, 12, 0); fs.closeSync(model);
if (header.toString('ascii', 0, 4) !== 'glTF' || header.readUInt32LE(4) !== 2) { console.error('Invalid exterior GLB'); failures++; }
console.log(`${parsed} JavaScript files parsed; ${assets} local asset references checked; exterior GLB verified.`);
process.exitCode = failures ? 1 : 0;
