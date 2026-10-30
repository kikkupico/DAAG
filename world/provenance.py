#!/usr/bin/env python3
"""Where a picture came from, tied to git: every cast picture, previs and scene names the commit that made it.

    python3 world/provenance.py show <picture>               the record, what it points to in git, and its inputs
    python3 world/provenance.py export <picture> <out.jpg>   a JPEG for the site that keeps the record

A record is small, because git holds the rest. It is JSON in the PNG text chunk "daag-origin" (in a
JPEG, its comment):

    kind      cast | cast-sheet | previs | scene | comic
    commit    the commit the picture was made at; the files that made it had no uncommitted changes
    source    what at that commit it was made from: a file and the entry in it (cast.json and an id
              or a sheet, a book's shots.json and a shot, with the shot's version)
    island    for a previs: the island build it was rendered from, which names its own commit
    inputs    the pictures it was made from (pictures are not in git): role, path, hash, and the
              commit in their own record
    model     what ran it and the settings chosen for the run, which are not in git: the model,
              local or gemini or gemini-batch <job>, size, aspect, render quality
    made      when

The prompt and the entry are not copied into the record: `show` reads them from git at the commit.
A generator refuses to run while a file it reads has uncommitted changes, so the commit always
describes what made the picture. DAAG_ALLOW_DIRTY=1 lets it run anyway, for trials; the record then
lists the files that differed from the commit under "uncommitted".
"""
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image, PngImagePlugin

WORLD = Path(__file__).resolve().parent
REPO = WORLD.parent
KEY = "daag-origin"


def rel(path):
    p = Path(path).resolve()
    return str(p.relative_to(REPO)) if p.is_relative_to(REPO) else str(p)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()[:12]


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True).stdout.strip()


def commit(*paths):
    """HEAD, after checking that none of the given files or folders differ from it.
    Returns the fields a record takes: {"commit": ...} and, with DAAG_ALLOW_DIRTY=1, "uncommitted"."""
    changed = [l[3:] for l in git("status", "--porcelain", "--untracked-files=all", "--",
                                  *[rel(p) for p in paths]).splitlines()]
    head = git("rev-parse", "--short", "HEAD") or None
    if changed and os.environ.get("DAAG_ALLOW_DIRTY") != "1":
        sys.exit("commit these first, so the picture can be traced to a commit (or set DAAG_ALLOW_DIRTY=1 "
                 "for a trial):\n  " + "\n  ".join(changed))
    return {"commit": head, **({"uncommitted": changed} if changed else {})}


def record(kind, model, at, **fields):
    """at: the result of commit(...)."""
    return {"kind": kind, **at, **{k: v for k, v in fields.items() if v is not None}, "model": model,
            "made": time.strftime("%Y-%m-%dT%H:%M:%S")}


def picture(role, path):
    """An input picture: where it is, its hash, and the commit its own record names."""
    rec = read(path) or {}
    return {"role": role, "path": rel(path), "hash": digest(path), "commit": rec.get("commit")}


def stamp(image, dest, rec):
    """Save a PIL image as PNG with the record inside it."""
    info = PngImagePlugin.PngInfo()
    info.add_text(KEY, json.dumps(rec, ensure_ascii=False))
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, pnginfo=info)


def read(path):
    im = Image.open(path)
    text = im.text.get(KEY) if hasattr(im, "text") else None
    if not text and im.format == "JPEG":
        text = (im.info.get("comment") or b"").decode("utf-8", "replace") or None
    return json.loads(text) if text else None


def island(name):
    """The build an island's .blend came from (world/build/<name>.build.json, written when it was saved),
    checked against the file as it is now. A build with no stamp, a stale one, or one made from
    uncommitted scripts cannot be traced to a commit."""
    blend = WORLD / "build" / f"{name}.blend"
    stamp_file = WORLD / "build" / f"{name}.build.json"
    st = json.loads(stamp_file.read_text()) if stamp_file.exists() else None
    problem = ("no build stamp" if not st else "the .blend changed since its stamp" if st.get("hash") != digest(blend)
               else "built from uncommitted scripts" if st.get("uncommitted") else None)
    if problem and os.environ.get("DAAG_ALLOW_DIRTY") != "1":
        sys.exit(f"{name}: {problem}; rebuild it at a commit (blender -b -P src/build_{name}.py -- 1), "
                 "or set DAAG_ALLOW_DIRTY=1 for a trial")
    return dict(st or {"hash": digest(blend)}, name=name, **({"problem": problem} if problem else {}))


def at_commit(c, path, key=None):
    """A file, or one entry of a JSON file, as it was at commit c."""
    text = git("show", f"{c}:{path}")
    if not text or key is None:
        return text
    data = json.loads(text)
    if isinstance(data.get("characters"), list):
        if key in data.get("sheets", {}):
            return {"sheet": key, "about": data["sheets"][key],
                    "people": [e["id"] for e in data["characters"] if key in e.get("sheets", [])]}
        return next((e for e in data["characters"] if e.get("id") == key), None)
    return data.get(key)


def show(path, depth=0, seen=None):
    seen = seen if seen is not None else set()
    pad = "    " * depth
    rec = read(path)
    if rec is None:
        print(f"{pad}{rel(path)}: no record")
        return
    print(f"{pad}{rel(path)}  [{rec['kind']}]  commit {rec.get('commit')}  made {rec.get('made')}")
    print(f"{pad}  model: {json.dumps(rec.get('model'))}")
    if rec.get("uncommitted"):
        print(f"{pad}  UNCOMMITTED when made: {rec['uncommitted']}")
    if rec.get("backfilled"):
        print(f"{pad}  backfilled: {rec['backfilled']}")
    src = rec.get("source")
    if src:
        entry = at_commit(rec["commit"], src["file"], src.get("id") or src.get("shot") or src.get("sheet"))
        if src.get("variant") and isinstance(entry, dict):
            entry = dict({k: v for k, v in entry.items() if k != "variants"}, **entry["variants"].get(src["variant"], {}),
                         variant=src["variant"])
        print(f"{pad}  source: {src['file']} @ {rec['commit']}: {json.dumps(entry, ensure_ascii=False)[:500]}")
        if rec["kind"] == "cast" and entry and "kind" in entry:
            spec = json.loads(git("show", f"{rec['commit']}:{src['file']}"))
            text = spec["kinds"][entry["kind"]].format(colour=entry.get("colour", ""), who=entry.get("who", ""),
                                                       extra=entry.get("extra", ""), sandals=spec["sandals"])
            prefix = spec["prefix"] if isinstance(spec["prefix"], str) else spec["prefix"]["character"]
            print(f"{pad}  prompt: {prefix} {text}")
    if rec.get("island"):
        print(f"{pad}  island: {json.dumps(rec['island'])}")
    for i in rec.get("inputs", []):
        p = REPO / i["path"]
        state = "missing" if not p.exists() else ("same file" if digest(p) == i["hash"] else "CHANGED since")
        print(f"{pad}  input {i['role']}: {i['path']} @ {i.get('commit')} ({state})")
        if p.exists() and p not in seen:
            seen.add(p)
            show(p, depth + 1, seen)


def export(src, out):
    """A JPEG copy for the site, with the record in its comment."""
    rec = dict(read(src) or {}, exported_from={"path": rel(src), "hash": digest(src)})
    Image.open(src).convert("RGB").save(out, "JPEG", quality=90, comment=json.dumps(rec, ensure_ascii=False).encode())


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "show":
        show(Path(sys.argv[2]).resolve())
    elif len(sys.argv) >= 4 and sys.argv[1] == "export":
        export(Path(sys.argv[2]).resolve(), Path(sys.argv[3]).resolve())
    else:
        sys.exit(__doc__)
