# Frontend Fix: Spatial Collision Analytics — Correct Map Normalization + UX Enhancements

## Backend Problem & Fix

The backend `spatialCollisionAnalytics` had two issues (both fixed in `back/src/accident/charts/spatialCollisionAnalytics/spatialCollisionAnalytics.fn.ts`):

### Fix 1: Double-filtering bug
`collisionType` was added to `baseFilter` AND used in the `$cond` inside `$group`. When a user selected collision types, ALL documents already matched the filter → `selectedCollisionTypeCount === totalCount` → every zone showed 100%.

**Fix:** Collision type is now skipped in the pre-filter loop and only used inside the analytics `$group` logic.

### Fix 2: Wrong map normalization formula
Previously the map showed a per-zone percentage:

```
selected_in_zone_Z / total_in_zone_Z × 100
```

This made all zones look similar (uniform green), reducing visual discrimination.

**Fixed formula** (global normalization):

```
selected_in_zone_Z / total_selected_across_ALL_zones × 100
```

Each zone's value is now its **share of the selected collision type across all filtered zones**. Zones with higher absolute numbers show as red/high, zones with fewer show as green/low.

Implementation: the `mapData` sub-pipeline now uses `group → group → unwind → project`:

1. Group by zone → `selectedCount` per zone
2. Group all → collect zones array + `totalSelected` (sum across all zones)
3. Unwind → one doc per zone  
4. Project → `ratio = zone.selectedCount / totalSelected × 100`

## Frontend Assessment

The spatial collision page at `src/app/charts/spatial/collision-analytics/page.tsx` already has a `derivedMapChart` (`useMemo` at lines 518-535) that computes the same global-normalized ratio client-side from bar chart data. It also has `hiddenCollisionTypes` state + `handleToggleCollisionType` for legend click toggling.

**Both backend fixes correct the server-side `mapChart` response. The frontend already works correctly because it ignores `mapChart` and computes its own version from bar chart data.**

## What Needs Attention

### 1. Legend Click → Map Sync (Enhancement)

The frontend already has the mechanism:
- `hiddenCollisionTypes: Set<number>` tracks which bar chart series are hidden
- `handleToggleCollisionType(index)` toggles a type in the set
- `derivedMapChart` is a `useMemo` that recomputes zone ratios from visible types only
- Both `SpatialCollisionBarChart` and `SpatialCollisionMap` receive the computed data

**What to verify:**
- Click a legend item in the bar chart → the type hides on the bar AND the map updates instantly
- Toggling all types off → map shows 0 for all zones
- Toggling a type back on → map recalculates correctly

**Edge case**: When a type is toggled off, `grandTotal` shrinks (only visible types' counts) and remaining ratios shift. This is mathematically correct. Add a tooltip stating "percentages are relative to sum of visible collision types" to avoid confusion.

**Files to check:**
- `src/components/charts/spatial/SpatialCollisionBarChart.tsx` — verify `hidden` and `onToggle` props are wired to ApexCharts legend click
- `src/app/charts/spatial/collision-analytics/page.tsx` — verify `derivedMapChart` dependency chain

### 2. Collision Type Filter Grouping (Enhancement)

Already exists in `src/components/dashboards/ChartsFilterSidebar.tsx` (lines 396-443) via keyword matching:

```typescript
const COLLISION_TYPE_GROUPS = [
  { label: 'تصادفات عابر پیاده', keywords: ['عابر', 'پیاده'] },
  { label: 'موتورسیکلت و دوچرخه', keywords: ['موتور', 'دوچرخه'] },
  { label: 'وسایل نقلیه', keywords: ['خودرو', 'سواری', 'کامیون', 'اتوبوس', 'مینی‌بوس', 'وانت', 'ماشین'] },
];
```

**Issue**: The keyword-based approach is fragile. A collision type could match multiple groups or none (falling into "سایر").

**Suggested fix**: Replace with explicit category mappings:

```typescript
const COLLISION_TYPE_CATEGORIES: Record<string, string[]> = {
  'تصادفات عابر پیاده': [
    'برخورد وسیله نقلیه با عابر',
    'برخورد عابر پیاده با وسیله نقلیه',
    // add more as needed
  ],
  'موتورسیکلت و دوچرخه': [
    'برخورد وسیله نقلیه با موتورسیکلت',
    'واژگونی موتورسیکلت',
    'برخورد موتورسیکلت با دوچرخه',
    // add more as needed
  ],
  'تصادفات وسایل نقلیه': [
    'برخورد وسیله نقلیه با یک وسیله نقلیه',
    'برخورد از عقب',
    'برخورد روبه‌رو',
    // add more as needed
  ],
  'سقوط و واژگونی': [
    'واژگونی و سقوط',
    'خروج از جاده',
    // add more as needed
  ],
  'برخورد با شیء ثابت': [
    'برخورد وسیله نقلیه با شیء ثابت',
    // add more as needed
  ],
};
```

**Steps:**
1. Fetch the full list of collision type names from the backend (via `getCollisionTypesAction`)
2. Map each name to an appropriate category
3. Ensure coverage is complete — nothing falls into "سایر" unless truly uncategorized
4. Update the `groupCollisionTypeOptions` function to use the explicit mapping

### 3. `mapChart` Redundancy (Optional Cleanup)

The backend returns `mapChart` in the `$facet` response, but the frontend ignores it and uses `derivedMapChart` instead. This is dead server work.

- **Option A**: Remove `mapData` from the backend `$facet` to save query time
- **Option B**: Keep it for future use (PDF export, server-side rendering) — document that it's unused by the current frontend

## Files to Modify

| File | Path | What to do |
|---|---|---|
| Bar chart component | `src/components/charts/spatial/SpatialCollisionBarChart.tsx` | Wire ApexCharts legend click to `onToggle` prop; add tooltip explaining percentage reference frame |
| Chart page | `src/app/charts/spatial/collision-analytics/page.tsx` | Verify `derivedMapChart` works; optionally remove `mapChart` from response destructuring |
| Filter sidebar | `src/components/dashboards/ChartsFilterSidebar.tsx` | Replace keyword-based `COLLISION_TYPE_GROUPS` with explicit category mappings |
| Backend fn | `back/src/accident/charts/spatialCollisionAnalytics/spatialCollisionAnalytics.fn.ts` | Already fixed. Optionally remove `mapData` from `$facet`. |

## Type Definitions

From `src/types/declarations/selectInp.ts`:

- **Set**: `ReqType["main"]["accident"]["spatialCollisionAnalytics"]["set"]`
- **Get**: `ReqType["main"]["accident"]["spatialCollisionAnalytics"]["get"]` — `{ analytics: 1 }`

Response interface (in `page.tsx` lines 31-45):

```typescript
interface SpatialCollisionAnalyticsResponse {
  analytics: {
    barChart: { categories: string[]; series: Array<{ name: string; data: number[] }> };
    mapChart: Array<{ name: string; ratio: number }>;  // unused by frontend
  };
}
```

## Verification

1. Load spatial collision page → bar chart shows all types, map shows each zone's share of all types combined (ratios sum to ≈100%)
2. Click a legend item → that type hides on bar chart AND map updates instantly without re-fetching
3. Toggle multiple types on/off → map ratios recalculate correctly each time
4. Collision type filter in sidebar shows grouped options (categorical groups, not a flat list)
5. Selecting a collision type in the sidebar → re-fetches with correct data (no double-filtering — previously every zone showed 100%)
6. All map ratios stay between 0–100%
