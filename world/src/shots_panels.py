"""Cameras for book pictures, for render.py: read from the spec file world/panels/previs.py writes.

Each entry names its island and, optionally, a world shot ("base") from shots_arche or shots_paxos whose
camera, light and lights it starts from; any of cam, target, lens, light, sun_from, res, hide, lights,
dof given in the entry replace the base's. The spec file is named by the PANEL_SPECS environment
variable.

Positions can be given two ways besides world metres:
  "site": "chamber"   cam and target are in that building's own frame: x along the axis its door faces,
                      y to the left, z up from its floor (the chamber, the tholos, the oracle), so a
                      shot stays framed on the building wherever the terrain puts it
  a height "+1.7"     1.7 m above the ground at that point (world positions only)

"props" lists the things a shot places for itself (blib/panel_props.py: cheese, sandglass; animals are
described in the prompt, never modelled), each with "at" in the same terms, "face" in degrees (from the
site's door when there is a site) or a point to face, and optionally "scale"; they are built just before the shot renders and cleared
before the next.
"""
import importlib
import json
import math
import os

KEYS = ("cam", "target", "lens", "light", "sun_from", "res", "hide", "lights", "dof", "light_override", "hazeD", "hazeS")


def frame(mod, site):
    """(x, y, z of the floor, angle the door faces) for a building."""
    S = mod.SITES
    s = S[site]
    if site == "chamber":   # as build_paxos places it: the door looks across the bay to the Tholos
        face = math.atan2(S["tholos"]["y"] - s["y"], S["tholos"]["x"] - s["x"])
        return s["x"], s["y"], s["z"] + 1.02, face
    return s["x"], s["y"], s["z"], s.get("face", s.get("ang", 0.0))


def place(mod, p, fr):
    if fr:
        x0, y0, z0, a = fr
        c, s = math.cos(a), math.sin(a)
        return (x0 + p[0] * c - p[1] * s, y0 + p[0] * s + p[1] * c, z0 + p[2])
    z = p[2]
    if isinstance(z, str):
        z = mod.gz(p[0], p[1]) + float(z)
    return (float(p[0]), float(p[1]), float(z))


def props(mod, items, fr):
    """A shot's props with their positions in world metres, for blib.panel_props.place."""
    out = []
    for p in items:
        q = dict(p, at=place(mod, p["at"], fr))
        face = p.get("face", 0.0)
        if isinstance(face, (list, tuple)):
            q["face"] = list(place(mod, list(face[:2]) + [0.0], fr)[:2])
        elif fr:
            q["face"] = face + math.degrees(fr[3])
        out.append(q)
    return out


def shots():
    specs = json.load(open(os.environ["PANEL_SPECS"]))
    mods, out = {}, {}
    for name, sp in specs.items():
        island = sp["island"]
        if island not in mods:
            mods[island] = (importlib.import_module(f"shots_{island}"),)
            mods[island] += (mods[island][0].shots(),)
        mod, bases = mods[island]
        sh = dict(bases[sp["base"]]) if sp.get("base") else {}
        fr = frame(mod, sp["site"]) if sp.get("site") else None
        for k, v in sp.items():
            if k in ("cam", "target"):
                sh[k] = place(mod, v, fr)
            elif k == "res":
                sh[k] = tuple(v)
            elif k in KEYS:
                sh[k] = v
        from blib import panel_props  # inside Blender only
        sh["pre"] = (lambda scene, P=props(mod, sp.get("props", []), fr): panel_props.place(P))
        out[name] = sh
    return out
