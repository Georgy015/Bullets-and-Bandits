# Fit one special outlaw's refined parts to game geometry and add them to the outlaw art set.
#
#   python3 -I tools/fit_outlaw_parts.py docs/character-parts/refined/gambler gambler public/art/outlaw
#   cp public/art/outlaw/manifest.json src/art/outlaw.json
#
# Expects <type>_torso, <type>_head, <type>_head_dead, <type>_arm_revolver, <type>_hat and
# optionally <type>_leg (any image format, transparent). Parts are saved as <slot>_<type>.png. Same rules as the
# sheriff fit: leg by height, torso by full width, heads by skull height, arm by sleeve thickness, hat by brim width.
import glob, json, sys
from PIL import Image

SRC, TYPE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PPU = 3
# Per-type sizes in game units, matching the code-drawn versions
SIZES = {
    'gambler': {'torso_width': 46, 'hat_brim': 56},
}[TYPE]

def load(name):
    path = glob.glob(f"{SRC}/{TYPE}_{name}.*")[0]
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    return im, a, a.getbbox()

def span_row(a, y):
    xs = [x for x in range(a.size[0]) if a.getpixel((x, y))]
    return (min(xs), max(xs))

def span_col(a, x):
    ys = [y for y in range(a.size[1]) if a.getpixel((x, y))]
    return (min(ys), max(ys))

def emit(key, im, bbox, ppu, anchor_px, anchor_game, extra=None):
    m = 4
    l, t = max(0, bbox[0] - m), max(0, bbox[1] - m)
    r, b = min(im.width, bbox[2] + m), min(im.height, bbox[3] + m)
    crop = im.crop((l, t, r, b))
    k = PPU / ppu
    out = crop.resize((max(1, round(crop.width * k)), max(1, round(crop.height * k))), Image.LANCZOS)
    out.save(f"{OUT}/{key}.png")
    info = {"file": f"{key}.png", "size": [out.width, out.height],
            "anchor_px": [round((anchor_px[0] - l) * k, 1), round((anchor_px[1] - t) * k, 1)],
            "anchor_game": anchor_game, "src_ppu": round(ppu, 2)}
    if extra: info.update(extra)
    return info

manifest = json.load(open(f"{OUT}/manifest.json"))

# Leg: hip pivot; 44.5 units from pivot to sole, ~2.5 units of hidden overlap above the hip
if glob.glob(f"{SRC}/{TYPE}_leg.*"):
    im, a, bb = load('leg')
    H = bb[3] - bb[1]
    ppu = H / 47.0
    x1, x2 = span_row(a, bb[1] + int(H * 0.15))
    manifest[f'leg_{TYPE}'] = emit(f'leg_{TYPE}', im, bb, ppu, ((x1 + x2) / 2, bb[3] - 44.5 * ppu), [0, 0],
        {"pants_width_units": round((x2 - x1) / ppu, 1)})

# Torso (long coat): widest point = torso width, top-centre at y = -93
im, a, bb = load('torso')
ppu = (bb[2] - bb[0]) / SIZES['torso_width']
manifest[f'torso_{TYPE}'] = emit(f'torso_{TYPE}', im, bb, ppu, ((bb[0] + bb[2]) / 2, bb[1]), [0, -93],
    {"bottom_y_units": round(-93 + (bb[3] - bb[1]) / ppu, 1)})

# Heads: skull height 40 units centred on the hit circle (y = -104), skull's left edge at x = -18
for key in ('head', 'head_dead'):
    im, a, bb = load(key)
    ppu = (bb[3] - bb[1]) / 40.0
    manifest[f'{key}_{TYPE}'] = emit(f'{key}_{TYPE}', im, bb, ppu, (bb[0], (bb[1] + bb[3]) / 2), [-18, -104])

# Gun arm: sleeve 15 units thick, shoulder 7 units in from the sleeve end
im, a, bb = load('arm_revolver')
W = bb[2] - bb[0]
y1, y2 = span_col(a, bb[0] + int(W * 0.12))
ppu = (y2 - y1) / 15.0
pivot = (bb[0] + 7.0 * ppu, (y1 + y2) / 2)
bx = bb[2] - 6
b1, b2 = span_col(a, bx)
muzzle = [round((bx - pivot[0]) / ppu, 1), round(((b1 + b2) / 2 - pivot[1]) / ppu, 1)]
manifest[f'arm_revolver_{TYPE}'] = emit(f'arm_revolver_{TYPE}', im, bb, ppu, pivot, [0, 0], {"muzzle": muzzle})

# Hat: brim width, brim bottom-centre at (2, -113.5)
im, a, bb = load('hat')
ppu = (bb[2] - bb[0]) / SIZES['hat_brim']
manifest[f'hat_{TYPE}'] = emit(f'hat_{TYPE}', im, bb, ppu, ((bb[0] + bb[2]) / 2, bb[3]), [2, -113.5])

json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=1)
for k, v in manifest.items():
    if k.endswith('_' + TYPE): print(f"{k:22s} size={v['size']} src_ppu={v['src_ppu']} {v.get('muzzle', '')} {v.get('bottom_y_units', '')}")
