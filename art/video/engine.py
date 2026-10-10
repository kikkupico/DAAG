"""A tiny 3Blue1Brown-style drawing engine on Pillow.

Logical canvas is 1920x1080; everything is drawn at SS x supersampling and boxed down.
Fades are done by blending a colour toward the flat background, so no alpha layers are needed.
"""
import math
from PIL import Image, ImageDraw, ImageFont

W, H, SS = 1920, 1080, 2
BG = (17, 18, 24)
WHITE, GREY, DIM = (236, 236, 240), (140, 144, 156), (62, 65, 76)
CYAN, CORAL, YELLOW, GREEN = (88, 196, 221), (252, 110, 80), (255, 225, 80), (131, 193, 103)
# Mercenaries by tent number: exact tints from art/world-prompt.md 2.3, plus lighter strokes for the dark ground.
TENT = {1: (184, 133, 41), 2: (31, 56, 133), 3: (115, 20, 20), 4: (84, 97, 36)}
TENTL = {1: (236, 180, 60), 2: (100, 146, 240), 3: (226, 86, 78), 4: (156, 182, 72)}

FONT_DIR = "/System/Library/Fonts/Supplemental/"
_fonts = {}


def font(kind, px):
    key = (kind, px)
    if key not in _fonts:
        path = FONT_DIR + ("STIXTwoText-Italic.ttf" if kind == "i" else "STIXTwoText.ttf")
        f = ImageFont.truetype(path, px)
        if kind == "b":
            try:
                f.set_variation_by_name("Bold")
            except Exception:
                pass
        _fonts[key] = f
    return _fonts[key]


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ph(t, t0, d=0.8):
    """Smooth 0..1 ramp starting at t0."""
    return ease((t - t0) / d) if d > 0 else (1.0 if t >= t0 else 0.0)


def lerp(a, b, u):
    return a + (b - a) * u


def lerp2(p, q, u):
    return (lerp(p[0], q[0], u), lerp(p[1], q[1], u))


def mix(c1, c2, u):
    return tuple(round(lerp(c1[i], c2[i], u)) for i in range(3))


def pol(cx, cy, r, deg):
    return (cx + r * math.cos(math.radians(deg)), cy - r * math.sin(math.radians(deg)))


def prefix(pts, frac):
    """First `frac` of a polyline by length."""
    if frac >= 1:
        return list(pts)
    if frac <= 0:
        return [pts[0]]
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    goal, out = sum(seg) * frac, [pts[0]]
    for i, s in enumerate(seg):
        if goal >= s:
            out.append(pts[i + 1])
            goal -= s
        else:
            out.append(lerp2(pts[i], pts[i + 1], goal / s if s else 0))
            break
    return out


def along(pts, frac):
    """Point and heading (degrees, screen) at `frac` along a polyline."""
    p = prefix(pts, max(frac, 1e-4))
    a, b = (p[-2], p[-1]) if len(p) > 1 else (pts[0], pts[1])
    return p[-1], math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


class Cv:
    def __init__(self, scale=1.0, g=1.0):
        self.s = scale
        self.k = scale * SS
        self.g = g
        self.im = Image.new("RGB", (round(W * self.k), round(H * self.k)), BG)
        self.d = ImageDraw.Draw(self.im)

    def c(self, col, a=1.0):
        a = max(0.0, min(1.0, a * self.g))
        return tuple(round(BG[i] + (col[i] - BG[i]) * a) for i in range(3))

    def P(self, p):
        return (p[0] * self.k, p[1] * self.k)

    def line(self, pts, col, w=4, a=1.0, dash=None, cap=True):
        if a <= 0 or len(pts) < 2:
            return
        col = self.c(col, a)
        if dash:
            on, off = dash
            run, drawing, cur = 0.0, True, [pts[0]]
            for i in range(len(pts) - 1):
                p, q = pts[i], pts[i + 1]
                L = math.dist(p, q)
                pos = 0.0
                while pos < L:
                    lim = on if drawing else off
                    step = min(lim - run, L - pos)
                    pos += step
                    run += step
                    pt = lerp2(p, q, pos / L if L else 0)
                    if drawing:
                        self.d.line([self.P(cur[-1]), self.P(pt)], fill=col, width=max(1, round(w * self.k)))
                    cur = [pt]
                    if run >= lim - 1e-9:
                        run, drawing = 0.0, not drawing
            return
        self.d.line([self.P(p) for p in pts], fill=col, width=max(1, round(w * self.k)), joint="curve")
        if cap:
            r = w / 2
            for p in (pts[0], pts[-1]):
                x, y = self.P(p)
                self.d.ellipse([x - r * self.k, y - r * self.k, x + r * self.k, y + r * self.k], fill=col)

    def circle(self, x, y, r, fill=None, outline=None, w=3, a=1.0):
        if a <= 0 or r <= 0:
            return
        X, Y, R = x * self.k, y * self.k, r * self.k
        self.d.ellipse([X - R, Y - R, X + R, Y + R],
                       fill=self.c(fill, a) if fill else None,
                       outline=self.c(outline, a) if outline else None,
                       width=max(1, round(w * self.k)))

    def poly(self, pts, fill=None, outline=None, w=3, a=1.0):
        if a <= 0:
            return
        P = [self.P(p) for p in pts]
        if fill:
            self.d.polygon(P, fill=self.c(fill, a))
        if outline:
            self.line(list(pts) + [pts[0]], outline, w, a, cap=False)

    def rrect(self, x0, y0, x1, y1, r=14, fill=None, outline=None, w=3, a=1.0):
        if a <= 0:
            return
        self.d.rounded_rectangle([x0 * self.k, y0 * self.k, x1 * self.k, y1 * self.k], radius=r * self.k,
                                 fill=self.c(fill, a) if fill else None,
                                 outline=self.c(outline, a) if outline else None,
                                 width=max(1, round(w * self.k)))

    def text(self, x, y, s, size=36, col=WHITE, a=1.0, anchor="mm", kind="r"):
        if a <= 0 or not s:
            return
        self.d.text((x * self.k, y * self.k), s, font=font(kind, round(size * self.k)),
                    fill=self.c(col, a), anchor=anchor)

    def width(self, s, size, kind="r"):
        return font(kind, round(size * self.k)).getlength(s) / self.k

    def rich(self, x, y, parts, size=36, a=1.0, kind="r"):
        """Centered row of (text, colour) pieces."""
        tot = sum(self.width(s, size, kind) for s, _ in parts)
        cx = x - tot / 2
        for s, col in parts:
            self.text(cx, y, s, size, col, a, "lm", kind)
            cx += self.width(s, size, kind)

    def wrap(self, s, size, width, kind="r"):
        lines, cur = [], ""
        for w in s.split():
            trial = (cur + " " + w).strip()
            if self.width(trial, size, kind) <= width or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def para(self, x, y, s, size=30, col=WHITE, width=500, a=1.0, anchor="mm", lead=1.3, kind="r"):
        lines = self.wrap(s, size, width, kind)
        y0 = y - (len(lines) - 1) * size * lead / 2
        for i, ln in enumerate(lines):
            self.text(x, y0 + i * size * lead, ln, size, col, a, anchor, kind)

    def arrow(self, p, q, col=WHITE, w=4, a=1.0, head=16, dash=None, frac=1.0):
        q2 = lerp2(p, q, frac)
        self.line([p, q2], col, w, a, dash, cap=False)
        if frac >= 0.999:
            ang = math.atan2(q[1] - p[1], q[0] - p[0])
            tip = q
            l, r = (tip[0] - head * math.cos(ang - 0.45), tip[1] - head * math.sin(ang - 0.45)), \
                   (tip[0] - head * math.cos(ang + 0.45), tip[1] - head * math.sin(ang + 0.45))
            self.poly([tip, l, r], fill=col, a=a)

    def check(self, x, y, s=1.0, col=GREEN, a=1.0, w=7):
        self.line([(x - 18 * s, y), (x - 5 * s, y + 14 * s), (x + 20 * s, y - 16 * s)], col, w, a)

    def cross(self, x, y, s=1.0, col=CORAL, a=1.0, w=7):
        self.line([(x - 15 * s, y - 15 * s), (x + 15 * s, y + 15 * s)], col, w, a)
        self.line([(x - 15 * s, y + 15 * s), (x + 15 * s, y - 15 * s)], col, w, a)

    def out(self):
        size = (round(W * self.s), round(H * self.s))
        return self.im.resize(size, Image.BOX)


# ---- pieces of the world ---------------------------------------------------------------

def tent(cv, n, x, y, s=1.0, a=1.0, silent=False):
    if silent:
        fill, rim, txt = (36, 38, 46), (96, 98, 108), (110, 112, 122)
    else:
        fill, rim, txt = TENT[n], TENTL[n], WHITE
    cv.poly([(x - 34 * s, y + 24 * s), (x + 34 * s, y + 24 * s), (x, y - 32 * s)], fill, rim, 3, a)
    cv.text(x, y + 9 * s, str(n), round(26 * s), txt, a)


def raven(cv, x, y, s=1.0, ang=0.0, col=WHITE, a=1.0, flap=0.0):
    """A gull-stroke bird: two swept wings and a body, flapping with `flap` in -1..1."""
    s = s * 1.8
    w = -9 - 6 * flap
    pts = [(-20, -3 + 2 * flap), (-10, w), (0, 0), (10, w), (20, -3 + 2 * flap)]
    out = [(x + s * px, y + s * py) for px, py in pts]  # the gull stroke reads at any heading, so it is not rotated
    cv.line(out, col, max(3.0, 3.6 * s), a)
    cv.circle(x, y, 3.2 * s, fill=col, a=a)


def dot(cv, x, y, r=16, state=None, a=1.0, col=None):
    """Commitment dot: hollow (undecided) or filled with H/A."""
    if state is None:
        cv.circle(x, y, r, outline=col or GREY, w=3, a=a)
    else:
        c = CYAN if state == "H" else CORAL
        cv.circle(x, y, r, fill=c, a=a)
        cv.text(x, y + 1, state, round(r * 1.25), BG, a, kind="b")
