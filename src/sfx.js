// Synthesized sound effects, so the draft needs no audio files. Replace with recorded
// samples later for a better feel.

let ctx = null;
let master = null;
let noise = null;
let muted = false;
let adMuted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted || adMuted ? 0 : 0.5;
  master.connect(ctx.destination);
  const len = ctx.sampleRate;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

// Browsers only allow audio after a user gesture; call this from any input handler.
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

function applyVolume() {
  if (master) master.gain.value = muted || adMuted ? 0 : 0.5;
}

export function setMuted(m) {
  muted = m;
  applyVolume();
}

export function setAdMuted(m) {
  adMuted = m;
  applyVolume();
}

function burst({ dur = 0.2, freq = 1200, q = 0.8, gain = 0.8, type = 'lowpass', decay = dur }) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.7 + Math.random() * 0.6;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5, dur);
}

function tone({ freq = 440, to = freq, dur = 0.15, gain = 0.3, type = 'square', delay = 0 }) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  shot(kind = 'revolver') {
    if (kind === 'shotgun') burst({ dur: 0.4, freq: 900, gain: 1, decay: 0.35 });
    else if (kind === 'rifle') { burst({ dur: 0.35, freq: 2400, gain: 0.9, decay: 0.3 }); tone({ freq: 160, to: 40, dur: 0.2, gain: 0.4, type: 'sine' }); }
    else if (kind === 'dynamite') tone({ freq: 500, to: 900, dur: 0.12, gain: 0.15, type: 'triangle' });
    else burst({ dur: 0.25, freq: 1800, gain: 0.8, decay: 0.2 });
  },
  hit() { tone({ freq: 180, to: 60, dur: 0.12, gain: 0.5, type: 'sine' }); burst({ dur: 0.08, freq: 600, gain: 0.4 }); },
  headshot() { this.hit(); tone({ freq: 1400, to: 1900, dur: 0.12, gain: 0.15, type: 'triangle', delay: 0.04 }); },
  ricochet() { tone({ freq: 2600, to: 900, dur: 0.25, gain: 0.08, type: 'sine' }); },
  explosion() { burst({ dur: 0.9, freq: 400, gain: 1.2, decay: 0.85 }); tone({ freq: 90, to: 30, dur: 0.5, gain: 0.6, type: 'sine' }); },
  coin() { tone({ freq: 988, dur: 0.07, gain: 0.12 }); tone({ freq: 1319, dur: 0.15, gain: 0.12, delay: 0.07 }); },
  click() { tone({ freq: 660, to: 520, dur: 0.06, gain: 0.12, type: 'triangle' }); },
  bell() { tone({ freq: 880, dur: 0.9, gain: 0.25, type: 'sine' }); tone({ freq: 1320, dur: 0.6, gain: 0.1, type: 'sine' }); },
  reload() { [0, 0.12, 0.24].forEach((d) => tone({ freq: 900, to: 700, dur: 0.04, gain: 0.1, type: 'square', delay: d })); },
  reloaded() { tone({ freq: 500, to: 300, dur: 0.06, gain: 0.18, type: 'square' }); tone({ freq: 1200, dur: 0.05, gain: 0.1, type: 'square', delay: 0.08 }); },
  empty() { tone({ freq: 1400, to: 1100, dur: 0.03, gain: 0.12, type: 'square' }); },
  tick() { tone({ freq: 300, dur: 0.05, gain: 0.08, type: 'square' }); },
  hurt() { tone({ freq: 220, to: 90, dur: 0.25, gain: 0.35, type: 'sawtooth' }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.18, gain: 0.15, type: 'triangle', delay: i * 0.1 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone({ freq: f, dur: 0.3, gain: 0.15, type: 'triangle', delay: i * 0.18 })); },
};
