import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildScoreMidi, pitchNumber} from './build-score-midi.mjs';
const require = createRequire(import.meta.url), Midi = require('../js/piano-midi.js');
const score = JSON.parse(fs.readFileSync(new URL('../data/hay-trao-cho-anh-excerpt.json', import.meta.url), 'utf8'));

test('provided score excerpt preserves all four bars, six flats and notated ties', () => {
  assert.equal(score.tempoBpm, 96); assert.deepEqual(score.timeSignature, [4, 4]);
  assert.equal(score.keySignature.flats, 6); assert.equal(score.keySignature.mode, 'unspecified');
  assert.deepEqual(score.source.measures, [1, 2, 3, 4]);
  assert.deepEqual(score.measures.map(m => m.right.map(n => n.pitch)), [
    ['Eb5', 'Bb5', 'Gb5', 'Gb5', 'F5', 'Gb5'],
    ['Eb5', 'Bb5', 'Gb5', 'Gb5', 'Gb5', 'F5'],
    ['Eb5', 'Bb5', 'Gb5', 'Gb5', 'F5', 'Gb5'],
    ['F5', 'F5', 'Gb5', 'Ab5', 'Bb4', 'Gb5', 'F5']
  ]);
  for (const m of score.measures) for (const hand of ['right', 'left']) {
    assert.equal(m[hand].reduce((sum, n) => sum + n.beats, 0), 4);
    for (const note of m[hand]) if (note.tieSegments) assert.equal(note.tieSegments.reduce((a, b) => a + b, 0), note.beats);
  }
  assert.equal(pitchNumber('Cb3'), 47, 'C flat must cross the MIDI octave boundary to B2');
  assert.deepEqual(score.measures.map(m => m.left[0].pitches.map(pitchNumber)), [[51, 58], [47, 54], [44, 51], [46, 53]]);
});
test('generated genuine SMF1 round-trips through shipped piano reader at 96 BPM with both hands', () => {
  const bytes = buildScoreMidi(score), parsed = Midi.parse(bytes);
  assert.equal(bytes.toString('ascii', 0, 4), 'MThd');
  assert.equal(parsed.format, 1); assert.equal(parsed.trackCount, 3);
  assert.equal(parsed.duration, 10000); assert.equal(parsed.notes.length, 33);
  assert.equal(parsed.melody.length, 25);
  assert.deepEqual(parsed.notes.filter(n => n.m >= 70).slice(0, 6).map(n => [n.m, n.at, n.off]), [
    [75, 0, 468.75], [82, 468.75, 937.5], [78, 937.5, 1250],
    [78, 1250, 1718.75], [77, 1718.75, 2187.5], [78, 2187.5, 2500]
  ]);
  const bass = parsed.notes.filter(n => n.m < 70);
  assert.deepEqual(bass.map(n => [n.m, n.at, n.off]), [
    [58, 0, 2500], [51, 0, 2500], [54, 2500, 5000], [47, 2500, 5000],
    [51, 5000, 7500], [44, 5000, 7500], [53, 7500, 10000], [46, 7500, 10000]
  ]);
  assert.deepEqual(buildScoreMidi(score), bytes, 'rebuild must produce identical bytes');
});
test('generator rejects incomplete bars and broken ties instead of silently changing rhythm', () => {
  const incomplete = structuredClone(score); incomplete.measures[0].right[0].beats = .5;
  assert.throws(() => buildScoreMidi(incomplete), /Incomplete right measure 1/);
  const brokenTie = structuredClone(score); brokenTie.measures[0].right[1].tieSegments = [.25, .25];
  assert.throws(() => buildScoreMidi(brokenTie), /Incorrect tied duration/);
});
