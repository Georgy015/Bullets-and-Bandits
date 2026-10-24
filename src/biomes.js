// The trail's scenery: four areas that follow each other every CHECKPOINT_M meters and then
// repeat, a little darker each time round. Each area is four parallax layers (sky, far,
// mid, ground) drawn in code on first use.

import { W, H, GROUND_Y, CHECKPOINT_M } from './config.js';

export const BIOMES = ['town', 'desert', 'canyon', 'station'];

export const BIOME_INFO = {
  town: { name: 'DEADWOOD TOWN', sub: 'Keep the peace, Sheriff' },
  desert: { name: 'THE DESERT', sub: 'Nothing but sand and bandits' },
  canyon: { name: 'RED CANYON', sub: 'Watch the ledges' },
  station: { name: 'RAILWAY STATION', sub: 'The last train out of town' },
};

export const biomeAt = (meters) => BIOMES[Math.floor(Math.max(0, meters) / CHECKPOINT_M) % BIOMES.length];
// How many times the player has gone round all four areas (used to darken the sky).
export const loopAt = (meters) => Math.floor(Math.max(0, meters) / (CHECKPOINT_M * BIOMES.length));

const FAR_H = 240;
const MID_H = 300;
const GROUND_H = H - GROUND_Y;

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

function skyGradient(c, w, h, stops) {
  const g = c.createLinearGradient(0, 0, 0, GROUND_Y);
  stops.forEach(([at, col]) => g.addColorStop(at, col));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function stars(c, w, n, seed, maxY = GROUND_Y * 0.55) {
  const r = rng(seed);
  c.fillStyle = '#fff6dd';
  for (let i = 0; i < n; i++) {
    c.globalAlpha = 0.3 + r() * 0.7;
    const s = r() < 0.1 ? 2.5 : 1.4;
    c.fillRect(r() * w, r() * maxY, s, s);
  }
  c.globalAlpha = 1;
}

function glowDisc(c, x, y, radius, color, glow, glowRadius) {
  const g = c.createRadialGradient(x, y, radius * 0.6, x, y, glowRadius);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fill();
}

function polygon(c, color, h, pts) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, h);
  pts.forEach(([x, y]) => c.lineTo(x, y));
  c.lineTo(W, h);
  c.closePath();
  c.fill();
}

function dirt(c, w, h, top, bottom, edge, specks, seed) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.fillStyle = edge;
  c.fillRect(0, 0, w, 5);
  const r = rng(seed);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = specks[i % specks.length];
    const s = 2 + r() * 5;
    c.fillRect(r() * (w - s), 8 + r() * (h - 12), s, s * 0.6);
  }
}

const MESA_PTS = [[0, 150], [90, 150], [120, 70], [260, 70], [290, 150], [430, 160], [470, 110], [560, 110], [590, 165], [760, 170], [800, 40], [960, 40], [1000, 160], [1130, 150], [1160, 95], [1240, 95], [1280, 150]];

// ------------------------------------------------------------------ Town (night)

function drawTown(scene) {
  canvasTexture(scene, 'town-sky', W, H, (c, w, h) => {
    skyGradient(c, w, h, [[0, '#140b2b'], [0.45, '#35204f'], [0.8, '#8a3f4f'], [1, '#e0794a']]);
    stars(c, w, 140, 7);
    glowDisc(c, 1030, 120, 44, '#fbefc9', 'rgba(255,240,200,0.35)', 140);
    c.fillStyle = 'rgba(200,180,140,0.35)';
    [[-12, -8, 9], [14, 10, 6], [4, 22, 5]].forEach(([dx, dy, rr]) => {
      c.beginPath(); c.arc(1030 + dx, 120 + dy, rr, 0, Math.PI * 2); c.fill();
    });
  });
  canvasTexture(scene, 'town-far', W, FAR_H, (c, w, h) => {
    polygon(c, '#3a1d3f', h, MESA_PTS);
    c.fillStyle = 'rgba(255,140,90,0.12)';
    c.fillRect(0, 0, w, h);
  });
  canvasTexture(scene, 'town-mid', W, MID_H, (c, w, h) => {
    const r = rng(42);
    let x = 10;
    while (x < w - 120) {
      const bw = 90 + Math.floor(r() * 90);
      const bh = 110 + Math.floor(r() * 150);
      const top = h - bh;
      c.fillStyle = r() < 0.5 ? '#24152f' : '#2b1a36';
      c.fillRect(x, top, bw, bh);
      if (r() < 0.7) c.fillRect(x + 10, top - 22, bw - 20, 24); // false-front facade
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
    c.strokeStyle = '#1a0f22';
    c.lineWidth = 4;
    [200, 840].forEach((px) => {
      c.beginPath(); c.moveTo(px, h); c.lineTo(px, 20); c.stroke();
      c.beginPath(); c.moveTo(px - 20, 34); c.lineTo(px + 20, 34); c.stroke();
    });
  });
  canvasTexture(scene, 'town-ground', W, GROUND_H, (c, w, h) => {
    dirt(c, w, h, '#8a5d3b', '#5a3a24', '#a7744b', ['rgba(60,35,20,0.45)', 'rgba(190,140,95,0.4)'], 3);
    c.strokeStyle = 'rgba(60,35,20,0.35)';
    c.lineWidth = 3;
    [30, 70].forEach((y) => { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); });
  });
}

// ------------------------------------------------------------------ Desert (sunset)

function saguaro(c, x, base, height, color) {
  const tw = 20;
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x - tw / 2, base - height, tw, height, tw / 2);
  c.fill();
  const arm = (side, at, len, up) => {
    const ax = x + side * (tw / 2);
    const ay = base - height * at;
    c.beginPath(); c.roundRect(side > 0 ? ax - 2 : ax - len + 2, ay - 7, len, 14, 7); c.fill();
    const ux = side > 0 ? ax + len - 16 : ax - len + 2;
    c.beginPath(); c.roundRect(ux, ay - up, 14, up + 4, 7); c.fill();
  };
  arm(-1, 0.45, 26, 40);
  arm(1, 0.6, 22, 34);
}

function drawDesert(scene) {
  canvasTexture(scene, 'desert-sky', W, H, (c, w, h) => {
    skyGradient(c, w, h, [[0, '#2a3466'], [0.4, '#8a4a6a'], [0.75, '#e0793a'], [1, '#f8c96a']]);
    stars(c, w, 30, 11, GROUND_Y * 0.25);
    glowDisc(c, 920, 470, 70, '#ffd27a', 'rgba(255,200,110,0.55)', 260);
  });
  canvasTexture(scene, 'desert-far', W, FAR_H, (c, w, h) => {
    polygon(c, '#9c4f4a', h, MESA_PTS.map(([x, y]) => [x, y + 20]));
    c.fillStyle = 'rgba(255,190,120,0.18)';
    c.fillRect(0, 0, w, h);
  });
  canvasTexture(scene, 'desert-mid', W, MID_H, (c, w, h) => {
    const r = rng(77);
    // Low dunes along the bottom
    c.fillStyle = '#b8743f';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) c.lineTo(x, h - 40 - 18 * Math.sin((x / w) * Math.PI * 4));
    c.lineTo(w, h); c.fill();
    // Saguaros and rocks, all inside the strip so it tiles cleanly
    [90, 300, 520, 690, 930, 1150].forEach((x, i) => {
      saguaro(c, x, h - 30, 120 + Math.floor(r() * 80), i % 2 ? '#4a3a26' : '#3f3222');
    });
    c.fillStyle = '#6e3e2a';
    [[200, 18, 60], [610, 14, 44], [1050, 20, 70]].forEach(([x, ry, rx]) => {
      c.beginPath(); c.ellipse(x, h - 34, rx, ry, 0, Math.PI, 0); c.fill();
    });
    // A windmill in the distance
    c.strokeStyle = '#4a3a26'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(800, h - 30); c.lineTo(812, h - 190); c.lineTo(824, h - 30); c.stroke();
    c.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      c.beginPath(); c.moveTo(812, h - 190); c.lineTo(812 + Math.cos(a) * 34, h - 190 + Math.sin(a) * 34); c.stroke();
    }
  });
  canvasTexture(scene, 'desert-ground', W, GROUND_H, (c, w, h) => {
    dirt(c, w, h, '#d9a35f', '#b07a3e', '#ecbf7c', ['rgba(140,90,40,0.4)', 'rgba(250,220,160,0.45)'], 5);
  });
}

// ------------------------------------------------------------------ Canyon (dusk)

function drawCanyon(scene) {
  canvasTexture(scene, 'canyon-sky', W, H, (c, w, h) => {
    skyGradient(c, w, h, [[0, '#1d2b4a'], [0.45, '#6b3a5a'], [0.85, '#d9774a'], [1, '#f0a35e']]);
    stars(c, w, 60, 19, GROUND_Y * 0.35);
    glowDisc(c, 260, 140, 26, '#fbefc9', 'rgba(255,240,200,0.25)', 90);
  });
  canvasTexture(scene, 'canyon-far', W, FAR_H, (c, w, h) => {
    // Tall layered canyon walls
    const pts = [[0, 40], [140, 30], [180, 80], [330, 70], [360, 20], [560, 15], [600, 90], [760, 85], [790, 35], [990, 30], [1030, 75], [1180, 70], [1210, 40], [1280, 40]];
    c.save();
    c.beginPath(); c.moveTo(0, h);
    pts.forEach(([x, y]) => c.lineTo(x, y));
    c.lineTo(w, h); c.closePath(); c.clip();
    const bands = ['#7a3424', '#8c3b2a', '#a14a32', '#8c3b2a', '#6e2e20'];
    for (let i = 0; i < 12; i++) {
      c.fillStyle = bands[i % bands.length];
      c.fillRect(0, i * (h / 12), w, h / 12 + 1);
    }
    c.restore();
    c.fillStyle = 'rgba(255,170,120,0.12)';
    c.fillRect(0, 0, w, h);
  });
  canvasTexture(scene, 'canyon-mid', W, MID_H, (c, w, h) => {
    c.fillStyle = '#5e2a1f';
    // Hoodoo spires: narrow columns with a wider cap
    [[120, 210], [380, 170], [700, 240], [980, 190], [1180, 150]].forEach(([x, ht]) => {
      c.beginPath();
      c.moveTo(x - 30, h); c.lineTo(x - 18, h - ht); c.lineTo(x + 18, h - ht); c.lineTo(x + 30, h);
      c.fill();
      c.beginPath(); c.ellipse(x, h - ht, 30, 14, 0, 0, Math.PI * 2); c.fill();
    });
    // A natural arch
    c.beginPath();
    c.moveTo(500, h); c.lineTo(510, h - 150); c.quadraticCurveTo(580, h - 230, 650, h - 150); c.lineTo(660, h);
    c.lineTo(625, h); c.lineTo(620, h - 130); c.quadraticCurveTo(580, h - 180, 540, h - 130); c.lineTo(535, h);
    c.closePath(); c.fill();
    c.fillStyle = '#4a2018';
    c.fillRect(0, h - 26, w, 26);
  });
  canvasTexture(scene, 'canyon-ground', W, GROUND_H, (c, w, h) => {
    dirt(c, w, h, '#a5603e', '#6e3a24', '#c07a4e', ['rgba(80,30,15,0.45)', 'rgba(220,150,110,0.35)'], 13);
  });
}

// ------------------------------------------------------------------ Station (blue night)

function drawStation(scene) {
  canvasTexture(scene, 'station-sky', W, H, (c, w, h) => {
    skyGradient(c, w, h, [[0, '#0b1430'], [0.5, '#1f2f5a'], [0.85, '#4a4f80'], [1, '#8a6e8a']]);
    stars(c, w, 170, 23);
    glowDisc(c, 1080, 100, 30, '#e8ecff', 'rgba(220,230,255,0.3)', 110);
  });
  canvasTexture(scene, 'station-far', W, FAR_H, (c, w, h) => {
    c.fillStyle = '#18213e';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) c.lineTo(x, 120 + 30 * Math.sin((x / w) * Math.PI * 6) + 20 * Math.sin((x / w) * Math.PI * 2));
    c.lineTo(w, h); c.fill();
  });
  canvasTexture(scene, 'station-mid', W, MID_H, (c, w, h) => {
    const base = h - 20;
    c.fillStyle = '#121a33';
    // Depot with a sign and lit windows
    c.fillRect(60, base - 170, 300, 170);
    c.beginPath(); c.moveTo(40, base - 170); c.lineTo(210, base - 230); c.lineTo(380, base - 170); c.fill();
    c.fillStyle = '#f4c46a';
    [[90, 100], [150, 100], [270, 100], [320, 100]].forEach(([x, y]) => c.fillRect(x, base - y - 40, 26, 34));
    c.fillStyle = '#c9a36a'; c.fillRect(150, base - 160, 120, 24);
    c.fillStyle = '#121a33'; c.font = 'bold 18px Georgia'; c.textAlign = 'center'; c.fillText('DEPOT', 210, base - 142);
    // Boxcars with wheels
    const car = (x) => {
      c.fillStyle = '#16203e'; c.fillRect(x, base - 110, 200, 90);
      c.fillStyle = '#0e1428'; c.fillRect(x + 80, base - 100, 40, 70);
      [x + 30, x + 60, x + 140, x + 170].forEach((wx) => { c.beginPath(); c.arc(wx, base - 14, 13, 0, Math.PI * 2); c.fill(); });
    };
    car(470); car(690);
    // Water tower
    c.fillStyle = '#121a33';
    c.fillRect(950, base - 220, 110, 70);
    c.beginPath(); c.ellipse(1005, base - 220, 55, 14, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#121a33'; c.lineWidth = 6;
    [960, 1050].forEach((x) => { c.beginPath(); c.moveTo(x, base - 150); c.lineTo(x + (x < 1000 ? -12 : 12), base); c.stroke(); });
    // Telegraph poles and sagging wires
    c.lineWidth = 4;
    [420, 900, 1220].forEach((x) => {
      c.beginPath(); c.moveTo(x, base); c.lineTo(x, 30); c.stroke();
      c.beginPath(); c.moveTo(x - 22, 44); c.lineTo(x + 22, 44); c.stroke();
    });
    c.lineWidth = 1.5;
    [[420, 900], [900, 1220]].forEach(([a, b]) => {
      c.beginPath(); c.moveTo(a, 44); c.quadraticCurveTo((a + b) / 2, 80, b, 44); c.stroke();
    });
  });
  canvasTexture(scene, 'station-ground', W, GROUND_H, (c, w, h) => {
    dirt(c, w, h, '#6a5a4a', '#43372c', '#857262', ['rgba(30,25,20,0.45)', 'rgba(170,150,130,0.3)'], 29);
    // Railway sleepers and rails (sleeper spacing divides the width so it tiles)
    c.fillStyle = '#4a3624';
    for (let x = 0; x < w; x += 40) c.fillRect(x + 6, 30, 22, 46);
    c.fillStyle = '#9aa0aa';
    c.fillRect(0, 38, w, 5); c.fillRect(0, 64, w, 5);
  });
}

const DRAW = { town: drawTown, desert: drawDesert, canyon: drawCanyon, station: drawStation };

export function ensureBiomeTextures(scene, biome) {
  DRAW[biome](scene);
}

// Background layers for an area. `depth` lets a new area fade in above the old one,
// still below everything in the gameplay (depth >= 0).
export function addParallax(scene, biome = 'town', depth = -40) {
  ensureBiomeTextures(scene, biome);
  const sky = scene.add.image(0, 0, `${biome}-sky`).setOrigin(0).setDepth(depth);
  const far = scene.add.tileSprite(0, GROUND_Y - FAR_H + 20, W, FAR_H, `${biome}-far`).setOrigin(0).setDepth(depth + 1);
  const mid = scene.add.tileSprite(0, GROUND_Y - MID_H, W, MID_H, `${biome}-mid`).setOrigin(0).setDepth(depth + 2);
  const ground = scene.add.tileSprite(0, GROUND_Y, W, GROUND_H, `${biome}-ground`).setOrigin(0).setDepth(depth + 3);
  const all = [sky, far, mid, ground];
  return {
    biome, sky, far, mid, ground, all,
    scroll(dx) {
      ground.tilePositionX += dx;
      mid.tilePositionX += dx * 0.45;
      far.tilePositionX += dx * 0.12;
    },
    setAlpha(a) { all.forEach((o) => o.setAlpha(a)); },
    destroy() { all.forEach((o) => o.destroy()); },
  };
}
