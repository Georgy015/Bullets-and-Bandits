// Procedural art for the draft: backgrounds, props and small sprites are drawn in code,
// so the prototype needs no image files. Swap any of these for real art later by loading
// a texture under the same key.

import { GROUND_Y } from './config.js';
import { INK, shade, rect, rrect, circle, ellipse, poly, line } from './ink.js';

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
  make('flash', 44, 28, (q) => {
    q.fillStyle(0xffb347);
    q.fillPoints([{ x: 0, y: 14 }, { x: 16, y: 2 }, { x: 22, y: 9 }, { x: 44, y: 14 }, { x: 22, y: 19 }, { x: 16, y: 26 }], true);
    q.fillStyle(0xfff2c4);
    q.fillPoints([{ x: 4, y: 14 }, { x: 16, y: 7 }, { x: 34, y: 14 }, { x: 16, y: 21 }], true);
  });
  make('tumbleweed', 52, 52, (q) => {
    q.lineStyle(2.5, 0x8a6a3a);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      q.strokeEllipse(26, 26, 44 - (i % 3) * 8, 26 + (i % 2) * 14);
      q.lineBetween(26, 26, 26 + Math.cos(a) * 22, 26 + Math.sin(a) * 22);
    }
    q.lineStyle(2, 0x5e4422); q.strokeCircle(26, 26, 22);
  });
  make('vulture', 40, 16, (q) => {
    q.fillStyle(0x1c120c);
    q.fillTriangle(0, 4, 20, 10, 12, 14);
    q.fillTriangle(40, 4, 20, 10, 28, 14);
    q.fillCircle(20, 10, 3.5);
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

function crateAt(g, cx, bottom, size) {
  rect(g, WOOD, cx - size / 2, bottom - size, size, size, 2.6);
  rect(g, WOOD_LIGHT, cx - size / 2 + 5, bottom - size + 5, size - 10, size - 10, 0);
  line(g, WOOD_DARK, cx - size / 2 + 5, bottom - size + 5, cx + size / 2 - 5, bottom - 5, 4);
  line(g, INK, cx - size / 2 + 5, bottom - size + 5, cx + size / 2 - 5, bottom - size + 5, 1.2);
}

// Rock pillar or ledge for the desert and canyon, standing in for buildings.
function drawRock(g, x, top, light, dark) {
  const half = top < GROUND_Y - 200 ? 70 : 85;
  poly(g, dark, [
    { x: x - half - 40, y: GROUND_Y }, { x: x - half - 10, y: top + 60 }, { x: x - half, y: top + 8 },
    { x: x + half, y: top + 4 }, { x: x + half + 14, y: top + 70 }, { x: x + half + 44, y: GROUND_Y },
  ], 3);
  poly(g, light, [
    { x: x - half - 20, y: GROUND_Y }, { x: x - half + 4, y: top + 40 }, { x: x - half + 10, y: top + 14 },
    { x: x + half - 10, y: top + 10 }, { x: x + half, y: top + 60 }, { x: x + half + 24, y: GROUND_Y },
  ], 0);
  g.fillStyle(shade(light, 1.15)); g.fillTriangle(x - half + 10, top + 14, x - half + 40, top + 12, x - half - 14, GROUND_Y);
  g.fillStyle(dark, 0.45);
  for (let yy = top + 50; yy < GROUND_Y - 10; yy += 46) g.fillRect(x - half, yy, half * 2 + 10, 8);
  rect(g, dark, x - half - 4, top, half * 2 + 8, 12, 2.4);
}

// Red boxcar whose roof is the standing spot (station area).
function drawBoxcar(g, x, top) {
  rect(g, 0x6e2e24, x - 120, top + 8, 240, GROUND_Y - top - 36, 3);
  g.fillStyle(0x5a241c);
  for (let xx = x - 112; xx < x + 120; xx += 24) g.fillRect(xx, top + 14, 4, GROUND_Y - top - 48);
  rect(g, 0x3a1812, x - 34, top + 30, 68, GROUND_Y - top - 70, 2);
  line(g, 0x8a8a92, x - 30, top + 60, x + 30, top + 60, 3);
  rect(g, 0x2b2b33, x - 128, top, 256, 12, 2.4);
  rect(g, 0x2b2b33, x - 110, GROUND_Y - 30, 220, 8, 2);
  [x - 90, x - 55, x + 55, x + 90].forEach((wx) => { circle(g, 0x1c1c22, wx, GROUND_Y - 14, 14, 2.4); circle(g, 0x6a6a72, wx, GROUND_Y - 14, 4, 0); });
}

// Where a gunslinger can stand, styled for the area. Returns a container (placed at local
// x = `x`) and the standing height.
export function drawPerch(scene, type, x, biome = 'town') {
  const top = PERCH_TOP[type];
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  c.add(g);
  if ((biome === 'desert' || biome === 'canyon') && (type === 'balcony' || type === 'rooftop')) {
    if (biome === 'desert') drawRock(g, x, top, 0xb8683f, 0x7a3e28);
    else drawRock(g, x, top, 0x9a4430, 0x5e2a1f);
    return { g: c, top };
  }
  if (biome === 'station' && type === 'balcony') {
    drawBoxcar(g, x, top);
    return { g: c, top };
  }
  if (type === 'crates') {
    crateAt(g, x - 26, GROUND_Y, 50);
    crateAt(g, x + 26, GROUND_Y, 50);
    crateAt(g, x, GROUND_Y - 46, 46);
    rect(g, WOOD_LIGHT, x - 36, top - 4, 72, 6, 2);
  } else if (type === 'balcony') {
    // Saloon facade with a balcony to stand on
    rect(g, 0x8c5632, x - 140, top - 170, 280, GROUND_Y - top + 170, 3);
    g.fillStyle(0x6e4126);
    for (let yy = top - 160; yy < GROUND_Y; yy += 16) g.fillRect(x - 138, yy, 276, 3);
    rect(g, 0x3a2212, x - 150, top - 190, 300, 24, 3);
    rrect(g, 0xf2d38b, x - 74, top - 152, 148, 44, 4, 2.6);
    rect(g, 0x5a1e14, x - 68, top - 146, 136, 32, 0);
    c.add(scene.add.text(x, top - 130, 'SALOON', {
      fontFamily: 'Rye, Georgia, serif', fontSize: '24px', color: '#f2d38b', stroke: '#2a1408', strokeThickness: 3,
    }).setOrigin(0.5));
    // Swinging doors
    rect(g, 0x24140b, x - 38, GROUND_Y - 90, 76, 90, 2.4);
    rrect(g, WOOD_LIGHT, x - 34, GROUND_Y - 70, 32, 40, 3, 2);
    rrect(g, WOOD_LIGHT, x + 2, GROUND_Y - 70, 32, 40, 3, 2);
    // Lit windows with frames
    [x - 120, x + 70].forEach((wx) => {
      rect(g, 0xf4c46a, wx, GROUND_Y - 100, 50, 50, 2.6);
      line(g, 0x6e4126, wx + 25, GROUND_Y - 100, wx + 25, GROUND_Y - 50, 3);
      line(g, 0x6e4126, wx, GROUND_Y - 75, wx + 50, GROUND_Y - 75, 3);
    });
    // Balcony deck, railing and posts
    rect(g, WOOD_DARK, x - 160, top, 320, 14, 2.6);
    rect(g, WOOD_DARK, x - 155, top + 14, 10, GROUND_Y - top - 14, 2);
    rect(g, WOOD_DARK, x + 145, top + 14, 10, GROUND_Y - top - 14, 2);
  } else if (type === 'rooftop') {
    const station = biome === 'station';
    const wall = station ? 0x3e4a66 : 0x5b3a52;
    rect(g, wall, x - 120, top, 240, GROUND_Y - top, 3);
    g.fillStyle(shade(wall, 0.85)); g.fillRect(x - 118, top + 2, 30, GROUND_Y - top - 4);
    rect(g, station ? 0x2c3550 : 0x47293f, x - 130, top - 8, 260, 14, 2.6);
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const lit = (i + j) % 2 === 0;
        rect(g, lit ? 0xf4c46a : 0x2d1a28, x - 90 + i * 70, top + 40 + j * 75, 40, 45, 2.2);
        if (lit) line(g, shade(wall, 0.7), x - 70 + i * 70, top + 40 + j * 75, x - 70 + i * 70, top + 85 + j * 75, 2.5);
      }
    }
    if (!station) rect(g, 0x47293f, x + 50, top - 40, 22, 32, 2.2); // chimney
  } else if (type === 'tower') {
    // Water tower stand: legs, braces and a deck
    line(g, INK, x - 70, GROUND_Y, x - 55, top + 10, 11);
    line(g, INK, x + 70, GROUND_Y, x + 55, top + 10, 11);
    line(g, WOOD_DARK, x - 70, GROUND_Y, x - 55, top + 10, 7);
    line(g, WOOD_DARK, x + 70, GROUND_Y, x + 55, top + 10, 7);
    for (let yy = top + 60; yy + 70 <= GROUND_Y; yy += 80) {
      line(g, WOOD, x - 66, yy + 70, x + 60, yy, 5);
      line(g, WOOD, x + 66, yy + 70, x - 60, yy, 5);
    }
    rect(g, WOOD_DARK, x - 85, top, 170, 14, 2.6);
  }
  return { g: c, top };
}

// Signpost marking a checkpoint; drawn at local x = 0.
export function drawCheckpoint(scene, meters) {
  const c = scene.add.container(0, GROUND_Y);
  const g = scene.add.graphics();
  rect(g, WOOD_DARK, -6, -190, 12, 190, 2.4);
  rect(g, WOOD, -70, -180, 140, 50, 3);
  rect(g, WOOD_LIGHT, -64, -174, 128, 6, 0);
  // Lantern
  rect(g, 0x2b1a10, -3, -215, 6, 26, 1.6);
  rrect(g, 0xf4c46a, -11, -232, 22, 24, 5, 2.6);
  line(g, 0x2b1a10, 0, -232, 0, -208, 2);
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
export const BARREL = { w: 96, h: 128 };
export function drawBarrel(scene) {
  const g = scene.add.graphics();
  const { w, h } = BARREL;
  rrect(g, 0x6e4126, -w / 2, GROUND_Y - h, w, h, 14, 3);
  g.fillStyle(0x8c5632);
  for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 8 + i * ((w - 26) / 3), GROUND_Y - h + 6, 10, h - 12);
  g.fillStyle(0xffffff, 0.12); g.fillRect(-w / 2 + 10, GROUND_Y - h + 8, 8, h - 16);
  [GROUND_Y - h + 14, GROUND_Y - h / 2 - 4, GROUND_Y - 22].forEach((y) => rect(g, 0x3a3a42, -w / 2, y, w, 8, 1.8));
  ellipse(g, 0x2b1a10, 0, GROUND_Y - h + 4, w - 10, 12, 2);
  return g;
}

// Props for the bonus shooting gallery, drawn at local x = 0 standing on the street.
// `top` = y the bottles stand on, `width` = usable surface, `cap` = max bottles.
export const PROPS = {
  barrel: { top: GROUND_Y - BARREL.h, width: 60, cap: 2 },
  crate: { top: GROUND_Y - 70, width: 60, cap: 2 },
  stack: { top: GROUND_Y - 140, width: 60, cap: 2 },
  fence: { top: GROUND_Y - 96, width: 150, cap: 3 },
  table: { top: GROUND_Y - 78, width: 110, cap: 3 },
  tower: { top: GROUND_Y - 192, width: 50, cap: 2 },
};

export function drawProp(scene, type) {
  if (type === 'barrel') return drawBarrel(scene);
  const g = scene.add.graphics();
  const crate = (cx, bottom, size) => crateAt(g, cx, bottom, size);
  if (type === 'crate') crate(0, GROUND_Y, 70);
  else if (type === 'stack') { crate(0, GROUND_Y, 70); crate(0, GROUND_Y - 70, 70); }
  else if (type === 'tower') { crate(0, GROUND_Y, 64); crate(0, GROUND_Y - 64, 64); crate(0, GROUND_Y - 128, 64); }
  else if (type === 'fence') {
    rect(g, WOOD_DARK, -72, GROUND_Y - 110, 12, 110, 2.4);
    rect(g, WOOD_DARK, 60, GROUND_Y - 110, 12, 110, 2.4);
    rect(g, WOOD, -82, GROUND_Y - 96, 164, 12, 2.4);
    rect(g, WOOD, -82, GROUND_Y - 56, 164, 10, 2.4);
  } else if (type === 'table') {
    rect(g, WOOD_DARK, -8, GROUND_Y - 74, 16, 74, 2.4);
    rect(g, WOOD_DARK, -36, GROUND_Y - 8, 72, 8, 2.4);
    rect(g, WOOD, -65, GROUND_Y - 78, 130, 6, 2.2);
    ellipse(g, WOOD_LIGHT, 0, GROUND_Y - 80, 130, 18, 2.4);
  }
  return g;
}
