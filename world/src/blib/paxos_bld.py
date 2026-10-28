"""Paxos: the Chamber, the Tholos, the oracle at the fork, the libraries, the stoa and festival ground,
the courier landing and the ferry stages. Local frames: z up from floor; for round buildings the door
faces +x."""
import math
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from . import arch, classical as C
from .buildings import text_mesh, arch_mats
from .mountain import rock_mesh

PI = math.pi
NAMES = ['ΟΚΙΟΣ', 'ΛΙΣΚΟΒΙΑ', 'ΚΛΕΩΝ', 'ΜΕΛΙΣΣΑ', 'ΘΗΡΩΝ']


def ring_courses(k, R, t, z0, z1, mat='ashlar', gap_angles=(), course=0.52, block=1.25, drafted=True):
    """An ashlar drum of curved courses, staggered joints; gaps (a0, a1) left open (doorways, windows)."""
    rng = k.rng
    z = z0; c = 0
    while z < z1 - 0.01:
        hz = min(course * (1.35 if c == 0 else 1.0), z1 - z)
        n = max(8, int(2 * PI * R / block))
        off = (c % 2) * PI / n
        for i in range(n):
            a0 = off + 2 * PI * i / n; a1 = off + 2 * PI * (i + 1) / n
            am = (a0 + a1) / 2
            skip = False
            for (g0, g1, gz0, gz1) in gap_angles:
                if (g0 <= am <= g1 or g0 <= am + 2 * PI <= g1 or g0 <= am - 2 * PI <= g1) and gz0 - 0.01 <= z <= gz1:
                    skip = True
            if skip:
                continue
            j = 0.012
            r_in, r_out = R - t / 2, R + t / 2 + rng.normal(0, 0.004)
            aa0, aa1 = a0 + j / R, a1 - j / R
            # joints show on the outer face only; the inner face is continuous so no light leaks through
            V = [(r_in * math.cos(a0), r_in * math.sin(a0), z), (r_out * math.cos(aa0), r_out * math.sin(aa0), z + j),
                 (r_out * math.cos(aa1), r_out * math.sin(aa1), z + j), (r_in * math.cos(a1), r_in * math.sin(a1), z)]
            V += [(r_in * math.cos(a0), r_in * math.sin(a0), z + hz), (r_out * math.cos(aa0), r_out * math.sin(aa0), z + hz - j),
                  (r_out * math.cos(aa1), r_out * math.sin(aa1), z + hz - j), (r_in * math.cos(a1), r_in * math.sin(a1), z + hz)]
            # bow the outer face a touch (drafted margin, raised boss)
            k.add(mat, V, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
        z += hz; c += 1


def epidaurus_floor(k, r_med=0.90, r_sty_in=5.10, r_sty_out=6.10, r_out=9.025, z=1.04, thick=0.20,
                    mat_white='marble_floor', mat_dark='dark_floor', n_sectors=40, n_rings=6):
    """Flush, true-curved interlocking rhomboid (diamond) floor inspired by the Tholos of Epidaurus:
    - Central circular white marble plinth with a delicate recessed ring.
    - Two opposing sets of radial logarithmic spirals originating from the central circular medallion,
      intersecting to form curved diamond/rhomboid tiles that scale proportionally toward the perimeter.
    - True-arc subdivision along smooth circles without faceting.
    - Uniform flush plane at z, eliminating vertical steps between rings, with seam bevels reduced to near-zero (0.5-1mm).
    - Continuous ring of flush rectangular stylobate slabs beneath the Corinthian colonnade.
    - Concentric rings of flush ambulatory aisle slabs running under the drum wall.
    - Strict checkerboard alternation between honed white Pentelic marble and dark bluish-black Eleusinian limestone.
    """
    j = 0.0007   # ~0.7mm seam gap (tight anathyrosis masonry)

    # 1. Central Circular Plinth with Recessed Ring
    r_rec_in = r_med * 0.70
    r_rec_out = r_med * 0.82
    z_rec = z - 0.003
    prof = [
        (0.0, z),
        (r_rec_in, z),
        (r_rec_in, z_rec),
        (r_rec_out, z_rec),
        (r_rec_out, z),
        (r_med - j, z),
        (r_med - j, z - thick),
        (0.0, z - thick)
    ]
    k.lathe(mat_white, prof, seg=128)

    # Continuous level mortar bed underneath the entire floor
    k.lathe('mortar', [(r_out, z - thick - 0.04), (r_out, z - thick + 0.004), (0.0, z - thick + 0.004)], seg=128)

    # 2. Interlocking Rhomboid Logarithmic Spirals
    N = n_sectors
    K = n_rings
    alpha = (r_sty_in / r_med) ** (1.0 / K)
    radii = [r_med * (alpha ** i) for i in range(K + 1)]

    def phi(k_idx, u_idx):
        return (2 * u_idx + k_idx) * (PI / N)

    M = 2  # quad resolution per spiral edge (produces smooth curved arcs)

    # Main diamond tiles in bands 0 to K-2
    for k_idx in range(K - 1):
        rk = radii[k_idx]
        dr = radii[k_idx + 1] - rk
        eps = j / max(dr, 0.05)
        s_vals = np.linspace(eps, 1.0 - eps, M + 1)
        t_vals = np.linspace(eps, 1.0 - eps, M + 1)

        for u in range(N):
            c_phi = phi(k_idx, u)
            mat = mat_dark if (k_idx + u) % 2 else mat_white

            V_top = []
            for j_idx in range(M + 1):
                for i_idx in range(M + 1):
                    s = s_vals[i_idx]; t = t_vals[j_idx]
                    r = rk * (alpha ** (s + t))
                    ang = c_phi + (s - t) * (PI / N)
                    V_top.append((r * math.cos(ang), r * math.sin(ang), z))

            V_bot = [(x, y, z - thick) for x, y, _ in V_top]
            V = V_top + V_bot
            b_off = len(V_top)

            Fs = []
            # Top faces (normal +Z)
            for j_idx in range(M):
                for i_idx in range(M):
                    p00 = j_idx * (M + 1) + i_idx
                    p10 = j_idx * (M + 1) + (i_idx + 1)
                    p11 = (j_idx + 1) * (M + 1) + (i_idx + 1)
                    p01 = (j_idx + 1) * (M + 1) + i_idx
                    Fs.append((p00, p10, p11, p01))
            # Bottom faces (normal -Z)
            for j_idx in range(M):
                for i_idx in range(M):
                    p00 = b_off + j_idx * (M + 1) + i_idx
                    p10 = b_off + j_idx * (M + 1) + (i_idx + 1)
                    p11 = b_off + (j_idx + 1) * (M + 1) + (i_idx + 1)
                    p01 = b_off + (j_idx + 1) * (M + 1) + i_idx
                    Fs.append((p00, p01, p11, p10))
            # 4 Side faces
            for i_idx in range(M):
                Fs.append((i_idx, b_off + i_idx, b_off + i_idx + 1, i_idx + 1))
            for j_idx in range(M):
                t0 = j_idx * (M + 1) + M; t1 = (j_idx + 1) * (M + 1) + M
                Fs.append((t0, b_off + t0, b_off + t1, t1))
            for i_idx in range(M - 1, -1, -1):
                t0 = M * (M + 1) + (i_idx + 1); t1 = M * (M + 1) + i_idx
                Fs.append((t0, b_off + t0, b_off + t1, t1))
            for j_idx in range(M - 1, -1, -1):
                t0 = (j_idx + 1) * (M + 1); t1 = j_idx * (M + 1)
                Fs.append((t0, b_off + t0, b_off + t1, t1))

            k.add(mat, V, Fs)

    # Inner Fillet Tiles at r_med (between band 0 inner tips)
    r0 = radii[0]; r1 = radii[1]
    dr = r1 - r0
    eps_r = j / max(dr, 0.05)
    t_vals = np.linspace(eps_r, 1.0 - eps_r, M + 1)
    s_vals = np.linspace(-1.0, 1.0, M + 1)
    for u in range(N):
        phi_mid = phi(1, u)
        mat = mat_dark if (u + 1) % 2 else mat_white
        V_top = []
        for t in t_vals:
            r = r0 * (alpha ** t)
            w = (1.0 - t) * (PI / N)
            for s in s_vals:
                ang = phi_mid + s * max(0.0, w - j / max(r, 0.5))
                V_top.append((r * math.cos(ang), r * math.sin(ang), z))
        V_bot = [(x, y, z - thick) for x, y, _ in V_top]
        V = V_top + V_bot
        b_off = len(V_top)
        Fs = []
        for row in range(M):
            for col in range(M):
                p00 = row * (M + 1) + col
                p10 = row * (M + 1) + (col + 1)
                p11 = (row + 1) * (M + 1) + (col + 1)
                p01 = (row + 1) * (M + 1) + col
                Fs.append((p00, p10, p11, p01))
                Fs.append((b_off + p00, b_off + p01, b_off + p11, b_off + p10))
        for col in range(M):
            Fs.append((col, b_off + col, b_off + col + 1, col + 1))
        for row in range(M):
            t0 = row * (M + 1) + M; t1 = (row + 1) * (M + 1) + M
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        for col in range(M - 1, -1, -1):
            t0 = M * (M + 1) + (col + 1); t1 = M * (M + 1) + col
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        for row in range(M - 1, -1, -1):
            t0 = (row + 1) * (M + 1); t1 = row * (M + 1)
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        k.add(mat, V, Fs)

    # Outer Fillet Tiles at r_sty_in (between band K-2 outer tips)
    r_prev = radii[K - 1]; r_last = radii[K]
    dr = r_last - r_prev
    eps_r = j / max(dr, 0.05)
    t_vals = np.linspace(eps_r, 1.0 - eps_r, M + 1)
    for u in range(N):
        phi_mid = phi(K - 1, u)
        mat = mat_dark if (K - 1 + u) % 2 else mat_white
        V_top = []
        for t in t_vals:
            r = r_prev * (alpha ** t)
            w = t * (PI / N)
            for s in s_vals:
                ang = phi_mid + s * max(0.0, w - j / max(r, 0.5))
                V_top.append((r * math.cos(ang), r * math.sin(ang), z))
        V_bot = [(x, y, z - thick) for x, y, _ in V_top]
        V = V_top + V_bot
        b_off = len(V_top)
        Fs = []
        for row in range(M):
            for col in range(M):
                p00 = row * (M + 1) + col
                p10 = row * (M + 1) + (col + 1)
                p11 = (row + 1) * (M + 1) + (col + 1)
                p01 = (row + 1) * (M + 1) + col
                Fs.append((p00, p10, p11, p01))
                Fs.append((b_off + p00, b_off + p01, b_off + p11, b_off + p10))
        for col in range(M):
            Fs.append((col, b_off + col, b_off + col + 1, col + 1))
        for row in range(M):
            t0 = row * (M + 1) + M; t1 = (row + 1) * (M + 1) + M
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        for col in range(M - 1, -1, -1):
            t0 = M * (M + 1) + (col + 1); t1 = M * (M + 1) + col
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        for row in range(M - 1, -1, -1):
            t0 = (row + 1) * (M + 1); t1 = row * (M + 1)
            Fs.append((t0, b_off + t0, b_off + t1, t1))
        k.add(mat, V, Fs)

    # 3. Continuous Ring of Flush Rectangular Stylobate Slabs
    n_sty = N
    m_arc = 4
    r0_sty = r_sty_in + j
    r1_sty = r_sty_out - j
    for i in range(n_sty):
        a0 = 2 * PI * i / n_sty + j / r0_sty
        a1 = 2 * PI * (i + 1) / n_sty - j / r0_sty
        V_top = []
        for s in range(m_arc + 1):
            a = a0 + (a1 - a0) * s / m_arc
            V_top.append((r0_sty * math.cos(a), r0_sty * math.sin(a), z))
            V_top.append((r1_sty * math.cos(a), r1_sty * math.sin(a), z))
        V_bot = [(x, y, z - thick) for x, y, _ in V_top]
        V = V_top + V_bot
        b_off = len(V_top)
        Fs = []
        for s in range(m_arc):
            i0, o0, i1, o1 = 2 * s, 2 * s + 1, 2 * s + 2, 2 * s + 3
            Fs.append((i0, o0, o1, i1))
            Fs.append((b_off + i0, b_off + i1, b_off + o1, b_off + o0))
            Fs.append((i0, i1, b_off + i1, b_off + i0))
            Fs.append((o0, b_off + o0, b_off + o1, o1))
        Fs.append((0, b_off, b_off + 1, 1))
        Fs.append((2 * m_arc, 2 * m_arc + 1, b_off + 2 * m_arc + 1, b_off + 2 * m_arc))
        k.add(mat_white, V, Fs)

    # 4. Ambulatory Aisle Flagstone Rings
    n_amb_rings = 4
    w_amb = (r_out - r_sty_out) / n_amb_rings
    for q in range(n_amb_rings):
        ra = r_sty_out + q * w_amb + j
        rb = (r_sty_out + (q + 1) * w_amb - j) if q < n_amb_rings - 1 else r_out
        rm = (ra + rb) / 2
        n_sl = max(12, int(2 * PI * rm / 0.95))
        off = (q % 2) * (PI / n_sl)
        for i in range(n_sl):
            a0 = off + 2 * PI * i / n_sl + j / ra
            a1 = off + 2 * PI * (i + 1) / n_sl - j / ra
            V_top = []
            for s in range(m_arc + 1):
                a = a0 + (a1 - a0) * s / m_arc
                V_top.append((ra * math.cos(a), ra * math.sin(a), z))
                V_top.append((rb * math.cos(a), rb * math.sin(a), z))
            V_bot = [(x, y, z - thick) for x, y, _ in V_top]
            V = V_top + V_bot
            b_off = len(V_top)
            Fs = []
            for s in range(m_arc):
                i0, o0, i1, o1 = 2 * s, 2 * s + 1, 2 * s + 2, 2 * s + 3
                Fs.append((i0, o0, o1, i1))
                Fs.append((b_off + i0, b_off + i1, b_off + o1, b_off + o0))
                Fs.append((i0, i1, b_off + i1, b_off + i0))
                Fs.append((o0, b_off + o0, b_off + o1, o1))
            Fs.append((0, b_off, b_off + 1, 1))
            Fs.append((2 * m_arc, 2 * m_arc + 1, b_off + 2 * m_arc + 1, b_off + 2 * m_arc))
            k.add(mat_white, V, Fs)


def radial_paving(k, r_in, r_out, z, ring=0.85, mat='pave', thick=0.2, alt=None):
    """Concentric courses of tapered flagstones with curved edges, so neighbouring rings meet along an
    even hairline joint; the outermost ring ends exactly at r_out (run it under the wall to close the edge)."""
    rng = k.rng
    j = 0.003                                    # half a joint
    r = max(r_in, 0.0)
    if r < 0.6:
        k.lathe(mat, [(0.6 - j, z - thick), (0.6 - j, z), (0.0, z)], seg=64)
        r = 0.6
    widths = []
    while r_out - r - sum(widths) > 1e-6:
        w = ring * rng.uniform(0.85, 1.15)
        rest = r_out - r - sum(widths) - w
        if rest < 0.5 * ring:                    # too little left for a ring of its own: this one takes it
            w += rest
        widths.append(w)
    for w in widths:
        r0, r1 = r + j, r + w - j
        ring_i = getattr(k, '_ring_i', 0); k._ring_i = ring_i + 1
        m_ = alt if (alt and ring_i % 2) else mat
        n = max(6, int(2 * PI * (r + w / 2) / rng.uniform(0.85, 1.25)))
        off = rng.uniform(0, 2 * PI)
        for i in range(n):
            a0 = off + 2 * PI * i / n + j / r0; a1 = off + 2 * PI * (i + 1) / n - j / r0
            m = max(1, math.ceil((a1 - a0) * r1 / 0.15))      # arc segments, so the edge follows the circle
            zz = z + rng.normal(0, 0.004)
            tl = rng.normal(0, 0.003)
            V = []
            for s in range(m + 1):
                a = a0 + (a1 - a0) * s / m
                V += [(r0 * math.cos(a), r0 * math.sin(a), zz), (r1 * math.cos(a), r1 * math.sin(a), zz + tl * (1 - 2 * s / m))]
            V += [(x, y, z - thick) for x, y, _ in V]
            b = 2 * (m + 1)                       # offset of the bottom copy
            F = []
            for s in range(m):
                i0, o0, i1, o1 = 2 * s, 2 * s + 1, 2 * s + 2, 2 * s + 3
                F += [(i0, o0, o1, i1), (b + i0, b + i1, b + o1, b + o0),          # top, bottom
                      (i0, i1, b + i1, b + i0), (o0, b + o0, b + o1, o1)]          # inner, outer edge
            F += [(0, b, b + 1, 1), (2 * m, 2 * m + 1, b + 2 * m + 1, b + 2 * m)]  # the two ends
            k.add(m_, V, F)
        r += w


def scroll_with_tag(k, x, y, z, ang, L=0.32, r=0.032, tag=True):
    k.push(T(x, y, z) @ Rz(ang) @ Ry(PI / 2))
    k.cyl('papyrus', r, -L / 2, L / 2, 10)
    for s in (-1, 1):
        k.cyl('timber', 0.012, s * L / 2, s * (L / 2 + 0.03), 6)
        k.cyl('timber', 0.02, s * (L / 2 + 0.03), s * (L / 2 + 0.045), 8)
    if tag:
        k.push(T(r * 0.9, 0, L / 2 - 0.02))
        k.box('tagred', -0.004, -0.012, -0.005, 0.03, 0.012, 0.004)
        k.pop()
    k.pop()


# ------------------------------------------------------------------ the Chamber
def chamber(k, statues=True, north=PI / 2):
    """Lamport's Chamber drawn as a rotunda: Doric peristyle outside, ten Corinthian columns inside,
    one doorway with a door that can be locked; no podium, no head of the room."""
    rng = k.rng
    R_drum = 9.3; t_drum = 0.85
    R_col = 11.75; n_col = 20
    steps = [(13.4, 0.0, 0.34), (12.95, 0.34, 0.68), (12.5, 0.68, 1.02)]
    for r, z0, z1 in steps:
        k.lathe('ashlar', [(r, z0 - 0.6), (r, z1), (0.0, z1)], seg=96)
    zs = 1.02
    # step joints as instanced blocks on the steps' faces
    for r, z0, z1 in steps:
        n = int(2 * PI * r / 1.3)
        for i in range(n):
            a = 2 * PI * (i + 0.5 * (r > 13)) / n
            k.inst('block', T((r - 0.02) * math.cos(a), (r - 0.02) * math.sin(a), (z0 + z1) / 2) @ Rz(a) @ S(0.06, 2 * PI * r / n - 0.015, z1 - z0 - 0.015))
    # peristyle: fluted Doric, unbased
    D = 0.74
    Hcol = 6.2 * D
    door_a = 0.0
    for i in range(n_col):
        a = door_a + PI / n_col + 2 * PI * i / n_col
        k.inst('doric_fluted', T(R_col * math.cos(a), R_col * math.sin(a), zs) @ Rz(a) @ S(D))
    ze = zs + Hcol
    ztop = C.doric_ring(k, R_col, ze, n_col, start=door_a + PI / n_col, paint=True)
    # peristyle ceiling beams and the lean-to roof up to the drum
    for i in range(n_col):
        a = door_a + PI / n_col + 2 * PI * i / n_col
        k.beam('ashlar', (R_col * math.cos(a), R_col * math.sin(a), ze + 0.9), ((R_drum + 0.4) * math.cos(a), (R_drum + 0.4) * math.sin(a), ze + 0.9), 0.35, 0.4)
    z_drum_meet = ztop + 1.35
    C.cone_tiles(k, R_col + 0.75, ztop + 0.05, R_drum + t_drum / 2 + 0.05, z_drum_meet, antefix=True)
    # drum: ashlar courses with a doorway facing +x and clerestory windows above the peristyle roof
    z_drum_top = z_drum_meet + 2.6
    door_w, door_h = 2.3, 4.2
    gaps = [(-door_w / 2 / R_drum, door_w / 2 / R_drum, zs, zs + door_h)]
    nwin = 0
    for i in range(nwin):
        a = PI / nwin + 2 * PI * i / nwin
        gaps.append((a - 0.045, a + 0.045, z_drum_meet + 0.5, z_drum_meet + 1.6))
    ring_courses(k, R_drum, t_drum, zs, z_drum_top, 'ashlar', gaps)
    # orthostate base moulding and crowning course
    k.lathe('ashlar', [(R_drum + t_drum / 2 + 0.08, zs), (R_drum + t_drum / 2 + 0.08, zs + 0.18), (R_drum + t_drum / 2, zs + 0.24)], seg=96, caps=False)
    k.lathe('ashlar', [(R_drum + t_drum / 2, z_drum_top), (R_drum + t_drum / 2 + 0.22, z_drum_top + 0.12), (R_drum + t_drum / 2 + 0.22, z_drum_top + 0.3), (R_drum - t_drum / 2, z_drum_top + 0.3)], seg=96, caps=False)
    # the painted meander band round the drum under the roof
    painted_band(k, R_drum + t_drum / 2, z_drum_top - 0.62, z_drum_top - 0.04)
    # door: moulded frame, lintel, two leaves with bronze studs, lock plate and bolt
    k.push(T(R_drum + t_drum / 2, 0, zs) @ Rz(PI / 2))
    for s in (-1, 1):
        k.box('ashlar', s * door_w / 2 - (0.0 if s > 0 else 0.35), -0.08, 0, s * door_w / 2 + (0.35 if s > 0 else 0.0), 0.18, door_h + 0.05)
    k.box('ashlar', -door_w / 2 - 0.5, -0.08, door_h, door_w / 2 + 0.5, 0.2, door_h + 0.55)
    k.box('ashlar', -door_w / 2 - 0.7, -0.1, door_h + 0.55, door_w / 2 + 0.7, 0.32, door_h + 0.75)
    for s in (-1, 1):   # consoles
        k.box('ashlar', s * (door_w / 2 + 0.55) - 0.12, 0.18, door_h + 0.05, s * (door_w / 2 + 0.55) + 0.12, 0.4, door_h + 0.55)
    arch.door_leaf(k, -door_w / 2, door_w / 2, 0.0, door_h, y=-0.45, open_deg=58)
    k.box('bronze', -0.12, -0.53, door_h * 0.45, 0.12, -0.5, door_h * 0.45 + 0.3)
    k.pop()
    # threshold
    k.box('ashlar', R_drum - t_drum / 2, -door_w / 2 - 0.2, zs - 0.1, R_drum + t_drum / 2 + 0.6, door_w / 2 + 0.2, zs + 0.06)
    # window frames: timber grilles
    for i in range(nwin):
        a = PI / nwin + 2 * PI * i / nwin
        k.push(T((R_drum + t_drum / 2 - 0.05) * math.cos(a), (R_drum + t_drum / 2 - 0.05) * math.sin(a), z_drum_meet + 0.5) @ Rz(a))
        for yy in (-0.2, 0.0, 0.2):
            k.box('timber', -0.03, yy - 0.02, 0, 0.03, yy + 0.02, 1.1)
        k.pop()
    # main conical roof and lantern
    z_roof = z_drum_top + 0.3
    apex_r = 1.25
    rise = (R_drum + t_drum / 2 + 0.6 - apex_r) * math.tan(math.radians(23))
    C.cone_tiles(k, R_drum + t_drum / 2 + 0.6, z_roof, apex_r, z_roof + rise, antefix=True)
    C.lantern(k, apex_r - 0.05, z_roof + rise - 0.05)
    # ------------------------------------------------ interior
    R_in = R_drum - t_drum / 2
    Dc = 0.62; Hc = 10.0 * Dc
    R_ic = 5.6
    z_floor = zs + 0.02
    epidaurus_floor(k, r_med=0.90, r_sty_in=5.10, r_sty_out=6.10, r_out=R_in + 0.15, z=z_floor, thick=0.20,
                    mat_white='marble_floor', mat_dark='dark_floor', n_sectors=40, n_rings=6)
    # ten slender Corinthian columns carrying the roof
    for i in range(10):
        a = 2 * PI * (i + 0.5) / 10
        k.inst('corinthian', T(R_ic * math.cos(a), R_ic * math.sin(a), z_floor) @ Rz(a) @ S(Dc))
    zi = z_floor + Hc
    # inner epistyle ring and the radial roof timbers
    for i in range(40):
        a0 = 2 * PI * i / 40; a1 = 2 * PI * (i + 1) / 40
        k.beam('ashlar', (R_ic * math.cos(a0), R_ic * math.sin(a0), zi + 0.3), (R_ic * math.cos(a1), R_ic * math.sin(a1), zi + 0.3), 0.6, 0.6)
    for i in range(30):
        a = 2 * PI * i / 30
        k.beam('timber', ((R_ic - 0.1) * math.cos(a), (R_ic - 0.1) * math.sin(a), zi + 0.75), ((R_in + 0.1) * math.cos(a), (R_in + 0.1) * math.sin(a), z_roof - 0.15), 0.18, 0.26, 0.05)
        k.beam('timber', ((R_ic - 0.1) * math.cos(a), (R_ic - 0.1) * math.sin(a), zi + 0.75), ((apex_r + 0.05) * math.cos(a), (apex_r + 0.05) * math.sin(a), z_roof + rise - 0.3), 0.16, 0.24, 0.05)
    # benches round the wall, each with a small stone stand beside it holding an inkpot and a closed scroll
    # with its tag: Greeks wrote with the roll on their knees, not at desks
    nb = 22
    for i in range(nb):
        a = 2 * PI * (i + 0.5) / nb
        if abs(math.atan2(math.sin(a), math.cos(a))) < 0.32:
            continue
        rb = R_in - 0.45
        k.push(T(rb * math.cos(a), rb * math.sin(a), zs + 0.13) @ Rz(a + PI / 2))
        k.box('ashlar', -0.95, -0.25, 0, 0.95, 0.25, 0.45)
        k.box('ashlar', -1.0, -0.28, 0.45, 1.0, 0.3, 0.52)
        for sx in (-0.65, 0.65):
            k.box('ashlar', sx - 0.12, -0.22, 0.0, sx + 0.12, 0.2, 0.45)
        # the stand at the bench's end
        k.box('ashlar', 1.05, -0.2, 0.0, 1.4, 0.2, 0.62)
        k.push(T(1.32, -0.08, 0.62)); k.lathe('clay_dark', [(0.0, 0), (0.04, 0.0), (0.045, 0.04), (0.025, 0.06), (0.0, 0.06)], seg=12); k.pop()
        scroll_with_tag(k, 1.17, 0.06, 0.66, 0.1)
        k.pop()
    # the messengers' plain wooden bench beside the doorway, inside
    for s in (-1, 1):
        k.push(T(R_in - 0.4, s * 2.2, zs + 0.13) @ Rz(PI / 2))
        k.box('door', -0.7, -0.18, 0.4, 0.7, 0.18, 0.46)
        for sx in (-0.6, 0.6):
            k.box('door', sx - 0.04, -0.15, 0.0, sx + 0.04, 0.15, 0.4)
        k.pop()
    return dict(zs=zs, R_drum=R_drum, z_roof=z_roof, apex=z_roof + rise)


def pedestal(k, x, y, z, h=1.7, face=0.0, fallen=False, statue=None):
    k.push(T(x, y, z) @ Rz(face))
    k.box('ashlar', -0.7, -0.7, -0.3, 0.7, 0.7, 0.2)
    k.box('ashlar', -0.55, -0.55, 0.2, 0.55, 0.55, h - 0.25)
    k.box('ashlar', -0.62, -0.62, h - 0.25, 0.62, 0.62, h)
    k.pop()
    if statue and not fallen:
        k.inst(statue, T(x, y, z + h) @ Rz(face + PI))
    elif statue:
        k.inst(statue, T(x + 2.6 * math.cos(face), y + 2.6 * math.sin(face), z + 0.35) @ Rz(face + 0.4) @ Ry(PI / 2 - 0.08) @ T(0, 0, -0.9))


# ------------------------------------------------------------------ the Tholos of Schedia
def painted_band(k, R, z0, z1, keys=True, n=None):
    """A painted band on a drum of radius R between z0 and z1: red borders and, between them, a running
    meander (Greek key) in dark blue on the stone, as Greek buildings were painted."""
    s = 0.055
    for za, zb in ((z0, z0 + s), (z1 - s, z1)):
        k.lathe('paint_red', [(R + 0.006, za), (R + 0.006, zb)], seg=128, caps=False)
    if not keys:
        k.lathe('paint_blue', [(R + 0.006, (z0 + z1) / 2 - s * 0.6), (R + 0.006, (z0 + z1) / 2 + s * 0.6)], seg=128, caps=False)
        return
    b0 = z0 + s + 0.02; b1 = z1 - s - 0.02; hb = b1 - b0; st = hb * 0.17
    n = n or int(2 * PI * R / (hb * 1.25))
    w = 2 * PI * R / n
    for i in range(n):
        a = 2 * PI * i / n
        k.push(T(R * math.cos(a), R * math.sin(a), 0) @ Rz(a - PI / 2))          # local x along the drum, y outward
        for (x0, x1, za, zb) in ((0, st, b0, b1), (0, w * 0.78, b1 - st, b1), (w * 0.78 - st, w * 0.78, b0 + hb * 0.38, b1),
                                 (w * 0.36, w * 0.78, b0 + hb * 0.38, b0 + hb * 0.38 + st), (0, w, b0, b0 + st)):
            k.box('paint_blue', x0 - w / 2, -0.004, za, x1 - w / 2, 0.012, zb)
        k.pop()


def tholos(k):
    """A plain round hall of honey limestone, no colonnade outside, porch at its one door (facing +x);
    six columns inside; five named benches with wax tablets; the podium at the centre."""
    R = 8.6; t = 0.8; zs = 0.5
    k.lathe('honey', [(R + 0.9, -0.6), (R + 0.9, zs), (0.0, zs)], seg=96)
    door_w, door_h = 2.0, 3.6
    H = 6.4
    ring_courses(k, R, t, zs, zs + H, 'honey', [(-door_w / 2 / R, door_w / 2 / R, zs, zs + door_h)], course=0.48, block=1.1)
    k.lathe('honey', [(R + t / 2, zs + H), (R + t / 2 + 0.25, zs + H + 0.15), (R + t / 2 + 0.25, zs + H + 0.32), (R - t / 2, zs + H + 0.32)], seg=96, caps=False)
    zr = zs + H + 0.32
    painted_band(k, R + t / 2, zs + H - 0.42, zs + H - 0.04, keys=False)        # a single painted band under the eaves
    apex_r = 1.0
    rise = (R + t / 2 + 0.6 - apex_r) * math.tan(math.radians(18))
    C.cone_tiles(k, R + t / 2 + 0.6, zr, apex_r, zr + rise, antefix=True)
    C.lantern(k, apex_r - 0.05, zr + rise - 0.05, h=1.0, mat='honey')
    # porch: two columns in front of the door under a small gable
    px0 = R + t / 2 - 0.2; px1 = R + 3.6
    k.box('honey', px0, -2.6, zs - 0.5, px1 + 0.4, 2.6, zs)
    for s in (-1, 1):
        k.inst('doric_plain', T(px1 - 0.3, s * 1.7, zs) @ S(0.5))
    zb = zs + 7.0 * 0.5
    k.push(Rz(PI / 2))
    k.box('honey', -2.3, -px1, zb, 2.3, -px0, zb + 0.45)
    arch.gable_roof(k, -2.5, 2.5, -px1 - 0.1, -px0, zb + 0.45, 18, over_eave=0.3, over_gable=0.25, rafters=False, gable_mat='honey', wall_t=0.4) if False else None
    k.pop()
    k.push(T(0, 0, 0))
    # small gable roof over the porch running out along +x
    k.push(Rz(-PI / 2))
    arch.gable_roof(k, -2.7, 2.7, px0 - 0.2 - 0, px1 + 0.3, zb + 0.45, 18, over_eave=0.3, over_gable=0.3, rafters=False, gable_mat='honey', wall_t=0.35) if False else None
    k.pop()
    k.pop()
    _porch_roof(k, px0, px1, zb + 0.45)
    # door
    k.push(T(R + t / 2, 0, zs) @ Rz(PI / 2))
    arch.door_leaf(k, -door_w / 2, door_w / 2, 0.0, door_h, y=-0.42, open_deg=62)
    k.box('honey', -door_w / 2 - 0.3, -0.05, door_h, door_w / 2 + 0.3, 0.12, door_h + 0.4)
    k.pop()
    # interior
    Rin = R - t / 2
    k.lathe('mortar', [(Rin, zs - 0.2), (Rin, zs + 0.085), (0.0, zs + 0.085)], seg=64)
    radial_paving(k, 1.5, Rin + 0.15, zs + 0.1, ring=0.9, mat='pave_honey')     # from the podium's foot to under the wall
    for i in range(6):
        a = 2 * PI * (i + 0.5) / 6
        k.inst('doric_plain', T(4.6 * math.cos(a), 4.6 * math.sin(a), zs + 0.1) @ Rz(a) @ S(0.6))
    zi = zs + 0.1 + 7.0 * 0.6
    for i in range(6):
        a0 = 2 * PI * (i + 0.5) / 6; a1 = 2 * PI * (i + 1.5) / 6
        k.beam('timber', (4.6 * math.cos(a0), 4.6 * math.sin(a0), zi + 0.2), (4.6 * math.cos(a1), 4.6 * math.sin(a1), zi + 0.2), 0.4, 0.4)
    for i in range(24):
        a = 2 * PI * i / 24
        k.beam('timber', (4.5 * math.cos(a), 4.5 * math.sin(a), zi + 0.45), (Rin * math.cos(a), Rin * math.sin(a), zr - 0.12), 0.16, 0.22, 0.05)
        k.beam('timber', (4.5 * math.cos(a), 4.5 * math.sin(a), zi + 0.45), (apex_r * math.cos(a), apex_r * math.sin(a), zr + rise - 0.25), 0.15, 0.2, 0.05)
    # five benches with backs, a stand of wax tablets at each, names cut in the stone; spaced evenly
    # with the door (angle 0) halfway between two of them
    for i in range(5):
        a = 2 * PI * (i + 1.5) / 5
        rb = Rin - 0.55
        k.push(T(rb * math.cos(a), rb * math.sin(a), zs + 0.1) @ Rz(a - PI / 2))     # local +y toward the wall
        k.box('marble', -1.1, -0.28, 0, 1.1, 0.3, 0.46)
        k.box('marble', -1.15, 0.22, 0.46, 1.15, 0.36, 1.25)
        k.box('marble', -1.2, -0.3, 0.46, -1.08, 0.36, 0.8)
        k.box('marble', 1.08, -0.3, 0.46, 1.2, 0.36, 0.8)
        text_mesh(k, 'dark_stone', NAMES[i], 0.11, 0.0, 0.215, 1.06, rot=(PI / 2, 0, 0), depth=0.003)
        text_mesh(k, 'dark_stone', ['Η', 'Ζ', 'Η', 'Ε', 'Ζ'][i], 0.09, 0.0, 0.215, 0.88, rot=(PI / 2, 0, 0), depth=0.003)
        # stone stand with a stack of hinged wax tablets
        k.box('marble', 1.4, -0.35, 0, 1.75, -0.05, 0.75)
        for j in range(4):
            k.push(T(1.575, -0.2, 0.75 + j * 0.035) @ Rz(0.04 * j))
            k.box('board', -0.14, -0.1, 0, 0.14, 0.1, 0.03)
            k.box('wax', -0.12, -0.08, 0.029, 0.12, 0.08, 0.034)
            k.pop()
        k.pop()
    # the podium: round, two steps, a single stone seat and a small table, a board on a post for a number
    k.lathe('marble', [(1.5, zs), (1.5, zs + 0.28), (1.15, zs + 0.28), (1.15, zs + 0.56), (0.0, zs + 0.56)], seg=48)
    zp = zs + 0.56
    k.box('marble', -0.35, -0.3, zp, 0.25, 0.3, zp + 0.45)
    k.box('marble', -0.45, -0.32, zp + 0.45, -0.32, 0.32, zp + 1.0)
    k.box('timber', 0.35, -0.4, zp + 0.72, 0.85, 0.4, zp + 0.76)
    for sx in (0.38, 0.82):
        for sy in (-0.36, 0.36):
            k.box('timber', sx - 0.025, sy - 0.025, zp, sx + 0.025, sy + 0.025, zp + 0.72)
    k.push(T(0.6, 0.1, zp + 0.76) @ Rz(0.3))
    k.box('board', -0.13, -0.09, 0, 0.13, 0.09, 0.028)
    k.box('wax', -0.11, -0.07, 0.027, 0.11, 0.07, 0.032)
    k.pop()
    k.box('timber', 0.95, 0.55, zp, 1.0, 0.6, zp + 1.7)
    k.box('board_paint', 0.85, 0.54, zp + 1.25, 1.1, 0.62, zp + 1.65)
    text_mesh(k, 'red', 'Ζ', 0.22, 0.975, 0.625, zp + 1.45, rot=(PI / 2, 0, 0), depth=0.002)
    return dict(zs=zs, R=R, zr=zr, apex=zr + rise)


def _porch_roof(k, x0, x1, z):
    """Small gable over the porch, ridge along x (out from the door)."""
    p = math.radians(18)
    w = 2.9
    rise = w * math.tan(p)
    for side in (1, -1):
        up = np.array([0, -side * math.cos(p), math.sin(p)])
        u = np.array([1.0, 0, 0]) * (-side)
        m = arch.frame(((x0 + x1) / 2, side * (w + 0.3), z - 0.3 * math.tan(p) + 0.06), u, up)
        if m[2, 2] < 0:
            m = arch.frame(((x0 + x1) / 2, side * (w + 0.3), z - 0.3 * math.tan(p) + 0.06), -u, up)
        k.push(m)
        arch.tile_field(k, x1 - x0 + 0.6, (w + 0.3) / math.cos(p), antefix_low=True, pitch=p)
        k.pop()
    k.add('honey', [(x1 + 0.3, -w, z), (x1 + 0.3, w, z), (x1 + 0.3, 0, z + rise)], [(0, 1, 2)])
    k.add('honey', [(x1 + 0.1, -w, z), (x1 + 0.1, w, z), (x1 + 0.1, 0, z + rise)], [(2, 1, 0)])
    k.beam('honey', (x1 + 0.2, -w - 0.2, z - 0.05), (x1 + 0.2, 0, z + rise + 0.05), 0.3, 0.22)
    k.beam('honey', (x1 + 0.2, w + 0.2, z - 0.05), (x1 + 0.2, 0, z + rise + 0.05), 0.3, 0.22)
    for i in range(int((x1 - x0) / 0.58) + 1):
        k.inst('ridge', T(x0 + 0.29 + i * 0.58, 0, z + rise + 0.05))


# ------------------------------------------------------------------ the oracle at the fork
def tripod(k):
    """A bronze cauldron on a tripod, as ringed the oak at Dodona."""
    for i in range(3):
        a = 2 * PI * i / 3
        k.beam('bronze', (0.45 * math.cos(a), 0.45 * math.sin(a), 0), (0.3 * math.cos(a), 0.3 * math.sin(a), 1.1), 0.05, 0.05)
    k.lathe('bronze', [(0.0, 0.85), (0.25, 0.9), (0.42, 1.05), (0.46, 1.25), (0.44, 1.3), (0.4, 1.28)], seg=24)
    for i in range(2):
        a = PI * i
        k.push(T(0.42 * math.cos(a), 0.42 * math.sin(a), 1.4) @ Rz(a) @ Rx(PI / 2))
        k.cyl('bronze', 0.12, -0.015, 0.015, 16)
        k.pop()


def oracle(k):
    """Low rough wall round the oak; small distyle temple and altar beside it; north and south gates.
    Local +y is north."""
    rng = k.rng
    W, Dp = 58.0, 72.0
    # the low enclosure wall of rough limestone, with two gateways
    def wall_run(p0, p1, gap=None):
        p0 = np.array(p0, float); p1 = np.array(p1, float)
        L = np.linalg.norm(p1 - p0); d = (p1 - p0) / L
        x = 0.0
        while x < L:
            l = rng.uniform(0.5, 1.1)
            c = p0 + d * (x + l / 2)
            if gap is None or abs(x + l / 2 - gap) > 2.2:
                for zz in (0.25, 0.65, 1.0):
                    k.inst('rock_small', T(c[0] + rng.normal(0, 0.05), c[1] + rng.normal(0, 0.05), zz) @ Rz(math.atan2(d[1], d[0]) + rng.normal(0, 0.2)) @ S(l * 0.55, 0.4, 0.24))
            x += l
    # an irregular oval, gates where it crosses the north-south axis
    pts = []
    for i in range(36):
        a = 2 * PI * i / 36
        rr = 1.0 + 0.07 * math.sin(3 * a + 0.7) + 0.05 * math.sin(5 * a + 2.1)
        pts.append((W / 2 * rr * math.cos(a), Dp / 2 * rr * math.sin(a)))
    for i in range(36):
        a0, a1 = pts[i], pts[(i + 1) % 36]
        mid_a = 2 * PI * (i + 0.5) / 36
        if abs(math.sin(mid_a) - 1) < 0.004 or abs(math.sin(mid_a) + 1) < 0.004:
            continue
        near_gate = abs(math.cos(mid_a)) < 0.09
        if near_gate:
            continue
        wall_run(a0, a1)
    def rr_at(a):
        return 1.0 + 0.07 * math.sin(3 * a + 0.7) + 0.05 * math.sin(5 * a + 2.1)
    for y in (-Dp / 2 * rr_at(-PI / 2), Dp / 2 * rr_at(PI / 2)):
        for s in (-1, 1):
            k.box('ashlar', s * 2.0 - 0.3, y - 0.35, -0.2, s * 2.0 + 0.3, y + 0.35, 2.6)
        k.beam('timber', (-2.4, y, 2.75), (2.4, y, 2.75), 0.35, 0.3)
        k.box('ashlar', -1.8, y - 0.4, -0.1, 1.8, y + 0.4, 0.08)
    # flags round the oak and the temple; beaten earth elsewhere
    arch.paving(k, -9, 2, 9, 8, 0.05, size=(1.0, 0.8))
    # the small temple: two Doric columns between projecting side walls (in antis), facing the oak (east side -> facing -x)
    tx, ty = 15.0, 2.0
    k.push(T(tx, ty, 0) @ Rz(PI))
    for i, (w2, d2) in enumerate(((5.0, 7.6), (4.6, 7.2), (4.2, 6.8))):
        k.box('ashlar', -d2 / 2, -w2, i * 0.3 - 0.4, d2 / 2, w2, (i + 1) * 0.3)
    z0 = 0.9
    L, Wt = 6.4, 3.6
    # cella walls of ashlar with antae
    for s in (-1, 1):
        k.push(T(-L / 2, s * (Wt - 0.3), z0))
        k.box('ashlar', 0, -0.3, 0, L - 0.2, 0.3, 4.2)
        k.pop()
    k.box('ashlar', -L / 2, -Wt + 0.3, z0, -L / 2 + 0.6, Wt - 0.3, 4.2 + z0)
    k.box('ashlar', 0.6, -Wt + 0.3, z0, 1.2, -0.75, 4.2 + z0)
    k.box('ashlar', 0.6, 0.75, z0, 1.2, Wt - 0.3, 4.2 + z0)
    k.box('dark', 0.55, -0.75, z0, 0.62, 0.75, 3.0 + z0)
    for s in (-1, 1):
        k.inst('doric_fluted', T(L / 2 - 0.1, s * 1.2, z0) @ S(0.62))
    zt = z0 + 6.2 * 0.62
    cols = [-Wt + 0.3, -1.2, 1.2, Wt - 0.3]
    k.push(Rz(PI / 2) @ T(0, -(L / 2 - 0.1), 0))
    ztop = C.doric_frieze_straight(k, -Wt, Wt, 0, zt, cols, depth=0.7, face=-1)
    k.pop()
    k.box('ashlar', -L / 2, -Wt, zt, L / 2 - 0.45, Wt, ztop)
    # pediment and gable roof (ridge along x)
    p = math.radians(15)
    rise = Wt * math.tan(p)
    for xg in (L / 2 - 0.1, -L / 2):
        k.add('ashlar', [(xg, -Wt, ztop), (xg, Wt, ztop), (xg, 0, ztop + rise)], [(0, 1, 2), (2, 1, 0)])
        k.box('ashlar', xg - 0.15, -Wt - 0.3, ztop - 0.02, xg + 0.25, Wt + 0.3, ztop + 0.18)
    k.add('dark_stone', [(L / 2 - 0.05, -Wt + 0.4, ztop + 0.18), (L / 2 - 0.05, Wt - 0.4, ztop + 0.18), (L / 2 - 0.05, 0, ztop + rise - 0.25)], [(0, 1, 2)])
    arch.gable_roof(k, -L / 2 - 0.2, L / 2 + 0.2, -Wt, Wt, ztop, 15, over_eave=0.35, over_gable=0.2, rafters=False, gables=False)
    for s in (-1, 1):   # raking cornices
        k.beam('ashlar', (L / 2 + 0.05, s * (Wt + 0.3), ztop + 0.1), (L / 2 + 0.05, 0, ztop + rise + 0.2), 0.3, 0.2)
    k.push(T(L / 2 + 0.1, 0, ztop + rise + 0.25))
    k.lathe('tile', [(0.0, 0), (0.18, 0), (0.25, 0.3), (0.12, 0.55), (0.0, 0.6)], seg=12)   # acroterion
    k.pop()
    k.pop()
    # the altar before it
    k.push(T(7.5, 6.0, 0))
    k.box('ashlar', -1.6, -0.9, -0.2, 1.6, 0.9, 0.25)
    k.box('ashlar', -1.35, -0.7, 0.25, 1.35, 0.7, 1.05)
    k.box('ashlar', -1.45, -0.8, 1.05, 1.45, 0.8, 1.2)
    for s in (-1, 1):
        k.push(T(s * 1.3, 0, 1.2) @ Rx(PI / 2)); k.cyl('ashlar', 0.12, -0.8, 0.8, 12); k.pop()
    k.box('soot', -1.0, -0.5, 1.2, 1.0, 0.5, 1.23)
    k.pop()
    k.inst('great_oak', T(-4, 0, 0) @ Rz(0.7) @ S(1.45))
    return dict(oak=(-4, 0), temple=(tx, ty))


# ------------------------------------------------------------------ a library
def library(k, interior=True):
    """A small limestone hall with a columned porch facing +y; heavy double doors standing open onto
    walls of pigeonholes full of scrolls; a reading room beside it with benches along its walls, and the
    desk facing the door with its marble pebble board and the stepped stand of smaller boards."""
    rng = k.rng
    W, D, H = 11.0, 9.0, 4.6
    t = 0.55
    k.box('rubble', -W / 2 - 0.2, -D / 2 - 0.2, -2.5, W / 2 + 4.6, D / 2 + 3.4, 0.0)
    for i, (w2, d2) in enumerate(((W / 2 + 0.2, D / 2 + 3.2), (W / 2, D / 2 + 3.0))):
        pass
    k.box('ashlar', -W / 2 - 0.2, D / 2 - 0.2, 0.0, W / 2 + 0.2, D / 2 + 3.2, 0.25)
    # walls (ashlar limestone)
    arch.wall(k, (-W / 2, D / 2 - t / 2), (W / 2, D / 2 - t / 2), 0.0, H, t,
              [dict(at=W / 2, w=2.4, sill=0.25, head=3.4, kind='open')], socle=0.6, mat='limewall', socle_mat='ashlar')
    arch.wall(k, (-W / 2, -D / 2 + t / 2), (W / 2, -D / 2 + t / 2), 0.0, H, t, [dict(at=W / 2, w=0.8, sill=2.6, head=3.4, kind='window')], socle=0.6, mat='limewall', socle_mat='ashlar')
    arch.wall(k, (-W / 2 + t / 2, -D / 2 + t), (-W / 2 + t / 2, D / 2 - t), 0.0, H, t, [], socle=0.6, mat='limewall', socle_mat='ashlar')
    arch.wall(k, (W / 2 - t / 2, -D / 2 + t), (W / 2 - t / 2, D / 2 - t), 0.0, H, t, [dict(at=D / 2 + 1.5, w=1.1, sill=0, head=2.2, kind='door', leaf='ajar', deg=80)], socle=0.6, mat='limewall', socle_mat='ashlar')
    # the open double doors, swung back against the inner wall
    k.push(T(0, D / 2 - t, 0.25))
    arch.door_leaf(k, -1.2, 1.2, 0.0, 3.1, y=0.0, open_deg=88)
    k.pop()
    # porch: four Doric columns in front
    for x in (-3.9, -1.3, 1.3, 3.9):
        k.inst('doric_lowerplain', T(x, D / 2 + 2.7, 0.25) @ Rz(rng.uniform(0, 1)) @ S(0.48))
    ze = 0.25 + 6.6 * 0.48
    k.push(Rz(0))
    ztop = C.doric_frieze_straight(k, -W / 2 - 0.1, W / 2 + 0.1, D / 2 + 2.7, ze, [-3.9, -1.3, 1.3, 3.9], depth=0.62, face=1)
    k.pop()
    for x in (-W / 2 + 0.2, W / 2 - 0.2):
        k.box('limewall', x - 0.25, D / 2 - 0.2, 0.25, x + 0.25, D / 2 + 3.0, ze)
    k.box('limewall', -W / 2, -D / 2, H, W / 2, D / 2, ztop)
    arch.gable_roof(k, -W / 2, W / 2, -D / 2, D / 2 + 3.0, ztop, 16, over_eave=0.45, over_gable=0.3, rafters=False, gable_mat='limewall', wall_t=0.4)
    # reading room annex on the east
    arch.wall(k, (W / 2 + 4.0, -D / 2 + 1.5), (W / 2 + 4.0, D / 2), 0.0, 3.8, 0.5, [dict(at=3.4, w=1.0, sill=1.2, head=2.4, kind='window')], socle=0.5, mat='limewall', socle_mat='ashlar')
    arch.wall(k, (W / 2, -D / 2 + 1.5), (W / 2 + 4.2, -D / 2 + 1.5), 0.0, 3.8, 0.5, [], socle=0.5, mat='limewall', socle_mat='ashlar')
    arch.wall(k, (W / 2, D / 2 - 0.25), (W / 2 + 4.2, D / 2 - 0.25), 0.0, 3.8, 0.5, [dict(at=2.1, w=1.1, sill=0, head=2.3, kind='door', leaf='ajar', deg=75)], socle=0.5, mat='limewall', socle_mat='ashlar')
    arch.lean_to(k, W / 2 - 0.1, W / 2 + 4.5, -D / 2 + 1.2, D / 2 + 0.2, 4.0, 3.6, over=0.3, beams=False) if False else None
    k.push(Rz(-PI / 2))
    arch.lean_to(k, -(D / 2 + 0.25), -(-D / 2 + 1.25), W / 2 - 0.2, W / 2 + 4.25, 4.3, 3.75, over=0.35, beams=False)
    k.pop()
    if not interior:
        return
    # ------------------------------------------------ interior: floor, pigeonholes, desk, boards
    arch.paving(k, -W / 2 + t, -D / 2 + t, W / 2 - t, D / 2 - t, 0.25, size=(0.7, 0.7), thick=0.12)
    def armarium(x0, x1, y_face, normal, z0=0.25, z1=3.6):
        """Pigeonholes in a timber frame against a wall; normal = +1/-1 along y (face direction)."""
        cw, ch = 0.36, 0.34
        nx = int((x1 - x0) / cw); nz = int((z1 - z0) / ch)
        yb = y_face - normal * 0.42
        k.box('shelf', x0, min(yb, y_face), z0, x1, max(yb, y_face) - (0.4 if normal > 0 else 0) * 0, z0 + 0.04)
        for i in range(nx + 1):
            x = x0 + i * (x1 - x0) / nx
            k.box('shelf', x - 0.022, min(yb, y_face), z0, x + 0.022, max(yb, y_face), z0 + nz * ch)
        for j in range(nz + 1):
            z = z0 + j * ch
            k.box('shelf', x0, min(yb, y_face), z - 0.02, x1, max(yb, y_face), z + 0.02)
        k.box('shelf', x0 - 0.06, min(yb, y_face), z0 + nz * ch, x1 + 0.06, max(yb, y_face) + 0.04, z0 + nz * ch + 0.08)
        k.box('shelf', x0, min(yb, y_face) - 0.02 if normal > 0 else max(yb, y_face) - 0.04, z0, x1, (min(yb, y_face) + 0.03) if normal > 0 else max(yb, y_face) + 0.0, z0 + nz * ch)
        for i in range(nx):
            for j in range(nz):
                cx = x0 + (i + 0.5) * (x1 - x0) / nx
                cz = z0 + j * ch + 0.04
                n_s = rng.integers(5, 13)
                for s in range(n_s):
                    xx = cx - 0.125 + (s % 4) * 0.083 + rng.normal(0, 0.006)
                    zz = cz + 0.035 + (s // 4) * 0.072 + rng.normal(0, 0.004)
                    k.inst('scroll', T(xx, (y_face + yb) / 2 + rng.normal(0, 0.02), zz) @ Rz(PI / 2 + rng.normal(0, 0.06)) @ S(1, rng.uniform(0.85, 1.0), 1))
    armarium(-W / 2 + t + 0.05, W / 2 - t - 0.05, -D / 2 + t, 1)
    k.push(Rz(PI / 2))
    armarium(-D / 2 + t + 0.6, D / 2 - t - 0.6, W / 2 - t, 1) if False else None
    k.pop()
    # side wall shelves (west)
    k.push(T(-W / 2 + t, 0, 0) @ Rz(-PI / 2))
    armarium(-D / 2 + t + 0.1, D / 2 - t - 1.2, 0.0, -1)
    k.pop()
    # the desk facing the door, with the marble pebble board, and the stepped stand of boards
    dx, dy = 0.0, -0.6
    k.push(T(dx, dy, 0.25))
    k.box('timber', -1.1, -0.45, 0.0, 1.1, -0.38, 0.9)         # boarded front toward the door (+y is the door)
    k.box('timber', -1.15, -0.45, 0.9, 1.15, 0.35, 0.95)
    for sx in (-1.05, 1.05):
        k.box('timber', sx - 0.04, -0.4, 0.0, sx + 0.04, 0.3, 0.9)
    k.box('timber', -1.1, 0.25, 0.0, 1.1, 0.3, 0.9)
    pebble_board(k, 0.0, -0.05, 0.95, 0.9, 0.55, big=True)
    for i, sx in enumerate((-0.9, 0.95)):
        k.push(T(sx, 0.15, 0.95)); k.lathe('clay_dark', [(0.0, 0), (0.09, 0.0), (0.11, 0.06), (0.1, 0.09), (0.0, 0.09)], seg=16); k.pop()
        for p in range(14):
            k.inst('pebble_w' if i == 0 else 'pebble_b', T(sx + rng.normal(0, 0.035), 0.15 + rng.normal(0, 0.035), 1.0 + rng.uniform(0, 0.02)) @ Rz(rng.uniform(0, 6)))
    k.box('timber', -0.3, -1.1, 0.0, 0.3, -0.7, 0.5)          # stool behind
    k.pop()
    # stepped stand of smaller boards, each with a wax tag of its own colour
    k.push(T(2.0, -0.7, 0.25))
    for i in range(5):
        k.box('timber', -0.4, -0.3 + i * 0.0, 0.0, 0.4, 0.3 - i * 0.12, 0.35 + i * 0.22)
        pebble_board(k, 0.0, 0.18 - i * 0.12 - 0.07, 0.35 + i * 0.22, 0.5, 0.22, big=False, tag=i)
    k.pop()
    # reading room: benches along the wall, where readers hold their scrolls in their hands (no table, no lectern)
    k.push(T(W / 2 + 2.0, 0.6, 0.25))
    for by in (-1.1, 1.1):
        k.box('timber', -0.9, by - 0.15, 0.42, 0.9, by + 0.15, 0.47)
        for sx in (-0.8, 0.8):
            k.box('timber', sx - 0.04, by - 0.1, 0.0, sx + 0.04, by + 0.1, 0.42)
    scroll_with_tag(k, -0.4, -1.1, 0.5, 0.1)
    k.pop()


def scroll_open(k, x, y, z):
    """An open scroll on a table: two rolls and the written sheet between."""
    k.push(T(x, y, z))
    k.box('papyrus', -0.32, -0.16, 0.0, 0.32, 0.16, 0.004)
    for s in (-1, 1):
        k.push(T(s * 0.34, 0, 0.035) @ Rx(PI / 2)); k.cyl('papyrus', 0.035, -0.16, 0.16, 12); k.pop()
    for r in range(9):
        k.box('ink', -0.27, -0.13 + r * 0.03, 0.004, 0.27 - 0.1 * (r % 3 == 2), -0.122 + r * 0.03, 0.0045)
    k.pop()


def pebble_board(k, x, y, z, W, D, n_cols=3, big=True, tag=None):
    """A marble counting board cut with six grooves in two sets of three: a white groove for each of the
    three libraries in the first set, a black groove for each in the second; pebbles lie in them."""
    rng = k.rng
    k.push(T(x, y, z))
    zt = 0.05 if big else 0.035
    k.box('marble', -W / 2, -D / 2, 0, W / 2, D / 2, zt)
    gw = W / 8.0
    xs = [-W / 2 + gw * (i + 1) for i in range(3)] + [W / 2 - gw * (3 - i) for i in range(3)]
    for gi, gx in enumerate(xs):
        proto = 'pebble_w' if gi < 3 else 'pebble_b'
        k.box('groove', gx - gw * 0.3, -D / 2 + 0.04, zt - 0.004, gx + gw * 0.3, D / 2 - 0.04, zt + 0.0008)
        n = int(rng.integers(5, 16) if gi < 3 else rng.integers(1, 6)) if big else int(rng.integers(1, 7) if gi < 3 else rng.integers(0, 3))
        step = (0.027 if big else 0.016)
        for p_ in range(n):
            k.inst(proto, T(gx + rng.normal(0, 0.002), -D / 2 + 0.07 + p_ * step, zt + 0.003) @ Rz(rng.uniform(0, 6)) @ S(1.25 if big else 0.6))
    k.box('dark_stone', -0.004, -D / 2 + 0.03, zt - 0.003, 0.004, D / 2 - 0.03, zt + 0.0006)     # the line between the sets
    if tag is not None:
        k.box('tag%d' % tag, -0.05, D / 2, zt - 0.025, 0.05, D / 2 + 0.01, zt + 0.01)
    k.pop()


# ------------------------------------------------------------------ the stoa and the festival ground
def stoa(k, L=120.0):
    """Two-storey colonnade facing +y (the harbour): Doric outside below, Ionic inner row and upper storey;
    back wall with benches, boards pinned with scraps of papyrus, niches of scrolls; the armillary sphere and
    the painted diagram of the Sun at the centre with the Earth circling it."""
    rng = k.rng
    D = 14.0
    k.box('ashlar', -L / 2 - 0.6, -D / 2 - 0.4, -2.0, L / 2 + 0.6, D / 2 + 0.6, 0.0)
    for i in range(2):
        k.box('ashlar', -L / 2 - 0.6 + 0.0, D / 2 + 0.6 + i * 0.4, -1.0, L / 2 + 0.6, D / 2 + 1.0 + i * 0.4, -0.3 * (i + 1))
    arch.paving(k, -L / 2, -D / 2 + 0.6, L / 2, D / 2, 0.09, size=(1.1, 0.8))
    H1 = 5.6
    # back wall
    nn = int(L / 6)
    ops = [dict(at=(i + 0.5) * L / nn, w=1.0, sill=1.9, head=3.4, kind='niche') for i in range(nn)]
    arch.wall(k, (-L / 2, -D / 2 + 0.3), (L / 2, -D / 2 + 0.3), 0.0, H1 * 2 + 0.6, 0.6, [], socle=0.8, mat='limewall', socle_mat='ashlar')
    for o in ops:
        x = -L / 2 + o['at']
        k.box('dark', x - 0.5, -D / 2 + 0.55, 1.9, x + 0.5, -D / 2 + 0.62, 3.4)
        k.box('shelf', x - 0.5, -D / 2 + 0.6, 1.9, x + 0.5, -D / 2 + 0.85, 1.95)
        k.box('shelf', x - 0.5, -D / 2 + 0.6, 2.6, x + 0.5, -D / 2 + 0.85, 2.63)
        for j in range(10):
            k.inst('scroll', T(x - 0.4 + (j % 5) * 0.2, -D / 2 + 0.72, 2.0 + (j // 5) * 0.68) @ Rz(rng.normal(0, 0.1)))
        # a board pinned thick with scraps of papyrus between the niches
        bx = x + L / nn / 2
        if bx < L / 2 - 1:
            k.box('board', bx - 0.9, -D / 2 + 0.6, 1.6, bx + 0.9, -D / 2 + 0.66, 2.7)
            for s in range(rng.integers(8, 16)):
                sx = bx + rng.uniform(-0.8, 0.8); sz = rng.uniform(1.7, 2.6)
                k.push(T(sx, -D / 2 + 0.67, sz) @ Ry(rng.normal(0, 0.15)))
                k.box('papyrus', -0.09, 0, -0.06, 0.09, 0.003, 0.06)
                k.pop()
        k.box('ashlar', x - 1.4, -D / 2 + 0.6, 0.0, x + 1.4, -D / 2 + 1.05, 0.45)   # benches
    for xe in (-L / 2, L / 2):
        arch.wall(k, (xe, -D / 2), (xe, D / 2), 0.0, H1 * 2 + 0.6, 0.6, [], socle=0.8, mat='limewall', socle_mat='ashlar')
    # outer Doric colonnade (lower third unfluted), inner Ionic row
    sp = 2.3
    ncol = int(L / sp)
    xs = np.linspace(-L / 2 + 0.8, L / 2 - 0.8, ncol + 1)
    D1 = 0.72
    for x in xs:
        k.inst('doric_lowerplain', T(x, D / 2 - 0.5, 0.0) @ Rz(rng.uniform(0, 0.2)) @ S(D1))
    ze = 6.6 * D1
    C.doric_frieze_straight(k, -L / 2, L / 2, D / 2 - 0.5, ze, list(xs), depth=0.8, face=1)
    xi = np.linspace(-L / 2 + 3, L / 2 - 3, int(L / 4.65) + 1)
    for x in xi:
        k.inst('ionic', T(x, 0.6, 0.0) @ S(0.62))
    zi = 9.0 * 0.62
    k.beam('ashlar', (-L / 2, 0.6, zi + 0.3), (L / 2, 0.6, zi + 0.3), 0.6, 0.6)
    z2 = ze + 1.5
    # upper floor
    k.box('timber', -L / 2, -D / 2 + 0.6, z2 - 0.3, L / 2, D / 2 - 0.1, z2)
    arch.paving(k, -L / 2, -D / 2 + 0.6, L / 2, D / 2 - 0.1, z2 + 0.12, size=(1.0, 0.8), thick=0.12) if False else None
    for x in xs[::2]:
        k.inst('ionic', T(x, D / 2 - 0.5, z2) @ S(0.5))
    zt2 = z2 + 9.0 * 0.5
    k.beam('ashlar', (-L / 2, D / 2 - 0.5, zt2 + 0.3), (L / 2, D / 2 - 0.5, zt2 + 0.3), 0.7, 0.6)
    for a, b in zip(xs[::2][:-1], xs[::2][1:]):   # balustrade panels between the upper columns
        k.box('limewall', a + 0.3, D / 2 - 0.55, z2, b - 0.3, D / 2 - 0.4, z2 + 1.1)
    arch.lean_to(k, -L / 2 - 0.3, L / 2 + 0.3, -D / 2 + 0.3, D / 2 - 0.5, H1 * 2 + 0.6, zt2 + 0.6, over=0.6, beams=True)
    # the armillary sphere on its plinth and the painted diagram, at the middle of the colonnade
    k.push(T(0, -1.5, 0))
    k.box('ashlar', -0.6, -0.6, 0.0, 0.6, 0.6, 1.2)
    k.push(T(0, 0, 2.05))
    for ang, ax in ((0, 'z'), (PI / 2, 'x'), (PI / 2, 'y'), (0.41, 'x')):
        m = Rx(ang) if ax == 'x' else (Ry(ang) if ax == 'y' else Rz(0))
        k.push(m)
        for i in range(36):
            a0 = 2 * PI * i / 36; a1 = 2 * PI * (i + 1) / 36
            k.beam('bronze', (0.75 * math.cos(a0), 0.75 * math.sin(a0), 0), (0.75 * math.cos(a1), 0.75 * math.sin(a1), 0), 0.035, 0.02)
        k.pop()
    k.lathe('bronze', [(0.0, -0.1), (0.1, 0.0), (0.0, 0.1)], seg=16)
    k.pop()
    k.beam('bronze', (0, 0, 1.2), (0, 0, 1.3), 0.05, 0.05)
    k.push(T(0, 0, 1.2) @ Ry(0.0)); k.beam('bronze', (0, 0, 0), (0.0, 0.0, 0.9), 0.04, 0.04); k.pop()
    k.pop()
    return dict(D=D)


def festival_ground(k, W=140.0, Dd=72.0, rows=6, pairs=10):
    """Rows of long stone tables, paired facing each other, with scroll rests, oil lamps and inkpots."""
    rng = k.rng
    for r in range(rows):
        y = -Dd / 2 + 8 + r * (Dd - 16) / (rows - 1)
        for p in range(pairs):
            x = -W / 2 + 10 + p * (W - 20) / (pairs - 1)
            k.push(T(x + rng.normal(0, 0.2), y + rng.normal(0, 0.2), 0) @ Rz(rng.normal(0, 0.02)))
            k.box('ashlar', -2.5, -0.55, 0.72, 2.5, 0.55, 0.84)
            for sx in (-1.9, 0.0, 1.9):
                k.box('ashlar', sx - 0.22, -0.35, 0.0, sx + 0.22, 0.35, 0.72)
            for s in (-1, 1):
                k.box('ashlar', -2.3, s * 1.05 - 0.2, 0.0, 2.3, s * 1.05 + 0.2, 0.45)    # benches facing each other
                for j in (-1.1, 1.1):
                    k.push(T(j, s * 0.28, 0.84) @ Rz(PI / 2 * (s < 0)))
                    k.box('timber', -0.25, -0.1, 0.0, 0.25, 0.1, 0.03)
                    k.box('timber', -0.25, 0.06, 0.0, 0.25, 0.1, 0.18)        # scroll rest
                    k.pop()
                    k.inst('scroll', T(j + 0.15, s * 0.32, 0.92) @ Rz(0.05))
            k.push(T(0.0, 0.0, 0.84)); k.lathe('clay', [(0.0, 0), (0.05, 0.0), (0.06, 0.03), (0.04, 0.045), (0.0, 0.045)], seg=12); k.pop()
            k.push(T(0.5, 0.1, 0.84)); k.lathe('clay_dark', [(0.0, 0), (0.035, 0.0), (0.04, 0.035), (0.02, 0.05), (0.0, 0.05)], seg=12); k.pop()
            k.pop()


def courier_landing(k):
    """Timber piers on posts, a small open-sided shelter with benches. Local +y is seaward."""
    for px in (-9, 9):
        for yy in np.arange(0, 32, 2.4):
            for sx in (-1.2, 1.2):
                k.push(T(px + sx, yy, -3.0)); k.cyl('timber', 0.13, 0, 5.4, 8); k.pop()
        k.box('timber', px - 1.4, -1.0, 2.1, px + 1.4, 32, 2.25)
        for yy in np.arange(-1.0, 32, 0.3):
            k.box('door', px - 1.4, yy + 0.01, 2.25, px + 1.4, yy + 0.28, 2.3)
    k.push(T(0, -8, 2.3))
    for sx in (-3, 3):
        for sy in (-2, 2):
            k.beam('timber', (sx, sy, 0), (sx, sy, 2.7), 0.2, 0.2, 0.05)
    k.beam('timber', (-3.3, -2, 2.8), (3.3, -2, 2.8), 0.22, 0.22)
    k.beam('timber', (-3.3, 2, 2.8), (3.3, 2, 2.8), 0.22, 0.22)
    arch.gable_roof(k, -3.0, 3.0, -2.0, 2.0, 2.9, 16, over_eave=0.4, over_gable=0.35, rafters=True, gables=False)
    for sy in (-1.5, 1.5):
        k.box('door', -2.6, sy - 0.2, 0.42, 2.6, sy + 0.2, 0.48)
        for sx in (-2.3, 2.3):
            k.box('door', sx - 0.05, sy - 0.15, 0.0, sx + 0.05, sy + 0.15, 0.42)
    k.pop()


def ferry_stage(k):
    """A stone landing with steps into the water, a timber jetty and mooring posts, and a small
    open shelter where those who share the crossing wait. Local +y toward the water."""
    for i in range(7):
        k.box('ashlar', -5.0, i * 0.55, -2.4, 5.0, (i + 1) * 0.55, 2.4 - i * 0.36)
    k.box('ashlar', -6.0, -7.0, -1.0, 6.0, 0.0, 2.45)
    arch.paving(k, -6.0, -7.0, 6.0, 0.0, 2.5, size=(1.0, 0.8))
    k.box('timber', -1.3, 3.6, 0.6, 1.3, 16.0, 0.75)
    for yy in np.arange(4.0, 16.0, 2.0):
        for sx in (-1.15, 1.15):
            k.push(T(sx, yy, -2.8)); k.cyl('timber', 0.14, 0, 3.7, 8); k.pop()
    for yy in (8.0, 15.5):
        k.push(T(0.0, yy, 0.75)); k.cyl('timber', 0.13, 0, 0.9, 8); k.pop()
    for sx in (-4.5, 4.5):
        k.push(T(sx, -0.6, 2.5)); k.lathe('stone', [(0.24, 0), (0.2, 0.55), (0.26, 0.62), (0.0, 0.7)], seg=14); k.pop()
    k.push(T(0, -4.5, 2.5))
    for sx in (-2.6, 2.6):
        for sy in (-1.6, 1.6):
            k.beam('timber', (sx, sy, 0), (sx, sy, 2.5), 0.2, 0.2, 0.05)
    arch.gable_roof(k, -2.8, 2.8, -1.6, 1.6, 2.55, 16, over_eave=0.4, over_gable=0.3, rafters=True, gables=False)
    k.box('ashlar', -2.3, 0.9, 0.0, 2.3, 1.3, 0.45)
    k.box('ashlar', -2.3, -1.3, 0.0, 2.3, -0.9, 0.45)
    k.pop()
