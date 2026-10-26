"""Reference pictures of the cast, and sheets of each setting's people side by side.

    python3 world/cast/gen.py submit [id ...] [--force]    Nano Banana 2 through the Batch API (the usual way)
    python3 world/cast/gen.py status [job]
    python3 world/cast/gen.py fetch [job] [--force]        save the pictures, then rebuild the sheets
    python3 world/cast/gen.py now <id ...> [--force]       Nano Banana 2 at once, for a single take
    ~/Projects/flux/.venv/bin/python world/cast/gen.py flux <id> [--force]   FLUX.2 klein 4B, locally
    python3 world/cast/gen.py sheets [maker]               the sheets, out/<maker>/sheets/<sheet>.png
    python3 world/cast/gen.py contact [maker]              every picture on one page, out/<maker>/contact.jpg

Every picture is one person alone, full length, facing the camera, on white. cast.json lists every
figure: its prompt is the shared prefix plus its kind, with {colour}, {who} and {extra} filled from
the figure and {sandals} from the shared wording. Figures of one kind differ only in the colours the
canon gives them; each has a face of its own. Pictures go to out/<maker>/<id>.png (maker nb2 by
default, or flux), not in git; made pictures are kept unless --force. Nano Banana 2 makes them at 3:4
and IMAGE_SIZE (1K by default), like every Gemini picture here (world/gemini.py).

The book pictures send each person of a shot's cast as a picture of their own, cropped to them, with
their id printed below (world/panels/pipeline.py), and name people by those ids. A sheet is for
looking: the figures that work together side by side in one row on white, each with its id printed
under it, at the size each was made, so heights and colours compare. cast.json's "sheets" names the
sheets; a figure lists the ones it is on, and may be on several.

Every picture and sheet carries its record (world/provenance.py): the commit it was made at, its id
or sheet in cast.json, the model (and batch job), and for a sheet the pictures on it with their
hashes. The prompt is read back from git at that commit, so the script refuses to run while cast.json
or the script has uncommitted changes. Only people are made here; props are modelled in 3D.
"""
import base64
import io
import json
import sys
import time
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
sys.path.insert(0, str(WORLD))
import fluxlocal  # noqa: E402
import gemini  # noqa: E402
import provenance  # noqa: E402

OUT = HERE / "out"
JOBS = HERE / "batches"
FLUX_SIZE = (768, 1024)
FONTS = ["/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]


def spec():
    return json.loads((HERE / "cast.json").read_text())


def jobs(maker="nb2"):
    s = spec()
    for item in s["characters"]:
        text = s["kinds"][item["kind"]].format(colour=item.get("colour", ""), who=item.get("who", ""),
                                               extra=item.get("extra", ""), sandals=s["sandals"])
        yield {"id": item["id"], "seed": item.get("seed", zlib.crc32(item["id"].encode()) % 100000), "item": item,
               "prompt": s["prefix"] + " " + text, "dest": OUT / maker / (item["id"] + ".png")}


def at():
    return provenance.commit(HERE / "cast.json", HERE / "gen.py", WORLD / "provenance.py", WORLD / "gemini.py")


def origin(job, model, commit):
    """The record a cast picture carries: the commit, its id in cast.json, the model."""
    return provenance.record("cast", model, commit, source={"file": provenance.rel(HERE / "cast.json"), "id": job["id"]})


def todo(ids, force, maker="nb2"):
    return [j for j in jobs(maker) if (not ids or j["id"] in ids) and (force or not j["dest"].exists())]


def save(job, data, where, commit):
    from PIL import Image
    im = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    provenance.stamp(im, job["dest"], origin(job, {"name": gemini.MODEL, "where": where,
                                                   "settings": {"aspect": "3:4", "size": gemini.SIZE}}, commit))


# --- Nano Banana 2 ----------------------------------------------------------------------------------

def submit(args):
    force = "--force" in args
    js = todo([a for a in args if not a.startswith("--")], force)
    if not js:
        sys.exit("nothing to make (--force to make again)")
    commit = at()
    batch = gemini.Batch(JOBS, "daag-cast")
    batch.submit([{"key": j["id"], "prompt": j["prompt"], "images": [], "aspect": "3:4",
                   "meta": {"commit": commit}} for j in js])


def status(args):
    gemini.Batch(JOBS, "daag-cast").status(args[0] if args else None)


def fetch(args):
    force = "--force" in args
    args = [a for a in args if not a.startswith("--")]
    by_id = {j["id"]: j for j in jobs()}
    gemini.Batch(JOBS, "daag-cast").fetch(lambda key, meta, data, where: save(by_id[key], data, where, meta["commit"]),
                                          args[0] if args else None, force)
    sheets([])


def now(args):
    js = todo([a for a in args if not a.startswith("--")], "--force" in args)
    commit = at()
    for j in js:
        t = time.time()
        save(j, gemini.generate(j["prompt"], [], "3:4"), "gemini", commit)
        print(f"  {provenance.rel(j['dest'])}  {time.time() - t:.0f}s", flush=True)


# --- FLUX, locally ------------------------------------------------------------------------------------

def flux(args):
    js = todo([a for a in args if not a.startswith("--")], "--force" in args, "flux")
    if not js:
        sys.exit("nothing to make (--force to make again)")
    commit = provenance.commit(HERE / "cast.json", HERE / "gen.py", WORLD / "provenance.py", WORLD / "fluxlocal.py")
    pipe = fluxlocal.pipe()  # run one figure to a process on a 24 GB Mac
    w, h = FLUX_SIZE
    for j in js:
        t = time.time()
        im = fluxlocal.generate(pipe, j["prompt"], [], w, h, j["seed"])
        provenance.stamp(im, j["dest"], origin(j, fluxlocal.model(seed=j["seed"], width=w, height=h), commit))
        print(f"  {provenance.rel(j['dest'])}  {time.time() - t:.0f}s", flush=True)


# --- sheets ---------------------------------------------------------------------------------------------

def font(size):
    from PIL import ImageFont
    for f in FONTS:
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default(size=size)


def sheets(args):
    """One picture a sheet: its figures side by side at the size each was made, each id printed below."""
    from PIL import Image, ImageDraw
    maker = args[0] if args else "nb2"
    s = spec()
    commit = at()
    made = {j["id"]: j["dest"] for j in jobs(maker) if j["dest"].exists()}
    label = font(64)
    for name in s["sheets"]:
        ids = [c["id"] for c in s["characters"] if name in c.get("sheets", [])]
        missing = [i for i in ids if i not in made]
        if missing:
            print(f"  {name}: not yet, missing {missing}")
            continue
        ims = [Image.open(made[i]).convert("RGB") for i in ids]
        gap, band = 40, 110
        h = max(im.height for im in ims)
        sheet = Image.new("RGB", (sum(im.width for im in ims) + gap * (len(ims) + 1), h + band + gap), "white")
        draw = ImageDraw.Draw(sheet)
        x = gap
        for i, im in zip(ids, ims):
            sheet.paste(im, (x, gap + h - im.height))
            tw = draw.textlength(i, font=label)
            draw.text((x + (im.width - tw) / 2, gap + h + 20), i, fill="black", font=label)
            x += im.width + gap
        rec = provenance.record("cast-sheet", {"name": "sheet", "where": "local"}, commit,
                                source={"file": provenance.rel(HERE / "cast.json"), "sheet": name},
                                inputs=[provenance.picture(f"cast {i}", made[i]) for i in ids])
        dest = OUT / maker / "sheets" / f"{name}.png"
        provenance.stamp(sheet, dest, rec)
        print(f"  {provenance.rel(dest)}  {len(ids)} people")


def contact(args):
    from PIL import Image, ImageDraw
    maker = args[0] if args else "nb2"
    made = [j for j in jobs(maker) if j["dest"].exists()]
    cols, cw = 6, 320
    ims = [Image.open(j["dest"]).convert("RGB") for j in made]
    ch = max(round(cw * im.height / im.width) for im in ims) + 22
    out = Image.new("RGB", (cols * cw, ((len(made) + cols - 1) // cols) * ch), "white")
    draw = ImageDraw.Draw(out)
    for n, (j, im) in enumerate(zip(made, ims)):
        out.paste(im.resize((cw, round(cw * im.height / im.width))), ((n % cols) * cw, (n // cols) * ch))
        draw.text(((n % cols) * cw + 6, (n // cols) * ch + ch - 18), j["id"], fill="black")
    out.save(OUT / maker / "contact.jpg", quality=88)
    print("contact sheet", provenance.rel(OUT / maker / "contact.jpg"), len(made), "pictures")


if __name__ == "__main__":
    commands = ("submit", "status", "fetch", "now", "flux", "sheets", "contact")
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        sys.exit(__doc__)
    globals()[sys.argv[1]](sys.argv[2:])
