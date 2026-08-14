# 46-Chart Filters & User Settings: `airPollutionZone` Support — for frontend AI agent

> **Scope**: This document describes the backend changes that add the **`airPollutionZone`** filter to every analytics chart and to the Enterprise **user `settings.availableCharts`** permission config. It supersedes §8.4 of `45-TRAFFIC_AND_AIR_POLLUTION_LAYERS.md` (which said the filter was NOT yet implemented backstage — now it **is** implemented). All types are already regenerated and synced into `front/src/types/declarations/selectInp.ts`.

## 1. What changed (backend summary)

| Change | Files |
|---|---|
| `airPollutionZone` multiselect added to every chart validator | all 24 `src/accident/charts/**/*.val.ts` |
| `airPollutionZone` → `"air_pollution_zone.name"` mapping added to every chart fn | all 24 `src/accident/charts/**/*.fn.ts` |
| `airPollutionZone` added to the map accident act | `src/accident/maps/mapAccidents/*.val.ts` + `*.fn.ts` |
| `airPollutionZone` flag added to every `*AnalyticFilters` used by `user.settings.availableCharts` | `back/models/utils/accidentFilters.ts` |
| Declarations regenerated + synced to frontend | `back/declarations/selectInp.ts`, `front/src/types/declarations/selectInp.ts` |

**No behavioral change for Manager/Editor/Ghost users** — the new filter is just one more optional key; not providing it behaves exactly as before.

## 2. The new filter key & its DB path

- **Frontend key (camelCase):** `airPollutionZone`
- **Validator type:** `array(string())` → values are **zone names** (Persian), multi-select
- **DB field:** `air_pollution_zone.name` (the embedded single relation on `accident`)

```ts
// Request shape (identical to trafficZone / cityZone)
set: {
  ...
  airPollutionZone: ["طرح آلودگی"], // optional, $in over air_pollution_zone.name
}
```

The matching query produced server-side is `{ "air_pollution_zone.name": { $in: [...] } }` — same pattern as `trafficZone`/`cityZone`.

## 3. Where the filter now exists (complete list)

Every chart that previously exposed `trafficZone` + `cityZone` now ALSO exposes `airPollutionZone` in the same block (right after `cityZone`):

1. `accidentSeverityAnalytics`
2. `areaUsageAnalytics`
3. `collisionAnalytics`
4. `companyPerformanceAnalytics`
5. `eventCollisionAnalytics`
6. `eventSeverityAnalytics`
7. `hourlyDayOfWeekAnalytics`
8. `humanReasonAnalytics`
9. `monthlyHolidayAnalytics`
10. `roadDefectsAnalytics`
11. `spatialCollisionAnalytics`
12. `spatialLightAnalytics`
13. `spatialSafetyIndexAnalytics`
14. `spatialSeverityAnalytics`
15. `spatialSingleVehicleAnalytics`
16. `temporalCollisionAnalytics`
17. `temporalCountAnalytics`
18. `temporalDamageAnalytics`
19. `temporalNightAnalytics`
20. `temporalSeverityAnalytics`
21. `temporalUnlicensedDriversAnalytics`
22. `temporalTotalReasonAnalytics`
23. `totalReasonAnalytics`
24. `vehicleReasonAnalytics`

Plus one non-chart analytics act:
25. `mapAccidentsAnalytics` (the map act in `src/accident/maps/mapAccidents/`)

The throwaway `roadDefectsAnalyticsWithCount` performance-test act was **left untouched** (its validator is only `{ province, city, polygon, dateRange }` — it has no zone filters at all).

## 4. Chart filter implementation patterns (for reference)

Each chart fn applies the filter via a key→path map. All 25 acts now contain an `airPollutionZone` entry:

```ts
// object-map style (24 charts + mapAccidents) — auto-applied by the $in loop
const contextFields: Record<string, string> = {
  province: "province.name",
  city: "city.name",
  trafficZone: "traffic_zone.name",
  cityZone: "city_zone.name",
  airPollutionZone: "air_pollution_zone.name", // NEW
  ...
};

for (const [filterKey, dbPath] of Object.entries(contextFields)) {
  const value = filters[filterKey as keyof typeof filters];
  if (Array.isArray(value) && value.length > 0) {
    baseFilter[dbPath] = { $in: value };
  }
}
```

```ts
// {key,path} array style (roadDefectsAnalytics) — same $in loop
const locationFields = [
  { key: "trafficZone", path: "traffic_zone.name" },
  { key: "cityZone", path: "city_zone.name" },
  { key: "airPollutionZone", path: "air_pollution_zone.name" }, // NEW
  ...
];
```

Because the maps are iterated generically, **no other change was needed** in the aggregation pipelines.

## 5. User `settings.availableCharts` permission flags

`models/user.ts` builds Enterprise user permissions from `back/models/utils/accidentFilters.ts` (the `availableCharts` object at `models/user.ts:49-85`). Each chart's filter set is dotted with **booleans** — `true` = that Enterprise user is allowed to use that filter on that chart. Changes made:

| Filter object | What was added |
|---|---|
| `locationAndContextFilterObj` (base block, feeds **all** charts via `comprehensiveAnalyticsFiltersObj`) | `airPollutionZone` |
| `eventCollisionAnalyticFilters` | `trafficZone`, `cityZone`, `airPollutionZone` (previously ALL zone toggles were missing here!) |
| `eventSeverityAnalyticFilters` | `trafficZone`, `cityZone`, `airPollutionZone` |
| `mapAccidentsAnalyticFilters` | `airPollutionZone` |

Every chart that can actually filter by a zone now also has the corresponding permission toggle, so a Manager can grant/deny zone filtering per chart in the user-creation form.

> The `settings.provinces` / `settings.cities` arrays (geo-scope restriction) were deliberately **NOT** extended with `city_zones`/`traffic_zones`/`air_pollution_zones` (decision made during review). Scope restriction remains at province/city granularity only.

## 6. Authorization flow (unchanged, for context)

`utils/authorization.ts:checkEnterpriseChartAccess` still works the same way:
- For **Enterprise** users, every requested filter key is checked against `user.settings.availableCharts[chartName]`; a key that is missing or `false` → `unauthorizedFilters` → the request is rejected with `Unauthorized access to filters: [...] for chart: X`.
- Because the flag objects now include `airPollutionZone`, Enterprise users granted it can use the filter; users without it **cannot** (the chart request will be rejected server-side even if the frontend sends it).

## 7. Generated types (already synced in both repos)

`front/src/types/declarations/selectInp.ts` and `back/declarations/selectInp.ts` now contain:

- `airPollutionZone?: string[]` in every chart act's `set` (24 charts + map)
- `airPollutionZone?: boolean` in every `availableCharts.<chartName>` filter object (user add/update `set`)
- `trafficZone?`, `cityZone?`, `airPollutionZone?` now present in `eventCollisionAnalytics`, `eventSeverityAnalytics`, and `mapAccidentsAnalytics` permission objects

Quick verification: `grep -c "airPollutionZone" front/src/types/declarations/selectInp.ts` → **125**.

## 8. Frontend work (NOT done — your job)

### 8.1 Chart filter constants (recommended)
`front/src/utils/filterConstants.ts` defines the per-chart permission schemas and the Persian field list:
- `locationAndContextFilterObj` (line ~22) → add `airPollutionZone: z.boolean().optional(),` after `cityZone`.
- `comprehensiveFilterFields` array (line ~405) → add an entry **after** the `cityZone` entry so the admin permission UI shows a checkbox for it:
  ```ts
  { key: "airPollutionZone", label: "منطقه آلودگی هوا" },
  ```
- Mirror the same addition in `ALL_ANALYTIC_FILTERS`-consuming forms if any define their own field lists.

### 8.2 User-create / user-update permission forms
Both forms reference the constants, so they pick up the new checkbox automatically once 8.1 is done:
- `front/src/components/template/FormCreateUser.tsx` (schema at line ~49 uses `ALL_ANALYTIC_FILTERS.*`)
- `front/src/components/template/FormCreateUserUpdated.tsx` (same pattern)
- `front/src/components/organisms/user/EditUserPures.tsx` (same pattern)
- `front/src/components/template/ChartStep.tsx` (renders per-chart checkboxes from `formData.availableCharts[chartType]`)

Verify there isn't a **hard-coded** list of filter keys in any of these that needs the new key appended (grep for `trafficZone` inside them).

### 8.3 Chart filter panels (UI dropdowns)
The chart pages already build dropdown/checkbox filters from the generated `ReqType` `set` types or from a shared filter-field config. To let users actually **pick** an air-pollution zone:
- Find where `trafficZone` and `cityZone` dropdowns are populated (fetch zone lists via `air_pollution_zone/gets` / `traffic_zone/gets` / `city_zone/gets`) and add `airPollutionZone` alongside them.
- Labels should follow the geo hierarchy: **استان ← شهر ← منطقه آلودگی هوا**.

### 8.4 Enterprise permission UI verification
Because the permission checboxes are data-driven from `comprehensiveFilterFields`, after 8.1 a Manager can grant/deny `airPollutionZone` per chart. Optional: surface the granted zone filters in the permission summary text.

## 9. Sample requests

### Chart with air-pollution-zone filter
```ts
await AppApi().send({
  service: "main",
  model: "accident",
  act: "temporalCountAnalytics", // or any of the 24 chart acts
  details: {
    set: {
      dateOfAccidentFrom: "1402-01-01",
      dateOfAccidentTo: "1405-01-01",
      city: ["تهران"],              // optional co-filter
      airPollutionZone: ["طرح آلودگی"], // NEW
    },
    get: { analytics: 1 },
  },
}, { token });
```

### Grant airPollutionZone to an Enterprise user (update)
```ts
await AppApi().send({
  service: "main",
  model: "user",
  act: "updateUser",
  details: {
    set: {
      _id: "<userId>",
      availableCharts: {
        temporalCountAnalytics: {
          province: true,
          city: true,
          trafficZone: true,
          cityZone: true,
          airPollutionZone: true, // NEW
        },
      },
    },
    get: { _id: 1, availableCharts: 1 },
  },
}, { token });
// Note: unknown/omitted filters are treated as DENIED server-side
```

## 10. Gotchas for the frontend agent

1. **Requires `airPollutionZone: true` in the Enterprise permission object**, otherwise the chart/server–side `checkEnterpriseChartAccess` will reject the request with `Unauthorized access to filters: [airPollutionZone]`. This is the biggest silent-failure trap.
2. **Filter values are names, not `_id`s** — e.g. `["طرح آلودگی"]`, exactly like `trafficZone`/`cityZone`. Do not send ObjectIds.
3. **Event charts** (`eventCollisionAnalytics`, `eventSeverityAnalytics`) previously had NO zone toggles at all in the permission config; now they have all three (`trafficZone`, `cityZone`, `airPollutionZone`). Their `.val.ts`/`.fn.ts` already supported the filters; only the permission flags were missing — now fixed.
4. **`spatialSafetyIndexAnalytics` `groupBy`** only accepts `"province" | "city" | "city_zone"` — it does **not** support grouping by traffic/air-pollution zone. The `airPollutionZone` **filter** works there, but grouping stays as-is.
5. **Declarations are already regenerated and copied** — do not hand-edit `front/src/types/declarations/selectInp.ts`. If you regenerate from the backend later, re-copy the whole file (it is identical to `back/declarations/selectInp.ts`).
6. **`roadDefectsAnalyticsWithCount`** (`roadDefectsAnalyticsFnWithCount`) is a performance-test stub with no zone filters — ignore it; it is not in the navigation/permission config.
7. Only **`availableCharts`** gained zone flags; **`settings.provinces`/`settings.cities` scope restriction was not extended** to zones (deliberate). `cityAuthorization.ts` still restricts only province/city gets.