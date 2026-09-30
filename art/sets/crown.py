"""The crown of Mount Phyle: a small sealed ring wall on the summit and three lookout posts on the slopes.

    blender -b -P art/sets/crown.py -- <set name>        # e.g. crown

Reads its site from art/sets/sets.json (`crown`: `top`, the summit's explorer [x, z], `pad`, the
floor's level, and the parameters below) and writes art/sets/<name>.glb and <name>.json. The GLB is
in explorer coords (origin at the world's origin). art/sets/bake.py levels the summit to a disc
(its `circle`, `centre` and `pad`, a little under this set's floor) and joins the set in.

As the setting has it, a ruined Bronze Age ring of cyclopean masonry:
- a small ring wall on the summit, solid all round: no gate, no gap, no stair. It is a ruin: out of true,
  uneven in height with stretches where the top has tumbled and a spill of fallen stones round its foot, but
  one skin always stands at least 2.4 m, so it is never breached. Its outer face drops as a
  revetment down the slope. A timber ladder, drawn up inside, is the only way over it;
- inside, a paved floor and the loot's strongboxes on a low shelf. Nothing
  is roofed and no fire burns. The chief can see only sky;
- the other three men hold lookout posts out on the slopes, each a hollow among crags with a rough, uneven dry-stone breastwork
  on the downhill side, looking out over its own approach. Terrain between the
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
HIDE = material("goat-hide", (0.36, 0.3, 0.23), 0.95)
mats = [WALL, ROCK, ASHLAR, PAVE, TIMBER, HIDE]
bm = bmesh.new()


def lump(c, size, mat, jitter=0.12, yaw=None, sub=0, tilt=0.0, pitch=0.0):
    """A squared block (sub = 0) or a faceted rock (sub > 0), corners pushed about, at explorer centre
    c (x, y, z), size (along, across, up) on a blender yaw (radians about the vertical)."""
    M = (Matrix.Translation((c[0], -c[2], c[1])) @ Matrix.Rotation(yaw if yaw is not None else 0.0, 4, "Z")
         @ Matrix.Rotation(pitch, 4, "Y") @ Matrix.Rotation(rng.uniform(-tilt, tilt), 4, "X") @ Matrix.Rotation(rng.uniform(-tilt, tilt), 4, "Y")
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


def stack(a, r, thick, blen, y0, top, mat, at=None, jit=0.12, tilt=0.0, hmin=0.55, hmax=1.0):
    """One column of blocks from y0 up to top at bearing a, radius r, radial thickness thick."""
    x, z = bearing(a, r, at)
    y = y0
    while y < top - 0.02:
        h = rng.uniform(hmin, hmax)
        if top - (y + h) < 0.4:
            h = top - y
        lump((x, y + h / 2, z), (blen * 0.97, thick * rng.uniform(0.95, 1.08), h), mat, jitter=jit, tilt=tilt,
             yaw=math.radians(90 - a) + rng.uniform(-0.06, 0.06))
        y += h * 0.93 if h > 0.45 else h


def wob(a):
    """The ring is not a true circle: its radius wanders a little with the bearing."""
    return 1.0 + 0.05 * math.sin(math.radians(2 * a) + 0.7) + 0.035 * math.sin(math.radians(3 * a) + 2.0)


def wall_top(a):
    """Standing height above the floor: uneven, with stretches where the top has tumbled. Returns (outer, inner);
    one skin always stands at least 2.4 m, so the wall is never breached."""
    h = 3.15 + 0.45 * math.sin(math.radians(2.3 * a) + 1.0) + 0.3 * math.sin(math.radians(5.1 * a))
    out, inn = h, h
    for c0, w, which in ((40, 26, "out"), (150, 22, "in"), (232, 30, "out"), (318, 20, "in")):      # the tumbled stretches
        d = abs((a - c0 + 180) % 360 - 180)
        if d < w:
            drop = (1.0 + 0.9 * math.cos(math.pi / 2 * d / w)) * (0.6 + 0.4 * math.cos(math.pi / 2 * d / w))
            if which == "out":
                out = max(1.5, out - drop)
            else:
                inn = max(1.7, inn - drop)
    return max(out, 2.4) if out >= inn else out, max(inn, 2.4) if inn > out else inn


# --- the ring wall: solid all round, its top jagged but never broken ------------------------------
deg = 0.0
while deg < 360.0:
    blen = rng.uniform(1.2, 2.4)
    step = arc(blen, (RI + RO) / 2)
    a = deg + step / 2
    deg += step
    w = wob(a)
    ho, hi = wall_top(a)
    base = min(ground(*bearing(a + da, (RO + dr) * w)) for da in (-4, 0, 4) for dr in (0.4, 1.4, 2.6)) - 2.0
    stack(a, R_OUT_C * w, SKIN, blen, min(base, Y0), Y0 + ho, WALL, tilt=0.06, hmin=0.6, hmax=1.3)
    stack(a, R_IN_C * w, SKIN, blen, Y0 - 0.4, Y0 + hi, WALL, tilt=0.06, hmin=0.6, hmax=1.3)
# fallen stones: a spill of blocks round the outer foot and a few inside, big ones near the wall
for _ in range(55):
    a = rng.uniform(0, 360)
    r = (RO + 0.3 + abs(rng.gauss(0, 1.6))) * wob(a)
    x, z = bearing(a, r)
    s_ = rng.uniform(0.35, 1.3) * (1.3 if r < RO + 1.2 else 0.8)
    lump((x, ground(x, z) + s_ * 0.3, z), (s_ * 1.4, s_, s_ * 0.8), WALL, jitter=0.25, yaw=rng.uniform(0, 3), tilt=0.4)
for _ in range(14):
    a = rng.uniform(0, 360)
    r = (RI - 0.4 - abs(rng.gauss(0, 0.7))) * wob(a)
    x, z = bearing(a, max(r, 1.4))
    s_ = rng.uniform(0.3, 0.8)
    lump((x, Y0 + s_ * 0.3, z), (s_ * 1.3, s_, s_ * 0.7), WALL, jitter=0.25, yaw=rng.uniform(0, 3), tilt=0.4)

# --- inside: paving, the chief's chair, the loot ------------------------------------------------
floor = bmesh.ops.create_circle(bm, cap_ends=True, radius=RI * 1.08, segments=48)
for f in {f for v in floor["verts"] for f in v.link_faces}:
    f.material_index = mats.index(PAVE)
for v in floor["verts"]:
    v.co = Vector((CX + v.co.x, -CZ + v.co.y, Y0 + 0.05))


def loc(e, n):
    return CX - n, CZ - e


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
    # the breastwork: a low dry-stone arc on the downhill side, but rough: uneven radius, spacing and height,
    # stones tilted, a gap or two, and a few fallen
    for k in range(10):
        if k in (3, 7) and rng.random() < 0.7:             # a gap where it has slipped or was never finished
            continue
        a = pb + (k - 4.5) * 20.0 + rng.uniform(-6, 6)
        rr = rng.uniform(1.5, 2.1)
        ax, az = bearing(a, rr, (px, pz))
        stack(a, rr, rng.uniform(0.55, 0.9), rng.uniform(0.7, 1.3), ground(ax, az) - 0.5,
              gy + rng.uniform(0.55, 1.35), WALL, at=(px, pz), jit=0.3, tilt=0.2, hmin=0.4, hmax=0.8)
    for k in range(5):                                     # stones that have rolled off it
        a = pb + rng.uniform(-110, 110)
        fx, fz = bearing(a, rng.uniform(2.0, 3.0), (px, pz))
        sz = rng.uniform(0.3, 0.7)
        lump((fx, ground(fx, fz) + sz * 0.3, fz), (sz * 1.3, sz, sz * 0.8), WALL, jitter=0.3, yaw=rng.uniform(0, 3), tilt=0.4)
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
           "chief": {"stands": C(0.0, 0.6, 0.0), "loot": [C(e, 3.0, 0.24) for e in (-1.6, 0.0, 1.6)],
                     "sandglass": C(1.9, 0.0, 0.6), "ladder": C(0.0, -RI + 0.35, 0.0)},
           "posts": posts},
          open(f"art/sets/{NAME}.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("CROWN", NAME, len(me.polygons), "faces")
