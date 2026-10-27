# Bullets & Bandits

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
- **Shooting:** drag back from anywhere like a slingshot, aim and release. Bullets fly in straight lines. A short dotted sight shows the real aim, which wobbles slightly (Steady Hand reduces it), so time your release. Headshots do 3× damage (an early outlaw drops to one revolver headshot) and knock the hat off.
- **Outlaw accuracy grows with distance:** at the start about 20% of their shots hit, rising by about 4.5% per 100 m to 75% around 1200 m (bosses +10%). Misses fly well over the sheriff's hat or kick up dirt short of him, with a ricochet and a "MISS!" label. Tunable via `OUTLAW_ACCURACY` in `src/config.js`.
- **Enemy "!" warning:** an outlaw shows a warning about 0.7 s before he fires. Hitting him staggers his shot.
- **Checkpoints every 200 m:** each one is guarded by a **boss** (WANTED poster, carrying a rifle or twin revolvers that fire two quick shots per warning) you face in a **quick-draw duel**: "Ready… Steady… DRAW!". Tap first to land a big opening hit. Passing a checkpoint saves it and heals the sheriff 25%.
- **When shot:** restart from the last checkpoint for free, or watch an ad to revive on the spot (once per run). The menu offers **Continue** from the furthest checkpoint ever reached, or **New Run**.
- **Weapons:** Revolver (6 rounds), Shotgun (2 shells), Rifle (1 round), Twin Revolvers (12 rounds fired alternately from both hands, fast but with a shakier aim), each with a 1.5 s reload. Reloading starts automatically on an empty gun, or early with **R** / the RELOAD button, and all guns are reloaded while walking between fights. Switch guns mid-run with the belt buttons or keys 1–4.

### Scenery

The trail runs through four areas, changing at each checkpoint with a cross-fade and an area title, then repeating with a slightly darker sky each loop:

| Distance | Area |
|---|---|
| 0–200 m | Deadwood Town (night) |
| 200–400 m | The Desert (sunset, mesas, saguaros) |
| 400–600 m | Red Canyon (dusk, layered rock, spires, an arch) |
| 600–800 m | Railway Station (blue night, depot, boxcars, rails) |

Outlaws' perches follow the area (rock pillars in the desert and canyon, boxcar roofs and the depot at the station). Backgrounds are drawn in `src/biomes.js`; the menu shows the area of your saved checkpoint.

### Outlaws

| Outlaw | From | How he fights | How to beat him |
|---|---|---|---|
| Drifter | 0 m | Stands, warns "!", shoots | Baseline |
| Hider | 40 m | Crouches behind a barrel (it stops bullets), pops up only to shoot | Shoot when he's up |
| Gambler | 80 m | Very short warning, fires often, low health | Drop him first |
| Rifleman | 120 m | On rooftops/towers, long warning with a glint off his rifle barrel, heavy hits | Watch for the glint |
| Dynamite Dan | 160 m | Lobs dynamite that explodes where it lands | Shoot the stick mid-air (+5 coins) |

Checkpoint bosses are either a gunslinger (rifle or twin revolvers) or **The Undertaker**, whose armored chest takes only 25% damage from body shots, so aim for the head. Each type shows a tip the first time you meet it. Types, unlock distances and stats live in `OUTLAWS` / `BOSS_TYPES` in `src/config.js`.

**Testing a type:** add `?outlaw=hider` (or `gambler`, `rifleman`, `dynamite`) or `?boss=undertaker` to the page URL to force it, e.g. https://georgy015.github.io/Fast-Gun/?outlaw=dynamite

### Bonus round

Right after the 400 m checkpoint (and every 400 m after that) the sheriff stops at a shooting gallery: **10 bottles** on barrels, crates, a fence, a saloon table and a crate tower, randomly laid out. Shoot them all within **30 seconds** (normal ammo and reloads apply) to win **5 sticks of dynamite**; every bottle also pays 2 coins.

Dynamite is kept between runs. In a fight, press the red **DYNAMITE** button (or **D**) and the sheriff lobs a stick at the nearest outlaw; the blast hurts everyone nearby and ignores barrels and armor. Settings: `BONUS` and `PLAYER_DYNAMITE` in `src/config.js`. Add `?bonus` to the URL to start a bonus round right away.

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
| `src/biomes.js` | The four scenery areas: background drawing, parallax layers, area by distance |
| `src/art.js` | Perches, checkpoint signpost, perk icons and other sprites |
| `src/ink.js` | Cartoon drawing helpers: filled shapes with dark outlines, color shading |
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
