#!/usr/bin/env python3
"""Ligne claire redraw of a finished picture, for covers. A step of its own, run on any picture.

    python3 world/panels/comic.py <picture> [<out>]                 out defaults to <picture>-comic.png
    IMAGE_MODEL=lite python3 world/panels/comic.py <picture>         another model (nb2, lite, pro)
    COMIC_PROMPT="..." python3 world/panels/comic.py <picture>       another prompt for this picture

The picture is redrawn in the manner of Hergé and Edgar P. Jacobs with everything kept where it is.
The output keeps the picture's aspect, through the same Gemini
call as pipeline.py (Nano Banana 2 at 1K by default), and records the picture it redrew and its hash.
"""
import os
import sys
from pathlib import Path

from pipeline import MODEL, REPO, aspect_of, digest, generate, part

PROMPT = os.environ.get("COMIC_PROMPT") or (
    "Redraw image 1 as a Franco-Belgian ligne claire comic illustration in the manner of Hergé and Edgar P. "
    "Jacobs: clean black ink outlines of even weight, flat areas of clear colour with no gradients, no hatching "
    "and very little shading, detailed accurate architecture, readable figures. Keep the composition, the camera, "
    "and every person, animal, object and building exactly where they are, with the same faces, costumes and "
    "colours. One single illustration. No lettering, no title, no speech balloons, no captions, no logos, no "
    "signature, no panel border.")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else src.with_name(src.stem + "-comic.png")
    rec = {"comic_of": str(src.relative_to(REPO)) if src.is_relative_to(REPO) else str(src),
           "source_hash": digest(src), "model": MODEL, "prompt": PROMPT}
    generate([part(src, 1920)], PROMPT, aspect_of(src), out, rec)


if __name__ == "__main__":
    main()
