"""Mount Phyle's sites: the ruined ring wall on the summit, three slope posts, four camps."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from .scatter import proto_collection
from . import arch

PI = math.pi


def rock_mesh(k, mat, seed, sx=1.0, sy=1.0, sz=1.0, rough=0.12, flat=3.0, n=9):
    """A blocky stone: subdivided cube pushed toward a superellipsoid, with noise."""
    rng = np.random.default_rng(seed)
    V = []; idx = {}
    ph = rng.uniform(0, 6.28, 6)
    Fs = []
    faces = [((1, 0, 0), (0, 1, 0), (0, 0, 1)), ((-1, 0, 0), (0, 0, 1), (0, 1, 0)), ((0, 1, 0), (0, 0, 1), (1, 0, 0)),
             ((0, -1, 0), (1, 0, 0), (0, 0, 1)), ((0, 0, 1), (1, 0, 0), (0, 1, 0)), ((0, 0, -1), (0, 1, 0), (1, 0, 0))]
    lowf = rng.normal(0, 1, (6,))
    for fi, (nrm, a, b) in enumerate(faces):
        nrm, a, b = map(np.array, (nrm, a, b))
        grid = []
        for i in range(n + 1):
            row = []
            for j in range(n + 1):
                p = nrm + a * (2 * i / n - 1) + b * (2 * j / n - 1)
                key = tuple(np.round(p, 5))
                if key not in idx:
                    q = p / (np.sum(np.abs(p) ** flat) ** (1 / flat))
                    w = (np.sin(q @ np.array([2.1, 1.3, 1.7]) * 2 + ph[0]) * 0.08 + np.sin(q @ np.array([-3.7, 4.1, 2.3]) + ph[1]) * 0.05
                         + np.sin(q @ np.array([7.3, -6.1, 5.9]) + ph[2]) * 0.025 + np.sin(q @ np.array([-13.0, 11.0, 14.0]) + ph[3]) * 0.012)
                    q = q * (1 + w * rough / 0.12)
                    idx[key] = len(V); V.append(q * np.array([sx, sy, sz]))
                row.append(idx[key])
            grid.append(row)
        for i in range(n):
            for j in range(n):
                Fs.append((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    k.add(mat, V, Fs)


def build_rock_protos(mats):
    P = {}
    c = proto_collection('p_flag')
    from .protos_arch import slab
    for v in range(1):
        kk = Kit(seed=v)
        slab(kk)
        ob = kk.build('flag', {**mats, 'pave': mats['flagrock']}, c)
    P['flag'] = c
    c = proto_collection('p_cyclo')
    for v in range(8):
        kk = Kit(seed=v)
        rock_mesh(kk, 'wallrock', 100 + v, 1.0, 1.0, 1.0, rough=0.07, flat=4.0)
        kk.build(f'cyclo_{v}', mats, c, smooth=30)
    P['cyclo'] = c
    c = proto_collection('p_rock_small')
    for v in range(6):
        kk = Kit(seed=v)
        rock_mesh(kk, 'wallrock', 200 + v, 1.0, 0.8, 0.6, rough=0.15, flat=2.5)
        kk.build(f'rock_small_{v}', mats, c, smooth=30)
    P['rock_small'] = c
    c = proto_collection('p_crag')
    for v in range(6):
        kk = Kit(seed=v)
        rock_mesh(kk, 'rockface', 300 + v, 1.0, 0.8, 1.1, rough=0.24, flat=3.2)
        kk.build(f'crag_{v}', mats, c, smooth=25)
    P['crag'] = c
    return P


# ------------------------------------------------------------------ the crown
def ring_wall(k, R=8.5, thick=2.4, height=4.4):
    """Polygonal cyclopean ring wall, solid all round: no gate, no gap, no stair; jagged top."""
    rng = k.rng
    for face, r in (('out', R + thick / 2 - 0.5), ('in', R - thick / 2 + 0.5)):
        z = -0.3
        course = 0
        while z < height:
            ch = rng.uniform(0.75, 1.15)
            circ = 2 * PI * r
            a = rng.uniform(0, 2 * PI)
            end = a + 2 * PI
            while a < end:
                L = rng.uniform(1.1, 2.1)
                da = L / r
                am = a + da / 2
                top_course = z + ch > height - 0.9
                if top_course and rng.random() < 0.38:   # the jagged top: some upper stones gone
                    a += da; continue
                hz = ch * rng.uniform(0.85, 1.15)
                m = T(r * math.cos(am), r * math.sin(am), z + hz / 2) @ Rz(am + PI / 2 + rng.normal(0, 0.06)) @ Rx(rng.normal(0, 0.05)) @ S(L * 0.53, 0.75 * rng.uniform(0.9, 1.2), hz * 0.55)
                k.inst('cyclo', m)
                a += da * rng.uniform(0.92, 1.0)
            z += ch * 0.92
            course += 1
    # rubble fill on top of the core, between the faces
    for i in range(160):
        am = rng.uniform(0, 2 * PI); rr = R + rng.uniform(-0.6, 0.6)
        k.inst('rock_small', T(rr * math.cos(am), rr * math.sin(am), height - rng.uniform(0.4, 1.2)) @ Rz(rng.uniform(0, 6)) @ S(rng.uniform(0.25, 0.5)))
    ri_, ro_ = R - thick / 2 + 0.6, R + thick / 2 - 0.6          # hollow core between the faces, so no light leaks through chinks
    k.lathe('wallrock', [(ri_, -0.5), (ro_, -0.5), (ro_, height - 1.0), (ri_, height - 1.0), (ri_, -0.5)], seg=48, caps=False)
    # fallen stones outside the wall
    for i in range(18):
        am = rng.uniform(0, 2 * PI); rr = R + thick / 2 + rng.uniform(0.5, 4.0)
        k.inst('cyclo', T(rr * math.cos(am), rr * math.sin(am), rng.uniform(-0.3, 0.1)) @ Rz(rng.uniform(0, 6)) @ Ry(rng.normal(0, 0.3)) @ S(rng.uniform(0.5, 0.9), rng.uniform(0.4, 0.6), rng.uniform(0.35, 0.5)))


def crown_interior(k, R=8.5, thick=2.4):
    rng = k.rng
    ri = R - thick / 2 - 0.1
    # paved floor: rough flags
    arch_paving_disc(k, ri, 0.06)
    # low stone shelf along the inner face (west side), strongboxes on it
    a0 = PI * 0.85
    for i in range(7):
        a = a0 + i * 0.22
        r = ri - 0.5
        k.bbox('stone', r * math.cos(a), r * math.sin(a), 0.22, 1.0, 0.9, 0.44, a + PI / 2)
    for i in range(5):
        a = a0 + 0.1 + i * 0.28
        r = ri - 0.5
        k.push(T(r * math.cos(a), r * math.sin(a), 0.44) @ Rz(a + PI / 2 + rng.normal(0, 0.1)))
        strongbox(k, 0.8 + 0.2 * (i % 2), 0.5, 0.45)
        k.pop()
    # the timber ladder, drawn up and leant against the inner face
    a = a0 + PI * 0.55
    r = ri - 1.45
    k.push(T(r * math.cos(a), r * math.sin(a), 0.1) @ Rz(a - PI / 2) @ Rx(-0.33))
    for s in (-0.3, 0.3):
        k.beam('timber', (s, 0, 0.0), (s, 0, 4.2), 0.08, 0.1, 0.06)
    for z in np.arange(0.35, 4.0, 0.36):
        k.beam('timber', (-0.32, 0, z), (0.32, 0, z), 0.05, 0.05, 0.05)
    k.pop()


def arch_paving_disc(k, r, z):
    rng = k.rng
    y = -r
    while y < r:
        h = rng.uniform(0.6, 1.0)
        w = math.sqrt(max(0, r * r - (y + h / 2) ** 2))
        x = -w
        while x < w:
            L = rng.uniform(0.6, 1.3)
            if (x + L / 2) ** 2 + (y + h / 2) ** 2 < r * r:
                k.inst('flag', T(x + L / 2, y + h / 2, z + rng.normal(0, 0.015)) @ Rz(rng.normal(0, 0.05)) @ Rx(rng.normal(0, 0.012)) @ S(L - 0.05, h - 0.05, 0.22))
            x += L
        y += h


def strongbox(k, w, d, h):
    k.box('door', -w / 2, -d / 2, 0, w / 2, d / 2, h * 0.75)
    k.box('door', -w / 2 - 0.01, -d / 2 - 0.01, h * 0.75, w / 2 + 0.01, d / 2 + 0.01, h)
    for x in (-w / 2 + 0.08, 0, w / 2 - 0.08):
        k.box('iron', x - 0.025, -d / 2 - 0.02, 0, x + 0.025, d / 2 + 0.02, h + 0.015)
    k.box('iron', -w / 2 - 0.015, -d / 2 - 0.015, h * 0.72, w / 2 + 0.015, d / 2 + 0.015, h * 0.78)
    k.box('iron', -0.06, -d / 2 - 0.035, h * 0.55, 0.06, -d / 2 - 0.015, h * 0.8)


def post(k, facing):
    """A hollow among crags with a rough dry-stone breastwork on its downhill side (local +y downhill)."""
    rng = k.rng
    # crags around the hollow
    for i in range(9):
        a = rng.uniform(-0.6, PI + 0.6) + PI
        r = rng.uniform(3.5, 6.0)
        k.inst('crag', T(r * math.cos(a), r * math.sin(a) - 0.5, rng.uniform(-0.5, 0.3)) @ Rz(rng.uniform(0, 6)) @ S(rng.uniform(1.0, 2.4), rng.uniform(0.9, 1.8), rng.uniform(1.2, 2.6)))
    # the breastwork: uneven, gappy, stones of all sizes
    for i in range(70):
        t = rng.uniform(-1, 1)
        x = 3.2 * t; y = 2.4 + 0.6 * (1 - t * t) + rng.normal(0, 0.2)
        if rng.random() < 0.12:
            continue
        z = rng.choice([0.2, 0.55, 0.85, 1.05]) * (1 - 0.35 * abs(t)) + rng.normal(0, 0.05)
        k.inst('rock_small', T(x, y, z) @ Rz(rng.uniform(0, 6)) @ Rx(rng.normal(0, 0.3)) @ S(rng.uniform(0.3, 0.6)))
    # a flat stone to sit on, the sandglass niche
    k.inst('rock_small', T(0.3, -0.4, 0.15) @ S(0.5, 0.4, 0.25))


# ------------------------------------------------------------------ a camp
def tent(k, L=2.3, W=1.6, H=1.25):
    """A one-man ridge tent of coarse linen: poles, ridge, sagging canvas, guys and pegs."""
    rng = k.rng
    for x in (-L / 2, L / 2):
        k.beam('timber', (x, 0, 0), (x, 0, H + 0.12), 0.05, 0.05, 0.05)
    k.beam('timber', (-L / 2, 0, H), (L / 2, 0, H), 0.04, 0.04)
    nx, ny = 10, 6
    for side in (-1, 1):
        V = []; Fs = []
        for i in range(nx + 1):
            x = -L / 2 + L * i / nx
            for j in range(ny + 1):
                t = j / ny
                y = side * (W / 2) * t
                sag = 0.07 * math.sin(PI * t) * math.sin(PI * i / nx) + rng.normal(0, 0.01)
                z = H * (1 - t) - sag + 0.02
                V.append((x, y + side * 0.0, z))
        for i in range(nx):
            for j in range(ny):
                a = i * (ny + 1) + j
                f = (a, a + ny + 1, a + ny + 2, a + 1)
                Fs.append(f if side > 0 else f[::-1])
        k.add('canvas', V, Fs)
    # back wall closed, front flaps tied open
    k.add('canvas', [(-L / 2, -W / 2, 0), (-L / 2, W / 2, 0), (-L / 2, 0, H)], [(0, 1, 2)])
    for s in (-1, 1):
        k.add('canvas', [(L / 2, 0, H), (L / 2 + 0.25, s * 0.55, 0.15), (L / 2, s * W / 2, 0)], [(0, 1, 2) if s > 0 else (2, 1, 0)])
    for x in (-L / 2, L / 2):
        for s in (-1, 1):
            k.beam('rope', (x, 0, H + 0.08), (x + math.copysign(0.9, x), s * 0.9, 0.02), 0.012, 0.012)
            k.box('timber', x + math.copysign(0.9, x) - 0.02, s * 0.9 - 0.02, -0.05, x + math.copysign(0.9, x) + 0.02, s * 0.9 + 0.02, 0.12)
    for i in range(6):
        x = -L / 2 + L * (i + 0.5) / 6
        for s in (-1, 1):
            k.box('timber', x - 0.015, s * (W / 2 + 0.08) - 0.015, -0.05, x + 0.015, s * (W / 2 + 0.08) + 0.015, 0.08)


def aspis(k):
    """Round hoplite shield, bronze-faced, leant against something (local: face toward -y)."""
    prof = [(0.0, 0.07), (0.3, 0.06), (0.42, 0.03), (0.45, 0.0), (0.47, -0.01), (0.47, -0.03), (0.0, -0.03)]
    k.push(Rx(PI / 2))
    k.lathe('bronze', prof, seg=40)
    k.pop()


def camp(k):
    tent(k)
    # at its mouth: the shield leant against the chest, the basket
    k.push(T(2.0, -0.55, 0))
    k.box('door', -0.4, -0.25, 0, 0.4, 0.25, 0.45)
    k.box('door', -0.42, -0.27, 0.45, 0.42, 0.27, 0.5)
    for x in (-0.3, 0.3):
        k.box('iron', x - 0.02, -0.27, 0, x + 0.02, 0.27, 0.51)
    k.pop()
    k.push(T(2.0, -0.95, 0.47) @ Rz(0.15) @ Rx(-0.35))
    aspis(k)
    k.pop()
    # a covered wicker basket for the birds, lid tied down, carrying loop over the top
    k.push(T(2.0, 0.65, 0) @ Rz(0.4))
    k.lathe('wicker', [(0.0, 0.0), (0.2, 0.0), (0.25, 0.05), (0.28, 0.22), (0.26, 0.36), (0.24, 0.38)], seg=28, caps=True)
    k.lathe('wicker', [(0.27, 0.37), (0.27, 0.4), (0.2, 0.45), (0.08, 0.48), (0.0, 0.485)], seg=28)
    pts = [(0.27 * math.cos(a), 0.0, 0.4 + 0.22 * math.sin(a)) for a in np.linspace(0, PI, 9)]
    for a_, b_ in zip(pts[:-1], pts[1:]):
        k.beam('wicker', a_, b_, 0.03, 0.03)
    k.beam('rope', (-0.27, -0.02, 0.38), (0.27, -0.02, 0.38), 0.012, 0.012)
    k.pop()
