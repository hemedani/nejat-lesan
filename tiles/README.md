# lesan-tiles

Self-hosted vector tile service for LESEN. A [PMTiles](https://protomaps.com)-backed
ZXY **MVT tile server** plus a MapLibre **style / TileJSON / glyphs / sprites** front,
served from a **single origin** on port **8790**. Mobile and web clients point at one
style URL and discover everything else (tiles, fonts, icons) through it.

## 1. What this is

One origin (`http://<host>:8790`) exposes:

| Path | Purpose |
| --- | --- |
| `/healthz` | liveness: `{"status":"ok"}` |
| `/style.json` | MapLibre GL style (source → `/tiles.json`) |
| `/tiles.json` | TileJSON 3.0 (`scheme: xyz`, `tileSize: 512`, `maxzoom: 14`) |
| `/areas` | available areas (served from `areas.json`) |
| `/glyphs/{fontstack}/{range}.pbf` | SDF glyphs (`application/x-protobuf`) |
| `/sprites/v4/{light,dark}.{json,png,@2x.png}` | icon sprite sheet + index |
| `/tiles/{z}/{x}/{y}.mvt` | raw MVT (`application/x-protobuf`) |

A static `caddy` process serves the generated artifacts (`dist/`) and reverse-proxies
`/tiles/*` to an internal `pmtiles serve` process. CORS is `*`; `OPTIONS` returns 204.
The MVT content-type is `application/x-protobuf` (clients also accept
`application/vnd.mapbox-vector-tile`).

**Pinned tools** (fetched by `build/setup-tools.sh`): pmtiles **1.31.2**, caddy **2.11.7**.
**npm deps** (`tiles/package.json`): `@protomaps/basemaps@5.7.2`, `fontnik@0.7.7`,
`@maplibre/maplibre-gl-style-spec@26.4.4`, `@mapbox/vector-tile@3.0.0`, `pbf@5.1.2`.

## 2. Bring-up

### Prerequisites (runner machine)

- `node`/`npm` via **fnm** (validated on **node v22.22.2**).
- **Homebrew `jq` 1.7.1** at `/usr/local/bin/jq` — the `jq` bundled with fnm is broken;
  put `/usr/local/bin` ahead on `PATH` before running the build scripts.
- `python3` (used only by `verify.sh`).

```bash
eval "$(fnm env)" && fnm use
export PATH="/usr/local/bin:$PATH"
cd tiles && npm ci        # install generator deps (once)
```

### Native (no Docker)

```bash
./build/setup-tools.sh                                   # download pinned pmtiles + caddy → bin/
PROTOMAPS_BUILD_DATE=20261015 ./build/extract.sh         # clip Protomaps archive → data/tiles.pmtiles
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./build/gen-artifacts.sh   # → dist/ (style, tilejson, glyphs, sprites, areas)
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./run-local.sh # serve on :8790
```

Then check it: `./verify.sh` (acceptance harness, `BASE` defaults to `http://localhost:8790`).

### Production (Docker)

```bash
TILES_PUBLIC_ORIGIN=http://<host>:8790 ./build/gen-artifacts.sh
./build/seed-volume.sh                                   # copy native archive into the lesan_tiles volume
docker build -t lesan-tiles-web:latest tiles
docker compose up -d tiles-archive tiles-web             # from the repo root
```

`tiles-web` maps `8790:8080`; `tiles-archive` is internal-only and reads
`/data/tiles.pmtiles` from the `lesan_tiles` volume.

> **Origin is baked in twice.** `gen-artifacts.sh` writes `TILES_PUBLIC_ORIGIN` into
> `dist/style.json` and `dist/tiles.json`, and `docker-compose.yml` passes a literal
> `--public-url=http://46.245.98.10:8790` to `tiles-archive`. Changing the host or port
> means re-running `gen-artifacts.sh` **and** updating that compose flag, otherwise the
> style and TileJSON advertise URLs that do not resolve. The dev compose uses
> `http://localhost:8790`.

## 3. Area config

Edit `config/areas.json`:

```json
{ "id": "iran", "name": "ایران", "bbox": [44.0, 25.0, 63.4, 39.9], "minzoom": 0, "maxzoom": 14 }
```

`bbox` is `[minLon, minLat, maxLon, maxLat]`. After changing the bbox or `maxzoom`,
re-run `extract.sh` (the source stamp changes ⇒ it re-extracts) and then
`gen-artifacts.sh`. The Iran area currently spans `44.0,25.0,63.4,39.9` at maxzoom 14.

## 4. Archive size & volume sizing

The current archive is `tiles/data/tiles.pmtiles` — **590,627,724 bytes (563 MiB)**,
`sha256 d15e357b1aaa1d50fafcd89124438dacfafb58353489c43a45b705612c76677f`
(recorded in `data/tiles.pmtiles.sha256`).

Production loopback volume (sized with headroom over the ~563 MiB archive):

```bash
truncate -s 8G /srv/lesan/tiles.img
docker volume create --driver local \
  --opt type=ext4 --opt device=/srv/lesan/tiles.img --opt o=loop,rw,size=8G lesan_tiles
```

Then `./build/seed-volume.sh` copies the native archive into `lesan_tiles`. For dev you
can instead use a plain `docker volume create lesan_tiles`.

## 5. Cache sizing / wipe

`pmtiles serve` runs with `--cache-size=256` (**MB**), an in-memory LRU over the archive
header/directory. There is **no on-disk cache**: to wipe it, restart the archive service —
`docker compose restart tiles-archive` (or restart the native `run-local.sh` stack).

## 6. Update the archive

Bump the Protomaps daily build date and re-extract:

```bash
PROTOMAPS_BUILD_DATE=YYYYMMDD ./build/extract.sh
TILES_PUBLIC_ORIGIN=http://<host>:8790 ./build/gen-artifacts.sh
```

`extract.sh` is idempotent: it re-extracts only when the stamp
(`data/.source-stamp` = `SOURCE|BBOX|MAXZOOM`) changes. Current stamp:
`https://build.protomaps.com/20261015.pmtiles|44.0,25.0,63.4,39.9|14`.

## 7. Regenerate Persian glyphs

Fonts live in `fonts/`: **Vazirmatn-Regular.ttf** + **Vazirmatn-Bold.ttf**
(**Vazirmatn v33.003**, licensed **SIL OFL 1.1**). The generated fontstacks are
`Vazirmatn Regular` and `Vazirmatn Bold`. To update, replace the TTFs and regenerate:

```bash
node build/gen-glyphs.mjs     # or: ./build/gen-artifacts.sh regenerates everything
```

`gen-glyphs.mjs` writes 256 ranges (0–65535, step 256) per fontstack into
`dist/glyphs/<fontstack>/`. The style maps every text layer to `Vazirmatn Regular`.
The sprite id is `v4` (`/sprites/v4/...`).

## 8. Offline pack sizing (measured)

Maxzoom is 14, so a 10 km-radius pack is tens of tiles per zoom and single-digit MB.

Measured against the live native stack for a **10 km radius** around central Tehran
(51.3890, 35.6892) at z10–14. The radius is converted to degrees per axis
(±0.0899° lat, ±0.1108° lon → bbox `51.2784,35.5994,51.4996,35.7790`), so the box is
wider in longitude than in latitude — a degree-square `±0.09°` box would be 10 km
north–south but only ~8.1 km east–west and would under-report the pack:

| zoom | tiles | wire bytes (gzip) | decoded bytes |
| --- | --- | --- | --- |
| z10 | 4 | 268,758 | 370,596 |
| z11 | 6 | 305,985 | 441,057 |
| z12 | 12 | 909,162 | 1,333,928 |
| z13 | 36 | 1,520,477 | 2,135,725 |
| z14 | 121 | 3,086,518 | 5,468,116 |
| **total** | **179** | **6,090,900 (~5.81 MiB)** | **9,749,422 (~9.30 MiB)** |

`wire bytes` is what the device downloads (PMTiles tiles are stored and served
gzip-encoded); `decoded bytes` is the MVT payload a client ends up holding after
decompression, i.e. the realistic on-device footprint. Budget against the larger figure.

Reproduce with any tile client: enumerate the tiles intersecting that bbox and sum
`GET /tiles/{z}/{x}/{y}.mvt` response sizes — `curl -w '%{size_download}'` gives wire
bytes, a `fetch`/`arrayBuffer` read gives decoded bytes (HTTP clients auto-decompress).

## 9. Iranian-network caveat

Reachability from an Iranian mobile network is **unverified** — validate from a real
SIM before calling the deployment done. HTTPS is required before any public deploy.

## 10. Mobile hand-off

Point the app at the style document — one variable, one origin:

```
EXPO_PUBLIC_MAP_STYLE_URL=http://<host>:8790/style.json
```

`EXPO_PUBLIC_MAP_TILE_URL` is **retired** — do not use it. The client caches the style
document, so cache-busting (e.g. appending a version query string) is the mobile task's
concern.
