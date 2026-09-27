"""Lay the two island views (art/refs/chart_views.py) on one square canvas for the chart.

    python3 art/refs/chart_layout.py [out.png]

Both views are rendered at the same metres per pixel and scaled by the same factor, so the
islands keep their true relative size. Arche sits top-left and Paxos bottom-right along the
diagonal, each with north up; the top-right corner is left clear for the compass rose and
the bottom-left for open sea. The islands' spacing is not canon (the explorer has a slider
for it), so the layout only has to use the square well.
"""
import sys
from PIL import Image

SIZE = 2048
SEA = (168, 196, 214)
# (view, centre of its island as a fraction of the canvas)
PLACE = [("art/refs/chart-arche.png", (0.30, 0.30)), ("art/refs/chart-paxos.png", (0.70, 0.70))]
FACTOR = 0.76          # canvas pixels per view pixel, the same for both islands

out = sys.argv[1] if len(sys.argv) > 1 else "art/refs/chart-layout.png"
canvas = Image.new("RGB", (SIZE, SIZE), SEA)
for path, (fx, fy) in PLACE:
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getbbox())
    im = im.resize((round(im.width * FACTOR), round(im.height * FACTOR)), Image.LANCZOS)
    canvas.paste(im, (round(fx * SIZE - im.width / 2), round(fy * SIZE - im.height / 2)), im)
canvas.save(out)
print("CHART LAYOUT ->", out)
