"""Build a scroll book: books/<slug>/index.html from the shared shell and the book's own parts.

    python3 art/scroll/assemble.py <slug>

Parts live in art/scroll/parts/<slug>/:
    meta.json   {"title": "...", "description": "..."} and the cover's words (see cover.py)
    body.html   everything inside <body>, from the top bar to the footer; its cover says
                {{question}}, {{how}} and {{source}}, filled in from meta.json
    page.css    styles only this book needs (may be empty)
    page.js     this book's interactives; runs after shell.js, inside one function scope

The page that comes out is self-contained: shell.css and shell.js are copied into it.
The Part-Time Parliament is not built this way; its page is edited directly, and cover.py keeps
its cover in step with its meta.json.
"""
import sys
from pathlib import Path
from cover import fill, load

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
slug = sys.argv[1]
part = HERE / "parts" / slug
if not (part / "body.html").exists():
    sys.exit(f"{slug} has no body.html: its page is edited directly")
meta = load(slug)
css = (HERE / "shell.css").read_text() + (part / "page.css").read_text()
js = (HERE / "shell.js").read_text() + "\n" + (part / "page.js").read_text()
body = fill((part / "body.html").read_text(), meta)
out = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{meta["title"]}</title>
<meta name="description" content="{meta["description"]}">
<link rel="icon" type="image/svg+xml" href="../../assets/img/favicon.svg">
<style>
{css}</style>
</head>
<body>

{body}<script>
"use strict";
(function(){{
{js}}})();
</script>
</body>
</html>
'''
dest = ROOT / "books" / slug / "index.html"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(out)
print("wrote", dest.relative_to(ROOT), len(out), "bytes")
