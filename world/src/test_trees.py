import sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from blib import core, veg, world, mats
s = core.reset()
M = veg.species_mats()
c = core.collection('trees')
xs = 8
for sp, n, off in (('olive', 3, 8), ('cypress', 2, 4), ('pine', 2, 9), ('lentisk', 3, 3), ('thyme', 3, 1.5), ('oak', 1, 0)):
    for k in range(n):
        t0 = time.time()
        ob = veg.make_tree(sp, f'{sp}{k}', c, seed=k + 1, mats=M)
        ob.location = (xs, 0, 0); xs += off
        print('TREE', sp, k, len(ob.data.polygons), round(time.time() - t0, 2))
ob.location = (xs + 18, 22, 0)
g = mats.scanned('ground', 'dry_ground_rocks', 3.0)
core.mesh_from_arrays('ground', np.array([[-50, -50, 0], [150, -50, 0], [150, 80, 0], [-50, 80, 0]]), np.array([[0, 1, 2, 3]]), mat=g)
world.sky(elevation=28, azimuth=240, strength=0.25); s.view_settings.exposure = -1.0
cam = core.camera('cam', (30, -42, 7), (32, 6, 5), lens=26)
s.camera = cam
core.cycles(s, samples=64, res=(1600, 800))
s.render.filepath = sys.argv[-1]
bpy.ops.render.render(write_still=True)
