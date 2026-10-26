"""Cameras for book pictures, for render.py: read from the spec file world/panels/previs.py writes.

Each entry names its island and, optionally, a world shot ("base") from shots_arche or shots_paxos whose
camera and light it starts from; any of cam, target, lens, light, sun_from, res, hide, lights, dof given
in the entry replace the base's. The spec file is named by the PANEL_SPECS environment variable.
"""
import importlib
import json
import os

KEYS = ("cam", "target", "lens", "light", "sun_from", "res", "hide", "lights", "dof", "light_override", "hazeD", "hazeS")


def shots():
    specs = json.load(open(os.environ["PANEL_SPECS"]))
    bases = {}
    out = {}
    for name, sp in specs.items():
        island = sp["island"]
        if island not in bases:
            bases[island] = importlib.import_module(f"shots_{island}").shots()
        sh = dict(bases[island][sp["base"]]) if sp.get("base") else {}
        sh.update({k: (tuple(v) if k in ("cam", "target", "res") else v) for k, v in sp.items() if k in KEYS})
        out[name] = sh
    return out
