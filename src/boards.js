// Wild West dressing for the menu: plank boards with a sign on top, nails, a horseshoe, bullet holes,
// a pinned sheriff star and a broken whiskey bottle. Everything is drawn with the ink helpers.

import { INK, shade, rect, rrect, circle, ellipse, poly, line, star } from './ink.js';
import { FONT } from './config.js';
import { sfx, unlockAudio } from './sfx.js';

const WOOD = [0x8a5a32, 0x7f5129, 0x94613a];
const GRAIN = 0x5e3b1e;
const SIGN = 0xa06a3a;
const IRON = 0x8d9298;

// Small seeded random so a board looks the same every time it is redrawn.
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

function grain(g, x, y, w, h, rnd) {
  g.lineStyle(1.5, GRAIN, 0.55);
  for (let k = 0; k < 2; k++) {
    const yy = y + h * (0.3 + k * 0.4) + (rnd() - 0.5) * 4;
    const pts = [];
    for (let xx = x + 8; xx <= x + w - 8; xx += 24) pts.push({ x: xx, y: yy + Math.sin(xx * 0.05 + k) * 1.6 });
    g.strokePoints(pts);
  }
  if (rnd() < 0.7) { // a knot
    const kx = x + 30 + rnd() * (w - 60), ky = y + h / 2;
    ellipse(g, shade(GRAIN, 1.2), kx, ky, 14, 7, 0);
    ellipse(g, GRAIN, kx, ky, 6, 3, 0);
  }
}

function nail(g, x, y) {
  circle(g, IRON, x, y, 3.2, 1.6);
  g.fillStyle(0xffffff, 0.5); g.fillCircle(x - 1, y - 1, 1);
}

// Letters carved into the wood: a dark groove, its upper edge in shadow and its lower edge catching
// the light. Three stacked texts, no outline.
export function engraved(scene, x, y, str, size) {
  const c = scene.add.container(x, y);
  const style = (color) => ({ fontFamily: FONT, fontSize: `${size}px`, color });
  const layer = (dx, dy, color) => scene.add.text(dx, dy, str, style(color)).setOrigin(0.5);
  c.add([layer(0, 1.6, '#d9a86e'), layer(0, -1.2, '#1f1007'), layer(0, 0, '#4a2810')]);
  return c;
}

// An old trail signpost: a weathered post planted in the ground with arrow boards nailed to it.
// Each sign is { label, dir (1 = points right, -1 = left), y, w, h, tilt (deg), size, onClick, seed }.
export function signpost(scene, x, groundY, signs, { top = groundY - 170 } = {}) {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  // post, a little crooked, with grain and a split at the top
  const pw = 22;
  g.fillStyle(0x0d0614, 0.35); g.fillEllipse(x + 6, groundY + 4, 70, 12);
  poly(g, 0x6e4a2c, [
    { x: x - pw / 2, y: groundY + 2 }, { x: x - pw / 2 + 2, y: top + 6 }, { x: x - 4, y: top },
    { x: x + 1, y: top + 7 }, { x: x + pw / 2, y: top + 2 }, { x: x + pw / 2 - 1, y: groundY + 2 },
  ]);
  g.lineStyle(1.6, 0x4a2f1a, 0.8);
  [[-5, 0.15], [3, 0.4], [-2, 0.7]].forEach(([dx, f]) => g.lineBetween(x + dx, top + 20 + (groundY - top) * f, x + dx + 1, top + 20 + (groundY - top) * (f + 0.18)));
  line(g, INK, x + 1, top + 7, x - 1, top + 26, 1.6); // split
  // stones and dry grass at the foot
  ellipse(g, 0x8b8178, x - 18, groundY + 1, 18, 10);
  ellipse(g, 0x9d948a, x + 16, groundY + 2, 14, 8);
  g.lineStyle(2, 0xb59a5a, 1);
  [[-26, -12], [-20, -16], [22, -14], [28, -10]].forEach(([dx, h]) => g.lineBetween(x + dx, groundY + 2, x + dx + (dx < 0 ? -3 : 3), groundY + h));
  c.add(g);
  for (const sgn of signs) c.add(arrowSign(scene, x, sgn));
  return c;
}

function arrowSign(scene, postX, { label, dir = 1, y, w = 300, h = 56, tilt = 0, size = 26, onClick, seed = 9 }) {
  const rnd = rng(seed);
  // the board sits across the post, mostly on the side it points to
  const cx = postX + dir * (w / 2 - 40);
  const c = scene.add.container(cx, y).setAngle(tilt);
  const g = scene.add.graphics();
  const wood = 0x9a7550; // sun-bleached
  const tip = h * 0.5;
  const hw = w / 2;
  const pts = dir > 0
    ? [{ x: -hw, y: -h / 2 }, { x: hw - tip, y: -h / 2 }, { x: hw, y: 0 }, { x: hw - tip, y: h / 2 }, { x: -hw, y: h / 2 }, { x: -hw + 10, y: 0 }]
    : [{ x: hw, y: -h / 2 }, { x: -hw + tip, y: -h / 2 }, { x: -hw, y: 0 }, { x: -hw + tip, y: h / 2 }, { x: hw, y: h / 2 }, { x: hw - 10, y: 0 }];
  const shadow = pts.map((p) => ({ x: p.x + 4, y: p.y + 6 }));
  g.fillStyle(0x0d0614, 0.4); g.fillPoints(shadow, true);
  poly(g, wood, pts, 2.6);
  g.fillStyle(0xffffff, 0.12); g.fillRect(-hw + 12, -h / 2 + 4, w - tip - 20, h * 0.2);
  grain(g, -hw + 6, -h / 2, w - tip, h, rnd);
  // weathering: a chipped corner, cracks and worn dark patches
  const back = -dir * hw;
  poly(g, 0x6e4a2c, [{ x: back, y: h / 2 }, { x: back + dir * 16, y: h / 2 }, { x: back + dir * 4, y: h / 2 - 10 }], 0);
  g.lineStyle(1.8, 0x3b2412, 0.9);
  for (let i = 0; i < 2; i++) {
    let px = -dir * (hw * 0.2 + rnd() * hw * 0.5), py = (rnd() < 0.5 ? -1 : 1) * h / 2;
    const pts2 = [{ x: px, y: py }];
    for (let k = 0; k < 3; k++) { px += dir * (6 + rnd() * 8); py += -Math.sign(py) * (5 + rnd() * 5); pts2.push({ x: px, y: py }); }
    g.strokePoints(pts2);
  }
  g.fillStyle(0x3b2412, 0.18);
  g.fillEllipse(dir * hw * 0.35, h * 0.15, w * 0.25, h * 0.35);
  // nailed to the post
  const nx = postX - cx;
  nail(g, nx, -h / 4); nail(g, nx, h / 4);
  c.add(g);
  c.add(engraved(scene, -dir * tip * 0.25 + (nx > 0 ? -10 : 10) * 0, 1, label, size));
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  let pressed = false;
  c.on('pointerdown', () => { pressed = true; c.setScale(0.95); unlockAudio(); });
  c.on('pointerout', () => { pressed = false; c.setScale(1); });
  c.on('pointerup', () => {
    c.setScale(1);
    if (!pressed) return;
    pressed = false;
    sfx.click();
    onClick();
  });
  return c;
}

// Planks with a wider sign plank across the top carrying `title`. Returns a container.
export function woodBoard(scene, x, y, w, h, title, seed = 7) {
  const rnd = rng(seed);
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  g.fillStyle(0x0d0614, 0.35); g.fillRoundedRect(x + 6, y + 10, w, h, 6);
  const n = Math.max(3, Math.round(h / 44));
  const ph = h / n;
  for (let i = 0; i < n; i++) {
    const jl = rnd() * 6, jr = rnd() * 6;
    const py = y + i * ph;
    rect(g, WOOD[i % WOOD.length], x + jl - 3, py, w - jl - jr + 6, ph - 1);
    grain(g, x, py, w, ph, rnd);
    nail(g, x + 12, py + ph / 2);
    nail(g, x + w - 12, py + ph / 2);
  }
  // sign plank across the top
  const sy = y - 18;
  rrect(g, SIGN, x - 12, sy, w + 24, 46, 4);
  g.fillStyle(0xffffff, 0.12); g.fillRect(x - 10, sy + 3, w + 20, 10);
  grain(g, x - 12, sy, w + 24, 46, rnd);
  nail(g, x - 2, sy + 23);
  nail(g, x + w + 2, sy + 23);
  c.add(g);
  c.add(engraved(scene, x + w / 2, sy + 24, title, 26));
  return c;
}

// Lucky horseshoe, open end up, nailed on.
export function horseshoe(g, x, y, r = 16, angle = 0) {
  const ends = [-0.75, Math.PI + 0.75].map((a) => a + angle); // arms curl in at the top
  const arc = (width, color) => {
    g.lineStyle(width, color, 1);
    g.beginPath();
    g.arc(x, y, r, ends[0], ends[1], false); // through the bottom
    g.strokePath();
  };
  arc(11, INK);
  arc(7, 0xa7adb3);
  arc(2, 0xd9dde1);
  for (let i = 0; i < 6; i++) {
    const a = ends[0] + ((ends[1] - ends[0]) * (i + 0.5)) / 6;
    g.fillStyle(0x3a3f45); g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5);
  }
  nail(g, x + Math.cos(Math.PI / 2 + angle) * (r + 0), y + Math.sin(Math.PI / 2 + angle) * (r + 0));
}

// Bullet hole in wood: splintered lighter ring, dark hole, a couple of cracks.
export function bulletHole(g, x, y, r = 6, seed = 3) {
  const rnd = rng(seed);
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rr = r * (i % 2 ? 1.25 : 1.8 + rnd() * 0.6);
    pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
  }
  poly(g, 0xc4935f, pts, 0);
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI * 2;
    line(g, GRAIN, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * r * 3.2, y + Math.sin(a) * r * 3.2, 1.4);
  }
  circle(g, 0x1a0d05, x, y, r, 1.6);
  g.fillStyle(0x000000, 0.6); g.fillCircle(x + 1, y + 1, r * 0.55);
}

// Sheriff star pinned to a board.
export function pinnedStar(g, x, y, r = 15) {
  g.fillStyle(0x0d0614, 0.3); star(g, 0x0d0614, x + 3, y + 4, r, 0);
  star(g, 0xf2c443, x, y, r);
  star(g, 0xffe08a, x - 1, y - 1, r * 0.45, 0);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    circle(g, 0xf2c443, x + Math.cos(a) * r, y + Math.sin(a) * r, 2.4, 1.4);
  }
  nail(g, x, y);
}

// A whiskey bottle lying on the ground with its neck snapped off and glass around it.
export function brokenBottle(scene, px, py, scale = 1.6) {
  const g = scene.add.graphics().setPosition(px, py).setScale(scale);
  const x = 0, y = 0;
  ellipse(g, 0x0d0614, x + 6, y + 3, 92, 10, 0);
  // body, lying down, broken end on the right
  const body = [
    { x: x - 34, y: y - 22 }, { x: x + 6, y: y - 22 }, { x: x + 12, y: y - 15 }, { x: x + 8, y: y - 11 },
    { x: x + 14, y: y - 6 }, { x: x + 9, y: y - 1 }, { x: x - 34, y: y - 1 },
  ];
  poly(g, 0x8a4b16, body);
  g.fillStyle(0xffd9a0, 0.35); g.fillRect(x - 30, y - 19, 34, 4);
  rect(g, 0xf0e1bb, x - 26, y - 19, 18, 14, 1.6); // label
  line(g, 0x7a1d14, x - 23, y - 14, x - 11, y - 14, 2);
  line(g, 0x7a1d14, x - 23, y - 9, x - 15, y - 9, 1.5);
  rrect(g, 0x8a4b16, x - 40, y - 20, 8, 17, 3); // base
  // the snapped-off neck with its cork
  poly(g, 0x8a4b16, [{ x: x + 30, y: y - 9 }, { x: x + 52, y: y - 7 }, { x: x + 52, y: y - 2 }, { x: x + 30, y: y - 1 }, { x: x + 26, y: y - 5 }]);
  rect(g, 0xb7864f, x + 52, y - 8, 7, 7, 1.6);
  // shards
  [[x + 20, y - 1, 7], [x + 66, y, 5], [x + 40, y + 2, 4]].forEach(([sx, sy, s], i) => {
    poly(g, i % 2 ? 0xb06a2a : 0x9c5a1e, [{ x: sx, y: sy }, { x: sx + s, y: sy - s * 0.9 }, { x: sx + s * 1.6, y: sy }], 1.4);
  });
  return g;
}
