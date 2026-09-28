"""Trees and shrubs for a bare island model: a parametric set for the island and the previs.

    blender -b -P art/sets/flora.py -- <set name>        # e.g. flora

The terrain plates are drawn bare, so Meshy reads the land's true shape; this plants it. It
reads the set's `flora` entry in art/sets/sets.json and writes art/sets/<name>.glb in explorer
coords (origin at the world's origin), which art/sets/bake.py joins without levelling ground.

The plants are Meshy models of real species (art/flora/, one sheet cut apart by
art/flora/split.py), scattered as copies, each turned, leaned and sized a little differently.
Planting follows the setting: olive groves on the gentle ground round each town, maritime pine,
holm oak and cypress on the lower spurs, maquis thickening upslope, and bare limestone round the
crown. Nothing grows in the sea, on cliffs too steep to hold soil, within `road_clear` metres of
the road (`road_loop`, waypoints traced from a top view, plus each town's traced road), on the
quays (flat ground near the water), on any building's ground (`avoid_sets`' strips), or within
`crown.r` of the summit. Plants clump, by a smoothed random field, as scrub and woods do.
"""
import bpy, json, math, random, sys
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITES = json.load(open("art/sets/sets.json"))
SITE = SITES[NAME]
F = SITE["flora"]
I = json.load(open("art/islands.json"))[SITE["island"]]
rng = random.Random(F.get("seed", 5))
nrng = np.random.default_rng(F.get("seed", 5))
D = 1.0

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
Mw = island.matrix_world.copy()
Mi = Mw.inverted()
down = (Mi.to_3x3() @ Vector((0, 0, -1))).normalized()
bb = [Mw @ Vector(c) for c in island.bound_box]
xmin, xmax = min(v.x for v in bb) - 2, max(v.x for v in bb) + 2
zmin, zmax = -max(v.y for v in bb) - 2, -min(v.y for v in bb) + 2
bpy.data.objects.remove(island)

nx, nz = int((xmax - xmin) / D), int((zmax - zmin) / D)
H = np.full((nx, nz), -1.0)
for i in range(nx):
    for j in range(nz):
        loc, *_ = bvh.ray_cast(Mi @ Vector((xmin + (i + .5) * D, -(zmin + (j + .5) * D), 500)), down)
        if loc:
            H[i, j] = (Mw @ loc).z
X = xmin + (np.arange(nx) + .5) * D
Z = zmin + (np.arange(nz) + .5) * D
XX, ZZ = np.meshgrid(X, Z, indexing="ij")
sea = H < 0.3
top = float(H.max())


def grow(m, n):
    for _ in range(n):
        g = m.copy()
        g[1:, :] |= m[:-1, :]; g[:-1, :] |= m[1:, :]
        g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
        m = g
    return m


def blur(A, n):
    for _ in range(n):
        A = (A + np.roll(A, 1, 0) + np.roll(A, -1, 0) + np.roll(A, 1, 1) + np.roll(A, -1, 1)) / 5
    return A


gx, gz = np.gradient(np.where(sea, 0, H), D)
slope = np.hypot(gx, gz)
Pw = np.pad(np.where(sea, -50, H), 3, mode="edge")
win = np.lib.stride_tricks.sliding_window_view(Pw, (7, 7))
flat = (win.max(axis=(2, 3)) - win.min(axis=(2, 3))) < 0.5

# where nothing may grow
bare = sea | grow(sea, 1) | (slope > 1.4)
bare |= grow(sea, 10) & flat                                    # quays and waterfront shelves
bare |= grow(sea, 14) & (H < 3.4)                              # piers and moles: quay level near the water
lines = [F["road_loop"]] + [s["fill"]["road"] for s in SITES.values()
                            if isinstance(s, dict) and s.get("island") == SITE["island"] and "road" in s.get("fill", {})]
for pts in lines:
    for (ax, az), (bx, bz) in zip(pts, pts[1:]):
        vx, vz = bx - ax, bz - az
        L2 = vx * vx + vz * vz or 1e-9
        tt = np.clip(((XX - ax) * vx + (ZZ - az) * vz) / L2, 0, 1)
        bare |= np.hypot(XX - (ax + tt * vx), ZZ - (az + tt * vz)) < F.get("road_clear", 4.5)


def rect(at, half, rot, grow_m):
    r = math.radians(rot)
    dx, dz = XX - at[0], ZZ - at[1]
    u = dx * math.cos(r) + dz * math.sin(r)
    v = -dx * math.sin(r) + dz * math.cos(r)
    return (np.abs(u) <= half[0] + grow_m) & (np.abs(v) <= half[1] + grow_m)


for other in F.get("avoid_sets", []):
    for st in json.load(open(f"art/sets/{other}-strips.json"))["strips"]:
        bare |= rect(st["at"], st["half"], st["rot"], 2.0)
cr = F["crown"]
bare |= np.hypot(XX - cr["top"][0], ZZ - cr["top"][1]) < cr["r"]

# clumping: a smoothed random field, high where woods and scrub gather
clump = blur(nrng.random(H.shape), 6)
clump = (clump - clump.min()) / (np.ptp(clump) or 1)
town_d = np.min([np.hypot(XX - tx, ZZ - tz) for tx, tz in F["towns"]], axis=0)
alt = np.clip(H / top, 0, 1)


# The plants: Meshy models of a sheet of real species (art/flora/, made by art/flora/split.py),
# all cut from one model, so they share one texture and one material.
ASSETS = {"pine": ["pine-1", "pine-2", "pine-3"], "oak": ["oak-1", "oak-2"], "olive": ["olive-1", "olive-2"],
          "cypress": ["cypress-1", "cypress-2"], "maquis": ["shrub-1", "shrub-2", "shrub-3"]}
SIZE = {"pine": (0.55, 0.85), "oak": (0.7, 1.05), "olive": (0.8, 1.1), "cypress": (0.6, 0.9), "maquis": (0.8, 1.4)}
TEMPLATES = {}
shared = None
for names in ASSETS.values():
    for n in names:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=f"art/flora/{n}.glb")
        o = next(x for x in set(bpy.data.objects) - before if x.type == "MESH")
        o.data.transform(o.matrix_world)
        o.matrix_world.identity()
        if shared is None:
            # Meshy's texture is grey-green and cold; warm and green it, as sunlit Mediterranean
            # foliage is, by multiplying the base colour
            shared = o.data.materials[0]
            nt = shared.node_tree
            bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
            link = next((l for l in nt.links if l.to_socket == bsdf.inputs["Base Color"]), None)
            if link:
                mix = nt.nodes.new("ShaderNodeMix")
                mix.data_type = "RGBA"
                mix.blend_type = "MULTIPLY"
                mix.inputs["Factor"].default_value = 1.0
                mix.inputs["B"].default_value = (0.95, 1.1, 0.62, 1)
                nt.links.new(link.from_socket, mix.inputs["A"])
                nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
        o.data.materials[0] = shared
        bpy.context.scene.collection.objects.unlink(o) if o.name in bpy.context.scene.collection.objects else None
        for c in o.users_collection:
            c.objects.unlink(o)
        TEMPLATES[n] = o
placed = []


def plant(kind, c, s):
    """One plant of `kind` standing at c (blender coords), scaled by s: a linked copy of one
    of the species' models, turned at random and leaning a little."""
    o = rng.choice([TEMPLATES[n] for n in ASSETS[kind]]).copy()
    o.location = c
    o.rotation_euler = (rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), rng.uniform(0, 2 * math.pi))
    o.scale = (s * rng.uniform(0.9, 1.1), s * rng.uniform(0.9, 1.1), s)
    bpy.context.scene.collection.objects.link(o)
    placed.append(o)


counts = {}
step = F.get("step", 3.2)
gx0 = xmin + step / 2
x = gx0
while x < xmax:
    z = zmin + step / 2 + (rng.random() * step if int((x - xmin) / step) % 2 else 0)
    while z < zmax:
        px, pz = x + rng.uniform(-1, 1) * step * 0.45, z + rng.uniform(-1, 1) * step * 0.45
        i, j = int((px - xmin) / D), int((pz - zmin) / D)
        z += step
        if not (0 <= i < nx and 0 <= j < nz) or bare[i, j]:
            continue
        a, cl, td, sl = alt[i, j], clump[i, j], town_d[i, j], slope[i, j]
        if a > 0.82:                                  # bare limestone round the top: a little scrub
            kind, p = "maquis", 0.08
        elif td < 55 and sl < 0.35 and a < 0.4:       # olive groves on the gentle ground by the towns
            kind, p = ("olive", 0.55) if rng.random() < 0.85 else ("cypress", 0.4)
        elif a < 0.55:                                # lower slopes: woods of pine and holm oak in clumps
            r = rng.random()
            kind = "pine" if r < 0.4 else "oak" if r < 0.7 else "cypress" if r < 0.76 else "maquis"
            p = 0.15 + 0.75 * cl ** 1.5
        else:                                         # upper slopes: maquis, the odd pine
            kind = "maquis" if rng.random() < 0.85 else "pine"
            p = 0.1 + 0.6 * cl
        if rng.random() > p:
            continue
        # the base sits a little into the ground so slopes show no gap
        plant(kind, Vector((px, -pz, float(H[i, j]) - 0.15)), rng.uniform(*SIZE[kind]))
        counts[kind] = counts.get(kind, 0) + 1
    x += step

# join every plant into one object (the linked copies become real geometry)
bpy.ops.object.select_all(action="DESELECT")
for o in placed:
    o.select_set(True)
bpy.context.view_layer.objects.active = placed[0]
bpy.ops.object.make_single_user(object=True, obdata=True)
bpy.ops.object.join()
joined = bpy.context.view_layer.objects.active
joined.name = "shell"
bpy.ops.object.select_all(action="DESELECT")
joined.select_set(True)
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("FLORA", NAME, counts, len(joined.data.polygons), "faces")
