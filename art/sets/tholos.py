"""The Tholos of Schedia: a parametric set for the island model and the previs.

    blender -b -P art/sets/tholos.py [-- key=value ...]      # e.g. -- benches=2 doors=6

Writes art/sets/tholos.glb and art/sets/tholos.json. The Chamber's kind of hall with the one
thing the Chamber lacks, a podium at the centre; built after the Athenian Tholos so it reads
apart from the white domed rotunda across the bay:
- a plain drum of honey limestone on a two-step base, no colonnade outside, with doorways
  round it and a small columned porch facing the paved court;
- a low conical roof of oxblood tiles rising to a small louvred lantern, whose opening lights
  the podium;
- six plain columns inside carrying the roof, set between the door axes so the ways from the
  podium to the doors stay clear;
- a ring of benches along the wall between the doorways, each with a stand of wax tablets
  (Schedia keeps its law in wax, not ink);
- a low round podium at the centre with a seat, a writing desk and a board on a post for the
  board's number. It has no lectern: nobody speaks from it.

The outside matches the Chamber on the island model: about as wide as its colonnade, the
cornice and the top at about its entablature's and its dome's heights. The GLB is in the
set's own frame: metres, the centre of the floor at the origin, axes as explorer.html's
(north = -X). Its objects are `shell` (walls, columns, roof, porch), `floor` (floor, base
steps and podium steps, what people stand on) and `furniture` (benches, stands, the podium's
seat and desk, the board). tholos.json lists each bench, the podium and the doors in the
set's frame. art/sets/bake.py joins it into the island model at its site in sets.json.
"""
import bpy, bmesh, json, math, sys
from mathutils import Vector, Matrix

P = dict(
    radius=6.3,        # inside of the drum
    wall=0.7,          # drum wall thickness
    drum_h=5.4,        # floor to the top of the cornice
    base=0.4,          # the two-step base the floor stands on
    doors=6,           # doorways round the drum, the first opening onto the porch
    door_w=1.8, door_h=3.4,
    porch=-41.0,       # the porch's facing, degrees in the set's frame (the court, to the SW)
    porch_d=2.4, porch_w=4.4,
    pitch=28.0,        # roof pitch, degrees
    eaves=0.45,        # the roof's overhang beyond the drum
    lantern=0.9,       # radius of the opening at the top of the roof
    columns=6, col_r=3.4, col_d=0.5,
    benches=2,         # benches per stretch of wall between two doorways
    podium=1.3,
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T, H, B = P["radius"], P["wall"], P["drum_h"], P["base"]
RO = R + T
SEG = 96

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


LIME = material("honey-limestone", (0.62, 0.48, 0.3), 0.85)
TRIM = material("limestone-trim", (0.7, 0.58, 0.4), 0.75)
TILE = material("oxblood-tile", (0.42, 0.11, 0.07), 0.8)
UNDER = material("roof-timber", (0.3, 0.19, 0.1), 0.8)
FLOOR = material("floor", (0.8, 0.76, 0.68), 0.4)
INLAY = material("inlay", (0.42, 0.36, 0.3), 0.4)
WOOD = material("wood", (0.33, 0.2, 0.1), 0.7)
WAX = material("wax", (0.68, 0.5, 0.2), 0.45)
BOARD = material("board", (0.86, 0.82, 0.72), 0.7)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)


class Part:
    """Collects solids (as bmesh geometry) into one object, one material slot each."""
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def grid(self, pts, mat, closed_u=False, cap=True):
        """pts[i][j]: a solid swept as rows i of rings j; rows wrap into a closed tube."""
        s = self.slot(mat)
        vs = [[self.bm.verts.new(p) for p in row] for row in pts]
        n, m = len(vs), len(vs[0])
        for i in range(n):
            a, b = vs[i], vs[(i + 1) % n]
            for j in range(m if closed_u else m - 1):
                f = self.bm.faces.new((a[j], a[(j + 1) % m], b[(j + 1) % m], b[j]))
                f.material_index = s
        if cap and not closed_u:
            for end in (0, m - 1):
                f = self.bm.faces.new([vs[i][end] for i in range(n)][::(1 if end else -1)])
                f.material_index = s

    def box(self, c, size, mat, yaw=0.0):
        M = Matrix.Translation(Vector(c)) @ Matrix.Rotation(yaw, 4, "Z")
        g = bmesh.ops.create_cube(self.bm, size=1.0, matrix=M @ Matrix.Diagonal((*size, 1)))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def cyl(self, c, r0, r1, h, mat, segs=20):
        g = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r0,
                                  radius2=r1, depth=h, matrix=Matrix.Translation(Vector(c) + Vector((0, 0, h / 2))))
        s = self.slot(mat)
        for f in {f for v in g["verts"] for f in v.link_faces}:
            f.material_index = s

    def prism(self, pts2d, z0, z1, mat, M=Matrix()):
        """A vertical prism over the polygon pts2d (x, y), transformed by M."""
        s = self.slot(mat)
        lo = [self.bm.verts.new(M @ Vector((x, y, z0))) for x, y in pts2d]
        hi = [self.bm.verts.new(M @ Vector((x, y, z1))) for x, y in pts2d]
        n = len(pts2d)
        for f in [self.bm.faces.new(lo[::-1]), self.bm.faces.new(hi)] + [
                self.bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i])) for i in range(n)]:
            f.material_index = s

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me)
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        return o


def arc(r_in, r_out, a0, a1, z0, z1, segs=None):
    """Points of a curved wall piece between angles a0..a1: rows inner-bottom, outer-bottom,
    outer-top, inner-top."""
    n = segs or max(2, int(abs(a1 - a0) / (2 * math.pi) * SEG) + 1)
    ang = [a0 + (a1 - a0) * j / (n - 1) for j in range(n)]
    ring = lambda r, z: [(r * math.cos(a), r * math.sin(a), z) for a in ang]
    return [ring(r_in, z0), ring(r_out, z0), ring(r_out, z1), ring(r_in, z1)]


def cone(r0, z0, r1, z1, th, mat, part):
    """A conical shell, thickness th measured vertically, from radius r0 at z0 to r1 at z1."""
    ang = [2 * math.pi * j / SEG for j in range(SEG)]
    ring = lambda r, z: [(r * math.cos(a), r * math.sin(a), z) for a in ang]
    part.grid([ring(r0, z0 - th), ring(r1, z1 - th), ring(r1, z1), ring(r0, z0)], mat, closed_u=True)


shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")
FULL = 2 * math.pi

# --- base: two steps round the drum; the pad is at -B ---------------------------------------
floor.grid(arc(0.0, RO + 0.6, 0, FULL, -B, -B / 2, SEG + 1), TRIM)
floor.grid(arc(0.0, RO + 0.3, 0, FULL, -B / 2, 0.0, SEG + 1), TRIM)
for r0, r1 in ((P["podium"] + 0.5, P["podium"] + 0.62), (R - 1.0, R - 0.88)):
    floor.grid(arc(r0, r1, 0, FULL, 0.0, 0.004, SEG + 1), INLAY)

# --- drum, with doorways -------------------------------------------------------------------
N = P["doors"]
pa = math.radians(P["porch"])
doors = [pa + FULL * i / N for i in range(N)]
half_in = (P["door_w"] / 2) / R
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(R, RO, d + half_in, nxt - half_in, 0, H - 0.5), LIME)                # pier
    shell.grid(arc(R, RO, d - half_in, d + half_in, P["door_h"], H - 0.5, 4), LIME)      # over the door
    for s in (-1, 1):                                                                     # door frame
        a = d + s * (half_in + 0.1 / RO)
        shell.box((math.cos(a) * (RO + 0.03), math.sin(a) * (RO + 0.03), P["door_h"] / 2),
                  (0.1, 0.2, P["door_h"]), TRIM, yaw=a)
    shell.box((math.cos(d) * (RO + 0.03), math.sin(d) * (RO + 0.03), P["door_h"] + 0.1),
              (0.1, P["door_w"] + 0.4, 0.2), TRIM, yaw=d)
    floor.box((math.cos(d) * (R + T / 2), math.sin(d) * (R + T / 2), 0.002), (T + 0.1, P["door_w"], 0.004), INLAY, yaw=d)
# a plain frieze band and a cornice, and a low plinth course
shell.grid(arc(R, RO, 0, FULL, H - 0.5, H - 0.2, SEG + 1), TRIM)
shell.grid(arc(R, RO + 0.3, 0, FULL, H - 0.2, H, SEG + 1), TRIM)
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(RO, RO + 0.06, d + (P["door_w"] / 2) / RO, nxt - (P["door_w"] / 2) / RO, 0, 0.35), TRIM)

# --- roof: a tiled cone with a timber underside, and the lantern ----------------------------
tp = math.tan(math.radians(P["pitch"]))
r_eave, r_top = RO + P["eaves"], P["lantern"]
z_eave = H - 0.1
z_top = z_eave + (r_eave - r_top) * tp
cone(r_eave, z_eave, r_top, z_top, 0.18, TILE, shell)
cone(RO, z_eave - 0.19 + (r_eave - RO) * tp, r_top, z_top - 0.19, 0.03, UNDER, shell)             # timber underside
shell.grid(arc(r_top - 0.08, r_top + 0.08, 0, FULL, z_top - 0.2, z_top + 0.1, 49), TRIM)    # the lantern's curb
for k in range(8):                                                                          # its posts
    a = FULL * k / 8
    shell.box((r_top * math.cos(a), r_top * math.sin(a), z_top + 0.4), (0.12, 0.12, 0.6), TRIM, yaw=a)
cone(r_top + 0.35, z_top + 0.7, 0.05, z_top + 0.7 + (r_top + 0.3) * tp, 0.12, TILE, shell)   # its cap
# ridges of cover tiles running down the cone
for k in range(32):
    a = FULL * k / 32
    c0 = Vector((r_eave * math.cos(a), r_eave * math.sin(a), z_eave))
    c1 = Vector((r_top * math.cos(a), r_top * math.sin(a), z_top))
    mid, L = (c0 + c1) / 2, (c1 - c0).length
    M = Matrix.Translation(mid) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Rotation(math.atan(tp), 4, "Y")
    g = bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((L, 0.12, 0.08, 1)))
    s = shell.slot(TILE)
    for f in {f for v in g["verts"] for f in v.link_faces}:
        f.material_index = s

# --- columns inside, between the door axes ---------------------------------------------------
cd = P["col_d"]
for j in range(P["columns"]):
    a = pa + FULL * (j + 0.5) / P["columns"]
    rr = P["col_r"]
    top = z_eave - 0.19 + (r_eave - rr) * tp - 0.3  # the ring beam above it
    c = Vector((rr * math.cos(a), rr * math.sin(a), 0))
    shell.box(c + Vector((0, 0, 0.1)), (cd * 1.3, cd * 1.3, 0.2), TRIM, yaw=a)
    shell.cyl(c + Vector((0, 0, 0.2)), cd / 2, cd * 0.43, top - 0.2 - 0.35, LIME)
    shell.box(c + Vector((0, 0, top - 0.2)), (cd * 1.3, cd * 1.3, 0.3), TRIM, yaw=a)
# a timber ring beam on the columns
zb = z_eave - 0.19 + (r_eave - P["col_r"]) * tp
shell.grid(arc(P["col_r"] - 0.25, P["col_r"] + 0.25, 0, FULL, zb - 0.3, zb - 0.05, SEG + 1), UNDER)

# --- porch: a platform, two columns and antae, a gabled roof ---------------------------------
PM = Matrix.Rotation(pa, 4, "Z")      # porch frame: +x outwards
pd, pw = P["porch_d"], P["porch_w"]
x0 = RO - 0.3
floor.prism([(x0, -pw / 2 - 0.3), (x0 + pd + 0.3, -pw / 2 - 0.3), (x0 + pd + 0.3, pw / 2 + 0.3), (x0, pw / 2 + 0.3)], -B, 0.0, TRIM, PM)
floor.prism([(x0 + pd + 0.3, -pw / 2), (x0 + pd + 0.6, -pw / 2), (x0 + pd + 0.6, pw / 2), (x0 + pd + 0.3, pw / 2)], -B, -B / 2, TRIM, PM)
ph = P["door_h"] + 0.6                      # height of the porch's architrave
for y in (-pw / 2 + 0.3, pw / 2 - 0.3):
    c = PM @ Vector((x0 + pd, y, 0))
    shell.cyl(c, 0.24, 0.2, ph, LIME)
    shell.prism([(x0, y - 0.25), (x0 + 0.5, y - 0.25), (x0 + 0.5, y + 0.25), (x0, y + 0.25)], 0, ph, LIME, PM)   # anta
shell.prism([(x0, -pw / 2), (x0 + pd + 0.3, -pw / 2), (x0 + pd + 0.3, pw / 2), (x0, pw / 2)], ph, ph + 0.45, TRIM, PM)
# the gable: a ridge along the porch's axis, sloping to the sides
rise = (pw / 2 + 0.2) * math.tan(math.radians(22))
for s in (-1, 1):
    s_ = shell.slot(TILE)
    q = [PM @ Vector(v) for v in ((x0 - 0.2, 0, ph + 0.45 + rise), (x0 + pd + 0.5, 0, ph + 0.45 + rise),
                                  (x0 + pd + 0.5, s * (pw / 2 + 0.2), ph + 0.45), (x0 - 0.2, s * (pw / 2 + 0.2), ph + 0.45))]
    lo = [v - Vector((0, 0, 0.12)) for v in q]
    vs = [shell.bm.verts.new(v) for v in q + lo]
    for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        shell.bm.faces.new([vs[i] for i in f]).material_index = s_
# the pediment: a triangle at the front
s_ = shell.slot(TRIM)
tri = [PM @ Vector(v) for v in ((x0 + pd + 0.3, -pw / 2, ph + 0.45), (x0 + pd + 0.3, pw / 2, ph + 0.45), (x0 + pd + 0.3, 0, ph + 0.45 + rise - 0.05))]
back = [v - PM.to_3x3() @ Vector((0.25, 0, 0)) for v in tri]
vs = [shell.bm.verts.new(v) for v in tri + back]
for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
    shell.bm.faces.new([vs[i] for i in f]).material_index = s_

# --- podium ---------------------------------------------------------------------------------
pr = P["podium"]
floor.grid(arc(0.0, pr, 0, FULL, 0.0, 0.2, 64), TRIM)
floor.grid(arc(0.0, pr - 0.35, 0, FULL, 0.2, 0.4, 64), TRIM)
PZ = 0.4
f_ = Vector((math.cos(pa), math.sin(pa), 0))          # the holder faces the porch door
side = Vector((-f_.y, f_.x, 0))
seat = -f_ * 0.35
furn.box(seat + Vector((0, 0, PZ + 0.22)), (0.5, 0.55, 0.44), TRIM, yaw=pa)                  # stone seat
furn.box(seat - f_ * 0.27 + Vector((0, 0, PZ + 0.62)), (0.08, 0.55, 0.8), TRIM, yaw=pa)      # its back
desk = f_ * 0.35
furn.box(desk + Vector((0, 0, PZ + 0.72)), (0.5, 0.9, 0.08), WOOD, yaw=pa)
for s in (-1, 1):
    furn.box(desk + side * 0.38 * s + Vector((0, 0, PZ + 0.34)), (0.4, 0.06, 0.68), WOOD, yaw=pa)
furn.box(desk + Vector((0, 0, PZ + 0.78)), (0.22, 0.3, 0.04), WAX, yaw=pa)                  # tablets on the desk
post = side * 0.85 + f_ * 0.1
furn.box(post + Vector((0, 0, PZ + 0.9)), (0.08, 0.08, 1.8), WOOD)
furn.box(post + Vector((0, 0, PZ + 1.55)) + f_ * 0.05, (0.04, 0.7, 0.5), BOARD, yaw=pa)      # the board

# --- benches along the wall, each with a stand of wax tablets --------------------------------
benches = []
pad = (P["door_w"] / 2 + 0.45) / R
for d in doors:
    a0, a1 = d + pad, d + FULL / N - pad
    n = P["benches"]
    step = (a1 - a0) / n
    for k in range(n):
        b0, b1 = a0 + step * k + 0.05, a0 + step * (k + 1) - 0.05
        stand_a = b1 - 0.28 / R
        furn.grid(arc(R - 0.5, R, b0, stand_a - 0.12 / R, 0, 0.45), TRIM)                     # seat
        furn.grid(arc(R - 0.08, R, b0, stand_a - 0.12 / R, 0.45, 1.0), TRIM)                  # back slab
        c = Vector((math.cos(stand_a) * (R - 0.3), math.sin(stand_a) * (R - 0.3), 0))
        furn.box(c + Vector((0, 0, 0.38)), (0.34, 0.34, 0.76), TRIM, yaw=stand_a)
        furn.box(c + Vector((0, 0, 0.79)), (0.24, 0.3, 0.06), WAX, yaw=stand_a)               # the tablets
        mid = (b0 + stand_a) / 2
        benches.append({"seat": Vector((math.cos(mid) * (R - 0.3), math.sin(mid) * (R - 0.3), 0.45)),
                        "stand": c})

objs = [shell.finish(), floor.finish(), furn.finish()]

ex = lambda v: [round(v.x, 3), round(-v.y, 3)]
info = {
    "_note": "Written by art/sets/tholos.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0], the pad (ground outside the base) at y = -base. "
             "`seat`: where a legislator sits on a bench (seat height 0.45), `stand`: their "
             "tablets; the podium's floor is at podium_top.",
    "params": P,
    "podium_top": PZ,
    "roof_top": round(z_top + 0.7 + (r_top + 0.3) * tp, 2),
    "benches": [{"seat": ex(b["seat"]), "stand": ex(b["stand"])} for b in benches],
    "podium": {"seat": ex(seat), "desk": ex(desk), "board": ex(post)},
    "doors": [ex(Vector((math.cos(d) * R, math.sin(d) * R, 0))) for d in doors],
}
json.dump(info, open("art/sets/tholos.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/tholos.glb", use_selection=True)
print("THOLOS", len(benches), "benches, top", info["roof_top"], ",",
      sum(len(o.data.polygons) for o in objs), "faces")
