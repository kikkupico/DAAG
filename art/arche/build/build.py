"""Build Arche from its canon: the ring road, Mount Phyle, the three houses.

    blender -b -P art/arche/build/build.py -- art/arche/arche-built

Writes <out>.glb and <out>.blend. Units are metres, heights real (no exaggeration).
Compass: North = -X, East = +Y; bearings are degrees clockwise from north.
The terrain is a radial mesh, so the coastline is exactly R(bearing) and the two road
cuttings sit flush on the cliff face. Heights come from one function, h(x, y), which
everything is placed on. Repeated objects are linked duplicates under one empty per kind,
exported with EXT_mesh_gpu_instancing.

Canon (settings.md, art/world-prompt.md §2): ~8 km round island; Mount Phyle, 400 m, foot
~5 km across, eight spurs and gullies, a steep cragged crown; houses at N (Vine),
ESE (Anchor), WSW (Dolphin); every line between two houses passes through rock >= ~80 m;
two stacked single-file cliff cuttings, joined only at the ports; one tent per camp at the
quarter points; a ruined polygonal circuit wall with a north slot and a south gap.
"""
import bpy, bmesh, sys, os, math, random
import numpy as np
from mathutils import Vector, Matrix

OUT = os.path.abspath(sys.argv[-1])
rng = np.random.default_rng(11)
random.seed(11)

# --- the plan ----------------------------------------------------------------------------
PORTS = {"vine": 0.0, "anchor": 112.5, "dolphin": 247.5}
R0 = 4000.0                               # mean coast radius
FOOT = 2550.0                             # massif foot radius
CAPES = {56.0: 250, 180.0: 450, 304.0: 220}     # headlands between the ports (bearing: bulge m)
COVES = {"vine": (280, 4.0), "anchor": (560, 7.0), "dolphin": (230, 3.0)}   # depth m, half-width deg

def angdiff(a, b):
    return (a - b + 180.0) % 360.0 - 180.0

_phase = rng.uniform(0, 2 * math.pi, 24)
def coast_r(b):
    """Coast radius at bearing b (degrees)."""
    t = math.radians(b)
    r = R0 + sum(260.0 / k * math.sin(k * t + _phase[k]) for k in range(3, 24))
    for cb, bulge in CAPES.items():
        r += bulge * math.exp(-(angdiff(b, cb) / 4.5) ** 2)
    for name, (depth, w) in COVES.items():
        r -= depth * math.exp(-(angdiff(b, PORTS[name]) / w) ** 2)
    return r

def port_weight(b, widen=1.6):
    return max(math.exp(-(angdiff(b, PORTS[n]) / (COVES[n][1] * widen)) ** 2) for n in PORTS)

def bearing(x, y):
    return math.degrees(math.atan2(y, -x)) % 360.0

def at(b, r):
    t = math.radians(b)
    return (-r * math.cos(t), r * math.sin(t))

_hph = rng.uniform(0, 2 * math.pi, 16)
def h(x, y):
    """Ground height (m above sea level); negative off the island."""
    r = math.hypot(x, y); b = bearing(x, y); R = coast_r(b)
    if r > R: return -20.0
    u = r / FOOT
    spur = 1 + 0.16 * math.cos(math.radians(8 * (b - 22.5))) * \
        np.clip((u - 0.25) / 0.35, 0, 1) * np.clip((1.05 - u) / 0.1, 0, 1)
    massif = 250.0 * max(0.0, 1 - u ** 2.3) ** 1.4 * spur
    crown = 106.0 * max(0.0, 1 - (r / 420.0) ** 1.6) ** 1.8          # a rounded top, not a point
    dc = R - r                                                    # distance to the coast
    plain = 26.0 + 18.0 * min(dc / 900.0, 1.0) + 5.0 * math.sin(3 * math.radians(b) + _hph[0]) \
        + 3.0 * math.sin(7 * math.radians(b) + _hph[1])
    z = plain + massif + crown
    pw = port_weight(b)
    if pw > 0.01:                                                 # the coves come down to the water
        z = z * (1 - pw) + pw * (1.5 + z * min(dc / 450.0, 1.0))
    return z

_grids = [(rng.uniform(-1, 1, (n + 2, n + 2)), 10000.0 / n) for n in (18, 40, 90)]
def noise(x, y):
    """Smooth value noise in about [-1, 1] (three octaves, 550 m to 110 m); x, y may be arrays."""
    x = np.asarray(x, float) + 5000.0; y = np.asarray(y, float) + 5000.0
    v = 0.0
    for k, (g, cell) in enumerate(_grids):
        gx, gy = x / cell, y / cell
        i, j = np.floor(gx).astype(int), np.floor(gy).astype(int)
        fx, fy = gx - i, gy - j
        fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        i = np.clip(i, 0, g.shape[0] - 2); j = np.clip(j, 0, g.shape[1] - 2)
        a = g[i, j] * (1 - fx) + g[i + 1, j] * fx
        b_ = g[i, j + 1] * (1 - fx) + g[i + 1, j + 1] * fx
        v = v + (a * (1 - fy) + b_ * fy) * (0.55 ** k)
    return v / 1.1

# --- scene, materials, helpers ----------------------------------------------------------------
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
    "grass": ((0.33, 0.36, 0.18),), "dry_grass": ((0.55, 0.49, 0.28),),
    "scrub": ((0.24, 0.27, 0.14),), "rock": ((0.86, 0.80, 0.68),), "crag": ((0.66, 0.63, 0.56),),
    "sand": ((0.86, 0.78, 0.60),), "seabed": ((0.20, 0.33, 0.34),), "vineyard": ((0.45, 0.38, 0.24),),
    "paving": ((0.78, 0.75, 0.68),), "road": ((0.72, 0.66, 0.55),), "path": ((0.60, 0.52, 0.40),),
    "limestone": ((0.88, 0.86, 0.80), 0.8), "terracotta": ((0.60, 0.26, 0.14), 0.8),
    "olive": ((0.36, 0.43, 0.29),), "pine": ((0.16, 0.25, 0.12),), "cypress": ((0.09, 0.18, 0.07),),
    "maquis": ((0.22, 0.29, 0.15),), "vine": ((0.30, 0.38, 0.14),), "trunk": ((0.28, 0.22, 0.16),),
    "wood": ((0.40, 0.27, 0.15), 0.8), "bronze": ((0.55, 0.38, 0.18), 0.35, 1.0),
    "linen": ((0.86, 0.82, 0.72),), "sail": ((0.85, 0.80, 0.68),), "iron": ((0.25, 0.24, 0.23), 0.6, 0.8),
    "wicker": ((0.62, 0.50, 0.30),), "sea": ((0.03, 0.18, 0.30), 0.15)}.items()}

def new_obj(name, me, coll=None):
    ob = bpy.data.objects.new(name, me); (coll or sc.collection).objects.link(ob); return ob

def box(bm, cx, cy, z0, sx, sy, sz, rot=0.0, mat_index=0):
    r = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=r)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot, 3, "Z"), verts=r)
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + sz / 2), verts=r)
    for f in {f for v in r for f in v.link_faces}: f.material_index = mat_index

def cyl(bm, cx, cy, z0, r, hgt, seg=16, mat_index=0, r2=None):
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                                radius2=r if r2 is None else r2, depth=hgt)
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + hgt / 2), verts=res["verts"])
    for f in {f for v in res["verts"] for f in v.link_faces}: f.material_index = mat_index

def blob(bm, cx, cy, z0, sx, sy, sz, mat_index=0, sub=1):
    res = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    for v in res["verts"]:
        v.co *= 1 + rng.uniform(-0.18, 0.18)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=res["verts"])
    bmesh.ops.translate(bm, vec=(cx, cy, z0), verts=res["verts"])
    for f in {f for v in res["verts"] for f in v.link_faces}: f.material_index = mat_index

def prism_roof(bm, sx, sy, z0, rise, mat_index, over=0.4):
    """A pitched roof, ridge along X."""
    hx, hy = sx / 2 + over, sy / 2 + over
    v = [bm.verts.new(p) for p in ((-hx, -hy, z0), (hx, -hy, z0), (hx, hy, z0), (-hx, hy, z0),
                                   (-hx, 0, z0 + rise), (hx, 0, z0 + rise))]
    for q in ((v[0], v[1], v[5], v[4]), (v[2], v[3], v[4], v[5]), (v[1], v[2], v[5]),
              (v[3], v[0], v[4]), (v[0], v[3], v[2], v[1])):
        bm.faces.new(q).material_index = mat_index

def finish(name, bm, mats, coll=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m_ in mats: me.materials.append(m_)
    return new_obj(name, me, coll)

def kind(name):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e); return e

def place(me, parent, x, y, z, rot=0.0, s=1.0, sz=None):
    ob = bpy.data.objects.new(me.name, me); sc.collection.objects.link(ob)
    ob.parent = parent; ob.location = (x, y, z); ob.rotation_euler = (0, 0, rot)
    ob.scale = (s, s, s if sz is None else sz)
    return ob

def proto(name, bm, mats):
    me = finish(name, bm, mats).data
    for ob in [o for o in bpy.data.objects if o.data == me and o.parent is None]:
        bpy.data.objects.remove(ob)
    return me

# --- terrain: a radial mesh -------------------------------------------------------------------
# Rings from the peak to the coast. Inner rings have fewer segments (halving inwards, stitched
# with triangles) so no triangle is a sliver; the outer ring follows R(bearing) exactly.
NA, NR = 1440, 300
rho = np.linspace(0, 1, NR + 1) ** 0.85                     # denser towards the coast
def segs(r):
    n = NA
    while n > 45 and 2 * math.pi * r / (n / 2) < 14.0: n //= 2
    return n
ring_n = [segs(rho[j] * R0) for j in range(1, NR + 1)] + [NA, NA]    # + cliff foot, seabed
verts, starts = [(0.0, 0.0, h(0, 0))], []
Rcache = {}
def R_at(k, n):
    b = k * 360.0 / n
    if b not in Rcache: Rcache[b] = coast_r(b)
    return b, Rcache[b]
for j, n in enumerate(ring_n):
    starts.append(len(verts))
    for k in range(n):
        b, R = R_at(k, n)
        if j < NR - 1:
            x, y = at(b, rho[j + 1] * R); verts.append((x, y, h(x, y)))
        elif j == NR - 1:                                     # the cliff top, on the coastline
            x, y = at(b, R); verts.append((x, y, max(h(*at(b, R - 0.5)), 0.5)))
        elif j == NR:                                         # the cliff foot
            x, y = at(b, R + 1.0); verts.append((x, y, -20.0))
        else:                                                 # the seabed apron
            x, y = at(b, R + 60.0); verts.append((x, y, -24.0))
faces = []
n0 = ring_n[0]
for k in range(n0):                                          # the fan round the peak
    faces.append((0, starts[0] + k, starts[0] + (k + 1) % n0))
for j in range(len(ring_n) - 1):
    a, b_ = starts[j], starts[j + 1]; na, nb = ring_n[j], ring_n[j + 1]
    if na == nb:
        for k in range(na):
            k1 = (k + 1) % na
            faces.append((a + k, b_ + k, b_ + k1, a + k1))
    else:                                                     # nb == 2 * na
        for k in range(na):
            k1 = (k + 1) % na; o = 2 * k
            faces.append((a + k, b_ + o, b_ + o + 1))
            faces.append((a + k, b_ + o + 1, a + k1))
            faces.append((a + k1, b_ + o + 1, b_ + (o + 2) % nb))
faces = [tuple(reversed(f_)) for f_ in faces]               # counter-clockwise seen from above
V = np.array(verts)
me = bpy.data.meshes.new("terrain")
me.from_pydata(V.tolist(), [], faces)
me.update()
for n in ("grass", "dry_grass", "scrub", "rock", "sand", "seabed", "vineyard", "crag"):
    me.materials.append(M[n])
npoly = len(me.polygons)
cen = np.zeros(npoly * 3); me.polygons.foreach_get("center", cen); cen = cen.reshape(-1, 3)
nrm = np.zeros(npoly * 3); me.polygons.foreach_get("normal", nrm); nz = nrm.reshape(-1, 3)[:, 2]
fxy, fz = cen[:, :2], cen[:, 2]
fr = np.hypot(fxy[:, 0], fxy[:, 1])
fb = (np.degrees(np.arctan2(fxy[:, 1], -fxy[:, 0])) % 360.0)
Rtab = np.array([coast_r(b) for b in np.arange(0, 360, 0.25)])
fR = np.interp(fb, np.r_[np.arange(0, 360, 0.25), 360], np.r_[Rtab, Rtab[0]])
dc = fR - fr
def near_port(name, width):
    return np.abs((fb - PORTS[name] + 180) % 360 - 180) < width
fn = noise(fxy[:, 0], fxy[:, 1])
edge = FOOT * (1.0 + 0.08 * fn)                                      # a ragged foot, not a circle
mi = np.where(fn > 0.05, 0, 1).astype(np.int64)                      # grass and dry fields, patchy
mi[fr < edge] = 2                                                    # scrub on the massif
bare = 300 + 45 * fn                                                 # bare limestone, ragged edge
mi[fz > bare] = 7                                                    # bare limestone on the crown
mi[near_port("vine", 5) & (dc > 50) & (dc < 520)] = 6                # vine terraces
mi[(nz < 0.72) & (fz > 2)] = 3                                       # cliffs and steep ground
mi[near_port("anchor", 5.5) & (fz < 3.5) & (dc < 45)] = 4            # the Anchor's beach
mi[fz < -1] = 5
me.polygons.foreach_set("material_index", mi.astype(np.int32))
me.polygons.foreach_set("use_smooth", (nz > 0.3).tolist())          # smooth ground, sharp cliffs
new_obj("terrain", me)
sea_me = bpy.data.meshes.new("sea")
sea_me.from_pydata([(-15000, -15000, 0), (15000, -15000, 0), (15000, 15000, 0), (-15000, 15000, 0)], [], [(0, 1, 2, 3)])
sea_me.materials.append(M["sea"]); new_obj("sea", sea_me)

# --- the check: every line between two houses passes through rock >= ~80 m ----------------------
houses_at = {n: at(b, coast_r(b) - 120) for n, b in PORTS.items()}
sight = {}
for a_, b_ in (("vine", "anchor"), ("anchor", "dolphin"), ("dolphin", "vine")):
    (x0, y0), (x1, y1) = houses_at[a_], houses_at[b_]
    top = max(h(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) for t in np.linspace(0.05, 0.95, 400))
    sight[f"{a_}-{b_}"] = round(top)

# --- the ring road: two stacked one-way cuttings, flush on the cliff face ------------------------
def cutting_levels(b):
    """(lower, upper) shelf heights at bearing b: 6 m apart, coming down to the quay at a port."""
    z_top = h(*at(b, coast_r(b) - 1))
    lo = min(14.0, max(z_top - 13.0, 3.0))
    pw = port_weight(b, 1.1)
    lo = lo * (1 - pw) + 2.2 * pw
    return lo, lo + 6.0 * (1 - pw) + 0.8 * pw

def shelf_ring(name, which, out0, out1, thick, material):
    bm = bmesh.new(); prev = None
    for b in np.arange(0, 360.01, 0.25):
        R = coast_r(b); z = cutting_levels(b)[which]
        pts = [Vector((*at(b, R + d), zz)) for d, zz in
               ((out0, z), (out1, z), (out1, z - thick), (out0, z - thick))]
        par = [Vector((*at(b, R + out1 - 0.5), z)), Vector((*at(b, R + out1 - 0.5), z + 0.9))]
        cur = [bm.verts.new(p) for p in pts + par]
        if prev:
            for k in range(4):
                bm.faces.new((prev[k], prev[(k + 1) % 4], cur[(k + 1) % 4], cur[k]))
            bm.faces.new((prev[4], prev[5], cur[5], cur[4])).material_index = 1   # parapet
        prev = cur
    return finish(name, bm, [material, M["limestone"]])
shelf_ring("cutting_upper", 1, -0.5, 3.6, 1.2, M["road"])           # sunwise
shelf_ring("cutting_lower", 0, -0.5, 4.2, 1.2, M["road"])           # against the sun

# --- Mount Phyle: crags, the circuit wall, the chief's hollow, the posts, paths, camps --------
peak = Vector((0, 0, h(0, 0)))
bm = bmesh.new()
for k in range(170):                                               # crags on the crown
    rr = 380 * math.sqrt(rng.uniform()); bb = rng.uniform(0, 360)
    x, y = at(bb, rr)
    s = rng.uniform(3, 14) * (1.2 - rr / 500)
    blob(bm, x, y, h(x, y) - s * 0.3, s, s * rng.uniform(0.6, 1.1), s * rng.uniform(0.5, 1.0), mat_index=0)
for k in range(260):                                               # outcrops on the upper slopes
    rr = rng.uniform(380, 1500); bb = rng.uniform(0, 360)
    x, y = at(bb, rr)
    s = rng.uniform(2, 7)
    blob(bm, x, y, h(x, y) - s * 0.4, s, s * 0.8, s * 0.55, mat_index=0)
finish("crags", bm, [M["crag"]])

bm = bmesh.new()                                                   # the ruined circuit wall
corners = []
for k in range(11):
    b = k * 360 / 11 + rng.uniform(-8, 8)
    corners.append(at(b, 95 + rng.uniform(-12, 12)))
for k in range(11):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 11]
    L = math.hypot(x1 - x0, y1 - y0); ang = math.atan2(y1 - y0, x1 - x0)
    n = max(1, int(L // 4))
    for p in range(n):
        t = (p + 0.5) / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        b = bearing(x, y)
        if abs(angdiff(b, 0)) < 1.0: continue                       # the narrow north slot
        if abs(angdiff(b, 180)) < 2.6:                              # the wider south gap
            continue
        box(bm, x, y, h(x, y) - 2, L / n * 1.02, 1.8, 2 + rng.uniform(1.5, 4.5), rot=ang, mat_index=0)
sx_, sy_ = at(180, 96)                                              # timber frame in the south gap
for side in (-4, 4):
    px, py = at(180 + side * 0.7, 96)
    box(bm, px, py, h(px, py), 0.4, 0.4, 3.6, mat_index=1)
box(bm, sx_, sy_, h(sx_, sy_) + 3.6, 0.4, 7.5, 0.4, rot=math.radians(90), mat_index=1)
# the chief's hollow on the peak: a rock shelter, strongboxes, a bronze water-jar
blob(bm, 3, -2, peak.z + 1, 6, 4, 3, mat_index=0)
box(bm, 1, 1, peak.z + 3.5, 6, 5, 0.8, rot=0.3, mat_index=0)
for k in range(4):
    box(bm, -1 + k * 1.1, 2.5, peak.z, 0.9, 0.6, 0.6, rot=0.3, mat_index=2)
cyl(bm, -2.5, 0, peak.z, 0.3, 0.7, seg=10, mat_index=3, r2=0.22)
# three posts below the rim, facing the north slot, the south gap and the eastern cliffs
for b in (4, 176, 90):
    x, y = at(b, 62); z = h(x, y)
    blob(bm, *at(b + 9, 58), z + 1, 6, 5, 5, mat_index=0)            # the crag that hides it
    box(bm, *at(b, 64), z, 3.5, 0.8, 1.0, rot=math.radians(90 - b), mat_index=0)   # breastwork
    cyl(bm, *at(b - 2, 61), z, 0.08, 1.8, seg=6, mat_index=1)        # bird perch
    cyl(bm, *at(b + 2, 61), z, 0.22, 0.5, seg=8, mat_index=3, r2=0.16)
finish("crown", bm, [M["crag"], M["wood"], M["iron"], M["bronze"]])

def path_ribbon(name, pts, width, lift, material):
    bm = bmesh.new(); prev = None
    for k, (x, y) in enumerate(pts):
        j0, j1 = max(k - 1, 0), min(k + 1, len(pts) - 1)
        t = Vector((pts[j1][0] - pts[j0][0], pts[j1][1] - pts[j0][1], 0)).normalized()
        n_ = Vector((-t.y, t.x, 0)) * width / 2
        p = Vector((x, y, h(x, y) + lift))
        pair = (bm.verts.new(p + n_), bm.verts.new(p - n_))
        if prev: bm.faces.new((prev[0], prev[1], pair[1], pair[0]))
        prev = pair
    return finish(name, bm, [material])
for name, spur_b, end_b in (("goatpath_north", 22.5, 0), ("goatpath_south", 157.5, 180)):
    pts = []
    for rr in np.linspace(1500, 100, 160):                          # fades out below 1500 m
        b = spur_b + (end_b - spur_b) * max(0.0, (500 - rr) / 400) + 3 * math.sin(rr / 60)
        pts.append(at(b, rr))
    path_ribbon(name, pts, 1.0, 0.15, M["path"])

camps = kind("camps")                                              # one tent at each quarter point
bm = bmesh.new()
v = [bm.verts.new(p) for p in ((-1.1, -1.0, 0), (1.1, -1.0, 0), (1.1, 1.0, 0), (-1.1, 1.0, 0),
                               (-1.1, 0, 1.3), (1.1, 0, 1.3))]
for q in ((v[0], v[1], v[5], v[4]), (v[2], v[3], v[4], v[5]), (v[1], v[2], v[5]), (v[3], v[0], v[4])):
    bm.faces.new(q).material_index = 0
cyl(bm, 1.6, 0.6, 0, 0.45, 0.06, seg=12, mat_index=1)             # shield
box(bm, 1.6, -0.6, 0, 0.7, 0.45, 0.45, mat_index=1)               # chest
cyl(bm, 1.5, 0, 0, 0.25, 0.4, seg=10, mat_index=2)                # wicker bird basket
tent = proto("tent", bm, [M["linen"], M["wood"], M["wicker"]])
camp_pos = []
for b in (0, 90, 180, 270):
    x, y = at(b, FOOT * 0.93)
    place(tent, camps, x, y, h(x, y), rot=math.radians(-b) + math.pi / 2)
    camp_pos.append((x, y))

# --- buildings -----------------------------------------------------------------------------------
def cottage_me(name, sx, sy, wall):
    bm = bmesh.new()
    box(bm, 0, 0, -6, sx, sy, wall + 6, mat_index=0)
    prism_roof(bm, sx, sy, wall, 1.6, 1)
    return proto(name, bm, [M["limestone"], M["terracotta"]])
def hall_me(name, length, depth, wall, colonnade=False):
    bm = bmesh.new()
    back = depth * (0.6 if colonnade else 1.0)
    box(bm, 0, -depth / 2 + back / 2, -6, length, back, wall + 6, mat_index=0)
    if colonnade:
        n = int(length // 4)
        for k in range(n + 1):
            cyl(bm, -length / 2 + k * length / n, depth / 2 - 0.6, 0, 0.35, wall, seg=8, mat_index=0)
    prism_roof(bm, length, depth, wall, 2.2, 1)
    return proto(name, bm, [M["limestone"], M["terracotta"]])
def court_me(name, size, court, wall):
    """A courtyard building with porticos round the court (the customs house)."""
    bm = bmesh.new(); half, ch = size / 2, court / 2; t = half - ch
    for bx, by, ox, oy in ((size, t, 0, half - t / 2), (size, t, 0, -half + t / 2),
                           (t, court, half - t / 2, 0), (t, court, -half + t / 2, 0)):
        box(bm, ox, oy, -6, bx, by, wall + 6, mat_index=0)
        box(bm, ox, oy, wall, bx * 1.03, by * 1.03, 0.9, mat_index=1)
    for k in range(12):                                             # slate tablets on pillars
        a = 2 * math.pi * k / 12
        box(bm, ch * 0.6 * math.cos(a), ch * 0.6 * math.sin(a), 0, 0.5, 0.5, 1.6, mat_index=0)
        box(bm, ch * 0.6 * math.cos(a), ch * 0.6 * math.sin(a), 1.6, 0.1, 1.0, 0.7, rot=a, mat_index=2)
    return proto(name, bm, [M["limestone"], M["terracotta"], M["iron"]])

cottages = [cottage_me(f"cottage_{a}x{b}", a, b, w) for a, b, w in ((8, 6, 3.2), (10, 7, 3.5), (12, 8, 3.8), (9, 9, 3.4))]
granary = hall_me("granary", 36, 12, 6)
depot = hall_me("depot", 30, 14, 5, colonnade=True)
cellar = hall_me("cellar", 24, 10, 3.5)
customs = court_me("customs_house", 46, 20, 7)
town = kind("port_buildings")

def radial_rot(b):          # a building's long side faces the sea
    return math.radians(90 - b) + math.pi / 2

def ok_site(x, y, lim=0.3):
    z0 = h(x, y)
    if z0 < 1.2: return False
    return all(abs(h(x + dx, y + dy) - z0) / 6 < lim for dx, dy in ((6, 0), (-6, 0), (0, 6), (0, -6)))

sites = []
def free(x, y, d):
    return all(math.hypot(x - a, y - b) > d for a, b in sites)
def put(me, b, dist_in, rot_extra=0.0, spread=0.0):
    R = coast_r(b); x, y = at(b + spread, R - dist_in)
    if not ok_site(x, y, 0.45): return None
    sites.append((x, y))
    return place(me, town, x, y, h(x, y), rot=radial_rot(b) + rot_extra)

put(customs, PORTS["anchor"], 170)
put(granary, PORTS["anchor"] + 2.2, 150); put(granary, PORTS["anchor"] - 2.4, 160)
put(depot, PORTS["dolphin"], 70)
put(cellar, PORTS["vine"] + 0.9, 150); put(cellar, PORTS["vine"] - 0.9, 170)
counts = {"cottages": 0}
for name, n_ in (("anchor", 60), ("dolphin", 28), ("vine", 24)):
    b0, (depth, w) = PORTS[name], COVES[name]
    tries = 0
    while n_ > 0 and tries < 4000:
        tries += 1
        b = b0 + rng.normal(0, w * 0.45)
        d = 35 + abs(rng.normal(0, 110 if name == "anchor" else 70))
        R = coast_r(b); x, y = at(b, R - d)
        if not free(x, y, 13) or not ok_site(x, y, 0.35): continue
        sites.append((x, y))
        place(random.choice(cottages), town, x, y, h(x, y), rot=radial_rot(b) + rng.choice((0, math.pi / 2)) + rng.uniform(-0.15, 0.15))
        counts["cottages"] += 1; n_ -= 1

# the rock-cut storehouse, just along the road from the Vine: a door in the cliff at road level
bm = bmesh.new()
b = PORTS["vine"] + 5.5
lo, up = cutting_levels(b)
x, y = at(b, coast_r(b) + 0.2)
rot = radial_rot(b)
box(bm, x, y, up, 0.6, 4.5, 4.0, rot=rot, mat_index=0)
box(bm, x, y, up + 4.0, 0.9, 5.5, 0.6, rot=rot, mat_index=0)
finish("storehouse_door", bm, [M["wood"]])

# sundials on the headlands (the southern one ruined)
bm = bmesh.new()
for cb in CAPES:
    x, y = at(cb, coast_r(cb) - 40); z = h(x, y)
    box(bm, x, y, z, 2.4, 2.4, 0.5, mat_index=0)
    if cb == 180.0:
        box(bm, x + 1.5, y - 0.8, z, 1.1, 0.7, 0.4, rot=0.6, mat_index=0)
    else:
        box(bm, x, y, z + 0.5, 0.8, 0.8, 1.1, mat_index=0)
        box(bm, x, y, z + 1.6, 0.1, 0.9, 0.6, mat_index=1)
finish("sundials", bm, [M["limestone"], M["bronze"]])

# --- the harbours: piers, quays, slipways, ships ---------------------------------------------
def ship_me(name, length):
    bm = bmesh.new()
    hull = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    bmesh.ops.scale(bm, vec=(length, length * 0.28, length * 0.13), verts=hull)
    for v_ in hull:
        if v_.co.z < 0: v_.co.x *= 0.8; v_.co.y *= 0.45
    bmesh.ops.translate(bm, vec=(0, 0, length * 0.035), verts=hull)
    for f in {f for v_ in hull for f in v_.link_faces}: f.material_index = 0
    if length > 12:
        cyl(bm, 0, 0, length * 0.1, 0.2, length * 0.6, seg=6, mat_index=0)
        box(bm, 0, 0, length * 0.65, 0.3, length * 0.55, 0.3, mat_index=0)
        box(bm, 0.1, 0, length * 0.3, 0.05, length * 0.5, length * 0.33, mat_index=1)
    return proto(name, bm, [M["wood"], M["sail"]])
merchantman = ship_me("merchantman", 18)
skiff = ship_me("skiff", 6)
ships = kind("ships")
bm = bmesh.new()
def pier(b, length, width, offset=0.0):
    R = coast_r(b); t = math.radians(b)
    out = Vector((-math.cos(t), math.sin(t), 0))
    x, y = at(b, R - 10 + length / 2)
    box(bm, x + offset * out.y, y - offset * out.x, -4, length + 20, width, 5.5,
        rot=math.atan2(out.y, out.x), mat_index=0)
    return out
def slipway(b, length=34):
    R = coast_r(b); t = math.radians(b); out = Vector((-math.cos(t), math.sin(t), 0))
    x, y = at(b, R - length * 0.35)
    ang = math.atan2(out.y, out.x)
    zb = h(*at(b, R - length * 0.7))
    r = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    bmesh.ops.scale(bm, vec=(length, 7, 0.6), verts=r)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.atan2(max(zb, 1), length), 3, "Y"), verts=r)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(ang, 3, "Z"), verts=r)
    bmesh.ops.translate(bm, vec=(x, y, max(zb, 1) / 2), verts=r)
    for f in {f for v_ in r for f in v_.link_faces}: f.material_index = 1
    place(merchantman, ships, x, y, max(zb, 1) / 2 + 1.2, rot=ang)
out = pier(PORTS["anchor"], 190, 9)                                 # the Anchor's long stone pier
x, y = at(PORTS["anchor"], coast_r(PORTS["anchor"]) + 120)
place(merchantman, ships, x + out.y * 12, y - out.x * 12, 0, rot=math.atan2(out.y, out.x))
slipway(PORTS["anchor"] + 3.2); slipway(PORTS["anchor"] + 4.3)
pier(PORTS["vine"], 70, 7); slipway(PORTS["vine"] - 1.8)
pier(PORTS["dolphin"], 55, 8); slipway(PORTS["dolphin"] + 1.4)
for k in range(5):
    x, y = at(PORTS["dolphin"] + rng.uniform(-1.2, 1.2), coast_r(PORTS["dolphin"]) + rng.uniform(15, 60))
    place(skiff, ships, x, y, 0, rot=rng.uniform(0, 6.28))
finish("harbours", bm, [M["paving"], M["wood"]])

# the Needle, off the southern cape; reefs off every headland
bm = bmesh.new()
nx, ny = at(180, coast_r(180) + 290)
cyl(bm, nx, ny, -20, 16, 70, seg=9, mat_index=0, r2=6)
blob(bm, nx + 4, ny - 3, 48, 7, 6, 4, mat_index=0)
for k in range(420):
    b = rng.uniform(0, 360)
    if port_weight(b, 2.2) > 0.3: continue
    capey = max(math.exp(-(angdiff(b, cb) / 9) ** 2) for cb in CAPES)
    if rng.uniform() > 0.25 + 0.75 * capey: continue
    x, y = at(b, coast_r(b) + rng.uniform(10, 150))
    s = rng.uniform(1.5, 6)
    blob(bm, x, y, rng.uniform(-1.5, 0.6), s, s * 0.8, s * 0.4, mat_index=0)
finish("reefs_and_needle", bm, [M["rock"]])

# --- carts standing on the cuttings, in single file, each shelf facing its own way ----------------
bm = bmesh.new()
box(bm, 0, 0, 0.7, 3.0, 1.6, 0.7, mat_index=0)
for side in (-0.85, 0.85):
    r_ = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.6, radius2=0.6, depth=0.12)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "X"), verts=r_["verts"])
    bmesh.ops.translate(bm, vec=(0, side, 0.6), verts=r_["verts"])
for k in range(3):
    cyl(bm, -0.8 + k * 0.8, 0, 1.4, 0.28, 0.7, seg=8, mat_index=1, r2=0.2)
cart = proto("cart", bm, [M["wood"], M["terracotta"]])
carts = kind("carts")
for which, sense, bs0 in ((1, 1, (30, 150, 270)), (0, -1, (75, 205, 320))):
    for b0 in bs0:
        for k in range(3):
            b = b0 + k * 0.12 * sense
            lo, up = cutting_levels(b)
            x, y = at(b, coast_r(b) + (1.5 if which else 1.9))
            t = math.radians(b)
            tang = Vector((math.sin(t), math.cos(t), 0)) * sense      # direction of increasing bearing
            place(cart, carts, x, y, (up if which else lo), rot=math.atan2(tang.y, tang.x))

# --- vegetation ------------------------------------------------------------------------------------
def tree_me(name, trunk_h, crown_r, crown_h, cmat, shape="round"):
    bm = bmesh.new()
    cyl(bm, 0, 0, -0.5, 0.22, trunk_h + 0.5, seg=6, mat_index=0)
    if shape == "cone":
        cyl(bm, 0, 0, trunk_h * 0.5, crown_r, crown_h, seg=8, mat_index=1, r2=0.12)
    elif shape == "umbrella":
        cyl(bm, 0, 0, trunk_h, crown_r, crown_h, seg=10, mat_index=1, r2=crown_r * 0.55)
    else:
        blob(bm, 0, 0, trunk_h + crown_h * 0.4, crown_r, crown_r, crown_h / 2, mat_index=1)
    return proto(name, bm, [M["trunk"], cmat])
pine = tree_me("pine", 6.0, 4.5, 2.2, M["pine"], "umbrella")
cypress = tree_me("cypress", 1.0, 1.3, 11.0, M["cypress"], "cone")
olive = tree_me("olive", 1.6, 2.6, 3.4, M["olive"])
maquis = tree_me("maquis", 0.2, 1.8, 1.6, M["maquis"])
vine = proto("vine_row", (lambda bm_: (box(bm_, 0, 0, 0, 12, 0.6, 1.3, mat_index=0), bm_)[1])(bmesh.new()), [M["vine"]])
groups = {n: kind(n + "s") for n in ("pine", "cypress", "olive", "maquis", "vine")}
tc = {n: 0 for n in groups}
def plant(me_, n, x, y, s=None):
    z = h(x, y)
    place(me_, groups[n], x, y, z, rot=rng.uniform(0, 6.28), s=s or rng.uniform(0.8, 1.2)); tc[n] += 1
def clear_of_sites(x, y, d=12):
    return all(math.hypot(x - a, y - b) > d for a, b in sites) and \
        all(math.hypot(x - a, y - b) > 14 for a, b in camp_pos)
for gx in np.arange(-4600, 4600, 16.0):
    for gy in np.arange(-4600, 4600, 16.0):
        x, y = gx + rng.uniform(-6, 6), gy + rng.uniform(-6, 6)
        r = math.hypot(x, y); b = bearing(x, y); R = coast_r(b)
        if r > R - 12: continue
        z = h(x, y)
        if z < 3 or not clear_of_sites(x, y): continue
        dc_ = R - r; pw = port_weight(b, 1.6)
        steep = abs(h(x + 5, y) - z) / 5 > 0.9
        if steep: continue
        if r < FOOT * 1.02:                                        # the massif
            if z > 320: continue                                    # bare limestone above
            thin = (z - 150) / 170 if z > 150 else 0
            if rng.uniform() < thin: continue
            gully = math.cos(math.radians(8 * (b - 22.5))) < -0.6
            p = rng.uniform()
            if gully and p < 0.35: plant(cypress, "cypress", x, y)
            elif p < 0.55: plant(pine, "pine", x, y)
            elif p < 0.85: plant(maquis, "maquis", x, y)
        else:                                                       # the coastal strip
            if abs(angdiff(b, PORTS["vine"])) < 5.5 and 40 < dc_ < 540:
                continue                                            # vines planted below
            nv = noise(x, y)
            if (pw > 0.2 or nv > 0.35) and rng.uniform() < 0.6:     # olive groves near the ports, and in patches
                plant(olive, "olive", x, y)
            elif nv < -0.3 and rng.uniform() < 0.45:                # maquis on the rougher ground
                plant(maquis, "maquis", x, y)
            elif rng.uniform() < 0.05:
                plant(pine, "pine", x, y)
            elif rng.uniform() < 0.02:
                plant(cypress, "cypress", x, y)
for dist in np.arange(60, 460, 9.0):                                # the Vine's terraces, in plots
    for b in np.arange(PORTS["vine"] - 5, PORTS["vine"] + 5, 0.19):
        x, y = at(b, coast_r(b) - dist)
        if noise(x * 3, y * 3) < -0.25: continue
        if not clear_of_sites(x, y, 10) or h(x, y) < 3: continue
        place(vine, groups["vine"], x, y, h(x, y), rot=radial_rot(b) + math.pi / 2, s=1.0); tc["vine"] += 1

# --- export ------------------------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=OUT + ".blend")
for o in sc.objects: o.select_set(o.name != "sea")
bpy.ops.export_scene.gltf(filepath=OUT + ".glb", export_format="GLB", use_selection=True,
                          export_gpu_instances=True, export_apply=True, export_yup=True)
print(f"built arche: peak {peak.z:.0f} m, sightline rock tops {sight} (canon >= ~80), "
      f"buildings {len(sites)}, cottages {counts['cottages']}, trees {tc}")
