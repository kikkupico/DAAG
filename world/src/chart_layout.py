"""Lay the two island views (src/chart_views.py) on one square canvas for the home page chart.

    python3 world/src/chart_layout.py <view-arche.png> <view-paxos.png> <out.png>

Both views are at one scale (metres per pixel), shrunk by the same factor, so the islands keep their
true relative size. The flat sea of each view is cut out and the islands are placed on one sea: Arche
top-left, Paxos along the diagonal to the bottom-right, the top-right corner clear for the compass
and the bottom-left for the waves. Island spacing is not canon.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

SIZE = 2048
SEA = (168, 196, 214)
FACTOR = 0.75
# top-left corner of each island's cropped view on the canvas
PLACE = {"arche": (90, 140), "paxos": (850, 720)}


def island(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    sea = (np.abs(a - np.array(SEA)).sum(axis=2) < 6)
    mask = Image.fromarray(((~sea) * 255).astype("uint8")).filter(ImageFilter.MedianFilter(5))
    mask = mask.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))   # drops specks outside the island
    rgba = im.convert("RGBA")
    rgba.putalpha(mask)
    rgba = rgba.crop(rgba.getbbox())
    return rgba.resize((round(rgba.width * FACTOR), round(rgba.height * FACTOR)), Image.LANCZOS)


arche, paxos, out = sys.argv[1:4]
canvas = Image.new("RGB", (SIZE, SIZE), SEA)
for name, path in (("arche", arche), ("paxos", paxos)):
    im = island(path)
    x, y = PLACE[name]
    canvas.paste(im, (x, y), im)
    print(name, "at", (x, y), "size", im.size)
canvas.save(out)
print("CHART LAYOUT ->", out)
