# DAAG Composer · 3D Island & Shot Composition Studio

An interactive 3D composition and previs studio for the DAAG archipelago (**Arche** and **Paxos**). Built as a self-contained Full-Stack app (Frontend with Three.js + Backend in Python), Composer enables directors, illustrators, and writers to explore the 3D procedural world, place architectural and environmental props, capture clean camera shots, pick character cast references, generate exact AI prompts (Photoreal & Ligne Claire), and save shots into each book's canon `shots.json`.

---

## Quick Start

Launch the Composer server from the DAAG repository root:

```bash
python3 world/composer/server.py
```

By default, the server binds to `http://localhost:8767/` (or auto-selects the next available port if occupied).

To specify a custom port or host:

```bash
python3 world/composer/server.py 8080 --host 127.0.0.1
```

Open the printed URL in any modern browser (Chrome, Safari, Firefox, Edge).

---

## Key Features

### 1. 3D Archipelago Exploration
- **Combined High-Poly Model (`island-v2.glb`)**: Loads the complete archipelago featuring both Arche (Foundations & Faults) and Paxos (Consensus & Convergence), with all stone quays, harbour piers, ring roads, mountain paths, and canonical buildings.
- **Dual Navigation**:
  - **Orbit Navigation**: Left-click drag to orbit, right-click drag to pan, scroll wheel to zoom.
  - **First-Person / Drone Fly Mode**: `W`, `A`, `S`, `D` to fly forward/left/backward/right, `Q` / `E` to descend / ascend, and `Shift` for high-speed flight across the islands.
- **Site Teleportation**: Quick-jump dropdown to all 17 canonical sites across Arche and Paxos (House 1, House 2, House 3, Mount Phyle Crown, Mercenary Camps 1–4, The Chamber, The Tholos, Schedia Bay, Oracle at the Fork, Homonoia Libraries, Stoa, etc.).
- **Interactive Roof Cutaway**: Toggle "Roof Cutaway" at any time to lift all terracotta tiled roofs by 9 meters, revealing interior rooms, water-clocks, pebble boards, and council benches.
- **3D Site Pins**: Visual markers showing the location and elevation of every building and sanctuary.

### 2. Camera Optics & Framing
- **Focal Length & Lens Presets**: Real-time focal length slider (14mm to 150mm) and prime lens shortcuts (`18mm`, `24mm`, `26mm`, `35mm`, `50mm`, `85mm`) with dynamic Vertical FOV computation.
- **Aspect Ratio Framing Matte**: Live visual framing guides for canonical DAAG book formats:
  - `3:4` (Standard book panel & cover format)
  - `16:9` (Cinematic widescreen)
  - `1:1` (Square plate)
  - `4:3`, `2:3`, `9:16`
- **Rule-of-Thirds Grid**: Toggleable composition alignment grid.
- **Eye-Level Ground Snap**: Snap the camera to standard human eye height (+1.7m above the terrain or terrace).
- **Coordinate Telemetry**: Real-time readout of Camera `[X, Y, Z]` and Target `[X, Y, Z]`.

### 3. Weather, Time of Day & Sun Angle
- **Sun Angles**: Independent sliders for **Azimuth Heading** (0° to 360°) and **Elevation Zenith** (-5° to 85°).
- **Time of Day Presets**:
  - `Morning`: Crisp, directional eastern sunlight with long shadows.
  - `Golden Hour`: Warm amber low-angle western sun (250° azimuth, 24° elevation).
  - `Noon`: Bright overhead Mediterranean sun.
  - `Sunset`: Deep orange and crimson twilight horizon.
  - `Dusk`: Cool starlit indigo night.
  - `Arche Overcast`: Winter trading diffuse sky (where sundials cast no shadows, canon from `settings.md`).
- **Dynamic Atmosphere & Sea**: Real-time PCF soft shadow maps, volumetric haze/fog density slider, and animated ocean surface with wave shimmer and specular reflections.

### 4. Interactive Prop Placement Engine
- **Click-to-Place Raycasting**: Enable "Click Island to Place Prop" mode and click anywhere on terrain, quays, or terraces to spawn models at that exact coordinate.
- **Prop Library (28+ models)**:
  - **Flora**: Mediterranean Cypress, Olive Tree, Aegean Pine, Gnarled Oak, Maquis Patch, Vine Rows, Coastal Shrubs.
  - **Transport & Vessels**: Wooden Oxcart, Harbour Skiff / Rowboat, Merchant Sailing Ship.
  - **Architecture & Shelters**: Mercenary Tents, Market Stalls, Stone Granary, Quayside Depot, Harbour Warehouse, Customs House, Courtyard House.
  - **Statues & Figures**: Equestrian Bronze Statue, Marble Philosopher Bust, Hellenistic Soldier Guard Standee.
  - **Everyday Life**: Wicker Baskets, Well Buckets, Amphora Cellar Hatches.
  - **Geology**: Limestone Boulders, Coastal Flat Rocks, Craggy Sea Cliffs.
- **Transform Gizmo**: Switch between **Translate** (`G`), **Rotate Yaw** (`R`), and **Scale** (`S`) with interactive 3D handles.
- **Prop Management**: Placed props list with camera focus, individual deletion (`Del`/`Backspace`), and bulk clear.

### 5. Screen View Capture Widget (Without UI Elements)
- **Clean Offscreen Buffer**: Captures the exact 3D viewport cleanly without rendering any HUD, gizmos, labels, or UI overlays.
- **Framing Crop**: Automatically crops to the selected aspect ratio (e.g. `3:4` or `16:9`) at high resolution.
- **One-Click Clipboard Copy**: Copies the clean PNG directly to the system clipboard via `navigator.clipboard.write(ClipboardItem)`.
- **PNG Download**: Downloads the captured previs image with metadata naming.
- **Automatic Previs Saving**: Automatically saves the capture to `world/composer/captures/` and attaches shot metadata sidecars.

### 6. Character Reference Cast Picker
- **35 Canon Figures**: Browse characters from `world/cast/cast.json` with high-resolution studio reference portraits from `world/cast/out/nb2/`.
- **Filter Groups**:
  - Arche's Ring Road: Messengers, Accountant, Clerk.
  - Mount Phyle Foot: Four Mercenaries (ochre, deep blue, oxblood red, olive green).
  - Mount Phyle Crown: Four Bandits (purple, slate grey, saffron orange, chestnut brown).
  - Paxos Chamber: Legislator Man, Legislator Woman, Priest, Messenger, Merchant, Goatherd.
  - Schedia Council & Runners: Okios, Liskovia, Kleon, Melissa, Theron, Tholos Runner.
  - Scholar's Coast & Oracle: Scholar, Librarian, Priestess, Students (North & South).
- **Multi-Select & Visual Chips**: Select any combination of characters to appear in the shot.
- **Individual Copy & Export**: One-click copy or download for each character reference image to pass as image input to AI tools.

### 7. AI Prompt Studio (Photoreal & Ligne Claire)
Generates prompts matching the exact canonical syntax from `world/panels/pipeline.py`:
- **Style Toggle**:
  - **Photoreal**: Uses the canonical `KEEP` prompt for photographic realism (Hellenistic Greece, 3rd century BC, true scale, natural daylight, real shadows).
  - **Ligne Claire**: Uses the canonical `KEEP_LIGNE_CLAIRE` prompt for Franco-Belgian comic illustration (clean black ink outlines, flat clear colors, Hergé / Jacobs manner).
- **Automatic Reference Mapping**:
  - `Image 1` is designated as the Previs camera view.
  - `Images 2 to N+1` are mapped to the selected character portraits with their canonical IDs.
  - Formats instructions ensuring characters match their reference portraits.
- **Headcount & Crowd Support**:
  - Precise headcounts ("There are exactly 2 people in the photograph; nobody else.").
  - Support for background crowds and passers-by ("Besides the 2 named, the only other people in the photograph are these: ...").
- **One-Click Copy & ZIP Bundle**:
  - "Copy Prompt" copies the assembled prompt text.
  - "Download All as AI Bundle (ZIP)" packages `prompt.txt`, `01_image_previs.png`, and all selected `02_character.png` reference files into a single zip archive ready for any image generation AI (Nano Banana 2, Gemini, Midjourney, FLUX, Stable Diffusion).

### 8. Book Shots Storage (`shots.json`)
- **Direct Book Saving**: Select any of the 5 canonical books (`the-part-time-parliament`, `ordering-without-clocks`, `the-limits-of-agreement`, `one-leader-at-a-time`, `examples`).
- **Auto-Aggregated Shot Data**: Collects current camera position, target look-at, lens focal length, aspect ratio, lighting condition, sun azimuth, selected cast, scene prompt, and background crowd.
- **Safety First**: Automatically creates a backup (`shots.json.bak`) before saving to avoid data loss.
- **Shot Archive Browser**: Browse all shots in any book and click "Jump to this Shot" to instantly teleport the camera, set lens optics, restore lighting, select the cast, and populate the prompt!

---

## Architecture

```
world/composer/
├── server.py        # Python ThreadingHTTPServer with Range requests and REST APIs
├── index.html       # Single-page studio interface
├── composer.css     # Glassmorphic Hellenistic dark theme
├── composer.js      # Three.js 0.164.1 app, camera optics, sun simulation, raycaster
├── captures/        # Saved viewport screenshots and metadata sidecars
└── README.md        # Documentation and user guide
```

### Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Server health and resource counts |
| `GET` | `/api/books` | Available books and their shot counts |
| `GET` | `/api/books/<book>/shots` | Retrieve all shots for a given book |
| `POST` | `/api/books/<book>/shots` | Save or update a shot in `shots.json` |
| `GET` | `/api/cast` | Character definitions and portrait URLs |
| `GET` | `/api/props` | Categorized catalog of 3D prop models |
| `POST` | `/api/capture` | Save base64 viewport screenshot to disk |
| `GET` | `/api/bundle` | Download ZIP archive of previs, cast, and prompt |
| `GET` | `/models/...` | Stream 3D island models with HTTP 206 Partial Content |
| `GET` | `/props/...` | Stream kit and Polyhaven GLB/GLTF prop models |
| `GET` | `/cast/images/...` | Serve high-resolution character portraits |
