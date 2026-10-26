"""Camera shots for Paxos, computed from the generated site data."""
import json, math, os
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
D = os.path.join(ROOT, 'build', 'terrain', 'paxos')
SITES = json.load(open(os.path.join(D, 'sites.json')))
META = json.load(open(os.path.join(D, 'meta.json')))
H = np.load(os.path.join(D, 'height.npy'), mmap_mode='r')


def gz(x, y):
    px = META['px']
    j = int(round((x - META['x0']) / px)); i = int(round((META['y0'] - y) / px))
    i = min(max(i, 0), META['N'] - 1); j = min(max(j, 0), META['N'] - 1)
    return float(max(0.0, H[i, j]))


def pol(c, a, r, z):
    return (float(c[0] + r * math.cos(a)), float(c[1] + r * math.sin(a)), float(z))


def loc(site, ang, x, y, z):
    """Point in a building's local frame (rotation ang about z) to world."""
    c, s = math.cos(ang), math.sin(ang)
    return (float(site['x'] + x * c - y * s), float(site['y'] + x * s + y * c), float(site['z'] + z))


def deg(a):
    return (90 - math.degrees(a)) % 360      # math angle -> compass bearing


def shots():
    S = {}
    ch = SITES['chamber']; th = SITES['tholos']; ora = SITES['oracle']
    face = math.atan2(th['y'] - ch['y'], th['x'] - ch['x'])
    C = (ch['x'], ch['y'])
    S['paxos_overview'] = dict(cam=(3200, -11800, 8200), target=(-200, 300, 0), lens=36, light='late', sun_from=245, hazeS=0.25, hazeD=40000)
    S['paxos_bay_dawn'] = dict(cam=(2600, 3400, 420), target=(-1100, 3000, 60), lens=38, light='golden', sun_from=95, hazeS=0.35, hazeD=20000)
    # from above and behind the Tholos, over its roof and across the bay to the Chamber
    fw = np.array([math.cos(th['face']), math.sin(th['face'])])
    cpos = np.array([th['x'], th['y']]) - fw * 34
    tg = np.array([th['x'], th['y']]) + fw * 160
    S['bay_chamber_to_tholos'] = dict(cam=(float(cpos[0]), float(cpos[1]), th['z'] + 30), target=(float(tg[0]), float(tg[1]), 0.0), lens=16, light='late', sun_from=200)
    a = face + 0.75
    S['chamber_exterior'] = dict(cam=pol(C, a, 31, ch['z'] + 1.9), target=(ch['x'], ch['y'], ch['z'] + 6.5), lens=26, light='late', sun_from=deg(a) + 50)
    S['chamber_aerial'] = dict(cam=pol(C, face + 2.4, 75, ch['z'] + 45), target=(ch['x'], ch['y'], ch['z'] + 4), lens=35, light='golden', sun_from=deg(face) + 120)
    zs = ch['z'] + 1.02
    # stand south of the centre and look north along the bronze meridian line to the pool of noon light
    S['chamber_interior'] = dict(cam=(ch['x'] + 0.7, ch['y'] - 7.0, zs + 2.3), target=(ch['x'] - 0.1, ch['y'] + 4.0, zs + 0.5),
                                 lens=17, light='noon', sun_from=180, light_override=dict(exposure=-0.9), samples=384,
                                 lights=[dict(type='SPOT', loc=(ch['x'], ch['y'] - 1.0, zs + 12.6), at=(ch['x'], ch['y'] + 4.5, zs), energy=5000, cone=10, soft=0.3, color=(1.0, 0.88, 0.7)),
                                         dict(type='AREA', loc=pol(C, face, 8.2, zs + 2.2), at=(ch['x'], ch['y'], zs + 1.0), energy=2000, size=2.2, size_y=4.0, color=(1.0, 0.88, 0.72)),
                                         dict(type='AREA', loc=(ch['x'], ch['y'], zs + 9.5), at=(ch['x'], ch['y'], zs), energy=900, size=10, disk=True, color=(0.95, 0.9, 0.85))])
    T_ = (th['x'], th['y'])
    a = th['face'] + 0.45
    S['tholos_exterior'] = dict(cam=pol(T_, a, 21, th['z'] + 1.9), target=(th['x'], th['y'], th['z'] + 4.5), lens=24, light='morning', sun_from=deg(th['face']) + 60)
    hs_ = [h for h in SITES['harbours'] if h['name'] == 'schedia'][0]
    mid_ = ((th['x'] + hs_['x']) / 2, (th['y'] + hs_['y']) / 2)
    S['tholos_schedia'] = dict(cam=(hs_['x'] + 420, hs_['y'] - 900, 170), target=(mid_[0], mid_[1], 120), lens=34, light='morning', sun_from=deg(th['face']) + 90)
    a = th['face'] + math.pi * 0.92
    S['tholos_interior'] = dict(cam=pol(T_, a, 6.6, th['z'] + 0.6 + 1.7), target=(th['x'] + 1.0 * math.cos(th['face']), th['y'] + 1.0 * math.sin(th['face']), th['z'] + 1.2),
                                lens=18, light='morning', sun_from=deg(th['face']) + 10, light_override=dict(exposure=0.4), samples=384,
                                lights=[dict(type='SPOT', loc=(th['x'], th['y'], th['z'] + 11.5), at=(th['x'] + 0.6, th['y'], th['z']), energy=8000, cone=18, soft=0.4, color=(1.0, 0.9, 0.75)),
                                        dict(type='AREA', loc=pol(T_, th['face'], 7.4, th['z'] + 2.2), at=(th['x'], th['y'], th['z'] + 0.8), energy=1500, size=2.0, size_y=3.4, color=(1.0, 0.88, 0.72)),
                                        dict(type='AREA', loc=(th['x'], th['y'], th['z'] + 6.5), at=(th['x'], th['y'], th['z']), energy=600, size=8, disk=True, color=(0.95, 0.9, 0.85))])
    O = (ora['x'], ora['y'])
    S['oracle'] = dict(cam=(ora['x'] - 22, ora['y'] - 34, ora['z'] + 3.2), target=(ora['x'] - 2, ora['y'] + 2, ora['z'] + 6), lens=24, light='golden', sun_from=255)
    S['oracle_aerial'] = dict(cam=(ora['x'] + 90, ora['y'] - 110, ora['z'] + 75), target=(ora['x'], ora['y'], ora['z']), lens=35, light='late', sun_from=240)
    l = SITES['libraries'][int(np.argmin([abs(x['z'] - 40) for x in SITES['libraries']]))]
    la = l['face'] - math.pi / 2
    S['library_exterior'] = dict(cam=loc(l, la, -7, 16, 3.2), target=loc(l, la, 1.0, 2, 2.6), lens=24, light='late', sun_from=deg(l['face']) + 40)
    libl = [dict(type='AREA', loc=loc(l, la, 0, 3.9, 2.0), at=loc(l, la, 0, -1, 1.0), energy=500, size=2.2, size_y=3.0, color=(1.0, 0.86, 0.68)),
            dict(type='AREA', loc=loc(l, la, 0, 0, 4.2), at=loc(l, la, 0, 0, 0), energy=150, size=6, size_y=5, color=(0.95, 0.9, 0.85))]
    S['library_interior'] = dict(cam=loc(l, la, 1.6, 2.6, 1.85), target=loc(l, la, -0.2, -0.7, 1.2), lens=22, light='late', sun_from=deg(l['face']) + 10,
                                 light_override=dict(exposure=0.3), samples=384, lights=libl)
    S['pebble_board'] = dict(cam=loc(l, la, 0.25, 0.3, 1.75), target=loc(l, la, 0.0, -0.65, 1.2), lens=45, light='late', sun_from=deg(l['face']) + 10,
                             light_override=dict(exposure=0.3), dof=(1.05, 2.8), samples=384, lights=libl)
    st = SITES['stoa']; fg = SITES['festival']
    sa = st['ang']
    S['stoa'] = dict(cam=loc(st, sa, 38, 30, 3.0), target=loc(st, sa, 0, 0, 5.0), lens=26, light='golden', sun_from=deg(sa + math.pi / 2) - 30)
    S['stoa_inside'] = dict(cam=loc(st, sa, 8, 4.5, 1.7), target=loc(st, sa, 0, -6.6, 3.2), lens=20, light='golden', sun_from=deg(sa + math.pi / 2) - 30,
                            light_override=dict(exposure=0.6))
    S['festival_ground'] = dict(cam=loc(st, sa, -70, 60, 40), target=loc(fg, fg['ang'], 0, 0, 0), lens=32, light='late', sun_from=deg(sa) + 30)
    cl = [h for h in SITES['harbours'] if h['name'] == 'couriers'][0]
    o = np.array(cl['out'])
    cc = (cl['x'] + o[0] * 160 + o[1] * 40, cl['y'] + o[1] * 160 - o[0] * 40)
    S['courier_landing'] = dict(cam=(cc[0], cc[1], 34), target=(cl['x'], cl['y'] - 20, 4), lens=26, light='morning', sun_from=120)
    f0, f1 = SITES['ferry']
    mid = ((f0['x'] + f1['x']) / 2, (f0['y'] + f1['y']) / 2)
    if math.hypot(f1['x'] - f0['x'], f1['y'] - f0['y']) < 1:
        f1 = dict(f1, x=f1['x'] + 1)
    dv = np.array([f1['x'] - f0['x'], f1['y'] - f0['y']]); dv /= np.linalg.norm(dv)
    nv = np.array([-dv[1], dv[0]])
    o0 = np.array(f0['out'])
    side = np.array([o0[1], -o0[0]])
    fc = (f0['lx'] - o0[0] * 70 + side[0] * 110, f0['ly'] - o0[1] * 70 + side[1] * 110)
    S['ferry'] = dict(cam=(fc[0], fc[1], max(gz(*fc), 0) + 55), target=(mid[0], mid[1], 0), lens=30, light='late', sun_from=250)
    hp = SITES['harbours'][0]
    o = np.array(hp['out'])
    S['paxos_city'] = dict(cam=(hp['x'] + o[0] * 260 + o[1] * 120, hp['y'] + o[1] * 260 - o[0] * 120, 90), target=(hp['x'] - o[0] * 60, hp['y'] - o[1] * 60, 20), lens=30, light='morning', sun_from=100)
    return S
