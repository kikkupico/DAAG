"""The Chamber of Paxos, inside: a parametric set for the previs.

    blender -b -P art/sets/chamber.py [-- key=value ...]      # e.g. -- desks=18 doors=10

Writes art/sets/chamber.glb and art/sets/chamber.json. A round hall under a hard stone
dome (Lamport: "the acoustics of the Chamber were poor, making oratory impossible"), with
no podium, no head of the room and nothing aimed at a speaker:
- a drum with open doorways all round, since legislators and messengers come and go;
- a ring of free-standing columns carrying an entablature;
- a coffered hemispherical dome with an oculus;
- a marble floor with inlaid rings and a bronze meridian line running north-south under
  the oculus (Paxos tells time by the sun);
- writing desks with stools, scattered and facing every which way;
- stone benches along the wall between the doorways, where messengers wait.

The GLB is in the set's own frame: metres, the centre of the floor at the origin, axes as
explorer.html's (north = -X), so render.py and the explorer place it at the rotunda's site
given in art/sets/sets.json. Its objects are `shell` (walls, columns, dome), `floor` (what
people stand on) and `furniture` (desks, stools and benches, which props can stand on).
chamber.json lists each desk, its stool and its facing, in the set's frame, for placing
the cast and props.
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix

P = dict(
    radius=9.0,        # inside of the drum
    wall=1.0,          # drum wall thickness
    drum_h=7.0,        # floor to the dome's springing
    doors=8,           # open doorways round the drum
    door_w=2.2, door_h=4.2,
    columns=16,        # free-standing ring, two per doorway, flanking it
    col_d=0.62, col_h=5.4, entab_h=0.9, col_gap=0.9,   # col_gap: column axis to the wall
    coffer_rings=5, coffer_ribs=24, oculus=1.6,          # oculus radius
    desks=14, seed=7, desk_gap=2.6,                      # desk_gap: least distance between desks
    meridian=1, benches=1,
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T = P["radius"], P["wall"]
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


MARBLE = material("marble", (0.82, 0.79, 0.72), 0.45)
STONE = material("stone", (0.72, 0.68, 0.6), 0.8)
COFFER = material("coffer", (0.6, 0.57, 0.52), 0.85)
FLOOR = material("floor", (0.86, 0.84, 0.8), 0.3)
INLAY = material("inlay", (0.42, 0.44, 0.46), 0.3)
RED = material("porphyry", (0.4, 0.14, 0.12), 0.3)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)
WOOD = material("wood", (0.33, 0.2, 0.1), 0.7)


class Part:
    """Collects solids (as bmesh geometry) into one object, one material slot each."""
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def grid(self, pts, mat, closed_u=False, cap=True):
        """pts[i][j]: a solid swept as rows i (e.g. inner/outer or bottom/top) of rings j.
        Faces join neighbouring points; rows wrap into a closed tube."""
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


def shell_patch(r_in, r_out, a0, a1, e0, e1, na, ne, z0):
    """Points of a piece of spherical shell (centre at height z0): azimuth a0..a1, elevation
    e0..e1, as rows inner/outer x elevation, closed round in azimuth when a full turn."""
    full = abs(a1 - a0) >= 2 * math.pi - 1e-6
    ang = [a0 + (a1 - a0) * j / (na if full else na - 1) for j in range(na)]
    pts = lambda r, e: [(r * math.cos(e) * math.cos(a), r * math.cos(e) * math.sin(a), z0 + r * math.sin(e)) for a in ang]
    els = [e0 + (e1 - e0) * i / (ne - 1) for i in range(ne)]
    return [pts(r_in, e) for e in els] + [pts(r_out, e) for e in reversed(els)], full


shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- drum, with doorways -----------------------------------------------------------------
N = P["doors"]
half = (P["door_w"] / 2) / R            # a doorway's half-angle at the inner face
doors = [2 * math.pi * i / N for i in range(N)]
for i, d in enumerate(doors):
    nxt = d + 2 * math.pi / N
    shell.grid(arc(R, R + T, d + half, nxt - half, 0, P["drum_h"]), STONE)           # pier
    shell.grid(arc(R, R + T, d - half, d + half, P["door_h"], P["drum_h"], 4), STONE)  # over the door
    # door frame: a projecting architrave round each opening
    for s in (-1, 1):
        a = d + s * (half + 0.12 / R)
        shell.box((math.cos(a) * (R - 0.04), math.sin(a) * (R - 0.04), P["door_h"] / 2),
                  (0.12, 0.24, P["door_h"]), MARBLE, yaw=a)
    shell.box((math.cos(d) * (R - 0.04), math.sin(d) * (R - 0.04), P["door_h"] + 0.1),
              (0.12, P["door_w"] + 0.48, 0.2), MARBLE, yaw=d)
# cornice at the springing, and a plinth course
shell.grid(arc(R - 0.35, R, 0, 2 * math.pi, P["drum_h"] - 0.35, P["drum_h"], SEG + 1), MARBLE)
for d in doors:
    nxt = d + 2 * math.pi / N
    shell.grid(arc(R - 0.08, R, d + half, nxt - half, 0, 0.3), MARBLE)

# --- columns and entablature -----------------------------------------------------------
rc = R - P["col_gap"]
cd, ch = P["col_d"], P["col_h"]
for j in range(P["columns"]):
    a = 2 * math.pi * (j + 0.5) / P["columns"]
    c = Vector((rc * math.cos(a), rc * math.sin(a), 0))
    shell.box(c + Vector((0, 0, 0.12)), (cd * 1.35, cd * 1.35, 0.24), MARBLE, yaw=a)        # plinth
    shell.cyl(c + Vector((0, 0, 0.24)), cd * 0.62, cd * 0.62, 0.14, MARBLE)                  # torus
    shell.cyl(c + Vector((0, 0, 0.38)), cd / 2, cd * 0.42, ch - 0.38 - 0.55, MARBLE)        # tapering shaft
    shell.cyl(c + Vector((0, 0, ch - 0.55)), cd * 0.42, cd * 0.62, 0.3, MARBLE)             # echinus
    shell.box(c + Vector((0, 0, ch - 0.125)), (cd * 1.4, cd * 1.4, 0.25), MARBLE, yaw=a)    # abacus
shell.grid(arc(rc - cd * 0.75, R, 0, 2 * math.pi, ch, ch + P["entab_h"], SEG + 1), MARBLE)

# --- dome: shell, coffer ribs and rings, oculus ------------------------------------------
zs = P["drum_h"]
e_top = math.acos(P["oculus"] / R)
pts, full = shell_patch(R, R + 0.7, 0, 2 * math.pi, 0, e_top, SEG, 24, zs)
shell.grid(pts, COFFER, closed_u=True)
depth, rib = 0.28, 0.16
e_ring_top = e_top * 0.78                  # the coffered band stops short of a smooth crown
for k in range(P["coffer_ribs"]):
    a = 2 * math.pi * k / P["coffer_ribs"]
    w = rib / R
    p, _ = shell_patch(R - depth, R, a - w, a + w, 0, e_ring_top, 2, 16, zs)
    shell.grid(p, STONE)
for k in range(P["coffer_rings"] + 1):
    e = e_ring_top * k / P["coffer_rings"]
    w = rib / R
    p, _ = shell_patch(R - depth, R, 0, 2 * math.pi, max(e - w, 0), e + w, SEG, 2, zs)
    shell.grid(p, STONE, closed_u=True)
# the oculus rim
p, _ = shell_patch(R - 0.1, R + 0.8, 0, 2 * math.pi, e_top - 0.04, e_top, 48, 2, zs)
shell.grid(p, MARBLE, closed_u=True)

# --- floor -----------------------------------------------------------------------------
floor.grid(arc(0.0, R + T + 0.6, 0, 2 * math.pi, -0.3, 0.0, SEG + 1), FLOOR)
for r0, r1, m in ((1.6, 1.75, INLAY), (1.75, 1.95, RED), (1.95, 2.1, INLAY),
                  (R - 1.55, R - 1.4, INLAY)):
    floor.grid(arc(r0, r1, 0, 2 * math.pi, 0.0, 0.004, SEG + 1), m)
for d in doors:  # a threshold slab in each doorway
    floor.box((math.cos(d) * (R + T / 2), math.sin(d) * (R + T / 2), 0.002), (T + 0.2, P["door_w"], 0.004), INLAY, yaw=d)
if P["meridian"]:
    # north-south along x, under the oculus; a cross-bar every metre
    floor.box((0, 0, 0.005), (2 * (R - 0.6), 0.06, 0.006), BRONZE)
    for x in range(-int(R - 1), int(R - 1) + 1):
        floor.box((x, 0, 0.005), (0.03, 0.3 if x % 5 else 0.5, 0.006), BRONZE)

# --- desks, stools and benches ---------------------------------------------------------
rng = random.Random(P["seed"])
desks = []
tries = 0
while len(desks) < P["desks"] and tries < 20000:
    tries += 1
    r = math.sqrt(rng.uniform(2.6 ** 2, (rc - 1.6) ** 2))
    a = rng.uniform(0, 2 * math.pi)
    c = Vector((r * math.cos(a), r * math.sin(a), 0))
    if abs(c.y) < 1.2 and P["meridian"]:
        continue                     # keep the meridian line clear
    if any(abs(math.atan2(math.sin(a - d), math.cos(a - d))) * r < P["door_w"] / 2 + 0.6 and r > rc - 3
           for d in doors):
        continue                     # and the ways in from the doorways
    if all((c - q["c"]).length >= P["desk_gap"] for q in desks):
        desks.append({"c": c, "yaw": rng.uniform(0, 2 * math.pi)})

DESK_TOP = 0.76
for q in desks:
    c, yaw = q["c"], q["yaw"]
    f = Vector((math.cos(yaw), math.sin(yaw), 0))          # the way the writer faces
    side = Vector((-f.y, f.x, 0))
    furn.box(c + Vector((0, 0, DESK_TOP - 0.04)), (0.62, 1.15, 0.08), MARBLE, yaw=yaw)
    for s in (-1, 1):
        furn.box(c + side * 0.46 * s + Vector((0, 0, (DESK_TOP - 0.08) / 2)), (0.5, 0.1, DESK_TOP - 0.08), STONE, yaw=yaw)
    st = c - f * 0.62
    furn.box(st + Vector((0, 0, 0.42)), (0.36, 0.42, 0.06), WOOD, yaw=yaw)
    for dx in (-0.14, 0.14):
        for dy in (-0.17, 0.17):
            leg = st + f * dx + side * dy
            furn.box(leg + Vector((0, 0, 0.2)), (0.04, 0.04, 0.4), WOOD, yaw=yaw)
    q["stool"], q["f"] = st, f

if P["benches"]:
    for d in doors:
        nxt = d + 2 * math.pi / N
        pad = (P["door_w"] / 2 + 0.7) / R
        furn.grid(arc(R - 0.48, R, d + pad, nxt - pad, 0, 0.45), STONE)

objs = [shell.finish(), floor.finish(), furn.finish()]

# Blender (x, y, z) -> glTF/explorer (x, z, -y): explorer x = blender x, explorer z = -blender y
ex = lambda v: [round(v.x, 3), round(-v.y, 3)]
info = {
    "_note": "Written by art/sets/chamber.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0]. `desk`: the desk's centre, top at `top` m; "
             "`stool`: where the writer sits (pose sit-high); `face`: a point the writer faces.",
    "params": P,
    "top": DESK_TOP,
    "desks": [{"desk": ex(q["c"]), "stool": ex(q["stool"]), "face": ex(q["c"] + q["f"])} for q in desks],
    "doors": [ex(Vector((math.cos(d) * R, math.sin(d) * R, 0))) for d in doors],
}
json.dump(info, open("art/sets/chamber.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/chamber.glb", use_selection=True)
print("CHAMBER", len(desks), "desks,", sum(len(o.data.polygons) for o in objs), "faces")
