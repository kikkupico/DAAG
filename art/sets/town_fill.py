"""Plan a port town on bare terrain, for art/sets/town.py.

    blender -b -P art/sets/town_fill.py -- <set name>        # e.g. town3

For an island model with no buildings of its own (a terrain plate's Meshy conversion), this
packs a town onto the flat ground round a harbour. It reads the set's `fill` entry in
art/sets/sets.json:
- `region`: [xmin, xmax, zmin, zmax] in explorer coords, the ground the town may use;
- `harbour`: explorer [x, z] in the harbour's water; the town grows outwards from it;
- `count`: how many buildings at most;
- `keep_clear`: sets whose strips (their `-strips.json`) no building may touch, e.g. the
  trading house;
- `plan`: where to write the plan.

It casts rays down on the island's untouched Meshy model (art/islands.json `source`), placed
as the explorer places it. The road near the harbour is given as waypoints (`road`, explorer
[x, z], traced from a top view: neither its colour nor its shape tells it from a terrace), and
no building comes within `road_clear` metres of it; flat ground is filled first. A building
may stand where every cell of its footprint is land,
the ground under it varies by no more than `rise` metres (a terrace pad; the bake levels it),
it keeps `shore` metres from the water (quays stay open), and it keeps `gap` metres from every
other building. Buildings are tried on terrace first, nearest the harbour, then on open ground within
`reach` metres of the harbour, each turned to the contour of
the slope it stands on (or to face the harbour on flat ground), first up to `courts` courtyard houses and `halls` storehouses, then
houses (`count` in all) in the gaps, so the town is compact and its streets run along the
terraces. The plan has the same form as art/sets/town_plan.py's.
"""
import bpy, json, math, random, sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITES = json.load(open("art/sets/sets.json"))
SITE = SITES[NAME]
F = SITE["fill"]
I = json.load(open("art/islands.json"))[SITE["island"]]
D = 0.5
RISE, SHORE, GAP = F.get("rise", 1.2), F.get("shore", 5.0), F.get("gap", 1.4)
REACH = F.get("reach", 40.0)
xmin, xmax, zmin, zmax = F["region"]
hx_, hz_ = F["harbour"]
rng = random.Random(F.get("seed", 7))

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
M = island.matrix_world
Mi = M.inverted()
down = (Mi.to_3x3() @ Vector((0, 0, -1))).normalized()

nx, nz = int((xmax - xmin) / D), int((zmax - zmin) / D)
H = np.full((nx, nz), -1.0)
for i in range(nx):
    for j in range(nz):
        loc, *_ = bvh.ray_cast(Mi @ Vector((xmin + (i + .5) * D, -(zmin + (j + .5) * D), 500)), down)
        if loc:
            H[i, j] = (M @ loc).z
X = xmin + (np.arange(nx) + .5) * D
Z = zmin + (np.arange(nz) + .5) * D
XX, ZZ = np.meshgrid(X, Z, indexing="ij")

# distance from the water, in cells, by repeated dilation (up to the shore margin)
sea = H < 0.3
near = sea.copy()
for _ in range(int(SHORE / D)):
    g = near.copy()
    g[1:, :] |= near[:-1, :]; g[:-1, :] |= near[1:, :]
    g[:, 1:] |= near[:, :-1]; g[:, :-1] |= near[:, 1:]
    near = g



def flat(w, tol):
    """Cells whose w-by-w neighbourhood varies in height by less than tol metres."""
    Pw = np.pad(np.where(sea, -50, H), w // 2, mode="edge")
    win = np.lib.stride_tricks.sliding_window_view(Pw, (w, w))
    return (win.max(axis=(2, 3)) - win.min(axis=(2, 3))) < tol


# The road, traced by hand as waypoints: no building within `road_clear` metres of its line.
road = np.zeros_like(sea)
pts = F.get("road", [])
for (ax, az), (bx, bz) in zip(pts, pts[1:]):
    vx, vz = bx - ax, bz - az
    L2 = vx * vx + vz * vz or 1e-9
    tt = np.clip(((XX - ax) * vx + (ZZ - az) * vz) / L2, 0, 1)
    road |= np.hypot(XX - (ax + tt * vx), ZZ - (az + tt * vz)) < F.get("road_clear", 3.2)
terrace = (~sea) & ~road & flat(7, 0.35)

# the slope's direction, from a smoothed height field, to turn each building to the contours
Hs = np.where(sea, 0, H)
k = 9
P = np.pad(Hs, k // 2, mode="edge")
Hsm = np.lib.stride_tricks.sliding_window_view(P, (k, k)).mean(axis=(2, 3))
gx, gz = np.gradient(Hsm, D)


def cells(at, half, rot, grow=0.0):
    """Mask of the cells inside the rotated rectangle (explorer frame), grown by `grow` m."""
    r = math.radians(rot)
    dx, dz = XX - at[0], ZZ - at[1]
    u = dx * math.cos(r) + dz * math.sin(r)
    v = -dx * math.sin(r) + dz * math.cos(r)
    return (np.abs(u) <= half[0] + grow) & (np.abs(v) <= half[1] + grow)


taken = road.copy()
for other in F.get("keep_clear", []):
    for st in json.load(open(f"art/sets/{other}-strips.json"))["strips"]:
        taken |= cells(st["at"], st["half"], st["rot"], grow=1.5)

KINDS = {"house": [(2.4, 2.0), (2.8, 2.2), (3.2, 2.4), (3.6, 2.7)],
         "court": [(3.6, 3.6), (4.2, 3.6)],
         "hall": [(5.5, 2.6), (6.5, 2.8)]}
# a bigger footprint on the same slope spans more height; its terrace wall is taller
RISE_BY = {"house": 1.0, "court": 1.5, "hall": 1.3}

dist2 = (XX - hx_) ** 2 + (ZZ - hz_) ** 2
order = np.argsort((dist2 + np.where(terrace, 0.0, 1e6) + np.where(dist2 > REACH ** 2, 1e9, 0.0)).ravel())
plan = []


def place(kinds, quota):
    """Walk the ground from the harbour outwards, placing up to `quota` buildings of `kinds`."""
    global taken
    placed = 0
    for idx in order[::2]:
        if dist2.ravel()[idx] > REACH ** 2 or placed >= quota or len(plan) >= F["count"]:
            break
        i, j = np.unravel_index(idx, H.shape)
        if sea[i, j] or near[i, j] or taken[i, j]:
            continue
        at = [float(X[i]), float(Z[j])]
        if abs(gx[i, j]) + abs(gz[i, j]) > 0.05:
            rot = math.degrees(math.atan2(gz[i, j], gx[i, j])) + 90.0      # long side along the contour
        else:
            rot = math.degrees(math.atan2(hz_ - at[1], hx_ - at[0])) + 90.0
        ks = list(kinds)
        rng.shuffle(ks)
        for kind in ks:
            half = list(rng.choice(KINDS[kind]))
            m = cells(at, half, rot)
            if not m.any() or (m & (sea | near | taken)).any():
                continue
            h = H[m]
            if h.max() - h.min() > RISE * RISE_BY[kind]:
                continue
            # stand at the uphill side's ground, so the terrace wall faces downhill and no cut shows
            plan.append({"at": [round(at[0], 2), round(at[1], 2)], "half": half, "rot": round(rot % 180, 1),
                         "ground": round(float(np.percentile(h, 75)), 2), "kind": kind})
            taken |= cells(at, half, rot, grow=GAP)
            placed += 1
            break


# the big buildings first, where the ground allows, then houses in the gaps between them
place(["court"], F.get("courts", 4))
place(["hall"], F.get("halls", 2))
place(["house"], F["count"])

np.savez(F["plan"].replace(".json", "-masks.npz"), H=H, pale=near, road=road, terrace=terrace, region=np.array(F["region"]))
json.dump({"_note": f"Written by art/sets/town_fill.py for {NAME}; explorer [x, z], metres.",
           "buildings": plan}, open(F["plan"], "w"), indent=1)
print("FILL", NAME, len(plan), "buildings:", {k: sum(b["kind"] == k for b in plan) for k in KINDS})
