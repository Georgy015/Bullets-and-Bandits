import Phaser from 'phaser';
import '@fontsource/rye/400.css';
import { W, H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

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
  scene: [BootScene, MenuScene, GameScene],
});

// Handy for debugging and automated play-testing in dev builds only.
if (import.meta.env.DEV) window.__game = game;
