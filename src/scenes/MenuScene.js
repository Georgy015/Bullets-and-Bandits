import Phaser from 'phaser';
import {
  W, GROUND_Y, WEAPONS, WEAPON_ORDER, UPGRADES, MAX_UPGRADE, upgradeCost,
  GIFT_INTERVAL_MS, GIFT_COINS,
} from '../config.js';
import { addParallax, biomeAt } from '../biomes.js';
import { Gunslinger, SHERIFF_LOOK } from '../gunslinger.js';
import { getSave, save, spend, addCoins } from '../save.js';
import { button, text, coinCounter } from '../ui.js';
import { sfx, setMuted, unlockAudio } from '../sfx.js';
import { woodBoard, horseshoe, bulletHole, pinnedStar, brokenBottle } from '../boards.js';
import { rrect, ellipse } from '../ink.js';
import { rewardedAd } from '../sdk.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const s = getSave();
    addParallax(this, biomeAt(s.checkpoint)); // show the area of the saved checkpoint
    this.add.rectangle(0, 0, W, 720, 0x0d0614, 0.25).setOrigin(0);

    const title = text(this, 640, 58, 'FAST GUN', 84, { color: '#ffd76a', strokeThickness: 10 });
    this.tweens.add({ targets: title, scale: 1.04, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    text(this, 640, 112, 'Are you the fastest gun in the West?', 22, { color: '#f6e3c0' });

    this.coins = coinCounter(this, 1170, 52, s.coins);

    const soundLabel = () => (s.muted ? 'SOUND OFF' : 'SOUND ON');
    const mute = button(this, 90, 52, 140, 48, soundLabel(), 'wood', () => {
      s.muted = !s.muted;
      setMuted(s.muted);
      mute.setLabel(soundLabel());
      save();
    }, { ui: true, size: 17 });

    // Hero on the porch, showing the equipped gun
    this.hero = new Gunslinger(this, 600, GROUND_Y, {
      scale: 2, weapon: WEAPONS[s.equipped] ? s.equipped : 'revolver', look: SHERIFF_LOOK,
    });
    this.hero.aim(-0.25);

    brokenBottle(this, 770, GROUND_Y + 4);

    this.upgradeLayer = this.add.container(0, 0);
    this.weaponLayer = this.add.container(0, 0);
    this.buildUpgrades();
    this.buildWeapons();
    this.buildGift();

    // Ride out from the furthest checkpoint, or start the trail over
    if (s.checkpoint > 0) {
      button(this, 230, 545, 330, 74, `CONTINUE · ${s.checkpoint} m`, 'green', () => this.startRun(s.checkpoint), { size: 28 });
      button(this, 230, 632, 330, 58, 'NEW RUN', 'blue', () => this.startRun(0), { size: 24 });
    } else {
      button(this, 230, 570, 330, 84, 'RIDE OUT', 'green', () => this.startRun(0), { size: 36 });
    }
    text(this, 230, 684, `Best: ${s.bestDistance} m`, 18, { ui: true, color: '#cfe3ff' });

    this.input.once('pointerdown', unlockAudio);
  }

  startRun(startM) {
    this.scene.start('Run', { startM });
  }

  refresh() {
    const s = getSave();
    this.coins.set(s.coins);
    this.upgradeLayer.removeAll(true);
    this.weaponLayer.removeAll(true);
    this.buildUpgrades();
    this.buildWeapons();
    if (WEAPONS[s.equipped]) this.hero.setWeapon(s.equipped);
  }

  buildUpgrades() {
    const s = getSave();
    const L = this.upgradeLayer;
    L.add(woodBoard(this, 24, 160, 440, 214, 'UPGRADES', 11));
    const deco = this.add.graphics();
    horseshoe(deco, 420, 160, 14);
    bulletHole(deco, 66, 165, 5, 5);
    bulletHole(deco, 455, 312, 3.5, 8);
    L.add(deco);
    UPGRADES.forEach((u, i) => {
      const y = 215 + i * 62;
      const lvl = s.upgrades[u.key];
      const maxed = lvl >= MAX_UPGRADE;
      const cost = upgradeCost(lvl);
      const affordable = s.coins >= cost;
      const b = button(this, 92, y, 112, 46, maxed ? 'MAX' : `● ${cost}`, maxed ? 'gray' : affordable ? 'green' : 'gray', () => {
        if (maxed) return;
        if (!spend(cost)) { this.cameras.main.shake(120, 0.004); return; }
        s.upgrades[u.key] += 1;
        save();
        sfx.coin();
        this.refresh();
      }, { ui: true, size: 20 });
      L.add(b);
      L.add(text(this, 162, y - 10, u.label, 18, { ui: true, ox: 0, color: `#${u.color.toString(16).padStart(6, '0')}` }));
      L.add(text(this, 162, y + 13, u.text, 15, { ui: true, ox: 0, color: '#e9dcc4' }));
      // level shown as a row of cartridges: brass ones bought, empty slots still to buy
      const pips = this.add.graphics();
      for (let p = 0; p < MAX_UPGRADE; p++) {
        const px = 304 + p * 15;
        if (p < lvl) {
          ellipse(pips, 0x9aa0a6, px + 5, y - 6, 9, 12, 1.4);
          rrect(pips, 0xd9a441, px, y - 4, 10, 15, 2, 1.4);
          pips.fillStyle(0xfff0b8, 0.6); pips.fillRect(px + 2, y - 2, 2, 10);
        } else {
          rrect(pips, 0x3b2412, px, y - 6, 10, 17, 3, 1.2);
        }
      }
      L.add(pips);
    });
  }

  buildWeapons() {
    const s = getSave();
    const L = this.weaponLayer;
    L.add(woodBoard(this, 890, 120, 370, 386, 'GUN BELT', 23));
    const deco = this.add.graphics();
    pinnedStar(deco, 1236, 122, 14);
    bulletHole(deco, 922, 122, 5, 9);
    bulletHole(deco, 1253, 318, 3.5, 4);
    L.add(deco);
    WEAPON_ORDER.forEach((key, i) => {
      const w = WEAPONS[key];
      const y = 190 + i * 88;
      const owned = !!s.owned[key];
      const equipped = s.equipped === key;
      // each gun has a leather slot with stitching; the equipped one is trimmed in gold
      const card = this.add.graphics();
      rrect(card, equipped ? 0x8a4f26 : 0x5e3418, 904, y - 38, 342, 78, 10, 2.4);
      card.lineStyle(1.6, 0xd8b27a, 0.8);
      for (let sx = 914; sx < 1238; sx += 12) {
        card.lineBetween(sx, y - 31, sx + 6, y - 31);
        card.lineBetween(sx, y + 33, sx + 6, y + 33);
      }
      if (equipped) { card.lineStyle(3, 0xf6c343); card.strokeRoundedRect(904, y - 38, 342, 78, 10); }
      L.add(card);
      L.add(text(this, 920, y - 14, w.name.toUpperCase(), 20, { ui: true, ox: 0 }));
      L.add(text(this, 920, y + 12, w.desc, 14, { ui: true, ox: 0, color: '#d9c9ad' }));

      if (owned) {
        L.add(button(this, 1180, y, 110, 46, equipped ? 'READY' : 'EQUIP', equipped ? 'gray' : 'yellow', () => {
          if (equipped) return;
          s.equipped = key;
          save();
          this.refresh();
        }, { ui: true, size: 18 }));
      } else {
        const can = s.coins >= w.price;
        L.add(button(this, 1180, y - 12, 110, 38, `● ${w.price}`, can ? 'green' : 'gray', () => {
          if (!spend(w.price)) { this.cameras.main.shake(120, 0.004); return; }
          s.owned[key] = true;
          s.equipped = key;
          save();
          sfx.coin();
          this.refresh();
        }, { ui: true, size: 17 }));
        L.add(button(this, 1180, y + 22, 110, 26, '▶ TRY FREE', 'blue', async () => {
          const ok = await rewardedAd();
          if (ok) this.scene.start('Run', { startM: s.checkpoint, trial: key });
        }, { ui: true, size: 13 }));
      }
    });
  }

  buildGift() {
    const s = getSave();
    const x = 790;
    const y = 300;
    const box = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x5e3b1e); g.fillRoundedRect(-44, -30, 88, 60, 8);
    g.fillStyle(0x8b5a2b); g.fillRoundedRect(-44, -30, 88, 22, 8);
    g.fillStyle(0x9aa0a6); g.fillRect(-44, -10, 88, 6); g.fillRect(-6, -30, 12, 60);
    g.fillStyle(0xf8d24a); g.fillRoundedRect(-9, -6, 18, 16, 3);
    box.add(g);
    box.setSize(100, 70).setInteractive({ useHandCursor: true });
    const label = text(this, x, y + 54, '', 20, { ui: true });
    this.giftLabel = label;
    this.giftBox = box;
    box.on('pointerup', () => {
      if (Date.now() < s.nextGiftAt) return;
      s.nextGiftAt = Date.now() + GIFT_INTERVAL_MS;
      addCoins(GIFT_COINS);
      sfx.win();
      this.flyCoins(x, y, 8);
      this.time.delayedCall(700, () => this.refresh());
    });
    this.giftPulse = this.tweens.add({ targets: box, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, repeat: -1, repeatDelay: 900, paused: true });
  }

  flyCoins(x, y, n) {
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x, y, 'coin').setDepth(80);
      this.tweens.add({
        targets: c,
        x: this.coins.x - 62,
        y: this.coins.y,
        delay: i * 50,
        duration: 550,
        ease: 'Cubic.easeIn',
        onComplete: () => { c.destroy(); this.coins.pop(); sfx.coin(); this.coins.set(getSave().coins); },
      });
    }
  }

  update() {
    const s = getSave();
    const left = s.nextGiftAt - Date.now();
    if (left <= 0) {
      this.giftLabel.setText('OPEN!').setColor('#ffe48a');
      if (this.giftPulse.paused) this.giftPulse.resume();
    } else {
      const m = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      this.giftLabel.setText(`${m}:${String(sec).padStart(2, '0')}`).setColor('#d9c9ad');
      if (!this.giftPulse.paused) { this.giftPulse.pause(); this.giftBox.angle = 0; }
    }
  }
}
