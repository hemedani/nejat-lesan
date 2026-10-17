#!/usr/bin/env bash
# Download the pinned native tools (pmtiles, caddy) into tiles/bin/. Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/bin"; mkdir -p "$BIN"
PMTILES_VER=1.31.2
CADDY_VER=2.11.7
log() { printf '[setup-tools] %s\n' "$*"; }
os="$(uname -s)"; arch="$(uname -m)"
log "platform $os/$arch — target $BIN"
case "$os/$arch" in
  Darwin/x86_64)  PM="go-pmtiles-${PMTILES_VER}_Darwin_x86_64.zip";   CA="mac_amd64" ;;
  Darwin/arm64)   PM="go-pmtiles-${PMTILES_VER}_Darwin_arm64.zip";    CA="mac_arm64" ;;
  Linux/x86_64)   PM="go-pmtiles_${PMTILES_VER}_Linux_x86_64.tar.gz"; CA="linux_amd64" ;;
  Linux/aarch64)  PM="go-pmtiles_${PMTILES_VER}_Linux_arm64.tar.gz";  CA="linux_arm64" ;;
  *) echo "unsupported platform $os/$arch" >&2; exit 1 ;;
esac

if [[ ! -x "$BIN/pmtiles" ]]; then
  log "downloading pmtiles ${PMTILES_VER} (${PM})…"
  tmp="$(mktemp -d)"
  curl -fL --retry 3 --retry-delay 2 -o "$tmp/pm" "https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VER}/${PM}"
  case "$PM" in
    *.zip)    unzip -o "$tmp/pm" pmtiles -d "$BIN" >/dev/null ;;
    *.tar.gz) tar -xzf "$tmp/pm" -C "$BIN" pmtiles ;;
  esac
  chmod +x "$BIN/pmtiles"; rm -rf "$tmp"
  log "installed $BIN/pmtiles"
else
  log "pmtiles already present — skipping"
fi

if [[ ! -x "$BIN/caddy" ]]; then
  log "downloading caddy ${CADDY_VER} (${CA})…"
  tmp="$(mktemp -d)"
  curl -fL --retry 3 --retry-delay 2 -o "$tmp/caddy.tgz" "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VER}/caddy_${CADDY_VER}_${CA}.tar.gz"
  tar -xzf "$tmp/caddy.tgz" -C "$tmp" caddy
  mv "$tmp/caddy" "$BIN/caddy"; chmod +x "$BIN/caddy"; rm -rf "$tmp"
  log "installed $BIN/caddy"
else
  log "caddy already present — skipping"
fi

log "versions:"

"$BIN/pmtiles" version
"$BIN/caddy" version
