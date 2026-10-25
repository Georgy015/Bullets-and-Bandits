// A cowboy drawn from simple shapes, with walking legs, a rotating gun arm and hit zones.
// Local space faces right with its origin at the feet; `facing = -1` mirrors it.

import { INK, shade, rect, rrect, circle, ellipse, poly, line, star } from './ink.js';
import SHERIFF_ART from './art/sheriff.json';
import OUTLAW_ART from './art/outlaw.json';

// Refined image parts per character (see docs/character-parts). Each part's anchor pixel is
// placed on a game-unit point; anything without an image falls back to code drawing.
// Add ?art=code to the URL to compare with the code-drawn look.
// A look picks its set with `art` and can map slots to differently named parts with `artParts`
// (e.g. { torso: 'torso_vest', head: 'head_bandana', hat: 'hat_cowboy' }).
const { ppu: SHERIFF_PPU, ...SHERIFF_PARTS } = SHERIFF_ART;
const { ppu: OUTLAW_PPU, ...OUTLAW_PARTS } = OUTLAW_ART;
export const ART_SETS = {
  sheriff: { prefix: 'sheriff-', dir: 'art/sheriff/', ppu: SHERIFF_PPU, parts: SHERIFF_PARTS, skin: 0xe5ac83 },
  outlaw: { prefix: 'outlaw-', dir: 'art/outlaw/', ppu: OUTLAW_PPU, parts: OUTLAW_PARTS, skin: 0xf0b88c },
};
const CODE_ART_ONLY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('art') === 'code';

const SHOULDER = { x: 4, y: -80 };
const BACK_SHOULDER = { x: -6, y: -92 }; // off hand, drawn behind the body
const HEAD = { x: 2, y: -104, r: 19 };
const HIP_Y = -44;
const HOLSTER_ANGLE = 1.35;

const MUZZLE = {
  revolver: { x: 68, y: -5 },
  dual: { x: 68, y: -5 },
  dynamite: { x: 38, y: -18 },
  shotgun: { x: 86, y: -5 },
  rifle: { x: 96, y: -4 },
};

// The sheriff: a weathered old gunslinger with a poncho and a cigarillo.
export const SHERIFF_LOOK = {
  shirt: 0x5b4a33, pants: 0x4a3b2c, hat: 0x6b5238, skin: 0xe2ad85,
  poncho: 0x7d6a45, ponchoStripe: 0xd9c08a, ponchoStripe2: 0x8c3b2a,
  hatStyle: 'flat', squint: true, stubble: true, grayHair: true, cigar: true, star: true, spurs: true,
  vest: null, bandana: null, mustache: false, art: 'sheriff',
};

// Gun arm: sleeve, hand and weapon, drawn with its pivot (the shoulder) at 0,0.
export function drawGun(g, type, sleeve, skin) {
  if (type === 'dual') type = 'revolver';
  g.clear();
  const wood = 0x8a5a2b;
  const steel = 0x8d8d96;
  const dark = 0x55555e;
  // Long guns: stock tucked under the arm, drawn first so the sleeve covers it
  if (type === 'shotgun' || type === 'rifle') rrect(g, wood, 4, -5, 32, 10, 3);
  rrect(g, sleeve, -6, -6.5, 40, 13, 6);
  rect(g, shade(sleeve, 0.78), 27, -6, 6, 12, 0); // cuff
  line(g, INK, 27, -6, 27, 6, 1.4);
  if (type === 'revolver') {
    rrect(g, 0x6b4423, 33, -2, 10, 15, 3);
    rrect(g, steel, 37, -10, 13, 11, 2);
    line(g, dark, 40, -9, 40, 0, 1.2);
    line(g, dark, 44, -9, 44, 0, 1.2);
    rect(g, dark, 48, -9, 22, 5);
    rect(g, dark, 66, -11.5, 3, 2.5, 0);
    line(g, 0xc8c8d0, 50, -8, 67, -8, 1.2);
    g.lineStyle(1.6, INK); g.strokeCircle(43, 3.5, 3);
  } else if (type === 'shotgun') {
    rect(g, steel, 34, -9, 15, 10);
    rect(g, dark, 47, -10, 40, 4);
    rect(g, dark, 47, -6, 40, 4);
    rrect(g, wood, 54, -3, 18, 5, 2);
    line(g, 0xc8c8d0, 49, -9.2, 85, -9.2, 1);
  } else if (type === 'rifle') {
    rect(g, steel, 34, -8, 20, 9);
    rect(g, dark, 52, -7, 46, 4);
    rect(g, 0x2d2d33, 40, -15, 16, 5);
    circle(g, 0x6bb8ff, 56, -12.5, 2.4, 1.2);
    line(g, 0xc8c8d0, 54, -6.2, 96, -6.2, 1);
    g.lineStyle(1.6, INK); g.strokeCircle(44, 4, 3.5);
  } else if (type === 'dynamite') {
    rrect(g, 0xc0392b, 31, -18, 11, 26, 3);
    rect(g, 0xf2e2b6, 31, -8, 11, 4, 1.2);
    line(g, 0x3a2a1a, 36, -18, 39, -25, 2);
    star(g, 0xffd166, 39, -26, 4, 1);
  }
  circle(g, skin, 36, 0, 7.5);
  ellipse(g, shade(skin, 0.9), 39, -5, 6, 4, 1.2); // thumb
}

// One leg with boot, drawn with its pivot (the hip) at 0,0.
export function drawLeg(g, pants, spurs) {
  rrect(g, pants, -6.5, 0, 13, 40, 4);
  rect(g, shade(pants, 0.8), -6, 2, 4, 34, 0);
  poly(g, 0x3b2414, [{ x: -8, y: 30 }, { x: 6, y: 30 }, { x: 6, y: 35 }, { x: 13, y: 37 }, { x: 13, y: 44 }, { x: -8, y: 44 }]);
  rect(g, 0x24140a, -8, 41, 6, 3, 0);
  rect(g, 0x5a3820, -7, 31, 12, 2.5, 0);
  if (spurs) star(g, 0xc0c4c8, -11, 40, 3.8, 1.1);
}

export class Gunslinger {
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.facing = opts.facing ?? 1;
    this.scale = opts.scale ?? 1;
    this.look = {
      shirt: 0xe8b830, pants: 0x4b5d7a, hat: 0x8a5a2b, skin: 0xf2c29b,
      bandana: null, vest: 0x6b3f22, mustache: false, star: false,
      ...opts.look,
    };
    this.weapon = opts.weapon ?? 'revolver';
    this.alive = true;

    const c = scene.add.container(x, y);
    this.container = c;

    this.shadow = scene.add.ellipse(0, 0, 78, 14, 0x000000, 0.28);
    c.add(this.shadow);

    const set = ART_SETS[this.look.art];
    this.art = set && !CODE_ART_ONLY && scene.textures.exists(set.prefix + (this.look.artParts?.leg ?? 'leg')) ? set : null;

    if (this.art) {
      this.legBack = this.artImage('leg').setPosition(6, HIP_Y).setTint(0xc4c4c4);
      this.legFront = this.artImage('leg').setPosition(-6, HIP_Y);
    } else {
      this.legBack = scene.add.graphics({ x: 6, y: HIP_Y });
      this.legFront = scene.add.graphics({ x: -6, y: HIP_Y });
      drawLeg(this.legBack, shade(this.look.pants, 0.85), this.look.spurs);
      drawLeg(this.legFront, this.look.pants, this.look.spurs);
    }
    c.add([this.legBack, this.legFront]);

    // Everything above the hips bobs while walking
    this.upper = scene.add.container(0, 0);
    c.add(this.upper);

    // Off-hand arm for twin revolvers; hidden for every other gun
    this.armBack = scene.add.container(BACK_SHOULDER.x, BACK_SHOULDER.y);
    this.armBackG = scene.add.graphics();
    this.armBack.add(this.armBackG);
    if (this.has('offhand')) this.armBack.add(this.artImage('offhand'));
    else drawGun(this.armBackG, 'revolver', shade(this.look.sleeve ?? this.look.shirt, 0.75), shade(this.look.skin, 0.85));
    this.upper.add(this.armBack);

    if (this.has('torso') && this.has('head')) {
      this.upper.add(this.artImage('torso', true));
      this.headImg = this.artImage('head', true);
      this.upper.add(this.headImg);
    } else {
      const body = scene.add.graphics();
      this.drawTorso(body);
      this.drawHead(body);
      this.upper.add(body);
    }

    this.eyesG = scene.add.graphics();
    this.drawEyes(this.eyesG);
    this.upper.add(this.eyesG);

    if (this.has('armor')) {
      this.vestG = this.artImage('armor', true);
    } else {
      this.vestG = scene.add.graphics();
      this.drawArmor(this.vestG);
    }
    this.vestG.setVisible(false);
    this.upper.add(this.vestG);

    this.arm = scene.add.container(SHOULDER.x, SHOULDER.y);
    this.armG = scene.add.graphics();
    this.arm.add(this.armG);
    if (this.art) {
      this.armImg = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
      this.arm.add(this.armImg);
    }
    this.setWeapon(this.weapon);
    this.upper.add(this.arm);

    if (this.has('hat')) {
      this.hat = this.artImage('hat', true);
    } else {
      this.hat = scene.add.graphics();
      this.drawHat(this.hat, 0, 0);
    }
    this.upper.add(this.hat);
    this.recoilAt = -1e9;

    c.setScale(this.scale * this.facing, this.scale);
    this.armBack.setVisible(this.weapon === 'dual');
    if (this.look.armor) this.setArmor(true); // the Undertaker's steel plate is always on
    this.armAngle = HOLSTER_ANGLE;
    this.holster();
    this.breathe();
  }

  breathe() {
    this.breath = this.scene.tweens.add({
      targets: this.container, scaleY: this.scale * 1.02, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // Torso, clothes and belt (no head).
  drawTorso(g) {
    const L = this.look;
    // Torso with a shaded back edge and shirt buttons
    rrect(g, L.shirt, -19, -92, 38, 50, 10);
    g.fillStyle(shade(L.shirt, 0.8)); g.fillRoundedRect(-18, -91, 10, 48, { tl: 9, tr: 0, bl: 9, br: 0 });
    if (!L.poncho && !L.coat) [-84, -74, -64].forEach((y) => circle(g, shade(L.shirt, 1.25), 5, y, 1.8, 1));
    poly(g, shade(L.shirt, 1.1), [{ x: -6, y: -92 }, { x: 2, y: -84 }, { x: 10, y: -92 }], 1.4); // collar
    if (L.vest) {
      if (L.coat) {
        // Under a coat only the inner edge of the vest shows
        rect(g, L.vest, -9, -88, 7, 44, 1.6);
        rect(g, L.vest, 2, -88, 7, 44, 1.6);
      } else {
        rect(g, L.vest, -19, -88, 12, 44, 1.8);
        rect(g, L.vest, 9, -88, 10, 44, 1.8);
        line(g, shade(L.vest, 0.7), 11, -66, 17, -66, 1.4);
      }
    }
    rect(g, 0x2b1a10, -19, -48, 38, 7, 1.6);
    rrect(g, 0xd9b44a, -5, -49, 10, 9, 2, 1.6);
    rrect(g, 0x4a2c17, 9, -46, 11, 21, 3, 1.8);
    if (L.coat) {
      rrect(g, L.coat, -22, -92, 13, 78, { tl: 8, tr: 2, bl: 3, br: 3 });
      rrect(g, L.coat, 9, -92, 13, 78, { tl: 2, tr: 8, bl: 3, br: 3 });
      poly(g, shade(L.coat, 1.3), [{ x: -9, y: -92 }, { x: -9, y: -72 }, { x: -2, y: -90 }], 1.2); // lapels
      poly(g, shade(L.coat, 1.3), [{ x: 9, y: -92 }, { x: 9, y: -72 }, { x: 2, y: -90 }], 1.2);
    }
    if (L.poncho) {
      // Poncho draped from the shoulders, woven stripes and a fringe
      poly(g, L.poncho, [{ x: -22, y: -92 }, { x: 22, y: -92 }, { x: 30, y: -52 }, { x: 0, y: -44 }, { x: -30, y: -52 }]);
      g.fillStyle(shade(L.poncho, 0.82)); g.fillTriangle(-22, -91, -29, -53, -12, -50);
      rect(g, L.ponchoStripe, -26, -66, 52, 4, 0);
      rect(g, L.ponchoStripe2, -27, -61, 54, 3, 0);
      rect(g, L.ponchoStripe, -28, -57, 56, 2, 0);
      for (let x = -28; x <= 28; x += 4) {
        const y = x < 0 ? -52 + ((x + 30) / 30) * 8 : -44 - (x / 30) * 8;
        line(g, shade(L.ponchoStripe, 0.85), x, y, x, y + 5, 1.6);
      }
    }
    if (L.star) {
      star(g, 0xf8d24a, -11, -78, 6.5, 1.4);
      circle(g, 0xb8860b, -11, -78, 1.6, 0);
    }
  }

  // Head with face (eyes are a separate layer, see drawEyes). Kept apart from the torso so
  // it can be swapped for a drawn head image later.
  drawHead(g) {
    const L = this.look;
    const H = HEAD;
    // Head: shaded rim on the back, ear, nose
    rect(g, shade(L.skin, 0.82), -5, -90, 10, 6, 0);
    circle(g, L.skin, H.x - 9, H.y + 1, 5);
    circle(g, shade(L.skin, 0.84), H.x, H.y, H.r);
    g.fillStyle(L.skin); g.fillCircle(H.x + 3, H.y - 1.5, H.r - 3);
    line(g, shade(L.skin, 0.7), H.x - 10, H.y - 1, H.x - 8, H.y + 3, 1.2);
    if (L.grayHair) ellipse(g, 0xc4c4c4, H.x - 14, H.y - 3, 11, 22, 1.4);
    // Profile nose: bridge, tip and nostril, outlined only on its outer edge
    const nose = [
      { x: H.x + 15, y: H.y - 7 }, { x: H.x + 18.5, y: H.y - 2 }, { x: H.x + 22, y: H.y + 3 },
      { x: H.x + 21.5, y: H.y + 5.5 }, { x: H.x + 18.5, y: H.y + 6.5 }, { x: H.x + 15.5, y: H.y + 5.5 },
    ];
    g.fillStyle(L.skin); g.fillPoints(nose, true);
    g.lineStyle(1.6, INK); g.strokePoints(nose, false);
    circle(g, shade(L.skin, 0.6), H.x + 18, H.y + 4.5, 1.2, 0);
    if (L.squint) {
      // Weathered face: crow's feet and forehead lines (eyes are drawn by drawEyes)
      line(g, shade(L.skin, 0.72), H.x + 1, H.y - 2, H.x - 2, H.y, 1.2);
      line(g, shade(L.skin, 0.72), H.x - 2, H.y - 13, H.x + 10, H.y - 13, 1.3);
      line(g, shade(L.skin, 0.72), H.x, H.y - 16, H.x + 8, H.y - 16, 1.2);
    }
    if (!L.bandana) line(g, 0x7a3a2a, H.x + 10, H.y + 11, H.x + 16, H.y + 10, 2);
    if (L.stubble) {
      g.fillStyle(0x8f8f8f, 0.5); g.fillEllipse(H.x + 5, H.y + 10, 30, 14);
    }
    if (L.cigar) {
      rrect(g, 0x6b4423, H.x + 13, H.y + 7.5, 14, 4, 1.5, 1.2);
      circle(g, 0xff7b25, H.x + 27, H.y + 9.5, 2, 0);
    }
    if (L.mustache) ellipse(g, L.mustacheColor ?? 0x3a2412, H.x + 11, H.y + 8, 18, 6, 1.4);
    if (L.bandana) {
      rrect(g, L.bandana, H.x - 15, H.y + 3, 36, 13, 5, 1.8);
      poly(g, L.bandana, [{ x: H.x - 2, y: H.y + 14 }, { x: H.x + 16, y: H.y + 14 }, { x: H.x + 6, y: H.y + 25 }], 1.8);
      line(g, shade(L.bandana, 0.7), H.x - 4, H.y + 9, H.x + 18, H.y + 9, 1.3);
    }
  }

  // Eyes and brows on their own layer so they can change to X's on death.
  drawEyes(g, dead = false) {
    const L = this.look;
    const H = HEAD;
    g.clear();
    if (this.headImg) {
      // Image heads have the eyes baked in: swap to the drawn dead head if there is one,
      // otherwise paint over the eyes and draw X's
      this.setPart(this.headImg, dead && this.has('head_dead') ? 'head_dead' : 'head');
      if (!dead || this.has('head_dead')) return;
      const head = this.part('head');
      const [x1, y1, x2, y2] = head.eye_band;
      g.fillStyle(head.skin ? parseInt(head.skin.slice(1), 16) : this.art.skin);
      g.fillRoundedRect(x1, y1 + 3, x2 - x1, y2 - y1 - 1, 3);
      [x1 + (x2 - x1) * 0.32, x1 + (x2 - x1) * 0.74].forEach((x) => {
        const y = y2 - 3.5;
        line(g, INK, x - 3, y - 3, x + 3, y + 3, 2.4);
        line(g, INK, x + 3, y - 3, x - 3, y + 3, 2.4);
      });
      return;
    }
    if (dead) {
      [[H.x + 7, H.y - 3], [H.x + 14.5, H.y - 3]].forEach(([x, y]) => {
        line(g, INK, x - 3, y - 3, x + 3, y + 3, 2.4);
        line(g, INK, x + 3, y - 3, x - 3, y + 3, 2.4);
      });
      return;
    }
    if (L.squint) {
      // Weathered squint: slits under heavy grey brows
      line(g, INK, H.x + 3, H.y - 3, H.x + 9, H.y - 4, 2.6);
      line(g, INK, H.x + 11, H.y - 4, H.x + 17, H.y - 3, 2.6);
      line(g, 0x8a8a8a, H.x + 1, H.y - 9, H.x + 9, H.y - 7, 4);
      line(g, 0x8a8a8a, H.x + 11, H.y - 7, H.x + 18, H.y - 9, 4);
      return;
    }
    ellipse(g, 0xffffff, H.x + 7, H.y - 3, 7, 9, 1.3);
    ellipse(g, 0xffffff, H.x + 14.5, H.y - 3, 6.5, 8.5, 1.3);
    circle(g, 0x1e1414, H.x + 8.5, H.y - 2.5, 2.2, 0);
    circle(g, 0x1e1414, H.x + 15.8, H.y - 2.5, 2.1, 0);
    line(g, INK, H.x + 3, H.y - 10, H.x + 10, H.y - 8, 3);
    line(g, INK, H.x + 12, H.y - 8, H.x + 18, H.y - 11, 3);
  }

  drawArmor(g) {
    rrect(g, 0x9aa4ae, -21, -90, 42, 44, 8);
    rrect(g, 0xc9d2dc, -17, -86, 34, 14, 5, 1.4);
    line(g, 0x6e7882, -17, -60, 17, -60, 1.6);
    [[-15, -54], [15, -54], [-15, -80], [15, -80]].forEach(([x, y]) => circle(g, 0x5d6670, x, y, 2.5, 1));
  }

  drawHat(g, ox, oy) {
    const L = this.look;
    const x = ox + HEAD.x;
    const y = oy + HEAD.y;
    const hi = shade(L.hat, 1.35);
    if (L.hatStyle === 'top') {
      rect(g, L.hat, x - 13, y - 56, 26, 42);
      rect(g, L.hatBand ?? 0x3a3a42, x - 13, y - 25, 26, 7, 1.4);
      line(g, hi, x - 9, y - 52, x - 9, y - 28, 2);
      ellipse(g, L.hat, x, y - 15, 54, 10);
    } else if (L.hatStyle === 'bowler') {
      circle(g, L.hat, x, y - 22, 15);
      rect(g, 0x111111, x - 15, y - 20, 30, 5, 1.2);
      line(g, hi, x - 8, y - 32, x - 3, y - 35, 2);
      ellipse(g, L.hat, x, y - 15, 50, 9);
    } else if (L.hatStyle === 'flat') {
      rrect(g, L.hat, x - 16, y - 36, 32, 21, { tl: 5, tr: 5, bl: 2, br: 2 });
      rect(g, 0x3a2a1a, x - 16, y - 22, 32, 4, 1.2);
      line(g, shade(L.hat, 0.7), x - 6, y - 35, x + 6, y - 35, 2);
      line(g, hi, x - 12, y - 32, x - 12, y - 24, 2);
      ellipse(g, L.hat, x, y - 16, 76, 12);
      line(g, hi, x - 30, y - 18, x - 10, y - 20, 1.6);
    } else {
      rrect(g, L.hat, x - 16, y - 42, 32, 26, { tl: 10, tr: 10, bl: 2, br: 2 });
      rect(g, 0x1a0f08, x - 16, y - 24, 32, 5, 1.2);
      line(g, hi, x - 11, y - 37, x - 11, y - 26, 2);
      ellipse(g, L.hat, x, y - 17, 64, 12);
    }
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  // An image part placed by its manifest anchor. `atAnchor` puts it on its anchor's game
  // point (torso, head, hat); otherwise it sits at 0,0 (legs and arms pivot there).
  partName(slot) {
    return this.look.artParts?.[slot] ?? slot;
  }

  part(slot) {
    return this.art?.parts[this.partName(slot)];
  }

  has(slot) {
    return !!this.part(slot);
  }

  // Point an image at a slot's part: texture, anchor and scale.
  setPart(img, slot) {
    const p = this.part(slot);
    img.setTexture(this.art.prefix + this.partName(slot))
      .setOrigin(p.anchor_px[0] / p.size[0], p.anchor_px[1] / p.size[1])
      .setScale(1 / this.art.ppu);
    return img;
  }

  artImage(slot, atAnchor = false) {
    const img = this.setPart(this.scene.add.image(0, 0, '__DEFAULT'), slot);
    const p = this.part(slot);
    if (atAnchor) img.setPosition(p.anchor_game[0], p.anchor_game[1]);
    return img;
  }

  setWeapon(type) {
    this.weapon = type;
    const slot = 'arm_' + (type === 'dual' ? 'revolver' : type);
    if (this.has(slot)) {
      this.setPart(this.armImg, slot).setVisible(true);
      this.armG.clear();
    } else {
      this.armImg?.setVisible(false);
      drawGun(this.armG, type, this.look.sleeve ?? this.look.shirt, this.look.skin);
    }
    this.armBack.setVisible(type === 'dual');
  }


  setArmor(on) {
    this.vestG.setVisible(on);
  }

  // Swing the legs; `t` in seconds. Pass null to stand still.
  walk(t) {
    const a = t == null ? 0 : Math.sin(t * 12) * 0.34;
    this.legFront.rotation = a;
    this.legBack.rotation = -a;
    // Legs apart -> hips lower, so both feet stay on the ground (no hopping)
    const drop = 44 * (1 - Math.cos(a));
    this.legFront.y = HIP_Y + drop;
    this.legBack.y = HIP_Y + drop;
    this.upper.y = drop;
    this.upper.rotation = t == null ? 0 : 0.03; // slight forward lean while walking
  }

  // Kick the gun arm up briefly after a shot.
  recoil() {
    this.recoilAt = this.scene.time.now;
  }

  // World-space aim angle (y down, 0 = right). Recoil only tilts the drawing.
  aim(angle) {
    this.armAngle = angle;
    const k = Math.max(0, 1 - (this.scene.time.now - this.recoilAt) / 140);
    this.arm.rotation = (this.facing === 1 ? angle : Math.PI - angle) - 0.3 * k;
    this.armBack.rotation = this.arm.rotation;
  }

  holster() {
    this.arm.rotation = HOLSTER_ANGLE;
    this.armBack.rotation = HOLSTER_ANGLE + 0.2;
    this.armAngle = this.facing === 1 ? HOLSTER_ANGLE : Math.PI - HOLSTER_ANGLE;
  }

  // `hand` is 'front' (gun hand) or 'back' (off hand, twin revolvers only).
  shoulderWorld(hand = 'front') {
    const sh = hand === 'back' ? BACK_SHOULDER : SHOULDER;
    return {
      x: this.x + sh.x * this.scale * this.facing,
      y: this.y + sh.y * this.scale,
    };
  }

  muzzleWorld(hand = 'front') {
    const artArm = hand === 'back' ? this.part('offhand') : this.part('arm_' + (this.weapon === 'dual' ? 'revolver' : this.weapon));
    const m = artArm?.muzzle ? { x: artArm.muzzle[0], y: artArm.muzzle[1] } : MUZZLE[this.weapon];
    const s = this.shoulderWorld(hand);
    const a = this.armAngle;
    const mx = m.x * this.scale;
    const my = m.y * this.scale;
    return {
      x: s.x + Math.cos(a) * mx - Math.sin(a) * my * this.facing,
      y: s.y + Math.sin(a) * mx + Math.cos(a) * my * this.facing,
    };
  }

  headWorld() {
    return {
      x: this.x + HEAD.x * this.scale * this.facing,
      y: this.y + HEAD.y * this.scale,
      r: HEAD.r * this.scale,
    };
  }

  bodyCenter() {
    return { x: this.x, y: this.y - 50 * this.scale };
  }

  // Returns 'head', 'body' or null for a world point.
  hitTest(px, py) {
    if (!this.alive) return null;
    const h = this.headWorld();
    const dx = px - h.x;
    const dy = py - h.y;
    if (dx * dx + dy * dy <= (h.r + 3) * (h.r + 3)) return 'head';
    const s = this.scale;
    if (px >= this.x - 20 * s && px <= this.x + 20 * s && py >= this.y - 92 * s && py <= this.y) return 'body';
    return null;
  }

  flinch() {
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x - 8 * this.facing,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  knockHatOff(dir, groundY) {
    if (!this.hat.visible) return null;
    this.hat.setVisible(false);
    const h = this.headWorld();
    let g;
    if (this.has('hat')) {
      // Same image, placed where it sat on the head
      const p = this.part('hat');
      g = this.setPart(this.scene.add.image(0, 0, '__DEFAULT'), 'hat');
      g.setPosition(this.x + p.anchor_game[0] * this.scale * this.facing, this.y + p.anchor_game[1] * this.scale);
      g.setScale((this.scale * this.facing) / this.art.ppu, this.scale / this.art.ppu);
    } else {
      g = this.scene.add.graphics({ x: h.x, y: h.y });
      g.setScale(this.scale * this.facing, this.scale);
      this.drawHat(g, -HEAD.x, -HEAD.y);
    }
    this.scene.tweens.add({
      targets: g,
      x: h.x + dir * (120 + Math.random() * 80),
      y: h.y - 60,
      angle: dir * 300,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: g, y: groundY - 6, angle: dir * 540, duration: 420, ease: 'Bounce.easeOut',
        });
      },
    });
    this.flyingHat = g;
    return g;
  }

  // Topple over; anyone standing above `groundY` falls off their perch.
  // `onLand` runs when the body hits the ground (for a dust puff).
  die(dir, groundY, onLand) {
    this.alive = false;
    this.breath.stop();
    this.walk(null);
    this.shadow.setVisible(false);
    this.drawEyes(this.eyesG, true);
    // Go limp: arms drop along the body, legs splay a little
    const T = this.scene.tweens;
    T.add({ targets: this.arm, rotation: 1.75, duration: 300, ease: 'Quad.easeOut' });
    T.add({ targets: this.armBack, rotation: 1.95, duration: 300, ease: 'Quad.easeOut' });
    T.add({ targets: this.legFront, rotation: 0.3, duration: 400 });
    T.add({ targets: this.legBack, rotation: -0.12, duration: 400 });
    const falls = groundY > this.y + 4;
    T.add({
      targets: this.container, angle: 90 * dir, duration: 520, ease: 'Quad.easeIn',
      onComplete: () => { if (!falls) onLand?.(); },
    });
    if (falls) {
      T.add({ targets: this.container, y: groundY, delay: 200, duration: 450, ease: 'Quad.easeIn', onComplete: () => onLand?.() });
    }
  }

  revive(x, y) {
    this.alive = true;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAngle(0).setPosition(x, y).setScale(this.scale * this.facing, this.scale);
    this.shadow.setVisible(true);
    this.drawEyes(this.eyesG);
    this.walk(null);
    this.breathe();
  }

  destroy() {
    this.breath?.stop();
    this.container.destroy();
    this.flyingHat?.destroy();
  }
}
