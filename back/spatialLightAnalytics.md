# Spatial Light Analytics Function Explanation
**Source File**: `src/accident/charts/spatialLightAnalytics/spatialLightAnalytics.fn.ts`

## What This Code Does
This is a Lesan backend action function that generates **two interconnected accident analytics by city zone and lighting conditions** in a single database call:
1. A **stacked bar chart** showing the count of each lighting condition per city zone
2. A **zonal map dataset** showing total accident count per city zone (for map intensity/sizing)

It follows Lesan's core pattern: all filters are sent by the client, and the server applies them efficiently using native MongoDB aggregation operators.

---

## Step-by-Step Code Logic
### 1. Date Range Setup
- Defaults to the last 3 Jalali years (using `jalali-moment`) if no date filters are provided by the client.
- Otherwise uses client-specified `dateOfAccidentFrom` and `dateOfAccidentTo`, normalized to start/end of day.

### 2. Build Base MongoDB Filter
All client filters are applied to a `baseFilter` document before aggregation:
- Core accident fields: Serial number, news number, dead/injured counts (supports exact values or min/max ranges), witness presence, officer name (case-insensitive regex), completion date range.
- Context/environment fields: Maps filter keys (e.g., `lightStatus`, `city`, `road`) to nested MongoDB fields (e.g., `light_status.name`, `city.name`). Non-empty array filters use the `$in` operator.
- Default city: If no city filter is provided, uses the requesting user's default city from context, or falls back to "اهواز" (Ahvaz).

### 3. Embedded Array Filters
Accidents have embedded `vehicle_dtos` and `pedestrian_dtos` arrays. Filters for these use MongoDB's `$elemMatch` to match accidents where at least one array element matches all criteria:
- **Vehicle filters**: Vehicle attributes (color, insurance), driver details (name, license, injury), passenger details, insurance date/warranty ranges.
- **Pedestrian filters**: Pedestrian sex, injury type, fault status, name/national code. Added via `$and` to the base filter if present.
- **Attachment filters**: Case-insensitive regex for attachment name, exact match for attachment type.

---

## Aggregation Pipeline (Using `$facet`)
The function uses MongoDB's `$facet` to run two separate aggregation pipelines in a single database roundtrip:
- First matches all documents against the fully built `baseFilter`, then filters out documents with no valid `city_zone.name` (zones are required for both analytics).

### Facet 1: `barChartData` (Stacked Bar Chart)
1. Filters for documents with a valid, non-empty `light_status.name` (lighting condition is required for this chart).
2. Groups by `(city_zone.name, light_status.name)` to count accidents per zone-lighting combination.
3. Regroups by `city_zone.name` to collect all lighting counts for each zone, calculates total accidents per zone.
4. Sorts zones by total accident count (descending).
5. Formats output to `{ name: zoneName, counts: { lightingType: count, ... } }`.

### Facet 2: `mapData` (Zonal Map)
1. Groups by `city_zone.name` to sum total accidents per zone.
2. Formats output to `{ name: zoneName, count: totalAccidents }`.

---

## Output Format
```json
{
  "analytics": {
    "barChart": { "categories": [...], "series": [...] },
    "mapChart": [{ "name": "Zone A", "count": 123 }, ...]
  }
}
```

---

## Key Differences from Other Spatial Analytics Functions
| Feature | `spatialLightAnalytics` | `spatialCollisionAnalytics` | `spatialSingleVehicleAnalytics` |
|---------|------------------------|----------------------------|--------------------------------|
| **Focus** | Lighting conditions | All collision types | Single-vehicle collisions only |
| **Base filter restriction** | None | None | `"collision_type.name": { $in: singleVehicleTypes }` |
| **Bar chart grouping** | `light_status.name` | `collision_type.name` | `collision_type.name` (only 3 types) |
| **Map chart data** | Total accident count per zone | % of selected collision types | % of selected single-vehicle types |
| **Default date range** | Last 3 Jalali years | Last 1 Jalali year | Last 1 Jalali year |
| **Bar chart series source** | Lighting types present in data | All collision types from DB | Hardcoded 3 single-vehicle types |
