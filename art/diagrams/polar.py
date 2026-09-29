"""Space-time diagrams drawn in the round, for the ring road books.

Each house (or clerk) is a line running outward from its label: the house itself at one
moment after another. Each faint ring further out is a later moment, so an
event is a dot on a spoke at the radius of its time. A slip is a spiral arc that travels
round the circle from sender to receiver while moving outward by the time it took. A cut
is a closed loop round the centre: the past inside, the future outside.

    python3 art/diagrams/polar.py          # rebuild every figure in the books

Each figure is marked inside its <svg> with <!-- polar:NAME -->, which is how the build
finds it again.
"""
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INK, PAPER, BLUE, RED, OLIVE = "#1c1512", "#f6eed6", "#136f9e", "#bf4a26", "#5f6e28"
OCHRE = "#a8741a"
SUBS = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class Fig:
    """One <svg>, possibly holding several polar panels."""

    def __init__(self, name, w, h, aria):
        self.name, self.w, self.h = name, w, h
        self.out = []
        self.clips = []
        self.head = (f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{esc(aria)}">\n'
                     f'  <!-- polar:{name} -->\n  <defs>')
        for key, col in (("b", BLUE), ("r", RED), ("o", OCHRE), ("g", OLIVE), ("k", INK)):
            self.head += (f'\n    <marker id="{name}-{key}" markerWidth="9" markerHeight="9" refX="7.5" refY="3.2" orient="auto">'
                          f'\n      <path d="M0,0 L7.5,3.2 L0,6.4 z" fill="{col}"/>\n    </marker>')
        self.head += "\n  </defs>"

    def add(self, s):
        self.out.append("  " + s)

    def text(self, x, y, s, cls="d-note", anchor="middle", fill=None, extra=""):
        fa = f' style="fill:{fill}"' if fill else ""
        self.add(f'<text class="{cls}" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}"{fa}{extra}>{esc(s)}</text>')

    def divider(self, x, y1, y2):
        self.add(f'<line x1="{f(x)}" y1="{f(y1)}" x2="{f(x)}" y2="{f(y2)}" stroke="#b9a77e" stroke-width="1.5"/>')

    def svg(self):
        head = self.head.replace("<svg ", '<svg class="flow" ', 1) if self.clips else self.head
        return head + "\n" + "\n".join(self.out) + "\n</svg>"


class Polar:
    """One round diagram: nodes on a circle of radius r0, time step `step` per ring."""

    def __init__(self, fig, cx, cy, r0, step, nodes, box=30):
        self.fig, self.cx, self.cy, self.r0, self.step = fig, cx, cy, r0, step
        self.nodes = nodes            # key -> (angle in degrees, clockwise from east; label)
        self.box = box

    # geometry ---------------------------------------------------------------
    def r(self, t):
        return self.r0 + self.step * t

    def ang(self, key):
        return self.nodes[key][0] if isinstance(key, str) else key

    def pt(self, key, t, dr=0.0, dth=0.0):
        a = math.radians(self.ang(key) + dth)
        rr = self.r(t) + dr
        return self.cx + rr * math.cos(a), self.cy + rr * math.sin(a)

    def xy(self, a, rr):
        a = math.radians(a)
        return self.cx + rr * math.cos(a), self.cy + rr * math.sin(a)

    # frame ------------------------------------------------------------------
    def rings(self, n):
        for i in range(1, n + 1):
            self.fig.add(f'<circle cx="{f(self.cx)}" cy="{f(self.cy)}" r="{f(self.r(i))}" fill="none" '
                         f'style="stroke:#b9a77e; stroke-opacity:.65; stroke-width:.8; stroke-dasharray:3 4"/>')

    def time_note(self, t, a0=-165, a1=-105):
        rr = self.r(t) + 12
        (x0, y0), (x1, y1) = self.xy(a0, rr), self.xy(a1, rr)
        pid = f"{self.fig.name}-time"
        self.fig.add(f'<path id="{pid}" fill="none" d="M{f(x0)},{f(y0)} A{f(rr)},{f(rr)} 0 0 1 {f(x1)},{f(y1)}"/>')
        self.fig.add(f'<text class="d-note"><textPath href="#{pid}" startOffset="50%" text-anchor="middle">time, later outward</textPath></text>')

    def road(self, t_end):
        """Each house's line: the house itself at one moment after another."""
        F = self.fig
        for k in self.nodes:
            (x1, y1), (x2, y2) = self.pt(k, 0), self.pt(k, t_end)
            F.add(f'<line class="d-lifeline" x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}"/>')

    def node_boxes(self):
        w, h = self.box, 22
        for k, (a, label) in self.nodes.items():
            x, y = self.pt(k, 0)
            self.fig.add(f'<rect class="d-node" x="{f(x - w / 2)}" y="{f(y - h / 2)}" width="{w}" height="{h}" rx="3" '
                         f'fill="{PAPER}" stroke="{INK}" stroke-width="1.6"/>'
                         f'<text class="d-house" x="{f(x)}" y="{f(y + 4.5)}" text-anchor="middle" fill="{INK}">{esc(label)}</text>')

    # marks ------------------------------------------------------------------
    def event(self, key, t, hi=False, rad=None):
        x, y = self.pt(key, t)
        cls = "d-ev-hi" if hi else "d-ev"
        rad = rad or (5.5 if hi else 5)
        self.fig.add(f'<circle class="{cls}" cx="{f(x)}" cy="{f(y)}" r="{rad}"/>')

    def label(self, key, t, s, side=-1, dist=13, fill=None, size=None, anchor=None, dx=0, dy=0, cls="d-lbl d-halo"):
        """Text beside the spoke at time t; side -1 is anticlockwise of it, +1 clockwise."""
        x, y = self.pt(key, t)
        a = math.radians(self.ang(key) + 90 * side)
        ca, sa = math.cos(a), math.sin(a)
        lx, ly = x + dist * ca, y + dist * sa + 4 + (4 * sa if abs(ca) < 0.3 else 0)
        if anchor is None:
            anchor = "middle" if abs(ca) < 0.3 else ("start" if ca > 0 else "end")
        extra = f' font-size="{size}"' if size else ""
        self.fig.text(lx + dx, ly + dy, s, cls=cls, anchor=anchor, fill=fill, extra=extra)

    def end_label(self, key, t, lines, gap=10, fill=None):
        """Text past the outer end of a spoke, reading away from the centre."""
        x, y = self.pt(key, t, dr=gap)
        c = math.cos(math.radians(self.ang(key)))
        anchor = "middle" if abs(c) < 0.3 else ("start" if c > 0 else "end")
        y0 = y + 4 - 7 * (len(lines) - 1)
        for i, (s, fl) in enumerate(lines):
            self.fig.text(x, y0 + 14 * i, s, cls="d-lbl d-halo", anchor=anchor, fill=fl)

    def bar(self, key, t1, t2, color=INK):
        (x1, y1), (x2, y2) = self.pt(key, t1), self.pt(key, t2)
        self.fig.add(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{color}" stroke-width="8"/>')

    def span(self, t1, t2, color, opacity=.16):
        """A whole ring of time, t1 to t2: everything that happened anywhere meanwhile."""
        r1, r2, cx, cy = self.r(t1), self.r(t2), self.cx, self.cy
        d = "".join(f" M{f(cx + r)},{f(cy)} A{f(r)},{f(r)} 0 1 0 {f(cx - r)},{f(cy)} A{f(r)},{f(r)} 0 1 0 {f(cx + r)},{f(cy)} Z"
                    for r in (r2, r1))
        self.fig.add(f'<path d="{d.strip()}" fill-rule="evenodd" style="fill:{color}; fill-opacity:{opacity}; stroke:{color}; stroke-opacity:.5; stroke-width:.8"/>')

    def band(self, key, t1, t2):
        (x1, y1), (x2, y2) = self.pt(key, t1), self.pt(key, t2)
        self.fig.add(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{RED}" '
                     f'stroke-opacity=".18" stroke-width="24" stroke-linecap="round"/>')

    def spiral_pts(self, a0, r0, a1, r1, cw=True):
        if cw:
            while a1 <= a0:
                a1 += 360
        else:
            while a1 >= a0:
                a1 -= 360
        n = max(12, int(abs(a1 - a0) / 3))
        return [self.xy(a0 + (a1 - a0) * i / n, r0 + (r1 - r0) * i / n) for i in range(n + 1)]

    def msg(self, a, ta, b, tb, hi=False, cw=True, trim=7, start_trim=0, short=False):
        if short:                      # the direct stretch: whichever way round is shorter
            cw = (self.ang(b) - self.ang(a)) % 360 < 180
        pts = self.spiral_pts(self.ang(a), self.r(ta), self.ang(b), self.r(tb), cw)
        end, start = pts[-1], pts[0]
        while trim and math.dist(pts[-1], end) < trim:
            pts.pop()
        while start_trim and math.dist(pts[0], start) < start_trim:
            pts.pop(0)
        cls, m = ("d-msg-hi", "r") if hi else ("d-msg", "b")
        d = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts)
        self.fig.add(f'<path class="{cls}" marker-end="url(#{self.fig.name}-{m})" d="{d}"/>')

    def order_arc(self, a, ta, b, tb, color, marker, cw=True, trim=9, start_trim=6):
        """A dashed arc for 'this comes first' in some sequence: an ordering, not a slip."""
        pts = self.spiral_pts(self.ang(a), self.r(ta), self.ang(b), self.r(tb), cw)
        end, start = pts[-1], pts[0]
        while math.dist(pts[-1], end) < trim:
            pts.pop()
        while math.dist(pts[0], start) < start_trim:
            pts.pop(0)
        d = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts)
        self.fig.add(f'<path d="{d}" fill="none" marker-end="url(#{self.fig.name}-{marker})" '
                     f'style="stroke:{color}; stroke-width:2; stroke-dasharray:7 4"/>')

    def badge(self, key, t, num, color, side, dist=18, word=None):
        """A numbered disc beside an event: its place in some sequence. The word goes beyond it."""
        x, y = self.pt(key, t)
        a = math.radians(self.ang(key) + 90 * side)
        bx, by = x + dist * math.cos(a), y + dist * math.sin(a)
        self.fig.add(f'<circle cx="{f(bx)}" cy="{f(by)}" r="8.5" style="fill:{color}; stroke:{PAPER}; stroke-width:1.5"/>'
                     f'<text x="{f(bx)}" y="{f(by + 4)}" text-anchor="middle" '
                     f'style="font:700 11.5px Optima,\'Gill Sans\',sans-serif; fill:{PAPER}">{num}</text>')
        if word:
            wx, wy = x + (dist + 19) * math.cos(a), y + (dist + 19) * math.sin(a)
            self.fig.text(wx, wy + 4, word, cls="d-lbl d-halo")

    def half(self, top, t, color, opacity=.08):
        """Tint the top or bottom half of the diagram out to time t."""
        rr, cx, cy = self.r(t), self.cx, self.cy
        sweep = 1 if top else 0
        d = f"M{f(cx - rr)},{f(cy)} A{f(rr)},{f(rr)} 0 0 {sweep} {f(cx + rr)},{f(cy)} Z"
        self.fig.add(f'<path d="{d}" style="fill:{color}; fill-opacity:{opacity}; stroke:none"/>')

    def radial_arrow(self, key, t1, t2, dth, hi=False, ink=False):
        (x1, y1), (x2, y2) = self.pt(key, t1, dth=dth), self.pt(key, t2, dth=dth)
        if ink:
            self.fig.add(f'<path marker-end="url(#{self.fig.name}-k)" d="M{f(x1)},{f(y1)} L{f(x2)},{f(y2)}" '
                         f'style="stroke:{INK}; stroke-width:1.6; fill:none"/>')
            return
        cls, m = ("d-msg-hi", "r") if hi else ("d-msg", "b")
        self.fig.add(f'<path class="{cls}" marker-end="url(#{self.fig.name}-{m})" d="M{f(x1)},{f(y1)} L{f(x2)},{f(y2)}"/>')

    def moment(self, t):
        self.fig.add(f'<circle cx="{f(self.cx)}" cy="{f(self.cy)}" r="{f(self.r(t))}" fill="none" '
                     f'style="stroke:{INK}; stroke-opacity:.55; stroke-width:1.2; stroke-dasharray:4 3"/>')

    def cut(self, times, color):
        """Closed loop crossing each spoke at its time, radius interpolated between spokes."""
        keys = sorted(times, key=lambda k: self.ang(k) % 360)
        pts = []
        for i, k in enumerate(keys):
            k2 = keys[(i + 1) % len(keys)]
            seg = self.spiral_pts(self.ang(k), self.r(times[k]), self.ang(k2), self.r(times[k2]))
            pts += seg[:-1]
        d = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts) + " Z"
        cx, cy, r0 = self.cx, self.cy, self.r0
        hole = (f" M{f(cx + r0)},{f(cy)} A{f(r0)},{f(r0)} 0 1 0 {f(cx - r0)},{f(cy)}"
                f" A{f(r0)},{f(r0)} 0 1 0 {f(cx + r0)},{f(cy)} Z")
        self.fig.add(f'<path d="{d}{hole}" fill-rule="evenodd" style="fill:{color}; fill-opacity:.13; stroke:none"/>')
        self.fig.add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2" stroke-dasharray="7 4"/>')

    def flow_open(self, t_end):
        """Start a group of marks that appear as time reaches them (see assets/js/flow.js)."""
        F = self.fig
        if not hasattr(self, "clip"):
            self.clip = f"{F.name}-clip{len(F.clips)}"
            F.clips.append(self.clip)
            F.add(f'<clipPath id="{self.clip}"><circle class="tclip" cx="{f(self.cx)}" cy="{f(self.cy)}" r="{f(self.r(t_end) + 20)}" '
                  f'data-r0="{f(self.r0)}" data-r1="{f(self.r(t_end))}"/></clipPath>')
        F.add(f'<g class="tflow" clip-path="url(#{self.clip})">')

    def flow_close(self):
        self.fig.add('</g>')

    def at(self, a, t, dr=0):
        return self.xy(a, self.r(t) + dr)


# ---------------------------------------------------------------------------
# Ordering Without Clocks
# ---------------------------------------------------------------------------

def ordering_spacetime():
    F = Fig("owc-spacetime", 600, 560,
            "Space-time diagram of three trading houses drawn in the round. H1, H2 and H3 each have a line running outward, the house at one moment after another; "
            "each ring outward is a later moment. Events are dots on each house's spoke; slips carried by messengers "
            "are arcs running round the circle and outward. Events p2 and r3 are unrelated.")
    P = Polar(F, 300, 282, 66, 42, {"1": (-90, "H1"), "2": (30, "H2"), "3": (150, "H3")})
    F.add("")
    P.rings(4)
    P.time_note(4)
    P.road(4.33)
    P.node_boxes()
    P.flow_open(4.33)
    msgs = [(("1", 1), ("2", 2)), (("2", 1), ("3", 2)), (("3", 1), ("1", 3)), (("2", 3), ("3", 4))]
    for (a, ta), (b, tb) in msgs:
        P.msg(a, ta, b, tb)
    recv = {m[1] for m in msgs}
    for h, s in zip("123", "pqr"):
        for t in range(1, 5):
            hi = (h, t) in {("1", 2), ("3", 3)}
            P.event(h, t, hi)
            P.label(h, t, f"{s}{str(t).translate(SUBS)}", side=1 if (h, t) in recv else -1)
    P.flow_close()
    F.text(300, 548, "p₂ and r₃ are unrelated: no path of messengers joins them in either direction")
    return F


# ---------------------------------------------------------------------------
# Taking Stock Without Stopping
# ---------------------------------------------------------------------------

def stock_sash():
    F = Fig("tsws-sash", 660, 540,
            "One road track from House 1 to House 2, drawn in the round: H1 on the left, H2 on the right, later "
            "moments further out, slips as arcs over the top. House 1 records its storehouse and dispatches a red "
            "sash messenger. Cargo already on the road arrives at House 2 before the sash and is recorded as the "
            "road's holding. Cargo dispatched after the sash arrives later and is not included.")
    P = Polar(F, 330, 262, 58, 30, {"1": (180, "H1"), "2": (0, "H2")})
    P.rings(6)
    P.road(6.6)
    P.node_boxes()
    P.flow_open(6.6)
    P.band("2", 2.2, 4.1)
    P.msg("1", 1, "2", 2.5)
    P.msg("1", 2, "2", 3.8)
    P.msg("1", 3.5, "2", 5.2, hi=True)
    P.msg("1", 4.5, "2", 6.2)
    for t in (1, 2, 3.5, 4.5):
        P.event("1", t, rad=4.5)
    P.event("1", 3, hi=True, rad=6)
    for t in (2.5, 3.8, 6.2):
        P.event("2", t, rad=4.5)
    P.event("2", 5.2, hi=True, rad=6)
    # slip labels at the top of each arc, just inside it
    for (ta, tb), s, hi in (((1, 2.5), "40 jars", False), ((2, 3.8), "25 jars", False),
                           ((3.5, 5.2), "the red sash", True), ((4.5, 6.2), "18 jars", False)):
        x, y = P.xy(-90, P.r((ta + tb) / 2) - 8)
        F.text(x, y, s, cls="d-note d-halo" if hi else "d-num d-halo", fill=RED if hi else None)
    P.label("1", 3, "House 1 records", side=-1, dist=18, fill=RED)
    P.label("1", 3, "its storehouse", side=-1, dist=32, fill=RED)
    P.label("2", 5.2, "House 2 closes", side=1, dist=18)
    P.label("2", 5.2, "the road slate", side=1, dist=32)
    x, _ = P.pt("2", 3.15)
    y = P.cy + 58
    F.text(x, y, "arrived before", cls="d-key", fill=RED)
    F.text(x, y + 14, "the red sash:", cls="d-key", fill=RED)
    F.text(x, y + 32, "40 + 25 = 65", cls="d-key", fill=RED, extra=' font-weight="700"')
    F.text(x, y + 46, "= road holding", cls="d-key", fill=RED)
    P.flow_close()
    F.text(330, 530, "the 18 jars dispatched after the sash belong to the island's future, not to this census")
    return F


def stock_cuts():
    F = Fig("tsws-cuts", 660, 410,
            "Two panels comparing cuts, each drawn in the round with H1 on the left and H2 on the right, later "
            "moments further out, carts from H1 to H2 as arcs over the top and from H2 to H1 as arcs underneath. "
            "The cut is the shaded area inside a dashed loop: what each house recorded lies inside it. Left panel: a sound cut, where every "
            "cart arc crosses the loop outward or not at all. Right panel: an impossible cut, where an arc crosses "
            "inward, representing goods received before they were loaded.")
    nodes = {"1": (180, "H1"), "2": (0, "H2")}
    # left: sound
    F.text(165, 26, "SOUND (CONSISTENT)", cls="d-house")
    L = Polar(F, 165, 204, 26, 22, nodes)
    L.rings(5)
    L.road(5.5)
    L.node_boxes()
    L.flow_open(5.5)
    L.cut({"1": 3.6, "2": 2.7}, OLIVE)
    L.msg("1", 1, "2", 2)
    L.msg("1", 3, "2", 4.5)
    L.msg("2", 3.3, "1", 5)
    for k, t in (("1", 1), ("1", 3), ("1", 5), ("2", 2), ("2", 3.3), ("2", 4.5)):
        L.event(k, t, rad=4)
    L.event("1", 3.6, hi=True)
    L.event("2", 2.7, hi=True)
    x, y = L.at(90, 3.15, -9)
    F.text(x, y, "the cut", cls="d-key d-halo", fill=OLIVE)
    L.flow_close()
    F.text(165, 376, "every cart crosses outward")
    F.text(165, 392, "or does not cross at all")
    F.divider(330, 40, 360)
    # right: impossible
    F.text(495, 26, "IMPOSSIBLE (INCONSISTENT)", cls="d-house", fill=RED)
    R = Polar(F, 495, 204, 26, 22, nodes)
    R.rings(5)
    R.road(5.5)
    R.node_boxes()
    R.flow_open(5.5)
    R.cut({"1": 5, "2": 2.4}, RED)
    R.msg("1", 1, "2", 1.6)
    R.msg("2", 3, "1", 4, hi=True)
    R.event("1", 1, rad=4)
    R.event("2", 1.6, rad=4)
    for k, t in (("2", 3), ("1", 4), ("1", 5), ("2", 2.4)):
        R.event(k, t, hi=True)
    x, y = R.at(-90, 3.7, -10)
    F.text(x, y + 4, "the cut", cls="d-key d-halo", fill=RED)
    R.flow_close()
    F.text(495, 376, "this arrow crosses inward: House 1 has", fill=RED)
    F.text(495, 392, "goods House 2 has not yet dispatched", fill=RED)
    return F


# ---------------------------------------------------------------------------
# Many Copies Acting As One
# ---------------------------------------------------------------------------

def copies_overlap():
    F = Fig("mcao-overlap", 660, 420,
            "Two panels drawn in the round: H3, where the board and its loader are, on top; House 1 lower left and "
            "House 2 lower right; later moments further out. Each house sends an order slip to H3 and gets a "
            "confirmation slip back; a shaded ring, House 1's green and House 2's ochre, runs from sending to confirmation. Left: the two "
            "orders overlap and the loader serves House 2, then House 1, which is allowed. Right: House 1's order is "
            "confirmed before House 2's is sent, and the loader still serves House 2 first, which the rule forbids.")
    nodes = {"1": (150, "H1"), "2": (30, "H2"), "3": (-90, "H3")}
    panels = (
        # cx, title, colour, (H1 send, enter, confirm), (H2 send, enter, confirm), moment, note
        (165, "ALLOWED", None, (1, 3, 5), (1.5, 2.5, 4), None,
         ("the two orders overlap,", "so either may come first")),
        (495, "NOT ALLOWED", RED, (1, 2, 3), (3.8, 4.8, 5.8), 3,
         ("House 1's order was confirmed", "before House 2's was sent")))
    for cx, title, fill, o1, o2, moment, note in panels:
        F.text(cx, 24, title, cls="d-house", fill=fill)
        P = Polar(F, cx, 200, 36, 13.5, nodes)
        P.rings(8)
        P.flow_open(8.4)
        for (ts, te, tc), col in ((o1, OLIVE), (o2, OCHRE)):
            P.span(ts, tc, col)
        if moment:
            P.moment(moment)
        P.flow_close()
        P.road(8.4)
        P.flow_open(8.4)
        for k, (ts, te, tc), col in (("1", o1, OLIVE), ("2", o2, OCHRE)):
            P.bar(k, ts, tc, col)
        P.flow_close()
        P.node_boxes()
        P.flow_open(8.4)
        for k, (ts, te, tc) in (("1", o1), ("2", o2)):
            P.msg(k, ts, "3", te, short=True)
            P.msg("3", te, k, tc, short=True, trim=5)
            P.event("3", te, rad=3.5)
        P.event("3", 6.6, hi=bool(fill))
        P.label("3", 6.6, "serves House 2", side=-1, dist=10, fill=fill)
        P.event("3", 7.6)
        P.label("3", 7.6, "serves House 1", side=-1, dist=10)
        P.flow_close()
        F.text(cx, 382, note[0], fill=fill)
        F.text(cx, 398, note[1], fill=fill)
    F.divider(330, 10, 410)
    return F


def copies_loop():
    F = Fig("mcao-loop", 640, 610,
            "Two houses drawn in the round, House 1 on the left and House 2 on the right, later moments further out. "
            "House 1 orders grain, then oil; House 2 orders oil, then grain. Top half, the oil board at House 2: "
            "House 1's oil order arrives by slip and is entered before House 2 places its own, so the oil board puts "
            "House 1 first. Bottom half, the grain board at House 3 (not drawn): it puts House 2's grain first, though "
            "House 1's grain order was finished long before. Each board alone can be explained; together, with each "
            "house's own order, they run House 1 grain, House 1 oil, House 2 oil, House 2 grain, House 1 grain: a loop.")
    P = Polar(F, 320, 290, 44, 34, {"1": (180, "H1"), "2": (0, "H2")})
    T = 6.3
    P.rings(6)
    P.flow_open(T)
    P.half(True, T, OCHRE)
    P.half(False, T, OLIVE)
    P.flow_close()
    P.road(6.1)
    grain1, oil1 = (0.6, 1.4), (2.2, 4.2)      # House 1: grain, then oil (sent, confirmed)
    oil2, grain2 = (3.6, 4.1), (4.9, 5.8)      # House 2: oil at home, then grain
    P.flow_open(T)
    P.bar("1", *grain1, OLIVE)
    P.bar("1", *oil1, OCHRE)
    P.bar("2", *oil2, OCHRE)
    P.bar("2", *grain2, OLIVE)
    P.flow_close()
    P.node_boxes()
    P.flow_open(T)
    # House 1's oil order travels to the board at House 2 and word of its entry comes back
    P.msg("1", 2.2, "2", 3.1, cw=True)
    P.msg("2", 3.1, "1", 4.2, cw=False, trim=6)
    P.event("2", 3.1, rad=3.5)
    # each house's own order
    P.radial_arrow("1", 1.5, 2.1, dth=0, ink=True)
    P.radial_arrow("2", 4.2, 4.8, dth=0, ink=True)
    # each board's sequence: oil above the line, grain below
    P.badge("1", 3.2, "1", OCHRE, side=1, word="oil")
    P.badge("2", 3.85, "2", OCHRE, side=-1, word="oil")
    P.badge("2", 5.35, "1", OLIVE, side=1, word="grain")
    P.badge("1", 1.0, "2", OLIVE, side=-1, word="grain")
    P.flow_close()
    F.text(320, 24, "OIL BOARD, AT HOUSE 2", cls="d-house", fill=OCHRE)
    F.text(320, 42, "House 1's oil arrives and is entered first: 1 House 1's oil, 2 House 2's oil")
    F.text(320, 548, "GRAIN BOARD, AT HOUSE 3 (NOT DRAWN)", cls="d-house", fill=OLIVE)
    F.text(320, 566, "it puts House 2's grain first, though House 1's was finished long before")
    F.text(320, 596, "together: House 1 grain → House 1 oil → House 2 oil → House 2 grain → House 1 grain", fill=RED)
    return F


FIGURES = {
    "books/ordering-without-clocks/index.html": [ordering_spacetime],
    "books/taking-stock-without-stopping/index.html": [stock_sash, stock_cuts],
    "books/many-copies-acting-as-one/index.html": [copies_overlap, copies_loop],
}


def splice(html, fig):
    body = "\n".join("      " + l if l else "" for l in fig.svg().split("\n"))
    pat = re.compile(r"      <svg [^>]*>\s*<!-- polar:" + re.escape(fig.name) + r" -->.*?</svg>", re.S)
    html, n = pat.subn(lambda m: body, html, count=1)
    if n != 1:
        raise SystemExit(f"no <svg> marked polar:{fig.name}")
    return html


def main():
    for rel, figs in FIGURES.items():
        p = ROOT / rel
        html = p.read_text()
        for make in figs:
            html = splice(html, make())
        p.write_text(html)
        print(rel, len(figs))


if __name__ == "__main__":
    main()
