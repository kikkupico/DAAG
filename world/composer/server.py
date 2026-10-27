#!/usr/bin/env python3
"""Composer backend server for the DAAG 3D Island & Shot Composition App.

    python3 world/composer/server.py [port] [--host ADDRESS]

Serves the Three.js 3D composer interface, island models, prop models,
cast reference pictures, and provides REST API endpoints to load, compose,
and save book shots with prompt and character exports for image AI generators.
"""

import base64
import hashlib
import html
import io
import json
import math
import mimetypes
import os
import re
import shutil
import signal
import socket
import subprocess
import tempfile
import sys
import threading
import time
import zipfile
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

HERE = Path(__file__).resolve().parent
WORLD = HERE.parent
REPO = WORLD.parent

# Asset roots
ISLANDS = ("arche", "paxos")
BUILD_DIR = WORLD / "build"
MODELS_DIR = BUILD_DIR / "composer"      # <island>.glb, made by export_glb.py from build/<island>.blend
TERRAIN_DIR = BUILD_DIR / "terrain"      # <island>/sites.json, in the same Blender coordinates
PROPS_DIR = BUILD_DIR / "composer" / "props"   # <id>.glb and props.json, made by export_props.py from the islands
BOOKS_DIR = REPO / "books"
# books/ pages that are not books of shots
NOT_BOOKS = {"eighteen-books-in-one-scroll"}
CAST_DIR = WORLD / "cast"
CAST_IMG_DIR = WORLD / "cast" / "out" / "nb2"
PANELS_DIR = WORLD / "panels"
CAPTURES_DIR = HERE / "captures"
RENDERS_DIR = HERE / "renders"          # full-detail Blender renders asked for from the page
THUMBS_DIR = HERE / "thumbs"
FLUX_DIR = HERE / "flux"                 # FLUX trial pictures from the composer, with a note beside each
TESTS_DIR = HERE / "tests"               # throwaway shots for trying world changes: shots.json and renders/<id>/
TESTS_FILE = TESTS_DIR / "shots.json"
KEEP_RENDERS = 6                         # renders kept per test shot

for _d in (CAPTURES_DIR, RENDERS_DIR, THUMBS_DIR, FLUX_DIR, TESTS_DIR / "renders"):
    _d.mkdir(parents=True, exist_ok=True)

# Register custom MIME types
mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("model/gltf+json", ".gltf")
mimetypes.add_type("application/octet-stream", ".bin")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("application/json", ".json")

PORT = int(next((a for a in sys.argv[1:] if a.isdigit()), 8767))
HOST = sys.argv[sys.argv.index("--host") + 1] if "--host" in sys.argv[1:-1] else "0.0.0.0"

shots_lock = threading.Lock()

NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


def safe_name(value):
    """A single path component made of plain characters, or None."""
    return value if isinstance(value, str) and NAME_RE.match(value) and ".." not in value else None


def inside(root, rel):
    """root/rel resolved, if it is a file under root; otherwise None."""
    try:
        p = (root / rel).resolve()
        p.relative_to(root.resolve())
    except (ValueError, OSError):
        return None
    return p if p.is_file() else None


IMAGE_KINDS = (("previs-", "previs"), ("scene-", "scene"), ("ligne-claire-", "ligne"), ("flux-scene-", "scene"))


def shot_images(book_id):
    """The pictures under panels/<book>/<shot>[/<variant>]/, newest of each kind, keyed "shot" or "shot/variant"."""
    out = {}
    root = PANELS_DIR / book_id
    for png in root.rglob("*.png"):
        rel_dir = png.parent.relative_to(root)
        kind = next((k for p, k in IMAGE_KINDS if png.name.startswith(p)), None)
        if not kind or not rel_dir.parts or len(rel_dir.parts) > 2:
            continue
        slot = out.setdefault(rel_dir.as_posix(), {})
        if kind not in slot or png.stat().st_mtime > slot[kind][1]:
            slot[kind] = (png.relative_to(PANELS_DIR).as_posix(), png.stat().st_mtime)
    return {k: {kind: f"/panels/{p}" for kind, (p, _) in v.items()} for k, v in out.items()}


def thumbnail(png, width):
    """A cached JPEG of png no wider than width, or None if it cannot be made."""
    try:
        from PIL import Image
        st = png.stat()
        name = hashlib.sha1(f"{png}{st.st_mtime_ns}{width}".encode()).hexdigest()[:20] + ".jpg"
        out = THUMBS_DIR / name
        if not out.exists():
            im = Image.open(png).convert("RGB")
            im.thumbnail((width, width * 4))
            im.save(out, "JPEG", quality=82)
        return out
    except Exception:
        return None


def rel(path):
    """path relative to the repository, or as is when it lies elsewhere."""
    try:
        return str(path.relative_to(REPO))
    except ValueError:
        return str(path)


def prompt_parts():
    """The style prompts and cast note, taken from world/panels/pipeline.py so they cannot drift."""
    sys.path.insert(0, str(WORLD))
    sys.path.insert(0, str(PANELS_DIR))
    try:
        import pipeline
    except Exception as e:  # PIL or the Gemini client missing: the page falls back to its own copy
        return {"error": str(e)}
    return {"styles": {k: {"keep": v[0], "picture": v[1]} for k, v in pipeline.STYLES.items()},
            "cast_note": pipeline.CAST_NOTE}


def get_cast_data():
    """Load character definitions from cast.json and attach available portrait paths."""
    cast_file = CAST_DIR / "cast.json"
    if not cast_file.exists():
        return {"prefix": "", "sheets": {}, "characters": []}

    with open(cast_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    kinds = data.get("kinds", {})
    sheets = data.get("sheets", {})
    characters = []

    for c in data.get("characters", []):
        cid = c.get("id")
        kind_name = c.get("kind", "")
        kind_desc = kinds.get(kind_name, "")
        if "colour" in c and "{colour}" in kind_desc:
            kind_desc = kind_desc.replace("{colour}", c["colour"])
        if "who" in c and "{who}" in kind_desc:
            kind_desc = kind_desc.replace("{who}", c["who"])
        if "extra" in c and "{extra}" in kind_desc:
            kind_desc = kind_desc.replace("{extra}", c["extra"])
        else:
            kind_desc = kind_desc.replace("{extra}", "")
        kind_desc = kind_desc.replace("{sandals}", data.get("sandals", ""))

        img_path = CAST_IMG_DIR / f"{cid}.png"
        has_image = img_path.exists()
        img_url = f"/cast/images/{cid}.png" if has_image else None

        # Friendly title
        clean_name = cid.replace("-", " ").title()

        char_sheets = c.get("sheets", [])
        sheet_labels = [sheets.get(s, s) for s in char_sheets]

        characters.append({
            "id": cid,
            "name": clean_name,
            "kind": kind_name,
            "description": kind_desc.strip(),
            "sheets": char_sheets,
            "sheet_labels": sheet_labels,
            "has_image": has_image,
            "image_url": img_url,
            "colour": c.get("colour", "")
        })

    return {
        "prefix": data.get("prefix", ""),
        "sheets": sheets,
        "characters": characters
    }


def get_sites(island):
    """Named places of an island with their Blender coordinates (metres, z up), from the terrain build."""
    f = TERRAIN_DIR / island / "sites.json"
    if not f.is_file():
        return []
    d = json.loads(f.read_text(encoding="utf-8"))
    out = []

    def add(sid, name, p, face=None):
        out.append({"id": sid, "name": name, "x": p["x"], "y": p["y"], "z": p.get("z", 3.0), "face": face})

    if island == "arche":
        for n, p in d.get("ports", {}).items():
            q = next((b for b in d["buildings"] if b.get("house") == int(n)), None)
            add(f"house-{n}", f"House {n} (port {n})", q or p, q and q.get("ang"))
        for c in d.get("camps", []):
            add(f"camp-{c['n']}", f"Camp {c['n']}", c)
        for p in d.get("posts", []):
            add(f"post-{p['n']}", f"Post {p['n']}", p, p.get("facing"))
        if d.get("crown"):
            add("crown", "The Crown", d["crown"])
        if d.get("granary"):
            add("granary", "Granary", d["granary"], d["granary"].get("face"))
        for i, p in enumerate(d.get("sundials", []), 1):
            add(f"sundial-{i}", f"Sundial {i}", p)
    else:
        for key, name in (("chamber", "The Chamber"), ("tholos", "The Tholos"), ("oracle", "Oracle at the Fork"),
                          ("stoa", "Stoa"), ("festival", "Festival ground")):
            if d.get(key):
                add(key, name, d[key], d[key].get("face"))
        for h in d.get("harbours", []):
            add(f"harbour-{h['name']}", f"Harbour of {h['name'].title()}", h)
        for lib in d.get("libraries", []):
            add(f"library-{lib['n']}", f"Library {lib['n']}", lib, lib.get("face"))
    return out


def get_frames(island):
    """Building frames as world/src/shots_panels.frame() has them: x, y, floor z, and the angle the door
    faces, for the shots whose "site" gives cam and target in the building's own frame."""
    f = TERRAIN_DIR / island / "sites.json"
    if island != "paxos" or not f.is_file():
        return {}
    d = json.loads(f.read_text(encoding="utf-8"))
    frames = {}
    for key in ("chamber", "tholos", "oracle", "stoa", "festival"):
        s = d.get(key)
        if not s:
            continue
        if key == "chamber":     # its door looks across the bay to the Tholos
            face = math.atan2(d["tholos"]["y"] - s["y"], d["tholos"]["x"] - s["x"])
            frames[key] = [s["x"], s["y"], s["z"] + 1.02, face]
        else:
            frames[key] = [s["x"], s["y"], s["z"], s.get("face", s.get("ang", 0.0))]
    return frames


def get_props_catalog():
    """The live props: the prototypes of the built islands, exported by export_props.py."""
    f = PROPS_DIR / "props.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.is_file() else []


def book_title(slug):
    """A book's title from its page, up to the dash that introduces the paper's name."""
    page = BOOKS_DIR / slug / "index.html"
    m = re.search(r"<title[^>]*>([^<]+)", page.read_text(encoding="utf-8")) if page.is_file() else None
    return m.group(1).split(" — ")[0].strip() if m else slug.replace("-", " ").title()


def book_ids():
    """The books of the site: each folder under books/ with a page, except pages that are not books."""
    if not BOOKS_DIR.is_dir():
        return []
    return [p.name for p in sorted(BOOKS_DIR.iterdir())
            if p.is_dir() and (p / "index.html").is_file() and p.name not in NOT_BOOKS and safe_name(p.name)]


def get_available_books():
    """Every book of the site with the number of shots in its world/panels/<book>/shots.json (none yet is 0)."""
    books = []
    for slug in book_ids():
        shots_file = PANELS_DIR / slug / "shots.json"
        entry = {"id": slug, "title": book_title(slug), "shots_count": 0, "shots": []}
        if shots_file.is_file():
            try:
                shots = list(json.loads(shots_file.read_text(encoding="utf-8")))
                entry.update(shots_count=len(shots), shots=shots)
            except Exception as e:
                entry["error"] = str(e)
        books.append(entry)
    return books


# --- Full-detail renders: the composed shot rendered by Blender from the built island ---------------

RENDER_KEYS = {"cam", "target", "lens", "light", "sun_from", "base", "site", "dof", "hazeD", "hazeS", "placed_props",
               "sun_elev", "sun_scale", "fog_scale"}
RES_1K = {"1:1": (1024, 1024), "2:3": (848, 1264), "3:2": (1264, 848), "3:4": (896, 1200), "4:3": (1200, 896),
          "4:5": (928, 1152), "5:4": (1152, 928), "9:16": (768, 1376), "16:9": (1376, 768), "21:9": (1584, 672)}
QUALITIES = ("preview", "check", "final")      # render.py: half size 32 samples / full size 48 / full size 160
SITES_WITH_FRAME = ("chamber", "tholos", "oracle", "stoa", "festival")
jobs = {}
render_lock = threading.Lock()                 # one Blender at a time


def light_presets_full():
    """render.py's PRESETS as plain data: {name: {sky, elev, strength, ...}}, read from its source so the
    composer and the renderer cannot disagree about what a time of day is."""
    import ast
    tree = ast.parse((WORLD / "src" / "render.py").read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", "") == "PRESETS":
            return {k.value: {kw.arg: ast.literal_eval(kw.value) for kw in v.keywords}
                    for k, v in zip(node.value.keys, node.value.values)}
    return {}


def light_presets():
    """The light names render.py knows."""
    return list(light_presets_full())


def is_coordinate(v):
    """A number, or a height such as "+1.7" above the ground (shots_panels.place)."""
    return isinstance(v, (int, float)) or (isinstance(v, str) and re.fullmatch(r"[+-]?\d+(\.\d+)?", v) is not None)


def clean_spec(body):
    """The shot a render is asked for, cut down to what render.py reads, or (None, message)."""
    island = body.get("island")
    shot = body.get("shot")
    if island not in ISLANDS or not isinstance(shot, dict):
        return None, "Needs an island and a shot object"
    spec = {k: v for k, v in shot.items() if k in RENDER_KEYS and v is not None}
    for key in ("cam", "target"):
        p = spec.get(key)
        if not (isinstance(p, list) and len(p) == 3 and all(is_coordinate(v) for v in p)):
            return None, f"'{key}' must be three coordinates"
    if "placed_props" in spec:
        items = spec["placed_props"]
        ok = isinstance(items, list) and len(items) <= 200 and all(
            isinstance(p, dict) and safe_name(p.get("prop")) and isinstance(p.get("at"), list) and len(p["at"]) == 3
            and all(isinstance(v, (int, float)) for v in p["at"]) and isinstance(p.get("face", 0), (int, float))
            and isinstance(p.get("scale", 1), (int, float)) for p in items)
        if not ok:
            return None, "'placed_props' must be a list of {prop, at, face, scale}"
    for key, lo, hi in (("sun_elev", -5, 85), ("sun_scale", 0.05, 5), ("fog_scale", 0, 10), ("sun_from", 0, 360)):
        if key in spec and not (isinstance(spec[key], (int, float)) and lo <= spec[key] <= hi):
            return None, f"'{key}' must be a number from {lo} to {hi}"
    if spec.get("light") not in light_presets():
        spec["light"] = "golden"
    if spec.get("site") is not None and spec["site"] not in SITES_WITH_FRAME:
        return None, "Unknown site"
    if spec.get("base") is not None and not safe_name(spec["base"]):
        return None, "Invalid base"
    spec["island"] = island
    aspect = shot.get("aspect") if shot.get("aspect") in RES_1K else "16:9"
    scale = {"1K": 1, "2K": 2}.get(body.get("size"), 1)
    spec["res"] = [d * scale for d in RES_1K[aspect]]
    return spec, None


def render_note(job, started):
    """What a test render was made against: the island's .blend as it was, and the repository state."""
    def git(*a):
        return subprocess.run(["git", *a], cwd=REPO, capture_output=True, text=True).stdout.strip()
    blend = BUILD_DIR / f"{job['spec']['island']}.blend"
    return {"quality": job["quality"], "island": job["spec"]["island"], "made": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "blend_built": datetime.fromtimestamp(blend.stat().st_mtime).strftime("%Y-%m-%dT%H:%M:%S") if blend.exists() else None,
            "commit": git("rev-parse", "--short", "HEAD"),
            "uncommitted": [l.split(None, 1)[1] for l in git("status", "--porcelain", "--", "world/src").splitlines()]}


def read_tests():
    return json.loads(TESTS_FILE.read_text(encoding="utf-8")) if TESTS_FILE.is_file() else {}


def test_renders(test_id):
    """The renders of a test shot, newest first, each with its note."""
    out = []
    for png in sorted((TESTS_DIR / "renders" / test_id).glob("*.png"), reverse=True):
        note = png.with_suffix(".json")
        out.append(dict(json.loads(note.read_text()) if note.exists() else {}, url=f"/tests/renders/{test_id}/{png.name}"))
    return out


flux_lock = threading.Lock()                   # one FLUX at a time: it takes most of the Mac's memory


def clean_flux(body):
    """A FLUX request reduced to what flux_job.py takes, or (None, message). The previs is a capture or a render."""
    import importlib.util
    name = body.get("previs")
    if not isinstance(name, str) or ":" not in name:
        return None, "'previs' must be capture:<file> or render:<file>"
    kind, _, fname = name.partition(":")
    png = inside({"capture": CAPTURES_DIR, "render": RENDERS_DIR}.get(kind, HERE / "nowhere"), fname)
    if not png:
        return None, f"No such {kind}: {fname}"
    prompt = body.get("prompt")
    cast = body.get("cast", [])
    if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > 8000:
        return None, "A prompt is required"
    cast_dir = CAST_IMG_DIR
    if not (isinstance(cast, list) and len(cast) <= 8 and all(safe_name(c) and (cast_dir / f"{c}.png").is_file() for c in cast)):
        return None, "'cast' must list ids that have portraits"
    seed = body.get("seed", 7)
    if not isinstance(seed, int) or not 0 <= seed < 2**31:
        return None, "'seed' must be an integer"
    return {"previs": str(png), "prompt": prompt.strip(), "cast": cast, "seed": seed}, None


def run_flux(job_id):
    """Generate one picture with local FLUX.2 klein in its own process (the flux venv's Python)."""
    job = jobs[job_id]
    with flux_lock:
        job["status"] = "running"
        started = time.time()
        out = FLUX_DIR / f"{job_id}.png"
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(dict(job["spec"], out=str(out)), f)
        try:
            py = Path.home() / "Projects/flux/.venv/bin/python"
            if not py.is_file():
                raise RuntimeError(f"FLUX is not installed ({py} missing); see world/fluxlocal.py")
            done = subprocess.run([str(py), str(HERE / "flux_job.py"), f.name], capture_output=True, text=True, timeout=1800)
            if done.returncode == 0 and out.is_file():
                job.update(status="done", url=f"/flux/{job_id}.png")
            else:
                job.update(status="error", error=(done.stdout[-600:] + done.stderr[-1000:]).strip() or "FLUX failed")
        except Exception as e:
            job.update(status="error", error=str(e))
        finally:
            os.unlink(f.name)
            job["seconds"] = round(time.time() - started)


def run_render(job_id):
    """Render one job with Blender, shots_panels and render.py, and move the picture to composer/renders/
    (or to tests/renders/<id>/ for a test shot, with a note of the world it was made against)."""
    job = jobs[job_id]
    with render_lock:
        job["status"] = "running"
        started = time.time()
        key = f"composer__{job_id}"
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({key: job["spec"]}, f)
        try:
            done = subprocess.run(
                ["blender", "-b", f"build/{job['spec']['island']}.blend", "-P", "src/render.py", "--",
                 "shots_panels", key, job["quality"]],
                cwd=WORLD, env=dict(os.environ, PANEL_SPECS=f.name), capture_output=True, text=True, timeout=3600)
            out_dir = {"preview": "preview", "check": "check"}.get(job["quality"], "final")
            png = WORLD / "renders" / out_dir / f"{key}.png"
            if done.returncode == 0 and png.is_file():
                if job.get("test"):
                    dest = TESTS_DIR / "renders" / job["test"]
                    dest.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(png), dest / f"{job_id}.png")
                    (dest / f"{job_id}.json").write_text(json.dumps(render_note(job, started), indent=1))
                    for old in sorted(dest.glob("*.png"))[:-KEEP_RENDERS]:
                        old.unlink()
                        old.with_suffix(".json").unlink(missing_ok=True)
                    job.update(status="done", url=f"/tests/renders/{job['test']}/{job_id}.png")
                else:
                    shutil.move(str(png), RENDERS_DIR / f"{job_id}.png")
                    job.update(status="done", url=f"/renders/{job_id}.png")
            else:
                job.update(status="error", error=(done.stdout[-800:] + done.stderr[-800:]).strip() or "Blender failed")
        except Exception as e:
            job.update(status="error", error=str(e))
        finally:
            os.unlink(f.name)
            job["seconds"] = round(time.time() - started)


class ComposerHandler(SimpleHTTPRequestHandler):
    """HTTP handler with range-request file streaming and Composer REST APIs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def log_message(self, format, *args):
        # Concise request logging
        # send_error logs through here with other arguments than the request line, so format them whole
        sys.stderr.write(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}\n")

    def end_headers(self):
        # Range acceptance (same origin only: no CORS headers, so other pages cannot write shots)
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_HEAD(self):
        url = urlsplit(self.path)
        path = unquote(url.path)
        local_file = inside(HERE, path.lstrip("/"))
        if local_file:
            mime = mimetypes.guess_type(str(local_file))[0] or "application/octet-stream"
            self.head_file(local_file, mime)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def head_file(self, file_path, content_type):
        try:
            stat = file_path.stat()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(stat.st_size))
            self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
            self.end_headers()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)

    def do_GET(self):
        url = urlsplit(self.path)
        path = unquote(url.path)

        # API routing
        if path == "/api/status":
            self.send_json({
                "status": "ok",
                "version": "1.1.0",
                "repo": str(REPO),
                "books_count": len(get_available_books()),
                "cast_count": len(get_cast_data().get("characters", [])),
                "flux": (Path.home() / "Projects/flux/.venv/bin/python").is_file(),
                "props_count": len(get_props_catalog())
            })
            return

        if path == "/api/books":
            self.send_json({"books": get_available_books()})
            return

        if path.startswith("/api/books/") and path.endswith("/shots"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "books" and parts[3] == "shots":
                book_id = safe_name(parts[2])
                if not book_id:
                    self.send_json({"error": "Invalid book id"}, status=400)
                    return
                shots_file = PANELS_DIR / book_id / "shots.json"
                if shots_file.exists():
                    try:
                        data = json.loads(shots_file.read_text(encoding="utf-8"))
                        self.send_json({"book": book_id, "shots": data, "images": shot_images(book_id)})
                    except Exception as e:
                        self.send_json({"error": f"Failed to parse shots.json: {e}"}, status=500)
                else:
                    self.send_json({"book": book_id, "shots": {}})
                return

        if path == "/api/cast":
            self.send_json(get_cast_data())
            return

        m = re.fullmatch(r"/api/sites/(\w+)", path)
        if m and m.group(1) in ISLANDS:
            self.send_json({"island": m.group(1), "sites": get_sites(m.group(1)), "frames": get_frames(m.group(1))})
            return

        m = re.fullmatch(r"/api/render/([\w-]+)", path)
        if m:
            job = jobs.get(m.group(1))
            if job:
                self.send_json({k: v for k, v in job.items() if k != "spec"})
            else:
                self.send_json({"error": "No such job"}, status=404)
            return

        if path == "/api/tests":
            tests = read_tests()
            self.send_json({"shots": tests, "renders": {tid: test_renders(tid) for tid in tests}})
            return

        if path == "/api/lights":
            self.send_json({"presets": light_presets_full()})
            return

        if path == "/api/prompt":
            self.send_json(prompt_parts())
            return

        if path == "/api/props":
            self.send_json({"props": get_props_catalog()})
            return

        if path.startswith("/api/bundle"):
            self.handle_export_bundle(url.query)
            return

        # Static asset routing
        # 1. Models
        m = re.fullmatch(r"/models/(\w+)\.glb", path)
        if m and m.group(1) in ISLANDS:
            glb = MODELS_DIR / f"{m.group(1)}.glb"
            if glb.is_file():
                self.stream_file(glb, "model/gltf-binary")
            else:
                self.send_error(HTTPStatus.NOT_FOUND, f"Run: sh world/composer/export.sh {m.group(1)}")
            return

        # 2. Props
        m = re.fullmatch(r"/props/live/([\w.-]+\.glb)", path)
        if m:
            glb = inside(PROPS_DIR, m.group(1))
            if glb:
                self.stream_file(glb, "model/gltf-binary")
            else:
                self.send_error(HTTPStatus.NOT_FOUND, "Run: sh world/composer/export.sh")
            return

        # 3. Cast Images
        if path.startswith("/cast/images/"):
            filename = path[len("/cast/images/"):]
            file_path = inside(CAST_IMG_DIR, filename)
            if file_path:
                self.stream_file(file_path, "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, f"Cast image not found: {filename}")
            return

        # Pictures of the books' shots (previs, scenes), full size or as a thumbnail (?w=480)
        if path.startswith("/panels/") and path.endswith(".png"):
            png = inside(PANELS_DIR, path[len("/panels/"):])
            if png:
                width = int(parse_qs(url.query).get("w", ["0"])[0] or 0)
                thumb = thumbnail(png, min(width, 2000)) if width else None
                self.stream_file(thumb or png, "image/jpeg" if thumb else "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "No such picture")
            return

        if path.startswith("/tests/renders/") and path.endswith(".png"):
            png = inside(TESTS_DIR / "renders", path[len("/tests/renders/"):])
            if png:
                width = int(parse_qs(url.query).get("w", ["0"])[0] or 0)
                thumb = thumbnail(png, min(width, 2000)) if width else None
                self.stream_file(thumb or png, "image/jpeg" if thumb else "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "No such render")
            return

        m = re.fullmatch(r"/ground/(\w+)\.png", path)
        if m and m.group(1) in ISLANDS:
            png = MODELS_DIR / f"{m.group(1)}_ground.png"
            if png.is_file():
                width = int(parse_qs(url.query).get("w", ["0"])[0] or 0)
                thumb = thumbnail(png, min(width, 2000)) if width else None
                self.stream_file(thumb or png, "image/jpeg" if thumb else "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "Run: sh world/composer/export.sh")
            return

        if path.startswith("/flux/") and path.endswith(".png"):
            png = inside(FLUX_DIR, path[len("/flux/"):])
            if png:
                self.stream_file(png, "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "No such picture")
            return

        if path.startswith("/renders/") and path.endswith(".png"):
            png = inside(RENDERS_DIR, path[len("/renders/"):])
            if png:
                self.stream_file(png, "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "No such render")
            return

        # 4. Captured shots
        if path.startswith("/captures/"):
            filename = path[len("/captures/"):]
            file_path = inside(CAPTURES_DIR, filename)
            if file_path:
                mime = "image/png" if filename.endswith(".png") else "image/jpeg"
                self.stream_file(file_path, mime)
                return
            self.send_error(HTTPStatus.NOT_FOUND, f"Capture not found: {filename}")
            return

        # 5. Default app files
        if path == "/" or path == "/index.html":
            self.stream_file(HERE / "index.html", "text/html; charset=utf-8")
            return

        # Standard file fallback in HERE
        local_file = inside(HERE, path.lstrip("/"))
        if local_file and local_file.suffix in (".js", ".css", ".html", ".json", ".png", ".svg"):
            mime = mimetypes.guess_type(str(local_file))[0] or "application/octet-stream"
            self.stream_file(local_file, mime)
            return

        self.send_error(HTTPStatus.NOT_FOUND, f"Resource not found: {path}")

    def do_POST(self):
        url = urlsplit(self.path)
        path = unquote(url.path)

        # 1. Save shot into book's shots.json
        if path.startswith("/api/books/") and path.endswith("/shots"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "books" and parts[3] == "shots":
                book_id = safe_name(parts[2])
                if book_id not in book_ids():
                    self.send_json({"error": f"'{parts[2]}' is not a book of the site"}, status=400)
                    return
                body = self.read_json_body()
                if body is None:
                    return
                self.handle_save_shot(book_id, body)
                return

        # 1c. A FLUX trial picture from a capture or a render
        if path == "/api/flux":
            body = self.read_json_body()
            if body is None:
                return
            spec, err = clean_flux(body)
            if err:
                self.send_json({"error": err}, status=400)
                return
            job_id = datetime.now().strftime("%Y%m%d-%H%M%S-%f")[:-3]
            jobs[job_id] = {"id": job_id, "status": "queued", "kind": "flux", "spec": spec}
            threading.Thread(target=run_flux, args=(job_id,), daemon=True).start()
            self.send_json({"job": job_id, "status": "queued"})
            return

        # 1a. Throwaway test shots
        if path in ("/api/tests", "/api/tests/delete"):
            body = self.read_json_body()
            if body is None:
                return
            test_id = safe_name(body.get("id"))
            if not test_id:
                self.send_json({"error": "A plain 'id' is required"}, status=400)
                return
            with shots_lock:
                tests = read_tests()
                if path.endswith("/delete"):
                    tests.pop(test_id, None)
                    shutil.rmtree(TESTS_DIR / "renders" / test_id, ignore_errors=True)
                else:
                    spec, err = clean_spec({"island": body.get("shot", {}).get("island"), "shot": body.get("shot")})
                    if err:
                        self.send_json({"error": err}, status=400)
                        return
                    tests[test_id] = {k: v for k, v in body["shot"].items() if k in RENDER_KEYS | {"island", "aspect"}}
                TESTS_DIR.mkdir(parents=True, exist_ok=True)
                TESTS_FILE.write_text(json.dumps(tests, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            self.send_json({"status": "success", "count": len(tests)})
            return

        # 1b. Render a composed shot in full detail with Blender
        if path == "/api/render":
            body = self.read_json_body()
            if body is None:
                return
            spec, err = clean_spec(body)
            quality = body.get("quality", "check")
            if err or quality not in QUALITIES:
                self.send_json({"error": err or "Unknown quality"}, status=400)
                return
            test = body.get("test")
            if test is not None and test not in read_tests():
                self.send_json({"error": f"No test shot '{test}'"}, status=400)
                return
            job_id = datetime.now().strftime("%Y%m%d-%H%M%S-%f")[:-3]
            jobs[job_id] = {"id": job_id, "status": "queued", "quality": quality, "spec": spec,
                            **({"test": test} if test else {})}
            threading.Thread(target=run_render, args=(job_id,), daemon=True).start()
            self.send_json({"job": job_id, "status": "queued"})
            return

        # 2. Capture screenshot & save to disk
        if path == "/api/capture":
            body = self.read_json_body()
            if body is None:
                return
            self.handle_save_capture(body)
            return

        self.send_error(HTTPStatus.NOT_FOUND, f"POST endpoint not found: {path}")

    def read_json_body(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                self.send_json({"error": "Empty body"}, status=400)
                return None
            if length > 64 * 1024 * 1024:
                self.send_json({"error": "Body too large"}, status=413)
                return None
            data = self.rfile.read(length)
            return json.loads(data.decode("utf-8"))
        except Exception as e:
            self.send_json({"error": f"Invalid JSON payload: {e}"}, status=400)
            return None

    def handle_save_shot(self, book_id, body):
        """Merge a shot into panels/<book>/shots.json.

        A shot that exists keeps every key the body does not name (base, site, variants, ...); with
        "variant" the keys land in that variant instead. Keys set to null are removed. "if_new" holds keys
        written only when the shot is created. The file is
        replaced atomically after a .bak copy of the previous one."""
        shot_id = safe_name(body.get("shot_id"))
        fields = body.get("shot")
        variant = body.get("variant")
        if not shot_id or not isinstance(fields, dict) or not fields:
            self.send_json({"error": "A plain 'shot_id' and a non-empty 'shot' object are required"}, status=400)
            return
        if variant is not None and not safe_name(variant):
            self.send_json({"error": "Invalid variant name"}, status=400)
            return

        book_dir = PANELS_DIR / book_id
        shots_file = book_dir / "shots.json"

        with shots_lock:
            shots = {}
            if shots_file.exists():
                try:
                    shots = json.loads(shots_file.read_text(encoding="utf-8"))
                except Exception as e:
                    self.send_json({"error": f"Failed to read existing shots.json: {e}"}, status=500)
                    return
            created = shot_id not in shots
            entry = shots.setdefault(shot_id, {})
            if created and isinstance(body.get("if_new"), dict):
                entry.update(body["if_new"])
            target = entry.setdefault("variants", {}).setdefault(variant, {}) if variant else entry
            for k, v in fields.items():
                if v is None:
                    target.pop(k, None)
                else:
                    target[k] = v

            try:
                book_dir.mkdir(parents=True, exist_ok=True)
                if shots_file.exists():
                    shutil.copy2(shots_file, shots_file.with_suffix(".json.bak"))
                tmp = shots_file.with_suffix(".json.tmp")
                tmp.write_text(json.dumps(shots, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
                os.replace(tmp, shots_file)
            except Exception as e:
                self.send_json({"error": f"Failed to write shots.json: {e}"}, status=500)
                return
            self.send_json({
                "status": "success",
                "book": book_id,
                "shot_id": shot_id,
                "variant": variant,
                "created": created,
                "shots_count": len(shots),
                "file": rel(shots_file)
            })

    def handle_save_capture(self, body):
        """Save a viewport capture and its metadata sidecar under composer/captures/.

        Captures never go into world/panels: previs.py owns the previs-*.png files there, and the
        scene step refuses any it did not render."""
        image_data = body.get("image_data")
        shot_id = body.get("shot_id") or "capture"
        metadata = body.get("metadata", {})

        if not isinstance(image_data, str) or not image_data:
            self.send_json({"error": "Missing image_data"}, status=400)
            return
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        try:
            img_bytes = base64.b64decode(image_data, validate=True)
        except Exception as e:
            self.send_json({"error": f"Base64 decoding failed: {e}"}, status=400)
            return
        if not img_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            self.send_json({"error": "image_data is not a PNG"}, status=400)
            return

        stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")[:-3]
        clean_shot = re.sub(r"[^a-zA-Z0-9_-]", "_", str(shot_id))[:64]
        stem = f"{clean_shot}_{stamp}"
        (CAPTURES_DIR / f"{stem}.png").write_bytes(img_bytes)
        (CAPTURES_DIR / f"{stem}.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        self.send_json({
            "status": "success",
            "filename": f"{stem}.png",
            "url": f"/captures/{stem}.png",
            "size_bytes": len(img_bytes)
        })

    def handle_export_bundle(self, query_string):
        """Export a zip file containing previs image, prompt, and character references."""
        params = parse_qs(query_string)
        shot_id = re.sub(r"[^a-zA-Z0-9_-]", "_", params.get("shot", ["shot"])[0])[:64]
        capture_name = params.get("capture", [""])[0]
        cast_ids = params.get("cast", [])
        prompt_text = params.get("prompt", [""])[0]

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Prompt file
            zf.writestr("prompt.txt", prompt_text)

            # 2. Previs / capture image (Image 1)
            if capture_name:
                is_render = capture_name.startswith("render:")
                cap_file = inside(RENDERS_DIR if is_render else CAPTURES_DIR, capture_name.removeprefix("render:"))
                if cap_file:
                    zf.write(cap_file, arcname="01_image_previs.png")

            # 3. Cast reference images (Image 2..N)
            idx = 2
            for cid in cast_ids:
                cfile = inside(CAST_IMG_DIR, f"{cid}.png") if safe_name(cid) else None
                if cfile:
                    zf.write(cfile, arcname=f"{idx:02d}_{cid}.png")
                    idx += 1

        zip_data = buf.getvalue()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f'attachment; filename="daag_shot_{shot_id}.zip"')
        self.send_header("Content-Length", str(len(zip_data)))
        self.end_headers()
        self.wfile.write(zip_data)

    def stream_file(self, file_path, content_type):
        """Stream file with HTTP 206 Partial Content support for large GLB models."""
        try:
            stat = file_path.stat()
            file_size = stat.st_size
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return

        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes="):
            # Parse Range: bytes=start-end
            try:
                ranges = range_header[len("bytes="):].split("-")
                start = int(ranges[0]) if ranges[0] else 0
                end = int(ranges[1]) if ranges[1] else file_size - 1
                if start >= file_size or end >= file_size or start > end:
                    self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    return

                length = end - start + 1
                self.send_response(HTTPStatus.PARTIAL_CONTENT)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
                self.end_headers()

                with open(file_path, "rb") as f:
                    f.seek(start)
                    remaining = length
                    while remaining > 0:
                        chunk = f.read(min(remaining, 65536))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
                return
            except (ValueError, BrokenPipeError, ConnectionResetError):
                return

        # Full content response
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()

        try:
            with open(file_path, "rb") as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class ReusableThreadingServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def get_lan_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def find_free_port(start_port, host="0.0.0.0", max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    return start_port


def main():
    global PORT, HOST
    target_port = PORT
    actual_port = find_free_port(target_port, HOST)

    server = ReusableThreadingServer((HOST, actual_port), ComposerHandler)

    lan_ip = get_lan_ip()
    print("=" * 64)
    print("  DAAG 3D Island Composer")
    print(f"  Bound to: {HOST}:{actual_port}")
    print(f"  Local:    http://localhost:{actual_port}/")
    if HOST in ("0.0.0.0", "::"):
        print(f"  Network:  http://{lan_ip}:{actual_port}/")
    print(f"  Serving:  {HERE}")
    print(f"  Panels:   {PANELS_DIR}")
    print("=" * 64)

    def shutdown(signum, frame):
        print("\nShutting down composer server...")
        threading.Thread(target=server.shutdown).start()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        server.serve_forever()
    finally:
        server.server_close()
        print("Server stopped.")


if __name__ == "__main__":
    main()
