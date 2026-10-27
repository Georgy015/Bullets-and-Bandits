import { storageGet, storageSet } from './sdk.js';

const KEY = 'fast-gun-save-v1'; // kept from the old name so saves carry over

const DEFAULTS = () => ({
  coins: 0,
  bestDistance: 0,
  checkpoint: 0, // furthest checkpoint reached, in meters
  seenOutlaws: {}, // outlaw types already introduced with a tip
  dynamite: 0, // sticks earned in bonus rounds, kept between runs
  upgrades: { damage: 0, health: 0, steady: 0 },
  owned: { revolver: true },
  equipped: 'revolver',
  nextGiftAt: 0,
  muted: false,
});

let state = DEFAULTS();

export function loadSave() {
  const raw = storageGet(KEY);
  if (!raw) return state;
  try {
    const data = JSON.parse(raw);
    const d = DEFAULTS();
    state = {
      ...d,
      ...data,
      upgrades: { ...d.upgrades, ...data.upgrades },
      owned: { ...d.owned, ...data.owned },
    };
  } catch {
    state = DEFAULTS();
  }
  return state;
}

export const save = () => storageSet(KEY, JSON.stringify(state));
export const getSave = () => state;

export function addCoins(n) {
  state.coins += n;
  save();
}

export function spend(n) {
  if (state.coins < n) return false;
  state.coins -= n;
  save();
  return true;
}
