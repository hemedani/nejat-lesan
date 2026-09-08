# Checkpoint Progress — Mobile Patrol App

Detailed per-checkpoint history: goals, progress notes, and exit criteria as of each run. Kept in `TODO_HISTORY` so `CONTINUE.md` stays a single-page next-task prompt. Source: the Checkpoint sections previously embedded in `CONTINUE.md`. Authoritative remaining work lives in `mobile/docs/TODO.md`; the next task prompt lives in `mobile/docs/CONTINUE.md`.

## Checkpoint 0 - Baseline and decisions

**Goal:** establish a known starting point.

- [x] Read `mobile/AGENTS.md`, `mobile/README.md`, package versions, and current routes/components.
- [-] Run the existing app on an emulator or device. Emulator/device launch remains pending.
- [-] Run `npx expo lint` and record baseline failures. With the fnm Node `v22.22.2` / pnpm `v10.8.0` toolchain, lint runs but reports the existing starter error in `src/hooks/use-color-scheme.web.ts` (`react-hooks/set-state-in-effect`).
- [-] Confirm API URL, auth environment, supported platforms, map provider, offline map strategy, local database, and emergency fallback. Supported SDK 57 platform requirements are recorded; product/backend choices remain open.
- [x] Record decisions. See `TODO_HISTORY/decisions.md`.

**Exit criteria:** starter app launches; baseline lint result is recorded; platform and backend endpoint decisions are explicit.

## Checkpoint 1 - App foundation and contracts

**Goal:** create stable infrastructure before screens.

**Progress:** Foundation includes environment loading, declaration-backed Lesan act transport, timeout/error translation, core patrol domain types, SDK 57 `expo-secure-store` session storage, NetInfo connectivity classification/API preflight, an Expo SQLite repository for drafts/media/queue/reference data, and a SecureStore-backed session lifecycle service. UI integration, migration/recovery checks, and all device-level testing remain pending.

**Exit criteria:** a mocked request can be parsed; secure session data can be written/read/cleared; a draft record survives app reload; no secret is logged.

## Checkpoint 2 - Authentication and session lifecycle

**Goal:** deliver a secure first-login and subsequent-unlock path.

**Progress:** RTL Persian login route, email validation + keyboard type, device metadata collection, declaration-typed `user.login` call with SecureStore persistence, known auth-message translation, login-to-Home navigation, session restore, logout, revoked-session service methods, and incident-route guarding are present. Full protected routing, PIN/biometric unlock, and background app lock remain.

**Backend contract:** login accepts email, password, and optional device metadata; returns token, user, and permissions (the latter two extras when a device payload is sent). Devices come through the `user.devices` reverse relation. Device login is allowed for `Patrol` and `Ghost`; the JWT is device-scoped and a revoked device must fail on the next request.

**Exit criteria:** first login requires network; a valid prior session opens offline; password is never stored; a revoked device returns to a safe unauthenticated state.

## Checkpoint 3 - Authenticated shell and Home

**Goal:** make the app navigable and operationally truthful.

**Progress:** Five-tab RTL navigation with Home centered (custom `patrol-tab-bar.tsx`), routes under `src/app/(tabs)`, login moved to `/login`. Home loads SecureStore identity before a `shift.getActiveShift` refresh (deduplicated: in-flight guard, 60s cooldown, one-time restore). Connection and last-sync indicators are present; a GPS pill with on-demand permission request and accuracy display was added via `use-device-location`. My Reports, Announcements, Map (OSM preview), and More (functional logout) tabs are wired; Drafts entry point and Emergency flow remain pending.

**Backend contract:** active shift response embeds patrol unit and vehicle. Do not substitute static user fields.

**Exit criteria:** dashboard is useful with network disabled; cached data appears before refresh; no action needed for incident registration is disabled because of offline state.

## Checkpoint 4 - Draft engine and sync queue

**Goal:** guarantee no data loss and no duplicate server reports.

**Progress:** SQLite schema v1 with `PRAGMA user_version` migrations; drafts carry `DRAFT_SCHEMA_VERSION` and legacy rows normalize on read; one persistent `client_report_uuid` per draft; queue states `draft|queued|syncing|synced|rejected` with stale-`syncing` recovery after 10 min; single-flight sync worker with bounded attempts (5), backoff (1/5/15/60 min), connectivity triggers; typed `accident.add`/`update` wrappers storing server `_id`/`report_id`. `/drafts` screen lists statuses, attempts, next retry, errors, per-item resend, and sync-all. Native sync notifications remain pending.

**Important backend limitation:** `getSyncStatus` was still planned when this ran — keep the client repository ready for it, but do not invent an incompatible endpoint contract. (Note: the backend act now exists; see `08-mobile-patrol-backend-handoff.md`.)

**Exit criteria:** kill the app during save and during sync; restart it; the draft and queue resume; replaying the same request never creates a second report.

## Checkpoint 5 - Permissions, GPS, and offline road cache

**Goal:** prepare reliable field location behavior.

**Progress:** `react-native-maps` (Google/Apple base) was replaced by `OsmWebMap` — a self-contained slippy-map WebView (`react-native-webview`) rendering OSM raster tiles directly, with no Google dependency (reliable in sanctioned regions), pan/double-tap zoom/zoom buttons, officer marker bridge, and `moveend` region callbacks. Offline tile caching hooks into the same component later. Permission flows (camera/library/location) and offline road cache remain.

**Backend blocker:** production road records need `area` geometry before `snapPointToRoad` and offline road caching can be relied upon.

**Exit criteria:** permissions can be denied without crashes; cached OSM map data and road data can be queried offline; GPS absence is recorded as a warning rather than blocking draft creation; map packages recover after restart and remain within storage bounds.

## Checkpoint 6 - Incident location picker

**Goal:** create an auditable, editable incident location.

**Progress:** Picker centers on officer GPS when available; blue officer Marker vs fixed teal center pin are distinct; `onRegionChangeComplete` feeds coordinates, distance, and snap status into the bottom sheet; officer `gps_coords` and selected `incident_coords` captured separately with a `gps_unavailable` flag; debounced (900ms, aborted) `road.snapPointToRoad` persists `road_snap` on confirm; accuracy/distance warnings above thresholds; zone check on confirm stores a non-blocking warning; no-GPS hint shown; previous pin restored for Edit Location. Direction/lane manual correction remains pending with reference-data work.

**Exit criteria:** location can be selected and confirmed fully offline from cached OSM map data and road geometry; both coordinate sets and all derived road fields are preserved in the draft; airplane-mode behavior is verified on Android and iOS.

## Checkpoint 7 - Accident form phases 1-3

**Goal:** complete the report identity, classification, police, and croquis sections.

**Progress:** `/incident/details` hosts phases 1-3 with a stepper header («مرحله N از ۳»), progress bar, forward validation gating, free backward navigation, read-only meta card + editable Gregorian datetime, chip-based pickers, conditional police block, and pure per-phase Persian validation (`domain/accident-form.ts`). References load cache-first via `type.gets`/`collision_type.gets`/`croquis_type.gets` into SQLite with stale-on-offline fallback; autosave debounces 500 ms to SQLite and flushes on every transition/back. Severity was captured locally only (no backend severity field) and police station as free text (no `police_station.gets` act) — see the backend handoff for the resolved path.

**Exit criteria:** an incomplete report survives reload and can return to the exact phase/location without data loss.

## Checkpoint 8 - Accident form phases 4-7

**Goal:** capture the full operational accident payload.

**Progress:** Form expanded to all seven phases — vehicle cards (type/brand/type-model/color/year/final status/plaque type+3-part number+usage/fault/motion direction/third-party & body insurance/driver block with licence and injury refs), people sections (passengers/pedestrians/generic people with role+age), environment (air multi, light, road situation, surface multi, defects multi → root array relations via mapper `ARRAY_RELATION_KEYS`), and facility damage cards (asset group/code, severity, quantity/unit, hazard/repair flags, temporary action; images pending). All 27 reference lists load through the generic cache-first `loadReferenceSet`. The sync worker blocks submission of drafts with incomplete required vehicle cards — draft stays queued with an explanatory hint and no attempt penalty. Data persists in backend-shaped DTO keys so the idempotent payload needs no transformation.

**Exit criteria:** a complete seven-phase accident maps to the backend schema and passes client validation without losing optional data.

## Checkpoint 9 - Media and categorized uploads

**Goal:** attach reliable evidence to reports.

**Progress:** `media-service.ts` captures (camera) or picks (library), resizes to ≤1600 px and compresses to JPEG q0.7 via `expo-image-manipulator`, then copies into `Documents/media/<uuid>/` with the `expo-file-system` `File/Directory/Paths` API so URIs survive cache clears; SQLite rows live in the `media` table. Categories `plate`, `insurance`, `croquis`, `damage` enforced via `MediaSection` (vehicle cards `vehicle:<i>`, police phase `croquis`, facility cards `facility:<i>`). Deletion removes both file and row; replacement overwrites atomically. Upload/reconciliation intentionally deferred on the (then open) backend Step 11 categorized-upload contract — the sync worker does not send media until that contract lands.

**Exit criteria:** media survives app restart and is neither uploaded twice nor orphaned after a report retry. Local persistence verified by design; upload-side criteria wait for the backend contract.

## Checkpoint 10 - Reports, announcements, map, and More

**Goal:** complete daily operations around the report workflow.

**Progress:** Reports tab loads live `accident.getMyReports` (page 1, limit 50, pull-to-refresh + retry) showing report id, Persian date, sync + review status chips (submitted/under_review/returned/approved/completed), rejection notes, and an «اصلاح گزارش» button when a returned/rejected report matches a local draft uuid. More tab shows profile fields, live shift/unit/vehicle from `shift.getActiveShift` (no-shift + retry states), device id, app version, functional logout, and به‌زودی rows for PIN/biometric, app-lock, notifications, offline map packages, guide/support. Announcements remain a placeholder (backend channel); map incidents/roads need backend geometry + patrol map act.

**Exit criteria:** an officer can log in, understand the current shift, create/edit/sync a report, see corrections, receive announcements, and recover from offline operation.

## Checkpoint 11 - Emergency path

**Goal:** provide a deliberate, auditable emergency action.

- [ ] Implement confirmation sheet with officer identity, unit, vehicle, GPS, and connection status.
- [ ] Prevent accidental activation and show clear progress/result.
- [ ] Integrate the approved online SOS endpoint.
- [ ] Integrate and test the approved offline SMS/call fallback.
- [ ] Record local attempt/result without exposing sensitive data in logs.

**Exit criteria:** emergency behavior is approved by operations and tested on real devices in online and offline conditions.

## Checkpoint 12 - Hardening and release readiness

- [ ] Unit, integration, persistence, and end-to-end tests for all critical paths.
- [ ] Test Android/iOS permissions, biometrics, notifications, maps, camera, microphone, GPS, backgrounding, force-close, and restart.
- [ ] Test RTL, Persian text, numeric keyboard, paste behavior, accessibility, touch targets, and sunlight contrast.
- [ ] Run `npx expo lint`, TypeScript checks, and production builds.
- [ ] Run security review for storage, logs, screenshots, network failures, and token revocation.
- [ ] Record unresolved backend blockers and obtain sign-off.

## Checkpoint 13 - Backend-v2 adoption (incident types · org/unit · process wizard · modules)

**Goal:** migrate the app from the pre-v2 (accident-only) contract to the `HEAD` backend shipped 2026-09-07. Authoritative phased brief: `mobile/docs/01-MOBILE_BACKEND_V2_ADOPTION.md` (phases A–F, STOP after each).

**Backend delta (documented, no code change in this run):**
- `accident` is now a polymorphic report: `incident_type` (accident/road_breakdown/road_obstacle/other), `incident_payload`, new `incident_severity` relation (`incidentSeverityId`), `BRK-/OBS-/OTH-` report prefixes, `incidentType` filters, `dynamic_answers` + `process_version`.
- Org/unit/`user.roles` structure; patrol officers are `unit(type:"Patrol")` members; legacy `police_station`/`patrol_unit`/`shift` kept for one release.
- `accident_process.getForPatrol` = the patrol wizard endpoint (steps/questions + resolved whitelisted answers); org resolution requires membership.
- `app_modules` licensing: `incident_patrol` gates the patrol surface; `modules`/`orgModules` returned by login/getMe; module-off Persian errors; Ghost exempt.
- `file.uploadAccidentImages` adds the `incident` photo category.

**Progress:** documentation fully synced (new `01-…` brief; `CONTINUE.md`/`TODO.md`/`Design.md`/`TODO_HISTORY/*`/`mobile/AGENTS.md` updated). No mobile source changes yet.

- [ ] Phase A — contract sync: session stores `modules`/`orgModules`; media categories gain `incident`; module/org Persian error branches.
- [ ] Phase B — incident-type ungate: tiles send the chosen type; draft/mapper/sync serialize `incident_type` (+ `incident_payload`/`incidentSeverityId`).
- [ ] Phase C — per-type capture forms (خرابی/مانع/سایر): description + road defect/equipment damage/incident severity/lane; no accident DTO phases; `incident_severity` joins the reference set.
- [ ] Phase D — lists/map: type labels, `incidentType` filter, type-aware `nearbyAccidents` markers.
- [ ] Phase E — process-driven wizard from `accident_process.getForPatrol`; relation/dynamic submit mapping + `process_version`; offline version-change refetch; record the `{process:null}` fallback decision.
- [ ] Phase F — module gating UX, media enablement (`EXPO_PUBLIC_ACCIDENT_UPLOADS=on` incl. `incident`), full verification and doc update.

**Exit criteria:** all four incident types register offline-first and sync with correct prefixes; non-accident reports never carry accident-only fields; process wizard renders with whitelisted answers/validation/`process_version`; module-off and no-membership states degrade gracefully (Persian notice); `tsc`/`lint`/`test` clean.
