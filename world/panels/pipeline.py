#!/usr/bin/env python3
"""Book pictures: a previs image with the cast put into it, as a photograph.

    python3 world/panels/pipeline.py <previs.png | folder> ...             previs -> scene
    IMAGE_MODEL=lite IMAGE_SIZE=2K python3 world/panels/pipeline.py ...    another model (nb2, lite, pro) or size

The input is a previs image made by previs.py, world/panels/<book>/<shot>/previs-<version>.png. A folder
stands for the newest previs of every shot under it, so world/panels/<book> is a whole book. The
cast and prompt are read from shots.json at the commit the previs names, never from the current file:
the picture is made from the shot exactly as it was when its previs was rendered.

The previs is image 1. The shot's cast are named by their ids in world/cast/cast.json, and follow as
the fewest cast sheets that hold them (world/cast/out/<CAST>/sheets, CAST=nb2 by default), each sheet
one image with every person's id printed below them; the shot's prompt names people by those ids.
The prompt is appended to KEEP, which turns the previs into a photograph without moving anything, and
is followed by a note on the sheets and a head count; a shot with "keep": false sends its prompt
without KEEP. The aspect is the previs's. Output: scene-<version>.png beside the previs, at the size
the model returns, with its record inside it (world/provenance.py): the commit (the prompt is this
script's at that commit, with the shot's own), the shot, the model and its settings, and the previs
and each sheet with their hashes and commits; a new take replaces the last. It refuses to run while
this script, batch.py or world/gemini.py has uncommitted changes.

Generation runs on Nano Banana 2 (gemini-3.1-flash-image) at 1K through world/gemini.py, with
GEMINI_API_KEY. Only people are generated: buildings and props come from the previs. The usual
route is batch.py, the same pictures through the Batch API at half the price; this script is for a
single take that is needed at once. comic.py is the separate ligne claire step.
"""
import base64
import hashlib
import io
import json
import os
import sys
import time
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
REPO = WORLD.parent
sys.path.insert(0, str(WORLD))
import gemini  # noqa: E402
import provenance  # noqa: E402
from gemini import MODEL, SIZE, part  # noqa: E402,F401  (comic.py and batch.py take these from here)

SHEETS = WORLD / "cast/out" / os.environ.get("CAST", "nb2") / "sheets"
ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
KEEP = ("Turn image 1 into a real photograph of the same place: keep its camera, framing, buildings, objects and "
        "layout exactly, and make the ground, plants, stone, cloth and light fully photographic. Hellenistic Greece, "
        "3rd century BC; nothing modern. Every building is in daily use, clean and well kept: no ruin, no weeds between the "
        "stones. Everything behind the people stays as it is in image 1, the same hills, trees, bushes and buildings, with "
        "nothing built that image 1 does not show. Natural daylight; people at true scale, with real shadows on the ground.")
SHEET_NOTE = ("{which} reference {sheet} of people, each standing above their name. Put into the photograph only {names}, "
              "each with exactly the face, build and clothes shown above their name. The names are labels only and "
              "appear nowhere in the photograph.")


def aspect_of(path):
    w, h = Image.open(path).size
    return min(ASPECTS, key=lambda a: abs(int(a.split(":")[0]) / int(a.split(":")[1]) - w / h))


def shot_of(previs):
    """The shot a previs was rendered from: its entry in shots.json at the previs's commit, checked
    against the version the previs records. (A trial previs made with DAAG_ALLOW_DIRTY may match the
    working copy instead.)"""
    rec = provenance.read(previs)
    if not rec or rec.get("kind") != "previs":
        sys.exit(f"{previs}: no previs record; make previs images with previs.py")
    src = rec["source"]
    for entry in (provenance.at_commit(rec["commit"], src["file"], src["shot"]),
                  json.loads((REPO / src["file"]).read_text()).get(src["shot"])):
        if entry and hashlib.sha256(json.dumps(entry, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:10] \
                == src["version"]:
            return src, entry
    sys.exit(f"{previs}: shot {src['shot']} version {src['version']} is neither at {rec['commit']} nor in the working copy")


def previs_inputs(args):
    """Previs files named, and for each folder the newest previs of every shot folder under it."""
    out = []
    for a in args:
        p = Path(a).resolve()
        if p.is_file():
            out.append(p)
            continue
        newest = {}
        for f in p.rglob("previs-*.png"):
            if f.parent not in newest or f.stat().st_mtime > newest[f.parent].stat().st_mtime:
                newest[f.parent] = f
        out += sorted(newest.values())
    if not out:
        sys.exit("no previs images found")
    return out


def sheets_for(ids):
    """The fewest cast sheets that hold all the given people, from the records the sheets carry."""
    holds = {}
    for sheet in sorted(SHEETS.glob("*.png")):
        rec = provenance.read(sheet) or {}
        holds[sheet] = {i["role"].removeprefix("cast ") for i in rec.get("inputs", [])}
    lost = set(ids) - set().union(*holds.values()) if holds else set(ids)
    if lost:
        sys.exit(f"no sheet in {provenance.rel(SHEETS)} holds {sorted(lost)}; make them with world/cast/gen.py")
    chosen, left = [], set(ids)
    while left:
        best = max(holds, key=lambda s: (len(holds[s] & left), -len(holds[s])))
        chosen.append(best)
        left -= holds[best]
    return chosen


def request(previs):
    """What one previs sends: (prompt, images as parts, aspect, where the picture goes, its record)."""
    source, entry = shot_of(previs)
    ids = entry.get("cast", [])
    sheets = sheets_for(ids) if ids else []
    prompt = entry["prompt"] if entry.get("keep") is False else KEEP + " " + entry["prompt"]
    if sheets:
        which = "Image 2 is a" if len(sheets) == 1 else f"Images 2 to {len(sheets) + 1} are"
        prompt += " " + SHEET_NOTE.format(which=which, sheet="sheet" if len(sheets) == 1 else "sheets",
                                          names=", ".join(ids[:-1]) + (" and " if len(ids) > 1 else "") + ids[-1])
    n = len(ids)
    prompt += (f" There {'is' if n == 1 else 'are'} exactly {n} {'person' if n == 1 else 'people'} in the photograph; "
               "nobody else." if n else " There is nobody in the photograph.")
    images = [part(previs, 1920)] + [part(p, 3072) for p in sheets]
    aspect = aspect_of(previs)
    scene = provenance.record(
        "scene", {"name": MODEL, "where": "gemini", "settings": {"size": SIZE, "aspect": aspect}},
        provenance.commit(HERE / "pipeline.py", HERE / "batch.py", WORLD / "provenance.py", WORLD / "gemini.py"),
        source=source, inputs=[provenance.picture("previs", previs)] +
        [provenance.picture(f"cast sheet {p.stem}", p) for p in sheets])
    return prompt, images, aspect, previs.with_name(previs.name.replace("previs-", "scene-")), scene


def save(data, dest, scene):
    """Save a generated picture with its record inside it."""
    im = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    provenance.stamp(im, dest, dict(scene, made=time.strftime("%Y-%m-%dT%H:%M:%S")))


def generate(images, prompt, aspect, dest, scene=None):
    t = time.time()
    save(gemini.generate(prompt, images, aspect), dest, scene or {"model": MODEL})
    print(f"  {dest.relative_to(REPO)}  {MODEL}  {time.time() - t:.0f}s", flush=True)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for previs in previs_inputs(sys.argv[1:]):
        prompt, images, aspect, dest, scene = request(previs)
        generate(images, prompt, aspect, dest, scene)


if __name__ == "__main__":
    main()
