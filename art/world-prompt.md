# Hellenistic Archipelago: Island Generation Prompts (Image-to-3D)

This document provides modular, high-fidelity generation prompts for the islands and architectural landmarks of **Distributed Algorithms of Ancient Greece (DAAG)**, engineered for **isometric 3D generation** and **image-to-3D reconstruction** (e.g. Trellis, Tripo3D, Rodin, CSM, Meshy).

Rather than a single monolithic world prompt, this specification provides:
1. **Universal Pipeline Directives & Negative Prompts** ensuring watertight 3D reconstruction.
2. For each island:
   - **One Natural Geography & Clearings Prompt** establishing pristine terrain, coastline, and unbuilt settlement clearings. *(Arche's is a full island plate carrying its buildings and book locations; see 2.1.)*
   - **A Set of Focused Architectural Prompts** capturing individual structures, houses, and civil engineering landmarks.

**The island 3D models are built from the canon in Blender** by `art/arche/build/build.py` and `art/paxos/build/build.py`, not by image-to-3D: every measured constraint (the massif, the sightlines, the stacked cuttings, the Chamber on its road) is a parameter there. The prompts here are the visual brief, and the source for scene images.

---

## 1. Technical Pipeline Directives

All prompts must enforce the following image-to-3D parameters:

| Parameter | Specification | Rationale for Neural 3D Meshing |
|---|---|---|
| **Projection** | True axonometric / isometric orthographic projection (camera pitch ~35.264°, yaw 45°). | Eliminates focal foreshortening; preserves exact geometric scale across the terrain. |
| **Ocean Surface** | **Continuous open sea plane ($Z = 0$).** Expansive, calm Aegean indigo water extending naturally to all four frame edges. **Strictly NO cutaway slab, NO pedestal, NO acrylic/resin cube, NO vertical water walls.** | Enables straightforward ground-plane clipping and heightfield reconstruction without generating unwanted vertical glass blocks. |
| **Occupancy** | **Remove all people and animals.** Zero people, characters, human silhouettes, mules or livestock. Habitation and activity are shown only through objects: buildings, cargo, parked carts, moored ships, tents. People are added later, in **scene prompts** generated from renders of each island's 3D model at chosen camera positions. | At island scale a figure is a few pixels, which neural meshers bake into deformed polygon lumps. That wastes polygons and dirties surfaces meant for asset placement. |
| **Depth of Field** | **Hyperfocal deep focus (`NO_DOF`).** Zero bokeh, zero blur, zero tilt-shift, zero atmospheric fog/haze. | Eliminates point cloud noise and geometric blurring in reconstruction. |
| **Interior Models** | **Roof lifted away**, seen from the same isometric camera, with the floor as the ground plane ($Z = 0$) and no sea or terrain beyond the walls. Walls full height and unbroken. Use the **Interior Negative Prompt** below instead of the universal one. | Shows the whole floor to the mesher in one view, so the room reconstructs as a closed shell that scene cameras can later be placed inside. |
| **Period Canon** | **Hellenistic Ancient Greece (~3rd Century BC).** Dry-stone masonry, dressed ashlar limestone, weathered timber, oxblood terracotta roof tiles, silver-green olive groves, Italian cypress. Zero modern artifacts. | Preserves stylistic purity and visual cohesion across the entire series. |

### Universal Negative Prompt
```text
cutaway, slab, diorama pedestal, glass edges, resin block, acrylic cube, vertical water walls, rectangular water box, tabletop diorama base, swimming pool edges, aquarium glass, stepped ziggurat, concentric rings, tiered cake, circular cliff band, cylindrical rock wall, artificial plateau rings, concentric stone circles, amphitheater rings, circular terracing on mountain, man-made ramparts on mountain, inaccessible beach, cliff dropoff above beach, walled-off harbour, high cliffs blocking water access, sheer walls around ports, dropoffs separating road from water, people, humans, person, human figures, crowd, pedestrians, bystanders, characters, silhouettes, perspective distortion, vanishing point, wide-angle lens, fish-eye, bokeh, shallow depth of field, tilt-shift blur, vignette, lens flare, modern buildings, modern clothing, electricity wires, utility poles, tarmac roads, motorboats, cruise ships, whitewashed modern cycladic houses, blue painted shutters, plastic, concrete, neon, futuristic elements, low-poly, voxel, flat 2D sprite, cropped edges, cutoff island borders, horizon line, clouds covering terrain.
```

### Interior Negative Prompt
```text
roof, dome, ceiling, people, humans, person, human figures, crowd, characters, silhouettes, animals, perspective distortion, vanishing point, wide-angle lens, fish-eye, bokeh, shallow depth of field, tilt-shift blur, vignette, lens flare, fog, haze, sea, water, terrain beyond the walls, diorama pedestal, glass edges, resin block, acrylic cube, modern furniture, modern lighting, electric lamps, carpet, curtains, tapestries, plastic, concrete, neon, futuristic elements, low-poly, voxel, flat 2D sprite, cropped edges, walls cut off mid-room.
```

---

## 2. Island 1: Arche

> **Narrative Setting:** The island of foundations, about 8 km across. A 400 m limestone massif (Mount Phyle) fills the middle of the island, its foot some 5 km across. It stands squarely between every pair of the three trading houses, which sit at ~120° intervals round the coast: the **Dolphin** west-south-west, the **Vine** due north, and the **Anchor** east-south-east. Every straight line between two houses passes through the massif. A coastal ring road of **two stacked single-file cliff cuttings** joins them: the upper cutting runs sunwise only, the lower against the sun only, and there are no passing places. Reefs and tide-races off the headlands mean no small boat coasts from one cove to the next. On the mountain, four mercenary tents sit in the gullies at its foot and a ruined bandit wall crowns the peak. The books are set in the winter trading season, under low overcast. The island plate is nonetheless rendered in clear sunlight, because crisp directional shadows help the 3D generator read the geometry. Winter weather belongs in the scene prompts.
>
> **Why the island plate shows habitation.** It carries every book location in place, so the geography can be checked against the books in one image: a narrow coastal road rather than an inland one, ports spread round the coast, a steep broad mountain, and a walled summit.
>
> **No people, no animals.** At island scale a person or a mule is a blob of a few pixels, and the 3D conversion turns each one into wasted polygons. The island plate shows habitation and activity **only through objects**: laden carts, stacked cargo, moored ships, drying nets, tents and lofts. People and animals are added later, in the **scene prompts**, which are generated from renders of the island's 3D model at chosen camera positions.

### 2.1 Island Plate Prompt (Geography, Habitation & Book Locations)
```text
Detailed 3D isometric environment asset of the Greek island Arche, Hellenistic Mediterranean period (~3rd century BC), inhabited and working, as in the winter trading season.
High-angle orthographic axonometric projection, hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.

REMOVE ALL PEOPLE AND ANIMALS: zero people, zero human figures, zero sailors, zero soldiers, zero silhouettes, zero mules, zero horses, zero livestock, zero birds in flight. Show that the island is lived in and busy only through buildings, objects, vehicles at rest, cargo and ships.

Lighting & Weather:
Bright, clear, sunny daylight from a cloudless sky, sun high in the upper right, casting clean, well-defined shadows to the lower left that model every slope, spur, gully, cliff and building so the landform reads unambiguously.
CRISP, CLEAR AIR: dry, cold, perfectly transparent air with zero atmospheric haze, zero aerial perspective and zero fading with distance. Every part of the island, from the nearest quay to the farthest headland, is rendered with the same sharpness, full contrast and true colour. Clean whites, deep darks and saturated natural stone, foliage and terracotta; no milky, washed-out or grey veil over the image.
The sea is a clear, cool steel-blue and turquoise, with long swell lines. No cloud, mist or fog touches the terrain anywhere; the whole summit is fully visible.

Surrounding Ocean:
The island rests inside an expansive, continuous stretch of Aegean sea extending to all four frame edges. Flat natural water plane at sea level (Z = 0). Strictly NO cutaway box, NO acrylic glass slab, NO diorama pedestal, NO vertical water walls.
- Between the three coves, every headland is fringed with jagged reefs, submerged rocks and bands of white breaking surf and tide-rip, clearly impassable to small boats hugging the coast. Inside each cove the water is sheltered and calm.

Overall Layout & Scale:
- The island is roughly round, about 8 km across. Mount Phyle, a single 400 m limestone massif, fills the centre; its foot covers most of the island's interior, leaving only a narrow coastal strip.
- The three port villages sit at equal ~120-degree intervals round the coast: WEST-SOUTH-WEST (Dolphin), due NORTH (Vine), EAST-SOUTH-EAST (Anchor). No two ports are on the same side of the mountain. The massif stands squarely between every pair, so no port can see another.
- The long southern arc of coast between the Dolphin and the Anchor ends in a bold southern cape with a small ruined sundial platform on it.

Mount Phyle (natural massif with book locations):
- A broad, climbable mountain, not a tower. Its profile is a wide, irregular cone. The slopes rise continuously from the coastal strip to the peak: gentle lower flanks of about 15–20°, steepening to about 30–35° near the top. Nowhere is there a sheer vertical face encircling the summit, and nowhere a cliff band that would stop a man on foot. A determined climber could walk up any spur.
- Organic natural karst geomorphology: eight radiating wooded spurs separated by gullies. Rough limestone outcrops, broken crags, ledges and scree break through the scrub on the upper third, as scattered rocks on a slope, not as walls. Maritime pine, cypress and maquis cover the lower slopes. NO concentric rings, NO stepped tiers, NO artificial plateaus, NO mesa or tabletop, NO crater or caldera, NO switchback roads.
- The mountain is not a thoroughfare. There is no road over it and no made trail. Only two faint, rough goat paths climb two spurs to the wall's north slot and south gap, vanishing into scrub and scree lower down.
- Four mercenary camps at the foot, one at each quarter-point (N, E, S, W), each deep in its own wooded gully with two wooded spurs between any two camps, so none can see another. Each camp is exactly ONE small one-man linen tent in a tiny clearing, and nothing else: no second tent, no tower, no loft, no stilted structure, no palisade, no fire, no smoke. Four camps, four tents in total, spread evenly round the mountain.
- The summit crown: a modest rounded rocky top, an irregular jumble of pale limestone crags and clefts sitting on the slope rather than raised on a cliff, circled by a ruined cyclopean polygonal dry-stone wall with jagged tops and two breaches: a narrow rock slot on the north side and a wider timber-framed gap on the south. On the highest point sits the chief's hollow: a rock shelter with a few strongboxes and a bronze water-jar. Below the rim, three small separate lookout posts are tucked into three different crags, each facing a different approach and each hidden from the others and from the peak by rock, each with a small bronze water-jar. No council ring, no buildings, no roofs.

Coastal Ring Road (two stacked one-way cliff cuttings):
- Everywhere between the ports the road is a pair of narrow, single-file shelves cut one above the other into the face of pale limestone sea-cliffs, with the surf 20–40 m below. The upper and lower cuttings run parallel, a few metres apart vertically, joined only at the three ports.
- Each cutting is just wide enough for one cart. There are NO turnouts, NO passing bays and NO widenings anywhere between ports, and no inland shortcuts. The road hugs the coast the whole way round.
- Signs of traffic without people or animals: a few laden two-wheeled carts and handcarts standing in single file on the cuttings, all facing the same way on each shelf (upper shelf sunwise, lower shelf against the sun); loaded packsaddles and amphora racks waiting at cutting mouths; worn cart ruts.
- On the headlands above the road, small weathered stone sundials on plinths.
- At each port the two cuttings descend by rock ramps into the waterfront and pass through the quay.

Three Port Villages (inhabited, working, no people):
Compact organic clusters of Hellenistic vernacular buildings: dry-stone and ashlar cottages, boat sheds, pergolas, walled yards, oxblood terracotta roofs (no smoke, steam or haze anywhere). Evidence of work everywhere: stacked crates, sacks, amphorae and pithoi on the quays, fishing nets drying on frames, hauled-up boats, carts parked in yards, laundry lines, tethering posts, water cisterns, small kitchen gardens.
1. House of the Dolphin (WEST-SOUTH-WEST): a rugged fishing and trading haven on a rocky inlet with a stone quay and small boat basin. At its heart is the Dolphin's trade depot and tally station: an ashlar building with an open colonnaded loggia sheltering slate tally tables. Fishing skiffs and a small coastal sloop are moored; timber slipways hold one broad-beamed merchantman on a cradle.
2. House of the Vine (due NORTH): a wine and oil compound on terraces above a sheltered northern cove, with cellar vaults, timber cart-loading platforms and a beam press, and terraced vineyards and olive groves behind. A stone dock and slipway hold one broad-beamed merchantman. Just along the road from the Vine, cut into the cliff beside the cuttings, is the island's common dry storehouse: a rock-cut granary with a heavy timber door.
3. House of the Anchor (EAST-SOUTH-EAST): the largest harbour, on a crescent bay with a sandy beach and a long stone pier. At its heart is the customs house: broad colonnaded porticos, a records courtyard with slate tablets on stone pillars, and vaulted granaries. A large merchantman is tied at the pier, two more stand on timber slipways, and grain sacks, crates and sealed ingots are stacked on the wharf.

Vegetation & Palette:
Maritime pine, dark slender cypress, gnarled olive groves and vine terraces near the Vine, silver-green maquis, bare pale limestone higher up. Photorealistic PBR stone, timber, terracotta and water materials; muted, cool winter palette.
```

#### Island Plate Negative Prompt
(Used instead of the universal negative for the Arche plate, because the plate deliberately puts a ruined wall and tents on the mountain.)
```text
people, humans, person, human figures, crowd, pedestrians, sailors, soldiers, characters, silhouettes, animals, mules, donkeys, horses, oxen, livestock, dogs, birds in flight, road over the mountain, switchback road, summit road, trail network on mountain, sheer mountain faces, vertical cliffs on the mountain, cliff band around summit, rock tower, mesa, tabletop mountain, plateau summit, crater, caldera, walled bowl, unclimbable peak, wide road, two-lane road, passing bay, turnout, inland road, road away from the coast, ports close together, two ports on the same side, gentle rounded hill, grassy dome, council ring, stone seats in a circle, watchtower, lookout tower, tower on stilts, bird loft, multiple tents, tent pairs, tent clusters, encampment, summit buildings, roofed buildings on mountain, castle, fortress towers, palisade, campfire, smoke on mountain, flags, banners, beacon fire, cutaway, slab, diorama pedestal, glass edges, resin block, acrylic cube, vertical water walls, rectangular water box, tabletop diorama base, stepped ziggurat, concentric rings, tiered cake, circular cliff band, cylindrical rock wall, artificial plateau rings, amphitheater rings, circular terracing on mountain, perspective distortion, vanishing point, wide-angle lens, fish-eye, bokeh, shallow depth of field, tilt-shift blur, vignette, lens flare, overcast sky, grey sky, flat lighting, modern buildings, modern clothing, electricity wires, utility poles, tarmac roads, motorboats, cruise ships, whitewashed modern cycladic houses, blue painted shutters, plastic, concrete, neon, futuristic elements, low-poly, voxel, flat 2D sprite, cropped edges, cutoff island borders, horizon line, clouds covering terrain, mist, fog, haze, atmospheric haze, aerial perspective, depth fog, distance fade, washed-out colours, low contrast, milky veil, desaturated, grey cast, soft focus.
```

### 2.2 Architectural Features Prompts

#### Feature 0: Three Ports & Ships Composite (For use with attached Island Map Reference)
> The island plate (2.1) now carries the ports. Use this prompt only to refine the ports on an existing plate render. It must follow the plate's layout, overcast light and no-people rule.
```text
Isometric 3D environment composition of the Greek island Arche, Hellenistic Mediterranean period (~3rd Century BC), directly matching the attached island reference image.
High-angle orthographic axonometric projection, hyperfocal deep focus (NO_DOF), crisp fine geometry, 8k resolution.
Unpopulated clean stage: completely empty quays, decks, and streets, zero people, no human figures, no characters.

Reference Image Continuity:
Maintain the exact camera perspective, island coastline, ring road, mountain contours and lighting (soft, even, overcast winter light with no hard cast shadows) from the attached reference image. No people, no animals: show activity only through cargo, parked carts and moored ships.

Populate the three coastal port sites with their canonical Hellenistic hero trading architecture and ancient Greek merchant ships, fitting their exact geographic footprints:

1. West-South-West Port (Harbour of the Dolphin):
- Sited in the rectangular stone-lined harbour basin and open waterfront terrace from the reference image.
- Architecture: The House of the Dolphin—a sturdy, weathered ashlar limestone trade depot and tally station with low-pitched oxblood terracotta roofs, open exterior colonnaded loggia sheltering wide slate tally tables with bronze pegs and inkpots.
- Ships & Water: Moored inside the rectangular stone basin are 2-3 ancient Greek wooden fishing skiffs and a small coastal cargo sloop with timber mast and furled linen sail, tied with hemp ropes to stone mooring bollards; timber hauling slipways with greased log rollers leading into the water; drying linen nets and stacked wooden crates on the quays.

2. Northern Port (Harbour of the Vine):
- Sited along the L-shaped stone pier and cleared waterfront terrace beneath the terraced olive groves from the reference image.
- Architecture: The House of the Vine—an agricultural distribution wine compound with arched semi-subterranean limestone cellar vaults, heavy timber cart loading platforms, wooden ramps, and an outdoor timber beam olive/wine press.
- Ships & Water: 2 ancient Greek coastal wine transport barges with broad curved hulls and a round-hulled merchant galley tied alongside the L-shaped stone pier, rigged with furled sails and steering oars, loading wooden crates and rows of terracotta wine amphorae and oil pithoi directly from the stone dock.

3. East-South-East Port (Harbour of the Anchor):
- Sited along the wide crescent beach, long stone pier, and open flagstone esplanade from the reference image.
- Architecture: The House of the Anchor—a grand ashlar limestone customs house with broad colonnaded porticos, open records courtyard with slate tablets on stone pillars, and vaulted granary warehouses.
- Ships & Water: The main merchant harbour: a large, broad-beamed Hellenistic merchant sailing galley (holkas) with double steering oars and rigging tied alongside the outer end of the long stone pier; 2 smaller wooden cargo skiffs and sailing dinghies pulled up onto the sandy beach on timber hauling cradles; stacks of grain sacks, cargo crates, and sealed silver ingots arranged neatly on the stone wharf.

Cohesion:
All architecture and ships integrate seamlessly into the existing terrain, stone quays, and beaches of the attached image. Weathered limestone masonry, oxblood roof tiles, aged timber, calm turquoise shoals, continuous deep Aegean sea plane (Z = 0).
```

#### Three Ports & Ships Negative Prompt
```text
people, humans, person, human figures, crowd, pedestrians, bystanders, sailors, characters, silhouettes, modern ships, modern boats, motorboats, steamships, metal hulls, modern rigging, perspective distortion, vanishing point, wide-angle lens, fish-eye, bokeh, shallow depth of field, tilt-shift blur, vignette, lens flare, modern buildings, modern clothing, electricity wires, utility poles, tarmac roads, plastic, concrete, neon, futuristic elements, low-poly, flat 2D sprite, cropped edges, cutoff borders, horizon line, clouds covering terrain.
```

#### Feature 1: The Coastal Ring Road & Cliff Shelf
```text
Detailed 3D isometric architectural asset of the Coastal Ring Road of Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated environment, zero people.
Two narrow, single-file crushed-limestone roadways carved one above the other, a few metres apart, into the sheer face of a towering white limestone sea-cliff. The upper cutting carries traffic one way round the island and the lower the other way; each is exactly one cart wide.
The road is bounded on the seaward side by a low, dry-stone rubble retaining parapet, with crashing turquoise surf 30 metres below.
Clear stone cartwheel ruts worn into each roadbed; NO passing turnouts or widenings anywhere; natural rock overhangs sheltering the track; a few laden carts standing in single file, all facing the same way on each cutting. No people, no animals.
Pristine empty roadbed, dry earth and limestone dust, sparse tufts of wild thyme and caper bushes clinging to rock crevices.
```

#### Feature 2: The House of the Dolphin
```text
Detailed 3D isometric architectural diorama of the House of the Dolphin on Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated trade station, zero people.
Sited on a rugged, wave-battered western limestone shelf directly beside the sea.
A low-slung, sturdy commercial trade depot constructed of weathered ashlar limestone blocks with a low-pitched oxblood terracotta tiled roof and heavy cedar roof timbers.
Features timber hauling slipways with wooden greased log rollers leading into a small rocky sea inlet; carved stone mooring bollards; an open exterior colonnaded loggia sheltering wide slate tally tables with inkpots and bronze tally pegs; stacks of dried cod crates and amphorae; drying linen fishing nets draped over wooden railings.
Sea spray glistening on wet stone slipways, turquoise shallow water lapping at the quay, continuous flat sea plane.
```

#### Feature 3: The House of the Vine
```text
Detailed 3D isometric architectural diorama of the House of the Vine on Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated estate, zero people.
Sited on the northern terraced slopes of Mount Phyle overlooking the coastal cliff road.
A multi-level Hellenistic agricultural and distribution compound built of dry-stacked limestone retaining walls and dressed stone buildings with terracotta roofs.
Includes heavy timber loading platforms equipped with wooden ramps for carts; cool semi-subterranean cellars with arched limestone doorways filled with rows of large earthenware oil amphorae and wine pithoi; an outdoor timber beam lever-press for olives; stone paved courtyards; wooden cartwheel repair racks; stepped terraces planted with ancient gnarled olive trees and grape trellises.
```

#### Feature 4: The House of the Anchor & Customs Slipways
```text
Detailed 3D isometric architectural diorama of the House of the Anchor on Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated harbour facility, zero people.
Sited on the sheltered eastern bay of Arche where foreign merchantmen land.
A substantial ashlar limestone customs house and distribution depot with broad open colonnades and deep overhanging tiled eaves.
Features a massive squared-stone quay extending into deep azure water; large timber ship slipways holding two broad-beamed Hellenistic merchant sailing galleys drydocked on timber cradles; an open customs record courtyard containing large slate slates mounted on stone pillars; vaulted dry granary storehouses with raised timber floors; neatly stacked rows of cargo crates, grain sacks, and sealed silver ingots.
Calm turquoise harbor water, wooden mooring bollards, iron chains, and continuous open sea.
```

#### Feature 5: The Four Mercenary Camps (one tent each)
```text
Detailed 3D isometric architectural asset of an isolated Mercenary Camp at the base of Mount Phyle, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated military encampment, zero people.
Tucked into a steep, shadowed mountain ravine surrounded by dark cypress trees and sheer rock spurs.
A tiny natural clearing among the trees holds a single small one-man tent of coarse bleached linen, and at its mouth a shield, a wooden chest and one small, low wicker bird basket on the ground. That is the whole camp: one man's kit. NO second tent, NO tower, NO stilted loft, NO palisade, NO fire.
Completely hidden from view of any other camp, concealed by the mountain spurs. Austere and solitary.
```

#### Feature 6: The Bandit Crown, the Chief's Hollow & the Three Posts
```text
Detailed 3D isometric architectural asset of the Summit Crown of Mount Phyle, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated summit redoubt, zero people.
Situated on the flattened limestone peak 400 metres above the sea.
An ancient, ruined cyclopean polygonal dry-stone circuit wall with weathered, jagged top edges, featuring two distinct breaches: a narrow rock slot on the north side and a wider timber-framed opening on the south.
The crown inside the wall is not a court but a jumble of pale limestone crags and clefts. On the highest point is the chief's hollow: a rock shelter holding a few iron-bound strongboxes and one bronze water-jar (klepsydra) on a stone.
Below the rim, three small lookout posts are tucked into three separate crags, each facing a different approach (north slot, south gap, and the eastern cliffs), each with a low dry-stone breastwork, a bird perch and its own small bronze water-jar. Rock hides every post from the other two and from the peak.
NO council ring, NO circle of seats, NO roofs, NO banners, NO fire. Windswept scrub, wild grasses and weathered pale limestone.
```

---

## 3. Island 2: Paxos

> **Narrative Setting:** The island of sovereign civic consensus. An elongated limestone spine with dramatic vertical western sea-cliffs and gentle eastern slopes descending into olive groves and sheltered harbours. The civic heart contains the Chamber, a circular domed rotunda where the parliament of Paxos sits.

### 3.1 Island Plate Prompt (Geography, Habitation & the Chamber)
Like Arche's, the Paxos plate carries its buildings in place. It is made in three steps.

**Step 1 — plate** (text-to-image, `banana_pro`, aspect 16:9):
```text
Detailed 3D isometric diorama of the Greek island Paxos, Hellenistic Greece, 3rd century BC.
True orthographic axonometric view, deep focus, warm directional sunlight, zero people.
A long narrow limestone island running north to south, set in calm deep Aegean blue sea that reaches every frame edge, turquoise shoals and white surf at the shore; no pedestal, no cutaway.
West coast: sheer white limestone sea-cliffs with sea-caves.
East side: gentle slopes of terraced olive groves, goat pasture, cypresses and maquis down to sheltered coves.
On a level civic terrace above the main eastern bay stands a single circular domed rotunda of white ashlar limestone ringed by a Doric colonnade, with evenly spaced doorways and statues round it; a paved road crosses the terrace past it.
Below, a small harbour town of red-tiled stone houses, a market square, quays and moored merchant ships.
Farmsteads along one road running the length of the island.
No theatre, no citadel, no quarry, no ruins.
```

**Step 2 — town pass** (image-to-image on the step 1 image, `banana_pro`, aspect 16:9). Small, tightly packed houses reconstruct in 3D as tall blocks, so the town is redrawn as low courtyard houses before conversion:
```text
Keep [image 1] exactly as it is: the same island, cliffs, sea, rotunda, road, olive terraces, trees, farmsteads, quays, ships, camera and lighting.
Change only the harbour town: replace its houses with low single-storey Hellenistic courtyard houses of rough limestone, each a squat box with a shallow red-tiled roof and a small open courtyard, spaced a little apart with narrow lanes between them, clearly no taller than they are wide.
No multi-storey buildings anywhere.
Zero people.
```

**Step 3 — layout.** A Meshy image-to-3D conversion of this plate (archived at `art/archive/paxos-3d.glb`) supplies the layout — coastline, ground, woods, groves, town and road — that `art/paxos/build/` samples and builds on at real scale. The built island is `art/paxos/paxos-built.glb`, loaded by `explorer.html`.

### 3.2 Architectural Features Prompts

#### Feature 1: The Chamber (a rotunda)
```text
Detailed 3D isometric architectural diorama of The Chamber on Paxos, the parliament's assembly hall, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated monument, zero people.
A circular civic assembly hall (a rotunda) built of finely dressed white ashlar limestone.
Surrounded by an unbroken outer colonnaded peristyle of fluted Doric limestone columns supporting a classical entablature.
Roofed with a smooth, hard hemispherical ashlar stone dome crowned by an open circular bronze-rimmed oculus at the apex; bare reflective stone surfaces inside, no hangings or wooden panelling.
A stepped circular stone plinth (crepidoma) surrounds the base. Several open doorways spaced evenly around the circular drum, none of them grander than the others, so there is no front entrance.
Paved concentric circular interior flagstone floor with no podium, no speaker's platform, no head of the room, and no seating facing any single point; low stone benches follow the curve of the wall.
Set on a paved limestone public terrace crossed by a road, with marble statues on tall pedestals standing just outside the doorways, and slender Italian cypress trees.
```

#### Feature 1a: The Chamber — Interior
The dome is lifted away. The room carries Lamport's Chamber exactly: no point from which anyone could address the room, one ledger per legislator and no shared record, doorways all round because legislators and messengers come and go, and a meridian line because Paxons tell time by the sun.
```text
Isometric 3D interior model of the Chamber on Paxos, a Hellenistic Greek parliament hall.
Orthographic axonometric view, deep focus, zero people.
The dome is lifted away to show the whole interior.
A circular hall about 30 m across; bare dressed white limestone walls, hard and echoing, no hangings or panelling.
Identical open doorways spaced evenly round the wall: no front, no podium, no head of the room, nothing at the centre.
Concentric flagstone floor with a bronze meridian line inlaid where sunlight from the oculus falls, marked with hours.
Round the wall, a ring of identical low stone benches, each with a small wooden writing desk, an inkpot and a closed leather-bound ledger.
No shelves, archive or shared record anywhere.
A plain wooden bench for messengers beside each doorway.
Warm daylight, photorealistic PBR stone, bronze and wood.
```

---

## 4. Island 3: Skene

> **Narrative Setting:** The island of the stage: a small sovereign island, separate from Paxos, that governs itself from one theatre. A compact rounded island of limestone hills around a single sheltered bay, with a natural hillside bowl above the harbour town where the Odeon stands.

### 4.1 Natural Geography and Clearings Prompt
```text
Detailed 3D isometric terrain asset of a small Greek island, Hellenistic Mediterranean setting.
High-angle orthographic axonometric projection, hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.
Completely unpopulated natural landscape, pristine empty clearings, no buildings, zero people, no figures.

Surrounding Ocean:
The island rests naturally inside an expansive, continuous stretch of calm deep Aegean blue sea extending to all edges of the frame. Realistic turquoise coastal shoals and white surf wrap naturally around the limestone shorelines. Flat natural water plane at sea level. Strictly NO cutaway box, NO acrylic glass slab, NO diorama pedestal, NO vertical water walls.

Macro-Topography:
A compact, rounded island of low limestone hills enclosing one deep, sheltered, horseshoe-shaped bay on its eastern side.

Natural Clearings:
- Harbour flat: a level shelf at the head of the bay (clearing for the harbour town).
- Natural hillside amphitheater bowl: a semicircular concave slope carved naturally into the hillside directly above the harbour flat, facing the bay (clearing for the Odeon).

Vegetation:
Terraced olive groves with pale silvery-green foliage, stands of tall dark-green Italian cypresses, wild maquis scrub, and exposed white limestone pavement. Warm directional sunlight, photorealistic PBR materials.
```

### 4.2 Architectural Features Prompts

#### Feature 1: The Odeon
```text
Detailed 3D isometric architectural diorama of The Odeon on Skene, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated theatre hall, zero people.
Built into the natural hillside bowl above Skene's sheltered bay.
A roofed theatre hall: a large near-square limestone building whose single timber-trussed, oxblood terracotta-tiled roof covers both the semicircular raked seating inside and the raised stage, with a row of tall clerestory windows along each side wall.
A colonnaded Doric porch runs across the front facing the bay, with broad doors into the hall; the rear of the building is set into the slope, following the rake of the seats within.
Surrounded by dry-stone retaining terraces, paved stone ramps, and silver-green olive trees.
```

#### Feature 1a: The Odeon — Interior
The roof is lifted away. Everything faces one stage: the legislators' thrones in the front row, each with its law book, and the public's benches behind. The board on the stage wall is for the number of the current speaker's term.
```text
Isometric 3D interior model of the Odeon on Skene, a roofed Hellenistic Greek theatre hall.
Orthographic axonometric view, deep focus, zero people.
The timber roof is lifted away to show the whole interior.
Semicircular raked stone benches for the public rise from a flat semicircular orchestra floor to the back wall; every seat faces one raised stone stage.
The front row is a single curve of identical carved marble thrones with backs (proedria) for the legislators, each with a small stone reading stand holding a closed law book.
The stage is a plain raised platform with one marked speaking spot at its centre, side steps up from the orchestra at both ends, and a blank painted wooden board on its back wall for a number.
Tall clerestory windows in the side walls.
Warm daylight, photorealistic PBR stone, marble and timber.
```

---

## 5. Island 4: Homonoia

> **Narrative Setting:** The island of scholars and copyists, which holds no assembly: its copies may differ for a while, so long as they agree in the end. Lower-profile, highly indented coastline with turquoise lagoons, sea-coves, pebble beaches, and remote hillside terraces. Features the stoa and festival ground, the ring of libraries round the lagoon, the wax scriptorium on the beach, the courier cove where letters land, and the far terraces.

### 5.1 Natural Geography and Clearings Prompt
```text
Detailed 3D isometric terrain asset of the Greek island Homonoia, Hellenistic Mediterranean archipelago setting.
High-angle orthographic axonometric projection, hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.
Completely unpopulated natural landscape, pristine empty clearings, no buildings, zero people, no figures.

Surrounding Ocean:
The island rests naturally inside an expansive, continuous stretch of calm deep Aegean blue sea extending to all edges of the frame. Highly intricate turquoise coastal lagoons, shallow shoals, sandbars, and submerged sea-reefs wrap naturally around the shorelines. Flat natural water plane at sea level. Strictly NO cutaway box, NO acrylic glass slab, NO diorama pedestal, NO vertical water walls.

Macro-Topography:
A lower-profile, deeply indented island of rolling limestone hills, gentle valleys, and highly convoluted shorelines.
- Main eastern harbour: a large, sheltered natural bay with turquoise water and gentle gravel shores.
- Saltwater lagoon basin: a naturally enclosed, nearly circular sea lagoon connected to the open water by a narrow rocky throat.
- Southern shore: a broad, gently curving crescent bay with golden sand and calm water.
- Western courier cove: a small, deeply indented rocky fjord-like cove sheltered from open swell.
- Southwestern hills: steep, remote coastal slopes facing out toward the endless open sea, isolated from the rest of the island by rocky ridges.

Natural Clearings:
- Flat waterfront esplanade clearing along the main harbour (clearing for the Stoa and Festival Ground).
- Circular shore fringe clearing enclosing the saltwater lagoon (clearing for the Ring of Libraries).
- Wide sand and pebble crescent beach clearing (clearing for the Wax Scriptorium).
- Level rock-cut platform at the head of the courier cove (clearing for the Courier Landing).
- Elaborate hillside tiers cleared on the far southwestern slopes (clearing for the Far Terraces).

Vegetation:
Abundant silvery-green olive orchards, aromatic maquis and phrygana scrub, dry golden summer grasses, and clusters of Italian cypress trees. Warm directional sunlight, photorealistic PBR limestone and soil.
```

### 5.2 Architectural Features Prompts

#### Feature 1: The Stoa & Festival Ground
```text
Detailed 3D isometric architectural diorama of The Stoa and Festival Ground on Homonoia, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated civic space, zero people.
Sited on the main eastern bay waterfront.
A long two-storey colonnaded stoa of pale limestone with a terracotta roof runs along the harbour front, its back wall lined with carved stone benches, wooden boards pinned thick with small scraps of papyrus, and niches holding rolled papyrus scrolls; a bronze armillary sphere and a painted diagram of the Sun at the centre with the Earth circling it stand on a plinth at the middle of the colonnade.
In front of it, an open festival ground of beaten earth and flagstones set with rows of long plain wooden collation tables, paired facing each other, each with two scroll rests, oil lamps and inkpots.
Stone quays with wooden mooring posts and small courier boats moored alongside; calm turquoise water.
```

#### Feature 2: The Ring of Libraries
```text
Detailed 3D isometric architectural diorama of The Ring of Libraries on Homonoia, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated scholarly precinct, zero people.
A completely sheltered, circular natural saltwater lagoon connected to the sea by a narrow stone-flanked channel.
The perimeter of the circular basin is ringed by an unbroken, symmetric circle of exactly twelve identical small limestone library buildings.
Each library has a small columned porch, a pitched oxblood terracotta tile roof, a heavy timber double door standing open onto walls of wooden pigeonhole shelves (armaria) filled with rolled scrolls, a small side room with a sorting shelf of letter pigeonholes and a reading table, and its own short stone landing stage into the calm green-blue basin water.
A continuous stone perimeter walkway connects all twelve buildings in an unbroken ring.
```

#### Feature 3: The Wax Scriptorium
```text
Detailed 3D isometric architectural diorama of The Wax Scriptorium on Homonoia, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated beach workshop, zero people.
Sited along a broad, curving crescent beach of golden sand and smooth pebbles lapped by calm turquoise water.
Lined along the high-water mark are long, open-sided timber scribe pavilions with reed-thatch roofs supported by cedar posts.
Features extensive rows of wooden racks holding black and red beeswax writing tablets; bronze kettles over cold stone hearths for melting wax; low wooden scribe desks with bronze styluses; and, at one end, a separate enclosed ink room with shelves of finished papyrus rolls and reed pens.
Clean sandy ground, wooden boardwalks, and gentle sea lapping the shore.
```

#### Feature 4: The Courier Landing
```text
Detailed 3D isometric architectural asset of The Courier Landing on Homonoia, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated landing, zero people.
Tucked into a steep, narrow rocky cove sheltered by high limestone cliffs.
Features stone moorings and timber piers where swift courier boats are tied, a small open-sided shelter with benches, and paved stone paths climbing out of the cove toward the libraries.
No sorting building here: letters are sorted in each library, not at the landing.
Rugged sea-cliff backdrop.
```

#### Feature 5: The Far Terraces (Tally Pebbles)
```text
Detailed 3D isometric architectural asset of The Far Terraces on Homonoia, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated terraces, zero people.
Carved into steep, remote southwestern limestone hillsides facing out toward the open, unbroken horizon of the sea.
A dramatic flight of dry-stone retaining walls creating narrow, stepped terraces planted with wild olive trees.
Set upon each terrace are long stone counting tables divided into twelve parallel shallow troughs, one column per library, each holding neat mounds of black and white voting pebbles; small inscribed stone markers head each column.
Windswept, quiet, meditative landscape far from all cities and assemblies.
```

---

## 6. Island 5: Boule / Mesonisi (The Council Islet — The Adjudicator)

> **Narrative Setting:** The small intermediate rock sitting in the open channel between Paxos and Homonoia. It houses the CALM theorem: the single architectural building that adjudicates whether a decree requires parliamentary consensus or can proceed coordination-free.

### 6.1 Natural Geography and Clearings Prompt
```text
Detailed 3D isometric terrain asset of the Council Islet Boule (Mesonisi), Hellenistic Aegean setting.
High-angle orthographic axonometric projection, hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.
Completely unpopulated natural islet, pristine empty clearing, no buildings, zero people, no figures.

Surrounding Ocean:
The solitary islet sits naturally in the centre of an expansive, continuous stretch of deep Aegean blue sea extending to all edges of the frame. White surf breaks against submerged rocky reefs and jagged limestone sea-ledges around the islet base. Flat natural water plane at sea level. Strictly NO cutaway box, NO acrylic glass slab, NO diorama pedestal, NO vertical water walls.

Macro-Topography:
A steep, solitary limestone crag rising dramatically out of open water.
The islet features rugged, stepped rock faces on all flanks, culminating in a small, level flattened limestone rock plateau at the central crest.
A natural winding path ascends from a sheltered rock-cut boat notch at sea level up to the crest plateau.

Vegetation:
Hardy Mediterranean vegetation adapted to sea salt and wind: gnarled wild olive trees clinging to crevices, wind-stunted pine trees, and aromatic thyme scrub. Warm directional sunlight, photorealistic PBR rock materials.
```

### 6.2 Architectural Feature Prompt: The Hall of Two Doors
```text
Detailed 3D isometric architectural diorama of The Hall of Two Doors on Boule, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated temple-hall, zero people.
Perched upon the highest crest of the solitary rocky islet.
A winding monumental stone stairway cut into the living rock ascends from a small sea-level stone boat slip to the summit.
Dominating the crest stands The Hall of Two Doors: an elegant, perfectly symmetrical Hellenistic temple-like hall built of pale dressed ashlar limestone with an oxblood terracotta tiled gabled roof.
The defining architectural feature is two prominent, opposing monumental portal doorways on opposite facades:
- The Western Portal: facing west toward Homonoia, framed with simple, unadorned rustic stone lintels.
- The Eastern Portal: facing east toward Paxos and Skene, the islands that assemble, framed with classical fluted pilasters and a carved pediment.
Both massive bronze doors stand wide open, revealing an open, sunlit stone interior hall paved with alternating white and black marble tiles.
Surrounded by low stone parapets, gnarled wild olive trees, and breathtaking views of the surrounding deep blue Aegean sea.
```

---

## 7. Image-to-3D Reconstruction Guidelines

When processing these 2D isometric renders through neural 3D generators — Meshy (web UI) is the one to use; Tripo's conversions are far worse:
1. **Sea Level Plane Alignment ($Z = 0$):** Because the water extends continuously across the frame, the sea acts as a ground reference plane. Neural depth models (Marigold/ZoeDepth) reconstruct the water as a uniform planar baseline.
2. **Mesh Generation Parameters:**
   - **Target Polycount:** 300,000 – 800,000 triangles for island terrains.
   - **Base Mode:** Plane-clipped at sea level ($Z=0$), eliminating the need to carve away thick vertical resin pedestal walls.
   - **Texture Resolution:** 4096×4096 PBR (Albedo, Roughness, Normal).
