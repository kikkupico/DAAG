import sys, os, time, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from blib import core, world, mats, kit, buildings, protos_arch, props, scatter
argv = sys.argv[sys.argv.index('--') + 1:]
s = core.reset()
AM = props.prop_mats(buildings.arch_mats())
PP = props.build_all(AM)
scatter.hide_protos()
c = core.collection('show')
x = 0; ys = 0
for name, gap in (('amphora', 0.6), ('pithos', 1.5), ('sack', 1.0), ('crate', 1.2), ('cart', 4.5), ('handcart', 3), ('nets', 5), ('skiff', 4), ('courier_boat', 4), ('ferry', 5), ('merchantman', 6), ('merchant_sail', 6)):
    for o in sorted(PP[name].all_objects, key=lambda o: o.name):
        inst = o.copy(); inst.data = o.data; c.objects.link(inst)
        if name in ('skiff', 'courier_boat', 'ferry', 'merchantman', 'merchant_sail'):
            inst.location = (-40, ys, 0); ys += 7 if name in ('skiff', 'courier_boat', 'ferry') else 11
        else:
            inst.location = (x, 0, 0); x += gap
g = mats.scanned('ground', 'dirt', 3.0)
core.mesh_from_arrays('ground', np.array([[-50, -50, 0], [150, -50, 0], [150, 80, 0], [-50, 80, 0]]), np.array([[0, 1, 2, 3]]), mat=g)
world.sky(elevation=30, azimuth=150, strength=0.22); s.view_settings.exposure = -0.5
core.cycles(s, samples=48, res=(1600, 800))
s.camera = core.camera('c1', (8, -9, 3.5), (8, 0, 0.6), lens=30)
s.view_settings.exposure = -1.0
s.render.filepath = argv[0].replace('.png', '_a.png'); bpy.ops.render.render(write_still=True)
s.camera = core.camera('c2', (-14, -10, 7), (-40, 22, 2), lens=28)
s.render.filepath = argv[0].replace('.png', '_b.png'); bpy.ops.render.render(write_still=True)
