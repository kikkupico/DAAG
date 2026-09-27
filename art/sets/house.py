"""A trading house of Arche on its quay: a parametric set for the island model and the previs.

    blender -b -P art/sets/house.py -- <set name>        # e.g. house3

Reads its site from art/sets/sets.json (`at`, and `house`: the quay edge's direction and the
building's extent) and writes art/sets/<name>.glb, art/sets/<name>.json (what the previs and
the book need to know: the board, the gate, the doors) and art/sets/<name>-strips.json (the
ground art/sets/bake.py clears of Meshy's buildings before joining this in).

The three houses are alike, so one builder serves all three. A house is one long range, its
walls lime-plastered over rubble on a bare rubble base,
on the strip of land between the ring road and the quay, with its back to the road:
- the clerks' office at one end, where the tallies and columns are kept, with a door and
  small high windows onto the quay;
- the gate, a passage through the range from the road to the quay, where slips come in;
- the storehouse at the other end, with loading doors onto the quay and slit windows high up;
- a Doric portico the length of the range, on the quay, with a lean-to tiled roof;
- under the portico, beside the gate, the board of orders: a long timber board at chest height
  with a row of numbered slots, and the peg beside it;
- grain sacks stacked by the storehouse door.

The set's frame is local: X runs along the quay edge, the quay is towards -Y, the land and the
road towards +Y, and the edge itself is Y = 0, at quay level. The GLB is written already
turned to the site's yaw, so render.py and explorer.html place it with no rotation, and its
objects are `shell`, `floor` and `furniture`, as for the other sets.
"""
import bpy, bmesh, json, math, sys
from mathutils import Vector, Matrix

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

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.8, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


STONE = material("plaster", (0.86, 0.82, 0.72), 0.9)          # lime plaster over rubble
SOCLE = material("rubble-base", (0.5, 0.46, 0.4), 0.95)
DRESSED = material("dressed-stone", (0.6, 0.56, 0.49), 0.8)
TILE = material("terracotta", (0.5, 0.2, 0.12), 0.8)
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
BOARD = material("board", (0.42, 0.28, 0.15), 0.7)
PAVING = material("paving", (0.47, 0.45, 0.41), 0.9)
DARK = material("dark", (0.08, 0.07, 0.06), 1.0)
SACKING = material("sacking", (0.66, 0.56, 0.4), 1.0)
CLAY = material("clay", (0.62, 0.36, 0.22), 0.8)


class Part:
    """Collects solids (as bmesh geometry) into one object, one material slot each."""
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def box(self, lo, hi, mat):
        """An axis-aligned box from corner lo to corner hi."""
        c = [(a + b) / 2 for a, b in zip(lo, hi)]
        s = [abs(b - a) for a, b in zip(lo, hi)]
        g = bmesh.ops.create_cube(self.bm, size=1.0,
                                  matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((*s, 1)))
        k = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = k

    def cyl(self, c, r0, r1, h, mat, segs=16):
        g = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r0, radius2=r1,
                                  depth=h, matrix=Matrix.Translation(Vector(c) + Vector((0, 0, h / 2))))
        k = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = k

    def quad_solid(self, pts, th, mat):
        """A slab through four points (a roof plane), thickness th straight down."""
        k = self.slot(mat)
        top = [self.bm.verts.new(p) for p in pts]
        bot = [self.bm.verts.new((p[0], p[1], p[2] - th)) for p in pts]
        faces = [top, bot[::-1]] + [[top[i], bot[i], bot[(i + 1) % 4], top[(i + 1) % 4]] for i in range(4)]
        for f in faces:
            self.bm.faces.new(f).material_index = k

    def sphere(self, c, r, mat, squash=(1, 1, 1)):
        g = bmesh.ops.create_uvsphere(self.bm, u_segments=10, v_segments=7, radius=r,
                                      matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((*squash, 1)))
        k = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = k

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me)
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        return o


shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- ground: a paved base under the whole house, and the portico's raised floor ------------
Y0 = -P["portico"] - 0.3
floor.box((X0 - 0.4, Y0, max(-1.5, 0.05 - SITE["at"][1])), (X1 + 0.4, D + 0.4, 0.04), PAVING)   # never below sea level
floor.box((X0, -P["portico"], 0.04), (X1, 0.0, P["base"]), DRESSED)

# --- the range: walls with openings ---------------------------------------------------------
def wall_x(y0, y1, spans, z1=WH, sill=0.0):
    """A wall running along X between y0 and y1, solid except for `spans`:
    (xa, xb, za, zb) openings."""
    xs = sorted({X0, X1} | {v for s in spans for v in s[:2]})
    for a, b in zip(xs, xs[1:]):
        op = [s for s in spans if s[0] <= a and b <= s[1]]
        if not op:
            shell.box((a, y0, sill), (b, y1, z1), STONE)
        else:
            _, _, za, zb = op[0]
            if za > sill:
                shell.box((a, y0, sill), (b, y1, za), STONE)
            shell.box((a, y0, zb), (b, y1, z1), STONE)

g0, g1 = P["gate"]
sd0, sd1 = P["store_door"]
od = (-7.8, -6.6)
windows = [(-10.0, -9.5), (-5.4, -5.0)]     # small and high: Greek buildings showed little to the street
front = [(g0, g1, 0.0, 3.3), (sd0, sd1, 0.0, 2.7), (od[0], od[1], 0.0, 2.3)] + \
        [(a, b, 2.3, 2.9) for a, b in windows] + \
        [(x, x + 0.25, 3.1, 3.6) for x in (1.0, 3.2, 5.9)]     # slit windows high on the storehouse
wall_x(0.0, W, front)
wall_x(D - W, D, [(g0, g1, 0.0, 3.3)])
for x in (X0, X1 - W):
    shell.box((x, W, 0), (x + W, D - W, WH), STONE)
for x in (g0 - W, g1):                                              # the gate passage's side walls
    shell.box((x, W, 0), (x + W, D - W, WH), STONE)
# the bare rubble base under the plaster, all round
shell.box((X0 - 0.05, -0.08, 0), (X1 + 0.05, 0.0, 0.6), SOCLE)
shell.box((X0 - 0.05, D, 0), (X1 + 0.05, D + 0.08, 0.6), SOCLE)
for x in (X0 - 0.08, X1):
    shell.box((x, 0, 0), (x + 0.08, D, 0.6), SOCLE)
# door frames, lintels, and dark voids so openings read as openings
for a, b, zt in ((g0, g1, 3.3), (sd0, sd1, 2.7), (od[0], od[1], 2.3)):
    shell.box((a - 0.18, -0.12, 0), (a, 0.0, zt + 0.15), DRESSED)
    shell.box((b, -0.12, 0), (b + 0.18, 0.0, zt + 0.15), DRESSED)
    shell.box((a - 0.3, -0.14, zt), (b + 0.3, 0.02, zt + 0.35), DRESSED)
for a, b in windows:
    shell.box((a - 0.1, -0.12, 2.9), (b + 0.1, 0.0, 3.02), TIMBER)                # a timber lintel
# the storehouse's double doors, one leaf open
shell.box((sd0, 0.1, 0.02), ((sd0 + sd1) / 2, 0.18, 2.66), TIMBER)
shell.box((sd1 - 0.06, -0.8, 0.02), (sd1, 0.1, 2.66), TIMBER)
# the office door, closed
shell.box((od[0], 0.12, 0.02), (od[1], 0.2, 2.28), TIMBER)
# inner partitions and interior darkness behind the openings
shell.box((P["office"], W, 0), (P["office"] + 0.3, D - W, WH), STONE)
for a, b, zt in ((sd0, sd1, 2.7),):
    shell.box((a, W + 0.6, 0), (b, W + 0.7, zt), DARK)

# --- the range's roof: a tiled gable along X ------------------------------------------------
tp = math.tan(math.radians(P["pitch"]))
ridge_y = D / 2
ez = WH + 0.05
rz = ez + (ridge_y + P["eaves"]) * tp
ov = P["eaves"]
for y_eave in (-ov, D + ov):
    shell.quad_solid([(X0 - ov, y_eave, ez), (X1 + ov, y_eave, ez), (X1 + ov, ridge_y, rz), (X0 - ov, ridge_y, rz)]
                     if y_eave < 0 else
                     [(X0 - ov, ridge_y, rz), (X1 + ov, ridge_y, rz), (X1 + ov, y_eave, ez), (X0 - ov, y_eave, ez)], 0.14, TILE)
n_rows = int((X1 - X0 + 2 * ov) / 0.42)
for k in range(n_rows + 1):                                            # cover-tile ridges down each slope
    x = X0 - ov + k * (X1 - X0 + 2 * ov) / n_rows
    for y_eave in (-ov, D + ov):
        L = math.hypot(ridge_y - y_eave, rz - ez)
        mid = Vector((x, (ridge_y + y_eave) / 2, (rz + ez) / 2 + 0.05))
        ang = math.atan2(rz - ez, ridge_y - y_eave)      # signed: the back slope falls the other way
        g = bmesh.ops.create_cube(shell.bm, size=1.0, matrix=Matrix.Translation(mid) @ Matrix.Rotation(ang, 4, "X")
                                  @ Matrix.Diagonal((0.11, L, 0.07, 1)))
        kk = shell.slot(TILE)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = kk
shell.box((X0 - ov, ridge_y - 0.14, rz - 0.05), (X1 + ov, ridge_y + 0.14, rz + 0.16), TILE)     # ridge tiles
for x in (X0, X1 - W):                                                  # gable ends
    k = shell.slot(STONE)
    vs = [shell.bm.verts.new(v) for v in ((x, 0, WH), (x, D, WH), (x, ridge_y, rz - 0.1),
                                          (x + W, 0, WH), (x + W, D, WH), (x + W, ridge_y, rz - 0.1))]
    for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
        shell.bm.faces.new([vs[i] for i in f]).material_index = k
for k in range(int((X1 - X0) / 0.9) + 1):                                # rafter ends under the eaves
    x = X0 + 0.2 + k * 0.9
    if x > X1 - 0.2:
        break
    shell.box((x, -ov, ez - 0.16), (x + 0.12, 0.0, ez - 0.02), TIMBER)
    shell.box((x, D, ez - 0.16), (x + 0.12, D + ov, ez - 0.02), TIMBER)

# --- the portico ------------------------------------------------------------------------------
PY = -P["portico"] + 0.4               # the column line
cz = P["base"]
ch = P["col_h"]
xs = [X0 + 0.6 + k * (X1 - X0 - 1.2) / (P["columns"] - 1) for k in range(P["columns"])]
for x in xs:
    c = Vector((x, PY, cz))
    shell.box((x - 0.34, PY - 0.34, cz), (x + 0.34, PY + 0.34, cz + 0.12), DRESSED)       # plinth
    shell.cyl(c + Vector((0, 0, 0.12)), P["col_d"] / 2, P["col_d"] * 0.4, ch - 0.5, DRESSED)
    shell.cyl(c + Vector((0, 0, ch - 0.38)), P["col_d"] * 0.4, P["col_d"] * 0.62, 0.16, DRESSED)
    shell.box((x - 0.33, PY - 0.33, cz + ch - 0.22), (x + 0.33, PY + 0.33, cz + ch - 0.08), DRESSED)
az = cz + ch - 0.08
shell.box((X0 + 0.2, PY - 0.3, az), (X1 - 0.2, PY + 0.3, az + 0.45), DRESSED)             # architrave
for k in range(int((X1 - X0) / 0.8)):                                                     # ceiling beams
    x = X0 + 0.4 + k * 0.8
    shell.box((x, PY, az + 0.35), (x + 0.12, 0.0, az + 0.5), TIMBER)
lz0, lz1 = az + 0.55, az + 0.55 + (-PY) * 0.22      # the lean-to rises towards the wall, under the eaves
shell.quad_solid([(X0 - 0.2, PY - 0.55, lz0 - 0.1), (X1 + 0.2, PY - 0.55, lz0 - 0.1),
                  (X1 + 0.2, 0.05, lz1), (X0 - 0.2, 0.05, lz1)], 0.12, TILE)
for k in range(int((X1 - X0 + 0.4) / 0.42) + 1):
    x = X0 - 0.2 + k * 0.42
    L = math.hypot(-PY + 0.6, lz1 - lz0 + 0.1)
    mid = Vector((x, (PY - 0.55 + 0.05) / 2, (lz0 - 0.1 + lz1) / 2 + 0.05))
    ang = math.atan2(lz1 - lz0 + 0.1, -PY + 0.6)
    g = bmesh.ops.create_cube(shell.bm, size=1.0, matrix=Matrix.Translation(mid) @ Matrix.Rotation(ang, 4, "X")
                              @ Matrix.Diagonal((0.11, L, 0.07, 1)))
    kk = shell.slot(TILE)
    for f in {f for v in g["verts"] for f in v.link_faces}:
        f.material_index = kk

# --- the board of orders and the peg ---------------------------------------------------------
b0, b1 = P["board"]
bz0, bz1 = 1.0, 1.75
furn.box((b0, -0.16, bz0), (b1, -0.02, bz1), BOARD)                  # back plank
n = P["slots"]
sw = (b1 - b0 - 0.1) / n
for k in range(n + 1):                                               # dividers between the slots
    x = b0 + 0.05 + k * sw
    furn.box((x - 0.025, -0.42, bz0 + 0.1), (x + 0.025, -0.16, bz1 - 0.12), BOARD)
furn.box((b0, -0.42, bz0 + 0.05), (b1, -0.16, bz0 + 0.1), BOARD)     # the shelf the slots stand on
furn.box((b0, -0.42, bz1 - 0.12), (b1, -0.16, bz1 - 0.07), BOARD)    # the top rail, where numerals are cut
for k in range(n):                                                   # a few tablets in the first slots
    if k < 5:
        x = b0 + 0.05 + (k + 0.5) * sw
        furn.box((x - 0.09, -0.36, bz0 + 0.1), (x + 0.09, -0.22, bz0 + 0.34), CLAY)
peg_x = b1 + 0.35
furn.box((peg_x - 0.05, -0.12, bz0 + 0.2), (peg_x + 0.05, -0.02, bz1), BOARD)   # the peg's post
furn.cyl((peg_x, -0.2, bz1 - 0.05), 0.05, 0.05, 0.18, TIMBER, 8)             # the peg

# --- grain sacks by the storehouse door -----------------------------------------------------
import random
rng = random.Random(3)
for k in range(9):
    x = sd1 + 0.35 + (k % 3) * 0.55 + rng.uniform(-0.06, 0.06)
    y = -0.5 - (k // 3) * 0.5 + rng.uniform(-0.05, 0.05)
    z = P["base"] + 0.3
    furn.sphere((x, y, z), 0.3, SACKING, (1.0, 0.8, 0.95))
for k in range(3):
    furn.sphere((sd1 + 0.62 + k * 0.55, -1.0, P["base"] + 0.78), 0.3, SACKING, (1.0, 0.8, 0.95))

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
