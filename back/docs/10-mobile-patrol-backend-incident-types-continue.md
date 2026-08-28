# CONTINUE — Incident Types + Organizational Structure + Professional Warehousing + Accident Reporting Process Builder (Backend)

One-page next-task prompt. Full backlog + decision log: `09-mobile-patrol-backend-incident-types-todo.md` (§1–§9 incident types, **Part II** org structure incl. patrol units/officers, **Part III** warehousing incl. JIT, **Part IV** org-scoped accident reporting process builder). Mobile side (ungate + per-type form/mapper + wizard renderer) is a follow-up, referenced there in §8/§36.

**Scope expansion:** the project is moving from "three incident tiles" to a **professional platform** — (1) polymorphic incident types, (2) highway-as-organization with a real org chart (**patrol units + patrol officers are first-class nodes**), (3) professional warehousing incl. JIT, (4) **each organization designs its own patrol accident registration process** — steps with icons/descriptions, and each question *calls a database model* while whitelisting only a *subset of that model's records* as answers (50-record model → only the 3 selected). Prior art for (2)–(4) is the author's completed Satek project: `/Users/syd/work/sitak/lesanSatek/back` (models + `src/*`) and `/Users/syd/work/sitak/lesanSatek/front/backDocs` (docs `02`, `06`, `26`, `32`, `33`). Read those before starting Phases 3–6.

---

## Brief history (current state)

The mobile patrol app's incident entry page (`mobile/src/app/incident/index.tsx`) offers four type tiles. Only **تصادف** is live; **خرابی آزادراه**، **مانع یا خطر در مسیر**، **سایر رخدادها** are hard-gated behind «به‌زودی» because the backend has only the `accident` workflow:

- **Model:** `back/models/accident.ts` — full patrol meta (uuid idempotency, sync/review lifecycle, GeoJSON location, GPS, linear referencing), accident-specific DTOs, `attachments`.
- **Acts:** `accident.{add,update,get,gets,getMyReports,getSyncStatus,reviewReport,reviewHistory,resubmitReport,nearbyAccidents}` all work and are E2E-covered (see `back/test/patrol-operations-test.ts`, 41/41).
- **Reference data:** `road_defect`, `equipment_damage`, `damage_severity`, `position` already seeded via `shared/seedShared`.
- **Media:** `file.uploadAccidentImages` (base64 JSON contract) with categories `plate | insurance | croquis | facility_damage (alias damage) | other`.

**Decision (from TODO §read-first):** implement the three types as **one polymorphic report model** — add an `incident_type` discriminator + a small `incident_payload` struct to `accident` and reuse every existing act. Legacy docs without `incident_type` are accidents. No new model per type.

---

## Next task — Phase 1: model + seed (STOP after this phase for review)

Do **not** start server work until the two open decisions in the TODO §9 (D1 severity reuse, D2 photo category) are answered — they change the model/act shape. D3/D4 are already decided (enum, per-type `report_id` prefix).

### 1. Model — `back/models/accident.ts`
- Add to `accident_pure`:
  - `incident_type: optional(enums(["accident", "road_breakdown", "road_obstacle", "other"]))`
  - `incident_payload: optional(object({ description: optional(string()), is_hazard: optional(boolean()), needs_repair: optional(boolean()), temporary_action: optional(string()), follow_up_required: optional(boolean()) }))`
  - (per D1) `incident_severity` single relation → `damage_severity`, with the standard reverse `accidents` relation — or the new `incident_severity` model if D1 changed.
- If D1 = new model: create `models/incident_severity.ts` (shared-relation pattern from `models/vehicle_type.ts`), export in `models/mod.ts`, instantiate in `mod.ts`, register `setSharedActs("incident_severity", incident_severity)` in `src/shared/mod.ts`, add seed values in `seedShared.fn.ts`.

### 2. Seed — `src/shared/seedShared/seedShared.fn.ts`
- Extend `road_defect` beyond the current 3 values to cover خرابی: `روسازی`، `خط‌کشی`، `تابلو`، `روشنایی`، `حفاظ/گاردریل`، `مانع حریم`، `سایر` (idempotent — matches by exact name).
- (per D1) seed `incident_severity` values if the new model was created.

### 3. Shared set schema — `src/accident/accidentSetSchema.ts`
- Add `incident_type`, `incident_payload`, `incidentSeverityId` (optional) so `add` and `update` stay in sync (the schema is shared by both validators).

### 4. Verify
- `deno check mod.ts` — must stay clean (currently 0 errors on the patrol line; any new errors are ours and must be fixed).
- Regenerate `back/declarations/selectInp.ts` by starting the server once, then from repo root:
  `cp -rv back/declarations/selectInp.ts front/src/types/declarations/`
- `pnpm exec tsc --noEmit` in `mobile/` stays green (mobile types read the backend copy).
- Update `back/Models.md`.

---

## Phase 2 preview (next after Phase 1 review)

- `accident.add` / `accident.update` per-type validation + `report_id` prefix (`REP-/BRK-/OBS-/OTH-`) + default `incident_type`.
- `getMyReports` / `gets` `incidentType` filter.
- `nearbyAccidents` payload + `incident_type`.
- `file.uploadAccidentImages` incident photo category (per D2).
- Web dashboard/charts filter to `incident_type: "accident"`.
- E2E extension (see TODO §6).

---

## Phase 3 — Organizational structure (each highway = an organization) — STOP after this phase

Full spec + decisions D5–D8 in TODO §10–§16. **Ask the user to confirm D5/D6/D7 before coding** (they change model shape).

### 1. Models (`back/models/`)
- **`organization.ts`** (new): `code`, `name`, `enName`, `description`, `is_active`; relations `road` (1:1, required — reverse `road.organization`), `head` (User), `logo` (File), `registrer` (User). Unique index on `code`.
- **`unit.ts`** (new): `code`, `name`, `description`, `is_active`, `type` enum (`Patrol|Station|Ops|Maintenance|Logistics|Administration|Warehouse|General`), `address`, `phone`, `head_title`, `features`; relations `organization` (req, denormalized), `road` (req, denormalized), `parentUnit` (self, opt → reverse `subUnits`), `head` (User), `vehicles`, `officers`, `registrer`. Index `{ "organization._id": 1, type: 1 }`.
- **`user.ts`** (per D7): add `roles` array `[{roleId, name, scopeType?: "organization"|"unit", scopeId?}]` + `organizations`/`units` multiple relations (reverses `members`). Keep `level` + `patrol_permissions` untouched.

### 2. Migration & seed
- Manager-only, idempotent backfill act: `police_station` → `unit(type:Station)`, `patrol_unit` → `unit(type:Patrol)` (copy `vehicles`/`officers`), assign patrol users `roles:[{name:"Patrol"}]` + `units`.
- Stop instantiating `police_station`/`patrol_unit` in `mod.ts` (keep exports read-only one release, then delete).

### 2.5 Patrol unit & patrol officer (first-class, per TODO §12.5)
- Patrol unit = `unit(type:"Patrol")` with `organization`/`road` denormalized + `head` (سرگشت) + `vehicles`/`officers`.
- Patrol officer = `user` with `level:"Patrol"` **+** `roles:[{name:"Patrol", scopeType:"unit", scopeId}]` + `units`/`organizations` relations.
- **Guarantees:** `accident.getMyReports`/`reportScope.ts` still scope by `"officer._id"` (zero change); Patrol device login unchanged; `getForPatrol` (Phase 6) resolves org from `user.unit.organization`.

### 3. Acts
- `organization` + `unit` shared CRUD; `unit.add` guard: `road._id` must match `organization.road._id`, `parentUnit` must share `organization._id`.
- **`unit.getOrgChart`** custom act (port Satek `32-…md`): flag-bundled `units`/`organization`/`stats`, org auto-scope by role, flat array + `parentUnit: {_id, name}` for client `buildTree`.

### 4. Verify
- `deno check mod.ts` clean; regenerate declarations + copy to front/mobile; `Models.md`/`AGENTS.md` relation maps updated.

---

## Phase 4 — Professional warehousing (catalog + stock) — STOP after this phase

Full spec + decisions D9–D13 in TODO §17–§25. Reference: Satek `33-warehouse-hierarchy…md`, `26-consumption-inventory-warehouse-finalization.md`.

### 1. Catalog models — register via `setSharedActs` (D12)
- `ware_type` → `ware_class` → `ware_group` → `ware_model` → `ware` + `manufacturer`, all `{name, enName}` (+`ware` adds `brand, price, irc, gtin, photo_url`) with `registrer` relation.
- `ware_group` holds the only M:N (`wareClassIds` array, `replace: true` full-set on `updateRelations`).
- `ware` denormalizes all 4 hierarchy relations (this repo's Denormalized-Hierarchy convention).

### 2. Stock models
- **`inventory`**: `(unit, ware._id)` unique index; `min_quantity`/`max_quantity` as JIT reorder/safety; `warehouse_unit` opt relation (org warehouse).
- **`stock_movement`**: read-only audit trail, `reason` enum, `reference_type`/`reference_id`, before/after balances.
- **`consumption`**: `add` → `inventoryManager.removeStock` (+ movement).
- **`goods_receipt`**: `add` → `addStock`, auto `GR-{year}-{serial}`, embedded `items[]` with accepted/rejected qty + batch/expiry.
- **`utils/inventoryManager.ts`**: `addStock/removeStock/transferStock/adjustStock/getStockLevel/getWarehouseDashboard` — atomic inventory+movement writes; no user act writes `stock_movement` directly.

### 3. Acts + role scoping
- `inventory.{add,get,gets,adjust,transfer,count,getWarehouseInventory}`; `consumption.{add,get,gets,count}`; `goods_receipt.{add,get,gets,count}`; `stock_movement.{get,gets,count}`.
- Scoping (Satek §6): Manager/Ghost all; HighwayHead = org; UnitHead = own unit, **Warehouse-type unit head = all units**; Officer read-only own unit.

### 4. Seed + verify
- Extend `seedShared.fn.ts` with starter `ware_type`/`ware_class`/`ware_group`/`ware_model`/`manufacturer` sets (idempotent by exact name).
- `deno check mod.ts` clean; declarations regenerated + copied; `Models.md` updated.

---

## Phase 5 — JIT warehousing (replenishment on demand) — STOP after this phase

Full spec in TODO §21. The differentiator: minimal warehouse stock, deliver-to-consumer on demand.

- **`goods_request`** model + lifecycle `draft → pending → approved → issued → received` (JIT requisition/kanban).
- **Reorder-point scan**: inventory `quantity <= min_quantity` → auto `goods_request` for `max_quantity - quantity`, priority when ≤ `min_quantity * 0.5`.
- **Demand & lead time**: `avg_daily_demand` (from 30/90-day `consumption` aggregation), `ware.lead_time_days` + `ware.supplier`; effective reorder point = `avg_daily_demand × lead_time_days × 1.2` surfaced in `getWarehouseInventory` (`healthy | due | critical`).
- **Cross-dock**: `goods_receipt.cross_dock` → accepted qty issued straight to `target_unit` (no warehouse rest).
- **Kanban transfer**: `inventory.transfer` via `transferStock` for local rebalancing.
- JIT dashboard data via `unit.getOrgChart` `stats` flag extension or `warehouse.gets`.
- E2E: full reorder→approve→issue→receive cycle; cross-dock path; stock below reorder creates request only once.

---

## Phase 6 — Org-scoped accident registration & reporting process builder — STOP after this phase

The **"very important" feature** (TODO Part IV, §26–§36; decisions D14–D18). Each organization designs its **own** patrol accident registration process: steps with icons/descriptions, and each question **calls a database model** while showing only a **chosen subset of that model's records** as answers (a 50-record model → only the 3 selected). Reuses Satek's process-builder *mechanics* (`Process`/`ProcessStep`, `activateProcess`, `duplicateProcess`) but for a **form wizard**, not an approval chain (no assigneeGroups/StepApproval).

### 1. Models
- **`accident_process`**: `name`, `description`, `status: draft|active|archived`, `version`, `is_active`, optional `incident_type` (process per نوع رخداد); relations `organization` (req, reverse `accident_processes`), `registrer`. Unique partial index `{ "organization._id":1, incident_type:1 }` filtered `status:"active"`.
- **Embedded** `steps:[{ key, title, description, icon, color, order, required, questions:[…] }]`.
- **Embedded `question_schema`**: `{ key, question, description, icon, color, order, required, model_name (enum from questionRegistry), allowed_answer_ids: ObjectId[] (empty = all records), multi_select, target }`. `target = relation(path) | dto(dto,field) | dynamic`.
- **`accident` additions**: `dynamic_answers` array (polymorphic raw refs + name snapshots) + `process_version`.

### 2. Question-model registry — `src/accident_process/questionRegistry.ts`
- Maps `model_name → accident target`: `collision_type`, `damage_severity`, `road_defect`, `equipment_damage`, `vehicle_type`, `light_status`, `road_surface_condition`, `air_status`, `position`, + `dynamic` for free-text.
- Typed mapping (D14) keeps answers in typed relations → **analytics stay intact**; `dynamic` extras land in `accident.dynamic_answers`.

### 3. Acts — `src/accident_process/`
- CRUD (Manager/HighwayHead, org-scoped; `update` replaces `steps` wholesale).
- `activateProcess`: validate ≥1 step, consecutive orders, registry `model_name` + valid `target`, `allowed_answer_ids` exist in the model (`checkAnswerIds`); set active + bump `version`.
- `duplicateProcess`: clone steps+questions as a draft.
- `getForPatrol` (Patrol): returns active process for caller's org (+ `incidentType`), flag-bundled `answers:0|1` resolving each question's whitelisted records in parallel.

### 4. Verify
- `deno check mod.ts` clean; declarations regenerated + copied; `Models.md`/`AGENTS.md` updated.
- E2E `accident-process-test.ts`: builder → activate (reject cases) → `getForPatrol` returns only whitelisted answers ("3 of 50") → `accident.add` maps relation answers to typed fields and `dynamic` answers to `dynamic_answers` → duplicateProcess → cross-org rejection.

---

## Working rules

- **Follow `back/AGENTS.md`** — Prefer-Embedding / Prefer-Relations conventions, one-directional relations, hardCascade bottom line, dead-code convention.
- Every act keeps the `{ success, body }` envelope (framework default — don't break it).
- Lesan `insertOne` does **not** apply `defaulted` defaults — set `incident_type` explicitly in `add.fn` (see the existing `sync_status`/`review_status` defaulting).
- Persian user-facing error strings (raw backend errors must not reach the UI).
- Do not turn acts into REST paths; the mobile transports `{service, model, act, details:{set,get}}` as JSON to `/lesan`.
- Never log passwords, tokens, or file contents.
- Stop after each phase for review; don't batch phases.

## Toolchain

Node `v22.22.2` / pnpm `10.8.0` (via fnm) for the mobile type-check only; backend work uses the project's Deno setup (`deno task bc-dev` to run, `deno check mod.ts` to typecheck). E2E: `deno test -A test/patrol-operations-test.ts` against an isolated DB.

## Exit criteria

Incident types:
- [ ] `incident_type` + `incident_payload` in the model and shared set schema; legacy docs read as accidents.
- [ ] Per-type validation + `report_id` prefix + idempotency verified by E2E for all four types.
- [ ] `getMyReports`/`gets` filter by type; `nearbyAccidents` carries `incident_type`; review loop + `getSyncStatus` verified on a non-accident report.
- [ ] Web analytics exclude non-accident reports; `deno check mod.ts` clean; declarations regenerated + copied; `Models.md` + TODO statuses updated.
- [ ] Mobile ungate + per-type form/mapper tracked as a separate follow-up in `09-…todo.md` §8.

Org structure (Part II):
- [ ] `organization` + `unit` models live; `police_station`/`patrol_unit` migrated into `unit` and de-instantiated; user `roles` array in place (D5/D6/D7 confirmed first).
- [ ] **Patrol units (`type:"Patrol"`) + patrol officers (`roles:[{name:"Patrol"}]` + `units`/`organizations`) are first-class nodes**; `accident.getMyReports` patrol scoping unaffected.
- [ ] `unit.getOrgChart` returns the flat tree for the caller's org in one call; role scoping verified by E2E.
- [ ] Cross-org unit parent rejected.

Warehousing (Parts III + JIT):
- [ ] 6 catalog models registered via `setSharedActs` with seeded starter data; `ware` denormalized filters verified.
- [ ] `inventory`/`stock_movement`/`consumption`/`goods_receipt` + `inventoryManager` utility; role scoping incl. warehouse-head bypass E2E-covered.
- [ ] JIT cycle verified: reorder scan → `goods_request` → approve/issue/receive; cross-dock issues to target unit.

Reporting process builder (Part IV):
- [ ] `accident_process` with embedded steps/questions; org-scoped, one active per org(+incident_type).
- [ ] Question registry maps `model_name → accident target`; `allowed_answer_ids` whitelist works end-to-end (a 50-record model shows only the 3 selected); `getForPatrol` resolves answers in one call.
- [ ] `accident.add` persists relation-mapped answers in typed fields and `dynamic` answers in `dynamic_answers` (+ `process_version`); `activateProcess` validation + cross-org rejection E2E-covered.

## Out of scope (still blocked / product decisions)

- Road `area` geometry backfill (blocks snapping/zone — unchanged).
- Mobile-side per-type forms, ungate, and wizard renderer (handled separately; TODO §8/§36).
- «حریق» and «نقص تجهیزات» as first-class types — map to `other` until the enum is promoted to a reference model.
- Offline SOS fallback policy (emergency flow) — unrelated.
- Procure-to-pay / tender / budget (Satek's `purchasingRequest`+`tender`+`budgetLine` chain) — deferred; only the slim JIT `goods_request` is in scope for now (D13).
- `store`/`stuff` vendor marketplace (Satek's seller-side) — out of scope until a vendor/auction workflow is requested (D9).
- Step/question **approval chains** (Satek `assigneeGroups`/`StepApproval`) — the process builder drives a form wizard, not a multi-unit approval flow; the existing `reviewReport` loop stays the review layer.
