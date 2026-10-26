"""Classical orders and round buildings: Corinthian and Ionic columns, Doric entablatures straight and
curved, conical tiled roofs with lanterns."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from .scatter import proto_collection
from .protos_arch import TILE_W, TILE_L, TILE_EXPOSE, TILE_T
from . import arch

PI = math.pi


# ------------------------------------------------------------------ column prototypes (unit lower diameter)
def attic_base(k, mat, D=1.0):
    r = D / 2
    prof = [(r * 1.42, 0.0), (r * 1.42, 0.12), (r * 1.4, 0.13), (r * 1.36, 0.16), (r * 1.4, 0.2), (r * 1.36, 0.24),
            (r * 1.22, 0.26), (r * 1.14, 0.3), (r * 1.18, 0.33), (r * 1.16, 0.37), (r * 1.08, 0.4), (r * 1.04, 0.43), (r, 0.45), (0, 0.45)]
    k.box(mat, -r * 1.45, -r * 1.45, -0.0, r * 1.45, r * 1.45, 0.02)
    k.lathe(mat, prof, seg=40)
    return 0.45


def acanthus_leaf(k, mat, a0, r0, z0, h, w, lean=0.35, curl=0.25, seed=0):
    """A curved, lobed acanthus leaf rising from radius r0 at angle a0, height h, half-width w."""
    rng = np.random.default_rng(seed)
    nu, nv = 9, 9
    V = []
    for i in range(nu + 1):
        u = i / nu
        width = w * (math.sin(PI * min(u * 1.05, 1.0)) ** 0.55) * (1 - 0.35 * u)
        rr = r0 + lean * h * u ** 2 + (curl * h * max(0, u - 0.75) / 0.25) ** 1.2
        zz = z0 + h * u - curl * h * max(0, u - 0.82) ** 2 * 6
        for j in range(nv + 1):
            v = j / nv * 2 - 1
            lobe = 1 + 0.18 * math.sin(v * 3.5 * PI) * (abs(v) > 0.4)
            ww = width * v * lobe
            cup = 0.06 * h * (1 - v * v) * math.sin(PI * u)
            a = a0 + ww / max(rr, 0.05)
            V.append((math.cos(a) * (rr + cup), math.sin(a) * (rr + cup), zz))
    Fs = []
    for i in range(nu):
        for j in range(nv):
            q = i * (nv + 1) + j
            Fs.append((q, q + 1, q + nv + 2, q + nv + 1))
    k.add(mat, V, Fs)


def corinthian(k, mat='colstone', H=10.0):
    """Corinthian column: Attic base, 24-flute shaft, bell capital with two rows of acanthus,
    helices and corner volutes, concave abacus. Unit lower diameter."""
    zb = attic_base(k, mat)
    cap_h = 1.15
    hs = H - zb - cap_h
    r0, r1 = 0.5, 0.42
    prof = [(r0 + (r1 - r0) * t + 0.01 * math.sin(PI * t), zb + hs * t) for t in np.linspace(0, 1, 15)]
    k.lathe(mat, prof, seg=96, flutes=24, fdepth=0.07, z_flute=(zb + 0.08, zb + hs - 0.08))
    zc = zb + hs
    k.lathe(mat, [(r1 * 1.08, zc - 0.02), (r1 * 1.1, zc + 0.03), (r1 * 1.02, zc + 0.06)], seg=40)   # astragal
    # bell
    bell = [(r1, zc), (r1 * 1.02, zc + 0.4), (r1 * 1.12, zc + 0.8), (r1 * 1.25, zc + cap_h - 0.14)]
    k.lathe(mat, bell, seg=40)
    # two rows of eight leaves
    for row, (hh, rr, off) in enumerate(((0.42, r1 * 1.0, 0.0), (0.7, r1 * 1.0, PI / 8))):
        for i in range(8):
            acanthus_leaf(k, mat, off + 2 * PI * i / 8, rr, zc + 0.02 + row * 0.04, hh, 0.17 - row * 0.02, lean=0.3, curl=0.2, seed=i + row * 10)
    # helices and corner volutes (spiral tubes)
    for i in range(4):
        a = PI / 4 + i * PI / 2
        for side in (-1, 1):
            pts = []
            for t in np.linspace(0, 1, 14):
                rr = r1 * 1.05 + 0.28 * t
                ang = a + side * (0.42 - 0.3 * t)
                z = zc + 0.6 + 0.42 * t
                pts.append((math.cos(ang) * rr, math.sin(ang) * rr, z))
            # the volute curl at the end
            cx, cy, cz = pts[-1]
            for s_ in np.linspace(0, 1.6 * PI, 10):
                rad = 0.07 * (1 - s_ / (2 * PI))
                ang = a + side * (0.12 - 0.0)
                pts.append((cx + math.cos(ang) * rad * math.cos(s_), cy + math.sin(ang) * rad * math.cos(s_), cz - rad * math.sin(s_)))
            for p0, p1 in zip(pts[:-1], pts[1:]):
                k.beam(mat, p0, p1, 0.035, 0.035)
    # concave abacus with a fleuron on each face
    za = zc + cap_h - 0.14
    n = 24
    poly = []
    for i in range(4):
        a0 = i * PI / 2
        for j in range(n // 4):
            t = j / (n // 4)
            ang = a0 + PI / 2 * t
            cr = 0.86 - 0.12 * math.sin(PI * t)
            poly.append((cr * math.cos(ang + PI / 4) * 1.0, cr * math.sin(ang + PI / 4) * 1.0))
    k.prism(mat, poly, za, za + 0.14)
    for i in range(4):
        a = i * PI / 2
        k.push(T(math.cos(a) * 0.76, math.sin(a) * 0.76, za + 0.07) @ Rz(a))
        k.box(mat, -0.04, -0.07, -0.07, 0.06, 0.07, 0.07)
        k.pop()


def ionic(k, mat='colstone', H=9.0):
    zb = attic_base(k, mat)
    cap_h = 0.55
    hs = H - zb - cap_h
    prof = [(0.5 + (0.43 - 0.5) * t + 0.008 * math.sin(PI * t), zb + hs * t) for t in np.linspace(0, 1, 13)]
    k.lathe(mat, prof, seg=96, flutes=24, fdepth=0.07, z_flute=(zb + 0.08, zb + hs - 0.08))
    zc = zb + hs
    k.lathe(mat, [(0.45, zc), (0.5, zc + 0.08), (0.52, zc + 0.16), (0.46, zc + 0.24)], seg=40)   # echinus (egg and dart band)
    for i in range(16):
        a = 2 * PI * i / 16
        k.push(T(math.cos(a) * 0.5, math.sin(a) * 0.5, zc + 0.12))
        k.box(mat, -0.025, -0.025, -0.04, 0.025, 0.025, 0.04)
        k.pop()
    # volute cushion with spirals on both faces
    k.box(mat, -0.62, -0.42, zc + 0.2, 0.62, 0.42, zc + 0.36)
    for sx in (-1, 1):
        for sy in (-1, 1):
            pts = []
            for t in np.linspace(0, 3.2 * PI, 40):
                rad = 0.2 * (1 - t / (3.6 * PI))
                pts.append((sx * (0.5 + rad * math.sin(t) * 0.0) + sx * 0.0, sy * 0.43, 0))
            cx, cz = sx * 0.52, zc + 0.14
            for t0, t1 in zip(np.linspace(0, 3.2 * PI, 40)[:-1], np.linspace(0, 3.2 * PI, 40)[1:]):
                r0_ = 0.19 * (1 - t0 / (3.6 * PI)); r1_ = 0.19 * (1 - t1 / (3.6 * PI))
                p0 = (cx + sx * r0_ * math.cos(t0), sy * 0.43, cz + r0_ * math.sin(t0))
                p1 = (cx + sx * r1_ * math.cos(t1), sy * 0.43, cz + r1_ * math.sin(t1))
                k.beam(mat, p0, p1, 0.03, 0.03)
            k.push(T(cx, sy * 0.42, cz)); k.cyl(mat, 0.19, -0.0, 0.0001, 20); k.pop()
        k.push(T(sx * 0.52, 0, zc + 0.14) @ Rx(PI / 2)); k.cyl(mat, 0.19, -0.42, 0.42, 20); k.pop()
    k.box(mat, -0.6, -0.6, zc + 0.36, 0.6, 0.6, zc + 0.46)


def build_column_protos(mats):
    P = {}
    for name, fn in (('corinthian', corinthian), ('ionic', ionic)):
        c = proto_collection('p_' + name)
        kk = Kit(seed=1)
        fn(kk)
        kk.build(name, mats, c, smooth=40)
        P[name] = c
    return P


# ------------------------------------------------------------------ Doric entablature
def doric_frieze_straight(k, x0, x1, y, z, col_xs, depth=0.8, arch_h=0.55, frieze_h=0.6, corn_h=0.28, mat='ashlar', face=1):
    """Architrave, frieze of triglyphs and metopes, cornice with mutules, along x at y; face=+1 means facing +y."""
    k.box(mat, x0, y - depth / 2, z, x1, y + depth / 2, z + arch_h)
    zt = z + arch_h
    k.box(mat, x0 - 0.02, y - depth / 2 - 0.02, zt, x1 + 0.02, y + depth / 2 + 0.02, zt + 0.06)   # taenia
    zf = zt + 0.06
    k.box(mat, x0, y - depth / 2 + 0.04, zf, x1, y + depth / 2 - 0.04, zf + frieze_h)
    fy = y + face * (depth / 2 - 0.02)
    tri_xs = []
    for a, b in zip(col_xs[:-1], col_xs[1:]):
        tri_xs += [a, (a + b) / 2]
    tri_xs.append(col_xs[-1])
    tw = 0.34
    for x in tri_xs:
        k.box(mat, x - tw / 2, fy - 0.02 * face if face > 0 else fy, zf, x + tw / 2, fy + 0.06 * face if face > 0 else fy - 0.06, zf + frieze_h)
        for g in (-1, 1):   # the glyphs: two grooves
            gx = x + g * tw / 6
            k.box('dark_stone', gx - 0.02, fy + 0.055 * face - 0.006, zf + 0.04, gx + 0.02, fy + 0.062 * face, zf + frieze_h - 0.03)
        # regula and guttae below the taenia
        k.box(mat, x - tw / 2, fy - 0.02, zt - 0.06, x + tw / 2, fy + 0.03 * face, zt)
        for gi in range(6):
            gx = x - tw / 2 + tw * (gi + 0.5) / 6
            k.push(T(gx, fy + 0.01 * face, zt - 0.06)); k.cyl(mat, 0.018, -0.05, 0.0, 8); k.pop()
    zc = zf + frieze_h
    k.box(mat, x0 - 0.35, y - depth / 2 - 0.35 * (face < 0), zc, x1 + 0.35, y + depth / 2 + 0.35 * (face > 0), zc + corn_h)
    for x in tri_xs:   # mutules under the cornice soffit
        k.box(mat, x - 0.17, y + face * (depth / 2 + 0.03), zc - 0.05, x + 0.17, y + face * (depth / 2 + 0.3), zc)
    return zc + corn_h


def doric_ring(k, R, z, n_cols, depth=0.85, arch_h=0.55, frieze_h=0.6, corn_h=0.28, mat='ashlar', start=0.0, paint=False):
    """Curved Doric entablature over a ring of n_cols columns at radius R. With paint, coloured as Greek
    buildings were: triglyphs, regulae and mutules dark blue, the taenia red."""
    blue = 'paint_blue' if paint else mat; red = 'paint_red' if paint else mat
    segs = n_cols * 4
    zt = z + arch_h; zf = zt + 0.06; zc = zf + frieze_h
    for i in range(segs):
        a0 = start + 2 * PI * i / segs; a1 = start + 2 * PI * (i + 1) / segs
        for ring_i, (r_in, r_out, za, zb_) in enumerate(((R - depth / 2, R + depth / 2, z, zt), (R - depth / 2 - 0.02, R + depth / 2 + 0.02, zt, zf),
                                       (R - depth / 2 + 0.04, R + depth / 2 - 0.04, zf, zc), (R - depth / 2 - 0.05, R + depth / 2 + 0.38, zc, zc + corn_h))):
            V = [(r_in * math.cos(a0), r_in * math.sin(a0), za), (r_out * math.cos(a0), r_out * math.sin(a0), za),
                 (r_out * math.cos(a1), r_out * math.sin(a1), za), (r_in * math.cos(a1), r_in * math.sin(a1), za)]
            V += [(x, y, zb_) for x, y, _ in V]
            k.add(red if ring_i == 1 else mat, V, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
    for i in range(n_cols * 2):
        a = start + 2 * PI * i / (n_cols * 2)
        k.push(T(math.cos(a) * (R + depth / 2 - 0.02), math.sin(a) * (R + depth / 2 - 0.02), 0) @ Rz(a - PI / 2))
        tw = 0.34
        k.box(blue, -tw / 2, -0.0, zf, tw / 2, 0.07, zc)
        for g in (-1, 1):
            k.box('dark_stone', g * tw / 6 - 0.02, 0.064, zf + 0.04, g * tw / 6 + 0.02, 0.072, zc - 0.03)
        k.box(blue, -tw / 2, -0.02, zt - 0.06, tw / 2, 0.035, zt)
        for gi in range(6):
            k.push(T(-tw / 2 + tw * (gi + 0.5) / 6, 0.012, zt - 0.06)); k.cyl(mat, 0.018, -0.05, 0.0, 8); k.pop()
        k.box(blue, -0.17, 0.08, zc - 0.05, 0.17, 0.36, zc)
        k.pop()
    return zc + corn_h


# ------------------------------------------------------------------ conical tiled roofs
def cone_tiles(k, r_eave, z_eave, r_top, z_top, antefix=True):
    """Pan and cover tiles in rings on a cone frustum from r_eave/z_eave up to r_top/z_top."""
    rng = k.rng
    L = math.hypot(r_eave - r_top, z_top - z_eave)
    p = math.atan2(z_top - z_eave, r_eave - r_top)
    rows = max(1, int((L - TILE_L) / TILE_EXPOSE) + 1)
    tilt = math.atan(TILE_T / TILE_L) * 1.4
    for j in range(rows):
        s = j * TILE_EXPOSE
        r = r_eave - s * math.cos(p); z = z_eave + s * math.sin(p)
        n = max(6, int(2 * PI * r / TILE_W))
        w = 2 * PI * r / n
        off = rng.uniform(0, 2 * PI)
        if r < r_top + 0.3:
            break
        for i in range(n):
            a = off * 0 + 2 * PI * i / n
            # frame: x tangent, y up-slope, z normal
            m = T(r * math.cos(a), r * math.sin(a), z) @ Rz(a + PI / 2) @ Rx(p) @ T(0, 0, TILE_T)
            k.inst('pan', m @ Rx(-tilt) @ S(w / TILE_W * 1.02, 1, 1))
            a2 = 2 * PI * (i + 0.5) / n
            m2 = T(r * math.cos(a2), r * math.sin(a2), z) @ Rz(a2 + PI / 2) @ Rx(p) @ T(0, 0, TILE_T + 0.03)
            k.inst('cover', m2 @ Rx(-tilt))
            if antefix and j == 0:
                k.inst('antefix', T(r_eave * math.cos(a2), r_eave * math.sin(a2), z_eave + 0.04) @ Rz(a2 + PI / 2) @ Rx(p) @ Rx(-p))
    # boards under the tiles (the cone surface)
    seg = 64
    V = []; Fs = []
    for i in range(seg):
        a0 = 2 * PI * i / seg; a1 = 2 * PI * (i + 1) / seg
        b = len(V)
        V += [(r_eave * math.cos(a0), r_eave * math.sin(a0), z_eave - 0.02), (r_eave * math.cos(a1), r_eave * math.sin(a1), z_eave - 0.02),
              (r_top * math.cos(a1), r_top * math.sin(a1), z_top - 0.02), (r_top * math.cos(a0), r_top * math.sin(a0), z_top - 0.02)]
        Fs.append((b, b + 1, b + 2, b + 3))
    k.add('timber', V, Fs)


def lantern(k, r, z, h=1.3, mat='ashlar'):
    """A small louvred lantern on the roof apex, a little conical cap and a bronze finial."""
    n = 16
    for i in range(n):
        a = 2 * PI * i / n
        k.push(T(r * math.cos(a), r * math.sin(a), z) @ Rz(a))
        if i % 2 == 0:
            k.box(mat, -0.08, -0.1, 0, 0.08, 0.1, h)
        else:
            for zz in np.linspace(0.2, h - 0.2, 3):
                k.push(T(0, 0, zz) @ Ry(0.0) @ Rx(0.5))
                k.box('timber', -r * 0.18, -0.02, -0.06, r * 0.18, 0.02, 0.06)
                k.pop()
        k.pop()
    k.lathe(mat, [(r + 0.15, z + h), (r + 0.15, z + h + 0.12), (0.0, z + h + 0.12)], seg=24)
    k.lathe('tile', [(r + 0.25, z + h + 0.12), (0.12, z + h + 0.55), (0.0, z + h + 0.6)], seg=24)
    fin = [(0.0, 0), (0.08, 0.02), (0.06, 0.12), (0.12, 0.2), (0.15, 0.32), (0.12, 0.45), (0.06, 0.55), (0.02, 0.62), (0.0, 0.66)]
    k.lathe('bronze', [(r_, z + h + 0.58 + zz) for r_, zz in fin], seg=20)
