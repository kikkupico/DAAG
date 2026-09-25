"""Split a Meshy model of a whole props sheet into one GLB per prop.

    blender -b -P art/cast/split_props.py -- <sheet>

Reads art/cast/props/<sheet>.glb (Meshy image-to-3D of art/refs/<sheet>-sheet.png) and the
sheet's item boxes, art/refs/<sheet>/boxes.json (written by pipeline.py split). Meshy lays
the sheet out in the model's X-Z plane (x across, z up the sheet), so each loose part goes
to the item box its centre falls in, or the nearest one. Each prop is scaled so its longest
side is its `size` in art/cast/props.json, set on its base (origin at the bottom centre) and
saved as art/cast/props/<sheet>/<kind>.glb.
"""
import bpy, json, sys
from mathutils import Vector

sheet = sys.argv[sys.argv.index("--") + 1]
SIZES = {k: v["size"] for k, v in json.load(open("art/cast/props.json")).items()
         if not k.startswith("_") and v["sheet"] == sheet}
BOXES = json.load(open(f"art/refs/{sheet}/boxes.json"))["boxes"]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=f"art/cast/props/{sheet}.glb")
for o in list(bpy.data.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)
src = bpy.data.objects[0]
bpy.context.view_layer.objects.active = src
src.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")
parts = list(bpy.data.objects)

# the model's extent maps onto the extent of the items on the sheet
allv = [p.matrix_world @ v.co for p in parts for v in p.data.vertices]
x0, x1 = min(v.x for v in allv), max(v.x for v in allv)
z0, z1 = min(v.z for v in allv), max(v.z for v in allv)
u0 = min(b[0] for b in BOXES.values()); u1 = max(b[2] for b in BOXES.values())
v0 = min(b[1] for b in BOXES.values()); v1 = max(b[3] for b in BOXES.values())

def to_sheet(p):
    return (u0 + (p.x - x0) / (x1 - x0) * (u1 - u0), v0 + (z1 - p.z) / (z1 - z0) * (v1 - v0))

def gap(b, u, v):  # distance from (u, v) to box b, 0 inside
    return Vector((max(b[0] - u, 0, u - b[2]), max(b[1] - v, 0, v - b[3]))).length

groups = {k: [] for k in BOXES}
for p in parts:
    c = sum((p.matrix_world @ v.co for v in p.data.vertices), Vector()) / len(p.data.vertices)
    u, v = to_sheet(c)
    groups[min(BOXES, key=lambda k: gap(BOXES[k], u, v))].append(p)

# Meshy names its texture Image_0, as the island models do, and Blender's glTF importer
# reuses an image already loaded under the same name: give the atlas and material their own.
for img in bpy.data.images:
    img.name = f"{sheet}-{img.name}"
for m in bpy.data.materials:
    m.name = f"{sheet}-{m.name}"

out = f"art/cast/props/{sheet}"
import os; os.makedirs(out, exist_ok=True)
for kind, ps in groups.items():
    if kind not in SIZES or not ps:
        print("SKIP", kind, len(ps)); continue
    bpy.ops.object.select_all(action="DESELECT")
    for p in ps:
        p.select_set(True)
    bpy.context.view_layer.objects.active = ps[0]
    if len(ps) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = kind
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    lo = Vector([min(v[i] for v in vs) for i in range(3)])
    hi = Vector([max(v[i] for v in vs) for i in range(3)])
    k = SIZES[kind] / max(hi - lo)
    base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    o.data.transform(__import__("mathutils").Matrix.Translation(-base))
    o.location = (0, 0, 0)
    o.scale = (k, k, k)
    bpy.ops.object.transform_apply(location=True, scale=True)
    bpy.ops.export_scene.gltf(filepath=f"{out}/{kind}.glb", use_selection=True)
    print("PROP", kind, len(ps), "parts", [round(d * k, 2) for d in hi - lo])
    o.hide_set(True)
