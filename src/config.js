// All balance numbers live here so tuning never means hunting through scene code.

export const W = 1280;
export const H = 720;
export const GROUND_Y = 610;

export const FONT = 'Rye, Georgia, serif';
export const FONT_UI = 'Arial Black, Arial, sans-serif';

// The trail
export const PX_PER_M = 20; // world pixels per meter of distance
export const WALK_SPEED = 190; // px/s while the sheriff walks
export const CHECKPOINT_M = 200; // a checkpoint (guarded by a boss) every N meters

export const PLAYER_BASE_HP = 100;
export const BASE_SWAY = 0.08; // radians of aim wobble at Steady Hand level 0

export const WEAPONS = {
  revolver: {
    name: 'Revolver', price: 0, damage: 34, pellets: 1, spread: 0,
    cooldown: 450, clip: 6, reload: 1500, speed: 1800, sight: 260, desc: '6 shots, reliable',
  },
  shotgun: {
    name: 'Shotgun', price: 400, damage: 15, pellets: 4, spread: 0.09,
    cooldown: 950, clip: 2, reload: 1500, speed: 1600, sight: 150, desc: '2 shells, 4 pellets each',
  },
  rifle: {
    name: 'Rifle', price: 900, damage: 64, pellets: 1, spread: 0,
    cooldown: 1150, clip: 1, reload: 1500, speed: 2600, sight: 460, desc: '1 round, heavy hit',
  },
};
export const WEAPON_ORDER = ['revolver', 'shotgun', 'rifle'];
// `cooldown` = ms between shots, `clip` = rounds per load, `reload` = ms to reload.
// Bullets fly in straight lines; `sight` is how far the aiming line reaches (px).
export const ENEMY_BULLET_SPEED = { revolver: 1150, shotgun: 1000, rifle: 1600 };

// Character sizes
export const SHERIFF_SCALE = 1.55;
export const OUTLAW_SCALE = 1.45;
export const BOSS_SCALE = 1.6;

export const UPGRADES = [
  { key: 'damage', label: 'DAMAGE', per: 0.08, color: 0xff6b5b, text: '+8%' },
  { key: 'health', label: 'HEALTH', per: 0.10, color: 0x5bd47a, text: '+10%' },
  { key: 'steady', label: 'STEADY HAND', per: 0.08, color: 0x6bb8ff, text: '-8% sway' },
];
export const MAX_UPGRADE = 10;
export const upgradeCost = (lvl) => 120 + lvl * 80;

// Perks the sheriff picks up along the trail. `ms` = how long a timed perk lasts.
export const PERKS = {
  whiskey: { name: 'SHOT OF WHISKEY', desc: '+35% health', color: '#f3b35c' },
  vest: { name: 'BULLETPROOF VEST', desc: 'Bullets bounce off', ms: 30000, color: '#c9d2dc' },
  powder: { name: 'GUNPOWDER', desc: '+50% damage', ms: 30000, color: '#ff7a5c' },
  coffee: { name: 'HOT COFFEE', desc: 'Reload twice as fast', ms: 30000, color: '#d9a066' },
  horseshoe: { name: 'LUCKY HORSESHOE', desc: 'Double coins', ms: 45000, color: '#ffe48a' },
};
export const PERK_ORDER = ['whiskey', 'vest', 'powder', 'coffee', 'horseshoe'];
export const PERK_WEIGHTS = { whiskey: 3, vest: 1.5, powder: 2, coffee: 2, horseshoe: 1.5 };
export const PERK_SPAWN_CHANCE = 0.45; // chance of a perk on the road before an encounter
export const PERK_DROP_CHANCE = 0.25; // chance a killed outlaw drops one

export const GIFT_INTERVAL_MS = 4 * 60 * 1000;
export const GIFT_COINS = 60;

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

// Difficulty level grows with distance walked.
export const levelAt = (meters) => 1 + meters / 90;

// How many outlaws an encounter has at this distance.
export const groupSize = (meters) => (meters > 120 && Math.random() < Math.min(0.55, meters / 800) ? 2 : 1);

// Chance that an outlaw's shot is aimed to hit; the rest are deliberate near misses.
// Grows with distance so the trail gets more dangerous the further the sheriff goes.
export const OUTLAW_ACCURACY = { start: 0.3, per100m: 0.045, max: 0.75, bossBonus: 0.1 };
export const hitChanceAt = (meters, boss = false) => Math.min(
  OUTLAW_ACCURACY.max + (boss ? OUTLAW_ACCURACY.bossBonus : 0),
  OUTLAW_ACCURACY.start + (meters / 100) * OUTLAW_ACCURACY.per100m + (boss ? OUTLAW_ACCURACY.bossBonus : 0),
);

export function makeFoe(meters, { boss = false, elevated = false } = {}, rng = Math.random) {
  const level = levelAt(meters);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const perches = elevated ? ['balcony', 'rooftop', 'tower'] : ['street', 'street', 'crates', 'balcony'];
  return {
    name: boss ? pick(BOSSES) : pick(NAMES),
    boss,
    hp: Math.round(60 + level * 18 + (boss ? 80 : 0)),
    damage: Math.round(10 + level * 2.5 + (boss ? 4 : 0)),
    hitChance: hitChanceAt(meters, boss),
    fireMin: Math.max(0.9, 1.7 - level * 0.07),
    fireMax: Math.max(1.6, 2.7 - level * 0.08),
    reactMs: Math.max(300, 700 - level * 35),
    coins: 15 + Math.round(level * 4) + (boss ? 50 : 0),
    weapon: boss ? 'rifle' : rng() < Math.min(0.35, level * 0.05) ? 'shotgun' : 'revolver',
    look: {
      shirt: pick(SHIRTS),
      hat: pick(HATS),
      bandana: rng() < 0.6 ? pick(BANDANAS) : null,
      vest: rng() < 0.5 ? 0x3b2a1e : null,
      mustache: rng() < 0.7,
      pants: 0x3d3346,
      scale: boss ? BOSS_SCALE : OUTLAW_SCALE,
    },
    perch: boss ? 'street' : pick(perches),
  };
}
