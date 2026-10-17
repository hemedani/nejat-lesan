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

## 2. Run it locally (native — no Docker)

**This is the supported path.** The service is two ordinary host processes — `pmtiles serve`
and `caddy` — both fetched into the gitignored `bin/`. No container, no daemon, no compose.
The Docker artifacts still sitting in the repo are **deferred and not in use**; see
[Appendix A](#appendix-a--docker-deployment-deferred-not-in-use).

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

### First run (one-time, ~15 min — the archive download dominates)

```bash
./build/setup-tools.sh                                   # download pinned pmtiles + caddy → bin/
PROTOMAPS_BUILD_DATE=20261015 ./build/extract.sh         # clip Protomaps archive → data/tiles.pmtiles
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./build/gen-artifacts.sh   # → dist/ (style, tilejson, glyphs, sprites, areas)
```

These are idempotent and safe to re-run: `setup-tools.sh` skips existing binaries,
`extract.sh` re-extracts only when `data/.source-stamp` changes, and `gen-artifacts.sh`
rebuilds `dist/` from scratch each time.

### Every run afterwards

```bash
./run-local.sh
```

That is the whole thing. It runs in the **foreground**: `pmtiles serve` on `:8080` (internal)
and `caddy` on `:8790` (the public origin), and **Ctrl-C stops both**. It defaults
`TILES_PUBLIC_ORIGIN` to `http://localhost:8790`; pass it explicitly only to serve a
different origin. Open <http://localhost:8790/healthz> to confirm, or check it from another
shell:

```bash
./verify.sh        # acceptance harness; BASE defaults to http://localhost:8790
```

It refuses to start if `:8080` or `:8790` is already taken, and names the port — a second
instance used to leave `caddy` running against a dead upstream, which looks like a healthy
origin (`/healthz` 200) while every tile is a 502.

> **Rebuild `dist/` when the origin changes.** `gen-artifacts.sh` bakes `TILES_PUBLIC_ORIGIN`
> into `dist/style.json` and `dist/tiles.json`, so a `dist/` built for `localhost:8790`
> advertises `localhost:8790` tiles. To serve the LAN from a phone, rebuild with
> `TILES_PUBLIC_ORIGIN=http://<host-lan-ip>:8790` before starting — otherwise the style
> loads but every tile URL in it points at the device itself.

## 3. Area config

Edit `config/areas.json`:

```json
{ "id": "iran", "name": "ایران", "bbox": [44.0, 25.0, 63.4, 39.9], "minzoom": 0, "maxzoom": 14 }
```

`bbox` is `[minLon, minLat, maxLon, maxLat]`. After changing the bbox or `maxzoom`,
re-run `extract.sh` (the source stamp changes ⇒ it re-extracts) and then
`gen-artifacts.sh`. The Iran area currently spans `44.0,25.0,63.4,39.9` at maxzoom 14.

## 4. Archive size & disk usage

The current archive is `tiles/data/tiles.pmtiles` — **590,627,724 bytes (563 MiB)**,
`sha256 d15e357b1aaa1d50fafcd89124438dacfafb58353489c43a45b705612c76677f`
(recorded in `data/tiles.pmtiles.sha256`).

Natively the archive is just that one file on the host disk — no volume to size. Budget
~600 MiB for it plus ~3 MB for `dist/` and ~80 MB for `bin/`.

## 5. Cache sizing / wipe

`pmtiles serve` runs with `--cache-size=256` (**MB**), an in-memory LRU over the archive
header/directory. There is **no on-disk cache**, so wiping is a restart: Ctrl-C
`run-local.sh` and start it again.

## 6. Update the archive

Bump the Protomaps daily build date and re-extract:

```bash
PROTOMAPS_BUILD_DATE=YYYYMMDD ./build/extract.sh
TILES_PUBLIC_ORIGIN=http://localhost:8790 ./build/gen-artifacts.sh
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

---

## Appendix A — Docker deployment (deferred, not in use)

**Do not use this path for now.** The decision is to run the tile server natively (section 2)
and leave Docker out of it. The artifacts below are kept only so the production option is not
lost; they are untested against a live daemon (no Docker was used while building this), and
the `tiles-archive` / `tiles-web` healthchecks and the compose branch of the acceptance
harness have never actually run.

What exists, unchanged and unused:

- `tiles/Dockerfile` — `caddy:2.11-alpine`, `COPY dist /srv`, `ENV PORT=8080 TILES_UPSTREAM=tiles-archive:8080`.
- `tiles/Caddyfile` — the *same* file the native path uses; the two paths differ only in how
  `PORT`, `SRV_ROOT` and `TILES_UPSTREAM` are supplied (shell env vs image `ENV`).
- `docker-compose.yml` — `tiles-archive` (internal `:8080`, `protomaps/go-pmtiles:v1.31.2`)
  and `tiles-web` (`8790:8080`), plus the external `lesan_tiles` volume.
- `docker-compose.dev.yml` — the same two services.
- `tiles/build/seed-volume.sh` — copies the native archive into `lesan_tiles`.

If it is ever revived, this is the sequence, and the origin must be fixed in **two** places:

```bash
TILES_PUBLIC_ORIGIN=http://<host>:8790 ./build/gen-artifacts.sh
./build/seed-volume.sh
docker build -t lesan-tiles-web:latest tiles
docker compose up -d tiles-archive tiles-web     # from the repo root
```

- `gen-artifacts.sh` bakes `TILES_PUBLIC_ORIGIN` into `dist/style.json` / `dist/tiles.json`.
- `docker-compose.yml` hardcodes `--public-url=http://46.245.98.10:8790` on `tiles-archive`.

Change the host or port and both must be updated, or the style and TileJSON will advertise
URLs that do not resolve. The volume also needs explicit sizing (the archive is ~563 MiB;
the compose default volume is unbounded):

```bash
truncate -s 8G /srv/lesan/tiles.img
docker volume create --driver local \
  --opt type=ext4 --opt device=/srv/lesan/tiles.img --opt o=loop,rw,size=8G lesan_tiles
```
