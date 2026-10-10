"""The mason's kit shared by the detailed sets (paxos_chamber.py, schedia_tholos.py): a `Part` that
collects solids into one object, and the helpers that lay a building up piece by piece, so that
joints, flutes, tiles and slabs are geometry: curved blocks (`arc`), slabs on a cone (`slab`),
coursed ashlar in running bond (`courses`), rings of paving (`paving`) and a conical roof tile by
tile (`tiled`). A joint is a gap `GAP` wide showing a darker core behind blocks that stand `PROUD`
of it. glTF carries no procedural shading, so everything is geometry and flat colour.

For the straight-walled sets (libraries.py, stoa.py, terraces.py) there are also: boxes by their
corners (`bx`) or along any three axes (`tilted`), a wall face of coursed blocks (`ashlar`) or of
rubble (`rubble`), a floor of flagstones (`flags`), a roof plane tile by tile (`roof_plane`), a
plain column of drums (`doric`) and a boarded door leaf (`leaf`). A set of many buildings lays
each one up in its own frame and then stands it at its site with `Part.place`.
"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix

SEG = 96
FULL = 2 * math.pi
GAP = 0.018            # a joint's width
PROUD = 0.015          # how far a block stands out from its joints
rnd = random.Random(7)


def material(name, rgb, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


class Part:
    """Collects solids (as bmesh geometry) into one object, one material slot each."""
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def face(self, vs, s, smooth=False):
        f = self.bm.faces.new(vs)
        f.material_index, f.smooth = s, smooth

    def paint(self, g, mat):
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def grid(self, pts, mat, closed_u=False, cap=True, smooth=False):
        """pts[i][j]: a solid swept as rows i of rings j; rows wrap into a closed tube."""
        s = self.slot(mat)
        vs = [[self.bm.verts.new(p) for p in row] for row in pts]
        n, m = len(vs), len(vs[0])
        for i in range(n):
            a, b = vs[i], vs[(i + 1) % n]
            for j in range(m if closed_u else m - 1):
                self.face((a[j], a[(j + 1) % m], b[(j + 1) % m], b[j]), s, smooth)
        if cap and not closed_u:
            for end in (0, m - 1):
                self.face([vs[i][end] for i in range(n)][::(1 if end else -1)], s)

    def box(self, c, size, mat, yaw=0.0):
        M = Matrix.Translation(Vector(c)) @ Matrix.Rotation(yaw, 4, "Z")
        self.paint(bmesh.ops.create_cube(self.bm, size=1.0, matrix=M @ Matrix.Diagonal((*size, 1))), mat)

    def strut(self, p0, p1, w, h, mat):
        """A beam from p0 to p1, w wide (across the plan) and h deep."""
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        M = Matrix.Translation((p0 + p1) / 2) @ d.to_track_quat("X", "Z").to_matrix().to_4x4()
        self.paint(bmesh.ops.create_cube(self.bm, size=1.0, matrix=M @ Matrix.Diagonal((d.length, w, h, 1))), mat)

    def cyl(self, c, r0, r1, h, mat, segs=20):
        self.paint(bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r0, radius2=r1, depth=h,
                                         matrix=Matrix.Translation(Vector(c) + Vector((0, 0, h / 2)))), mat)

    def disc(self, c, r, thick, axis, mat, segs=12):
        """A short cylinder centred on c with its axis along `axis`."""
        M = Matrix.Translation(Vector(c)) @ Vector(axis).to_track_quat("Z", "Y").to_matrix().to_4x4()
        self.paint(bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r, radius2=r,
                                         depth=thick, matrix=M), mat)

    def sphere(self, c, r, mat, squash=1.0, u=16, v=10):
        g = bmesh.ops.create_uvsphere(self.bm, u_segments=u, v_segments=v, radius=r,
                                      matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((1, 1, squash, 1)))
        self.paint(g, mat)
        for f in {f for v_ in g["verts"] for f in v_.link_faces}:
            f.smooth = True

    def lathe(self, prof, c, mat, segs=32, squash=1.0, yaw=0.0):
        """A profile of (r, z) points turned about the vertical through c, capped at both ends;
        `squash` flattens it front to back (for a figure), `yaw` then turns it."""
        s = self.slot(mat)
        M = Matrix.Translation(Vector(c)) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Diagonal((squash, 1, 1, 1))
        rings = [[self.bm.verts.new(M @ Vector((r * math.cos(FULL * k / segs), r * math.sin(FULL * k / segs), z)))
                  for k in range(segs)] for r, z in prof]
        for a, b in zip(rings, rings[1:]):
            for k in range(segs):
                self.face((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]), s, True)
        self.face(rings[0][::-1], s)
        self.face(rings[-1], s)

    def shaft(self, c, r0, r1, z0, z1, flutes, mat, fillet=False):
        """A fluted column shaft, tapering from r0 to r1 with a slight swelling. Doric flutes
        meet in a sharp arris; with `fillet` a flat strip is left between them."""
        s = self.slot(mat)
        cut = ((0.0, 0.0), (0.22, 0.0), (0.36, 0.055), (0.61, 0.09), (0.86, 0.055)) if fillet else \
              ((0.0, 0.0), (0.25, 0.045), (0.5, 0.065), (0.75, 0.045))
        rings, nz = [], 7
        for i in range(nz + 1):
            t = i / nz
            r = r0 + (r1 - r0) * t + 0.012 * r0 * math.sin(math.pi * t)
            rings.append([self.bm.verts.new(Vector(c) + Vector((r * (1 - d) * math.cos(FULL * (k + u) / flutes),
                                                                r * (1 - d) * math.sin(FULL * (k + u) / flutes),
                                                                z0 + (z1 - z0) * t)))
                          for k in range(flutes) for u, d in cut])
        n = len(rings[0])
        for a, b in zip(rings, rings[1:]):
            for k in range(n):
                self.face((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]), s)
        self.face(rings[0][::-1], s)
        self.face(rings[-1], s)

    def prism(self, pts, z0, z1, mat):
        """A plan polygon of (x, y) points raised from z0 to z1."""
        s = self.slot(mat)
        lo = [self.bm.verts.new((x, y, z0)) for x, y in pts]
        hi = [self.bm.verts.new((x, y, z1)) for x, y in pts]
        n = len(pts)
        for k in range(n):
            self.face((lo[k], lo[(k + 1) % n], hi[(k + 1) % n], hi[k]), s)
        self.face(lo[::-1], s)
        self.face(hi, s)

    def place(self, M):
        """Move everything added since the last call by M: a building laid up in its own frame
        is stood at its site."""
        for v in self.bm.verts:
            if not v.tag:
                v.co = M @ v.co
                v.tag = True

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        for e in self.bm.edges:                      # smooth only across gentle bends
            fs = e.link_faces
            if len(fs) != 2 or not (fs[0].smooth and fs[1].smooth) or e.calc_face_angle(0) > math.radians(38):
                e.smooth = False
        self.bm.to_mesh(me)
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        return o


def arc(r_in, r_out, a0, a1, z0, z1, segs=None):
    """Points of a curved wall piece between angles a0..a1: rows inner-bottom, outer-bottom,
    outer-top, inner-top."""
    n = segs or max(3, int(abs(a1 - a0) / FULL * SEG * 1.5) + 2)
    ang = [a0 + (a1 - a0) * j / (n - 1) for j in range(n)]
    ring = lambda r, z: [(r * math.cos(a), r * math.sin(a), z) for a in ang]
    return [ring(r_in, z0), ring(r_out, z0), ring(r_out, z1), ring(r_in, z1)]


def slab(part, rA, zA, rB, zB, a0, a1, o0, o1, mat, na=None, wrap=False, oB=None):
    """A slab on the cone running from (rA, zA) at its foot to (rB, zB) at its head, between
    angles a0..a1, from o0 to o1 measured out along the cone's normal (`oB`: other offsets at
    the head, for a tile that lies tilted on the one below)."""
    L = math.hypot(rB - rA, zB - zA)
    nr, nz = (zB - zA) / L, (rA - rB) / L                    # the outward normal in (r, z)
    b0, b1 = oB or (o0, o1)
    n = na or max(2, int(abs(a1 - a0) / FULL * SEG) + 2)
    ang = [a0 + (a1 - a0) * j / (n if wrap else n - 1) for j in range(n)]
    ring = lambda r, z, o: [((r + o * nr) * math.cos(a), (r + o * nr) * math.sin(a), z + o * nz) for a in ang]
    part.grid([ring(rA, zA, o0), ring(rA, zA, o1), ring(rB, zB, b1), ring(rB, zB, b0)], mat, closed_u=wrap)


def courses(part, r0, r1, a0, a1, zs, length, mats, gap=GAP):
    """Blocks in running bond between radii r0..r1 and angles a0..a1, one course between each
    pair of heights in zs, each block `length` long, with a joint's gap left all round."""
    full = abs(a1 - a0 - FULL) < 1e-6
    rm = max(r0, r1)
    for c, (z0, z1) in enumerate(zip(zs, zs[1:])):
        n = max(1, round((a1 - a0) * rm / length))
        da = (a1 - a0) / n
        if full:
            edges = [a0 + da * (k + 0.5 * (c % 2)) for k in range(n + 1)]
        elif c % 2:
            edges = [a0] + [a0 + da * (k + 0.5) for k in range(n)] + [a1]
        else:
            edges = [a0 + da * k for k in range(n + 1)]
        for e0, e1 in zip(edges, edges[1:]):
            part.grid(arc(r0, r1, e0 + gap / 2 / rm, e1 - gap / 2 / rm, z0 + gap / 2, z1 - gap / 2), rnd.choice(mats))


def paving(part, r0, r1, n, z0, z1, mats, a0=0.0, a1=FULL, off=0.0, gap=0.012):
    """A ring of n slabs between radii r0 < r1."""
    da = (a1 - a0) / n
    for k in range(n):
        part.grid(arc(r0 + gap / 2, r1 - gap / 2, a0 + da * (k + off) + gap / 2 / r1,
                      a0 + da * (k + 1 + off) - gap / 2 / r1, z0, z1), rnd.choice(mats))


def tiled(part, rA, zA, rB, zB, n0, course, cover, tiles, ridges, deck):
    """A conical roof from its eaves (rA, zA) to its head (rB, zB), tile by tile: courses of
    tapered pans, each lying tilted on the course below, and a cover tile over every joint.
    There are n0 pans round the eaves, and half as many wherever they would grow too narrow."""
    L = math.hypot(rB - rA, zB - zA)
    nc = max(1, round(L / course))
    slab(part, rA, zA, rB, zB, 0, FULL, -0.04, 0.02, deck, na=SEG, wrap=True)          # the boarding beneath
    for c in range(nc):
        t0, t1 = c / nc, min(1.0, (c + 1) / nc + 0.03)
        r0, z0, r1, z1 = rA + (rB - rA) * t0, zA + (zB - zA) * t0, rA + (rB - rA) * t1, zA + (zB - zA) * t1
        rm, n = (r0 + r1) / 2, n0
        while n > 12 and FULL * rm / n < 0.3:
            n //= 2
        w = cover / 2 / rm
        for k in range(n):
            a0, a1 = FULL * k / n, FULL * (k + 1) / n
            slab(part, r0, z0, r1, z1, a0, a1, 0.06, 0.1, rnd.choice(tiles), na=2, oB=(0.0, 0.04))
            m = rnd.choice(ridges)
            slab(part, r0, z0, r1, z1, a0 - w, a0 + w, 0.1, 0.16, m, na=2, oB=(0.04, 0.1))
            slab(part, r0, z0, r1, z1, a0 - w / 2, a0 + w / 2, 0.16, 0.19, m, na=2, oB=(0.1, 0.13))
    nr, nz = (zB - zA) / L, (rA - rB) / L
    for k in range(n0):                                                                  # an antefix at each eave end
        a = FULL * k / n0
        c = Vector(((rA + 0.2 * nr) * math.cos(a), (rA + 0.2 * nr) * math.sin(a), zA + 0.2 * nz))
        rad = Vector((math.cos(a), math.sin(a), 0))
        part.box(c, (0.05, cover + 0.04, 0.16), ridges[0], yaw=a)
        part.disc(c + Vector((0, 0, 0.08)), cover / 2 + 0.02, 0.05, rad, ridges[0], 10)


polar = lambda r, a, z=0.0: Vector((r * math.cos(a), r * math.sin(a), z))


# --- straight work --------------------------------------------------------------------------
def bx(part, lo, hi, mat):
    """An axis-aligned box from corner lo to corner hi."""
    part.box([(a + b) / 2 for a, b in zip(lo, hi)], [abs(b - a) for a, b in zip(lo, hi)], mat)


def tilted(part, c, u, v, n, size, mat):
    """A box centred on c with its edges along the unit vectors u, v, n."""
    M = Matrix.Translation(Vector(c)) @ Matrix([u, v, n]).transposed().to_4x4()
    part.paint(bmesh.ops.create_cube(part.bm, size=1.0, matrix=M @ Matrix.Diagonal((*size, 1))), mat)


def lengths(a, b, lo, hi, rng, close=0.15):
    """Cut a..b into lengths between lo and hi, with no sliver left at the end."""
    out, u = [], a
    while u < b - 1e-6:
        L = min(rng.uniform(lo, hi), b - u)
        if b - u - L < close:
            L = b - u
        out.append((u, u + L))
        u += L
    return out


def ashlar(part, p0, u, length, zs, block, mats, joint, rng=rnd, out=None, depth=0.12, bond=0.5, rake=None):
    """A wall face of coursed blocks in running bond: from p0 along the unit vector u for
    `length`, one course between each pair of heights in zs (measured from p0), every block
    about `block` long and `depth` thick, standing out from the plane towards `out` (u turned a
    quarter right if not given) over a core in the joint's colour. Under a sloping roof, `rake`
    (the wall's height at p0, and its rise per metre along) stops each course where the slope
    cuts it; the wall behind is then the caller's to build."""
    p0, u = Vector(p0), Vector(u).normalized()
    out = Vector(out) if out else Vector((u.y, -u.x, 0))
    yaw = math.atan2(u.y, u.x)
    if not rake:
        part.box(p0 + u * (length / 2) + out * ((depth - PROUD) / 2) + Vector((0, 0, (zs[0] + zs[-1]) / 2)),
                 (length - 0.004, depth - PROUD, zs[-1] - zs[0] - 0.004), joint, yaw=yaw)
    n = max(1, round(length / block))
    for c, (z0, z1) in enumerate(zip(zs, zs[1:])):
        w = length / n
        edges = [0.0] + [w * (k + bond) for k in range(n)] + [length] if c % 2 else [w * k for k in range(n + 1)]
        for a, b in zip(edges, edges[1:]):
            if rake and rake[1]:                       # keep only where the slope is above this course
                cut = (z1 - rake[0]) / rake[1]
                a, b = (max(a, cut), b) if rake[1] > 0 else (a, min(b, cut))
            if b - a < 0.05:
                continue
            part.box(p0 + u * ((a + b) / 2) + out * (depth / 2) + Vector((0, 0, (z0 + z1) / 2)),
                     (b - a - GAP, depth, z1 - z0 - GAP), rng.choice(mats), yaw=yaw)


def rubble(part, p0, u, length, z0, z1, mats, joint, rng=rnd, out=None, course=0.22, stone=(0.22, 0.6)):
    """A wall face of rubble: rough courses of uneven stones, each standing out a different
    amount from a dark bed, from p0 along u for `length`, between heights z0 and z1."""
    p0, u = Vector(p0), Vector(u).normalized()
    out = Vector(out) if out else Vector((u.y, -u.x, 0))
    yaw = math.atan2(u.y, u.x)
    part.box(p0 + u * (length / 2) + out * 0.02 + Vector((0, 0, (z0 + z1) / 2)), (length, 0.04, z1 - z0), joint, yaw=yaw)
    n = max(1, round((z1 - z0) / course))
    edges = [z0] + sorted(z0 + (z1 - z0) * (k + rng.uniform(-0.18, 0.18)) / n for k in range(1, n)) + [z1]
    for w0, w1 in zip(edges, edges[1:]):
        for a, b in lengths(0.0, length, *stone, rng):
            d = rng.uniform(0.05, 0.1)
            part.box(p0 + u * ((a + b) / 2) + out * (d / 2) + Vector((0, 0, (w0 + w1) / 2)),
                     (b - a - 0.024, d, w1 - w0 - 0.022), rng.choice(mats), yaw=yaw)


def flags(part, x0, x1, y0, y1, z, mats, rng=rnd, row=0.7, size=(0.7, 1.3), thick=0.04, gap=0.012, bed=None):
    """A floor of flagstones between the corners, its top at z: rows across Y, each breaking
    joint with the last, over a bed in the joint's colour if one is given."""
    if bed:
        bx(part, (x0, y0, z - thick), (x1, y1, z - 0.008), bed)
    n = max(1, round((y1 - y0) / row))
    for r in range(n):
        ya, yb = y0 + (y1 - y0) * r / n, y0 + (y1 - y0) * (r + 1) / n
        for a, b in lengths(x0, x1, *size, rng, close=0.4):
            bx(part, (a + gap / 2, ya + gap / 2, z - thick), (b - gap / 2, yb - gap / 2, z), rng.choice(mats))


def roof_plane(part, p0, along, slope, width, length, tiles, covers, deck, rng=rnd, keep=None,
               antefix=True, pan=0.42, course=0.62):
    """A roof plane tile by tile. p0 is one end of its eave, `along` the unit vector along the
    eave and `slope` the unit vector up the roof; the plane is `width` along the eave and
    `length` up the slope. Boarding, then courses of pans each lying a little tilted on the one
    below, a cover tile over every joint, and an antefix at each eave end. `keep(a, s)` may
    leave out what lies under another roof (a along the eave, s up the slope)."""
    p0, xu, sl = Vector(p0), Vector(along).normalized(), Vector(slope).normalized()
    up = xu.cross(sl)
    if up.z < 0:
        up = -up
    keep = keep or (lambda a, s: True)
    n, rows = max(1, round(width / pan)), max(1, round(length / course))
    w, h = width / n, length / rows
    t = math.radians(3.5)
    sl2, up2 = sl * math.cos(t) - up * math.sin(t), up * math.cos(t) + sl * math.sin(t)

    def runs(a):
        """The stretches up the slope that are kept, at the place a along the eave."""
        out, r0 = [], None
        for r in range(rows + 1):
            ok = r < rows and keep(a, h * (r + 0.5))
            if ok and r0 is None:
                r0 = r
            if not ok and r0 is not None:
                out.append((r0 * h, r * h))
                r0 = None
        return out

    for k in range(n):
        a = w * (k + 0.5)
        for s0, s1 in runs(a):
            tilted(part, p0 + xu * a + sl * ((s0 + s1) / 2) + up * 0.025, xu, sl, up, (w, s1 - s0, 0.05), deck)
        for r in range(rows):
            if keep(a, h * (r + 0.5)):
                tilted(part, p0 + xu * a + sl * (h * (r + 0.5)) + up * 0.085, xu, sl2, up2,
                       (w - 0.008, h + 0.05, 0.035), rng.choice(tiles))
    for k in range(n + 1):
        a, m = w * k, rng.choice(covers)
        ar = min(max(a, w * 0.5), width - w * 0.5)         # judge an end cover by the pan beside it
        for s0, s1 in runs(ar):
            c = p0 + xu * a + sl * ((s0 + s1) / 2) + up * 0.135
            tilted(part, c, xu, sl, up, (0.14, s1 - s0, 0.06), m)
            tilted(part, c + up * 0.045, xu, sl, up, (0.075, s1 - s0, 0.03), m)
            if antefix and s0 == 0.0:
                e = p0 + xu * a + up * 0.15 - sl * 0.02
                part.box(e, (0.16, 0.05, 0.15), covers[0], yaw=math.atan2(xu.y, xu.x))
                part.disc(e + Vector((0, 0, 0.075)), 0.08, 0.05, (xu.y, -xu.x, 0), covers[0], 10)


def doric(part, c, d0, d1, height, drums, mats, joint, cap, rng=rnd, segs=22):
    """A plain Doric column standing on c, `height` tall with its capital: unfluted drums with
    a joint between each, tapering from d0 to d1 across, three annulets, an echinus, an abacus."""
    c = Vector(c)
    ab = 0.16 * d0 / 0.44 + 0.06
    z1 = height - ab - 0.21
    for k in range(drums):
        t0, t1 = k / drums, (k + 1) / drums
        part.lathe([(d0 / 2 + (d1 - d0) / 2 * t0, z1 * t0 + 0.006), (d0 / 2 + (d1 - d0) / 2 * t1, z1 * t1 - 0.006)],
                   c, rng.choice(mats), segs)
    part.cyl(c, d1 / 2 - 0.02, d1 / 2 - 0.02, z1, joint, 16)
    r = d1 / 2
    part.lathe([(r, z1), (r + 0.012, z1 + 0.02), (r, z1 + 0.04), (r + 0.012, z1 + 0.06), (r + 0.004, z1 + 0.08),
                (r * 1.22, z1 + 0.14), (r * 1.46, z1 + 0.19), (r * 1.5, z1 + 0.21)], c, cap, segs)
    part.box(c + Vector((0, 0, height - ab / 2)), (r * 3.1, r * 3.1, ab), cap)


def leaf(part, hinge, u, width, height, z0, boards, back, ledge, stud=None, nb=4):
    """A door leaf of upright boards on three ledges, from its hinge edge along the unit vector
    u; the ledges are on the side the normal (u turned a quarter left) points to, and a row of
    studs, if any, on the other. `boards`: the two tones the boards alternate between."""
    u = Vector(u).normalized()
    nrm = Vector((-u.y, u.x, 0))
    yaw = math.atan2(u.y, u.x)
    at = lambda a, z, o=0.0: Vector(hinge) + u * a + nrm * o + Vector((0, 0, z0 + z))
    for k in range(nb):
        part.box(at(width * (k + 0.5) / nb, height / 2), (width / nb - 0.008, 0.05, height), boards[k % 2], yaw=yaw)
    part.box(at(width / 2, height / 2), (width - 0.01, 0.03, height - 0.02), back, yaw=yaw)
    for z in (0.35, height / 2, height - 0.35):
        part.box(at(width / 2, z, 0.045), (width - 0.06, 0.04, 0.14), ledge, yaw=yaw)
        if stud:
            for k in range(nb):
                part.sphere(at(width * (k + 0.5) / nb, z, -0.03), 0.02, stud, 1.0, 8, 5)
