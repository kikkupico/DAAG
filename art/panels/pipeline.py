#!/usr/bin/env python3
"""Panel pipeline: reference sheets -> crops -> 3D previs -> realistic scene.

    python3 art/panels/pipeline.py sheet <sheet>          # generate a sheet, then split it
    python3 art/panels/pipeline.py split <sheet>          # re-split an existing sheet
    python3 art/panels/pipeline.py <render|scene|all> <book> <shot-id>

Sheets are defined in art/refs/sheets.json: a prompt, seed images, an aspect and a
`grid` of item names, row by row, in the order the sheet draws them. The sheet is
saved as art/refs/<sheet>-sheet.png and split into art/refs/<sheet>/<item>.png.

Shots live in art/panels/<book>/shots.json: the camera (read by art/previs/render.py)
plus "scene": {"prompt": ..., "refs": ["mercenaries/patersonos", "props/tent", ...]}.
[image 1] is always the previs; the refs are combined into one board, [image 2]
(set "board": false to pass them separately as [image 2], [image 3]...).
Output: art/panels/<book>/<shot-id>/{previs,scene}.png

Generation runs on the tripo CLI (image-to-image). Prompts are capped at 1024
characters, so appearance travels as reference crops rather than words.
"""
import json, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFS = ROOT / "art/refs"
MODEL = "banana_pro"   # Nano Banana Pro; tripo rejects "gemini-3-pro"
LONG_EDGE = 1200       # tripo ignores image_size and returns ~2400px; panels need 1K
PROMPT_MAX = 1024


def run(cmd):
    print("$", " ".join(cmd[:4]), "...", flush=True)
    return subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True).stdout


def upload(path):
    return json.loads(run(["tripo", "files", "upload", str(path), "--json"]))["file_token"]


def generate(inputs, prompt, aspect, dest, name):
    if len(prompt) > PROMPT_MAX:
        sys.exit(f"prompt is {len(prompt)} chars (max {PROMPT_MAX})")
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
            print(f"  {sheet}/{name}.png {box[2] - box[0]}x{box[3] - box[1]}")


def make_sheet(sheet):
    spec = json.load(open(REFS / "sheets.json"))[sheet]
    seeds = [ROOT / p for p in spec["seeds"]]
    generate(seeds, spec["prompt"], spec.get("aspect", "16:9"),
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


if __name__ == "__main__":
    main()
