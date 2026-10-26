# Art direction tree

Built by `python3 art/direction/tree.py build`. Layers run from the historic reference down to the images; each art decision lists what mentions it (direct) and what lies downstream of those (inherited). Each decision stands at a commit (`since`); stale means older than that commit. `review` marks a decision whose lines changed in git after it was last touched.

| Layer | Nodes |
|---|---|
| 0 reference | 31 |
| 1 world guide | 11 |
| 2 book guide | 3 |
| 3 book | 19 |
| 4 spec | 126 |
| 5 image | 85 |

## Reference, decisions and blast radius

- **1 Overview and chronology** (`hellenistic-reference.html#overview`)
  - `no-people-on-plates` Island plates and terrain plates show habitation only through objects: no people, no animals
    - stands at - · last guide change 14a9c07 (2026-09-27) One Leader at a Time: Schedia is governed from the Tholos, a rotunda like the Chamber with a podium at its centre; the law kept in wax
    - direct: 1 world guide · 18 spec · 17 image
    - inherited: none
- **2 Buildings: stone orders, tiled roofs and civic ensembles** (`hellenistic-reference.html#buildings`)
  - `chamber-conical-roof` The Chamber is a Greek round hall: a Doric peristyle round the drum, one conical roof of pan and cover tiles on timber rafters held up by six columns inside, a small lantern at the apex
    - stands at 0754785 (2026-10-02) · last guide change c8f8f62 (2026-10-09) Setting pages in the scroll look: cover with the establishing shot, torn-edge spreads, the setting-and-papers pairs, reality checks as a paper table, the books set there as cover cards · **REVIEW**
    - direct: 5 world guide · 1 book · 6 spec · 2 image
    - inherited: 1 book · 16 spec · 16 image
    - stale: 2 spec (behind 0754785)
  - `courtyard-houses` Houses are plastered rubble, blind to the street, open onto a court or portico
    - stands at - · last guide change c8f8f62 (2026-10-09) Setting pages in the scroll look: cover with the establishing shot, torn-edge spreads, the setting-and-papers pairs, reality checks as a paper table, the books set there as cover cards
    - direct: 5 world guide · 5 spec · 1 image
    - inherited: 4 book · 19 spec · 19 image
  - `pan-and-cover-roofs` Roofs are flat terracotta pan tiles under narrow cover tiles, with eave-end tiles
    - stands at - · last guide change 71cb687 (2026-10-03) The Part-Time Parliament: cover and p01-scrolls are photoreal on the new Chamber; inner columns canon is Corinthian (Epidaurus), in reality checks, setting page and world prompt
    - direct: 4 world guide · 15 spec · 9 image
    - inherited: 3 book · 7 spec · 7 image
  - `retired-dome` RETIRED: the stone dome, coffers and oculus of the old Chamber · RETIRED wording, fix leftovers
    - stands at 0754785 (2026-10-02) · last guide change b95df47 (2026-10-09) Arche's houses modelled in full on the shared mason's kit: a rubble base stone by stone, framed doorways with boarded leaves, barred windows, both roofs tile by tile, the portico's plain columns of drums on flagstones under a stone architrave and timber rafters, and the board of orders slot by slot with its peg; the five close shots' prompts keep the modelled house · **REVIEW**
    - direct: 3 world guide · 1 book guide · 7 spec · 3 image
    - inherited: 2 book · 16 spec · 16 image
    - stale: 2 spec (behind 0754785)
  - `unbased-doric` Doric columns have no bases and stand on the paving
    - stands at - · last guide change c8f8f62 (2026-10-09) Setting pages in the scroll look: cover with the establishing shot, torn-edge spreads, the setting-and-papers pairs, reality checks as a paper table, the books set there as cover cards
    - direct: 5 world guide · 8 spec · 11 image
    - inherited: 5 book · 30 spec · 20 image
- **3 Town planning: grids, terraces, harbours and countryside** (`hellenistic-reference.html#town`)
  - `crown-citadel` The crown is a small solid ruined dry-stone ring wall; the posts are hollows among crags
    - stands at - · last guide change 150e256 (2026-10-09) Docs describe the scroll format: process.md's format, phases, spreads, register, proof panels with a given, figures and finishing checklist; plans point at the brief
    - direct: 6 world guide · 1 book guide · 11 book · 15 spec · 12 image
    - inherited: 16 spec · 15 image
  - `ring-road-plan` One cliff road with a lane each way joins terraced harbour towns; agora and stoa frame the quay
    - stands at - · last guide change 9c5de84 (2026-10-09) Schedia's runners are young men, not boys: the reference sheet, the four runner pictures of One Leader at a Time, and the wording in the settings, reality checks, place page, prompts and alt texts
    - direct: 11 world guide · 3 book guide · 9 book · 31 spec · 20 image
    - inherited: 10 book · 58 spec · 56 image
- **4 Tools and crafts: from quarry to kitchen** (`hellenistic-reference.html#tools`)
  - `retired-bound-books` RETIRED wording: loot book, law book, ledger, leather-bound · RETIRED wording, fix leftovers
    - stands at 9376ef3 (2026-10-02) · last guide change 9376ef3 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 2 book · 2 spec · 11 image
    - inherited: 16 spec · 6 image
    - stale: 1 image (behind 9376ef3)
  - `sandglass-timers` Four men start together by turning a sandglass (a deliberate anachronism for narrative convenience; the Greek timer was the water clock)
    - stands at - · last guide change c8f8f62 (2026-10-09) Setting pages in the scroll look: cover with the establishing shot, torn-edge spreads, the setting-and-papers pairs, reality checks as a paper table, the books set there as cover cards
    - direct: 5 world guide · 2 book guide · 6 book · 5 spec · 12 image
    - inherited: 3 book · 25 spec · 15 image
  - `scrolls-not-bound-books` In-world records are papyrus scrolls and wax tablets; no codex or bound ledger
    - stands at 9376ef3 (2026-10-02) · last guide change 86b764b (2026-10-09) One Leader at a Time in the scroll format: the Tholos from above, a law passing on the second word back, board and line, a change of board as a scroll-driven stage, when a board may form with tablets lost, the holder on the porch, wax and stone; docs: Paxos keeps its names, five Paxos books remain in chapters · **REVIEW**
    - direct: 11 world guide · 3 book guide · 16 book · 36 spec · 35 image
    - inherited: 3 book · 46 spec · 42 image
    - stale: 3 image (behind 9376ef3)
- **5 Weapons and war: pike, oval shield, torsion engine and ram** (`hellenistic-reference.html#weapons`)
  - `camp-kit` A mercenary's camp is one linen tent, a plain shield, a chest and a wicker basket
    - stands at - · last guide change 150e256 (2026-10-09) Docs describe the scroll format: process.md's format, phases, spreads, register, proof panels with a given, figures and finishing checklist; plans point at the brief
    - direct: 7 world guide · 2 book guide · 9 book · 14 spec · 14 image
    - inherited: 3 book · 18 spec · 16 image
- **6 Clothing: draped wool and linen, hats and hair** (`hellenistic-reference.html#clothing`)
  - `cast-by-colour` Same-kind figures differ only by clothing colour
    - stands at - · last guide change 86b764b (2026-10-09) One Leader at a Time in the scroll format: the Tholos from above, a law passing on the second word back, board and line, a change of board as a scroll-driven stage, when a board may form with tablets lost, the holder on the porch, wax and stone; docs: Paxos keeps its names, five Paxos books remain in chapters
    - direct: 4 world guide · 1 book guide · 9 book · 6 spec · 10 image
    - inherited: 23 spec · 17 image
  - `loom-woven-dress` Everything worn is a loom-woven rectangle, draped and pinned, never tailored
    - stands at - · last guide change 9c5de84 (2026-10-09) Schedia's runners are young men, not boys: the reference sheet, the four runner pictures of One Leader at a Time, and the wording in the settings, reality checks, place page, prompts and alt texts
    - direct: 3 world guide · 11 spec · 23 image
    - inherited: 3 book · 20 spec · 8 image
  - `messenger-kit` Messengers are bare-headed in an exomis, strapped sandals and a hide pera
    - stands at da00e36 (2026-10-01) · last guide change e547e60 (2026-10-02) Paxos cast redressed in loom-woven rectangles (pinned chitons, cord belts, exomis, hide sacks) and the messengers made men: new reference sheet, Part-Time Parliament prompts and alt texts, Paxos dress table in the world prompt · **REVIEW**
    - direct: 3 world guide · 10 spec · 24 image
    - inherited: 3 book · 19 spec · 5 image
  - `paxos-cast-dress` Paxos cast wear loom-woven rectangles: pinned white chitons with purple cord belts and hem bands, cord belts, hide sacks; no sewn sleeves, satchels or buckles
    - stands at e547e60 (2026-10-02) · last guide change e547e60 (2026-10-02) Paxos cast redressed in loom-woven rectangles (pinned chitons, cord belts, exomis, hide sacks) and the messengers made men: new reference sheet, Part-Time Parliament prompts and alt texts, Paxos dress table in the world prompt
    - direct: 1 world guide · 6 spec · 11 image
    - inherited: 5 spec
    - stale: 1 image (behind e547e60)
  - `paxos-messengers-male` Paxos messengers are all men, bare-headed, in a blue exomis
    - stands at e547e60 (2026-10-02) · last guide change c194f0c (2026-09-27) The Chamber rebuilt in Blender at the map's scale and baked into the Paxos model; Chamber page gets new establishing, terrace and interior images; Part-Time Parliament interior shots reframed on the new room
    - direct: 1 book · 5 spec · 11 image
    - inherited: 6 spec
    - stale: 1 image (behind e547e60)
- **7 Transport: round ships, mule tracks and signal fires** (`hellenistic-reference.html#transport`)
  - `merchant-ships` Merchant ships are round-hulled Kyrenia-type sailing ships with steering oars; no galleys, sloops or barges
    - stands at 1dd23fb (2026-10-02) · last guide change 592cae4 (2026-10-02) The Chamber redesigned as a Greek round hall: Doric peristyle, one conical roof of pan and cover tiles on rafters held up by six inner columns, a lantern at the apex; set rebuilt and Paxos re-baked; docs, reality checks and the setting page follow · **REVIEW**
    - direct: 4 world guide · 5 spec · 13 image
    - inherited: 7 book · 38 spec · 29 image
    - stale: 1 spec · 1 image (behind 1dd23fb)
  - `ring-road-carts` Carts and pack animals carry goods; two-wheeled carts and handcarts, no stirrups, no wagons on the cliff shelf
    - stands at - · last guide change 4cb83b2 (2026-10-02) Hellenistic Greece art reference: standalone HTML with public-domain images and SVG schematics
    - direct: 1 world guide · 1 spec · 1 image
    - inherited: none
- **8 Administration and economy: decrees, honours and coin** (`hellenistic-reference.html#admin`)
  - `coins-and-seals` Attic silver coin with owl and goddess, signet seal rings, stelai for decrees
    - stands at - · last guide change c8f8f62 (2026-10-09) Setting pages in the scroll look: cover with the establishing shot, torn-edge spreads, the setting-and-papers pairs, reality checks as a paper table, the books set there as cover cards
    - direct: 8 world guide · 7 book · 5 spec · 16 image
    - inherited: 7 book · 58 spec · 45 image
- **9 Modelling cheat sheet** (`hellenistic-reference.html#cheat`)
- **10 Art-use checklist and anachronisms to avoid** (`hellenistic-reference.html#checklist`)
- **11 Sources and image credits** (`hellenistic-reference.html#sources`)

## Dependencies

```
place -> its books -> their shot specs -> images; sheet -> shot specs that use it; reality.md -> place pages; plans -> the books of their island
```

- `places/hall-of-two-doors/index.html`
  - `books/knowing-when-to-wait/index.html` (5 images)
- `places/ring-road/index.html`
  - `books/many-copies-acting-as-one/index.html` (3 images)
  - `books/ordering-without-clocks/index.html` (3 images)
  - `books/taking-stock-without-stopping/index.html` (2 images)
- `places/schedia/index.html`
  - `books/one-leader-at-a-time/index.html` (6 images)
- `places/scholars-coast/index.html`
  - `books/changes-that-never-clash/index.html` (5 images)
  - `books/probably-up-to-date/index.html` (5 images)
  - `books/spreading-by-word-of-mouth/index.html` (5 images)
  - `books/what-you-can-promise-alone/index.html` (5 images)
- `places/the-chamber/index.html`
  - `books/one-leader-at-a-time/index.html` (6 images)
  - `books/the-part-time-parliament/index.html` (8 images)
- `places/the-crown/index.html`
  - `books/agreeing-among-liars/index.html` (3 images)
  - `books/changing-leaders-among-liars/index.html` (2 images)
  - `books/keeping-order-among-liars/index.html` (2 images)
- `places/the-foot/index.html`
  - `books/agreeing-among-liars/index.html` (3 images)
  - `books/agreeing-by-chance/index.html` (1 images)
  - `books/agreeing-when-messages-run-late/index.html` (2 images)
  - `books/answering-while-cut-off/index.html` (2 images)
  - `books/telling-the-dead-from-the-slow/index.html` (1 images)
  - `books/the-limits-of-agreement/index.html` (2 images)

## Gaps

- Images with no shot spec: 1
  - `assets/img/map.jpg`
- Nodes no decision touches: 41 (a decision is missing, or the node is out of scope)
