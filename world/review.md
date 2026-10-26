# Review

Two lists: corrections to the documents, and corrections to the model and its renders. The documents were checked against the setting pages (`places/`), their Reality Checks and the 19 books; the renders are those in `renders/preview`.

Every document here except `world-prompt.md` is identical to its root copy, so make the corrections at the root and copy them in. `world-prompt.md` here also predates `archive/art/world-prompt.md`, which has the rewritten no-people note.

---

## 1. Settings and documents

### `world-prompt.md`

- **The fork (L327, L335).** It still describes the old hall of two doors, "a small gabled hall with a door in each end wall". The books, and this file's own L313 and Feature 6, have a sanctuary: a low wall, an old oak, a small temple, an altar, two gates.
- **Doorways (L325–326, L449).** The Chamber has "evenly spaced doorways" and the Tholos "several doorways". Each hall has one door (`settings.md` L286, the Schedia page, Feature 1).
- **The crown's wall (L117).** Goat paths climb to "the wall's north slot and south gap". The wall is solid, with no gate, gap, stair or path (L72, L269, the books).
- **The three houses (L77–79, L130–132, Features 2–4).** Each house is drawn as a different building: a fishing haven, a wine and oil compound, a customs house with a courtyard. The houses are alike: one long plastered range with a gate and a Doric portico, and nothing sets one town apart (`settings.md` L62–75, the ring-road page). The prompts also use slate tablets where the books use wax and papyrus.
- **Light (L181–188).** Feature 0 asks for overcast light and an L-shaped pier; the plate is clear sun (L101).
- **Festival tables (L399).** They are wooden. The Spreading book and `buildings.md` have long stone tables.
- **The inlet and ferry.** `settings.md` L381 requires an inlet crossed only by one ferry. The Paxos prompts never mention it.
- **Pipeline.** The header and §2.1–4 describe Meshy conversions of image plates. `README.md` and `BUILD.md` say v3 is procedural and used no map.
- **Pronoun.** L502, "Messengers, who are all men", against the house style of `they` for a role.

### `paxos-plans.md`

- **Knowing When to Wait (L194–230).** The plan is for a hall with two doors: "the scholars' door", "the door of the assemblies", "Must not exist: a third door", "the hall ruling on anything", and a chapter list beginning "Two doors". The book has a sanctuary with a priestess, strips of lead, north and south gates, and a manifest that closes one step.
- **L5.** It says only two books are scrolls. All are.
- **Names (L54, L97, L186, L230, L240).** It promises named authors ("Bailios", "Hellersteinos…") and "a footnote in every book". Only Demerios, in Spreading, is named; Probably Up to Date, Changes That Never Clash, What You Can Promise Alone and Knowing When to Wait name no one.
- **L53.** The festival's frequency is still an open question; the book fixes it at once a year.

### `settings.md`

- **L324.** "The book is right and the set may be brought down to five" is a leftover edit note. The model needs five benches.
- **L288.** The Tholos is "the same kind of hall" as the Chamber. The Schedia page and `reality.md` say a plain drum, no outer colonnade, six columns inside and a porch at its one door. The Chamber has a Doric peristyle outside and a ring of Corinthian columns inside. State the contrast.
- **Pronouns (L55, L59–60, L91, L126).** "Man/men/he" for mercenaries, bandits, the messenger and the goatherd. The books say "mercenaries" and "bandits" and use `they`.

### `buildings.md`

- **Chamber row (L56).** It omits the bronze meridian line on the floor and that Paxos tells time by the sun; both are on the Chamber page and in `paxos-plans.md`.
- **L67.** The Tholos is "a rotunda like the Chamber"; see the `settings.md` L288 point above.
- **Tally house and column room (L32–33).** They are separate buildings. The books give each house one counting room, and Changes calls them "the column rooms of Arche". They should be rooms inside each house.
- **L19–20.** "Seventeen papers in seven buildings" and "15 buildings for 25 papers" do not reconcile with its own tables (13 buildings; 19 papers in six shared ones). Recount.

### `arche-plans.md`

- **L49.** "Each book should name the others" contradicts the rule that books name no other book in prose.

---

## 2. Model and renders

### Wrong against canon

- **Arche's mountain** (`arche_overview_golden`, `arche_overview_overcast`). It is one narrow, smooth cone on a wide, low plain. It should be a broad massif with eight spurs and gullies, filling nearly the whole interior and leaving only a narrow coastal strip, its foot reaching nearly to the cliff tops. The coast is a hexagonal outline with a white, blocky "tiled" cliff skirt. At overview distance the ports, ring road and crown are not visible. In the overcast shot the island is a flat plate with no spurs.
- **The ring road** (`ring_road`). It is a rutted track on a flat headland: no cliff shelf, no parapet, no sense of one lane each way.
- **The pebble board** (`pebble_board`). It shows about a dozen white/black column pairs. Changes That Never Clash has three libraries, so one column each for white and black per library: six in all (Feature 5 also says six).
- **The ferry** (`ferry`). A small rowing boat on a calm inlet, with no landing stage on either shore and no sign of a shared crossing.
- **The Tholos at Schedia** (`tholos_schedia`). The hall is not in the frame, and the town is a grid of identical white boxes rather than terraced courtyard houses.
- **`bay_chamber_to_tholos`.** The only round building is white with a red conical roof, so it is unclear which hall it is. The Tholos is honey-coloured and unringed; the Chamber is white and ringed. It is also a speck under a large white cliff band.

### Smaller fixes

- **Camp** (`camp_north`). The "wicker basket" is a small flat orange disc and does not read as a basket.
- **Crown** (`crown_aerial`, `crown_inside`). The wall is a low ring with a collapsed, lower stretch on the right, so a man inside could not see only sky. The floor is loose flakes, not paving.
- **Slope post, granary** (`slope_post`, `granary`). The rocks are visibly faceted and low-poly.
- **House 3 board** (`house3_board`). The sixth numeral is a digamma-like `F`; Hellenistic Greek used stigma, `Ϛ`.
- **Chamber interior** (`chamber_interior`). The "bronze meridian line" is a short brown raised plank, not an inlaid line.
- **Tholos interior** (`tholos_interior`). The flagstones show black gaps and the benches have no backs.
- **Oracle** (`oracle`, `oracle_aerial`). Unexplained brazier-like stools stand round the tree, and the tree is a bare trunk with cut limbs. The enclosure is a plain square.
- **Courier landing** (`courier_landing`). An open beach with timber piers. The prompts ask for a steep, narrow rocky cove with cliffs and a shelter.
- **White geometry.** The pier and the Chamber's terrace are very clean slabs against the earth around them.

### Correct as built

The Chamber exterior and its terrace; the Tholos exterior; the House 3 portico; the Paxos overview with its Y, bay, stem and inlet; the library desk and stepped stand; the stoa and its inside; the festival tables; the sundial platform; the oracle's wall, oak, temple, altar and two gates; the camp's tent, shield and chest.

`renders/final` was not compared.
