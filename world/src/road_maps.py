"""Plan of every road and path over the hillshade, coloured by grade, for review."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from terrain_common import hillshade, resample_polyline
from noise import bilinear

ROOT = os.path.join(os.path.dirname(__file__), '..')
for isl in ('arche', 'paxos'):
    d = os.path.join(ROOT, 'build', 'terrain', isl)
    H = np.load(os.path.join(d, 'height.npy')); m = json.load(open(os.path.join(d, 'meta.json'))); s = json.load(open(os.path.join(d, 'sites.json')))
    step = max(1, m['N'] // 2048); Hs = H[::step, ::step]; px = m['px'] * step
    hs = hillshade(Hs, px)
    land = Hs > 0
    rgb = np.where(land[..., None], (np.stack([0.78, 0.72, 0.6]) * (0.35 + 0.7 * hs[..., None])), np.array([0.55, 0.68, 0.78]))
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
    sc = 1 / px

    def to_px(x, y):
        return ((x - m['x0']) * sc, (m['y0'] - y) * sc)

    ways = [(p, 'road') for p in ([s['road']] if isl == 'arche' else s['roads'].values())] + [(p, 'path') for p in s.get('paths', [])]
    for pts, kind in ways:
        p = resample_polyline(np.array(pts)[:, :2], 3.0)
        z = bilinear(H, m['px'], m['x0'], m['y0'], p[:, 0], p[:, 1])
        gr = np.abs(np.diff(z)) / 3.0
        lim = 0.1 if kind == 'road' else 0.22
        for (a, b, gg) in zip(p[:-1], p[1:], gr):
            t = min(1.0, gg / lim)
            col = (int(40 + 200 * t), int(160 - 120 * t), 40) if t < 1.0 else (220, 0, 200)
            dr.line([to_px(*a), to_px(*b)], fill=col, width=3 if kind == 'road' else 1)
    for b_ in s.get('buildings', []):
        x, y = to_px(b_['x'], b_['y']); dr.rectangle([x - 1, y - 1, x + 1, y + 1], fill=(30, 30, 30))
    out = os.path.join(ROOT, 'renders', 'preview', f'road-map-{isl}.jpg')
    im.save(out, quality=88)
    print('map', out)
