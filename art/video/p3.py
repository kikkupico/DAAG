from common import *


class P10Progress(Film):
    def construct(self):
        title = head("Starting too many ballots")
        A = legis("Α", .38).move_to([-5.3, .3, 0])
        B = legis("Β", .38).move_to([5.3, .3, 0])
        Q = VGroup(*[legis(s, .33) for s in "ΓΔΕ"]).arrange(RIGHT, buff=.9).move_to([0, .3, 0])
        nb = T("promised: nothing below —", 22, SOFT).move_to([0, -1.1, 0])
        self.say("A ballot is safe. But nothing yet makes anyone start one, and starting too many can block everything.")
        self.play(FadeIn(title), FadeIn(A), FadeIn(B), FadeIn(Q), run_time=1.5)
        self.wait_cap()

        self.say("A new ballot makes its quorum promise never to vote in anything lower, so each new ballot can doom the one before it.")
        lab_a = T("ballot 14", 28, HOLD).next_to(A, UP, buff=.35)
        self.play(FadeIn(lab_a))
        m = [messenger(HOLD).move_to(A) for _ in range(3)]
        self.add(*m)
        self.play(*[MoveAlongPath(x, Line(A.get_center(), q.get_center()), run_time=1.6) for x, q in zip(m, Q)])
        pr = T("promised: nothing below 14", 22, HOLD).move_to([0, -1.1, 0])
        self.play(FadeOut(VGroup(*m)), FadeIn(pr))
        self.wait_cap()

        self.say("Two priests, each sure he is in charge, keep starting higher ballots, and neither ever finishes.")
        cur = pr
        self.play(FadeOut(lab_a), run_time=.3)
        for k, (who, n, col) in enumerate((("B", 15, ATTACK), ("A", 16, HOLD), ("B", 17, ATTACK), ("A", 18, HOLD))):
            src = B if who == "B" else A
            lab = T(f"ballot {n}", 28, col).next_to(src, UP, buff=.35)
            old = lab_a if who == "A" else None
            ms = [messenger(col).move_to(src) for _ in range(3)]
            self.add(*ms)
            newp = T(f"promised: nothing below {n}", 22, col).move_to([0, -1.1, 0])
            self.play(FadeIn(lab), *[MoveAlongPath(x, Line(src.get_center(), q.get_center()), run_time=1.0) for x, q in zip(ms, Q)])
            x_ = cross(.6).move_to([0, 1.5, 0])
            self.play(FadeOut(VGroup(*ms)), ReplacementTransform(cur, newp), GrowFromCenter(x_), run_time=.8)
            self.play(FadeOut(x_), FadeOut(lab), run_time=.3)
            cur = newp
        self.wait_cap()

        self.say("The cure is to pick one president who alone starts ballots, and to start a new one only when the last has had time to succeed.")
        self.play(B.animate.set_opacity(.25), FadeOut(cur), run_time=1)
        crown = T("the president", 26, OK).next_to(A, DOWN, buff=.3)
        self.play(FadeIn(crown))
        lab = T("ballot 19", 28, HOLD).next_to(A, UP, buff=.35)
        ms = [messenger(HOLD).move_to(A) for _ in range(3)]
        self.add(*ms)
        self.play(FadeIn(lab), *[MoveAlongPath(x, Line(A.get_center(), q.get_center()), run_time=1.6) for x, q in zip(ms, Q)])
        votes = VGroup(*[check(.5).next_to(q, DOWN, buff=.4) for q in Q])
        self.play(FadeOut(VGroup(*ms)), LaggedStart(*[Create(v) for v in votes], lag_ratio=.3), run_time=1.5)
        self.wait_cap()

        self.say("Safety never depended on any of this. Only progress did.")
        self.play(Indicate(votes, color=OK), run_time=1.5)
        self.outro()


class P11Parliament(Film):
    def construct(self):
        title = head("Many decrees, one president")
        nums = list(range(123, 131))
        xs = [-5.6 + 1.6 * i for i in range(8)]
        slots = {n: RoundedRectangle(width=1.35, height=.95, corner_radius=.1, stroke_color="#a8905c", stroke_width=2, fill_color="#2a2620", fill_opacity=1).move_to([x, 1.4, 0]) for n, x in zip(nums, xs)}
        lab = {n: T(str(n), 20, SOFT, italic=False).next_to(slots[n], UP, buff=.12) for n in nums}
        fill = {123: "passed", 124: "passed", 126: "passed"}
        self.say("The real Parliament must pass a long series of decrees, numbered one after another.")
        self.play(FadeIn(title), LaggedStart(*[AnimationGroup(Create(slots[n]), FadeIn(lab[n])) for n in nums], lag_ratio=.1), run_time=2.5)
        marks = {n: T("✓", 28, OK, italic=False).move_to(slots[n]) for n in (123, 124, 126)}
        self.play(*[FadeIn(m) for m in marks.values()])
        self.wait_cap()

        self.say("It is really a separate Synod for each decree number, but with a single president for all of them.")
        pres = legis("Δ", .38).move_to([-5.6, -1.0, 0])
        pl = T("the president", 24, OK).next_to(pres, DOWN, buff=.15)
        self.play(FadeIn(pres), FadeIn(pl))
        self.wait_cap()

        self.say("A new president sends one question covering every open number at once. Each reply says what that legislator has voted for.")
        sweep = Rectangle(width=12.5, height=1.3, stroke_color=HOLD, stroke_width=3, fill_color=HOLD, fill_opacity=.12).move_to([0.3, 1.4, 0])
        q_ = T("one question for every open number", 26, HOLD).move_to([0, -.4, 0])
        m = messenger(HOLD).move_to(pres)
        self.add(m)
        self.play(MoveAlongPath(m, Line(pres.get_center(), [-5.6, 0.6, 0])), FadeIn(sweep), FadeIn(q_), run_time=2)
        self.play(FadeOut(m))
        self.wait_cap()

        self.say("Suppose he learns of decree 126 but nothing at all about 125. He fills the gap with a harmless decree: the ides of February is national olive day.")
        self.play(Indicate(slots[125], color=ATTACK, scale_factor=1.2), FadeOut(q_))
        qm = T("?", 40, ATTACK, italic=False).move_to(slots[125])
        self.play(FadeIn(qm))
        olive = T("olive\nday", 20, OPEN, italic=False, line_spacing=.8).move_to(slots[125])
        self.play(ReplacementTransform(qm, olive), FadeOut(sweep), run_time=1.5)
        self.wait_cap()

        self.say("Only then does he pass new decrees, in order after everything already in the book.")
        new = T("citizen's\ndecree", 20, OK, italic=False, line_spacing=.8).move_to(slots[127])
        self.play(Create(Line(pres.get_center(), slots[127].get_bottom() + DOWN * .1, color=OK, stroke_width=3)), run_time=1)
        self.play(FadeIn(new), Indicate(slots[127], color=OK))
        self.wait_cap()

        self.say("Once a president is chosen, a decree needs just three steps: ask the quorum to vote, hear their votes, announce the result.")
        self.play(*[FadeOut(m) for m in self.mobjects if m is not self.clockobj and m.z_index < 100 and m is not title], run_time=.8)
        P = legis("Δ", .4).move_to([-5, -.2, 0])
        Qs = VGroup(*[legis(s, .32) for s in "ΑΒΓ"]).arrange(DOWN, buff=.5).move_to([0, -.2, 0])
        Al = VGroup(*[legis(s, .28) for s in GL]).arrange(DOWN, buff=.3).move_to([5, -.2, 0])
        self.play(FadeIn(P), FadeIn(Qs), FadeIn(Al))
        steps = [("vote for this", P, Qs, HOLD), ("voted", Qs, P, OK), ("it passed", P, Al, OPEN)]
        for k, (txt, src, dst, col) in enumerate(steps):
            t_ = T(f"{k + 1}  {txt}", 28, col).move_to([-3.2 + 3.2 * k, 2.2, 0])
            ms = [messenger(col).move_to(src.get_center() if src is P else s.get_center()) for s in (dst if dst is not P else src)]
            self.add(*ms)
            tgt = [d.get_center() for d in dst] if dst is not P else [P.get_center()] * len(ms)
            self.play(FadeIn(t_), *[MoveAlongPath(m_, Line(m_.get_center(), tg), run_time=1.6) for m_, tg in zip(ms, tgt)])
            self.play(*[FadeOut(m_) for m_ in ms], run_time=.3)
        self.outro()


class P12Developments(Film):
    def construct(self):
        title = head("The protocol grows")
        cards = [("choosing a president", "the one who stays\nuntil he leaves", 0), ("long scrolls", "law books keep only\nthe current law", 1),
                 ("choosing legislators", "added and removed\nby decree", 2), ("repeated decrees", "old decrees passed again\nheal mistakes", 3)]
        xs = [-5.2, -1.75, 1.75, 5.2]

        def card(i):
            r = RoundedRectangle(width=3.2, height=3.4, corner_radius=.2, stroke_color=DIMC, stroke_width=3).move_to([xs[i], .4, 0])
            t1 = T(cards[i][0], 24).move_to(r.get_top() + DOWN * .5)
            t2 = T(cards[i][1], 20, SOFT, line_spacing=.85).move_to(r.get_bottom() + UP * .6)
            if i == 0:
                art = VGroup(legis("Α", .3).shift(LEFT * .8), legis("Β", .3), legis("Γ", .3).shift(RIGHT * .8), T("▼", 22, OK, italic=False).shift(DOWN * .55 + RIGHT * .8)).move_to(r.get_center() + UP * .1)
            elif i == 1:
                art = VGroup(scroll(.9, 1.3, 5), T("→", 36, WHITE, italic=False), scroll(.9, .8, 2)).arrange(RIGHT, buff=.3).move_to(r.get_center() + UP * .1)
            elif i == 2:
                art = VGroup(legis("Δ", .3), T("+", 36, OK, italic=False), legis("Ε", .3)).arrange(RIGHT, buff=.3).move_to(r.get_center() + UP * .1)
            else:
                art = VGroup(*[T("2155: olive tax 9", 16, PARCH, italic=False), T("2605: olive tax 9", 16, OK, italic=False)]).arrange(DOWN, buff=.3).move_to(r.get_center() + UP * .1)
            return VGroup(r, t1, art, t2)
        cs = [card(i) for i in range(4)]
        self.say("Governing the island brought new problems, and the protocol grew.")
        self.play(FadeIn(title))
        self.wait_cap()
        self.say("At first the president was whoever came first alphabetically, so a legislator back from months away had to copy six months of decrees.")
        self.play(FadeIn(cs[0], shift=UP * .3), run_time=1.5)
        self.wait_cap()
        self.say("Scrolls of every decree grew too long, so they became law books holding only the current law and the number of the last decree.")
        self.play(FadeIn(cs[1], shift=UP * .3), run_time=1.5)
        self.wait_cap()
        self.say("Legislators were added and removed by decree. And old decrees were passed again, so that a mistake in any scroll would heal.")
        self.play(FadeIn(cs[2], shift=UP * .3), run_time=1.5)
        self.play(FadeIn(cs[3], shift=UP * .3), run_time=1.5)
        self.outro()


class P13Relevance(Film):
    def construct(self):
        rows = [("a legislator", "a server, or process"), ("a legislator's scroll", "stable storage"), ("a messenger, slow or lost", "a message that may be delayed, lost or duplicated"),
                ("a decree and its number", "a command at a position in a log"), ("any two majorities share a legislator", "quorum intersection"),
                ("the president", "the leader"), ("a ballot number", "a round, or proposal number"), ("question and promise", "prepare and promise"),
                ("propose and vote", "accept and accepted"), ("it passed", "commit")]
        hl, hr = T("in the Chamber", 30, OPEN).move_to([-2.4, 3.3, 0]), T("in a computer system", 30, BLUE_C).move_to([2.9, 3.3, 0])
        g = VGroup()
        for i, (l, r) in enumerate(rows):
            y = 2.65 - .5 * i
            lt = T(l, 22).move_to([0, y, 0]).align_to([-.3, 0, 0], RIGHT)
            ar = Arrow([-.15, y, 0], [.4, y, 0], buff=0, stroke_width=2.5, color=SOFT, max_tip_length_to_length_ratio=.35)
            rt = T(r, 22, italic=False).move_to([0, y, 0]).align_to([.55, 0, 0], LEFT)
            g.add(VGroup(lt, ar, rt))
        self.say("The island is a model of a replicated service: every server keeps the same log of commands, and the log is what the Parliament passes.")
        self.play(FadeIn(hl), FadeIn(hr))
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * .2) for r in g], lag_ratio=.4), run_time=6)
        self.wait_cap()

        self.say("The protocol never lets two logs disagree, however machines come and go. It makes progress whenever a majority is present and steady for long enough.")
        self.play(FadeOut(g), FadeOut(hl), FadeOut(hr))
        res = VGroup(T("Always safe.", 52, OK), T("Live whenever a majority is steady.", 52, OPEN)).arrange(DOWN, buff=.5).move_to([0, .4, 0])
        self.play(Write(res[0]), run_time=1.5)
        self.play(Write(res[1]), run_time=2)
        self.wait_cap()

        self.say("This is how it lives with the limit we met on the hill: it never gives up safety, and asks for progress only once things settle.")
        self.play(FadeOut(res))
        a = T("no protocol can promise progress when one machine may fail", 32, SOFT).move_to([0, 1.5, 0])
        b = T("so Paxos promises safety always, and progress when it can", 38, WHITE).move_to([0, .3, 0])
        self.play(FadeIn(a))
        self.play(Write(b), run_time=3)
        self.wait_cap()

        self.say("Its ballot protocol lives on as Paxos, the foundation of modern fault-tolerant distributed computing.")
        self.play(FadeOut(a), FadeOut(b))
        big = T("The Part-Time Parliament", 62).move_to([0, .6, 0])
        sub = T("Leslie Lamport, ACM Transactions on Computer Systems, 1998", 26, SOFT, italic=False).next_to(big, DOWN, buff=.5)
        sub2 = T("Distributed Algorithms of Ancient Greece  ·  Paxos", 26, SOFT, italic=False).next_to(sub, DOWN, buff=.3)
        self.play(Write(big), run_time=2)
        self.play(FadeIn(sub), FadeIn(sub2))
        self.outro()
