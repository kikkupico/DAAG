"""Hand the reader's unanswered chat messages to the agent, one JSON line each.

    python3 tutor/watch.py

Run it under the Monitor tool. It prints every message of the live session that has no reply
yet, including ones sent while nobody was watching, then each new one as it arrives. While it
runs it touches bespoke/.watching, which is how the page knows a tutor is listening.
"""
import json
import time

from server import BESPOKE, HEART, ROOT, session

seen = set()
BESPOKE.mkdir(exist_ok=True)
while True:
    HEART.touch()
    folder = session()
    for path in sorted(folder.glob("*.json")) if folder else []:
        reply = path.with_suffix(".html")
        try:
            key = (path, path.stat().st_mtime_ns)
        except OSError:
            continue
        if key in seen or reply.exists():
            continue
        try:
            turn = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        seen.add(key)
        quote = turn.get("quote", "")
        print(json.dumps({
            "reply": reply.relative_to(ROOT).as_posix(),
            "message": path.relative_to(ROOT).as_posix(),
            "page": turn.get("page", ""),
            "section": turn.get("section", ""),
            "text": turn.get("text", ""),
            "selected": quote[:200] + ("…" if len(quote) > 200 else ""),
        }, ensure_ascii=False), flush=True)
    time.sleep(1)
