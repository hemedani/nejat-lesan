# Spatial Single Vehicle Analytics Function Explanation
**Source File**: `src/accident/charts/spatialSingleVehicleAnalytics/spatialSingleVehicleAnalytics.fn.ts`

## What This Code Does
This is a Lesan backend action function that generates **two interconnected analytics specifically for single-vehicle accidents by city zone** in a single database call:
1. A **stacked bar chart** showing the count of each single-vehicle collision type per city zone
2. A **zonal map dataset** showing the percentage of user-selected (or default) single-vehicle types among all single-vehicle accidents per zone

It follows Lesan's core pattern: all filters are sent by the client, and the server applies them efficiently using native MongoDB aggregation operators. This function is a specialized version of the collision analytics, focusing exclusively on single-vehicle accidents.

---

## Step-by-Step Code Logic
### 1. Date Range Setup
- Defaults to the last 1 Jalali year (using `jalali-moment`) if no date filters are provided.
- Otherwise uses client-specified `dateOfAccidentFrom` and `dateOfAccidentTo`, normalized to start/end of day.

### 2. Define Single-Vehicle Types & Build Base Filter
- **Hardcoded single-vehicle types** (3 types):
  - `"برخورد وسیله نقلیه با شیء ثابت"` (vehicle vs. fixed object)
  - `"واژگونی و سقوط"` (overturning/falling)
  - `"خروج از جاده"` (road departure)
- **Base filter** includes `"collision_type.name": { $in: singleVehicleTypes }` to restrict analysis to only single-vehicle accidents. This is the key difference from the other spatial analytics functions.

### 3. Build Complete MongoDB Filter
Identical to the other spatial analytics functions: applies all client filters to the base filter, including core accident fields, context/environment fields (mapped to nested MongoDB paths, using `$in` for array filters), and a default city (user's city or "اهواز" if not specified).

### 4. Embedded Array Filters
Identical to the other spatial analytics functions: uses `$elemMatch` to filter embedded `vehicle_dtos` and `pedestrian_dtos` arrays, plus attachment filters.

### 5. Define Collision Types for Map Ratio
- Default: `["خروج از جاده"]` (road departure)
- Uses the client's `collisionType` filter array if provided (non-empty), otherwise falls back to the default. This is used for calculating the map chart percentage.

---

## Aggregation Pipeline (Using `$facet`)
The function uses MongoDB's `$facet` to run two separate aggregation pipelines in a single database roundtrip:
- First matches all documents against the fully built `baseFilter` (which already restricts to single-vehicle accidents), then filters out documents with no valid `city_zone.name`.

### Facet 1: `barChartData` (Stacked Bar Chart)
Unlike the other functions, this does NOT filter for valid `collision_type.name` because the base filter already guarantees only single-vehicle types are included:
1. Groups by `(city_zone.name, collision_type.name)` to count accidents per zone-collision type combination.
2. Regroups by `city_zone.name` to collect all collision counts for each zone, calculates total accidents per zone.
3. Sorts zones by total accident count (descending).
4. Formats output to `{ name: zoneName, counts: { collisionType: count, ... } }`.

### Facet 2: `mapData` (Zonal Map)
Same logic as `spatialCollisionAnalytics` map chart:
1. Groups by `city_zone.name` to calculate:
   - `totalCount`: Total single-vehicle accidents in the zone
   - `selectedTypesCount`: Count of accidents where `collision_type.name` is in the `collisionTypesToAnalyzeForMap` list
2. Calculates `ratio`: `(selectedTypesCount / totalCount) * 100`
3. Formats output to `{ name: zoneName, ratio: percentage }`

---

## Post-Aggregation Formatting
Unlike `spatialCollisionAnalytics` (which fetches all collision types from the database), this function:
- Uses the hardcoded `singleVehicleTypes` array (3 types) to build bar chart series
- Maps counts to each zone category
- Does NOT filter out zero-count series (shows all 3 single-vehicle types even if count is 0)

---

## Output Format
```json
{
  "analytics": {
    "barChart": { 
      "categories": [zone1, zone2, ...], 
      "series": [
        {name: "برخورد وسیله نقلیه با شیء ثابت", data: [count1, count2, ...]},
        {name: "واژگونی و سقوط", data: [count1, count2, ...]},
        {name: "خروج از جاده", data: [count1, count2, ...]}
      ] 
    },
    "mapChart": [{ "name": "Zone A", "ratio": 45.2 }, ...]
  }
}
```

---

## Key Differences from Other Spatial Analytics Functions
| Feature | `spatialLightAnalytics` | `spatialCollisionAnalytics` | `spatialSingleVehicleAnalytics` |
|---------|------------------------|----------------------------|--------------------------------|
| **Focus** | Lighting conditions | All collision types | Single-vehicle collisions only |
| **Base filter restriction** | None | None | `"collision_type.name": { $in: singleVehicleTypes }` |
| **Single-vehicle types** | N/A | N/A | Hardcoded 3 types |
| **Bar chart grouping** | `light_status.name` | `collision_type.name` | `collision_type.name` (only 3 types) |
| **Map chart default** | Total count per zone | Default: vehicle-to-vehicle % | Default: road departure % |
| **Collision types source** | From data | Fetched from `collision_type` collection | Hardcoded array |
| **Bar chart validation** | Filters null/empty `light_status.name` | Filters null/empty `collision_type.name` | No validation needed (base filter guarantees valid types) |
