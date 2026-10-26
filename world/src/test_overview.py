import sys, os, math, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from blib import core, world, populate
import arche_veg
argv = sys.argv[sys.argv.index('--') + 1:]
k = float(argv[0]); out = argv[1]
s = core.reset()
t = time.time()
ob, meta, sites = world.terrain('arche', pixel=1.5)
d, meta, H, sites = world.load_terrain_data('arche')
world.sea(meta, os.path.join(core.BUILD, 'terrain', 'arche', 'height.exr'))
world.sky(elevation=24, azimuth=235, strength=0.22)
s.view_settings.exposure = -0.6
if k > 0:
    P = populate.build_protos()
    F = populate.Field(d, meta, H, step=2)
    arche_veg.vegetate(F, sites, P, core.collection('veg'), k)
print('BUILD', time.time() - t)
cams = {'over': ((2600, -7600, 3200), (0, -300, 150), 35),
        'slope': ((1650, -1700, 260), (700, -650, 330), 28),
        'port3': ((3300, -2400, 140), (2480, -1450, 15), 30)}
core.cycles(s, samples=48, res=(1280, 720))
for name in argv[2:]:
    loc, tgt, lens = cams[name]
    s.camera = core.camera('cam_' + name, loc, tgt, lens=lens)
    s.render.filepath = out.replace('.png', f'_{name}.png')
    t = time.time(); bpy.ops.render.render(write_still=True); print('RENDER', name, time.time() - t)
