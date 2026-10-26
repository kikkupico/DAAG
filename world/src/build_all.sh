#!/bin/sh
# Rebuild everything from scratch: assets, both islands' terrain and scenes, every render, the road
# plans and the showcase. Run from world/:  sh src/build_all.sh [final|preview]
# Downloads are kept once fetched, so a second run only rebuilds.
set -e
Q=${1:-final}
cd "$(dirname "$0")/.."

python3 src/fetch_polyhaven.py          # CC0 textures, rocks, shrubs, skies -> assets/polyhaven
python3 src/fetch_statues.py            # statue scans from Three D Scans -> assets/statues
python3 src/fetch_leros.py              # Leros's coastline and elevation -> assets/leros
python3 src/gen_leaves.py               # leaf-spray textures -> assets/leaves
python3 src/gen_diagram.py              # the stoa's painted panel -> assets/painted
blender -b -P src/prep_statues.py       # the scans, decimated and upright -> assets/statues/statues.blend

python3 src/terrain_arche.py 4096       # height field, masks, sites, checks -> build/terrain/arche
python3 src/terrain_paxos.py 6144       # the same for Paxos
python3 src/road_maps.py                # grade-coloured road plans -> renders/preview

blender -b -P src/build_arche.py -- 1   # -> build/arche.blend
blender -b -P src/build_paxos.py -- 1   # -> build/paxos.blend
blender -b build/arche.blend -P src/render.py -- shots_arche all "$Q"
blender -b build/paxos.blend -P src/render.py -- shots_paxos all "$Q"

python3 src/gen_showcase.py "$Q"        # showcase/index.html and showcase/img from these renders
echo "built: renders/$Q, showcase/index.html"
