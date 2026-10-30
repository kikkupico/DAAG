#!/usr/bin/env python3
"""Trial book pictures with local FLUX.2 klein 4B instead of the paid Gemini API.

    ~/Projects/flux/.venv/bin/python world/panels/flux.py <previs.png | folder ...> [--style ligne-claire] [--seed N]

The same request pipeline.py sends (the previs as image 1, each cast member cropped, the style's prompt,
the shot's prompt, the note on who is whom and the head count, all from the shot at the previs's
commit), with one difference: the crops carry no printed names, since FLUX copies the text into the
picture. It runs on FLUX locally: free, about a minute a picture, and weaker at keeping the
previs's camera and at following counts and negations, so it is for trials. To fit the 24 GB Mac the
previs goes in at 1024 px and each cast picture at 512, the picture is made at about a megapixel in the
previs's shape, and every picture runs in a process of its own.

Output: flux-scene-<version>.png or flux-ligne-claire-<version>.png beside the previs, so a trial never
replaces a Gemini picture, with its record (world/provenance.py): the commit, the shot, FLUX with its
weights' revision and settings, and the previs and cast pictures with their hashes.
"""
import base64
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image

import pipeline
from pipeline import WORLD, provenance

sys.path.insert(0, str(WORLD))
import fluxlocal  # noqa: E402


def size_for(previs, area=1024 * 576):
    """The previs's shape at about the given area, both sides a multiple of 16."""
    w, h = Image.open(previs).size
    k = (area / (w * h)) ** 0.5
    return round(w * k / 16) * 16, round(h * k / 16) * 16


def one(previs, style, seed):
    prompt, parts, aspect, dest, rec = pipeline.request(previs, style, labels=False)  # FLUX copies printed names
    provenance.commit(Path(__file__), WORLD / "fluxlocal.py")
    ims = []
    for i, part in enumerate(parts):
        im = Image.open(io.BytesIO(base64.b64decode(part["data"]))).convert("RGB")
        im.thumbnail((1024, 1024) if i == 0 else (512, 512))
        ims.append(im)
    w, h = size_for(previs)
    out = fluxlocal.generate(fluxlocal.pipe(), prompt, ims, w, h, seed)
    dest = dest.with_name("flux-" + dest.name)
    rec = dict(rec, model=fluxlocal.model(seed=seed, width=w, height=h, style=style))
    pipeline.save(base64.b64encode(_png(out)).decode(), dest, rec)
    print(f"  {provenance.rel(dest)}", flush=True)


def _png(im):
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def main():
    style, args = pipeline.style_of(sys.argv[1:])
    seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 7
    args = [a for a in args if a not in ("--seed", str(seed))]
    if not args:
        sys.exit(__doc__)
    inputs = pipeline.previs_inputs(args)
    if len(inputs) == 1:
        return one(inputs[0], style, seed)
    for previs in inputs:  # one picture to a process, so memory is freed between them
        subprocess.run([sys.executable, __file__, str(previs), "--style", style, "--seed", str(seed)], check=False)


if __name__ == "__main__":
    main()
