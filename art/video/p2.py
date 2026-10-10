from common import *


class P06Majorities(Film):
    def construct(self):
        xs = [-4.4, -2.2, 0, 2.2, 4.4]
        ls = {s: legis(s, .33).move_to([x, 1.2, 0]) for s, x in zip(GL, xs)}
        title = head("Why majorities")

        def ring(sym, col, r):
            return Circle(radius=r, stroke_color=col, stroke_width=5).move_to(ls[sym])
        self.say("Everything rests on one fact: any two majorities of legislators share a member.")
        self.play(FadeIn(title), LaggedStart(*[FadeIn(ls[s]) for s in GL], lag_ratio=.15), run_time=1.5)
        pairs = [("ΑΒΓ", "ΓΔΕ"), ("ΑΒΔ", "ΒΓΕ"), ("ΑΓΕ", "ΒΔΕ")]
        for a, b in pairs:
            ra = VGroup(*[ring(s, HOLD, .45) for s in a])
            rb = VGroup(*[ring(s, ATTACK, .55) for s in b])
            self.play(Create(ra), Create(rb), run_time=1)
            shared = [s for s in a if s in b][0]
            self.play(Indicate(ls[shared], color=OPEN, scale_factor=1.4), run_time=.9)
            self.play(FadeOut(ra), FadeOut(rb), run_time=.4)
        self.wait_cap()

        self.say("That shared member remembers what the first majority decided, even when everyone else has wandered off.")
        ra = VGroup(*[ring(s, HOLD, .45) for s in "ΑΒΓ"])
        rb = VGroup(*[ring(s, ATTACK, .55) for s in "ΓΔΕ"])
        self.play(Create(ra), run_time=1)
        sc = scroll(.8, 1.0, 3).move_to(ls["Γ"].get_center() + DOWN * 1.5)
        self.play(FadeIn(sc), *[ls[s].animate.set_opacity(.25) for s in "ΑΒ"], run_time=1)
        self.play(Create(rb), run_time=1)
        self.play(Indicate(sc, color=OK), run_time=1.2)
        self.wait_cap()

        self.say("The Paxons first solved a smaller puzzle: a Synod of priests choosing one symbolic decree, once every nineteen years.")
        self.play(FadeOut(ra), FadeOut(rb), FadeOut(sc), *[ls[s].animate.set_opacity(1) for s in "ΑΒ"])
        syn = T("one decree, chosen by ballots", 36).move_to([0, -.6, 0])
        self.play(Write(syn))
        self.wait_cap()

        self.say("A ballot is a vote on one decree by a chosen group, its quorum. It succeeds if every member of the quorum votes for it.")
        self.play(FadeOut(syn))
        card = RoundedRectangle(width=7.2, height=2.2, corner_radius=.2, stroke_color=DIMC, stroke_width=3).move_to([0, -1.1, 0])
        l1 = Text("ballot 14", font=SERIF, font_size=30, slant=ITALIC).move_to(card.get_top() + DOWN * .4)
        l2 = Text("decree α", font=SERIF, font_size=28, slant=ITALIC, color=OPEN).move_to(card.get_center() + LEFT * 2)
        quorum = ["Β", "Δ", "Ε"]
        l3 = T("quorum", 24, SOFT).move_to(card.get_center() + RIGHT * .2)
        qs = VGroup(*[legis(s, .25) for s in quorum]).arrange(RIGHT, buff=.25).next_to(l3, RIGHT, buff=.3)
        self.play(Create(card), FadeIn(l1), FadeIn(l2), FadeIn(l3), FadeIn(qs))
        l4 = T("votes for it", 24, SOFT).move_to(card.get_center() + DOWN * .6 + LEFT * 1.2)
        self.play(FadeIn(l4))
        marks = []
        for s, q_ in zip(quorum, qs):
            mk = check(.5).next_to(q_, DOWN, buff=.55) if s != "Δ" else cross(.5).next_to(q_, DOWN, buff=.55)
            marks.append(mk)
        self.play(LaggedStart(*[Create(m) for m in marks[::2]], lag_ratio=.6))
        self.play(Create(marks[1]))
        self.outro()


class P07Manuscript(Film):
    def construct(self):
        title = head("Three conditions")
        conds = VGroup(T("1   every ballot has its own number", 30), T("2   any two quorums share a priest", 30),
                       T("3   a ballot carries the decree of the latest earlier vote\n     by anyone in its quorum", 30, line_spacing=.9)).arrange(DOWN, aligned_edge=LEFT, buff=.5).move_to([0, .6, 0])
        self.say("Three conditions keep ballots safe. First, every ballot has its own number.")
        self.play(FadeIn(title), Write(conds[0]), run_time=2)
        self.wait_cap()
        self.say("Second, any two quorums share a priest.")
        self.play(Write(conds[1]), run_time=1.5)
        self.wait_cap()
        self.say("Third, if anyone in a ballot's quorum has voted before, the ballot must carry the decree of the latest of those earlier votes.")
        self.play(Write(conds[2]), run_time=2.5)
        self.wait_cap()

        self.play(FadeOut(conds))
        data = [(2, "α", "ΑΒΓΔ", "Δ"), (5, "β", "ΑΒΓΕ", "Γ"), (14, "α", "ΒΔΕ", "ΒΕ"), (27, "β", "ΑΓΔ", "ΑΓΔ"), (29, "β", "ΒΓΔ", "Β")]
        colx = {s: x for s, x in zip(GL, (-1.6, -.4, .8, 2.0, 3.2))}
        hdr = VGroup(T("ballot", 24, SOFT).move_to([-5.6, 2.3, 0]), T("decree", 24, SOFT).move_to([-4.0, 2.3, 0]),
                     *[legis(s, .2).move_to([colx[s], 2.3, 0]) for s in GL])
        rows, cells = [], {}
        for i, (no, dec, q_, v) in enumerate(data):
            y = 1.5 - .8 * i
            r = VGroup(T(str(no), 30, WHITE, italic=False).move_to([-5.6, y, 0]), T(dec, 34, OPEN, italic=False).move_to([-4.0, y, 0]))
            for s in q_:
                c = T(s, 28, WHITE, italic=False).move_to([colx[s], y, 0])
                r.add(c)
                cells[(no, s)] = c
                if s in v:
                    r.add(SurroundingRectangle(c, color=OK, buff=.12, stroke_width=3))
            rows.append(r)
        self.say("Here are five ballots among five priests. A boxed priest is one who voted. Ballot 27's quorum is Α, Γ and Δ.")
        self.play(FadeIn(hdr), LaggedStart(*[FadeIn(r) for r in rows], lag_ratio=.3), run_time=3)
        hl = SurroundingRectangle(rows[3], color=OPEN, buff=.1, corner_radius=.1)
        self.play(Create(hl))
        self.wait_cap()

        self.say("Γ voted in ballot 5, and Δ in ballot 2. The latest is ballot 5, so ballot 27 must carry ballot 5's decree: β.")
        a1 = CurvedArrow(rows[1][1].get_left() + LEFT * .3, rows[3][1].get_left() + LEFT * .3, angle=-TAU / 5, color=OK)
        self.play(Indicate(cells[(5, "Γ")], color=OK), Indicate(cells[(2, "Δ")], color=SOFT), run_time=1.5)
        self.play(Create(a1), run_time=1.5)
        self.play(Indicate(rows[3][1], color=OPEN, scale_factor=1.5))
        self.wait_cap()

        self.say("Ballot 29 reaches back to ballot 27 in the same way. A decree, once chosen, is passed forward.")
        a2 = CurvedArrow(rows[3][1].get_left() + LEFT * .6, rows[4][1].get_left() + LEFT * .6, angle=-TAU / 6, color=OK)
        self.play(hl.animate.become(SurroundingRectangle(rows[4], color=OPEN, buff=.1, corner_radius=.1)))
        self.play(Create(a2), Indicate(rows[4][1], color=OPEN, scale_factor=1.5), run_time=1.5)
        self.outro()


def ballot_stage(self):
    P = {"p": np.array([-4.0, .7, 0]), "Β": np.array([1.2, 2.3, 0]), "Γ": np.array([3.6, 1.0, 0]), "Δ": np.array([3.6, -.5, 0]), "Ε": np.array([1.2, -1.5, 0])}
    p = legis("Α", .38).move_to(P["p"])
    others = {s: legis(s, .33).move_to(P[s]) for s in "ΒΓΔΕ"}
    names = T("initiator", 22, SOFT).next_to(p, DOWN, buff=.2)
    return P, p, others, names


class P08Question(Film):
    def construct(self):
        title = head("One ballot, step by step")
        P, p, others, names = ballot_stage(self)
        quorum = "ΒΓΔ"
        self.say("A ballot is run by one priest, the initiator. He picks a fresh ballot number and a quorum, and sends each member a question.")
        self.play(FadeIn(title), FadeIn(p), FadeIn(names), LaggedStart(*[FadeIn(o) for o in others.values()], lag_ratio=.15), run_time=2)
        ring_q = VGroup(*[Circle(radius=.5, stroke_color=HOLD, stroke_width=4).move_to(others[s]) for s in quorum])
        num = Text("ballot 27", font=SERIF, font_size=30, slant=ITALIC).next_to(p, UP, buff=.5)
        self.play(Write(num), Create(ring_q), run_time=1.5)
        self.wait_cap()

        self.say("The question: tell me the latest vote you ever cast, and promise never to vote in any ballot numbered below this one.")
        qtxt = T("latest vote?   promise: nothing below 27", 26, OPEN).move_to([-2.6, -1.0, 0])
        ms = [messenger().move_to(p) for _ in quorum]
        self.add(*ms)
        self.play(FadeIn(qtxt), *[MoveAlongPath(m, Line(p.get_center(), others[s].get_center() + LEFT * .5), run_time=2.2) for m, s in zip(ms, quorum)])
        self.wait_cap()

        self.say("Each member who answers writes the promise in the back of his scroll, and replies with his latest vote, or with none.")
        votes = {"Β": "Β  none", "Γ": "Γ  5: β", "Δ": "Δ  2: α"}
        tags = {}
        for s in quorum:
            tag = VGroup(RoundedRectangle(width=1.0, height=.4, corner_radius=.1, stroke_color="#a8905c", stroke_width=2, fill_color="#2a2620", fill_opacity=1),
                         T("≥ 27", 18, PARCH, italic=False))
            tag.next_to(others[s], RIGHT, buff=.3)
            tags[s] = tag
        self.play(LaggedStart(*[FadeIn(tags[s]) for s in quorum], lag_ratio=.3), run_time=1.5)
        chips = {}
        for s in quorum:
            chips[s] = VGroup(RoundedRectangle(width=1.5, height=.42, corner_radius=.1, stroke_color=OPEN, stroke_width=2), T(votes[s], 20, WHITE, italic=False))
        rep = []
        for m, s in zip(ms, quorum):
            chips[s].move_to(m)
            rep.append(m)
        self.play(*[FadeOut(m) for m in ms])
        rms = [chips[s].copy().move_to(others[s].get_center() + LEFT * .5) for s in quorum]
        self.add(*rms)
        self.play(*[r.animate.move_to(p.get_center() + RIGHT * 1.9 + UP * (.9 - .55 * k)) for k, r in enumerate(rms)], run_time=2.5)
        self.wait_cap()

        self.say("Now the initiator holds a fact about the past: the latest vote of everyone he asked.")
        self.play(*[Indicate(r, color=OPEN) for r in rms], run_time=1.5)
        self.outro()


class P09Ballot(Film):
    def construct(self):
        title = head("One ballot, step by step")
        P, p, others, names = ballot_stage(self)
        quorum = "ΒΓΔ"
        ring_q = VGroup(*[Circle(radius=.5, stroke_color=HOLD, stroke_width=4).move_to(others[s]) for s in quorum])
        num = Text("ballot 27", font=SERIF, font_size=30, slant=ITALIC).next_to(p, UP, buff=.5)
        votes = {"Β": "Β  none", "Γ": "Γ  5: β", "Δ": "Δ  2: α"}
        chips = [VGroup(RoundedRectangle(width=1.5, height=.42, corner_radius=.1, stroke_color=OPEN, stroke_width=2), T(votes[s], 20, WHITE, italic=False)).move_to(p.get_center() + RIGHT * 1.9 + UP * (.9 - .55 * k)) for k, s in enumerate(quorum)]
        tags = {}
        for s in quorum:
            tags[s] = VGroup(RoundedRectangle(width=1.0, height=.4, corner_radius=.1, stroke_color="#a8905c", stroke_width=2, fill_color="#2a2620", fill_opacity=1), T("≥ 27", 18, PARCH, italic=False)).next_to(others[s], RIGHT, buff=.3)
        self.add(title, p, names, *others.values(), ring_q, num, *chips, *tags.values())
        self.wait(.5)

        self.say("If anyone has voted before, he must propose the decree of the latest of those votes. Only if nobody ever voted is he free to choose.")
        self.play(Indicate(chips[1], color=OK, scale_factor=1.3), run_time=1.5)
        dec = VGroup(RoundedRectangle(width=1.2, height=.7, corner_radius=.15, stroke_color=OK, stroke_width=3), T("β", 36, OK, italic=False)).move_to(p.get_center() + DOWN * 1.6 + LEFT * .2)
        forced = T("forced by the latest vote", 22, OK).next_to(dec, DOWN, buff=.15)
        self.play(TransformFromCopy(chips[1], dec), FadeIn(forced), run_time=1.5)
        self.wait_cap()

        self.say("He sends the ballot to the quorum: vote for this decree, in this ballot.")
        ms = [dec.copy().scale(.5).move_to(p) for _ in quorum]
        self.add(*ms)
        self.play(*[MoveAlongPath(m, Line(p.get_center(), others[s].get_center() + LEFT * .5), run_time=2.2) for m, s in zip(ms, quorum)])
        self.wait_cap()

        self.say("A member votes unless he has since promised something higher. His vote is written in the back of his scroll, and reported back.")
        vs = []
        for s, m in zip(quorum, ms):
            v = VGroup(Circle(radius=.2, fill_color=OK, fill_opacity=1, stroke_width=0), T("β", 22, "#0c0e12", italic=False, bold=True)).move_to(others[s].get_center() + UP * .62)
            vs.append(v)
        self.play(*[FadeOut(m) for m in ms], LaggedStart(*[GrowFromCenter(v) for v in vs], lag_ratio=.4), run_time=2)
        back = [v.copy() for v in vs]
        self.play(*[b.animate.move_to(p.get_center() + RIGHT * (.9 + .5 * k) + DOWN * (.9 + .4 * k) + RIGHT * 1.2) for k, b in enumerate(back)], run_time=2.5)
        self.wait_cap()

        self.say("When every member of the quorum has voted, the ballot has succeeded. The initiator writes the decree in his scroll, and tells everyone.")
        sc = scroll(.8, 1.0, 2).move_to(p.get_center() + LEFT * 1.4 + DOWN * .1)
        self.play(*[FadeOut(b) for b in back], FadeIn(sc), run_time=1)
        win = T("27: β", 20, OK, italic=False).move_to(sc[0].get_center() + DOWN * .1)
        self.play(Write(win))
        self.play(Flash(sc, color=OK, flash_radius=.7), run_time=1)
        ms2 = [messenger(OK).move_to(p) for _ in range(4)]
        self.add(*ms2)
        self.play(*[MoveAlongPath(m, Line(p.get_center(), others[s].get_center() + LEFT * .5), run_time=2.2) for m, s in zip(ms2, "ΒΓΔΕ")])
        self.wait_cap()

        self.say("Anyone who hears writes it down. That is the whole ballot.")
        ent = [T("27: β", 16, OK, italic=False).move_to(others[s].get_center() + DOWN * .62) for s in "ΒΓΔΕ"]
        self.play(*[FadeOut(m) for m in ms2], *[Write(e) for e in ent], run_time=1.5)
        self.outro()
