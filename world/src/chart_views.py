"""A near-top-down view of one island build, for the home page chart (world/src/chart_layout.py).

    blender -b build/<arche|paxos>.blend -P src/chart_views.py -- out.png [tilt_deg] [span_m] [px]

An orthographic camera over the island's centre looks down, tilted `tilt_deg` (default 25) from the
vertical towards the south so buildings show a little of their walls, with north at the top of the
frame. It frames `span_m` metres across (default 12000, one scale for both islands) at `px` pixels
square (default 2000), the sea is hidden and the ground is transparent, so both islands can be laid
on one canvas at the same scale. Light comes from the north-west, as charts shade.
"""
import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
tilt = math.radians(float(argv[1]) if len(argv) > 1 else 25.0)
span = float(argv[2]) if len(argv) > 2 else 12000.0
px = int(argv[3]) if len(argv) > 3 else 2000

sc = bpy.context.scene
SEA = (168, 196, 214)                                    # flat sea, cut out by chart_layout.py
mat = bpy.data.materials.new("chart_sea")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
em = nt.nodes.new("ShaderNodeEmission")
srgb = lambda c: ((c / 255 + 0.055) / 1.055) ** 2.4
em.inputs[0].default_value = (srgb(SEA[0]), srgb(SEA[1]), srgb(SEA[2]), 1)
outn = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(em.outputs[0], outn.inputs[0])
for o in bpy.data.objects:
    if o.name == "sea":
        o.data.materials.clear()
        o.data.materials.append(mat)
for o in list(bpy.data.objects):                      # the build's own lights and cameras are not wanted
    if o.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(o)

centre = Vector((0.0, 0.0, 120.0))
cam_data = bpy.data.cameras.new("chart")
cam_data.type = "ORTHO"
cam_data.ortho_scale = span
cam_data.clip_start = 10
cam_data.clip_end = 100000
cam = bpy.data.objects.new("chart", cam_data)
sc.collection.objects.link(cam)
d = 20000.0
cam.location = centre + Vector((0, -d * math.sin(tilt), d * math.cos(tilt)))
cam.rotation_euler = (tilt, 0, 0)                       # looks down and a little north; north is up in frame
sc.camera = cam

sun = bpy.data.objects.new("chart_sun", bpy.data.lights.new("chart_sun", "SUN"))
sc.collection.objects.link(sun)
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(40), 0, math.radians(-135))   # from the north-west

world = bpy.data.worlds.new("chart_world")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
sc.world = world

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from blib import core
core.cycles(sc, samples=24, res=(px, px))
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("CHART VIEW ->", out)
