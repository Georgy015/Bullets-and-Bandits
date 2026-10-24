// Procedural art for the draft: backgrounds, props and small sprites are drawn in code,
// so the prototype needs no image files. Swap any of these for real art later by loading
// a texture under the same key.

import { GROUND_Y } from './config.js';

export function createSpriteTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const make = (key, w, h, draw) => {
    if (scene.textures.exists(key)) return;
    g.clear();
    draw(g);
    g.generateTexture(key, w, h);
  };

  make('bullet', 16, 6, (q) => { q.fillStyle(0xffe9a8); q.fillEllipse(8, 3, 16, 6); });
  make('pellet', 8, 8, (q) => { q.fillStyle(0xffe9a8); q.fillCircle(4, 4, 4); });
  make('stick', 30, 12, (q) => {
    q.fillStyle(0xc0392b); q.fillRoundedRect(0, 1, 24, 10, 3);
    q.fillStyle(0xf2e2b6); q.fillRect(9, 1, 4, 10);
    q.lineStyle(2, 0x3a2a1a); q.lineBetween(24, 6, 30, 3);
  });
  make('bottle', 16, 46, (q) => {
    q.fillStyle(0x2f7d4a); q.fillRoundedRect(1, 16, 14, 30, 4);
    q.fillRect(5, 4, 6, 14);
    q.fillStyle(0x7a4a26); q.fillRect(4, 0, 8, 5);
    q.fillStyle(0xf2e2b6); q.fillRect(2, 26, 12, 10);
    q.fillStyle(0xffffff, 0.35); q.fillRect(3, 18, 3, 24);
  });
  make('spark', 8, 8, (q) => { q.fillStyle(0xffffff); q.fillCircle(4, 4, 4); });
  make('dust', 16, 16, (q) => { q.fillStyle(0xd9b48a); q.fillCircle(8, 8, 8); });
  make('blood', 8, 8, (q) => { q.fillStyle(0xd23a2a); q.fillCircle(4, 4, 4); });
  make('coin', 28, 28, (q) => {
    q.fillStyle(0xb8860b); q.fillCircle(14, 14, 14);
    q.fillStyle(0xf8d24a); q.fillCircle(14, 14, 11);
    q.fillStyle(0xb8860b); q.fillRect(12, 7, 4, 14);
  });
  make('skull', 30, 30, (q) => {
    q.fillStyle(0xe8e0cc); q.fillCircle(15, 12, 11); q.fillRoundedRect(8, 16, 14, 11, 3);
    q.fillStyle(0x1a1020); q.fillCircle(11, 13, 3.4); q.fillCircle(19, 13, 3.4);
    q.fillRect(11, 23, 2, 4); q.fillRect(15, 23, 2, 4);
  });
  make('warn', 44, 40, (q) => {
    q.fillStyle(0xd62828); q.fillTriangle(22, 0, 44, 40, 0, 40);
    q.fillStyle(0xffffff); q.fillRect(19.5, 11, 5, 16); q.fillRect(19.5, 31, 5, 5);
  });
  make('star', 30, 30, (q) => {
    q.fillStyle(0xf8d24a);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6 : 14;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push({ x: 15 + Math.cos(a) * r, y: 15 + Math.sin(a) * r });
    }
    q.fillPoints(pts, true);
  });

  // Perk pickups
  make('perk-whiskey', 40, 48, (q) => {
    q.fillStyle(0x6b3a12); q.fillRoundedRect(8, 14, 24, 32, 6);
    q.fillRect(15, 2, 10, 14);
    q.fillStyle(0x2b1a10); q.fillRect(14, 0, 12, 5);
    q.fillStyle(0xf2e2b6); q.fillRect(10, 24, 20, 12);
    q.fillStyle(0x8c3b2a); q.fillRect(13, 28, 14, 4);
    q.fillStyle(0xffffff, 0.3); q.fillRect(11, 16, 4, 26);
  });
  make('perk-vest', 44, 44, (q) => {
    q.fillStyle(0x5d6670); q.fillRoundedRect(4, 4, 36, 38, 8);
    q.fillStyle(0x9aa4ae); q.fillRoundedRect(7, 7, 30, 32, 6);
    q.fillStyle(0xc9d2dc); q.fillRoundedRect(10, 10, 24, 10, 4);
    q.fillStyle(0x12090f); q.fillRect(17, 2, 10, 8);
    q.fillStyle(0x5d6670); [[12, 34], [32, 34], [12, 24], [32, 24]].forEach(([x, y]) => q.fillCircle(x, y, 2));
  });
  make('perk-powder', 44, 44, (q) => {
    q.fillStyle(0x6e4126); q.fillRoundedRect(6, 6, 32, 36, 8);
    q.fillStyle(0x3a2212); q.fillRect(6, 12, 32, 4); q.fillRect(6, 32, 32, 4);
    q.fillStyle(0x1a1a1a); q.fillRoundedRect(16, 0, 12, 8, 3);
    q.fillStyle(0xf2e2b6); q.fillRect(13, 19, 18, 10);
    q.fillStyle(0xb03a2e); q.fillRect(16, 22, 3, 4); q.fillRect(21, 22, 3, 4); q.fillRect(26, 22, 3, 4);
  });
  make('perk-coffee', 44, 44, (q) => {
    q.fillStyle(0x4a6b8a); q.fillRoundedRect(6, 12, 26, 28, 5);
    q.lineStyle(5, 0x4a6b8a); q.strokeCircle(34, 25, 7);
    q.fillStyle(0x3b2414); q.fillEllipse(19, 14, 22, 6);
    q.fillStyle(0xffffff, 0.6); q.fillCircle(14, 6, 3); q.fillCircle(20, 3, 3); q.fillCircle(25, 7, 2.5);
  });
  make('perk-horseshoe', 44, 44, (q) => {
    q.lineStyle(8, 0xb8bec4); q.beginPath(); q.arc(22, 20, 14, Math.PI * 0.05, Math.PI * 0.95, true); q.strokePath();
    q.fillStyle(0xb8bec4); q.fillRect(4, 18, 8, 22); q.fillRect(32, 18, 8, 22);
    q.fillStyle(0x5d6670); [[8, 26], [8, 34], [36, 26], [36, 34], [16, 9], [28, 9]].forEach(([x, y]) => q.fillCircle(x, y, 1.8));
  });
  make('glow', 80, 80, (q) => {
    for (let r = 40; r > 0; r -= 4) { q.fillStyle(0xfff2c4, 0.05); q.fillCircle(40, 40, r); }
  });
  g.destroy();
}

// Where a gunslinger can stand. Returns the Graphics and the standing height.
export const PERCH_TOP = {
  street: GROUND_Y,
  crates: GROUND_Y - 92,
  balcony: GROUND_Y - 170,
  rooftop: GROUND_Y - 230,
  tower: GROUND_Y - 250,
};

const WOOD = 0x7b4a2a;
const WOOD_DARK = 0x4e2d17;
const WOOD_LIGHT = 0xa0683d;

// Rock pillar or ledge for the desert and canyon, standing in for buildings.
function drawRock(g, x, top, light, dark) {
  const half = top < GROUND_Y - 200 ? 70 : 85;
  g.fillStyle(dark);
  g.fillPoints([
    { x: x - half - 40, y: GROUND_Y }, { x: x - half - 10, y: top + 60 }, { x: x - half, y: top + 8 },
    { x: x + half, y: top + 4 }, { x: x + half + 14, y: top + 70 }, { x: x + half + 44, y: GROUND_Y },
  ], true);
  g.fillStyle(light);
  g.fillPoints([
    { x: x - half - 20, y: GROUND_Y }, { x: x - half + 4, y: top + 40 }, { x: x - half + 10, y: top + 14 },
    { x: x + half - 10, y: top + 10 }, { x: x + half, y: top + 60 }, { x: x + half + 24, y: GROUND_Y },
  ], true);
  g.fillStyle(dark, 0.45);
  for (let yy = top + 50; yy < GROUND_Y - 10; yy += 46) g.fillRect(x - half, yy, half * 2 + 10, 8);
  g.fillStyle(dark); g.fillRect(x - half - 4, top, half * 2 + 8, 12);
}

// Red boxcar whose roof is the standing spot (station area).
function drawBoxcar(g, x, top) {
  g.fillStyle(0x6e2e24); g.fillRect(x - 120, top + 8, 240, GROUND_Y - top - 36);
  g.fillStyle(0x5a241c);
  for (let xx = x - 112; xx < x + 120; xx += 24) g.fillRect(xx, top + 14, 4, GROUND_Y - top - 48);
  g.fillStyle(0x3a1812); g.fillRect(x - 34, top + 30, 68, GROUND_Y - top - 70);
  g.fillStyle(0x2b2b33); g.fillRect(x - 128, top, 256, 12);
  g.fillRect(x - 110, GROUND_Y - 30, 220, 8);
  g.fillStyle(0x1c1c22);
  [x - 90, x - 55, x + 55, x + 90].forEach((wx) => g.fillCircle(wx, GROUND_Y - 14, 14));
}

export function drawPerch(scene, type, x, biome = 'town') {
  const top = PERCH_TOP[type];
  const g = scene.add.graphics();
  if ((biome === 'desert' || biome === 'canyon') && (type === 'balcony' || type === 'rooftop')) {
    if (biome === 'desert') drawRock(g, x, top, 0xb8683f, 0x7a3e28);
    else drawRock(g, x, top, 0x9a4430, 0x5e2a1f);
    return { g, top };
  }
  if (biome === 'station' && type === 'balcony') {
    drawBoxcar(g, x, top);
    return { g, top };
  }
  if (type === 'crates') {
    const crate = (cx, cy, s) => {
      g.fillStyle(WOOD); g.fillRect(cx - s / 2, cy - s, s, s);
      g.lineStyle(4, WOOD_DARK); g.strokeRect(cx - s / 2, cy - s, s, s);
      g.lineBetween(cx - s / 2, cy - s, cx + s / 2, cy);
    };
    crate(x - 26, GROUND_Y, 50);
    crate(x + 26, GROUND_Y, 50);
    crate(x, GROUND_Y - 46, 46);
    g.fillStyle(WOOD_LIGHT); g.fillRect(x - 36, top - 4, 72, 6);
  } else if (type === 'balcony') {
    // Saloon facade with a balcony to stand on
    g.fillStyle(0x8c5632); g.fillRect(x - 140, top - 170, 280, GROUND_Y - top + 170);
    g.fillStyle(0x6e4126);
    for (let yy = top - 160; yy < GROUND_Y; yy += 16) g.fillRect(x - 140, yy, 280, 3);
    g.fillStyle(0x3a2212); g.fillRect(x - 150, top - 190, 300, 24);
    g.fillStyle(0xf2d38b); g.fillRect(x - 70, top - 150, 140, 40);
    g.fillStyle(0x5a1e14); g.fillRect(x - 66, top - 146, 132, 32);
    // Swinging doors
    g.fillStyle(0x24140b); g.fillRect(x - 38, GROUND_Y - 90, 76, 90);
    g.fillStyle(WOOD_LIGHT); g.fillRect(x - 34, GROUND_Y - 70, 32, 40); g.fillRect(x + 2, GROUND_Y - 70, 32, 40);
    // Windows
    g.fillStyle(0xf4c46a); g.fillRect(x - 120, GROUND_Y - 100, 50, 50); g.fillRect(x + 70, GROUND_Y - 100, 50, 50);
    // Balcony deck and posts
    g.fillStyle(WOOD_DARK); g.fillRect(x - 160, top, 320, 14);
    g.fillRect(x - 155, top + 14, 10, GROUND_Y - top - 14); g.fillRect(x + 145, top + 14, 10, GROUND_Y - top - 14);
  } else if (type === 'rooftop') {
    const station = biome === 'station';
    g.fillStyle(station ? 0x3e4a66 : 0x5b3a52); g.fillRect(x - 120, top, 240, GROUND_Y - top);
    g.fillStyle(station ? 0x2c3550 : 0x47293f); g.fillRect(x - 130, top - 8, 260, 14);
    g.fillStyle(0xf4c46a);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      if ((i + j) % 2 === 0) g.fillRect(x - 90 + i * 70, top + 40 + j * 75, 40, 45);
    }
    g.fillStyle(0x2d1a28);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      if ((i + j) % 2 === 1) g.fillRect(x - 90 + i * 70, top + 40 + j * 75, 40, 45);
    }
  } else if (type === 'tower') {
    // Water tower: tank behind, deck on top of the stand
    g.lineStyle(8, WOOD_DARK);
    g.lineBetween(x - 70, GROUND_Y, x - 55, top + 10);
    g.lineBetween(x + 70, GROUND_Y, x + 55, top + 10);
    g.lineStyle(5, WOOD);
    for (let yy = top + 60; yy + 70 <= GROUND_Y; yy += 80) {
      g.lineBetween(x - 66, yy + 70, x + 60, yy);
      g.lineBetween(x + 66, yy + 70, x - 60, yy);
    }
    g.fillStyle(WOOD_DARK); g.fillRect(x - 85, top, 170, 14);
  }
  return { g, top };
}

// Signpost marking a checkpoint; drawn at local x = 0.
export function drawCheckpoint(scene, meters) {
  const c = scene.add.container(0, GROUND_Y);
  const g = scene.add.graphics();
  g.fillStyle(WOOD_DARK); g.fillRect(-6, -190, 12, 190);
  g.fillStyle(WOOD); g.fillRect(-70, -180, 140, 50);
  g.lineStyle(4, WOOD_DARK); g.strokeRect(-70, -180, 140, 50);
  // Lantern
  g.fillStyle(0x2b1a10); g.fillRect(-3, -215, 6, 26);
  g.fillStyle(0xf4c46a); g.fillRoundedRect(-11, -232, 22, 24, 5);
  g.lineStyle(3, 0x2b1a10); g.strokeRoundedRect(-11, -232, 22, 24, 5);
  c.add(scene.add.image(0, -220, 'glow').setScale(1.4).setBlendMode('ADD'));
  c.add(g);
  const t = scene.add.text(0, -155, `CHECKPOINT\n${meters} m`, {
    fontFamily: 'Rye, Georgia, serif', fontSize: '17px', color: '#fff1cf', align: 'center',
    stroke: '#3a2212', strokeThickness: 3,
  }).setOrigin(0.5);
  c.add(t);
  return c;
}

// Barrel the Hider crouches behind; drawn at local (0, GROUND_Y) and placed in front of him.
export const BARREL = { w: 84, h: 112 };
export function drawBarrel(scene) {
  const g = scene.add.graphics();
  const { w, h } = BARREL;
  g.fillStyle(0x6e4126); g.fillRoundedRect(-w / 2, GROUND_Y - h, w, h, 14);
  g.fillStyle(0x8c5632);
  for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 8 + i * 19, GROUND_Y - h + 6, 10, h - 12);
  g.fillStyle(0x3a3a42);
  [GROUND_Y - h + 14, GROUND_Y - h / 2 - 4, GROUND_Y - 22].forEach((y) => g.fillRect(-w / 2, y, w, 8));
  g.fillStyle(0x2b1a10); g.fillEllipse(0, GROUND_Y - h + 4, w - 10, 12);
  return g;
}

// Props for the bonus shooting gallery, drawn at local x = 0 standing on the street.
// `top` = y the bottles stand on, `width` = usable surface, `cap` = max bottles.
export const PROPS = {
  barrel: { top: GROUND_Y - 112, width: 60, cap: 2 },
  crate: { top: GROUND_Y - 70, width: 60, cap: 2 },
  stack: { top: GROUND_Y - 140, width: 60, cap: 2 },
  fence: { top: GROUND_Y - 96, width: 150, cap: 3 },
  table: { top: GROUND_Y - 78, width: 110, cap: 3 },
  tower: { top: GROUND_Y - 192, width: 50, cap: 2 },
};

export function drawProp(scene, type) {
  if (type === 'barrel') return drawBarrel(scene);
  const g = scene.add.graphics();
  const crate = (cx, bottom, s) => {
    g.fillStyle(WOOD); g.fillRect(cx - s / 2, bottom - s, s, s);
    g.lineStyle(4, WOOD_DARK); g.strokeRect(cx - s / 2, bottom - s, s, s);
    g.lineBetween(cx - s / 2, bottom - s, cx + s / 2, bottom);
  };
  if (type === 'crate') crate(0, GROUND_Y, 70);
  else if (type === 'stack') { crate(0, GROUND_Y, 70); crate(0, GROUND_Y - 70, 70); }
  else if (type === 'tower') { crate(0, GROUND_Y, 64); crate(0, GROUND_Y - 64, 64); crate(0, GROUND_Y - 128, 64); }
  else if (type === 'fence') {
    g.fillStyle(WOOD_DARK);
    g.fillRect(-72, GROUND_Y - 110, 12, 110); g.fillRect(60, GROUND_Y - 110, 12, 110);
    g.fillStyle(WOOD); g.fillRect(-82, GROUND_Y - 96, 164, 12); g.fillRect(-82, GROUND_Y - 56, 164, 10);
  } else if (type === 'table') {
    g.fillStyle(WOOD_DARK); g.fillRect(-8, GROUND_Y - 74, 16, 74); g.fillRect(-36, GROUND_Y - 8, 72, 8);
    g.fillStyle(WOOD_LIGHT); g.fillEllipse(0, GROUND_Y - 78, 130, 18);
    g.fillStyle(WOOD); g.fillRect(-65, GROUND_Y - 78, 130, 6);
  }
  return g;
}
