# Character parts

This folder holds two sets of character art:

- **Original code-drawn parts** (top level): the sheriff and outlaws exactly as the game draws them today, split into the parts it animates. Each PNG is transparent and exported at **4× game size** (divide pixel values by 4 to get game units). `_overview.png` shows them all on one sheet; `_pivots.json` lists each file's size and pivot in pixels.
- **Refined sheriff artwork** (`refined/`): new art in the target style. These files have **different canvas sizes** from the originals and are **not yet fitted** to the game's geometry (see [Refined artwork status](#refined-artwork-status)).

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

| File | Canvas (px) | Status |
|---|---|---|
| `refined/sheriff_reference.webp` | 1080 × 1456 | Style reference showing the **intended appearance**. It was generated as a whole image and is **not** proof that the individual parts align when assembled. |
| `refined/sheriff_head.webp` | 1327 × 1185 | Not fitted. Eyes baked in; needs placement around the head hit circle and a dead (X-eyes) variant. |
| `refined/sheriff_torso.webp` | 1335 × 1178 | Not fitted. |
| `refined/sheriff_leg.webp` | 953 × 1651 | Not fitted. Noticeably wider relative to its height than the original leg (≈ 1.7 : 1 vs ≈ 2.1 : 1), so the boot and hip overlap need checking. |
| `refined/sheriff_arm_revolver.png` | 1840 × 854 | Not fitted. Horizontal neutral pose as required; shoulder pivot and muzzle position still to be defined. |
| `refined/sheriff_hat.png` | 1473 × 1068 | Not fitted. |

All refined files have transparent backgrounds. Compared to the original 4× exports, the parts are drawn at **different scales** from each other (roughly 4.5× to 8× the original 4× size, depending on the part), so they must be normalised to one scale before fitting. No refined off-hand arm, shotgun, rifle or dynamite arm exists yet.
