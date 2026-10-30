"""Scenes for the Limits of Agreement video. Each draws one moment as a function of local time t.

fn(cv, t, q, D): q[i] is the start time of caption i; D is the scene length.
On-screen prose is allegory only; the paper's own terms appear in the synopsis and the closing table.
"""
import math

from engine import *

SCENES = []


def scene(caps, lead=0.7, pad=1.2):
    def deco(fn):
        SCENES.append(dict(fn=fn, caps=caps, lead=lead, pad=pad))
        return fn
    return deco


def head(cv, t, s, t0=0.0):
    a = ph(t, t0, 0.8)
    cv.text(110, 95 - 6 * (1 - a), s, 54, WHITE, a, "lm", "i")
    cv.line([(110, 135), (110 + cv.width(s, 54, "i"), 135)], CYAN, 3, a)


def tentpos(n, cx=960, cy=470, r=395):
    return pol(cx, cy, r, {1: 135, 2: 45, 3: 315, 4: 225}[n])


# ============================================================ 1. title
@scene(["Can machines always agree, when one of them may stop without a word, and messages can take any time at all?",
        "Four mercenaries at the foot of a hill will find out."])
def s_title(cv, t, q, D):
    cv.text(960, 330, "The Limits of Agreement", 124, WHITE, ph(t, 0.3, 1.4), kind="i")
    cv.line([(520, 410), (1400, 410)], CYAN, 3, ph(t, 1.2, 1.2))
    cv.text(960, 470, "after Fischer, Lynch & Paterson, 1985", 38, GREY, ph(t, 1.8, 1.0))
    for i, n in enumerate((1, 2, 3, 4)):
        tent(cv, n, 660 + i * 200, 680, 1.3, ph(t, q[1] - 0.3 + i * 0.25, 0.6))


# ============================================================ 2. the synopsis
@scene(["Take a group of computers that must settle on one answer: yes, or no.",
        "Messages between them can be delayed for as long as you like, and any one machine may crash without a word.",
        "In 1985, Fischer, Lynch and Paterson proved that no fixed procedure can promise the group ever settles.",
        "To see why, we go to a hill in ancient Greece."])
def s_synopsis(cv, t, q, D):
    N = [(640, 360), (1280, 360), (1280, 660), (640, 660)]
    edges = [(0, 1), (1, 2), (2, 3), (3, 0), (0, 2), (1, 3)]
    gone = ph(t, q[3], 0.8)
    base = 1 - gone
    for i, j in edges:
        cv.line([N[i], N[j]], DIM, 2, ph(t, 0.8, 1.0) * base)
    # messages: (from, to, start, duration); the late ones hang in the air once q[1] arrives
    def msg(i, j, t0, dur, stall=None):
        u = (t - t0) / dur
        if not 0 <= u <= 1:
            return
        if stall and t > q[1]:
            u = min(u, stall) + 0.012 * math.sin(t * 5)
        p = lerp2(N[i], N[j], ease(u))
        cv.circle(*p, 8, fill=WHITE, a=base)
    for k in range(6):
        msg(k % 4, (k * 3 + 1) % 4 if (k * 3 + 1) % 4 != k % 4 else (k + 2) % 4, q[0] + 1.2 + k * 0.5, 2.0)
    msg(0, 2, q[1] + 0.3, 6.0, 0.45)
    msg(1, 3, q[1] + 0.8, 6.0, 0.62)
    msg(3, 1, q[1] + 1.4, 6.0, 0.3)
    states = ["?", "?", "?", "?"]
    for k, (x, y) in enumerate(N):
        crashed = (k == 2 and t > q[1] + 1.0)
        col = DIM if crashed else WHITE
        cv.circle(x, y, 52, fill=BG, outline=col, w=4, a=base)
        s, c = "?", GREY
        if t > q[2] + 0.5 and k in (0, 1):
            s, c = "yes", CYAN
        if t > q[2] + 0.5 and k == 3:
            s, c = "?", YELLOW
        if crashed:
            s, c = "", DIM
        cv.text(x, y - 2, s, 34 if s != "?" else 44, c, base * ph(t, 0.6 + 0.1 * k, 0.6), kind="i")
    if t > q[1] + 1.0:
        x, y = N[2]
        cv.cross(x, y, 1.1, DIM, base)
        cv.text(x + 90, y, "crashed, silently", 28, GREY, base * ph(t, q[1] + 1.0, 0.6), "lm", "i")
    cv.text(960, 220, "everyone must settle on the same answer", 40, WHITE, base * ph(t, q[0], 0.8) * (1 - ph(t, q[1], 0.5)), kind="i")
    cv.text(960, 220, "delays with no limit  ·  one silent failure", 40, WHITE, base * ph(t, q[1], 0.8) * (1 - ph(t, q[2], 0.5)), kind="i")
    a2 = base * ph(t, q[2], 0.8)
    cv.rich(960, 220, [("no fixed procedure ", WHITE), ("guarantees", CORAL), (" they ever settle", WHITE)], 40, a2, "i")
    cv.text(960, 500, "an ancient Greek hill", 70, WHITE, gone * 0.0 + ph(t, q[3] + 0.8, 0.9), kind="i")


# ============================================================ 3. the hill
@scene(["Mount Phyle is a hill broad enough to block every line of sight across it.",
        "Bandits hold its crown, behind a ring wall that has no gate.",
        "Four mercenaries, hired to clear them out, are camped at the foot, one to a tent.",
        "Each man goes by his tent's number. Two wooded spurs stand between neighbours, so no one can see another.",
        "Word passes between the tents only by raven."])
def s_hill(cv, t, q, D):
    cx, cy = 960, 470
    head(cv, t, "The foot of Mount Phyle")
    m = ph(t, 0.3, 1.5)
    cv.circle(cx, cy, 330 * m, fill=(24, 33, 29))
    for r in (270, 210, 150, 90):
        cv.circle(cx, cy, r * m, outline=(42, 56, 46), w=2)
    cv.circle(cx, cy, 330 * m, outline=(70, 96, 70), w=4)
    for k in range(8):
        ang = 22.5 + 45 * k
        u = ph(t, 0.9 + 0.08 * k, 0.8)
        cv.line([pol(cx, cy, 80, ang), pol(cx, cy, 80 + 250 * u, ang)], (58, 88, 56), 14)
        for j in range(5):
            if u > (j + 1) / 5:
                x, y = pol(cx, cy, 120 + j * 48, ang)
                cv.poly([(x - 7, y + 8), (x + 7, y + 8), (x, y - 12)], fill=(36, 72, 44))
    for k in range(8):
        ang = 45 * k
        cv.line([pol(cx, cy, 100, ang), pol(cx, cy, 330, ang)], (92, 82, 58), 3, 0.7 * ph(t, 1.6, 0.8), dash=(8, 9))
    # the crown
    ca = ph(t, q[1] - 0.2, 0.9)
    cv.circle(cx, cy, 62, fill=(30, 30, 36), outline=(176, 168, 150), w=10, a=ca)
    for (dx, dy, col) in ((-22, -14, (150, 60, 170)), (20, -20, (130, 134, 140)), (6, 22, (150, 60, 170)), (-18, 20, (130, 134, 140))):
        cv.circle(cx + dx, cy + dy, 7, fill=col, a=ca)
    cv.circle(cx + 30, cy + 8, 5, fill=(214, 174, 60), a=ca)
    cv.line([(cx + 62, cy - 30), (1330, 250)], GREY, 2, ca * 0.8)
    cv.text(1340, 250, "the crown: bandits, and their loot", 30, WHITE, ca, "lm", "i")
    cv.text(1340, 292, "behind a ring wall with no gate", 26, GREY, ca, "lm", "i")
    # the tents
    for n in (1, 2, 3, 4):
        x, y = tentpos(n)
        a = ph(t, q[2] + 0.6 * n - 0.4, 0.6)
        tent(cv, n, x, y, 1.2, a)
    # sight lines, blocked by the spurs
    sa = ph(t, q[3] + 0.8, 0.8)
    for i, j in ((1, 2), (2, 3), (3, 4), (4, 1)):
        p, r = tentpos(i), tentpos(j)
        cv.line([lerp2(p, r, 0.12), lerp2(p, r, 0.88)], (200, 200, 210), 2, sa * 0.8, dash=(10, 8))
        mid = lerp2(p, r, 0.5)
        cv.cross(mid[0], mid[1], 0.8, CORAL, sa, 6)
    # ravens round the outside
    if t > q[4]:
        loops = [(1, 2, 0.0), (3, 4, 0.7), (2, 3, 1.5), (4, 1, 2.1)]
        for a_, b_, off in loops:
            u = ((t - q[4] - off) % 4.2) / 4.2
            if t - q[4] - off < 0:
                continue
            th0 = {1: 135, 2: 45, 3: 315, 4: 225}[a_]
            th1 = {1: 135, 2: 45, 3: 315, 4: 225}[b_]
            d = ((th1 - th0 + 180) % 360) - 180
            th = th0 + d * ease(u)
            x, y = pol(cx, cy, 430, th)
            heading = -(th + (90 if d > 0 else -90))
            raven(cv, x, y, 1.0, heading, WHITE, ph(t, q[4], 0.6), flap=math.sin(t * 12 + off))


# ============================================================ 4. the three demands
@scene(["Each mercenary formed an opinion at dusk from what he could see of his own quarter: attack, or hold.",
        "All four must do the same thing. Half attacking while half hold is worse than either.",
        "So the four ask three things of whatever they do with those opinions.",
        "First: no two of them commit to different answers.",
        "Second: both answers must stay possible. Always holding, whatever anyone saw, would make the evening pointless.",
        "Third: somebody must eventually commit. To commit is to leave the tent for good. Thinking counts for nothing.",
        "And no drawing lots: with the same sightings and the same arrivals, each man acts the same way every time."])
def s_demands(cv, t, q, D):
    xs = {1: 360, 2: 760, 3: 1160, 4: 1560}
    sight = {1: "A", 2: "H", 3: "H", 4: "A"}
    ya, yd = 280, 410
    for n in (1, 2, 3, 4):
        x = xs[n]
        tent(cv, n, x, ya, 1.3, ph(t, 0.3 + 0.15 * n, 0.6))
        sa = ph(t, q[0] + 1.0 + 0.4 * n, 0.6)
        cv.text(x + 62, ya - 16, "saw:", 24, GREY, sa, "lm", "i")
        cv.text(x + 62, ya + 16, "attack" if sight[n] == "A" else "hold", 30, CORAL if sight[n] == "A" else CYAN, sa, "lm", "i")
    # commitment dots below each tent
    def state(n):
        if t < q[3]:
            return None, 0
        if t < q[4] - 0.2:  # demand 1: all four commit to the same answer, then a split is refused
            u = ph(t, q[3] + 0.6 + 0.35 * n, 0.5)
            split = ph(t, q[3] + 3.2, 0.5)
            return ("H" if n in (1, 2) or split < 0.5 else "A") if u > 0.5 else None, u
        return None, 0
    if q[3] <= t < q[4] - 0.2:
        for n in (1, 2, 3, 4):
            s, u = state(n)
            if s:
                dot(cv, xs[n], yd, 24, s)
            else:
                dot(cv, xs[n], yd, 24, None)
        split = ph(t, q[3] + 3.2, 0.5)
    else:
        for n in (1, 2, 3, 4):
            dot(cv, xs[n], yd, 24, None, ph(t, q[3], 0.5))
    # three demand lines
    items = [("1", "No two commit to different answers", q[3]),
             ("2", "Both answers stay possible: what they do depends on what they saw", q[4]),
             ("3", "Somebody eventually commits", q[5])]
    for k, (num, s, t0) in enumerate(items):
        a = ph(t, t0, 0.7)
        y = 580 + k * 90
        cv.text(300, y, num, 48, YELLOW, a, "mm", "i")
        cv.text(360, y, s, 38, WHITE, a, "lm", "i")
    # visuals for each demand
    if q[3] <= t < q[4] - 0.2:
        u = ph(t, q[3] + 3.2, 0.5)
        if u == 0:
            cv.check(1790, yd, 1.1, GREEN, ph(t, q[3] + 2.4, 0.5))
        else:
            cv.cross(1790, yd, 1.1, CORAL, u)
    if q[4] <= t < q[5] - 0.2:
        u = ph(t, q[4] + 1.2, 0.8)
        cv.text(1720, 500, "always hold", 36, GREY, u, "mm", "i")
        cv.line([(1620, 500), (1820, 500)], CORAL, 5, ph(t, q[4] + 2.6, 0.6))
        cv.text(1720, 545, "pointless", 30, CORAL, ph(t, q[4] + 3.0, 0.6), "mm", "i")
        for n in (1, 2, 3, 4):
            dot(cv, xs[n], yd, 24, "H" if t > q[4] + 1.2 else None, 1.0)
    if t >= q[5] - 0.2:
        v = ph(t, q[5] + 0.8, 1.2)
        for n in (1, 2, 3, 4):
            dot(cv, xs[n], yd, 24, None, 1 - ph(t, q[5] + 2.3, 0.3) if n == 3 else 1)
        # man 3 leaves his tent for good
        if t > q[5] + 2.0:
            w = ph(t, q[5] + 2.0, 1.4)
            x, y = xs[3], yd
            tent(cv, 3, x, ya, 1.3, 1 - w * 0.9, silent=w > 0.5)
            cv.circle(x + 30 * w, y + 40 * w, 24, fill=CYAN, a=min(1, w * 2))
            cv.text(x + 30 * w, y + 41 * w, "H", 30, BG, min(1, w * 2), kind="b")
            cv.text(x + 150, y + 56, "gone from his tent, for good", 28, GREY, w, "lm", "i")
    if t >= q[6]:
        cv.text(1500, 760, "no lots", 40, WHITE, ph(t, q[6], 0.8), kind="i")
        cv.line([(1405, 760), (1595, 760)], CORAL, 5, ph(t, q[6] + 0.8, 0.6))


# ============================================================ 5. dead or slow
@scene(["Birds always arrive, but they take as long as they take. There is no longest flight.",
        "Any one man may be killed, and then his tent simply falls silent. Nobody is killed in this story. It only has to be possible.",
        "The man at tent 1 walks to his perch, and finds it empty.",
        "Either the man at tent 2 is gone and no bird will ever come, or he is well and his bird sits in a pine two spurs away.",
        "Nothing tells the two apart. Waiting longer never turns one into the other.",
        "So no one can wait to hear from everyone. Each man must act without having heard from all."])
def s_dead_slow(cv, t, q, D):
    # the flights: no longest one
    f = ph(t, 0.3, 0.6) * (1 - ph(t, q[1] - 0.3, 0.5))
    if f > 0:
        cv.text(960, 190, "how long does a bird take?", 52, WHITE, f, kind="i")
        for k, L in enumerate((180, 360, 640, 1100)):
            y = 300 + k * 90
            u = ph(t, 0.8 + 0.5 * k, 0.9)
            x0 = 300
            if k < 3:
                cv.line([(x0, y), (x0 + L * u, y)], CYAN, 5, f)
                raven(cv, x0 + L * u + 20, y - 2, 0.9, 0, WHITE, f * (u > 0.02), math.sin(t * 10 + k))
            else:
                cv.line([(x0, y), (x0 + L * u, y)], CYAN, 5, f, dash=(18, 12))
                cv.text(x0 + L * u + 40, y, "…", 50, WHITE, f * u)
        cv.text(1500, 480, "no longest flight", 40, YELLOW, f * ph(t, 4.0, 0.8), kind="i")
    # two possible worlds
    pa = ph(t, q[1] - 0.2, 0.8)
    if pa > 0:
        for side, x in (("dead", 480), ("slow", 1440)):
            y = 560
            t1, t2 = (x - 340, y), (x + 340, y)
            gone = side == "dead" and t > q[1] + 1.5
            tent(cv, 1, t1[0], t1[1], 1.9, pa)
            tent(cv, 2, t2[0], t2[1], 1.9, pa, silent=gone)
            for dx in (-120, 0, 120):
                cv.poly([(x + dx - 34, y + 50), (x + dx + 34, y + 50), (x + dx, y - 62)], fill=(26, 64, 40), a=pa)
            # the perch at tent 1
            cv.line([(t1[0] + 85, y - 90), (t1[0] + 165, y - 90)], (176, 150, 100), 8, pa)
            cv.line([(t1[0] + 95, y - 90), (t1[0] + 95, y - 56)], (176, 150, 100), 6, pa)
        # the slow bird in a pine
        if t > q[3]:
            raven(cv, 1440, 512 + 3 * math.sin(t * 2), 1.3, 0, WHITE, ph(t, q[3] + 1.5, 0.8))
            cv.text(1440, 420, "still in the pines", 32, GREY, ph(t, q[3] + 1.5, 0.8), kind="i")
        if t > q[1] + 1.5:
            cv.text(480, 700, "the man at tent 2 is gone", 34, GREY, ph(t, q[1] + 1.5, 0.8), kind="i")
            cv.text(1440, 700, "the man at tent 2 is well", 34, GREY, ph(t, q[1] + 1.5, 0.8), kind="i")
        # what tent 1 sees: the same empty perch
        e = ph(t, q[2], 0.8)
        for x in (480, 1440):
            tx = x - 340 + 125
            q_a = e * (0.7 + 0.3 * math.sin(t * 3))
            cv.text(tx, 410, "?", 90, YELLOW, q_a, kind="i")
        s = ph(t, q[4], 0.8)
        if s > 0:
            for x in (480, 1440):
                cv.rrect(x - 340 + 60, 450, x - 340 + 200, 540, 14, outline=YELLOW, w=3, a=s)
            cv.text(960, 510, "=", 90, YELLOW, s, kind="b")
            cv.text(960, 770, "the same empty perch, in both", 38, YELLOW, s, kind="i")
    w = ph(t, q[5], 0.8)
    if w > 0:
        cv.text(960, 850, "wait for everyone", 54, WHITE, w, kind="i")
        cv.line([(720, 850), (1200, 850)], CORAL, 6, ph(t, q[5] + 0.7, 0.6))


# ============================================================ 6. four words
@scene(["To say exactly when the matter is settled, we need four words.",
        "A standing: how the night stands, entire. What each man holds in his head, and every raven still aloft.",
        "An arrival: one named man taking in one named raven. It is the only kind of thing that happens.",
        "A fair course: a list of arrivals that could really happen. No raven stays aloft for ever, and at most one man falls silent.",
        "A standing is open if some fair course still ends in holding and another still ends in attacking. Closed, if only one answer remains."])
def s_words(cv, t, q, D):
    head(cv, t, "Four words")
    cxs = [250, 730, 1210, 1690]
    titles = ["a standing", "an arrival", "a fair course", "open  ·  closed"]
    notes = ["the whole night, at one instant", "one man takes in one raven",
             "arrivals that could really happen", "open: both answers still reachable. closed: only one"]
    for k in range(4):
        a = ph(t, q[k + 1] - 0.2, 0.8)
        px = cxs[k]
        cv.text(px, 228, titles[k], 50, YELLOW, a, kind="i")
        cv.para(px, 690, notes[k], 30, GREY, 400, a)
        if a <= 0:
            continue
        if k == 0:
            for j, n in enumerate((1, 2, 3, 4)):
                x = px - 135 + 90 * j
                tent(cv, n, x, 470, 0.62, a)
                dot(cv, x, 390, 12, None, a)
            for j in range(3):
                rx = px - 100 + 100 * j + 14 * math.sin(t * 1.2 + j)
                raven(cv, rx, 320 + 6 * math.sin(t * 2 + j), 0.8, 0, WHITE, a, math.sin(t * 9 + j))
            cv.rrect(px - 190, 290, px + 190, 520, 18, outline=DIM, w=2, a=a)
        if k == 1:
            for j, n in enumerate((1, 2, 3, 4)):
                x = px - 135 + 90 * j
                tent(cv, n, x, 470, 0.62, a)
                done = ((t - q[2]) % 4.0) > 2.2
                dot(cv, x, 390, 12, None, a)
                if n == 3 and done:
                    cv.circle(x, 390, 8, fill=YELLOW, a=a)
            u = ((t - q[2]) % 4.0) / 2.2
            u = min(1.0, u)
            p = lerp2((px - 110, 310), (px - 135 + 180, 372), ease(u))
            raven(cv, p[0], p[1], 0.9, 20, WHITE, a * (1 if u < 1 else 0.0), math.sin(t * 10))
        if k == 2:
            who = [2, 4, 1, 2, 3]
            for j, n in enumerate(who):
                x = px - 150 + 70 * j
                vis = ph(t, q[3] + 0.4 + 0.5 * j, 0.5)
                cv.circle(x, 420, 24, fill=TENT[n], outline=TENTL[n], w=3, a=a * vis)
                cv.text(x, 421, str(n), 28, WHITE, a * vis)
                if j < 4:
                    cv.arrow((x + 27, 420), (x + 43, 420), WHITE, 3, a * vis, 9)
            cv.text(px + 170, 420, "…", 40, WHITE, a * ph(t, q[3] + 3.0, 0.5))
        if k == 3:
            # open fork
            ro = (px - 95, 380)
            cv.circle(*ro, 20, outline=YELLOW, w=4, a=a)
            for dx, s in ((-55, "H"), (55, "A")):
                lf = (ro[0] + dx, 470)
                cv.line([(ro[0] + dx * 0.25, ro[1] + 20), (lf[0], lf[1] - 20)], WHITE, 3, a)
                dot(cv, lf[0], lf[1], 18, s, a)
            cv.text(ro[0], 540, "open", 30, YELLOW, a, kind="i")
            rc = (px + 105, 380)
            cv.circle(*rc, 20, fill=WHITE, a=a)
            for dx in (-45, 45):
                lf = (rc[0] + dx, 470)
                cv.line([(rc[0] + dx * 0.25, rc[1] + 20), (lf[0], lf[1] - 20)], WHITE, 3, a)
                dot(cv, lf[0], lf[1], 18, "H", a)
            cv.text(rc[0], 540, "closed", 30, WHITE, a, kind="i")


# ============================================================ 7. separate folds
@scene(["The first tool is the dullest fact in the book, and the most useful.",
        "Take two courses with no man in common: tents 1 and 2 trading ravens, and tents 3 and 4 trading theirs.",
        "Neither can get in the other's way. Run either one first...",
        "...and the night arrives at the very same standing."])
def s_folds(cv, t, q, D):
    head(cv, t, "The lemma of separate folds")
    S, L, R, B = (960, 270), (560, 500), (1360, 500), (960, 730)
    changed = {S: set(), L: {1, 2}, R: {3, 4}, B: {1, 2, 3, 4}}

    def node(p, a, glow=0.0):
        x, y = p
        cv.rrect(x - 130, y - 42, x + 130, y + 42, 16, fill=BG, outline=mix(DIM, YELLOW, glow) if glow else (110, 114, 126), w=3 + 2 * glow, a=a)
        for j, n in enumerate((1, 2, 3, 4)):
            dx = x - 84 + 56 * j
            if n in changed[p]:
                cv.circle(dx, y, 17, fill=TENTL[n], a=a)
            else:
                cv.circle(dx, y, 17, outline=TENT[n] if n != 2 else TENTL[2], w=3, a=a)
    node(S, ph(t, q[1] - 0.2, 0.7))

    def edge(p, r, t0, label, side, lx, ly, parts):
        u = ph(t, t0, 1.0)
        d = (r[0] - p[0], r[1] - p[1])
        n = math.hypot(*d)
        a_ = (p[0] + d[0] / n * 70, p[1] + d[1] / n * 70)
        b_ = (r[0] - d[0] / n * 70, r[1] - d[1] / n * 70)
        cv.arrow(a_, b_, WHITE, 4, 1, 16, frac=u)
        cv.rich(lx, ly, parts, 30, ph(t, t0 + 0.4, 0.8), "i") if side == "c" else None
    # courses
    g1 = ph(t, q[1] + 1.4, 1.0)
    g2 = ph(t, q[1] + 3.0, 1.0)
    node(L, g1)
    node(R, g2)
    edge(S, L, q[1] + 1.0, "", "n", 0, 0, [])
    edge(S, R, q[1] + 2.6, "", "n", 0, 0, [])
    cv.rich(640, 350, [("tents ", WHITE), ("1", TENTL[1]), (" and ", WHITE), ("2", TENTL[2]), (" trade", WHITE)], 30, g1, "i")
    cv.rich(1280, 350, [("tents ", WHITE), ("3", TENTL[3]), (" and ", WHITE), ("4", TENTL[4]), (" trade", WHITE)], 30, g2, "i")
    # the second legs
    b = ph(t, q[2], 0.8)
    node(B, b)
    edge(L, B, q[2] + 0.2, "", "n", 0, 0, [])
    edge(R, B, q[2] + 1.2, "", "n", 0, 0, [])
    cv.rich(640, 640, [("then ", GREY), ("3", TENTL[3]), (" and ", WHITE), ("4", TENTL[4])], 28, b, "i")
    cv.rich(1280, 640, [("then ", GREY), ("1", TENTL[1]), (" and ", WHITE), ("2", TENTL[2])], 28, ph(t, q[2] + 1.0, 0.8), "i")
    # tokens run the two routes
    if t > q[2] + 0.4:
        for off, route in ((0.0, (S, L, B)), (2.2, (S, R, B))):
            u = (t - q[2] - 0.6 - off) / 3.2
            if 0 <= u <= 1:
                seg = u * 2
                a_, b_ = (route[0], route[1]) if seg < 1 else (route[1], route[2])
                p = lerp2(a_, b_, ease(seg % 1 if seg < 1 else seg - 1))
                cv.circle(*p, 11, fill=YELLOW)
    if t > q[3]:
        gl = ph(t, q[3] + 0.4, 0.8)
        node(B, 1, gl)
        cv.text(960, 820, "the same standing either way", 38, GREEN, gl, kind="i")


# ============================================================ 8. dusk (chain)
@scene(["Next question: is the night already settled at dusk, by the sightings alone?",
        "Line the beginnings up, changing one man's sighting at a time, from everyone holding to everyone attacking.",
        "The second demand forces the two ends to opposite answers: hold at one end, attack at the other.",
        "Suppose every beginning were already settled. Then somewhere, two neighbours are settled opposite ways, and differ only in what one man saw.",
        "Call him tent 2, and let him be the silent one.",
        "The other three cannot tell the two beginnings apart, since he has told no one anything. So they must end the same way in both."])
def s_dusk(cv, t, q, D):
    head(cv, t, "The dusk that settles nothing")
    seq = ["HHHH", "AHHH", "AAHH", "AAAH", "AAAA"]
    xs = [290 + 335 * i for i in range(5)]
    y = 420
    for i, s in enumerate(seq):
        a = ph(t, q[1] + 0.5 + 0.55 * i, 0.6)
        cv.rrect(xs[i] - 125, y - 52, xs[i] + 125, y + 52, 18, outline=(110, 114, 126), w=3, a=a)
        for j in range(4):
            dot(cv, xs[i] - 84 + 56 * j, y, 21, s[j], a)
        if i < 4:
            n = i + 1
            cv.arrow((xs[i] + 134, y), (xs[i + 1] - 134, y), GREY, 3, a * ph(t, q[1] + 0.9 + 0.55 * i, 0.5), 12)
            cv.text((xs[i] + xs[i + 1]) / 2, y - 36, str(n), 26, TENTL[n], a * ph(t, q[1] + 0.9 + 0.55 * i, 0.5), kind="b")
    # fates under each beginning
    fates = [("hold", CYAN), ("hold", CYAN), ("attack", CORAL), ("attack", CORAL), ("attack", CORAL)]
    for i in (0, 4):
        cv.text(xs[i], y + 104, fates[i][0] + " is forced", 30, fates[i][1], ph(t, q[2] + 0.3, 0.8), kind="i")
    mid = ph(t, q[3] + 0.8, 0.8)
    for i in (1, 2, 3):
        cv.text(xs[i], y + 104, "settled: " + fates[i][0], 30, fates[i][1], mid * ph(t, q[3] + 0.8 + 0.3 * i, 0.6), kind="i")
    # the neighbouring pair that disagree
    pr = ph(t, q[3] + 3.4, 0.8)
    if pr > 0:
        cv.rrect(xs[1] - 140, y - 66, xs[2] + 140, y + 66, 24, outline=YELLOW, w=4, a=pr)
        cv.rich((xs[1] + xs[2]) / 2, y + 190, [("they differ only in what tent ", WHITE), ("2", TENTL[2]), (" saw", WHITE)], 32, pr, "i")
    p = ph(t, q[4], 0.8)
    if p > 0:
        for i in (1, 2):
            cv.circle(xs[i] - 28, y, 29, outline=TENTL[2], w=5, a=p)
        cv.text((xs[1] + xs[2]) / 2, y + 250, "he stays silent", 34, TENTL[2], p, kind="i")
    c = ph(t, q[5], 0.8)
    if c > 0:
        cv.rich((xs[1] + xs[2]) / 2, y + 310, [("the other three end the same way in both:  ", WHITE), ("hold", CYAN)], 32, c, "i")
        cv.cross(xs[2] + 118, y + 104, 0.7, CORAL, ph(t, q[5] + 2.2, 0.5), 6)
        cv.text((xs[1] + xs[2]) / 2, y + 370, "but the right one was settled for attack", 32, CORAL, ph(t, q[5] + 2.4, 0.6), "mm", "i")


# ============================================================ 9. dusk (in time)
@scene(["Draw the night in time. Each tent is a line running outward, and each ring further out is a later moment.",
        "Tent 2 saw hold on the left and attack on the right, and says nothing in either.",
        "The other three see the same ravens, in the same order, and so commit the same way in both.",
        "But the beginning on the right was settled for attack. So not every beginning can have been settled.",
        "Some way for the sightings to fall leaves the night open at dusk. And nobody has died."])
def s_polar(cv, t, q, D):
    head(cv, t, "The silent man, drawn in time")
    ang = {1: 135, 2: 45, 3: 315, 4: 225}
    ring = lambda k: 78 * k
    sight = {1: "A", 3: "H", 4: "H"}
    # (from tent, ring, to tent, ring)
    arcs = [(1, 1, 4, 2), (3, 1, 4, 2), (4, 2, 1, 3), (4, 2, 3, 3), (1, 3, 4, 4), (3, 3, 4, 4)]

    def arc(a, ra, b, rb):
        th0, th1 = ang[a], ang[b]
        d = ((th1 - th0 + 180) % 360) - 180
        return [pol(0, 0, lerp(ring(ra), ring(rb), s / 30), th0 + d * s / 30) for s in range(31)]

    for side, X, who in (("L", 500, "H"), ("R", 1420, "A")):
        Y = 475
        a0 = ph(t, 0.4, 0.8)
        for k in range(1, 5):
            cv.circle(X, Y, ring(k), outline=(40, 43, 54), w=2, a=a0)
        for n in (1, 2, 3, 4):
            end = pol(X, Y, ring(4) + 8, ang[n])
            dash = (8, 8) if n == 2 else None
            cv.line([(X, Y), end], TENTL[n] if n != 2 else (110, 150, 230), 3, a0 * (0.7 if n == 2 else 0.8), dash=dash)
            lx, ly = pol(X, Y, ring(4) + 42, ang[n])
            cv.text(lx, ly, str(n), 32, TENTL[n], a0, kind="b")
        # first dots: what each man saw
        d1 = ph(t, q[1], 0.8)
        for n in (1, 3, 4):
            x, y = pol(X, Y, ring(1), ang[n])
            dot(cv, x, y, 15, sight[n], d1)
        x, y = pol(X, Y, ring(1), ang[2])
        dot(cv, x, y, 15, who, d1)
        if d1 > 0.5:
            sx, sy = pol(X, Y, ring(3), ang[2])
            cv.text(sx + 8, sy - 18, "silent", 26, GREY, ph(t, q[1] + 1.2, 0.8), "lm", "i")
        # ravens as spirals: same in both panels
        t0 = q[2] + 0.2
        for k, (a, ra, b, rb) in enumerate(arcs):
            u = ph(t, t0 + 0.65 * k, 0.9)
            pts = [(X + p[0], Y + p[1]) for p in arc(a, ra, b, rb)]
            cv.line(prefix(pts, u), WHITE, 3, 0.9)
            if 0 < u < 1:
                raven(cv, *pts[min(30, int(u * 30))], 0.7, 0, WHITE, 1, math.sin(t * 10))
            if u >= 1:
                x, y = pts[-1]
                cv.circle(x, y, 7, fill=WHITE)
        # commits
        cm = ph(t, t0 + 4.5, 0.8)
        for n in (1, 3, 4):
            x, y = pol(X, Y, ring(4), ang[n])
            dot(cv, x, y, 15, "H", cm)
            if side == "R" and t > q[3] + 0.5:
                cv.cross(x, y, 0.45, BG, ph(t, q[3] + 0.5, 0.6), 5)
        lab = "tent 2 saw hold" if side == "L" else "tent 2 saw attack"
        cv.text(X, 860, lab, 36, CYAN if side == "L" else CORAL, ph(t, q[1], 0.8), kind="i")
    cv.text(960, 475, "=", 100, YELLOW, ph(t, q[2] + 4.8, 0.8) * 0.0, kind="b")
    u = ph(t, q[3], 0.8)
    if u > 0:
        cv.text(1420, 215, "was settled for attack", 34, CORAL, u, kind="i")
    v = ph(t, q[4], 0.8)
    if v > 0:
        cv.text(1300, 100, "so some beginning is open", 52, YELLOW, v, kind="i")


# ============================================================ 10. deferral
@scene(["Can the night stay open? Surely some arrival, sooner or later, must be the one that settles it.",
        "Take an open standing and a raven that could land. We will not stop it; birds are reliable.",
        "We only ask whether it must settle anything when it comes.",
        "Hold it back. Let other ravens land first, and then let it land. The night is open still.",
        "If the other raven is another man's business, the order between them cannot matter.",
        "If it is the same man's, let him go quiet, as a man does whose birds are in the pines, and let the other three finish. They cannot tell which landed first.",
        "Either way, no single raven is ever the one that has to settle the matter."])
def s_defer(cv, t, q, D):
    head(cv, t, "Deferring the telling arrival")
    xs = [300, 620, 940, 1260, 1580]
    y = 380
    who = [3, 4, 2, 1]
    for i, x in enumerate(xs):
        a = ph(t, q[0] + 0.4 + (0.3 * i if i == 0 else 0) if i == 0 else q[3] + 0.3 + 0.95 * (i - 1), 0.6)
        cv.circle(x, y, 32, fill=BG, outline=YELLOW, w=5, a=a)
        if i == 0:
            cv.text(x, y + 62, "open", 30, YELLOW, a, kind="i")
        if i > 0:
            n = who[i - 1]
            u = ph(t, q[3] + 0.3 + 0.95 * (i - 1), 0.7)
            cv.arrow((xs[i - 1] + 40, y), (x - 40, y), WHITE, 4, 1, 14, frac=u)
            cv.circle((xs[i - 1] + x) / 2, y - 34, 17, fill=TENT[n], outline=TENTL[n], w=2, a=u)
            cv.text((xs[i - 1] + x) / 2, y - 33, str(n), 20, WHITE, u)
    # the telling raven hovers, held back
    e = ph(t, q[1], 0.8)
    step = max(0.0, min(4.0, (t - q[3] - 0.3) / 0.95))
    hx = lerp(xs[0], xs[min(4, int(step))], 1) if step <= 0 else lerp(xs[int(step)], xs[min(4, int(step) + 1)], ease(step % 1)) if step < 4 else xs[4]
    hy = 235 + 8 * math.sin(t * 3)
    if t < q[3] + 0.3:
        hx = xs[0]
    landed = t > q[3] + 0.3 + 4 * 0.95 + 0.3
    if e > 0:
        raven(cv, hx, hy, 1.7, 0, YELLOW, e, math.sin(t * 8))
        cv.text(hx, hy - 52, "the telling raven", 28, YELLOW, e * ph(t, q[1] + 0.6, 0.8) * (0.0 if landed else 1.0), kind="i")
        cv.arrow((hx, hy + 30), (hx, y - 46), YELLOW, 3, e * (0.0 if t > q[3] + 0.3 else 0.8), 12, dash=(8, 8))
        if t > q[3] + 0.3 and not landed:
            cv.line([(hx, hy + 30), (hx, y - 46)], YELLOW, 3, 0.5, dash=(6, 10))
    if landed:
        cv.text(xs[4] - 100, 480, "it lands, and the night is open still", 34, GREEN, ph(t, q[3] + 4.5, 0.8), kind="i")
        cv.arrow((xs[4], hy + 40), (xs[4], y - 44), YELLOW, 4, 1, 12)
    # the two cases
    for k, (x0, t0) in enumerate(((140, q[4]), (1000, q[5]))):
        a = ph(t, t0, 0.8)
        cv.rrect(x0, 620, x0 + 780, 880, 20, outline=DIM, w=3, a=a)
        if k == 0:
            cv.text(x0 + 390, 665, "another man's raven", 34, WHITE, a, kind="i")
            S2, L2, R2, B2 = (x0 + 250, 720), (x0 + 130, 780), (x0 + 370, 780), (x0 + 250, 840)
            for p, q_ in ((S2, L2), (S2, R2), (L2, B2), (R2, B2)):
                cv.line([p, q_], GREY, 3, a)
            for p in (S2, L2, R2, B2):
                cv.circle(*p, 11, fill=BG, outline=YELLOW, w=3, a=a)
            cv.text(x0 + 450, 780, "order cannot matter", 32, GREEN, a, "lm", "i")
        else:
            cv.text(x0 + 390, 665, "the same man's raven", 34, WHITE, a, kind="i")
            tent(cv, 3, x0 + 150, 790, 1.2, a, silent=True)
            raven(cv, x0 + 150, 740 + 4 * math.sin(t * 2), 0.9, 0, GREY, a)
            cv.text(x0 + 150, 850, "goes quiet", 26, GREY, a, kind="i")
            for j, n in enumerate((1, 2, 4)):
                tent(cv, n, x0 + 330 + 90 * j, 790, 0.9, a)
            cv.text(x0 + 330 + 90, 850, "the rest finish, unable to tell", 26, GREEN, a, kind="i")


# ============================================================ 11. forever
@scene(["Now put the two facts together. Keep the four tents in a queue.",
        "Go to the man at the head. Let him take in the raven longest aloft, or find his perch empty. Choose the stretch before it so the night stays open.",
        "Send him to the back of the queue, and go to the next. Run this for ever.",
        "Nobody is starved of a turn, and every raven is taken in at last. The night is entirely fair, and nothing is ever settled.",
        "Nobody dies in it. Nobody commits to a wrong answer. Nobody commits at all.",
        "Nor is it about this hill: any number of men from two upward, and any two answers."])
def s_forever(cv, t, q, D):
    head(cv, t, "What cannot be promised")
    cx, cy = 560, 500
    cv.circle(cx, cy, 255, outline=(40, 43, 54), w=3, a=ph(t, 0.5, 0.8))
    for n in (1, 2, 3, 4):
        x, y = pol(cx, cy, 255, {1: 135, 2: 45, 3: 315, 4: 225}[n])
        tent(cv, n, x, y, 1.15, ph(t, q[0] + 0.2 * n, 0.6))
    # the queue pointer visits each tent in turn
    if t > q[1]:
        T = 1.25
        k = int((t - q[1]) / T)
        u = ((t - q[1]) % T) / T
        n = [1, 2, 3, 4][k % 4]
        x, y = pol(cx, cy, 255, {1: 135, 2: 45, 3: 315, 4: 225}[n])
        tx, ty = pol(cx, cy, 380, {1: 135, 2: 45, 3: 315, 4: 225}[n])
        p = lerp2((tx, ty), (x, y - 50), ease(min(1, u * 1.6)))
        raven(cv, p[0], p[1], 1.0, math.degrees(math.atan2(y - ty, x - tx)), WHITE, 1 - ph(u, 0.75, 0.2), math.sin(t * 12))
        cv.circle(x, y, 58, outline=YELLOW, w=4, a=0.9 * ph(u, 0.3, 0.3) * (1 - ph(u, 0.9, 0.1)))
        cv.text(cx, cy - 10, "arrivals so far", 26, GREY, ph(t, q[1], 0.8), kind="i")
        cv.text(cx, cy + 40, str(k), 70, WHITE, ph(t, q[1], 0.8), kind="b")
    # the status of the night
    cv.rrect(1000, 190, 1800, 300, 20, outline=YELLOW, w=4, a=ph(t, q[1], 0.8))
    cv.rich(1400, 245, [("the standing:  ", WHITE), ("open", YELLOW)], 50, ph(t, q[1], 0.8), "i")
    if t > q[1]:
        k = int((t - q[1]) / 1.25)
        cv.text(1400, 345, "after every one of them", 30, GREY, ph(t, q[3], 0.8), kind="i")
    lines = [("Nobody dies.", q[4]), ("Nobody commits to a wrong answer.", q[4] + 1.0), ("Nobody commits at all.", q[4] + 2.0),
             ("Any number of men, from two up. Any two answers.", q[5])]
    for j, (s, t0) in enumerate(lines):
        cv.text(1020, 470 + 70 * j, s, 36, CORAL if j == 2 else WHITE, ph(t, t0, 0.7), "lm", "i")
    if t > q[3]:
        cv.text(1400, 400, "∞", 120, YELLOW, ph(t, q[3] + 0.6, 1.0) * (1 - ph(t, q[4] - 0.2, 0.4)), kind="b")


# ============================================================ 12. what would have to change
@scene(["What would have to change? Not the slowness of the birds, nor their disorder.",
        "The trouble is two things together: no longest flight, and a dead man who looks exactly like a slow bird.",
        "Give the birds a longest flight, and a long silence starts to mean something.",
        "Or give each tent a slate, with a report of who has died that is right in the end. That is enough, while more than half are alive.",
        "Or let every death happen before dusk, and a majority can manage.",
        "None of these is on offer at the foot of the hill."])
def s_change(cv, t, q, D):
    head(cv, t, "What would have to change?")
    c1, c2 = ph(t, q[1], 0.8), ph(t, q[1] + 1.4, 0.8)
    cv.rrect(250, 190, 840, 270, 40, outline=YELLOW, w=3, a=c1)
    cv.text(545, 230, "no longest flight", 38, YELLOW, c1, kind="i")
    cv.text(960, 230, "+", 60, WHITE, c2)
    cv.rrect(1080, 190, 1670, 270, 40, outline=YELLOW, w=3, a=c2)
    cv.text(1375, 230, "a dead man looks like a slow bird", 34, YELLOW, c2, kind="i")
    cards = [(330, "a longest flight", q[2]), (960, "news of the dead", q[3]), (1590, "deaths before dusk", q[4])]
    notes = ["Past the longest flight, silence means he is gone.",
             "A slate of the dead: wrong for a while, right in the end.",
             "Every death is over before the evening begins."]
    for k, (cx, title, t0) in enumerate(cards):
        a = ph(t, t0, 0.8)
        cv.rrect(cx - 285, 330, cx + 285, 800, 22, outline=DIM, w=3, a=a)
        cv.text(cx, 380, title, 42, WHITE, a, kind="i")
        cv.para(cx, 720, notes[k], 32, GREY, 500, a)
        if k == 0:
            tent(cv, 1, cx - 190, 560, 0.9, a)
            tent(cv, 2, cx + 190, 560, 0.9, a)
            cv.line([(cx - 140, 520), (cx + 140, 520)], DIM, 3, a, dash=(8, 8))
            u = ((t - t0) % 4.0) / 3.0
            raven(cv, lerp(cx - 140, cx + 140, min(1, ease(u))), 520, 0.9, 0, WHITE, a, math.sin(t * 9))
            cv.line([(cx + 60, 462), (cx + 60, 580)], YELLOW, 3, a)
            cv.text(cx + 60, 440, "longest flight", 24, YELLOW, a, kind="i")
        if k == 1:
            cv.rrect(cx - 190, 450, cx + 190, 650, 12, fill=(46, 42, 38), outline=(150, 120, 80), w=6, a=a)
            for j, n in enumerate((1, 2, 3, 4)):
                x = cx - 135 + 90 * j
                cv.text(x, 490, str(n), 36, TENTL[n], a, kind="b")
                cv.line([(x - 22, 540), (x + 22, 540)], (210, 206, 196), 2, a)
            on = ph(t, t0 + 1.4, 0.6)
            cv.cross(cx - 135 + 180, 585, 0.8, (214, 210, 200), a * on, 5)
        if k == 2:
            for j, n in enumerate((1, 2, 3, 4)):
                tent(cv, n, cx - 195 + 130 * j, 560, 0.85, a, silent=(n == 4))
            cv.line([(cx - 230, 625), (cx + 100, 625)], GREEN, 4, a * ph(t, t0 + 1.5, 0.8))
            cv.text(cx - 65, 660, "more than half", 26, GREEN, a * ph(t, t0 + 1.5, 0.8), kind="i")
    s = ph(t, q[5], 0.8)
    cv.text(960, 880, "", 10, WHITE, 0)
    if s > 0:
        for cx in (330, 960, 1590):
            cv.line([(cx - 285, 330), (cx + 285, 800)], CORAL, 4, 0.0)


# ============================================================ 13. mapping
@scene(["Everything on the hill has a name in the paper.",
        "The result: no deterministic protocol can guarantee agreement when even one process may crash and messages can take arbitrarily long.",
        "Every escape gives up one condition of the hill: bound the delays, report the dead, or let each man toss a coin.",
        "Fischer, Lynch and Paterson · Journal of the ACM, 1985."])
def s_table(cv, t, q, D):
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
    tab = (1 - ph(t, q[1] - 0.5, 0.6))
    a0 = ph(t, 0.3, 0.8) * tab
    cv.text(700, 120, "on the hill", 44, YELLOW, a0, "rm", "i")
    cv.text(1220, 120, "in the paper", 44, CYAN, a0, "lm", "i")
    cv.line([(960, 90), (960, 130)], DIM, 3, a0)
    for i, (l, r) in enumerate(rows):
        a = ph(t, q[0] + 0.5 + 0.45 * i, 0.6) * tab
        y = 200 + 60 * i
        cv.text(900, y, l, 34, WHITE, a, "rm", "i")
        cv.arrow((925, y), (995, y), GREY, 3, a, 12)
        cv.text(1020, y, r, 34, WHITE, a, "lm")
    u = ph(t, q[1], 0.9) * (1 - ph(t, q[2] - 0.4, 0.6))
    cv.para(960, 480, "No deterministic protocol can guarantee agreement if even one process may crash and messages can take arbitrarily long.",
            52, WHITE, 1300, u, kind="i", lead=1.35)
    v = ph(t, q[2], 0.9) * (1 - ph(t, q[3] - 0.4, 0.6))
    cv.text(960, 280, "Every escape gives up one condition of the hill", 48, WHITE, v, kind="i")
    for k, (s, c) in enumerate((("bound the delays", CYAN), ("report the dead", GREEN), ("toss a coin", YELLOW))):
        cv.text(960, 420 + 90 * k, s, 50, c, v * ph(t, q[2] + 1.0 + 1.6 * k, 0.7), kind="i")
    w = ph(t, q[3], 1.0)
    cv.text(960, 440, "The Limits of Agreement", 100, WHITE, w, kind="i")
    cv.text(960, 540, "Distributed Algorithms of Ancient Greece  ·  Arche", 36, GREY, w)
