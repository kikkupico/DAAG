"""Render named shots from a built island .blend.
blender -b build/arche.blend -P src/render.py -- <shots.py module> <shot,shot,...|all> [preview|final]"""
import sys, os, math, time, importlib
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import numpy as np
from blib import core, world
from blib.mats import NT

if '--' in sys.argv:
    argv = sys.argv[sys.argv.index('--') + 1:]
    mod = importlib.import_module(argv[0])
    names = argv[1].split(',')
    quality = argv[2] if len(argv) > 2 else 'preview'
    OUT = os.path.join(core.ROOT, 'renders', {'preview': 'preview', 'check': 'check'}.get(quality, 'final'))
    os.makedirs(OUT, exist_ok=True)
else:
    mod, names, quality, OUT = None, [], 'preview', None
s = bpy.context.scene

PRESETS = {
    # sun: elevation, azimuth (compass bearing the light comes from); haze colour; haze distance
    'golden': dict(sky='sun', elev=9, strength=0.5, exposure=-0.6, haze=(0.78, 0.66, 0.52), hazeD=9000, hazeS=0.55),
    'late': dict(sky='sun', elev=18, strength=0.3, exposure=-0.5, haze=(0.74, 0.72, 0.68), hazeD=12000, hazeS=0.5),
    'morning': dict(sky='sun', elev=24, strength=0.25, exposure=-0.6, haze=(0.72, 0.76, 0.82), hazeD=14000, hazeS=0.5),
    'noon': dict(sky='sun', elev=58, strength=0.2, exposure=-0.9, haze=(0.74, 0.8, 0.88), hazeD=16000, hazeS=0.45),
    'overcast': dict(sky='hdri', hdri='kloofendal_overcast_puresky', strength=1.4, exposure=0.0, haze=(0.62, 0.64, 0.66), hazeD=5000, hazeS=0.7),
    'cloudy_sun': dict(sky='hdri', hdri='kloofendal_48d_partly_cloudy_puresky', strength=1.0, exposure=-0.4, haze=(0.72, 0.76, 0.82), hazeD=12000, hazeS=0.5),
    'dusk': dict(sky='hdri', hdri='qwantani_dusk_2_puresky', strength=1.6, exposure=0.1, haze=(0.5, 0.44, 0.42), hazeD=7000, hazeS=0.55),
    'evening_cloud': dict(sky='hdri', hdri='belfast_sunset_puresky', strength=1.2, exposure=-0.1, haze=(0.7, 0.6, 0.52), hazeD=8000, hazeS=0.5),
}


def resolve_hdri_path(name):
    """Path to an equirect HDRI in assets/polyhaven/hdri, with robust fallbacks if missing."""
    hdri_dir = os.path.join(core.PH, 'hdri')
    if name:
        target = os.path.join(hdri_dir, name if name.endswith('.hdr') else f"{name}.hdr")
        if os.path.isfile(target):
            return target
    # Fallback to closest matching available HDRI
    if os.path.isdir(hdri_dir):
        available = sorted([f for f in os.listdir(hdri_dir) if f.endswith('.hdr')])
        if available:
            name_lower = (name or '').lower()
            for cand in available:
                cand_lower = cand.lower()
                if any(k in name_lower and k in cand_lower for k in ('dusk', 'sunset', 'late', 'evening', 'overcast', 'cloud')):
                    print(f"Warning: HDRI '{name}' not found, falling back to matched '{cand}'")
                    return os.path.join(hdri_dir, cand)
            print(f"Warning: HDRI '{name}' not found, falling back to '{available[0]}'")
            return os.path.join(hdri_dir, available[0])
    return None


def hdri_sun_bearing(name):
    """Compass azimuth of the brightest region in an equirect HDR (so rotation can aim the sun)."""
    path = resolve_hdri_path(name)
    if not path or not os.path.isfile(path):
        return 210.0
    img = bpy.data.images.load(path, check_existing=True)
    w, h = img.size
    if w == 0 or h == 0:
        return 210.0
    px = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(px)
    a = px.reshape(h, w, 4)[..., :3].sum(-1)
    a = a[::8, ::8]
    i, j = np.unravel_index(np.argmax(a), a.shape)
    u = (j * 8 + 4) / w
    # Blender equirect: u=0.5 looks along -Y?  direction angle phi = (u - 0.5) * 2pi around Z, measured from +X
    phi = (0.5 - u) * 2 * math.pi
    # direction vector (cos phi, sin phi); compass bearing = atan2(x, y)
    return math.degrees(math.atan2(math.cos(phi), math.sin(phi))) % 360


def set_light(p, sun_from, shot=None):
    old = s.world
    if p['sky'] == 'sun':
        world.sky(elevation=p['elev'], azimuth=sun_from, strength=p['strength'])
    else:
        hdr_path = resolve_hdri_path(p.get('hdri'))
        if hdr_path:
            hdr_name = os.path.splitext(os.path.basename(hdr_path))[0]
            cur = hdri_sun_bearing(hdr_name)
            world.sky(hdri=hdr_name, strength=p['strength'], rotation=(cur - sun_from))
        else:
            print(f"Warning: No HDRI maps available for '{p.get('hdri')}', falling back to sun sky")
            world.sky(elevation=20, azimuth=sun_from, strength=p.get('strength', 1.0))

    # Base exposure: start from preset exposure, compensated for sun_scale
    exp = p.get('exposure', 0.0)
    if shot and shot.get('sun_scale') and shot['sun_scale'] != 1.0 and shot['sun_scale'] > 0:
        exp -= 0.5 * math.log2(shot['sun_scale'])
    if shot and 'exposure' in shot:
        exp = shot['exposure']
    s.view_settings.exposure = exp


def analyze_image_exposure(filepath):
    """Analyze image luminance and highlight clipping using numpy."""
    try:
        img = bpy.data.images.load(filepath)
        w, h = img.size
        if w == 0 or h == 0:
            bpy.data.images.remove(img)
            return None
        px = np.empty(w * h * 4, np.float32)
        img.pixels.foreach_get(px)
        bpy.data.images.remove(img)
        rgb = px.reshape(-1, 4)[:, :3]
        lum = np.dot(rgb, [0.2126, 0.7152, 0.0722])
        max_c = np.max(rgb, axis=1)
        clipped = float(np.mean(max_c >= 0.985))
        mean_lum = float(np.mean(lum))
        p95 = float(np.percentile(lum, 95))
        p99 = float(np.percentile(lum, 99))
        return {'mean': mean_lum, 'p95': p95, 'p99': p99, 'clipped': clipped}
    except Exception as e:
        print(f"Warning: could not evaluate exposure: {e}")
        return None


def adapt_exposure(filepath, rr, max_iterations=3):
    """Automatically balance exposure to avoid blown-out sunny highlights or overly dark shadows."""
    stats = analyze_image_exposure(filepath)
    if not stats:
        return
    
    orig_exp = s.view_settings.exposure
    exp = orig_exp
    
    for _ in range(max_iterations):
        delta = 0.0
        # Check for blown out highlights
        if stats['clipped'] > 0.015 or (stats['mean'] > 0.62 and stats['p99'] >= 0.98):
            if stats['clipped'] > 0.12 or stats['mean'] > 0.72:
                delta = -0.7 - min(1.3, (stats['clipped'] - 0.12) * 4.0)
            elif stats['clipped'] > 0.04 or stats['mean'] > 0.65:
                delta = -0.45 - (stats['clipped'] - 0.04) * 4.0
            else:
                delta = -0.3
        # Check for severely underexposed scenes (e.g. interior without sunlight)
        elif stats['p95'] < 0.22 and stats['mean'] < 0.10:
            delta = min(1.8, max(0.4, 0.5 * math.log2(0.20 / max(0.01, stats['mean']))))
        
        if abs(delta) < 0.05:
            break
            
        exp += delta
        s.view_settings.exposure = exp
        rr.save_render(filepath, scene=s)
        new_stats = analyze_image_exposure(filepath)
        if not new_stats:
            break
        stats = new_stats
        
    if abs(exp - orig_exp) >= 0.05:
        print(f"  [Adaptive Exposure] Adjusted {orig_exp:+.2f} -> {exp:+.2f} EV (mean: {stats['mean']:.2f}, clipped: {stats['clipped']*100:.1f}%)")


def compositor(haze, D, strength, depth=180000.0):
    """Distance haze over the surfaces, not the sky. The sky is rendered as its own pass (the film is
    transparent), so a pixel that is partly sky, at a roof edge or through the gaps in a cypress, takes the
    haze of its surfaces' own distance instead of the sky's, which left pale fringes and speckle."""
    vl = bpy.context.view_layer
    vl.use_pass_mist = True
    vl.use_pass_environment = True
    s.world.mist_settings.start = 0.0
    s.world.mist_settings.depth = depth
    s.world.mist_settings.falloff = 'LINEAR'
    tree = bpy.data.node_groups.new('comp', 'CompositorNodeTree')
    s.compositing_node_group = tree
    tree.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    nt = NT(tree)
    rl = nt.n('CompositorNodeRLayers')
    out = nt.n('NodeGroupOutput')
    a = rl.outputs['Alpha']
    # the mist pass counts sky as 1; take that share out to leave the surfaces' own mist
    mist = nt.math('DIVIDE', nt.math('SUBTRACT', rl.outputs['Mist'], nt.math('SUBTRACT', 1.0, a)),
                   nt.math('MAXIMUM', a, 1e-4))
    # through leaf cards the mist pass is noisy, single pixels reading kilometres off; the nearest distance
    # within two pixels takes them out
    near = nt.n('CompositorNodeDilateErode')
    nt.link(mist, near.inputs['Mask']); near.inputs['Type'].default_value = 'Steps'; near.inputs['Size'].default_value = -2
    # At the image boundaries, DilateErode with negative size samples out-of-bounds as 0.0; restore mist if eroded to 0
    mist_valid = nt.mix(nt.math('LESS_THAN', near.outputs[0], 1e-4), near.outputs[0], mist, kind='FLOAT')
    dist = nt.math('MULTIPLY', mist_valid, depth)
    fac = nt.math('SUBTRACT', 1.0, nt.math('EXPONENT', nt.math('DIVIDE', dist, -D)))
    fac = nt.math('MULTIPLY', fac, strength, clamp=True)
    # Toward the distant horizon (> 35 km), atmospheric extinction rises smoothly to 1.0
    # so the sea seamlessly merges into the sky without an abrupt geometric edge
    fade_horiz = nt.ramp(nt.math('DIVIDE', dist, depth, clamp=True),
                         [(0.25, (0, 0, 0)), (0.85, (1, 1, 1))])
    fac = nt.math('MAXIMUM', fac, fade_horiz)
    # surfaces (premultiplied by their coverage) toward the haze colour, then the sky behind them
    surf = nt.mix(fac, rl.outputs['Image'], nt.mix(1.0, (*haze, 1.0), a, blend='MULTIPLY'))
    mixed = nt.mix(1.0, surf, rl.outputs['Environment'], blend='ADD')
    opaque = nt.n('CompositorNodeSetAlpha')
    nt.link(mixed, opaque.inputs['Image']); opaque.inputs['Alpha'].default_value = 1.0
    mixed = opaque.outputs['Image']
    gl = nt.n('CompositorNodeGlare')
    try:
        gl.inputs['Type'].default_value = 'Fog Glow'
    except Exception:
        pass
    gl.inputs['Strength'].default_value = 0.12 if 'Strength' in gl.inputs else 0
    gl.inputs['Threshold'].default_value = 1.2
    nt.link(mixed, gl.inputs['Image'])
    nt.link(gl.outputs['Image'], out.inputs[0])


def hide_except(keep):
    pass


if mod:
    shots = mod.shots()
    if names == ['all']:
        names = list(shots)
    for name in names:
        sh = shots[name]
        t = time.time()
        p = dict(PRESETS[sh.get('light', 'morning')])
        p.update(sh.get('light_override', {}))
        if 'sun_elev' in sh and p['sky'] == 'sun':      # an HDRI sky has its own sun
            p['elev'] = sh['sun_elev']
        p['strength'] *= sh.get('sun_scale', 1.0)       # brighter or dimmer than the preset
        fog = sh.get('fog_scale', 1.0)                  # 1 = the preset's haze, 0 = none, 2 = twice as dense
        set_light(p, sh.get('sun_from', 210), shot=sh)
        mist_depth = max(180000.0, sh.get('hazeD', p['hazeD']) * 3.5)
        compositor(p['haze'], sh.get('hazeD', p['hazeD']) / max(fog, 0.05), sh.get('hazeS', p['hazeS']) if fog > 0 else 0.0, depth=mist_depth)
        cam = core.camera('cam_' + name, sh['cam'], sh['target'], lens=sh.get('lens', 35), clip_end=sh.get('clip_end', 250000))
        if sh.get('dof'):
            cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = sh['dof'][1]; cam.data.dof.focus_distance = sh['dof'][0]
        s.camera = cam
        res = sh.get('res', (1920, 1080))
        if quality == 'preview':
            core.cycles(s, samples=sh.get('psamples', 32), res=res, pct=50)
        elif quality == 'check':
            core.cycles(s, samples=48, res=res, pct=100)
        else:
            core.cycles(s, samples=sh.get('samples', 160), res=res, pct=100)
            s.cycles.adaptive_threshold = 0.01
        s.render.film_transparent = True              # the sky comes back in the compositor (see compositor)
        s.render.image_settings.color_mode = 'RGB'
        for hide in sh.get('hide', []):
            for o in bpy.data.objects:
                if o.name.startswith(hide):
                    o.hide_render = True
        added = []
        for L in sh.get('lights', []):
            ld = bpy.data.lights.new('fill', L.get('type', 'AREA'))
            ld.energy = L['energy']; ld.color = L.get('color', (1.0, 0.92, 0.8))
            if ld.type == 'AREA':
                ld.shape = 'DISK' if L.get('disk') else 'RECTANGLE'; ld.size = L.get('size', 2.0); ld.size_y = L.get('size_y', L.get('size', 2.0))
            if ld.type == 'SPOT':
                ld.spot_size = math.radians(L.get('cone', 40)); ld.spot_blend = 0.6; ld.shadow_soft_size = L.get('soft', 0.3)
            if ld.type == 'POINT':
                ld.shadow_soft_size = L.get('soft', 0.5)
            ob = bpy.data.objects.new('fill', ld); s.collection.objects.link(ob)
            ob.location = L['loc']
            core.look_at(ob, L['at']) if 'at' in L else None
            ob.visible_camera = False
            added.append(ob)
        if 'pre' in sh:
            sh['pre'](s)
        s.render.filepath = os.path.join(OUT, f'{name}.png')
        bpy.ops.render.render(write_still=True)
        rr = bpy.data.images.get('Render Result')
        if rr and sh.get('adaptive_exposure', True) and 'exposure' not in sh:
            adapt_exposure(s.render.filepath, rr)
        for hide in sh.get('hide', []):
            for o in bpy.data.objects:
                if o.name.startswith(hide):
                    o.hide_render = False
        for ob in added:
            bpy.data.objects.remove(ob)
        print('SHOT', name, round(time.time() - t, 1), s.render.filepath)
