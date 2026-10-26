"""Leros turned end to end (rotated 180 degrees) and scaled: the ground Paxos is built on.
Model point p corresponds to Leros point -p / SCALE (local metres east/north of Leros's centre)."""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'assets', 'leros')
SCALE = 0.8

_meta = json.load(open(os.path.join(SRC, 'meta.json')))
_dem = np.load(os.path.join(SRC, 'dem.npy'))
# the elevation data carries a few metres of speckle on flat ground; a light blur takes it out
from noise import blur as _blur
_dem = _blur(_dem.astype(np.float32), 2)
COAST = -np.load(os.path.join(SRC, 'coast.npy')).astype(np.float64) * SCALE      # the coastline in model metres


def dem_height(X, Y):
    """Leros's elevation (bilinear) at model points; heights are kept at their real values."""
    lx, ly = -np.asarray(X) / SCALE, -np.asarray(Y) / SCALE
    xs0, xs1 = _meta['xs']; ys0, ys1 = _meta['ys']
    fj = (lx - xs0) / (xs1 - xs0) * (_meta['W'] - 1)
    fi = (ly - ys0) / (ys1 - ys0) * (_meta['H'] - 1)
    fj = np.clip(fj, 0, _meta['W'] - 1.001); fi = np.clip(fi, 0, _meta['H'] - 1.001)
    j0 = np.floor(fj).astype(int); i0 = np.floor(fi).astype(int)
    tj = fj - j0; ti = fi - i0
    d = _dem
    return (d[i0, j0] * (1 - tj) * (1 - ti) + d[i0, j0 + 1] * tj * (1 - ti) + d[i0 + 1, j0] * (1 - tj) * ti + d[i0 + 1, j0 + 1] * tj * ti)


def land_mask(n, L):
    """Rasterised coastline: True on land, on an n x n grid of side L centred on the origin (row 0 = north)."""
    px = L / n
    im = Image.new('L', (n, n), 0)
    pts = [((x + L / 2) / px, (L / 2 - y) / px) for x, y in COAST]
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.asarray(im) > 127


def jfa_distance(seed):
    """Euclidean distance (in cells) from every cell to the nearest seed cell, by jump flooding."""
    n0, n1 = seed.shape
    INF = 1 << 30
    sy = np.where(seed, np.arange(n0)[:, None], INF).astype(np.int64)
    sx = np.where(seed, np.arange(n1)[None, :], INF).astype(np.int64)
    I = np.arange(n0)[:, None]; J = np.arange(n1)[None, :]
    k = 1 << int(math.ceil(math.log2(max(n0, n1))))
    while k >= 1:
        for dy in (-k, 0, k):
            for dx in (-k, 0, k):
                if dy == 0 and dx == 0:
                    continue
                cy = np.roll(sy, (dy, dx), (0, 1)); cx = np.roll(sx, (dy, dx), (0, 1))
                # cells rolled in from the far side of the grid must not count
                if dy > 0: cy[:dy] = INF
                if dy < 0: cy[dy:] = INF
                if dx > 0: cx[:, :dx] = INF
                if dx < 0: cx[:, dx:] = INF
                d_new = (cy - I) ** 2 + (cx - J) ** 2
                d_old = (sy - I) ** 2 + (sx - J) ** 2
                better = (cy < INF) & (cx < INF) & (d_new < d_old)
                sy = np.where(better, cy, sy); sx = np.where(better, cx, sx)
        k //= 2
    return np.sqrt(((sy - I) ** 2 + (sx - J) ** 2).astype(np.float64))


def signed_distance(n, L):
    """Metres inland of the coast (negative at sea), on the same grid as land_mask."""
    m = land_mask(n, L)
    edge = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    d = jfa_distance(edge) * (L / n)
    return np.where(m, d, -d)
