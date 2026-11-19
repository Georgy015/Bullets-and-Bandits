# CrazyGames submission kit

Everything needed to submit **Bullets & Bandits** in the CrazyGames developer portal (developer.crazygames.com).

## 1. Game files

Build the upload zip from the repository root:

```bash
npm install
npm run build
mkdir -p release && rm -f release/bullets-and-bandits.zip
(cd dist && zip -qr ../release/bullets-and-bandits.zip .)
```

- Upload `release/bullets-and-bandits.zip` as an **HTML5** game. `index.html` is at the top of the zip.
- Size: about 3.7 MB zipped (4.9 MB unzipped), 86 files. All paths are relative.
- The CrazyGames SDK v3 is loaded in `index.html`. The game uses it for:
  - loading and gameplay events (`loadingStart/Stop`, `gameplayStart/Stop`) and `happytime` at checkpoints;
  - midgame ads between runs, and rewarded ads for Revive, Double Coins and Try Free;
  - cloud saves through the data module.
- **Orientation:** landscape only. Phones held upright see a "turn your device" screen.

## 2. Covers

| File | Size |
|---|---|
| `cover_1920x1080.png` | 1920 × 1080 (landscape 16:9) |
| `cover_800x1200.png` | 800 × 1200 (portrait 2:3) |
| `cover_800x800.png` | 800 × 800 (square) |

They're rendered from the game's own art and follow CrazyGames' cover rules: only the game's title as text, no borders, icons, logos or "Play" text.

## 2b. Preview videos (mandatory)

| File | Size | Length |
|---|---|---|
| `preview_landscape_1920x1080.mp4` | 1920 × 1080 (16:9) | 19.7 s |
| `preview_portrait_1080x1620.mp4` | 1080 × 1620 (2:3) | 19.7 s |

- Both open on the matching static cover and fade into gameplay, as CrazyGames asks.
- Silent, no cursor, no black bars, no promotional text, real speed (no fast-forward); H.264 MP4, 2–4 MB each.
- **Content:** a boss quick-draw duel, outlaw fights in town and the desert (headshots, twin revolvers, shotgun, rifle), a second boss duel.
- The portrait video shows the landscape gameplay as a band over a blurred version of the portrait cover, with the title on top.
- **Re-recording:** `tools/video/record_gameplay.cjs` plays the game with a small aiming bot and captures it frame by frame (the game loop is stepped at 30 fps, so the capture is smooth). `tools/video/make_previews.py` cuts out most of the walking and encodes both videos. Both need the dev server running, Playwright and ffmpeg.

## 3. Store page text

**Title:** Bullets & Bandits

**Short description:**
Help the old sheriff clean up the Wild West. Drag, aim and outdraw outlaws, bosses and dynamite throwers on an endless trail.

**Description:**
Saddle up, sheriff! Walk the trail from Deadwood Town through the desert, the red canyon and the railway station, and gun down every bandit who stands in your way.

Drag back like a slingshot to aim, release to shoot. Go for the head: headshots do triple damage and knock the hat off. Each outlaw fights differently: the Hider ducks behind his barrel, the Gambler draws lightning fast, the Rifleman picks you off from the rooftops, and Dynamite Dan lobs explosives you can shoot out of the air. Every 200 m a boss waits in a quick-draw duel, and The Undertaker's armored chest shrugs off body shots.

Collect coins, upgrade damage, health and steady hand, and buy the shotgun, rifle and twin revolvers. Grab whiskey, vests, gunpowder and lucky horseshoes along the way, and clear the bottle-shooting bonus round for dynamite.

How far can you ride?

**Controls:**
- Drag back and release (mouse or touch): aim and shoot
- R: reload
- 1–4: switch guns
- D: throw dynamite

**Tags (suggestions):** shooting, western, cowboy, gun, aim, 2D, casual, mobile

## 4. Credits (put in the description or the portal's credits field)

- Music: "Covert Affair" by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0.
- Sound effects from freesound.org: elevatorfan2020, areniporgen, serutonin-deprivd, paul368, idkmrgarcia, magnuswaker, pepsimanfan. See the main README for each sound.

## 5. Before submitting

- [ ] Check the licence of each freesound.org sound (links in the main README). CC0 needs nothing; CC BY needs the credit above; **non-commercial (NC) sounds can't be used in a game with ads** and must be replaced.
- [ ] Confirm you own, or have the rights to, all character art.
- [ ] Upload the zip and test it in the CrazyGames QA tool / preview: ads, the loading and gameplay events, and saving.
- [ ] Play it on a real phone: aiming, button sizes and speed.
- [ ] Upload the two preview videos with the covers.
