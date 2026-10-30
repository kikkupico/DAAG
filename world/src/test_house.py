import sys, os, time, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from blib import core, world, mats, kit, buildings, protos_arch, scatter
argv = sys.argv[sys.argv.index('--') + 1:]
s = core.reset()
AM = buildings.arch_mats()
P = protos_arch.build_all(AM)
scatter.hide_protos()
bank = kit.Bank()
k = kit.Kit(bank, seed=3)
info = buildings.house_range(k, 62, 15, house=3)
k.build('house3', AM, core.collection('buildings'))
bank.build(P, core.collection('inst'))
g = mats.scanned('ground', 'dirt', 3.0)
r = mats.scanned('roadm', 'rocky_trail', 4.0)
core.mesh_from_arrays('ground', np.array([[-200, -200, -0.02], [200, -200, -0.02], [200, 200, -0.02], [-200, 200, -0.02]]), np.array([[0, 1, 2, 3]]), mat=g)
core.mesh_from_arrays('road', np.array([[-200, 7.5, -0.01], [200, 7.5, -0.01], [200, 14, -0.01], [-200, 14, -0.01]]), np.array([[0, 1, 2, 3]]), mat=r)
world.sky(elevation=22, azimuth=125, strength=0.22)
s.view_settings.exposure = -0.5
bx, by, bz = info['board']
cams = {'street': ((22, 12.5, 1.65), (-6, 5.5, 2.4), 28),
        'board': ((bx + 0.6, by + 2.6, 1.6), (bx, by, 1.6), 40),
        'wide': ((26, 34, 12), (2, 0, 3), 30),
        'roof': ((-22, 16, 8.5), (-29, 2, 5.0), 32)}
core.cycles(s, samples=int(argv[1]), res=(1280, 720))
for name in argv[2:]:
    loc, tgt, lens = cams[name]
    s.camera = core.camera('cam_' + name, loc, tgt, lens=lens)
    s.render.filepath = argv[0].replace('.png', f'_{name}.png')
    t = time.time(); bpy.ops.render.render(write_still=True); print('RENDER', name, round(time.time() - t, 1))
