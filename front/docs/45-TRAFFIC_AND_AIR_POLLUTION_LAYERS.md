# 45-Traffic & Air Pollution Layer Zones (Backend Changes) — for frontend AI agent

> **Scope**: This document describes the backend changes that add **traffic layer** and **air pollution layer** zone support to the app. Frontend was **not** touched — all types are already regenerated into `src/types/declarations/selectInp.ts`. This is a guide for the frontend agent to wire up the UI.

## 1. What was added (backend summary)

| Change | Files |
|---|---|
| **New model** `air_pollution_zone` | `back/models/air_pollution_zone.ts` |
| `traffic_zone` gained a **`city`** relation | `back/models/traffic_zone.ts` |
| `accident` gained an **`air_pollution_zone`** relation | `back/models/accident.ts` |
| Full CRUD acts for `air_pollution_zone` (add/get/gets/update/remove/count) | `back/src/air_pollution_zone/` |
| New seed act `seedTrafficZones` (seeds BOTH layers from one GeoJSON) | `back/src/traffic_zone/seedTrafficZones/` |
| Model/fn wiring + type regeneration | `back/mod.ts`, `back/src/mod.ts`, `back/models/mod.ts`, `back/declarations/selectInp.ts` |

All new acts require **Manager** level.

## 2. The GeoJSON source file

`back/sample_json_files/traffic/tarhtraffic.geojson` is a `FeatureCollection` with exactly **2 features** (one per layer), both `MultiPolygon`:

| # | properties.NAME / IDMAN | LAYERID | Mapped model |
|---|---|---|---|
| 0 | `طرح آلودگی` (Air pollution plan) | `TTCCBD1038` | `air_pollution_zone` |
| 1 | `طرح ترافیک` (Traffic plan) | `TTCCBD1044` | `traffic_zone` |

The seed function classifies each feature by `NAME`/`IDMAN`/`LAYERID` keywords:
- contains `ترافیک` / `traffic` OR `LAYERID` `TTCCBD1044` → **traffic**
- contains `آلودگی` / `pollution` / `LEZ` OR `LAYERID` `TTCCBD1038` → **pollution**
- otherwise the feature is skipped and logged as an error.

The user uploads this file through the existing **file upload act** with `type = "geo"` (stored in `back/uploads/geo/`), then calls `seedTrafficZones` with the returned `file._id` as `geoId`.

## 3. The new `air_pollution_zone` model

Mirrors `traffic_zone` exactly. Pure fields:

```ts
{
  name: string;
  area: { type: "MultiPolygon", coordinates: any[] }; // 2dsphere indexed
  population: number;
  createdAt/updatedAt: Date;
}
```

Relations (all single, optional):
- `registrer` → `user`
- `city` → `city` (reverse: `city.air_pollution_zones[]` auto-created by Lesan)
- `accidents` → `accident[]` (reverse of the new `accident.air_pollution_zone` relation, `limit: 20`)

Excludes on projections: `area`, `createdAt`, `updatedAt` (see `air_pollution_zone_excludes`), plus `area_excludes` on embedded `city`, `user_excludes` on `registrer`.

**IMPORTANT — relation direction**: Lesan relations are **one-directional** (child → parent). Only the child model defines the relation; the parent's reverse is auto-created. So:
- `air_pollution_zone.city` is **defined on `air_pollution_zone`**; `city.air_pollution_zones` is **auto-created**.
- `accident.air_pollution_zone` is **defined on `accident`**; `air_pollution_zone.accidents` is **auto-created**.
- `traffic_zone.city` is **defined on `traffic_zone`**; `city.traffic_zones` is **auto-created** (this was newly added).

## 4. Updated relation graph

```
user ◄── registrer                     (every model)
city ◄── traffic_zone.city  ──► city.traffic_zones[]        [NEW relation on traffic_zone]
city ◄── air_pollution_zone.city ──► city.air_pollution_zones[]   [NEW model]
accident ──► air_pollution_zone   (single) ──► air_pollution_zone.accidents[]   [NEW relation on accident]
accident ──► traffic_zone         (single) ──► traffic_zone.accidents[]         (existing)
accident ──► city_zone            (single) ──► city_zone.accidents[]            (existing)
```

The `city` model now embeds **three** reverse arrays: `traffic_zones[]`, `air_pollution_zones[]`, `city_zones[]`.

## 5. New acts on `air_pollution_zone`

Standard CRUD, schema name `air_pollution_zone`, all Manager-only.

- **`add`** — `set: { name, area, population, cityId }` → inserts with `city` + `registrer` relations.
- **`get`** — `set: { _id }`.
- **`gets`** — `set: { page, limit, name?, cities?: ObjectId[], cityNames?: string[], provinceIds?: ObjectId[] }` (supports city/province filtering like `city_zone/gets`). Sorted `_id` desc.
- **`update`** — `set: { _id, name?, population?, area? }` (pure fields only; relations not updatable here).
- **`remove`** — `set: { _id, hardCascade? }`.
- **`count`** — `set: { name? }` → `{ qty }`.

## 6. New seed act `seedTrafficZones`

Registered under schema `traffic_zone`, act name `seedTrafficZones`, Manager-only.

- **`set`**: `{ cityId: string, geoId: string }` — `geoId` is the `_id` of the uploaded GeoJSON **file** document (type `geo`).
- **`get`**: `{ summary: 1 }`.

Flow inside the fn:
1. Loads the file from `./uploads/geo/<file.name>` (size-capped at 490MB).
2. Parses the `FeatureCollection`.
3. Loads the target `city`.
4. For each feature: classifies layer → creates `traffic_zone` or `air_pollution_zone` (doc `{ name, area, population: 0 }`) with `city` + `registrer` relations.
5. Finds every accident with `location` inside the zone geometry (`$geoWithin`) and links them via `accident.addRelation({ replace: true })` in batches of 50.
6. Returns `{ summary: { trafficZonesCreated, airPollutionZonesCreated, accidentsUpdated, errors[], dbQueries, totalTime } }`.

**Notes**
- Re-running the act creates **new** zone docs (no upsert). If the frontend exposes this, warn the user or call it once per city.
- `population` is seeded as `0`.
- If a feature cannot be classified it is skipped (error logged in `summary.errors`), the act continues.

## 7. Generated types (already synced in frontend)

`front/src/types/declarations/selectInp.ts` now contains:

- `export type air_pollution_zoneInp` / `air_pollution_zoneSchema` (line ~4691)
- `ReqType["main"]["air_pollution_zone"]` with `add/get/gets/update/remove/count` (line ~6053)
- `ReqType["main"]["traffic_zone"]["seedTrafficZones"]` (line ~14992)
- `cityInp` now includes `traffic_zones?` + `air_pollution_zones?` (line ~2224)
- `accidentSchema` includes `air_pollution_zone?` get-projection object
- `traffic_zoneSchema` now includes `city?` relation

The **`gets` type includes `cityNames`, `cities`, `provinceIds` filters**, so the frontend can filter air pollution zones by city/province directly (same as `city_zone/gets`).

## 8. Suggested frontend work (NOT done — your job)

### 8.1 Model registration / Persian labels
- `front/src/utils/helper.ts` → add `"air_pollution_zone"` to the `ModelName` union and add a case in `translateModelNameToPersian` (e.g. `"منطقه آلودگی هوا"`).
- Sidebar (`front/src/components/organisms/SideBar.tsx`) → optionally add an admin link `air_pollution_zone` → `/admin/air-pollution-zone` (mirror the existing `traffic_zone` entry).

### 8.2 Admin CRUD page
- Add `front/src/app/admin/air-pollution-zone/page.tsx` mirroring `front/src/app/admin/traffic-zone/page.tsx`.
- Add server actions under `front/src/app/actions/air_pollution_zone/` mirroring `traffic_zone`: `gets.ts`, `count.ts`, `add.ts`, `update.ts`, `remove.ts`, `get.ts`.
- The generic `ClientCommonModelDashboard` + `SearchBox` + `Pagination` can be reused.

### 8.3 Seed modal (like SeedCityZonesModal)
- Create a `seedTrafficZones` server action under `front/src/app/actions/traffic_zone/seedTrafficZones.ts` (mirror `front/src/app/actions/city_zone/seedCityZones.ts`), calling `model: "traffic_zone", act: "seedTrafficZones"`.
- Create a `SeedTrafficZonesModal` component (mirror `front/src/components/template/SeedCityZonesModal.tsx`) that uploads a `type="geo"` file (via `UploadImage`) then calls the action with `{ cityId, geoId }`.
- Attach it to the traffic-zone admin dashboard (mirror how `CityDashboard.tsx` opens `SeedCityZonesModal`).
- Show `summary` from the response (`trafficZonesCreated`, `airPollutionZonesCreated`, `accidentsUpdated`, `errors`).

### 8.4 Filters / analytics (optional, deferred)
- The accident `gets` filter and all chart filters currently use name keys **`trafficZone`** and **`cityZone`**. There is **NO** `airPollutionZone` filter parameter anywhere yet.
- If filtering accidents by air-pollution zone is needed later, it requires a **backend** change: add `airPollutionZone` to `accident/gets` (`matchConditions["air_pollution_zone.name"]`) and to every chart `.val.ts`/`.fn.ts` that already has `trafficZone`/`cityZone` (~25 files). Do **not** invent the frontend-only filter; it won't validate.

## 9. Sample requests

### Add an air pollution zone
```ts
await AppApi().send({
  service: "main",
  model: "air_pollution_zone",
  act: "add",
  details: {
    set: { name: "طرح آلودگی", area: { type: "MultiPolygon", coordinates: [...] }, population: 0, cityId: "<cityId>" },
    get: { _id: 1, name: 1, city: { _id: 1, name: 1 } },
  },
}, { token });
```

### List zones for a city
```ts
await AppApi().send({
  service: "main",
  model: "air_pollution_zone",
  act: "gets",
  details: {
    set: { page: 1, limit: 20, cityNames: ["تهران"] },
    get: { _id: 1, name: 1, city: { _id: 1, name: 1 } },
  },
}, { token });
```

### Seed both layers
```ts
await AppApi().send({
  service: "main",
  model: "traffic_zone",
  act: "seedTrafficZones",
  details: {
    set: { cityId: "<cityId>", geoId: "<uploadedFileId>" },
    get: { summary: 1 },
  },
}, { token });
// response.body.summary = { trafficZonesCreated, airPollutionZonesCreated, accidentsUpdated, errors[], ... }
```

## 10. Gotchas for the frontend agent

1. **`area` is stripped from projections** by default (`air_pollution_zone_excludes`). To render the polygon on a Leaflet map you must request it explicitly: `get: { _id: 1, name: 1, area: 1 }` — same pattern as city zones.
2. **`traffic_zone.add` does NOT take a `cityId`** (unlike `air_pollution_zone.add`). City assignment for traffic zones happens only via `seedTrafficZones`. Don't add a city field to the traffic-zone add form.
3. **Re-seeding duplicates** — `seedTrafficZones` has no idempotency; warn the user or only run once per city.
4. **Manager level required** for every new act — a Ghost/Editor token will be rejected.
5. **Seed act is long-running** for large accident sets — show a spinner / "در حال پردازش" state in the modal (mirror `SeedCityZonesModal` which already does this).
