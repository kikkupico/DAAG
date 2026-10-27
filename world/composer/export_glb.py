"""Export a built island to a glTF the composer can load.

    sh world/composer/export.sh [arche paxos]
    (python3 ground.py <island>, then blender -b world/build/<island>.blend -P export_glb.py [-- out.glb])

The island's Blender coordinates are kept (metres, +Z up in Blender); glTF's +Y up conversion makes
three.js coordinates (x, z, -y), so a shot's cam and target in shots.json map straight across
(composer.js: blenderToThree). Prototype collections (p_*, _protos) are left out; the instances
that stand in the world are exported with the geometry they show. The ground is displaced in its
shader, so its flat mesh is replaced by a heightmap mesh from terrain/<island>/height.npy, coloured by
the texture ground.py paints from the terrain masks.
"""
import os
import sys

import json
import re
import bpy
import numpy as np

island = os.path.splitext(os.path.basename(bpy.data.filepath))[0]
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[0] if argv else os.path.join(os.path.dirname(bpy.data.filepath), "composer", island + ".glb")
os.makedirs(os.path.dirname(out), exist_ok=True)

OUT = out
ROOT = os.path.dirname(os.path.dirname(bpy.data.filepath))      # world/
TERRAIN = os.path.join(ROOT, "build", "terrain", island)


def bake_terrain(target=768):
    """The island's ground is displaced in its shader, so its mesh is a flat plane. Replace it with a
    real heightmap mesh (about target x target cells) coloured by the terrain's preview image."""
    ob = bpy.data.objects[island + "_terrain"]
    meta = json.load(open(os.path.join(TERRAIN, "meta.json")))
    H = np.load(os.path.join(TERRAIN, "height.npy"), mmap_mode="r")
    step = max(1, meta["N"] // target)
    h = np.asarray(H[::step, ::step], np.float32)
    n_r, n_c = h.shape
    j, i = np.meshgrid(np.arange(n_c), np.arange(n_r))      # row 0 is north
    x = meta["x0"] + j * step * meta["px"]
    y = meta["y0"] - i * step * meta["px"]
    verts = np.stack([x, y, h], -1).reshape(-1, 3).astype(np.float32)
    idx = np.arange(n_r * n_c).reshape(n_r, n_c)
    faces = np.stack([idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]], -1).reshape(-1, 4)
    L = meta["L"]
    uv = np.stack([(x + L / 2) / L, (y + L / 2) / L], -1).reshape(-1, 2).astype(np.float32)

    me = bpy.data.meshes.new(island + "_terrain_baked")
    me.vertices.add(len(verts))
    me.vertices.foreach_set("co", verts.ravel())
    me.loops.add(faces.size)
    me.loops.foreach_set("vertex_index", faces.ravel())
    me.polygons.add(len(faces))
    me.polygons.foreach_set("loop_start", np.arange(0, faces.size, 4, dtype=np.int32))
    me.polygons.foreach_set("loop_total", np.full(len(faces), 4, np.int32))
    me.uv_layers.new(name="uv").data.foreach_set("uv", uv[faces.ravel()].ravel())
    me.update()
    me.shade_smooth()

    mat = bpy.data.materials.new(island + "_ground_baked")
    mat.use_nodes = True
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    ground = os.path.join(os.path.dirname(OUT), island + "_ground.png")
    if not os.path.exists(ground):
        raise SystemExit(f"{ground} missing: run python3 world/composer/ground.py {island} first (export.sh does both)")
    tex.image = bpy.data.images.load(ground)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.95
    mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    me.materials.append(mat)

    ob.modifiers.clear()
    ob.data = me


# Geometry-nodes instancers (columns, statues, pottery, boats...) hold only their points until realized.
# Realize the architectural and prop ones that are not too many; roof tiles, trees and rocks are
# thousands of copies and stay out (the buildings' own meshes keep their roofs).
SKIP_INST = re.compile(r"inst_(pan|cover|antefix|ridge|slab|court_tree|great_oak|rock_small|crag|qblock|pebble_w|pebble_b)")
MAX_POINTS = 4000


MAX_TRIS = 350_000      # per prototype: the pebbles and sails are heavier than they are worth here


def euler_matrices(e):
    """Rotation matrices (n, 3, 3) for XYZ euler angles (n, 3), as Blender's Euler To Rotation."""
    c, s = np.cos(e), np.sin(e)
    z, o = np.zeros(len(e)), np.ones(len(e))
    rx = np.stack([o, z, z, z, c[:, 0], -s[:, 0], z, s[:, 0], c[:, 0]], -1).reshape(-1, 3, 3)
    ry = np.stack([c[:, 1], z, s[:, 1], z, o, z, -s[:, 1], z, c[:, 1]], -1).reshape(-1, 3, 3)
    rz = np.stack([c[:, 2], -s[:, 2], z, s[:, 2], c[:, 2], z, z, z, o], -1).reshape(-1, 3, 3)
    return rz @ ry @ rx


def realize(ob):
    """Copies of the prototypes at the instancer's points (rot, scl, var attributes), as real meshes."""
    me = ob.data
    n = len(me.vertices)
    pts = np.empty(n * 3, np.float32)
    me.vertices.foreach_get("co", pts)
    pts = pts.reshape(-1, 3)
    attr = {}
    for name, key, dim, dt in (("rot", "vector", 3, np.float32), ("scl", "vector", 3, np.float32), ("var", "value", 1, np.int32)):
        a = me.attributes.get(name)
        buf = np.empty(n * dim, dt)
        if a:
            a.data.foreach_get(key, buf)
        else:
            buf[:] = 1 if name == "scl" else 0
        attr[name] = buf.reshape(n, dim) if dim > 1 else buf
    coll = next((md[i.identifier] for md in ob.modifiers if md.type == "NODES" and md.node_group
                 for i in md.node_group.interface.items_tree if i.name == "Collection" and i.in_out == "INPUT"), None)
    protos = [p for p in (coll.all_objects if coll else []) if p.type == "MESH"]
    if not protos:
        return 0
    which = attr["var"] % len(protos)
    R = euler_matrices(attr["rot"].astype(np.float64))
    made = 0
    for k, proto in enumerate(protos):
        sel = np.nonzero(which == k)[0]
        pm = proto.data
        pm.calc_loop_triangles()
        if not len(sel) or not len(pm.loop_triangles) or len(sel) * len(pm.loop_triangles) > MAX_TRIS:
            continue
        m = len(pm.vertices)
        V = np.empty(m * 3, np.float32)
        pm.vertices.foreach_get("co", V)
        V = V.reshape(-1, 3)
        T = np.empty(len(pm.loop_triangles) * 3, np.int32)
        pm.loop_triangles.foreach_get("vertices", T)
        T = T.reshape(-1, 3)
        M = np.empty(len(pm.loop_triangles), np.int32)
        pm.loop_triangles.foreach_get("material_index", M)
        verts = np.einsum("nij,mj->nmi", R[sel], V) * attr["scl"][sel][:, None, :] + pts[sel][:, None, :]
        tris = (T[None] + (np.arange(len(sel)) * m)[:, None, None]).reshape(-1, 3)
        out = bpy.data.meshes.new(f"{ob.name}_{k}")
        out.vertices.add(len(sel) * m)
        out.vertices.foreach_set("co", verts.reshape(-1, 3).astype(np.float32).ravel())
        out.loops.add(len(tris) * 3)
        out.loops.foreach_set("vertex_index", tris.ravel())
        out.polygons.add(len(tris))
        out.polygons.foreach_set("loop_start", np.arange(0, len(tris) * 3, 3, dtype=np.int32))
        out.polygons.foreach_set("loop_total", np.full(len(tris), 3, np.int32))
        out.polygons.foreach_set("material_index", np.tile(M, len(sel)))
        for mat in pm.materials:
            out.materials.append(mat)
        out.update()
        out.shade_smooth()
        new = bpy.data.objects.new(f"{ob.name}_{k}", out)
        (ob.users_collection[0] if ob.users_collection else bpy.context.scene.collection).objects.link(new)
        made += len(tris)
    ob.hide_viewport = True
    ob.hide_set(True)
    return made


def realize_instances():
    for ob in list(bpy.data.objects):
        if not ob.name.startswith("inst_") or ob.type != "MESH" or SKIP_INST.match(ob.name):
            continue
        if not any(m.type == "NODES" for m in ob.modifiers) or len(ob.data.vertices) > MAX_POINTS:
            continue
        print("REALIZED", ob.name, realize(ob), "triangles")


bake_terrain()
realize_instances()

for c in bpy.data.collections:
    if c.name == "_protos" or c.name.startswith("p_"):
        c.hide_viewport = True
        c.hide_render = True
        for o in c.all_objects:
            o.hide_set(True) if o.name in bpy.context.view_layer.objects else None
            o.hide_viewport = True

bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", use_visible=True, export_apply=True, export_yup=True,
    export_cameras=False, export_lights=False, export_image_format="JPEG", export_jpeg_quality=70,
    export_texture_dir="", will_save_settings=False)
print("WROTE", out, os.path.getsize(out) // 1024, "KiB")
