"""Framing studies of the scholars' coast sets and the hall of two doors, on a bare ground: close views to check a set's
detail before it is baked into the island.

    blender -b -P art/sets/coast_study.py -- <libraries|stoa|terraces|hall> [which]

Writes art/previs/renders/<set>-study/<view>.png. `which` picks the library or the table (0 if
not given). Every view is given in the building's own frame (along its front, out from its
front, up), read from the set's JSON.
"""
import bpy, json, math, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
NAME, N = argv[0], int(argv[1]) if len(argv) > 1 else 0
INFO = json.load(open(f"art/sets/{NAME}.json"))
OUT = f"art/previs/renders/{NAME}-study/"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=f"art/sets/{NAME}.glb")
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.view_settings.view_transform, sc.view_settings.look = "Standard", "None"
sc.render.resolution_x, sc.render.resolution_y = 1280, 900
sc.eevee.taa_render_samples = 24
sc.eevee.use_raytracing = True
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.7, 0.9, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.5
sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
sc.camera = cam

if NAME == "libraries":
    B = INFO["libraries"][N]
    o, front, z0 = B["door"], B["steps"], B["ground"]
elif NAME == "hall":
    o, front, z0 = INFO["south_door"], INFO["south"], INFO["floor"] - 0.45
elif NAME == "stoa":
    o, front, z0 = INFO["middle"], INFO["front"], INFO["ground_floor"]
else:
    B = INFO["tables"][N]
    o, front, z0 = B["at"], B["downhill"], B["ground"]
O = Vector((o[0], -o[1], z0))                               # blender: (x, -z, y)
F = (Vector((front[0], -front[1], z0)) - O).normalized()    # out from the front
R = Vector((F.y, -F.x, 0))                                  # along the front, to the right as one faces it
bpy.ops.mesh.primitive_plane_add(size=400, location=(O.x, O.y, z0 - 0.02))
gm = bpy.data.materials.new("ground")
gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.44, 0.3, 1)
bpy.context.object.data.materials.append(gm)
sd = (F * 0.55 - R * 0.6 + Vector((0, 0, 1))).normalized()  # the sun: before the front, to its left
sun.rotation_euler = sd.to_track_quat("Z", "Y").to_euler()

at = lambda r, f, u: O + R * r + F * f + Vector((0, 0, u))


def shot(name, eye, look, lens=30):
    cam.location = at(*eye)
    cam.rotation_euler = (at(*look) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    sc.render.filepath = OUT + name + ".png"
    bpy.ops.render.render(write_still=True)


if NAME == "libraries":
    shot("front34", (6, 10, 2.4), (0, -1, 2.3), 30)
    shot("front", (0, 12, 1.7), (0, 0, 2.4), 32)
    shot("porch", (2.6, 4.6, 1.65), (-0.3, 0.5, 2.3), 24)
    shot("door", (0.3, 2.7, 2.15), (0.2, -3, 1.9), 24)
    shot("room", (-1.0, -0.9, 2.2), (1.2, -3.4, 1.7), 18)
    shot("back34", (-7, -11, 4.5), (0, -2, 2.2), 30)
    shot("roof", (5, 7, 11), (0, -1.5, 3.5), 32)
elif NAME == "hall":
    shot("south34", (7, 9, 2.6), (0, -3, 2.6), 28)
    shot("south_door", (0.4, 6, 1.9), (0, -2, 2.2), 28)
    shot("north34", (-7, -16.5, 2.6), (0, -5, 2.6), 28)
    shot("north_door", (0.5, -12.5, 1.9), (0, -6, 2.4), 30)
    shot("inside", (0.6, -0.9, 1.9), (-0.3, -7, 2.6), 18)
    shot("roof", (9, 6, 10), (0, -3.5, 3), 30)
elif NAME == "stoa":
    shot("front34", (20, 22, 6), (0, -2, 2.5), 28)
    shot("colonnade", (-10.5, 1.5, 1.7), (6, -2.5, 2.6), 24)
    shot("inside", (-10.5, -3.0, 1.7), (8, -3.2, 2.6), 20)
    shot("entablature", (3.5, 5.5, 1.7), (0, 0, 5.0), 40)
    shot("back34", (-18, -16, 12), (0, -3, 3), 30)
    shot("festival", (9, 21, 5), (0, 9, 0.5), 28)
    shot("table", (2.2, 13.2, 1.6), (-1, 10, 0.7), 28)
else:
    shot("table", (1.8, 1.9, 1.6), (0, 0, 0.8), 30)
    shot("top", (0.0, 0.5, 2.6), (0, 0, 0.8), 28)
    shot("seat", (-2.2, -2.6, 1.7), (0, 0.2, 0.7), 28)
    shot("terrace", (4, 6, 3), (0, 0, 0.5), 28)
