import Phaser from 'phaser';
import {
  W, H, GROUND_Y, GRAVITY, WEAPONS, PLAYER_BASE_HP, BASE_SWAY, FOES_PER_DAY, makeFoe,
} from '../config.js';
import { addParallax, drawPerch } from '../art.js';
import { Gunslinger } from '../gunslinger.js';
import { getSave, save, addCoins } from '../save.js';
import { button, text, panel, coinCounter, floatText, banner, bar } from '../ui.js';
import { sfx, unlockAudio } from '../sfx.js';
import { gameplayStart, gameplayStop, happytime, midgameAd, rewardedAd } from '../sdk.js';

const PLAYER_X = 210;
const ENEMY_X = 1030;
const ENEMY_WINDUP_MS = 700; // how long the "!" shows before an outlaw fires
const MIN_PULL = 18;
const FULL_PULL = 230;
const rand = Phaser.Math.FloatBetween;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.mode = data.mode ?? 'duel';
    this.trial = data.trial ?? null;
  }

  create() {
    const s = getSave();
    this.layers = addParallax(this);

    this.weaponKey = this.trial ?? s.equipped;
    this.weapon = WEAPONS[this.weaponKey];
    this.dmgMult = 1 + s.upgrades.damage * 0.08;
    this.maxHp = Math.round(PLAYER_BASE_HP * (1 + s.upgrades.health * 0.1));
    this.hp = this.maxHp;
    this.sway = BASE_SWAY * Math.max(0.2, 1 - s.upgrades.steady * 0.08);

    this.day = s.day;
    this.foeIndex = 0;
    this.kills = 0;
    this.distance = 0;
    this.earned = 0;
    this.revived = false;
    this.clock = 0; // scaled game time in ms; stops while paused
    this.timeScale = 1;
    this.readyAt = 0;
    this.state = 'intro';
    this.bullets = [];
    this.aiming = false;
    this.ignoreUntilUp = false;
    this.shotsFired = 0;
    // Scene instances are reused on restart, so clear anything a previous run may have left.
    this.paused = false;
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.enemy = null;
    this.warn = null;
    this.overlay = null;
    this.enemyReact = null;

    this.tracerG = this.add.graphics().setDepth(20);
    this.aimG = this.add.graphics().setDepth(25);
    this.hudG = this.add.graphics().setDepth(30);

    this.player = new Gunslinger(this, PLAYER_X, GROUND_Y, {
      scale: 1.1, weapon: this.weaponKey, look: { star: true },
    });
    this.player.container.setDepth(10);
    this.player.holster();

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
    this.fire = this.add.particles(0, 0, 'dust', {
      speed: { min: 80, max: 420 }, lifespan: 650, scale: { start: 1.6, end: 3 },
      alpha: { start: 0.9, end: 0 }, tint: [0xffd166, 0xff7b25, 0x6b4a3a], emitting: false,
    }).setDepth(22);

    this.buildHud();
    this.bindInput();

    this.hurtFlash = this.add.rectangle(0, 0, W, H, 0xd62828, 0).setOrigin(0).setDepth(40);

    gameplayStart();
    this.events.once('shutdown', () => gameplayStop());
    this.nextFoe(true);
  }

  // ---------------------------------------------------------------- HUD

  buildHud() {
    this.hpBar = bar(this, 104, 30, 260, 24, 0x5bd47a, 'HEALTH').setDepth(30);
    const wname = this.weapon.name.toUpperCase() + (this.trial ? '  (FREE TRIAL)' : '');
    text(this, 108, 70, wname, 16, { ui: true, ox: 0, color: '#ffe48a' }).setDepth(30);

    button(this, 52, 44, 60, 52, 'II', 'wood', () => this.pause(), { ui: true, size: 22 }).setDepth(35);

    this.coinUi = coinCounter(this, 1170, 44, getSave().coins).setDepth(30);

    if (this.mode === 'duel') {
      text(this, 640, 26, `DAY ${this.day}`, 22, { color: '#ffd76a' }).setDepth(30);
      this.skulls = [];
      for (let i = 0; i < FOES_PER_DAY; i++) {
        this.skulls.push(this.add.image(600 + i * 40, 64, 'skull').setAlpha(0.35).setDepth(30));
      }
    } else {
      this.distText = text(this, 640, 34, '0 m', 40, { ui: true }).setDepth(30);
      text(this, 640, 68, `BEST ${getSave().bestDistance} m`, 16, { ui: true, color: '#ffe48a' }).setDepth(30);
    }
    this.hint = text(this, 640, 680, '', 24, { ui: true, color: '#fff4dc' }).setDepth(30);
  }

  setHint(str) {
    this.hint.setText(str);
  }

  // ---------------------------------------------------------------- Foes

  nextFoe(first = false) {
    const level = this.mode === 'duel' ? this.day : 1 + this.kills * 0.6;
    const boss = this.mode === 'duel' ? this.foeIndex === FOES_PER_DAY - 1 : this.kills % 5 === 4;
    const idx = this.mode === 'duel' ? this.foeIndex : Math.min(this.kills, 1);
    this.foe = makeFoe(level, idx, boss);

    const ex = ENEMY_X + rand(-40, 50);
    this.perch = drawPerch(this, this.foe.perch, ex);
    this.perch.g.setDepth(5);
    this.enemy = new Gunslinger(this, ex, this.perch.top, {
      facing: -1,
      scale: this.foe.look.scale,
      weapon: boss ? 'rifle' : 'revolver',
      look: { ...this.foe.look, pants: 0x3d3346 },
    });
    this.enemy.container.setDepth(10);
    this.enemy.hp = this.foe.hp;
    this.enemy.holster();

    this.warn = this.add.image(0, 0, 'warn').setDepth(26).setVisible(false);
    this.tweens.add({ targets: this.warn, scale: 1.25, duration: 140, yoyo: true, repeat: -1 });

    // Slide in from the right
    const off = 520;
    this.perch.g.x = off;
    this.enemy.container.x += off;
    this.tweens.add({ targets: this.perch.g, x: 0, duration: first ? 0 : 650, ease: 'Cubic.easeOut' });
    this.tweens.add({
      targets: this.enemy.container,
      x: ex,
      duration: first ? 0 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => this.introduceFoe(),
    });
  }

  introduceFoe() {
    const f = this.foe;
    if (f.boss) {
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
    } else {
      const t = text(this, this.enemy.x, this.enemy.headWorld().y - 90, f.name, 26, { color: '#ffd76a' }).setDepth(30);
      const b = text(this, this.enemy.x, this.enemy.headWorld().y - 62, `Bounty ● ${f.coins}`, 16, { ui: true }).setDepth(30);
      this.tweens.add({ targets: [t, b], alpha: 0, delay: 1300, duration: 300, onComplete: () => { t.destroy(); b.destroy(); } });
      this.time.delayedCall(700, () => this.startQuickdraw());
    }
  }

  // ---------------------------------------------------------------- Quick draw

  startQuickdraw() {
    this.state = 'ready';
    this.early = false;
    this.player.holster();
    this.enemy.holster();
    if (this.kills === 0) this.setHint('Tap the moment you see DRAW!');
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
      const react = this.early ? 250 : this.foe.reactMs;
      this.enemyReact = this.time.delayedCall(react, () => this.enemyQuickShot());
    });
  }

  playerQuickShot() {
    this.enemyReact?.remove(false);
    this.state = 'resolve';
    const head = Math.random() < 0.45;
    const target = head ? this.enemy.headWorld() : this.enemy.bodyCenter();
    const m0 = this.player.shoulderWorld();
    this.player.aim(Math.atan2(target.y - m0.y, target.x - m0.x));
    const m = this.player.muzzleWorld();
    this.hitscan(m, target, 0xffe9a8);
    sfx.shot(this.weaponKey === 'dynamite' ? 'revolver' : this.weaponKey);
    banner(this, 'QUICK DRAW!', '#ffd76a', 64, 500);
    // A fixed share of the outlaw's health, so no weapon turns the draw into a one-shot.
    const dmg = this.foe.hp * (head ? 0.45 : 0.35) * this.dmgMult;
    this.damageEnemy(dmg, head ? 'head' : 'body', target.x, target.y);
    this.readyAt = this.clock + 350;
    if (this.state === 'resolve') this.time.delayedCall(400, () => this.enterFight());
  }

  enemyQuickShot() {
    if (this.state !== 'draw') return;
    this.state = 'resolve';
    const target = this.player.bodyCenter();
    const m0 = this.enemy.shoulderWorld();
    this.enemy.aim(Math.atan2(target.y - m0.y, target.x - m0.x));
    this.hitscan(this.enemy.muzzleWorld(), target, 0xff9a7a);
    sfx.shot(this.enemy.weapon);
    banner(this, this.early ? 'TOO EARLY!' : 'TOO SLOW!', '#ff7a5c', 60, 450);
    this.damagePlayer(this.foe.damage, target.x, target.y);
    if (this.state === 'resolve') this.time.delayedCall(450, () => this.enterFight());
  }

  hitscan(from, to, color) {
    const g = this.add.graphics().setDepth(20);
    g.lineStyle(4, color, 0.9);
    g.lineBetween(from.x, from.y, to.x, to.y);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    this.sparks.explode(10, from.x, from.y);
    this.cameras.main.shake(90, 0.006);
  }

  // ---------------------------------------------------------------- Fight

  enterFight() {
    if (this.state === 'over') return;
    this.state = 'fight';
    this.scheduleEnemyShot();
    this.setHint(this.shotsFired === 0 ? 'Drag back, aim, release to shoot' : '');
  }

  scheduleEnemyShot(extraMs = 0) {
    this.enemyShotAt = this.clock + rand(this.foe.fireMin, this.foe.fireMax) * 1000 + extraMs;
    this.enemyPlan = null;
    this.warn.setVisible(false);
  }

  planEnemyShot() {
    const head = Math.random() < 0.2;
    const target = head ? this.player.headWorld() : this.player.bodyCenter();
    const s = this.enemy.shoulderWorld();
    this.enemy.aim(Math.atan2(target.y - s.y, target.x - s.x));
    const m = this.enemy.muzzleWorld();
    const dx = target.x - m.x;
    const dy = target.y - m.y;
    const speedK = this.enemy.weapon === 'rifle' ? 1500 : 1050;
    const T = Phaser.Math.Clamp(Math.abs(dx) / speedK, 0.5, 1.0);
    let vx = dx / T;
    let vy = (dy - 0.5 * GRAVITY * T * T) / T;
    const e = this.foe.aimError;
    vx *= 1 + rand(-e, e) * 0.5;
    vy += rand(-e, e) * Math.abs(vx) * 0.55;
    this.enemyPlan = { vx, vy, angle: Math.atan2(vy, vx) };
  }

  enemyFire() {
    const p = this.enemyPlan;
    this.enemy.aim(p.angle);
    const m = this.enemy.muzzleWorld();
    this.spawnBullet(m.x, m.y, p.vx, p.vy, 'enemy', this.foe.damage, this.enemy.weapon);
    this.sparks.explode(10, m.x, m.y);
    sfx.shot(this.enemy.weapon);
    this.scheduleEnemyShot();
  }

  playerFire(angle, power) {
    if (this.clock < this.readyAt) return;
    const w = this.weapon;
    this.readyAt = this.clock + w.cooldown;
    const speed = w.speed * (0.45 + 0.55 * power);
    const m = this.player.muzzleWorld();
    for (let i = 0; i < w.pellets; i++) {
      const a = w.pellets > 1 ? angle + (i - (w.pellets - 1) / 2) * w.spread + rand(-0.02, 0.02) : angle;
      this.spawnBullet(m.x, m.y, Math.cos(a) * speed, Math.sin(a) * speed, 'player', w.damage * this.dmgMult, this.weaponKey);
    }
    this.sparks.explode(this.weaponKey === 'dynamite' ? 3 : 12, m.x, m.y);
    sfx.shot(this.weaponKey);
    this.cameras.main.shake(70, this.weaponKey === 'shotgun' ? 0.007 : 0.004);
    this.shotsFired++;
    if (this.shotsFired === 1) this.setHint('');
  }

  spawnBullet(x, y, vx, vy, owner, damage, kind) {
    const tex = kind === 'dynamite' ? 'stick' : kind === 'shotgun' ? 'pellet' : 'bullet';
    const sprite = this.add.image(x, y, tex).setDepth(21);
    if (owner === 'enemy') sprite.setTint(0xffb199);
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
        b.vy += GRAVITY * h;
        b.x += b.vx * h;
        b.y += b.vy * h;
        const target = b.owner === 'player' ? this.enemy : this.player;
        const zone = target?.hitTest(b.x, b.y);
        if (zone) {
          this.onBulletHit(b, target, zone);
        } else if (b.y >= GROUND_Y + 4) {
          if (b.kind === 'dynamite') this.explode(b);
          else this.dust.explode(5, b.x, GROUND_Y);
          b.alive = false;
        } else if (b.x < -60 || b.x > W + 60 || b.y > H + 60) {
          b.alive = false;
        }
      }
      b.sprite.setPosition(b.x, b.y);
      b.sprite.rotation = b.kind === 'dynamite' ? b.sprite.rotation + dt * 14 : Math.atan2(b.vy, b.vx);
      if (b.alive && b.kind !== 'dynamite') {
        this.tracerG.lineStyle(3, b.owner === 'player' ? 0xffe9a8 : 0xff9a7a, 0.45);
        this.tracerG.lineBetween(b.x - b.vx * 0.03, b.y - b.vy * 0.03, b.x, b.y);
      }
      if (!b.alive) b.sprite.destroy();
    }
    this.bullets = this.bullets.filter((b) => b.alive);
  }

  onBulletHit(b, target, zone) {
    b.alive = false;
    if (b.kind === 'dynamite') { this.explode(b); return; }
    if (target === this.enemy) {
      const dmg = zone === 'head' ? b.damage * 2 : b.damage;
      this.damageEnemy(dmg, zone, b.x, b.y);
    } else {
      const dmg = zone === 'head' ? b.damage * 1.5 : b.damage;
      this.damagePlayer(dmg, b.x, b.y);
    }
  }

  explode(b) {
    const r = WEAPONS.dynamite.explosive;
    this.fire.explode(26, b.x, b.y);
    this.sparks.explode(20, b.x, b.y);
    const ring = this.add.circle(b.x, b.y, 10, 0xffe9a8, 0.8).setDepth(23);
    this.tweens.add({ targets: ring, radius: r, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    this.cameras.main.shake(260, 0.014);
    sfx.explosion();
    if (b.owner !== 'player' || !this.enemy?.alive) return;
    const c = this.enemy.bodyCenter();
    const d = Phaser.Math.Distance.Between(b.x, b.y, c.x, c.y);
    if (d < r + 40) {
      const dmg = b.damage * (1 - (0.5 * d) / (r + 40));
      this.damageEnemy(dmg, 'body', c.x, c.y);
    }
  }

  damageEnemy(raw, zone, x, y) {
    const e = this.enemy;
    if (!e?.alive) return;
    const dmg = Math.max(1, Math.round(raw));
    e.hp -= dmg;
    this.blood.explode(zone === 'head' ? 14 : 8, x, y);
    e.flinch();
    if (zone === 'head') {
      sfx.headshot();
      e.knockHatOff(1);
      floatText(this, x, y - 30, `HEADSHOT! ${dmg}`, '#ffd76a', 30);
    } else {
      sfx.hit();
      floatText(this, x, y - 20, `${dmg}`, '#ffffff', 28);
    }
    // A hit staggers the outlaw: his next shot comes a bit later.
    if (this.state === 'fight' && this.enemyShotAt - this.clock < 500) {
      this.enemyShotAt += 350;
    }
    if (e.hp <= 0) this.killEnemy();
  }

  damagePlayer(raw, x, y) {
    if (this.state === 'over') return;
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

  // ---------------------------------------------------------------- Outcomes

  killEnemy() {
    this.state = 'between';
    this.aiming = false;
    this.aimG.clear();
    this.warn.setVisible(false);
    this.enemy.die(1);
    this.bullets.filter((b) => b.owner === 'enemy').forEach((b) => { b.alive = false; b.sprite.destroy(); });
    this.bullets = this.bullets.filter((b) => b.alive);

    // Slow-motion finish
    this.timeScale = 0.25;
    this.tweens.timeScale = 0.25;
    this.time.delayedCall(650, () => { this.timeScale = 1; this.tweens.timeScale = 1; });

    this.kills++;
    this.earned += this.foe.coins;
    addCoins(this.foe.coins);
    this.flyCoins(this.enemy.x, this.enemy.y - 60, Math.min(10, 3 + Math.floor(this.foe.coins / 15)));

    const heal = Math.round(this.maxHp * 0.2);
    this.time.delayedCall(800, () => {
      if (this.state === 'over') return;
      this.hp = Math.min(this.maxHp, this.hp + heal);
      floatText(this, this.player.x, this.player.y - 150, `+${heal} HP`, '#7dff9a', 24);
    });

    if (this.mode === 'duel') {
      this.skulls[this.foeIndex].setAlpha(1).setTint(0xff6b5b);
      this.tweens.add({ targets: this.skulls[this.foeIndex], scale: 1.6, duration: 150, yoyo: true });
      this.foeIndex++;
      if (this.foeIndex >= FOES_PER_DAY) {
        this.time.delayedCall(1300, () => this.dayComplete());
        return;
      }
    }
    this.time.delayedCall(1300, () => this.walkToNext());
  }

  walkToNext() {
    if (this.state === 'over') return;
    this.state = 'walk';
    this.player.holster();
    const shift = 700;
    const old = [this.perch.g, this.enemy.container, this.enemy.flyingHat].filter(Boolean);
    const oldEnemy = this.enemy;
    const oldWarn = this.warn;
    this.tweens.add({
      targets: old, x: `-=${shift}`, duration: 1300, ease: 'Sine.easeInOut',
      onComplete: () => { oldEnemy.destroy(); this.tweens.killTweensOf(oldWarn); oldWarn.destroy(); old[0].destroy(); },
    });
    const L = this.layers;
    this.tweens.add({ targets: L.ground, tilePositionX: L.ground.tilePositionX + shift, duration: 1300, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: L.town, tilePositionX: L.town.tilePositionX + shift * 0.45, duration: 1300, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: L.mesas, tilePositionX: L.mesas.tilePositionX + shift * 0.12, duration: 1300, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.player.container, y: GROUND_Y - 8, duration: 160, yoyo: true, repeat: 3 });

    if (this.mode === 'endless') {
      const from = this.distance;
      this.distance += Phaser.Math.Between(18, 32);
      this.tweens.addCounter({
        from, to: this.distance, duration: 1300,
        onUpdate: (tw) => this.distText.setText(`${Math.round(tw.getValue())} m`),
      });
    }
    this.time.delayedCall(1000, () => this.nextFoe());
  }

  dayComplete() {
    this.state = 'over';
    const s = getSave();
    s.day = this.day + 1;
    save();
    happytime();
    sfx.win();
    this.showResult({ win: true, title: `DAY ${this.day} CLEARED!` });
  }

  playerDie() {
    this.state = 'over';
    this.aiming = false;
    this.aimG.clear();
    this.warn?.setVisible(false);
    this.enemyReact?.remove(false);
    this.player.die(-1);
    sfx.lose();
    if (this.mode === 'endless') {
      const s = getSave();
      if (this.distance > s.bestDistance) {
        s.bestDistance = this.distance;
        save();
      }
    }
    this.time.delayedCall(900, () => this.showResult({ win: false, title: 'YOU GOT SHOT!' }));
  }

  revive() {
    this.overlay?.destroy();
    this.revived = true;
    this.hp = Math.round(this.maxHp * 0.6);
    this.player.revive(PLAYER_X, GROUND_Y);
    this.bullets.forEach((b) => b.sprite.destroy());
    this.bullets = [];
    gameplayStart();
    banner(this, 'BACK IN THE SADDLE', '#7dff9a', 54, 600);
    this.time.delayedCall(900, () => this.startQuickdraw());
  }

  showResult({ win, title }) {
    gameplayStop();
    const c = this.add.container(0, 0).setDepth(70);
    this.overlay = c;
    c.add(this.add.rectangle(0, 0, W, H, 0x0d0614, 0.65).setOrigin(0));
    c.add(panel(this, 380, 150, 520, 420, 0.92));
    c.add(text(this, 640, 205, title, 46, { color: win ? '#ffd76a' : '#ff7a5c' }));

    const lines = [];
    if (this.mode === 'endless') {
      lines.push(`Distance: ${this.distance} m`, `Best: ${getSave().bestDistance} m`);
    } else {
      lines.push(`Outlaws down: ${this.kills}`);
    }
    c.add(text(this, 640, 270, lines.join('\n'), 24, { ui: true, style: { lineSpacing: 8 } }));
    const coinsLine = text(this, 640, 340, `+${this.earned} coins`, 30, { ui: true, color: '#ffe48a' });
    c.add(coinsLine);

    let y = 405;
    if (this.earned > 0) {
      const dbl = button(this, 640, y, 300, 52, '▶  DOUBLE COINS', 'blue', async () => {
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
      }, { ui: true, size: 22 });
      c.add(dbl);
      y += 68;
    }
    if (!win && !this.revived) {
      c.add(button(this, 640, y, 300, 52, '▶  REVIVE', 'green', async () => {
        const ok = await rewardedAd();
        if (ok) this.revive();
      }, { ui: true, size: 22 }));
      y += 68;
    }
    const row = y + 4;
    if (win && this.mode === 'duel') {
      c.add(button(this, 560, row, 150, 52, 'MENU', 'yellow', () => this.leave('Menu'), { ui: true, size: 22 }));
      c.add(button(this, 725, row, 170, 52, 'NEXT DAY', 'green', () => this.leave('Game'), { ui: true, size: 22 }));
    } else {
      c.add(button(this, 560, row, 150, 52, 'MENU', 'yellow', () => this.leave('Menu'), { ui: true, size: 22 }));
      c.add(button(this, 725, row, 170, 52, 'RETRY', 'green', () => this.leave('Game'), { ui: true, size: 22 }));
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
  }

  async leave(scene) {
    await midgameAd();
    if (scene === 'Game') this.scene.restart({ mode: this.mode, trial: null });
    else this.scene.start('Menu');
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
        floatText(this, this.player.x, this.player.y - 160, 'TOO EARLY!', '#ff7a5c', 26);
        return;
      }
      if (this.state === 'draw') {
        this.ignoreUntilUp = true;
        if (!this.early) this.playerQuickShot();
        return;
      }
      if (this.state === 'fight' && this.player.alive) {
        this.aiming = true;
        this.aimStart = { x: p.x, y: p.y };
        this.aimPull = 0;
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.aiming) return;
      const dx = this.aimStart.x - p.x;
      const dy = this.aimStart.y - p.y;
      this.aimPull = Math.hypot(dx, dy);
      let a = Math.atan2(dy, dx);
      if (a < -Math.PI / 2) a = -1.5;
      else if (a > Math.PI / 2) a = 1.0;
      this.aimBase = Phaser.Math.Clamp(a, -1.5, 1.0);
      this.aimCur = { x: p.x, y: p.y };
    });
    const release = () => {
      if (this.ignoreUntilUp) { this.ignoreUntilUp = false; return; }
      if (!this.aiming) return;
      this.aiming = false;
      this.aimG.clear();
      if (this.state === 'fight' && this.aimPull >= MIN_PULL) {
        this.playerFire(this.currentAim(), this.aimPower());
      }
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  aimPower() {
    return Phaser.Math.Clamp(this.aimPull / FULL_PULL, 0.15, 1);
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
    if (!this.aiming || this.aimPull < MIN_PULL || !this.aimCur) return;
    const angle = this.currentAim();
    this.player.aim(angle);

    // Pull indicator where the finger is
    g.fillStyle(0xffffff, 0.15);
    g.fillTriangle(
      this.aimStart.x, this.aimStart.y,
      this.aimCur.x + Math.sin(angle) * 18, this.aimCur.y - Math.cos(angle) * 18,
      this.aimCur.x - Math.sin(angle) * 18, this.aimCur.y + Math.cos(angle) * 18,
    );
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(this.aimStart.x, this.aimStart.y, 10);

    // Partial trajectory preview: long enough to help, short enough to need skill
    const speed = this.weapon.speed * (0.45 + 0.55 * this.aimPower());
    const m = this.player.muzzleWorld();
    let x = m.x;
    let y = m.y;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    const dt = 1 / 90;
    const n = this.weapon.preview;
    const ready = this.clock >= this.readyAt;
    for (let i = 1; i <= n * 2; i++) {
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      if (i % 2 === 0) {
        const k = 1 - i / (n * 2 + 2);
        g.fillStyle(ready ? 0xfff2c4 : 0x9a8f80, 0.85 * k);
        g.fillCircle(x, y, 4.5 * k + 1.5);
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

    if (this.state === 'fight' && this.enemy?.alive) {
      const toShot = this.enemyShotAt - this.clock;
      if (toShot <= ENEMY_WINDUP_MS && !this.enemyPlan) {
        this.planEnemyShot();
        this.warn.setVisible(true);
      }
      if (toShot <= 0 && this.enemyPlan) this.enemyFire();
      if (!this.enemyPlan) this.enemy.aim(Math.PI - 0.55);
    }
    if (this.enemy) {
      const h = this.enemy.headWorld();
      this.warn.setPosition(h.x, h.y - 64);
    }

    if (this.state === 'fight' && this.player.alive && !this.aiming) {
      const h = this.enemy.headWorld();
      const s = this.player.shoulderWorld();
      this.player.aim(Phaser.Math.Clamp(Math.atan2(h.y - s.y, h.x - s.x) + 0.35, -1.5, 1.0));
    }

    this.drawAim();
    this.updateBullets(dt);
    this.drawHudDynamic();
  }

  drawHudDynamic() {
    this.hpBar.set(this.hp / this.maxHp);
    const g = this.hudG;
    g.clear();
    const e = this.enemy;
    if (e?.alive && this.state !== 'intro') {
      const h = e.headWorld();
      const w = 76;
      g.fillStyle(0x120914, 0.85); g.fillRoundedRect(h.x - w / 2, h.y - 42, w, 10, 5);
      g.fillStyle(0x5bd47a); g.fillRoundedRect(h.x - w / 2 + 2, h.y - 40, Math.max(0, (w - 4) * (e.hp / this.foe.hp)), 6, 3);
    }
    // Reload meter under the player
    if (this.state === 'fight' && this.clock < this.readyAt) {
      const k = 1 - (this.readyAt - this.clock) / this.weapon.cooldown;
      g.fillStyle(0x120914, 0.8); g.fillRoundedRect(PLAYER_X - 32, GROUND_Y + 14, 64, 8, 4);
      g.fillStyle(0xf6c343); g.fillRoundedRect(PLAYER_X - 31, GROUND_Y + 15, 62 * k, 6, 3);
    }
  }
}
