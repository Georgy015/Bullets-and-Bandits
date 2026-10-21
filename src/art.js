// Procedural art for the draft: backgrounds, props and small sprites are drawn in code,
// so the prototype needs no image files. Swap any of these for real art later by loading
// a texture under the same key.

import { W, H, GROUND_Y } from './config.js';

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.context, w, h);
  tex.refresh();
}

export function createBackgroundTextures(scene) {
  canvasTexture(scene, 'sky', W, H, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#140b2b');
    g.addColorStop(0.45, '#35204f');
    g.addColorStop(0.8, '#8a3f4f');
    g.addColorStop(1, '#e0794a');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 140; i++) {
      c.globalAlpha = 0.3 + r() * 0.7;
      c.fillStyle = '#fff6dd';
      const s = r() < 0.1 ? 2.5 : 1.4;
      c.fillRect(r() * w, r() * GROUND_Y * 0.55, s, s);
    }
    c.globalAlpha = 1;
    const mx = 1030, my = 120;
    const glow = c.createRadialGradient(mx, my, 30, mx, my, 140);
    glow.addColorStop(0, 'rgba(255,240,200,0.35)');
    glow.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = glow;
    c.fillRect(mx - 150, my - 150, 300, 300);
    c.fillStyle = '#fbefc9';
    c.beginPath();
    c.arc(mx, my, 44, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(200,180,140,0.35)';
    [[-12, -8, 9], [14, 10, 6], [4, 22, 5]].forEach(([dx, dy, rr]) => {
      c.beginPath();
      c.arc(mx + dx, my + dy, rr, 0, Math.PI * 2);
      c.fill();
    });
  });

  // Far mesas, tileable horizontally.
  canvasTexture(scene, 'mesas', W, 240, (c, w, h) => {
    c.fillStyle = '#3a1d3f';
    c.beginPath();
    c.moveTo(0, h);
    const pts = [[0, 150], [90, 150], [120, 70], [260, 70], [290, 150], [430, 160], [470, 110], [560, 110], [590, 165], [760, 170], [800, 40], [960, 40], [1000, 160], [1130, 150], [1160, 95], [1240, 95], [1280, 150]];
    pts.forEach(([x, y]) => c.lineTo(x, y));
    c.lineTo(w, h);
    c.fill();
    c.fillStyle = 'rgba(255,140,90,0.12)';
    c.fillRect(0, 0, w, h);
  });

  // Town silhouette, tileable: every building sits fully inside the strip.
  canvasTexture(scene, 'town', W, 300, (c, w, h) => {
    const r = rng(42);
    let x = 10;
    while (x < w - 120) {
      const bw = 90 + Math.floor(r() * 90);
      const bh = 110 + Math.floor(r() * 150);
      const top = h - bh;
      c.fillStyle = r() < 0.5 ? '#24152f' : '#2b1a36';
      c.fillRect(x, top, bw, bh);
      // False-front facade step
      if (r() < 0.7) c.fillRect(x + 10, top - 22, bw - 20, 24);
      c.fillStyle = '#f4c46a';
      const cols = Math.max(1, Math.floor(bw / 36));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 3; j++) {
          if (r() < 0.45) {
            c.globalAlpha = 0.5 + r() * 0.5;
            c.fillRect(x + 12 + i * 34, top + 20 + j * 40, 14, 20);
          }
        }
      }
      c.globalAlpha = 1;
      x += bw + 14 + Math.floor(r() * 40);
    }
    // Telegraph poles
    c.strokeStyle = '#1a0f22';
    c.lineWidth = 4;
    [200, 840].forEach((px) => {
      c.beginPath(); c.moveTo(px, h); c.lineTo(px, 20); c.stroke();
      c.beginPath(); c.moveTo(px - 20, 34); c.lineTo(px + 20, 34); c.stroke();
    });
  });

  canvasTexture(scene, 'ground', W, H - GROUND_Y, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8a5d3b');
    g.addColorStop(1, '#5a3a24');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#a7744b';
    c.fillRect(0, 0, w, 5);
    const r = rng(3);
    for (let i = 0; i < 260; i++) {
      c.fillStyle = r() < 0.5 ? 'rgba(60,35,20,0.45)' : 'rgba(190,140,95,0.4)';
      const s = 2 + r() * 5;
      c.fillRect(r() * (w - s), 8 + r() * (h - 12), s, s * 0.6);
    }
    c.strokeStyle = 'rgba(60,35,20,0.35)';
    c.lineWidth = 3;
    [30, 70].forEach((y) => {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    });
  });
}

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

export function addParallax(scene) {
  scene.add.image(0, 0, 'sky').setOrigin(0);
  const mesas = scene.add.tileSprite(0, GROUND_Y - 240 + 20, W, 240, 'mesas').setOrigin(0);
  const town = scene.add.tileSprite(0, GROUND_Y - 300, W, 300, 'town').setOrigin(0);
  const ground = scene.add.tileSprite(0, GROUND_Y, W, H - GROUND_Y, 'ground').setOrigin(0);
  return { mesas, town, ground };
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

export function drawPerch(scene, type, x) {
  const top = PERCH_TOP[type];
  const g = scene.add.graphics();
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
    g.fillStyle(0x5b3a52); g.fillRect(x - 120, top, 240, GROUND_Y - top);
    g.fillStyle(0x47293f); g.fillRect(x - 130, top - 8, 260, 14);
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
    for (let yy = top + 60; yy < GROUND_Y; yy += 80) {
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
