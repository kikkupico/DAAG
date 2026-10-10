# Writing a book in the scroll format

A book is one scrolling page at `books/<slug>/index.html`: short allegory prose, photographs that
unfold as they enter view, one live interactive per mechanism, and the proofs in collapsed panels.
It replaces the older long edition (chapters of prose with static figures) completely. Nothing
may be lost that a reader needs: every proof, the references, the lineage lines and every chapter
anchor carry over.

Two finished books are the models. Read both before writing anything:

- `art/scroll/parts/ordering-without-clocks/` (the ring road: houses, messengers, slips)
- `art/scroll/parts/the-limits-of-agreement/` (the foot of the hill: tents, ravens)

## The kit

```
art/scroll/shell.css      shared styles (never edit)
art/scroll/shell.js       shared script (never edit)
art/scroll/assemble.py    python3 art/scroll/assemble.py <slug>   -> books/<slug>/index.html
art/scroll/shot.sh        art/scroll/shot.sh <slug> <width> <out.png>   headless check
art/scroll/parts/<slug>/  meta.json, body.html, page.css, page.js   (what you write)
books/<slug>/img/         the book's pictures (you copy them in)
```

You write the four files in `parts/<slug>/`, run `assemble.py`, and never edit
`books/<slug>/index.html` by hand. Run everything from the repository root.

`shot.sh` prints one line, `PROBE width=<page>/<window> errors=[...]`, and writes a full-page
screenshot. The two widths must be equal (no sideways scroll) and `errors` must be empty. Check
at 500 and at 1280, then **look at the screenshots** (the Read tool shows images; crop tall ones
with PIL first). Also run `node --check` on `page.js`.

## What `shell.js` gives `page.js`

`page.js` runs after `shell.js` in the same function scope, so these are in reach:

| name | what it does |
|---|---|
| `$(sel, root)`, `$$(sel, root)` | querySelector / querySelectorAll as an array |
| `el(tag, attrs, parent)` | make an SVG element |
| `rnd(n)` | random integer 0..n-1 |
| `sleep(ms)` | promise; instant under reduced motion |
| `tween(ms, fn)` | calls `fn(0..1)` eased over `ms`; returns a promise |
| `button(g, label, fn)` | make an SVG group keyboard-operable (tabindex, role, Enter/Space) |
| `scrolly(root, render)` | scroll-driven stage: calls `render(i)` for the step in mid-window |
| `mapPairs(el, pairs)` | the two-column "who is who" table of the closing spread |
| `Polar(svg, opts)` | space-time drawn in the round (see below) |
| `reduce` | true when the reader asked for reduced motion |

Do not declare a top-level `tick`, `io`, `secs`, `now`, `prog`, `dep` or `par`: the shell uses
those names. Wrap each interactive in its own `(function(){ ... })();`.

`Polar(svg, {vb, cx, cy, r0, step, rings, tEnd, nodes, note})` draws rings (later moments further
out), one spoke per place, and a label box per place. `nodes` is `{key: [angleDegrees, "label",
"#fill"]}`. It returns `P` with `P.pt(key, t)`, `P.slip(a, ta, b, tb)` (an arc from place `a` at
time `ta` to place `b` at `tb`, the short way round, with an arrowhead), `P.seg(key, t1, t2)`
(a highlightable stretch of one spoke), `P.event(key, t, fill)` (a dot; returns the `<g>`, with
`g.label` a text node inside it), and the layers `P.under`, `P.slips`, `P.evs`, `P.over`.

Each model book also has its own "place from above" picture (`Isle` for Arche's ring road, `Hill`
for the foot of the hill, `Tholos` for Schedia in *One Leader at a Time*, `Coast` for the scholars'
coast in *Probably Up to Date*). Copy the one for your setting into your `page.js` and keep it the
same, so the series reads as one. The coast books also share a few small parts, copied the same
way: `seg` (a row of choices), tables of pebbles (*Changes That Never Clash*), shelves of what a
library holds, and squares for a coast of many libraries (*Spreading by Word of Mouth*). A crown book draws the crown from above in the same manner: the
ring wall at the centre with the chief inside, three posts out on the slopes.

## The page, top to bottom

Copy the markup from a model's `body.html`. The spreads, in order:

1. **Top bar** (`.bar`): only `← The Books`, the section name (`#now`) and the progress line.
2. **Cover** (`header.spread.dark#cover`): four pieces of text and no more, beside the cover
   picture (`img/cover.jpg`, 3:4). The title alone in the `h1`, with no subtitle. `.generic`:
   the problem and its solution in plain distributed-systems words, two or three sentences, no
   symbols. `.allegory`: the same problem and solution in the setting's words, two or three
   sentences. `.source`: `After <every author by full name>, <i>paper title</i>, <year>`, the
   papers separated by ` · `, as small print.
3. **In machine terms** (`section#machines`): the paper's problem and result in plain
   distributed-systems words, three `.terms` bullets at most, and one small interactive that
   shows the difficulty with machines. Apart from the cover's `.generic` line, this is the only
   spread before the last that may speak of machines.
4. **The setting** (`section#hall`, a `.bleed` photograph with a title card and three `.pin`
   notes): the allegory's premise. It must fit in two or three short sentences.
5. **The argument**, one spread per idea, in the long edition's order. Alternate `light` and
   `dark`; a spread that follows one of the other colour starts with a `.tear` (copy one, and set
   `--prev` to the colour above: `#eae4d4` after dark, `#f6eed6` after light).
6. **Back to machines** (`section#why`): the `.map` table, the `.end` block (one sentence in
   `.big`, a `.lede`, the `.links`), then the `.apparatus`.

Building blocks inside a spread: `.narrow` (kicker, `h2`, `.lede`, a paragraph or two);
`.two` (text beside a `.photo` in a `.pop`); `.cards3` (three `.card3` papers, for rules or
demands); `.paper.well` (an interactive, with an `h4`, the figure, a `.say` line that narrates,
and a `.row` of `.btn` buttons); `.scrolly` inside a `section.has-scrolly` (a sticky `.stage`
and a column of `.step` cards). Everything that unfolds is wrapped
`<div class="pop"><div class="leaf">…</div></div>`.

Give every `section` a `data-name` (shown in the top bar) and an `id`.

## Interactives

- One per mechanism. A sequence of steps is a scroll-driven stage (`scrolly`); a choice the
  reader makes is a click-through widget.
- An interactive must follow the book's rules exactly. Work out numbers by the rules in code
  where you can, instead of typing them in. If the page shows a pattern and does not compute it,
  say so on the page.
- Nothing runs until the reader presses a button, and anything that loops stops when it leaves
  the window (see the night widget in The Limits of Agreement).
- Every button works from the keyboard. Narration lines have class `say` (the shell announces
  them to screen readers).
- Space-time diagrams are drawn in the round with `Polar`: each place a spoke, later moments
  further out, whatever is carried between places an arc. Never flat horizontal lifelines.
  Keep dots clear of the label boxes (first event at `t` about 1.4 or later). A dead man is a
  cross on a shortened spoke; a hollow dot is a man who has not committed.
- Test at 500px: a figure's text must stay readable. Put anything wordy in HTML beside or under
  the SVG, not inside it.

## Proofs

Every `<details class="proof">` of the long edition is carried over, steps verbatim, at the end of
the spread it belongs to (after a scroll-driven stage, put it in a
`<div class="wrap" style="padding-bottom:clamp(4.5rem,11vw,8rem)">` after the `.scrolly`).
A panel opens with `<p class="given">`: the claim stated in the paper's own notation, with any
symbol the steps use defined there, because the page outside the panels never introduces
notation. See the models.

## The closing apparatus

In `.apparatus`, after `.end`: lineage lines as links (`Setting`, `Builds on` if the long edition
has it, `Leads to`), the `Outside this series` line, and a proof-style panel "The paper behind
this book" with the long edition's references and its "ideas" paragraph if it has one.

## Anchors and links

- The long edition's chapters are `<section id="s1">` … `<section id="sN">`. Other books link to
  them. Put `<a class="anchor" id="sN"></a>` as the first thing inside the spread that now covers
  that chapter's idea. Every old `sN` must exist exactly once.
- Link to another book as `../<slug>/index.html`, or `../<slug>/index.html#sN` for one idea.
- A fact the long edition marks with `<sup class="xref">` keeps that superscript link where the
  fact is restated.

## House rules (every one of these has been broken before)

**Two registers, never mixed.** Outside the machine-terms spread, the closing table and the
proof panels, the page speaks only in the allegory's own words: no `<var>`, no Greek letters, no
σ or ⟹, no "process", "message", "node", "protocol", "bivalent", "quorum of servers". Captions,
figure labels and button text count as prose. Inside a proof panel, use the paper's notation.

**The allegory fits in two or three sentences.** Add no device the long edition does not have.
Do not explain the world; the setting page does that.

**Follow the book's stance.** If the long edition says nobody dies in it, no widget stages a
death: show two possible nights side by side instead. If the book leaves a question open, the
page leaves it open.

**The cast goes by number and colour.** Houses are House 1, 2, 3 (H1 `#9cb648`, H2 `#e0b84a`,
H3 `#5b9be0`). Mercenaries go by tent number (T1 ochre `#e0b84a`, T2 deep blue `#6583d6`,
T3 oxblood `#c45448`, T4 olive `#9cb648`). Bandits are numbered separately; bandit 1 is the chief
(B1 purple `#a57fc0`, B2 slate grey `#9aa0a8`, B3 saffron `#e8964d`, B4 chestnut `#b07a55`).
No personal names, no emblems, and nobody is told apart by face, age, build or sex. Use "they"
or repeat the number where the long edition does not give a pronoun.

**On the crown, a liar's motive is never given.** Never say or hint why a bandit lies, and
never reveal which man lied.

**Records are scrolls and wax tablets.** Nothing in the setting is a bound book: no "book",
"ledger", "page", "bookkeeper". "Book" means a book of this series only.

**No measurements.** Places are described by what they allow and forbid, never by distances,
heights or counts of paces.

**No chapter numbers, no references to other volumes in prose.** Restate the fact and link it
with a superscript. Do not write "as an earlier book showed".

**Openers name their subject.** No spread starts with a bare It, They, He or This.

**One current version.** No notes about what changed or what an earlier edition said.

**Plain words.** Short sentences. No rhetorical flourishes, no em-dash asides, no "not X but Y"
for effect.

## Lessons from the books already converted

- **Ids are unique across the whole page.** A `section` id must not equal the id of an `svg` or
  any element `page.js` looks up (`section#nine` and `svg#nine` broke a page). Suffix sections
  (`ninesec`) or figures (`ninesvg`).
- **Every `Isle`, `Hill` or crown figure carries `class="isle-svg fig"`**, or its labels lose
  their styling.
- **On Arche, personal names become roles** (Paxos books keep their named, colour-coded
  figures, as *One Leader at a Time* does). The Arche long editions give the paper's authors Hellenised names
  (Lamportios, Chandyos). The scroll says "the keeper of House 1's accounts", "the keeper of the
  customs rolls". Their old footnote is dropped.
- **Prose stays neutral about people.** No "he", "his", "she" for a numbered figure or a role;
  repeat the role or use "they". `alt` text may describe what the picture shows.
- **Nothing beyond the long edition in the closing lines.** No product names, no claims about
  modern systems that the long edition does not make.
- **A "stated formally" aside or boxed formula of the long edition** goes into a proof-style
  panel at the end of its spread, never into the prose.
- **Machine words are allowed in four places only:** the machine-terms spread, the right-hand
  column of the closing table, the `.end` block of the last spread, and proof panels.
- **Keep it short.** A spread is a heading, a lede, at most two short paragraphs, and its
  interactive or cards. The scroll is a retelling, never the long edition's prose pasted in.
- **Arrowheads on `Polar` slips grow with the stroke width.** Highlight a slip by colour, and
  keep its stroke under 5.
- **`shot.sh` takes a height as its fourth argument.** A long book needs about 34000 at 1280 and
  44000 at 500, or the screenshot is cut off. The tall window shows a scroll-driven stage only
  in its last step: to check the other steps, make a temporary copy of the built page in the
  book's folder that calls your `render(i)` for a fixed `i`, shoot it, and delete it.

## Pictures

Use only pictures that already exist. Never generate an image and never call a paid service.
Copy them into `books/<slug>/img/`:

- the cover: `assets/img/covers/<slug>.jpg` → `img/cover.jpg`
- the book's panels: `assets/img/panels/<slug>/*.jpg`
- place shots: `assets/img/places/` (`ring-road.jpg`, `arche-island.jpg`, `camp.jpg`,
  `mount-phyle.jpg`, `crown.jpg`)

A book with few pictures has fewer photo spreads; do not pad it. Write true `alt` text (look at
the picture first). A picture may disagree with the prose; never bend the prose to fit it.

## Finishing checklist

- [ ] `python3 art/scroll/assemble.py <slug>` runs; `node --check` passes on `page.js`
- [ ] `shot.sh` at 500 and 1280: widths equal, `errors=[]`, screenshots looked at
- [ ] every interactive pressed through in your head against the long edition's rules
- [ ] every proof panel present, steps verbatim, each with a `given`
- [ ] every old `sN` anchor present once; references, lineage and Outside-this-series carried
- [ ] no id used twice on the page
- [ ] grep the body outside proof panels for `<var`, `σ`, `⟹`, `book`, `ledger`, `Chapter`,
      `metre`, ` m ` and personal names
