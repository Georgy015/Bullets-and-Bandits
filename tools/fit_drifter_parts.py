# Fit the refined drifter parts (the plain outlaws) and add them to the outlaw art set.
#
#   python3 -I tools/fit_drifter_parts.py docs/character-parts/refined/drifter public/art/outlaw
#   cp public/art/outlaw/manifest.json src/art/outlaw.json
#
# Heads by skull height, the leg by height (hip to sole). Torsos are scaled by height (top at y = -93, belt bottom at the hips, 49 units), the cowboy hat by brim
# width (66 units), arms by sleeve thickness (15 units, shoulder 7 units in). Drifters wear a red shirt
# (vest torso) or a blue one (plain torso), so each weapon arm is saved with a red and a blue sleeve:
# the sleeve (everything left of the hand) is recoloured, keeping its shading. Requires Pillow.
import colorsys, glob, json, sys
from PIL import Image

SRC, OUT = (sys.argv[1], sys.argv[2]) if __name__ == '__main__' else (None, None)
PPU = 3
SLEEVES = {'red': (177, 43, 38), 'blue': (39, 63, 96)}  # sampled from the two torsos

def load_im(name):
    return Image.open(glob.glob(f"{SRC}/drifter_{name}.*")[0]).convert('RGBA')

def alpha(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    return a, a.getbbox()

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

def is_skin(c):
    r, g, b = c[:3]
    return c[3] > 200 and r > 200 and g > 140 and b > 90 and r - b > 60

def recolour_sleeve(im, target):
    """Give the sleeve (left of the hand) the target colour, keeping light and shade; outlines stay."""
    im = im.copy()
    px = im.load()
    w, h = im.size
    hand_x = min(x for x in range(w) for y in range(0, h, 4) if is_skin(px[x, y]))
    # the sleeve's own colour: the most common non-outline colour in its middle
    a, bb = alpha(im)
    cy = (bb[1] + bb[3]) // 2
    samples = sorted(px[x, cy][:3] for x in range(bb[0] + 40, hand_x - 40, 7) if px[x, cy][3] > 200)
    base = samples[len(samples) // 2]
    bh, bl, bs = colorsys.rgb_to_hls(*[v / 255 for v in base])
    th, tl, ts = colorsys.rgb_to_hls(*[v / 255 for v in target])
    for y in range(h):
        for x in range(hand_x):
            r, g, b, al = px[x, y]
            if al == 0:
                continue
            hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            # sleeve pixels share the base colour's hue; the dark brown outline doesn't
            if abs(((hh - bh + 0.5) % 1) - 0.5) > 0.08 or ss < bs * 0.4:
                continue
            nl = max(0, min(1, tl * ll / bl))
            nr, ng, nb = colorsys.hls_to_rgb(th, nl, ts)
            px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), al)
    return im

def arm(key, im):
    a, bb = alpha(im)
    W = bb[2] - bb[0]
    y1, y2 = span_col(a, bb[0] + int(W * 0.12))
    ppu = (y2 - y1) / 15.0
    pivot = (bb[0] + 7.0 * ppu, (y1 + y2) / 2)
    bx = bb[2] - 6
    b1, b2 = span_col(a, bx)
    muzzle = [round((bx - pivot[0]) / ppu, 1), round(((b1 + b2) / 2 - pivot[1]) / ppu, 1)]
    return emit(key, im, bb, ppu, pivot, [0, 0], {"muzzle": muzzle})

def main():
    manifest = json.load(open(f"{OUT}/manifest.json"))

    for key in ('torso_vest', 'torso_plain'):
        im = load_im(key)
        a, bb = alpha(im)
        ppu = (bb[3] - bb[1]) / 49.0
        manifest[key] = emit(key, im, bb, ppu, ((bb[0] + bb[2]) / 2, bb[1]), [0, -93])

    # Heads: skull top at y = -124, skull's left edge at x = -18; 40 units tall, 45 with the bandana knot.
    for key, height in (('head', 40), ('head_dead', 40), ('head_bandana', 45), ('head_dead_bandana', 45)):
        im = load_im(key)
        a, bb = alpha(im)
        manifest[key] = emit(key, im, bb, (bb[3] - bb[1]) / height, (bb[0], bb[1]), [-18, -124])

    # Leg: hip pivot; 44.5 units from pivot to sole, ~2.5 units of hidden overlap above the hip
    im = load_im('leg')
    a, bb = alpha(im)
    H = bb[3] - bb[1]
    ppu = H / 47.0
    x1, x2 = span_row(a, bb[1] + int(H * 0.15))
    manifest['leg'] = emit('leg', im, bb, ppu, ((x1 + x2) / 2, bb[3] - 44.5 * ppu), [0, 0])

    im = load_im('hat_cowboy')
    a, bb = alpha(im)
    manifest['hat_cowboy'] = emit('hat_cowboy', im, bb, (bb[2] - bb[0]) / 66.0, ((bb[0] + bb[2]) / 2, bb[3]), [2, -113.5])

    for weapon in ('revolver', 'shotgun'):
        im = load_im('arm_' + weapon)
        for colour, rgb in SLEEVES.items():
            key = f'arm_{weapon}_{colour}'
            manifest[key] = arm(key, recolour_sleeve(im, rgb))
    manifest['arm_revolver'] = dict(manifest['arm_revolver_red'])  # default for looks that don't pick a colour

    json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=1)
    for k in ('head', 'head_dead', 'head_bandana', 'head_dead_bandana', 'leg', 'torso_vest', 'torso_plain', 'hat_cowboy', 'arm_revolver_red', 'arm_revolver_blue', 'arm_shotgun_red', 'arm_shotgun_blue'):
        v = manifest[k]
        print(f"{k:18s} size={v['size']} src_ppu={v['src_ppu']} {v.get('muzzle', '')}")

if __name__ == '__main__':
    main()
