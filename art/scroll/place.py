"""One-off: turn a setting page of the old format into the scroll look.

    python3 art/scroll/place.py places/<slug>/index.html

Reads the old page and overwrites it. The result is an ordinary hand-edited page that links
art/scroll/shell.css, place.css and shell.js; it is not rebuilt from anything afterwards.
"""
import re, sys, html
path = sys.argv[1]
t = open(path).read()
assert 'class="series-nav"' in t, "not an old-format setting page"
g = lambda rx, s=t: re.search(rx, s, re.S)
title = g(r'<title>(.*?)</title>').group(1)
crumb = g(r'<span class="nav-current">(.*?)</span>').group(1)
kicker = g(r'<div class="kicker">(.*?)</div>').group(1).replace('Distributed Algorithms of Ancient Greece · ', '')
h1 = g(r'<h1 class="display">(.*?)</h1>').group(1)
sub = g(r'<p class="sub">(.*?)</p>').group(1)
pub = g(r'<p class="pub">(.*?)</p>').group(1)
TEARS = ["M0 0h1200v8l-40 9-60-8-70 12-90-10-80 9-110-11-80 12-100-9-90 10-90-12-80 10-110-9-100 11z",
         "M0 0h1200v9l-50 10-80-9-60 11-100-10-90 8-90-11-90 12-100-10-80 8-110-9-100 12-80-10-70 8z",
         "M0 0h1200v8l-70 10-70-9-90 11-80-10-110 9-80-8-100 12-90-10-90 9-80-11-110 10-80-8z",
         "M0 0h1200v9l-60 9-80-8-70 10-100-9-90 11-80-10-110 9-100-8-80 10-90-9-90 11z"]
def photo(img, cls="fromright", tilt="tilt-r"):
    img = re.sub(r'\s+width="\d+"\s+height="\d+"', '', img)
    return f'<div class="pop {cls}"><div class="leaf"><div class="photo {tilt}" style="aspect-ratio:4/3">{img}</div></div></div>'
secs = re.findall(r'<section id="([a-z0-9]+)">(.*?)</section>', t, re.S)
out, first_img, n = [], None, 0
for sid, inner in secs:
    h2 = g(r'<h2>(.*?)</h2>', inner).group(1)
    inner = re.sub(r'<div class="issue">.*?</div>', '', inner, 1, re.S)
    imgs = re.findall(r'<figure class="panel">\s*(<img.*?>)\s*</figure>', inner, re.S)
    inner = re.sub(r'<figure class="panel">.*?</figure>', '', inner, flags=re.S)
    if first_img is None and imgs:
        first_img = imgs.pop(0)
    dark = n % 2 == 1
    tear = f'  <svg class="tear" viewBox="0 0 1200 26" preserveAspectRatio="none" style="--prev:{"#f6eed6" if dark else "#eae4d4"}"><path d="{TEARS[n % 4]}"/></svg>\n'
    name = html.unescape(re.sub(r'<.*?>', '', h2))
    head = f'<section class="spread {"dark" if dark else "light"}" id="{sid}" data-name="{html.escape(name, quote=True)}">\n{tear}  <div class="wrap">\n'
    if sid == 'books':
        cards, rest = [], []
        for p in re.findall(r'<p>(.*?)</p>', inner, re.S):
            m = re.match(r'\s*<a href="(\.\./\.\./books/([a-z0-9-]+)/index\.html)"><i>(.*?)</i></a>:\s*(.*?)\s*<span class="paper">(.*?)</span>\s*$', p, re.S)
            if not m: rest.append(f'<p>{p}</p>'); continue
            href, slug, name_, desc, credit = m.groups()
            desc = desc[0].upper() + desc[1:]
            cards.append(f'      <div class="pop"><div class="leaf paper card3 tall"><a class="cardlink" href="{href}">\n        <div class="photo"><img src="../../assets/img/covers/{slug}.jpg" alt="" loading="lazy"></div>\n        <div class="body"><h3>{name_}</h3><p>{" ".join(desc.split())}</p><span class="credit">{" ".join(credit.split())}</span></div>\n      </a></div></div>')
        body = f'    <h2>{h2}</h2>\n    <div class="cards3 books">\n' + '\n'.join(cards) + '\n    </div>\n' + (('    <div class="prosecol" style="margin-top:1.6rem">' + ''.join(rest) + '</div>\n') if rest else '')
    elif '<table' in inner:
        intro = ''.join(re.findall(r'<div class="prose">(.*?)</div>', inner, re.S)).strip()
        heads = re.findall(r'<th[^>]*>(.*?)</th>', inner, re.S)
        rows = re.findall(r'<tr>(<td.*?)</tr>', inner, re.S)
        body = f'    <h2>{h2}</h2>\n    <div class="prosecol">{intro}</div>\n'
        if len(heads) == 2:
            cells = [re.findall(r'<td[^>]*>(.*?)</td>', r, re.S) for r in rows]
            body += f'    <div class="map">\n      <div class="hd" style="text-align:right;padding-right:6px">{heads[0]}</div><div></div><div class="hd">{heads[1]}</div>\n' + \
                    ''.join(f'      <div class="l">{a.strip()}</div><div class="mid">⟷</div><div class="r">{b.strip()}</div>\n' for a, b in cells) + '    </div>\n'
        else:
            table = g(r'<table class="chron">.*?</table>', inner).group(0)
            body += f'    <div class="pop"><div class="leaf"><div class="paper well">\n{table}\n    </div></div></div>\n'
    else:
        text = re.sub(r'<div class="prose">', '<div class="prosecol">', inner).strip()
        text = f'<h2>{h2}</h2>\n    ' + text
        if imgs:
            body = f'    <div class="two read">\n      <div>\n    {text}\n      </div>\n      {photo(imgs[0])}\n    </div>\n'
            if len(imgs) > 1:
                body += '    <div class="photos">\n' + '\n'.join('      ' + photo(i, "", "tilt-l" if k % 2 == 0 else "tilt-r") for k, i in enumerate(imgs[1:])) + '\n    </div>\n'
        else:
            body = f'    {text}\n'
    out.append(head + body + '  </div>\n</section>\n')
    n += 1
cover_img = re.sub(r'\s+width="\d+"\s+height="\d+"', '', first_img).replace(' loading="lazy"', '')
page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="icon" type="image/svg+xml" href="../../assets/img/favicon.svg">
<link rel="stylesheet" href="../../art/scroll/shell.css">
<link rel="stylesheet" href="../../art/scroll/place.css">
</head>
<body>

<div class="bar">
  <a href="../../index.html">← The Books</a>
  <span class="now" id="now"></span>
  <i id="prog"></i>
</div>

<header class="spread dark place" id="cover" data-name="{html.escape(crumb, quote=True)}">
  <div class="wrap grid">
    <div>
      <div class="kicker">{kicker}</div>
      <h1>{h1}</h1>
      <p class="hook">{sub}</p>
      <p class="pub">{pub}</p>
      <div class="scrollcue"><b>↓</b> Scroll. Things unfold.</div>
    </div>
    <div class="pop" data-auto>
      <div class="leaf">
        <div class="photo tilt-r" data-depth="14">{cover_img}</div>
        <div class="fold-shadow"></div>
      </div>
    </div>
  </div>
</header>

{chr(10).join(out)}<footer>Distributed Algorithms of Ancient Greece · {crumb}</footer>

<script src="../../art/scroll/shell.js"></script>
<script>
/* who is who: light a pair when either side is pointed at */
document.querySelectorAll(".map").forEach(m=>{{const c=[...m.children].slice(3);for(let i=0;i<c.length;i+=3){{const l=c[i],r=c[i+2];
  [l,c[i+1],r].forEach(x=>{{x.addEventListener("mouseenter",()=>{{l.classList.add("hi");r.classList.add("hi")}});x.addEventListener("mouseleave",()=>{{l.classList.remove("hi");r.classList.remove("hi")}});x.addEventListener("click",()=>{{l.classList.toggle("hi");r.classList.toggle("hi")}})}})}}}});
</script>
</body>
</html>
'''
open(path, 'w').write(page)
print("wrote", path, len(page))
