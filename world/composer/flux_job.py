#!/usr/bin/env python3
"""One FLUX picture for the composer, run in its own process so its memory is freed afterwards.

    ~/Projects/flux/.venv/bin/python world/composer/flux_job.py <spec.json>

spec: {previs: path, prompt, cast: [ids], seed, out: path}. The same request world/panels/flux.py sends
(the previs as image 1, each cast member cropped without a printed name, then the prompt), but from
files the composer has at hand rather than from a committed shot, so it is a trial: no provenance
record in the picture, a note beside it instead.
"""
import base64
import io
import json
import sys
import time
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
sys.path[:0] = [str(WORLD), str(WORLD / "panels")]
import fluxlocal  # noqa: E402
import pipeline  # noqa: E402


def size_for(w, h, area=1024 * 576):
    """The previs's shape at about the given area, both sides a multiple of 16."""
    k = (area / (w * h)) ** 0.5
    return round(w * k / 16) * 16, round(h * k / 16) * 16


def main(spec_path):
    spec = json.loads(Path(spec_path).read_text())
    previs = Image.open(spec["previs"]).convert("RGB")
    w, h = size_for(*previs.size)
    previs.thumbnail((1024, 1024))
    images = [previs]
    for cid in spec["cast"]:
        part = pipeline.cast_part(pipeline.CAST / f"{cid}.png", cid, label=False)   # FLUX copies printed names
        im = Image.open(io.BytesIO(base64.b64decode(part["data"]))).convert("RGB")
        im.thumbnail((512, 512))
        images.append(im)
    t = time.time()
    out = fluxlocal.generate(fluxlocal.pipe(), spec["prompt"], images, w, h, spec["seed"])
    out.save(spec["out"], "PNG")
    note = dict(spec, model=fluxlocal.model(seed=spec["seed"], width=w, height=h), seconds=round(time.time() - t),
                made=time.strftime("%Y-%m-%dT%H:%M:%S"))
    Path(spec["out"]).with_suffix(".json").write_text(json.dumps(note, indent=1, ensure_ascii=False))
    print("DONE", spec["out"], flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
