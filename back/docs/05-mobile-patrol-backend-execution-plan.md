# CONTINUE — Execution Plan (Backend)

Short, logical, reviewable steps. **STOP after each step for review.** Each step must typecheck (`deno check mod.ts` — note: 11 pre-existing errors exist on `main` and are not caused by our changes) and keep the `{ success, body }` response envelope.

---

## Step 1 — User + Device model foundation ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/device.ts` (new): `device_pure` (device_id, fingerprint, platform, app_version, model, is_active, last_seen_at, registered_at, revoked_at) + `owner` single relation → user (auto-creates `user.devices` reverse). Unique index on `device_id`.
- `models/user.ts`: added `"Patrol"` to `user_level_array`; added `patrol_permissions_struct`; added `personnel_code` (numeric-only pattern), `is_active` (default `true`), `patrol_permissions` (optional) to `user_pure`. Added unique sparse index on `personnel_code` via `coreApp.odm.getCollection("user").createIndex`.
- `models/mod.ts`: export `device.ts`.
- `mod.ts`: import + instantiate `device = devices()`.

**Verification:** `deno check mod.ts` → 11 errors, identical to clean `main` (all pre-existing in charts/seed/updateUserRelations). No new errors introduced.

**Notes:**
- Relation is one-directional: `device.owner → user` (child owns the FK); `user.devices` is auto-created by Lesan via `relatedRelations`.
- `personnel_code` kept optional for backward-compat with existing users; enforced unique+sparse.

---

## Step 2 — `mobileLogin` act ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `src/user/mobileLogin/mod.ts` (new): registers act `mobileLogin` on schema `user` (no `preAct` — public).
- `src/user/mobileLogin/mobileLogin.val.ts` (new): set = `personnel_code` (numeric), `password` (8–100), `device` object (`device_id`, `fingerprint` 8–100 each, optional `platform`/`app_version`/`model`); get = `token`/`permissions` enums + `user`/`devices` projections.
- `src/user/mobileLogin/mobileLogin.fn.ts` (new): find by `personnel_code`; generic error on unknown user / missing password / wrong password (no user-enumeration); reject when `is_active === false`; reject when `level !== "Patrol"`; upsert device (insert or reactivate + update `last_seen_at`, `$unset revoked_at`); JWT with `_id`/`personnel_code`/`level`/`device_id` (90-day exp); returns `{ token, user, permissions, devices }`.
- `src/user/mod.ts`: wired `mobileLoginSetup()`.

**Verification (live E2E against local MongoDB):**
- ✅ Correct creds → token + user + permissions + active devices returned
- ✅ Re-login same device → reactivated, **no duplicate** (device count stays 1)
- ✅ Wrong password → «کد پرسنلی یا رمز عبور صحیح نیست»
- ✅ Inactive account → «حساب کاربری غیرفعال است»
- ✅ Non-Patrol level → «این حساب اجازه استفاده از اپ مأمور گشت را ندارد»
- ✅ Unknown personnel code → generic error (no user enumeration)
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Discovered micro-task (added to TODO):** Lesan `insertOne` does **not** apply `defaulted` field defaults (only act validators with `validationRunType: "create"` do). Any defaulted pure field inserted via `insertOne` must be set explicitly in the fn. Applied here for device (`is_active`, `last_seen_at`, `registered_at`, `createdAt`, `updatedAt`). Relevant for all future `insertOne`-based acts.

---

## Step 3 — Admin device management + lockout ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/user.ts`: added `failed_login_attempts` (`defaulted(number(), 0)`) and `locked_until` (`optional(date())`) to `user_pure`.
- `src/user/mobileLogin/mobileLogin.fn.ts`: added per-user lockout enforcement — lockout check before password compare (remaining-minutes message), consecutive-failure counter incremented on wrong password, `locked_until = now + 5min` + counter reset on the 5th failure, counter reset + `$unset locked_until` on success. Token `device_id` now carries the app's `device_id` string (not the doc `_id`) so session revocation matches the revoke act.
- `utils/setToken.ts`: after `jwt.verify`, if the payload has a `device_id`, the linked device is looked up and the request is rejected with «نشست این دستگاه باطل شده است» when the device is missing or `is_active !== true` — this force-logs-out revoked mobile sessions on their next request.
- `src/user/getUserDevices/` (new): Manager act, lists a user's devices filtered by `owner._id`.
- `src/user/revokeDevice/` (new): Manager act, sets `is_active=false` + `revoked_at` by `device_id`.
- `src/user/removeDevice/` (new): Manager act, `deleteOne` by `device_id` (reverse `user.devices` auto-cleaned by Lesan).
- `src/user/mod.ts`: wired `getUserDevicesSetup()`, `revokeDeviceSetup()`, `removeDeviceSetup()`.

**Verification (live E2E against local MongoDB):**
- ✅ Valid mobile token passes `getMe`; token whose device is revoked → «نشست این دستگاه باطل شده است»
- ✅ `getUserDevices` / `revokeDevice` / `removeDevice` work with a Ghost (admin) token
- ✅ 5 wrong passwords → counter increments, 5th sets `locked_until` + lockout message
- ✅ Correct password while locked → rejected with remaining-minutes message
- ✅ After lock expires, successful login resets counter and clears `locked_until`
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Notes:**
- Admin acts are Manager-gated; Ghost level is implicitly allowed (bypasses `grantAccess` level check), which is how they were E2E-tested.
- Lockout is per-user (`locked_until` on the user), not per-device — a locked officer is locked out on all devices.
- `removeDevice` uses `hardCascade: false` (safe): deleting a device just removes it from the officer's `devices` list.

---

## Step 4 — Reference data (reuse existing; create only what's missing) ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/vehicle_type.ts`, `models/croquis_type.ts`, `models/vehicle_final_status.ts`, `models/driver_status.ts`, `models/injury_status.ts`, `models/person_role.ts`, `models/damage_severity.ts` (new): all follow the existing `shared_relation_pure` + `createSharedRelations()` pattern.
- `models/police_station.ts` (pre-existing but unregistered): now wired.
- `models/mod.ts` / `mod.ts`: registered `police_station` + the 7 new models (`export const … = …()`).
- `src/shared/setSharedActs.ts` (new): generic factory that registers the 6 standard shared-model acts (`add`/`get`/`gets`/`update`/`remove`/`count`) for any shared model by name — avoids ~42 duplicated boilerplate files while keeping the exact same act semantics/validators as the hand-written ones (e.g. `collision_type`).
- `src/shared/mod.ts` (new): `sharedSetup()` calls the factory for the 7 new models + `seedSharedSetup()`.
- `src/shared/seedShared/{mod,fn,val}.ts` (new): Manager-gated `seedShared` act (schema `user`) that inserts reference values **non-destructively** (skips existing by exact, case-insensitive name match) with `registrer` = acting user; returns `{ added: {model: count}, totalAdded }`.
- `src/mod.ts`: wired `sharedSetup()` (registered first, before the other act setups).

**Seed values** (from `docs/app_fa.md`, 66 total, all verified present after one run and idempotent on a second):
- New models — `vehicle_type` (10: سواری … سایر), `croquis_type` (2: کروکی سازشی سری ۱۲ / غیرسازشی سری ۲۲), `vehicle_final_status` (7), `driver_status` (6: حاضر … نامشخص), `injury_status` (7: بدون آسیب … نامشخص), `person_role` (6: راننده … مأمور/نیروی امدادی), `damage_severity` (4: جزئی/متوسط/شدید/تخریب کامل).
- Existing models (missing values only) — `position` (+4: خط ۱، خط ۲، شانه راست، شانه چپ), `road_situation` (+6: قوس افقی، شیب/فراز، قوس قائم، محدوده عوارضی، محل عملیات راه‌سازی، شانه راه), `road_surface_condition` (+3: مرطوب، خیس، آب‌گرفته), `road_defect` (+3: نقص گاردریل، آب‌گرفتگی، محدودیت دید), `equipment_damage` (+8: نیوجرسی، پایه تابلو، پایه روشنایی، چراغ روشنایی، فنس، دوربین، تجهیزات عوارضی، پل/آبرو).

**Note:** `docs/app_fa.md` doesn't enumerate `damage_severity` values (only "نوع خرابی و شدت آسیب"); used جزئی/متوسط/شدید/تخریب کامل — adjust if a canonical list exists.

**Verification (live E2E against local MongoDB):**
- ✅ `seedShared` run 1 → 66 added; run 2 → 0 (idempotent, no duplicates)
- ✅ Public `gets` returns correct counts for all 7 new models
- ✅ Manager-gated `add` sets `registrer` (Ghost); `get`/`gets`/`update`/`remove`/`count` all work (ObjectId conversion for `get`/`remove` matched existing patterns)
- ✅ Seeded existing-model values present exactly once (no dupes)
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Notes:**
- `police_station` is only registered here (no CRUD acts yet — it has required geo/`code`/`military_rank` fields and is populated later).
- Seed data was left in the DB (it's the real reference data); test records were removed and ghost password unset after testing.

---

## Step 5 — `patrol_unit` + `shift` models & acts ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/patrol_unit.ts` (new): `code`, `name`, `is_active` (+ createUpdateAt); relations `registrer`→user, `police_station`→police_station (reverse `police_station.patrol_units`), `vehicles`→vehicle (reverse `vehicle.patrol_unit`), `officers`→user (reverse `user.patrol_unit`). One-directional relations with `relatedRelations` — no manual reverse definitions.
- `models/shift.ts` (new): `shift_type`, `status` (enums `active|ended|cancelled`, default `active`), `start_at`, `end_at` (opt), `note` (opt); relations `registrer`→user, `officer`→user (required, reverse `user.shifts`), `patrol_unit`→patrol_unit (reverse `patrol_unit.shifts`), `vehicle`→vehicle (reverse `vehicle.shifts`).
- `models/vehicle.ts` (pre-existing but unregistered): now registered (minimal model — plaque_no tuple + color/plaque_type/system_type/registrer relations).
- `models/mod.ts` / `mod.ts`: registered `vehicle`, `patrol_unit`, `shift`.
- `src/patrol_unit/{add,get,gets,update,remove}/` (new): Manager-gated CRUD; `add` accepts `policeStationId`, `vehicleIds[]`, `officerIds[]` and establishes the relations; `gets` is public and supports `code`/`name` filters.
- `src/shift/` (new):
  - `assignShift` (Manager): validates officer exists, no duplicate **active** shift per officer, unit exists, vehicle exists (if given); creates a shift with `status="active"`, `start_at=now`, relations officer/patrol_unit/vehicle.
  - `getActiveShift` (Patrol self or Manager-by-`userId`): returns the officer's `status="active"` shift with embedded unit + vehicle.
  - `endShift` (Manager/Ghost or the shift's owner): sets `status="ended"`, `end_at=now` (rejects if already ended).
  - `getShifts` (self or Manager-by-`userId`): paginated, optional `status` filter, newest first.
- `src/mod.ts`: wired `patrolUnitSetup()` + `shiftSetup()`.

**Verification (live E2E against local MongoDB):**
- ✅ `patrol_unit.add` with `police_station` relation; public `gets`
- ✅ `assignShift`; second assign while active → «این مأمور در حال حاضر یک شیفت فعال دارد»
- ✅ `getActiveShift` as officer (embedded `patrol_unit` + `vehicle.plaque_no`) and as Manager by `userId`
- ✅ `endShift` by officer; `getShifts` returns the ended shift; `getActiveShift` after end → «شیفت فعالی یافت نشد»; assign again succeeds after end
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Notes:**
- Officer dashboard data source = `getActiveShift` (shift → embedded unit + vehicle), matching Step 5 plan.
- `patrol_unit` relation updates (add/remove vehicles/officers on an existing unit) are deferred — only pure-field `update` is exposed for now.
- Test data cleaned up after E2E; ghost password unset.

---

## Step 6 — Accident model expansion part 1 (meta + idempotency) ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/accident.ts`: added mobile-patrol meta block to `accident_pure` — `client_report_uuid` (client idempotency key), `report_id`, `sync_status` (`draft|queued|syncing|synced|rejected`), `rejection_reason`, `reported_at`, `gps_coords` (Point — officer's GPS), `gps_accuracy`, `travel_direction`, `kilometer`, `meter`. The existing `location` Point is kept as the incident point (`incident_coords`).
- `models/accident.ts`: added relations `officer`→user, `patrol_unit`→patrol_unit, `vehicle`→vehicle (each with `relatedRelations: { accidents }` → auto reverse), and `lane`→position with `relatedRelations: {}` (no reverse — `accident.position` already owns `position.accidents`).
- `models/accident.ts`: added unique+sparse index on `client_report_uuid` via `coreApp.odm.getCollection("accident").createIndex` (mirrors the `personnel_code` pattern in `user.ts`).
- `src/accident/add/add.val.ts`: extended `optionalPureAccident` with the new meta fields + relation IDs (`officerId`, `patrolUnitId`, `vehicleId`, `laneId`).
- `src/accident/add/add.fn.ts`: wires the 4 new relations (officer/patrol_unit/vehicle/lane) into the insert.

**Verification (live E2E against local MongoDB):**
- ✅ `accident.add` accepts the full meta block + all 4 new relations; `get` returns them (officer embedded with level, patrol_unit.code, vehicle.plaque_no, lane.name)
- ✅ Unique index exists after boot (`client_report_uuid_1`); a second `add` with the same uuid → `E11000 duplicate key` (idempotency enforced at DB level; friendly lookup added in Step 8)
- ✅ Different uuid / no uuid → succeeds
- ✅ Reverse relations auto-populated: officer's `user.accidents`, `patrol_unit.accidents`, `vehicle.accidents` (verified correct with a controlled 2-accident experiment — inserting an accident without the officer relation does not touch the officer's array)
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Notes:**
- A Lesan-side quirk: when the duplicate-uuid insert fails with `E11000`, the reverse relation on the linked user is updated before the failure, leaving a dangling entry in `user.accidents`. Step 8's idempotent `add` should check the uuid **before** attempting the insert to avoid this.
- The existing `officer: string()` pure field was kept untouched (still a free-text officer name); the new `officer` relation is separate. Whether to migrate the string to the relation is decided in Step 7.

---

## Step 7 — Accident model expansion part 2 (form blocks) ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/accident.ts`:
  - **Police/Croquis block (Phase 3):** `police_present` (bool), `police_expert_name`, `police_arrival_time` (date), `officer_cause_description`; new relations `police_station`→police_station and `croquis_type`→croquis_type (each auto-creates the reverse `accidents`).
  - **Vehicle cards expansion (Phase 4):** `vehicle_type`, `year`, `final_status`, `plate_image` (file ObjectId), `insurance_image` (file ObjectId) added to `vehicle_dtos`; driver block gained `phone` + `driver_status`.
  - **People cards (Phase 5):** new `people_dtos` array (`role`, `sex`, `age`, `age_range`, `injury_status`, name/national_code/phone).
  - **Facility damage cards (Phase 7):** new `facility_damage_dtos` array (`asset_group`=equipment_damage, `asset_code`, `damage_type`, `damage_severity`, `quantity`, `unit`, `creates_hazard`, `needs_repair`, `temporary_action`, `images[]` file ObjectIds).
  - Classification (Phase 2) needed **no new code** — the existing `type` relation already holds the severity values (خسارتی/جرحی/فوتی) and `collision_type` covers نوع برخورد; environmental block (Phase 6) was already covered by `air_statuses`/`light_status`/`road_surface_conditions`/`road_situation`/`road_defects`.
- `src/accident/add/add.val.ts`: extended `optionalPureAccident` with all new pure fields + `policeStationId`/`croquisTypeId`.
- `src/accident/add/add.fn.ts`: wires `police_station` + `croquis_type` relations.

**Verification (live E2E against local MongoDB):**
- ✅ Full Phase 3–7 payload accepted: police block + embedded `police_station`/`croquis_type`; expanded vehicle card (vehicle_type/year/final_status/plate_image/insurance_image + driver.phone/driver_status); people card; facility card (all fields + images)
- ✅ Reverse relations populated on `police_station.accidents` / `croquis_type.accidents`
- ✅ `deno check` → 11 errors (same as clean `main`; 0 new)

**Notes:**
- **Projection rule:** Lesan projections only accept `0/1` for **pure** fields (including pure arrays like `vehicle_dtos`); nested selection objects are relations-only. So the client requests `vehicle_dtos: 1` and receives the whole array — sub-field filtering inside arrays is not supported.
- **Partial data:** existing required `vehicle_dtos`/driver fields stay required in the model; a draft with an incomplete vehicle card will fail `add`. Step 8's sync logic should only submit complete cards (or the model can be relaxed later if drafts need partial arrays).
- New image refs (`plate_image`/`insurance_image`/`facility.images`) are raw file-`_id` fields; the categorized upload act + `attachments` wiring is Step 11.
- Cleanup used raw `mongosh deleteMany` which **bypasses Lesan's cascade cleanup** — leftover dangling reverse entries were removed manually; `position.accidents` (128) is legitimate existing web-app data, left untouched.

---

## Step 8 — Idempotent add/update acts ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `src/accident/accidentSetSchema.ts` (new): shared all-optional `set` schema for all accident pure fields (meta + Phase 3–7 blocks). Used by both `add` and `update` validators so they stay in sync; `add` overrides `location`/`date_of_accident` to required via `...accidentSetSchema.schema`.
- `src/accident/add/add.val.ts`: refactored to reuse the shared schema (+ relation IDs).
- `src/accident/add/add.fn.ts`:
  - **Idempotency:** if `client_report_uuid` is provided, `findOne` first and return the existing record instead of inserting a duplicate (also avoids the dangling reverse-relation bug on failed dup-key inserts from Step 6).
  - **Auto serial/report_id:** when `serial` is absent → `max serial + 1` (aggregation sort desc limit 1); `report_id` defaults to `REP-<year>-<6-digit serial>`. Mobile reports default `sync_status` to `"queued"`.
  - **Bug fixed:** `client_report_uuid` is written back into the doc (it was destructured out and silently dropped).
- `src/accident/update/` (rewritten): lookup by `_id` **or** `client_report_uuid`; updates any provided pure fields via `findOneAndUpdate` `$set` (relations still handled separately, per Lesan convention). Access: Manager/Ghost for any report; Patrol only their own (`officer._id === user._id`, verified by a pre-lookup). Rejects requests with neither lookup key.
- `src/accident/getMyReports/` (new): Patrol sees own reports, Manager/Ghost may pass `userId` (else all); optional `status` (sync_status) filter; paginated, sorted by `reported_at` desc. Uses the embedded `officer._id` field for filtering (single relations are embedded).
- `src/accident/mod.ts`: wired `getMyReportsSetup()`; `update` preAct changed to `[setTokens, setUser]` (level checks are in the fn).
- `gets`/`get`: no change needed — they already use `selectStruct("accident", 2)`, which auto-includes the new pure fields and relations.

**Verification (live E2E against local MongoDB):**
- ✅ add (new) → auto `serial` (4423418 = max+1), `report_id` `REP-2026-4423418`, `sync_status` default `queued`, `client_report_uuid` stored
- ✅ add with the **same uuid** → returns the existing record (same `_id`, other fields unchanged) and the officer's `accidents` reverse array stays at 1 (no dangling entry)
- ✅ update by uuid (Manager) → `synced`; update own by `_id` (Patrol) → `rejected` + reason; cross-owner update → «شما اجازه ویرایش این گزارش را ندارید»; no lookup key → error
- ✅ `getMyReports` as Patrol (own, status filter) and as Manager (by `userId`); `deno check` → 11 errors (0 new)

**Notes:**
- Projections for pure array fields must use `0/1` (no nested selection) — confirmed in Step 7.
- `serial` auto-gen is `max+1` (not `count+1` — existing serials are already in the millions); acceptable for single-officer mobile sync, revisit if concurrent sync volume demands an atomic counter.
- Test data cleaned; ghost password unset.

---

## Step 9 — Road expansion + spatial acts ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Files changed:**
- `models/utils/commonRelation.ts` (new): `common_relation_struct` moved here from `models/accident.ts` to break a circular-import TDZ (`models/road.ts` used it at module init while `@model` re-exports accident.ts last → `ReferenceError: Cannot access 'common_relation_struct' before initialization`). Re-exported from `models/mod.ts`; `accident.ts` and `road.ts` import it from the util path directly.
- `models/road.ts`: added `origin`, `destination` (optional strings), `total_length_meters` (optional number), `lanes` (optional array of `common_relation_struct`). `area` (MultiLineString) stays as the ordered geometry for linear referencing.
- `utils/geo.ts` (new): equirectangular helpers — `toRad`, `haversineMeters`, `meterPerDeg`, `polylineLengthMeters`, `projectPointToPolyline`, `projectPointToMultiLine` → `{ alongMeters, perpMeters, nearest, totalLengthMeters }`.
- `src/road/snapPointToRoad/` (new): nearest road via `$geoNear` on `road.area` (spherical, maxDistance 20000, `$limit 1`) → projects point onto MultiLineString → `{ road, distanceToRoadMeters, fromOriginMeters, totalLengthMeters, kilometer, meter, origin, destination, direction "<origin> - <destination>", lanes, nearestPoint }`.
- `src/road/validatePointInZone/` (new): resolves officer (Patrol self / Manager+Ghost optional `userId`) → active shift (`shift.findOne` on `"officer._id"` + `status:"active"`) → `patrol_unit.findOne` (embedded `police_station`) → `police_station.findOne` with `$geoIntersects` on the point → `{ inZone, policeStation }`.
- `src/road/getRoadsGeometry/` (new): paginated road geometry dump for the offline map cache; optional `polygon` filter via `$geoIntersects`.
- `src/road/mod.ts`: wired the 3 new act setups.

**Verification (live E2E against local MongoDB):**
- ✅ `snapPointToRoad` on-point near road A → correct road, `kilometer` 1, `meter` 761, `direction` «تهران - قم», `lanes` populated, `nearestPoint` returned
- ✅ `snapPointToRoad` far from any road → «نزدیک‌ترین راه در شعاع پوشش یافت نشد»
- ✅ `validatePointInZone` inside station area → `inZone: true`; outside → `false` (Patrol self and Manager+`userId`)
- ✅ `getRoadsGeometry` with polygon → returns only intersecting road; without → paginated dump incl. `area`
- ✅ `deno check` → 11 errors (0 new)

**Notes:**
- DB fact: all 1490 production roads lack `area` geometry (0 docs with it) — test roads were seeded for E2E and deleted after; backfilling real geometry is out of scope (mobile app needs it before `snapPointToRoad`/`getRoadsGeometry` go live).
- `validatePointInZone` uses two explicit lookups (shift → patrol_unit → police_station) because embedded single relations expose only pure fields + `_id`; the framework's nested relation projection is not relied upon here.
- Test data cleaned; ghost password unset; boot verified.

---

## Step 10 — Sync status + announcements/notifications ✅ DONE

**Status:** ✅ Implemented + E2E-verified (2026-08-24)

- `accident.getSyncStatus` returns per-status arrays (`draft/queued/syncing/synced/rejected`), Patrol-scoped via `officer._id`; Manager/Ghost may pass `userId`
- Announcement channel: `announcement.{add,gets,get,markRead,getUnreadCount}` with real per-user read tracking via the new `announcement_read` model (unique index on `announcement_id` + `reader._id`); `gets` annotates `is_read`/`read_at`, sorts unread-first; visibility = active + non-expired + targeted at role/unit/self
- Push hook point: `device.push_token` persisted at device-scoped login; FCM/APNs delivery integration pending provider credentials

---

## Step 11 — Unified email+password login ✅ DONE

**Status:** ✅ Complete (awaiting review)

**Decision:** one login system for web + mobile, keyed on `email` + `password`. The separate `mobileLogin` act (personnel_code-keyed) was removed. `personnel_code` stays on the user model as identification data (unique sparse index kept) but is no longer a credential.

**Files changed:**
- `src/user/login/loginUser.val.ts`: set = `email` + `password` (8–100) + optional `device` object (`device_id`, `fingerprint` 8–100 required; `platform`/`app_version`/`model` optional); get = token/user enums + optional `permissions` enum + `devices` projection.
- `src/user/login/loginUser.fn.ts`: rewritten as two-phase lookup — (1) internal fixed-projection credential check (never leaks password hash / lockout counters into responses), (2) client-projected user fetch on success. Merged all security from the old `mobileLogin`: generic error «ایمیل یا رمز عبور صحیح نیست» on unknown user / missing hash / wrong password (no enumeration), lockout check before compare, failure counter with 5-attempt → 5-min lock, counter reset + `$unset locked_until` on success, `is_active === false` rejection. With device payload: requires `level === "Patrol"`, upserts device (reactivate or insert with explicit defaults), JWT carries `_id/email/level/device_id`, returns `{ token, user, permissions }` — devices are reachable through the `user.devices` reverse relation in the projection. Without: JWT `{ _id, email, level }`, returns `{ token, user }` — backward-compatible with the existing web contract.
- `src/user/mobileLogin/` (deleted): act removed entirely.
- `src/user/mod.ts`: unwired `mobileLoginSetup()`.
- Consumers updated: mobile app (`src/api/auth.ts`, `src/api/backend-types.ts`, `src/auth/session-service.ts`, `src/app/index.tsx`) now calls `user.login` with email + device metadata; web frontend unchanged.

**Notes:**
- Device revocation enforcement in `utils/setToken.ts` unchanged — it only checks devices when the token carries a `device_id`.
- Patrol officers must be informed of their account emails (operational task).
- **Lesan embedding gotcha:** the reverse `user.devices` array is only written when the insert's relation payload explicitly sets `relatedRelations: { devices: true }`. Without that flag the device row exists but stays invisible through `user.devices` (plain `findOne` returns embedded arrays as-is — no aggregation needed). The reactivation branch refreshes the link via `device.addRelation` with `replace: true`, repairing devices registered before this fix.


---

## Step 12 — Multi-image uploads ✅ DONE

**Status:** ✅ Implemented + E2E-verified (2026-08-24)

- Categorized upload act (`file.uploadAccidentImages`: plate, insurance, croquis, facility_damage (+`damage` alias), other) → `file` model + `attachments` relation with category metadata; size/type limits
- **Wire format decision:** base64 JSON in `set.file.data` (`{name,type,data}`) — the mobile transport (`lesanApi`) is JSON-only and cannot stream multipart; server decodes, validates real byte size, and writes to `./uploads/accidents`
- Limits: plate/insurance = 1 each, croquis = 10 (aligned with mobile multi-croquis UX), facility_damage = 10, other = 20; JPEG/PNG/WebP/HEIC; 5 MB (10 MB croquis/other)
- Security: Patrol can only link uploads to their **own** accidents (existence + `officer._id === actor._id` enforced)
- Round trip verified: upload → `_id`s fed into `attachmentsIds` / `vehicle_dtos[].plate_image` etc. on `accident.add` → embedded into the `attachments` relation