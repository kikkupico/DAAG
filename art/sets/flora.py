"""Trees and shrubs for a bare island model: a parametric set for the island and the previs.

    blender -b -P art/sets/flora.py -- <set name>        # e.g. flora

The terrain plates are drawn bare, so Meshy reads the land's true shape; this plants it. It
reads the set's `flora` entry in art/sets/sets.json and writes art/sets/<name>.glb in explorer
coords (origin at the world's origin), which art/sets/bake.py joins without levelling ground.

Planting follows the setting: olive groves on the gentle ground round each town, maritime pine,
holm oak and cypress on the lower spurs, maquis thickening upslope, and bare limestone round the
crown. Nothing grows in the sea, on cliffs too steep to hold soil, within `road_clear` metres of
the road (`road_loop`, waypoints traced from a top view, plus each town's traced road), on the
quays (flat ground near the water), on any building's ground (`avoid_sets`' strips), or within
`crown.r` of the summit. Plants clump, by a smoothed random field, as scrub and woods do.
"""
import bpy, bmesh, json, math, random, sys
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


def material(name, rgb, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


MATS = {"trunk": material("bark", (0.24, 0.18, 0.12)), "pine": material("pine-needles", (0.13, 0.2, 0.1)),
        "oak": material("holm-oak-leaves", (0.15, 0.21, 0.11)), "olive": material("olive-leaves", (0.36, 0.41, 0.3)),
        "cypress": material("cypress", (0.09, 0.15, 0.08)), "maquis": material("maquis", (0.26, 0.29, 0.16)),
        "maquis2": material("maquis-dry", (0.36, 0.34, 0.2))}
ORDER = list(MATS)
bm = bmesh.new()


def blob(c, size, mat, sub=1, jitter=0.12):
    M = Matrix.Translation(c) @ Matrix.Rotation(rng.uniform(0, 6.3), 4, "Z") @ Matrix.Diagonal((*size, 1))
    vs = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=0.5, matrix=Matrix())["verts"]
    for v in vs:
        v.co = M @ (v.co * (1 + rng.uniform(-jitter, jitter)))
    k = ORDER.index(mat)
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = k


def trunk(c, h, r, lean=0.0):
    M = (Matrix.Translation(c) @ Matrix.Rotation(rng.uniform(0, 6.3), 4, "Z") @ Matrix.Rotation(lean, 4, "X")
         @ Matrix.Translation((0, 0, h / 2)))
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=r, radius2=r * 0.7, depth=h, matrix=M)
    k = ORDER.index("trunk")
    for f in {f for v in g["verts"] for f in v.link_faces}:
        f.material_index = k


def plant(kind, c, s):
    """One plant of `kind` standing at c (blender coords), scaled by s."""
    if kind == "pine":                       # maritime pine: tall bare trunk, a spread umbrella crown
        h = 6.5 * s
        trunk(c, h, 0.2 * s, rng.uniform(-0.15, 0.15))
        for _ in range(3):
            blob(c + Vector((rng.uniform(-1, 1) * s, rng.uniform(-1, 1) * s, h + rng.uniform(-0.3, 0.4) * s)),
                 (3.2 * s, 3.0 * s, 1.3 * s), "pine")
    elif kind == "oak":                      # holm oak: short trunk, a dense round crown
        trunk(c, 1.6 * s, 0.22 * s)
        for _ in range(3):
            blob(c + Vector((rng.uniform(-1, 1) * s, rng.uniform(-1, 1) * s, (2.6 + rng.uniform(0, 1)) * s)),
                 (3.0 * s, 2.8 * s, 2.4 * s), "oak")
    elif kind == "olive":                    # olive: gnarled low trunk, a loose silvery crown
        trunk(c, 1.2 * s, 0.2 * s, rng.uniform(-0.25, 0.25))
        for _ in range(2):
            blob(c + Vector((rng.uniform(-0.6, 0.6) * s, rng.uniform(-0.6, 0.6) * s, 2.0 * s)),
                 (2.6 * s, 2.4 * s, 1.7 * s), "olive", jitter=0.2)
    elif kind == "cypress":                  # cypress: a tall dark flame
        trunk(c, 0.8 * s, 0.15 * s)
        blob(c + Vector((0, 0, 4.2 * s)), (1.4 * s, 1.4 * s, 8.0 * s), "cypress", jitter=0.06)
    else:                                    # maquis: low rounded shrubs
        blob(c + Vector((0, 0, 0.45 * s)), (1.6 * s, 1.4 * s, 1.0 * s), rng.choice(["maquis", "maquis", "maquis2"]),
             sub=1, jitter=0.2)


counts = {}
step = F.get("step", 2.6)
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
        plant(kind, Vector((px, -pz, float(H[i, j]) - 0.15)), rng.uniform(0.75, 1.2))
        counts[kind] = counts.get(kind, 0) + 1
    x += step

me = bpy.data.meshes.new("shell")
bm.to_mesh(me)
for k in ORDER:
    me.materials.append(MATS[k])
o = bpy.data.objects.new("shell", me)
bpy.context.scene.collection.objects.link(o)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("FLORA", NAME, counts, len(me.polygons), "faces")
