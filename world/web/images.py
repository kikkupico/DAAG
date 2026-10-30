"""Publish the pictures on the pages to Cloudflare R2 and point the pages at them.

    python3 world/web/images.py           encode, upload what is missing, rewrite the links
    python3 world/web/images.py --dry     say what would happen and change nothing

Run it again after a page gains a picture or a picture is replaced; it only does what is not yet done.

Which pictures: every <img> on the home page, the setting pages and the books. A picture is
published when it is a render of the world model: its file matches one of world/renders/final/*.png
(the render of the same name first, then any). The few named in EXTRA (the home page's chart) are
published from their own source. A picture already on the bucket keeps its link until its file is
replaced by a render. Anything else stays local; the old previs pictures among those are listed in
images.json under "previs" and in a block of .gitignore, and are not in git.

What is made: from the render, AVIF at each of WIDTHS no wider than the render, in world/web/out/
(not in git). Each goes to the bucket under a name that carries the render's hash, so it never
changes and is cached for a year; a re-rendered picture gets a new name.

Where the links are rewritten: in every page, the books' index.html among them, and in each book's
source, scroll/parts/<slug>/body.html, so the two stay in step. A rewritten tag keeps the local path
as data-local, which is how a later run finds it again.

world/web/images.json records what was published. Uploading uses wrangler (npx) and the login
it already has.
"""
import functools
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
RENDERS = ROOT / "world/renders/final"
PARTS = ROOT / "scroll/parts"

BUCKET = "daag-images"
BASE = "https://pub-c335d307e76c41618eb522e0049e35e2.r2.dev"  # the bucket's public address; a custom domain goes here
WRANGLER = ["npx", "--yes", "wrangler@4.149.0"]
WIDTHS = (400, 800, 1200)
QUALITY = 60  # AVIF; about a third smaller than WebP 80 on these scenes
CACHE = "public, max-age=31536000, immutable"
MATCH = 6  # mean grey-level difference on a 48 x 48 thumbnail below which a picture is that render
# how wide a picture is shown, by the nearest enclosing element that says so
SIZES = (("bleed", "100vw"),
         ("setting-card", "110px"),
         ("cardlink", "(max-width: 700px) 80vw, 370px"),
         ("", "(max-width: 700px) 90vw, 560px"))
# pictures that are not renders but are published all the same, and the file each is made from
EXTRA = {"assets/img/map.jpg": "archive/art/full-map-cartographic.jpeg"}  # the home page's chart
PUBLISHED = re.compile(re.escape(BASE) + r"/(?:.+)-([0-9a-f]{10})-\d+\.avif$")
DRY = "--dry" in sys.argv


def sources():
    """(file the tag is written in, folder its relative links start from)."""
    yield ROOT / "index.html", ROOT
    for page in sorted(ROOT.glob("places/*/index.html")):
        yield page, page.parent
    for page in sorted(ROOT.glob("books/*/index.html")):
        yield page, page.parent
        body = PARTS / page.parent.name / "body.html"
        if body.exists():
            yield body, page.parent


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


@functools.lru_cache(maxsize=None)
def signature(path):
    return tuple(Image.open(path).convert("L").resize((48, 48)).tobytes())


def render_of(local):
    """The world render a page's picture was made from, or None."""
    renders = sorted(RENDERS.glob("*.png"))
    if not renders:
        return None
    mine = signature(local)
    diff = lambda path: sum(abs(a - b) for a, b in zip(mine, signature(path))) / len(mine)
    for group in ([p for p in renders if p.stem == local.stem], renders):
        if group:
            best = min(group, key=diff)
            if diff(best) < MATCH:
                return best
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
    previs = set(manifest.get("previs", []))
    edits, skipped = {}, set()  # file -> [(offset, old tag, new tag)]; local pictures left alone

    for file, base in sources():
        text = file.read_text(encoding="utf-8")
        for offset, tag, attrs, around in Imgs(text).found:
            src = attrs.get("data-local") or attrs.get("src") or ""
            if not src or re.match(r"[a-z]+:", src) or not src.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            local = (base / src).resolve()
            name = local.relative_to(ROOT).as_posix()
            on_bucket = PUBLISHED.match(attrs.get("src") or "")
            earlier = on_bucket.group(1) if on_bucket and on_bucket.group(1) in images else None
            if name in EXTRA:
                source = ROOT / EXTRA[name]
            elif local.is_file():
                source = render_of(local)
            else:
                source = None
            if not source:
                if earlier:  # published before and not replaced by a render: keep the tag as it is
                    pages[name] = earlier
                else:
                    skipped.add(name + ("" if local.is_file() else " (missing)"))
                continue
            digest = hashlib.sha256(source.read_bytes()).hexdigest()[:10]
            if digest not in images:
                width, height = Image.open(source).size
                images[digest] = {"name": local.stem if name in EXTRA else source.stem,
                                  "source": source.relative_to(ROOT).as_posix(), "size": [width, height],
                                  "widths": sorted({min(w, width) for w in WIDTHS})}
            pages[name] = digest
            previs.discard(name)
            image = images[digest]
            url = lambda w: f"{BASE}/{image['name']}-{digest}-{w}.avif"
            if earlier == digest and attrs.get("data-local") == src:
                continue  # already on this very picture: keep the tag as it is, sizes chosen by hand and all
            show = next(sizes for cls, sizes in SIZES if not cls or cls in around)
            middle = image["widths"][min(1, len(image["widths"]) - 1)]
            srcset = ", ".join(f"{url(w)} {w}w" for w in image["widths"])
            kept = re.sub(r'\s+(src|srcset|sizes|data-local)="[^"]*"', "", tag)
            new = (f'<img src="{url(middle)}" srcset="{srcset}" '
                   f'sizes="{show}" data-local="{src}"' + kept[4:])
            if new != tag:
                edits.setdefault(file, []).append((offset, tag, new))

    used = {d: images[d] for d in sorted(set(pages.values()))}
    keys = []
    for digest, image in used.items():
        source = None
        for w in image["widths"]:
            key = f"{image['name']}-{digest}-{w}.avif"
            keys.append(key)
            if not (OUT / key).exists() and not DRY:
                OUT.mkdir(exist_ok=True)
                source = source or Image.open(ROOT / image["source"]).convert("RGB")
                height = round(source.height * w / source.width)
                source.resize((w, height), Image.LANCZOS).save(OUT / key, "AVIF", quality=QUALITY, speed=4)
    print(f"{len(pages)} pictures on the pages are published: {len(used)} distinct, {len(keys)} files")
    print(f"{len(skipped)} left local (not a world render):")
    for name in sorted(skipped):
        print("   ", name)
    if DRY:
        for file, changes in edits.items():
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
    block = "# previs pictures on the pages (world/web/images.py)\n" + "".join(f"/{n}\n" for n in sorted(previs))
    text = ignore.read_text() if ignore.exists() else ""
    text = re.sub(r"# previs pictures on the pages.*?(?=\n#|\Z)", "", text, flags=re.S).rstrip("\n")
    ignore.write_text(text + "\n\n" + block)
    subprocess.run(["git", "rm", "-r", "--cached", "-q", "--ignore-unmatch", *sorted(previs)], cwd=ROOT, check=True)
    for file, changes in edits.items():
        text = file.read_text(encoding="utf-8")
        for offset, old, new in sorted(changes, reverse=True):
            assert text[offset:offset + len(old)] == old, file
            text = text[:offset] + new + text[offset + len(old):]
        file.write_text(text, encoding="utf-8")
        print(f"rewrote {len(changes)} tags in {file.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
