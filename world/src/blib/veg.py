"""Procedural Mediterranean trees and shrubs: branching skeletons as bark tubes, leaf-spray cards."""
import math, os
import bpy
import numpy as np
from mathutils import Vector
from .core import ROOT, link
from .mats import NT, new_mat, layer, image, finish

LEAVES = os.path.join(ROOT, 'assets', 'leaves')


def bark_mat(name, tex, tint=(1, 1, 1, 1), scale=0.8):
    m, nt = new_mat('bark_' + name)
    if nt is None:
        return m
    vec = nt.mapping(nt.coords('Object'), 1 / scale)
    c, r, h = layer(nt, tex, vec)
    c = nt.mix(1.0, c, tint, blend='MULTIPLY')
    finish(nt, c, r, h, bump=0.8, dist=0.03)
    return m


def leaf_mat(name, tint=(1, 1, 1, 1), rough=0.5, trans=0.35, var=0.15):
    m, nt = new_mat('leaf_' + name)
    if nt is None:
        return m
    tx = nt.n('ShaderNodeTexImage'); tx.image = image(os.path.join(LEAVES, name + '.png'))
    nt.link(nt.n('ShaderNodeUVMap').outputs[0], tx.inputs['Vector'])
    col = nt.mix(1.0, tx.outputs['Color'], tint, blend='MULTIPLY')
    info = nt.n('ShaderNodeObjectInfo')
    hsv = nt.n('ShaderNodeHueSaturation')
    nt.set(hsv.inputs['Hue'], nt.math('ADD', nt.math('MULTIPLY', info.outputs['Random'], 0.04), 0.48))
    nt.set(hsv.inputs['Value'], nt.math('ADD', nt.math('MULTIPLY', info.outputs['Random'], var * 2), 1 - var))
    nt.set(hsv.inputs['Color'], col)
    col = hsv.outputs[0]
    bsdf = nt.n('ShaderNodeBsdfPrincipled')
    nt.set(bsdf.inputs['Base Color'], col)
    bsdf.inputs['Roughness'].default_value = rough
    tr = nt.n('ShaderNodeBsdfTranslucent')
    nt.set(tr.inputs['Color'], nt.mix(1.0, col, (1.4, 1.5, 0.9, 1), blend='MULTIPLY'))
    mx = nt.n('ShaderNodeMixShader'); mx.inputs[0].default_value = trans
    nt.link(bsdf.outputs[0], mx.inputs[1]); nt.link(tr.outputs[0], mx.inputs[2])
    tp = nt.n('ShaderNodeBsdfTransparent')
    mx2 = nt.n('ShaderNodeMixShader')
    nt.link(tx.outputs['Alpha'], mx2.inputs[0]); nt.link(tp.outputs[0], mx2.inputs[1]); nt.link(mx.outputs[0], mx2.inputs[2])
    out = nt.n('ShaderNodeOutputMaterial'); nt.link(mx2.outputs[0], out.inputs['Surface'])
    return m


class Builder:
    def __init__(self, seed):
        self.rng = np.random.default_rng(seed)
        self.V = []; self.F = []; self.nv = 0
        self.LV = []; self.LF = []; self.LUV = []; self.nl = 0

    # -- bark
    def tube(self, pts, radii, sides):
        pts = np.asarray(pts, float); radii = np.asarray(radii, float)
        n = len(pts)
        t = np.gradient(pts, axis=0); t /= np.linalg.norm(t, axis=1, keepdims=True) + 1e-9
        ref = np.array([0, 0, 1.0]) if abs(t[0][2]) < 0.9 else np.array([1.0, 0, 0])
        nrm = np.cross(t[0], ref); nrm /= np.linalg.norm(nrm)
        ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
        ring = []
        for k in range(n):
            if k:
                nrm = nrm - t[k] * (nrm @ t[k]); nrm /= np.linalg.norm(nrm) + 1e-9
            b = np.cross(t[k], nrm)
            ring.append(pts[k] + radii[k] * (np.cos(ang)[:, None] * nrm + np.sin(ang)[:, None] * b))
        V = np.concatenate(ring)
        idx = np.arange(n * sides).reshape(n, sides)
        F = np.stack([idx[:-1], np.roll(idx[:-1], -1, 1), np.roll(idx[1:], -1, 1), idx[1:]], -1).reshape(-1, 4)
        self.V.append(V); self.F.append(F + self.nv); self.nv += len(V)

    # -- foliage card anchored at p, growing along u
    def card(self, p, u, size, aspect=1.0):
        u = np.asarray(u, float); u /= np.linalg.norm(u) + 1e-9
        r = self.rng.normal(size=3); s = np.cross(u, r); s /= np.linalg.norm(s) + 1e-9
        w = size * aspect / 2
        p = np.asarray(p, float)
        q = np.array([p - s * w, p + s * w, p + s * w + u * size, p - s * w + u * size])
        self.LV.append(q); self.LF.append(np.array([[0, 1, 2, 3]]) + self.nl); self.nl += 4
        self.LUV.append(np.array([[0, 0], [1, 0], [1, 1], [0, 1]], float))

    def build(self, name, bark, leaf, coll):
        V = np.concatenate(self.V) if self.V else np.zeros((0, 3))
        F = np.concatenate(self.F) if self.F else np.zeros((0, 4), int)
        LV = np.concatenate(self.LV) if self.LV else np.zeros((0, 3))
        LF = np.concatenate(self.LF) if self.LF else np.zeros((0, 4), int)
        allV = np.concatenate([V, LV]).astype(np.float32)
        allF = np.concatenate([F, LF + len(V)]).astype(np.int32)
        me = bpy.data.meshes.new(name)
        me.vertices.add(len(allV)); me.vertices.foreach_set('co', allV.ravel())
        me.loops.add(allF.size); me.loops.foreach_set('vertex_index', allF.ravel())
        me.polygons.add(len(allF)); me.polygons.foreach_set('loop_start', np.arange(len(allF), dtype=np.int32) * 4)
        me.update(calc_edges=True)
        uv = me.uv_layers.new(name='UVMap')
        uvs = np.zeros((len(allF) * 4, 2), np.float32)
        if self.LUV:
            uvs[len(F) * 4:] = np.concatenate(self.LUV)
        uv.data.foreach_set('uv', uvs.ravel())
        mi = np.zeros(len(allF), np.int32); mi[len(F):] = 1
        me.polygons.foreach_set('material_index', mi)
        sm = np.zeros(len(allF), bool); sm[:len(F)] = True
        me.polygons.foreach_set('use_smooth', sm)
        me.materials.append(bark); me.materials.append(leaf)
        ob = bpy.data.objects.new(name, me)
        link(ob, coll)
        return ob


def branch(B, sp, pos, d, length, radius, level, path_noise):
    rng = B.rng
    seg = max(0.12, length / sp['segs'][level])
    n = max(3, int(round(length / seg)))
    pts = [np.array(pos, float)]; rad = [radius]
    d = np.array(d, float); d /= np.linalg.norm(d)
    up = np.array([0, 0, 1.0])
    for k in range(n):
        d = d + rng.normal(0, sp['wobble'][level], 3) + up * sp['tropism'][level]
        d /= np.linalg.norm(d)
        pts.append(pts[-1] + d * (length / n))
        t = (k + 1) / n
        rad.append(radius * (1 - t * sp['taper'][level]) * (1 + sp.get('gnarl', 0) * rng.normal(0, 0.12) * (level == 0)))
    pts = np.array(pts)
    if level == 0 and sp.get('flare'):
        rad[0] *= sp['flare']; rad[1] *= 1 + (sp['flare'] - 1) * 0.4
    sides = max(4, min(14, int(6 + radius * 18)))
    B.tube(pts, rad, sides)
    # children
    if level + 1 < len(sp['children']):
        cnt = sp['children'][level + 1]
        cnt = int(rng.integers(max(1, cnt - 1), cnt + 2))
        t0 = sp['start'][level + 1]
        for c in range(cnt):
            t = t0 + (1 - t0) * ((c + rng.random()) / cnt) if not sp.get('tipsplit', [0] * 9)[level + 1] else rng.uniform(0.85, 1.0)
            k = min(n - 1, int(t * n))
            p = pts[k]
            pd = pts[min(n, k + 1)] - pts[k]; pd /= np.linalg.norm(pd) + 1e-9
            a = math.radians(sp['angle'][level + 1] + rng.normal(0, 10))
            roll = rng.uniform(0, 2 * np.pi) + c * 2.4
            ref = np.array([0, 0, 1.0]) if abs(pd[2]) < 0.95 else np.array([1.0, 0, 0])
            x = np.cross(pd, ref); x /= np.linalg.norm(x); y = np.cross(pd, x)
            nd = pd * math.cos(a) + (x * math.cos(roll) + y * math.sin(roll)) * math.sin(a)
            L = length * sp['ratio'][level + 1] * rng.uniform(0.75, 1.15) * (1 - 0.35 * t * sp.get('shorten', 0))
            r = max(0.008, rad[k] * sp['rratio'][level + 1])
            branch(B, sp, p, nd, L, r, level + 1, path_noise)
    # leaves
    if level >= sp['leaf_level']:
        nc = sp['cards_per'] * max(1, int(length / sp['card_size']))
        for c in range(nc):
            t = rng.uniform(sp.get('leaf_from', 0.3), 1.0)
            k = min(n, int(t * n))
            p = pts[k]
            bd = pts[min(n, k + 1)] - pts[max(0, k - 1)]; bd /= np.linalg.norm(bd) + 1e-9
            u = bd * 0.6 + rng.normal(0, 0.6, 3) + np.array([0, 0, sp.get('leaf_up', 0.2)])
            B.card(p, u, sp['card_size'] * rng.uniform(0.75, 1.2))


SPECIES = {
    'olive': dict(segs=[7, 6, 5, 4], wobble=[0.22, 0.25, 0.25, 0.3], tropism=[0.05, 0.03, 0.0, -0.04],
                  taper=[0.35, 0.5, 0.6, 0.8], children=[1, 3, 7, 6], start=[0, 0.85, 0.25, 0.25],
                  angle=[0, 32, 45, 50], ratio=[1, 1.35, 0.6, 0.55], rratio=[1, 0.62, 0.45, 0.5],
                  tipsplit=[0, 1, 0, 0], leaf_level=2, cards_per=6, card_size=0.9, leaf_from=0.15, leaf_up=0.0,
                  gnarl=1.0, flare=1.5, shorten=1),
    'pine': dict(segs=[12, 6, 4], wobble=[0.09, 0.18, 0.25], tropism=[0.015, 0.08, 0.08], taper=[0.78, 0.65, 0.7],
                 children=[1, 13, 6], start=[0, 0.42, 0.25], angle=[0, 68, 38], ratio=[1, 0.42, 0.5],
                 rratio=[1, 0.42, 0.5], leaf_level=1, cards_per=5, card_size=1.1, leaf_from=0.4, leaf_up=0.9,
                 flare=1.35, shorten=1),
    'oak': dict(segs=[8, 7, 6, 4, 3], wobble=[0.08, 0.15, 0.2, 0.25, 0.3], tropism=[0.02, 0.03, 0.02, 0.0, -0.03],
                taper=[0.3, 0.55, 0.6, 0.7, 0.8], children=[1, 6, 6, 6, 5], start=[0, 0.88, 0.25, 0.2, 0.2],
                angle=[0, 48, 42, 48, 50], ratio=[1, 1.9, 0.55, 0.5, 0.5], rratio=[1, 0.55, 0.5, 0.5, 0.5],
                tipsplit=[0, 1, 0, 0, 0], leaf_level=2, cards_per=7, card_size=1.25, leaf_from=0.1, leaf_up=0.15,
                gnarl=0.6, flare=1.7, shorten=1),
    'lentisk': dict(segs=[4, 3], wobble=[0.25, 0.3], tropism=[0.05, 0.0], taper=[0.8, 0.8], children=[11, 5],
                    start=[0, 0.25], angle=[0, 45], ratio=[1, 0.6], rratio=[1, 0.6], leaf_level=0, cards_per=6,
                    card_size=0.6, leaf_from=0.05, leaf_up=0.3),
}


def make_tree(species, name, coll, seed, height=None, mats=None):
    sp = SPECIES.get(species)
    B = Builder(seed); rng = B.rng
    if species == 'olive':
        h = height or rng.uniform(1.4, 2.2)
        branch(B, sp, (0, 0, 0), (rng.normal(0, 0.15), rng.normal(0, 0.15), 1), h, rng.uniform(0.22, 0.34), 0, 0)
    elif species == 'pine':
        h = height or rng.uniform(9, 14)
        lean = rng.normal(0, 0.18, 2)
        branch(B, sp, (0, 0, 0), (lean[0], lean[1], 1), h, h * 0.03, 0, 0)
    elif species == 'oak':
        h = height or 4.0
        branch(B, sp, (0, 0, 0), (0, 0, 1), h, h * 0.24, 0, 0)
    elif species == 'lentisk':
        sp = dict(sp)
        for k in range(sp['children'][0]):
            pass
        # a clump of stems from the ground
        for c in range(int(rng.integers(18, 26))):
            a = rng.uniform(0, 2 * np.pi); tilt = math.radians(rng.uniform(20, 60))
            d = (math.sin(tilt) * math.cos(a), math.sin(tilt) * math.sin(a), math.cos(tilt))
            branch(B, sp, (rng.normal(0, 0.12), rng.normal(0, 0.12), 0), d, rng.uniform(1.0, 2.0), 0.03, 0, 0)
    elif species == 'cypress':
        H = height or rng.uniform(11, 17)
        B.tube([(0, 0, 0), (0, 0, H * 0.5), (rng.normal(0, 0.05), rng.normal(0, 0.05), H * 0.95)], [0.28, 0.18, 0.04], 8)
        R = rng.uniform(0.95, 1.35)
        n = int(H * 210)
        for c in range(n):
            z = H * (rng.random() ** 0.85) * 0.97 + 0.6
            zz = (z - 0.4) / H
            prof = R * (min(1.0, zz / 0.18) ** 0.5) * max(0.0, 1 - zz) ** 0.75 * 1.25
            a = rng.uniform(0, 2 * np.pi); rr = prof * (0.55 + 0.45 * rng.random() ** 0.5)
            p = (rr * math.cos(a), rr * math.sin(a), z - 0.35)
            u = np.array([math.cos(a) * 0.35, math.sin(a) * 0.35, 1.0]) + rng.normal(0, 0.15, 3)
            B.card(p, u, rng.uniform(0.6, 0.9), aspect=0.75)
    elif species == 'thyme':
        R = rng.uniform(0.25, 0.45)
        for c in range(int(rng.integers(22, 34))):
            a = rng.uniform(0, 2 * np.pi); tilt = rng.uniform(0, 1.2)
            p = (rng.normal(0, R * 0.3), rng.normal(0, R * 0.3), 0)
            u = (math.sin(tilt) * math.cos(a), math.sin(tilt) * math.sin(a), math.cos(tilt))
            B.card(p, u, R * rng.uniform(0.9, 1.3))
    bark, leaf = mats[species]
    return B.build(name, bark, leaf, coll)


def species_mats():
    return {
        'olive': (bark_mat('olive', 'tree_bark_03', (0.75, 0.73, 0.68, 1), 0.6), leaf_mat('olive', (1.0, 1.0, 0.95, 1), 0.55)),
        'pine': (bark_mat('pine', 'pine_bark', (0.9, 0.8, 0.75, 1), 0.7), leaf_mat('pine', (0.95, 1, 0.9, 1), 0.6, 0.3)),
        'oak': (bark_mat('oak', 'jolcham_oak_bark_01', (0.85, 0.82, 0.78, 1), 0.9), leaf_mat('oak', (0.95, 1.0, 0.9, 1), 0.5)),
        'cypress': (bark_mat('cypress', 'bark_brown_02', (0.7, 0.6, 0.5, 1), 0.5), leaf_mat('cypress', (0.95, 1.0, 0.95, 1), 0.6, 0.25, 0.1)),
        'lentisk': (bark_mat('lentisk', 'bark_brown_02', (0.6, 0.55, 0.5, 1), 0.3), leaf_mat('lentisk', (1.0, 1.0, 0.95, 1), 0.35, 0.3)),
        'thyme': (bark_mat('thyme', 'bark_brown_02', (0.6, 0.55, 0.5, 1), 0.3), leaf_mat('thyme', (1, 1, 1, 1), 0.7, 0.2)),
    }
