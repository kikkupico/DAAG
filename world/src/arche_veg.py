"""Arche's plant cover: pine woods in the gullies and on the mid slopes, maquis and phrygana,
olive groves round the three ports, cypresses by the towns and the road, crags and boulders above."""
import numpy as np
from blib.populate import place
from blib.fieldops import blur


def vegetate(F, sites, P, coll, k=1.0):
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
    place('pines', F, pine * ok * k, P['pine'], coll, 0.75, 1.25, tilt=0.04)

    cyp = (1 / 3500) * (alt > 20) * (alt < 520) + (1 / 500) * town * (alt < 140) + (1 / 250) * road_near * np.clip((n2 - 0.6) * 5, 0, 1)
    place('cypresses', F, cyp * ok * (1 - rock) * k, P['cypress'], coll, 0.8, 1.2)

    grove = town * (alt < 110) * (s < 18) * np.clip((n2 - 0.3) * 4, 0, 1)
    olive = (1 / 70) * grove + (1 / 1800) * (alt < 320) * (1 - grove)
    place('olives', F, olive * ok * k, P['olive'], coll, 1.3, 2.0, tilt=0.03)

    maq = (1 / 24) * np.clip((780 - alt) / 220, 0.12, 1) * np.clip((n2 + 0.5 * n3 - 0.35) * 2.5, 0.1, 1) * (1 - rock) * (1 - 0.7 * grove)
    place('lentisk', F, maq * 0.65 * ok * k, P['lentisk'], coll, 0.7, 1.4, tilt=0.08)
    place('maquis', F, maq * 0.35 * ok * k, P['maquis_ph'], coll, 0.8, 1.5, tilt=0.06)

    thy = (1 / 30) * (0.5 + 3.5 * np.clip((alt - 250) / 400, 0, 1)) * (1 - 0.6 * rock) * np.clip(n3 + 0.3, 0, 1)
    place('thyme', F, thy * ok * k, P['thyme'], coll, 0.7, 1.6, tilt=0.1)

    grass = (1 / 14) * (alt < 350) * (s < 26) * np.clip((n3 - 0.4) * 3, 0, 1) * (1 - 0.5 * grove)
    place('grass', F, grass * ok * k * 0.6, P['grass'], coll, 1.2, 2.5, tilt=0.1)

    # cut-and-fill banks grow back with dry grass and thyme, right down to the levelled ground (excl's blur would
    # leave them bare)
    bank = M['cut'] * land * (1 - np.clip(M['road'] + M['built'] + M['quay'] + M['clearing'], 0, 1)) * (1 - rock)
    bn = np.clip(0.45 + n3, 0.5, 1)
    place('bank_grass', F, 2.5 * bank * bn * k, P['grass_bank'], coll, 1.5, 3.0, tilt=0.15, sink=0.1)
    place('bank_thyme', F, (1 / 7) * bank * bn * k, P['thyme'], coll, 0.7, 1.5, tilt=0.1)

    bould = (1 / 90) * rock + (1 / 900) * (alt > 150) + (1 / 400) * np.clip((alt - 500) / 200, 0, 1)
    place('boulders', F, bould * land * (1 - excl) * k, P['boulder'], coll, 0.6, 2.8, tilt=0.6, sink=0.5)
