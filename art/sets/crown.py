"""The crown of Mount Phyle: a small sealed ring wall on the summit and three lookout posts on the slopes.

    blender -b -P art/sets/crown.py -- <set name>        # e.g. crown

Reads its site from art/sets/sets.json (`crown`: `top`, the summit's explorer [x, z], `pad`, the
floor's level, and the parameters below) and writes art/sets/<name>.glb and <name>.json. The GLB is
in explorer coords (origin at the world's origin). art/sets/bake.py levels the summit to a disc
(its `circle`, `centre` and `pad`, a little under this set's floor) and joins the set in.

As the setting has it, a ruined Bronze Age ring of cyclopean masonry:
- a small ring wall on the summit, solid all round: no gate, no gap, no stair. It stands to about
  a man and a half above a man's head, its top jagged, never broken through. Its outer face drops as a
  revetment down the slope. A timber ladder, drawn up inside, is the only way over it;
- inside, a paved floor, the chief's stone chair, and the loot's strongboxes on a low shelf. Nothing
  is roofed and no fire burns. The chief can see only sky;
- the other three men hold lookout posts out on the slopes, each a hollow among crags with a low
  dry-stone breastwork on the downhill side, looking out over its own approach. Terrain between the
  posts blocks every line between them (scouted by ray cast; no pair sees another).
Bearings are compass bearings from the top (0 = north = -x, 90 = east = -z).
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
P = dict(pad=48.7, r_in=4.4, r_out=6.0, wall_min=2.6, wall_max=3.6, posts=[[45.0, 22.0], [165.0, 22.0], [285.0, 22.0]],
         post_wall=1.15, seed=11)
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
ROCK = material("limestone-crag", (0.56, 0.53, 0.47))
ASHLAR = material("dressed-limestone", (0.62, 0.58, 0.5))
PAVE = material("court-paving", (0.5, 0.46, 0.4))
TIMBER = material("weathered-timber", (0.32, 0.24, 0.16), 0.8)
mats = [WALL, ROCK, ASHLAR, PAVE, TIMBER]
bm = bmesh.new()


def lump(c, size, mat, jitter=0.12, yaw=None, sub=0):
    """A squared block (sub = 0) or a faceted rock (sub > 0), corners pushed about, at explorer centre
    c (x, y, z), size (along, across, up) on a blender yaw (radians about the vertical)."""
    M = (Matrix.Translation((c[0], -c[2], c[1])) @ Matrix.Rotation(yaw if yaw is not None else 0.0, 4, "Z")
         @ Matrix.Diagonal((*size, 1)))
    vs = (bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=0.5, matrix=Matrix())["verts"] if sub else
          bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix())["verts"])
    for v in vs:
        v.co = Vector((v.co.x + rng.uniform(-jitter, jitter) * 0.5, v.co.y + rng.uniform(-jitter, jitter) * 0.5,
                       v.co.z + rng.uniform(-jitter, jitter) * 0.3))
        v.co = M @ v.co
    k = mats.index(mat)
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = k


def bearing(deg, r, at=None):
    a = math.radians(deg)
    x0, z0 = at if at else (CX, CZ)
    return x0 - r * math.cos(a), z0 - r * math.sin(a)


def arc(m, r):
    return math.degrees(m / r)


Y0 = P["pad"]
RI, RO = P["r_in"], P["r_out"]
SKIN = 1.0
R_OUT_C, R_IN_C = RO - SKIN / 2, RI + SKIN / 2


def stack(a, r, thick, blen, y0, top, mat, at=None, jit=0.12):
    """One column of blocks from y0 up to top at bearing a, radius r, radial thickness thick."""
    x, z = bearing(a, r, at)
    y = y0
    while y < top - 0.02:
        h = rng.uniform(0.55, 1.0)
        if top - (y + h) < 0.4:
            h = top - y
        lump((x, y + h / 2, z), (blen * 0.97, thick * rng.uniform(0.95, 1.08), h), mat, jitter=jit,
             yaw=math.radians(90 - a) + rng.uniform(-0.04, 0.04))
        y += h * 0.93 if h > 0.45 else h


# --- the ring wall: solid all round, its top jagged but never broken ------------------------------
deg = 0.0
while deg < 360.0:
    blen = rng.uniform(1.0, 1.9)
    step = arc(blen, (RI + RO) / 2)
    a = deg + step / 2
    deg += step
    top = Y0 + rng.uniform(P["wall_min"], P["wall_max"])
    base = min(ground(*bearing(a + da, RO + dr)) for da in (-4, 0, 4) for dr in (0.4, 1.4, 2.6)) - 2.0
    stack(a, R_OUT_C, SKIN, blen, min(base, Y0), top, WALL)
    stack(a, R_IN_C, SKIN, blen, Y0 - 0.4, top, WALL)
# a few fallen stones, inside and out
for _ in range(10):
    a = rng.uniform(0, 360)
    r = rng.choice((rng.uniform(RI - 1.0, RI - 0.3), rng.uniform(RO + 0.3, RO + 1.8)))
    x, z = bearing(a, r)
    s = rng.uniform(0.4, 0.9)
    lump((x, (Y0 if r < RO else ground(x, z)) + s * 0.3, z), (s * 1.3, s, s * 0.7), WALL, jitter=0.25, yaw=rng.uniform(0, 3))

# --- inside: paving, the chief's chair, the loot ------------------------------------------------
floor = bmesh.ops.create_circle(bm, cap_ends=True, radius=RI + 0.2, segments=48)
for f in {f for v in floor["verts"] for f in v.link_faces}:
    f.material_index = mats.index(PAVE)
for v in floor["verts"]:
    v.co = Vector((CX + v.co.x, -CZ + v.co.y, Y0 + 0.05))


def loc(e, n):
    return CX - n, CZ - e


sx, sz = loc(0.0, 0.6)                                                      # the chief's stone chair, facing south
lump((sx, Y0 + 0.25, sz), (0.7, 1.2, 0.5), ASHLAR, jitter=0.03)
bx, bz = loc(0.0, 0.95)
lump((bx, Y0 + 0.65, bz), (0.14, 1.2, 0.9), ASHLAR, jitter=0.02)
for e in (-1.6, 0.0, 1.6):                                                  # a low stone shelf for the loot
    x, z = loc(e, 3.0)
    lump((x, Y0 + 0.12, z), (0.9, 1.1, 0.24), WALL, jitter=0.04)
jx, jz = loc(1.9, 0.0)                                                      # a stone for the sandglass
lump((jx, Y0 + 0.3, jz), (0.5, 0.5, 0.6), ASHLAR, jitter=0.04, yaw=0.4)
# the timber ladder, drawn up and leaning on the inner face of the south wall
for side in (-0.3, 0.3):
    x0, z0 = loc(side, -RI + 0.35)
    lump((x0, Y0 + 1.6, z0), (0.1, 0.1, 3.4), TIMBER, jitter=0.0, yaw=0.0)
for k in range(8):
    x, z = loc(0.0, -RI + 0.35)
    lump((x, Y0 + 0.4 + k * 0.4, z), (0.08, 0.7, 0.08), TIMBER, jitter=0.0, yaw=0.0)

# --- the three lookout posts on the slopes ------------------------------------------------------
posts = []
for n, (pb, pr) in enumerate(P["posts"]):
    px, pz = bearing(pb, pr)
    gy = ground(px, pz)
    posts.append({"number": n + 2, "bearing": pb, "r": pr, "at": [round(px, 2), round(gy, 2), round(pz, 2)], "watching": pb})
    for k in range(9):                                     # the breastwork: a low arc on the downhill side
        a = pb + (k - 4) * 19.0
        ax, az = bearing(a, 1.7, (px, pz))
        stack(a, 1.7, 0.6, 0.85, ground(ax, az) - 0.5, gy + P["post_wall"], WALL, at=(px, pz), jit=0.1)
    for k in range(7):                                     # crags behind and beside, on the uphill side
        a = pb + 180 + (k - 3) * 30.0
        rr = rng.uniform(2.3, 3.2)
        cx_, cz_ = bearing(a, rr, (px, pz))
        h = rng.uniform(1.5, 2.6)
        s = rng.uniform(1.6, 2.6)
        lump((cx_, ground(cx_, cz_) + h / 2 - 0.3, cz_), (s, s * rng.uniform(0.6, 1.0), h), ROCK, jitter=0.3, sub=2,
             yaw=rng.uniform(0, 3))

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
           "chief": {"seat": C(0.0, 0.6, 0.5), "facing": 180, "loot": [C(e, 3.0, 0.24) for e in (-1.6, 0.0, 1.6)],
                     "sandglass": C(1.9, 0.0, 0.6), "ladder": C(0.0, -RI + 0.35, 0.0)},
           "posts": posts},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("CROWN", NAME, len(me.polygons), "faces")
