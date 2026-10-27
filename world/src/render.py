"""Render named shots from a built island .blend.
blender -b build/arche.blend -P src/render.py -- <shots.py module> <shot,shot,...|all> [preview|final]"""
import sys, os, math, time, importlib
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import numpy as np
from blib import core, world
from blib.mats import NT

argv = sys.argv[sys.argv.index('--') + 1:]
mod = importlib.import_module(argv[0])
names = argv[1].split(',')
quality = argv[2] if len(argv) > 2 else 'preview'
OUT = os.path.join(core.ROOT, 'renders', {'preview': 'preview', 'check': 'check'}.get(quality, 'final'))
os.makedirs(OUT, exist_ok=True)
s = bpy.context.scene

PRESETS = {
    # sun: elevation, azimuth (compass bearing the light comes from); haze colour; haze distance
    'golden': dict(sky='sun', elev=9, strength=0.5, exposure=0.1, haze=(0.78, 0.66, 0.52), hazeD=9000, hazeS=0.55),
    'late': dict(sky='sun', elev=18, strength=0.3, exposure=-0.4, haze=(0.74, 0.72, 0.68), hazeD=12000, hazeS=0.5),
    'morning': dict(sky='sun', elev=24, strength=0.25, exposure=-0.6, haze=(0.72, 0.76, 0.82), hazeD=14000, hazeS=0.5),
    'noon': dict(sky='sun', elev=58, strength=0.2, exposure=-0.9, haze=(0.74, 0.8, 0.88), hazeD=16000, hazeS=0.45),
    'overcast': dict(sky='hdri', hdri='kloofendal_overcast_puresky', strength=1.4, exposure=0.2, haze=(0.62, 0.64, 0.66), hazeD=5000, hazeS=0.7),
    'cloudy_sun': dict(sky='hdri', hdri='kloofendal_48d_partly_cloudy_puresky', strength=1.0, exposure=-0.4, haze=(0.72, 0.76, 0.82), hazeD=12000, hazeS=0.5),
    'dusk': dict(sky='hdri', hdri='qwantani_dusk_2_puresky', strength=1.6, exposure=0.6, haze=(0.5, 0.44, 0.42), hazeD=7000, hazeS=0.55),
    'evening_cloud': dict(sky='hdri', hdri='belfast_sunset_puresky', strength=1.2, exposure=0.2, haze=(0.7, 0.6, 0.52), hazeD=8000, hazeS=0.5),
}


def hdri_sun_bearing(name):
    """Compass azimuth of the brightest region in an equirect HDR (so rotation can aim the sun)."""
    img = bpy.data.images.load(os.path.join(core.PH, 'hdri', name + '.hdr'), check_existing=True)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(px)
    a = px.reshape(h, w, 4)[..., :3].sum(-1)
    a = a[::8, ::8]
    i, j = np.unravel_index(np.argmax(a), a.shape)
    u = (j * 8 + 4) / w
    # Blender equirect: u=0.5 looks along -Y?  direction angle phi = (u - 0.5) * 2pi around Z, measured from +X
    phi = (0.5 - u) * 2 * math.pi
    # direction vector (cos phi, sin phi); compass bearing = atan2(x, y)
    return math.degrees(math.atan2(math.cos(phi), math.sin(phi))) % 360


def set_light(p, sun_from):
    old = s.world
    if p['sky'] == 'sun':
        world.sky(elevation=p['elev'], azimuth=sun_from, strength=p['strength'])
    else:
        cur = hdri_sun_bearing(p['hdri'])
        world.sky(hdri=p['hdri'], strength=p['strength'], rotation=(cur - sun_from))
    s.view_settings.exposure = p['exposure']


def compositor(haze, D, strength, depth=60000.0):
    vl = bpy.context.view_layer
    vl.use_pass_mist = True
    s.world.mist_settings.start = 0.0
    s.world.mist_settings.depth = depth
    s.world.mist_settings.falloff = 'LINEAR'
    tree = bpy.data.node_groups.new('comp', 'CompositorNodeTree')
    s.compositing_node_group = tree
    tree.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    nt = NT(tree)
    rl = nt.n('CompositorNodeRLayers')
    out = nt.n('NodeGroupOutput')
    mist = rl.outputs['Mist']
    dist = nt.math('MULTIPLY', mist, depth)
    fac = nt.math('SUBTRACT', 1.0, nt.math('EXPONENT', nt.math('DIVIDE', dist, -D)))
    fac = nt.math('MULTIPLY', fac, strength)
    fac = nt.math('MULTIPLY', fac, nt.math('LESS_THAN', mist, 0.9995))
    mixed = nt.mix(fac, rl.outputs['Image'], (*haze, 1.0))
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
    set_light(p, sh.get('sun_from', 210))
    compositor(p['haze'], sh.get('hazeD', p['hazeD']) / max(fog, 0.05), sh.get('hazeS', p['hazeS']) if fog > 0 else 0.0)
    cam = core.camera('cam_' + name, sh['cam'], sh['target'], lens=sh.get('lens', 35))
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
    for hide in sh.get('hide', []):
        for o in bpy.data.objects:
            if o.name.startswith(hide):
                o.hide_render = False
    for ob in added:
        bpy.data.objects.remove(ob)
    print('SHOT', name, round(time.time() - t, 1), s.render.filepath)
