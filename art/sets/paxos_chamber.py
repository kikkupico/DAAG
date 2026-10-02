"""The Chamber of Paxos, remodelled on the Tholos of Epidaurus: a standalone model for framing studies.

    blender -b -P art/sets/paxos_chamber.py [-- key=value ...]

Writes art/sets/paxos-chamber.glb and paxos-chamber.json (the baked Chamber, chamber.py, is untouched).
Epidaurus's shape and scale: a drum of white marble inside a peripteral Doric colonnade (26 columns,
the middle bay wider) on a three-step base, about 21 m across the stylobate, with a ramp up to the
one doorway; a lean-to pan-tile roof from the colonnade up to the drum, one conical roof over the
drum with a lantern, and a checkerboard of pale marble and dark limestone inside the inner colonnade.
Inside the drum a ring of ten slender columns with bell capitals (Epidaurus has fourteen) holds the
timber beams that carry the roof; the middle of the room is clear, and the aisle between the ring and
the wall is where people sit. A shallow coffered ceiling with a bronze-ringed oculus hides the
rafters, as Epidaurus's coffers did, and the beams run beneath it. The doorway (on the +x axis,
looking south in the set frame) has a pair of timber leaves studded with bronze, swinging inward,
with a lock plate and keyhole, a bolt and its keeper (`door_open` is the angle in degrees; 0 is
shut). Stone seating, a slab-jointed bench with a marble cap, built against the wall all round and broken only by the doorway (no desks); a
bronze meridian running through the doorway, lit by the sun at noon; statues on the terrace.

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
    tiles=64,          # cover tiles round the roof
    inner_cols=10, inner_r=4.0, inner_d=0.62,       # the inner colonnade, holding the roof beams
    door_w=2.2, door_h=4.4, door_open=70.0,   # the one doorway, on the +x axis; leaves swing inward
    columns=26, col_r=9.8, col_d=0.9, col_h=5.5,     # the colonnade outside
    entab_h=1.05, peri_r=10.4,                       # its entablature and roof's outer edge
    bench_d=0.55, checker=1, meridian=1,              # the stone seating against the wall: its depth
    statues=10, statue_r=12.9, terrace=14.5,         # pedestals round the terrace; its paving
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T, B = P["radius"], P["wall"], P["base"]
RO = R + T
SEG = 96
FULL = 2 * math.pi

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
STONE = material("stone", (0.78, 0.75, 0.69), 0.8)
COFFER = material("coffer", (0.58, 0.55, 0.5), 0.85)
SEAT = material("seat", (0.64, 0.6, 0.53), 0.75)
TILE = material("tile", (0.52, 0.2, 0.15), 0.8)
TILE_RIDGE = material("tile_ridge", (0.42, 0.15, 0.11), 0.8)
FLOOR = material("floor", (0.86, 0.84, 0.8), 0.3)
PAVING = material("terrace", (0.7, 0.67, 0.6), 0.9)
INLAY = material("inlay", (0.42, 0.44, 0.46), 0.3)
DARK = material("limestone", (0.16, 0.16, 0.17), 0.35)
RED = material("porphyry", (0.4, 0.14, 0.12), 0.3)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)
WOOD = material("wood", (0.33, 0.2, 0.1), 0.7)


class Part:
    """Collects solids (as bmesh geometry) into one object, one material slot each."""
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def grid(self, pts, mat, closed_u=False, cap=True):
        """pts[i][j]: a solid swept as rows i of rings j; rows wrap into a closed tube."""
        s = self.slot(mat)
        vs = [[self.bm.verts.new(p) for p in row] for row in pts]
        n, m = len(vs), len(vs[0])
        for i in range(n):
            a, b = vs[i], vs[(i + 1) % n]
            for j in range(m if closed_u else m - 1):
                f = self.bm.faces.new((a[j], a[(j + 1) % m], b[(j + 1) % m], b[j]))
                f.material_index = s
        if cap and not closed_u:
            for end in (0, m - 1):
                f = self.bm.faces.new([vs[i][end] for i in range(n)][::(1 if end else -1)])
                f.material_index = s

    def box(self, c, size, mat, yaw=0.0):
        M = Matrix.Translation(Vector(c)) @ Matrix.Rotation(yaw, 4, "Z")
        g = bmesh.ops.create_cube(self.bm, size=1.0, matrix=M @ Matrix.Diagonal((*size, 1)))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def strut(self, p0, p1, w, h, mat):
        """A beam from p0 to p1, w wide (across the plan) and h deep."""
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        M = Matrix.Translation((p0 + p1) / 2) @ d.to_track_quat("X", "Z").to_matrix().to_4x4()
        g = bmesh.ops.create_cube(self.bm, size=1.0, matrix=M @ Matrix.Diagonal((d.length, w, h, 1)))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def cyl(self, c, r0, r1, h, mat, segs=20):
        g = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r0,
                                  radius2=r1, depth=h, matrix=Matrix.Translation(Vector(c) + Vector((0, 0, h / 2))))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def sphere(self, c, r, mat, squash=1.0):
        g = bmesh.ops.create_uvsphere(self.bm, u_segments=16, v_segments=10, radius=r,
                                      matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((1, 1, squash, 1)))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me)
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        return o


def arc(r_in, r_out, a0, a1, z0, z1, segs=None):
    """Points of a curved wall piece between angles a0..a1: rows inner-bottom, outer-bottom,
    outer-top, inner-top."""
    n = segs or max(2, int(abs(a1 - a0) / FULL * SEG) + 1)
    ang = [a0 + (a1 - a0) * j / (n - 1) for j in range(n)]
    ring = lambda r, z: [(r * math.cos(a), r * math.sin(a), z) for a in ang]
    return [ring(r_in, z0), ring(r_out, z0), ring(r_out, z1), ring(r_in, z1)]


def cone(rA, zA, rB, zB, a0, a1, o0, o1, mat, na=None, wrap=False):
    """A slab on the cone running from (rA, zA) at its foot to (rB, zB) at its head, between
    angles a0..a1, from o0 to o1 measured out along the cone's normal."""
    L = math.hypot(rB - rA, zB - zA)
    nr, nz = (zB - zA) / L, (rA - rB) / L                    # the outward normal in (r, z)
    n = na or max(2, int(abs(a1 - a0) / FULL * SEG) + 2)
    ang = [a0 + (a1 - a0) * j / (n if wrap else n - 1) for j in range(n)]
    ring = lambda r, z, o: [((r + o * nr) * math.cos(a), (r + o * nr) * math.sin(a), z + o * nz) for a in ang]
    shell.grid([ring(rA, zA, o0), ring(rA, zA, o1), ring(rB, zB, o1), ring(rB, zB, o0)], mat, closed_u=wrap)


shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- base and terrace paving; the terrace is at -B ------------------------------------------
floor.grid(arc(0.0, P["terrace"], 0, FULL, -B - 0.3, -B, SEG + 1), PAVING)
for k in range(3):                                                                   # the three steps
    floor.grid(arc(0.0, P["peri_r"] + 0.85 - 0.3 * k, 0, FULL, -B + B * k / 3, -B + B * (k + 1) / 3, SEG + 1), MARBLE)

# --- drum, with doorways -----------------------------------------------------------------
N = 1
H = P["drum_h"]
half = (P["door_w"] / 2) / R
doors = [0.0]
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(R, RO, d + half, nxt - half, 0, H), STONE)                         # pier
    shell.grid(arc(R, RO, d - half, d + half, P["door_h"], H, 4), STONE)              # over the door
    for s in (-1, 1):                                                                  # architraves
        a = d + s * (half + 0.1 / R)
        for rr in (R - 0.03, RO + 0.03):
            shell.box((math.cos(a) * rr, math.sin(a) * rr, P["door_h"] / 2), (0.1, 0.2, P["door_h"]), MARBLE, yaw=a)
    for rr in (R - 0.03, RO + 0.03):
        shell.box((math.cos(d) * rr, math.sin(d) * rr, P["door_h"] + 0.1), (0.1, P["door_w"] + 0.4, 0.2), MARBLE, yaw=d)
    floor.box((math.cos(d) * (R + T / 2), math.sin(d) * (R + T / 2), 0.002), (T + 0.2, P["door_w"], 0.004), INLAY, yaw=d)
# inside: a cornice at the eaves and a plinth course; outside: a cornice under the eaves
shell.grid(arc(R - 0.3, R, 0, FULL, H - 0.3, H, SEG + 1), MARBLE)
shell.grid(arc(RO, RO + 0.25, 0, FULL, H - 0.3, H, SEG + 1), MARBLE)
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(R - 0.06, R, d + half, nxt - half, 0, 0.3), MARBLE)

# --- the colonnade outside, its entablature and roof -----------------------------------------
cr, cd, ch = P["col_r"], P["col_d"], P["col_h"]
wide = 1.45                                       # the middle bay, in column spacings
step = FULL / (P["columns"] - 1 + wide)
for j in range(P["columns"]):
    a = step * (wide / 2 + j)
    c = Vector((cr * math.cos(a), cr * math.sin(a), 0))
    shell.cyl(c, cd / 2, cd * 0.4, ch - 0.35, MARBLE, 16)                               # fluted-less Doric shaft
    shell.cyl(c + Vector((0, 0, ch - 0.35)), cd * 0.4, cd * 0.62, 0.2, MARBLE, 16)      # echinus
    shell.box(c + Vector((0, 0, ch - 0.075)), (cd * 1.3, cd * 1.3, 0.15), MARBLE, yaw=a)  # abacus
eb = cr - cd * 0.7
shell.grid(arc(eb, P["peri_r"], 0, FULL, ch, ch + P["entab_h"] * 0.45, SEG + 1), MARBLE)       # architrave
shell.grid(arc(eb, P["peri_r"] + 0.05, 0, FULL, ch + P["entab_h"] * 0.45, ch + P["entab_h"], SEG + 1), MARBLE)  # frieze
for k in range(P["columns"] * 2):                                                              # triglyphs
    a = FULL * k / (P["columns"] * 2)
    shell.box(((P["peri_r"] + 0.07) * math.cos(a), (P["peri_r"] + 0.07) * math.sin(a), ch + P["entab_h"] * 0.72),
              (0.05, 0.22, P["entab_h"] * 0.5), STONE, yaw=a)
zr = ch + P["entab_h"]
shell.grid(arc(eb, P["peri_r"] + 0.2, 0, FULL, zr, zr + 0.18, SEG + 1), MARBLE)                  # the cornice
shell.grid(arc(RO, eb, 0, FULL, ch - 0.05, ch + 0.05, SEG + 1), COFFER)                         # the colonnade's ceiling
# its lean-to roof: pan tiles from the cornice up to the drum, a cover tile over each joint
rl = P["peri_r"] + 0.2
cone(rl, zr + 0.18, RO + 0.05, zr + 1.35, 0, FULL, 0.0, 0.1, TILE, na=SEG, wrap=True)
for k in range(P["tiles"] * 2):
    a = FULL * (k + 0.5) / (P["tiles"] * 2)
    w = 0.035 / rl
    cone(rl, zr + 0.18, RO + 0.05, zr + 1.35, a - w, a + w, 0.1, 0.18, TILE_RIDGE, na=2)

# --- the conical roof: pan tiles, a cover tile over each joint, timber rafters beneath -------
zs = H
re_, ra_, rise = RO + P["roof_eave"], P["apex_r"], P["roof_rise"]
cone(re_, zs, ra_, zs + rise, 0, FULL, 0.0, 0.12, TILE, na=SEG, wrap=True)                         # the pan tiles
for k in range(P["tiles"]):
    a = FULL * (k + 0.5) / P["tiles"]
    w = 0.05 / re_
    cone(re_, zs, ra_, zs + rise, a - w, a + w, 0.12, 0.22, TILE_RIDGE, na=2)                       # a cover tile
cone(re_ + 0.03, zs - 0.03, re_ - 0.04, zs + 0.22, 0, FULL, 0.0, 0.1, TILE_RIDGE, na=SEG, wrap=True)   # the eaves' edge
for k in range(P["tiles"] // 2):                                                                    # rafters, seen from inside
    a = FULL * k / (P["tiles"] // 2)
    shell.strut((re_ * math.cos(a), re_ * math.sin(a), zs - 0.2), (ra_ * math.cos(a), ra_ * math.sin(a), zs + rise - 0.2),
                0.14, 0.2, WOOD)
# the lantern: a ring of posts with louvres, a small tiled cap and a bronze finial
lz = zs + rise
shell.cyl(Vector((0, 0, lz - 0.1)), ra_ + 0.05, ra_ + 0.05, 0.25, WOOD, 16)
for k in range(8):
    a = FULL * (k + 0.5) / 8
    shell.box((ra_ * 0.85 * math.cos(a), ra_ * 0.85 * math.sin(a), lz + 0.55), (0.1, 0.1, 0.8), WOOD, yaw=a)
    for lv in range(3):
        shell.box((ra_ * 0.85 * math.cos(a), ra_ * 0.85 * math.sin(a), lz + 0.3 + lv * 0.22), (0.05, 0.5, 0.05), WOOD, yaw=a)
shell.cyl(Vector((0, 0, lz + 0.95)), ra_ + 0.25, 0.1, 0.55, TILE, 16)
shell.sphere(Vector((0, 0, lz + 1.65)), 0.11, BRONZE)
# the inner colonnade: columns on between the gaps, so the door axis and every fifth gap stay open
ic, ir, idm = P["inner_cols"], P["inner_r"], P["inner_d"]
tops = []
for j in range(ic):
    a = FULL * (j + 0.5) / ic
    c = Vector((ir * math.cos(a), ir * math.sin(a), 0))
    shell.cyl(c, idm * 0.68, idm * 0.6, 0.18, MARBLE, 16)                           # an Attic base
    shell.cyl(c + Vector((0, 0, 0.18)), idm / 2, idm * 0.4, H - 1.35, MARBLE, 16)   # the shaft
    shell.cyl(c + Vector((0, 0, H - 1.17)), idm * 0.4, idm * 0.72, 0.62, MARBLE, 16)   # a bell capital
    shell.box(c + Vector((0, 0, H - 0.5)), (idm * 1.55, idm * 1.55, 0.12), MARBLE, yaw=a)   # abacus
    tops.append(c + Vector((0, 0, H - 0.3)))
    shell.strut(tops[-1], (R * math.cos(a), R * math.sin(a), H - 0.3), 0.22, 0.34, WOOD)      # a beam to the wall
for j in range(ic):
    shell.strut(tops[j], tops[(j + 1) % ic], 0.22, 0.34, WOOD)                              # the ring beam

# the ceiling under the roof: a shallow coffered dish of marble ribs and recessed panels, open at the
# middle on an oculus ringed in bronze, so the lantern's light falls through it. It hides the rafters;
# the timber beams run beneath it.
cz0, cz1, cr1 = H - 0.05, H + 0.55, 1.1               # height at the wall, height and radius at the oculus
zc = lambda r: cz0 + (cz1 - cz0) * (R - r) / (R - cr1)
cone(R, cz0, cr1, cz1, 0, FULL, 0.14, 0.22, COFFER, na=SEG, wrap=True)                    # the recessed panels
ring_r = [R - (R - cr1) * k / 4 for k in range(5)]                                         # four rings of coffers
for r in ring_r:
    w = 0.09
    cone(min(r + w, R), zc(min(r + w, R)), max(r - w, cr1), zc(max(r - w, cr1)), 0, FULL, 0.0, 0.14, MARBLE, na=SEG, wrap=True)
NC = 24
for k in range(NC):
    a, w = FULL * k / NC, 0.08 / 3.5
    cone(R, cz0, cr1, cz1, a - w, a + w, 0.0, 0.14, MARBLE, na=2)
cone(cr1 + 0.12, zc(cr1 + 0.12), cr1, cz1, 0, FULL, -0.02, 0.18, BRONZE, na=SEG, wrap=True)  # the oculus's bronze rim

# --- floor -----------------------------------------------------------------------------
if P["checker"]:
    # a polar checkerboard of pale marble and dark limestone, as at Epidaurus
    rings = [1.0 + k * (P["inner_r"] - 0.45 - 1.0) / 4 for k in range(5)]
    nsec = 40
    for i in range(4):
        for j in range(nsec):
            floor.grid(arc(rings[i], rings[i + 1], FULL * j / nsec, FULL * (j + 1) / nsec, 0.0, 0.004, 2),
                       FLOOR if (i + j) % 2 else DARK)
    floor.grid(arc(0.0, 1.0, 0, FULL, 0.0, 0.004, SEG + 1), FLOOR)
    for r0, r1, m in ((rings[0] - 0.12, rings[0], RED), (rings[-1], rings[-1] + 0.12, RED)):
        floor.grid(arc(r0, r1, 0, FULL, 0.0, 0.005, SEG + 1), m)
if P["meridian"]:
    # north-south along x, under the oculus; a cross-bar every metre
    floor.box((0, 0, 0.007), (2 * (R - 1.5), 0.05, 0.006), BRONZE)
    for x in range(-int(R - 1.5), int(R - 1.5) + 1):
        floor.box((x, 0, 0.007), (0.03, 0.25 if x % 5 else 0.4, 0.006), BRONZE)

# --- the seating ---------------------------------------------------------
# stone seating built against the wall all round, broken only by the doorway; its top is the
# seat (0.45 m), a low step in front lets the feet rest
pad = (P["door_w"] / 2 + 0.3) / R
furn.grid(arc(R - P["bench_d"] + 0.05, R, pad, FULL - pad, 0, 0.38), SEAT)                     # the body
furn.grid(arc(R - P["bench_d"], R, pad, FULL - pad, 0.38, 0.46), MARBLE)                        # a marble cap, a little proud
furn.grid(arc(R - P["bench_d"] - 0.22, R - P["bench_d"] + 0.05, pad, FULL - pad, 0, 0.1), SEAT)  # the footstep
for k in range(36):                                                                             # a joint between slabs
    a = pad + (FULL - 2 * pad) * (k + 0.5) / 36
    furn.box(((R - P["bench_d"] / 2) * math.cos(a), (R - P["bench_d"] / 2) * math.sin(a), 0.46), (P["bench_d"], 0.012, 0.006), DARK, yaw=a)
for sg in (pad, FULL - pad):                                                                    # the ends, squared off
    ra = R - P["bench_d"] / 2
    furn.box((ra * math.cos(sg), ra * math.sin(sg), 0.28), (P["bench_d"] + 0.1, 0.16, 0.56), MARBLE, yaw=sg)

# --- the ramp up to the doorway, through the middle bay --------------------------------------
floor.strut((P["peri_r"] + 0.3, 0, -0.25), (P["terrace"] - 0.6, 0, -B - 0.25), P["door_w"] + 0.2, 0.5, MARBLE)

# --- the door: two timber leaves hung inward at the jambs, bronze studs, a lock, a bolt -----------
door = Part("door")
dw, dh, th = P["door_w"], P["door_h"], 0.09
lw = dw / 2 - 0.015
hx = R + 0.3                                           # the hinge line, in the middle of the wall
phi = math.radians(P["door_open"])
for s_ in (1, -1):                                     # s_ = +1: the leaf hung at +y
    hinge = Vector((hx, s_ * dw / 2, 0))
    dirv = Vector((-math.sin(phi), -s_ * math.cos(phi), 0))
    nrm = Vector((-dirv.y, dirv.x, 0))
    yaw = math.atan2(-dirv.x, dirv.y)
    at = lambda u, z, o=0.0: hinge + dirv * u + nrm * o + Vector((0, 0, z))
    door.box(at(lw / 2, dh / 2), (th, lw, dh), WOOD, yaw=yaw)
    for z in (0.5, dh / 2, dh - 0.5):                  # strap hinges and bands
        door.box(at(lw / 2, z, 0), (th + 0.03, lw, 0.1), BRONZE, yaw=yaw)
    for u in (0.2, 0.5, 0.8, 1.1):
        if u < lw - 0.05:
            for z in (0.25, 0.9, 1.55, 2.2, 2.85, 3.5, 4.15):
                for o in (th / 2 + 0.01, -th / 2 - 0.01):
                    door.box(at(u, z, o), (0.03, 0.06, 0.06), BRONZE, yaw=yaw)
    if s_ == -1:                                       # the lock leaf: plate, keyhole, bolt, pull ring
        for o in (th / 2 + 0.01, -th / 2 - 0.01):
            door.box(at(lw - 0.2, 1.1, o), (0.02, 0.22, 0.3), BRONZE, yaw=yaw)
            door.box(at(lw - 0.2, 1.1, o + math.copysign(0.012, o)), (0.01, 0.03, 0.07), DARK, yaw=yaw)   # keyhole
            door.sphere(at(lw - 0.2, 1.45, o + math.copysign(0.03, o)), 0.05, BRONZE)                       # pull knob
        door.box(at(lw - 0.3, 1.35, -th / 2 - 0.04), (0.03, 0.55, 0.05), BRONZE, yaw=yaw)                  # the bolt, drawn
        door.box(at(lw - 0.55, 1.35, -th / 2 - 0.03), (0.06, 0.06, 0.08), BRONZE, yaw=yaw)                 # its staple
    else:                                              # the other leaf: the bolt's keeper
        door.box(at(lw - 0.1, 1.35, -th / 2 - 0.03), (0.06, 0.18, 0.1), BRONZE, yaw=yaw)
floor.box((R + T / 2, 0, -0.05), (T + 0.3, dw + 0.2, 0.1), MARBLE)                                         # the threshold

# --- statues round the terrace, on the pier axes so the ways to the doors stay clear --------
for k in range(P["statues"]):
    a = FULL * (k + 0.5) / P["statues"]
    c = Vector((P["statue_r"] * math.cos(a), P["statue_r"] * math.sin(a), -B))
    shell.box(c + Vector((0, 0, 0.6)), (0.8, 0.8, 1.2), MARBLE, yaw=a)                   # pedestal
    shell.box(c + Vector((0, 0, 1.25)), (0.9, 0.9, 0.1), MARBLE, yaw=a)
    shell.cyl(c + Vector((0, 0, 1.3)), 0.26, 0.2, 1.25, MARBLE, 12)                        # a draped figure
    shell.sphere(c + Vector((0, 0, 2.7)), 0.13, MARBLE, 1.2)

objs = [shell.finish(), floor.finish(), furn.finish(), door.finish()]

# Blender (x, y, z) -> glTF/explorer (x, z, -y): explorer x = blender x, explorer z = -blender y
ex = lambda v: [round(v.x, 3), round(-v.y, 3)]
info = {
    "_note": "Written by art/sets/paxos_chamber.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0], the terrace at y = -base. `door`: the middle of the "
             "doorway in the wall; `bench`: the seating's inner radius and seat height, running "
             "all round the wall except at the doorway.",
    "params": P,
    "door": ex(Vector((R, 0, 0))),
    "bench": {"r_inner": R - P["bench_d"], "r_outer": R, "seat": 0.45},
}
json.dump(info, open("art/sets/paxos-chamber.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/paxos-chamber.glb", use_selection=True)
print("CHAMBER",sum(len(o.data.polygons) for o in objs), "faces")
