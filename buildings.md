# Buildings

A building for each paper, and a shared building where sharing is right. The islands are
described in `settings.md`; this file is the next resolution down.

**Map pins are districts, not buildings.** A pin called *the libraries* is twelve
buildings; a pin called *Odeon* is one. Keeping the maps at district resolution is what stops
them turning into floor plans.

## The rule for sharing

Two papers share a building when they are **one idea at two resolutions** — an independent
rediscovery, a conjecture and its proof, a general result and its famous framing, a short and
a long version — or when a later paper is best told as a change of procedure in an existing room.
They get separate buildings when they make **different claims about the same subject**, and
then the buildings stand next to each other so the difference is a walk of a few hundred
metres rather than a footnote.

Seven shares below cover **seventeen papers in seven buildings**. Everything else gets its
own, which comes to **15 buildings for 25 papers**.

**A book is not a building.** A book may walk between two adjacent buildings when the
difference between them is best read in one sitting: *Ordering Without Clocks* covers the
tally house and the column room. The buildings stay separate because the claims do.

---

## Arche — the ring road

| Building | Papers | What it is |
|---|---|---|
| **The tally house** | Lamport 1978 | Three rooms for one paper's three parts: the front room where clerks ink rising numbers on slips and push their own past any number that arrives; the middle room where ties are broken by the house's name, which turns the partial order into a total one; and at the back, the drift-corrected dials for the orders that arrive outside the letters. |
| **The column room** | Fidge 1988 · Mattern 1988 <span title="shared">◆</span> | Next door to the tally house, and the difference between them is the whole point: one column per house instead of one number. Two clerks can now tell whether their orders were placed in ignorance of each other, which the tally house can only fail to rule out. |
| **The customs seat and the storehouses** | Chandy &amp; Lamport 1985 | Scribes record each house's storehouse; a runner in a red sash goes down every stretch of road as the marker, and each house keeps a slate for each incoming stretch until the sash arrives. The total is a state the island could have been in, though no one ever saw it. |
| **The claims board** (at the Anchor) | Herlihy &amp; Wing 1990 | A board at the Anchor's gate on which the houses' claims to landed grain are entered and served first come, first served: a FIFO queue. The same claims the tallies of *Ordering Without Clocks* order by chains of slips are here ordered by the sun: a claim finished before another began is served first. *Before* is judged by the sun, which no one on Arche can read in the trading season; the goatherd of *Ordering Without Clocks* Ch. VI is the witness who could catch the houses out. The board has numbered **slots** for claim tablets and one **peg** at the next free slot; clerks enter claims (take a number, put the tablet in) and loaders serve (go up from slot 1, take the first tablet) at once, with no one standing aside: the paper's §4 queue. Oil from the Vine's presses has a board of its own. Herlios keeps the board; Wingaia is of the Vine. |
| **The closed road** | Brewer 2000 · Gilbert &amp; Lynch 2002 <span title="shared">◆</span> <span class="m">(+ their 2012 retrospective)</span> | The ring road, closed on both stretches beside the Vine because bandits are reported there. The danger is a condition, never a raid: no bandit is seen and nothing happens to a runner. Closing both stretches is what cuts the Vine off; one closed stretch would leave the third house to pass slips on. The road reopens when the danger passes. Meanwhile each side refuses to trade or trades from a book it knows may be stale — a deliberate degradation of service on an island where that is never the usual way. Consistency here is the rule of the counters next door (*every house answers as if there were one book*, made precise), which is the consistency Gilbert &amp; Lynch prove cannot be kept. Which band the road's bandits belong to is never said. Set after the winter gales: a runner on an open stretch arrives within a **crossing**, three turns of the customs sandglass, so a sandglass that runs out means the road is shut. One house **keeps the book** for each cargo (the Anchor, for Chian landed there); the **gate-glass** lets a counter answer from its own book when the keeper's answer does not come back in time; resending and the keeper's numbers give the **promise of the span t** (Delayed-t). |

## Arche — Mount Phyle

Built, and fixed by *The Limits of Agreement*: nothing here may contradict that book.

| Building | Papers | What it is |
|---|---|---|
| **The camps** (×4) | FLP 1985 · DLS 1988 · Ben-Or 1983 · Chandra &amp; Toueg 1996 <span title="shared">◆</span> | One small linen tent in a clearing at the foot of each gully, one man to a tent, and at its mouth a shield, a chest and a wicker basket holding a few birds that belong to the other tents. Nothing else: no palisade, no loft, no fire. **Four books share the same four camps**, and each changes one assumption, never the building. FLP changes nothing. DLS changes the weather: a wind that pins the ravens in the folds while it blows (a bird already down among the crows may stay past the drop) and always drops in the end, after which every bird let go is at its perch within a glass; each tent has a sandglass turned as the last light left the crown, a pebble per glass for a common count, and pledges tied to the tent pole naming a gate and a turn. Ben-Or adds a prop: a coin of Attic silver, owl for north and goddess for south, tossed by a man who cannot settle on a gate, each alone in his own tent, so that chance breaks what no plan can; the tosses line up in the end with probability 1, never by a night anyone can name. Chandra &amp; Toueg adds a prop: the slate, a row per other tent, whose chalk mark is a dead man or a raven still in the folds and must never resolve which; with a majority alive, the turn of DLS passes round the tents by round number, which is no one's command. The mercenaries have no leader and do not lie, so the leader-based papers are on the crown. **A camp carries nothing from one house to another**, so the camps never become a channel between the houses. The camps are where asynchrony is studied. |
| **The chief's hollow and the three crag posts, inside the circuit wall** | Byzantine Generals 1982 · Reaching Agreement 1980 · Castro &amp; Liskov 1999 · HotStuff 2019 <span title="shared">◆</span> | The chief in a rock hollow on the peak with the loot; three posts tucked into separate crags below the rim, each out of sight and earshot of the others and of the peak, each with its own sandglass. The glasses are turned together at dusk, before the posts are manned, on the one synchronous night. The posts are out of earshot because men within shouting distance of each other have a broadcast, and a chief with a broadcast cannot tell different men different things. The 1980 paper is the earlier and more general result; the 1982 paper is the framing everyone remembers. **Later nights** keep the same four men, birds and seal rings, and add the **loot book**, a copy at each post, whose entries each man files and trusts only when two seals agree. The wind that blows over the whole hill on the camps' windy nights pins the ravens down while it blows; when it drops, flights are short again. Castro &amp; Liskov: the chief's job, numbering the entries, passes in a fixed order when its holder is suspected (the chief is a job, not a rank); four men is exactly 3f + 1 for one liar. HotStuff changes a procedure, not the crown: the job passes with every entry, and its holder ties the others' sealed votes into one bundle and sends the bundle on, instead of every man writing to every other. |

## Paxos — the Chamber

One island shaped like a Y, and its shape groups the papers. Two arms reach north and face
each other across a bay: the Chamber on the western arm, the city of Schedia and its Odeon on the
eastern. The hall of two doors stands at the fork, and the stem widens into the scholars'
coast. The parliament passes decrees, the law of Paxos; Schedia keeps its own laws; the
scholars' copies are not law, and no decree settles which copy is right.

| Building | Papers | What it is |
|---|---|---|
| **The Chamber** | Lamport 1998 · Lamport 2001 <span title="shared">◆</span> | Lamport's own Chamber, drawn as a rotunda to fit his description. *"The acoustics of the Chamber were poor, making oratory impossible"*, so: a circular hall under a hard stone dome, with no podium, no head of the room and no seating aimed at a speaker; legislators communicate only by messenger. Open doorways all round the drum, because legislators and messengers enter and leave whenever they like; statues on the terrace outside, one of which falls. The dome and the round plan illustrate Lamport's text and carry no meaning of their own. The two papers are one algorithm in two presentations and are not retold. Lamport's §3.3.4 (a farmer, a merchant and a black goat) states for Paxos the rule of Arche's counters. |

## Paxos — Schedia

A city on the eastern arm, governed from one theatre, with laws of its own: its founders came
from a different mother city and brought their laws with them, and the Parliament's decrees
have never run there. Each law book covers its own city, so the two never contradict each
other.

| Building | Papers | What it is |
|---|---|---|
| **The Odeon** | Oki &amp; Liskov 1988 | Roofed, raked, aimed at one stage. Viewstamped Replication is a genuine alternative to Paxos, developed independently and published first, so it has a city of its own, and the two law books never conflict. Its legislators govern from a theatre: one speaks from the stage, the others keep their law books in the front row (the *proedria*), and the public in the seats behind learn the law. The speaker is distinguished by the architecture, and when they fall silent business stops until another legislator takes the stage under a higher number, and gathers what a majority of the front row holds before speaking. |

## Paxos — the scholars' coast

*Homonoia*, concord, the scholars call it: everyone ends of one mind, by merging rather than by
assembly. A coast of scholars and copyists, and the line between it and Arche is **how much
disagreement each can live with**. On Arche, trading from a stale book is an emergency measure, taken
knowingly: a jar promised to two buyers is a real loss. The scholars answer from whatever copy
they hold as a matter of course and live with copies that differ for a while, since an
out-of-date line is put right at the next collation, as long as every copy agrees in the end.
The scholars hold **no assembly**: nothing here waits for a vote, though the Chamber is a
morning's walk away, and most of what happens happens in the colonnades, which is the coast's
argument.

| Building | Papers | What it is |
|---|---|---|
| **The stoa and the festival ground** | Demers 1987 | Barely a building: a colonnade where travelling scholars pass on new learnings on scraps of papyrus — that the Earth goes round the Sun, say — and lose interest once most of those they meet already have the scrap, and a field where, once a year, pairs of copyists compare their whole collections, scraps included, to catch whatever the talk missed. The finding is historical, but its author is not named: named figures are the papers' own authors. |
| **The libraries** | PBS 2012 | A repeated type: each work is kept at several libraries, a new edition reaches some before others, and a reader asks only a few. Nothing is built here; the paper is a model. It measures how likely the copy a reader is handed is out of date, and by how much, so a library can promise that it is *probably* current. |
| **The far terraces** | Shapiro et al. 2011 (both) <span title="shared">◆</span> | The short paper and the comprehensive report are one work, so one place. The coast's count of how many copies of each work have been made, kept in voting pebbles: each library adds only to its own column, and merging takes the greater count in each. Merge in any order, merge twice, and every terrace still agrees. Sited on the far shore at the southern tip, as far from the assemblies as the island goes. |
| **The reading room** | HATS 2014 | In every library: **what a librarian can still promise a reader while the couriers are stopped**. That no reply is shown before the letter it answers, and that no one sees half a revision, both survive the strike; that two readers will not both take the last copy provably does not. |

## Paxos — the hall of two doors

| Building | Papers | What it is |
|---|---|---|
| **The hall of two doors** | Hellerstein 2010 · Ameloot et al. 2011 · Hellerstein &amp; Alvaro 2020 <span title="shared">◆</span> | At the fork of the island, on common ground that belongs to neither city. One door facing north up the bay to the bodies that assemble, the Chamber and the Odeon; one facing south down the stem to the scholars' coast. Every question brought here leaves by the door its own shape decides: those that only ever add leave by the scholars' door and need no assembly, and those resting on absence — *no one has claimed this* — leave by the door of the assemblies. The building does not rule; it sorts. |

---

## The seven shares, and why each is right

| Building | Papers | The relation |
|---|---|---|
| The column room | Fidge · Mattern | Independent simultaneous discovery of one idea |
| The closed road | Brewer · Gilbert &amp; Lynch | A conjecture and the work that settles it |
| The chief's hollow and crag posts | Reaching Agreement 1980 · Byzantine Generals 1982 · Castro &amp; Liskov · HotStuff | The general result and its famous framing, same authors; then, on later nights, a leader among liars (PBFT) and a change of that leader's procedure (HotStuff) |
| The camps | FLP · Ben-Or · Chandra &amp; Toueg | Same four camps; each book changes one assumption — nothing, a coin, a detector |
| The Chamber | Lamport 1998 · 2001 | One algorithm in two presentations |
| The far terraces | Shapiro (short) · Shapiro (comprehensive) | Two lengths of one work |
| The hall of two doors | Hellerstein 2010 · Ameloot 2011 · Hellerstein &amp; Alvaro 2020 | A conjecture, its formal proof, and its definitive restatement — one idea at three resolutions |

**The near-misses** — pairs that look shareable and are not:

- **Tally house / column room.** Both are clocks. But one respects causality and the other
  *detects concurrency exactly*, which is a different claim. Adjacent, not merged.
- **Counters / closed road.** Both are about answering as if there were one book. But one
  states the rule and the other proves it cannot be kept while the road is shut. Adjacent, not
  merged.
- **Chamber / Odeon.** Both keep a law book by majority. But VR was found independently and
  is a genuine alternative, not a variant; the whole point is that they are different rooms, on
  either arm of the island, facing each other across the bay — one where no voice carries, one built so that a single voice reaches
  every seat.

---

## Sources

**`sources/` holds 28 verified PDFs: the 25 papers this file assigns, plus 3 companions.** No
duplicates (checked by MD5), and every filename's lead surname appears on page 1 of its own
file. `demers-1989` is a byte-identical copy of `demers-1987`, so there is one Demers paper.
`sources/_misfiled/` holds files that carried a paper's name but not its content.

**Verify by opening the file, never by the URL or the filename.** MIT's TDS group serves
Gilbert & Lynch's 2012 retrospective at a URL named `Brewer2.pdf`; the 2002 proof has to come
from Gilbert's own page at NUS.

### The three companions

Not assigned a building of their own; they sit with the paper they accompany.

| File | Sits with |
|---|---|
| `hellerstein-alvaro-2020_keeping-calm.pdf` | The hall of two doors — the clearest statement of the theorem, and the one to draft from |
| `gilbert-lynch-2012_perspectives-on-cap.pdf` | The closed road — the authors' own retrospective on what the proof did and did not say |
| `zinn-green-ludascher-2012_win-move-coordination-free.pdf` | Background for the hall of two doors. Optional; it settles a narrower question than CALM itself |
