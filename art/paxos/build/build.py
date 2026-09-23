"""Build Paxos in layers: terrain, road, the Chamber, houses, trees, harbour.

    blender -b -P art/paxos/build/build.py -- art/paxos/build/sample art/paxos-built

Reads <sample>-layout.npz / -layout.json (from analyse.py). Writes <out>.glb and <out>.blend.
Units are metres. Compass: North = -X, East = +Y (the harbour side), West = -Y (the cliffs).
Repeated objects are linked duplicates parented to one empty per kind, exported with
EXT_mesh_gpu_instancing.
"""
import bpy, bmesh, sys, os, json, math, random
import numpy as np
from mathutils import Vector, Matrix

IN, OUT = os.path.abspath(sys.argv[-2]), os.path.abspath(sys.argv[-1])
L = np.load(IN + "-layout.npz")
J = json.load(open(IN + "-layout.json"))
random.seed(7)
rng = np.random.default_rng(7)

MPC = J["m_per_cell"]
ground = L["ground"].astype(np.float64)
land = L["land"]; woods = L["woods"]; fields = L["fields"]; town = L["town"]
# the Meshy model's oversized plaza round its rotunda becomes olive groves
_cx, _cy = J["chamber_px"]
_yy, _xx = np.mgrid[0:land.shape[0], 0:land.shape[1]]
fields = fields | ((np.abs(_xx - _cx) < 115) & (np.abs(_yy - _cy) < 105) & land & ~woods & ~town)
H, W = ground.shape
STEP = 2                                  # terrain mesh every 2 cells (~6 m)
SEABED = -25.0

def to_world(px, py):
    return ((px - W / 2) * MPC, -(py - H / 2) * MPC)

def to_px(x, y):
    return (x / MPC + W / 2, -y / MPC + H / 2)

# --- the road centreline in metres, resampled every 6 m -------------------------------
road = np.array([to_world(x, y) for x, y in J["road_px"]])
seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(road, axis=0), axis=1))]
s_new = np.arange(0, seg[-1], 6.0)
road = np.c_[np.interp(s_new, seg, road[:, 0]), np.interp(s_new, seg, road[:, 1])]

# --- the Chamber's terrace: beside the road, on the western (cliff) side ---------------
CH_R = 24.0                               # crepidoma radius
TER = 55.0                                # terrace half-width
cpx, cpy = J["chamber_px"]
cxw, _ = to_world(cpx, cpy)
i = int(np.argmin(np.abs(road[:, 0] - cxw)))
rx, ry = road[i]
chamber = Vector((rx, ry - 6.0 - TER, 0))
# flatten the ground under the terrace, blending over 25 m
gx0, gy0 = to_px(chamber.x, chamber.y)
yy, xx = np.mgrid[0:H, 0:W]
dx = np.abs((xx - gx0) * MPC); dy = np.abs((yy - gy0) * MPC)
d = np.maximum(dx, dy)
core = (d <= TER) & land
t_h = float(np.median(ground[core]))
blend = np.clip((d - TER) / 25.0, 0, 1)
ground = np.where(land & (d < TER + 25), t_h * (1 - blend) + ground * blend, ground)
chamber.z = t_h

# --- height lookup on the terrain mesh grid ---------------------------------------------
G = ground[::STEP, ::STEP]
LAND = land[::STEP, ::STEP]
Hs, Ws = G.shape
zgrid = np.where(LAND, G, np.nan)
def height(x, y):
    px, py = to_px(x, y)
    gx, gy = px / STEP, py / STEP
    x0, y0 = int(math.floor(gx)), int(math.floor(gy))
    if not (0 <= x0 < Ws - 1 and 0 <= y0 < Hs - 1): return None
    q = zgrid[y0:y0 + 2, x0:x0 + 2]
    if np.isnan(q).any():
        v = q[~np.isnan(q)]
        return float(v.mean()) if len(v) else None
    fx, fy = gx - x0, gy - y0
    return float(q[0, 0] * (1 - fx) * (1 - fy) + q[0, 1] * fx * (1 - fy)
                 + q[1, 0] * (1 - fx) * fy + q[1, 1] * fx * fy)

def is_class(mask, x, y):
    px, py = to_px(x, y)
    px, py = int(px), int(py)
    return 0 <= px < W and 0 <= py < H and bool(mask[py, px])

# --- scene & materials -------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def mat(name, rgb, rough=0.9, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    return m
M = {k: mat(k, *v) for k, v in {
    "grass": ((0.30, 0.36, 0.16),), "dry_grass": ((0.56, 0.49, 0.27),),
    "scrub_ground": ((0.25, 0.27, 0.14),), "rock": ((0.86, 0.80, 0.68),),
    "paving": ((0.78, 0.75, 0.68),), "road": ((0.70, 0.65, 0.56),),
    "earth": ((0.58, 0.50, 0.40),), "seabed": ((0.20, 0.33, 0.34),),
    "limestone": ((0.88, 0.86, 0.80), 0.8), "marble": ((0.93, 0.92, 0.89), 0.5),
    "terracotta": ((0.60, 0.26, 0.14), 0.8), "olive": ((0.36, 0.43, 0.29),),
    "oak": ((0.17, 0.26, 0.11),), "cypress": ((0.09, 0.18, 0.07),),
    "trunk": ((0.28, 0.22, 0.16),), "wood": ((0.40, 0.27, 0.15), 0.8),
    "bronze": ((0.55, 0.38, 0.18), 0.35, 1.0), "leather": ((0.30, 0.17, 0.09), 0.7),
    "sail": ((0.85, 0.80, 0.68),), "sea": ((0.03, 0.18, 0.30), 0.15)}.items()}

def new_obj(name, me, coll=None):
    ob = bpy.data.objects.new(name, me)
    (coll or sc.collection).objects.link(ob)
    return ob

# --- terrain ------------------------------------------------------------------------------
border = ~LAND & np.pad(LAND, 1)[:-2, 1:-1] | ~LAND & np.pad(LAND, 1)[2:, 1:-1] \
         | ~LAND & np.pad(LAND, 1)[1:-1, :-2] | ~LAND & np.pad(LAND, 1)[1:-1, 2:]
border &= ~LAND
use = LAND | border
Z = np.where(LAND, G, SEABED)
idx = -np.ones((Hs, Ws), np.int64)
ys, xs = np.nonzero(use)
idx[ys, xs] = np.arange(len(xs))
verts = np.c_[(xs * STEP - W / 2) * MPC, -(ys * STEP - H / 2) * MPC, Z[ys, xs]]
a = idx[:-1, :-1]; b = idx[:-1, 1:]; c = idx[1:, 1:]; dd = idx[1:, :-1]
ok = (a >= 0) & (b >= 0) & (c >= 0) & (dd >= 0)
faces = np.c_[a[ok], dd[ok], c[ok], b[ok]]          # counter-clockwise seen from above
me = bpy.data.meshes.new("terrain")
me.from_pydata(verts.tolist(), [], faces.tolist())
me.update()
# per-face material by surface class and slope
cls_names = ["grass", "dry_grass", "scrub_ground", "rock", "earth", "seabed", "paving"]
for n in cls_names: me.materials.append(M[n])
fy, fx = np.nonzero(ok)
centre_px = np.c_[(fx + 0.5) * STEP, (fy + 0.5) * STEP].astype(int)
cx_, cy_ = np.clip(centre_px[:, 0], 0, W - 1), np.clip(centre_px[:, 1], 0, H - 1)
normals = np.zeros(len(me.polygons) * 3); me.polygons.foreach_get("normal", normals)
nz = normals.reshape(-1, 3)[:, 2]
zc = verts[faces].reshape(-1, 4, 3)[:, :, 2].mean(1)
mi = np.zeros(len(faces), np.int64)                                  # grass
mi[fields[cy_, cx_]] = 1
mi[woods[cy_, cx_]] = 2
mi[town[cy_, cx_]] = 4
sea_ds = ~LAND
near = sea_ds.copy()
for _ in range(2):                                                   # within ~12 m of the sea
    p = np.pad(near, 1)
    near = near | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
shore = near[np.clip(fy, 0, Hs - 1), np.clip(fx, 0, Ws - 1)]
mi[(nz < 0.75) | ((zc < 6) & shore)] = 3                             # cliffs and shore rock
mi[zc < 0] = 5
me.polygons.foreach_set("material_index", mi.astype(np.int32))
terrain = new_obj("terrain", me)

sea_me = bpy.data.meshes.new("sea")
sea_me.from_pydata([(-12000, -12000, 0), (12000, -12000, 0), (12000, 12000, 0), (-12000, 12000, 0)], [], [(0, 1, 2, 3)])
sea_me.materials.append(M["sea"])
sea = new_obj("sea", sea_me)

# --- road: a 5 m paved ribbon -------------------------------------------------------------
def ribbon(name, pts, width, lift, material):
    bm = bmesh.new(); prev = None
    for k, (x, y) in enumerate(pts):
        j0, j1 = max(k - 1, 0), min(k + 1, len(pts) - 1)
        t = Vector((pts[j1][0] - pts[j0][0], pts[j1][1] - pts[j0][1], 0)).normalized()
        nrm = Vector((-t.y, t.x, 0)) * width / 2
        z = height(x, y)
        if z is None: prev = None; continue
        p = Vector((x, y, z + lift))
        pair = (bm.verts.new(p + nrm), bm.verts.new(p - nrm))
        if prev: bm.faces.new((prev[0], prev[1], pair[1], pair[0]))
        prev = pair
    rme = bpy.data.meshes.new(name); bm.to_mesh(rme); bm.free()
    rme.materials.append(material)
    return new_obj(name, rme)
ribbon("road", road.tolist(), 5.0, 0.25, M["road"])

# --- mesh helpers ---------------------------------------------------------------------------
def box(bm, cx, cy, z0, sx, sy, sz, rot=0.0, mat_index=0):
    r = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=r)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot, 3, "Z"), verts=r)
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + sz / 2), verts=r)
    for f in {f for v in r for f in v.link_faces}: f.material_index = mat_index

def cyl(bm, cx, cy, z0, r, h, seg=16, mat_index=0, r2=None):
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                                radius2=r if r2 is None else r2, depth=h)
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + h / 2), verts=res["verts"])
    for f in {f for v in res["verts"] for f in v.link_faces}: f.material_index = mat_index

def finish(name, bm, mats, coll=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m_ in mats: me.materials.append(m_)
    return new_obj(name, me, coll)

# --- the Chamber ------------------------------------------------------------------------------
# Lamport: acoustics that make oratory impossible, legislators and messengers coming and going,
# one ledger per legislator and no shared record; Paxons tell time by the sun.
# Three objects, so the roof and the dome can be hidden for an interior view.
DOORS = 8
cx, cy, cz = chamber
COL_R, COL_H, ENT_H = 21.0, 7.0, 1.2
WALL_R, WALL_T, WALL_H, DOOR_W, DOOR_H = 17.0, 1.2, 10.0, 3.0, 5.0
bm = bmesh.new()
box(bm, cx, cy, cz - 6, 2 * TER, 2 * TER, 6.3, mat_index=0)                   # terrace slab
for k, rr in enumerate((CH_R, CH_R - 1, CH_R - 2)):                          # crepidoma
    cyl(bm, cx, cy, cz + 0.3 + 0.5 * k, rr, 0.5, seg=64, mat_index=1)
base = cz + 1.8
for k in range(32):                                                          # peristyle
    a_ = 2 * math.pi * (k + 0.5) / 32
    cyl(bm, cx + COL_R * math.cos(a_), cy + COL_R * math.sin(a_), base, 0.62, COL_H, seg=12,
        mat_index=1, r2=0.5)
for k in range(64):                                                          # entablature, a ring
    a_ = 2 * math.pi * (k + 0.5) / 64
    box(bm, cx + COL_R * math.cos(a_), cy + COL_R * math.sin(a_), base + COL_H, 1.9,
        2 * math.pi * COL_R / 64 * 1.03, ENT_H, rot=a_, mat_index=1)
door_half = math.asin(DOOR_W / 2 / WALL_R)
pieces = 6
for k in range(DOORS):                                                        # drum with doorways
    a0 = 2 * math.pi * k / DOORS + door_half
    a1 = 2 * math.pi * (k + 1) / DOORS - door_half
    for p in range(pieces):
        aa = a0 + (a1 - a0) * (p + 0.5) / pieces
        arc = (a1 - a0) / pieces * WALL_R * 1.02
        box(bm, cx + WALL_R * math.cos(aa), cy + WALL_R * math.sin(aa), base, WALL_T, arc, WALL_H,
            rot=aa, mat_index=1)
    ad = 2 * math.pi * k / DOORS                                              # lintel over the door
    box(bm, cx + WALL_R * math.cos(ad), cy + WALL_R * math.sin(ad), base + DOOR_H, WALL_T, DOOR_W + 0.4,
        WALL_H - DOOR_H, rot=ad, mat_index=1)
cyl(bm, cx, cy, base - 0.1, WALL_R - 0.6, 0.1, seg=64, mat_index=2)          # interior floor
for k in range(24):                                                           # benches and desks
    a_ = 2 * math.pi * (k + 0.5) / 24
    if min(abs((a_ - 2 * math.pi * j / DOORS + math.pi) % (2 * math.pi) - math.pi) for j in range(DOORS)) < 0.18:
        continue
    bx, by = cx + 14.6 * math.cos(a_), cy + 14.6 * math.sin(a_)
    box(bm, bx, by, base, 0.6, 2.2, 0.45, rot=a_, mat_index=1)
    dx_, dy_ = cx + 13.6 * math.cos(a_), cy + 13.6 * math.sin(a_)
    box(bm, dx_, dy_, base, 0.6, 1.2, 0.75, rot=a_, mat_index=4)
    box(bm, dx_, dy_, base + 0.75, 0.35, 0.5, 0.08, rot=a_, mat_index=5)      # the ledger
for k in range(DOORS):                                                        # messengers' benches
    ad = 2 * math.pi * k / DOORS + 0.22
    box(bm, cx + 15.4 * math.cos(ad), cy + 15.4 * math.sin(ad), base, 0.5, 1.6, 0.45, rot=ad, mat_index=4)
box(bm, cx - 7.5, cy, base, 15.0, 0.18, 0.03, mat_index=3)                    # meridian line, north
for k in range(1, 8):
    box(bm, cx - k * 1.9, cy, base, 0.12, 0.9, 0.03, mat_index=3)
for k in range(DOORS):                                                        # statues by the doorways
    ad = 2 * math.pi * k / DOORS
    sx_, sy_ = cx + 27.5 * math.cos(ad + 0.14), cy + 27.5 * math.sin(ad + 0.14)
    box(bm, sx_, sy_, cz + 0.3, 1.2, 1.2, 2.0, mat_index=1)
    cyl(bm, sx_, sy_, cz + 2.3, 0.35, 2.0, seg=10, mat_index=1, r2=0.28)
    res = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.26)
    bmesh.ops.translate(bm, vec=(sx_, sy_, cz + 4.55), verts=res["verts"])
    for f in {f for v in res["verts"] for f in v.link_faces}: f.material_index = 1
finish("chamber", bm, [M["paving"], M["marble"], M["paving"], M["bronze"], M["wood"], M["leather"]])

bm = bmesh.new()                                                              # colonnade roof
roof_z0 = base + COL_H + ENT_H
res = bmesh.ops.create_cone(bm, cap_ends=False, segments=64, radius1=COL_R + 1.3,
                            radius2=WALL_R + 0.2, depth=WALL_H - COL_H - ENT_H + 0.6)
bmesh.ops.translate(bm, vec=(cx, cy, roof_z0 + (WALL_H - COL_H - ENT_H + 0.6) / 2), verts=res["verts"])
finish("chamber_roof", bm, [M["marble"]])

bm = bmesh.new()                                                              # the dome, lower
R = WALL_R + 0.4
res = bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=R)
bmesh.ops.delete(bm, geom=[v for v in res["verts"] if v.co.z < -0.01 or v.co.z > R * 0.985], context="VERTS")
bmesh.ops.scale(bm, vec=(1, 1, 0.62), verts=bm.verts)
bmesh.ops.translate(bm, vec=(cx, cy, base + WALL_H), verts=bm.verts)
finish("chamber_dome", bm, [M["marble"]])

# --- instancing ------------------------------------------------------------------------------
def kind(name):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e); return e
def place(proto_me, parent, x, y, z, rot=0.0, s=1.0):
    ob = bpy.data.objects.new(proto_me.name, proto_me)
    sc.collection.objects.link(ob)
    ob.parent = parent
    ob.location = (x, y, z); ob.rotation_euler = (0, 0, rot); ob.scale = (s, s, s)
    return ob

def house_mesh(name, sx_, sy_, court_x, court_y, wall_h):
    bm = bmesh.new()
    hx, hy, cxh, cyh = sx_ / 2, sy_ / 2, court_x / 2, court_y / 2
    tx, ty = hx - cxh, hy - cyh
    for bx_, by_, ox, oy in ((sx_, ty, 0, hy - ty / 2), (sx_, ty, 0, -hy + ty / 2),
                             (tx, court_y, hx - tx / 2, 0), (tx, court_y, -hx + tx / 2, 0)):
        box(bm, ox, oy, -3.0, bx_, by_, wall_h + 3.0, mat_index=0)
        box(bm, ox, oy, wall_h, bx_ * 1.04, by_ * 1.04, 0.9, mat_index=1)    # tiled roof
    return finish(name, bm, [M["limestone"], M["terracotta"]]).data

def hall_mesh(name, length, depth, wall_h, colonnade=False):
    """A long building: a warehouse, or a stoa with a colonnade along its front (+Y side)."""
    bm = bmesh.new()
    back = depth * (0.55 if colonnade else 1.0)
    box(bm, 0, -depth / 2 + back / 2, -3.0, length, back, wall_h + 3.0, mat_index=0)
    if colonnade:
        n = int(length // 4)
        for k in range(n + 1):
            cyl(bm, -length / 2 + k * length / n, depth / 2 - 0.6, 0, 0.35, wall_h, seg=8, mat_index=0)
    box(bm, 0, 0, wall_h, length * 1.02, depth * 1.05, 1.0, mat_index=1)
    return finish(name, bm, [M["limestone"], M["terracotta"]]).data

def tree_mesh(name, trunk_h, crown_r, crown_h, crown_mat, taper=False):
    bm = bmesh.new()
    cyl(bm, 0, 0, -0.5, 0.25, trunk_h + 0.5, seg=6, mat_index=0)
    if taper:
        cyl(bm, 0, 0, trunk_h * 0.5, crown_r, crown_h, seg=8, mat_index=1, r2=0.15)
    else:
        res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        bmesh.ops.scale(bm, vec=(crown_r, crown_r, crown_h / 2), verts=res["verts"])
        bmesh.ops.translate(bm, vec=(0, 0, trunk_h + crown_h / 2 * 0.8), verts=res["verts"])
        for f in {f for v in res["verts"] for f in v.link_faces}: f.material_index = 1
    return finish(name, bm, [M["trunk"], crown_mat]).data

def cleanup_proto(me):
    for ob in [o for o in bpy.data.objects if o.data == me and o.parent is None]:
        bpy.data.objects.remove(ob)

house_protos = [house_mesh(f"house_{a}x{b}", a, b, a * 0.38, b * 0.38, 4.0)
                for a, b in ((11, 11), (13, 13), (15, 15), (17, 17), (12, 18), (14, 21))]
farm_proto = house_mesh("farmstead", 20, 20, 8, 8, 4.5)
warehouse = hall_mesh("warehouse", 28, 10, 6.0)
stoa = hall_mesh("stoa", 70, 12, 6.5, colonnade=True)
stall = hall_mesh("stall", 4, 3, 2.2)
olive = tree_mesh("olive", 1.6, 2.6, 3.4, M["olive"])
oak = tree_mesh("oak", 1.8, 3.6, 5.0, M["oak"])
cypress = tree_mesh("cypress", 1.0, 1.3, 11.0, M["cypress"], taper=True)
for me_ in house_protos + [farm_proto, olive, oak, cypress, warehouse, stoa, stall]: cleanup_proto(me_)

def slope_ok(x, y, lim=0.28):
    z0 = height(x, y); zx = height(x + 4, y); zy = height(x, y + 4)
    if None in (z0, zx, zy): return False
    return abs(zx - z0) / 4 < lim and abs(zy - z0) / 4 < lim

def near_road(x, y, dist):
    return np.min(np.hypot(road[:, 0] - x, road[:, 1] - y)) < dist

def near_chamber(x, y, dist):
    return max(abs(x - chamber.x), abs(y - chamber.y)) < dist

# --- the town: irregular blocks on a grid, a market square, a waterfront ---------------------
# distance to the sea in cells (3 m), for the waterfront strip
sea_full = ~land
dist = np.where(sea_full, 0, 99).astype(np.int32)
frontier = sea_full.copy()
for k in range(1, 12):
    p = np.pad(frontier, 1)
    grow = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & (dist == 99)
    dist[grow] = k
    frontier = frontier | grow
def sea_dist_m(x, y):
    px, py = to_px(x, y); px, py = int(px), int(py)
    if not (0 <= px < W and 0 <= py < H): return 0
    return dist[py, px] * MPC

houses, civic = kind("houses"), kind("civic")
ys_, xs_ = np.nonzero(town & land)
tx0, tx1 = to_world(xs_.min(), 0)[0], to_world(xs_.max(), 0)[0]
ty1, ty0 = to_world(0, ys_.min())[1], to_world(0, ys_.max())[1]
LOT = 19.0
def streets(lo, hi, lots_lo, lots_hi):
    """Street positions: blocks of a random number of lots, a 7 m street between."""
    cuts, p = [], lo
    while p < hi:
        p += rng.integers(lots_lo, lots_hi + 1) * LOT
        cuts.append(p); p += 7.0
    return cuts
xs_st, ys_st = streets(tx0, tx1, 3, 6), streets(ty0, ty1, 2, 4)
def lot_centres(lo, hi, cuts):
    out, p = [], lo
    for c in cuts + [hi]:
        n = int((c - p) // LOT)
        out += [p + LOT * (i + 0.5) for i in range(n)]
        p = c + 7.0
    return out
# the agora: the most level open ground near the middle of the town, 80 x 55 m
tc = np.array([np.mean([to_world(x, 0)[0] for x in (xs_.min(), xs_.max())]),
               np.mean([to_world(0, y)[1] for y in (ys_.min(), ys_.max())])])
best = None
for ax in np.arange(tc[0] - 200, tc[0] + 200, 20):
    for ay in np.arange(tc[1] - 150, tc[1] + 150, 20):
        pts = [(ax + dx_, ay + dy_) for dx_ in (-40, 0, 40) for dy_ in (-27, 0, 27)]
        zs = [height(*p_) for p_ in pts]
        if None in zs or not all(is_class(town, *p_) for p_ in pts): continue
        if min(sea_dist_m(*p_) for p_ in pts) < 30 or near_road(ax, ay, 45): continue
        score = max(zs) - min(zs) + 0.02 * math.hypot(ax - tc[0], ay - tc[1])
        if best is None or score < best[0]: best = (score, ax, ay)
agora = None
if best:
    _, ax, ay = best
    zs_ = [height(ax + dx_, ay + dy_) for dx_ in np.linspace(-40, 40, 9) for dy_ in np.linspace(-27, 27, 7)]
    az, az_lo = max(zs_), min(zs_)                                          # cut into the slope
    agora = (ax, ay, az)
    bm = bmesh.new()
    box(bm, ax, ay, az_lo - 3, 80, 55, az - az_lo + 3.2, mat_index=0)
    finish("agora", bm, [M["paving"]])
    place(stoa, civic, ax, ay - 27.5 + 6.5, az + 0.2)
    for k in range(10):
        place(stall, civic, ax + rng.uniform(-30, 30), ay + rng.uniform(-8, 20), az + 0.2,
              rot=random.choice((0, math.pi / 2)))
def in_agora(x, y, m=4):
    return agora is not None and abs(x - agora[0]) < 40 + m and abs(y - agora[1]) < 27.5 + m
n_houses = 0
for gx in lot_centres(tx0, tx1, xs_st):
    for gy in lot_centres(ty0, ty1, ys_st):
        if rng.random() < 0.1: continue                                         # empty plots
        x, y = gx + rng.uniform(-1, 1), gy + rng.uniform(-1, 1)
        if not is_class(town, x, y) or near_road(x, y, 10) or in_agora(x, y, 10): continue
        if sea_dist_m(x, y) < 24 or not slope_ok(x, y, 0.35): continue
        z = height(x, y)
        if z is None or z < 3: continue
        ob = place(random.choice(house_protos), houses, x, y, z, rot=random.choice((0, math.pi / 2)))
        ob.scale = (1, 1, rng.uniform(0.85, 1.3))
        n_houses += 1
# warehouses along the town's waterfront, long side to the water
coast = town & land & (dist == 1)
cy_c, cx_c = np.nonzero(coast)
taken = []
for k in rng.permutation(len(cx_c)):
    x, y = to_world(cx_c[k], cy_c[k])
    if any(math.hypot(x - a, y - b) < 42 for a, b in taken): continue
    win = sea_full[max(cy_c[k] - 4, 0):cy_c[k] + 5, max(cx_c[k] - 4, 0):cx_c[k] + 5]
    oy_, ox_ = np.nonzero(win)
    if not len(ox_): continue
    n = np.array([ox_.mean() - 4, -(oy_.mean() - 4)])                          # towards the sea
    if np.linalg.norm(n) < 1e-3: continue
    n = n / np.linalg.norm(n)
    wx, wy = x - n[0] * 16, y - n[1] * 16
    z = height(wx, wy)
    if z is None or z < 1 or not slope_ok(wx, wy, 0.4): continue
    place(warehouse, civic, wx, wy, z, rot=math.atan2(n[1], n[0]) - math.pi / 2)
    taken.append((x, y))

farm_px = J["farms_px"] + [[935, 250], [1300, 335], [1330, 372], [1080, 345]]
farms = kind("farmsteads")
for px, py in farm_px:
    x, y = to_world(px, py)
    z = height(x, y)
    if z is not None:
        place(farm_proto, farms, x, y, z, rot=random.uniform(-0.3, 0.3))

# --- trees ----------------------------------------------------------------------------------
olives, oaks, cypresses = kind("olives"), kind("oaks"), kind("cypresses")
counts = {"olive": 0, "oak": 0, "cypress": 0}
xmin, xmax = to_world(0, 0)[0], to_world(W, 0)[0]
ymin, ymax = to_world(0, H)[1], to_world(0, 0)[1]
ROW = 11.0                                   # olive rows run along the island
for gx in np.arange(xmin, xmax, 9.0):
    for gy in np.arange(ymin, ymax, ROW):
        x, y = gx + rng.uniform(-1.2, 1.2), gy + rng.uniform(-0.6, 0.6)
        if not is_class(fields, x, y) or is_class(town, x, y): continue
        if near_road(x, y, 6) or near_chamber(x, y, TER + 4) or not slope_ok(x, y): continue
        z = height(x, y)
        if z is None or z < 4: continue
        place(olive, olives, x, y, z, rot=rng.uniform(0, 6.28), s=rng.uniform(0.8, 1.15))
        counts["olive"] += 1
for gx in np.arange(xmin, xmax, 10.0):
    for gy in np.arange(ymin, ymax, 10.0):
        x, y = gx + rng.uniform(-4, 4), gy + rng.uniform(-4, 4)
        if not is_class(woods, x, y) or is_class(town, x, y): continue
        if near_road(x, y, 6) or near_chamber(x, y, TER + 4) or not slope_ok(x, y, 0.6): continue
        z = height(x, y)
        if z is None or z < 5: continue
        place(oak, oaks, x, y, z, rot=rng.uniform(0, 6.28), s=rng.uniform(0.7, 1.3))
        counts["oak"] += 1
for k, (x, y) in enumerate(road):                                                # cypresses by the road
    if k % 4 or rng.random() < 0.45: continue
    t = road[min(k + 1, len(road) - 1)] - road[max(k - 1, 0)]
    nrm = np.array([-t[1], t[0]]) / max(np.linalg.norm(t), 1e-6)
    for side in (1, -1):
        px_, py_ = x + side * 7.5 * nrm[0], y + side * 7.5 * nrm[1]
        if is_class(town, px_, py_) or near_chamber(px_, py_, TER + 2): continue
        z = height(px_, py_)
        if z is None or z < 4: continue
        place(cypress, cypresses, px_, py_, z, s=rng.uniform(0.85, 1.2))
        counts["cypress"] += 1
for k in range(14):                                                               # round the terrace
    a_ = 2 * math.pi * k / 14
    x, y = chamber.x + (TER + 6) * math.cos(a_), chamber.y + (TER + 6) * math.sin(a_)
    if near_road(x, y, 8): continue
    z = height(x, y)
    if z is not None:
        place(cypress, cypresses, x, y, z, s=1.2); counts["cypress"] += 1

# --- harbour: two stone piers from the town's shore, a merchantman at each ------------------
def ship_mesh():
    bm = bmesh.new()
    hull = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    bmesh.ops.scale(bm, vec=(18, 5, 2.4), verts=hull)
    for v in hull:
        if v.co.z < 0: v.co.x *= 0.8; v.co.y *= 0.45
    bmesh.ops.translate(bm, vec=(0, 0, 0.6), verts=hull)
    for f in {f for v in hull for f in v.link_faces}: f.material_index = 0
    cyl(bm, 0, 0, 1.8, 0.2, 11, seg=6, mat_index=0)
    box(bm, 0, 0, 11.5, 0.3, 10, 0.3, mat_index=0)
    box(bm, 0.1, 0, 5.5, 0.05, 9, 6, mat_index=1)
    return finish("merchantman", bm, [M["wood"], M["sail"]])

def shore_point(px):
    """The first sea cell going east (up the image) from the town's shore at column px."""
    col = land[:, int(px)]
    rows = np.nonzero(col & town[:, int(px)])[0]
    if not len(rows): return None
    return to_world(px, rows.min())

piers = bmesh.new()
ship = ship_mesh()
for px in (330, 517):
    sp = shore_point(px)
    if sp is None: continue
    x, y = sp
    box(piers, x, y + 30, -3, 7, 70, 4.5, mat_index=0)
    ship.location = (x + 10, y + 45, 0) if px == 330 else ship.location
    if px == 517:
        s2 = bpy.data.objects.new("merchantman.001", ship.data); sc.collection.objects.link(s2)
        s2.location = (x - 10, y + 40, 0)
finish("piers", piers, [M["paving"]])

bpy.ops.wm.save_as_mainfile(filepath=OUT + ".blend")
for o in sc.objects: o.select_set(o.name != "sea")
bpy.ops.export_scene.gltf(filepath=OUT + ".glb", export_format="GLB", use_selection=True,
                          export_gpu_instances=True, export_apply=True, export_yup=True)
print(f"built: terrain faces {len(faces)}, houses {n_houses}, warehouses {len(taken)}, agora {agora is not None}, farmsteads {len(farm_px)}, "
      f"trees {counts}, chamber at ({chamber.x:.0f},{chamber.y:.0f},{chamber.z:.0f}) terrace {t_h:.1f} m")
