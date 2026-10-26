import { FONT, FONT_UI } from './config.js';
import Phaser from 'phaser';
import { sfx, unlockAudio } from './sfx.js';

export const COLORS = {
  green: [0x4cc75a, 0x2f8f3b],
  yellow: [0xf6c343, 0xb8860b],
  blue: [0x3d8bfd, 0x2457a8],
  red: [0xe0533d, 0x9c2f20],
  gray: [0x7d7d8a, 0x4b4b55],
  wood: [0x9b6a3d, 0x5e3b1e],
};

// Old-movie-title ink for the title font: lighter at the top and darker at the bottom, with fine grain,
// irregular chipped patches where the ink has worn away and hairline cracks. Patterns are cached per
// colour and size and generated from a fixed seed, so every "FAST GUN" looks the same.
const wornCache = new Map();
export function wornFill(colour, size) {
  const key = `${colour}|${size}`;
  if (wornCache.has(key)) return wornCache.get(key);
  const h = Math.ceil(size * 1.45); // one line of text
  const w = 512;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  let seed = 1234567;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // smooth value noise, tiling horizontally so the pattern repeats without a seam
  const layer = (cell) => {
    const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell) + 1;
    const grid = Array.from({ length: gh + 1 }, () => Array.from({ length: gw }, rnd));
    return (x, y) => {
      const gx = x / cell, gy = y / cell;
      const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const g = (xx, yy) => grid[yy][xx % gw];
      const top = g(x0, y0) + (g(x0 + 1, y0) - g(x0, y0)) * sx;
      const bot = g(x0, y0 + 1) + (g(x0 + 1, y0 + 1) - g(x0, y0 + 1)) * sx;
      return top + (bot - top) * sy;
    };
  };
  const big = layer(Math.max(6, size * 0.3)), small = layer(Math.max(3, size * 0.09));
  const base = Phaser.Display.Color.HexStringToColor(colour);
  const ink = [42, 20, 8];
  // small text gets only the grain and shading, so it stays readable
  const threshold = size >= 40 ? 0.62 : size >= 30 ? 0.7 : 2;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const shadeY = 1.14 - 0.42 * (y / h); // lighter top, darker bottom
    for (let x = 0; x < w; x++) {
      const n = big(x, y) * 0.65 + small(x, y) * 0.35;
      const grain = 0.9 + rnd() * 0.2;
      // worn patches: the dark under-layer shows through where the noise peaks
      const wear = Math.min(0.85, Math.max(0, (n - threshold) * 7));
      const f = shadeY * grain;
      const o = (y * w + x) * 4;
      img.data[o] = Math.min(255, base.red * f) * (1 - wear) + ink[0] * wear;
      img.data[o + 1] = Math.min(255, base.green * f) * (1 - wear) + ink[1] * wear;
      img.data[o + 2] = Math.min(255, base.blue * f) * (1 - wear) + ink[2] * wear;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // hairline cracks that wander and fork
  if (size >= 30) {
    ctx.strokeStyle = 'rgba(42, 20, 8, 0.85)';
    ctx.lineCap = 'round';
    const crack = (x, y, a, steps, width) => {
      ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < steps; k++) {
        a += (rnd() - 0.5) * 1.2;
        x += Math.cos(a) * size * 0.1; y += Math.sin(a) * size * 0.1;
        ctx.lineTo(x, y);
        if (rnd() < 0.18 && width > 1) {
          ctx.stroke();
          crack(x, y, a + (rnd() < 0.5 ? 0.9 : -0.9), Math.ceil(steps / 2), width * 0.6);
          ctx.lineWidth = width;
          ctx.beginPath(); ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    };
    for (let i = 0; i < w / 110; i++) crack(rnd() * w, rnd() * h, rnd() * Math.PI * 2, 7, Math.max(1.2, size / 40));
  }
  const pattern = ctx.createPattern(cv, 'repeat');
  wornCache.set(key, pattern);
  return pattern;
}

export function text(scene, x, y, str, size = 28, opts = {}) {
  const colour = opts.color ?? '#fff4dc';
  return scene.add.text(x, y, str, {
    fontFamily: opts.ui ? FONT_UI : FONT,
    fontStyle: opts.ui ? 'bold' : '',
    fontSize: `${size}px`,
    color: opts.ui || opts.worn === false ? colour : wornFill(colour, size),
    stroke: opts.stroke ?? '#2a1408',
    strokeThickness: opts.strokeThickness ?? Math.max(3, Math.round(size / 7)),
    align: 'center',
    ...opts.style,
  }).setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
}

// A chunky rounded button. `onClick` fires on release inside the button.
export function button(scene, x, y, w, h, label, color, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (col) => {
    const [top, bottom] = COLORS[col] ?? COLORS.green;
    g.clear();
    g.fillStyle(0x1a0d05, 0.55); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 5, w, h, 12);
    g.fillStyle(bottom); g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillStyle(top); g.fillRoundedRect(-w / 2, -h / 2, w, h - 6, 12);
    g.fillStyle(0xffffff, 0.18); g.fillRoundedRect(-w / 2 + 6, -h / 2 + 4, w - 12, (h - 6) / 2.4, 8);
  };
  draw(color);
  const t = text(scene, 0, -3, label, opts.size ?? Math.min(30, h * 0.48), { ui: opts.ui ?? false });
  c.add([g, t]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  let pressed = false;
  c.on('pointerdown', () => { pressed = true; c.setScale(0.95); unlockAudio(); });
  c.on('pointerout', () => { pressed = false; c.setScale(1); });
  c.on('pointerup', () => {
    c.setScale(1);
    if (!pressed || c.disabled) return;
    pressed = false;
    sfx.click();
    onClick();
  });
  c.label = t;
  c.setColor = (col) => draw(col);
  c.setLabel = (s) => t.setText(s);
  return c;
}

export function panel(scene, x, y, w, h, alpha = 0.72) {
  const g = scene.add.graphics();
  g.fillStyle(0x1b0f24, alpha);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(3, 0xf2d38b, 0.35);
  g.strokeRoundedRect(x, y, w, h, 16);
  return g;
}

export function coinCounter(scene, x, y, value) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(0x1b0f24, 0.75);
  bg.fillRoundedRect(-90, -24, 180, 48, 24);
  bg.lineStyle(3, 0xf8d24a, 0.6);
  bg.strokeRoundedRect(-90, -24, 180, 48, 24);
  const icon = scene.add.image(-62, 0, 'coin').setScale(1.15);
  const t = text(scene, 14, 0, `${value}`, 28, { ui: true, color: '#ffe48a' });
  c.add([bg, icon, t]);
  c.icon = icon;
  c.set = (v) => t.setText(`${v}`);
  c.pop = () => scene.tweens.add({ targets: icon, scale: 1.5, duration: 90, yoyo: true });
  return c;
}

export function floatText(scene, x, y, str, color = '#ffffff', size = 30) {
  const t = text(scene, x, y, str, size, { color });
  t.setDepth(50);
  scene.tweens.add({
    targets: t, y: y - 70, alpha: 0, duration: 900, ease: 'Cubic.easeOut',
    onComplete: () => t.destroy(),
  });
  return t;
}

// Big centered announcement that stamps in and fades out.
export function banner(scene, str, color = '#ffe48a', size = 84, hold = 600) {
  // Only one banner at a time: a new one replaces whatever is still fading out.
  if (scene.lastBanner?.scene) {
    scene.tweens.killTweensOf(scene.lastBanner);
    scene.lastBanner.destroy();
  }
  const t = text(scene, 640, 300, str, size, { color, strokeThickness: 10 });
  scene.lastBanner = t;
  t.setDepth(60).setScale(2.2).setAlpha(0);
  scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: t, alpha: 0, scale: 1.15, delay: 180 + hold, duration: 260,
    onComplete: () => t.destroy(),
  });
  return t;
}

export function bar(scene, x, y, w, h, color, label) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(0x120914, 0.8); bg.fillRoundedRect(0, 0, w, h, h / 2);
  const fg = scene.add.graphics();
  c.add([bg, fg]);
  if (label) c.add(text(scene, 4, -12, label, 15, { ui: true, ox: 0 }));
  c.set = (pct) => {
    fg.clear();
    const p = Math.max(0, Math.min(1, pct));
    if (p <= 0) return;
    fg.fillStyle(color); fg.fillRoundedRect(3, 3, Math.max(h - 6, (w - 6) * p), h - 6, (h - 6) / 2);
    fg.fillStyle(0xffffff, 0.25); fg.fillRoundedRect(6, 4, Math.max(1, (w - 12) * p), (h - 6) / 3, 2);
  };
  c.set(1);
  return c;
}
