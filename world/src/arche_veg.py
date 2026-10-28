"""Arche's plant cover: pine woods in the gullies and on the mid slopes, maquis and phrygana,
olive groves round the three ports, cypresses by the towns and the road, crags and boulders above."""
import numpy as np
from blib.populate import place
from blib.fieldops import blur


def layers(F, sites):
    """Density maps (plants per square metre) for each layer, in placing order, with how each is placed.
    'detail' layers are left out of the build and only drawn near a camera (blib/detail.py); 'more' is how
    many times the built density a layer reaches close to the camera, and it is added out to where a thing
    'size' metres tall shrinks to 'px' pixels. 'r' is a layer's footprint radius: nothing is placed whose
    footprint touches a floor, step or wall (blib/solids.py)."""
    h, s, wet, M = F.h, F.slope, F.wet, F.masks
    land = (h > 1.2).astype(np.float32)
    excl = np.clip(M['road'] + M['built'] + M['quay'] + M['sand'] + M['clearing'], 0, 1)
    excl = np.clip(blur(excl, 2, 1) * 3, 0, 1)
    ok = land * (1 - excl)
    rock = np.clip((s - 42) / 12, 0, 1)
    n1 = F.noise(380, 1); n2 = F.noise(90, 2); n3 = F.noise(40, 3)
    ports = [(p['x'], p['y']) for p in sites['ports'].values()]
    town = F.near(ports, 650)
    road_near = np.clip(blur(M['road'], 6, 2) * 4, 0, 1) * (1 - M['road'])

    alt = h
    pine = (1 / 160) * np.clip((alt - 50) / 60, 0, 1) * np.clip((760 - alt) / 120, 0, 1)
    pine *= (0.25 + 1.6 * wet) * np.clip((n1 - 0.38) * 3, 0.05, 1) * (1 - rock * 0.85) * (1 - 0.8 * town)
    L = []
    L.append(dict(name='pines', d=pine * ok, proto='pine', r=0.8, smin=0.75, smax=1.25, tilt=0.04))

    cyp = (1 / 3500) * (alt > 20) * (alt < 520) + (1 / 500) * town * (alt < 140) + (1 / 250) * road_near * np.clip((n2 - 0.6) * 5, 0, 1)
    L.append(dict(name='cypresses', d=cyp * ok * (1 - rock), proto='cypress', r=0.6, smin=0.8, smax=1.2))

    grove = town * (alt < 110) * (s < 18) * np.clip((n2 - 0.3) * 4, 0, 1)
    olive = (1 / 70) * grove + (1 / 1800) * (alt < 320) * (1 - grove)
    L.append(dict(name='olives', d=olive * ok, proto='olive', r=0.8, smin=1.3, smax=2.0, tilt=0.03))

    maq = (1 / 24) * np.clip((780 - alt) / 220, 0.12, 1) * np.clip((n2 + 0.5 * n3 - 0.35) * 2.5, 0.1, 1) * (1 - rock) * (1 - 0.7 * grove)
    L.append(dict(name='lentisk', d=maq * 0.65 * ok, proto='lentisk', r=0.8, smin=0.7, smax=1.4, tilt=0.08, more=3, size=1.2, px=0.25, near=20))
    L.append(dict(name='maquis', d=maq * 0.35 * ok, proto='maquis_ph', r=0.8, smin=0.8, smax=1.5, tilt=0.06, more=3, size=1.2, px=0.25, near=20))

    thy = (1 / 30) * (0.5 + 3.5 * np.clip((alt - 250) / 400, 0, 1)) * (1 - 0.6 * rock) * np.clip(n3 + 0.3, 0, 1)
    L.append(dict(name='thyme', d=thy * ok, proto='thyme', r=0.35, smin=0.7, smax=1.6, tilt=0.1, more=6, size=0.4, px=1.0, near=1.5))

    grass = (1 / 14) * (alt < 350) * (s < 26) * np.clip((n3 - 0.4) * 3, 0, 1) * (1 - 0.5 * grove)
    L.append(dict(name='grass', d=grass * ok, post=0.6, proto='grass', r=0.35, smin=1.2, smax=2.5, tilt=0.1, more=10, size=0.4, px=1.0, near=1.0))

    # cut-and-fill banks grow back with dry grass and thyme, right down to the levelled ground (excl's blur would
    # leave them bare)
    bank = M['cut'] * land * (1 - np.clip(M['road'] + M['built'] + M['quay'] + M['clearing'], 0, 1)) * (1 - rock)
    bn = np.clip(0.45 + n3, 0.5, 1)
    L.append(dict(name='bank_grass', d=2.5 * bank * bn, proto='grass_bank', r=0.35, smin=1.5, smax=3.0, tilt=0.15, sink=0.1))
    L.append(dict(name='bank_thyme', d=(1 / 7) * bank * bn, proto='thyme', r=0.35, smin=0.7, smax=1.5, tilt=0.1))

    bould = (1 / 90) * rock + (1 / 900) * (alt > 150) + (1 / 400) * np.clip((alt - 500) / 200, 0, 1)
    L.append(dict(name='boulders', d=bould * land * (1 - excl), proto='boulder', r=1.2, smin=0.6, smax=2.8, tilt=0.6, sink=0.5))
    # stones and small rocks, too small to place island-wide: thick on the crags and the high slopes, a scatter
    # lower down, few in the groves
    stony = np.maximum(rock, M['rock']) * (1 - 0.5 * M['cut'])
    dry = np.clip((alt - 150) / 250, 0, 1)
    ground = land * (1 - excl)
    L.append(dict(name='stones', d=(0.8 + 1.2 * dry + 6.0 * stony) * (1 - 0.5 * grove) * ground, proto='stones', r=0.1,
                  smin=0.8, smax=2.2, tilt=0.25, sink=0.015, sink_scales=True, radius=0.05, detail=True, size=0.12, px=2.0, near=0.5))
    L.append(dict(name='rocks', d=(0.06 + 0.12 * dry + 1.1 * stony) * (1 - 0.6 * grove) * ground, proto='rocks', r=0.3,
                  smin=0.8, smax=3.2, tilt=0.25, sink=0.03, sink_scales=True, radius=0.1, detail=True, size=0.35, px=2.0, near=1.0))
    return L


def vegetate(F, sites, P, coll, k=1.0, clear=None):
    """clear: a solids.Floors; no plant or boulder whose footprint (radius 'r') touches a floor, step or wall."""
    for l in layers(F, sites):
        if not l.get('detail'):
            place(l['name'], F, l['d'] * k * l.get('post', 1.0), P[l['proto']], coll, l['smin'], l['smax'],
                  tilt=l.get('tilt', 0.0), sink=l.get('sink', 0.2), clear=clear, r=l['r'])
