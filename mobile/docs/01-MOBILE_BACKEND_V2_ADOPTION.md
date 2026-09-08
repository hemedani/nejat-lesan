# 01 — Mobile Backend-v2 Adoption: incident types · org/unit membership · process wizard · module licensing

Copy everything below this line into your mobile AI agent (an opencode/Expo session rooted at `mobile/`). The authoritative product backlog is `mobile/docs/TODO.md`; the single-page next-task prompt is `mobile/docs/CONTINUE.md`; the UI/UX spec is `mobile/docs/Design.md`. Backend authority and the full decision log for the backend half live in `back/docs/09-mobile-patrol-backend-incident-types-todo.md` and `back/docs/10-mobile-patrol-backend-incident-types-continue.md` (read them; §8/§36 are the mobile handoff). The web frontend already adopted this backend (`front/docs/49`/`50`) — mirror its module-gating UX patterns.

---

## Role & goal

You are working on the **Expo SDK 57 / React Native patrol app** (`mobile/`) of LESEN. The backend (Deno/Lesan, port 1404) shipped a new architecture on **2026-09-07** (repo `HEAD`): the patrol domain is now licensed behind the **`incident_patrol` module**, patrol units/officers became **org-chart nodes** (`organization`/`unit`/`user.roles`), `accident` is a **polymorphic report** carrying `incident_type` + `incident_payload` + a new `incident_severity` relation, and each organization can **design its own registration wizard** (`accident_process`, consumed by the app through `accident_process.getForPatrol`).

The app in `mobile/` still talks to the pre-v2 world: it is accident-only, has a hard-coded seven-phase accident wizard, no `incident_type`/`incident_payload`/`incident_severity`/`process`/module awareness, and its login/media types predate the backend's new response fields and photo categories. **Your task is the mobile half of that migration.**

Do **not** modify backend code, models, or acts. Build/change only `mobile/`. Work in the phases below and **STOP after each phase** for review.

## Backend already live (read-only reference — do not re-derive)

### Module licensing (`app_modules`)
- Module keys: `charts`, `incident_patrol`, `warehouse`. The mobile app is the entire **`incident_patrol`** surface. Everything else the app touches (login, `/user`-style profile, admin report CRUD) is core and never gated.
- Two layers: **installation** and **per organization**. Effective for an org = installation AND org.
- `user.login` / `user.getMe` now return **`modules: string[]`** (installation keys) and, when the caller resolves to exactly one org, **`orgModules: string[]`** (that org's effective keys). `app_modules.getModules` (`set {}`) is callable by any authenticated user; `app_modules.setModules` is Ghost-only.
- Disabled-module calls throw for everyone **except Ghost** — installation message: «این ماژول برای این نصب فعال نیست»; org message: «این ماژول برای این سازمان فعال نیست». Surface those messages; don't fabricate other reasons. Backend default = **all modules enabled** (a fresh install is unaffected; a Ghost can disable `incident_patrol` at install or per-org at any time).
- `incident_patrol`-gated acts the app calls daily (hard-blocked when off): `shift.*` (incl. `getActiveShift`), `accident.{getMyReports,getSyncStatus,reviewReport,reviewHistory,resubmitReport,nearbyAccidents}`, `announcement.*`, `police_station.*`, `vehicle.*`, `patrol_unit.*`, `emergency.*`, `file.uploadAccidentImages`, and the whole `accident_process` schema.
- **Never gated (the app may rely on them even when the module is off):** `user.login`, `user.getMe`, `accident.{add,update,get,gets,remove,count}`, `road.*`, the geography/shared reference models (`type`, `collision_type`, `incident_severity`, `road_defect`, …), `file` general ops, `app_modules.getModules`, `organization`/`unit`.

### Organizational structure (org/unit/roles) — flat patrol models kept one release
- `organization` = each highway/road (1:1 `road`). `unit` = org-chart node (`type` ∈ `Patrol|Station|Ops|Maintenance|Logistics|Administration|Warehouse|General`); a patrol unit is `unit(type:"Patrol")` with `head`/`vehicles`/`officers`.
- A patrol officer is a `user` with `level:"Patrol"` **plus** `roles:[{ roleId, name, scopeType?:"organization"|"unit", scopeId? }]` and `organizations`/`units` relations. `user.login`/`user.getMe` include `modules`/`orgModules`; user `level` and `patrol_permissions` are unchanged — Patrol access (`getMyReports` scoped by `officer._id`, device login) works with zero change.
- `police_station`, `patrol_unit`, `shift` (shift still references legacy `patrol_unit`) stay fully registered for **one release**, then delete. There is no legacy data to migrate (production: 1 dev `patrol_unit`, 0 `police_station`). The app may keep using the flat models *today* but must plan the `unit`-based move and must not add new dependencies on the flat models beyond what exists.

### Polymorphic reports (`accident`)
- `incident_type` enum `accident | road_breakdown | road_obstacle | other` (**absent = accident** — backward compatible).
- `incident_payload` pure struct: `{ description?, is_hazard?, needs_repair?, temporary_action?, follow_up_required? }`.
- `report_id` prefix per type: `REP-` (accident), `BRK-`, `OBS-`, `OTH-`.
- Server per-type validation on `add`/`update`:
  - Non-accident **requires** `location` + at least one of `incident_payload.description` / `roadDefectsIds` / `equipmentDamagesIds`.
  - Non-accident **rejects** accident-only fields: `vehicle_dtos`, `pedestrian_dtos`, `people_dtos`, `facility_damage_dtos`, `collisionTypeId`, `typeId` (Persian error). Accidents unchanged.
- `incident_type` change is rejected once `sync_status ∈ {synced, rejected}` or `review_status ∉ {submitted}` (update-by-uuid correction loop unaffected for still-editable reports).
- **New shared relation model `incident_severity`** (seeded کم/متوسط/زیاد/بحرانی), set on `add`/`update` via **`incidentSeverityId`**; exposed on `nearbyAccidents` as `incident_severity_name`. This is distinct from the accident-severity relation (`type` → خسارتی/جرحی/فوتی) the current seven-phase wizard already drives via `typeId` — non-accident flows must NOT set `typeId`.
- `accident.getMyReports` / `accident.gets` accept an **`incidentType`** filter.
- `nearbyAccidents` payload now includes `incident_type` + `incident_severity_name`.
- `accident.dynamic_answers` (array of `{ step_key?, question_key?, model_name, answer_id?|answer_ids?, answer_name?|answer_names?, value? }`) + `process_version` (number) — used only by the process-wizard path.
- `accident.add`/`accident.update` remain the **only** submit path (idempotent by `client_report_uuid`); `reviewReport`/`resubmitReport`/`reviewHistory` mechanics unchanged (reviews run on all four types).

### Process wizard (`accident_process`)
- Org-scoped wizard builder: embedded `steps[].questions[]`. Question source = a DB model from the fixed registry (`collision_type`, `incident_severity`/`damage_severity`, `road_defect` (multi), `equipment_damage` (multi), `vehicle_type` (dto), `light_status`, `road_surface_condition` (multi), `air_status` (multi), `position`→`lane`, plus free-text/`dynamic`). Each question carries `allowed_answer_ids` (whitelist; empty = all), `multi_select`, `required`, and a `target` (`relation(path)` | `dto(dto,field)` | `dynamic`).
- **`accident_process.getForPatrol`** (Patrol; Manager/Ghost pass `orgId`): `set { incidentType?, orgId? }`, `get { process?:0|1, answers?:0|1 }`. Returns the **active** process for the caller's org (+ type), falling back to the org's global (type-less) process.
  - Org resolution order: `user.roles` (org scope) → `roles` (unit scope) → `user.unit.organization` → `user.organizations`. No membership → Persian error **«سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید»**.
  - No active process → `{ process: null }` (not an error). With `answers:1`, each question resolves its whitelisted records in place as `answers:[{_id,name}]` (`allowed_answer_ids` removed).
  - One active process per org(+`incident_type`); `activate` bumps `version` and archives the previous active.
- Submit mapping (unchanged transport): **relation-mapped** question answers → the same typed relation ids already used by `accident.add` (e.g. `roadDefectsIds`, `equipmentDamagesIds`, `incidentSeverityId`, `laneId`); **`dynamic`** answers → `accident.dynamic_answers` (+ snapshot names); always send `process_version`. The queued draft should snapshot `process_version`; on re-sync the app refetches when the org's active version changed.

### Media (`file.uploadAccidentImages`)
- Wire format unchanged: base64 JSON in `set.file.data { name, type, data }`; `damage → facility_damage` alias; Patrol ownership check.
- Categories now: `plate`(≤5MB ×1), `insurance`(≤5MB ×1), `croquis`(≤10MB ×10), `facility_damage`(≤5MB ×10), **`incident`**(≤5MB ×10 — non-accident photos), `other`(≤10MB ×20).

## What already exists on mobile (reuse — do not reinvent)

- **Transport/types:** `src/api/lesan-api.ts` (`{service,model,act,details:{set,get}}` → `${LESAN_URL}/lesan`), envelope + error taxonomy (`src/api/envelope.ts`, `errors.ts`, `client.ts`), token header without `Bearer`. Act types come from `@backend/selectInp` (the **backend copy** `back/declarations/selectInp.ts`, regenerated 2026-09-07 — it already declares `organization`, `unit`, `accident_process`, `app_modules`, `incident_severity`, and the new `accident` fields; mobile `pnpm exec tsc --noEmit` is green today). Do not hand-edit it.
- **Auth/session:** `src/auth/session-service.ts` builds the device-scoped `user.login`; `src/domain/types.ts` `Session`/`User`; `src/api/auth.ts`, `src/api/user.ts` (getMe). Login/getMe projections do **not** yet request/store `modules`/`orgModules`.
- **Location & map:** confirmed-location summary + location picker; road snap/zone best-effort; offline OSM pack; `nearbyAccidents` not yet consumed by the Map tab.
- **Accident wizard:** seven hard-coded phases (`src/domain/accident-form.ts`, `src/app/incident/details.tsx`, `src/components/incident-phases.tsx`), pure Persian per-phase validators, autosave to SQLite, severity→`typeId` mapping (`type` model), DTO-shaped keys.
- **Mapper/sync:** `src/domain/accident-mapper.ts` (`buildAccidentAddSet`: passthrough + single/multi relation keys; **no** `incident_type`/`incident_payload`/`incidentSeverityId`/`dynamic_answers`/`process_version`); `src/services/sync-worker.ts` + `src/domain/sync-rules.ts` (`pickSubmissionAction`: `add` vs `update` by uuid; `resubmitReport` chaining; media upload dormant behind `EXPO_PUBLIC_ACCIDENT_UPLOADS=on`); SQLite queue (`draft→queued→syncing→synced/rejected`, stale-`syncing` recovery).
- **References:** cache-first loader `src/api/references.ts` (29 models incl. `type`, `collision_type`, `road_defect`, `equipment_damage`, `position`, …; **`incident_severity` not yet in the set**). Reports/drafts/announcements screens live; unread store; getMe profile; logout.
- **UI system:** semantic tokens/icon registry (`src/constants/theme.ts`, `icon-map.ts`), primitives under `src/components/ui/`, RTL + Persian, ≥44 dp targets. Incident entry tiles (`src/app/incident/index.tsx` §192–208): تصادف live; خرابی آزادراه / مانع یا خطر در مسیر / سایر رخدادها hard-gated «بهزودی».

## Phased tasks — STOP after each phase for review

### Phase A — Contract sync (types, session, error translation)
1. Extend `Session`/`User`/auth types and `user.login`/`getMe` projections to carry **`modules: string[]`** and optional **`orgModules?: string[]`** (harmless when absent); persist beside the session. Do **not** change `level`.
2. Extend media types (`src/api/media.ts` `BackendUploadCategory`, the local `MediaCategory` map, and any per-category limits) with **`incident`** (and note `other` is accepted server-side but is not the intended category for non-accident photos).
3. `src/api/errors.ts`: add Persian branches for the two module messages («این ماژول برای این نصب فعال نیست» / «این ماژول برای این سازمان فعال نیست») and for «سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید».
4. Verify: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` clean.

### Phase B — Incident-type ungate + draft metadata + serialization
1. `src/app/incident/index.tsx`: make the three tiles active and record the chosen `incident_type` on the draft (default `accident`). تصادف continues to the existing seven-phase wizard; خرابی آزادراه / مانع یا خطر در مسیر / سایر رخدادها route to the new per-type flow (Phase C) — or to the process wizard (Phase E) when the org publishes one. Keep the «سایر رخدادها» mapping of «حریق/نقص تجهیزات» to `other` documented.
2. Draft model: persist `incident_type` (+ report-type label for lists). Decide whether to bump `DRAFT_SCHEMA_VERSION` or normalize legacy rows on read (existing pattern).
3. Mapper + sync: `buildAccidentAddSet` emits `incident_type` and (non-accident) `incident_payload`/`incidentSeverityId` only when set; the `draft→queued→syncing→synced/rejected` transition and update-by-uuid correction loop stay shared and unchanged.
4. Verify: type selection round-trips through draft/SQLite; a queued non-accident draft serializes `incident_type`; `pnpm test` extended for the new mapper branches.

### Phase C — Per-type capture forms (road_breakdown / road_obstacle / other)
1. A lightweight capture flow for the three non-accident types (per `Design.md` §9.4/§9.5 updates): reuse the confirmed location/map; capture `incident_payload.description`, `is_hazard`, `needs_repair`, `temporary_action`, `follow_up_required`; reference pickers `road_defect` (multi), `equipment_damage` (multi), `incident_severity` (single, new `incidentSeverityId`), `position`/`lane`. **No** vehicle/people/facility/collision/type-severity phases.
2. Add `incident_severity` to the cache-first reference set (`RefModel`/needed lists) so options are available offline.
3. Client-side Persian validation mirroring the server rules (location + description or a defect); never emit the accident-only DTO/relation keys for non-accident reports.
4. Media for non-accident evidence uses the `incident` category (Phase A) with the same dormant-upload write-back pipeline; verify how uploaded files bind (report/attachments) against the backend contract before enabling.
5. Verify: each type submits and returns `BRK-`/`OBS-`/`OTH-` report ids against a reachable backend; rejected-field cases produce the server's Persian error; `pnpm test` covers the per-type mapper + validators.

### Phase D — Lists, labels, and map surfacing
1. Drafts and Reports render the type label (تصادف/خرابی/مانع یا خطر/سایر) and a `report_id` that now carries the type prefix; Reports fetch `accident.getMyReports` with the optional `incidentType` filter control.
2. Map tab: when incident-layer features land, render non-accident markers from `nearbyAccidents` using `incident_type` + `incident_severity_name` (read the flattened `incident_severity_name`, not the relation object).
3. Verify: type labels/filter + lint/tsc/test.

### Phase E — Process-driven wizard (`accident_process.getForPatrol`)
1. On «ثبت گزارش» (per type), call `accident_process.getForPatrol({ incidentType, get: { process: 1, answers: 1 } })`. Handle:
   - Org-membership error → friendly Persian notice (surface the exact backend message; this is a deployment prerequisite — officers must be assigned to a `unit(type:"Patrol")` with `roles`).
   - `{ process: null }` → **product decision**: fall back to the built-in wizard for `accident`; for non-accident types, decide fallback vs an explicit «فرآیند ثبت برای این سازمان فعال نشده است» state (record the decision in `TODO_HISTORY/decisions.md`).
2. Render the wizard from `process.steps[].questions[]`: step pager with icons/colors/titles, per-question options from resolved `answers` (or fetch `{model}.gets` for the registry `model_name`), single/multi-select UI, `required` validation with Persian field errors, progress. Reuse `StepperHeader`/chips/cards/`SectionHeader`.
3. Submit mapping: relation-target questions → the existing typed relation ids in `accident.add`/`update`; `dynamic` questions → `accident.dynamic_answers` (with name snapshots); always send `process_version`. Persist `process_version` on the queued draft.
4. Offline/version change: when a queued draft's `process_version` no longer matches the org's active version on re-sync, refetch the wizard and inform the officer (keep the draft data).
5. Verify: a process built/activated on the backend renders end-to-end on device; whitelisted answers resolve; submissions land in typed relations and/or `dynamic_answers`; `pnpm test` for the new domain logic.

### Phase F — Module gating UX, media enablement, and verification
1. Module awareness: after login, if `incident_patrol` is positively known-off (installation or the org's `orgModules`), show the Persian module notice on module-owned surfaces instead of firing dead calls (Ghost always sees everything; when `modules` is absent/stale treat as enabled and let the backend enforce). Centralize in one helper, don't copy-paste per screen.
2. Enable media upload (`EXPO_PUBLIC_ACCIDENT_UPLOADS=on`) against a reachable backend: exercise accident + non-accident (`incident`) round trips incl. retry-after-failure; then remove the dormancy caveat in docs.
3. Final: full suite green; `tsc`/`lint`/`test`; on-device smoke for the four type entries, process wizard, module-off notice, and offline queueing; update `TODO.md`/`CONTINUE.md`/`Design.md`/checkpoint log per the repo conventions.

## Verification (before each STOP and final)

1. `pnpm exec tsc --noEmit` clean; `pnpm lint` clean; `pnpm test` green (extend the vitest suite per phase).
2. Manual smoke against a running backend (`cd ../back && deno task bc-dev`; officer = `user.login` with `level:"Patrol"` **and** a `unit(type:"Patrol")` membership + `roles` — otherwise `getForPatrol` answers «سازمان مأمور یافت نشد…»).
3. Backend status via `back/docs/09`/`10` — incident-type Phases 1–2, org structure, and process builder are shipped and E2E-covered (backend suite 78/78); only the mobile half (this doc) and a couple of tracked backend follow-ups remain open.

## Working rules

- Read `mobile/AGENTS.md` and the exact Expo SDK 57 docs before adding any Expo/native API.
- Follow `mobile/docs/TODO_HISTORY/working-rules.md` and preserve the `{success,body}` envelope, `token` header (no Bearer), snake_case backend field names, cache-first patterns, and the persistent `client_report_uuid`.
- Persian UI + RTL; raw backend errors never reach the UI; Persian error strings are quoted verbatim here — do not fabricate other reasons.
- Do not modify backend code or declarations; when the backend regenerates declarations, run the sync from the repo root: `cp -rv back/declarations/selectInp.ts front/src/types/declarations/`.
- Do not run `pnpm start`/dev servers/emulators/builds automatically; stop and report after each phase.

## Out of scope / follow-ups (do NOT build)

- Deleting legacy `patrol_unit`/`police_station`/`shift`-to-`unit` rewiring (backend keeps them one release; a later migration).
- Road `area` geometry backfill (~1490 roads) — still blocks snapping/zone/offline road caching.
- `police_station` seed data; «حریق»/«نقص تجهیزات» first-class types (map to `other` until the enum becomes a reference model).
- Emergency flow + offline SOS policy; push notifications (FCM/APNs); haptics; production tile server; PIN/biometric/app-lock.
- Deep-linking a returned report into its exact wizard phase; step-question approval chains.
- Warehousing / JIT (mobile-unrelated).
