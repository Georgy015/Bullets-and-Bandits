import Phaser from 'phaser';
import { createSpriteTextures } from '../art.js';
import { initSDK, loadingStart, loadingStop, setAdHooks } from '../sdk.js';
import { loadSave } from '../save.js';
import { setMuted, setAdMuted } from '../sfx.js';
import { FONT, FONT_UI } from '../config.js';
import { ART_SETS } from '../gunslinger.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  // Image parts for characters that have refined artwork (code drawing is the fallback).
  preload() {
    for (const set of Object.values(ART_SETS)) {
      for (const [name, part] of Object.entries(set.parts)) this.load.image(set.prefix + name, set.dir + part.file);
    }
  }

  async create() {
    await initSDK();
    loadingStart();
    setAdHooks(() => setAdMuted(true), () => setAdMuted(false));
    const save = loadSave();
    setMuted(save.muted);
    // Text renders with a fallback font if the fonts haven't arrived yet.
    try {
      await Promise.race([
        Promise.all([document.fonts.load(`40px ${FONT.split(',')[0]}`), document.fonts.load(`bold 40px ${FONT_UI.split(',')[0]}`)]),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {
      // ignore
    }
    createSpriteTextures(this);
    loadingStop();
    this.scene.start('Menu');
  }
}
