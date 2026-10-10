"""The words a book's cover and its card on the home page share, kept once in meta.json.

    python3 art/scroll/cover.py            check that every card and cover says what meta.json says
    python3 art/scroll/cover.py --write    rewrite the cards and the hand-edited covers from meta.json

art/scroll/parts/<slug>/meta.json holds, beside the page's title and description:
    question   the question the book asks, in machine terms (HTML)
    how        the "We find out by exploring…" line (HTML)
    credit     the short credit under the card on the home page (HTML)
    papers     [{"authors": "...", "title": "...", "year": 1998}, ...], written out on the cover

A book's body.html says {{question}}, {{how}} and {{source}} on its cover, and assemble.py fills
them in. The home page, index.html, and the Part-Time Parliament's page, which has no body.html,
are written by hand: the check compares them, and --write puts meta.json's words into them.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PARTS = HERE / "parts"


def load(slug):
    return json.loads((PARTS / slug / "meta.json").read_text())


def source(meta):
    return "After " + " · ".join(f'{p["authors"]}, <i>{p["title"]}</i>, {p["year"]}' for p in meta["papers"])


def fill(body, meta):
    """Put the cover's words into a body.html."""
    words = {"question": meta["question"], "how": meta["how"], "source": source(meta)}
    for key, text in words.items():
        mark = "{{" + key + "}}"
        if body.count(mark) != 1:
            sys.exit(f"body.html must say {mark} exactly once")
        body = body.replace(mark, text)
    return body


def card_re(slug):
    return re.compile(r'(href="books/' + re.escape(slug) + r'/index\.html">.*?<p class="q">)(.*?)(</p><p class="how">)(.*?)'
                      r'(</p><span class="credit">)(.*?)(</span>)', re.S)


COVER = re.compile(r'(<p class="generic">)(.*?)(</p>\s*<p class="allegory">)(.*?)(</p>\s*<p class="source">)(.*?)(</p>)', re.S)


def sync(text, pattern, want, where, write, bad):
    """Compare three captured pieces of text with want; with write, replace them."""
    m = pattern.search(text)
    if not m:
        bad.append(f"{where}: not found")
        return text
    have = (m.group(2), m.group(4), m.group(6))
    if have == want:
        return text
    if not write:
        bad.extend(f"{where}: {name} differs from meta.json" for name, h, w in zip(("first", "second", "third"), have, want) if h != w)
        return text
    g = m.group
    return text[:m.start()] + g(1) + want[0] + g(3) + want[1] + g(5) + want[2] + g(7) + text[m.end():]


def main():
    write = "--write" in sys.argv[1:]
    bad = []
    home_path = ROOT / "index.html"
    home = home_path.read_text()
    slugs = sorted(p.parent.name for p in PARTS.glob("*/meta.json"))
    for slug in slugs:
        meta = load(slug)
        home = sync(home, card_re(slug), (meta["question"], meta["how"], meta["credit"]), f"index.html card for {slug}", write, bad)
        page_path = ROOT / "books" / slug / "index.html"
        page = page_path.read_text()
        want = (meta["question"], meta["how"], source(meta))
        if (PARTS / slug / "body.html").exists():
            # an assembled page is never edited: a difference means it needs building again
            m = COVER.search(page)
            if not m or m.group(2, 4, 6) != want:
                bad.append(f"books/{slug}: cover is stale, run assemble.py {slug}")
        else:
            new = sync(page, COVER, want, f"books/{slug} cover", write, bad)
            if new != page:
                page_path.write_text(new)
                print("wrote", page_path.relative_to(ROOT))
    cards = len(re.findall(r'<p class="q">', home))
    if cards != len(slugs):
        bad.append(f"index.html has {cards} cards and parts/ has {len(slugs)} meta.json files")
    if write and home != home_path.read_text():
        home_path.write_text(home)
        print("wrote index.html")
    for line in bad:
        print(line)
    if bad:
        sys.exit(1)
    print(f"{len(slugs)} books: cards and covers agree with meta.json")


if __name__ == "__main__":
    main()
