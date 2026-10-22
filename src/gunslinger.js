// A cowboy drawn from simple shapes, with walking legs, a rotating gun arm and hit zones.
// Local space faces right with its origin at the feet; `facing = -1` mirrors it.

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
  hatStyle: 'flat', squint: true, stubble: true, grayHair: true, cigar: true, star: true,
  vest: null, bandana: null, mustache: false,
};

// Darken a 0xRRGGBB color by factor f, used for the off-hand arm so it reads as further away.
const shade = (c, f) => (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);

function drawGun(g, type, sleeve, skin) {
  if (type === 'dual') type = 'revolver';
  g.clear();
  g.fillStyle(sleeve); g.fillRoundedRect(-6, -6, 40, 12, 6);
  if (type === 'shotgun' || type === 'rifle') {
    g.fillStyle(0x8a5a2b); g.fillRoundedRect(8, -5, 28, 10, 3);
  }
  if (type === 'revolver') {
    g.fillStyle(0x6b4423); g.fillRoundedRect(34, -3, 9, 14, 3);
    g.fillStyle(0x8d8d96); g.fillRect(38, -9, 11, 10);
    g.fillStyle(0x5f5f68); g.fillRect(48, -8, 21, 5);
  } else if (type === 'shotgun') {
    g.fillStyle(0x6f6f78); g.fillRect(34, -8, 14, 9);
    g.fillStyle(0x4a4a52); g.fillRect(46, -9, 40, 4); g.fillRect(46, -5, 40, 4);
  } else if (type === 'rifle') {
    g.fillStyle(0x6f6f78); g.fillRect(34, -7, 20, 8);
    g.fillStyle(0x4a4a52); g.fillRect(52, -6, 45, 4);
    g.fillStyle(0x2d2d33); g.fillRect(40, -12, 14, 4);
  } else if (type === 'dynamite') {
    // A lit stick held upright, ready to throw
    g.fillStyle(0xc0392b); g.fillRoundedRect(31, -18, 11, 26, 3);
    g.fillStyle(0xf2e2b6); g.fillRect(31, -8, 11, 4);
    g.lineStyle(2, 0x3a2a1a); g.lineBetween(36, -18, 39, -25);
    g.fillStyle(0xffd166); g.fillCircle(39, -26, 3);
  }
  g.fillStyle(skin); g.fillCircle(36, 0, 7);
}

function drawLeg(g, pants) {
  g.fillStyle(pants);
  g.fillRoundedRect(-6.5, 0, 13, 44, 4);
  g.fillStyle(0x3b2414);
  g.fillRoundedRect(-8, 33, 19, 11, 3);
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

    this.legBack = scene.add.graphics({ x: 6, y: HIP_Y });
    this.legFront = scene.add.graphics({ x: -6, y: HIP_Y });
    drawLeg(this.legBack, this.look.pants);
    drawLeg(this.legFront, this.look.pants);
    c.add([this.legBack, this.legFront]);

    // Off-hand arm for twin revolvers; hidden for every other gun
    this.armBack = scene.add.container(BACK_SHOULDER.x, BACK_SHOULDER.y);
    this.armBackG = scene.add.graphics();
    this.armBack.add(this.armBackG);
    drawGun(this.armBackG, 'revolver', shade(this.look.sleeve ?? this.look.shirt, 0.75), shade(this.look.skin, 0.85));
    c.add(this.armBack);

    const body = scene.add.graphics();
    this.drawBody(body);
    c.add(body);

    this.vestG = scene.add.graphics();
    this.drawArmor(this.vestG);
    this.vestG.setVisible(false);
    c.add(this.vestG);

    this.arm = scene.add.container(SHOULDER.x, SHOULDER.y);
    this.armG = scene.add.graphics();
    this.arm.add(this.armG);
    drawGun(this.armG, this.weapon, this.look.sleeve ?? this.look.shirt, this.look.skin);
    c.add(this.arm);

    this.hat = scene.add.graphics();
    this.drawHat(this.hat, 0, 0);
    c.add(this.hat);

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

  drawBody(g) {
    const L = this.look;
    g.fillStyle(L.shirt);
    g.fillRoundedRect(-19, -92, 38, 50, 10);
    if (L.vest) {
      g.fillStyle(L.vest);
      if (L.coat) {
        // Under a coat only the inner edge of the vest shows
        g.fillRect(-9, -88, 7, 44);
        g.fillRect(2, -88, 7, 44);
      } else {
        g.fillRect(-19, -88, 12, 44);
        g.fillRect(9, -88, 10, 44);
      }
    }
    g.fillStyle(0x2b1a10); g.fillRect(-19, -48, 38, 7);
    g.fillStyle(0xd9b44a); g.fillRect(-4, -48, 8, 7);
    g.fillStyle(0x4a2c17); g.fillRoundedRect(9, -46, 10, 20, 3);
    if (L.coat) {
      g.fillStyle(L.coat);
      g.fillRoundedRect(-22, -92, 13, 78, { tl: 8, tr: 2, bl: 3, br: 3 });
      g.fillRoundedRect(9, -92, 13, 78, { tl: 2, tr: 8, bl: 3, br: 3 });
    }
    if (L.poncho) {
      // Poncho draped from the shoulders, with woven stripes
      g.fillStyle(L.poncho);
      g.fillPoints([{ x: -22, y: -92 }, { x: 22, y: -92 }, { x: 30, y: -52 }, { x: 0, y: -44 }, { x: -30, y: -52 }], true);
      g.fillStyle(L.ponchoStripe);
      g.fillRect(-26, -66, 52, 4);
      g.fillStyle(L.ponchoStripe2);
      g.fillRect(-27, -61, 54, 3);
      g.fillStyle(L.ponchoStripe);
      g.fillRect(-28, -57, 56, 2);
    }
    if (L.star) {
      g.fillStyle(0xf8d24a);
      g.fillCircle(-11, -78, 5);
      g.fillStyle(0xb8860b);
      g.fillCircle(-11, -78, 2);
    }
    // Head
    g.fillStyle(L.skin); g.fillCircle(HEAD.x, HEAD.y, HEAD.r);
    g.fillCircle(HEAD.x + 18, HEAD.y + 2, 4);
    if (L.grayHair) {
      g.fillStyle(0xbfbfbf);
      g.fillEllipse(HEAD.x - 15, HEAD.y - 4, 10, 20);
    }
    g.lineStyle(2.5, 0x1e1414);
    if (L.squint) {
      g.lineBetween(HEAD.x + 3, HEAD.y - 3, HEAD.x + 9, HEAD.y - 4);
      g.lineBetween(HEAD.x + 11, HEAD.y - 4, HEAD.x + 17, HEAD.y - 3);
      g.lineStyle(3.5, 0x8a8a8a);
      g.lineBetween(HEAD.x + 1, HEAD.y - 9, HEAD.x + 9, HEAD.y - 7);
      g.lineBetween(HEAD.x + 11, HEAD.y - 7, HEAD.x + 18, HEAD.y - 9);
      g.lineStyle(1.5, 0xa8775a);
      g.lineBetween(HEAD.x - 2, HEAD.y - 13, HEAD.x + 10, HEAD.y - 13);
    } else {
      g.fillStyle(0x1e1414);
      g.fillCircle(HEAD.x + 5, HEAD.y - 3, 2.6);
      g.fillCircle(HEAD.x + 13, HEAD.y - 3, 2.6);
      g.lineBetween(HEAD.x + 1, HEAD.y - 9, HEAD.x + 8, HEAD.y - 8);
      g.lineBetween(HEAD.x + 11, HEAD.y - 8, HEAD.x + 17, HEAD.y - 10);
    }
    if (L.stubble) {
      g.fillStyle(0x8f8f8f, 0.55);
      g.fillEllipse(HEAD.x + 5, HEAD.y + 10, 30, 14);
    }
    if (L.cigar) {
      g.fillStyle(0x6b4423); g.fillRect(HEAD.x + 13, HEAD.y + 8, 13, 3);
      g.fillStyle(0xff7b25); g.fillRect(HEAD.x + 25, HEAD.y + 8, 2, 3);
    }
    if (L.mustache) {
      g.fillStyle(L.mustacheColor ?? 0x3a2412);
      g.fillEllipse(HEAD.x + 11, HEAD.y + 8, 18, 6);
    }
    if (L.bandana) {
      g.fillStyle(L.bandana);
      g.fillRoundedRect(HEAD.x - 15, HEAD.y + 3, 36, 13, 5);
      g.fillTriangle(HEAD.x - 2, HEAD.y + 14, HEAD.x + 16, HEAD.y + 14, HEAD.x + 6, HEAD.y + 24);
    }
  }

  drawArmor(g) {
    g.fillStyle(0x9aa4ae);
    g.fillRoundedRect(-21, -90, 42, 44, 8);
    g.fillStyle(0xc9d2dc);
    g.fillRoundedRect(-17, -86, 34, 14, 5);
    g.fillStyle(0x5d6670);
    [[-15, -54], [15, -54], [-15, -80], [15, -80]].forEach(([x, y]) => g.fillCircle(x, y, 2.5));
  }

  drawHat(g, ox, oy) {
    const L = this.look;
    const x = ox + HEAD.x;
    const y = oy + HEAD.y;
    g.fillStyle(L.hat);
    if (L.hatStyle === 'top') {
      g.fillEllipse(x, y - 16, 52, 9);
      g.fillRect(x - 13, y - 56, 26, 42);
      g.fillStyle(L.hatBand ?? 0x3a3a42);
      g.fillRect(x - 13, y - 24, 26, 6);
    } else if (L.hatStyle === 'bowler') {
      g.fillEllipse(x, y - 15, 50, 9);
      g.fillCircle(x, y - 22, 15);
      g.fillRect(x - 15, y - 22, 30, 7);
      g.fillStyle(0x111111);
      g.fillRect(x - 15, y - 19, 30, 4);
    } else if (L.hatStyle === 'flat') {
      g.fillEllipse(x, y - 16, 74, 11);
      g.fillRoundedRect(x - 16, y - 36, 32, 21, { tl: 5, tr: 5, bl: 2, br: 2 });
      g.fillStyle(0x3a2a1a);
      g.fillRect(x - 16, y - 21, 32, 4);
      g.lineStyle(2, 0x4d3a26);
      g.lineBetween(x - 6, y - 35, x + 6, y - 35);
    } else {
      g.fillEllipse(x, y - 17, 62, 12);
      g.fillRoundedRect(x - 16, y - 42, 32, 26, { tl: 10, tr: 10, bl: 2, br: 2 });
      g.fillStyle(0x1a0f08);
      g.fillRect(x - 16, y - 23, 32, 5);
    }
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  setWeapon(type) {
    this.weapon = type;
    drawGun(this.armG, type, this.look.sleeve ?? this.look.shirt, this.look.skin);
    this.armBack.setVisible(type === 'dual');
  }

  setArmor(on) {
    this.vestG.setVisible(on);
  }

  // Swing the legs; `t` in seconds. Pass null to stand still.
  walk(t) {
    const a = t == null ? 0 : Math.sin(t * 9) * 0.4;
    this.legFront.rotation = a;
    this.legBack.rotation = -a;
  }

  // World-space aim angle (y down, 0 = right).
  aim(angle) {
    this.armAngle = angle;
    this.arm.rotation = this.facing === 1 ? angle : Math.PI - angle;
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
    const m = MUZZLE[this.weapon];
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
    const g = this.scene.add.graphics({ x: h.x, y: h.y });
    g.setScale(this.scale * this.facing, this.scale);
    this.drawHat(g, -HEAD.x, -HEAD.y);
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
  die(dir, groundY) {
    this.alive = false;
    this.breath.stop();
    this.walk(null);
    this.scene.tweens.add({ targets: this.container, angle: 90 * dir, duration: 520, ease: 'Quad.easeIn' });
    if (groundY > this.y + 4) {
      this.scene.tweens.add({ targets: this.container, y: groundY, delay: 200, duration: 450, ease: 'Quad.easeIn' });
    }
  }

  revive(x, y) {
    this.alive = true;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAngle(0).setPosition(x, y).setScale(this.scale * this.facing, this.scale);
    this.breathe();
  }

  destroy() {
    this.breath?.stop();
    this.container.destroy();
    this.flyingHat?.destroy();
  }
}
