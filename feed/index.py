"""Build the writer's index of the eighteen books, and print any part of it as plain text.

    python3 feed/index.py                          build bespoke/feed/index.json and menu.json
    python3 feed/index.py --menu [SLUG...]         print the spreads of some books (all, if none) as id | h2 | lede
    python3 feed/index.py --show SLUG [SPREAD...] [--places]
                                                   print a book (or some of its spreads) from the index; --places
                                                   adds the place pictures of every setting, not just the book's own

The index is read from the built pages, books/<slug>/index.html and books/<slug>/script.js, with the
standard library only. It holds, for each book: its setting, cover lines, papers, every spread's
text (proof panels and the lineage block left out), the anchors a card may link to, the who-is-who
pairs in both registers, and the pictures a card may show. The server checks every card against it;
the writer chooses ideas from menu.json and reads their text with --show.
"""
import json
import os
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "bespoke" / "feed"

# setting key: (label on the card, tint, the label papers/index.html gives it)
SETTINGS = {
    "ring": ("ring road", "#b5602c", "Three Houses Keeping Order"),
    "foot": ("foot of Mount Phyle", "#5f6e28", "Four Mercenaries Who Must Agree"),
    "crown": ("crown of Mount Phyle", "#7a4fa0", "Four Bandits Who Must Agree Though Some Lie"),
    "chamber": ("the Chamber", "#136f9e", "Part-Time Legislators Passing Laws"),
    "tholos": ("the Tholos", "#c8961c", "A Council of Five Keeping One Law"),
    "coast": ("the scholars' coast", "#2e88b5", "Libraries That Agree in the End"),
    "hall": ("the oracle at the fork", "#6b5a48", "Students Asking Which Life to Lead"),
}
# the eighteen books, in the order the index lists them: slug, setting, the short code of idea keys
BOOKS = [
    ("ordering-without-clocks", "ring", "owc"),
    ("taking-stock-without-stopping", "ring", "ts"),
    ("many-copies-acting-as-one", "ring", "mc"),
    ("the-limits-of-agreement", "foot", "la"),
    ("agreeing-when-messages-run-late", "foot", "aml"),
    ("agreeing-by-chance", "foot", "abc"),
    ("telling-the-dead-from-the-slow", "foot", "tds"),
    ("answering-while-cut-off", "foot", "awc"),
    ("agreeing-among-liars", "crown", "al"),
    ("keeping-order-among-liars", "crown", "kol"),
    ("changing-leaders-among-liars", "crown", "cla"),
    ("the-part-time-parliament", "chamber", "ptp"),
    ("one-leader-at-a-time", "tholos", "olt"),
    ("spreading-by-word-of-mouth", "coast", "swm"),
    ("changes-that-never-clash", "coast", "cnc"),
    ("probably-up-to-date", "coast", "pud"),
    ("what-you-can-promise-alone", "coast", "wcp"),
    ("knowing-when-to-wait", "hall", "kww"),
]

# the places/ folders, and the setting each one describes
PLACE_SETTING = {"ring-road": "ring", "the-foot": "foot", "the-crown": "crown", "the-chamber": "chamber",
                 "schedia": "tholos", "scholars-coast": "coast", "oracle-at-the-fork": "hall"}
VOID = {"br", "img", "hr", "meta", "link", "input", "source", "wbr", "col", "area", "base", "embed", "param", "track"}
BREAK = {"p", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "br", "td", "th", "tr", "table", "summary",
         "section", "header", "footer", "blockquote"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, dict(attrs), parent, []

    @property
    def cls(self):
        return (self.attrs.get("class") or "").split()

    def find_all(self, test):
        for k in self.kids:
            if isinstance(k, Node):
                if test(k):
                    yield k
                yield from k.find_all(test)


class Builder(HTMLParser):
    """A small tree of the page. The books are generated and well formed; a stray end tag is ignored."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node("root", [], None)

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.kids.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        c = self.cur
        while c is not None and c.tag != tag:
            c = c.parent
        if c is not None and c is not self.root:
            self.cur = c.parent

    def handle_data(self, data):
        self.cur.kids.append(data)


def parse(path):
    b = Builder()
    b.feed(Path(path).read_text(encoding="utf-8"))
    b.close()
    return b.root


# ---------------------------------------------------------------- text

# what is never part of a spread's reading text
def skipped(n):
    c = n.cls
    return (n.tag in ("svg", "script", "style", "button", "noscript", "select", "option", "input")
            or (n.tag == "details" and "proof" in c)
            or (n.tag == "sup" and "xref" in c)
            or bool({"lin-wrap", "lin", "lineage", "refs", "apparatus", "links", "tear", "meander", "cut", "bar",
                     "fold-shadow"} & set(c)))


def clean(s):
    s = s.replace("\xa0", " ").replace(" ", " ").replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def text_of(n):
    parts = []

    def walk(m):
        for k in m.kids:
            if isinstance(k, str):
                parts.append(k)
            elif not skipped(k):
                brk = k.tag in BREAK
                if brk:
                    parts.append(" ")
                walk(k)
                if brk:
                    parts.append(" ")

    walk(n)
    return clean("".join(parts))


def own_text(n, tag=None, cls=None):
    for k in n.find_all(lambda m: (tag is None or m.tag == tag) and (cls is None or cls in m.cls)):
        if not skipped(k):
            return text_of(k)
    return ""


def parse_spread(sec):
    """One section or header of a book: the text a writer may restate."""
    sp = {"id": sec.attrs["id"], "name": sec.attrs.get("data-name", ""), "anchors": [], "kicker": "", "h2": "",
          "lede": "", "paragraphs": [], "cards": [], "tells": []}
    extra = {"lists": [], "tables": [], "notes": [], "pins": [], "demos": [], "results": []}

    def card(n):
        label = own_text(n, cls="num")
        h3 = own_text(n, "h3")
        ps = [text_of(p) for p in n.find_all(lambda m: m.tag == "p" and not skipped(m))]
        ps += [text_of(li) for li in n.find_all(lambda m: m.tag == "li" and not skipped(m))]
        ps = [p for p in ps if p]
        if h3 or ps:
            sp["cards"].append({k: v for k, v in (("label", label), ("h3", h3), ("p", " ".join(ps))) if v})

    def has_h3(n):
        return any(True for _ in n.find_all(lambda m: m.tag == "h3"))

    def walk(n):
        for k in n.kids:
            if isinstance(k, str) or skipped(k):
                continue
            c, t = k.cls, k.tag
            if t == "a" and "anchor" in c and k.attrs.get("id"):
                sp["anchors"].append(k.attrs["id"])
            elif t in ("h1", "h2"):
                sp["h2"] = sp["h2"] or text_of(k)
            elif "kicker" in c and not sp["kicker"]:
                sp["kicker"] = text_of(k)
            elif t == "p":
                s = text_of(k)
                if not s or {"say", "key", "given", "generic", "allegory", "source", "lin-say", "lin-key"} & set(c):
                    continue
                if "lede" in c:
                    sp["lede"] = sp["lede"] or s
                elif "tell" in c:
                    sp["tells"].append(s)
                elif {"note", "fnote"} & set(c):
                    extra["notes"].append(s)
                elif "big" in c:
                    extra["results"].append(s)
                else:
                    sp["paragraphs"].append(s)
            elif t == "div" and "pin" in c:
                b = own_text(k, "b")
                body = text_of(k)
                extra["pins"].append({"title": b, "text": body[len(b):].strip() if b else body})
            elif t == "div" and "paper" in c and ("well" in c or "logs" in c or "mach" in c):
                title = own_text(k, "h4")
                notes = [text_of(p) for p in k.find_all(lambda m: m.tag == "p" and not skipped(m))]
                buttons = [clean(text_of(b)) for b in k.find_all(lambda m: m.tag == "button")]
                extra["demos"].append({k2: v for k2, v in (("title", title), ("note", [x for x in notes if x]),
                                                          ("buttons", [x for x in buttons if x])) if v})
            elif t == "div" and ({"card3", "step", "card", "slab"} & set(c)) and has_h3(k):
                card(k)
            elif t == "div" and {"stmt-box", "result", "end"} & set(c):
                walk(k)
            elif t == "ul" or t == "ol":
                items = [text_of(li) for li in k.find_all(lambda m: m.tag == "li" and not skipped(m))]
                items = [x for x in items if x]
                if items:
                    extra["lists"].append(items)
            elif t == "table":
                rows = []
                for tr in k.find_all(lambda m: m.tag == "tr"):
                    cells = [text_of(td) for td in tr.kids if isinstance(td, Node) and td.tag in ("td", "th")]
                    if any(cells):
                        rows.append(cells)
                if rows:
                    extra["tables"].append(rows)
            elif t == "blockquote":
                sp["paragraphs"].append(text_of(k))
            elif t == "h3":
                pass
            else:
                walk(k)

    walk(sec)
    sp["extra"] = {k: v for k, v in extra.items() if v}
    return sp


# ---------------------------------------------------------------- the who-is-who pairs

ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}


def js_array(src, i):
    """Parse a JavaScript array of arrays of strings starting at src[i] == '['; return (value, next index)."""
    assert src[i] == "["
    i += 1
    out = []
    while True:
        while src[i] in " \t\r\n,":
            i += 1
        if src.startswith("//", i):
            i = src.index("\n", i)
            continue
        if src.startswith("/*", i):
            i = src.index("*/", i) + 2
            continue
        ch = src[i]
        if ch == "]":
            return out, i + 1
        if ch == "[":
            v, i = js_array(src, i)
            out.append(v)
        elif ch in "\"'`":
            q, i, s = ch, i + 1, []
            while src[i] != q:
                if src[i] == "\\":
                    i += 1
                    e = src[i]
                    if e == "u":
                        s.append(chr(int(src[i + 1:i + 5], 16)))
                        i += 4
                    elif e == "x":
                        s.append(chr(int(src[i + 1:i + 3], 16)))
                        i += 2
                    elif e == "\n":
                        pass
                    else:
                        s.append(ESC.get(e, e))
                else:
                    s.append(src[i])
                i += 1
            out.append("".join(s))
            i += 1
        else:
            raise ValueError(f"unexpected {src[i:i + 40]!r} in an array of pairs")


def book_pairs(slug):
    src = (ROOT / "books" / slug / "script.js").read_text(encoding="utf-8")
    at = src.find('mapPairs($("#map"),')
    if at >= 0:
        start = src.index("[", at + len('mapPairs($("#map"),') - 1)
    else:  # the Part-Time Parliament's hand-written script: const pairs=[[...]] under "relevance map"
        mark = re.search(r"relevance map", src)
        m = re.compile(r"const\s+pairs\s*=\s*\[").search(src, mark.start() if mark else 0)
        if not m:
            raise ValueError(f"{slug}: no who-is-who table found in script.js")
        start = m.end() - 1
    pairs, _ = js_array(src, start)
    pairs = [[clean(a), clean(b)] for a, b in pairs]
    if not pairs:
        raise ValueError(f"{slug}: the who-is-who table is empty")
    return pairs


# ---------------------------------------------------------------- pictures

def local_image(page_dir, img):
    """The repository path of an <img>'s file on disk (data-local first), or None."""
    for name in ("data-local", "src"):
        v = img.attrs.get(name, "")
        if not v or re.match(r"(?:[a-z]+:)?//|data:", v):
            continue
        p = Path(os.path.normpath(page_dir / v))
        try:
            rel = p.relative_to(ROOT)
        except ValueError:
            continue
        if p.is_file():
            return rel.as_posix()
    return None


def spread_of(n):
    while n is not None:
        if n.tag in ("section", "header") and n.attrs.get("id"):
            return n.attrs["id"]
        n = n.parent
    return ""


def book_images(page_dir, root):
    out, seen = [], set()
    for img in root.find_all(lambda m: m.tag == "img"):
        src = local_image(page_dir, img)
        if src and src not in seen:
            seen.add(src)
            out.append({"src": src, "alt": clean(img.attrs.get("alt", "")), "spread": spread_of(img)})
    return out


def place_images():
    """assets/img/places/*.jpg that a places page shows with alt text, and the settings whose pages show each."""
    seen = {}
    for page in sorted((ROOT / "places").glob("*/index.html")):
        root = parse(page)
        for img in root.find_all(lambda m: m.tag == "img"):
            src = local_image(page.parent, img)
            if src and src.startswith("assets/img/places/"):
                alt = clean(img.attrs.get("alt", ""))
                if alt:
                    im = seen.setdefault(src, {"src": src, "alt": alt, "place": page.parent.name, "settings": []})
                    st = PLACE_SETTING.get(page.parent.name)
                    if st and st not in im["settings"]:
                        im["settings"].append(st)
    missing = [p.name for p in sorted((ROOT / "assets/img/places").glob("*.jpg")) if f"assets/img/places/{p.name}" not in seen]
    return list(seen.values()), missing


# ---------------------------------------------------------------- the build

def short(s, n=150):
    """A line cut at the end of a sentence, or at a word, so that the menu stays small."""
    s = clean(s)
    if len(s) <= n:
        return s
    stop = max((m.end() for m in re.finditer(r"[.?!] ", s[:n + 1])), default=0)
    if stop >= 50:
        return s[:stop].strip()
    return s[:n].rsplit(" ", 1)[0].rstrip(",;:") + "\u2026"


def menu_of(index):
    """Per book: its setting and its spreads as id, h2 and lede (the first paragraph when there is no lede)."""
    books = {}
    for slug, b in index["books"].items():
        spreads = []
        for sp in b["spreads"]:
            lede = sp["lede"] or (sp["paragraphs"][0] if sp["paragraphs"] else "")
            if sp["h2"] and lede and sp["id"] != "cover":
                spreads.append({"id": sp["id"], "h2": sp["h2"], "lede": short(lede)})
        books[slug] = {"code": b["code"], "title": b["title"], "setting": index["settings"][b["setting"]]["label"],
                       "spreads": spreads}
    return {"note": "Choose ideas here; read their text with: python3 feed/index.py --show SLUG SPREAD...", "books": books}


def menu_text(menu):
    """menu.json with one spread to a line, so that a line is a whole entry."""
    out = ["{", " " + json.dumps("note") + ": " + json.dumps(menu["note"], ensure_ascii=False) + ",", ' "books": {']
    items = list(menu["books"].items())
    for i, (slug, b) in enumerate(items):
        head = {k: v for k, v in b.items() if k != "spreads"}
        out.append("  " + json.dumps(slug) + ": {" + json.dumps(head, ensure_ascii=False)[1:-1] + ', "spreads": [')
        rows = ["   " + json.dumps(sp, ensure_ascii=False) for sp in b["spreads"]]
        out.append(",\n".join(rows))
        out.append("  ]}" + ("," if i < len(items) - 1 else ""))
    out += [" }", "}"]
    return "\n".join(out) + "\n"


def papers_settings():
    """papers/index.html: which setting each book is told in, to check the table above against."""
    text = (ROOT / "papers" / "index.html").read_text(encoding="utf-8")
    return {s: clean(w) for s, w in re.findall(r'href="\.\./books/([a-z-]+)/index\.html"><i>[^<]*</i></a><br><span class="where">([^<]*)</span>', text)}


def build():
    where = papers_settings()
    books = {}
    for slug, setting, code in BOOKS:
        page = ROOT / "books" / slug / "index.html"
        root = parse(page)
        if where.get(slug) != SETTINGS[setting][2]:
            raise ValueError(f"{slug}: papers/index.html puts it in {where.get(slug)!r}, not {SETTINGS[setting][2]!r}")
        cover = next(root.find_all(lambda m: m.tag == "header" and m.attrs.get("id") == "cover"), None)
        if cover is None:
            raise ValueError(f"{slug}: no cover")
        source = own_text(cover, "p", "source")
        spreads = [parse_spread(s) for s in root.find_all(lambda m: m.tag in ("section", "header") and m.attrs.get("id"))]
        anchors = []
        for s in spreads:
            for a in [s["id"]] + s["anchors"]:
                if a not in anchors:
                    anchors.append(a)
        book = {
            "slug": slug, "code": code, "title": own_text(cover, "h1"), "setting": setting,
            "generic": own_text(cover, "p", "generic"), "allegory": own_text(cover, "p", "allegory"),
            "source": source, "papers": [x.strip() for x in source.split(" · ")],
            "anchors": anchors, "pairs": book_pairs(slug), "images": book_images(page.parent, root),
            "spreads": spreads,
        }
        for need in ("title", "generic", "allegory", "source"):
            if not book[need]:
                raise ValueError(f"{slug}: cover has no {need}")
        books[slug] = book
    places, unlabelled = place_images()
    index = {
        "built": time.strftime("%Y-%m-%d %H:%M:%S"),
        "settings": {k: {"label": v[0], "colour": v[1]} for k, v in SETTINGS.items()},
        "places": places,
        "books": books,
    }
    menu = menu_of(index)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (OUT / "menu.json").write_text(menu_text(menu), encoding="utf-8")
    return index, unlabelled


# ---------------------------------------------------------------- --show

def show(slug, wanted, places=False):
    path = OUT / "index.json"
    if not path.exists():
        build()
    index = json.loads(path.read_text(encoding="utf-8"))
    b = index["books"].get(slug)
    if not b:
        sys.exit(f"no book {slug!r}; the slugs are: " + ", ".join(index["books"]))
    ids = [s["id"] for s in b["spreads"]]
    for w in wanted:
        if w not in ids:
            sys.exit(f"{slug} has no spread {w!r}; its spreads are: " + ", ".join(ids))
    st = index["settings"][b["setting"]]
    print(f"BOOK {slug} | {b['title']} | {st['label']} | idea keys start {b['code']}.")
    print(f"generic: {b['generic']}\nallegory: {b['allegory']}\nsource: {b['source']}")
    for sp in b["spreads"]:
        if wanted and sp["id"] not in wanted:
            continue
        print(f"\nSPREAD {sp['id']} | {sp['name']} | anchors: {', '.join(sp['anchors']) or '-'}")
        for k in ("kicker", "h2", "lede"):
            if sp[k]:
                print(f"{k}: {sp[k]}")
        for p in sp["paragraphs"]:
            print(f"p: {p}")
        for c in sp["cards"]:
            print(f"card [{c.get('label', '')}] {c.get('h3', '')}: {c.get('p', '')}")
        for t in sp["tells"]:
            print(f"tell: {t}")
        ex = sp.get("extra", {})
        for pin in ex.get("pins", []):
            print(f"pin [{pin['title']}]: {pin['text']}")
        for items in ex.get("lists", []):
            for it in items:
                print(f"list: {it}")
        for rows in ex.get("tables", []):
            for r in rows:
                print("row: " + " | ".join(r))
        for d in ex.get("demos", []):
            print(f"demo: {d.get('title', '')} {' / '.join(d.get('note', []))} [buttons: {', '.join(d.get('buttons', []))}]")
        for n in ex.get("notes", []) + ex.get("results", []):
            print(f"note: {n}")
    print("\nPAIRS (story | machine room)")
    for a, m in b["pairs"]:
        print(f"{a} | {m}")
    print("\nPICTURES (src | spread | alt)")
    for im in b["images"]:
        if not wanted or im["spread"] in wanted or im["spread"] == "cover":
            print(f"{im['src']} | {im['spread']} | {im['alt']}")
    mine = [im for im in index["places"] if b["setting"] in im["settings"] or places]
    print("\nPLACE PICTURES (any card may use these" + ("" if places else "; --places lists them all") + ")")
    for im in mine:
        print(f"{im['src']} | {short(im['alt'].split(':')[0], 90)}")


def show_menu(slugs):
    path = OUT / "index.json"
    if not path.exists():
        build()
    index = json.loads(path.read_text(encoding="utf-8"))
    menu = menu_of(index)["books"]
    for slug in slugs or menu:
        if slug not in menu:
            sys.exit(f"no book {slug!r}; the slugs are: " + ", ".join(menu))
        b = menu[slug]
        print(f"BOOK {slug} | {b['title']} | {b['setting']} | idea keys start {b['code']}.")
        for sp in b["spreads"]:
            print(f"  {sp['id']} | {sp['h2']} | {sp['lede']}")


def main():
    if "--menu" in sys.argv:
        return show_menu(sys.argv[sys.argv.index("--menu") + 1:])
    if "--show" in sys.argv:
        rest = [a for a in sys.argv[sys.argv.index("--show") + 1:] if a != "--places"]
        if not rest:
            sys.exit("usage: python3 feed/index.py --show SLUG [SPREAD...] [--places]")
        return show(rest[0], rest[1:], "--places" in sys.argv)
    t0 = time.time()
    index, unlabelled = build()
    sizes = {n: (OUT / n).stat().st_size for n in ("index.json", "menu.json")}
    spreads = sum(len(b["spreads"]) for b in index["books"].values())
    pairs = sum(len(b["pairs"]) for b in index["books"].values())
    imgs = sum(len(b["images"]) for b in index["books"].values())
    print(f"{len(index['books'])} books, {spreads} spreads, {pairs} pairs, {imgs} book pictures, {len(index['places'])} place pictures")
    for n, s in sizes.items():
        print(f"{OUT.relative_to(ROOT) / n}: {s:,} bytes (about {s // 4:,} tokens)")
    if unlabelled:
        print("place pictures with no alt text on any places page (not offered): " + ", ".join(unlabelled))
    print(f"{time.time() - t0:.2f} s")


if __name__ == "__main__":
    main()
