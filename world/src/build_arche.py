"""Assemble Arche and save build/arche.blend.
blender -b -P src/build_arche.py -- [veg_density]"""
import sys, os, math, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import numpy as np
from blib import core, world, populate, kit, buildings, protos_arch, props, mountain, road, scatter
from blib.kit import T, Rz, Rx, Ry, S
import arche_veg

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
VEG = float(argv[0]) if argv else 1.0
t0 = time.time()
s = core.reset()

# ------------------------------------------------------------------ ground, sea
C = {n: core.collection(n) for n in ('terrain', 'buildings', 'harbour', 'mountain', 'veg', 'props', 'instances')}
ter, meta, sites = world.terrain('arche', C['terrain'], pixel=1.0)
d, meta, H, sites = world.load_terrain_data('arche')
world.sea(meta, os.path.join(core.BUILD, 'terrain', 'arche', 'height.exr'), C['terrain'])
F = populate.Field(d, meta, H, step=2)
zf = lambda x, y: float(F.z(np.array([x]), np.array([y]))[0])

# ------------------------------------------------------------------ materials and prototypes
AM = props.prop_mats(buildings.arch_mats())
AM['wallrock'] = buildings.M.stone('wallrock', 'rock_boulder_dry', (0.6, 0.58, 0.54, 1), 1.6, bump=1.2)
AM['canvas'] = buildings.M.linen('canvas', (0.6, 0.56, 0.47, 1))
P = {}
P.update(protos_arch.build_all(AM))
P.update(props.build_all(AM))
P.update(mountain.build_rock_protos(AM))
VP = populate.build_protos()
P['court_tree'] = VP['olive']
c = scatter.proto_collection('p_basket')
populate._ph('wicker_basket_02', c, join=True)
P['basket'] = c
scatter.hide_protos()
bank = kit.Bank()
rng = np.random.default_rng(42)
print('PROTOS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ the three houses and their towns
towns = {}
for b in sites['buildings']:
    port = b['port']
    k = towns.setdefault(port, kit.Kit(bank, seed=port))
    k.push(T(b['x'], b['y'], b['z']) @ Rz(b['ang']))
    kind = b['kind']
    pl = 'plaster_ochre' if rng.random() < 0.35 else 'plaster'
    if kind == 'house_range':
        info = buildings.house_range(k, b['w'], b['d'], house=b['house'], board_filled={1: 2, 2: 4, 3: 3}[b['house']])
        b['info'] = info
    elif kind == 'court':
        buildings.court_house(k, b['w'], b['d'], pl, tree=rng.random() < 0.3)
    elif kind == 'small':
        buildings.small_house(k, b['w'], b['d'], pl)
    elif kind == 'store':
        buildings.store_house(k, b['w'], b['d'], pl)
    elif kind == 'press_house':
        buildings.press_house(k, b['w'], b['d'])
    elif kind == 'customs_seat':
        buildings.small_civic(k, b['w'], b['d'], porch=True)
    k.pop()
for port, k in towns.items():
    k.build(f'town_{port}', AM, C['buildings'])
print('TOWNS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ harbours, ships, nets, cargo
kh = kit.Kit(bank, seed=9)
for q in sites['quays']:
    kh.push(T(q['x'], q['y'], 0) @ Rz(q['ang'])); buildings.quay(kh, q['w'], q['d'], q['z']); kh.pop()
for p in sites['piers']:
    dvec = np.array([math.cos(p['ang']), math.sin(p['ang'])])
    st = np.array([p['x'], p['y']]) - dvec * p['len'] / 2 - dvec * 6
    kh.push(T(st[0], st[1], 0) @ Rz(p['ang'])); buildings.mole(kh, p['len'] + 6, p['w'], p['z']); kh.pop()
    # a merchantman alongside the mole
    side = rng.choice([-1, 1])
    m = T(*(st + dvec * (p['len'] * 0.55)), -0.75) @ Rz(p['ang'] + math.pi * rng.integers(0, 2)) @ T(0, side * (p['w'] / 2 + 2.6), 0)
    bank.add('merchantman', m)
for sl in sites['slipways']:
    dvec = np.array([math.cos(sl['ang']), math.sin(sl['ang'])])
    st = np.array([sl['x'], sl['y']]) - dvec * 16
    zt = zf(*st)
    kh.push(T(st[0], st[1], 0) @ Rz(sl['ang'])); buildings.slipway(kh, sl['len'], sl['w'], z_top=max(1.6, zt), z_low=-1.6); kh.pop()
    # a ship hauled up on the ways
    pitch = math.atan2(max(1.6, zt) + 1.6, sl['len'])
    bank.add('merchantman', T(*(st + dvec * 10), max(1.6, zt) - 10 * math.tan(pitch) + 0.15) @ Rz(sl['ang'] + math.pi) @ Ry(-pitch) @ S(0.85))
for port, pinfo in sites['ports'].items():
    b_ = pinfo['bearing']; Rb = pinfo['Rb']
    out = np.array([math.sin(b_), math.cos(b_)]); tan = np.array([math.cos(b_), -math.sin(b_)])
    # boats riding in the bay, skiffs drawn up at the water's edge, nets drying
    for i in range(7):
        pp = out * (Rb + rng.uniform(40, 170)) + tan * rng.uniform(-150, 150)
        if zf(*pp) < -1.5:
            bank.add(rng.choice(['skiff', 'skiff', 'courier_boat', 'merchant_sail']) if i else 'merchantman', T(pp[0], pp[1], -0.45) @ Rz(rng.uniform(0, 6.28)))
    for i in range(6):
        v = rng.uniform(-120, 120)
        if abs(v) < 70:
            continue
        pp = out * (Rb + 4) + tan * v
        bank.add('skiff', T(pp[0], pp[1], max(0.2, zf(*pp)) - 0.2) @ Rz(-b_ + math.pi / 2 + rng.normal(0, 0.3)))
    for i in range(3):
        pp = out * (Rb - 9) + tan * rng.uniform(-60, 60)
        bank.add('nets', T(pp[0], pp[1], zf(*pp)) @ Rz(-b_ + rng.normal(0, 0.2)))
    for i in range(40):
        pp = out * (Rb - rng.uniform(-2, 8)) + tan * rng.uniform(-60, 60)
        kind = rng.choice(['amphora', 'amphora', 'sack', 'crate', 'pithos'])
        bank.add(kind, T(pp[0], pp[1], 2.3) @ Rz(rng.uniform(0, 6.28)))
kh.build('harbours', AM, C['harbour'])
print('HARBOURS', round(time.time() - t0, 1))

# ------------------------------------------------------------------ the ring road, parapets, carts in file
rd = np.array(sites['road'])
road.ribbon('ring_road', rd, 6.6, road.road_mat(), C['terrain'], lift=0.05)
kp = kit.Kit(bank, seed=5)
for run in road.parapet_points(rd[::2], zf, side_drop=2.5, offset=3.7):
    for a_, b_ in zip(run[:-1], run[1:]):
        kp.beam('rubble', (a_[0], a_[1], a_[2] + 0.3), (b_[0], b_[1], b_[2] + 0.3), 0.5, 0.75, 0.08)
dvec = np.gradient(rd[:, :2], axis=0); dvec /= np.linalg.norm(dvec, axis=1, keepdims=True)
nrm = np.stack([-dvec[:, 1], dvec[:, 0]], 1)
# carts standing in file, those in one lane facing one way and those in the other the other way
for start in range(150, len(rd) - 150, 90):
    if any(math.hypot(rd[start, 0] - p_['x'], rd[start, 1] - p_['y']) < 450 for p_ in sites['ports'].values()):
        continue
    for lane in (-1, 1):
        for j in range(int(rng.integers(1, 4))):
            i = int(start + lane * (j * 4 + 2) + (0 if lane > 0 else 8))
            i = max(0, min(len(rd) - 1, i))
            p = rd[i, :2] + nrm[i] * lane * 1.6
            ang = math.atan2(dvec[i, 1], dvec[i, 0]) + (0 if lane > 0 else math.pi)
            bank.add(rng.choice(['cart', 'cart', 'handcart']), T(p[0], p[1], rd[i, 2] + 0.08) @ Rz(ang))
kp.build('parapets', AM, C['terrain'])

# ------------------------------------------------------------------ the rock-cut storehouse, sundials
g = sites['granary']
kg = kit.Kit(bank, seed=6)
kg.push(T(g['x'], g['y'], g['z']) @ Rz(g['ang'])); buildings.granary(kg); kg.pop()
for sd in sites['sundials']:
    kg.push(T(sd['x'], sd['y'], sd['z']) @ Rz(rng.uniform(0, 6))); buildings.sundial(kg, sd['platform']); kg.pop()
kg.build('granary_sundials', AM, C['buildings'])

# ------------------------------------------------------------------ Mount Phyle: crown, posts, camps
km = kit.Kit(bank, seed=7)
cr = sites['crown']
km.push(T(cr['x'], cr['y'], cr['z']))
mountain.ring_wall(km, cr['wall_r'])
mountain.crown_interior(km, cr['wall_r'])
km.pop()
for p in sites['posts']:
    km.push(T(p['x'], p['y'], p['z']) @ Rz(-p['facing'])); mountain.post(km, p['facing']); km.pop()
for cp in sites['camps']:
    km.push(T(cp['x'], cp['y'], cp['z']) @ Rz(math.pi / 2 - cp['bearing'])); mountain.camp(km); km.pop()
km.build('mountain_sites', AM, C['mountain'])
print('MOUNTAIN', round(time.time() - t0, 1))

# ------------------------------------------------------------------ vegetation
if VEG > 0:
    arche_veg.vegetate(F, sites, VP, C['veg'], VEG)

bank.build(P, C['instances'])
print('BUILD DONE', round(time.time() - t0, 1))
import json
json.dump({k_: v for k_, v in sites.items()}, open(os.path.join(core.BUILD, 'arche_sites_built.json'), 'w'), default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
core.save_blend(os.path.join(core.BUILD, 'arche.blend'))
print('SAVED', round(time.time() - t0, 1))
