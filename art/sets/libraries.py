"""The libraries of the scholars' coast, in enough detail that a previs render already shows every
part of each building: nothing of it is left for an image model to make up.

    blender -b -P art/sets/libraries.py -- libraries

Reads the plan (sets.json `libraries.plan`: each library's place, footprint, turn and ground,
set by hand in the coast's clearings with the porch to the nearest road) and writes
art/sets/libraries.glb, art/sets/libraries.json (what the previs and the books need to know: each
door, porch and reading room) and art/sets/libraries-strips.json, the ground art/sets/bake.py
levels under each. The set's origin is the explorer's origin, so every library stands at its
own place with no further placing; its objects are `shell`, `floor` and `furniture`.

The libraries are a repeated type, so one builder serves them all: a small gabled hall of
lime-plastered rubble on a base of dressed limestone, with a porch of two plain columns before
its one door, and a single room inside, the reading room, where the scrolls are kept. They
differ only by a seed: the plaster's tone, the wall's height, the roof's pitch, how full the
racks are.

A library's frame is local: X runs along its front, the porch and the road are towards -Y, and
the ground at its middle is Z = 0. What is modelled, so that it need not be described to an
image model (the helpers are masonry.py's):
- the terrace it stands on, faced with rubble under a paving of flagstones;
- the base in two courses of dressed blocks in running bond, under smooth plaster;
- the doorway: jambs in three blocks, a lintel with a small cornice, a threshold, and two
  boarded leaves on ledges, both standing open into the room;
- the porch: a platform of dressed blocks with two steps across its front, two plain columns of
  four drums with annulets, echinus and abacus, antae against the wall, an architrave of one
  block to a side, a cornice, a pediment with raking cornices, a boarded ceiling;
- both roofs tile by tile, the porch's gable running back into the hall's front slope: pans in
  courses, a cover tile over each joint, an antefix at each eave end, ridge tiles; rafter ends
  under the eaves and purlin ends at each gable;
- small high windows with a sill, a lintel and two upright bars;
- the reading room: a flagstone floor, a rack of pigeonholes along the back wall with the
  scrolls lying in them end out, a title tag hanging from some, a reading table with a scroll
  open on it, a stool, a bucket of scrolls by the door, beams and boarding overhead.
"""
import bpy, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, bx, ashlar, rubble, flags, roof_plane, doric, leaf, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
PLAN = json.load(open(SITE["libraries"]["plan"]))["buildings"]
P = dict(
    wall=0.4,                    # the walls' thickness
    floor=0.6,                   # the room's floor above the ground: the base's height
    door=(1.3, 2.3),             # the doorway: across, high
    porch=1.8,                   # the porch's depth before the front wall
    porch_w=1.9,                 # half its platform's width
    columns=1.4,                 # the two columns, either side of the door's axis
    col_d=0.42,
    eaves=0.45,
    rack=(8, 5),                 # pigeonholes along and up
)

bpy.ops.wm.read_factory_settings(use_empty=True)

PLASTER = [material(f"library-plaster-{k}", c, 0.9) for k, c in enumerate(
    [(0.88, 0.85, 0.78), (0.84, 0.78, 0.64), (0.9, 0.87, 0.81), (0.82, 0.74, 0.6)])]
INSIDE = material("library-plaster-inside", (0.8, 0.76, 0.68), 0.9)
BLOCKS = [material("pale-limestone", (0.72, 0.68, 0.59), 0.8), material("pale-limestone_b", (0.67, 0.63, 0.55), 0.8),
          material("pale-limestone_c", (0.76, 0.72, 0.63), 0.8)]
JOINT = material("joint", (0.33, 0.3, 0.26), 1.0)
RUBBLE = [material("rubble", (0.5, 0.46, 0.4), 0.95), material("rubble_b", (0.44, 0.41, 0.36), 0.95),
          material("rubble_c", (0.56, 0.52, 0.45), 0.95)]
TERRACE = material("terrace-wall", (0.42, 0.39, 0.34), 0.95)
FLAGS = [material("flagstone", (0.6, 0.57, 0.5), 0.85), material("flagstone_b", (0.55, 0.52, 0.46), 0.85),
         material("flagstone_c", (0.64, 0.61, 0.54), 0.85)]
TILES = [material("terracotta", (0.5, 0.2, 0.12), 0.8), material("terracotta_b", (0.55, 0.24, 0.14), 0.8),
         material("terracotta_c", (0.45, 0.18, 0.11), 0.8)]
RIDGES = [material("terracotta-cover", (0.41, 0.16, 0.1), 0.8), material("terracotta-cover_b", (0.46, 0.19, 0.12), 0.8)]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
PLANK = material("plank", (0.37, 0.25, 0.14), 0.75)
BOARDS = material("roof-boards", (0.42, 0.3, 0.18), 0.85)
SHELF = material("shelf", (0.45, 0.31, 0.17), 0.7)
DARK = material("dark", (0.08, 0.07, 0.06), 1.0)
IRON = material("iron", (0.2, 0.19, 0.18), 0.5, 0.8)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)
PAPYRUS = [material("papyrus", (0.78, 0.69, 0.48), 0.8), material("papyrus_b", (0.72, 0.62, 0.42), 0.8),
           material("papyrus_c", (0.83, 0.75, 0.55), 0.8)]
TAG = material("tag", (0.86, 0.8, 0.66), 0.8)
WICKER = material("wicker", (0.55, 0.42, 0.24), 0.9)

shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")
T, FZ, PD, PW, CX = P["wall"], P["floor"], P["porch"], P["porch_w"], P["columns"]
DW, DH = P["door"][0], P["floor"] + P["door"][1]


def window(part, c, u, out):
    """A small high window in a wall face at c: a sill, a lintel, two upright bars, dark within."""
    c, u, out = Vector(c), Vector(u), Vector(out)
    yaw = math.atan2(u.y, u.x)
    part.box(c + out * 0.006, (0.4, 0.012, 0.55), DARK, yaw=yaw)
    part.box(c + out * 0.03 + Vector((0, 0, 0.32)), (0.62, 0.1, 0.1), BLOCKS[2], yaw=yaw)
    part.box(c + out * 0.04 + Vector((0, 0, -0.31)), (0.54, 0.12, 0.07), BLOCKS[0], yaw=yaw)
    for s in (-1, 1):
        part.box(c + u * (s * 0.225) + out * 0.02, (0.05, 0.07, 0.55), BLOCKS[1], yaw=yaw)
        part.box(c + u * (s * 0.07) + out * 0.03, (0.03, 0.03, 0.55), IRON, yaw=yaw)


def gable(part, prof, axis, a, b, mat):
    """A wall piece with the outline `prof` (points across and up), from a to b along `axis`
    (0: the outline lies in Y and Z; 1: in X and Z)."""
    at = (lambda u, z, t: (t, u, z)) if axis == 0 else (lambda u, z, t: (u, t, z))
    lo, hi = [part.bm.verts.new(at(u, z, a)) for u, z in prof], [part.bm.verts.new(at(u, z, b)) for u, z in prof]
    k, n = part.slot(mat), len(prof)
    for i in range(n):
        part.face((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]), k)
    part.face(lo[::-1], k)
    part.face(hi, k)


def scroll(part, c, r, length, rng, tag=False):
    """A rolled scroll lying along Y with its end at c, towards -Y: the roll, the knob of its
    rod, and sometimes the title tag hanging from it."""
    part.disc(Vector(c) + Vector((0, length / 2, 0)), r, length, (0, 1, 0), rng.choice(PAPYRUS), 8)
    part.disc(Vector(c) + Vector((0, -0.012, 0)), r * 0.3, 0.03, (0, 1, 0), TIMBER, 6)
    if tag:
        bx(part, (c[0] + r * 0.4, c[1] - 0.012, c[2] - r - 0.07), (c[0] + r * 0.4 + 0.035, c[1] - 0.006, c[2] - r * 0.2), TAG)


info, strips, faces = [], [], 0
for n, b in enumerate(PLAN):
    rng = random.Random(1000 + n)              # the same draws, in the same order, as the plain build this replaces
    (cx, cz), (hx0, hy0), rot, g = b["at"], b["half"], math.radians(b["rot"]), b["ground"]
    hx, hy = hx0 - 0.35, hy0 - 0.35
    wall = rng.choice(PLASTER)
    rng.choice(TILES)
    wh = [rng.uniform(*r) for r in ((3.4, 4.2), (3.6, 4.2), (4.6, 5.4), (3.8, 4.4))][3]
    pitch = math.radians(rng.uniform(20, 26))
    tp, cp, sp = math.tan(pitch), math.cos(pitch), math.sin(pitch)
    low = max(-4.5, 0.05 - g)                  # never below sea level: the island stands on its lowest point
    yc = -hy - PD + 0.3                        # the porch's column line
    az = wh - 0.3                              # the architrave's underside

    # --- the terrace: rubble faces, a paving of flagstones ---------------------------------
    tx, ty = hx + 0.7, hy + 0.7
    bx(floor, (-tx + 0.04, -ty + 0.04, low), (tx - 0.04, ty - 0.04, 0.04), TERRACE)
    rz = max(low, -1.6)
    for p0, u, L in (((-tx, -ty, 0), (1, 0, 0), 2 * tx), ((tx, -ty, 0), (0, 1, 0), 2 * ty),
                     ((tx, ty, 0), (-1, 0, 0), 2 * tx), ((-tx, ty, 0), (0, -1, 0), 2 * ty)):
        rubble(floor, Vector(p0) + Vector(u) * 0.0 - Vector((u[1], -u[0], 0)) * 0.04, u, L, rz, 0.04, RUBBLE, JOINT, rng)
    flags(floor, -tx, tx, -ty, ty, 0.08, FLAGS, rng, row=0.68, bed=JOINT)

    # --- the base and the walls -------------------------------------------------------------
    zs = [0.08, 0.34, FZ]
    for p0, u, L in (((-hx - 0.07, -hy, 0), (1, 0, 0), hx + 0.07 - PW), ((PW, -hy, 0), (1, 0, 0), hx + 0.07 - PW),
                     ((hx, -hy - 0.07, 0), (0, 1, 0), 2 * hy + 0.14), ((hx + 0.07, hy, 0), (-1, 0, 0), 2 * hx + 0.14),
                     ((-hx, hy + 0.07, 0), (0, -1, 0), 2 * hy + 0.14)):
        ashlar(shell, p0, u, L, zs, 0.85, BLOCKS, JOINT, rng, depth=0.07)
    bx(shell, (-hx, hy - T, 0.08), (hx, hy, wh), wall)                               # back
    for s in (-1, 1):
        bx(shell, (s * hx, -hy, 0.08), (s * (hx - T), hy - T, wh), wall)             # the two ends
        bx(shell, (s * hx, -hy, 0.08), (s * DW / 2, -hy + T, wh), wall)              # front, either side of the door
    bx(shell, (-DW / 2, -hy, DH), (DW / 2, -hy + T, wh), wall)                       # and over it
    for s in (-1, 1):                                                                # the room's own plaster
        bx(shell, (s * (hx - T), -hy + T, FZ), (s * (hx - T - 0.01), hy - T, wh), INSIDE)
    bx(shell, (-hx + T, hy - T - 0.01, FZ), (hx - T, hy - T, wh), INSIDE)
    bx(floor, (-hx + T, -hy + T, 0.08), (hx - T, hy - T, FZ - 0.04), JOINT)          # the floor's bed
    flags(floor, -hx + T, hx - T, -hy + T, hy - T, FZ, FLAGS, rng, row=0.62, size=(0.5, 0.9))

    # --- the doorway: jambs, lintel, cornice, threshold, two leaves standing open ------------
    for s in (-1, 1):
        for k in range(3):
            za, zb = FZ + (DH - FZ) * k / 3, FZ + (DH - FZ) * (k + 1) / 3
            bx(shell, (s * DW / 2, -hy - 0.06, za + GAP / 2), (s * (DW / 2 + 0.2), -hy + T + 0.01, zb - GAP / 2), rng.choice(BLOCKS))
        bx(shell, (s * (DW / 2 + 0.01), -hy - 0.045, FZ), (s * (DW / 2 + 0.19), -hy + T, DH), JOINT)
    bx(shell, (-DW / 2 - 0.3, -hy - 0.09, DH), (DW / 2 + 0.3, -hy + T + 0.01, DH + 0.3), BLOCKS[2])
    bx(shell, (-DW / 2 - 0.38, -hy - 0.15, DH + 0.3), (DW / 2 + 0.38, -hy, DH + 0.37), BLOCKS[0])
    bx(floor, (-DW / 2, -hy - 0.1, FZ - 0.02), (DW / 2, -hy + T + 0.03, FZ + 0.035), BLOCKS[1])
    lw, lh = DW / 2 - 0.02, DH - FZ - 0.09
    for s, ang in ((-1, 100), (1, 78)):                                              # hinged inside, swung into the room
        a = math.radians(ang)
        hinge = (s * (DW / 2 - 0.03), -hy + T + 0.04, 0)
        leaf(shell, hinge, (-s * math.cos(a), math.sin(a), 0), lw, lh, FZ + 0.045, (PLANK, TIMBER), DARK, TIMBER, IRON, nb=3)
    shell.disc(Vector((DW / 2 - 0.03 - 0.5 * math.cos(math.radians(78)) - 0.035, -hy + T + 0.04 + 0.5 * math.sin(math.radians(78)), FZ + 1.1)),
               0.06, 0.014, (math.sin(math.radians(78)), math.cos(math.radians(78)), 0), BRONZE, 12)   # a ring pull

    # --- windows, small and high: two in each end, three in the back --------------------------
    wz = min(wh - 0.75, 3.1)
    for s in (-1, 1):
        for k in (-1, 1):
            window(shell, (s * hx, k * hy * 0.45, wz), (0, 1, 0), (s, 0, 0))
    for k in (-1, 0, 1):
        window(shell, (k * hx * 0.55, hy, wz), (1, 0, 0), (0, 1, 0))

    # --- the porch: platform, steps, columns, antae, architrave, cornice, pediment -----------
    bx(floor, (-PW + 0.05, -hy - PD + 0.05, low), (PW - 0.05, -hy, FZ - 0.04), JOINT)
    for p0, u, L in (((-PW, -hy - PD, 0), (1, 0, 0), 2 * PW), ((PW, -hy - PD, 0), (0, 1, 0), PD), ((-PW, -hy, 0), (0, -1, 0), PD)):
        ashlar(floor, Vector(p0) - Vector((u[1], -u[0], 0)) * 0.07, u, L, [max(low, -1.2), -0.3, 0.0, 0.3, FZ - 0.04], 0.95, BLOCKS, JOINT, rng, depth=0.07)
    flags(floor, -PW, PW, -hy - PD, -hy, FZ, FLAGS, rng, row=0.6, size=(0.8, 1.3))
    for k, top in enumerate((0.4, 0.2)):                                             # two steps across the front
        y1 = -hy - PD - 0.34 * k
        bx(floor, (-PW + 0.02, y1 - 0.33, max(low, -1.2)), (PW - 0.02, y1, top - 0.01), JOINT)
        for j in range(4):
            a, c = -PW + 2 * PW * j / 4, -PW + 2 * PW * (j + 1) / 4
            bx(floor, (a + GAP / 2, y1 - 0.34, max(low, -1.2)), (c - GAP / 2, y1 - 0.01, top), rng.choice(BLOCKS))
    for s in (-1, 1):
        doric(shell, (s * CX, yc, FZ), P["col_d"], P["col_d"] * 0.8, az - FZ, 4, BLOCKS, JOINT, BLOCKS[2], rng)
        for k in range(4):                                                           # the anta behind it, against the wall
            za, zb = FZ + (az - 0.1 - FZ) * k / 4, FZ + (az - 0.1 - FZ) * (k + 1) / 4
            bx(shell, (s * CX - 0.2, -hy - 0.07, za + GAP / 2), (s * CX + 0.2, -hy, zb - GAP / 2), rng.choice(BLOCKS))
        bx(shell, (s * CX - 0.24, -hy - 0.11, az - 0.1), (s * CX + 0.24, -hy, az), BLOCKS[2])
        bx(shell, (s * CX - 0.22, yc + 0.22 + GAP, az), (s * CX + 0.22, -hy, wh), rng.choice(BLOCKS))   # the side architrave
    bx(shell, (-CX - 0.24, yc - 0.22, az), (CX + 0.24, yc + 0.22, wh), rng.choice(BLOCKS))               # the front one, a single block
    for lo, hi in (((-CX - 0.4, yc - 0.4, wh), (CX + 0.4, yc + 0.24, wh + 0.1)),                          # the cornice, on three sides
                   ((-CX - 0.4, yc + 0.24 + GAP, wh), (-CX + 0.24, -hy, wh + 0.1)), ((CX - 0.24, yc + 0.24 + GAP, wh), (CX + 0.4, -hy, wh + 0.1))):
        bx(shell, lo, hi, BLOCKS[2])
    bx(shell, (-CX + 0.24, yc + 0.24, wh - 0.03), (CX - 0.24, -hy, wh + 0.02), BOARDS)                    # the ceiling's boards
    for k in range(1, 4):                                                                                 # on three joists
        y = yc + 0.24 + (-hy - yc - 0.24) * k / 4
        bx(shell, (-CX + 0.22, y - 0.05, wh - 0.13), (CX - 0.22, y + 0.05, wh - 0.03), TIMBER)
    pr = (CX + 0.3) * tp                                                             # the pediment's rise
    gable(shell, [(-CX - 0.3, wh + 0.1), (CX + 0.3, wh + 0.1), (0, wh + 0.1 + pr)], 1, yc - 0.18, yc + 0.02, wall)
    for s in (-1, 1):                                                                # the raking cornices
        shell.strut((s * (CX + 0.42), yc - 0.3, wh + 0.12), (0, yc - 0.3, wh + 0.12 + (CX + 0.42) * tp), 0.2, 0.09, BLOCKS[2])

    # --- the roofs --------------------------------------------------------------------------
    ax, ay, ez = hx + P["eaves"], hy + P["eaves"], wh + 0.07
    pe = CX + 0.75                                                                   # the porch roof's half-width at its eaves
    yf = yc - 0.5                                                                    # and its front edge
    main_z = lambda y: ez + (y + ay) * tp                                            # the hall's front slope
    porch_z = lambda x: ez + (pe - abs(x)) * tp
    roof_plane(shell, (-ax, -ay, ez), (1, 0, 0), (0, cp, sp), 2 * ax, ay / cp, TILES, RIDGES, BOARDS, rng,
               keep=lambda a, s: not (abs(a - ax) < pe and porch_z(a - ax) > main_z(-ay + s * cp) + 0.02))
    roof_plane(shell, (-ax, ay, ez), (1, 0, 0), (0, -cp, sp), 2 * ax, ay / cp, TILES, RIDGES, BOARDS, rng)
    for s in (-1, 1):
        roof_plane(shell, (s * pe, yf, ez), (0, 1, 0), (-s * cp, 0, sp), -ay + pe - yf, pe / cp, TILES, RIDGES, BOARDS, rng,
                   keep=lambda a, s_: yf + a < -ay or ez + s_ * sp > main_z(yf + a) - 0.02)
    top = ez + ay * tp
    nr = round(2 * ax / 0.5)
    for k in range(nr):                                                              # the ridge, tile by tile
        a, c = -ax + 2 * ax * k / nr, -ax + 2 * ax * (k + 1) / nr
        bx(shell, (a + 0.004, -0.14, top + 0.06), (c - 0.004, 0.14, top + 0.17), rng.choice(RIDGES))
        bx(shell, (a + 0.004, -0.07, top + 0.17), (c - 0.004, 0.07, top + 0.21), RIDGES[0])
    ptop, pend = ez + pe * tp, -ay + pe - 0.15
    nr = round((pend - yf) / 0.5)
    for k in range(nr):                                                              # the porch's ridge, into the slope
        a, c = yf + (pend - yf) * k / nr, yf + (pend - yf) * (k + 1) / nr
        bx(shell, (-0.14, a + 0.004, ptop + 0.06), (0.14, c - 0.004, ptop + 0.17), rng.choice(RIDGES))
        bx(shell, (-0.07, a + 0.004, ptop + 0.17), (0.07, c - 0.004, ptop + 0.21), RIDGES[0])
    for s in (-1, 1):                                                                # gable ends
        x0, x1 = (hx - T, hx) if s > 0 else (-hx, -hx + T)
        gable(shell, [(-hy, wh), (hy, wh), (hy, ez + P["eaves"] * tp - 0.01), (0, top - 0.01), (-hy, ez + P["eaves"] * tp - 0.01)],
              0, x0, x1, wall)
        xa, xb = (hx, ax - 0.05) if s > 0 else (-ax + 0.05, -hx)                     # purlin ends: ridge and two wall plates
        bx(shell, (xa, -0.09, top - 0.2), (xb, 0.09, top - 0.02), TIMBER)
        for y in (-hy + 0.02, hy - 0.2):
            bx(shell, (xa, y, wh - 0.12), (xb, y + 0.18, wh + 0.04), TIMBER)
    k = 0
    while -hx + 0.15 + k * 0.55 < hx - 0.2:                                          # rafter ends under the eaves
        x = -hx + 0.15 + k * 0.55
        if abs(x + 0.05) > pe:
            bx(shell, (x, -ay + 0.04, ez - 0.16), (x + 0.1, -hy, ez - 0.02), TIMBER)
        bx(shell, (x, hy, ez - 0.16), (x + 0.1, ay - 0.04, ez - 0.02), TIMBER)
        k += 1

    # --- the reading room -------------------------------------------------------------------
    bx(shell, (-hx + T, -hy + T, wh - 0.06), (hx - T, hy - T, wh), BOARDS)           # boarding overhead
    for x in (-1.2, 0.0, 1.2):                                                       # on three beams
        bx(shell, (x - 0.08, -hy + T, wh - 0.26), (x + 0.08, hy - T, wh - 0.06), TIMBER)
    cols, rows = P["rack"]
    r0, r1, rb, rd = -1.72, 1.72, FZ + 0.3, 0.4                                      # the rack: along the back wall
    cw, ch = (r1 - r0) / cols, 0.4
    ry1, ry0 = hy - T - 0.01, hy - T - 0.01 - rd
    bx(furn, (r0, ry1 - 0.03, rb), (r1, ry1, rb + rows * ch), PLANK)                 # its back
    for k in range(cols + 1):
        bx(furn, (r0 + k * cw - 0.015, ry0, rb - 0.3 if k in (0, cols) else rb), (r0 + k * cw + 0.015, ry1 - 0.03, rb + rows * ch), SHELF)
    for k in range(rows + 1):
        bx(furn, (r0 - 0.03, ry0 - 0.01, rb + k * ch - 0.015), (r1 + 0.03, ry1 - 0.03, rb + k * ch + 0.015), SHELF)
    full = rng.uniform(0.45, 0.9)                                                    # how full this library's racks are
    for i in range(cols):
        for j in range(rows):
            if rng.random() > full:
                continue
            x0, z0 = r0 + i * cw + 0.03, rb + j * ch + 0.015
            x, layer = x0, []
            while x + 0.11 < x0 + cw - 0.03 and rng.random() < 0.85:                 # a row lying on the shelf
                r = rng.uniform(0.04, 0.055)
                scroll(furn, (x + r, ry0 + rng.uniform(0.0, 0.05), z0 + r), r, 0.3, rng, rng.random() < 0.35)
                layer.append((x + r, r))
                x += 2 * r + 0.005
            for (xa, ra), (xb, rb_) in zip(layer, layer[1:]):                        # and some lying on those
                if rng.random() < 0.4:
                    r = rng.uniform(0.04, 0.05)
                    scroll(furn, ((xa + xb) / 2, ry0 + rng.uniform(0.0, 0.05), z0 + max(ra, rb_) * 1.75 + r), r, 0.3, rng)
    tx0, tx1, ty0, ty1, tz = 1.15, 2.2, -0.15, 0.6, FZ + 0.72                        # the reading table
    bx(furn, (tx0, ty0, tz - 0.05), (tx1, ty1, tz), SHELF)
    bx(furn, (tx0 + 0.06, ty0 + 0.06, tz - 0.14), (tx1 - 0.06, ty1 - 0.06, tz - 0.05), PLANK)
    for x in (tx0 + 0.07, tx1 - 0.07):
        for y in (ty0 + 0.07, ty1 - 0.07):
            bx(furn, (x - 0.035, y - 0.035, FZ), (x + 0.035, y + 0.035, tz - 0.05), TIMBER)
    bx(furn, (tx0 + 0.3, ty0 + 0.24, tz), (tx0 + 0.75, ty0 + 0.52, tz + 0.004), PAPYRUS[2])   # a scroll open on it
    for x in (tx0 + 0.27, tx0 + 0.78):
        furn.disc(Vector((x, ty0 + 0.38, tz + 0.03)), 0.03, 0.3, (0, 1, 0), PAPYRUS[0], 8)
    sx, sy = tx0 + 0.52, ty0 - 0.38                                                  # the stool, before it
    bx(furn, (sx - 0.2, sy - 0.2, FZ + 0.4), (sx + 0.2, sy + 0.2, FZ + 0.44), SHELF)
    for x in (sx - 0.16, sx + 0.16):
        for y in (sy - 0.16, sy + 0.16):
            bx(furn, (x - 0.025, y - 0.025, FZ), (x + 0.025, y + 0.025, FZ + 0.4), TIMBER)
    bkt = Vector((-1.75, -0.2, FZ))                                                  # a bucket of scrolls
    furn.lathe([(0.2, 0.0), (0.22, 0.42), (0.19, 0.42), (0.18, 0.04)], bkt, WICKER, 14)
    for k in range(6):
        a = k * 1.05
        furn.cyl(bkt + Vector((0.09 * math.cos(a), 0.09 * math.sin(a), 0.1)), 0.045, 0.045, 0.42 + 0.05 * (k % 3), rng.choice(PAPYRUS), 8)

    # --- stand it at its site -----------------------------------------------------------------
    # explorer (x, z) -> blender (x, -z); the plan's first half-axis runs at `rot` in explorer terms
    M = Matrix.Translation((cx, -cz, g)) @ Matrix.Rotation(-rot, 4, "Z")
    for part in (shell, floor, furn):
        part.place(M)
    ex = lambda x, y: (lambda v: [round(v.x, 2), round(-v.y, 2)])(M @ Vector((x, y, 0)))
    info.append({"at": [cx, cz], "ground": g, "floor": round(g + FZ, 2), "wall_top": round(g + wh, 2),
                 "ridge": round(g + top + 0.2, 2), "door": ex(0, -hy), "porch": ex(0, yc),
                 "steps": ex(0, -hy - PD - 0.9), "room": ex(0, 0), "rack": [ex(r0, ry0), ex(r1, ry0)],
                 "table": ex((tx0 + tx1) / 2, (ty0 + ty1) / 2), "stool": ex(sx, sy)})
    strips.append({"at": [cx, cz], "half": [hx0 + 0.3, hy0 + 0.3], "rot": b["rot"], "pad": g - 0.05})

objs = [shell.finish(), floor.finish(), furn.finish()]
json.dump({"_note": "Written by art/sets/libraries.py; explorer coords [x, z] in metres, heights above the sea. "
                    "`door`: the middle of the doorway; `porch`: the middle of the column line; `steps`: the "
                    "ground before the porch steps; `room`: the reading room's middle, at `floor`; `rack`: the "
                    "ends of the scroll rack's front; `table`, `stool`: the reading table and its stool.",
           "params": P, "libraries": info}, open(f"art/sets/{NAME}.json", "w"), indent=1)
json.dump({"_note": f"Written by art/sets/libraries.py for {NAME}: ground to clear, explorer [x, z].", "strips": strips},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("LIBRARIES", NAME, len(PLAN), "libraries,", sum(len(o.data.polygons) for o in objs), "faces")
