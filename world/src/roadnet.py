"""Grade-aware road routing and a road audit.

A road is found by A* over a coarse copy of the uncarved ground: each step costs its length, more the
steeper it climbs, and is refused above the road's ruling grade, in water or on anything built. So roads
follow the contours, switch back where they must, and go round buildings, terraces and grounds instead
of through them. The audit then measures every finished road on the carved ground."""
import heapq, math
import numpy as np
from noise import F32
from terrain_common import resample_polyline, smooth_1d, grade_limit

SQ2 = math.sqrt(2.0); SQ5 = math.sqrt(5.0)
NB = [(-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0), (-1, -1, SQ2), (-1, 1, SQ2), (1, -1, SQ2), (1, 1, SQ2),
      (-2, -1, SQ5), (-2, 1, SQ5), (2, -1, SQ5), (2, 1, SQ5), (-1, -2, SQ5), (1, -2, SQ5), (-1, 2, SQ5), (1, 2, SQ5)]


class Router:
    def __init__(self, g, H0, cell=8.0, sea=1.0):
        self.g = g
        f = max(1, int(round(cell / g.px)))
        self.f = f
        self.cell = g.px * f
        n = g.N // f
        self.n = n
        self.H = H0[:n * f, :n * f].reshape(n, f, n, f).mean(axis=(1, 3)).astype(F32)
        self.x0 = g.x0 + (f - 1) * g.px / 2
        self.y0 = g.y0 - (f - 1) * g.px / 2
        self.block = self.H < sea
        self.used = np.zeros((n, n), bool)

    # ---- coordinates
    def ij(self, x, y):
        return int(round((self.y0 - y) / self.cell)), int(round((x - self.x0) / self.cell))

    def xy(self, i, j):
        return self.x0 + j * self.cell, self.y0 - i * self.cell

    def _grid(self):
        xs = self.x0 + np.arange(self.n) * self.cell
        ys = self.y0 - np.arange(self.n) * self.cell
        return np.meshgrid(xs, ys)

    # ---- obstacles
    def block_disc(self, x, y, r):
        X, Y = self._grid()
        self.block |= np.hypot(X - x, Y - y) < r

    def block_rect(self, x, y, ang, hw, hd):
        X, Y = self._grid()
        c, s = math.cos(ang), math.sin(ang)
        u = (X - x) * c + (Y - y) * s; v = -(X - x) * s + (Y - y) * c
        self.block |= (np.abs(u) < hw) & (np.abs(v) < hd)

    def block_fn(self, fn):
        X, Y = self._grid()
        self.block |= fn(X, Y)

    def mark_used(self, pts, r=1):
        for x, y in np.asarray(pts)[:, :2]:
            i, j = self.ij(x, y)
            self.used[max(0, i - r):i + r + 1, max(0, j - r):j + r + 1] = True

    # ---- search
    def find(self, a, b, gmax, soft, margin=400.0, reuse=0.55, turn=0.0):
        ia, ja = self.ij(*a); ib, jb = self.ij(*b)
        m = int(margin / self.cell)
        i0 = max(0, min(ia, ib) - m); i1 = min(self.n, max(ia, ib) + m + 1)
        j0 = max(0, min(ja, jb) - m); j1 = min(self.n, max(ja, jb) + m + 1)
        H = self.H[i0:i1, j0:j1]; B = self.block[i0:i1, j0:j1].copy(); U = self.used[i0:i1, j0:j1]
        h_, w_ = H.shape
        sa = (ia - i0, ja - j0); sb = (ib - i0, jb - j0)
        for (pi, pj) in (sa, sb):                       # the ends may sit at an obstacle's edge
            B[max(0, pi - 1):pi + 2, max(0, pj - 1):pj + 2] = False
        INF = float('inf')
        dist = np.full(h_ * w_, INF); par = np.full(h_ * w_, -1, np.int64)
        start = sa[0] * w_ + sa[1]; goal = sb[0] * w_ + sb[1]
        dist[start] = 0.0
        cell = self.cell
        gi, gj = sb
        heap = [(0.0, 0.0, start)]
        Hl = H.tolist(); Bl = B.tolist(); Ul = U.tolist()
        ks = 1.0 / (soft * soft)
        while heap:
            fcur, dcur, k = heapq.heappop(heap)
            if k == goal:
                break
            if dcur > dist[k]:
                continue
            i, j = divmod(k, w_)
            hz = Hl[i][j]
            for di, dj, L in NB:
                ni = i + di; nj = j + dj
                if ni < 0 or nj < 0 or ni >= h_ or nj >= w_ or Bl[ni][nj]:
                    continue
                run = L * cell
                gr = abs(Hl[ni][nj] - hz) / run
                if gr > gmax:
                    continue
                c = run * (1.0 + gr * gr * ks)
                if Ul[ni][nj]:
                    c *= reuse
                nd = dcur + c
                nk = ni * w_ + nj
                if nd < dist[nk]:
                    dist[nk] = nd; par[nk] = k
                    heapq.heappush(heap, (nd + math.hypot(ni - gi, nj - gj) * cell * (reuse if reuse < 1 else 1), nd, nk))
        if dist[goal] == INF:
            return None
        cells = []
        k = goal
        while k != -1:
            i, j = divmod(k, w_)
            cells.append(self.xy(i + i0, j + j0))
            k = par[k]
        cells.reverse()
        pts = np.array(cells, float)
        pts[0] = a; pts[-1] = b
        return pts

    def road(self, a, b, gmax=0.1, soft=0.06, step=3.0, smooth=3, margin=400.0, H=None, z_ends=None, label='', fix=None):
        """Route a road from a to b; returns (n,3) with a graded profile, or raises if none exists."""
        pts = None
        for gm, mg in ((gmax, margin), (gmax, margin * 2.5), (gmax * 1.3, margin * 2.5)):
            pts = self.find(a, b, gm, soft, mg)
            if pts is not None:
                if gm != gmax:
                    print('ROUTE', label, 'needed a ruling grade of', round(gm, 3))
                break
        if pts is None:
            raise RuntimeError(f'no route for {label}')
        pts = resample_polyline(pts, step)
        if smooth and len(pts) > 4 * smooth:
            xs = smooth_1d(pts[:, 0], smooth); ys = smooth_1d(pts[:, 1], smooth)
            xs[0], ys[0] = pts[0]; xs[-1], ys[-1] = pts[-1]
            pts = np.column_stack([xs, ys])
        pts = resample_polyline(pts, step)
        z = self.g.sample(pts[:, 0], pts[:, 1], H).astype(np.float64)
        fixed = np.full(len(z), np.nan)
        if z_ends is not None:
            if z_ends[0] is not None:
                fixed[:3] = z_ends[0]
            if z_ends[1] is not None:
                fixed[-3:] = z_ends[1]
        if fix is not None:                           # heights this road must meet along its way (crossings)
            fz = fix(pts)
            fixed = np.where(np.isnan(fixed), fz, fixed)
        z = np.where(np.isnan(fixed), z, fixed)
        z = smooth_1d(z, 5)
        z = np.where(np.isnan(fixed), z, fixed)
        z = grade_limit(z, step, gmax, fixed)
        self.mark_used(pts)
        return np.column_stack([pts, z])


def audit(name, roads, g, footprints, gmax_road=0.1, gmax_path=0.22, step=3.0):
    """Measure every road on the carved ground: steepest grade, and any length on a footprint.
    footprints: list of (label, fn(X, Y) -> bool array)."""
    rows = []
    for label, pts, kind in roads:
        p = resample_polyline(np.asarray(pts)[:, :2], step)
        z = g.sample(p[:, 0], p[:, 1]).astype(np.float64)
        z = smooth_1d(z, 2, passes=1)
        s = np.linalg.norm(np.diff(p, axis=0), axis=1)
        gr = np.abs(np.diff(z)) / np.maximum(s, 1e-6)
        g95 = float(np.percentile(gr, 95)) if len(gr) else 0.0
        gmx = float(gr.max()) if len(gr) else 0.0
        hits = []
        for fl, fn in footprints:
            inside = fn(p[:, 0], p[:, 1])
            if inside[3:-3].any():
                hits.append(f'{fl} ({int(inside[3:-3].sum() * step)} m)')
        lim = gmax_road if kind == 'road' else (0.30 if kind == 'stair' else gmax_path)   # a stair: the stepped way to a hall on a summit
        ok = gmx <= lim * 1.3 and not hits          # short pitches up to 30% over the ruling grade
        rows.append(dict(road=label, kind=kind, length=int(s.sum()), grade95=round(g95, 3), grade_max=round(gmx, 3),
                         limit=lim, hits=hits, ok=bool(ok)))
    bad = [r for r in rows if not r['ok']]
    print(f'AUDIT {name}: {len(rows)} roads and paths, {len(bad)} failing')
    for r in rows:
        if not r['ok'] or r['kind'] == 'road':
            print('  ', 'ok ' if r['ok'] else 'BAD', r['road'], r['kind'], r['length'], 'm, grade 95%', r['grade95'], 'max', r['grade_max'], r['hits'])
    return rows
