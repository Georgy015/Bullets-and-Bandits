# Saloon Shootout

A single-player Wild West duel game for the web, built with [Phaser 3](https://phaser.io) and aimed at [CrazyGames](https://www.crazygames.com).

> Draft / prototype. All art and sound are generated in code so the game runs with no asset files. Real art and audio come later.

## Play locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## What's in the draft

**Core loop**
- **Quick-draw opening:** "Ready… Steady… DRAW!". Tap first to land a free hit worth part of the outlaw's health. Tap too early or too late and he shoots first.
- **Aimed gunfight:** drag back from anywhere, aim and release. A partial trajectory preview helps you aim. Bullets drop with gravity. Aim wobbles slightly (Steady Hand reduces it).
- **Enemy "!" warning:** outlaws show a warning about 0.7 s before they fire. Hitting them staggers their shot.
- **Headshots** do 2× damage and knock the hat off. Kills trigger slow motion.

**Modes**
- **Duel:** daily bounties with 3 outlaws per day. The third is a boss with a WANTED poster. Clearing a day unlocks the next.
- **Endless Trail:** walk down Main Street fighting outlaw after outlaw. Every 5th is a boss. Score is distance, and your best is saved.

**Meta / economy**
- Coins from every kill (bosses pay more).
- 3 upgrades, 10 levels each: Damage, Health, Steady Hand.
- Gun belt: Revolver (free), Shotgun, Rifle, Dynamite. Buy with coins, or **Try Free** with a rewarded ad.
- Strongbox gift every 4 minutes.
- Rewarded ads: double coins, revive once per run, weapon trial. Midgame ad when leaving the result screen.

## Code map

| File | Purpose |
|---|---|
| `src/config.js` | **All balance numbers**: weapons, upgrades, enemy scaling, prices |
| `src/scenes/MenuScene.js` | Main menu: upgrades, gun belt, gift, mode select |
| `src/scenes/GameScene.js` | Duel / endless gameplay, quick draw, AI, bullets, results |
| `src/gunslinger.js` | Cowboy drawing, aiming arm, hit zones, death / hat animations |
| `src/art.js` | Procedural backgrounds, perches (balcony, rooftop, tower, crates), sprites |
| `src/ui.js` | Buttons, panels, bars, floating text |
| `src/sfx.js` | Synthesized sound effects (WebAudio) |
| `src/sdk.js` | CrazyGames SDK v3 wrapper: ads, gameplay events, cloud save. Falls back to stubs when the SDK is absent |
| `src/save.js` | Save data (coins, upgrades, weapons, progress) |

## CrazyGames integration status

- [x] SDK v3 loaded in `index.html`, initialized in `BootScene`
- [x] `loadingStart/Stop`, `gameplayStart/Stop`, `happytime` (on clearing a day)
- [x] Rewarded and midgame ads; audio muted while an ad plays
- [x] Save through the SDK data module (falls back to `localStorage`)
- [x] Relative asset paths (`base: './'`), build is ~1.5 MB (limit: 20 MB for mobile homepage)
- [ ] In-game purchases (Xsolla). Invite-only; apply after Full Launch numbers look good
- [ ] Test inside the CrazyGames QA tool / preview environment
- [ ] Cover art, thumbnails, trailer

## Roadmap

1. **Feel pass:** tune enemy timing and accuracy, damage, bullet speed and preview length (`config.js`).
2. **Real art:** modular paper-doll cowboys (hats, faces, shirts as swappable parts), 3–4 painted backgrounds.
3. **Real audio:** gunshots, ricochets, a Western music loop.
4. **More content:** characters with perks, more ammo types (incendiary, explosive, lasso), new locations (train station, canyon, mine).
5. **Monetization:** coin packs and cosmetic hats through CrazyGames in-game purchases.
