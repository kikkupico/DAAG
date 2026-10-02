# Art direction tree

Built by `python3 art/direction/tree.py build`. Layers run from the historic reference down to the images; each art decision lists what mentions it (direct) and what lies downstream of those (inherited). Each decision stands at a commit (`since`); stale means older than that commit. `review` marks a decision whose lines changed in git after it was last touched.

| Layer | Nodes |
|---|---|
| 0 reference | 28 |
| 1 world guide | 11 |
| 2 book guide | 3 |
| 3 book | 19 |
| 4 spec | 96 |
| 5 image | 59 |

## Reference, decisions and blast radius

- **1 Overview and chronology** (`hellenistic-reference.html#overview`)
  - `no-people-on-plates` Island plates and terrain plates show habitation only through objects: no people, no animals
    - stands at - · last guide change 14a9c07 (2026-09-27) One Leader at a Time: Schedia is governed from the Tholos, a rotunda like the Chamber with a podium at its centre; the law kept in wax
    - direct: 1 world guide · 18 spec · 17 image
    - inherited: none
- **2 Buildings: stone orders, tiled roofs and civic ensembles** (`hellenistic-reference.html#buildings`)
  - `courtyard-houses` Houses are plastered rubble, blind to the street, open onto a court or portico
    - stands at - · last guide change dd033f7 (2026-10-02) Hellenistic reference: dimensions tables per section, modelling cheat sheet and scale diagrams
    - direct: 5 world guide · 10 spec · 6 image
    - inherited: 4 book · 15 spec · 15 image
  - `pan-and-cover-roofs` Roofs are flat terracotta pan tiles under narrow cover tiles, with eave-end tiles
    - stands at - · last guide change dd033f7 (2026-10-02) Hellenistic reference: dimensions tables per section, modelling cheat sheet and scale diagrams
    - direct: 4 world guide · 12 spec · 11 image
    - inherited: 3 book · 2 spec · 2 image
  - `stone-dome-chamber` The Chamber is a round hall under a stone dome (kept departure: Greek round halls had conical tile roofs)
    - stands at - · last guide change 9376ef3 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 8 world guide · 2 book guide · 4 book · 24 spec · 19 image
    - inherited: 4 book · 4 spec · 4 image
  - `unbased-doric` Doric columns have no bases and stand on the paving
    - stands at - · last guide change e8ec907 (2026-10-02) Docs follow the Hellenistic reference: ship terms, cloth sizes, modelling scale canon and pointers to the reference
    - direct: 5 world guide · 13 spec · 18 image
    - inherited: 5 book · 23 spec · 14 image
- **3 Town planning: grids, terraces, harbours and countryside** (`hellenistic-reference.html#town`)
  - `crown-citadel` The crown is a small solid ruined dry-stone ring wall; the posts are hollows among crags
    - stands at - · last guide change 9376ef3 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 6 world guide · 1 book guide · 4 book · 15 spec · 12 image
    - inherited: 4 book · 9 spec · 7 image
  - `ring-road-plan` One cliff road with a lane each way joins terraced harbour towns; agora and stoa frame the quay
    - stands at - · last guide change 1dd23fb (2026-10-02) World prompt: last sloop becomes a coastal cargo ship
    - direct: 10 world guide · 3 book guide · 10 book · 29 spec · 20 image
    - inherited: 9 book · 35 spec · 32 image
- **4 Tools and crafts: from quarry to kitchen** (`hellenistic-reference.html#tools`)
  - `retired-bound-books` RETIRED wording: loot book, law book, ledger, leather-bound · RETIRED wording, fix leftovers
    - stands at 9376ef3 (2026-10-02) · last guide change 9376ef3 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 7 book · 9 spec · 13 image
    - inherited: 17 spec · 13 image
    - stale: 7 book · 9 spec · 13 image (behind 9376ef3)
  - `sandglass-timers` Four men start together by turning a sandglass (kept departure: the Greek timer was the water clock)
    - stands at - · last guide change 9376ef3 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 5 world guide · 2 book guide · 6 book · 5 spec · 12 image
    - inherited: 3 book · 26 spec · 15 image
  - `scrolls-not-bound-books` In-world records are papyrus scrolls and wax tablets; no codex or bound ledger
    - stands at 9376ef3 (2026-10-02) · last guide change dd033f7 (2026-10-02) Hellenistic reference: dimensions tables per section, modelling cheat sheet and scale diagrams · **REVIEW**
    - direct: 11 world guide · 3 book guide · 4 book · 17 spec · 22 image
    - inherited: 14 book · 40 spec · 31 image
    - stale: 3 world guide · 1 book guide · 4 book · 11 spec · 17 image (behind 9376ef3)
- **5 Weapons and war: pike, oval shield, torsion engine and ram** (`hellenistic-reference.html#weapons`)
  - `camp-kit` A mercenary's camp is one linen tent, a plain shield, a chest and a wicker basket
    - stands at - · last guide change c45b69e (2026-10-01) Reality checks added and ring-road costume and roof canon: petasos, exōmis, pera, unbased Doric columns, pan and cover tiles
    - direct: 7 world guide · 2 book guide · 7 book · 15 spec · 14 image
    - inherited: 5 book · 19 spec · 17 image
- **6 Clothing: draped wool and linen, hats and hair** (`hellenistic-reference.html#clothing`)
  - `cast-by-colour` Same-kind figures differ only by clothing colour
    - stands at - · last guide change c45b69e (2026-10-01) Reality checks added and ring-road costume and roof canon: petasos, exōmis, pera, unbased Doric columns, pan and cover tiles
    - direct: 4 world guide · 1 book guide · 7 spec · 10 image
    - inherited: 1 book · 16 spec · 10 image
  - `loom-woven-dress` Everything worn is a loom-woven rectangle, draped and pinned, never tailored
    - stands at - · last guide change e8ec907 (2026-10-02) Docs follow the Hellenistic reference: ship terms, cloth sizes, modelling scale canon and pointers to the reference
    - direct: 3 world guide · 1 book · 6 spec · 15 image
    - inherited: 2 book · 17 spec · 8 image
  - `messenger-kit` Messengers are bare-headed in an exomis, strapped sandals and a hide pera
    - stands at da00e36 (2026-10-01) · last guide change dd033f7 (2026-10-02) Hellenistic reference: dimensions tables per section, modelling cheat sheet and scale diagrams · **REVIEW**
    - direct: 3 world guide · 2 book · 5 spec · 5 image
    - inherited: 1 book · 6 spec · 6 image
- **7 Transport: round ships, mule tracks and signal fires** (`hellenistic-reference.html#transport`)
  - `merchant-ships` Merchant ships are round-hulled Kyrenia-type sailing ships with steering oars; no galleys, sloops or barges
    - stands at 1dd23fb (2026-10-02) · last guide change 1dd23fb (2026-10-02) World prompt: last sloop becomes a coastal cargo ship
    - direct: 4 world guide · 1 book · 6 spec · 14 image
    - inherited: 7 book · 18 spec · 9 image
    - stale: 3 world guide · 1 book · 3 spec · 11 image (behind 1dd23fb)
  - `ring-road-carts` Carts and pack animals carry goods; two-wheeled carts and handcarts, no stirrups, no wagons on the cliff shelf
    - stands at - · last guide change 4cb83b2 (2026-10-02) Hellenistic Greece art reference: standalone HTML with public-domain images and SVG schematics
    - direct: 1 world guide · 1 spec · 1 image
    - inherited: none
- **8 Administration and economy: decrees, honours and coin** (`hellenistic-reference.html#admin`)
  - `coins-and-seals` Attic silver coin with owl and goddess, signet seal rings, stelai for decrees
    - stands at - · last guide change dd033f7 (2026-10-02) Hellenistic reference: dimensions tables per section, modelling cheat sheet and scale diagrams
    - direct: 8 world guide · 7 book · 5 spec · 16 image
    - inherited: 8 book · 42 spec · 28 image
- **9 Modelling cheat sheet** (`hellenistic-reference.html#cheat`)
- **10 Art-use checklist and anachronisms to avoid** (`hellenistic-reference.html#checklist`)
- **11 Sources and image credits** (`hellenistic-reference.html#sources`)

## Dependencies

```
place -> its books -> their shot specs -> images; sheet -> shot specs that use it; reality.md -> place pages; plans -> the books of their island
```

- `places/hall-of-two-doors/index.html`
  - `books/knowing-when-to-wait/index.html` (0 images)
- `places/ring-road/index.html`
  - `books/many-copies-acting-as-one/index.html` (3 images)
  - `books/ordering-without-clocks/index.html` (3 images)
  - `books/taking-stock-without-stopping/index.html` (3 images)
- `places/schedia/index.html`
  - `books/one-leader-at-a-time/index.html` (6 images)
- `places/scholars-coast/index.html`
  - `books/changes-that-never-clash/index.html` (0 images)
  - `books/probably-up-to-date/index.html` (0 images)
  - `books/spreading-by-word-of-mouth/index.html` (0 images)
  - `books/what-you-can-promise-alone/index.html` (0 images)
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
- Nodes no decision touches: 27 (a decision is missing, or the node is out of scope)
