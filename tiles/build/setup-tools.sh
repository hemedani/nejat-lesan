#!/usr/bin/env bash
# Download the pinned native tools (pmtiles, caddy) into tiles/bin/. Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/bin"; mkdir -p "$BIN"
PMTILES_VER=1.31.2
CADDY_VER=2.11.7
os="$(uname -s)"; arch="$(uname -m)"
case "$os/$arch" in
  Darwin/x86_64)  PM="go-pmtiles-${PMTILES_VER}_Darwin_x86_64.zip";   CA="mac_amd64" ;;
  Darwin/arm64)   PM="go-pmtiles-${PMTILES_VER}_Darwin_arm64.zip";    CA="mac_arm64" ;;
  Linux/x86_64)   PM="go-pmtiles_${PMTILES_VER}_Linux_x86_64.tar.gz"; CA="linux_amd64" ;;
  Linux/aarch64)  PM="go-pmtiles_${PMTILES_VER}_Linux_arm64.tar.gz";  CA="linux_arm64" ;;
  *) echo "unsupported platform $os/$arch" >&2; exit 1 ;;
esac

if [[ ! -x "$BIN/pmtiles" ]]; then
  tmp="$(mktemp -d)"
  curl -fL -o "$tmp/pm" "https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VER}/${PM}"
  case "$PM" in
    *.zip)    unzip -o "$tmp/pm" pmtiles -d "$BIN" >/dev/null ;;
    *.tar.gz) tar -xzf "$tmp/pm" -C "$BIN" pmtiles ;;
  esac
  chmod +x "$BIN/pmtiles"; rm -rf "$tmp"
fi

if [[ ! -x "$BIN/caddy" ]]; then
  tmp="$(mktemp -d)"
  curl -fL -o "$tmp/caddy.tgz" "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VER}/caddy_${CADDY_VER}_${CA}.tar.gz"
  tar -xzf "$tmp/caddy.tgz" -C "$tmp" caddy
  mv "$tmp/caddy" "$BIN/caddy"; chmod +x "$BIN/caddy"; rm -rf "$tmp"
fi

"$BIN/pmtiles" version
"$BIN/caddy" version
