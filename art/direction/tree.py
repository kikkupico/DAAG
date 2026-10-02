#!/usr/bin/env python3
"""Art-direction tree: from the historic reference down to the images, with blast radius.

    python3 art/direction/tree.py build              # write tree.json, TREE.md, tree.html
    python3 art/direction/tree.py impact <what>      # blast radius of a decision id, a file, or a regex
    python3 art/direction/tree.py stale [<id>]       # nodes older than the decision that touches them
    python3 art/direction/tree.py touch <id>         # mark a decision as changed today
    python3 art/direction/tree.py decisions          # the registry, with counts

Layers, top to bottom:
  0 reference    hellenistic-reference.html sections, and the art decisions drawn from them
  1 world guide  settings.md, buildings.md, reality.md, art/world-prompt.md, places/*/index.html
  2 book guide   process.md, arche-plans.md, paxos-plans.md
  3 book         books/*/index.html and the home page
  4 spec         the shot, sheet, set and cast entries that generate an image
  5 image        assets/img/** and the reference sheets in art/refs

An art decision (art/direction/decisions.json) names a section of the reference and a set of
regexes. A node is *touched* by a decision when its text matches; an image is touched when its
spec, or a reference sheet its spec uses, matches. The blast radius of a decision has two tiers:
  direct     nodes that mention it
  inherited  nodes downstream of a direct hit by a real dependency (place -> its books -> their
             specs -> images; sheet -> the specs that use it), which may need review
A node is stale when it is older than the `updated` date of a decision that touches it. Text files
are dated by their last commit (or their mtime when they have uncommitted changes), images by mtime.
Standard library only.
"""
import datetime, html, json, re, subprocess, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "art/direction"
LAYERS = ["reference", "world guide", "book guide", "book", "spec", "image"]
CREDITS_PER_IMAGE = 3   # Nano Banana 2 through Meshy
WORLD = ["settings.md", "buildings.md", "reality.md", "art/world-prompt.md"]
GUIDES = ["process.md", "arche-plans.md", "paxos-plans.md"]
ISLAND = {"ring-road": "arche", "the-crown": "arche", "the-foot": "arche"}   # other places are Paxos
PLANS = {"arche": "arche-plans.md", "paxos": "paxos-plans.md"}
SKIP_DIRS = {"__pycache__", "archive"}


def read(p):
    try:
        return (ROOT / p).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def git_times():
    out = subprocess.run(["git", "log", "--name-only", "--format=@%ct"], cwd=ROOT, capture_output=True,
                         text=True).stdout
    t, cur = {}, 0
    for line in out.splitlines():
        if line.startswith("@"):
            cur = int(line[1:])
        elif line and line not in t:
            t[line] = cur
    dirty = {l[3:].strip('"') for l in subprocess.run(["git", "status", "--porcelain"], cwd=ROOT,
                                                       capture_output=True, text=True).stdout.splitlines()}
    return t, dirty


GIT, DIRTY = git_times()


def stamp(path):
    f = ROOT / path
    if not f.exists():
        return None
    if path in GIT and path not in DIRTY:
        return GIT[path]
    return int(f.stat().st_mtime)


class Graph:
    def __init__(self):
        self.nodes, self.children, self.parents = {}, defaultdict(set), defaultdict(set)

    def node(self, nid, layer, label=None, path=None, text="", **kw):
        if nid not in self.nodes:
            self.nodes[nid] = dict(id=nid, layer=layer, label=label or nid, path=path or nid.split("#")[0],
                                   text=text, time=stamp(path or nid.split("#")[0]), **kw)
        return self.nodes[nid]

    def edge(self, a, b):
        if a in self.nodes and b in self.nodes and a != b:
            self.children[a].add(b)
            self.parents[b].add(a)

    def descendants(self, nid):
        seen, stack = set(), [nid]
        while stack:
            for c in self.children[stack.pop()]:
                if c not in seen:
                    seen.add(c)
                    stack.append(c)
        return seen


def load_decisions():
    return json.loads((DIR / "decisions.json").read_text())["decisions"]


def build():
    g = Graph()
    decisions = load_decisions()

    # 0 reference: sections of the Hellenistic reference
    ref = read("hellenistic-reference.html")
    for m in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*>\s*<h2[^>]*>(.*?)</h2>', ref, re.S):
        g.node("hellenistic-reference.html#" + m.group(1), 0, re.sub(r"<[^>]+>|\s+", " ", m.group(2)).strip(),
               "hellenistic-reference.html")
    for d in decisions:
        g.node("decision:" + d["id"], 0, d["title"], "art/direction/decisions.json", decision=d["id"],
               retired=bool(d.get("retired")))
        g.edge("hellenistic-reference.html#" + d["ref"], "decision:" + d["id"])

    # 1 world guide
    for p in WORLD:
        g.node(p, 1, text=read(p))
    places = sorted(x.parent.name for x in (ROOT / "places").glob("*/index.html"))
    for s in places:
        g.node(f"places/{s}/index.html", 1, f"place: {s}", text=read(f"places/{s}/index.html"))
        g.edge("reality.md", f"places/{s}/index.html")

    # 2 book guide
    for p in GUIDES:
        g.node(p, 2, text=read(p))

    # 3 books (and the home page)
    books = sorted(x.parent.name for x in (ROOT / "books").glob("*/index.html"))
    for b in books:
        g.node(f"books/{b}/index.html", 3, f"book: {b}", text=read(f"books/{b}/index.html"))
    g.node("index.html", 3, "home page", text=read("index.html"))
    for s in places:                      # a place and the books set there
        for b in re.findall(r"\.\./\.\./books/([a-z0-9-]+)/", read(f"places/{s}/index.html")):
            g.edge(f"places/{s}/index.html", f"books/{b}/index.html")
            g.edge(PLANS[ISLAND.get(s, "paxos")], f"books/{b}/index.html")
    for b in books:                       # and the books that name the place
        for s in set(re.findall(r"places/([a-z-]+)", read(f"books/{b}/index.html"))):
            g.edge(f"places/{s}/index.html", f"books/{b}/index.html")

    # 4 specs: shots, sheets, props, sets
    shots = {}
    for f in sorted((ROOT / "art/panels").glob("*/shots.json")):
        book = f.parent.name
        for sid, v in json.loads(f.read_text()).items():
            if not isinstance(v, dict):
                continue
            nid = f"art/panels/{book}/shots.json#{sid}"
            shots[(book, sid)] = nid
            g.node(nid, 4, f"shot: {book}/{sid}", f"art/panels/{book}/shots.json", text=json.dumps(v),
                   refs=(v.get("scene") or {}).get("refs", []))
    sheets = {}
    sj = json.loads(read("art/refs/sheets.json") or "{}")
    for name, v in sj.items():
        if not isinstance(v, dict):
            continue
        nid = f"art/refs/sheets.json#{name}"
        sheets[name] = nid
        g.node(nid, 4, f"sheet: {name}", "art/refs/sheets.json", text=json.dumps(v))
    for p in ("art/cast/props.json", "art/cast/cast.json"):
        for k, v in json.loads(read(p) or "{}").items():
            if not k.startswith("_"):
                g.node(f"{p}#{k}", 4, f"{Path(p).stem}: {k}", p, text=json.dumps(v))
    for f in sorted((ROOT / "art/sets").glob("*.py")):
        g.node(f"art/sets/{f.name}", 4, f"set: {f.stem}", text=f.read_text(errors="replace"))
    for (book, sid), nid in shots.items():
        for r in g.nodes[nid]["refs"]:
            sheet = r.split("/")[0]
            for cand in (sheet, sheet + "-props"):
                if cand in sheets:
                    g.edge(sheets[cand], nid)
        if book != "places" and f"books/{book}/index.html" in g.nodes:
            g.edge(f"books/{book}/index.html", nid)

    # 5 images
    for img in sorted((ROOT / "assets/img").rglob("*.jpg")):
        rel = str(img.relative_to(ROOT))
        parts = img.relative_to(ROOT / "assets/img").parts
        g.node(rel, 5, "image: " + "/".join(parts))
        if parts[0] == "panels":
            spec = shots.get((parts[1], img.stem))
            book = parts[1]
        elif parts[0] == "covers":
            spec, book = shots.get((img.stem, "cover")), img.stem
        else:
            spec = shots.get(("places", img.stem)) or shots.get(("places", img.stem.replace("-inside", "")))
            book = None
        g.nodes[rel]["spec"] = spec
        if spec:
            g.edge(spec, rel)
        elif book and f"books/{book}/index.html" in g.nodes:
            g.edge(f"books/{book}/index.html", rel)
        if parts[0] == "places":
            g.edge(f"places/{img.stem}/index.html", spec or rel)
    for f in sorted((ROOT / "art/refs").glob("*-sheet.png")):
        name = f.name[:-len("-sheet.png")]
        rel = str(f.relative_to(ROOT))
        g.node(rel, 5, "sheet image: " + name)
        g.edge(sheets.get(name, ""), rel)
    for (book, sid), nid in shots.items():          # place pages embed their images
        if book == "places":
            for s in places:
                if re.search(rf"assets/img/places/{re.escape(sid)}\.jpg", read(f"places/{s}/index.html")):
                    g.edge(f"places/{s}/index.html", nid)

    # touches
    for d in decisions:
        pats = [re.compile(t, re.I) for t in d["terms"]]
        for n in g.nodes.values():
            if n["layer"] and n["text"] and any(p.search(n["text"]) for p in pats):
                n.setdefault("touches", set()).add(d["id"])
    for n in g.nodes.values():                       # an image takes on its spec's and its sheets'
        if n["layer"] == 5:
            for sp in g.parents[n["id"]]:
                n.setdefault("touches", set()).update(g.nodes[sp].get("touches", set()))
                for sh in g.parents[sp]:
                    if g.nodes[sh]["layer"] == 4:
                        n["touches"].update(g.nodes[sh].get("touches", set()))
    for n in g.nodes.values():                       # so a regex search sees what generated an image
        if n["layer"] == 5:
            n["text"] = " ".join(g.nodes[sp]["text"] for sp in g.parents[n["id"]] if g.nodes[sp]["layer"] == 4)
    return g, decisions


def radius(g, d):
    direct = {n["id"] for n in g.nodes.values() if d["id"] in n.get("touches", ())}
    inherited = set()
    for nid in direct:               # a world or book guide is global; only places, books and specs carry scope
        if g.nodes[nid]["layer"] in (3, 4) or nid.startswith("places/"):
            inherited |= g.descendants(nid)
    inherited -= direct
    return direct, inherited


def stale(g, d):
    if not d.get("updated"):
        return set()
    cut = int(datetime.datetime.fromisoformat(d["updated"]).timestamp())
    direct, _ = radius(g, d)
    return {i for i in direct if g.nodes[i]["layer"] >= 1 and g.nodes[i]["time"] is not None
            and g.nodes[i]["time"] < cut}


def by_layer(g, ids):
    out = defaultdict(list)
    for i in sorted(ids):
        out[g.nodes[i]["layer"]].append(i)
    return out


def counts(g, ids):
    c = by_layer(g, ids)
    return " · ".join(f"{len(c[l])} {LAYERS[l]}" for l in range(1, 6) if c[l]) or "none"


def show(g, ids, indent="  "):
    for l, items in sorted(by_layer(g, ids).items()):
        print(f"{indent}{LAYERS[l]} ({len(items)})")
        for i in items:
            print(f"{indent}  {i}")


def cost(g, ids):
    n = sum(1 for i in ids if g.nodes[i]["layer"] == 5 and g.nodes[i]["path"].startswith("assets/"))
    return f"{n} images to regenerate ≈ {n * CREDITS_PER_IMAGE} credits"


def md_tree(g, decisions):
    L = ["# Art direction tree", "",
         "Built by `python3 art/direction/tree.py build`. Layers run from the historic reference down to the images; "
         "each art decision lists what mentions it (direct) and what lies downstream of those (inherited). "
         "Stale means older than the decision's `updated` date.", "",
         "| Layer | Nodes |", "|---|---|"]
    for l, name in enumerate(LAYERS):
        L.append(f"| {l} {name} | {sum(1 for n in g.nodes.values() if n['layer'] == l)} |")
    L += ["", "## Reference, decisions and blast radius", ""]
    for sec in [i for i in g.nodes if i.startswith("hellenistic-reference.html#")]:
        L.append(f"- **{g.nodes[sec]['label']}** (`{sec}`)")
        for dn in sorted(g.children[sec]):
            d = next(x for x in decisions if "decision:" + x["id"] == dn)
            direct, inh = radius(g, d)
            st = stale(g, d)
            flag = " · RETIRED wording, fix leftovers" if d.get("retired") else ""
            L.append(f"  - `{d['id']}` {d['title']}{flag}")
            L.append(f"    - direct: {counts(g, direct)}")
            L.append(f"    - inherited: {counts(g, inh)}")
            if st:
                L.append(f"    - stale: {counts(g, st)} (changed {d['updated']})")
    L += ["", "## Dependencies", "", "```", "place -> its books -> their shot specs -> images; sheet -> shot specs that use it; "
          "reality.md -> place pages; plans -> the books of their island", "```", ""]
    for s in sorted(i for i in g.nodes if i.startswith("places/")):
        kids = sorted(c for c in g.children[s] if g.nodes[c]["layer"] == 3)
        L.append(f"- `{s}`")
        for b in kids:
            imgs = [x for x in g.descendants(b) if g.nodes[x]["layer"] == 5]
            L.append(f"  - `{b}` ({len(imgs)} images)")
    orphans = [n["id"] for n in g.nodes.values() if n["layer"] == 5 and n["path"].startswith("assets/")
               and not n.get("spec")]
    free = [n["id"] for n in g.nodes.values() if n["layer"] in (1, 2, 3, 4) and not n.get("touches")]
    L += ["", "## Gaps", "", f"- Images with no shot spec: {len(orphans)}"] + [f"  - `{o}`" for o in orphans]
    L += [f"- Nodes no decision touches: {len(free)} (a decision is missing, or the node is out of scope)"]
    return "\n".join(L) + "\n"


def html_tree(g, decisions):
    def kids(ids):
        c = by_layer(g, ids)
        return "".join(f"<details><summary>{LAYERS[l]} ({len(v)})</summary><ul>"
                       + "".join(f"<li><code>{html.escape(i)}</code></li>" for i in v) + "</ul></details>"
                       for l, v in sorted(c.items()))
    out = ["<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
           "<title>Art direction tree</title><style>:root{color-scheme:light dark}body{font:15px/1.5 system-ui;"
           "max-width:60rem;margin:2rem auto;padding:0 1rem}code{font-size:.85em}summary{cursor:pointer}"
           ".r{color:#b33}</style><h1>Art direction tree</h1>"
           "<p>Reference sections, the decisions drawn from them, and each decision's blast radius.</p>"]
    for sec in [i for i in g.nodes if i.startswith("hellenistic-reference.html#")]:
        out.append(f"<details open><summary><b>{html.escape(g.nodes[sec]['label'])}</b></summary><ul>")
        for dn in sorted(g.children[sec]):
            d = next(x for x in decisions if "decision:" + x["id"] == dn)
            direct, inh = radius(g, d)
            st = stale(g, d)
            out.append(f"<li><details><summary><code>{d['id']}</code> {html.escape(d['title'])}"
                       + (" <span class=r>retired</span>" if d.get("retired") else "")
                       + f" — {len(direct)} direct, {len(inh)} inherited"
                       + (f", <span class=r>{len(st)} stale</span>" if st else "") + "</summary>"
                       f"<p>Direct</p>{kids(direct)}<p>Inherited</p>{kids(inh)}</details></li>")
        out.append("</ul></details>")
    return "".join(out)


def find_targets(g, decisions, what):
    for d in decisions:
        if d["id"] == what:
            return d, "decision"
    path = what.split("#")[0]
    if what in g.nodes or path in g.nodes or (ROOT / path).exists():
        return {"id": what, "terms": [], "title": what}, "node"
    return {"id": what, "title": f"regex /{what}/", "terms": [what]}, "regex"


def cmd_impact(what):
    g, decisions = build()
    d, kind = find_targets(g, decisions, what)
    if kind == "node":
        nid = what if what in g.nodes else next((i for i in g.nodes if i.split("#")[0] == what.split("#")[0]), None)
        ids = {nid} | g.descendants(nid) if nid else set()
        print(f"{what}: changing it reaches {counts(g, ids - {nid})}")
        show(g, ids - {nid})
        print(" ", cost(g, ids))
        return
    if kind == "regex":
        pat = re.compile(what, re.I)
        direct = {n["id"] for n in g.nodes.values() if n["text"] and pat.search(n["text"])}
        inh = set()
        for i in direct:
            inh |= g.descendants(i)
        inh -= direct
    else:
        direct, inh = radius(g, d)
    print(f"{d['title']}")
    print(f"\nDIRECT: {counts(g, direct)}")
    show(g, direct)
    print(f"\nINHERITED: {counts(g, inh)}")
    show(g, inh)
    print(f"\n{cost(g, direct | inh)} (direct and inherited); "
          f"{cost(g, {i for i in direct if g.nodes[i]['layer'] == 5})} if only images that mention it")
    st = stale(g, d) if kind == "decision" else set()
    if st:
        print(f"\nSTALE since {d['updated']}: {counts(g, st)}")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd == "build":
        g, decisions = build()
        out = {"layers": LAYERS, "nodes": {i: {k: (sorted(v) if isinstance(v, set) else v) for k, v in n.items()
                                                if k != "text"} for i, n in g.nodes.items()},
               "edges": sorted([a, b] for a, cs in g.children.items() for b in cs),
               "decisions": {d["id"]: {"direct": sorted(radius(g, d)[0]), "inherited": sorted(radius(g, d)[1]),
                                       "stale": sorted(stale(g, d))} for d in decisions}}
        (DIR / "tree.json").write_text(json.dumps(out, indent=1))
        (DIR / "TREE.md").write_text(md_tree(g, decisions))
        (DIR / "tree.html").write_text(html_tree(g, decisions))
        print(f"{len(g.nodes)} nodes, {sum(len(c) for c in g.children.values())} edges -> art/direction/"
              "{tree.json,TREE.md,tree.html}")
    elif cmd == "impact" and len(sys.argv) > 2:
        cmd_impact(sys.argv[2])
    elif cmd == "stale":
        g, decisions = build()
        for d in decisions:
            if len(sys.argv) > 2 and d["id"] != sys.argv[2]:
                continue
            st = stale(g, d)
            if st:
                print(f"{d['id']} (changed {d['updated']}): {counts(g, st)}")
                show(g, st)
    elif cmd == "touch" and len(sys.argv) > 2:
        p = DIR / "decisions.json"
        data = json.loads(p.read_text())
        for d in data["decisions"]:
            if d["id"] == sys.argv[2]:
                d["updated"] = datetime.date.today().isoformat()
                p.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
                print(f"{d['id']} updated {d['updated']}")
                return
        sys.exit("no such decision")
    elif cmd == "decisions":
        g, decisions = build()
        for d in decisions:
            direct, inh = radius(g, d)
            print(f"{d['id']:<26} direct {len(direct):>3}  inherited {len(inh):>3}  stale {len(stale(g, d)):>3}"
                  f"  updated {d.get('updated') or '-'}")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
