"""Architectural components on the Kit: walls with openings, tiled roofs, porticoes, paving, doors."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from .protos_arch import TILE_W, TILE_L, TILE_EXPOSE, TILE_T

PI = math.pi


def frame(origin, u, up):
    """Matrix whose local x = u, y = up (up-slope), z = normal, at origin."""
    u = np.asarray(u, float); up = np.asarray(up, float)
    u /= np.linalg.norm(u); up /= np.linalg.norm(up)
    n = np.cross(u, up)
    m = np.eye(4); m[:3, 0] = u; m[:3, 1] = up; m[:3, 2] = n; m[:3, 3] = origin
    return m


# ------------------------------------------------------------------ roofs
def tile_field(k, width, length, antefix_low=True, ridge_top=False, pitch=0.3, jitter=1.0, skip_cover=False):
    """Pan and cover tiles on the plane of the current frame: x across (centred), y up-slope from the eave at 0.
    The frame's z must be the roof normal."""
    rng = k.rng
    ncol = max(1, int(round(width / TILE_W)))
    w = width / ncol
    nrow = max(1, int(math.ceil((length - TILE_L) / TILE_EXPOSE)) + 1)
    tilt = math.atan(TILE_T / TILE_L) * 1.4
    for j in range(nrow):
        v = j * TILE_EXPOSE
        for i in range(ncol):
            u = -width / 2 + (i + 0.5) * w
            m = T(u + rng.normal(0, 0.004) * jitter, v + rng.normal(0, 0.006) * jitter, TILE_T) @ Rx(-tilt + rng.normal(0, 0.006) * jitter) @ Rz(rng.normal(0, 0.008) * jitter) @ S(w / TILE_W, 1, 1)
            k.inst('pan', m)
            if not skip_cover and i < ncol - 1:
                uc = -width / 2 + (i + 1) * w
                m = T(uc + rng.normal(0, 0.004), v + rng.normal(0, 0.006), TILE_T + 0.03) @ Rx(-tilt + rng.normal(0, 0.006)) @ Rz(rng.normal(0, 0.01))
                k.inst('cover', m)
    if antefix_low and not skip_cover:
        for i in range(ncol - 1):
            uc = -width / 2 + (i + 1) * w
            k.inst('antefix', T(uc, -0.005, TILE_T + 0.02) @ Rx(-pitch))
    if ridge_top:
        top = (nrow - 1) * TILE_EXPOSE + TILE_L
        n = int(math.ceil(width / 0.58))
        for i in range(n):
            k.inst('ridge', T(-width / 2 + (i + 0.5) * width / n, top - 0.12, TILE_T + 0.02) @ Rz(PI / 2) @ Rz(-PI / 2))


def gable_roof(k, x0, x1, y0, y1, z_eave, pitch_deg=17, over_eave=0.45, over_gable=0.35, front_antefix=True,
               back_antefix=True, rafters=True, gables=True, gable_mat='plaster', wall_t=0.55, bedding=True):
    """Gable roof with ridge along x over the rectangle; the walls stop at z_eave."""
    p = math.radians(pitch_deg)
    yc = (y0 + y1) / 2; half = (y1 - y0) / 2
    rise = half * math.tan(p)
    zr = z_eave + rise
    L = (half + over_eave) / math.cos(p)
    W = (x1 - x0) + 2 * over_gable
    xc = (x0 + x1) / 2
    zl = z_eave - over_eave * math.tan(p)
    for side, ye, ant in ((1, y1 + over_eave, front_antefix), (-1, y0 - over_eave, back_antefix)):
        up = np.array([0, -side * math.cos(p), math.sin(p)])
        u = np.array([1.0, 0, 0]) * (-side)
        m = frame((xc, ye, zl + 0.06), u, up)
        if m[2, 2] < 0:
            m = frame((xc, ye, zl + 0.06), -u, up)
        k.push(m)
        tile_field(k, W, L, antefix_low=ant, ridge_top=False, pitch=p)
        if bedding:   # roof boards / clay bed under the tiles (visible at the eaves)
            k.box('timber', -W / 2, 0.05, -0.07, W / 2, L, -0.01)
        k.pop()
    # ridge
    n = int(math.ceil(W / 0.58))
    for i in range(n):
        k.inst('ridge', T(x0 - over_gable + (i + 0.5) * W / n, yc, zr + 0.07))
    if gables:
        k.gable_prism(gable_mat, x0, x0 + wall_t, y0, y1, z_eave, zr)
        k.gable_prism(gable_mat, x1 - wall_t, x1, y0, y1, z_eave, zr)
        # raking boards along the gable edges
        for xg in (x0 - over_gable, x1 + over_gable - 0.06):
            for side, ye in ((1, y1 + over_eave), (-1, y0 - over_eave)):
                k.beam('timber', (xg + 0.03, ye, zl + 0.02), (xg + 0.03, yc, zr + 0.02), 0.07, 0.22, 0.02)
    if rafters:
        nr = int((x1 - x0) / 0.62)
        for i in range(nr + 1):
            x = x0 + 0.2 + i * ((x1 - x0) - 0.4) / max(1, nr)
            for side, ye in ((1, y1 + over_eave * 0.9), (-1, y0 - over_eave * 0.9)):
                zz = z_eave - (abs(ye - (y1 if side > 0 else y0))) * math.tan(p) - 0.04
                k.beam('timber', (x, ye, zz), (x, (y1 if side > 0 else y0) - side * 0.2, z_eave + 0.2 * math.tan(p) - 0.04), 0.1, 0.12, 0.08)
    return zr


def lean_to(k, x0, x1, y_wall, y_out, z_wall, z_out, over=0.35, beams=True, antefix=True):
    """Lean-to roof from a wall at y_wall (high) down to y_out (low); y_out > y_wall."""
    dz = z_wall - z_out; dy = y_out - y_wall
    p = math.atan2(dz, dy)
    L = math.hypot(dy + over, dz + over * math.tan(p))
    W = x1 - x0
    zl = z_out - over * math.tan(p)
    up = np.array([0, -math.cos(p), math.sin(p)])
    m = frame(((x0 + x1) / 2, y_out + over, zl + 0.06), (-1, 0, 0), up)
    k.push(m)
    tile_field(k, W, L - 0.15, antefix_low=antefix, pitch=p)
    k.box('timber', -W / 2, 0.05, -0.07, W / 2, L - 0.1, -0.01)
    k.pop()
    if beams:
        nr = int(W / 0.62)
        for i in range(nr + 1):
            x = x0 + 0.15 + i * (W - 0.3) / max(1, nr)
            k.beam('timber', (x, y_out + over * 0.9, zl - 0.02), (x, y_wall + 0.05, z_wall - 0.06), 0.11, 0.14, 0.09)
    return p


# ------------------------------------------------------------------ walls
def wall(k, p0, p1, z0, z1, t=0.55, openings=(), socle=0.7, mat='plaster', socle_mat='rubble', lintel=True,
         gable_top=None):
    """A rubble-based plastered wall from p0 to p1 (centreline). openings: dicts with
    at (centre, metres from p0), w, sill (0 for doors), head, kind ('door', 'window', 'gate', 'open'), leaf."""
    p0 = np.asarray(p0, float); p1 = np.asarray(p1, float)
    d = p1 - p0; L = float(np.linalg.norm(d)); a = math.atan2(d[1], d[0])
    k.push(T(p0[0], p0[1], z0) @ Rz(a))
    H = z1 - z0
    ops = sorted(openings, key=lambda o: o['at'])
    xs = 0.0
    so = socle
    for o in ops + [None]:
        xe = L if o is None else o['at'] - o['w'] / 2
        if xe > xs + 1e-3:
            k.box(socle_mat, xs, -t / 2 - 0.03, 0, xe, t / 2 + 0.03, so)
            k.box(mat, xs, -t / 2, so, xe, t / 2, H)
        if o is None:
            break
        ox0, ox1 = o['at'] - o['w'] / 2, o['at'] + o['w'] / 2
        sill, head = o.get('sill', 0.0), o['head']
        if sill > 0:
            k.box(socle_mat, ox0, -t / 2 - 0.03, 0, ox1, t / 2 + 0.03, min(so, sill))
            if sill > so:
                k.box(mat, ox0, -t / 2, so, ox1, t / 2, sill)
            k.box('stone', ox0 - 0.06, -t / 2 - 0.05, sill - 0.08, ox1 + 0.06, t / 2 + 0.05, sill)   # sill stone
        else:
            k.box('stone', ox0 - 0.05, -t / 2 - 0.08, -0.04, ox1 + 0.05, t / 2 + 0.08, 0.06)       # threshold
        top = head + (0.24 if lintel else 0)
        if lintel:
            k.beam('timber', (ox0 - 0.3, 0, head + 0.12), (ox1 + 0.3, 0, head + 0.12), t * 0.98, 0.24, 0.03)
        if top < H:
            k.box(mat, ox0, -t / 2, top, ox1, t / 2, H)
        # jambs and leaves
        kind = o.get('kind', 'door')
        if kind in ('door', 'gate'):
            jw = 0.1
            k.box('timber', ox0, -t / 2, sill, ox0 + jw, t / 2, head)
            k.box('timber', ox1 - jw, -t / 2, sill, ox1, t / 2, head)
            leaf = o.get('leaf', 'closed')
            if leaf == 'closed':
                door_leaf(k, ox0 + jw, ox1 - jw, sill, head, y=o.get('inset', 0.0))
            elif leaf == 'ajar':
                door_leaf(k, ox0 + jw, ox1 - jw, sill, head, y=0.0, open_deg=o.get('deg', 65))
        elif kind == 'window':
            # a timber frame with two upright bars, a shutter set back inside
            k.box('timber', ox0, -0.06, sill, ox1, 0.06, sill + 0.05)
            for bx in np.linspace(ox0 + 0.12, ox1 - 0.12, 2):
                k.box('timber', bx - 0.02, -0.025, sill, bx + 0.02, 0.025, head)
            k.box('dark', ox0, t / 2 - 0.12, sill, ox1, t / 2 - 0.08, head)
        xs = ox1
    k.pop()


def door_leaf(k, x0, x1, z0, z1, y=0.0, open_deg=0):
    """Planked door: vertical boards, two ledges, iron studs. Two leaves if wide."""
    w = x1 - x0
    leaves = 2 if w > 1.6 else 1
    lw = w / leaves
    for li in range(leaves):
        lx0 = x0 + li * lw
        hinge = lx0 if li == 0 else lx0 + lw
        sgn = 1 if li == 0 else -1
        ang = math.radians(open_deg) * sgn
        k.push(T(hinge, y, z0) @ Rz(ang))
        nb = max(2, int(lw / 0.16))
        bw = lw / nb
        for b in range(nb):
            bx = (b * bw) if sgn > 0 else -(b + 1) * bw
            k.box('door', bx + 0.004, -0.03, 0.0, bx + bw - 0.004, 0.03, z1 - z0 - 0.01 * (b % 2))
        x_a, x_b = (0, lw) if sgn > 0 else (-lw, 0)
        for zz in (0.35, (z1 - z0) - 0.45):
            k.box('door', x_a + 0.05, -0.065, zz, x_b - 0.05, -0.03, zz + 0.14)
            for sx in np.linspace(x_a + 0.12, x_b - 0.12, max(2, int(lw / 0.22))):
                k.box('iron', sx - 0.015, -0.08, zz + 0.055, sx + 0.015, -0.06, zz + 0.085)
        if sgn > 0 and leaves == 1 or li == 1:
            # ring handle and lock plate
            hx = x_b - 0.15 if sgn > 0 else x_a + 0.15
            k.box('iron', hx - 0.06, -0.075, (z1 - z0) * 0.48, hx + 0.06, -0.06, (z1 - z0) * 0.48 + 0.16)
        k.pop()


# ------------------------------------------------------------------ paving and steps
def paving(k, x0, y0, x1, y1, z, size=(0.9, 0.6), thick=0.18, jit=0.012, gap=0.012, rows='x'):
    """Irregular flagstones in courses along x."""
    rng = k.rng
    y = y0
    while y < y1 - 0.05:
        rh = min(y1 - y, size[1] * rng.uniform(0.75, 1.3))
        x = x0
        while x < x1 - 0.05:
            sw = min(x1 - x, size[0] * rng.uniform(0.6, 1.5))
            m = T(x + sw / 2, y + rh / 2, z + rng.normal(0, jit)) @ Rz(rng.normal(0, 0.006)) @ Rx(rng.normal(0, 0.004)) @ S(sw - gap, rh - gap, thick)
            k.inst('slab', m)
            x += sw
        y += rh


def steps(k, x0, x1, y_edge, z_top, n, rise=0.18, tread=0.32, direction=1, mat='stone'):
    """n steps down from z_top at y_edge outward along +y*direction."""
    for i in range(n):
        y_a = y_edge + direction * i * tread
        y_b = y_a + direction * tread
        k.box(mat, x0, min(y_a, y_b), z_top - (i + 1) * rise - 0.4, x1, max(y_a, y_b), z_top - i * rise - rise * 0)


def column_row(k, proto, xs, y, z, D, H_units):
    """Instances of a column prototype (unit lower diameter) along x."""
    for x in xs:
        k.inst(proto, T(x, y, z) @ Rz(k.rng.uniform(0, 0.3)) @ S(D))
