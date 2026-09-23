# Settings

The **analysis** behind the world: what each paper needs from its ground, and the
constraints that cannot be broken. Source papers in `sources/`.

> **Which file is which.** The grouping below began as the original four-subject cut and has
> been brought up to date with the current islands — Arche, Paxos, Skene, Homonoia and the
> council ground. The paper-to-place assignment at building resolution lives in
> `buildings.md`.
>
> **This file is kept for the analysis** — the synchrony split at Mount Phyle, the house-rule
> constraints, the precision notes and the sundial decision. Each section is headed with the
> island it belongs to.

---

## Coverage

Verified against `ls sources/`, not asserted:

| | |
|---|---|
| Verified PDFs in `sources/` | **34** |
| Papers the settings require | **31** — all present |
| Duplicates (by MD5) | none |
| Companions beyond the 31 | 3 |

> **The sources were broken and have been fixed.** An earlier version of this file said all
> 31 files were present and correct; that had been checked by filename. Opened and read,
> three were the wrong paper — one was a quantum physics article — and one was a duplicate.
> The correct papers have been downloaded and verified by content, and the bad files are in
> `sources/_misfiled/` rather than deleted. Full record in `buildings.md`.

| Island | Papers |
|---|--:|
| Arche (ring road and Mount Phyle) | 12 |
| Paxos | 4 |
| Skene | 3 |
| Homonoia | 10 |
| The council ground | 2 |

No PDF is unassigned and nothing is blocked. Every paper the islands name is on disk and has
been verified by opening it.

---

## Arche · *The Island of Foundations (Volume I)*

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
  cloud that silences the sundials, and in any season it is held by the siege of Book IV, so
  the houses light no beacon there.
- **The mountain paths** are the siege's ground. The goatherd of Book I Ch. VI is a rare
  smuggler, with no bound on his crossing time.
- **The sea**: reefs and tide-races off every headland stop small boats coasting between
  coves. Big ships go out to sea, not round the island.
- **The camps**: each house may send runners to its nearest mercenary camp (or, if that
  camp falls silent, the next along the foot), on its own business only. A camp carries nothing from one house to another — each man answers only to
  the house that hired him — so the camps are never a channel between houses. (Traders keep
  no ravens.)

The island hosts two distinct zones that together carry the foundational papers of distributed
computing:

1. **The Coastal Ring Road (The Trading Houses):** Three houses — the **Dolphin** on the
   western rocky shelf, the **Vine** on the northern terraced slopes, and the **Anchor** on the
   sheltered eastern bay — act as an island-wide distribution network.
   - *Book I: The Tally and the Column* (`lamport-1978_time-clocks`, `fidge-1988_timestamps`,
     `mattern-1988_virtual-time`). When overcast winter skies silence the headland sundials,
     houses serve distribution orders on a strict first-come basis using logical tallies (Lamport
     scalar clocks), resolve ties via door signs (total order), coordinate mutual exclusion for
     a shared storehouse (§5), and use multi-house column rooms (vector clocks) to detect true
     causal independence.
   - *Book II: The Census of the Ring Road* (`chandy-lamport-1985_distributed-snapshots`).
     Taking an inventory of the entire distribution network without halting trade. Goods exist
     both in the 3 house storehouses and in transit along the 6 directed road tracks. A runner
     wearing a **red sash** serves as the marker dividing pre-recording shipments from
     post-recording shipments. Proves cut consistency, reachability ($S_\iota \to S^* \to S_\phi$),
     and stable property detection.
   - *Book III: The Convoy of Arche* (`dwork-lynch-stockmeyer-1988`). Deciding whether the island's
     merchant fleet should sail together across the Mediterranean (each house's ships then leave
     when it learns the decision and gather at the Needle, a sea-stack off the southern cape). Winter gales spraying the
     cliff road cause **unbounded delays (asynchrony)**. The breaking of the storm represents
     **Global Stabilization Time (GST)**, after which delays are bounded by $\Delta$. A
     rotating coordinator protocol with majority quorum locks ($N \ge 2t + 1$, $N = 3, t = 1$)
     guarantees safety during the wildest gale via quorum intersection, and ensures swift
     termination once the calm arrives.

2. **Mount Phyle (The Central Peak):**
   - *Book IV: Mercenaries and Bandits* (`fischer-lynch-paterson-1985_flp-impossibility`,
     `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982`).
     - **Below:** Four mercenaries in four camps at the quarter-points of the foot, communicating
       solely by ravens with unbounded flight times. Trapped in bivalent indecision: an overrun camp
       cannot be distinguished from a slow bird (FLP).
     - **Above:** Four bandits on the summit crown inside a polygonal wall, communicating
       synchronously in klepsydra-timed rounds, reaching agreement on whether to hold or scatter
       iff $N \ge 3m + 1$ (or under seal rings, for any number of liars).

### The synchrony spectrum on Arche

Arche embodies the complete progression of synchrony and fault models:
- **Pure Asynchrony (Unbounded Delay, Crash Faults):** Mount Phyle gullies (FLP 1985).
- **Asynchronous FIFO with Causality & Snapshots:** The Ring Road under fair skies (Lamport 1978, Chandy-Lamport 1985).
- **Partial Synchrony (Unbounded Delay $\to$ GST $\to$ Bounded Delay $\Delta$):** The Ring Road under winter gales (DLS 1988).
- **Pure Synchrony (Bounded Rounds, Byzantine Faults):** Mount Phyle crown council (PSL 1980, LSP 1982).

---


## Homonoia · *The Island of Scholars*

*Homonoia*, "concord": everyone ends of one mind, by merging rather than by assembly.
(Formerly the Grain Islands, then Antipaxos. The name was retired because the island stands
against assembly itself, and Skene assembles as much as Paxos does. The grain allegory was
retired because it made Homonoia a second traders' island beside Arche.)

**Core physics.** Scholars and copyists in libraries round the island, each holding copies of
the works in its keeping. Letters, corrections and fresh copies travel by courier and by word of
mouth; couriers are delayed or stopped, and libraries close. **The line between
Homonoia and Arche is how much disagreement each can live with**, not what is recorded: both
islands keep records, and on Arche it is the count of jars that is ordered and snapshotted,
never the jars themselves. On Arche, trading from a stale book is an emergency measure, taken
knowingly, because a jar promised to two buyers is a real loss. The scholars answer from
whatever copy they hold as a matter of course, and live with copies that differ for a while, because an out-of-date line is put right at the next collation, as long
as every copy agrees in the end — which is strong consistency against eventual consistency. Greek scholarship already did every practice this island needs — collating manuscripts
line by line, spreading the epics by rhapsode, drafting in wax before a fair copy.

| Paper | In the world |
|---|---|
| `demers-1987` <span>(`demers-1989` is the same file)</span> | Travelling scholars pass on new learnings on scraps of papyrus in the stoa — that the Earth goes round the Sun, say — rumour-fashion, each losing interest once most of those they meet have the scrap; once a year the copyists compare whole collections, scraps included, at the festival, catching what the talk missed |
| `saito-shapiro-2005` | The survey of every optimistic copying practice in use on the island |
| `decandia-2007_dynamo` | A ring of libraries by catalogue mark; a closed library's copies are made next door with a note to return them, reconciled later by version marks |
| `bailis-2012_pbs` | How often the ring hands a reader a stale copy, measured |
| `gray-1996_dangers-of-replication`, `terry-1995_bayou-conflicts` | *Gray moved from Paxos.* Why letting every library write anywhere and reconcile later breaks down as the island grows, and the two-tier remedy; Bayou builds it. Scribes draft changes in wax with their own checks and merge rules, copied fair in ink when the head library fixes their order. Nobody waits for the head library |
| `shapiro-2011_crdt`, `shapiro-2011_crdt-comprehensive` | The count of copies made of each work, kept in voting pebbles, one column per library; merging takes the larger in each column, so it is associative, commutative and idempotent |
| `lloyd-2011_cops-causal-consistency` | Letters name the letters they answer, and each library's own sorting shelf holds them back until those have arrived there. No central sorting house |
| `bailis-2014_hats` | What a librarian can promise a reader while the couriers are stopped |

CALM (`hellerstein-2010`, `ameloot-2011`) sits on the council ground between the islands, but
takes its examples from here: "has at least one copy of this work been made?" can be
answered as soon as it is true; "is this every copy that has been made?" needs everyone.

**Casting note carried forward from i1.** Jim Gray was lost at sea in 2007. i1 resolved that
Grayos appears as a designer and counsellor, never as a figure who dies. That decision holds.

**The ground must provide:** many libraries within casual reach of one another, courier routes
of differing length, a ring of libraries round a lagoon for Dynamo, a beach for the wax
scriptorium, and a far coast out of reach of any assembly for the terraces.

---

## Mount Phyle · *The Mountain at Arche's Centre*

*Garrisons around an enemy hill.* Strictly theoretical: what is solvable under which
synchrony assumption, against which adversary.

**No ambush, and no outcome.** The mercenaries must commit to one gate or the other, and
*nothing follows from the decision*. The siege has no resolution in any book: no assault
happens, no wall is carried, no one surrenders. An all-or-nothing ambush is an outcome and
would reintroduce the plot the iteration retired.

| Paper | In the world |
|---|---|
| `fischer-lynch-paterson-1985_flp-impossibility` | In an asynchronous gorge with one silent crash, commanders stay trapped in bivalence: an overrun camp cannot be told from a delayed raven. (*Mercenaries and Bandits*, Part One) |
| `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982` | In synchronous rounds with traitors sending conflicting scrolls, loyal commanders agree iff N ≥ 3m + 1 — or, **with unforgeable wax signets, for any number of generals at all**. (*Mercenaries and Bandits*, Part Two) |
| `chandra-toueg-1996` | Each camp keeps a tally board and marks the rows that stay empty. The suspicion is often wrong — an empty perch is a dead commander or a raven still in the folds — but if it satisfies weak completeness and eventual weak accuracy (◇W), **and a majority of camps are correct**, that is enough to break the FLP deadlock, and the camps may decide; as always on the hill, nothing follows from the decision. The board's two guarantees are **granted, not earned**: ravens with unbounded flights cannot build such a board, and the paper treats it as given in the same way. |
| `castro-liskov-1999` | *Moved from Paxos.* The same four camps later in the siege, when one mercenary may have been bought (each was hired alone and paid alone). The recruiters are the trading houses, and they are the clients. Traders keep no ravens: each house sends a runner to its nearest camp, who waits for the answer, and risks a runner to the next camp along the foot only if its own falls silent — as a client turns to other replicas when its usual one stops answering; the other camps' replies come by raven under each man's own signet, and the house accepts an answer when two seals agree (f + 1). A camp carries nothing from one house to another. The camps keep the orders in one numbered sequence; one camp numbers, the others echo twice with 2f + 1 before an order stands, and a stalling or equivocating camp loses the right to number. Four is exactly 3f + 1 for f = 1, and the unbounded ravens are PBFT's own asynchronous model, so no jars are involved. Book IV is untouched: within it, honest men die below and men lie above. Nothing follows from any order. |

**The ground:** a 400 m massif about 5 km across at its foot, broad lower slopes and a steep
cragged crown, eight spurs and gullies, and four camps at the quarter points with no pair able
to see each other. It fills the centre of Arche and blocks every line of sight between the
houses.

### The synchrony split on Mount Phyle

The hill itself embodies the split between asynchronous impossibility and synchronous agreement:

- **The camps at the base carry the asynchronous model.** Ravens, unbounded delay, uncounted
  nights, no fire or signal. FLP lives here.
- **The summit carries the synchronous model.** The chief sits on the peak, and three posts
  are tucked into separate crags below the rim, out of sight of one another and of the peak.
  Nobody shouts, signals or lights a brand, because the tents below are listening. Every
  message is a short, bounded bird flight, and the four jars are filled together at dusk,
  before the posts are manned. Byzantine Generals lives here. *(This replaces an earlier
  "council ring within shouting distance". A shout heard by everyone is a broadcast, and a
  chief who can broadcast cannot tell different men different things. That would dissolve the
  problem.)*

Combined in **Book IV: Mercenaries and Bandits**, the contrast is held in stark relief:
Below, honest men can die and messages take arbitrary time, yielding impossibility. Above,
nobody dies and time is bounded, but men lie, yielding the 3m + 1 threshold.

*(Note: Dwork, Lynch & Stockmeyer 1988, originally proposed for an external beacon ridge, has
been relocated directly to Arche's coastal ring road in Book III: The Convoy of Arche, where
winter sea-gales provide the asynchronous phase and the clearing of the sky provides GST.)*

### Two precision notes

- **Signatures remove the bound, they do not lower it.** The paper gives an algorithm that
  "copes with m traitors for any number of generals"; the m + 2 figure is a parenthetical
  saying where the problem becomes *vacuous*, not a solvability threshold. The oral-message
  3m + 1 bound and its removal is the whole point of the book's second half.
- **DLS has two models, not one.** Bounds exist but are unknown; *or* bounds are known but
  hold only after GST. The book uses the second: runner transit times are bounded by $\Delta$
  once the storm breaks.

---

## The Paxos Assembly · *now Paxos*

*A sovereign island assembly passing sequential laws.* How to keep one append-only civic
chronicle across shifting quorums, absent members and changing presidents.

| Paper | In the world |
|---|---|
| `lamport-1998_part-time-parliament`, `lamport-2001_paxos-made-simple` | **The Chamber**, Lamport's own and not retold, drawn as a domed rotunda because its acoustics make oratory impossible. Legislators wander in and out, each keeps a ledger, messengers take as long as they take, and any two majorities share a legislator, so past decrees are preserved |
| `herlihy-wing-1990_linearizability`, `chandra-griesemer-redstone-2007` | **The Chamber again**, one book in two parts, *The Law and the Ledgers*: what Lamport passes over quickly. Part One makes precise his §3.3.4 rule for what a citizen may be told (linearizability), and his specialists per area of law as its composition. Part Two tells *Paxos Made Live* as later repairs, only those Lamport lacks: the president's lease for reads, damaged ledgers, numbered presidencies, membership, snapshots too big to copy, testing. Not his law books (§3.3.2) or fixed-term bureaucrats (§3.3.3). *(Linearizability moved from Arche: it is defined by real time, and Arche has no common time and no way to learn of another house's trade except by message, so there it cannot be told from causal order.)* |

**The ground must provide:** the **Chamber** on a route rather than at a dead end
(legislators wander in and out).

### One Chamber, and a reused room

**The parliament is still sitting.** Lamport's §3.3.6 ends the Paxon parliament — a scribe's
error names drowned sailors as the only legislators, government halts, a coup and an invasion
follow. Every later book ignores this, as a matter of convenience, and says so once: in the
index entry and at that point in our rendition.

Paxos has one legislature, Lamport's Chamber. The other consensus tradition, Viewstamped
Replication, is on its own island, Skene (below): two bodies keeping one island's law book
would be the very split both algorithms exist to prevent.
**Nothing on Paxos or Skene is named after the algorithm it carries.**

Later papers reuse existing rooms instead of adding devices, so that approaches can be
compared directly and the reader carries fewer allegories. *Paxos Made Live* returns to the
Chamber; Raft is told in Skene's Odeon, since it re-derives the VR lineage. What separates a
later paper from an earlier one in the same room is a rule of procedure, not a building. This
retires the rehearsal hall, the quarry and the chronicle house.

**The Chamber is drawn as a rotunda.** Lamport gives it one physical property: *"The acoustics
of the Chamber were poor, making oratory impossible. Legislators could communicate only by
messenger."* A circular hall under a hard stone dome, with no podium and no head of the room,
illustrates that faithfully, and open doorways round the drum show legislators and messengers
coming and going. The dome illustrates Lamport's text and carries no meaning of its own: the
earlier claim that two proposers become *one unintelligible wash* under it is retired, since in
Lamport nobody speaks aloud at all. Skene's Odeon is its opposite, built so that one voice
reaches every seat.

---

## Skene · *The Island of the Stage*

*A sovereign island governed from one theatre.* Split from Paxos because Viewstamped
Replication is a genuine alternative to Paxos, found independently and published first, not a
variant of it; two legislatures on one island would conflict.

| Paper | In the world |
|---|---|
| `oki-liskov-1988`, `liskov-cowling-2012`, `ongaro-ousterhout-2014_raft-consensus` | **The Odeon.** Roofed, raked, aimed at one stage so a single voice reaches every seat. The nodes are legislators, as on Paxos: one speaks from the stage, the others keep their law books in the front row, and the public in the seats behind are the ones who need to learn the law. When the speaker falls silent, business stops until another legislator takes the stage under a higher number. Raft's refinements are stage directions — a random wait before claiming the stage, and no stage for a legislator whose law book is less complete |

**The ground must provide:** a natural hillside bowl facing a sheltered bay, for the Odeon.

If two claim the Odeon's stage at once, nothing proceeds. That is why views and terms are
numbered.

---

## What this scheme drops

The settings cover every PDF on disk, and in exchange they retire roughly eleven papers
that i1's 22-book plan named but never acquired:

Flexible Paxos · Attiya, Bar-Noy & Dolev · Terry 1994 session guarantees · Gray & Lamport
2006 (Paxos Commit) · Spanner · Calvin · Schneider 1990 · Burrows (Chubby) · HotStuff ·
Abadi (PACELC) · Bailis *Coordination Avoidance*

That is a real simplification and mostly a gain. **One loss is worth reconsidering:** i1
closed on Spanner and Calvin — *"the series ends where it began, with the order of events."*

Both would belong **on Arche**, not in a new setting. Its ring road already runs an arc from
no clock (Lamport) to partial order (vector clocks). Spanner is the natural capstone — *what
if you buy back a bounded clock?* — with TrueTime intervals and commit wait making external
consistency physical. Calvin is its opposite answer: fix the order before anyone acts, and
nothing is left to decide. Two downloads recover the ending inside the current islands.

**To fetch, optionally:** Spanner and Calvin (recovers the ending).

---

## What this means for the map

Two grounds drive the shape of the world:

- **Mount Phyle must block every sightline between the three houses.** It fills Arche's
  interior, a ~5 km massif on an ~8 km island. The earlier figure, a 1.8 km cone set
  8.7–9.4 km inland, is retired: at that scale the lines between evenly spaced houses clear
  the cone entirely.
- **Homonoia needs many libraries within casual reach** — courier routes of different
  length, a ring of libraries round a lagoon, and a far coast out of reach of any assembly.

---

## Open

1. **Spanner and Calvin** — recover i1's ending on Arche, or accept the shorter set. Neither
   paper is on disk.
2. **How many books per island.** The grounds and buildings are fixed; the book count is not.

*Resolved since this file was written:* the Paxos chronicle (now the parliament's own law
book; the chronicle house is retired); the districts on Homonoia (now explicit buildings); the source problems
(all fixed and verified).
