import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { buildScoreMidi } from './build-score-midi.mjs';
const require = createRequire(import.meta.url), Midi = require('../js/piano-midi.js');
const Library = require('../js/piano-library.js');
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/piano-library.json'));

test('bundled MIDI bytes match verified source hashes and every piece has attribution', () => {
  assert.ok(manifest.length >= 9);
  assert.equal(new Set(manifest.map(e => e.id)).size, manifest.length);
  for (const entry of manifest) {
    const bytes = Buffer.from(entry.midiBase64, 'base64');
    assert.equal(bytes.toString('ascii', 0, 4), 'MThd');
    assert.equal(bytes.length, entry.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.ok(entry.credit && entry.source && entry.license && (entry.licenseUrl || entry.userProvided), entry.id + ' attribution');
    const meta = Library.entries.find(e => e.id === entry.id);
    const parsed = Midi.parse(bytes), song = Library.load(entry.id);
    assert.equal(meta.noteCount, parsed.notes.length);
    assert.equal(meta.duration, parsed.duration);
    assert.deepEqual(song.notes, parsed.melody); assert.deepEqual(song.timeline, parsed.timeline);
    assert.ok(song.notes.length > 0 && song.duration > 0);
    assert.ok(!('midiBase64' in meta), 'catalog does not expose private encoded storage');
  }
});

test('browser library works offline, decodes only on selection and caches parsed pieces', () => {
  let parses = 0, fetches = 0;
  const context = vm.createContext({ atob, fetch() { fetches++; throw new Error('network forbidden'); },
    PianoMidi: { parse(input) { parses++; return Midi.parse(input); } } });
  context.window = context;
  vm.runInContext(read('js/piano-library.js'), context);
  const api = context.PianoLibrary;
  assert.equal(parses, 0); assert.equal(api.entries.length, manifest.length);
  const selected = api.load(manifest[0].id);
  assert.equal(api.load(manifest[0].id), selected); assert.equal(parses, 1);
  assert.ok(selected.notes.length); assert.equal(fetches, 0);
  assert.throws(() => api.load('missing-id'), /Không tìm thấy/);
});

test('every bundled score plays to completion and releases all pitches without extra timers', () => {
  for (const entry of Library.entries) {
    let time = 0, timer = null, timerId = 0, downs = 0, completed = false;
    const held = new Set();
    const player = Midi.createPlayer({ now: () => time,
      setTimeout(fn, delay) { assert.equal(timer, null, 'one active timer per score'); timer = { fn, at: time + delay, id: ++timerId }; return timerId; },
      clearTimeout(id) { if (timer?.id === id) timer = null; },
      down(m, v) { assert.ok(m >= 21 && m <= 108); assert.ok(v > 0 && v <= 1); held.add(m); downs++; },
      up(m) { held.delete(m); }, done() { completed = true; } });
    player.play(Library.load(entry.id));
    let steps = 0;
    while (timer) { assert.ok(++steps < 100000, 'bounded playback'); const next = timer; timer = null; time = next.at; next.fn(); }
    assert.ok(completed && downs > 0, entry.id + ' plays');
    assert.equal(held.size, 0, entry.id + ' releases keys'); assert.equal(player.running, false);
    player.stop(); assert.equal(timer, null);
  }
});

test('library build is deterministic and script is loaded after MIDI parser', () => {
  const before = read('js/piano-library.js');
  const result = spawnSync(process.execPath, ['tools/build-piano-library.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(read('js/piano-library.js'), before);
  const html = read('index.html');
  assert.ok(html.indexOf('src="js/piano-midi.js"') < html.indexOf('src="js/piano-library.js"'));
});

test('provided-score bytes in the library are reproducible from the verified four-bar transcription', () => {
  const score = JSON.parse(read('data/hay-trao-cho-anh-excerpt.json'));
  const entry = manifest.find(e => e.id === score.id);
  assert.ok(entry?.userProvided);
  assert.equal(entry.catalogName, 'Hãy trao cho anh · Sơn Tùng M-TP');
  assert.deepEqual(Buffer.from(entry.midiBase64, 'base64'), buildScoreMidi(score));
  assert.equal(Library.load(entry.id).duration, 10000);
});
