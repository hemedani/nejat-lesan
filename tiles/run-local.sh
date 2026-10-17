#!/usr/bin/env bash
# Native local bring-up: pmtiles serve (upstream) + caddy (static + proxy) on one origin.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$ROOT/bin"
DATA="${TILES_DATA:-$ROOT/data}"
PORT="${PORT:-8790}"
PMTILES_PORT="${PMTILES_PORT:-8080}"
TILES_PUBLIC_ORIGIN="${TILES_PUBLIC_ORIGIN:-http://localhost:$PORT}"

[ -f "$DATA/tiles.pmtiles" ] || { echo "no $DATA/tiles.pmtiles — run build/extract.sh" >&2; exit 1; }
[ -d "$ROOT/dist" ] || { echo "no dist/ — run build/gen-artifacts.sh" >&2; exit 1; }

"$BIN/pmtiles" serve "$DATA" \
  --port="$PMTILES_PORT" --public-url="$TILES_PUBLIC_ORIGIN" --cors='*' --cache-size=256 &
PMTILES_PID=$!
trap 'kill "$PMTILES_PID" 2>/dev/null || true' EXIT

echo "origin: $TILES_PUBLIC_ORIGIN  (pmtiles :$PMTILES_PORT → caddy :$PORT)"
PORT="$PORT" SRV_ROOT="$ROOT/dist" TILES_UPSTREAM="127.0.0.1:$PMTILES_PORT" \
  "$BIN/caddy" run --config "$ROOT/Caddyfile" --adapter caddyfile
