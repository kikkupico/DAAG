"""Buildings of the setting, built on the kit. Local frame: x along the front, +y towards the
road/front, z up from floor level."""
import math
import bpy
import numpy as np
from .kit import Kit, T, Rz, Rx, Ry, S
from . import arch, mats as M
from .core import link

GREEK = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ', 'Ζ', 'Η', 'Θ', 'Ι', 'ΙΑ', 'ΙΒ']
GREEK_FONT = '/System/Library/Fonts/Supplemental/STIXTwoText.ttf'
_font = {}


def arch_mats():
    m = {}
    m['plaster'] = M.plaster('plaster_white', (0.63, 0.61, 0.56, 1))
    m['plaster_ochre'] = M.plaster('plaster_ochre', (0.68, 0.55, 0.37, 1), base_tex='white_plaster_rough_01')
    m['rubble'] = M.stone('rubble', 'rock_wall_10', (0.85, 0.82, 0.76, 1), 1.6, bump=1.2)
    m['stone'] = M.stone('limestone', 'rock_surface', (0.9, 0.87, 0.8, 1), 1.2, bump=0.5)
    m['colstone'] = M.plaster('stucco', (0.72, 0.7, 0.65, 1), base_tex='white_plaster_rough_01', loss=0.0, scale=1.0)
    m['pave'] = M.paving_weathered('paving', 'rock_surface', (0.4, 0.37, 0.32, 1))
    m['ashlar'] = M.stone('ashlar', 'sandstone_cracks', (0.98, 0.96, 0.9, 1), 1.0, bump=0.3)
    m['timber'] = M.timber('timber', 'rough_wood', (0.62, 0.5, 0.38, 1), 1.0)
    m['door'] = M.timber('door', 'weathered_planks', (0.6, 0.5, 0.4, 1), 1.4)
    m['board'] = M.timber('board', 'weathered_planks', (0.75, 0.66, 0.55, 1), 0.8)
    m['iron'] = M.iron()
    m['bronze'] = M.bronze()
    m['tile'] = M.terracotta('tile')
    m['paint'] = M.flat('antefix_paint', (0.08, 0.06, 0.05, 1), 0.6)
    m['dark'] = M.flat('dark', (0.015, 0.012, 0.01, 1), 0.9)
    m['wax'] = M.flat('wax', (0.62, 0.46, 0.16, 1), 0.35, sss=0.1)
    m['linen'] = M.linen()
    m['marble'] = M.marble()
    m['red'] = M.flat('red_paint', (0.36, 0.06, 0.04, 1), 0.7)
    m['earth'] = M.scanned('earth', 'dirt', 2.5, tint=(1.1, 1.0, 0.85, 1))
    m['rockface'] = M.stone('rockface', 'rock_boulder_dry', (0.62, 0.6, 0.56, 1), 4.0, bump=1.5)
    m['mortar'] = M.stone_rt('mortar', 'rock_surface', (0.38, 0.36, 0.33, 1), 1.0, bump=0.2, var=0.0, ao=False)
    m['meridian'] = M.bronze('meridian_bronze', patina=0.08)
    m['flagrock'] = M.stone_rt('flagrock', 'rock_boulder_dry', (0.46, 0.44, 0.41, 1), 1.4, bump=0.9, var=0.2)
    m['groove'] = M.marble('groove_marble', (0.52, 0.5, 0.46, 1))
    m['wicker'] = M.wicker()
    m['quaystone'] = M.paving_weathered('quaystone', 'rock_surface', (0.4, 0.38, 0.33, 1), 1.2)
    return m


def text_mesh(k, mat, s, size, x, y, z, rot=(math.pi / 2, 0, math.pi), depth=0.004, align='CENTER'):
    """Carve/paint text as a mesh part of the kit (via a temporary text object)."""
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = depth
    if 'f' not in _font:
        try:
            _font['f'] = bpy.data.fonts.load(GREEK_FONT, check_existing=True)
        except Exception:
            _font['f'] = None
    if _font['f'] is not None:
        cu.font = _font['f']
    cu.align_x = align; cu.align_y = 'CENTER'
    ob = bpy.data.objects.new('t', cu)
    bpy.context.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = ob.evaluated_get(dg).to_mesh()
    V = np.array([v.co[:] for v in me.vertices]); Fs = [tuple(p.vertices) for p in me.polygons]
    ob.evaluated_get(dg).to_mesh_clear()
    bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    if len(V):
        m = T(x, y, z) @ Rz(rot[2]) @ Rx(rot[0]) @ Ry(rot[1])
        k.add(mat, V, Fs, k.M @ m)


# ------------------------------------------------------------------ the board of requests
def request_board(k, x, y, z, n_slots=10, filled=3, label=None):
    """A board of numbered slots with the peg at the next free slot, hung on a wall facing +y.
    (x, y, z) = centre of the board's back face."""
    W, H, D = 1.9, 0.95, 0.07
    k.push(T(x, y, z))
    k.box('board', -W / 2, 0, -H / 2, W / 2, D, H / 2)
    # frame battens
    k.box('timber', -W / 2 - 0.04, D, -H / 2 - 0.04, W / 2 + 0.04, D + 0.025, -H / 2 + 0.03)
    k.box('timber', -W / 2 - 0.04, D, H / 2 - 0.03, W / 2 + 0.04, D + 0.025, H / 2 + 0.04)
    for sx in (-1, 1):
        k.box('timber', sx * W / 2 - 0.04, D, -H / 2, sx * W / 2 + 0.04, D + 0.025, H / 2)
    # hanging cords to iron hooks
    for sx in (-0.7, 0.7):
        k.beam('linen', (sx, D / 2, H / 2), (sx * 0.85, 0.02, H / 2 + 0.28), 0.012, 0.012)
        k.box('iron', sx * 0.85 - 0.02, -0.02, H / 2 + 0.26, sx * 0.85 + 0.02, 0.05, H / 2 + 0.3)
    sw = 0.13; gap = (W - 0.2) / n_slots
    for i in range(n_slots):
        cx = W / 2 - 0.1 - gap * (i + 0.5)
        # slot: a dark recess with a small ledge
        k.box('dark', cx - sw / 2, D - 0.0, -0.25, cx + sw / 2, D + 0.004, 0.12)
        k.box('timber', cx - sw / 2 - 0.01, D, -0.27, cx + sw / 2 + 0.01, D + 0.045, -0.25)
        # numeral painted above
        text_mesh(k, 'red', GREEK[i], 0.12, cx, D + 0.003, 0.27)
        if i < filled:
            # a request tablet (wooden frame, wax face) standing in the slot
            k.push(T(cx, D + 0.02, -0.07) @ Rx(-0.12))
            k.box('board', -0.055, -0.012, -0.17, 0.055, 0.012, 0.13)
            k.box('wax', -0.045, 0.011, -0.16, 0.045, 0.014, 0.12)
            k.pop()
    # the peg, in the hole below the next free slot
    cx = W / 2 - 0.1 - gap * (filled + 0.5)
    k.push(T(cx, D, -0.36) @ Rx(-math.pi / 2))
    k.cyl('timber', 0.018, 0, 0.12, 10)
    k.cyl('timber', 0.03, 0.12, 0.145, 12)
    k.pop()
    for i in range(n_slots):
        hx = -W / 2 + 0.1 + gap * (i + 0.5)
        k.box('dark', hx - 0.012, D, -0.372, hx + 0.012, D + 0.003, -0.348)
    k.pop()


# ------------------------------------------------------------------ a trading house
def house_range(k, w=62.0, d=15.0, house=1, board_filled=3, open_store=1):
    t = 0.6; P = 4.2; Z = 4.6
    yb = -d / 2; yfw = d / 2 - P          # back face, front wall face
    ybc, yfc = yb + t / 2, yfw - t / 2    # wall centrelines
    x0, x1 = -w / 2, w / 2
    off_end = x0 + 13.0
    gate_a, gate_b = off_end, off_end + 5.2
    gate_c = (gate_a + gate_b) / 2
    # foundations / floor platform
    k.box('rubble', x0 - 0.1, yb - 0.1, -2.5, x1 + 0.1, yfw, 0.05)
    # front wall
    fo = [dict(at=3.0, w=0.7, sill=1.5, head=2.3, kind='window'),
          dict(at=6.6, w=1.1, sill=0, head=2.25, kind='door', leaf='closed'),
          dict(at=10.2, w=0.7, sill=1.5, head=2.3, kind='window'),
          dict(at=gate_c - x0, w=3.6, sill=0, head=3.35, kind='open')]
    xs = gate_b + 3.2
    n = 0
    while xs < x1 - 2.5:
        fo.append(dict(at=xs - x0, w=2.6, sill=0, head=2.95, kind='door', leaf='ajar' if n == open_store else 'closed', deg=70))
        xs += 7.6; n += 1
    arch.wall(k, (x0 + t / 2, yfc), (x1 - t / 2, yfc), 0, Z, t, fo)
    # back wall with high vents
    bo = [dict(at=6.0, w=0.7, sill=1.6, head=2.4, kind='window')]
    xv = gate_b + 4
    while xv < x1 - 2:
        bo.append(dict(at=xv - x0, w=0.55, sill=3.1, head=3.6, kind='window')); xv += 6.0
    arch.wall(k, (x0 + t / 2, ybc), (x1 - t / 2, ybc), 0, Z, t, bo)
    # end walls
    arch.wall(k, (x0 + t / 2, yb), (x0 + t / 2, yfw), 0, Z, t, [dict(at=d / 2 - P / 2 - 1.5, w=0.6, sill=1.7, head=2.4, kind='window')])
    arch.wall(k, (x1 - t / 2, yb), (x1 - t / 2, yfw), 0, Z, t, [dict(at=3.5, w=0.5, sill=3.0, head=3.5, kind='window')])
    # gate passage walls and inner doors
    for xg in (gate_a, gate_b):
        arch.wall(k, (xg, yb + t), (xg, yfw - t), 0, Z, 0.5, [], socle=0.5)
    arch.wall(k, (gate_a, yb + 3.2), (gate_b, yb + 3.2), 0, Z, 0.5,
              [dict(at=2.6, w=2.8, sill=0, head=3.0, kind='door', leaf='closed')], socle=0.5)
    arch.paving(k, gate_a + 0.25, yb + 3.45, gate_b - 0.25, yfw, 0.06, size=(0.8, 0.6))
    # passage ceiling beams (seen looking into the gate)
    for yy in np.arange(yb + 3.6, yfw - 0.3, 0.7):
        k.beam('timber', (gate_a + 0.2, yy, Z - 0.3), (gate_b - 0.2, yy, Z - 0.3), 0.14, 0.18, 0.08)
    k.box('timber', gate_a, yb + 3.2, Z - 0.21, gate_b, yfw, Z - 0.17)
    # roof over the range
    arch.gable_roof(k, x0, x1, yb, yfw, Z, 17, over_eave=0.45, over_gable=0.35)
    # portico: stylobate, paving, columns, epistyle, lean-to
    yc = d / 2 - 0.38
    nb = int(w / 1.25)
    for i in range(nb):
        bx0 = x0 + i * w / nb
        k.box('stone', bx0 + 0.006, d / 2 - 0.8, -0.35, bx0 + w / nb - 0.006, d / 2, 0.16)
    arch.paving(k, x0, yfw, x1, d / 2 - 0.8, 0.16, size=(1.0, 0.7))
    span = 2.55
    ncol = int((w - 0.8) / span)
    xs = np.linspace(x0 + 0.42, x1 - 0.42, ncol + 1)
    D = 0.45; Hc = 7.0 * D
    arch.column_row(k, 'doric_plain', xs, yc, 0.16, D, 7.0)
    zb = 0.16 + Hc
    k.beam('timber', (x0 - 0.25, yc, zb + 0.22), (x1 + 0.25, yc, zb + 0.22), 0.4, 0.44, 0.03)
    k.beam('timber', (x0 - 0.25, yc, zb + 0.5), (x1 + 0.25, yc, zb + 0.5), 0.3, 0.12, 0.02)
    # tie beams from the epistyle into the front wall at each column
    for x in xs:
        k.beam('timber', (x, yc, zb + 0.3), (x, yfw - 0.05, zb + 0.55), 0.16, 0.2, 0.06)
    # wall plate on the front wall carrying the lean-to
    k.beam('timber', (x0, yfw + 0.12, Z - 0.42), (x1, yfw + 0.12, Z - 0.42), 0.22, 0.2, 0.02)
    arch.lean_to(k, x0 - 0.25, x1 + 0.25, yfw, yc, Z - 0.3, zb + 0.6, over=0.5)
    # end walls of the portico: closing piers at both ends
    for xe in (x0, x1 - 0.6):
        k.box('rubble', xe, yfw, 0.0, xe + 0.6, yfw + 0.4, 0.7)
        k.box('plaster', xe, yfw, 0.7, xe + 0.6, yfw + 0.4, Z - 0.4)
    # the board of requests by the gate, and a stone bench under it
    bx = gate_b + 1.35
    request_board(k, bx, yfw, 1.75, filled=board_filled)
    k.box('stone', bx - 1.1, yfw, 0.16, bx + 1.1, yfw + 0.42, 0.6)
    k.box('stone', bx - 1.0, yfw + 0.05, 0.6, bx + 1.0, yfw + 0.45, 0.68)
    return dict(gate=(gate_c, d / 2), board=(bx, yfw + 0.1, 1.75), store_doors=[o['at'] + x0 for o in fo if o.get('w') == 2.6],
                portico_y=yc, front_wall=yfw)


# ------------------------------------------------------------------ port-town houses
def _lean(k, rot, x0, x1, y_wall, y_out, z_wall, z_out, over=0.3):
    k.push(Rz(rot))
    arch.lean_to(k, x0, x1, y_wall, y_out, z_wall, z_out, over=over, beams=False, antefix=True)
    k.pop()


def court_house(k, w, d, plaster='plaster', H=3.5, tree=False):
    """Rooms on three sides of a court; blank street walls with one door and small high windows.
    Door on +y (the street). Lean-to roofs drain into the court."""
    rng = k.rng
    t = 0.5
    x0, x1, y0, y1 = -w / 2, w / 2, -d / 2, d / 2
    bw = rng.uniform(3.8, 4.6)           # back wing depth
    sw = rng.uniform(3.4, 4.2)           # side wing width
    fw = rng.uniform(2.4, 3.0) if w > 11 else 0
    k.box('rubble', x0 - 0.05, y0 - 0.05, -2.5, x1 + 0.05, y1 + 0.05, 0.05)
    door_at = rng.uniform(sw + 1.2, w - 1.2)
    win = [dict(at=door_at, w=1.0, sill=0, head=2.1, kind='door', leaf='closed')]
    for wx in rng.choice(np.linspace(1.2, w - 1.2, 6), 2, replace=False):
        if abs(wx - door_at) > 1.4:
            win.append(dict(at=wx, w=0.42, sill=2.3, head=2.75, kind='window'))
    arch.wall(k, (x0, y1 - t / 2), (x1, y1 - t / 2), 0, H, t, win, socle=0.6, mat=plaster)
    arch.wall(k, (x0, y0 + t / 2), (x1, y0 + t / 2), 0, H, t, [dict(at=w * 0.3, w=0.4, sill=2.4, head=2.8, kind='window')], socle=0.6, mat=plaster)
    arch.wall(k, (x0 + t / 2, y0 + t), (x0 + t / 2, y1 - t), 0, H, t, [], socle=0.6, mat=plaster)
    arch.wall(k, (x1 - t / 2, y0 + t), (x1 - t / 2, y1 - t), 0, H, t, [dict(at=d * 0.5, w=0.4, sill=2.4, head=2.8, kind='window')], socle=0.6, mat=plaster)
    Hi = H - 0.75
    # inner court walls with doors
    yb = y0 + bw
    arch.wall(k, (x0 + sw, yb), (x1 - t, yb), 0, Hi, 0.4,
              [dict(at=(w - sw) * 0.35, w=0.95, sill=0, head=2.0, kind='door', leaf='ajar' if rng.random() < 0.4 else 'closed'),
               dict(at=(w - sw) * 0.7, w=0.6, sill=1.1, head=1.8, kind='window')], socle=0.4, mat=plaster)
    xs_ = x0 + sw
    arch.wall(k, (xs_, yb), (xs_, y1 - t - fw), 0, Hi, 0.4,
              [dict(at=(d - bw - fw) * 0.5, w=0.95, sill=0, head=2.0, kind='door', leaf='closed')], socle=0.4, mat=plaster)
    if fw:
        arch.wall(k, (xs_, y1 - t - fw), (x1 - t, y1 - t - fw), 0, Hi, 0.4,
                  [dict(at=door_at - sw, w=1.4, sill=0, head=2.2, kind='open')], socle=0.4, mat=plaster)
    # roofs into the court
    _lean(k, 0, x0 - 0.1, x1 + 0.1, y0, yb, H + 0.05, Hi + 0.05)
    _lean(k, -math.pi / 2, -(y1 + 0.1 - fw - t), -(yb), x0, xs_, H + 0.05, Hi + 0.05)
    if fw:
        _lean(k, math.pi, -(x1 + 0.1), -(xs_), -(y1), -(y1 - t - fw), H + 0.05, Hi + 0.05)
    # court: beaten earth with a paved strip, the cistern mouth, a storage jar
    cx0, cx1, cy0, cy1 = xs_ + 0.2, x1 - t - 0.1, yb + 0.2, y1 - t - fw - 0.1
    k.box('earth', cx0, cy0, -0.05, cx1, cy1, 0.02)
    arch.paving(k, cx0, cy0, cx1, cy0 + 1.2, 0.08, size=(0.7, 0.5), thick=0.1)
    ccx, ccy = cx0 + (cx1 - cx0) * rng.uniform(0.4, 0.7), cy0 + (cy1 - cy0) * rng.uniform(0.45, 0.75)
    k.push(T(ccx, ccy, 0))
    k.lathe('stone', [(0.48, 0.0), (0.48, 0.55), (0.42, 0.62), (0.32, 0.62), (0.32, 0.4)], seg=20)
    k.box('door', -0.3, -0.3, 0.6, 0.3, 0.3, 0.65)
    k.pop()
    k.inst('pithos', T(cx1 - 0.6, cy1 - 0.6, 0) @ Rz(rng.uniform(0, 6)))
    for j in range(rng.integers(1, 4)):
        k.inst('amphora', T(cx0 + 0.4 + j * 0.45, cy1 - 0.4, 0) @ Rz(rng.uniform(0, 6)) @ Rx(0.12))
    if tree:
        k.inst('court_tree', T(ccx + 1.5 * rng.choice([-1, 1]), ccy - 1.2, 0) @ Rz(rng.uniform(0, 6)) @ S(rng.uniform(0.7, 0.95)))


def small_house(k, w, d, plaster='plaster', H=3.2):
    t = 0.5
    k.box('rubble', -w / 2 - 0.05, -d / 2 - 0.05, -2.5, w / 2 + 0.05, d / 2 + 0.05, 0.05)
    arch.wall(k, (-w / 2, d / 2 - t / 2), (w / 2, d / 2 - t / 2), 0, H, t,
              [dict(at=w * 0.35, w=0.95, sill=0, head=2.0, kind='door', leaf='closed'),
               dict(at=w * 0.75, w=0.4, sill=2.0, head=2.45, kind='window')], socle=0.6, mat=plaster)
    arch.wall(k, (-w / 2, -d / 2 + t / 2), (w / 2, -d / 2 + t / 2), 0, H, t, [], socle=0.6, mat=plaster)
    for sx in (-1, 1):
        arch.wall(k, (sx * (w / 2 - t / 2), -d / 2 + t), (sx * (w / 2 - t / 2), d / 2 - t), 0, H, t, [], socle=0.6, mat=plaster)
    arch.gable_roof(k, -w / 2, w / 2, -d / 2, d / 2, H, 16, over_eave=0.35, over_gable=0.25, rafters=False, gable_mat=plaster, wall_t=t)


def store_house(k, w, d, plaster='plaster', H=4.2):
    t = 0.6
    k.box('rubble', -w / 2 - 0.05, -d / 2 - 0.05, -2.5, w / 2 + 0.05, d / 2 + 0.05, 0.05)
    ops = []
    for i, f in enumerate((0.25, 0.7)):
        ops.append(dict(at=w * f, w=2.4, sill=0, head=2.8, kind='door', leaf='ajar' if (i == 0 and k.rng.random() < 0.4) else 'closed', deg=60))
    arch.wall(k, (-w / 2, d / 2 - t / 2), (w / 2, d / 2 - t / 2), 0, H, t, ops, socle=0.7, mat=plaster)
    arch.wall(k, (-w / 2, -d / 2 + t / 2), (w / 2, -d / 2 + t / 2), 0, H, t,
              [dict(at=x, w=0.5, sill=3.0, head=3.45, kind='window') for x in np.arange(3, w - 2, 5)], socle=0.7, mat=plaster)
    for sx in (-1, 1):
        arch.wall(k, (sx * (w / 2 - t / 2), -d / 2 + t), (sx * (w / 2 - t / 2), d / 2 - t), 0, H, t, [], socle=0.7, mat=plaster)
    arch.gable_roof(k, -w / 2, w / 2, -d / 2, d / 2, H, 17, over_eave=0.4, over_gable=0.3, rafters=True, gable_mat=plaster, wall_t=t)
    # cargo waiting at the doors
    for x in (w * 0.25 - w / 2, w * 0.7 - w / 2):
        for j in range(k.rng.integers(2, 6)):
            k.inst('amphora', T(x + k.rng.uniform(-1.6, 1.6), d / 2 + 0.6 + k.rng.uniform(0, 0.8), 0) @ Rz(k.rng.uniform(0, 6)))
        if k.rng.random() < 0.6:
            k.inst('sack', T(x + 1.8, d / 2 + 0.7, 0) @ Rz(k.rng.uniform(0, 6)))


def press_house(k, w=18, d=11):
    """House 2's oil press: a long room open on its front between two piers, with a beam press inside."""
    t = 0.6; H = 4.4
    k.box('rubble', -w / 2, -d / 2, -2.5, w / 2, d / 2, 0.05)
    arch.wall(k, (-w / 2, -d / 2 + t / 2), (w / 2, -d / 2 + t / 2), 0, H, t, [], socle=0.7)
    for sx in (-1, 1):
        arch.wall(k, (sx * (w / 2 - t / 2), -d / 2 + t), (sx * (w / 2 - t / 2), d / 2), 0, H, t, [], socle=0.7)
    for x in (-w / 6, w / 6):
        k.box('rubble', x - 0.45, d / 2 - 0.9, 0, x + 0.45, d / 2, 0.8)
        k.box('plaster', x - 0.45, d / 2 - 0.9, 0.8, x + 0.45, d / 2, H)
    k.beam('timber', (-w / 2, d / 2 - 0.45, H - 0.15), (w / 2, d / 2 - 0.45, H - 0.15), 0.4, 0.4, 0.03)
    arch.gable_roof(k, -w / 2, w / 2, -d / 2, d / 2, H + 0.1, 17, over_eave=0.45, over_gable=0.3)
    arch.paving(k, -w / 2 + 0.6, -d / 2 + 0.6, w / 2 - 0.6, d / 2, 0.06, size=(0.9, 0.7))
    # the lever press: beam socketed in the back wall, press bed with a spout, weight stones
    for px in (-w / 4, w / 5):
        k.box('stone', px - 0.9, -d / 2 + 1.4, 0.06, px + 0.9, -d / 2 + 3.2, 0.5)
        k.lathe('stone', [(0.7, 0.5), (0.7, 0.58), (0.55, 0.58), (0.55, 0.52)], seg=24, )
        k.beam('timber', (px, -d / 2 + 0.4, 1.6), (px, d / 2 - 1.2, 0.9), 0.45, 0.5, 0.05)
        k.box('stone', px - 0.5, d / 2 - 1.8, 0.06, px + 0.5, d / 2 - 0.9, 0.7)
        k.beam('linen', (px, d / 2 - 1.3, 0.9), (px, d / 2 - 1.35, 0.7), 0.05, 0.05)
        for j in range(4):
            k.inst('pithos', T(px - 1.2 + j * 0.8, -d / 2 + 4.3, 0.06) @ Rz(j))
    k.inst('amphora', T(w / 2 - 1.2, d / 2 - 0.5, 0.06))


def small_civic(k, w, d, H=4.0, porch=True, plaster='plaster'):
    """Tally house, column room, customs seat: a plain plastered block with a two-column porch."""
    t = 0.55
    k.box('rubble', -w / 2, -d / 2, -2.5, w / 2, d / 2, 0.05)
    pd = 2.4 if porch else 0
    yfw = d / 2 - pd
    arch.wall(k, (-w / 2, yfw - t / 2), (w / 2, yfw - t / 2), 0, H, t,
              [dict(at=w / 2, w=1.2, sill=0, head=2.4, kind='door', leaf='ajar', deg=50),
               dict(at=w * 0.2, w=0.6, sill=1.5, head=2.2, kind='window'), dict(at=w * 0.8, w=0.6, sill=1.5, head=2.2, kind='window')], mat=plaster)
    arch.wall(k, (-w / 2, -d / 2 + t / 2), (w / 2, -d / 2 + t / 2), 0, H, t, [dict(at=w / 2, w=0.6, sill=1.6, head=2.2, kind='window')], mat=plaster)
    for sx in (-1, 1):
        arch.wall(k, (sx * (w / 2 - t / 2), -d / 2 + t), (sx * (w / 2 - t / 2), d / 2), 0, H, t, [], mat=plaster)
    arch.gable_roof(k, -w / 2, w / 2, -d / 2, d / 2, H, 17, over_eave=0.4, over_gable=0.3, gable_mat=plaster)
    if porch:
        arch.paving(k, -w / 2 + t, yfw, w / 2 - t, d / 2, 0.12, size=(0.8, 0.6))
        D = 0.42
        arch.column_row(k, 'doric_plain', [-w / 6, w / 6], d / 2 - 0.4, 0.12, D, 7)
        k.beam('timber', (-w / 2, d / 2 - 0.4, 0.12 + 7 * D + 0.2), (w / 2, d / 2 - 0.4, 0.12 + 7 * D + 0.2), 0.36, 0.4)


# ------------------------------------------------------------------ the rock-cut storehouse
def granary(k):
    """A doorway cut into a limestone face beside the road: a dressed face round the door in the living
    rock, crags of the hillside around it, a heavy iron-bound timber door, a carved lintel."""
    k.box('rockface', -3.4, -2.5, -0.5, 3.4, -0.6, 5.6)               # the dressed face
    for (x, y, z, sx, sy, sz, r) in ((-6.0, -4.0, 1.5, 4.2, 5.0, 4.2, 0.3), (6.2, -4.5, 1.0, 4.5, 5.0, 4.0, -0.4),
                                       (0.0, -6.5, 6.0, 7.5, 5.5, 3.2, 0.1), (-4.0, -7.0, 7.5, 5.0, 5.0, 3.0, 0.8),
                                       (5.0, -7.5, 7.0, 5.0, 5.5, 3.5, -0.7), (-9.0, -6.0, 3.5, 4.0, 4.5, 4.5, 1.2), (9.5, -6.5, 3.0, 4.0, 4.0, 4.0, -1.1)):
        k.inst('crag', T(x, y, z) @ Rz(r) @ S(sx, sy, sz))
    k.box('dark', -1.6, -3.0, 0.0, 1.6, -0.55, 3.4)
    k.box('rockface', -2.2, -0.75, 3.4, 2.2, -0.5, 4.0)
    k.box('rockface', -2.2, -0.75, -0.2, -1.6, -0.5, 3.4)
    k.box('rockface', 1.6, -0.75, -0.2, 2.2, -0.5, 3.4)
    arch.door_leaf(k, -1.55, 1.55, 0.0, 3.35, y=-0.75)
    for zz in (0.8, 2.6):
        k.box('iron', -1.55, -0.85, zz, 1.55, -0.8, zz + 0.08)
    k.box('stone', -2.0, -0.6, -0.1, 2.0, 1.2, 0.12)
    for i in range(3):
        k.inst('amphora', T(2.6 + i * 0.5, 0.3, 0.1) @ Rz(i))
    k.inst('sack', T(-2.8, 0.4, 0.1) @ Rz(0.4))


def sundial(k, platform=False):
    if platform:
        k.lathe('stone', [(5.2, -0.6), (5.2, 0.05), (5.0, 0.12), (0.0, 0.12)], seg=48)
        k.lathe('rubble', [(3.6, -0.6), (3.6, 0.45), (0.0, 0.45)], seg=48)
        for i in range(30):
            a = 2 * math.pi * i / 30
            k.inst('rock_small', T(3.4 * math.cos(a), 3.4 * math.sin(a), 0.6) @ Rz(a + math.pi / 2) @ S(0.5, 0.32, 0.28))
        import numpy as _np
        for x in _np.arange(-3.0, 3.1, 0.9):
            for y in _np.arange(-3.0, 3.1, 0.7):
                if x * x + y * y < 9.0:
                    k.inst('slab', T(x, y, 0.5) @ Rz(k.rng.normal(0, 0.03)) @ S(0.86, 0.66, 0.15))
        z0 = 0.5
    else:
        z0 = 0
    k.box('stone', -0.5, -0.5, z0, 0.5, 0.5, z0 + 0.3)
    k.box('stone', -0.3, -0.3, z0 + 0.3, 0.3, 0.3, z0 + 1.05)
    # hemicyclium: a block with a concave face toward the south and a bronze gnomon
    k.box('stone', -0.38, -0.3, z0 + 1.05, 0.38, 0.3, z0 + 1.5)
    k.box('dark', -0.3, 0.29, z0 + 1.12, 0.3, 0.305, z0 + 1.45)
    k.lathe('stone', [(0.3, 0.0), (0.25, 0.16), (0.0, 0.2)], seg=20)  # placeholder bowl cap
    k.beam('bronze', (0, 0.25, z0 + 1.42), (0, 0.42, z0 + 1.42), 0.015, 0.015)


# ------------------------------------------------------------------ harbour works
def quay(k, w, d, z_top=2.3, z_bed=-3.0):
    """Stone quay along the shore: rubble core, ashlar face toward +y (the water), paved top, bollards, steps."""
    k.box('rubble', -w / 2, -d / 2, z_bed, w / 2, d / 2 - 0.6, z_top - 0.15)
    # ashlar facing in courses
    rng = k.rng
    z = z_bed
    while z < z_top - 0.1:
        hz = min(0.55, z_top - z)
        x = -w / 2
        while x < w / 2:
            L = min(w / 2 - x, rng.uniform(0.9, 1.6))
            k.inst('qblock', T(x + L / 2, d / 2 - 0.3 + rng.normal(0, 0.01), z + hz / 2) @ Rz(rng.normal(0, 0.006)) @ S(L - 0.01, 0.62, hz - 0.01))
            x += L
        z += hz
    arch.paving(k, -w / 2, -d / 2, w / 2, d / 2, z_top, size=(1.2, 0.8), thick=0.25)
    for x in np.arange(-w / 2 + 4, w / 2 - 2, 9.0):
        k.lathe('stone', [(0.22, z_top), (0.2, z_top + 0.55), (0.25, z_top + 0.62), (0.18, z_top + 0.7), (0.0, z_top + 0.72)], seg=14)if False else None
        k.push(T(x, d / 2 - 0.7, 0))
        k.lathe('stone', [(0.24, z_top), (0.2, z_top + 0.5), (0.26, z_top + 0.58), (0.18, z_top + 0.68), (0.0, z_top + 0.7)], seg=14)
        k.pop()
    # steps down to the water at one end
    for i in range(8):
        zz = z_top - (i + 1) * 0.3
        k.box('stone', w / 2 - 3.2, d / 2 - 1.6 + i * 0.32, zz - 0.3, w / 2 - 0.6, d / 2 + 0.3 + i * 0.32 * 0 + 0.0, zz + 0.3) if False else None
    for i in range(7):
        zz = z_top - (i + 1) * 0.32
        k.box('stone', w / 2 - 3.0, d / 2 + i * 0.34, z_bed, w / 2 - 0.5, d / 2 + (i + 1) * 0.34, zz)


def mole(k, L, w, z_top=2.2, z_bed=-4.0):
    """A mole running out along +x: rubble core, ashlar sides, paved top, a light post at the end."""
    k.box('rubble', 0, -w / 2 + 0.6, z_bed, L, w / 2 - 0.6, z_top - 0.15)
    rng = k.rng
    for side in (-1, 1):
        z = -1.2
        while z < z_top - 0.1:
            hz = min(0.55, z_top - z); x = 0
            while x < L:
                bl = min(L - x, rng.uniform(0.9, 1.7))
                k.inst('qblock', T(x + bl / 2, side * (w / 2 - 0.3), z + hz / 2) @ S(bl - 0.01, 0.62, hz - 0.01))
                x += bl
            z += hz
    z = -1.2
    while z < z_top - 0.1:
        hz = min(0.55, z_top - z)
        k.inst('qblock', T(L - 0.3, 0, z + hz / 2) @ S(0.62, w - 0.02, hz - 0.01)); z += hz
    # rough armour stones at the foot
    for i in range(int(L / 1.2)):
        for side in (-1, 1):
            k.inst('rock_small', T(rng.uniform(0, L), side * (w / 2 + rng.uniform(0.3, 2.0)), rng.uniform(-1.6, -0.4)) @ Rz(rng.uniform(0, 6)) @ S(rng.uniform(0.6, 1.4)))
    arch.paving(k, 0, -w / 2, L, w / 2, z_top, size=(1.1, 0.9), thick=0.25)
    for x in np.arange(6, L - 2, 10.0):
        for side in (-1, 1):
            k.push(T(x, side * (w / 2 - 0.6), 0))
            k.lathe('stone', [(0.22, z_top), (0.19, z_top + 0.5), (0.25, z_top + 0.58), (0.16, z_top + 0.66), (0.0, z_top + 0.68)], seg=14)
            k.pop()


def slipway(k, L, w, z_top=2.0, z_low=-1.6):
    """A ramp of stone with timber ways into the water along +x, log rollers across it."""
    p = math.atan2(z_top - z_low, L)
    k.push(T(0, 0, z_top) @ Ry(p))
    k.box('stone', 0, -w / 2, -0.6, L / math.cos(p), w / 2, 0.0)
    for side in (-1, 1):
        k.beam('timber', (0, side * 1.1, 0.12), (L / math.cos(p), side * 1.1, 0.12), 0.3, 0.24, 0.03)
    for x in np.arange(1.0, L / math.cos(p) - 1, 2.2):
        k.push(T(x, 0, 0.36) @ Rx(math.pi / 2))
        k.cyl('timber', 0.13, -1.6, 1.6, 10)
        k.pop()
    k.pop()
