# Cut parts out of the character sheet: flood-fill the cream background from each crop's border.
import sys
from collections import deque
from PIL import Image

SHEET, OUT = sys.argv[1], sys.argv[2]
im = Image.open(SHEET).convert('RGB')
BG = (253, 247, 229)

BOXES = {
    'sheriff_head': (835, 38, 1025, 180), 'outlaw_head': (1068, 38, 1222, 182),
    'outlaw_head_bandana': (1295, 38, 1450, 182), 'outlaw_head_dead': (1535, 38, 1688, 182),
    'sheriff_torso': (808, 228, 1010, 401), 'outlaw_torso_vest': (1052, 228, 1232, 394),
    'outlaw_torso_plain': (1314, 230, 1474, 390), 'armor_plate': (1555, 240, 1702, 388),
    'sheriff_leg': (822, 440, 930, 566), 'outlaw_leg': (990, 440, 1100, 566),
    'sheriff_arm_revolver': (1136, 458, 1390, 550), 'sheriff_arm_shotgun': (1440, 458, 1752, 550),
    'sheriff_arm_rifle': (782, 612, 1040, 697), 'sheriff_arm_dynamite': (1055, 584, 1195, 697),
    'outlaw_arm_revolver': (1260, 612, 1484, 697), 'offhand_arm_revolver': (1520, 612, 1752, 697),
    'hat_cowboy': (790, 738, 997, 836), 'hat_flat': (1005, 738, 1277, 836),
    'hat_top': (1320, 724, 1492, 836), 'hat_bowler': (1550, 736, 1724, 834),
}

def dist(c):
    return max(abs(c[0] - BG[0]), abs(c[1] - BG[1]), abs(c[2] - BG[2]))

def cut(name, box):
    crop = im.crop(box)
    w, h = crop.size
    px = crop.load()
    bg = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or bg[y][x] or dist(px[x, y]) > 28:
            continue
        bg[y][x] = True
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    out = Image.new('RGBA', (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if bg[y][x]:
                op[x, y] = (r, g, b, 0)
                continue
            # soften the anti-aliased fringe next to the background
            edge = any(0 <= x + dx < w and 0 <= y + dy < h and bg[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            a = 255 if not edge else min(255, int(dist((r, g, b)) * 4))
            op[x, y] = (r, g, b, a)
    # drop stray specks (e.g. label fragments): keep the biggest blob's bbox region
    bb = out.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    out = out.crop(bb)
    out.save(f'{OUT}/{name}.png')
    return out.size

for n, b in BOXES.items():
    print(n, cut(n, b))
