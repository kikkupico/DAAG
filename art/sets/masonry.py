"""The mason's kit shared by the detailed sets (paxos_chamber.py, schedia_tholos.py): a `Part` that
collects solids into one object, and the helpers that lay a building up piece by piece, so that
joints, flutes, tiles and slabs are geometry: curved blocks (`arc`), slabs on a cone (`slab`),
coursed ashlar in running bond (`courses`), rings of paving (`paving`) and a conical roof tile by
tile (`tiled`). A joint is a gap `GAP` wide showing a darker core behind blocks that stand `PROUD`
of it. glTF carries no procedural shading, so everything is geometry and flat colour.
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
