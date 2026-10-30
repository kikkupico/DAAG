"""Paxos: Leros in the Dodecanese, turned end to end, three sections joined by two narrow necks.
The northern section holds Schedia, with the Tholos on the island's highest summit; the middle section
the city of Paxos at the head of the bay, with the Chamber on its summit facing the Tholos across the
bay; the oracle stands on the southern neck where the road forks; the southern section, the largest
and lowest, is the scholars' coast, with its libraries, the stoa harbour, the ferry across the Partheni
inlet and the couriers' cove at the southern tip. The ground is Leros's (src/leros.py), lowered where
the halls must stand highest and given the fine relief the elevation data lacks."""
import math, sys
import numpy as np
from noise import Perlin, fbm, smoothstep, smin, smax, F32
from terrain_common import (Grid, carve_rect, carve_disc, carve_road, resample_polyline, smooth_1d,
                            grade_limit, slope_deg, save, polyline_field)
import leros

N = int(sys.argv[1]) if len(sys.argv) > 1 else 6144
L = 11000.0
g = Grid(N, L)
rng = np.random.default_rng(21)
P = [Perlin(100 + s) for s in range(12)]

# sites, in model metres, read off the turned map of Leros
CH0 = np.array([920.0, 2520.0])            # the middle section's summit, on the bay's south shore
TH0 = np.array([-1250.0, 4680.0])          # the northern section's summit, above the bay's north shore
OR0 = np.array([0.0, -300.0])              # the southern neck, between Alinda bay (west) and Gourna bay (east)
NW_LOBE = np.array([-3440.0, 3380.0])      # the northern section's western hill, lowered below both halls
TWIN_TOP = np.array([-1782.0, 4489.0])     # a second top on the Tholos's ridge, lowered so the Tholos's is the highest
# the Partheni inlet, drowned a little further up its valley so that the ferry is the short way across
INLET = np.array([(2330.0, -3350.0), (2340.0, -3000.0), (2330.0, -2700.0), (2300.0, -2420.0)])
# the couriers' cove: a narrow notch in the cliffs at the southern tip
COURIER_COVE = np.array([(1990.0, -4560.0), (2010.0, -4420.0), (1990.0, -4300.0)])
# where the shore must come down gently: the city at the bay's head, Schedia's cove, the stoa harbour, the ferry banks
HARBOUR_ZONES = [(-1450.0, 1950.0, 450.0), (-1150.0, 3500.0, 400.0), (1400.0, -150.0, 450.0), (2330.0, -2950.0, 450.0)]


def seg_dist(X, Y, pts, r0, r1=None):
    """Distance to a polyline minus a radius tapering r0 -> r1; also returns param t (0..1) and signed side."""
    r1 = r0 if r1 is None else r1
    best = np.full(X.shape, np.inf, F32); tt = np.zeros(X.shape, F32); side = np.zeros(X.shape, F32)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(seg)]); tot = cum[-1]
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        ab = b - a; L2 = ab @ ab
        t = np.clip(((X - a[0]) * ab[0] + (Y - a[1]) * ab[1]) / L2, 0, 1)
        px, py = a[0] + t * ab[0], a[1] + t * ab[1]
        d = np.hypot(X - px, Y - py)
        m = d < best
        best = np.where(m, d, best)
        tg = (cum[k] + t * seg[k]) / tot
        tt = np.where(m, tg, tt)
        cr = ab[0] * (Y - a[1]) - ab[1] * (X - a[0])
        side = np.where(m, np.sign(cr), side)
    rad = r0 + (r1 - r0) * tt
    seg_dist.raw = best
    return best - rad, tt, side


print('coast distance', N)
_nd = min(N, 3072)                                    # the distance field at most at 3072 cells, then resampled
SD = leros.signed_distance(_nd, L).astype(F32)         # metres inland of the coast, negative at sea
if _nd != N:
    from PIL import Image as _Image
    SD = np.asarray(_Image.fromarray(SD, mode='F').resize((N, N), _Image.BILINEAR)).astype(F32)


def height_chunk(r0, r1, X, Y):
    d = SD[r0:r1].copy()
    # the drowned head of the inlet and the couriers' notch
    d_in, _, _ = seg_dist(X + 25 * fbm(P[7], X, Y, 200, 3), Y, INLET, 150, 70)
    d = np.minimum(d, d_in)
    d_cc, _, _ = seg_dist(X + 18 * fbm(P[2], X, Y, 55, 4), Y, COURIER_COVE, 40, 18)
    d = np.minimum(d, d_cc)
    near_cc = 1 - smoothstep(20, 220, d_cc)          # 1 at the couriers' cove, 0 beyond a few hundred metres
    # small irregularity at the shore, finer than the coastline data
    d = d + 6 * fbm(P[3], X, Y, 60, 3)
    dem = leros.dem_height(X, Y).astype(F32)
    dem = np.maximum(dem, 0)
    # the halls stand highest: the scholars' coast and the western hill of the northern section are lowered
    south = smoothstep(-250.0, -1100.0, Y)
    nw = 1 - smoothstep(500.0, 1300.0, np.hypot(X - NW_LOBE[0], Y - NW_LOBE[1]))
    twin = 1 - smoothstep(150.0, 420.0, np.hypot(X - TWIN_TOP[0], Y - TWIN_TOP[1]))
    land = dem * (1 - 0.30 * south) * (1 - 0.22 * nw) * (1 - 0.12 * twin)
    # relief finer than the elevation data: rock and scree high up, small folds everywhere
    up = smoothstep(60, 200, land)
    land += 3.5 * fbm(P[8], X, Y, 220, 4) + 9.0 * up * np.clip(fbm(P[9], X, Y, 260, 5, ridged=True) - 0.35, 0, None) * 2.0
    land += 0.8 * fbm(P[10], X, Y, 35, 3)
    # the shore: the land eases down to the water over a broad belt, with low cliffs only on exposed
    # stretches, never by a harbour, a ferry bank or a town; the couriers' cove keeps its cliffs
    hw = np.zeros_like(X)
    for hx, hy, hr in HARBOUR_ZONES:
        hw = np.maximum(hw, 1 - smoothstep(hr, hr + 350, np.hypot(X - hx, Y - hy)))
    expo = np.clip(0.45 + 1.4 * fbm(P[5], X, Y, 900, 3), 0, 1) * (1 - hw)
    ramp = 1 - np.exp(-np.clip(d, 0, None) / (45 + 55 * (1 - expo) + 60 * hw))   # rising at once from the water, gentler at harbours
    cliff_h = np.clip(0.55 * land, 0, 30) * expo
    cliff_h = np.maximum(cliff_h, near_cc * (40 + 14 * fbm(P[3], X, Y, 70, 4)))
    land = np.maximum(land * ramp, cliff_h * smoothstep(0, 5, d) * (1 - smoothstep(30, 150, d)))
    land = land + 1.2 * smoothstep(0, 30, d)
    sd_ = np.clip(-d, 0, None)
    sea = -2.5 - 22 * smoothstep(0, 120, sd_) - 30 * smoothstep(100, 900, sd_) - 15 * smoothstep(800, 2200, sd_)
    sea += 2.5 * fbm(P[4], X, Y, 160, 4)
    t = smoothstep(-3, 3, d)
    h = sea * (1 - t) + np.maximum(land, 0.6) * t
    return h.astype(F32)


print('height field', N)
for r0, r1, X, Y in g.chunks(256):
    g.H[r0:r1] = height_chunk(r0, r1, X, Y)
H0 = g.H.copy()
masks = {k: np.zeros((N, N), F32) for k in ('road', 'built', 'quay', 'sand', 'clearing', 'path')}
sites = dict(island='paxos', buildings=[], quays=[], piers=[], libraries=[], roads=[], paths=[], props=[])


def z_at(x, y):
    return float(g.sample(x, y))


def summit_near(c, r=260.0, step=6.0):
    """The highest ground within r of c."""
    best = None
    for dx in np.arange(-r, r + 1, step):
        for dy in np.arange(-r, r + 1, step):
            if dx * dx + dy * dy > r * r:
                continue
            z = float(H0[g.ij(c[0] + dx, c[1] + dy)])
            if best is None or z > best[0]:
                best = (z, np.array([c[0] + dx, c[1] + dy]))
    return best[1]


# ---------------------------------------------------------------- the halls on the two summits, the oracle on the neck
def terrace_on_slope(x, y, r, fall=14, extra=0.0):
    z = z_at(x, y) + extra
    carve_disc(g, x, y, r, z, fall=fall, mask=masks['built'])
    return z


CH = summit_near(CH0)
TH = summit_near(TH0)
# each hall's terrace sits a little below its summit's very top, on the side facing the other hall
fw = (TH - CH) / np.linalg.norm(TH - CH)
CH = CH + fw * 20.0
TH = TH - fw * 16.0
zc = terrace_on_slope(*CH, 36, fall=30, extra=-3.0)
sites['chamber'] = dict(x=float(CH[0]), y=float(CH[1]), z=zc)
zt = z_at(*TH) - 3.0
carve_rect(g, TH[0], TH[1], math.atan2(CH[1] - TH[1], CH[0] - TH[0]) + math.pi / 2, 23, 23, zt, fall=20, mask=masks['built'])
sites['tholos'] = dict(x=float(TH[0]), y=float(TH[1]), z=zt, face=math.atan2(CH[1] - TH[1], CH[0] - TH[0]))
OR = OR0
zo = z_at(*OR)
carve_rect(g, OR[0], OR[1], 0.0, 36, 44, zo, fall=48, mask=masks['built'])
sites['oracle'] = dict(x=float(OR[0]), y=float(OR[1]), z=zo)
print('summits: Chamber', round(zc), 'Tholos', round(zt), 'oracle', round(zo), 'island max', round(float(H0.max())))


def find_shore(p0, direction, max_d=4500, step=4.0):
    d = np.array(direction, float); d /= np.linalg.norm(d)
    p = np.array(p0, float)
    for i in range(int(max_d / step)):
        if z_at(*p) < 0.0:
            return p
        p = p + d * step
    return p


def harbour(name, land_pt, sea_dir, quay_w=90, town_rows=4, town_w=150, town=True, mole=True, shelf=True):
    """A cove harbour: waterfront shelf, quay, mole, town rows climbing the slope behind."""
    sh = find_shore(land_pt, sea_dir)
    out = np.array(sea_dir, float); out /= np.linalg.norm(out)
    tan = np.array([out[1], -out[0]])
    ang = math.atan2(tan[1], tan[0])           # building width axis along the shore, +y local = out (seaward)
    c = sh - out * 14
    if shelf:
        carve_rect(g, c[0], c[1], ang, quay_w * 0.75, 20, 2.2, fall=34)
    else:
        carve_rect(g, c[0], c[1], ang, quay_w * 0.45, 14, 2.4, fall=4, batter=0.3, reach=6)
    qc = sh - out * 2
    carve_rect(g, qc[0], qc[1], ang, quay_w / 2, 8, 2.1, fall=6, mask=masks['quay'])
    sites['quays'].append(dict(x=qc[0], y=qc[1], ang=ang, w=quay_w, d=16, z=2.3, port=name))
    if mole:
        mc = sh + out * 45 + tan * quay_w * 0.35
        sites['piers'].append(dict(x=mc[0], y=mc[1], ang=math.atan2(out[1], out[0]), len=80, w=8, z=2.2, port=name))
    houses = []
    if town:
        for row in range(town_rows):
            u = 30 + row * 21
            v = -town_w / 2 + rng.uniform(0, 8)
            while v < town_w / 2:
                kind = rng.choice(['court', 'court', 'small', 'store'] if row == 0 else ['court', 'court', 'small'])
                ww, dd = ((rng.uniform(12, 15), rng.uniform(12, 15)) if kind == 'court' else
                          (rng.uniform(7, 10), rng.uniform(7, 9)) if kind == 'small' else (rng.uniform(18, 24), rng.uniform(8, 10)))
                if abs(v + ww / 2) < ww / 2 + 8.0:          # keep the town's main street clear
                    v = 8.0
                    continue
                cxy = sh - out * (u + rng.uniform(-4, 4)) + tan * (v + ww / 2)
                zz = float(H0[g.ij(*cxy)])
                if 2.5 < zz < 120 and rng.random() < 0.9 - 0.06 * row:
                    zz = round(zz * 2) / 2
                    a2 = ang + rng.normal(0, 0.07)
                    carve_rect(g, cxy[0], cxy[1], a2, ww / 2 + 0.5, dd / 2 + 0.5, zz, fall=7, mask=masks['built'])
                    houses.append(dict(kind=kind, x=cxy[0], y=cxy[1], z=zz, ang=a2, w=ww, d=dd, port=name, seed=int(rng.integers(1e9))))
                v += ww + rng.uniform(2.6, 6.5) + (rng.uniform(4, 9) if rng.random() < 0.15 else 0)
    sites['buildings'].extend(houses)
    top = sh - out * (30 + town_rows * 21 + 12)
    return dict(name=name, x=sh[0], y=sh[1], out=out.tolist(), ang=ang, houses=len(houses),
                street_top=[float(top[0]), float(top[1])], street_foot=[float((sh - out * 16)[0]), float((sh - out * 16)[1])])


# the city of Paxos at the head of the bay (Lakki on Leros); Schedia on the bay's north shore below the Tholos
sites['harbours'] = []
sites['harbours'].append(harbour('paxos', (-1450, 1820), (0.0, 1.0), quay_w=110, town_rows=5, town_w=200))
sites['harbours'].append(harbour('schedia', (-1150, 3680), (0.0, -1.0), quay_w=80, town_rows=5, town_w=170))
# the stoa harbour on the scholars' coast, on the gentle south shore of the eastern bay by the neck (Gourna)
sh_stoa = harbour('stoa', (1400, -250), (0.0, 1.0), quay_w=180, town=False)
sites['harbours'].append(sh_stoa)
# the couriers' landing in the notch at the southern tip
cl = harbour('couriers', (2000.0, -4200), (0.0, -1.0), quay_w=40, town=False, mole=False, shelf=False)
sites['harbours'].append(cl)
# the festival ground in front with sea views, and the stoa building moved back behind it
out = np.array(sh_stoa['out']); tan = np.array([out[1], -out[0]])
fg = np.array([sh_stoa['x'], sh_stoa['y']]) - out * 44
zf_ = 3.0
carve_rect(g, fg[0], fg[1], sh_stoa['ang'], 75, 36, zf_, fall=24, mask=masks['built'])
sites['festival'] = dict(x=fg[0], y=fg[1], z=zf_, ang=sh_stoa['ang'], w=140, d=68)
sp = np.array([sh_stoa['x'], sh_stoa['y']]) - out * 105
zs = 4.0
carve_rect(g, sp[0], sp[1], sh_stoa['ang'], 70, 14, zs, fall=24, mask=masks['built'])
sites['stoa'] = dict(x=sp[0], y=sp[1], z=zs, ang=sh_stoa['ang'], len=120)

# the ferry across the inlet: two landing stages facing each other
mid = INLET[1]
dv = INLET[2] - INLET[0]; dv /= np.linalg.norm(dv)
nv = np.array([-dv[1], dv[0]])
ferry = []
def find_land(p0, direction, max_d=1500, step=2.0):
    d = np.array(direction, float); d /= np.linalg.norm(d)
    p = np.array(p0, float)
    for i in range(int(max_d / step)):
        if z_at(*p) > 0.5:
            return p
        p = p + d * step
    return p


for s_ in (1, -1):
    sh = find_land(mid, nv * s_)
    p_ = sh + nv * s_ * 20    # inland of the shore a little
    carve_rect(g, p_[0], p_[1], math.atan2(dv[1], dv[0]), 12, 14, 2.4, fall=10, mask=masks['quay'])
    ferry.append(dict(x=sh[0], y=sh[1], out=(-nv * s_).tolist(), lx=float(p_[0]), ly=float(p_[1])))
sites['ferry'] = ferry

# ---------------------------------------------------------------- libraries in clearings on the body
libs = []
tries = 0
def north_of_inlet(x, y):
    """The far bank of the inlet, the eastern hills, whose libraries cross by the ferry."""
    return x > 2600 and y < -2350


while len(libs) < 12 and tries < 8000:
    tries += 1
    if len(libs) < 3:
        x = rng.uniform(2650, 4300); y = rng.uniform(-3500, -2400)
        if not north_of_inlet(x, y):
            continue
    else:
        x = rng.uniform(-1700, 4300); y = rng.uniform(-4300, -900)
    z = z_at(x, y)
    if z < 12 or z > 170:
        continue
    gy, gx = (z_at(x, y + 8) - z_at(x, y - 8)) / 16, (z_at(x + 8, y) - z_at(x - 8, y)) / 16
    if math.hypot(gx, gy) > 0.22:
        continue
    if any(math.hypot(x - l['x'], y - l['y']) < (480 if len(libs) < 3 else 650) for l in libs):
        continue
    if math.hypot(x - sites['festival']['x'], y - sites['festival']['y']) < 400:
        continue
    face = math.atan2(-gy, -gx)       # porch faces downhill
    if z_at(x + math.cos(face) * 30, y + math.sin(face) * 30) < 5:      # never a porch at the water's edge
        continue
    zz = round(z * 2) / 2
    carve_disc(g, x, y, 22, zz, fall=12, mask=masks['clearing'])
    libs.append(dict(n=len(libs) + 1, x=x, y=y, z=zz, face=face))
sites['libraries'] = libs


# ---------------------------------------------------------------- the island road and the footpaths
from roadnet import Router, audit
from terrain_common import grade_limit
ch = sites['chamber']; tho = sites['tholos']; ora = sites['oracle']; st = sites['stoa']; fgd = sites['festival']
hp = sites['harbours'][0]; hs = sites['harbours'][1]
fw_ch = np.array([tho['x'] - ch['x'], tho['y'] - ch['y']]); fw_ch /= np.linalg.norm(fw_ch)
fw_th = np.array([math.cos(tho['face']), math.sin(tho['face'])])


def crosses(pts_xy, step=4.0):
    pts_xy = np.asarray(pts_xy, float)
    for a_, b_ in zip(pts_xy[:-1], pts_xy[1:]):
        n_ = max(2, int(np.linalg.norm(b_ - a_) / step))
        for f_ in np.linspace(0.05, 0.95, n_):
            q_ = a_ + (b_ - a_) * f_
            if float(H0[g.ij(*q_)]) < -0.3:
                return True
    return False


def oracle_oval(X, Y, grow=0.0):
    a_ = np.arctan2((Y - ora['y']) / 36.0, (X - ora['x']) / 29.0)
    rr = 1.0 + 0.07 * np.sin(3 * a_ + 0.7) + 0.05 * np.sin(5 * a_ + 2.1)
    q = np.hypot((X - ora['x']) / 29.0, (Y - ora['y']) / 36.0)
    return q < rr + grow


def rect_fn(x, y, ang, hw, hd):
    c_, s_ = math.cos(ang), math.sin(ang)
    return lambda X, Y: (np.abs((X - x) * c_ + (Y - y) * s_) < hw) & (np.abs(-(X - x) * s_ + (Y - y) * c_) < hd)


def disc_fn(x, y, r):
    return lambda X, Y: np.hypot(X - x, Y - y) < r


def footprints(margin):
    """Everything a road must not cross, grown by margin metres."""
    fp = [('Chamber', disc_fn(ch['x'], ch['y'], 14 + margin)),
          ('Tholos court', rect_fn(tho['x'], tho['y'], tho['face'] + math.pi / 2, 21 + margin, 21 + margin)),
          ('oracle enclosure', lambda X, Y: oracle_oval(X, Y, margin / 30.0)),
          ('stoa', rect_fn(st['x'], st['y'], st['ang'], 61 + margin, 8 + margin)),
          ('festival ground', rect_fn(fgd['x'], fgd['y'], fgd['ang'], 70 + margin, 36 + margin))]
    for l in libs:
        fp.append((f'library {l["n"]}', disc_fn(l['x'], l['y'], 11 + margin)))
    for b_ in sites['buildings']:
        fp.append((f'house in {b_["port"]}', rect_fn(b_['x'], b_['y'], b_['ang'], b_['w'] / 2 + margin * 0.5, b_['d'] / 2 + margin * 0.5)))
    return fp


R = Router(g, H0, cell=6.0)
for _, fn in footprints(3.5):
    R.block_fn(fn)


def edge_pt(c, d, r):
    return (float(c[0] + d[0] * r), float(c[1] + d[1] * r))


ora_s = (ora['x'], ora['y'] - 40.0); ora_n = (ora['x'], ora['y'] + 40.0)
cl_out = np.array(cl['out']); cl_head = np.array([cl['x'], cl['y']])
J0 = (2000.0, -4020.0)                                   # the road's end on the hill above the couriers' cove
def contour_pt(c, z, r, toward):
    """A point at distance r from c where the ground is nearest height z, on the side facing toward."""
    best = None
    for a_ in np.linspace(0, 2 * math.pi, 120, endpoint=False):
        q = (c[0] + r * math.cos(a_), c[1] + r * math.sin(a_))
        dz = abs(float(H0[g.ij(*q)]) - z)
        side = math.cos(a_ - math.atan2(toward[1] - c[1], toward[0] - c[0]))
        score = dz - 6.0 * side
        if best is None or score < best[0]:
            best = (score, q)
    return best[1]


CH = (ch['x'], ch['y'])
# the Chamber stands on its summit like a temple on an acropolis: no road reaches it, two stepped ways climb
# to its terrace, one from the road just beyond the oracle's north gate and one from the city at the bay's head
ch_in = contour_pt(CH, ch['z'], 38.0, (ora['x'], ora['y']))
ch_out = contour_pt(CH, ch['z'], 38.0, (hp['x'], hp['y']))
TH_ = (tho['x'], tho['y'])
th_side = contour_pt(TH_, tho['z'], 27.0, (ora['x'], ora['y']))     # the stepped way meets the Tholos's court on the level
city_end = tuple(hp['street_top'])                      # the road reaches the top of the town's main street
st_tan = np.array([math.cos(st['ang']), math.sin(st['ang'])])

main = R.road(J0, ora_s, 0.10, 0.06, z_ends=(None, ora['z']), label='main', margin=1200)


def keep_off(road, spare, r_m=14.0, spare_r=90.0):
    """Block a road's corridor for later routes, except near the given points, so that two roads never
    cross on a hillside at different heights."""
    rr = max(1, int(r_m / R.cell))
    for x, y in np.asarray(road)[::2, :2]:
        if min(math.hypot(x - q[0], y - q[1]) for q in spare) < spare_r:
            continue
        i, j = R.ij(x, y)
        R.block[max(0, i - rr):i + rr + 1, max(0, j - rr):j + rr + 1] = True


# beyond the north gate the road runs along the middle section below the Chamber's summit to the city at the
# head of the bay, and on over the northern neck to Schedia; the halls' summits are reached only on foot
west = R.road(ora_n, city_end, 0.09, 0.06, z_ends=(ora['z'], None), label='west', margin=1200)
sch_top = tuple(hs['street_top'])
east = R.road(tuple(west[-1, :2]), sch_top, 0.10, 0.06, z_ends=(west[-1, 2], None), label='east', margin=1400)


def branch(road, trunk, step=3.0, gmax=0.10):
    """Cut the stretch a road shares with its trunk, so it forks from the trunk and meets it on the level."""
    d = np.array([np.min(np.hypot(trunk[:, 0] - q[0], trunk[:, 1] - q[1])) for q in road[:, :2]])
    k = 0
    while k < len(d) - 2 and d[k] < 6.0:
        k += 1
    k = max(0, k - 1)
    out = road[k:].copy()
    j = int(np.argmin(np.hypot(trunk[:, 0] - out[0, 0], trunk[:, 1] - out[0, 1])))
    fixed = np.full(len(out), np.nan); fixed[0] = trunk[j, 2]; fixed[-1] = out[-1, 2]
    out[:, 2] = grade_limit(out[:, 2], step, gmax, fixed)
    return out


east = branch(east, west)
sites['road_paved'] = [dict(x=ch['x'], y=ch['y'], r=31.0)]     # where the road runs on paving, no ribbon
st_ends = [tuple(np.array([st['x'], st['y']]) + st_tan * s_ * 72) for s_ in (1, -1)]
st_end = min(st_ends, key=lambda q: np.min(np.hypot(main[:, 0] - q[0], main[:, 1] - q[1])))
k_ = int(np.argmin(np.hypot(main[:, 0] - st_end[0], main[:, 1] - st_end[1])))
stoa_rd = R.road(st_end, tuple(main[k_, :2]), 0.09, 0.06, z_ends=(st['z'], main[k_, 2]), label='stoa')
roads = dict(main=main, west=west, east=east, stoa=stoa_rd)
allroad = np.vstack([main, west, east, stoa_rd])

# farmsteads along the road, set back from it
for i in rng.choice(np.arange(50, len(main) - 50), 9, replace=False):
    p = main[i]; dv_ = main[min(i + 1, len(main) - 1), :2] - main[i - 1, :2]; dv_ /= np.linalg.norm(dv_)
    nrm = np.array([-dv_[1], dv_[0]]) * rng.choice([-1, 1])
    c = p[:2] + nrm * rng.uniform(22, 40)
    if np.min(np.hypot(allroad[:, 0] - c[0], allroad[:, 1] - c[1])) < 16:
        continue
    zz = z_at(*c)
    if zz < 5:
        continue
    zz = round(zz * 2) / 2
    a2 = math.atan2(dv_[1], dv_[0])
    carve_rect(g, c[0], c[1], a2, 8, 8, zz, fall=6, mask=masks['built'])
    sites['buildings'].append(dict(kind='court', x=c[0], y=c[1], z=zz, ang=a2, w=13, d=13, port='farm', seed=int(rng.integers(1e9))))
    R.block_fn(rect_fn(c[0], c[1], a2, 10, 10))


def porch(l, extra=24.0):
    return (l['x'] + math.cos(l['face']) * extra, l['y'] + math.sin(l['face']) * extra)


def north_lib(l):
    return north_of_inlet(l['x'], l['y'])


STAGE_N, STAGE_S = sorted([(f['lx'], f['ly']) for f in ferry], key=lambda q: -q[0])   # the far (east) bank's stage, then the near one's
paths = []


def road_z_at(q):
    k = int(np.argmin(np.hypot(allroad[:, 0] - q[0], allroad[:, 1] - q[1])))
    return float(allroad[k, 2]) if np.hypot(allroad[k, 0] - q[0], allroad[k, 1] - q[1]) < 4 else None


def on_roads(pts):
    """Height of the road, or of a path already laid, wherever these points cross one; else nan."""
    ways = np.vstack([allroad] + paths) if paths else allroad
    out = np.full(len(pts), np.nan)
    for i, q in enumerate(pts):
        d = np.hypot(ways[:, 0] - q[0], ways[:, 1] - q[1])
        k = int(np.argmin(d))
        if d[k] < (5.0 if k < len(allroad) else 2.5):
            out[i] = ways[k, 2]
    return out


def path(a_, b_, label):
    try:
        paths.append(R.road(a_, b_, 0.20, 0.14, margin=250, label=label, z_ends=(road_z_at(a_), road_z_at(b_)), fix=on_roads))
    except RuntimeError as e:
        print('NO PATH', label, e)


south_road = np.vstack([main, stoa_rd])
for l in libs:
    if north_lib(l):
        path(porch(l), STAGE_N, f'library {l["n"]} to the ferry')
    else:
        k_ = int(np.argmin(np.hypot(south_road[:, 0] - l['x'], south_road[:, 1] - l['y'])))
        path(porch(l), tuple(south_road[k_, :2]), f'library {l["n"]} to the road')
for a in libs:
    same = [b for b in libs if b['n'] != a['n'] and north_lib(b) == north_lib(a)]
    for b in sorted(same, key=lambda b: math.hypot(a['x'] - b['x'], a['y'] - b['y']))[:2]:
        if a['n'] < b['n']:
            path(porch(a), porch(b), f'libraries {a["n"]}-{b["n"]}')
# across the inlet only by the ferry: the south stage joins the road and the nearest library
k_ = int(np.argmin(np.hypot(south_road[:, 0] - STAGE_S[0], south_road[:, 1] - STAGE_S[1])))
path(STAGE_S, tuple(south_road[k_, :2]), 'south ferry stage to the road')
sl_ = min([l for l in libs if not north_lib(l)], key=lambda l: math.hypot(l['x'] - STAGE_S[0], l['y'] - STAGE_S[1]))
path(STAGE_S, porch(sl_), f'south ferry stage to library {sl_["n"]}')
crossing_routes = sum(1 for l in libs if north_lib(l))
# the couriers' path climbs out of the cove to the road
path(tuple(cl_head - cl_out * 30), J0, "couriers' path")
# each town's main street, stepped, from its top down to the quay
for hb in sites['harbours'][:2]:
    for _ in range(1):
        R.block[:] = R.block                                   # the street corridor is already clear of houses
    path(tuple(hb['street_top']), tuple(hb['street_foot']), f"main street of {hb['name']}")
# the way from the Tholos's court to the top of Schedia's street
d_ = np.array([hs['street_top'][0] - tho['x'], hs['street_top'][1] - tho['y']]); d_ /= np.linalg.norm(d_)
stairs = {len(paths), len(paths) + 1, len(paths) + 2}      # the three stepped ways to the halls, added next
paths.append(R.road(th_side, tuple(hs['street_top']), 0.22, 0.14, margin=700, label='Tholos to Schedia', z_ends=(tho['z'], road_z_at(tuple(hs['street_top']))), fix=on_roads))
# the two stepped ways to the Chamber: from the road just beyond the oracle's north gate, and from the city
k_ = next(i for i, q in enumerate(west) if math.hypot(q[0] - ora_n[0], q[1] - ora_n[1]) > 140)
paths.append(R.road(tuple(west[k_, :2]), ch_in, 0.22, 0.14, margin=700, label='oracle road to the Chamber', z_ends=(float(west[k_, 2]), ch['z']), fix=on_roads))
paths.append(R.road(ch_out, city_end, 0.22, 0.14, margin=700, label='Chamber to the city', z_ends=(ch['z'], road_z_at(city_end)), fix=on_roads))

# a house a road or the stepped main street had to cross is left out: the way wins
for pth in [p_ for p_ in paths if len(p_) <= 80] + list(roads.values()):
    keep = []
    for b_ in sites['buildings']:
        f_ = rect_fn(b_['x'], b_['y'], b_['ang'], b_['w'] / 2 + 1.0, b_['d'] / 2 + 1.0)
        if b_['port'] in ('paxos', 'schedia') and f_(np.asarray(pth)[:, 0], np.asarray(pth)[:, 1]).any():
            continue
        keep.append(b_)
    sites['buildings'] = keep
# re-level each building's exact footprint (neighbouring blends overlap)
for b_ in sites['buildings']:
    carve_rect(g, b_['x'], b_['y'], b_['ang'], b_['w'] / 2 + 0.3, b_['d'] / 2 + 0.3, b_['z'], fall=0.6, batter=0.0, reach=0.0)
carve_road(g, list(paths), 1.0, 3.0, mask=masks['path'])
carve_road(g, list(roads.values()), 2.8, 7.0, mask=masks['road'])
for (c, rad, z) in (((ch['x'], ch['y']), 31.0, ch['z']), ((ora['x'], ora['y']), 30.0, ora['z'])):
    carve_disc(g, c[0], c[1], rad, z, fall=3, batter=0.0, reach=0.0)
carve_rect(g, tho['x'], tho['y'], tho['face'] + math.pi / 2, 21, 21, tho['z'], fall=2, batter=0.0, reach=0.0)
carve_rect(g, st['x'], st['y'], st['ang'], 62, 8, st['z'], fall=3)
sites['roads'] = {k_: v.tolist() for k_, v in roads.items()}
sites['paths'] = [p_.tolist() for p_ in paths]
sites['road_audit'] = audit('paxos', [(k_, v, 'road') for k_, v in roads.items()] + [(f'path {i}', p_, 'stair' if i in stairs else 'path') for i, p_ in enumerate(paths)],
                            g, footprints(0.0))

# ---------------------------------------------------------------- masks
sl = slope_deg(g)
H = g.H
masks['rock'] = smoothstep(40, 55, sl)
masks['cliff'] = smoothstep(38, 55, sl) * (H < 120) * (H > -3)
near_water = H < 0.0                                     # sand only in a strip at the water's edge, not on every low flat
for _ in range(int(22 / g.px)):
    near_water = near_water | np.roll(near_water, 1, 0) | np.roll(near_water, -1, 0) | np.roll(near_water, 1, 1) | np.roll(near_water, -1, 1)
masks['sand'] = ((H > -1.5) & (H < 1.8) & (sl < 12) & near_water).astype(F32) * (1 - masks['quay'])
masks['built'] = np.maximum(masks['built'], masks['path'] * 0)
def visible(a, b):
    a = np.array(a, float); b = np.array(b, float)
    n = int(np.linalg.norm(b[:2] - a[:2]) / g.px) + 2
    tt = np.linspace(0, 1, n)[2:-2]
    P_ = a[None] + tt[:, None] * (b - a)[None]
    terr = g.sample(P_[:, 0], P_[:, 1])
    return bool(np.all(terr < P_[:, 2] - 0.5)), float(np.max(terr - P_[:, 2]))


vis = visible((ch['x'], ch['y'], ch['z'] + 4), (tho['x'], tho['y'], tho['z'] + 4))
print('SIGHT chamber-tholos', vis)
bad = [i for i, p_ in enumerate(paths) if crosses(np.array(p_)[:, :2])] + [k_ for k_, r_ in roads.items() if crosses(np.array(r_)[:, :2])]
print('CROSSINGS left', bad, 'routes via ferry', crossing_routes)
sites['checks'] = dict(chamber_tholos_visible=vis, crossings=bad, ferry_routes=crossing_routes)
save('paxos', g, masks, sites)
print('libraries', len(libs), 'houses', len(sites['buildings']), [h_['houses'] for h_ in sites['harbours']])
