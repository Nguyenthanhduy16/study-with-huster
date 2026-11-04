/* =====================================================================
   ÂM THANH — toàn bộ tạo bằng Web Audio (không dùng file nhạc ⇒ không lo bản quyền)
   Kênh: mưa · gió & chim · thư viện (lật sách, gõ phím) · piano nhẹ · âm báo
   ===================================================================== */
(function () {
  'use strict';
  let ctx = null, master = null, reverb = null;
  const ch = {};
  const CHANNELS = [
    { id: 'rain', label: '🌧️ Tiếng mưa', def: 0 },
    { id: 'nature', label: '🍃 Gió & chim', def: 0.35 },
    { id: 'library', label: '📖 Không khí thư viện', def: 0.4 },
    { id: 'piano', label: '🎹 Piano nhẹ', def: 0.3 },
    // [piano-net] tiếng đàn thật do bạn khác chơi ở tầng 6 (kéo về 0 = tắt). Phát ở scene/hust3d.js, đọc mức ở js/piano-net.js
    { id: 'pianoNet', label: '🎹 Tiếng đàn của bạn khác', def: 1 },
    { id: 'fx', label: '🔔 Âm báo', def: 0.6 }
  ];
  const vol = Object.assign(Object.fromEntries(CHANNELS.map(c => [c.id, c.def])), U.store.get('audio:vol', {}));
  let enabled = U.store.get('audio:on', false);
  /* âm thanh theo nơi đứng: ngoài sân nghe gió & chim rõ, tiếng thư viện tắt; trong nhà ngược lại; sân thượng: gió nhẹ */
  let byPlace = U.store.get('audio:place', true), place = 'indoor';
  const PLACE = { outdoor: { nature: 1, library: 0, rain: 1 }, indoor: { nature: 0.15, library: 1, rain: 0.45 }, roof: { nature: 0.6, library: 0, rain: 1 } };
  const gainOf = id => vol[id] * (byPlace ? ((PLACE[place] || {})[id] ?? 1) : 1);

  function noiseBuf(type) {
    const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (type === 'pink') { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 2.2; }
      else d[i] = w;
    }
    return b;
  }
  function loopNoise(type, dest) { const s = ctx.createBufferSource(); s.buffer = noiseBuf(type); s.loop = true; s.connect(dest); s.start(); return s; }
  function impulse(sec) {
    const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }

  function start() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = enabled ? 1 : 0; master.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(2.6); const rg = ctx.createGain(); rg.gain.value = 0.35; reverb.connect(rg); rg.connect(master);
    for (const c of CHANNELS) { const g = ctx.createGain(); g.gain.value = gainOf(c.id); g.connect(master); ch[c.id] = g; }

    /* mưa: nhiễu hồng lọc dải + giọt lách tách */
    { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.5; const g = ctx.createGain(); g.gain.value = 0.5; f.connect(g); g.connect(ch.rain); loopNoise('pink', f);
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 500; const g2 = ctx.createGain(); g2.gain.value = 0.5; f2.connect(g2); g2.connect(ch.rain); loopNoise('brown', f2);
      setInterval(() => { if (!vol.rain || !enabled) return; for (let i = 0; i < 3; i++) drop(); }, 120); }
    /* gió: nhiễu nâu, âm lượng lên xuống chậm */
    { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; const g = ctx.createGain(); g.gain.value = 0.25; f.connect(g); g.connect(ch.nature); loopNoise('brown', f);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      setInterval(() => { if (vol.nature && enabled && Math.random() < 0.45) bird(); }, 2600); }
    /* thư viện: tiếng nền phòng + lật trang + gõ phím thưa */
    { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; const g = ctx.createGain(); g.gain.value = 0.18; f.connect(g); g.connect(ch.library); loopNoise('brown', f);
      setInterval(() => { if (!vol.library || !enabled) return; const r = Math.random(); if (r < 0.18) page(); else if (r < 0.32) typing(); else if (r < 0.36) chair(); }, 2200); }
    /* piano: vòng hợp âm nhẹ nhàng */
    pianoLoop();
  }

  const now = () => ctx.currentTime;
  function env(dest, t, a, peak, d) { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(dest); return g; }
  function burst(dest, dur, freq, q, peak, type = 'bandpass') {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf('white'); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const t = now(); const g = env(dest, t, 0.003, peak, dur); s.connect(f); f.connect(g); s.start(t, Math.random() * 2, dur + 0.05);
  }
  function drop() { burst(ch.rain, 0.03 + Math.random() * 0.04, 2500 + Math.random() * 4000, 4, 0.08 + Math.random() * 0.1); }
  function page() { const t0 = 0.25 + Math.random() * 0.2; burst(ch.library, t0, 3000, 0.6, 0.12, 'highpass'); }
  function chair() { burst(ch.library, 0.18, 180, 2, 0.15); }
  function typing() { const n = 4 + Math.random() * 10 | 0; for (let i = 0; i < n; i++) setTimeout(() => burst(ch.library, 0.02, 2200 + Math.random() * 1500, 3, 0.06), i * (80 + Math.random() * 90)); }
  function bird() {
    const t = now(), n = 2 + Math.random() * 4 | 0, base = 2600 + Math.random() * 1800, pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(ch.nature); }
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(); o.type = 'sine'; const st = t + i * (0.11 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base, st); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), st + 0.05); o.frequency.exponentialRampToValueAtTime(base * 0.9, st + 0.09);
      const g = env(pan || ch.nature, st, 0.01, 0.05, 0.09); o.connect(g); o.start(st); o.stop(st + 0.12);
    }
  }
  function note(freq, t, dur, peak, dest) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 2.001;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    const g = env(f, t, 0.008, peak, dur), g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2); g2.connect(g); f.connect(dest); f.connect(reverb); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  function pianoLoop() {
    const prog = [[48, 55, 59, 64, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62]];  // Cmaj7 Am7 Fmaj7 G6
    const mel = [76, 74, 72, 71, 72, 67, 69, 72, 74, 76, 79, 76];
    let bar = 0;
    const tick = () => {
      if (ctx && vol.piano && enabled) {
        const t = now() + 0.05, c = prog[bar % 4];
        c.forEach((m, i) => note(midi(m), t + i * 0.09, 3.2, 0.06, ch.piano));
        for (let k = 0; k < 3; k++) if (Math.random() < 0.6) note(midi(mel[Math.random() * mel.length | 0]), t + 0.9 + k * 1.05 + Math.random() * 0.2, 1.6, 0.045, ch.piano);
      }
      bar++; setTimeout(tick, 4200);
    };
    tick();
  }
  /* âm báo */
  function chime(kind) {
    if (!ctx || !enabled || !vol.fx) return;
    const t = now() + 0.02, seq = { quiz: [76, 81], correct: [72, 76, 79, 84], wrong: [64, 60], remind: [79, 74, 79], msg: [84], cheer: [79, 84, 88] }[kind] || [80];
    seq.forEach((m, i) => note(midi(m), t + i * 0.12, 0.9, 0.12, ch.fx));
  }

  window.Sound = {
    CHANNELS, vol, get enabled() { return enabled; },
    toggle(on) {
      enabled = on == null ? !enabled : on; U.store.set('audio:on', enabled);
      start(); if (ctx.state === 'suspended') ctx.resume();
      master.gain.setTargetAtTime(enabled ? 1 : 0, now(), 0.2);
      return enabled;
    },
    setVol(id, v) { vol[id] = v; U.store.set('audio:vol', vol); if (ch[id]) ch[id].gain.setTargetAtTime(gainOf(id), now(), 0.15); },
    setPlace(p) { place = p; if (ctx) for (const c of CHANNELS) ch[c.id].gain.setTargetAtTime(gainOf(c.id), now(), 1.2); },
    get byPlace() { return byPlace; },
    setByPlace(on) { byPlace = on; U.store.set('audio:place', on); this.setPlace(place); },
    unlock() { if (enabled) { start(); if (ctx.state === 'suspended') ctx.resume(); } },
    chime
  };
})();
