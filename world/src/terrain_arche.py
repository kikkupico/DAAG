"""Arche: a round island filled by Mount Phyle, three ports a third of the way round from
each other (N, ESE, WSW), a coastal ring road, four camps in the cardinal gullies, the crown.
Layout comes from the text (settings.md, buildings.md, world-prompt.md); no map is used."""
import math, sys
import numpy as np
from noise import Perlin, fbm, smoothstep, smax, smin, F32
from terrain_common import (Grid, carve_rect, carve_disc, carve_road, resample_polyline, smooth_1d,
                            grade_limit, slope_deg, save, polyline_field)

N = int(sys.argv[1]) if len(sys.argv) > 1 else 6144
L = 7600.0
g = Grid(N, L)
rng = np.random.default_rng(7)
P = [Perlin(s) for s in range(1, 12)]
D = math.radians

PORTS = {1: D(240), 2: D(0), 3: D(120)}       # House 1 WSW, House 2 N, House 3 ESE
CAMPS = {1: D(0), 2: D(90), 3: D(180), 4: D(270)}

# ---------------------------------------------------------------- coast as a function of bearing
TH = np.linspace(0, 2 * np.pi, 36000, endpoint=False)


def circ_noise(p, th, freq, seed_off=0.0):
    return p(np.cos(th) * freq + seed_off, np.sin(th) * freq - seed_off)


def angdiff(a, b):
    return (a - b + np.pi) % (2 * np.pi) - np.pi


def port_w(th, inner=D(8), outer=D(26)):
    w = np.zeros_like(th)
    for p in PORTS.values():
        w = np.maximum(w, 1 - smoothstep(inner, outer, np.abs(angdiff(th, p))))
    return w


R_base = 2950 + 230 * circ_noise(P[0], TH, 2.2) + 120 * circ_noise(P[1], TH, 5.0) + 50 * circ_noise(P[2], TH, 13.0) + 25 * circ_noise(P[7], TH, 29.0)
# headlands between the ports (the southern cape is the boldest)
for hb, amp, wd in ((D(60), 170, D(14)), (D(180), 360, D(11)), (D(300), 200, D(15))):
    R_base += amp * np.exp(-(angdiff(TH, hb) / wd) ** 2)
# small rocky coves and narrow rocky points of uneven length
R_base += 32 * np.abs(circ_noise(P[3], TH, 40.0)) - 10 * circ_noise(P[4], TH, 90.0)
crng = np.random.default_rng(11)
for cb in crng.uniform(0, 2 * np.pi, 26):
    if np.min(np.abs(angdiff(cb, np.array([0, D(120), D(240)])))) < D(14):
        continue
    if crng.random() < 0.55:
        R_base -= crng.uniform(40, 110) * np.exp(-(angdiff(TH, cb) / D(crng.uniform(0.7, 2.0))) ** 2)
    else:
        R_base += crng.uniform(40, 120) * np.exp(-(angdiff(TH, cb) / D(crng.uniform(0.35, 0.8))) ** 2)
cove = np.zeros_like(TH)
for k, p in PORTS.items():
    depth = 380 if k == 3 else 320
    width = D(6.8) if k == 3 else D(5.6)
    cove = np.maximum(cove, depth * np.exp(-(np.abs(angdiff(TH, p)) / width) ** 4))
R_tab = R_base - cove
R_s_tab = smooth_1d(R_tab, 500, closed=True, passes=3)    # the coast without its small coves, for inland terms
R_nocove_tab = R_base.copy()
PW_tab = port_w(TH)


def lut(tab, th):
    k = (np.asarray(th) % (2 * np.pi)) / (2 * np.pi) * len(TH)
    i = np.floor(k).astype(np.int64) % len(TH); f = (k - np.floor(k)).astype(F32)
    return tab[i] * (1 - f) + tab[(i + 1) % len(TH)] * f


def polar(x, y):
    return np.hypot(x, y), np.arctan2(x, y) % (2 * np.pi)


def pt(r, th):
    return np.array([r * math.sin(th), r * math.cos(th)])


# ---------------------------------------------------------------- height field
def mountain(r, th, X, Y):
    thw = th + 0.15 * P[3](X / 1100, Y / 1100) + 0.04 * P[4](X / 300, Y / 300)
    # a steep summit cone on a broad massif whose foot reaches nearly to the cliff tops
    base = 520 * np.exp(-(r / 900) ** 1.6) + 430 * np.exp(-(r / 2150) ** 2.2)
    c8 = np.cos(8 * (thw - D(22.5)))
    s = 0.5 + 0.5 * c8
    lsp = 2700 + 380 * circ_noise(P[5], thw, 3.0)
    env = np.clip(np.sin(np.pi * np.clip((r - 150) / (lsp - 150), 0, 1)), 0, 1) ** 0.7
    amp = 175 * (1 + 0.6 * circ_noise(P[6], thw, 2.5))
    spur = amp * env * (s ** 1.6 - 0.33)
    gully = np.clip(-c8, 0, 1) ** 3
    card = np.clip(np.cos(4 * thw), 0, 1) ** 4 * gully
    inter = np.clip(-np.cos(4 * thw), 0, 1) ** 4 * gully
    deepen = -60 * card * smoothstep(800, 1700, r) * (1 - smoothstep(2400, 2750, r))
    step = 34 * inter * np.exp(-((r - 2350) / 110) ** 2)
    upper = smoothstep(1800, 500, r)
    crag = fbm(P[7], X, Y, 260, octaves=6, ridged=True)
    crags = 80 * upper * np.clip(crag - 0.32, 0, None) ** 1.3 + 25 * smoothstep(2200, 1200, r) * np.clip(fbm(P[9], X, Y, 90, octaves=4, ridged=True) - 0.55, 0, None) + 30 * inter * np.exp(-((r - 2350) / 170) ** 2) * crag
    rough = 14 * fbm(P[8], X, Y, 700, octaves=5) + 55 * fbm(P[10], X, Y, 1500, octaves=3) * smoothstep(2300, 900, r)
    knolls = 40 * np.clip(fbm(P[6], X, Y, 520, octaves=4, ridged=True) - 0.5, 0, None) * smoothstep(2200, 700, r)
    rough = rough + knolls
    # low hills and hollows on the long lower slopes
    rough = rough + 45 * fbm(P[5], X + 3000, Y - 1700, 420, octaves=4) * smoothstep(1300, 2300, r)
    # an island mountain, broad rather than high: the whole relief at about half the old scale
    mountain.fold_end = fold_end(r, thw, crag, inter)
    return MSCALE * (base + spur + deepen + step + crags + rough)


def fold_end(r, thw, crag, inter):
    """The folds between the camps' gullies end in a crag nobody can climb down: a sheer step, not
    scaled with the mountain, added after the harbour valleys so that none of them wears it away."""
    f = 26 * inter * smoothstep(1650, 1950, r) * (1 - smoothstep(2345, 2362, r))
    f += 8 * inter * np.clip(crag - 0.3, 0, None) * smoothstep(2300, 2360, r) * (1 - smoothstep(2360, 2420, r))
    return f


MSCALE = 0.52


def harbour_valley(r, th, X, Y):
    """Each port lies at the mouth of a short valley at the mountain's foot: its floor climbs
    gently from the waterfront and closes before the folds begin, its sides rise moderately."""
    v = np.full(r.shape, 1e4, F32)
    R = lut(R_tab, th)
    for b in PORTS.values():
        a = angdiff(th, b)
        lat = r * np.abs(np.sin(a)) * (np.abs(a) < np.pi / 2) + 1e4 * (np.abs(a) >= np.pi / 2)
        d = lut(R_tab, np.full(r.shape, b, F32)) - r * np.cos(a)
        lat = np.abs(lat + 70 * fbm(P[1], X + 900, Y, 380, octaves=3))
        dh = d + 120 * fbm(P[2], X, Y + 700, 500, octaves=3)
        floor = 2.0 + 0.055 * np.clip(dh - 40, 0, None) + 0.0009 * np.clip(dh - 600, 0, None) ** 2
        side = 0.0016 * np.clip(lat - 120, 0, None) ** 1.6 + 10 * fbm(P[4], X, Y, 160, octaves=3)
        v = np.minimum(v, floor + side)
    return v


def height_chunk(X, Y):
    r, th = polar(X, Y)
    R = lut(R_tab, th); pw = lut(PW_tab, th)
    d = R - r                                       # metres inland of the shore
    ds = lut(R_s_tab, th) - r                      # the same, from the smoothed coast
    M = mountain(r, th, X, Y)
    # near each harbour the mountain's foot opens into a short valley rising gently from the waterfront
    M = smin(M, harbour_valley(r, th, X, Y), 30) + mountain.fold_end
    ctop = 30 + 16 * fbm(P[9], X, Y, 700, octaves=4) + 10 * circ_noise(P[2], th, 5.0)
    C = ctop + 0.035 * np.clip(ds, 0, None)
    Cp = 2.4 + 0.075 * np.clip(ds - 45, 0, None) + 0.00006 * np.clip(ds - 45, 0, None) ** 2 + 1.5 * fbm(P[10], X, Y, 120, octaves=3)
    C = C * (1 - pw) + np.minimum(C, Cp) * pw
    land = smax(C, M, 55 * (1 - pw) + 4 * pw)
    land += 2.2 * fbm(P[1], X, Y, 45, octaves=4) * (1 - 0.8 * pw)
    # sea floor: shallow sandy bays, reefs off the headlands
    sd = np.clip(-d, 0, None)
    sea = -3.0 - 20 * smoothstep(0, 90, sd) - 28 * smoothstep(70, 700, sd) - 14 * smoothstep(500, 1800, sd)
    bay = pw * (1 - smoothstep(120, 520, sd))
    sea = sea * (1 - 0.45 * bay) + 2.5 * fbm(P[2], X, Y, 160, octaves=4) * (1 - 0.7 * bay)
    head = np.zeros_like(th)
    for hb in (D(60), D(180), D(300), D(30), D(90), D(150), D(210), D(270), D(330)):
        head = np.maximum(head, np.exp(-(angdiff(th, hb) / D(9)) ** 2))
    reef_zone = head * (1 - pw) * smoothstep(0, 20, sd) * (1 - smoothstep(60, 240, sd))
    rf = fbm(P[4], X, Y, 55, octaves=5, ridged=True)
    rocks = np.clip((rf - 0.62) * 4.0, 0, 1) * reef_zone
    sea = sea * (1 - 0.7 * reef_zone) + reef_zone * 0.7 * (-2.5 + 1.5 * rf) + rocks * 3.2
    # shore: cliffs between the ports, gentle shelving beaches in them
    wcl = 9 * (1 - pw) + 38 * pw
    t = smoothstep(-2, wcl, d)
    h = sea * (1 - t) + land * t
    # cliff face texture: undercut notch and fallen blocks at the foot
    return h.astype(F32)


print('height field', N)
for r0, r1, X, Y in g.chunks(384):
    g.H[r0:r1] = height_chunk(X, Y)

H0 = g.H.copy()          # uncarved, for site planning
masks = {k: np.zeros((N, N), F32) for k in ('road', 'built', 'quay', 'sand', 'clearing')}
sites = dict(island='arche', ports={}, buildings=[], camps=[], posts=[], quays=[], piers=[], slipways=[],
             props=[], road=None, crown=None, sundials=[], granary=None, towns={})

# ---------------------------------------------------------------- summit and the crown
top = float(g.sample(0.0, 0.0)) + 2
carve_disc(g, 0, 0, 16, top, fall=26, mask=masks['built'])
sites['crown'] = dict(x=0.0, y=0.0, z=top, wall_r=8.5)

# three slope posts in hollows, well down the slopes on three sides, hidden from one another
for k, (b, rr) in enumerate(((D(68), 390), (D(196), 430), (D(318), 360)), start=2):
    p = pt(rr, b)
    z = float(g.sample(*p)) - 1.6                                   # a flat-floored hollow
    carve_disc(g, p[0], p[1], 4.5, z, fall=5, mask=masks['clearing'], batter=0.6, reach=12)
    sites['posts'].append(dict(n=k, x=p[0], y=p[1], z=z, facing=b))

# ---------------------------------------------------------------- camps at the foot of the four cardinal gullies
for n, b in CAMPS.items():
    # walk down the gully axis to where it opens
    best = None
    for rr in np.arange(2100, 2700, 10):
        p = pt(rr, b)
        z = float(g.sample(*p))
        best = (p[0], p[1], z, rr)
        if z < 60:
            break
    x, y, z, rr = best
    carve_disc(g, x, y, 6, z, fall=10, mask=masks['clearing'])
    sites['camps'].append(dict(n=n, x=x, y=y, z=z, bearing=b, r=rr))

# ---------------------------------------------------------------- the ring road
th = np.linspace(0, 2 * np.pi, 7200, endpoint=False)
R = lut(R_tab, th); Rn = lut(R_nocove_tab, th)
w = port_w(th, D(9), D(22))
r_road = (Rn - 26) * (1 - w) + (R - 18) * w
r_road = smooth_1d(r_road, 12, closed=True)
# in each harbour the road is a straight waterfront street along the front of the house's portico:
# a line square to the harbour's axis, at a fixed distance in from the bay's bottom
for k_, b_ in PORTS.items():
    Rb_ = float(lut(R_tab, b_))
    D_ = Rb_ - 20.5
    dth = angdiff(th, b_)
    straight = D_ / np.maximum(np.cos(dth), 0.2)
    ww = 1 - smoothstep(D(4.5), D(9.0), np.abs(dth))
    r_road = r_road * (1 - ww) + straight * ww
# the road must never cross water: outside the harbours, step it inland wherever a cove or a
# rocky point would put it over the sea, then smooth again
outside = port_w(th, D(9), D(22)) < 0.5
for it in range(80):
    xs_, ys_ = r_road * np.sin(th), r_road * np.cos(th)
    hz = g.sample(xs_, ys_, H0)
    bad = outside & (hz < 6.0)
    if not bad.any():
        break
    grow = smooth_1d(bad.astype(float), 6, closed=True, passes=2) > 0.02   # move a stretch, not one point
    r_road = np.where(grow, r_road - 8.0, r_road)
    r_road = smooth_1d(r_road, 3, closed=True, passes=2)
xs_, ys_ = r_road * np.sin(th), r_road * np.cos(th)
road_water = int((outside & (g.sample(xs_, ys_, H0) < 1.0)).sum())
print('ROAD over water', road_water)
road = np.stack([r_road * np.sin(th), r_road * np.cos(th)], 1)
road = resample_polyline(np.vstack([road, road[:1]]), 3.0)[:-1]
rr, tt = polar(road[:, 0], road[:, 1])
z = g.sample(road[:, 0], road[:, 1]).astype(np.float64)
z = smooth_1d(z, 40, closed=True)
inport = port_w(tt, D(5.5), D(6.0)) > 0.5
fixed = np.where(inport, 2.7, np.nan)
z = grade_limit(np.where(inport, 2.7, z), 3.0, 0.085, fixed)
z = smooth_1d(z, 6, closed=True)
z[inport] = 2.7
road3 = np.column_stack([road, z])
road_closed = np.vstack([road3, road3[:1]])
sites['road'] = road_closed

# ---------------------------------------------------------------- ports: quay, house range, town
def frame(k):
    b = PORTS[k]
    Rb = float(lut(R_tab, b))
    out = np.array([math.sin(b), math.cos(b)]); tan = np.array([math.cos(b), -math.sin(b)])
    return b, Rb, out, tan


def at(k, u, v):
    b, Rb, out, tan = frame(k)
    return out * (Rb - u) + tan * v


def inland(x, y):
    r, th = polar(np.asarray(x), np.asarray(y))
    return lut(R_tab, th) - r


def add_building(kind, k, u, v, w_, d_, z, **kw):
    b, Rb, out, tan = frame(k)
    c = at(k, u, v)
    ang = -b                                   # width axis along the shore tangent
    rec = dict(kind=kind, x=float(c[0]), y=float(c[1]), z=float(z), ang=float(ang), w=float(w_), d=float(d_), port=k)
    rec.update(kw)
    sites['buildings'].append(rec)
    return rec


for k in PORTS:
    b, Rb, out, tan = frame(k)
    sites['ports'][k] = dict(bearing=b, Rb=Rb, x=float(at(k, 0, 0)[0]), y=float(at(k, 0, 0)[1]))
    # waterfront shelf
    carve_rect(g, *at(k, 14, 0), -b, 115, 22, 2.2, fall=22)
    # quay: a stone edge along the bay bottom, and a mole running out into the bay
    qlen = 170 if k == 3 else 130
    sites['quays'].append(dict(port=k, x=float(at(k, 2, 0)[0]), y=float(at(k, 2, 0)[1]), ang=-b, w=qlen, d=16, z=2.3))
    carve_rect(g, *at(k, 2, 0), -b, qlen / 2, 8, 2.1, fall=6, mask=masks['quay'])
    mole_v = 55 if k != 2 else -50
    mlen = 150 if k == 3 else 95
    c = at(k, -mlen / 2, mole_v)
    sites['piers'].append(dict(port=k, x=float(c[0]), y=float(c[1]), ang=-b + math.pi / 2, len=mlen, w=9, z=2.2))
    sv = -95 if k != 2 else 85
    c = at(k, -4, sv)
    sites['slipways'].append(dict(port=k, x=float(c[0]), y=float(c[1]), ang=-b + math.pi / 2, len=30, w=7))
    if k == 3:
        c = at(k, -4, sv - 22)
        sites['slipways'].append(dict(port=k, x=float(c[0]), y=float(c[1]), ang=-b + math.pi / 2, len=30, w=7))
    # the house range on its terrace across the waterfront road, portico on the road's edge
    zr = 3.4
    carve_rect(g, *at(k, 33, 0), -b, 34, 9, zr, fall=5, mask=masks['built'])
    add_building('house_range', k, 33, 0, 62, 15, zr, house=k)
    # town: rows of houses on terraces behind
    town = []
    for row, u0 in enumerate((58, 80, 102, 124, 146, 168)):
        v = -210 + rng.uniform(0, 12)
        u_row = u0 + rng.uniform(-3, 3)
        while v < 210:
            if row == 0 and abs(v) < 40:
                v = 40
            u_row += rng.normal(0, 1.4)                       # rows wander with the ground
            u_row = float(np.clip(u_row, u0 - 6, u0 + 6))
            kind = rng.choice(['court', 'court', 'court', 'small', 'store'] if row < 2 else ['court', 'court', 'small', 'small'])
            if kind == 'court':
                ww, dd = rng.uniform(11, 16), rng.uniform(11, 16)
            elif kind == 'small':
                ww, dd = rng.uniform(6, 10), rng.uniform(6, 9)
            else:
                ww, dd = rng.uniform(18, 28), rng.uniform(8, 10)
            cx = v + ww / 2
            u = u_row + (dd - 14) / 2 * rng.uniform(-1, 1)
            corners = [at(k, u + su * dd / 2, cx + sv_ * ww / 2) for su in (-1, 1) for sv_ in (-1, 1)]
            ok = all(inland(*cc) > 14 for cc in corners)
            cxy = at(k, u, cx)
            zz = float(H0[g.ij(*cxy)])
            density = 1.0 - 0.45 * (abs(v) / 210) ** 2 - 0.08 * row     # thinner toward the edges and uphill
            if ok and 2 < zz < 60 and rng.random() < density:
                zz = round(zz * 2) / 2
                a2 = -b + rng.normal(0, 0.06)
                carve_rect(g, cxy[0], cxy[1], a2, ww / 2 + 0.5, dd / 2 + 0.5, zz, fall=4, mask=masks['built'])
                rec = add_building(kind, k, u, cx, ww, dd, zz, seed=int(rng.integers(1e9)))
                rec['ang'] = float(a2)
                town.append(rec)
            v += ww + rng.uniform(2.6, 6.5) + (rng.uniform(4, 9) if rng.random() < 0.15 else 0)
    sites['towns'][k] = len(town)

# features tied to particular houses
b = PORTS[2]
pr = add_building('press_house', 2, 58, -28, 18, 11, 0, house=2)
pr['z'] = float(round(H0[g.ij(pr['x'], pr['y'])] * 2) / 2)
carve_rect(g, pr['x'], pr['y'], pr['ang'], 10, 6.5, pr['z'], fall=4, mask=masks['built'])
b = PORTS[1]
rec = add_building('customs_seat', 3, 10, 38, 9, 7, 2.4, house=3)

# the rock-cut storehouse beside the road, east of the north town
gb = D(17)
i = int(np.argmin(np.abs(angdiff(tt, gb))))
p, zg = road3[i, :2], road3[i, 2]
r_, t_ = polar(*p)
inward = -np.array([math.sin(t_), math.cos(t_)])
c = p + inward * 9
sites['granary'] = dict(x=float(c[0]), y=float(c[1]), z=float(zg), ang=float(-t_), face=float(t_))
carve_rect(g, c[0], c[1], -t_, 6, 5, zg, fall=1.5, mask=masks['built'])

# sundials on the headlands; the platform on the southern cape
for hb in (D(180), D(60), D(300)):
    i = int(np.argmin(np.abs(angdiff(tt, hb))))
    p = road3[i, :2]
    r_, t_ = polar(*p)
    q = p + np.array([math.sin(t_), math.cos(t_)]) * 22
    zq = float(g.sample(*q))
    carve_disc(g, q[0], q[1], 5 if hb == D(180) else 2.5, zq, fall=4, mask=masks['built'])
    sites['sundials'].append(dict(x=float(q[0]), y=float(q[1]), z=zq, platform=hb == D(180)))

# re-level each building's exact footprint (neighbouring blends overlap)
for b_ in sites['buildings']:
    carve_rect(g, b_['x'], b_['y'], b_['ang'], b_['w'] / 2 + 0.3, b_['d'] / 2 + 0.3, b_['z'], fall=0.6, batter=0.0, reach=0.0)
# road last, so it wins over pads it crosses
carve_road(g, road_closed, 3.2, 9.0, mask=masks['road'])

# ---------------------------------------------------------------- masks
sl = slope_deg(g)
rs, ts = None, None
H = g.H
sand = np.zeros_like(H)
for r0, r1, X, Y in g.chunks(512):
    r, th = polar(X, Y)
    d = lut(R_tab, th) - r
    pw = lut(PW_tab, th)
    sand[r0:r1] = pw * smoothstep(-30, -2, d) * (1 - smoothstep(14, 34, d)) * (sl[r0:r1] < 14)
masks['sand'] = sand * (1 - masks['quay']) * (1 - masks['built'])
masks['rock'] = smoothstep(40, 55, sl)
masks['cliff'] = smoothstep(38, 55, sl) * (H < 140) * (H > -3)
masks['coastrock'] = ((H > -4) & (H < 8)).astype(F32) * (1 - sand) * (1 - masks['quay'])

# ---------------------------------------------------------------- sightline checks
def visible(a, b, eye=1.7, step=None):
    a = np.array(a, float); b = np.array(b, float)
    n = int(np.linalg.norm(b[:2] - a[:2]) / (step or g.px)) + 2
    t = np.linspace(0, 1, n)[1:-1]
    P_ = a[None] + t[:, None] * (b - a)[None]
    terr = g.sample(P_[:, 0], P_[:, 1])
    return bool(np.all(terr < P_[:, 2] - 0.5)), float(np.max(terr - P_[:, 2]))


def eye(rec, h=4.0):
    return (rec['x'], rec['y'], rec['z'] + h)


report = []
hr = [b_ for b_ in sites['buildings'] if b_['kind'] == 'house_range']
for i_ in range(3):
    for j_ in range(i_ + 1, 3):
        v_, m_ = visible(eye(hr[i_], 9), eye(hr[j_], 9))
        report.append(('house', hr[i_]['house'], hr[j_]['house'], v_, round(m_, 1)))
cs = sites['camps']
for i_ in range(4):
    for j_ in range(i_ + 1, 4):
        v_, m_ = visible(eye(cs[i_], 2.5), eye(cs[j_], 2.5))
        report.append(('camp', cs[i_]['n'], cs[j_]['n'], v_, round(m_, 1)))
ps = sites['posts']
for i_ in range(3):
    for j_ in range(i_ + 1, 3):
        v_, m_ = visible(eye(ps[i_], 1.7), eye(ps[j_], 1.7))
        report.append(('post', ps[i_]['n'], ps[j_]['n'], v_, round(m_, 1)))
for r_ in report:
    print('SIGHT', r_)
sites['sightlines'] = report
from roadnet import audit


def rect_fn(x, y, ang, hw, hd):
    c_, s_ = math.cos(ang), math.sin(ang)
    return lambda X, Y: (np.abs((X - x) * c_ + (Y - y) * s_) < hw) & (np.abs(-(X - x) * s_ + (Y - y) * c_) < hd)


fps = [(f"{b_['kind']} at port {b_['port']}", rect_fn(b_['x'], b_['y'], b_['ang'], b_['w'] / 2, b_['d'] / 2)) for b_ in sites['buildings']]
for sd in sites['sundials']:
    fps.append(('sundial', (lambda x0, y0, r0: (lambda X, Y: np.hypot(X - x0, Y - y0) < r0))(sd['x'], sd['y'], 5.3 if sd['platform'] else 0.6)))
gr_ = sites['granary']
fps.append(('rock-cut storehouse', rect_fn(gr_['x'], gr_['y'], gr_['ang'], 3.4, 2.0)))
sites['road_audit'] = audit('arche', [('ring road', road_closed, 'road')], g, fps, gmax_road=0.085)
sites['road_over_water'] = road_water
masks['road'] = masks['road']
save('arche', g, masks, sites)
