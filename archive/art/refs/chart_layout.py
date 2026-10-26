"""Lay the two island views (art/refs/chart_views.py) on one square canvas for the chart.

    python3 art/refs/chart_layout.py [out.png]

Both views are rendered at the same metres per pixel and scaled by the same factor, so the
islands keep their true relative size. Arche sits top-left, in the gap of Paxos's Y (Paxos
is turned 30 degrees anticlockwise, `chart_views.py ... 30`), and Paxos bottom-right along the
diagonal, each with north up. The pair is then centred on the canvas as one group, which
leaves the top-right corner clear for the compass and sun and the bottom-left for the waves.
The islands' spacing is not canon (the explorer has a slider for it).
"""
import sys
from PIL import Image

SIZE = 2048
SEA = (168, 196, 214)
# (view, offset of its island's centre from the canvas centre, in canvas pixels)
PLACE = [("view-arche.png", (-303, -340)), ("view-paxos.png", (303, 340))]
FACTOR = 0.95          # canvas pixels per view pixel, the same for both islands

out = sys.argv[1] if len(sys.argv) > 1 else "art/refs/chart-layout.png"
parts = []
for path, (dx, dy) in PLACE:
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getbbox())
    im = im.resize((round(im.width * FACTOR), round(im.height * FACTOR)), Image.LANCZOS)
    parts.append((im, SIZE / 2 + dx - im.width / 2, SIZE / 2 + dy - im.height / 2))
# centre the pair's joint bounding box on the canvas
x0 = min(x for _, x, _ in parts); x1 = max(x + im.width for im, x, _ in parts)
y0 = min(y for _, _, y in parts); y1 = max(y + im.height for im, _, y in parts)
sx, sy = SIZE / 2 - (x0 + x1) / 2, SIZE / 2 - (y0 + y1) / 2
canvas = Image.new("RGB", (SIZE, SIZE), SEA)
for im, x, y in parts:
    canvas.paste(im, (round(x + sx), round(y + sy)), im)
canvas.save(out)
print("CHART LAYOUT ->", out, "shift", round(sx), round(sy))
