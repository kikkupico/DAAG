"""The graph at the start of a book: the papers its own papers draw on, and the papers they lead to.

    python3 scroll/lineage.py            check the data and print each book's count of papers
    python3 scroll/lineage.py <slug>     print that book's graph

Lineage is kept by paper, never by book, in papers/lineage.json:
    papers    {"<data-file>": "Lamport 1978", ...}   the papers of the series, by their names on
              papers/index.html, which also gives each one's title, link and book
    outside   {"<id>": {"label": "Schneider 1990", "title": "...", "url": "..."}}   papers outside
              the series; "url" only where a free copy has been checked
    edges     [from, to, what, how]: the later paper reuses an idea of the earlier one. "what" names
              the idea in a few words and is written on the edge; "how" is one sentence in machine
              terms. An edge is a reuse of an idea, never an order of reading. It may run against
              the years in print: a result often circulated long before its journal carried it.

A book's lineage is that of its papers: they stand in the middle column, one node each, with
what they draw on to the left and what they lead to on the right. The graph is a spread of its
own, between the cover and the first spread: where a book's body.html says {{lineage}},
assemble.py puts it; lineage.css lays it out and lineage.js draws its edges.
The Part-Time Parliament's page, written by hand, is kept in step by cover.py --write.
"""
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PARTS = HERE / "parts"
OPEN, CLOSE = "<!-- lineage -->", "<!-- /lineage -->"
esc = html.escape
# the torn edge every spread opens with; the one after the cover is coloured by shell.css
TEAR = ('<svg class="tear" viewBox="0 0 1200 26" preserveAspectRatio="none"><path d="M0 0h1200v9l-50 10-80-9-60 11-100-10-90 8-90-11'
        '-90 12-100-10-80 8-110-9-100 12-80-10-70 8z"/></svg>')


def load():
    data = json.loads((ROOT / "papers" / "lineage.json").read_text())
    page = (ROOT / "papers" / "index.html").read_text()
    papers = {}
    for row in re.findall(r"<(?:tr|li)>.*?</(?:tr|li)>", page, re.S):
        link = re.search(r'<a href="([^"]+)" data-file="([^"]+)">(.*?)</a>', row, re.S)
        book = re.search(r"\.\./books/([a-z-]+)/index\.html", row)
        if link and book:
            papers[link[2]] = {"url": link[1], "title": link[3], "book": book[1], "label": data["papers"].get(link[2])}
    return data, papers


def year(label):
    return int(re.search(r"\d{4}", label)[0])


def title_of(slug):
    return json.loads((PARTS / slug / "meta.json").read_text())["title"].split(" — ")[0]


def names(labels):
    return " and ".join(labels) if len(labels) < 3 else ", ".join(labels[:-1]) + " and " + labels[-1]


def block(slug):
    """The graph for one book, between its two marks."""
    data, papers = load()
    info = lambda p: papers.get(p) or data["outside"][p]
    label = lambda p: info(p)["label"]
    order = lambda ps: sorted(ps, key=lambda p: (year(label(p)), list(papers).index(p) if p in papers else 99, label(p)))
    mids, left = [], order(p for p in papers if papers[p]["book"] == slug)
    while left:  # by year, but a paper never stands above one of the book's own that it draws on
        nxt = next(p for p in left if not any(a in left and b == p for a, b, *_ in data["edges"]))
        mids.append(nxt)
        left.remove(nxt)
    edges = [e for e in data["edges"] if e[0] in mids or e[1] in mids]
    ins = order({a for a, b, *_ in edges if a not in mids})
    outs = order({b for a, b, *_ in edges if b not in mids})
    multi = len(mids) > 1

    def links(side, own):
        """The edges at one node, as labels: those that carry the same idea share one."""
        mine = [e for e in edges if (side == "in" and e[0] == own) or (side == "out" and e[1] == own)
                or (side == "mid" and e[1] == own and e[0] in mids)]
        groups = {}
        for a, b, what, how in sorted(mine, key=lambda e: -mids.index(e[0]) if side == "mid" else 0):
            groups.setdefault(what if side != "mid" else (what, a), []).append((a, b, what, how))
        out = []
        for group in groups.values():
            froms = order({a for a, *_ in group})
            tos = order({b for _, b, *_ in group})
            pre = {"in": "i:", "out": "m:", "mid": "m:"}[side], {"in": "m:", "out": "o:", "mid": "m:"}[side]
            ends = ""
            if side == "mid" or multi:
                ends = "from " + names([label(p) for p in froms]) if side != "in" else "to " + names([label(p) for p in tos])
            how = " ".join(dict.fromkeys(e[3] for e in group))
            out.append(f'<li class="lin-link" data-side="{side}" data-from="{" ".join(pre[0] + p for p in froms)}" '
                       f'data-to="{" ".join(pre[1] + p for p in tos)}" tabindex="0"><em>{esc(group[0][2])}</em>'
                       f'<span class="ends">{esc(ends)}</span><span class="why">{esc(how)}</span></li>')
        return f'<ul class="lin-links">{"".join(out)}</ul>' if out else ""

    def node(p, side):
        i = info(p)
        mark = f'data-n="{side[0]}:{p}" data-label="{esc(i["label"])}"'
        if side == "mid":
            return (f'<li>{links("mid", p)}<a class="lin-node here" {mark} href="{i["url"]}"><b>{i["title"]}</b>'
                    f'<span class="by">{esc(i["label"])}</span></a></li>')
        if p in papers:
            card = (f'<a class="lin-node book" {mark} href="../{i["book"]}/index.html"><b>{i["title"]}</b>'
                    f'<span class="by">{esc(i["label"])} · {esc(title_of(i["book"]))}</span></a>')
        else:
            tag, end = (f'a href="{i["url"]}"', "a") if i.get("url") else ("div", "div")
            card = f'<{tag} class="lin-node ext" {mark}><b>{esc(i["title"])}</b><span class="by">{esc(i["label"])}</span></{end}>'
        return f"<li>{card}{links(side, p)}</li>"

    def column(cls, head, ps, side):
        if not ps:
            return f'    <div class="{cls}"></div>\n'
        return (f'    <div class="{cls}">\n      <h5>{head}</h5>\n      <ul class="lin-nodes">\n'
                + "".join(f"        {node(p, side)}\n" for p in ps) + "      </ul>\n    </div>\n")

    return (f'{OPEN}\n<section class="spread dark" id="lineage" data-name="Where this book sits">\n  {TEAR}\n'
            f'  <div class="wrap lin-wrap">\n    <div class="kicker">Where this book sits</div>\n'
            f'    <div class="lin{" multi" if multi else ""}">\n    <svg class="lin-edges" aria-hidden="true"></svg>\n'
            + column("lin-side in", "Draws on", ins, "in")
            + column("lin-mid", "This book retells", mids, "mid")
            + column("lin-side out", "Leads to", outs, "out")
            + '    <p class="lin-say">Each link is an idea one paper took from another. Point at one, or tap it, to read how.</p>\n'
            + '    <p class="lin-key"><i class="k here"></i>a paper this book retells <i class="k book"></i>a paper retold in another book '
              '<i class="k ext"></i>a paper outside the series</p>\n'
            + f'    </div>\n  </div>\n</section>\n{CLOSE}')


def check():
    data, papers = load()
    bad = [f"papers/index.html has no paper {p}" for p in data["papers"] if p not in papers]
    bad += [f"lineage.json has no label for {p}" for p in papers if not papers[p]["label"]]
    known = set(papers) | set(data["outside"])
    for e in data["edges"]:
        if len(e) != 4 or e[0] not in known or e[1] not in known:
            bad.append(f"edge {e[:2]} names a paper that is not listed")
        elif e[0] in data["outside"] and e[1] in data["outside"]:
            bad.append(f"edge {e[:2]} touches no paper of the series")
    used = {p for e in data["edges"] for p in e[:2]}
    bad += [f"{p} is on no edge" for p in known - used]
    return bad


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(block(sys.argv[1]))
        sys.exit()
    bad = check()
    for line in bad:
        print(line)
    if bad:
        sys.exit(1)
    for part in sorted(PARTS.iterdir()):
        text = block(part.name)
        print(f'{part.name}: {text.count("lin-node here")} retold, {text.count("data-n=" + chr(34) + "i:")} drawn on, '
              f'{text.count("data-n=" + chr(34) + "o:")} led to')
