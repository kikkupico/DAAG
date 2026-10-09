"""The Chamber of Paxos, modelled on the Tholos of Epidaurus, in enough detail that a previs render
already shows every part of the building: nothing of it is left for an image model to make up.

    blender -b -P art/sets/paxos_chamber.py [-- key=value ...]

Writes art/sets/paxos-chamber.glb and paxos-chamber.json.
Epidaurus's shape and scale: a drum of white marble inside a peripteral Doric colonnade (26 columns,
the middle bay wider) on a three-step base, about 21 m across the stylobate, with a ramp up to the
one doorway; a lean-to pan-tile roof from the colonnade up to the drum, one conical roof over the
drum with a lantern, and a checkerboard of pale marble and dark limestone inside the inner colonnade.
Inside the drum a ring of ten slender Corinthian columns (Epidaurus has fourteen) holds the timber
beams that carry the roof; the middle of the room is clear, and the aisle between the ring and the
wall is where people sit. A shallow coffered ceiling with a bronze-ringed oculus hides the rafters,
as Epidaurus's coffers did, and the beams run beneath it. The doorway (on the +x axis, looking
south in the set frame) has a pair of panelled timber leaves bossed with bronze, swinging inward,
with a lock plate and keyhole, a bolt and its keeper (`door_open` is the angle in degrees; 0 is
shut). Stone seating, a slab-jointed bench with a marble cap, is built against the wall all round
and broken only by the doorway (no desks); a bronze meridian runs through the doorway, lit by the
sun at noon; statues stand on the terrace.

What is modelled, so that it need not be described to an image model:
- the walls, inside and out, as coursed ashlar: tall orthostates, a string course, then even
  courses in running bond, every block set a little proud of its joints and in one of three
  shades of marble; a crown moulding under the ceiling;
- the inner columns as Corinthian: an Attic base on a plinth, a shaft of 24 flutes, a bell with
  two rows of acanthus leaves, corner volutes and a concave abacus with a flower on each side;
- the outer columns as Doric: no base, 20 flutes meeting in arrises, annulets, echinus, abacus;
  above them an architrave with taenia, regulae and guttae, a frieze of triglyphs and plain
  metopes, and a cornice with mutules; a coffered marble ceiling over the walk;
- the ceiling inside as five rings of deep stepped coffers, each with a bronze rosette, round an
  oculus with a bronze rim under a plastered well that rises to the lantern;
- the roof beams: a ring of squared timbers from capital to capital and one from each capital to
  a marble corbel in the wall;
- the doorway with a three-fascia marble frame and a cornice on both faces (on consoles outside),
  marble reveals and a raised threshold; each leaf framed in stiles and rails round three panels;
- both roofs tile by tile: tapered pans in courses, a cover tile over each joint, an antefix at
  each eave end; the lantern with posts, louvres, a tiled cap and a bronze finial;
- every floor as slabs with joints: the checkerboard, the aisle, the walk under the colonnade,
  the steps, the ramp with its kerbs, the terrace.
A joint is a gap about two fingers wide showing a darker stone behind, wide enough to read in a
render taken from across the room. glTF carries no procedural shading, so all of this is geometry
and flat colour.

The GLB is in the set's frame: metres, centre of the floor at the origin, axes as explorer.html's
(north = -X); objects `shell`, `floor`, `furniture` and `door` (the leaves, hardware included).
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix

P = dict(
    radius=5.9,        # inside of the drum
    wall=0.7,          # drum wall thickness
    base=0.6,          # the three-step base the floor stands on
    drum_h=8.8,        # floor to the eaves of the conical roof
    roof_rise=3.8,     # the cone's rise above its eaves
    roof_eave=0.8,     # how far the eaves overhang the drum
    apex_r=0.9,        # the cone stops at the lantern, this far from the axis
    tiles=96,          # cover tiles round the roof's eaves
    inner_cols=10, inner_r=4.0, inner_d=0.62,       # the inner colonnade, holding the roof beams
    door_w=2.2, door_h=4.4, door_open=70.0,   # the one doorway, on the +x axis; leaves swing inward
    columns=26, col_r=9.8, col_d=0.9, col_h=5.5,     # the colonnade outside
    entab_h=1.05, peri_r=10.4,                       # its entablature and roof's outer edge
    bench_d=0.55, checker=1, meridian=1,              # the stone seating against the wall: its depth
    statues=10, statue_r=11.7, terrace=12.5,         # pedestals round the terrace; its paving
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T, B = P["radius"], P["wall"], P["base"]
RO = R + T
H = P["drum_h"]
SEG = 96
FULL = 2 * math.pi
GAP = 0.018            # a joint's width
PROUD = 0.015          # how far a block stands out from its joints
rnd = random.Random(7)

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


MARBLE = material("marble", (0.86, 0.84, 0.8), 0.45)
MARBLE_B = material("marble_b", (0.81, 0.79, 0.74), 0.5)
MARBLE_C = material("marble_c", (0.89, 0.87, 0.84), 0.45)
ASHLAR = [MARBLE, MARBLE, MARBLE_B, MARBLE_C]
JOINT = material("joint", (0.4, 0.37, 0.33), 0.9)
COFFER = material("coffer", (0.6, 0.57, 0.52), 0.85)
PLASTER = material("plaster", (0.9, 0.88, 0.82), 0.9)
SEAT = material("seat", (0.64, 0.6, 0.53), 0.75)
SEAT_B = material("seat_b", (0.6, 0.56, 0.5), 0.75)
TILES = [material("tile", (0.52, 0.2, 0.15), 0.8), material("tile_b", (0.56, 0.24, 0.17), 0.8),
         material("tile_c", (0.47, 0.18, 0.14), 0.8)]
RIDGES = [material("tile_ridge", (0.42, 0.15, 0.11), 0.8), material("tile_ridge_b", (0.46, 0.18, 0.13), 0.8)]
FLOOR = material("floor", (0.86, 0.84, 0.8), 0.3)
FLOOR_B = material("floor_b", (0.8, 0.78, 0.73), 0.3)
PAVING = [material("terrace", (0.7, 0.67, 0.6), 0.9), material("terrace_b", (0.65, 0.62, 0.56), 0.9),
          material("terrace_c", (0.74, 0.71, 0.65), 0.9)]
DARK = material("limestone", (0.16, 0.16, 0.17), 0.35)
RED = material("porphyry", (0.4, 0.14, 0.12), 0.3)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)
WOOD = material("wood", (0.33, 0.2, 0.1), 0.7)
WOOD_B = material("wood_panel", (0.27, 0.16, 0.08), 0.7)


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


def tiled(part, rA, zA, rB, zB, n0, course, cover):
    """A conical roof from its eaves (rA, zA) to its head (rB, zB), tile by tile: courses of
    tapered pans, each lying tilted on the course below, and a cover tile over every joint.
    There are n0 pans round the eaves, and half as many wherever they would grow too narrow."""
    L = math.hypot(rB - rA, zB - zA)
    nc = max(1, round(L / course))
    slab(part, rA, zA, rB, zB, 0, FULL, -0.04, 0.02, WOOD, na=SEG, wrap=True)          # the boarding beneath
    for c in range(nc):
        t0, t1 = c / nc, min(1.0, (c + 1) / nc + 0.03)
        r0, z0, r1, z1 = rA + (rB - rA) * t0, zA + (zB - zA) * t0, rA + (rB - rA) * t1, zA + (zB - zA) * t1
        rm, n = (r0 + r1) / 2, n0
        while n > 12 and FULL * rm / n < 0.3:
            n //= 2
        w = cover / 2 / rm
        for k in range(n):
            a0, a1 = FULL * k / n, FULL * (k + 1) / n
            slab(part, r0, z0, r1, z1, a0, a1, 0.06, 0.1, rnd.choice(TILES), na=2, oB=(0.0, 0.04))
            m = rnd.choice(RIDGES)
            slab(part, r0, z0, r1, z1, a0 - w, a0 + w, 0.1, 0.16, m, na=2, oB=(0.04, 0.1))
            slab(part, r0, z0, r1, z1, a0 - w / 2, a0 + w / 2, 0.16, 0.19, m, na=2, oB=(0.1, 0.13))
    nr, nz = (zB - zA) / L, (rA - rB) / L
    for k in range(n0):                                                                  # an antefix at each eave end
        a = FULL * k / n0
        c = Vector(((rA + 0.2 * nr) * math.cos(a), (rA + 0.2 * nr) * math.sin(a), zA + 0.2 * nz))
        rad = Vector((math.cos(a), math.sin(a), 0))
        part.box(c, (0.05, cover + 0.04, 0.16), RIDGES[0], yaw=a)
        part.disc(c + Vector((0, 0, 0.08)), cover / 2 + 0.02, 0.05, rad, RIDGES[0], 10)


polar = lambda r, a, z=0.0: Vector((r * math.cos(a), r * math.sin(a), z))
shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- the base: terrace paving, three steps, the walk under the colonnade ----------------------
# Everything walked on is slabs with their tops level, over a darker bed that shows in the joints.
PR = P["peri_r"]
step_r = [PR + 0.85 - 0.3 * k for k in range(3)]                   # the steps' outer edges
floor.grid(arc(0.0, P["terrace"], 0, FULL, -B - 0.3, -B - 0.01, SEG + 1), JOINT)
mid_t = (step_r[0] - 0.1 + P["terrace"]) / 2
paving(floor, step_r[0] - 0.1, mid_t, 68, -B - 0.01, -B, PAVING)
paving(floor, mid_t, P["terrace"] - 0.14, 74, -B - 0.01, -B, PAVING, off=0.5)
paving(floor, P["terrace"] - 0.14, P["terrace"] + 0.01, 90, -B - 0.3, -B + 0.02, [MARBLE_B], off=0.3)   # a kerb
for k in range(3):
    z0, z1 = -B + B * k / 3, -B + B * (k + 1) / 3
    floor.grid(arc(0.0, step_r[k] - PROUD, 0, FULL, z0, z1 - 0.008, SEG + 1), JOINT)
    if k < 2:
        paving(floor, step_r[k] - 0.5, step_r[k], 60, z0, z1, ASHLAR, off=0.5 * k, gap=GAP)
paving(floor, 9.3, step_r[2], 54, -B / 3, 0.0, ASHLAR, off=0.25, gap=GAP)              # the stylobate
paving(floor, 7.95, 9.3, 48, -0.008, 0.0, [FLOOR, FLOOR_B], gap=0.016)
paving(floor, RO - 0.1, 7.95, 40, -0.008, 0.0, [FLOOR, FLOOR_B], off=0.5, gap=0.016)

# --- the drum: a core that shows in the joints, faced with ashlar inside and out --------------
half = math.asin(P["door_w"] / 2 / R)                       # the doorway's half-angle at the inner face
half_o = math.asin(P["door_w"] / 2 / RO)
FRAME = 0.3                                                 # the door frame's width
shell.grid(arc(R, RO, half, FULL - half, 0, H), JOINT)
shell.grid(arc(R, RO, -half, half, P["door_h"], H, 5), JOINT)
Z_STRING = 1.75                                             # the top of the orthostates
N_C = 13
Z_TOP = H - 0.75                                            # the top of the coursed wall inside
course_h = (Z_TOP - Z_STRING - 0.12) / N_C
zs = [Z_STRING + 0.12 + course_h * k for k in range(N_C + 1)]
k_door = min(range(N_C + 1), key=lambda k: abs(zs[k] - (P["door_h"] + 0.32)))
DOOR_TOP = zs[k_door]                                       # the top of the frame's cornice, on a course line
for face, rr, hh in ((-1, R, half), (1, RO, half_o)):
    r0, r1 = (rr - PROUD, rr + 0.02) if face < 0 else (rr - 0.02, rr + PROUD)
    side = hh + FRAME / rr
    top = zs + ([H - 0.3] if face > 0 else [])
    courses(shell, r0, r1, side, FULL - side, [0.0, Z_STRING], 1.15, ASHLAR)                 # orthostates
    courses(shell, r0 - 0.035 * (face < 0), r1 + 0.035 * (face > 0), side, FULL - side,
            [Z_STRING, Z_STRING + 0.12], 2.3, [MARBLE_C])                                    # the string course
    courses(shell, r0, r1, side, FULL - side, zs[:k_door + 1], 1.3, ASHLAR)
    courses(shell, r0, r1, 0, FULL, top[k_door:], 1.3, ASHLAR)
courses(shell, RO - 0.02, RO + 0.07, half_o + FRAME / RO, FULL - half_o - FRAME / RO, [0.0, 0.28], 1.15, [MARBLE_C])  # a base moulding outside
# inside: a crown moulding under the ceiling; outside: a cornice under the eaves
shell.grid(arc(R - 0.07, R, 0, FULL, Z_TOP, Z_TOP + 0.1, SEG + 1), MARBLE_C)
shell.grid(arc(R - 0.12, R, 0, FULL, H - 0.3, H - 0.17, SEG + 1), MARBLE)
shell.grid(arc(R - 0.2, R, 0, FULL, H - 0.17, H - 0.05, SEG + 1), MARBLE_C)
courses(shell, R - PROUD, R + 0.02, 0, FULL, [Z_TOP + 0.1, H - 0.3], 1.3, ASHLAR)
shell.grid(arc(RO, RO + 0.14, 0, FULL, H - 0.3, H - 0.14, SEG + 1), MARBLE_C)
shell.grid(arc(RO, RO + 0.25, 0, FULL, H - 0.14, H, SEG + 1), MARBLE)

# --- the doorway: marble reveals and lintel, a three-fascia frame and a cornice on each face ----
dw, dh = P["door_w"], P["door_h"]
xi, xo = math.sqrt(R * R - dw * dw / 4) - 0.04, math.sqrt(RO * RO - dw * dw / 4) + 0.04
for s_ in (1, -1):                                          # the reveals, square to the door
    hi_, ho_ = half + 0.14 / R, half_o + 0.14 / RO
    pts = [(xi, s_ * dw / 2), (xo, s_ * dw / 2), (RO * math.cos(ho_) + 0.03, s_ * RO * math.sin(ho_)),
           (R * math.cos(hi_) - 0.03, s_ * R * math.sin(hi_))]
    shell.prism(pts[::s_], 0.0, dh, MARBLE)
lin = [polar(R - 0.03, half * (1 - 2 * j / 6)) for j in range(7)] + [polar(RO + 0.03, -half_o * (1 - 2 * j / 6)) for j in range(7)]
shell.prism([(p.x, p.y) for p in lin], dh, dh + 0.3, MARBLE_C)                                  # the lintel's soffit
for face, rr, hh in ((-1, R, half), (1, RO, half_o)):
    out = lambda d: (rr - d, rr) if face < 0 else (rr, rr + d)
    for w0, w1, d in ((0.0, 0.11, 0.035), (0.1, 0.21, 0.055), (0.2, FRAME, 0.085)):          # three fasciae
        for s_ in (1, -1):
            a0, a1 = sorted((s_ * (hh + w0 / rr), s_ * (hh + w1 / rr)))
            shell.grid(arc(*out(d), a0, a1, 0.0, dh + w1), MARBLE_C if d > 0.06 else MARBLE)
        shell.grid(arc(*out(d), -(hh + w1 / rr), hh + w1 / rr, dh + w0, dh + w1, 9), MARBLE_C if d > 0.06 else MARBLE)
    ear = hh + (FRAME + 0.1) / rr
    shell.grid(arc(*out(0.1), -ear, ear, dh + 0.22, dh + 0.3, 9), MARBLE_C)                    # the lintel's ears
    shell.grid(arc(*out(0.2), -ear - 0.06 / rr, ear + 0.06 / rr, dh + 0.3, DOOR_TOP, 9), MARBLE)   # its cornice
    if face > 0:
        for s_ in (1, -1):                                                                     # consoles
            a = s_ * (hh + (FRAME + 0.02) / rr)
            shell.box(polar(rr + 0.07, a, dh + 0.14), (0.14, 0.12, 0.3), MARBLE_C, yaw=a)
            shell.box(polar(rr + 0.05, a, dh - 0.08), (0.1, 0.1, 0.16), MARBLE_C, yaw=a)
floor.box((R + T / 2, 0, -0.04), (xo - xi + 0.3, dw, 0.12), MARBLE_B)                          # the threshold, a little raised
floor.box((R + T / 2, 0, 0.022), (0.06, dw - 0.1, 0.006), BRONZE)                              # the strip the leaves shut against

# --- the colonnade outside, its entablature, ceiling and roof ------------------------------------
cr, cd, ch = P["col_r"], P["col_d"], P["col_h"]
wide = 1.45                                       # the middle bay, in column spacings
step = FULL / (P["columns"] - 1 + wide)
col_a = [step * (wide / 2 + j) for j in range(P["columns"])]
for a in col_a:
    c = polar(cr, a)
    shell.shaft(c, cd / 2, cd * 0.4, 0.0, ch - 0.38, 20, MARBLE)                              # no base: Doric
    for k in range(3):                                                                        # annulets
        shell.cyl(c + Vector((0, 0, ch - 0.44 + 0.03 * k)), cd * 0.405 + 0.004 * k, cd * 0.405 + 0.004 * k, 0.015, MARBLE_C, 24)
    shell.lathe([(cd * 0.4, ch - 0.38), (cd * 0.44, ch - 0.33), (cd * 0.52, ch - 0.25), (cd * 0.6, ch - 0.18),
                 (cd * 0.62, ch - 0.15)], c, MARBLE, 28)                                      # echinus
    shell.box(c + Vector((0, 0, ch - 0.075)), (cd * 1.3, cd * 1.3, 0.15), MARBLE_C, yaw=a)    # abacus
eb = cr - cd * 0.7
ah = P["entab_h"] * 0.45                                                                        # the architrave's height
zr = ch + P["entab_h"]
shell.grid(arc(eb, PR, 0, FULL, ch, ch + ah, SEG + 1), MARBLE)                                  # architrave
shell.grid(arc(PR, PR + 0.03, 0, FULL, ch + ah - 0.07, ch + ah, SEG + 1), MARBLE_C)             # taenia
shell.grid(arc(eb + 0.04, PR - 0.02, 0, FULL, ch + ah, zr, SEG + 1), MARBLE_B)                  # frieze: the metopes' plane
for a in col_a:                                                                                 # a joint over each column
    shell.box(polar(PR + 0.001, a, ch + ah / 2 - 0.035), (0.004, GAP, ah - 0.07), JOINT, yaw=a)
    shell.box(polar(eb - 0.001, a, ch + ah / 2), (0.004, GAP, ah), JOINT, yaw=a)
trig = []                                                   # a triglyph over each column and two between (three in the wide bay)
for j, a in enumerate(col_a):
    nxt = col_a[(j + 1) % len(col_a)] + (FULL if j == len(col_a) - 1 else 0)
    n = 4 if j == len(col_a) - 1 else 3
    trig += [a + (nxt - a) * k / n for k in range(n)]
TW, fh = 0.36, P["entab_h"] - ah
for a in trig:
    shell.box(polar(PR - 0.0, a, ch + ah + fh / 2), (0.03, TW, fh), MARBLE, yaw=a)                              # its ground
    for k in (-1, 0, 1):                                                                                        # three bars
        shell.box(polar(PR + 0.025, a + k * 0.125 / PR, ch + ah + fh / 2 - 0.035), (0.03, 0.085, fh - 0.07), MARBLE_C, yaw=a)
    shell.box(polar(PR + 0.03, a, zr - 0.035), (0.04, TW + 0.02, 0.07), MARBLE_C, yaw=a)                        # its cap
    shell.box(polar(PR + 0.015, a, ch + ah - 0.095), (0.03, TW, 0.05), MARBLE_C, yaw=a)                         # regula
    for k in range(6):                                                                                          # guttae
        shell.cyl(polar(PR + 0.015, a + (k - 2.5) * 0.058 / PR, ch + ah - 0.15), 0.02, 0.014, 0.03, MARBLE_C, 8)
    shell.box(polar(PR + 0.21, a, zr + 0.08), (0.3, TW, 0.04), MARBLE_C, yaw=a)                                 # mutule
for a0, a1 in zip(trig, trig[1:] + [trig[0] + FULL]):                                                           # and over each metope
    shell.box(polar(PR + 0.21, (a0 + a1) / 2, zr + 0.08), (0.3, TW, 0.04), MARBLE_C, yaw=(a0 + a1) / 2)
shell.grid(arc(eb, PR + 0.06, 0, FULL, zr, zr + 0.06, SEG + 1), MARBLE_C)                       # bed moulding
shell.grid(arc(eb, PR + 0.4, 0, FULL, zr + 0.1, zr + 0.24, SEG + 1), MARBLE)                    # the cornice
shell.grid(arc(PR + 0.3, PR + 0.45, 0, FULL, zr + 0.24, zr + 0.32, SEG + 1), MARBLE_C)          # its gutter
# the ceiling over the walk: a marble beam from each column to the drum, two rows of coffers between
shell.grid(arc(RO, eb, 0, FULL, ch + 0.3, ch + 0.38, SEG + 1), COFFER)
rc = [RO + 0.02, (RO + eb) / 2, eb]
for r in rc:
    shell.grid(arc(max(r - 0.09, RO), min(r + 0.09, eb), 0, FULL, ch + 0.1, ch + 0.3, SEG + 1), MARBLE)
for j, a in enumerate(col_a):
    nxt = col_a[(j + 1) % len(col_a)] + (FULL if j == len(col_a) - 1 else 0)
    shell.strut(polar(RO, a, ch + 0.15), polar(eb, a, ch + 0.15), 0.3, 0.3, MARBLE_C)
    n = 3 if j == len(col_a) - 1 else 2
    for k in range(1, n):
        am = a + (nxt - a) * k / n
        shell.strut(polar(RO, am, ch + 0.2), polar(eb, am, ch + 0.2), 0.16, 0.2, MARBLE)
    for k in range(n):
        for r0, r1 in zip(rc, rc[1:]):
            am, rm = a + (nxt - a) * (k + 0.5) / n, (r0 + r1) / 2
            w = (nxt - a) / n * rm - 0.42
            shell.box(polar(rm, am, ch + 0.265), (r1 - r0 - 0.34, w, 0.07), MARBLE_B, yaw=am)   # the coffer's step
            shell.box(polar(rm, am, ch + 0.25), (r1 - r0 - 0.5, w - 0.16, 0.12), COFFER, yaw=am)
            shell.disc(polar(rm, am, ch + 0.28), 0.11, 0.06, (0, 0, 1), BRONZE, 10)             # a rosette
# its lean-to roof, from the cornice up to the drum
tiled(shell, PR + 0.42, zr + 0.3, RO + 0.05, zr + 1.35, 128, 0.72, 0.15)
shell.grid(arc(RO, RO + 0.12, 0, FULL, zr + 1.3, zr + 1.5, SEG + 1), MARBLE_C)                  # a course over its head

# --- the conical roof: pan tiles, a cover tile over each joint, timber rafters beneath -------
zs_ = H
re_, ra_, rise = RO + P["roof_eave"], P["apex_r"], P["roof_rise"]
tiled(shell, re_, zs_, ra_, zs_ + rise, P["tiles"], 0.68, 0.16)
for k in range(48):                                                                                 # rafters, their ends under the eaves
    a = FULL * k / 48
    shell.strut(polar(re_ - 0.05, a, zs_ - 0.2), polar(ra_, a, zs_ + rise - 0.2), 0.14, 0.2, WOOD)
# the lantern: a curb, a ring of posts with louvres, a tiled cap and a bronze finial
lz = zs_ + rise
shell.cyl(Vector((0, 0, lz - 0.12)), ra_ + 0.12, ra_ + 0.08, 0.3, WOOD, 24)
for k in range(8):
    a = FULL * (k + 0.5) / 8
    shell.box(polar(ra_ * 0.9, a, lz + 0.58), (0.11, 0.11, 0.84), WOOD, yaw=a)
    for lv in range(4):                                                                             # louvres, tilted to shed rain
        a2 = a + FULL / 16
        p = polar(ra_ * 0.83, a2, lz + 0.3 + lv * 0.19)
        M = Matrix.Translation(p) @ Matrix.Rotation(a2, 4, "Z") @ Matrix.Rotation(math.radians(-35), 4, "Y")
        shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((0.2, 0.62, 0.025, 1))), WOOD_B)
shell.cyl(Vector((0, 0, lz + 0.98)), ra_ + 0.12, ra_ + 0.12, 0.08, WOOD, 24)
tiled(shell, ra_ + 0.3, lz + 1.04, 0.12, lz + 1.6, 16, 0.6, 0.1)
shell.lathe([(0.14, lz + 1.58), (0.1, lz + 1.66), (0.05, lz + 1.7), (0.11, lz + 1.78), (0.12, lz + 1.84), (0.04, lz + 1.95), (0.01, lz + 2.1)],
            Vector((0, 0, 0)), BRONZE, 16)

# --- the inner colonnade: ten Corinthian columns, and the timber beams they carry ---------------
ic, ir, idm = P["inner_cols"], P["inner_r"], P["inner_d"]
Z_CAP = H - 1.17                                   # the foot of the capital's bell
HC = 0.61                                          # the bell's height
bell = lambda t: idm * 0.4 + 0.105 * t ** 2.2      # its radius, flaring to the lip
torus = lambda rc_, zc_, rad: [(rc_ + rad * math.cos(t), zc_ + rad * math.sin(t))
                               for t in (math.radians(d) for d in (-90, -45, 0, 45, 90))]


def leaf(part, c, a, z0, hl, w0, back=0.0):
    """An acanthus leaf lying on the bell at angle a, curling outward at its tip."""
    rad, tan = Vector((math.cos(a), math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0))
    rows = [[], [], [], []]
    for i in range(10):
        s = i / 9
        curl = max(0.0, (s - 0.5) / 0.5) ** 2
        z = z0 + hl * (s - 0.16 * curl)
        r = bell(min(1.0, (z0 + hl * s) / HC)) + 0.012 - back + 0.075 * curl
        w = w0 * (1 - 0.35 * s ** 3) / 2
        p = Vector(c) + rad * r + Vector((0, 0, Z_CAP + z))
        rows[0].append(p - tan * w - rad * 0.014)
        rows[1].append(p + rad * 0.008)                    # a ridge down the middle
        rows[2].append(p + tan * w - rad * 0.014)
        rows[3].append(p - rad * 0.022)
    part.grid(rows, MARBLE_C, smooth=True)


tops = []
for j in range(ic):
    a = FULL * (j + 0.5) / ic                      # columns between the axes, so the door axis and every fifth gap stay open
    c = polar(ir, a)
    shell.box(c + Vector((0, 0, 0.035)), (idm * 1.42, idm * 1.42, 0.07), MARBLE_C, yaw=a)       # a plinth
    shell.lathe([(idm * 0.66, 0.07)] + torus(idm * 0.63, 0.115, 0.045) + [(idm * 0.58, 0.17), (idm * 0.555, 0.2)]
                + torus(idm * 0.565, 0.235, 0.03) + [(idm * 0.5, 0.27)], c, MARBLE, 32)          # an Attic base
    shell.shaft(c, idm / 2, idm * 0.4, 0.27, Z_CAP - 0.04, 24, MARBLE, fillet=True)
    shell.lathe([(idm * 0.4, Z_CAP - 0.05)] + torus(idm * 0.41, Z_CAP - 0.02, 0.022) + [(idm * 0.4, Z_CAP + 0.01)], c, MARBLE_C, 28)   # astragal
    shell.lathe([(bell(k / 8), Z_CAP + HC * k / 8) for k in range(9)] + [(bell(1) + 0.02, Z_CAP + HC + 0.015)], c, MARBLE, 28)       # the bell
    for k in range(8):
        leaf(shell, c, a + FULL * k / 8, 0.0, 0.25, 0.23)                                         # the lower row of leaves
        leaf(shell, c, a + FULL * (k + 0.5) / 8, 0.02, 0.42, 0.23, back=0.006)                    # the upper row, between them
    corner, mid = idm * 1.0, idm * 0.6                                                           # the abacus: concave sides, cut corners
    pts = []
    for k in range(4):
        d0, d1 = a + FULL * (k + 0.5) / 4, a + FULL * (k + 1.5) / 4
        p0, p1, m_ = polar(corner, d0), polar(corner, d1), polar(mid, (d0 + d1) / 2)
        t0 = (p1 - p0).normalized()
        e0, e1 = p0 + t0 * 0.05, p1 - t0 * 0.05
        pts += [e0 + (e1 - e0) * u + (m_ - (p0 + p1) / 2) * (1 - (2 * u - 1) ** 2) for u in (0, 0.17, 0.33, 0.5, 0.67, 0.83, 1)]
        shell.sphere(c + polar(mid + 0.02, (d0 + d1) / 2, Z_CAP + HC + 0.07), 0.055, MARBLE_C, 0.9, 8, 6)   # a flower on each side
        tip = c + polar(corner - 0.07, d0, Z_CAP + HC - 0.07)                                    # a volute under each corner
        shell.strut(c + polar(bell(0.45), d0, Z_CAP + HC * 0.42), tip, 0.035, 0.028, MARBLE_C)
        shell.disc(tip, 0.075, 0.07, (-math.sin(d0), math.cos(d0), 0), MARBLE_C, 12)
        shell.disc(tip, 0.035, 0.1, (-math.sin(d0), math.cos(d0), 0), MARBLE, 8)
        for s_ in (-1, 1):                                                                       # and a pair of small scrolls at each face
            dm = (d0 + d1) / 2 + s_ * 0.2
            shell.disc(c + polar(bell(1) + 0.0, dm, Z_CAP + HC - 0.07), 0.04, 0.04, (math.cos(dm), math.sin(dm), 0), MARBLE_C, 8)
    shell.prism([(c.x + p.x, c.y + p.y) for p in pts], Z_CAP + HC + 0.01, Z_CAP + HC + 0.08, MARBLE_C)
    shell.prism([(c.x + p.x * 1.05, c.y + p.y * 1.05) for p in pts], Z_CAP + HC + 0.08, Z_CAP + HC + 0.13, MARBLE)
    tops.append(c + Vector((0, 0, H - 0.26)))
    shell.strut(tops[-1], polar(R + 0.1, a, H - 0.26), 0.24, 0.34, WOOD)                         # a beam to the wall
    shell.box(polar(R - 0.14, a, H - 0.52), (0.3, 0.3, 0.18), MARBLE_C, yaw=a)                   # on a marble corbel
    shell.box(polar(R - 0.08, a, H - 0.68), (0.18, 0.24, 0.14), MARBLE, yaw=a)
for j in range(ic):
    d = (tops[(j + 1) % ic] - tops[j]).normalized()
    shell.strut(tops[j] - d * 0.14, tops[(j + 1) % ic] + d * 0.14, 0.24, 0.34, WOOD)             # the ring beam

# the ceiling under the roof: a shallow coffered dish of marble ribs and deep stepped panels, open
# at the middle on an oculus ringed in bronze, under a plastered well that rises to the lantern.
# It hides the rafters; the timber beams run beneath it, and a marble course rides on the ring beam.
cz0, cz1, cr1 = H - 0.05, H + 0.55, 1.1               # height at the wall, height and radius at the oculus
zc = lambda r: cz0 + (cz1 - cz0) * (R - r) / (R - cr1)
DEEP = 0.26                                           # the coffers' depth
bounds = [R, (R + ir) / 2, ir] + [ir - (ir - cr1) * k / 3 for k in (1, 2, 3)]      # a rib over the ring beam
sectors = [30, 30, 30, 15, 15]
slab(shell, R, cz0, cr1, cz1, 0, FULL, DEEP + 0.04, DEEP + 0.1, COFFER, na=SEG, wrap=True)          # the panels' ground
for r in bounds:
    w = 0.09
    slab(shell, min(r + w, R), zc(min(r + w, R)), max(r - w, cr1), zc(max(r - w, cr1)), 0, FULL, 0.0, DEEP + 0.04, MARBLE, na=SEG, wrap=True)
for (r0, r1), n in zip(zip(bounds, bounds[1:]), sectors):
    rm = (r0 + r1) / 2
    w, sw = 0.08 / rm, 0.07                           # a rib's half-width (as an angle); a step's width
    for k in range(n):
        a = math.radians(6) + FULL * k / n
        slab(shell, r0, zc(r0), r1, zc(r1), a - w, a + w, 0.0, DEEP + 0.04, MARBLE, na=2)            # a radial rib
        a0, a1 = a + w, a + FULL / n - w
        i0, i1 = r0 - 0.09, r1 + 0.09
        for q0, q1 in ((i0, i0 - sw), (i1 + sw, i1)):                                             # the step round each coffer
            slab(shell, q0, zc(q0), q1, zc(q1), a0, a1, DEEP / 2, DEEP + 0.04, MARBLE_B)
        for b0, b1 in ((a0, a0 + sw / rm), (a1 - sw / rm, a1)):
            slab(shell, i0, zc(i0), i1, zc(i1), b0, b1, DEEP / 2, DEEP + 0.04, MARBLE_B, na=2)
        am = (a0 + a1) / 2                                                                        # a bronze rosette
        nrm = Vector((-(cz1 - cz0) * math.cos(am), -(cz1 - cz0) * math.sin(am), -(R - cr1))).normalized()
        shell.disc(polar(rm, am, zc(rm)) - nrm * (DEEP - 0.01), min(0.13, (a1 - a0) * rm * 0.22), 0.06, nrm, BRONZE, 10)
        shell.sphere(polar(rm, am, zc(rm)) - nrm * (DEEP - 0.06), min(0.05, (a1 - a0) * rm * 0.09), BRONZE, 1.0, 8, 6)
shell.grid(arc(ir - 0.16, ir + 0.1, 0, FULL, H - 0.09, zc(ir) + 0.02, SEG + 1), MARBLE_C)             # the course on the ring beam
slab(shell, cr1 + 0.14, zc(cr1 + 0.14), cr1, cz1, 0, FULL, -0.03, 0.2, BRONZE, na=SEG, wrap=True)      # the oculus's bronze rim
slab(shell, cr1 + 0.05, cz1, ra_ + 0.02, lz - 0.05, 0, FULL, 0.0, 0.06, PLASTER, na=48, wrap=True)       # the well up to the lantern

# --- the floor inside --------------------------------------------------------------------------
rings = [1.0 + k * (P["inner_r"] - 0.45 - 1.0) / 4 for k in range(5)]
if P["checker"]:
    # a polar checkerboard of pale marble and dark limestone, as at Epidaurus, between two red bands
    nsec = 40
    for i in range(4):
        for j in range(nsec):
            floor.grid(arc(rings[i] + 0.004, rings[i + 1] - 0.004, FULL * j / nsec + 0.004 / rings[i + 1],
                           FULL * (j + 1) / nsec - 0.004 / rings[i + 1], -0.008, 0.0, 3), FLOOR if (i + j) % 2 else DARK)
    paving(floor, 0.0, rings[0] - 0.12, 1, -0.008, 0.0, [FLOOR], gap=0.0)
    for r0, r1 in ((rings[0] - 0.12, rings[0]), (rings[-1], rings[-1] + 0.12)):
        paving(floor, r0, r1, 20, -0.008, 0.0, [RED], gap=0.006)
    floor.cyl(Vector((0, 0, 0.0)), 0.07, 0.06, 0.008, BRONZE, 16)                                 # a stud under the oculus
else:
    paving(floor, 0.0, rings[-1] + 0.12, 1, -0.008, 0.0, [FLOOR], gap=0.0)
r_a = rings[-1] + 0.12                                                                            # the aisle's paving
paving(floor, r_a, 4.45, 30, -0.008, 0.0, [FLOOR, FLOOR_B], off=0.5, gap=0.016)
paving(floor, 4.45, R + 0.05, 36, -0.008, 0.0, [FLOOR, FLOOR_B],
       a0=half + 0.02, a1=FULL - half - 0.02, gap=0.016)
if P["meridian"]:
    # north-south along x, under the oculus; a cross-bar every metre
    floor.box((0, 0, 0.003), (2 * (R - 1.5), 0.05, 0.006), BRONZE)
    for x in range(-int(R - 1.5), int(R - 1.5) + 1):
        floor.box((x, 0, 0.003), (0.03, 0.25 if x % 5 else 0.4, 0.006), BRONZE)

# --- the seating ---------------------------------------------------------
# stone seating built against the wall all round, broken only by the doorway; its top is the
# seat (0.45 m), a low step in front lets the feet rest. 36 slabs, a joint between each.
pad = (P["door_w"] / 2 + 0.3) / R
bd = P["bench_d"]
furn.grid(arc(R - bd + 0.07, R, pad, FULL - pad, 0, 0.44), JOINT)                              # what shows in the joints
paving(furn, R - bd + 0.05, R, 36, 0.0, 0.38, [SEAT, SEAT_B], a0=pad, a1=FULL - pad, gap=GAP)   # the body
paving(furn, R - bd, R, 36, 0.38, 0.46, [MARBLE, MARBLE_C], a0=pad, a1=FULL - pad, gap=0.012)   # a marble cap, a little proud
paving(furn, R - bd - 0.22, R - bd + 0.06, 36, 0.0, 0.1, [SEAT, SEAT_B], a0=pad, a1=FULL - pad, off=0.0, gap=0.012)  # the footstep
for sg in (pad, FULL - pad):                                                                    # the ends, squared off
    ra = R - bd / 2
    furn.box((ra * math.cos(sg), ra * math.sin(sg), 0.28), (bd + 0.1, 0.16, 0.56), MARBLE, yaw=sg)
    furn.box((ra * math.cos(sg), ra * math.sin(sg), 0.585), (bd + 0.16, 0.2, 0.05), MARBLE_C, yaw=sg)

# --- the ramp up to the doorway, through the middle bay: four slabs between two kerbs -----------
x0, x1, rw = step_r[2] - 0.05, P["terrace"] - 0.2, P["door_w"] + 0.6
drop = Vector((x1 - x0, 0, -B)) / 4
floor.strut((x0, 0, -0.26), (x1, 0, -B - 0.26), rw, 0.5, JOINT)
for k in range(4):
    p0 = Vector((x0, 0, -0.24)) + drop * k
    floor.strut(p0 + drop * 0.01, p0 + drop * 0.99, rw, 0.48, PAVING[k % 3])
for s_ in (1, -1):
    floor.strut((x0, s_ * (rw / 2 + 0.11), -0.25), (x1 - 0.2, s_ * (rw / 2 + 0.11), -B - 0.25 + 0.2 * B / (x1 - x0)), 0.22, 0.95, MARBLE)
    floor.box((x1 - 0.12, s_ * (rw / 2 + 0.11), -B + 0.2), (0.3, 0.3, 0.42), MARBLE_C)            # a block at each kerb's foot

# --- the door: two framed leaves hung inward at the jambs, bronze bosses, a lock, a bolt -----------
door = Part("door")
th = 0.07
lw = dw / 2 - 0.012
hx = R + 0.3                                           # the hinge line, in the middle of the wall
phi = math.radians(P["door_open"])
rails = [(0.0, 0.24), (1.2, 1.36), (2.85, 3.01), (dh - 0.2, dh - 0.02)]    # bottom, two lock rails, top
for s_ in (1, -1):                                     # s_ = +1: the leaf hung at +y
    hinge = Vector((hx, s_ * dw / 2, 0.02))
    dirv = Vector((-math.sin(phi), -s_ * math.cos(phi), 0))
    nrm = Vector((-dirv.y, dirv.x, 0))
    yaw = math.atan2(-dirv.x, dirv.y)
    at = lambda u, z, o=0.0: hinge + dirv * u + nrm * o + Vector((0, 0, z))
    door.box(at(lw / 2, dh / 2 - 0.01), (0.045, lw - 0.04, dh - 0.06), WOOD_B, yaw=yaw)          # the panels' boards
    for u in (0.3, 0.42, 0.54, 0.66, 0.78):                                                       # their joints
        door.box(at(u, dh / 2 - 0.01), (0.049, 0.008, dh - 0.3), JOINT, yaw=yaw)
    for u0, u1 in ((0.0, 0.16), (lw - 0.16, lw)):                                                 # stiles
        door.box(at((u0 + u1) / 2, dh / 2 - 0.01), (th, u1 - u0, dh - 0.02), WOOD, yaw=yaw)
    for z0, z1 in rails:
        door.box(at(lw / 2, (z0 + z1) / 2), (th, lw - 0.02, z1 - z0), WOOD, yaw=yaw)
        for u in (0.08, 0.31, 0.545, 0.78, lw - 0.08):                                            # bronze bosses along each rail
            for o in (th / 2, -th / 2):
                door.sphere(at(u, (z0 + z1) / 2, o), 0.04, BRONZE, 1.0, 8, 6)
    for z in (0.0, dh - 0.1):                                                                     # the pivots
        door.cyl(at(0.0, z - 0.02), 0.05, 0.05, 0.12, BRONZE, 12)
    if s_ == -1:                                       # the lock leaf: plate, keyhole, bolt, pull ring
        for o in (th / 2 + 0.008, -th / 2 - 0.008):
            door.box(at(lw - 0.08, 1.7, o), (0.016, 0.13, 0.3), BRONZE, yaw=yaw)
            door.box(at(lw - 0.08, 1.66, o + math.copysign(0.01, o)), (0.01, 0.03, 0.07), DARK, yaw=yaw)   # keyhole
            door.sphere(at(lw - 0.08, 2.0, o + math.copysign(0.03, o)), 0.05, BRONZE, 1.0, 10, 6)          # pull knob
        door.box(at(lw - 0.3, 2.25, -th / 2 - 0.03), (0.03, 0.55, 0.05), BRONZE, yaw=yaw)                  # the bolt, drawn
        door.box(at(lw - 0.5, 2.25, -th / 2 - 0.025), (0.05, 0.06, 0.09), BRONZE, yaw=yaw)                 # its staples
        door.box(at(lw - 0.2, 2.25, -th / 2 - 0.025), (0.05, 0.06, 0.09), BRONZE, yaw=yaw)
    else:                                              # the other leaf: the bolt's keeper
        door.box(at(lw - 0.08, 2.25, -th / 2 - 0.025), (0.05, 0.1, 0.1), BRONZE, yaw=yaw)

# --- statues round the terrace, between the axes so the way to the door stays clear ------------
for k in range(P["statues"]):
    a = FULL * (k + 0.5) / P["statues"]
    c = polar(P["statue_r"], a, -B)
    shell.box(c + Vector((0, 0, 0.09)), (1.0, 1.0, 0.18), MARBLE_C, yaw=a)                 # pedestal: base, die, cap
    shell.box(c + Vector((0, 0, 0.23)), (0.88, 0.88, 0.1), MARBLE, yaw=a)
    shell.box(c + Vector((0, 0, 0.7)), (0.76, 0.76, 0.84), rnd.choice(ASHLAR), yaw=a)
    shell.box(c + Vector((0, 0, 1.17)), (0.88, 0.88, 0.1), MARBLE, yaw=a)
    shell.box(c + Vector((0, 0, 1.26)), (0.98, 0.98, 0.08), MARBLE_C, yaw=a)
    f = c + Vector((0, 0, 1.3))                                                            # a draped standing figure, facing out
    shell.lathe([(0.3, 0.0), (0.27, 0.12), (0.23, 0.6), (0.22, 0.95), (0.25, 1.2), (0.27, 1.38), (0.2, 1.47),
                 (0.08, 1.5), (0.075, 1.56)], f, MARBLE, 20, squash=0.68, yaw=a)
    shell.sphere(f + Vector((0, 0, 1.67)), 0.115, MARBLE, 1.15, 12, 8)
    for s_ in (-1, 1):                                                                     # the arms, in the drapery
        sh = f + Vector((-math.sin(a), math.cos(a), 0)) * (s_ * 0.27) + Vector((0, 0, 1.36))
        shell.strut(sh, sh + Vector((math.cos(a), math.sin(a), 0)) * (0.1 if s_ > 0 else 0.02) + Vector((0, 0, -0.5)), 0.11, 0.11, MARBLE)
    for q in range(5):                                                                     # folds of the robe
        t = (q - 2) * 0.1
        p = f + Vector((math.cos(a), math.sin(a), 0)) * 0.16 + Vector((-math.sin(a), math.cos(a), 0)) * t
        shell.strut(p + Vector((0, 0, 0.02)), p + Vector((0, 0, 0.95)), 0.04, 0.04, MARBLE_C)

objs = [shell.finish(), floor.finish(), furn.finish(), door.finish()]

# Blender (x, y, z) -> glTF/explorer (x, z, -y): explorer x = blender x, explorer z = -blender y
ex = lambda v: [round(v.x, 3), round(-v.y, 3)]
info = {
    "_note": "Written by art/sets/paxos_chamber.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0], the terrace at y = -base. `door`: the middle of the "
             "doorway in the wall; `bench`: the seating's inner radius and seat height, running "
             "all round the wall except at the doorway; `inner_columns`: where each stands.",
    "params": P,
    "door": ex(Vector((R, 0, 0))),
    "bench": {"r_inner": R - P["bench_d"], "r_outer": R, "seat": 0.45},
    "inner_columns": [ex(polar(ir, FULL * (j + 0.5) / ic)) for j in range(ic)],
}
json.dump(info, open("art/sets/paxos-chamber.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/paxos-chamber.glb", use_selection=True)
print("CHAMBER", sum(len(o.data.polygons) for o in objs), "faces")
