"""Paxos's plant cover: pines and maquis on the high arms, olive terraces round the towns and on the
bay slopes, olive groves and cypresses across the scholars' coast, garrigue on the dry hilltops."""
import numpy as np
from blib.populate import place
from blib.fieldops import blur


def vegetate(F, sites, P, coll, k=1.0):
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
    place('pines', F, pine * okc * k, P['pine'], coll, 0.75, 1.25, tilt=0.04)
    grove = np.clip(town * 1.3, 0, 1) * (alt < 160) * (s < 22) * np.clip((n2 - 0.25) * 4, 0, 1)
    grove = np.maximum(grove, body * (alt < 150) * (s < 16) * np.clip((n1 - 0.42) * 4, 0, 1))
    grove = np.maximum(grove, libs * 0.9)
    olive = (1 / 75) * grove + (1 / 1400) * (alt < 260) * (1 - grove)
    place('olives', F, olive * okc * k, P['olive'], coll, 1.3, 2.1, tilt=0.03)
    cyp = (1 / 2600) * (alt > 10) + (1 / 380) * np.clip(town + libs, 0, 1) * np.clip((n2 - 0.5) * 4, 0, 1)
    place('cypresses', F, cyp * okc * (1 - rock) * k, P['cypress'], coll, 0.8, 1.25)
    maq = (1 / 25) * np.clip((n2 + 0.5 * n3 - 0.3) * 2.5, 0.12, 1) * (1 - rock) * (1 - 0.75 * grove)
    place('lentisk', F, maq * 0.65 * okc * k, P['lentisk'], coll, 0.7, 1.4, tilt=0.08)
    place('maquis', F, maq * 0.35 * okc * k, P['maquis_ph'], coll, 0.8, 1.5, tilt=0.06)
    thy = (1 / 34) * (0.6 + 1.6 * np.clip((alt - 120) / 140, 0, 1)) * (1 - 0.6 * rock) * np.clip(n3 + 0.3, 0, 1)
    place('thyme', F, thy * ok * k, P['thyme'], coll, 0.7, 1.6, tilt=0.1)
    grass = (1 / 14) * (alt < 200) * (s < 24) * np.clip((n3 - 0.38) * 3, 0, 1)
    place('grass', F, grass * ok * k * 0.6, P['grass'], coll, 1.2, 2.5, tilt=0.1)
    bould = (1 / 90) * rock + (1 / 1100) * (alt > 60)
    place('boulders', F, bould * land * (1 - excl) * k, P['boulder'], coll, 0.6, 2.8, tilt=0.6, sink=0.5)
