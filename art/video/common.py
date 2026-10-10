"""Shared look and machinery for the Limits of Agreement film (manim).

Film.say() puts a subtitle on screen without stopping the animation; the subtitle fades itself in and out
on a clock of its own. Film.wait_cap() waits until the current subtitle has had its time.
"""
import json
import math
import os
import textwrap

from manim import *

config.background_color = "#0c0e12"
SERIF = "STIX Two Text"

# Mercenaries by tent number: exact tints from art/world-prompt.md 2.3, with lighter strokes for the dark ground.
TENT = {1: "#B88529", 2: "#1F3885", 3: "#731414", 4: "#546124"}
TENTL = {1: "#ECB43C", 2: "#6492F0", 3: "#E2564E", 4: "#9CB648"}
HOLD, ATTACK, OPEN, OK = "#58C4DD", "#FC6E50", "#F7D96F", "#83C167"
DIMC, SOFT = "#3a3e4a", "#8c90a0"
ANG = {1: 135, 2: 45, 3: 315, 4: 225}  # tents sit at the corners, as on the map


def T(s, size=32, color=WHITE, italic=True, bold=False, **kw):
    return Text(s, font=SERIF, font_size=size, color=color, slant=ITALIC if italic else NORMAL,
                weight=BOLD if bold else NORMAL, **kw)


def pol(r, deg, c=ORIGIN):
    a = math.radians(deg)
    return c + np.array([r * math.cos(a), r * math.sin(a), 0])


def tent(n, s=1.0, silent=False):
    fill, rim, txt = (("#262830", "#60626e", "#70727e") if silent else (TENT[n], TENTL[n], WHITE))
    tri = Polygon([-.5, -.36, 0], [.5, -.36, 0], [0, .5, 0], fill_color=fill, fill_opacity=1, stroke_color=rim, stroke_width=3)
    num = T(str(n), 22, txt, italic=False).move_to(tri.get_center() + DOWN * .07)
    return VGroup(tri, num).scale(s)


def bird(color=WHITE, s=1.0):
    wings = VMobject(stroke_color=color, stroke_width=4.5).set_points_smoothly(
        [np.array(p) for p in ([-.32, -.04, 0], [-.16, .13, 0], [0, 0, 0], [.16, .13, 0], [.32, -.04, 0])])
    return VGroup(wings, Dot(radius=.045, color=color)).scale(s)


def dot(state=None, r=.2, color=None):
    """Commitment dot: hollow while undecided, filled with H or A once committed."""
    if state is None:
        return VGroup(Circle(radius=r, stroke_color=color or SOFT, stroke_width=3, fill_opacity=0))
    c = HOLD if state == "H" else ATTACK
    return VGroup(Circle(radius=r, stroke_width=0, fill_color=c, fill_opacity=1),
                  Text(state, font=SERIF, weight=BOLD, font_size=int(r * 90), color="#0c0e12").move_to(ORIGIN))


def check(s=1.0, color=OK):
    return VMobject(stroke_color=color, stroke_width=7).set_points_as_corners(
        [np.array(p) * s for p in ([-.2, 0, 0], [-.06, -.15, 0], [.22, .17, 0])])


def cross(s=1.0, color=ATTACK, w=7):
    return VGroup(Line([-.16, -.16, 0], [.16, .16, 0], stroke_width=w, color=color),
                  Line([-.16, .16, 0], [.16, -.16, 0], stroke_width=w, color=color)).scale(s)


def head(s):
    t = T(s, 40).to_corner(UL, buff=.5)
    u = Line(t.get_corner(DL) + DOWN * .12, t.get_corner(DR) + DOWN * .12, color=BLUE_C, stroke_width=3)
    return VGroup(t, u)


def hold_time(s):
    return max(2.5, len(s.split()) / 3.0 + 0.5)


class Film(Scene):
    def setup(self):
        self.clock, self.cap_end, self.caps = 0.0, 0.0, []
        c = Mobject()
        c.add_updater(lambda m, dt: setattr(self, "clock", self.clock + dt))
        self.clockobj = c
        self.add(c)

    def say(self, text, hold=None):
        self.wait_cap()
        if self.caps:
            self.wait(0.3)
        hold = hold or hold_time(text)
        txt = Text(textwrap.fill(text, 76), font=SERIF, font_size=27, color=WHITE, line_spacing=.9)
        box = BackgroundRectangle(txt, color="#0c0e12", fill_opacity=0, buff=.14)
        grp = VGroup(box, txt).to_edge(DOWN, buff=.28).set_z_index(100)
        grp.age = 0.0
        txt.set_opacity(0)

        def upd(m, dt):
            m.age += dt
            a = max(0.0, min(1.0, m.age / .35, (hold - m.age) / .35))
            box.set_fill(opacity=.72 * a)
            txt.set_opacity(a)
            if m.age >= hold:
                m.clear_updaters()
                self.remove(m)
        grp.add_updater(upd)
        self.add(grp)
        self.caps.append((self.clock, self.clock + hold, text))
        self.cap_end = self.clock + hold

    def wait_cap(self):
        r = self.cap_end - self.clock
        if r > 0.001:
            self.wait(r)

    def bg(self, mob):
        """Add a mobject that animates itself on the scene clock (an updater of dt)."""
        self.add(mob)
        return mob

    def outro(self):
        self.wait_cap()
        rest = [m for m in self.mobjects if m is not self.clockobj]
        if rest:
            self.play(FadeOut(*rest), run_time=.6)

    def tear_down(self):
        d = os.environ.get("CAPDIR", "caps")
        os.makedirs(d, exist_ok=True)
        json.dump(self.caps, open(os.path.join(d, type(self).__name__ + ".json"), "w"))


# ---- the Chamber (The Part-Time Parliament) ----------------------------------------------
GL = list("ΑΒΓΔΕ")
LEG = {"Α": "#E8B24A", "Β": "#6FA8F0", "Γ": "#E2564E", "Δ": "#9CB648", "Ε": "#B58AE0"}
PARCH = "#d9c9a0"


def legis(sym, r=.3, dim=False):
    col = "#3a3e4a" if dim else LEG[sym]
    return VGroup(Circle(radius=r, fill_color=col, fill_opacity=1, stroke_color=WHITE if not dim else "#60626e", stroke_width=2),
                  Text(sym, font=SERIF, weight=BOLD, font_size=int(r * 80), color="#0c0e12" if not dim else "#70727e"))


def scroll(w=1.0, h=1.3, lines=0):
    g = VGroup(RoundedRectangle(width=w, height=h, corner_radius=.08, fill_color="#2a2620", fill_opacity=1, stroke_color="#a8905c", stroke_width=3))
    for i in range(lines):
        g.add(Line([-w * .38, h * .3 - i * h * .2, 0], [w * .38 - (i % 2) * w * .15, h * .3 - i * h * .2, 0], color=PARCH, stroke_width=2).shift(g[0].get_center()))
    return g


def messenger(col=WHITE):
    return VGroup(Square(side_length=.2, fill_color=col, fill_opacity=1, stroke_width=0).rotate(PI / 4))


def rotunda(R=2.0, c=ORIGIN):
    wall = Circle(radius=R, fill_color="#17181e", fill_opacity=1, stroke_color="#b8b09c", stroke_width=8).move_to(c)
    cols = VGroup(*[Dot(pol(R * .78, a, c), radius=.07, color="#8a8474") for a in range(0, 360, 30)])
    door = Line(pol(R, 255, c), pol(R, 285, c), color="#0c0e12", stroke_width=14)
    dl = Line(pol(R + .02, 255, c), pol(R + .02, 285, c), color="#d6ae3c", stroke_width=3)
    return VGroup(wall, cols, door, dl)
