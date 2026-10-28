"""Where solid things stand on the ground: floors, steps, paving, plinths, walls, benches. A map at half-metre
resolution, made once at build time by casting rays up through the ground band, so that no plant or stone,
built or added at render time, grows up through a floor."""
import time
import bpy
import numpy as np

F32 = np.float32
CELL = 4.0          # coarse cells, stored only where something solid is
RES = 0.5           # covered/not, within a coarse cell
SUB = int(CELL / RES)


class Floors:
    def __init__(self, keys, bits, x0, y0):
        self.keys = keys; self.bits = bits; self.x0 = x0; self.y0 = y0

    @classmethod
    def build(cls, F, coll_names, below=0.5, above=2.0):
        """Ground covered by any mesh, or instance, in coll_names within `below` m under to `above` m over it.
        Roofs, eaves and canopies higher up do not count."""
        from mathutils.bvhtree import BVHTree
        t0 = time.time()
        solid = {o.name for n in coll_names if n in bpy.data.collections for o in bpy.data.collections[n].all_objects}
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        groups = {}
        for inst in dg.object_instances:
            src = inst.parent.original.name if inst.is_instance and inst.parent else inst.object.original.name
            if src not in solid or inst.object.type != 'MESH':
                continue
            me = inst.object.data
            g = groups.get(me.name)
            if g is None:
                me.calc_loop_triangles()
                v = np.empty(len(me.vertices) * 3, F32); me.vertices.foreach_get('co', v)
                tri = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get('vertices', tri)
                g = groups[me.name] = (v.reshape(-1, 3), tri.reshape(-1, 3), [])
            g[2].append(np.array(inst.matrix_world, F32))
        # the triangles that reach into the ground band, in world space
        tris = []
        for v, tri, mats in groups.values():
            if not len(tri):
                continue
            M = np.stack(mats)
            step = max(1, 4_000_000 // max(1, len(v)))
            for c in range(0, len(M), step):
                Mc = M[c:c + step]
                w = (np.einsum('kij,nj->kni', Mc[:, :3, :3], v) + Mc[:, None, :3, 3])[:, tri].reshape(-1, 3, 3)
                g = F.z(w[:, :, 0].mean(1), w[:, :, 1].mean(1))
                keep = (w[:, :, 2].max(1) > g - below) & (w[:, :, 2].min(1) < g + above)
                tris.append(w[keep])
        T = np.concatenate(tris) if tris else np.zeros((0, 3, 3), F32)
        x0 = float(F.x0); y0 = float(F.y0)
        # coarse cells under the triangles: their corners, plus points spread over the big ones
        pts = [T.reshape(-1, 3)[:, :2]]
        edge = np.max(np.linalg.norm(T - np.roll(T, 1, axis=1), axis=2), axis=1)
        for t in T[edge > CELL * 0.7]:
            n = int(np.ceil(np.max(np.linalg.norm(t - np.roll(t, 1, 0), axis=1)) / (CELL * 0.5))) + 1
            a, b = np.meshgrid(np.linspace(0, 1, n), np.linspace(0, 1, n))
            m = a + b <= 1
            a, b = a[m], b[m]
            pts.append((t[0, :2] + a[:, None] * (t[1, :2] - t[0, :2]) + b[:, None] * (t[2, :2] - t[0, :2])).astype(F32))
        P = np.concatenate(pts)
        ci = np.floor((y0 - P[:, 1]) / CELL).astype(np.int64); cj = np.floor((P[:, 0] - x0) / CELL).astype(np.int64)
        keys = np.unique(ci * 100000 + cj)
        # one ray per half-metre sample in those cells, up from under the ground through the band
        bvh = BVHTree.FromPolygons(T.reshape(-1, 3).tolist(), np.arange(len(T) * 3).reshape(-1, 3).tolist(),
                                   all_triangles=True)
        ki, kj = keys // 100000, keys % 100000
        o = (np.arange(SUB) + 0.5) * RES
        X = (x0 + kj[:, None, None] * CELL + o[None, None, :]) * np.ones((1, SUB, 1))
        Y = (y0 - ki[:, None, None] * CELL - o[None, :, None]) * np.ones((1, 1, SUB))
        X = X.ravel(); Y = Y.ravel(); Z = F.z(X, Y) - below
        hit = np.zeros(len(X), bool)
        up = (0.0, 0.0, 1.0); dist = below + above
        ray = bvh.ray_cast
        for n in range(len(X)):
            hit[n] = ray((X[n], Y[n], Z[n]), up, dist)[0] is not None
        bits = hit.reshape(len(keys), SUB, SUB)
        # rays slip through the joints between paving stones: fill a sample whose neighbours are mostly covered
        f = cls(keys, bits, x0, y0)
        near = sum(f.covered(X + dx, Y + dy).astype(np.int8) for dx, dy in ((RES, 0), (-RES, 0), (0, RES), (0, -RES)))
        hit |= near >= 3
        bits = hit.reshape(len(keys), SUB, SUB)
        print('FLOORS', len(T), 'tris in the ground band,', len(keys), 'cells,', int(hit.sum() * RES * RES), 'm2 covered,',
              '%.1fs' % (time.time() - t0))
        return cls(keys, bits, x0, y0)

    def save(self, path):
        np.savez_compressed(path, keys=self.keys, bits=self.bits, origin=np.array([self.x0, self.y0]))

    @classmethod
    def load(cls, path):
        z = np.load(path)
        return cls(z['keys'], z['bits'], float(z['origin'][0]), float(z['origin'][1]))

    def covered(self, X, Y):
        u = (np.asarray(X, np.float64) - self.x0); v = (self.y0 - np.asarray(Y, np.float64))
        ci = np.floor(v / CELL).astype(np.int64); cj = np.floor(u / CELL).astype(np.int64)
        k = ci * 100000 + cj
        pos = np.clip(np.searchsorted(self.keys, k), 0, max(0, len(self.keys) - 1))
        found = (len(self.keys) > 0) & (self.keys[pos] == k) if len(self.keys) else np.zeros(len(k), bool)
        si = np.clip(((v - ci * CELL) / RES).astype(np.int64), 0, SUB - 1)
        sj = np.clip(((u - cj * CELL) / RES).astype(np.int64), 0, SUB - 1)
        out = np.zeros(len(k), bool)
        out[found] = self.bits[pos[found], si[found], sj[found]]
        return out

    def clear_of(self, X, Y, r):
        """True for a thing at X, Y whose footprint, radius r, touches no covered ground."""
        bad = self.covered(X, Y)
        if r > 0:
            for a in np.arange(6) * np.pi / 3:
                bad |= self.covered(X + r * np.cos(a), Y + r * np.sin(a))
        return ~bad


SOLID_COLLECTIONS = ('buildings', 'harbour', 'instances', 'chamber', 'tholos', 'oracle', 'libraries', 'stoa', 'props')
