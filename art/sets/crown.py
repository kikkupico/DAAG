"""The crown of Mount Phyle: a parametric set for the Arche island model and the previs.

    blender -b -P art/sets/crown.py -- <set name>        # e.g. crown

Reads its site from art/sets/sets.json (`crown`: `top`, the summit's explorer [x, z], and the
parameters below; `at` is the origin, since the set is built in place) and writes art/sets/<name>.glb and art/sets/<name>.json. Everything is
seated on the untouched island model (art/islands.json `source`), found by casting rays down,
so the set follows the dome of the summit; the GLB is in explorer coords (origin at the world's
origin), and art/sets/bake.py joins it without levelling any ground.

As the setting has it:
- a ruined cyclopean ring wall of rough polygonal blocks round the top, standing to different
  heights where it has fallen, with rubble spilt beside it;
- two breaks only: a narrow slot through rock on the north, and a wider gap on the south
  framed in timber (two posts and a lintel);
- inside, a jumble of pale limestone crags and clefts, highest at the peak, where a ring of
  crags makes the chief's hollow, a rock shelter open to one side;
- below the rim, three small lookout posts, each a hollow in its own cluster of crags facing
  a different approach, hidden from one another and from the peak by rock.
No roofs, no court, no buildings. Strongboxes and water jars are props (render.py).
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
P = dict(wall_r=9.5, wall_t=2.0, block=(0.9, 1.7), wall_h=(0.5, 2.2),
         slot_w=1.3, gap_w=3.2, frame_h=2.6, posts=[35.0, 150.0, 260.0], post_r=16.0, seed=11)
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


bpy.data.objects.remove(island)


def material(name, rgb, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


ROCK = material("limestone-crag", (0.56, 0.53, 0.47))
WALL = material("cyclopean-stone", (0.42, 0.4, 0.36))
TIMBER = material("weathered-timber", (0.32, 0.24, 0.16), 0.8)

bm = bmesh.new()
mats = [ROCK, WALL, TIMBER]


def lump(c, size, mat, jitter=0.25, sub=1, yaw=None):
    """A rough rock (an icosphere, sub > 0) or block (a cube, sub = 0) with its corners pushed
    about, at explorer centre c (x, y, z), size (along, across, up)."""
    M = (Matrix.Translation((c[0], -c[2], c[1])) @ Matrix.Rotation(yaw if yaw is not None else rng.uniform(0, math.pi), 4, "Z")
         @ Matrix.Diagonal((*size, 1)))
    if sub:          # a rounded, faceted rock
        vs = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=0.5, matrix=Matrix())["verts"]
    else:            # a squared block
        vs = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix())["verts"]
    for v in vs:
        v.co = Vector((v.co.x + rng.uniform(-jitter, jitter) * 0.5,
                       v.co.y + rng.uniform(-jitter, jitter) * 0.5,
                       v.co.z + rng.uniform(-jitter, jitter) * 0.4))
        v.co = M @ v.co
    k = mats.index(mat)
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = k


def bearing(deg, r):
    """Explorer (x, z) at compass bearing deg (0 = north, 90 = east) and distance r from the top."""
    a = math.radians(deg)
    return CX - r * math.cos(a), CZ - r * math.sin(a)


def gap_at(deg):
    """Half-width (degrees) of the break at this bearing, or 0."""
    for centre, w in ((0.0, P["slot_w"]), (180.0, P["gap_w"])):
        d = abs((deg - centre + 180) % 360 - 180)
        half = math.degrees((w / 2) / P["wall_r"])
        if d < half:
            return half
    return 0.0


# --- the ring wall ---------------------------------------------------------------------------
R, T = P["wall_r"], P["wall_t"]
circ = 2 * math.pi * R
deg = 0.0
while deg < 360.0:
    blen = rng.uniform(*P["block"])
    step = math.degrees(blen / R)
    mid = deg + step / 2
    if gap_at(mid):
        deg += step
        continue
    # the wall's standing height, varying smoothly round the ring, with fallen stretches
    hh = P["wall_h"][0] + (P["wall_h"][1] - P["wall_h"][0]) * (0.5 + 0.5 * math.sin(math.radians(mid * 3.0 + 40)) * math.cos(math.radians(mid * 1.7)))
    if 55 < mid < 100 or 220 < mid < 255 or 300 < mid < 325:
        hh *= 0.3                                            # fallen stretches
    for layer in range(2):                                   # two faces: outer and inner skins
        r = R + T * (0.25 + 0.5 * layer)
        x, z = bearing(mid, r)
        g = ground(x, z)
        y = g - 0.4
        while y < g + hh:
            h = rng.uniform(0.6, 1.1)
            lump((x, y + h / 2, z), (blen * 0.95, T * 0.55, h), WALL, jitter=0.18, sub=0, yaw=math.radians(90 - mid) + rng.uniform(-0.1, 0.1))   # along the ring
            y += h * 0.92
    if hh < 1.0:                                             # rubble spilt outside a fallen stretch
        for _ in range(3):
            x, z = bearing(mid + rng.uniform(-3, 3), R + T + rng.uniform(0.3, 2.5))
            s = rng.uniform(0.4, 0.9)
            lump((x, ground(x, z) + s * 0.3, z), (s, s * 0.8, s * 0.6), WALL, jitter=0.2, sub=0)
    deg += step

# the north slot: a narrow cut between two tall crags
for side in (-1, 1):
    x, z = bearing(side * math.degrees((P["slot_w"] / 2 + 0.9) / R), R + T / 2)
    g = ground(x, z)
    lump((x, g + 1.4, z), (2.4, T * 1.4, 3.2), ROCK, jitter=0.25, sub=2)
# the south gap: timber-framed, two posts and a lintel
px = []
for side in (-1, 1):
    x, z = bearing(180 + side * math.degrees((P["gap_w"] / 2) / R), R + T / 2)
    g = ground(x, z)
    px.append((x, g, z))
    lump((x, g + P["frame_h"] / 2 - 0.2, z), (0.28, 0.28, P["frame_h"] + 0.4), TIMBER, jitter=0.02, sub=0, yaw=0.0)
(x1, g1, z1), (x2, g2, z2) = px
L = math.hypot(x2 - x1, z2 - z1) + 0.6
lump(((x1 + x2) / 2, max(g1, g2) + P["frame_h"] + 0.1, (z1 + z2) / 2), (L, 0.3, 0.3), TIMBER, jitter=0.02, sub=0,
     yaw=math.atan2(-(z2 - z1), x2 - x1))

# --- the crags inside, highest at the peak, and the chief's hollow ---------------------------
for _ in range(34):
    a = rng.uniform(0, 360)
    r = math.sqrt(rng.uniform(0.05, 1.0)) * (R - 1.2)
    if gap_at(a) and r > R - 3:
        continue
    x, z = bearing(a, r)
    peak = 1.0 - r / R
    h = rng.uniform(0.6, 1.4) + 1.8 * peak
    s = rng.uniform(1.6, 3.2)
    lump((x, ground(x, z) + h / 2 - 0.4, z), (s, s * rng.uniform(0.6, 1.0), h), ROCK, jitter=0.3, sub=2)
for k in range(9):                                            # the hollow: crags in a ring, open to the south-east
    a = k * 40.0
    if 110 < a < 160:
        continue
    x, z = bearing(a, 1.8)
    h = rng.uniform(1.8, 2.6)
    lump((x, ground(x, z) + h / 2 - 0.4, z), (1.9, 1.5, h), ROCK, jitter=0.25, sub=2)

# --- three lookout posts below the rim ---------------------------------------------------------
posts = []
for bdeg in P["posts"]:
    x, z = bearing(bdeg, P["post_r"])
    g = ground(x, z)
    posts.append({"bearing": bdeg, "at": [round(x, 2), round(g, 2), round(z, 2)]})
    for k in range(7):                                        # crags round the post, open downhill
        a = bdeg + 180 + (k - 3) * 38                         # the uphill side and flanks
        cx_, cz_ = x - 2.2 * math.cos(math.radians(a)), z - 2.2 * math.sin(math.radians(a))
        h = rng.uniform(1.6, 2.4)
        lump((cx_, ground(cx_, cz_) + h / 2 - 0.4, cz_), (2.0, 1.6, h), ROCK, jitter=0.25, sub=2)

me = bpy.data.meshes.new("shell")
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
for m in mats:
    me.materials.append(m)
o = bpy.data.objects.new("shell", me)
bpy.context.scene.collection.objects.link(o)
json.dump({"_note": "Written by art/sets/crown.py; explorer coords [x, y, z], metres.",
           "params": P, "top": [CX, round(ground(CX, CZ), 2), CZ], "posts": posts,
           "slot": [round(v, 2) for v in bearing(0, R + T / 2)], "gap": [round(v, 2) for v in bearing(180, R + T / 2)]},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("CROWN", NAME, len(me.polygons), "faces")
