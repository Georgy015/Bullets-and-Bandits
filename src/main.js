import Phaser from 'phaser';
import '@fontsource/rye/400.css';
import { W, H, RES } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { RunScene } from './scenes/RunScene.js';

// Text is rasterised at the canvas resolution too, otherwise it would be stretched and blurry.
const addText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, str, style) {
  return addText.call(this, x, y, str, { resolution: RES, ...style });
};

// Every scene views the 1280×720 world through a camera zoomed to the canvas resolution.
const zoomCamera = (scene) => scene.cameras.main.setZoom(RES).centerOn(W / 2, H / 2);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W * RES,
  height: H * RES,
  backgroundColor: '#120c1c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [BootScene, MenuScene, RunScene],
});
// No browser right-click menu over the game.
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Leaving the tab or app mid-fight opens the pause menu, so the player comes back to a paused game.
game.events.on('hidden', () => {
  const run = game.scene.getScene('Run');
  if (game.scene.isActive('Run') && run.pause) run.pause();
});

game.events.once('ready', () => {
  for (const scene of game.scene.scenes) scene.events.on('create', () => zoomCamera(scene));
});

// Handy for debugging and automated play-testing in dev builds only.
if (import.meta.env.DEV) window.__game = game;
