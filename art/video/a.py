from common import *


class S01Title(Film):
    def construct(self):
        title = T("The Limits of Agreement", 74).shift(UP * 1.3)
        ul = Line(title.get_left() + DOWN * .6, title.get_right() + DOWN * .6, color=BLUE_C, stroke_width=3)
        sub = T("after Fischer, Lynch & Paterson, 1985", 28, SOFT).next_to(ul, DOWN, buff=.3)
        tents = VGroup(*[tent(n, 1.2) for n in (1, 2, 3, 4)]).arrange(RIGHT, buff=1.5).shift(DOWN * 1.0)
        self.say("Can machines always agree, when one of them may stop without a word, and messages can take any time at all?")
        self.play(Write(title), run_time=2.2)
        self.play(Create(ul), FadeIn(sub, shift=UP * .2), run_time=1.2)
        self.wait_cap()
        self.say("Four mercenaries at the foot of a hill will find out.")
        self.play(LaggedStart(*[FadeIn(t, shift=UP * .5) for t in tents], lag_ratio=.3), run_time=1.8)
        self.outro()


class S02Synopsis(Film):
    def construct(self):
        P = [np.array(p) for p in ([-3.4, 1.0, 0], [3.4, 1.0, 0], [3.4, -1.6, 0], [-3.4, -1.6, 0])]
        circles = [Circle(radius=.5, stroke_color=WHITE, stroke_width=4).move_to(p) for p in P]
        marks = [T("?", 40, SOFT).move_to(p) for p in P]
        edges = [Line(P[i], P[j], stroke_width=2, color=DIMC, buff=.5) for i, j in ((0, 1), (1, 2), (2, 3), (3, 0), (0, 2), (1, 3))]
        top = T("everyone must settle on the same answer", 34).to_edge(UP, buff=.9)

        self.say("Take a group of computers that must settle on one answer: yes, or no.")
        self.play(FadeIn(top, shift=DOWN * .2), LaggedStart(*[Create(e) for e in edges], lag_ratio=.15),
                  LaggedStart(*[GrowFromCenter(VGroup(c, m)) for c, m in zip(circles, marks)], lag_ratio=.2), run_time=2)
        dots = [Dot(color=WHITE, radius=.09) for _ in range(5)]
        pairs = [(0, 1), (1, 2), (3, 2), (0, 3), (2, 0)]
        for d, (i, j) in zip(dots, pairs):
            d.move_to(P[i])
        self.add(*dots)
        self.play(*[Succession(Wait(.35 * k), MoveAlongPath(d, Line(P[i], P[j]), run_time=1.3, rate_func=smooth), FadeOut(d, run_time=.1))
                    for k, (d, (i, j)) in enumerate(zip(dots, pairs))])
        self.wait_cap()

        self.say("Messages between them can be delayed for as long as you like, and any one machine may crash without a word.")
        top2 = T("delays with no limit  ·  one silent failure", 34).move_to(top)
        self.play(ReplacementTransform(top, top2))
        late = [(0, 2, .45), (1, 3, .62), (3, 1, .3)]
        lds = [Dot(color=OPEN, radius=.1).move_to(P[i]) for i, j, f in late]
        self.add(*lds)
        self.play(*[MoveAlongPath(d, Line(P[i], P[i] + (P[j] - P[i]) * f), run_time=2.5, rate_func=smooth) for d, (i, j, f) in zip(lds, late)])
        self.play(*[Indicate(d, scale_factor=1.8, color=OPEN) for d in lds], run_time=1.2)
        x = cross(1.6, GREY_C)
        x.move_to(P[2])
        note = T("crashed, silently", 24, SOFT).next_to(circles[2], RIGHT, buff=.3)
        self.play(circles[2].animate.set_stroke(color=DIMC), FadeOut(marks[2]), Create(x), FadeIn(note), run_time=1.2)
        self.wait_cap()

        self.say("In 1985, Fischer, Lynch and Paterson proved that no fixed procedure can promise the group ever settles.")
        top3 = Text("no fixed procedure guarantees they ever settle", font=SERIF, font_size=34, slant=ITALIC,
                    t2c={"guarantees": ATTACK}).move_to(top)
        yes = [T("yes", 28, HOLD).move_to(P[0]), T("yes", 28, HOLD).move_to(P[1])]
        self.play(ReplacementTransform(top2, top3), *[ReplacementTransform(marks[i], yes[i]) for i in (0, 1)], run_time=1.5)
        for _ in range(3):
            self.play(Indicate(marks[3], color=OPEN, scale_factor=1.4), run_time=1)
        self.wait_cap()

        self.say("To see why, we go to a hill in ancient Greece.")
        self.play(*[FadeOut(m) for m in self.mobjects if m is not self.clockobj and m.z_index < 100], run_time=.8)
        g = T("an ancient Greek hill", 60).shift(UP * .3)
        self.play(Write(g), run_time=1.5)
        self.outro()


class S03Hill(Film):
    def construct(self):
        C = UP * .2
        R = 2.35
        title = head("The foot of Mount Phyle")
        mount = Circle(radius=R, fill_color="#17241c", fill_opacity=1, stroke_color="#46644c", stroke_width=4).move_to(C)
        contours = VGroup(*[Circle(radius=r, stroke_color="#2a3c2f", stroke_width=2).move_to(C) for r in (2.0, 1.5, 1.0)])
        spurs, trees = VGroup(), VGroup()
        for k in range(8):
            a = 22.5 + 45 * k
            spurs.add(Line(pol(.7, a, C), pol(R - .08, a, C), stroke_width=9, color="#3d5e3c"))
            for j in range(4):
                p = pol(1.0 + .4 * j, a, C)
                trees.add(Triangle(fill_color="#25502d", fill_opacity=1, stroke_width=0).scale(.09).move_to(p + UP * .02))
        gullies = VGroup(*[DashedLine(pol(.8, 45 * k, C), pol(R, 45 * k, C), color="#6b6046", stroke_width=2, dash_length=.1) for k in range(8)])
        crown = VGroup(Circle(radius=.42, fill_color="#1c1c22", fill_opacity=1, stroke_color="#b8b09c", stroke_width=9).move_to(C),
                       *[Dot(C + np.array(d), radius=.05, color=col) for d, col in (((-.15, .08, 0), "#9a3cb0"), ((.14, .13, 0), "#838890"), ((.04, -.15, 0), "#9a3cb0"), ((-.12, -.12, 0), "#838890"))],
                       Dot(C + np.array([.2, -.05, 0]), radius=.04, color="#d6ae3c"))
        lab = VGroup(T("the crown: bandits, and their loot", 21), T("behind a ring wall with no gate", 18, SOFT)).arrange(DOWN, aligned_edge=LEFT, buff=.1).move_to([4.95, .35, 0])
        leader = Line(C + RIGHT * .42, lab.get_left() + LEFT * .1, stroke_width=1.5, color=SOFT)
        tents = {n: tent(n, 1.0).move_to(pol(3.1, ANG[n], C)) for n in (1, 2, 3, 4)}

        self.say("Mount Phyle is a hill broad enough to block every line of sight across it.")
        self.play(FadeIn(title), GrowFromCenter(mount), run_time=1.5)
        self.play(Create(contours), LaggedStart(*[Create(s) for s in spurs], lag_ratio=.12), run_time=2)
        self.play(FadeIn(trees, lag_ratio=.05), Create(gullies), run_time=1.2)
        self.wait_cap()

        self.say("Bandits hold its crown, behind a ring wall that has no gate.")
        self.play(GrowFromCenter(crown), Create(leader), FadeIn(lab, shift=LEFT * .2), run_time=1.5)
        self.play(Indicate(crown[0], color=WHITE, scale_factor=1.15), run_time=1)
        self.wait_cap()

        self.say("Four mercenaries, hired to clear them out, are camped at the foot, one to a tent.")
        self.play(LaggedStart(*[FadeIn(tents[n], shift=pol(.5, ANG[n]) ) for n in (1, 2, 3, 4)], lag_ratio=.5), run_time=3)
        self.wait_cap()

        self.say("Each man goes by his tent's number. Two wooded spurs stand between neighbours, so no one can see another.")
        sight = VGroup()
        for i, j in ((1, 2), (2, 3), (3, 4), (4, 1)):
            a, b = tents[i].get_center(), tents[j].get_center()
            sight.add(DashedLine(a + (b - a) * .1, b - (b - a) * .1, color="#c8c8d2", stroke_width=2, dash_length=.12))
            sight.add(cross(.8).move_to((a + b) / 2))
        self.play(LaggedStart(*[Create(s) if isinstance(s, DashedLine) else GrowFromCenter(s) for s in sight], lag_ratio=.25), run_time=3)
        self.wait_cap()

        self.say("Word passes between the tents only by raven.")
        birds = []
        anims = []
        for k, (a, b) in enumerate(((1, 2), (3, 4), (2, 3), (4, 1))):
            da = (ANG[b] - ANG[a] + 180) % 360 - 180
            arc = Arc(radius=3.1, start_angle=math.radians(ANG[a]), angle=math.radians(da), arc_center=C)
            bd = bird().move_to(arc.get_start())
            birds.append(bd)
            anims.append(Succession(Wait(.5 * k), FadeIn(bd, run_time=.2), MoveAlongPath(bd, arc, run_time=2.4, rate_func=smooth), FadeOut(bd, run_time=.2)))
        self.play(*anims)
        self.outro()


class S04Demands(Film):
    def construct(self):
        xs = {1: -4.8, 2: -1.6, 3: 1.6, 4: 4.8}
        sight = {1: "A", 2: "H", 3: "H", 4: "A"}
        tents = {n: tent(n, 1.0).move_to([xs[n], 2.3, 0]) for n in xs}
        saws = {n: VGroup(T("saw:", 20, SOFT), T("attack" if sight[n] == "A" else "hold", 26, ATTACK if sight[n] == "A" else HOLD)).arrange(DOWN, aligned_edge=LEFT, buff=.05).next_to(tents[n], RIGHT, buff=.15) for n in xs}
        dots = {n: dot(None, .24).move_to([xs[n], 1.0, 0]) for n in xs}

        self.say("Each mercenary formed an opinion at dusk from what he could see of his own quarter: attack, or hold.")
        self.play(LaggedStart(*[FadeIn(tents[n], shift=DOWN * .3) for n in xs], lag_ratio=.25), run_time=1.5)
        self.play(LaggedStart(*[Write(saws[n]) for n in xs], lag_ratio=.3), run_time=1.5)
        self.wait_cap()

        self.say("All four must do the same thing. Half attacking while half hold is worse than either.")
        self.play(LaggedStart(*[Create(dots[n]) for n in xs], lag_ratio=.15), run_time=1)
        self.wait_cap()

        self.say("So the four ask three things of whatever they do with those opinions.")
        lines = []
        for k, s in enumerate(("No two commit to different answers", "Both answers stay possible", "Somebody eventually commits")):
            n = T(str(k + 1), 34, OPEN)
            t = T(s, 30)
            g = VGroup(n, t).arrange(RIGHT, buff=.3, aligned_edge=DOWN)
            lines.append(g)
        stack = VGroup(*lines).arrange(DOWN, aligned_edge=LEFT, buff=.4).move_to([0, -.75, 0]).align_to([-6.3, 0, 0], LEFT)
        self.wait_cap()

        def put(n, st):
            return dot(st, .24).move_to(dots[n])

        self.say("First: no two of them commit to different answers.")
        self.play(Write(lines[0]), run_time=1.2)
        self.play(*[Transform(dots[n], put(n, "H")) for n in xs], run_time=1.2)
        ck = check(1.3).move_to([6.2, 1.0, 0])
        self.play(Create(ck))
        self.play(FadeOut(ck))
        self.play(Transform(dots[3], put(3, "A")), Transform(dots[4], put(4, "A")), run_time=.8)
        xx = cross(1.3).move_to([6.2, 1.0, 0])
        self.play(GrowFromCenter(xx))
        self.play(FadeOut(xx), *[Transform(dots[n], dot(None, .24).move_to(dots[n])) for n in xs], run_time=.8)
        self.wait_cap()

        self.say("Second: both answers must stay possible. Always holding, whatever anyone saw, would make the evening pointless.")
        self.play(Write(lines[1]), run_time=1.5)
        self.play(*[Transform(dots[n], put(n, "H")) for n in xs], run_time=1)
        ah = T("always hold", 30, SOFT).move_to([1.2, -.75, 0])
        self.play(FadeIn(ah))
        strike = Line(ah.get_left() + LEFT * .1, ah.get_right() + RIGHT * .1, color=ATTACK, stroke_width=6)
        self.play(Create(strike))
        self.play(FadeIn(T("pointless", 26, ATTACK).next_to(ah, RIGHT, buff=.4)))
        self.wait_cap()
        self.play(*[Transform(dots[n], dot(None, .24).move_to(dots[n])) for n in xs], run_time=.6)

        self.say("Third: somebody must eventually commit. To commit is to leave the tent for good. Thinking counts for nothing.")
        self.play(Write(lines[2]), run_time=1.2)
        d3 = dots[3]
        self.play(Transform(d3, put(3, "H")), run_time=.7)
        away = T("gone from his tent, for good", 24, SOFT).move_to([4.3, .35, 0])
        self.play(d3.animate.shift(DOWN * .55 + RIGHT * .3), tents[3].animate.set_opacity(.15), FadeIn(away), run_time=1.5)
        self.wait_cap()

        self.say("And no drawing lots: with the same sightings and the same arrivals, each man acts the same way every time.")
        coin = VGroup(Circle(radius=.35, color=OPEN, stroke_width=4), T("?", 30, OPEN, italic=False)).move_to([0, -1.55, 0]).align_to([4.2, 0, 0], LEFT)
        self.play(GrowFromCenter(coin))
        self.play(Create(VGroup(Line(coin.get_corner(UL) * 1 + LEFT * .05, coin.get_corner(DR) + RIGHT * .05, color=ATTACK, stroke_width=6))))
        self.outro()
