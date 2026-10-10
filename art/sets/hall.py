"""The hall of two doors, at the fork of Paxos, in enough detail that a previs render already
shows every part of the building: nothing of it is left for an image model to make up.

    blender -b -P art/sets/hall.py -- hall

Reads the site from art/sets/sets.json (`hall`: `at` explorer [x, z] of the floor's centre,
`floor` its height, `yaw` degrees, `length`, `depth`) and writes art/sets/hall.glb (in explorer
coords, origin at the world's origin; objects `shell` and `floor`), art/sets/hall.json (what the
previs and the books need to know: the two doors and the ground before each) and
art/sets/hall-strips.json, the ground art/sets/bake.py levels under it.

A small, symmetrical gabled hall of pale dressed limestone under an oxblood tiled roof, alone on
common ground, with one open doorway in each end wall and no other opening: no window, and no
leaf in either doorway. The north door, facing up the bay to the bodies that assemble, is framed
in white marble with pilasters, an entablature and a pediment; the south door, facing down the
stem to the scholars' coast, has a plain lintel. The hall is empty: it sorts, it does not rule.

The hall's frame is local: X runs along it, the north door is at -X when `yaw` is 0, and Z = 0
is the top of its base. What is modelled, so that it need not be described to an image model
(the helpers are masonry.py's):
- the base in courses of dressed blocks and the step round the walls' foot;
- the four walls in coursed ashlar inside and out, a tall course at the foot, the two gables
  coursed up to the roof;
- each doorway's reveals and threshold; the north door's two pilasters with base and capital,
  its entablature in three bands and its pediment with raking cornices; the south door's one
  rough lintel;
- the floor of black and white marble squares;
- the roof tile by tile: pans in courses, a cover tile over each joint, an antefix at each eave
  end, ridge tiles; rafter ends under the eaves, purlin ends at each gable, and inside, the tie
  beams and the boarding.
"""
import bpy, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, bx, ashlar, roof_plane, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
C = json.load(open("art/sets/sets.json"))[NAME]["hall"]
(CX, CZ), FL, YAW = C["at"], C["floor"], math.radians(C.get("yaw", 0.0))
P = dict(length=C["length"], depth=C["depth"], wall=0.5, step=0.2, height=4.2, door=(1.6, 3.0), pitch=22.0, eaves=0.4)
rnd = random.Random(21)
L, W, T, ST, H = P["length"], P["depth"], P["wall"], P["step"], P["height"]
DW, DH = P["door"]
hx, hy = L / 2, W / 2

bpy.ops.wm.read_factory_settings(use_empty=True)

BLOCKS = [material("pale-limestone", (0.72, 0.68, 0.59), 0.8), material("pale-limestone_b", (0.67, 0.63, 0.55), 0.8),
          material("pale-limestone_c", (0.76, 0.72, 0.63), 0.8)]
JOINT = material("joint", (0.33, 0.3, 0.26), 1.0)
ROUGH = material("rough-lintel", (0.58, 0.54, 0.46), 0.95)
WHITE = material("white-marble", (0.88, 0.87, 0.84), 0.3)
BLACK = material("black-marble", (0.12, 0.12, 0.13), 0.3)
TILES = [material("oxblood-tile", (0.42, 0.11, 0.07), 0.8), material("oxblood-tile_b", (0.46, 0.14, 0.09), 0.8),
         material("oxblood-tile_c", (0.38, 0.1, 0.07), 0.8)]
RIDGES = [material("oxblood-ridge", (0.34, 0.09, 0.06), 0.8), material("oxblood-ridge_b", (0.38, 0.11, 0.07), 0.8)]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
BOARDS = material("roof-boards", (0.42, 0.3, 0.18), 0.85)
GRAVEL = material("gravel", (0.58, 0.53, 0.44), 1.0)

shell, floor = Part("shell"), Part("floor")
low = max(-2.0, 0.05 - FL)                 # never below sea level: the island stands on its lowest point
tp = math.tan(math.radians(P["pitch"]))
cp, sp = math.cos(math.radians(P["pitch"])), math.sin(math.radians(P["pitch"]))


def outline(part, prof, a, b, mat):
    """A wall with the outline `prof` (points across Y and up), from a to b along X."""
    lo, hi = [part.bm.verts.new((a, y, z)) for y, z in prof], [part.bm.verts.new((b, y, z)) for y, z in prof]
    k, n = part.slot(mat), len(prof)
    for i in range(n):
        part.face((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]), k)
    part.face(lo[::-1], k)
    part.face(hi, k)


def courses(z0, z1, tall=0.8, each=0.42):
    n = max(1, round((z1 - z0 - tall) / each))
    return [z0, z0 + tall] + [z0 + tall + (z1 - z0 - tall) * (k + 1) / n for k in range(n)]


# --- the base and the step ---------------------------------------------------------------------
bx(floor, (-hx - 1.0, -hy - 1.0, max(low, -0.6)), (hx + 1.0, hy + 1.0, -0.22), GRAVEL)        # an apron of gravel round it
bx(floor, (-hx - 0.3, -hy - 0.3, low), (hx + 0.3, hy + 0.3, 0.0), JOINT)
bz = [low + (0.0 - low) * k / 5 for k in range(6)]
for p0, u, n_ in (((-hx - 0.4, -hy - 0.4, 0), (1, 0, 0), L + 0.8), ((hx + 0.4, -hy - 0.4, 0), (0, 1, 0), W + 0.8),
                  ((hx + 0.4, hy + 0.4, 0), (-1, 0, 0), L + 0.8), ((-hx - 0.4, hy + 0.4, 0), (0, -1, 0), W + 0.8)):
    ashlar(floor, Vector(p0) - Vector((u[1], -u[0], 0)) * 0.1, u, n_, bz, 1.1, BLOCKS, JOINT, rnd, depth=0.1)
    p0, u = Vector(p0), Vector(u)
    inw = Vector((-u.y, u.x, 0))
    for a, b in masonry.lengths(0.0, n_, 0.8, 1.3, rnd):                   # the base's top course, and the step on it
        floor.box(p0 + u * ((a + b) / 2) + inw * 0.2 + Vector((0, 0, -0.03)), (b - a - GAP, 0.4, 0.06), rnd.choice(BLOCKS), yaw=math.atan2(u.y, u.x))
    for a, b in masonry.lengths(0.2, n_ - 0.2, 0.8, 1.3, rnd):
        floor.box(p0 + u * ((a + b) / 2) + inw * 0.3 + Vector((0, 0, ST / 2)), (b - a - GAP, 0.2, ST), rnd.choice(BLOCKS), yaw=math.atan2(u.y, u.x))
bx(floor, (-hx, -hy, 0.0), (hx, hy, ST - 0.005), JOINT)
n_i, n_j = int(2 * (hx - T) / 0.8), int(2 * (hy - T) / 0.8)                # the marble squares
sq_x, sq_y = 2 * (hx - T) / n_i, 2 * (hy - T) / n_j
for i in range(n_i):
    for j in range(n_j):
        x, y = -hx + T + i * sq_x, -hy + T + j * sq_y
        bx(floor, (x + 0.004, y + 0.004, ST - 0.005), (x + sq_x - 0.004, y + sq_y - 0.004, ST + 0.02), WHITE if (i + j) % 2 else BLACK)

# --- the walls: coursed ashlar inside and out ----------------------------------------------------
D = 0.12
zo, zi = courses(ST, H), courses(ST + 0.02, H)
for s in (-1, 1):                                                           # the two long walls: no opening
    bx(shell, (-hx + D - 0.01, s * hy - s * (D - 0.01), ST), (hx - D + 0.01, s * (hy - T) + s * (D - 0.01), H), JOINT)
    ashlar(shell, (s * hx, s * (hy - D), 0), (-s, 0, 0), L, zo, 1.15, BLOCKS, JOINT, rnd, out=(0, s, 0))
    ashlar(shell, (s * (hx - T), s * (hy - T + D), 0), (-s, 0, 0), L - 2 * T, zi, 1.15, BLOCKS, JOINT, rnd, out=(0, -s, 0))
ez = H + 0.1                                                                # the roof's underside at the wall's outer face
gz = lambda y: ez + (hy - abs(y)) * tp - 0.03                               # the gable's top
zd = [z for z in zo if z < ST + DH - 0.2] + [ST + DH]                       # courses beside a doorway
zg = [ST + DH + 0.34] + [z for z in zo if z > ST + DH + 0.5]                # and over its lintel
zt = [H + 0.42 * k for k in range(int((gz(0) - H) / 0.42) + 2)]             # and up the gable
for s in (-1, 1):                                                           # the two end walls, each with its doorway
    xo, xi = s * hx, s * (hx - T)
    x0, x1 = min(xo, xi), max(xo, xi)
    outline(shell, [(-hy, ST), (-DW / 2, ST), (-DW / 2, ST + DH), (DW / 2, ST + DH), (DW / 2, ST), (hy, ST),
                    (hy, H), (0, gz(0)), (-hy, H)], x0 + D - 0.01, x1 - D + 0.01, JOINT)
    for face, o in ((xo - s * D, s), (xi + s * D, -s)):
        for k in (-1, 1):                                                   # beside the doorway
            ashlar(shell, (face, k * hy, 0), (0, -k, 0), hy - DW / 2, zd, 0.75, BLOCKS, JOINT, rnd, out=(o, 0, 0), bond=0.5)
            y0, y1 = sorted((k * (DW / 2 + 0.35 + GAP), k * hy))                                        # the course the lintel lies in
            f0, f1 = sorted((face, face + o * D))
            bx(shell, (f0, y0, ST + DH + GAP / 2), (f1, y1, ST + DH + 0.34 - GAP / 2), rnd.choice(BLOCKS))
        ashlar(shell, (face, -hy, 0), (0, 1, 0), W, zg, 1.15, BLOCKS, JOINT, rnd, out=(o, 0, 0))      # over it
        for k in (-1, 1):                                                   # the gable, each half stopping under the roof
            ashlar(shell, (face, k * hy, 0), (0, -k, 0), hy, zt, 1.0, BLOCKS, JOINT, rnd, out=(o, 0, 0), rake=(H + 0.05, tp))
    for k in (-1, 1):                                                       # the doorway's reveals, block by block
        for za, zb in zip(zd, zd[1:]):
            bx(shell, (x0 + 0.002, k * DW / 2, za + GAP / 2), (x1 - 0.002, k * (DW / 2 + 0.03), zb - GAP / 2), rnd.choice(BLOCKS))
    bx(shell, (x0 - 0.01, -DW / 2 - 0.35, ST + DH), (x1 + 0.01, DW / 2 + 0.35, ST + DH + 0.34), BLOCKS[2] if s < 0 else ROUGH)   # the lintel
    bx(floor, (x0 - 0.06, -DW / 2, ST - 0.01), (x1 + 0.06, DW / 2, ST + 0.035), BLOCKS[1])                                       # the threshold

# --- the north door: pilasters, entablature, pediment, in white marble ------------------------------
xn = -hx
ph = ST + DH + 0.34
for k in (-1, 1):
    y = k * (DW / 2 + 0.2)
    bx(shell, (xn - 0.16, y - 0.2, ST), (xn, y + 0.2, ST + 0.16), WHITE)                          # base
    bx(shell, (xn - 0.1, y - 0.15, ST + 0.16), (xn, y + 0.15, ph - 0.14), WHITE)                  # shaft
    for j in range(4):                                                                             # its flutes' fillets
        bx(shell, (xn - 0.118, y - 0.135 + j * 0.08, ST + 0.22), (xn - 0.1, y - 0.105 + j * 0.08, ph - 0.2), WHITE)
    bx(shell, (xn - 0.14, y - 0.18, ph - 0.14), (xn, y + 0.18, ph - 0.07), WHITE)                 # capital
    bx(shell, (xn - 0.17, y - 0.21, ph - 0.07), (xn, y + 0.21, ph), WHITE)
ew = DW / 2 + 0.45
for z0, z1, d in ((ph, ph + 0.16, 0.13), (ph + 0.16, ph + 0.3, 0.11), (ph + 0.3, ph + 0.38, 0.22)):   # architrave, frieze, cornice
    bx(shell, (xn - d, -ew - (0.08 if d > 0.2 else 0), z0), (xn, ew + (0.08 if d > 0.2 else 0), z1), WHITE)
pz = ph + 0.38
outline(shell, [(-ew, pz), (ew, pz), (0, pz + 0.5)], xn - 0.1, xn, WHITE)
for k in (-1, 1):
    shell.strut((xn - 0.11, k * (ew + 0.1), pz + 0.03), (xn - 0.11, 0, pz + 0.03 + (ew + 0.1) * 0.5 / ew), 0.22, 0.07, WHITE)

# --- the roof ------------------------------------------------------------------------------------------
ov = P["eaves"]
ax, ay = hx + ov, hy + ov
ee = ez - ov * tp                                                            # at the eaves' edge
roof_plane(shell, (-ax, -ay, ee), (1, 0, 0), (0, cp, sp), 2 * ax, ay / cp, TILES, RIDGES, BOARDS, rnd)
roof_plane(shell, (-ax, ay, ee), (1, 0, 0), (0, -cp, sp), 2 * ax, ay / cp, TILES, RIDGES, BOARDS, rnd)
top = ee + ay * tp
nr = round(2 * ax / 0.5)
for k in range(nr):                                                          # the ridge, tile by tile
    a, b = -ax + 2 * ax * k / nr, -ax + 2 * ax * (k + 1) / nr
    bx(shell, (a + 0.004, -0.15, top + 0.06), (b - 0.004, 0.15, top + 0.17), rnd.choice(RIDGES))
    bx(shell, (a + 0.004, -0.075, top + 0.17), (b - 0.004, 0.075, top + 0.21), RIDGES[0])
for s in (-1, 1):                                                            # purlin ends at each gable
    xa, xb = (hx, ax - 0.05) if s > 0 else (-ax + 0.05, -hx)
    bx(shell, (xa, -0.1, top - 0.24), (xb, 0.1, top - 0.04), TIMBER)
    for y in (-hy + 0.04, hy - 0.24):
        bx(shell, (xa, y, H - 0.1), (xb, y + 0.2, H + 0.08), TIMBER)
k = 0
while -hx + 0.2 + k * 0.6 < hx - 0.2:                                        # rafter ends under the eaves
    x = -hx + 0.2 + k * 0.6
    for s in (-1, 1):
        y0, y1 = sorted((s * hy, s * (ay - 0.04)))
        bx(shell, (x, y0, ee - 0.02), (x + 0.11, y1, ee + 0.12 + (ov - 0.04) * tp * 0.0), TIMBER)
    k += 1
for x in (-hx * 0.5, 0.0, hx * 0.5):                                         # inside: tie beams, a post and two struts on each
    bx(shell, (x - 0.09, -hy + T - 0.05, H - 0.22), (x + 0.09, hy - T + 0.05, H), TIMBER)
    bx(shell, (x - 0.07, -0.07, H), (x + 0.07, 0.07, top - 0.05), TIMBER)
    for s in (-1, 1):
        shell.strut((x, s * (hy - T), H + 0.08), (x, 0, top - 0.12), 0.12, 0.16, TIMBER)

M = Matrix.Translation((CX, -CZ, FL)) @ Matrix.Rotation(YAW, 4, "Z")
for part in (shell, floor):
    part.place(M)
objs = [shell.finish(), floor.finish()]
ex = lambda x, y: (lambda v: [round(v.x, 2), round(-v.y, 2)])(M @ Vector((x, y, 0)))
json.dump({"_note": "Written by art/sets/hall.py; explorer coords [x, z] in metres, heights above the sea. `middle`: the "
                    "middle of the floor, at `floor`; `north_door`, `south_door`: the middle of each doorway; "
                    "`north`, `south`: the ground out before each; `ridge`: the roof's top.",
           "params": P, "middle": ex(0, 0), "floor": round(FL + ST, 2), "north_door": ex(-hx, 0), "south_door": ex(hx, 0),
           "north": ex(-hx - 6, 0), "south": ex(hx + 6, 0), "ridge": round(FL + top + 0.2, 2)},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
json.dump({"_note": f"Written by art/sets/hall.py for {NAME}: ground to level, explorer [x, z].",
           "strips": [{"at": [CX, CZ], "half": [hx + 1.0, hy + 1.0], "rot": math.degrees(-YAW), "pad": FL - 0.25}]},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("HALL", NAME, sum(len(o.data.polygons) for o in objs), "faces")
