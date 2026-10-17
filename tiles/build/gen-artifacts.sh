#!/usr/bin/env bash
# Build the static serving artifacts (style, TileJSON, glyphs, sprites, areas) into tiles/dist.
# Requires: node + tiles deps installed, tiles/data/tiles.pmtiles present, TILES_PUBLIC_ORIGIN set.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PMTILES="${PMTILES:-$ROOT/bin/pmtiles}"
DATA="${TILES_DATA:-$ROOT/data}"
export TILES_PUBLIC_ORIGIN="${TILES_PUBLIC_ORIGIN:-http://localhost:8790}"

echo "origin: $TILES_PUBLIC_ORIGIN"
[ -f "$DATA/tiles.pmtiles" ] || { echo "no $DATA/tiles.pmtiles — run extract.sh first" >&2; exit 1; }

rm -rf dist
mkdir -p dist/sprites

echo "[1/4] glyphs"
node build/gen-glyphs.mjs

echo "[2/4] tilejson"
"$PMTILES" show "$DATA/tiles.pmtiles" --tilejson --public-url="$TILES_PUBLIC_ORIGIN" > /tmp/tiles.generated.json
node build/gen-tilejson.mjs /tmp/tiles.generated.json

echo "[3/4] style"
node build/gen-style.mjs

echo "[4/4] sprites + areas"
cp -R sprites/. dist/sprites/
cp config/areas.json dist/areas.json

echo "artifacts:"
find dist -maxdepth 2 -type f | sort | sed "s#^#  #"
du -sh dist
