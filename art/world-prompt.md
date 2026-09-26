# Hellenistic Archipelago: Island Generation Prompts (Image-to-3D)

This document provides modular, high-fidelity generation prompts for the islands and architectural landmarks of **Distributed Algorithms of Ancient Greece (DAAG)**, engineered for **isometric 3D generation** and **image-to-3D reconstruction** (e.g. Trellis, Tripo3D, Rodin, CSM, Meshy).

Rather than a single monolithic world prompt, this specification provides:
1. **Universal Pipeline Directives & Negative Prompts** ensuring watertight 3D reconstruction.
2. For each island:
   - **One Natural Geography & Clearings Prompt** establishing pristine terrain, coastline, and unbuilt settlement clearings. *(Arche's and Paxos's are full island plates carrying their buildings and book locations; see 2.1 and 3.1.)*
   - **A Set of Focused Architectural Prompts** capturing individual structures, houses, and civil engineering landmarks.

**The island 3D models are Meshy image-to-3D conversions of the island plates** (`art/arche-3d.glb`, `art/paxos-3d.glb`), loaded by `explorer.html` and rendered for previs by `art/previs/render.py`. The prompts here are the visual brief, and the source for scene images.

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

> **Narrative Setting:** The island of foundations, about 8 km across. A 400 m limestone massif (Mount Phyle) fills the middle of the island, its foot some 5 km across. It stands squarely between every pair of the three trading houses, which sit at ~120° intervals round the coast: west-south-west, due north and east-south-east. Every straight line between two houses passes through the massif. A coastal ring road of **two stacked single-file cliff cuttings** joins them: the upper cutting runs sunwise only, the lower against the sun only, and there are no passing places. Reefs and tide-races off the headlands mean no small boat coasts from one cove to the next. On the mountain, four gullies at its foot hold the mercenaries' camps (their tents are props, added to scenes) and a ruined bandit wall crowns the peak. The books are set in the winter trading season, under low overcast. The island plate is nonetheless rendered in clear sunlight, because crisp directional shadows help the 3D generator read the geometry. Winter weather belongs in the scene prompts.
>
> **Why the island plate shows habitation.** It carries every book location in place, so the geography can be checked against the books in one image: a narrow coastal road rather than an inland one, ports spread round the coast, a steep broad mountain, and a walled summit.
>
> **No people, no animals.** At island scale a person or a mule is a blob of a few pixels, and the 3D conversion turns each one into wasted polygons. The island plate shows habitation and activity **only through objects**: laden carts, stacked cargo, moored ships, drying nets, tents and lofts. People and animals are added later, in the **scene prompts**, which are generated from renders of the island's 3D model at chosen camera positions.

### 2.1 Island Plate Prompt (Geography, Habitation & Book Locations)
The Arche plate is made from a top-down map, so the layout can be checked before any picture is made. The model `art/arche-3d.glb` is the Meshy conversion of the result.

**Step 1 — map** (text-to-image, `banana_pro`, square, with `art/refs/arche-model-top.png`, a straight-down render of the previous model, attached for proportions). Gemini keeps the ports at the model's diorama scale but draws the road as an inland loop:
```text
A clean top-down cartographic map of the Greek island Arche, drawn straight down from directly above with north at the top of the frame: contour lines for the terrain and solid building blocks for everything built. A plan for architects, not a picture: no perspective, no shading, no textures, no trees drawn as trees.

The attached image is a straight-down render of the island as it exists now. Take the overall proportions from it: how big each port is against the whole island (each port's buildings, quays and piers take up roughly a third of the coast on its side of the island), how big the buildings are, the width of the coastal road, and the naturally irregular shoreline round each harbour. The map corrects its layout as described below.

Style:
- White or very pale paper background; the sea a flat pale blue.
- Coastline: one crisp dark line, jagged and broken like a real Aegean island: narrow rocky points of uneven length, small coves and inlets, and irregular natural harbour shorelines at the three ports, never a smooth curve.
- Terrain: thin brown contour lines at even height intervals, closer together where the slope is steeper. No hill shading, no colour tints.
- Buildings: solid terracotta-red blocks seen from above, each its own simple footprint (rectangles, L-shapes, courtyard squares). Quays, piers and slipways: solid grey. The road: a dark red double line.
- Terraces: a light hatch. Goat paths: thin dashed lines.
- No text, no labels, no legend, no scale bar, no north arrow, no compass rose, no border.

Terrain (Mount Phyle):
- One broad limestone mountain fills the middle of the island, leaving a coastal strip all round for the road and the ports. Its single small summit is in the exact centre of the island.
- Eight spurs radiate from the summit like the spokes of a wheel, drawn as contour lines bulging outward; between them eight gullies, drawn as contour lines bending inward toward the summit. Four of the gullies point exactly north, east, south and west. The spurs are natural and uneven, each a different length and width, not a perfect star.
- The slopes are continuous natural hillsides: no terraces on the mountain, no plateaus, no cliff rings, no craters.
- The mountain stands between every pair of ports: a straight line from any port to any other crosses the mountain's upper slopes.
- The four gullies at north, east, south and west are empty: nothing built in them.

The crown: a small ruined ring wall round a few crags on the very summit, about the size of the largest building in the ports, with a narrow gap on its north side and a wider gap on its south side. Three tiny separate blocks sit just below the wall on different sides, and one tiny block in the middle of the ring. Two faint dashed goat paths climb two different spurs to the two gaps and fade out halfway down the mountain.

Coastal road: two parallel single-file cuttings drawn as a dark red double line, running right round the island close to the coast, with no branches, no inland roads and no road over the mountain.

The three ports, each on its own side of the island so that no two share a side:
1. The port WEST-SOUTH-WEST: a rocky inlet with a long stone quay along the waterfront, one slipway, a large trade depot and a colonnaded tally hall facing the quay, and a village of small house blocks behind them.
2. The port due NORTH: a sheltered cove with a short stone dock and one slipway, a large wine and oil compound with a press house, a village of small house blocks, and hatched vine and olive terraces on the lower slopes to either side of the village (not directly behind it, where the north gully is). Just along the road east of the village, one small block cut into the cliff beside the road: the rock-cut granary.
3. The port EAST-SOUTH-EAST, the largest: a crescent bay with a sandy beach, a long stone pier running straight out into the bay, two slipways, a large customs house built round a courtyard, a long granary block, and a village of small house blocks.
On the southern cape, between the west-south-west and east-south-east ports, one small square block beside the road: the sundial platform.

THE ROAD REACHES EVERY PORT. At each port the double line comes down to the waterfront and runs straight along it, past the quay or pier. Every quay, pier and slipway touches the road on its landward end; every building block stands on or directly beside the road, or within its village, whose lanes lead to the road. No block, quay or pier stands apart from the road or is cut off from it by cliff, slope or water.
```

**Step 2 — road fix.** `python3 art/refs/arche_map_fix_road.py art/refs/arche-map-gemini.png art/refs/arche-map.png` erases Gemini's road and draws the two cuttings a short, even distance inside the coast, keeping Gemini's line through the three ports. It removes stray blocks outside the ports, adds the rock-cut granary and the sundial platform, and checks that the road crosses no building and that every quay meets it. Gemini will not move the road in an edit.

**Step 3 — plate** (image-to-image, `banana_pro`, square, with `art/refs/arche-map.png` attached). Gemini follows the map's viewpoint, so the result is straight down:
```text
Detailed 3D isometric environment asset of the Greek island Arche, Hellenistic Mediterranean period (~3rd century BC), inhabited and working, as in the winter trading season.
A high oblique aerial view from the south, looking north and down at about 55 degrees, so the whole island fits the frame and the mountain's relief reads clearly; hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.

The attached map is the island's plan, drawn from directly above with north at the top. Follow it exactly: the jagged coastline and the irregular harbour shores; the brown contour lines, which give the mountain's shape (lines close together are steep, and the summit ring is the top); the position, size and footprint of every terracotta building block (buildings) and grey block (quays, piers, slipways); the hatched areas (vine and olive terraces); and the dark red double line (the ring road's two cuttings). The contour lines show height only: the slopes are continuous and natural, with no terraces, steps or rings except where the map is hatched.

THE ROAD REACHES EVERY PORT, as on the map: at each of the three ports it runs along the waterfront, and every quay, pier and building stands on or directly beside it. No port, building, pier or quay stands apart from the road or is cut off from it by cliff or water.

The summit crown is exactly the size of the ring on the map: small, about the size of the largest building in the ports, a ruined wall round a few crags on the very top. The map has no text; add none.

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
- The three port villages sit at equal ~120-degree intervals round the coast: WEST-SOUTH-WEST, due NORTH and EAST-SOUTH-EAST. No two ports are on the same side of the mountain. The massif stands squarely between every pair, so no port can see another.
- The long southern arc of coast between the west-south-west and east-south-east ports ends in a bold southern cape with a small ruined sundial platform on it.

Mount Phyle (natural massif with book locations):
- A broad, climbable mountain, not a tower. Its profile is a wide, irregular cone. The slopes rise continuously from the coastal strip to the peak: gentle lower flanks of about 15–20°, steepening to about 30–35° near the top. Nowhere is there a sheer vertical face encircling the summit, and nowhere a cliff band that would stop a man on foot. A determined climber could walk up any spur.
- Organic natural karst geomorphology: eight radiating wooded spurs separated by gullies. Rough limestone outcrops, broken crags, ledges and scree break through the scrub on the upper third, as scattered rocks on a slope, not as walls. Maritime pine, cypress and maquis cover the lower slopes. NO concentric rings, NO stepped tiers, NO artificial plateaus, NO mesa or tabletop, NO crater or caldera, NO switchback roads.
- The mountain is not a thoroughfare. There is no road over it and no made trail. Only two faint, rough goat paths climb two spurs to the wall's north slot and south gap, vanishing into scrub and scree lower down.
- Four deep wooded gullies at the foot, one at each quarter-point (N, E, S, W), each between two wooded spurs, with two spurs between any two of these gullies. The gullies are empty wooded clefts with nothing built in them.
- The summit crown: a modest rounded rocky top, an irregular jumble of pale limestone crags and clefts sitting on the slope rather than raised on a cliff, circled by a ruined cyclopean polygonal dry-stone wall with jagged tops and two breaches: a narrow rock slot on the north side and a wider timber-framed gap on the south. On the highest point sits the chief's hollow: a rock shelter with a few strongboxes and a bronze water-jar. Below the rim, three small separate lookout posts are tucked into three different crags, each facing a different approach and each hidden from the others and from the peak by rock, each with a small bronze water-jar. No council ring, no buildings, no roofs.

Coastal Ring Road (two stacked one-way cliff cuttings):
- Everywhere between the ports the road is a pair of narrow, single-file shelves cut one above the other into the face of pale limestone sea-cliffs, with the surf 20–40 m below. The upper and lower cuttings run parallel, a few metres apart vertically, joined only at the three ports.
- Each cutting is just wide enough for one cart. There are NO turnouts, NO passing bays and NO widenings anywhere between ports, and no inland shortcuts. The road hugs the coast the whole way round.
- Signs of traffic without people or animals: a few laden two-wheeled carts and handcarts standing in single file on the cuttings, all facing the same way on each shelf (upper shelf sunwise, lower shelf against the sun); loaded packsaddles and amphora racks waiting at cutting mouths; worn cart ruts.
- On the headlands above the road, small weathered stone sundials on plinths.
- At each port the two cuttings descend by rock ramps into the waterfront and pass through the quay.

Three Port Villages (inhabited, working, no people):
Compact organic clusters of Hellenistic vernacular buildings: dry-stone and ashlar cottages, boat sheds, pergolas, walled yards, oxblood terracotta roofs (no smoke, steam or haze anywhere). Evidence of work everywhere: stacked crates, sacks, amphorae and pithoi on the quays, fishing nets drying on frames, hauled-up boats, carts parked in yards, laundry lines, tethering posts, water cisterns, small kitchen gardens.
1. The west-south-west house: a rugged fishing and trading haven on a rocky inlet with a stone quay and small boat basin. At its heart is the house's trade depot and tally station: an ashlar building with an open colonnaded loggia sheltering slate tally tables. Fishing skiffs and a small coastal sloop are moored; timber slipways hold one broad-beamed merchantman on a cradle.
2. The north house: a wine and oil compound on terraces above a sheltered northern cove, with cellar vaults, timber cart-loading platforms and a beam press, and terraced vineyards and olive groves behind. A stone dock and slipway hold one broad-beamed merchantman. Just along the road from the house, cut into the cliff beside the cuttings, is the island's common dry storehouse: a rock-cut granary with a heavy timber door.
3. The east-south-east house: the largest harbour, on a crescent bay with a sandy beach and a long stone pier. At its heart is the customs house: broad colonnaded porticos, a records courtyard with slate tablets on stone pillars, and vaulted granaries. A large merchantman is tied at the pier, two more stand on timber slipways, and grain sacks, crates and sealed ingots are stacked on the wharf.

Vegetation & Palette:
Maritime pine, dark slender cypress, gnarled olive groves and vine terraces near the north port, silver-green maquis, bare pale limestone higher up. Photorealistic PBR stone, timber, terracotta and water materials; muted, cool winter palette.
```

**Step 4 — tilt** (image-to-image on the step 3 image, `banana_pro`, square). Meshy reads heights far better from an oblique view; the result is `art/refs/arche-plate.png`:
```text
Re-render [image 1] from a different camera, changing nothing about the island itself.

Camera: a high oblique aerial view from the south, looking north across the island and down at about 45 degrees, like a photograph from a low-flying aircraft. The southern coast is nearest, the northern port farthest; north stays at the top of the frame. The whole island fits the frame with a margin of sea all round, and the sea reaches every edge of the frame. No pedestal, no cutaway, no diorama base.

Because the view is now at an angle, show the island's height truthfully: the sheer limestone sea-cliffs along the coast with the road cut into them, the mountain rising in continuous slopes from the coastal strip to the small walled summit, the spurs as ridges and the gullies as clefts between them, and every building and quay seen in three-quarter view with walls as well as roofs.

Keep everything exactly as it is in [image 1]: the coastline and its rocky points, the three ports with every building, quay, pier and ship in place, the road running along the coast and through each port, the terraces, the woods and scrub, the summit ring, the rock-cut granary and the sundial platform. Same bright, clear sunlight and crisp air. Zero people, zero animals, no text.
```

**Step 5 — 3D.** A Meshy image-to-3D conversion of the tilted plate, downloaded without resizing, is `art/arche-3d.glb`. `explorer.html` and `art/previs/render.py` place it at 95 m per model unit, a scale set by eye from a person beside the west-south-west depot, and turn it 20° so the north port is due north.

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

1. West-South-West Port (harbour of the west-south-west house):
- Sited in the rectangular stone-lined harbour basin and open waterfront terrace from the reference image.
- Architecture: the house—a sturdy, weathered ashlar limestone trade depot and tally station with low-pitched oxblood terracotta roofs, open exterior colonnaded loggia sheltering wide slate tally tables with bronze pegs and inkpots.
- Ships & Water: Moored inside the rectangular stone basin are 2-3 ancient Greek wooden fishing skiffs and a small coastal cargo sloop with timber mast and furled linen sail, tied with hemp ropes to stone mooring bollards; timber hauling slipways with greased log rollers leading into the water; drying linen nets and stacked wooden crates on the quays.

2. Northern Port (harbour of the north house):
- Sited along the L-shaped stone pier and cleared waterfront terrace beneath the terraced olive groves from the reference image.
- Architecture: the house—an agricultural distribution wine compound with arched semi-subterranean limestone cellar vaults, heavy timber cart loading platforms, wooden ramps, and an outdoor timber beam olive/wine press.
- Ships & Water: 2 ancient Greek coastal wine transport barges with broad curved hulls and a round-hulled merchant galley tied alongside the L-shaped stone pier, rigged with furled sails and steering oars, loading wooden crates and rows of terracotta wine amphorae and oil pithoi directly from the stone dock.

3. East-South-East Port (harbour of the east-south-east house):
- Sited along the wide crescent beach, long stone pier, and open flagstone esplanade from the reference image.
- Architecture: the house—a grand ashlar limestone customs house with broad colonnaded porticos, open records courtyard with slate tablets on stone pillars, and vaulted granary warehouses.
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

#### Feature 2: The west-south-west house
```text
Detailed 3D isometric architectural diorama of the west-south-west trading house on Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated trade station, zero people.
Sited on a rugged, wave-battered western limestone shelf directly beside the sea.
A low-slung, sturdy commercial trade depot constructed of weathered ashlar limestone blocks with a low-pitched oxblood terracotta tiled roof and heavy cedar roof timbers.
Features timber hauling slipways with wooden greased log rollers leading into a small rocky sea inlet; carved stone mooring bollards; an open exterior colonnaded loggia sheltering wide slate tally tables with inkpots and bronze tally pegs; stacks of dried cod crates and amphorae; drying linen fishing nets draped over wooden railings.
Sea spray glistening on wet stone slipways, turquoise shallow water lapping at the quay, continuous flat sea plane.
```

#### Feature 3: The north house
```text
Detailed 3D isometric architectural diorama of the north trading house on Arche, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated estate, zero people.
Sited on the northern terraced slopes of Mount Phyle overlooking the coastal cliff road.
A multi-level Hellenistic agricultural and distribution compound built of dry-stacked limestone retaining walls and dressed stone buildings with terracotta roofs.
Includes heavy timber loading platforms equipped with wooden ramps for carts; cool semi-subterranean cellars with arched limestone doorways filled with rows of large earthenware oil amphorae and wine pithoi; an outdoor timber beam lever-press for olives; stone paved courtyards; wooden cartwheel repair racks; stepped terraces planted with ancient gnarled olive trees and grape trellises.
```

#### Feature 4: The east-south-east house & customs slipways
```text
Detailed 3D isometric architectural diorama of the east-south-east trading house on Arche, Hellenistic Ancient Greece.
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

### 2.3 Characters: told apart by colour

The mercenaries and the bandits are each one kind of figure. Several models of a kind are fine for
visual interest, but a figure is told apart only by the colour of its tunic and cloak, never by a
face, build, age, sex, hair, pelt or other defining feature. The sheets in `art/refs/sheets.json`
use these colours, and previs shots pass the same RGB as a figure's `tint`.

| Figure | Colour | Tint |
|---|---|---|
| Mercenary 1 | ochre yellow | [0.72, 0.52, 0.16] |
| Mercenary 2 | deep blue | [0.12, 0.22, 0.52] |
| Mercenary 3 | oxblood red | [0.45, 0.08, 0.08] |
| Mercenary 4 | olive green | [0.33, 0.38, 0.14] |
| Bandit 1, the chief | purple | [0.36, 0.14, 0.40] |
| Bandit 2 | slate grey | [0.38, 0.40, 0.43] |
| Bandit 3 | saffron orange | [0.88, 0.50, 0.10] |
| Bandit 4 | chestnut brown | [0.40, 0.22, 0.12] |

The existing cast models (`art/cast/wolf-bearer.glb`, `bronze-shepherd.glb`) and reference crops
predate this rule; use them with a tint, and build new ones to it.

## 3. Island 2: Paxos

> **Narrative Setting:** One island shaped like a Y, and its shape groups the papers. Two arms reach north and face each other across a sheltered bay; they join at a fork, and below it a short stem widens into the broad, lower body of the island. Two cities: Paxos, whose parliament governs the western arm, the stem and the body; and Schedia on the eastern arm, founded from a different mother city, which keeps its own laws. Four districts:
> - **The Chamber** (the western arm): a circular domed rotunda on a terrace above the bay, where the parliament sits, looking across the water at the Odeon. The island road runs up the stem, forks, and runs out along the western arm past the Chamber to the harbour town at the arm's tip, so the Chamber is on a through route.
> - **Schedia and the Odeon** (the eastern arm): a small unwalled city of its own above a cove on the bay, with the Odeon, a roofed theatre hall, built into a hillside bowl facing the Chamber across the bay.
> - **The hall of two doors** (the fork): on common ground belonging to neither city; one door faces north up the bay to the Chamber and the Odeon, one south down the stem to the scholars' coast.
> - **The scholars' coast** (the body of the island), which the scholars call Homonoia: lower, deeply indented country of coves and valleys, with the stoa and festival ground on an eastern harbour, about a dozen small libraries within casual reach of one another along footpaths of differing length, a courier cove on the rocky southwest shore, and the far terraces on remote slopes at the southern tip, as far from the assemblies as the island goes. The scholars hold no assembly.

### 3.1 Island Plate Prompt (Geography, Habitation & Book Locations)
Like Arche's, the Paxos plate carries its buildings in place. It is made in three steps.

**Step 1 — plate** (text-to-image, `banana_pro`, aspect 16:9, with `art/refs/paxos-outline-sketch.png` attached as the outline reference; without it the Y comes out as a V with no stem):
```text
Detailed 3D isometric diorama of the Greek island Paxos, Hellenistic Greece, 3rd century BC.
True orthographic axonometric view, deep focus, warm directional sunlight, zero people.
The island's outline follows the attached sketch: a limestone island shaped like the letter Y. Two slender high rocky arms reach north, side by side, enclosing a sheltered bay of turquoise water between them. They join at a fork, and below the fork a distinct narrow stem, clearly narrower than either arm is long, runs south and then widens into a broad, lower body. The body is by far the largest part of the island, larger than both arms together, and fills the whole southern half of the frame. Calm deep Aegean blue sea reaches every frame edge, turquoise shoals and white surf at the shore; no pedestal, no cutaway.
Outer coasts of both arms: sheer white limestone sea-cliffs with sea-caves. Inner slopes facing the bay: terraced olive groves, cypresses and maquis.
The western arm: on a level civic terrace above the bay stands a single circular domed rotunda of white ashlar limestone ringed by a Doric colonnade, with evenly spaced doorways and statues round it; a paved road crosses the terrace past it and runs on to the arm's tip, where a small harbour town of red-tiled stone houses, a market square, quays and moored merchant ships sits on a cove.
The eastern arm, directly across the bay from the rotunda: a small town of red-tiled stone houses above a cove, and above it, set into the hillside facing the bay, a large near-square roofed theatre hall of limestone with a single oxblood tiled roof and a colonnaded porch facing the water. All its seating is inside the roofed building; no seats, tiers or semicircular bowl are visible outside it.
The fork, where the two arms meet: one small symmetrical gabled hall of pale limestone with a door in each end wall, one facing north up the bay, one facing south down the stem.
The body of the island, well south of the stem: lower rolling hills and valleys with a deeply indented coast of coves and pebble beaches. On a harbour on the body's eastern shore, far down from the fork, a long colonnaded stoa facing an open ground set with rows of long tables. About a dozen small porched library buildings scattered in clearings among olive trees across the valleys and hill shoulders, linked by footpaths of differing length. A small rocky cove on the southwest shore with timber piers and small boats. At the remote southern tip, the farthest point from the fork, narrow stepped terraces with long stone tables on steep slopes facing the open sea.
Farmsteads along one road running from the southern body up the stem, forking at the hall, one branch along each arm.
No open-air theatre or exposed seating bowl anywhere, no citadel, no quarry, no ruins.
```

**Step 2 — town pass** (image-to-image on the step 1 image, `banana_pro`, aspect 16:9). Small, tightly packed houses reconstruct in 3D as tall blocks, so the town is redrawn as low courtyard houses before conversion:
```text
Keep [image 1] exactly as it is: the same Y-shaped island, arms, bay, cliffs, sea, rotunda, theatre hall, hall at the fork, stoa, libraries, terraces, road, olive terraces, trees, farmsteads, quays, ships, camera and lighting.
Change only the two towns: replace their houses with low single-storey Hellenistic courtyard houses of rough limestone, each a squat box with a shallow red-tiled roof and a small open courtyard, spaced a little apart with narrow lanes between them, clearly no taller than they are wide.
No multi-storey buildings anywhere.
Zero people.
```

**Step 3 — 3D.** A Meshy image-to-3D conversion of this plate, downloaded without resizing, is the island model, `art/paxos-3d.glb`; the plate it was made from is `art/refs/paxos-plate.jpeg`. `explorer.html` and `art/previs/render.py` place it at 104 m per model unit, a scale set by eye so that a person beside the rotunda looks right, and give it a quarter turn, since the model's arms point along its +Z and canon's point north. Meshy lost the stoa's shoreline, so the stoa and festival ground stand in the sea off the east coast.

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

#### Feature 2: The Stoa & Festival Ground
```text
Detailed 3D isometric architectural diorama of The Stoa and Festival Ground on Paxos's scholars' coast, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated civic space, zero people.
Sited on the waterfront of the scholars' eastern harbour.
A long two-storey colonnaded stoa of pale limestone with a terracotta roof runs along the harbour front, its back wall lined with carved stone benches, wooden boards pinned thick with small scraps of papyrus, and niches holding rolled papyrus scrolls; a bronze armillary sphere and a painted diagram of the Sun at the centre with the Earth circling it stand on a plinth at the middle of the colonnade.
In front of it, an open festival ground of beaten earth and flagstones set with rows of long plain wooden collation tables, paired facing each other, each with two scroll rests, oil lamps and inkpots.
Stone quays with wooden mooring posts and small courier boats moored alongside; calm turquoise water.
```

#### Feature 3: A Library (repeated type)
```text
Detailed 3D isometric architectural asset of one small library on Paxos's scholars' coast, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated scholarly building, zero people.
Sited in a small level clearing among olive trees, a footpath leading away.
A small limestone building with a columned porch, a pitched oxblood terracotta tile roof, and a heavy timber double door standing open onto walls of wooden pigeonhole shelves (armaria) filled with rolled scrolls.
Beside the main hall, a small reading room with a single reading table, a lectern and a bench.
The same building is repeated about a dozen times across the scholars' coast.
```

#### Feature 4: The Courier Landing
```text
Detailed 3D isometric architectural asset of The Courier Landing on Paxos's scholars' coast, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated landing, zero people.
Tucked into a steep, narrow rocky cove sheltered by high limestone cliffs.
Features stone moorings and timber piers where swift courier boats are tied, a small open-sided shelter with benches, and paved stone paths climbing out of the cove toward the libraries.
Rugged sea-cliff backdrop.
```

#### Feature 5: The Far Terraces (Tally Pebbles)
```text
Detailed 3D isometric architectural asset of The Far Terraces on Paxos's scholars' coast, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated terraces, zero people.
Carved into steep, remote limestone hillsides at the island's southern tip, facing out toward the open, unbroken horizon of the sea.
A dramatic flight of dry-stone retaining walls creating narrow, stepped terraces planted with wild olive trees.
Set upon each terrace are long stone counting tables divided into twelve parallel shallow troughs, one column per library, each holding neat mounds of black and white voting pebbles; small inscribed stone markers head each column.
Windswept, quiet, meditative landscape as far from the assemblies as the island goes.
```

#### Feature 6: The Hall of Two Doors
```text
Detailed 3D isometric architectural diorama of The Hall of Two Doors on Paxos, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated temple-hall, zero people.
Standing at the fork of the Y-shaped island, where the two northern arms meet the stem, on common ground belonging to neither city; the bay opens to the north, and the island's road runs past it and forks.
An elegant, perfectly symmetrical Hellenistic temple-like hall built of pale dressed ashlar limestone with an oxblood terracotta tiled gabled roof.
The defining architectural feature is two prominent, opposing monumental portal doorways on opposite facades:
- The Southern Portal: facing south down the stem toward the scholars' coast, framed with simple, unadorned rustic stone lintels.
- The Northern Portal: facing north up the bay toward the Chamber and the Odeon, the bodies that assemble, framed with classical fluted pilasters and a carved pediment.
Both massive bronze doors stand wide open, revealing an open, sunlit stone interior hall paved with alternating white and black marble tiles.
Surrounded by low stone parapets, gnarled wild olive trees and maquis.
```


#### Feature 7: The Odeon
```text
Detailed 3D isometric architectural diorama of The Odeon of Schedia, on Paxos, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated theatre hall, zero people.
Built into a natural hillside bowl on the eastern arm of Paxos, above a cove on the bay, facing the Chamber across the water.
A roofed theatre hall: a large near-square limestone building whose single timber-trussed, oxblood terracotta-tiled roof covers both the semicircular raked seating inside and the raised stage, with a row of tall clerestory windows along each side wall.
A colonnaded Doric porch runs across the front facing the bay, with broad doors into the hall; the rear of the building is set into the slope, following the rake of the seats within.
Surrounded by dry-stone retaining terraces, paved stone ramps, and silver-green olive trees.
```

#### Feature 7a: The Odeon — Interior
The roof is lifted away. Everything faces one stage: the legislators' thrones in the front row, each with its law book, and the public's benches behind. The board on the stage wall is for the number of the current speaker's term.
```text
Isometric 3D interior model of the Odeon of Schedia, on Paxos, a roofed Hellenistic Greek theatre hall.
Orthographic axonometric view, deep focus, zero people.
The timber roof is lifted away to show the whole interior.
Semicircular raked stone benches for the public rise from a flat semicircular orchestra floor to the back wall; every seat faces one raised stone stage.
The front row is a single curve of identical carved marble thrones with backs (proedria) for the legislators, each with a small stone reading stand holding a closed law book.
The stage is a plain raised platform with one marked speaking spot at its centre, side steps up from the orchestra at both ends, and a blank painted wooden board on its back wall for a number.
Tall clerestory windows in the side walls.
Warm daylight, photorealistic PBR stone, marble and timber.
```

---

## 4. Image-to-3D Reconstruction Guidelines

When processing these 2D isometric renders through neural 3D generators — Meshy (web UI) is the one to use; Tripo's conversions are far worse:
1. **Sea Level Plane Alignment ($Z = 0$):** Because the water extends continuously across the frame, the sea acts as a ground reference plane. Neural depth models (Marigold/ZoeDepth) reconstruct the water as a uniform planar baseline.
2. **Mesh Generation Parameters:**
   - **Target Polycount:** 300,000 – 800,000 triangles for island terrains.
   - **Base Mode:** Plane-clipped at sea level ($Z=0$), eliminating the need to carve away thick vertical resin pedestal walls.
   - **Texture Resolution:** 4096×4096 PBR (Albedo, Roughness, Normal).
