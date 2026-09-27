"""Straight-ish-down views of the two island models, for the home page's engraved chart.

    blender -b -P art/refs/chart_views.py -- <arche|paxos> out.png [tilt_deg] [span_m]

An orthographic camera looks down on the island with north at the top of the frame, tilted
`tilt_deg` from vertical (default 25) towards the south so buildings show a little of their
walls, and frames `span_m` metres (default 230) across. The island is placed exactly as
render.py and explorer.html place it; there is no sea, and the background is transparent, so
the two views can be laid out on one canvas at the same scale (art/refs/chart_layout.py).
"""
import bpy, math, sys
from mathutils import Vector

ISLANDS = {   # glb, metres per model unit, explorer centre (x, z), yaw, as render.py
    "arche": ("art/arche-3d.glb", 95.0, (-130.0, 0.0), 20.0),
    "paxos": ("art/paxos-3d.glb", 104.0, (130.0, 36.0), -90.0),
}
argv = sys.argv[sys.argv.index("--") + 1:]
name, out = argv[0], argv[1]
tilt = math.radians(float(argv[2]) if len(argv) > 2 else 25.0)
span = float(argv[3]) if len(argv) > 3 else 230.0
GLB, SCALE, (X0, Z0), YAW = ISLANDS[name]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zmin = min(v.z for v in bb)
t = math.radians(YAW)
island.scale = (SCALE,) * 3
island.rotation_mode = "XYZ"
island.rotation_euler = (0, 0, t)
island.location = (X0 - (SCALE * cx * math.cos(t) - SCALE * cy * math.sin(t)),
                   -Z0 - (SCALE * cx * math.sin(t) + SCALE * cy * math.cos(t)), -SCALE * zmin)
bpy.context.view_layer.update()

# Blender axes here: north = -X, east = +Y (explorer's east is -Z). The camera sits to the
# south of the centre and looks north and down, so north is up in the frame and east right.
centre = Vector((X0, -Z0, 8.0))
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = span
cam_data.clip_end = 5000
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
d = 1000.0
cam.location = centre + Vector((d * math.sin(tilt), 0, d * math.cos(tilt)))
cam.rotation_mode = "XYZ"
# Looking down -Z by default with +Y up in frame; rotate so up in frame is north (-X).
cam.rotation_euler = (tilt, 0, math.radians(90))
bpy.context.scene.camera = cam

sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
bpy.context.scene.collection.objects.link(sun)
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(40), 0, math.radians(135))   # light from the north-west, as charts shade
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
bpy.context.scene.world = world

sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 1400
sc.view_settings.view_transform = "Standard"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("CHART VIEW", name, "->", out)
