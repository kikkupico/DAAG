# Settings

The **analysis** behind the world: what each paper needs from its ground, and the
constraints that cannot be broken. The paper-to-place assignment at building resolution is in
`buildings.md`. Source papers are in `sources/`.

---

## Coverage

Verified against `ls sources/`, not asserted:

| | |
|---|---|
| Verified PDFs in `sources/` | **34** |
| Papers the settings require | **31** — all present |
| Duplicates (by MD5) | none |
| Companions beyond the 31 | 3 |

| Island | Papers |
|---|--:|
| Arche (ring road and Mount Phyle) | 13 |
| Paxos | 3 |
| Skene | 3 |
| Homonoia | 10 |
| The council ground | 2 |

No PDF is unassigned and nothing is blocked. Every paper the islands name is on disk and has
been verified by opening it.

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
- **The mountain paths** are the siege's ground. The goatherd of Book I Ch. VI is a rare
  smuggler, with no bound on his crossing time.
- **The sea**: reefs and tide-races off every headland stop small boats coasting between
  coves. Big ships go out to sea, not round the island.
- **The camps**: each house may send runners to its nearest mercenary camp (or, if that camp
  falls silent, the next along the foot), on its own business only. A camp carries nothing
  from one house to another — each man answers only to the house that hired him — so the
  camps are never a channel between houses. Traders keep no ravens.

**The ring road.** Three houses — the **Dolphin** on the western rocky shelf, the **Vine** on
the northern terraced slopes, and the **Anchor** on the sheltered eastern bay — act as an
island-wide distribution network.

- *Book I: The Tally and the Column* (`lamport-1978_time-clocks`, `fidge-1988_timestamps`,
  `mattern-1988_virtual-time`). When overcast winter skies silence the headland sundials,
  houses serve distribution orders on a strict first-come basis using logical tallies (Lamport
  scalar clocks), resolve ties via door signs (total order), coordinate mutual exclusion for a
  shared storehouse (§5), and use multi-house column rooms (vector clocks) to detect true
  causal independence.
- *Book II: The Census of the Ring Road* (`chandy-lamport-1985_distributed-snapshots`).
  Taking an inventory of the entire distribution network without halting trade. Goods exist
  both in the 3 house storehouses and in transit along the 6 directed road tracks. A runner
  wearing a **red sash** serves as the marker dividing pre-recording shipments from
  post-recording shipments. Proves cut consistency, reachability ($S_\iota \to S^* \to S_\phi$),
  and stable property detection.
- *Book III: The Convoy of Arche* (`dwork-lynch-stockmeyer-1988`). Deciding whether the
  island's merchant fleet should sail together across the Mediterranean (each house's ships
  then leave when it learns the decision and gather at the Needle, a sea-stack off the
  southern cape). Winter gales spraying the cliff road cause **unbounded delays
  (asynchrony)**. The breaking of the storm represents **Global Stabilization Time (GST)**,
  after which delays are bounded by $\Delta$. A rotating coordinator protocol with majority
  quorum locks ($N \ge 2t + 1$, $N = 3, t = 1$) guarantees safety during the wildest gale via
  quorum intersection, and ensures swift termination once the calm arrives.
- *The Last Jar* (`herlihy-wing-1990_linearizability`). What the houses owe the buyers at
  their counters: every answer must fit one order of sales, the same at all three houses, in
  which anything answered before another was asked comes first (linearizability). One count
  per kind of goods; if each keeps the rule, the whole trade does (locality). See *Why
  linearizability is on Arche* below.
- *The Closed Road* (`brewer-2000`, `gilbert-lynch-2002`). Bandits are reported on both
  stretches beside the Vine, so no runner will go and the Vine is cut off until the road is
  safe. Each side refuses to trade or trades from a book it knows may be stale — a deliberate
  degradation of service, never the usual way on Arche. Consistency is *The Last Jar*'s rule
  (*every house answers as if there were one book*, made precise), which is the consistency
  Gilbert & Lynch prove cannot be kept while the road is shut.

**Why linearizability is on Arche.** It is defined by real time: one operation finished before
another began. Arche has real time — the sun rises over it whether or not a dial can be read —
but in the trading season no one can read it, and no house can learn of another's trade except
by slip. That is not an objection but the point. *The Tally and the Column* Ch. VI already
showed a causal path the houses cannot see: the goatherd who carries word over the mountain.
Linearizability turns that gap into a correctness condition: the houses must answer so that no
goatherd could ever catch them out, though they can never see one coming. It is judged by the
sun, not computed from it. The rule says what the houses owe their buyers, not how they could
know it, and it sits next to the closed road, whose proof depends on it. On Paxos, Lamport's
black-goat story (§3.3.4) states the same rule for the parliament, and *The Ledgers* relies on
it without retelling it.

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
| `fischer-lynch-paterson-1985_flp-impossibility` | In an asynchronous gorge with one silent crash, commanders stay trapped in bivalence: an overrun camp cannot be told from a delayed raven. (*Mercenaries and Bandits*, Part One) |
| `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982` | In synchronous rounds with traitors sending conflicting scrolls, loyal commanders agree iff N ≥ 3m + 1 — or, **with unforgeable wax signets, for any number of generals at all**. (*Mercenaries and Bandits*, Part Two) |
| `chandra-toueg-1996` | Each camp keeps a tally board and marks the rows that stay empty. The suspicion is often wrong — an empty perch is a dead commander or a raven still in the folds — but if it satisfies weak completeness and eventual weak accuracy (◇W), **and a majority of camps are correct**, that is enough to break the FLP deadlock, and the camps may decide; as always on the hill, nothing follows from the decision. The board's two guarantees are **granted, not earned**: ravens with unbounded flights cannot build such a board, and the paper treats it as given in the same way. |
| `castro-liskov-1999` | The same four camps later in the siege, when one mercenary may have been bought (each was hired alone and paid alone). The recruiters are the trading houses, and they are the clients. Each house sends a runner to its nearest camp, who waits for the answer, and risks a runner to the next camp along the foot only if its own falls silent — as a client turns to other replicas when its usual one stops answering. The other camps' replies come by raven under each man's own signet, and the house accepts an answer when two seals agree (f + 1). The camps keep the orders in one numbered sequence; one camp numbers, the others echo twice with 2f + 1 before an order stands, and a stalling or equivocating camp loses the right to number. Four is exactly 3f + 1 for f = 1, and the unbounded ravens are PBFT's own asynchronous model, so no jars are involved. Nothing follows from any order. |

**The ground:** a 400 m massif about 5 km across at its foot, broad lower slopes and a steep
cragged crown, eight spurs and gullies, and four camps at the quarter points with no pair able
to see each other. It fills the centre of Arche and blocks every line of sight between the
houses.

### The synchrony split on Mount Phyle

- **The camps at the base carry the asynchronous model.** Ravens, unbounded delay, uncounted
  nights, no fire or signal. FLP, Chandra & Toueg and PBFT live here, each changing one
  assumption: nothing, a failure detector, a liar.
- **The summit carries the synchronous model.** The chief sits on the peak, and three posts
  are tucked into separate crags below the rim, out of sight of one another and of the peak.
  Nobody shouts, signals or lights a brand, because the tents below are listening — and
  because a shout heard by everyone is a broadcast, and a chief who can broadcast cannot tell
  different men different things, which would dissolve the problem. Every message is a short,
  bounded bird flight, and the four jars are filled together at dusk, before the posts are
  manned. Byzantine Generals lives here.

In **Book IV: Mercenaries and Bandits** the contrast is held in stark relief: below, honest
men can die and messages take arbitrary time, yielding impossibility; above, nobody dies and
time is bounded, but men lie, yielding the 3m + 1 threshold.

### The synchrony spectrum on Arche

- **Pure asynchrony (unbounded delay, crash faults):** the camps (FLP 1985).
- **Asynchronous FIFO with causality and snapshots:** the ring road under fair skies (Lamport
  1978, Chandy–Lamport 1985).
- **Partial synchrony (unbounded delay → GST → bounded delay Δ):** the ring road under winter
  gales (DLS 1988).
- **Pure synchrony (bounded rounds, Byzantine faults):** the crown (PSL 1980, LSP 1982).

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
| `chandra-griesemer-redstone-2007` | **The Chamber again**, *The Ledgers*: *Paxos Made Live* told as later repairs to the parliament, only those Lamport lacks: the president's lease for reads, damaged ledgers, numbered presidencies, membership, snapshots too big to copy, testing. Not his law books (§3.3.2) or fixed-term bureaucrats (§3.3.3). The lease answers a reader without a ballot while keeping the rule of *The Last Jar*, which Lamport's black goat (§3.3.4) already states for Paxos |

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
compared directly and the reader carries fewer allegories. *The Ledgers* returns to
the Chamber; Raft is told in Skene's Odeon, since it re-derives the VR lineage. What separates
a later paper from an earlier one in the same room is a rule of procedure, not a building.

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
| `oki-liskov-1988`, `liskov-cowling-2012`, `ongaro-ousterhout-2014_raft-consensus` | **The Odeon.** Roofed, raked, aimed at one stage so a single voice reaches every seat. The nodes are legislators, as on Paxos: one speaks from the stage, the others keep their law books in the front row, and the public in the seats behind are the ones who need to learn the law. When the speaker falls silent, business stops until another legislator takes the stage under a higher number. Raft's refinements are stage directions — a random wait before claiming the stage, and no stage for a legislator whose law book is less complete. One book in two parts, *The Odeon*, with Raft as Part Two, *The Rehearsal* |

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
spreading the epics by rhapsode, drafting in wax before a fair copy.

| Paper | In the world |
|---|---|
| `demers-1987` <span>(`demers-1989` is the same file)</span> | Travelling scholars pass on new learnings on scraps of papyrus in the stoa — that the Earth goes round the Sun, say — rumour-fashion, each losing interest once most of those they meet have the scrap; once a year the copyists compare whole collections, scraps included, at the festival, catching what the talk missed |
| `saito-shapiro-2005` | The survey of every optimistic copying practice in use on the island |
| `decandia-2007_dynamo` | A ring of libraries by catalogue mark; a closed library's copies are made next door with a note to return them, reconciled later by version marks |
| `bailis-2012_pbs` | How often the ring hands a reader a stale copy, measured |
| `gray-1996_dangers-of-replication`, `terry-1995_bayou-conflicts` | Why letting every library write anywhere and reconcile later breaks down as the island grows, and the two-tier remedy; Bayou builds it. Scribes draft changes in wax with their own checks and merge rules, copied fair in ink when the head library fixes their order. Nobody waits for the head library |
| `shapiro-2011_crdt`, `shapiro-2011_crdt-comprehensive` | The count of copies made of each work, kept in voting pebbles, one column per library; merging takes the larger in each column, so it is associative, commutative and idempotent |
| `lloyd-2011_cops-causal-consistency` | Letters name the letters they answer, and each library's own sorting shelf holds them back until those have arrived there. No central sorting house. Part One of *The Shelf and the Reading Room* |
| `bailis-2014_hats` | What a librarian can promise a reader while the couriers are stopped. Part Two of *The Shelf and the Reading Room*, in the room beside the sorting shelf |

**Casting note.** Jim Gray was lost at sea in 2007. Grayos appears as a designer and
counsellor, never as a figure who dies.

**The ground must provide:** many libraries within casual reach of one another, courier routes
of differing length, a ring of libraries round a lagoon for Dynamo, a beach for the wax
scriptorium, and a far coast out of reach of any assembly for the terraces.

---

## The council ground

| Paper | In the world |
|---|---|
| `hellerstein-2010`, `ameloot-2011` | **The hall of two doors**, between the islands. A question needs coordination exactly when it is not monotonic. The examples come from Homonoia: "has at least one copy of this work been made?" can be answered as soon as it is true; "is this every copy that has been made?" needs everyone. Each question leaves by the door its own shape decides — one facing Paxos and Skene, which assemble, one facing Homonoia, which does not |

---

## Out of scope

The settings cover the 31 papers on disk. Not covered: Flexible Paxos · Attiya, Bar-Noy &
Dolev · Terry 1994 session guarantees · Gray & Lamport 2006 (Paxos Commit) · Spanner · Calvin ·
Schneider 1990 · Burrows (Chubby) · HotStuff · Abadi (PACELC) · Bailis *Coordination
Avoidance*.

**The strongest candidates to add are Spanner and Calvin**, and both would belong on Arche.
Its ring road runs an arc from no clock (Lamport) to partial order (vector clocks). Spanner is
the natural capstone — *what if you buy back a bounded clock?* — with TrueTime intervals and
commit wait making external consistency physical. Calvin is its opposite answer: fix the order
before anyone acts, and nothing is left to decide. Together they would close the series where
it began, with the order of events.

---

## What this means for the map

- **Mount Phyle must block every sightline between the three houses.** It fills Arche's
  interior, a ~5 km massif on an ~8 km island; a small cone would leave the lines between
  evenly spaced houses clear.
- **Homonoia needs many libraries within casual reach** — courier routes of different
  length, a ring of libraries round a lagoon, and a far coast out of reach of any assembly.

---

## Open

1. **Spanner and Calvin** — add them on Arche, or keep the set at 31. Neither paper is on
   disk.
2. **How many books per island.** The grounds and buildings are fixed; the book count is not.
   Current plan: VR and Raft are one book (*The Odeon*), COPS and HATS are one book (*The Shelf
   and the Reading Room*), and the camps keep three books (FLP with Byzantine Generals in Book
   IV, then Chandra & Toueg, then Castro & Liskov).
