"""A trading house of Arche above its harbour, in enough detail that a previs render already shows
every part of the building: nothing of it is left for an image model to make up.

    blender -b -P art/sets/house.py -- <set name>        # e.g. house3

Reads its site from art/sets/sets.json (`at`, and `house`: the building's front line, its
direction and its extent) and writes art/sets/<name>.glb, art/sets/<name>.json (what the previs and
the book need to know: the board, the gate, the doors) and art/sets/<name>-strips.json (the
ground art/sets/bake.py clears of Meshy's buildings before joining this in).

The three houses are alike, so one builder serves all three. A house is one long range, its
walls lime-plastered over rubble on a bare rubble base, on a level pad cut into the lowest
terraces above the harbour, facing the quay across the waterfront road:
- the clerks' office at one end, where the tallies and columns are kept, with a door and
  small high windows onto the road;
- the gate, a deep entrance passage opening onto the road, where slips come in;
- the storehouse at the other end, with loading doors onto the road and slit windows high up;
- a Doric portico the length of the range, along the road's edge, with a lean-to tiled roof;
- under the portico, beside the gate, the board of orders: a long timber board at chest height
  with a row of numbered slots, and the peg beside it;
- grain sacks stacked by the storehouse door.

The set's frame is local: X runs along the range's front, the portico and the road beyond it
are towards -Y, the slope towards +Y, and the range's front wall is Y = 0, at pad level. The GLB is written already
turned to the site's yaw, so render.py and explorer.html place it with no rotation, and its
objects are `shell`, `floor` and `furniture`, as for the other sets.

What is modelled, so that it need not be described to an image model (the helpers are masonry.py's):
- the rubble base stone by stone, in three rough courses of uneven stones, under smooth plaster;
- every opening with stone jambs, a lintel and a threshold; the gate's two boarded leaves folded
  back inside its passage; the storehouse's pair of boarded leaves, one standing open; the office's
  boarded door, shut; each window with a timber lintel, a sill and two upright bars;
- both roofs tile by tile: pans in courses, a cover tile over each joint, an antefix at each eave
  end, a row of ridge tiles; the rafter ends under the eaves and the purlin ends at each gable;
- the portico: eight plain columns of four drums each, with annulets, echinus and abacus, standing
  on a floor of flagstones behind a kerb of dressed blocks; a stone architrave, one block to a
  bay; a timber ledger on stone corbels along the wall; a rafter over every column and two
  between, boarding above;
- the board of orders: three planks on battens, a shelf on brackets, thirteen dividers making
  twelve slots, a top rail with a blank tag over each slot (the numeral's place), tablets in
  the first five; beside it the peg on its post;
- the grain sacks, each with its tied neck.
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
H = SITE["house"]
P = dict(
    x0=H["x0"], x1=H["x1"],      # the range's ends along the quay edge
    depth=H["depth"],            # the range, from the edge back towards the road
    portico=3.6,                 # the portico's depth out onto the quay
    wall=0.5, wall_h=4.8,        # the range's walls
    pitch=22.0, eaves=0.45,
    gate=(-3.8, -1.4),           # the gate passage, along X
    office=-4.3,                 # the office runs from x0 to here
    board=(-0.6, 4.2), slots=12,
    store_door=(5.0, 6.8),
    columns=8, col_d=0.44, col_h=3.1,
    base=0.25,                   # the portico's floor above the quay
)
YAW = math.radians(H["yaw"])     # blender rotation: local +X onto the quay edge's direction
W, WH, D = P["wall"], P["wall_h"], P["depth"]
X0, X1 = P["x0"], P["x1"]
rnd = random.Random(sum(map(ord, NAME)))      # each house's stones and tiles fall differently

bpy.ops.wm.read_factory_settings(use_empty=True)

STONE = material("plaster", (0.86, 0.82, 0.72), 0.9)          # lime plaster over rubble
RUBBLE = [material("rubble-base", (0.5, 0.46, 0.4), 0.95), material("rubble-base_b", (0.44, 0.41, 0.36), 0.95),
          material("rubble-base_c", (0.56, 0.52, 0.45), 0.95)]
MORTAR = material("mortar", (0.3, 0.27, 0.23), 1.0)
DRESSED = material("dressed-stone", (0.6, 0.56, 0.49), 0.8)
DRESSED_B = material("dressed-stone_b", (0.55, 0.51, 0.45), 0.8)
DRESSED_C = material("dressed-stone_c", (0.65, 0.61, 0.54), 0.8)
BLOCKS = [DRESSED, DRESSED_B, DRESSED_C]
TILES = [material("terracotta", (0.5, 0.2, 0.12), 0.8), material("terracotta_b", (0.55, 0.24, 0.14), 0.8),
         material("terracotta_c", (0.45, 0.18, 0.11), 0.8)]
RIDGES = [material("terracotta-cover", (0.41, 0.16, 0.1), 0.8), material("terracotta-cover_b", (0.46, 0.19, 0.12), 0.8)]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
PLANK = material("plank", (0.37, 0.25, 0.14), 0.75)
BOARDS = material("roof-boards", (0.42, 0.3, 0.18), 0.85)
BOARD = material("board", (0.42, 0.28, 0.15), 0.7)
TAG = material("tag", (0.74, 0.66, 0.5), 0.8)
PAVING = material("paving", (0.47, 0.45, 0.41), 0.9)
FLAGS = [material("flagstone", (0.55, 0.52, 0.47), 0.85), material("flagstone_b", (0.5, 0.47, 0.42), 0.85),
         material("flagstone_c", (0.6, 0.57, 0.51), 0.85)]
DARK = material("dark", (0.08, 0.07, 0.06), 1.0)
IRON = material("iron", (0.2, 0.19, 0.18), 0.5, 0.8)
SACKING = material("sacking", (0.66, 0.56, 0.4), 1.0)
CLAY = material("clay", (0.62, 0.36, 0.22), 0.8)

shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")


def bx(part, lo, hi, mat):
    """An axis-aligned box from corner lo to corner hi."""
    part.box([(a + b) / 2 for a, b in zip(lo, hi)], [abs(b - a) for a, b in zip(lo, hi)], mat)


def tilted(part, c, u, v, n, size, mat):
    """A box centred on c with its edges along the unit vectors u, v, n."""
    M = Matrix.Translation(Vector(c)) @ Matrix([u, v, n]).transposed().to_4x4()
    part.paint(bmesh.ops.create_cube(part.bm, size=1.0, matrix=M @ Matrix.Diagonal((*size, 1))), mat)


def rubble(part, a, b, z0, z1, face, along_x=True, out=-1):
    """A rubble base between a and b along the wall, from z0 to z1, its stones standing out from
    the plane `face` towards `out`: three rough courses of uneven stones over dark mortar."""
    def stone(u0, u1, w0, w1, d):
        lo, hi = sorted((face, face + out * d))
        if along_x:
            bx(part, (u0, lo, w0), (u1, hi, w1), rnd.choice(RUBBLE))
        else:
            bx(part, (lo, u0, w0), (hi, u1, w1), rnd.choice(RUBBLE))
    n = 3
    edges = [z0] + sorted(z0 + (z1 - z0) * (k + rnd.uniform(-0.18, 0.18)) / n for k in range(1, n)) + [z1]
    for w0, w1 in zip(edges, edges[1:]):
        u = a
        while u < b - 0.02:
            L = min(rnd.uniform(0.22, 0.6), b - u)
            if b - u - L < 0.15:
                L = b - u
            stone(u + 0.012, u + L - 0.012, w0 + 0.01, w1 - 0.012, rnd.uniform(0.05, 0.1))
            u += L


def mortar(part, lo, hi):
    bx(part, lo, hi, MORTAR)


def slope_tiles(part, xa, xb, eave, head, deck=0.05, antefix=True):
    """A roof plane tile by tile between xa and xb, rising from the point `eave` (y, z) to `head`:
    boarding, courses of pans each lying a little tilted on the one below, a cover tile over every
    joint, and an antefix at each eave end."""
    ey, ez_ = eave
    hy, hz = head
    L = math.hypot(hy - ey, hz - ez_)
    sl = Vector((0, (hy - ey) / L, (hz - ez_) / L))
    up = Vector((0, -sl.z, sl.y)) if sl.y > 0 else Vector((0, sl.z, -sl.y))
    if up.z < 0:
        up = -up
    xu = Vector((1, 0, 0))
    o = Vector((0, ey, ez_))
    n = max(1, round((xb - xa) / 0.42))
    w = (xb - xa) / n
    rows = max(1, round(L / 0.62))
    tilted(part, o + Vector(((xa + xb) / 2, 0, 0)) + sl * (L / 2) + up * (deck / 2), xu, sl, up, (xb - xa, L, deck), BOARDS)
    tip = Matrix.Rotation(math.radians(3.5 if sl.y > 0 else -3.5), 3, "X")
    for k in range(n):
        for r in range(rows):
            c = o + Vector((xa + w * (k + 0.5), 0, 0)) + sl * (L * (r + 0.5) / rows) + up * (deck + 0.035)
            tilted(part, c, xu, tip @ sl, tip @ up, (w - 0.008, L / rows + 0.05, 0.035), rnd.choice(TILES))
    for k in range(n + 1):
        m = rnd.choice(RIDGES)
        c = o + Vector((xa + w * k, 0, 0)) + sl * (L / 2) + up * (deck + 0.085)
        tilted(part, c, xu, sl, up, (0.14, L, 0.06), m)
        tilted(part, c + up * 0.045, xu, sl, up, (0.075, L, 0.03), m)
        if antefix:
            e = o + Vector((xa + w * k, 0, 0)) + up * (deck + 0.1) - sl * 0.02
            part.box(e, (0.16, 0.05, 0.15), RIDGES[0])
            part.disc(e + Vector((0, 0, 0.075)), 0.08, 0.05, (0, 1, 0), RIDGES[0], 10)


def leaf(part, hinge, u, width, height, z0, nb=4, studs=True):
    """A door leaf of upright boards on three ledges, from its hinge edge along the unit vector u;
    the ledges are on the side the normal (u turned a quarter left) points to."""
    u = Vector(u)
    nrm = Vector((-u.y, u.x, 0))
    yaw = math.atan2(u.y, u.x)
    at = lambda a, z, o=0.0: Vector(hinge) + u * a + nrm * o + Vector((0, 0, z0 + z))
    for k in range(nb):
        part.box(at(width * (k + 0.5) / nb, height / 2), (width / nb - 0.008, 0.05, height), PLANK if k % 2 else TIMBER, yaw=yaw)
    part.box(at(width / 2, height / 2), (width - 0.01, 0.03, height - 0.02), DARK, yaw=yaw)
    for z in (0.35, height / 2, height - 0.35):
        part.box(at(width / 2, z, 0.045), (width - 0.06, 0.04, 0.14), TIMBER, yaw=yaw)
        if studs:
            for k in range(nb):
                part.sphere(at(width * (k + 0.5) / nb, z, -0.03), 0.02, IRON, 1.0, 8, 5)


# --- ground: a base under the whole house; the portico's floor of flagstones behind a kerb ------
Y0 = -P["portico"] - 0.3
bx(floor, (X0 - 0.4, Y0, max(-1.5, 0.05 - SITE["at"][1])), (X1 + 0.4, D + 0.4, 0.04), PAVING)   # never below sea level
BZ = P["base"]
bx(floor, (X0 + 0.01, -P["portico"] + 0.01, 0.04), (X1 - 0.01, 0.0, BZ - 0.008), MORTAR)
nk = round((X1 - X0) / 1.1)
for k in range(nk):                                                     # the kerb the columns stand on
    a, b = X0 + (X1 - X0) * k / nk, X0 + (X1 - X0) * (k + 1) / nk
    bx(floor, (a + GAP / 2, -P["portico"], 0.04), (b - GAP / 2, -P["portico"] + 0.8, BZ), rnd.choice(BLOCKS))
rows_y = [-P["portico"] + 0.8, -2.05, -1.3, -0.62, 0.0]
for r, (ya, yb) in enumerate(zip(rows_y, rows_y[1:])):                  # flagstones, each row breaking joint
    u = X0
    while u < X1 - 0.02:
        L = min(rnd.uniform(0.7, 1.3), X1 - u)
        if X1 - u - L < 0.4:
            L = X1 - u
        bx(floor, (u + 0.008, ya + 0.008, BZ - 0.02), (u + L - 0.008, yb - 0.008, BZ), rnd.choice(FLAGS))
        u += L
for a, b in ((X0, X0 + 0.02), (X1 - 0.02, X1)):                         # the floor's ends
    bx(floor, (a, -P["portico"] + 0.8, 0.04), (b, 0.0, BZ - 0.004), DRESSED_B)

# --- the range: plastered walls with openings -------------------------------------------------
def wall_x(y0, y1, spans, z1=WH, sill=0.0):
    """A wall running along X between y0 and y1, solid except for `spans`:
    (xa, xb, za, zb) openings."""
    xs = sorted({X0, X1} | {v for s in spans for v in s[:2]})
    for a, b in zip(xs, xs[1:]):
        op = [s for s in spans if s[0] <= a and b <= s[1]]
        if not op:
            bx(shell, (a, y0, sill), (b, y1, z1), STONE)
        else:
            _, _, za, zb = op[0]
            if za > sill:
                bx(shell, (a, y0, sill), (b, y1, za), STONE)
            bx(shell, (a, y0, zb), (b, y1, z1), STONE)

g0, g1 = P["gate"]
sd0, sd1 = P["store_door"]
od = (-7.8, -6.6)
GH, SH, OH = 3.3, 2.7, 2.3                  # the openings' heights
windows = [w for w in ((-10.0, -9.5), (-5.4, -5.0)) if w[0] > X0 + W]    # small and high: little shows to the street
slits = [x for x in (1.0, 3.2) if X0 < x < X1]                            # slit windows high on the storehouse
front = [(g0, g1, 0.0, GH), (sd0, sd1, 0.0, SH), (od[0], od[1], 0.0, OH)] + \
        [(a, b, 2.3, 2.9) for a, b in windows] + [(x, x + 0.25, 3.1, 3.6) for x in slits]
wall_x(0.0, W, front)
wall_x(D - W, D, [])                     # the back wall is against the cut slope: no way through
for x in (X0, X1 - W):
    bx(shell, (x, W, 0), (x + W, D - W, WH), STONE)
for x in (g0 - W, g1):                                              # the gate passage's side walls
    bx(shell, (x, W, 0), (x + W, D - W, WH), STONE)
bx(shell, (P["office"], W, 0), (P["office"] + 0.3, D - W, WH), STONE)   # the office's partition
# the bare rubble base under the plaster, all round, broken by the doorways
SZ = 0.6
doors = [(g0, g1, GH), (sd0, sd1, SH), (od[0], od[1], OH)]
cuts = [X0 - 0.05] + [v for a, b, _ in sorted(doors) for v in (a - 0.2, b + 0.2)] + [X1 + 0.05]
for a, b in zip(cuts[::2], cuts[1::2]):
    mortar(shell, (a, -0.04, BZ), (b, 0.0, SZ))
    rubble(shell, a, b, BZ, SZ, -0.0)
mortar(shell, (X0 - 0.05, D, 0), (X1 + 0.05, D + 0.04, SZ))
rubble(shell, X0 - 0.05, X1 + 0.05, 0.0, SZ, D, out=1)
for xf, o in ((X0, -1), (X1, 1)):
    mortar(shell, (xf, -0.02, 0) if o > 0 else (xf - 0.04, -0.02, 0), (xf + 0.04, D + 0.02, SZ) if o > 0 else (xf, D + 0.02, SZ))
    rubble(shell, -0.05, D + 0.05, 0.0, SZ, xf, along_x=False, out=o)
# each doorway: jambs in three blocks, a lintel, a threshold
for a, b, zt in doors:
    for xa, xb in ((a - 0.2, a), (b, b + 0.2)):
        for k in range(3):
            za, zb = BZ + (zt - BZ) * k / 3, BZ + (zt - BZ) * (k + 1) / 3
            bx(shell, (xa, -0.1, za + 0.006), (xb, 0.02, zb - 0.006), rnd.choice(BLOCKS))
        bx(shell, (xa + 0.01, -0.08, BZ), (xb - 0.01, 0.02, zt), MORTAR)
        bx(shell, (min(xa, xb), 0.0, 0.0), (max(xa, xb), W, zt), DRESSED_B)            # the reveal
    bx(shell, (a - 0.34, -0.13, zt), (b + 0.34, 0.02, zt + 0.34), DRESSED_C)           # the lintel
    bx(shell, (a - 0.2, 0.0, zt), (b + 0.2, W, zt + 0.02), DRESSED_B)
    bx(floor, (a, -0.14, BZ - 0.02), (b, W + 0.02, BZ + 0.035), DRESSED_B)             # the threshold
for a, b in windows:                                                                   # lintel, sill, two bars, dark within
    bx(shell, (a - 0.12, -0.05, 2.9), (b + 0.12, 0.06, 3.02), TIMBER)
    bx(shell, (a - 0.08, -0.07, 2.25), (b + 0.08, 0.06, 2.31), DRESSED_C)
    for k in (1, 2):
        bx(shell, (a + (b - a) * k / 3 - 0.02, 0.1, 2.3), (a + (b - a) * k / 3 + 0.02, 0.14, 2.9), TIMBER)
    bx(shell, (a, W - 0.06, 2.3), (b, W - 0.02, 2.9), DARK)
for x in slits:
    bx(shell, (x - 0.04, -0.03, 3.6), (x + 0.29, 0.04, 3.68), DRESSED_C)
    bx(shell, (x, W - 0.06, 3.1), (x + 0.25, W - 0.02, 3.6), DARK)
# the doors
leaf(shell, (g0 + 0.06, W + 0.1, 0), (0, 1, 0), (g1 - g0) / 2 - 0.05, GH - 0.08, BZ + 0.04, studs=False)   # the gate's leaves, folded back
leaf(shell, (g1 - 0.06, W + 0.1 + (g1 - g0) / 2 - 0.05, 0), (0, -1, 0), (g1 - g0) / 2 - 0.05, GH - 0.08, BZ + 0.04, studs=False)
bx(floor, (g0, W, 0.04), (g1, D - W, BZ + 0.01), FLAGS[1])                             # the passage's floor
bx(shell, (g0, D - W - 0.05, 0), (g1, D - W, WH), DARK)                                # and its far end, in shadow
leaf(shell, ((sd0 + sd1) / 2, 0.16, 0), (-1, 0, 0), (sd1 - sd0) / 2 - 0.01, SH - 0.08, BZ + 0.04)          # the storehouse's shut leaf
leaf(shell, (sd1 - 0.03, 0.14, 0), (0, -1, 0), (sd1 - sd0) / 2 - 0.01, SH - 0.08, BZ + 0.04)               # and its open one
bx(shell, (sd0, W + 0.6, 0), (sd1, W + 0.7, SH), DARK)
leaf(shell, (od[1], 0.16, 0), (-1, 0, 0), od[1] - od[0], OH - 0.08, BZ + 0.04, nb=3)                      # the office door, shut
shell.disc(Vector((od[0] + 0.2, 0.11, BZ + 1.15)), 0.06, 0.014, (0, 1, 0), IRON, 12)                       # its ring pull

# --- the range's roof: a tiled gable along X ------------------------------------------------
tp = math.tan(math.radians(P["pitch"]))
ridge_y = D / 2
ez = WH + 0.05
rz = ez + (ridge_y + P["eaves"]) * tp
ov = P["eaves"]
slope_tiles(shell, X0 - ov, X1 + ov, (-ov, ez - 0.05), (ridge_y, rz - 0.05))
slope_tiles(shell, X0 - ov, X1 + ov, (D + ov, ez - 0.05), (ridge_y, rz - 0.05))
nr = round((X1 - X0 + 2 * ov) / 0.5)
for k in range(nr):                                                     # the ridge, tile by tile
    a, b = X0 - ov + (X1 - X0 + 2 * ov) * k / nr, X0 - ov + (X1 - X0 + 2 * ov) * (k + 1) / nr
    bx(shell, (a + 0.004, ridge_y - 0.14, rz + 0.02), (b - 0.004, ridge_y + 0.14, rz + 0.13), rnd.choice(RIDGES))
    bx(shell, (a + 0.004, ridge_y - 0.07, rz + 0.13), (b - 0.004, ridge_y + 0.07, rz + 0.17), RIDGES[0])
for x in (X0, X1 - W):                                                  # gable ends
    k = shell.slot(STONE)
    vs = [shell.bm.verts.new(v) for v in ((x, 0, WH), (x, D, WH), (x, ridge_y, rz - 0.1),
                                          (x + W, 0, WH), (x + W, D, WH), (x + W, ridge_y, rz - 0.1))]
    for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
        shell.face([vs[i] for i in f], k)
for xa, xb in ((X0 - ov + 0.05, X0), (X1, X1 + ov - 0.05)):             # purlin ends at each gable: ridge and two wall plates
    bx(shell, (xa, ridge_y - 0.09, rz - 0.3), (xb, ridge_y + 0.09, rz - 0.12), TIMBER)
    for y in (0.12, D - 0.3):
        bx(shell, (xa, y, WH - 0.14), (xb, y + 0.18, WH + 0.02), TIMBER)
k = 0
while X0 + 0.2 + k * 0.6 < X1 - 0.2:                                    # rafter ends under the eaves
    x = X0 + 0.2 + k * 0.6
    bx(shell, (x, -ov + 0.03, ez - 0.19), (x + 0.11, 0.0, ez - 0.05), TIMBER)
    bx(shell, (x, D, ez - 0.19), (x + 0.11, D + ov - 0.03, ez - 0.05), TIMBER)
    k += 1

# --- the portico: plain columns of drums, a stone architrave, a timber lean-to ----------------
PY = -P["portico"] + 0.4               # the column line
cz = P["base"]
ch = P["col_h"]
cd = P["col_d"]
xs = [X0 + 0.6 + k * (X1 - X0 - 1.2) / (P["columns"] - 1) for k in range(P["columns"])]
for x in xs:
    c = Vector((x, PY, cz))
    z1 = ch - 0.36
    nd = 4
    for k in range(nd):                                                 # no base: the first drum stands on the kerb
        t0, t1 = k / nd, (k + 1) / nd
        shell.lathe([(cd / 2 - cd * 0.1 * t0, z1 * t0 + 0.006), (cd / 2 - cd * 0.1 * t1, z1 * t1 - 0.006)], c, rnd.choice(BLOCKS), 22)
    shell.cyl(c, cd * 0.39, cd * 0.39, z1, MORTAR, 16)
    shell.lathe([(cd * 0.4, z1), (cd * 0.425, z1 + 0.02), (cd * 0.4, z1 + 0.04), (cd * 0.425, z1 + 0.06), (cd * 0.41, z1 + 0.08),
                 (cd * 0.5, z1 + 0.14), (cd * 0.6, z1 + 0.19), (cd * 0.62, z1 + 0.21)], c, DRESSED_C, 22)       # annulets, echinus
    bx(shell, (x - 0.33, PY - 0.33, cz + ch - 0.15), (x + 0.33, PY + 0.33, cz + ch - 0.08), DRESSED)             # abacus
az = cz + ch - 0.08
ends = [X0 + 0.2] + [(a + b) / 2 for a, b in zip(xs, xs[1:])] + [X1 - 0.2]
bx(shell, (X0 + 0.21, PY - 0.28, az + 0.01), (X1 - 0.21, PY + 0.28, az + 0.44), MORTAR)
for a, b in zip(ends, ends[1:]):                                        # the architrave, one block over each column
    bx(shell, (a + GAP / 2, PY - 0.3, az), (b - GAP / 2, PY + 0.3, az + 0.45), rnd.choice(BLOCKS))
lz0, lz1 = az + 0.55, az + 0.55 + (-PY) * 0.22      # the lean-to rises towards the wall, under the eaves
ly0, ly1 = PY - 0.55, 0.05
rise = (lz1 - lz0 + 0.1) / (ly1 - ly0)
zr = lambda y: lz0 - 0.1 + (y - ly0) * rise          # the roof's top surface
bx(shell, (X0 + 0.2, -0.16, zr(-0.1) - 0.42), (X1 - 0.2, 0.0, zr(-0.1) - 0.24), TIMBER)          # a ledger along the wall
k = 0
while X0 + 0.5 + k * 1.6 < X1 - 0.3:                                    # on stone corbels
    x = X0 + 0.5 + k * 1.6
    bx(shell, (x, -0.2, zr(-0.1) - 0.58), (x + 0.2, 0.0, zr(-0.1) - 0.42), DRESSED_C)
    k += 1
raft = []
for a, b in zip(xs, xs[1:]):
    raft += [a + (b - a) * j / 3 for j in range(3)]
for x in raft + [xs[-1]]:                                               # rafters from the architrave up to the ledger
    p0, p1 = Vector((x, ly0 + 0.05, zr(ly0 + 0.05) - 0.16)), Vector((x, -0.02, zr(-0.02) - 0.16))
    shell.strut(p0, p1, 0.11, 0.15, TIMBER)
slope_tiles(shell, X0 - 0.2, X1 + 0.2, (ly0, lz0 - 0.1 - 0.08), (ly1, lz1 - 0.08))
bx(shell, (X0 - 0.2, 0.0, lz1 - 0.02), (X1 + 0.2, 0.09, lz1 + 0.12), STONE)                      # the plaster fillet over the roof's head

# --- the board of orders and the peg ---------------------------------------------------------
b0, b1 = P["board"]
bz0, bz1 = 1.0, 1.75
for xb_ in (b0 + 0.4, (b0 + b1) / 2, b1 - 0.4):                      # battens on the wall, an iron hook over each
    bx(furn, (xb_ - 0.05, -0.05, bz0 - 0.05), (xb_ + 0.05, -0.0, bz1 + 0.08), TIMBER)
    bx(furn, (xb_ - 0.02, -0.07, bz1 + 0.08), (xb_ + 0.02, -0.0, bz1 + 0.14), IRON)
bx(furn, (b0 + 0.005, -0.1, bz0 + 0.005), (b1 - 0.005, -0.05, bz1 - 0.005), DARK)
for k in range(3):                                                   # the back, in three planks
    za, zb = bz0 + (bz1 - bz0) * k / 3, bz0 + (bz1 - bz0) * (k + 1) / 3
    bx(furn, (b0, -0.16, za + 0.004), (b1, -0.06, zb - 0.004), BOARD if k != 1 else PLANK)
n = P["slots"]
sw = (b1 - b0 - 0.1) / n
for k in range(n + 1):                                               # dividers between the slots
    x = b0 + 0.05 + k * sw
    bx(furn, (x - 0.02, -0.42, bz0 + 0.1), (x + 0.02, -0.16, bz1 - 0.12), PLANK)
bx(furn, (b0, -0.44, bz0 + 0.05), (b1, -0.16, bz0 + 0.1), BOARD)     # the shelf the slots stand on
for xb_ in (b0 + 0.15, (b0 + b1) / 2, b1 - 0.15):                    # its brackets
    bx(furn, (xb_ - 0.03, -0.38, bz0 - 0.02), (xb_ + 0.03, -0.16, bz0 + 0.05), TIMBER)
    furn.strut((xb_, -0.36, bz0 + 0.03), (xb_, -0.16, bz0 - 0.2), 0.05, 0.05, TIMBER)
bx(furn, (b0, -0.44, bz1 - 0.12), (b1, -0.16, bz1 - 0.05), BOARD)    # the top rail
for k in range(n):
    x = b0 + 0.05 + (k + 0.5) * sw
    bx(furn, (x - 0.07, -0.455, bz1 - 0.115), (x + 0.07, -0.44, bz1 - 0.055), TAG)   # a blank tag over each slot: the numeral's place
    if k < 5:                                                        # tablets in the first slots
        bx(furn, (x - 0.09, -0.36, bz0 + 0.1), (x + 0.09, -0.3, bz0 + 0.34), CLAY)
        bx(furn, (x - 0.085, -0.29, bz0 + 0.1), (x + 0.085, -0.24, bz0 + 0.31), CLAY)
peg_x = b1 + 0.35
bx(furn, (peg_x - 0.05, -0.12, bz0 + 0.2), (peg_x + 0.05, -0.02, bz1), BOARD)   # the peg's post
furn.disc(Vector((peg_x, -0.2, bz1 - 0.14)), 0.03, 0.2, (0, 1, 0), TIMBER, 8)   # the peg
furn.disc(Vector((peg_x, -0.31, bz1 - 0.14)), 0.045, 0.03, (0, 1, 0), TIMBER, 8)

# --- grain sacks by the storehouse door -----------------------------------------------------
rng = random.Random(3)
def sack(c):
    furn.sphere(c, 0.3, SACKING, 0.95, 12, 8)
    furn.cyl(Vector(c) + Vector((0.24, 0, 0.14)), 0.07, 0.1, 0.1, SACKING, 8)        # its tied neck
for k in range(9):
    sack((sd1 + 0.35 + (k % 3) * 0.55 + rng.uniform(-0.06, 0.06), -0.5 - (k // 3) * 0.5 + rng.uniform(-0.05, 0.05), P["base"] + 0.28))
for k in range(3):
    sack((sd1 + 0.62 + k * 0.55, -1.0, P["base"] + 0.76))

objs = [shell.finish(), floor.finish(), furn.finish()]

# Turn everything to the site: local +X onto the quay edge.
R = Matrix.Rotation(YAW, 4, "Z")
for o in objs:
    o.data.transform(R)
rot = lambda x, y: (R @ Vector((x, y, 0)))
ex = lambda v: [round(v.x, 3), round(-v.y, 3)]           # blender -> explorer [x, z], set frame

info = {
    "_note": "Written by art/sets/house.py; set-frame explorer coords [x, z] in metres, the quay "
             "edge's midpoint at [0, 0], at quay level. `board`: its two ends, the slots' top at "
             "`board_top`; `gate`, `store_door`, `office_door`: the openings' middles; `portico`: "
             "the column line's ends.",
    "params": P,
    "board": [ex(rot(b0, -0.2)), ex(rot(b1, -0.2))],
    "board_top": bz1,
    "peg": ex(rot(peg_x, -0.2)),
    "gate": ex(rot((g0 + g1) / 2, 0)),
    "store_door": ex(rot((sd0 + sd1) / 2, 0)),
    "office_door": ex(rot(sum(od) / 2, 0)),
    "portico": [ex(rot(X0 + 0.6, PY)), ex(rot(X1 - 0.6, PY))],
}
json.dump(info, open(f"art/sets/{NAME}.json", "w"), indent=1)

# The ground bake.py clears: the whole base, in explorer coords, rotation in bake.py's sense
# (its first half-axis runs along the quay edge).
at = SITE["at"]
cx, cy = (X0 + X1) / 2, (Y0 + D + 0.4) / 2
c = rot(cx, cy)
u = rot(1, 0)
json.dump({"_note": f"Written by art/sets/house.py for {NAME}: ground to clear, explorer [x, z].",
           "strips": [{"at": [round(at[0] + c.x, 3), round(at[2] - c.y, 3)],
                       "half": [round((X1 - X0) / 2 + 0.3, 3), round((D + 0.4 - Y0) / 2 - 0.1, 3)],
                       "rot": round(math.degrees(math.atan2(-u.y, u.x)), 2),
                       "pad": round(at[1] - 0.05, 3)}]},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("HOUSE", NAME, sum(len(o.data.polygons) for o in objs), "faces")
