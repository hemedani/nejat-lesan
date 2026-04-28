# Spatial Safety Index Analytics Function Explanation
**Source File**: `src/accident/charts/spatialSafetyIndexAnalytics/spatialSafetyIndexAnalytics.fn.ts`

## What This Code Does
This is a Lesan backend action function that calculates **safety index metrics (per 100k population) for a user-selected spatial unit** (province, city, or city_zone) in a single aggregation pipeline:
1. **Bar chart metric**: Fatalities (dead count) per 100k population
2. **Map chart metric**: Total casualties (dead + injured) per 100k population

It follows Lesan's core pattern: all filters are sent by the client, and the server applies them efficiently using native MongoDB operators. This is the first spatial analytics function with **dynamic grouping** and **population-adjusted safety metrics**.

---

## Step-by-Step Code Logic
### 1. Date Range Setup
- Defaults to the last 1 Jalali year (using `jalali-moment`) if no date filters are provided (consistent with collision/single-vehicle analytics).
- Otherwise uses client-specified `dateOfAccidentFrom` and `dateOfAccidentTo`, normalized to start/end of day.

### 2. Dynamic Spatial Grouping
- Extracts `groupBy` from client filters (valid values: `province`, `city`, `city_zone`), defaults to `province` if not provided.
- Separates `groupBy` from other filters to avoid applying it as a filter (it only defines the aggregation grouping key).

### 3. Build Base MongoDB Filter
Applies all client filters (excluding `groupBy`) to `baseFilter`:
- Core accident fields: Serial number, news number, dead/injured counts (exact or min/max ranges), witness presence, officer name (case-insensitive regex), completion date range.
- Context/environment fields: Maps filter keys (e.g., `lightStatus`, `collisionType`) to nested MongoDB paths, using `$in` for non-empty array filters.
- **No default city**: Unlike other spatial analytics functions, this does not default to the user's city or "اهواز"—spatial scope is controlled entirely by client filters.

### 4. Embedded Array Filters
Consistent with all other spatial analytics functions: uses `$elemMatch` to filter embedded `vehicle_dtos` and `pedestrian_dtos` arrays, plus attachment filters.

---

## Aggregation Pipeline (Single Pipeline, No `$facet`)
Unlike previous spatial functions that used `$facet` for dual outputs, this uses a single pipeline to calculate both metrics in one pass:
1. **First `$match`**: Applies the fully built `baseFilter` to all accident documents.
2. **Second `$match`**: Filters for documents where:
   - The spatial unit's name field (e.g., `province.name` if `groupBy=province`) exists and is non-null/non-empty.
   - The spatial unit's population field (e.g., `province.population`) exists and is greater than 0 (ensures valid population data for rate calculations).
3. **`$group`**: Groups documents by the spatial unit's name (`_id: $${spatialUnit}.name`), and calculates:
   - `population`: First value of the population field (all documents for the same spatial unit share the same embedded population).
   - `totalDead`: Sum of `dead_count` across all accidents in the spatial unit.
   - `totalInjured`: Sum of `injured_count` across all accidents in the spatial unit.
4. **`$project`**: Calculates the two safety index metrics:
   - `barChartMetric`: `(totalDead / population) * 100000` (fatalities per 100k population).
   - `mapChartMetric`: `((totalDead + totalInjured) / population) * 100000` (total casualties per 100k population).
5. **`$sort`**: Sorts results by `mapChartMetric` descending (highest casualty rate first).

---

## Output Format
Direct array of spatial units with precomputed metrics (no nested `barChart`/`mapChart` structure like previous functions):
```json
{
  "analytics": [
    { "name": "Tehran", "barChartMetric": 4.2, "mapChartMetric": 11.7 },
    { "name": "Ahvaz", "barChartMetric": 6.1, "mapChartMetric": 15.3 },
    ...
  ]
}
```

---

## Key Differences from Other Spatial Analytics Functions
| Feature | `spatialLightAnalytics` | `spatialCollisionAnalytics` | `spatialSingleVehicleAnalytics` | `spatialSafetyIndexAnalytics` |
|---------|------------------------|----------------------------|--------------------------------|--------------------------------|
| **Focus** | Lighting conditions | All collision types | Single-vehicle collisions only | Safety index (per 100k pop) |
| **Grouping** | Hardcoded (always `city_zone.name`) | Hardcoded (always `city_zone.name`) | Hardcoded (always `city_zone.name`) | Dynamic via `groupBy` (province/city/city_zone) |
| **Metrics** | Raw counts | Raw counts | Raw counts | Population-adjusted rates |
| **Population Data** | Not used | Not used | Not used | Embedded in accident documents (e.g., `province.population`), no `$lookup` needed |
| **Aggregation Structure** | `$facet` for dual outputs | `$facet` for dual outputs | `$facet` for dual outputs | Single pipeline, both metrics in `$project` |
| **Default City** | Defaults to user's city or "اهواز" | Defaults to user's city or "اهواز" | Defaults to user's city or "اهواز" | No default city—spatial scope controlled by client filters |
| **Context Dependency** | Uses `MyContext` for user settings | Uses `MyContext` for user settings | Uses `MyContext` for user settings | No context import (does not need user's city settings) |
| **Output Structure** | Nested `barChart`/`mapChart` objects | Nested `barChart`/`mapChart` objects | Nested `barChart`/`mapChart` objects | Flat array of spatial units with metrics |
| **Default Date Range** | Last 3 Jalali years | Last 1 Jalali year | Last 1 Jalali year | Last 1 Jalali year |
