#!/usr/bin/env python3
"""Generate layouts.html — the three-island scheme.

Explores the proposal: the mercantile centre and Mount Phyle become ONE island ringed by
low islets (the foundations); Paxos and Antipaxos are separate islands with opposite
consensus attitudes; the remaining papers scatter or take ground of their own.

Geometry in world metres, +y north, inside g#map[transform=scale(1,-1)] — the
islandgen-svg/1 convention of content-i1/map.svg.
"""
import math, random, os

import pathlib
OUT = str(pathlib.Path(__file__).with_name("layouts.html"))
HILL_D = 1800.0
REAR_KM = 130

C = {"f": "#5b4a86", "p": "#1f5f86", "a": "#2f6f45", "c": "#a8391c"}
CN = {"f": "Arche &mdash; the foundations", "p": "Paxos", "a": "Antipaxos",
      "c": "the council ground"}


class Isle:
    def __init__(self, key, name, cx, cy, R, seed, elong=1.0, rot=0.0, rough=1.0,
                 peak=None, contours=(0.6, 0.32), lagoon=None, kind="island", label=None):
        self.key, self.name = key, name
        self.cx, self.cy, self.R = cx, cy, R
        self.elong, self.rot, self.kind = elong, math.radians(rot), kind
        self.contours, self.lagoon = contours, lagoon
        rng = random.Random(seed)
        self.harm = [(k, rng.uniform(0.04, 0.16) * rough / (k * 0.55),
                      rng.uniform(0, 2 * math.pi)) for k in range(2, 8)]
        self.pts = [self._pt(2 * math.pi * i / 240) for i in range(240)]
        self.peak = self.at(*peak) if peak else (cx, cy)
        self.label_at = self.at(*label) if label else (cx, cy)

    def _pt(self, t):
        r = self.R * (1 + sum(a * math.sin(k * t + p) for k, a, p in self.harm))
        x, y = r * math.cos(t) * self.elong, r * math.sin(t)
        c, s = math.cos(self.rot), math.sin(self.rot)
        return (self.cx + x * c - y * s, self.cy + x * s + y * c)

    def at(self, bearing_deg, frac):
        b = math.radians(bearing_deg % 360)
        best, bd = self.pts[0], 9e9
        for p in self.pts:
            pb = math.atan2(p[0] - self.cx, p[1] - self.cy) % (2 * math.pi)
            d = min(abs(pb - b), 2 * math.pi - abs(pb - b))
            if d < bd:
                bd, best = d, p
        return (self.cx + (best[0] - self.cx) * frac, self.cy + (best[1] - self.cy) * frac)

    def coast_dist(self, pt):
        return min(math.dist(pt, p) for p in self.pts)

    def shrunk(self, s):
        px, py = self.peak
        return [(px + (x - px) * s, py + (y - py) * s) for x, y in self.pts]


def path(pts):
    return "M " + " L ".join(f"{x:.0f} {y:.0f}" for x, y in pts) + " Z"


def islets(spec):
    """Low bare rock. They must stay low — see the note on Mount Phyle's sightlines."""
    out = {}
    for k, x, y, r, sd in spec:
        out[k] = Isle(k, "", x, y, r, sd, 1.3, sd % 90, rough=0.8,
                      contours=(), kind="islet")
    return out


# --------------------------------------------------------------- the ground ---
# id, island-key, short label, full name, papers, what it carries
GROUNDS = [
 ("f-harbour", "f", "Harbour", "The harbour and the trading houses",
  "Lamport 1978; Fidge 1988; Mattern 1988; Chandy &amp; Lamport 1985",
  "Tallies inked on purchase slips; an array per house tracking what it has seen from every other; and the census pennants that go down each lane to count the market without stopping it."),
 ("f-court", "f", "Court", "The auditor's court",
  "Herlihy &amp; Wing 1990",
  "The imperial auditor holds that if one trade cleared before another was placed, no trader may ever be shown the second without the first."),
 ("f-channel", "f", "Channel", "The storm channel",
  "Brewer 2000; Gilbert &amp; Lynch 2002",
  "The water between the island and its outports. When it closes, an outport either answers from a stale book or refuses to answer. There is no third choice, and the proof is a fact about this channel."),
 ("f-road", "f", "Closed road", "The closed road",
  "&mdash; <span class='m'>(no paper; a structural ground)</span>",
  "The inland road from the town to the hill, now held by the soldiers. It is why the bandits in the market cannot reach their own council, and why nothing they do becomes a plot."),
 ("f-hill", "f", "Mount Phyle", "Mount Phyle &mdash; the camps and the crown",
  "FLP 1985; Chandra &amp; Toueg 1996 <span class='m'>(camps)</span> · Byzantine Generals 1982; Reaching Agreement 1980 <span class='m'>(crown)</span>",
  "<b>Built and measured in <code>content-i2</code>.</b> Four camps that cannot see each other, ravens, uncounted nights; and above them a walled crown where the council keeps klepsydra rounds face to face."),
 ("f-ridge", "f", "&mdash;", "The beacon ridge, in the rear",
  "Dwork, Lynch &amp; Stockmeyer 1988",
  "Over the horizon from the crown &mdash; <b>off every map</b>, at roughly 130&nbsp;km. Its own people, its own diorama."),

 ("p-rotunda", "p", "Rotunda", "The Rotunda",
  "Lamport 1998; Lamport 2001",
  "Circular and domed. No head of the room and no dais, so every seat is the same seat and any legislator may call a ballot &mdash; and the dome gathers sound and returns it, so two proposers raised at once become one unintelligible wash. <b>The room is safe and not live.</b>"),
 ("p-odeon", "p", "Odeon", "The Odeon",
  "Oki &amp; Liskov 1988; Liskov &amp; Cowling 2012; Ongaro &amp; Ousterhout 2014",
  "Roofed, raked and aimed at one stage, built so that a single voice reaches every seat. The speaker is distinguished by the architecture rather than by agreement; when he falls silent the performance stops until another takes the stage, under a new and higher number."),
 ("p-acropolis", "p", "Acropolis", "The acropolis",
  "Castro &amp; Liskov 1999",
  "The Archon himself may lie. Three rounds of heralds — pre-prepare, prepare, commit — needing 2f + 1 matches in an assembly of 3f + 1."),
 ("p-quarry", "p", "Quarry", "The stepped quarry",
  "Chandra, Griesemer &amp; Redstone 2007",
  "What the plans never mentioned: parchment runs out, tablets crumble unread, and leases must be granted without message delay halting government."),
 ("p-counting", "p", "Counting house", "The abandoned counting house",
  "Gray 1996",
  "A lazy scheme that split decrees across independent regional councils, and whose deadlocks grew as the cube of the number of them. It stands empty; it is the assembly's reason to exist."),

 ("a-agora", "a", "Agora", "The agora",
  "Demers et al. 1987; Saito &amp; Shapiro 2005",
  "No assembly convenes. Sailors pass news port to port and lose interest once most have heard, and pairs of clerks compare whole ledgers at the fair."),
 ("a-ring", "a", "Port ring", "The ring of warehouses",
  "DeCandia et al. 2007; Bailis et al. 2012",
  "Goods held around a ring by their marks; a flooded harbour's stock kept by its neighbour with a note to return it — and the open question of how often a reader gets a stale count."),
 ("a-beach", "a", "Wax beach", "The wax beach",
  "Terry et al. 1995",
  "Decrees written on wax, valid at once at home and provisional everywhere else, each carrying its own check and fallback, rolled back and redone when an earlier one arrives."),
 ("a-terraces", "a", "Far terraces", "The far terraces",
  "Shapiro et al. 2011 (both papers)",
  "Ledgers that cannot quarrel: merge is associative, commutative and idempotent, so no reconciliation is ever needed. Sited as far from any assembly as the island goes."),
 ("a-mail", "a", "Mail harbour", "The mail harbour",
  "Lloyd et al. 2011; Bailis et al. 2014",
  "No island reveals a reply before the letter it answers; and what a desk can still promise a customer while the couriers are stopped."),

 ("c-ground", "c", "Council ground", "The council ground",
  "Hellerstein 2010; Ameloot et al. 2011; Hellerstein &amp; Alvaro 2020",
  "The only ground that adjudicates between the two islands: which decrees are monotonic and need no assembly at all, and which rest on absence and therefore do."),
]
GK = {g[0]: g for g in GROUNDS}


# ------------------------------------------------------------------ layouts ---

def lay_close_pair():
    I = {}
    I["arche"] = Isle("arche", "Arche", -21000, 1500, 11500, 7011, 1.32, -18,
                      rough=1.0, peak=(320, 0.68), contours=(0.44, 0.27, 0.13),
                      label=(332, 0.55))
    I.update(islets([("i1", -4200, 9200, 620, 71), ("i2", -1500, 3600, 780, 73),
                     ("i3", -3000, -3800, 560, 79), ("i4", -7600, -9600, 700, 83),
                     ("i5", -15000, -12600, 520, 89), ("i6", -8000, 12800, 480, 97)]))
    I["paxos"] = Isle("paxos", "Paxos", 19500, 8200, 4800, 7021, 1.5, -35,
                      peak=(140, 0.4), contours=(0.55, 0.28), label=(330, 0.5))
    I["anti"] = Isle("anti", "Antipaxos", 27200, -7400, 4200, 7031, 1.45, 25,
                     rough=0.85, contours=(0.48,), lagoon=(29200, -9000, 880),
                     label=(150, 0.55))
    I["council"] = Isle("council", "Mesonisi", 23400, 300, 1000, 7041, 1.25, 15,
                        contours=(), kind="islet", label=(180, 3.2))
    A, P, N = I["arche"], I["paxos"], I["anti"]
    hill = (-19500, 2200)
    G = {"f-harbour": A.at(100, 0.92), "f-court": A.at(128, 0.86),
         "f-channel": (-8200, 800), "f-road": A.at(112, 0.52),
         "f-hill": hill,
         "p-rotunda": P.at(210, 0.84), "p-odeon": P.at(246, 0.70),
         "p-acropolis": P.at(75, 0.84),
         "p-quarry": P.at(160, 0.9), "p-counting": P.at(335, 0.88),
         "a-agora": N.at(300, 0.82), "a-ring": (29200, -9000),
         "a-beach": N.at(230, 0.9), "a-terraces": N.at(80, 0.88),
         "a-mail": N.at(160, 0.88),
         "c-ground": (23400, 300)}
    routes = [(A.at(100, .92), (-1500, 3600)), (A.at(112, .9), (-3000, -3800)),
              (A.at(80, .9), (-4200, 9200)), (A.at(140, .9), (-7600, -9600)),
              ((-1500, 3600), P.at(215, .86)), ((-3000, -3800), N.at(310, .82)),
              (P.at(150, .85), (23400, 300)), ((23400, 300), N.at(330, .85))]
    return dict(isles=I, grounds=G, routes=routes, hill=hill,
                water=[((-7000, -16000), "the Outer Sea", 0)],
                straits=[((-9600, 4200), (-9600, -7000), "")],
                narrows=[((22200, 4200), (25600, -3400))],
                extent=(-37000, -20000, 78000, 40000))


def lay_council_isle():
    I = {}
    I["arche"] = Isle("arche", "Arche", -20000, 6000, 11000, 8011, 1.3, 25,
                      rough=1.0, peak=(300, 0.68), contours=(0.44, 0.27, 0.13),
                      label=(300, 0.55))
    I.update(islets([("i1", -2800, 12600, 620, 171), ("i2", -1200, 5200, 760, 173),
                     ("i3", -4600, -1600, 560, 179), ("i4", -11000, -6800, 700, 183),
                     ("i5", -19000, -9200, 520, 189), ("i6", -6000, 16200, 480, 197)]))
    I["paxos"] = Isle("paxos", "Paxos", 24000, 11000, 5000, 8021, 1.5, -40,
                      peak=(150, 0.4), contours=(0.55, 0.28), label=(320, 0.5))
    I["anti"] = Isle("anti", "Antipaxos", 26000, -11000, 4400, 8031, 1.45, 30,
                     rough=0.85, contours=(0.48,), lagoon=(28400, -12800, 900),
                     label=(140, 0.55))
    I["council"] = Isle("council", "Boule", 20000, -500, 2100, 8041, 1.3, 10,
                        peak=(0, 0.4), contours=(0.5,), label=(340, 2.1))
    A, P, N = I["arche"], I["paxos"], I["anti"]
    hill = (-21500, 7200)
    G = {"f-harbour": A.at(120, 0.92), "f-court": A.at(148, 0.86),
         "f-channel": (-7600, 4200), "f-road": A.at(130, 0.52),
         "f-hill": hill,
         "p-rotunda": P.at(200, 0.84), "p-odeon": P.at(236, 0.70),
         "p-acropolis": P.at(85, 0.84),
         "p-quarry": P.at(155, 0.9), "p-counting": P.at(15, 0.88),
         "a-agora": N.at(305, 0.82), "a-ring": (28400, -12800),
         "a-beach": N.at(225, 0.9), "a-terraces": N.at(75, 0.88),
         "a-mail": N.at(155, 0.88),
         "c-ground": I["council"].at(300, 0.45)}
    routes = [(A.at(120, .92), (-1200, 5200)), (A.at(140, .9), (-4600, -1600)),
              (A.at(95, .9), (-2800, 12600)), (A.at(160, .9), (-11000, -6800)),
              ((-1200, 5200), P.at(205, .86)), ((-4600, -1600), I["council"].at(280, .8)),
              (P.at(190, .85), I["council"].at(10, .8)),
              (I["council"].at(175, .8), N.at(335, .85))]
    return dict(isles=I, grounds=G, routes=routes, hill=hill,
                water=[((-4000, -17000), "the Outer Sea", 0)],
                straits=[((-9200, 9000), (-9200, -2400), "")],
                narrows=[],
                extent=(-38000, -22000, 80000, 44000))


def lay_foundations_between():
    I = {}
    I["arche"] = Isle("arche", "Arche", 0, 1000, 11000, 9011, 1.28, 8,
                      rough=1.0, peak=(0, 0.68), contours=(0.44, 0.27, 0.13),
                      label=(200, 0.55))
    I.update(islets([("i1", 14800, 9200, 620, 271), ("i2", 15600, 1200, 760, 273),
                     ("i3", 13200, -7600, 560, 279), ("i4", -14600, -7200, 700, 283),
                     ("i5", -16200, 4200, 520, 289), ("i6", -9000, 14800, 480, 297)]))
    I["paxos"] = Isle("paxos", "Paxos", 30500, 3000, 5000, 9021, 1.5, -30,
                      peak=(150, 0.4), contours=(0.55, 0.28), label=(330, 0.5))
    I["anti"] = Isle("anti", "Antipaxos", -30500, -2500, 4400, 9031, 1.45, 35,
                     rough=0.85, contours=(0.48,), lagoon=(-32600, -4400, 900),
                     label=(120, 0.55))
    I["council"] = Isle("council", "Mesonisi", 1200, -12600, 900, 9041, 1.25, 15,
                        contours=(), kind="islet", label=(180, 3.0))
    A, P, N = I["arche"], I["paxos"], I["anti"]
    hill = (-1800, 2600)
    G = {"f-harbour": A.at(165, 0.92), "f-court": A.at(196, 0.86),
         "f-channel": (12000, 1100), "f-road": A.at(150, 0.5),
         "f-hill": hill,
         "p-rotunda": P.at(226, 0.84), "p-odeon": P.at(262, 0.70),
         "p-acropolis": P.at(100, 0.84),
         "p-quarry": P.at(170, 0.9), "p-counting": P.at(30, 0.88),
         "a-agora": N.at(60, 0.82), "a-ring": (-32600, -4400),
         "a-beach": N.at(120, 0.9), "a-terraces": N.at(270, 0.88),
         "a-mail": N.at(175, 0.88),
         "c-ground": (1200, -12600)}
    routes = [(A.at(90, .92), (15600, 1200)), (A.at(60, .9), (14800, 9200)),
              (A.at(130, .9), (13200, -7600)), (A.at(250, .9), (-14600, -7200)),
              (A.at(280, .9), (-16200, 4200)),
              ((15600, 1200), P.at(230, .86)), ((-16200, 4200), N.at(60, .82)),
              (A.at(175, .9), (1200, -12600)), ((1200, -12600), N.at(130, .85)),
              ((1200, -12600), P.at(215, .85))]
    return dict(isles=I, grounds=G, routes=routes, hill=hill,
                water=[((0, -18000), "the Outer Sea", 0)],
                straits=[((10400, 7200), (10400, -6200), "")],
                narrows=[],
                extent=(-44000, -22000, 90000, 42000))


# ---------------------------------------------------------------------- svg ---

def render_map(L, uid):
    x0, y0, w, h = L["extent"]
    o = [f'<svg class="map" viewBox="{x0} {-(y0+h)} {w} {h}" '
         f'xmlns="http://www.w3.org/2000/svg" data-units="m" data-metres-per-unit="1" role="img">']
    o.append(f'<defs><radialGradient id="sea{uid}" cx="42%" cy="38%" r="78%">'
             f'<stop offset="0" stop-color="#20718f"/><stop offset="1" stop-color="#103d5a"/>'
             f'</radialGradient></defs>')
    o.append(f'<rect x="{x0}" y="{-(y0+h)}" width="{w}" height="{h}" fill="url(#sea{uid})"/>')
    g = ['<g id="map" transform="scale(1,-1)">']
    for a, b in L["routes"]:
        g.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" '
                 f'stroke="#cfe9f2" stroke-width="95" stroke-dasharray="720 540" opacity=".4"/>')
    for k, isle in L["isles"].items():
        d = path(isle.pts)
        g.append(f'<path d="{d}" fill="none" stroke="#5ec9d4" stroke-width="1000" opacity=".45"/>')
        g.append(f'<path d="{d}" fill="none" stroke="#95e3e0" stroke-width="480" opacity=".45"/>')
        fill = "#cfc79c" if isle.kind == "islet" else "#cbc496"
        g.append(f'<path class="coast" data-island="{k}" d="{d}" fill="{fill}" '
                 f'stroke="#6f6440" stroke-width="70"/>')
        for i, s in enumerate(isle.contours):
            g.append(f'<path class="contour" data-z="{100*(i+1)}" d="{path(isle.shrunk(s))}" '
                     f'fill="#b6aa76" fill-opacity=".5" stroke="#8a7d4e" stroke-width="45"/>')
        if isle.lagoon:
            lx, ly, lr = isle.lagoon
            g.append(f'<circle class="lagoon" cx="{lx:.0f}" cy="{ly:.0f}" r="{lr:.0f}" '
                     f'fill="#2f97b5" stroke="#66d0d8" stroke-width="110"/>')
    for a, b, _ in L.get("straits", []):
        g.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#ffd9a0" '
                 f'stroke-width="150" stroke-dasharray="520 400" opacity=".8"/>')
    for a, b in L.get("narrows", []):
        g.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#ffd9a0" '
                 f'stroke-width="150" stroke-dasharray="520 400" opacity=".8"/>')
    hx, hy = L["hill"]
    g.append(f'<circle cx="{hx:.0f}" cy="{hy:.0f}" r="{HILL_D/2:.0f}" fill="{C["f"]}" '
             f'fill-opacity=".9" stroke="#cbb6f0" stroke-width="130"/>')
    for i in range(8):
        a = math.radians(i * 45 + 22)
        g.append(f'<line x1="{hx:.0f}" y1="{hy:.0f}" x2="{hx+math.sin(a)*HILL_D/2:.0f}" '
                 f'y2="{hy+math.cos(a)*HILL_D/2:.0f}" stroke="#e8dcff" stroke-width="70"/>')
    for gid, (px, py) in L["grounds"].items():
        if gid in ("f-hill", "f-ridge"):
            continue
        col = C[GK[gid][1]]
        g.append(f'<circle class="ground" id="{gid}" cx="{px:.0f}" cy="{py:.0f}" r="340" '
                 f'fill="#fff6e6" stroke="{col}" stroke-width="195"/>')
    g.append('</g>')
    o += g

    lab = ['<g id="labels" font-family="Georgia,serif">']
    for k, isle in L["isles"].items():
        if not isle.name:
            continue
        lx, ly = isle.label_at
        sz = 1200 if isle.kind != "islet" else 700
        lab.append(f'<text x="{lx:.0f}" y="{-ly:.0f}" font-size="{sz}" fill="#3d2f16" '
                   f'text-anchor="middle" opacity=".5" letter-spacing="{sz*.14:.0f}" '
                   f'stroke="#e8dec4" stroke-width="210" paint-order="stroke">{isle.name}</text>')
    for (wx, wy), txt, _ in L["water"]:
        lab.append(f'<text x="{wx}" y="{-wy}" font-size="950" fill="#e2f3f8" '
                   f'text-anchor="middle" opacity=".6" font-style="italic">{txt}</text>')
    for gid, (px, py) in L["grounds"].items():
        col = C[GK[gid][1]]
        txt = GK[gid][2]
        dy = -1200 if gid == "f-hill" else 950
        lab.append(f'<text x="{px:.0f}" y="{-py+dy:.0f}" font-size="760" fill="{col}" '
                   f'text-anchor="middle" font-weight="bold" stroke="#fff6e6" stroke-width="240" '
                   f'paint-order="stroke">{txt}</text>')
    ax, ay = x0 + w * 0.035, -(y0) - h * 0.185
    lab.append(f'<g><path d="M {ax+2800} {ay-480} L {ax} {ay} L {ax+2800} {ay+480} Z" '
               f'fill="{C["f"]}"/><line x1="{ax}" y1="{ay}" x2="{ax+8600}" y2="{ay}" '
               f'stroke="{C["f"]}" stroke-width="185" stroke-dasharray="620 440"/>'
               f'<text x="{ax+800}" y="{ay-1150}" font-size="820" fill="#e8dcff" '
               f'font-weight="bold">{REAR_KM} km &#8594; the beacon ridge</text></g>')
    bx, by = x0 + w * .035, -(y0) - h * .055
    lab.append(f'<g><rect x="{bx}" y="{by}" width="10000" height="240" fill="#eaf6fa"/>'
               f'<rect x="{bx}" y="{by}" width="5000" height="240" fill="#12374f"/>'
               f'<text x="{bx+10000}" y="{by-400}" font-size="780" fill="#eaf6fa" '
               f'text-anchor="middle">10 km</text></g>')
    nx, ny = x0 + w * .962, -(y0 + h) + h * .085
    lab.append(f'<g><path d="M {nx} {ny-2200} L {nx-760} {ny} L {nx} {ny-590} L {nx+760} {ny} Z" '
               f'fill="#eaf6fa" opacity=".85"/><text x="{nx}" y="{ny+1050}" font-size="840" '
               f'fill="#eaf6fa" text-anchor="middle">N</text></g>')
    lab.append('</g></svg>')
    o += lab
    return "\n".join(o)


LAYOUTS = [
 dict(id="pair", name="A &mdash; The Close Pair", axis="Paxos and Antipaxos adjacent",
      build=lay_close_pair,
      sub="Arche and its outports to the west; Paxos and Antipaxos five kilometres apart in the east, with the council ground on an islet in the water between them.",
      thesis="The two attitudes are neighbours, as the real islands are, and the strait between them is narrow enough that each can see the other getting on without it. The council ground sits in that water because the question it asks &mdash; which decrees need an assembly &mdash; belongs to neither island.",
      pros=["<b>The pun does real work.</b> Paxos and Antipaxos within sight of each other makes the opposition legible before a page is read, and CALM adjudicating from the water between them is the paper's actual position.",
            "Arche is far enough west that the foundations read as a separate region rather than as a third competitor.",
            "The outports sit in one loose arc off Arche's east coast, so the storm channel is a single body of water and CAP has one place, not several.",
            "Short crossings between Paxos and Antipaxos make the ferry traffic plausible: the two islands genuinely trade, which is what makes their disagreement matter."],
      cons=["Two islands this close will tend to share a horizon in every panel, and the books are supposed to be about places that <i>cannot</i> coordinate cheaply.",
            "Antipaxos's far terraces end up pointing back toward Paxos rather than away, so the distance argument for the CRDT books is weakened.",
            "Arche is doing a great deal: a harbour, a court, a channel, a closed road and a besieged mountain. It will need the most regional dioramas of any island here.",
            "The council islet is small enough that it may not sustain its own diorama at all."]),
 dict(id="isle", name="B &mdash; The Council Isle", axis="The adjudicator gets its own island",
      build=lay_council_isle,
      sub="Paxos to the northeast, Antipaxos to the southeast, and a real island between them &mdash; Boule &mdash; holding the council ground.",
      thesis="If CALM decides which of the two attitudes applies to a given decree, it should stand on ground that belongs to neither and is big enough to be somewhere. Boule is a place delegates sail to, not a rock they pass.",
      pros=["<b>The council ground becomes a site rather than a marker.</b> It can carry a chamber, a road up from a landing, and its own dioramas.",
            "Paxos and Antipaxos are far enough apart that neither appears in the other's panels, which is truer to two cultures that genuinely do not coordinate.",
            "Boule sitting on the route between them makes every crossing pass the question, which is the right emphasis for the one paper that adjudicates.",
            "Antipaxos's far terraces now point into open sea, so the CRDT books get the distance their argument needs."],
      cons=["A fourth island for two papers is expensive. It is the least economical use of land on this page.",
            "Boule risks reading as a capital &mdash; a seat of authority over both islands &mdash; which is precisely what CALM is not. It decides a question; it does not rule.",
            "The wider spread pushes the whole map to 80&nbsp;km, so Arche and its outports drift to one corner.",
            "With Paxos and Antipaxos out of sight of each other, the pun stops operating visually and survives only in the names."]),
 dict(id="between", name="C &mdash; The Foundations Between", axis="Both attitudes look back at the same theory",
      build=lay_foundations_between,
      sub="Arche in the middle with its outports on both sides; Paxos to the east, Antipaxos to the west; the council ground on an islet off Arche's southern shore.",
      thesis="Neither consensus culture invented its own foundations. Putting Arche between them makes the theory the thing they share and must both sail through &mdash; and puts Mount Phyle, where the limits are proved, at the centre of the world rather than at its edge.",
      pros=["<b>The strongest statement of what the foundations are for.</b> Every route between the two attitudes passes the island where the impossibility results were proved.",
            "Paxos and Antipaxos are maximally separated &mdash; <b>54&nbsp;km</b> Rotunda to agora, against 13&nbsp;km in A &mdash; so the far terraces face genuinely open water and nothing coordinates cheaply.",
            "Arche's outports split into two groups, east and west, which gives the storm channel two throats and the CAP book a choice of which to close.",
            "Mount Phyle at the centre reads correctly: it is not a sideshow, it is the ground the other two islands cannot argue their way around."],
      cons=["A central island is a hub, and hubs imply traffic and authority. Arche holds the papers <i>least</i> concerned with either.",
            "The besieged mountain sits in the middle of the busiest water in the world, which strains the siege's isolation more than any other arrangement here.",
            "The outports on two sides doubles the coastline Arche must supply and halves the coherence of the storm channel.",
            "At 90&nbsp;km this is the widest map on the page, and the two attitude islands are small at that scale."]),
]

CSS = """
:root{--ink:#2b2117;--mut:#6d6150;--line:#d9cfba;--bg:#f6f1e6;--card:#fffdf8;
--f:#5b4a86;--p:#1f5f86;--a:#2f6f45;--c:#a8391c;--ok:#2f6f45;--bad:#93301f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Georgia,"Iowan Old Style",serif}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 90px}
h1{font-size:2.5rem;line-height:1.15;margin:0 0 .3em}
h2{font-size:1.75rem;margin:0 0 .15em}
h3{font:600 .82rem/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
color:var(--mut);margin:1.8em 0 .6em}
p{margin:0 0 1em;max-width:78ch}
code{font:.88em ui-monospace,Menlo,monospace;background:#efe8d8;padding:.1em .35em;border-radius:3px}
.lede{font-size:1.12rem;color:#4a3f31;max-width:74ch}
.m{color:var(--mut);font-style:italic}
.rule{height:1px;background:var(--line);margin:48px 0}
.note{background:var(--card);border:1px solid var(--line);border-left:4px solid #b8763a;
padding:18px 22px;margin:0 0 28px;border-radius:4px}
.note h4{margin:0 0 .5em;font:600 .78rem/1.4 system-ui,sans-serif;letter-spacing:.08em;
text-transform:uppercase;color:#8a5a10}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
@media(max-width:900px){.grid2{grid-template-columns:1fr}}
table{border-collapse:collapse;width:100%;font-size:.9rem;margin:0 0 10px}
th,td{text-align:left;vertical-align:top;padding:9px 12px;border-bottom:1px solid var(--line)}
th{font:600 .72rem/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
color:var(--mut);border-bottom:2px solid #bfb49b}
tbody tr:hover{background:#fdf8ec}
.tag{display:inline-block;padding:3px 9px;border-radius:99px;color:#fff;
font:700 .66rem/1.5 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.tf{background:var(--f)}.tp{background:var(--p)}.ta{background:var(--a)}.tc{background:var(--c)}
.layout{background:var(--card);border:1px solid var(--line);border-radius:8px;
padding:26px 28px 30px;margin:0 0 42px}
.layout header{display:flex;justify-content:space-between;align-items:baseline;gap:18px;flex-wrap:wrap}
.axis{font:600 .72rem/1 system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;
background:#eee5d2;color:#7a6647;padding:6px 10px;border-radius:99px}
svg.map{width:100%;height:auto;display:block;border-radius:6px;margin:18px 0 6px;
border:1px solid #9fb6c0;background:#103d5a}
.cap{font-size:.8rem;color:var(--mut);margin:0 0 22px}
ul{margin:0 0 1em;padding-left:1.15em}li{margin:0 0 .45em}
.pro li::marker{color:var(--ok)}.con li::marker{color:var(--bad)}
.verdict h5{font:600 .72rem/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
margin:0 0 .7em;color:var(--mut)}
details{margin:6px 0 0;border-top:1px solid var(--line);padding-top:14px}
summary{cursor:pointer;font:600 .8rem/1 system-ui,sans-serif;letter-spacing:.05em;
text-transform:uppercase;color:#8a4a1e;padding:6px 0}
.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:.84rem;color:var(--mut);margin:0 0 6px}
.legend span{display:flex;align-items:center;gap:7px}
.sw{width:14px;height:14px;border-radius:3px;display:inline-block}
.ok{color:var(--ok);font-weight:700}.bad{color:var(--bad);font-weight:700}
blockquote{margin:1em 0;padding:2px 0 2px 18px;border-left:3px solid var(--line);color:#4a3f31}
"""


def build():
    P = []
    A = P.append
    A("<!doctype html><html lang='en'><head><meta charset='utf-8'>")
    A("<meta name='viewport' content='width=device-width,initial-scale=1'>")
    A("<title>Three Islands</title>")
    A(f"<style>{CSS}</style></head><body><div class='wrap'>")
    A("<h1>Three islands<br><span class='m' style='font-size:1.6rem;font-style:normal'>"
      "The archipelago and its grounds</span></h1>")
    A("<p class='lede'>Three islands, following the proposal: "
      "<b>the mercantile centre and Mount Phyle become one island</b> ringed by low islets and "
      "serving as the foundational background; <b>Paxos and Antipaxos are separate islands with "
      "opposite consensus attitudes</b>; and the remaining papers scatter or take ground of "
      "their own.</p>")

    A("<div class='note' style='border-left-color:#5b4a86'>"
      "<h4>What this scheme changes, and why it is an improvement</h4>"
      "<p>The four worlds of <code>settings.md</code> were grouped by <i>subject</i>. This "
      "groups by <b>attitude to coordination</b>, which is a sharper line and one the corpus "
      "already falls along:</p>"
      "<ul style='margin-bottom:.8em'>"
      "<li><b>Arche</b> &mdash; the papers everything else cites. Ordering, correctness "
      "conditions, and the three impossibility results. Nobody here is building a system; they "
      "are establishing what can be built.</li>"
      "<li><b>Paxos</b> &mdash; coordinate everything. One chronicle, quorums, an Archon, and "
      "the cost of keeping it true when the Archon lies.</li>"
      "<li><b>Antipaxos</b> &mdash; coordinate nothing. Gossip, rings, wax, and ledgers that "
      "cannot quarrel. No assembly ever convenes.</li>"
      "<li><b>The council ground</b> &mdash; the one paper that decides which island is right "
      "about a given decree.</li></ul>"
      "<p style='margin-bottom:0'>Three papers move to make this work, and the moves are "
      "improvements rather than concessions &mdash; listed in the table below.</p></div>")

    # -- the bandits
    A("<div class='rule'></div><h2>The bandits in the market</h2>")
    A("<p>Putting the harbour and the hill on one island makes them neighbours. The bandits "
      "make them <b>one setting</b> &mdash; and they earn their place because they map onto "
      "something the foundational papers all do and never say aloud.</p>")
    A("<blockquote>Every paper on Arche assumes its participants follow the protocol. Lamport's "
      "clocks order the events of processes that do not lie about them. Herlihy and Wing's "
      "auditor checks an implementation that is trying to be correct. Chandy and Lamport's "
      "census is a consistent cut only if every scribe reports its own granary honestly. "
      "<b>The bandits are that assumption, made visible.</b></blockquote>")
    A("<p>So the market is not a place where a crime happens. It is a place where some "
      "unknown number of the people inking tallies, answering the auditor and reporting to the "
      "census do not follow the rules &mdash; and the books simply hold that in view while the "
      "foundational results are set out as the papers state them, for honest participants. The "
      "device also ties the island's halves together: up on the crown, the same fault is the "
      "council's whole subject, and the seals that make a lie provable are the same seals.</p>")
    A("<div class='note' style='border-left-color:#93301f'>"
      "<h4>Four rules this device must keep, or it breaks the books it sits in</h4><ol>"
      "<li><b>No infiltration ever happens.</b> There is no arrival, no discovery, no "
      "expulsion. The bandits are already there and always were, like the weather. An "
      "infiltration <i>event</i> is a plot, and <code>content-i2</code>'s house rule 1 retires "
      "plot: <i>nothing is resolved and no one wins</i>.</li>"
      "<li><b>No one is ever identified.</b> Ledger row 12 &mdash; <i>no one ever learns who "
      "the traitors are, and nothing identifies them</i> &mdash; now governs the market too. No "
      "shifty looks, no villain coding, no composition that singles anyone out. The "
      "<code>NO_TRAITOR_TELL</code> constant in <code>art/style.py</code> extends to every "
      "market panel.</li>"
      "<li><b>No motive is given.</b> Ledger row 14 keeps the loot store as scenery and never "
      "links it to anyone's motive. The same holds here: the bandits want nothing the reader is "
      "told about.</li>"
      "<li><b>They cannot reach the crown.</b> This is the load-bearing one. If the market's "
      "bandits could send word to the council, the summit acquires a delayed channel and its "
      "synchronous face-to-face model collapses &mdash; and ledger row 7 (<i>no raven ever "
      "reaches the crown</i>) is broken. <b>The siege is what severs them</b>, which is why "
      "the closed road is a ground on every map below.</li></ol></div>")
    A("<p>Rule 4 is the one that makes the whole device safe. The bandits in the market are cut "
      "off from their own council by the siege, so there is nothing they can coordinate and "
      "nothing for them to do. That is not a limitation imposed on the idea &mdash; it is the "
      "idea. <b>They are a fault model standing in a marketplace, not a faction.</b></p>")

    # -- the two buildings
    A("<div class='rule'></div><h2>Two buildings on Paxos</h2>")
    A("<p>Paxos does not hold one consensus attitude. It holds two, and they are two "
      "buildings a short walk apart &mdash; which is a better division than the papers "
      "themselves suggest, because it separates <b>symmetric</b> consensus from "
      "<b>leader-driven</b> consensus and puts Viewstamped Replication and Raft where they "
      "belong: together.</p>")

    A("<div class='grid2'>")
    A("<div><h3 style='color:#1f5f86'>The Rotunda &mdash; Lamport 1998, 2001</h3>"
      "<p>Circular, domed, no head of the room and no dais. Every seat is the same seat, "
      "which is exactly what lets <i>any</i> legislator call a ballot: the symmetry is not "
      "decoration, it is the protocol.</p>"
      "<p><b>The dome is the problem.</b> Sound gathers under it and comes back, so two voices "
      "raised at once are one unintelligible wash. When two proposers outbid each other, the "
      "room itself is what stops either from finishing &mdash; and it can do so indefinitely, "
      "with nobody at fault and no one lying.</p></div>")
    A("<div><h3 style='color:#1f5f86'>The Odeon &mdash; Oki &amp; Liskov, Liskov &amp; Cowling, Ongaro &amp; Ousterhout</h3>"
      "<p>Roofed, raked, aimed at one stage, and built so a single voice reaches every seat. "
      "The speaker is distinguished <i>by the architecture</i> rather than by agreement &mdash; "
      "which is the whole move: you stop trying to make everyone equal and build a room with a "
      "front.</p>"
      "<p>When the speaker falls silent the performance stops until someone else takes the "
      "stage under a new and higher number &mdash; a view change, an election, a term. "
      "<b>If two claim the stage at once the Odeon is as bad as the Rotunda</b>, which is why "
      "the numbers exist.</p></div>")
    A("</div>")

    A("<div class='note' style='border-left-color:#1f5f86'>"
      "<h4>What the acoustics break, and what they do not</h4>"
      "<p style='margin-bottom:0'>The dome does <b>not</b> break agreement. Quorum intersection "
      "is a fact about who is <i>present</i>, not about who can be <i>heard</i>: any two "
      "majorities share a legislator, and that legislator remembers what he voted for whether "
      "or not he could make it out over the echo. So the Rotunda is <b>safe and not live</b> "
      "&mdash; and that is the single most-missed point about the paper, sitting here as a "
      "property of a building rather than a claim in a caption. It also puts Mount Phyle "
      "directly overhead: the duelling proposers are FLP's impossibility arriving indoors, in "
      "a room where nothing has failed and no raven is late.</p></div>")

    A("<p>Raft's own contributions read as stage directions. A candidate waits a random "
      "interval before claiming the stage, so two rarely claim it together. No one yields the "
      "stage to a performer whose script is less complete than his own. Both are refinements "
      "of the Odeon rather than a different building, which is why Raft sits beside "
      "Viewstamped Replication instead of on an islet of its own.</p>")
    A("<p class='cap'>This replaces the earlier causeway islet. &ldquo;Raftsmen on a raft&rdquo; "
      "was a pun standing in for an idea; the Odeon is the idea. Nothing on Paxos is named "
      "after the algorithm it carries.</p>")

    # -- the re-cut
    A("<div class='rule'></div><h2>The papers, re-cut</h2>")
    A("<p><b>All 31 papers are present and verified.</b> Every PDF in <code>sources/</code> was opened and its title read &mdash; which found three misfiled files, one of them a quantum physics paper, and one duplicate. The correct papers have since been downloaded and checked by content; the bad files are in <code>sources/_misfiled/</code>, not deleted. Three useful companions sit alongside. Full record in <code>buildings.md</code>.</p>")
    A("<table><thead><tr><th>Where</th><th>Ground</th><th>Papers</th><th>What it carries</th>"
      "</tr></thead><tbody>")
    for gid, isl, short, full, papers, carries in GROUNDS:
        A(f"<tr><td><span class='tag t{isl}'>{ {'f':'Arche','p':'Paxos','a':'Antipaxos','c':'Council'}[isl] }</span></td>"
          f"<td><b>{full}</b><br><span class='m' style='font-size:.78rem'>{gid}</span></td>"
          f"<td style='font-size:.84rem'>{papers}</td><td>{carries}</td></tr>")
    A("</tbody></table>")
    A("<h3>Moved from settings.md &mdash; three changes</h3>")
    A("<table><thead><tr><th>Papers</th><th>Was</th><th>Now</th><th>Why it is better</th></tr>"
      "</thead><tbody>"
      "<tr><td>COPS; HATS; PBS</td><td>World&nbsp;1, the Mercantile Exchange</td>"
      "<td><span class='tag ta'>Antipaxos</span></td>"
      "<td>All three are about what a system can still promise <i>without</i> coordinating. "
      "They were the applied papers in a world of foundations; on Antipaxos they are among "
      "their own kind, and Arche narrows to pure theory, which is what lets it be the "
      "background for everything else.</td></tr>"
      "<tr><td>CAP (Brewer; Gilbert &amp; Lynch)</td><td>World&nbsp;2, the Grain Islands</td>"
      "<td><span class='tag tf'>Arche</span></td>"
      "<td>It is an impossibility proof, and it belongs with the other two. It also stops "
      "being Antipaxos's local weather and becomes the <b>reason Antipaxos exists</b>: the "
      "island gave up consistency because a theorem on Arche says it had to.</td></tr>"
      "<tr><td>CALM (Hellerstein &amp; Alvaro; Ameloot)</td><td>World&nbsp;2, the Grain Islands</td>"
      "<td><span class='tag tc'>The council ground</span></td>"
      "<td>It was always the odd paper in a coordination-free world, because it is the one that "
      "says <i>when you must coordinate</i>. Given ground between the two islands it becomes "
      "the adjudicator it actually is.</td></tr></tbody></table>")
    A("<p class='cap'>Chandy &amp; Lamport stays with the harbour: the census pennants are the "
      "marker boats, and the trading houses are the nodes. Gray 1996 stays on Paxos as the "
      "abandoned counting house &mdash; the assembly's reason to exist. Saito &amp; Shapiro "
      "joins the agora as the survey of what the merchants already practise.</p>")

    # -- layouts
    A("<div class='rule'></div><h2>Three arrangements</h2>")
    A("<div class='legend'>"
      "<span><i class='sw' style='background:#cbc496;border:1px solid #6f6440'></i>land</span>"
      "<span><i class='sw' style='background:#b6aa76'></i>higher ground</span>"
      "<span><i class='sw' style='background:#5b4a86'></i>Mount Phyle, true scale</span>"
      "<span><i class='sw' style='background:#ffd9a0'></i>channel a storm can close</span>"
      "<span><i class='sw' style='background:#cfe9f2'></i>sea lane</span></div>")
    A("<p class='cap'>On Paxos, the Rotunda and the Odeon are pinned separately but stand within about two kilometres of each other &mdash; one town, two rooms. The outports are drawn low and bare on purpose. Anything on them tall "
      "enough to read as high ground would break Mount Phyle's brief, which requires it to "
      "rise <i>alone from a rolling plain with no other high ground in sight of it</i>.</p>")

    for i, L in enumerate(LAYOUTS):
        D = L["build"]()
        host = min(D["isles"].values(), key=lambda s: s.coast_dist(D["hill"]))
        hd = host.coast_dist(D["hill"]) / 1000
        pa = math.dist(D["grounds"]["p-rotunda"], D["grounds"]["a-agora"]) / 1000
        ta = min(math.dist(D["grounds"]["a-terraces"], D["grounds"][k]) / 1000
                 for k in ("p-rotunda", "p-odeon", "p-acropolis", "c-ground"))
        A("<section class='layout'>")
        A(f"<header><h2>{L['name']}</h2><span class='axis'>{L['axis']}</span></header>")
        A(f"<p class='lede' style='font-size:1rem'>{L['sub']}</p>")
        A(render_map(D, i))
        ok = ('<span class="ok">(passes)</span>' if hd >= 6
              else '<span class="bad">(too close &mdash; the sea enters the elevated panel)</span>')
        A(f"<p class='cap'><b>Measured on this layout:</b> Mount Phyle's crown sits "
          f"<b>{hd:.1f}&nbsp;km</b> from the nearest coast {ok}; Rotunda to agora "
          f"<b>{pa:.0f}&nbsp;km</b>; the far terraces are <b>{ta:.0f}&nbsp;km</b> from the "
          f"nearest assembly or council ground.</p>")
        A(f"<p>{L['thesis']}</p>")
        A("<div class='grid2 verdict'><div><h5>What it buys</h5><ul class='pro'>"
          + "".join(f"<li>{x}</li>" for x in L["pros"]) + "</ul></div>")
        A("<div><h5>What it costs</h5><ul class='con'>"
          + "".join(f"<li>{x}</li>" for x in L["cons"]) + "</ul></div></div>")
        A(f"<details><summary>Ground coordinates on {L['name'].split('&mdash;')[1].strip()}</summary>")
        A("<table><thead><tr><th>Ground</th><th>Position</th></tr></thead><tbody>")
        for gid, isl, short, full, papers, carries in GROUNDS:
            if gid == "f-ridge":
                w = f"<span class='m'>off-map, {REAR_KM}&nbsp;km &mdash; its own diorama</span>"
            else:
                px, py = D["grounds"][gid]
                w = f"{px/1000:+.1f}, {py/1000:+.1f} km"
            A(f"<tr><td><span class='tag t{isl}'>{short}</span> {full}</td><td>{w}</td></tr>")
        A("</tbody></table></details></section>")

    A("<div class='rule'></div><h2>Where this points</h2>")
    A("<div class='note'><h4>Recommendation &mdash; A, the Close Pair</h4>"
      "<p>The proposal's strongest idea is that Paxos and Antipaxos are two attitudes to the "
      "same problem, and that reads hardest when they are neighbours. B spends a whole island "
      "on two papers and risks making the adjudicator look like a ruler; C puts a besieged "
      "mountain in the middle of the busiest water in the world.</p>"
      "<p style='margin-bottom:0'><b>Borrow one thing from B.</b> A's council islet may be too "
      "small to sustain a diorama. Growing it to two or three kilometres &mdash; still an islet, "
      "not an island &mdash; keeps the pair close while giving the council ground somewhere to "
      "stand.</p></div>")
    A("<div class='note' style='border-left-color:#7a6647'><h4>Open</h4><ol>"
      "<li><b>The three paper moves above are still proposals.</b> <code>settings.md</code> has been reconciled to this scheme and now points here for the grouping, keeping its own analysis — the synchrony split, the house-rule constraints, the sundial decision. Confirm the moves and they become contract.</li>"
      "<li><b>The bandits need a home in the contract</b> &mdash; the four rules above belong in "
      "a cross-book ledger like <code>content-i2</code>'s, not in a layout page.</li>"
      "<li><b>Arche is carrying twelve papers across five grounds.</b> That is the same "
      "overload the Grain Islands had. It probably wants districts: the town, the channel, and "
      "the mountain.</li>"
      "<li><b>The beacon ridge is still off-map at 130&nbsp;km.</b> Unchanged by this "
      "proposal, and still the one ground no arrangement can hold.</li>"
      "<li><b>Where the chronicle is kept.</b> The Rotunda and the Odeon are two ways of deciding, but both append to one record. That archive could be a third building shared between them &mdash; which would state replicated state machines rather neatly &mdash; or it could simply be the scribes below the Odeon stage. Not yet decided.</li>"
      "<li><b>Whether the named traders can be bandits.</b> If every named figure is a "
      "Hellenised author and therefore honest, the reader can narrow the field &mdash; which "
      "weakens rule 2. Either the named figures are not exempt, or the market's crowd is large "
      "enough that naming tells you nothing.</li></ol></div>")
    A("<p class='cap' style='margin-top:36px'>Generated by <code>gen_layouts.py</code>. "
      "Coastlines are radial-harmonic sketches at the stated scale, not final geometry.</p>")
    A("</div></body></html>")
    open(OUT, "w").write("\n".join(P))
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()
