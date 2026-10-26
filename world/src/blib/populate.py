"""Vegetation and rock prototypes, and density-driven scattering over an island."""
import glob, json, math, os
import bpy
import numpy as np
from .core import PH, collection, import_gltf
from . import veg, scatter

F32 = np.float32


def _desaturate_imported(objs, sat=0.35, val=0.9, tint=None):
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not m or not m.use_nodes or m.get('_grey'):
                continue
            nt = m.node_tree
            bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if not bsdf or not bsdf.inputs['Base Color'].links:
                continue
            src = bsdf.inputs['Base Color'].links[0].from_socket
            hs = nt.nodes.new('ShaderNodeHueSaturation')
            hs.inputs['Saturation'].default_value = sat; hs.inputs['Value'].default_value = val
            nt.links.new(src, hs.inputs['Color'])
            out = hs.outputs[0]
            if tint:
                mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
                mx.inputs[0].default_value = 1.0; mx.inputs[7].default_value = tint
                nt.links.new(out, mx.inputs[6]); out = mx.outputs[2]
            nt.links.new(out, bsdf.inputs['Base Color'])
            m['_grey'] = True


def _cutout(asset, gltf, objs):
    """Give the asset's leaf, twig and blade materials their cut-out: Poly Haven ships it as a separate
    Alpha map (fetched beside the textures), since the glTF's colour map is a JPG with no transparency.
    Without it every leaf card renders as a solid patch of the atlas's pale background."""
    alpha = glob.glob(os.path.join(PH, 'models', asset, 'textures', f'{asset}_alpha_*.png'))
    if not alpha:
        return
    cut = {m['name'] for m in json.load(open(gltf)).get('materials', []) if m.get('alphaMode') in ('MASK', 'BLEND')}
    img = bpy.data.images.load(alpha[0], check_existing=True)
    img.colorspace_settings.name = 'Non-Color'
    done = set()
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not m or m.name in done or m.name.split('.')[0] not in cut or not m.node_tree:
                continue
            done.add(m.name)
            nt = m.node_tree
            bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            colour = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
            if not bsdf:
                continue
            tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; tex.interpolation = 'Closest'
            if colour and colour.inputs['Vector'].links:
                nt.links.new(colour.inputs['Vector'].links[0].from_socket, tex.inputs['Vector'])
            nt.links.new(tex.outputs['Color'], bsdf.inputs['Alpha'])


def _ph(asset, coll, pick=None, grey=None, join=False):
    g = glob.glob(os.path.join(PH, 'models', asset, '*.gltf'))[0]
    objs = [o for o in import_gltf(g, coll) if o.type == 'MESH']
    _cutout(asset, g, objs)
    if join and len(objs) > 1:
        for o in objs:
            o.parent = None
        ctx = {'active_object': objs[0], 'selected_editable_objects': objs, 'selected_objects': objs}
        with bpy.context.temp_override(**ctx):
            bpy.ops.object.join()
        objs = [objs[0]]
        objs[0].location = (0, 0, 0)
    keep = []
    for o in objs:
        if pick and not any(p in o.name for p in pick):
            bpy.data.objects.remove(o); continue
        o.location = (0, 0, 0)
        keep.append(o)
    if grey:
        _desaturate_imported(keep, *grey)
    return keep


def build_protos(full=True):
    M = veg.species_mats()
    P = {}

    def species(name, sp, n, seed0=0, **kw):
        c = scatter.proto_collection('p_' + name)
        for k in range(n):
            veg.make_tree(sp, f'{name}_{k:02d}', c, seed=seed0 + k * 7 + 1, mats=M, **kw)
        P[name] = c

    species('olive', 'olive', 7)
    species('cypress', 'cypress', 5)
    species('pine', 'pine', 7)
    species('lentisk', 'lentisk', 6)
    species('thyme', 'thyme', 6)
    species('oak', 'oak', 2, seed0=100, height=3.0)
    c = scatter.proto_collection('p_maquis_ph')
    _ph('searsia_lucida', c, pick=['_a_', '_b_', '_c_', '_d_'])
    _ph('wild_rooibos_bush', c, pick=['_a', '_b', '_c'])
    _ph('shrub_02', c)
    P['maquis_ph'] = c
    c = scatter.proto_collection('p_grass')
    _ph('grass_medium_02', c)
    P['grass'] = c
    c = scatter.proto_collection('p_boulder')
    for a in ('namaqualand_boulder_02', 'namaqualand_boulder_03', 'namaqualand_boulder_05', 'boulder_01'):
        _ph(a, c, grey=(0.18, 1.0, (0.92, 0.9, 0.86, 1)))
    P['boulder'] = c
    scatter.hide_protos()
    return P


class Field:
    """Island data at reduced resolution for density work, with full-res height for z."""

    def __init__(self, d, meta, H, step=2):
        self.meta = meta; self.H = H
        self.N = meta['N']; self.px = meta['px']; self.x0 = meta['x0']; self.y0 = meta['y0']
        mz = np.load(os.path.join(d, 'masks.npz'))
        self.masks = {k: mz[k][::step, ::step].astype(F32) / 255 for k in mz.files}
        self.step = step
        self.h = H[::step, ::step]
        self.cpx = self.px * step
        gy, gx = np.gradient(self.h, self.cpx)
        self.slope = np.degrees(np.arctan(np.hypot(gx, gy))).astype(F32)
        self.ys = (self.y0 - np.arange(self.h.shape[0]) * self.cpx).astype(F32)
        self.xs = (self.x0 + np.arange(self.h.shape[1]) * self.cpx).astype(F32)
        # wetness: concave ground (gullies) from a blurred Laplacian
        from .fieldops import blur
        hb = blur(self.h, max(2, int(40 / self.cpx)))
        lap = (np.roll(hb, 1, 0) + np.roll(hb, -1, 0) + np.roll(hb, 1, 1) + np.roll(hb, -1, 1) - 4 * hb) / self.cpx ** 2
        self.wet = np.clip(lap * 400, 0, 1).astype(F32)
        self.rng = np.random.default_rng(5)

    def noise(self, scale, seed):
        r = np.random.default_rng(seed)
        n = max(4, int(self.h.shape[0] * self.cpx / scale))
        g = r.random((n + 1, n + 1)).astype(F32)
        from .fieldops import upsample
        return upsample(g, self.h.shape)

    def z(self, X, Y):
        u = (X - self.x0) / self.px; v = (self.y0 - Y) / self.px
        u = np.clip(u, 0, self.N - 1.001); v = np.clip(v, 0, self.N - 1.001)
        i = np.floor(v).astype(np.int64); j = np.floor(u).astype(np.int64); fu = u - j; fv = v - i
        H = self.H
        return (H[i, j] * (1 - fu) * (1 - fv) + H[i, j + 1] * fu * (1 - fv) + H[i + 1, j] * (1 - fu) * fv + H[i + 1, j + 1] * fu * fv)

    def sample(self, density, cap=None):
        """Poisson points from a density map (per square metre)."""
        lam = np.clip(density, 0, None) * self.cpx ** 2
        cnt = self.rng.poisson(lam)
        ii, jj = np.nonzero(cnt)
        reps = cnt[ii, jj]
        ii = np.repeat(ii, reps); jj = np.repeat(jj, reps)
        X = self.xs[jj] + (self.rng.random(len(jj)) - 0.5) * self.cpx
        Y = self.ys[ii] + (self.rng.random(len(ii)) - 0.5) * self.cpx
        if cap and len(X) > cap:
            k = self.rng.choice(len(X), cap, replace=False); X, Y = X[k], Y[k]
        return np.stack([X, Y, self.z(X, Y) - 0.2], 1).astype(F32)

    def near(self, pts, R):
        """Weight that falls from 1 at any of pts to 0 at distance R."""
        w = np.zeros_like(self.h)
        X, Y = np.meshgrid(self.xs, self.ys)
        for (x, y) in pts:
            d = np.hypot(X - x, Y - y)
            w = np.maximum(w, np.clip(1 - d / R, 0, 1))
        return w


def place(name, F, density, protos, coll, smin=0.8, smax=1.2, tilt=0.0, cap=None, sink=0.2):
    pts = F.sample(density, cap)
    pts[:, 2] -= sink - 0.2
    n = len(pts)
    sc = F.rng.uniform(smin, smax, n).astype(F32)
    ob = scatter.instances(name, pts, protos, coll, scale=sc, tilt=tilt, seed=hash(name) % 1000)
    print('SCATTER', name, n)
    return ob
