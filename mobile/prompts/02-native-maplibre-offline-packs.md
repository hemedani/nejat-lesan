# Mobile task: replace the WebView raster map with native MapLibre, fed by the self-hosted vector tile server

## Why this task exists

The map is a `react-native-webview` running a hand-rolled slippy map. `src/services/map-web-html.ts`
is 812 lines of HTML/CSS/JS injected as a string, and `src/components/osm-web-map.tsx` (267 lines)
is the bridge around it. Tiles are **raster PNG**, fetched one file at a time and mirrored to disk:

```ts
// src/services/map-tile-store.ts:15-21
export function tileRemoteUrl(tile: TileCoord): string {
  return `${getAppConfig().mapTileUrl}/${tile.z}/${tile.x}/${tile.y}.png`;
}
export function tileLocalUri(tile: TileCoord): string {
  return `${mapCacheRoot().uri}/${tile.z}/${tile.x}/${tile.y}.png`;
}
```

`mapTileUrl` defaults to the **public OSM host** when the env var is unset:

```ts
// src/config/env.ts:33-36
function readMapTileUrl(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed && trimmed.length > 0 ? trimmed : 'https://tile.openstreetmap.org';
}
```

That is three problems at once, and the third one is why this cannot wait:

1. **It violates the OSM tile usage policy.** A field device pulling an area pack is bulk
   downloading; the policy forbids it. Sustained use gets the deployment's IP range blocked and
   every officer loses the map.
2. **A third party is on the critical path.** Every tile depends on OSMF infrastructure being
   reachable from an Iranian mobile network.
3. **Raster labels are baked into pixels.** Persian place names cannot be re-styled, re-localized,
   or kept crisp when overzoomed — and the pack is enormous. `src/domain/map-area-pack.ts:30-38`
   records the measured cost at z13–z17: ۵ km → 2.4k tiles (~48 MB), ۱۰ km → 9.4k (~190 MB),
   ۲۵ km → 58k (~1.16 GB).

A self-hosted **vector** tile server now exists and is the replacement. It lives in this repo at
`lesan/tiles` and runs natively (`cd tiles && ./run-local.sh` → `http://localhost:8790`). It serves
a MapLibre style, TileJSON, ZXY MVT, Persian glyphs, sprites and an area list. **The server side is
done. This task is the client side only.**

## The contract — read this before designing anything

**MapLibre Native can read a `.pmtiles` archive directly (`pmtiles://https://…`) — do not use it.**
PMTiles sources **do not support offline pack downloads or caching**. Filing a report with no
signal is the product's core promise, so an unpackable source is disqualifying no matter how much
simpler it looks. The client must consume the **ZXY MVT** endpoint through `OfflineManager`, which
is what the server exposes. PMTiles is an implementation detail behind that endpoint.

What the server guarantees (verified against the running instance):

| Surface | Path | Notes |
| --- | --- | --- |
| Style | `/style.json` | MapLibre style; `sources` → `/tiles.json`, `glyphs` → `/glyphs/…`, `sprite` → `/sprites/v4/…` |
| TileJSON | `/tiles.json` | `scheme: xyz`, `tileSize: 512`, `maxzoom: 14`, Iran `bounds` |
| Vector tile | `/tiles/{z}/{x}/{y}.mvt` | `application/x-protobuf`, gzip-encoded, `ETag`/`304` |
| Glyphs | `/glyphs/{fontstack}/{range}.pbf` | fontstacks are `Vazirmatn Regular` and `Vazirmatn Bold` |
| Sprites | `/sprites/v4/{light,dark}.{json,png,@2x.png}` | |
| Areas | `/areas` | available area definitions |
| Health | `/healthz` | `{"status":"ok"}` |

- **`maxzoom` is 14, and that is deliberate.** Do not request z15–z17 tiles — they `404`. MapLibre
  overzooms vector geometry, so z17 detail comes from z14 tiles. Set `maxZoom: 14` on any offline
  region.
- An empty tile is `204`; out-of-zoom is `404`. Neither is an error.
- **No auth on any read path** — do not add an `Authorization` header; MapLibre's native downloader
  and the offline pack engine fetch tiles without a per-tile header hook.
- CORS is `*`.

Config change: **`EXPO_PUBLIC_MAP_TILE_URL` is retired.** The single new variable is

```
EXPO_PUBLIC_MAP_STYLE_URL=http://<host>:8790/style.json
```

## What to change

### 1. Config — `src/config/env.ts`

Replace `mapTileUrl` / `readMapTileUrl` (`:25-26`, `:33-36`, `:65`) with `mapStyleUrl` /
`readMapStyleUrl` reading `EXPO_PUBLIC_MAP_STYLE_URL`.

**Do not keep an OSM fallback.** A silent fallback to `tile.openstreetmap.org` is the exact defect
being removed; an unset variable must fail loudly with a message naming the variable. Update
`.env.development`, `.env.production`, `.env.example` and `expo-env.d.ts` to match.

### 2. The renderer — `src/components/osm-web-map.tsx` → a native MapLibre map

Replace the `WebView` (`:242-244`) with `MapView` + `Camera` from `@maplibre/maplibre-react-native`,
`mapStyle={styleUrl}`. Keep the **public handle API** — `OsmWebMapHandle` (`:10`) and
`OsmWebMapProps` (`:21`) — or rename them and update both call sites in the same commit:
`src/app/(tabs)/map.tsx:7,23,48` and `src/app/incident/location.tsx`.

These are the only two consumers; grep before you start, because `map.tsx` is currently modified in
the working tree and the call sites may have moved.

### 3. Delete the HTML map

`src/services/map-web-html.ts` (812 lines) and its test `src/services/map-web-html.test.ts` go
away with the WebView. Nothing else may import them when you are done.

### 4. The road overlay must be reimplemented, not ported

`src/services/road-overlay-switch.ts:24` currently reads:

```ts
export const ROAD_OVERLAY_ENABLED = false;
```

It is off because the overlay is a full-viewport `<canvas>` painted over the tiles *inside the
WebView*, and that produced two symptoms: the map renders **blurred** while online, and the road
**lags a frame behind** during a pan. Neither could be diagnosed without a device.

Both are artefacts of the canvas-in-WebView approach and should disappear by construction: draw the
road as a MapLibre `ShapeSource` + `LineLayer` in the style's own render loop, below labels. Treat
re-enabling it as part of this task, and verify on a device that the map stays sharp and the line
tracks a pan.

`src/services/map-road-overlay.test.ts:43-52` asserts the HTML template interpolates the flag
(`/\$\{(ROAD_OVERLAY_ENABLED[^}]*)\}/`). That test dies with the template; replace it with a test of
whatever produces the GeoJSON for the source.

### 5. Offline packs — `src/services/map-tile-store.ts` and `src/services/map-download.ts`

The current design is a per-tile PNG mirror where "presence of the file IS the cache"
(`map-tile-store.ts:6-10`), driven by a queue in `map-download.ts` (`startAreaDownload:170`,
`pauseDownload:188`, `resumeDownload:199`, `pump:413`, `startMapDownloadWatcher:448`,
`DEFAULT_WIFI_ONLY:29`).

Move the storage and transfer to MapLibre's `OfflineManager` (`createPack` / `invalidatePack` /
`getPacks`), and keep the **product behaviour** the officer already has:

- the Wi-Fi-only default and its setting,
- pause / resume / cancel and progress reporting,
- the pack list with size and removal,
- download state that survives a restart.

`tileRemoteUrl`, `tileLocalUri`, `hasLocalTile`, `downloadTile`, `measureTileMirror` and
`deleteAllTiles` are PNG-mirror concepts. Delete them rather than leaving two caches side by side —
a stale `Documents/mapcache` mirror is worse than none.

The **area** input stays as it is: `primaryOrganization.location` plus an officer-chosen radius
(`AREA_RADII_KM`, `map-area-pack.ts:40-44` — ۵ / ۱۰ / ۲۵ km). `boundsForRadius` is still the right
maths. Only the **cost model** changes.

### 6. Pack estimates are now wrong by an order of magnitude

`src/domain/map-packs.ts` (`MAP_TIERS`, `estimatePack`, `tileCountForBounds`, `iterTiles`) and the
comment block at `map-area-pack.ts:30-38` describe a z13–z17 raster pack. At maxzoom 14 the real
numbers are:

| radius | raster z13–17 (old) | vector maxzoom 14 (measured) |
| --- | --- | --- |
| ۱۰ km | 9.4k tiles, ~190 MB | **179 tiles, 9.75 MB decoded (~6.09 MB on the wire)** |

Update the estimator and the UI copy so the officer is not told a ۱۰ km pack is 190 MB when it is
about 10 MB. If the estimate is no longer derived from tile counts, say in the code comment what it
is derived from.

### 7. `app.json`

Add the `@maplibre/maplibre-react-native` config plugin to `plugins`. Android already has
`usesCleartextTraffic: true` (`app.json:62`), so a plain-`http` origin works there. **iOS needs an
ATS exception** for a cleartext origin (`NSAppTransportSecurity` /
`NSAllowsArbitraryLoadsInWebContent` does *not* cover native MapLibre — you need
`NSExceptionDomains` for the host, or HTTPS). Do not paper over this by shipping `NSAllowsArbitraryLoads`.

## Constraints

- **No backend changes.** Do not touch `lesan/back`, `lesan/tiles`, the style document, or any
  server act. If the style is wrong, report it — do not patch around it client-side.
- **No Docker.** The server runs natively; see `lesan/tiles/README.md`.
- **A dev build is required.** `@maplibre/maplibre-react-native` is a native module: it does not
  run in Expo Go. `npx expo prebuild` / an EAS dev build, per the repo's existing workflow.
- **Do not point the style at a `.pmtiles` URL.** See the contract section.
- **Do not substitute the UI font.** `mobile/assets/fonts` ships **Estedad** for the app's UI; the
  map's glyphs come from the server (`Vazirmatn Regular`). They are different concerns and the style
  already names the right fontstack.
- **Do not remove the offline promise to simplify.** A pack that only works online is a regression,
  not a smaller change.
- `npm test` (vitest) and `npm run lint` must pass. There is no `typecheck` script.

## Verification

1. **Unit.** `npm test` green, including the rewritten overlay test and any new estimate tests.
   Pure-domain modules (`map-area-pack`, `map-packs`) must stay Expo-free so they remain testable.

2. **No OSM traffic.** `rg -n "tile\.openstreetmap\.org" mobile/src` → no hits. Then watch the
   device: every tile request must go to the self-hosted origin.

3. **Persian labels render.** Load the style, find Tehran. Place names must be Persian
   (`تهران`, `میدان امام خمینی`) with **no tofu boxes**. Tofu means the glyph endpoint or the
   fontstack is wrong — report it, do not fall back to Latin.

4. **Offline pack, end to end.** Download a ۱۰ km pack, enable **airplane mode**, pan and zoom the
   area. Tiles must render from the pack; labels must still be Persian. Record the actual pack size
   and compare it with the estimate.

5. **Overzoom.** Zoom past 14 — geometry must scale cleanly and no request may go out for z15+.

6. **Overlay.** With the road overlay enabled, confirm the map is **sharp** while online and the line
   stays glued during a pan. These are the two symptoms the flag was disabled for; if either
   returns, the canvas was not the cause and that is a finding worth reporting.

7. **Restart.** Kill and relaunch the app: the pack must still be listed and still work offline.

## Out of scope

- Terrain, satellite or hybrid layers; routing; geocoding.
- `road.getRoadsGeometry` / `road.snapPointToRoad` — backend acts, they stay.
- Any change to the tile server, its style, its glyphs or its archive.
- Regenerating backend declarations.
