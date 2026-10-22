# Fast Gun

A single-player Wild West game for the web, built with [Phaser 3](https://phaser.io) and aimed at [CrazyGames](https://www.crazygames.com).

**▶ Play it: https://georgy015.github.io/Fast-Gun/** (redeployed automatically on every push to `main`)

An old sheriff walks the trail through town, runs into outlaws and shoots it out with them. Go as far as you can.

> Draft / prototype. All art and sound are generated in code so the game runs with no asset files. Real art and audio come later.

## Play locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## How it plays

- **The trail:** the sheriff walks through town while the scenery scrolls past. Distance is the score.
- **Encounters:** outlaws stand in the street, on crates, saloon balconies, rooftops and water towers. The sheriff stops and fights. From about 120 m, outlaws can come in pairs.
- **Shooting:** drag back from anywhere like a slingshot, aim and release. Bullets fly in straight lines. A short dotted sight shows the real aim, which wobbles slightly (Steady Hand reduces it), so time your release. Headshots do 2× damage and knock the hat off.
- **Outlaw accuracy grows with distance:** at the start about 20% of their shots hit, rising by about 4.5% per 100 m to 75% around 1200 m (bosses +10%). Misses fly well over the sheriff's hat or kick up dirt short of him, with a ricochet and a "MISS!" label. Tunable via `OUTLAW_ACCURACY` in `src/config.js`.
- **Enemy "!" warning:** an outlaw shows a warning about 0.7 s before he fires. Hitting him staggers his shot.
- **Checkpoints every 200 m:** each one is guarded by a **boss** (WANTED poster) you face in a **quick-draw duel**: "Ready… Steady… DRAW!". Tap first to land a big opening hit. Passing a checkpoint saves it and heals the sheriff 25%.
- **When shot:** restart from the last checkpoint for free, or watch an ad to revive on the spot (once per run). The menu offers **Continue** from the furthest checkpoint ever reached, or **New Run**.
- **Weapons:** Revolver (6 rounds), Shotgun (2 shells), Rifle (1 round), Twin Revolvers (12 rounds fired alternately from both hands, fast but with a shakier aim), each with a 1.5 s reload. Reloading starts automatically on an empty gun, or early with **R** / the RELOAD button, and all guns are reloaded while walking between fights. Switch guns mid-run with the belt buttons or keys 1–4.

### Perks picked up along the trail

| Perk | Effect |
|---|---|
| Shot of Whiskey | +35% health |
| Bulletproof Vest | Bullets bounce off for 30 s |
| Gunpowder | +50% damage for 30 s |
| Hot Coffee | Fire and reload twice as fast for 30 s |
| Lucky Horseshoe | Double coins for 45 s |

Perks lie on the road ahead of some encounters, and outlaws sometimes drop one (bosses always do). Durations, weights and drop chances are in `src/config.js`.

### Between runs

- Coins from every outlaw (bosses pay more).
- 3 permanent upgrades, 10 levels each: Damage, Health, Steady Hand.
- Buy the Shotgun, Rifle and Twin Revolvers, or **Try Free** for a run with a rewarded ad.
- Strongbox gift every 4 minutes.

## Code map

| File | Purpose |
|---|---|
| `src/config.js` | **All balance numbers**: weapons, perks, upgrades, checkpoint spacing, enemy scaling |
| `src/scenes/RunScene.js` | The trail: walking, spawning, encounters, boss quick draw, perks, checkpoints, results |
| `src/scenes/MenuScene.js` | Main menu: upgrades, gun belt, gift, continue / new run |
| `src/gunslinger.js` | Sheriff and outlaw drawing, walking legs, aiming arm, hit zones, death / hat animations |
| `src/art.js` | Procedural backgrounds, perches, checkpoint signpost, perk icons and other sprites |
| `src/ui.js` | Buttons, panels, bars, floating text, banners |
| `src/sfx.js` | Synthesized sound effects (WebAudio) |
| `src/sdk.js` | CrazyGames SDK v3 wrapper: ads, gameplay events, cloud save. Falls back to stubs when the SDK is absent |
| `src/save.js` | Save data (coins, upgrades, weapons, best distance, checkpoint) |

## CrazyGames integration status

- [x] SDK v3 loaded in `index.html`, initialized in `BootScene`
- [x] `loadingStart/Stop`, `gameplayStart/Stop`, `happytime` (on reaching a checkpoint)
- [x] Rewarded and midgame ads; audio muted while an ad plays
- [x] Save through the SDK data module (falls back to `localStorage`)
- [x] Relative asset paths (`base: './'`), build is ~1.5 MB (limit: 20 MB for mobile homepage)
- [ ] In-game purchases (Xsolla). Invite-only; apply after Full Launch numbers look good
- [ ] Test inside the CrazyGames QA tool / preview environment
- [ ] Cover art, thumbnails, trailer

## Roadmap

1. **Outlaw roster:** distinct bad guys with their own looks and behavior (dynamite thrower, rifleman on rooftops, fast-drawing gambler, armored boss…).
2. **Feel pass:** tune enemy timing and accuracy, damage, encounter spacing and perk balance (`config.js`).
3. **Real art:** a proper sheriff sprite, modular outlaws, painted backgrounds that change between checkpoints (town, desert, canyon, train station).
4. **Real audio:** gunshots, ricochets, spurs, a Western music loop.
5. **Monetization:** coin packs and cosmetics through CrazyGames in-game purchases.
