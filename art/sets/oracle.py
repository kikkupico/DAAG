"""The oracle at the fork of Paxos, a sanctuary in the manner of Dodona, in enough detail that a
previs render already shows every part of it: nothing is left for an image model to make up.

    blender -b -P art/sets/oracle.py -- oracle

Reads the site from art/sets/sets.json (`oracle`: `at` explorer [x, z] of the enclosure's centre,
`floor` the ground's height, `yaw` degrees, `half` the enclosure's inside half-sizes [north-south,
east-west]) and writes art/sets/oracle.glb (explorer coords, origin at the world's origin; objects
`shell`, `floor` and `oak`), art/sets/oracle.json (where the gates, the oak, the temple and the
altar are, for cameras) and art/sets/oracle-strips.json, the ground bake.py levels under it.

A low wall of rubble with a coping of slabs encloses one great old oak. Beside the oak stands a
small temple of pale dressed limestone, two plain Doric columns between the ends of its side
walls, its door open, under an oxblood tiled gable; before it a plain stone altar. The wall has
two gateways of dressed posts and a lintel, one in the north wall, on the road that forks up the
two arms, and one in the south wall, on the road down the stem; a path of flagstones runs from
one to the other between the temple and the altar. The ground inside is beaten earth.

The frame is local: X runs north to south (north is -X when `yaw` is 0), Y across, and Z = 0 is
the ground inside. The oak is geometry, not flora: a trunk turned on a lathe with a flared foot,
five boughs and a crown of clumps, so that it is the same tree in every picture.
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, bx, ashlar, rubble, flags, roof_plane, doric, leaf, lengths, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
C = json.load(open("art/sets/sets.json"))[NAME]["oracle"]
(CX, CZ), FL, YAW = C["at"], C["floor"], math.radians(C.get("yaw", 0.0))
HX, HY = C["half"]                         # the enclosure's inside half-sizes
T, WH, GW = 0.5, 1.15, 1.8                  # wall thickness, wall height, gateway width
rnd = random.Random(31)

bpy.ops.wm.read_factory_settings(use_empty=True)

STONE = [material("rubble", (0.6, 0.56, 0.48), 0.95), material("rubble_b", (0.53, 0.5, 0.43), 0.95),
         material("rubble_c", (0.66, 0.62, 0.53), 0.95)]
BED = material("rubble-bed", (0.3, 0.27, 0.23), 1.0)
BLOCKS = [material("pale-limestone", (0.72, 0.68, 0.59), 0.8), material("pale-limestone_b", (0.67, 0.63, 0.55), 0.8),
          material("pale-limestone_c", (0.76, 0.72, 0.63), 0.8)]
JOINT = material("joint", (0.33, 0.3, 0.26), 1.0)
CAP = material("limestone-cap", (0.8, 0.77, 0.69), 0.7)
EARTH = material("beaten-earth", (0.55, 0.45, 0.33), 1.0)
FLAG = [material("flagstone", (0.64, 0.6, 0.52), 0.9), material("flagstone_b", (0.58, 0.55, 0.48), 0.9)]
TILES = [material("oxblood-tile", (0.42, 0.11, 0.07), 0.8), material("oxblood-tile_b", (0.46, 0.14, 0.09), 0.8),
         material("oxblood-tile_c", (0.38, 0.1, 0.07), 0.8)]
RIDGES = [material("oxblood-ridge", (0.34, 0.09, 0.06), 0.8), material("oxblood-ridge_b", (0.38, 0.11, 0.07), 0.8)]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
BOARDS = [material("door-board", (0.36, 0.24, 0.13), 0.8), material("door-board_b", (0.31, 0.2, 0.11), 0.8)]
DECK = material("roof-boards", (0.42, 0.3, 0.18), 0.85)

shell, floor, oak = Part("shell"), Part("floor"), Part("oak")
low = max(-2.0, 0.05 - FL)

# --- the ground: beaten earth inside and a margin outside, over the levelled pad ------------------
bx(floor, (-HX - T - 1.2, -HY - T - 1.2, low), (HX + T + 1.2, HY + T + 1.2, 0.0), EARTH)

# --- the enclosure wall: rubble both faces over a dark core, a coping of slabs ----------------------
def wall(p0, u, length):
    """One stretch of the wall, its inner face starting at p0 and running along u."""
    p0, u = Vector(p0), Vector(u).normalized()
    inw = Vector((-u.y, u.x, 0))                                   # into the enclosure
    yaw = math.atan2(u.y, u.x)
    shell.box(p0 + u * (length / 2) - inw * (T / 2) + Vector((0, 0, WH / 2 - 0.05)), (length, T - 0.12, WH), BED, yaw=yaw)
    rubble(shell, p0, u, length, -0.05, WH - 0.1, STONE, BED, rnd, out=inw)
    rubble(shell, p0 - inw * T, u, length, -0.05, WH - 0.1, STONE, BED, rnd, out=-inw)
    for a, b in lengths(0.0, length, 0.7, 1.2, rnd):
        shell.box(p0 + u * ((a + b) / 2) - inw * (T / 2) + Vector((0, 0, WH - 0.05)), (b - a - GAP, T + 0.1, 0.1), CAP, yaw=yaw)

ox, oy = HX, HY
g = GW / 2 + 0.55                                                   # half the gap, posts included
# each stretch keeps the inside on its left, going round the enclosure the short way
wall((-ox, -oy, 0), (1, 0, 0), 2 * ox)                              # one long side
wall((ox, oy, 0), (-1, 0, 0), 2 * ox)                               # the other
wall((ox, -oy, 0), (0, 1, 0), oy - g)                               # the south end, either side of its gateway
wall((ox, g, 0), (0, 1, 0), oy - g)
wall((-ox, oy, 0), (0, -1, 0), oy - g)                              # the north end, either side of its gateway
wall((-ox, -g, 0), (0, -1, 0), oy - g)
# the corners: a block of the same rubble filling each, so the wall turns solid
for sx in (-1, 1):
    for sy in (-1, 1):
        c = Vector((sx * (ox + T / 2), sy * (oy + T / 2), 0))
        shell.box(c + Vector((0, 0, WH / 2 - 0.05)), (T, T, WH), STONE[0])
        shell.box(c + Vector((0, 0, WH - 0.05)), (T + 0.1, T + 0.1, 0.1), CAP)

# --- the two gateways: dressed posts and a lintel, a threshold ------------------------------------
PH = 2.1
for s in (-1, 1):
    x = s * (ox + T / 2)
    for k in (-1, 1):
        y = k * (GW / 2 + 0.275)
        zs = [0.0, 0.5, 0.95, 1.4, 1.8, PH]
        for za, zb in zip(zs, zs[1:]):                              # each post in four or five blocks
            bx(shell, (x - 0.3, y - 0.275, za + GAP / 2), (x + 0.3, y + 0.275, zb - GAP / 2), rnd.choice(BLOCKS))
        bx(shell, (x - 0.27, y - 0.25, 0.0), (x + 0.27, y + 0.25, PH), JOINT)
    bx(shell, (x - 0.32, -GW / 2 - 0.62, PH), (x + 0.32, GW / 2 + 0.62, PH + 0.42), BLOCKS[2])   # the lintel
    bx(shell, (x - 0.34, -GW / 2 - 0.66, PH + 0.42), (x + 0.34, GW / 2 + 0.66, PH + 0.5), CAP)    # its crowning slab
    bx(floor, (x - 0.3, -GW / 2, 0.0), (x + 0.3, GW / 2, 0.06), BLOCKS[1])                         # the threshold

# --- the path of flags from gate to gate ------------------------------------------------------------
flags(floor, -ox - T, ox + T, -0.7, 0.7, 0.05, FLAG, rnd, row=0.7, size=(0.6, 1.1), bed=JOINT)

# --- the temple: two columns between the ends of its side walls, on two steps ---------------------
TX, TY0 = -0.4 * HX, 1.05          # its centre along X, the front of its stylobate across Y
TW, TL = 2.9, 3.1                  # its width (along X) and depth (across Y), on the stylobate
TH, TT = 2.5, 0.34                 # wall height above the stylobate, wall thickness
PITCH = math.radians(15)
st = [0.0, 0.17, 0.34]             # the steps' tops; the last is the stylobate
for k, z in enumerate(st[1:]):
    o = 0.36 - 0.18 * k
    for a, b in lengths(TX - TW / 2 - o, TX + TW / 2 + o, 0.6, 1.0, rnd):
        bx(shell, (a + GAP / 2, TY0 - o, st[k] + GAP / 2), (b - GAP / 2, TY0 + TL + o, z), rnd.choice(BLOCKS))
SZ = st[-1]
x0, x1, y0, y1 = TX - TW / 2, TX + TW / 2, TY0, TY0 + TL
zc = [SZ, SZ + 0.55] + [SZ + 0.55 + (TH - 0.55) * k / 5 for k in range(1, 6)]
for xs, o in ((x0, -1), (x1, 1)):                                    # the side walls, running out to the front as antae
    face = xs if o > 0 else xs
    bx(shell, (min(xs, xs - o * TT) + 0.1, y0, SZ), (max(xs, xs - o * TT) - 0.1, y1, SZ + TH), JOINT)
    ashlar(shell, (xs, y0, 0), (0, 1, 0), TL, zc, 0.9, BLOCKS, JOINT, rnd, out=(o, 0, 0), depth=0.11)
    ashlar(shell, (xs - o * TT, y0 + 0.02, 0), (0, 1, 0), TL - TT, zc, 0.9, BLOCKS, JOINT, rnd, out=(-o, 0, 0), depth=0.11)
    bx(shell, (min(xs, xs - o * TT) - 0.02, y0 - 0.02, SZ), (max(xs, xs - o * TT) + 0.02, y0 + 0.4, SZ + TH), BLOCKS[2])   # the anta's face
bx(shell, (x0 + 0.1, y1 - TT + 0.1, SZ), (x1 - 0.1, y1 - 0.1, SZ + TH), JOINT)                 # the back wall
ashlar(shell, (x1, y1, 0), (-1, 0, 0), TW, zc, 0.9, BLOCKS, JOINT, rnd, out=(0, 1, 0), depth=0.11)
ashlar(shell, (x0 + TT, y1 - TT, 0), (1, 0, 0), TW - 2 * TT, zc, 0.9, BLOCKS, JOINT, rnd, out=(0, -1, 0), depth=0.11)
DY = y0 + 1.05                                                     # the cella's front wall, with its door
DW, DH = 0.95, 1.9
for k in (-1, 1):
    a, b = sorted((TX + k * DW / 2, x0 + TT if k < 0 else x1 - TT))
    bx(shell, (a, DY, SZ), (b, DY + TT, SZ + TH), JOINT)
    for face, o in ((DY, -1), (DY + TT, 1)):
        ashlar(shell, (a, face, 0), (1, 0, 0), b - a, zc, 0.8, BLOCKS, JOINT, rnd, out=(0, o, 0), depth=0.08)
bx(shell, (TX - DW / 2 - 0.25, DY - 0.03, SZ + DH), (TX + DW / 2 + 0.25, DY + TT + 0.03, SZ + DH + 0.3), BLOCKS[2])   # the lintel
bx(shell, (TX - DW / 2, DY, SZ + DH + 0.3), (TX + DW / 2, DY + TT, SZ + TH), JOINT)
ashlar(shell, (TX - DW / 2, DY, 0), (1, 0, 0), DW, [SZ + DH + 0.3, SZ + TH], 0.5, BLOCKS, JOINT, rnd, out=(0, -1, 0), depth=0.08)
bx(floor, (TX - DW / 2, DY - 0.05, SZ), (TX + DW / 2, DY + TT + 0.05, SZ + 0.04), BLOCKS[1])                         # threshold
for k in (-1, 1):                                                  # the two leaves, standing open into the cella
    leaf(shell, (TX + k * DW / 2, DY + TT, 0), (-k * 0.26, 0.97, 0), DW / 2 - 0.02, DH - 0.04, SZ + 0.02, BOARDS, BOARDS[1], TIMBER, nb=3)
bx(floor, (x0 + TT, DY + TT, SZ), (x1 - TT, y1 - TT, SZ + 0.01), FLAG[1])                     # the cella floor, dark inside
CH = TH - 0.04
for k in (-1, 1):                                                  # the two columns between the antae
    doric(shell, (TX + k * 0.62, y0 + 0.22, SZ), 0.4, 0.33, CH, 4, BLOCKS, JOINT, CAP, rnd)
# the entablature round the top: architrave and a plain frieze course and a cornice
for z0_, z1_, d in ((SZ + TH, SZ + TH + 0.26, 0.0), (SZ + TH + 0.26, SZ + TH + 0.5, -0.02), (SZ + TH + 0.5, SZ + TH + 0.6, 0.08)):
    bx(shell, (x0 - d, y0 - d, z0_), (x1 + d, y1 + d, z1_), CAP if d > 0 else BLOCKS[2])
EZ = SZ + TH + 0.6
tp = math.tan(PITCH)
for yy, o in ((y0 - 0.08, -1), (y1 + 0.08, 1)):                     # the pediments, front and back
    for k in range(6):
        za = EZ + (TW / 2 + 0.08) * tp * k / 6
        zb = EZ + (TW / 2 + 0.08) * tp * (k + 1) / 6
        half = (TW / 2 + 0.08) * (1 - (k + 0.5) / 6)
        bx(shell, (TX - half, min(yy, yy - o * 0.25), za + GAP / 2), (TX + half, max(yy, yy - o * 0.25), zb - GAP / 2), rnd.choice(BLOCKS))
ov = 0.35
ax = TW / 2 + 0.08 + ov
cp, sp = math.cos(PITCH), math.sin(PITCH)
ee = EZ - ov * tp
for s in (-1, 1):
    roof_plane(shell, (TX + s * ax, y0 - 0.3, ee), (0, 1, 0), (-s * cp, 0, sp), TL + 0.6, ax / cp, TILES, RIDGES, DECK, rnd)
top = ee + ax * tp
nr = round((TL + 0.6) / 0.5)
for k in range(nr):                                                # the ridge, tile by tile
    a, b = y0 - 0.3 + (TL + 0.6) * k / nr, y0 - 0.3 + (TL + 0.6) * (k + 1) / nr
    bx(shell, (TX - 0.14, a + 0.004, top + 0.05), (TX + 0.14, b - 0.004, top + 0.16), rnd.choice(RIDGES))

# --- the altar, across the path from the temple ------------------------------------------------------
AX, AY = TX, -1.75
bx(shell, (AX - 0.85, AY - 0.6, 0.0), (AX + 0.85, AY + 0.6, 0.14), BLOCKS[1])                  # its step
for za, zb in ((0.14, 0.5), (0.5, 0.86)):
    for a, b in lengths(AX - 0.62, AX + 0.62, 0.5, 0.8, rnd):
        bx(shell, (a + GAP / 2, AY - 0.4, za + GAP / 2), (b - GAP / 2, AY + 0.4, zb - GAP / 2), rnd.choice(BLOCKS))
bx(shell, (AX - 0.6, AY - 0.38, 0.14), (AX + 0.6, AY + 0.38, 0.86), JOINT)
bx(shell, (AX - 0.7, AY - 0.48, 0.86), (AX + 0.7, AY + 0.48, 0.98), CAP)                       # its top slab

# --- the oak: a gnarled fissured trunk, a low fork, spreading limbs, leaf pads in layers ----------------
# One ancient oak, drawn so that an image model reads it as a tree and as the same tree every time: pale
# ridged bark, a short thick trunk forking low, limbs that reach out wide and nearly level, and dark leaf
# pads in layers along them with the sky showing between.
OX, OY = 0.45 * HX, -0.48 * HY
orn = random.Random(7)
BARK = [material("oak-bark", (0.36, 0.32, 0.27), 1.0), material("oak-bark_b", (0.29, 0.25, 0.21), 1.0)]
LEAF = [material("oak-leaves", (0.07, 0.17, 0.05), 0.9), material("oak-leaves_b", (0.1, 0.22, 0.06), 0.9),
        material("oak-leaves_c", (0.14, 0.27, 0.08), 0.9)]


def tube(path, mat, segs=9, ridge=0.0, phase=0.0):
    """A limb swept along path = [(point, radius), ...]; `ridge` cuts the bark into vertical furrows."""
    s_ = oak.slot(mat)
    rings, prev = [], Vector((0, 0, 1))
    for i, (p, r) in enumerate(path):
        p = Vector(p)
        d = (Vector(path[min(i + 1, len(path) - 1)][0]) - Vector(path[max(i - 1, 0)][0])).normalized()
        u = d.cross(prev if abs(d.dot(prev)) < 0.95 else Vector((1, 0, 0))).normalized()
        w = d.cross(u)
        prev = u
        rings.append([oak.bm.verts.new(p + (u * math.cos(2 * math.pi * k / segs) + w * math.sin(2 * math.pi * k / segs))
                                       * r * (1 + ridge * math.sin(5 * 2 * math.pi * k / segs + phase + 0.35 * i)))
                      for k in range(segs)])
    for a_, b_ in zip(rings, rings[1:]):
        for k in range(segs):
            oak.face((a_[k], a_[(k + 1) % segs], b_[(k + 1) % segs], b_[k]), s_, True)
    oak.face(rings[0][::-1], s_)
    oak.face(rings[-1], s_)


def bend(p0, p1, r0, r1, wob, n=6, mat=None):
    """A gently crooked limb from p0 to p1; returns its end."""
    p0, p1 = Vector(p0), Vector(p1)
    side = Vector((orn.uniform(-1, 1), orn.uniform(-1, 1), orn.uniform(-0.2, 0.4)))
    path = [(p0 + (p1 - p0) * (i / n) + side * wob * math.sin(math.pi * i / n), r0 + (r1 - r0) * (i / n)) for i in range(n + 1)]
    tube(path, mat or BARK[orn.randrange(2)], 8, 0.08, orn.uniform(0, 6))
    return p1


TOP = [0.0]


def pad(c, r, flat=0.5):
    """A leaf pad: a lumpy flattened ball, faceted so it reads as foliage."""
    g = bmesh.ops.create_icosphere(oak.bm, subdivisions=2, radius=r,
                                   matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((1, 1, flat, 1)))
    k = 2 if Vector(c).z - 0 > 4.2 else orn.randrange(2)
    oak.paint(g, LEAF[k if orn.random() < 0.7 else orn.randrange(3)])
    for v in g["verts"]:
        v.co += (v.co - Vector(c)).normalized() * orn.uniform(-0.28, 0.22) * r
    TOP[0] = max(TOP[0], max(v.co.z for v in g["verts"]))


# trunk: thick, short, leaning a little, ridged, flared at the foot, with buttress humps
lean = Vector((0.18, -0.1, 0))
tp = [(Vector((OX, OY, z)) + lean * (z / 2.0) ** 2, r) for z, r in
      ((-0.05, 1.25), (0.25, 0.98), (0.7, 0.86), (1.2, 0.8), (1.7, 0.78), (2.1, 0.7))]
tube(tp, BARK[0], 16, 0.07, 0.4)
for k in range(6):                                                 # roots that run out over the ground
    a = 0.4 + k * 1.05 + orn.uniform(-0.2, 0.2)
    tube([(Vector((OX + 0.4 * math.cos(a), OY + 0.4 * math.sin(a), 0.55)), 0.3),
          (Vector((OX + 0.85 * math.cos(a), OY + 0.85 * math.sin(a), 0.2)), 0.24),
          (Vector((OX + 1.4 * math.cos(a), OY + 1.4 * math.sin(a), 0.0)), 0.17),
          (Vector((OX + 1.8 * math.cos(a), OY + 1.8 * math.sin(a), -0.06)), 0.12)], BARK[1], 8)
FORK = Vector((OX, OY, 2.1)) + lean * (2.1 / 2.0) ** 2
# primary limbs: wide, rising at 25-40 degrees, one low and long that reaches out over the wall
for a, rise, ln in ((0.5, 0.55, 2.3), (2.2, 0.7, 2.0), (3.5, 0.5, 2.5), (5.0, 0.8, 1.9)):
    d = Vector((math.cos(a), math.sin(a), rise)).normalized()
    p1 = bend(FORK, FORK + d * ln, 0.5, 0.26, 0.5)
    for j in range(2):                                              # each divides in two, then again
        a2 = a + (-0.55 if j == 0 else 0.6)
        d2 = Vector((math.cos(a2), math.sin(a2), rise * 0.5 + 0.1)).normalized()
        p2 = bend(p1, p1 + d2 * orn.uniform(1.1, 1.5), 0.2, 0.11, 0.35)
        for m in range(2):
            a3 = a2 + (-0.4 if m == 0 else 0.45)
            d3 = Vector((math.cos(a3), math.sin(a3), 0.35)).normalized()
            p3 = bend(p2, p2 + d3 * orn.uniform(0.8, 1.1), 0.11, 0.06, 0.2, 3)
            pad(p3 + Vector((0, 0, 0.35)), orn.uniform(0.9, 1.15))
            pad(p3 + Vector((orn.uniform(-0.9, 0.9), orn.uniform(-0.9, 0.9), 1.0)), orn.uniform(0.75, 1.0), 0.55)
        pad(p2 + Vector((0, 0, 0.9)), orn.uniform(0.85, 1.1), 0.55)
    pad(p1 + Vector((0, 0, 0.6)), 1.0, 0.55)
for j in range(7):                                                  # the crown's upper layer
    a = j * 0.9 + 0.2
    pad(FORK + Vector((1.4 * math.cos(a) * (1 + 0.2 * (j % 2)), 1.4 * math.sin(a) * (1 + 0.2 * (j % 2)), 2.6 + 0.3 * (j % 3))),
        orn.uniform(1.0, 1.3), 0.5)
pad(FORK + Vector((0.3, 0.0, 3.2)), 1.4, 0.5)

M = Matrix.Translation((CX, -CZ, FL)) @ Matrix.Rotation(YAW, 4, "Z")
for part in (shell, floor, oak):
    part.place(M)
objs = [shell.finish(), floor.finish(), oak.finish()]
ex = lambda x, y: (lambda v: [round(v.x, 2), round(-v.y, 2)])(M @ Vector((x, y, 0)))
json.dump({"_note": "Written by art/sets/oracle.py; explorer coords [x, z] in metres, heights above the sea. `middle`: "
                    "the enclosure's centre, ground at `floor`; `north_gate`, `south_gate`: the middle of each gateway; "
                    "`north`, `south`: the road out before each; `oak`: the trunk, its crown's top at `oak_top`; "
                    "`temple`: the middle of its front, `temple_door` its doorway, roof top at `temple_top`; `altar`.",
           "middle": ex(0, 0), "floor": round(FL, 2), "north_gate": ex(-ox - T / 2, 0), "south_gate": ex(ox + T / 2, 0),
           "north": ex(-ox - 8, 0), "south": ex(ox + 8, 0), "oak": ex(OX, OY), "oak_top": round(FL + TOP[0], 2),
           "temple": ex(TX, y0), "temple_door": ex(TX, DY), "temple_top": round(FL + top + 0.16, 2), "altar": ex(AX, AY),
           "wall_top": round(FL + WH, 2)},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
json.dump({"_note": f"Written by art/sets/oracle.py for {NAME}: ground to level, explorer [x, z].",
           "strips": [{"at": [CX, CZ], "half": [HX + T + 1.2, HY + T + 1.2], "rot": math.degrees(-YAW), "pad": FL - 0.25}]},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("ORACLE", NAME, sum(len(o.data.polygons) for o in objs), "faces")
