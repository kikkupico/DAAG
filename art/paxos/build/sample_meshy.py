"""Sample the Meshy Paxos model from directly above.

    blender -b -P art/paxos/build/sample_meshy.py -- art/archive/paxos-3d.glb art/paxos/build/sample

Writes <out>-height.npy (surface height per cell, NaN off the island), <out>-albedo.png
(unlit top-down colour, same grid) and <out>-grid.json (the grid's extent in model units).
The grid is W x H cells over the model's footprint, row 0 at +Y (north of the image).
"""
import bpy, sys, json
import numpy as np
from mathutils import Vector

import os
GLB, OUT = os.path.abspath(sys.argv[-2]), os.path.abspath(sys.argv[-1])
print("GLB", GLB, os.path.isfile(GLB))
W = 1600

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
x0, x1 = min(p.x for p in pts), max(p.x for p in pts)
y0, y1 = min(p.y for p in pts), max(p.y for p in pts)
z1 = max(p.z for p in pts)
pad = 0.01
x0, x1, y0, y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
cell = (x1 - x0) / W
H = int(round((y1 - y0) / cell))
y1 = y0 + H * cell

# --- heights by ray casting straight down -----------------------------------------
dg = bpy.context.evaluated_depsgraph_get()
sc = bpy.context.scene
height = np.full((H, W), np.nan, dtype=np.float32)
down = Vector((0, 0, -1))
for r in range(H):
    y = y1 - (r + 0.5) * cell
    for c in range(W):
        x = x0 + (c + 0.5) * cell
        hit, loc, *_ = sc.ray_cast(dg, Vector((x, y, z1 + 1)), down)
        if hit:
            height[r, c] = loc.z
np.save(OUT + "-height.npy", height)

# --- unlit top-down colour with the same framing ----------------------------------
sc.render.engine = "BLENDER_WORKBENCH"
sc.display.shading.light = "FLAT"
sc.display.shading.color_type = "TEXTURE"
sc.view_settings.view_transform = "Standard"
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.film_transparent = True
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = "ORTHO"
cam.data.ortho_scale = x1 - x0
cam.location = ((x0 + x1) / 2, (y0 + y1) / 2, z1 + 1)
cam.rotation_euler = (0, 0, 0)
sc.render.filepath = OUT + "-albedo.png"
bpy.ops.render.render(write_still=True)

json.dump({"x0": x0, "x1": x1, "y0": y0, "y1": y1, "W": W, "H": H, "cell": cell},
          open(OUT + "-grid.json", "w"))
print("grid", W, H, "cell", cell, "land cells", int(np.isfinite(height).sum()))
