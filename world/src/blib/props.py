"""Period props as instancing prototypes: amphorae, pithoi, sacks, crates, carts, ships and boats."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from .scatter import proto_collection
from . import mats as M

PI = math.pi


def prop_mats(base):
    m = dict(base)
    m['clay'] = M.pottery('clay_ware', (0.5, 0.28, 0.17, 1), 0.18)
    m['clay_dark'] = M.pottery('clay_dark', (0.42, 0.26, 0.17, 1), 0.12)
    m['burlap'] = M.linen('burlap', (0.36, 0.28, 0.18, 1))
    m['sail'] = M.linen('sail', (0.66, 0.62, 0.52, 1))
    m['rope'] = M.flat('rope', (0.42, 0.35, 0.25, 1), 0.9)
    m['hull_tar'] = M.flat('hull_tar', (0.03, 0.025, 0.02, 1), 0.45)
    m['hull_wood'] = M.timber('hull_wood', 'weathered_planks', (0.66, 0.55, 0.42, 1), 1.5)
    m['eye_white'] = M.flat('eye_white', (0.85, 0.82, 0.75, 1), 0.5)
    m['eye_red'] = M.flat('eye_red', (0.5, 0.08, 0.05, 1), 0.5)
    m['net'] = net_mat()
    return m


def net_mat():
    mm, nt = M.new_mat('net')
    if nt is None:
        return mm
    sep = nt.n('ShaderNodeSeparateXYZ'); nt.link(nt.coords('Object'), sep.inputs[0])
    gx = nt.math('PINGPONG', nt.math('MULTIPLY', sep.outputs['X'], 14.0), 0.5)
    gz = nt.math('PINGPONG', nt.math('MULTIPLY', sep.outputs['Z'], 14.0), 0.5)
    a = nt.math('MAXIMUM', nt.math('LESS_THAN', gx, 0.07), nt.math('LESS_THAN', gz, 0.07))
    M.finish(nt, (0.3, 0.24, 0.17, 1), 0.9, alpha=a)
    return mm


# ------------------------------------------------------------------ pottery
def amphora_profile(kind):
    if kind == 0:    # Rhodian: tall neck, carinated shoulder, spike toe
        return [(0.0, 0.0), (0.03, 0.0), (0.035, 0.06), (0.05, 0.12), (0.13, 0.28), (0.165, 0.42), (0.17, 0.52),
                (0.155, 0.6), (0.09, 0.66), (0.06, 0.7), (0.055, 0.82), (0.06, 0.86), (0.07, 0.88), (0.05, 0.89), (0.0, 0.89)]
    if kind == 1:    # Koan-like, fuller body
        return [(0.0, 0.0), (0.035, 0.0), (0.04, 0.05), (0.09, 0.15), (0.17, 0.3), (0.19, 0.42), (0.18, 0.52),
                (0.12, 0.6), (0.07, 0.64), (0.06, 0.74), (0.065, 0.8), (0.075, 0.82), (0.0, 0.83)]
    return [(0.0, 0.0), (0.04, 0.0), (0.05, 0.08), (0.15, 0.22), (0.2, 0.38), (0.19, 0.5), (0.13, 0.58),       # Knidian
            (0.075, 0.62), (0.065, 0.74), (0.07, 0.78), (0.0, 0.79)]


def amphora(k, kind):
    prof = amphora_profile(kind)
    k.lathe('clay', prof, seg=24)
    top = prof[-2][1]
    # two handles from neck to shoulder
    for s in (-1, 1):
        pts = []
        for i in range(9):
            t = i / 8
            a = PI * 0.5 * t
            x = s * (0.065 + 0.08 * math.sin(a * 1.6))
            z = top - 0.08 - (top - 0.08 - prof[-6][1] + 0.02) * (t ** 1.4)
            pts.append((x, 0, z))
        for a_, b_ in zip(pts[:-1], pts[1:]):
            k.beam('clay', a_, b_, 0.03, 0.022)


def pithos(k):
    prof = [(0.0, 0.0), (0.22, 0.0), (0.3, 0.08), (0.48, 0.35), (0.52, 0.6), (0.5, 0.9), (0.42, 1.15), (0.33, 1.28),
            (0.36, 1.3), (0.37, 1.36), (0.3, 1.38), (0.26, 1.34), (0.0, 1.3)]
    k.lathe('clay_dark', prof, seg=32)
    for z in (0.55, 0.85):    # relief bands
        r = 0.52 if z < 0.7 else 0.5
        k.lathe('clay_dark', [(r, z - 0.02), (r + 0.02, z), (r, z + 0.02)], seg=32)
    k.lathe('door', [(0.0, 1.36), (0.31, 1.36), (0.31, 1.4), (0.0, 1.41)], seg=20)   # wooden lid


def sack(k):
    rng = k.rng
    V = []; Fs = []
    nu, nv = 10, 8
    for i in range(nv + 1):
        v = i / nv
        for j in range(nu):
            a = 2 * PI * j / nu
            r = 0.3 * (0.75 + 0.3 * math.sin(PI * v) ** 0.6) * (1 + rng.normal(0, 0.03))
            z = 0.62 * v
            if i == nv:
                r *= 0.25
            V.append((r * math.cos(a) * 1.15, r * math.sin(a) * 0.85, z * (1 - 0.15 * (v > 0.85))))
    for i in range(nv):
        for j in range(nu):
            a = i * nu + j; b = i * nu + (j + 1) % nu
            Fs.append((a, b, b + nu, a + nu))
    Fs.append(tuple(range(nu - 1, -1, -1)))
    k.add('burlap', V, Fs)
    k.beam('rope', (-0.08, 0, 0.56), (0.08, 0, 0.56), 0.03, 0.03)


def crate(k):
    for z in range(4):
        for side in (-1, 1):
            k.box('door', -0.4, side * 0.3 - 0.012, z * 0.13, 0.4, side * 0.3 + 0.012, z * 0.13 + 0.12)
            k.box('door', side * 0.4 - 0.012, -0.3, z * 0.13, side * 0.4 + 0.012, 0.3, z * 0.13 + 0.12)
    k.box('door', -0.4, -0.3, 0.51, 0.4, 0.3, 0.53)
    for x in (-0.38, 0.38):
        k.box('timber', x - 0.025, -0.33, 0, x + 0.025, 0.33, 0.55)


# ------------------------------------------------------------------ carts
def wheel(k, r=0.55, spokes=8, w=0.09):
    k.push(Rx(PI / 2))
    seg = 28
    for i in range(seg):
        a0 = 2 * PI * i / seg; a1 = 2 * PI * (i + 1) / seg
        k.beam('timber', (r * math.cos(a0), r * math.sin(a0), 0), (r * math.cos(a1), r * math.sin(a1), 0), w, 0.08)
        k.beam('iron', ((r + 0.03) * math.cos(a0), (r + 0.03) * math.sin(a0), 0), ((r + 0.03) * math.cos(a1), (r + 0.03) * math.sin(a1), 0), w * 0.95, 0.02)
    for i in range(spokes):
        a = 2 * PI * i / spokes
        k.beam('timber', (0.08 * math.cos(a), 0.08 * math.sin(a), 0), ((r - 0.03) * math.cos(a), (r - 0.03) * math.sin(a), 0), 0.04, 0.05)
    k.cyl('timber', 0.1, -0.12, 0.12, 12)
    k.pop()


def cart(k, load):
    r = 0.55
    for s in (-1, 1):
        k.push(T(0, s * 0.82, r))
        wheel(k, r)
        k.pop()
    k.beam('timber', (0, -0.95, r), (0, 0.95, r), 0.1, 0.1)
    zb = r + 0.12
    k.box('door', -1.3, -0.68, zb, 1.3, 0.68, zb + 0.06)
    for s in (-1, 1):
        k.beam('timber', (-1.3, s * 0.66, zb + 0.35), (1.3, s * 0.66, zb + 0.35), 0.05, 0.06)
        for x in np.linspace(-1.25, 1.25, 6):
            k.beam('timber', (x, s * 0.66, zb), (x, s * 0.66, zb + 0.36), 0.04, 0.04)
    # draught pole resting on a prop at the front
    k.beam('timber', (1.2, 0, zb - 0.02), (3.8, 0, 0.62), 0.09, 0.1)
    k.beam('timber', (3.4, -0.6, 0.66), (3.4, 0.6, 0.66), 0.08, 0.08)    # yoke bar laid on the pole
    k.beam('timber', (3.75, 0, 0.62), (3.9, 0.0, 0.0), 0.06, 0.06)
    if load == 'amphorae':
        for i, x in enumerate(np.linspace(-1.0, 1.0, 5)):
            for j, y in enumerate((-0.35, 0.0, 0.35)):
                k.push(T(x, y, zb + 0.06) @ Rz(i + j) @ Ry(0.15 * ((i + j) % 2)))
                amphora(k, (i + j) % 2)
                k.pop()
    elif load == 'sacks':
        for i, x in enumerate(np.linspace(-0.95, 0.95, 4)):
            for j, y in enumerate((-0.3, 0.3)):
                k.push(T(x, y, zb + 0.06) @ Rz(i * 1.3 + j) @ Ry(PI / 2 * 0.9) @ T(0, 0, -0.3))
                sack(k)
                k.pop()
        k.beam('rope', (-1.2, -0.66, zb + 0.6), (1.2, 0.66, zb + 0.6), 0.02, 0.02)


def handcart(k):
    for s in (-1, 1):
        k.push(T(0, s * 0.45, 0.35)); wheel(k, 0.35, 6, 0.06); k.pop()
    k.box('door', -0.7, -0.4, 0.45, 0.6, 0.4, 0.5)
    for s in (-1, 1):
        k.box('door', -0.7, s * 0.4 - 0.02, 0.5, 0.6, s * 0.4 + 0.02, 0.75)
        k.beam('timber', (0.5, s * 0.33, 0.5), (1.6, s * 0.3, 0.05), 0.05, 0.05)
    for i in range(3):
        k.push(T(-0.45 + i * 0.35, 0, 0.5) @ Rz(i)); amphora(k, 2); k.pop()


# ------------------------------------------------------------------ ships
def hull(k, L, B, Dp, sheer_rise=0.7, stem_rise=1.0, stern_rise=1.6, deck=True, tar=0.6):
    """Round-bilge carvel hull along +x (bow at +L/2)."""
    nx, ns = 44, 12
    V = []
    xs = np.linspace(-L / 2, L / 2, nx)

    def sec(x):
        u = (x + L / 2) / L
        half = B / 2 * max(0.0, 1 - abs(2 * u - 1) ** 2.4) ** 0.9 + 0.02
        sheer = Dp + sheer_rise * (2 * u - 1) ** 2 + (0.25 * stem_rise * max(0, u - 0.9) / 0.1) + (0.2 * stern_rise * max(0, 0.1 - u) / 0.1)
        keel = -0.1 + 0.6 * max(0, abs(2 * u - 1) - 0.6) / 0.4
        return half, sheer, keel

    for x in xs:
        half, sheer, keel = sec(x)
        for j in range(ns + 1):
            th = PI / 2 * j / ns
            y = half * math.sin(th) ** 0.75
            z = keel + (sheer - keel) * (1 - math.cos(th)) ** 0.9
            V.append((x, y, z))
    Fs = []
    for i in range(nx - 1):
        for j in range(ns):
            a = i * (ns + 1) + j
            Fs.append((a, a + ns + 1, a + ns + 2, a + 1))
    Vm = [(x, -y, z) for x, y, z in V]
    # split faces: below/above the waterline area for tar vs wood
    def add_side(Vs, flip):
        Ft = []; Fw = []
        for f in Fs:
            zc = np.mean([Vs[i][2] for i in f])
            ff = f[::-1] if flip else f
            (Ft if zc < tar else Fw).append(ff)
        k.add('hull_tar', Vs, Ft)
        k.add('hull_wood', Vs, Fw)
    add_side(V, False); add_side(Vm, True)
    # wale along the sheer, stem and stern posts
    for side in (-1, 1):
        pts = []
        for x in xs[1:-1]:
            half, sheer, keel = sec(x)
            pts.append((x, side * (half + 0.03), sheer - 0.12))
        for a_, b_ in zip(pts[:-1], pts[1:]):
            k.beam('hull_tar', a_, b_, 0.09, 0.14)
    h0, s0, k0 = sec(L / 2); h1, s1, k1 = sec(-L / 2)
    k.beam('timber', (L / 2 - 0.1, 0, k0), (L / 2 + 0.25, 0, s0 + stem_rise * 0.6), 0.16, 0.2)
    pts = [(-L / 2 + 0.1 - 0.4 * math.sin(t * PI / 2), 0, k1 + (s1 + stern_rise - k1) * t + 0.3 * math.sin(t * PI)) for t in np.linspace(0, 1, 6)]
    for a_, b_ in zip(pts[:-1], pts[1:]):
        k.beam('timber', a_, b_, 0.16, 0.2)
    # thwarts / deck beams and end decks
    for x in np.linspace(-L / 2 + 1.2, L / 2 - 1.2, int(L / 1.6)):
        half, sheer, keel = sec(x)
        k.beam('timber', (x, -half + 0.05, sheer - 0.3), (x, half - 0.05, sheer - 0.3), 0.12, 0.12)
    if deck:
        for x0_, x1_ in ((L / 2 - L * 0.22, L / 2 - 0.6), (-L / 2 + 0.7, -L / 2 + L * 0.25)):
            xm = (x0_ + x1_) / 2; half, sheer, keel = sec(xm)
            k.box('door', x0_, -half * 0.85, sheer - 0.28, x1_, half * 0.85, sheer - 0.22)
    # painted eyes at the bow
    for side in (-1, 1):
        x = L / 2 - 0.9
        half, sheer, keel = sec(x)
        k.push(T(x, side * (half + 0.035), sheer - 0.42) @ Rz(side * 0.12))
        k.box('eye_white', -0.16, -0.01, -0.08, 0.16, 0.01, 0.08)
        k.box('eye_red', -0.06, side * 0.012 - 0.008, -0.05, 0.06, side * 0.012 + 0.008, 0.05)
        k.pop()
    return sec


def merchantman(k, L=14.0, B=4.4, sail='brailed'):
    sec = hull(k, L, B, 1.5)
    # cargo of amphorae in the hold, layered
    for i, x in enumerate(np.linspace(-L * 0.2, L * 0.22, 9)):
        half, sheer, keel = sec(x)
        for j, y in enumerate(np.linspace(-half + 0.5, half - 0.5, max(2, int(half * 2 / 0.38)))):
            k.push(T(x + 0.1 * (j % 2), y, keel + 0.45) @ Rz(i + j)); amphora(k, (i + j) % 3); k.pop()
    # mast, yard, brailed sail, rigging
    mx = L * 0.06
    half, sheer, keel = sec(mx)
    top = sheer + 9.5
    k.cyl('timber', 0.16, keel + 0.2, top, 12, r1=0.1)
    yz = top - 1.0
    k.beam('timber', (mx + 0.1, -5.2, yz), (mx + 0.1, 5.2, yz + 0.15), 0.14, 0.14)
    if sail == 'brailed':
        for i in range(14):
            y0 = -5.0 + i * 10.0 / 14; y1 = y0 + 10.0 / 14
            k.beam('sail', (mx + 0.15, y0, yz - 0.25), (mx + 0.15, y1, yz - 0.25 - 0.05 * math.sin(i)), 0.32, 0.38, 0.12)
    else:
        nn = 10
        for i in range(nn):
            for j in range(8):
                pass
        V = []; Fs = []
        for i in range(nn + 1):
            for j in range(9):
                y = -4.9 + 9.8 * i / nn; z = yz - 0.2 - 7.0 * j / 8
                bel = 0.9 * math.sin(PI * i / nn) * math.sin(PI * (j + 1) / 10)
                V.append((mx + 0.2 + bel, y, z))
        for i in range(nn):
            for j in range(8):
                a = i * 9 + j
                Fs.append((a, a + 9, a + 10, a + 1))
        k.add('sail', V, Fs)
    for side in (-1, 1):
        for xo in (-0.6, 0.6):
            hh, ss, kk = sec(mx + xo)
            k.beam('rope', (mx + xo, side * (hh - 0.05), ss - 0.1), (mx, side * 0.1, top - 0.3), 0.025, 0.025)
    hb, sb, kb = sec(L / 2 - 0.2); hs, ss_, ks = sec(-L / 2 + 0.5)
    k.beam('rope', (L / 2 - 0.1, 0, sb + 0.5), (mx, 0, top - 0.2), 0.025, 0.025)
    k.beam('rope', (-L / 2 + 0.5, 0, ss_ + 1.0), (mx, 0, top - 0.2), 0.025, 0.025)
    for side in (-1, 1):
        k.beam('rope', (mx, side * 5.0, yz), (mx, side * 0.1, top), 0.018, 0.018)
    # two steering oars on the quarters
    for side in (-1, 1):
        hq, sq, kq = sec(-L / 2 + 1.6)
        k.beam('timber', (-L / 2 + 2.2, side * (hq + 0.25), sq + 0.8), (-L / 2 - 0.8, side * (hq + 0.5), kq - 0.2), 0.12, 0.12)
        k.push(T(-L / 2 - 0.5, side * (hq + 0.48), kq + 0.2) @ Ry(-0.55))
        k.box('timber', -0.08, -0.03, -0.9, 0.08, 0.03, 0.4) if False else k.box('timber', -0.45, -0.03, -0.12, 0.45, 0.03, 0.12)
        k.pop()
    # tiller beam, a little deckhouse aft
    k.box('door', -L / 2 + 1.0, -0.8, ss_ - 0.2, -L / 2 + 2.4, 0.8, ss_ + 0.7)


def rowing_boat(k, L=6.0, B=1.8, oars=2, mast=False, deck=False):
    sec = hull(k, L, B, 0.75, sheer_rise=0.25, stem_rise=0.5, stern_rise=0.6, deck=deck, tar=0.3)
    for i, x in enumerate(np.linspace(-L * 0.25, L * 0.25, oars)):
        half, sheer, keel = sec(x)
        for side in (-1, 1):
            k.beam('timber', (x, side * (half - 0.2), sheer - 0.05), (x - 0.6, side * (half + 2.2), sheer - 0.45), 0.05, 0.05)
            k.push(T(x - 0.6 - 0.15, side * (half + 2.35), sheer - 0.5) @ Rz(side * PI / 2) @ Ry(0.3))
            k.box('timber', -0.08, -0.25, -0.01, 0.08, 0.25, 0.01)
            k.pop()
    if mast:
        half, sheer, keel = sec(L * 0.1)
        k.cyl('timber', 0.07, keel + 0.2, sheer + 4.0, 8, r1=0.05)
        k.beam('timber', (L * 0.1 + 0.05, -1.6, sheer + 3.4), (L * 0.1 + 0.05, 1.6, sheer + 3.5), 0.06, 0.06)
        for i in range(6):
            y0 = -1.5 + i * 0.5
            k.beam('sail', (L * 0.1 + 0.08, y0, sheer + 3.25), (L * 0.1 + 0.08, y0 + 0.5, sheer + 3.25), 0.16, 0.2, 0.1)
    # nets heaped aft
    hh, ss, kk = sec(-L * 0.3)
    k.box('rope', -L * 0.38, -0.4, kk + 0.4, -L * 0.2, 0.4, kk + 0.62)


def ferry(k):
    sec = hull(k, 9.0, 3.0, 0.8, sheer_rise=0.15, stem_rise=0.2, stern_rise=0.3, deck=False, tar=0.35)
    for x in np.linspace(-3, 3, 5):
        half, sheer, keel = sec(x)
        k.box('door', x - 0.15, -half + 0.15, sheer - 0.35, x + 0.15, half - 0.15, sheer - 0.28)
    for side in (-1, 1):
        for x in (-1.5, 1.5):
            half, sheer, keel = sec(x)
            k.beam('timber', (x, side * (half - 0.2), sheer), (x - 0.5, side * (half + 2.4), sheer - 0.5), 0.06, 0.06)
    hb, sb, kb = sec(-4.0)
    k.beam('timber', (-3.6, 0.6, sb + 0.3), (-5.6, 1.0, kb), 0.1, 0.1)


def nets(k):
    """Two posts and a bar with nets hung to dry."""
    for x in (-2.0, 2.0):
        k.beam('timber', (x, 0, 0), (x, 0, 2.1), 0.1, 0.1, 0.05)
    k.beam('timber', (-2.2, 0, 2.05), (2.2, 0, 2.05), 0.08, 0.08)
    V = []; Fs = []
    n = 16
    for i in range(n + 1):
        x = -1.9 + 3.8 * i / n
        sag = 0.25 * math.sin(PI * i / n)
        for j in range(6):
            z = 2.0 - 1.7 * j / 5 + sag * (j / 5)
            V.append((x, 0.05 * math.sin(i * 1.7 + j), z))
    for i in range(n):
        for j in range(5):
            a = i * 6 + j
            Fs.append((a, a + 6, a + 7, a + 1))
    k.add('net', V, Fs)


def build_all(mats):
    P = {}

    def one(name, fn, variants=1, smooth=False):
        c = proto_collection('p_' + name)
        for v in range(variants):
            kk = Kit(seed=v + 11)
            fn(kk, v)
            kk.build(f'{name}_{v}', mats, c, smooth=smooth)
        P[name] = c

    one('amphora', lambda k, v: amphora(k, v), 3, smooth=True)
    one('pithos', lambda k, v: pithos(k), 1, smooth=True)
    one('sack', lambda k, v: sack(k), 2, smooth=True)
    one('crate', lambda k, v: crate(k), 1)
    one('cart', lambda k, v: cart(k, ['amphorae', 'sacks', 'empty'][v]), 3)
    one('handcart', lambda k, v: handcart(k), 1)
    one('merchantman', lambda k, v: merchantman(k, 14.0 + v * 2, 4.4 + v * 0.5), 2)
    one('merchant_sail', lambda k, v: merchantman(k, 13.0, 4.2, sail='set'), 1)
    one('skiff', lambda k, v: rowing_boat(k, 5.5 + v, 1.7, 2 if v else 1, mast=v == 1), 2)
    one('courier_boat', lambda k, v: rowing_boat(k, 9.0, 1.9, 5, mast=True, deck=True), 1)
    one('ferry', lambda k, v: ferry(k), 1)
    one('nets', lambda k, v: nets(k), 1)
    return P
