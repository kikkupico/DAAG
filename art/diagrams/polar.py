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

    def road(self, t_end, ends=None):
        """Each house's line: the house itself at one moment after another. `ends` cuts
        chosen lines short (key -> time), for a man who has died."""
        F = self.fig
        for k in self.nodes:
            (x1, y1), (x2, y2) = self.pt(k, 0), self.pt(k, (ends or {}).get(k, t_end))
            F.add(f'<line class="d-lifeline" x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}"/>')

    def node_boxes(self):
        w, h = self.box, 22
        for k, (a, label) in self.nodes.items():
            x, y = self.pt(k, 0)
            self.fig.add(f'<rect class="d-node" x="{f(x - w / 2)}" y="{f(y - h / 2)}" width="{w}" height="{h}" rx="3" '
                         f'fill="{PAPER}" stroke="{INK}" stroke-width="1.6"/>'
                         f'<text class="d-house" x="{f(x)}" y="{f(y + 4.5)}" text-anchor="middle" fill="{INK}">{esc(label)}</text>')

    # marks ------------------------------------------------------------------
    def event(self, key, t, hi=False, rad=None, state=None):
        """A dot on a spoke. With `state`, it shows what the man has done by then: "none" is a hollow
        dot (he has not gone), "N" or "S" a dot carrying that letter (he has gone to that gate)."""
        x, y = self.pt(key, t)
        cls = "d-ev-hi" if hi else "d-ev"
        col = RED if hi else INK
        if state is None:
            rad = rad or (5.5 if hi else 5)
            self.fig.add(f'<circle class="{cls}" cx="{f(x)}" cy="{f(y)}" r="{rad}"/>')
        elif state == "none":
            rad = rad or 4.5
            self.fig.add(f'<circle class="{cls}" cx="{f(x)}" cy="{f(y)}" r="{rad}" '
                         f'style="fill:{PAPER}; stroke:{col}; stroke-width:1.6"/>')
        else:
            rad = rad or 7.5
            self.fig.add(f'<circle class="{cls}" cx="{f(x)}" cy="{f(y)}" r="{rad}"/>')
            self.fig.add(f'<text x="{f(x)}" y="{f(y + 3.4)}" text-anchor="middle" '
                         f'style="font:700 10px Optima,\'Gill Sans\',sans-serif; fill:{PAPER}">{state}</text>')

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

    def msg(self, a, ta, b, tb, hi=False, cw=True, trim=7, start_trim=0, short=False, dashed=False):
        """A slip (raven, bird) from a at ta to b at tb. `dashed` is one held back on the way."""
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
        dash = ' style="stroke-dasharray:6 4"' if dashed else ""
        self.fig.add(f'<path class="{cls}" marker-end="url(#{self.fig.name}-{m})" d="{d}"{dash}/>')

    def lost(self, a, ta, b, tb, frac=.55, short=True, cw=True):
        """A slip that never arrives: it starts out, then ends in a cross."""
        if short:
            cw = (self.ang(b) - self.ang(a)) % 360 < 180
        pts = self.spiral_pts(self.ang(a), self.r(ta), self.ang(b), self.r(tb), cw)
        pts = pts[:max(2, int(len(pts) * frac))]
        d = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts)
        self.fig.add(f'<path class="d-msg" d="{d}"/>')
        x, y = pts[-1]
        self.fig.add(f'<path d="M{f(x - 5)},{f(y - 5)} L{f(x + 5)},{f(y + 5)} M{f(x - 5)},{f(y + 5)} L{f(x + 5)},{f(y - 5)}" '
                     f'style="stroke:{RED}; stroke-width:2.2; fill:none"/>')
        return x, y

    def dead(self, key, t):
        """A man who has died: his line stops at t with a cross."""
        x, y = self.pt(key, t)
        self.fig.add(f'<path d="M{f(x - 5.5)},{f(y - 5.5)} L{f(x + 5.5)},{f(y + 5.5)} M{f(x - 5.5)},{f(y + 5.5)} L{f(x + 5.5)},{f(y - 5.5)}" '
                     f'style="stroke:{INK}; stroke-width:2.4; fill:none"/>')

    def refused(self, a, ta, b, tb):
        """A slip that arrives and is turned away: it ends in a cross on the receiver's line."""
        self.msg(a, ta, b, tb, short=True, trim=0)
        x, y = self.pt(b, tb)
        self.fig.add(f'<path d="M{f(x - 5)},{f(y - 5)} L{f(x + 5)},{f(y + 5)} M{f(x - 5)},{f(y + 5)} L{f(x + 5)},{f(y - 5)}" '
                     f'style="stroke:{RED}; stroke-width:2.2; fill:none"/>')

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


# ---------------------------------------------------------------------------
# The Limits of Agreement
# ---------------------------------------------------------------------------

def limits_fold():
    F = Fig("tloa-fold", 660, 420,
            "Two panels drawn in the round, tents 1 and 2 on the left of each and tents 3 and 4 on the right, later moments "
            "further out. Each tent is a line of the things that happen there, one after another. Tents 1 and 2, olive, trade ravens: one flies from tent 1 to tent 2 and one back. "
            "Tents 3 and 4, ochre, do the same. No raven flies between the two pairs. Left: 1 and 2 trade ravens first, then 3 and 4. "
            "Right: 3 and 4 first, then 1 and 2. The ravens and the tents they reach are identical; only the moments swap, and the night "
            "ends at the same standing.")
    nodes = {"1": (225, "T1"), "2": (135, "T2"), "3": (315, "T3"), "4": (45, "T4")}
    panels = ((165, "1 AND 2 TRADE RAVENS, THEN 3 AND 4", 1.0, 3.6, "1 and 2 trade ravens", "3 and 4 trade ravens"),
              (495, "3 AND 4 TRADE RAVENS, THEN 1 AND 2", 3.6, 1.0, "1 and 2 trade ravens", "3 and 4 trade ravens"))
    for cx, title, b1, b2, n1, n2 in panels:
        F.text(cx, 24, title, cls="d-house")
        F.text(cx - 82, 46, n1, cls="d-lbl", fill=OLIVE)
        F.text(cx + 82, 46, n2, cls="d-lbl", fill=OCHRE)
        P = Polar(F, cx, 200, 50, 15, nodes)
        P.rings(7)
        P.road(6.8)
        P.node_boxes()
        P.flow_open(6.8)
        P.moment(6.6)
        for a, b, base, col, name in (("1", "2", b1, OLIVE, n1), ("3", "4", b2, OCHRE, n2)):
            P.bar(a, base, base + 2, col)
            P.bar(b, base + 1, base + 1.01, col)
            P.msg(a, base, b, base + 1, short=True)
            P.msg(b, base + 1, a, base + 2, short=True, trim=6)
            for k, t in ((a, base), (b, base + 1), (a, base + 2)):
                P.event(k, t, state="none")
        (x1, y1), (x2, y2) = P.pt("1", 0), P.pt("3", 0)
        # the only thing that differs: which course comes first
        if b1 < b2:
            P.order_arc("1", 3, "3", 3.6, INK, "k", cw=True, trim=7, start_trim=5)
        else:
            P.order_arc("3", 3, "1", 3.6, INK, "k", cw=False, trim=7, start_trim=5)
        P.flow_close()
        F.text(cx, 372, "no raven flies between the halves,")
        F.text(cx, 388, "so nothing sets which comes first")
        F.text(cx, 408, "the same standing at the end", fill=INK)
    F.divider(330, 10, 415)
    return F


def limits_silent():
    F = Fig("tloa-silent", 660, 410,
            "Two panels drawn in the round, four tents at north, east, south and west, later moments further out. Tent 1, at the top, "
            "is the one man p: in both panels he never stirs. Tents 2, 3 and 4 see the same ravens in the same order in both. "
            "Left: p saw north, and the other three go north. Right: p saw south, the beginning fated south, and the other three "
            "still go north, because they cannot tell the two beginnings apart.")
    nodes = {"1": (-90, "T1"), "2": (0, "T2"), "3": (90, "T3"), "4": (180, "T4")}
    panels = ((165, "p SAW NORTH: FATED NORTH", "saw north", None, ("all three go north", "as they must")),
              (495, "p SAW SOUTH: FATED SOUTH", "saw south", RED, ("the same ravens, the same order:", "they go north here too")))
    for cx, title, sight, fill, note in panels:
        F.text(cx, 24, title, cls="d-house", fill=fill)
        P = Polar(F, cx, 200, 40, 12, nodes)
        P.rings(7)
        P.road(6.8)
        P.node_boxes()
        x, y = P.pt("1", 0)
        F.text(x + 22, y + 4, sight, cls="d-lbl d-halo", anchor="start", fill=fill)
        P.flow_open(6.8)
        P.msg("2", 1, "3", 2, short=True)
        P.msg("3", 2.5, "4", 3.5, short=True)
        P.msg("4", 4, "3", 5, short=True)
        for k, t in (("2", 1), ("3", 2), ("3", 2.5), ("4", 3.5), ("4", 4), ("3", 5)):
            P.event(k, t, state="none")
        for k in "234":
            P.event(k, 6.2, hi=bool(fill), state="N")
        P.label("2", 6.2, "goes north", side=-1, dist=10, fill=fill)
        P.label("3", 6.2, "goes north", side=1, dist=10, fill=fill)
        P.label("4", 6.2, "goes north", side=-1, dist=10, fill=fill)
        P.label("1", 3.5, "p never stirs", side=1, dist=10, anchor="start")
        P.flow_close()
        F.text(cx, 366, note[0], fill=fill)
        F.text(cx, 382, note[1], fill=fill)
    F.divider(330, 10, 400)
    return F


def limits_defer():
    F = Fig("tloa-defer", 660, 420,
            "Two panels drawn in the round, four tents at north, east, south and west, later moments further out. "
            "A telling raven, in red, is held back and then flies while another raven is in the air. Left: the other raven "
            "is bound for a different tent, so the two are in flight together and either may land first; the standing after both is the "
            "same, so it cannot be settled both ways. Right: both ravens are bound for tent 1. Tent 1 then goes quiet, and the other three "
            "trade ravens that cannot tell whether the other raven landed before the telling one, so they go the same way either way.")
    nodes = {"1": (-90, "T1"), "2": (0, "T2"), "3": (90, "T3"), "4": (180, "T4")}
    panels = ((165, "ANOTHER TENT'S BUSINESS", None), (495, "THE SAME TENT'S BUSINESS", RED))
    for cx, title, fill in panels:
        F.text(cx, 24, title, cls="d-house", fill=fill)
        P = Polar(F, cx, 205, 40, 12, nodes)
        P.rings(7)
        P.road(6.8)
        P.node_boxes()
        P.flow_open(6.8)
        if fill is None:
            P.msg("4", 1, "3", 4, hi=True, short=True)
            P.msg("1", 1.5, "2", 3.5, short=True)
            for k, t in (("4", 1), ("1", 1.5), ("2", 3.5)):
                P.event(k, t, state="none")
            P.event("3", 4, hi=True, state="none")
            P.label("3", 4, "telling raven lands", side=-1, dist=10, fill=RED)
            P.label("2", 3.5, "another raven lands", side=1, dist=17)
        else:
            P.msg("4", 1.5, "1", 4.5, hi=True, short=True)
            P.msg("2", 1, "1", 2.5, short=True)
            P.msg("3", 2, "2", 3, short=True)
            P.msg("3", 4.5, "4", 5.5, short=True)
            for k, t in (("4", 1.5), ("2", 1), ("3", 2), ("3", 4.5), ("2", 3), ("4", 5.5)):
                P.event(k, t, state="none")
            P.event("1", 2.5, state="none")
            P.event("1", 4.5, hi=True, state="none")
            P.label("1", 2.5, "another raven lands", side=1, dist=10, anchor="start")
            P.label("1", 4.5, "telling raven lands", side=1, dist=10, fill=RED, anchor="start")
            P.label("1", 6.3, "goes quiet", side=1, dist=10, anchor="start")
        P.flow_close()
        if fill is None:
            F.text(cx, 372, "either may land first: the standing after both is the same,", fill=fill)
            F.text(cx, 388, "so it cannot be settled both ways", fill=fill)
        else:
            F.text(cx, 372, "the other three cannot tell which landed first,", fill=fill)
            F.text(cx, 388, "so they go the same way either way", fill=fill)
    F.divider(330, 10, 410)
    return F


# ---------------------------------------------------------------------------
# Agreeing When Messages Run Late
# ---------------------------------------------------------------------------

def late_turn():
    F = Fig("awl-turn", 660, 500,
            "One turn in still air, owned by tent 3, drawn in the round: four tents, later moments further out. "
            "Three shaded rings are the asking, calling and answering glasses. In the asking glass every man sends the owner "
            "the gates he can accept. In the calling glass the owner calls north to every tent. In the answering glass the "
            "others send pledged birds back. The owner, holding two or more pledged birds, sends going birds and goes north.")
    nodes = {"1": (180, "T1"), "2": (-90, "T2"), "3": (90, "T3"), "4": (0, "T4")}
    P = Polar(F, 330, 250, 40, 26, nodes)
    T = 6.6
    asking, calling, answering = (0.3, 2.2), (2.2, 4.2), (4.2, 6.2)
    P.rings(7)
    P.flow_open(T)
    P.span(*asking, OCHRE)
    P.span(*calling, OLIVE)
    P.span(*answering, OCHRE)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    P.label("3", 0, "owner", side=-1, dist=32, fill=RED)
    F.text(20, 30, "asking glass", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "calling glass", cls="d-key", anchor="start", fill=OLIVE)
    F.text(20, 66, "answering glass", cls="d-key", anchor="start", fill=OCHRE)
    P.flow_open(T)
    for k in "124":
        P.msg(k, 0.6, "3", 2.0, short=True)
        P.event(k, 0.6)
        P.msg("3", 2.5, k, 3.9, hi=True, short=True)
        P.event(k, 4.4)
        P.msg(k, 4.4, "3", 5.9, short=True)
    P.label("2", 0.6, "“I can accept north”", side=1, dist=10)
    P.event("3", 2.5, hi=True)
    P.label("3", 2.5, "calls north", side=-1, dist=10, fill=RED)
    P.label("1", 4.4, "pledges", side=1, dist=10)
    P.label("4", 4.4, "pledges", side=-1, dist=10)
    P.event("3", 6.1, hi=True, state="N")
    P.label("3", 6.1, "going birds; goes north", side=-1, dist=14, fill=RED)
    P.flow_close()
    return F


def _split(name, aria, notes, held):
    F = Fig(name, 660, 400, aria)
    nodes = {"1": (225, "T1"), "2": (135, "T2"), "3": (315, "T3"), "4": (45, "T4")}
    panels = (
        # cx, title, dead pair, gate of the left pair, gate of the right pair
        (112, "FIRST", "34", "N", None),
        (330, "SECOND", "12", None, "S"),
        (548, "THIRD", "", "N", "S"))
    for (cx, title, dead, gl, gr), note in zip(panels, notes):
        F.text(cx, 24, title, cls="d-house", fill=RED if not dead else None)
        P = Polar(F, cx, 175, 44, 7.6, nodes)
        P.rings(8)
        P.road(8.2, ends={k: 2.8 for k in dead})
        P.node_boxes()
        P.flow_open(8.2)
        for k in dead:
            P.dead(k, 2.8)
        for pair, gate in (("12", gl), ("34", gr)):
            if gate is None:
                continue
            a, b = pair
            P.msg(a, 2.8, b, 3.7, short=True)
            P.msg(b, 4.2, a, 5.1, short=True)
            for k, t in ((a, 2.8), (b, 3.7), (b, 4.2), (a, 5.1)):
                P.event(k, t, state="none")
            for k in pair:
                P.event(k, 6.4, hi=not dead, state=gate)
        if not dead:
            for a, b in (("2", "4"), ("4", "2"), ("1", "3"), ("3", "1")):
                P.msg(a, 3.0, b, 8.0, hi=True, short=True, dashed=True)
            x, y = P.at(90, 5.2)
            F.text(x, y + 4, held, cls="d-lbl d-halo", fill=RED)
        P.flow_close()
        for i, line in enumerate(note):
            F.text(cx, 306 + 16 * i, line, fill=RED if not dead else None)
    F.divider(221, 10, 390)
    F.divider(439, 10, 390)
    return F


def late_split():
    return _split(
        "awl-split",
        "Three panels, each with two pairs of tents: T1 and T2 on the left, T3 and T4 on the right, later moments further out. "
        "First: all sighted north, T3 and T4 are dead; T1 and T2 must go north. Second: all sighted south, T1 and T2 are dead; "
        "T3 and T4 must go south. Third: all alive, the left pair sighted north and the right pair south, and every bird between "
        "the pairs is held by the wind until both pairs have gone; each pair sees exactly what it saw before and goes to a different gate.",
        (("1 and 2 sighted north; 3 and 4", "dead at dusk. 1 and 2 go north:", "they cannot wait, two may be dead"),
         ("3 and 4 sighted south; 1 and 2", "dead at dusk. 3 and 4 go south:", "the same, pairs and gates swapped"),
         ("nobody dead, but the wind holds every", "bird between the pairs: each pair sees", "just what it saw before, and goes")),
        "held by the wind")


# ---------------------------------------------------------------------------
# Answering While Cut Off
# ---------------------------------------------------------------------------

def cutoff_nights():
    F = Fig("awco-nights", 660, 400,
            "Two panels drawn in the round. In each, one line stands for tents 1, 2 and 3 together and one for tent 4, with lost birds "
            "between them; later moments further out. Left, the first night: a man among tents 1 to 3 moves the standing gate to "
            "south and his birds to tent 4 are lost; later tent 4 asks which gate stands and answers north, which breaks answering as one. "
            "Right, the second night: nobody moves the gate; tent 4 asks and answers north, which is right. Tent 4's line is identical in both panels.")
    nodes = {"A": (-90, "T1–3"), "4": (90, "T4")}
    panels = ((165, "THE FIRST NIGHT", True), (495, "THE SECOND NIGHT", False))
    for cx, title, moved in panels:
        F.text(cx, 24, title, cls="d-house", fill=RED if moved else None)
        P = Polar(F, cx, 205, 40, 17, nodes, box=44)
        P.rings(6)
        P.road(6.4)
        P.node_boxes()
        P.flow_open(6.4)
        if moved:
            P.event("A", 1.4, hi=True, state="S")
            P.label("A", 1.4, "moves gate to south", side=1, dist=14, fill=RED)
        x, y = P.lost("A", 1.4, "4", 3.4, frac=.62, short=False, cw=False)
        F.text(x - 12, y + 4, "birds lost", cls="d-lbl d-halo", anchor="end")
        P.event("4", 4.8, state="N")
        P.label("4", 4.8, "asks; says “north”", side=-1, dist=12)
        P.flow_close()
        if moved:
            F.text(cx, 366, "the move was finished first;", fill=RED)
            F.text(cx, 382, "answering as one requires south", fill=RED)
        else:
            F.text(cx, 366, "“north” is right;")
            F.text(cx, 382, "tent 4's side is the same")
    F.divider(330, 10, 390)
    return F


def cutoff_recovery():
    F = Fig("awco-recovery", 660, 520,
            "Tent 4, tent 1 (the keeper of the standing gate) and tent 2, drawn in the round, later moments further out. "
            "A shaded ring marks the loss of birds around tent 4; birds between tents 1 and 2 still arrive. Number 4 moves the "
            "gate to south during the loss and is told it stands when his glass runs out; his birds are lost. After the loss ends his "
            "move is sent again, tent 1 numbers it and sends it to every tent, and a question at tent 2 after a span longer than t "
            "with no loss hears south.")
    nodes = {"4": (-90, "T4"), "1": (30, "T1"), "2": (150, "T2")}
    P = Polar(F, 330, 262, 36, 22, nodes)
    T = 8.8
    loss, quiet = (1.2, 3.6), (3.6, 7.6)
    P.rings(9)
    P.flow_open(T)
    P.span(*loss, RED, .10)
    P.span(*quiet, OLIVE, .08)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    P.label("1", 0, "keeper", side=-1, dist=34, fill=OLIVE, dy=8)
    F.text(20, 30, "birds lost around tent 4", cls="d-key", anchor="start", fill=RED)
    F.text(20, 48, "a span t with no loss", cls="d-key", anchor="start", fill=OLIVE)
    P.flow_open(T)
    # birds between tents 1 and 2 arrive throughout
    P.msg("1", 1.4, "2", 2.4, short=True)
    P.msg("2", 2.6, "1", 3.4, short=True)
    # tent 4 moves the gate; every bird from it is lost
    P.event("4", 1.8, hi=True, state="S")
    P.label("4", 1.8, "moves to south", side=1, dist=14, anchor="start", fill=RED)
    P.lost("4", 1.8, "1", 3.4, frac=.5)
    P.lost("4", 1.8, "2", 3.4, frac=.5)
    P.event("4", 3.3)
    P.label("4", 3.3, "glass out: “it stands”", side=-1, dist=12)
    # the loss ends: the move is sent again
    P.msg("4", 4.0, "1", 5.2, hi=True, short=True)
    P.event("1", 5.4, hi=True)
    P.label("1", 5.4, "numbers it: No. 7", side=-1, dist=12, fill=RED, dx=-6, dy=16)
    P.msg("1", 5.4, "2", 6.6, hi=True, short=True)
    P.msg("1", 5.4, "4", 6.6, hi=True, short=True)
    P.event("2", 6.6, hi=True)
    P.event("4", 6.6, hi=True)
    # a question after the span with no loss
    P.event("2", 8.2, state="S")
    P.label("2", 8.2, "asks: hears south", side=1, dist=12)
    P.flow_close()
    return F


# ---------------------------------------------------------------------------
# Keeping Order Among Liars
# ---------------------------------------------------------------------------

def order_entry():
    F = Fig("kol-entry", 660, 560,
            "The four posts drawn in the round, later moments further out. Number 2 files an entry with Number 1, who holds the job. "
            "Number 1 numbers it 7 and sends the numbering to all. Two shaded rings mark the echoes: Numbers 2 and 3 send first echoes to "
            "the others, then Numbers 1, 2 and 3 send second echoes to the others, and the entry stands at those three posts. "
            "Number 4's birds are pinned by the wind, and nobody waits for him.")
    nodes = {"1": (-90, "B1"), "2": (0, "B2"), "3": (90, "B3"), "4": (180, "B4")}
    P = Polar(F, 330, 280, 40, 26, nodes)
    T = 8.6
    first, second = (3.6, 5.2), (5.3, 6.9)
    P.rings(9)
    P.flow_open(T)
    P.span(*first, OCHRE)
    P.span(*second, OLIVE)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    P.label("1", 0, "holds the job", side=-1, dist=28, dy=-4)
    F.text(20, 30, "first echoes", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "second echoes", cls="d-key", anchor="start", fill=OLIVE)
    P.flow_open(T)
    # Number 2 files an entry; Number 1 numbers it and sends the numbering to all
    P.msg("2", 1.1, "1", 2.0, short=True)
    P.event("2", 1.1)
    P.label("2", 1.1, "files an entry", side=1, dist=12, anchor="start", dx=-6)
    P.event("1", 2.4, hi=True)
    P.label("1", 2.4, "no. 7", side=1, dist=0, fill=RED, anchor="middle", dy=20)
    P.msg("1", 2.4, "2", 3.4, hi=True, short=True)
    P.msg("1", 2.4, "3", 3.5, hi=True, short=True)
    P.msg("1", 2.4, "4", 8.4, hi=True, short=True, dashed=True)
    # first echoes from Numbers 2 and 3, second echoes from Numbers 1, 2 and 3
    for a in "23":
        P.event(a, 3.8)
        for b in "123":
            if b != a:
                P.msg(a, 3.8, b, 5.1, short=True)
    for a in "123":
        P.event(a, 5.5)
        for b in "123":
            if b != a:
                P.msg(a, 5.5, b, 6.8, short=True)
    for a in "123":
        P.event(a, 7.1, hi=True)
    P.label("1", 7.1, "stands", side=-1, dist=10, fill=RED)
    P.label("2", 7.1, "stands", side=-1, dist=10, fill=RED)
    P.label("3", 7.1, "stands", side=1, dist=10, fill=RED)
    P.label("4", 4.6, "birds pinned by the wind", side=-1, dist=10)
    P.flow_close()
    return F


# ---------------------------------------------------------------------------
# Telling the Dead from the Slow
# ---------------------------------------------------------------------------

def slate_split():
    return _split(
        "tdts-split",
        "Three panels, each with two pairs of tents: T1 and T2 on the left, T3 and T4 on the right, later moments further out. "
        "First: all sighted north, T3 and T4 are dead and chalked; T1 and T2 go north. Second: all sighted south, T1 and T2 are "
        "dead and chalked; T3 and T4 go south. Third: all alive, the left pair sighted north and the right pair south; every bird "
        "between the pairs is slow, each pair chalks the other, and each goes to a different gate.",
        (("1 and 2 sighted north; 3 and 4", "dead at dusk, chalked. 1 and 2", "go north without them"),
         ("3 and 4 sighted south; 1 and 2", "dead at dusk, chalked. 3 and 4", "go south without them"),
         ("nobody dead, but every bird between the", "pairs is slow: each pair chalks the", "other, and goes to a different gate")),
        "slow birds")


# ---------------------------------------------------------------------------
# One Leader at a Time
# ---------------------------------------------------------------------------

def board_passes():
    F = Fig("olt-board", 660, 560,
            "The five legislators under one board, drawn in the round, later moments further out. Okios holds the podium and writes "
            "lines 11 and 12. Runners carry them in order to Liskovia and Kleon, who both answer that they hold everything up to "
            "line 12; when the second answer reaches Okios, line 12 passes and he answers the petitioner. Melissa's runner arrives "
            "long afterwards. Theron has stepped out and his runner is still waiting.")
    nodes = {"O": (-90, "OKIOS"), "L": (-18, "LISK."), "K": (54, "KLEON"), "M": (126, "MEL."), "T": (198, "THERON")}
    P = Polar(F, 330, 290, 72, 20, nodes, box=54)
    T = 8.4
    P.rings(8)
    P.road(T)
    P.node_boxes()
    P.flow_open(T)
    # Okios writes lines 11 and 12; runners carry them in order
    P.event("O", 1.0)
    P.label("O", 1.0, "line 11", side=-1, dist=10)
    P.event("O", 1.6)
    P.label("O", 1.6, "line 12", side=-1, dist=10)
    P.msg("O", 1.0, "L", 2.4, short=True)
    P.msg("O", 1.6, "L", 3.0, short=True)
    P.msg("O", 1.0, "K", 3.0, short=True)
    P.msg("O", 1.6, "K", 3.6, short=True)
    # Liskovia and Kleon answer: they hold everything up to line 12
    P.event("L", 3.1)
    P.label("L", 3.1, "holds to 12", side=1, dist=10)
    P.event("K", 3.7)
    P.label("K", 3.7, "holds to 12", side=1, dist=10)
    P.msg("L", 3.1, "O", 4.6, short=True)
    P.msg("K", 3.7, "O", 5.6, short=True)
    # the second answer arrives: line 12 passes
    P.event("O", 5.8, hi=True)
    P.label("O", 5.8, "line 12 passes", side=-1, dist=10, fill=RED)
    P.radial_arrow("O", 6.2, 7.8, 4, hi=True)
    P.label("O", 7.0, "to the petitioner", side=1, dist=22, fill=RED, anchor="start")
    # the slow ones
    P.msg("O", 1.6, "M", 7.4, short=True)
    P.event("M", 7.6)
    P.label("M", 7.6, "lines 11–12, late", side=-1, dist=10)
    P.msg("O", 1.6, "T", 8.3, short=True, dashed=True)
    P.label("T", 3.0, "stepped out", side=-1, dist=10)
    P.label("T", 8.3, "runner waits", side=1, dist=10)
    P.flow_close()
    return F


# ---------------------------------------------------------------------------
# The Part-Time Parliament
# ---------------------------------------------------------------------------

PRIESTS = {"A": (-90, "Α"), "B": (-18, "Β"), "G": (54, "Γ"), "D": (126, "Δ"), "E": (198, "Ε")}


def _ballot(P, init, t0, targets, quorum, lost=(), carry=None, gap=1.2, ask=True, success=True):
    """One ballot, steps 1 to 6: NextBallot out, LastVote back, BeginBallot to the quorum, Voted back, Success to all.
    `ask=False` starts at step 3 (the promises are already in), `success=False` stops when the initiator writes the decree."""
    others = [k for k in "ABGDE" if k != init]
    t1 = t0 + gap
    live = [k for k in others if k in targets and k not in lost]
    if ask:
        P.event(init, t0)
        for k in others:
            if k in targets:
                if k in lost:
                    P.lost(init, t0, k, t1, frac=.6, short=True)
                else:
                    P.msg(init, t0, k, t1, short=True)
        for i, k in enumerate(live):
            P.event(k, t1)
            P.msg(k, t1, init, t1 + gap + .12 * i, hi=(k == carry), short=True)
        t2 = t1 + gap + .12 * len(live) + .5
    else:
        t2 = t0
    P.event(init, t2, hi=True)
    q = [k for k in quorum if k != init]
    for k in q:
        P.msg(init, t2, k, t2 + gap, short=True)
    t3 = t2 + gap
    for i, k in enumerate(q):
        P.event(k, t3)
        P.msg(k, t3, init, t3 + gap + .12 * i, short=True)
    t4 = t3 + gap + .12 * len(q) + .5
    P.event(init, t4, hi=True)
    if success:
        for k in [k for k in others if k not in lost]:
            P.msg(init, t4, k, t4 + gap, hi=True, short=True)
            P.event(k, t4 + gap, hi=True)
    return dict(t0=t0, t1=t1, t2=t2, t3=t3, t4=t4, end=t4 + gap)


def parl_steps():
    F = Fig("ptp-steps", 660, 600,
            "One ballot of the basic protocol, drawn in the round: the five priests Α, Β, Γ, Δ, Ε, later moments further out. "
            "Γ begins a ballot and sends NextBallot to the others; Ε's scroll is lost. Α, Β and Δ promise and send LastVote back. "
            "Γ, having a majority of replies, fixes the decree by condition B3 and sends BeginBallot to the quorum Α, Β, Δ. They vote and "
            "send Voted back. With every quorum member's vote in, Γ writes the decree and sends Success to all, and each priest writes it.")
    P = Polar(F, 330, 305, 62, 22, PRIESTS, box=30)
    T = 9.6
    P.rings(10)
    P.flow_open(T)
    P.span(1.0, 3.8, OCHRE)
    P.span(4.0, 7.3, OLIVE)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    F.text(20, 30, "steps 1–2: promises", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "steps 3–5: the vote", cls="d-key", anchor="start", fill=OLIVE)
    P.flow_open(T)
    r = _ballot(P, "G", 1.2, "ABDE", "ABD", lost="E", gap=1.0)
    P.label("G", r["t0"], "1", side=-1, dist=12, size=11)
    P.badge("G", r["t0"], 1, INK, -1, dist=20)
    P.badge("A", r["t1"], 2, INK, 1, dist=20)
    P.badge("G", r["t2"], 3, RED, -1, dist=20)
    P.badge("B", r["t3"], 4, INK, -1, dist=20)
    P.badge("G", r["t4"], 5, RED, -1, dist=20)
    P.badge("A", r["end"], 6, RED, -1, dist=20)
    P.flow_close()
    return F


def parl_wander():
    F = Fig("ptp-wander", 660, 560,
            "The wanderers, drawn in the round: Δ and Ε have left for a banquet, so their lines end in crosses. Β begins a ballot; "
            "the scrolls to Δ and Ε are lost. Α and Γ, with Β, are a majority; they promise, vote, and the decree passes and is "
            "written by Α, Β and Γ. Δ and Ε learn nothing.")
    P = Polar(F, 330, 290, 62, 24, PRIESTS, box=30)
    T = 8.6
    P.rings(9)
    P.road(T, ends={"D": 1.0, "E": 1.0})
    P.node_boxes()
    P.flow_open(T)
    P.dead("D", 1.0)
    P.dead("E", 1.0)
    r = _ballot(P, "B", 1.2, "ACGDE".replace("C", ""), "AG", lost="DE", gap=1.1)
    P.label("D", 1.0, "at the banquet", side=-1, dist=14)
    P.label("B", r["t0"], "begins", side=-1, dist=12)
    P.label("B", r["t4"], "passes", side=-1, dist=12, fill=RED)
    P.flow_close()
    return F


def parl_duel():
    F = Fig("ptp-duel", 660, 540,
            "Two would-be presidents, drawn in the round. Α begins ballot 1 with Β and Γ, who promise and reply. Before Α can use the replies, "
            "Ε begins the higher ballot 2 with everyone, and Β and Γ promise ballot 2. Α then sends BeginBallot for ballot 1, and Β and Γ ignore it, "
            "having promised a higher ballot.")
    P = Polar(F, 330, 280, 62, 24, PRIESTS, box=30)
    T = 7.6
    P.rings(8)
    P.road(T)
    P.node_boxes()
    P.flow_open(T)
    P.event("A", 1.0)
    P.label("A", 1.0, "ballot 1", side=1, dist=10)
    for k in "BG":
        P.msg("A", 1.0, k, 2.2, short=True)
        P.event(k, 2.2)
        P.msg(k, 2.2, "A", 3.7 + (.15 if k == "G" else 0), short=True)
    P.label("B", 2.2, "promise 1", side=-1, dist=10)
    P.event("E", 1.6, hi=True)
    P.label("E", 1.6, "ballot 2", side=-1, dist=10, fill=RED)
    for k in "ADBG":
        P.msg("E", 1.6, k, 2.6 if k in "AD" else 4.3, hi=True, short=True)
    for k in "BG":
        P.event(k, 4.5, hi=True)
    P.label("G", 4.5, "promise 2", side=1, dist=10, fill=RED)
    P.event("A", 4.6)
    P.label("A", 4.6, "begins ballot 1", side=1, dist=10)
    for k in "BG":
        P.refused("A", 4.6, k, 6.4)
    P.label("G", 6.4, "ignored: promised 2", side=1, dist=14)
    P.flow_close()
    return F


def parl_theorem():
    F = Fig("ptp-theorem", 660, 620,
            "Theorem 1 live, drawn in the round. Γ's ballot passes a decree with the quorum Α, Β, Γ. Later Ε, wanting a different decree, "
            "begins a new ballot with Β, Γ and Δ. Β's reply carries his vote for the first decree, because Ε's majority must overlap the "
            "first quorum. Condition B3 then forces Ε to propose that decree, and it passes again.")
    P = Polar(F, 330, 305, 62, 20, PRIESTS, box=30)
    T = 11.4
    P.rings(12)
    P.flow_open(T)
    P.span(1.0, 6.0, OCHRE, .10)
    P.span(6.6, 11.4, OLIVE, .10)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    F.text(20, 30, "the first ballot (Γ's)", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "the second ballot (Ε's)", cls="d-key", anchor="start", fill=OLIVE)
    P.flow_open(T)
    r1 = _ballot(P, "G", 1.2, "AB", "AB", gap=.85, success=False)
    P.label("G", r1["t4"], "goats pass", side=-1, dist=12, fill=RED)
    r2 = _ballot(P, "E", 6.9, "BGD", "BGD", carry="B", gap=.85, success=False)
    P.label("B", r2["t1"], "carries the goat vote", side=-1, dist=10, fill=RED)
    P.label("E", r2["t2"], "B3: must propose goats", side=1, dist=10, fill=RED)
    P.label("E", r2["t4"], "goats pass again", side=1, dist=10, fill=RED)
    P.flow_close()
    return F


def parl_ledger():
    F = Fig("ptp-ledger", 660, 620,
            "The new president's Monday morning, drawn in the round. Δ, newly elected, sends one message about every undecided number to the others. "
            "The replies show Α holds decree 126, but nobody reachable knows anything of 125. Δ runs a ballot for 125 with the olive-day decree, and it passes. "
            "Only then does he run the ballot for the citizen's decree, 127, which passes after everything already in the book.")
    P = Polar(F, 330, 305, 62, 20, PRIESTS, box=30)
    T = 11.4
    P.rings(12)
    P.flow_open(T)
    P.span(1.0, 3.6, OCHRE, .10)
    P.span(4.2, 7.4, OLIVE, .10)
    P.span(8.0, 11.2, OCHRE, .10)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    F.text(20, 30, "the morning's reconciliation", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "decree 125: the olive day", cls="d-key", anchor="start", fill=OLIVE)
    F.text(20, 66, "decree 127: the citizen's", cls="d-key", anchor="start", fill=OCHRE)
    P.flow_open(T)
    P.event("D", 1.0)
    for k in "ABG":
        P.msg("D", 1.0, k, 2.0, short=True)
        P.event(k, 2.0)
    for i, k in enumerate("ABG"):
        P.msg(k, 2.0, "D", 3.1 + .15 * i, hi=(k == "A"), short=True)
    P.label("A", 2.0, "holds 126", side=-1, dist=10, fill=RED)
    P.event("D", 3.9, hi=True)
    P.label("D", 3.9, "nobody knows 125", side=-1, dist=10, fill=RED)
    r = _ballot(P, "D", 4.6, "ABG", "ABG", gap=.8, ask=False, success=False)
    P.label("D", r["t4"], "125 passes", side=-1, dist=10, fill=RED)
    r2 = _ballot(P, "D", 8.2, "ABG", "ABG", gap=.8, ask=False, success=False)
    P.label("D", r2["t4"], "127 passes, in order", side=-1, dist=10, fill=RED)
    P.flow_close()
    return F


# ---------------------------------------------------------------------------
# Agreeing Among Liars
# ---------------------------------------------------------------------------

def liars_worlds():
    F = Fig("aal-worlds", 660, 420,
            "Two panels, each with the chief at B1 and two guards at B2 and B3, later moments further out. Left: the chief is honest "
            "and sends hold to both guards; B3 lies and tells B2 he was sent scatter. Right: the chief lies and sends hold to B2 and "
            "scatter to B3; B3 is honest and tells B2, truthfully, that he was sent scatter. B2 receives exactly the same two slips in both.")
    nodes = {"1": (-90, "B1"), "2": (150, "B2"), "3": (30, "B3")}
    for cx, title, liar, second in ((165, "CHIEF HONEST", "3", "hold"), (495, "CHIEF LIES", "1", "scatter")):
        F.text(cx, 24, title, cls="d-house")
        P = Polar(F, cx, 200, 44, 14, nodes)
        P.rings(7)
        P.road(7.4)
        P.node_boxes()
        P.flow_open(7.4)
        P.msg("1", 0.8, "2", 2.2, short=True)
        P.msg("1", 0.8, "3", 2.3, hi=False, short=True)
        P.event("1", 0.8)
        P.event("3", 2.3)
        P.msg("3", 3.0, "2", 4.6, short=True)
        P.event("3", 3.0)
        P.event("2", 2.2, hi=True)
        P.event("2", 4.6, hi=True)
        if liar == "1":
            P.label("1", 0, "liar", side=-1, dist=30, fill=RED, dy=-4)
        else:
            P.label("3", 0, "liar", side=1, dist=30, fill=RED, dy=-4)
        P.label("2", 2.2, "hold", side=-1, dist=10, anchor="end", cls="d-num d-halo")
        P.label("3", 2.3, second, side=1, dist=10, anchor="start", cls="d-num d-halo")
        P.flow_close()
        x, y = P.at(90, 5.6)
        F.text(cx, y + 18, "“he sent me scatter”", cls="d-lbl d-halo", anchor="middle", fill=BLUE)
    F.text(165, 372, "so this guard must hold", fill=RED)
    F.text(495, 372, "so he holds, and the other scatters", fill=RED)
    F.text(330, 404, "the same two slips reach him in both: nothing tells him which hill he is on")
    F.divider(330, 10, 386)
    return F


def liars_repeat():
    F = Fig("aal-repeat", 660, 560,
            "The chief at B1 and three guards at B2, B3 and B4, drawn in the round, later moments further out. In the first round "
            "(shaded ochre) the chief sends a slip to each guard. In the second round (shaded olive) each guard repeats to the other two "
            "what the chief sent him. Each guard then holds three accounts and takes the greater count of them.")
    nodes = {"1": (-90, "B1"), "2": (0, "B2"), "3": (90, "B3"), "4": (180, "B4")}
    P = Polar(F, 330, 280, 40, 26, nodes)
    T = 8.6
    first, second = (0.7, 3.0), (3.3, 6.3)
    P.rings(9)
    P.flow_open(T)
    P.span(*first, OCHRE)
    P.span(*second, OLIVE)
    P.flow_close()
    P.road(T)
    P.node_boxes()
    P.label("1", 0, "the chief", side=-1, dist=28, dy=-4)
    F.text(20, 30, "first round", cls="d-key", anchor="start", fill=OCHRE)
    F.text(20, 48, "second round", cls="d-key", anchor="start", fill=OLIVE)
    P.flow_open(T)
    P.event("1", 1.0)
    for k in "234":
        P.msg("1", 1.0, k, 2.6, short=True)
    for k in "234":
        P.event(k, 3.5)
        for o in "234":
            if o != k:
                P.msg(k, 3.5, o, 5.9, short=True)
    for k in "234":
        P.event(k, 6.7, hi=True)
    P.label("2", 6.7, "same", side=1, dist=10, fill=RED)
    P.label("3", 6.7, "count", side=1, dist=10, fill=RED)
    P.label("4", 6.7, "greater", side=-1, dist=10, fill=RED)
    P.flow_close()
    F.text(330, 526, "each guard then holds three accounts and takes the greater count of them", fill=RED)
    F.text(330, 546, "a liar in the chief's place may send something different to each guard", cls="d-note")
    return F


def liars_sealed():
    F = Fig("aal-sealed", 660, 500,
            "The chief at B1 and two guards at B2 and B3, drawn in the round, later moments further out. The chief lies: he seals hold "
            "to B2 and scatter to B3. Each guard adds his seal and passes the order across to the other. Both guards then hold the same "
            "two orders, both under the chief's seal, so both go the same way, and the chief has convicted himself.")
    nodes = {"1": (-90, "B1"), "2": (150, "B2"), "3": (30, "B3")}
    P = Polar(F, 330, 250, 44, 26, nodes)
    T = 7.4
    P.rings(8)
    P.road(T)
    P.node_boxes()
    P.label("1", 0, "the chief lies", side=1, dist=26, fill=RED, anchor="start", dy=-6)
    P.flow_open(T)
    P.event("1", 1.0, hi=True)
    P.msg("1", 1.0, "2", 2.6, hi=True, short=True)
    P.msg("1", 1.0, "3", 2.8, hi=True, short=True)
    P.label("2", 2.6, "hold : 1", side=-1, dist=12, fill=BLUE, anchor="end", dy=8, cls="d-num d-halo")
    P.label("3", 2.8, "scatter : 1", side=1, dist=12, fill=BLUE, anchor="start", dy=8, cls="d-num d-halo")
    P.event("2", 3.3)
    P.event("3", 3.4)
    P.msg("2", 3.3, "3", 5.2, short=True)
    P.msg("3", 3.4, "2", 5.3, short=True)
    P.label("3", 5.2, "hold : 1 : 2", side=-1, dist=10, fill=BLUE, anchor="start", cls="d-num d-halo")
    P.label("2", 5.3, "scatter : 1 : 3", side=1, dist=10, fill=BLUE, anchor="end", cls="d-num d-halo")
    P.event("2", 5.8, hi=True)
    P.event("3", 5.9, hi=True)
    P.flow_close()
    F.text(330, 456, "both sheaves hold the same two orders, so both men go the same way")
    F.text(330, 476, "and the chief's seal on two orders convicts him, of lying and of nothing else", fill=RED)
    return F


# ---------------------------------------------------------------------------
# Changing Leaders Among Liars
# ---------------------------------------------------------------------------

def leaders_stage():
    F = Fig("cla-stage", 660, 420,
            "Two panels with the four bandits B1 to B4 drawn in the round, later moments further out. Left: in one stage every man sends "
            "to every other man, twelve birds. Right: the three other men send their sealed votes to the holder, B1, who ties three into "
            "a bundle and sends it to the other three.")
    nodes = {"1": (225, "B1"), "2": (135, "B2"), "3": (315, "B3"), "4": (45, "B4")}
    for cx, title in ((165, "EVERY MAN TO EVERY MAN"), (495, "VOTES TO ONE, BUNDLE TO ALL")):
        F.text(cx, 24, title, cls="d-house")
    P = Polar(F, 165, 205, 46, 14, nodes)
    P.rings(6)
    P.road(6.2)
    P.node_boxes()
    P.flow_open(6.2)
    for a in "1234":
        P.event(a, 1.0)
        for b in "1234":
            if b != a:
                P.msg(a, 1.0, b, 4.6, short=True)
    P.flow_close()
    Q = Polar(F, 495, 205, 46, 14, nodes)
    Q.rings(6)
    Q.road(6.2)
    Q.node_boxes()
    Q.flow_open(6.2)
    Q.label("1", 0, "holder", side=-1, dist=30, fill=RED, dy=-6)
    for a in "234":
        Q.event(a, 1.0)
        Q.msg(a, 1.0, "1", 2.6, short=True)
    Q.event("1", 3.2, hi=True)
    Q.label("1", 3.2, "ties three", side=1, dist=10, fill=RED, dy=-6)
    for b in "234":
        Q.msg("1", 3.2, b, 5.6, hi=True, short=True)
    Q.flow_close()
    F.text(165, 376, "twelve birds a stage")
    F.text(495, 376, "three votes in, three bundles out")
    F.divider(330, 10, 396)
    return F


def leaders_chain():
    F = Fig("cla-chain", 660, 560,
            "The four posts drawn in the round, later moments further out. The job passes to the next man with every entry: term 5 at B1, "
            "term 6 at B2, term 7 at B3, term 8 at B4, each proposal carrying the bundle for the entry directly before it, so the chain "
            "winds outward round the circle. With the proposal of term 8, the entry of term 7 has its first bundle, term 6's is locked on, "
            "and term 5's stands.")
    nodes = {"1": (-90, "B1"), "2": (0, "B2"), "3": (90, "B3"), "4": (180, "B4")}
    P = Polar(F, 330, 280, 40, 26, nodes)
    T = 8.6
    terms = (("1", 1.2, "5", "stands", RED), ("2", 3.0, "6", "locked on", INK),
             ("3", 4.8, "7", "first bundle", INK), ("4", 6.6, "8", "new proposal", INK))
    P.rings(9)
    P.road(T)
    P.node_boxes()
    P.flow_open(T)
    for (a, ta, *_), (b, tb, *_) in zip(terms, terms[1:]):
        P.msg(a, ta, b, tb, short=False)
    for k, t, n, word, col in terms:
        P.event(k, t, hi=(col == RED))
        P.badge(k, t, n, col, side=-1 if k in "14" else 1, dist=17)
    P.label("1", 1.2, "stands", side=-1, dist=38, fill=RED)
    P.label("2", 3.0, "locked on", side=-1, dist=38)
    P.label("3", 4.8, "first bundle", side=-1, dist=38)
    P.label("4", 6.6, "new proposal", side=1, dist=38)
    P.flow_close()
    F.text(330, 536, "each arc is the bundle an entry carries for the one directly before it", cls="d-note")
    return F


FIGURES = {
    "books/ordering-without-clocks/index.html": [ordering_spacetime],
    "books/taking-stock-without-stopping/index.html": [stock_sash, stock_cuts],
    "books/many-copies-acting-as-one/index.html": [copies_overlap, copies_loop],
    "books/the-limits-of-agreement/index.html": [limits_fold, limits_silent, limits_defer],
    "books/agreeing-when-messages-run-late/index.html": [late_turn, late_split],
    "books/answering-while-cut-off/index.html": [cutoff_nights, cutoff_recovery],
    "books/keeping-order-among-liars/index.html": [order_entry],
    "books/telling-the-dead-from-the-slow/index.html": [slate_split],
    "books/one-leader-at-a-time/index.html": [board_passes],
    "books/agreeing-among-liars/index.html": [liars_worlds, liars_repeat, liars_sealed],
    "books/changing-leaders-among-liars/index.html": [leaders_stage, leaders_chain],
    "books/the-part-time-parliament/index.html": [parl_steps, parl_wander, parl_duel, parl_theorem, parl_ledger],
}

# A figure not yet in its book takes the place of the nth flat <figure class="diagram">.
LEGACY = {"awl-turn": 0, "awl-split": 1, "awco-nights": 0, "awco-recovery": 1, "kol-entry": 0, "tdts-split": 0, "olt-board": 0,
          "aal-worlds": 0, "aal-repeat": 1, "aal-sealed": 2, "cla-stage": 0, "cla-chain": 1}
SCRIPT = '<script src="../../assets/js/flow.js" defer></script>\n'


def splice(html, fig):
    body = "\n".join("      " + l if l else "" for l in fig.svg().split("\n"))
    pat = re.compile(r"      <svg [^>]*>\s*<!-- polar:" + re.escape(fig.name) + r" -->.*?</svg>", re.S)
    html, n = pat.subn(lambda m: body, html, count=1)
    if n == 0 and fig.name in LEGACY:
        figs = [m.start() for m in re.finditer(r'<figure class="diagram">', html)]
        start = figs[LEGACY[fig.name]]
        old = re.compile(r"      <svg .*?</svg>", re.S).search(html, start)
        html, n = html[:old.start()] + body + html[old.end():], 1
    if n != 1:
        raise SystemExit(f"no <svg> marked polar:{fig.name}")
    return html


def main():
    for rel, figs in FIGURES.items():
        p = ROOT / rel
        html = p.read_text()
        for make in figs:
            html = splice(html, make())
        if "flow.js" not in html:
            html = html.replace("</body>", SCRIPT + "</body>", 1)
        p.write_text(html)
        print(rel, len(figs))


if __name__ == "__main__":
    main()
