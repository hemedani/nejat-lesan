# mapAccidents — API Contract for the Frontend

## Endpoint

| | |
|---|---|
| **Act** | `mapAccidents` |
| **Model** | `accident` |
| **Service** | `main` (default) |
| **Auth** | Requires JWT + chart permission `mapAccidentsAnalytics` (Manager level) |

## Request — `get` (CHANGED)

The big change: `get.accidents` is now a **Lesan projection object** (from `selectStruct("accident", 2)`) instead of `1`/`enums`. The frontend chooses exactly which fields to return.

Structure:

```jsonc
{
  "get": {
    "accidents": {
      // any accident pure field or relation, values 1 (=include) or 0 (=exclude)
    },
    "total": 1          // always send 1
  }
}
```

### Selectable fields

**Pure fields** (value is just `1`/`0`):
`_id`, `seri`, `serial`, `location`, `date_of_accident`, `dead_count`, `has_witness`, `news_number`, `officer`, `injured_count`, `completion_date`, `createdAt`, `updatedAt`, `vehicle_dtos`, `pedestrian_dtos`

**Single relations** (value is a nested object of that model's pure fields, e.g. `{ "name": 1 }`):
`province`, `city`, `township`, `road`, `traffic_zone`, `city_zone`, `type`, `position`, `ruling_type`, `light_status`, `collision_type`, `road_situation`, `road_repair_type`, `shoulder_status`

**Multiple relations** (same nested-object form, returns an array):
`area_usages`, `air_statuses`, `road_defects`, `human_reasons`, `vehicle_reasons`, `equipment_damages`, `road_surface_conditions`, `attachments`

### ⚠️ Important limitation
`vehicle_dtos` and `pedestrian_dtos` are **embedded arrays, not relations**, so the validator only accepts `1`/`0` for them — you **cannot** send `vehicle_dtos: { driver: { ... } }`. To get driver/plaque details, request the whole array with `vehicle_dtos: 1`. (The server-side *default* projection uses a pruned nested form, but that's internal only.)

### Empty projection → default data
Send `"accidents": {}` and you automatically get back (nested equivalents of):
`_id`, `location`, `type.name`, `date_of_accident`, `dead_count`, `injured_count`, `collision_type.name`, `light_status.name`, `position.name`, `road_defects.name`, `vehicle_dtos.driver.total_reason.name`

## Request — `set` (UNCHANGED)

| Field | Type | Notes |
|---|---|---|
| `polygon` | GeoJSON `Polygon` | spatial filter |
| `limit` / `skip` | number | default `skip=0`, `limit=1000` |
| `seri`, `serial` | number | (seri is defined but note: no `$match` code applies it currently) |
| `dateOfAccidentFrom`/`To` | string | if both missing → last Jalali year → now |
| `deadCountMin`/`Max`, `injuredCountMin`/`Max` | number | range filters |
| `officer` | string | case-insensitive regex |
| `province`, `city`, `road`, `trafficZone`, `cityZone`, `accidentType`, `position`, `rulingType`, `lightStatus`, `collisionType`, `roadSituation`, `roadRepairType`, `shoulderStatus` | `string[]` | `$in` on `.name` |
| `areaUsages`, `airStatuses`, `roadDefects`, `humanReasons`, `vehicleReasons`, `roadSurfaceConditions` | `string[]` | `$in` on `.name` |
| `vehicleSystem`, `vehicleFaultStatus` | `string[]` | `$elemMatch` on vehicle_dtos |
| `driverSex`, `driverLicenceType`, `driverInjuryType` | `string[]` | `$elemMatch` on vehicle_dtos.driver |

## Response

```jsonc
{
  "accidents": [
    {
      "_id": "…",                       // always present unless you send "_id": 0
      "location": { "type": "Point", "coordinates": [lon, lat] },
      "date_of_accident": "…",
      "dead_count": 0,
      "injured_count": 2,
      "type": { "name": "…" },
      "collision_type": { "name": "…" },
      // … only the fields you requested …
      "vehicle_dtos_count": 2,          // ALWAYS present
      "motorcycle_count": 1             // ALWAYS present
    }
  ],
  "total": 123
}
```

**Always-present computed fields** (cannot be turned off):
- `vehicle_dtos_count` — number of `vehicle_dtos`
- `motorcycle_count` — number of `vehicle_dtos` whose `plaque_type.name` contains `موتور`

## Example request

```jsonc
{
  "service": "main",
  "model": "accident",
  "act": "mapAccidents",
  "details": {
    "set": {
      "polygon": { "type": "Polygon", "coordinates": [/* … */] },
      "limit": 100
    },
    "get": {
      "accidents": {
        "_id": 1,
        "location": 1,
        "type": { "name": 1 },
        "date_of_accident": 1,
        "dead_count": 1,
        "injured_count": 1,
        "collision_type": { "name": 1 }
      },
      "total": 1
    }
  }
}
```

## Caveats

1. **Don't mix `1` and `0`** in the same `accidents` object — Mongo throws *"Cannot mix inclusion and exclusion"*.
2. `_id` is included by default; send `"_id": 0` to drop it.
3. `location` coordinates are `[longitude, latitude]` (GeoJSON).
4. Computed counts are always attached regardless of your selection, so `motorcycle_count` works even if you don't select `vehicle_dtos`.

The generated types in `back/declarations/selectInp.ts` (`lesanApi`) are regenerated at server startup, so the frontend can regenerate its API contract from there.
