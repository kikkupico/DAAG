# Response to the review

Each item from `review.md`, and what was done. The documents were corrected at the project root (and `archive/art/world-prompt.md`) and copied into this folder. The renders to look at are in `renders/preview` (contact sheets: `review-sheet-arche.jpg`, `review-sheet-paxos.jpg`; a draft of the showcase page built from them is `showcase/index.html`). No finals have been made.

## 1. Settings and documents

### `world-prompt.md` (corrected in `archive/art/world-prompt.md`)

| Item | Done |
|---|---|
| The fork as a gabled hall | Paxos plate step 1 now describes the sanctuary (low wall, old oak, small temple, altar, north and south gates); step 2 says "sanctuary at the fork". |
| Doorways | The Chamber has one doorway with a door that can be locked; the Tholos one doorway with its porch (plate step 1, Feature 7, Feature 7a, which now also has five benches). |
| The crown's wall | The goat paths to "the wall's north slot and south gap" are gone: no path climbs to the wall, which has no gate, gap or stair. |
| The three houses | The map prompt, the plate prompt, Feature 0 and Features 2–4 now describe one house, built alike, in the words of `settings.md`; only the harbours differ, with House 2's press house and the rock-cut storehouse where the books put them. No slate tablets remain. |
| Light in Feature 0 | It now keeps the reference image's light; the L-shaped pier is the plate's stone dock. |
| Festival tables | Long stone tables. |
| The inlet and the ferry | In the Paxos narrative setting, and a new Feature 6a, the ferry across the inlet. |
| Courier cove | The Paxos plate prompts (step 1, §3.1a) still put the courier landing in the south-west, as the existing `archive/art/` plates were made; the narrative setting and this model put it at the southern tip, as `settings.md` does. |
| Pipeline | `README.md` here now says that the pipeline sections of `world-prompt.md` describe the separate image-to-3D models in `archive/art/`, and that this model is procedural (`BUILD.md`). The root file is left describing its own pipeline, which is still true for `archive/art/`. |
| Pronoun | "Messengers". |

### `paxos-plans.md`

| Item | Done |
|---|---|
| Knowing When to Wait | Devices, chapters and "must not exist" now follow the book: the priestess, the work on a strip of lead, the north and south gates, the roster, the student at a post, the manifest. "Two doors" is "Two gates"; no third gate or road. |
| L5 | Every book is a scroll. |
| Names | Spreading names Demerios; the other coast books name no one; the "footnote in every book" line is gone. |
| Festival frequency | Once a year, in the devices table; the open question is closed. |

### `settings.md`

| Item | Done |
|---|---|
| L324 edit note | Replaced by "The Tholos has five benches, one for each legislator." |
| The Tholos "the same kind of hall" | The contrast is stated: plain honey-coloured drum, no colonnade, porch at its one door, six columns inside, against the Chamber's Doric peristyle and Corinthian ring. |
| Pronouns | The goatherd's crossing time is "their"; the mercenaries were hired "each separately"; "the messenger carries nothing worth taking"; "which of them lied". |

### `buildings.md`

| Item | Done |
|---|---|
| Chamber row | Adds that Paxos tells time by the sun and the bronze meridian line on the floor. |
| Tholos row | States the same contrast as `settings.md`. |
| Tally house and column room | Now the counting room and the column room, inside each house. The model no longer has separate buildings for them. |
| Counts | Seven shares in six places, nineteen papers (the oracle's companion among them); 13 places for 25 papers. |

### `arche-plans.md`

"Each book should name the others" is removed.

## 2. Model and renders

| Item | Done |
|---|---|
| Arche's mountain | Rebuilt as a broad massif with a steeper summit cone: eight spurs run out nearly to the cliff tops, with the four cardinal gullies cut deep; the coastal strip is narrow. The coast is less regular, the cliffs weather darker and streaked, and the overview cameras are closer. All sightline checks still hold. |
| The ring road | The road now runs along the cliff top just inside the edge, and carts stand in file in both lanes, facing opposite ways, all round the island. The shot looks back along it from over the sea. See below: it is still a cliff-top road, not a shelf cut into the face. |
| The pebble board | Six grooves in two sets of three, white for each library's sightings in the first, black in the second; the small boards on the stand likewise. |
| The ferry | Each bank has a stone landing with steps, a timber jetty and mooring posts, and a small open shelter with benches; footpaths from several libraries converge on the stages (two routes cross only by the ferry, which the terrain script checks). The shot frames both banks. |
| The Tholos at Schedia | Reframed from over the bay: the Tholos on its court above, Schedia's courtyard houses, quay and mole at the cove below. Tiles are a deeper terracotta, so the houses read as roofed. |
| `bay_chamber_to_tholos` | The halls were moved closer to their shores. The shot now looks from above and behind the Tholos's honey drum, across the bay to the white, colonnaded Chamber. |
| Camp basket | A covered wicker basket with its lid tied down and a carrying loop. |
| Crown | The wall is taller and solid all round, its top jagged but never low enough to see over from inside; the floor is laid with flagstones. |
| Slope post, granary | Rocks are finer and smooth-shaded, with craggier shapes. |
| House 3 board | The sixth numeral is stigma, Ϛ. |
| Chamber interior | The meridian line is a polished bronze strip inlaid flush in a dark stone border, with transverse marks; the floor is laid in alternating pale and dark rings. |
| Tholos interior | The flagstones are bedded on mortar, so the joints no longer show black; the benches face the podium with their backs to the wall. |
| Oracle | The tripods are gone (not in canon); the oak is fuller; the enclosure is an irregular oval with its two gates. |
| Courier landing | Moved to a narrow, crooked, cliff-sided cove at the southern tip, with the piers and the shelter at its head. |
| White geometry | Paving and the faces of quays and moles are weathered: darker stone, per-slab tone, grime in the joints, dust and lichen. Cut-and-fill slopes round levelled sites now show soil and scree instead of pale bedrock. |

## Not fully resolved

- **The ring road is not a shelf in the cliff face.** It runs along the top of the cliffs, close to the edge. Cutting it into the face would need the terrain to carry an overhang-free notch along the whole coast; it is the main thing left for this item. The parapet is built where the ground drops beside the road, but no current shot shows it close.
- **The overviews** now show the broad massif, its spurs and gullies and the narrow coastal strip; at full size the port towns, the quays and the road along the coast are visible. Above each town a pale patch remains where the mountain's foot gives way to the harbour slope.
- **Schedia** is laid out in rows on its slope with gaps, mixed house types and deeper tiles, but still reads as fairly regular from the air; there are no retaining walls on the terrace edges yet.
- **`bay_chamber_to_tholos`** is improved (both halls are distinct, the Tholos in the foreground), but the Chamber is still small in the frame across the bay.
- **The road and the sea.** A check now samples the ground under Arche's road outside the harbours; 3 of 7,200 samples sit within a metre of sea level at narrow points. None crosses open water.

## Roads (second request)

Every road and path is now laid by `src/roadnet.py` instead of being drawn between hand-placed points. A route is searched over the uncarved ground at 6 m: each step costs its length, more as it climbs, and is refused above the ruling grade (10% for roads, 22% for footpaths, which may be stepped), in water, or on any building, terrace or ground. Roads therefore follow the contours and switch back on the arms of Paxos, and go round what is built.

- **The Chamber.** The road comes in along the contour, crosses the paved terrace behind the hall (no road surface is drawn on the paving) and leaves on the level. Before, it climbed the hillside head-on and ran through the hall.
- **The festival ground and the stoa.** The road ends beside the stoa's end; no road crosses the stoa, the festival ground or its tables.
- **The oracle.** The roads meet the north and south gates and fork beyond the north gate, the east road branching off the west road rather than running beside it.
- **The towns.** Each harbour town on Paxos keeps a main street clear of houses; the road reaches its top, and a stepped street runs down to the quay. On Arche the ring road runs as a straight waterfront street along each house's portico, at the same distance from all three houses.
- **The couriers' cove.** A ravine runs inland from the cove's head, so a path climbs out of it to the road.
- **Crossings.** Where paths cross roads or each other they meet on the level, and all roads are carved together so the legs of a switchback do not cut into one another.

The terrain scripts end with an audit that measures every road and path on the carved ground (`road_audit` in each `sites.json`): all 35 pass, with no length on any footprint. The steepest stretches are short pitches of about 13% on the west road of Paxos, under its 10% ruling grade; Arche's ring road stays under 10%. Grade-coloured plans of both islands are `renders/preview/road-map-arche.jpg` and `road-map-paxos.jpg`.
