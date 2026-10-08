# How a paper becomes a book

A working procedure, written so that someone who has not been part of the conversation so far
can pick up the next paper and produce a book that sits beside those already written
without looking like a different series.

**Read first:** `buildings.md` (which paper lives in which building), `settings.md` (the
analysis, the constraints that cannot be broken, and the islands themselves), `reality.md`
(the real Greek precedent for each device, and how close it is), and `hellenistic-reference.html`
(buildings, tools, weapons, dress, transport, town planning and civic procedure of the period, with
measurements for modelling).
**Read as models:** the finished books in `books/`. They are the specification. Where
this document and a finished book disagree, the book is right.

---

## The two phases

**Phase 1 — text.** Complete prose, with SVG or HTML diagrams where a diagram carries the
argument better than a sentence. Every formal argument in a collapsed section. **No image
tags.** Where a picture is planned, leave a slot that describes it:

```html
<figure class="panel"><div class="planned"><span class="lbl">Planned picture</span>
  <p>What the picture shows: place, time of day, figures by colour, props.</p></div></figure>
```

and on the cover, `<div class="frame-cover portrait planned">` with the label *Planned cover*.
The prose never refers to a picture, so the book reads as finished with every slot left empty.

**Phase 2 — art.** Happens later, separately, from the slots' descriptions. It replaces each slot
with the picture. The allegorical devices must nevertheless be **fully in place in the prose**,
because phase 2 will be built from what you write.

**Reality checks.** A new setting, or a device added to an existing one (a place, building,
character, prop or practice), gets its entries in `reality.md` and in the *Reality Checks* table on
its setting page, in the same pass as the book. Each entry names a real Greek precedent in
geography, history or literature, with a checkable citation, and says whether it is close, loose,
invented or an anachronism. Mark a citation from memory with a dagger until it has been checked.
Where the setting is wrong for the period, say so; do not defend it.

---

## The seven rules that are not negotiable

These are correctness constraints, not preferences.

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
   ordinary Greek name. **On Arche the houses, the mercenaries and the bandits have no names or
   emblems; they go by number**: Houses 1–3, the mercenaries by their tents'
   numbers, Number 1 to Number 4, and the bandits Number 1 to Number 4, Number 1 being the chief
   inside the ring wall. Every book at a place keeps that place's numbered cast. Ties between houses are
   broken by number. **Nodes are alike.** No house, tent or post has a direction, landmark or
   character of its own; one is set apart only when the paper gives it a role, as the chief is a
   leader. An example may give one node a part to play (the oil
   board at House 2) without making it a fixture of the place.
6. **Read the paper, not your memory of it.** Open the PDF. Quote the theorem. See
   *Verification* below.
7. **Close with the mapping.** Every book ends with an *In the book / In the paper* table and
   a plain-prose statement of the ideas, so a reader can check the allegory rather than trust
   it.
8. **Records are scrolls and tablets.** Nothing in the setting is a bound book. Lasting
   records (the houses' accounts, the loot scroll, a legislator's scroll) are papyrus scrolls,
   written in columns and added to at the end; temporary ones are wax tablets or slips of
   papyrus. The word *book* in prose names a book of this series, never an object in the setting.

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
  ones do work — the sandglasses on the crown *are* the synchronous round; the slate's chalk mark *is*
  the indistinguishability of a crash from a delay.

Then write the **must not exist** list: the things that would be natural to add and would
wreck the model. For the camps book it includes horns, fires and any counted night. For a
gossip book it would include anything resembling an assembly.

### 4. Draft the chapters

The shape that has worked before:

| | |
|---|---|
| **I** | The problem, set in the place. Gloss the place in a sentence or two and link its setting article (`places/<place>/`) with a superscript; do not describe it again. State the paper's model in the setting's words, and the one thing this book changes. |
| **II–III** | The model, built up one device at a time. The reader should not notice they are being handed a formal system. |
| **IV–VII** | The paper's results, one per chapter, each stated in the setting's own vocabulary and then proved in a collapsed section. |
| **VIII** | What the result does *not* say, or what it costs, or what it assumes and never verifies. It is often the best chapter in a book. |
| **IX** | *In the book / In the paper*, then the ideas plainly. |

**The book is carried by questions.** Write down the questions a careful reader would ask, in
order, and let them drive the chapters. Each chapter answers the question the one before it closed
on, and ends on the next question, in a paragraph of its own:
`<p class="hook"><em>…</em></p>`. Inside a chapter, raise the reader's objection as a question and
answer it at once: *Does unrelated mean they happened at the same moment? No: it means…* The
questions are the reader's, never a character's, and nothing is narrated, so rule 1 stands. Keep
one line of argument: every hook is answered in the chapters that follow, and threads never
alternate. *Ordering Without Clocks* and
*The Limits of Agreement* are the models.

### 5. Register

Plain, specific, unhurried. The voice is a careful antiquarian describing arrangements he has
examined, not a storyteller. Never soften the technical content: the lemmas and bounds appear
in full, in the setting's vocabulary, with the formal statement available alongside.

Concretely:

- Prefer the physical noun to the abstract one. *A boy carries the slip along the quay*, not
  *the message is transmitted*.
- State results as results. Use `<div class="result"><span class="name">…</span>` and give the
  result a name a reader can refer back to.
- When you first coin a device, mark it with `<span class="coin">` (bold, never underlined:
  only links are underlined). Node labels such as *House 1* or *Number 2* take the same mark where
  they are introduced.
- **Never refer to a chapter by its number or place**, in the prose or in the apparatus. No "as
  Chapter IV showed", no "the fifth chapter asked", no "Part Two". Say "as we saw", "below", or
  name the idea ("by Never Two Gates", "the rules of the tally"). Chapter headings and the table
  of contents carry the numbers; a superscript's `title` gives the book and the chapter's title.
- **Never refer to another volume in the prose.** No "as *Ordering Without Clocks* relates", no
  "the four of *Agreeing Among Liars*", no "the earlier book". A fact established elsewhere is
  restated in this book's own words, as a fact of the island, and linked to the book that
  established it by a superscript:
  `<sup class="xref"><a href="../ordering-without-clocks/index.html#s3" title="Ordering Without Clocks: Breaking Ties">*</a></sup>`,
  placed after the fact. The apparatus may name books: the lineage lines, the *In the book / In the
  paper* table, and the footnotes.
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
- **Prove it in the paper's abstractions, not the setting's.** The proof is the mathematics:
  it uses the paper's own objects and notation (schedules σ₁ and σ₂, sets *A* and *B*,
  configurations, events, messages), and its summary line does too: *Proof — that disjoint
  schedules commute*. The allegory never enters a proof, and mathematical symbols never enter
  the prose or the diagrams (see *Two registers* below).
- **One summary line per proof, naming what is proved.** &ldquo;Proof — that nothing comes
  before itself&rdquo;, not &ldquo;Proof of Lemma 1&rdquo;.
- **Where the paper's own proof is long or hard, say so** and give the sketch. *Many Copies,
  Acting as One* does this for the board's proof; *Agreeing Among Liars* does it for the
  three-general impossibility. Honesty about a gap is fine; pretending there is none is not.

### Two registers, never mixed

A book speaks in two registers, and each belongs to its own places.

- **Proofs use the math.** Everything inside `<details class="proof">` is written in the
  paper's abstractions, as the paper states them.
- **Prose, tables' plain-language column, captions and diagrams use the allegory.** No σ, no
  *A* and *B*, no set notation: tents, ravens, standings, courses, houses, slips. A diagram
  labels what the setting's people do (*tents 1 and 2 trade ravens*), and the *In the paper*
  column of the closing table is where the technical term meets the device.

Never blend them: no allegorical figures inside a proof, no Greek letters in a figure or its
caption.

Formal statements that are not proofs — model definitions, conditions, bounds — go inline in
`<div class="aside-formal">` or `<div class="mathblock">`, *not* collapsed. The reader should
meet the model in the open and only the argument behind a door.

---

## Diagrams

Inline SVG, in `<figure class="diagram"><div class="board">…</div><figcaption>…</figcaption>`.
The primitives are defined in `assets/css/books.css` — `.d-lifeline`, `.d-ev`, `.d-ev-hi`,
`.d-msg`, `.d-msg-hi`, `.d-lbl`, `.d-num`, `.d-note`, `.d-key`, `.d-band` — and using them is
what makes every diagram in the series read as one hand. Do not introduce new colours.

**Draw a diagram when the argument has a shape**, and not otherwise. The finished books
have many between them, and each one does a job prose could not:

| Kind | What it does | Seen in |
|---|---|---|
| **Space–time** | Lifelines down, messages as arrows. The workhorse: any argument about order, causality or cuts. | *Ordering Without Clocks*, *Taking Stock Without Stopping* |
| **The same picture annotated twice** | Draw one scene, then redraw it with the numbers, then with the vectors. The reader compares like with like. | *Ordering Without Clocks* |
| **Two panels, sound and impossible** | Put the legal case beside the illegal one with a divider. Far clearer than describing the illegal one. | *Taking Stock Without Stopping*, *Answering While Cut Off* |
| **Commuting diamond** | For any argument that two things may be done in either order. | *The Limits of Agreement* |
| **A chain of cases** | For arguments that walk from one extreme to another one step at a time. | *The Limits of Agreement* |

Always give the SVG a real `aria-label` describing what it shows. The caption should state the
*conclusion*, not describe the picture.

---

## Verification, which is not optional

Check things by content, never by name.

- **Confirm the file is the paper.** `pdftotext -q -f 1 -l 2 file.pdf - | head`. A file can
  carry the right name and hold the wrong paper; `buildings.md` lists the known traps.
- **Confirm every constant and bound against the PDF.** Grep for the theorem and read it.
  Signed-message Byzantine agreement works *for any number of generals*; the widely repeated
  &ldquo;N ≥ m + 2&rdquo; is a remark about when the problem is vacuous.
- **Confirm any number you put in prose.** Places carry no dimensions: no island's width, no
  hill's height, no distance in kilometres. The settings fix constraints (the massif blocks every
  line of sight; no messenger overtakes another), never measurements, so the pictures can't
  contradict them.

---

## Finishing

Before calling a book done:

- [ ] `grep -c '<img'` returns **0**.
- [ ] Every formal argument is inside `<details class="proof">`.
- [ ] Proofs use only the paper's abstractions; prose, captions and diagrams use only the allegory.
- [ ] The prose stands with every proof closed.
- [ ] Every device in the book appears in the *In the book / In the paper* table.
- [ ] The *must not exist* list is checked against the finished draft.
- [ ] Nothing contradicts a book that shares the setting.
- [ ] Every claim traceable to the paper has been checked against the PDF.
- [ ] Added to the home page, `index.html`.
- [ ] The place's setting article, `places/<place>/index.html`, lists the book and still
  describes the place truly. Each home-page section opens with its setting article, the brief a
  reader needs before reading that section's books in any order. Its opening picture is a
  photorealistic establishing shot: a Blender previs render put through `pipeline.py scene` with a
  crop of the island plate (`art/refs/places/`) and any people refs on the board, with no comic
  pass. Its other pictures are previs renders. Shots are in `art/panels/places/shots.json`,
  published to `assets/img/places/`.

---

## The remaining papers

From `buildings.md`, in a suggested order: later ones depend on vocabulary the earlier ones
establish.

| Building | Paper(s) | Note |
|---|---|---|
| The order board | Herlihy &amp; Wing 1990 | *Many Copies, Acting as One.* Shares the orders premise of *Ordering Without Clocks*: the tallies order orders by slips, this book by the sun. The object is House 3's board of orders, a FIFO queue; Herlios' board with its slots and peg is the paper's §4 queue. Must not give Arche a readable hour in the trading season. Written: `books/many-copies-acting-as-one/`. |
| The camps | Chandra &amp; Toueg 1996 | *Telling the Dead from the Slow.* Shares the camps with FLP. The camps may decide; nothing follows from it. The slate's guarantees are granted, not earned — see `settings.md`. With a majority alive, a turn to propose, not a leader; point to *Agreeing When Messages Run Late* for it and stay on the detector. Written: `books/telling-the-dead-from-the-slow/`. |
| The Part-Time Parliament | Lamport 1998, 2001 | **Not retold.** Lamport's paper in its original form, with interactive figures and no illustrations: it is the paper the whole project borrows its allegory from. Written: `books/the-part-time-parliament/`. At §3.3.6, where a scribe's error ends the parliament and leads to the island's destruction, the rendition carries a caveat: later books ignore this detail for convenience, and in them the parliament is still sitting. |
| The Tholos, Schedia | Oki &amp; Liskov 1988 | *One Leader at a Time.* VR, a genuine alternative to Paxos, found independently and published first, in Schedia, the city on Paxos's eastern arm with laws of its own. One council of five and one law scroll; the paper's transactions are stated, not carried. Written: `books/one-leader-at-a-time/`. |
| The crown | Castro &amp; Liskov 1999 | *Keeping Order Among Liars.* Needs the vocabulary of *Agreeing Among Liars* and must not contradict it. A later, windy night: the loot scroll, each man both replica and client (the client's rule of two agreeing seals, f + 1, stated and shown redundant for the four), the chief's job numbering entries and passing in a fixed order when suspected. Safe in any wind; progress once the wind drops. Nothing follows from any entry. Written: `books/keeping-order-among-liars/`. |
| The crown | Yin et al. 2019 (HotStuff) | *Changing Leaders Among Liars.* Needs the vocabulary of *Keeping Order Among Liars* and must not contradict it. Tell only what changes: the chief's job passes with every entry, and its holder bundles the others' seals instead of every man writing to every other. Say plainly that a threshold signature makes the bundle one seal's size. Nothing follows from any entry. Written: `books/changing-leaders-among-liars/`. |
| The stoa and festival ground | Demers 1987 | |
| The libraries | PBS 2012 | *Probably Up to Date.* The model, not a store: how likely a reader who asks only a few libraries is handed an out-of-date copy, and by how much. |
| The far terraces | Shapiro et al. 2011 (both) | |
| The reading room | HATS 2014 | *What You Can Promise Alone.* What a librarian can promise while the couriers are stopped, and what no librarian alone can. |
| The hall of two doors | Hellerstein 2010 · Ameloot 2011 · Hellerstein &amp; Alvaro 2020 | Draft from the 2020 paper; it is the clearest. |

### Standing constraints on future books

**The bandits.** On Arche, an unknown number of those writing in the houses' account scrolls do not
follow the houses' practice. Four rules govern this and all four are load-bearing: no
infiltration ever *happens* (an event would be a plot); no one is ever identified; no motive is
given; and no one can tell whether they belong to the band on the crown. No ring-road book uses it yet. A book that does uses it only as the honest-participant
assumption made visible, never as a faction.

**What the rest of Arche knows about the bandits.** Only the bandits know how many of them
there are, which band each belongs to, and what they plan. Everyone else knows two things:
there are bandits about the island, and their loot is on the hilltop. The crown's four, in turn,
know the camps are below and nothing of what the mercenaries mean to do. So the constraints that
govern the bandits inside the crown's books — four men on the crown, the sandglasses, who may
lie — bind only those books. Another book need not respect them; it must only not contradict
those two facts. The crown's four are not confined (they stay because the loot cannot be
left), and bandits met elsewhere need not be of their band; no one outside can tell.

**Mount Phyle is built.** Its geometry, cast and architecture are fixed by *The Limits of
Agreement* (the foot), *Agreeing Among Liars* (the crown) and `buildings.md`. Nothing may contradict them: four camps that cannot see each other,
ravens below and rats on the crown, a small sealed ring wall on the crown holding the chief and the loot with the other three men at posts out on the slopes, no pair in sight of another, no fire or signal below the crown, and one single synchronous night on the crown: the
sandglasses there are turned together once, before the posts are first manned, and since no man
may leave his post they are never turned together again. The siege itself may last any number of
days. On later nights a wind can blow over the whole hill and keep the camps' ravens and the crown's rats from moving for as long as it
blows; it always drops in the end. The camps have no common moment but one: on the windy nights of
*Agreeing When Messages Run Late* each man turned his glass as the last light left the crown, which
every tent sees and no post on the crown does.

---

## The scroll format

A book is one scroll at `books/<slug>/index.html`: short allegory prose, photoreal scenes that unfold as they enter view, one live interactive per mechanism (a scroll-driven stage for a sequence, a click-through widget for a choice), and the proofs as collapsed panels in the paper's own notation. The registers are unchanged: the synopsis in machine terms first, then allegory only. A page is self-contained and keeps its pictures in the book's own `img/`.

`art/scroll/BRIEF.md` is the authoring guide: the kit (`shell.css`, `shell.js`, `assemble.py`, `shot.sh`), the page from top to bottom, and the house rules. A book's source is its four parts in `art/scroll/parts/<slug>/`; `python3 art/scroll/assemble.py <slug>` builds the page. The Part-Time Parliament predates the kit and its page is edited directly.

A scroll keeps the chapter anchors of the long edition it replaced (`<a class="anchor" id="s3">`), so a link from another book to one idea is still `../<slug>/index.html#s3`. The long editions are not kept beside the scrolls; they are in the git history.

## Changing art direction

Art direction flows from the Hellenistic reference (`hellenistic-reference.html`) through the world
guides, the book guides and the books to the images. `art/direction/decisions.json` lists each decision
with the reference section it comes from, the words that betray it in a file or a prompt, and the commit
it stands at (`since`). Everything is tied to git: each node in the tree carries its last commit and how
many commits it is behind, and an image, which git does not track, carries the commit it was built at.

1. `python3 art/direction/tree.py impact <decision-id | file | regex>`: what mentions it, what lies
   downstream, the images to regenerate and their cost.
2. Make the change and commit it.
3. `tree.py touch <decision-id>`: the decision now stands at HEAD, and everything older that it touches
   is stale. Commit `decisions.json`.
4. `tree.py stale` lists what is still behind. After regenerating images, `tree.py stamp <paths>`
   records the commit they were built at.
5. `tree.py review` lists decisions whose lines changed in the reference or the guides after they were
   last touched; `tree.py log <id>` shows that history. `tree.py build` refreshes `art/direction/TREE.md`.

Add a decision when a new rule is settled.
