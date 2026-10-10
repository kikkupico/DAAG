from common import *


def world(c, silent=False):
    t1 = tent(1, 1.5).move_to([c - 2.5, .2, 0])
    t2 = tent(2, 1.5, silent).move_to([c + 2.5, .2, 0])
    trees = VGroup(*[Triangle(fill_color="#1f5230", fill_opacity=1, stroke_width=0).scale(.4).move_to([c + dx, .2, 0]) for dx in (-.95, 0, .95)])
    perch = VGroup(Line([0, 0, 0], [.6, 0, 0], stroke_width=7, color="#b09664"), Line([.1, 0, 0], [.1, -.35, 0], stroke_width=5, color="#b09664"))
    perch.move_to(t1.get_center() + np.array([1.0, .75, 0]))
    return t1, t2, trees, perch


class S05DeadOrSlow(Film):
    def construct(self):
        self.say("Birds always arrive, but they take as long as they take. There is no longest flight.")
        q = T("how long does a bird take?", 36).to_edge(UP, buff=.7)
        self.play(FadeIn(q))
        rows = []
        for k, L in enumerate((1.8, 3.4, 5.5, 11.0)):
            y = 1.8 - .85 * k
            ln = Line([-5.5, y, 0], [-5.5 + L, y, 0], color=BLUE_C, stroke_width=5)
            if k == 3:
                ln = DashedLine([-5.5, y, 0], [-5.5 + L, y, 0], color=BLUE_C, stroke_width=5)
            b = bird()
            b.move_to(ln.get_start())
            rows.append((ln, b))
            self.add(b)
            self.play(Create(ln), MoveAlongPath(b, Line(ln.get_start(), ln.get_end())), run_time=.9 + .5 * k, rate_func=linear)
        dots = T("…", 60).move_to([6.1, rows[3][0].get_y(), 0])
        lab = T("no longest flight", 36, OPEN).move_to([3.2, 2.0, 0])
        self.play(FadeIn(dots), Write(lab))
        self.wait_cap()

        self.say("Any one man may be killed, and then his tent simply falls silent. Nobody is killed in this story. It only has to be possible.")
        self.play(FadeOut(VGroup(q, lab, dots, *[m for r in rows for m in r])), run_time=.6)
        L1, L2, L3, L4 = world(-3.6, False), None, None, None
        wl = world(-3.6)
        wr = world(3.6)
        left_gone = world(-3.6, True)
        self.play(*[FadeIn(m) for m in (*wl, *wr)], run_time=1.2)
        self.play(Transform(wl[1], left_gone[1]), run_time=1.5)
        gone = T("the man at tent 2 is gone", 28, SOFT).move_to([-3.6, -1.1, 0])
        well = T("the man at tent 2 is well", 28, SOFT).move_to([3.6, -1.1, 0])
        self.play(FadeIn(gone), FadeIn(well))
        self.wait_cap()

        self.say("The man at tent 1 walks to his perch, and finds it empty.")
        qs = [T("?", 66, OPEN).next_to(w[3], UP, buff=.25) for w in (wl, wr)]
        self.play(*[Write(m) for m in qs])
        self.play(*[Indicate(m, color=OPEN, scale_factor=1.3) for m in qs], run_time=1.2)
        self.wait_cap()

        self.say("Either the man at tent 2 is gone and no bird will ever come, or he is well and his bird sits in a pine two spurs away.")
        bd = bird(WHITE, 1.3).move_to([3.6, .95, 0])
        self.play(FadeIn(bd, shift=UP * .3), run_time=1)
        self.play(bd.animate.shift(UP * .08), rate_func=there_and_back, run_time=1.2)
        self.play(bd.animate.shift(UP * .08), rate_func=there_and_back, run_time=1.2)
        pines = T("still in the pines", 24, SOFT).next_to(bd, UP, buff=.2).shift(UP * .1)
        self.play(FadeIn(pines))
        self.wait_cap()

        self.say("Nothing tells the two apart. Waiting longer never turns one into the other.")
        rects = [SurroundingRectangle(w[3], color=OPEN, buff=.2) for w in (wl, wr)]
        eq = T("=", 80, OPEN, italic=False).move_to([0, .4, 0])
        same = T("the same empty perch, in both", 30, OPEN).move_to([0, -2.0, 0])
        self.play(*[Create(r) for r in rects], run_time=1)
        self.play(Write(eq), FadeIn(same))
        self.wait_cap()

        self.say("So no one can wait to hear from everyone. Each man must act without having heard from all.")
        self.play(FadeOut(same), FadeOut(eq))
        w = T("wait for everyone", 42).move_to([0, -2.0, 0])
        self.play(Write(w))
        self.play(Create(Line(w.get_left() + LEFT * .15, w.get_right() + RIGHT * .15, color=ATTACK, stroke_width=7)))
        self.outro()


class S06Words(Film):
    def construct(self):
        title = head("Four words")
        xs = [-5.2, -1.75, 1.75, 5.2]
        names = ["a standing", "an arrival", "a fair course", "open  ·  closed"]
        notes = ["the whole night,\nat one instant", "one man takes in\none raven", "arrivals that could\nreally happen", "open: both answers\nstill reachable"]

        def row(cx, y=-.2):
            ts = [tent(n, .45).move_to([cx - 1.2 + .8 * j, y, 0]) for j, n in enumerate((1, 2, 3, 4))]
            ds = [dot(None, .1).move_to([cx - 1.2 + .8 * j, y + .6, 0]) for j in range(4)]
            return ts, ds

        def header(k):
            return VGroup(T(names[k], 32, OPEN).move_to([xs[k], 2.4, 0]), T(notes[k], 22, SOFT, line_spacing=.8).move_to([xs[k], -1.5, 0]))

        self.say("To say exactly when the matter is settled, we need four words.")
        self.play(FadeIn(title))
        self.wait_cap()

        self.say("A standing: how the night stands, entire. What each man holds in his head, and every raven still aloft.")
        ts, ds = row(xs[0])
        birds = [bird(WHITE, .5).move_to([xs[0] - .9 + .9 * j, 1.5, 0]) for j in range(3)]
        frame = SurroundingRectangle(VGroup(*ts, *ds, *birds), color=DIMC, buff=.25, corner_radius=.15)
        self.play(FadeIn(header(0)), *[FadeIn(m) for m in (*ts, *ds, *birds)], Create(frame), run_time=1.5)
        for _ in range(3):
            self.play(*[b.animate.shift(RIGHT * .18) for b in birds], rate_func=there_and_back, run_time=1.2)
        self.wait_cap()

        self.say("An arrival: one named man taking in one named raven. It is the only kind of thing that happens.")
        ts2, ds2 = row(xs[1])
        b2 = bird(WHITE, .6).move_to([xs[1] - 1.2, 1.5, 0])
        self.play(FadeIn(header(1)), *[FadeIn(m) for m in (*ts2, *ds2, b2)], run_time=1.2)
        for _ in range(2):
            self.play(b2.animate.move_to(ds2[2].get_center() + UP * .1), run_time=1.2)
            self.play(FadeOut(b2, run_time=.2), ds2[2].animate.set_fill(OPEN, opacity=1), run_time=.4)
            self.play(Indicate(ds2[2], color=OPEN), run_time=.6)
            b2 = bird(WHITE, .6).move_to([xs[1] - 1.2, 1.5, 0])
            self.play(FadeIn(b2), ds2[2].animate.set_fill(opacity=0), run_time=.4)
        self.wait_cap()

        self.say("A fair course: a list of arrivals that could really happen. No raven stays aloft for ever, and at most one man falls silent.")
        chain = VGroup()
        for j, n in enumerate((2, 4, 1, 2, 3)):
            c = VGroup(Circle(radius=.22, fill_color=TENT[n], fill_opacity=1, stroke_color=TENTL[n], stroke_width=3), T(str(n), 22, WHITE, italic=False))
            c.move_to([xs[2] - 1.35 + .62 * j, .4, 0])
            chain.add(c)
        arrows = VGroup(*[Arrow(chain[j].get_right(), chain[j + 1].get_left(), buff=.04, stroke_width=3, max_tip_length_to_length_ratio=.5) for j in range(4)])
        more = T("…", 36).next_to(chain, RIGHT, buff=.1)
        self.play(FadeIn(header(2)))
        self.play(LaggedStart(*[AnimationGroup(FadeIn(chain[j]), *( [GrowArrow(arrows[j - 1])] if j else [])) for j in range(5)], lag_ratio=.5), FadeIn(more, run_time=.6), run_time=3.5)
        self.wait_cap()

        self.say("A standing is open if some fair course still ends in holding and another still ends in attacking. Closed, if only one answer remains.")
        self.play(FadeIn(header(3)))
        root_o = Circle(radius=.2, stroke_color=OPEN, stroke_width=4).move_to([xs[3] - .85, .9, 0])
        root_c = Circle(radius=.2, stroke_color=WHITE, fill_color=WHITE, fill_opacity=1).move_to([xs[3] + .85, .9, 0])
        lo = [dot("H", .17).move_to(root_o.get_center() + np.array([-.45, -1, 0])), dot("A", .17).move_to(root_o.get_center() + np.array([.45, -1, 0]))]
        lc = [dot("H", .17).move_to(root_c.get_center() + np.array([-.45, -1, 0])), dot("H", .17).move_to(root_c.get_center() + np.array([.45, -1, 0]))]
        brs = [Line(r.get_center(), l.get_center(), buff=.2, stroke_width=3) for r, ls in ((root_o, lo), (root_c, lc)) for l in ls]
        self.play(Create(root_o), Create(root_c))
        self.play(LaggedStart(*[Create(b) for b in brs], lag_ratio=.3), LaggedStart(*[FadeIn(l) for l in lo + lc], lag_ratio=.3), run_time=1.8)
        lab_o, lab_c = T("open", 26, OPEN).next_to(VGroup(*lo), DOWN, buff=.25), T("closed", 26).next_to(VGroup(*lc), DOWN, buff=.25)
        self.play(FadeIn(lab_o), FadeIn(lab_c))
        self.outro()


class S07Folds(Film):
    def construct(self):
        title = head("The lemma of separate folds")

        def node(ch, pos):
            box = RoundedRectangle(width=2.4, height=.62, corner_radius=.15, stroke_color="#6e7282", stroke_width=3)
            ds = VGroup(*[Circle(radius=.11, stroke_color=TENTL[n], stroke_width=3, fill_color=TENTL[n], fill_opacity=1 if n in ch else 0).move_to([-.84 + .56 * j, 0, 0]) for j, n in enumerate((1, 2, 3, 4))])
            return VGroup(box, ds).move_to(pos)
        S, L, R, B = [np.array(p) for p in ([0, 2.3, 0], [-3.9, .35, 0], [3.9, .35, 0], [0, -1.6, 0])]
        nS, nL, nR, nB = node(set(), S), node({1, 2}, L), node({3, 4}, R), node({1, 2, 3, 4}, B)

        def edge(a, b):
            return Arrow(a, b, buff=.55, stroke_width=4, max_tip_length_to_length_ratio=.12, color=WHITE)
        eSL, eSR, eLB, eRB = edge(S, L), edge(S, R), edge(L, B), edge(R, B)

        def lab(s, pos, **t2c):
            return Text(s, font=SERIF, font_size=26, slant=ITALIC, t2c=t2c).move_to(pos)
        lSL = lab("tents 1 and 2 trade", [-3.3, 1.8, 0], **{"1": TENTL[1], "2": TENTL[2]})
        lSR = lab("tents 3 and 4 trade", [3.3, 1.8, 0], **{"3": TENTL[3], "4": TENTL[4]})
        lLB = lab("then 3 and 4", [-3.0, -.9, 0], **{"3": TENTL[3], "4": TENTL[4]})
        lRB = lab("then 1 and 2", [3.0, -.9, 0], **{"1": TENTL[1], "2": TENTL[2]})

        self.say("The first tool is the dullest fact in the book, and the most useful.")
        self.play(FadeIn(title), FadeIn(nS))
        self.wait_cap()

        self.say("Take two courses with no man in common: tents 1 and 2 trading ravens, and tents 3 and 4 trading theirs.")
        self.play(GrowArrow(eSL), FadeIn(nL), FadeIn(lSL), run_time=1.5)
        self.play(GrowArrow(eSR), FadeIn(nR), FadeIn(lSR), run_time=1.5)
        self.wait_cap()

        self.say("Neither can get in the other's way. Run either one first...")
        self.play(GrowArrow(eLB), GrowArrow(eRB), FadeIn(nB), FadeIn(lLB), FadeIn(lRB), run_time=1.5)
        for route in ((S, L, B), (S, R, B)):
            tok = Dot(color=OPEN, radius=.14).move_to(S)
            path = VMobject().set_points_as_corners([S, route[1], B])
            self.add(tok)
            self.play(MoveAlongPath(tok, path), run_time=2.4, rate_func=smooth)
            self.play(Indicate(nB, color=OPEN, scale_factor=1.08), FadeOut(tok), run_time=.6)
        self.wait_cap()

        self.say("...and the night arrives at the very same standing.")
        box = SurroundingRectangle(nB, color=OK, buff=.12)
        same = T("the same standing either way", 34, OK).next_to(nB, DOWN, buff=.35)
        self.play(Create(box), Write(same))
        self.outro()


class S08Dusk(Film):
    def construct(self):
        title = head("The dusk that settles nothing")
        seq = ["HHHH", "AHHH", "AAHH", "AAAH", "AAAA"]
        xs = [-5.6, -2.8, 0, 2.8, 5.6]
        y = 2.25
        boxes = []
        for i, s in enumerate(seq):
            bx = RoundedRectangle(width=2.35, height=.85, corner_radius=.16, stroke_color="#6e7282", stroke_width=3).move_to([xs[i], y, 0])
            ds = VGroup(*[dot(c, .17).move_to([xs[i] - .75 + .5 * j, y, 0]) for j, c in enumerate(s)])
            boxes.append(VGroup(bx, ds))
        links = [VGroup(Arrow([xs[i] + 1.2, y, 0], [xs[i + 1] - 1.2, y, 0], buff=0, stroke_width=3, color=SOFT, max_tip_length_to_length_ratio=.25),
                        T(str(i + 1), 24, TENTL[i + 1], italic=False, bold=True).move_to([(xs[i] + xs[i + 1]) / 2, y + .4, 0])) for i in range(4)]

        def fate(i, s, col):
            return T(s, 24, col).move_to([xs[i], y - .85, 0])

        self.say("Next question: is the night already settled at dusk, by the sightings alone?")
        self.play(FadeIn(title))
        self.wait_cap()

        self.say("Line the beginnings up, changing one man's sighting at a time, from everyone holding to everyone attacking.")
        self.play(LaggedStart(*[AnimationGroup(FadeIn(boxes[i]), *([FadeIn(links[i - 1])] if i else [])) for i in range(5)], lag_ratio=.55), run_time=4.5)
        self.wait_cap()

        self.say("The second demand forces the two ends to opposite answers: hold at one end, attack at the other.")
        f0, f4 = fate(0, "hold is forced", HOLD), fate(4, "attack is forced", ATTACK)
        self.play(Write(f0), Write(f4))
        self.wait_cap()

        self.say("Suppose every beginning were already settled. Then somewhere, two neighbours are settled opposite ways, and differ only in what one man saw.")
        mids = [fate(1, "settled: hold", HOLD), fate(2, "settled: attack", ATTACK), fate(3, "settled: attack", ATTACK)]
        self.play(LaggedStart(*[Write(m) for m in mids], lag_ratio=.4), run_time=2.5)
        pair = SurroundingRectangle(VGroup(boxes[1], boxes[2]), color=OPEN, buff=.18, corner_radius=.2)
        self.play(Create(pair))
        note = Text("they differ only in what tent 2 saw", font=SERIF, font_size=28, slant=ITALIC, t2c={"2": TENTL[2]}).move_to([-1.4, .55, 0])
        self.play(FadeIn(note))
        self.wait_cap()

        self.say("Call him tent 2, and let him be the silent one.")
        rings = [Circle(radius=.24, stroke_color=TENTL[2], stroke_width=5).move_to(boxes[i][1][1]) for i in (1, 2)]
        silent = T("he stays silent", 28, TENTL[2]).move_to([-1.4, -.05, 0])
        self.play(*[Create(r) for r in rings], FadeIn(silent))
        self.wait_cap()

        self.say("The other three cannot tell the two beginnings apart, since he has told no one anything. So they must end the same way in both.")
        same = Text("the other three end the same way in both:  hold", font=SERIF, font_size=28, slant=ITALIC, t2c={"hold": HOLD}).move_to([-1.4, -.65, 0])
        self.play(FadeIn(same))
        x = cross(.9).next_to(mids[1], RIGHT, buff=.1).shift(RIGHT * .1)
        bad = T("but this one was settled for attack", 26, ATTACK).move_to([-1.4, -1.25, 0])
        self.play(GrowFromCenter(x), FadeIn(bad))
        self.outro()
