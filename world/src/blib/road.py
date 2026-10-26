"""Roads and paths as ribbon meshes with UVs (u = metres along, v = 0..1 across) and worn ruts."""
import math
import bpy
import numpy as np
from .core import link
from .mats import NT, new_mat, layer, finish, retint


def road_mat(name='road', ruts=True, tex='rocky_trail', tint=(0.8, 0.74, 0.64, 1)):
    m, nt = new_mat(name)
    if nt is None:
        return m
    uvn = nt.n('ShaderNodeUVMap'); uv = uvn.outputs[0]
    obj = nt.coords('Object')
    c, r, h = layer(nt, tex, nt.mapping(obj, 1 / 3.5))
    c2, r2, h2 = layer(nt, 'dirt', nt.mapping(obj, 1 / 2.5))
    sep = nt.n('ShaderNodeSeparateXYZ'); nt.link(uv, sep.inputs[0])
    v = sep.outputs['Y']
    edge = nt.ramp(nt.math('ABSOLUTE', nt.math('SUBTRACT', v, 0.5)), [(0.35, (0, 0, 0)), (0.5, (1, 1, 1))])
    nz = nt.noise(obj, 0.4, 4).outputs['Fac']
    edge = nt.math('MULTIPLY', edge, nt.math('ADD', nz, 0.4), clamp=True)
    col = nt.mix(edge, c2, c)
    rough = nt.mix(edge, r2, r, kind='FLOAT')
    hh = nt.mix(edge, h2, h, kind='FLOAT')
    if ruts:
        # two pairs of wheel ruts, one pair per lane
        def rut(center):
            d = nt.math('ABSOLUTE', nt.math('SUBTRACT', v, center))
            return nt.ramp(d, [(0.0, (1, 1, 1)), (0.025, (0.4, 0.4, 0.4)), (0.045, (0, 0, 0))])
        rr = nt.math('MAXIMUM', nt.math('MAXIMUM', rut(0.155), rut(0.375)), nt.math('MAXIMUM', rut(0.625), rut(0.845)))
        wob = nt.noise(obj, 0.8, 3).outputs['Fac']
        rr = nt.math('MULTIPLY', rr, nt.math('ADD', wob, 0.3), clamp=True)
        col = nt.mix(nt.math('MULTIPLY', rr, 0.5), col, (0.35, 0.3, 0.25, 1), blend='MULTIPLY')
        hh = nt.math('SUBTRACT', hh, nt.math('MULTIPLY', rr, 0.8))
    col = nt.mix(1.0, col, tint, blend='MULTIPLY')
    finish(nt, col, rough, hh, bump=0.8, dist=0.05)
    return m


def ribbon(name, pts, width, mat, coll=None, lift=0.06, closed=False, sample_z=None):
    pts = np.asarray(pts, float)
    if closed and np.linalg.norm(pts[0, :2] - pts[-1, :2]) > 1e-3:
        pts = np.vstack([pts, pts[:1]])
    d = np.gradient(pts[:, :2], axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    n = len(pts)
    ncross = 5
    V = []
    for i in range(n):
        for j in range(ncross):
            t = j / (ncross - 1) - 0.5
            p = pts[i, :2] + nrm[i] * t * width
            z = pts[i, 2] if sample_z is None else sample_z(p[0], p[1])
            crown = 0.08 * (1 - (2 * t) ** 2)
            V.append((p[0], p[1], z + lift + crown))
    V = np.array(V, np.float32)
    idx = np.arange(n * ncross).reshape(n, ncross)
    F = np.stack([idx[:-1, :-1], idx[:-1, 1:], idx[1:, 1:], idx[1:, :-1]], -1).reshape(-1, 4)
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts[:, :2], axis=0), axis=1))])
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.ravel())
    me.loops.add(F.size); me.loops.foreach_set('vertex_index', F.ravel().astype(np.int32))
    me.polygons.add(len(F)); me.polygons.foreach_set('loop_start', np.arange(len(F), dtype=np.int32) * 4)
    me.update(calc_edges=True)
    uvl = me.uv_layers.new(name='UVMap')
    U = np.repeat(s, ncross); Vv = np.tile(np.linspace(0, 1, ncross), n)
    uvv = np.stack([U / 4.0, Vv], 1)
    loop_uv = uvv[F.ravel()]
    uvl.data.foreach_set('uv', loop_uv.astype(np.float32).ravel())
    me.shade_smooth()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    return ob


def parapet_points(pts, field_z, side_drop=2.0, offset=3.6):
    """Segments of the road where the seaward/downhill side drops; returns list of polylines for a parapet."""
    pts = np.asarray(pts, float)
    d = np.gradient(pts[:, :2], axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    runs = []; cur = []
    for i in range(len(pts)):
        best = None
        for s in (-1, 1):
            q = pts[i, :2] + nrm[i] * s * (offset + 5)
            drop = pts[i, 2] - field_z(q[0], q[1])
            if drop > side_drop and (best is None or drop > best[1]):
                best = (s, drop)
        if best:
            q = pts[i, :2] + nrm[i] * best[0] * offset
            cur.append((q[0], q[1], pts[i, 2]))
        elif cur:
            if len(cur) > 4:
                runs.append(np.array(cur))
            cur = []
    if len(cur) > 4:
        runs.append(np.array(cur))
    return runs
