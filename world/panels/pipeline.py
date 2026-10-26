#!/usr/bin/env python3
"""Book pictures: a previs image with the cast put into it, as a photograph.

    python3 world/panels/pipeline.py <previs.png | folder> ...             previs -> scene
    IMAGE_MODEL=lite IMAGE_SIZE=2K python3 world/panels/pipeline.py ...    another model (nb2, lite, pro) or size

The input is a previs image made by previs.py, world/panels/<book>/<shot>/previs-<version>.png. A folder
stands for the newest previs of every shot under it, so world/panels/<book> is a whole book. The
previs carries its shot's record (inside the PNG, and in previs-<version>.json beside it), and the
cast and prompt are read from there, never from the current shots.json: the picture is made from
the shot exactly as it was when its previs was rendered.

The previs is image 1, and the cast pictures (world/cast/out/<CAST>/<id>.png, CAST=flux by default)
follow as images 2, 3, ... in the record's order, so the prompt names each person by their image.
The prompt is appended to KEEP, which turns the previs into a photograph without moving anything;
a shot with "keep": false sends its prompt alone. The aspect is the previs's. Output: scene-<version>.png
beside the previs, at the size the model returns, with its own record (the previs, the model, the cast
files and their hashes) inside it and in scene-<version>.json; a new take replaces the last.

Generation runs on Nano Banana 2 (gemini-3.1-flash-image) at 1K through the Gemini Interactions API
with GEMINI_API_KEY. Only people are generated: buildings and props come from the previs. The usual
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
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, PngImagePlugin

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
REPO = WORLD.parent
CAST = WORLD / "cast/out" / os.environ.get("CAST", "flux")
MODELS = {"lite": "gemini-3.1-flash-lite-image", "nb2": "gemini-3.1-flash-image", "pro": "gemini-3-pro-image"}
MODEL = MODELS[os.environ.get("IMAGE_MODEL", "nb2")]
SIZE = os.environ.get("IMAGE_SIZE", "1K")  # 2K draws small faces better, at a higher price; Lite stops at 1K
ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
KEEP = ("Turn image 1 into a real photograph of the same place: keep its camera, framing, buildings, objects and "
        "layout exactly, and make the ground, plants, stone, cloth and light fully photographic. Hellenistic Greece, "
        "3rd century BC; nothing modern. Every building is in daily use, clean and well kept: no ruin, no weeds between the "
        "stones. Everything behind the people stays as it is in image 1, the same hills, trees, bushes and buildings, with "
        "nothing built that image 1 does not show. Natural daylight; people at true scale, with real shadows on the ground. "
        "Each person keeps exactly the face and clothes of their reference image.")


def part(path, longest):
    im = Image.open(path).convert("RGB")
    im.thumbnail((longest, longest))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=92)
    return {"type": "image", "mime_type": "image/jpeg", "data": base64.b64encode(buf.getvalue()).decode()}


def aspect_of(path):
    w, h = Image.open(path).size
    return min(ASPECTS, key=lambda a: abs(int(a.split(":")[0]) / int(a.split(":")[1]) - w / h))


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()[:10]


def record_of(previs):
    """The shot record a previs carries: in the PNG, or failing that in the .json beside it."""
    text = Image.open(previs).text.get("daag-shot")
    if text:
        return json.loads(text)
    side = previs.with_suffix(".json")
    if side.exists():
        return json.loads(side.read_text())
    sys.exit(f"{previs}: no shot record; make previs images with previs.py")


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


def request(previs):
    """What one previs sends: (prompt, images as parts, aspect, where the picture goes, its record)."""
    rec = record_of(previs)
    entry = rec["entry"]
    cast = [CAST / f"{c}.png" for c in entry.get("cast", [])]
    missing = [str(p.relative_to(WORLD)) for p in cast if not p.exists()]
    if missing:
        sys.exit(f"{previs.relative_to(REPO)}: missing cast {missing}")
    prompt = entry["prompt"] if entry.get("keep") is False else KEEP + " " + entry["prompt"]
    n = len(cast)
    prompt += (f" There {'is' if n == 1 else 'are'} exactly {n} {'person' if n == 1 else 'people'} in the picture, "
               "the ones named; nobody else." if n else " There is nobody in the picture.")
    images = [part(previs, 1920)] + [part(p, 1024) for p in cast]
    scene = {"previs": str(previs.relative_to(REPO)), "previs_hash": digest(previs), "shot": rec,
             "model": MODEL, "cast": {str(p.relative_to(REPO)): digest(p) for p in cast}}
    return prompt, images, aspect_of(previs), previs.with_name(previs.name.replace("previs-", "scene-")), scene


def save(data, dest, scene):
    """Save a generated picture with its record inside it and beside it."""
    im = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    scene = dict(scene, made=time.strftime("%Y-%m-%dT%H:%M:%S"))
    info = PngImagePlugin.PngInfo()
    info.add_text("daag-scene", json.dumps(scene, ensure_ascii=False))
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, pnginfo=info)
    dest.with_suffix(".json").write_text(json.dumps(scene, indent=1, ensure_ascii=False) + "\n")


def generate(images, prompt, aspect, dest, scene=None):
    body = {"model": MODEL, "input": [{"type": "text", "text": prompt}] + images,
            "response_format": {"type": "image", "aspect_ratio": aspect, "image_size": SIZE}}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions", method="POST",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], "Api-Revision": "2026-05-20",
                 "Content-Type": "application/json"})
    t = time.time()
    try:
        res = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        sys.exit(f"{MODEL} {e.code}: {e.read().decode()[:600]}")
    for step in res.get("steps", []):
        for c in step.get("content", []):
            if c.get("type") == "image":
                save(c["data"], dest, scene or {"model": MODEL})
                print(f"  {dest.relative_to(REPO)}  {MODEL}  {time.time() - t:.0f}s", flush=True)
                return
    sys.exit(f"{MODEL} returned no image: {json.dumps(res)[:600]}")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for previs in previs_inputs(sys.argv[1:]):
        prompt, images, aspect, dest, scene = request(previs)
        generate(images, prompt, aspect, dest, scene)


if __name__ == "__main__":
    main()
