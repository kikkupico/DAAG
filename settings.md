# Settings

The **analysis** behind the world: what each paper needs from its ground, and the
constraints that cannot be broken. The paper-to-place assignment at building resolution is in
`buildings.md`. Source papers are in `sources/`.

---

## Coverage

Verified against `ls sources/`, not asserted:

| | |
|---|---|
| Verified PDFs in `sources/` | **28** |
| Papers the settings require | **25** — all present |
| Duplicates (by MD5) | none |
| Companions beyond the 25 | 3 |

| Island | Papers |
|---|--:|
| Arche (ring road and Mount Phyle) | 15 |
| Paxos (the Chamber, Schedia, the scholars' coast, the hall of two doors) | 10 |

No PDF is unassigned and nothing is blocked. Every paper the islands name is on disk and has
been verified by opening it.

**The series is theory.** Every paper carries an algorithm, a proof or a model. A systems
paper whose contribution is engineering is out of scope: practical considerations are better
understood in real terms, and an allegory only gets in their way.

---

## Arche · *The Island of Foundations*

*The central mountain and the coastal ring road.*

**Core geography & physics.** Arche is about 8 km across. It rises from the sea around a single
400-metre limestone massif, Mount Phyle, whose foot is some 5 km across and fills the interior.
The three houses sit at ~120° round the coast (Dolphin WSW, Vine N, Anchor ESE), so every line
between two houses passes through rock at least ~80 m high. With evenly spaced houses, each
sightline passes about half the island's radius from the centre, so a small cone would not
block them. That is why the massif must be broad.

The ring road is **two stacked single-file cliff cuttings**: the upper runs sunwise only, the
lower against the sun only, with no passing places. So there is no overtaking and no oncoming
traffic, and by the law of the road a slip takes the direct stretch, never the long way round.
Together these give **one FIFO channel per ordered pair of houses: six in all**.

**What closes the other channels:**
- **The summit** is visible from every shore. In the trading season it is capped by the same
  cloud that silences the sundials, and in any season it is held by the siege, so the houses
  light no beacon there.
- **The mountain paths** are the siege's ground. The goatherd of *Ordering Without Clocks* Ch. VI is a rare
  smuggler, with no bound on his crossing time.
- **The sea**: reefs and tide-races off every headland stop small boats coasting between
  coves. Big ships go out to sea, not round the island.
- **The camps** carry nothing from one house to another, so they are never a channel between
  houses. Traders keep no ravens.

**The ring road.** Three houses — the **Dolphin** on the western rocky shelf, the **Vine** on
the northern terraced slopes, and the **Anchor** on the sheltered eastern bay — act as an
island-wide distribution network.

- *Ordering Without Clocks* (`lamport-1978_time-clocks`, `fidge-1988_timestamps`,
  `mattern-1988_virtual-time`). When overcast winter skies silence the headland sundials,
  houses serve distribution orders on a strict first-come basis using logical tallies (Lamport
  scalar clocks), resolve ties via door signs (total order), coordinate mutual exclusion for a
  shared storehouse (§5), and use multi-house column rooms (vector clocks) to detect true
  causal independence.
- *Taking Stock Without Stopping* (`chandy-lamport-1985_distributed-snapshots`).
  Taking an inventory of the entire distribution network without halting trade. Goods exist
  both in the 3 house storehouses and in transit along the 6 directed road tracks. A runner
  wearing a **red sash** serves as the marker dividing pre-recording shipments from
  post-recording shipments. Proves cut consistency, reachability ($S_\iota \to S^* \to S_\phi$),
  and stable property detection.
- *Many Copies, Acting as One* (`herlihy-wing-1990_linearizability`). The same premise as
  *Ordering Without Clocks*: grain lands at the Anchor and the houses **claim** cargoes, first come,
  first served. The tallies order claims by chains of slips; this book orders them by the sun (one
  piece of business came **before** another if it finished before the other began), which is
  linearizability. The object is the Anchor's **board** of claims, a FIFO queue: a claim is `Enq`, a
  loader's **serving** is `Deq`. The running example is the goatherd's morning: the Dolphin's claim is
  entered and confirmed, the goatherd tells the Vine, the Vine claims at noon with a lower tally and
  is served first (the paper's H7). **Two kinds of first:** serving by entry at the Anchor's gate keeps
  the rule; serving by tally need not; neither order contains the other. Locality is shown with two
  boards, grain at the Anchor and oil at the Vine (H8 for the looser rule). The looser rules are
  **the rule without the sun** (sequential consistency) and **bargains** (serializability). The
  paper's §4 queue is **Herlios' board** itself: numbered **slots**, a **peg** (`INC`), clerks
  entering claims (Glaukos, Mikon) and a loader serving (Sosias) with `SWAP`, all at one house. The
  rule holds whether the board is one board or copies acting as one. Herlios keeps the board;
  Wingaia is of the Vine.
**Why linearizability is on Arche.** It is defined by real time: one operation finished before
another began. Arche has real time — the sun rises over it whether or not a dial can be read —
but in the trading season no one can read it, and no house can learn of another's claim except
by slip. That is not an objection but the point. The tallies of *Ordering Without Clocks* order
claims by chains of slips, and its Ch. VI shows a causal path they cannot see: the goatherd who
carries word over the mountain. Linearizability orders the same claims by the sun, so that no
goatherd could ever catch the houses out, though they can never see one coming. It is judged by
the sun, not computed from it. The two books share the claims premise the way the camps' books
share the mercenaries. On Paxos, Lamport's black-goat story (§3.3.4) states both readings of
*precedes* for the parliament.

**What the rest of Arche knows about the bandits.** Only the bandits know how many of them
there are, which band each belongs to, and what they plan. Everyone else knows two things:
there are bandits about the island, and their loot is on the hilltop. The crown's four stay
there by choice, because the loot cannot be left; bandits met elsewhere need not be of their
band, and no one outside can tell.

---

## Mount Phyle · *The Mountain at Arche's Centre*

*Garrisons around an enemy hill.* Strictly theoretical: what is solvable under which
synchrony assumption, against which adversary.

**No ambush, and no outcome.** The mercenaries must commit to one gate or the other, and
*nothing follows from the decision*. The siege has no resolution in any book: no assault
happens, no wall is carried, no one surrenders. An all-or-nothing ambush is an outcome, and
an outcome is plot.

| Paper | In the world |
|---|---|
| `fischer-lynch-paterson-1985_flp-impossibility` | In an asynchronous gorge with one silent crash, commanders stay trapped in bivalence: an overrun camp cannot be told from a delayed raven. (*The Limits of Agreement*, Part One) |
| `dwork-lynch-stockmeyer-1988` | **The camps on windy nights.** The one change from *The Limits of Agreement* is the **wind**: while it blows, a raven goes down among the crows of the folds and sits it out, for any time and even past the drop, so no one can say how long a bird will take; it always drops in the end and stays down, and a bird let go in still air is at its perch within a **glass** (Δ holds eventually; the drop is GST, which no man can see). The **glasses** were turned together as the last light left the crown, which every tent can see on a clear evening, and run alike; a pebble per glass gives a common count (synchronous processors, Φ = 1, §4). A strip taken in during a later glass than it was written in is set aside. Four glasses make a **turn**, owned in shield order by the count (Algorithm 1's phases): the **asking glass** (acceptable gates to the owner), the **calling glass** (the owner calls a gate three men can accept), the **answering glass** (**pledges** tied to the tent pole, *pledged* back; the owner goes on two), the **untying glass** (lock release). **The gates seen at dusk** are the PROPER set. Every man who goes sends a **going bird** to each tent before he goes (Remark 2; birds are never lost). Safe in any wind; once it drops all go, within twenty glasses if no one went while it blew, otherwise when the first going birds arrive, with no bound; four men bear one death and no arrangement bears two (Theorem 4.3). The book's Chapter VII gives the liar bounds (3t + 1, sealed or not) and points up to the crown. The men are FLP's four, Fischeros, Lynchaia, Patersonos and Kallias, by exception to the naming rule: Lynch wrote both papers. The turn's owner is not a leader. Nothing follows from going. (*Agreeing When Messages Run Late*) |
| `brewer-2000`, `gilbert-lynch-2002` (+ the 2012 retrospective) | **The camps on nights of lost birds.** The one change: a raven can be **lost** (a hawk takes it in the folds, unseen); when every bird between one tent and the rest is lost, that tent is **cut off**. There is no wind: a bird that arrives does so within a known **flight**, and each tent's glass runs alike (G&L's partially synchronous model, §4). The object is the **standing gate**, north at dusk, which any man may move and any may ask after: a read/write register over the camps' own two answers. **Answering as one** is linearizability (the rule of *Many Copies*, restated); **every man is answered** is availability. The cut-off stag (Kallias) cannot do both (Theorem 2). One tent **keeps** the gate (the bull; the centralized algorithm); **waiting a glass** is the timeout; the **promise of the span t** is Delayed-t, with every bird to the keeper carrying the sender's unacknowledged moves, since ravens are not FIFO. On a windy night even nights with no loss cannot answer as one (Corollary 1.1). FLP's four men, as in DLS. Nobody goes; nothing follows from which gate stands. (*Answering While Cut Off*) |
| `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982` | In synchronous rounds with traitors sending conflicting scrolls, loyal commanders agree iff N ≥ 3m + 1 — or, **with unforgeable wax signets, for any number of generals at all**. (*The Limits of Agreement*, Part Two) |
| `chandra-toueg-1996` | Each tent keeps **the slate**: a row per other tent, chalked against a tent the man suspects and rubbed out when a bird comes from it. The suspicion is often wrong — an empty perch is a dead man or a raven still in the folds. The paper's classes are ways a slate may be wrong (completeness, accuracy; perpetual or eventual), and men copying one another's chalk turns weak completeness into strong. With **S** (one live man never wrongly chalked) the camps can agree with any number silent, relaying estimates round by round and no coordinator; with **◇S** they need a majority alive and use **a turn to propose**, passing round the tents in shield order by round number, not by anyone's command (the turn of *Agreeing When Messages Run Late*, at the same tents, which the book points to). The slate's guarantees are **granted, not earned**: ravens with unbounded flights cannot build such a slate, and the paper treats the detector as given in the same way. The men are FLP's four, as in DLS and CAP. With S the book's arrangement is the **tally of sightings** relayed for three rounds; with ◇S, **turns** with **estimates**, *agreed* / *not agreed*, and a **going bird** relayed before going. On windy nights (DLS) a slate in the end perfect can be kept by growing waits (Theorem 9). As always on the hill, nothing follows from the decision. (*Telling the Dead from the Slow*) |
| `ben-or-1983` | The camps below, deadlocked as FLP says they may be forever, let chance break the tie. The choice is binary, the north slot or the south gap, which is exactly Ben-Or's model. The one change from *The Limits of Agreement* is lifting its "they may not draw lots": each man was paid in Attic silver, and a man who cannot settle spins his own coin on his chest lid, alone in his tent (a local coin); **owl for north, goddess for south**, fixed in advance. The camps send ravens in numbered **rounds**: a **report** (the gate held), then a second bird, **sure of** a gate (more than half of all four reports seen) or **unsure**. Every wait is for three birds (N − t). Hold a gate on one *sure* bird, be **settled** on two, toss on none. **The rule of going**: a settled man at once sends both birds of the next round, then goes, since going is silence; this is not in Ben-Or's paper (decided processes keep running there) and changes nothing the others see. Four camps bear one silent man (N > 2t); with half silent, no arrangement works. With probability 1 the tosses eventually line up and all go; no night can be named, and courses that never end exist with probability 0. The paper gives no proofs; the full one is Aguilera & Toueg 2012. Ben-Or's version for liars (N > 5t) does not belong below: the mercenaries do not lie. The men are Benorios at the bull, Menon at the boar, Eudoros at the trident, Hagnon at the stag. As always on the hill, nothing follows from the decision. (*Agreeing by Chance*) |
| `castro-liskov-1999` | **The crown, on a later night of the siege.** The four keep one **loot book**, a copy at each post: where each strongbox lies and whose share it is. Each man is also a client: he files an entry and trusts it only when two sealed replies agree (f + 1). One man holds the chief's job and numbers the entries; the others echo twice, each time waiting for three seals (2f + 1), before an entry stands. The job starts with Lamportos and passes in a fixed order (view change) when the others suspect its holder of stalling or of numbering two ways. *The Limits of Agreement* already says the chief is a job, not a rank. Four is exactly 3f + 1 for one liar, and the seal rings are that book's. On these nights **wind on the peak** pins the ravens down for as long as it blows, so a flight has no bound; the entries stay safe in any wind, and progress returns once the wind drops for long enough (PBFT's delay(t) assumption). Each man's sandglass is only a timer for suspecting the chief, doubling at each change. The two-seal rule for clients is stated and shown redundant for an honest man, whose own copy already tells him an entry stands. MACs appear only in the mapping table. Kastros and Liskovia at two places, two ordinary names at the others; whoever sits on the peak holds the job first. Nothing follows from any entry. (*Keeping Order Among Liars*) |
| `yin-2019_hotstuff` | **The same crown and loot book, later again.** The chief's job passes to the next man with every entry, whether or not anyone suspects its holder. Each man sends his sealed vote only to the man who holds the job, who ties three of them into one **bundle** and sends the bundle on, instead of every man writing to every other. After the wind drops (GST), a new holder proceeds as fast as the ravens fly, not when a glass runs out (optimistic responsiveness), and a change of holder costs no more than an ordinary entry (linear view change). The bundle is three seals, not one: say plainly that the paper's threshold signature makes it the size of a single seal. The case for three stages (the hidden lock) is shown on the crown as a two-stage procedure that must wait out a full glass after each change of holder. Yinos, Malkhia, Reiteros and Guetaia at the four places; the footnote credits all five authors. Must not contradict *Keeping Order Among Liars*; nothing follows from any entry. (*Changing Leaders Among Liars*) |

**The ground:** a 400 m massif about 5 km across at its foot, broad lower slopes and a steep
cragged crown, eight spurs and gullies, and four camps at the quarter points with no pair able
to see each other. It fills the centre of Arche and blocks every line of sight between the
houses.

### The synchrony split on Mount Phyle

- **The camps at the base carry the asynchronous model and its ways out.** Ravens, unbounded
  delay, no fire or signal. FLP, DLS, Brewer / Gilbert & Lynch, Ben-Or and Chandra & Toueg live
  here, each changing one assumption of FLP: nothing, a wind that drops, lost birds, a coin, a
  failure detector. The mercenaries have
  no leader and do not lie. On the windy nights of DLS each tent has a glass, turned together as
  the last light left the crown; no other common moment exists below.
- **The summit carries the synchronous model.** The chief sits on the peak, and three posts
  are tucked into separate crags below the rim, out of sight of one another and of the peak.
  Nobody shouts, signals or lights a brand, because the tents below are listening — and
  because a shout heard by everyone is a broadcast, and a chief who can broadcast cannot tell
  different men different things, which would dissolve the problem. Every message is a short,
  bounded bird flight, and the four sandglasses are turned together at dusk, before the posts are
  manned. Byzantine Generals lives here.
- **The crown on later nights carries partial synchrony with liars.** The glasses were turned
  together once, on the first night, and never again: the posts sit below the rim of their crags
  and none can see the peak, so the last light that the tents below turn their glasses by is not
  seen from them. On later nights the wind that blows over the whole hill pins the ravens down for
  as long as it blows; once it drops, every flight is short again (GST, then Δ). The same wind
  carries crashes below (DLS) and liars above (PBFT, HotStuff). The bandits have what the mercenaries lack, a chief and reason to distrust one another,
  so the leader-based papers live here: PBFT, then HotStuff.

In *The Limits of Agreement* the contrast is held in stark relief: below, honest
men can die and messages take arbitrary time, yielding impossibility; above, nobody dies and
time is bounded, but men lie, yielding the 3m + 1 threshold.

### The synchrony spectrum on Arche

- **Pure asynchrony (unbounded delay, crash faults):** the camps (FLP 1985).
- **Asynchronous FIFO with causality and snapshots:** the ring road under fair skies (Lamport
  1978, Chandy–Lamport 1985).
- **Partial synchrony (unbounded delay → GST → bounded delay Δ), crash faults:** the camps on
  windy nights (DLS 1988). The ring road's winter gales and the crossing after them are the same
  shape, used by Gilbert & Lynch.
- **Pure synchrony (bounded rounds, Byzantine faults):** the crown's first night (PSL 1980, LSP 1982).
- **Partial synchrony with Byzantine faults:** the crown on windy nights (PBFT 1999, HotStuff 2019).

### Two precision notes

- **Signatures remove the bound, they do not lower it.** The paper gives an algorithm that
  "copes with m traitors for any number of generals"; the m + 2 figure is a parenthetical
  saying where the problem becomes *vacuous*, not a solvability threshold. The oral-message
  3m + 1 bound and its removal is the whole point of the book's second half.
- **DLS has two models, not one.** Bounds exist but are unknown; *or* bounds are known but
  hold only after GST. The book uses the second, with synchronous processors (§4): a still
  flight is within a glass once the wind drops, and the glasses give a common count. It mentions
  the first (rounds lengthened each time, §4.2) and the distributed clocks of §5 in its closing
  chapter.

---

## Paxos · *The Island of the Parliament, the Stage and the Scholars*

*One island, two ways of keeping records.* Paxos holds two assemblies, each keeping one
append-only law book across absent members and changing leaders — Lamport's parliament and
the Odeon of Schedia — and the scholars and copyists, who keep many copies and hold no assembly.
Putting them on one island makes the difference a walk: the scholars could take any question
to an assembly, and the hall of two doors shows which questions need one.

**The island is a Y, and its shape groups the papers.** Two arms reach north: the western arm
holds the Chamber, the eastern arm the city of **Schedia** and its Odeon, and the two face each
other across the bay between the arms. The two ways of keeping one law book share the top of
the island. The arms join at a fork, and below it the stem widens into the body of the island,
the scholars' coast, which eventual consistency has to itself. The hall of two doors stands at
the fork.

**The parliament has no say over the scholars' copies.** It passes decrees, the island's law;
a scholar's copy of a work is not law, and no decree settles which copy is right. So nothing
on the scholars' coast waits for a vote, although the Chamber is a morning's walk away.

### The Chamber

| Paper | In the world |
|---|---|
| `lamport-1998_part-time-parliament`, `lamport-2001_paxos-made-simple` | **The Chamber**, Lamport's own and not retold, drawn as a domed rotunda because its acoustics make oratory impossible. Legislators wander in and out, each keeps a ledger, messengers take as long as they take, and any two majorities share a legislator, so past decrees are preserved |

**The ground must provide:** the **Chamber** on the western arm, looking across the bay at
the Odeon, and on a route rather than at a dead end (legislators wander in and out): the
island road runs up the stem, forks, and runs out along the western arm past the Chamber to
the harbour town at the arm's tip.

**The parliament is still sitting.** Lamport's §3.3.6 ends the Paxon parliament — a scribe's
error names drowned sailors as the only legislators, government halts, a coup and an invasion
follow. Every later book ignores this, as a matter of convenience, and says so once: in the
index entry and at that point in our rendition.

**One legislature per city.** Paxos has two cities and two law books. The Paxon Parliament
makes the law of Paxos: the western arm, the stem and the scholars' coast. **Schedia** keeps its
own. Its name means *raft*: it was founded by settlers from a different mother city, who came
by sea and brought their founders' laws with them, and the Parliament's decrees have never run on the eastern arm. That is
ordinary Greek practice: Amorgos, a small island, held three independent cities — Minoa
settled from Samos, Aigiale from Miletus, Arkesine from Naxos — each with its own laws, and
Lesbos held five. Each law book covers its own city, so the two never contradict each other,
and there is no split for either algorithm to prevent. Viewstamped Replication is a genuine
alternative to Paxos, found independently and published first, and a city of its own says so.
**Nothing on Paxos is named after the algorithm it carries.** Schedia's name nods to Raft, a
systems paper outside the series that set out to leave the island of Paxos; it names no paper
the city carries.

**Later papers reuse existing rooms** instead of adding devices, so that approaches can be
compared directly and the reader carries fewer allegories. Ben-Or and Chandra & Toueg return
to FLP's camps, and PBFT and HotStuff to the Byzantine Generals' crown. What separates a later paper from an earlier one in the
same place is a rule of procedure, not a building.

**The Chamber is drawn as a rotunda.** Lamport gives it one physical property: *"The acoustics
of the Chamber were poor, making oratory impossible. Legislators could communicate only by
messenger."* A circular hall under a hard stone dome, with no podium and no head of the room,
illustrates that faithfully, and open doorways round the drum show legislators and messengers
coming and going. The dome illustrates Lamport's text and carries no meaning of its own; in
Lamport nobody speaks aloud at all. The Odeon of Schedia is its opposite, built so that one
voice reaches every seat.

### Schedia and the Odeon

*A city on the eastern arm, with its own laws, governed from one theatre.*

| Paper | In the world |
|---|---|
| `oki-liskov-1988` | **The Odeon.** Roofed, raked, aimed at one stage so a single voice reaches every seat. The nodes are legislators, as in the Chamber: one speaks from the stage, the others keep their law books in the front row, and the public in the seats behind are the ones who need to learn the law. When the speaker falls silent, business stops until another legislator takes the stage under a higher number, and gathers what a majority of the front row holds before speaking. *One Leader at a Time* |

**The ground must provide:** a natural hillside bowl on the eastern arm, above a sheltered
cove on the bay, so the Odeon faces the Chamber across the water.

If two claim the Odeon's stage at once, nothing proceeds. That is why views and terms are
numbered.

### The scholars' coast

The scholars call their coast *Homonoia*, "concord": everyone ends of one mind, by merging
rather than by assembly. The scholars hold **no assembly**; nothing here waits for a vote.

**Core physics.** Scholars and copyists in libraries along the coast, each holding copies of
the works in its keeping. Letters, corrections and fresh copies travel by courier and by word
of mouth; couriers are delayed or stopped, and libraries close.

**The line between the scholars and Arche is how much disagreement each can live with**, not
what is recorded: both keep records, and on Arche it is the stock of the storehouses that is
snapshotted and the claims on its grain that are ordered. At the camps, answering from a stale
note is done knowingly and only while birds are lost, because two men told different gates is a
real harm. The
scholars answer from whatever copy they hold as a matter of course, and live with copies that
differ for a while, because an out-of-date line is put right at the next collation, as long as
every copy agrees in the end — strong consistency against eventual consistency. Greek
scholarship already did every practice this coast needs: collating manuscripts line by line,
and spreading the epics by rhapsode.

| Paper | In the world |
|---|---|
| `demers-1987` <span>(`demers-1989` is the same file)</span> | Travelling scholars pass on new learnings on scraps of papyrus in the stoa — that the Earth goes round the Sun, say — rumour-fashion, each losing interest once most of those they meet have the scrap; once a year the copyists compare whole collections, scraps included, at the festival, catching what the talk missed |
| `bailis-2012_pbs` | Each work is kept at several libraries. A new edition goes to some of them, and a reader asks only a few; how likely the copy handed over is out of date, and by how much, measured |
| `shapiro-2011_crdt`, `shapiro-2011_crdt-comprehensive` | The count of copies made of each work, kept in voting pebbles, one column per library; merging takes the larger in each column, so it is associative, commutative and idempotent |
| `bailis-2014_hats` | What a librarian can promise a reader while the couriers are stopped: that no reply is read before the letter it answers, that no change is seen half made; and what no librarian alone can promise, that two readers never take the last copy. *What You Can Promise Alone* |

**The ground must provide:** many libraries within casual reach of one another, courier routes
of differing length, and a far shore at the island's southern tip, as far from the assemblies
as the island goes, for the terraces.

### The hall of two doors

| Paper | In the world |
|---|---|
| `hellerstein-2010`, `ameloot-2011` | **The hall of two doors**, at the fork, on common ground that belongs to neither city, as the Messon on Lesbos was the common sanctuary of that island's cities. A question needs coordination exactly when it is not monotonic. The examples come from the scholars: "has at least one copy of this work been made?" can be answered as soon as it is true; "is this every copy that has been made?" needs everyone. Each question leaves by the door its own shape decides — one facing north up the bay between the arms, to the Chamber and the Odeon, the two bodies that assemble; one facing south down the stem, to the scholars' coast, which does not |

---

## Out of scope

The settings cover 25 papers. Not covered: Flexible Paxos · Attiya, Bar-Noy & Dolev · Terry
1994 session guarantees · Gray & Lamport 2006 (Paxos Commit) · Schneider 1990 · Burrows
(Chubby) · Abadi (PACELC) · Bailis *Coordination Avoidance*.

**Systems papers, out of scope by the rule above:** Liskov & Cowling
2012 (VR Revisited) · Ongaro & Ousterhout 2014 (Raft) · Chandra, Griesemer & Redstone 2007
(Paxos Made Live) · DeCandia et al. 2007 (Dynamo) · Lloyd et al. 2011 (COPS) · Gray et al.
1996 · Terry et al. 1995 (Bayou) · Saito & Shapiro 2005 (a survey) · Carbone et al. 2015 (Flink
snapshots) · Corbett et al. 2012 (Spanner) · Thomson et al. 2012 (Calvin).

---

## What this means for the map

- **Mount Phyle must block every sightline between the three houses.** It fills Arche's
  interior, a ~5 km massif on an ~8 km island; a small cone would leave the lines between
  evenly spaced houses clear.
- **Paxos is a Y, and its shape groups its papers.** Two arms reach north and face each
  other across a bay: the Chamber on the western arm, on the road to the harbour town at its
  tip; Schedia and its Odeon on the eastern arm. The hall of two doors stands at the fork. The
  stem widens into the scholars' coast, with many libraries within casual reach, courier
  routes of different length and a far shore at the southern tip for the terraces.

---

## Open

1. **How many books per island.** The grounds and buildings are fixed; the book count is not.
   Current plan: one paper per book except *Ordering Without Clocks* (Lamport with Fidge and Mattern), *The Limits of Agreement*
   (FLP with Byzantine Generals) and the paired papers (Lamport 1998 with 2001, Brewer with Gilbert & Lynch, Shapiro's two, Hellerstein
   with Ameloot). The camps keep five books (*The Limits of Agreement*, DLS, CAP, Ben-Or, Chandra & Toueg) and the crown
   three (*The Limits of Agreement*, Castro & Liskov, HotStuff).
