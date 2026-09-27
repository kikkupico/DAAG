"""The Chamber of Paxos: a parametric set for the island model and the previs.

    blender -b -P art/sets/chamber.py [-- key=value ...]      # e.g. -- desks=8 doors=8

Writes art/sets/chamber.glb and art/sets/chamber.json. A round hall under a hard stone
dome (Lamport: "the acoustics of the Chamber were poor, making oratory impossible"), with
no podium, no head of the room and nothing aimed at a speaker:
- a white marble drum ringed outside by a Doric colonnade on a stepped base, the colonnade's
  flat roof running round the drum below the dome;
- open doorways all round the drum, since legislators and messengers come and go;
- a shallow coffered dome with an oculus, and a bronze meridian line running north-south
  under it on the floor (Paxos tells time by the sun);
- writing desks with stools, scattered and facing every which way;
- stone benches along the wall between the doorways, where messengers wait;
- statues on pedestals round the terrace outside, one of which, in Lamport, falls.

It is the size of the rotunda Meshy drew on the island model (about as wide as the Tholos
across the bay), so inside it is small: a handful of desks. The GLB is in the set's own
frame: metres, the centre of the floor at the origin, axes as explorer.html's (north = -X).
Its objects are `shell` (drum, colonnade, dome, statues), `floor` (floor, steps, terrace
paving, what people stand on) and `furniture` (desks, stools and benches, which props can
stand on). chamber.json lists each desk, its stool and its facing, in the set's frame, for
placing the cast and props. art/sets/bake.py joins it into the island model at its
site in sets.json.
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix

P = dict(
    radius=4.3,        # inside of the drum
    wall=0.6,          # drum wall thickness
    base=0.35,         # the stepped base the floor stands on
    drum_h=6.95,       # floor to the dome's springing
    dome_rise=2.75,    # the dome's rise above its springing (shallow, as on the island model)
    doors=8,           # open doorways round the drum
    door_w=1.5, door_h=3.1,
    columns=20, col_r=6.0, col_d=0.52, col_h=4.35,   # the colonnade outside
    entab_h=0.8, peri_r=6.45,                        # its entablature and roof's outer edge
    coffer_rings=4, coffer_ribs=20, oculus=0.8,
    desks=8, seed=3, desk_gap=1.6,                   # desk_gap: least distance between desks
    meridian=1, benches=1,
    statues=8, statue_r=8.1, terrace=9.0,            # pedestals round the terrace; its paving
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T, B = P["radius"], P["wall"], P["base"]
RO = R + T
SEG = 96
FULL = 2 * math.pi

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


MARBLE = material("marble", (0.86, 0.84, 0.8), 0.45)
STONE = material("stone", (0.78, 0.75, 0.69), 0.8)
COFFER = material("coffer", (0.66, 0.63, 0.58), 0.85)
FLOOR = material("floor", (0.86, 0.84, 0.8), 0.3)
PAVING = material("terrace", (0.7, 0.67, 0.6), 0.9)
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

    def sphere(self, c, r, mat, squash=1.0):
        g = bmesh.ops.create_uvsphere(self.bm, u_segments=16, v_segments=10, radius=r,
                                      matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((1, 1, squash, 1)))
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
    n = segs or max(2, int(abs(a1 - a0) / FULL * SEG) + 1)
    ang = [a0 + (a1 - a0) * j / (n - 1) for j in range(n)]
    ring = lambda r, z: [(r * math.cos(a), r * math.sin(a), z) for a in ang]
    return [ring(r_in, z0), ring(r_out, z0), ring(r_out, z1), ring(r_in, z1)]


# The dome is a spherical cap: base radius `a` at the springing, rise `h`.
def cap_point(r_base, rise, frac, ang, zs, grow=0.0):
    """A point on the cap (frac 0 at the springing, 1 at the crown), pushed out by `grow`."""
    Rs = (r_base ** 2 + rise ** 2) / (2 * rise)            # sphere radius
    e0 = math.asin(r_base / Rs)                             # half-angle of the cap
    e = e0 * (1 - frac)
    zc = zs + rise - Rs                                     # sphere centre height
    rr = Rs + grow
    return (rr * math.sin(e) * math.cos(ang), rr * math.sin(e) * math.sin(ang), zc + rr * math.cos(e))


def cap_band(r_base, rise, f0, f1, g0, g1, zs, a0=0.0, a1=FULL, na=SEG, nf=12):
    """Points of a band of the cap between fractions f0..f1 and growths g0..g1 (inner/outer),
    as rows for Part.grid."""
    full = abs(a1 - a0) >= FULL - 1e-6
    ang = [a0 + (a1 - a0) * j / (na if full else na - 1) for j in range(na)]
    fr = [f0 + (f1 - f0) * i / (nf - 1) for i in range(nf)]
    rows = [[cap_point(r_base, rise, f, a, zs, g0) for a in ang] for f in fr]
    rows += [[cap_point(r_base, rise, f, a, zs, g1) for a in ang] for f in reversed(fr)]
    return rows, full


shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- base and terrace paving; the terrace is at -B ------------------------------------------
floor.grid(arc(0.0, P["terrace"], 0, FULL, -B - 0.3, -B, SEG + 1), PAVING)
floor.grid(arc(0.0, P["peri_r"] + 0.55, 0, FULL, -B, -B / 2, SEG + 1), MARBLE)
floor.grid(arc(0.0, P["peri_r"] + 0.25, 0, FULL, -B / 2, 0.0, SEG + 1), MARBLE)

# --- drum, with doorways -----------------------------------------------------------------
N = P["doors"]
H = P["drum_h"]
half = (P["door_w"] / 2) / R
doors = [FULL * i / N for i in range(N)]
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(R, RO, d + half, nxt - half, 0, H), STONE)                         # pier
    shell.grid(arc(R, RO, d - half, d + half, P["door_h"], H, 4), STONE)              # over the door
    for s in (-1, 1):                                                                  # architraves
        a = d + s * (half + 0.1 / R)
        for rr in (R - 0.03, RO + 0.03):
            shell.box((math.cos(a) * rr, math.sin(a) * rr, P["door_h"] / 2), (0.1, 0.2, P["door_h"]), MARBLE, yaw=a)
    for rr in (R - 0.03, RO + 0.03):
        shell.box((math.cos(d) * rr, math.sin(d) * rr, P["door_h"] + 0.1), (0.1, P["door_w"] + 0.4, 0.2), MARBLE, yaw=d)
    floor.box((math.cos(d) * (R + T / 2), math.sin(d) * (R + T / 2), 0.002), (T + 0.2, P["door_w"], 0.004), INLAY, yaw=d)
# inside: a cornice at the springing and a plinth course; outside: a cornice under the dome
shell.grid(arc(R - 0.3, R, 0, FULL, H - 0.3, H, SEG + 1), MARBLE)
shell.grid(arc(RO, RO + 0.25, 0, FULL, H - 0.3, H, SEG + 1), MARBLE)
for d in doors:
    nxt = d + FULL / N
    shell.grid(arc(R - 0.06, R, d + half, nxt - half, 0, 0.3), MARBLE)

# --- the colonnade outside, its entablature and roof -----------------------------------------
cr, cd, ch = P["col_r"], P["col_d"], P["col_h"]
for j in range(P["columns"]):
    a = FULL * (j + 0.5) / P["columns"]
    c = Vector((cr * math.cos(a), cr * math.sin(a), 0))
    shell.cyl(c, cd / 2, cd * 0.4, ch - 0.35, MARBLE, 16)                               # fluted-less Doric shaft
    shell.cyl(c + Vector((0, 0, ch - 0.35)), cd * 0.4, cd * 0.62, 0.2, MARBLE, 16)      # echinus
    shell.box(c + Vector((0, 0, ch - 0.075)), (cd * 1.3, cd * 1.3, 0.15), MARBLE, yaw=a)  # abacus
eb = cr - cd * 0.7
shell.grid(arc(eb, P["peri_r"], 0, FULL, ch, ch + P["entab_h"] * 0.45, SEG + 1), MARBLE)       # architrave
shell.grid(arc(eb, P["peri_r"] + 0.05, 0, FULL, ch + P["entab_h"] * 0.45, ch + P["entab_h"], SEG + 1), MARBLE)  # frieze
for k in range(P["columns"] * 2):                                                              # triglyphs
    a = FULL * k / (P["columns"] * 2)
    shell.box(((P["peri_r"] + 0.07) * math.cos(a), (P["peri_r"] + 0.07) * math.sin(a), ch + P["entab_h"] * 0.72),
              (0.05, 0.22, P["entab_h"] * 0.5), STONE, yaw=a)
zr = ch + P["entab_h"]
shell.grid(arc(RO, P["peri_r"] + 0.2, 0, FULL, zr, zr + 0.3, SEG + 1), MARBLE)                  # the flat roof and cornice
shell.grid(arc(RO, eb, 0, FULL, ch - 0.05, ch + 0.05, SEG + 1), COFFER)                         # the colonnade's ceiling

# --- dome: shell, coffer ribs and rings, oculus ------------------------------------------
rise, zs = P["dome_rise"], H
ocf = 1 - P["oculus"] / R                 # the fraction at which the oculus opens (approximately)
pts, full = cap_band(RO + 0.05, rise, 0.0, ocf, -0.6, 0.0, zs)
shell.grid(pts, MARBLE, closed_u=True)
depth, rib = 0.22, 0.14
top_band = ocf * 0.8
for k in range(P["coffer_ribs"]):
    a = FULL * k / P["coffer_ribs"]
    w = rib / R
    p, _ = cap_band(RO + 0.05, rise, 0.0, top_band, -0.6 - depth, -0.6, zs, a - w, a + w, 2, 10)
    shell.grid(p, STONE)
for k in range(P["coffer_rings"] + 1):
    f = top_band * k / P["coffer_rings"]
    p, _ = cap_band(RO + 0.05, rise, max(f - 0.02, 0), f + 0.02, -0.6 - depth, -0.6, zs, 0, FULL, SEG, 2)
    shell.grid(p, STONE, closed_u=True)
p, _ = cap_band(RO + 0.05, rise, ocf - 0.03, ocf, -0.7, 0.1, zs, 0, FULL, 48, 2)             # the oculus rim
shell.grid(p, MARBLE, closed_u=True)

# --- floor -----------------------------------------------------------------------------
for r0, r1, m in ((1.0, 1.1, INLAY), (1.1, 1.25, RED), (1.25, 1.35, INLAY), (R - 0.9, R - 0.8, INLAY)):
    floor.grid(arc(r0, r1, 0, FULL, 0.0, 0.004, SEG + 1), m)
if P["meridian"]:
    # north-south along x, under the oculus; a cross-bar every metre
    floor.box((0, 0, 0.005), (2 * (R - 0.4), 0.05, 0.006), BRONZE)
    for x in range(-int(R - 0.5), int(R - 0.5) + 1):
        floor.box((x, 0, 0.005), (0.03, 0.25 if x % 5 else 0.4, 0.006), BRONZE)

# --- desks, stools and benches ---------------------------------------------------------
rng = random.Random(P["seed"])
desks = []
tries = 0
bench_depth = 0.45
while len(desks) < P["desks"] and tries < 50000:
    tries += 1
    r = math.sqrt(rng.uniform(1.4 ** 2, (R - bench_depth - 0.75) ** 2))
    a = rng.uniform(0, FULL)
    c = Vector((r * math.cos(a), r * math.sin(a), 0))
    if abs(c.y) < 0.8 and P["meridian"]:
        continue                     # keep the meridian line clear
    if any(abs(math.atan2(math.sin(a - d), math.cos(a - d))) * r < P["door_w"] / 2 + 0.4 and r > R - 1.9
           for d in doors):
        continue                     # and the ways in from the doorways
    if all((c - q["c"]).length >= P["desk_gap"] for q in desks):
        desks.append({"c": c, "yaw": rng.uniform(0, FULL)})

DESK_TOP = 0.76
for q in desks:
    c, yaw = q["c"], q["yaw"]
    f = Vector((math.cos(yaw), math.sin(yaw), 0))          # the way the writer faces
    side = Vector((-f.y, f.x, 0))
    furn.box(c + Vector((0, 0, DESK_TOP - 0.04)), (0.55, 1.0, 0.08), MARBLE, yaw=yaw)
    for s in (-1, 1):
        furn.box(c + side * 0.4 * s + Vector((0, 0, (DESK_TOP - 0.08) / 2)), (0.45, 0.1, DESK_TOP - 0.08), STONE, yaw=yaw)
    st = c - f * 0.58
    furn.box(st + Vector((0, 0, 0.42)), (0.36, 0.42, 0.06), WOOD, yaw=yaw)
    for dx in (-0.14, 0.14):
        for dy in (-0.17, 0.17):
            leg = st + f * dx + side * dy
            furn.box(leg + Vector((0, 0, 0.2)), (0.04, 0.04, 0.4), WOOD, yaw=yaw)
    q["stool"], q["f"] = st, f

if P["benches"]:
    for d in doors:
        nxt = d + FULL / N
        pad = (P["door_w"] / 2 + 0.35) / R
        furn.grid(arc(R - bench_depth, R, d + pad, nxt - pad, 0, 0.45), STONE)

# --- statues round the terrace, on the pier axes so the ways to the doors stay clear --------
for k in range(P["statues"]):
    a = FULL * (k + 0.5) / P["statues"]
    c = Vector((P["statue_r"] * math.cos(a), P["statue_r"] * math.sin(a), -B))
    shell.box(c + Vector((0, 0, 0.6)), (0.8, 0.8, 1.2), MARBLE, yaw=a)                   # pedestal
    shell.box(c + Vector((0, 0, 1.25)), (0.9, 0.9, 0.1), MARBLE, yaw=a)
    shell.cyl(c + Vector((0, 0, 1.3)), 0.26, 0.2, 1.25, MARBLE, 12)                        # a draped figure
    shell.sphere(c + Vector((0, 0, 2.7)), 0.13, MARBLE, 1.2)

objs = [shell.finish(), floor.finish(), furn.finish()]

# Blender (x, y, z) -> glTF/explorer (x, z, -y): explorer x = blender x, explorer z = -blender y
ex = lambda v: [round(v.x, 3), round(-v.y, 3)]
info = {
    "_note": "Written by art/sets/chamber.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0], the terrace at y = -base. `desk`: the desk's "
             "centre, top at `top` m; `stool`: where the writer sits (pose sit-high); `face`: "
             "a point the writer faces.",
    "params": P,
    "top": DESK_TOP,
    "desks": [{"desk": ex(q["c"]), "stool": ex(q["stool"]), "face": ex(q["c"] + q["f"])} for q in desks],
    "doors": [ex(Vector((math.cos(d) * R, math.sin(d) * R, 0))) for d in doors],
}
json.dump(info, open("art/sets/chamber.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/chamber.glb", use_selection=True)
print("CHAMBER", len(desks), "desks,", sum(len(o.data.polygons) for o in objs), "faces")
