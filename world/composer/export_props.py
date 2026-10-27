"""Export the live props of the built islands, one glb each, for the composer's prop palette.

    blender -b world/build/paxos.blend -P world/composer/export_props.py
    blender -b world/build/arche.blend -P world/composer/export_props.py     (adds what only Arche has)

The props are the prototypes the islands scatter and the buildings use (the p_* collections), so
what is placed in the composer is the model a render shows. Each is moved to stand on z = 0 with its
footprint centred on the origin, in metres. Writes world/build/composer/props/<id>.glb and props.json.
Vegetation, rocks, roof tiles and wall blocks are left out: the scene already carries them.
"""
import json
import os

import bpy
import mathutils
import numpy as np

HERE = os.path.dirname(bpy.data.filepath)
OUT = os.path.join(HERE, "composer", "props")
os.makedirs(OUT, exist_ok=True)

# collection stem: (category, name); one id per object when a collection holds several variants
WANTED = {
    "cart": ("Transport", "Oxcart"), "handcart": ("Transport", "Handcart"),
    "skiff": ("Vessels", "Skiff"), "courier_boat": ("Vessels", "Courier boat"), "ferry": ("Vessels", "Ferry"),
    "merchantman": ("Vessels", "Merchant ship"),
    "amphora": ("Goods", "Amphora"), "pithos": ("Goods", "Pithos"), "crate": ("Goods", "Crate"),
    "sack": ("Goods", "Sack"), "nets": ("Goods", "Fishing nets"), "basket": ("Goods", "Basket"),
    "scroll": ("Goods", "Scroll"),
    "doric_plain": ("Columns", "Doric column, plain"), "doric_fluted": ("Columns", "Doric column, fluted"),
    "doric_lowerplain": ("Columns", "Doric column, lower plain"), "ionic": ("Columns", "Ionic column"),
    "corinthian": ("Columns", "Corinthian column"),
    "statue_athena": ("Statues", "Athena"), "statue_ephebe": ("Statues", "Ephebe"),
    "statue_hermes": ("Statues", "Hermes"), "statue_plato": ("Statues", "Plato"),
    "statue_jungling": ("Statues", "Youth"),
    "flag": ("Goods", "Flag"),
}
EXTRA = {"merchantman": ["merchant_sail"]}      # collections exported together with it
ICON = {"Transport": "🛒", "Vessels": "⛵", "Goods": "🏺", "Columns": "🏛️", "Statues": "🗿"}

catalog_path = os.path.join(OUT, "props.json")
catalog = {p["id"]: p for p in json.load(open(catalog_path))} if os.path.exists(catalog_path) else {}


def objects_of(stem):
    c = bpy.data.collections.get("p_" + stem)
    return [o for o in (c.objects if c else []) if o.type == "MESH"]


def export(pid, objs):
    """Export objs standing on z = 0, centred on the origin."""
    pts = np.concatenate([np.array([o.matrix_world @ mathutils.Vector(v) for v in o.bound_box]) for o in objs])
    lo, hi = pts.min(0), pts.max(0)
    shift = mathutils.Matrix.Translation((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))
    temps = []
    for o in objs:
        t = bpy.data.objects.new(pid + "_tmp", o.data)
        t.matrix_world = shift @ o.matrix_world
        bpy.context.scene.collection.objects.link(t)
        temps.append(t)
    bpy.ops.object.select_all(action="DESELECT")
    for t in temps:
        t.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, pid + ".glb"), export_format="GLB", use_selection=True, export_apply=True,
        export_yup=True, export_cameras=False, export_lights=False, export_image_format="JPEG")
    for t in temps:
        bpy.data.objects.remove(t)
    return [round(float(x), 2) for x in hi - lo]


for stem, (category, name) in WANTED.items():
    objs = objects_of(stem)
    if not objs:
        continue
    groups = {stem: objs[:1] if len(objs) == 1 else objs[:1]}
    if len(objs) > 1 and stem not in EXTRA:
        groups = {o.name.removeprefix("p_"): [o] for o in objs}
    elif stem in EXTRA:
        groups = {stem: objs + [o for e in EXTRA[stem] for o in objects_of(e)]}
    for i, (pid, group) in enumerate(groups.items()):
        size = export(pid, group)
        label = name if len(groups) == 1 else f"{name} {i + 1}"
        catalog[pid] = {"id": pid, "name": label, "category": category, "type": "live",
                        "url": f"/props/live/{pid}.glb", "scale": 1.0, "icon": ICON.get(category, "▫️"), "size_m": size}
        print("PROP", pid, size)

json.dump(sorted(catalog.values(), key=lambda p: (p["category"], p["id"])), open(catalog_path, "w"), indent=1)
print("WROTE", catalog_path, len(catalog), "props")
