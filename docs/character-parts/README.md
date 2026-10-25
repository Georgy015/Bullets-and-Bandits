# Character parts

This folder holds two sets of character art:

- **Original code-drawn parts** (top level): the sheriff and outlaws exactly as the game draws them today, split into the parts it animates. Each PNG is transparent and exported at **4× game size** (divide pixel values by 4 to get game units). `_overview.png` shows them all on one sheet; `_pivots.json` lists each file's size and pivot in pixels.
- **Refined sheriff artwork** (`refined/`): new art in the target style, as delivered (different canvas sizes from the originals). The fitted versions the game uses are in `public/art/sheriff/` (see [Refined artwork status](#refined-artwork-status)).

Replacement art can drop into the game without code or gameplay changes **only if** it matches the original parts' canvas size (or a known scale of it), placement, pivot points and weapon muzzle positions listed below. Art that doesn't match will need fitting or code adjustments first.

## How a character is put together

All coordinates are in game units. The character faces **right**; outlaws are the same art mirrored. The origin `(0, 0)` is **between the feet, on the ground**. Up is negative y.

| Part | Original files | Attaches at | Moves how |
|---|---|---|---|
| Legs (×2) | `*_leg_front.png` (the back leg reuses the same art, drawn darker) | Hips at `(-6, -44)` front, `(6, -44)` back. Pivot = top of the leg | Swing ±0.34 rad while walking; splay when dead |
| Torso | `*_torso*.png` | Character origin (feet) | Fixed; dips ~2.5 units while walking (when the legs are apart) |
| Head | `*_head*.png` | Character origin | Fixed to the torso |
| Hat | `hat_*.png` (cowboy, flat-brim, top hat, bowler) | Character origin, sits on the head | Flies off on a headshot |
| Gun arm | `*_arm_<gun>.png` (revolver, shotgun, rifle, dynamite) | Shoulder at `(4, -80)` | Rotates to aim (see [Weapon arms](#weapon-arms)) |
| Off-hand arm | `offhand_arm_revolver.png` (twin revolvers only, drawn darker) | Shoulder at `(-6, -92)`, behind the torso | Rotates with the gun arm |
| Armor plate | `armor_plate.png` (vest perk, the Undertaker) | Over the torso | On/off |

### Head and hit zone

The circle at `(2, -104)` with radius 19 is the **head hit zone** used for headshots; the original code-drawn head happens to be that circle. Refined heads don't have to be circular: the jaw, nose, ear, hair and cigarillo can extend beyond it. They should be positioned **around** the circle so the visible skull covers it and the face reads as being where headshots land.

### Eyes and draw order

In the current code, **eyes are a separate layer** drawn on top of the head, so they can be swapped for X eyes on death. The exported head PNGs have the eyes **baked in** for reference only (`outlaw_head_dead.png` shows the X-eyes version).

Draw order in code, back to front: shadow, back leg, front leg, off-hand arm, torso, head, **eyes**, armor, gun arm, hat.

If the game switches to complete head images, it can take one of two approaches:

1. **Heads without eyes plus separate eye overlays** (alive and dead), keeping the eye layer above.
2. **Complete heads with eyes baked in, in two versions** (alive and dead, X eyes); the separate eye layer is then removed from the code and the game swaps the whole head image on death.

The refined sheriff head has its eyes baked in, so it fits approach 2 and needs a matching dead (X-eyes) version.

### Weapon arms

Every gun arm (front and off-hand) must be drawn in the same **neutral pose**:

- **Horizontal**, pointing right (rotation 0), with the sleeve starting at the shoulder.
- **Pivot = the shoulder**, placed at the arm's local `(0, 0)`; the sleeve begins slightly behind it (about 6 units).
- A **defined muzzle position** for each weapon, measured from the shoulder in game units. Current values:

| Weapon | Muzzle (x, y) from the shoulder |
|---|---|
| Revolver / twin revolvers | (68, -5) |
| Shotgun | (86, -5) |
| Rifle | (96, -4) |
| Dynamite (stick held up) | (38, -18) |

In play the arm rotates from about -1.5 rad (aiming up) to +1.0 rad (aiming down), rests at 1.35 rad when holstered, kicks up 0.3 rad on recoil and drops to about 1.75 rad (along the body) on death. The off-hand arm uses the same pose and pivot rules at its own shoulder and rotates with the gun arm.

## Sizes in the game

- Sheriff drawn at **1.55×** game units (≈ 230 px tall on a 1280×720 screen); outlaws at **1.45×**, bosses at **1.6×**.
- Hit zones: head = the circle above; body = a 40 × 92 box above the feet.

## Variants (original parts)

| File | What it is |
|---|---|
| `sheriff_*` | The old sheriff: poncho, star badge, grey hair and stubble, squint, cigarillo, spurs |
| `outlaw_torso_vest` / `outlaw_torso_plain` | Base outlaw torso, with and without a vest (shirt colours are recoloured per outlaw) |
| `outlaw_head`, `outlaw_head_bandana`, `outlaw_head_dead` | Base outlaw head, with bandana, dead (X eyes) |
| `hat_*` | The four hat styles used across the outlaw types |
| `assembled_sheriff`, `assembled_outlaw` | All original parts put together by the game code |

The Gambler, Rifleman, Dynamite Dan and the Undertaker are the same base with different colours, coats and hats (see `lookFor()` in `src/config.js`).

## Visual direction

- Use the first refined sheriff (`refined/sheriff_reference.webp`) as the **main style reference**.
- Preserve his older face, angular grey brows, narrow squint, prominent nose, grey stubble, cigarillo, broad hat, poncho, badge and spurs.
- Apply heavier dark-brown outlines, stronger silhouettes, restrained geometric shading, fuller hands and boots, and fewer, broader fringe tabs.
- Extend that treatment consistently to the outlaws, weapons, hats and armor.
- Keep heads and hats as separate pieces, with enough hidden overlap at the shoulders and hips to prevent gaps when parts rotate.
- Check readability at the actual on-screen size (≈ 230 px tall for the sheriff).

The existing coordinates, animation angles, character scales and hit zones above remain the **implementation targets**. Artwork should be fitted to those values before it is described as ready to drop into the game.

## Refined artwork status

The head, torso, leg, revolver arm and hat have been **fitted** and are used for the sheriff in the game. The fitted files (3 px per game unit) are in `public/art/sheriff/`, with each part's anchor in `manifest.json` (copied to `src/art/sheriff.json`). `refined/_fit_check.png` shows the fitted parts assembled with the game's attachment points, hit zones and muzzle, next to the reference. Add `?art=code` to the game URL to compare with the code-drawn sheriff.

| File | Canvas (px) | Status |
|---|---|---|
| `refined/sheriff_reference.webp` | 1080 × 1456 | Style reference showing the **intended appearance**. It was generated as a whole image and is not proof that the parts align; `_fit_check.png` is the alignment check. |
| `refined/sheriff_head.webp` | 1327 × 1185 | **Fitted**: skull height 40 units, centred on the head hit circle. Eyes are baked in; on death the game swaps in `refined/sheriff_head_dead.webp` (same canvas, same placement). |
| `refined/sheriff_arm_shotgun.webp`, `sheriff_arm_rifle.webp`, `sheriff_arm_dynamite.png`, `sheriff_offhand_arm_revolver.png` | various | **Fitted** like the revolver arm (sleeve 15 units, shoulder 7 units in). Muzzles: shotgun (101.9, -6.1), rifle (116.9, -6.1, the longest gun), dynamite fuse tip (52.4, -25.7), off-hand revolver (78.9, -7.4). The off-hand art is drawn darker already, so the game doesn't tint it. |
| `refined/sheriff_armor_plate.webp` | 1312 × 1199 | **Fitted**: 44 units wide, centred on the chest at (0, -68). |
| `refined/sheriff_torso.webp` | 1335 × 1178 | **Fitted**: poncho shoulder width 46 units, top edge at y = -93. Slightly wider at the fringe than the original (66 vs 62 units). |
| `refined/sheriff_leg.webp` | 953 × 1651 | **Fitted**: 44.5 units from hip to sole plus 2.5 units of hidden overlap above the hip. Pants about 14 units wide (original 13). The back leg is the same image, tinted darker. |
| `refined/sheriff_arm_revolver.png` | 1840 × 854 | **Fitted**: sleeve 15 units thick, shoulder pivot 7 units in from the sleeve end. The revolver is longer than the original, so its muzzle is at **(80.3, -7.5)** instead of (68, -5); the game uses the new value. |
| `refined/sheriff_hat.png` | 1473 × 1068 | **Fitted**: brim 78 units wide, centred at x = 2, brim bottom at y = -113. |

### Special outlaws

| Outlaw | Delivered (`refined/<type>/`) | Fitted as (`public/art/outlaw/`) |
|---|---|---|
| Gambler | torso (long coat), head, dead head, revolver arm, top hat, leg | `torso_gambler` (46 units wide, coat down to y = -15), `head_gambler` / `head_dead_gambler` (skull 40 units), `arm_revolver_gambler` (muzzle (77.8, -8)), `hat_gambler` (brim 56 units), `leg_gambler` (47 units incl. hip overlap). He always carries a revolver. |
| Rifleman | reference, torso (duster), head and dead head (with bandana), rifle arm, flat hat, leg | `torso_rifleman` (46 units wide, coat down to y = -22), `head_rifleman` / `head_dead_rifleman` (45 units tall: skull 40 plus the bandana knot), `arm_rifle_rifleman` (muzzle (117.5, -6.2), the longest gun), `hat_rifleman` (brim 78 units), `leg_rifleman`. |
| Dynamite Dan | reference, torso (vest, belt and pouch), head, dead head, dynamite arm, bowler, leg | `torso_dynamite_dan` (46 units wide, belt at the hips, pouch down to y = -31.5), `head_dynamite_dan` / `head_dead_dynamite_dan` (skull 40 units), `arm_dynamite_dynamite_dan` (fuse tip (43.4, -30.1), where a thrown stick starts), `hat_dynamite_dan` (brim 52 units; the crown showing below the brim sits over the forehead), `leg_dynamite_dan`. |
| Hider | reference, torso (jacket, belt and pouch), head and dead head (with bandana), revolver arm, flat hat, leg | `torso_hider` (46 units wide, pouch down to y = -25), `head_hider` / `head_dead_hider` (45 units tall: skull 40 plus the bandana knot), `arm_revolver_hider` (muzzle (82.3, -7.8)), `hat_hider` (brim 78 units), `leg_hider`. He always carries a revolver; his gun arm is hidden while he crouches behind the barrel. |
| The Undertaker | reference, torso (long coat with the steel plate), head, dead head, revolver arm, top hat, leg | `torso_undertaker` (46 units wide, coat down to y = -20), `head_undertaker` / `head_dead_undertaker` (skull 40 units), `arm_revolver_undertaker` (muzzle (83.6, -6.6)), `hat_undertaker` (brim 56 units), `leg_undertaker`. The plate is part of his torso image, so the separate armor overlay is off for him (`armor: 'none'` in his parts); his body shots still take 25% damage. |
| Drifters | vest torso (red shirt), plain torso (blue shirt), cowboy hat, revolver arm, shotgun arm | `torso_vest` / `torso_plain` (49 units from the top at y = -93 down to the belt at the hips), `hat_cowboy` (brim 66 units), `arm_revolver_red` / `_blue` (muzzle (86.5, -7.6)), `arm_shotgun_red` / `_blue` (muzzle (100.2, -6.8)). Each arm is saved with a red and a blue sleeve (recoloured, keeping the shading) to match the shirt. Heads: `head` / `head_dead` (skull 40 units) and `head_bandana` / `head_dead_bandana` (45 with the knot); `leg`. Fit tool: `tools/fit_drifter_parts.py`. |
| Gunslinger boss | references (rifle, twins), torso (teal shirt, belt and pouch), rifle arm, hat | `torso_gunslinger` (46 units wide), `arm_rifle_gunslinger` (muzzle (100.3, -4.8)), `hat_gunslinger` (brim 72 units). His revolver and off-hand arms are the drifter revolver arm with a teal sleeve (`arm_revolver_gunslinger`, and a darker `offhand_gunslinger`). Until his own head, dead head and leg arrive he borrows Dynamite Dan's heads and the Gambler's leg. He now always has this look instead of a random outfit. |

Fit new outlaw parts with `python3 -I tools/fit_outlaw_parts.py docs/character-parts/refined/<type> <type> public/art/outlaw`, copy the manifest to `src/art/outlaw.json` and map the parts in `lookFor()` (`src/config.js`).

All sheriff parts are now refined. Fit tools: `tools/fit_sheriff_art.py` (head, torso, leg, revolver arm, hat) and `tools/fit_sheriff_extras.py` (dead head, other arms, armor plate).

### Preview parts cut from the character sheet

`refined/character_set_sheet.webp` is the full refined set on one sheet (1774 × 887, no transparency). As a **rough preview**, its parts were cut out (cream background removed), fitted with the same rules and put in the game:

- **Sheriff extras**: replaced by the refined versions above.
- **Outlaws**: all replaced by refined art. The unused sheet cut-outs (off-hand arm, flat, top and bowler hats) are still in `public/art/outlaw/`.

These cut-outs are low-resolution (each part was only 100–250 px on the sheet), so they're placeholders until the individual high-resolution transparent PNGs arrive.

**Fitting tools:** `tools/fit_sheriff_art.py` measures, scales and anchors the delivered images; `tools/compose_art_check.py` builds the alignment check sheet; `tools/cut_character_sheet.py` and `tools/fit_sheet_parts.py` cut and fit parts from a character sheet (all need Pillow).
