"""Building kit core: accumulate geometry per material under a transform stack, and instance
placements (tiles, columns, props) into banks that become geometry-node instancers."""
import math
from collections import defaultdict
import bpy
import numpy as np
from .core import link

F32 = np.float32


def T(x=0, y=0, z=0):
    m = np.eye(4); m[:3, 3] = (x, y, z); return m


def Rz(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[0, 0], m[0, 1], m[1, 0], m[1, 1] = c, -s, s, c; return m


def Rx(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[1, 1], m[1, 2], m[2, 1], m[2, 2] = c, -s, s, c; return m


def Ry(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, s, -s, c; return m


def S(x, y=None, z=None):
    m = np.eye(4); m[0, 0] = x; m[1, 1] = x if y is None else y; m[2, 2] = x if z is None else z; return m


def euler_from_matrix(m):
    """XYZ euler (Blender default) from a rotation matrix (no shear)."""
    r = m[:3, :3]
    sx = np.linalg.norm(r[:, 0]); sy = np.linalg.norm(r[:, 1]); sz = np.linalg.norm(r[:, 2])
    r = r / np.array([sx, sy, sz])
    if abs(r[2, 0]) < 0.99999:
        y = -math.asin(r[2, 0]); cy = math.cos(y)
        x = math.atan2(r[2, 1] / cy, r[2, 2] / cy); z = math.atan2(r[1, 0] / cy, r[0, 0] / cy)
    else:
        z = 0
        if r[2, 0] < 0:
            y = math.pi / 2; x = math.atan2(r[0, 1], r[0, 2])
        else:
            y = -math.pi / 2; x = math.atan2(-r[0, 1], -r[0, 2])
    return (x, y, z), (sx, sy, sz)


class Bank:
    """Instance placements per prototype, island-wide."""

    def __init__(self):
        self.items = defaultdict(list)

    def add(self, proto, M):
        e, s = euler_from_matrix(M)
        self.items[proto].append((M[0, 3], M[1, 3], M[2, 3], *e, *s))

    def build(self, protos, coll, name='inst'):
        from .scatter import instances
        out = []
        for proto, rows in self.items.items():
            if proto not in protos:
                print('missing proto', proto); continue
            a = np.array(rows, F32)
            ob = instances(f'{name}_{proto}', a[:, :3], protos[proto], coll, rot=a[:, 3:6], scale=a[:, 6:9],
                           var=np.random.default_rng(len(a)).integers(0, max(1, len(protos[proto].all_objects)), len(a)))
            out.append(ob)
            print('INSTANCES', proto, len(a))
        return out


class Kit:
    def __init__(self, bank=None, seed=0):
        self.parts = defaultdict(lambda: [[], [], 0])   # mat -> [verts list, faces list, count]
        self.uvs = defaultdict(list)
        self.stack = [np.eye(4)]
        self.bank = bank
        self.rng = np.random.default_rng(seed)

    # ---- transforms
    @property
    def M(self):
        return self.stack[-1]

    def push(self, m):
        self.stack.append(self.M @ m); return self

    def pop(self):
        self.stack.pop(); return self

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.pop()

    def at(self, m):
        return self.push(m)

    # ---- raw geometry
    def add(self, mat, V, Fs, M=None):
        M = self.M if M is None else M
        V = np.asarray(V, float)
        V = (np.c_[V, np.ones(len(V))] @ M.T)[:, :3]
        p = self.parts[mat]
        p[0].append(V.astype(F32))
        p[1].extend([[i + p[2] for i in f] for f in Fs])
        p[2] += len(V)

    def inst(self, proto, m=np.eye(4)):
        if self.bank is not None:
            self.bank.add(proto, self.M @ m)

    # ---- primitives
    def box(self, mat, x0, y0, z0, x1, y1, z1, m=None):
        V = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        Fs = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        self.add(mat, V, Fs, None if m is None else self.M @ m)

    def bbox(self, mat, cx, cy, cz, sx, sy, sz, rz=0.0):
        m = T(cx, cy, cz) @ Rz(rz)
        self.box(mat, -sx / 2, -sy / 2, -sz / 2, sx / 2, sy / 2, sz / 2, m)

    def beam(self, mat, p0, p1, w, h, rough=0.0, up=(0, 0, 1)):
        """A hewn timber from p0 to p1 (centreline), width w, height h, slightly irregular."""
        p0 = np.array(p0, float); p1 = np.array(p1, float)
        d = p1 - p0; L = np.linalg.norm(d); d /= L
        upv = np.array(up, float)
        if abs(d @ upv) > 0.95:
            upv = np.array([1.0, 0, 0])
        sx = np.cross(d, upv); sx /= np.linalg.norm(sx); sz = np.cross(sx, d)
        n = max(2, int(L / 0.8) + 1)
        V = []
        for k in range(n):
            t = k / (n - 1)
            c = p0 + d * L * t
            jw = w * (1 + self.rng.normal(0, rough)); jh = h * (1 + self.rng.normal(0, rough))
            off = sx * self.rng.normal(0, rough * w * 0.5) + sz * self.rng.normal(0, rough * h * 0.5)
            for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                V.append(c + off + sx * a * jw / 2 + sz * b * jh / 2)
        Fs = []
        for k in range(n - 1):
            for e in range(4):
                a0 = k * 4 + e; a1 = k * 4 + (e + 1) % 4
                Fs.append((a0, a1, a1 + 4, a0 + 4))
        Fs.append((3, 2, 1, 0)); Fs.append(tuple((n - 1) * 4 + i for i in range(4)))
        self.add(mat, V, Fs)

    def prism(self, mat, poly, z0, z1):
        """Extrude a convex-or-not 2D polygon (CCW) from z0 to z1 (side faces + caps as n-gons)."""
        n = len(poly)
        V = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
        Fs = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
        for i in range(n):
            j = (i + 1) % n
            Fs.append((i, j, n + j, n + i))
        self.add(mat, V, Fs)

    def gable_prism(self, mat, x0, x1, y0, y1, z0, zr):
        """Triangular gable fill along x: base y0..y1 at z0, apex at mid-y at zr."""
        ym = (y0 + y1) / 2
        V = [(x0, y0, z0), (x0, y1, z0), (x0, ym, zr), (x1, y0, z0), (x1, y1, z0), (x1, ym, zr)]
        Fs = [(0, 2, 1), (3, 4, 5), (0, 3, 5, 2), (1, 2, 5, 4), (0, 1, 4, 3)]
        self.add(mat, V, Fs)

    def lathe(self, mat, prof, seg=24, flutes=0, fdepth=0.0, z_flute=(0, 1e9), arris=True, caps=True):
        """Revolve profile [(r, z), ...] about z. Optional concave flutes between z_flute bounds."""
        V = []; Fs = []
        n = len(prof)
        for i, (r, z) in enumerate(prof):
            for k in range(seg):
                a = 2 * math.pi * k / seg
                rr = r
                if flutes and z_flute[0] <= z <= z_flute[1]:
                    f = (a * flutes / (2 * math.pi)) % 1.0
                    rr = r * (1 - fdepth * math.sqrt(max(0.0, 1 - (2 * f - 1) ** 2)))
                V.append((rr * math.cos(a), rr * math.sin(a), z))
        for i in range(n - 1):
            for k in range(seg):
                a = i * seg + k; b = i * seg + (k + 1) % seg
                Fs.append((a, b, b + seg, a + seg))
        if caps and prof[0][0] > 0:
            Fs.append(tuple(range(seg - 1, -1, -1)))
        if caps and prof[-1][0] > 0:
            Fs.append(tuple((n - 1) * seg + k for k in range(seg)))
        self.add(mat, V, Fs)

    def cyl(self, mat, r, z0, z1, seg=12, r1=None):
        self.lathe(mat, [(r, z0), (r if r1 is None else r1, z1)], seg)

    # ---- output
    def build(self, name, mats, coll, smooth=False):
        if not self.parts:
            return None
        allV = []; allF = []; mi = []; off = 0; slots = []
        for k, (mat, (Vs, Fs, cnt)) in enumerate(self.parts.items()):
            V = np.concatenate(Vs)
            allV.append(V)
            allF.extend([[i + off for i in f] for f in Fs])
            mi.extend([k] * len(Fs))
            off += len(V)
            slots.append(mat)
        V = np.concatenate(allV)
        me = bpy.data.meshes.new(name)
        me.from_pydata(V.tolist(), [], allF)
        for s in slots:
            me.materials.append(mats[s] if isinstance(s, str) else s)
        me.polygons.foreach_set('material_index', np.array(mi, np.int32))
        me.validate(clean_customdata=False)
        if smooth:
            me.shade_smooth()
            try:
                me.set_sharp_from_angle(angle=math.radians(smooth if isinstance(smooth, (int, float)) and smooth is not True else 35))
            except Exception:
                pass
        ob = bpy.data.objects.new(name, me)
        link(ob, coll)
        return ob
