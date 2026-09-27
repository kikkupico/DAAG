"""A port town of Arche: a parametric set of many buildings, for the island model and the previs.

    blender -b -P art/sets/town.py -- <set name>        # e.g. town3

Reads the town's plan (sets.json `town.plan`, written by art/sets/town_plan.py from the island
model's own buildings) and writes art/sets/<name>.glb, and art/sets/<name>-strips.json, the ground
art/sets/bake.py clears of Meshy's buildings before joining this in. The set's origin is the
explorer's origin, so every building stands at its own place with no further placing.

Three kinds of building, all of rubble stone under terracotta tiles, told apart by size:
- `house`: a town house, one storey, a hipped or gabled roof, a door and small windows;
- `court`: a courtyard house, four ranges round an open court, roofs sloping inwards;
- `hall`: a long storehouse on the waterfront, gabled, with wide doors in its long side.
Each varies a little by a seed: wall tone, roof pitch, which side the door is on. A house on a
slope stands on a terrace with a rubble retaining wall. `town.clear` lists ground to clear and
pave where a Meshy block is only partly replaced. The towns are
alike, as the houses are: nothing sets one apart.
"""
import bpy, bmesh, json, math, random, sys
from mathutils import Vector, Matrix

NAME = sys.argv[sys.argv.index("--") + 1]
SITE = json.load(open("art/sets/sets.json"))[NAME]
PLAN = json.load(open(SITE["town"]["plan"]))["buildings"]

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.85):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


WALLS = [material(f"stone-{k}", c) for k, c in enumerate(
    [(0.5, 0.46, 0.4), (0.56, 0.52, 0.45), (0.47, 0.44, 0.39), (0.62, 0.59, 0.53)])]
DRESSED = material("dressed-stone", (0.6, 0.56, 0.49), 0.8)
TILES = [material(f"tile-{k}", c, 0.8) for k, c in enumerate(
    [(0.5, 0.2, 0.12), (0.55, 0.25, 0.15), (0.45, 0.18, 0.11)])]
TIMBER = material("timber", (0.3, 0.19, 0.1), 0.75)
DARK = material("dark", (0.08, 0.07, 0.06), 1.0)
COURT = material("courtyard", (0.52, 0.49, 0.43), 0.9)
TERRACE = material("terrace-wall", (0.42, 0.39, 0.34), 0.95)


class Part:
    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def solid(self, pts_top, th, mat, M):
        """A prism: the polygon pts_top (local 3-D points), extruded straight down by th."""
        k = self.slot(mat)
        top = [self.bm.verts.new(M @ Vector(p)) for p in pts_top]
        bot = [self.bm.verts.new(M @ Vector((p[0], p[1], p[2] - th))) for p in pts_top]
        n = len(pts_top)
        for f in [top, bot[::-1]] + [[top[i], bot[i], bot[(i + 1) % n], top[(i + 1) % n]] for i in range(n)]:
            self.bm.faces.new(f).material_index = k

    def box(self, lo, hi, mat, M):
        (x0, y0, z0), (x1, y1, z1) = lo, hi
        self.solid([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], z1 - z0, mat, M)

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me)
        for m in self.mats:
            me.materials.append(m)
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        return o


shell, floor = Part("shell"), Part("floor")


def roof_hip(hx, hy, z, pitch, ov, mat, M, ridge_along_x=True):
    """A hipped roof over the rectangle [-hx, hx] x [-hy, hy] at eave height z."""
    t = math.tan(math.radians(pitch))
    ax, ay = hx + ov, hy + ov
    if ridge_along_x:
        r = ay * t
        rx = max(ax - ay, 0.01)
        ridge = [(-rx, 0, z + r), (rx, 0, z + r)]
        faces = [[(-ax, -ay, z), (ax, -ay, z), ridge[1], ridge[0]],
                 [(ax, ay, z), (-ax, ay, z), ridge[0], ridge[1]],
                 [(ax, -ay, z), (ax, ay, z), ridge[1]],
                 [(-ax, ay, z), (-ax, -ay, z), ridge[0]]]
    else:
        r = ax * t
        ry = max(ay - ax, 0.01)
        ridge = [(0, -ry, z + r), (0, ry, z + r)]
        faces = [[(ax, -ay, z), (ax, ay, z), ridge[1], ridge[0]],
                 [(-ax, ay, z), (-ax, -ay, z), ridge[0], ridge[1]],
                 [(-ax, -ay, z), (ax, -ay, z), ridge[0]],
                 [(ax, ay, z), (-ax, ay, z), ridge[1]]]
    for f in faces:
        shell.solid([(p[0], p[1], p[2] + 0.12) for p in f], 0.12, mat, M)
    # a ridge of capping tiles, and tile ribs down the long slopes
    (a, b) = ridge
    shell.box((min(a[0], b[0]) - 0.1, min(a[1], b[1]) - 0.12, a[2] + 0.05),
              (max(a[0], b[0]) + 0.1, max(a[1], b[1]) + 0.12, a[2] + 0.2), mat, M)
    return r


def openings(hx, hy, wh, rng, M, door_side, windows=2):
    """A door and small windows on the building's faces, as dark insets with stone frames."""
    for side in range(4):
        # side 0: -Y face, 1: +X, 2: +Y, 3: -X
        along = hx if side % 2 == 0 else hy
        n = 1 + int(along > 3.0) + windows - 1
        for k in range(n):
            u = -along + (k + 0.5) * 2 * along / n
            is_door = side == door_side and k == n // 2
            w, z0, z1 = (1.1, 0.0, 2.2) if is_door else (0.55, 1.4, 2.1)
            if not is_door and rng.random() < 0.35:
                continue
            if side == 0:
                lo, hi = (u - w / 2, -hy - 0.04, z0), (u + w / 2, -hy + 0.02, z1)
            elif side == 2:
                lo, hi = (u - w / 2, hy - 0.02, z0), (u + w / 2, hy + 0.04, z1)
            elif side == 1:
                lo, hi = (hx - 0.02, u - w / 2, z0), (hx + 0.04, u + w / 2, z1)
            else:
                lo, hi = (-hx - 0.04, u - w / 2, z0), (-hx + 0.02, u + w / 2, z1)
            shell.box(lo, hi, TIMBER if is_door else DARK, M)
            # a lintel over it
            if side in (0, 2):
                y = lo[1] if side == 0 else hi[1]
                shell.box((lo[0] - 0.12, y - 0.04, z1), (hi[0] + 0.12, y + 0.04, z1 + 0.2), DRESSED, M)
            else:
                x = lo[0] if side == 3 else hi[0]
                shell.box((x - 0.04, lo[1] - 0.12, z1), (x + 0.04, hi[1] + 0.12, z1 + 0.2), DRESSED, M)


strips = []
for n, b in enumerate(PLAN):
    rng = random.Random(1000 + n)
    (cx, cz), (hx0, hy0), rot = b["at"], b["half"], math.radians(b["rot"])
    g = b["ground"]
    # explorer (x, z) -> blender (x, -z); the plan's first half-axis runs at `rot` in explorer terms
    M = Matrix.Translation((cx, -cz, g)) @ Matrix.Rotation(-rot, 4, "Z")
    hx, hy = hx0 - 0.35, hy0 - 0.35          # walls inside the old roof's footprint
    wall = rng.choice(WALLS)
    tile = rng.choice(TILES)
    kind = b["kind"]
    wh = {"house": rng.uniform(3.4, 4.2), "court": rng.uniform(3.6, 4.2), "hall": rng.uniform(4.6, 5.4)}[kind]
    # a plinth down into the slope, and the walls
    # a terrace, never below sea level (the island stands on its lowest point, which must not move)
    floor.box((-hx - 0.7, -hy - 0.7, max(-4.5, 0.05 - g)), (hx + 0.7, hy + 0.7, 0.08), TERRACE, M)
    if kind == "court":
        cw = min(hx, hy) * 0.42                 # half-width of the open court
        rw_x, rw_y = hx - cw, hy - cw           # range depths
        shell.box((-hx, -hy, 0), (hx, hy, 0.02), COURT, M)
        for (x0, y0, x1, y1) in ((-hx, -hy, hx, -cw), (-hx, cw, hx, hy), (-hx, -cw, -cw, cw), (cw, -cw, hx, cw)):
            shell.box((x0, y0, 0), (x1, y1, wh), wall, M)
        # roofs of the four ranges, sloping in towards the court (a simple mono-pitch each way)
        t = math.tan(math.radians(rng.uniform(18, 24)))
        ov = 0.4
        for s in (-1, 1):
            y_out, y_in = s * (hy + ov), s * cw
            shell.solid([(-hx - ov, y_out, wh + 0.12), (hx + ov, y_out, wh + 0.12),
                         (hx - (hy - cw) + cw, y_in, wh + 0.12 + (hy - cw) * t * 0.6),
                         (-hx + (hy - cw) - cw, y_in, wh + 0.12 + (hy - cw) * t * 0.6)][::(1 if s > 0 else -1)], 0.12, tile, M)
            x_out, x_in = s * (hx + ov), s * cw
            shell.solid([(x_out, -hy - ov, wh + 0.12), (x_out, hy + ov, wh + 0.12),
                         (x_in, cw, wh + 0.12 + (hx - cw) * t * 0.6), (x_in, -cw, wh + 0.12 + (hx - cw) * t * 0.6)][::(-1 if s > 0 else 1)], 0.12, tile, M)
        openings(hx, hy, wh, rng, M, door_side=rng.randrange(4), windows=2)
    else:
        shell.box((-hx, -hy, 0), (hx, hy, wh), wall, M)
        for x in (-hx, hx - 0.35):                                  # dressed quoins
            for y in (-hy, hy - 0.35):
                for k in range(int(wh / 0.6)):
                    shell.box((x - 0.03, y - 0.03, k * 0.6), (x + 0.38, y + 0.38, k * 0.6 + 0.3), DRESSED, M)
        along_x = hx >= hy
        pitch = rng.uniform(20, 26)
        if kind == "hall" or rng.random() < 0.5:
            # a gable roof, ridge along the long side
            t = math.tan(math.radians(pitch))
            ov = 0.45
            ax, ay = hx + ov, hy + ov
            if along_x:
                r = ay * t
                for s in (-1, 1):
                    shell.solid([(-ax, s * ay, wh + 0.12), (ax, s * ay, wh + 0.12), (ax, 0, wh + 0.12 + r), (-ax, 0, wh + 0.12 + r)][::(1 if s < 0 else -1)], 0.12, tile, M)
                shell.box((-ax, -0.12, wh + r + 0.05), (ax, 0.12, wh + r + 0.2), tile, M)
                for x in (-hx, hx - 0.4):
                    shell.solid([(x, -hy, wh), (x, hy, wh), (x, 0, wh + r)], -0.4, wall, M)
            else:
                r = ax * t
                for s in (-1, 1):
                    shell.solid([(s * ax, -ay, wh + 0.12), (s * ax, ay, wh + 0.12), (0, ay, wh + 0.12 + r), (0, -ay, wh + 0.12 + r)][::(-1 if s < 0 else 1)], 0.12, tile, M)
                shell.box((-0.12, -ay, wh + r + 0.05), (0.12, ay, wh + r + 0.2), tile, M)
                for y in (-hy, hy - 0.4):
                    shell.solid([(-hx, y, wh), (hx, y, wh), (0, y, wh + r)], -0.4, wall, M)
            # ribs down the two long slopes
            L = ax if along_x else ay
            nr = max(2, int(2 * L / 0.45))
            for s in (-1, 1):
                for k in range(nr + 1):
                    u = -L + k * 2 * L / nr
                    if along_x:
                        p0, p1 = Vector((u, s * ay, wh + 0.12)), Vector((u, 0, wh + 0.12 + r))
                    else:
                        p0, p1 = Vector((s * ax, u, wh + 0.12)), Vector((0, u, wh + 0.12 + r))
                    mid = (p0 + p1) / 2 + Vector((0, 0, 0.05))
                    q = (p1 - p0).to_track_quat("Y", "Z").to_matrix().to_4x4()
                    gg = bmesh.ops.create_cube(shell.bm, size=1.0, matrix=M @ Matrix.Translation(mid) @ q @ Matrix.Diagonal((0.1, (p1 - p0).length, 0.07, 1)))
                    kk = shell.slot(tile)
                    for f in {f for v in gg["verts"] for f in v.link_faces}:
                        f.material_index = kk
        else:
            roof_hip(hx, hy, wh, pitch, 0.45, tile, M, along_x)
        if kind == "hall":
            # wide doors along the long side facing the water, and a row of slit windows
            L = hx if along_x else hy
            nd = max(1, int(L / 4))
            for k in range(nd):
                u = -L + (k + 0.5) * 2 * L / nd
                if along_x:
                    shell.box((u - 1.0, -hy - 0.05, 0), (u + 1.0, -hy + 0.02, 2.9), TIMBER, M)
                    shell.box((u - 1.2, -hy - 0.1, 2.9), (u + 1.2, -hy + 0.02, 3.2), DRESSED, M)
                else:
                    shell.box((hx - 0.02, u - 1.0, 0), (hx + 0.05, u + 1.0, 2.9), TIMBER, M)
                    shell.box((hx - 0.02, u - 1.2, 2.9), (hx + 0.1, u + 1.2, 3.2), DRESSED, M)
        else:
            openings(hx, hy, wh, rng, M, door_side=rng.randrange(4), windows=2)
    # clear Meshy's whole building; on a slope the house stands on its terrace, whose rubble
    # retaining wall faces the downhill side
    strips.append({"at": [cx, cz], "half": [hx0 + 0.3, hy0 + 0.3], "rot": b["rot"], "pad": g - 0.05})

# Ground cleared of a Meshy building the town's own buildings do not fully cover (the rest of a
# block the trading house replaces): flattened to its pad and paved over.
PAVE = material("paving", (0.47, 0.45, 0.41), 0.9)
for c in SITE["town"].get("clear", []):
    (cx, cz), (hx, hz), rot = c["at"], c["half"], math.radians(c["rot"])
    M = Matrix.Translation((cx, -cz, c["pad"])) @ Matrix.Rotation(-rot, 4, "Z")
    floor.box((-hx, -hz, max(-0.6, 0.05 - c["pad"])), (hx, hz, 0.03), PAVE, M)
    strips.append({"at": [cx, cz], "half": [hx, hz], "rot": c["rot"], "pad": c["pad"] - 0.05})

objs = [shell.finish(), floor.finish()]
json.dump({"_note": f"Written by art/sets/town.py for {NAME}: ground to clear, explorer [x, z].", "strips": strips},
          open(f"art/sets/{NAME}-strips.json", "w"), indent=1)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=f"art/sets/{NAME}.glb", use_selection=True)
print("TOWN", NAME, len(PLAN), "buildings,", sum(len(o.data.polygons) for o in objs), "faces")
