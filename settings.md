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
| Paxos | 2 |
| Skene | 1 |
| Homonoia | 5 |
| The council ground | 2 |

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
- *Agreeing When Messages Run Late* (`dwork-lynch-stockmeyer-1988`). Settling the
  winter price of oil. Under the compact of the ring road every house posts the same price,
  cut into the price board at its gate and never changed, because goods passed between the
  houses are reckoned at it and two prices would leave no house's books able to balance.
  Each house proposes a price from its own storehouse and counter; any proposal will serve,
  but never two (the paper's arbitrary value domain, with strong unanimity). A lock is chalk
  on a slate, a decision is cut into the board. **Must not exist:** averaging, haggling or
  splitting the difference; any provisional price or trading before the board is cut; any
  deadline; any carrier of price news but runners; any house gaining by whose price wins.
  Winter gales spraying the cliff road cause **unbounded delays
  (asynchrony)**. The breaking of the storm represents **Global Stabilization Time (GST)**,
  after which delays are bounded by $\Delta$. A rotating coordinator protocol with majority
  quorum locks ($N \ge 2t + 1$, $N = 3, t = 1$) guarantees safety during the wildest gale via
  quorum intersection, and ensures swift termination once the calm arrives.
- *Many Copies, Acting as One* (`herlihy-wing-1990_linearizability`). What the houses owe the buyers at
  their counters: every answer must fit one order of sales, the same at all three houses, in
  which anything answered before another was asked comes first (linearizability). The object is
  a jar's **line** in the book: the name of the buyer it is promised to, or nothing while free. A
  purchase writes the line, a question reads it, so each line is a read/write register. If each
  line keeps the rule, the whole trade does (locality). A running count of jars is not the object:
  it cannot carry the Delayed-t promise of *Answering While Cut Off*, which fixes this vocabulary. The
  paper's FIFO queue and its proof method (§4) live at the Anchor's **loading berths**: a board of
  numbered berths and a take-a-number peg (`INC`), several porters working at once, a porter who
  takes a cargo emptying its berth (`SWAP`). That is shared memory at one house, the paper's own
  model, and nothing crosses the road. The rule holds whether the object is one board or three
  books. Herlios and Wingaia at two houses. See *Why linearizability is on Arche* below.
- *Answering While Cut Off* (`brewer-2000`, `gilbert-lynch-2002`). Bandits are reported on both
  stretches beside the Vine, so no runner will go and the Vine is cut off until the road is
  safe. Each side refuses to trade or trades from a book it knows may be stale — a deliberate
  degradation of service, never the usual way on Arche. Consistency is *Many Copies, Acting as One*'s rule
  (*every house answers as if there were one book*, made precise), which is the consistency
  Gilbert & Lynch prove cannot be kept while the road is shut. Set later in the trading season,
  after the gales and with the boards cut; a **crossing** is the post-storm bound Δ of *Agreeing
  When Messages Run Late*, so Gilbert & Lynch's partially synchronous model (§4) is the one used,
  and the gale is the asynchronous model of Corollary 1.1. A slip for a closed stretch is not
  carried and not held for later (a lost message). Devices: the house that **keeps the book** for a
  cargo (the centralized algorithm), the **gate-glass** (timeout of two crossings and a clerk's
  reply), the **promise of the span t** (Delayed-t). Breweros keeps the Vine's counter, Gilbertos
  is of the Dolphin, Lynchaia of the Anchor.

**Why linearizability is on Arche.** It is defined by real time: one operation finished before
another began. Arche has real time — the sun rises over it whether or not a dial can be read —
but in the trading season no one can read it, and no house can learn of another's trade except
by slip. That is not an objection but the point. *Ordering Without Clocks* Ch. VI already
showed a causal path the houses cannot see: the goatherd who carries word over the mountain.
Linearizability turns that gap into a correctness condition: the houses must answer so that no
goatherd could ever catch them out, though they can never see one coming. It is judged by the
sun, not computed from it. The rule says what the houses owe their buyers, not how they could
know it, and it sits next to the closed road, whose proof depends on it. On Paxos, Lamport's
black-goat story (§3.3.4) states the same rule for the parliament.

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
| `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982` | In synchronous rounds with traitors sending conflicting scrolls, loyal commanders agree iff N ≥ 3m + 1 — or, **with unforgeable wax signets, for any number of generals at all**. (*The Limits of Agreement*, Part Two) |
| `chandra-toueg-1996` | Each tent keeps **the slate**: a row per other tent, chalked against a tent the man suspects and rubbed out when a bird comes from it. The suspicion is often wrong — an empty perch is a dead man or a raven still in the folds. The paper's classes are ways a slate may be wrong (completeness, accuracy; perpetual or eventual), and men copying one another's chalk turns weak completeness into strong. With **S** (one live man never wrongly chalked) the camps can agree with any number silent, relaying estimates round by round and no coordinator; with **◇S** they need a majority alive and use **a turn to propose**, passing round the tents in shield order by round number, not by anyone's command (the same device as the rotating coordinator of *Agreeing When Messages Run Late*, which the book points to). The slate's guarantees are **granted, not earned**: ravens with unbounded flights cannot build such a slate, and the paper treats the detector as given in the same way. Chandraios and Touegos at two tents, two ordinary names at the others. As always on the hill, nothing follows from the decision. (*Telling the Dead from the Slow*) |
| `ben-or-1983` | The camps below, deadlocked as FLP says they may be forever, let chance break the tie. The choice is binary, the north slot or the south gap, which is exactly Ben-Or's model. The one change from *The Limits of Agreement* is lifting its "they may not draw lots": each man was paid in Attic silver, and a man who cannot settle spins his own coin on his chest lid, alone in his tent (a local coin); **owl for north, goddess for south**, fixed in advance. The camps send ravens in numbered **rounds**: a **report** (the gate held), then a second bird, **sure of** a gate (more than half of all four reports seen) or **unsure**. Every wait is for three birds (N − t). Hold a gate on one *sure* bird, be **settled** on two, toss on none. **The rule of going**: a settled man at once sends both birds of the next round, then goes, since going is silence; this is not in Ben-Or's paper (decided processes keep running there) and changes nothing the others see. Four camps bear one silent man (N > 2t); with half silent, no arrangement works. With probability 1 the tosses eventually line up and all go; no night can be named, and courses that never end exist with probability 0. The paper gives no proofs; the full one is Aguilera & Toueg 2012. Ben-Or's version for liars (N > 5t) does not belong below: the mercenaries do not lie. The men are Benorios at the bull, Menon at the boar, Eudoros at the trident, Hagnon at the stag. As always on the hill, nothing follows from the decision. (*Agreeing by Chance*) |
| `castro-liskov-1999` | **The crown, on a later night of the siege.** The four keep one **loot book**, a copy at each post: where each strongbox lies and whose share it is. Each man is also a client: he files an entry and trusts it only when two sealed replies agree (f + 1). One man holds the chief's job and numbers the entries; the others echo twice, each time waiting for three seals (2f + 1), before an entry stands. The job starts with Lamportos and passes in a fixed order (view change) when the others suspect its holder of stalling or of numbering two ways. *The Limits of Agreement* already says the chief is a job, not a rank. Four is exactly 3f + 1 for one liar, and the seal rings are that book's. On these nights **wind on the peak** pins the ravens down for as long as it blows, so a flight has no bound; the entries stay safe in any wind, and progress returns once the wind drops for long enough (PBFT's delay(t) assumption). Each man's sandglass is only a timer for suspecting the chief, doubling at each change. The two-seal rule for clients is stated and shown redundant for an honest man, whose own copy already tells him an entry stands. MACs appear only in the mapping table. Kastros and Liskovia at two places, two ordinary names at the others; whoever sits on the peak holds the job first. Nothing follows from any entry. (*Keeping Order Among Liars*) |
| `yin-2019_hotstuff` | **The same crown and loot book, later again.** The chief's job passes to the next man with every entry, whether or not anyone suspects its holder. Each man sends his sealed vote only to the man who holds the job, who ties three of them into one **bundle** and sends the bundle on, instead of every man writing to every other. After the wind drops (GST), a new holder proceeds as fast as the ravens fly, not when a glass runs out (optimistic responsiveness), and a change of holder costs no more than an ordinary entry (linear view change). The bundle is three seals, not one: say plainly that the paper's threshold signature makes it the size of a single seal. The case for three stages (the hidden lock) is shown on the crown as a two-stage procedure that must wait out a full glass after each change of holder. Yinos, Malkhia, Reiteros and Guetaia at the four places; the footnote credits all five authors. Must not contradict *Keeping Order Among Liars*; nothing follows from any entry. (*Changing Leaders Among Liars*) |

**The ground:** a 400 m massif about 5 km across at its foot, broad lower slopes and a steep
cragged crown, eight spurs and gullies, and four camps at the quarter points with no pair able
to see each other. It fills the centre of Arche and blocks every line of sight between the
houses.

### The synchrony split on Mount Phyle

- **The camps at the base carry the asynchronous model.** Ravens, unbounded delay, uncounted
  nights, no fire or signal. FLP, Ben-Or and Chandra & Toueg live here, each changing one
  assumption: nothing, a coin, a failure detector. The mercenaries have no leader and do not lie.
- **The summit carries the synchronous model.** The chief sits on the peak, and three posts
  are tucked into separate crags below the rim, out of sight of one another and of the peak.
  Nobody shouts, signals or lights a brand, because the tents below are listening — and
  because a shout heard by everyone is a broadcast, and a chief who can broadcast cannot tell
  different men different things, which would dissolve the problem. Every message is a short,
  bounded bird flight, and the four sandglasses are turned together at dusk, before the posts are
  manned. Byzantine Generals lives here.
- **The crown on later nights carries partial synchrony with liars.** The glasses were turned
  together once, on the first night, and never again. On later nights wind on the peak pins
  the ravens down for as long as it blows; once it drops, every flight is short again (GST, then
  Δ). The bandits have what the mercenaries lack, a chief and reason to distrust one another,
  so the leader-based papers live here: PBFT, then HotStuff.

In *The Limits of Agreement* the contrast is held in stark relief: below, honest
men can die and messages take arbitrary time, yielding impossibility; above, nobody dies and
time is bounded, but men lie, yielding the 3m + 1 threshold.

### The synchrony spectrum on Arche

- **Pure asynchrony (unbounded delay, crash faults):** the camps (FLP 1985).
- **Asynchronous FIFO with causality and snapshots:** the ring road under fair skies (Lamport
  1978, Chandy–Lamport 1985).
- **Partial synchrony (unbounded delay → GST → bounded delay Δ):** the ring road under winter
  gales (DLS 1988).
- **Pure synchrony (bounded rounds, Byzantine faults):** the crown's first night (PSL 1980, LSP 1982).
- **Partial synchrony with Byzantine faults:** the crown on windy nights (PBFT 1999, HotStuff 2019).

### Two precision notes

- **Signatures remove the bound, they do not lower it.** The paper gives an algorithm that
  "copes with m traitors for any number of generals"; the m + 2 figure is a parenthetical
  saying where the problem becomes *vacuous*, not a solvability threshold. The oral-message
  3m + 1 bound and its removal is the whole point of the book's second half.
- **DLS has two models, not one.** Bounds exist but are unknown; *or* bounds are known but
  hold only after GST. The book uses the second: runner transit times are bounded by $\Delta$
  once the storm breaks.

---

## Paxos · *The Island of the Parliament*

*A sovereign island assembly passing sequential laws.* How to keep one append-only civic
chronicle across shifting quorums, absent members and changing presidents.

| Paper | In the world |
|---|---|
| `lamport-1998_part-time-parliament`, `lamport-2001_paxos-made-simple` | **The Chamber**, Lamport's own and not retold, drawn as a domed rotunda because its acoustics make oratory impossible. Legislators wander in and out, each keeps a ledger, messengers take as long as they take, and any two majorities share a legislator, so past decrees are preserved |

**The ground must provide:** the **Chamber** on a route rather than at a dead end
(legislators wander in and out).

**The parliament is still sitting.** Lamport's §3.3.6 ends the Paxon parliament — a scribe's
error names drowned sailors as the only legislators, government halts, a coup and an invasion
follow. Every later book ignores this, as a matter of convenience, and says so once: in the
index entry and at that point in our rendition.

**One legislature per island.** Paxos has one, Lamport's Chamber. The other consensus
tradition, Viewstamped Replication, is on its own island, Skene: two bodies keeping one
island's law book would be the very split both algorithms exist to prevent. **Nothing on
Paxos or Skene is named after the algorithm it carries.**

**Later papers reuse existing rooms** instead of adding devices, so that approaches can be
compared directly and the reader carries fewer allegories. Ben-Or and Chandra & Toueg return
to FLP's camps, and PBFT and HotStuff to the Byzantine Generals' crown. What separates a later paper from an earlier one in the
same place is a rule of procedure, not a building.

**The Chamber is drawn as a rotunda.** Lamport gives it one physical property: *"The acoustics
of the Chamber were poor, making oratory impossible. Legislators could communicate only by
messenger."* A circular hall under a hard stone dome, with no podium and no head of the room,
illustrates that faithfully, and open doorways round the drum show legislators and messengers
coming and going. The dome illustrates Lamport's text and carries no meaning of its own; in
Lamport nobody speaks aloud at all. Skene's Odeon is its opposite, built so that one voice
reaches every seat.

---

## Skene · *The Island of the Stage*

*A sovereign island governed from one theatre.* Viewstamped Replication is a genuine
alternative to Paxos, found independently and published first, not a variant of it, so it
has an island of its own.

| Paper | In the world |
|---|---|
| `oki-liskov-1988` | **The Odeon.** Roofed, raked, aimed at one stage so a single voice reaches every seat. The nodes are legislators, as on Paxos: one speaks from the stage, the others keep their law books in the front row, and the public in the seats behind are the ones who need to learn the law. When the speaker falls silent, business stops until another legislator takes the stage under a higher number, and gathers what a majority of the front row holds before speaking. *One Leader at a Time* |

**The ground must provide:** a natural hillside bowl facing a sheltered bay, for the Odeon.

If two claim the Odeon's stage at once, nothing proceeds. That is why views and terms are
numbered.

---

## Homonoia · *The Island of Scholars*

*Homonoia*, "concord": everyone ends of one mind, by merging rather than by assembly. The
island holds **no assembly**; nothing here waits for a vote.

**Core physics.** Scholars and copyists in libraries round the island, each holding copies of
the works in its keeping. Letters, corrections and fresh copies travel by courier and by word
of mouth; couriers are delayed or stopped, and libraries close.

**The line between Homonoia and Arche is how much disagreement each can live with**, not what
is recorded: both islands keep records, and on Arche it is the count of jars that is ordered
and snapshotted, never the jars themselves. On Arche, trading from a stale book is an
emergency measure, taken knowingly, because a jar promised to two buyers is a real loss. The
scholars answer from whatever copy they hold as a matter of course, and live with copies that
differ for a while, because an out-of-date line is put right at the next collation, as long as
every copy agrees in the end — strong consistency against eventual consistency. Greek
scholarship already did every practice this island needs: collating manuscripts line by line,
and spreading the epics by rhapsode.

| Paper | In the world |
|---|---|
| `demers-1987` <span>(`demers-1989` is the same file)</span> | Travelling scholars pass on new learnings on scraps of papyrus in the stoa — that the Earth goes round the Sun, say — rumour-fashion, each losing interest once most of those they meet have the scrap; once a year the copyists compare whole collections, scraps included, at the festival, catching what the talk missed |
| `bailis-2012_pbs` | Each work is kept at several libraries. A new edition goes to some of them, and a reader asks only a few; how likely the copy handed over is out of date, and by how much, measured |
| `shapiro-2011_crdt`, `shapiro-2011_crdt-comprehensive` | The count of copies made of each work, kept in voting pebbles, one column per library; merging takes the larger in each column, so it is associative, commutative and idempotent |
| `bailis-2014_hats` | What a librarian can promise a reader while the couriers are stopped: that no reply is read before the letter it answers, that no change is seen half made; and what no librarian alone can promise, that two readers never take the last copy. *What You Can Promise Alone* |

**The ground must provide:** many libraries within casual reach of one another, courier routes
of differing length, and a far coast out of reach of any assembly for the terraces.

---

## The council ground

| Paper | In the world |
|---|---|
| `hellerstein-2010`, `ameloot-2011` | **The hall of two doors**, between the islands. A question needs coordination exactly when it is not monotonic. The examples come from Homonoia: "has at least one copy of this work been made?" can be answered as soon as it is true; "is this every copy that has been made?" needs everyone. Each question leaves by the door its own shape decides — one facing Paxos and Skene, which assemble, one facing Homonoia, which does not |

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
- **Homonoia needs many libraries within casual reach** — courier routes of different
  length, and a far coast out of reach of any assembly.

---

## Open

1. **How many books per island.** The grounds and buildings are fixed; the book count is not.
   Current plan: one paper per book except *Ordering Without Clocks* (Lamport with Fidge and Mattern), *The Limits of Agreement*
   (FLP with Byzantine Generals) and the paired papers (Lamport 1998 with 2001, Brewer with Gilbert & Lynch, Shapiro's two, Hellerstein
   with Ameloot). The camps keep three books (*The Limits of Agreement*, Ben-Or, Chandra & Toueg) and the crown
   three (*The Limits of Agreement*, Castro & Liskov, HotStuff).
