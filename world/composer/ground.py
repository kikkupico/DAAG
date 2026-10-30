#!/usr/bin/env python3
"""Paint the ground colour texture the composer's island model uses.

    python3 world/composer/ground.py <island>

Reads world/build/terrain/<island>/ (height.npy, meta.json, mask_*.png) and writes
world/build/composer/<island>_ground.png: earth, sand, rock, road and built-ground colours from the
masks, a hillshade of the heights, the sea floor darkened. export_glb.py maps it onto the ground mesh.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

WORLD = Path(__file__).resolve().parent.parent
SIZE = 2048

COLOURS = (("sand", (0.78, 0.72, 0.56)), ("rock", (0.52, 0.50, 0.46)), ("cliff", (0.58, 0.56, 0.52)),
           ("road", (0.60, 0.54, 0.44)), ("path", (0.58, 0.52, 0.42)), ("cut", (0.62, 0.58, 0.50)),
           ("clearing", (0.60, 0.56, 0.44)), ("built", (0.68, 0.64, 0.56)), ("quay", (0.70, 0.67, 0.60)))


def main(island):
    d = WORLD / "build" / "terrain" / island
    meta = json.loads((d / "meta.json").read_text())
    H = np.load(d / "height.npy", mmap_mode="r")
    step = H.shape[0] // SIZE
    h = np.asarray(Image.fromarray(np.asarray(H[::step, ::step], np.float32)).resize((SIZE, SIZE), Image.BILINEAR))

    def mask(key):
        p = d / f"mask_{key}.png"
        if not p.exists():
            return None
        return np.asarray(Image.open(p).convert("L").resize((SIZE, SIZE), Image.BILINEAR), np.float32)[..., None] / 255

    col = np.empty((SIZE, SIZE, 3), np.float32)
    col[:] = (0.50, 0.44, 0.30)                      # dry earth
    for key, c in COLOURS:
        m = mask(key)
        if m is not None:
            col = col * (1 - m) + np.array(c, np.float32) * m
    gy, gx = np.gradient(h, meta["px"] * (H.shape[0] / SIZE))
    shade = np.clip(0.8 + 1.8 * (-gx - gy) / np.sqrt(2), 0.45, 1.25)[..., None]    # sun from the north-west
    col *= shade
    sea = np.clip(h / -20, 0, 1)[..., None]
    col = col * (1 - sea) + np.array((0.12, 0.2, 0.22), np.float32) * sea
    out = WORLD / "build" / "composer" / f"{island}_ground.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(out)
    print("WROTE", out)


if __name__ == "__main__":
    main(sys.argv[1])
