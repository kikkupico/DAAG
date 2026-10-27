# DAAG Composer · 3D Island & Shot Composition Studio

An interactive 3D composition and previs studio for the DAAG archipelago (**Arche** and **Paxos**). Built as a self-contained Full-Stack app (Frontend with Three.js + Backend in Python), Composer enables directors, illustrators, and writers to explore the 3D procedural world, place architectural and environmental props, capture clean camera shots, pick character cast references, generate exact AI prompts (Photoreal & Ligne Claire), and save shots into each book's canon `shots.json`.

---

## Quick Start

Launch the Composer server from the DAAG repository root:

```bash
python3 world/composer/server.py
```

By default the server binds to all interfaces (`0.0.0.0`, port 8767 or the next free one) and prints its network URL, so other machines on the LAN can open it. It writes into `world/panels` and has no authentication, so use it on a network you trust, or pass `--host 127.0.0.1` to keep it local. It sends no CORS headers: only the page it serves can call its API.

To specify a custom port or host:

```bash
python3 world/composer/server.py 8080 --host 127.0.0.1
```

Open the printed URL in any modern browser (Chrome, Safari, Firefox, Edge).

---

## Key Features

### 1. 3D Archipelago Exploration
- **The live islands**: loads `world/build/composer/<island>.glb`, exported from the built Blender islands (`world/build/arche.blend`, `paxos.blend`) by `sh world/composer/export.sh [arche paxos]`. The ground is a heightmap mesh from `terrain/<island>/height.npy`, coloured from the terrain masks (`ground.py`); architectural and prop instancers (columns, statues, pottery, boats) are realized, while roof-tile, tree and rock instancers are left out as too many. The models are gitignored; rebuild them after the islands change. Pick the island in the header; each is a separate model.
- **Blender coordinates throughout**: the models keep Blender metres (+Z up; three.js sees them as (x, z, −y), `js/coords.js`), so the camera readout and every `cam` and `target` saved to or loaded from `shots.json` are the same numbers `previs.py` renders from. Shots given with a `site` (`chamber`, `tholos`) are read and saved in that building's own frame, as `shots_panels.py` does, and `"+1.7"`-style heights are resolved against the ground. The sun azimuth is a compass bearing (0° = north = Blender +Y), matching `sun_from`, and the time-of-day buttons use the renderer's preset names (`morning`, `golden`, `late`, `noon`, `overcast`, `dusk`).
- **Dual Navigation**:
  - **Orbit Navigation**: Left-click drag to orbit, right-click drag to pan, scroll wheel to zoom.
  - **First-Person / Drone Fly Mode**: `W`, `A`, `S`, `D` to fly forward/left/backward/right, `Q` / `E` to descend / ascend, and `Shift` for high-speed flight across the islands.
- **Site Teleportation**: dropdown and labelled pins for the island's named places, read from `terrain/<island>/sites.json` through `/api/sites/<island>` (Arche: the three houses, camps, posts, the Crown, granary, sundials; Paxos: the Chamber, Tholos, oracle, stoa, festival ground, harbours, libraries).
- **Roof Cutaway**: lifts the roof-tile meshes 9 m where a model has them.

### 2. Camera Optics & Framing
- **Focal Length & Lens Presets**: focal length slider (14mm to 150mm) and prime shortcuts (`18mm`, `24mm`, `26mm`, `35mm`, `50mm`, `85mm`). The viewport camera is set so that what is inside the framing matte has the same field of view as the Blender render of that lens and aspect: Blender's camera has a 36 mm sensor fitted to the longer side of the frame, so a 3:4 frame has 36 mm over its height and a 16:9 frame over its width. The readout shows horizontal × vertical FOV of the frame. The capture is the matte's area, so the capture, the matte and the render agree.
- **Aspect Ratio Framing Matte**: Live visual framing guides for canonical DAAG book formats:
  - `3:4` (Standard book panel & cover format)
  - `16:9` (Cinematic widescreen)
  - `1:1` (Square plate)
  - `4:3`, `2:3`, `9:16`
- **Rule-of-Thirds Grid**: Toggleable composition alignment grid.
- **Eye-Level Ground Snap**: Snap the camera to standard human eye height (+1.7m above the terrain or terrace).
- **Coordinate Telemetry**: Real-time readout of Camera `[X, Y, Z]` and Target `[X, Y, Z]`.

### 3. Weather, Time of Day & Sun Angle
- **Presets are the renderer's**: the buttons are `render.py`'s light presets, read from its source through `/api/lights` (`morning`, `golden`, `late`, `noon`, `overcast`, `cloudy_sun`, `evening_cloud`, `dusk`). Choosing one sets the sun at that preset's own elevation, strength and haze, with the sky colours in the viewport matched to it. A preset with an HDRI sky (`overcast`, `cloudy_sun`, `evening_cloud`, `dusk`) has its own sun, so the elevation slider is disabled for it.
- **Sliders are offsets from the preset**, and the Blender render follows them: **Azimuth** is the compass bearing the light comes from (`sun_from`); **Elevation** is `sun_elev` (sun skies only); **Intensity** is `sun_scale`, the sun's strength relative to the preset (1.5 on the slider is the preset as it is); **Fog** is `fog_scale`, the preset's haze (25% on the slider is the preset as it is, 0 is none, 50% is twice as dense). They are saved in the shot, and written only where they differ from the preset. `render.py` reads them for book previs too.
- **Viewport only**: soft shadow maps, the animated sea and the sky dome are for framing; Blender's own sky, sun and haze make the picture.

### 4. Interactive Prop Placement Engine
- **Click-to-Place Raycasting**: Enable "Click Island to Place Prop" mode and click anywhere on terrain, quays, or terraces to spawn models at that exact coordinate.
- **Prop Library (live props)**: the prototypes the islands themselves use (`p_*` collections), exported by `export_props.py` (part of `export.sh`) to `world/build/composer/props/`: carts and handcart, skiff, courier boat, ferry and merchant ship, amphorae, pithoi, crates, sacks, nets, baskets, scrolls, the Doric, Ionic and Corinthian columns, the five statues. Vegetation, rocks, roof tiles and wall blocks are not offered; the scene carries them. Categories become filter chips from the catalog.
- **Transform Gizmo**: Move (`G`), Rotate (`R`, the vertical axis only, since a shot records a yaw) and Scale (`S`, kept uniform). The gizmo sits at the middle of the prop's bounding box and turns it about its own middle; clicking a handle never deselects the prop, even where the handle lies outside the prop's outline. The selected prop also has numeric fields (position of its base in Blender metres, yaw, scale), ±90° buttons and *Drop to ground*, which work from any camera angle, including where a ring is edge-on.
- **Prop Management**: Placed props list with camera focus, individual deletion (`Del`/`Backspace`), and bulk clear.

### 5. Screen View Capture Widget (Without UI Elements)
- **Clean Offscreen Buffer**: Captures the exact 3D viewport cleanly without rendering any HUD, gizmos, labels, or UI overlays.
- **Framing Crop**: Automatically crops to the selected aspect ratio (e.g. `3:4` or `16:9`) at high resolution.
- **One-Click Clipboard Copy**: Copies the clean PNG directly to the system clipboard via `navigator.clipboard.write(ClipboardItem)`.
- **PNG Download**: Downloads the captured previs image with metadata naming.
- **Capture Saving**: Saves the capture and a metadata sidecar to `world/composer/captures/` only. Captures never go into `world/panels`: `previs.py` owns the `previs-*.png` files there and the scene step refuses any without its record.

#### Full-detail render
The capture dialog has a **Render shot** button. It sends the composed shot (island, camera, lens, light, sun bearing, aspect, and the site frame for site shots) to `POST /api/render`, which runs Blender on the built island through `world/src/render.py` and `shots_panels`, one job at a time, and polls `GET /api/render/<job>`. Quality *preview* is half size at 32 samples (about 10 s), *check* is full size at 48, *final* is full size at 160; size is the Gemini 1K or 2K frame for the aspect. The picture lands in `composer/renders/` and shows in the dialog with *Open full size*, *Download* and *Use as Image 1* (which makes the render the previs in the prompt and the ZIP bundle). Props placed in the composer are in the render: they travel as `placed_props`, and `shots_panels` builds the island's own prototypes at those positions. These renders are scratch pictures, not canonical previs: they carry no provenance record. Canonical previs still come from `world/panels/previs.py` after the shot is saved and committed.

#### FLUX generation
The capture dialog's **FLUX generation (local)** card makes a trial picture with FLUX.2 klein 4B on this Mac (the weights and venv are those of `world/fluxlocal.py`, `~/Projects/flux`). It sends the same request `world/panels/flux.py` does: Image 1 is the previs (the capture, or the Blender render once you press *Use as Image 1*), then each cast portrait cropped to the person, then the prompt on screen, built without the printed-names note since FLUX copies printed text into the picture. Set a seed and press **Generate with FLUX**; it takes about 75 s, runs one at a time in a process of its own, and the picture is shown with *Open full size* and *Download*. Pictures land in `composer/flux/` with a note beside each (prompt, cast, seed, model revision). It keeps the previs's camera and the head count less well than Nano Banana 2, so treat it as a trial; unlike `flux.py` it works from the capture, not a committed shot, so the picture carries no provenance record.

#### Test shots
For trying world changes there is a throwaway set of shots, kept apart from the books. In the capture dialog, name a view and press **Save as test shot**; they live in `composer/tests/shots.json` (same shot fields, gitignored, never in `world/panels`). The **Test Shots** button opens them with their last renders: **Render** one, or **Render all** (preview, check or final) after rebuilding an island, and each card shows the latest render beside the one before, so a change shows as a before and after. Renders come from `world/build/<island>.blend` as it is now, with no commit check and no provenance record; each notes the time, the island's build time, the commit and how many `world/src` files were uncommitted (hover a picture). The last six renders of each test shot are kept. *Open in composer* loads a test shot's camera, light and props back into the view.

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
Generates prompts the way `pipeline.request()` does. The style text and cast note are read from `world/panels/pipeline.py` through `/api/prompt`, so they cannot drift (the page keeps a fallback copy for when the server cannot import it):
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
- **What a saved shot records**: the prompt (`prompt`, and `others` for the crowd), the cast ids (`cast`, the reference portraits in `world/cast`), the props placed (`placed_props`: catalog id, Blender position, yaw in degrees, scale; restored when the shot is loaded), plus camera, lens, light and aspect. The prompt style (photo or ligne claire) is chosen when the picture is made, not stored. A shot is a description only: which commit and island build a picture came from is recorded in the picture itself (`world/provenance.py`), not in `shots.json`. `previs.py` renders `placed_props` too (`src/shots_panels.py`), so a saved shot regenerates its scene from the description alone.
- **Merge, never replace**: saving into an existing shot changes only the fields the composer owns (island, cam, target, lens, aspect, cast, prompt, others, light, sun_from) and keeps `base`, `site`, `variants` and everything else. Camera, lens and island are saved with it, in the shot's own space (world, or the building's frame when the shot has a `site`). A *Variant* name saves into `variants.<name>` instead.
- **Direct Book Saving**: the books are the folders of `books/` that have a page (the overview page is not one), listed by title with their shot counts; a book with no `shots.json` yet gets one on the first save. (`the-part-time-parliament`, `ordering-without-clocks`, `the-limits-of-agreement`, `one-leader-at-a-time`, `examples`).
- **Auto-Aggregated Shot Data**: Collects current camera position, target look-at, lens focal length, aspect ratio, lighting condition, sun azimuth, selected cast, scene prompt, and background crowd.
- **Safety First**: Automatically creates a backup (`shots.json.bak`) before saving to avoid data loss.
- **Shot Archive Browser**: every shot of a book, one card per variant, with its newest previs, scene and ligne claire pictures (thumbnails; click one for full size). Filter by shot name, cast or words in the prompt, or show only shots that have pictures. Click a card to jump to the shot: camera (resolving `site` frames), lens, lighting, cast and prompt.

---

## Architecture

```
world/composer/
├── export.sh        # rebuilds the island models: ground.py, then export_glb.py in Blender
├── export_glb.py    # Blender: built island -> world/build/composer/<island>.glb
├── ground.py        # paints the ground colour texture from the terrain masks
├── flux_job.py      # one FLUX picture, run in its own process by the server
├── server.py        # Python ThreadingHTTPServer with Range requests and REST APIs
├── index.html       # Single-page studio interface
├── composer.css     # Glassmorphic Hellenistic dark theme
├── composer.js      # Three.js 0.164.1 app, camera optics, sun simulation, raycaster
├── js/prompt.js     # prompt assembly, identical to pipeline.request()
├── js/util.js       # HTML escaping
├── test_server.py   # server tests: python3 -m unittest world/composer/test_server.py
├── captures/        # Saved viewport screenshots and metadata sidecars
└── README.md        # Documentation and user guide
```

### Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Server health and resource counts |
| `GET` | `/api/books` | Available books and their shot counts |
| `GET` | `/api/books/<book>/shots` | All shots of a book, with `images`: the pictures found under each shot and variant |
| `GET` | `/panels/<book>/<path>.png` | A shot picture; add `?w=360` for a cached JPEG thumbnail |
| `GET`/`POST` | `/api/tests`, `/api/tests/delete` | The throwaway test shots; `POST /api/render` with `"test": id` files the render under that shot |
| `POST` | `/api/flux` | Start a FLUX trial picture from a capture or render, a prompt, the cast and a seed; poll it with `GET /api/render/<job>`; the picture is at `/flux/<job>.png` |
| `POST` | `/api/render` | Start a Blender render of a composed shot; `GET /api/render/<job>` polls it; the picture is at `/renders/<job>.png` |
| `POST` | `/api/books/<book>/shots` | Merge `shot` (optionally into `variant`, with `if_new` keys for new shots) into `shots.json`; atomic write, `.bak` first |
| `GET` | `/api/cast` | Character definitions and portrait URLs |
| `GET` | `/api/prompt` | Style prompts and cast note from `pipeline.py` |
| `GET` | `/api/props` | Categorized catalog of 3D prop models |
| `POST` | `/api/capture` | Save base64 viewport screenshot to disk |
| `GET` | `/api/bundle` | Download ZIP archive of previs, cast, and prompt |
| `GET` | `/api/sites/<island>` | Named places (Blender coordinates) and building frames |
| `GET` | `/models/<island>.glb` | Stream an island model with HTTP 206 Partial Content |
| `GET` | `/props/...` | Stream kit and Polyhaven GLB/GLTF prop models |
| `GET` | `/cast/images/...` | Serve high-resolution character portraits |
