# Buildings

A building for each paper, and a shared building where sharing is right. Islands are
`layouts.html`; this file is the next resolution down.

**Map pins are districts, not buildings.** A pin called *Harbour* is four buildings; a pin
called *Odeon* is one. Keeping the maps at district resolution is what stops them turning
into floor plans.

## The rule for sharing

Two papers share a building when they are **one idea at two resolutions** — an independent
rediscovery, a conjecture and its proof, a system and its revision, a short and a long
version. They get separate buildings when they make **different claims about the same
subject**, and then the buildings stand next to each other so the difference is a walk of a
few hundred metres rather than a footnote.

Ten shares below cover **twenty-two papers into ten buildings**. Everything else gets its own,
which comes to **19 buildings for 31 papers** — one of them structural, carrying no paper at
all. (The sources were found to be broken while writing this and have since been fixed; see the end.)

The corpus is **31 papers, not 32**: `demers-1989` turned out to be a byte-identical copy of
`demers-1987`.

---

## Arche — the harbour town

| Building | Papers | What it is |
|---|---|---|
| **The tally house** | Lamport 1978 | Three rooms for one paper's three parts: the front room where clerks ink rising numbers on slips and push their own past any number that arrives; the middle room where ties are broken by the house's name, which turns the partial order into a total one; and at the back, the drift-corrected dials for the orders that arrive outside the letters. |
| **The column room** | Fidge 1988 · Mattern 1988 <span title="shared">◆</span> | Next door to the tally house, and the difference between them is the whole point: one column per house instead of one number. Two clerks can now tell whether their orders were placed in ignorance of each other, which the tally house can only fail to rule out. |
| **The auditor's court** | Herlihy &amp; Wing 1990 | An external court, not a trading house. It holds that if one trade cleared before another was placed, no trader may ever be shown the second without the first — and that a house whose every counter keeps this rule keeps it as a house. |
| **The customs house** | Chandy &amp; Lamport 1985 | Scribes count what is on hand, send a marker boat down every lane, and keep logging what arrives from a lane until that lane's marker comes in. The total is a state the harbour could have been in, though no one ever saw it. |
| **The outport offices** | Brewer 2000 · Gilbert &amp; Lynch 2002 <span title="shared">◆</span> <span class="m">(+ their 2012 retrospective)</span> | A repeated type, one on each outport. **Two of them, on either side of the channel, are what make the point**: when the water closes, each clerk must answer from a book he knows may be stale, or refuse to answer at all. |
| **The closed road** | *structural — no paper* | The inland road from the town to the hill, held by the soldiers. It is why the bandits in the market cannot reach their own council on the crown, and therefore why nothing they do can become a plot. |

## Arche — Mount Phyle

Already built and measured in `content-i2`, with architecture, cast and panel inventory.

| Building | Papers | What it is |
|---|---|---|
| **The camp enclosures and raven lofts** (×4) | FLP 1985 · Chandra &amp; Toueg 1996 <span title="shared">◆</span> | Palisade, tents, and a wicker loft on stilts with a compartment painted for each other camp. **The two books share the same four camps**, and what separates them is a prop, not a building: the tally board, whose empty row is a dead commander or a raven still in the folds and must never resolve which. |
| **The chief's hollow and the three crag posts, inside the circuit wall** | Byzantine Generals 1982 · Reaching Agreement 1980 <span title="shared">◆</span> | The chief in a rock hollow on the peak with the loot; three posts tucked into separate crags below the rim, each out of sight and earshot of the others and of the peak, each with its own klepsydra. The jars are filled together at dusk, before the posts are manned. *(Replaces the earlier council ring of five seats. Men within shouting distance of each other have a broadcast, and a chief with a broadcast cannot tell different men different things.)* The 1980 paper is the earlier and more general result; the 1982 paper is the framing everyone remembers. |
| **The chief's hollow and the crag posts, later in the siege** | Castro &amp; Liskov 1999 | The same four bandits in the same places, not a new building. The jars were started together once, at the meeting before the posts were first manned; since no man may leave his post, that meeting is never repeated, the jars drift, and silence stops being a fact. What separates this book from the Byzantine one is that loss, not a building. Four men is exactly 3f + 1 for one liar. The chief numbers each order and the guards echo it twice before it stands; a chief whose numbering stalls or contradicts itself loses the job to the next man (*"the chief is a job, not a rank"*). Each man's own jar still serves to notice a silent chief. No new cast, and nothing follows from any order. *(Moved from the three courts on the Paxos acropolis: the hill already holds delay without liars below and liars without delay above, and PBFT is the case with both.)* |
| **The beacon line** | DLS 1988 | A chain of fire stations on a ridge in the army's rear, about 130 km off — over the horizon from the crown, with its own people and its own diorama. Off every map by construction. |

## Paxos

| Building | Papers | What it is |
|---|---|---|
| **The Chamber** | Lamport 1998 · Lamport 2001 · Chandra, Griesemer &amp; Redstone 2007 <span title="shared">◆</span> | Lamport's own Chamber, drawn as a rotunda to fit his description. *"The acoustics of the Chamber were poor, making oratory impossible"*, so: a circular hall under a hard stone dome, with no podium, no head of the room and no seating aimed at a speaker; legislators communicate only by messenger. Open doorways all round the drum, because legislators and messengers enter and leave whenever they like; statues on the terrace outside, one of which falls. The dome and the round plan illustrate Lamport's text and carry no meaning of their own. The first two papers are one algorithm in two presentations and are not retold. *Paxos Made Live* returns to the same room rather than building a new one, so that engineered Paxos can be set directly against the original: the ledgers wear out, the law book must be summarised, entries fade unread and must be recopied, and the president holds office for a fixed term so as to answer without calling a ballot. |
| **The abandoned counting house** | Gray 1996 | Empty, and kept empty. A lazy scheme that split decrees across independent regional councils, whose deadlocks grew as the cube of their number. It is the assembly's reason to exist, and it is the only building on Paxos that is not in use. |

## Skene

A sovereign island of its own, governed from one theatre. It is not a second legislature on
Paxos: two bodies keeping one island's law book would be the split the algorithms exist to
prevent.

| Building | Papers | What it is |
|---|---|---|
| **The Odeon** | Oki &amp; Liskov 1988 · Liskov &amp; Cowling 2012 · Ongaro &amp; Ousterhout 2014 <span title="shared">◆</span> | Roofed, raked, aimed at one stage. Viewstamped Replication is a genuine alternative to Paxos, developed independently and published first, so it gets its own island, and the two law books never conflict: the speaker is distinguished by the architecture, and when he falls silent the performance stops until another takes the stage under a higher number. Raft shares it because it re-derives that lineage (its own paper names VR as its closest relative); its claim is that the performance can be *taught*, and its refinements are stage directions — a random wait before claiming the stage, and no stage for a performer whose script is less complete. |

## Homonoia

*Homonoia*, concord: everyone ends of one mind, by merging rather than by assembly. An island
of scholars and copyists, and the line between it and Arche is **how much disagreement each
can live with**. The traders of Arche cannot let their records disagree even for a moment: a
jar promised to two buyers is a real loss. The scholars can live with copies that differ for a
while, since an out-of-date line is put right at the next collation, as long as every copy
agrees in the end. Homonoia has
fewer buildings than Paxos on purpose: most of what happens here happens in the colonnades,
which is the island's argument.

| Building | Papers | What it is |
|---|---|---|
| **The stoa and the festival ground** | Demers 1987 <span title="shared">◆</span> · Saito &amp; Shapiro 2005 | Barely a building: a colonnade where travelling scholars pass on a new finding — that the Earth goes round the Sun — and lose interest once most of those they tell have already heard it, and a field where, once a year, pairs of copyists collate whole texts line by line to catch whatever the talk missed. (The finding is historical, but its author is not named: named figures are the papers' own authors.) Saito &amp; Shapiro shares it because their paper is the catalogue of what this island already does. |
| **The ring of libraries** | Dynamo 2007 · PBS 2012 <span title="shared">◆</span> | A repeated type around one lagoon, each holding the scrolls whose catalogue marks fall between it and its neighbour. A closed library's copies are made next door with a note to return them — and PBS shares the ring because it does not build anything: it measures how often this ring hands a reader a stale copy. |
| **The wax scriptorium** | Bayou 1995 | On the beach. Scribes draft changes in wax, used at home at once and provisional everywhere else, each carrying its own check and its own fallback, rolled back and redone when an earlier one lands — and copied fair in ink only when the head library has fixed their order. |
| **The far terraces** | Shapiro et al. 2011 (both) <span title="shared">◆</span> | The short paper and the comprehensive report are one work, so one place. The island's count of how many copies of each work exist, kept in voting pebbles: each library adds only to its own column, and merging takes the greater count in each. Merge in any order, merge twice, and every terrace still agrees. Sited as far from any assembly as the island goes. |
| **The sorting house** | COPS 2011 | Where the scholars' letters come in. Every letter names the letters it answers, and the sorter holds it back until those have arrived — so no library ever shows a reply before the letter it answers. |
| **The reading room** | HATS 2014 | Beside the sorting house, and a different claim: not what order letters arrive in, but **what a librarian can still promise a reader while the couriers are stopped**. Never to see half a revision survives the strike; that two readers will not both take the last copy provably does not. |

## The council ground

| Building | Papers | What it is |
|---|---|---|
| **The hall of two doors** | Hellerstein 2010 · Ameloot et al. 2011 · Hellerstein &amp; Alvaro 2020 <span title="shared">◆</span> | One door facing the islands that assemble, Paxos and Skene; one facing Homonoia. Every decree brought here leaves by the door its own shape decides: those that only ever add leave by Homonoia's door and need no assembly, and those resting on absence — *no one has claimed this* — leave by the door of the assemblies. The building does not rule; it sorts. |

---

## The ten shares, and why each is right

| Building | Papers | The relation |
|---|---|---|
| The column room | Fidge · Mattern | Independent simultaneous discovery of one idea |
| The outport offices | Brewer · Gilbert &amp; Lynch | A conjecture and the work that settles it |
| The chief's hollow and crag posts | Reaching Agreement 1980 · Byzantine Generals 1982 | The general result and its famous framing, same authors |
| The camp enclosures | FLP · Chandra &amp; Toueg | Same four camps; the difference is a prop, not a building |
| The Chamber | Lamport 1998 · 2001 · Chandra, Griesemer &amp; Redstone | One algorithm in two presentations, and the same algorithm engineered — told in the original's own room so the two can be compared |
| The Odeon | Oki &amp; Liskov · Liskov &amp; Cowling · Ongaro &amp; Ousterhout | One system revisited by its own author, and its re-derivation for teaching; the difference is a stage direction, not a building |
| The stoa and festival ground | Demers · Saito &amp; Shapiro | A practice, and the catalogue of that practice |
| The ring of libraries | Dynamo · PBS | A thing built, and a measurement of the thing built |
| The far terraces | Shapiro (short) · Shapiro (comprehensive) | Two lengths of one work |
| The hall of two doors | Hellerstein 2010 · Ameloot 2011 · Hellerstein &amp; Alvaro 2020 | A conjecture, its formal proof, and its definitive restatement — one idea at three resolutions |

**The near-misses** — pairs that look shareable and are not:

- **Tally house / column room.** Both are clocks. But one respects causality and the other
  *detects concurrency exactly*, which is a different claim. Adjacent, not merged.
- **Sorting house / reading room.** Both are about coping without coordination. But one is
  about the order of writes and the other about what a transaction may promise.
- **Chamber / Odeon.** Both keep a law book by majority. But VR was found independently and
  is a genuine alternative, not a variant; the whole point is that they are different rooms, on
  different islands — one where no voice carries, one built so that a single voice reaches
  every seat.

---

## The sources, fixed

Every PDF was opened and its title read, which turned up three misfiled files and one
duplicate. All are now resolved. **`sources/` holds 34 verified PDFs: the 31 papers this
file assigns, plus 3 useful companions.** No duplicates (checked by MD5), and every
filename's lead surname appears on page 1 of its own file.

### What was wrong, and what was done

| File | Was | Now |
|---|---|---|
| `hellerstein-2010_declarative-imperative-calm.pdf` | *"Heat pumping with optically driven excitons"* — a quantum physics paper | Replaced with the real **Declarative Imperative** (Berkeley). The physics paper is in `sources/_misfiled/`, not deleted. |
| `ameloot-2011_relational-transducers-calm-proof.pdf` | *"Win-Move is Coordination-Free (Sometimes)"*, Zinn, Green &amp; Ludäscher | Replaced with the real **Ameloot, Neven &amp; Van den Bussche** (arXiv 1012.2858). The Zinn paper is kept, correctly renamed — it is genuine CALM-family work. |
| `gilbert-lynch-2002_brewers-conjecture.pdf` | *"Perspectives on the CAP Theorem"* (2012) | Replaced with the real **2002 SIGACT News proof**, from Gilbert's own page at NUS. The 2012 retrospective is kept, correctly renamed, as a companion. |
| `demers-1989_...-parc-csl-89-1.pdf` | Byte-identical to `demers-1987` | Moved to `sources/_misfiled/`. There is one Demers paper. |
| — | Chandy &amp; Lamport was absent entirely | Fetched from **Lamport's own site**. |

> **How the CAP file went wrong, and a warning.** MIT's TDS group serves the 2012
> retrospective at a URL named `Brewer2.pdf`. Fetching that URL reproduces the original
> error exactly — it did so once during this fix before the content check caught it. The
> 2002 proof has to come from Gilbert's NUS page. **Verify by opening the file, never by the
> URL or the filename.**

### The three companions

Not assigned a building of their own; they sit with the paper they accompany.

| File | Sits with |
|---|---|
| `hellerstein-alvaro-2020_keeping-calm.pdf` | The hall of two doors — the clearest statement of the theorem, and the one to draft from |
| `gilbert-lynch-2012_perspectives-on-cap.pdf` | The outport offices — the authors' own retrospective on what the proof did and did not say |
| `zinn-green-ludascher-2012_win-move-coordination-free.pdf` | Background for the hall of two doors. Optional; it settles a narrower question than CALM itself |

## Open

1. **Nothing is blocked on sources any more.** All 31 papers are present and verified.
2. **Raft's placement.** Raft sits in the Odeon, with VR, rather than in the
   Chamber: its own paper names VR as its closest relative. It could be told in either.
3. **Whether the outport offices are one building or a type.** They are drawn as a repeated
   type, which is right for the map and possibly wrong for the panels: CAP needs exactly two
   in frame, on either side of closed water.
4. **Mount Phyle's buildings are fixed**, not proposals — they exist in
   `content-i2/art/architecture.json`. Nothing here may contradict them.
