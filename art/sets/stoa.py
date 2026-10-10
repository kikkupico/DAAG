"""The stoa and the festival ground of the scholars' coast, in enough detail that a previs render
already shows every part of them: nothing is left for an image model to make up.

    blender -b -P art/sets/stoa.py -- stoa

Reads the site from art/sets/sets.json (`stoa`: `at` explorer [x, z] of the floor's centre,
`floor` its height, `yaw` degrees, `length`, `depth`, `columns`, and `festival`: the ground's
own `at`, `floor`, `yaw`, and its `rows` of `per_row` tables) and writes art/sets/stoa.glb (in
explorer coords, origin at the world's origin; objects `shell`, `floor`, `furniture`),
art/sets/stoa.json (what the previs and the books need to know: the columns, the bench, every
table) and art/sets/stoa-strips.json, the ground art/sets/bake.py levels under both.

The stoa stands on the eastern shore: a long portico of pale dressed limestone, one aisle deep,
its back wall to the slope and its colonnade of plain Doric columns facing the festival ground,
under a lean-to roof of terracotta tiles. Nothing in it marks a head or a middle: no door, no
dais, one bench the whole length of the back wall. The festival ground before it is a levelled
field with rows of long stone tables, a bench either side of each, where two copyists sit
facing each other.

The stoa's frame is local: X runs along it, the colonnade is towards -Y, the back wall towards
+Y, and Z = 0 is the terrace's top, a step below the floor. What is modelled, so that it need
not be described to an image model (the helpers are masonry.py's):
- the terrace in courses of dressed blocks, a rim of slabs, and the step the columns stand on;
- the floor of flagstones;
- the back wall and the two end walls in coursed ashlar inside and out, a tall course at the
  foot, the end walls rising with the roof;
- the columns: plain shafts of six drums, annulets, echinus, abacus;
- the entablature: an architrave of one block to a bay, a band, a frieze of triglyphs over a
  small strip each, plain metopes between, and a cornice;
- the roof: a rafter over every column and two between, boarding, and the tiles one by one,
  with a cover tile over each joint, an antefix at each eave end and a row of capping tiles
  along its head;
- the bench along the back wall, slab by slab on its blocks;
- the festival ground: beaten earth inside a kerb of stones, and each table as two slabs on
  three upright blocks, with a bench of two slabs on three blocks either side.
"""
import bpy, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, bx, ashlar, flags, roof_plane, doric, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
C = json.load(open("art/sets/sets.json"))[NAME]["stoa"]
(CX, CZ), FL, YAW = C["at"], C["floor"], math.radians(C.get("yaw", 0.0))
P = dict(
    length=C["length"], depth=C["depth"], columns=C.get("columns", 13),
    wall=0.6,                    # the walls' thickness
    step=0.25,                   # the floor above the terrace
    height=4.6,                  # the architrave's top above the terrace
    col_d=0.56,
    slope=0.28,                  # the roof's rise for each metre back
    table=(3.6, 0.8, 0.8),       # a festival table: long, across, high
)
rnd = random.Random(11)
L, W, T, ST, H, N = P["length"], P["depth"], P["wall"], P["step"], P["height"], P["columns"]
hx, hy = L / 2, W / 2

bpy.ops.wm.read_factory_settings(use_empty=True)

BLOCKS = [material("pale-limestone", (0.72, 0.68, 0.59), 0.8), material("pale-limestone_b", (0.67, 0.63, 0.55), 0.8),
          material("pale-limestone_c", (0.76, 0.72, 0.63), 0.8)]
TRIM = material("limestone-trim", (0.8, 0.76, 0.67), 0.75)
JOINT = material("joint", (0.33, 0.3, 0.26), 1.0)
FLAGS = [material("flagstone", (0.6, 0.57, 0.5), 0.85), material("flagstone_b", (0.55, 0.52, 0.46), 0.85),
         material("flagstone_c", (0.64, 0.61, 0.54), 0.85)]
TILES = [material("terracotta", (0.5, 0.2, 0.12), 0.8), material("terracotta_b", (0.55, 0.24, 0.14), 0.8),
         material("terracotta_c", (0.45, 0.18, 0.11), 0.8)]
RIDGES = [material("terracotta-cover", (0.41, 0.16, 0.1), 0.8), material("terracotta-cover_b", (0.46, 0.19, 0.12), 0.8)]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
BOARDS = material("roof-boards", (0.42, 0.3, 0.18), 0.85)
GRAVEL = material("gravel", (0.58, 0.53, 0.44), 1.0)
EARTH = material("beaten-earth", (0.6, 0.52, 0.38), 1.0)
TABLE = [material("table-stone", (0.74, 0.71, 0.64), 0.7), material("table-stone_b", (0.7, 0.67, 0.6), 0.7)]

shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")
low = max(-2.5, 0.05 - FL)                 # never below sea level: the island stands on its lowest point


def raked(part, prof, a, b, mat):
    """A wall with the outline `prof` (points across Y and up), from a to b along X."""
    lo, hi = [part.bm.verts.new((a, y, z)) for y, z in prof], [part.bm.verts.new((b, y, z)) for y, z in prof]
    k, n = part.slot(mat), len(prof)
    for i in range(n):
        part.face((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]), k)
    part.face(lo[::-1], k)
    part.face(hi, k)


# --- the terrace, its rim and the step -------------------------------------------------------
bx(floor, (-hx - 0.8, -hy - 0.8, max(low, -0.6)), (hx + 0.8, hy + 0.8, -0.22), GRAVEL)        # an apron of gravel round it
bx(floor, (-hx - 0.2, -hy - 0.2, low), (hx + 0.2, hy + 0.2, -0.03), JOINT)
tz = [low + (0.0 - low) * k / 6 for k in range(7)]
for p0, u, n_ in (((-hx - 0.3, -hy - 0.3, 0), (1, 0, 0), L + 0.6), ((hx + 0.3, -hy - 0.3, 0), (0, 1, 0), W + 0.6),
                  ((hx + 0.3, hy + 0.3, 0), (-1, 0, 0), L + 0.6), ((-hx - 0.3, hy + 0.3, 0), (0, -1, 0), W + 0.6)):
    ashlar(floor, Vector(p0) - Vector((u[1], -u[0], 0)) * 0.1, u, n_, tz, 1.2, BLOCKS, JOINT, rnd, depth=0.1)
flags(floor, -hx - 0.3, hx + 0.3, -hy - 0.3, hy + 0.3, 0.0, FLAGS, rnd, row=0.6, size=(0.9, 1.4), bed=JOINT)
bx(floor, (-hx + 0.01, -hy + 0.01, 0.0), (hx - 0.01, hy - 0.01, ST - 0.04), JOINT)
ns = round(L / 1.2)
for k in range(ns):                                                     # the step the columns stand on
    a, b = -hx + L * k / ns, -hx + L * (k + 1) / ns
    bx(floor, (a + GAP / 2, -hy, 0.0), (b - GAP / 2, -hy + 0.8, ST), rnd.choice(BLOCKS))
flags(floor, -hx, hx, -hy + 0.8, hy - T, ST, FLAGS, rnd, row=0.9, size=(0.8, 1.3))

# --- the walls: coursed ashlar inside and out, the ends rising with the roof ------------------
EY, EZ = -hy - 0.55, H + 0.5               # the roof's eave: its edge, and the height of its underside there
SL = P["slope"]
zr = lambda y: EZ + (y - EY) * SL          # the underside of the roof's boarding
UNDER = 0.24                               # the rafters' depth beneath it
ya = -hy + 0.8                             # where the end walls begin, behind the architrave
zb = zr(hy - T) - UNDER                    # the back wall's top


def courses(z0, z1):
    """A tall course at the foot, then even ones up to z1."""
    n = max(1, round((z1 - z0 - 0.9) / 0.45))
    return [z0, z0 + 0.9] + [z0 + 0.9 + (z1 - z0 - 0.9) * (k + 1) / n for k in range(n)]


bx(shell, (-hx + 0.11, hy - T + 0.11, 0.0), (hx - 0.11, hy - 0.11, zb), JOINT)                 # the back wall's core
ashlar(shell, (hx - T, hy - T + 0.12, 0), (-1, 0, 0), L - 2 * T, courses(ST, zb), 1.25, BLOCKS, JOINT, rnd, out=(0, -1, 0))
ashlar(shell, (hx, hy - 0.12, 0), (-1, 0, 0), L, courses(0.0, zb), 1.25, BLOCKS, JOINT, rnd)
for k in range(round(L / 1.25)):                                                               # its coping
    a, b = -hx + L * k / round(L / 1.25), -hx + L * (k + 1) / round(L / 1.25)
    bx(shell, (a + GAP / 2, hy - T - 0.03, zb), (b - GAP / 2, hy + 0.03, zb + 0.1), TRIM)
for s in (-1, 1):
    x0, x1 = (hx - T, hx) if s > 0 else (-hx, -hx + T)
    raked(shell, [(ya + 0.02, 0.0), (hy - 0.11, 0.0), (hy - 0.11, zb), (hy - T + 0.13, zb), (ya + 0.02, zr(ya) - UNDER)],
          x0 + 0.11, x1 - 0.11, BLOCKS[1])
    rise = (zb - (zr(ya) - UNDER)) / (hy - T - ya)
    run = hy - T + 0.12 - ya
    zs = courses(0.0, zb)
    # outside: from the front corner back, the wall's top rising; inside, from the back wall forward
    ashlar(shell, (s * hx - s * 0.12, ya, 0), (0, 1, 0), hy - ya, zs, 1.2, BLOCKS, JOINT, rnd, out=(s, 0, 0),
           rake=(zr(ya) - UNDER, rise))
    ashlar(shell, (s * (hx - T) + s * 0.12, ya, 0), (0, 1, 0), run - 0.12, courses(ST, zb), 1.2, BLOCKS, JOINT, rnd,
           out=(-s, 0, 0), rake=(zr(ya) - UNDER, rise))
    for k in range(5):                                                                         # the anta at the wall's front end
        za, zc = ST + (H - 0.5 - ST) * k / 5, ST + (H - 0.5 - ST) * (k + 1) / 5
        bx(shell, (x0 - 0.02, ya - 0.02, za + GAP / 2), (x1 + 0.02, ya + 0.5, zc - GAP / 2), rnd.choice(BLOCKS))
    bx(shell, (x0 - 0.06, ya - 0.06, H - 0.5), (x1 + 0.06, ya + 0.54, H - 0.4), TRIM)          # and its capital

# --- the colonnade and its entablature -------------------------------------------------------
CY = -hy + 0.4
xs = [-hx + 0.5 + k * (L - 1.0) / (N - 1) for k in range(N)]
for x in xs:
    doric(shell, (x, CY, ST), P["col_d"], P["col_d"] * 0.8, H - 0.4 - ST, 6, BLOCKS, JOINT, TRIM, rnd, segs=24)
bx(shell, (-hx + 0.02, CY - 0.36, H - 0.39), (hx - 0.02, CY + 0.36, H - 0.01), JOINT)
ends = [-hx] + xs[1:-1] + [hx]
for a, b in zip(ends, ends[1:]):                                        # the architrave, a joint over each column
    bx(shell, (a + GAP / 2, CY - 0.38, H - 0.4), (b - GAP / 2, CY + 0.38, H), rnd.choice(BLOCKS))
bx(shell, (-hx, CY - 0.42, H - 0.05), (hx, CY + 0.42, H), TRIM)         # the band along its top
FH = 0.36                                                               # the frieze
bx(shell, (-hx, CY - 0.36, H), (hx, CY + 0.36, H + FH), BLOCKS[0])
tri = []
for a, b in zip(xs, xs[1:]):
    tri += [a + (b - a) * j / 3 for j in range(3)]
for x in tri + [xs[-1]]:                                                # triglyphs: three bars over a groove, a strip beneath
    bx(shell, (x - 0.13, CY - 0.385, H + 0.01), (x + 0.13, CY - 0.36, H + FH - 0.04), JOINT)
    for k in (-1, 0, 1):
        bx(shell, (x + k * 0.085 - 0.032, CY - 0.41, H), (x + k * 0.085 + 0.032, CY - 0.36, H + FH - 0.04), TRIM)
    bx(shell, (x - 0.14, CY - 0.42, H + FH - 0.04), (x + 0.14, CY - 0.36, H + FH), TRIM)
    bx(shell, (x - 0.13, CY - 0.44, H - 0.09), (x + 0.13, CY - 0.38, H - 0.05), TRIM)
nc = round(L / 1.2)
for k in range(nc):                                                     # the cornice
    a, b = -hx - 0.1 + (L + 0.2) * k / nc, -hx - 0.1 + (L + 0.2) * (k + 1) / nc
    bx(shell, (a + GAP / 2, CY - 0.62, H + FH), (b - GAP / 2, CY + 0.4, H + FH + 0.1), TRIM)
bx(shell, (-hx, CY - 0.5, H + FH - 0.03), (hx, CY - 0.36, H + FH), TRIM)

# --- the roof: wall plate, rafters, boarding, tiles ---------------------------------------------
bx(shell, (-hx, CY - 0.2, H + FH + 0.1), (hx, CY + 0.2, zr(CY) - UNDER + 0.02), TIMBER)        # the plate on the cornice
raft = []
for a, b in zip(xs, xs[1:]):
    raft += [a + (b - a) * j / 3 for j in range(3)]
for x in raft + [xs[-1]]:
    shell.strut((x, EY + 0.08, zr(EY + 0.08) - UNDER / 2), (x, hy + 0.12, zr(hy + 0.12) - UNDER / 2), 0.12, UNDER, TIMBER)
for s in (-1, 1):                                                       # and one lying along each end wall's top
    shell.strut((s * (hx - T / 2), ya, zr(ya) - UNDER / 2), (s * (hx - T / 2), hy + 0.12, zr(hy + 0.12) - UNDER / 2), T, UNDER, TIMBER)
bx(shell, (-hx + T, hy - 0.2, zb + 0.1), (hx - T, hy - 0.1, zr(hy - 0.2)), BOARDS)                # boards closing the wall's head between them
th = math.atan(SL)
RL = (hy + 0.2 - EY) / math.cos(th)
roof_plane(shell, (-hx - 0.3, EY, EZ), (1, 0, 0), (0, math.cos(th), math.sin(th)), L + 0.6, RL, TILES, RIDGES, BOARDS, rnd)
top = zr(hy + 0.2)
nr = round((L + 0.6) / 0.5)
for k in range(nr):                                                     # capping tiles along the roof's head
    a, b = -hx - 0.3 + (L + 0.6) * k / nr, -hx - 0.3 + (L + 0.6) * (k + 1) / nr
    bx(shell, (a + 0.004, hy + 0.0, top + 0.1), (b - 0.004, hy + 0.27, top + 0.2), rnd.choice(RIDGES))
    bx(shell, (a + 0.004, hy + 0.2, top - 0.12), (b - 0.004, hy + 0.27, top + 0.1), RIDGES[0])
bx(shell, (-hx - 0.25, hy + 0.12, top - 0.3), (hx + 0.25, hy + 0.2, top - 0.02), TIMBER)       # a fascia under them

# --- the bench along the back wall -------------------------------------------------------------
b0, b1, by0, by1 = -hx + T + 0.6, hx - T - 0.6, hy - T - 0.46, hy - T - 0.01
nb = round((b1 - b0) / 1.9)
for k in range(nb):
    a, b = b0 + (b1 - b0) * k / nb, b0 + (b1 - b0) * (k + 1) / nb
    bx(furn, (a + GAP / 2, by0, ST + 0.38), (b - GAP / 2, by1, ST + 0.46), rnd.choice(TABLE))
for k in range(nb + 1):
    x = min(max(b0 + (b1 - b0) * k / nb, b0 + 0.12), b1 - 0.12)
    bx(furn, (x - 0.11, by0 + 0.06, ST), (x + 0.11, by1, ST + 0.38), rnd.choice(BLOCKS))

M = Matrix.Translation((CX, -CZ, FL)) @ Matrix.Rotation(YAW, 4, "Z")
for part in (shell, floor, furn):
    part.place(M)
ex = lambda Mx, x, y: (lambda v: [round(v.x, 2), round(-v.y, 2)])(Mx @ Vector((x, y, 0)))
info = {
    "_note": "Written by art/sets/stoa.py; explorer coords [x, z] in metres, heights above the sea. `middle`: the "
             "middle of the stoa's floor, at `floor`; `front`: a point out before the colonnade; `columns`: each "
             "column's foot; `bench`: the ends of the bench along the back wall; `ground`: the festival ground's "
             "middle, at `ground_floor`; `tables`: each table's two ends and the middles of its two benches.",
    "params": P,
    "middle": ex(M, 0, 0), "floor": round(FL + ST, 2), "front": ex(M, 0, -hy - 6.0),
    "columns": [ex(M, x, CY) for x in xs], "bench": [ex(M, b0, (by0 + by1) / 2), ex(M, b1, (by0 + by1) / 2)],
    "eaves": round(FL + EZ, 2),
}
strips = [{"at": [CX, CZ], "half": [hx + 0.8, hy + 0.8], "rot": math.degrees(-YAW), "pad": FL - 0.25}]

# --- the festival ground: beaten earth inside a kerb, rows of long stone tables ----------------
fg = C.get("festival")
if fg:
    (fx, fz), fl, fyaw = fg["at"], fg["floor"], math.radians(fg.get("yaw", 0.0))
    rows, per = fg.get("rows", 3), fg.get("per_row", 2)
    gx, gy = 2.5 * per + 2.5, 5.5
    TL, TW, TH = P["table"]
    bx(floor, (-gx, -gy, max(-0.6, 0.05 - fl)), (gx, gy, 0.0), EARTH)
    for p0, u, n_ in (((-gx, -gy, 0), (1, 0, 0), 2 * gx), ((gx, -gy, 0), (0, 1, 0), 2 * gy),
                      ((gx, gy, 0), (-1, 0, 0), 2 * gx), ((-gx, gy, 0), (0, -1, 0), 2 * gy)):
        p0, u = Vector(p0), Vector(u)
        inw = Vector((-u.y, u.x, 0))
        for a, b in masonry.lengths(0.0, n_, 0.5, 1.0, rnd):                 # the kerb, stone by stone
            floor.box(p0 + u * ((a + b) / 2) + inw * 0.13 + Vector((0, 0, 0.02)), (b - a - 0.02, 0.26, 0.14),
                      rnd.choice(BLOCKS), yaw=math.atan2(u.y, u.x))
    tables = []
    for r in range(rows):
        for c in range(per):
            x, y = (c - (per - 1) / 2) * 5.0, -3.0 + r * 3.0
            for s in (-1, 1):                                               # the top, in two slabs
                bx(furn, (x + min(0, s * TL / 2) + GAP / 2, y - TW / 2, TH - 0.09), (x + max(0, s * TL / 2) - GAP / 2, y + TW / 2, TH), rnd.choice(TABLE))
            for sx in (-TL / 2 + 0.4, 0.0, TL / 2 - 0.4):                    # on three upright blocks, each on its foot
                bx(furn, (x + sx - 0.19, y - TW / 2 + 0.06, 0.0), (x + sx + 0.19, y + TW / 2 - 0.06, 0.08), rnd.choice(BLOCKS))
                bx(furn, (x + sx - 0.12, y - TW / 2 + 0.11, 0.08), (x + sx + 0.12, y + TW / 2 - 0.11, TH - 0.09), rnd.choice(BLOCKS))
            for sy in (-0.8, 0.8):                                           # a bench either side
                for s in (-1, 1):
                    bx(furn, (x + min(0, s * TL / 2) + GAP / 2, y + sy - 0.17, 0.37), (x + max(0, s * TL / 2) - GAP / 2, y + sy + 0.17, 0.45), rnd.choice(TABLE))
                for sx in (-TL / 2 + 0.3, 0.0, TL / 2 - 0.3):
                    bx(furn, (x + sx - 0.1, y + sy - 0.13, 0.0), (x + sx + 0.1, y + sy + 0.13, 0.37), rnd.choice(BLOCKS))
            tables.append((x, y))
    M2 = Matrix.Translation((fx, -fz, fl)) @ Matrix.Rotation(fyaw, 4, "Z")
    for part in (floor, furn):
        part.place(M2)
    info.update({"ground": ex(M2, 0, 0), "ground_floor": fl, "table_top": round(fl + TH, 2),
                 "tables": [{"ends": [ex(M2, x - TL / 2, y), ex(M2, x + TL / 2, y)],
                             "seats": [ex(M2, x, y - 0.8), ex(M2, x, y + 0.8)]} for x, y in tables]})
    strips.append({"at": fg["at"], "half": [gx, gy], "rot": math.degrees(-fyaw), "pad": fl - 0.05})

objs = [shell.finish(), floor.finish(), furn.finish()]
json.dump(info, open(f"art/sets/{NAME}.json", "w"), indent=1)
json.dump({"_note": f"Written by art/sets/stoa.py for {NAME}: ground to level, explorer [x, z].", "strips": strips},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("STOA", NAME, sum(len(o.data.polygons) for o in objs), "faces")
