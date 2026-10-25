# Still to redraw

Everything in the game that doesn't use refined high-resolution art yet, as transparent PNGs to redraw. Send each redrawn part as its own transparent PNG, in the same pose and layout, like the special outlaws.

## Sheriff

The head, torso, leg, revolver arm and hat are done. These came from the character sheet, so they are low resolution (100–300 px), except for the dead head.

| File | Notes |
|---|---|
| `sheriff_head_dead_quick_edit.png` | Dead head (X eyes), a quick edit of your refined head on the same 1327 × 1185 canvas. Until it's redrawn, the game paints X's over the living head. |
| `sheriff_arm_shotgun.png` | Shotgun arm. |
| `sheriff_arm_rifle.png` | The current rifle (reads as a pistol). `sheriff_arm_rifle_layout_to_aim_for.png` shows the length and layout to aim for: the longest gun, with a stock and a lever under the action, optionally a scope. |
| `sheriff_arm_dynamite.png` | Dynamite arm, the stick held upright (like Dynamite Dan's). |
| `sheriff_offhand_arm_revolver.png` | The second arm for twin revolvers; same pose as the revolver arm (the game draws it darker, behind the body). |
| `sheriff_armor_plate.png` | Bulletproof vest perk: a plate drawn over the poncho. |
| `_style_base_sheriff_arm_revolver.png` | The refined revolver arm, for the arm pose and style. |

## Drifters (the ordinary outlaws)

Also from the character sheet, low resolution. Drifters mix and match: a vest or plain torso, a head with or without a bandana, the cowboy hat, and usually a revolver (sometimes a shotgun).

| File | Notes |
|---|---|
| `drifter_torso_vest.png`, `drifter_torso_plain.png` | The two torsos. |
| `drifter_head.png`, `drifter_head_dead.png` | Plain head and its dead version. |
| `drifter_head_bandana.png` | Bandana head. It has no dead version yet, so a **bandana dead head** is also needed. |
| `drifter_hat_cowboy.png` | Cowboy hat. |
| `drifter_arm_revolver.png` | Revolver arm. |
| `drifter_arm_shotgun.png` | Shotgun arm, currently **code-drawn** (no image yet). |
| `drifter_leg.png` | Leg. |

## Gunslinger boss (code-drawn)

The checkpoint boss who isn't the Undertaker. He carries a rifle or twin revolvers. His outfit is currently random (shirt, bandana and hat colours), and this is one example. A refined version could give him a fixed look of his own.

| File | Notes |
|---|---|
| `gunslinger_assembled_rifle.png`, `gunslinger_assembled_twins.png` | Assembled, with each weapon. |
| `gunslinger_torso.png`, `gunslinger_head.png`, `gunslinger_head_dead.png`, `gunslinger_hat.png`, `gunslinger_leg.png` | Body parts. |
| `gunslinger_arm_rifle.png`, `gunslinger_arm_revolver.png` | Weapon arms. Twin revolvers use the revolver arm in both hands, so one revolver arm is enough. |

Code-drawn exports are at 4× game size. Pivots, muzzles and sizes follow [the parent README](../README.md).
