# Make a dead (X-eyes) version of the drifter bandana head: paint the eyes over with skin and draw X's
# in the same style as the other dead heads (which have no brows). The bandana is kept.
#
#   python3 -I tools/make_bandana_dead_head.py docs/character-parts/refined/drifter/drifter_head_bandana.webp docs/character-parts/refined/drifter/drifter_head_dead_bandana.png
import sys
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
px = im.load()
# eye whites -> the eye area (whites plus their outline), kept inside the head and above the bandana
ws = [(x, y) for y in range(0, im.height, 2) for x in range(0, im.width, 2) if px[x, y][3] > 200 and min(px[x, y][:3]) > 235]
x0, x1 = min(p[0] for p in ws), max(p[0] for p in ws)
y0, y1 = min(p[1] for p in ws), max(p[1] for p in ws)
# the eyes' outlines reach about 36 px past the whites; the brows sit up to ~125 px above them
box = (x0 - 40, y0 - 30, x1 + 36, y1 + 18)
brows = (x0 - 50, y0 - 130, x1 - 60, y0)
skin = px[(x0 + x1) // 2 - 120, y0 - 160][:3]
d = ImageDraw.Draw(im)
d.rectangle(brows, fill=skin + (255,))
d.rounded_rectangle(box, radius=40, fill=skin + (255,))
# The right brow's tip overlaps the head outline: rebuild that stretch of outline, interpolating its
# outer edge between the brow-free rows just above and below
def right_edge(y):
    return max(x for x in range(im.width) if px[x, y][3] > 128)
ya, yb = y0 - 150, y0 - 10
ea, eb = right_edge(ya), right_edge(yb)
outline = px[(x0 + x1) // 2, min(y for y in range(im.height) if px[(x0 + x1) // 2, y][3] > 128) + 15]
for y in range(ya, yb):
    edge = ea + (eb - ea) * (y - ya) / (yb - ya)
    for x in range(x1 - 60, im.width):
        if x > edge:
            px[x, y] = (0, 0, 0, 0)
        elif x > edge - 46:
            px[x, y] = outline
        else:
            px[x, y] = skin + (255,)
# two X's centred on the old eyes
ink = (35, 22, 15, 255)
cy = (y0 + y1) // 2
r, w = int((y1 - y0) * 0.42), int((y1 - y0) * 0.2)
for cx in (x0 + (x1 - x0) * 0.22, x0 + (x1 - x0) * 0.75):
    d.line((cx - r, cy - r, cx + r, cy + r), fill=ink, width=w)
    d.line((cx - r, cy + r, cx + r, cy - r), fill=ink, width=w)
im.save(out)
print('eye box', box, 'skin', skin)
