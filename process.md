# How a paper becomes a book

A working procedure, written so that someone who has not been part of the conversation so far
can pick up the next paper and produce a book that sits beside those already written
without looking like a different series.

**Read first:** `buildings.md` (which paper lives in which building), `settings.md` (the
analysis, the constraints that cannot be broken, and the islands themselves), `reality.md`
(the real Greek precedent for each device, and how close it is), and `hellenistic-reference.html`
(buildings, tools, weapons, dress, transport, town planning and civic procedure of the period, with
measurements for modelling).
**Read as models:** the finished books in `books/`, and their sources in `art/scroll/parts/`.
They are the specification. Where this document and a finished book disagree, the book is right.
**Read before writing a page:** `art/scroll/BRIEF.md`, the authoring guide for the format.

---

## The format

A book is one scroll at `books/<slug>/index.html`. From top to bottom it has a cover; one spread
that states the paper's problem and result in machine terms; a photograph of the setting with the
allegory's premise in two or three sentences; one spread for each idea of the argument; and a
closing spread that returns to machines. Each mechanism has one live interactive: a scroll-driven
stage for a sequence, a click-through widget for a choice. Proofs sit in collapsed panels at the
end of the spread they belong to. Photographs and cards unfold as they enter view.

A page is self-contained. Its source is four parts in `art/scroll/parts/<slug>/` (`meta.json`,
`body.html`, `page.css`, `page.js`); `python3 art/scroll/assemble.py <slug>` copies the shared
`shell.css` and `shell.js` round them and writes the page, and `art/scroll/shot.sh` checks it in
headless Chrome. Never edit a built page by hand. *The Part-Time Parliament* predates the kit, and
its page is edited directly. The pictures a book uses are copied into `books/<slug>/img/`.

Setting pages (`places/<place>/index.html`) and the home page wear the same look. They are
ordinary hand-edited pages that link `art/scroll/shell.css`, `art/scroll/place.css` and
`art/scroll/shell.js`.

Five Paxos books are still in the earlier chapter layout, with `assets/css/books.css`:
*Spreading by Word of Mouth*,
*Probably Up to Date*, *Changes That Never Clash*, *What You Can Promise Alone* and *Knowing When
to Wait*; so is `papers/index.html`. A converted book keeps no copy of its earlier edition; that
is in the git history.

## The two phases

**Phase 1 — text and interactives.** The complete scroll: prose, interactives and proofs, with
whatever pictures already exist (the place shots in `assets/img/places/` at least). A spread
whose picture does not exist yet is written without one; the prose never refers to a picture, so
the book reads as finished.

**Phase 2 — art.** Happens later and separately: the cover and the panels, made from the
book's shots (`art/panels/<slug>/shots.json`) and published to `assets/img/`. A picture enters the
scroll as a `.photo` inside a `.pop`, copied into the book's `img/`. The allegorical devices must
nevertheless be **fully in place in the prose**, because phase 2 is built from what you write.
Never bend the prose to fit a picture.

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
5. **Paxos has names; Arche has numbers.** On Paxos, named figures are Hellenised authors of
   the book's own papers, following Lamport's practice with the Paxon legislators, with ordinary
   Greek names for seats no author fills; a place's figures are told apart by colour (Schedia's
   five legislators). On Arche nobody has a name: a figure is a role or a number, "the keeper of
   House 1's accounts", and the paper's authors are credited on the cover and in the closing panel.
   **The houses, the mercenaries and the bandits have no names or
   emblems; they go by number**: Houses 1–3, the mercenaries by their tents'
   numbers, Number 1 to Number 4, and the bandits Number 1 to Number 4, Number 1 being the chief
   inside the ring wall. Every book at a place keeps that place's numbered cast. Ties between houses are
   broken by number. **Nodes are alike.** No house, tent or post has a direction, landmark or
   character of its own; one is set apart only when the paper gives it a role, as the chief is a
   leader. An example may give one node a part to play (the oil
   board at House 2) without making it a fixture of the place.
6. **Read the paper, not your memory of it.** Open the PDF. Quote the theorem. See
   *Verification* below.
7. **Close with the mapping.** Every book ends with a who-is-who table, the setting on the left
   and the machine room on the right, a plain statement of the result, and a panel with the paper
   and its ideas, so a reader can check the allegory rather than trust it.
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
  the book's most interesting spread is.

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

### 4. Lay out the spreads

The shape that has worked before:

| | |
|---|---|
| **Cover** | The book's opening question, and a one-line answer. |
| **In machine terms** | The paper's problem and result in plain distributed-systems words, with one small interactive that shows the difficulty with machines. |
| **The setting** | A photograph of the place with the premise in two or three sentences. Link the setting page with a superscript; do not describe the place again. |
| **The model** | One spread per device, each built up by an interactive. The reader should not notice they are being handed a formal system. |
| **The results** | One spread per result, each stated in the setting's own words, shown by an interactive, and proved in a collapsed panel. |
| **What it does not say** | What the result does *not* claim, or what it costs, or what it assumes and never verifies. It is often the best spread in a book. |
| **Back to machines** | The who-is-who table, the result in one sentence, then lineage, the papers and the ideas. |

**The book is carried by questions.** Write down the questions a careful reader would ask, in
order, and let them drive the spreads. Each spread answers the question the one before it closed
on, and may end on the next. Inside a spread, raise the reader's objection as a question and
answer it at once: *Does unrelated mean they happened at the same moment? No: it means…* The
questions are the reader's, never a character's, and nothing is narrated, so rule 1 stands. Keep
one line of argument: threads never alternate.

**A spread is short.** A heading, a lede, at most two short paragraphs, and its interactive or
cards. What the earlier editions said in a page of prose, a scroll shows.

**An interactive follows the book's rules exactly.** Work its numbers out in code by those
rules, and make the code refuse a state the rules forbid. Where a page shows a pattern and does
not compute it, the page says so. Nothing runs until the reader presses a button. If the book's
stance is that nobody dies in it, no interactive stages a death: it shows two possible nights
side by side.

A scroll that replaces a chapter edition keeps that edition's chapter anchors
(`<a class="anchor" id="s3"></a>` at the top of the spread that covers the idea), because other
books link to them.

### 5. Register

Plain, specific, unhurried. The voice is a careful antiquarian describing arrangements he has
examined, not a storyteller. Never soften the technical content: the lemmas and bounds appear
in full, in the setting's vocabulary, with the formal statement available alongside.

Concretely:

- Prefer the physical noun to the abstract one. *A boy carries the slip along the quay*, not
  *the message is transmitted*.
- State results as results. Give a result a name a reader can refer back to, as a card's heading
  or a bold line.
- When you first coin a device, set it in bold (never underlined: only links are underlined).
- **Never refer to a part of a book by number or place**, in the prose or in the apparatus. No
  "as Chapter IV showed", no "the fifth spread asked", no "Part Two". Say "as we saw", "below", or
  name the idea ("by Never Two Gates", "the rules of the tally"). A superscript's `title` gives
  the book and the idea's title.
- **Never refer to another volume in the prose.** No "as *Ordering Without Clocks* relates", no
  "the four of *Agreeing Among Liars*", no "the earlier book". A fact established elsewhere is
  restated in this book's own words, as a fact of the island, and linked to the book that
  established it by a superscript:
  `<sup class="xref"><a href="../ordering-without-clocks/index.html#s3" title="Ordering Without Clocks: Breaking Ties">*</a></sup>`,
  placed after the fact. The apparatus may name books: the lineage lines and the closing panels.
- **People are neutral.** A numbered figure or a role is never "he" or "she": repeat the role or
  use "they". Picture `alt` text may describe what the picture shows.
- Say what is *not* claimed, out loud, immediately after saying what is. The gap between a
  theorem and its converse is where readers go wrong, and it is cheap to close in prose.

---

## Proofs: always collapsed, never omitted

Every formal argument goes in a panel at the end of the spread it belongs to:

```html
<details class="proof">
  <summary>Proof · that …</summary>
  <p class="given">The claim in the paper's own notation, with every symbol the steps use.</p>
  <ol class="proofsteps">
    <li>…</li>
    <li>…<span class="qed">∎</span></li>
  </ol>
</details>
```

Rules for the proofs themselves:

- **The page above must stand without it.** A reader who never opens a single panel should
  finish the book understanding the result and why it is true. The panel is for the reader who
  wants it airtight, not for the reader who wants it at all.
- **A panel opens with its `given`.** The page outside the panels never introduces notation, so
  the panel states the claim and defines its symbols before the first step.
- **Prove it in the paper's abstractions, not the setting's.** The proof is the mathematics:
  it uses the paper's own objects and notation (schedules σ₁ and σ₂, sets *A* and *B*,
  configurations, events, messages), and its summary line does too: *Proof · that disjoint
  schedules commute*. The allegory never enters a proof, and mathematical symbols never enter
  the prose or the diagrams (see *Two registers* below).
- **One summary line per proof, naming what is proved.** "Proof · that nothing comes before
  itself", not "Proof of Lemma 1".
- **Where the paper's own proof is long or hard, say so** and give the sketch. *Many Copies,
  Acting as One* does this for the board's proof; *Agreeing Among Liars* does it for the
  three-general impossibility. Honesty about a gap is fine; pretending there is none is not.

### Two registers, never mixed

A book speaks in two registers, and each belongs to its own places.

- **Proofs use the math.** Everything inside `<details class="proof">` is written in the
  paper's abstractions, as the paper states them.
- **Prose, captions, button labels and figures use the allegory.** No σ, no *A* and *B*, no set
  notation, no "process" or "message": tents, ravens, standings, courses, houses, slips. A figure
  labels what the setting's people do (*tents 1 and 2 trade ravens*).
- **Machine words have four places:** the machine-terms spread, the right-hand column of the
  closing table (where the technical term meets the device), the closing statement of the result,
  and the proof panels.

Never blend them: no allegorical figures inside a proof, no Greek letters in a figure or its
caption.

Formal statements that are not proofs (model definitions, conditions, bounds) also go in a
proof-style panel at the end of their spread, titled for what they state ("The round, stated
formally"). The reader meets the model in the open as an interactive, in the setting's words.

---

## Figures

A figure is inline SVG drawn by the page's script, so it can move. Two kinds recur, and using
them is what makes every figure in the series read as one hand. Do not introduce new colours.

**The place from above.** Each setting has one picture, reused wherever something travels there:
Arche with its three houses on the ring road (`Isle`), the hill with its four tents (`Hill`), the
crown with the chief inside the ring wall and three posts on the slopes, the Chamber with its one
door (`Hall`). Copy the picture from a book of the same setting and keep it the same.

**Space-time, in the round.** `Polar` in `shell.js`: each place is a line running outward from
its label, each ring further out is a later moment, and whatever is carried between places is an
arc that curves round and outward. Never flat lifelines. Events stay clear of the label boxes. A
dead man is a cross on a shortened line; a hollow dot is a man who has not committed; a cut is a
dashed loop that carried things may cross outward and never inward.

**Draw a figure when the argument has a shape**, and not otherwise:

| Kind | What it does | Seen in |
|---|---|---|
| **Click two events** | The reader picks two dots and the page says how they are related, lighting the chain between them. Any argument about order or causality. | *Ordering Without Clocks* |
| **The same picture, numbered step by step** | A scroll-driven stage fills in one figure as the reader scrolls. Any protocol with rounds. | *Ordering Without Clocks*, *Taking Stock Without Stopping*, *Agreeing Among Liars* |
| **Two nights side by side** | The legal case beside the illegal one, or two cases nobody inside can tell apart. Far clearer than describing the second. | *The Limits of Agreement*, *Answering While Cut Off* |
| **Either order** | Two runs the reader may press in either order, arriving at the same place. | *The Limits of Agreement* |
| **A row of cases** | The reader settles each case and the page finds where two neighbours split. For arguments that walk from one extreme to the other. | *The Limits of Agreement* |
| **A night by the rules** | A rule engine runs a fresh random night each press. Says on the page that each run differs. | *Agreeing by Chance*, *Telling the Dead from the Slow* |

Give every SVG a real `aria-label` describing what it shows, make every control work from the
keyboard, and put narration in a `.say` line so it is announced. Check each figure at phone
width: anything wordy goes in HTML beside the SVG, not inside it.

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

Before calling a book done (the brief's checklist has the mechanics):

- [ ] `assemble.py` builds the page; `shot.sh` at 500 and 1280 reports equal widths and no
      errors; the page has been looked at, and each scroll-driven stage checked step by step.
- [ ] Every interactive has been pressed through against the paper's rules.
- [ ] Every formal argument is inside `<details class="proof">`, and each opens with its `given`.
- [ ] Proofs use only the paper's abstractions; prose, captions and figures use only the allegory.
- [ ] The page stands with every panel closed.
- [ ] Every device in the book appears in the closing who-is-who table.
- [ ] The *must not exist* list is checked against the finished draft.
- [ ] Nothing contradicts a book that shares the setting.
- [ ] Every claim traceable to the paper has been checked against the PDF.
- [ ] Added to the home page, `index.html`, as a cover card in its section.
- [ ] The place's setting page, `places/<place>/index.html`, lists the book and still
  describes the place truly. Each home-page section opens with its setting page, the brief a
  reader needs before reading that section's books in any order. Its opening picture is a
  photorealistic establishing shot: a Blender previs render put through `pipeline.py scene` with a
  crop of the island plate (`art/refs/places/`) and any people refs on the board, with no comic
  pass. Its other pictures are previs renders. Shots are in `art/panels/places/shots.json`,
  published to `assets/img/places/`.
- [ ] A building that recurs across pictures is modelled in full before any picture is generated
  (the Chamber, the Tholos, Arche's three houses, and on the scholars' coast the libraries, the
  stoa with its festival ground and the far terraces' pebble tables: `art/sets/paxos_chamber.py`,
  `schedia_tholos.py`, `house.py`, `libraries.py`, `stoa.py` and `terraces.py`, on the helpers in
  `masonry.py`: every block, joint, flute, capital, coffer, rafter, door board, tile, paving slab,
  scroll and pebble is geometry), and its scene prompts say so: keep every modelled
  part where it is, give it its real material, add no architecture. The image pass then adds
  only materials, light, people and props, and the building is the same in every picture.

---

## The remaining papers

From `buildings.md`, in a suggested order: later ones depend on vocabulary the earlier ones
establish.

| Building | Paper(s) | Note |
|---|---|---|
| The order board | Herlihy &amp; Wing 1990 | *Many Copies, Acting as One.* Shares the orders premise of *Ordering Without Clocks*: the tallies order orders by slips, this book by the sun. The object is House 3's board of orders, a FIFO queue; Herlios' board with its slots and peg is the paper's §4 queue. Must not give Arche a readable hour in the trading season. Written: `books/many-copies-acting-as-one/`. |
| The camps | Chandra &amp; Toueg 1996 | *Telling the Dead from the Slow.* Shares the camps with FLP. The camps may decide; nothing follows from it. The slate's guarantees are granted, not earned — see `settings.md`. With a majority alive, a turn to propose, not a leader; point to *Agreeing When Messages Run Late* for it and stay on the detector. Written: `books/telling-the-dead-from-the-slow/`. |
| The Part-Time Parliament | Lamport 1998, 2001 | Lamport's own allegory, the one the whole project borrows, retold as a scroll with his Paxons kept. The paper's formal conditions, its proofs and its appendix are carried in panels; the rest of the paper's prose is not reproduced. Written: `books/the-part-time-parliament/`. The paper ends with a scribe's error that destroys the parliament; later books ignore this for convenience, and in them the parliament is still sitting. |
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

A scroll carries its own copies of its pictures in `books/<slug>/img/`. After regenerating a
picture in `assets/img/`, copy it over the book's copy in the same pass.
