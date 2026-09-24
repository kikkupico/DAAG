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
| **The price boards** (one per house) | DLS 1988 | A repeated type: a waist-high slab of limestone beside each house's gate, into which the season's price of oil is cut when the winter trade opens, and which stands until the next winter. Beside it, inside the gate, the house's slate, where a price is chalked with the round in which it was locked; a later round may wipe the chalk, but nothing changes the board. The compact of the ring road requires one price on all three boards, since every jar passed between the houses is reckoned at it. Winter gales make runners' delays unbounded; when the storm breaks they fall within a bound. A rotating coordinator and majority locks settle the price, safe in any gale and live once the calm comes. The board is not the counter next door: the counter answers buyers, the board fixes what every jar is worth. |
| **The counters** (one per house) | Herlihy &amp; Wing 1990 | A repeated type: the counter in each house's front room where a buyer asks for jars and is told what the house can do. A request is called when the buyer asks and returns when he is answered, and the rule is that every answer must fit one order of sales, the same at all three counters, in which anything answered before another was asked comes first. *Before* is judged by the sun, which no one on Arche can read in the trading season, and by paths the houses cannot see: the goatherd of *Ordering Without Clocks* Ch. VI, who carries word over the mountain, is how a buyer at one counter learns what a buyer at another was told. So the rule says what the houses owe their buyers, not how they could know it — the gap *Ordering Without Clocks* Ch. VI opened, turned into a correctness condition. Dear goods in small cargoes, such as Chian, are kept jar by jar: each jar has its own **line** in the book, holding the name of the buyer it is promised to, or nothing while it is free. A purchase writes a name on the line and a question asks whose the jar is, so a line is a read/write object. If each line keeps the rule, the whole trade keeps it, which is locality. The object is a line and not a running count of jars: under a closed road a count cannot even carry Gilbert &amp; Lynch's Delayed-t promise, and the closed road next door is built on lines. Next door to the closed road, which proves the rule cannot be kept while the road is shut. |
| **The closed road** | Brewer 2000 · Gilbert &amp; Lynch 2002 <span title="shared">◆</span> <span class="m">(+ their 2012 retrospective)</span> | The ring road, closed on both stretches beside the Vine because bandits are reported there. The danger is a condition, never a raid: no bandit is seen and nothing happens to a runner. Closing both stretches is what cuts the Vine off; one closed stretch would leave the third house to pass slips on. The road reopens when the danger passes. Meanwhile each side refuses to trade or trades from a book it knows may be stale — a deliberate degradation of service on an island where that is never the usual way. Consistency here is the rule of the counters next door (*every house answers as if there were one book*, made precise), which is the consistency Gilbert &amp; Lynch prove cannot be kept. Which band the road's bandits belong to is never said. Set after the gales, once the price boards are cut: a runner on an open stretch arrives within a **crossing**, the Δ of the winter price, so a sandglass that runs out means the road is shut. One house **keeps the book** for each cargo (the Anchor, for Chian landed there); the **gate-glass** lets a counter answer from its own book when the keeper's answer does not come back in time; resending and the keeper's numbers give the **promise of the span t** (Delayed-t). |

## Arche — Mount Phyle

Built, and fixed by *The Limits of Agreement*: nothing here may contradict that book.

| Building | Papers | What it is |
|---|---|---|
| **The camps** (×4) | FLP 1985 · Ben-Or 1983 · Chandra &amp; Toueg 1996 · Castro &amp; Liskov 1999 · HotStuff 2019 <span title="shared">◆</span> | One small linen tent in a clearing at the foot of each gully, one man to a tent, and at its mouth a shield, a chest and a wicker basket holding a few birds that belong to the other tents. Nothing else: no palisade, no loft, no fire. **Five books share the same four camps**, and each changes one assumption, never the building. FLP changes nothing. Ben-Or adds a prop: knucklebones, thrown by a camp that cannot settle on a gate, so that chance breaks what no plan can; the throws agree in the end with probability 1, never by a night anyone can name. Chandra &amp; Toueg adds a prop: the tally board, whose empty row is a dead commander or a raven still in the folds and must never resolve which. Castro &amp; Liskov, later in the siege, adds a liar: one of the four may have been bought (each was hired alone and paid alone), and the recruiters are the trading houses. Traders keep no ravens: each house sends a runner to its nearest camp, who waits there for the answer, since the man in the tent cannot leave his quarter, and only if that camp falls silent risks a runner to the next camp along the foot; the fourth camp has no house near it. The other camps' replies reach that camp by raven under each man's own signet, so a lying camp cannot forge them, and the house accepts an answer when two seals agree (f + 1). **A camp carries nothing from one house to another**: each man answers only to the house that hired him, so the camps never become a second channel between the houses. Four camps is exactly 3f + 1 for one liar, and the ravens' unbounded flights are PBFT's own model. HotStuff, later again, changes a procedure, not the camps: the right to number passes from camp to camp in turn, and the numbering camp gathers the others' sealed replies into one bundle and sends the bundle on, instead of every camp writing to every other. The camps are where asynchrony is studied. |
| **The chief's hollow and the three crag posts, inside the circuit wall** | Byzantine Generals 1982 · Reaching Agreement 1980 <span title="shared">◆</span> | The chief in a rock hollow on the peak with the loot; three posts tucked into separate crags below the rim, each out of sight and earshot of the others and of the peak, each with its own klepsydra. The jars are filled together at dusk, before the posts are manned. The posts are out of earshot because men within shouting distance of each other have a broadcast, and a chief with a broadcast cannot tell different men different things. The 1980 paper is the earlier and more general result; the 1982 paper is the framing everyone remembers. |

## Paxos

| Building | Papers | What it is |
|---|---|---|
| **The Chamber** | Lamport 1998 · Lamport 2001 <span title="shared">◆</span> | Lamport's own Chamber, drawn as a rotunda to fit his description. *"The acoustics of the Chamber were poor, making oratory impossible"*, so: a circular hall under a hard stone dome, with no podium, no head of the room and no seating aimed at a speaker; legislators communicate only by messenger. Open doorways all round the drum, because legislators and messengers enter and leave whenever they like; statues on the terrace outside, one of which falls. The dome and the round plan illustrate Lamport's text and carry no meaning of their own. The two papers are one algorithm in two presentations and are not retold. Lamport's §3.3.4 (a farmer, a merchant and a black goat) states for Paxos the rule of Arche's counters. |

## Skene

A sovereign island of its own, governed from one theatre. It is not a second legislature on
Paxos: two bodies keeping one island's law book would be the split the algorithms exist to
prevent.

| Building | Papers | What it is |
|---|---|---|
| **The Odeon** | Oki &amp; Liskov 1988 | Roofed, raked, aimed at one stage. Viewstamped Replication is a genuine alternative to Paxos, developed independently and published first, so it has its own island, and the two law books never conflict. Its legislators govern from a theatre: one speaks from the stage, the others keep their law books in the front row (the *proedria*), and the public in the seats behind learn the law. The speaker is distinguished by the architecture, and when they fall silent business stops until another legislator takes the stage under a higher number, and gathers what a majority of the front row holds before speaking. |

## Homonoia

*Homonoia*, concord: everyone ends of one mind, by merging rather than by assembly. An island
of scholars and copyists, and the line between it and Arche is **how much disagreement each
can live with**. On Arche, trading from a stale book is an emergency measure, taken
knowingly: a jar promised to two buyers is a real loss. The scholars answer from whatever copy
they hold as a matter of course and live with copies that differ for a while, since an
out-of-date line is put right at the next collation, as long as every copy agrees in the end.
Homonoia holds **no assembly**: nothing here waits for a vote, and most of what happens
happens in the colonnades, which is the island's argument.

| Building | Papers | What it is |
|---|---|---|
| **The stoa and the festival ground** | Demers 1987 | Barely a building: a colonnade where travelling scholars pass on new learnings on scraps of papyrus — that the Earth goes round the Sun, say — and lose interest once most of those they meet already have the scrap, and a field where, once a year, pairs of copyists compare their whole collections, scraps included, to catch whatever the talk missed. The finding is historical, but its author is not named: named figures are the papers' own authors. |
| **The libraries** | PBS 2012 | A repeated type: each work is kept at several libraries, a new edition reaches some before others, and a reader asks only a few. Nothing is built here; the paper is a model. It measures how likely the copy a reader is handed is out of date, and by how much, so a library can promise that it is *probably* current. |
| **The far terraces** | Shapiro et al. 2011 (both) <span title="shared">◆</span> | The short paper and the comprehensive report are one work, so one place. The island's count of how many copies of each work have been made, kept in voting pebbles: each library adds only to its own column, and merging takes the greater count in each. Merge in any order, merge twice, and every terrace still agrees. Sited as far from any assembly as the island goes. |
| **The reading room** | HATS 2014 | In every library: **what a librarian can still promise a reader while the couriers are stopped**. That no reply is shown before the letter it answers, and that no one sees half a revision, both survive the strike; that two readers will not both take the last copy provably does not. |

## The council ground

| Building | Papers | What it is |
|---|---|---|
| **The hall of two doors** | Hellerstein 2010 · Ameloot et al. 2011 · Hellerstein &amp; Alvaro 2020 <span title="shared">◆</span> | One door facing the islands that assemble, Paxos and Skene; one facing Homonoia. Every question brought here leaves by the door its own shape decides: those that only ever add leave by Homonoia's door and need no assembly, and those resting on absence — *no one has claimed this* — leave by the door of the assemblies. The building does not rule; it sorts. |

---

## The seven shares, and why each is right

| Building | Papers | The relation |
|---|---|---|
| The column room | Fidge · Mattern | Independent simultaneous discovery of one idea |
| The closed road | Brewer · Gilbert &amp; Lynch | A conjecture and the work that settles it |
| The chief's hollow and crag posts | Reaching Agreement 1980 · Byzantine Generals 1982 | The general result and its famous framing, same authors |
| The camps | FLP · Ben-Or · Chandra &amp; Toueg · Castro &amp; Liskov · HotStuff | Same four camps; each book changes one assumption — nothing, a coin, a detector, a liar — and HotStuff changes a liar-camp's procedure |
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
  different islands — one where no voice carries, one built so that a single voice reaches
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
