# Fit parts cut from the character sheet to game geometry (same rules as the sheriff fit).
import json, sys
from PIL import Image

SRC, SHERIFF_DIR, OUTLAW_DIR = sys.argv[1], sys.argv[2], sys.argv[3]
PPU = 3

def load(name):
    im = Image.open(f"{SRC}/{name}.png").convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    return im, a, a.getbbox()

def span_row(a, y):
    xs = [x for x in range(a.size[0]) if a.getpixel((x, y))]
    return (min(xs), max(xs))

def span_col(a, x):
    ys = [y for y in range(a.size[1]) if a.getpixel((x, y))]
    return (min(ys), max(ys))

def emit(outdir, key, im, bbox, ppu, anchor_px, anchor_game, extra=None):
    m = 2
    l, t, r, b = bbox[0] - m, bbox[1] - m, bbox[2] + m, bbox[3] + m
    crop = im.crop((max(0, l), max(0, t), min(im.width, r), min(im.height, b)))
    l, t = max(0, l), max(0, t)
    k = PPU / ppu
    out = crop.resize((max(1, round(crop.width * k)), max(1, round(crop.height * k))), Image.LANCZOS)
    out.save(f"{outdir}/{key}.png")
    info = {"file": f"{key}.png", "size": [out.width, out.height],
            "anchor_px": [round((anchor_px[0] - l) * k, 1), round((anchor_px[1] - t) * k, 1)],
            "anchor_game": anchor_game, "src_ppu": round(ppu, 2), "from_sheet": True}
    if extra: info.update(extra)
    return info

def leg(outdir, key, src):
    im, a, bb = load(src)
    H = bb[3] - bb[1]; ppu = H / 47.0
    x1, x2 = span_row(a, bb[1] + int(H * 0.15))
    return emit(outdir, key, im, bb, ppu, ((x1 + x2) / 2, bb[3] - 44.5 * ppu), [0, 0])

def arm(outdir, key, src, dynamite=False):
    im, a, bb = load(src)
    W = bb[2] - bb[0]
    y1, y2 = span_col(a, bb[0] + int(W * (0.1 if not dynamite else 0.12)))
    ppu = (y2 - y1) / 15.0
    pivot = (bb[0] + 7.0 * ppu, (y1 + y2) / 2)
    if dynamite:
        tx1, tx2 = span_row(a, bb[1] + 2)  # top of the lit fuse
        muzzle = [round(((tx1 + tx2) / 2 - pivot[0]) / ppu, 1), round((bb[1] + 3 - pivot[1]) / ppu, 1)]
    else:
        bx = bb[2] - 3
        b1, b2 = span_col(a, bx)
        muzzle = [round((bx - pivot[0]) / ppu, 1), round(((b1 + b2) / 2 - pivot[1]) / ppu, 1)]
    return emit(outdir, key, im, bb, ppu, pivot, [0, 0], {"muzzle": muzzle})

def torso(outdir, key, src, width_units, row=0.04):
    im, a, bb = load(src)
    H = bb[3] - bb[1]
    x1, x2 = span_row(a, bb[1] + int(H * row))
    ppu = (x2 - x1) / width_units
    return emit(outdir, key, im, bb, ppu, ((x1 + x2) / 2, bb[1]), [0, -93])

def armor(outdir, key, src):
    im, a, bb = load(src)
    ppu = (bb[2] - bb[0]) / 44.0
    return emit(outdir, key, im, bb, ppu, ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), [0, -68])

def hat(outdir, key, src, brim_units):
    im, a, bb = load(src)
    ppu = (bb[2] - bb[0]) / brim_units
    return emit(outdir, key, im, bb, ppu, ((bb[0] + bb[2]) / 2, bb[3]), [2, -113.5])

def heads(outdir):
    out = {}
    im, a, bb = load('outlaw_head')
    ppu = (bb[3] - bb[1]) / 40.0  # plain head: skull height 40 units; all outlaw heads share this scale
    for key, src in [('head', 'outlaw_head'), ('head_bandana', 'outlaw_head_bandana'), ('head_dead', 'outlaw_head_dead')]:
        im, a, bb = load(src)
        info = emit(outdir, key, im, bb, ppu, (bb[0], bb[1]), [-18, -124])
        w, h = im.size
        if key == 'head_bandana':  # eye region, for painting X eyes on death
            to_g = lambda px, py: [round(-18 + (px - bb[0]) / ppu, 1), round(-124 + (py - bb[1]) / ppu, 1)]
            info['eye_band'] = to_g(bb[0] + 0.52 * (bb[2] - bb[0]), bb[1] + 0.22 * (bb[3] - bb[1])) + \
                               to_g(bb[0] + 0.97 * (bb[2] - bb[0]), bb[1] + 0.47 * (bb[3] - bb[1]))
            info['skin'] = '#%02x%02x%02x' % im.getpixel((bb[0] + int(0.35 * (bb[2] - bb[0])), bb[1] + int(0.3 * (bb[3] - bb[1]))))[:3]
        out[key] = info
    return out

sheriff = json.load(open(f"{SHERIFF_DIR}/manifest.json"))
sheriff['arm_shotgun'] = arm(SHERIFF_DIR, 'arm_shotgun', 'sheriff_arm_shotgun')
sheriff['arm_rifle'] = arm(SHERIFF_DIR, 'arm_rifle', 'sheriff_arm_rifle')
sheriff['arm_dynamite'] = arm(SHERIFF_DIR, 'arm_dynamite', 'sheriff_arm_dynamite', dynamite=True)
sheriff['offhand'] = arm(SHERIFF_DIR, 'offhand', 'offhand_arm_revolver')
sheriff['armor'] = armor(SHERIFF_DIR, 'armor', 'armor_plate')
json.dump(sheriff, open(f"{SHERIFF_DIR}/manifest.json", 'w'), indent=1)

outlaw = {"ppu": PPU}
outlaw['leg'] = leg(OUTLAW_DIR, 'leg', 'outlaw_leg')
outlaw['torso_vest'] = torso(OUTLAW_DIR, 'torso_vest', 'outlaw_torso_vest', 41.0, 0.08)
outlaw['torso_plain'] = torso(OUTLAW_DIR, 'torso_plain', 'outlaw_torso_plain', 41.0, 0.08)
outlaw.update(heads(OUTLAW_DIR))
outlaw['arm_revolver'] = arm(OUTLAW_DIR, 'arm_revolver', 'outlaw_arm_revolver')
outlaw['offhand'] = arm(OUTLAW_DIR, 'offhand', 'offhand_arm_revolver')
outlaw['armor'] = sheriff['armor'] | {"file": "../sheriff/armor.png"}
for k, w in [('hat_cowboy', 66), ('hat_flat', 78), ('hat_top', 56), ('hat_bowler', 52)]:
    outlaw[k] = hat(OUTLAW_DIR, k, k, w)
json.dump(outlaw, open(f"{OUTLAW_DIR}/manifest.json", 'w'), indent=1)
for k, v in list(sheriff.items())[-5:] + list(outlaw.items()):
    if isinstance(v, dict): print(f"{k:14s} size={v['size']} src_ppu={v['src_ppu']} muzzle={v.get('muzzle')}")
