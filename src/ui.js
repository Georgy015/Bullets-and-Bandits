import { FONT, FONT_UI } from './config.js';
import { sfx, unlockAudio } from './sfx.js';

export const COLORS = {
  green: [0x4cc75a, 0x2f8f3b],
  yellow: [0xf6c343, 0xb8860b],
  blue: [0x3d8bfd, 0x2457a8],
  red: [0xe0533d, 0x9c2f20],
  gray: [0x7d7d8a, 0x4b4b55],
  wood: [0x9b6a3d, 0x5e3b1e],
};

export function text(scene, x, y, str, size = 28, opts = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: opts.ui ? FONT_UI : FONT,
    fontSize: `${size}px`,
    color: opts.color ?? '#fff4dc',
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
