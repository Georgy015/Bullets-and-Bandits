// All balance numbers live here so tuning never means hunting through scene code.

export const W = 1280;
export const H = 720;
export const GROUND_Y = 610;
export const GRAVITY = 900; // px/s², applied to every projectile

export const FONT = 'Rye, Georgia, serif';
export const FONT_UI = 'Arial Black, Arial, sans-serif';

export const PLAYER_BASE_HP = 100;
export const BASE_SWAY = 0.11; // radians of aim wobble at Steady Hand level 0

export const WEAPONS = {
  revolver: {
    name: 'Revolver', price: 0, damage: 34, pellets: 1, spread: 0,
    cooldown: 450, speed: 1500, preview: 14, desc: 'Reliable six-shooter',
  },
  shotgun: {
    name: 'Shotgun', price: 400, damage: 15, pellets: 4, spread: 0.09,
    cooldown: 950, speed: 1300, preview: 8, desc: '4 pellets, short sight',
  },
  rifle: {
    name: 'Rifle', price: 900, damage: 64, pellets: 1, spread: 0,
    cooldown: 1150, speed: 2000, preview: 22, desc: 'Heavy hit, long sight',
  },
  dynamite: {
    name: 'Dynamite', price: 1500, damage: 75, pellets: 1, spread: 0,
    cooldown: 1700, speed: 950, preview: 10, explosive: 95, desc: 'Lob it. Boom.',
  },
};
export const WEAPON_ORDER = ['revolver', 'shotgun', 'rifle', 'dynamite'];

export const UPGRADES = [
  { key: 'damage', label: 'DAMAGE', per: 0.08, color: 0xff6b5b, text: '+8%' },
  { key: 'health', label: 'HEALTH', per: 0.10, color: 0x5bd47a, text: '+10%' },
  { key: 'steady', label: 'STEADY HAND', per: 0.08, color: 0x6bb8ff, text: '-8% sway' },
];
export const MAX_UPGRADE = 10;
export const upgradeCost = (lvl) => 120 + lvl * 80;

export const GIFT_INTERVAL_MS = 4 * 60 * 1000;
export const GIFT_COINS = 60;

export const FOES_PER_DAY = 3;

const NAMES = [
  'Dusty Pete', 'Rattlesnake Ray', 'Two-Bit Tom', 'Cactus Carl', 'Slim Jim',
  'Mad Dog Mike', 'Whiskey Walt', 'Lefty Lou', 'Buckshot Bill', 'Coyote Cole',
];
const BOSSES = [
  'One-Eyed Jack', 'Black Bart', 'The Undertaker', 'Diamond Dan', 'El Diablo',
];
const SHIRTS = [0xc0392b, 0x8e44ad, 0x2c3e50, 0x16a085, 0x7f8c8d, 0xd35400, 0x34495e];
const HATS = [0x2b1d14, 0x4a3426, 0x1d1d1d, 0x6b4b2a, 0x3d2b4f];
const BANDANAS = [0xb03a2e, 0x1f618d, 0x111111, 0x7d3c98];

// Difficulty grows with `level` (the day in Duel mode, scaled kills in Endless).
export function makeFoe(level, index, boss, rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const name = boss ? pick(BOSSES) : pick(NAMES);
  return {
    name,
    boss,
    hp: Math.round(60 + level * 18 + (boss ? 70 : 0)),
    damage: Math.round(10 + level * 2.5 + (boss ? 4 : 0)),
    aimError: Math.max(0.035, 0.2 - level * 0.014 - (boss ? 0.03 : 0)),
    fireMin: Math.max(0.9, 1.7 - level * 0.07),
    fireMax: Math.max(1.6, 2.7 - level * 0.08),
    reactMs: Math.max(300, 760 - level * 35 - (boss ? 60 : 0)),
    coins: 15 + Math.round(level * 4) + (boss ? 40 : 0),
    look: {
      shirt: pick(SHIRTS),
      hat: pick(HATS),
      bandana: rng() < 0.6 ? pick(BANDANAS) : null,
      vest: rng() < 0.5 ? 0x3b2a1e : null,
      mustache: rng() < 0.7,
      scale: boss ? 1.18 : 1.05,
    },
    perch: pick(index === 0 ? ['street', 'crates'] : ['street', 'balcony', 'rooftop', 'tower', 'crates']),
  };
}
