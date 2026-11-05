#!/usr/bin/env python3
"""The home page chart: the two island builds rendered, laid out on one canvas, then drawn as a chart by Gemini.

    python3 world/src/chart_gen.py layout            render both islands (chart_views.py), lay them out
                                                     (chart_layout.py) -> world/renders/chart/layout.png
    python3 world/src/chart_gen.py submit            send the layout, with the current chart as a style
                                                     reference, to the Gemini Batch API (Nano Banana 2, 2K)
    python3 world/src/chart_gen.py fetch [job]       save the finished chart as world/renders/chart/chart-<job>.png

Commit the scripts first: the pictures' records name the commit (world/provenance.py).
"""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "panels"))

import base64
import io

from PIL import Image

import gemini
import provenance

WORLD = Path(__file__).resolve().parent.parent
OUT = WORLD / "renders" / "chart"
STYLE_REF = WORLD.parent / "archive" / "art" / "full-map-cartographic.jpeg"
SCRIPTS = ["world/src/chart_views.py", "world/src/chart_layout.py", "world/src/chart_gen.py", "world/provenance.py"]
BATCH = gemini.Batch(WORLD / "panels" / "batches", "daag-chart")

PROMPT = (
    "Image 1 is a tilted top-down render of two islands on a flat blue sea: a round island with a star-shaped bare "
    "mountain at its centre in the top-left, and a larger, long, ragged island with deep bays running along the "
    "diagonal to the bottom-right. Redraw it as an antique sepia copperplate sea chart in the drawing style of image 2, "
    "which is a reference for the style only: do not copy its island shapes. "
    "Keep both islands exactly as image 1 has them: every coastline, bay and headland, each island's position, size and "
    "orientation, the mountain, the thin winding roads and the small harbour towns on the shore. "
    "Show the relief with fine hachures, the shallows with parallel coast lines, the sea with small engraved waves, "
    "and add rhumb lines and a compass rose in the empty top-right corner. Warm cream paper, brown ink. "
    "No lettering, numbers or text anywhere on the chart."
)


def run(cmd):
    subprocess.run(cmd, check=True, cwd=WORLD.parent)


def layout():
    at = provenance.commit(*SCRIPTS)
    OUT.mkdir(parents=True, exist_ok=True)
    for island in ("arche", "paxos"):
        run(["blender", "-b", f"world/build/{island}.blend", "-P", "world/src/chart_views.py", "--",
             str(OUT / f"view-{island}.png"), "25", "12000", "2000"])
    out = OUT / "layout.png"
    run([sys.executable, "world/src/chart_layout.py", str(OUT / "view-arche.png"), str(OUT / "view-paxos.png"), str(out)])
    im = Image.open(out)
    rec = provenance.record("scene", {"name": "Blender (Cycles) with PIL", "where": "local"}, at,
                            source={"file": "world/src/chart_layout.py", "builds": [provenance.island(i) for i in ("arche", "paxos")]})
    provenance.stamp(im, out, rec)
    print("layout ->", out)


def submit():
    layout_png = OUT / "layout.png"
    at = provenance.commit(*SCRIPTS)
    rec = provenance.read(layout_png)
    if not rec or rec.get("commit") != at["commit"]:
        sys.exit("layout.png was not made at this commit: run `chart_gen.py layout` again")
    req = [{"key": "chart", "prompt": PROMPT, "aspect": "1:1",
            "images": [gemini.part(layout_png, 2048), gemini.part(STYLE_REF, 2048)],
            "meta": {"prompt": PROMPT, "inputs": [provenance.picture("layout", layout_png),
                                                  provenance.picture("style", STYLE_REF)]}}]
    stamp = BATCH.submit(req, size="2K")
    print(f"python3 world/src/chart_gen.py fetch {stamp}")


def fetch(args):
    def save(key, meta, data, where):
        at = provenance.commit(*SCRIPTS)
        job = where.split("/")[-1]
        rec = provenance.record("scene", {"name": gemini.MODEL, "where": where, "settings": {"size": "2K", "aspect": "1:1"}},
                                at, source={"file": "world/src/chart_gen.py", "prompt": meta["prompt"]}, inputs=meta["inputs"])
        im = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
        provenance.stamp(im, OUT / f"chart-{job[:10]}.png", rec)
        print("saved", OUT / f"chart-{job[:10]}.png")
    BATCH.fetch(save, args[0] if args else None)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"layout": layout, "submit": submit, "fetch": lambda: fetch(sys.argv[2:])}.get(cmd, lambda: sys.exit(__doc__))()
