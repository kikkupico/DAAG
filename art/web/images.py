"""Publish the photoreal pictures to Cloudflare R2 and point the pages at them.

    python3 art/web/images.py           encode, upload what is missing, rewrite the links
    python3 art/web/images.py --dry     say what would happen and change nothing

Run it again after a new scene is published; it only does what is not yet done.

Which pictures: every <img> on the home page, the setting pages and the books whose file is a
generated scene, and the few named in EXTRA (the home page's chart). A scene is recognised by comparing the page's picture with the renders in
art/panels: one that matches a shot's scene*.png (or comic*.png) is photoreal, one that matches
a previs render is left where it is. A picture used on several pages is uploaded once.
The previs ones are listed in images.json under "previs" and in a block of .gitignore; they are not in git.

What is made: from the matching scene.png, AVIF at each of WIDTHS no wider than the picture,
in art/web/out/ (not in git). Each goes to the bucket under a name that carries the source's
hash, so it never changes and is cached for a year; a regenerated picture gets a new name.

Where the links are rewritten: in every page as it is published, the books' index.html among them,
and in each book's source, art/scroll/parts/<slug>/body.html, so the two stay in step. Nothing is
rebuilt: assemble.py still writes the single-file page the books have outgrown. A rewritten tag keeps the local path as data-local, which is
how a later run finds it again.

art/web/images.json records what was published. Uploading uses wrangler (npx) and the login
it already has.
"""
import hashlib
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
MANIFEST = HERE / "images.json"
PANELS = ROOT / "art/panels"
PARTS = ROOT / "art/scroll/parts"

BUCKET = "daag-images"
BASE = "https://pub-c335d307e76c41618eb522e0049e35e2.r2.dev"  # the bucket's public address; a custom domain goes here
WRANGLER = ["npx", "--yes", "wrangler@4.149.0"]
WIDTHS = (400, 800, 1200)
QUALITY = 60  # AVIF; about a third smaller than WebP 80 on these scenes
CACHE = "public, max-age=31536000, immutable"
# how wide a picture is shown, by the nearest enclosing element that says so
SIZES = (("bleed", "100vw"),
         ("setting-card", "110px"),
         ("cardlink", "(max-width: 700px) 80vw, 370px"),
         ("", "(max-width: 700px) 90vw, 560px"))
# pictures that are not scenes but are published all the same, and the file each is made from
EXTRA = {"assets/img/map.jpg": "art/full-map-cartographic.jpeg"}  # the home page's chart
# generated-looking pictures that are really previs and stay local, whatever scene*.png says
LOCAL = {"assets/img/places/scholars-coast.jpg", "books/spreading-by-word-of-mouth/img/scholars-coast.jpg",
         "books/what-you-can-promise-alone/img/scholars-coast.jpg"}
previs = set()  # local pictures that are previs renders; the deploy leaves them out of the site
DRY = "--dry" in sys.argv


def sources():
    """(file the tag is written in, folder its relative links start from, book to rebuild or None)."""
    yield ROOT / "index.html", ROOT, None
    for page in sorted(ROOT.glob("places/*/index.html")):
        yield page, page.parent, None
    for page in sorted(ROOT.glob("books/*/index.html")):
        # the built page is the book; its source in art/scroll/parts is kept in step but not
        # rebuilt, since assemble.py still writes the single-file page the books have outgrown
        yield page, page.parent, None
        body = PARTS / page.parent.name / "body.html"
        if body.exists():
            yield body, page.parent, None


class Imgs(HTMLParser):
    """Every <img>: its text, where it starts, and the classes of the elements round it."""
    VOID = {"img", "br", "hr", "meta", "link", "input", "source", "area", "col", "wbr"}

    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.lines = [0]
        for line in text.splitlines(keepends=True):
            self.lines.append(self.lines[-1] + len(line))
        self.stack, self.found = [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "img":
            line, col = self.getpos()
            around = " ".join(cls for _, cls in self.stack).split()
            self.found.append((self.lines[line - 1] + col, self.get_starttag_text(), attrs, around))
        elif tag not in self.VOID:
            self.stack.append((tag, attrs.get("class") or ""))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


def signature(path):
    return list(Image.open(path).convert("L").resize((48, 48)).getdata())


def scene_of(local, book):
    """The scene render a page's picture was exported from, or None if it is not a generated scene."""
    stem = local.stem
    if local.parent.name == "covers":
        shots = [PANELS / stem / "cover"]
    else:
        shots = ([PANELS / book / stem] if book else []) + sorted(PANELS.glob(f"*/{stem}"))
    renders = [(p, p.name.split(".")[0].split("-")[0]) for shot in shots if shot.is_dir() for p in shot.glob("*.png")]
    renders += [(p, "previs") for shot in shots for p in [shot.with_suffix(".png")] if p.is_file()]  # a bare previs
    renders = [(p, kind) for p, kind in renders if kind in ("previs", "scene", "comic")]
    if not renders:
        return None
    mine = signature(local)
    diff = lambda path: sum(abs(a - b) for a, b in zip(mine, signature(path))) / len(mine)
    best, kind = min(renders, key=lambda r: diff(r[0]))
    if kind != "previs" and diff(best) < 6:
        return best
    previs.add(local.relative_to(ROOT).as_posix())  # it has renders, and this one is the previs
    return None


def exists(key):
    try:
        request = urllib.request.Request(f"{BASE}/{key}", method="HEAD", headers={"User-Agent": "daag-images"})
        return urllib.request.urlopen(request, timeout=30).status == 200
    except (urllib.error.URLError, TimeoutError):
        return False


def upload(key):
    if exists(key):
        return key, "there"
    done = subprocess.run(
        WRANGLER + ["r2", "object", "put", f"{BUCKET}/{key}", "--file", str(OUT / key), "--remote",
                    "--content-type", "image/avif", "--cache-control", CACHE],
        cwd=ROOT, capture_output=True, text=True)
    return key, "uploaded" if done.returncode == 0 and exists(key) else "FAILED " + done.stderr.strip()[-300:]


def main():
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"images": {}, "pages": {}}
    images, pages = manifest["images"], {}
    edits, skipped = {}, set()  # file -> [(offset, old tag, new tag)]; local pictures left alone

    for file, base, rebuild in sources():
        text = file.read_text(encoding="utf-8")
        for offset, tag, attrs, around in Imgs(text).found:
            src = attrs.get("data-local") or attrs.get("src") or ""
            if not src or re.match(r"[a-z]+:", src) or not src.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            local = (base / src).resolve()
            name = local.relative_to(ROOT).as_posix()
            if not local.is_file():
                skipped.add(name + " (missing)")
                continue
            if name in LOCAL:
                skipped.add(name)
                previs.add(name)
                if attrs.get("data-local"):  # put a tag published earlier back on its local file
                    new = re.sub(r'\s+(srcset|sizes|data-local)="[^"]*"', "", tag)
                    new = re.sub(r'(\ssrc=")[^"]*"', lambda m: m.group(1) + src + '"', new, count=1)
                    edits.setdefault((file, rebuild), []).append((offset, tag, new))
                continue
            scene = ROOT / EXTRA[name] if name in EXTRA else scene_of(local, base.name if base.parent.name == "books" else None)
            if not scene:
                skipped.add(name)
                continue
            digest = hashlib.sha256(scene.read_bytes()).hexdigest()[:10]
            if digest not in images:
                shot = local.stem if name in EXTRA else scene.parent.relative_to(PANELS).as_posix().replace("/", "-")
                width, height = Image.open(scene).size
                images[digest] = {"name": shot, "scene": scene.relative_to(ROOT).as_posix(), "size": [width, height],
                                  "widths": sorted({min(w, width) for w in WIDTHS})}
            pages[name] = digest
            image = images[digest]
            url = lambda w: f"{BASE}/{image['name']}-{digest}-{w}.avif"
            show = next(sizes for cls, sizes in SIZES if not cls or cls in around)
            middle = image["widths"][min(1, len(image["widths"]) - 1)]
            srcset = ", ".join(f"{url(w)} {w}w" for w in image["widths"])
            if (attrs.get("src") or "").startswith(f"{BASE}/{image['name']}-{digest}-") and attrs.get("data-local") == src:
                continue  # already on this very picture: keep the tag as it is, sizes chosen by hand and all
            kept = re.sub(r'\s+(src|srcset|sizes|data-local)="[^"]*"', "", tag)
            new = (f'<img src="{url(middle)}" srcset="{srcset}" '
                   f'sizes="{show}" data-local="{src}"' + kept[4:])
            if new != tag:
                edits.setdefault((file, rebuild), []).append((offset, tag, new))

    used = {d: images[d] for d in sorted(set(pages.values()))}
    keys = []
    for digest, image in used.items():
        source = None
        for w in image["widths"]:
            key = f"{image['name']}-{digest}-{w}.avif"
            keys.append(key)
            if not (OUT / key).exists() and not DRY:
                OUT.mkdir(exist_ok=True)
                source = source or Image.open(ROOT / image["scene"]).convert("RGB")
                height = round(source.height * w / source.width)
                source.resize((w, height), Image.LANCZOS).save(OUT / key, "AVIF", quality=QUALITY, speed=4)
    print(f"{len(pages)} pictures on the pages are generated scenes: {len(used)} distinct, {len(keys)} files")
    print(f"{len(skipped)} left local (previs, or nothing to compare with):")
    for name in sorted(skipped):
        print("   ", name)
    if DRY:
        for (file, _), changes in edits.items():
            print(f"would rewrite {len(changes)} tags in {file.relative_to(ROOT)}")
        return

    with ThreadPoolExecutor(4) as pool:
        results = dict(pool.map(upload, keys))
    failed = {k: v for k, v in results.items() if v.startswith("FAILED")}
    print(f"uploaded {sum(v == 'uploaded' for v in results.values())}, already there {sum(v == 'there' for v in results.values())}")
    if failed:
        for key, why in failed.items():
            print("   ", key, why)
        sys.exit("some uploads failed; no link was changed")

    MANIFEST.write_text(json.dumps({"base": BASE, "bucket": BUCKET, "images": used, "previs": sorted(previs), "pages": dict(sorted(pages.items()))},
                                   indent=1) + "\n")
    ignore = ROOT / ".gitignore"
    block = "# previs pictures on the pages (art/web/images.py)\n" + "".join(f"/{n}\n" for n in sorted(previs))
    text = ignore.read_text() if ignore.exists() else ""
    text = re.sub(r"# previs pictures on the pages.*?(?=\n#|\Z)", "", text, flags=re.S).rstrip("\n")
    ignore.write_text(text + "\n\n" + block)
    subprocess.run(["git", "rm", "-r", "--cached", "-q", "--ignore-unmatch", *sorted(previs)], cwd=ROOT, check=True)
    for (file, rebuild), changes in edits.items():
        text = file.read_text(encoding="utf-8")
        for offset, old, new in sorted(changes, reverse=True):
            assert text[offset:offset + len(old)] == old, file
            text = text[:offset] + new + text[offset + len(old):]
        file.write_text(text, encoding="utf-8")
        print(f"rewrote {len(changes)} tags in {file.relative_to(ROOT)}")
        if rebuild:
            subprocess.run([sys.executable, str(ROOT / "art/scroll/assemble.py"), rebuild], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
