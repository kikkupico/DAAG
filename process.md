# How a paper becomes a book

A working procedure, written so that someone who has not been part of the conversation so far
can pick up the next paper and produce a book that sits beside those already written
without looking like a different series.

**Read first:** `buildings.md` (which paper lives in which building), `settings.md` (the
analysis, the constraints that cannot be broken, and the islands themselves), `reality.md`
(the real Greek precedent for each device, and how close it is), and `hellenistic-reference.html`
(buildings, tools, weapons, dress, transport, town planning and civic procedure of the period, with
measurements for modelling).
**Read as models:** the finished books in `books/`, and their sources in `scroll/parts/`.
They are the specification. Where this document and a finished book disagree, the book is right.
**Read before writing a page:** `scroll/BRIEF.md`, the authoring guide for the format.

---

## The format

A book is one scroll at `books/<slug>/index.html`. From top to bottom it has a cover; one spread
that states the paper's problem and result in machine terms; a photograph of the setting with the
allegory's premise in two or three sentences; one spread for each idea of the argument; and a
closing spread that returns to machines. Each mechanism has one live interactive: a scroll-driven
stage for a sequence, a click-through widget for a choice. Proofs sit in collapsed panels at the
end of the spread they belong to. Photographs and cards unfold as they enter view.

A page is self-contained. The files to edit are `books/<slug>/index.html`, `style.css` and `script.js`;
`scroll/shot.sh` checks a page in headless Chrome. The four-part sources in `scroll/parts/<slug>/`
(`meta.json`, `body.html`, `page.css`, `page.js`) and `assemble.py` were the original build; the books have
moved on from them, and `cover.py` reports every page as stale, so do not run `assemble.py` over a book.
`meta.json` still holds the words a cover and its card share. The question a book asks, its "We find out by exploring…" line and
its papers are written once, in `meta.json`; the cover and the book's card on the home page both
carry them, and `python3 scroll/cover.py` checks that they agree (`--write` puts them into
the cards). The pictures a book uses are copied into `books/<slug>/img/`.

**Shared code.** Every book in `books/` (not the one-scroll overview) is assembled from shared layers, so a
change made once reaches all of them. Styles load in this order: `assets/css/book.css` (tokens, bar,
spreads, cards, diagrams: what every book has), `assets/css/widgets.css` (hill, camp, table and counter
widgets that several books share), `assets/css/registers.css` (the Allegory | Computing switch and the
computing dress), then the book's own `style.css`, which holds only what is particular to that book.
Scripts load as `assets/js/registers.js`, `assets/js/book.js`, then the book's `script.js`. `book.js`
defines `window.BOOK` with the helpers (`$`, `$$`, `el`, `tween`, `sleep`, `button`, `stepDots`, `scrolly`,
`Polar`, `Lanes`, `Timeline`, `Space`, `redrawOn`) and `BOOK.init()` (pop-ups, the progress bar, the section name, parallax); it also
draws the lineage edges by itself. A script opens with `const {$,$$,reduce,NS,sleep,el,rnd,tween,button,stepDots,scrolly,Polar}=BOOK;`,
`const {isM,dual,vis,dtext,onReg}=REG;`, `BOOK.init();`, and ends with `REG.start();`. Put a rule in the shared
file when three or more books want it; a rule only one book needs stays in its own `style.css`.
The computing cover is drawn, not photographed: `assets/js/covers.js` defines `window.COVERS` with a kit
(`stage`, `T`, `chip`, `node`, `link`, `mid`, `packet`, `lane`, `dot`, `vec`, `bandX`, `rnd32`) on a 520 x 520
dot-grid card, loaded after `book.js`; each book's `script.js` calls `COVERS.draw("#coversvg",(svg,{...})=>{...})`
with the figure that is that paper's signature picture (a lane diagram, a lattice, a field of sites), and the
svg is class `cover-fig`. The same figure is cropped into the spreads it illustrates: an `<svg class="cover-fig" data-crop="x y w h">` inside a `pop m` beside the text, drawn by `COVERS.mount(COVER)`; such a spread drops its `solo` class.
The cover function sits between `/* cover:start */` and `/* cover:end */` in the book's `script.js`.
`python3 scroll/book_covers.py` copies every such block into `assets/js/book-covers.js` as `BOOK_COVERS["<slug>"]`,
which the home page (`index.html`, with `landing.css` and `landing.js`) draws on its book cards in computing; rerun it after changing a cover. The earlier home page is kept as `home-archive.html` and is not published. In computing the home page's cover shows, in place of the chart, a static copy of the family tree from Eighteen Books in One Scroll, which `python3 scroll/home_tree.py` takes from that page in headless Chrome and writes between `<!-- family:start -->` and `<!-- family:end -->`; rerun it after changing the tree.

**Two registers.** A book can be read as allegory or as computing, by a switch in its bar that shares
its choice with the scroll page. Both are always in the page: every paragraph, heading, proof step,
caption and diagram label is written twice, `.i` for the allegory and `.m` for computing, and
`body[data-reg]` shows one. The machine-terms spread does not exist; the computing register says
what it said. Computing uses processes, messages, values 0 and 1, and the paper's terms in proofs;
it never names the setting. Photographs and the who-is-who table are allegory-only. A book links
`assets/css/registers.css` (the switch, and the computing dress taken from the scroll page) and
`assets/js/registers.js` (`window.REG`: `dual` writes the two spans for text built by a script,
`dtext` the two SVG texts, `onReg` runs a hook on a switch, `start` ends the page script). A book's
own script keeps diagrams and live captions in step by writing both registers, never by
re-rendering on a switch. All eighteen books have the switch. The allegory is the default; the computing register shows only when the reader has chosen it.

Setting pages (`places/<place>/index.html`), the home page and `papers/index.html` wear the same
look. They are ordinary hand-edited pages that link `scroll/shell.css`, `scroll/place.css`
and `scroll/shell.js`.

A setting is described by who acts there, what carries word between them and what the word says;
the island and its buildings come second. Every setting page runs in that order: the actors (how
many, alike or not, what each holds, how each may fail), the messenger (timing, loss, order, whether
the sender is known), what the messages say (a table of each book's messages, or the notes of the
one book), and only then the ground, framed by what it rules out. The map of the setting and the
papers lists actors, messengers and messages before the place, and the Reality Checks table lists
characters, props and practices before places and buildings. On the home page each setting's band
leads with its actors, and its setting card gives three lines: Who, Word and Sent.

A setting's title names its actors and their goal, not its place: Three Houses Keeping Order (the
ring road), Four Mercenaries Who Must Agree (the foot of Mount Phyle), Four Bandits Who Must Agree
Though Some Lie (the crown), Part-Time Legislators Passing Laws (the Chamber), A Council of Five
Keeping One Law (Schedia and the Tholos), Libraries That Agree in the End (the scholars' coast) and
Students Asking Which Life to Lead (the oracle at the fork). The place goes in the kicker above the
title. The title is used wherever the setting is named as a setting: its page, the home page, the
overview scroll, the papers index, a book's title, its Setting link and the tooltips on its
superscripts. The URLs keep the place slugs, and prose keeps the place names.

Every book is a scroll. The earlier chapter editions are kept only in the git history.

## The two phases

**Phase 1 — text and interactives.** The complete scroll: prose, interactives and proofs, with
whatever pictures already exist (the place shots in `assets/img/places/` at least). A spread
whose picture does not exist yet is written without one; the prose never refers to a picture, so
the book reads as finished.

**Phase 2 — art.** Happens later and separately. Every picture, the cover among them, starts as a
render of the world model (`world/`; `world/BUILD.md` says how it is built), in three steps, each
its own run:

1. **Shot.** The book's shots are entries in `world/panels/<book>/shots.json`: the island, the
   camera (a world shot from `world/src/shots_arche.py` or `shots_paxos.py`, adjusted or given
   in full), the cast and what they do.
2. **Previs.** `world/panels/previs.py` renders a shot's camera, with no people, to
   `previs-<version>.png`; the version is the hash of the shot's entry, and the image carries that
   entry with the commit it came from, so every picture can be traced to the shot that made it.
3. **Scene.** `world/panels/batch.py` takes a set of previs images, puts the cast in from their
   reference pictures (`world/cast/`) and makes each picture a photograph, keeping the previs's
   camera, buildings and props, in one job through the Batch API at half the price; Nano Banana 2
   at 1K is the default. `world/panels/pipeline.py` makes the same picture at once, for a single
   take. Both read the cast and the prompt from the previs, not from the current shots.

A cover is redrawn as ligne claire afterwards, by itself (`world/panels/comic.py`). The picture is
saved as a JPEG in `assets/img/`, enters the scroll as a `.photo` inside a `.pop`, copied into the
book's `img/`, and is published by `world/web/images.py`. The allegorical devices must
nevertheless be **fully in place in the prose**, because phase 2 is built from what you write.
Never bend the prose to fit a picture.

**Reality checks.** A new setting, or a device added to an existing one (a place, building,
character, prop or practice), gets its entries in `reality.md` and in the *Reality Checks* table on
its setting page, in the same pass as the book. Each entry names a real Greek precedent in
geography, history or literature, with a checkable citation, and says whether it is close, loose,
invented or an anachronism. Mark a citation from memory with a dagger until it has been checked.
Where the setting is wrong for the period, say so; do not defend it.

---

## The eight rules that are not negotiable

These are correctness constraints, not preferences.

1. **Not a story.** No plot, no battle, no outcome. A book is *a setting in which a paper's
   findings are explored*. Nothing is resolved, nobody wins, there is no protagonist and no
   arc. If your draft has a climax, it is wrong.
2. **No fantasy.** No gods, omens, curses or prophecies. Every mechanism is mundane and could
   be built. The one sanctuary on Paxos, the oracle at the fork, is a place where students are told which of two lives their work allows; it is exact and foresees nothing, so it breaks no part of this rule. Where a paper proves an impossibility, the impossibility is a fact about wood,
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
   five legislators). On Arche nobody has a name: a figure is a role or a number, "House 1's
   accountant", and the paper's authors are credited on the cover and in the closing panel.
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
   and computing on the right, a plain statement of the result, and a panel with the paper
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
| **Cover** | Four pieces of text beside the picture: the title; the book's question in machine terms; its "We find out by exploring…" line; and the source papers with their titles and every author, in small print. The last three come from `meta.json`. |
| **Where this book sits** | A spread of its own after the cover: the graph of the book's papers, what each draws on and what it leads to, with the idea that passes along every link. It is built from `papers/lineage.json`, which keeps lineage by paper and records only the reuse of an idea, never an order of reading; a new paper or link is added there (see `scroll/lineage.py`). |
| **In machine terms** | The paper's problem and result in plain distributed-systems words, with one small interactive that shows the difficulty with machines. |
| **The setting** | A photograph of the place with the premise in two or three sentences. Link the setting page with a superscript; do not describe the place again. |
| **The model** | One spread per device, each built up by an interactive. The reader should not notice they are being handed a formal system. |
| **The results** | One spread per result, each stated in the setting's own words, shown by an interactive, and proved in a collapsed panel. |
| **What it does not say** | What the result does *not* claim, or what it costs, or what it assumes and never verifies. It is often the best spread in a book. |
| **The result** | The result in one sentence, then the link to the setting, the papers and the ideas. The Allegory \| Computing switch already shows what each part of the setting stands for, so there is no who-is-who table. |

**The book is carried by questions, written as statements.** Write down the questions a careful
reader would ask, in order, and let them drive the spreads. Each spread answers what the one
before it left open, and ends on a sentence that says what is open now; the next spread's lede
begins by naming it. Inside a spread, meet the reader's objection with a plain sentence and its
reason: *Unrelated does not mean they happened at the same moment. It means neither could have
known of the other.* The prose never asks a question and answers it at once. Nothing is
narrated, so rule 1 stands. Keep one line of argument: threads never alternate.

**A spread reads on into the next.** A heading, a lede, a paragraph or two, its interactive or
cards, and the connecting paragraphs that join them. A card that names a rule holds the rule
alone, and the reason for it stands in the text beside the card. Every sentence carries a
reason, a consequence or a connection; `scroll/BRIEF.md` ("Continuous prose") has the detail.

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
  placed after the fact. The apparatus may name books: the graph of papers at the start and the closing panels.
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
  notation, no "process" or "message": tents, ravens, positions, courses, houses, slips. A figure
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

**Space-time, in the round.** `Polar` in `book.js`: each place is a line running outward from
its label, each ring further out is a later moment, and whatever is carried between places is an
arc that curves round and outward. Never flat lifelines in the allegory. Events stay clear of the label boxes. A
dead man is a cross on a shortened line; a hollow dot is a man who has not committed; a cut is a
dashed loop that carried things may cross outward and never inward.

**Space-time in computing, on lanes.** In the computing register the same picture is drawn by `Lanes`
in `book.js`, in the covers' dress: one lane per process from top to bottom in the order of the nodes,
real time running left to right on a dotted grid, events as dots, messages as straight arrows sloping
right, and an operation as a bar from invocation to response (`op`) shaded down through every lane.
A dead process's lane stops where it died; a cut is a dashed line through each process's record with the
past shaded to its left, and a message crossing it backward is the inconsistent one. `Lanes` answers to
everything `Polar` does (`pt`, `seg`, `slip`, `event`, `arc`, and `r` and `xy`, which find the nearest lane
and the time), so a book draws once for both. `Timeline(svg,opts,draw)` draws in the register being read
and runs `draw(P)` again when the register changes, or a phone crosses the size where the lanes grow 1.6
times larger; `draw` builds the figure from nothing and puts back whatever the reader has chosen. A book
that redraws from scratch each time uses `Space(svg,opts)` for the engine and `redrawOn(fn)`. Write the
computing caption and `data-al-m` for lanes (left to right, arrows), never for the round.

**A place from above, in computing.** A picture of where the processes sit that carries something through time (the
hill with its ravens, Arche's ring road, the crown's rats, the Tholos's runners, the Chamber's messengers, a write and
a read on the coast) keeps its
allegory form, and in computing shows its twin: `Unfold(svg,{nodes,span,slide,clock})` in `book.js` adds a second svg
after it, a timeline that grows as the reader acts. `L.wrap(H)` relays the picture's own mover (`fly`, `road` or `run`),
`state`, `note` and `badge`; a message is an arrow from the moment it is sent, dashed while in transit and solid once it
lands. Everything else is said where it happens: `reset`, `crash(k)` (the lane stops), `down(k,on)` (the lane missing
while the process is stopped), `lose` (the arrow ends at a cross), `cut(k,on)` (the lane hatched while cut off), `step(k)`
and `tick(dt)` (time that passes with nothing flying), `turn(k)` (the name ringed), `mark(k,label)` (a labelled moment
that stays, such as each coin flip or each refusal), and for a scene told step by step `msg(a,b,t0,t1,label,cls)` (t1 null
while in transit; `ln-red` for a marker, `ln-aside` for an outside channel), `land`, `band(t0,t1,label,hot,low)` and
`setT(t)`; a band returned by `band` can be moved, as the coast's partition follows a sliding window. A scroll draws the story so far at a step to each unit of time. Options: `alias` gives a place that is not a
process the lane of whoever stands for it (the podium is its holder), `labels` writes each token's value on its arrow,
`press` makes a process's name a button where the reader presses a place in the picture. Time runs while a message
flies; views read side by side share a clock; an endless run slides, and a process's last state stays at the left edge.
A process's label keeps the moment it last changed. A widget that starts and stops with its picture's visibility watches
the picture's parent, since the hidden one never shows. A picture with no time in it (who sits in which group, which
quorums meet, a sorting) stays as it is in both registers, and so does one that carries something lanes cannot show,
such as the new leader's log beside the Chamber.

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
- [ ] Added to the home page, `index.html`, as a cover card in its section, and `cover.py`
      reports that the card and the cover agree with `meta.json`.
- [ ] The place's setting page, `places/<place>/index.html`, lists the book, adds its row to
  the table of what the messages say, and still describes the place truly. Each home-page section opens with its setting page, the brief a
  reader needs before reading that section's books in any order. Its pictures are renders of the
  world model, the first an establishing shot of the place, published to `assets/img/places/`.
- [ ] A building that recurs across pictures is modelled in full in the world model before it
  appears in any picture (the Chamber, the Tholos, the oracle at the fork, and on the scholars' coast
  the libraries with their reading-room desks and pebble boards, the stoa with its festival ground and the
  courier landing in `world/src/blib/paxos_bld.py`; Arche's three houses and the harbours in
  `buildings.py`; the camps and the crown in `mountain.py`). Every block, joint, flute, capital,
  rafter, door board, tile, paving slab, scroll and pebble is geometry, so the building is the same
  in every picture.
- [ ] The book is on Eighteen Books in One Scroll, `books/eighteen-books-in-one-scroll/`: every
  book in one long page, each drawn on one round as the book it grows from with one change in red.
  A new book adds, in the page's `index.html`, a change card (`card eq`: the parent, the change in
  both registers, the child) and a book card (`card book`: a punch line and a paragraph in each
  register, the link to the book, and its papers with their authors at the foot, copied from
  `papers/index.html`); in its `script.js`, a scene in the round (`def`, or `grow` from the parent's
  scene, with the change marked `c: 1`), its place in the family (`B`, `KIDS` and `LAY` in the
  family tree), and its key in every `THREAD` that it uses. A scene is written once, in the round's
  terms; in computing the page draws it on lanes (`LN` in its `script.js`): positions on a spoke become
  positions on a lane, arcs straight arrows, rings upright lines, a cut a line with the past to its left,
  and a point given as x and y inside the round goes to the lane nearest its angle (captions above or below
  the round stay put, at the top or foot of the card). The card is as tall as its lanes need: short for three, nearly square for five, easing between sizes when the cast changes. The family tree, with its threads, opens the page, before the first island.

---

## The papers after the first books

From `buildings.md`. Each row says what its book carries and what it must not contradict. A later
book depends on vocabulary an earlier one establishes.

| Building | Paper(s) | Note |
|---|---|---|
| The request board | Herlihy &amp; Wing 1990 | *Many Copies, Acting as One.* Shares the requests premise of *Ordering Without Clocks*: the tallies put requests in sequence by slips, this book by the sun. The object is House 3's board of requests, a FIFO queue; House 3's board with its slots and peg is the paper's §4 queue. Must not give Arche a readable hour in the trading season. Written: `books/many-copies-acting-as-one/`. |
| The camps | Chandra &amp; Toueg 1996 | *Telling the Dead from the Slow.* Shares the camps with FLP. The camps may decide; nothing follows from it. The slate's guarantees are granted, not earned — see `settings.md`. With a majority alive, a turn to propose, not a leader; point to *Agreeing When Messages Run Late* for it and stay on the detector. Written: `books/telling-the-dead-from-the-slow/`. |
| The Part-Time Parliament | Lamport 1998, 2001 | Lamport's own allegory, the one the whole project borrows, retold as a scroll with his Paxons kept. The paper's formal conditions, its proofs and its appendix are carried in panels; the rest of the paper's prose is not reproduced. Written: `books/the-part-time-parliament/`. The paper ends with a scribe's error that destroys the parliament; later books ignore this for convenience, and in them the parliament is still sitting. |
| The Tholos, Schedia | Oki &amp; Liskov 1988 | *One Leader at a Time.* VR, a genuine alternative to Paxos, found independently and published first, in Schedia, the city on Paxos's eastern arm with laws of its own. One council of five and one law scroll; the paper's transactions are stated, not carried. Written: `books/one-leader-at-a-time/`. |
| The crown | Castro &amp; Liskov 1999 | *Keeping Order Among Liars.* Needs the vocabulary of *Agreeing Among Liars* and must not contradict it. A later, windy night: the loot scroll, each man both replica and client (the client's rule of two agreeing seals, f + 1, stated and shown redundant for the four), the chief's job numbering entries and passing in a fixed order when suspected. Safe in any wind; progress once the wind drops. Nothing follows from any entry. Written: `books/keeping-order-among-liars/`. |
| The crown | Yin et al. 2019 (HotStuff) | *Changing Leaders Among Liars.* Needs the vocabulary of *Keeping Order Among Liars* and must not contradict it. Tell only what changes: the chief's job passes with every entry, and its registrar bundles the others' seals instead of every man writing to every other. Say plainly that a threshold signature makes the bundle one seal's size. Nothing follows from any entry. Written: `books/changing-leaders-among-liars/`. |
| The stoa and festival ground | Demers 1987 | *Spreading by Word of Mouth.* Letters to everyone, the festival and the telling in the stoa, each covering what the other misses; a withdrawal travels as a notice. Nobody is in charge and no library records what another holds. Written: `books/spreading-by-word-of-mouth/`. |
| The libraries | PBS 2012 | *Probably Up to Date.* The model, not a store: how likely a reader who asks only a few libraries is handed an out-of-date copy, and by how much. Odds, never a promise. Written: `books/probably-up-to-date/`. |
| The pebble boards | Shapiro et al. 2011 (both) | *Changes That Never Clash.* The compendium merged part by part: the comet's entry, its count of sightings on a board of pebbles with a column to each library (white for sightings recorded, black for sightings struck, merged by the larger pile), its account kept by the later tally or both side by side, its cross-references and the compendium's headings with a tag for every writing. No library can keep the count from falling below nothing from its own board; striking only what it recorded itself (escrow) can. A reference to a withdrawn heading is what parts merged separately cannot prevent. Written: `books/changes-that-never-clash/`. |
| The reading room | HATS 2014 | *What You Can Promise Alone.* What a librarian can promise while the couriers are stopped, and what no librarian alone can. Written: `books/what-you-can-promise-alone/`. |
| The oracle at the fork | Hellerstein 2010 · Ameloot 2011 · Hellerstein &amp; Alvaro 2020 | *Knowing When to Wait.* Drafted from the 2020 paper, the clearest of the three, with the definitions and the proof from Ameloot et al. The oracle counsels and never rules. Written: `books/knowing-when-to-wait/`. |

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
model's own documents (`world/world-prompt.md`, `world/buildings.md`, `world/reality.md`) into the
model, and from the model to every picture. A change is made once, in the documents and then in the
model's scripts, and committed.

1. Rebuild and render everything: `sh world/src/build_all.sh` (`preview` first to look). No picture
   is made any other way, so none can be left behind by the change.
2. Look at the renders, and save each changed one over its JPEG in `assets/img/`.
3. `python3 world/web/images.py`: a re-rendered picture gets a new name on the bucket, and the
   pages are pointed at it.

Write a settled rule into `world/world-prompt.md`.

A scroll carries its own copies of its pictures in `books/<slug>/img/`. After regenerating a
picture in `assets/img/`, copy it over the book's copy in the same pass.
