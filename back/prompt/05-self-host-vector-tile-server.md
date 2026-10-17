# Infrastructure task: a self-hosted OSM raster tile server for LESEN

## Why this task exists

The mobile patrol app downloads raster map tiles so an officer in a vehicle with
no signal can still see the road, pick the incident location, and record a
report. Those tiles are fetched from `https://tile.openstreetmap.org` because
`EXPO_PUBLIC_MAP_TILE_URL` is unset and `mobile/src/config/env.ts:33-36` falls
back to the public OSM host:

```ts
function readMapTileUrl(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed && trimmed.length > 0 ? trimmed : 'https://tile.openstreetmap.org';
}
```

That default is acceptable for a pilot and **not acceptable for production**, for
two independent reasons:

1. **It violates the OSM tile usage policy.** Bulk downloading is explicitly
   forbidden. The app's own estimate for the largest area pack is ~58 000 tiles
   at z13–z17 for a 25 km radius, and the national pack is up to ~66 000 tiles
   for the whole of Iran. That is a sustained, automated, high-volume fetch
   against a donated public service, from a fleet of devices, with no
   identification. Sustained abuse gets the whole deployment's IP range blocked,
   which would leave every officer in the field with no map at all.
2. **It caps useful detail and puts a third party on the critical path.** The
   fallback only reliably serves up to z18–19 for well-covered areas, and every
   tile an officer ever sees depends on OpenStreetMap Foundation infrastructure
   being reachable from an Iranian mobile network.

A self-hosted tile server fixes both, and fixes the third problem this task also
has to solve: **coverage**. There is no officer→zone relation anywhere in the
schema, so the app derives its offline box from `primaryOrganization.location`
plus a radius the officer picks. The server should own the area definition.

## What to build

An XYZ raster tile service, reachable over HTTP, serving PNG or JPEG tiles for a
configured bounding box, at **z13–z18** minimum (z19 for dense urban areas if
storage allows).

### Non-negotiable compatibility requirements

These come from the mobile client's tile mirror and are not negotiable — a
mismatch makes the officer see a blank map, not a slightly wrong one.

| Requirement | Value | Why |
| --- | --- | --- |
| Path template | `/{z}/{x}/{y}.png` | `mobile/src/services/map-tile-store.ts:15-16` builds exactly this |
| Tile size | 256 × 256 px | `TILE = 256` in `mobile/src/services/map-web-html.ts` |
| Scheme | `http` or `https` | Client sets `originWhitelist: ['file://', 'about:blank', 'http://*', 'https://*']` |
| Extension | `.png` | **Not** `.jpg`. `File.downloadFileAsync` writes to `{y}.png`; a redirect or a mismatched content type breaks the atomic-rename step |
| Horizontal wrapping | Standard XYZ | `x` wraps modulo `2^z` |
| Vertical bounds | Standard XYZ | `y` clamped to `0..2^z-1` |
| Auth | **None** | The WebView loads tiles directly by URL from a `file://` origin. It cannot attach an `Authorization` header, so any bearer/token scheme makes tiles unreachable |
| CORS | `Access-Control-Allow-Origin: *` | `allowUniversalAccessFromFileURLs` is set, but be explicit |

**The auth constraint is the one that usually gets missed.** The tile request
originates inside the WebView, not from the React Native API client. `tile.openstreetmap.org`
works precisely because it needs no credential. A tile server behind the existing
LESAN JWT middleware is unreachable from the map.

### Suggested shape

Any implementation is acceptable if it satisfies the table above. The pragmatic
stack for this repo:

- **tilelive** (`python-tilelive`) with a static file store, or
- **martin** (Rust tile server) with a PostGIS-backed source, or
- **TileServer GL / OpenMapTiles** if vector tiles are wanted later.

Given LESEN already runs Mongo + Redis in `docker-compose.yml`, a containerised
`tilelive` with a volume-backed static store is the lowest-friction fit, and it
keeps the "generated + cached on first request" behaviour the app already
assumes.

### Service requirements

1. **Explicit area configuration.** The service is told the bounding boxes to
   cover (initially: the Iranian provinces and motorway corridors the deployed
   organisations patrol). It must refuse to serve outside those boxes rather than
   generating unbounded coverage.
2. **Disk cache with eviction.** A 25 km box at z13–z18 is ~58 000 tiles at
   z13–z17 alone; add z18 and it is ~230 000. Cache to disk, cap it, evict
   least-recently-used.
3. **A meaningful `ETag` / `Last-Modified`.** The mobile `WebView` sets
   `cacheEnabled={false}`, so the client will not revalidate — but the download
   engine skips tiles whose file already exists, so the server must answer
   304 correctly for any tool that does check.
4. **404 for legitimately empty tiles** (open sea, the Caspian). The client
   treats 404 as `outcome: 'empty'` and records it in `map_tiles` as a negative
   cache entry — it is **not** an error and must not be retried
   (`mobile/src/services/map-tile-store.ts:76-78`).
5. **Rate limiting that is not hostile to a burst.** The download engine runs 4
   concurrent workers with retries at 1 s / 5 s / 15 s
   (`mobile/src/services/map-download.ts:36`). A limit tighter than that will
   starve every device. Return 429, which the client already handles as
   retryable.
6. **Health endpoint** for the compose healthcheck.
7. **A correct `User-Agent`** on outbound fetches to any upstream source. If
   tiles are generated locally from OSM data this is automatic; if proxied, set
   something identifying the deployment.

### Deployment requirements

- A new service in `/Users/syd/work/madani/nejat/lesan/docker-compose.yml` (and
  the dev compose file), on an internal port, with a named volume for the tile
  cache.
- The tile volume must be sized in the compose file or documented — the default
  Docker volume is unbounded and will fill the host disk.
- Must be reachable from **Android devices over the LAN**. Note that the
  production backend already sets `android.usesCleartextTraffic: true` for
  plain-HTTP backends, so serving tiles over HTTP is consistent with the current
  deployment.
- **On the Iranian mobile network specifically:** a server reachable only from
  the local network or a cloud region without Iranian peering will be slower or
  unusable from the field. Validate reachability from a real device on a real
  SIM before considering this done.

### The area question

This is the part that needs a product decision, not just an implementation.

The mobile app currently derives its offline box from
`primaryOrganization.location` plus a radius the officer picks (۵ / ۱۰ / ۲۵ km).
That is a workaround for a schema gap, and it is a poor one:

- `organization.location` is a **single point**, and for the demo motorway org it
  is documented as the corridor's *first vertex* — the Ahvaz end of a 116 km
  road — not its centroid. A box centred on it is lopsided.
- `organization.location_zoom` is documented as **corridor** scale: a 100 km
  corridor wants zoom 12. A single number therefore cannot size a box for both a
  motorway org and a municipal one.
- There is no `traffic_zone` / `city_zone` membership on `user`, `organization`,
  or `unit` — confirmed absent, not merely unused.

**Preferred fix, if the backend is in scope for this task:** add a real
bounding box to the organisation so the client never has to guess. The cheapest
possible wiring already exists — `primaryOrganization` is a fixed response field
computed in `back/src/user/primaryOrganization.ts:32-39`, already returned by
both `user.login` and `user.getMe`, and already persisted on the device session
offline. Adding a `patrol_area` GeoJSON Polygon (or a derived bbox) to that
projection costs no new mobile request at all.

**If that is out of scope**, the tile server should own an area table and
expose `GET /areas` so the mobile client can fetch real areas instead of
computing a radius locally.

## Acceptance criteria

1. `curl` a known tile and confirm `200`, `image/png`, 256×256, at every zoom in
   `{13,14,15,16,17,18}`.
2. Confirm a tile outside every configured box returns `404`, not a generated
   tile and not a `500`.
3. Confirm a sea tile returns `404` (not `200` with a blank PNG, and not `500`).
4. Confirm no authentication is required to fetch a tile.
5. Confirm the server survives the mobile client's actual request pattern:
   4 concurrent requests, bursts of ~10 000 tiles, plus retries — no `429`
   storm, no connection resets.
6. Confirm the compose volume has an explicit size and survives a restart
   without re-fetching everything.
7. Verify reachability **from a physical Android device on an Iranian SIM**,
   downloading a full ۱۰ km area pack end to end.
8. Confirm the tile cache can be evicted back to an initial size without
   breaking in-flight downloads.

## Explicitly out of scope

- **Any change to the mobile app.** Once the server is live, point
  `EXPO_PUBLIC_MAP_TILE_URL` at it and re-test. Do not mix server and client
  changes in the same commit; the client has a separate, already-identified
  defect being fixed independently.
- Vector tiles or a custom basemap style. The mobile renderer
  (`mobile/src/services/map-web-html.ts`) is a raster slippy map with a fixed
  `TILE = 256` assumption. Introducing vector tiles is a client rewrite.
- Terrain, satellite, or hybrid layers.
- Routing or geocoding. `road.getRoadsGeometry` and `road.snapPointToRoad` are
  LESAN backend acts and stay where they are.
- Regenerating the OSM extract for Iran. Consume an existing extract or an
  upstream tile source; do not run `planet.osm` imports as part of this task.

## Deliverables

1. The tile service, its Dockerfile, and its compose entry.
2. The area configuration (boxes), documented with the reasoning for each.
3. A README covering: how to set the bounding boxes, expected disk usage per
   box and zoom range, how to size the volume, how to wipe/evict the cache, and
   the reachability caveat for Iranian mobile networks.
4. A one-line note in the README on how to point the mobile client at it:
   `EXPO_PUBLIC_MAP_TILE_URL=<origin>` in `mobile/.env.development` or
   `.env.production`. Note that the client bakes the tile origin into a
   version-cached HTML document
   (`HTML_FILE_VERSION` in `mobile/src/services/map-web-html.ts`), so changing
   the URL alone does not take effect on a device that already has the current
   document — the version constant has to be bumped.
5. Evidence against all eight acceptance criteria above, including a real-device
   screenshot of a completed area-pack download in airplane mode.