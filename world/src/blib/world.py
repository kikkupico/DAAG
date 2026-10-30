"""Terrain (adaptive displacement from the generated height field), sea, sky, haze."""
import json, math, os
import bpy
import numpy as np
from .core import BUILD, PH, link, mesh_from_arrays, collection
from .mats import NT, new_mat, layer, img_node, image, finish


def load_terrain_data(name):
    d = os.path.join(BUILD, 'terrain', name)
    meta = json.load(open(os.path.join(d, 'meta.json')))
    H = np.load(os.path.join(d, 'height.npy'))
    sites = json.load(open(os.path.join(d, 'sites.json')))
    return d, meta, H, sites


def float_image(name, arr, path):
    """Save a float32 (N,N) array (row 0 = north) as a 32-bit EXR and load it."""
    if os.path.exists(path) and os.path.getmtime(path) > os.path.getmtime(path.replace('.exr', '.npy') if os.path.exists(path.replace('.exr', '.npy')) else path) - 1:
        pass
    N = arr.shape[0]
    im = bpy.data.images.new(name, N, N, alpha=False, float_buffer=True, is_data=True)
    px = np.zeros((N, N, 4), np.float32)
    px[..., 0] = arr[::-1]
    px[..., 3] = 1
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path
    im.file_format = 'OPEN_EXR'
    im.use_half_precision = False
    im.save()
    im.source = 'FILE'
    im.reload()
    im.colorspace_settings.name = 'Non-Color'
    return im


def terrain(name, coll=None, base_res=384, pixel=1.0):
    d, meta, H, sites = load_terrain_data(name)
    L = meta['L']; N = meta['N']
    exr = os.path.join(d, 'height.exr')
    if not os.path.exists(exr) or os.path.getmtime(exr) < os.path.getmtime(os.path.join(d, 'height.npy')):
        him = float_image(name + '_height', H, exr)
    else:
        him = bpy.data.images.load(exr); him.colorspace_settings.name = 'Non-Color'
    # base grid; true heights from the shader, coarse heights on the mesh so culling/BVH bounds are sane
    n = base_res
    lin = np.linspace(-L / 2, L / 2, n + 1, dtype=np.float32)
    X, Y = np.meshgrid(lin, lin[::-1])
    verts = np.stack([X, Y, np.zeros_like(X)], -1).reshape(-1, 3)
    idx = np.arange((n + 1) * (n + 1)).reshape(n + 1, n + 1)
    faces = np.stack([idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]], -1).reshape(-1, 4)
    mat = terrain_material(name, him, d, meta)
    ob = mesh_from_arrays(name + '_terrain', verts, faces, coll, mat)
    mod = ob.modifiers.new('adaptive', 'SUBSURF')
    mod.subdivision_type = 'SIMPLE'
    mod.use_adaptive_subdivision = True
    mod.adaptive_pixel_size = pixel
    mod.levels = 0; mod.render_levels = 6
    mat.displacement_method = 'DISPLACEMENT'
    mat.max_vertex_displacement = max(abs(meta['hmin']), meta['hmax']) + 5
    s = bpy.context.scene
    s.cycles.max_subdivisions = 12
    s.cycles.offscreen_dicing_scale = 8
    return ob, meta, sites


def _mask(nt, d, key, uv):
    p = os.path.join(d, f'mask_{key}.png')
    if not os.path.exists(p):
        return 0.0
    nd = img_node(nt, p, uv, noncolor=True, box=False, interp='Cubic')
    nd.extension = 'EXTEND'
    return nd.outputs['Color']


def _soft_mask(nt, d, name, keys, r, uv):
    """A blurred union of masks from masks.npz, saved once as mask_<name>.png, so edges can fade and wander
    instead of stopping at the hard pixel edge of the on/off masks."""
    src = os.path.join(d, 'masks.npz'); p = os.path.join(d, f'mask_{name}.png')
    if not os.path.exists(src):
        return 0.0
    if not os.path.exists(p) or os.path.getmtime(p) < os.path.getmtime(src):
        from .fieldops import blur
        z = np.load(src)
        a = np.max([z[k] for k in keys if k in z.files], axis=0).astype(np.float32) / 255
        a = np.clip(blur(a, r), 0, 1)
        N = a.shape[0]
        im = bpy.data.images.new('mask_' + name, N, N, alpha=False)
        px = np.ones((N, N, 4), np.float32); px[..., :3] = a[::-1, :, None]
        im.pixels.foreach_set(px.ravel())
        im.filepath_raw = p; im.file_format = 'PNG'; im.save()
        bpy.data.images.remove(im)
    return _mask(nt, d, name, uv)


def terrain_material(name, him, d, meta):
    m, nt = new_mat(name + '_ground')
    if nt is None:
        return m
    gen = nt.coords('Generated')
    hn = nt.n('ShaderNodeTexImage'); hn.image = him; hn.interpolation = 'Cubic'; hn.extension = 'EXTEND'
    nt.link(gen, hn.inputs['Vector'])
    hgt = nt.n('ShaderNodeSeparateColor'); nt.link(hn.outputs['Color'], hgt.inputs[0])
    h = hgt.outputs[0]
    # masks (flip v: masks are saved with row 0 = north = top of image, which is v=1 in Blender)
    uv = gen          # PNG row 0 (north) loads at v = 1, which is where north is
    road = _mask(nt, d, 'road', uv); built = _mask(nt, d, 'built', uv); quay = _mask(nt, d, 'quay', uv)
    sand = _mask(nt, d, 'sand', uv); rockm = _mask(nt, d, 'rock', uv); clear = _mask(nt, d, 'clearing', uv)
    flatm = nt.math('MAXIMUM', nt.math('MAXIMUM', nt.math('MAXIMUM', road, built), quay), clear)
    pos = nt.n('ShaderNodeNewGeometry')
    P = pos.outputs['Position']; Nrm = pos.outputs['Normal']
    # --- fine displacement: soil lumps everywhere, crags on rock
    wpos = nt.coords('Object')
    f1 = nt.noise(wpos, 0.28, 6, 0.55).outputs['Fac']          # ~3.5 m
    f2 = nt.noise(wpos, 1.6, 4, 0.6).outputs['Fac']            # ~0.6 m
    vor = nt.n('ShaderNodeTexVoronoi', feature='F1', distance='EUCLIDEAN')
    nt.set(vor.inputs['Vector'], wpos); vor.inputs['Scale'].default_value = 0.35
    crag = nt.math('MULTIPLY', nt.math('POWER', vor.outputs['Distance'], 0.6), rockm)
    # cut-and-fill banks are graded fill, so only shallow lumps there (and their grass is not buried)
    bank_flat = nt.math('SUBTRACT', 1.0, nt.math('MULTIPLY', _mask(nt, d, 'cut', uv), 0.8))
    fine = nt.math('ADD', nt.math('MULTIPLY', nt.math('MULTIPLY', nt.math('SUBTRACT', f1, 0.5), 1.1), bank_flat),
                   nt.math('MULTIPLY', nt.math('SUBTRACT', f2, 0.5), 0.25))
    fine = nt.math('ADD', fine, nt.math('MULTIPLY', crag, 2.2))
    cliffm = _mask(nt, d, 'cliff', uv)
    zb = nt.n('ShaderNodeSeparateXYZ'); nt.link(wpos, zb.inputs[0])
    strata = nt.n('ShaderNodeTexWave', wave_type='BANDS', bands_direction='Z', wave_profile='SAW')
    nt.set(strata.inputs['Vector'], wpos); strata.inputs['Scale'].default_value = 0.09
    strata.inputs['Distortion'].default_value = 9.0; strata.inputs['Detail'].default_value = 3
    fine = nt.math('ADD', fine, nt.math('MULTIPLY', nt.math('MULTIPLY', strata.outputs['Fac'], 0.9), cliffm))
    land = nt.math('GREATER_THAN', h, 0.5)
    # the lumps die away over several metres before roads and levelled ground, so there is no lip at their edge;
    # roads themselves get shallow ruts and bumps
    flat_soft = _soft_mask(nt, d, 'flat_soft', ('road', 'built', 'quay', 'clearing'), 2, uv)
    lumps = nt.math('SUBTRACT', 1.0, nt.math('MAXIMUM', flatm, nt.math('MULTIPLY', flat_soft, 2.5, clamp=True)))
    fine = nt.math('MULTIPLY', fine, nt.math('MULTIPLY', lumps, land))
    ruts = nt.math('MULTIPLY', nt.math('SUBTRACT', nt.noise(nt.mapping(wpos, (0.8, 0.8, 0.8)), 1.0, 5, 0.6).outputs['Fac'], 0.5), 0.1)
    fine = nt.math('ADD', fine, nt.math('MULTIPLY', ruts, road))
    disp = nt.n('ShaderNodeDisplacement')
    disp.inputs['Midlevel'].default_value = 0.0; disp.inputs['Scale'].default_value = 1.0
    nt.set(disp.inputs['Height'], nt.math('ADD', h, fine))
    # --- surface layers
    def vec(scale):
        return nt.mapping(wpos, 1.0 / scale)
    soil_c, soil_r, soil_h = layer(nt, 'dry_ground_rocks', vec(3.5))
    red_c, red_r, red_h = layer(nt, 'red_laterite_soil_stones', vec(3.0))
    grass_c, grass_r, grass_h = layer(nt, 'sparse_grass', vec(3.0))
    rock_c, rock_r, rock_h = layer(nt, 'rock_boulder_dry', vec(6.0))
    rg_c, rg_r, rg_h = layer(nt, 'rocks_ground_06', vec(5.0))
    rock_c = nt.mix(1.0, rock_c, (0.56, 0.55, 0.52, 1), blend='MULTIPLY')
    rg_c = nt.mix(1.0, rg_c, (0.6, 0.58, 0.54, 1), blend='MULTIPLY')
    scree_c, scree_r, scree_h = layer(nt, 'gray_rocks', vec(2.5))
    sand_c, sand_r, sand_h = layer(nt, 'coast_sand_01', vec(3.0))
    road_c, road_r, road_h = layer(nt, 'rocky_trail', vec(4.0))
    dirt_c, dirt_r, dirt_h = layer(nt, 'dirt', vec(3.0))
    big = nt.noise(wpos, 0.004, 4, 0.6).outputs['Fac']       # ~250 m
    mid = nt.noise(wpos, 0.03, 4, 0.6).outputs['Fac']        # ~30 m
    sml = nt.noise(wpos, 0.25, 4, 0.6).outputs['Fac']        # ~4 m
    sep = nt.n('ShaderNodeSeparateXYZ'); nt.link(Nrm, sep.inputs[0])
    nz = sep.outputs['Z']
    steep = nt.math('SUBTRACT', 1.0, nz)
    col, rough, hh = soil_c, soil_r, soil_h

    def blend(w, c, r, h_):
        nonlocal col, rough, hh
        col = nt.mix(w, col, c); rough = nt.mix(w, rough, r, kind='FLOAT'); hh = nt.mix(w, hh, h_, kind='FLOAT')

    lowland = nt.math('LESS_THAN', h, 380)
    w_red = nt.math('MULTIPLY', nt.ramp(nt.math('ADD', mid, nt.math('MULTIPLY', sml, 0.3)), [(0.52, (0, 0, 0)), (0.66, (1, 1, 1))]), lowland)
    blend(nt.math('MULTIPLY', w_red, 0.8), red_c, red_r, red_h)
    w_grass = nt.math('MULTIPLY', nt.ramp(nt.math('ADD', big, nt.math('MULTIPLY', mid, 0.6)), [(0.55, (0, 0, 0)), (0.75, (1, 1, 1))]), lowland)
    blend(nt.math('MULTIPLY', w_grass, 0.85), grass_c, grass_r, grass_h)
    alt = nt.math('DIVIDE', h, 900.0, clamp=True)
    w_rg = nt.ramp(nt.math('ADD', nt.math('ADD', steep, nt.math('MULTIPLY', alt, 0.06)), nt.math('MULTIPLY', sml, 0.08)),
                   [(0.2, (0, 0, 0)), (0.3, (1, 1, 1))])
    w_rg = nt.math('MULTIPLY', w_rg, nt.ramp(mid, [(0.35, (0.3, 0.3, 0.3)), (0.6, (0.9, 0.9, 0.9))]))
    blend(w_rg, rg_c, rg_r, rg_h)
    w_scree = nt.math('MULTIPLY', nt.ramp(nt.math('ADD', steep, nt.math('MULTIPLY', mid, 0.2)), [(0.25, (0, 0, 0)), (0.33, (1, 1, 1))]),
                      nt.ramp(sml, [(0.55, (0, 0, 0)), (0.65, (1, 1, 1))]))
    blend(w_scree, scree_c, scree_r, scree_h)
    w_rock = nt.math('MAXIMUM', nt.ramp(nt.math('ADD', steep, nt.math('MULTIPLY', sml, 0.12)), [(0.34, (0, 0, 0)), (0.46, (1, 1, 1))]),
                     nt.math('MULTIPLY', rockm, nt.ramp(sml, [(0.4, (0, 0, 0)), (0.6, (0.8, 0.8, 0.8))])))
    cutm = _mask(nt, d, 'cut', uv)
    blend(nt.math('MULTIPLY', w_rock, nt.math('SUBTRACT', 1.0, nt.math('MULTIPLY', cutm, 0.85))), rock_c, rock_r, rock_h)
    # cut-and-fill banks round levelled sites and roads: stony soil mostly grown over with dry grass, red earth,
    # pale limestone showing through, and grey scree only in streaks down the fall line
    gpatch = nt.noise(wpos, 0.08, 4, 0.6).outputs['Fac']                              # ~12 m
    fall = nt.noise(nt.mapping(wpos, (0.35, 0.35, 0.04)), 1.0, 4).outputs['Fac']     # long down the slope
    blend(nt.math('MULTIPLY', cutm, 0.95), soil_c, soil_r, soil_h)
    blend(nt.math('MULTIPLY', cutm, nt.ramp(nt.math('ADD', mid, nt.math('MULTIPLY', sml, 0.5)),
                                            [(0.48, (0, 0, 0)), (0.66, (0.75, 0.75, 0.75))])), red_c, red_r, red_h)
    blend(nt.math('MULTIPLY', cutm, nt.ramp(gpatch, [(0.3, (0, 0, 0)), (0.5, (0.9, 0.9, 0.9))])), grass_c, grass_r, grass_h)
    blend(nt.math('MULTIPLY', cutm, nt.ramp(nt.math('ADD', sml, nt.math('MULTIPLY', steep, 0.4)),
                                            [(0.66, (0, 0, 0)), (0.74, (0.9, 0.9, 0.9))])), rg_c, rg_r, rg_h)
    blend(nt.math('MULTIPLY', cutm, nt.ramp(fall, [(0.6, (0, 0, 0)), (0.68, (0.6, 0.6, 0.6))])), scree_c, scree_r, scree_h)
    blend(sand, sand_c, sand_r, sand_h)
    # roads and levelled ground with wandering edges: the blurred mask, pushed about by noise at two scales,
    # then a shoulder of loose gravel trodden into the verge before the road surface proper
    wob = nt.math('ADD', nt.math('MULTIPLY', nt.math('SUBTRACT', sml, 0.5), 0.35),
                  nt.math('MULTIPLY', nt.math('SUBTRACT', nt.noise(wpos, 0.9, 4, 0.6).outputs['Fac'], 0.5), 0.3))
    built_soft = _soft_mask(nt, d, 'built_soft', ('built', 'clearing'), 1, uv)
    blend(nt.ramp(nt.math('ADD', built_soft, wob), [(0.4, (0, 0, 0)), (0.55, (1, 1, 1))]), dirt_c, dirt_r, dirt_h)
    gravel_c, gravel_r, gravel_h = layer(nt, 'rocky_gravel', vec(2.5))
    road_soft = _soft_mask(nt, d, 'road_soft', ('road',), 1, uv)
    re = nt.math('ADD', road_soft, wob)
    blend(nt.math('MULTIPLY', nt.ramp(re, [(0.22, (0, 0, 0)), (0.4, (0.85, 0.85, 0.85))]),
                  nt.ramp(sml, [(0.3, (0.4, 0.4, 0.4)), (0.6, (1, 1, 1))])), gravel_c, gravel_r, gravel_h)
    blend(nt.ramp(re, [(0.42, (0, 0, 0)), (0.56, (1, 1, 1))]), road_c, road_r, road_h)
    blend(quay, dirt_c, dirt_r, dirt_h)
    # wet rock and weed at and below the water line
    wet = nt.ramp(h, [(-0.8, (1, 1, 1)), (0.9, (0, 0, 0))])
    col = nt.mix(nt.math('MULTIPLY', wet, 0.7), col, (0.3, 0.3, 0.24, 1), blend='MULTIPLY')
    rough = nt.mix(wet, rough, 0.25, kind='FLOAT')
    # sea cliffs weather darker and streaked, so the coast doesn't read as a pale band
    cl2 = _mask(nt, d, 'cliff', uv)
    streak = nt.noise(nt.mapping(wpos, (0.6, 0.6, 0.05)), 1.0, 4).outputs['Fac']
    cdark = nt.ramp(streak, [(0.3, (0.5, 0.48, 0.44)), (0.7, (0.78, 0.75, 0.7))])
    col = nt.mix(nt.math('MULTIPLY', cl2, 0.85), col, cdark, blend='MULTIPLY')
    # macro tone so tiling vanishes from the air, and a slightly muted palette
    tone = nt.ramp(big, [(0.3, (0.8, 0.8, 0.78)), (0.7, (1.05, 1.0, 0.95))])
    col = nt.mix(1.0, col, tone, blend='MULTIPLY')
    hs = nt.n('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value = 0.82; hs.inputs['Value'].default_value = 0.92
    nt.set(hs.inputs['Color'], col); col = hs.outputs[0]
    bsdf, out = finish(nt, col, rough, hh, bump=0.5, dist=0.04)
    nt.link(disp.outputs[0], out.inputs['Displacement'])
    return m


def sea(meta, him_path, coll=None, size=250000.0):
    m, nt = new_mat('sea')
    if nt is not None:
        L = meta['L']
        obj = nt.coords('Object')
        uv = nt.mapping(obj, 1.0 / L, loc=(0.5, 0.5, 0))
        hn = nt.n('ShaderNodeTexImage'); hn.image = image(him_path, True); hn.extension = 'EXTEND'
        hn.interpolation = 'Cubic'
        nt.link(uv, hn.inputs['Vector'])
        sp = nt.n('ShaderNodeSeparateColor'); nt.link(hn.outputs['Color'], sp.inputs[0])
        # Water depth in metres (elevation is negative on the sea floor)
        depth = nt.math('MAXIMUM', nt.math('MULTIPLY', sp.outputs[0], -1.0), 0.0)

        # ------------------------------------------------------------------
        # 1. Multi-scale Trochoidal Waves (Prevailing swell, cross-waves, chop, ripples)
        # ------------------------------------------------------------------
        gust = nt.noise(obj, scale=0.0035, detail=2, rough=0.5).outputs['Fac']

        # Coordinate warp (prevents rigid parallel ridges without folding coordinates)
        warp_n = nt.noise(obj, scale=0.028, detail=3, rough=0.5).outputs['Fac']
        warp_v = nt.math('MULTIPLY', nt.math('SUBTRACT', warp_n, 0.5), 1.8)

        # Primary ocean swell (~38m wavelength, travelling at ~28 deg azimuth)
        p_map = nt.mapping(obj, scale=0.026, rot=(0, 0, math.radians(28)))
        p_coord = nt.mix(1.0, p_map, nt.n('ShaderNodeCombineColor', inputs={0: warp_v, 1: 0, 2: 0}).outputs[0], kind='RGBA', blend='ADD')
        wv1 = nt.n('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X', wave_profile='SIN')
        nt.set(wv1.inputs['Vector'], p_coord)
        wv1.inputs['Scale'].default_value = 1.0; wv1.inputs['Distortion'].default_value = 1.6
        wv1.inputs['Detail'].default_value = 2.0; wv1.inputs['Detail Scale'].default_value = 1.0
        sw1 = nt.math('POWER', wv1.outputs['Color'], 1.5)

        # Secondary cross-swell (~18m wavelength, cross-angle -32 deg)
        warp_n2 = nt.noise(obj, scale=0.055, detail=2, rough=0.5).outputs['Fac']
        warp_v2 = nt.math('MULTIPLY', nt.math('SUBTRACT', warp_n2, 0.5), 1.2)
        s_map = nt.mapping(obj, scale=0.055, rot=(0, 0, math.radians(-32)))
        s_coord = nt.mix(1.0, s_map, nt.n('ShaderNodeCombineColor', inputs={0: warp_v2, 1: 0, 2: 0}).outputs[0], kind='RGBA', blend='ADD')
        wv2 = nt.n('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X', wave_profile='SIN')
        nt.set(wv2.inputs['Vector'], s_coord)
        wv2.inputs['Scale'].default_value = 1.0; wv2.inputs['Distortion'].default_value = 2.0
        wv2.inputs['Detail'].default_value = 2.0; wv2.inputs['Detail Scale'].default_value = 1.0
        sw2 = nt.math('POWER', wv2.outputs['Color'], 1.4)

        # Wind chop (~4-8m) with elongated crests
        chop_map = nt.mapping(obj, scale=(0.14, 0.32, 0.14), rot=(0, 0, math.radians(12)))
        chop_n = nt.noise(chop_map, scale=1.0, detail=4, rough=0.55).outputs['Fac']
        chop = nt.math('POWER', chop_n, 1.4)

        # Fine surface ripples (~0.8 - 1.5m)
        ripples = nt.noise(obj, scale=0.9, detail=3, rough=0.52).outputs['Fac']

        # Micro sparkle (~0.25m)
        micro = nt.noise(obj, scale=3.2, detail=2, rough=0.45).outputs['Fac']

        # Wave height combination
        h_swell = nt.math('ADD', nt.math('MULTIPLY', sw1, 0.38), nt.math('MULTIPLY', sw2, 0.22))
        h_fine = nt.math('ADD', nt.math('MULTIPLY', chop, 0.16),
                                nt.math('ADD', nt.math('MULTIPLY', ripples, 0.08),
                                               nt.math('MULTIPLY', micro, 0.025)))
        total_h = nt.math('ADD', h_swell, h_fine)

        # Gentle swell damping right at the water contact line in shallow coves (< 1.5m)
        shallow_mod = nt.ramp(nt.math('DIVIDE', depth, 2.0, clamp=True),
                              [(0.0, (0.65, 0.65, 0.65)), (1.0, (1.0, 1.0, 1.0))])
        wave_h = nt.math('MULTIPLY', total_h, shallow_mod)

        b = nt.n('ShaderNodeBump')
        b.inputs['Strength'].default_value = 0.88; b.inputs['Distance'].default_value = 0.52
        nt.set(b.inputs['Height'], wave_h)

        # ------------------------------------------------------------------
        # 2. Water Color & Transmission based on physical depth
        # ------------------------------------------------------------------
        col_ramp = nt.ramp(nt.math('DIVIDE', depth, 50.0, clamp=True), [
            (0.00, (0.040, 0.21, 0.19)),    # 0m: crystal pale turquoise shallows
            (0.05, (0.014, 0.14, 0.17)),    # 2.5m: Aegean aquamarine
            (0.15, (0.007, 0.080, 0.15)),   # 7.5m: Mediterranean cerulean
            (0.35, (0.003, 0.035, 0.090)),  # 17.5m: deep sapphire
            (0.70, (0.002, 0.016, 0.050)),  # 35m: deep Aegean navy
            (1.00, (0.0012, 0.010, 0.035))  # 50m+: open sea deep indigo
        ])

        # Transmission: crystal clear in shallows, softly fading into deep backscattering body
        trans = nt.ramp(nt.math('DIVIDE', depth, 18.0, clamp=True), [
            (0.00, (0.96, 0.96, 0.96)),
            (0.12, (0.88, 0.88, 0.88)),     # 2m: 88%
            (0.32, (0.62, 0.62, 0.62)),     # 6m: 62%
            (0.65, (0.20, 0.20, 0.20)),     # 12m: 20%
            (1.00, (0.00, 0.00, 0.00))      # 18m+: fully absorbed, deep scattering
        ])

        # ------------------------------------------------------------------
        # 3. Organic Shoreline Wash & Surface Slicks
        # ------------------------------------------------------------------
        shore_prox = nt.math('SUBTRACT', 1.0, nt.math('DIVIDE', depth, 0.65, clamp=True))
        f_noise = nt.noise(obj, scale=0.7, detail=4, rough=0.6).outputs['Fac']
        foam_fac = nt.ramp(nt.math('MULTIPLY', shore_prox, f_noise), [
            (0.35, (0.0, 0.0, 0.0)),
            (0.58, (0.5, 0.5, 0.5)),
            (0.78, (0.92, 0.92, 0.92))
        ])

        col = nt.mix(foam_fac, col_ramp, (0.88, 0.90, 0.90, 1.0))
        final_trans = nt.math('MULTIPLY', trans, nt.math('SUBTRACT', 1.0, foam_fac))

        # Surface roughness: liquid glass (0.025 to 0.05) with natural wind slicks
        slick = nt.ramp(gust, [(0.25, (0.025, 0.025, 0.025)), (0.75, (0.050, 0.050, 0.050))])
        rough = nt.mix(foam_fac, slick, 0.7, kind='FLOAT')

        # ------------------------------------------------------------------
        # 4. Principled BSDF with Subsurface Scattering
        # ------------------------------------------------------------------
        bsdf = nt.n('ShaderNodeBsdfPrincipled')
        nt.set(bsdf.inputs['Base Color'], col)
        nt.set(bsdf.inputs['Roughness'], rough)
        nt.set(bsdf.inputs['Transmission Weight'], final_trans)
        nt.link(b.outputs['Normal'], bsdf.inputs['Normal'])
        bsdf.inputs['IOR'].default_value = 1.333
        bsdf.inputs['Specular IOR Level'].default_value = 0.5

        # Subsurface scattering gives wave crests realistic internal scattering
        nt.set(bsdf.inputs['Subsurface Weight'], nt.math('MULTIPLY', nt.math('SUBTRACT', 1.0, final_trans), 0.32))
        nt.set(bsdf.inputs['Subsurface Scale'], 0.7)
        nt.set(bsdf.inputs['Subsurface Radius'], (0.1, 0.45, 0.85))

        out = nt.n('ShaderNodeOutputMaterial')
        nt.link(bsdf.outputs[0], out.inputs['Surface'])
    verts = np.array([[-size, -size, 0], [size, -size, 0], [size, size, 0], [-size, size, 0]], np.float32)
    ob = mesh_from_arrays('sea', verts, np.array([[0, 1, 2, 3]]), coll, m)
    return ob


def sky(kind='sun', elevation=35, azimuth=210, hdri=None, strength=1.0, rotation=0.0, sun_strength=None,
        turbidity_dust=1.0, ozone=1.0, air=1.0):
    """azimuth: compass bearing the sun shines FROM (0 = north, 90 = east)."""
    w = bpy.data.worlds.new('sky'); bpy.context.scene.world = w
    w.use_nodes = True
    nt = NT(w.node_tree); nt.N.clear()
    bg = nt.n('ShaderNodeBackground'); out = nt.n('ShaderNodeOutputWorld')
    nt.link(bg.outputs[0], out.inputs['Surface'])
    if hdri:
        hdr_path = os.path.join(PH, 'hdri', hdri if hdri.endswith('.hdr') else f"{hdri}.hdr")
        if not os.path.isfile(hdr_path):
            hdri_dir = os.path.join(PH, 'hdri')
            available = [f for f in os.listdir(hdri_dir) if f.endswith('.hdr')] if os.path.isdir(hdri_dir) else []
            hdr_path = os.path.join(hdri_dir, available[0]) if available else None
        if hdr_path:
            env = nt.n('ShaderNodeTexEnvironment')
            env.image = bpy.data.images.load(hdr_path, check_existing=True)
            mp = nt.mapping(nt.n('ShaderNodeTexCoord').outputs['Generated'], 1.0, rot=(0, 0, math.radians(rotation)))
            nt.link(mp, env.inputs['Vector'])
            nt.link(env.outputs['Color'], bg.inputs['Color'])
            bg.inputs['Strength'].default_value = strength
            return w
    st = nt.n('ShaderNodeTexSky', sky_type='MULTIPLE_SCATTERING')
    st.sun_elevation = math.radians(elevation)
    # Blender's sun_rotation: 0 = North (+Y), 90 = East (+X), 180 = South (-Y), 270 = West (-X)
    st.sun_rotation = math.radians(azimuth % 360)
    rad_az = math.radians(azimuth)
    rad_el = math.radians(elevation)
    if hasattr(st, 'sun_direction'):
        st.sun_direction = (
            math.sin(rad_az) * math.cos(rad_el),
            math.cos(rad_az) * math.cos(rad_el),
            math.sin(rad_el)
        )
    st.altitude = 50
    for attr, val in (('air_density', air), ('aerosol_density', turbidity_dust), ('dust_density', turbidity_dust),
                      ('ozone_density', ozone)):
        if hasattr(st, attr):
            setattr(st, attr, val)
    st.sun_disc = True
    nt.link(st.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    return w
