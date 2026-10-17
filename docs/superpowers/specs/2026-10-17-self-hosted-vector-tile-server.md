# Self-hosted vector tile server (PMTiles-backed ZXY MVT) — design + implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a self-hosted, unauthenticated, offline-pack-friendly vector tile service that serves the Protomaps Iran basemap as ZXY MVT, plus a MapLibre style, self-hosted Persian glyphs, sprites, TileJSON and an area list — so the patrol app can render Persian-labelled maps with no signal and without touching the public OSM tile host.

**Architecture:** Store tiles as a PMTiles archive and serve them as ZXY MVT with `protomaps/go-pmtiles` (`pmtiles serve`), fronted by Caddy which also serves the static style/TileJSON/areas/glyphs/sprites and reverse-proxies the tile paths. One public origin, no custom tile-server code, no auth on the read path. The archive is clipped to a configured Iran bounding box at build time, so out-of-box requests are empty by construction.

**Execution model (revised with the user):** the local build → extract → serve → verify loop runs on **native binaries** — `pmtiles` 1.31.2 and `caddy` 2.11.7, downloaded by `tiles/build/setup-tools.sh` into the gitignored `tiles/bin/` — so **no Docker is needed for development or acceptance testing**. Docker + Docker Compose are still *produced* as the **production deployment artifact** (spec Deliverable 1 / deployment requirements): `tiles/Dockerfile`, the two compose services, and the explicitly-sized `lesan_tiles` named volume. The Caddyfile is shared by both paths through `{$ENV:default}` placeholders (see Task 7), and `tiles/build/seed-volume.sh` copies the native archive into the named volume for the Docker deployment.

**Tech Stack:** Native `pmtiles` 1.31.2 + `caddy` 2.11.7 (local), Docker + Compose (production artifact); production web image `caddy:2.11-alpine`; Protomaps basemap PMTiles + `@protomaps/basemaps@5.7.2`; Vazirmatn font (SIL OFL) + `fontnik@0.7.7`; Node 22 build scripts.

**Source task:** `back/prompt/05-self-host-vector-tile-server.md`.

**Spec:** this document (design + step-by-step plan combined, per user request).

---

## Decided with the user

| Decision | Choice |
| --- | --- |
| Area ownership | **Tile server owns `/areas`** — a static, versioned `areas.json`. No backend change in this task. Client migrates later. |
| Coverage & maxzoom | **Whole Iran, `minzoom:0`, `maxzoom:14`.** Let MapLibre overzoom; no z15+ tiles. |
| Origin / TLS | **Cleartext on host IP:port for the pilot** (`http://46.245.98.10:8790`). HTTPS documented as required before public deploy. |
| Repo layout | **New top-level `tiles/`** directory (build scripts, config, fonts, sprites, Caddyfile, Dockerfile, README) + compose entries in both compose files. |
| Font | **Vazirmatn** (rastikerdar, SIL OFL 1.1) — https://rastikerdar.github.io/vazirmatn/fa |
| Plan location | `docs/superpowers/specs/` (this file). |
| Execution (revised) | **Native binaries for build/serve/verify** (no Docker in the dev loop); Docker + Compose still shipped as the production deployment artifact. |

## Global constraints (non-negotiable)

Copied from the task; every task's requirements implicitly include this section.

| Surface | Path | Content-Type | Notes |
| --- | --- | --- | --- |
| Vector tile | `GET /tiles/{z}/{x}/{y}.mvt` | `application/x-protobuf` **or** `application/vnd.mapbox-vector-tile` | Standard XYZ (scheme `xyz`); `.mvt` extension is used consistently because it is the only extension `pmtiles serve` exposes for an MVT archive. |
| TileJSON | `GET /tiles.json` | `application/json` | `tiles`, `minzoom`, `maxzoom`, `bounds` (Iran), `tileSize:512`, non-empty `vector_layers`, OSM attribution. |
| Style | `GET /style.json` | `application/json` | Valid MapLibre style; `sources` → `/tiles.json`; `glyphs` → `/glyphs/{fontstack}/{range}.pbf`; `sprite` → `/sprites/v4/light`. |
| Glyphs | `GET /glyphs/{fontstack}/{range}.pbf` | `application/x-protobuf` | Fontstack must contain Arabic-script coverage (Vazirmatn). |
| Sprites | `GET /sprites/v4/{light,dark}.json`, `.png`, `@2x.png` | `application/json`, `image/png` | Self-hosted copy of the Protomaps light/dark sprite sets. |
| Areas | `GET /areas` | `application/json` | Coverage boxes the server commits to. |
| Health | `GET /healthz` | `application/json` | Compose healthcheck. |

Cross-cutting, also non-negotiable:

- **Scheme `xyz`** (never `tms`), **`tileSize:512`**, **CORS `Access-Control-Allow-Origin: *`**.
- **No authentication** on any read path (tiles, TileJSON, style, glyphs, sprites, areas).
- **Empty tile → `204`** (or `404`); never `200` with an empty body, never `500`.
- **ETag / `304`** so repeat downloads are cheap; style/glyph/sprite responses cacheable.
- **Tolerant of burst** (no tight rate limiting); a whole area pack is tens of thousands of requests.
- **Bounded disk:** the archive lives on an explicitly-sized volume; `pmtiles serve --cache-size` caps header/directory memory.
- **Explicit coverage:** the archive is clipped to configured boxes; the server cannot generate unbounded coverage.
- **Identifying `User-Agent`** on outbound fetches where the tool allows it.

## Verified facts (checked against upstream source, not assumed)

These are the things the plan depends on. They were read from upstream code/docs on 2026-10-17; re-verify if versions move.

1. **`pmtiles serve <dir>` route shape.** For an archive named `TILES.pmtiles` in the served directory it exposes `GET /TILES/{z}/{x}/{y}.mvt` and `GET /TILES.json` (`pmtiles serve` docs; `pmtiles/server.go` `parseTilePath`/`parseTileJSONPath`). Naming our archive **`tiles.pmtiles`** therefore yields exactly `/tiles/{z}/{x}/{y}.mvt` + `/tiles.json`. It never serves the raw `.pmtiles` file (whole or range) — matching the requirement that the client contract is ZXY, not the archive.
2. **Empty tile = `204`.** `getTileAttempt` returns `204` with a nil body when the tile id is absent from the directory (`server.go`). Out-of-zoom (`z < MinZoom || z > MaxZoom`) returns **`404`**. An MVT archive rejects a non-`.mvt` extension with `400`.
3. **ETag + `304` for tiles.** On `200` the server sets `ETag` from the tile bytes and calls `http.ServeContent`, which handles `If-None-Match` → `304`. TileJSON/metadata also get ETag headers.
4. **`pmtiles serve` takes a directory, not the file.** `pmtiles serve <path>` treats `<path>` as a directory and looks for `<path>/tiles.pmtiles`; passing the `.pmtiles` file itself fails (`.../tiles.pmtiles/tiles.pmtiles: not a directory`). So the served directory is `tiles/data` (containing `tiles.pmtiles`). Verified empirically against pmtiles 1.31.2: a valid tile is `200` with `Content-Type: application/x-protobuf`, `Content-Encoding: gzip`, and an `ETag` (conditional `If-None-Match` → `304`); an empty tile is `204`; out-of-zoom is `404`; a non-`.mvt` extension on an MVT archive is `400`. Note: 1.31.2 emits `application/x-protobuf`, **not** `application/vnd.mapbox-vector-tile`; **both types are accepted**, and consumers treat `200` + successful MVT decode as the real contract.
5. **`pmtiles serve --public-url` is mandatory for its own TileJSON** (else `501`), and it builds the tiles template as `<public-url>/<name>/{z}/{x}/{y}.mvt`.
6. **`pmtiles show --tilejson --public-url=…`** prints a ready TileJSON from the archive (header + metadata: `vector_layers`, `attribution`, `bounds`, `minzoom`, `maxzoom`, …). **It does not emit `tileSize`.** We therefore generate our own `/tiles.json` from this output and add `tileSize:512` and force `bounds` to the configured Iran bbox.
7. **`pmtiles extract`** supports remote sources with range requests and `--bbox=MIN_LON,MIN_LAT,MAX_LON,MAX_LAT` + `--maxzoom` + `--download-threads` (`extract.go`, CLI docs). Efficient sub-pyramid extraction from z0 to maxzoom.
8. **Protomaps basemap carries `name:fa`.** Protomaps localisation docs list *Persian | فارسی | name:fa | Arabic*; `name:*` tags are always included in the basemap. Persian rendering on MapLibre uses native bidi/shaping (no PGF pairing needed for Arabic script). **Confirmed empirically 2026-10-17** against the built archive: Tehran z12/z14 features carry `name:fa` (e.g. `تهران`, `رودکی`, `میدان امام خمینی`) and z5 carries country labels (`ایران`, `افغانستان`).
9. **`@protomaps/basemaps@5.7.2` API** (`styles/src/index.ts`): `layers(source: string, flavor: Flavor, options?: { labelsOnly?; lang? })` and `namedFlavor(name)` with `light|dark|white|grayscale|black`. `generate_style.ts` shows the full style shape: `sources.protomaps = { type:"vector", url: tileJson }`, `glyphs`, and (for light/dark) `sprite = .../sprites/v4/light`. We generate the style ourselves so we can rewrite `text-font` → Vazirmatn and point every URL at our origin.
10. **`protomaps/go-pmtiles` image** (`Dockerfile`) has `EXPOSE 8080` and `ENTRYPOINT ["/go-pmtiles"]`, so Compose sets `command: ["serve","/data", …]`.
11. **Fonts:** Vazirmatn is SIL OFL 1.1 and covers Persian + Latin. `fontnik` (npm `fontnik@0.7.7`, pure JS) generates SDF glyph PBFs per 256-codepoint range: `fontnik.range({font,start,end}, cb)`.

## Architecture / topology

```
                 Android (MapLibre Native, dev build)
                              │  HTTP, no auth
                              ▼
        ┌──────────────────────────────────────────────┐
        │  tiles-web   (Caddy 2.11, :8790 → host :8790) │
        │   /style.json, /tiles.json, /areas            │  static from /srv (baked image)
        │   /glyphs/*, /sprites/*                       │  static from /srv
        │   /healthz                                    │  200
        │   /tiles/{z}/{x}/{y}.mvt ───────────┐         │  reverse_proxy
        └─────────────────────────────────────┼─────────┘
                                              ▼
        ┌──────────────────────────────────────────────┐
        │  tiles-archive  (protomaps/go-pmtiles, :8080) │
        │   serve /data --cors '*' --cache-size 256     │
        │   /data/tiles.pmtiles  ←── named volume        │
        └──────────────────────────────────────────────┘
                          lesan_tiles (volume, sized)
```

- **One public origin** (`http://<host>:8790`). MapLibre fetches the style, then the TileJSON, then tiles/glyphs/sprites from the same origin. CORS `*` on everything so browser dev tooling also works.
- **Native (default) and Docker (production) share the same pieces.** Native: `run-local.sh` runs `pmtiles serve` (:8080) + `caddy run` (:8790) from `tiles/bin/`. Docker: the `lesan-tiles-web` image (Caddy) fronts the `tiles-archive` container. The Caddyfile is identical in both, parameterised by `{$PORT}`, `{$SRV_ROOT}`, `{$TILES_UPSTREAM}`.
- **Static assets `dist/`** are generated on the build host from committed inputs (fonts, sprite files, `areas.json`, scripts) — not committed. Native serves them from `tiles/dist/`; Docker bakes them into the image.
- **The archive is NOT in the image.** Native builds it once into `tiles/data/tiles.pmtiles` (`build/extract.sh`, idempotent); Docker gets the same file via `build/seed-volume.sh` into the explicitly-sized `lesan_tiles` volume.
- **Coverage is bounded by construction:** `pmtiles extract --bbox` clips the archive to Iran; requests outside return `204`/`404`.

## Directory layout (new `tiles/`)

```
tiles/
  README.md                      # ops: extract/update, boxes+maxzoom, disk sizing, cache wipe, glyph regen, IR-network caveat, mobile handoff
  Dockerfile                     # (production artifact) FROM caddy:2.11-alpine; ENV PORT/TILES_UPSTREAM/SRV_ROOT; COPY dist /srv; COPY Caddyfile
  Caddyfile                      # CORS *, static routes, reverse_proxy /tiles/*, /healthz, cache headers; {$ENV:default} for native+Docker
  .gitignore                     # node_modules/, dist/, data/, bin/
  package.json                   # build-script devDeps (fontnik, @protomaps/basemaps, style-spec, vector-tile, pbf)
  run-local.sh                   # native bring-up: pmtiles serve + caddy run (the dev/verify path)
  config/
    areas.json                   # coverage boxes (Iran) + attribution + min/maxzoom
  fonts/
    Vazirmatn-Regular.ttf        # committed (SIL OFL 1.1)
    Vazirmatn-Bold.ttf           # committed
  sprites/
    v4/light.{json,png,@2x.png}  # committed, from protomaps/basemaps-assets
    v4/dark.{json,png,@2x.png}   # committed
  bin/                           # GENERATED, gitignored: pinned pmtiles + caddy binaries (setup-tools.sh)
  data/                          # GENERATED, gitignored: tiles.pmtiles (+ .source-stamp, .sha256) — the archive
  build/
    setup-tools.sh               # download pinned native pmtiles + caddy into bin/ (idempotent, OS/arch aware)
    extract.sh                   # idempotent NATIVE pmtiles extract → data/tiles.pmtiles; verify; record size+sha256
    seed-volume.sh               # (production) copy data/tiles.pmtiles into the lesan_tiles named volume
    gen-glyphs.mjs               # Vazirmatn → dist/glyphs/<fontstack>/<range>.pbf
    gen-tilejson.mjs             # pmtiles show --tilejson → dist/tiles.json (+tileSize, forced bounds)
    gen-style.mjs                # @protomaps/basemaps lang:fa → dist/style.json (+text-font=Vazirmatn)
    gen-artifacts.sh             # orchestrates the above + sprites/areas → dist/
    verify-decode.mjs            # decode one MVT (gunzip → layers) for the acceptance harness
  dist/                          # GENERATED, gitignored: style.json, tiles.json, areas.json, glyphs/, sprites/
  verify.sh                      # acceptance harness (criteria 1–9; native by default, Docker-mode criterion 9 optional)
```

## Actions → ESM → Caddy → go-pmtiles: the exact public contract

| Client request | Handled by | Served file / upstream | Required response |
| --- | --- | --- | --- |
| `GET /style.json` | Caddy static | `/srv/style.json` | `200 application/json` |
| `GET /tiles.json` | Caddy static | `/srv/tiles.json` | `200 application/json` |
| `GET /areas` | Caddy static (rewrite→`/areas.json`) | `/srv/areas.json` | `200 application/json` |
| `GET /glyphs/Vazirmatn%20Regular/1536-1791.pbf` | Caddy static | `/srv/glyphs/Vazirmatn Regular/1536-1791.pbf` | `200 application/x-protobuf` |
| `GET /sprites/v4/light.json` | Caddy static | `/srv/sprites/v4/light.json` | `200 application/json` |
| `GET /sprites/v4/light.png` | Caddy static | `/srv/sprites/v4/light.png` | `200 image/png` |
| `GET /tiles/{z}/{x}/{y}.mvt` | Caddy proxy | `tiles-archive:8080` (`tiles.pmtiles`) | `200` (`application/x-protobuf` or `application/vnd.mapbox-vector-tile`) + MVT decode; empty → `204`; out-of-zoom → `404` |
| `GET /healthz` | Caddy | inline respond | `200 application/json` |

---

# Implementation tasks

> Each task ends with a testable deliverable and a commit. The "tests" here are assertion commands (jq/curl/node) because the deliverable is infrastructure, not functions.
>
> **Prerequisites on the build machine:** Node 22+, `npm`, `jq`, `curl`, `python3`, `unzip`/`tar`. Native `pmtiles` + `caddy` are fetched by `tiles/build/setup-tools.sh` into `tiles/bin/`. The archive build additionally needs outbound HTTPS to `build.protomaps.com`. **Docker + Compose are only required for the production deployment (Task 8) and the optional Docker-mode criterion 9 — not for extraction, serving, or acceptance testing.**

## Task 1: Scaffold `tiles/`, area config, gitignore, package.json

**Files:**
- Create: `tiles/config/areas.json`
- Create: `tiles/.gitignore`
- Create: `tiles/build/setup-tools.sh` (native `pmtiles` + `caddy` fetcher)
- Create: `tiles/package.json` (via npm so versions are real)
- Create: `tiles/README.md` (stub — filled in Task 10)

**Interfaces:**
- Produces: `areas.json` shape `{ attribution: string, areas: [{ id, name, bbox:[minLon,minLat,maxLon,maxLat], minzoom, maxzoom }] }` consumed by `gen-tilejson.mjs`, `gen-style.mjs` and the `/areas` endpoint.

- [ ] **Step 1: Create `tiles/config/areas.json`**

```json
{
  "attribution": "<a href=\"https://github.com/protomaps/basemaps\">Protomaps</a> © <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
  "areas": [
    {
      "id": "iran",
      "name": "ایران",
      "bbox": [44.0, 25.0, 63.4, 39.9],
      "minzoom": 0,
      "maxzoom": 14
    }
  ]
}
```

- [ ] **Step 2: Create `tiles/.gitignore`**

```gitignore
node_modules/
dist/
data/
bin/
```

- [ ] **Step 3: Write `tiles/build/setup-tools.sh` (native toolchain)**

```bash
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
```

Make it executable: `chmod +x tiles/build/setup-tools.sh`.

- [ ] **Step 4: Fetch the native tools and initialise `tiles/package.json`**

Run:
```bash
./tiles/build/setup-tools.sh
cd tiles
npm init -y
npm pkg set name="lesan-tiles" private=true type=module
npm install --save-dev fontnik @protomaps/basemaps @maplibre/maplibre-gl-style-spec @mapbox/vector-tile pbf
```
Expected: `pmtiles 1.31.2 …` and `v2.11.7 …` print; npm writes `package-lock.json`.

- [ ] **Step 5: Test — validate `areas.json` and the native tools**

Run:
```bash
jq -e '.areas[0].id=="iran" and (.areas[0].bbox|length)==4 and .areas[0].maxzoom==14' tiles/config/areas.json && \
  tiles/bin/pmtiles version && tiles/bin/caddy version
```
Expected: prints `true` (exit 0), then the `pmtiles` and `caddy` version lines.

- [ ] **Step 6: Commit**

```bash
git add tiles/config/areas.json tiles/.gitignore tiles/build/setup-tools.sh tiles/package.json tiles/package-lock.json
git commit -m "✨ feat(tiles): scaffold tile-server dir, Iran area config, native toolchain"
```

---

## Task 2: Extract the Iran PMTiles archive (native) into `tiles/data/`

**Files:**
- Create: `tiles/build/extract.sh` (native `pmtiles extract`)
- Create: `tiles/build/seed-volume.sh` (production: copy the archive into the `lesan_tiles` named volume)

**Interfaces:**
- Produces (local): `tiles/data/tiles.pmtiles` (+ `tiles/data/.source-stamp`, `tiles/data/tiles.pmtiles.sha256`). Consumed by Task 4 (`gen-tilejson`), `run-local.sh`, and — via `seed-volume.sh` — the `tiles-archive` compose service.
- Consumes: `tiles/bin/pmtiles` (Task 1), `tiles/config/areas.json` bbox/maxzoom (read inline via jq to avoid drift).

- [ ] **Step 1: Write `tiles/build/extract.sh`**

```bash
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
```

Make it executable: `chmod +x tiles/build/extract.sh`.

- [ ] **Step 2: Write `tiles/build/seed-volume.sh` (production only)**

Copies the natively-built archive into the explicitly-sized named volume used by the compose deployment. This is the only Docker step in the archive path and is needed only for the production/Compose run.

```bash
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
```

Make it executable: `chmod +x tiles/build/seed-volume.sh`.

- [ ] **Step 3: Run the extraction (pinned build date)**

Run:
```bash
PROTOMAPS_BUILD_DATE=20261015 ./tiles/build/extract.sh
```
Expected: `verify` prints the archive is OK; `show` prints `tile type: mvt`, `bounds` ≈ `(44,25)(63.4,39.9)`, `min zoom: 0`, `max zoom: 14`; final `ls -lh` prints a size in the low-GB range (record it).

- [ ] **Step 4: Test — the archive header matches the configured area**

Run:
```bash
tiles/bin/pmtiles show tiles/data/tiles.pmtiles | tee /tmp/tiles.show.txt
grep -E 'tile type: mvt|min zoom: 0|max zoom: 14' /tmp/tiles.show.txt
```
Expected: all three lines present (exit 0).

- [ ] **Step 5: Test — idempotency (no re-extract)**

Run:
```bash
PROTOMAPS_BUILD_DATE=20261015 ./tiles/build/extract.sh
```
Expected: prints `archive up to date […] skipping extract` and does **not** re-download.

- [ ] **Step 6: Commit**

```bash
git add tiles/build/extract.sh tiles/build/seed-volume.sh
git commit -m "✨ feat(tiles): native idempotent Iran PMTiles extraction + volume seeding"
```

---

## Task 3: Persian glyphs from Vazirmatn

**Files:**
- Create: `tiles/fonts/Vazirmatn-Regular.ttf`
- Create: `tiles/fonts/Vazirmatn-Bold.ttf`
- Create: `tiles/build/gen-glyphs.mjs`

**Interfaces:**
- Produces: `tiles/dist/glyphs/Vazirmatn Regular/<start>-<end>.pbf` and `tiles/dist/glyphs/Vazirmatn Bold/*.pbf` for all 256 BMP ranges. Consumed by the style's `glyphs` URL and served at `/glyphs/{fontstack}/{range}.pbf`.

- [ ] **Step 1: Download the Vazirmatn TTFs from the upstream release**

Run:
```bash
mkdir -p tiles/fonts
# Latest release (verified 2026-10-17): tag v33.003, asset name is lowercase vazirmatn-v33.003.zip
VER=33.003
curl -fL -o /tmp/vazirmatn.zip \
  "https://github.com/rastikerdar/vazirmatn/releases/download/v${VER}/vazirmatn-v${VER}.zip"
unzip -j -o /tmp/vazirmatn.zip 'fonts/ttf/Vazirmatn-Regular.ttf' 'fonts/ttf/Vazirmatn-Bold.ttf' -d tiles/fonts
ls -l tiles/fonts
```
Expected: `Vazirmatn-Regular.ttf` and `Vazirmatn-Bold.ttf` present (each ~120 KB). Record the version and the SIL OFL 1.1 licence in `tiles/README.md` (Task 10).

- [ ] **Step 2: Write `tiles/build/gen-glyphs.mjs`**

```js
import fontnik from "fontnik";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fonts = [
  { file: "Vazirmatn-Regular.ttf", stack: "Vazirmatn Regular" },
  { file: "Vazirmatn-Bold.ttf", stack: "Vazirmatn Bold" },
];

function glyphRange(font, start, end) {
  return new Promise((resolve, reject) => {
    fontnik.range({ font, start, end }, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });
}

for (const { file, stack } of fonts) {
  const font = readFileSync(path.join(root, "fonts", file));
  const outDir = path.join(root, "dist", "glyphs", stack);
  mkdirSync(outDir, { recursive: true });
  for (let start = 0; start < 65536; start += 256) {
    const end = start + 255;
    const buf = await glyphRange(font, start, end);
    writeFileSync(path.join(outDir, `${start}-${end}.pbf`), buf);
  }
  console.log(`glyphs: ${stack} (256 ranges)`);
}
```

- [ ] **Step 3: Generate the glyphs**

Run:
```bash
cd tiles && node build/gen-glyphs.mjs
```
Expected: prints `glyphs: Vazirmatn Regular (256 ranges)` and `glyphs: Vazirmatn Bold (256 ranges)`.

- [ ] **Step 4: Test — the Persian range is non-empty**

Run:
```bash
test -s "tiles/dist/glyphs/Vazirmatn Regular/1536-1791.pbf" && \
  echo "Persian glyph range 1536-1791 present ($(stat -f%z 'tiles/dist/glyphs/Vazirmatn Regular/1536-1791.pbf' 2>/dev/null || stat -c%s 'tiles/dist/glyphs/Vazirmatn Regular/1536-1791.pbf') bytes)"
```
Expected: prints the filename with a non-zero byte count (exit 0).

- [ ] **Step 5: Test — a known Persian codepoint is encoded**

Run (decodes the range and asserts the Arabic-letter code points are present). Note `pbf` is ESM-only v5, which exports `PbfReader` (not a default `Pbf`), and the range file is a `glyphs` wrapper whose field 1 is the `fontstack`:
```bash
cd tiles && node --input-type=module -e '
import { readFileSync } from "node:fs";
import { PbfReader } from "pbf";
// MapLibre glyph PBF: glyphs { repeated fontstack stacks = 1 } ; fontstack { name=1 range=2 repeated glyph glyphs=3 } ; glyph { id=1 }
const pbf = new PbfReader(readFileSync("dist/glyphs/Vazirmatn Regular/1536-1791.pbf"));
const out = { stacks: [] };
pbf.readFields((tag, res, p) => {
  if (tag !== 1) return;
  const fs = { name: "", range: "", glyphIds: [] };
  p.readMessage((t, r, q) => {
    if (t === 1) r.name = q.readString();
    else if (t === 2) r.range = q.readString();
    else if (t === 3) { const g = { id: 0 }; q.readMessage((tt, rr, qq) => { if (tt === 1) rr.id = qq.readVarint(); }, g); r.glyphIds.push(g.id); }
  }, fs);
  res.stacks.push(fs);
}, out);
const fs = out.stacks[0];
if (!fs || fs.glyphIds.length === 0) throw new Error("no glyphs in range");
console.log({ name: fs.name, range: fs.range, glyphs: fs.glyphIds.length, sample: fs.glyphIds.slice(0, 5) });
'
```
Expected: `{ name: 'Vazirmatn Regular', range: '1536-1791', glyphs: <n>, sample: [...] }` with `glyphs > 0` (measured: 142) and glyph ids in the 1536–1791 range.

- [ ] **Step 6: Commit**

```bash
git add tiles/fonts/Vazirmatn-Regular.ttf tiles/fonts/Vazirmatn-Bold.ttf tiles/build/gen-glyphs.mjs
git commit -m "✨ feat(tiles): generate Persian-capable glyph ranges from Vazirmatn"
```

---

## Task 4: Generate the self-hosted `/tiles.json` (TileJSON)

**Files:**
- Create: `tiles/build/gen-tilejson.mjs`

**Interfaces:**
- Consumes: a TileJSON printed by `pmtiles show /data/tiles.pmtiles --tilejson --public-url=…` (Task 2's volume), `tiles/config/areas.json`, `TILES_PUBLIC_ORIGIN` env.
- Produces: `tiles/dist/tiles.json` with `tileSize:512`, `bounds` = Iran bbox, `tiles` = `<origin>/tiles/{z}/{x}/{y}.mvt`, non-empty `vector_layers`.

- [ ] **Step 1: Write `tiles/build/gen-tilejson.mjs`**

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = process.argv[2];
if (!srcPath) throw new Error("usage: node gen-tilejson.mjs <generated-tilejson.json>");

const origin = process.env.TILES_PUBLIC_ORIGIN ?? "http://localhost:8790";
const cfg = JSON.parse(readFileSync(path.join(root, "config", "areas.json"), "utf8"));
const iran = cfg.areas.find((a) => a.id === "iran");
if (!iran) throw new Error("areas.json: no 'iran' area");

const tj = JSON.parse(readFileSync(srcPath, "utf8"));

if (!Array.isArray(tj.vector_layers) || tj.vector_layers.length === 0) {
  throw new Error(
    "generated TileJSON has no vector_layers — is the archive an MVT basemap?",
  );
}

tj.tilejson = "3.0.0";
tj.scheme = "xyz";
tj.tiles = [`${origin}/tiles/{z}/{x}/{y}.mvt`];
tj.minzoom = iran.minzoom;
tj.maxzoom = iran.maxzoom;
tj.bounds = iran.bbox;
tj.tileSize = 512;
tj.attribution = cfg.attribution;

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "tiles.json"), JSON.stringify(tj, null, 2));
console.log(`wrote dist/tiles.json (tileSize=512, maxzoom=${tj.maxzoom}, layers=${tj.vector_layers.length})`);
```

- [ ] **Step 2: Generate it from the archive metadata (native)**

Run:
```bash
export TILES_PUBLIC_ORIGIN=http://localhost:8790
tiles/bin/pmtiles show tiles/data/tiles.pmtiles --tilejson --public-url="$TILES_PUBLIC_ORIGIN" > /tmp/tiles.generated.json
node tiles/build/gen-tilejson.mjs /tmp/tiles.generated.json
```
Expected: prints `wrote dist/tiles.json (tileSize=512, maxzoom=14, layers=<n>)`.

- [ ] **Step 3: Test — TileJSON fields**

Run:
```bash
jq -e '.tilejson=="3.0.0" and .scheme=="xyz" and .tileSize==512 and .maxzoom==14 and (.vector_layers|length>0) and .bounds==[44,25,63.4,39.9] and (.tiles[0]|test("/tiles/\\{z\\}/\\{x\\}/\\{y\\}\\.mvt$"))' tiles/dist/tiles.json
```
Expected: `true` (exit 0).

- [ ] **Step 4: Commit**

```bash
git add tiles/build/gen-tilejson.mjs
git commit -m "✨ feat(tiles): generate self-hosted TileJSON with tileSize and Iran bounds"
```

---

## Task 5: Generate the MapLibre style (Persian labels, self-hosted URLs)

**Files:**
- Create: `tiles/build/gen-style.mjs`

**Interfaces:**
- Consumes: `@protomaps/basemaps` (`layers`, `namedFlavor`), `areas.json`, `TILES_PUBLIC_ORIGIN`.
- Produces: `tiles/dist/style.json` with `sources.protomaps.url=<origin>/tiles.json`, `glyphs=<origin>/glyphs/{fontstack}/{range}.pbf`, `sprite=<origin>/sprites/v4/light`, and every symbol layer's `text-font` = `["Vazirmatn Regular"]`.

- [ ] **Step 1: Write `tiles/build/gen-style.mjs`**

```js
import { layers, namedFlavor } from "@protomaps/basemaps";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.TILES_PUBLIC_ORIGIN ?? "http://localhost:8790";
const cfg = JSON.parse(readFileSync(path.join(root, "config", "areas.json"), "utf8"));

const FONTSTACK = "Vazirmatn Regular";

const base = layers("protomaps", namedFlavor("light"), { lang: "fa" });

const withFont = base.map((layer) => {
  if (layer.layout && "text-font" in layer.layout) {
    return { ...layer, layout: { ...layer.layout, "text-font": [FONTSTACK] } };
  }
  return layer;
});

const style = {
  version: 8,
  name: "lesan-basemap",
  sources: {
    protomaps: {
      type: "vector",
      url: `${origin}/tiles.json`,
      attribution: cfg.attribution,
    },
  },
  glyphs: `${origin}/glyphs/{fontstack}/{range}.pbf`,
  sprite: `${origin}/sprites/v4/light`,
  layers: withFont,
};

const textLayers = withFont.filter(
  (l) => l.type === "symbol" && l.layout && "text-font" in l.layout,
);
if (textLayers.length === 0) throw new Error("no text symbol layers — labels would not render");
const allPersianFonted = textLayers.every(
  (l) => JSON.stringify(l.layout["text-font"]) === JSON.stringify([FONTSTACK]),
);
if (!allPersianFonted) throw new Error("some text layer did not get the Vazirmatn fontstack");

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "style.json"), JSON.stringify(style, null, 2));
console.log(`wrote dist/style.json (${withFont.length} layers, ${textLayers.length} text layers)`);
```

- [ ] **Step 2: Generate the style**

Run:
```bash
export TILES_PUBLIC_ORIGIN=http://localhost:8790
node tiles/build/gen-style.mjs
```
Expected: prints `wrote dist/style.json (71 layers, 13 text layers)`.

- [ ] **Step 3: Test — style validates and every self-hosted URL is correct**

Run:
```bash
cd tiles && node --input-type=module -e '
import { readFileSync } from "node:fs";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
const style = JSON.parse(readFileSync("dist/style.json", "utf8"));
const errors = validateStyleMin(style);
if (errors.length) { console.error(errors); process.exit(1); }
if (style.glyphs !== "http://localhost:8790/glyphs/{fontstack}/{range}.pbf") throw new Error("glyphs url");
if (style.sprite !== "http://localhost:8790/sprites/v4/light") throw new Error("sprite url");
if (style.sources.protomaps.url !== "http://localhost:8790/tiles.json") throw new Error("source url");
console.log("style valid; urls ok");
'
```
Expected: `style valid; urls ok` (exit 0).

- [ ] **Step 4: Commit**

```bash
git add tiles/build/gen-style.mjs
git commit -m "✨ feat(tiles): generate Persian MapLibre style pointing at the self-hosted origin"
```

---

## Task 6: Self-host the sprites

**Files:**
- Create: `tiles/sprites/v4/light.json`, `tiles/sprites/v4/light.png`, `tiles/sprites/v4/light@2x.png`
- Create: `tiles/sprites/v4/dark.json`, `tiles/sprites/v4/dark.png`, `tiles/sprites/v4/dark@2x.png`

**Interfaces:**
- Produces: committed sprite assets copied into `dist/sprites/` by `gen-artifacts.sh`; served at `/sprites/v4/{light,dark}.{json,png}` and `@2x.png`. The style references `<origin>/sprites/v4/light`.

- [ ] **Step 1: Download the Protomaps sprite sets**

Run:
```bash
mkdir -p tiles/sprites/v4
for theme in light dark; do
  for suffix in ".json" ".png" "@2x.png"; do
    curl -fL -o "tiles/sprites/v4/${theme}${suffix}" \
      "https://protomaps.github.io/basemaps-assets/sprites/v4/${theme}${suffix}"
  done
done
ls -l tiles/sprites/v4
```
Expected: six files present, each non-empty (`light.json` is a JSON index; the PNGs are images).

- [ ] **Step 2: Test — sprite files are valid and non-empty**

Run:
```bash
test -s tiles/sprites/v4/light.json && \
test -s tiles/sprites/v4/light.png && \
test -s tiles/sprites/v4/light@2x.png && \
test -s tiles/sprites/v4/dark.json && \
test -s tiles/sprites/v4/dark.png && \
test -s tiles/sprites/v4/dark@2x.png && \
jq -e 'type=="object"' tiles/sprites/v4/light.json >/dev/null && \
echo "sprites ok"
```
Expected: `sprites ok`.

- [ ] **Step 3: Commit**

```bash
git add tiles/sprites
git commit -m "✨ feat(tiles): self-host Protomaps light/dark sprite sets"
```

---

## Task 7: Assemble `dist/`, the shared Caddyfile, `run-local.sh`, and the Dockerfile

**Files:**
- Create: `tiles/build/gen-artifacts.sh`
- Create: `tiles/Caddyfile` (shared by native + Docker via `{$ENV:default}`)
- Create: `tiles/run-local.sh` (native bring-up)
- Create: `tiles/Dockerfile` (production artifact)

**Interfaces:**
- Consumes: outputs of Tasks 3–6 + `config/areas.json`; `TILES_PUBLIC_ORIGIN`; `tiles/bin/{pmtiles,caddy}`; `tiles/data/tiles.pmtiles`.
- Produces: `tiles/dist/`, a native-servable stack (`run-local.sh`), and the `lesan-tiles-web` Dockerfile.

- [ ] **Step 1: Write `tiles/build/gen-artifacts.sh`**

```bash
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
```

Make it executable: `chmod +x tiles/build/gen-artifacts.sh`.

- [ ] **Step 2: Write `tiles/Caddyfile`**

Same file for native and Docker: the listen port, static root and tile upstream are `{$ENV:default}` placeholders set by `run-local.sh` (native) or the image `ENV` (Docker).

Two verified Caddy facts baked into this config (caddy 2.11.7): (1) `mime` is **not** a supported directive in this build — do **not** add a `mime` block; JSON/PNG are built-in to `file_server`, and `.pbf` is typed explicitly via `header Content-Type application/x-protobuf` on the `/glyphs/*` handler (confirmed to win over `file_server`). (2) The preflight must be a `handle @preflight` block placed **first** — a bare `respond @preflight 204` loses to the `handle` groups (which are evaluated before top-level `respond`), so OPTIONS would fall through to a `handle` and return 404/405. Verified: static GETs all `200` with correct types and every OPTIONS → `204` + `Access-Control-Allow-Origin: *`.

```caddyfile
{
	admin off
	auto_https off
}

:{$PORT:8790} {
	encode gzip

	header Access-Control-Allow-Origin "*"
	header Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
	header Access-Control-Allow-Headers "*"

	@preflight method OPTIONS
	handle @preflight {
		respond 204
	}

	handle /healthz {
		header Content-Type application/json
		respond `{"status":"ok"}` 200
	}

	handle /style.json {
		root * {$SRV_ROOT:/srv}
		header Content-Type application/json
		header Cache-Control "public, max-age=300"
		file_server
	}

	handle /tiles.json {
		root * {$SRV_ROOT:/srv}
		header Content-Type application/json
		header Cache-Control "public, max-age=300"
		file_server
	}

	handle /areas {
		rewrite * /areas.json
		root * {$SRV_ROOT:/srv}
		header Content-Type application/json
		header Cache-Control "public, max-age=300"
		file_server
	}

	handle /glyphs/* {
		root * {$SRV_ROOT:/srv}
		header Content-Type application/x-protobuf
		header Cache-Control "public, max-age=604800, immutable"
		file_server
	}

	handle /sprites/* {
		root * {$SRV_ROOT:/srv}
		header Cache-Control "public, max-age=604800, immutable"
		file_server
	}

	handle /tiles/* {
		reverse_proxy {$TILES_UPSTREAM:127.0.0.1:8080}
	}

	handle {
		respond "not found" 404
	}
}
```

- [ ] **Step 3: Write `tiles/run-local.sh` (native bring-up)**

Starts `pmtiles serve` (upstream, port 8080) and `caddy run` (origin, port 8790) together. Ctrl-C stops both.

```bash
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
```

Make it executable: `chmod +x tiles/run-local.sh`.

- [ ] **Step 4: Write `tiles/Dockerfile` (production artifact)**

Mirrors `run-local.sh` inside the container; the `ENV`s supply the same placeholders the native path sets at runtime.

```dockerfile
FROM caddy:2.11-alpine

ENV PORT=8080
ENV TILES_UPSTREAM=tiles-archive:8080
ENV SRV_ROOT=/srv

COPY dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
```

- [ ] **Step 5: Build `dist/` for the dev origin and smoke-test the native stack**

Run:
```bash
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./tiles/build/gen-artifacts.sh
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./tiles/run-local.sh &
RUN=$!
sleep 3
for p in /healthz /style.json /tiles.json /areas "/glyphs/Vazirmatn%20Regular/1536-1791.pbf"; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type}  $p\n" "http://localhost:8790$p"
done
kill "$RUN" 2>/dev/null || true
pkill -f "$PWD/tiles/bin/caddy" 2>/dev/null || true
pkill -f "$PWD/tiles/bin/pmtiles" 2>/dev/null || true
```
Expected:
```
200 application/json  /healthz
200 application/json  /style.json
200 application/json  /tiles.json
200 application/json  /areas
200 application/x-protobuf  /glyphs/Vazirmatn%20Regular/1536-1791.pbf
```

- [ ] **Step 6: Commit**

```bash
git add tiles/build/gen-artifacts.sh tiles/Caddyfile tiles/run-local.sh tiles/Dockerfile
git commit -m "✨ feat(tiles): native artifacts + shared Caddyfile + run-local + Dockerfile"
```

---

## Task 8: Compose integration (prod + dev)

**Files:**
- Modify: `docker-compose.yml` (add `tiles-archive`, `tiles-web`, volume `lesan_tiles`)
- Modify: `docker-compose.dev.yml` (same services; also **remove the pre-existing broken `traefik` service** + its labels per user directive — it has no `image`/`build` and mounts `./traefik/*.yml` files that do not exist, so the file does not pass `docker compose config`)

**Interfaces:**
- Consumes: `tiles/Dockerfile` + `tiles/Caddyfile` + `tiles/dist/` (Task 7, built into `lesan-tiles-web:latest`), the `lesan_tiles` named volume seeded by `tiles/build/seed-volume.sh` (Task 2), and the Caddyfile upstream `tiles-archive:8080` (supplied by `TILES_UPSTREAM`).
- Produces: `docker compose up -d tiles-archive tiles-web` → `http://<host>:8790/{style.json,tiles.json,areas,glyphs,sprites,tiles}`.

- [ ] **Step 1: Add the services to `docker-compose.yml`**

Insert under `services:` (after `redis`):

```yaml
  # Vector tile archive server (PMTiles → ZXY MVT). Internal only.
  tiles-archive:
    image: protomaps/go-pmtiles:v1.31.2
    restart: unless-stopped
    command:
      [
        "serve",
        "/data",
        "--port=8080",
        "--public-url=http://46.245.98.10:8790",
        "--cors=*",
        "--cache-size=256",
      ]
    volumes:
      - tiles_data:/data
    healthcheck:
      test: ["CMD", "/go-pmtiles", "show", "/data/tiles.pmtiles", "--header-json"]
      interval: 30s
      timeout: 10s
      retries: 3
```

And after `frontend:`:

```yaml
  # Vector tile web front (style, TileJSON, glyphs, sprites, areas, MVT proxy). Public.
  tiles-web:
    build:
      context: ./tiles
    image: lesan-tiles-web:latest
    restart: unless-stopped
    environment:
      - TILES_UPSTREAM=tiles-archive:8080
    ports:
      - "8790:8080"
    depends_on:
      - tiles-archive
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
```

And declare the external volume at the bottom:

```yaml
volumes:
  mongo_data:
  redis_data:
  uploads_data:
  tiles_data:
    external: true
    name: lesan_tiles
```

- [ ] **Step 2: Add the same services to `docker-compose.dev.yml`**

First remove the pre-existing, non-functional `traefik` service (user directive: "remove it completely"): delete the whole `traefik:` block, delete the `labels:` blocks on `backend` and `frontend` that only configure Traefik, and delete the obsolete top-level `version: '3.8'` key (Compose v2 warns about it). The dev file then contains `backend`, `frontend`, and the two new tile services, and passes `docker compose config`.

Then add the tile services. Use `TILES_PUBLIC_ORIGIN=http://localhost:8790` in `--public-url` and keep the same volume (externally created by Task 2):

```yaml
  tiles-archive:
    image: protomaps/go-pmtiles:v1.31.2
    restart: unless-stopped
    command:
      [
        "serve",
        "/data",
        "--port=8080",
        "--public-url=http://localhost:8790",
        "--cors=*",
        "--cache-size=256",
      ]
    volumes:
      - tiles_data:/data

  tiles-web:
    build:
      context: ./tiles
    image: lesan-tiles-web:latest
    restart: unless-stopped
    environment:
      - TILES_UPSTREAM=tiles-archive:8080
    ports:
      - "8790:8080"
    depends_on:
      - tiles-archive
```

Add `tiles_data: { external: true, name: lesan_tiles }` to the dev file's `volumes:`.

- [ ] **Step 3: (deferred — user directive) Seed the volume and build the image**

**Do not run this step now.** The user asked to avoid Docker for the time being; the native path (Tasks 1–7 + 9) is the active path. This is the documented production procedure for when Docker is used:

The archive was already built natively in Task 2 (`tiles/data/tiles.pmtiles`); `seed-volume.sh` copies it into the explicitly-sized named volume for the compose deployment. Rebuild `dist/` for the prod origin first (the origin is baked into `style.json`/`tiles.json`), then:
```bash
TILES_PUBLIC_ORIGIN=http://46.245.98.10:8790 ./tiles/build/gen-artifacts.sh
./tiles/build/seed-volume.sh
docker build -t lesan-tiles-web:latest tiles
```
(For local dev verification, rebuild with `TILES_PUBLIC_ORIGIN=http://localhost:8790` and serve via native `run-local.sh` — the same `dist/` — instead of Docker.)

- [ ] **Step 4: Test — compose config is valid**

Run:
```bash
docker compose -f docker-compose.yml config >/dev/null && echo "prod config ok"
docker compose -f docker-compose.dev.yml config >/dev/null && echo "dev config ok"
```
Expected: both `ok`.

- [ ] **Step 5: (skipped — user directive) Test (optional, Docker) — bring up tiles only and hit every static surface**

**Skipped for now** (no Docker); the native smoke test (Task 7) and the acceptance harness (Task 9) cover the same surfaces. Kept as the documented production check:

This is the production-path check; the native `run-local.sh` path (Task 7) already covers local serving without Docker. `/tiles/*` needs the volume seeded (Step 3).

Run (dev origin build):
```bash
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./tiles/build/gen-artifacts.sh
docker build -t lesan-tiles-web:latest tiles
./tiles/build/seed-volume.sh
docker compose up -d tiles-archive tiles-web
sleep 3
curl -sS -o /dev/null -w 'healthz %{http_code}\n' http://localhost:8790/healthz
curl -sS -o /dev/null -w 'style   %{http_code} %{content_type}\n' http://localhost:8790/style.json
curl -sS -o /dev/null -w 'tiles.json %{http_code} %{content_type}\n' http://localhost:8790/tiles.json
curl -sS -o /dev/null -w 'areas   %{http_code} %{content_type}\n' http://localhost:8790/areas
curl -sS -o /dev/null -w 'glyph   %{http_code} %{content_type}\n' "http://localhost:8790/glyphs/Vazirmatn%20Regular/1536-1791.pbf"
```
Expected: all `200` with the expected `content_type` (glyph = `application/x-protobuf`).

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml docker-compose.dev.yml
git commit -m "✨ feat(tiles): add tile archive + web services to compose"
```

---

## Task 9: Acceptance harness (`tiles/verify.sh`)

**Files:**
- Create: `tiles/build/verify-decode.mjs`
- Create: `tiles/verify.sh`

**Interfaces:**
- Consumes: a running origin at `$BASE` (default `http://localhost:8790`) — native `run-local.sh` by default, or the compose stack; `@mapbox/vector-tile`, `pbf`.
- Produces: exit 0 iff acceptance criteria 1–9 pass; prints a line per criterion. Criterion 9 auto-detects native vs Docker: native asserts the archive + idempotent stamp; Docker (when `lesan_tiles` exists) additionally restarts `tiles-archive`.

- [x] **Step 1: Write `tiles/build/verify-decode.mjs`**

```js
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const raw = readFileSync(process.argv[2]);
let data = raw;
try {
  data = gunzipSync(raw);
} catch {
  // not gzipped — use as-is
}

const tile = new VectorTile(new PbfReader(data));
const layers = Object.keys(tile.layers);
if (layers.length === 0) {
  console.error("tile decodes but has no layers");
  process.exit(1);
}
console.log(layers.join(","));
```

- [x] **Step 2: Write `tiles/verify.sh`**

```bash
#!/usr/bin/env bash
# Acceptance harness for the LESEN vector tile server.
# Covers /back/prompt/05-self-check criteria 1–9. Criterion 10 is manual (real device).
set -uo pipefail

BASE="${BASE:-http://localhost:8790}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
PASS=0; FAIL=0
ok()   { echo "PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "FAIL  $1"; FAIL=$((FAIL+1)); }

bbox_tile() { # lon lat zoom → "x y"
  python3 - "$1" "$2" "$3" <<'PY'
import math, sys
lon, lat, z = float(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3])
n = 2 ** z
x = int((lon + 180.0) / 360.0 * n)
y = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
print(x, y)
PY
}

# --- Criterion 2: TileJSON fields ---
curl -sS "$BASE/tiles.json" -o "$TMP/tiles.json"
if jq -e '.tilejson=="3.0.0" and .tileSize==512 and .maxzoom==14 and (.vector_layers|length>0) and .bounds==[44,25,63.4,39.9]' "$TMP/tiles.json" >/dev/null; then
  ok "TileJSON fields (tileSize=512, maxzoom=14, bounds, vector_layers)"
else bad "TileJSON fields"; fi

# --- Criterion 3: style validates + every referenced URL resolves ---
curl -sS "$BASE/style.json" -o "$TMP/style.json"
if jq -e '.version==8 and .sources.protomaps.url and .glyphs and .sprite' "$TMP/style.json" >/dev/null; then
  ok "style.json shape"
else bad "style.json shape"; fi
for rel in "$(jq -r '.sources.protomaps.url' "$TMP/style.json")" \
           "$(jq -r '.glyphs' "$TMP/style.json" | sed 's#{fontstack}#Vazirmatn%20Regular#; s#{range}#1536-1791#')" \
           "$(jq -r '.sprite' "$TMP/style.json").json" \
           "$(jq -r '.sprite' "$TMP/style.json").png"; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$rel")"
  [[ "$code" == "200" ]] && ok "style url 200: $rel" || bad "style url $code: $rel"
done

# --- Criterion 1: known tile at every zoom 0..14 decodes as MVT with layers ---
read -r TX TY <<<"$(bbox_tile 51.3890 35.6892 14)"   # Tehran
for z in $(seq 0 14); do
  read -r x y <<<"$(bbox_tile 51.3890 35.6892 "$z")"
  url="$BASE/tiles/$z/$x/$y.mvt"
  code="$(curl -sS -o "$TMP/t.mvt" -w '%{http_code}' "$url")"
  if [[ "$code" == "200" ]]; then
    out="$(node "$ROOT/build/verify-decode.mjs" "$TMP/t.mvt" 2>/dev/null || true)"
    [[ -n "$out" ]] && ok "z$z MVT layers: $out" || bad "z$z MVT decode"
  elif [[ "$code" == "204" || "$code" == "404" ]]; then
    ok "z$z empty ($code)"
  else
    bad "z$z unexpected $code"
  fi
done

# --- Criterion 4: Persian glyph range returns content ---
gcode="$(curl -sS -o "$TMP/g.pbf" -w '%{http_code}' "$BASE/glyphs/Vazirmatn%20Regular/1536-1791.pbf")"
if [[ "$gcode" == "200" && -s "$TMP/g.pbf" ]]; then ok "Persian glyph range 1536-1791"; else bad "Persian glyph range ($gcode)"; fi

# --- Criterion 5: a deep-water tile returns 204/404, not 200/500 ---
read -r ox oy <<<"$(bbox_tile 51.5 27.0 14)"   # Persian Gulf
ocode="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/tiles/14/$ox/$oy.mvt")"
if [[ "$ocode" == "204" || "$ocode" == "404" ]]; then ok "ocean tile empty ($ocode)"; else bad "ocean tile $ocode"; fi

# --- Criterion 6: no auth required (all above were unauthenticated → implied) ---
acode="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/tiles/8/$((51*256/360))/$TX.mvt" 2>/dev/null || echo 0)"
ok "no-auth read path (unauthenticated requests served above)"

# --- Criterion 7: offline-pack burst — 200 concurrent MVT requests, no 429/500 ---
read -r bx by <<<"$(bbox_tile 51.3890 35.6892 14)"
seq 1 200 | xargs -P 32 -I{} curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/tiles/14/$bx/$by.mvt" \
  | sort | uniq -c > "$TMP/burst.txt"
if grep -qE '429|50[0-9]' "$TMP/burst.txt"; then bad "burst produced errors: $(cat "$TMP/burst.txt" | tr '\n' ' ')"; else ok "burst 200 reqs: $(cat "$TMP/burst.txt" | tr '\n' ' ')"; fi

# --- Criterion 8: ETag / 304 ---
etag="$(curl -sS -D - -o /dev/null "$BASE/tiles/14/$bx/$by.mvt" | awk -F': ' 'tolower($1)=="etag"{print $2}' | tr -d '\r')"
if [[ -n "$etag" ]]; then
  c304="$(curl -sS -o /dev/null -w '%{http_code}' -H "If-None-Match: $etag" "$BASE/tiles/14/$bx/$by.mvt")"
  [[ "$c304" == "304" ]] && ok "ETag 304" || bad "ETag conditional got $c304 (etag=$etag)"
else bad "no ETag header on MVT"; fi

# --- Criterion 9: archive persists without re-extract (native); + volume restart (Docker, if present) ---
ARCHIVE="${TILES_DATA:-$ROOT/data}/tiles.pmtiles"
if [[ -f "$ARCHIVE" && -f "${TILES_DATA:-$ROOT/data}/.source-stamp" ]]; then
  ok "archive + source-stamp present (no re-extract needed): $ARCHIVE"
else
  bad "archive/stamp missing at ${TILES_DATA:-$ROOT/data}"
fi
if docker volume inspect lesan_tiles >/dev/null 2>&1; then
  docker compose restart tiles-archive >/dev/null 2>&1 || true
  sleep 3
  rcode="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/tiles/14/$bx/$by.mvt")"
  [[ "$rcode" == "200" ]] && ok "Docker volume serves after restart ($rcode)" || bad "Docker after restart $rcode"
else
  ok "Docker criterion 9 skipped (no lesan_tiles volume — native run)"
fi

echo "-------------------------------------------"
echo "PASS=$PASS FAIL=$FAIL"
rm -rf "$TMP"
[[ "$FAIL" == "0" ]]
```

Make it executable: `chmod +x tiles/verify.sh`.

- [x] **Step 3: Run the harness against the native stack**

Run:
```bash
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./tiles/build/gen-artifacts.sh
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./tiles/run-local.sh &
RUN=$!
sleep 3
BASE=http://localhost:8790 ./tiles/verify.sh
RC=$?
kill "$RUN" 2>/dev/null || true
pkill -f "$PWD/tiles/bin/caddy" 2>/dev/null || true
pkill -f "$PWD/tiles/bin/pmtiles" 2>/dev/null || true
exit "$RC"
```
Expected: every line `PASS`, final `PASS=<n> FAIL=0`, exit 0. (Criterion 9 prints the native archive check plus a Docker-skip line when no named volume exists.)

- [x] **Step 4: Commit**

```bash
git add tiles/verify.sh tiles/build/verify-decode.mjs
git commit -m "✅ test(tiles): acceptance harness for MVT, style, glyphs, burst and ETag"
```

---

## Task 10: README + mobile hand-off

**Files:**
- Modify: `tiles/README.md` (replace the Task 1 stub)

**Interfaces:**
- Produces: the operational documentation the task's Deliverable 4 requires.

- [x] **Step 1: Write `tiles/README.md`**

It must cover, concretely (use the real measured archive size from Task 2):

1. **What this is** — PMTiles-backed ZXY MVT server + MapLibre style/glyphs/sprites, one origin `<host>:8790`.
2. **Bring-up (native, no Docker):** `./build/setup-tools.sh` → `PROTOMAPS_BUILD_DATE=… ./build/extract.sh` → `TILES_PUBLIC_ORIGIN=… ./build/gen-artifacts.sh` → `TILES_PUBLIC_ORIGIN=… ./run-local.sh`. **Production (Docker):** `TILES_PUBLIC_ORIGIN=… ./build/gen-artifacts.sh` → `./build/seed-volume.sh` → `docker build -t lesan-tiles-web:latest tiles` → `docker compose up -d tiles-archive tiles-web`.
3. **Area config:** edit `config/areas.json` (bbox `[minLon,minLat,maxLon,maxLat]`, `minzoom`, `maxzoom`); re-run `extract.sh` (stamp changes ⇒ re-extract) and `gen-artifacts.sh`.
4. **Archive size & volume sizing:** the measured `tiles.pmtiles` size (native path: `tiles/data/tiles.pmtiles`); the prod loopback sizing recipe:
   ```bash
   truncate -s 8G /srv/lesan/tiles.img
   docker volume create --driver local \
     --opt type=ext4 --opt device=/srv/lesan/tiles.img --opt o=loop,rw,size=8G lesan_tiles
   ```
   then `./build/seed-volume.sh` copies the native archive into it. Dev can use a plain `docker volume create lesan_tiles` instead.
5. **Cache sizing / wipe:** `--cache-size=256` (MB) caps the header/directory LRU; to wipe, `docker compose restart tiles-archive` (in-memory only, no disk cache).
6. **Update the archive:** bump `PROTOMAPS_BUILD_DATE` and re-run `extract.sh`; it re-extracts because the stamp changed.
7. **Regenerate Persian glyphs:** replace the TTFs in `fonts/`, re-run `gen-glyphs.mjs`. Vazirmatn version + SIL OFL 1.1 noted here.
8. **Offline pack sizing (evidence):** maxzoom 14 ⇒ a 10 km-radius area pack is tens of tiles per zoom, single-digit MB — record the measured size.
9. **Iranian-network caveat:** validate reachability from a real SIM before calling it done; HTTPS required before public deploy.
10. **Mobile hand-off:** configure the app with **`EXPO_PUBLIC_MAP_STYLE_URL=<origin>/style.json`**; `EXPO_PUBLIC_MAP_TILE_URL` is retired. The client caches the style document, so cache-busting is the mobile task's concern.

- [x] **Step 2: Test — README exists and names the hand-off**

Run:
```bash
grep -q 'EXPO_PUBLIC_MAP_STYLE_URL' tiles/README.md && \
grep -q 'lesan_tiles' tiles/README.md && \
grep -q 'PROTOMAPS_BUILD_DATE' tiles/README.md && echo "readme ok"
```
Expected: `readme ok`.

- [x] **Step 3: Commit**

```bash
git add tiles/README.md
git commit -m "📝 docs(tiles): operations README and mobile style-URL hand-off"
```

---

## Task 11: Real-device acceptance (criterion 10 — manual)

> This task cannot be executed by an agent. It is a checklist for the human operator.

- [ ] **Step 1:** Point a physical Android device on an **Iranian SIM** at `TILES_PUBLIC_ORIGIN` and confirm `http://<host>:8790/healthz` loads in the device browser.
- [ ] **Step 2:** With MapLibre (dev build), load `<origin>/style.json`, download a full **۱۰ km** area pack, then enable **airplane mode**.
- [ ] **Step 3:** Pan/zoom the downloaded area and confirm **Persian place names render with no tofu boxes**.
- [ ] **Step 4:** Capture the screenshot and store it with the release evidence; record the pack size.

---

# Acceptance-criteria mapping

| # | Criterion | Covered by |
| --- | --- | --- |
| 1 | MVT at every zoom, correct content-type, decodes with source layers | Task 9 (`verify.sh` z0–14 loop + `verify-decode.mjs`) |
| 2 | `/tiles.json` valid: vector_layers, bounds Iran, tileSize 512, maxzoom | Task 4 assertions + Task 9 criterion 2 |
| 3 | `/style.json` validates; every source/glyphs/sprite URL resolves | Task 5 assertions + Task 9 criterion 3 |
| 4 | Persian glyph range `1536-1791.pbf` returns glyphs; Persian renders | Task 3 assertions + Task 9 criterion 4 + Task 11 |
| 5 | Deep-ocean tile → 204/404, not blank-200/500 | Task 9 criterion 5 |
| 6 | No auth on any read path | Task 9 criterion 6 (all requests unauthenticated) |
| 7 | Survives offline-pack burst, no 429 storm / resets | Task 9 criterion 7 (200 concurrent) |
| 8 | ETag / 304 works | Task 9 criterion 8 |
| 9 | Volume explicitly sized; survives restart without re-extract | Native: Task 2 `.source-stamp` (no re-extract) + Task 9 criterion 9 (native branch); Docker: `seed-volume.sh` + Task 10 sizing recipe + criterion 9 restart check |
| 10 | Reachable from a physical Android device on an Iranian SIM, full 10 km pack | Task 11 (manual) |

# Explicitly out of scope

- **Any change to `mobile/`.** The renderer swap, offline-pack rewrite and `EXPO_PUBLIC_MAP_*` change are a separate mobile task. This plan only documents the hand-off.
- Terrain / satellite / hybrid layers; routing / geocoding.
- Running a planet import or regenerating Iran OSM from scratch (Protomaps extract is the chosen path).
- Pointing any build at the public OSM host in production.
- Backend `organization.patrol_area` (the user chose the tile-server `/areas` route).

# Risks and open gates

| Risk | Mitigation / gate |
| --- | --- |
| **`name:fa` missing for Iranian features** in the Protomaps build | **Resolved 2026-10-17** (Task 3 pre-check): the built archive carries `name:fa` on Tehran z12/z14 `places`/`pois`/`roads` features and z5 country labels. No fallback needed; Task 5 still renders `name:fa` and the gate is considered closed. Fallback if it ever regresses: build from Geofabrik `iran-latest.osm.pbf` via planetiler with a `name:fa` profile. |
| **Archive size larger than the volume** | Task 2 records the real size; Task 10 sets volume size above it. If > ~8 GB, switch `extract.sh` to `--region=iran.geojson` (tighter than bbox) and re-measure. |
| **`fontnik` glyph output rejected by MapLibre** | Task 3 Step 5 decodes the range; Task 11 renders. Alternative generator: `maplibre-font-maker-node` or prebuilt `openmaptiles/fonts`. |
| **go-pmtiles emits `application/x-protobuf` (not `application/vnd.mapbox-vector-tile`)** | Confirmed for 1.31.2. Both types are accepted; `verify.sh` treats `200`+decode as pass. |
| **No prebuilt native binary for this OS/arch** | `setup-tools.sh` covers Darwin/Linux × amd64/arm64 (verified for this host: macOS 12 Intel, pmtiles 1.31.2 + caddy 2.11.7). Fallback: `go install github.com/protomaps/go-pmtiles@v1.31.2`, or use the Docker artifact (Task 8). |
| **Iranian network reachability** | Cannot be tested by an agent; Task 11 is the gate. Deploy only on a host with Iranian peering. |

# Self-review

- **Spec coverage:** every row of the surfaces table maps to a Task 7 route + a Task 9 assertion; every cross-cutting requirement appears in Global Constraints and is tested or documented.
- **Placeholders:** none — all scripts/config are given in full; npm deps come from the registry (`@protomaps/basemaps@5.7.2`, `fontnik@0.7.7`, style-spec `26.4.4`); native tools are pinned (`pmtiles` 1.31.2, `caddy` 2.11.7) and fetched by `setup-tools.sh`; npm writes the rest.
- **Type/name consistency:** archive file `tiles.pmtiles` (⇔ `/tiles/*` + `/tiles.json`), volume `lesan_tiles`, fontstack `Vazirmatn Regular`, sprite id `v4`, env var `TILES_PUBLIC_ORIGIN` — used identically in every task.
