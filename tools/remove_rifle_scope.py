# Remove the telescopic sight from a refined rifle-arm image (scopes don't fit the period).
#
#   python3 -I tools/remove_rifle_scope.py SRC OUT CUT_Y X_MAX
#
# Everything above CUT_Y (the top of the receiver's outline) left of X_MAX is cleared; where light
# mount pixels end up on top, they are inked so the new top edge keeps its outline.
import sys
from PIL import Image

src, out, cut, xmax = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGBA')
px = im.load()

def dark(p):
    return p[3] > 100 and p[0] < 70 and p[1] < 55 and p[2] < 50

# outline thickness: the shortest dark run starting at the cut line among columns that had nothing above
runs = []
for x in range(0, xmax):
    if px[x, cut][3] > 100 and px[x, cut - 3][3] < 50 and dark(px[x, cut + 1]):
        y = cut
        while y < im.height and dark(px[x, y]):
            y += 1
        runs.append(y - cut)
T = min(22, max(10, sorted(runs)[len(runs) // 2])) if runs else 16

for x in range(0, xmax):
    for y in range(0, cut):
        px[x, y] = (0, 0, 0, 0)
    # the new top edge needs an outline: where light mount pixels are now on top, paint them dark
    top = next((yy for yy in range(cut, im.height) if px[x, yy][3] > 100), None)
    if top is not None and not dark(px[x, top]):
        for yy in range(top, min(im.height, top + T)):
            if px[x, yy][3] > 100:
                px[x, yy] = (29, 17, 10, 255)
im.save(out)
print(src, 'outline', T)
