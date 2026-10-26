"""Camera shots for Arche, computed from the generated site data."""
import json, math, os
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
D = os.path.join(ROOT, 'build', 'terrain', 'arche')
SITES = json.load(open(os.path.join(D, 'sites.json')))
META = json.load(open(os.path.join(D, 'meta.json')))
H = np.load(os.path.join(D, 'height.npy'), mmap_mode='r')


def gz(x, y):
    px = META['px']
    j = int(round((x - META['x0']) / px)); i = int(round((META['y0'] - y) / px))
    i = min(max(i, 0), META['N'] - 1); j = min(max(j, 0), META['N'] - 1)
    return float(max(0.0, H[i, j]))


def port(k):
    p = SITES['ports'][str(k)]
    b = p['bearing']
    out = np.array([math.sin(b), math.cos(b)]); tan = np.array([math.cos(b), -math.sin(b)])
    return np.array([p['x'], p['y']]), out, tan, b


def at(k, u, v, z):
    c, out, tan, b = port(k)
    q = c - out * u + tan * v
    return (float(q[0]), float(q[1]), float(z))


def deg(b):
    return math.degrees(b) % 360


def shots():
    S = {}
    S['arche_overview_golden'] = dict(cam=(2100, -6900, 2300), target=(0, -250, 150), lens=33, light='golden', sun_from=255, hazeS=0.16, hazeD=50000)
    S['arche_overview_overcast'] = dict(cam=(-6200, -3300, 1700), target=(0, 0, 200), lens=33, light='overcast', sun_from=200, hazeS=0.28, hazeD=30000)
    c3, o3, t3, b3 = port(3)
    S['port3_aerial'] = dict(cam=at(3, -330, -260, 150), target=at(3, 60, 10, 0), lens=32, light='morning', sun_from=deg(b3) + 40)
    S['house3_portico'] = dict(cam=at(3, 19.5, 22, 4.4), target=at(3, 27, -6, 2.8), lens=24, light='morning', sun_from=deg(b3) - 30)
    board_v = -31 + 13 + 5.2 + 1.35
    S['house3_board'] = dict(cam=at(3, 27.2, board_v + 0.8, 5.05), target=at(3, 29.7, board_v, 5.15), lens=40, light='morning',
                             sun_from=deg(b3) - 30, dof=(3.0, 4.0))
    c2, o2, t2, b2 = port(2)
    S['port2_aerial'] = dict(cam=at(2, -260, 300, 170), target=at(2, 50, 40, 0), lens=30, light='golden', sun_from=300)
    g = SITES['granary']
    gx, gy = g['x'], g['y']
    face = np.array([math.sin(g['face']), math.cos(g['face'])])
    tan = np.array([math.cos(g['face']), -math.sin(g['face'])])
    cp = np.array([gx, gy]) + face * 16 + tan * 9
    S['granary'] = dict(cam=(float(cp[0]), float(cp[1]), max(g['z'] + 2.2, gz(*cp) + 1.8)), target=(gx, gy, g['z'] + 2.0), lens=28, light='overcast', sun_from=200)
    # the ring road on the cliffs, south-west stretch
    rd = np.array(SITES['road'])
    best = None
    for i in range(0, len(rd) - 80, 25):
        p = rd[i]; q = rd[i + 40]
        dv = (q[:2] - p[:2])
        if np.linalg.norm(dv) < 1:
            continue
        dv /= np.linalg.norm(dv)
        nrm = np.array([-dv[1], dv[0]])
        for sd_ in (-1, 1):
            drop = p[2] - gz(*(p[:2] + nrm * sd_ * 30))
            r_, b_ = math.hypot(p[0], p[1]), math.degrees(math.atan2(p[0], p[1])) % 360
            if 180 < b_ < 230 and (best is None or drop > best[0]):
                best = (drop, i)
    i = best[1]
    p = rd[i]; q = rd[i + 60]
    dv = (q[:2] - p[:2]); dv /= np.linalg.norm(dv)
    nrm = np.array([-dv[1], dv[0]])
    side = 1 if gz(*(p[:2] + nrm * 25)) < p[2] else -1
    cam = p[:2] - dv * 30 + nrm * side * 14
    cam = p[:2] - dv * 30 + nrm * side * 55        # out over the sea, looking back along the cliff shelf
    S['ring_road'] = dict(cam=(float(cam[0]), float(cam[1]), float(p[2] + 14)), target=(float(q[0] - nrm[0] * side * 4), float(q[1] - nrm[1] * side * 4), float(q[2]) - 6), lens=24,
                          light='late', sun_from=250)
    p_ = at(1, 69, -60, 0); p2 = at(1, 69, 40, 0)
    S['town1_street'] = dict(cam=(p_[0], p_[1], gz(p_[0], p_[1]) + 1.7), target=(p2[0], p2[1], gz(p2[0], p2[1]) + 2.5), lens=26, light='late', sun_from=deg(port(1)[3]) + 70)
    cr = SITES['crown']
    S['crown_aerial'] = dict(cam=(cr['x'] + 18, cr['y'] - 21, cr['z'] + 17), target=(cr['x'], cr['y'], cr['z'] + 1), lens=30, light='dusk', sun_from=270)
    S['crown_inside'] = dict(cam=(cr['x'] + 4.0, cr['y'] - 2.0, cr['z'] + 2.0), target=(cr['x'] - 6.0, cr['y'] + 3.0, cr['z'] + 0.9), lens=24, light='dusk', sun_from=270)
    po = SITES['posts'][0]
    fo = np.array([math.sin(po['facing']), math.cos(po['facing'])])
    c_ = np.array([po['x'], po['y']]) + fo * 8.5 + np.array([fo[1], -fo[0]]) * 3
    S['slope_post'] = dict(cam=(float(c_[0]), float(c_[1]), max(po['z'], gz(*c_)) + 1.6), target=(po['x'], po['y'], po['z'] + 1.2), lens=26,
                           light='golden', sun_from=deg(po['facing']) + 60)
    cmp_ = SITES['camps'][0]
    fo = np.array([math.sin(cmp_['bearing']), math.cos(cmp_['bearing'])])
    tn = np.array([fo[1], -fo[0]])
    c_ = np.array([cmp_['x'], cmp_['y']]) + fo * 6.5 + tn * 2.5
    S['camp_north'] = dict(cam=(float(c_[0]), float(c_[1]), max(cmp_['z'], gz(*c_)) + 1.6), target=(cmp_['x'] + fo[0], cmp_['y'] + fo[1], cmp_['z'] + 0.7), lens=30, light='dusk', sun_from=290)
    sd = [x for x in SITES['sundials'] if x['platform']][0]
    S['sundial_cape'] = dict(cam=(sd['x'] + 9, sd['y'] - 6, sd['z'] + 2.5), target=(sd['x'], sd['y'], sd['z'] + 1.0), lens=28, light='golden', sun_from=250)
    return S
