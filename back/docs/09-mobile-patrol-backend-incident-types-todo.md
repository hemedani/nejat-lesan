# TODO — Non-Accident Incident Types (Backend) + Organizational Structure + Professional Warehousing + Accident Reporting Process Builder

Implementation backlog for the **backend** of four coordinated workstreams:

1. **Non-accident incident types** (§1–§9): the three tiles the mobile patrol app gates behind «به‌زودی» — **خرابی آزادراه** (road breakdown), **مانع یا خطر در مسیر** (road obstacle/hazard), **سایر رخدادها** (other events).
2. **Complete organizational structure** (Part II): each highway becomes an **organization** that owns its own **unit tree / org chart** — **including the patrol units and patrol officers** — replacing the current flat, unconnected `patrol_unit`/`police_station` records.
3. **Professional warehousing incl. JIT** (Part III): a full catalog + stock + movement + JIT-replenishment domain (porting the author's completed Satek warehousing project).
4. **Org-scoped accident reporting process builder** (Part IV): each organization designs its **own accident registration/reporting process** for its patrol units — multi-step wizard where steps carry **icons + descriptions** and each question **calls a database model** while showing only a **chosen subset of that model's records** as answers (a 50-record model → only the 3 selected appear).

Scope: **backend only**. The mobile ungate + per-type form/mapper is a separate follow-up (see §8). The authoritative product intent for the incident types is in `01-mobile-patrol-app-requirements-fa.md` line 103 and the mobile Design doc §9.4. **Prior-art reference for Parts II–IV** (read these before starting): `/Users/syd/work/sitak/lesanSatek/back` (models + `src/*`) and `/Users/syd/work/sitak/lesanSatek/front/backDocs` (design docs; key ones: `02-workflow_instructions.md`, `06-new_role_management.md`, `26-consumption-inventory-warehouse-finalization.md`, `32-unit-getOrgChart-api.md`, `33-warehouse-hierarchy-models-and-multi-select-dropdown.md`).

## Status legend

- `[x]` verified complete
- `[-]` in progress or blocked
- `[ ]` not started
- `[?]` requires a product/backend decision

## Read this first — architecture decision

The three new types are **patrol field reports**, not new domains. They share the entire accident offline-first machinery:

| Concern | Where it lives today (all reusable) |
| --- | --- |
| Offline-first sync | `accident.client_report_uuid` (unique sparse index), `sync_status`, `rejection_reason` |
| Patrol meta | `officer` (relation + immutable `officer` string snapshot), `patrol_unit`, `vehicle`, `reported_at`, `gps_coords`, `gps_accuracy`, `travel_direction`, `kilometer`, `meter`, `location` GeoJSON Point |
| Review lifecycle | `review_status`, `review_reason`, `reviewed_at`, `completed_at`, embedded `review_history` |
| Identity | `serial`, auto-generated `report_id` |
| Media | `attachments` relation + `file.uploadAccidentImages` |
| Scoping/auth | `getMyReports`, `getSyncStatus`, `reportScope.ts`, `update` ownership checks, Patrol draft/queued-only enforcement |
| Route/zone | `road` + `lane` relations, `snapPointToRoad`, `validatePointInZone` |

**Option A (recommended) — one polymorphic report model.** Add an `incident_type` discriminator + a small `incident_payload` struct to the existing `accident` model, and reuse every existing act. Accident-specific DTOs (`vehicle_dtos`, `people_dtos`, `facility_damage_dtos`, `collision_type`, `type` severity) remain optional and are simply empty for non-accident reports. Backward compatible: legacy docs have no `incident_type` → they are accidents.

**Option B (rejected) — new model per type** (e.g. `road_breakdown`, `road_obstacle`). Clean isolation but duplicates the patrol-meta, sync/idempotency, review, media, and scoping machinery per model; the mobile queue/reports/mapper would need to merge multiple collections. Not worth it for three fields of differentiation.

**Decision to make up front:** `incident_type` as a fixed enum vs. a reference model. The product list in the requirements is open-ended («تصادف، خرابی آزادراه، مانع در مسیر، حریق، نقص تجهیزات و...»). Recommendation: ship the **enum** (`accident | road_breakdown | road_obstacle | other`) now because the sync/report_id/validation logic branches on it (code-level behavior, not just labels), and promote to a reference model later if product adds types that need distinct *behavior* rather than just a label.

---

## 1. Model changes — `back/models/accident.ts`

- [x] Add `incident_type` to `accident_pure`:
  ```ts
  incident_type: optional(enums(["accident", "road_breakdown", "road_obstacle", "other"])),
  ```
  (Server-side default `accident` when absent — Lesan `insertOne` does **not** apply `defaulted` defaults, set it explicitly in `add.fn`, mirroring the existing `sync_status`/`review_status` handling.)
- [x] Add `incident_payload` (pure scalars only; references stay top-level relations):
  ```ts
  incident_payload: optional(object({
    description: optional(string()),        // شرح خرابی/مانع/رخداد
    is_hazard: optional(boolean()),         // آیا خطر جانی/تصادف دارد؟
    needs_repair: optional(boolean()),      // نیاز به تعمیر دارد؟
    temporary_action: optional(string()),   // اقدام موقت انجام‌شده
    follow_up_required: optional(boolean()),// نیاز به پیگیری/نیروی اعزامی
  })),
  ```
- [x] Add `incident_severity` single relation → **`incident_severity`** (new model; D1 decided new model). Reverse `accidents` relation on `incident_severity` declared.
- [x] Document that existing top-level relations are **reused for non-accident semantics** (no schema duplication):
  - `road_defects` (multiple → `road_defect`) — the خرابی/مانع subject
  - `equipment_damages` (multiple → `equipment_damage`) — نقص تجهیزات
  - `lane` (single → `position`) — affected lane
  - `road`, `kilometer`, `meter`, `travel_direction` — linear referencing (unchanged)
  - `attachments` — photos of the incident
- [x] D1 resolved to a **new** `incident_severity` model: created `models/incident_severity.ts` (shared-relation pattern, `registrer` relation), exported from `models/mod.ts`, instantiated in `mod.ts`, registered via `setSharedActs`, added to the seed map.
- [x] Confirmed the 2dsphere index on `location` already covers all incident types (it does — same field); no per-type index is needed.

## 2. Reference data / seed

- [x] Extended the `road_defect` seed (`src/shared/seedShared/seedShared.fn.ts`) beyond the current 3 values («نقص گاردریل»، «آبگرفتگی»، «محدودیت دید») to cover خرابی آزادراه properly. Aligned with `Design.md` §defect: `روسازی`، `خط‌کشی`، `تابلو`، `روشنایی`، `حفاظ/گاردریل`، `مانع حریم`، `سایر`. Existing names kept (idempotent seed matches by exact `name`).
- [x] D1 resolved to a dedicated `incident_severity` (کم/متوسط/زیاد/بحرانی) — seeded via `seedShared.fn.ts`.
- [x] `position` already seeds خط ۱/خط ۲/شانه راست/شانه چپ — sufficient for the affected-lane picker.

## 3. Acts — validation & behavior per type

### 3.1 `accident.add` (`src/accident/add/`)
- [x] `add.val.ts` (via `accidentSetSchema`): add `incident_type` enum + `incident_payload` object + `incidentSeverityId` relation id.
- [x] `add.fn.ts`:
  - Default `incident_type = "accident"` when absent.
  - **Type-purity validation** (before insert): every field is optional for every type — each organization's registration process (`accident_process`) decides which fields are required, so the server never hard-requires `location`/`date_of_accident`/subject. For non-accident types only: **reject** accident-only fields (`vehicle_dtos`, `passenger_dtos`, `pedestrian_dtos`, `people_dtos`, `facility_damage_dtos`, `collisionTypeId`, `typeId`) with a clear Persian error.
  - **Report id by type** (requirement 02 §5: "Unique Report ID based on incident type"):
    - keep `REP-${year}-${serial}` for `accident` (backward compat, web regex search unaffected);
    - `BRK-`, `OBS-`, `OTH-` prefixes for the other three. Single shared `serial` counter stays unique across all types.
  - Keep idempotency-by-uuid, Patrol `draft|queued` enforcement, and forced `officerId` attribution unchanged.
- [x] Verified the idempotency lookup returns the existing record regardless of type (matches on `client_report_uuid`).

### 3.2 `accident.update` (`src/accident/update/`)
- [x] `update.val.ts` + `accidentSetSchema`: same new fields.
- [x] `update.fn.ts`: apply the same type-purity check to the merged `$set` (nothing is required). Reject changing `incident_type` on a report that is `synced`/`rejected` or already in review (`review_status !== "submitted"`), so a submitted accident can't be silently re-labeled as an obstacle.

### 3.3 `accident.getMyReports` (`src/accident/getMyReports/`)
- [x] `getMyReports.val.ts`: add optional `incidentType` set filter (`enums([...])`).
- [x] `getMyReports.fn.ts`: apply `filters.incident_type = incidentType` when provided. Patrol scoping (`officer._id`) unchanged. Projections auto-include new fields via `selectStruct`.

### 3.4 `accident.gets` / `accident.get` (Manager/web + shared lists)
- [x] `gets.val.ts`: add optional `incidentType` filter.
- [x] Verified `selectStruct("accident", 1)` exposes `incident_type` + `incident_payload` (auto) so the web dashboard can filter.

### 3.5 `accident.getSyncStatus`
- [x] No change required (buckets by `sync_status`, all types) — verified via E2E that non-accident reports land in the correct buckets.

### 3.6 Review loop — `reviewReport` / `resubmitReport` / `reviewHistory`
- [x] No code change; verified (E2E) the embedded `review_history` flow works on a non-accident report (returned → update-by-uuid → `resubmitReport` → `submitted`).

### 3.7 Map overlay — `accident.nearbyAccidents` (`src/accident/maps/nearbyAccidents/`)
- [x] Added `incident_type` (and `incident_severity.name`) to the lightweight payload so the mobile Map can render type-specific markers. Bounding-box + synced-only + `can_view_map` gating unchanged.

### 3.8 Media — `file.uploadAccidentImages`
- [x] D2 decided: new `incident` category (≤5MB, max 10 per report). `plate`/`insurance`/`croquis`/`facility_damage` stay accident-only.
- [x] Verified ownership check (`accidentId` belongs to the officer) covers non-accident reports — it keys off the `accident` relation; E2E uploaded an `incident` photo linked to a `road_breakdown` report.

## 4. Declarations & type sync

- [x] Regenerated `back/declarations/selectInp.ts` (declaration generator ran during `deno check mod.ts`; new fields present).
- [x] From repo root: `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` — done; frontend and mobile `@backend/selectInp` alias in sync.
- [x] Confirmed mobile `pnpm exec tsc --noEmit` passes against the backend copy.
- [x] Updated `back/Models.md` (accident schema: incident_type/incident_payload/incident_severity; new IncidentSeverity section; model list).
- [x] Updated `06-mobile-patrol-backend-todo.md` and this file's statuses when done. (Statuses in this file; 06 update tracked with Phase 2.)

## 5. Permission & validation matrix (target state)

| Type | Required (server-enforced) | Forbidden (server-rejected) | report_id prefix |
| --- | --- | --- | --- |
| `accident` | — (none — org process decides) | — | `REP-` |
| `road_breakdown` | — (none — org process decides) | vehicle/people/facility/collision/severity-type fields | `BRK-` |
| `road_obstacle` | — (none — org process decides) | accident DTOs | `OBS-` |
| `other` | — (none — org process decides) | accident DTOs | `OTH-` |

> **All fields are optional on record.** Recording is driven by each organization's `accident_process`; the process questions carry their own `required` flag and are enforced client-side by the wizard. The server only guards type purity (no accident-only DTOs on non-accident reports) plus the existing sync-status/ownership rules below.

Patrol can only set `draft|queued` and only their own reports (unchanged). Manager/Ghost may set any sync status and review all types (unchanged).

## 6. E2E tests — extend `back/test/patrol-operations-test.ts`

Follow the existing harness (isolated DB `nejat_patrol_ops_test`, `runAct` helper that runs preActs + validator + fn with a real JWT). Implemented as a dedicated suite **`back/test/incident-types-test.ts`** (15 tests) using the same harness.

- [x] Add one of each non-accident type via `accident.add` (Patrol token) → 200, correct `incident_type`, correct `report_id` prefix, `officerId` forced.
- [x] Idempotency: re-add same `client_report_uuid` → returns existing doc, no duplicate (all types).
- [x] Negative: non-accident report with `vehicle_dtos` rejected; minimal reports (no location/date/subject) accepted for every type — no field is hard-required.
- [x] Patrol trying to set `sync_status: "synced"` rejected (all types).
- [x] `getMyReports` `incidentType` filter returns only that type; Patrol scoping intact.
- [x] Update-by-uuid on a non-accident report; `incident_type` change rejected once `review_status !== submitted`.
- [x] Full review loop on a non-accident report: Manager returns → Patrol `resubmitReport` → `submitted`, `review_reason` cleared, `review_history` pushed.
- [x] `getSyncStatus` buckets include non-accident reports.
- [x] `nearbyAccidents` payload includes `incident_type`.
- [x] Upload an `incident`/`other` photo linked to a non-accident report → linked in `attachments`.
- [x] Backward compat: a legacy doc without `incident_type` is treated as `accident` (add path defaults it; existing docs read fine).

## 7. Web dashboard (frontend) impact

- [x] Charts/analytics (`src/accident/charts/*`) now add `incident_type: "accident"` to their base filters (25 files), so non-accident reports never corrupt accident analytics. **Decision on the patrol/manager dashboard:** keep it type-agnostic — it is the ops/review console where non-accident reports are reviewed (`reviewReport`/`resubmitReport` run on all types); a frontend type filter can be added later.
- [ ] `patrol-projections.ts` / report list: include `incident_type` for badge/label rendering (frontend follow-up).

## 8. Mobile handoff (follow-up, NOT this backend scope)

- [ ] Mobile `src/app/incident/index.tsx`: ungate the three tiles and send the chosen type.
- [ ] Mobile per-type form/mapper: `incident_payload` + reference pickers (road_defect/equipment_damage/incident_severity/lane), no vehicle/people phases.
- [ ] Mobile sync worker serialization: emit `incident_type` + `incident_payload`; queue/reports list render a type label; the `draft → queued → syncing → synced` transition and update-by-uuid correction loop are shared unchanged.
- [ ] Mobile Map tab: render non-accident markers from `nearbyAccidents` payload.

## 9. Decision log

| # | Question | Recommendation | Status |
| --- | --- | --- | --- |
| D1 | Incident severity: reuse `damage_severity` vs new `incident_severity` | **New `incident_severity` model** (کم/متوسط/زیاد/بحرانی; seeded + `setSharedActs`) — decided 2026-08-28 | `[x]` decided |
| D2 | Incident photo category | **New `incident` category** (max 10, ≤5MB) — decided 2026-08-28; implement in `file.uploadAccidentImages` during Phase 2 | `[x]` decided |
| D3 | `incident_type` enum vs reference model | **Enum** now; reference model only when a new type needs distinct behavior, not just a label | `[x]` decided |
| D4 | `report_id` prefix by type | Keep `REP-` for accidents (backward compat); `BRK-/OBS-/OTH-` for new types | `[x]` decided |

## Backend dependencies / blockers (unchanged)

- Road `area` geometry backfill (~1490 production roads) still blocks `snapPointToRoad` / `validatePointInZone` / offline road caching — not specific to this feature, but note it in E2E (snap returns «نزدیک‌ترین راه در شعاع پوشش این نقطه ثبت نشده است»).
- No new blockers introduced by the polymorphic approach.

---

# PART II — Complete Organizational Structure (هر آزادراه یک سازمان)

## 10. Scope, goals & reference implementation

### 10.1 Goal

Replace the current flat, disconnected `patrol_unit` / `police_station` records with a **professional hierarchical organization** in which **each highway (`road`) is an organization** that owns its own **unit tree (org chart)**, its own **head/commander**, and its own **members** (users scoped to org + unit). Every patrol unit, police station, maintenance crew, toll/ops point, and — later — warehouse is a **node in that tree**.

### 10.2 Reference implementation (already built — read first)

| Concern | Reference file |
| --- | --- |
| `Organization` + `Unit` models | `sitak/lesanSatek/back/models/organization.ts`, `models/unit.ts` |
| Multi-role user (`roles:[{roleId,name,scopeType,scopeId}]`) | `sitak/lesanSatek/back/models/user.ts` |
| Org-chart action (flag-bundled, single call) | `sitak/lesanSatek/front/backDocs/32-unit-getOrgChart-api.md` |
| Role/scoping design & role-management act | `sitak/lesanSatek/front/backDocs/06-new_role_management.md`, `07-new_role_todo.md` |
| Warehouse-head / unit-type scoping rules | `sitak/lesanSatek/front/backDocs/26-consumption-inventory-warehouse-finalization.md` §6 |
| Denormalized-hierarchy convention | this repo's `back/AGENTS.md` (Ware stores all 4 hierarchy refs) |

### 10.3 Concept mapping (Satek → LESEN)

| Satek | LESEN | Notes |
| --- | --- | --- |
| `Organization` | **`road`** (each highway = one org) | Decision **D5** below |
| `Unit` (infinite tree, `parentUnit`/`subUnits`, `head`, `type`, `features`) | **new `unit` model** | patrol units, police stations, crews, ops, HQ, warehouses |
| flat `patrol_unit` + `police_station` | folded into `unit` via `type` discriminator | Decision **D6** |
| `User.roles[{roleId,name,scopeType,scopeId}]` | new `user.roles` array (or extended `level`) | Decision **D7** |
| `Organization.state/city` | `road.province` (existing) | keep; no geo duplication |
| `organization` denormalized on every `Unit` | `road._id` + `organization._id` denormalized on every `unit` | query efficiency (this repo's denormalized-hierarchy pattern) |
| `Unit.head` | `unit.head → user` | commander/chief of that node |
| `Unit.type` enum + feature flags | `unit.type` enum + `unit.features` | patrol permissions move here where relevant |
| `Unit.getOrgChart` | new `unit.getOrgChart` | §16 |

## 11. Decision log — Part II

| # | Question | Recommendation | Status |
| --- | --- | --- | --- |
| D5 | How does "highway = organization" get modeled? | **New `organization` model with a required 1:1 `road` relation** — decided 2026-08-28 | `[x]` decided |
| D6 | What happens to `patrol_unit` / `police_station`? | **Fold into `unit`** (`type: "Patrol" | "Station" | …`); the two flat models stay instantiated for one release (still referenced by existing relations/acts), new data goes to `unit`. Backfill/migration **not needed** (see §12.4). | `[x]` decided |
| D7 | User scoping: extend `level` vs add `roles` array? | **Add Satek-style `roles:[{roleId,name,scopeType:"organization"|"unit",scopeId}]`** — decided 2026-08-28. `level` stays the coarse auth gate; `settings.cities/provinces` untouched. | `[x]` decided |
| D8 | Chart root & scoping by role | `Manager/Ghost` see all orgs (must pass `orgId`); **OrgHead/OrgHead** auto-resolved from `role.scopeId`; `UnitHead` scoped to own unit subtree. | `[x]` decided |

## 12. Model changes — `back/models/`

### 12.1 `organization.ts` (new) ✅

```ts
organization_pure = {
  code: string(),                       // e.g. "A1-تهران-قم"
  name: string(),                       // نام آزادراه
  enName: optional(string()),
  description: optional(string()),
  is_active: defaulted(boolean(), true),
  ...createUpdateAt,
}
organization_relations = {
  road:     { schemaName: "road", type: "single", optional: false,
              relatedRelations: { organization: { type: "single" } } },  // reverse on road
  head:     { schemaName: "user", type: "single", optional: true,
              relatedRelations: {} },                                     // رئیس/فرمانده سازمان
  logo:     { schemaName: "file", type: "single", optional: true, relatedRelations: {} },
  registrer:{ schemaName: "user", type: "single", optional: true, relatedRelations: {} },
}
```

- Index: unique on `code`; text index on `name`/`enName`.
- `road` reverse (`road.organization`) lets `accident`/`nearbyAccidents` scope to "this highway's org" via the existing `road` relation without touching accident code.

### 12.2 `unit.ts` (new) ✅

```ts
unit_type_array = ["Patrol", "Station", "Ops", "Maintenance", "Logistics", "Administration", "Warehouse", "General"];
unit_pure = {
  code: string(),
  name: string(),
  description: optional(string()),
  is_active: defaulted(boolean(), true),
  type: defaulted(unit_type_emums, "General"),
  address: optional(string()),
  phone: optional(string()),
  head_title: optional(string()),        // عنوان سمت (رئیس، فرمانده، سرگشت...)
  features: defaulted(array(object({ feature: string() })), []),
  // --- denormalized hierarchy (query efficiency, this repo's convention) ---
  // relations below carry road._id + organization._id
  ...createUpdateAt,
}
unit_relations = {
  organization: { schemaName: "organization", type: "single", optional: false,
                  relatedRelations: { units: { type:"multiple", limit: 200, sort: {field:"_id", order:"desc"} } } },
  road:         { schemaName: "road", type: "single", optional: false,
                  relatedRelations: { units: { type:"multiple", limit: 200, sort: {field:"_id", order:"desc"} } } },
  parentUnit:   { schemaName: "unit", type: "single", optional: true,
                  relatedRelations: { subUnits: { type:"multiple", limit: 200, sort: {field:"_id", order:"desc"} } } },
  head:         { schemaName: "user", type: "single", optional: true,
                  relatedRelations: { headedUnits: { type:"multiple", limit: 50, sort: {field:"_id", order:"desc"} } } },
  vehicles:     { schemaName: "vehicle", type: "multiple", optional: true, limit: 20,
                  relatedRelations: { unit: { type: "single" } } },      // migrated from patrol_unit
  officers:     { schemaName: "user", type: "multiple", optional: true, limit: 50,
                  relatedRelations: { unit: { type: "single" } } },      // migrated from patrol_unit
  registrer:    { schemaName: "user", type: "single", optional: true, relatedRelations: {} },
}
```

- Compound index `{ organization._id: 1, type: 1 }`; text index on `code`/`name`.
- **Reverse relation on users:** `user.unit` (single, from `unit.officers`) keeps patrol attribution queries (`getMyReports`, `shift.officer`) working with **zero changes** to those acts — they filter on `"officer._id"`, which is unchanged.

### 12.3 `user.ts` — add roles + org/unit membership (per D7) ✅

```ts
role_array = ["Ghost", "Manager", "OrgHead", "UnitHead", "Officer", "Editor", "Enterprise", "Patrol"];
roles: defaulted(array(object({
  roleId: string(),                        // uuid
  name: role_emums,
  scopeType: optional(enums(["organization", "unit"])),
  scopeId: optional(string()),
})), []),
// relations (children define them; user just declares the multiple side is auto):
// organizations (Organization[], via organization.head? No — membership is a pure relation)
```

> **Membership model:** keep it simple and Satek-faithful — `user` gains **multiple relations** `organizations` and `units` (`relatedRelations` reverse `members` on both), and `unit.head`/`organization.head` handle leadership. Do **not** re-declare any reverse on `organization`/`unit`.

### 12.4 Migration of existing data — **NOT NEEDED** (decided 2026-08-28)

Analysis of the production DB (`nejat`): the patrol app has **not** launched anywhere in the department, so there is no legacy organizational data to migrate — `patrol_unit` has **1** dev-era record and `police_station` **0** (the analytics/graphs layer is live with ~52k accidents, but that is data, not org structure). The planned one-time backfill act (built then **removed** per the dead-code convention): for each existing `patrol_unit` → `unit(type:"Patrol")`, each `police_station` → `unit(type:"Station")`, plus patrol-user `roles`/`units` assignment. Going forward the org is built directly in `unit`/`organization`/`user.roles`; if real legacy data ever appears, the migration can be a one-off script, not a permanent act.

- [x] **Decision:** skip the backfill — no production `patrol_unit`/`police_station` data to migrate.
- [ ] (removed) One-time backfill act — **not built** (dead code for 1 record).
- [ ] Keep `police_station`/`patrol_unit` **exported and instantiated** for one release (still referenced by existing relations/acts: `accident.patrol_unit`, `shift.patrol_unit`, `emergency.patrol_unit`, `src/patrol_unit/*`, `src/police_station/*`), then delete per dead-code convention. New org data goes to `unit` only.

### 12.5 Patrol unit & patrol officer — first-class citizens of the org structure

The patrol flow is **not** an afterthought bolted on — the org chart *is* the patrol hierarchy.

| Concept | Where it lives | Relations that keep existing patrol acts working |
| --- | --- | --- |
| Patrol unit (گشت) | `unit` with `type:"Patrol"` | `organization`, `road` (denormalized), `parentUnit` (→ its Station/HQ), `head` (سرگشت), `vehicles`, `officers` |
| Patrol officer (مأمور گشت) | `user` with `level:"Patrol"` **+** `roles:[{name:"Patrol", scopeType:"unit", scopeId: patrolUnitId}]` | `unit` (single, reverse of `unit.officers`), `organizations` (multiple) |
| Station (پاسگاه) | `unit` with `type:"Station"` | `subUnits` = its patrol units |
| Shift | unchanged (`shift.officer/patrol_unit/vehicle`) | swapped `patrol_unit` → `unit` ref |

Guarantees to preserve (E2E-checked in §15):
- `accident.getMyReports` / `reportScope.ts` still scope by `"officer._id"` → **zero change**.
- Patrol device login (`level === "Patrol"` + `device` JWT flow) unchanged; the token's `device_id` still validates against `user.devices`.
- `getForPatrol` (Part IV §31) resolves the officer's org from `user.organizations`/`user.unit.organization` — no extra input.
- Patrol-scoped warehouse reads (Part III) and process access (Part IV) derive from `unit.organization._id` via the same `roles`/`units` links.

## 13. Acts — organization & unit

### 13.1 Shared CRUD ✅

- [x] `organization`: `add/get/gets/update/remove/count`. `add` requires `roadId` + `headId?`/`logoId?` (Manager only); `head`/`logo` singles handled in `update` (replace). (`updateRelations` folded into `update` — see note.)
- [x] `unit`: `add/get/gets/update/updateRelations/remove/count`. `add` requires `organizationId`, `roadId`, `parentUnitId?`, `headId?`. **Guard:** a `unit`'s `road._id` must equal its `organization.road._id` and any `parentUnit` must share the same `organization._id` (server-side check — prevents cross-org trees).
- [x] `unit.gets` filters: `search` (code/name text), `organizationId`, `roadId`, `type`, `parentUnitId`, `headId`.
- [x] Deletion: children first; `hardCascade: hardCascade || false` (org/unit delete blocked while reverse `units`/`subUnits` exist).

### 13.2 `unit.getOrgChart` (custom action — port of Satek `32-unit-getOrgChart-api.md`) ✅

- [ ] Single POST; `set:{ activeRoleId }` + optional `orgId` (Manager/Ghost). Auto-resolve org from role scope for OrgHead.
- [ ] Flag-bundled `get`: `units:0|1` (flat array + `totalCount`), `organization:0|1` (org header incl. head + logo), `stats:0|1` (per-type counts, aggregation via `$group` on `type`).
- [ ] Returns `parentUnit: { _id, name }` + `head: { _id, first_name, last_name }` + `type` on each unit — the client rebuilds the tree (`buildTree` by `parentUnit._id`), exactly like Satek's `OrgChartClient`.
- [x] All sections run in parallel via `Promise.all`; no pagination (org unit count is small — Satek hard cap ~200 nodes per org).
- [x] Gate: `setTokens`/`setUser` + in-fn check (Ghost/Manager → `orgId` required; OrgHead/UnitHead → auto-scope via `roles`).

### 13.3 Existing acts — impact check

- [x] `accident.getMyReports` / `reportScope.ts`: Patrol scoping is by `"officer._id"` — **no change**; verified by E2E (incident-types + organization suites).
- [ ] `shift`, `emergency`, `patrol_unit`-linked acts: swap `patrol_unit` refs to `unit` **when the flat models are deleted** (follow-up; the flat models remain instantiated for one release).
- [x] Enterprise dashboard (`user.settings` filter denormalization) keeps working — it is pure-field, org-independent.

## 14. Permission & scoping matrix (Part II target)

| Role | Org chart | Units (`unit.gets`) | Users (`user.gets`) | Warehouse (Part III) |
| --- | --- | --- | --- | --- |
| Ghost / Manager | All orgs (must pass `orgId`) | All | All | All |
| OrgHead | Own org (auto-scope) | Own org | Own org | Own org |
| UnitHead | Own unit subtree | Own unit subtree | Own unit members | Own unit (+ warehouse bypass, Part III) |
| Officer / Patrol | — | Own unit read | — | — |

## 15. E2E — new `back/test/organization-test.ts` ✅

- [x] Create org A (linked to road R) + org B (road S). Cross-org unit parent must be rejected.
- [x] Create unit tree: HQ → Station → Patrol, with `head` and `vehicles`/`officers` relations.
- [x] `unit.getOrgChart` as OrgHead (auto-scope, no `orgId`) returns only own org flat list with correct `parentUnit`; Manager with `orgId` gets either; Manager without `orgId` rejected.
- [x] `unit.getOrgChart` as UnitHead resolves org from `unit` scope.
- [x] Migration idempotency — **removed**: backfill act dropped (no production data to migrate, §12.4).
- [x] `accident.getMyReports` still scoped to officer after folding patrol_unit → unit (covered by `incident-types-test.ts`).
- [x] Deletion guards: deleting org with units blocked; deleting leaf unit OK.
- [x] `unit.add` rejects road that doesn't match the org's road.

## 16. Declarations & docs sync (Part II) ✅

- [x] Regenerated `back/declarations/selectInp.ts`; `cp -rv` to `front/src/types/declarations/`; mobile `pnpm exec tsc --noEmit` green.
- [x] Updated `back/Models.md` (organization, unit, user.roles) + `AGENTS.md` relation maps (complete `unit` map incl. reverses).

---

# PART III — Professional Warehousing (incl. JIT)

## 17. Scope, goals & reference implementation

### 17.1 Goal

A complete professional warehousing domain for the traffic organization: a **4-level product catalog** (Type → Class → Group → Model → Ware), **per-unit stock** with audit trail, **consumption / goods receipt / transfer / issue** flows, and — the differentiator — **JIT (Just-In-Time) replenishment** so consumables (علامت/نیوجرسی/گاردریل/پوشاک/ملزومات اداری) arrive at the consuming unit *just when needed*, minimizing warehouse stock.

### 17.2 Reference implementation (read first)

- Catalog models + M:N deep-dive: `sitak/lesanSatek/back/models/{wareType,wareClass,wareGroup,wareModel,ware,stuff,manufacturer,store}.ts` and `backDocs/33-warehouse-hierarchy-models-and-multi-select-dropdown.md`.
- Inventory / Consumption / StockMovement + `inventoryManager` utility + role scoping: `sitak/lesanSatek/back/models/{inventory,consumption,stockMovement,goodsReceipt}.ts`, `back/utils/inventoryManager.ts`, `backDocs/26-consumption-inventory-warehouse-finalization.md`.
- Org-scoped inventory aggregation: `backDocs/29-getWarehouseInventory.md`, `backDocs/20-getPendingByUnit.md`.

## 18. Decision log — Part III

| # | Question | Recommendation | Status |
| --- | --- | --- | --- |
| D9 | Port the full 4-level catalog? | **Flat `ware` only** (no hierarchy models; taxonomy levels are plain name fields `ware_type`/`ware_class`/`ware_group`/`ware_model` on `ware`) — decided 2026-08-28. Simpler; the product can still tag/filter by level without a model tree. | `[x]` decided |
| D10 | Inventory granularity | **One `inventory` per `(unit, ware._id)`** with a unique compound index — decided 2026-08-28. `min_quantity`/`max_quantity` = JIT reorder/safety ceiling. | `[x]` decided |
| D11 | JIT mechanism (phase 2 of Part III) | Reorder-point triggers + **cross-dock delivery** + **kanban-style `goods_request`** between units — **deferred to Phase 5** (confirmed 2026-08-28). `cross_dock`/`target_unit` fields already on `goods_receipt` for the future. | `[x]` decided (Phase 5) |
| D12 | Which catalog models register via `setSharedActs`? | With flat `ware` there is only **one** catalog model; it gets full custom CRUD (setSharedActs is name-only). Inventory/movement models get full custom acts. | `[x]` superseded by D9 |
| D13 | Fiscal year / budget / purchasing RFQ | **Defer.** A slim `goods_request`/`purchase_order` line for JIT is enough; full procure-to-pay (tender/budget) is future scope. | `[x]` decided |

## 19. Catalog model (new, in `back/models/`) ✅

D9 decided flat: a single **`ware`** model (no `ware_type`/`ware_class`/`ware_group`/`ware_model`/`manufacturer` models). Taxonomy levels are plain string tags:

```
ware  name, enName, brand, price, irc, gtin, photo_url,
      ware_type / ware_class / ware_group / ware_model  (plain name tags — flat)
      manufacturer (plain string), lead_time_days (JIT Phase 5), is_active
      + registrer relation + text index on name/enName/brand
```

- No hierarchy models; filters like `ware_type` are single-doc queries on the plain field.
- `ware` gets **custom CRUD** acts (add/get/gets/update/remove/count) — not `setSharedActs` (which is name-only).

## 20. Stock & movement models (new, in `back/models/`) ✅

### 20.1 `inventory.ts`
```ts
inventory_pure = {
  quantity: defaulted(number(), 0),
  min_quantity: optional(number()),     // reorder point (JIT)
  max_quantity: optional(number()),     // safety ceiling / JIT target
  batch_no: optional(string()),
  expiration_date: optional(date()),
  location: optional(string()),         // "قفسه A، ردیف ۳"
  last_counted_at: optional(date()),
  ...createUpdateAt,
}
inventory_relations = {
  unit: { schemaName: "unit", type: "single", optional: false, relatedRelations: { inventories: {...} } },
  warehouse_unit: { schemaName: "unit", type: "single", optional: true, relatedRelations: { warehouseInventories: {...} } },
  ware: { schemaName: "ware", type: "single", optional: false, relatedRelations: { inventories: {...} } },
  // ware_model / ware_group / ware_class / ware_type denormalized (single, required) for stats
}
```
- Unique compound index `{ "unit._id": 1, "ware._id": 1 }`.

### 20.2 `stock_movement.ts` (read-only, system-written)
```ts
stock_movement_pure = {
  quantity, balance_before, balance_after,
  reason: enums(["goods_receipt","goods_issue","transfer_in","transfer_out","consumption","adjustment","return","write_off"]),
  reference_type: optional(string()),   // "goodsReceipt" | "consumption" | "goodsRequest"
  reference_id: optional(string()),     // polymorphic raw ref (orphan-resilient — allowed per AGENTS.md)
  description: optional(string()),
  ...createUpdateAt,
}
```
- Relations: `unit` (req), `created_by → user` (req), `ware` (opt), denormalized hierarchy (opt).

### 20.3 `consumption.ts` (add triggers `removeStock`)
- Pure: `quantity`, `consumed_at`, `reason`, `consumed_for` (name snapshot), `notes`.
- Relations: `unit` (req), `consumed_by → user` (req), `inventory` (opt), `ware` (req).

### 20.4 `goods_receipt.ts` (add triggers `addStock`)
- Pure: `receipt_number` (auto `GR-{year}-{serial}`), `received_at`, `status:["pending","completed","partially_rejected"]`, `notes`, embedded `items:[{ wareId, wareName, quantity_received, quantity_accepted, quantity_rejected, batch_no, expiration_date }]`.
- Relations: `received_by → user`, `receiving_unit → unit`, optional `purchase_order` (deferred) / `goods_request` (JIT).
- **JIT flag:** `cross_dock: defaulted(boolean(), false)` + `target_unit` (opt) — **fields present**; behavior wired in Phase 5 (currently accepted stock goes to `receiving_unit`).

### 20.5 `inventoryManager.ts` utility (port `sitak/.../utils/inventoryManager.ts`) ✅
- `addStock(unitId, wareId, quantity, reason, userId, options)`
- `removeStock(...)`, `transferStock(fromUnitId, toUnitId, wareId, quantity, userId, ...)`, `adjustStock(...)`, `getStockLevel(unitId, wareId)`, `getWarehouseDashboard(warehouseUnitId, ...)`.
- **Every call atomically** upserts inventory + writes `stock_movement` (before/after balances). No user act writes `stock_movement` directly.

## 21. JIT (Just-In-Time) warehousing design ✅ (Phase 5 done 2026-08-28)

Keep **warehouse stock minimal**; deliver to the consuming unit **on demand**. Status:
- [x] Reorder-point scan (`inventory.checkReorder`): inventories where `quantity <= min_quantity` (and `min_quantity > 0`) with no open request → auto `goods_request` (`requested = max - current`, `priority` when `<= min*0.5`). Single-request-per-(unit,ware) guard.
- [x] `goods_request` lifecycle `draft → pending → approved → issued → received` (+rejected): `add` (pending), `approve` (approved/rejected), `issue` (warehouse `removeStock` goods_issue → issued), `receive` (unit `addStock` → received). Auto `REQ-{year}-{serial}`.
- [x] Demand & lead time: `ware.lead_time_days` (field on model); `getWarehouseInventory` computes `avg_daily_demand` (30-day consumption), `reorder_point = avg_daily_demand × lead_time_days × 1.2` (else `min_quantity`) and annotates `status: healthy | due | critical`.
- [x] Cross-dock (`goods_receipt.cross_dock=true` + `target_unit`): accepted qty issued straight to `target_unit` (`goods_issue` movement), never rests in the warehouse.
- [x] Kanban transfer: `inventory.transfer` → `transferStock` (done in Phase 4) for local rebalancing.
- [ ] JIT org dashboard totals (total SKUs / under-reorder count / open requests / stock value) — optional extension of `getOrgChart` `stats` or a future warehouse dashboard act; not yet built.

## 22. Acts & setup (Part III) ✅ (Phase 4 scope; `goods_request` = Phase 5)

- [x] `ware` (flat catalog): custom `add/get/gets/update/remove/count` in `src/ware/` (setSharedActs is name-only, not suitable for the flat ware fields).
- [x] `inventory`: `add` (upsert + scope check), `get`, `gets` (role-scoped, filters incl. `organizationId`, `unitId`, `wareId`, `search`), `adjust`, `transfer`, `count`, `getWarehouseInventory` (aggregation, warehouse-head bypass).
- [x] `consumption`: `add` (→ `removeStock`; auto-derive `unit` from role scope), `get`, `gets`, `count`.
- [x] `goods_receipt`: `add` (→ `addStock`, auto `GR-{year}-{serial}`), `get`, `gets`, `count`. (cross-dock behavior = Phase 5)
- [x] `stock_movement`: `get`, `gets`, `count` only (read-only — no `add`).
- [x] `goods_request` (JIT): `add`, `approve`, `issue`, `receive`, `gets`, `count` — **done in Phase 5**.
- [x] **Role scoping** (Satek §6, via `utils/unitScope.ts`): Manager/Ghost = all; OrgHead = org; UnitHead = own unit (Warehouse-type unit head = all units, the warehouse bypass); Officer = read-only own unit.
- [x] Every act keeps `{ success, body }` envelope; Persian user-facing errors.

## 23. Seed (extend `src/shared/seedShared/seedShared.fn.ts`) ✅

- [x] Starter `ware` set (نیوجرسی، گاردریل، تابلو، چراغ، کت شبرنگ، دستکش، مخروط ترافیکی، نوار خطر) with `ware_type` tags — idempotent by exact `name`. (No hierarchy models to seed under D9.)
- [x] `road_defect`/`equipment_damage` seed already extended (§2) — reference models and catalog remain distinct (catalog = tracked stock; reference = incident taxonomy).
- [x] Seed idempotent by exact `name` (existing pattern).

## 24. E2E — `back/test/warehouse-test.ts` ✅ (12 tests)

- [x] `ware` CRUD + flat `ware_type` filter.
- [x] `inventory.add` upsert (same unit+ware twice → one doc, updated) + adjustment movement.
- [x] `consumption.add` decrements inventory + writes `stock_movement`; insufficient stock rejected.
- [x] `goods_receipt.add` increments inventory, writes movement, auto `GR-` number; `partially_rejected` status.
- [x] `inventory.transfer` moves quantity + writes `transfer_out`/`transfer_in`.
- [x] JIT cycle: reorder scan creates `goods_request` (replenish-to-ceiling, priority), single-request guard (no duplicate on re-scan), approve → issue (warehouse stock down) → receive (consuming unit stock up).
- [x] `goods_receipt` cross-dock issues to `target_unit` (does not rest in the warehouse).
- [x] `getWarehouseInventory` annotates `healthy/due/critical`.
- [x] Role scoping: UnitHead sees own unit; OrgHead sees org.
- [x] `stock_movement` has no `add` act.

## 25. Declarations & docs sync (Part III) ✅

- [x] Regenerated `back/declarations/selectInp.ts`; copied to `front/src/types/declarations/`; mobile type-check green.
- [x] `back/Models.md` + `AGENTS.md` relation maps for all new models (one-directional rules; warehouse `unit` reverses documented).
- [x] Mark Part II/III statuses in this file + `06-mobile-patrol-backend-todo.md`.

---

# PART IV — Org-Scoped Accident Registration & Reporting Process Builder

## 26. Scope, goals & reference implementation

### 26.1 Goal

Each organization (highway) designs its **own accident registration/reporting process** for its patrol units — a multi-step form wizard where:

- **Steps** carry icons, colors, titles, descriptions and an order (e.g. «گام ۱: مشخصات خودروها»، «گام ۲: سرنشینان»، «گام ۳: محیط و راه»).
- **Each question calls a database model** as its answer source (e.g. the question «شدت حادثه» calls `damage_severity`).
- **The org whitelists which records of that model are visible as answers** — a model may have 50 records, the org shows only the 3 it wants (e.g. `allowed_answer_ids` = 2 of the 4 `damage_severity` records).

This is the **form/registration half** of the accident workflow; the existing `reviewReport`/`resubmitReport` loop remains the review half.

### 26.2 Key difference vs Satek's purchasing process

Satek's `Process`/`ProcessStep` drives a **multi-unit approval chain** (`assigneeGroups`, `StepApproval`, OR/AND group logic). This one drives a **patrol form wizard**: steps = registration phases, questions = form fields sourced from reference models. **No assignee groups, no per-step approvals.** We reuse only the *builder mechanics*: draft → activate (validate) → version bump, plus `duplicateProcess`.

### 26.3 Reference implementation

- Process/ProcessStep models + `activateProcess`/`duplicateProcess`: `sitak/lesanSatek/back/models/{process,processStep}.ts`, `backDocs/02-workflow_instructions.md`.
- Question-source models = this repo's reference/seed models (`src/shared/seedShared/`): `collision_type`, `damage_severity`, `road_defect`, `equipment_damage`, `vehicle_type`, `light_status`, `road_surface_condition`, `air_status`, `position`, … — all already seeded and registered via `setSharedActs`.

## 27. Decision log — Part IV

| # | Question | Recommendation | Status |
| --- | --- | --- | --- |
| D14 | Question → storage mapping | **Typed registry** — decided 2026-08-28: each question maps to a known accident field/relation via a `target` spec → answers persist in typed relations (analytics intact); free-text/organic extras → embedded `accident.dynamic_answers`. | `[x]` decided |
| D15 | Steps/questions: models vs embedded | **Embedded** `steps:[{…, questions:[{…}]}]` on the process doc — decided 2026-08-28. | `[x]` decided |
| D16 | Question source models | **Fixed code registry `questionRegistry`** in `src/accident_process/` (`model_name → target + multi`). Question `model_name` is validated against the registry at `activate`. | `[x]` decided |
| D17 | Answer-record whitelist | **`allowed_answer_ids: ObjectId[]`** on each question; empty = all records; non-empty = only those. Raw refs (polymorphic; snapshot semantics). Deleted allowed record → activate rejects (no silent partial). | `[x]` decided |
| D18 | Process scope & concurrency | **Org-scoped (+ optional `incident_type`), one active per org+type** — decided 2026-08-28. Unique partial index `{ "organization._id": 1, incident_type: 1 }` filtered `status:"active"` + app-level check (activating a new one archives the previous). | `[x]` decided |

## 28. Models ✅

### 28.1 `accident_process.ts` (new) — done

```ts
accident_process_pure = {
  name: string(),
  description: optional(string()),
  status: defaulted(enums(["draft", "active", "archived"]), "draft"),
  version: defaulted(number(), 1),           // bump on each activate
  is_active: defaulted(boolean(), false),
  incident_type: optional(enums(["accident", "road_breakdown", "road_obstacle", "other"])), // empty = applies to all types
  steps: defaulted(array(step_schema), []),  // embedded — see §28.2
  ...createUpdateAt,
}
accident_process_relations = {
  organization: { schemaName: "organization", type: "single", optional: false,
                  relatedRelations: { accident_processes: { type: "multiple", limit: 20, sort: { field: "_id", order: "desc" } } } },
  registrer:    { schemaName: "user", type: "single", optional: true, relatedRelations: {} },
}
```

### 28.2 Embedded `step_schema` + `question_schema` (pure, in `src/accident_process/processSchemas.ts`)

```ts
step_schema = object({
  key: string(),                  // stable uuid within the process (mobile references it in submissions)
  title: string(),                // عنوان مرحله
  description: optional(string()),
  icon: optional(string()),       // icon key, e.g. "vehicle" | "people" | "environment" | "road" | "camera" — must exist in the frontend icon map
  color: optional(string()),
  order: number(),                // consecutive 1..N — `activateProcess` validates
  required: defaulted(boolean(), false),
  questions: defaulted(array(question_schema), []),
})

question_schema = object({
  key: string(),
  question: string(),             // متن سؤال
  description: optional(string()),
  icon: optional(string()),
  color: optional(string()),
  order: number(),
  required: defaulted(boolean(), true),
  model_name: QUESTION_MODEL_ENUMS,                  // ⭐ the DB model called as the answer source
  allowed_answer_ids: defaulted(array(objectIdValidation), []), // ⭐ subset of that model's records shown (empty = all)
  multi_select: defaulted(boolean(), false),         // single vs multiple answers
  target: target_spec,                               // D14: where the answer is stored on accident
})

target_spec = union([
  object({ kind: enums(["relation"]), path: string() }),   // e.g. "collision_type" | "road_defects" | "damage_severity"
  object({ kind: enums(["dto"]), dto: string(), field: string() }), // e.g. vehicle_dtos[].vehicle_type (detailed mapping = follow-up)
  object({ kind: enums(["dynamic"]) }),                    // free-form → accident.dynamic_answers
])
```

> **Scale check (AGENTS.md Prefer-Embedding):** per-process counts are small and steps/questions are always read through the process → embed. Do **not** create a separate `process_step`/`step_question` model unless a step ever needs its own lifecycle or cross-references.

## 29. Question-model registry (D16) — `src/accident_process/questionRegistry.ts`

| `model_name` | Accident target | Select | Seed records (example) |
| --- | --- | --- | --- |
| `collision_type` | relation `collision_type` | single | 7 types |
| `damage_severity` | relation `damage_severity` | single | جزئی/متوسط/شدید/تخریب کامل |
| `road_defect` | relation `road_defects` | multi | نقص گاردریل/آبگرفتگی/روسازی/خط‌کشی/تابلو/… |
| `equipment_damage` | relation `equipment_damages` | multi | نیوجرسی/پایه تابلو/چراغ روشنایی/فنس/… |
| `vehicle_type` | dto `vehicle_dtos[].vehicle_type` | single | سواری/وانت/کامیون/موتورسیکلت/… |
| `light_status` | relation `light_status` | single | روز/شب/… |
| `road_surface_condition` | relation `road_surface_conditions` | multi | مرطوب/خیس/آبگرفته |
| `air_status` | relation `air_statuses` | multi | (آب‌وهوا) |
| `position` | relation `lane` | single | خط ۱/شانه راست/شانه چپ/… |
| *(free text / number / boolean)* | `dynamic` → `incident_payload` / `dynamic_answers` | — | — |

- The builder UI renders only questions from the registry; the `model_name` enum in validators is generated from it.
- **Runtime answer resolution:** for each question, options = `{model}.gets({ _ids: allowed_answer_ids })` when non-empty, else all records. `getForPatrol({ answers: 1 })` resolves every unique model once and fan-outs in parallel (`Promise.all`), returning `steps[].questions[].answers:[{_id, name}]`.
- The org's choice ("3 of 50") lives **only** on the question instance (`allowed_answer_ids`) — the model and its 50 records are untouched.

## 30. Acts — `src/accident_process/` ✅

- [x] **CRUD** (`Manager` org-scoped via set; `OrgHead` scoping is a follow-up): `add` (draft), `get`, `gets` (filters: `organizationId`, `status`, `incident_type`, `search`), `update` (pure fields + wholesale `steps` array replace — the builder saves the draft as a whole), `remove` (draft only), `count`.
- [x] **`activateProcess`** — mirrors Satek: validates → ≥1 step; step `order` consecutive 1..N; every question has a registry `model_name` + matching `target` (registry question with `target:"dynamic"` rejected); each non-empty `allowed_answer_ids` actually exists in that model's collection (`checkAnswerIds`); then `status:"active"`, `is_active:true`, `version += 1`. Rejects if already active. Rejects empty `allowed_answer_ids` when the model has 0 records. Archives the previous active for the same org(+type).
- [x] **`duplicateProcess`** — clones the process + embedded steps/questions as `{name} (Copy)`, draft, version 1.
- [x] **`getForPatrol`** (custom, Patrol) — returns the **active** process for the caller's org (+ optional `incidentType`). Flag-bundled `get`: `process:0|1`, `answers:0|1`. Auto-resolves org from roles → `user.unit.organization` → `user.organizations`. This is the **only** endpoint the mobile wizard needs to render itself.
- [x] **`checkAnswerIds`** (helper, not a public act): validates allowed ids belong to the referenced model; used by `activateProcess`.

## 31. Runtime flow (Patrol mobile — see also follow-up §36)

1. Officer opens «ثبت گزارش» → `accident_process.getForPatrol({ incidentType, get:{ process:1, answers:1 } })`.
2. App renders the step pager from `steps[]` (icon + title + description + color); per step renders its `questions[]`.
3. Question options = `question.answers` (already resolved) or fetched per `model_name`.
4. Officer submits via existing `accident.add`/`accident.update`:
   - **relation-mapped** questions → existing ids in `set` (e.g. `collisionTypeId`, `roadDefectsIds`, `severityId`) — **same fields the web dashboard/analytics already read**;
   - **`dynamic`** questions → new `accident.dynamic_answers` array (§32).
5. Offline-first unchanged: the queued draft snapshots `process_version`; on re-sync the app refetches if the org's active version changed.

## 32. `accident` model additions ✅

- [x] `dynamic_answers: optional(array(object({
  step_key: optional(string()),
  question_key: optional(string()),
  model_name: string(),
  answer_id: optional(objectIdValidation),          // single-select
  answer_ids: optional(array(objectIdValidation)),  // multi-select
  answer_name: optional(string()),                  // snapshot (survives record deletion)
  answer_names: optional(array(string())),
  value: optional(string()),                        // free-text / number / boolean answers
})))` — pure embedded, polymorphic raw refs (justified per AGENTS.md: relations cannot live in embedded arrays + snapshot semantics).
- [x] `process_version: optional(number())` — which process version produced this report (audit + re-render guard).

## 33. Permission matrix (Part IV)

| Role | Build / edit processes | Activate | `getForPatrol` (read) |
| --- | --- | --- | --- |
| Ghost / Manager | All orgs | All orgs | — |
| OrgHead | Own org only | Own org only | — |
| UnitHead | — | — | Own unit read |
| Officer / Patrol | — | — | Own org (auto-scope) |

`activateProcess`/`duplicateProcess` are gated `Manager`/`OrgHead` with the org match enforced server-side (role `scopeType:"organization"` `scopeId` === process `organization._id`).

## 34. E2E — new `back/test/accident-process-test.ts` ✅ (8 tests)

- [x] Builder: `add` process with 2 steps (icon/description each) → questions: `collision_type` (all), `damage_severity` with `allowed_answer_ids` = 2 of 4, multi-select `road_defect` with 2 whitelisted. Verifies the **"3 of 50" whitelist** end-to-end.
- [x] `activateProcess` rejects: registry question with `target:"dynamic"`; non-consecutive step orders.
- [x] One-active-per-org(+type): a second process for a different `incident_type` activates fine; re-activating archives the previous active.
- [x] `getForPatrol` (Patrol token, role-scoped org) returns the active process; `answers:1` resolves **only** the whitelisted records (2-of-4 severity, 2-of-3 defects).
- [x] Submit `accident.add`: relation answers land in typed relations (`collision_type`, `road_defects` readable via ODM); a dynamic answer lands in `dynamic_answers` with `answer_name` snapshot + `process_version` set.
- [x] `duplicateProcess` clones steps+questions as a draft `(Copy)`, version 1.
- [ ] Cross-org: OrgHead B editing/activating OrgHead A's process rejected — **deferred**: builder acts are Manager-gated (OrgHead org-scoped enforcement is a follow-up).

## 35. Declarations & docs sync (Part IV)

- [x] Regenerated `back/declarations/selectInp.ts`; copied to `front/src/types/declarations/`; mobile type-check green.
- [x] `Models.md` + `AGENTS.md` relation maps (`accident_process`, `accident.dynamic_answers`/`process_version`).
- [x] Mark Part IV statuses here + `06-mobile-patrol-backend-todo.md`.

## 36. Mobile follow-up (NOT backend scope — tracked here for context)

- [ ] Ungate the incident tiles (§8) **and** render the wizard from `accident_process.getForPatrol` (steps pager, icon/color styling).
- [ ] Per-question option fetch (via resolved `answers` or `{model}.gets` with `_ids`), multi-select UI, required validation.
- [ ] Submit mapping: relation-mapped answers → existing `set` fields; `dynamic` answers → `dynamic_answers`; snapshot `process_version`.
- [ ] Offline re-sync: detect active-version change and refetch the wizard.
