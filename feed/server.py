"""Serve the feed: a phone-style page of cards that the agent of the session writes live.

    python3 feed/server.py [port] [--host ADDRESS]

The server binds to every interface (0.0.0.0) and accepts any Host header on its port, so a phone
over a private network can use it; it has no other protection. --host 127.0.0.1 keeps it to this machine.

It serves the repository read-only (never bespoke/ or sources/, nor anything dotted) and the page in
feed/app/, and it owns every piece of tracking, so that a writer who remembers nothing can answer any
request from the request and the index alone:

    bespoke/feed/index.json, menu.json   built by feed/index.py
    bespoke/feed/reader.json             the reader's history, across sessions
    bespoke/feed/<session>/need-0007.json    a request for a batch of cards, written here when the buffer runs low
    bespoke/feed/<session>/batch-0007.json   the batch, a JSON array of cards, written by the agent
    bespoke/feed/<session>/cards.jsonl       the cards that passed the checks, with their ids
    bespoke/feed/<session>/rejects.jsonl     the cards that did not, with the reasons
    bespoke/feed/<session>/events.jsonl      what the page reported
    bespoke/feed/<session>/batches.jsonl     how long each batch took

A session is one run of this server: it opens a new folder and stops a server left from an earlier one.
Card text and event text are data; nothing here runs any of it.
"""
import json
import math
import os
import posixpath
import random
import re
import signal
import statistics
import subprocess
import sys
import threading
import time
from collections import Counter
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

import cards as checks

ROOT = Path(__file__).resolve().parent.parent
FEED = ROOT / "bespoke" / "feed"
CURRENT = FEED / "current"  # names the live session's folder
HEART = FEED / ".watching"  # touched by watch.py while an agent is listening
PID = FEED / ".server.pid"
READER = FEED / "reader.json"
INDEX = FEED / "index.json"
RULES = ".agents/skills/feed/SKILL.md"  # a writer who has lost the rules reads them here
PORT = int(next((a for a in sys.argv[1:] if a.isdigit()), 8766))
HOST = sys.argv[sys.argv.index("--host") + 1] if "--host" in sys.argv[1:-1] else "0.0.0.0"
HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
OPEN = HOST not in ("127.0.0.1", "localhost")  # bound beyond loopback: any address the network reaches us by
HIDDEN = {"bespoke", "sources"}  # top-level folders the server will not hand out, with anything dotted

# How the buffer is kept full. Until a batch and the reader's pace are measured, these stand in for them.
# They come from the smoke test: batches of 8, 10 and 10 cards took 142, 148 and 176 s from request to
# acceptance (median 148 s, so 150), and a reader takes about 15 s a card (4 a minute). In 150 s such a
# reader finishes 10 cards, so a request goes out while 16 are unread, for 10 cards; the first batch is 8.
FIRST_WANT = 8
DEFAULT_BATCH_SECONDS = 150
DEFAULT_CPM = 4
MIN_WANT, MAX_WANT = 4, 10
MIN_ASK, MAX_ASK = 3, 20
MARGIN = 1.5  # ask while the unread cards cover this many times a batch's writing time
BASE_MIX = {"fact": 2, "picture": 1, "figure": 1, "quiz": 2}  # per six cards
MACHINE_SHARE = 1 / 5  # raised to 2/6 when machine cards do better, lowered to 1/12 when they are skipped
RETEST_MIN, RETEST_MAX = 3, 8  # a missed quiz comes back this many cards later
BAD_JSON_GRACE = 10  # seconds a batch file may stay unparseable (a half-written file) before it is rejected
SKIP_MS = 1500  # a card left sooner than this with no interaction counts as skipped
KEEP_CARDS = 400  # per-card records kept in reader.json

state_lock = threading.RLock()
KEY = re.compile(r"c\d{4,}")


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def stamp(t=None):
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t or time.time()))


def write_atomic(path, text):
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def append_line(path, obj):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def listening():
    try:
        return time.time() - HEART.stat().st_mtime < 6
    except OSError:
        return False


def session_dir():
    try:
        return FEED / CURRENT.read_text().strip()
    except OSError:
        return None


def blank_reader():
    return {"version": 1, "next": 1, "streak": 0, "best": 0, "days": {}, "books": {}, "ideas": {}, "retest": [],
            "muted": [], "saved": [], "savedCards": {}, "cards": {}, "sessions": 0}


def scale_mix(want):
    """The recipe's mix, scaled to want cards by largest remainder."""
    raw = {k: v * want / 6 for k, v in BASE_MIX.items()}
    out = {k: int(v) for k, v in raw.items()}
    order = list(BASE_MIX)
    for k in sorted(raw, key=lambda k: (-(raw[k] - out[k]), order.index(k)))[:want - sum(out.values())]:
        out[k] += 1
    return out


class Feed:
    """Everything the server knows: the index, the reader, the session's cards and the open request."""

    def __init__(self):
        self.index = json.loads(INDEX.read_text(encoding="utf-8"))
        self.images = {im["src"]: im["alt"] for b in self.index["books"].values() for im in b["images"]}
        self.images.update({im["src"]: im["alt"] for im in self.index["places"]})
        self.slugs = list(self.index["books"])
        try:
            self.reader = {**blank_reader(), **json.loads(READER.read_text(encoding="utf-8"))}
        except (OSError, ValueError):
            self.reader = blank_reader()
        self.reader_dirty = False
        self.saved_at = 0.0
        self.dir = None
        self.name = ""
        self.cards, self.by_id, self.mine = [], {}, {}
        self.seen_ts, self.frontier = [], 0
        self.req, self.n = None, 0
        self.batch_times, self.pending_rejects = [], []
        self.series_owed, self.machine_credit = False, 0.0

    # ------------------------------------------------------------ session

    def start(self):
        FEED.mkdir(parents=True, exist_ok=True)
        self.name = time.strftime("%Y%m%d-%H%M%S")
        self.dir = FEED / self.name
        self.dir.mkdir()
        write_atomic(CURRENT, self.name)
        for r in self.reader["retest"]:
            r["at"], r["tries"] = -RETEST_MIN, 0
        self.reader["sessions"] += 1
        self.reader_dirty = True
        with state_lock:
            self.make_request()

    def log_error(self, where):
        import traceback
        try:
            with open(self.dir / "errors.log", "a", encoding="utf-8") as f:
                f.write(f"{stamp()} {where}\n{traceback.format_exc()}\n")
        except OSError:
            pass

    # ------------------------------------------------------------ what the reader has done

    def rec(self, cid):
        return self.reader["cards"].get(cid)

    def finished(self):
        """Cards the reader has been through and left (seen, with a later card seen after)."""
        return [c for c in self.cards if c["seq"] < self.frontier and self.rec(c["id"]) is not None]

    def unread(self):
        return max(0, len(self.cards) - self.frontier)

    def pace(self, now=None):
        """Cards a minute over the last three minutes, or None when the reader has not been going long enough."""
        now = now or time.time()
        ts = [t for t in self.seen_ts if now - t <= 180]
        if len(ts) < 3:
            return None
        return round(len(ts) / clamp(now - ts[0], 30.0, 180.0) * 60, 1)

    def batch_time(self):
        return statistics.median(self.batch_times[-3:]) if self.batch_times else None

    def sizing(self):
        """(ask when this many cards are unread, want this many cards), from the measured batch time and pace;
        what is not yet measured is taken at its default."""
        bt, cpm = self.batch_time() or DEFAULT_BATCH_SECONDS, self.pace() or DEFAULT_CPM
        need = cpm * bt / 60  # cards the reader finishes while one batch is written
        return clamp(math.ceil(need * MARGIN) + 1, MIN_ASK, MAX_ASK), clamp(math.ceil(need) + 2, MIN_WANT, MAX_WANT)

    def skipped(self, r):
        """A card left within 1.5 s with no interaction; a quiz scrolled past unanswered."""
        if r["kind"] == "quiz":
            return r["choice"] is None
        return r["dwell"] < SKIP_MS and not (r["liked"] or r["saved"] or r["less"] or r["more"] or r["opened"])

    # ------------------------------------------------------------ requests

    def suggest_books(self, want, first):
        rd = self.reader["books"]
        shown = lambda s: rd.get(s, {}).get("shown", 0)
        if first:  # a tour: one book from each setting, the least shown there
            out = []
            for setting in self.index["settings"]:
                pool = [s for s in self.slugs if self.index["books"][s]["setting"] == setting]
                out.append(min(pool, key=lambda s: (shown(s), random.random())))
            return out
        k = 3 if want <= 5 else 4 if want <= 7 else 5
        recent = Counter(c["book"] for c in self.cards[-30:])
        last = {c["book"]: c["seq"] for c in self.cards}
        order = sorted(self.slugs, key=lambda s: (recent[s], shown(s), last.get(s, 0), random.random()))
        liked = Counter()
        for c in self.finished()[-60:]:
            r = self.rec(c["id"])
            liked[c["book"]] += 2 * r["liked"] + 2 * r["saved"] + (r["dwell"] >= 6000) - 3 * r["less"]
        picks = order[:k - 1]
        best = [s for s in sorted(self.slugs, key=lambda s: -liked[s]) if liked[s] > 0 and s not in picks]
        picks.append(best[0] if best else next(s for s in order if s not in picks))
        return picks

    def machine_count(self, want, first):
        if first:
            return 1
        fin = self.finished()[-40:]
        share = MACHINE_SHARE
        m = [self.rec(c["id"]) for c in fin if c["register"] == "machine"]
        s = [self.rec(c["id"]) for c in fin if c["register"] == "story"]
        if len(m) >= 3 and len(s) >= 3:
            mean = lambda xs, f: sum(f(x) for x in xs) / len(xs)
            dwell, liked = (lambda x: x["dwell"]), (lambda x: 1 if x["liked"] else 0)
            skip = lambda x: 1 if self.skipped(x) else 0
            if mean(m, dwell) > 1.25 * mean(s, dwell) or mean(m, liked) > mean(s, liked) + 0.1:
                share = 2 / 6
            elif mean(m, skip) >= 0.5 and mean(m, skip) > mean(s, skip) + 0.2:
                share = 1 / 12
        self.machine_credit += want * share
        n = min(int(self.machine_credit), want)
        self.machine_credit -= n
        return n

    def retest_for(self, want):
        n = len(self.cards)
        for r in self.reader["retest"]:
            if n + want >= r["at"] + RETEST_MIN:
                lo = max(1, r["at"] + RETEST_MIN - n)
                hi = clamp(r["at"] + RETEST_MAX - n, lo, want)
                return [{"book": r["book"], "idea": r["idea"], "anchor": r["anchor"], "missed": r["missed"],
                         "answer": r["answer"], "why": r["why"], "slot": [lo, hi]}]
        return []

    def avoid_keys(self):
        keys = []
        for c in reversed(self.cards[-40:]):
            if c["idea"] not in keys:
                keys.append(c["idea"])
        for k, v in self.reader["ideas"].items():
            if v["shown"] >= 3 and k not in keys:
                keys.append(k)
        for k in self.reader["muted"]:
            if k not in keys:
                keys.append(k)
        return keys

    def recent(self, k=8):
        out = []
        for c in self.finished()[-k:]:
            r = self.rec(c["id"])
            e = {"id": c["id"], "book": c["book"], "kind": c["kind"], "register": c["register"], "idea": c["idea"],
                 "hook": c["hook"][:60], "dwell": round(r["dwell"] / 1000, 1), "liked": r["liked"],
                 "skipped": self.skipped(r), "right": r["right"]}
            for f, name in (("saved", "saved"), ("less", "less"), ("more", "more"), ("opened", "opened")):
                if r[f]:
                    e[name] = True
            out.append(e)
        return out

    def make_request(self):
        """Write need-NNNN.json for the next batch. Caller holds state_lock."""
        self.n += 1
        n = self.n
        first = not self.cards
        _, want = self.sizing()
        if first:
            want = FIRST_WANT
        series = "new" if (self.series_owed or (n - 1) % 4 == 0) else None
        req = {
            "request": (self.dir / f"need-{n:04d}.json").relative_to(ROOT).as_posix(),
            "batch": (self.dir / f"batch-{n:04d}.json").relative_to(ROOT).as_posix(),
            "n": n, "want": want, "mix": scale_mix(want), "machine": self.machine_count(want, first),
            "books": self.suggest_books(want, first), "retest": [] if first else self.retest_for(want),
            "avoid": self.avoid_keys(), "series": series, "recent": self.recent(),
            "rejected": self.pending_rejects, "pace": {"cardsPerMinute": self.pace(), "unread": self.unread()},
            "first": first, "index": INDEX.relative_to(ROOT).as_posix(),
            "menu": (FEED / "menu.json").relative_to(ROOT).as_posix(), "rules": RULES, "asked": stamp(),
        }
        self.pending_rejects = []
        write_atomic(self.dir / f"need-{n:04d}.json", json.dumps(req, ensure_ascii=False, indent=1) + "\n")
        self.req = {"n": n, "t0": time.time(), "batch": self.dir / f"batch-{n:04d}.json", "want": want, "first": first,
                    "series": series, "avoid": set(req["avoid"]), "retest": req["retest"], "bad_since": None}

    # ------------------------------------------------------------ batches

    def reject(self, n, i, raw, reasons):
        why = reasons[0]
        text = "; ".join(dict.fromkeys(r[0] for r in reasons))[:300]
        hook = raw.get("hook") if isinstance(raw, dict) and isinstance(raw.get("hook"), str) else ""
        label = f"batch-{n:04d} #{i + 1}" if i >= 0 else f"batch-{n:04d}"
        item = {"card": label, "hook": hook[:60], "why": text, "in": why[1], "quote": why[2][:100]}
        append_line(self.dir / "rejects.jsonl", {**item, "at": stamp()})
        self.pending_rejects = (self.pending_rejects + [item])[-10:]

    def take_batch(self, raw):
        """Check a batch; accept the cards that pass. Caller holds state_lock. Returns (accepted, rejected)."""
        req = self.req
        n = req["n"]
        if isinstance(raw, dict) and isinstance(raw.get("cards"), list):
            raw = raw["cards"]
        if not isinstance(raw, list):
            self.reject(n, -1, None, [("the batch file must be a JSON array of cards", "batch", "")])
            return 0, 1
        results = []
        retest_ideas = {r["idea"] for r in req["retest"]}
        hooks = {re.sub(r"\W+", " ", c["hook"].lower()).strip(): c["id"] for c in self.cards[-200:]}
        for i, item in enumerate(raw[:checks.MAX_BATCH]):
            card, bad = checks.check_card(item, self.index, self.images)
            if card and card["idea"] in req["avoid"] and card["idea"] not in retest_ideas:
                card, bad = None, [(f"idea '{card['idea']}' is in avoid; choose a different idea", "idea", card["idea"])]
            if card:
                key = re.sub(r"\W+", " ", card["hook"].lower()).strip()
                if key in hooks:
                    card, bad = None, [(f"repeats the hook of {hooks[key]}", "hook", item.get("hook", "")[:60])]
                else:
                    hooks[key] = "an earlier card in this batch"
            results.append((card, bad))
        for _ in raw[checks.MAX_BATCH:]:
            results.append((None, [(f"over the limit of {checks.MAX_BATCH} cards in a batch", "batch", "")]))
        problems = checks.check_pairs([(c, i) for i, (c, _) in enumerate(results)])
        accepted = rejected = 0
        for i, (card, bad) in enumerate(results):
            if card and i in problems:
                card, bad = None, [(problems[i], "series", "")]
            if not card:
                self.reject(n, i, raw[i] if i < len(raw) else None, bad)
                rejected += 1
                continue
            cid = f"c{self.reader['next']:04d}"
            self.reader["next"] += 1
            card = {"id": cid, "seq": len(self.cards) + 1, "batch": n, **card}
            self.cards.append(card)
            self.by_id[cid] = card
            append_line(self.dir / "cards.jsonl", {**card, "at": stamp()})
            accepted += 1
        # a retest asked for and served is done; one asked for twice and not served is dropped
        got = [c for c in self.cards if c["batch"] == n]
        for r in req["retest"]:
            mine = next((q for q in self.reader["retest"] if q["idea"] == r["idea"]), None)
            if mine and any(c["idea"] == r["idea"] or (c["book"] == r["book"] and c["anchor"] == r["anchor"]) for c in got):
                self.reader["retest"].remove(mine)
            elif mine:
                mine["tries"] += 1
                if mine["tries"] >= 2:
                    self.reader["retest"].remove(mine)
        if req["series"] == "new":
            self.series_owed = not any(c.get("series") for c in got)
        self.reader_dirty = True
        return accepted, rejected

    def poll(self):
        """Pick up the open request's batch if it has landed, and make the next request when the buffer is low."""
        with state_lock:
            req = self.req
            if req:
                path = req["batch"]
                if path.exists():
                    try:
                        raw = json.loads(path.read_text(encoding="utf-8"))
                    except (ValueError, UnicodeDecodeError, OSError) as e:
                        now = time.time()
                        req["bad_since"] = req["bad_since"] or now
                        if now - req["bad_since"] < BAD_JSON_GRACE:
                            return  # perhaps half written; look again
                        raw, err = None, str(e)[:120]
                    else:
                        err = None
                    if raw is None:
                        self.reject(req["n"], -1, None, [(f"the batch file is not valid JSON ({err})", "batch", "")])
                        accepted, rejected = 0, 1
                    else:
                        accepted, rejected = self.take_batch(raw)
                    seconds = round(time.time() - req["t0"], 1)
                    append_line(self.dir / "batches.jsonl", {"n": req["n"], "asked": stamp(req["t0"]), "landed": stamp(),
                                                             "seconds": seconds, "want": req["want"], "accepted": accepted,
                                                             "rejected": rejected})
                    if accepted:
                        self.batch_times.append(seconds)
                    self.req = None
            if not self.req and self.unread() <= self.sizing()[0]:
                self.make_request()

    # ------------------------------------------------------------ events

    def card_record(self, cid):
        card = self.by_id.get(cid)
        if not card:
            return None, None
        r = self.reader["cards"].get(cid)
        if r is None:
            r = {"book": card["book"], "idea": card["idea"], "kind": card["kind"], "register": card["register"],
                 "seq": card["seq"], "dwell": 0, "liked": False, "saved": False, "less": False, "more": False,
                 "opened": False, "choice": None, "right": None, "seen": False}
            self.reader["cards"][cid] = r
        return card, r

    def book_stats(self, slug):
        return self.reader["books"].setdefault(slug, {"shown": 0, "liked": 0, "dwell": 0, "right": 0, "wrong": 0, "less": 0})

    def idea_stats(self, idea):
        return self.reader["ideas"].setdefault(idea, {"shown": 0, "last": "", "right": 0, "wrong": 0})

    def event(self, ev):
        """Fold one whitelisted event into the reader's record. Returns a small reply. Caller holds state_lock."""
        kind, cid = ev["type"], ev["card"]
        card = self.by_id.get(cid)
        if not card:
            # a card from an earlier session can still be saved or unsaved from the drawer
            old = self.reader["savedCards"].get(cid)
            if old and kind in ("save", "open"):
                if kind == "save" and not ev.get("on", True):
                    self.reader["saved"] = [x for x in self.reader["saved"] if x != cid]
                    self.reader["savedCards"].pop(cid, None)
                    self.reader_dirty = True
            return {"ok": True}
        _, r = self.card_record(cid)
        b, idea = self.book_stats(card["book"]), self.idea_stats(card["idea"])
        reply = {"ok": True}
        if kind == "seen":
            if not r["seen"]:
                r["seen"] = True
                self.seen_ts.append(time.time())
                self.frontier = max(self.frontier, card["seq"])
                b["shown"] += 1
                idea["shown"] += 1
                idea["last"] = cid
                today = time.strftime("%Y-%m-%d")
                self.reader["days"][today] = self.reader["days"].get(today, 0) + 1
            d = ev["dwell_ms"]
            if d > r["dwell"]:
                b["dwell"] += d - r["dwell"]
                r["dwell"] = d
        elif kind == "like":
            if ev["on"] != r["liked"]:
                b["liked"] += 1 if ev["on"] else -1
            r["liked"] = ev["on"]
        elif kind == "save":
            r["saved"] = ev["on"]
            if ev["on"] and cid not in self.reader["saved"]:
                self.reader["saved"].append(cid)
                self.reader["savedCards"][cid] = {k: v for k, v in card.items()}
            elif not ev["on"]:
                self.reader["saved"] = [x for x in self.reader["saved"] if x != cid]
                self.reader["savedCards"].pop(cid, None)
        elif kind == "less":
            if not r["less"]:
                b["less"] += 1
                if card["idea"] not in self.reader["muted"]:
                    self.reader["muted"].append(card["idea"])
            r["less"] = True
        elif kind == "more":
            r["more"] = True
        elif kind == "open":
            r["opened"] = True
        elif kind == "answer" and card["kind"] == "quiz" and r["choice"] is None:
            q = card["quiz"]
            if ev["choice"] >= len(q["options"]):
                return reply
            right = ev["choice"] == q["answer"]
            r["choice"], r["right"] = ev["choice"], right
            self.frontier = max(self.frontier, card["seq"])
            if right:
                self.reader["streak"] += 1
                self.reader["best"] = max(self.reader["best"], self.reader["streak"])
                b["right"] += 1
                idea["right"] += 1
            else:
                self.reader["streak"] = 0
                b["wrong"] += 1
                idea["wrong"] += 1
                if not any(x["idea"] == card["idea"] for x in self.reader["retest"]):
                    self.reader["retest"].append({"card": cid, "book": card["book"], "idea": card["idea"],
                                                  "anchor": card["anchor"], "missed": q["q"],
                                                  "answer": q["options"][q["answer"]], "why": q["why"],
                                                  "at": card["seq"], "tries": 0})
            reply.update({"right": right, "answer": q["answer"], "streak": self.reader["streak"]})
        self.reader_dirty = True
        return reply

    # ------------------------------------------------------------ what the page sees

    def public(self, card):
        r = self.rec(card["id"]) or {}
        out = {k: v for k, v in card.items()}
        out["mine"] = {"liked": bool(r.get("liked")), "saved": bool(r.get("saved")), "less": bool(r.get("less")),
                       "choice": r.get("choice")}
        return out

    def snapshot(self, since):
        with state_lock:
            return {
                "listening": listening(), "writing": self.req is not None,
                "waited": round(time.time() - self.req["t0"]) if self.req else 0, "session": self.name,
                "cards": [self.public(c) for c in self.cards if c["seq"] > since], "total": len(self.cards),
                "unread": self.unread(), "streak": self.reader["streak"], "best": self.reader["best"],
                "booksMet": sum(1 for s in self.slugs if self.reader["books"].get(s, {}).get("shown", 0) > 0),
                "today": self.reader["days"].get(time.strftime("%Y-%m-%d"), 0), "saved": list(self.reader["saved"]),
            }

    def saved_cards(self):
        with state_lock:
            return [self.reader["savedCards"][i] for i in self.reader["saved"] if i in self.reader["savedCards"]]

    def books_meta(self):
        st = self.index["settings"]
        return {"books": {s: {"title": b["title"], "setting": b["setting"], "label": st[b["setting"]]["label"],
                              "colour": st[b["setting"]]["colour"], "code": b["code"]} for s, b in self.index["books"].items()},
                "settings": st}

    def save_reader(self, force=False):
        with state_lock:
            if not (self.reader_dirty or force) or (time.time() - self.saved_at < 2 and not force):
                return
            rd = self.reader
            if len(rd["cards"]) > KEEP_CARDS:  # the per-card records are for recent history only
                for cid in sorted(rd["cards"], key=lambda c: int(c[1:]))[:len(rd["cards"]) - KEEP_CARDS]:
                    rd["cards"].pop(cid, None)
            text = json.dumps(rd, ensure_ascii=False, indent=1)
            self.reader_dirty = False
            self.saved_at = time.time()
        write_atomic(READER, text + "\n")


feed = None


def pump():
    while True:
        try:
            feed.poll()
            feed.save_reader()
        except Exception:
            feed.log_error("pump")
        time.sleep(0.5)


# ---------------------------------------------------------------- the web side

EVENT_FIELDS = {"seen": ("card", "dwell_ms"), "like": ("card", "on"), "save": ("card", "on"), "less": ("card",),
                "more": ("card",), "open": ("card",), "answer": ("card", "choice", "ms")}


def clean_event(raw):
    """Only the whitelisted types and fields, each of the right shape; None for anything else."""
    if not isinstance(raw, dict) or raw.get("type") not in EVENT_FIELDS:
        return None
    kind = raw["type"]
    ev = {"type": kind}
    for f in EVENT_FIELDS[kind]:
        v = raw.get(f)
        if f == "card":
            if not isinstance(v, str) or not KEY.fullmatch(v):
                return None
        elif f == "on":
            if not isinstance(v, bool):
                return None
        else:  # dwell_ms, choice, ms: whole numbers
            if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v:
                return None
            v = int(v)
            v = clamp(v, 0, 3 if f == "choice" else 3600000)
        ev[f] = v
    return ev


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def local(self):
        """Only this machine's browser, on this server's own address (any, with --host)."""
        host = self.headers.get("Host", "")
        return host in HOSTS or (OPEN and host.rpartition(":")[2] == str(PORT))

    def send_json(self, text, status=200):
        data = text.encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def gate(self):
        """The parsed URL when this request may be answered; otherwise the error is already sent and this is None."""
        if not self.local():
            self.send_error(403)
            return None
        url = urlsplit(self.path)
        # judge the path the file server will really open: decoded, with its dots resolved
        # (/%2e%2e/bespoke/ and /books/..%2fbespoke/ are /bespoke/, and /Bespoke/ is the same folder on a Mac)
        raw = unquote(url.path)
        parts = [p for p in posixpath.normpath(raw).split("/") if p]
        if "\x00" in raw or (parts and parts[0].lower() in HIDDEN) or any(p.startswith(".") for p in parts):
            self.send_error(404)
            return None
        return url

    def do_HEAD(self):
        if self.gate():
            super().do_HEAD()

    def do_GET(self):
        url = self.gate()
        if url is None:
            return
        if url.path == "/":
            self.send_response(302)
            self.send_header("Location", "/feed/app/")
            self.end_headers()
            return
        if url.path == "/api/state":
            try:
                since = int(parse_qs(url.query).get("since", ["0"])[0])
            except ValueError:
                return self.send_error(400)
            return self.send_json(json.dumps(feed.snapshot(since), ensure_ascii=False))
        if url.path == "/api/books":
            return self.send_json(json.dumps(feed.books_meta(), ensure_ascii=False))
        if url.path == "/api/saved":
            return self.send_json(json.dumps(feed.saved_cards(), ensure_ascii=False))
        if url.path.startswith("/api/"):
            return self.send_error(404)
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)  # the repository is served read-only, but not browsed
        return None

    def end_headers(self):
        if self.path.startswith("/feed/app/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_POST(self):
        # Another site open in the browser must not be able to put events in front of the feed:
        # only this server's own pages may post, and only as JSON (which a foreign form cannot send).
        origin = self.headers.get("Origin", "")
        if (not self.local() or origin.removeprefix("http://") != self.headers.get("Host")
                or not self.headers.get("Content-Type", "").startswith("application/json")):
            return self.send_error(403)
        if self.path != "/api/event":
            return self.send_error(404)
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get("Content-Length", 0)), 20000)))
        except (ValueError, TypeError):
            return self.send_error(400)
        events = body.get("events") if isinstance(body, dict) and "events" in body else [body]
        if not isinstance(events, list):
            return self.send_error(400)
        reply = {"ok": True}
        with state_lock:
            for raw in events[:50]:
                ev = clean_event(raw)
                if ev is None:
                    continue
                append_line(feed.dir / "events.jsonl", {**ev, "at": stamp()})
                r = feed.event(ev)
                if ev["type"] == "answer" and "right" in r:
                    reply.update(r)
            reply["streak"] = feed.reader["streak"]
        self.send_json(json.dumps(reply))


def retire_old_server():
    """One session at a time: a server left from an earlier session is stopped."""
    try:
        old = int(PID.read_text())
        command = subprocess.run(["ps", "-p", str(old), "-o", "command="], capture_output=True, text=True).stdout
        if "feed/server.py" in command and old != os.getpid():
            os.kill(old, signal.SIGTERM)
            time.sleep(1)
    except (OSError, ValueError):
        pass


def shutdown(*_):
    if feed:
        feed.save_reader(force=True)
    os._exit(0)


if __name__ == "__main__":
    FEED.mkdir(parents=True, exist_ok=True)
    if not INDEX.exists():
        sys.exit("no index yet: run python3 feed/index.py first")
    retire_old_server()
    feed = Feed()
    server = ThreadingHTTPServer((HOST, PORT), partial(Handler, directory=str(ROOT)))
    server.daemon_threads = True
    PID.write_text(str(os.getpid()))
    feed.start()
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    threading.Thread(target=pump, daemon=True).start()
    print(f"feed: http://{HOST}:{PORT}/  session {feed.name}", flush=True)
    server.serve_forever()
