# Backend Handoff — LESEN Patrol Mobile

**Date:** 2026-08-24
**Source:** mobile patrol client (Expo/React Native, `mobile/`)
**Status:** working handoff for the backend team; everything below is verified against the current `back/src` code.

> **UPDATE 2026-08-24 (backend pass):** Sections A, B, C and E of this document have been implemented and smoke-tested (35/35 E2E checks on an isolated DB):
> - **A1** `emergency` model + `emergency.register / gets / get / updateStatus` (Patrol registers; Manager triages; audited via `operation_log`). Offline fallback remains an ops decision.
> - **A2** `police_station.{add,get,gets,update,remove,count}` — public `gets`, Manager-gated writes.
> - **A3** Real read-state: new `announcement_read` model; `markRead`/`getUnreadCount`/`gets` are per-user now (`is_read` + `read_at`, unread-first sorting). The flat `$or` targeting bug in `gets`/`getUnreadCount` was also fixed (expiry conditions no longer bypass unit/user targeting).
> - **A4** Push contract: `device.push_token` accepted at device-scoped login. FCM/APNs delivery still needs provider credentials.
> - **B1** Wire format pinned: base64 JSON in `set.file.data {name,type,data}`; `damage` alias → `facility_damage`; croquis cap = 10; Patrol ownership check on `accidentId`; orphan cleanup via `file.removeOrphans` (Manager).
> - **B2/B3** `getSyncStatus` / `getMe` verified via E2E.
> - **B4** Contract confirmed: `accident.resubmitReport` takes `set.reportId`, requires synced + returned + own report, sets `submitted` and clears `review_reason`. Mobile must call it after update-by-uuid. Additionally `accident.add` now server-enforces Patrol officer attribution (cannot create under another officer's id).
> - **B5** New `accident.nearbyAccidents`: lightweight bounding-box docs of **synced** reports; Patrol gated by `patrol_permissions.can_view_map`.
> - **C5/E3** Declarations regenerated + copied to `front/src/types/declarations/`; all 12 pre-existing `deno check mod.ts` errors fixed — the gate is clean now.
> - **E1/E2** `06-mobile-patrol-backend-todo.md`, `05-…execution-plan.md` (Steps 10 & 12) and `Models.md` updated to match reality.
>
> Still open (ops/data): road `area` backfill (D1), `police_station` seed (D3), patrol emails (D4), FCM/APNs delivery integration (A4), offline SOS policy (A1), mobile-side integration of B4/B5/A3 flows.

> **UPDATE 2026-08-25 (model refactor pass):**
> - **A3 hardening**: `announcement_read` now uses a proper `announcement` Lesan relation (unique index `{"announcement._id", "reader._id"}`) instead of a raw `announcement_id` pure field; kept as a separate model because a single announcement can be broadcast to dozens–hundreds of officers (embedding `read_by` would bloat the announcement doc).
> - **`file.accident_id` deleted** as a duplicate of the `accident` relation (`uploadAccidentImages` + `removeOrphans` now query `"accident._id"`).
> - **`accident_review` model eliminated** → embedded `accident.review_history` (reviewer as `{_id, first_name, last_name}` snapshot); `getReportReviewHistory` re-scoped to schema `accident`.
> - **Dead model files deleted**: `driver`, `person`, `country`, `location_area` (broken `axes` ref), `event_process`.
> - `road.province` reverse renamed `axeses` → `roads`.
> - E2E suite extended with the embedded review workflow → **41/41 passing**.

## Reality check before you start

`mobile/docs/TODO.md`, `mobile/docs/CONTINUE.md`, and `06-mobile-patrol-backend-todo.md` are **out of date**. The code for several items documented as "open" already exists in `back/src` but was never E2E-verified (backend execution Steps 10 and 12 in `05-mobile-patrol-backend-execution-plan.md` are still marked open even though the files exist and are committed):

| Item | Reality in `back/src` |
| --- | --- |
| `accident.getSyncStatus` | ✅ Implemented (per-status arrays) — **never E2E-verified, mobile not wired** |
| `announcement.{add,gets,get,markRead,getUnreadCount}` | ✅ Implemented — **`markRead` and `getUnreadCount` are stubs (no real read tracking)** |
| `file.uploadAccidentImages` + accident `attachments` | ✅ Implemented — **byte-transport contract unresolved, category names mismatch, never E2E-verified** |
| `user.getMe` | ✅ Implemented (incl. active shift + active device count) — mobile doesn't use it |
| `accident.reviewReport / resubmitReport / reviewHistory` | ✅ Implemented — mobile correction flow doesn't call `resubmitReport` |
| `road.{snapPointToRoad, validatePointInZone, getRoadsGeometry}` | ✅ Implemented and verified (Step 9) — production road data missing |
| `user.login` (email + device) | ✅ Implemented and verified (Step 11) |
| Emergency / SOS | ❌ **Nothing exists** (only a `can_register_emergency` permission flag on the user model) |
| `police_station.gets` | ❌ **No acts at all** on `police_station` (model is registered only) |

**Tip:** update `06-mobile-patrol-backend-todo.md` and `05-mobile-patrol-backend-execution-plan.md` at the same time; the current docs will mislead the next engineer.

---

## A. Must build (genuinely missing)

### A1. Emergency / SOS endpoint (ops decision required first)
- Nothing exists in `back/src` or `back/models` for emergency. Only `user.patrol_permissions.can_register_emergency` exists as a flag.
- Need an ops-approved online endpoint (e.g. `emergency.register` / a `patrol_operations` act): officer id, patrol unit, vehicle, GPS, timestamp, connection status. There is an untracked `back/src/patrol_operations/` (with `getOperationsSummary`) and `back/models/patrol_operations.ts` + `operation_log.ts` + `utils/logOperation.ts` that look related — decide whether emergency reuses these.
- Also needed: the approved **offline fallback policy** (SMS/call), which is a product/ops decision, not code.
- Register in `back/declarations/selectInp.ts` (auto via server start) and confirm Patrol access.

### A2. `police_station.gets` reference act for Patrol
- `police_station` model is registered (`back/models/police_station.ts`) with `name`, `code`, `location` (Polygon), `area` (MultiPolygon), `military_rank`, `is_active`, but has **no acts** — the generic `setSharedActs` factory (`back/src/shared/setSharedActs.ts`) was never applied to it.
- The mobile currently captures the station as manual free text. Add the standard `add/get/gets/update/remove/count` acts (public `gets`, Manager-gated writes) following the `setSharedActs` pattern, then the mobile can load the station picker and send `policeStationId`.

### A3. Real announcement read-state (currently stubbed)
- `announcement.markRead` just returns the doc; `getUnreadCount` returns total count, not per-user unread; `announcement.gets` returns the whole list regardless of read state.
- Need a real read-tracking model (e.g. `announcement_read` / `announcement.read_by` with `[user_id, read_at]`), and `markRead` / `getUnreadCount` / `gets` must compute per-user read/unread + sorting by read state. The `{ success, body }` envelope must be preserved.
- The `announcement` model already supports `target_roles` / `target_user_ids` / `target_patrol_units` / `priority` / `expires_at` / `is_active`; the active-shift → patrol-unit filtering in `gets` / `getUnreadCount` is already correct.

### A4. Native push/notification hooks
- Announcement delivery strategy is backend-owned. Mobile Settings has a notifications row. Need the backend contract for device push tokens (store push token on the `device` model), plus FCM/APNs send hooks. Decide whether it is push for announcements and/or sync-result notifications.

---

## B. Implemented but unverified / unintegrated — needs contract finalization + E2E

### B1. Categorized image upload — the wire-format contract is the blocker
`back/src/file/uploadAccidentImages/uploadAccidentImages.fn.ts` exists and writes to `./uploads/accidents`, but:
- **The set schema expects a `file` object with `.name/.type/.size/.stream()` (a Deno `File`). The mobile transport is JSON (`lesanApi` POSTs `{service,model,act,details:{set,get}}`); it cannot stream multipart.** Decide and document the actual wire format: base64 in `set.file` with backend decode, or a separate multipart endpoint. The mobile cannot proceed until this is pinned.
- **Category names differ.** Backend accepts `plate | insurance | croquis | facility_damage | other`; the mobile stores categories `plate | insurance | croquis | damage`. Either accept `damage` as an alias for `facility_damage` or define the mapping for the mobile.
- Limits: backend caps plate/insurance = 1 each, croquis = 1, facility_damage = 10, `other` = 20; max 5/10 MB; types JPEG/PNG/WebP/HEIC. Mobile compresses to ≤1600 px / q0.7, so size is fine — but **confirm whether croquis really is max 1** (the mobile lets the officer attach several).
- **No ownership check on `accidentId`** — a Patrol officer can attach images to any `accident_id`. Validate the accident exists **and belongs to the uploading officer** (or is a report they are allowed to edit) before linking.
- After upload the client must feed returned file `_id`s back into `vehicle_dtos[].plate_image / insurance_image` and `facility_damage_dtos[].images` on `accident.add` / `update`. `add.fn` and `update.fn` already auto-link those `_id`s into the `attachments` relation — good, but verify the full round trip with a real upload.
- No cleanup for orphaned files (draft deleted, report replaced). Add a cleanup strategy.

### B2. `accident.getSyncStatus`
- Implemented: returns per-status arrays (`draft/queued/syncing/synced/rejected`) for the officer. **Never E2E-verified.** Mobile has not integrated it (it uses the local queue + `getMyReports`). Confirm the response shape, that `officer._id` filtering works for Patrol/Manager/Ghost, and add it to the E2E suite.

### B3. `user.getMe`
- Implemented with `patrol_permissions`, active shift (embedded unit + vehicle), active device count. Mobile currently reads profile from the login response and shift from `getActiveShift`. Confirm the projection and decide whether it becomes the mobile's profile refresh source.

### B4. Review workflow — the correction loop must actually close
- `accident.reviewReport` (Manager: start_review/return/approve/complete) and `accident.resubmitReport` (Patrol on their own `returned` report) exist.
- **Gap:** the mobile's «اصلاح گزارش» opens a local draft and re-syncs via `accident.add`. Two problems:
  1. The sync worker only calls `accident.add`, which — idempotently — **returns the existing record and does not apply edits** for an already-created report. Corrected data would never reach the server. The worker must switch to `updateAccidentReportByUuid` once a server `_id` / report exists.
  2. `update` does not change `review_status`, so a returned report stays `returned` after correction. Define the contract: either `update` on a returned report resets `review_status` to `submitted` (and clears `review_reason`), or the mobile must call `accident.resubmitReport` explicitly. Prefer the latter for auditability — but it must be integrated on the mobile side, so confirm the act signature (`reportId` set key) and that it clears `review_reason`.

### B5. Patrol-facing map overlay
- `accident.mapAccidents` exists but is gated by `createChartAuthMiddleware("mapAccidentsAnalytics")` (Manager/web). The mobile Map tab needs approved/registered incidents near the officer. Options: (a) make a Patrol-scoped variant returning lightweight `{location, report_id, type, date, status}` within a bounded box, or (b) grant Patrol access to `mapAccidents` with `can_view_map`. Also the map needs road polylines — `road.getRoadsGeometry` exists (Step 9) but the mobile offline cache and the `area` data are missing (see D).

---

## C. Contract/schema fixes and clarifications

1. **Severity — no new field needed; use the existing `type` relation.** The accident schema has `type` (a relation) but no `severity` pure field. The `type` model already carries the severity values خسارتی/جرحی/فوتی (analytics hardcode these names). The mobile stores `severity` locally and doesn't send it. Backend action: **confirm the `type` model is seeded with خسارتی/جرحی/فوتی and Patrol can read it via public `gets`**; the mobile will then map its severity picker to `typeId`. No schema change required.
2. **`police_station` data is a runtime dependency of zone validation and snapping** — `validatePointInZone` resolves officer → active shift → patrol_unit → police_station and needs real stations with `location` / `area` geometry. Seeding real stations is an operational/data task, but the acts must exist (A2).
3. **`shift_type` is a free string**, not a reference model/enum. Decide whether it should become a reference model so the mobile can render shift-type labels from shared data instead of free text.
4. **Envelope:** confirm every new act (`getSyncStatus`, `announcement.*`, `file.*`, `reviewReport` / `resubmitReport` / `reviewHistory`, `police_station.*`, emergency) returns the standard `{ success, body }`. All must keep the framework default.
5. **Declarations:** regenerate `back/declarations/selectInp.ts` after any schema/act change and run `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` from the repo root so the frontend and the mobile (`@backend/*` alias) stay in sync. The mobile type-checks against the backend copy directly.

---

## D. Data backfill (operations, but blocks production use)

1. **Road `area` geometry** — all ~1490 production roads have no `area` (confirmed in execution-plan Step 9 notes). Until backfilled, `snapPointToRoad` returns «نزدیک‌ترین راه در شعاع پوشش این نقطه ثبت نشده است» and offline road caching (`road.getRoadsGeometry`) is unusable. **Highest-priority data task.**
2. **`type` (severity) values** — confirm خسارتی/جرحی/فوتی exist (C1).
3. **`police_station` seed** — stations with polygon `area` for zone validation and the mobile station picker.
4. **Patrol accounts** — officers need real emails (login is email-based now); announce to them operationally.

---

## E. Housekeeping

1. **Update `06-mobile-patrol-backend-todo.md`** — items 2 (`getSyncStatus`, announcements), 6 (file uploads) and 8 (`Models.md`, defaults note) are now implemented; mark Steps 10/12 per reality and note the wire-format decision.
2. **Update `back/Models.md`** (exists) for `device`, `shift`, `patrol_unit`, `announcement`, `accident_review`, expanded accident/user/road schemas, and the new `police_station` acts.
3. **Fix the pre-existing `deno check mod.ts` errors** documented as "11 pre-existing" — they were flagged as unrelated to patrol work, but they still block a clean CI gate.

---

## F. Security review items (already visible in current code)

1. `uploadAccidentImages` — no ownership/authorization check on `accidentId` (B1).
2. `accident.update` — `console.warn` logs attachment ids on duplicate-relation errors; confirm this never logs file contents or tokens.
3. `accident.update` set schema excludes `review_status` / `review_reason` — good (Patrol can't forge review state). Keep it that way; only `resubmitReport` may change returned → submitted.
4. `getSyncStatus` / `getMyReports` — Patrol-scoped via `officer._id`; verified by inspection. Re-verify in E2E.
5. Media/announcement uploads — enforce `is_active` announcements for Patrol (already done in `gets` / `getUnreadCount`).

---

## G. Suggested acceptance criteria (E2E, mirror the mobile checklist)

- Login (email + device) → `getMe` → `shift.getActiveShift` → reference `gets` for all 28 models incl. `type` and `police_station.gets`.
- `accident.add` idempotent by uuid; Patrol cannot set `synced/rejected`; returned report → edit → update-by-uuid → `resubmitReport` → status `submitted`, `review_reason` cleared.
- `accident.getSyncStatus` returns correct per-status buckets for Patrol.
- Upload 1 plate + 1 insurance + N facility_damage images via the agreed wire format → file docs linked in `attachments` → `_id`s land in `vehicle_dtos` / `facility_damage_dtos` → full round trip on `add` and on `update`.
- Announcements: send to role/unit/user, filter expired, mark read, unread count decreases; read state survives reload.
- `snapPointToRoad` + `validatePointInZone` on real backfilled geometry.
- Emergency act (once ops decides): Manager-visible, officer-auditable, `{ success, body }`.
- All new acts reject revoked-device tokens (next-request logout).
