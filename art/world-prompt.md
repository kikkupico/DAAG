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

> **Narrative Setting:** The island of foundations. A broad limestone massif (Mount Phyle) fills the middle of the island. It stands squarely between every pair of the three trading houses, which sit evenly spaced round the coast: west-south-west, due north and east-south-east. Every straight line between two houses passes through the massif. A coastal ring road cut into the cliffs joins them, with a lane each way; by the law of the road nobody overtakes. Reefs and tide-races off the headlands mean no small boat coasts from one cove to the next. On the mountain, four gullies at its foot hold the mercenaries' camps (their tents are props, added to scenes) and a ruined bandit wall crowns the peak. The books are set in the winter trading season, under low overcast. The island plate is nonetheless rendered in clear sunlight, because crisp directional shadows help the 3D generator read the geometry. Winter weather belongs in the scene prompts.
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
- Buildings: solid terracotta-red blocks seen from above, each its own simple footprint (rectangles, L-shapes, courtyard squares). Quays, piers and slipways: solid grey. The road: a dark red double line, one line for each lane.
- Terraces: a light hatch. Goat paths: thin dashed lines.
- No text, no labels, no legend, no scale bar, no north arrow, no compass rose, no border.

Terrain (Mount Phyle):
- One broad limestone mountain fills the middle of the island, leaving a coastal strip all round for the road and the ports. Its single small summit is in the exact centre of the island.
- Eight spurs radiate from the summit like the spokes of a wheel, drawn as contour lines bulging outward; between them eight gullies, drawn as contour lines bending inward toward the summit. Four of the gullies point exactly north, east, south and west. The spurs are natural and uneven, each a different length and width, not a perfect star.
- The slopes are continuous natural hillsides: no terraces on the mountain, no plateaus, no cliff rings, no craters.
- The mountain stands between every pair of ports: a straight line from any port to any other crosses the mountain's upper slopes.
- The four gullies at north, east, south and west are empty: nothing built in them.

The crown: a small ruined ring wall on the very summit, about the size of the largest building in the ports, closed all round with no gap at all. Three tiny separate marks sit well down the slopes on three different sides, far from the wall and hidden from one another. No path climbs to the wall.

Coastal road: one cliff road with a lane each way, drawn as a dark red double line, running right round the island close to the coast, with no branches, no inland roads and no road over the mountain.

The three ports, each on its own side of the island so that no two share a side:
1. The port WEST-SOUTH-WEST: a rocky inlet with a long stone quay along the waterfront, one slipway, a large trade depot and a colonnaded tally hall facing the quay, and a village of small house blocks behind them.
2. The port due NORTH: a sheltered cove with a short stone dock and one slipway, a large wine and oil compound with a press house, a village of small house blocks, and hatched vine and olive terraces on the lower slopes to either side of the village (not directly behind it, where the north gully is). Just along the road east of the village, one small block cut into the cliff beside the road: the rock-cut granary.
3. The port EAST-SOUTH-EAST, the largest: a crescent bay with a sandy beach, a long stone pier running straight out into the bay, two slipways, a large customs house built round a courtyard, a long granary block, and a village of small house blocks.
On the southern cape, between the west-south-west and east-south-east ports, one small square block beside the road: the sundial platform.

THE ROAD REACHES EVERY PORT. At each port the double line comes down to the waterfront and runs straight along it, past the quay or pier. Every quay, pier and slipway touches the road on its landward end; every building block stands on or directly beside the road, or within its village, whose lanes lead to the road. No block, quay or pier stands apart from the road or is cut off from it by cliff, slope or water.
```

**Step 2 — road fix.** `python3 art/refs/arche_map_fix_road.py art/refs/arche-map-gemini.png art/refs/arche-map.png` erases Gemini's road and draws the road's two lanes a short, even distance inside the coast, keeping Gemini's line through the three ports. It removes stray blocks outside the ports, adds the rock-cut granary and the sundial platform, and checks that the road crosses no building and that every quay meets it. Gemini will not move the road in an edit.

**Step 3 — plate** (image-to-image, `banana_pro`, square, with `art/refs/arche-map.png` attached). Gemini follows the map's viewpoint, so the result is straight down:
```text
Detailed 3D isometric environment asset of the Greek island Arche, Hellenistic Mediterranean period (~3rd century BC), inhabited and working, as in the winter trading season.
A high oblique aerial view from the south, looking north and down at about 55 degrees, so the whole island fits the frame and the mountain's relief reads clearly; hyperfocal deep focus across all planes, crisp fine geometry, 8k resolution.

The attached map is the island's plan, drawn from directly above with north at the top. Follow it exactly: the jagged coastline and the irregular harbour shores; the brown contour lines, which give the mountain's shape (lines close together are steep, and the summit ring is the top); the position, size and footprint of every terracotta building block (buildings) and grey block (quays, piers, slipways); the hatched areas (vine and olive terraces); and the dark red double line (the ring road's two lanes). The contour lines show height only: the slopes are continuous and natural, with no terraces, steps or rings except where the map is hatched.

THE ROAD REACHES EVERY PORT, as on the map: at each of the three ports it runs along the waterfront, and every quay, pier and building stands on or directly beside it. No port, building, pier or quay stands apart from the road or is cut off from it by cliff or water.

The summit crown is exactly the size of the ring on the map: small, about the size of the largest building in the ports, a small closed ruined ring on the very top. The map has no text; add none.

REMOVE ALL PEOPLE AND ANIMALS: zero people, zero human figures, zero sailors, zero soldiers, zero silhouettes, zero mules, zero horses, zero livestock, zero birds in flight. Show that the island is lived in and busy only through buildings, objects, vehicles at rest, cargo and ships.

Lighting & Weather:
Bright, clear, sunny daylight from a cloudless sky, sun high in the upper right, casting clean, well-defined shadows to the lower left that model every slope, spur, gully, cliff and building so the landform reads unambiguously.
CRISP, CLEAR AIR: dry, cold, perfectly transparent air with zero atmospheric haze, zero aerial perspective and zero fading with distance. Every part of the island, from the nearest quay to the farthest headland, is rendered with the same sharpness, full contrast and true colour. Clean whites, deep darks and saturated natural stone, foliage and terracotta; no milky, washed-out or grey veil over the image.
The sea is a clear, cool steel-blue and turquoise, with long swell lines. No cloud, mist or fog touches the terrain anywhere; the whole summit is fully visible.

Surrounding Ocean:
The island rests inside an expansive, continuous stretch of Aegean sea extending to all four frame edges. Flat natural water plane at sea level (Z = 0). Strictly NO cutaway box, NO acrylic glass slab, NO diorama pedestal, NO vertical water walls.
- Between the three coves, every headland is fringed with jagged reefs, submerged rocks and bands of white breaking surf and tide-rip, clearly impassable to small boats hugging the coast. Inside each cove the water is sheltered and calm.

Overall Layout & Scale:
- The island is roughly round. Mount Phyle, a single broad limestone massif, fills the centre; its foot covers most of the island's interior, leaving only a narrow coastal strip.
- The three port villages sit evenly spaced round the coast: WEST-SOUTH-WEST, due NORTH and EAST-SOUTH-EAST. No two ports are on the same side of the mountain. The massif stands squarely between every pair, so no port can see another.
- The long southern arc of coast between the west-south-west and east-south-east ports ends in a bold southern cape with a small ruined sundial platform on it.

Mount Phyle (natural massif with book locations):
- A broad, climbable mountain, not a tower. Its profile is a wide, irregular cone. The slopes rise continuously from the coastal strip to the peak: gentle lower flanks of about 15–20°, steepening to about 30–35° near the top. Nowhere is there a sheer vertical face encircling the summit, and nowhere a cliff band that would stop a man on foot. A determined climber could walk up any spur.
- Organic natural karst geomorphology: eight radiating wooded spurs separated by gullies. Rough limestone outcrops, broken crags, ledges and scree break through the scrub on the upper third, as scattered rocks on a slope, not as walls. Maritime pine, cypress and maquis cover the lower slopes. NO concentric rings, NO stepped tiers, NO artificial plateaus, NO mesa or tabletop, NO crater or caldera, NO switchback roads.
- The mountain is not a thoroughfare. There is no road over it and no made trail. Only two faint, rough goat paths climb two spurs to the wall's north slot and south gap, vanishing into scrub and scree lower down.
- Four deep wooded gullies at the foot, one at each quarter-point (N, E, S, W), each between two wooded spurs, with two spurs between any two of these gullies. The gullies are empty wooded clefts with nothing built in them.
- The summit crown: a modest rounded rocky top, levelled a little, crowned by a small ruined cyclopean polygonal dry-stone ring wall with jagged, uneven tops, solid all round with no opening of any kind. Out on the slopes, far apart, three small separate lookout posts, each a hollow among crags with a rough low dry-stone breastwork, each hidden from the others and from the wall by rock. No council ring, no roofs.

Coastal Ring Road (one cliff road, a lane each way):
- Everywhere between the ports the road is a single shelf cut into the face of pale limestone sea-cliffs, with the surf far below.
- The shelf is just wide enough for two carts to pass going opposite ways. No inland shortcuts: the road hugs the coast the whole way round.
- Signs of traffic without people or animals: a few laden two-wheeled carts and handcarts standing in file on the road, those on the seaward side facing one way and those on the cliff side the other; loaded packsaddles and amphora racks waiting where the road leaves each port; worn cart ruts.
- On the headlands above the road, small weathered stone sundials on plinths.
- At each port the road descends by rock ramps into the waterfront and pass through the quay.

Three Port Villages (inhabited, working, no people):
Compact organic clusters of Hellenistic vernacular buildings: dry-stone and ashlar cottages, boat sheds, pergolas, walled yards, oxblood terracotta roofs (no smoke, steam or haze anywhere). Evidence of work everywhere: stacked crates, sacks, amphorae and pithoi on the quays, fishing nets drying on frames, hauled-up boats, carts parked in yards, laundry lines, tethering posts, water cisterns, small kitchen gardens.
1. The west-south-west house: a rugged fishing and trading haven on a rocky inlet with a stone quay and small boat basin. At its heart is the house's trade depot and tally station: an ashlar building with an open colonnaded loggia sheltering slate tally tables. Fishing skiffs and a small coastal cargo ship are moored; timber slipways hold one broad-beamed merchantman on a cradle.
2. The north house: a wine and oil compound on terraces above a sheltered northern cove, with cellar vaults, timber cart-loading platforms and a beam press, and terraced vineyards and olive groves behind. A stone dock and slipway hold one broad-beamed merchantman. Just along the road from the house, cut into the cliff beside the road, is the island's common dry storehouse: a rock-cut granary with a heavy timber door.
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

### 2.1a Terrain Plate (bare land, for a model the buildings are added to)

`art/refs/arche-terrain-plate.jpeg` is a bare-terrain plate: the massif, the three harbours with their quays, moles and levelled building terraces, the road and two small platforms (the granary's and the sundial's sites), and nothing built. Buildings are not drawn by the image model; the parametric sets (`art/sets/house.py`, `art/sets/town.py`, the crown) are placed on it after the Meshy conversion, and trees as props. The road loops round the mountain joining the harbours; image models will not keep it to the coast, and the allegory needs only that it links the harbours and never crosses the mountain. Its Meshy conversion (2026-09-28) is `art/archive/arche-meshy-2026-09-28/arche-3d.glb`, the untouched source the bake reads. Made in Gemini (text-to-image) from:
```text
Photorealistic isometric terrain diorama of the Greek island of Arche, Hellenistic Greece, 3rd century BC: the bare land and its earthworks only, made for 3D reconstruction. True orthographic axonometric view from the south, looking north and down at about 45 degrees, north at the top, the whole island in frame with a margin of sea all round. Deep focus, crisp fine geometry.

NO BUILDINGS OF ANY KIND: no houses, no warehouses, no porticoes, no walls, no ruins, no ring wall on the summit, no towers, no roofs, no huts, no tents. No ships, boats, carts, people or animals. No trees: the ground is covered only in low maquis, dry grass and bare rock, so the shape of the land reads clearly.

The island is roughly round, and a single broad limestone massif, Mount Phyle, fills it almost completely. The mountain's foot reaches nearly to the cliff tops all the way round: the coastal land is a narrow strip everywhere, with no lowland plains, plateaus or flat shelves between the harbours. Eight distinct spurs radiate from the summit like the arms of a star, each a clear ridge running down towards the coast, with a deep gully between every pair. The slopes rise continuously from the coast to the top, gentle below and steeper near the peak, with no cliff band round the summit and no concentric terraces, rings, tiers or steps anywhere. The summit is a small, rounded, bare rocky top of pale crags and clefts, sitting on the slope, not raised on a cliff.

Three harbours stand equally spaced round the coast, a third of the way round from each other: due north, west-south-west and east-south-east. The massif is broad and high enough that it stands squarely between every pair, and no harbour can see either of the others. Each is a sheltered cove with calm water, a broad levelled waterfront shelf at the water's edge carrying stone quays, and one long stone pier or mole out into the cove. Behind each shelf, a few flat levelled building terraces are cut into the lower slope, bare and empty.

A single narrow road, one cart wide, joins the three harbours in a loop round the mountain, cut into the slopes as a clear ledge. It goes round the mountain, never over it: no road or track climbs towards the summit, and there are no switchbacks on the upper slopes.

Beside the road near the north harbour, a small flat rock-cut platform. On a southern headland, a small bare levelled platform.

The coast is pale limestone sea-cliffs, with jagged reefs, submerged rocks and white surf off every headland.

Bright, clear sunlight from the upper right, casting crisp, well-defined shadows that model every slope, spur, gully, cliff, road cutting, quay and terrace. Dry, transparent air: no haze, fog, mist or cloud, full sharpness everywhere. Deep blue sea reaching every edge of the frame. No text, no pedestal, no cutaway.
```

#### Island Plate Negative Prompt
(Used instead of the universal negative for the Arche plate, because the plate deliberately puts a ruined wall and tents on the mountain.)
```text
people, humans, person, human figures, crowd, pedestrians, sailors, soldiers, characters, silhouettes, animals, mules, donkeys, horses, oxen, livestock, dogs, birds in flight, road over the mountain, switchback road, summit road, trail network on mountain, sheer mountain faces, vertical cliffs on the mountain, cliff band around summit, rock tower, mesa, tabletop mountain, plateau summit, crater, caldera, walled bowl, unclimbable peak, wide road, inland road, road away from the coast, ports close together, two ports on the same side, gentle rounded hill, grassy dome, council ring, stone seats in a circle, watchtower, lookout tower, tower on stilts, bird loft, multiple tents, tent pairs, tent clusters, encampment, summit buildings, roofed buildings on mountain, castle, fortress towers, palisade, campfire, smoke on mountain, flags, banners, beacon fire, cutaway, slab, diorama pedestal, glass edges, resin block, acrylic cube, vertical water walls, rectangular water box, tabletop diorama base, stepped ziggurat, concentric rings, tiered cake, circular cliff band, cylindrical rock wall, artificial plateau rings, amphitheater rings, circular terracing on mountain, perspective distortion, vanishing point, wide-angle lens, fish-eye, bokeh, shallow depth of field, tilt-shift blur, vignette, lens flare, overcast sky, grey sky, flat lighting, modern buildings, modern clothing, electricity wires, utility poles, tarmac roads, motorboats, cruise ships, whitewashed modern cycladic houses, blue painted shutters, plastic, concrete, neon, futuristic elements, low-poly, voxel, flat 2D sprite, cropped edges, cutoff island borders, horizon line, clouds covering terrain, mist, fog, haze, atmospheric haze, aerial perspective, depth fog, distance fade, washed-out colours, low contrast, milky veil, desaturated, grey cast, soft focus.
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
- Ships & Water: Moored inside the rectangular stone basin are 2-3 ancient Greek wooden fishing skiffs and a small coastal cargo ship with timber mast and furled linen sail, tied with hemp ropes to stone mooring bollards; timber hauling slipways with greased log rollers leading into the water; drying linen nets and stacked wooden crates on the quays.

2. Northern Port (harbour of the north house):
- Sited along the L-shaped stone pier and cleared waterfront terrace beneath the terraced olive groves from the reference image.
- Architecture: the house—an agricultural distribution wine compound with arched semi-subterranean limestone cellar vaults, heavy timber cart loading platforms, wooden ramps, and an outdoor timber beam olive/wine press.
- Ships & Water: 2 ancient Greek coastal wine transport ships with broad curved hulls and a round-hulled merchant ship tied alongside the L-shaped stone pier, rigged with furled sails and steering oars, loading wooden crates and rows of terracotta wine amphorae and oil pithoi directly from the stone dock.

3. East-South-East Port (harbour of the east-south-east house):
- Sited along the wide crescent beach, long stone pier, and open flagstone esplanade from the reference image.
- Architecture: the house—a grand ashlar limestone customs house with broad colonnaded porticos, open records courtyard with slate tablets on stone pillars, and vaulted granary warehouses.
- Ships & Water: The main merchant harbour: a large, broad-beamed Hellenistic merchant sailing ship (holkas) with double steering oars and rigging tied alongside the outer end of the long stone pier; 2 smaller wooden cargo skiffs and sailing dinghies pulled up onto the sandy beach on timber hauling cradles; stacks of grain sacks, cargo crates, and sealed silver ingots arranged neatly on the stone wharf.

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
A narrow crushed-limestone roadway carved as a shelf into the sheer face of a towering white limestone sea-cliff, just wide enough for two carts to pass going opposite ways.
The road is bounded on the seaward side by a low, dry-stone rubble retaining parapet, with crashing turquoise surf far below.
Two pairs of clear stone cartwheel ruts worn into the roadbed, one for each direction; natural rock overhangs sheltering the track; a few laden carts standing in file, those on the seaward side facing one way and those on the cliff side the other. No people, no animals.
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
Features a massive squared-stone quay extending into deep azure water; large timber ship slipways holding two broad-beamed Hellenistic merchant sailing ships drydocked on timber cradles; an open customs record courtyard containing large slate slates mounted on stone pillars; vaulted dry granary storehouses with raised timber floors; neatly stacked rows of cargo crates, grain sacks, and sealed silver ingots.
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

#### Feature 6: The Bandit Crown, the Sealed Ring & the Three Slope Posts
```text
Detailed 3D isometric architectural asset of the Summit Crown of Mount Phyle, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated summit redoubt, zero people.
Situated on the very top of a limestone mountain, high above the sea.
A small ruined cyclopean polygonal dry-stone ring wall with weathered, jagged top edges, solid all round: no gate, no gap, no stair, no opening of any kind. Inside it, a paved floor and a few iron-bound strongboxes on a low stone shelf, and a timber ladder drawn up against the inner face; nothing roofed.
Out on the slopes around it, far apart, three lookout posts, each a hollow among pale crags with a low, rough dry-stone breastwork on its downhill side: uneven, gappy, stones of all sizes, nothing squared or neat. Terrain hides every post from the others.
NO gate, NO council ring, NO circle of seats, NO roofs, NO banners, NO fire. Windswept scrub, wild grasses and weathered pale limestone.
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

**Costume canon (ring road).** Everything worn is a Hellenistic loom-woven rectangle, never tailored.
Messengers go bare-headed, with no hat of any kind; they wear a plain *exōmis*, a short tunic of one rectangle, sleeveless and bare at one
shoulder, with no set-in sleeves, sewn collar or trim; simple strapped sandals, with no buckles, or
bare feet; and a soft hide sack on a cord (a *pera*), with no stitched seams, tailored flap or belt
buckle. Lamportios wears a draped, pinned chiton or himation. Slips are strips of papyrus, with visible
fibres and ragged edges. Columns are Doric: no bases, standing on the paving. Roofs are flat terracotta
pan tiles with narrow cover tiles and eave-end tiles; timbers are hand-hewn, uneven, never square-milled.
Cloth, as modelling estimates: a himation about 1.3 × 2.8 m, a chlamys about 1.1 × 2 m, worn by a man about 1.7 m and a woman about 1.5 m tall.

The existing cast models (`art/cast/wolf-bearer.glb`, `bronze-shepherd.glb`) and reference crops
predate this rule; use them with a tint, and build new ones to it.

## 3. Island 2: Paxos

> **Narrative Setting:** One island shaped like a Y, and its shape groups the papers. Two arms reach north and face each other across a sheltered bay; they join at a fork, and below it a short stem widens into the broad, lower body of the island. Two cities: Paxos, whose parliament governs the western arm, the stem and the body; and Schedia on the eastern arm, founded from a different mother city, which keeps its own laws. Four districts:
> - **The Chamber** (the western arm): a round colonnaded hall under a conical tiled roof, on a terrace above the bay, where the parliament sits, looking across the water at the Tholos. The island road runs up the stem, forks, and runs out along the western arm past the Chamber to the harbour town at the arm's tip, so the Chamber is on a through route.
> - **Schedia and the Tholos** (the eastern arm): a small unwalled city of its own above a cove on the bay, with the Tholos, a round hall with a conical tiled roof and a podium at its centre, on a terrace facing the Chamber across the bay.
> - **The hall of two doors** (the fork): on common ground belonging to neither city; one door faces north up the bay to the Chamber and the Tholos, one south down the stem to the scholars' coast.
> - **The scholars' coast** (the body of the island), which the scholars call Homonoia: lower, deeply indented country of coves and valleys, with the stoa and festival ground on an eastern harbour, about a dozen small libraries within casual reach of one another along footpaths of differing length, a courier cove on the rocky southwest shore, and the far terraces on remote slopes at the southern tip, as far from the assemblies as the island goes. The scholars hold no assembly.

### 3.1 Island Plate Prompt (Geography, Habitation & Book Locations)
Like Arche's, the Paxos plate carries its buildings in place. It is made in three steps.

**Step 1 — plate** (text-to-image, `banana_pro`, aspect 16:9, with `art/refs/paxos-outline-sketch.png` attached as the outline reference; without it the Y comes out as a V with no stem):
```text
Detailed 3D isometric diorama of the Greek island Paxos, Hellenistic Greece, 3rd century BC.
True orthographic axonometric view, deep focus, warm directional sunlight, zero people.
The island's outline follows the attached sketch: a limestone island shaped like the letter Y. Two slender high rocky arms reach north, side by side, enclosing a sheltered bay of turquoise water between them. They join at a fork, and below the fork a distinct narrow stem, clearly narrower than either arm is long, runs south and then widens into a broad, lower body. The body is by far the largest part of the island, larger than both arms together, and fills the whole southern half of the frame. Calm deep Aegean blue sea reaches every frame edge, turquoise shoals and white surf at the shore; no pedestal, no cutaway.
Outer coasts of both arms: sheer white limestone sea-cliffs with sea-caves. Inner slopes facing the bay: terraced olive groves, cypresses and maquis.
The western arm: on a level civic terrace above the bay stands a single round hall of white ashlar limestone ringed by an unbased Doric colonnade, under one conical roof of oxblood terracotta tiles with a small louvred lantern, with evenly spaced doorways and statues round it; a paved road crosses the terrace past it and runs on to the arm's tip, where a small harbour town of red-tiled stone houses, a market square, quays and moored merchant ships sits on a cove.
The eastern arm, directly across the bay from the rotunda: a small town of red-tiled stone houses above a cove, and above it, on a level terrace facing the bay, a round hall of warm honey-coloured limestone with plain walls, several doorways round it and no colonnade, under a single low conical roof of oxblood terracotta tiles rising to a small louvred lantern, and a small columned porch facing the water. It is clearly unlike the white colonnaded round hall across the bay.
The fork, where the two arms meet: one small symmetrical gabled hall of pale limestone with a door in each end wall, one facing north up the bay, one facing south down the stem.
The body of the island, well south of the stem: lower rolling hills and valleys with a deeply indented coast of coves and pebble beaches. On a harbour on the body's eastern shore, far down from the fork, a long colonnaded stoa facing an open ground set with rows of long tables. About a dozen small porched library buildings scattered in clearings among olive trees across the valleys and hill shoulders, linked by footpaths of differing length. A small rocky cove on the southwest shore with timber piers and small boats. At the remote southern tip, the farthest point from the fork, narrow stepped terraces with long stone tables on steep slopes facing the open sea.
Farmsteads along one road running from the southern body up the stem, forking at the hall, one branch along each arm.
No open-air theatre or exposed seating bowl anywhere, no citadel, no quarry, no ruins.
```

**Step 2 — town pass** (image-to-image on the step 1 image, `banana_pro`, aspect 16:9). Small, tightly packed houses reconstruct in 3D as tall blocks, so the town is redrawn as low courtyard houses before conversion:
```text
Keep [image 1] exactly as it is: the same Y-shaped island, arms, bay, cliffs, sea, rotunda, round tiled hall, hall at the fork, stoa, libraries, terraces, road, olive terraces, trees, farmsteads, quays, ships, camera and lighting.
Change only the two towns: replace their houses with low single-storey Hellenistic courtyard houses of rough limestone, each a squat box with a shallow red-tiled roof and a small open courtyard, spaced a little apart with narrow lanes between them, clearly no taller than they are wide.
No multi-storey buildings anywhere.
Zero people.
```

**Step 3 — 3D.** A Meshy image-to-3D conversion of this plate, downloaded without resizing, is the island model, `art/paxos-3d.glb`; the plate it was made from is `art/refs/paxos-plate.jpeg`. `explorer.html` and `art/previs/render.py` place it at 104 m per model unit, a scale set by eye so that a person beside the rotunda looks right, and give it a quarter turn, since the model's arms point along its +Z and canon's point north. Meshy lost the stoa's shoreline, so the stoa and festival ground stand in the sea off the east coast.

### 3.1a Terrain Plate (bare land, for a model the buildings are added to)

`art/refs/paxos-terrain-plate.jpeg` is a bare-terrain plate, like Arche's (§2.1a): the two arms round the bay, the fork and the broad body, with the earthworks for every site and nothing built. The round terrace on the western arm is the Chamber's; the terrace above the eastern cove, with Schedia's terraces below it, is the Tholos's (square: the Tholos stands on a paved court); the platform at the fork is the hall of two doors'; on the body, the eastern harbour's quay and flat ground are the stoa's and the festival ground's, the scattered clearings the libraries', the south-west landing the couriers', and the stepped terraces at the southern tip the far terraces. The Y is imperfect, its arms spreading rather than parallel, which looks more natural and keeps what the setting needs: two arms round a bay, the Chamber and the Tholos looking at each other across the water from round terraces, a fork for the hall of two doors, a short stem, and the scholars' coast in the body with every site joined to the road. Its Meshy conversion (2026-09-28) is `art/archive/paxos-meshy-2026-09-28/paxos-3d.glb`, the untouched source the bake reads. Made in Gemini (text-to-image) from:
```text
Photorealistic isometric terrain diorama of the Greek island of Paxos, Hellenistic Greece, 3rd century BC: the bare land and its earthworks only, made for 3D reconstruction. True orthographic axonometric view from the south, looking north and down at about 45 degrees, north at the top, the whole island in frame with a margin of sea all round. Deep focus, crisp fine geometry.

NO BUILDINGS OF ANY KIND: no houses, no halls, no temples, no rotundas, no porticoes, no stoas, no walls, no ruins, no towers, no roofs. No ships, boats, carts, people or animals. No trees: the ground is covered only in low maquis, dry grass and bare rock, so the shape of the land reads clearly.

The island is shaped like the letter Y, following the attached sketch. Two slender, high rocky arms reach north side by side, enclosing a sheltered bay of calm turquoise water between them. They join at a fork. Below the fork a distinct narrow stem, clearly narrower than either arm is long, runs south and then widens into a broad, lower body. The body is by far the largest part of the island, larger than both arms together, and fills the whole southern half of the frame.

The arms: sheer white limestone sea-cliffs with sea-caves on their outer coasts, and steep slopes down to the bay on their inner sides. On the western arm, halfway along, a broad round levelled terrace high above the bay, bare and empty. At the western arm's tip, a small cove with a levelled waterfront shelf, stone quays and a short mole, and a few bare levelled building terraces behind it. On the eastern arm, directly across the bay from the round terrace: a sheltered cove with a small shingle beach and a stone quay, bare levelled terraces climbing the slope above it for a small town, and above them one broad levelled terrace facing the bay across the water, bare and empty.

The fork, where the two arms meet the stem: a small, flat, levelled open platform on common ground, bare.

The body of the island: lower rolling hills and small valleys, and a deeply indented coast of coves and pebble beaches. On a harbour on the body's eastern shore, far down from the fork, a long straight levelled waterfront terrace with a stone quay, and a broad flat open ground beside it. Scattered across the valleys and hill shoulders, about a dozen small separate levelled clearings, bare. A small rocky cove on the south-west shore with short stone landing stages. At the remote southern tip, the farthest point from the fork, narrow stepped dry-stone terraces on steep slopes facing the open sea, bare.

One narrow road, one cart wide, runs from the southern body up the stem to the fork, where it forks: one branch runs out along the western arm past the round terrace to the cove at its tip, the other along the eastern arm to the cove on the bay and up through the terraces above it. Every harbour and landing is joined to the road: from the main road a branch road, one cart wide, descends by a cut ramp to the long quay on the body's eastern shore and its flat ground, and another descends to the landing cove on the south-west shore. Tracks of differing length link every clearing and the stepped terraces at the southern tip to the road. No quay, terrace, clearing or platform stands cut off by slope or cliff.

Bright, clear sunlight from the upper right, casting crisp, well-defined shadows that model every cliff, slope, valley, terrace, quay and road cutting. Dry, transparent air: no haze, fog, mist or cloud, full sharpness everywhere. Calm deep Aegean blue sea reaching every edge of the frame, turquoise shoals and white surf at the shore. No text, no pedestal, no cutaway.
```

### 3.2 Architectural Features Prompts

#### Feature 1: The Chamber (a rotunda)
```text
Detailed 3D isometric architectural diorama of The Chamber on Paxos, the parliament's assembly hall, Hellenistic Ancient Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated monument, zero people.
A circular civic assembly hall (a rotunda) built of finely dressed white ashlar limestone.
Surrounded by an unbroken outer colonnaded peristyle of Doric limestone columns with no bases, supporting a classical entablature and a lean-to roof of pan and cover tiles that runs up to the drum.
Roofed with one low conical roof of oxblood terracotta pan tiles and narrow cover tiles on timber rafters, crowned by a small louvred lantern and a bronze finial; bare dressed stone walls inside, a ring of six plain stone columns holding the roof beams, no hangings or panelling.
A stepped circular stone plinth (crepidoma) surrounds the base. Several open doorways spaced evenly around the circular drum, none of them grander than the others, so there is no front entrance.
Paved concentric circular interior flagstone floor with no podium, no speaker's platform, no head of the room, and no seating facing any single point; low stone benches follow the curve of the wall.
Set on a paved limestone public terrace crossed by a road, with marble statues on tall pedestals standing just outside the doorways, and slender Italian cypress trees.
```

#### Feature 1a: The Chamber — Interior
The roof is lifted away. The room carries Lamport's Chamber exactly: no point from which anyone could address the room, one scroll per legislator and no shared record, doorways all round because legislators and messengers come and go, and a meridian line because Paxons tell time by the sun.
```text
Isometric 3D interior model of the Chamber on Paxos, a Hellenistic Greek parliament hall.
Orthographic axonometric view, deep focus, zero people.
The roof is lifted away to show the whole interior, with a ring of six plain stone columns inside the wall.
A large circular hall; bare dressed white limestone walls, hard and echoing, no hangings or panelling.
Identical open doorways spaced evenly round the wall: no front, no podium, no head of the room, nothing at the centre.
Concentric flagstone floor with a bronze meridian line inlaid where sunlight from the lantern falls, marked with hours.
Round the wall, a ring of identical low stone benches, each with a small wooden writing desk, an inkpot and a closed papyrus scroll with its title tag.
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
- The Northern Portal: facing north up the bay toward the Chamber and the Tholos, the bodies that assemble, framed with classical fluted pilasters and a carved pediment.
Both massive bronze doors stand wide open, revealing an open, sunlit stone interior hall paved with alternating white and black marble tiles.
Surrounded by low stone parapets, gnarled wild olive trees and maquis.
```


#### Feature 7: The Tholos
```text
Detailed 3D isometric architectural diorama of The Tholos of Schedia, on Paxos, Hellenistic Greece.
Axonometric orthographic projection, hyperfocal focus, clean unpopulated round hall, zero people.
On a level terrace on the eastern arm of Paxos, above a cove on the bay, facing the Chamber across the water.
A round hall of warm honey-coloured limestone with plain walls and no surrounding colonnade, under a single low conical roof of oxblood terracotta tiles that rises to a small louvred lantern; several plain doorways evenly spaced round the drum, and a small columned porch on the side facing the bay.
Surrounded by a paved terrace with low stone parapets, stone benches by the doors, and silver-green olive trees.
```

#### Feature 7a: The Tholos — Interior
The roof is lifted away. The legislators' benches run round the wall, each with its wax tablets, facing a podium at the centre, which every bench is the same distance from. The board on the podium is for the number of the current holder's board.
```text
Isometric 3D interior model of the Tholos of Schedia, on Paxos, a round Hellenistic Greek hall.
Orthographic axonometric view, deep focus, zero people.
The conical tiled roof is lifted away to show the whole interior.
A single ring of identical stone benches with backs runs round the inside of the wall, broken only by the doorways; each bench has a small stone stand holding a stack of hinged wooden tablets filled with yellow beeswax (no books, no scrolls), and every bench faces the centre.
Six plain columns stand in a ring between the benches and the centre, which carry the roof.
At the exact centre, a low round stone podium with two steps, a single stone seat and a writing desk on it, and a blank painted wooden board on a post beside the desk for a number. The podium has no lectern and is not raised for speaking.
A paved stone floor with clear paths from the podium to every doorway.
Warm daylight through the doorways, photorealistic PBR stone, marble and timber.
```

---

## 3.3 The Home Page Chart

`assets/img/map.jpg` comes from a render of the two island models, never from editing an old chart.
1. **Views:** `blender -b -P art/refs/chart_views.py -- <arche|paxos> out.png 25 560 <yaw>` renders one island, placed from art/islands.json, from directly above tilted 25° south, north up, on a transparent ground (frame 560 m so a turned island isn't clipped; resolution scales with it). Both islands turn together 15° anticlockwise from the explorer's placement so the pair lies along the diagonal: Arche yaw 15, Paxos yaw 37 (22° more, so its stem runs down the diagonal and its two arms open towards Arche).
2. **Layout:** `python3 art/refs/chart_layout.py` sets the two views at one scale on a 2048² canvas, Arche top-left tucked in the crook of Paxos's Y, and centres the pair as a group. The top-right and bottom-left corners stay empty. Result: art/refs/chart-layout.png.
3. **Home page:** the user converts the layout to the final chart themselves in Gemini (AI engravings made here were rejected). The result, a sepia copperplate chart with a compass rose top-right and rhumb lines, is `art/full-map-cartographic.jpeg` (2048²) and, resized to 1240², `assets/img/map.jpg`.

## 3.4 Scale canon for modelling

Defaults for the 3D phase, taken from `hellenistic-reference.html` (its *Modelling cheat sheet* gives each figure's source, period and certainty). They are assumptions where the reference has no measurement, and a model may depart from them when a prop's own source says otherwise.

| Thing | Default |
|---|---|
| Man · woman | 1.7 m · 1.5 m |
| House door · storey height | 2.0 × 0.9 m · 3.5 m |
| Doric column | shaft height about 7 lower diameters, no base |
| Ionic column | height about 8–9 lower diameters |
| Stoa bay (Doric outer · Ionic inner) | about 2.3 m · 4.65 m between axes (Priene) |
| Ring-road town streets | main about 4.5 m, cross about 3.5 m, wider at gates and the agora |
| Theatre seat | height about 0.4 m |
| Kline | 2.0 × 0.9 × 0.7 m |
| Rhodian amphora | about 0.9 m tall |
| Merchant ship | Kyrenia type, about 14 m long and 4.4 m in the beam |
| Sarissa · doru | about 5.8 m with a 13.5 cm head · about 2.4 m |
| Horse · donkey | about 1.35 m · about 1.0 m at the withers |

## 4. Image-to-3D Reconstruction Guidelines

When processing these 2D isometric renders through neural 3D generators — Meshy (web UI) is the one to use; Tripo's conversions are far worse:
1. **Sea Level Plane Alignment ($Z = 0$):** Because the water extends continuously across the frame, the sea acts as a ground reference plane. Neural depth models (Marigold/ZoeDepth) reconstruct the water as a uniform planar baseline.
2. **Mesh Generation Parameters:**
   - **Target Polycount:** 300,000 – 800,000 triangles for island terrains.
   - **Base Mode:** Plane-clipped at sea level ($Z=0$), eliminating the need to carve away thick vertical resin pedestal walls.
   - **Texture Resolution:** 4096×4096 PBR (Albedo, Roughness, Normal).
