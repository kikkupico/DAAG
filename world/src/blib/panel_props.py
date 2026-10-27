"""Props a book shot places for itself: cheese wheels, a sandglass. Built into the scene just before
the shot renders (shots_panels.py) and cleared before the next, so the island model itself is unchanged.

A prop is {"kind", "at": [x, y, z], "face": degrees or [x, y] to face, "scale"}; positions are already
in world metres when they reach place(). Every kind is modelled at true size, in metres, standing on
z = 0 and facing +x. Things only: animals are never modelled; a shot describes them in its prompt and the
image model draws them.
"""
import math

import bpy
from mathutils import Matrix, Vector

from .kit import Kit, T, Rz, S
from . import core
from . import mats as M

PI = math.pi
COLL = "panel_props"


def _mats():
    m = {}
    m["cheese"] = M.flat("cheese_rind", (0.78, 0.66, 0.4, 1), 0.65, sss=0.05)
    m["timber"] = bpy.data.materials.get("timber") or M.timber()
    m["sand"] = M.flat("sandglass_sand", (0.72, 0.6, 0.42, 1), 0.9)
    m["glass"] = glass()
    return m


def glass():
    g = bpy.data.materials.get("sandglass_glass")
    if g:
        return g
    g = bpy.data.materials.new("sandglass_glass")
    g.use_nodes = True
    p = g.node_tree.nodes.get("Principled BSDF")
    for key, val in (("Base Color", (0.9, 0.93, 0.9, 1)), ("Roughness", 0.05), ("Transmission Weight", 1.0), ("IOR", 1.5)):
        if key in p.inputs:
            p.inputs[key].default_value = val
    return g


def cheese_wheel(k):
    """A whole wheel of hard cheese, 0.44 m across and 0.13 m high, its edges rounded."""
    r, h, e = 0.22, 0.13, 0.025
    prof = [(0.0, 0.0), (r - e, 0.0), (r - e * 0.3, e * 0.3), (r, e), (r, h - e), (r - e * 0.3, h - e * 0.3),
            (r - e, h), (0.0, h)]
    k.lathe("cheese", prof, seg=40)


def sandglass(k):
    """A small sandglass in a turned wooden frame, 0.22 m high: two glass bulbs, the lower half full of sand."""
    for z in (0.0, 0.2):
        k.cyl("timber", 0.065, z, z + 0.02, seg=24)
    for i in range(3):
        a = 2 * PI * i / 3
        k.push(T(0.052 * math.cos(a), 0.052 * math.sin(a), 0.0)); k.cyl("timber", 0.007, 0.02, 0.2, seg=8); k.pop()
    bulb = [(0.004, 0.0), (0.03, 0.01), (0.042, 0.035), (0.03, 0.07), (0.006, 0.09)]
    k.push(T(0, 0, 0.02)); k.lathe("glass", bulb, seg=24); k.pop()
    k.push(T(0, 0, 0.2) @ S(1, 1, -1)); k.lathe("glass", bulb, seg=24); k.pop()
    k.push(T(0, 0, 0.022)); k.lathe("sand", [(0.0, 0.0), (0.028, 0.008), (0.036, 0.025), (0.0, 0.05)], seg=20); k.pop()


KINDS = {"cheese": cheese_wheel, "sandglass": sandglass}


PROTO_EXTRA = {"merchantman": ["merchant_sail"]}      # prototypes drawn together with another


def proto_objects(name):
    """The prototype meshes of a live prop, by the id the composer's catalog uses: an object name (cart_0,
    amphora_1) or the one object of a collection (p_handcart, p_ionic); a ship comes with its sail."""
    obs = [o for o in bpy.data.objects if o.name == name and o.type == "MESH"]
    if not obs and bpy.data.collections.get("p_" + name):
        obs = [o for o in bpy.data.collections["p_" + name].objects if o.type == "MESH"][:1]
    for stem in PROTO_EXTRA.get(name, []):
        if bpy.data.collections.get("p_" + stem):
            obs += [o for o in bpy.data.collections["p_" + stem].objects if o.type == "MESH"]
    if not obs:
        raise KeyError(f"no prototype '{name}' in this island")
    return obs


def place_proto(p, coll, i):
    """A copy of a prototype at p["at"], turned to p["face"] and scaled, standing on z and centred on its footprint
    as the composer shows it. The copies share the prototype's mesh and materials."""
    obs = proto_objects(p["proto"])
    pts = [o.matrix_world @ Vector(v) for o in obs for v in o.bound_box]
    lo = [min(v[k] for v in pts) for k in range(3)]
    hi = [max(v[k] for v in pts) for k in range(3)]
    settle = Matrix.Translation((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))
    x, y, z = p["at"]
    face = p.get("face", 0.0)
    a = math.atan2(face[1] - y, face[0] - x) if isinstance(face, (list, tuple)) else math.radians(face)
    s = p.get("scale", 1.0)
    put = Matrix.Translation((x, y, z)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Diagonal((s, s, s, 1.0))
    for o in obs:
        ob = bpy.data.objects.new(f"prop_{p['proto']}_{i}", o.data)
        ob.matrix_world = put @ settle @ o.matrix_world
        coll.objects.link(ob)


def clear():
    coll = bpy.data.collections.get(COLL)
    if coll:
        for ob in list(coll.objects):
            bpy.data.objects.remove(ob, do_unlink=True)


def place(props):
    """Clear the last shot's props, then build these."""
    clear()
    if not props:
        return
    coll = bpy.data.collections.get(COLL) or core.collection(COLL)
    mats = _mats()
    for i, p in enumerate(props):
        if p["kind"] == "proto":
            place_proto(p, coll, i)
            continue
        x, y, z = p["at"]
        face = p.get("face", 0.0)
        a = math.atan2(face[1] - y, face[0] - x) if isinstance(face, (list, tuple)) else math.radians(face)
        k = Kit(seed=i)
        k.push(T(x, y, z) @ Rz(a) @ S(p.get("scale", 1.0)))
        KINDS[p["kind"]](k)
        k.pop()
        k.build(f"prop_{p['kind']}_{i}", mats, coll, smooth=p["kind"] != "sandglass" or 30)
