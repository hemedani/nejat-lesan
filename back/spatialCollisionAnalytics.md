# Spatial Collision Analytics Function Explanation
**Source File**: `src/accident/charts/spatialCollisionAnalytics/spatialCollisionAnalytics.fn.ts`

## What This Code Does
This is a Lesan backend action function that generates **two interconnected accident analytics by city zone and collision types** in a single database call:
1. A **stacked bar chart** showing the count of each collision type per city zone
2. A **zonal map dataset** showing the percentage of user-selected (or default) collision types among all accidents per zone

It follows Lesan's core pattern: all filters are sent by the client, and the server applies them efficiently using native MongoDB aggregation operators. It is nearly identical to the `spatialLightAnalytics.fn.ts` function, with key differences in analytics focus, date range default, and map chart calculation.

---

## Step-by-Step Code Logic
### 1. Date Range Setup
- Defaults to the last 1 Jalali year (using `jalali-moment`) if no date filters are provided (vs. 3 years in the lighting analytics function).
- Otherwise uses client-specified `dateOfAccidentFrom` and `dateOfAccidentTo`, normalized to start/end of day.

### 2. Build Base MongoDB Filter
Identical to the lighting analytics function: all client filters are applied to a `baseFilter` document before aggregation, including core accident fields, context/environment fields (mapped to nested MongoDB paths, using `$in` for array filters), and a default city (user's city or "اهواز" if not specified).

### 3. Embedded Array Filters
Identical to the lighting analytics function: uses `$elemMatch` to filter embedded `vehicle_dtos` and `pedestrian_dtos` arrays, plus attachment filters. All vehicle, pedestrian, and attachment filter logic is copied directly from the lighting analytics function.

### 4. Define Collision Types to Analyze
- Default collision type: `["برخورد وسیله نقلیه با یک وسیله نقلیه"]` (vehicle-to-vehicle collision)
- Uses the client's `collisionType` filter array if provided (non-empty), otherwise falls back to the default. This list is used for the map chart calculation.

---

## Aggregation Pipeline (Using `$facet`)
The function uses MongoDB's `$facet` to run two separate aggregation pipelines in a single database roundtrip:
- First matches all documents against the fully built `baseFilter`, then filters out documents with no valid `city_zone.name` (zones are required for both analytics).

### Facet 1: `barChartData` (Stacked Bar Chart)
Nearly identical to the lighting analytics bar chart, but groups by collision type instead of lighting condition:
1. Filters for documents with a valid, non-empty `collision_type.name` (collision type is required for this chart).
2. Groups by `(city_zone.name, collision_type.name)` to count accidents per zone-collision type combination.
3. Regroups by `city_zone.name` to collect all collision counts for each zone, calculates total accidents per zone.
4. Sorts zones by total accident count (descending).
5. Formats output to `{ name: zoneName, counts: { collisionType: count, ... } }`.

### Facet 2: `mapData` (Zonal Map)
Differs from the lighting analytics map (which showed total accident count per zone):
1. Groups by `city_zone.name` to calculate two values per zone:
   - `totalCount`: Total accidents in the zone matching all client filters
   - `selectedCollisionTypeCount`: Count of accidents where `collision_type.name` is in the `collisionTypesToAnalyze` list (uses `$cond` + `$in` to conditionally count)
2. Calculates `ratio`: `(selectedCollisionTypeCount / totalCount) * 100` (returns 0 if totalCount is 0)
3. Formats output to `{ name: zoneName, ratio: percentage }`

---

## Post-Aggregation Formatting
Unlike the lighting analytics function (which only used collision/lighting types present in the data), this function:
1. Fetches *all* possible collision types from the `collision_type` collection to ensure complete series coverage.
2. Builds bar chart series for all collision types, mapping counts to each zone category.
3. Filters out any series where all counts are zero (no accidents of that collision type in any zone).

---

## Output Format
Same structure as the lighting analytics function, with a key difference in the map chart data:
```json
{
  "analytics": {
    "barChart": { "categories": [zone1, zone2, ...], "series": [{name: collisionType, data: [count1, count2, ...]}, ...] },
    "mapChart": [{ "name": "Zone A", "ratio": 34.5 }, ...] // ratio is percentage of selected collision types
  }
}
```

---

## Key Differences from `spatialLightAnalytics.fn.ts`
| Feature | `spatialLightAnalytics` | `spatialCollisionAnalytics` |
|---------|------------------------|----------------------------|
| **Focus** | Lighting conditions | All collision types |
| **Bar chart groups by** | `light_status.name` | `collision_type.name` |
| **Map chart shows** | Total accident count per zone | Collision type percentage |
| **Default date range** | Last 3 Jalali years | Last 1 Jalali year |
| **Series source** | Lighting types present in data | All collision types from DB |
| **Additional import** | Only `accident`, `coreApp` | Also imports `collision_type` model |
