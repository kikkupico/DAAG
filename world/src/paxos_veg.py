"""Paxos's plant cover: pines and maquis on the high arms, olive terraces round the towns and on the
bay slopes, olive groves and cypresses across the scholars' coast, garrigue on the dry hilltops."""
import numpy as np
from blib.populate import place
from blib.fieldops import blur


def layers(F, sites):
    """Density maps (plants per square metre) for each layer, in placing order, with how each is placed.
    'detail' layers are left out of the build and only drawn near a camera (blib/detail.py); 'more' is how
    many times the built density a layer reaches close to the camera, and it is added out to where a thing
    'size' metres tall shrinks to 'px' pixels. Shrubs reach the horizon, since a hillside's colour is how
    much of it they cover; grass, thyme and stones fade once they are a pixel or two. 'r' is a layer's footprint
    radius: nothing is placed whose footprint touches a floor, step or wall (blib/solids.py)."""
    h, s, wet, M = F.h, F.slope, F.wet, F.masks
    land = (h > 1.2).astype(np.float32)
    excl = np.clip(M['road'] + M['built'] + M['quay'] + M['sand'] + M['path'] * 0.8, 0, 1)
    excl = np.clip(blur(excl, 2, 1) * 3, 0, 1)
    ok = land * (1 - excl)
    okc = ok * (1 - M['clearing'])
    # the Chamber and the Tholos look at each other across the bay: no tall tree on the line between them
    ax, ay = sites['chamber']['x'], sites['chamber']['y']; bx, by = sites['tholos']['x'], sites['tholos']['y']
    Xg, Yg = F.xs[None, :], F.ys[:, None]
    dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
    tt = np.clip(((Xg - ax) * dx + (Yg - ay) * dy) / L2, 0, 1)
    sight = (np.hypot(Xg - (ax + tt * dx), Yg - (ay + tt * dy)) < 16).astype(np.float32)
    okc = okc * (1 - sight)
    rock = np.clip((s - 40) / 12, 0, 1)
    n1 = F.noise(420, 11); n2 = F.noise(100, 12); n3 = F.noise(45, 13)
    towns = [(hb['x'], hb['y']) for hb in sites['harbours'][:2]] + [(sites['chamber']['x'], sites['chamber']['y']), (sites['tholos']['x'], sites['tholos']['y'])]
    town = F.near(towns, 700)
    libs = F.near([(l['x'], l['y']) for l in sites['libraries']], 140)
    north = np.clip((F.ys[:, None] - 500) / 400, 0, 1) * np.ones_like(h)        # the arms
    body = 1 - north
    alt = h
    pine = (1 / 150) * north * np.clip((alt - 40) / 60, 0, 1) * np.clip((n1 - 0.35) * 3, 0.08, 1) * (0.4 + 1.4 * wet) * (1 - 0.8 * rock) * (1 - 0.8 * town)
    pine += (1 / 900) * body * np.clip((n1 - 0.55) * 4, 0, 1)
    L = []
    L.append(dict(name='pines', d=pine * okc, proto='pine', r=0.8, smin=0.75, smax=1.25, tilt=0.04))
    grove = np.clip(town * 1.3, 0, 1) * (alt < 160) * (s < 22) * np.clip((n2 - 0.25) * 4, 0, 1)
    grove = np.maximum(grove, body * (alt < 150) * (s < 16) * np.clip((n1 - 0.42) * 4, 0, 1))
    grove = np.maximum(grove, libs * 0.9)
    olive = (1 / 75) * grove + (1 / 1400) * (alt < 260) * (1 - grove)
    L.append(dict(name='olives', d=olive * okc, proto='olive', r=0.8, smin=1.3, smax=2.1, tilt=0.03))
    cyp = (1 / 2600) * (alt > 10) + (1 / 380) * np.clip(town + libs, 0, 1) * np.clip((n2 - 0.5) * 4, 0, 1)
    L.append(dict(name='cypresses', d=cyp * okc * (1 - rock), proto='cypress', r=0.6, smin=0.8, smax=1.25))
    maq = (1 / 25) * np.clip((n2 + 0.5 * n3 - 0.3) * 2.5, 0.12, 1) * (1 - rock) * (1 - 0.75 * grove)
    L.append(dict(name='lentisk', d=maq * 0.65 * okc, proto='lentisk', r=0.8, smin=0.7, smax=1.4, tilt=0.08, more=3, size=1.2, px=0.25, near=20))
    L.append(dict(name='maquis', d=maq * 0.35 * okc, proto='maquis_ph', r=0.8, smin=0.8, smax=1.5, tilt=0.06, more=3, size=1.2, px=0.25, near=20))
    thy = (1 / 34) * (0.6 + 1.6 * np.clip((alt - 120) / 140, 0, 1)) * (1 - 0.6 * rock) * np.clip(n3 + 0.3, 0, 1)
    L.append(dict(name='thyme', d=thy * ok, proto='thyme', r=0.35, smin=0.7, smax=1.6, tilt=0.1, more=6, size=0.4, px=1.0, near=1.5))
    grass = (1 / 14) * (alt < 200) * (s < 24) * np.clip((n3 - 0.38) * 3, 0, 1)
    L.append(dict(name='grass', d=grass * ok, post=0.6, proto='grass', r=0.35, smin=1.2, smax=2.5, tilt=0.1, more=10, size=0.4, px=1.0, near=1.0))
    bould = (1 / 90) * rock + (1 / 1100) * (alt > 60)
    L.append(dict(name='boulders', d=bould * land * (1 - excl), proto='boulder', r=1.2, smin=0.6, smax=2.8, tilt=0.6, sink=0.5))
    # stones and small rocks, too small to place island-wide: thick on rocky slopes and the dry tops, a scatter
    # elsewhere, few on the levelled clearings round the buildings and terraces
    stony = np.maximum(rock, M['rock']) * (1 - 0.5 * M['cut'])
    dry = np.clip((alt - 80) / 120, 0, 1)
    ground = land * (1 - excl) * (1 - 0.8 * M['clearing'])
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
