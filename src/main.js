import Phaser from 'phaser';
import '@fontsource/ultra/400.css';
import '@fontsource/arvo/700.css';
import { W, H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { RunScene } from './scenes/RunScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#120c1c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [BootScene, MenuScene, RunScene],
});

// Handy for debugging and automated play-testing in dev builds only.
if (import.meta.env.DEV) window.__game = game;
