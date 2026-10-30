"""Shots framed like the current place images, for comparing v3 against them."""
import math
import shots_paxos as P

def shots():
    S = P.SITES
    ch = S['chamber']; th = S['tholos']
    R = {}
    # Chamber from a hillside across the bay, long lens
    for i, (dx, dy, h) in enumerate([(170, -30, 25), (200, -60, 45), (150, 10, 30), (230, -20, 60)]):
        cam = (ch['x'] + dx, ch['y'] + dy, P.gz(ch['x'] + dx, ch['y'] + dy) + h)
        R[f'chamber_far{i}'] = dict(cam=cam, target=(ch['x'], ch['y'], ch['z'] + 6), lens=50, light='morning', sun_from=200, res=(1600, 1200))
    # Tholos from its court
    a = th['face'] + 0.45
    R['tholos_court'] = dict(cam=P.pol((th['x'], th['y']), a, 30, th['z'] + 2.2), target=(th['x'], th['y'], th['z'] + 5), lens=28, light='morning', sun_from=P.deg(th['face']) + 60, res=(1600, 1200))
    for i,(c,t) in enumerate([((1800,-2500,1900),(0,2500,0)),((-2200,-1500,2200),(0,2500,0)),((300,-800,1600),(0,3000,0))]):
        R[f'paxos_air{i}'] = dict(cam=c, target=t, lens=34, light='late', sun_from=240, hazeS=0.25, hazeD=40000, res=(1600, 1200))
    return R


_base = shots

def shots():
    R = _base()
    S = P.SITES; ch = S['chamber']; st = S['stoa']
    zs = ch['z'] + 1.02
    base = P.shots()['chamber_interior']
    # eye near the centre, looking across at the wall seat through a gap between inner columns
    for i, ang in enumerate([0.5, 1.2, 2.0, 2.8, 3.6, 4.4]):
        e = (ch['x'] + 2.0 * math.cos(ang + math.pi), ch['y'] + 2.0 * math.sin(ang + math.pi), zs + 1.5)
        t = (ch['x'] + 9.0 * math.cos(ang), ch['y'] + 9.0 * math.sin(ang), zs + 0.9)
        R[f'chint{i}'] = dict(base, cam=e, target=t, lens=34, res=(1600, 1200), samples=256)
    sa = st['ang']
    for i, (x, y) in enumerate([(14, 12), (20, 9), (10, 8)]):
        R[f'stoa{i}'] = dict(cam=P.loc(st, sa, x, y, 1.7), target=P.loc(st, sa, x - 6, -4, 2.2), lens=28, light='golden', sun_from=P.deg(sa + math.pi / 2) - 30, res=(1600, 1200), light_override=dict(exposure=0.9))
    return R
