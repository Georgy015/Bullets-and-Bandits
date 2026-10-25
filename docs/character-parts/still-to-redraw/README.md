# Still to redraw

Everything in the game that doesn't use refined high-resolution art yet, as transparent PNGs to redraw. Send each redrawn part as its own transparent PNG, in the same pose and layout, like the special outlaws.

## Sheriff

**Done**: all sheriff parts are refined and in the game. The sheriff files here are kept for reference.

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
