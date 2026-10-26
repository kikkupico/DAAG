#!/usr/bin/env python3
"""Previs: render a book's shots from the world model, each image traceable to the shot that made it.

    python3 world/panels/previs.py <book> [shot ...] [--quality check|preview|final] [--size 1K|2K]

A shot in world/panels/<book>/shots.json names its island and the camera to render:

    "tholos": {"island": "paxos", "base": "tholos_interior", "lens": 28,
               "cast": ["okios", "liskovia", "tholos-runner"],
               "prompt": "The man from image 2 sits on the stone seat on the round podium; ..."}

"base" is a world shot (world/src/shots_arche.py or shots_paxos.py) whose camera and light it starts
from; cam, target, lens, light, sun_from, res and the other camera keys override it, and a shot that
gives cam and target may leave base out (world/src/shots_panels.py). cast, prompt and keep are for
the scene step and travel with the image.

The shot's version is the hash of its entry, so the image is world/panels/<book>/<shot>/previs-<hash>.png
and an older version of the shot keeps its own image. The image carries its record (world/provenance.py):
the commit, the shot (shots.json, its name and version), the island build it was rendered from (world/
build/<island>.build.json, checked against the .blend, with the commit it was built at) and the render
settings. The script refuses to run while shots.json or the world scripts have uncommitted changes, or
the island build was not made at a commit. The scene step (pipeline.py, batch.py) reads the cast and
prompt from shots.json at the previs's commit, never from the current file. Render quality "check" is
full size at a few samples, enough for a previs.

The previs is rendered at the size of the picture it becomes: the 1K size Gemini gives the shot's
"aspect" (16:9 unless the shot says otherwise; --size 2K for the 2K size), so the frame matches
exactly and no pixel is drawn that the model would only scale away. A shot's own "res" wins.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
REPO = WORLD.parent
sys.path.insert(0, str(WORLD))
import provenance  # noqa: E402
OUT_DIR = {"preview": "preview", "check": "check"}
# Gemini 3.1 Flash Image output sizes (image generation docs), 1K and 2K, by aspect
SIZES = {"1:1": (1024, 1024), "2:3": (848, 1264), "3:2": (1264, 848), "3:4": (896, 1200), "4:3": (1200, 896),
         "4:5": (928, 1152), "5:4": (1152, 928), "9:16": (768, 1376), "16:9": (1376, 768), "21:9": (1584, 672)}


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True).stdout.strip()


def version(shot):
    return hashlib.sha256(json.dumps(shot, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:10]


def main():
    args = sys.argv[1:]
    quality = args[args.index("--quality") + 1] if "--quality" in args else "check"
    size = args[args.index("--size") + 1] if "--size" in args else "1K"
    args = [a for a in args if a not in ("--quality", quality, "--size", size)]
    scale = {"1K": 1, "2K": 2}[size]
    if not args:
        sys.exit(__doc__)
    book, names = args[0], args[1:]
    shots_path = HERE / book / "shots.json"
    shots = json.loads(shots_path.read_text())
    names = names or list(shots)
    rel = str(shots_path.relative_to(REPO))
    at = provenance.commit(shots_path, HERE / "previs.py", WORLD / "src", WORLD / "provenance.py")
    blender = subprocess.run(["blender", "--version"], capture_output=True, text=True).stdout.splitlines()[0]
    by_island = {}
    for name in names:
        by_island.setdefault(shots[name]["island"], []).append(name)
    for island, group in by_island.items():
        build = provenance.island(island)  # refuses an island build that is not tied to a commit
        specs = {f"panel__{book}__{n}": dict(shots[n], res=shots[n].get("res") or
                 [d * scale for d in SIZES[shots[n].get("aspect", "16:9")]]) for n in group}
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(specs, f)
        env = dict(os.environ, PANEL_SPECS=f.name)
        t = time.time()
        done = subprocess.run(["blender", "-b", f"build/{island}.blend", "-P", "src/render.py", "--", "shots_panels",
                               ",".join(specs), quality], cwd=WORLD, env=env, capture_output=True, text=True)
        os.unlink(f.name)
        if done.returncode != 0 or "SHOT" not in done.stdout:
            sys.exit(f"blender failed for {island}:\n{done.stdout[-1500:]}\n{done.stderr[-1500:]}")
        for n in group:
            shot, v = shots[n], version(shots[n])
            src = WORLD / "renders" / OUT_DIR.get(quality, "final") / f"panel__{book}__{n}.png"
            dest = HERE / book / n / f"previs-{v}.png"
            rec = provenance.record(
                "previs", {"name": blender, "where": "local",
                           "settings": {"quality": quality, "res": specs[f"panel__{book}__{n}"]["res"]}}, at,
                source={"file": rel, "shot": n, "version": v}, island=build)
            provenance.stamp(Image.open(src), dest, rec)
            src.unlink()
            print(f"  {dest.relative_to(REPO)}  {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main()
