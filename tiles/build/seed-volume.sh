#!/usr/bin/env bash
# Copy tiles/data/tiles.pmtiles into the lesan_tiles named volume (production deployment).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="${TILES_DATA:-$ROOT/data}"
VOLUME="${TILES_VOLUME:-lesan_tiles}"
log() { printf '[seed-volume] %s\n' "$*"; }
die() { printf '[seed-volume] ERROR: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker not found (this is the Docker-only path; the native run needs no volume)"
[ -f "$DATA/tiles.pmtiles" ] || die "no $DATA/tiles.pmtiles — run extract.sh first"

if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  log "volume $VOLUME exists — copying archive (overwrites)"
else
  log "creating volume $VOLUME"
  docker volume create "$VOLUME" >/dev/null
fi

log "copying $(du -h "$DATA/tiles.pmtiles" | cut -f1) archive into $VOLUME…"
docker run --rm -v "$VOLUME":/data -v "$DATA":/src:ro alpine \
  sh -c 'cp /src/tiles.pmtiles /data/tiles.pmtiles && { cp /src/.source-stamp /data/.source-stamp 2>/dev/null || true; }'
log "seeded volume $VOLUME"
