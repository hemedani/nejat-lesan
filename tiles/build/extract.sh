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
CONNECT_TIMEOUT="${TILES_CONNECT_TIMEOUT:-20}"

ts() { date '+%H:%M:%S'; }
log() { printf '%s [extract] %s\n' "$(ts)" "$*"; }
die() { printf '%s [extract] ERROR: %s\n' "$(ts)" "$*" >&2; exit 1; }
sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }

# Printed on any network failure. The usual cause on an Iranian VPS is
# build.protomaps.com (Cloudflare) being unreachable — which fails as a TCP
# timeout deep inside `pmtiles`, not as a tidy "no route" error.
remediation() {
  cat >&2 <<EOF

  The Protomaps build host could not be reached. Options:

   1) Copy a prebuilt archive instead of downloading here (no VPN needed).
      On a machine that CAN reach build.protomaps.com:
        scp tiles/data/tiles.pmtiles tiles/data/.source-stamp \\
            <user>@<vps>:/home/suser/work/nejat-lesan/tiles/data/
      With both files present under tiles/data/ the stamp matches and this
      script skips extraction entirely. Current expected stamp:
        ${WANT}

   2) Route through a proxy/VPN, then re-run:
        HTTPS_PROXY=http://<proxy-host>:<port> \\
          PROTOMAPS_BUILD_DATE=${SOURCE_DATE} ./build/extract.sh
EOF
}

# Fail fast (seconds) with a clear message instead of hanging for minutes when
# the source host is unreachable. Uses a ranged GET, exactly like `pmtiles`
# itself, so a host that answers HEAD but not range requests is still caught.
probe_source() {
  command -v curl >/dev/null 2>&1 || { log "curl not found; skipping reachability probe"; return 0; }
  log "probing reachability of ${SOURCE} (timeout ${CONNECT_TIMEOUT}s)…"
  local code
  code="$(curl -sS -L --max-time "$CONNECT_TIMEOUT" -r 0-16383 -o /dev/null -w '%{http_code}' "$SOURCE" 2>/dev/null || true)"
  if [[ "$code" != "200" && "$code" != "206" ]]; then
    printf '%s [extract] ERROR: cannot reach %s (HTTP %s)\n' "$(ts)" "$SOURCE" "${code:-timeout}" >&2
    remediation
    exit 1
  fi
  log "source reachable (HTTP $code)"
}

[ -x "$PMTILES" ] || die "missing $PMTILES — run tiles/build/setup-tools.sh"
mkdir -p "$DATA"

if [[ -f "$ARCHIVE" && "$(cat "$STAMP" 2>/dev/null || true)" == "$WANT" ]]; then
  log "archive up to date; skipping extract"
  log "  stamp: ${WANT}"
  log "  file:  $(du -h "$ARCHIVE" | cut -f1)  $ARCHIVE"
else
  [[ -f "$ARCHIVE" ]] && log "existing archive is stale (or unstamped) — re-extracting"
  probe_source
  log "extracting ${SOURCE}"
  log "  bbox=${BBOX}  maxzoom=${MAXZOOM}  threads=16"
  log "  → ${ARCHIVE}"
  log "  downloading the Iran subset — this can take several minutes; pmtiles prints its own progress below"
  started="$(date +%s)"
  if ! "$PMTILES" extract "$SOURCE" "$ARCHIVE" \
    --bbox="$BBOX" --maxzoom="$MAXZOOM" --download-threads=16; then
    printf '%s [extract] ERROR: pmtiles extract failed (see its error above).\n' "$(ts)" >&2
    remediation
    exit 1
  fi
  log "extract finished in $(( $(date +%s) - started ))s; writing stamp"
  printf '%s' "$WANT" > "$STAMP"
fi

log "verifying archive…"
"$PMTILES" verify "$ARCHIVE" || die "archive verification failed"

log "header:"
"$PMTILES" show "$ARCHIVE"

log "recording size + digest…"
sha256 "$ARCHIVE" | sed "s#${DATA}/##" | tee "$DATA/tiles.pmtiles.sha256"
ls -lh "$ARCHIVE"

log "DONE. Record the archive size above for the README (expected: single-digit GB)."
