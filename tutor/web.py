"""Put the reader's own notes on a built copy of the site.

    python3 tutor/web.py _site

Every .html page under the folder gets tutor/overlay.js added before </body>, as tutor/server.py
adds it, but with data-mode="web": no tutor, only notes the reader writes on a passage, kept in
their browser. The script and its styles are copied to <folder>/tutor/. The links are relative,
since the site is not published at the root of its address. A page has the same name here as
under the server, so a note written in one place can be matched to the page in the other.
"""
import shutil
import sys
from pathlib import Path

from server import page_key

HERE = Path(__file__).resolve().parent
INJECT = '<link rel="stylesheet" href="%stutor/overlay.css"><script src="%stutor/overlay.js" data-page="%s" data-mode="web" defer></script>\n'

site = Path(sys.argv[1]).resolve()
(site / "tutor").mkdir(exist_ok=True)
for name in ("overlay.js", "overlay.css"):
    shutil.copy(HERE / name, site / "tutor" / name)

done = 0
for file in sorted(site.rglob("*.html")):
    data = file.read_bytes()
    key = page_key(file, site)
    at = data.rfind(b"</body>")
    if not key or at < 0:
        continue
    up = "../" * (len(file.relative_to(site).parts) - 1)
    file.write_bytes(data[:at] + (INJECT % (up, up, key)).encode() + data[at:])
    done += 1
print(f"notes: {done} pages")
