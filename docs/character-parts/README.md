# Character parts

The current code-drawn sheriff and outlaws, split into the separate parts the game animates. Every PNG is transparent and exported at **4× game size**. `_overview.png` shows them all on one sheet, and `_pivots.json` lists each file's size and pivot in pixels.

They can serve as a reference for an artist: replacement art that keeps the same part split, proportions and pivot points can be dropped into the game without changing any gameplay.

## How a character is put together

All coordinates are in game units (divide the PNG pixels by 4). The character faces **right**; outlaws are the same art mirrored. The origin `(0, 0)` is **between the feet, on the ground**. Up is negative y.

| Part | Files | Attaches at | Moves how |
|---|---|---|---|
| Legs (×2) | `*_leg_front.png` (the back leg is the same art, slightly darker) | Hips at `(-6, -44)` front, `(6, -44)` back. Pivot = top of the leg | Swing ±0.34 rad while walking; splay when dead |
| Torso | `*_torso*.png` | Character origin (feet) | Fixed; bobs ~3 units while walking |
| Head | `*_head*.png` | Character origin; head circle centred at `(2, -104)`, radius 19 | Fixed to torso |
| Eyes | part of the head files; `outlaw_head_dead.png` shows the X-eyes variant | On the head | Swap to X eyes on death |
| Hat | `hat_*.png` (cowboy, flat-brim, top hat, bowler) | Character origin, sits on the head | Flies off on a headshot |
| Gun arm | `*_arm_<gun>.png` (revolver, shotgun, rifle, dynamite) | Shoulder at `(4, -80)`. Pivot = shoulder end of the sleeve | Rotates to aim: about -1.5 (up) to +1.0 (down) rad; 1.35 rad when holstered; kicks up 0.3 rad on recoil |
| Off-hand arm | `offhand_arm_revolver.png` (twin revolvers only, drawn darker) | Shoulder at `(-6, -92)`, behind the torso | Rotates with the gun arm |
| Armor plate | `armor_plate.png` (vest perk, the Undertaker) | Over the torso | On/off |

Draw order, back to front: shadow, legs, off-hand arm, torso, head, eyes, armor, gun arm, hat.

## Sizes in the game

- Sheriff drawn at **1.55×** these game units (≈ 230 px tall on a 1280×720 screen); outlaws at **1.45×**, bosses at **1.6×**.
- Hit zones: head = the head circle; body = a 40 × 92 box above the feet.
- The muzzle (where bullets come out) sits at the end of each gun barrel, e.g. 68 units from the shoulder for the revolver and 96 for the rifle.

## Variants

| File | What it is |
|---|---|
| `sheriff_*` | The old sheriff: poncho, star badge, grey hair and stubble, squint, cigarillo, spurs |
| `outlaw_torso_vest` / `outlaw_torso_plain` | Base outlaw torso, with and without a vest (shirt colours are recoloured per outlaw) |
| `outlaw_head`, `outlaw_head_bandana`, `outlaw_head_dead` | Base outlaw head, with bandana, dead (X eyes) |
| `hat_*` | The four hat styles used across the outlaw types |
| `assembled_sheriff`, `assembled_outlaw` | All parts put together, for reference |

The Gambler, Rifleman, Dynamite Dan and the Undertaker are the same base with different colours, coats and hats (see `lookFor()` in `src/config.js`).
