"""Decimate the downloaded scans and save them, upright and life size, into assets/statues/statues.blend."""
import bpy, glob, os, math
from mathutils import Vector
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'statues')
FLIP = {'Athena', 'Ephebe'}
HEIGHTS = {'Athena': 2.05, 'Plato': 1.75, 'Jüngling_Vom_Magdalensberg': 1.86, 'hermes': 1.62, 'Ephebe': 1.55}
bpy.ops.wm.read_factory_settings(use_empty=True)
for d in sorted(glob.glob(os.path.join(ROOT, 'x_*'))):
    name = os.path.basename(d)[2:]
    f = [p for p in glob.glob(os.path.join(d, '*')) if p.lower().endswith('.obj')][0]
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=f)
    obs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    bpy.context.view_layer.objects.active = obs[0]
    for o in obs: o.select_set(True)
    if len(obs) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = 'statue_' + name.split('_')[0].lower()
    n = len(ob.data.polygons)
    m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1.0, 160000 / n)
    bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    import numpy as np
    from mathutils import Matrix
    co = np.empty(len(ob.data.vertices) * 3, np.float32); ob.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    c0 = co.mean(0); w, V = np.linalg.eigh(np.cov((co - c0).T))
    ax = V[:, np.argmax(w)]
    if ax[2] < 0: ax = -ax
    if name in FLIP: ax = -ax
    z = np.array([0, 0, 1.0]); v = np.cross(ax, z); sn = np.linalg.norm(v); cs = ax @ z
    if sn > 1e-6:
        K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]]) / sn
        ang = math.atan2(sn, cs)
        R = np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K
        M4 = Matrix(np.vstack([np.hstack([R, np.zeros((3, 1))]), [0, 0, 0, 1]]).tolist())
        ob.data.transform(M4)
    co = np.empty(len(ob.data.vertices) * 3, np.float32); ob.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    zmin, zmax = co[:, 2].min(), co[:, 2].max()
    low = co[co[:, 2] < zmin + 0.1 * (zmax - zmin)]
    cx, cy = low[:, 0].mean(), low[:, 1].mean()
    s = HEIGHTS.get(name, 1.8) / (zmax - zmin)
    co = np.stack([(co[:, 0] - cx) * s, (co[:, 1] - cy) * s, (co[:, 2] - zmin) * s], 1)
    ob.data.vertices.foreach_set('co', co.ravel()); ob.data.update()
    for sl in list(ob.data.materials): pass
    ob.data.materials.clear()
    ob.location = (0, 0, 0)
    print('STATUE', ob.name, n, '->', len(ob.data.polygons), [round(x, 2) for x in ob.dimensions])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'statues.blend'), compress=True)
