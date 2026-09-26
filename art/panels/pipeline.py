#!/usr/bin/env python3
"""Panel pipeline: reference sheets -> crops -> 3D previs -> realistic scene.

    python3 art/panels/pipeline.py sheet <sheet>          # generate a sheet, then split it
    python3 art/panels/pipeline.py split <sheet>          # re-split an existing sheet
    python3 art/panels/pipeline.py <render|scene|comic|all> <book> <shot-id>

Sheets are defined in art/refs/sheets.json: a prompt, seed images, an aspect and a
`grid` of item names, row by row, in the order the sheet draws them. The sheet is
saved as art/refs/<sheet>-sheet.png and split into art/refs/<sheet>/<item>.png, with
each item's box on the sheet in art/refs/<sheet>/boxes.json.

Shots live in art/panels/<book>/shots.json: the camera (read by art/previs/render.py)
plus "scene": {"prompt": ..., "refs": ["mercenaries/merc-3", "props/tent", ...]}.
[image 1] is always the previs; the refs are combined into one board, [image 2]
(set "board": false to pass them separately as [image 2], [image 3]...).
Output: art/panels/<book>/<shot-id>/{previs,scene}.png
`comic` (run on its own, not part of `all`) redraws scene.png as a ligne claire
illustration, comic.png; a shot's "comic" prompt overrides COMIC_PROMPT. Book covers
use it; panels inside the books stay realistic.

Generation runs on Nano Banana Pro through the Meshy API (MESHY_API_KEY, 9 credits an
image), or through the tripo CLI with GEN=tripo. Prompts are capped at 1024 characters,
so appearance travels as reference crops rather than words. A sheet's seeds are laid
on one white board of the sheet's aspect; Meshy takes `aspect_ratio` for image-to-image
too, and without it returns a crowded 1024 square.
"""
import base64, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFS = ROOT / "art/refs"
MODEL = "banana_pro"   # Nano Banana Pro; tripo rejects "gemini-3-pro"
LONG_EDGE = 1200       # tripo ignores image_size and returns ~2400px; panels need 1K
PROMPT_MAX = 1024
COMIC_PROMPT = (
    "Redraw [image 1] as a Franco-Belgian ligne claire comic illustration in the manner of "
    "Hergé and Edgar P. Jacobs: clean black ink outlines of even weight, flat areas of clear "
    "colour with no gradients, no hatching and very little shading, detailed accurate "
    "architecture, readable figures. Keep the composition, the camera, and every person, "
    "animal, object and building exactly where they are, with the same faces, costumes and "
    "colours. One single illustration. No lettering, no title, no speech balloons, no "
    "captions, no logos, no signature, no panel border.")


def run(cmd):
    print("$", " ".join(cmd[:4]), "...", flush=True)
    return subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True).stdout


def upload(path):
    return json.loads(run(["tripo", "files", "upload", str(path), "--json"]))["file_token"]


def meshy(path, body):
    req = urllib.request.Request(
        "https://api.meshy.ai/openapi/v1/" + path, method="POST" if body else "GET",
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization": "Bearer " + os.environ["MESHY_API_KEY"],
                 "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))


def generate_meshy(inputs, prompt, aspect, dest):
    body = {"ai_model": "nano-banana-pro", "prompt": prompt}
    if inputs:
        kind = "image-to-image"
        body["reference_image_urls"] = [
            "data:image/png;base64," + base64.b64encode(Path(p).read_bytes()).decode()
            for p in inputs]
    else:
        kind = "text-to-image"
    body["aspect_ratio"] = aspect
    tid = meshy(kind, body)["result"]
    print(f"  meshy {kind} {tid}", flush=True)
    while True:
        time.sleep(5)
        t = meshy(f"{kind}/{tid}", None)
        if t["status"] in ("SUCCEEDED", "FAILED", "CANCELED"):
            break
    if t["status"] != "SUCCEEDED":
        sys.exit(f"meshy {kind} {tid}: {t['status']} {t.get('task_error')}")
    urllib.request.urlretrieve(t["image_urls"][0], dest)
    print(f"  {dest.relative_to(ROOT)}  task={tid}")


def generate(inputs, prompt, aspect, dest, name):
    if len(prompt) > PROMPT_MAX:
        sys.exit(f"prompt is {len(prompt)} chars (max {PROMPT_MAX})")
    if os.environ.get("GEN", "meshy") == "meshy":
        return generate_meshy(inputs, prompt, aspect, dest)
    tokens = [upload(p) for p in inputs]
    common = ["--model", MODEL, "-p", f"aspect_ratio={aspect}", "--name", name,
              "--json", "--yes", "--no-open", "--quiet"]
    with tempfile.TemporaryDirectory() as tmp:
        if tokens:
            cmd = ["tripo", "generate", "image-to-image", tokens[0], "--prompt", prompt,
                   "-p", "inputs=" + json.dumps(tokens)]
        else:
            cmd = ["tripo", "generate", "text-to-image", prompt]
        out = run(cmd + common + ["-o", tmp])
        res = json.loads(out.strip().splitlines()[-1])
        shutil.copy(next(Path(tmp).rglob("generated_image.*")), dest)
    print(f"  {dest.relative_to(ROOT)}  task={res['task_id']}  credits={res.get('credits_consumed')}")


def downscale(path):
    from PIL import Image
    im = Image.open(path)
    if max(im.size) > LONG_EDGE:
        k = LONG_EDGE / max(im.size)
        im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(path)


# --- sheets -----------------------------------------------------------------

def components(mask, cell=4, grow=2):
    """Bounding boxes of connected regions of `mask`, found on a coarse grid
    (cell px per cell, grown by `grow` cells so a thin gap doesn't split an item)."""
    import numpy as np
    H, W = mask.shape
    h, w = H // cell, W // cell
    g = mask[:h * cell, :w * cell].reshape(h, cell, w, cell).any((1, 3))
    p = np.pad(g, grow)
    g = np.zeros_like(g)
    for dy in range(2 * grow + 1):
        for dx in range(2 * grow + 1):
            g |= p[dy:dy + h, dx:dx + w]
    seen = np.zeros_like(g)
    boxes = []
    for y0, x0 in zip(*np.nonzero(g)):
        if seen[y0, x0]:
            continue
        stack, ys, xs = [(y0, x0)], [], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            ys.append(y); xs.append(x)
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and g[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        boxes.append([min(xs) * cell, min(ys) * cell, (max(xs) + 1) * cell, (max(ys) + 1) * cell])
    return boxes


def split_sheet(sheet):
    """Find each item as a connected region on the plain background, group the regions
    into rows by their centres, and name them left to right from the sheet's `grid`.
    A row with more regions than names (e.g. four rings drawn 2x2) has its closest
    neighbours merged until the counts match."""
    import numpy as np
    from PIL import Image
    spec = json.load(open(REFS / "sheets.json"))[sheet]
    im = Image.open(REFS / f"{sheet}-sheet.png").convert("RGB")
    a = np.asarray(im).astype(int)
    bg = np.median(np.concatenate([a[:8, :8], a[:8, -8:], a[-8:, :8], a[-8:, -8:]]).reshape(-1, 3), 0)
    mask = np.abs(a - bg).sum(2) > 45
    H, W = mask.shape
    # drop specks, and the thin divider rules some sheets draw between figures
    boxes = [b for b in components(mask)
             if (b[2] - b[0]) * (b[3] - b[1]) > H * W * 0.002
             and b[2] - b[0] > W * 0.03 and b[3] - b[1] > H * 0.03]
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if rows and cy - np.mean([(r[1] + r[3]) / 2 for r in rows[-1]]) < H * 0.15:
            rows[-1].append(b)
        else:
            rows.append([b])
    names = spec["grid"]
    if len(rows) != len(names):
        print(f"  ! found {len(rows)} rows, grid has {len(names)}")
    out = REFS / sheet
    out.mkdir(exist_ok=True)
    placed = {}
    for r, row in enumerate(rows):
        row.sort(key=lambda b: b[0])
        row_names = names[r] if r < len(names) else []
        while len(row) > max(len(row_names), 1):
            i = min(range(len(row) - 1), key=lambda i: row[i + 1][0] - row[i][2])
            a_, b_ = row[i], row.pop(i + 1)
            row[i] = [min(a_[0], b_[0]), min(a_[1], b_[1]), max(a_[2], b_[2]), max(a_[3], b_[3])]
        if len(row) != len(row_names):
            print(f"  ! row {r}: found {len(row)} items, grid has {len(row_names)}")
        for c, (x0, y0, x1, y1) in enumerate(row):
            pad = 12
            box = (max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, W), min(y1 + pad, H))
            name = row_names[c] if c < len(row_names) else f"unnamed-{r}-{c}"
            im.crop(box).save(out / f"{name}.png")
            placed[name] = [int(v) for v in (x0, y0, x1, y1)]
            print(f"  {sheet}/{name}.png {box[2] - box[0]}x{box[3] - box[1]}")
    # where each item sits on the sheet, for splitting a 3D model of the whole sheet
    json.dump({"size": [W, H], "boxes": placed}, open(out / "boxes.json", "w"), indent=1)


def seed_board(seeds, aspect, dest, height=1000):
    """The seed crops side by side, centred on a white board of the sheet's aspect."""
    from PIL import Image
    ims = [Image.open(p).convert("RGB") for p in seeds]
    ims = [im.resize((round(im.width * height / im.height), height), Image.LANCZOS) for im in ims]
    gap = 60
    w = sum(im.width for im in ims) + gap * (len(ims) + 1)
    aw, ah = map(int, aspect.split(":"))
    W, H = max(w, round((height + 2 * gap) * aw / ah)), height + 2 * gap
    H = max(H, round(W * ah / aw))
    board = Image.new("RGB", (W, H), "white")
    x, y = (W - w) // 2 + gap, (H - height) // 2
    for im in ims:
        board.paste(im, (x, y))
        x += im.width + gap
    board.save(dest)
    return dest


def make_sheet(sheet):
    spec = json.load(open(REFS / "sheets.json"))[sheet]
    seeds = [ROOT / p for p in spec["seeds"]]
    aspect = spec.get("aspect", "16:9")
    with tempfile.TemporaryDirectory() as tmp:
        if seeds:
            seeds = [seed_board(seeds, aspect, Path(tmp) / "seeds.png")]
        generate(seeds, spec["prompt"], aspect,
                 REFS / f"{sheet}-sheet.png", f"{sheet}-sheet")
    split_sheet(sheet)


# --- shots ------------------------------------------------------------------

def make_board(refs, dest, height=900):
    """Lay a shot's reference crops side by side on white as ONE image. With
    many separate [image N] inputs the model loses track of which is which."""
    from PIL import Image
    ims = [Image.open(r).convert("RGB") for r in refs]
    # characters stand full height; props are drawn at 60% so people stay dominant
    scaled = []
    for r, im in zip(refs, ims):
        h = height if r.parent.name != "props" else int(height * 0.6)
        scaled.append(im.resize((round(im.width * h / im.height), h), Image.LANCZOS))
    gap = 40
    board = Image.new("RGB", (sum(i.width for i in scaled) + gap * (len(scaled) + 1), height + 2 * gap), "white")
    x = gap
    for im in scaled:
        board.paste(im, (x, gap + height - im.height))
        x += im.width + gap
    board.save(dest)
    return dest


def main():
    stage = sys.argv[1]
    if stage == "sheet":
        return make_sheet(sys.argv[2])
    if stage == "split":
        return split_sheet(sys.argv[2])

    book, shot_id = sys.argv[2:4]
    shots_path = ROOT / "art/panels" / book / "shots.json"
    shot = json.load(open(shots_path))[shot_id]
    d = ROOT / "art/panels" / book / shot_id
    d.mkdir(parents=True, exist_ok=True)

    if stage in ("render", "all"):
        run(["blender", "-b", "-P", "art/previs/render.py", "--",
             str(shots_path), shot_id, str(d / "previs.png")])
        print(f"  {(d / 'previs.png').relative_to(ROOT)}")
    if stage in ("scene", "all"):
        sc = shot["scene"]
        refs = [REFS / f"{r}.png" for r in sc["refs"]]
        missing = [str(r.relative_to(ROOT)) for r in refs if not r.exists()]
        if missing:
            sys.exit(f"missing refs: {missing}")
        if sc.get("board", True):
            refs = [make_board(refs, d / "board.png")]
        generate([d / "previs.png"] + refs, sc["prompt"], shot.get("aspect", "4:3"),
                 d / "scene.png", shot_id)
        downscale(d / "scene.png")
    if stage == "comic":
        generate([d / "scene.png"], shot.get("comic", COMIC_PROMPT), shot.get("aspect", "4:3"),
                 d / "comic.png", shot_id + "-comic")
        downscale(d / "comic.png")


if __name__ == "__main__":
    main()
