"""Split the Meshy model of the flora sheet into one GLB per plant.

    blender -b -P art/flora/split.py -- <model.glb>        # e.g. art/cast/props/flora-hi.glb

The sheet (art/refs/flora-sheet.png, grid in art/refs/sheets.json) is three rows of four
plants, and Meshy lays it out in the model's X-Z plane (x across, z up the sheet). Its plants
come back fused in columns, each trunk joined to the crown below it, so they are cut apart by
cell, not by loose part: every face goes to the cell its centre falls in. `ROWS` gives the
row boundaries as fractions of the sheet's height, measured on the sheet. Each plant is set on
its base (origin at the bottom of its trunk), scaled to its real height and decimated to its
face budget, and saved as art/flora/<name>.glb, with a contact sheet art/flora/preview.png.
"""
import bpy, bmesh, json, math, sys
from mathutils import Vector

SRC = sys.argv[sys.argv.index("--") + 1]
GRID = json.load(open("art/refs/sheets.json"))["flora"]["grid"]
ROWS = [0.0, 0.371, 0.71, 1.0]            # from the top of the sheet
HEIGHT = {"pine": 12.0, "cypress": 12.0, "oak": 8.0, "olive": 5.5, "shrub": 1.4}   # metres
FACES = {"pine": 620, "cypress": 260, "oak": 600, "olive": 520, "shrub": 240}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
src = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
for o in list(bpy.context.scene.objects):
    if o is not src:
        bpy.data.objects.remove(o)
src.data.transform(src.matrix_world)
src.matrix_world.identity()
vs = src.data.vertices
x0, x1 = min(v.co.x for v in vs), max(v.co.x for v in vs)
z0, z1 = min(v.co.z for v in vs), max(v.co.z for v in vs)


def cell(p):
    """(row, col) of a point, rows counted from the top."""
    col = min(len(GRID[0]) - 1, int((p.x - x0) / (x1 - x0) * len(GRID[0])))
    f = (z1 - p.z) / (z1 - z0)
    row = next(r for r in range(3) if f <= ROWS[r + 1] + 1e-9)
    return row, col


out = {}
for r, names in enumerate(GRID):
    for c, name in enumerate(names):
        o = src.copy()
        o.data = src.data.copy()
        o.name = name
        bpy.context.scene.collection.objects.link(o)
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if cell(f.calc_center_median()) != (r, c)], context="FACES")
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
        # set it on its base: the trunk's foot is the lowest few vertices
        zs = sorted(v.co.z for v in bm.verts)
        zmin, zmax = zs[0], zs[-1]
        foot = [v.co for v in bm.verts if v.co.z < zmin + 0.04 * (zmax - zmin)]
        fx = sum(p.x for p in foot) / len(foot)
        fy = sum(p.y for p in foot) / len(foot)
        kind = name.split("-")[0]
        s = HEIGHT[kind] / (zmax - zmin)
        for v in bm.verts:
            v.co = Vector(((v.co.x - fx) * s, (v.co.y - fy) * s, (v.co.z - zmin) * s))
        bm.to_mesh(o.data)
        bm.free()
        n = len(o.data.polygons)
        if n > FACES[kind]:
            m = o.modifiers.new("decimate", "DECIMATE")
            m.ratio = FACES[kind] / n
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=m.name)
        out[name] = (o, n, len(o.data.polygons))
bpy.data.objects.remove(src)

for name, (o, n0, n1) in out.items():
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f"art/flora/{name}.glb", use_selection=True)
    print("PLANT", name, n0, "->", n1, "faces", [round(d, 1) for d in o.dimensions])

# a contact sheet: the plants in a row on a grey floor
x = 0.0
for name, (o, _, _) in out.items():
    o.location = (x + o.dimensions.x / 2, 0, 0)
    x += o.dimensions.x + 2
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = x
bpy.context.scene.collection.objects.link(cam)
cam.location = (x / 2, -60, 6)
cam.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
bpy.context.scene.collection.objects.link(sun)
sun.data.energy = 3.5
sun.rotation_euler = (math.radians(50), 0, math.radians(30))
w = bpy.data.worlds.new("w")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.8, 0.85, 1)
bpy.context.scene.world = w
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 2000, 400
sc.view_settings.view_transform = "Standard"
sc.render.filepath = "art/flora/preview.png"
bpy.ops.render.render(write_still=True)
