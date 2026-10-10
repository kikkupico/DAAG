"""The far terraces of the scholars' coast: the pebble tables, one on each terrace of the stepped
hillside at the island's southern tip, in enough detail that a previs render already shows
every part of them: nothing is left for an image model to make up.

    blender -b -P art/sets/terraces.py -- terraces

Reads the plan (sets.json `terraces.plan`: each table's place, the ground levelled for it, the
direction of its long side, its terrace's height and the step up to the terrace above) and
writes art/sets/terraces.glb (in explorer coords, origin at the world's origin; objects `floor`
and `furniture`), art/sets/terraces.json (what the previs and the books need to know: each
table, its stool, its stair) and art/sets/terraces-strips.json, the ground art/sets/bake.py
levels under each. The hillside itself is the island model's own earthwork.

Every terrace keeps the same table: a count of the copies made and lost of a work, in pebbles.
The table has a column for every terrace, in two sets, white pebbles for copies made and black
for copies lost, and a terrace's scribe adds only to his own terrace's column of each set. The
tables are alike but their piles are not: each shows its own column in full and, of the others,
only as much as has reached it.

A table's frame is local: X runs along its terrace, the sea and the terrace below are towards
+Y, the terrace above towards -Y, and the terrace's ground is Z = 0. What is modelled, so that
it need not be described to an image model (the helpers are masonry.py's):
- the ground: flagstones behind a kerb of dressed blocks at the terrace's edge;
- behind it the wall holding up the terrace above, in rubble under a coping of flat stones, and
  a stair of four steps up to that terrace;
- the table: one marble slab on two upright blocks, each on its foot, its top cut with a
  shallow groove for each column, five white and five black, a plain border round them;
- the pebbles lying in the grooves, counted from the scribe's side, and a bowl of spare pebbles
  at each end of the table, white at the white set's end and black at the black;
- the scribe's stool, on the side of the terrace above, so that he faces the sea.
"""
import bpy, json, math, random, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "art/sets")
import masonry
from masonry import Part, material, bx, rubble, flags, GAP

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
PLAN = json.load(open(SITE["terraces"]["plan"]))["buildings"]
P = dict(
    table=(2.0, 0.8, 0.75),      # the table: long, across, high
    set=0.74,                    # each set of columns, along the table
    groove=(0.07, 0.6),          # a groove: across, long
    made=[7, 5, 8, 4, 6],        # the count in full: copies made at each terrace
    lost=[2, 1, 3, 0, 2],        # and copies lost
)
N = len(PLAN)
rnd = random.Random(5)

bpy.ops.wm.read_factory_settings(use_empty=True)

BLOCKS = [material("pale-limestone", (0.72, 0.68, 0.59), 0.8), material("pale-limestone_b", (0.67, 0.63, 0.55), 0.8),
          material("pale-limestone_c", (0.76, 0.72, 0.63), 0.8)]
JOINT = material("joint", (0.33, 0.3, 0.26), 1.0)
RUBBLE = [material("rubble", (0.5, 0.46, 0.4), 0.95), material("rubble_b", (0.44, 0.41, 0.36), 0.95),
          material("rubble_c", (0.56, 0.52, 0.45), 0.95)]
FLAGS = [material("flagstone", (0.6, 0.57, 0.5), 0.85), material("flagstone_b", (0.55, 0.52, 0.46), 0.85),
         material("flagstone_c", (0.64, 0.61, 0.54), 0.85)]
MARBLE = material("table-marble", (0.84, 0.82, 0.77), 0.45)
GROOVE = material("table-marble-groove", (0.66, 0.64, 0.6), 0.6)
WHITE = material("white-pebble", (0.93, 0.92, 0.88), 0.4)
BLACK = material("black-pebble", (0.07, 0.07, 0.08), 0.4)
CLAY = material("clay", (0.62, 0.36, 0.22), 0.8)
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
SEAT = material("plank", (0.37, 0.25, 0.14), 0.75)

floor, furn = Part("floor"), Part("furniture")
TL, TW, TH = P["table"]
GW, GL = P["groove"]
TY = 0.12                                  # the table stands a little towards the terrace's edge


def pebble(c, mat):
    furn.sphere(c, 0.026, mat, 0.6, 8, 5)


info, strips = [], []
for n, b in enumerate(PLAN):
    (cx, cz), (hx, hy), rot, g, rise = b["at"], b["half"], math.radians(b["rot"]), b["ground"], b["rise"]
    low = max(-0.8, 0.05 - g)              # never below sea level: the island stands on its lowest point

    # --- the ground: flagstones behind a kerb; the wall of the terrace above; the stair --------
    bx(floor, (-hx, -hy, low), (hx, hy, 0.0), JOINT)
    flags(floor, -hx, hx, -hy, hy - 0.3, 0.04, FLAGS, rnd, row=0.6, size=(0.5, 0.95))
    nk = 5
    for k in range(nk):
        a, c = -hx + 2 * hx * k / nk, -hx + 2 * hx * (k + 1) / nk
        bx(floor, (a + GAP / 2, hy - 0.3, low), (c - GAP / 2, hy, 0.07), rnd.choice(BLOCKS))
    bx(floor, (-hx, -hy - 0.4, low), (hx, -hy - 0.06, rise - 0.07), JOINT)
    rubble(floor, (-hx, -hy - 0.06, 0), (1, 0, 0), 2 * hx, 0.0, rise - 0.07, RUBBLE, JOINT, rnd, out=(0, 1, 0))
    for a, c in masonry.lengths(-hx, hx, 0.45, 0.8, rnd):                  # its coping
        bx(floor, (a + GAP / 2, -hy - 0.42, rise - 0.07), (c - GAP / 2, -hy + 0.06, rise), rnd.choice(BLOCKS))
    sx0, sd = hx - 4 * 0.26, 0.26
    for k in range(4):                                                     # four steps up, along the wall
        bx(floor, (sx0 + k * sd + GAP / 2, -hy + 0.02, 0.0), (sx0 + (k + 1) * sd - GAP / 2, -hy + 0.62, rise * (k + 1) / 4), rnd.choice(BLOCKS))

    # --- the table: a slab on two upright blocks, a groove for each column ---------------------
    T0 = TH - 0.012                                                        # the grooves' floor
    for s in (-1, 1):
        bx(furn, (s * 0.62 - 0.2, TY - TW / 2 + 0.07, 0.04), (s * 0.62 + 0.2, TY + TW / 2 - 0.07, 0.13), rnd.choice(BLOCKS))
        bx(furn, (s * 0.62 - 0.13, TY - TW / 2 + 0.12, 0.13), (s * 0.62 + 0.13, TY + TW / 2 - 0.12, TH - 0.1), rnd.choice(BLOCKS))
    bx(furn, (-TL / 2, TY - TW / 2, TH - 0.1), (TL / 2, TY + TW / 2, T0 - 0.001), MARBLE)
    pitch = P["set"] / N
    xg = [s * (0.04 + pitch * (k + 0.5)) for s in (-1, 1) for k in range(N)]   # the grooves' middles: white set, then black
    cuts = sorted(v for x in xg for v in (x - GW / 2, x + GW / 2))
    edges = [-TL / 2] + cuts + [TL / 2]
    for a, c in zip(edges[::2], edges[1::2]):                              # the top between the grooves
        bx(furn, (a, TY - TW / 2, T0 - 0.001), (c, TY + TW / 2, TH), MARBLE)
    for x in xg:                                                           # and beyond their ends; their floors
        for ya, yb in ((-TW / 2, -GL / 2), (GL / 2, TW / 2)):
            bx(furn, (x - GW / 2, TY + ya, T0 - 0.001), (x + GW / 2, TY + yb, TH), MARBLE)
        bx(furn, (x - GW / 2, TY - GL / 2, T0 - 0.002), (x + GW / 2, TY + GL / 2, T0), GROOVE)

    # --- the pebbles: this terrace's own columns in full, the others' as far as has reached it --
    made = [v if k == n else max(0, v - rnd.randrange(3)) for k, v in enumerate(P["made"][:N])]
    lost = [v if k == n else max(0, v - rnd.randrange(2)) for k, v in enumerate(P["lost"][:N])]
    for k in range(N):
        for count, x, mat in ((made[k], -(0.04 + pitch * (k + 0.5)), WHITE), (lost[k], 0.04 + pitch * (k + 0.5), BLACK)):
            for j in range(count):
                pebble((x + rnd.uniform(-0.008, 0.008), TY - GL / 2 + 0.04 + j * 0.062, T0 + 0.016), mat)
    for s, mat in ((-1, WHITE), (1, BLACK)):                               # a bowl of spare pebbles at each end
        c = Vector((s * (TL / 2 - 0.12), TY, TH))
        furn.lathe([(0.04, 0.0), (0.085, 0.045), (0.09, 0.05), (0.07, 0.035), (0.03, 0.012)], c, CLAY, 14)
        for j in range(7):
            a = j * 0.9
            pebble(c + Vector((0.03 * math.cos(a) * (j > 0), 0.03 * math.sin(a) * (j > 0), 0.03 + (0.012 if j == 0 else 0.0))), mat)

    # --- the scribe's stool, on the uphill side -------------------------------------------------
    sy = TY - TW / 2 - 0.36
    bx(furn, (-0.2, sy - 0.18, 0.44), (0.2, sy + 0.18, 0.48), SEAT)
    for x in (-0.16, 0.16):
        for y in (sy - 0.14, sy + 0.14):
            bx(furn, (x - 0.025, y - 0.025, 0.04), (x + 0.025, y + 0.025, 0.44), TIMBER)
        bx(furn, (x - 0.015, sy - 0.14, 0.2), (x + 0.015, sy + 0.14, 0.24), TIMBER)

    # --- stand it at its site -------------------------------------------------------------------
    # explorer (x, z) -> blender (x, -z); the plan's first half-axis runs at `rot` in explorer terms
    M = Matrix.Translation((cx, -cz, g)) @ Matrix.Rotation(-rot, 4, "Z")
    for part in (floor, furn):
        part.place(M)
    ex = lambda x, y: (lambda v: [round(v.x, 2), round(-v.y, 2)])(M @ Vector((x, y, 0)))
    info.append({"at": ex(0, TY), "ground": g, "top": round(g + TH, 2), "downhill": ex(0, hy + 3.0),
                 "ends": [ex(-TL / 2, TY), ex(TL / 2, TY)], "stool": ex(0, sy), "stair": ex(hx - 0.5, -hy + 0.3),
                 "above": round(g + rise, 2), "made": made, "lost": lost})
    strips.append({"at": [cx, cz], "half": [hx, hy], "rot": b["rot"], "pad": round(g - 0.05, 3)})

objs = [floor.finish(), furn.finish()]
json.dump({"_note": "Written by art/sets/terraces.py; explorer coords [x, z] in metres, heights above the sea. `at`: the "
                    "table's middle, its top at `top`; `downhill`: a point out over the terrace below; `ends`: the "
                    "table's two ends, the white set's first; `stool`: the scribe's stool; `stair`: the foot of the "
                    "steps up to the terrace above, which is at `above`; `made`, `lost`: the pebbles in each column.",
           "params": P, "tables": info}, open(f"art/sets/{NAME}.json", "w"), indent=1)
json.dump({"_note": f"Written by art/sets/terraces.py for {NAME}: ground to level, explorer [x, z].", "strips": strips},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("TERRACES", NAME, len(PLAN), "tables,", sum(len(o.data.polygons) for o in objs), "faces")
