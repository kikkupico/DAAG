"""Materials: scanned PBR sets from Poly Haven (box-mapped, varied) and procedural extras."""
import os
import bpy
from .core import PH

TEX = os.path.join(PH, 'textures')
_cache = {}


class NT:
    """Tiny node-tree builder."""

    def __init__(self, tree):
        self.t = tree; self.N = tree.nodes; self.L = tree.links
        self.x = 0

    def n(self, kind, inputs=None, **props):
        nd = self.N.new(kind)
        nd.location = (self.x, 0); self.x += 40
        for k, v in props.items():
            setattr(nd, k, v)
        for k, v in (inputs or {}).items():
            self.set(nd.inputs[k], v)
        return nd

    def set(self, sock, v):
        if hasattr(v, 'is_output') or hasattr(v, 'links') and hasattr(v, 'node'):
            self.L.new(v, sock)
        else:
            sock.default_value = v

    def link(self, a, b):
        self.L.new(a, b)

    # arithmetic helpers -------------------------------------------------
    def math(self, op, a, b=0.0, clamp=False):
        nd = self.n('ShaderNodeMath', operation=op, use_clamp=clamp)
        self.set(nd.inputs[0], a); self.set(nd.inputs[1], b)
        return nd.outputs[0]

    def mix(self, fac, a, b, kind='RGBA', blend='MIX'):
        nd = self.n('ShaderNodeMix', data_type=kind, blend_type=blend)
        if kind == 'RGBA':
            self.set(nd.inputs[0], fac); self.set(nd.inputs[6], a); self.set(nd.inputs[7], b)
            return nd.outputs[2]
        if kind == 'FLOAT':
            self.set(nd.inputs[0], fac); self.set(nd.inputs[2], a); self.set(nd.inputs[3], b)
            return nd.outputs[0]
        self.set(nd.inputs[0], fac); self.set(nd.inputs[4], a); self.set(nd.inputs[5], b)
        return nd.outputs[1]

    def ramp(self, fac, stops, interp='LINEAR'):
        nd = self.n('ShaderNodeValToRGB')
        cr = nd.color_ramp; cr.interpolation = interp
        while len(cr.elements) > 1:
            cr.elements.remove(cr.elements[-1])
        p0, c0 = stops[0]
        cr.elements[0].position = p0
        cr.elements[0].color = c0 if len(c0) == 4 else (*c0, 1)
        for p, c in stops[1:]:
            e = cr.elements.new(p)
            e.color = c if len(c) == 4 else (*c, 1)
        self.set(nd.inputs[0], fac)
        return nd.outputs[0]

    def noise(self, vec, scale, detail=4, rough=0.55, dim='3D', distortion=0.0):
        nd = self.n('ShaderNodeTexNoise', noise_dimensions=dim)
        if vec is not None:
            self.set(nd.inputs['Vector'], vec)
        nd.inputs['Scale'].default_value = scale
        nd.inputs['Detail'].default_value = detail
        nd.inputs['Roughness'].default_value = rough
        nd.inputs['Distortion'].default_value = distortion
        return nd

    def coords(self, kind='Object'):
        return self.n('ShaderNodeTexCoord').outputs[kind]

    def mapping(self, vec, scale=1.0, loc=(0, 0, 0), rot=(0, 0, 0)):
        nd = self.n('ShaderNodeMapping')
        self.set(nd.inputs['Vector'], vec)
        nd.inputs['Scale'].default_value = (scale, scale, scale) if not isinstance(scale, tuple) else scale
        nd.inputs['Location'].default_value = loc
        nd.inputs['Rotation'].default_value = rot
        return nd.outputs[0]


def image(path, noncolor=False):
    key = (path, noncolor)
    if key in _cache:
        return _cache[key]
    im = bpy.data.images.load(path, check_existing=True)
    if noncolor:
        im.colorspace_settings.name = 'Non-Color'
    _cache[key] = im
    return im


def tex_path(name, short):
    d = os.path.join(TEX, name)
    for ext in ('jpg', 'png', 'exr'):
        p = os.path.join(d, f'{short}.{ext}')
        if os.path.exists(p):
            return p
    return None


def img_node(nt, path, vec, noncolor=False, box=True, blend=0.3, interp='Linear'):
    nd = nt.n('ShaderNodeTexImage')
    nd.image = image(path, noncolor)
    nd.interpolation = interp
    if box:
        nd.projection = 'BOX'; nd.projection_blend = blend
    nt.set(nd.inputs['Vector'], vec)
    return nd


def layer(nt, name, vec, box=True):
    """Return (color, roughness, height) sockets for a scanned set."""
    col = img_node(nt, tex_path(name, 'diff'), vec, box=box).outputs['Color']
    rp = tex_path(name, 'rough')
    rough = img_node(nt, rp, vec, True, box=box).outputs['Color'] if rp else 0.8
    dp = tex_path(name, 'disp')
    h = img_node(nt, dp, vec, True, box=box).outputs['Color'] if dp else 0.5
    return col, rough, h


_ALB = None


def albedo(name):
    global _ALB
    if _ALB is None:
        import json
        _ALB = json.load(open(os.path.join(TEX, 'albedo.json')))
    return _ALB.get(name, dict(lum=0.2))['lum']


def retint(nt, col, tex, target, contrast=1.0):
    """Keep a texture's light/dark detail, replace its colour with a target albedo."""
    bw = nt.n('ShaderNodeRGBToBW'); nt.set(bw.inputs[0], col)
    rel = nt.math('DIVIDE', bw.outputs[0], max(1e-3, albedo(tex)))
    if contrast != 1.0:
        rel = nt.math('POWER', rel, contrast)
    return nt.mix(1.0, target, nt.n('ShaderNodeCombineColor', inputs={0: rel, 1: rel, 2: rel}).outputs[0], blend='MULTIPLY')


def new_mat(name):
    m = bpy.data.materials.get(name)
    if m:
        return m, None
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes.clear()
    nt = NT(m.node_tree)
    return m, nt


def finish(nt, color, rough, height=None, bump=0.3, dist=0.02, metallic=0.0, normal=None, extra=None,
           sss=0.0, spec=0.5, alpha=None, emission=None):
    bsdf = nt.n('ShaderNodeBsdfPrincipled')
    nt.set(bsdf.inputs['Base Color'], color)
    nt.set(bsdf.inputs['Roughness'], rough)
    nt.set(bsdf.inputs['Metallic'], metallic)
    bsdf.inputs['Specular IOR Level'].default_value = spec
    if sss:
        bsdf.inputs['Subsurface Weight'].default_value = sss
    if alpha is not None:
        nt.set(bsdf.inputs['Alpha'], alpha)
    if height is not None:
        b = nt.n('ShaderNodeBump', invert=False)
        b.inputs['Strength'].default_value = bump
        b.inputs['Distance'].default_value = dist
        nt.set(b.inputs['Height'], height)
        if normal is not None:
            nt.set(b.inputs['Normal'], normal)
        nt.link(b.outputs['Normal'], bsdf.inputs['Normal'])
    elif normal is not None:
        nt.set(bsdf.inputs['Normal'], normal)
    if extra:
        for k, v in extra.items():
            nt.set(bsdf.inputs[k], v)
    out = nt.n('ShaderNodeOutputMaterial')
    nt.link(bsdf.outputs[0], out.inputs['Surface'])
    return bsdf, out


def variation(nt, color, amount=0.12, hue=0.02):
    """Per-object random brightness/hue shift."""
    info = nt.n('ShaderNodeObjectInfo')
    hsv = nt.n('ShaderNodeHueSaturation')
    r = info.outputs['Random']
    nt.set(hsv.inputs['Hue'], nt.math('ADD', nt.math('MULTIPLY', r, hue * 2), 0.5 - hue))
    nt.set(hsv.inputs['Value'], nt.math('ADD', nt.math('MULTIPLY', r, amount * 2), 1 - amount))
    hsv.inputs['Saturation'].default_value = 1.0
    nt.set(hsv.inputs['Color'], color)
    return hsv.outputs[0]


def scanned(name, tex, scale=1.0, tint=None, bump=0.4, var=0.1, coords='Object', rough_mul=1.0, macro=0.15):
    m, nt = new_mat(name)
    if nt is None:
        return m
    vec = nt.mapping(nt.coords(coords), 1.0 / scale)
    col, rough, h = layer(nt, tex, vec)
    if tint is not None:
        col = nt.mix(1.0, col, tint, blend='MULTIPLY')
    if macro:
        mn = nt.noise(nt.coords(coords), 0.35, 3).outputs['Fac']
        col = nt.mix(nt.math('MULTIPLY', mn, macro * 2), col, (0.35, 0.3, 0.25, 1), blend='MULTIPLY')
    if var:
        col = variation(nt, col, var)
    if rough_mul != 1.0:
        rough = nt.math('MULTIPLY', rough, rough_mul, clamp=True)
    finish(nt, col, rough, h, bump=bump, dist=0.02 * scale)
    return m


# ------------------------------------------------------------------ specific period materials
def plaster(name='plaster', tint=(0.93, 0.9, 0.84, 1), base_tex='white_plaster_rough_01', loss=0.18, scale=2.0):
    """Lime plaster over rubble, with patches of loss near the ground and dirt splash."""
    m, nt = new_mat(name)
    if nt is None:
        return m
    obj = nt.coords('Object')
    vec = nt.mapping(obj, 1.0 / scale)
    pc, pr, ph = layer(nt, base_tex, vec)
    pc = retint(nt, pc, base_tex, tint, 0.8)
    pc = variation(nt, pc, 0.08, 0.015)
    vec2 = nt.mapping(obj, 1.0 / 1.6)
    rc, rr, rh = layer(nt, 'stacked_stone_wall', vec2)
    # loss mask: noise, more likely near the ground
    sep = nt.n('ShaderNodeSeparateXYZ'); nt.set(sep.inputs[0], obj)
    low = nt.math('SUBTRACT', 1.0, nt.math('DIVIDE', sep.outputs['Z'], 1.4, clamp=True))
    nz = nt.noise(obj, 0.9, 6, 0.65).outputs['Fac']
    lm = nt.math('ADD', nz, nt.math('MULTIPLY', low, loss))
    lm = nt.ramp(lm, [(0.66, (0, 0, 0)), (0.69, (1, 1, 1))])
    if loss <= 0:
        lm = 0.0
    col = nt.mix(lm, pc, rc)
    rough = nt.mix(lm, pr, rr, kind='FLOAT')
    h = nt.mix(lm, nt.math('ADD', ph, 0.25), nt.math('MULTIPLY', rh, 0.6), kind='FLOAT')
    # dirt and damp at the base, faint streaks from the eaves
    dirt = nt.math('POWER', low, 3.0)
    nz2 = nt.noise(obj, 3.0, 4).outputs['Fac']
    dirt = nt.math('MULTIPLY', dirt, nt.math('ADD', nz2, 0.3))
    col = nt.mix(nt.math('MULTIPLY', dirt, 0.55, clamp=True), col, (0.42, 0.36, 0.28, 1), blend='MULTIPLY')
    streak = nt.noise(nt.mapping(obj, (6.0, 6.0, 0.25)), 1.0, 3).outputs['Fac']
    col = nt.mix(nt.math('MULTIPLY', nt.ramp(streak, [(0.55, (0, 0, 0)), (0.75, (1, 1, 1))]), 0.18), col,
                 (0.5, 0.47, 0.42, 1), blend='MULTIPLY')
    finish(nt, col, rough, h, bump=0.6, dist=0.03)
    return m


def terracotta(name='terracotta', base=(0.4, 0.15, 0.08, 1), var=0.22):
    m, nt = new_mat(name)
    if nt is None:
        return m
    obj = nt.coords('Object')
    vec = nt.mapping(obj, 1 / 0.6)
    c, r, h = layer(nt, 'clay_floor_001', vec)
    gray = nt.n('ShaderNodeRGBToBW'); nt.set(gray.inputs[0], c)
    col = nt.mix(1.0, base, nt.math('ADD', nt.math('MULTIPLY', gray.outputs[0], 0.9), 0.55), blend='MULTIPLY')
    col = variation(nt, col, var, 0.035)
    # weathering by world position so neighbouring tiles share it: soot-dark streaks, grey lichen, pale salt
    P = nt.n('ShaderNodeNewGeometry').outputs['Position']
    wn = nt.noise(P, 0.25, 5).outputs['Fac']
    lich = nt.ramp(wn, [(0.58, (0, 0, 0)), (0.72, (1, 1, 1))])
    col = nt.mix(nt.math('MULTIPLY', lich, 0.22), col, (0.45, 0.42, 0.34, 1))
    dn = nt.noise(P, 0.6, 4).outputs['Fac']
    col = nt.mix(nt.math('MULTIPLY', nt.ramp(dn, [(0.4, (0, 0, 0)), (0.7, (1, 1, 1))]), 0.35), col, (0.18, 0.12, 0.09, 1))
    lp = nt.noise(nt.coords('Object'), 9.0, 3).outputs['Fac']
    col = nt.mix(nt.math('MULTIPLY', nt.ramp(lp, [(0.66, (0, 0, 0)), (0.72, (1, 1, 1))]), 0.3), col, (0.62, 0.6, 0.5, 1))
    finish(nt, col, nt.math('ADD', nt.math('MULTIPLY', r, 0.3), 0.6), h, bump=0.3, dist=0.005)
    return m


def stone(name, tex='sandstone_cracks', tint=(1, 1, 1, 1), scale=1.5, bump=0.5, var=0.12, edge_dirt=True):
    m, nt = new_mat(name)
    if nt is None:
        return m
    obj = nt.coords('Object')
    vec = nt.mapping(obj, 1 / scale)
    c, r, h = layer(nt, tex, vec)
    c = nt.mix(1.0, c, tint, blend='MULTIPLY')
    c = variation(nt, c, var, 0.012)
    if edge_dirt:
        ao = nt.n('ShaderNodeAmbientOcclusion', samples=8)
        ao.inputs['Distance'].default_value = 0.25
        dirt = nt.ramp(ao.outputs['AO'], [(0.3, (0.55, 0.5, 0.42)), (0.85, (1, 1, 1))])
        c = nt.mix(1.0, c, dirt, blend='MULTIPLY')
    finish(nt, c, r, h, bump=bump, dist=0.01 * scale)
    return m


def timber(name='timber', tex='rough_wood', tint=(0.75, 0.62, 0.48, 1), scale=1.2):
    return scanned(name, tex, scale, tint=tint, bump=0.5, var=0.18)


def flat(name, color, rough=0.6, metallic=0.0, sss=0.0, spec=0.5):
    m, nt = new_mat(name)
    if nt is None:
        return m
    finish(nt, color, rough, metallic=metallic, sss=sss, spec=spec)
    return m


def bronze(name='bronze', patina=0.35):
    m, nt = new_mat(name)
    if nt is None:
        return m
    obj = nt.coords('Object')
    nz = nt.noise(obj, 6, 6).outputs['Fac']
    pat = nt.ramp(nz, [(0.45, (0, 0, 0)), (0.7, (1, 1, 1))])
    pat = nt.math('MULTIPLY', pat, patina * 2, clamp=True)
    col = nt.mix(pat, (0.62, 0.38, 0.18, 1), (0.28, 0.45, 0.36, 1))
    met = nt.mix(pat, 1.0, 0.0, kind='FLOAT')
    rough = nt.mix(pat, 0.32, 0.75, kind='FLOAT')
    finish(nt, col, rough, nz, bump=0.05, metallic=met)
    return m


def iron(name='iron'):
    m, nt = new_mat(name)
    if nt is None:
        return m
    nz = nt.noise(nt.coords('Object'), 12, 6).outputs['Fac']
    col = nt.mix(nz, (0.08, 0.07, 0.065, 1), (0.25, 0.12, 0.05, 1))
    finish(nt, col, 0.7, nz, bump=0.2, metallic=0.6)
    return m


def linen(name='linen', tint=(0.6, 0.56, 0.48, 1)):
    m, nt = new_mat(name)
    if nt is None:
        return m
    vec = nt.mapping(nt.coords('Object'), 1 / 0.6)
    c, r, h = layer(nt, 'rough_linen', vec)
    c = retint(nt, c, 'rough_linen', tint, 1.0)
    nz = nt.noise(nt.coords('Object'), 1.2, 3).outputs['Fac']
    c = nt.mix(nt.math('MULTIPLY', nz, 0.35), c, (0.55, 0.48, 0.38, 1), blend='MULTIPLY')
    bsdf, _ = finish(nt, c, 0.85, h, bump=0.2, dist=0.004, sss=0.0)
    bsdf.inputs['Sheen Weight'].default_value = 0.0
    # thin cloth lets some light through
    bsdf.inputs['Transmission Weight'].default_value = 0.0
    return m


def marble(name='marble', tint=(0.95, 0.93, 0.88, 1)):
    m, nt = new_mat(name)
    if nt is None:
        return m
    vec = nt.mapping(nt.coords('Object'), 1 / 1.5)
    c, r, h = layer(nt, 'marble_01', vec)
    c = nt.mix(1.0, c, tint, blend='MULTIPLY')
    nz = nt.noise(nt.coords('Object'), 2, 5).outputs['Fac']
    c = nt.mix(nt.math('MULTIPLY', nz, 0.25), c, (0.7, 0.66, 0.58, 1), blend='MULTIPLY')
    bsdf, _ = finish(nt, c, nt.math('ADD', nt.math('MULTIPLY', r, 0.5), 0.25), h, bump=0.1, sss=0.0)
    return m


def emissive_sky_dummy():
    pass


def pottery(name, base=(0.48, 0.25, 0.15, 1), var=0.15):
    mm, nt = new_mat(name)
    if nt is None:
        return mm
    obj = nt.coords('Object')
    c, r, h = layer(nt, 'clay_floor_001', nt.mapping(obj, 1 / 0.5))
    gray = nt.n('ShaderNodeRGBToBW'); nt.set(gray.inputs[0], c)
    col = nt.mix(1.0, base, nt.math('ADD', nt.math('MULTIPLY', gray.outputs[0], 0.6), 0.7), blend='MULTIPLY')
    col = variation(nt, col, var, 0.03)
    nz = nt.noise(obj, 4.0, 5).outputs['Fac']
    col = nt.mix(nt.math('MULTIPLY', nt.ramp(nz, [(0.45, (0, 0, 0)), (0.75, (1, 1, 1))]), 0.35), col, (0.62, 0.52, 0.4, 1))
    sep = nt.n('ShaderNodeSeparateXYZ'); nt.link(obj, sep.inputs[0])
    low = nt.math('SUBTRACT', 1.0, nt.math('DIVIDE', sep.outputs['Z'], 0.3, clamp=True))
    col = nt.mix(nt.math('MULTIPLY', low, 0.4), col, (0.3, 0.25, 0.2, 1), blend='MULTIPLY')
    finish(nt, col, 0.75, h, bump=0.2, dist=0.004)
    return mm


def stone_rt(name, tex, target, scale=1.2, bump=0.5, var=0.1, contrast=1.0, ao=True):
    """Stone with a scanned texture's detail but a chosen albedo."""
    m, nt = new_mat(name)
    if nt is None:
        return m
    obj = nt.coords('Object')
    c, r, h = layer(nt, tex, nt.mapping(obj, 1 / scale))
    c = retint(nt, c, tex, target, contrast)
    c = variation(nt, c, var, 0.012)
    big = nt.noise(nt.n('ShaderNodeNewGeometry').outputs['Position'], 0.08, 3).outputs['Fac']
    c = nt.mix(nt.math('MULTIPLY', big, 0.35), c, (0.6, 0.56, 0.5, 1), blend='MULTIPLY')
    if ao:
        a = nt.n('ShaderNodeAmbientOcclusion', samples=8); a.inputs['Distance'].default_value = 0.2
        c = nt.mix(1.0, c, nt.ramp(a.outputs['AO'], [(0.3, (0.6, 0.56, 0.5)), (0.85, (1, 1, 1))]), blend='MULTIPLY')
    finish(nt, c, r, h, bump=bump, dist=0.01 * scale)
    return m


def paving_weathered(name, tex, target, scale=1.0):
    """Flagstones that have been walked on for a century: per-slab tone, grime in the joints and low
    places, lichen and dust patches at world scale so neighbouring slabs share them."""
    mm, nt = new_mat(name)
    if nt is None:
        return mm
    obj = nt.coords('Object')
    c, r, h = layer(nt, tex, nt.mapping(obj, 1 / scale))
    c = retint(nt, c, tex, target, 1.1)
    c = variation(nt, c, 0.22, 0.02)
    P = nt.n('ShaderNodeNewGeometry').outputs['Position']
    dust = nt.noise(P, 0.12, 4, 0.6).outputs['Fac']
    c = nt.mix(nt.math('MULTIPLY', nt.ramp(dust, [(0.4, (0, 0, 0)), (0.7, (1, 1, 1))]), 0.7), c, (0.33, 0.27, 0.2, 1))
    lich = nt.noise(P, 1.3, 5, 0.7).outputs['Fac']
    c = nt.mix(nt.math('MULTIPLY', nt.ramp(lich, [(0.66, (0, 0, 0)), (0.74, (1, 1, 1))]), 0.5), c, (0.5, 0.5, 0.42, 1))
    a = nt.n('ShaderNodeAmbientOcclusion', samples=8); a.inputs['Distance'].default_value = 0.25
    c = nt.mix(1.0, c, nt.ramp(a.outputs['AO'], [(0.25, (0.35, 0.31, 0.26)), (0.9, (1, 1, 1))]), blend='MULTIPLY')
    finish(nt, c, nt.math('ADD', nt.math('MULTIPLY', r, 0.4), 0.5), h, bump=0.8, dist=0.012)
    return mm


def wicker(name='wicker'):
    mm, nt = new_mat(name)
    if nt is None:
        return mm
    obj = nt.coords('Object')
    br = nt.n('ShaderNodeTexBrick')
    nt.set(br.inputs['Vector'], nt.mapping(obj, (1, 1, 1)))
    br.inputs['Scale'].default_value = 28.0
    br.inputs['Mortar Size'].default_value = 0.012
    br.inputs['Brick Width'].default_value = 0.35
    br.inputs['Row Height'].default_value = 0.12
    br.inputs['Color1'].default_value = (0.42, 0.31, 0.17, 1)
    br.inputs['Color2'].default_value = (0.33, 0.24, 0.13, 1)
    br.inputs['Mortar'].default_value = (0.12, 0.08, 0.05, 1)
    col = variation(nt, br.outputs['Color'], 0.1, 0.01)
    finish(nt, col, 0.8, br.outputs['Fac'], bump=0.6, dist=0.003)
    return mm
