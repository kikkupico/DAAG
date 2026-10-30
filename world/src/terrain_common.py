"""Shared terrain machinery: grids, carving pads and roads, masks, export."""
import json, os
import numpy as np
from PIL import Image
from noise import F32, smoothstep, blur, bilinear

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, '..', 'build', 'terrain')


class Grid:
    def __init__(self, N, L):
        self.N, self.L = N, L
        self.px = L / N
        self.x0 = -L / 2 + self.px / 2          # world x of column 0
        self.y0 = L / 2 - self.px / 2           # world y of row 0 (north)
        self.H = np.zeros((N, N), F32)
        self.cut = np.zeros((N, N), F32)      # cut-and-fill slopes made by levelling

    def xs(self):
        return (self.x0 + np.arange(self.N) * self.px).astype(F32)

    def ys(self):
        return (self.y0 - np.arange(self.N) * self.px).astype(F32)

    def chunks(self, rows=512):
        xs = self.xs(); ys = self.ys()
        for r0 in range(0, self.N, rows):
            r1 = min(self.N, r0 + rows)
            X, Y = np.meshgrid(xs, ys[r0:r1])
            yield r0, r1, X, Y

    def sample(self, X, Y, H=None):
        return bilinear(self.H if H is None else H, self.px, self.x0, self.y0, X, Y)

    def ij(self, x, y):
        return (int(round((self.y0 - y) / self.px)), int(round((x - self.x0) / self.px)))

    def window(self, x, y, r):
        """Index window around world point with radius r metres; returns slices and local X, Y."""
        i, j = self.ij(x, y)
        k = int(np.ceil(r / self.px)) + 1
        i0, i1 = max(0, i - k), min(self.N, i + k + 1)
        j0, j1 = max(0, j - k), min(self.N, j + k + 1)
        X, Y = np.meshgrid(self.x0 + np.arange(j0, j1) * self.px, self.y0 - np.arange(i0, i1) * self.px)
        return slice(i0, i1), slice(j0, j1), X.astype(F32), Y.astype(F32)


BATTER = 1.7


def _mark_cut(g, si, sj, w, z):
    m = ((w > 0.03) & (w < 0.97) & (np.abs(g.H[si, sj] - z) > 1.2)).astype(F32)
    g.cut[si, sj] = np.maximum(g.cut[si, sj], m)       # horizontal metres per metre of height at the edge of a levelled site


def carve_rect(g, cx, cy, ang, hw, hd, z, fall=8.0, mask=None, mask_val=1.0, round_r=0.0, batter=BATTER, reach=90.0):
    """Flatten an oriented rectangle (half width hw along ang, half depth hd) to height z, blending out
    over fall metres plus a batter slope proportional to the height difference (cut and fill).
    ang = direction of the rectangle's width axis, radians from +x (counter-clockwise)."""
    R = max(hw, hd) + fall + reach + 2
    si, sj, X, Y = g.window(cx, cy, R)
    dx, dy = X - cx, Y - cy
    c, s = np.cos(ang), np.sin(ang)
    u = dx * c + dy * s; v = -dx * s + dy * c
    qx = np.abs(u) - (hw - round_r); qy = np.abs(v) - (hd - round_r)
    d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - round_r
    span = np.minimum(fall + batter * np.abs(g.H[si, sj] - z), fall + reach)
    w = 1 - smoothstep(0, 1, np.clip(d / span, 0, 1))
    _mark_cut(g, si, sj, w, z)
    g.H[si, sj] = g.H[si, sj] * (1 - w) + z * w
    if mask is not None:
        m = (d < 0.5).astype(F32) * mask_val
        mask[si, sj] = np.maximum(mask[si, sj], m)
    return d


def carve_disc(g, cx, cy, r, z, fall=8.0, mask=None, mask_val=1.0, batter=BATTER, reach=90.0):
    si, sj, X, Y = g.window(cx, cy, r + fall + reach + 2)
    d = np.hypot(X - cx, Y - cy) - r
    span = np.minimum(fall + batter * np.abs(g.H[si, sj] - z), fall + reach)
    w = 1 - smoothstep(0, 1, np.clip(d / span, 0, 1))
    _mark_cut(g, si, sj, w, z)
    g.H[si, sj] = g.H[si, sj] * (1 - w) + z * w
    if mask is not None:
        mask[si, sj] = np.maximum(mask[si, sj], (d < 0.5).astype(F32) * mask_val)


def polyline_field(g, pts, reach):
    """Distance to a 3D polyline and the polyline's z at the nearest point, within reach metres.
    pts: (n,3). Returns dist (inf outside) and zfield."""
    dist = np.full(g.H.shape, np.inf, F32)
    zf = np.zeros(g.H.shape, F32)
    for a, b in zip(pts[:-1], pts[1:]):
        lo = np.minimum(a[:2], b[:2]) - reach; hi = np.maximum(a[:2], b[:2]) + reach
        i0 = max(0, int((g.y0 - hi[1]) / g.px)); i1 = min(g.N, int((g.y0 - lo[1]) / g.px) + 2)
        j0 = max(0, int((lo[0] - g.x0) / g.px)); j1 = min(g.N, int((hi[0] - g.x0) / g.px) + 2)
        if i0 >= i1 or j0 >= j1:
            continue
        X, Y = np.meshgrid(g.x0 + np.arange(j0, j1) * g.px, g.y0 - np.arange(i0, i1) * g.px)
        ab = b[:2] - a[:2]; L2 = max(float(ab @ ab), 1e-9)
        t = np.clip(((X - a[0]) * ab[0] + (Y - a[1]) * ab[1]) / L2, 0, 1)
        d = np.hypot(X - (a[0] + t * ab[0]), Y - (a[1] + t * ab[1])).astype(F32)
        z = (a[2] + t * (b[2] - a[2])).astype(F32)
        sub = dist[i0:i1, j0:j1]
        better = d < sub
        sub[better] = d[better]
        zf[i0:i1, j0:j1][better] = z[better]
    return dist, zf


def resample_polyline(pts, step):
    pts = np.asarray(pts, np.float64)
    seg = np.linalg.norm(np.diff(pts[:, :2], axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(2, int(s[-1] / step) + 1)
    t = np.linspace(0, s[-1], n)
    return np.stack([np.interp(t, s, pts[:, k]) for k in range(pts.shape[1])], 1)


def smooth_1d(a, win, closed=False, passes=3):
    a = np.asarray(a, np.float64)
    for _ in range(passes):
        if closed:
            p = np.concatenate([a[-win:], a, a[:win]])
        else:
            p = np.concatenate([np.repeat(a[:1], win), a, np.repeat(a[-1:], win)])
        c = np.cumsum(np.concatenate([[0], p]))
        a = (c[2 * win + 1:] - c[:-2 * win - 1]) / (2 * win + 1)
    return a


def grade_limit(z, ds, g, fixed=None):
    """Limit the grade of a profile; fixed (nan where free) are hard heights the profile must meet."""
    z = np.array(z, np.float64)
    fx = np.zeros(len(z), bool) if fixed is None else ~np.isnan(fixed)
    if fixed is not None:
        z[fx] = fixed[fx]
    lo = np.full(len(z), -np.inf); hi = np.full(len(z), np.inf)
    # envelope from every fixed point: reachable heights at grade g
    idx = np.arange(len(z))
    for k in np.nonzero(fx)[0]:
        d = np.abs(idx - k) * ds * g
        lo = np.maximum(lo, z[k] - d); hi = np.minimum(hi, z[k] + d)
    z = np.clip(z, lo, hi)
    for _ in range(4):
        for i in range(1, len(z)):
            if not fx[i]:
                z[i] = np.clip(z[i], z[i - 1] - g * ds, z[i - 1] + g * ds)
        for i in range(len(z) - 2, -1, -1):
            if not fx[i]:
                z[i] = np.clip(z[i], z[i + 1] - g * ds, z[i + 1] + g * ds)
    return z


def carve_road(g, pts, half, shoulder, mask=None, fill_ok=True, batter=1.6, reach=50.0):
    """Carve one road, or several at once (a list), each cell taking the height of its nearest road, so
    the legs of a switchback do not cut into one another."""
    if isinstance(pts, (list, tuple)):
        dist = np.full(g.H.shape, np.inf, F32); zf = np.zeros(g.H.shape, F32)
        for p_ in pts:
            d_, z_ = polyline_field(g, p_, half + shoulder + reach + 2)
            better = d_ < dist
            dist[better] = d_[better]; zf[better] = z_[better]
    else:
        dist, zf = polyline_field(g, pts, half + shoulder + reach + 2)
    span = np.minimum(shoulder + batter * np.abs(g.H - zf), shoulder + reach)
    w = 1 - smoothstep(0, 1, np.clip((dist - half) / span, 0, 1))
    w[~np.isfinite(dist)] = 0
    cm = ((w > 0.03) & (w < 0.97) & (np.abs(g.H - zf) > 1.2) & np.isfinite(dist)).astype(F32)
    g.cut[:] = np.maximum(g.cut, cm)
    w[~np.isfinite(dist)] = 0
    g.H[:] = g.H * (1 - w) + zf * w
    if mask is not None:
        mask[:] = np.maximum(mask, (dist < half).astype(F32))
    return dist


def slope_deg(g, H=None):
    H = g.H if H is None else H
    gy, gx = np.gradient(H, g.px)
    return np.degrees(np.arctan(np.hypot(gx, gy))).astype(F32)


def hillshade(H, px, az=315, alt=40):
    gy, gx = np.gradient(H, px)
    slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
    a, b = np.radians(az), np.radians(alt)
    return np.clip(np.sin(b) * np.cos(slope) + np.cos(b) * np.sin(slope) * np.cos(a - aspect), 0, 1)


def save(name, g, masks, sites, preview=True):
    out = os.path.join(BUILD, name); os.makedirs(out, exist_ok=True)
    masks = dict(masks); masks['cut'] = blur(g.cut, 1, 1)
    np.save(os.path.join(out, 'height.npy'), g.H.astype(F32))
    np.savez_compressed(os.path.join(out, 'masks.npz'), **{k: (np.clip(m, 0, 1) * 255).astype(np.uint8) for k, m in masks.items()})
    for k, m in masks.items():
        Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, f'mask_{k}.png'))
    meta = dict(N=g.N, L=g.L, px=g.px, x0=g.x0, y0=g.y0, hmin=float(g.H.min()), hmax=float(g.H.max()))
    with open(os.path.join(out, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    with open(os.path.join(out, 'sites.json'), 'w') as f:
        json.dump(sites, f, indent=1, default=lambda o: o.tolist() if hasattr(o, 'tolist') else float(o))
    if preview:
        step = max(1, g.N // 2048)
        H = g.H[::step, ::step]
        hs = hillshade(H, g.px * step)
        land = H > 0
        rgb = np.zeros(H.shape + (3,), F32)
        hn = np.clip(H / max(1, H.max()), 0, 1)
        base = np.stack([0.55 + 0.35 * hn, 0.52 + 0.3 * hn, 0.38 + 0.4 * hn], -1)
        sea = np.stack([0.1 + 0 * H, 0.3 + 0.004 * np.clip(H + 60, 0, 60), 0.45 + 0.004 * np.clip(H + 60, 0, 60)], -1)
        rgb = np.where(land[..., None], base * (0.35 + 0.75 * hs[..., None]), sea)
        for k, col in (('road', (0.7, 0.1, 0.1)), ('built', (0.2, 0.2, 0.2))):
            if k in masks:
                m = masks[k][::step, ::step] > 0.5
                rgb[m] = col
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'preview.png'))
    print('saved', out, meta)
