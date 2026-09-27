"""Bake the sets marked `bake` in art/sets/sets.json into the Paxos island model.

    blender -b -P art/sets/bake_paxos.py

Reads the untouched Meshy conversion (the set's `bake.source`), never art/paxos-3d.glb
itself, so running it again never flattens twice, and writes art/paxos-3d.glb. For each
baked set (the Tholos, which replaces the Odeon Meshy drew on the eastern arm):
- every vertex inside the `footprint` quadrilateral, grown by `margin` metres, is lowered to
  the `pad` height, and the faces lying wholly inside are dropped;
- a paving slab covers the footprint, its top a little over the pad;
- the set's GLB is placed at its site and joined in.
The result is one mesh, as render.py and explorer.html expect, in the source's own model
units and frame, so the bounding box and every camera framed on the model stay put.
"""
import bpy, bmesh, json, math
from mathutils import Vector, Matrix

SCALE, (X0, Z0), YAW = 104.0, (130.0, 36.0), -90.0     # as render.py's ISLANDS["paxos"]
SETS = {k: v for k, v in json.load(open("art/sets/sets.json")).items()
        if not k.startswith("_") and v.get("bake") and v["island"] == "paxos"}
source = {s["bake"]["source"] for s in SETS.values()}
assert len(source) == 1, source

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source.pop())
island = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
M0 = island.matrix_world.copy()

# Place it as render.py does, so work is in explorer metres (blender axes: x, -z, y).
bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
zmin = min(v.z for v in bb)
box = lambda bb: [round(f(v[i] for v in bb), 5) for f in (min, max) for i in range(3)]
bb0 = box(bb)
t = math.radians(YAW)
island.scale = (SCALE,) * 3
island.rotation_mode = "XYZ"
island.rotation_euler = (0, 0, t)
island.location = (X0 - (SCALE * cx * math.cos(t) - SCALE * cy * math.sin(t)),
                   -Z0 - (SCALE * cx * math.sin(t) + SCALE * cy * math.cos(t)), -SCALE * zmin)
bpy.context.view_layer.update()
M = island.matrix_world.copy()
Mi = M.inverted()


def grown(quad, m):
    """The convex polygon (explorer [x, z]) with each edge pushed out by m."""
    c = sum((Vector(p) for p in quad), Vector((0, 0))) / len(quad)
    lines = []
    for a, b in zip(quad, quad[1:] + quad[:1]):
        a, b = Vector(a), Vector(b)
        n = Vector((b.y - a.y, a.x - b.x)).normalized()
        if n.dot(a - c) < 0:
            n = -n
        lines.append((a + n * m, b - a))
    out = []
    for (p1, d1), (p2, d2) in zip(lines[-1:] + lines[:-1], lines):
        # p1 + s d1 = p2 + u d2
        det = d1.x * -d2.y - d1.y * -d2.x
        s_ = ((p2 - p1).x * -d2.y - (p2 - p1).y * -d2.x) / det
        out.append(p1 + d1 * s_)
    return out


def inside(p, poly):
    """p inside the convex polygon poly (both explorer [x, z])."""
    s = None
    for a, b in zip(poly, poly[1:] + poly[:1]):
        cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
        if abs(cr) < 1e-9:
            continue
        if s is None:
            s = cr > 0
        elif (cr > 0) != s:
            return False
    return True


bm = bmesh.new()
bm.from_mesh(island.data)
parts = []
for name, S in SETS.items():
    bk = S["bake"]
    poly = [tuple(p) for p in grown(bk["footprint"], bk["margin"])]
    moved = set()
    for v in bm.verts:
        w = M @ v.co                               # blender world: (x, -z, y)
        if inside((w.x, -w.y), poly):
            v.co = Mi @ Vector((w.x, w.y, bk["pad"]))
            moved.add(v)
    gone = [f for f in bm.faces if all(v in moved for v in f.verts)]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    print("BAKE", name, len(moved), "vertices flattened,", len(gone), "faces dropped")

    # the paving slab over the footprint
    pm = bpy.data.meshes.new(name + "-paving")
    pb = bmesh.new()
    top = [pb.verts.new((x, -z, bk["pad"] + 0.06)) for x, z in poly]
    low = [pb.verts.new((x, -z, bk["pad"] - 0.4)) for x, z in poly]
    pb.faces.new(top)
    pb.faces.new(low[::-1])
    n = len(poly)
    for i in range(n):
        pb.faces.new((low[i], low[(i + 1) % n], top[(i + 1) % n], top[i]))
    bmesh.ops.recalc_face_normals(pb, faces=pb.faces)
    pb.to_mesh(pm); pb.free()
    mat = bpy.data.materials.new(name + "-paving")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.39, 0.34, 1)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    pm.materials.append(mat)
    po = bpy.data.objects.new(name + "-paving", pm)
    bpy.context.scene.collection.objects.link(po)
    parts.append(po)

    # the set itself, at its site
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=S["glb"])
    at = Vector((S["at"][0], -S["at"][2], S["at"][1]))
    for o in set(bpy.data.objects) - before:
        if o.parent is None:
            o.location += at
        if o.type == "MESH":
            parts.append(o)
bm.to_mesh(island.data)
bm.free()
bpy.context.view_layer.update()

# Join into the island (the parts land in its local frame), then give it back its own frame.
bpy.ops.object.select_all(action="DESELECT")
for o in parts:
    o.select_set(True)
island.select_set(True)
bpy.context.view_layer.objects.active = island
bpy.ops.object.join()
island.matrix_world = M0
bpy.context.view_layer.update()

bb = [island.matrix_world @ Vector(c) for c in island.bound_box]
bb1 = box(bb)
assert bb1 == bb0, ("bounding box moved", bb0, bb1)
for o in list(bpy.data.objects):
    if o is not island:
        bpy.data.objects.remove(o)
bpy.ops.object.select_all(action="DESELECT")
island.select_set(True)
bpy.ops.export_scene.gltf(filepath="art/paxos-3d.glb", use_selection=True)
print("BAKED", ", ".join(SETS), "into art/paxos-3d.glb")
