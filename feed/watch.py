"""Hand the feed's open requests to the agent, one JSON line each.

    python3 feed/watch.py [--loop]

Without --loop it prints the first request that has no batch yet and exits, for an agent that is woken
when a background task finishes. With --loop it keeps running, for a streaming monitor (Claude Code's
Monitor). It prints every request of the live session whose batch file does not exist yet, including
ones made while nobody was watching, then each new one as it is made. While it runs it touches
bespoke/feed/.watching, which is how the page knows a writer is listening.

The line is the request, cut to a sensible length: what decides the batch comes first (where to write
it, how many cards, the mix, the books, any retest), the long lists last and shortened. A monitor may cut
a line again on its way to the agent (Claude Code's does, at about 500 characters), so the file named in
"request" is the whole request, and is read each time.
"""
import json
import re
import sys
import time

from server import FEED, HEART, session_dir

FIRST = ("request", "batch", "n", "want", "first", "mix", "machine", "series", "books")
LAST = ("rejected", "pace", "avoid", "recent")
SHOWN = 6  # entries of "recent" kept in the line
AVOID = 40  # idea keys of "avoid" kept in the line


def cut(req):
    """The request as one line: what decides the batch first, the long lists last and shortened."""
    line = {k: req[k] for k in FIRST if k in req}
    # the question missed, its answer and why are in the file
    line["retest"] = [{k: r.get(k) for k in ("book", "idea", "anchor", "slot")} for r in req.get("retest", [])]
    line["rejected"] = [{"card": r.get("card"), "why": (r.get("why") or "")[:140], "in": r.get("in")} for r in req.get("rejected", [])]
    for k in LAST[1:]:
        if k in req:
            line[k] = req[k]
    line["recent"] = line.get("recent", [])[-SHOWN:]
    line["avoid"] = line.get("avoid", [])[:AVOID]
    return line


def main():
    seen = set()
    FEED.mkdir(parents=True, exist_ok=True)
    while True:
        HEART.touch()
        folder = session_dir()
        for path in sorted(folder.glob("need-*.json")) if folder else []:
            m = re.fullmatch(r"need-(\d{4})\.json", path.name)
            if not m or path in seen or (folder / f"batch-{m.group(1)}.json").exists():
                continue
            try:
                req = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue  # half written; the next look picks it up
            seen.add(path)
            print(json.dumps(cut(req), ensure_ascii=False, separators=(",", ":")), flush=True)
            if "--loop" not in sys.argv:
                sys.exit(0)
        time.sleep(1)


if __name__ == "__main__":
    main()
