"""The Tholos of Schedia, modelled on the Athenian Tholos, in enough detail that a previs render
already shows every part of the building: nothing of it is left for an image model to make up.

    blender -b -P art/sets/schedia_tholos.py [-- key=value ...]

Writes art/sets/schedia-tholos.glb and schedia-tholos.json.
The Athenian Tholos stood in the Agora's west side (c. 465 BC; Homer Thompson, The Tholos of Athens
and Its Predecessors, 1940): a plain round hall about eighteen metres across, no colonnade outside,
six columns inside carrying a conical tiled roof, where the prytaneis on duty ate and slept. Its
dimensions here are from memory and unchecked. Where the Chamber (paxos_chamber.py) is white marble
inside a Doric colonnade with a coffered ceiling, this is the plainer round hall beside it:
- a plain drum of honey limestone on a two-step base, no colonnade outside, with a small columned
  porch (two columns between antae and a gable) facing the court, and one doorway behind it, its
  plain timber leaves of upright boards on ledges, strapped and studded in iron, hung inward;
- a low conical roof of oxblood tiles on exposed timber rafters and two purlin rings, rising to a
  small louvred lantern whose opening lights the podium (no ceiling: the roof is the ceiling);
- six plain columns inside, the Athenian number, built of drums, carrying a ring of squared beams
  with a brace each side; the door axis falls between
  two of them, so the way from the door to the podium is clear;
- twelve benches round the wall, each with a back slab and a stand of wax tablets (Schedia keeps its
  law in wax, not ink), broken only by the doorway;
- a low round two-step podium at the centre with a high-backed stone seat, a writing desk and a
  board on a post for the board's number. It has no lectern: nobody speaks from it.

The GLB is in the set's frame: metres, the centre of the floor at the origin, axes as explorer.html's
(north = -X), the porch facing `porch` degrees (0 is +x); objects `shell`, `floor`, `furniture` and `door`.

What is modelled, so that it need not be described to an image model (the helpers are masonry.py's):
- the drum, inside and out, as coursed ashlar in three shades of honey limestone: orthostates, a
  string course, even courses in running bond, a plain frieze band and a cornice;
- the doorway with a two-fascia frame and a lintel on both faces, stone reveals and a threshold;
- the roof tile by tile, with antefixes at the eaves; under it the boarding, 48 rafters, two
  purlin rings, and the lantern with its curb, posts, louvres, tiled cap and finial;
- the porch: a platform of blocks with a step, two plain columns and two antae with capitals, an
  architrave, a plain frieze, a pediment with a recessed field and raking cornices, a tiled gable
  with a ridge;
- the floor as rings of flagstones between two dark bands; the base's two steps as blocks;
- the podium as two rings of blocks with its seat (arms, a rounded back), a framed desk with a
  stack of tablets, and the board in a frame on a footed post;
- each bench as a seat slab on a jointed body with a capped back slab, and each stand as a small
  pedestal with a stack of three wax tablets in wooden frames.
"""
import bpy, bmesh, json, math, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
from masonry import *       # Part, arc, slab, courses, paving, tiled, material, polar, rnd

P = dict(
    radius=8.1,        # inside of the drum
    wall=0.95,         # drum wall thickness
    drum_h=6.4,        # floor to the top of the cornice
    base=0.45,         # the two-step base the floor stands on
    porch=-41.0,       # the porch's facing, degrees in the set's frame (the court, to the SW); 0 is +x
    door_w=2.2, door_h=3.9, door_open=70.0,   # the one doorway, behind the porch
    porch_d=2.8, porch_w=5.0,
    pitch=24.0,        # roof pitch, degrees
    eaves=0.55,        # the roof's overhang beyond the drum
    lantern=0.9,       # radius of the opening at the top of the roof
    columns=6, col_r=4.6, col_d=0.7,
    benches=12,        # benches round the wall
    podium=1.6,
)
for arg in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []:
    k, v = arg.split("=")
    P[k] = type(P[k])(float(v)) if isinstance(P[k], float) else int(v)

R, T, H, B = P["radius"], P["wall"], P["drum_h"], P["base"]
RO = R + T

bpy.ops.wm.read_factory_settings(use_empty=True)

LIME = material("honey-limestone", (0.62, 0.48, 0.3), 0.85)
LIME_B = material("honey-limestone_b", (0.57, 0.44, 0.28), 0.85)
LIME_C = material("honey-limestone_c", (0.66, 0.52, 0.33), 0.85)
ASHLAR = [LIME, LIME, LIME_B, LIME_C]
TRIM = material("limestone-trim", (0.7, 0.58, 0.4), 0.75)
TRIM_B = material("limestone-trim_b", (0.74, 0.63, 0.45), 0.75)
JOINT = material("joint", (0.3, 0.23, 0.15), 0.9)
TILES = [material("oxblood-tile", (0.42, 0.11, 0.07), 0.8), material("oxblood-tile_b", (0.46, 0.14, 0.09), 0.8),
         material("oxblood-tile_c", (0.38, 0.1, 0.07), 0.8)]
RIDGES = [material("oxblood-ridge", (0.34, 0.09, 0.06), 0.8), material("oxblood-ridge_b", (0.38, 0.11, 0.07), 0.8)]
UNDER = material("roof-timber", (0.3, 0.19, 0.1), 0.8)
BOARDS = material("roof-boards", (0.4, 0.27, 0.15), 0.85)
FLAGS = [material("floor", (0.8, 0.76, 0.68), 0.4), material("floor_b", (0.75, 0.7, 0.62), 0.4),
         material("floor_c", (0.83, 0.8, 0.73), 0.4)]
INLAY = material("inlay", (0.42, 0.36, 0.3), 0.4)
WOOD = material("wood", (0.33, 0.2, 0.1), 0.7)
WOOD_B = material("wood_b", (0.4, 0.26, 0.13), 0.7)
WAX = material("wax", (0.68, 0.5, 0.2), 0.45)
BOARD = material("board", (0.86, 0.82, 0.72), 0.7)
BRONZE = material("bronze", (0.62, 0.42, 0.2), 0.35, 0.9)
IRON = material("iron", (0.2, 0.19, 0.18), 0.5, 0.8)

shell, floor, furn = Part("shell"), Part("floor"), Part("furniture")

# --- base: two steps of blocks round the drum; the pad is at -B --------------------------------
for k, ro in enumerate((RO + 0.6, RO + 0.3)):
    z0, z1 = -B + B * k / 2, -B + B * (k + 1) / 2
    floor.grid(arc(0.0, ro - PROUD, 0, FULL, z0, z1 - 0.008, SEG + 1), JOINT)
    paving(floor, ro - 0.6, ro, 56, z0, z1, [TRIM, TRIM_B], off=0.5 * k, gap=GAP)

# --- the floor: rings of flagstones between two dark bands -------------------------------------
pr = P["podium"]
for r0, r1 in ((pr + 0.5, pr + 0.62), (R - 1.0, R - 0.88)):
    paving(floor, r0, r1, 24, -0.008, 0.0, [INLAY], gap=0.008)
half_in = math.asin(P["door_w"] / 2 / R)
half_o = math.asin(P["door_w"] / 2 / RO)
for (r0, r1), n in zip(((pr - 0.2, pr + 0.5), (pr + 0.62, 3.4), (3.4, 4.7), (4.7, 5.9), (5.9, R - 1.0)), (14, 20, 26, 32, 38)):
    paving(floor, r0, r1, n, -0.008, 0.0, FLAGS, off=rnd.random(), gap=0.016)
paving(floor, R - 0.88, R + 0.05, 44, -0.008, 0.0, FLAGS, a0=half_in + 0.02, a1=FULL - half_in - 0.02, gap=0.016)

# --- the drum: a core that shows in the joints, faced with ashlar inside and out ---------------
dw, dh = P["door_w"], P["door_h"]
FRAME = 0.24
WT = H - 0.5                                               # the top of the coursed wall, under the frieze band
shell.grid(arc(R, RO, half_in, FULL - half_in, 0, H), JOINT)
shell.grid(arc(R, RO, -half_in, half_in, dh, H, 5), JOINT)
Z_STRING, N_C = 1.3, 9
course_h = (WT - Z_STRING - 0.1) / N_C
zs = [Z_STRING + 0.1 + course_h * k for k in range(N_C + 1)]
k_door = min(range(N_C + 1), key=lambda k: abs(zs[k] - (dh + 0.3)))
DOOR_TOP = zs[k_door]
for face, rr, hh in ((-1, R, half_in), (1, RO, half_o)):
    r0, r1 = (rr - PROUD, rr + 0.02) if face < 0 else (rr - 0.02, rr + PROUD)
    side = hh + FRAME / rr
    courses(shell, r0, r1, side, FULL - side, [0.0, Z_STRING], 1.25, ASHLAR)                  # orthostates
    courses(shell, r0 - 0.03 * (face < 0), r1 + 0.03 * (face > 0), side, FULL - side,
            [Z_STRING, Z_STRING + 0.1], 2.5, [TRIM])                                          # the string course
    courses(shell, r0, r1, side, FULL - side, zs[:k_door + 1], 1.4, ASHLAR)
    courses(shell, r0, r1, 0, FULL, zs[k_door:], 1.4, ASHLAR)
    courses(shell, r0 - 0.02 * (face < 0), r1 + 0.02 * (face > 0), 0, FULL, [WT, H - 0.2], 1.9, [TRIM, TRIM_B])   # a plain frieze band
courses(shell, RO - 0.02, RO + 0.07, half_o + FRAME / RO, FULL - half_o - FRAME / RO, [0.0, 0.35], 1.25, [TRIM])   # a plinth course
shell.grid(arc(R - 0.1, RO + 0.18, 0, FULL, H - 0.2, H - 0.1, SEG + 1), TRIM_B)                # the cornice, in two steps
shell.grid(arc(R - 0.04, RO + 0.3, 0, FULL, H - 0.1, H, SEG + 1), TRIM)

# --- the doorway: stone reveals and lintel, a two-fascia frame on each face ---------------------
xi, xo = math.sqrt(R * R - dw * dw / 4) - 0.04, math.sqrt(RO * RO - dw * dw / 4) + 0.04
for s_ in (1, -1):                                          # the reveals, square to the door
    hi_, ho_ = half_in + 0.12 / R, half_o + 0.12 / RO
    pts = [(xi, s_ * dw / 2), (xo, s_ * dw / 2), (RO * math.cos(ho_) + 0.03, s_ * RO * math.sin(ho_)),
           (R * math.cos(hi_) - 0.03, s_ * R * math.sin(hi_))]
    shell.prism(pts[::s_], 0.0, dh, TRIM)
lin = [polar(R - 0.03, half_in * (1 - 2 * j / 6)) for j in range(7)] + [polar(RO + 0.03, -half_o * (1 - 2 * j / 6)) for j in range(7)]
shell.prism([(p.x, p.y) for p in lin], dh, dh + 0.28, TRIM_B)
for face, rr, hh in ((-1, R, half_in), (1, RO, half_o)):
    out = lambda d: (rr - d, rr) if face < 0 else (rr, rr + d)
    for w0, w1, d in ((0.0, 0.13, 0.04), (0.12, FRAME, 0.07)):
        for s_ in (1, -1):
            a0, a1 = sorted((s_ * (hh + w0 / rr), s_ * (hh + w1 / rr)))
            shell.grid(arc(*out(d), a0, a1, 0.0, dh + w1), TRIM if d < 0.05 else TRIM_B)
        shell.grid(arc(*out(d), -(hh + w1 / rr), hh + w1 / rr, dh + w0, dh + w1, 9), TRIM if d < 0.05 else TRIM_B)
    shell.grid(arc(*out(0.12), -(hh + (FRAME + 0.08) / rr), hh + (FRAME + 0.08) / rr, dh + FRAME, DOOR_TOP, 9), TRIM)   # a plain cap
floor.box((R + T / 2, 0, -0.04), (xo - xi + 0.3, dw, 0.12), TRIM_B)                              # the threshold, a little raised

# --- roof: a tiled cone on boarding, rafters and two purlin rings (no ceiling), and the lantern --
tp = math.tan(math.radians(P["pitch"]))
r_eave, r_top = RO + P["eaves"], P["lantern"]
z_eave = H - 0.1
z_top = z_eave + (r_eave - r_top) * tp
tiled(shell, r_eave, z_eave + 0.05, r_top, z_top + 0.05, 96, 0.7, 0.16, TILES, RIDGES, BOARDS)
zu = lambda r: z_eave - 0.19 + (r_eave - r) * tp            # the boarding's underside
for k in range(48):
    a = FULL * k / 48
    shell.strut(polar(r_eave - 0.05, a, zu(r_eave - 0.05) + 0.06), polar(r_top + 0.1, a, zu(r_top + 0.1) + 0.06), 0.13, 0.2, UNDER)
for rr in (7.0, 2.4):                                        # purlins: a straight timber from rafter to rafter
    n = 24 if rr > 4 else 12
    for k in range(n):
        a0, a1 = FULL * k / n, FULL * (k + 1) / n
        shell.strut(polar(rr, a0, zu(rr) - 0.14), polar(rr, a1, zu(rr) - 0.14), 0.18, 0.2, UNDER)
shell.grid(arc(r_top - 0.1, r_top + 0.1, 0, FULL, z_top - 0.25, z_top + 0.12, 49), UNDER)     # the lantern's curb
for k in range(8):
    a = FULL * k / 8
    shell.box(polar(r_top, a, z_top + 0.45), (0.12, 0.12, 0.7), UNDER, yaw=a)                   # its posts
    for lv in range(3):                                                                          # louvres, tilted to shed rain
        a2 = a + FULL / 16
        M = Matrix.Translation(polar(r_top * 0.93, a2, z_top + 0.28 + lv * 0.19)) @ Matrix.Rotation(a2, 4, "Z") @ Matrix.Rotation(math.radians(-35), 4, "Y")
        shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((0.2, 0.66, 0.025, 1))), WOOD_B)
shell.cyl(Vector((0, 0, z_top + 0.78)), r_top + 0.12, r_top + 0.12, 0.08, UNDER, 24)
cap_top = z_top + 0.7 + (r_top + 0.3) * tp
tiled(shell, r_top + 0.35, z_top + 0.84, 0.1, cap_top + 0.1, 16, 0.6, 0.1, TILES, RIDGES, BOARDS)   # its cap
shell.lathe([(0.12, cap_top + 0.08), (0.08, cap_top + 0.16), (0.1, cap_top + 0.24), (0.03, cap_top + 0.36), (0.01, cap_top + 0.48)],
            Vector((0, 0, 0)), BRONZE, 14)

# --- six plain columns inside, built of drums, and the ring of beams they carry ----------------
cd, cr = P["col_d"], P["col_r"]
zb = zu(cr)                                                  # the roof's underside over the columns
c_top = zb - 0.3 - 0.05                                      # the beams' underside
col_a = [FULL * (j + 0.5) / P["columns"] for j in range(P["columns"])]
tops = []
for a in col_a:
    c = polar(cr, a)
    shell.box(c + Vector((0, 0, 0.1)), (cd * 1.3, cd * 1.3, 0.2), TRIM, yaw=a)                 # a square base
    z0, z1 = 0.2, c_top - 0.34
    nd = 6
    for k in range(nd):                                                                        # the drums, a joint between each
        t0, t1 = k / nd, (k + 1) / nd
        ra, rb = cd / 2 + (cd * 0.43 - cd / 2) * t0, cd / 2 + (cd * 0.43 - cd / 2) * t1
        shell.lathe([(ra, z0 + (z1 - z0) * t0 + 0.008), (rb, z0 + (z1 - z0) * t1 - 0.008)], c, rnd.choice(ASHLAR), 28)
    shell.cyl(c + Vector((0, 0, z0)), cd * 0.42, cd * 0.42, z1 - z0, JOINT, 20)
    shell.lathe([(cd * 0.43, z1), (cd * 0.45, z1 + 0.03), (cd * 0.43, z1 + 0.06), (cd * 0.5, z1 + 0.13), (cd * 0.6, z1 + 0.19),
                 (cd * 0.62, z1 + 0.22)], c, TRIM, 28)                                         # necking and echinus
    shell.box(c + Vector((0, 0, z1 + 0.28)), (cd * 1.35, cd * 1.35, 0.12), TRIM_B, yaw=a)      # abacus
    tops.append(c + Vector((0, 0, c_top + 0.15)))
for j in range(len(tops)):
    p0, p1 = tops[j], tops[(j + 1) % len(tops)]
    d = (p1 - p0).normalized()
    shell.strut(p0 - d * 0.2, p1 + d * 0.2, 0.3, 0.3, UNDER)                                    # a squared beam from column to column
    for q, s_ in ((p0, 1), (p1, -1)):                                                          # a brace at each end
        shell.strut(q + Vector((0, 0, -1.0)) + d * s_ * 0.3, q + d * s_ * 1.2 + Vector((0, 0, -0.1)), 0.14, 0.14, UNDER)
for a in col_a:                                              # a post from each column's beam up to the rafters
    shell.box(polar(cr, a, (c_top + 0.3 + zb) / 2), (0.24, 0.24, zb - c_top - 0.3 + 0.1), UNDER, yaw=a)

# --- porch: a platform of blocks, two columns and antae, an entablature, a tiled gable -----------
pd, pw = P["porch_d"], P["porch_w"]
x0 = RO - 0.3
xf = x0 + pd + 0.3                                           # the platform's front edge
floor.prism([(x0, -pw / 2 - 0.3 + PROUD), (xf - PROUD, -pw / 2 - 0.3 + PROUD), (xf - PROUD, pw / 2 + 0.3 - PROUD), (x0, pw / 2 + 0.3 - PROUD)], -B, -0.008, JOINT)
ny, nx = 5, 3
for i in range(nx):                                          # its paving, in rows that break joint
    xa, xb = RO + 0.25 + (xf - RO - 0.25) * i / nx, RO + 0.25 + (xf - RO - 0.25) * (i + 1) / nx
    ys = [-pw / 2 - 0.3 + (pw + 0.6) * j / ny for j in range(ny + 1)] if i % 2 == 0 else \
         [-pw / 2 - 0.3] + [-pw / 2 - 0.3 + (pw + 0.6) * (j + 0.5) / ny for j in range(ny)] + [pw / 2 + 0.3]
    for ya, yb in zip(ys, ys[1:]):
        floor.box(((xa + xb) / 2, (ya + yb) / 2, -B / 2), (xb - xa - GAP, yb - ya - GAP, B), rnd.choice([TRIM, TRIM_B]))
floor.box(((RO + 0.25 + x0) / 2 - 0.3, 0, -B / 2), (RO + 0.25 - x0 + 0.6, pw + 0.6 - GAP, B), TRIM)        # the strip against the drum
for j in range(4):                                           # the step in front
    ya, yb = -pw / 2 + pw * j / 4, -pw / 2 + pw * (j + 1) / 4
    floor.box((xf + 0.15, (ya + yb) / 2, -B * 0.75), (0.3, yb - ya - GAP, B / 2), rnd.choice([TRIM, TRIM_B]))
floor.box((xf + 0.14, 0, -B * 0.75 - 0.004), (0.26, pw - 0.02, B / 2 - 0.008), JOINT)
ph = dh + 0.6                                                # height of the porch's architrave
for y in (-pw / 2 + 0.3, pw / 2 - 0.3):
    c = Vector((x0 + pd, y, 0))
    nd = 5
    for k in range(nd):                                      # a plain column of drums
        t0, t1 = k / nd, (k + 1) / nd
        shell.lathe([(0.24 - 0.04 * t0, (ph - 0.26) * t0 + 0.008), (0.24 - 0.04 * t1, (ph - 0.26) * t1 - 0.008)], c, rnd.choice(ASHLAR), 24)
    shell.cyl(c, 0.19, 0.19, ph - 0.26, JOINT, 16)
    shell.lathe([(0.2, ph - 0.26), (0.215, ph - 0.24), (0.2, ph - 0.22), (0.25, ph - 0.16), (0.3, ph - 0.11), (0.31, ph - 0.09)], c, TRIM, 24)
    shell.box(c + Vector((0, 0, ph - 0.045)), (0.66, 0.66, 0.09), TRIM_B)
    for k in range(4):                                       # the anta, in four blocks, with a capital
        za, zb_ = (ph - 0.2) * k / 4, (ph - 0.2) * (k + 1) / 4
        shell.box((x0 + 0.25, y, (za + zb_) / 2), (0.5, 0.5, zb_ - za - GAP), rnd.choice(ASHLAR))
    shell.box((x0 + 0.25, y, (ph - 0.2) / 2), (0.47, 0.47, ph - 0.2), JOINT)
    shell.box((x0 + 0.27, y, ph - 0.15), (0.58, 0.56, 0.1), TRIM)
    shell.box((x0 + 0.28, y, ph - 0.05), (0.64, 0.62, 0.1), TRIM_B)
EH = 0.45                                                    # the entablature: architrave, a fillet, a plain frieze
shell.prism([(x0, -pw / 2), (xf, -pw / 2), (xf, pw / 2), (x0, pw / 2)], ph, ph + 0.2, TRIM)
shell.prism([(x0, -pw / 2 - 0.03), (xf + 0.03, -pw / 2 - 0.03), (xf + 0.03, pw / 2 + 0.03), (x0, pw / 2 + 0.03)], ph + 0.2, ph + 0.25, TRIM_B)
shell.prism([(x0, -pw / 2 + 0.02), (xf - 0.02, -pw / 2 + 0.02), (xf - 0.02, pw / 2 - 0.02), (x0, pw / 2 - 0.02)], ph + 0.25, ph + EH, LIME_C)
shell.prism([(x0, -pw / 2 - 0.14), (xf + 0.14, -pw / 2 - 0.14), (xf + 0.14, pw / 2 + 0.14), (x0, pw / 2 + 0.14)], ph + EH, ph + EH + 0.09, TRIM_B)   # the cornice
for j in range(1, 3):                                        # joints in the architrave
    shell.box((xf + 0.001, -pw / 2 + pw * j / 3, ph + 0.1), (0.004, GAP, 0.2), JOINT)
zg = ph + EH + 0.09
sl = math.radians(22)
hw = pw / 2 + 0.2
rise = hw * math.tan(sl)
tri = [(-pw / 2, zg), (pw / 2, zg), (0, zg + (pw / 2) * math.tan(sl))]            # the pediment
def gable(pts, xa, xb, mat):
    s_ = shell.slot(mat)
    f0 = [shell.bm.verts.new((xa, y, z)) for y, z in pts]
    f1 = [shell.bm.verts.new((xb, y, z)) for y, z in pts]
    n = len(pts)
    for k in range(n):
        shell.face((f0[k], f0[(k + 1) % n], f1[(k + 1) % n], f1[k]), s_)
    shell.face(f0[::-1], s_)
    shell.face(f1, s_)
gable(tri, x0, xf - 0.1, LIME_B)                                                   # its field, set back
gable([(-pw / 2, zg), (pw / 2, zg), (pw / 2, zg + 0.07), (-pw / 2, zg + 0.07)], xf - 0.12, xf + 0.02, TRIM)
for s_ in (-1, 1):
    # a raking cornice along each slope, then the tiles: pans up the slope with a cover over each joint
    shell.strut((xf - 0.02, s_ * (hw + 0.05), zg - 0.02), (xf - 0.02, 0, zg + rise + 0.03), 0.3, 0.12, TRIM_B)
    slope = Vector((0, -s_ * math.cos(sl), math.sin(sl)))
    up = Vector((0, s_ * math.sin(sl), math.cos(sl)))
    L = hw / math.cos(sl)
    shell.strut(Vector((x0 - 0.2, s_ * hw, zg)), Vector((x0 - 0.2, s_ * hw, zg)) + slope * L, 0.02, 0.06, BOARDS)
    npan, nrow = 8, 4
    xs = [x0 - 0.2 + (xf + 0.25 - x0 + 0.2) * k / npan for k in range(npan + 1)]
    deck_c = Vector(((x0 - 0.2 + xf + 0.25) / 2, s_ * hw, zg)) + slope * (L / 2)
    M = Matrix.Translation(deck_c) @ Matrix([(1, 0, 0), slope, up]).transposed().to_4x4()
    shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((xf + 0.45 - x0, L, 0.06, 1))), BOARDS)
    for k in range(npan):
        for r_ in range(nrow):
            c = Vector(((xs[k] + xs[k + 1]) / 2, s_ * hw, zg)) + slope * (L * (r_ + 0.5) / nrow) + up * (0.07 + 0.012)
            M = Matrix.Translation(c) @ Matrix([(1, 0, 0), slope, up]).transposed().to_4x4() @ Matrix.Rotation(math.radians(-3), 4, "X")
            shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((xs[k + 1] - xs[k] - 0.01, L / nrow + 0.04, 0.04, 1))), rnd.choice(TILES))
    for k in range(npan + 1):
        c = Vector((xs[k], s_ * hw, zg)) + slope * (L / 2) + up * 0.14
        M = Matrix.Translation(c) @ Matrix([(1, 0, 0), slope, up]).transposed().to_4x4()
        m = rnd.choice(RIDGES)
        shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Diagonal((0.15, L, 0.07, 1))), m)
        shell.paint(bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Translation((0, 0, 0.05)) @ Matrix.Diagonal((0.08, L, 0.03, 1))), m)
        e = Vector((xs[k], s_ * (hw + 0.02), zg + 0.16))                                         # an antefix at the eave
        shell.box(e, (0.18, 0.05, 0.16), RIDGES[0])
        shell.disc(e + Vector((0, 0, 0.08)), 0.09, 0.05, (0, 1, 0), RIDGES[0], 10)
shell.strut((x0 - 0.2, 0, zg + rise + 0.16), (xf + 0.25, 0, zg + rise + 0.16), 0.2, 0.1, RIDGES[0])  # the ridge
shell.strut((x0 - 0.2, 0, zg + rise + 0.22), (xf + 0.25, 0, zg + rise + 0.22), 0.1, 0.05, RIDGES[1])

# --- the door: two leaves of upright boards on ledges, iron straps and studs, a ring pull --------
door = Part("door")
th = 0.06
lw = dw / 2 - 0.012
hx = R + 0.4
phi = math.radians(P["door_open"])
for s_ in (1, -1):
    hinge = Vector((hx, s_ * dw / 2, 0.02))
    dirv = Vector((-math.sin(phi), -s_ * math.cos(phi), 0))
    nrm = Vector((-dirv.y, dirv.x, 0))
    yaw = math.atan2(-dirv.x, dirv.y)
    at = lambda u, z, o=0.0: hinge + dirv * u + nrm * o + Vector((0, 0, z))
    nb = 5
    for k in range(nb):                                # five upright boards, a joint between each
        door.box(at(lw * (k + 0.5) / nb, dh / 2 - 0.01), (th, lw / nb - 0.008, dh - 0.04), WOOD if k % 2 else WOOD_B, yaw=yaw)
    door.box(at(lw / 2, dh / 2 - 0.01), (th - 0.02, lw - 0.01, dh - 0.06), JOINT, yaw=yaw)
    for z in (0.45, dh / 2, dh - 0.45):                # ledges across the inner face, a strap over each outside
        door.box(at(lw / 2, z, -th / 2 - 0.02), (0.04, lw - 0.06, 0.16), WOOD, yaw=yaw)
        door.box(at(lw * 0.45, z, th / 2 + 0.006), (0.012, lw * 0.86, 0.08), IRON, yaw=yaw)
        for k in range(nb):
            for o in (th / 2 + 0.014, -th / 2 - 0.044):
                door.sphere(at(lw * (k + 0.5) / nb, z, o), 0.022, IRON, 1.0, 8, 5)
    for z in (0.0, dh - 0.12):                         # the pivots
        door.cyl(at(0.0, z - 0.02), 0.045, 0.045, 0.12, IRON, 12)
    for o in (th / 2 + 0.02, -th / 2 - 0.02):          # a ring pull at the meeting edge
        door.sphere(at(lw - 0.14, 1.3, o), 0.035, IRON, 1.0, 8, 5)
        door.disc(at(lw - 0.14, 1.2, o + math.copysign(0.012, o)), 0.075, 0.016, nrm, IRON, 14)

# --- podium: two rings of blocks, a stone seat, a desk, the board on its post ------------------
floor.grid(arc(0.0, pr - PROUD, 0, FULL, 0.0, 0.192, 64), JOINT)
paving(floor, pr - 0.5, pr, 14, 0.0, 0.2, [TRIM, TRIM_B], gap=GAP)
floor.grid(arc(0.0, pr - 0.35 - PROUD, 0, FULL, 0.2, 0.392, 64), JOINT)
paving(floor, pr - 0.85, pr - 0.35, 10, 0.2, 0.4, [TRIM, TRIM_B], off=0.5, gap=GAP)
paving(floor, 0.0, pr - 0.85, 1, 0.2, 0.4, [TRIM], gap=0.0)
PZ = 0.4
pa = 0.0
f_ = Vector((1, 0, 0))                                # the holder faces the porch door
side = Vector((0, 1, 0))
seat = -f_ * 0.35
furn.box(seat + Vector((0, 0, PZ + 0.2)), (0.5, 0.55, 0.4), TRIM)                              # stone seat: body, slab, arms, back
furn.box(seat + Vector((0.02, 0, PZ + 0.42)), (0.56, 0.6, 0.05), TRIM_B)
for s_ in (-1, 1):
    furn.box(seat + side * 0.3 * s_ + Vector((-0.04, 0, PZ + 0.52)), (0.44, 0.07, 0.22), TRIM)
furn.box(seat - f_ * 0.27 + Vector((0, 0, PZ + 0.55)), (0.08, 0.67, 0.86), TRIM)
furn.disc(seat - f_ * 0.27 + Vector((0, 0, PZ + 0.98)), 0.335, 0.08, (1, 0, 0), TRIM, 20)       # its rounded top
desk = f_ * 0.35
furn.box(desk + Vector((0, 0, PZ + 0.72)), (0.5, 0.9, 0.05), WOOD_B)                            # the desk: top, four legs, rails
for sx in (-1, 1):
    for sy in (-1, 1):
        furn.box(desk + Vector((0.2 * sx, 0.4 * sy, PZ + 0.35)), (0.06, 0.06, 0.7), WOOD)
    furn.box(desk + Vector((0.2 * sx, 0, PZ + 0.62)), (0.04, 0.8, 0.1), WOOD)
for sy in (-1, 1):
    furn.box(desk + Vector((0, 0.4 * sy, PZ + 0.62)), (0.4, 0.04, 0.1), WOOD)
    furn.box(desk + Vector((0, 0.4 * sy, PZ + 0.15)), (0.4, 0.04, 0.05), WOOD)


def tablets(part, c, yaw, n=3):
    """A stack of wax tablets: a wooden frame round a field of wax, each a little askew."""
    for k in range(n):
        y = yaw + (0.0, 0.12, -0.08)[k % 3]
        part.box(Vector(c) + Vector((0, 0, 0.012 + 0.024 * k)), (0.22, 0.3, 0.022), WOOD, yaw=y)
    part.box(Vector(c) + Vector((0, 0, 0.012 + 0.024 * (n - 1) + 0.012)), (0.18, 0.26, 0.004), WAX, yaw=yaw + (0.0, 0.12, -0.08)[(n - 1) % 3])


tablets(furn, desk + Vector((0, 0.1, PZ + 0.745)), 0.0, 2)
post = side * 0.85 + f_ * 0.1
furn.box(post + Vector((0, 0, PZ + 0.04)), (0.34, 0.34, 0.08), WOOD)                            # the post's foot
furn.box(post + Vector((0, 0, PZ + 0.9)), (0.08, 0.08, 1.8), WOOD)
bc = post + Vector((0, 0, PZ + 1.55)) + f_ * 0.05
furn.box(bc, (0.03, 0.7, 0.5), BOARD)                                                           # the board, in a frame
for z in (-0.26, 0.26):
    furn.box(bc + Vector((0, 0, z)), (0.05, 0.76, 0.04), WOOD)
for y in (-0.36, 0.36):
    furn.box(bc + Vector((0, y, 0)), (0.05, 0.04, 0.56), WOOD)

# --- benches along the wall, each with a stand of wax tablets --------------------------------
benches = []
pad = (P["door_w"] / 2 + 0.45) / R
a0, a1 = pad, FULL - pad
n = P["benches"]
step = (a1 - a0) / n
for k in range(n):
    b0, b1 = a0 + step * k + 0.05, a0 + step * (k + 1) - 0.05
    stand_a = b1 - 0.28 / R
    e1 = stand_a - 0.12 / R
    furn.grid(arc(R - 0.44, R, b0 + 0.02, e1 - 0.02, 0, 0.36), JOINT)
    paving(furn, R - 0.47, R, 3, 0.0, 0.38, [TRIM, TRIM_B], a0=b0, a1=e1, gap=GAP)               # the body, three blocks
    furn.grid(arc(R - 0.5, R, b0, e1, 0.38, 0.45), TRIM_B)                                        # the seat slab
    furn.grid(arc(R - 0.09, R, b0 + 0.01, e1 - 0.01, 0.45, 0.94), rnd.choice(ASHLAR))             # the back slab and its cap
    furn.grid(arc(R - 0.12, R, b0, e1, 0.94, 1.0), TRIM_B)
    c = polar(R - 0.3, stand_a)
    furn.box(c + Vector((0, 0, 0.04)), (0.4, 0.4, 0.08), TRIM_B, yaw=stand_a)                    # the stand: base, die, cap
    furn.box(c + Vector((0, 0, 0.38)), (0.32, 0.32, 0.64), TRIM, yaw=stand_a)
    furn.box(c + Vector((0, 0, 0.73)), (0.38, 0.38, 0.06), TRIM_B, yaw=stand_a)
    tablets(furn, c + Vector((0, 0, 0.76)), stand_a)
    mid = (b0 + stand_a) / 2
    benches.append({"seat": polar(R - 0.3, mid, 0.45), "stand": c})

objs = [shell.finish(), floor.finish(), furn.finish(), door.finish()]
PROT = Matrix.Rotation(math.radians(P["porch"]), 4, "Z")      # the model is built with its porch on +x
for o in objs:
    o.rotation_euler = (0, 0, math.radians(P["porch"]))

ex = lambda v: [round((PROT @ v).x, 3), round(-(PROT @ v).y, 3)]
info = {
    "_note": "Written by art/sets/schedia_tholos.py; set-frame explorer coords [x, z] in metres, "
             "centre of the floor at [0, 0], the pad (ground outside the base) at y = -base. "
             "`seat`: where a legislator sits on a bench (seat height 0.45), `stand`: their "
             "tablets; the podium's floor is at podium_top.",
    "params": P,
    "podium_top": PZ,
    "roof_top": round(z_top + 0.7 + (r_top + 0.3) * tp, 2),
    "benches": [{"seat": ex(b["seat"]), "stand": ex(b["stand"])} for b in benches],
    "podium": {"seat": ex(seat), "desk": ex(desk), "board": ex(post)},
    "door": ex(Vector((R, 0, 0))),
}
json.dump(info, open("art/sets/schedia-tholos.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath="art/sets/schedia-tholos.glb", use_selection=True)
print("SCHEDIA THOLOS", len(benches), "benches, top", info["roof_top"], ",",
      sum(len(o.data.polygons) for o in objs), "faces")
