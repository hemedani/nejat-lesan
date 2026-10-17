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

# Refuse to start on a taken port. Without this, `pmtiles` dies with
# "bind: address already in use", the script carries on, `caddy` binds :8790
# against nothing, and every tile request returns 502 while /healthz still
# says 200 — an already-running instance looks like a broken map.
port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

for p in "$PMTILES_PORT" "$PORT"; do
  if port_in_use "$p"; then
    echo "port $p is already in use — another instance is probably running." >&2
    echo "stop it first:  lsof -nP -iTCP:$p -sTCP:LISTEN" >&2
    exit 1
  fi
done

"$BIN/pmtiles" serve "$DATA" \
  --port="$PMTILES_PORT" --public-url="$TILES_PUBLIC_ORIGIN" --cors='*' --cache-size=256 &
PMTILES_PID=$!
trap 'kill "$PMTILES_PID" 2>/dev/null || true' EXIT

# Wait for the upstream to accept connections before fronting it. `/dev/tcp` is a
# bash builtin, so this needs no curl/nc. A dead upstream is fatal here, not a
# silent 502 later.
wait_for_port() {
  local port=$1 pid=$2 tries=$3 i=0
  while [ "$i" -lt "$tries" ]; do
    kill -0 "$pid" 2>/dev/null || return 1
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      exec 3>&- 3<&-
      return 0
    fi
    sleep 0.1
    i=$((i + 1))
  done
  return 1
}

if ! wait_for_port "$PMTILES_PORT" "$PMTILES_PID" 100; then
  echo "pmtiles did not come up on :$PMTILES_PORT — see its output above." >&2
  exit 1
fi

echo "origin: $TILES_PUBLIC_ORIGIN  (pmtiles :$PMTILES_PORT → caddy :$PORT)"
PORT="$PORT" SRV_ROOT="$ROOT/dist" TILES_UPSTREAM="127.0.0.1:$PMTILES_PORT" \
  "$BIN/caddy" run --config "$ROOT/Caddyfile" --adapter caddyfile
