from common import *


class P01Title(Film):
    def construct(self):
        title = T("The Part-Time Parliament", 66).shift(UP * 2.3)
        ul = Line(title.get_left() + DOWN * .55, title.get_right() + DOWN * .55, color=BLUE_C, stroke_width=3)
        sub = T("after Leslie Lamport, 1998", 28, SOFT).next_to(ul, DOWN, buff=.25)
        C = DOWN * .6
        ch = rotunda(1.6, C)
        door = pol(1.6, 270, C)
        ls = {s: legis(s, .27) for s in GL}
        inside = {"Α": (-.7, .5), "Β": (.6, .6), "Γ": (0, -.1)}
        for s, (x, y) in inside.items():
            ls[s].move_to(C + np.array([x, y, 0]))
        ls["Δ"].move_to(C + np.array([-3.2, -1.6, 0]))
        ls["Ε"].move_to(C + np.array([3.3, -1.7, 0]))
        self.say("Can a parliament whose members wander in and out as they please still pass laws that never contradict one another?")
        self.play(Write(title), run_time=2)
        self.play(Create(ul), FadeIn(sub, shift=UP * .2), run_time=1)
        self.play(FadeIn(ch), *[FadeIn(ls[s]) for s in GL], run_time=1.5)
        self.wait_cap()
        self.say("On the island of Paxos, it did.")
        self.play(ls["Δ"].animate.move_to(door + DOWN * .1), ls["Β"].animate.move_to(door + DOWN * .1), run_time=1.5)
        self.play(ls["Δ"].animate.move_to(C + np.array([.5, -.6, 0])), ls["Β"].animate.move_to(C + np.array([2.9, -1.9, 0])), run_time=1.5)
        self.play(ls["Γ"].animate.move_to(door + DOWN * .1), ls["Ε"].animate.move_to(door + DOWN * .1), run_time=1.5)
        self.play(ls["Γ"].animate.move_to(C + np.array([-3.0, -1.8, 0])), ls["Ε"].animate.move_to(C + np.array([-.6, -.3, 0])), run_time=1.5)
        self.outro()


class P02Synopsis(Film):
    def construct(self):
        P = [np.array(p) for p in ([-4.2, 1.0, 0], [0, 1.6, 0], [4.2, 1.0, 0], [-2.1, -1.5, 0], [2.1, -1.5, 0])]
        boxes, logs = [], []
        for i, p in enumerate(P):
            b = RoundedRectangle(width=1.7, height=1.5, corner_radius=.15, stroke_color=WHITE, stroke_width=3).move_to(p)
            rows = VGroup(*[Line([-.6, .35 - .25 * k, 0], [.6 - .15 * (k % 2), .35 - .25 * k, 0], color=BLUE_C, stroke_width=4) for k in range(4)]).move_to(p)
            boxes.append(b)
            logs.append(rows)
        top = T("every machine keeps the same log of commands", 34).to_edge(UP, buff=.8)
        self.say("Take a group of computers that must all keep the same log of commands, in the same order.")
        self.play(FadeIn(top), LaggedStart(*[AnimationGroup(Create(b), Create(l)) for b, l in zip(boxes, logs)], lag_ratio=.2), run_time=3)
        self.wait_cap()

        self.say("Any machine may stop and restart at any moment. Messages may be slow, lost, or delivered twice.")
        top2 = T("machines come and go  ·  messages are unreliable", 34).move_to(top)
        self.play(ReplacementTransform(top, top2))
        for i in (1, 3):
            self.play(boxes[i].animate.set_stroke(color=DIMC), logs[i].animate.set_stroke(color=DIMC), run_time=.8)
        self.play(boxes[1].animate.set_stroke(color=WHITE), logs[1].animate.set_stroke(color=BLUE_C), run_time=.8)
        self.play(boxes[3].animate.set_stroke(color=WHITE), logs[3].animate.set_stroke(color=BLUE_C), run_time=.8)
        self.wait_cap()

        self.say("In 1998 Leslie Lamport described Paxos: the logs never disagree, and when a majority is up and steady, new commands get through.")
        top3 = Text("never inconsistent  ·  makes progress when a majority is steady", font=SERIF, font_size=32, slant=ITALIC, t2c={"never inconsistent": OK}).move_to(top)
        self.play(ReplacementTransform(top2, top3))
        for k in range(3):
            self.play(*[Indicate(logs[i], color=OK) for i in range(5)], run_time=1.2)
        self.wait_cap()

        self.say("He told it as the story of an ancient island parliament. We will follow the story.")
        self.play(*[FadeOut(m) for m in self.mobjects if m is not self.clockobj and m.z_index < 100], run_time=.8)
        g = T("an island parliament", 60).shift(UP * .3)
        self.play(Write(g), run_time=1.5)
        self.outro()


class P03Island(Film):
    def construct(self):
        pts = [(-.9, -2.2), (.9, -2.2), (1.0, -.5), (3.0, 1.3), (3.3, 2.5), (2.2, 2.6), (1.6, 1.3), (0, .3), (-1.6, 1.3), (-2.2, 2.6), (-3.3, 2.5), (-3.0, 1.3), (-1.0, -.5)]
        isle = Polygon(*[[x, y + .2, 0] for x, y in pts], fill_color="#2b2a1f", fill_opacity=1, stroke_color="#6e6a4c", stroke_width=4).round_corners(.3)
        road = VMobject(stroke_color="#b8a878", stroke_width=4).set_points_as_corners([np.array(p) for p in ([0, -2.0, 0], [0, -.2, 0], [0, .35, 0])])
        arm_l = VMobject(stroke_color="#b8a878", stroke_width=4).set_points_as_corners([np.array(p) for p in ([0, .35, 0], [-1.6, 1.5, 0], [-2.7, 2.4, 0])])
        arm_r = VMobject(stroke_color="#b8a878", stroke_width=4).set_points_as_corners([np.array(p) for p in ([0, .35, 0], [1.6, 1.5, 0], [2.7, 2.4, 0])])
        bay = T("the bay", 24, "#5a7aa0").move_to([0, 1.8, 0])
        chamber = VGroup(Circle(radius=.22, fill_color="#1c1c22", fill_opacity=1, stroke_color="#b8b09c", stroke_width=5).move_to([-2.7, 2.1, 0]),
                         T("the Chamber", 26, WHITE).move_to([-3.6, 1.0, 0]))
        schedia = VGroup(Circle(radius=.22, fill_color="#1c1c22", fill_opacity=1, stroke_color="#b8b09c", stroke_width=5).move_to([2.7, 2.1, 0]),
                         T("Schedia and its Tholos", 26, WHITE).move_to([3.6, 1.0, 0]))
        hall = VGroup(Dot([0, .5, 0], radius=.1, color=OPEN), T("hall of two doors", 22, SOFT).move_to([0, .0, 0]))
        coast = T("the scholars' coast", 26, SOFT).move_to([0, -1.5, 0])
        title = head("The island of Paxos")

        self.say("Paxos is shaped like a Y. Two arms reach north and face each other across a bay.")
        self.play(FadeIn(title), DrawBorderThenFill(isle), run_time=2.5)
        self.play(FadeIn(bay))
        self.wait_cap()
        self.say("The western arm holds the Chamber of the Paxon Parliament. The eastern arm holds the city of Schedia, which keeps laws of its own.")
        self.play(GrowFromCenter(chamber[0]), FadeIn(chamber[1]), run_time=1.2)
        self.play(GrowFromCenter(schedia[0]), FadeIn(schedia[1]), run_time=1.2)
        self.wait_cap()
        self.say("Below the fork the stem widens into the island's southern coast. One road runs up the stem and out along both arms.")
        self.play(Create(road), Create(arm_l), Create(arm_r), FadeIn(hall), FadeIn(coast), run_time=3)
        self.wait_cap()
        self.say("The Chamber is a round hall of hard stone under one conical roof, with no podium and no head of the room.")
        self.play(*[FadeOut(m) for m in (isle, road, arm_l, arm_r, bay, schedia, hall, coast, chamber[1], title)], chamber[0].animate.move_to(ORIGIN + UP * .6).scale(1), run_time=1.5)
        ch = rotunda(2.2, UP * .6)
        self.play(FadeOut(chamber[0]), FadeIn(ch), run_time=1.2)
        self.wait_cap()
        self.say("Its acoustics are poor, so oratory is impossible. Legislators can talk only through messengers, and the one door lets them come and go as they please.")
        ls = [legis(s, .28).move_to(UP * .6 + pol(.9 + .3 * (i % 2), 72 * i + 20)) for i, s in enumerate(GL)]
        self.play(LaggedStart(*[FadeIn(l) for l in ls], lag_ratio=.2), run_time=1.5)
        m = messenger().move_to(ls[0])
        self.add(m)
        self.play(MoveAlongPath(m, Line(ls[0].get_center(), ls[3].get_center())), run_time=1.5)
        self.play(ls[2].animate.move_to(UP * .6 + pol(2.2, 270) + DOWN * .5), run_time=1.5)
        self.outro()


class P04Requirements(Film):
    def construct(self):
        title = head("What the Parliament must do")
        xs = [-5.2, -2.6, 0, 2.6, 5.2]
        legs = [legis(s, .28).move_to([x, 2.5, 0]) for s, x in zip(GL, xs)]
        scr = [scroll(1.8, 1.9).move_to([x, .7, 0]) for x in xs]

        def entry(n, txt, col=PARCH):
            return T(f"{n}: {txt}", 15, col, italic=False)
        self.say("The Parliament's task is to settle the law of the land: a numbered sequence of decrees.")
        self.play(FadeIn(title))
        self.wait_cap()
        self.say("Nobody will sit in the Chamber to keep the record, so each legislator keeps his own scroll, and writes into it the decrees that have passed, in order.")
        self.play(LaggedStart(*[AnimationGroup(FadeIn(l), FadeIn(s)) for l, s in zip(legs, scr)], lag_ratio=.15), run_time=2)
        e = [entry(155, "The olive tax is\n3 drachmas per ton") for _ in range(2)]
        for t_, i in zip(e, (0, 2)):
            t_.move_to(scr[i][0].get_center() + UP * .3)
            t_.scale(.8)
        self.play(*[Write(t_) for t_ in e], run_time=2)
        self.wait_cap()
        self.say("First, consistency: no two scrolls may ever give different decrees for one number. A scroll may only lack an entry it hasn't heard of.")
        self.play(*[Indicate(scr[i][0], color=OK) for i in (0, 2)], run_time=1.2)
        ck = check(1.4).move_to([0, -1.2, 0])
        self.play(Create(ck))
        self.wait_cap()
        self.say("Blank scrolls would be consistent too. So: progress. If a majority stays in the Chamber long enough, any proposed decree passes and is written down.")
        self.play(FadeOut(ck), FadeOut(VGroup(*e)))
        maj = SurroundingRectangle(VGroup(*legs[:3], *scr[:3]), color=OK, buff=.2, corner_radius=.2)
        prog = T("passed, and written in every scroll present", 28, OK).move_to([0, -1.4, 0])
        dec = T("N: a new decree", 18, OPEN, italic=False)
        self.play(Create(maj))
        self.play(LaggedStart(*[Write(dec.copy().scale(.9).move_to(scr[i][0].get_center())) for i in range(3)], lag_ratio=.4), FadeIn(prog), run_time=2.5)
        self.wait_cap()
        self.say("It is hard. One group could pass a decree and leave for a banquet, and another could pass the opposite, knowing nothing.")
        self.play(FadeOut(maj), FadeOut(prog))
        c1 = T("37: Painting on temple walls is forbidden", 24, PARCH, italic=False).move_to([0, -.8, 0])
        c2 = T("37: Freedom of artistic expression is guaranteed", 24, PARCH, italic=False).move_to([0, -1.5, 0])
        self.play(Write(c1))
        self.play(Write(c2))
        self.play(GrowFromCenter(cross(1.4).move_to([5.6, -1.15, 0])))
        self.outro()


class P05Assumptions(Film):
    def construct(self):
        title = head("What the legislators have")
        C = UP * .4
        ch = rotunda(2.3, C)
        door = pol(2.3, 270, C)
        a = legis("Α", .3).move_to(C + np.array([-.8, .5, 0]))
        b = legis("Β", .3).move_to(C + np.array([.9, .3, 0]))
        sl = scroll(.9, 1.1, 3).move_to([-5.2, .8, 0])
        slip = Rectangle(width=.7, height=.5, fill_color=PARCH, fill_opacity=1, stroke_width=0).move_to(a.get_center() + RIGHT * .6)
        self.say("A legislator who leaves may forget what he was doing, so key notes go in the back of his scroll, in indelible ink. A slip of paper may be lost.")
        self.play(FadeIn(title), FadeIn(ch), FadeIn(a), FadeIn(b), FadeIn(sl), FadeIn(slip))
        lab1 = T("scroll: kept for good", 24, OK).next_to(sl, DOWN, buff=.3)
        lab2 = T("slip: may be lost", 24, ATTACK).next_to(slip, UP, buff=.9).shift(LEFT * .2)
        self.play(FadeIn(lab1), FadeIn(lab2))
        self.play(a.animate.move_to(door + DOWN * .3), slip.animate.move_to(door + DOWN * .3 + RIGHT * .3), run_time=1.5)
        self.play(FadeOut(slip), a.animate.move_to(door + DOWN * 1.6 + LEFT * 1.5), run_time=1.5)
        self.play(Indicate(sl, color=OK))
        self.wait_cap()

        self.say("Legislators can only send messengers. A messenger never garbles a message, but may forget he delivered it, and deliver it again.")
        self.play(FadeOut(lab1), FadeOut(lab2), a.animate.move_to(C + np.array([-.8, .5, 0])), run_time=1)
        m = messenger().move_to(a)
        self.add(m)
        self.play(MoveAlongPath(m, Line(a.get_center(), b.get_center())), run_time=1.2)
        m2 = messenger(OPEN).move_to(a)
        self.add(m2)
        self.play(MoveAlongPath(m2, Line(a.get_center(), b.get_center())), run_time=1.2)
        twice = T("delivered twice", 26, OPEN).move_to(C + DOWN * 1.2)
        self.play(FadeIn(twice))
        self.wait_cap()

        self.say("A messenger may leave on a long voyage and never deliver. Inside the Chamber everyone acts promptly; outside it, anything takes any time.")
        self.play(FadeOut(twice))
        m3 = messenger().move_to(a)
        self.add(m3)
        self.play(MoveAlongPath(m3, Line(a.get_center(), door + DOWN * .2)), run_time=1.2)
        self.play(m3.animate.move_to(door + DOWN * 2.0 + RIGHT * 4.5), run_time=2.5)
        self.play(FadeOut(m3))
        self.wait_cap()

        self.say("And everyone is honest. The danger is not lies. It is absence.")
        self.play(Indicate(ch[0], color="#b8b09c", scale_factor=1.04), run_time=1.5)
        self.outro()
