"""Camera-aware ground cover: at render time, extra shrubs across the shot's view, and extra grass and thyme and
new stones and small rocks where it sees them close, on top of the island-wide layer baked into the .blend.

Every candidate point has a fixed place, size and rank (hashed from its grid cell and slot), and the camera only
sets how many ranks are kept, so two shots of the same slope show the same plants and stones, the nearer shot
more of them. Points take their height from a geometry-nodes copy of the terrain's displacement shader, so a
stone sits on the rendered ground, lumps and crags included, not on the coarser height map."""
import os, time
import bpy
import numpy as np
from mathutils import Vector

F32 = np.float32

# ---------------------------------------------------------------------------------------------------------------
# terrain height as a geometry-nodes field, translated node by node from the terrain material's displacement


_SAME = {'ShaderNodeMath', 'ShaderNodeTexNoise', 'ShaderNodeTexVoronoi', 'ShaderNodeTexWave', 'ShaderNodeMapping',
         'ShaderNodeMapRange', 'ShaderNodeClamp', 'ShaderNodeVectorMath', 'ShaderNodeMix', 'ShaderNodeValToRGB',
         'ShaderNodeCombineXYZ', 'ShaderNodeSeparateXYZ'}
_SKIP_PROPS = {'rna_type', 'name', 'label', 'location', 'location_absolute', 'width', 'height', 'dimensions',
               'parent', 'select', 'show_options', 'show_preview', 'hide', 'mute', 'show_texture', 'color',
               'use_custom_color', 'bl_idname', 'bl_label', 'bl_description', 'bl_icon', 'bl_static_type',
               'bl_width_default', 'bl_width_min', 'bl_width_max', 'bl_height_default', 'bl_height_min',
               'bl_height_max', 'type', 'inputs', 'outputs', 'internal_links', 'warning_propagation', 'color_tag',
               'texture_mapping', 'color_mapping', 'image_user', 'image', 'interpolation', 'projection',
               'projection_blend', 'extension', 'is_active_output', 'target'}


def _copy_props(a, b):
    for p in a.bl_rna.properties:
        if p.identifier in _SKIP_PROPS or p.is_readonly:
            continue
        try:
            setattr(b, p.identifier, getattr(a, p.identifier))
        except Exception:
            pass
    if a.bl_idname == 'ShaderNodeValToRGB':
        cs, cd = a.color_ramp, b.color_ramp
        cd.interpolation = cs.interpolation
        while len(cd.elements) < len(cs.elements):
            cd.elements.new(0.5)
        for es, ed in zip(cs.elements, cd.elements):
            ed.position = es.position; ed.color = es.color


def _set_menu(node, name, value):
    if hasattr(node, name.lower()):
        setattr(node, name.lower(), value)
    elif name in node.inputs:
        node.inputs[name].default_value = value.title() if value.isupper() else value


def terrain_height_group(terrain):
    """Node group with one Float output: the terrain's displaced height at the point's (x, y)."""
    name = 'terrain_height_' + terrain.name
    if name in bpy.data.node_groups:
        return bpy.data.node_groups[name]
    mat = terrain.material_slots[0].material
    st = mat.node_tree
    out = next(n for n in st.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
    disp = out.inputs['Displacement'].links[0].from_node
    assert disp.bl_idname == 'ShaderNodeDisplacement' and disp.inputs['Midlevel'].default_value == 0.0
    bb = [terrain.matrix_world @ Vector(c) for c in terrain.bound_box]
    lo = [min(v[k] for v in bb) for k in range(3)]; hi = [max(v[k] for v in bb) for k in range(3)]
    size = [max(hi[k] - lo[k], 1e-6) for k in range(3)]

    g = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    g.interface.new_socket('Height', in_out='OUTPUT', socket_type='NodeSocketFloat')
    N, L = g.nodes, g.links
    go = N.new('NodeGroupOutput')
    pos = N.new('GeometryNodeInputPosition')
    # undisplaced surface: the base grid is flat at z = 0
    flat = N.new('ShaderNodeVectorMath'); flat.operation = 'MULTIPLY'
    flat.inputs[1].default_value = (1.0, 1.0, 0.0)
    L.new(pos.outputs[0], flat.inputs[0])
    obj = flat.outputs[0]
    gen = N.new('ShaderNodeVectorMath'); gen.operation = 'MULTIPLY_ADD'
    L.new(obj, gen.inputs[0])
    gen.inputs[1].default_value = tuple(1 / s for s in size)
    gen.inputs[2].default_value = tuple(-l / s for l, s in zip(lo, size))
    made = {}

    def out_sock(src_sock):
        n = src_sock.node
        if n.bl_idname == 'ShaderNodeTexCoord':
            return {'Generated': gen.outputs[0], 'Object': obj}[src_sock.name]
        if n.bl_idname == 'ShaderNodeNewGeometry':
            return {'Position': obj}[src_sock.name]
        m = node(n)
        if n.bl_idname == 'ShaderNodeTexImage':
            return m.outputs[src_sock.name]
        if n.bl_idname == 'ShaderNodeSeparateColor':
            return m.outputs[list(n.outputs).index(src_sock)]
        return m.outputs[src_sock.identifier] if src_sock.identifier in m.outputs else m.outputs[list(n.outputs).index(src_sock)]

    def feed(src_in, dst_in):
        if src_in.links:
            L.new(out_sock(src_in.links[0].from_socket), dst_in)
        elif hasattr(src_in, 'default_value') and hasattr(dst_in, 'default_value'):
            try:
                dst_in.default_value = src_in.default_value
            except Exception:
                v = src_in.default_value
                dst_in.default_value = v[0] if hasattr(v, '__len__') else v

    def node(n):
        if n.name in made:
            return made[n.name]
        t = n.bl_idname
        if t == 'ShaderNodeTexImage':
            m = N.new('GeometryNodeImageTexture')
            m.inputs['Image'].default_value = n.image
            _set_menu(m, 'Interpolation', n.interpolation)
            _set_menu(m, 'Extension', n.extension)
            made[n.name] = m
            feed(n.inputs['Vector'], m.inputs['Vector'])
            return m
        if t == 'ShaderNodeSeparateColor':
            m = N.new('FunctionNodeSeparateColor'); m.mode = n.mode
            made[n.name] = m
            feed(n.inputs[0], m.inputs[0])
            return m
        if t == 'ShaderNodeMapping':        # not a geometry node: POINT mapping is v * scale + location
            assert n.vector_type == 'POINT' and not any(n.inputs[k].links for k in ('Location', 'Rotation', 'Scale'))
            assert tuple(n.inputs['Rotation'].default_value) == (0.0, 0.0, 0.0)
            m = N.new('ShaderNodeVectorMath'); m.operation = 'MULTIPLY_ADD'
            m.inputs[1].default_value = n.inputs['Scale'].default_value
            m.inputs[2].default_value = n.inputs['Location'].default_value
            made[n.name] = m
            feed(n.inputs['Vector'], m.inputs[0])
            return m
        if t not in _SAME:
            raise RuntimeError(f'terrain displacement uses {t}, which detail.py cannot translate')
        m = N.new(t)
        _copy_props(n, m)
        made[n.name] = m
        for i, si in enumerate(n.inputs):
            if not si.enabled and not si.links:
                continue
            di = m.inputs[si.identifier] if si.identifier in m.inputs else m.inputs[i]
            feed(si, di)
        return m

    hgt = disp.inputs['Height']
    sc = disp.inputs['Scale']
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    feed(hgt, mul.inputs[0]); feed(sc, mul.inputs[1])
    L.new(mul.outputs[0], go.inputs[0])
    return g


def instancer_group(height_group):
    """Points (z ignored) → instances on the terrain surface, sunk by their 'snk' attribute."""
    name = 'detail_instance'
    if name in bpy.data.node_groups:
        return bpy.data.node_groups[name]
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Collection', in_out='INPUT', socket_type='NodeSocketCollection')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = ng.nodes, ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    hg = N.new('GeometryNodeGroup'); hg.node_tree = height_group
    snk = N.new('GeometryNodeInputNamedAttribute'); snk.data_type = 'FLOAT'; snk.inputs['Name'].default_value = 'snk'
    z = N.new('ShaderNodeMath'); z.operation = 'SUBTRACT'
    L.new(hg.outputs[0], z.inputs[0]); L.new(snk.outputs['Attribute'], z.inputs[1])
    pos = N.new('GeometryNodeInputPosition')
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(pos.outputs[0], sep.inputs[0])
    comb = N.new('ShaderNodeCombineXYZ')
    L.new(sep.outputs[0], comb.inputs[0]); L.new(sep.outputs[1], comb.inputs[1]); L.new(z.outputs[0], comb.inputs[2])
    sp = N.new('GeometryNodeSetPosition')
    L.new(gi.outputs['Geometry'], sp.inputs['Geometry']); L.new(comb.outputs[0], sp.inputs['Position'])
    ci = N.new('GeometryNodeCollectionInfo'); ci.transform_space = 'ORIGINAL'
    ci.inputs['Separate Children'].default_value = True
    ci.inputs['Reset Children'].default_value = True
    L.new(gi.outputs['Collection'], ci.inputs['Collection'])
    iop = N.new('GeometryNodeInstanceOnPoints')
    iop.inputs['Pick Instance'].default_value = True
    L.new(sp.outputs[0], iop.inputs['Points']); L.new(ci.outputs[0], iop.inputs['Instance'])
    va = N.new('GeometryNodeInputNamedAttribute'); va.data_type = 'INT'; va.inputs['Name'].default_value = 'var'
    L.new(va.outputs['Attribute'], iop.inputs['Instance Index'])
    ra = N.new('GeometryNodeInputNamedAttribute'); ra.data_type = 'FLOAT_VECTOR'; ra.inputs['Name'].default_value = 'rot'
    e2r = N.new('FunctionNodeEulerToRotation'); L.new(ra.outputs['Attribute'], e2r.inputs[0])
    L.new(e2r.outputs[0], iop.inputs['Rotation'])
    sa = N.new('GeometryNodeInputNamedAttribute'); sa.data_type = 'FLOAT_VECTOR'; sa.inputs['Name'].default_value = 'scl'
    L.new(sa.outputs['Attribute'], iop.inputs['Scale'])
    L.new(iop.outputs[0], go.inputs[0])
    return ng


def points_object(name, X, Y, rot, scl, var, snk, protos, coll, height_group):
    n = len(X)
    me = bpy.data.meshes.new(name)
    me.vertices.add(n)
    me.vertices.foreach_set('co', np.stack([X, Y, np.zeros(n, F32)], 1).astype(F32).ravel())
    me.attributes.new('rot', 'FLOAT_VECTOR', 'POINT').data.foreach_set('vector', np.asarray(rot, F32).ravel())
    me.attributes.new('scl', 'FLOAT_VECTOR', 'POINT').data.foreach_set('vector', np.asarray(scl, F32).ravel())
    me.attributes.new('var', 'INT', 'POINT').data.foreach_set('value', np.asarray(var, np.int32))
    me.attributes.new('snk', 'FLOAT', 'POINT').data.foreach_set('value', np.asarray(snk, F32))
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    md = ob.modifiers.new('inst', 'NODES'); md.node_group = instancer_group(height_group)
    for it in md.node_group.interface.items_tree:
        if it.name == 'Collection' and it.in_out == 'INPUT':
            md[it.identifier] = protos
    return ob


# ---------------------------------------------------------------------------------------------------------------
# fixed candidates: a hash of (layer, cell, slot) gives each slot its place, size, turn and rank

_M64 = np.uint64(0xFFFFFFFFFFFFFFFF)


def _mix(h):
    h = (h ^ (h >> np.uint64(30))) * np.uint64(0xBF58476D1CE4E5B9)
    h = (h ^ (h >> np.uint64(27))) * np.uint64(0x94D049BB133111EB)
    return h ^ (h >> np.uint64(31))


def _uniforms(seed, i, j, s, k):
    """k uniforms in [0, 1) per (i, j, s), fixed for a given seed."""
    with np.errstate(over='ignore'):
        h = _mix(np.uint64(seed) * np.uint64(0x9E3779B97F4A7C15) + i.astype(np.uint64))
        h = _mix(h ^ (j.astype(np.uint64) * np.uint64(0xC2B2AE3D27D4EB4F)))
        h = _mix(h ^ (s.astype(np.uint64) * np.uint64(0x165667B19E3779F9)))
        out = []
        for c in range(k):
            h = _mix(h + np.uint64(0x9E3779B97F4A7C15))
            out.append(((h >> np.uint64(11)).astype(np.float64) * 2.0 ** -53).astype(F32))
    return out


def _bilinear(F, D, X, Y):
    """Density map D (on the field's cell centres) at points X, Y."""
    u = (X - F.xs[0]) / F.cpx; v = (F.ys[0] - Y) / F.cpx
    n0, n1 = D.shape
    u = np.clip(u, 0, n1 - 1.001); v = np.clip(v, 0, n0 - 1.001)
    j = u.astype(np.int64); i = v.astype(np.int64); fu = (u - j).astype(F32); fv = (v - i).astype(F32)
    return (D[i, j] * (1 - fu) * (1 - fv) + D[i, j + 1] * fu * (1 - fv) + D[i + 1, j] * (1 - fu) * fv
            + D[i + 1, j + 1] * fu * fv)


def _maxpool3(a):
    p = np.pad(a, 1, mode='edge')
    out = a.copy()
    for di in (0, 1, 2):
        for dj in (0, 1, 2):
            np.maximum(out, p[di:di + a.shape[0], dj:dj + a.shape[1]], out=out)
    return out


class View:
    """The render camera as numpy: where a world point lands on the frame and how far it is."""

    def __init__(self, scene, cam, margin=0.12):
        r = scene.render
        self.resx = r.resolution_x * r.resolution_percentage / 100
        self.resy = r.resolution_y * r.resolution_percentage / 100
        cd = cam.data
        fit = cd.sensor_fit
        horiz = fit == 'HORIZONTAL' or (fit == 'AUTO' and self.resx >= self.resy)
        sensor = cd.sensor_width if fit != 'VERTICAL' else cd.sensor_height
        span = self.resx if horiz else self.resy
        self.fpx = cd.lens / sensor * span                     # focal length in pixels
        self.M = np.array(cam.matrix_world.inverted(), np.float64)
        self.eye = np.array(cam.matrix_world.translation, np.float64)
        self.margin = margin

    def project(self, X, Y, Z):
        M = self.M
        cx = M[0, 0] * X + M[0, 1] * Y + M[0, 2] * Z + M[0, 3]
        cy = M[1, 0] * X + M[1, 1] * Y + M[1, 2] * Z + M[1, 3]
        cz = M[2, 0] * X + M[2, 1] * Y + M[2, 2] * Z + M[2, 3]
        depth = -cz
        dd = np.maximum(depth, 1e-3)
        px = cx / dd * self.fpx; py = cy / dd * self.fpx      # pixels from the frame centre
        m = self.margin
        inside = (depth > 0.1) & (np.abs(px) < self.resx / 2 * (1 + m) + 8) & (np.abs(py) < self.resy / 2 * (1 + m) + 8)
        dist = np.sqrt((X - self.eye[0]) ** 2 + (Y - self.eye[1]) ** 2 + (Z - self.eye[2]) ** 2)
        flat = np.sqrt((X - self.eye[0]) ** 2 + (Y - self.eye[1]) ** 2)
        return inside, dist.astype(F32), flat.astype(F32)


def weight(view, inside, dist, flat, size, near, px_min, reach=4.0):
    """1 where a thing `size` metres tall still spans px_min pixels, then falling as 1/d^2 (constant count per
    pixel of ground) to nothing at `reach` times that distance; 0 off the frame, and rising from 0 at half of
    `near` metres from the eye to 1 at `near`, so the pass puts nothing new in a composed foreground."""
    full = size * view.fpx / px_min
    w = np.minimum(1.0, (full / np.maximum(dist, 1e-3)) ** 2).astype(F32)
    if near > 0:
        w *= np.clip((dist - near / 2) / (near / 2), 0, 1)
    w[~inside | (dist > full * reach)] = 0
    return w


class Pass:
    """Built once per island per run; add(scene, cam) puts one shot's detail instancers in the scene."""

    def __init__(self, island, terrain, layers_fn, F, sites, protos, coll, budget=6_000_000, floors=None):
        self.island = island; self.F = F; self.coll = coll; self.budget = budget; self.floors = floors
        self.hg = terrain_height_group(terrain)
        self.layers = []
        A = F.cpx ** 2
        # nothing new on levelled ground (building plots, terraces, the festival ground): floors stand on it
        from .fieldops import blur
        flat = np.clip(F.masks['clearing'] + F.masks['built'], 0, 1)
        level = np.clip(1 - blur(flat, 1) * 1.5, 0, 1)       # a cell's margin past the plot's edge
        for l in layers_fn(F, sites):
            if not (l.get('detail') or l.get('more', 1) > 1):
                continue
            base = l['d'] * l.get('post', 1.0)
            extra = base if l.get('detail') else base * (l['more'] - 1)
            extra = np.clip(extra * level, 0, None).astype(F32)
            if l['proto'] not in protos:
                print('DETAIL skip', l['name'], '(no prototypes)'); continue
            self.layers.append(dict(l, extra=extra, cellmax=_maxpool3(extra) * A, protos=protos[l['proto']],
                                    nvar=len(protos[l['proto']].all_objects),
                                    seed=sum(ord(c) * 131 ** k for k, c in enumerate(l['name'])) % (2 ** 31)))

    def add(self, scene, cam, scale=1.0):
        F = self.F
        t0 = time.time()
        bpy.context.view_layer.update()        # a camera made this shot has no world matrix until an update
        view = View(scene, cam)
        # whole-grid pass at cell centres, cropped to the cells the camera can see
        Xg = np.broadcast_to(F.xs[None, :], F.h.shape); Yg = np.broadcast_to(F.ys[:, None], F.h.shape)
        inside, dist, flat = view.project(Xg, Yg, F.h.astype(np.float64) + 0.5)
        reach_max = max(l['size'] / l['px'] for l in self.layers) * view.fpx * 4.0 * scale + 2 * F.cpx
        vis = inside & (dist < reach_max)
        # cells partly in view count too
        vis = _maxpool3(vis.astype(np.uint8)).astype(bool)
        if not vis.any():
            return []
        ii, jj = np.nonzero(vis)
        i0, i1, j0, j1 = ii.min(), ii.max() + 1, jj.min(), jj.max() + 1
        sl = (slice(i0, i1), slice(j0, j1))
        objs = []; counts = {}
        for l in self.layers:
            size = l['size'] * scale
            wc = weight(view, inside[sl], dist[sl], flat[sl], size, 0.0, l['px'])
            wc = _maxpool3(np.minimum(1.0, wc * 1.6))         # a cell's weight bounds its points' weights
            bound = l['cellmax'][sl] * wc
            nslot = np.ceil(bound).astype(np.int64)
            ci, cj = np.nonzero(nslot)
            if not len(ci):
                continue
            ns = nslot[ci, cj]
            I = np.repeat(ci + i0, ns); J = np.repeat(cj + j0, ns)
            S = np.arange(ns.sum()) - np.repeat(np.cumsum(ns) - ns, ns)
            if len(I) > 4 * self.budget:
                for o in objs:
                    remove(o)
                print('DETAIL', l['name'], 'over budget, thinning'); return self.add(scene, cam, scale * 0.7)
            u0, ux, uy, us, ur, ut1, ut2, uv = _uniforms(l['seed'], I, J, S, 8)
            X = F.xs[J] + (ux - 0.5) * F.cpx; Y = F.ys[I] + (uy - 0.5) * F.cpx
            ins, d, fl = view.project(X, Y, F.z(X, Y).astype(np.float64) + size * 0.5)
            e = _bilinear(F, l['extra'], X, Y) * F.cpx ** 2 * weight(view, ins, d, fl, size, l.get('near', 0.0), l['px'])
            keep = S + u0 < e
            if self.floors is not None and keep.any():
                k = np.nonzero(keep)[0]
                keep[k] = self.floors.clear_of(X[k], Y[k], l.get('r', 0.0))
            if not keep.any():
                continue
            X, Y = X[keep], Y[keep]; n = len(X)
            tilt = l.get('tilt', 0.0)
            rot = np.stack([(ut1[keep] - 0.5) * 3.4 * tilt, (ut2[keep] - 0.5) * 3.4 * tilt, ur[keep] * 2 * np.pi], 1)
            sc = l['smin'] + us[keep] * (l['smax'] - l['smin'])
            var = np.minimum((uv[keep] * l['nvar']).astype(np.int64), l['nvar'] - 1)
            # sunk by a share of their size, and by the rise across their footprint on a slope
            slope = np.radians(np.minimum(_bilinear(F, F.slope, X, Y), 60.0))
            snk = (l.get('sink', 0.2) * (sc if l.get('sink_scales') else 1.0)
                   + l.get('radius', 0.0) * sc * np.tan(slope)).astype(F32)
            objs.append(points_object(l['name'] + '_detail', X, Y, rot, np.repeat(sc[:, None], 3, 1), var, snk,
                                      l['protos'], self.coll, self.hg))
            counts[l['name']] = n
        total = sum(counts.values())
        if total > self.budget:
            for o in objs:
                remove(o)
            print('DETAIL', total, 'over budget, thinning'); return self.add(scene, cam, scale * 0.7)
        print('DETAIL', self.island, 'scale %.2f' % scale, counts, 'total', total, '%.1fs' % (time.time() - t0))
        self.last = dict(counts=counts, total=total, seconds=time.time() - t0, scale=scale)
        return objs


def remove(ob):
    me = ob.data
    bpy.data.objects.remove(ob)
    if me and me.users == 0:
        bpy.data.meshes.remove(me)


def detail_protos(protos):
    """Stone and small-rock prototypes, greyed: the scans are red Namaqualand stone."""
    from . import scatter, populate
    grey = (0.3, 0.52, (0.86, 0.82, 0.75, 1))      # weathered limestone, a shade under the soil
    for key, assets in (('stones', ('namaqualand_stones_01', 'stone_01', 'rock_09')),
                        ('rocks', ('namaqualand_rocks_01', 'rock_07'))):
        name = 'p_' + key
        if name in bpy.data.collections and bpy.data.collections[name].all_objects:
            protos[key] = bpy.data.collections[name]; continue
        c = scatter.proto_collection(name)
        for a in assets:
            for o in populate._ph(a, c, grey=grey):
                # the scans lie in a row along x; put each origin under its own stone, at its base
                co = np.empty(len(o.data.vertices) * 3, F32); o.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
                lo, hi = co.min(0), co.max(0)
                co -= np.array([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]], F32)
                o.data.vertices.foreach_set('co', co.ravel()); o.data.update()
        protos[key] = c
    scatter.hide_protos()
    return protos


_PASS = {}


def for_scene(scene):
    """The detail pass for the open island (built on first use), or None if the island has no layers."""
    import importlib, json
    island = os.path.splitext(os.path.basename(bpy.data.filepath))[0]
    if island in _PASS:
        return _PASS[island]
    try:
        vegmod = importlib.import_module(island + '_veg')
    except ImportError:
        vegmod = None
    terrain = bpy.data.objects.get(island + '_terrain')
    if not vegmod or not hasattr(vegmod, 'layers') or terrain is None:
        print('DETAIL none for', island); _PASS[island] = None; return None
    t0 = time.time()
    from . import world, populate
    d, meta, H, sites = world.load_terrain_data(island)
    F = populate.Field(d, meta, H, step=2)
    protos = {c.name[2:]: c for c in bpy.data.collections if c.name.startswith('p_')}
    detail_protos(protos)
    coll = bpy.data.collections.get('detail') or bpy.data.collections.new('detail')
    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    from . import solids, core
    fp = os.path.join(core.BUILD, island + '.floors.npz')
    floors = solids.Floors.load(fp) if os.path.exists(fp) else None
    if floors is None:
        print('DETAIL no', fp, '(rebuild the island): added plants are not kept off floors')
    _PASS[island] = Pass(island, terrain, vegmod.layers, F, sites, protos, coll, floors=floors)
    print('DETAIL ready', island, '%.1fs' % (time.time() - t0))
    return _PASS[island]
