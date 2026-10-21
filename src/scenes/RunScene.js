import Phaser from 'phaser';
import {
  W, H, GROUND_Y, WEAPONS, WEAPON_ORDER, PLAYER_BASE_HP, BASE_SWAY, ENEMY_BULLET_SPEED, SHERIFF_SCALE,
  PX_PER_M, WALK_SPEED, CHECKPOINT_M, PERKS, PERK_ORDER, PERK_WEIGHTS,
  PERK_SPAWN_CHANCE, PERK_DROP_CHANCE, levelAt, groupSize, makeFoe,
} from '../config.js';
import { addParallax, drawPerch, drawCheckpoint } from '../art.js';
import { Gunslinger, SHERIFF_LOOK } from '../gunslinger.js';
import { getSave, save, addCoins } from '../save.js';
import { button, text, panel, coinCounter, floatText, banner, bar } from '../ui.js';
import { sfx, unlockAudio } from '../sfx.js';
import { gameplayStart, gameplayStop, happytime, midgameAd, rewardedAd } from '../sdk.js';

const PLAYER_X = 220;
const ENGAGE_X = 1000; // the sheriff stops when an outlaw walks into this screen x
const SPAWN_X = W + 160; // new things appear just off the right edge
const ENEMY_WINDUP_MS = 700; // how long the "!" shows before an outlaw fires
const MIN_PULL = 18; // px of drag before the sheriff starts aiming
const rand = Phaser.Math.FloatBetween;

function randomPerk() {
  const total = PERK_ORDER.reduce((s, k) => s + PERK_WEIGHTS[k], 0);
  let r = Math.random() * total;
  for (const k of PERK_ORDER) {
    r -= PERK_WEIGHTS[k];
    if (r <= 0) return k;
  }
  return PERK_ORDER[0];
}

export class RunScene extends Phaser.Scene {
  constructor() {
    super('Run');
  }

  init(data) {
    this.startM = data.startM ?? 0;
    this.trial = data.trial ?? null; // a weapon unlocked for this run by a rewarded ad
  }

  create() {
    const s = getSave();
    this.layers = addParallax(this);

    this.weaponKey = this.trial ?? (WEAPONS[s.equipped] ? s.equipped : 'revolver');
    this.weapon = WEAPONS[this.weaponKey];
    this.dmgMult = 1 + s.upgrades.damage * 0.08;
    this.maxHp = Math.round(PLAYER_BASE_HP * (1 + s.upgrades.health * 0.1));
    this.hp = this.maxHp;
    this.sway = BASE_SWAY * Math.max(0.2, 1 - s.upgrades.steady * 0.08);

    // Scene instances are reused on restart, so reset everything here.
    this.worldX = this.startM * PX_PER_M;
    this.runCheckpointM = this.startM;
    this.nextCheckpointM = (Math.floor(this.startM / CHECKPOINT_M) + 1) * CHECKPOINT_M;
    this.bossSpawnedFor = 0;
    this.post = null;
    this.nextEventPx = 420;
    this.clock = 0; // scaled game time in ms; stops while paused
    this.timeScale = 1;
    this.readyAt = 0;
    this.ammo = Object.fromEntries(WEAPON_ORDER.map((k) => [k, WEAPONS[k].clip]));
    this.reloadEnd = 0; // clock time the current reload finishes, 0 when not reloading
    this.state = 'walk';
    this.bullets = [];
    this.world = []; // display objects that scroll with the trail
    this.enemies = [];
    this.active = []; // outlaws in the current fight
    this.pickups = [];
    this.perks = {}; // perk key -> clock time it wears off
    this.aiming = false;
    this.ignoreUntilUp = false;
    this.shotsFired = 0;
    this.kills = 0;
    this.earned = 0;
    this.revived = false;
    this.paused = false;
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.overlay = null;
    this.enemyReact = null;
    this.duelist = null;
    this.walkTime = 0;

    this.tracerG = this.add.graphics().setDepth(20);
    this.aimG = this.add.graphics().setDepth(25);
    this.hudG = this.add.graphics().setDepth(30);

    this.player = new Gunslinger(this, PLAYER_X, GROUND_Y, {
      scale: SHERIFF_SCALE, weapon: this.weaponKey, look: SHERIFF_LOOK,
    });
    this.player.container.setDepth(12);

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 380 }, lifespan: 260, scale: { start: 0.9, end: 0 },
      tint: [0xfff2a8, 0xffb347], blendMode: 'ADD', emitting: false,
    }).setDepth(22);
    this.blood = this.add.particles(0, 0, 'blood', {
      speed: { min: 60, max: 260 }, lifespan: 600, gravityY: 900, scale: { start: 1, end: 0.4 }, emitting: false,
    }).setDepth(21);
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 20, max: 120 }, angle: { min: 200, max: 340 }, lifespan: 500,
      scale: { start: 0.6, end: 1.4 }, alpha: { start: 0.6, end: 0 }, emitting: false,
    }).setDepth(19);
    this.smoke = this.add.particles(0, 0, 'dust', {
      speed: { min: 8, max: 25 }, angle: { min: 250, max: 290 }, lifespan: 1400, frequency: 260,
      scale: { start: 0.2, end: 0.8 }, alpha: { start: 0.35, end: 0 }, tint: 0xcfcfcf, emitting: true,
    }).setDepth(13);

    this.buildHud();
    this.bindInput();
    this.hurtFlash = this.add.rectangle(0, 0, W, H, 0xd62828, 0).setOrigin(0).setDepth(40);

    gameplayStart();
    this.events.once('shutdown', () => gameplayStop());
    this.setHint(this.startM > 0 ? '' : 'The sheriff walks the trail...');
    if (this.startM > 0) banner(this, `CHECKPOINT ${this.startM} m`, '#ffe48a', 56, 700);
  }

  get meters() {
    return Math.floor(this.worldX / PX_PER_M);
  }

  perk(key) {
    return (this.perks[key] ?? 0) > this.clock;
  }

  // ---------------------------------------------------------------- HUD

  buildHud() {
    this.hpBar = bar(this, 104, 30, 260, 24, 0x5bd47a, 'HEALTH').setDepth(30);
    button(this, 52, 44, 60, 52, 'II', 'wood', () => this.pause(), { ui: true, size: 22 }).setDepth(35);
    this.coinUi = coinCounter(this, 1170, 44, getSave().coins).setDepth(30);

    this.distText = text(this, 640, 30, `${this.meters} m`, 40, { ui: true }).setDepth(30);
    this.cpText = text(this, 640, 66, '', 15, { ui: true, color: '#ffe48a' }).setDepth(30);

    // Active perk icons with countdowns
    this.perkUi = {};
    PERK_ORDER.filter((k) => PERKS[k].ms).forEach((k) => {
      const icon = this.add.image(0, 92, `perk-${k}`).setScale(0.7).setDepth(30).setVisible(false);
      const t = text(this, 0, 120, '', 15, { ui: true }).setDepth(30).setVisible(false);
      this.perkUi[k] = { icon, t };
    });

    // Gun belt: switch weapons mid-run (also keys 1-3)
    this.slots = [];
    const owned = WEAPON_ORDER.filter((k) => getSave().owned[k] || k === this.trial);
    owned.forEach((k, i) => {
      const b = button(this, 80 + i * 130, 680, 120, 44, `${i + 1} ${WEAPONS[k].name.toUpperCase()}`, 'wood',
        () => this.switchWeapon(k), { ui: true, size: 15 }).setDepth(35);
      b.key = k;
      this.slots.push(b);
    });
    this.refreshSlots();
    ['ONE', 'TWO', 'THREE'].forEach((name, i) => {
      this.input.keyboard?.on(`keydown-${name}`, () => owned[i] && this.switchWeapon(owned[i]));
    });

    // Ammo in the current gun, with a manual reload (also the R key)
    // Sits in the bottom row, right after the gun belt buttons
    this.ammoX = 80 + owned.length * 130 - 40;
    this.ammoG = this.add.graphics().setDepth(30);
    this.reloadBtn = button(this, this.ammoX + 190, 680, 100, 40, 'RELOAD', 'wood', () => this.startReload(), { ui: true, size: 14 }).setDepth(35);
    this.input.keyboard?.on('keydown-R', () => this.startReload());
    this.reloadText = text(this, PLAYER_X, 0, 'RELOADING', 15, { ui: true, color: '#ffe48a' }).setDepth(30).setVisible(false);

    this.hint = text(this, 640, 640, '', 24, { ui: true, color: '#fff4dc' }).setDepth(30);
  }

  refreshSlots() {
    this.slots.forEach((b) => b.setColor(b.key === this.weaponKey ? 'yellow' : 'wood'));
  }

  switchWeapon(key) {
    if (key === this.weaponKey || this.state === 'over') return;
    this.weaponKey = key;
    this.weapon = WEAPONS[key];
    this.player.setWeapon(key);
    this.readyAt = Math.max(this.readyAt, this.clock + 250);
    this.reloadEnd = 0;
    if (this.ammo[key] <= 0) this.startReload();
    if (getSave().owned[key]) {
      getSave().equipped = key;
      save();
    }
    this.refreshSlots();
  }

  get reloading() {
    return this.reloadEnd > 0;
  }

  startReload() {
    const w = this.weapon;
    if (this.reloading || this.ammo[this.weaponKey] >= w.clip || this.state === 'over') return;
    this.reloadTotal = w.reload * (this.perk('coffee') ? 0.5 : 1);
    this.reloadEnd = this.clock + this.reloadTotal;
    this.aiming = false;
    this.aimG.clear();
    sfx.reload();
  }

  updateReload() {
    if (!this.reloading || this.clock < this.reloadEnd) return;
    this.reloadEnd = 0;
    this.ammo[this.weaponKey] = this.weapon.clip;
    sfx.reloaded();
  }

  // The sheriff reloads every gun while he walks between fights.
  refillAll() {
    for (const k of WEAPON_ORDER) this.ammo[k] = WEAPONS[k].clip;
    this.reloadEnd = 0;
  }

  setHint(str) {
    this.hint.setText(str);
  }

  // ---------------------------------------------------------------- Trail

  scroll(dx) {
    this.worldX += dx;
    const L = this.layers;
    L.ground.tilePositionX += dx;
    L.town.tilePositionX += dx * 0.45;
    L.mesas.tilePositionX += dx * 0.12;
    for (const o of this.world) o.x -= dx;
    // Drop whatever has scrolled far off the left edge
    this.world = this.world.filter((o) => {
      if (o.x > -500) return true;
      o.destroy();
      return false;
    });
    this.enemies = this.enemies.filter((e) => {
      if (e.g.container.scene) return true;
      this.tweens.killTweensOf(e.warn);
      e.warn.destroy();
      return false;
    });
    this.pickups = this.pickups.filter((p) => p.obj.scene);
  }

  spawnAhead(dx) {
    const cp = this.nextCheckpointM;
    const cpScreen = PLAYER_X + cp * PX_PER_M - this.worldX;
    const bossScreen = cpScreen - 300;

    if (this.bossSpawnedFor !== cp && bossScreen <= SPAWN_X) {
      this.bossSpawnedFor = cp;
      const foe = makeFoe(levelAt(cp), { boss: true });
      this.spawnEnemy(foe, bossScreen, { boss: true, enemies: [] });
      this.nextEventPx = Math.max(this.nextEventPx, 900);
    }
    if (!this.post && this.bossSpawnedFor === cp && cpScreen <= SPAWN_X) {
      const obj = drawCheckpoint(this, cp).setDepth(4);
      obj.x = cpScreen;
      this.world.push(obj);
      this.post = { obj, m: cp };
    }

    this.nextEventPx -= dx;
    if (this.nextEventPx > 0) return;
    if (this.bossSpawnedFor !== cp && bossScreen - SPAWN_X < 700) {
      // Leave the road clear for the checkpoint boss
      this.nextEventPx = bossScreen - SPAWN_X + 900;
      return;
    }
    this.spawnEncounter();
    this.nextEventPx = rand(620, 950);
  }

  spawnEncounter() {
    const m = this.meters;
    let x = SPAWN_X;
    if (Math.random() < PERK_SPAWN_CHANCE) {
      this.spawnPickup(randomPerk(), x, GROUND_Y - 26);
      x += 300;
    }
    const group = { boss: false, enemies: [] };
    const n = groupSize(m);
    for (let i = 0; i < n; i++) {
      this.spawnEnemy(makeFoe(levelAt(m), { elevated: i === 1 }), x + i * 180, group);
    }
  }

  spawnEnemy(foe, x, group) {
    const perch = drawPerch(this, foe.perch, 0);
    perch.g.setDepth(5).x = x;
    this.world.push(perch.g);
    const g = new Gunslinger(this, x, perch.top, {
      facing: -1, scale: foe.look.scale, weapon: foe.weapon, look: foe.look,
    });
    g.container.setDepth(10);
    this.world.push(g.container);
    const warn = this.add.image(0, 0, 'warn').setDepth(26).setVisible(false);
    this.tweens.add({ targets: warn, scale: 1.25, duration: 140, yoyo: true, repeat: -1 });
    const e = { g, foe, hp: foe.hp, alive: true, engaged: false, group, shotAt: 0, plan: null, warn };
    group.enemies.push(e);
    this.enemies.push(e);
    return e;
  }

  spawnPickup(key, x, y) {
    const c = this.add.container(x, y).setDepth(9);
    const glow = this.add.image(0, 0, 'glow').setBlendMode('ADD');
    const icon = this.add.image(0, 0, `perk-${key}`);
    c.add([glow, icon]);
    this.tweens.add({ targets: icon, y: -8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
    this.world.push(c);
    const p = { obj: c, key, taken: false };
    this.pickups.push(p);
    return p;
  }

  checkPickups() {
    for (const p of this.pickups) {
      if (p.taken || p.obj.x > PLAYER_X + 24 || p.obj.y < GROUND_Y - 60) continue;
      p.taken = true;
      this.tweens.killTweensOf(p.obj);
      this.tweens.add({
        targets: p.obj, x: PLAYER_X, y: GROUND_Y - 200, scale: 1.4, alpha: 0, duration: 350,
        onComplete: () => p.obj.destroy(),
      });
      this.applyPerk(p.key);
    }
  }

  applyPerk(key) {
    const P = PERKS[key];
    sfx.win();
    if (key === 'whiskey') {
      const heal = Math.round(this.maxHp * 0.35);
      this.hp = Math.min(this.maxHp, this.hp + heal);
      floatText(this, PLAYER_X, GROUND_Y - 270, `+${heal} HP`, '#7dff9a', 28);
    } else {
      this.perks[key] = this.clock + P.ms;
      if (key === 'vest') this.player.setArmor(true);
    }
    const t = text(this, PLAYER_X + 40, GROUND_Y - 310, P.name, 24, { color: P.color, ox: 0 }).setDepth(50);
    const d = text(this, PLAYER_X + 40, GROUND_Y - 284, P.desc, 16, { ui: true, ox: 0 }).setDepth(50);
    this.tweens.add({ targets: [t, d], y: '-=40', alpha: 0, delay: 900, duration: 500, onComplete: () => { t.destroy(); d.destroy(); } });
  }

  updatePerks() {
    for (const k of Object.keys(this.perks)) {
      if (this.perks[k] <= this.clock) {
        delete this.perks[k];
        if (k === 'vest') this.player.setArmor(false);
        floatText(this, PLAYER_X, GROUND_Y - 270, `${PERKS[k].name} wore off`, '#d9c9ad', 18);
      }
    }
    let x = 120;
    for (const [k, ui] of Object.entries(this.perkUi)) {
      const on = this.perk(k);
      ui.icon.setVisible(on);
      ui.t.setVisible(on);
      if (!on) continue;
      ui.icon.x = x;
      ui.t.x = x;
      ui.t.setText(`${Math.ceil((this.perks[k] - this.clock) / 1000)}s`);
      x += 56;
    }
  }

  checkCheckpoint() {
    if (!this.post || this.post.obj.x > PLAYER_X) return;
    const m = this.post.m;
    this.post = null;
    this.nextCheckpointM = m + CHECKPOINT_M;
    this.runCheckpointM = m;
    const s = getSave();
    s.checkpoint = Math.max(s.checkpoint, m);
    s.bestDistance = Math.max(s.bestDistance, m);
    save();
    happytime();
    sfx.bell();
    banner(this, 'CHECKPOINT!', '#ffe48a', 76, 700);
    const heal = Math.round(this.maxHp * 0.25);
    this.hp = Math.min(this.maxHp, this.hp + heal);
    floatText(this, PLAYER_X, GROUND_Y - 270, `+${heal} HP`, '#7dff9a', 24);
  }

  // ---------------------------------------------------------------- Encounters

  engage() {
    this.player.walk(null);
    this.active = this.enemies.filter((e) => e.alive && !e.engaged && e.g.x < W + 60);
    this.active.forEach((e) => { e.engaged = true; });
    const boss = this.active.find((e) => e.group.boss);
    if (boss) {
      this.state = 'standoff';
      this.duelist = boss;
      this.introduceBoss(boss);
      return;
    }
    this.state = 'fight';
    this.active.forEach((e, i) => this.scheduleShot(e, 500 + i * 700));
    this.setHint(this.shotsFired === 0 ? 'Drag back to aim, release to shoot' : '');
  }

  introduceBoss(e) {
    const f = e.foe;
    const c = this.add.container(640, 300).setDepth(60);
    const g = this.add.graphics();
    g.fillStyle(0xe9d3a4); g.fillRect(-150, -170, 300, 340);
    g.lineStyle(6, 0x5e3b1e); g.strokeRect(-150, -170, 300, 340);
    c.add(g);
    c.add(text(this, 0, -125, 'WANTED', 54, { color: '#5a1e14', stroke: '#e9d3a4', strokeThickness: 2 }));
    c.add(text(this, 0, -70, 'DEAD OR ALIVE', 20, { color: '#5a1e14', stroke: '#e9d3a4', strokeThickness: 1 }));
    c.add(text(this, 0, 10, f.name.toUpperCase(), 34, { color: '#2a1408', stroke: '#e9d3a4', strokeThickness: 1 }));
    c.add(text(this, 0, 100, `REWARD  $${f.coins}`, 30, { color: '#7a2416', stroke: '#e9d3a4', strokeThickness: 1 }));
    c.setScale(0.2).setAngle(-12);
    this.tweens.add({ targets: c, scale: 1, angle: -3, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, y: 260, delay: 1500, duration: 250, onComplete: () => c.destroy() });
    this.time.delayedCall(1750, () => this.startQuickdraw());
  }

  startQuickdraw() {
    if (this.state === 'over') return;
    this.state = 'ready';
    this.early = false;
    this.player.holster();
    this.duelist.g.holster();
    this.setHint('Boss duel! Tap the moment you see DRAW!');
    banner(this, 'READY...', '#fff4dc', 60, 400);
    this.time.delayedCall(900, () => {
      if (this.state !== 'ready') return;
      banner(this, 'STEADY...', '#fff4dc', 60, 400);
    });
    this.time.delayedCall(1800 + rand(400, 1800), () => {
      if (this.state !== 'ready') return;
      this.state = 'draw';
      sfx.bell();
      banner(this, 'DRAW!', '#ff5a3c', 120, 350);
      const react = this.early ? 250 : this.duelist.foe.reactMs;
      this.enemyReact = this.time.delayedCall(react, () => this.enemyQuickShot());
    });
  }

  playerQuickShot() {
    this.enemyReact?.remove(false);
    this.state = 'resolve';
    const e = this.duelist;
    const head = Math.random() < 0.45;
    const target = head ? e.g.headWorld() : e.g.bodyCenter();
    const s = this.player.shoulderWorld();
    this.player.aim(Math.atan2(target.y - s.y, target.x - s.x));
    this.hitscan(this.player.muzzleWorld(), target, 0xffe9a8);
    sfx.shot(this.weaponKey);
    this.ammo[this.weaponKey] -= 1;
    banner(this, 'QUICK DRAW!', '#ffd76a', 64, 500);
    // A fixed share of the boss's health, so no weapon turns the draw into a one-shot.
    const mult = this.perk('powder') ? 1.5 : 1;
    this.damageEnemy(e, e.foe.hp * (head ? 0.45 : 0.35) * this.dmgMult * mult, head ? 'head' : 'body', target.x, target.y);
    this.readyAt = this.clock + 350;
    if (this.state === 'resolve') this.time.delayedCall(400, () => this.enterFight());
  }

  enemyQuickShot() {
    if (this.state !== 'draw') return;
    this.state = 'resolve';
    const e = this.duelist;
    const target = this.player.bodyCenter();
    const s = e.g.shoulderWorld();
    e.g.aim(Math.atan2(target.y - s.y, target.x - s.x));
    this.hitscan(e.g.muzzleWorld(), target, 0xff9a7a);
    sfx.shot(e.g.weapon);
    banner(this, this.early ? 'TOO EARLY!' : 'TOO SLOW!', '#ff7a5c', 60, 450);
    this.damagePlayer(e.foe.damage, target.x, target.y);
    if (this.state === 'resolve') this.time.delayedCall(450, () => this.enterFight());
  }

  enterFight() {
    if (this.state === 'over') return;
    this.state = 'fight';
    this.active.forEach((e) => e.alive && this.scheduleShot(e));
    this.setHint(this.shotsFired === 0 ? 'Drag back to aim, release to shoot' : '');
  }

  hitscan(from, to, color) {
    const g = this.add.graphics().setDepth(20);
    g.lineStyle(4, color, 0.9);
    g.lineBetween(from.x, from.y, to.x, to.y);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    this.sparks.explode(10, from.x, from.y);
    this.cameras.main.shake(90, 0.006);
  }

  scheduleShot(e, extraMs = 0) {
    e.shotAt = this.clock + rand(e.foe.fireMin, e.foe.fireMax) * 1000 + extraMs;
    e.plan = null;
    e.warn.setVisible(false);
  }

  planShot(e) {
    const head = Math.random() < 0.2;
    const target = head ? this.player.headWorld() : this.player.bodyCenter();
    const s = e.g.shoulderWorld();
    e.g.aim(Math.atan2(target.y - s.y, target.x - s.x));
    const m = e.g.muzzleWorld();
    // Straight shot at the sheriff, off by up to `aimError` (scaled to radians)
    const angle = Math.atan2(target.y - m.y, target.x - m.x) + rand(-1, 1) * e.foe.aimError * 0.45;
    const speed = ENEMY_BULLET_SPEED[e.g.weapon];
    e.plan = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle };
  }

  enemyFire(e) {
    const p = e.plan;
    e.g.aim(p.angle);
    const m = e.g.muzzleWorld();
    const pellets = e.g.weapon === 'shotgun' ? 3 : 1;
    for (let i = 0; i < pellets; i++) {
      const spread = pellets > 1 ? (i - 1) * 0.07 : 0;
      const sp = Math.hypot(p.vx, p.vy);
      const a = p.angle + spread;
      const dmg = pellets > 1 ? e.foe.damage * 0.45 : e.foe.damage;
      this.spawnBullet(m.x, m.y, Math.cos(a) * sp, Math.sin(a) * sp, 'enemy', dmg, e.g.weapon);
    }
    this.sparks.explode(10, m.x, m.y);
    sfx.shot(e.g.weapon);
    this.scheduleShot(e);
  }

  playerFire(angle) {
    const w = this.weapon;
    if (this.reloading) return;
    if (this.ammo[this.weaponKey] <= 0) {
      sfx.empty();
      this.startReload();
      return;
    }
    if (this.clock < this.readyAt) return;
    this.ammo[this.weaponKey] -= 1;
    this.readyAt = this.clock + w.cooldown * (this.perk('coffee') ? 0.5 : 1);
    const speed = w.speed;
    const m = this.player.muzzleWorld();
    const dmg = w.damage * this.dmgMult * (this.perk('powder') ? 1.5 : 1);
    for (let i = 0; i < w.pellets; i++) {
      const a = w.pellets > 1 ? angle + (i - (w.pellets - 1) / 2) * w.spread + rand(-0.02, 0.02) : angle;
      this.spawnBullet(m.x, m.y, Math.cos(a) * speed, Math.sin(a) * speed, 'player', dmg, this.weaponKey);
    }
    this.sparks.explode(12, m.x, m.y);
    sfx.shot(this.weaponKey);
    this.cameras.main.shake(70, this.weaponKey === 'shotgun' ? 0.007 : 0.004);
    this.shotsFired++;
    if (this.shotsFired === 1) this.setHint('');
    if (this.ammo[this.weaponKey] <= 0) this.time.delayedCall(Math.min(300, w.cooldown), () => this.startReload());
  }

  spawnBullet(x, y, vx, vy, owner, damage, kind) {
    const sprite = this.add.image(x, y, kind === 'shotgun' ? 'pellet' : 'bullet').setDepth(21);
    if (owner === 'enemy') sprite.setTint(0xffb199);
    else if (this.perk('powder')) sprite.setTint(0xff7a3c);
    this.bullets.push({ x, y, vx, vy, owner, damage, kind, sprite, alive: true });
  }

  updateBullets(dt) {
    this.tracerG.clear();
    for (const b of this.bullets) {
      if (!b.alive) continue;
      const speed = Math.hypot(b.vx, b.vy);
      const steps = Math.max(1, Math.ceil((speed * dt) / 6));
      const h = dt / steps;
      for (let i = 0; i < steps && b.alive; i++) {
        b.x += b.vx * h;
        b.y += b.vy * h;
        if (b.owner === 'player') {
          for (const e of this.active) {
            const zone = e.alive && e.g.hitTest(b.x, b.y);
            if (zone) {
              b.alive = false;
              this.damageEnemy(e, zone === 'head' ? b.damage * 2 : b.damage, zone, b.x, b.y);
              break;
            }
          }
        } else {
          const zone = this.player.hitTest(b.x, b.y);
          if (zone) {
            b.alive = false;
            this.damagePlayer(zone === 'head' ? b.damage * 1.5 : b.damage, b.x, b.y);
          }
        }
        if (!b.alive) break;
        if (b.y >= GROUND_Y + 4) {
          this.dust.explode(5, b.x, GROUND_Y);
          b.alive = false;
        } else if (b.x < -60 || b.x > W + 60 || b.y > H + 60) {
          b.alive = false;
        }
      }
      b.sprite.setPosition(b.x, b.y);
      b.sprite.rotation = Math.atan2(b.vy, b.vx);
      if (b.alive) {
        this.tracerG.lineStyle(3, b.owner === 'player' ? 0xffe9a8 : 0xff9a7a, 0.45);
        this.tracerG.lineBetween(b.x - b.vx * 0.03, b.y - b.vy * 0.03, b.x, b.y);
      } else {
        b.sprite.destroy();
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);
  }

  damageEnemy(e, raw, zone, x, y) {
    if (!e?.alive) return;
    const dmg = Math.max(1, Math.round(raw));
    e.hp -= dmg;
    this.blood.explode(zone === 'head' ? 14 : 8, x, y);
    e.g.flinch();
    if (zone === 'head') {
      sfx.headshot();
      const hat = e.g.knockHatOff(1, GROUND_Y);
      if (hat) this.world.push(hat);
      floatText(this, x, y - 30, `HEADSHOT! ${dmg}`, '#ffd76a', 30);
    } else {
      sfx.hit();
      floatText(this, x, y - 20, `${dmg}`, '#ffffff', 28);
    }
    // A hit staggers the outlaw: his next shot comes a bit later.
    if (this.state === 'fight' && e.shotAt - this.clock < 500) e.shotAt += 350;
    if (e.hp <= 0) this.killEnemy(e);
  }

  damagePlayer(raw, x, y) {
    if (this.state === 'over') return;
    if (this.perk('vest')) {
      this.sparks.explode(14, x, y);
      sfx.ricochet();
      floatText(this, x, y - 20, 'BLOCKED', '#c9d2dc', 24);
      return;
    }
    const dmg = Math.max(1, Math.round(raw));
    this.hp -= dmg;
    this.blood.explode(8, x, y);
    this.player.flinch();
    sfx.hurt();
    floatText(this, x, y - 20, `-${dmg}`, '#ff6b5b', 28);
    this.hurtFlash.setAlpha(0.3);
    this.tweens.add({ targets: this.hurtFlash, alpha: 0, duration: 300 });
    this.cameras.main.shake(140, 0.01);
    if (this.hp <= 0) this.playerDie();
  }

  killEnemy(e) {
    e.alive = false;
    e.warn.setVisible(false);
    e.g.die(1, GROUND_Y);
    this.kills++;
    const coins = e.foe.coins * (this.perk('horseshoe') ? 2 : 1);
    this.earned += coins;
    addCoins(coins);
    this.flyCoins(e.g.x, e.g.y - 60, Math.min(10, 3 + Math.floor(coins / 15)));

    if (Math.random() < PERK_DROP_CHANCE || e.group.boss) {
      const p = this.spawnPickup(randomPerk(), e.g.x, e.g.y - 40);
      if (p.obj.y < GROUND_Y - 26) this.tweens.add({ targets: p.obj, y: GROUND_Y - 26, duration: 500, ease: 'Bounce.easeOut' });
    }

    if (this.active.some((a) => a.alive)) return;

    // Last outlaw down: slow-motion finish, then back on the trail
    this.state = 'cleared';
    this.aiming = false;
    this.aimG.clear();
    this.bullets.filter((b) => b.owner === 'enemy').forEach((b) => { b.alive = false; b.sprite.destroy(); });
    this.bullets = this.bullets.filter((b) => b.alive);
    this.timeScale = 0.25;
    this.tweens.timeScale = 0.25;
    this.time.delayedCall(650, () => { this.timeScale = 1; this.tweens.timeScale = 1; });
    this.time.delayedCall(1300, () => {
      if (this.state !== 'cleared') return;
      this.active = [];
      this.duelist = null;
      this.player.holster();
      this.refillAll();
      this.state = 'walk';
    });
  }

  playerDie() {
    this.state = 'over';
    this.aiming = false;
    this.aimG.clear();
    this.enemyReact?.remove(false);
    this.active.forEach((e) => e.warn.setVisible(false));
    this.player.die(-1, GROUND_Y);
    sfx.lose();
    const s = getSave();
    if (this.meters > s.bestDistance) {
      s.bestDistance = this.meters;
      save();
    }
    this.time.delayedCall(900, () => this.showResult());
  }

  revive() {
    this.overlay?.destroy();
    this.revived = true;
    this.hp = Math.round(this.maxHp * 0.6);
    this.player.revive(PLAYER_X, GROUND_Y);
    this.bullets.forEach((b) => b.sprite.destroy());
    this.bullets = [];
    this.refillAll();
    gameplayStart();
    banner(this, 'BACK IN THE SADDLE', '#7dff9a', 54, 600);
    this.time.delayedCall(900, () => {
      if (this.active.some((e) => e.alive)) {
        this.state = 'fight';
        this.active.forEach((e) => e.alive && this.scheduleShot(e, 800));
      } else {
        this.state = 'walk';
      }
    });
  }

  showResult() {
    gameplayStop();
    const c = this.add.container(0, 0).setDepth(70);
    this.overlay = c;
    c.add(this.add.rectangle(0, 0, W, H, 0x0d0614, 0.65).setOrigin(0));
    c.add(panel(this, 380, 120, 520, 480, 0.92));
    c.add(text(this, 640, 172, 'YOU GOT SHOT!', 46, { color: '#ff7a5c' }));
    const s = getSave();
    c.add(text(this, 640, 240, `Distance: ${this.meters} m   ·   Best: ${s.bestDistance} m\nOutlaws down: ${this.kills}`, 22, { ui: true, style: { lineSpacing: 8 } }));
    const coinsLine = text(this, 640, 300, `+${this.earned} coins`, 30, { ui: true, color: '#ffe48a' });
    c.add(coinsLine);

    let y = 360;
    if (this.earned > 0) {
      const dbl = button(this, 640, y, 320, 50, '▶  DOUBLE COINS', 'blue', async () => {
        if (dbl.used) return;
        const ok = await rewardedAd();
        if (!ok) return;
        dbl.used = true;
        addCoins(this.earned);
        this.earned *= 2;
        coinsLine.setText(`+${this.earned} coins`);
        this.coinUi.set(getSave().coins);
        sfx.coin();
        dbl.setColor('gray');
        dbl.setLabel('DOUBLED!');
      }, { ui: true, size: 21 });
      c.add(dbl);
      y += 64;
    }
    if (!this.revived) {
      c.add(button(this, 640, y, 320, 50, '▶  REVIVE HERE', 'green', async () => {
        const ok = await rewardedAd();
        if (ok) this.revive();
      }, { ui: true, size: 21 }));
      y += 64;
    }
    const cpLabel = this.runCheckpointM > 0 ? `FROM ${this.runCheckpointM} m` : 'START OVER';
    c.add(button(this, 640, y, 320, 50, cpLabel, 'yellow', () => this.leave(this.runCheckpointM), { ui: true, size: 21 }));
    y += 64;
    c.add(button(this, 640, y, 200, 46, 'MENU', 'wood', () => this.leave(null), { ui: true, size: 19 }));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
  }

  async leave(startM) {
    await midgameAd();
    if (startM == null) this.scene.start('Menu');
    else this.scene.restart({ startM, trial: this.trial });
  }

  flyCoins(x, y, n) {
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x + rand(-20, 20), y + rand(-20, 20), 'coin').setDepth(45);
      this.tweens.add({
        targets: c, y: c.y - 60, duration: 220, ease: 'Quad.easeOut', delay: i * 30,
        onComplete: () => this.tweens.add({
          targets: c, x: this.coinUi.x - 62, y: this.coinUi.y, duration: 520, ease: 'Cubic.easeIn',
          onComplete: () => { c.destroy(); this.coinUi.pop(); this.coinUi.set(getSave().coins); sfx.coin(); },
        }),
      });
    }
  }

  // ---------------------------------------------------------------- Input

  bindInput() {
    this.input.on('pointerdown', (p, over) => {
      unlockAudio();
      if (this.paused || over.length) return;
      if (this.state === 'ready') {
        this.early = true;
        floatText(this, this.player.x, this.player.y - 270, 'TOO EARLY!', '#ff7a5c', 26);
        return;
      }
      if (this.state === 'draw') {
        this.ignoreUntilUp = true;
        if (!this.early) this.playerQuickShot();
        return;
      }
      if (this.state === 'fight' && this.player.alive) {
        if (this.reloading) return;
        if (this.ammo[this.weaponKey] <= 0) { sfx.empty(); this.startReload(); return; }
        this.aiming = true;
        this.aimStart = { x: p.x, y: p.y };
        this.aimCur = null;
        this.aimPull = 0;
      }
    });
    this.input.on('pointermove', (p) => {
      if (this.aiming) this.aimAt(p);
    });
    const release = () => {
      if (this.ignoreUntilUp) { this.ignoreUntilUp = false; return; }
      if (!this.aiming) return;
      this.aiming = false;
      this.aimG.clear();
      if (this.state === 'fight' && this.aimPull >= MIN_PULL) this.playerFire(this.currentAim());
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  // Drag back like a slingshot: the sheriff aims opposite the drag.
  aimAt(p) {
    const dx = this.aimStart.x - p.x;
    const dy = this.aimStart.y - p.y;
    this.aimPull = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx);
    if (a < -Math.PI / 2) a = -1.5;
    else if (a > Math.PI / 2) a = 1.0;
    this.aimBase = Phaser.Math.Clamp(a, -1.5, 1.0);
    this.aimCur = { x: p.x, y: p.y };
  }

  // Aim wobbles a little; Steady Hand upgrades shrink the wobble.
  currentAim() {
    const t = this.clock / 1000;
    const wobble = this.sway * (Math.sin(t * Math.PI * 2 * 0.9) + 0.45 * Math.sin(t * Math.PI * 2 * 2.3));
    return Phaser.Math.Clamp(this.aimBase + wobble, -1.55, 1.05);
  }

  drawAim() {
    const g = this.aimG;
    g.clear();
    if (!this.aiming || !this.aimCur || this.aimPull < MIN_PULL) return;
    const angle = this.currentAim();
    this.player.aim(angle);
    const ready = this.clock >= this.readyAt && !this.reloading && this.ammo[this.weaponKey] > 0;

    // Pull indicator from where the drag started
    const { x: cx, y: cy } = this.aimCur;
    g.fillStyle(0xffffff, 0.15);
    g.fillTriangle(
      this.aimStart.x, this.aimStart.y,
      cx + Math.sin(angle) * 18, cy - Math.cos(angle) * 18,
      cx - Math.sin(angle) * 18, cy + Math.cos(angle) * 18,
    );
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(this.aimStart.x, this.aimStart.y, 10);

    // Straight dotted sight from the muzzle; it shows the real aim, wobble included.
    // Shotguns show their spread instead of a single line.
    const m = this.player.muzzleWorld();
    const w = this.weapon;
    const lines = w.pellets > 1
      ? [angle - ((w.pellets - 1) / 2) * w.spread, angle + ((w.pellets - 1) / 2) * w.spread]
      : [angle];
    for (const a of lines) {
      for (let d = 18; d < w.sight; d += 16) {
        const k = 1 - d / w.sight;
        g.fillStyle(ready ? 0xfff2c4 : 0x9a8f80, 0.8 * k);
        g.fillCircle(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 2 + 2.5 * k);
      }
    }
  }

  // ---------------------------------------------------------------- Pause

  pause() {
    if (this.paused || this.state === 'over') return;
    this.paused = true;
    this.aiming = false;
    this.aimG.clear();
    this.tweens.pauseAll();
    this.time.paused = true;
    gameplayStop();
    const c = this.add.container(0, 0).setDepth(80);
    c.add(this.add.rectangle(0, 0, W, H, 0x0d0614, 0.6).setOrigin(0).setInteractive());
    c.add(panel(this, 470, 220, 340, 280, 0.95));
    c.add(text(this, 640, 270, 'PAUSED', 44, { color: '#ffd76a' }));
    c.add(button(this, 640, 350, 240, 56, 'RESUME', 'green', () => {
      c.destroy();
      this.paused = false;
      this.tweens.resumeAll();
      this.time.paused = false;
      gameplayStart();
    }, { ui: true, size: 24 }));
    c.add(button(this, 640, 425, 240, 56, 'QUIT', 'red', () => this.scene.start('Menu'), { ui: true, size: 24 }));
  }

  // ---------------------------------------------------------------- Loop

  update(_time, delta) {
    if (this.paused) return;
    const dtMs = Math.min(delta, 50) * this.timeScale;
    this.clock += dtMs;
    const dt = dtMs / 1000;

    if (this.state === 'walk') {
      this.walkTime += dt;
      this.player.walk(this.walkTime);
      this.player.holster();
      this.scroll(WALK_SPEED * dt);
      this.spawnAhead(WALK_SPEED * dt);
      this.checkPickups();
      this.checkCheckpoint();
      if (this.enemies.some((e) => e.alive && !e.engaged && e.g.x <= ENGAGE_X)) this.engage();
    }

    if (this.state === 'fight') {
      for (const e of this.active) {
        if (!e.alive) continue;
        const toShot = e.shotAt - this.clock;
        if (toShot <= ENEMY_WINDUP_MS && !e.plan) {
          this.planShot(e);
          e.warn.setVisible(true);
        }
        if (toShot <= 0 && e.plan) this.enemyFire(e);
        if (!e.plan) e.g.aim(Math.PI - 0.55);
      }
      if (this.player.alive && !this.aiming) {
        const target = this.active.find((e) => e.alive);
        if (target) {
          const h = target.g.headWorld();
          const s = this.player.shoulderWorld();
          this.player.aim(Phaser.Math.Clamp(Math.atan2(h.y - s.y, h.x - s.x) + 0.35, -1.5, 1.0));
        }
      }
    }
    for (const e of this.enemies) {
      const h = e.g.headWorld();
      e.warn.setPosition(h.x, h.y - 64);
    }
    this.smoke.setPosition(this.player.x + 27 * SHERIFF_SCALE, this.player.y - 96 * SHERIFF_SCALE);
    this.smoke.emitting = this.player.alive;

    this.updatePerks();
    this.updateReload();
    this.drawAim();
    this.updateBullets(dt);
    this.drawHudDynamic();
  }

  drawHudDynamic() {
    this.hpBar.set(this.hp / this.maxHp);
    this.distText.setText(`${this.meters} m`);
    this.cpText.setText(`NEXT CHECKPOINT ${this.nextCheckpointM} m   ·   BEST ${getSave().bestDistance} m`);
    const g = this.hudG;
    g.clear();
    // Progress toward the next checkpoint
    const from = this.nextCheckpointM - CHECKPOINT_M;
    const k = Phaser.Math.Clamp((this.worldX / PX_PER_M - from) / CHECKPOINT_M, 0, 1);
    g.fillStyle(0x120914, 0.8); g.fillRoundedRect(520, 82, 240, 8, 4);
    g.fillStyle(0xf6c343); g.fillRoundedRect(521, 83, 238 * k, 6, 3);

    for (const e of this.active) {
      if (!e.alive) continue;
      const h = e.g.headWorld();
      const w = 76;
      g.fillStyle(0x120914, 0.85); g.fillRoundedRect(h.x - w / 2, h.y - 42, w, 10, 5);
      g.fillStyle(0x5bd47a); g.fillRoundedRect(h.x - w / 2 + 2, h.y - 40, Math.max(0, (w - 4) * (e.hp / e.foe.hp)), 6, 3);
    }
    // Reload progress above the sheriff's hat
    const barY = this.player.y - 280;
    this.reloadText.setVisible(this.reloading && this.player.alive).setY(barY - 14);
    if (this.reloading && this.player.alive) {
      const r = 1 - (this.reloadEnd - this.clock) / this.reloadTotal;
      g.fillStyle(0x120914, 0.85); g.fillRoundedRect(PLAYER_X - 45, barY, 90, 10, 5);
      g.fillStyle(0xf6c343); g.fillRoundedRect(PLAYER_X - 43, barY + 2, 86 * Phaser.Math.Clamp(r, 0, 1), 6, 3);
    }
    this.drawAmmo();
  }

  // Cartridges for the gun in hand: brass = loaded, dark = spent.
  drawAmmo() {
    const g = this.ammoG;
    g.clear();
    const w = this.weapon;
    const left = this.ammo[this.weaponKey];
    const shell = this.weaponKey === 'shotgun';
    const rifle = this.weaponKey === 'rifle';
    const cw = shell ? 18 : 13;
    const ch = shell ? 32 : rifle ? 42 : 30;
    for (let i = 0; i < w.clip; i++) {
      const x = this.ammoX + i * (cw + 5);
      const y = 680 + ch / 2 - ch;
      const full = i < left;
      g.fillStyle(0x120914, 0.6); g.fillRoundedRect(x - 2, y - 2, cw + 4, ch + 4, 4);
      if (!full) {
        g.fillStyle(0x3a2c44, 1); g.fillRoundedRect(x, y, cw, ch, 3);
        continue;
      }
      if (shell) {
        g.fillStyle(0xc0392b); g.fillRoundedRect(x, y, cw, ch - 7, 3);
        g.fillStyle(0xd9b44a); g.fillRect(x, y + ch - 8, cw, 8);
      } else {
        g.fillStyle(0xd9b44a); g.fillRoundedRect(x, y + ch * 0.3, cw, ch * 0.7, 2);
        g.fillStyle(0x9a6b3a); g.fillRoundedRect(x + 1, y, cw - 2, ch * 0.34, { tl: 5, tr: 5, bl: 0, br: 0 });
      }
    }
    const full = left >= w.clip;
    this.reloadBtn.setAlpha(full || this.reloading ? 0.45 : 1);
  }
}
