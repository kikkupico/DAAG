"""Gather every book's computing cover into assets/js/book-covers.js, for pages that show all the books at once.

Each book draws its cover in its own script.js, between  /* cover:start */  and  /* cover:end */ :
    const COVER=(svg,{...})=>{ ... };
    COVERS.draw("#coversvg",COVER);COVERS.mount(COVER);
This copies each block without its draw and mount calls, as  BOOK_COVERS["<slug>"]=COVER .
Run from the repo root after changing a cover:  python3 art/scroll/book_covers.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/js/book-covers.js"

parts = []
for script in sorted(ROOT.glob("books/*/script.js")):
    m = re.search(r"/\* cover:start \*/\n(.*?)/\* cover:end \*/", script.read_text(), re.S)
    if not m:
        continue
    body = re.sub(r"^COVERS\.(draw|mount)\(.*$\n?", "", m.group(1), flags=re.M).rstrip()
    if "const COVER=" not in body:
        sys.exit(f"{script}: the cover block has no  const COVER=")
    parts.append(f'BOOK_COVERS["{script.parent.name}"]=(()=>{{\n{body}\nreturn COVER;}})();')

OUT.write_text(
    "/* Every book's computing cover, copied from the cover:start … cover:end block of its script.js by\n"
    "   art/scroll/book_covers.py. Do not edit here: change the book's script.js and rerun that script.\n"
    "   Draw one with  COVERS.draw(svg, BOOK_COVERS[slug]) ; needs assets/js/covers.js. */\n"
    '"use strict";\nwindow.BOOK_COVERS={};\n' + "\n\n".join(parts) + "\n")
print(f"{len(parts)} covers -> {OUT.relative_to(ROOT)}")
