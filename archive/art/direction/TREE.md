# Art direction tree

Built by `python3 art/direction/tree.py build`. Layers run from the historic reference down to the images; each art decision lists what mentions it (direct) and what lies downstream of those (inherited). Each decision stands at a commit (`since`); stale means older than that commit. `review` marks a decision whose lines changed in git after it was last touched.

| Layer | Nodes |
|---|---|
| 0 reference | 31 |
| 1 world guide | 12 |
| 2 book guide | 3 |
| 3 book | 20 |
| 4 spec | 131 |
| 5 image | 85 |

## Reference, decisions and blast radius

- **1 Overview and chronology** (`hellenistic-reference.html#overview`)
  - `no-people-on-plates` Plates meant for 3D conversion show habitation only through objects: no people, no animals; photoreal renders are free of this
    - stands at - · last guide change f1a2c8d (2026-10-24) The CALM setting becomes an oracle at the fork that counsels students. The hall of two doors is gone: at the fork of Paxos stands a sanctuary in the manner of Dodona, a low wall round an old oak with a small temple and an altar, and a gate north and south. Groups of students bring the priestess the work they mean to do together, on a folded strip of lead, before they choose how to live; she reads the work and nothing else and sends them north, to live as the assemblies do, keeping a roster and waiting for every name on it, or south, to live as scholars at posts in the libraries, with no roster. The roster is the hinge, as in the proof; the counsel is always one road or the other, and a manifest only narrows the waiting. The oracle is exact and foresees nothing, which a leak aside sets against Croesus and the Halys.
    - direct: 1 world guide · 21 spec · 19 image
    - inherited: none
- **2 Buildings: stone orders, tiled roofs and civic ensembles** (`hellenistic-reference.html#buildings`)
  - `chamber-conical-roof` The Chamber is a Greek round hall: a Doric peristyle round the drum, one conical roof of pan and cover tiles on timber rafters held up by six columns inside, a small lantern at the apex
    - stands at 0754785 (?) · last guide change 486966e (2026-10-24) Settings by who acts, what carries word and what it says: the seven setting pages and the home page put the place second. Each setting page now opens on its actors (how many, what each holds, how each may fail), then its messenger (ravens, rats, slips on the ring road, messengers, runners, couriers: timing, loss, order, whose it is), then what the messages say, a table of each book's messages (the Chamber's five notes, the Tholos's petitions, lines, roll, call and opening line; the hall's letters, slips, notices and manifest), and only then the island and its buildings, framed by what they rule out. The foot's and crown's One Change a Night become those tables. The setting-and-papers maps and the Reality Checks tables list people, messages and things before places and buildings. On the home page the islands' captions and each setting's band lead with the actors, and each setting card gives three lines, Who, Word and Sent (the crown's card said ravens; it says rats). Names, titles and links are unchanged. process.md describes the order.
    - direct: 5 world guide · 6 spec · 2 image
    - inherited: 2 book · 16 spec · 16 image
  - `courtyard-houses` Houses are plastered rubble, blind to the street, open onto a court or portico
    - stands at - · last guide change 486966e (2026-10-24) Settings by who acts, what carries word and what it says: the seven setting pages and the home page put the place second. Each setting page now opens on its actors (how many, what each holds, how each may fail), then its messenger (ravens, rats, slips on the ring road, messengers, runners, couriers: timing, loss, order, whose it is), then what the messages say, a table of each book's messages (the Chamber's five notes, the Tholos's petitions, lines, roll, call and opening line; the hall's letters, slips, notices and manifest), and only then the island and its buildings, framed by what they rule out. The foot's and crown's One Change a Night become those tables. The setting-and-papers maps and the Reality Checks tables list people, messages and things before places and buildings. On the home page the islands' captions and each setting's band lead with the actors, and each setting card gives three lines, Who, Word and Sent (the crown's card said ravens; it says rats). Names, titles and links are unchanged. process.md describes the order.
    - direct: 4 world guide · 6 spec · 1 image
    - inherited: 4 book · 10 spec · 10 image
  - `pan-and-cover-roofs` Roofs are flat terracotta pan tiles under narrow cover tiles, with eave-end tiles
    - stands at - · last guide change f1a2c8d (2026-10-24) The CALM setting becomes an oracle at the fork that counsels students. The hall of two doors is gone: at the fork of Paxos stands a sanctuary in the manner of Dodona, a low wall round an old oak with a small temple and an altar, and a gate north and south. Groups of students bring the priestess the work they mean to do together, on a folded strip of lead, before they choose how to live; she reads the work and nothing else and sends them north, to live as the assemblies do, keeping a roster and waiting for every name on it, or south, to live as scholars at posts in the libraries, with no roster. The roster is the hinge, as in the proof; the counsel is always one road or the other, and a manifest only narrows the waiting. The oracle is exact and foresees nothing, which a leak aside sets against Croesus and the Halys.
    - direct: 4 world guide · 17 spec · 9 image
    - inherited: 4 book · 7 spec · 7 image
  - `retired-dome` RETIRED: the stone dome, coffers and oculus of the old Chamber · RETIRED wording, fix leftovers
    - stands at 0754785 (?) · last guide change 4fc3c75 (2026-10-10) Scholars' coast modelled in full: the nine libraries (porch, open door, reading room with its racks of scrolls), the stoa and festival ground, and a pebble table on each of five far terraces, each built piece by piece on the mason's kit and baked into Paxos; Changes That Never Clash reframed onto the tables, alt texts brought in step
    - direct: 1 world guide · 1 book guide · 1 book · 6 spec · 2 image
    - inherited: none
  - `unbased-doric` Doric columns have no bases and stand on the paving
    - stands at - · last guide change f1a2c8d (2026-10-24) The CALM setting becomes an oracle at the fork that counsels students. The hall of two doors is gone: at the fork of Paxos stands a sanctuary in the manner of Dodona, a low wall round an old oak with a small temple and an altar, and a gate north and south. Groups of students bring the priestess the work they mean to do together, on a folded strip of lead, before they choose how to live; she reads the work and nothing else and sends them north, to live as the assemblies do, keeping a roster and waiting for every name on it, or south, to live as scholars at posts in the libraries, with no roster. The roster is the hinge, as in the proof; the counsel is always one road or the other, and a manifest only narrows the waiting. The oracle is exact and foresees nothing, which a leak aside sets against Croesus and the Halys.
    - direct: 5 world guide · 10 spec · 26 image
    - inherited: 6 book · 49 spec · 20 image
- **3 Town planning: grids, terraces, harbours and countryside** (`hellenistic-reference.html#town`)
  - `crown-citadel` The crown is a small solid ruined dry-stone ring wall; the posts are hollows among crags
    - stands at - · last guide change 486966e (2026-10-24) Settings by who acts, what carries word and what it says: the seven setting pages and the home page put the place second. Each setting page now opens on its actors (how many, what each holds, how each may fail), then its messenger (ravens, rats, slips on the ring road, messengers, runners, couriers: timing, loss, order, whose it is), then what the messages say, a table of each book's messages (the Chamber's five notes, the Tholos's petitions, lines, roll, call and opening line; the hall's letters, slips, notices and manifest), and only then the island and its buildings, framed by what they rule out. The foot's and crown's One Change a Night become those tables. The setting-and-papers maps and the Reality Checks tables list people, messages and things before places and buildings. On the home page the islands' captions and each setting's band lead with the actors, and each setting card gives three lines, Who, Word and Sent (the crown's card said ravens; it says rats). Names, titles and links are unchanged. process.md describes the order.
    - direct: 6 world guide · 1 book guide · 13 book · 16 spec · 13 image
    - inherited: 16 spec · 15 image
  - `ring-road-plan` One cliff road with a lane each way joins terraced harbour towns; agora and stoa frame the quay
    - stands at - · last guide change 4983a8b (2026-10-25) Setting pages: no he, she or man for a role; the priestess named by role.
    - direct: 10 world guide · 2 book guide · 9 book · 33 spec · 20 image
    - inherited: 10 book · 55 spec · 50 image
- **4 Tools and crafts: from quarry to kitchen** (`hellenistic-reference.html#tools`)
  - `retired-bound-books` RETIRED wording: loot book, law book, ledger, leather-bound · RETIRED wording, fix leftovers
    - stands at 9376ef3 (?) · last guide change d4a0072 (2026-10-02) Setting docs: bound books and ledgers become scrolls (loot scroll, law scroll, account scrolls); reality checks re-graded
    - direct: 2 book · 2 spec · 26 image
    - inherited: 31 spec · 2 image
  - `sandglass-timers` Four men start together by turning a sandglass (a deliberate anachronism for narrative convenience; the Greek timer was the water clock)
    - stands at - · last guide change 4983a8b (2026-10-25) Setting pages: no he, she or man for a role; the priestess named by role.
    - direct: 6 world guide · 2 book guide · 8 book · 7 spec · 17 image
    - inherited: 3 book · 37 spec · 24 image
  - `scrolls-not-bound-books` In-world records are papyrus scrolls and wax tablets; no codex or bound ledger
    - stands at 9376ef3 (?) · last guide change 4983a8b (2026-10-25) Setting pages: no he, she or man for a role; the priestess named by role.
    - direct: 11 world guide · 3 book guide · 20 book · 40 spec · 44 image
    - inherited: 44 spec · 33 image
- **5 Weapons and war: pike, oval shield, torsion engine and ram** (`hellenistic-reference.html#weapons`)
  - `camp-kit` A mercenary's camp is one linen tent, a plain shield, a chest and a wicker basket
    - stands at - · last guide change 4983a8b (2026-10-25) Setting pages: no he, she or man for a role; the priestess named by role.
    - direct: 7 world guide · 2 book guide · 10 book · 14 spec · 18 image
    - inherited: 3 book · 22 spec · 16 image
- **6 Clothing: draped wool and linen, hats and hair** (`hellenistic-reference.html#clothing`)
  - `cast-by-colour` Same-kind figures differ only by clothing colour
    - stands at - · last guide change 37c9707 (2026-10-09) One Leader at a Time in the scroll format: the Tholos from above, a law passing on the second word back, board and line, a change of board as a scroll-driven stage, when a board may form with tablets lost, the holder on the porch, wax and stone; docs: Paxos keeps its names, five Paxos books remain in chapters
    - direct: 4 world guide · 1 book guide · 6 spec · 10 image
    - inherited: 1 book · 16 spec · 10 image
  - `loom-woven-dress` Everything worn is a loom-woven rectangle, draped and pinned, never tailored
    - stands at - · last guide change 3c2bbfa (2026-10-25) Documents and place pages follow the audits: no named Arche figures, scrolls on the ring road, the oracle's headline, build notes as the files now stand, setting titles in book titles and the papers index, Reality Checks for the missing devices.
    - direct: 3 world guide · 4 book · 29 spec · 41 image
    - inherited: 4 book · 26 spec · 9 image
  - `messenger-kit` Messengers are bare-headed in an exomis, strapped sandals and a hide pera
    - stands at da00e36 (?) · last guide change 04fc40f (2026-10-02) Paxos cast redressed in loom-woven rectangles (pinned chitons, cord belts, exomis, hide sacks) and the messengers made men: new reference sheet, Part-Time Parliament prompts and alt texts, Paxos dress table in the world prompt
    - direct: 3 world guide · 9 spec · 39 image
    - inherited: 4 book · 39 spec · 5 image
  - `paxos-cast-dress` Paxos cast wear loom-woven rectangles: pinned white chitons with purple cord belts and hem bands, cord belts, hide sacks; no sewn sleeves, satchels or buckles
    - stands at e547e60 (?) · last guide change 419675a (2026-10-23) Coast and hall pictures: the 3D fixes from the review, new previs, and the flagged photoreals regenerated.
    - direct: 1 world guide · 6 spec · 26 image
    - inherited: 24 spec
  - `paxos-messengers-male` Paxos messengers are all men, bare-headed, in a blue exomis
    - stands at e547e60 (?) · last guide change 61e4fc3 (2026-09-27) The Chamber rebuilt in Blender at the map's scale and baked into the Paxos model; Chamber page gets new establishing, terrace and interior images; Part-Time Parliament interior shots reframed on the new room
    - direct: 1 book · 4 spec · 26 image
    - inherited: 26 spec
- **7 Transport: round ships, mule tracks and signal fires** (`hellenistic-reference.html#transport`)
  - `merchant-ships` Merchant ships are round-hulled Kyrenia-type sailing ships with steering oars; no galleys, sloops or barges
    - stands at 1dd23fb (?) · last guide change 486966e (2026-10-24) Settings by who acts, what carries word and what it says: the seven setting pages and the home page put the place second. Each setting page now opens on its actors (how many, what each holds, how each may fail), then its messenger (ravens, rats, slips on the ring road, messengers, runners, couriers: timing, loss, order, whose it is), then what the messages say, a table of each book's messages (the Chamber's five notes, the Tholos's petitions, lines, roll, call and opening line; the hall's letters, slips, notices and manifest), and only then the island and its buildings, framed by what they rule out. The foot's and crown's One Change a Night become those tables. The setting-and-papers maps and the Reality Checks tables list people, messages and things before places and buildings. On the home page the islands' captions and each setting's band lead with the actors, and each setting card gives three lines, Who, Word and Sent (the crown's card said ravens; it says rats). Names, titles and links are unchanged. process.md describes the order.
    - direct: 4 world guide · 5 spec · 28 image
    - inherited: 8 book · 38 spec · 13 image
  - `ring-road-carts` Carts and pack animals carry goods; two-wheeled carts and handcarts, no stirrups, no wagons on the cliff shelf
    - stands at - · last guide change d413989 (2026-10-02) Hellenistic Greece art reference: standalone HTML with public-domain images and SVG schematics
    - direct: 1 world guide · 1 spec · 1 image
    - inherited: none
- **8 Administration and economy: decrees, honours and coin** (`hellenistic-reference.html#admin`)
  - `coins-and-seals` Attic silver coin with owl and goddess, signet seal rings, stelai for decrees
    - stands at - · last guide change 4983a8b (2026-10-25) Setting pages: no he, she or man for a role; the priestess named by role.
    - direct: 8 world guide · 10 book · 6 spec · 21 image
    - inherited: 7 book · 63 spec · 45 image
- **9 Modelling cheat sheet** (`hellenistic-reference.html#cheat`)
- **10 Art-use checklist and anachronisms to avoid** (`hellenistic-reference.html#checklist`)
- **11 Sources and image credits** (`hellenistic-reference.html#sources`)

## Dependencies

```
place -> its books -> their shot specs -> images; sheet -> shot specs that use it; reality.md -> place pages; plans -> the books of their island
```

- `places/hall-of-two-doors/index.html`
- `places/oracle-at-the-fork/index.html`
  - `books/knowing-when-to-wait/index.html` (5 images)
- `places/ring-road/index.html`
  - `books/eighteen-books-in-one-scroll/index.html` (0 images)
  - `books/many-copies-acting-as-one/index.html` (3 images)
  - `books/ordering-without-clocks/index.html` (3 images)
  - `books/taking-stock-without-stopping/index.html` (2 images)
- `places/schedia/index.html`
  - `books/one-leader-at-a-time/index.html` (6 images)
- `places/scholars-coast/index.html`
  - `books/changes-that-never-clash/index.html` (5 images)
  - `books/eighteen-books-in-one-scroll/index.html` (0 images)
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

- Images with no shot spec: 5
  - `assets/img/map.jpg`
  - `assets/img/panels/changes-that-never-clash/p01-terraces.jpg`
  - `assets/img/panels/changes-that-never-clash/p02-table.jpg`
  - `assets/img/panels/changes-that-never-clash/p03-pier.jpg`
  - `assets/img/panels/changes-that-never-clash/p04-tip.jpg`
- Nodes no decision touches: 31 (a decision is missing, or the node is out of scope)
