"""Reference pictures of the cast: each person alone, full length, front view, on white.

    python3 world/cast/gen.py nb2 [id ...] [--force]                       Nano Banana 2 (GEMINI_API_KEY)
    ~/Projects/flux/.venv/bin/python world/cast/gen.py flux <id> [--force]  FLUX.2 klein 4B, locally
    python3 world/cast/gen.py --sheet <maker>                              contact sheet, out/<maker>/sheet.jpg

cast.json lists every figure. A prompt is the shared prefix plus the figure's kind, with {colour},
{who} and {extra} filled from the figure and {sandals} from the shared wording. Every figure has a
seed of its own (from its id), so each has a face of its own; figures of one kind still differ in
nothing that marks them but colour, as the cast rule asks. Pictures go to out/<maker>/<id>.png (not
in git), with the seconds each took in out/<maker>/times.json; made pictures are kept unless --force.
On a 24 GB Mac run FLUX one figure to a process, so memory is freed between pictures.
Only people are made here; props are modelled in 3D in the world model.
"""
import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
FLUX_MODEL = Path.home() / "Projects/flux/models/FLUX.2-klein-4B"
FLUX_SIZE = (768, 1024)


def jobs(maker):
    spec = json.loads((HERE / "cast.json").read_text())
    for item in spec["characters"]:
        text = spec["kinds"][item["kind"]].format(colour=item.get("colour", ""), who=item.get("who", ""),
                                                  extra=item.get("extra", ""), sandals=spec["sandals"])
        yield {"id": item["id"], "seed": item.get("seed", zlib.crc32(item["id"].encode()) % 100000),
               "prompt": spec["prefix"] + " " + text, "dest": OUT / maker / (item["id"] + ".png")}


def record(maker, name, seconds):
    path = OUT / maker / "times.json"
    d = json.loads(path.read_text()) if path.exists() else {}
    d[name] = round(seconds, 1)
    path.write_text(json.dumps(d, indent=1) + "\n")
    print(f"{maker} {name}: {d[name]}s", flush=True)


def nb2(job):
    body = {"model": "gemini-3.1-flash-image", "input": [{"type": "text", "text": job["prompt"]}],
            "response_format": {"type": "image", "aspect_ratio": "3:4", "image_size": "2K"}}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions", method="POST",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], "Api-Revision": "2026-05-20",
                 "Content-Type": "application/json"})
    try:
        res = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        print(f"nb2 {job['id']}: HTTP {e.code} {e.read().decode()[:400]}", flush=True)
        return False
    for step in res.get("steps", []):
        for c in step.get("content", []):
            if c.get("type") == "image":
                from PIL import Image
                Image.open(io.BytesIO(base64.b64decode(c["data"]))).save(job["dest"])
                return True
    print(f"nb2 {job['id']}: no image: {json.dumps(res)[:400]}", flush=True)
    return False


def flux_pipe():
    import torch
    from diffusers import Flux2KleinPipeline
    pipe = Flux2KleinPipeline.from_pretrained(FLUX_MODEL, torch_dtype=torch.bfloat16)
    pipe.enable_model_cpu_offload()  # what fits a 24 GB Mac

    def run(job):
        w, h = FLUX_SIZE
        pipe(prompt=job["prompt"], width=w, height=h, guidance_scale=1.0, num_inference_steps=4,
             generator=torch.Generator("cpu").manual_seed(job["seed"])).images[0].save(job["dest"])
        return True
    return run


def generate(maker, ids, force):
    todo = [j for j in jobs(maker) if (not ids or j["id"] in ids) and (force or not j["dest"].exists())]
    if not todo:
        print("nothing to make")
        return
    (OUT / maker).mkdir(parents=True, exist_ok=True)
    make = nb2 if maker == "nb2" else flux_pipe()
    for j in todo:
        t = time.time()
        if make(j):
            record(maker, j["id"], time.time() - t)


def sheet(maker):
    from PIL import Image, ImageDraw
    made = [j for j in jobs(maker) if j["dest"].exists()]
    cols, cw = 6, 320
    ims = [Image.open(j["dest"]).convert("RGB") for j in made]
    ch = max(round(cw * im.height / im.width) for im in ims) + 22
    out = Image.new("RGB", (cols * cw, ((len(made) + cols - 1) // cols) * ch), "white")
    draw = ImageDraw.Draw(out)
    for n, (j, im) in enumerate(zip(made, ims)):
        im = im.resize((cw, round(cw * im.height / im.width)))
        x, y = (n % cols) * cw, (n // cols) * ch
        out.paste(im, (x, y))
        draw.text((x + 6, y + ch - 18), j["id"], fill="black")
    out.save(OUT / maker / "sheet.jpg", quality=88)
    print("sheet", OUT / maker / "sheet.jpg", len(made), "pictures")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[0] == "--sheet":
        sheet(args[1])
    else:
        generate(args[0], [a for a in args[1:] if not a.startswith("--")], "--force" in args)
