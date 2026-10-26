"""The painted panel in the stoa: the Sun at the centre with the Earth circling it (Aristarchus)."""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H = 2048, 1400
rng = np.random.default_rng(4)
base = np.full((H, W, 3), (178, 146, 98), np.float32)
base += rng.normal(0, 6, (H, W, 1))
im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
d = ImageDraw.Draw(im)
cx, cy = W // 2, H // 2 + 40
d.rectangle([30, 30, W - 30, H - 30], outline=(92, 40, 24), width=14)
d.rectangle([60, 60, W - 60, H - 60], outline=(40, 30, 22), width=4)
for i, r in enumerate((150, 250, 360, 470, 560)):
    d.ellipse([cx - r * 1.55, cy - r, cx + r * 1.55, cy + r], outline=(46, 34, 26), width=5)
for k in range(24):
    a = 2 * math.pi * k / 24
    d.line([(cx + 70 * math.cos(a), cy + 70 * math.sin(a)), (cx + 125 * math.cos(a), cy + 125 * math.sin(a))], fill=(196, 120, 30), width=10)
d.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], fill=(222, 160, 40), outline=(120, 60, 20), width=6)
ex, ey = cx + 360 * 1.55 * math.cos(2.2), cy + 360 * math.sin(2.2)
d.ellipse([ex - 34, ey - 34, ex + 34, ey + 34], fill=(60, 96, 110), outline=(30, 30, 30), width=4)
d.ellipse([ex - 70, ey - 70, ex + 70, ey + 70], outline=(46, 34, 26), width=3)
mx, my = ex + 70 * math.cos(-0.6), ey + 70 * math.sin(-0.6)
d.ellipse([mx - 12, my - 12, mx + 12, my + 12], fill=(210, 205, 190), outline=(30, 30, 30), width=2)
for r, a, col, s in ((150, 0.6, (150, 140, 120), 12), (250, 4.0, (210, 190, 140), 18), (470, 5.2, (170, 70, 40), 16), (560, 1.1, (200, 170, 110), 24)):
    px, py = cx + r * 1.55 * math.cos(a), cy + r * math.sin(a)
    d.ellipse([px - s, py - s, px + s, py + s], fill=col, outline=(30, 30, 30), width=3)
try:
    f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Times New Roman.ttf', 64)
except Exception:
    f = ImageFont.load_default()
d.text((cx - 95, cy + 95), 'ΗΛΙΟΣ', fill=(70, 30, 18), font=f)
d.text((ex - 30, ey + 75), 'ΓΗ', fill=(70, 30, 18), font=f)
for k in range(120):    # cracks and losses in the paint
    x, y = rng.integers(40, W - 40), rng.integers(40, H - 40)
    d.line([(x, y), (x + rng.integers(-60, 60), y + rng.integers(-60, 60))], fill=(150, 124, 86), width=int(rng.integers(1, 4)))
im.save(os.path.join(os.path.dirname(__file__), '..', 'assets', 'painted', 'heliocentric.png'))
print('ok')
