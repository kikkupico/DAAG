"""Draw leaf-spray textures (RGBA) for the procedural trees: olive, oak, cypress, pine, lentisk, thyme."""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'leaves')
os.makedirs(OUT, exist_ok=True)
S = 2048
rng = np.random.default_rng(3)


def jitter(c, a=0.06):
    return tuple(int(255 * np.clip(v + rng.normal(0, a), 0, 1)) for v in c)


def leaf_poly(cx, cy, ang, length, width, shape='lance', lobes=0):
    pts = []
    n = 24
    for k in range(n + 1):
        t = k / n
        if shape == 'lance':
            w = width * math.sin(math.pi * t) ** 0.8 * (1 - 0.25 * t)
        elif shape == 'oval':
            w = width * math.sin(math.pi * t) ** 0.6
        else:
            w = width * math.sin(math.pi * t) ** 0.7
        if lobes:
            w *= 0.75 + 0.25 * abs(math.sin(t * math.pi * lobes))
        pts.append((t * length, w))
    poly = pts + [(x, -y) for x, y in reversed(pts)]
    c, s = math.cos(ang), math.sin(ang)
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in poly]


def stem(draw, p0, p1, w, col, bend=0.0):
    pts = []
    for k in range(11):
        t = k / 10
        x = p0[0] + (p1[0] - p0[0]) * t; y = p0[1] + (p1[1] - p0[1]) * t
        nx, ny = -(p1[1] - p0[1]), (p1[0] - p0[0])
        L = math.hypot(nx, ny) + 1e-9
        off = bend * math.sin(math.pi * t)
        pts.append((x + nx / L * off, y + ny / L * off))
    for a, b in zip(pts[:-1], pts[1:]):
        draw.line([a, b], fill=col, width=max(1, int(w)))
    return pts


def spray(name, leaf_fn, n_twigs, stem_col, bg_shrink=0.92):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    leaf_fn(d)
    im = im.resize((1024, 1024), Image.LANCZOS)
    # bleed colour into transparent pixels so mipmaps don't fringe dark
    arr = np.array(im).astype(np.float32)
    a = arr[..., 3:4] / 255
    col = arr[..., :3]
    blurred = np.array(Image.fromarray(np.uint8(col)).filter(ImageFilter.GaussianBlur(12))).astype(np.float32)
    ab = np.array(Image.fromarray(np.uint8(a[..., 0] * 255)).filter(ImageFilter.GaussianBlur(12))).astype(np.float32)[..., None] / 255
    fill = np.where(ab > 0.01, blurred / np.maximum(ab, 1e-3), col.mean((0, 1)))
    out = np.where(a > 0, col, np.clip(fill, 0, 255))
    Image.fromarray(np.uint8(np.concatenate([out, arr[..., 3:4]], -1))).save(os.path.join(OUT, name + '.png'))
    print('leaf', name)


def olive(d):
    top = (0.30, 0.37, 0.25); under = (0.62, 0.66, 0.56)
    for tw in range(8):
        a0 = rng.uniform(-0.7, 0.7) - math.pi / 2
        p0 = (S / 2 + rng.normal(0, 60), S * 0.98)
        L = S * rng.uniform(0.75, 0.95)
        p1 = (p0[0] + math.cos(a0) * L, p0[1] + math.sin(a0) * L)
        pts = stem(d, p0, p1, 9, (88, 74, 58, 255), rng.normal(0, 60))
        for k in range(4, len(pts) - 1):
            x, y = pts[k]
            ang = math.atan2(pts[k + 1][1] - y, pts[k + 1][0] - x)
            for side in (-1, 1):
                la = ang + side * rng.uniform(0.5, 0.9)
                c = under if rng.random() < 0.3 else top
                d.polygon(leaf_poly(x, y, la, rng.uniform(200, 290), rng.uniform(20, 28), 'lance'), fill=jitter(c, 0.04) + (255,))
        x, y = pts[-1]
        d.polygon(leaf_poly(x, y, ang, 220, 22, 'lance'), fill=jitter(top, 0.04) + (255,))


def oak(d):
    base = (0.22, 0.32, 0.13)
    for tw in range(4):
        a0 = rng.uniform(-0.6, 0.6) - math.pi / 2
        p0 = (S / 2 + rng.normal(0, 80), S * 0.98)
        L = S * rng.uniform(0.7, 0.9)
        p1 = (p0[0] + math.cos(a0) * L, p0[1] + math.sin(a0) * L)
        pts = stem(d, p0, p1, 11, (80, 66, 50, 255), rng.normal(0, 70))
        for k in range(3, len(pts) - 1, 1):
            x, y = pts[k]
            ang = math.atan2(pts[k + 1][1] - y, pts[k + 1][0] - x)
            side = 1 if k % 2 else -1
            la = ang + side * rng.uniform(0.4, 1.0)
            c = jitter(base, 0.05)
            poly = leaf_poly(x, y, la, rng.uniform(300, 380), rng.uniform(70, 95), 'oval', lobes=rng.integers(5, 8))
            d.polygon(poly, fill=c + (255,))
            # midrib
            d.line([(x, y), (x + math.cos(la) * 300, y + math.sin(la) * 300)], fill=tuple(int(v * 1.25) for v in c) + (255,), width=4)


def cypress(d):
    base = (0.12, 0.20, 0.10)

    def frond(x, y, ang, L, w, depth):
        x2, y2 = x + math.cos(ang) * L, y + math.sin(ang) * L
        d.line([(x, y), (x2, y2)], fill=jitter(base, 0.03) + (255,), width=int(w))
        if depth == 0:
            for k in range(8):
                t = k / 8
                px, py = x + (x2 - x) * t, y + (y2 - y) * t
                d.ellipse([px - w * 1.3, py - w * 1.3, px + w * 1.3, py + w * 1.3], fill=jitter(base, 0.04) + (255,))
            return
        n = 7
        for k in range(1, n):
            t = k / n
            px, py = x + (x2 - x) * t, y + (y2 - y) * t
            for side in (-1, 1):
                frond(px, py, ang + side * rng.uniform(0.5, 0.8), L * 0.42 * (1 - 0.5 * t), w * 0.7, depth - 1)
    for k in range(3):
        frond(S / 2 + rng.normal(0, 100), S * 0.98, -math.pi / 2 + rng.normal(0, 0.15), S * 0.9, 16, 2)


def pine(d):
    base = (0.17, 0.25, 0.10)
    # a twig rising through the card with needle fascicles fanning up from it
    for tw in range(3):
        x0 = S / 2 + rng.normal(0, 140); y0 = S * 0.99
        a0 = -math.pi / 2 + rng.normal(0, 0.25)
        L = S * rng.uniform(0.55, 0.75)
        x1, y1 = x0 + math.cos(a0) * L, y0 + math.sin(a0) * L
        d.line([(x0, y0), (x1, y1)], fill=(80, 62, 45, 255), width=12)
        for k in range(46):
            t = rng.uniform(0.15, 1.0) ** 0.7
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            for j in range(9):
                a = a0 + rng.normal(0, 0.75)
                nl = rng.uniform(0.18, 0.32) * S
                d.line([(px, py), (px + math.cos(a) * nl, py + math.sin(a) * nl)], fill=jitter(base, 0.04) + (255,), width=4)


def lentisk(d):
    base = (0.16, 0.27, 0.11)
    for tw in range(9):
        a0 = rng.uniform(-1.1, 1.1) - math.pi / 2
        p0 = (S / 2 + rng.normal(0, 40), S * 0.98)
        L = S * rng.uniform(0.5, 0.9)
        p1 = (p0[0] + math.cos(a0) * L, p0[1] + math.sin(a0) * L)
        pts = stem(d, p0, p1, 6, (70, 58, 44, 255), rng.normal(0, 40))
        for k in range(2, len(pts) - 1):
            x, y = pts[k]
            ang = math.atan2(pts[k + 1][1] - y, pts[k + 1][0] - x)
            for side in (-1, 1):
                la = ang + side * rng.uniform(0.7, 1.2)
                d.polygon(leaf_poly(x, y, la, rng.uniform(90, 130), rng.uniform(28, 38), 'oval'),
                          fill=jitter(base, 0.05) + (255,))


def thyme(d):
    base = (0.36, 0.42, 0.30)
    for k in range(260):
        a = -math.pi / 2 + rng.normal(0, 0.55)
        x0 = S / 2 + rng.normal(0, 120); y0 = S * 0.98
        L = rng.uniform(0.3, 0.85) * S
        x1, y1 = x0 + math.cos(a) * L, y0 + math.sin(a) * L
        d.line([(x0, y0), (x1, y1)], fill=(95, 85, 70, 255), width=4)
        for j in range(10):
            t = rng.uniform(0.3, 1)
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            r = rng.uniform(8, 16)
            c = jitter(base, 0.05) if rng.random() > 0.12 else jitter((0.62, 0.48, 0.66), 0.05)
            d.ellipse([px - r, py - r, px + r, py + r], fill=c + (255,))


if __name__ == '__main__':
    for nm, fn in (('olive', olive), ('oak', oak), ('cypress', cypress), ('pine', pine), ('lentisk', lentisk), ('thyme', thyme)):
        spray(nm, fn, 0, None)
