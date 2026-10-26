"""Instancing: points with rotation/scale/variant attributes, instanced from a collection with geometry nodes."""
import math
import bpy
import numpy as np
from .core import link, collection

_ng = {}


def _group(name='scatter_instance'):
    if name in _ng:
        return _ng[name]
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Collection', in_out='INPUT', socket_type='NodeSocketCollection')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes; L = ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    ci = N.new('GeometryNodeCollectionInfo'); ci.transform_space = 'ORIGINAL'
    ci.inputs['Separate Children'].default_value = True
    ci.inputs['Reset Children'].default_value = True
    L.new(gi.outputs['Collection'], ci.inputs['Collection'])
    iop = N.new('GeometryNodeInstanceOnPoints')
    iop.inputs['Pick Instance'].default_value = True
    L.new(gi.outputs['Geometry'], iop.inputs['Points'])
    L.new(ci.outputs[0], iop.inputs['Instance'])
    va = N.new('GeometryNodeInputNamedAttribute'); va.data_type = 'INT'; va.inputs['Name'].default_value = 'var'
    L.new(va.outputs['Attribute'], iop.inputs['Instance Index'])
    ra = N.new('GeometryNodeInputNamedAttribute'); ra.data_type = 'FLOAT_VECTOR'; ra.inputs['Name'].default_value = 'rot'
    e2r = N.new('FunctionNodeEulerToRotation')
    L.new(ra.outputs['Attribute'], e2r.inputs[0])
    L.new(e2r.outputs[0], iop.inputs['Rotation'])
    sa = N.new('GeometryNodeInputNamedAttribute'); sa.data_type = 'FLOAT_VECTOR'; sa.inputs['Name'].default_value = 'scl'
    L.new(sa.outputs['Attribute'], iop.inputs['Scale'])
    L.new(iop.outputs[0], go.inputs[0])
    _ng[name] = ng
    return ng


def instances(name, pts, protos_coll, coll=None, rot=None, scale=None, var=None, tilt=None, seed=0):
    """pts (n,3); rot: z-rotation (n,) or full euler (n,3); scale: (n,) or (n,3); var: (n,) ints."""
    n = len(pts)
    rng = np.random.default_rng(seed)
    if rot is None:
        rot = rng.uniform(0, 2 * np.pi, n)
    rot = np.asarray(rot, np.float32)
    if rot.ndim == 1:
        e = np.zeros((n, 3), np.float32); e[:, 2] = rot
        if tilt is not None:
            e[:, 0] = rng.normal(0, tilt, n); e[:, 1] = rng.normal(0, tilt, n)
        rot = e
    if scale is None:
        scale = np.ones(n, np.float32)
    scale = np.asarray(scale, np.float32)
    if scale.ndim == 1:
        scale = np.repeat(scale[:, None], 3, 1)
    if var is None:
        k = len(protos_coll.all_objects)
        var = rng.integers(0, max(1, k), n)
    me = bpy.data.meshes.new(name)
    me.vertices.add(n); me.vertices.foreach_set('co', np.asarray(pts, np.float32).ravel())
    me.attributes.new('rot', 'FLOAT_VECTOR', 'POINT').data.foreach_set('vector', rot.ravel())
    me.attributes.new('scl', 'FLOAT_VECTOR', 'POINT').data.foreach_set('vector', scale.ravel())
    me.attributes.new('var', 'INT', 'POINT').data.foreach_set('value', np.asarray(var, np.int32))
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    md = ob.modifiers.new('inst', 'NODES'); md.node_group = _group()
    for it in md.node_group.interface.items_tree:
        if it.name == 'Collection' and it.in_out == 'INPUT':
            md[it.identifier] = protos_coll
    return ob


def proto_collection(name):
    root = collection('_protos')
    root.hide_render = False
    c = collection(name, root)
    return c


def hide_protos():
    """Keep prototypes out of the render without breaking the instancer (exclude in view layer)."""
    vl = bpy.context.view_layer
    for lc in vl.layer_collection.children:
        if lc.name == '_protos':
            lc.exclude = True
