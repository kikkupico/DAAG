"""Stage 1 previs: render the built Arche from a camera given in explorer.html world coords.

Explorer coords (three.js, +Y up): North = -X, East = -Z, South = +X, West = +Z.
The island is placed exactly as explorer.html places it (centred at x=-90, ~60 m per unit,
its own waterline at sea level), so a pose read off the explorer can be pasted here and
vice versa.

    blender -b -P art/previs/render.py -- shots.json <shot-id> [out.png]

A shot is {"eye": [x,y,z], "look": [x,y,z], "lens": mm, "aspect": "4:3",
           "vscale": 1.0, "sun": [elev_deg, azim_deg]}.
`eye`/`look` y may be given as "+h" strings meaning h units above the terrain there.
"""
import bpy, json, sys, math
from mathutils import Vector

GLB = "art/arche/arche-built.glb"
M_PER_UNIT = 60.0
LONG_EDGE = 1600

argv = sys.argv[sys.argv.index("--") + 1:]
shots_path, shot_id = argv[0], argv[1]
shot = json.load(open(shots_path))[shot_id]
out = argv[2] if len(argv) > 2 else f"art/previs/renders/{shot_id}.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
tops = [o for o in bpy.context.scene.objects if o.parent is None]
terrain = bpy.data.objects["terrain"]

# Match explorer placement: the model is in metres with sea level at z = 0.
vs = shot.get("vscale", 1.0)
bb = [terrain.matrix_world @ Vector(c) for c in terrain.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
island = bpy.data.objects.new("island", None)
bpy.context.scene.collection.objects.link(island)
for o in tops:
    o.parent = island
island.scale = (1 / M_PER_UNIT, 1 / M_PER_UNIT, vs / M_PER_UNIT)
island.location = (-90 - cx / M_PER_UNIT, -cy / M_PER_UNIT, 0)
bpy.context.view_layer.update()

def to_bl(p):  # explorer (x, y, z) -> blender
    return Vector((p[0], -p[2], p[1]))

def ground(x, z):
    ok, loc, *_ = bpy.context.scene.ray_cast(
        bpy.context.view_layer.depsgraph, Vector((x, -z, 500)), Vector((0, 0, -1)))
    return loc.z if ok else 0.0

def resolve(p):
    x, y, z = p
    if isinstance(y, str):
        y = ground(x, z) + float(y)
    return [x, y, z]

eye, look = to_bl(resolve(shot["eye"])), to_bl(resolve(shot["look"]))

# Sea plane at y=0, like the explorer.
bpy.ops.mesh.primitive_plane_add(size=25000, location=(0, 0, 0.3))
sea = bpy.context.object
m = bpy.data.materials.new("sea"); m.use_nodes = True
m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.02, 0.18, 0.4, 1)
sea.data.materials.append(m)

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = shot.get("lens", 35)
cam_data.sensor_width = 36
cam_data.clip_start, cam_data.clip_end = 0.05, 20000
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
cam.location = eye
cam.rotation_euler = (look - eye).to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam

elev, azim = shot.get("sun", [40, 135])
sun_data = bpy.data.lights.new("sun", "SUN"); sun_data.energy = 4
sun = bpy.data.objects.new("sun", sun_data)
bpy.context.scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(90 - elev), 0, math.radians(azim))

world = bpy.data.worlds.new("w"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.72, 0.9, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
bpy.context.scene.world = world

w, h = (int(n) for n in shot.get("aspect", "4:3").split(":"))
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
if w >= h:
    sc.render.resolution_x, sc.render.resolution_y = LONG_EDGE, round(LONG_EDGE * h / w)
else:
    sc.render.resolution_x, sc.render.resolution_y = round(LONG_EDGE * w / h), LONG_EDGE
sc.view_settings.view_transform = "Standard"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("PREVIS", shot_id, "eye", list(eye), "->", out)
