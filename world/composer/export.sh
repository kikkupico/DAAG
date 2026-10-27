#!/bin/sh
# Rebuild the composer's island models from the built islands: sh world/composer/export.sh [arche paxos]
set -e
here=$(cd "$(dirname "$0")" && pwd)
for island in ${@:-arche paxos}; do
  python3 "$here/ground.py" "$island"
  blender -b "$here/../build/$island.blend" -P "$here/export_glb.py"
  blender -b "$here/../build/$island.blend" -P "$here/export_props.py"
done
