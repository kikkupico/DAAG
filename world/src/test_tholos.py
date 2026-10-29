"""The Tholos alone, for working on it: blender -b -P src/test_tholos.py -- out.png samples view [view ...]"""
import sys, os, time, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from blib import core, world, mats as M, kit, buildings, protos_arch, props, scatter, paxos_bld
argv = sys.argv[sys.argv.index('--') + 1:]
s = core.reset()
AM = props.prop_mats(buildings.arch_mats())
src = open(os.path.join(os.path.dirname(__file__), 'build_paxos.py')).read()
for line in src.splitlines():                       # the island's own material lines, so the test looks the same
    if line.startswith("AM['"):
        exec(line)
P = protos_arch.build_all(AM)
scatter.hide_protos()
bank = kit.Bank()
k = kit.Kit(bank, seed=12)
paxos_bld.tholos(k)
k.build('tholos', AM, core.collection('buildings'))
bank.build(P, core.collection('inst'))
g = M.scanned('ground', 'dirt', 3.0)
core.mesh_from_arrays('ground', np.array([[-60, -60, -0.02], [60, -60, -0.02], [60, 60, -0.02], [-60, 60, -0.02]]), np.array([[0, 1, 2, 3]]), mat=g)
world.sky(elevation=float(os.environ.get('ELEV', 50)), azimuth=float(os.environ.get('AZ', 120)), strength=0.25)
if os.environ.get('FILL'):
    ld = bpy.data.lights.new('fill', 'AREA'); ld.energy = float(os.environ['FILL']); ld.size = 6
    ob = bpy.data.objects.new('fill', ld); ob.location = (0, 0, 5.5); bpy.context.scene.collection.objects.link(ob)
s.view_settings.exposure = float(os.environ.get('EXPO', 0.6))
zf = 0.6
cams = {'inside': ((-6.0, 0.6, zf + 1.7), (1.0, 0.0, zf + 1.2), 20),
        'podium': ((-2.2, -1.5, zf + 1.8), (0.5, 0.1, zf + 1.1), 28),
        'seal': ((-0.25, -0.04, zf + 1.75), (0.45, -0.02, zf + 1.36), 40),
        'top': ((0.0, 0.04, zf + 2.1), (0.42, 0.04, zf + 1.36), 34),
        'cover2': ((-3.4, -1.9, 2.0), (2.5, 0.8, 1.4), 22),
        'porch2': ((15.5, 0.0, 1.7), (2.0, 0.0, 1.5), 35),
        'table': ((-1.5, 0.03, 1.95), (-0.9, 0.03, 1.4), 45),
        'desk': ((-0.6, -0.9, zf + 1.6), (0.4, 0.05, zf + 1.36), 30),
        'bench': ((5.57 - 6.17 + 6.17 * 0, 1.88, zf + 1.4), (6.17 * math.cos(math.radians(36)) * 1.2, 6.17 * math.sin(math.radians(36)) * 1.2, zf + 0.9), 32),
        'up': ((-5.0, -2.0, zf + 1.6), (0.0, 0.0, zf + 6.0), 18),
        'outside': ((19.0, 7.5, 2.2), (4.0, 0.0, 3.8), 26)}
res = tuple(int(v) for v in os.environ.get('RES', '1200x896').split('x'))
core.cycles(s, samples=int(argv[1]), res=res)
for name in argv[2:]:
    loc, tgt, lens = cams[name]
    s.camera = core.camera('cam_' + name, loc, tgt, lens=lens)
    s.render.filepath = argv[0].replace('.png', f'_{name}.png')
    t = time.time(); bpy.ops.render.render(write_still=True); print('RENDER', name, round(time.time() - t, 1))
