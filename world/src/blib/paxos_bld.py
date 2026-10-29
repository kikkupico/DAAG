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
    six columns of fluted drums inside; five named benches with wax tablets; the podium at the centre,
    with the seal of the present spell on its desk."""
    R = 8.6; t = 0.8; zs = 0.5
    k.lathe('honey', [(R + 0.9, -0.6), (R + 0.9, zs), (0.0, zs)], seg=96)
    door_w, door_h = 2.0, 3.6
    H = 6.4
    ring_courses(k, R, t, zs, zs + H, 'honey', [(-(door_w / 2 + 0.55) / R, (door_w / 2 + 0.55) / R, zs, zs + door_h)], course=0.48, block=1.1)
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
    # jambs and a lintel through the wall's thickness, so the doorway has clean sides
    for sy in (-1, 1):
        k.box('honey', R - t / 2 - 0.06, sy * door_w / 2, zs, R + t / 2 + 0.04, sy * (door_w / 2 + 1.12), zs + door_h + 0.02)
    k.box('honey', R - t / 2 - 0.06, -door_w / 2 - 1.12, zs + door_h, R + t / 2 + 0.04, door_w / 2 + 1.12, zs + door_h + 0.5)
    # ------------------------------------------------ interior
    Rin = R - t / 2
    zf = zs + 0.1                                            # the floor
    gap = (door_w / 2 + 0.05) / Rin                          # the doorway, left open by every ring that runs round the wall
    k.lathe('mortar', [(Rin, zs - 0.2), (Rin, zs + 0.085), (0.0, zs + 0.085)], seg=64)
    # floor: a dark ring round the podium, honey rings of slabs in two tones, a paler stylobate ring under the columns
    radial_paving(k, 1.62, 1.95, zf, ring=0.33, mat='dark_floor')
    radial_paving(k, 1.95, 4.2, zf, ring=0.75, mat='pave_honey', alt='pave_pale')
    for i in range(36):                                      # stylobate: long curved slabs, one joint midway between columns
        a0 = 2 * PI * i / 36 + 0.002; a1 = 2 * PI * (i + 1) / 36 - 0.002
        arc_sweep(k, 'pave_pale', [(4.2, zf - 0.2), (5.0, zf - 0.2), (5.0, zf + 0.006), (4.2, zf + 0.006)], a0, a1, 6)
    radial_paving(k, 5.0, Rin + 0.15, zf, ring=0.85, mat='pave_honey', alt='pave_pale')
    # the wall inside: a moulded plinth, a dado painted red ochre, a moulding above it, and a painted band under the rafters
    A0, A1 = gap, 2 * PI - gap
    arc_sweep(k, 'honey', [(Rin + 0.02, zf), (Rin - 0.13, zf), (Rin - 0.13, zf + 0.26), (Rin - 0.09, zf + 0.3),
                           (Rin - 0.07, zf + 0.36), (Rin + 0.02, zf + 0.36)], A0, A1, 160)
    arc_sweep(k, 'ochre_paint', [(Rin - 0.026, zf + 0.36), (Rin - 0.026, zf + 1.42), (Rin + 0.02, zf + 1.42), (Rin + 0.02, zf + 0.36)], A0, A1, 160)
    arc_sweep(k, 'honey', [(Rin + 0.02, zf + 1.42), (Rin - 0.03, zf + 1.42), (Rin - 0.07, zf + 1.47), (Rin - 0.07, zf + 1.53),
                           (Rin - 0.03, zf + 1.56), (Rin + 0.02, zf + 1.56)], A0, A1, 160)
    zr_in = zr - 0.12
    arc_sweep(k, 'paint_red', [(Rin - 0.026, zr_in - 0.62), (Rin - 0.026, zr_in - 0.56), (Rin + 0.02, zr_in - 0.56), (Rin + 0.02, zr_in - 0.62)], 0, 2 * PI, 160)
    arc_sweep(k, 'paint_blue', [(Rin - 0.026, zr_in - 0.52), (Rin - 0.026, zr_in - 0.4), (Rin + 0.02, zr_in - 0.4), (Rin + 0.02, zr_in - 0.52)], 0, 2 * PI, 160)
    # six columns of fluted drums with Doric capitals, carrying a hexagon of squared beams
    Dc = 0.6; Hc = 7.0 * Dc; Rc = 4.6
    for i in range(6):
        a = 2 * PI * (i + 0.5) / 6
        drum_column(k, Rc * math.cos(a), Rc * math.sin(a), zf, Dc, Hc, a, 'honey')
    zi = zf + Hc
    for i in range(6):
        a0 = 2 * PI * (i + 0.5) / 6; a1 = 2 * PI * (i + 1.5) / 6
        p0 = (Rc * math.cos(a0), Rc * math.sin(a0)); p1 = (Rc * math.cos(a1), Rc * math.sin(a1))
        k.beam('timber', (*p0, zi + 0.2), (*p1, zi + 0.2), 0.42, 0.4)
        k.beam('timber', (*p0, zi + 0.6), (*p1, zi + 0.6), 0.3, 0.18)            # a lighter plate on the beam
        for s_ in (0.18, 0.82):                                                   # braces from each column to its beams
            q = (p0[0] + (p1[0] - p0[0]) * s_, p0[1] + (p1[1] - p0[1]) * s_)
            c_ = p0 if s_ < 0.5 else p1
            k.beam('timber', (c_[0] + (q[0] - c_[0]) * 0.15, c_[1] + (q[1] - c_[1]) * 0.15, zi - 0.55), (*q, zi), 0.14, 0.14)
    # a wall plate on stone corbels where the rafters land
    for i in range(48):
        a0 = 2 * PI * i / 48; a1 = 2 * PI * (i + 1) / 48
        k.beam('timber', ((Rin - 0.14) * math.cos(a0), (Rin - 0.14) * math.sin(a0), zr_in - 0.2),
               ((Rin - 0.14) * math.cos(a1), (Rin - 0.14) * math.sin(a1), zr_in - 0.2), 0.24, 0.2)
    for i in range(24):
        a = 2 * PI * i / 24
        k.push(Rz(a)); k.box('honey', Rin - 0.3, -0.13, zr_in - 0.48, Rin + 0.02, 0.13, zr_in - 0.3); k.pop()
        k.beam('timber', (4.5 * math.cos(a), 4.5 * math.sin(a), zi + 0.75), ((Rin - 0.1) * math.cos(a), (Rin - 0.1) * math.sin(a), zr_in), 0.16, 0.22, 0.05)
        k.beam('timber', (4.5 * math.cos(a), 4.5 * math.sin(a), zi + 0.75), (apex_r * math.cos(a), apex_r * math.sin(a), zr + rise - 0.25), 0.15, 0.2, 0.05)
    rc = R + t / 2 + 0.6                                     # boarding under the tiles, seen between the rafters
    k.lathe('board', [(Rin, zr + (rc - Rin) * math.tan(math.radians(18)) - 0.05), (apex_r + 0.05, zr + rise - 0.1)], seg=96, caps=False)
    for rp in (2.4, 3.4, 6.2, 7.2):                                              # purlins across the rafters
        zp_ = zi + 0.75 + (zr + rise - 0.25 - zi - 0.75) * (4.5 - rp) / (4.5 - apex_r) if rp < 4.5 else zi + 0.75 + (zr_in - zi - 0.75) * (rp - 4.5) / (Rin - 0.1 - 4.5)
        for i in range(24):
            a0 = 2 * PI * i / 24; a1 = 2 * PI * (i + 1) / 24
            k.beam('timber', (rp * math.cos(a0), rp * math.sin(a0), zp_ + 0.16), (rp * math.cos(a1), rp * math.sin(a1), zp_ + 0.16), 0.1, 0.1)
    # five benches, one for each legislator, evenly spaced with the door (angle 0) halfway between two of them;
    # each back carries its owner's name and, cut beneath it, the middle of the last seal they joined
    # (the model shows the hall under seal 7, called by Liskovia: Okios and Theron last joined seal 6, called by Okios)
    LAST = ['Ο6', 'Λ7', 'Λ7', 'Λ7', 'Ο6']
    for i in range(5):
        a = BENCH_A[i]
        rb = Rin - 0.62
        k.push(T(rb * math.cos(a), rb * math.sin(a), zf) @ Rz(a - PI / 2))     # local +y toward the wall, -y to the podium
        bench(k, NAMES[i], LAST[i])
        # the stand: a short column with a sloping top holding wax tablets, and the impression of the seal the bench serves under
        k.push(T(1.62, -0.12, 0))
        k.lathe('marble', [(0.2, 0), (0.2, 0.06), (0.16, 0.1), (0.11, 0.14), (0.1, 0.62), (0.13, 0.66), (0.16, 0.7), (0.16, 0.74), (0.0, 0.74)], seg=28)
        k.push(T(0, 0, 0.74) @ Rx(0.32))
        k.box('marble', -0.24, -0.19, 0, 0.24, 0.19, 0.04)
        k.box('marble', -0.24, -0.21, 0.04, 0.24, -0.18, 0.07)                   # a lip so the tablets stay
        for j in range(3):
            k.push(T(-0.08, 0.0, 0.04 + j * 0.028) @ Rz(0.05 * (j - 1)))
            k.box('board', -0.13, -0.09, 0, 0.13, 0.09, 0.025)
            k.box('wax', -0.115, -0.075, 0.024, 0.115, 0.075, 0.029)
            k.pop()
        seal = SEAL7 if LAST[i] == 'Λ7' else SEAL6
        seal_impression(k, 0.15, 0.04, 0.04, seal, R=0.055, rot=-(a - PI / 2), up=0.0)
        k.pop(); k.pop()
        k.pop()
    # the podium: two moulded steps, a stone chair facing the door, a timber desk with the seal of the present spell
    k.lathe('marble', [(1.62, zf - 0.02), (1.62, zf + 0.24), (1.59, zf + 0.27), (1.56, zf + 0.3), (1.25, zf + 0.3),
                       (1.25, zf + 0.54), (1.22, zf + 0.57), (1.19, zf + 0.6), (0.0, zf + 0.6)], seg=96)
    zp = zf + 0.6
    throne(k, -0.62, 0.0, zp)
    desk(k, 0.18, 0.0, zp)
    zd = zp + 0.76                                           # the desk top
    for j, (dx, dy, rz) in enumerate(((0.05, -0.28, 0.12), (0.12, 0.3, -0.18))):      # tablets, one open
        k.push(T(dx, dy, zd) @ Rz(rz))
        k.box('board', -0.13, -0.09, 0, 0.13, 0.09, 0.025); k.box('wax', -0.115, -0.075, 0.024, 0.115, 0.075, 0.029)
        if j == 0:
            k.box('board', -0.13, 0.095, 0, 0.13, 0.275, 0.025); k.box('wax', -0.115, 0.11, 0.024, 0.115, 0.26, 0.029)
        k.pop()
    k.push(T(0.1, -0.04, zd + 0.034) @ Rz(0.5)); k.beam('bronze', (-0.08, 0, 0), (0.08, 0, 0), 0.008, 0.008); k.pop()   # a stylus
    seal_stamp(k, 0.38, -0.12, zd, SEAL7, up=-PI / 2)                            # the stamp, set for seal 7, back up
    seal_impression(k, 0.42, 0.2, zd, SEAL7, R=0.1, up=-PI / 2)                 # and its print in wax, as every line carries it
    die_tray(k, 0.12, 0.36, zd, ['Ο', 'Θ'])                                       # the signets not in the stamp
    return dict(zs=zs, R=R, zr=zr, apex=zr + rise)


# the benches' bearings in the hall (door at 0): Okios, Liskovia, Kleon, Melissa, Theron
BENCH_A = [2 * PI * (i + 1.5) / 5 for i in range(5)]
# seals as the model shows them: (manager's initial, number, the others who answered by bench index, the holder: 'mid' or a bench index)
SEAL7 = ('Λ', '7', [2, 3], 'mid')           # called by Liskovia, who holds the podium; Kleon and Melissa answered
SEAL6 = ('Ο', '6', [1, 2, 3, 4], 'mid')     # called by Okios, who held the podium; all five


def arc_sweep(k, mat, poly, a0, a1, seg):
    """Sweep a closed (r, z) outline round the z axis from angle a0 to a1, capped at both ends."""
    n = len(poly); V = []; F = []
    for s in range(seg + 1):
        a = a0 + (a1 - a0) * s / seg
        V += [(r * math.cos(a), r * math.sin(a), z) for r, z in poly]
    for s in range(seg):
        for i in range(n):
            j = (i + 1) % n
            F.append((s * n + i, s * n + j, (s + 1) * n + j, (s + 1) * n + i))
    if abs(a1 - a0 - 2 * PI) > 1e-6:
        F.append(tuple(range(n - 1, -1, -1))); F.append(tuple(seg * n + i for i in range(n)))
    k.add(mat, V, F)


def drum_column(k, x, y, z, D, H, face, mat, drums=5, flutes=20):
    """A Doric column built of fluted drums with hairline joints, an echinus capital and a square abacus."""
    r0 = D / 2; r1 = r0 * 0.8; cap = 0.5 * D; hs = H - cap
    k.push(T(x, y, z) @ Rz(face))
    rr = lambda t: r0 + (r1 - r0) * t + 0.012 * D * math.sin(PI * t)
    for d in range(drums):
        t0 = d / drums; t1 = (d + 1) / drums
        prof = [(rr(t0 + (t1 - t0) * u / 3) * (0.985 if u in (0, 3) else 1.0), hs * (t0 + (t1 - t0) * u / 3) + (0.004 if u == 0 and d else 0) - (0.004 if u == 3 and d < drums - 1 else 0)) for u in range(4)]
        k.lathe(mat, prof, seg=80, flutes=flutes, fdepth=0.07)
        if d:
            k.lathe(mat, [(r0 * 0.9, hs * t0 - 0.005), (r0 * 0.9, hs * t0 + 0.005)], seg=24, caps=False)
    s = D
    k.lathe(mat, [(r1, hs), (r1 * 1.03, hs + 0.02 * s), (r1, hs + 0.035 * s), (r1 * 1.03, hs + 0.055 * s), (r1, hs + 0.07 * s)], seg=48)
    k.lathe(mat, [(r1 + (0.66 * s - r1) * (1 - (1 - i / 8) ** 2.2), hs + 0.07 * s + 0.2 * s * i / 8) for i in range(9)], seg=48)
    a_ = 0.68 * s
    k.box(mat, -a_, -a_, hs + 0.27 * s, a_, a_, hs + 0.5 * s)
    k.pop()


def bench(k, name, last):
    """A marble bench in its own frame (seat along x, back toward +y): a step to rest the feet, end blocks rolled
    into scrolls, a seat slab with a rounded front, a tall back with a moulded cap; the name and the last seal cut in it."""
    k.box('marble', -1.32, -0.62, 0, 1.32, 0.42, 0.1)                            # the step
    for sx in (-1, 1):
        k.box('marble', sx * 1.12 - 0.11, -0.3, 0.1, sx * 1.12 + 0.11, 0.3, 0.5)
        k.push(T(sx * 1.12, -0.12, 0.62) @ Ry(PI / 2))
        k.lathe('marble', [(0.0, -0.11), (0.14, -0.11), (0.15, -0.09), (0.15, 0.09), (0.14, 0.11), (0.0, 0.11)], seg=20)
        k.pop()
        k.box('marble', sx * 1.12 - 0.11, -0.12, 0.5, sx * 1.12 + 0.11, 0.3, 0.76)
    k.box('marble', -1.02, -0.28, 0.1, 1.02, 0.26, 0.4)                          # the seat's body, set back
    k.box('marble', -1.02, -0.34, 0.4, 1.02, 0.3, 0.48)                          # the seat slab
    k.push(T(0, -0.34, 0.44) @ Ry(PI / 2)); k.cyl('marble', 0.04, -1.02, 1.02, 12); k.pop()
    k.box('marble', -1.24, 0.28, 0.1, 1.24, 0.42, 1.36)                          # the back
    k.box('marble', -1.3, 0.24, 1.36, 1.3, 0.46, 1.42)
    k.box('marble', -1.27, 0.26, 1.42, 1.27, 0.44, 1.47)
    text_mesh(k, 'dark_stone', name, 0.1, 0.0, 0.278, 1.18, rot=(PI / 2, 0, 0), depth=0.003)
    text_mesh(k, 'red', last, 0.12, 0.0, 0.278, 0.96, rot=(PI / 2, 0, 0), depth=0.003)
    k.push(T(0, 0.279, 0.96) @ Rx(PI / 2)); k.lathe('red', [(0.115, -0.0015), (0.125, -0.0015), (0.125, 0.0015), (0.115, 0.0015)], seg=40, caps=False); k.pop()


def throne(k, x, y, z):
    """A marble chair facing +x, after the front-row chairs of the theatre at Athens: a solid seat on a plinth,
    a carved panel in front, solid arms with rounded rails and scrolled ends, a back with a rolled crest."""
    k.push(T(x, y, z))
    k.box('marble', -0.36, -0.38, 0, 0.34, 0.38, 0.06)                            # plinth
    k.box('marble', -0.3, -0.31, 0.06, 0.28, 0.31, 0.44)                          # seat block
    k.box('marble', 0.28, -0.24, 0.12, 0.295, 0.24, 0.38)                         # the carved panel in front
    k.box('marble', -0.32, -0.33, 0.44, 0.3, 0.33, 0.5)                           # seat slab
    k.push(T(0.3, 0, 0.47) @ Rx(PI / 2)); k.cyl('marble', 0.03, -0.33, 0.33, 12); k.pop()
    for sy in (-1, 1):                                                            # arms
        k.box('marble', -0.3, sy * 0.36 - 0.035, 0.06, 0.24, sy * 0.36 + 0.035, 0.68)
        k.push(T(-0.03, sy * 0.36, 0.7) @ Ry(PI / 2)); k.cyl('marble', 0.045, -0.29, 0.27, 14); k.pop()
        k.push(T(0.25, sy * 0.36, 0.66) @ Rx(PI / 2)); k.cyl('marble', 0.07, -0.045, 0.045, 18); k.pop()
    k.box('marble', -0.36, -0.36, 0.5, -0.29, 0.36, 1.02)                         # back
    k.push(T(-0.325, 0, 1.03) @ Rx(PI / 2)); k.cyl('marble', 0.055, -0.38, 0.38, 16); k.pop()
    for sy in (-1, 1):
        k.push(T(-0.325, sy * 0.38, 1.03) @ Rx(PI / 2)); k.cyl('marble', 0.075, -0.012, 0.012, 18); k.pop()
    k.pop()


def desk(k, x, y, z):
    """A timber desk with turned legs and stretchers, its long side toward the chair."""
    k.push(T(x, y, z))
    for sx in (-1, 1):
        for sy in (-1, 1):
            k.push(T(sx * 0.32, sy * 0.46, 0))
            k.lathe('timber', [(0.03, 0), (0.035, 0.03), (0.022, 0.1), (0.028, 0.3), (0.02, 0.5), (0.03, 0.62), (0.03, 0.72), (0.0, 0.72)], seg=14)
            k.pop()
        k.box('timber', sx * 0.32 - 0.02, -0.46, 0.14, sx * 0.32 + 0.02, 0.46, 0.18)
    k.box('timber', -0.32, -0.02, 0.14, 0.32, 0.02, 0.18)
    k.box('timber', -0.36, -0.5, 0.64, 0.36, 0.5, 0.72)                          # apron
    k.box('timber', -0.4, -0.55, 0.72, 0.4, 0.55, 0.76)                           # top
    k.pop()


def seal_layout(R, up):
    """Where the stamp's slots are, in its own frame: every signet slot is round and the same size, so a signet fits any
    of them, one at each bench's bearing round the edge and one in the middle for the manager; beside the middle one is
    a square slot for the number. up turns the middle pair to read from that side."""
    rs = R * 0.17; rr = R * 0.64; d = R * 0.2
    ring = {b: (rr * math.cos(BENCH_A[b]), rr * math.sin(BENCH_A[b])) for b in range(5)}
    mgr = (-d * math.cos(up), -d * math.sin(up)); num = (d * math.cos(up), d * math.sin(up))
    return rs, ring, mgr, num, R * 0.12


def seal_impression(k, x, y, z, seal, R=0.08, rot=0.0, up=0.0):
    """The seal pressed in red wax, lying flat: a disc with a raised rim; a round boss with an initial where each signet
    stood, the manager's in the middle with the number in its square beside it, and a wreath of leaves round the
    holder's. rot turns the disc so each boss sits at its bench's bearing in the hall; up turns the letters to read
    from that side. A slot left empty prints nothing."""
    mid, num, ring, hold = seal
    h = 0.012; rel = 0.004; th = up - rot
    k.push(T(x, y, z) @ Rz(rot))
    k.lathe('sealwax', [(R * 0.97, 0), (R * 1.02, h * 0.4), (R, h), (R * 0.9, h * 1.15), (R * 0.86, h), (0.0, h)], seg=48)
    rs, pos, mgr, npos, hs = seal_layout(R, th)
    def boss(px, py, ch):
        k.push(T(px, py, 0)); k.lathe('sealwax', [(rs, h - 0.001), (rs, h + rel), (0.0, h + rel)], seg=28); k.pop()
        text_mesh(k, 'sealwax', ch, rs * 1.2, px, py, h + rel, rot=(0, 0, th), depth=0.0025)
    boss(*mgr, mid)
    k.push(T(*npos, 0) @ Rz(th)); k.box('sealwax', -hs, -hs, h - 0.001, hs, hs, h + rel); k.pop()
    text_mesh(k, 'sealwax', num, hs * 1.6, *npos, h + rel, rot=(0, 0, th), depth=0.0025)
    k.push(T(*(mgr if hold == 'mid' else pos[hold]), 0)); wreath(k, rs + R * 0.05, R * 0.6, h, rel, n=11); k.pop()
    for b in ring:
        boss(*pos[b], NAMES[b][0])
    k.pop()


def wreath(k, rw, R, h, rel, n=16, mat='sealwax'):
    """A wreath of paired leaves on a circle of radius rw, lying on the wax at height h."""
    L_ = R * 0.11; W_ = R * 0.035
    for i in range(n):
        a = 2 * PI * i / n
        for side in (-1, 1):
            k.push(T((rw + side * W_ * 0.9) * math.cos(a), (rw + side * W_ * 0.9) * math.sin(a), h) @ Rz(a + PI / 2 + side * 0.45))
            k.add(mat, [(-L_ / 2, 0, 0), (0, -W_ / 2, 0), (L_ / 2, 0, 0), (0, W_ / 2, 0),
                              (-L_ / 2, 0, rel * 0.4), (0, -W_ / 2, rel * 0.9), (L_ / 2, 0, rel * 0.4), (0, W_ / 2, rel * 0.9)],
                  [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
            k.pop()


def seal_stamp(k, x, y, z, seal, R=0.1, up=0.0):
    """The stamp: a bronze disc with round slots sunk in it, all one size, one at each bench's bearing and one in the
    middle, and a square slot beside the middle one for the number. Each legislator's signet is a round die that fits
    any round slot: set at a bench's place it says that legislator answered the call, set in the middle it names the
    manager; a slot left empty prints nothing. A bronze wreath, a ring that fits over any round slot, goes round the holder's. It lies back up, so the dies
    show their initials as they are set."""
    mid, num, ring, hold = seal
    t = 0.016; dep = 0.009
    rs, pos, mgr, npos, hs = seal_layout(R, up)
    rounds = [mgr] + [pos[b] for b in range(5)]
    def inside(px, py):
        if any((px - cx) ** 2 + (py - cy) ** 2 < (rs + 0.0012) ** 2 for cx, cy in rounds):
            return True
        u = (px - npos[0]) * math.cos(up) + (py - npos[1]) * math.sin(up)
        v = -(px - npos[0]) * math.sin(up) + (py - npos[1]) * math.cos(up)
        return abs(u) < hs + 0.0012 and abs(v) < hs + 0.0012
    k.push(T(x, y, z))
    # the face (underneath) and the rim
    k.lathe('bronze', [(0.0, 0.0), (R, 0.0), (R * 1.01, t * 0.5), (R, t)], seg=72, caps=False)
    k.lathe('bronze', [(0.0, 0.0), (R, 0.0)], seg=72)
    # the back, a polar grid of facets with the slots left open; a raised lip round each slot hides the grid's edge
    nr, na = 36, 288
    V = []; F = []
    for i in range(nr):
        r0 = R * i / nr; r1 = R * (i + 1) / nr
        for j in range(na):
            a0 = 2 * PI * j / na; a1 = 2 * PI * (j + 1) / na
            rm = (r0 + r1) / 2; am = (a0 + a1) / 2
            if inside(rm * math.cos(am), rm * math.sin(am)):
                continue
            n = len(V)
            V += [(r0 * math.cos(a0), r0 * math.sin(a0), t), (r1 * math.cos(a0), r1 * math.sin(a0), t),
                  (r1 * math.cos(a1), r1 * math.sin(a1), t), (r0 * math.cos(a1), r0 * math.sin(a1), t)]
            F.append((n, n + 1, n + 2, n + 3))
    k.add('bronze', V, F)
    for cx, cy in rounds:                                                    # the round slots: wall, floor, lip
        k.push(T(cx, cy, 0))
        k.lathe('bronze', [(rs, t - dep), (rs, t)], seg=36, caps=False)
        k.lathe('dark', [(0.0, t - dep), (rs, t - dep)], seg=36, caps=False)
        k.lathe('bronze', [(rs, t), (rs, t + 0.0012), (rs + 0.0028, t + 0.0012), (rs + 0.0035, t)], seg=36, caps=False)
        k.pop()
    k.push(T(*npos, 0) @ Rz(up))                                            # the square slot
    for (x0, y0, x1, y1) in ((-hs - 0.003, -hs - 0.003, hs + 0.003, -hs), (-hs - 0.003, hs, hs + 0.003, hs + 0.003),
                             (-hs - 0.003, -hs, -hs, hs), (hs, -hs, hs + 0.003, hs)):
        k.box('bronze', x0, y0, t - dep, x1, y1, t + 0.0012)
    k.box('dark', -hs, -hs, t - dep, hs, hs, t - dep + 0.0005)
    k.pop()
    for side in (-1, 1):                                                     # lugs to lift it by
        k.push(Rz(PI / 2 + side * PI / 2 + 0.3)); k.box('bronze', R * 0.98, -0.012, 0.004, R * 1.12, 0.012, t - 0.002); k.pop()
    # the dies, standing proud of the back with the owner's initial on top; the number's square die
    def die(px, py, ch):
        k.push(T(px, py, 0)); k.lathe('bronze_die', [(0.0, t - dep), (rs - 0.0008, t - dep), (rs - 0.0008, t + 0.005), (rs - 0.002, t + 0.0065), (0.0, t + 0.0065)], seg=32); k.pop()
        text_mesh(k, 'dark', ch, rs * 1.15, px, py, t + 0.0065, rot=(0, 0, up), depth=0.0012)
    die(*mgr, mid)
    for b in ring:
        die(*pos[b], NAMES[b][0])
    k.push(T(*npos, 0) @ Rz(up)); k.box('bronze_die', -hs + 0.0008, -hs + 0.0008, t - dep, hs - 0.0008, hs - 0.0008, t + 0.0065); k.pop()
    text_mesh(k, 'dark', num, hs * 1.5, *npos, t + 0.0065, rot=(0, 0, up), depth=0.0012)
    # the wreath: one bronze ring with leaves on it, sized to sit over the lip of any round slot, so it goes round the
    # holder's signet wherever that signet is set, at a bench's place or in the middle
    k.push(T(*(mgr if hold == 'mid' else pos[hold]), 0))
    k.lathe('bronze_die', [(rs + 0.0036, t), (rs + 0.0075, t), (rs + 0.0075, t + 0.0022), (rs + 0.0036, t + 0.0022)], seg=40)
    wreath(k, rs + 0.0056, R * 0.6, t + 0.0022, 0.0035, n=11, mat='bronze_die')
    k.pop()
    k.pop()


def die_tray(k, x, y, z, letters):
    """A small box holding the signets that are not in the stamp, each a bronze die with its initial on top."""
    k.push(T(x, y, z))
    k.box('timber', -0.07, -0.05, 0, 0.07, 0.05, 0.012)
    for sx in (-1, 1):
        k.box('timber', sx * 0.07 - 0.006, -0.05, 0.012, sx * 0.07 + 0.006, 0.05, 0.035)
    for sy in (-1, 1):
        k.box('timber', -0.07, sy * 0.05 - 0.006, 0.012, 0.07, sy * 0.05 + 0.006, 0.035)
    for i, L in enumerate(letters):
        cx = -0.03 + 0.06 * i
        k.push(T(cx, 0, 0.012)); k.lathe('bronze', [(0.0, 0), (0.018, 0), (0.018, 0.02), (0.012, 0.03), (0.0, 0.03)], seg=20); k.pop()
        text_mesh(k, 'bronze', L, 0.02, cx, 0.0, 0.042 - 0.012, rot=(0, 0, -PI / 2), depth=0.0015)
    k.pop()


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
