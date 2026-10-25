# Fit refined sheriff parts to the game's part geometry (game units) and resample them.
#
#   python3 tools/fit_sheriff_art.py docs/character-parts/refined public/art/sheriff 3
#   cp public/art/sheriff/manifest.json src/art/sheriff.json
#
# Each part is scaled from one measured feature with a known size in game units (leg height,
# sleeve thickness, poncho shoulder width, skull height, brim width) and anchored to a known
# game point. Requires Pillow. The measurements assume the refined art's layout; new art with
# a different layout needs the per-part rules below adjusting.
import json, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
PPU = int(sys.argv[3]) if len(sys.argv) > 3 else 3  # output pixels per game unit

def load(name):
    im = Image.open(f"{SRC}/{name}").convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    return im, a, a.getbbox()

def span_row(a, y):
    w = a.size[0]
    xs = [x for x in range(w) if a.getpixel((x, y))]
    return (min(xs), max(xs)) if xs else None

def span_col(a, x):
    h = a.size[1]
    ys = [y for y in range(h) if a.getpixel((x, y))]
    return (min(ys), max(ys)) if ys else None

def emit(key, im, bbox, ppu, anchor_px, anchor_game, extra=None):
    """Crop to content, rescale to PPU, record which pixel sits on which game point."""
    m = 4
    l, t, r, b = bbox[0] - m, bbox[1] - m, bbox[2] + m, bbox[3] + m
    crop = im.crop((l, t, r, b))
    k = PPU / ppu
    out = crop.resize((max(1, round(crop.width * k)), max(1, round(crop.height * k))), Image.LANCZOS)
    out.save(f"{OUT}/{key}.png")
    ax, ay = (anchor_px[0] - l) * k, (anchor_px[1] - t) * k
    info = {"file": f"{key}.png", "size": [out.width, out.height], "anchor_px": [round(ax, 1), round(ay, 1)],
            "anchor_game": anchor_game, "src_ppu": round(ppu, 2)}
    if extra: info.update(extra)
    return info

manifest = {"ppu": PPU}

# Leg: hip pivot; 44.5 units from pivot to sole, ~2.5 units of hidden overlap above the hip
im, a, bb = load('sheriff_leg.webp')
H = bb[3] - bb[1]
ppu = H / 47.0
x1, x2 = span_row(a, bb[1] + int(H * 0.15))
pivot = ((x1 + x2) / 2, bb[3] - 44.5 * ppu)
manifest['leg'] = emit('leg', im, bb, ppu, pivot, [0, 0], {"note": "pivot = hip", "pants_width_units": round((x2 - x1) / ppu, 1)})

# Gun arm (revolver): sleeve thickness 15 units incl. outline; shoulder 7 units in from the sleeve end
im, a, bb = load('sheriff_arm_revolver.png')
W = bb[2] - bb[0]
y1, y2 = span_col(a, bb[0] + int(W * 0.12))
ppu = (y2 - y1) / 15.0
pivot = (bb[0] + 7.0 * ppu, (y1 + y2) / 2)
bx = bb[2] - 6
b1, b2 = span_col(a, bx)
muzzle = [round((bx - pivot[0]) / ppu, 1), round(((b1 + b2) / 2 - pivot[1]) / ppu, 1)]
manifest['arm_revolver'] = emit('arm_revolver', im, bb, ppu, pivot, [0, 0], {"note": "pivot = shoulder", "muzzle": muzzle,
    "length_units": round((bb[2] - pivot[0]) / ppu, 1)})

# Torso (poncho): shoulder width 46 units incl. outline, top edge at y = -93
im, a, bb = load('sheriff_torso.webp')
H = bb[3] - bb[1]
x1, x2 = span_row(a, bb[1] + int(H * 0.04))
ppu = (x2 - x1) / 46.0
anchor = ((x1 + x2) / 2, bb[1])
manifest['torso'] = emit('torso', im, bb, ppu, anchor, [0, -93], {"note": "top-centre of the poncho",
    "bottom_y_units": round(-93 + H / ppu, 1), "width_units": round((bb[2] - bb[0]) / ppu, 1)})

# Head: skull height 40 units, vertically centred on the hit circle (y = -104); hair edge at x = -18.5
im, a, bb = load('sheriff_head.webp')
H = bb[3] - bb[1]
ppu = H / 40.0
anchor = (bb[0], (bb[1] + bb[3]) / 2)
w, h = im.size
# Eye band (brows + eyes) measured on the source art, as fractions of the canvas
band = [0.465 * w, 0.27 * h, 0.83 * w, 0.47 * h]
to_game = lambda px, py: [round(-18.5 + (px - anchor[0]) / ppu, 1), round(-104 + (py - anchor[1]) / ppu, 1)]
manifest['head'] = emit('head', im, bb, ppu, anchor, [-18.5, -104], {"note": "left hair edge, skull centre height",
    "eye_band": to_game(band[0], band[1]) + to_game(band[2], band[3]), "width_units": round((bb[2] - bb[0]) / ppu, 1)})

# Hat: brim width 78 units incl. outline, centred at x = 2, brim bottom at y = -113
im, a, bb = load('sheriff_hat.png')
ppu = (bb[2] - bb[0]) / 78.0
anchor = ((bb[0] + bb[2]) / 2, bb[3])
manifest['hat'] = emit('hat', im, bb, ppu, anchor, [2, -113], {"note": "brim bottom-centre",
    "height_units": round((bb[3] - bb[1]) / ppu, 1)})

json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=1)
print(json.dumps(manifest, indent=1))
