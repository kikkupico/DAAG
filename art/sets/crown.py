"""The crown of Mount Phyle: a parametric Tiryns-style citadel, seated on the Arche island model.

    blender -b -P art/sets/crown.py -- <set name>        # e.g. crown

Reads its site from art/sets/sets.json (`crown`: `top`, the summit's explorer [x, z], `pad`, the
level of the platform, and the parameters below) and writes art/sets/<name>.glb and <name>.json.
The GLB is in explorer coords (origin at the world's origin). art/sets/bake.py levels the summit
to a disc (its `circle`, `centre` and `pad`, a little under this set's own floor) and joins the set in.

As the setting has it, a ruined Bronze Age citadel like Tiryns, on the summit:
- a cyclopean ring wall, thick enough to hold a casemate gallery, standing on the levelled crown
  and dropping as a high revetment down the slope outside; 4 towers break the ring into quarters;
- three quarters stand whole (the north-east, south-east, south-west): in each a casemate cell
  inside the wall, corbel-roofed, with a doorway onto the court, a slit looking outward and a
  rodent hole; a stair up the inner face to a flat wall-walk with a parapet, where a bandit
  stands guard. Cells and walk-tops are sealed from their neighbours by the towers. The fourth
  quarter (north-west) has fallen, its gallery open to the sky, and rubble lies outside;
- two breaks only: a narrow slot on the north, and a wider gap on the south framed in timber;
- inside, a paved court, and at the centre a roofless megaron: a porch with two columns, a hall
  with a round hearth, four column stumps, the chief's stone chair and the loot against the back
  wall. Stone kerbs run like gutters from the hall to each post's door: the rodents' runs.
Bearings are compass bearings from the top (0 = north = -x, 90 = east = -z).
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
P = dict(pad=47.4, r_in=11.0, r_out=15.0, wall_top=3.3, tower_w=5.0, cell_len=4.6, hall_h=2.6, slot_w=1.3, gap_w=3.2,
         frame_h=2.6, posts=[45.0, 135.0, 225.0], seed=11)
P.update(SITE.get("crown", {}))
I = json.load(open("art/islands.json"))[SITE["island"]]
CX, CZ = P["top"]                  # the summit, explorer [x, z]
rng = random.Random(P["seed"])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=I["source"])
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zb = min(v.z for v in bb)
S, (X0, Z0), t = I["scale"], I["centre"], math.radians(I["yaw"])
island.scale = (S,) * 3
island.rotation_mode = "XYZ"
island.rotation_euler = (0, 0, t)
island.location = (X0 - (S * cx * math.cos(t) - S * cy * math.sin(t)),
                   -Z0 - (S * cx * math.sin(t) + S * cy * math.cos(t)), -S * zb)
bpy.context.view_layer.update()
bvh = BVHTree.FromObject(island, bpy.context.evaluated_depsgraph_get())
Mw = island.matrix_world.copy()   # a copy: the island is deleted below
Mi = Mw.inverted()
down = (Mi.to_3x3() @ Vector((0, 0, -1))).normalized()


def ground(x, z):
    """Terrain height at explorer (x, z)."""
    loc, *_ = bvh.ray_cast(Mi @ Vector((x, -z, 500)), down)
    return (Mw @ loc).z if loc else 0.0



def material(name, rgb, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

bpy.data.objects.remove(island)


def material(name, rgb, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


WALL = material("cyclopean-stone", (0.45, 0.42, 0.37))
ASHLAR = material("dressed-limestone", (0.62, 0.58, 0.5))
PAVE = material("court-paving", (0.5, 0.46, 0.4))
TIMBER = material("weathered-timber", (0.32, 0.24, 0.16), 0.8)
DARK = material("dark-hole", (0.02, 0.02, 0.02), 1.0)
mats = [WALL, ASHLAR, PAVE, TIMBER, DARK]
bm = bmesh.new()


def lump(c, size, mat, jitter=0.12, yaw=None):
    """A squared block with its corners pushed about, at explorer centre c (x, y, z), size
    (along, across, up) on a blender yaw (radians about the vertical)."""
    M = (Matrix.Translation((c[0], -c[2], c[1])) @ Matrix.Rotation(yaw if yaw is not None else 0.0, 4, "Z")
         @ Matrix.Diagonal((*size, 1)))
    vs = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix())["verts"]
    for v in vs:
        v.co = Vector((v.co.x + rng.uniform(-jitter, jitter) * 0.5, v.co.y + rng.uniform(-jitter, jitter) * 0.5,
                       v.co.z + rng.uniform(-jitter, jitter) * 0.3))
        v.co = M @ v.co
    k = mats.index(mat)
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = k


def bearing(deg, r):
    a = math.radians(deg)
    return CX - r * math.cos(a), CZ - r * math.sin(a)


def loc(e, n):
    """Explorer (x, z) of the point e metres east and n metres north of the top."""
    return CX - n, CZ - e


Y0 = P["pad"]
RI, RO = P["r_in"], P["r_out"]
SKIN = 1.1
R_IN_C, R_OUT_C, R_CORE = RI + SKIN / 2, RO - SKIN / 2, (RI + RO) / 2
G0, G1 = RI + SKIN, RO - SKIN            # the gallery's radial span
H = P["wall_top"]
POSTS = P["posts"]
TOWERS = [90.0, 270.0]
GATES = {0.0: P["slot_w"], 180.0: P["gap_w"]}
CELL_HALF = P["cell_len"] / 2
DOOR_W, DOOR_H = 1.0, 1.9


def adiff(a, b):
    return abs((a - b + 180) % 360 - 180)


def arc(m, r):
    return math.degrees(m / r)


def in_gap(a, r, extra=0.0):
    return any(adiff(a, g) < arc(w / 2 + extra, r) for g, w in GATES.items())


def in_tower(a):
    return any(adiff(a, t) < arc(P["tower_w"] / 2, R_OUT_C) for t in TOWERS)


def near_gate(a):
    return any(arc(w / 2, R_OUT_C) <= adiff(a, g) < arc(w / 2 + 3.2, R_OUT_C) for g, w in GATES.items())


def quarter(a):
    return int((a % 360) // 90)


def ruined(a):
    return quarter(a) == 3


def top_height(a, layer):
    """Standing height of the wall above the pad at bearing a; layer 'out' is the outer skin."""
    if in_tower(a):
        return H + 1.2
    if ruined(a):
        base = 0.5 + 1.1 * (0.5 + 0.5 * math.sin(math.radians(a * 5.3 + 20))) + rng.uniform(-0.15, 0.15)
        return base * (1.15 if layer == "out" else 0.8)
    h = H + (0.9 if near_gate(a) else 0.0)
    if layer == "out" and not in_tower(a) and not near_gate(a):
        h += 0.75 if rng.random() > 0.3 else 0.0        # the parapet, notched here and there
    return h


def cell_zone(a, post):
    return adiff(a, post) < arc(CELL_HALF, G0 + (G1 - G0) / 2)


def cell_of(a):
    for p in POSTS:
        if cell_zone(a, p):
            return p
    return None


def stack(a, r, thick, blen, y0, top, mat, skip=None, jit=0.12):
    """One column of blocks from y0 up to top at bearing a, radius r, radial thickness thick."""
    x, z = bearing(a, r)
    y = y0
    while y < top - 0.02:
        h = rng.uniform(0.55, 1.0)
        if top - (y + h) < 0.4:
            h = top - y
        if not (skip and skip(y, y + h)):
            lump((x, y + h / 2, z), (blen * 0.97, thick * rng.uniform(0.95, 1.08), h), mat, jitter=jit,
                 yaw=math.radians(90 - a) + rng.uniform(-0.04, 0.04))
        y += h * 0.93 if h > 0.45 else h


# --- the ring wall -------------------------------------------------------------------------
walk_tops = []          # (a0, a1) stretches where a flat wall-walk is laid
deg = 0.0
while deg < 360.0:
    blen = rng.uniform(1.0, 2.0)
    step = arc(blen, R_OUT_C)
    a = deg + step / 2
    deg += step
    if in_gap(a, R_OUT_C):
        continue
    hg = lambda layer: top_height(a, layer)
    tw = in_tower(a)
    # outer skin: a revetment from the slope up
    x, z = bearing(a, R_OUT_C)
    g = ground(x, z)
    top_o = Y0 + hg("out")
    post = cell_of(a)
    slit = (lambda y0_, y1_: post is not None and adiff(a, post) < arc(0.45, R_OUT_C) and y0_ < Y0 + 1.7 and y1_ > Y0 + 1.15)
    base = min(g, Y0, *(ground(*bearing(a + da, RO + dr)) for da in (-3, 0, 3) for dr in (0.6, 1.8, 3.2))) - 2.0   # buried in the slope below the face
    stack(a, R_OUT_C, SKIN + (1.4 if tw else 0.0), blen, base, top_o, WALL, skip=slit)
    if tw:                                        # a tower: solid out to r 17
        for rr in (RO + 0.7, RO + 1.5):
            gx, gz = bearing(a, rr)
            stack(a, rr, 1.0, blen, min(ground(gx, gz), base) - 0.4, top_o - 0.4, WALL)
    # the core and the inner skin
    top_c = Y0 + min(hg("in"), H + (1.2 if tw else 0.0))
    top_i = Y0 + hg("in")
    if post is None or tw:
        stack(a, R_CORE, G1 - G0, blen, Y0 - 0.4, top_c, WALL)
    door = post is not None and adiff(a, post) < arc(DOOR_W / 2 + 0.25, R_IN_C)
    stack(a, R_IN_C, SKIN, blen, Y0 - 0.4, top_i, WALL,
          skip=(lambda y0_, y1_: y0_ < Y0 + DOOR_H) if door else None)
# cells: end walls, corbelled roof, lintel, slit already cut
for p in POSTS:
    for side in (-1, 1):
        a = p + side * arc(CELL_HALF + 0.35, R_CORE)
        for rr in (G0 + 0.45, R_CORE, G1 - 0.45):
            stack(a, rr, 0.9, 0.9, Y0 - 0.4, Y0 + 2.3, WALL, jit=0.06)
    for k in range(9):
        a = p - arc(CELL_HALF, R_CORE) + k * 2 * arc(CELL_HALF, R_CORE) / 8
        ln = 2 * CELL_HALF / 8 * 1.05
        for (r0, r1, y0_, y1_) in ((G0, G0 + 0.45, Y0 + 2.3, Y0 + 2.65), (G1 - 0.45, G1, Y0 + 2.3, Y0 + 2.65),
                                   (G0, G0 + 0.85, Y0 + 2.65, Y0 + 3.0), (G1 - 0.85, G1, Y0 + 2.65, Y0 + 3.0),
                                   (G0, G1, Y0 + 3.0, Y0 + H)):
            x, z = bearing(a, (r0 + r1) / 2)
            lump((x, (y0_ + y1_) / 2, z), (ln, r1 - r0, y1_ - y0_), ASHLAR if y0_ > Y0 + 2.9 else WALL, jitter=0.06,
                 yaw=math.radians(90 - a))
    a0 = p
    x, z = bearing(a0, R_IN_C)                                # the door's lintel slab
    lump((x, Y0 + DOOR_H + 0.2, z), (DOOR_W + 0.9, SKIN + 0.1, 0.4), ASHLAR, jitter=0.04, yaw=math.radians(90 - a0))
    hx, hz = bearing(p + arc(1.0, G1 - 0.3), G1 - 0.25)       # the rodent hole at the foot of the cell's back wall
    holes = globals().setdefault("holes", [])
    x, z = bearing(p + arc(1.1, RI), RI - 0.02)
    holes.append([round(x, 2), round(Y0 + 0.1, 2), round(z, 2)])
    lump((x, Y0 + 0.1, z), (0.2, 0.05, 0.2), DARK, jitter=0.0, yaw=math.radians(90 - p))
# the ruined quarter's cell, open to the sky: low end walls and scattered corbel stones
pc = 315.0
for side in (-1, 1):
    a = pc + side * arc(CELL_HALF + 0.35, R_CORE)
    for rr in (G0 + 0.45, G1 - 0.45):
        stack(a, rr, 0.9, 0.9, Y0 - 0.4, Y0 + rng.uniform(0.6, 1.3), WALL, jit=0.1)
for _ in range(12):                                            # fallen stones, inside and out
    a = rng.uniform(275, 355)
    r = rng.choice((rng.uniform(RI - 1.6, RI - 0.2), rng.uniform(RO + 0.3, RO + 2.4)))
    x, z = bearing(a, r)
    s = rng.uniform(0.45, 1.0)
    lump((x, ground(x, z) + s * 0.3 if r > RO else Y0 + s * 0.3, z), (s * 1.3, s, s * 0.7), WALL, jitter=0.25, yaw=rng.uniform(0, 3))
# the wall-walk: flat slabs over the intact quarters, between towers and gates
for q in range(3):
    a0 = q * 90 + arc(P["tower_w"] / 2 + 0.3, R_OUT_C)
    a1 = q * 90 + 90 - arc(P["tower_w"] / 2 + 0.3, R_OUT_C)
    a = a0
    while a < a1:
        if in_gap(a, R_OUT_C, 0.2):
            a += 1.0
            continue
        ln = rng.uniform(1.2, 1.9)
        rc = RI + (RO - RI - 0.75) / 2
        x, z = bearing(a + arc(ln, rc) / 2, rc)
        lump((x, Y0 + H + 0.06, z), (ln, RO - RI - 0.75, 0.22), ASHLAR, jitter=0.05, yaw=math.radians(90 - a - arc(ln, rc) / 2))
        a += arc(ln, rc) * 0.98
    walk_tops.append([round(a0, 1), round(a1, 1)])
# the stairs up the inner face in each intact quarter
stairs = []
for p in POSTS:
    a0, a1, n = p + 10.0, p + 27.0, 9
    da = (a1 - a0) / n
    for k in range(n):
        a = a0 + (k + 0.5) * da
        ht = (k + 1) * H / n
        x, z = bearing(a, RI - 0.55)
        lump((x, Y0 + ht / 2 - 0.05, z), (arc_len := math.radians(da) * (RI - 0.55) * 1.04, SKIN, ht), ASHLAR, jitter=0.03,
             yaw=math.radians(90 - a))
    x0, z0 = bearing(a0, RI - 0.55)
    x1, z1 = bearing(a1, RI - 0.55)
    stairs.append({"post": p, "from": [round(x0, 2), round(Y0, 2), round(z0, 2)], "to": [round(x1, 2), round(Y0 + H, 2), round(z1, 2)]})
# gate frames: the north slot between two tall stubs; the south gap timber-framed
for g, w in GATES.items():
    for side in (-1, 1):
        a = g + side * arc(w / 2 + 0.6, RO)
        x, z = bearing(a, RO - 0.4)
        gz_ = ground(*bearing(a, RO + 0.2))
        stack(a, RO - 0.4, 1.0, 1.1, min(gz_, Y0) - 1.0, Y0 + H + 1.2, WALL)
px = []
for side in (-1, 1):
    a = 180 + side * arc(P["gap_w"] / 2, RO)
    x, z = bearing(a, RO + 0.15)
    px.append((x, z))
    lump((x, Y0 + P["frame_h"] / 2 - 0.15, z), (0.3, 0.3, P["frame_h"] + 0.3), TIMBER, jitter=0.02, yaw=0.0)
(x1, z1), (x2, z2) = px
lump(((x1 + x2) / 2, Y0 + P["frame_h"] + 0.1, (z1 + z2) / 2), (math.hypot(x2 - x1, z2 - z1) + 0.6, 0.3, 0.3), TIMBER,
     jitter=0.02, yaw=math.atan2(-(z2 - z1), x2 - x1))

# --- the court ------------------------------------------------------------------------------
for k in range(40):                                            # a few broken paving stones and fallen blocks
    a, r = rng.uniform(0, 360), rng.uniform(6.5, RI - 1.3)
    if in_gap(a, r):
        continue
    x, z = bearing(a, r)
    s = rng.uniform(0.3, 0.8)
    lump((x, Y0 + s * 0.15 + 0.03, z), (s * 1.4, s, s * 0.3), PAVE if k % 3 else WALL, jitter=0.25, yaw=rng.uniform(0, 3))
floor = bmesh.ops.create_circle(bm, cap_ends=True, radius=RO, segments=64)
for f in {f for v in floor["verts"] for f in v.link_faces}:
    f.material_index = mats.index(PAVE)
for v in floor["verts"]:
    v.co = Vector((CX + 0 * v.co.x + v.co.x, -CZ + v.co.y, Y0 + 0.05))

# --- the megaron ----------------------------------------------------------------------------
HW, HN0, HN1 = 2.6, -2.4, 3.9          # the hall's inside: half-width (east-west), south and north walls' inner faces
WT = 0.9


def wall_run(e0, n0, e1, n1, thick, hmax, mat=ASHLAR, collapse=None):
    """A wall of ashlar courses from (e0, n0) to (e1, n1), block heights ruined by `collapse`."""
    L = math.hypot(e1 - e0, n1 - n0)
    cnt = max(1, round(L / 1.25))
    for k in range(cnt):
        t = (k + 0.5) / cnt
        e, n = e0 + (e1 - e0) * t, n0 + (n1 - n0) * t
        hh = hmax * (collapse(e, n) if collapse else 1.0)
        x, z = loc(e, n)
        yaw = math.atan2(-(e1 - e0), -(n1 - n0)) if False else (0.0 if abs(n1 - n0) > abs(e1 - e0) else math.pi / 2)
        y = Y0
        while y < Y0 + hh - 0.02:
            h = min(rng.uniform(0.45, 0.6), Y0 + hh - y)
            size = (L / cnt * 1.02, thick, h) if yaw else (L / cnt * 1.02, thick, h)
            lump((x, y + h / 2, z), (size[0] if yaw == 0.0 else size[0], size[1], size[2]), mat, jitter=0.07,
                 yaw=0.0 if abs(n1 - n0) > abs(e1 - e0) else math.pi / 2)
            y += h


def ne_fall(e, n):      # the north-east corner has fallen; the rest stands, unevenly
    f = 1.0 - 0.75 * max(0.0, min(1.0, (e + n - 3.0) / 3.0))
    return f * rng.uniform(0.75, 1.0)


Hh = P["hall_h"]
wall_run(-HW - WT / 2, HN0 - WT, -HW - WT / 2, HN1 + WT / 2, WT, Hh, collapse=ne_fall)     # west
wall_run(HW + WT / 2, HN0 - WT, HW + WT / 2, HN1 + WT / 2, WT, Hh, collapse=ne_fall)       # east
wall_run(-HW - WT, HN1 + WT / 2, HW + WT, HN1 + WT / 2, WT, Hh, collapse=ne_fall)          # north (the back)
wall_run(-HW - WT, HN0 - WT / 2, -0.95, HN0 - WT / 2, WT, Hh, collapse=ne_fall)            # south, west of the door
wall_run(0.95, HN0 - WT / 2, HW + WT, HN0 - WT / 2, WT, Hh, collapse=ne_fall)              # south, east of the door
wall_run(-HW - WT / 2, HN0 - WT, -HW - WT / 2, HN0 - 3.6, WT, Hh * 0.75)                    # the porch's side walls
wall_run(HW + WT / 2, HN0 - WT, HW + WT / 2, HN0 - 3.6, WT, Hh * 0.7)
lx, lz = loc(-0.3, HN0 - WT - 1.3)                                                          # the fallen lintel
lump((lx, Y0 + 0.25, lz), (1.0, 2.2, 0.5), ASHLAR, jitter=0.05, yaw=0.3)


def column(e, n, hh, r=0.36):
    x, z = loc(e, n)
    y = Y0
    while y < Y0 + hh - 0.02:
        h = min(rng.uniform(0.4, 0.55), Y0 + hh - y)
        lump((x, y + h / 2, z), (r * 2, r * 2, h), ASHLAR, jitter=0.06, yaw=rng.uniform(0, 1))
        y += h


for e, n, hh in ((-1.5, -1.0, 2.2), (1.5, -1.0, 0.7), (-1.5, 1.6, 1.3), (1.5, 1.6, 2.6)):   # the hall's four
    column(e, n, hh)
column(-1.5, HN0 - 3.3, 2.4, 0.4)                                                          # the porch's two
column(1.5, HN0 - 3.3, 0.9, 0.4)
for e, n in ((2.2, HN0 - 4.6), (0.7, HN0 - 4.4)):                                          # fallen drums in the porch
    x, z = loc(e, n)
    lump((x, Y0 + 0.25, z), (0.8, 0.8, 0.5), ASHLAR, jitter=0.05, yaw=rng.uniform(0, 3))
hx, hz = loc(0.0, 0.3)                                                                      # the hearth
lump((hx, Y0 + 0.14, hz), (1.9, 1.9, 0.28), WALL, jitter=0.08, yaw=0.3)
sx, sz = loc(0.0, 2.5)                                                                      # the chief's stone chair
lump((sx, Y0 + 0.25, sz), (0.7, 1.2, 0.5), ASHLAR, jitter=0.03, yaw=0.0)
bx, bz = loc(0.0, 2.85)
lump((bx, Y0 + 0.65, bz), (0.14, 1.2, 0.9), ASHLAR, jitter=0.02, yaw=0.0)
for e, n, w in ((-2.0, 3.45, 1.1), (0.0, 3.45, 1.1), (2.0, 3.45, 1.1)):                     # a low stone shelf for the loot
    x, z = loc(e, n)
    lump((x, Y0 + 0.12, z), (0.9, w, 0.24), WALL, jitter=0.04, yaw=0.0)
# the rodents' runs: paired stone kerbs from the hall's porch to each post's door, and the holes
runs = []
for p in POSTS:
    a_door = p
    start = loc(0.0, HN0 - 4.4)
    end = bearing(a_door, RI - 0.3)
    runs.append([[round(start[0], 2), round(Y0, 2), round(start[1], 2)], [round(end[0], 2), round(Y0, 2), round(end[1], 2)]])
    dx, dz = end[0] - start[0], end[1] - start[1]
    L = math.hypot(dx, dz)
    nx, nz = -dz / L, dx / L
    for side in (-1, 1):
        for k in range(int(L / 0.9)):
            t = (k + 0.5) * 0.9 / L
            x = start[0] + dx * t + nx * 0.13 * side
            z = start[1] + dz * t + nz * 0.13 * side
            lump((x, Y0 + 0.08, z), (0.85, 0.1, 0.1), WALL, jitter=0.03, yaw=math.atan2(-dz, dx))
hx_, hz_ = loc(1.0, HN0 - 4.4)
holes.append([round(hx_, 2), round(Y0 + 0.1, 2), round(hz_, 2)])
lump((hx_, Y0 + 0.1, hz_), (0.2, 0.2, 0.05), DARK, jitter=0.0, yaw=0.0)
hx_, hz_ = loc(0.0, HN1 - 0.1)
holes.append([round(hx_, 2), round(Y0 + 0.1, 2), round(hz_, 2)])

me = bpy.data.meshes.new("shell")
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
for m in mats:
    me.materials.append(m)
o = bpy.data.objects.new("shell", me)
bpy.context.scene.collection.objects.link(o)
C = lambda e, n, y: [round(loc(e, n)[0], 2), round(Y0 + y, 2), round(loc(e, n)[1], 2)]
json.dump({"_note": "Written by art/sets/crown.py; explorer coords [x, y, z], metres. Bearings: 0 north (-x), 90 east (-z).",
           "params": P, "top": [CX, round(ground(CX, CZ), 2), CZ], "floor": Y0,
           "posts": [{"bearing": p, "door": [round(bearing(p, RI - 0.3)[0], 2), round(Y0, 2), round(bearing(p, RI - 0.3)[1], 2)],
                      "cell": [round(bearing(p, R_CORE)[0], 2), round(Y0, 2), round(bearing(p, R_CORE)[1], 2)],
                      "walk": [round(bearing(p + 40, R_CORE)[0] if False else bearing(p - 12, RI + 1.4)[0], 2), round(Y0 + H, 2),
                               round(bearing(p - 12, RI + 1.4)[1], 2)]} for p in POSTS],
           "stairs": stairs, "walk_tops": walk_tops,
           "chief": {"seat": C(0.0, 2.45, 0.5), "facing": 180, "loot": [C(e, 3.45, 0.24) for e in (-2.0, 0.0, 2.0)], "hearth": C(0.0, 0.3, 0.28),
                     "door": C(0.0, HN0, 0.0)},
           "slot": [round(v, 2) for v in bearing(0, RO)], "gap": [round(v, 2) for v in bearing(180, RO)],
           "runs": runs, "holes": holes},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("CROWN", NAME, len(me.polygons), "faces")
