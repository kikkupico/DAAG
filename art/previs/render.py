"""Stage 1 previs: render an island model from a camera given in explorer.html world coords.

Explorer coords (three.js, +Y up): North = -X, East = -Z, South = +X, West = +Z.
World units are metres. Each island is placed as explorer.html places it, so a pose read off
the explorer can be pasted here and vice versa: Arche (the default) centred at x=-130, 95 m
per model unit; Paxos (`"island": "paxos"`) centred at (x, z) = (130, 36), 104 m per
model unit, set by eye so a person beside the rotunda looks right. Both sit with their base at sea level. The scale is set by the buildings, so
a 1.75 m person fits the harbour; the islands come out far smaller than canon's geography.

    blender -b -P art/previs/render.py -- shots.json <shot-id> [out.png]

A shot is {"eye": [x,y,z], "look": [x,y,z], "lens": mm, "aspect": "4:3",
           "island": "arche", "vscale": 1.0, "sun": [elev_deg, azim_deg]}.
`eye`/`look` y may be given as "+h" strings meaning h metres above the terrain there.
Optional: "cast" (rigged characters from art/cast/cast.json, posed from art/previs/poses.py),
"props", "light": "dusk" | "night", "under" and "crown_shrink"; each is described where it is
handled below. The explorer's Copy Scene button writes the camera and cast in this form.
"""
import bpy, json, sys, math
from mathutils import Vector

# glb, metres per model unit, explorer centre (x, z), sink below sea level in model units,
# yaw about the vertical in degrees, as the explorer's group rotation.y (Paxos's arms point
# along the model's +Z; a quarter turn points them north)
ISLANDS = {
    "arche": ("art/arche-3d.glb", 95.0, (-130.0, 0.0), 0.0, 0.0),
    "paxos": ("art/paxos-3d.glb", 104.0, (130.0, 36.0), 0.0, -90.0),
}
LONG_EDGE = 1600

argv = sys.argv[sys.argv.index("--") + 1:]
shots_path, shot_id = argv[0], argv[1]
shot = json.load(open(shots_path))[shot_id]
out = argv[2] if len(argv) > 2 else f"art/previs/renders/{shot_id}.png"
GLB, SCALE, (X0, Z0), SINK, YAW = ISLANDS[shot.get("island", "arche")]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]

# Match explorer placement. glTF importer maps (x, y, z)_gltf -> (x, -z, y)_blender.
vs = shot.get("vscale", 1.0)
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zmin = min(v.z for v in bb)
# A yaw of t about the explorer's +Y is a yaw of t about Blender's +Z; the centring offset
# turns with the island.
t = math.radians(YAW)
ox, oy = SCALE * cx, SCALE * cy
island.scale = (SCALE, SCALE, SCALE * vs)
island.rotation_mode = "XYZ"  # the glTF importer leaves objects in quaternion mode
island.rotation_euler = (0.0, 0.0, t)
island.location = (X0 - (ox * math.cos(t) - oy * math.sin(t)),
                   -Z0 - (ox * math.sin(t) + oy * math.cos(t)),
                   -SCALE * vs * (zmin + SINK))
bpy.context.view_layer.update()

# The mesh's crown is ~120 m across; canon's is modest. `crown_shrink` pulls the
# summit toward a point on the crown axis, fully inside r_in and fading out by r_out,
# so every later stage inherits a smaller crown. Explorer coords, as elsewhere.
CROWN = (-122.88, 2.14)
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

def ground(x, z, top=5000.0):  # terrain height only, so props and actors never stack on each other
    Mi = island.matrix_world.inverted()
    o, d = Mi @ Vector((x, -z, top)), Mi.to_3x3() @ Vector((0, 0, -1))
    ok, loc, *_ = island.ray_cast(o, d.normalized())
    return (island.matrix_world @ loc).z if ok else 0.0

def resolve(p):
    x, y, z = p
    if isinstance(y, str):
        y = ground(x, z) + float(y)
    return [x, y, z]

eye, look = to_bl(resolve(shot["eye"])), to_bl(resolve(shot["look"]))

# --- cast and props ---------------------------------------------------------
# Rigged reference characters (Meshy GLBs, Mixamo skeleton, A-pose rest) stood on the
# terrain. The shot's "cast" is a list of
#   {"who": "shostakos", "at": [x, z], "face": [x, z], "pose": "glass", "tint": [r, g, b],
#    "under": h}
# in explorer coords; "props" likewise, e.g. {"kind": "strongbox", "at": [x, z]}. `tint`
# reskins the model's pale cloth (tunic, sleeves) so the figures can be told apart;
# everything else keeps the model's own texture.
# who -> (glb, scale to a 1.75 m man), from art/cast/cast.json, which the explorer reads too.
CAST = {k: (v["glb"], v["scale"]) for k, v in json.load(open("art/cast/cast.json")).items()
        if not k.startswith("_")}
# Poses live in art/previs/poses.py, shared with art/cast/bake_poses.py (for the explorer).
sys.path.insert(0, "art/previs")
from poses import POSES, apply_pose

def material(name, rgb, rough=0.8, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

def ground_bl(x, z, under=None):  # explorer (x, z) -> blender point on the terrain
    # "under" (metres above sea; per item, else the shot's) starts the ray below overhangs,
    # so things stand on a cleft floor rather than on the rock roof above it.
    return Vector((x, -z, ground(x, z, under or shot.get("under", 5000.0))))

def tint_cloth(mesh_obj, rgb):
    """Recolour near-white, unsaturated texels of the base colour (the cloth) to rgb,
    keeping their shading. The material is copied so each figure has its own."""
    m = mesh_obj.data.materials[0].copy()
    mesh_obj.data.materials[0] = m
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    link = bsdf.inputs["Base Color"].links[0]
    src = link.from_socket
    nt.links.remove(link)
    hsv = nt.nodes.new("ShaderNodeSeparateColor"); hsv.mode = "HSV"
    nt.links.new(src, hsv.inputs[0])
    # mask = (1 - S) * V, sharpened: pale and unsaturated -> 1
    inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1
    nt.links.new(hsv.outputs[1], inv.inputs[1])
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    nt.links.new(inv.outputs[0], mul.inputs[0]); nt.links.new(hsv.outputs[2], mul.inputs[1])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value, ramp.inputs["From Max"].default_value = 0.55, 0.7
    nt.links.new(mul.outputs[0], ramp.inputs[0])
    shade = nt.nodes.new("ShaderNodeMix"); shade.data_type = "RGBA"; shade.blend_type = "MULTIPLY"
    shade.inputs["Factor"].default_value = 1
    nt.links.new(hsv.outputs[2], shade.inputs[6]); shade.inputs[7].default_value = (*rgb, 1)
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(ramp.outputs[0], mix.inputs["Factor"])
    nt.links.new(src, mix.inputs[6]); nt.links.new(shade.outputs[2], mix.inputs[7])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])

def add_actor(a, i):
    glb, k = CAST[a["who"]]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    for o in new:  # Meshy exports carry a stray icosphere
        if o.type == "MESH" and o.parent is None:
            bpy.data.objects.remove(o)
    body = next(o for o in arm.children if o.type == "MESH")
    if arm.animation_data:
        arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_quaternion, pb.location = (1, 0, 0, 0), (0, 0, 0)
    arm.scale = (k, k, k)
    arm.location = ground_bl(*a["at"], a.get("under"))
    f = ground_bl(*a["face"]) - arm.location
    # the model faces -Y; turn it to face f
    arm.rotation_mode = "XYZ"
    arm.rotation_euler = (0, 0, math.atan2(f.y, f.x) + math.pi / 2)
    if a.get("tint"):
        tint_cloth(body, a["tint"])
    pose = POSES[a.get("pose", "stand")]
    apply_pose(arm, k, a.get("pose", "stand"), i)
    if "glass" in pose:
        l, fwd, up = pose["glass"]
        g = sandglass(f"glass{i}")
        g.parent = arm
        g.location = Vector((l, -fwd, up - 0.1)) / k
        g.scale = Vector((1, 1, 1)) / k

def sandglass(name):
    """A 20 cm sandglass: two glass cones point to point between wooden end plates."""
    glass = material("glass", (0.8, 0.85, 0.9), rough=0.1)
    wood = material("wood", (0.35, 0.2, 0.1))
    sand = material("sand", (0.85, 0.7, 0.45))
    parts = []
    for z, rot in ((0.055, 0), (0.145, math.pi)):
        bpy.ops.mesh.primitive_cone_add(radius1=0.045, radius2=0.006, depth=0.09, location=(0, 0, z),
                                        rotation=(rot, 0, 0))
        parts.append(bpy.context.object); parts[-1].data.materials.append(glass)
    bpy.ops.mesh.primitive_cone_add(radius1=0.035, radius2=0.004, depth=0.05, location=(0, 0, 0.035))
    parts.append(bpy.context.object); parts[-1].data.materials.append(sand)
    for z in (0.0, 0.2):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.058, depth=0.015, location=(0, 0, z))
        parts.append(bpy.context.object); parts[-1].data.materials.append(wood)
    for t in range(3):
        a = t * 2 * math.pi / 3
        bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.2, location=(0.05 * math.cos(a), 0.05 * math.sin(a), 0.1))
        parts.append(bpy.context.object); parts[-1].data.materials.append(wood)
    return join(parts, name)

def join(parts, name):
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    return o

def add_prop(p):
    """{"kind": "strongbox", "at": [x, z], "face": [x, z]}: an iron-bound wooden chest,
    70 x 45 x 45 cm."""
    if p["kind"] != "strongbox":
        raise ValueError(p["kind"])
    wood = material("boxwood", (0.28, 0.16, 0.08))
    iron = material("iron", (0.12, 0.12, 0.12), rough=0.5, metal=0.8)
    parts = []
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.225)); b = bpy.context.object
    b.scale = (0.7, 0.45, 0.45); b.data.materials.append(wood); parts.append(b)
    for x in (-0.25, 0.25):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0.226)); s = bpy.context.object
        s.scale = (0.05, 0.46, 0.46); s.data.materials.append(iron); parts.append(s)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.36)); s = bpy.context.object
    s.scale = (0.71, 0.46, 0.02); s.data.materials.append(iron); parts.append(s)
    bpy.ops.object.select_all(action="DESELECT")
    for q in parts:
        q.select_set(True)
    bpy.ops.object.transform_apply(scale=True)
    o = join(parts, "strongbox")
    o.location = ground_bl(*p["at"], p.get("under"))
    f = ground_bl(*p.get("face", p["at"])) - o.location
    o.rotation_euler = (0, 0, math.atan2(f.y, f.x) + math.pi / 2 if f.length else 0)

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

if shot.get("light") == "dusk":
    # A physical sky with the sun a few degrees up (give "sun": [elev, azim]), a warm low
    # key, and a darker, glossier sea that picks up the sky's glow.
    sun_data.energy, sun_data.color = 3.0, (1.0, 0.55, 0.3)
    nt = world.node_tree
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_elevation = math.radians(elev)
    s = -(sun.rotation_euler.to_matrix() @ Vector((0, 0, -1)))
    sky.sun_rotation = math.pi / 2 - math.atan2(s.y, s.x)   # matches the lamp
    nt.links.new(sky.outputs["Color"], nt.nodes["Background"].inputs["Color"])
    nt.nodes["Background"].inputs["Strength"].default_value = shot.get("sky_strength", 0.12)
    b = sea.data.materials[0].node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.01, 0.05, 0.1, 1)
    b.inputs["Roughness"].default_value = 0.12

elif shot.get("light") == "night":
    # Moonlight ("sun" gives the moon's [elev, azim]): a cool key, a dark blue sky that still
    # lifts the shadow sides, and a dark glossy sea. Exposed so every plane stays readable.
    sun_data.energy, sun_data.color = shot.get("moon_energy", 1.2), (0.6, 0.7, 1.0)
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.02, 0.05, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.6
    b = sea.data.materials[0].node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.004, 0.012, 0.03, 1)
    b.inputs["Roughness"].default_value = 0.15

for i, a in enumerate(shot.get("cast", [])):
    add_actor(a, i)
for p in shot.get("props", []):
    add_prop(p)

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
