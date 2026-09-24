"""Stage 1 previs: render an island model from a camera given in explorer.html world coords.

Explorer coords (three.js, +Y up): North = -X, East = -Z, South = +X, West = +Z.
World units are metres. Each island is placed as explorer.html places it, so a pose read off
the explorer can be pasted here and vice versa: Arche (the default) centred at x=-1300, 950 m
per model unit, base at sea level; Paxos (`"island": "paxos"`) centred at (x, z) = (1300, 360),
950 x 1.31 m per model unit, sunk 0.02 model units as in the explorer.

    blender -b -P art/previs/render.py -- shots.json <shot-id> [out.png]

A shot is {"eye": [x,y,z], "look": [x,y,z], "lens": mm, "aspect": "4:3",
           "island": "arche", "vscale": 1.0, "sun": [elev_deg, azim_deg]}.
`eye`/`look` y may be given as "+h" strings meaning h metres above the terrain there.
"""
import bpy, json, sys, math
from mathutils import Vector

# glb, metres per model unit, explorer centre (x, z), sink in model units
ISLANDS = {
    "arche": ("art/arche-3d.glb", 950.0, (-1300.0, 0.0), 0.0),
    "paxos": ("art/paxos-3d.glb", 950.0 * 1.31, (1300.0, 360.0), 0.02),
}
LONG_EDGE = 1600

argv = sys.argv[sys.argv.index("--") + 1:]
shots_path, shot_id = argv[0], argv[1]
shot = json.load(open(shots_path))[shot_id]
out = argv[2] if len(argv) > 2 else f"art/previs/renders/{shot_id}.png"
GLB, SCALE, (X0, Z0), SINK = ISLANDS[shot.get("island", "arche")]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]

# Match explorer placement. glTF importer maps (x, y, z)_gltf -> (x, -z, y)_blender.
vs = shot.get("vscale", 1.0)
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zmin = min(v.z for v in bb)
island.scale = (SCALE, SCALE, SCALE * vs)
island.location = (X0 - SCALE * cx, -Z0 - SCALE * cy, -SCALE * vs * (zmin + SINK))
bpy.context.view_layer.update()

# The mesh's crown is ~1.2 km across; canon's is modest. `crown_shrink` pulls the
# summit toward a point on the crown axis, fully inside r_in and fading out by r_out,
# so every later stage inherits a smaller crown. Explorer coords, as elsewhere.
CROWN = (-1228.8, 21.4)
cs = shot.get("crown_shrink") if shot.get("island", "arche") == "arche" else None
if cs:
    import numpy as np
    s, r_in, r_out, base = cs["scale"], cs["r_in"], cs["r_out"], cs["base"]
    me = island.data
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    M = np.array(island.matrix_world)
    w_co = co @ M[:3, :3].T + M[:3, 3]
    c = np.array([CROWN[0], -CROWN[1], base])
    d = np.hypot(w_co[:, 0] - c[0], w_co[:, 1] - c[1])
    t = np.clip((r_out - d) / (r_out - r_in), 0, 1)
    wgt = (t * t * (3 - 2 * t))[:, None]
    shrunk = c + (w_co - c) * s
    w_co = w_co * (1 - wgt) + shrunk * wgt
    Minv = np.linalg.inv(M)
    co = w_co @ Minv[:3, :3].T + Minv[:3, 3]
    me.vertices.foreach_set("co", co.astype(np.float32).ravel())
    me.update()
    bpy.context.view_layer.update()

def to_bl(p):  # explorer (x, y, z) -> blender
    return Vector((p[0], -p[2], p[1]))

def ground(x, z):
    ok, loc, *_ = bpy.context.scene.ray_cast(
        bpy.context.view_layer.depsgraph, Vector((x, -z, 5000)), Vector((0, 0, -1)))
    return loc.z if ok else 0.0

def resolve(p):
    x, y, z = p
    if isinstance(y, str):
        y = ground(x, z) + float(y)
    return [x, y, z]

eye, look = to_bl(resolve(shot["eye"])), to_bl(resolve(shot["look"]))

# Sea plane at y=0, like the explorer.
bpy.ops.mesh.primitive_plane_add(size=400000, location=(0, 0, 0.3))
sea = bpy.context.object
m = bpy.data.materials.new("sea"); m.use_nodes = True
m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.02, 0.18, 0.4, 1)
sea.data.materials.append(m)

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = shot.get("lens", 35)
cam_data.sensor_width = 36
cam_data.clip_start, cam_data.clip_end = 0.1, 200000
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
