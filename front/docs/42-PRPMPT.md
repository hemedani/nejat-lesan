# Lesan Backend API — Frontend Agent Prompt

## How to Call the API

All requests are POST to `http://localhost:1404` (or via Next.js proxy). Body structure:

```json
{
  "service": "main",
  "model": "<schema_name>",
  "act": "<act_name>",
  "details": {
    "set": { /* input parameters */ },
    "get": { /* projection fields */ }
  }
}
```

**Response format:**
```json
{ "body": { /* data */ }, "success": true }
```

**Authentication:** Set `authorization` header with Bearer JWT token for protected endpoints.

---

## 1. Data Models & Relations

### 1.1 Shared Pattern Models (27 schemas)
These follow an identical pattern — each has `{ name: string() }` + timestamps:

`air_status`, `area_usage`, `body_insurance_co`, `collision_type`, `color`, `equipment_damage`, `fault_status`, `human_reason`, `insurance_co`, `licence_type`, `light_status`, `max_damage_section`, `motion_direction`, `plaque_type`, `plaque_usage`, `position`, `road_defect`, `road_repair_type`, `road_situation`, `road_surface_condition`, `ruling_type`, `shoulder_status`, `system`, `system_type`, `type`, `vehicle_reason`, `event`

All have a `registrer` → `user` (single, optional) relation.

### 1.2 Geographic / Hierarchical Schemas

| Model | Pure Fields (notable) | Relations (key) |
|-------|----------------------|-----------------|
| **province** | name, english_name, population, area (MultiPolygon), center_location (Point) | registrer → user |
| **city** | name, english_name, population, area (MultiPolygon), center_location (Point) | registrer → user, **province** → province (single) |
| **township** | name, english_name, population, area (MultiPolygon), center_location (Point) | registrer → user, **province** → province (single) |
| **road** | name, area (MultiLineString) | registrer → user, **province** → province (single) |
| **traffic_zone** | name, area (MultiPolygon), population | registrer → user (NO province or city relation) |
| **city_zone** | name, area (MultiPolygon), population | registrer → user, **city** → city (single) |

### 1.3 user
Pure fields: first_name, last_name, father_name, mobile, gender, birth_date?, summary?, national_number, address, **level** (Ghost/Manager/Editor/Enterprise), is_verified, **settings** (cities[], provinces[], availableCharts{})
Relations: avatar → file (single), national_card → file (single)
Index: national_number (unique)

### 1.4 accident (most complex)

**Pure fields:** seri, serial, location (Point), date_of_accident, dead_count, has_witness, news_number, officer, injured_count, completion_date

**Embedded arrays:**
- `vehicle_dtos`: array of { color, driver{sex, last_name, first_name, injury_type, licence_type, national_code, licence_number?, total_reason?}, system, plaque_type, plaque_no[t3], system_type, fault_status, insurance_co, insurance_no, plaque_usage, print_number, plaque_serial?, insurance_date, body_insurance_co, body_insurance_no?, motion_direction, body_insurance_date, max_damage_sections[], damage_section_other, insurance_warranty_limit, passenger_dtos[]? }
- `pedestrian_dtos`: array of { sex, last_name, first_name, injury_type, fault_status, total_reason?, national_code }

**Relations (22, all optional):**
`province`, `city`, `township`, `road`, `traffic_zone`, `city_zone`, `type`, `position`, `ruling_type`, `collision_type`, `road_situation`, `road_repair_type`, `shoulder_status` (all single)
`area_usages`, `air_statuses`, `road_defects`, `human_reasons`, `vehicle_reasons`, `equipment_damages`, `road_surface_conditions`, `attachments` → file (all multiple)

Index: `location: "2dsphere"`

### 1.5 Other Models

| Model | Fields | Relations |
|-------|--------|-----------|
| **file** | name, type, size | uploader → user (required) |
| **vehicle** | plaque_no[t3] | registrer → user, color, plaque_type, system_type |
| **driver** | sex, lastName, firstName, injuryType, licenceType, nationalCode, licenceNumber, totalReason | (none) |
| **person** | person_type(enum), sex, national_code, first_name, last_name, licence_number | registrer → user, licence_type |
| **event** | name, description, dates[{from, to, startEntireRange, endEntireRange}] | registrer → user |
| **event_process** | caption, start_date, end_date | registrer → user |
| **police_station** | name, location(Polygon), area(MultiPolygon), code, is_active, military_rank | registrer → user, commander → user |
| **location_area** | caption, in_native_area, area(Polygon) | registrer → user, province, city, axes |
| **country** | name, description?, area[[num,num]] | registrer → user |

---

## 2. CRUD Endpoints per Schema

### 2.1 Standard CRUD (all 27 shared-pattern schemas + geographic schemas)

Each schema has these acts:

| Act | Method | Auth | Description |
|-----|--------|------|-------------|
| `add` | POST | Manager | Create a new document. Get: `selectStruct(<model>, 1)` |
| `get` | POST | public | Get single document by `_id`. Get: `selectStruct(<model>, 2)` |
| `gets` | POST | public | Paginated list. Params: `page`, `limit`, `name?`, `names?`. Get: `selectStruct(<model>, 2)` |
| `update` | POST | Manager | Update document. Params: `_id`, `name?` |
| `remove` | POST | Manager | Delete. Params: `_id`, `hardCascade?` |
| `count` | POST | Manager | Count documents. Params: `name?` |

**Geographic schemas with extended gets filters:**

| Schema | Extra gets params |
|--------|------------------|
| **province** | `_ids?: ObjectId[]` |
| **city** | `provinceIds?: ObjectId[]`, `_ids?: ObjectId[]` |
| **road** | `provinceIds?: ObjectId[]` |
| **city_zone** | `cities?: ObjectId[]`, `cityNames?: string[]`, `provinceIds?: ObjectId[]` |

### 2.2 Special Acts (non-standard)

| Schema | Act | Auth | Description |
|--------|-----|------|-------------|
| city | `updateCityRelations` | Ghost/Manager | Update city's province via `addRelation` |
| city_zone | `seedCityZones` | Manager | Populate from GeoJSON |
| township | `seedTownships` | Manager | Populate from GeoJSON, link accidents via $geoWithin |
| accident | `removeByCreatedAt` | Manager/Enterprise | Delete within time window |
| accident | `getCreatedAtPeriods` | Manager/Enterprise | Group by time intervals |
| accident | `mapAccidents` | Manager | Paginated map data with $geoWithin polygon support |
| file | `uploadFile` | Authenticated | Upload via FormData, supports video/image/doc/geo/json/rar |
| file | `getFiles` | Authenticated | List files, filter by name/type |
| user | `addUser` | Manager | Create user with level, settings |
| user | `getUser` | Manager/Examiner | Single user by `_id` |
| user | `getUsers` | Manager/Editor | List users, optional `levels` filter |
| user | `getMe` | Authenticated | Current user from JWT |
| user | `updateUser` | Manager | Update user fields |
| user | `updateUserRelations` | Ghost/Manager | Update avatar/nationalCard |
| user | `removeUser` | Manager | Delete user |
| user | `countUsers` | Manager | Count, optional `levels` filter |
| user | `loginReq` | Public | Send verification code |
| user | `login` | Public | Verify code, get JWT token |
| user | `registerUser` | Public | Register new "Driver" level user |
| user | `changeMobile` | Public | Change mobile number |
| user | `tempUser` | Public | First-run setup (creates Ghost user) |
| user | `dashboardStatistic` | Manager | Count docs across all collections |
| user | `seed` | Manager | Bulk import accidents from JSON |

### 2.3 Accident CRUD — Extended Filters

The `accident/gets` and `accident/count` endpoints support ~100 filter parameters. See Section 4 for the complete filter reference.

---

## 3. Accident Analytics Charts (25 endpoints)

All under schema `"accident"`, require `Manager` level. Most use a shared ~90-parameter filter set.

### 3.1 Chart Endpoint Index

| Act Name | Response Keys | Description |
|----------|---------------|-------------|
| `accidentSeverityAnalytics` | analytics | Severity distribution (fatal/injury/damage counts) |
| `areaUsageAnalytics` | analytics | Land-use distribution |
| `collisionAnalytics` | mainChart, singleVehicleChart, otherTypesChart | 3-chart collision breakdown |
| `companyPerformanceAnalytics` | analytics | Bubble chart — manufacturer performance (severe only) |
| `eventCollisionAnalytics` | analytics{eventData, nonEventData} | Collision share during events vs. non-events |
| `eventSeverityAnalytics` | analytics | Severity share during events vs. non-events |
| `hourlyDayOfWeekAnalytics` | series | 7x24 heatmap |
| `humanReasonAnalytics` | analytics | Top 8 human reasons treemap |
| `monthlyHolidayAnalytics` | categories, series | Monthly counts, holiday vs. non-holiday |
| `roadDefectsAnalytics` | defectDistribution, defectCounts | Road defect impact |
| `roadDefectsAnalyticsFnWithCount` | defectDistribution, defectCounts | Simplified variant |
| `spatialCollisionAnalytics` | analytics{barChart, mapChart} | Collision by city_zone |
| `spatialLightAnalytics` | analytics{barChart, mapChart} | Light conditions by city_zone |
| `spatialSafetyIndexAnalytics` | analytics{barChart, mapChart} | Safety index (requires `groupBy`: province/city/city_zone) |
| `spatialSeverityAnalytics` | analytics{barChart, mapChart} | Severity by city_zone |
| `spatialSingleVehicleAnalytics` | analytics{barChart, mapChart} | Single-vehicle by city_zone |
| `temporalCollisionAnalytics` | analytics{categories, series} | Monthly collision type share |
| `temporalCountAnalytics` | analytics{categories, series} | Monthly accident counts |
| `temporalDamageAnalytics` | analytics{categories, series} | Monthly damage section share |
| `temporalNightAnalytics` | analytics{categories, series} | Monthly nighttime accidents |
| `temporalSeverityAnalytics` | analytics{categories, series} | Monthly fatality share among severe (fatal/total_severe %) |
| `temporalTotalReasonAnalytics` | analytics{categories, series} | Monthly top-10 ultimate causes |
| `temporalUnlicensedDriversAnalytics` | analytics{categories, series} | Monthly unlicensed driver count |
| `totalReasonAnalytics` | analytics | Top 10 ultimate causes treemap (severe only) |
| `vehicleReasonAnalytics` | analytics | Vehicle reasons pie + bar (severe only) |

### 3.2 Endpoints with Restricted Filter Sets

`eventCollisionAnalytics`, `eventSeverityAnalytics` — use a reduced filter set + `eventId: ObjectId`.
`spatialSafetyIndexAnalytics` — full filters + required `groupBy: enums(["province", "city", "city_zone"])`.

### 3.3 Collision Type Name (⚠️ Critical)

The DB stores collision types using Persian names. **Watch for Unicode variants** — hamza (ء) vs. no hamza:
- ✅ **Correct (DB value):** `"برخورد وسیله نقلیه با شی ثابت"` (WITHOUT hamza)
- ❌ **Will NOT match:** `"برخورد وسیله نقلیه با شیء ثابت"` (WITH hamza)

Always fetch the full list from the backend (`collision_type/gets`) and use exact values from the response.

---

## 4. Complete Filter Reference (Shared across analytics + accident/gets + accident/count)

### 4.1 Core Accident Fields (scalar)

| Key | Type | Notes |
|-----|------|-------|
| `seri` | number | Exact match |
| `serial` | number | Exact match |
| `dateOfAccidentFrom` | ISO string | Start of date range |
| `dateOfAccidentTo` | ISO string | End of date range |
| `deadCount` | number | Exact match |
| `deadCountMin` | number | Lower bound |
| `deadCountMax` | number | Upper bound |
| `injuredCount` | number | Exact match |
| `injuredCountMin` | number | Lower bound |
| `injuredCountMax` | number | Upper bound |
| `hasWitness` | `"true"` / `"false"` | String boolean |
| `newsNumber` | number | Exact match |
| `officer` | string | Partial regex match |
| `completionDateFrom` | ISO string | |
| `completionDateTo` | ISO string | |

### 4.2 Location & Context (array of string — multi-select, matched by `name`)

`province`, `city`, `road`, `trafficZone`, `cityZone`, `accidentType` (= severity type), `position`, `rulingType`, `lightStatus`, `collisionType`, `roadSituation`, `roadRepairType`, `shoulderStatus`

### 4.3 GeoJSON Spatial Filter

| Key | Type | Notes |
|-----|------|-------|
| `polygon` | GeoJSON Polygon | Uses `$geoIntersects` (reserved for future use in most endpoints) |

### 4.4 Environmental & Reasons (array of string — multi-select, matched by `name`)

`areaUsages`, `airStatuses`, `roadDefects`, `humanReasons`, `vehicleReasons`, `equipmentDamages`, `roadSurfaceConditions`

### 4.5 Attachments

`attachmentName` (string, regex), `attachmentType` (string, exact)

### 4.6 Vehicle DTO Filters (applied via `$elemMatch` on `vehicle_dtos`)

**Array multi-select (by `.name`):** `vehicleColor`, `vehicleSystem`, `vehiclePlaqueType`, `vehicleSystemType`, `vehicleFaultStatus`, `vehicleInsuranceCo`, `vehiclePlaqueUsage`, `vehicleBodyInsuranceCo`, `vehicleMotionDirection`, `vehicleMaxDamageSections`

**Exact string:** `vehicleInsuranceNo`, `vehiclePrintNumber`, `vehiclePlaqueSerialElement`, `vehicleBodyInsuranceNo`, `vehicleDamageSectionOther`

**Date range:** `vehicleInsuranceDateFrom`, `vehicleInsuranceDateTo`, `vehicleBodyInsuranceDateFrom`, `vehicleBodyInsuranceDateTo`

**Numeric:** `vehicleInsuranceWarrantyLimit` (exact), `vehicleInsuranceWarrantyLimitMin`, `vehicleInsuranceWarrantyLimitMax`

### 4.7 Driver in Vehicle DTO (via `$elemMatch`)

**Array multi-select:** `driverSex`, `driverLicenceType`, `driverInjuryType`, `driverTotalReason`

**Text:** `driverFirstName` (regex), `driverLastName` (regex), `driverNationalCode` (exact), `driverLicenceNumber` (exact)

### 4.8 Passenger in Vehicle DTO (via `$elemMatch`)

**Array multi-select:** `passengerSex`, `passengerInjuryType`, `passengerFaultStatus`, `passengerTotalReason`

**Text:** `passengerFirstName` (regex), `passengerLastName` (regex), `passengerNationalCode` (exact)

### 4.9 Pedestrian DTO (via `$elemMatch` on `pedestrian_dtos`)

**Array multi-select:** `pedestrianSex`, `pedestrianInjuryType`, `pedestrianFaultStatus`, `pedestrianTotalReason`

**Text:** `pedestrianFirstName` (regex), `pedestrianLastName` (regex), `pedestrianNationalCode` (exact)

---

## 5. Important Behavioral Notes

### 5.1 Default Date Ranges

| Endpoint Type | Default |
|---------------|---------|
| CRUD `accident/gets` (no date filter in standard gets) | No default — returns all |
| Most analytics charts | Last full Jalali year |
| Temporal analytics (count, severity, collision, etc.) | Last 3 Jalali years |
| `accident/mapAccidents` | Last full Jalali year |

### 5.2 Severity-Restricted Analytics

These endpoints internally filter to **severe accidents only** (`type.name` IN ["فوتی", "جرحی"]):
- `companyPerformanceAnalytics`
- `temporalSeverityAnalytics`
- `totalReasonAnalytics`
- `vehicleReasonAnalytics`

### 5.3 Special Purpose Endpoints

| Endpoint | Restriction |
|----------|-------------|
| `temporalNightAnalytics` | Only analyzes lighting conditions "شب با روشنایی کافی" and "شب با نور ناکافی" |
| `temporalUnlicensedDriversAnalytics` | Only accidents with at least one unlicensed driver (licence_type.name = "فاقد گواهینامه") |
| `spatialSingleVehicleAnalytics` | Only collision types: "برخورد وسیله نقلیه با شی ثابت", "واژگونی و سقوط", "خروج از جاده" |
| `humanReasonAnalytics` | Excludes "ندارد" (None) reason from results |
| `spatialSeverityAnalytics` | If no city selected, defaults to user's settings city or "اهواز" |

### 5.4 Collision Analytics Categorization

The `collisionAnalytics` endpoint maps collision types into these groups:
- **تک وسیله‌ای** (Single vehicle): "برخورد وسیله نقلیه با شی ثابت" + "واژگونی و سقوط" + "خروج از جاده"
- **دو وسیله‌ای** (Two vehicle): "برخورد وسیله نقلیه با یک وسیله نقلیه"
- **وسیله نقلیه با عابر** (With pedestrian): "برخورد وسیله نقلیه با عابر" + "بر خورد موتورسیکلت با عابر" + "برخورد دوچرخه با عابر"
- **وسیله نقلیه با موتور سیکلت** (With motorcycle): "برخورد وسیله نقلیه با موتورسیکلت"
- **چند وسیله‌ای** (Multi-vehicle): "برخورد وسیله نقلیه با چند وسیله نقلیه" + "چند برخوردی"
- **سایر موارد** (Other): Everything else

### 5.5 Dead/Injured Count Filtering

When **both** `deadCountMin`/`deadCountMax` AND `injuredCountMin`/`injuredCountMax` filters are active, the backend combines them with MongoDB `$or` — an accident passes if it satisfies **either** the dead count condition **or** the injured count condition. (Fixed to prevent overly restrictive AND behavior.)

### 5.6 `temporalCollisionAnalytics` Percentage Calculation

The percentage for each collision type is computed as: `type_count / total_matching_all_filters * 100`. The denominator includes ALL accidents matching the user's filters (city, date, etc.), not just the selected collision types. This means percentages for the 5 selected types will not sum to 100%. If you need percentages relative to selected types only, compute client-side.

### 5.7 `collisionAnalytics` Single-Vehicle Name

⚠️ The DB stores collision types **without** the hamza (ء):
- **DB value:** `"برخورد وسیله نقلیه با شی ثابت"` (no ء)
- Always use this exact string when filtering or displaying single-vehicle collision types.

---

## 6. User Levels (Authorization)

| Level | Description |
|-------|-------------|
| `Ghost` | Unregistered/limited access |
| `Manager` | Full access to CRUD and analytics |
| `Editor` | Read access to users |
| `Enterprise` | Manager access + restricted to assigned cities/provinces via `settings` field |

Level is stored as `user.level` (enum). Most analytics endpoints require `Manager` level. Auth middleware checks `grantAccess` with required level.

---

## 7. API Request Template

```typescript
// TypeScript types are auto-generated. Import via:
// ReqType["main"]["<schema>"]["<actName>"]["set"]
// ReqType["main"]["<schema>"]["<actName>"]["get"]

const response = await fetch("http://localhost:1404", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    service: "main",
    model: "<schema>",
    act: "<actName>",
    details: {
      set: { /* parameters */ },
      get: { /* projection — use 1 to include, 0 to exclude */ },
    },
  }),
});

const { body, success } = await response.json();
```

For analytics charts, projection is typically `{ analytics: 1 }` (or the specific response key).

Example — get accidents:
```json
{
  "service": "main",
  "model": "accident",
  "act": "gets",
  "details": {
    "set": { "page": 1, "limit": 20, "city": ["همدان"] },
    "get": { "_id": 1, "seri": 1, "serial": 1, "date_of_accident": 1, "type": { "name": 1 }, "city": { "name": 1 } }
  }
}
```

Example — severity analytics:
```json
{
  "service": "main",
  "model": "accident",
  "act": "temporalSeverityAnalytics",
  "details": {
    "set": { "city": ["همدان"], "dateOfAccidentFrom": "2024-03-20T00:00:00Z", "dateOfAccidentTo": "2025-03-20T00:00:00Z" },
    "get": { "analytics": 1 }
  }
}
```

---

## 8. Response Structures by Endpoint Type

### CRUD gets — returns array of documents
```json
{ "body": [{ "_id": "...", "name": "...", ... }], "success": true }
```

### CRUD count — returns `{ qty: number }`
```json
{ "body": { "qty": 1234 }, "success": true }
```

### Analytics (most) — returns `{ analytics: { categories, series } }`
```json
{
  "body": {
    "analytics": {
      "categories": ["1403-01", "1403-02", ...],
      "series": [{ "name": "برخورد وسیله نقلیه با یک وسیله نقلیه", "data": [15.2, 5.6, ...] }]
    }
  },
  "success": true
}
```

### Spatial analytics — returns `{ analytics: { barChart, mapChart } }`
```json
{
  "body": {
    "analytics": {
      "barChart": { "categories": ["منطقه 1", "منطقه 2", ...], "series": [{ "name": "...", "data": [...] }] },
      "mapChart": [{ "name": "منطقه 1", "ratio": 12.5 }, ...]
    }
  },
  "success": true
}
```

### collisionAnalytics — 3 separate chart arrays
```json
{
  "body": {
    "mainChart": [{ "name": "تک وسیله‌ای", "count": 470 }, ...],
    "singleVehicleChart": [{ "name": "برخورد وسیله نقلیه با شی ثابت", "count": 335 }, ...],
    "otherTypesChart": [{ "name": "...", "count": 65 }, ...]
  },
  "success": true
}
```

### hourlyDayOfWeekAnalytics — heatmap grid
```json
{
  "body": {
    "series": [{ "name": "Saturday", "data": [0, 23, 45, ...] }, ...]
  },
  "success": true
}
```

### roadDefectsAnalytics — dual chart
```json
{
  "body": {
    "defectDistribution": [{ "name": "روسازی خراب", "count": 450 }, ...],
    "defectCounts": { "accidentsWithDefect": 1200, "accidentsWithoutDefect": 5400 }
  },
  "success": true
}
```

---

## 9. Jalali Calendar

All date-related analytics use the **Jalali (Solar Hijri) calendar**. Categories are formatted as `"jYYYY-jMM"` (e.g., `"1403-06"`). The backend uses `jalali-moment` for conversion. The frontend should display dates in Persian (Jalali) format.

Default date ranges in analytics:
- Most charts: Last full Jalali year (`now.jYear() - 1`)
- Temporal endpoints: Last 3 Jalali years (`now.jYear() - 3`)
