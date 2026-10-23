"""What the server checks in every card the writer sends, before the reader can see it.

A card is data. It is checked against the index (books, anchors, pictures), its text is linted for
the series' rules (register, pronouns, dashes, pictographs), and its figure is checked against the
declarative schema of section 7: a kind and a capped list of marks. Whatever passes is rebuilt from
the checked values, so unknown fields and marks never reach the page. Nothing here runs anything.
"""
import re

KINDS = ("fact", "picture", "figure", "quiz")
REGISTERS = ("story", "machine")
FIELDS = ("kind", "register", "book", "anchor", "idea", "hook", "body", "more", "image", "figure", "quiz", "series")
WORDS = {"hook": 12, "body": 45, "more": 90, "q": 22, "option": 9, "why": 35, "title": 6}
LABEL = 28  # characters in a figure label; longer ones are trimmed
MAX_BATCH = 20


class Bad(Exception):
    """A value that does not fit the schema."""


# ---------------------------------------------------------------- the text rules

def words(s):
    return len(s.split())


PRONOUN = re.compile(r"\b(?:he|him|his|himself|she|her|hers|herself)\b", re.I)
DASH = re.compile("[—―⸺⸻]|--| - | – ")
# emoji and pictographs: not the Greek letters, arrows, or maths the series uses
PICTO = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿⌚⌛⏩-⏳⏸-⏺"
                   "‍️⃣‼⁉™ℹ©®〰〽㊗㊙]")
CONTROL = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

MACHINE = [  # words a story card never uses
    r"process(?:es|ed|ing|ors?)?", r"messages?", r"nodes?", r"protocols?", r"servers?", r"replica(?:s|te|ted|tes|tion|tions)?",
    r"quorums?", r"consensus", r"lineariz\w*", r"linearis\w*", r"time-?stamps?", r"snapshots?", r"partition(?:s|ed|ing)?",
    r"byzantine", r"crash(?:es|ed|ing)?", r"latenc(?:y|ies)", r"databases?", r"algorithms?|algorithmic", r"clients?",
    r"machines?", r"computers?",
]
AUTHORS = ("Lamport Fischer Lynch Paterson Chandy Fidge Mattern Herlihy Wing Dwork Stockmeyer Ben-Or Chandra Toueg Shostak "
           "Pease Castro Liskov Oki Yin Malkhi Reiter Gueta Abraham Brewer Gilbert Demers Bailis Shapiro Hellerstein "
           "Ameloot Neven Alvaro").split()
# the in-world Demerios and Hellersteinos, and Liskovia and Okios of Schedia, are whole words that these
# patterns do not match: \b ends a name only where a letter does not follow
YEAR = re.compile(r"\b(?:19|20)\d\d\b")
SETTING_WORDS = re.compile(r"\b(?:books?|ledgers?|pages?|bookkeepers?)\b", re.I)
DEVICES = re.compile(r"\b(?:tents?|ravens?|mercenar(?:y|ies)|bandits?|rats?|sash(?:es)?|goatherds?|legislators?|priests?|podiums?|"
                     r"tablets?|pebbles?|terraces?|couriers?|librar(?:y|ies)|librarians?|copyists?|festivals?|stoas?|wax)\b", re.I)
MACHINE_RE = re.compile(r"\b(?:" + "|".join(MACHINE) + r")\b", re.I)
QUORUM_RE = re.compile(r"\bquorums?\b", re.I)
AUTHOR_RE = re.compile(r"\b(?:" + "|".join(re.escape(a) for a in AUTHORS) + r")\b")  # case-sensitive: Wing is not a wing


def around(text, m, pad=22):
    a, b = max(0, m.start() - pad), min(len(text), m.end() + pad)
    return ("…" if a else "") + text[a:b].replace("\n", " ") + ("…" if b < len(text) else "")


def lint(register, book, strings):
    """Every complaint about the words of a card: a list of (why, field, quote)."""
    out = []
    for field, text in strings:
        for m in PRONOUN.finditer(text):
            out.append((f"uses the pronoun '{m.group(0)}'; use the name, the number, the role, or they", field, around(text, m)))
            break
        m = DASH.search(text)
        if m:
            out.append(("uses a dash; use a full stop or a line break", field, around(text, m)))
        m = PICTO.search(text)
        if m:
            out.append(("uses an emoji or pictograph", field, around(text, m)))
        if register == "story":
            for m in MACHINE_RE.finditer(text):
                if QUORUM_RE.fullmatch(m.group(0)) and book == "the-part-time-parliament":
                    continue
                out.append((f"story card uses the machine word '{m.group(0)}'", field, around(text, m)))
                break
            m = AUTHOR_RE.search(text)
            if m:
                out.append((f"story card names the author '{m.group(0)}'", field, around(text, m)))
            m = YEAR.search(text)
            if m:
                out.append((f"story card gives a year '{m.group(0)}'", field, around(text, m)))
            m = SETTING_WORDS.search(text)
            if m:
                out.append((f"story card says '{m.group(0)}'; records here are scrolls and wax tablets", field, around(text, m)))
        else:
            m = DEVICES.search(text)
            if m:
                out.append((f"machine card uses the story word '{m.group(0)}'", field, around(text, m)))
    return out


# ---------------------------------------------------------------- schema pieces

def text(n=LABEL):
    def f(v, path, sink):
        if not isinstance(v, str) or not v.strip():
            raise Bad("must be a short text")
        s = " ".join(v.split())[:n].rstrip()
        sink.append((path, s))
        return s
    return f


def one_of(*opts):
    def f(v, path, sink):
        if isinstance(v, bool) or v not in opts or type(v) not in (int, str):
            raise Bad("must be one of " + ", ".join(repr(o) for o in opts))
        return v
    return f


def rng(lo, hi):
    def f(v, path, sink):
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not lo <= v <= hi:
            raise Bad(f"must be a number from {lo} to {hi}")
        return round(float(v), 2) if isinstance(v, float) else v
    return f


def flag(v, path, sink):
    if v is not True and v is not False:
        raise Bad("must be true or false")
    return v


def pair(opts):
    def f(v, path, sink):
        if (not isinstance(v, list) or len(v) != 2 or any(isinstance(x, bool) or x not in opts for x in v)
                or v[0] == v[1]):
            raise Bad("must be two different places, from " + ", ".join(repr(o) for o in opts))
        return list(v)
    return f


def some_of(opts, lo=0, hi=7, fix=lambda x: x):
    def f(v, path, sink):
        if not isinstance(v, list) or not lo <= len(v) <= hi:
            raise Bad(f"must be a list of {lo} to {hi} of " + ", ".join(repr(o) for o in opts))
        out = []
        for x in v:
            x = fix(x)
            if isinstance(x, bool) or x not in opts:
                raise Bad(f"{x!r} is not one of " + ", ".join(repr(o) for o in opts))
            if x not in out:
                out.append(x)
        return out
    return f


def colour(v, path, sink):
    if not isinstance(v, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}|olive|gold|blue|red|purple|grey|teal", v):
        raise Bad("must be #rrggbb or one of olive, gold, blue, red, purple, grey, teal")
    return v


GLYPHS = "ΑΒΓΔΕΖΗ"  # Alpha Beta Gamma Delta Epsilon Zeta Eta
LATIN = dict(zip("ABGDEZH", GLYPHS))


def seat(x):
    return LATIN.get(x, x)


def seat_ref(v, path, sink):
    v = seat(v)
    if v not in GLYPHS:
        raise Bad("must be one of the seat letters " + " ".join(GLYPHS))
    return v


FIVE = ("O", "L", "K", "M", "T")  # Okios, Liskovia, Kleon, Melissa, Theron
KEYS = re.compile(r"[A-Za-z0-9]{1,6}")


def key(v, path, sink):
    if not isinstance(v, str) or not KEYS.fullmatch(v):
        raise Bad("must be a short key of letters and digits")
    return v


def one_object(spec, need=()):
    """A small dict checked against spec = {field: validator}; fields it does not know are dropped."""
    def f(v, path, sink):
        if not isinstance(v, dict):
            raise Bad("must be an object")
        c = {}
        for k, val in v.items():
            if k in spec:
                try:
                    c[k] = spec[k](val, f"{path}.{k}", sink)
                except Bad as e:
                    raise Bad(f"{k}: {e}")
        for k in need:
            if k not in c:
                raise Bad(f"needs '{k}'")
        return c
    return f


def objects(spec, hi, need=()):
    """A list of 1 to hi such objects."""
    one = one_object(spec, need)

    def f(v, path, sink):
        if not isinstance(v, list) or not 1 <= len(v) <= hi:
            raise Bad(f"must be a list of 1 to {hi} objects")
        return [one(d, f"{path}.{i}", sink) for i, d in enumerate(v)]
    return f


def side(v, path, sink):
    if not isinstance(v, dict):
        raise Bad("must be {\"title\": ..., \"lines\": [...]}")
    c = {}
    if "title" in v:
        c["title"] = text(LABEL)(v["title"], path + ".title", sink)
    lines = v.get("lines", [])
    if not isinstance(lines, list) or len(lines) > 4:
        raise Bad("lines must be a list of at most 4")
    c["lines"] = [text(60)(x, f"{path}.lines.{i}", sink) for i, x in enumerate(lines)]
    return c


HOUSES, TENTS, POSTS, LIBS = (1, 2, 3), (1, 2, 3, 4), (1, 2, 3, 4), tuple(range(1, 9))
# kind: (cap on marks, {mark: (value check, {other field: check}, fields it must have)})
FIGURES = {
    "ring": (10, {
        "tag": (one_of(1, 2, 3, "gate"), {"text": text()}, ("text",)),
        "slip": (pair(HOUSES), {"label": text()}, ()),
        "cart": (pair(HOUSES), {"label": text()}, ()),
        "sash": (pair(HOUSES), {}, ()),
        "goatherd": (pair(HOUSES), {}, ()),
        "glow": (one_of(*HOUSES), {}, ()),
    }),
    "hill": (12, {
        "tag": (one_of(*TENTS), {"text": text()}, ("text",)),
        "raven": (pair(TENTS), {"state": one_of("flying", "lost", "pine")}, ()),
        "hawks": (one_of(*TENTS), {}, ()),
        "wind": (flag, {}, ()),
        "silent": (one_of(*TENTS), {}, ()),
        "badge": (one_of(*TENTS), {"text": one_of("A", "H")}, ("text",)),
        "coin": (one_of(*TENTS), {"face": one_of("owl", "goddess")}, ("face",)),
        "slate": (one_of(*TENTS), {"chalked": some_of(TENTS, 0, 4)}, ()),
        "glow": (one_of(*TENTS), {}, ()),
    }),
    "crown": (12, {
        "tag": (one_of(*POSTS), {"text": text()}, ("text",)),
        "rat": (pair(POSTS), {"label": text()}, ()),
        "seal": (one_of(*POSTS), {"text": text()}, ()),
        "lock": (one_of(*POSTS), {}, ()),
        "glass": (one_of(*POSTS), {}, ()),
        "glow": (one_of(*POSTS), {}, ()),
    }),
    "chamber": (12, {
        "seats": (some_of(GLYPHS, 3, 7, seat), {}, ()),
        "tag": (seat_ref, {"text": text()}, ("text",)),
        "ring": (some_of(GLYPHS, 0, 7, seat), {"colour": one_of("blue", "olive", "gold")}, ()),
        "out": (some_of(GLYPHS, 0, 7, seat), {}, ()),
        "centre": (text(40), {}, ()),
    }),
    "tholos": (12, {
        "podium": (text(14), {"holder": one_of(*FIVE)}, ()),
        "porch": (one_of(*FIVE), {}, ()),
        "wax": (some_of(FIVE, 0, 5), {}, ()),
        "tag": (one_of(*FIVE), {"text": text()}, ("text",)),
        "ring": (some_of(FIVE, 0, 5), {}, ()),
        "runner": (one_of(*FIVE), {}, ()),
    }),
    "coast": (10, {
        "tag": (one_of(*LIBS), {"text": text()}, ("text",)),
        "courier": (pair(LIBS), {"state": one_of("walking", "stopped", "lost")}, ()),
        "glow": (one_of(*LIBS), {}, ()),
        "ferry": (flag, {}, ()),
    }),
    "hall": (4, {
        "question": (text(60), {}, ()),
        "door": (one_of("north", "south"), {}, ()),
        "north": (text(), {}, ()),
        "south": (text(), {}, ()),
    }),
    "timeline": (28, {
        "places": (objects({"key": key, "label": text(8), "colour": colour}, 5, ("key", "label")), {}, ()),
        "event": (one_object({"at": key, "t": rng(1.4, 9), "label": text(), "hollow": flag}, ("at", "t")), {}, ()),
        "arc": (one_object({"from": key, "t1": rng(1.4, 9), "to": key, "t2": rng(1.4, 9), "label": text(), "lost": flag},
                           ("from", "t1", "to", "t2")), {}, ()),
        "loop": (objects({"at": key, "t": rng(1.4, 9)}, 8, ("at", "t")), {}, ()),
    }),
    "stat": (2, {"value": (text(20), {}, ()), "caption": (text(80), {}, ())}),
    "versus": (2, {"left": (side, {}, ()), "right": (side, {}, ())}),
    "pebbles": (1, {"columns": (objects({"label": text(12), "white": rng(0, 12), "black": rng(0, 12)}, 4, ("label",)), {}, ())}),
}
TIMELINE_CAPS = {"event": 12, "arc": 10}


def check_figure(fig, sink):
    """The figure rebuilt from the values that passed; Bad if it cannot be drawn."""
    if not isinstance(fig, dict):
        raise Bad("figure must be {\"kind\": ..., \"marks\": [...]}")
    kind = fig.get("kind")
    if kind not in FIGURES:
        raise Bad(f"figure kind {kind!r} is not one of " + ", ".join(FIGURES))
    cap, spec = FIGURES[kind]
    marks = fig.get("marks")
    if not isinstance(marks, list) or not marks:
        raise Bad("figure needs a list of marks")
    if len(marks) > cap:
        raise Bad(f"a {kind} figure takes at most {cap} marks, not {len(marks)}")
    out, counts = [], {}
    for i, m in enumerate(marks):
        if not isinstance(m, dict):
            continue  # not a mark; nothing to draw
        prime = next((k for k in m if k in spec), None)
        if prime is None:
            continue  # an unknown mark is ignored, as the page ignores it
        check, extras, need = spec[prime]
        path = f"figure.marks.{i}.{prime}"
        try:
            c = {prime: check(m[prime], path, sink)}
            for k, v in m.items():
                if k in extras:
                    c[k] = extras[k](v, f"{path}.{k}", sink)
            for k in need:
                if k not in c:
                    raise Bad(f"needs '{k}'")
        except Bad as e:
            raise Bad(f"{kind} mark {i + 1} ({prime}): {e}")
        counts[prime] = counts.get(prime, 0) + 1
        if kind == "timeline" and prime in TIMELINE_CAPS and counts[prime] > TIMELINE_CAPS[prime]:
            raise Bad(f"a timeline takes at most {TIMELINE_CAPS[prime]} {prime} marks")
        if kind == "timeline" and prime == "places" and counts[prime] > 1:
            raise Bad("a timeline takes one places mark")
        out.append(c)
    if not out:
        raise Bad(f"no {kind} mark was recognised; the marks are: " + ", ".join(spec))
    if kind == "timeline":
        places = [p["key"] for m in out if "places" in m for p in m["places"]]
        if not places:
            raise Bad("a timeline needs a places mark")
        for m in out:
            refs = []
            if "event" in m:
                refs = [m["event"]["at"]]
            elif "arc" in m:
                refs = [m["arc"]["from"], m["arc"]["to"]]
            elif "loop" in m:
                refs = [p["at"] for p in m["loop"]]
            for r in refs:
                if r not in places:
                    raise Bad(f"timeline refers to place {r!r}, which no places mark defines")
    result = {"kind": kind, "marks": out}
    if "title" in fig and fig["title"] not in (None, ""):
        t = fig["title"]
        if not isinstance(t, str) or words(t) > WORDS["title"]:
            raise Bad(f"figure title is over {WORDS['title']} words")
        result["title"] = " ".join(t.split())
        sink.append(("figure.title", result["title"]))
    return result


# ---------------------------------------------------------------- one card

def every_string(v, path="card"):
    if isinstance(v, str):
        yield path, v
    elif isinstance(v, dict):
        for k, x in v.items():
            yield path + "." + str(k), str(k)
            yield from every_string(x, path + "." + str(k))
    elif isinstance(v, list):
        for i, x in enumerate(v):
            yield from every_string(x, f"{path}.{i}")


def clean_text(s):
    return "\n".join(" ".join(line.split()) for line in s.strip().splitlines()).strip()


def idea_key(idea, code):
    s = re.sub(r"[^a-z0-9.\-]", "", idea.strip().lower().replace(" ", "-").replace("_", "-"))[:40].strip(".-")
    if not s:
        raise Bad("idea must be a short key such as al.three")
    return s if s.startswith(code + ".") else f"{code}.{s}"


def check_card(raw, index, images):
    """(card, []) when the card passes; (None, [(why, field, quote), ...]) when it does not.

    index is the index.json dictionary; images maps a picture's repository path to its alt text."""
    if not isinstance(raw, dict):
        return None, [("a card must be an object", "card", "")]
    bad = []

    def fail(why, field="card", quote=""):
        bad.append((why, field, quote))

    for path, s in every_string(raw):
        if "<" in s or ">" in s:
            fail("contains '<' or '>'; cards are plain text, so write → for an arrow", path, around(s, re.search("[<>]", s)))
        if CONTROL.search(s):
            fail("contains a control character", path, "")
    if bad:
        return None, bad
    kind, register, slug = raw.get("kind"), raw.get("register"), raw.get("book")
    if kind not in KINDS:
        fail(f"kind {kind!r} is not one of {', '.join(KINDS)}", "kind", str(kind))
    if register not in REGISTERS:
        fail(f"register {register!r} is not story or machine", "register", str(register))
    book = index["books"].get(slug) if isinstance(slug, str) else None
    if not book:
        fail(f"book {slug!r} is not one of the eighteen slugs", "book", str(slug))
        return None, bad
    anchor = raw.get("anchor")
    if anchor not in book["anchors"]:
        fail(f"anchor {anchor!r} is not an id in {slug}", "anchor", str(anchor))
    card = {"kind": kind, "register": register, "book": slug, "anchor": anchor}
    try:
        card["idea"] = idea_key(raw["idea"], book["code"]) if isinstance(raw.get("idea"), str) else None
        if card["idea"] is None:
            raise Bad("idea must be a short key such as al.three")
    except Bad as e:
        fail(str(e), "idea", str(raw.get("idea")))
    strings = []
    for field in ("hook", "body", "more"):
        v = raw.get(field)
        if v in (None, "") and field == "more":
            continue
        if not isinstance(v, str) or not v.strip():
            fail(f"{field} is missing", field)
            continue
        v = clean_text(v)
        if words(v) > WORDS[field]:
            fail(f"{field} is {words(v)} words; the most is {WORDS[field]}", field, v[:60])
        card[field] = v
        strings.append((field, v))
    if kind == "picture":
        im = raw.get("image")
        src = im.get("src") if isinstance(im, dict) else None
        if src not in images:
            fail(f"image src {src!r} is not in the catalogue", "image", str(src))
        else:
            card["image"] = {"src": src, "alt": images[src]}
    elif kind == "figure":
        sink = []
        try:
            card["figure"] = check_figure(raw.get("figure"), sink)
            strings += sink
        except Bad as e:
            fail(str(e), "figure", "")
    elif kind == "quiz":
        q = raw.get("quiz")
        try:
            if not isinstance(q, dict):
                raise Bad("a quiz card needs a quiz")
            qq, opts, why = q.get("q"), q.get("options"), q.get("why")
            if not isinstance(qq, str) or not qq.strip():
                raise Bad("quiz.q is missing")
            if not isinstance(why, str) or not why.strip():
                raise Bad("quiz.why is missing")
            if not isinstance(opts, list) or not 2 <= len(opts) <= 4 or not all(isinstance(o, str) and o.strip() for o in opts):
                raise Bad("quiz.options must be 2 to 4 texts")
            ans = q.get("answer")
            if isinstance(ans, bool) or not isinstance(ans, int) or not 0 <= ans < len(opts):
                raise Bad("quiz.answer must be the index of the right option")
            qq, why, opts = clean_text(qq), clean_text(why), [clean_text(o) for o in opts]
            if words(qq) > WORDS["q"]:
                raise Bad(f"quiz.q is {words(qq)} words; the most is {WORDS['q']}")
            if words(why) > WORDS["why"]:
                raise Bad(f"quiz.why is {words(why)} words; the most is {WORDS['why']}")
            for i, o in enumerate(opts):
                if words(o) > WORDS["option"]:
                    raise Bad(f"quiz option {i + 1} is {words(o)} words; the most is {WORDS['option']}")
            if len({o.lower() for o in opts}) != len(opts):
                raise Bad("quiz options repeat")
            card["quiz"] = {"q": qq, "options": opts, "answer": ans, "why": why}
            strings += [("quiz.q", qq), ("quiz.why", why)] + [(f"quiz.options.{i}", o) for i, o in enumerate(opts)]
        except Bad as e:
            fail(str(e), "quiz", "")
    sr = raw.get("series")
    if sr not in (None, ""):
        if (not isinstance(sr, dict) or not isinstance(sr.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,12}", sr["id"])
                or sr.get("of") != 2 or sr.get("part") not in (1, 2) or isinstance(sr.get("part"), bool)):
            fail("series must be {\"id\": \"s1\", \"part\": 1 or 2, \"of\": 2}", "series", "")
        elif kind == "quiz":
            fail("a cliffhanger pair is made of facts, pictures or figures, not quizzes", "series", "")
        else:
            card["series"] = {"id": sr["id"], "part": sr["part"], "of": 2}
    if register in REGISTERS:
        bad.extend(lint(register, slug, strings))
    if bad:
        return None, bad
    return card, []


def check_pairs(batch):
    """batch: [(card or None, index in the file)]. A cliffhanger pair is accepted whole or not at all:
    part 1 is a card whose body ends on a question, and part 2, in the same book, follows it at once.
    Returns {index: reason} for the cards that fail."""
    out = {}
    for pos, (card, i) in enumerate(batch):
        if not (card and card.get("series")):
            continue
        s = card["series"]
        nxt = batch[pos + 1][0] if pos + 1 < len(batch) else None
        prv = batch[pos - 1][0] if pos > 0 else None
        if s["part"] == 1:
            if not (nxt and nxt.get("series") and nxt["series"]["id"] == s["id"] and nxt["series"]["part"] == 2):
                out[i] = "series part 1 is not followed at once by its part 2 in this batch"
            elif nxt["book"] != card["book"]:
                out[i] = "the two parts of a series must be from one book"
            elif not card["body"].rstrip().endswith("?"):
                out[i] = "series part 1 must end on a question that part 2 answers"
        elif not (prv and prv.get("series") and prv["series"]["id"] == s["id"] and prv["series"]["part"] == 1):
            out[i] = "series part 2 does not follow its part 1 at once in this batch"
    for _ in range(2):  # a pair stands or falls together
        for pos, (card, i) in enumerate(batch):
            if card and card.get("series") and i not in out:
                mate = pos + 1 if card["series"]["part"] == 1 else pos - 1
                if 0 <= mate < len(batch) and batch[mate][1] in out:
                    out[i] = "its partner in the series was rejected"
    return out
