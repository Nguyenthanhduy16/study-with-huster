/* Standard MIDI File 0/1 import and bounded playback. Imported bytes stay on this device.
   Format reference: https://midi.org/standard-midi-files */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, tracks: 128, events: 100000, notes: 30000, durationMs: 30 * 60000 });
  const CATALOG = Object.freeze([
    { name: 'Em của ngày hôm qua · Sơn Tùng M-TP' },
    { name: 'Chúng ta của hiện tại · Sơn Tùng M-TP' },
    { name: 'Hãy trao cho anh · Sơn Tùng M-TP' },
    { name: 'Xe đạp' }
  ]);
  function parse(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const fail = text => { throw new Error('MIDI: ' + text); };
    if (bytes.byteLength > LIMITS.bytes) fail('tệp tối đa 2 MB.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let p = 0, end = bytes.length, count = 0, order = 0;
    const need = n => { if (n < 0 || p + n > end) fail('tệp bị cắt hoặc độ dài khối không hợp lệ.'); };
    const u8 = () => { need(1); return bytes[p++]; };
    const u16 = () => { need(2); const v = view.getUint16(p); p += 2; return v; };
    const u32 = () => { need(4); const v = view.getUint32(p); p += 4; return v; };
    const text4 = () => String.fromCharCode(u8(), u8(), u8(), u8());
    const vlq = () => { let n = 0; for (let i = 0; i < 4; i++) { const b = u8(); n = n * 128 + (b & 127); if (!(b & 128)) return n; } fail('delta-time vượt 4 byte.'); };
    if (text4() !== 'MThd') fail('chỉ nhận Standard MIDI (.mid/.midi), không nhận MP3.');
    const headerLength = u32(); if (headerLength < 6) fail('header thiếu dữ liệu.');
    need(headerLength);
    const format = u16(), trackCount = u16(), division = u16();
    if (format !== 0 && format !== 1) fail('chỉ hỗ trợ định dạng 0 hoặc 1.');
    if (!trackCount || trackCount > LIMITS.tracks || (format === 0 && trackCount !== 1)) fail('số track không hợp lệ (tối đa 128).');
    let ticksPerSecond = null;
    if (division & 0x8000) {
      const fps = 256 - (division >> 8), ticks = division & 255;
      if (![24, 25, 29, 30].includes(fps) || !ticks) fail('đơn vị SMPTE không hợp lệ.');
      ticksPerSecond = (fps === 29 ? 30000 / 1001 : fps) * ticks;
    } else if (!division) fail('đơn vị tick không hợp lệ.');
    p = 8 + headerLength;
    const events = [], tempos = [{ tick: 0, tempo: 500000, order: -1 }];
    let lastTick = 0, percussion = 0, outside = 0;
    for (let track = 0; track < trackCount; track++) {
      end = bytes.length;
      if (text4() !== 'MTrk') fail('không tìm thấy track MTrk.');
      const length = u32(); need(length); end = p + length;
      let tick = 0, running = 0, ended = false;
      while (p < end) {
        tick += vlq(); if (!Number.isSafeInteger(tick)) fail('mốc thời gian quá lớn.');
        if (++count > LIMITS.events) fail('quá 100.000 sự kiện.');
        let status = u8();
        if (status < 128) { if (!running) fail('running status không có byte trạng thái trước đó.'); p--; status = running; }
        else if (status < 240) running = status;
        else running = 0;
        if (status === 255) {
          const type = u8(), size = vlq(); need(size);
          if (type === 81) {
            if (size !== 3) fail('sự kiện tempo phải có 3 byte.');
            const tempo = bytes[p] * 65536 + bytes[p + 1] * 256 + bytes[p + 2];
            if (!tempo) fail('tempo không thể bằng 0.');
            tempos.push({ tick, tempo, order: order++ });
          }
          if (type === 47) { if (size) fail('End of Track không hợp lệ.'); ended = true; p = end; break; }
          p += size; continue;
        }
        if (status === 240 || status === 247) { const size = vlq(); need(size); p += size; continue; }
        if (status >= 240) fail('sự kiện hệ thống không hỗ trợ trong SMF.');
        const kind = status >> 4, channel = status & 15;
        const a = u8(), b = kind === 12 || kind === 13 ? 0 : u8();
        if (a > 127 || b > 127) fail('byte dữ liệu MIDI ngoài 0–127.');
        if (kind === 8 || kind === 9) {
          if (channel === 9) { percussion++; continue; }
          if (a < 21 || a > 108) { outside++; continue; }
          events.push({ tick, order: order++, channel, m: a, v: b / 127, type: kind === 9 && b > 0 ? 'd' : 'u' });
        } else if (kind === 11 && (a === 64 || a === 120 || a === 123)) {
          events.push({ tick, order: order++, channel, type: a === 64 ? 'pedal' : 'alloff', on: b >= 64 });
        }
      }
      if (!ended) fail('track thiếu End of Track.');
      lastTick = Math.max(lastTick, tick);
    }
    tempos.sort((a, b) => a.tick - b.tick || a.order - b.order);
    let lastTempoTick = 0, elapsed = 0, tempo = 500000;
    const segments = [];
    for (const t of tempos) {
      elapsed += (t.tick - lastTempoTick) * tempo / division / 1000;
      segments.push({ tick: t.tick, at: elapsed, tempo: t.tempo });
      lastTempoTick = t.tick; tempo = t.tempo;
    }
    function ms(tick) {
      if (ticksPerSecond) return tick / ticksPerSecond * 1000;
      let lo = 0, hi = segments.length;
      while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (segments[mid].tick <= tick) lo = mid; else hi = mid; }
      const s = segments[lo]; return s.at + (tick - s.tick) * s.tempo / division / 1000;
    }
    const duration = ms(lastTick);
    if (!Number.isFinite(duration) || duration > LIMITS.durationMs) fail('bài dài hơn 30 phút.');
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const held = new Map(), sustained = new Map(), pedal = new Set(), notes = [];
    function finish(n, tick) {
      if (notes.length >= LIMITS.notes) fail('quá 30.000 nốt.');
      const at = ms(n.tick), off = Math.max(at + 1, ms(tick));
      notes.push({ m: n.m, v: n.v, at, off });
    }
    function release(channel, tick, force) {
      for (const [key, q] of held) if (key.startsWith(channel + ':') && force) { for (let i = q.head; i < q.list.length; i++) finish(q.list[i], tick); held.delete(key); }
      for (const [key, list] of sustained) if (key.startsWith(channel + ':')) { for (const n of list) finish(n, tick); sustained.delete(key); }
    }
    for (const e of events) {
      const key = e.channel + ':' + e.m;
      if (e.type === 'pedal') { if (e.on) pedal.add(e.channel); else { pedal.delete(e.channel); release(e.channel, e.tick, false); } }
      else if (e.type === 'alloff') { pedal.delete(e.channel); release(e.channel, e.tick, true); }
      else if (e.type === 'd') { if (!held.has(key)) held.set(key, { list: [], head: 0 }); held.get(key).list.push(e); }
      else {
        const q = held.get(key); if (!q) continue;
        const n = q.list[q.head++]; if (q.head === q.list.length) held.delete(key);
        if (pedal.has(e.channel)) { if (!sustained.has(key)) sustained.set(key, []); sustained.get(key).push(n); } else finish(n, e.tick);
      }
    }
    for (const q of held.values()) for (let i = q.head; i < q.list.length; i++) finish(q.list[i], lastTick);
    for (const list of sustained.values()) for (const n of list) finish(n, lastTick);
    if (!notes.length) fail('không có nốt piano trong khoảng A0–C8.');
    notes.sort((a, b) => a.at - b.at || b.m - a.m);
    const timeline = notes.flatMap(n => [{ at: n.at, type: 'd', m: n.m, v: n.v }, { at: n.off, type: 'u', m: n.m }])
      .sort((a, b) => a.at - b.at || (a.type === b.type ? 0 : a.type === 'u' ? -1 : 1));
    const melody = [];
    for (const n of notes) { const prev = melody.at(-1); if (!prev || Math.abs(n.at - prev.at) > .001) melody.push({ m: n.m, at: n.at, d: 1 }); }
    return { format, trackCount, notes, timeline, melody, duration: Math.max(duration, ...notes.map(n => n.off)), skipped: { percussion, outside } };
  }
  function createPlayer(o) {
    const now = o.now || (() => performance.now()), later = o.setTimeout || setTimeout, cancel = o.clearTimeout || clearTimeout;
    let timer = null, source = null, startAt = 0, index = 0, running = false;
    const held = new Map();
    function stop() {
      running = false; if (timer != null) cancel(timer); timer = null;
      for (const m of held.keys()) o.up(m); held.clear();
    }
    function step() {
      timer = null; if (!running) return;
      const time = now() - startAt;
      while (index < source.timeline.length && source.timeline[index].at <= time) {
        const e = source.timeline[index++], n = held.get(e.m) || 0;
        if (e.type === 'd') { held.set(e.m, n + 1); if (!n) o.down(e.m, e.v); }
        else if (n) { if (n === 1) { held.delete(e.m); o.up(e.m); } else held.set(e.m, n - 1); }
      }
      if (o.progress) o.progress(Math.max(0, time));
      if (index >= source.timeline.length && time >= source.duration) { stop(); if (o.done) o.done(); return; }
      const next = index < source.timeline.length ? source.timeline[index].at : source.duration;
      timer = later(step, Math.max(1, Math.min(25, next - time)));
    }
    function play(song) { stop(); source = song; index = 0; startAt = now() + 300; running = true; timer = later(step, 300); }
    return { play, stop, get running() { return running; } };
  }
  const api = { parse, createPlayer, LIMITS, CATALOG };
  root.PianoMidi = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
