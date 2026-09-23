# How a paper becomes a book

A working procedure, written so that someone who has not been part of the conversation so far
can pick up the next paper and produce a book that sits beside the three already written
without looking like a different series.

**Read first:** `buildings.md` (which paper lives in which building), `settings.md` (the
analysis and the constraints that cannot be broken), `layouts.html` (the world).
**Read as models:** the finished books in `books/`. They are the specification. Where
this document and a finished book disagree, the book is right.

---

## The two phases

**Phase 1 — text.** Complete prose, with SVG or HTML diagrams where a diagram carries the
argument better than a sentence. Every formal argument in a collapsed section. **No art, no
image tags, no placeholders for art.** A phase-1 book must read as a finished document on its
own; nothing in it may be waiting for a picture.

**Phase 2 — art.** Happens later, separately, and is not your concern. Do not leave gaps for
it, do not write captions that refer to images, and do not describe what a panel would show.
The allegorical devices must nevertheless be **fully in place in the prose**, because phase 2
will be built from what you write.

---

## The seven rules that are not negotiable

These come from `content-i2/brief.md` and are correctness constraints, not preferences.

1. **Not a story.** No plot, no battle, no outcome. A book is *a setting in which a paper's
   findings are explored*. Nothing is resolved, nobody wins, there is no protagonist and no
   arc. If your draft has a climax, it is wrong.
2. **No fantasy.** No gods, omens, curses or prophecies. Every mechanism is mundane and could
   be built. Where a paper proves an impossibility, the impossibility is a fact about wood,
   distance, birds and daylight — never a curse.
3. **The allegory is exact.** Every device maps onto an element of the paper's model. Nothing
   may be added that changes the model. Write a *must not exist* list before you draft, and
   treat it as a hard exclusion.
4. **Devices are per setting.** There is no series-wide table of symbols. Each setting
   establishes its own vocabulary, and a device means nothing outside the setting that defines
   it.
5. **Named figures are Hellenised authors** of that book's own papers, following Lamport's
   practice with the Paxon legislators. Where a setting needs a seat no author fills, use an
   ordinary Greek name.
6. **Read the paper, not your memory of it.** Open the PDF. Quote the theorem. The project has
   already been bitten by this twice — see *Verification* below.
7. **Close with the mapping.** Every book ends with an *In the book / In the paper* table and
   a plain-prose statement of the ideas, so a reader can check the allegory rather than trust
   it.

---

## Procedure

### 1. Establish the ground

Look the paper up in `buildings.md`. That gives you the building, the island, and the
one-sentence statement of what the building carries. Check `settings.md` for constraints on
that island. If the building shares its papers with another book, read that book first — you
inherit its vocabulary and may not contradict it.

### 2. Read the paper and extract the model

Before writing a word of prose, write down, from the PDF and not from memory:

- Every **object** in the model (process, message, channel, register, round, clock…).
- Every **assumption**, especially the ones the paper states once and relies on throughout
  (FIFO channels, at most one fault, synchronous rounds, unforgeable signatures).
- Every **numbered result** — lemma, theorem, bound — in its exact form, with its constants.
- The **negative space**: what the paper explicitly does *not* claim. This is usually where
  the book's most interesting chapter is.

### 3. Build the device table

For each object and assumption, invent the physical thing that carries it. Test each
candidate against three questions:

- **Is it exact?** Does the physical thing have *exactly* the properties of the model object,
  no more? A device that can do something the model object cannot will quietly break a proof.
- **Is it mundane?** Could it be built from wood, stone, rope, water and birds?
- **Does it earn its place?** A device that merely renames the concept is decoration. The good
  ones do work — the jars on the crown *are* the synchronous round; the tally board's empty row *is*
  the indistinguishability of a crash from a delay.

Then write the **must not exist** list: the things that would be natural to add and would
wreck the model. For the camps book it includes horns, fires and any counted night. For a
gossip book it would include anything resembling an assembly.

### 4. Draft the chapters

The shape that has worked before:

| | |
|---|---|
| **I** | The place, and the problem it has. Concrete, physical, no formalism. |
| **II–III** | The model, built up one device at a time. The reader should not notice they are being handed a formal system. |
| **IV–VII** | The paper's results, one per chapter, each stated in the setting's own vocabulary and then proved in a collapsed section. |
| **VIII** | What the result does *not* say, or what it costs, or what it assumes and never verifies. The best chapter in three of the four existing books is this one. |
| **IX** | *In the book / In the paper*, then the ideas plainly. |

### 5. Register

Plain, specific, unhurried. The voice is a careful antiquarian describing arrangements he has
examined, not a storyteller. Never soften the technical content: the lemmas and bounds appear
in full, in the setting's vocabulary, with the formal statement available alongside.

Concretely:

- Prefer the physical noun to the abstract one. *A boy carries the slip along the quay*, not
  *the message is transmitted*.
- State results as results. Use `<div class="result"><span class="name">…</span>` and give the
  result a name a reader can refer back to.
- When you first coin a device, mark it with `<span class="coin">`.
- Say what is *not* claimed, out loud, immediately after saying what is. The gap between a
  theorem and its converse is where readers go wrong, and it is cheap to close in prose.

---

## Proofs: always collapsed, never omitted

Every formal argument goes in:

```html
<details class="proof">
  <summary>Proof — that …</summary>
  <ol class="proofsteps">
    <li>…</li>
    <li>…<span class="qed">∎</span></li>
  </ol>
</details>
```

Rules for the proofs themselves:

- **The prose above must stand without it.** A reader who never opens a single proof should
  finish the book understanding the result and why it is true. The collapsed section is for
  the reader who wants it airtight, not for the reader who wants it at all.
- **Prove it in the setting's vocabulary,** not in the paper's. *Courses that touch no camp in
  common commute*, not *disjoint schedules commute*. The `<span class="paper">` inline
  convention carries the technical term where it is needed.
- **One summary line per proof, naming what is proved.** &ldquo;Proof — that nothing comes
  before itself&rdquo;, not &ldquo;Proof of Lemma 1&rdquo;.
- **Where the paper's own proof is long or hard, say so** and give the sketch. `The Tally and
  the Column` does this for the physical-clock theorem; the Byzantine book does it for the
  three-general impossibility. Honesty about a gap is fine; pretending there is none is not.

Formal statements that are not proofs — model definitions, conditions, bounds — go inline in
`<div class="aside-formal">` or `<div class="mathblock">`, *not* collapsed. The reader should
meet the model in the open and only the argument behind a door.

---

## Diagrams

Inline SVG, in `<figure class="diagram"><div class="board">…</div><figcaption>…</figcaption>`.
The primitives are defined in `assets/css/books.css` — `.d-lifeline`, `.d-ev`, `.d-ev-hi`,
`.d-msg`, `.d-msg-hi`, `.d-lbl`, `.d-num`, `.d-note`, `.d-key`, `.d-band` — and using them is
what makes every diagram in the series read as one hand. Do not introduce new colours.

**Draw a diagram when the argument has a shape**, and not otherwise. The four books have
ten between them, and each one does a job prose could not:

| Kind | What it does | Seen in |
|---|---|---|
| **Space–time** | Lifelines down, messages as arrows. The workhorse: any argument about order, causality or cuts. | The tally, the census |
| **The same picture annotated twice** | Draw one scene, then redraw it with the numbers, then with the vectors. The reader compares like with like. | The tally |
| **Two panels, sound and impossible** | Put the legal case beside the illegal one with a divider. Far clearer than describing the illegal one. | The census, the ring |
| **Commuting diamond** | For any argument that two things may be done in either order. | The camps |
| **A chain of cases** | For arguments that walk from one extreme to another one step at a time. | The camps |

Always give the SVG a real `aria-label` describing what it shows. The caption should state the
*conclusion*, not describe the picture.

---

## Verification, which is not optional

The project has twice recorded things that were false because they were checked by name rather
than by content. Both are documented in `buildings.md`.

- **Confirm the file is the paper.** `pdftotext -q -f 1 -l 2 file.pdf - | head`. Three files in
  `sources/` were the wrong paper, one of them a quantum physics article filed under
  Hellerstein.
- **Confirm every constant and bound against the PDF.** Grep for the theorem and read it.
  Signed-message Byzantine agreement works *for any number of generals*; the widely repeated
  &ldquo;N ≥ m + 2&rdquo; is a remark about when the problem is vacuous. That error was in this
  project's own documents until the paper was opened.
- **Confirm any number you put in prose.** If a book says two places are thirty kilometres
  apart, measure it against `layouts.html`.

---

## Finishing

Before calling a book done:

- [ ] `grep -c '<img'` returns **0**.
- [ ] Every formal argument is inside `<details class="proof">`.
- [ ] The prose stands with every proof closed.
- [ ] Every device in the book appears in the *In the book / In the paper* table.
- [ ] The *must not exist* list is checked against the finished draft.
- [ ] Nothing contradicts a book that shares the setting.
- [ ] Every claim traceable to the paper has been checked against the PDF.
- [ ] Added to `books/index.html`.

---

## The remaining papers

From `buildings.md`, in a suggested order — the first three are self-contained, the later ones
depend on vocabulary the earlier ones establish.

| Building | Paper(s) | Note |
|---|---|---|
| The auditor's court | Herlihy &amp; Wing 1990 | Self-contained. A good next one. |
| The outport offices | Brewer 2000 · Gilbert &amp; Lynch 2002 | Needs the linearizability book first; CAP is stated in terms of it. |
| The beacon line | DLS 1988 | Own ground, own people, ~130 km from the hill. Must not contradict *Mercenaries and Bandits* — see the synchrony split in `settings.md`. |
| The camps *(second book)* | Chandra &amp; Toueg 1996 | Shares the building with FLP. **Must not decide anything** — see the note in `settings.md`. |
| The Part-Time Parliament | Lamport 1998, 2001 | **Not retold.** Lamport's paper in its original form, enhanced with visuals: it is the paper the whole project borrows its allegory from. Listed in the index as *The Part-Time Parliament*, unlinked until our rendition exists. At §3.3.6, where a scribe's error ends the parliament and leads to the island's destruction, the rendition carries a caveat: later books ignore this detail for convenience, and in them the parliament is still sitting. |
| The Odeon, Skene | Oki &amp; Liskov 1988 · Liskov &amp; Cowling 2012 | A genuine alternative to Paxos, on its own island. |
| The Odeon, Skene *(second book)* | Ongaro &amp; Ousterhout 2014 | *The Rehearsal.* Same room as VR; the difference is stage directions. |
| The crown, later in the siege | Castro &amp; Liskov 1999 | *The Standing Orders.* Needs the Byzantine book's vocabulary. The same four bandits, no new cast; the jars can never be restarted together, which is what makes it PBFT. Nothing follows from any order. |
| The Chamber | Chandra, Griesemer &amp; Redstone 2007 | *The Worn Ledgers.* Lamport's own Chamber, reused; must not contradict *The Part-Time Parliament*. |
| The abandoned counting house | Gray 1996 | |
| The stoa and festival ground | Demers 1987 · Saito &amp; Shapiro 2005 | |
| The ring of libraries | Dynamo 2007 · PBS 2012 | |
| The wax scriptorium | Bayou 1995 | |
| The far terraces | Shapiro et al. 2011 (both) | |
| The sorting house | COPS 2011 | |
| The reading room | HATS 2014 | |
| The hall of two doors | Hellerstein 2010 · Ameloot 2011 · Hellerstein &amp; Alvaro 2020 | Draft from the 2020 paper; it is the clearest. |

### Two standing constraints on future books

**The bandits.** On Arche, an unknown number of those writing in the harbour's books do not
follow the harbour's practice. Four rules govern this and all four are load-bearing: no
infiltration ever *happens* (an event would be a plot); no one is ever identified; no motive is
given; and they cannot reach the crown, because the siege severs the road. `layouts.html` has
the full statement. `The Tally and the Column` Chapter VIII shows how to use it — as the
honest-participant assumption made visible, never as a faction.

**Mount Phyle is built.** Its geometry, cast, architecture and panel inventory exist in
`content-i2` and are fixed. Nothing may contradict them: four camps that cannot see each other,
ravens only, no fire or signal below the crown, uncounted nights at the base, and one single
synchronous night on the crown: the jars are started together once, before the posts are first
manned, and since no man may leave his post they are never started together again. The siege
itself may last any number of days; later nights on the crown are not synchronous.
