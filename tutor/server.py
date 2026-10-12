"""Serve the repo with a tutor's chat panel, and the reader's pinned notes, laid over each page.

    python3 tutor/server.py [port] [--resume]

Every .html page goes out with tutor/overlay.js added before </body>. The overlay is a chat
panel: the reader types a message, and any text selected on the page goes with it as context.
Everything it produces is kept under bespoke/, which is not in git:

    bespoke/chat/<session>/0001.json    a message from the reader, written by this server
    bespoke/chat/<session>/0001.html    the tutor's reply, an HTML fragment, written by the agent
    bespoke/<page>/<id>.md              a reply the reader pinned under the passage it is about;
                                        <page> is books/<slug>, places/<slug>, home, ...

A session is one run of this server: starting it opens an empty chat and stops any server left
from an earlier session (--resume keeps the chat, for restarting the server mid-session). The reader
can also write a note of their own on a passage; it is kept beside the pinned ones. The agent (see .claude/skills/tutor) reads messages through watch.py.
A pinned note is a header of "key: value" lines, a line of ---, then an HTML fragment.
The pages themselves are never written to.
"""
import html
import json
import os
import re
import secrets
import signal
import subprocess
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent.parent
BESPOKE = ROOT / "bespoke"
CHAT = BESPOKE / "chat"
CURRENT = CHAT / "current"  # names the live session's folder
HEART = BESPOKE / ".watching"  # touched by watch.py while an agent is listening
PID = BESPOKE / ".server.pid"
PORT = int(next((a for a in sys.argv[1:] if a.isdigit()), 8765))
HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
PAGE = re.compile(r"[a-z0-9-]+(/[a-z0-9-]+)*")
NOTE_ID = re.compile(r"\d{8}-\d{6}-[0-9a-f]{4}")
TURN_ID = re.compile(r"\d{4}")
HIDDEN = {"bespoke"}  # top-level folders the server will not hand out, with anything dotted
INJECT = '<link rel="stylesheet" href="/tutor/overlay.css"><script src="/tutor/overlay.js" data-page="%s" defer></script>\n'
writing = threading.Lock()


def page_key(file, root=ROOT):
    """books/<slug>/index.html -> books/<slug>; index.html -> home; explorer.html -> explorer."""
    rel = file.relative_to(root)
    key = rel.parent.as_posix() if rel.name == "index.html" else rel.with_suffix("").as_posix()
    key = "home" if key == "." else key
    return key if PAGE.fullmatch(key) else None


def one_line(value, limit):
    return " ".join(str(value or "").split())[:limit]


def as_html(text):
    text = text.strip()
    if text and not text.startswith("<"):
        text = "".join(f"<p>{p.strip()}</p>" for p in re.split(r"\n\s*\n", text))
    return text


def read_note(path):
    head, _, body = path.read_text(encoding="utf-8").partition("\n---")
    note = {}
    for line in head.splitlines():
        key, sep, value = line.partition(":")
        if sep:
            note[key.strip()] = value.strip()
    note["html"] = as_html(body)
    return note


def notes(key):
    out = []
    for path in sorted((BESPOKE / key).glob("*.md")):
        try:
            note = read_note(path)
        except (OSError, UnicodeDecodeError):
            continue  # half-written; the next poll picks it up
        if NOTE_ID.fullmatch(note.get("id", "")) and note["html"]:
            out.append(note)
    return out


def session():
    try:
        return CHAT / CURRENT.read_text().strip()
    except OSError:
        return None


def turns(folder):
    """The session's messages in order, each with the tutor's reply once it is written."""
    out = []
    for path in sorted(folder.glob("*.json")) if folder else []:
        try:
            turn = json.loads(path.read_text(encoding="utf-8"))
            reply = path.with_suffix(".html")
            turn["html"] = as_html(reply.read_text(encoding="utf-8")) if reply.exists() else ""
        except (OSError, ValueError):
            continue
        out.append(turn)
    return out


def listening():
    try:
        return time.time() - HEART.stat().st_mtime < 6
    except OSError:
        return False


def state(key):
    seen = ("id", "page", "url", "title", "text", "quote", "pinned", "html")
    chat = [{k: t.get(k, "") for k in seen} for t in turns(session())]
    return json.dumps({"listening": listening(), "turns": chat, "notes": notes(key)})


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def local(self):
        """Only this machine's browser, on this server's own address."""
        return self.headers.get("Host") in HOSTS

    def send_json(self, text, status=200):
        data = text.encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if not self.local():
            return self.send_error(403)
        url = urlsplit(self.path)
        top = url.path.strip("/").split("/")[0]
        if top.startswith(".") or top in HIDDEN:
            return self.send_error(404)
        if url.path == "/tutor/api/stream":
            key = parse_qs(url.query).get("page", [""])[0]
            return self.stream(key) if PAGE.fullmatch(key) else self.send_error(400)
        file = Path(self.translate_path(self.path))
        if file.is_dir() and url.path.endswith("/"):
            file = file / "index.html"
        if file.suffix == ".html" and file.is_file():
            return self.send_page(file)
        super().do_GET()

    def send_page(self, file):
        data = file.read_bytes()
        key = page_key(file)
        at = data.rfind(b"</body>")
        if key and at >= 0:
            data = data[:at] + (INJECT % key).encode() + data[at:]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def stream(self, key):
        """Server-sent events: the chat, the page's notes and whether an agent is listening, on every change."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        last, quiet = None, 0
        try:
            while True:
                now = state(key)
                if now != last:
                    self.wfile.write(f"data: {now}\n\n".encode())
                    last, quiet = now, 0
                elif quiet >= 30:  # a comment line, so a closed tab is noticed
                    self.wfile.write(b": still here\n\n")
                    quiet = 0
                self.wfile.flush()
                quiet += 1
                time.sleep(0.5)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_POST(self):
        # Another site open in the browser must not be able to put words in front of the agent:
        # only this server's own pages may post, and only as JSON (which a foreign form cannot send).
        origin = self.headers.get("Origin", "")
        if (not self.local() or origin.removeprefix("http://") not in HOSTS
                or not self.headers.get("Content-Type", "").startswith("application/json")):
            return self.send_error(403)
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get("Content-Length", 0)), 20000)))
            key = body["page"]
        except (ValueError, KeyError, TypeError):
            return self.send_error(400)
        if not isinstance(key, str) or not PAGE.fullmatch(key):
            return self.send_error(400)
        action = {"/tutor/api/say": self.say, "/tutor/api/pin": self.pin, "/tutor/api/drop": self.drop,
                  "/tutor/api/note": self.note}.get(self.path)
        if not action:
            return self.send_error(404)
        with writing:
            action(key, body)

    def say(self, key, body):
        text = one_line(body.get("text"), 1000)
        folder = session()
        if not text or not folder:
            return self.send_error(400)
        if not listening():
            return self.send_error(409)  # no agent to answer; the page says so
        section = one_line(body.get("section"), 80)
        url = one_line(body.get("url"), 200)
        turn = {
            "id": f"{max([int(p.stem) for p in folder.glob('*.json')], default=0) + 1:04d}",
            "page": key,
            "url": url if re.fullmatch(r"/[\w./-]*", url) else "/",
            "title": one_line(body.get("title"), 120),
            "section": section if re.fullmatch(r"[\w-]*", section) else "",
            "asked": time.strftime("%Y-%m-%d %H:%M"),
            "text": text,
            "quote": one_line(body.get("quote"), 1500),
            "prefix": one_line(body.get("prefix"), 60),
            "suffix": one_line(body.get("suffix"), 60),
            "block": one_line(body.get("block"), 1500),
        }
        (folder / f"{turn['id']}.json").write_text(json.dumps(turn, ensure_ascii=False, indent=1), encoding="utf-8")
        self.send_json(json.dumps({"id": turn["id"]}))

    def pin(self, key, body):
        """Keep a reply on the page it was about, as a note under the passage the reader had selected."""
        folder, turn_id = session(), body.get("turn", "")
        if not folder or not isinstance(turn_id, str) or not TURN_ID.fullmatch(turn_id):
            return self.send_error(400)
        path = folder / f"{turn_id}.json"
        try:
            turn = json.loads(path.read_text(encoding="utf-8"))
            reply = path.with_suffix(".html").read_text(encoding="utf-8").strip()
        except (OSError, ValueError):
            return self.send_error(404)
        if not turn.get("quote") or not reply or turn.get("pinned"):
            return self.send_error(400)
        note_id = time.strftime("%Y%m%d-%H%M%S-") + secrets.token_hex(2)
        head = {"id": note_id, "page": turn["page"], "section": turn["section"], "question": turn["text"],
                "kind": "aside", "asked": turn["asked"], "quote": turn["quote"],
                "prefix": turn["prefix"], "suffix": turn["suffix"]}
        note = BESPOKE / turn["page"] / f"{note_id}.md"
        note.parent.mkdir(parents=True, exist_ok=True)
        note.write_text("".join(f"{k}: {v}\n" for k, v in head.items()) + "---\n" + reply + "\n", encoding="utf-8")
        turn["pinned"] = note_id
        path.write_text(json.dumps(turn, ensure_ascii=False, indent=1), encoding="utf-8")
        self.send_json("{}")

    def note(self, key, body):
        """A note the reader wrote themselves about a passage; with an id, a rewrite of one."""
        quote, text = one_line(body.get("quote"), 1500), str(body.get("text") or "").strip()[:4000]
        note_id = body.get("id") or time.strftime("%Y%m%d-%H%M%S-") + secrets.token_hex(2)
        if len(quote) < 3 or not text or not isinstance(note_id, str) or not NOTE_ID.fullmatch(note_id):
            return self.send_error(400)
        section = one_line(body.get("section"), 80)
        head = {"id": note_id, "page": key, "section": section if re.fullmatch(r"[\w-]*", section) else "",
                "kind": "own", "asked": time.strftime("%Y-%m-%d %H:%M"), "quote": quote,
                "prefix": one_line(body.get("prefix"), 60), "suffix": one_line(body.get("suffix"), 60)}
        paragraphs = [html.escape(p.strip()).replace("\n", "<br>") for p in re.split(r"\n\s*\n", text) if p.strip()]
        path = BESPOKE / key / f"{note_id}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(f"{k}: {v}\n" for k, v in head.items()) + "---\n"
                        + "\n".join(f"<p>{p}</p>" for p in paragraphs) + "\n", encoding="utf-8")
        self.send_json(json.dumps({"id": note_id}))

    def drop(self, key, body):
        note_id = body.get("id", "")
        if not isinstance(note_id, str) or not NOTE_ID.fullmatch(note_id):
            return self.send_error(400)
        (BESPOKE / key / f"{note_id}.md").unlink(missing_ok=True)
        self.send_json("{}")


def retire_old_server():
    """One session at a time: a server left from an earlier session is stopped."""
    try:
        old = int(PID.read_text())
        command = subprocess.run(["ps", "-p", str(old), "-o", "command="], capture_output=True, text=True).stdout
        if "tutor/server.py" in command:
            os.kill(old, signal.SIGTERM)
            time.sleep(1)
    except (OSError, ValueError):
        pass


if __name__ == "__main__":
    CHAT.mkdir(parents=True, exist_ok=True)
    retire_old_server()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT)))
    server.daemon_threads = True
    PID.write_text(str(os.getpid()))
    if "--resume" not in sys.argv or not session():
        name = time.strftime("%Y%m%d-%H%M%S")
        (CHAT / name).mkdir()
        CURRENT.write_text(name)
    print(f"tutor: http://127.0.0.1:{PORT}/", flush=True)
    server.serve_forever()
