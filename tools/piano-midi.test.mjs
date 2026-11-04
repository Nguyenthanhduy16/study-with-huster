import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const Midi = require('../js/piano-midi.js');
const vlq = n => { const a = [n & 127]; while ((n = Math.floor(n / 128))) a.unshift((n & 127) | 128); return a; };
const evt = (ticks, ...data) => [...vlq(ticks), ...data];
const end = evt(0, 255, 47, 0);
function smf(tracks, division = 480, format = tracks.length > 1 ? 1 : 0) {
  const header = Buffer.alloc(14); header.write('MThd'); header.writeUInt32BE(6, 4); header.writeUInt16BE(format, 8); header.writeUInt16BE(tracks.length, 10); header.writeUInt16BE(division, 12);
  return Buffer.concat([header, ...tracks.flatMap(events => { const data = Buffer.from(events.flat()), h = Buffer.alloc(8); h.write('MTrk'); h.writeUInt32BE(data.length, 4); return [h, data]; })]);
}
function clock() {
  let t = 0, id = 0; const jobs = new Map();
  return { now: () => t, setTimeout: (f, ms) => { jobs.set(++id, { f, t: t + ms }); return id; }, clearTimeout: i => jobs.delete(i),
    advance(ms) { const end = t + ms; for (;;) { const next = [...jobs].filter(([, j]) => j.t <= end).sort((a, b) => a[1].t - b[1].t)[0]; if (!next) break; jobs.delete(next[0]); t = next[1].t; next[1].f(); } t = end; }, jobs };
}
const chordFile = () => smf([[evt(0, 144, 60, 100), evt(0, 64, 90), evt(480, 128, 60, 0), evt(0, 64, 0), evt(480, 144, 67, 100), evt(480, 128, 67, 0), end]]);

test('SMF0: running status, chords, rests, note-on velocity zero and melody reduction', () => {
  const song = Midi.parse(chordFile());
  assert.equal(song.notes.length, 3); assert.equal(song.duration, 1500);
  assert.deepEqual(song.notes.map(n => [n.m, n.at, n.off]), [[64, 0, 500], [60, 0, 500], [67, 1000, 1500]]);
  assert.deepEqual(song.melody.map(n => n.m), [64, 67]);
  assert.equal(Midi.parse(smf([[evt(0, 144, 60, 100), evt(480, 60, 0), end]])).notes[0].off, 500);
});
test('SMF1 merges tempo map globally and respects sustain pedal', () => {
  const song = Midi.parse(smf([
    [evt(0, 255, 81, 3, 7, 161, 32), evt(480, 255, 81, 3, 15, 66, 64), end],
    [evt(0, 144, 60, 100), evt(240, 176, 64, 127), evt(240, 128, 60, 0), evt(480, 176, 64, 0), end]
  ]));
  assert.equal(song.notes[0].off, 1500); assert.equal(song.duration, 1500);
});
test('SMPTE timing and keyboard/percussion filtering', () => {
  const song = Midi.parse(smf([[evt(0, 153, 60, 100), evt(0, 144, 10, 100), evt(0, 144, 60, 100), evt(1000, 128, 60, 0), end]], 0xe728));
  assert.equal(song.duration, 1000); assert.equal(song.skipped.percussion, 1); assert.equal(song.skipped.outside, 1);
});
test('reject truncated/malformed/unsupported/oversized and excessive-duration files', () => {
  const fixture = chordFile();
  for (let n = 0; n < fixture.length; n++) assert.throws(() => Midi.parse(fixture.subarray(0, n)));
  assert.throws(() => Midi.parse(smf([[evt(0, 60, 100), end]])), /running status/);
  assert.throws(() => Midi.parse(smf([[evt(0, 144, 60, 100), evt(480 * 4000, 128, 60, 0), end]])), /30 phút/);
  assert.throws(() => Midi.parse(smf([[end]], 480, 2)), /định dạng/);
  assert.throws(() => Midi.parse(new Uint8Array(Midi.LIMITS.bytes + 1)), /2 MB/);
  assert.throws(() => Midi.parse(smf([[evt(0, 255, 81, 3, 0, 0, 0), end]])), /tempo/);
  assert.throws(() => Midi.parse(smf([[evt(0, 144, 200, 20), end]])), /byte dữ liệu/);
  assert.throws(() => Midi.parse(smf([[...Array.from({ length: Midi.LIMITS.events + 1 }, () => evt(0, 255, 1, 0)), end]])), /100.000/);
  assert.throws(() => Midi.parse(smf([[...Array.from({ length: Midi.LIMITS.notes + 1 }, () => [evt(0, 144, 60, 100), evt(1, 128, 60, 0)]).flat(), end]])), /30.000/);
});
test('single-timer player preserves chords and silence, stop releases every held pitch', () => {
  const c = clock(), played = []; let done = false;
  const player = Midi.createPlayer({ ...c, down: m => played.push(['d', m, c.now()]), up: m => played.push(['u', m, c.now()]), done: () => { done = true; } });
  player.play(Midi.parse(chordFile())); assert.equal(c.jobs.size, 1);
  c.advance(300); assert.deepEqual(played.map(e => e.slice(0, 2)), [['d', 64], ['d', 60]]);
  c.advance(500); assert.equal(played.length, 4);
  c.advance(499); assert.equal(played.length, 4, 'rest must stay silent');
  c.advance(1); assert.equal(played.at(-1)[1], 67);
  player.stop(); assert.deepEqual(played.at(-1).slice(0, 2), ['u', 67]); c.advance(5000); assert.equal(played.length, 6); assert.equal(done, false);
  player.play(Midi.parse(chordFile())); c.advance(1800); assert.equal(done, true); assert.equal(player.running, false);
});
test('overlapping same-pitch tracks do not release another track’s held note', () => {
  const c = clock(), events = [];
  const player = Midi.createPlayer({ ...c, down: m => events.push('d' + m), up: m => events.push('u' + m) });
  player.play({ duration: 100, timeline: [{ at: 0, type: 'd', m: 60 }, { at: 25, type: 'd', m: 60 }, { at: 50, type: 'u', m: 60 }, { at: 100, type: 'u', m: 60 }] });
  c.advance(350); assert.deepEqual(events, ['d60']); c.advance(50); assert.deepEqual(events, ['d60', 'u60']);
});
test('actual piano key hook preserves imported velocity locally and across the network', () => {
  const source = fs.readFileSync(new URL('../scene/hust3d.js', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function keyDown(m,vel='), source.indexOf('\nfunction keyUp('));
  const local = [], remote = [];
  const context = { held: {}, noteOn: (m, v) => local.push([m, v]), pnOut: e => remote.push(e), pressVisual() {}, onPlayed() {} };
  vm.runInNewContext(fn, context); context.keyDown(60, .25); context.keyDown(64, NaN);
  assert.deepEqual(local, [[60, .25], [64, .78]]);
  assert.deepEqual(remote.map(e => e.v), [.25, .78]);
});

test('song guide requires user MIDI for catalog, imports locally and routes playback through existing keys', async () => {
  const source = fs.readFileSync(new URL('../scene/hust3d.js', import.meta.url), 'utf8');
  const guideSource = source.slice(source.indexOf('/* ---------- song guide ---------- */'), source.indexOf('/* sitting down and standing up */'));
  const c = clock(), elements = new Map(), keys = [], velocities = [], documentListeners = {};
  const $ = id => { if (!elements.has(id)) elements.set(id, { hidden: false, value: '', style: {}, classList: { add() {}, remove() {} }, listeners: {},
    addEventListener(type, cb) { this.listeners[type] = cb; }, setAttribute() {}, replaceChildren(...items) { this.options = items; }, blur() {}, click() {}, fire(type) { return this.listeners[type](); } }); return elements.get(id); };
  const context = { window: { PianoMidi: { ...Midi, createPlayer: options => Midi.createPlayer({ ...options, ...c }) } },
    document: { hidden: false, addEventListener(type, cb) { documentListeners[type] = cb; } }, Option: function (text, value) { return { text, value }; }, $, keyEls: {}, PIANO: { userData: { keys: {} } },
    SOLF: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], shift: 0,
    box() {}, mat() {}, mk: () => ({ position: { set() {} } }), keyFor: String, buildKeys() {}, audio() {}, releaseAll() {},
    keyDown: (m, v) => { keys.push(['d', m]); velocities.push(v); }, keyUp: m => keys.push(['u', m]), setTimeout: c.setTimeout, clearTimeout: c.clearTimeout };
  vm.runInNewContext(guideSource, context);
  assert.equal($('#pb-song').options.length, 11, 'six existing melodies plus four named metadata entries');
  $('#pb-song').value = '6'; $('#pb-song').fire('change');
  assert.equal($('#pb-demo').disabled, true); assert.match($('#pb-stat').textContent, /MIDI/);
  const data = chordFile(); $('#pb-midi-file').files = [{ name: 'my-song.mid', size: data.length, arrayBuffer: async () => data }];
  await $('#pb-midi-file').fire('change');
  assert.equal($('#pb-demo').disabled, false); assert.equal($('#pb-song').value, '6');
  assert.match($('#pb-stat').textContent, /không chấm nhịp/);
  $('#pb-demo').fire('click'); c.advance(300); assert.deepEqual(keys, [['d', 64], ['d', 60]]);
  assert.deepEqual(velocities, [90 / 127, 100 / 127]);
  assert.match($('#pb-stat').textContent, /Đang phát mẫu/);
  context.document.hidden = true; documentListeners.visibilitychange();
  assert.match($('#pb-stat').textContent, /Đã dừng/);
  $('#pb-song').value = '0'; $('#pb-song').fire('change'); assert.equal(keys.filter(e => e[0] === 'u').length, 2);
  assert.equal($('#pb-demo').disabled, false, 'existing public-domain guide still usable');
});

test('generator MIDI guide and DOM injection exactly match shipped assets and are idempotent', () => {
  const result = spawnSync('python3', ['-c', `import ast,json,pathlib
source=pathlib.Path('tools/patch_scene.py').read_text();t=ast.parse(source); values={}
for n in t.body:
 if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ('MIDI_GUIDE','MIDI_DOM'): values[n.targets[0].id]=ast.literal_eval(n.value)
hook=source[source.index('# ---------- móc 7:'):source.index('# Tự chạy khi tải:')]
state={'js':'prefix;const NI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};oldGuide();buildKeys();renderLane();suffix;', 'dom':'  <div class="pb-guide" id="pb-guide" hidden>', 'errors':[]}
exec(hook,state);once=(state['js'],state['dom']);exec(hook,state)
assert not state['errors'] and once==(state['js'],state['dom'])
print(json.dumps(values))`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const { MIDI_GUIDE, MIDI_DOM } = JSON.parse(result.stdout);
  const scene = fs.readFileSync(new URL('../scene/hust3d.js', import.meta.url), 'utf8');
  assert(scene.includes(MIDI_GUIDE));
  let html = ''; vm.runInNewContext(fs.readFileSync(new URL('../scene/hust3d-dom.js', import.meta.url), 'utf8'), { document: { getElementById: () => ({ set innerHTML(value) { html = value; } }) } });
  assert(html.includes(MIDI_DOM)); assert.equal((html.match(/id="pb-midi-file"/g) || []).length, 1);
});
