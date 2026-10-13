# Road Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 Road                        │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, area: MultiLineString                 │
│  origin, destination                         │
│  total_length_meters  ← DERIVED from area    │
│  lanes: [{ _id, name }] → position           │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  province ─────► Province (single, required) │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── organization.road (single)              │
│  ◄── unit.road (units, multiple)             │
│  ◄── accident.road (accidents, multiple, 20) │
└──────────────────────────────────────────────┘
```

## Pure Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Road name |
| area | GeoJSON MultiLineString | Ordered centreline, `[lng, lat]` per vertex |
| origin | string, optional | Origin endpoint name |
| destination | string, optional | Destination endpoint name |
| total_length_meters | number, optional | **Derived.** Cached length of `area`; recomputed by `add`/`update`, never client input |
| lanes | array of `{_id, name}`, optional | Lane/band definitions referencing `position` docs |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Road → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | Province | **false** | roads (multiple, 50) |

### Reverse Relations (from other models → Road)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| organization | road | single | — |
| unit | road | multiple | 50 |
| accident | road | multiple | 20 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## Behaviour notes

- **`total_length_meters` is derived.** `road.add` and `road.update` recompute it
  from `area` with `multiLineLengthMeters` (`utils/geo.ts`) and neither validator
  accepts it. The estimate is the same equirectangular method
  `projectPointToMultiLine` uses, so the cached length and the line
  `snapPointToRoad` projects onto cannot disagree. A hand-typed value would flow
  silently into kilometre/meter reports.
- **`lanes` entries must reference real `position` documents.** Both acts check
  every `_id` and throw «موقعیت‌های انتخاب‌شده معتبر نیستند» otherwise.
  `common_relation_struct` requires `name`, so `{_id}` alone is rejected at the
  validator and a stale id is rejected by the fn.
- **`road_excludes` = `["area", "updatedAt", "createdAt"]`** — the `province.roads`
  reverse keeps `origin`, `destination`, `total_length_meters` and `lanes` but drops
  the geometry, which is the expensive field.

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439025",
  "name": "Tehran-North Freeway",
  "area": {
    "type": "MultiLineString",
    "coordinates": [[[51.3, 35.7], [51.35, 35.75], [51.4, 35.8], [51.45, 35.85]]]
  },
  "origin": "تهران",
  "destination": "شمال",
  "total_length_meters": 21430,
  "lanes": [
    { "_id": "60f1", "name": "خط اول" },
    { "_id": "60f2", "name": "خط دوم" }
  ],
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
