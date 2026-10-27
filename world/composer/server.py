#!/usr/bin/env python3
"""Composer backend server for the DAAG 3D Island & Shot Composition App.

    python3 world/composer/server.py [port] [--host ADDRESS]

Serves the Three.js 3D composer interface, island models, prop models,
cast reference pictures, and provides REST API endpoints to load, compose,
and save book shots with prompt and character exports for image AI generators.
"""

import base64
import html
import io
import json
import mimetypes
import os
import re
import shutil
import signal
import socket
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
ISLAND_V2_DIR = REPO / "archive" / "island-v2"
ART_DIR = REPO / "archive" / "art"
KIT_MODELS_DIR = REPO / "archive" / "art" / "archive" / "iso-ref-pipeline" / "kit" / "models"
POLYHAVEN_DIR = WORLD / "assets" / "polyhaven" / "models"
CAST_DIR = WORLD / "cast"
CAST_IMG_DIR = WORLD / "cast" / "out" / "nb2"
PANELS_DIR = WORLD / "panels"
CAPTURES_DIR = HERE / "captures"

CAPTURES_DIR.mkdir(parents=True, exist_ok=True)

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


def get_props_catalog():
    """Return categorized list of available 3D prop models."""
    props = [
        # Flora & Trees
        {"id": "cypress", "name": "Mediterranean Cypress", "category": "Flora", "type": "kit", "url": "/props/kit/cypress.glb", "scale": 1.0, "icon": "🌲"},
        {"id": "olive", "name": "Olive Tree", "category": "Flora", "type": "kit", "url": "/props/kit/olive.glb", "scale": 1.0, "icon": "🫒"},
        {"id": "pine", "name": "Aegean Pine", "category": "Flora", "type": "kit", "url": "/props/kit/pine.glb", "scale": 1.0, "icon": "🌲"},
        {"id": "oak", "name": "Gnarled Oak", "category": "Flora", "type": "kit", "url": "/props/kit/oak.glb", "scale": 1.0, "icon": "🌳"},
        {"id": "maquis", "name": "Maquis Shrub Patch", "category": "Flora", "type": "kit", "url": "/props/kit/maquis.glb", "scale": 1.0, "icon": "🌿"},
        {"id": "vine_row", "name": "Terraced Vine Row", "category": "Flora", "type": "kit", "url": "/props/kit/vine_row.glb", "scale": 1.0, "icon": "🍇"},
        {"id": "shrub_01", "name": "Aegean Coastal Shrub", "category": "Flora", "type": "polyhaven", "url": "/props/polyhaven/shrub_01/shrub_01_2k.gltf", "scale": 1.5, "icon": "🌿"},
        {"id": "shrub_02", "name": "Wild Rooibos Shrub", "category": "Flora", "type": "polyhaven", "url": "/props/polyhaven/wild_rooibos_bush/wild_rooibos_bush_2k.gltf", "scale": 1.5, "icon": "🌱"},

        # Vessels & Transport
        {"id": "cart", "name": "Wooden Oxcart", "category": "Transport", "type": "kit", "url": "/props/kit/cart.glb", "scale": 1.0, "icon": "🛒"},
        {"id": "skiff", "name": "Harbour Skiff / Rowboat", "category": "Transport", "type": "kit", "url": "/props/kit/skiff.glb", "scale": 1.0, "icon": "🚣"},
        {"id": "merchantman", "name": "Aegean Merchant Ship", "category": "Transport", "type": "kit", "url": "/props/kit/merchantman.glb", "scale": 1.0, "icon": "⛵"},

        # Architecture & Shelter
        {"id": "camp_tent", "name": "Mercenary Tent", "category": "Architecture", "type": "kit", "url": "/props/kit/camp_tent.glb", "scale": 1.0, "icon": "⛺"},
        {"id": "stall", "name": "Market Stall (Agora)", "category": "Architecture", "type": "kit", "url": "/props/kit/stall.glb", "scale": 1.0, "icon": "🎪"},
        {"id": "granary", "name": "Stone Granary", "category": "Architecture", "type": "kit", "url": "/props/kit/granary.glb", "scale": 1.0, "icon": "🏛️"},
        {"id": "depot", "name": "Quayside Depot", "category": "Architecture", "type": "kit", "url": "/props/kit/depot.glb", "scale": 1.0, "icon": "🏠"},
        {"id": "warehouse", "name": "Harbour Warehouse", "category": "Architecture", "type": "kit", "url": "/props/kit/warehouse.glb", "scale": 1.0, "icon": "🏬"},
        {"id": "customs_house", "name": "Customs House", "category": "Architecture", "type": "kit", "url": "/props/kit/customs_house.glb", "scale": 1.0, "icon": "🏛️"},
        {"id": "cottage_8x6", "name": "Stone Cottage", "category": "Architecture", "type": "kit", "url": "/props/kit/cottage_8x6.glb", "scale": 1.0, "icon": "🏡"},
        {"id": "courtyard_house", "name": "Hellenistic Courtyard House", "category": "Architecture", "type": "kit", "url": "/props/kit/courtyard_house_12x12.glb", "scale": 1.0, "icon": "🏛️"},

        # Statues & Figures
        {"id": "horse_statue", "name": "Equestrian Bronze Statue", "category": "Statues", "type": "polyhaven", "url": "/props/polyhaven/horse_statue_01/horse_statue_01_2k.gltf", "scale": 1.0, "icon": "🐎"},
        {"id": "marble_bust", "name": "Philosopher Marble Bust", "category": "Statues", "type": "polyhaven", "url": "/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf", "scale": 1.2, "icon": "🗿"},
        {"id": "warrior_figure", "name": "Hellenistic Guard Standee", "category": "Statues", "type": "kit", "url": "/props/warrior.glb", "scale": 1.0, "icon": "🛡️"},

        # Daily Life & Goods
        {"id": "wicker_basket_01", "name": "Wicker Grain Basket", "category": "Everyday", "type": "polyhaven", "url": "/props/polyhaven/wicker_basket_01/wicker_basket_01_2k.gltf", "scale": 1.2, "icon": "🧺"},
        {"id": "wooden_bucket", "name": "Well Water Bucket", "category": "Everyday", "type": "polyhaven", "url": "/props/polyhaven/wooden_bucket_01/wooden_bucket_01_2k.gltf", "scale": 1.2, "icon": "🪣"},
        {"id": "cellar", "name": "Amphora Cellar Hatch", "category": "Everyday", "type": "kit", "url": "/props/kit/cellar.glb", "scale": 1.0, "icon": "🏺"},

        # Rocks & Geology
        {"id": "boulder_01", "name": "Limestone Cliff Boulder", "category": "Geology", "type": "polyhaven", "url": "/props/polyhaven/boulder_01/boulder_01_2k.gltf", "scale": 1.5, "icon": "🪨"},
        {"id": "stone_01", "name": "Aegean Flat Stone", "category": "Geology", "type": "polyhaven", "url": "/props/polyhaven/stone_01/stone_01_2k.gltf", "scale": 1.5, "icon": "🪨"},
        {"id": "rock_07", "name": "Craggy Coast Rock", "category": "Geology", "type": "polyhaven", "url": "/props/polyhaven/rock_07/rock_07_2k.gltf", "scale": 1.8, "icon": "🪨"}
    ]
    return props


def get_available_books():
    """List all book directories under world/panels with a shots.json file."""
    books = []
    if not PANELS_DIR.exists():
        return books

    for item in sorted(PANELS_DIR.iterdir()):
        if item.is_dir() and not item.name.startswith((".", "_")):
            shots_file = item / "shots.json"
            if shots_file.exists():
                try:
                    data = json.loads(shots_file.read_text(encoding="utf-8"))
                    shots_list = list(data.keys())
                    books.append({
                        "id": item.name,
                        "title": item.name.replace("-", " ").title(),
                        "shots_count": len(shots_list),
                        "shots": shots_list
                    })
                except Exception as e:
                    books.append({
                        "id": item.name,
                        "title": item.name.replace("-", " ").title(),
                        "shots_count": 0,
                        "shots": [],
                        "error": str(e)
                    })
    return books


class ComposerHandler(SimpleHTTPRequestHandler):
    """HTTP handler with range-request file streaming and Composer REST APIs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def log_message(self, format, *args):
        # Concise request logging
        sys.stderr.write(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}\n")

    def end_headers(self):
        # Enable CORS and Range acceptance
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_HEAD(self):
        url = urlsplit(self.path)
        path = unquote(url.path)
        if path == "/models/island-v2.glb":
            self.head_file(ISLAND_V2_DIR / "island-v2.glb", "model/gltf-binary")
            return
        local_file = (HERE / path.lstrip("/")).resolve()
        if local_file.exists() and local_file.is_file():
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
                "version": "1.0.0",
                "repo": str(REPO),
                "books_count": len(get_available_books()),
                "cast_count": len(get_cast_data().get("characters", [])),
                "props_count": len(get_props_catalog())
            })
            return

        if path == "/api/books":
            self.send_json({"books": get_available_books()})
            return

        if path.startswith("/api/books/") and path.endswith("/shots"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "books" and parts[3] == "shots":
                book_id = parts[2]
                shots_file = PANELS_DIR / book_id / "shots.json"
                if shots_file.exists():
                    try:
                        data = json.loads(shots_file.read_text(encoding="utf-8"))
                        self.send_json({"book": book_id, "shots": data})
                    except Exception as e:
                        self.send_json({"error": f"Failed to parse shots.json: {e}"}, status=500)
                else:
                    self.send_json({"book": book_id, "shots": {}})
                return

        if path == "/api/cast":
            self.send_json(get_cast_data())
            return

        if path == "/api/props":
            self.send_json({"props": get_props_catalog()})
            return

        if path.startswith("/api/bundle"):
            self.handle_export_bundle(url.query)
            return

        # Static asset routing
        # 1. Models
        if path == "/models/island-v2.glb":
            self.stream_file(ISLAND_V2_DIR / "island-v2.glb", "model/gltf-binary")
            return
        if path == "/models/arche-3d.glb":
            self.stream_file(ART_DIR / "arche-3d.glb", "model/gltf-binary")
            return
        if path == "/models/paxos-3d.glb":
            self.stream_file(ART_DIR / "paxos-3d.glb", "model/gltf-binary")
            return
        if path == "/models/layout.json":
            self.stream_file(ISLAND_V2_DIR / "layout.json", "application/json")
            return

        # 2. Props
        if path.startswith("/props/kit/"):
            filename = path[len("/props/kit/"):]
            file_path = KIT_MODELS_DIR / filename
            if file_path.exists():
                self.stream_file(file_path, "model/gltf-binary")
                return
            self.send_error(HTTPStatus.NOT_FOUND, f"Kit prop not found: {filename}")
            return

        if path == "/props/warrior.glb":
            warrior_path = REPO / "archive" / "art" / "archive" / "cast" / "warrior.glb"
            if warrior_path.exists():
                self.stream_file(warrior_path, "model/gltf-binary")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "Warrior model not found")
            return

        if path.startswith("/props/polyhaven/"):
            rel_path = path[len("/props/polyhaven/"):]
            file_path = (POLYHAVEN_DIR / rel_path).resolve()
            if file_path.exists() and str(file_path).startswith(str(POLYHAVEN_DIR)):
                mime = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
                self.stream_file(file_path, mime)
                return
            self.send_error(HTTPStatus.NOT_FOUND, f"Polyhaven asset not found: {rel_path}")
            return

        # 3. Cast Images
        if path.startswith("/cast/images/"):
            filename = path[len("/cast/images/"):]
            file_path = CAST_IMG_DIR / filename
            if file_path.exists():
                self.stream_file(file_path, "image/png")
                return
            self.send_error(HTTPStatus.NOT_FOUND, f"Cast image not found: {filename}")
            return

        # 4. Captured shots
        if path.startswith("/captures/"):
            filename = path[len("/captures/"):]
            file_path = CAPTURES_DIR / filename
            if file_path.exists():
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
        local_file = (HERE / path.lstrip("/")).resolve()
        if local_file.exists() and str(local_file).startswith(str(HERE)) and local_file.is_file():
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
                book_id = parts[2]
                body = self.read_json_body()
                if body is None:
                    return
                self.handle_save_shot(book_id, body)
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
            data = self.rfile.read(length)
            return json.loads(data.decode("utf-8"))
        except Exception as e:
            self.send_json({"error": f"Invalid JSON payload: {e}"}, status=400)
            return None

    def handle_save_shot(self, book_id, body):
        """Save or update a shot entry in panels/<book>/shots.json."""
        shot_id = body.get("shot_id")
        shot_data = body.get("shot")

        if not shot_id or not shot_data:
            self.send_json({"error": "Both 'shot_id' and 'shot' fields are required"}, status=400)
            return

        book_dir = PANELS_DIR / book_id
        if not book_dir.exists():
            # If book folder doesn't exist, create it
            book_dir.mkdir(parents=True, exist_ok=True)

        shots_file = book_dir / "shots.json"

        with shots_lock:
            existing_shots = {}
            if shots_file.exists():
                try:
                    existing_shots = json.loads(shots_file.read_text(encoding="utf-8"))
                    # Create timestamped backup
                    backup_file = shots_file.with_suffix(".json.bak")
                    shutil.copy2(shots_file, backup_file)
                except Exception as e:
                    self.send_json({"error": f"Failed to read existing shots.json: {e}"}, status=500)
                    return

            # Update or insert shot
            existing_shots[shot_id] = shot_data

            try:
                # Pretty print json with 1-space indentation matching DAAG canon
                formatted_json = json.dumps(existing_shots, indent=1, ensure_ascii=False)
                shots_file.write_text(formatted_json + "\n", encoding="utf-8")
                self.send_json({
                    "status": "success",
                    "book": book_id,
                    "shot_id": shot_id,
                    "shots_count": len(existing_shots),
                    "file": str(shots_file.relative_to(REPO))
                })
            except Exception as e:
                self.send_json({"error": f"Failed to write shots.json: {e}"}, status=500)

    def handle_save_capture(self, body):
        """Save base64 image data to captures/ or panels/<book>/<shot>/."""
        image_data = body.get("image_data")
        book_id = body.get("book_id")
        shot_id = body.get("shot_id", "unnamed")
        metadata = body.get("metadata", {})

        if not image_data:
            self.send_json({"error": "Missing image_data"}, status=400)
            return

        # Strip base64 header if present
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        try:
            img_bytes = base64.b64decode(image_data)
        except Exception as e:
            self.send_json({"error": f"Base64 decoding failed: {e}"}, status=400)
            return

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        clean_shot = re.sub(r"[^a-zA-Z0-9_-]", "_", shot_id)

        filename = f"{clean_shot}_{timestamp}.png"
        filepath = CAPTURES_DIR / filename
        filepath.write_bytes(img_bytes)

        # Also write metadata sidecar
        meta_filepath = CAPTURES_DIR / f"{clean_shot}_{timestamp}.json"
        meta_filepath.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        # If book_id and shot_id given, also offer to write previs directly to book folder
        book_dest = None
        if book_id and shot_id:
            shot_folder = PANELS_DIR / book_id / clean_shot
            shot_folder.mkdir(parents=True, exist_ok=True)
            previs_path = shot_folder / f"previs-{timestamp[:8]}.png"
            previs_path.write_bytes(img_bytes)
            book_dest = str(previs_path.relative_to(REPO))

        self.send_json({
            "status": "success",
            "filename": filename,
            "url": f"/captures/{filename}",
            "size_bytes": len(img_bytes),
            "book_dest": book_dest
        })

    def handle_export_bundle(self, query_string):
        """Export a zip file containing previs image, prompt, and character references."""
        params = parse_qs(query_string)
        shot_id = params.get("shot", ["shot"])[0]
        capture_name = params.get("capture", [""])[0]
        cast_ids = params.get("cast", [])
        prompt_text = params.get("prompt", [""])[0]

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Prompt file
            zf.writestr("prompt.txt", prompt_text)

            # 2. Previs / capture image (Image 1)
            if capture_name:
                cap_file = CAPTURES_DIR / capture_name
                if cap_file.exists():
                    zf.write(cap_file, arcname="01_image_previs.png")

            # 3. Cast reference images (Image 2..N)
            idx = 2
            for cid in cast_ids:
                cfile = CAST_IMG_DIR / f"{cid}.png"
                if cfile.exists():
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
