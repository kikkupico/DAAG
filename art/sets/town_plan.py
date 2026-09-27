"""Plan a port town from the island model's own buildings, for art/sets/town.py.

    blender -b -P art/sets/town_plan.py -- <set name>        # e.g. town3

Reads the set's `town` entry in art/sets/sets.json:
- `region`: [xmin, xmax, zmin, zmax] in explorer coords, the part of the island to replan;
- `exclude`: explorer [x, z] points; a building found over any of them is left out (the
  trading house that replaces it, trees, the quay's own edge);
- `extra`: buildings given by hand, {at, half, rot, kind}, for places where Meshy merged
  several into one blob; a found building over any extra's centre is dropped in its favour;
- `plan`: where to write the plan.

It casts rays down on the untouched Meshy model (the set's `bake.source`), placed as the
explorer places it, and takes as a building every patch that stands well above the ground
round it. Each patch gets the smallest rectangle that holds it, the ground height from a high
point of the ring just outside it (so on a slope the building stands at its uphill ground), and a kind: `hall` if long and narrow, `court` if broad, and
`house` otherwise.
"""
import bpy, json, math, sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
T = SITE["town"]
ISLANDS = {"arche": (95.0, (-130.0, 0.0), 20.0), "paxos": (104.0, (130.0, 36.0), -90.0)}
SCALE, (X0, Z0), YAW = ISLANDS[SITE["island"]]
D = 0.5
xmin, xmax, zmin, zmax = T["region"]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SITE["bake"]["source"])
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zb = min(v.z for v in bb)
t = math.radians(YAW)
island.scale = (SCALE,) * 3
island.rotation_mode = "XYZ"
island.rotation_euler = (0, 0, t)
island.location = (X0 - (SCALE * cx * math.cos(t) - SCALE * cy * math.sin(t)),
                   -Z0 - (SCALE * cx * math.sin(t) + SCALE * cy * math.cos(t)), -SCALE * zb)
bpy.context.view_layer.update()
bvh = BVHTree.FromObject(island, bpy.context.evaluated_depsgraph_get())
M = island.matrix_world
Mi = M.inverted()
down = (Mi.to_3x3() @ Vector((0, 0, -1))).normalized()

nx, nz = int((xmax - xmin) / D), int((zmax - zmin) / D)
H = np.full((nx, nz), -1.0)
for i in range(nx):
    for j in range(nz):
        loc, *_ = bvh.ray_cast(Mi @ Vector((xmin + (i + .5) * D, -(zmin + (j + .5) * D), 300)), down)
        if loc:
            H[i, j] = (M @ loc).z


def window(A, k, f):
    """A k-by-k sliding min or max, with edge padding."""
    p = k // 2
    P = np.pad(A, p, mode="edge")
    return f(np.lib.stride_tricks.sliding_window_view(P, (k, k)), axis=(2, 3))


sea = H < 0.3
ground = window(np.where(window(np.where(sea, 1e3, H), 25, np.min) >= 999, -1e3,
                         window(np.where(sea, 1e3, H), 25, np.min)), 25, np.max)
bld = (~sea) & ((H - ground) > 1.6)

seen = np.zeros_like(bld)
found = []
for i in range(nx):
    for j in range(nz):
        if not bld[i, j] or seen[i, j]:
            continue
        stack, pts = [(i, j)], []
        seen[i, j] = True
        while stack:
            a, b = stack.pop()
            pts.append((a, b))
            for u, v in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                if 0 <= u < nx and 0 <= v < nz and bld[u, v] and not seen[u, v]:
                    seen[u, v] = True
                    stack.append((u, v))
        if len(pts) < 30:
            continue
        ii = np.array([p[0] for p in pts]); jj = np.array([p[1] for p in pts])
        xy = np.stack([xmin + (ii + .5) * D, zmin + (jj + .5) * D], 1)
        best = None
        for a in np.radians(np.arange(0, 90, 1.0)):
            R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
            q = xy @ R
            lo, hi = q.min(0), q.max(0)
            if best is None or np.prod(hi - lo) < best[0]:
                best = (np.prod(hi - lo), a, lo, hi, R)
        _, a, lo, hi, R = best
        c = ((lo + hi) / 2) @ R.T
        found.append({"at": [round(float(c[0]), 2), round(float(c[1]), 2)],
                      "half": [round(float(hi[0] - lo[0]) / 2, 2), round(float(hi[1] - lo[1]) / 2, 2)],
                      "rot": round(float(np.degrees(a)), 1)})


def contains(b, p):
    (cx_, cz_), (hx, hz), r = b["at"], b["half"], math.radians(b["rot"])
    dx, dz = p[0] - cx_, p[1] - cz_
    u = dx * math.cos(r) + dz * math.sin(r)
    v = -dx * math.sin(r) + dz * math.cos(r)
    return abs(u) <= hx + 0.5 and abs(v) <= hz + 0.5


extra = T.get("extra", [])
keep = [b for b in found
        if not any(contains(b, p) for p in T.get("exclude", []))
        and not any(contains(b, e["at"]) for e in extra)]


def ground_at(b):
    """A low point of the ground in a ring just outside the footprint (sea left out)."""
    (cx_, cz_), (hx, hz), r = b["at"], b["half"], math.radians(b["rot"])
    vals = []
    for k in range(64):
        ang = 2 * math.pi * k / 64
        for m in (1.0, 2.0):
            u, v = (hx + m) * math.cos(ang), (hz + m) * math.sin(ang)
            x = cx_ + u * math.cos(r) - v * math.sin(r)
            z = cz_ + u * math.sin(r) + v * math.cos(r)
            i, j = int((x - xmin) / D), int((z - zmin) / D)
            if 0 <= i < nx and 0 <= j < nz and not sea[i, j] and not bld[i, j]:
                vals.append(H[i, j])
    # a high point, so a building on a slope stands at its uphill ground and no cut face shows
    # above it; its plinth reaches down to the ground on the downhill side
    return round(float(np.percentile(vals, 65)), 2) if vals else 0.0


plan = []
for b in keep + extra:
    hx, hz = b["half"]
    long_, short = max(hx, hz), min(hx, hz)
    kind = b.get("kind") or ("hall" if long_ > 4.5 and long_ / short > 2.0 else
                             "court" if short >= 3.2 and long_ >= 3.8 else "house")
    plan.append({**b, "ground": b.get("ground", ground_at(b)), "kind": kind})
json.dump({"_note": f"Written by art/sets/town_plan.py for {NAME}; explorer [x, z], metres.",
           "buildings": plan}, open(T["plan"], "w"), indent=1)
print("PLAN", NAME, len(found), "found,", len(plan), "planned")
for b in plan:
    print("  ", b)
