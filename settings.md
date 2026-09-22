# Settings

The **analysis** behind the world: what each paper needs from its ground, and the
constraints that cannot be broken. Source papers in `../sources/`.

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

Verified against `ls ../sources/`, not asserted:

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

## The Mercantile Exchange · *now Arche, the harbour town*

*Traders and purchase orders.*

**Core physics.** Orders pass between trading houses by courier. With no master clock, the
market must establish causality, serialisability and freshness purely from message receipts.

| Paper | In the world |
|---|---|
| `lamport-1978_time-clocks` | Traders ink incremental sequence numbers on purchase slips, establishing a partial order: A → B ⟹ C(A) < C(B) |
| `fidge-1988_timestamps`, `mattern-1988_virtual-time` | Each house stamps orders with an array tracking the latest transaction seen from *every* house, distinguishing concurrent trades from causally dependent ones |
| `herlihy-wing-1990_linearizability` | An external auditor verifies that if trade A clears before trade B is placed in absolute time, no trader may ever observe B executed without A |
| `lloyd-2011_cops-causal-consistency` | Regional posts accept purchases locally at low latency, propagating dependency check-lists so no branch executes an order before its prerequisites clear |
| `bailis-2014_hats` | Which guarantees (read committed, monotonic atomic view) can a desk offer during a courier strike without stalling or coordinating with rivals |
| `bailis-2012_pbs` | Given courier flight times and (N, R, W), how often does a trader read a stale inventory balance |

**The ground must provide:** a working harbour with trading houses, courier routes to at
least two other ports of *different length* (so a reply can overtake its letter), and an
open, unshaded headland for the dials.

### Decision taken — the dials fail to cloud, not to longitude

Recorded here in full, since this was the only copy outside a page that has been retired.

The books do **not** ask the map for an east–west spread, and the arithmetic says it never
could have delivered one. At 39°N a degree of longitude is about **86 km** and worth four
minutes of apparent solar time, so even a 42 km archipelago — wider than anything now drawn
— buys about **two minutes** of disagreement between dials. No Greek sundial resolves that.
A difference readable off a dial wants roughly 7.5°, about **647 km**: Corfu to Cyprus, which
is not an archipelago.

So the device is **overcast**. No shadow, no reading, and the dials fall silent together
rather than drifting apart. Three consequences:

- **Nothing is lost from the paper.** Lamport's physical-clock section turns on drift and
  resynchronisation, not on standing offset. Dials that work only in sun, and drift between
  readings, supply that directly — including the closing beat where the dials return with
  their drift now bounded.
- **It agrees with the canon.** `content-i1`'s standing device table already reads *"overcast sky, no
  hourglasses → no synchronised clocks, no timeouts"*.
- **It costs an art override.** The illustration bible asks for hazy mornings and hard midday
  light, and hard light is exactly the shadow this ground must not have. The weather needs
  recording as a deviation the way Mount Phyle's night is recorded in `content-i2`, or the
  panels will drift back to sunshine.

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

## Mount Phyle · *now Arche, the mountain*

*Garrisons around an enemy hill.* Strictly theoretical: what is solvable under which
synchrony assumption, against which adversary.

**No ambush, and no outcome.** The garrisons must commit to one gate or the other, and
*nothing follows from the decision*. `content-i2` house rule 1 and ledger row 9 fix the siege as having
no resolution in any book: no assault happens, no wall is carried, no one surrenders. An
all-or-nothing ambush is an outcome and would reintroduce the plot the iteration retired.

| Paper | In the world |
|---|---|
| `fischer-lynch-paterson-1985_flp-impossibility` | In an asynchronous gorge with one silent crash, commanders stay trapped in bivalence: an overrun camp cannot be told from a delayed raven |
| `pease-shostak-lamport-1980`, `lamport-shostak-pease-1982` | In synchronous rounds with traitors sending conflicting scrolls, loyal commanders agree iff N ≥ 3m + 1 — or, **with unforgeable wax signets, for any number of generals at all** |
| `dwork-lynch-stockmeyer-1988` | On the beacon ridge in the army's rear: the gales rage unpredictably, then a Global Stabilization Time arrives and a relay takes no longer than Δ. Safe throughout the storm, guaranteed to terminate after it. *Not at the camps; see row 11 below* |
| `chandra-toueg-1996` | Each camp keeps a tally board and marks the rows that stay empty. The suspicion is often wrong — an empty perch is a dead commander or a raven still in the folds — but if it satisfies weak completeness and eventual weak accuracy (◇W), **and a majority of camps are correct**, that is enough to break the FLP deadlock. *No signal of any kind; see row 6 below* |

**The ground:** already built and measured in `content-i2` — a 400 m cone, 1.8 km footprint,
slopes 24–34°, eight spurs and gullies, four camps at the quarter points with no pair able to
see each other, verified by `scripts/check_hill_sightlines.py`. It must rise alone from a
rolling plain with no other high ground in sight. Cast, architecture and a full panel
inventory exist.

### The synchrony split — do not collapse it

**This is the one place the four-world scheme contradicts what is already built, and the
contradiction is in the thing the books exist to carry.**

`content-i2` does not put all four papers with the garrisons. It splits the hill:

- **The camps at the base carry the asynchronous model.** Ravens, unbounded delay, uncounted
  nights, no fire or signal. FLP lives here.
- **The summit council carries the synchronous model.** A ring of five cut seats, everything
  within shouting distance, rounds kept by klepsydra, one single council night. Byzantine
  Generals lives here.

That split is enforced by the cross-book ledger: *no raven ever reaches the crown* (row 7),
and *the camps' nights are uncounted while the summit is one night* (row 11). If the
garrisons themselves run Byzantine agreement, the same population needs synchronous rounds
for one paper and unbounded delay for another — the models collide, and a klepsydra at the
base would import the deadline FLP cannot survive.

**Keep the split.** It costs nothing, preserves every built asset, and it is the better
allegory anyway: the base is where delay cannot be bounded; the crown is where it can.

### Mount Phyle needs three grounds, not two

Putting the remaining two papers with the camps breaks two more ledger rows:

- **Row 6 — "the soldiers *never* use fire, smoke or horns."** This is why ravens are the only
  channel and why every camp panel is unlit. Spotters flashing signal mirrors *are* a signal.
  Site the failure detectors as mirror-flashing watchmen among the besiegers and the camps'
  concealment rule collapses, taking the visual grammar of the camps book with it.
- **Row 11 — "the camps book's nights are *uncounted*."** `content-i2` is explicit that one shared night
  would import a deadline, and that unbounded delay is the one thing that model cannot lose.
  DLS's Global Stabilization Time is precisely a deadline arriving. A book at the same camps
  saying "after this point, ravens come within Δ" contradicts row 11 outright.

| Ground | Papers | Model |
|---|---|---|
| **The camps at the base** | FLP 1985; Chandra & Toueg 1996 | Asynchronous. Ravens only, no signal of any kind, uncounted nights |
| **The crown council** | Byzantine Generals 1982; Reaching Agreement 1980 | Synchronous. Klepsydra rounds, face to face, one single night |
| **The beacon ridge, in the army's rear** | DLS 1988 | Partially synchronous. Storms, seasons, and a Δ that holds once the weather turns |

**Chandra & Toueg stays at the camps, and needs no mirrors at all.** The detector is not an
instrument, it is a judgement about silence — and `content-i2` has already drawn it. `camps-tally` is
"the tally board: rows with blazons, pegs marked with reported opinions, **one row with no
pegs at all**." `camps-silent` is "the silent loft — a keeper looking uphill, an empty perch…
**must read equally as a dead commander or a raven still in the folds, and must not resolve
which**." That is an unreliable failure detector, drawn before anyone set out to draw one.
◇W is defined without timing assumptions — implementations use timeouts, the abstraction does
not — so weak completeness and eventual weak accuracy cost the camps neither a signal nor a
counted night.

> **The one thing this book must not do is decide.** ◇W solves consensus where FLP cannot,
> and two books at the same camps reaching opposite conclusions would undo the first. The
> detector book shows what *would have to be true* — an eventually correct suspicion, plus a
> correct majority — and that the camps have no way to verify they have it. Nothing is
> resolved, per house rule 1.

**DLS needs its own ground, and it must be over the horizon.** The camps cannot host a GST
without losing unbounded delay, and the hill cannot host a beacon ridge nearby: the brief
requires it to rise "alone from a rolling plain with **no other high ground in sight of it**."
Geometry says how far is far enough — a 200 m ridge and the 400 m crown are mutually visible
out to about **122 km**, so the beacon line belongs in the army's rear, on the road back to
the authority that sent it, and never in frame with the hill. i1 already had this instinct and
gave DLS and the failure detectors their own site with their own people: the navigators
Dworkis, Lynchaia and Stockmeros, the beacon-masters Chandras and Touegos, and watchmen
keeping lists of whom they suspect. A separate population is what makes row 6 survive — the
besiegers are not the ones lighting fires.

**Decision to confirm:** i1 kept DLS *and* Chandra & Toueg together on the beacon hills.
Splitting them — detectors at the camps, partial synchrony on the ridge — is the
recommendation above, because it puts the failure detector where `content-i2` has already drawn its two
best panels. Keeping i1's pairing is the alternative and costs those panels their paper.

### Two precision notes

- **Signatures remove the bound, they do not lower it.** The paper gives an algorithm that
  "copes with m traitors for any number of generals"; the m + 2 figure is a parenthetical
  saying where the problem becomes *vacuous*, not a solvability threshold. The oral-message
  3m + 1 bound and its removal is the whole point of the book's second half.
- **DLS has two models, not one.** Bounds exist but are unknown; *or* bounds are known but
  hold only after GST. The description above is the second. Decide which the book uses, or
  use both — they are different storms.

---

## The Paxos Assembly · *now Paxos*

*A sovereign island assembly passing sequential laws.* How to keep one append-only civic
chronicle across shifting quorums, absent members and corrupt leaders.

| Paper | In the world |
|---|---|
| `lamport-1998_part-time-parliament`, `lamport-2001_paxos-made-simple` | **The Rotunda.** Circular and domed: no head of the room, so any legislator may call a ballot, and intersecting quorums preserve past decrees. The dome returns sound, so two proposers at once are one unintelligible wash |
| `oki-liskov-1988`, `liskov-cowling-2012`, `ongaro-ousterhout-2014_raft-consensus` | **The Odeon**, a short walk from the Rotunda. Roofed, raked, aimed at one stage so a single voice reaches every seat: the speaker is distinguished by the architecture. When he falls silent the performance stops until another takes the stage under a higher number. Raft's refinements are stage directions — a random wait before claiming the stage, and no yielding it to a performer whose script is less complete |
| `castro-liskov-1999` | The Archon is corrupt and assigns one law number to two conflicting decrees. Three phases — pre-prepare, prepare, commit — needing 2f + 1 matches in an assembly of 3f + 1 |
| `chandra-griesemer-redstone-2007` | Physical reality: scribes run out of parchment, tablets crumble unread, and leases must be granted without message delay halting government |
| `gray-1996_dangers-of-replication` | The warning to the parliament: split decrees across independent regional councils with lazy synchronisation, and deadlock scales as O(N³) |

**The ground must provide:** the **Rotunda** on a route rather than at a dead end
(legislators wander in and out); the **Odeon** a short walk from it, about two kilometres;
a stepped quarry on a shippable coast; and a steep acropolis with a single approach.

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

- **Mount Phyle needs a plain with no other high ground in sight and no sea in frame.** It
  sits inland on Arche, 8.7–9.4 km from the nearest coast depending on the arrangement.
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
