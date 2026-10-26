"""Prototype meshes for instanced architecture: roof tiles, antefixes, columns, paving slabs, rafters."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, S
from .scatter import proto_collection

TILE_W = 0.52      # pan tile width (across the slope)
TILE_L = 0.62      # pan tile length (along the slope)
TILE_EXPOSE = 0.5  # exposed length per course
TILE_T = 0.025


def _one(name, build, mats, smooth=False):
    c = proto_collection('p_' + name)
    k = Kit()
    build(k)
    k.build(name, mats, c, smooth=smooth)
    return c


def pan(k):
    w, L, t = TILE_W, TILE_L, TILE_T
    k.box('tile', -w / 2, 0, -t, w / 2, L, 0)
    for s in (-1, 1):      # raised side flanges, a little lower toward the top
        V = [(s * w / 2 - (0.035 if s > 0 else 0), 0, 0), (s * w / 2 + (0 if s > 0 else 0.035), 0, 0)]
        x0 = s * w / 2 - 0.035 if s > 0 else -w / 2
        k.add('tile', [(x0, 0, 0), (x0 + 0.035, 0, 0), (x0 + 0.035, L, 0), (x0, L, 0),
                       (x0, 0, 0.045), (x0 + 0.035, 0, 0.045), (x0 + 0.035, L, 0.03), (x0, L, 0.03)],
              [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)])


def cover(k):
    L = TILE_L; w = 0.17; h = 0.075
    prof = [(-w / 2, 0), (-w / 2 + 0.01, 0.035), (-0.035, h), (0.035, h), (w / 2 - 0.01, 0.035), (w / 2, 0)]
    n = len(prof)
    V = [(x, 0, z) for x, z in prof] + [(x * 0.94, L, z * 0.94) for x, z in prof]
    Fs = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n - 1):
        Fs.append((i, i + 1, n + i + 1, n + i))
    k.add('tile', V, Fs)


def ridge(k):
    # half-round ridge tile, axis along x, arching over the ridge line
    r, L, seg = 0.15, 0.6, 12
    V = []; Fs = []
    for i in range(seg + 1):
        a = math.pi * i / seg
        V.append((-L / 2, r * math.cos(a), r * math.sin(a) * 0.8)); V.append((L / 2, r * math.cos(a) * 0.95, r * math.sin(a) * 0.76))
    for i in range(seg):
        a = 2 * i
        Fs.append((a, a + 1, a + 3, a + 2))
    k.add('tile', V, Fs)


def _halfcyl(r, L, seg):
    V = []; Fs = []
    for i in range(seg + 1):
        a = math.pi * i / seg
        V.append((r * math.cos(a), 0, r * math.sin(a))); V.append((r * math.cos(a), -L, r * math.sin(a)))
    for i in range(seg):
        a = 2 * i
        Fs.append((a, a + 2, a + 3, a + 1))
    return V, Fs


def antefix(k):
    """Palmette antefix closing the eave end of a cover-tile row: plaque in x-z plane, facing -y."""
    pts = []
    for i in range(25):
        a = math.pi * i / 24
        r = 0.125 * (1 + 0.12 * math.cos(9 * a))
        pts.append((math.cos(a) * r, 0.09 + math.sin(a) * r * 1.15))
    poly = [(0.09, 0.0)] + pts + [(-0.09, 0.0)]
    n = len(poly)
    V = [(x, 0, z) for x, z in poly] + [(x, 0.03, z) for x, z in poly]
    Fs = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        Fs.append((j, i, n + i, n + j))
    k.add('tile', V, Fs)
    # palmette leaves in low relief, painted dark
    for j in range(7):
        a = math.pi * (j + 0.5) / 7
        cx, cz = math.cos(a) * 0.06, 0.1 + math.sin(a) * 0.075
        k.push(T(cx, -0.006, cz) @ Rx(0) @ _rot_y(-(a - math.pi / 2)))
        k.box('paint', -0.012, 0, -0.035, 0.012, 0.008, 0.035)
        k.pop()
    k.box('paint', -0.03, -0.006, 0.04, 0.03, 0.002, 0.075)


def _rot_y(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, s, -s, c
    return m


def doric_profile(D=1.0, H=6.5, entasis=0.012, top_ratio=0.78, cap_h=0.5):
    """Shaft from 0 to H - cap_h with entasis; capital: necking, echinus, abacus. Units of lower diameter."""
    r0 = D / 2; r1 = r0 * top_ratio; hs = H - cap_h
    prof = []
    for i in range(13):
        t = i / 12
        r = r0 + (r1 - r0) * t + entasis * D * math.sin(math.pi * t)
        prof.append((r, hs * t))
    return prof, hs, r1


def doric(k, fluted, H=6.5):
    prof, hs, r1 = doric_profile(H=H)
    k.lathe('colstone', prof, seg=80 if fluted else 28, flutes=20 if fluted else 0, fdepth=0.06, z_flute=(0.0 if fluted == 'full' else hs * 0.33, hs + 1e-6))
    if fluted == 'lower':
        pass
    # annulets and echinus
    e = [(r1 * 1.0, hs), (r1 * 1.03, hs + 0.04), (r1 * 1.0, hs + 0.06), (r1 * 1.03, hs + 0.1), (r1 * 1.0, hs + 0.12)]
    k.lathe('colstone', e, seg=40)
    ech = []
    for i in range(9):
        t = i / 8
        r = r1 * 1.0 + (0.66 - r1) * (1 - (1 - t) ** 2.2)
        ech.append((r, hs + 0.12 + 0.2 * t))
    k.lathe('colstone', ech, seg=40)
    a = 0.68
    k.box('colstone', -a, -a, hs + 0.32, a, a, hs + 0.5)


def doric_plain(k):
    doric(k, False, 7.0)


def doric_lowerplain(k):
    doric(k, 'lower', 6.6)


def doric_fluted(k):
    doric(k, 'full', 6.2)


def slab(k):
    b = 0.06
    # bevelled unit slab, top at z=0, 1 x 1 x 1
    V = [(-0.5 + b, -0.5 + b, 0), (0.5 - b, -0.5 + b, 0), (0.5 - b, 0.5 - b, 0), (-0.5 + b, 0.5 - b, 0),
         (-0.5, -0.5, -b), (0.5, -0.5, -b), (0.5, 0.5, -b), (-0.5, 0.5, -b),
         (-0.5, -0.5, -1), (0.5, -0.5, -1), (0.5, 0.5, -1), (-0.5, 0.5, -1)]
    Fs = [(0, 1, 2, 3), (4, 5, 1, 0), (5, 6, 2, 1), (6, 7, 3, 2), (7, 4, 0, 3),
          (8, 9, 5, 4), (9, 10, 6, 5), (10, 11, 7, 6), (11, 8, 4, 7), (11, 10, 9, 8)]
    k.add('pave', V, Fs)


def block(k):
    """Bevelled ashlar block, unit cube centred at origin, drafted margins."""
    b = 0.04
    V = []
    Fs = []
    # simple bevelled cube: 8 corners inset on each face
    import itertools
    k.box('ashlar', -0.5 + b, -0.5 + b, -0.5, 0.5 - b, 0.5 - b, 0.5)
    k.box('ashlar', -0.5, -0.5 + b, -0.5 + b, 0.5, 0.5 - b, 0.5 - b)
    k.box('ashlar', -0.5 + b, -0.5, -0.5 + b, 0.5 - b, 0.5, 0.5 - b)


def build_all(mats):
    P = {}
    P['pan'] = _one('pan', pan, mats)
    P['cover'] = _one('cover', cover, mats, smooth=False)
    P['ridge'] = _one('ridge', ridge, mats, smooth=True)
    P['antefix'] = _one('antefix', antefix, mats)
    P['doric_plain'] = _one('doric_plain', doric_plain, mats, smooth=True)
    P['doric_fluted'] = _one('doric_fluted', doric_fluted, mats, smooth=True)
    P['doric_lowerplain'] = _one('doric_lowerplain', doric_lowerplain, mats, smooth=True)
    P['slab'] = _one('slab', slab, mats)
    P['block'] = _one('block', block, mats)
    P['qblock'] = _one('qblock', lambda k: (block(k)), {**mats, 'ashlar': mats['quaystone']})
    return P
