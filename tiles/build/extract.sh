#!/usr/bin/env bash
# Extract a clipped Iran basemap archive into tiles/data/tiles.pmtiles (native pmtiles).
# Idempotent: re-running with the archive present and the same source/params skips extraction.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PMTILES="${PMTILES:-$ROOT/bin/pmtiles}"
DATA="${TILES_DATA:-$ROOT/data}"
SOURCE_DATE="${PROTOMAPS_BUILD_DATE:?set PROTOMAPS_BUILD_DATE=YYYYMMDD (a Protomaps daily build date)}"
SOURCE="https://build.protomaps.com/${SOURCE_DATE}.pmtiles"
BBOX="$(jq -r '.areas[] | select(.id=="iran") | .bbox | map(tostring) | join(",")' "$ROOT/config/areas.json")"
MAXZOOM="$(jq -r '.areas[] | select(.id=="iran") | .maxzoom' "$ROOT/config/areas.json")"
ARCHIVE="$DATA/tiles.pmtiles"
STAMP="$DATA/.source-stamp"
WANT="${SOURCE}|${BBOX}|${MAXZOOM}"

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }

[ -x "$PMTILES" ] || { echo "missing $PMTILES — run tiles/build/setup-tools.sh" >&2; exit 1; }
mkdir -p "$DATA"

if [[ -f "$ARCHIVE" && "$(cat "$STAMP" 2>/dev/null || true)" == "$WANT" ]]; then
  echo "archive up to date (${WANT}); skipping extract"
else
  echo "extracting ${SOURCE} bbox=${BBOX} maxzoom=${MAXZOOM} → ${ARCHIVE}"
  "$PMTILES" extract "$SOURCE" "$ARCHIVE" \
    --bbox="$BBOX" --maxzoom="$MAXZOOM" --download-threads=16
  printf '%s' "$WANT" > "$STAMP"
fi

echo "verifying archive…"
"$PMTILES" verify "$ARCHIVE"

echo "header:"
"$PMTILES" show "$ARCHIVE"

echo "recording size + digest…"
sha256 "$ARCHIVE" | sed "s#${DATA}/##" | tee "$DATA/tiles.pmtiles.sha256"
ls -lh "$ARCHIVE"

echo "DONE. Record the archive size above for the README (expected: single-digit GB)."
