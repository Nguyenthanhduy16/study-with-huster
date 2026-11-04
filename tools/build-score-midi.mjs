// Reproducible SMF1 from a hand-entered two-hand score (data/*.json, data/scores/*.json).
// Usage: node tools/build-score-midi.mjs [output.mid] [score.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function pitchNumber(pitch) {
  const m = /^([A-G])([b#]?)(-?\d+)$/.exec(pitch);
  if (!m) throw new Error('Invalid pitch: ' + pitch);
  const n = (Number(m[3]) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
  if (n < 0 || n > 127) throw new Error('Pitch outside MIDI range: ' + pitch);
  return n;
}
function vlq(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0x0fffffff) throw new Error('Invalid MIDI delta');
  const bytes = [n & 127];
  while ((n = Math.floor(n / 128))) bytes.unshift((n & 127) | 128);
  return bytes;
}
const meta = (type, data) => [255, type, ...vlq(data.length), ...data];
function track(events, endTick) {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const out = []; let tick = 0;
  for (const e of events) { out.push(...vlq(e.tick - tick), ...e.bytes); tick = e.tick; }
  out.push(...vlq(endTick - tick), 255, 47, 0);
  const data = Buffer.from(out), header = Buffer.alloc(8);
  header.write('MTrk'); header.writeUInt32BE(data.length, 4);
  return Buffer.concat([header, data]);
}
export function buildScoreMidi(score) {
  const ppq = score.ticksPerQuarter, [numerator, denominator] = score.timeSignature;
  if (!Number.isInteger(ppq) || ppq < 1 || ppq > 0x7fff || denominator !== 4 || !Number.isInteger(numerator) || numerator < 1 || numerator > 255) throw new Error('Unsupported score meter');
  if (!Number.isFinite(score.tempoBpm) || score.tempoBpm < 10 || score.tempoBpm > 1000) throw new Error('Invalid score tempo');
  const tempo = Math.round(60000000 / score.tempoBpm), endTick = score.measures.length * numerator * ppq;
  const conductor = [
    {tick: 0, order: 0, bytes: meta(3, Buffer.from(score.title, 'utf8'))},
    {tick: 0, order: 1, bytes: meta(81, [(tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255])},
    {tick: 0, order: 2, bytes: meta(88, [numerator, 2, 24, 8])},
    // SMF FF59 requires a major/minor choice. Preserve the written signature as
    // text instead of inventing a mode that the supplied page does not state.
    {tick: 0, order: 3, bytes: meta(1, Buffer.from(score.midiText || 'Key signature: 6 flats; mode unspecified. Excerpt: page 1, measures 1-4.'))}
  ];
  const tracks = [track(conductor, endTick)];
  for (const [hand, channel, velocity] of [['right', 0, score.performance.rightVelocity], ['left', 1, score.performance.leftVelocity]]) {
    if (!Number.isInteger(velocity) || velocity < 1 || velocity > 127) throw new Error('Invalid velocity');
    const events = [{tick: 0, order: -2, bytes: meta(3, Buffer.from(hand === 'right' ? 'Right hand' : 'Left hand'))}, {tick: 0, order: -1, bytes: [192 | channel, 0]}];
    score.measures.forEach((measure, index) => {
      let beat = 0;
      for (const note of measure[hand]) {
        if (!Number.isFinite(note.beats) || note.beats <= 0) throw new Error('Invalid note duration');
        if (note.tieSegments && note.tieSegments.reduce((a, b) => a + b, 0) !== note.beats) throw new Error('Incorrect tied duration');
        const at = (index * numerator + beat) * ppq, off = at + note.beats * ppq;
        if (!Number.isInteger(at) || !Number.isInteger(off)) throw new Error('Duration cannot be represented exactly');
        for (const pitch of note.rest ? [] : note.pitches || [note.pitch]) {   // { rest: true, beats } = dấu lặng
          const n = pitchNumber(pitch);
          events.push({tick: at, order: 1, bytes: [144 | channel, n, velocity]}, {tick: off, order: 0, bytes: [128 | channel, n, 0]});
        }
        beat += note.beats;
      }
      if (beat !== numerator) throw new Error(`Incomplete ${hand} measure ${measure.number}: ${beat} beats`);
    });
    tracks.push(track(events, endTick));
  }
  const header = Buffer.alloc(14);
  header.write('MThd'); header.writeUInt32BE(6, 4); header.writeUInt16BE(1, 8); header.writeUInt16BE(tracks.length, 10); header.writeUInt16BE(ppq, 12);
  return Buffer.concat([header, ...tracks]);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[3] || new URL('../data/hay-trao-cho-anh-excerpt.json', import.meta.url);
  const output = process.argv[2] || '/tmp/huster-midi-source/hay-trao-cho-anh.mid';
  const bytes = buildScoreMidi(JSON.parse(fs.readFileSync(input, 'utf8')));
  fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, bytes);
  console.log(`Wrote ${bytes.length} MIDI bytes to ${output}`);
}
