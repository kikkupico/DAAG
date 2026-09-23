"""Render views of a built island .blend.

    blender -b art/paxos/paxos-built.blend -P art/paxos/build/render.py -- <out-prefix>
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
sun.data.angle = math.radians(1.5)
sun.rotation_euler = (math.radians(48), 0, math.radians(215)); sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.clip_end = 50000
ch = bpy.data.objects["chamber"]
cc = Vector(ch.data.vertices[0].co)  # any vertex; use bbox centre instead
bb = [ch.matrix_world @ Vector(c) for c in ch.bound_box]
cc = sum(bb, Vector()) / 8
def shot(name, target, dist, yaw, pitch, lens=50):
    d = Vector((math.cos(math.radians(pitch)) * math.cos(math.radians(yaw)),
                math.cos(math.radians(pitch)) * math.sin(math.radians(yaw)),
                math.sin(math.radians(pitch))))
    cam.location = target + d * dist; cam.data.lens = lens
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT}-{name}.png"; bpy.ops.render.render(write_still=True)
shot("wide", Vector((0, 0, 0)), 7800, -125, 38)
shot("chamber", cc, 260, -120, 28)
houses = [o for o in bpy.data.objects if o.parent and o.parent.name == "houses"]
tc = sum((o.location for o in houses), Vector()) / len(houses)
shot("town", tc, 700, -60, 32)
ag = bpy.data.objects.get("agora")
if ag:
    bb = [ag.matrix_world @ Vector(c) for c in ag.bound_box]
    shot("agora", sum(bb, Vector()) / 8, 260, -50, 35)
for n in ("chamber_roof", "chamber_dome"):
    bpy.data.objects[n].hide_render = True
shot("interior", cc + Vector((0, 0, 2)), 70, -120, 55)
