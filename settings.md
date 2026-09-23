# Settings

The **analysis** behind the world: what each paper needs from its ground, and the
constraints that cannot be broken. Source papers in `sources/`.

> **Which file is which.** The grouping below is the original four-subject cut. It has since
> been superseded by the **three-island scheme** — Arche, Paxos, Antipaxos — in
> `layouts.html`, and the current paper-to-place assignment lives in `buildings.md` at
> building resolution. Three papers moved in that change (CAP and the snapshots paper to
> Arche; CALM to its own council ground; COPS, HATS and PBS to Antipaxos), and
> `layouts.html` records why.
>
> **This file is kept for the analysis, not the grouping** — the synchrony split at Mount
> Phyle, the house-rule constraints, the precision notes and the sundial decision. None of
> those changed when the grouping did. Each section below is headed with the island it now
> belongs to.

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

| World | Papers |
|---|--:|
| 1 — The Mercantile Exchange | 7 |
| 2 — The Grain Islands | 12 |
| 3 — Mount Phyle | 5 |
| 4 — The Paxos Assembly | 8 |

No PDF is unassigned and nothing is blocked. Every paper the four settings name is now on
disk and has been verified by opening it.

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


## The Grain Islands · *now Antipaxos*

*Grain stock between islands.* (Renamed from "The Archipelago": the archipelago is the
container for the whole world, so the name cannot also belong to one island in it.)

**Core physics.** Grain sits in granaries across many islands and moves continuously by
cargo skiff. Channels have capacity, boats are delayed or stopped by storms, and inventory
must be counted without halting shipping.

| Paper | In the world |
|---|---|
| `chandy-lamport-1985_distributed-snapshots` | Scribes count grain on hand, dispatch marker boats down every lane, and record all grain arriving ahead of the marker — a consistent cut without freezing the islands |
| `brewer-2000`, `gilbert-lynch-2002` | A typhoon severs the lanes. Elders either keep dispensing against stale ledgers, or lock the granary until ships sail again. There is no third choice |
| `demers-1987` <span>(`demers-1989` is the same file)</span> | Ships trade recent manifests at whatever island they dock at; periodic full audits at the annual fair |
| `decandia-2007_dynamo` | Consistent hashing around a ring of ports; a flooded harbour's grain is held by its neighbour with a note to return it, reconciled later by vector stamps |
| `terry-1995_bayou-conflicts` | Disconnected islands pencil in tentative allocations with their own checks and merge rules, finalised when the flagship docks |
| `shapiro-2011_crdt`, `shapiro-2011_crdt-comprehensive` | Granaries record stock strictly as join-semilattices, so merging any two manifests is associative, commutative and idempotent — no dispute is possible |
| `hellerstein-2010`, `ameloot-2011`, `hellerstein-alvaro-2020` | Which questions are monotonic ("have we at least 50 bushels?", answerable without waiting) and which are not ("is this all the grain there is?", requiring coordination) |
| `saito-shapiro-2005` | The systematic audit of every optimistic merging practice in use across the islands |

**The ground must provide:** many small ports within casual sailing range, real shipping
lanes of differing length, a ring-shaped lagoon or port ring for Dynamo, a strait a storm
can close, and a far coast out of reach of any assembly.

**This world carries 12 of 32 papers and needs internal districts.** One setting establishes
one device vocabulary, and gossip, sloppy quorums, semilattices and query monotonicity will
not share one. The natural seam is the world's own:

- **The shipping ports** — snapshots, CAP, gossip, Dynamo, Bayou, optimistic replication.
  Everything about moving grain and reconciling what moved.
- **The far terraces** — CRDTs and CALM. Ledgers that need no coordination at all, sited as
  far from any assembly as the islands go. i1 already had this instinct and put the CRDT book
  on the coast farthest from the strait.

Districts, not a fifth world. The count stays at four.

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
| `chandra-toueg-1996` | Each camp keeps a tally board and marks the rows that stay empty. The suspicion is often wrong — an empty perch is a dead commander or a raven still in the folds — but if it satisfies weak completeness and eventual weak accuracy (◇W), **and a majority of camps are correct**, that is enough to break the FLP deadlock. |
| `castro-liskov-1999` | *Moved from Paxos.* The same four bandits on later nights of the siege. Their jars were started together once, before the posts were first manned, and can never be again, since no man may leave his post: the jars drift and silence is no longer a fact. By raven they keep one numbered sequence of orders; the chief numbers, the guards echo twice with 2f + 1 before an order stands, and a stalling or equivocating chief loses the job. Four is exactly 3f + 1 for f = 1. Byzantine like the first night, without its synchrony: the one combination the hill lacked. Nothing follows from any order. |

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
chronicle across shifting quorums, absent members and corrupt leaders.

| Paper | In the world |
|---|---|
| `lamport-1998_part-time-parliament`, `lamport-2001_paxos-made-simple` | **The Rotunda.** Circular and domed: no head of the room, so any legislator may call a ballot, and intersecting quorums preserve past decrees. The dome returns sound, so two proposers at once are one unintelligible wash |
| `oki-liskov-1988`, `liskov-cowling-2012`, `ongaro-ousterhout-2014_raft-consensus` | **The Odeon**, a short walk from the Rotunda. Roofed, raked, aimed at one stage so a single voice reaches every seat: the speaker is distinguished by the architecture. When he falls silent the performance stops until another takes the stage under a higher number. Raft's refinements are stage directions — a random wait before claiming the stage, and no yielding it to a performer whose script is less complete |
| `chandra-griesemer-redstone-2007` | Physical reality: scribes run out of parchment, tablets crumble unread, and leases must be granted without message delay halting government |
| `gray-1996_dangers-of-replication` | The warning to the parliament: split decrees across independent regional councils with lazy synchronisation, and deadlock scales as O(N³) |

**The ground must provide:** the **Rotunda** on a route rather than at a dead end
(legislators wander in and out); the **Odeon** a short walk from it, about two kilometres;
and a stepped quarry on a shippable coast.

### Two buildings, not one chamber

Paxos holds two consensus attitudes, and they are two buildings. This replaces the earlier
causeway islet for Raft: *raftsmen on a raft* was a pun standing in for an idea, and the
Odeon is the idea. **Nothing on Paxos is named after the algorithm it carries.**

The division is sharper than the papers' own: it separates **symmetric** consensus from
**leader-driven** consensus, which puts Viewstamped Replication and Raft together where they
belong — Raft being a re-derivation of that lineage rather than a separate tradition.

**What the acoustics break, and what they do not.** The dome does *not* break agreement.
Quorum intersection is a fact about who is **present**, not about who can be **heard**: any
two majorities share a legislator, and he remembers what he voted for whether or not he
could make it out over the echo. So the Rotunda is **safe and not live** — the most-missed
point about the paper, standing here as a property of a building rather than a claim in a
caption. It also puts Mount Phyle directly overhead: duelling proposers are FLP arriving
indoors, in a room where nothing has failed and no raven is late.

If two claim the Odeon's stage at once it is as bad as the Rotunda. That is why views and
terms are numbered.

**On `gray-1996`.** It is the one paper that could sit on either Paxos or Antipaxos — it is
about lazy replication, which is the Grain Islands' whole practice. Keeping it here makes it
the assembly's reason to exist and the bridge between the two worlds; moving it makes it the
islands' apology. Paxos is the better choice, but it is a choice.

**Casting note carried forward from i1.** Jim Gray was lost at sea in 2007. i1 resolved that
Grayos appears as a designer and counsellor, never as a figure who dies. That decision holds.

---

## What this scheme drops

The settings cover every PDF on disk, and in exchange they retire roughly eleven papers
that i1's 22-book plan named but never acquired:

Flexible Paxos · Attiya, Bar-Noy & Dolev · Terry 1994 session guarantees · Gray & Lamport
2006 (Paxos Commit) · Spanner · Calvin · Schneider 1990 · Burrows (Chubby) · HotStuff ·
Abadi (PACELC) · Bailis *Coordination Avoidance*

That is a real simplification and mostly a gain. **One loss is worth reconsidering:** i1
closed on Spanner and Calvin — *"the series ends where it began, with the order of events."*

Both belong with **the Mercantile Exchange on Arche**, not in a new setting. It already runs an arc from no
clock (Lamport) through partial order (vector clocks) to real-time order (linearizability)
and causal order (COPS). Spanner is the natural capstone — *what if you buy back a bounded
clock?* — with TrueTime intervals and commit wait making external consistency physical.
Calvin is its opposite answer: fix the order before anyone acts, and nothing is left to
decide. Two downloads recover the ending inside the four-world structure.

**To fetch:** Chandy & Lamport 1985 (required). Optionally Spanner and Calvin (recovers the
ending).

---

## What this means for the map

Two grounds drive the shape of the world, and both are satisfied by the three-island scheme
in `layouts.html`:

- **Mount Phyle must block every sightline between the three houses.** It fills Arche's
  interior, a ~5 km massif on an ~8 km island. The earlier figure, a 1.8 km cone set
  8.7–9.4 km inland, is retired: at that scale the lines between evenly spaced houses clear
  the cone entirely.
- **Antipaxos needs to be an archipelago** — many small ports in casual sailing range, lanes
  of different length, a ring of ports, and a far coast out of reach of any assembly.

The one ground no map can hold is **the beacon ridge**. A 200 m ridge and a 400 m crown stay
mutually visible out to about 122 km, so it sits at roughly 130 km — off every map, with its
own people and its own diorama.

---

## Open

1. **Mount Phyle's three grounds** — confirm camps / crown / rear beacon ridge, or overwrite
   `content-i2`'s built hill and its ledger. This is the load-bearing decision in the file.
2. **Where Chandra & Toueg sits** — at the camps (recommended: `content-i2` has already drawn
   the two panels for it) or on the beacon ridge with DLS, as `content-i1` had it.
3. **Spanner and Calvin** — recover i1's ending inside the Mercantile Exchange, or accept the
   shorter set. Neither paper is on disk.
4. **How many books per island.** The grounds and buildings are fixed; the book count is not.

*Resolved since this file was written:* the Paxos chronicle (the chronicle house, in
`buildings.md`); the districts on Antipaxos (now explicit buildings); the source problems
(all fixed and verified).
