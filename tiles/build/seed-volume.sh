#!/usr/bin/env bash
# Copy tiles/data/tiles.pmtiles into the lesan_tiles named volume (production deployment).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="${TILES_DATA:-$ROOT/data}"
VOLUME="${TILES_VOLUME:-lesan_tiles}"
[ -f "$DATA/tiles.pmtiles" ] || { echo "no $DATA/tiles.pmtiles — run extract.sh first" >&2; exit 1; }
docker volume inspect "$VOLUME" >/dev/null 2>&1 || docker volume create "$VOLUME"
docker run --rm -v "$VOLUME":/data -v "$DATA":/src:ro alpine \
  sh -c 'cp /src/tiles.pmtiles /data/tiles.pmtiles && { cp /src/.source-stamp /data/.source-stamp 2>/dev/null || true; }'
echo "seeded volume $VOLUME"
