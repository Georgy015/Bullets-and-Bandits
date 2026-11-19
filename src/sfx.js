// Synthesized sound effects, so the draft needs no audio files. Replace with recorded
// samples later for a better feel. Background music is a looping track streamed from public/audio.

let ctx = null;
let master = null;
let noise = null;
let muted = false;
let adMuted = false;
let sfxVolume = 1; // effects slider, 0..1
const SFX_GAIN = 0.5;

// Music: "Covert Affair" by Kevin MacLeod (incompetech.com), CC BY 4.0. Streamed with an <audio>
// element so a long track isn't decoded into memory. It starts on the first tap (browsers block
// autoplay) and pauses while muted, during ads and while the tab is hidden.
const MUSIC_URL = 'audio/music.mp3';
const MUSIC_VOLUME = 0.18;
let music = null;
let musicWanted = false;

function updateMusic() {
  if (!music) return;
  const play = musicWanted && !muted && !adMuted && !document.hidden;
  if (play && music.paused) music.play().catch(() => {});
  else if (!play && !music.paused) music.pause();
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', updateMusic);

export function startMusic() {
  if (typeof Audio === 'undefined') return;
  if (!music) {
    music = new Audio(MUSIC_URL);
    music.loop = true;
    music.volume = MUSIC_VOLUME;
  }
  musicWanted = true;
  updateMusic();
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted || adMuted ? 0 : SFX_GAIN * sfxVolume;
  master.connect(ctx.destination);
  loadSamples();
  const len = ctx.sampleRate;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

// Recorded samples (public/audio), decoded once the audio context exists. Until a sample has loaded,
// or if it fails to, the synthesized version plays instead.
const SAMPLE_FILES = {
  glass: 'audio/glass.mp3', // "hard glass break 3" by elevatorfan2020 (freesound.org #861044)
  revolver: 'audio/revolver.mp3', // "glock 19x" by areniporgen (freesound.org #828786)
  rifle: 'audio/rifle.mp3', // AK-47 shot by serutonin-deprivd (freesound.org #855843)
  shotgun: 'audio/shotgun.mp3', // the same recording cut short, so the echo dies away quickly
  explosion: 'audio/explosion.mp3', // first second of "explosion2" by idkmrgarcia (freesound.org #446624)
  bodyfall: 'audio/bodyfall.mp3', // "bodyfall" by magnuswaker (freesound.org #614064)
  grunt: 'audio/grunt.mp3', // "young man being hurt" by pepsimanfan (freesound.org #546123)
  reload: 'audio/reload.mp3', // "shotgun cock reload layered powerful" by paul368 (freesound.org #200966)
};
const samples = {};

function loadSamples() {
  for (const [name, url] of Object.entries(SAMPLE_FILES)) {
    fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b))
      .then((buf) => { samples[name] = buf; }).catch(() => {});
  }
}

// Play a loaded sample with a little random pitch so repeats don't sound identical.
function sample(name, gain = 0.8) {
  const buf = samples[name];
  if (!buf || !ensure()) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.92 + Math.random() * 0.16;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(master);
  src.start();
  return true;
}

// Browsers only allow audio after a user gesture; call this from any input handler.
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
  startMusic();
}

function applyVolume() {
  if (master) master.gain.value = muted || adMuted ? 0 : SFX_GAIN * sfxVolume;
  updateMusic();
}

// Effects volume from the menu slider (0..1); the music keeps its own level.
export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
  applyVolume();
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
  // `enemy` shots play a little quieter, as if from across the street.
  shot(kind = 'revolver', enemy = false) {
    if ((kind === 'revolver' || kind === 'dual') && sample('revolver', enemy ? 0.2 : 0.3)) return;
    if (kind === 'rifle' && sample('rifle', enemy ? 0.2 : 0.3)) return;
    // the shotgun reuses the rifle recording with a short echo, 20% quieter
    if (kind === 'shotgun' && sample('shotgun', enemy ? 0.16 : 0.24)) return;
    if (kind === 'shotgun') burst({ dur: 0.4, freq: 900, gain: 1, decay: 0.35 });
    else if (kind === 'rifle') { burst({ dur: 0.35, freq: 2400, gain: 0.9, decay: 0.3 }); tone({ freq: 160, to: 40, dur: 0.2, gain: 0.4, type: 'sine' }); }
    else if (kind === 'dynamite') tone({ freq: 500, to: 900, dur: 0.12, gain: 0.15, type: 'triangle' });
    else burst({ dur: 0.25, freq: 1800, gain: 0.8, decay: 0.2 });
  },
  hit() { tone({ freq: 180, to: 60, dur: 0.12, gain: 0.5, type: 'sine' }); burst({ dur: 0.08, freq: 600, gain: 0.4 }); },
  headshot() { this.hit(); tone({ freq: 1400, to: 1900, dur: 0.12, gain: 0.15, type: 'triangle', delay: 0.04 }); },
  ricochet() { tone({ freq: 2600, to: 900, dur: 0.25, gain: 0.08, type: 'sine' }); },
  // A pained grunt when a bullet hits someone. Shotgun pellets and twin revolvers land several hits
  // at once, so it plays at most once every 0.25 s.
  grunt() {
    const t = performance.now();
    if (t - (this.lastGrunt ?? 0) < 250) return;
    this.lastGrunt = t;
    sample('grunt', 0.9); // loud enough to cut through the gunshot's echo
  },
  bodyfall() { sample('bodyfall', 0.5); },
  explosion() { if (sample('explosion', 0.25)) return; burst({ dur: 0.9, freq: 400, gain: 1.2, decay: 0.85 }); tone({ freq: 90, to: 30, dur: 0.5, gain: 0.6, type: 'sine' }); },
  coin() { tone({ freq: 988, dur: 0.07, gain: 0.12 }); tone({ freq: 1319, dur: 0.15, gain: 0.12, delay: 0.07 }); },
  click() { tone({ freq: 660, to: 520, dur: 0.06, gain: 0.12, type: 'triangle' }); },
  bell() { tone({ freq: 880, dur: 0.9, gain: 0.25, type: 'sine' }); tone({ freq: 1320, dur: 0.6, gain: 0.1, type: 'sine' }); },
  // kept very quiet: a background cue, not a gunshot
  reload() { if (sample('reload', 0.08)) return; [0, 0.12, 0.24].forEach((d) => tone({ freq: 900, to: 700, dur: 0.04, gain: 0.1, type: 'square', delay: d })); },
  reloaded() { tone({ freq: 500, to: 300, dur: 0.06, gain: 0.18, type: 'square' }); tone({ freq: 1200, dur: 0.05, gain: 0.1, type: 'square', delay: 0.08 }); },
  empty() { tone({ freq: 1400, to: 1100, dur: 0.03, gain: 0.12, type: 'square' }); },
  glass() {
    if (sample('glass', 1.08)) return;
    burst({ dur: 0.25, freq: 5200, q: 2, gain: 0.5, type: 'bandpass', decay: 0.22 });
    [2400, 3100, 3900].forEach((f, i) => tone({ freq: f, to: f * 0.9, dur: 0.12, gain: 0.05, type: 'sine', delay: 0.02 + i * 0.04 }));
  },
  tick() { tone({ freq: 300, dur: 0.05, gain: 0.08, type: 'square' }); },
  hurt() { tone({ freq: 220, to: 90, dur: 0.25, gain: 0.35, type: 'sawtooth' }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.18, gain: 0.15, type: 'triangle', delay: i * 0.1 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone({ freq: f, dur: 0.3, gain: 0.15, type: 'triangle', delay: i * 0.18 })); },
};

export const musicPlaying = () => !!music && !music.paused;
