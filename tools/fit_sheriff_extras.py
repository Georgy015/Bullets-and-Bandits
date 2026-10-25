# Fit the refined sheriff's extra parts (dead head, weapon arms, armor plate) and add them to his art set.
#
#   python3 -I tools/fit_sheriff_extras.py docs/character-parts/refined public/art/sheriff
#   cp public/art/sheriff/manifest.json src/art/sheriff.json
#
# Same rules as tools/fit_sheriff_art.py: arms by sleeve thickness (15 units, shoulder 7 units in),
# the armor plate by width (44 units, centred on the chest). The dead head shares the living head's
# canvas, so it reuses the living head's scale and anchor to line up exactly. Requires Pillow.
import glob, json, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
PPU = 3

def load(name):
    im = Image.open(glob.glob(f"{SRC}/sheriff_{name}.*")[0]).convert('RGBA')
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

def arm(key, name, dynamite=False):
    im, a, bb = load(name)
    W = bb[2] - bb[0]
    y1, y2 = span_col(a, bb[0] + int(W * 0.12))
    ppu = (y2 - y1) / 15.0
    pivot = (bb[0] + 7.0 * ppu, (y1 + y2) / 2)
    if dynamite:  # the lit end of the fuse, at the top
        tx1, tx2 = span_row(a, bb[1] + 2)
        muzzle = [round(((tx1 + tx2) / 2 - pivot[0]) / ppu, 1), round((bb[1] + 3 - pivot[1]) / ppu, 1)]
    else:  # the end of the barrel
        bx = bb[2] - 6
        b1, b2 = span_col(a, bx)
        muzzle = [round((bx - pivot[0]) / ppu, 1), round(((b1 + b2) / 2 - pivot[1]) / ppu, 1)]
    return emit(key, im, bb, ppu, pivot, [0, 0], {"note": "pivot = shoulder", "muzzle": muzzle})

manifest = json.load(open(f"{OUT}/manifest.json"))

# Dead head: same canvas as the living head, so the same scale and anchor (left hair edge, skull centre)
im, a, bb = load('head')
ppu = (bb[3] - bb[1]) / 40.0
anchor = (bb[0], (bb[1] + bb[3]) / 2)
im, a, bb = load('head_dead')
manifest['head_dead'] = emit('head_dead', im, bb, ppu, anchor, [-18.5, -104], {"note": "same placement as the living head"})

manifest['arm_shotgun'] = arm('arm_shotgun', 'arm_shotgun')
manifest['arm_rifle'] = arm('arm_rifle', 'arm_rifle')
manifest['arm_dynamite'] = arm('arm_dynamite', 'arm_dynamite', dynamite=True)
manifest['offhand'] = arm('offhand', 'offhand_arm_revolver')

# Armor plate: 44 units wide, centred on the chest at (0, -68)
im, a, bb = load('armor_plate')
ppu = (bb[2] - bb[0]) / 44.0
manifest['armor'] = emit('armor', im, bb, ppu, ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), [0, -68])

json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=1)
for k in ('head_dead', 'arm_shotgun', 'arm_rifle', 'arm_dynamite', 'offhand', 'armor'):
    v = manifest[k]
    print(f"{k:14s} size={v['size']} src_ppu={v['src_ppu']} {v.get('muzzle', '')}")
