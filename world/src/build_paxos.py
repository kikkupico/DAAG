"""Assemble Paxos and save build/paxos.blend.
blender -b -P src/build_paxos.py -- [veg_density]"""
import sys, os, math, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import numpy as np
from blib import core, world, populate, kit, buildings, protos_arch, props, mountain, road, scatter, classical, paxos_bld, veg, solids, mats as M
from blib.kit import T, Rz, Rx, Ry, S
import paxos_veg

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
VEG = float(argv[0]) if argv else 1.0
t0 = time.time()
s = core.reset()
C = {n: core.collection(n) for n in ('terrain', 'buildings', 'harbour', 'veg', 'props', 'instances', 'chamber', 'tholos', 'oracle', 'libraries', 'stoa')}
ter, meta, sites = world.terrain('paxos', C['terrain'], pixel=1.0)
d, meta, H, sites = world.load_terrain_data('paxos')
world.sea(meta, os.path.join(core.BUILD, 'terrain', 'paxos', 'height.exr'), C['terrain'])
F = populate.Field(d, meta, H, step=2)
zf = lambda x, y: float(F.z(np.array([x]), np.array([y]))[0])

# ------------------------------------------------------------------ materials
AM = props.prop_mats(buildings.arch_mats())
AM['ashlar'] = M.plaster('ashlar_white', (0.74, 0.72, 0.66, 1), base_tex='sandstone_cracks', loss=0.0, scale=1.2)
AM['paint_blue'] = M.flat('paint_blue', (0.045, 0.075, 0.2, 1), rough=0.8)
AM['paint_red'] = M.flat('paint_red', (0.42, 0.075, 0.045, 1), rough=0.8)
AM['honey'] = M.plaster('honey_lime', (0.7, 0.55, 0.34, 1), base_tex='sandstone_cracks', loss=0.0, scale=1.2)
AM['pave_honey'] = M.stone_rt('pave_honey', 'rock_surface', (0.55, 0.45, 0.32, 1), 1.0, var=0.15)
AM['limewall'] = M.plaster('limewall', (0.7, 0.67, 0.6, 1), base_tex='sandstone_cracks', loss=0.0, scale=1.5)
AM['shelf'] = M.timber('shelf', 'rough_wood', (0.55, 0.42, 0.3, 1), 0.8)
AM['papyrus'] = M.linen('papyrus', (0.62, 0.52, 0.34, 1))
AM['tagred'] = M.flat('tag_red', (0.42, 0.08, 0.05, 1), 0.6)
AM['ink'] = M.flat('ink', (0.03, 0.025, 0.02, 1), 0.5)
AM['board_paint'] = M.flat('board_paint', (0.62, 0.58, 0.48, 1), 0.7)
AM['soot'] = M.flat('soot', (0.04, 0.035, 0.03, 1), 0.95)
AM['dark_stone'] = M.flat('dark_stone', (0.08, 0.075, 0.07, 1), 0.9)
AM['groove'] = M.marble('groove_marble', (0.52, 0.5, 0.46, 1))
AM['marble_floor'] = M.stone_rt('marble_floor', 'marble_01', (0.62, 0.6, 0.55, 1), 1.2, bump=0.2, var=0.08)
AM['dark_floor'] = M.stone_rt('dark_floor', 'marble_01', (0.1, 0.1, 0.1, 1), 1.2, bump=0.2, var=0.08)
for i, c in enumerate(((0.55, 0.12, 0.08), (0.15, 0.3, 0.55), (0.2, 0.42, 0.18), (0.62, 0.48, 0.1), (0.4, 0.18, 0.42))):
    AM[f'tag{i}'] = M.flat(f'wax_tag{i}', (*c, 1), 0.35)
AM['wallrock'] = M.stone('wallrock', 'rock_boulder_dry', (0.6, 0.58, 0.54, 1), 1.6, bump=1.2)
AM['pebble_w'] = M.flat('pebble_white', (0.78, 0.76, 0.72, 1), 0.35)
AM['pebble_b'] = M.flat('pebble_black', (0.03, 0.03, 0.03, 1), 0.3)

# ------------------------------------------------------------------ prototypes
P = {}
P.update(protos_arch.build_all(AM))
P.update(props.build_all(AM))
P.update(mountain.build_rock_protos(AM))
P.update(classical.build_column_protos(AM))
VP = populate.build_protos()
P['court_tree'] = VP['olive']
for nm in ('pebble_w', 'pebble_b'):
    c = scatter.proto_collection('p_' + nm)
    kk = kit.Kit(seed=3)
    for v in range(3):
        kk2 = kit.Kit(seed=v)
        mountain.rock_mesh(kk2, nm, 400 + v, 0.012, 0.01, 0.007, rough=0.1, flat=2.0)
        kk2.build(f'{nm}_{v}', AM, c, smooth=True)
    P[nm] = c
c = scatter.proto_collection('p_scroll')
for v in range(3):
    kk = kit.Kit(seed=v)
    paxos_bld.scroll_with_tag(kk, 0, 0, 0.04, 0, L=0.3 + 0.03 * v, r=0.036 + 0.004 * v, tag=v != 2)
    kk.build(f'scroll_{v}', AM, c, smooth=True)
P['scroll'] = c
c = scatter.proto_collection('p_great_oak')
veg.make_tree('oak', 'great_oak', c, seed=7, height=5.5, mats=veg.species_mats())
P['great_oak'] = c
# statues from the scans
with bpy.data.libraries.load(os.path.join(core.ROOT, 'assets', 'statues', 'statues.blend')) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('statue_')]
for ob in dst.objects:
    nm = ob.name.replace('statue_', '').replace('ü', 'u')
    c = scatter.proto_collection('p_statue_' + nm)
    c.objects.link(ob)
    ob.data.materials.clear()
    ob.data.materials.append(M.bronze('statue_bronze', 0.55) if 'jung' in nm else M.marble('statue_marble', (0.86, 0.84, 0.78, 1)))
    P['statue_' + nm] = c
scatter.hide_protos()
bank = kit.Bank()
rng = np.random.default_rng(8)
print('PROTOS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ the Chamber, its terrace and statues
ch = sites['chamber']; th = sites['tholos']
face = math.atan2(th['y'] - ch['y'], th['x'] - ch['x'])      # the door looks across the bay
kc = kit.Kit(bank, seed=11)
kc.push(T(ch['x'], ch['y'], ch['z']) @ Rz(face))
info_ch = paxos_bld.chamber(kc, north=math.pi / 2 - face)
paxos_bld.radial_paving(kc, 13.45, 31.0, 0.07, ring=1.1)
kc.pop()
names = ['statue_athena', 'statue_hermes', 'statue_plato', 'statue_jungling', 'statue_ephebe', 'statue_athena']
for i, nm in enumerate(names):
    a = face + math.radians(-75 + i * 30)
    x = ch['x'] + 23 * math.cos(a); y = ch['y'] + 23 * math.sin(a)
    kc.push(T(0, 0, 0))
    paxos_bld.pedestal(kc, x, y, ch['z'], h=1.8, face=a, statue=nm)
    kc.pop()
kc.build('chamber', AM, C['chamber'])
cyp_pts = []
for i in range(18):
    a = face + math.pi + math.radians(-80 + i * 9.4)
    x = ch['x'] + 34 * math.cos(a); y = ch['y'] + 34 * math.sin(a)
    cyp_pts.append((x, y, zf(x, y) - 0.2))
scatter.instances('chamber_cypresses', np.array(cyp_pts), VP['cypress'], C['veg'], scale=np.full(len(cyp_pts), 1.1))
print('CHAMBER', round(time.time() - t0, 1))

# ------------------------------------------------------------------ the Tholos and its court
kt = kit.Kit(bank, seed=12)
kt.push(T(th['x'], th['y'], th['z']) @ Rz(th['face']))
info_th = paxos_bld.tholos(kt)
from blib import arch
arch.paving(kt, -21, -21, 21, 21, 0.12, size=(1.2, 0.9))
for (a0, a1) in (((-21, 21), (21, 21)), ((21, -21), (21, 21)), ((-21, -21), (21, -21))):
    kt.beam('pave_honey', (a0[0], a0[1], 0.55), (a1[0], a1[1], 0.55), 0.5, 0.9)
for s_ in (-1, 1):
    kt.box('pave_honey', 13.5, s_ * 3.5 - 0.9, 0.12, 15.8, s_ * 3.5 + 0.9, 0.6)
kt.pop()
kt.build('tholos', AM, C['tholos'])
olv = []
for i in range(14):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(13, 19)
    x = th['x'] + r * math.cos(a); y = th['y'] + r * math.sin(a)
    if abs(math.atan2(math.sin(a - th['face']), math.cos(a - th['face']))) > 0.5:
        olv.append((x, y, th['z'] + 0.1))
scatter.instances('tholos_olives', np.array(olv), VP['olive'], C['veg'], scale=rng.uniform(1.3, 1.8, len(olv)))
print('THOLOS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ the oracle at the fork
ora = sites['oracle']
ko = kit.Kit(bank, seed=13)
ko.push(T(ora['x'], ora['y'], ora['z']))
paxos_bld.oracle(ko)
ko.pop()
ko.build('oracle', AM, C['oracle'])

# ------------------------------------------------------------------ libraries
for l in sites['libraries']:
    kl = kit.Kit(bank, seed=100 + l['n'])
    kl.push(T(l['x'], l['y'], l['z']) @ Rz(l['face'] - math.pi / 2))
    paxos_bld.library(kl, interior=True)
    kl.pop()
    kl.build(f'library_{l["n"]:02d}', AM, C['libraries'])
print('LIBRARIES', round(time.time() - t0, 1))

# ------------------------------------------------------------------ stoa, festival ground, painted diagram
st = sites['stoa']; fg = sites['festival']
ks = kit.Kit(bank, seed=14)
ks.push(T(st['x'], st['y'], st['z']) @ Rz(st['ang']))
paxos_bld.stoa(ks, st['len'])
ks.pop()
ks.push(T(fg['x'], fg['y'], fg['z']) @ Rz(fg['ang']))
paxos_bld.festival_ground(ks, fg['w'] - 10, fg['d'] - 10)
ks.pop()
ks.build('stoa_festival', AM, C['stoa'])
dm, dnt = M.new_mat('heliocentric')
if dnt:
    tx = dnt.n('ShaderNodeTexImage'); tx.image = M.image(os.path.join(core.ROOT, 'assets', 'painted', 'heliocentric.png'))
    dnt.link(dnt.n('ShaderNodeUVMap').outputs[0], tx.inputs['Vector'])
    M.finish(dnt, tx.outputs['Color'], 0.8)
Dst = 14.0
m = T(st['x'], st['y'], st['z']) @ Rz(st['ang'])
corners = [(-1.6, -Dst / 2 + 0.66, 3.0), (1.6, -Dst / 2 + 0.66, 3.0), (1.6, -Dst / 2 + 0.66, 5.1), (-1.6, -Dst / 2 + 0.66, 5.1)]
wc = [(m @ np.array([*c_, 1.0]))[:3] for c_ in corners]
pl = core.mesh_from_arrays('heliocentric_panel', np.array(wc), np.array([[0, 1, 2, 3]]), C['stoa'], dm)
uvl = pl.data.uv_layers.new(name='UVMap'); uvl.data.foreach_set('uv', [0, 0, 1, 0, 1, 1, 0, 1])

# ------------------------------------------------------------------ towns, farmsteads
towns = {}
for b in sites['buildings']:
    k = towns.setdefault(b['port'], kit.Kit(bank, seed=hash(b['port']) % 1000))
    k.push(T(b['x'], b['y'], b['z']) @ Rz(b['ang']))
    pl_ = 'plaster_ochre' if rng.random() < 0.4 else 'plaster'
    if b['kind'] == 'court':
        buildings.court_house(k, b['w'], b['d'], pl_, tree=rng.random() < 0.35)
    elif b['kind'] == 'small':
        buildings.small_house(k, b['w'], b['d'], pl_)
    else:
        buildings.store_house(k, b['w'], b['d'], pl_)
    k.pop()
for nm, k in towns.items():
    k.build(f'town_{nm}', AM, C['buildings'])
print('TOWNS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ harbours, landing, ferry, boats
kh = kit.Kit(bank, seed=15)
for q in sites['quays']:
    kh.push(T(q['x'], q['y'], 0) @ Rz(q['ang'])); buildings.quay(kh, q['w'], q['d'], q['z']); kh.pop()
for p in sites['piers']:
    dv = np.array([math.cos(p['ang']), math.sin(p['ang'])])
    stp = np.array([p['x'], p['y']]) - dv * (p['len'] / 2 + 6)
    kh.push(T(stp[0], stp[1], 0) @ Rz(p['ang'])); buildings.mole(kh, p['len'] + 6, p['w'], p['z']); kh.pop()
    bank.add('merchantman', T(*(stp + dv * p['len'] * 0.6), -0.75) @ Rz(p['ang']) @ T(0, (p['w'] / 2 + 2.6) * rng.choice([-1, 1]), 0))
for hb in sites['harbours']:
    out = np.array(hb['out']); tan = np.array([out[1], -out[0]])
    sh = np.array([hb['x'], hb['y']])
    for i in range(6):
        pp = sh + out * rng.uniform(40, 160) + tan * rng.uniform(-120, 120)
        if zf(*pp) < -1.5:
            bank.add(rng.choice(['skiff', 'skiff', 'merchant_sail', 'courier_boat']), T(pp[0], pp[1], -0.45) @ Rz(rng.uniform(0, 6.28)))
    for i in range(30):
        pp = sh - out * rng.uniform(-2, 8) + tan * rng.uniform(-40, 40)
        bank.add(rng.choice(['amphora', 'amphora', 'sack', 'crate', 'pithos']), T(pp[0], pp[1], 2.3) @ Rz(rng.uniform(0, 6.28)))
cl = [hb for hb in sites['harbours'] if hb['name'] == 'couriers'][0]
out = np.array(cl['out'])
rot = math.atan2(out[1], out[0]) - math.pi / 2
kh.push(T(cl['x'], cl['y'], 0) @ Rz(rot)); paxos_bld.courier_landing(kh); kh.pop()
for i, xo in enumerate((-9, 9)):
    for j in range(2):
        pt = T(cl['x'], cl['y'], 0) @ Rz(rot) @ T(xo + (2.6 if j else -2.6), 10 + 9 * i + 5 * j, -0.45) @ Rz(math.pi / 2)
        bank.add('courier_boat', pt)
for f in sites['ferry']:
    o = np.array(f['out']); r_ = math.atan2(o[1], o[0]) - math.pi / 2
    kh.push(T(f['x'], f['y'], 0) @ Rz(r_)); paxos_bld.ferry_stage(kh); kh.pop()
f0 = sites['ferry'][0]; o = np.array(f0['out'])
bank.add('ferry', T(f0['x'] + o[0] * 13, f0['y'] + o[1] * 13, -0.35) @ Rz(math.atan2(o[1], o[0]) + math.pi / 2) @ T(2.4, 0, 0))
kh.build('harbours', AM, C['harbour'])

# ------------------------------------------------------------------ roads and footpaths
rm = road.road_mat()
pm = road.road_mat('footpath', ruts=False, tex='dirt', tint=(0.85, 0.8, 0.7, 1))
paved = sites.get('road_paved', [])
for nm, pts in sites['roads'].items():
    pts = np.array(pts)
    off = np.zeros(len(pts), bool)
    for pv in paved:                                   # where the road runs over paving, the paving is the road
        off |= np.hypot(pts[:, 0] - pv['x'], pts[:, 1] - pv['y']) < pv['r'] - 1.0
    runs, cur = [], []
    for p_, o_ in zip(pts, off):
        if o_:
            if len(cur) > 2: runs.append(np.array(cur))
            cur = []
        else:
            cur.append(p_)
    if len(cur) > 2: runs.append(np.array(cur))
    for i_, run in enumerate(runs):
        road.ribbon(f'road_{nm}_{i_}', run, 5.4, rm, C['terrain'], lift=0.05)
for i, pts in enumerate(sites['paths']):
    road.ribbon(f'path_{i:02d}', np.array(pts), 1.8, pm, C['terrain'], lift=0.04)

bank.build(P, C['instances'])

# ------------------------------------------------------------------ vegetation, clear of floors, steps and walls
floors = solids.Floors.build(F, solids.SOLID_COLLECTIONS)
floors.save(os.path.join(core.BUILD, 'paxos.floors.npz'))
if VEG > 0:
    paxos_veg.vegetate(F, sites, VP, C['veg'], VEG, clear=floors)
core.save_blend(os.path.join(core.BUILD, 'paxos.blend'))
print('SAVED', round(time.time() - t0, 1))
