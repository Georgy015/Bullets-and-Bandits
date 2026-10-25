// All balance numbers live here so tuning never means hunting through scene code.

export const W = 1280;
export const H = 720;
export const GROUND_Y = 610;
export const GRAVITY = 900; // px/s², only for lobbed projectiles (dynamite)

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
  // Two revolvers firing alternately: lots of lead, but a shakier aim (swayMult).
  dual: {
    name: 'Twin Revolvers', short: 'TWINS', price: 1400, damage: 28, pellets: 1, spread: 0,
    cooldown: 230, clip: 12, reload: 1500, speed: 1800, sight: 240, swayMult: 1.35, desc: '12 shots, fast, shaky aim',
  },
};
export const WEAPON_ORDER = ['revolver', 'shotgun', 'rifle', 'dual'];
// `cooldown` = ms between shots, `clip` = rounds per load, `reload` = ms to reload.
// Bullets fly in straight lines; `sight` is how far the aiming line reaches (px).
export const ENEMY_BULLET_SPEED = { revolver: 1150, shotgun: 1000, rifle: 1600, dual: 1150 };

// Damage multiplier when the sheriff's bullet hits an outlaw in the head.
export const HEADSHOT_MULT = 3;

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

// Bottle-shooting bonus round, right after every Nth checkpoint
export const BONUS = {
  everyM: 400, // at 400 m, 800 m, ...
  bottles: 10,
  seconds: 30,
  rewardDynamite: 5,
  coinsPerBottle: 2,
};

// The sheriff's dynamite (earned in bonus rounds): lobbed at the nearest outlaw.
export const PLAYER_DYNAMITE = { damage: 160, radius: 125, flightS: 0.9, cooldown: 900 };

export const GIFT_INTERVAL_MS = 4 * 60 * 1000;
export const GIFT_COINS = 60;

const NAMES = [
  'Dusty Pete', 'Rattlesnake Ray', 'Two-Bit Tom', 'Cactus Carl', 'Slim Jim',
  'Mad Dog Mike', 'Whiskey Walt', 'Lefty Lou', 'Buckshot Bill', 'Coyote Cole',
];
const BOSSES = ['One-Eyed Jack', 'Black Bart', 'Diamond Dan', 'El Diablo'];
const SHIRTS = [0xc0392b, 0x8e44ad, 0x2c3e50, 0x16a085, 0x7f8c8d, 0xd35400, 0x34495e];
const HATS = [0x2b1d14, 0x4a3426, 0x1d1d1d, 0x6b4b2a, 0x3d2b4f];
const BANDANAS = [0xb03a2e, 0x1f618d, 0x111111, 0x7d3c98];

// Difficulty level grows with distance walked.
export const levelAt = (meters) => 1 + meters / 90;

// How many outlaws an encounter has at this distance.
export const groupSize = (meters) => (meters > 120 && Math.random() < Math.min(0.55, meters / 800) ? 2 : 1);

// Chance that an outlaw's shot is aimed to hit; the rest are deliberate near misses.
// Grows with distance so the trail gets more dangerous the further the sheriff goes.
export const OUTLAW_ACCURACY = { start: 0.2, per100m: 0.045, max: 0.75, bossBonus: 0.1 };
export const hitChanceAt = (meters, boss = false) => Math.min(
  OUTLAW_ACCURACY.max + (boss ? OUTLAW_ACCURACY.bossBonus : 0),
  OUTLAW_ACCURACY.start + (meters / 100) * OUTLAW_ACCURACY.per100m + (boss ? OUTLAW_ACCURACY.bossBonus : 0),
);

// Outlaw types. `from` = first meter it can appear; `weight` = how often once unlocked.
// Multipliers apply on top of the distance-based stats in makeFoe.
export const OUTLAWS = {
  drifter: { from: 0, weight: 3 },
  hider: {
    from: 40, weight: 2, label: 'HIDER', hp: 0.9, perch: 'street',
    tip: 'HIDER: shoot when he pops up from cover!',
  },
  gambler: {
    from: 80, weight: 1.5, label: 'GAMBLER', hp: 0.6, damage: 0.9, rate: 0.7, windup: 350, coins: 1.2,
    tip: 'GAMBLER: lightning draw but weak. Drop him first!',
  },
  rifleman: {
    from: 120, weight: 1.5, label: 'RIFLEMAN', hp: 0.9, damage: 1.7, rate: 1.35, windup: 1100, coins: 1.2,
    weapon: 'rifle', perches: ['rooftop', 'tower'],
    tip: 'RIFLEMAN: slow but deadly. Watch for the glint!',
  },
  dynamite: {
    from: 160, weight: 1.2, label: 'DYNAMITE DAN', damage: 1.5, rate: 1.4, windup: 900, coins: 1.2,
    weapon: 'dynamite', tip: 'DYNAMITE DAN: shoot the dynamite out of the air!',
  },
};

export const BOSS_TYPES = {
  gunslinger: { weight: 1 },
  undertaker: {
    weight: 1, label: 'THE UNDERTAKER', name: 'The Undertaker', armor: 0.25, rate: 0.85, weapon: 'revolver',
    tip: 'THE UNDERTAKER: armored chest. Aim for the head!',
  },
};

// Testing aid: ?outlaw=<type> or ?boss=<type> in the page URL forces that type.
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const FORCE_OUTLAW = OUTLAWS[params.get('outlaw')] ? params.get('outlaw') : null;
const FORCE_BOSS = BOSS_TYPES[params.get('boss')] ? params.get('boss') : null;
// ?bonus starts a bonus round a few seconds into the run.
export const FORCE_BONUS = params.has('bonus');

function pickType(table, meters, rng) {
  const options = Object.entries(table).filter(([, t]) => (t.from ?? 0) <= meters);
  let r = rng() * options.reduce((sum, [, t]) => sum + t.weight, 0);
  for (const [key, t] of options) {
    r -= t.weight;
    if (r <= 0) return key;
  }
  return options[0][0];
}

function lookFor(type, boss, rng) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const base = {
    shirt: pick(SHIRTS), hat: pick(HATS), bandana: rng() < 0.6 ? pick(BANDANAS) : null,
    vest: rng() < 0.5 ? 0x3b2a1e : null, mustache: rng() < 0.7, pants: 0x3d3346,
    scale: boss ? BOSS_SCALE : OUTLAW_SCALE,
  };
  // Refined image parts (preview cut from the character sheet) for the plain outlaw types
  // Only the plain head has a drawn dead version; bandana heads get X eyes painted on instead
  const art = (torso, head, hat) => ({ art: 'outlaw', artParts: { torso, head, hat, head_dead: head === 'head' ? 'head_dead' : 'none' } });
  switch (type) {
    case 'hider':
      return { ...base, shirt: 0x6b5a3a, hat: 0x3a2a1a, hatStyle: 'flat', bandana: pick(BANDANAS), vest: null,
        ...art('torso_plain', 'head_bandana', 'hat_flat') };
    case 'gambler':
      return { ...base, shirt: 0xf2efe6, sleeve: 0x1c1c22, coat: 0x1c1c22, vest: 0x8c1c1c, hat: 0x1c1c22,
        hatStyle: 'top', hatBand: 0x8c1c1c, bandana: null, mustache: true };
    case 'rifleman':
      return { ...base, shirt: 0x5a4632, sleeve: 0xb08d57, coat: 0xb08d57, hat: 0x5a4030, hatStyle: 'flat',
        vest: null, bandana: 0x6e6e6e };
    case 'dynamite':
      return { ...base, shirt: 0xb03a2e, hat: 0x2b2b2b, hatStyle: 'bowler', vest: 0x2b1a10, bandana: null, mustache: true };
    case 'undertaker':
      return { ...base, shirt: 0x3a3a42, sleeve: 0x15151a, coat: 0x15151a, hat: 0x15151a, hatStyle: 'top',
        hatBand: 0x5a5a64, skin: 0xd9cfc4, mustache: true, mustacheColor: 0x9a9a9a, bandana: null, vest: null, armor: true };
    default:
      if (boss) return base;
      return { ...base, ...art(base.vest ? 'torso_vest' : 'torso_plain', base.bandana ? 'head_bandana' : 'head', 'hat_cowboy') };
  }
}

export function makeFoe(meters, { boss = false, elevated = false } = {}, rng = Math.random) {
  const level = levelAt(meters);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const type = boss ? (FORCE_BOSS ?? pickType(BOSS_TYPES, meters, rng)) : (FORCE_OUTLAW ?? pickType(OUTLAWS, meters, rng));
  const T = (boss ? BOSS_TYPES : OUTLAWS)[type];
  const perches = T.perches ?? (T.perch ? [T.perch] : elevated ? ['balcony', 'rooftop', 'tower'] : ['street', 'street', 'crates', 'balcony']);
  const rate = T.rate ?? 1;
  let weapon = T.weapon;
  if (!weapon) weapon = boss ? (rng() < 0.5 ? 'dual' : 'rifle') : rng() < Math.min(0.35, level * 0.05) ? 'shotgun' : 'revolver';
  return {
    type,
    label: T.label ?? null,
    tip: T.tip ?? null,
    name: T.name ?? (boss ? pick(BOSSES) : pick(NAMES)),
    boss,
    armor: T.armor ?? 1, // fraction of body-shot damage that gets through
    hp: Math.round((60 + level * 18 + (boss ? 80 : 0)) * (T.hp ?? 1)),
    damage: Math.round((10 + level * 2.5 + (boss ? 4 : 0)) * (T.damage ?? 1)),
    hitChance: hitChanceAt(meters, boss),
    windup: T.windup ?? null,
    fireMin: Math.max(0.9, 1.7 - level * 0.07) * rate,
    fireMax: Math.max(1.6, 2.7 - level * 0.08) * rate,
    reactMs: Math.max(300, 700 - level * 35),
    coins: Math.round((15 + level * 4 + (boss ? 50 : 0)) * (T.coins ?? 1)),
    weapon,
    look: lookFor(type, boss, rng),
    perch: boss ? 'street' : pick(perches),
  };
}
