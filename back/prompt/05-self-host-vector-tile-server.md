# Infrastructure task: a self-hosted vector tile server (PMTiles-backed ZXY MVT) for LESEN

> Superseded direction: this task was originally scoped as a self-hosted **OSM raster**
> (PNG) tile server. The mobile client is moving to a **native MapLibre renderer**
> (option C). That changes the server contract from `/{z}/{x}/{y}.png` to vector tiles
> plus a style document, glyphs, and sprites. The raster requirements below are gone.
> Nothing in this task touches the mobile app.

## Why this task exists

The patrol app needs a basemap that works with no signal, and it is moving from a
hand-rolled WebView raster slippy map to a **native MapLibre renderer**
(`@maplibre/maplibre-react-native`, run from a development build). Raster PNG tiles are
the wrong shape for that move: they are large, they blur when overzoomed, and they bake
labels into pixels — so Persian place names cannot be re-styled, re-localized, or kept
crisp offline. Vector tiles carry labels as data.

Today the app fetches raster tiles from `https://tile.openstreetmap.org` because
`EXPO_PUBLIC_MAP_TILE_URL` is unset and `mobile/src/config/env.ts:33-36` falls back to the
public OSM host:

```ts
function readMapTileUrl(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed && trimmed.length > 0 ? trimmed : 'https://tile.openstreetmap.org';
}
```

That default is acceptable for a pilot and **not acceptable for production**, for the two
original reasons — unchanged by the renderer swap:

1. **It violates the OSM tile usage policy.** Bulk downloading is explicitly forbidden,
   and a fleet of field devices pulling area packs is exactly that. Sustained abuse gets
   the deployment's IP range blocked, leaving every officer with no map at all.
2. **It puts a third party on the critical path.** Every tile an officer ever sees depends
   on OpenStreetMap Foundation infrastructure being reachable from an Iranian mobile
   network.

A self-hosted server fixes both, and fixes the third problem this task also has to solve:
**coverage**. There is no officer→zone relation anywhere in the schema, so the app derives
its offline box from `primaryOrganization.location` plus a radius the officer picks. The
server should own the area definition.

## The renderer change is a contract change — do not serve a raw `.pmtiles` URL

The single most important fact for this task, verified against upstream docs:

- MapLibre Native (and therefore `maplibre-react-native`) **can** read a `.pmtiles`
  archive directly, with a `pmtiles://https://…` source URL, since MapLibre Android
  11.7.0. It works for any source type, from a style JSON or dynamically.
- **But PMTiles sources do not support offline pack downloads or caching.** The product's
  core promise is that an officer files a report with no signal, so offline packs are
  mandatory. A raw `pmtiles://` source therefore **cannot** be the client contract.
- `pmtiles serve` exposes exactly the ZXY MVT API that MapLibre's `OfflineManager` needs,
  and by design does *not* serve the raw archive (whole or range requests).

**Conclusion:** store tiles as **PMTiles**, serve them as **ZXY MVT** with **TileJSON +
style + glyphs + sprites**. The client consumes the ZXY endpoint; PMTiles is an
implementation detail behind it.

## What to build

A self-hosted vector tile service, reachable over HTTP(S), serving Mapbox Vector Tiles
(MVT/PBF) for a configured area (initially Iran), plus the style assets a MapLibre
renderer needs.

### Non-negotiable compatibility requirements

These come from how MapLibre fetches and caches tiles, and are not negotiable — a mismatch
makes the officer see a blank map, not a slightly wrong one.

| Surface | Path | Content-Type | Notes |
| --- | --- | --- | --- |
| Vector tile | `GET /tiles/{z}/{x}/{y}.pbf` | `application/x-protobuf` (also `application/vnd.mapbox-vector-tile`) | Standard XYZ; `x` wraps modulo `2^z`, `y` clamped to `0..2^z-1`. `.mvt` is acceptable if the style uses it consistently. |
| TileJSON | `GET /tiles.json` | `application/json` | `tiles`, `minzoom`, `maxzoom`, `bounds` (Iran), `tileSize`, `vector_layers`, and OSM attribution. |
| Style | `GET /style.json` | `application/json` | A valid MapLibre style; its `sources` point at `/tiles.json`, its `glyphs` at `/glyphs/{fontstack}/{range}.pbf`, its `sprite` at `/sprites/...`. |
| Glyphs | `GET /glyphs/{fontstack}/{range}.pbf` | `application/x-protobuf` | Fontstack **must** include Arabic-script coverage — see below. |
| Sprites | `GET /sprites/{id}.json`, `{id}.png`, `{id}@2x.png` | `application/json`, `image/png` | Icons referenced by the style. |
| Health | `GET /healthz` | `application/json` | Compose healthcheck. |

Cross-cutting requirements:

| Requirement | Value | Why |
| --- | --- | --- |
| Scheme | `xyz` | MapLibre defaults to XYZ; `tms` inverts `y` and puts the country in the wrong hemisphere |
| `tileSize` | `512` | Vector default, and the Protomaps basemap is built as 512px tiles — **verify** and keep the value the tileset was built with |
| CORS | `Access-Control-Allow-Origin: *` | Needed for TileJSON/style fetches and local dev tooling |
| Auth | **None** on the read path | MapLibre's native downloader and the offline pack engine fetch tiles with no per-tile header hook; a bearer-gated endpoint makes the map unreachable and the offline pack undownloadable |
| Caching | `ETag` / `Last-Modified`, HTTP `Range` | The archive is read with range requests; style/glyph/sprite responses must stay cacheable |
| Empty tiles | `204` (preferred) or `404` | Never `200` with an empty body, never `500`; the client treats an empty tile as "no data", not an error |
| Rate limiting | Tolerant of a burst | One area pack is tens of thousands of tile requests from a single device, then again from the next device. A limit tighter than this starves every phone. Return `429`, which clients retry. |

### Persian labels are a first-class requirement, not a detail

- The style's label layers must prefer a Persian name field (`name:fa`, falling back to
  `name`). The Protomaps basemap carries `name:fa`; **verify** it is populated for Iranian
  data. If it is not, that is a finding to report — do not mask it with Latin labels.
- The `glyphs` endpoint must actually contain Persian codepoints. A Latin-only fontstack
  does not. Self-host a font with Arabic-script coverage (Noto Sans Arabic, Vazirmatn, or
  equivalent) and generate its glyph PBF ranges, then reference that fontstack from the
  style. The app's UI font under `mobile/assets/fonts` is a UI concern and is not the
  map's font.
- Acceptance requires **rendering a Persian place name offline**, not merely a style
  document that validates.

### Suggested shape

Any implementation is acceptable if it satisfies the tables above. The pragmatic stack for
this repo, which already runs Mongo + Redis under `docker-compose.yml`:

- **Storage + serving:** a PMTiles archive of the Protomaps basemap (OSM-derived with
  Persian name fields) extracted to Iran with
  `pmtiles extract INPUT.pmtiles iran.pmtiles --bbox=… --maxzoom=…`, served by the
  official `protomaps/go-pmtiles` container
  (`pmtiles serve --public-url <origin> --cors '*' --cache-size …`). That provides the ZXY
  MVT API and TileJSON without writing a tile server.
- **Style / glyphs / sprites:** static, versioned artifacts. Take a Protomaps basemap
  style, edit every URL to the self-hosted origin, self-host the glyph ranges for the
  Persian-capable fontstack, and serve sprites alongside. A reverse proxy such as Caddy
  (recommended upstream for TLS and CORS) can serve these and front the tile container.
- **Acceptable alternatives:** `tileserver-gl` or `martin` over a PostGIS/`.mbtiles`
  source, or building your own archive from Geofabrik `iran-latest.osm.pbf` with
  `planetiler` / `tilemaker`. Do **not** run a planet import.

**Maxzoom and overzoom are the entire point of the vector move.** Resolve the area at a
low max zoom (z14–z15) and let MapLibre overzoom — vector geometry scales cleanly, so z17
incident detail does not require z17 tiles. This shrinks both the archive and the offline
pack by roughly an order of magnitude versus the raster plan's ~58 000 z13–z17 PNGs for a
25 km radius. Document the chosen maxzoom and the resulting per-area size.

### Service requirements

1. **Explicit area configuration.** The service is told the bounding boxes to cover
   (initially Iran, or the provinces/motorway corridors in use). It must refuse to serve
   outside those boxes rather than generating unbounded coverage.
2. **Bounded disk and caches.** Document the archive size and size the compose volume
   explicitly; also size the serve caches (`pmtiles serve --cache-size`) so header/directory
   LRU memory does not grow unbounded.
3. **Correct content types** exactly as in the table. A `200 text/plain` MVT is a broken
   map.
4. **A health endpoint** for the compose healthcheck.
5. **An identifying `User-Agent`** on any outbound fetch to an upstream source.
6. **HTTP(S) reachability.** Cleartext HTTP is acceptable for the pilot — production
   Android already sets `usesCleartextTraffic: true` — but HTTPS is strongly preferred and
   required before a public deployment.

### Deployment requirements

- A new service in `/Users/syd/work/madani/nejat/lesan/docker-compose.yml` (and the dev
  compose file), on an internal port, with a named volume for the tile archive.
- The volume must be sized explicitly in the compose file or documented — the default
  Docker volume is unbounded and will fill the host disk.
- Must be reachable from **Android devices over the LAN**.
- **On the Iranian mobile network specifically:** a server reachable only from the local
  network or a cloud region without Iranian peering will be slow or unusable from the
  field. Validate reachability from a real device on a real SIM before considering this
  done.

### The area question

This is a product decision, not just an implementation one. It survives the renderer
change: the client still has to be told which area to pack for offline use, and it still
has only `primaryOrganization.location` to derive one.

The app currently derives its offline box from `primaryOrganization.location` plus a radius
the officer picks (۵ / ۱۰ / ۲۵ km). That is a workaround for a schema gap:

- `organization.location` is a **single point**, and for the demo motorway org it is the
  corridor's *first vertex* — the Ahvaz end of a 116 km road — not its centroid. A box
  centred on it is lopsided.
- `organization.location_zoom` is **corridor** scale (a 116 km corridor wants zoom 12), so
  one number cannot size a box for both a motorway org and a municipal one.
- There is no `traffic_zone` / `city_zone` membership on `user`, `organization`, or `unit`
  — confirmed absent, not merely unused.

**Preferred fix, if the backend is in scope:** add a real bounding box to the organisation
so the client never guesses. The cheapest wiring already exists — `primaryOrganization` is a
fixed response field computed at `back/src/user/primaryOrganization.ts:32-39`, already
returned by `user.login`/`user.getMe`, and already persisted on the device session offline.
Adding a `patrol_area` GeoJSON Polygon (or a derived bbox) to that projection costs no new
mobile request.

**If that is out of scope**, the tile server should own an area table and expose
`GET /areas`, so the mobile client fetches real areas instead of deriving a radius locally.

## Acceptance criteria

1. `curl` a known tile at every zoom in `{minzoom..maxzoom}` and confirm `200`,
   `application/x-protobuf`, and a body that decodes as MVT (`tippecanoe-decode`,
   `vt2geojson`, or the `mapbox-vector-tile` library) with the expected source layers.
2. Confirm `/tiles.json` is valid TileJSON: non-empty `vector_layers`, `bounds` = Iran,
   `tileSize` = 512, and the chosen `maxzoom`.
3. Confirm `/style.json` validates against the MapLibre style specification, and that every
   `sources`, `glyphs`, and `sprite` URL in it resolves with `200` and the correct content
   type.
4. Confirm a glyph range covering Persian (U+0600–U+06FF, i.e. `1536-1791.pbf`) returns
   glyphs, and that a Persian place name renders on a MapLibre map with **no** tofu boxes.
5. Confirm a deep-ocean tile returns `204` (or `404`) — not `200` blank, not `500`.
6. Confirm no authentication is required to fetch any tile, style, glyph, or sprite.
7. Confirm the server survives the offline-pack pattern: many concurrent MVT requests,
   sustained for a full area pack, with no `429` storm and no connection resets.
8. Confirm `ETag` / `304` works so a repeat download of a cached area is cheap.
9. Confirm the compose volume has an explicit size and survives a restart without
   re-extracting the archive.
10. Verify reachability **from a physical Android device on an Iranian SIM**, downloading a
    full ۱۰ km area pack end to end.

## Explicitly out of scope

- **Any change to the mobile app.** The renderer swap (raster WebView → native MapLibre),
  the offline-pack rewrite (`mobile/src/services/map-download.ts`,
  `map-tile-store.ts`, `map-web-html.ts`), and the `EXPO_PUBLIC_MAP_*` config change are a
  separate, mobile-side task. Do not mix server and client changes in the same commit.
- Terrain, satellite, or hybrid layers.
- Routing or geocoding. `road.getRoadsGeometry` and `road.snapPointToRoad` are LESAN
  backend acts and stay where they are.
- Regenerating the Iran OSM extract from scratch or running `planet.osm` imports.
- Pointing any build at the public OSM host in production. Until this service exists, the
  app keeps its current raster fallback; do not "fix" the policy problem by shipping the
  OSM public host.

## Deliverables

1. The tile service, its Dockerfile, and its compose entry.
2. The area configuration (boxes) and the chosen maxzoom, each documented with its resulting
   size.
3. The style document, glyph ranges, and sprites as versioned artifacts.
4. A README covering: how to extract/update the archive, how to set the boxes and maxzoom,
   expected disk usage, how to size the volume, how to wipe/evict caches, how to regenerate
   Persian glyphs, and the Iranian-network reachability caveat. Include the mobile hand-off
   note: the client will be configured with a **style URL**
   (`EXPO_PUBLIC_MAP_STYLE_URL=<origin>/style.json`); `EXPO_PUBLIC_MAP_TILE_URL` is
   retired. Note that the client caches the style document, so the exact cache-busting
   mechanism is the mobile task's concern, not the server's.
5. Evidence against all ten acceptance criteria above, including a real-device screenshot
   of Persian labels on a downloaded area pack in airplane mode.
