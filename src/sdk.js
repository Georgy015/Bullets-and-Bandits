// Thin wrapper around the CrazyGames SDK v3. Every call degrades to a local stub when the
// SDK is missing (offline dev, other portals), so game code never checks for it directly.

let sdk = null;
let onAdStart = () => {};
let onAdEnd = () => {};

export async function initSDK() {
  try {
    const cg = window.CrazyGames?.SDK;
    if (!cg) return;
    await cg.init();
    // Off CrazyGames (e.g. GitHub Pages) the SDK reports "disabled" and every ad fails,
    // so use the local stubs there instead.
    if (cg.environment === 'disabled') return;
    sdk = cg;
  } catch (e) {
    console.warn('[sdk] CrazyGames SDK unavailable, using stubs', e);
    sdk = null;
  }
}

export const hasSDK = () => !!sdk;

// The game mutes itself while an ad plays.
export function setAdHooks(start, end) {
  onAdStart = start;
  onAdEnd = end;
}

const call = (fn) => {
  try { fn(); } catch (e) { console.warn('[sdk]', e); }
};

export const loadingStart = () => sdk && call(() => sdk.game.loadingStart());
export const loadingStop = () => sdk && call(() => sdk.game.loadingStop());
export const gameplayStart = () => sdk && call(() => sdk.game.gameplayStart());
export const gameplayStop = () => sdk && call(() => sdk.game.gameplayStop());
export const happytime = () => sdk && call(() => sdk.game.happytime());

function requestAd(type) {
  return new Promise((resolve) => {
    if (!sdk) {
      // Local stub: pretend an ad ran so rewarded flows can be tested.
      console.info(`[sdk] (stub) ${type} ad`);
      onAdStart();
      setTimeout(() => { onAdEnd(); resolve(true); }, 400);
      return;
    }
    let started = false;
    try {
      sdk.ad.requestAd(type, {
        adStarted: () => { started = true; onAdStart(); },
        adFinished: () => { onAdEnd(); resolve(true); },
        adError: () => { if (started) onAdEnd(); resolve(false); },
      });
    } catch (e) {
      console.warn('[sdk]', e);
      resolve(false);
    }
  });
}

// Resolves true only when the player watched the whole ad and should get the reward.
export const rewardedAd = () => requestAd('rewarded');
export const midgameAd = () => requestAd('midgame');

// Key/value storage: CrazyGames data module (cloud save for signed-in players) or localStorage.
export function storageGet(key) {
  try {
    if (sdk?.data) return sdk.data.getItem(key);
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    if (sdk?.data) sdk.data.setItem(key, value);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode etc.). Progress just won't persist.
  }
}
