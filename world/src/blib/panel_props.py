"""Props a book shot places for itself: goats, cheese wheels, a sandglass. Built into the scene just before
the shot renders (shots_panels.py) and cleared before the next, so the island model itself is unchanged.

A prop is {"kind", "at": [x, y, z], "face": degrees or [x, y] to face, "scale", "colour"}; positions are
already in world metres when they reach place(). Every kind is modelled at true size, in metres, standing
on z = 0 and facing +x.
"""
import math

import bpy

from .kit import Kit, T, Rz, Ry, S
from . import core
from . import mats as M

PI = math.pi
COLL = "panel_props"
COLOURS = {"black": (0.022, 0.02, 0.018, 1), "brown": (0.16, 0.09, 0.05, 1), "white": (0.72, 0.68, 0.6, 1)}


def _mats():
    m = {}
    for name, col in COLOURS.items():
        m["goat_" + name] = M.flat("goat_" + name, col, 0.85, sss=0.02)
    m["horn"] = M.flat("goat_horn", (0.12, 0.1, 0.08, 1), 0.55)
    m["hoof"] = M.flat("goat_hoof", (0.04, 0.035, 0.03, 1), 0.5)
    m["eye"] = M.flat("goat_eye", (0.25, 0.18, 0.05, 1), 0.2)
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


def _ellipsoid(k, mat, rx, ry, rz, seg=20, rings=10):
    """An ellipsoid about the current origin: a lathe about z, scaled."""
    prof = [(math.sin(PI * i / rings) * 1.0, -math.cos(PI * i / rings) * 1.0) for i in range(rings + 1)]
    prof[0] = (0.0, prof[0][1]); prof[-1] = (0.0, prof[-1][1])
    k.push(S(rx, ry, rz)); k.lathe(mat, prof, seg=seg); k.pop()


def goat(k, colour="black"):
    """A small Aegean goat, about 0.75 m at the shoulder: body, neck, head with beard, horns swept back,
    ears, four legs with hooves, a short upturned tail."""
    hair = "goat_" + colour
    sh = 0.72                                                  # height of the back
    k.push(T(0, 0, sh - 0.17)); _ellipsoid(k, hair, 0.48, 0.2, 0.2); k.pop()               # barrel
    k.push(T(0.32, 0, sh - 0.08)); _ellipsoid(k, hair, 0.2, 0.17, 0.2); k.pop()            # chest and withers
    k.push(T(-0.36, 0, sh - 0.12)); _ellipsoid(k, hair, 0.18, 0.18, 0.17); k.pop()         # rump
    k.push(T(0.52, 0, sh + 0.06) @ Ry(-0.9)); _ellipsoid(k, hair, 0.18, 0.08, 0.09); k.pop()   # neck
    k.push(T(0.66, 0, sh + 0.2) @ Ry(0.5)); _ellipsoid(k, hair, 0.14, 0.075, 0.08); k.pop()    # head
    k.push(T(0.77, 0, sh + 0.13) @ Ry(0.6)); _ellipsoid(k, hair, 0.07, 0.05, 0.055); k.pop()   # muzzle
    k.push(T(0.74, 0, sh + 0.04)); _ellipsoid(k, hair, 0.03, 0.025, 0.07); k.pop()          # beard
    for s in (-1, 1):
        k.push(T(0.7, s * 0.06, sh + 0.24)); _ellipsoid(k, "eye", 0.014, 0.012, 0.012, seg=8, rings=4); k.pop()   # eyes
        k.push(T(0.64, s * 0.065, sh + 0.24) @ Rz(s * 1.2) @ Ry(0.3)); _ellipsoid(k, hair, 0.075, 0.02, 0.03); k.pop()  # ears
        pts = [(0.62, s * 0.03, sh + 0.27)]                    # horns: up and back in a curve
        for i in range(1, 7):
            t = i / 6
            pts.append((0.62 - 0.2 * t, s * (0.03 + 0.05 * t), sh + 0.27 + 0.16 * math.sin(t * 1.9)))
        for i, (a, b) in enumerate(zip(pts[:-1], pts[1:])):
            w = 0.035 * (1 - 0.7 * i / 6)
            k.beam("horn", a, b, w, w)
        for x in (0.3, -0.36):                                 # legs, with knees and hooves
            k.beam(hair, (x, s * 0.11, sh - 0.25), (x + 0.01, s * 0.1, 0.3), 0.07, 0.07)
            k.beam(hair, (x + 0.01, s * 0.1, 0.3), (x, s * 0.1, 0.05), 0.04, 0.04)
            k.box("hoof", x - 0.03, s * 0.1 - 0.025, 0.0, x + 0.04, s * 0.1 + 0.025, 0.05)
    k.beam(hair, (-0.5, 0, sh - 0.03), (-0.58, 0, sh + 0.06), 0.05, 0.035)                # tail


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


KINDS = {"goat": goat, "cheese": cheese_wheel, "sandglass": sandglass}


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
        x, y, z = p["at"]
        face = p.get("face", 0.0)
        a = math.atan2(face[1] - y, face[0] - x) if isinstance(face, (list, tuple)) else math.radians(face)
        k = Kit(seed=i)
        k.push(T(x, y, z) @ Rz(a) @ S(p.get("scale", 1.0)))
        fn = KINDS[p["kind"]]
        fn(k, p["colour"]) if "colour" in p else fn(k)
        k.pop()
        k.build(f"prop_{p['kind']}_{i}", mats, coll, smooth=p["kind"] != "sandglass" or 30)
