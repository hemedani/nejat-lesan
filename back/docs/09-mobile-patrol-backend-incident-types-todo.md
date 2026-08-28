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

- [ ] Add `incident_type` to `accident_pure`:
  ```ts
  incident_type: optional(enums(["accident", "road_breakdown", "road_obstacle", "other"])),
  ```
  (Server-side default `accident` when absent — Lesan `insertOne` does **not** apply `defaulted` defaults, set it explicitly in `add.fn`, mirroring the existing `sync_status`/`review_status` handling.)
- [ ] Add `incident_payload` (pure scalars only; references stay top-level relations):
  ```ts
  incident_payload: optional(object({
    description: optional(string()),        // شرح خرابی/مانع/رخداد
    is_hazard: optional(boolean()),         // آیا خطر جانی/تصادف دارد؟
    needs_repair: optional(boolean()),      // نیاز به تعمیر دارد؟
    temporary_action: optional(string()),   // اقدام موقت انجام‌شده
    follow_up_required: optional(boolean()),// نیاز به پیگیری/نیروی اعزامی
  })),
  ```
- [ ] Add `incident_severity` single relation → **`damage_severity`** (reuse; decision §9-D1 to swap to a dedicated `incident_severity` model). Reverse `accidents` relation on `damage_severity` as needed.
- [ ] Document that existing top-level relations are **reused for non-accident semantics** (no schema duplication):
  - `road_defects` (multiple → `road_defect`) — the خرابی/مانع subject
  - `equipment_damages` (multiple → `equipment_damage`) — نقص تجهیزات
  - `lane` (single → `position`) — affected lane
  - `road`, `kilometer`, `meter`, `travel_direction` — linear referencing (unchanged)
  - `attachments` — photos of the incident
- [ ] If §9-D1 resolves to a **new** `incident_severity` model: create `models/incident_severity.ts` (shared-relation pattern, `registrer` relation), export from `models/mod.ts`, instantiate in `mod.ts`, register via `setSharedActs`, add to the seed map.
- [ ] Confirm the 2dsphere index on `location` already covers all incident types (it does — same field) and that no per-type index is needed.

## 2. Reference data / seed

- [ ] Extend the `road_defect` seed (`src/shared/seedShared/seedShared.fn.ts`) beyond the current 3 values («نقص گاردریل»، «آبگرفتگی»، «محدودیت دید») to cover خرابی آزادراه properly. Aligned with `Design.md` §defect: `روسازی`، `خط‌کشی`، `تابلو`، `روشنایی`، `حفاظ/گاردریل`، `مانع حریم`، `سایر`. Keep existing names (idempotent seed matches by exact `name`).
- [ ] Confirm `damage_severity` values (جزئی/متوسط/شدید/تخریب کامل) are acceptable as incident severity, or seed a dedicated `incident_severity` (کم/متوسط/زیاد/بحرانی) per §9-D1.
- [ ] `position` already seeds خط ۱/خط ۲/شانه راست/شانه چپ — sufficient for the affected-lane picker.

## 3. Acts — validation & behavior per type

### 3.1 `accident.add` (`src/accident/add/`)
- [ ] `add.val.ts` (via `accidentSetSchema`): add `incident_type` enum + `incident_payload` object + `incidentSeverityId` relation id.
- [ ] `add.fn.ts`:
  - Default `incident_type = "accident"` when absent.
  - **Per-type validation** (pure, before insert):
    - `accident`: current behavior, no change.
    - `road_breakdown` / `road_obstacle` / `other`: require `location` + at least one of `incident_payload.description` / `roadDefectsIds` / `equipmentDamagesIds`; **reject** accident-only fields (`vehicle_dtos`, `passenger_dtos`, `pedestrian_dtos`, `people_dtos`, `facility_damage_dtos`, `collisionTypeId`, `typeId`) with a clear Persian error.
  - **Report id by type** (requirement 02 §5: "Unique Report ID based on incident type"):
    - keep `REP-${year}-${serial}` for `accident` (backward compat, web regex search unaffected);
    - `BRK-`, `OBS-`, `OTH-` prefixes for the other three. Single shared `serial` counter stays unique across all types.
  - Keep idempotency-by-uuid, Patrol `draft|queued` enforcement, and forced `officerId` attribution unchanged.
- [ ] Update the idempotency lookup so a re-submit returns the existing record regardless of type (it already matches on `client_report_uuid` — just verify).

### 3.2 `accident.update` (`src/accident/update/`)
- [ ] `update.val.ts` + `accidentSetSchema`: same new fields.
- [ ] `update.fn.ts`: apply the same per-type validation to the merged `$set`. Reject changing `incident_type` on a report that is `synced`/`rejected` or already in review (`review_status !== "submitted"`), so a submitted accident can't be silently re-labeled as an obstacle.

### 3.3 `accident.getMyReports` (`src/accident/getMyReports/`)
- [ ] `getMyReports.val.ts`: add optional `incidentType` set filter (`enums([...])`).
- [ ] `getMyReports.fn.ts`: apply `filters.incident_type = incidentType` when provided. Patrol scoping (`officer._id`) unchanged. Projections auto-include new fields via `selectStruct`.

### 3.4 `accident.gets` / `accident.get` (Manager/web + shared lists)
- [ ] `gets.val.ts`: add optional `incidentType` filter.
- [ ] Verify `selectStruct("accident", 1)` exposes `incident_type` + `incident_payload` (auto) so the web dashboard can filter.

### 3.5 `accident.getSyncStatus`
- [ ] No change required (buckets by `sync_status`, all types). Optional: add `incidentType` filter for Manager/Ghost. Mark verified via E2E.

### 3.6 Review loop — `reviewReport` / `resubmitReport` / `reviewHistory`
- [ ] No code change; verify (E2E) the embedded `review_history` flow works on a non-accident report (returned → update-by-uuid → `resubmitReport` → `submitted`).

### 3.7 Map overlay — `accident.nearbyAccidents` (`src/accident/maps/nearbyAccidents/`)
- [ ] Add `incident_type` (and `incident_severity.name` if useful) to the lightweight payload so the mobile Map can render type-specific markers. Bounding-box + synced-only + `can_view_map` gating unchanged.

### 3.8 Media — `file.uploadAccidentImages`
- [ ] Decide the category for incident photos (§9-D2): recommendation is a new `incident` category (max count ~10) or reuse `other` (max 20). `plate`/`insurance`/`croquis`/`facility_damage` stay accident-only.
- [ ] Verify ownership check (`accidentId` belongs to the officer) already covers non-accident reports — it keys off the `accident` relation, so no change expected; confirm by E2E.

## 4. Declarations & type sync

- [ ] Start the server once to regenerate `back/declarations/selectInp.ts` (the declaration generator runs on boot).
- [ ] From repo root: `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` so the frontend and mobile `@backend/selectInp` alias stay in sync.
- [ ] Confirm mobile `pnpm exec tsc --noEmit` still passes against the backend copy.
- [ ] Update `back/Models.md` (accident schema, incident_type/incident_payload, new references if added).
- [ ] Update `06-mobile-patrol-backend-todo.md` and this file's statuses when done.

## 5. Permission & validation matrix (target state)

| Type | Required (server-enforced) | Forbidden (server-rejected) | report_id prefix |
| --- | --- | --- | --- |
| `accident` | `location`, `date_of_accident` (current) | — | `REP-` |
| `road_breakdown` | `location` + description / road_defects / equipment_damages | vehicle/people/facility/collision/severity-type fields | `BRK-` |
| `road_obstacle` | `location` + description / road_defects | accident DTOs | `OBS-` |
| `other` | `location` + description | accident DTOs | `OTH-` |

Patrol can only set `draft|queued` and only their own reports (unchanged). Manager/Ghost may set any sync status and review all types (unchanged).

## 6. E2E tests — extend `back/test/patrol-operations-test.ts`

Follow the existing harness (isolated DB `nejat_patrol_ops_test`, `runAct` helper that runs preActs + validator + fn with a real JWT).

- [ ] Add one of each non-accident type via `accident.add` (Patrol token) → 200, correct `incident_type`, correct `report_id` prefix, `officerId` forced.
- [ ] Idempotency: re-add same `client_report_uuid` → returns existing doc, no duplicate (all types).
- [ ] Negative: non-accident report with `vehicle_dtos` rejected; `accident` with no `date_of_accident` rejected as today.
- [ ] Patrol trying to set `sync_status: "synced"` rejected (all types).
- [ ] `getMyReports` `incidentType` filter returns only that type; Patrol scoping intact.
- [ ] Update-by-uuid on a non-accident report; `incident_type` change rejected once `review_status !== submitted`.
- [ ] Full review loop on a non-accident report: Manager returns → Patrol `resubmitReport` → `submitted`, `review_reason` cleared, `review_history` pushed.
- [ ] `getSyncStatus` buckets include non-accident reports.
- [ ] `nearbyAccidents` payload includes `incident_type`.
- [ ] Upload an `incident`/`other` photo linked to a non-accident report → linked in `attachments`.
- [ ] Backward compat: a legacy doc without `incident_type` is treated as `accident` (add path defaults it; existing docs read fine).

## 7. Web dashboard (frontend) impact

- [ ] `accident.gets` now returns non-accident reports too — decide whether the patrol **dashboard** list/charts filter to `incident_type: "accident"` or gain a type filter. Charts/analytics (`src/accident/charts/*`) hardcode accident semantics — add `incident_type: "accident"` to their pipelines so the new types don't corrupt accident analytics.
- [ ] `patrol-projections.ts` / report list: include `incident_type` for badge/label rendering (frontend follow-up).

## 8. Mobile handoff (follow-up, NOT this backend scope)

- [ ] Mobile `src/app/incident/index.tsx`: ungate the three tiles and send the chosen type.
- [ ] Mobile per-type form/mapper: `incident_payload` + reference pickers (road_defect/equipment_damage/incident_severity/lane), no vehicle/people phases.
- [ ] Mobile sync worker serialization: emit `incident_type` + `incident_payload`; queue/reports list render a type label; the `draft → queued → syncing → synced` transition and update-by-uuid correction loop are shared unchanged.
- [ ] Mobile Map tab: render non-accident markers from `nearbyAccidents` payload.

## 9. Decision log

| # | Question | Recommendation | Status |
| --- | --- | --- | --- |
| D1 | Incident severity: reuse `damage_severity` vs new `incident_severity` | **Reuse `damage_severity`** (zero new code); promote later if product wants a distinct scale | `[?]` |
| D2 | Incident photo category | **New `incident` category** (max 10, ≤5MB) or reuse `other` (max 20) — pick one and pin in `uploadAccidentImages` | `[?]` |
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
| D5 | How does "highway = organization" get modeled? | **New `organization` model with a required 1:1 `road` relation** (org lifecycle/people separate from road geometry/linear referencing). Alternative (fold org fields straight into `road`) rejected: mixes geometry with people/structure and makes the unit tree awkward. | `[?]` decide up front |
| D6 | What happens to `patrol_unit` / `police_station`? | **Fold into `unit`** (`type: "Patrol" | "Station" | …`) and migrate; keep `vehicles`/`officers`/`commander` as relations on `unit`. Delete the two flat models afterward (dead-code convention). This is the professional end-state; a *stopgap* variant keeps them and adds an optional `unit` parent relation, but then the chart has two node kinds. | `[?]` recommend fold |
| D7 | User scoping: extend `level` vs add `roles` array? | **Add Satek-style `roles:[{roleId,name,scopeType:"organization"|"unit",scopeId}]`** (backward-compatible: existing users get `[{name:"Patrol"|…}]` with no scope). Keep `level` as the coarse auth gate (Patrol device login, Ghost bootstrap) and use `roles` for org/unit scoping. `user.settings.cities/provinces` (Enterprise filter denormalization) stays untouched. | `[?]` recommend roles array |
| D8 | Chart root & scoping by role | `Manager/Ghost` see all orgs (must pass `orgId`); **OrgHead/HighwayHead** auto-resolved from `role.scopeId`; `UnitHead` scoped to own unit subtree. Model exactly on Satek `unit.getOrgChart` (§16). | `[x]` decided |

## 12. Model changes — `back/models/`

### 12.1 `organization.ts` (new)

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

### 12.2 `unit.ts` (new)

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

### 12.3 `user.ts` — add roles + org/unit membership (per D7)

```ts
role_array = ["Ghost", "Manager", "HighwayHead", "UnitHead", "Officer", "Editor", "Enterprise", "Patrol"];
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

### 12.4 Migration of existing data

- [ ] One-time backfill act (Manager-only, idempotent): for each existing `patrol_unit` create a `unit` of `type:"Patrol"` with `organization` = the org of its `police_station` (or a per-road default org), copy `vehicles`/`officers` relation ids, set `head` from first officer if possible.
- [ ] For each `police_station` create a `unit` `type:"Station"`, link its `patrol_units` as `subUnits`.
- [ ] Assign every patrol `user` a `roles:[{name:"Patrol"}]` + `units` relation pointing at their unit.
- [ ] Keep `police_station`/`patrol_unit` **exported but uninstantiated** in `mod.ts` for one release (read-only), then delete per dead-code convention (see §18 of this doc for the warehouse-era cleanup too).

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

### 13.1 Shared CRUD

- [ ] `organization`: `add/get/gets/update/updateRelations/remove/count`. `add` requires `roadId` + `headId?` (Manager only). `updateRelations` handles `headId`/`logoId` (single, `replace: true`).
- [ ] `unit`: `add/get/gets/update/updateRelations/remove/count`. `add` requires `organizationId`, `roadId`, `parentUnitId?`, `headId?`. **Guard:** a `unit`'s `road._id` must equal its `organization.road._id` and any `parentUnit` must share the same `organization._id` (server-side check — prevents cross-org trees).
- [ ] `unit.gets` filters: `search` (code/name text), `organizationId`, `roadId`, `type`, `parentUnitId`, `headId`.
- [ ] Deletion: children first; `hardCascade: hardCascade || false` (org/unit delete blocked while reverse `units`/`subUnits` exist).

### 13.2 `unit.getOrgChart` (custom action — port of Satek `32-unit-getOrgChart-api.md`)

- [ ] Single POST; `set:{ activeRoleId }` + optional `orgId` (Manager/Ghost). Auto-resolve org from role scope for HighwayHead.
- [ ] Flag-bundled `get`: `units:0|1` (flat array + `totalCount`), `organization:0|1` (org header incl. head + logo), `stats:0|1` (per-type counts, aggregation via `$group` on `type`).
- [ ] Returns `parentUnit: { _id, name }` + `head: { _id, first_name, last_name }` + `type` on each unit — the client rebuilds the tree (`buildTree` by `parentUnit._id`), exactly like Satek's `OrgChartClient`.
- [ ] All sections run in parallel via `Promise.all`; no pagination (org unit count is small — Satek hard cap ~200 nodes per org).
- [ ] Gate: `grantAccess({ levels:["Ghost","Manager"] })` OR role-scope check for `HighwayHead`/`UnitHead`.

### 13.3 Existing acts — impact check

- [ ] `accident.getMyReports` / `reportScope.ts`: Patrol scoping is by `"officer._id"` — **no change**; verify via E2E.
- [ ] `shift`, `emergency`, `patrol_unit`-linked acts: swap `patrol_unit` refs to `unit` where D6 folds them (list every `src/patrol_unit/` act as migration todo).
- [ ] Enterprise dashboard (`user.settings` filter denormalization) keeps working — it is pure-field, org-independent.

## 14. Permission & scoping matrix (Part II target)

| Role | Org chart | Units (`unit.gets`) | Users (`user.gets`) | Warehouse (Part III) |
| --- | --- | --- | --- | --- |
| Ghost / Manager | All orgs (must pass `orgId`) | All | All | All |
| HighwayHead | Own org (auto-scope) | Own org | Own org | Own org |
| UnitHead | Own unit subtree | Own unit subtree | Own unit members | Own unit (+ warehouse bypass, Part III) |
| Officer / Patrol | — | Own unit read | — | — |

## 15. E2E — extend `back/test/patrol-operations-test.ts` (or new `organization-test.ts`)

- [ ] Create org A (linked to road R) + org B (road S). Cross-org unit parent must be rejected.
- [ ] Create unit tree: HQ → Station → Patrol, with `head` and `vehicles`/`officers` relations.
- [ ] `unit.getOrgChart` as HighwayHead (auto-scope, no `orgId`) returns only own org flat list with correct `parentUnit`; Manager with `orgId` gets either.
- [ ] Role scoping: `unit.gets` as UnitHead only returns own subtree; as HighwayHead only own org.
- [ ] Migration idempotency: running the backfill twice creates no duplicate `unit` docs.
- [ ] `accident.getMyReports` still scoped to officer after folding patrol_unit → unit.
- [ ] Deletion guards: deleting org with units blocked; deleting leaf unit OK.

## 16. Declarations & docs sync (Part II)

- [ ] Regenerate `back/declarations/selectInp.ts`; `cp -rv` to `front/src/types/declarations/`; mobile `pnpm exec tsc --noEmit` green.
- [ ] Update `back/Models.md` (organization, unit, user.roles) + `AGENTS.md` relation maps (complete `unit` map incl. reverses).

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
| D9 | Port the full 4-level catalog? | **Yes** — `ware_type → ware_class → ware_group → ware_model → ware` + `manufacturer`, exactly as Satek (denormalize all 4 refs onto `ware`; `ware_model` is the SKU ref used by inventory). Skip `store`/`stuff` (this domain buys, doesn't sell) until a vendor/auction workflow is requested. | `[?]` recommend yes |
| D10 | Inventory granularity | **One `inventory` per `(unit, ware._id)`** with a unique compound index (Satek used `(unit, wareModel._id)`; we recommend ware-level so brand/lot matter). `min_quantity`/`max_quantity` = JIT reorder/safety ceiling. | `[?]` recommend ware-level |
| D11 | JIT mechanism (phase 2 of Part III) | Reorder-point triggers + **cross-dock delivery** (goods arrive → issue straight to consuming unit) + **kanban-style `goods_request`** between units, with lead-time + demand-rate fields. See §21. | `[?]` recommend |
| D12 | Which catalog models register via `setSharedActs`? | `ware_type`, `ware_class`, `ware_group`, `ware_model`, `ware`, `manufacturer` → **`setSharedActs`** (name-only CRUD, Manager-gated) exactly like `damage_severity`/`vehicle_type` today. Inventory/movement models get full custom acts. | `[x]` decided |
| D13 | Fiscal year / budget / purchasing RFQ | **Defer.** A slim `goods_request`/`purchase_order` line for JIT is enough; full procure-to-pay (tender/budget) is future scope. | `[x]` decided |

## 19. Catalog models (new, in `back/models/`)

All five follow the Satek pattern verbatim (see `33-warehouse-hierarchy…md` §3) with `shared_relation_pure` fields + `registrer` relation, text index on `name`/`enName`:

```
ware_type    (level 1)  name, enName                    — no parents
ware_class   (level 2)  name, enName, ware_type(1:1 req)
ware_group   (level 3)  name, enName, ware_type(1:1 req),
                        ware_classes (M:N via wareClassIds array)   ⭐ only M:N in the hierarchy
ware_model   (level 4)  name, enName, ware_type, ware_class, ware_group (all 1:1 req)  ⭐ SKU ref
ware         (product)  name, enName, brand, price, irc, gtin, photo_url,
                        manufacturer(opt), ware_type, ware_class, ware_group, ware_model (1:1 req, denormalized)
manufacturer name, enName, country
```

- `ware` denormalizes all 4 relations (repo's Denormalized-Hierarchy convention) so filters like `"ware_type._id"` are single-doc queries.
- `ware_group.updateRelations` accepts `wareClassIds` **array** + `replace: true` (full-set semantics — document for the frontend, Satek §7.2).

## 20. Stock & movement models (new, in `back/models/`)

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
- **JIT flag:** `cross_dock: defaulted(boolean(), false)` + `target_unit` (opt) — when true, accepted stock is `addStock`-ed to `target_unit` instead of `receiving_unit`, and a `stock_movement` with `reason:"goods_issue"` is written (see §21.4).

### 20.5 `inventoryManager.ts` utility (port `sitak/.../utils/inventoryManager.ts`)
- `addStock(unitId, wareId, quantity, reason, userId, {batch_no, expiration_date, reference_type, reference_id, cross_dock_target?})`
- `removeStock(...)`, `transferStock(fromUnitId, toUnitId, wareId, quantity, userId, ...)`, `adjustStock(...)`, `getStockLevel(unitId, wareId)`, `getWarehouseDashboard(warehouseUnitId, ...)`.
- **Every call atomically** upserts inventory + writes `stock_movement` (before/after balances). No user act writes `stock_movement` directly.

## 21. JIT (Just-In-Time) warehousing design

### 21.1 Core idea
Keep **warehouse stock minimal**; deliver to the consuming unit **on demand**, triggered by real consumption rather than calendar. Concretely:

### 21.2 Reorder-point trigger (`inventory.checkReorder` custom act or a batch scan)
- [ ] Scan all `inventory` where `quantity <= min_quantity` and `min_quantity > 0`.
- [ ] For each hit, auto-create a **`goods_request`** (new slim model, or embedded queue) from the owning unit's `warehouse_unit` back to the supplier/central — with `requested_quantity = max_quantity - quantity` (replenish-to-ceiling) and `priority` when `quantity <= min_quantity * 0.5`.
- [ ] `goods_request` lifecycle: `draft → pending → approved (UnitHead/HighwayHead) → issued → received`. Issued = `addStock` at target; received = `addStock` at consuming unit + `removeStock` at warehouse + `transfer_in/out` movements.

### 21.3 Demand & lead time (JIT analytics fields)
- [ ] `inventory.avg_daily_demand` (computed from last-30/90-day `consumption` aggregation; scheduled `deno cron` job or on-read lazy compute).
- [ ] `ware.lead_time_days` (supplier lead time) + `ware.supplier` (opt, → `manufacturer`).
- [ ] Effective reorder point = `avg_daily_demand * lead_time_days * safety_factor(1.2)` — surfaced in `getWarehouseInventory` so the warehouse head sees `status: healthy | due | critical`.

### 21.4 Cross-dock (bypass central stock)
- [ ] `goods_receipt.cross_dock=true` → accepted qty goes straight to `target_unit` (issue movement), never resting in the warehouse. Ideal for گاردریل/نیوجرسی bulk deliveries to a specific maintenance unit.

### 21.5 Kanban transfer between units
- [ ] `inventory.transfer` (port) → `transferStock` for audit. Used for local rebalancing (unit A surplus → unit B shortage) without a purchase.

### 21.6 JIT dashboard (extension of `unit.getOrgChart` `stats` flag or new `warehouse.gets`)
- [ ] Per org: total SKUs, units under reorder point, open `goods_request`s, cross-dock receipts this month, total stock value (`Σ quantity × ware.price`).

## 22. Acts & setup (Part III)

- [ ] `setSharedActs` registration for the 6 catalog models in `src/shared/mod.ts` (seed map too — D12).
- [ ] `inventory`: `add` (upsert + scope check), `get`, `gets` (role-scoped, filters incl. `organizationId`, `unitId`, `wareTypeId`, `search`), `adjust`, `transfer`, `count`, `getWarehouseInventory` (aggregation, warehouse-head bypass).
- [ ] `consumption`: `add` (→ `removeStock`; auto-derive `unit` from role scope), `get`, `gets`, `count`.
- [ ] `goods_receipt`: `add` (→ `addStock`/cross-dock, auto `GR-{year}-{serial}`), `get`, `gets`, `count`.
- [ ] `stock_movement`: `get`, `gets`, `count` only (read-only).
- [ ] `goods_request` (JIT): `add`, `approve`, `issue`, `receive`, `gets`, `count`.
- [ ] **Role scoping** (Satek §6): Manager/Ghost = all; HighwayHead = `"unit.organization._id"`; UnitHead = own unit (Warehouse-type unit head = all units, the warehouse bypass); Officer = read-only own unit.
- [ ] Every act keeps `{ success, body }` envelope; Persian user-facing errors.

## 23. Seed (extend `src/shared/seedShared/seedShared.fn.ts`)

- [ ] Add `ware_type` (e.g. تجهیزات ایمنی، علائم و تابلو، روشنایی، پوشاک و تجهیزات فردی، ملزومات اداری، اقلام راهداری), `ware_class`/`ware_group`/`ware_model` minimal starter sets, `manufacturer` (generic).
- [ ] Extend `road_defect`/`equipment_damage` seed per §2 (already a todo above) — these overlap with catalog items; keep reference models and catalog **distinct** (catalog = tracked stock; reference = incident taxonomy).
- [ ] Seed idempotent by exact `name` (existing pattern).

## 24. E2E — new `back/test/warehouse-test.ts`

- [ ] Catalog CRUD incl. `ware_group` M:N (`wareClassIds` array) + `ware` denormalized filtering.
- [ ] `inventory.add` upsert (same unit+ware twice → one doc, updated).
- [ ] `consumption.add` decrements inventory + writes `stock_movement` with before/after; insufficient stock rejected.
- [ ] `goods_receipt.add` increments inventory, writes movement, auto `GR-` number; `cross_dock=true` issues to `target_unit`.
- [ ] `inventory.transfer` moves quantity + writes `transfer_out`/`transfer_in`.
- [ ] Reorder scan creates `goods_request`; approve → issue → receive completes a JIT cycle.
- [ ] Role scoping: UnitHead sees own unit; Warehouse-head sees all; HighwayHead sees org.
- [ ] `stock_movement` has no `add` act (403/validation).

## 25. Declarations & docs sync (Part III)

- [ ] Regenerate `back/declarations/selectInp.ts`; copy to `front/src/types/declarations/`; mobile type-check green.
- [ ] `back/Models.md` + `AGENTS.md` relation maps for all new models (one-directional rules; warehouse `unit` reverses documented).
- [ ] Mark Part II/III statuses in this file + `06-mobile-patrol-backend-todo.md`.

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
| D14 | Question → storage mapping | **Typed registry (recommended):** each question maps to a known accident field/relation via a `target` spec, so answers persist in typed relations → the analytics system stays intact. Free-text/org-specific extras go to an embedded `accident.dynamic_answers` fallback. Fully-dynamic-only rejected: would orphan the charts. | `[?]` recommend typed |
| D15 | Steps/questions: models vs embedded | **Embedded** `steps:[{…, questions:[{…}]}]` on the process doc (mirrors Satek embedding `assigneeGroups`). Counts per process are small (4–10 steps × 3–15 questions); nothing else references a step; editing = save draft, activate bumps version. | `[?]` recommend embed |
| D16 | Question source models | Fixed code registry `questionRegistry` in `src/accident_process/` — maps `model_name → accident target`, `multi_select` default, icon. `model_name` enum is generated from it; new reference models register by extending the enum + registry. | `[?]` |
| D17 | Answer-record whitelist | `allowed_answer_ids: ObjectId[]` on each question; **empty = all records**, non-empty = only those (the "3 of 50" case). Raw refs justified (polymorphic: a question can point to any model's records; snapshots survive record deletion). If an allowed record is deleted → log + fall back to all (`is_partial: true`). | `[?]` |
| D18 | Process scope & concurrency | Scoped to `organization` (+ optional `incident_type` so a highway can define separate processes for تصادف vs خرابی vs سایر). **One active process per org+type**: unique partial index on `{ "organization._id": 1, incident_type: 1 }` filtered `status:"active"`. | `[?]` |

## 28. Models

### 28.1 `accident_process.ts` (new)

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

## 30. Acts — `src/accident_process/`

- [ ] **CRUD** (`Manager`/`HighwayHead`, org-scoped): `add` (draft), `get`, `gets` (filters: `organizationId`, `status`, `incident_type`, `search`), `update` (pure fields + wholesale `steps` array replace — the builder saves the draft as a whole), `remove`, `count`.
- [ ] **`activateProcess`** — mirrors Satek: validates → ≥1 step; step `order` consecutive 1..N; every question has a registry `model_name` + valid `target`; each non-empty `allowed_answer_ids` actually exists in that model's collection (`checkAnswerIds`); then `status:"active"`, `is_active:true`, `version += 1`. Rejects if already active. Rejects empty `allowed_answer_ids` when the model has 0 records.
- [ ] **`duplicateProcess`** — clones the process + embedded steps/questions as `{name} (Copy)`, draft, version 1.
- [ ] **`getForPatrol`** (custom, Patrol) — returns the **active** process for the caller's org (+ optional `incidentType`). Flag-bundled `get`: `process:0|1`, `answers:0|1`. Auto-resolves org from `user.unit.organization` or `user.organizations`. This is the **only** endpoint the mobile wizard needs to render itself.
- [ ] **`checkAnswerIds`** (helper, not a public act): validates allowed ids belong to the referenced model; used by `add`/`update`/`activateProcess`.

## 31. Runtime flow (Patrol mobile — see also follow-up §36)

1. Officer opens «ثبت گزارش» → `accident_process.getForPatrol({ incidentType, get:{ process:1, answers:1 } })`.
2. App renders the step pager from `steps[]` (icon + title + description + color); per step renders its `questions[]`.
3. Question options = `question.answers` (already resolved) or fetched per `model_name`.
4. Officer submits via existing `accident.add`/`accident.update`:
   - **relation-mapped** questions → existing ids in `set` (e.g. `collisionTypeId`, `roadDefectsIds`, `severityId`) — **same fields the web dashboard/analytics already read**;
   - **`dynamic`** questions → new `accident.dynamic_answers` array (§32).
5. Offline-first unchanged: the queued draft snapshots `process_version`; on re-sync the app refetches if the org's active version changed.

## 32. `accident` model additions

- [ ] `dynamic_answers: optional(array(object({
  step_key: optional(string()),
  question_key: optional(string()),
  model_name: string(),
  answer_id: optional(objectIdValidation),          // single-select
  answer_ids: optional(array(objectIdValidation)),  // multi-select
  answer_name: optional(string()),                  // snapshot (survives record deletion)
  answer_names: optional(array(string())),
  value: optional(string()),                        // free-text / number / boolean answers
})))` — pure embedded, polymorphic raw refs (justified per AGENTS.md: relations cannot live in embedded arrays + snapshot semantics).
- [ ] `process_version: optional(number())` — which process version produced this report (audit + re-render guard).

## 33. Permission matrix (Part IV)

| Role | Build / edit processes | Activate | `getForPatrol` (read) |
| --- | --- | --- | --- |
| Ghost / Manager | All orgs | All orgs | — |
| HighwayHead | Own org only | Own org only | — |
| UnitHead | — | — | Own unit read |
| Officer / Patrol | — | — | Own org (auto-scope) |

`activateProcess`/`duplicateProcess` are gated `Manager`/`HighwayHead` with the org match enforced server-side (role `scopeType:"organization"` `scopeId` === process `organization._id`).

## 34. E2E — new `back/test/accident-process-test.ts`

- [ ] Builder: `add` process with 2 steps (icon+description each) → questions: `model_name: collision_type` (all 7), `damage_severity` with `allowed_answer_ids` = 2 of 4, multi-select `road_defect` with 2 of 7. Verifies the **"3 of 50" whitelist** end-to-end.
- [ ] `activateProcess` rejects: 0 steps / non-consecutive orders / unknown `model_name` / `allowed_answer_ids` not in the model / registry question with `target:"dynamic"`.
- [ ] One-active-per-org(+type): second `activateProcess` rejects; partial unique index holds.
- [ ] `getForPatrol` (Patrol token) returns the active process; `answers:1` resolves **only** the whitelisted records (3-of-50 pattern).
- [ ] Submit `accident.add`: relation-mapped answers land in typed relations (analytics-readable); a `dynamic` question lands in `dynamic_answers` with `answer_name` snapshot + `process_version` set.
- [ ] `duplicateProcess` clones steps+questions as a draft.
- [ ] Cross-org: HighwayHead B editing/activating HighwayHead A's process rejected.

## 35. Declarations & docs sync (Part IV)

- [ ] Regenerate `back/declarations/selectInp.ts`; copy to `front/src/types/declarations/`; mobile type-check green.
- [ ] `Models.md` + `AGENTS.md` relation maps (`accident_process`, `accident.dynamic_answers`/`process_version`).
- [ ] Mark Part IV statuses here + `06-mobile-patrol-backend-todo.md`.

## 36. Mobile follow-up (NOT backend scope — tracked here for context)

- [ ] Ungate the incident tiles (§8) **and** render the wizard from `accident_process.getForPatrol` (steps pager, icon/color styling).
- [ ] Per-question option fetch (via resolved `answers` or `{model}.gets` with `_ids`), multi-select UI, required validation.
- [ ] Submit mapping: relation-mapped answers → existing `set` fields; `dynamic` answers → `dynamic_answers`; snapshot `process_version`.
- [ ] Offline re-sync: detect active-version change and refetch the wizard.
