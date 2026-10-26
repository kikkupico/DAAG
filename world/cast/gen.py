"""Reference pictures of the cast, made locally with FLUX.2 klein 4B (the model flux-gen uses).

    ~/Projects/flux/.venv/bin/python world/cast/gen.py [id ...] [--force] [--steps N]
    python3 world/cast/gen.py --sheet          contact sheet of everything made, out/sheet.jpg

cast.json lists every figure. A figure's prompt is the shared prefix plus its kind's text, with
{colour}, {who} and {extra} filled from the figure and {sandals} from the shared wording. All figures
of one kind share the kind's seed, so they come out alike and differ by colour, as the cast rule
asks; each kind has a seed of its own, so kinds do not share a face. One figure to a picture: the
model loses counts and later clauses in long prompts. Pictures go to out/characters/ (not in git),
with the seconds each took in out/times.json. Pictures already made are kept unless --force.
Only people are made here; props are modelled in 3D in the world model.
"""
import json
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
MODEL = Path.home() / "Projects/flux/models/FLUX.2-klein-4B"
SIZE = (768, 1024)


def jobs():
    spec = json.loads((HERE / "cast.json").read_text())
    for item in spec["characters"]:
        kind = spec["kinds"][item["kind"]]
        text = kind["text"].format(colour=item.get("colour", ""), who=item.get("who", ""),
                                   extra=item.get("extra", ""), sandals=spec["sandals"])
        yield {"id": item["id"], "seed": item.get("seed", kind["seed"]),
               "prompt": spec["prefix"] + " " + text,
               "dest": OUT / "characters" / (item["id"] + ".png")}


def generate(ids, force, steps):
    import torch
    from diffusers import Flux2KleinPipeline

    todo = [j for j in jobs() if (not ids or j["id"] in ids) and (force or not j["dest"].exists())]
    if not todo:
        print("nothing to make")
        return
    t0 = time.time()
    pipe = Flux2KleinPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16)
    pipe.enable_model_cpu_offload()  # what fits a 24 GB Mac
    print(f"model loaded in {time.time() - t0:.0f}s", flush=True)
    times_path = OUT / "times.json"
    times = json.loads(times_path.read_text()) if times_path.exists() else {}
    for j in todo:
        w, h = SIZE
        t = time.time()
        image = pipe(prompt=j["prompt"], width=w, height=h, guidance_scale=1.0, num_inference_steps=steps,
                     generator=torch.Generator("cpu").manual_seed(j["seed"])).images[0]
        j["dest"].parent.mkdir(parents=True, exist_ok=True)
        image.save(j["dest"])
        times[j["id"]] = round(time.time() - t, 1)
        times_path.write_text(json.dumps(times, indent=1) + "\n")
        print(f"{j['id']}: {times[j['id']]}s", flush=True)


def sheet():
    from PIL import Image, ImageDraw
    made = [j for j in jobs() if j["dest"].exists()]
    cell, label = 300, 22
    cols = 5
    rows = (len(made) + cols - 1) // cols
    out = Image.new("RGB", (cols * cell, rows * (cell * 4 // 3 + label)), "white")
    draw = ImageDraw.Draw(out)
    for n, j in enumerate(made):
        im = Image.open(j["dest"]).convert("RGB")
        im.thumbnail((cell, cell * 4 // 3))
        x, y = (n % cols) * cell, (n // cols) * (cell * 4 // 3 + label)
        out.paste(im, (x + (cell - im.width) // 2, y))
        draw.text((x + 6, y + cell * 4 // 3 + 4), j["id"], fill="black")
    out.save(OUT / "sheet.jpg", quality=88)
    print("sheet", OUT / "sheet.jpg", len(made), "pictures")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--sheet" in args:
        sheet()
    else:
        steps = int(args[args.index("--steps") + 1]) if "--steps" in args else 4
        ids = [a for a in args if not a.startswith("--") and not a.isdigit()]
        generate(ids, "--force" in args, steps)
