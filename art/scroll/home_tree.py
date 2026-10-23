"""Copy the family tree of Eighteen Books in One Scroll onto the home page, as the computing
counterpart of the chart.

The one-scroll page draws the tree in its script.js (the books' places, the arcs between them);
this opens that page in headless Chrome, takes the drawn <svg id="tree">, and writes a static copy
into index.html between  <!-- family:start -->  and  <!-- family:end --> : the computing names
only, no animation, each node a link to its book from the site's root.
Run from the repo root after changing the tree:  python3 art/scroll/home_tree.py
"""
import pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / "books/eighteen-books-in-one-scroll/index.html"
HOME = ROOT / "index.html"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LABEL = ("The eighteen books as one family tree: logical clocks at the centre, and each paper joined "
         "by a red arc to the one it grows from by changing one assumption or one demand")

with tempfile.TemporaryDirectory() as profile:
    dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}",
                          "--window-size=1200,900", "--virtual-time-budget=5000", "--dump-dom", PAGE.as_uri()],
                         capture_output=True, text=True, check=True).stdout
m = re.search(r'<svg id="tree".*?</svg>', dom, re.S)
if not m or "tnode" not in m.group(0):
    sys.exit("the one-scroll page drew no tree")
svg = m.group(0)
svg = re.sub(r'<text[^>]*class="i"[^>]*>.*?</text>', "", svg)                  # allegory names
svg = svg.replace(' class="m"', "")
svg = re.sub(r'\s(style|data-mode|aria-label|id)="[^"]*"', "", svg)             # animation state, the page's own id
svg = re.sub(r'href="\.\./([^"/]+)/index\.html"', r'href="books/\1/index.html"', svg)
svg = svg.replace("<svg ", f'<svg class="family" aria-label="{LABEL}" ', 1)
# the names on the left run out past the tree's own frame; widen it so a narrow screen keeps them
svg = re.sub(r'viewBox="[^"]*"', 'viewBox="-375 -292 708 584"', svg, count=1)
svg = re.sub(r"(\d+\.\d)\d+", r"\1", svg)                                       # one decimal is plenty
svg = re.sub(r"(<a |<path |<circle |<g>)", r"\n\1", svg)                        # a line per element

home = HOME.read_text()
new, n = re.subn(r"(<!-- family:start -->\n).*?(<!-- family:end -->)", lambda k: k.group(1) + svg + "\n" + k.group(2), home, flags=re.S)
if n != 1:
    sys.exit("index.html has no  <!-- family:start --> … <!-- family:end -->  block")
HOME.write_text(new)
books, arcs = svg.count('class="tnode'), svg.count('class="tedge')
print(f"family tree -> {HOME.relative_to(ROOT)}: {books} books, {arcs} arcs")
