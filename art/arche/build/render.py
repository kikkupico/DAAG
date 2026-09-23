"""Render review views of the built Arche.

    blender -b art/arche/arche-built.blend -P art/arche/build/render.py -- <out-prefix>
"""
import bpy, sys, math
from mathutils import Vector
OUT = sys.argv[-1]
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 1600, 900
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.55, 0.68, 0.85, 1); bg.inputs[1].default_value = 0.9
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 4.5
sun.rotation_euler = (math.radians(45), 0, math.radians(200)); sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.clip_end = 60000; cam.data.clip_start = 0.5
def at(b, r):
    t = math.radians(b); return (-r * math.cos(t), r * math.sin(t))
def ground(x, y):
    dg = bpy.context.evaluated_depsgraph_get()
    hit, loc, *_ = sc.ray_cast(dg, Vector((x, y, 2000)), Vector((0, 0, -1)))
    return loc.z if hit else 0
def shot(name, target, dist, yaw, pitch, lens=50):
    d = Vector((math.cos(math.radians(pitch)) * math.cos(math.radians(yaw)),
                math.cos(math.radians(pitch)) * math.sin(math.radians(yaw)), math.sin(math.radians(pitch))))
    cam.location = target + d * dist; cam.data.lens = lens
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT}-{name}.png"; bpy.ops.render.render(write_still=True)
def T(b, r, dz=0):
    x, y = at(b, r); return Vector((x, y, ground(x, y) + dz))
shot("wide", Vector((0, 0, 100)), 13000, 150, 35)
shot("anchor", T(112.5, 3450), 900, 60, 30)
shot("cuttings", T(80, 4050, -15), 140, 70, 12, lens=35)
shot("crown", T(0, 0), 330, -160, 38)
shot("camp", T(90, 2370), 55, 30, 25)
shot("vine", T(0, 3600), 900, -10, 32)
