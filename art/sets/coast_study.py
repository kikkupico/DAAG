"""Framing studies of the scholars' coast sets and the oracle at the fork, on a bare ground: close views to check a set's
detail before it is baked into the island.

    blender -b -P art/sets/coast_study.py -- <libraries|stoa|terraces|oracle> [which]

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
elif NAME == "oracle":
    o, front, z0 = INFO["south_gate"], INFO["south"], INFO["floor"]
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
elif NAME == "oracle":
    shot("south_gate", (0.3, 9, 1.7), (0, -4, 1.7), 28)
    shot("south34", (8, 12, 3.6), (0, -6, 1.4), 26)
    shot("inside", (-0.6, -1.4, 1.7), (1.0, -10, 2.2), 20)
    shot("temple", (4.2, -8.65, 1.6), (-1.5, -8.65, 1.8), 26)
    shot("temple34", (4.5, -4.5, 2.2), (-2.0, -9.0, 1.8), 24)
    shot("north34", (-8, -25, 3.6), (0, -6.5, 1.8), 26)
    shot("above", (12, 10, 18), (0, -6.5, 0.5), 24)
    shot("oak_out", (-4, 7, 1.7), (-2.4, -3.5, 3.2), 28)        # from the road, through the south gate
    def oakshot(name, eye, look, lens):                           # absolute explorer [x, height, z]
        cam.location = Vector((eye[0], -eye[2], eye[1]))
        cam.rotation_euler = (Vector((look[0], -look[2], look[1])) - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.data.lens = lens
        sc.render.filepath = OUT + name + ".png"
        bpy.ops.render.render(write_still=True)
    oakshot("oak_near", (221.0, 11.7, 33.0), (224.7, 12.0, 36.3), 30)   # from the temple's side
    oakshot("oak_trunk", (222.0, 11.5, 38.0), (224.7, 11.8, 36.3), 34)
    shot("oak_under", (1.0, -2.0, 1.7), (-2.4, -3.5, 3.4), 26)
    shot("oak_far", (10, 10, 3), (-2.4, -3.5, 3.0), 40)
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
