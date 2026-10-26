// Junk lying along the trail: broken bottles, a fallen wagon wheel, cow skulls, bones, a rusty can
// and rocks. Drawn once into textures; RunScene scatters them on the ground as the trail scrolls.

import { INK, shade, rect, circle, ellipse, poly, line } from './ink.js';
import { drawBrokenBottle } from './boards.js';

const BONE = 0xe8dcc0;
const BONE_DARK = 0xb8a888;
const WOOD = 0x8a5a32;

// key -> [canvas width, canvas height, draw(g) with the ground line at y = h - 6]
const PROPS = {
  'trail-bottle': [150, 40, (g) => drawBrokenBottle(g, 50, 34, false)],
  'trail-wheel': [130, 50, (g) => {
    // a wagon wheel lying flat, seen from a low angle
    const cx = 65, cy = 26, rx = 56, ry = 16;
    for (let i = 0; i < 10; i++) {
      if (i === 3) continue; // one spoke broken off
      const a = (i / 10) * Math.PI * 2;
      const x = cx + Math.cos(a) * rx * 0.92, y = cy + Math.sin(a) * ry * 0.92;
      line(g, INK, cx, cy, x, y, 5.5);
      line(g, WOOD, cx, cy, x, y, 3);
    }
    g.lineStyle(10, INK, 1); g.strokeEllipse(cx, cy, rx * 2, ry * 2);
    g.lineStyle(6, shade(WOOD, 1.1), 1); g.strokeEllipse(cx, cy, rx * 2, ry * 2);
    g.lineStyle(1.5, 0x3a3f45, 1); g.strokeEllipse(cx, cy, rx * 2 + 5, ry * 2 + 4); // iron tyre
    ellipse(g, shade(WOOD, 0.8), cx, cy, 20, 8);
    ellipse(g, 0x3a3f45, cx, cy, 8, 3, 0);
    // the broken spoke lying nearby
    line(g, INK, cx + 20, cy + 22, cx + 46, cy + 18, 5.5);
    line(g, WOOD, cx + 20, cy + 22, cx + 46, cy + 18, 3);
  }],
  'trail-skull': [110, 52, (g) => {
    // cow skull, face up, horns curling out
    const cx = 55, cy = 26;
    const horn = (s) => {
      const pts = [];
      for (let t = 0; t <= 1.001; t += 0.1) pts.push({ x: cx + s * (12 + t * 38), y: cy - 6 - Math.sin(t * Math.PI * 0.9) * 14 + t * t * 4 });
      g.lineStyle(9, INK, 1); g.strokePoints(pts);
      g.lineStyle(5.5, BONE_DARK, 1); g.strokePoints(pts);
      g.lineStyle(2, BONE, 1); g.strokePoints(pts.slice(0, 7));
    };
    horn(-1); horn(1);
    poly(g, BONE, [
      { x: cx - 16, y: cy - 14 }, { x: cx + 16, y: cy - 14 }, { x: cx + 19, y: cy - 2 }, { x: cx + 10, y: cy + 6 },
      { x: cx + 8, y: cy + 20 }, { x: cx - 8, y: cy + 20 }, { x: cx - 10, y: cy + 6 }, { x: cx - 19, y: cy - 2 },
    ]);
    ellipse(g, 0x2a1a10, cx - 8, cy - 4, 9, 7, 1.4);
    ellipse(g, 0x2a1a10, cx + 8, cy - 4, 9, 7, 1.4);
    ellipse(g, 0x2a1a10, cx - 3, cy + 15, 3, 4, 0);
    ellipse(g, 0x2a1a10, cx + 3, cy + 15, 3, 4, 0);
    line(g, BONE_DARK, cx, cy - 12, cx + 2, cy + 4, 1.6); // crack
  }],
  'trail-bones': [80, 30, (g) => {
    const bone = (x1, y1, x2, y2) => {
      line(g, INK, x1, y1, x2, y2, 7.5);
      line(g, BONE, x1, y1, x2, y2, 4);
      [[x1, y1], [x2, y2]].forEach(([x, y]) => { circle(g, BONE, x - 2, y, 3.6, 1.6); circle(g, BONE, x + 2, y + 1, 3.6, 1.6); });
    };
    bone(12, 20, 54, 14);
    bone(36, 24, 68, 22);
  }],
  'trail-can': [60, 30, (g) => {
    rect(g, 0x9aa0a6, 10, 6, 32, 18);
    ellipse(g, 0xc4c9ce, 42, 15, 9, 18);
    ellipse(g, 0x5e6266, 42, 15, 5, 12, 0);
    rect(g, 0xb5452a, 16, 9, 16, 12, 1.4); // faded label
    g.fillStyle(0x8a4a1c, 0.7); g.fillCircle(14, 20, 3); g.fillCircle(30, 8, 2.4); // rust
  }],
  'trail-rocks': [90, 34, (g) => {
    poly(g, 0x8b8178, [{ x: 10, y: 28 }, { x: 16, y: 12 }, { x: 30, y: 6 }, { x: 44, y: 12 }, { x: 48, y: 28 }]);
    poly(g, 0x9d948a, [{ x: 40, y: 28 }, { x: 46, y: 16 }, { x: 58, y: 14 }, { x: 66, y: 28 }]);
    poly(g, 0x7a7068, [{ x: 64, y: 28 }, { x: 68, y: 21 }, { x: 78, y: 22 }, { x: 80, y: 28 }]);
    g.fillStyle(0xffffff, 0.15); g.fillTriangle(18, 14, 30, 8, 26, 18);
  }],
};

// How often each prop turns up (higher = more common).
export const TRAIL_PROPS = [
  ['trail-bottle', 3], ['trail-wheel', 2], ['trail-skull', 2], ['trail-rocks', 3], ['trail-bones', 1], ['trail-can', 1],
];

export function createTrailPropTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (const [key, [w, h, draw]] of Object.entries(PROPS)) {
    if (scene.textures.exists(key)) continue;
    g.clear();
    draw(g);
    g.generateTexture(key, w, h);
  }
  g.destroy();
}
