"""Build showcase/index.html and showcase/img/*.jpg from the final renders and captions.py."""
import html, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
sys.path.insert(0, HERE)
import captions as C

SRC = os.path.join(ROOT, 'renders', sys.argv[1] if len(sys.argv) > 1 else 'final')
OUT = os.path.join(ROOT, 'showcase')
IMG = os.path.join(OUT, 'img')
os.makedirs(IMG, exist_ok=True)

ONES = ['', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ', 'Ζ', 'Η', 'Θ']
TENS = ['', 'Ι', 'Κ', 'Λ', 'Μ']


def numeral(n):
    return TENS[n // 10] + ONES[n % 10] + 'ʹ'


def jpeg(name):
    src = os.path.join(SRC, name + '.png')
    dst = os.path.join(IMG, name + '.jpg')
    if os.path.exists(src):
        im = Image.open(src).convert('RGB')
        im.save(dst, quality=84, optimize=True, progressive=True)
        return True
    return os.path.exists(dst)


# figures shown side by side (pairs) instead of full width
PAIRS = {('house3_board', 'town1_street'), ('granary', 'sundial_cape'), ('crown_inside', 'slope_post'),
         ('tholos_exterior', 'tholos_interior'), ('oracle', 'oracle_aerial'), ('library_interior', 'pebble_board'),
         ('courier_landing', 'ferry')}
PAIRED = {a for p in PAIRS for a in p}


def figures(items, start):
    out = []
    i = 0
    n = start
    while i < len(items):
        key, title, text = items[i]
        nxt = items[i + 1] if i + 1 < len(items) else None
        if nxt and (key, nxt[0]) in PAIRS:
            group = [items[i], nxt]; i += 2
        else:
            group = [items[i]]; i += 1
        cls = 'pair' if len(group) == 2 else 'single'
        cells = []
        for (k, t, x) in group:
            if not jpeg(k):
                continue
            cells.append(f'''      <figure class="fig" id="{k}">
        <button class="shot" type="button" data-full="img/{k}.jpg" data-title="{html.escape(t)}" data-num="{numeral(n)}" aria-label="Open {html.escape(t)} full size">
          <img src="img/{k}.jpg" alt="{html.escape(t)}: {html.escape(x)}" loading="lazy" width="1920" height="1080">
        </button>
        <figcaption><span class="num" lang="el">{numeral(n)}</span><span class="cap"><strong>{html.escape(t)}.</strong> {html.escape(x)}</span></figcaption>
      </figure>''')
            n += 1
        out.append(f'    <div class="row {cls}">\n' + '\n'.join(cells) + '\n    </div>')
    return '\n'.join(out), n


arche_html, n = figures(C.ARCHE, 1)
paxos_html, n = figures(C.PAXOS, n)
hero = 'arche_overview_golden'
jpeg(hero)

checks = json.load(open(os.path.join(ROOT, 'build', 'terrain', 'paxos', 'sites.json'))).get('checks', {})
arche_sites = json.load(open(os.path.join(ROOT, 'build', 'terrain', 'arche', 'sites.json')))
sl = arche_sites.get('sightlines', [])
houses_blocked = all(not r[3] for r in sl if r[0] == 'house')
camps_blocked = all(not r[3] for r in sl if r[0] == 'camp')
posts_blocked = all(not r[3] for r in sl if r[0] == 'post')


def tick(ok):
    return '<span class="ok">holds</span>' if ok else '<span class="bad">fails</span>'


page = open(os.path.join(HERE, 'showcase_template.html')).read()
page = page.replace('{{ARCHE}}', arche_html).replace('{{PAXOS}}', paxos_html)
page = page.replace('{{CHECK_HOUSES}}', tick(houses_blocked)).replace('{{CHECK_CAMPS}}', tick(camps_blocked)).replace('{{CHECK_POSTS}}', tick(posts_blocked))
page = page.replace('{{CHECK_BAY}}', tick(bool(checks.get('chamber_tholos_visible', [False])[0])))
page = page.replace('{{CHECK_FERRY}}', tick(not checks.get('crossings', [1])))
open(os.path.join(OUT, 'index.html'), 'w').write(page)
print('figures', n - 1, 'written', os.path.join(OUT, 'index.html'))
