// A cowboy drawn from simple shapes, with a rotating gun arm and hit zones.
// Local space faces right with its origin at the feet; `facing = -1` mirrors it.

const SHOULDER = { x: 4, y: -80 };
const HEAD = { x: 2, y: -104, r: 19 };
const HOLSTER_ANGLE = 1.35;

const MUZZLE = {
  revolver: { x: 68, y: -5 },
  shotgun: { x: 86, y: -5 },
  rifle: { x: 96, y: -4 },
  dynamite: { x: 38, y: -16 },
};

function drawGun(g, type, sleeve, skin) {
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
    g.fillStyle(0xc0392b); g.fillRoundedRect(30, -16, 11, 28, 3);
    g.lineStyle(2, 0xf5d76e); g.lineBetween(35, -16, 38, -22);
  }
  g.fillStyle(skin); g.fillCircle(36, 0, 7);
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

    const body = scene.add.graphics();
    this.drawBody(body);
    c.add(body);

    this.arm = scene.add.container(SHOULDER.x, SHOULDER.y);
    this.armG = scene.add.graphics();
    this.arm.add(this.armG);
    drawGun(this.armG, this.weapon, this.look.shirt, this.look.skin);
    c.add(this.arm);

    this.hat = scene.add.graphics();
    this.drawHat(this.hat, 0, 0);
    c.add(this.hat);

    c.setScale(this.scale * this.facing, this.scale);
    this.armAngle = HOLSTER_ANGLE;
    this.holster();

    this.breathe();
  }

  breathe() {
    this.breath = this.scene.tweens.add({
      targets: this.container, scaleY: this.scale * 1.02, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  revive(x, y) {
    this.alive = true;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAngle(0).setPosition(x, y).setScale(this.scale * this.facing, this.scale);
    this.breathe();
  }

  drawBody(g) {
    const L = this.look;
    g.fillStyle(L.pants);
    g.fillRoundedRect(-15, -46, 13, 44, 4);
    g.fillRoundedRect(2, -46, 13, 44, 4);
    g.fillStyle(0x3b2414);
    g.fillRoundedRect(-18, -11, 18, 11, 3);
    g.fillRoundedRect(1, -11, 20, 11, 3);
    g.fillStyle(L.shirt);
    g.fillRoundedRect(-19, -92, 38, 50, 10);
    if (L.vest) {
      g.fillStyle(L.vest);
      g.fillRect(-19, -88, 12, 44);
      g.fillRect(9, -88, 10, 44);
    }
    if (L.star) {
      g.fillStyle(0xf8d24a);
      g.fillCircle(-12, -72, 5);
    }
    g.fillStyle(0x2b1a10); g.fillRect(-19, -48, 38, 7);
    g.fillStyle(0xd9b44a); g.fillRect(-4, -48, 8, 7);
    g.fillStyle(0x4a2c17); g.fillRoundedRect(9, -46, 10, 20, 3);
    // Head
    g.fillStyle(L.skin); g.fillCircle(HEAD.x, HEAD.y, HEAD.r);
    g.fillCircle(HEAD.x + 18, HEAD.y + 2, 4);
    g.fillStyle(0x1e1414);
    g.fillCircle(HEAD.x + 5, HEAD.y - 3, 2.6);
    g.fillCircle(HEAD.x + 13, HEAD.y - 3, 2.6);
    g.lineStyle(2.5, 0x1e1414);
    g.lineBetween(HEAD.x + 1, HEAD.y - 9, HEAD.x + 8, HEAD.y - 8);
    g.lineBetween(HEAD.x + 11, HEAD.y - 8, HEAD.x + 17, HEAD.y - 10);
    if (L.mustache) {
      g.fillStyle(0x3a2412);
      g.fillEllipse(HEAD.x + 11, HEAD.y + 8, 18, 6);
    }
    if (L.bandana) {
      g.fillStyle(L.bandana);
      g.fillRoundedRect(HEAD.x - 15, HEAD.y + 3, 36, 13, 5);
      g.fillTriangle(HEAD.x - 2, HEAD.y + 14, HEAD.x + 16, HEAD.y + 14, HEAD.x + 6, HEAD.y + 24);
    }
  }

  drawHat(g, ox, oy) {
    const L = this.look;
    g.fillStyle(L.hat);
    g.fillEllipse(ox + HEAD.x, oy + HEAD.y - 17, 62, 12);
    g.fillRoundedRect(ox + HEAD.x - 16, oy + HEAD.y - 42, 32, 26, { tl: 10, tr: 10, bl: 2, br: 2 });
    g.fillStyle(0x1a0f08);
    g.fillRect(ox + HEAD.x - 16, oy + HEAD.y - 23, 32, 5);
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  setWeapon(type) {
    this.weapon = type;
    drawGun(this.armG, type, this.look.shirt, this.look.skin);
  }

  // World-space aim angle (y down, 0 = right).
  aim(angle) {
    this.armAngle = angle;
    this.arm.rotation = this.facing === 1 ? angle : Math.PI - angle;
  }

  holster() {
    this.arm.rotation = HOLSTER_ANGLE;
    this.armAngle = this.facing === 1 ? HOLSTER_ANGLE : Math.PI - HOLSTER_ANGLE;
  }

  shoulderWorld() {
    return {
      x: this.x + SHOULDER.x * this.scale * this.facing,
      y: this.y + SHOULDER.y * this.scale,
    };
  }

  muzzleWorld() {
    const m = MUZZLE[this.weapon];
    const s = this.shoulderWorld();
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

  knockHatOff(dir) {
    if (!this.hat.visible) return;
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
          targets: g, y: this.y - 6, angle: dir * 540, duration: 420, ease: 'Bounce.easeOut',
        });
      },
    });
    this.flyingHat = g;
  }

  die(dir) {
    this.alive = false;
    this.breath.stop();
    this.scene.tweens.add({
      targets: this.container,
      angle: 90 * dir,
      x: this.container.x + dir * 30,
      duration: 520,
      ease: 'Quad.easeIn',
    });
  }

  destroy() {
    this.breath?.stop();
    this.container.destroy();
    this.flyingHat?.destroy();
  }
}
