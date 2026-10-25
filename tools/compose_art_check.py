# Assemble fitted parts using the game's attachment points to check alignment, next to a
# reference image. Draws the head hit circle (red), body hit box (blue) and muzzle (red cross).
#
#   python3 tools/compose_art_check.py public/art/sheriff check.png docs/character-parts/refined/sheriff_reference.webp
import json, math, sys
from PIL import Image, ImageEnhance, ImageDraw

D, OUT, REF = sys.argv[1], sys.argv[2], sys.argv[3]
M = json.load(open(f"{D}/manifest.json"))
P = M['ppu']

def part(key):
    info = M[key]
    return Image.open(f"{D}/{info['file']}").convert('RGBA'), info

def place(canvas, img, anchor_px, game_xy, origin):
    x = origin[0] + game_xy[0] * P - anchor_px[0]
    y = origin[1] + game_xy[1] * P - anchor_px[1]
    canvas.alpha_composite(img, (round(x), round(y)))

def rotated(img, anchor_px, rad):
    # put the pivot at the centre of a big canvas, rotate (screen y is down => clockwise)
    R = int(math.hypot(img.width, img.height)) + 4
    big = Image.new('RGBA', (2 * R, 2 * R))
    big.alpha_composite(img, (round(R - anchor_px[0]), round(R - anchor_px[1])))
    return big.rotate(-math.degrees(rad), resample=Image.BICUBIC, center=(R, R)), (R, R)

def assemble(arm_rad):
    W, H = 900, 1150
    c = Image.new('RGBA', (W, H), (239, 230, 210, 255))
    O = (330, 1060)  # feet
    d = ImageDraw.Draw(c)
    d.ellipse([O[0] - 39 * P / 1, O[1] - 7 * P, O[0] + 39 * P, O[1] + 7 * P], fill=(0, 0, 0, 60))
    leg, li = part('leg')
    back = ImageEnhance.Brightness(leg).enhance(0.8)
    place(c, back, li['anchor_px'], [6, -44], O)
    place(c, leg, li['anchor_px'], [-6, -44], O)
    t, ti = part('torso'); place(c, t, ti['anchor_px'], ti['anchor_game'], O)
    h, hi = part('head'); place(c, h, hi['anchor_px'], hi['anchor_game'], O)
    a, ai = part('arm_revolver')
    ar, ap = rotated(a, ai['anchor_px'], arm_rad)
    place(c, ar, ap, [4, -80], O)
    hat, hti = part('hat'); place(c, hat, hti['anchor_px'], hti['anchor_game'], O)
    # head hit circle (2,-104) r19 and body box for reference
    cx, cy = O[0] + 2 * P, O[1] - 104 * P
    d.ellipse([cx - 19 * P, cy - 19 * P, cx + 19 * P, cy + 19 * P], outline=(220, 30, 30, 255), width=3)
    d.rectangle([O[0] - 20 * P, O[1] - 92 * P, O[0] + 20 * P, O[1]], outline=(30, 90, 220, 255), width=2)
    # muzzle
    mx, my = ai['muzzle']
    sx, sy = O[0] + 4 * P, O[1] - 80 * P
    px = sx + (mx * math.cos(arm_rad) - my * math.sin(arm_rad)) * P
    py = sy + (mx * math.sin(arm_rad) + my * math.cos(arm_rad)) * P
    d.line([px - 10, py, px + 10, py], fill=(220, 30, 30, 255), width=3); d.line([px, py - 10, px, py + 10], fill=(220, 30, 30, 255), width=3)
    return c

holster = assemble(1.35)
aiming = assemble(-0.15)
ref = Image.open(REF).convert('RGBA')
ref = ref.resize((round(ref.width * 1050 / ref.height), 1050))
sheet = Image.new('RGBA', (900 * 2 + ref.width + 40, 1150), (239, 230, 210, 255))
sheet.alpha_composite(holster, (0, 0)); sheet.alpha_composite(aiming, (900, 0)); sheet.alpha_composite(ref, (1820, 50))
d = ImageDraw.Draw(sheet)
for x, label in [(20, 'FITTED PARTS - holstered (1.35 rad)'), (920, 'FITTED PARTS - aiming'), (1840, 'REFERENCE (generated whole)')]:
    d.text((x, 12), label, fill=(42, 20, 8, 255))
sheet.convert('RGB').save(OUT)
print('saved', OUT, sheet.size)
