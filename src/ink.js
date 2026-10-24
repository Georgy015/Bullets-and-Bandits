// Helpers for the cartoon look: every shape is filled and then outlined in dark "ink".
// Pass ow = 0 to skip the outline (for details drawn on top of an outlined shape).

export const INK = 0x1c120c;
export const OUTLINE = 2.2;

// Darken (f < 1) or lighten (f > 1) a 0xRRGGBB color.
export const shade = (c, f) => {
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
};

function ink(g, ow) {
  if (ow) g.lineStyle(ow, INK, 1);
  return ow > 0;
}

export function rect(g, color, x, y, w, h, ow = OUTLINE) {
  g.fillStyle(color); g.fillRect(x, y, w, h);
  if (ink(g, ow)) g.strokeRect(x, y, w, h);
}

export function rrect(g, color, x, y, w, h, r, ow = OUTLINE) {
  g.fillStyle(color); g.fillRoundedRect(x, y, w, h, r);
  if (ink(g, ow)) g.strokeRoundedRect(x, y, w, h, r);
}

export function circle(g, color, x, y, r, ow = OUTLINE) {
  g.fillStyle(color); g.fillCircle(x, y, r);
  if (ink(g, ow)) g.strokeCircle(x, y, r);
}

export function ellipse(g, color, x, y, w, h, ow = OUTLINE) {
  g.fillStyle(color); g.fillEllipse(x, y, w, h);
  if (ink(g, ow)) g.strokeEllipse(x, y, w, h);
}

export function poly(g, color, pts, ow = OUTLINE) {
  g.fillStyle(color); g.fillPoints(pts, true);
  if (ink(g, ow)) g.strokePoints(pts, true);
}

export function line(g, color, x1, y1, x2, y2, w = OUTLINE) {
  g.lineStyle(w, color, 1);
  g.lineBetween(x1, y1, x2, y2);
}

// Five-pointed star, e.g. the sheriff's badge.
export function star(g, color, x, y, r, ow = OUTLINE) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
  }
  poly(g, color, pts, ow);
}
