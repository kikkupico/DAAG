from common import *


class S09Polar(Film):
    def construct(self):
        title = head("The silent man, drawn in time")
        U = .56
        cs = {"L": np.array([-3.6, .45, 0]), "R": np.array([3.6, .45, 0])}
        sight = {1: "A", 3: "H", 4: "H"}
        arcs = [(1, 1, 4, 2), (3, 1, 4, 2), (4, 2, 1, 3), (4, 2, 3, 3), (1, 3, 4, 4), (3, 3, 4, 4)]

        def at(c, n, k):
            return pol(U * k, ANG[n], c)

        def arcpath(c, a, ra, b, rb):
            th0, th1 = ANG[a], ANG[b]
            d = ((th1 - th0 + 180) % 360) - 180
            return ParametricFunction(lambda u: pol(U * (ra + (rb - ra) * u), th0 + d * u, c), t_range=[0, 1], stroke_color=WHITE, stroke_width=3.5)

        base, spokes, nums = VGroup(), VGroup(), VGroup()
        for c in cs.values():
            for k in range(1, 5):
                base.add(Circle(radius=U * k, stroke_color="#2c3040", stroke_width=2).move_to(c))
            for n in (1, 2, 3, 4):
                if n == 2:
                    spokes.add(DashedLine(c, at(c, 2, 4.15), color=TENTL[2], stroke_width=3, dash_length=.1))
                else:
                    spokes.add(Line(c, at(c, n, 4.15), color=TENTL[n], stroke_width=3))
                nums.add(T(str(n), 26, TENTL[n], italic=False, bold=True).move_to(pol(U * 4.75, ANG[n], c)))

        self.say("Draw the night in time. Each tent is a line running outward, and each ring further out is a later moment.")
        self.play(FadeIn(title), Create(base), Create(spokes), FadeIn(nums), run_time=3)
        self.wait_cap()

        self.say("Tent 2 saw hold on the left and attack on the right, and says nothing in either.")
        firsts = VGroup()
        for side, c in cs.items():
            for n in (1, 3, 4):
                firsts.add(dot(sight[n], .13).move_to(at(c, n, 1)))
            firsts.add(dot("H" if side == "L" else "A", .13).move_to(at(c, 2, 1)))
        labs = VGroup(T("tent 2 saw hold", 28, HOLD).move_to([-3.6, -2.35, 0]), T("tent 2 saw attack", 28, ATTACK).move_to([3.6, -2.35, 0]))
        silent = VGroup(*[T("silent", 20, SOFT).move_to(at(c, 2, 3.0) + np.array([.45, .2, 0])) for c in cs.values()])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in firsts], lag_ratio=.12), run_time=2)
        self.play(FadeIn(labs), FadeIn(silent))
        self.wait_cap()

        self.say("The other three see the same ravens, in the same order, and so commit the same way in both.")
        commits = {}
        for k, (a, ra, b, rb) in enumerate(arcs):
            pl = [arcpath(c, a, ra, b, rb) for c in cs.values()]
            bs = [bird(WHITE, .5).move_to(p.get_start()) for p in pl]
            self.add(*bs)
            self.play(*[Create(p) for p in pl], *[MoveAlongPath(b_, p) for b_, p in zip(bs, pl)], run_time=.9, rate_func=linear)
            self.play(*[FadeOut(b_) for b_ in bs], *[FadeIn(Dot(p.get_end(), radius=.07, color=WHITE)) for p in pl], run_time=.2)
        hs = VGroup(*[dot("H", .15).move_to(at(c, n, 4)) for c in cs.values() for n in (1, 3, 4)])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in hs], lag_ratio=.1), run_time=1.2)
        self.wait_cap()

        self.say("But the beginning on the right was settled for attack. So not every beginning can have been settled.")
        right = hs[3:]
        was = T("was settled for attack", 26, ATTACK).move_to([3.6, 2.95, 0])
        self.play(FadeIn(was), *[FadeIn(cross(.7, "#0c0e12").move_to(d)) for d in right])
        self.wait_cap()

        self.say("Some way for the sightings to fall leaves the night open at dusk. And nobody has died.")
        so = T("so some beginning is open", 34, OPEN).move_to([3.6, 3.45, 0])
        self.play(Write(so), run_time=1.5)
        self.play(Indicate(so, color=OPEN, scale_factor=1.12))
        self.outro()


class S10Deferral(Film):
    def construct(self):
        title = head("Deferring the telling arrival")
        xs = [-5.6, -2.8, 0, 2.8, 5.6]
        y = 1.25
        nodes = [Circle(radius=.3, stroke_color=OPEN, stroke_width=5).move_to([x, y, 0]) for x in xs]
        who = [3, 4, 2, 1]
        links = []
        for i in range(4):
            ar = Arrow(nodes[i].get_right(), nodes[i + 1].get_left(), buff=.06, stroke_width=4, max_tip_length_to_length_ratio=.15)
            chip = VGroup(Circle(radius=.17, fill_color=TENT[who[i]], fill_opacity=1, stroke_color=TENTL[who[i]], stroke_width=2), T(str(who[i]), 18, WHITE, italic=False)).next_to(ar, UP, buff=.12)
            links.append(VGroup(ar, chip))
        e = bird(OPEN, 1.9).move_to([xs[0], 2.5, 0])
        elab = T("the telling raven", 24, OPEN).next_to(e, RIGHT, buff=.2)
        hov = DashedLine(e.get_bottom() + DOWN * .05, nodes[0].get_top(), color=OPEN, stroke_width=3, dash_length=.1)
        op = T("open", 26, OPEN).next_to(nodes[0], DOWN, buff=.2)

        self.say("Can the night stay open? Surely some arrival, sooner or later, must be the one that settles it.")
        self.play(FadeIn(title), Create(nodes[0]), FadeIn(op))
        self.wait_cap()

        self.say("Take an open standing and a raven that could land. We will not stop it; birds are reliable.")
        self.play(FadeIn(e, shift=DOWN * .3), FadeIn(elab), Create(hov))
        self.wait_cap()

        self.say("We only ask whether it must settle anything when it comes.")
        self.play(Indicate(e, color=OPEN, scale_factor=1.3), run_time=1.5)
        self.wait_cap()

        self.say("Hold it back. Let other ravens land first, and then let it land. The night is open still.")
        self.play(FadeOut(hov), FadeOut(elab), run_time=.4)
        for i in range(1, 5):
            self.play(GrowArrow(links[i - 1][0]), FadeIn(links[i - 1][1]), Create(nodes[i]), e.animate.move_to([xs[i - 1] + 1.4, 2.5, 0]) if i < 4 else e.animate.move_to([xs[3] + 1.4, 2.5, 0]), run_time=.9)
        self.play(e.animate.move_to([xs[4], 1.95, 0]), run_time=.8)
        landed = T("it lands, and the night is open still", 28, OK).move_to([2.6, .45, 0])
        self.play(Flash(nodes[4], color=OPEN, flash_radius=.6), Write(landed))
        self.wait_cap()

        def card(x, name):
            r = RoundedRectangle(width=6.5, height=2.4, corner_radius=.2, stroke_color=DIMC, stroke_width=3).move_to([x, -1.1, 0])
            return r, T(name, 28).move_to(r.get_top() + DOWN * .38)

        self.say("If the other raven is another man's business, the order between them cannot matter.")
        ra, ta = card(-3.6, "another man's raven")
        pts = [np.array(p) for p in ([-5.0, -1.55, 0], [-3.9, -1.0, 0], [-3.9, -2.1, 0], [-2.8, -1.55, 0])]
        pts = [np.array([-4.9, -1.2, 0]), np.array([-4.0, -.65, 0]), np.array([-4.0, -1.75, 0]), np.array([-3.1, -1.2, 0])]
        dia = VGroup(*[Line(pts[i], pts[j], color=SOFT, stroke_width=3) for i, j in ((0, 1), (0, 2), (1, 3), (2, 3))], *[Circle(radius=.12, stroke_color=OPEN, stroke_width=3, fill_color="#0c0e12", fill_opacity=1).move_to(p) for p in pts])
        ok1 = T("order cannot\nmatter", 24, OK, line_spacing=.8).move_to([-1.6, -1.2, 0])
        self.play(Create(ra), FadeIn(ta), run_time=1)
        self.play(Create(dia), FadeIn(ok1), run_time=1.5)
        self.wait_cap()

        self.say("If it is the same man's, let him go quiet, as a man does whose birds are in the pines, and let the other three finish. They cannot tell which landed first.")
        rb, tb = card(3.6, "the same man's raven")
        q3 = tent(3, 1.0, silent=True).move_to([1.9, -1.35, 0])
        qb = bird(SOFT, .6).move_to([1.9, -.65, 0])
        rest = VGroup(*[tent(n, .8).move_to([3.4 + 1.0 * j, -1.35, 0]) for j, n in enumerate((1, 2, 4))])
        l1, l2 = T("goes quiet", 22, SOFT).next_to(q3, DOWN, buff=.1), T("the rest finish, unable to tell", 22, OK).next_to(rest, DOWN, buff=.1)
        self.play(Create(rb), FadeIn(tb), run_time=1)
        self.play(FadeIn(q3), FadeIn(qb), FadeIn(rest), FadeIn(l1), FadeIn(l2), run_time=2)
        self.wait_cap()

        self.say("Either way, no single raven is ever the one that has to settle the matter.")
        self.play(Indicate(nodes[4], color=OPEN), run_time=1.5)
        self.outro()


class S11Forever(Film):
    def construct(self):
        title = head("What cannot be promised")
        C = np.array([-3.6, .0, 0])
        ring = Circle(radius=2.1, stroke_color="#2c3040", stroke_width=3).move_to(C)
        tents = {n: tent(n, 1.0).move_to(pol(2.1, ANG[n], C)) for n in (1, 2, 3, 4)}
        count = T("0", 64, WHITE, italic=False, bold=True).move_to(C + DOWN * .1)
        shown = [0]
        cl = T("arrivals so far", 24, SOFT).move_to(C + UP * .6)
        status = VGroup(RoundedRectangle(width=6.4, height=1.0, corner_radius=.2, stroke_color=OPEN, stroke_width=4),
                        Text("the standing:  open", font=SERIF, font_size=36, slant=ITALIC, t2c={"open": OPEN})).move_to([3.4, 2.5, 0])
        halo = Circle(radius=.62, stroke_color=OPEN, stroke_width=4, fill_opacity=0).set_stroke(opacity=0)
        bd = bird(WHITE, .9).set_opacity(0)

        self.say("Now put the two facts together. Keep the four tents in a queue.")
        self.play(FadeIn(title), Create(ring), LaggedStart(*[FadeIn(tents[n]) for n in tents], lag_ratio=.25), run_time=2)
        self.wait_cap()

        self.say("Go to the man at the head. Let him take in the raven longest aloft, or find his perch empty. Choose the stretch before it so the night stays open.")
        self.play(FadeIn(status), FadeIn(count), FadeIn(cl))
        self.add(halo, bd)
        t0 = self.clock
        T_ = 1.3
        order = [1, 2, 3, 4]
        loop = Mobject()

        def step(m, dt):
            t = self.clock - t0
            k = int(t / T_)
            u = (t % T_) / T_
            n = order[k % 4]
            tp = tents[n].get_center()
            out = pol(3.2, ANG[n], C)
            p = out + (tp + UP * .5 * 0 - out) * min(1.0, u * 1.5)
            bd.move_to(p)
            bd.set_opacity(max(0.0, min(1.0, 1.0 - (u - .65) / .2)) if u > .65 else 1.0)
            halo.move_to(tp)
            halo.set_stroke(opacity=max(0.0, min(1.0, (u - .5) / .2)) * (1 - max(0.0, (u - .9) / .1)))
            v = k + (1 if u > .65 else 0)
            if v != shown[0]:
                shown[0] = v
                count.become(T(str(v), 64, WHITE, italic=False, bold=True).move_to(C + DOWN * .1))
        loop.add_updater(step)
        self.add(loop)
        self.wait_cap()

        self.say("Send him to the back of the queue, and go to the next. Run this for ever.")
        self.wait_cap()

        self.say("Nobody is starved of a turn, and every raven is taken in at last. The night is entirely fair, and nothing is ever settled.")
        side = T("after every one of them", 26, SOFT).move_to([3.4, 1.6, 0])
        self.play(FadeIn(side))
        inf = T("∞", 120, OPEN, italic=False).move_to([3.4, -.2, 0])
        self.play(FadeIn(inf, scale=.6), run_time=1.5)
        self.wait_cap()

        self.say("Nobody dies in it. Nobody commits to a wrong answer. Nobody commits at all.")
        self.play(FadeOut(inf), FadeOut(side))
        lines = VGroup(T("Nobody dies.", 30), T("Nobody commits to a wrong answer.", 30), T("Nobody commits at all.", 30, ATTACK)).arrange(DOWN, aligned_edge=LEFT, buff=.35).move_to([3.4, .3, 0]).align_to([.4, 0, 0], LEFT)
        self.play(LaggedStart(*[Write(l) for l in lines], lag_ratio=.8), run_time=4)
        self.wait_cap()

        self.say("Nor is it about this hill: any number of men from two upward, and any two answers.")
        gen = T("Any number of men, from two up.\nAny two answers.", 30, WHITE, line_spacing=.9).move_to([3.4, -1.5, 0]).align_to([.4, 0, 0], LEFT)
        self.play(Write(gen), run_time=2)
        loop.clear_updaters()
        self.outro()


class S12Change(Film):
    def construct(self):
        title = head("What would have to change?")
        self.say("What would have to change? Not the slowness of the birds, nor their disorder.")
        self.play(FadeIn(title))
        self.wait_cap()

        self.say("The trouble is two things together: no longest flight, and a dead man who looks exactly like a slow bird.")
        c1 = VGroup(RoundedRectangle(width=4.6, height=.8, corner_radius=.4, stroke_color=OPEN, stroke_width=3), T("no longest flight", 28, OPEN))
        c2 = VGroup(RoundedRectangle(width=6.0, height=.8, corner_radius=.4, stroke_color=OPEN, stroke_width=3), T("a dead man looks like a slow bird", 26, OPEN))
        plus = T("+", 44, WHITE, italic=False)
        chips = VGroup(c1, plus, c2).arrange(RIGHT, buff=.45).move_to([0, 2.25, 0])
        self.play(FadeIn(c1, shift=RIGHT * .3), run_time=1)
        self.play(FadeIn(plus), FadeIn(c2, shift=LEFT * .3), run_time=1.2)
        self.wait_cap()

        def card(x, name, note):
            r = RoundedRectangle(width=4.2, height=3.9, corner_radius=.2, stroke_color=DIMC, stroke_width=3).move_to([x, -.3, 0])
            return r, T(name, 30).move_to(r.get_top() + DOWN * .45), T(note, 22, SOFT, line_spacing=.85).move_to(r.get_bottom() + UP * .75)

        self.say("Give the birds a longest flight, and a long silence starts to mean something.")
        r, tt, nn = card(-4.6, "a longest flight", "Past the longest flight,\nsilence means he is gone.")
        a, b = tent(1, .8).move_to([-6.1, -.2, 0]), tent(2, .8).move_to([-3.1, -.2, 0])
        path = DashedLine([-5.5, .3, 0], [-3.7, .3, 0], color=SOFT, stroke_width=3, dash_length=.1)
        mark = Line([-4.3, -.1, 0], [-4.3, .7, 0], color=OPEN, stroke_width=4)
        ml = T("longest flight", 20, OPEN).next_to(mark, DOWN, buff=.08)
        br = bird(WHITE, .7).move_to([-5.5, .3, 0])
        self.play(Create(r), FadeIn(tt), FadeIn(nn), FadeIn(a), FadeIn(b), Create(path), run_time=1.5)
        self.play(Create(mark), FadeIn(ml), FadeIn(br))
        self.play(MoveAlongPath(br, Line([-5.5, .3, 0], [-3.7, .3, 0])), run_time=2, rate_func=smooth)
        self.wait_cap()

        self.say("Or give each tent a slate, with a report of who has died that is right in the end. That is enough, while more than half are alive.")
        r2, t2, n2 = card(0, "news of the dead", "A slate of the dead: wrong\nfor a while, right in the end.")
        slate = RoundedRectangle(width=3.2, height=1.6, corner_radius=.08, fill_color="#2e2a26", fill_opacity=1, stroke_color="#96784f", stroke_width=6).move_to([0, -.2, 0])
        nums = VGroup(*[T(str(n), 30, TENTL[n], italic=False, bold=True).move_to([-1.1 + .73 * (n - 1), .25, 0]) for n in (1, 2, 3, 4)])
        lines = VGroup(*[Line([-1.35 + .73 * (n - 1), -.1, 0], [-.85 + .73 * (n - 1), -.1, 0], color="#d2cec4", stroke_width=2) for n in (1, 2, 3, 4)])
        self.play(Create(r2), FadeIn(t2), FadeIn(n2), FadeIn(slate), FadeIn(nums), FadeIn(lines), run_time=1.5)
        xm = cross(.55, "#d6d2c8", 4).move_to([-1.1 + .73 * 2, -.5, 0])
        self.play(Create(xm), run_time=1)
        self.wait_cap()

        self.say("Or let every death happen before dusk, and a majority can manage.")
        r3, t3, n3 = card(4.6, "deaths before dusk", "Every death is over before\nthe evening begins.")
        ts = VGroup(*[tent(n, .65, silent=(n == 4)).move_to([3.0 + .95 * (n - 1), .25, 0]) for n in (1, 2, 3, 4)])
        maj = Line([2.55, -.25, 0], [5.25, -.25, 0], color=OK, stroke_width=5)
        ml3 = T("more than half", 22, OK).next_to(maj, DOWN, buff=.1)
        self.play(Create(r3), FadeIn(t3), FadeIn(n3), FadeIn(ts), run_time=1.5)
        self.play(Create(maj), FadeIn(ml3))
        self.wait_cap()

        self.say("None of these is on offer at the foot of the hill.")
        self.play(*[Indicate(m, color=ATTACK) for m in (r, r2, r3)], run_time=1.5)
        self.outro()


class S13Table(Film):
    def construct(self):
        rows = [("four tents, one man in each", "N asynchronous processes"),
                ("attack or hold", "binary consensus"),
                ("leaving the tent to commit", "an irrevocable output"),
                ("a raven in flight", "a message in the buffer"),
                ("no longest flight", "asynchrony: no bound on delay"),
                ("a tent that falls silent", "a crash, indistinguishable from slowness"),
                ("a standing  ·  an arrival", "a configuration  ·  an event"),
                ("open  ·  closed", "bivalent  ·  univalent"),
                ("the lemma of separate folds", "Lemma 1: disjoint schedules commute"),
                ("the dusk that settles nothing", "Lemma 2: a bivalent initial configuration"),
                ("deferring the telling arrival", "Lemma 3"),
                ("what cannot be promised", "Theorem 1")]
        hl, hr = T("on the hill", 32, OPEN).move_to([-1.9, 3.35, 0]), T("in the paper", 32, BLUE_C).move_to([2.9, 3.35, 0])
        g = VGroup()
        for i, (l, r) in enumerate(rows):
            y = 2.7 - .43 * i
            lt = T(l, 24).move_to([0, y, 0]).align_to([-.35, 0, 0], RIGHT)
            ar = Arrow([-.2, y, 0], [.45, y, 0], buff=0, stroke_width=2.5, color=SOFT, max_tip_length_to_length_ratio=.35)
            rt = T(r, 24, italic=False).move_to([0, y, 0]).align_to([.65, 0, 0], LEFT)
            g.add(VGroup(lt, ar, rt))

        self.say("Everything on the hill has a name in the paper.")
        self.play(FadeIn(hl), FadeIn(hr))
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * .2) for r in g], lag_ratio=.35), run_time=5)
        self.wait_cap()

        self.say("The result: no deterministic protocol can guarantee agreement when even one process may crash and messages can take arbitrarily long.")
        self.play(FadeOut(g), FadeOut(hl), FadeOut(hr))
        res = Text("No deterministic protocol can guarantee agreement\nif even one process may crash\nand messages can take arbitrarily long.", font=SERIF, font_size=40, slant=ITALIC, line_spacing=1.0).move_to([0, .4, 0])
        self.play(Write(res), run_time=4)
        self.wait_cap()

        self.say("Every escape gives up one condition of the hill: bound the delays, report the dead, or let each man toss a coin.")
        self.play(FadeOut(res))
        h = T("Every escape gives up one condition of the hill", 36).move_to([0, 2.2, 0])
        es = VGroup(T("bound the delays", 40, BLUE_C), T("report the dead", 40, OK), T("toss a coin", 40, OPEN)).arrange(DOWN, buff=.55).move_to([0, .2, 0])
        self.play(Write(h))
        self.play(LaggedStart(*[FadeIn(e, shift=UP * .2) for e in es], lag_ratio=1.0), run_time=5)
        self.wait_cap()

        self.say("Fischer, Lynch and Paterson · Journal of the ACM, 1985.")
        self.play(FadeOut(h), FadeOut(es))
        big = T("The Limits of Agreement", 66).move_to([0, .6, 0])
        sub = T("Distributed Algorithms of Ancient Greece  ·  Arche", 28, SOFT, italic=False).next_to(big, DOWN, buff=.5)
        self.play(Write(big), run_time=2)
        self.play(FadeIn(sub))
        self.outro()
