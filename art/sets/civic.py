"""Paxos's public buildings on open ground: parametric sets for the island model and the previs.

    blender -b -P art/sets/civic.py -- <set name>        # hall, or stoa

Reads the set's `civic` entry in art/sets/sets.json and writes art/sets/<name>.glb (in explorer
coords, origin at the world's origin) and art/sets/<name>-strips.json, the ground
art/sets/bake.py levels under it. `civic.kind` picks the building:

- `hall`, the hall of two doors, at the fork: a small, symmetrical gabled hall of pale dressed
  limestone under an oxblood tiled roof, with one doorway in each end wall and no other opening.
  The north door, facing up the bay to the bodies that assemble, is framed with pilasters and a
  pediment; the south door, facing down the stem to the scholars' coast, has a plain lintel.
  Inside, a floor of black and white marble squares.
- `stoa`, on the eastern shore of the scholars' coast: a long portico of plain Doric columns
  under a lean-to tiled roof, its back wall to the slope and its colonnade facing the quay; and,
  on the flat ground beside it, the festival ground, rows of long stone tables.

`civic`: `at` explorer [x, z] of the centre, `floor` the floor's height, `yaw` degrees (the
building's length along its local X, turned about the vertical like the other sets), and
`length`, `depth`.
"""
import bpy, bmesh, json, math, sys
from mathutils import Vector, Matrix

NAME = sys.argv[sys.argv.index("--") + 1]
C = json.load(open("art/sets/sets.json"))[NAME]["civic"]
(CX, CZ), FL, YAW = C["at"], C["floor"], math.radians(C.get("yaw", 0.0))
L, W = C["length"], C["depth"]

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


ASHLAR = material("pale-ashlar", (0.8, 0.76, 0.66))
TILE = material("oxblood-tile", (0.42, 0.12, 0.08))
DARK = material("dark", (0.07, 0.06, 0.05), 1.0)
WHITE = material("white-marble", (0.88, 0.87, 0.84), 0.3)
BLACK = material("black-marble", (0.12, 0.12, 0.13), 0.3)
TIMBER = material("timber", (0.3, 0.2, 0.12))
MATS = [ASHLAR, TILE, DARK, WHITE, BLACK, TIMBER]
bm = bmesh.new()
# local frame: X along the building, Y across, Z up, origin at the floor's centre
M = Matrix.Translation((CX, -CZ, FL)) @ Matrix.Rotation(YAW, 4, "Z")


def box(lo, hi, mat):
    c = [(a + b) / 2 for a, b in zip(lo, hi)]
    s = [abs(b - a) for a, b in zip(lo, hi)]
    g = bmesh.ops.create_cube(bm, size=1.0, matrix=M @ Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)))
    k = MATS.index(mat)
    for f in {f for v in g["verts"] for f in v.link_faces}:
        f.material_index = k


def cyl(c, r0, r1, h, mat):
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r0, radius2=r1, depth=h,
                              matrix=M @ Matrix.Translation((c[0], c[1], c[2] + h / 2)))
    k = MATS.index(mat)
    for f in {f for v in g["verts"] for f in v.link_faces}:
        f.material_index = k


def slab(pts, th, mat):
    """A slab through four local points, th thick straight down."""
    k = MATS.index(mat)
    top = [bm.verts.new(M @ Vector(p)) for p in pts]
    bot = [bm.verts.new(M @ Vector((p[0], p[1], p[2] - th))) for p in pts]
    for f in [top, bot[::-1]] + [[top[i], bot[i], bot[(i + 1) % 4], top[(i + 1) % 4]] for i in range(4)]:
        bm.faces.new(f).material_index = k


def gable_end(x, w, z0, rise, th, mat):
    k = MATS.index(mat)
    vs = [bm.verts.new(M @ Vector(p)) for p in ((x, -w, z0), (x, w, z0), (x, 0, z0 + rise),
                                                (x + th, -w, z0), (x + th, w, z0), (x + th, 0, z0 + rise))]
    for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
        bm.faces.new([vs[i] for i in f]).material_index = k


hx, hy = L / 2, W / 2
strips = []
if C["kind"] == "hall":
    T, H, dw, dh = 0.5, 4.2, 1.6, 3.0
    box((-hx - 0.4, -hy - 0.4, -2.0), (hx + 0.4, hy + 0.4, 0.0), ASHLAR)          # a stepped base
    box((-hx - 0.2, -hy - 0.2, 0.0), (hx + 0.2, hy + 0.2, 0.2), ASHLAR)
    for i in range(int(2 * (hx - T) / 0.8)):                                        # the marble squares
        for j in range(int(2 * (hy - T) / 0.8)):
            x, y = -hx + T + i * 0.8, -hy + T + j * 0.8
            box((x, y, 0.2), (x + 0.8, y + 0.8, 0.22), WHITE if (i + j) % 2 else BLACK)
    for s in (-1, 1):                                                               # long walls
        box((-hx, s * hy - (T if s > 0 else 0), 0.2), (hx, s * hy + (0 if s > 0 else T), H), ASHLAR)
    for s in (-1, 1):                                                               # end walls, each with its door
        x0, x1 = (hx - T, hx) if s > 0 else (-hx, -hx + T)
        box((x0, -hy, 0.2), (x1, -dw / 2, H), ASHLAR)
        box((x0, dw / 2, 0.2), (x1, hy, H), ASHLAR)
        box((x0, -dw / 2, dh), (x1, dw / 2, H), ASHLAR)
    # the north door (local -X faces north when yaw is 0): pilasters, entablature and a pediment
    xn = -hx - 0.12
    for y in (-dw / 2 - 0.35, dw / 2 + 0.1):
        box((xn, y, 0.2), (xn + 0.14, y + 0.25, dh + 0.3), WHITE)
        for k in range(4):                                                          # fluting
            box((xn - 0.02, y + 0.03 + k * 0.055, 0.3), (xn, y + 0.06 + k * 0.055, dh + 0.2), ASHLAR)
    box((xn - 0.02, -dw / 2 - 0.45, dh + 0.3), (xn + 0.14, dw / 2 + 0.45, dh + 0.6), WHITE)
    gable_end(xn - 0.02, dw / 2 + 0.45, dh + 0.6, 0.55, 0.16, WHITE)
    # the south door: a plain rough lintel
    box((hx - 0.02, -dw / 2 - 0.2, dh), (hx + 0.1, dw / 2 + 0.2, dh + 0.3), ASHLAR)
    # the roof: a gable along X
    t = math.tan(math.radians(22))
    rise = (hy + 0.4) * t
    for s in (-1, 1):
        slab([(-hx - 0.4, s * (hy + 0.4), H + 0.1), (hx + 0.4, s * (hy + 0.4), H + 0.1),
              (hx + 0.4, 0, H + 0.1 + rise), (-hx - 0.4, 0, H + 0.1 + rise)][::(1 if s < 0 else -1)], 0.14, TILE)
    box((-hx - 0.4, -0.12, H + rise), (hx + 0.4, 0.12, H + rise + 0.2), TILE)
    for x in (-hx, hx - T):
        gable_end(x, hy, H, rise, T, ASHLAR)
    strips.append({"at": [CX, CZ], "half": [hx + 1.0, hy + 1.0], "rot": math.degrees(-YAW), "pad": FL - 0.25})
else:                                                                               # the stoa
    T, H, n = 0.6, 4.6, C.get("columns", 13)
    box((-hx - 0.3, -hy - 0.3, -2.5), (hx + 0.3, hy + 0.3, 0.0), ASHLAR)          # the terrace it stands on
    box((-hx, -hy, 0.0), (hx, hy, 0.25), ASHLAR)                                    # a step up
    box((-hx, hy - T, 0.25), (hx, hy, H), ASHLAR)                                   # back wall, to the slope (+Y)
    for x in (-hx, hx - T):
        box((x, -hy + 0.8, 0.25), (x + T, hy, H), ASHLAR)                           # end walls
    for k in range(n):                                                              # the colonnade (-Y)
        x = -hx + 0.5 + k * (L - 1.0) / (n - 1)
        cyl((x, -hy + 0.4, 0.25), 0.26, 0.21, H - 0.75, ASHLAR)
        box((x - 0.33, -hy + 0.07, H - 0.5), (x + 0.33, -hy + 0.73, H - 0.35), ASHLAR)
    box((-hx, -hy, H - 0.35), (hx, -hy + 0.8, H), ASHLAR)                           # architrave
    slab([(-hx - 0.3, -hy - 0.5, H + 0.05), (hx + 0.3, -hy - 0.5, H + 0.05),
          (hx + 0.3, hy + 0.2, H + 0.05 + (W + 0.7) * 0.28), (-hx - 0.3, hy + 0.2, H + 0.05 + (W + 0.7) * 0.28)], 0.14, TILE)
    strips.append({"at": [CX, CZ], "half": [hx + 0.8, hy + 0.8], "rot": math.degrees(-YAW), "pad": FL - 0.25})
    fg = C.get("festival")
    if fg:                                                                          # rows of long stone tables
        (fx, fz), fl, fyaw = fg["at"], fg["floor"], math.radians(fg.get("yaw", 0.0))
        M = Matrix.Translation((fx, -fz, fl)) @ Matrix.Rotation(fyaw, 4, "Z")
        for r in range(fg.get("rows", 3)):
            for c in range(fg.get("per_row", 2)):
                x, y = (c - (fg.get("per_row", 2) - 1) / 2) * 5.0, -3.0 + r * 3.0
                box((x - 1.8, y - 0.4, 0.72), (x + 1.8, y + 0.4, 0.8), ASHLAR)
                for sx in (-1.4, 1.4):
                    box((x + sx - 0.15, y - 0.3, 0.0), (x + sx + 0.15, y + 0.3, 0.72), ASHLAR)
                for sy in (-0.8, 0.8):                                              # benches either side
                    box((x - 1.8, y + sy - 0.15, 0.0), (x + 1.8, y + sy + 0.15, 0.45), ASHLAR)
        strips.append({"at": fg["at"], "half": [2.5 * fg.get("per_row", 2) + 2.5, 5.5], "rot": math.degrees(-fyaw), "pad": fl - 0.05})

me = bpy.data.meshes.new("shell")
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
for m in MATS:
    me.materials.append(m)
o = bpy.data.objects.new("shell", me)
bpy.context.scene.collection.objects.link(o)
json.dump({"_note": f"Written by art/sets/civic.py for {NAME}: ground to level, explorer [x, z].", "strips": strips},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("CIVIC", NAME, len(me.polygons), "faces")
