"""Bake the hand-tuned poses of art/previs/poses.py for every cast member, for the explorer.

    blender -b -P art/cast/bake_poses.py

For each character in art/cast/cast.json and each pose, poses the model in Blender (IK and
all), then records every bone's rotation away from its rest pose, in armature space. That
difference doesn't depend on how Blender or three.js orients bones internally, so the
explorer can apply it to its own copy of the skeleton. Quaternions are written in glTF axes
(x, y, z, w), the hips' move in glTF model units.

Writes art/cast/poses.json, and a thumbnail per character and pose in art/cast/pose-thumbs/.
"""
import bpy, json, math, sys
from mathutils import Matrix, Vector

sys.path.insert(0, "art/previs")
from poses import POSES, apply_pose

CAST = {k: v for k, v in json.load(open("art/cast/cast.json")).items() if not k.startswith("_")}
# Blender vectors from glTF ones: x -> x, y (up) -> z, z (forward) -> -y
B = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
BQ = B.to_quaternion()
THUMB = 360


def load(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    for o in list(bpy.data.objects):  # Meshy exports carry a stray icosphere
        if o.type == "MESH" and o.parent is None:
            bpy.data.objects.remove(o)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    if arm.animation_data:
        arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_quaternion, pb.location = (1, 0, 0, 0), (0, 0, 0)
    return arm


def thumbnail(arm, path):
    sc = bpy.context.scene
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 35
    tgt = Vector((0, 0, 0.8))
    cam.location = tgt + Vector((2.4, -3.4, 0.6))   # three-quarter front, from his left
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.7, 0.2, 0.6)
    sc.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=6)
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.75, 0.75, 1)
    sc.world = w
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = sc.render.resolution_y = THUMB
    sc.view_settings.view_transform = "Standard"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


baked = {}
for who, spec in CAST.items():
    baked[who] = {}
    for name in POSES:
        arm = load(spec["glb"])
        k = spec["scale"]
        arm.scale = (k, k, k)
        apply_pose(arm, k, name, "")
        bpy.context.view_layer.update()
        bones = {}
        for pb in arm.pose.bones:
            d = pb.matrix.to_quaternion() @ pb.bone.matrix_local.to_quaternion().inverted()
            g = BQ.inverted() @ d @ BQ
            bones[pb.name] = [round(g.x, 5), round(g.y, 5), round(g.z, 5), round(g.w, 5)]
        hb = arm.pose.bones["mixamorig:Hips"]
        hips = B.inverted() @ (hb.head - hb.bone.head_local)
        baked[who][name] = {"bones": bones, "hips": [round(c, 5) for c in hips]}
        path = f"art/cast/pose-thumbs/{who}-{name}.png"
        thumbnail(arm, path)
        print("BAKED", who, name)

out = {"_note": "Baked by art/cast/bake_poses.py from art/previs/poses.py; don't edit by hand. "
                "Per character and pose: each bone's armature-space rotation from rest "
                "(glTF axes, x y z w) and the hips' move (glTF model units).",
       "labels": {name: p.get("label", name) for name, p in POSES.items()},
       "baked": baked}
json.dump(out, open("art/cast/poses.json", "w"), separators=(",", ":"))
print("WROTE art/cast/poses.json")
