# TODO - Mobile Patrol App

This is the implementation backlog for the Expo/React Native patrol-officer app. It is based on:

- `back/docs/04-mobile-patrol-backend-agent-guide.md`
- `back/docs/02-mobile-patrol-app-requirements.md`
- `back/docs/01-mobile-patrol-app-requirements-fa.md`
- `back/docs/06-mobile-patrol-backend-todo.md`
- `back/docs/05-mobile-patrol-backend-execution-plan.md`
- `back/docs/08-mobile-patrol-backend-handoff.md`
- `back/docs/09-mobile-patrol-backend-incident-types-todo.md` (§8/§36 = the mobile handoff)
- `back/docs/10-mobile-patrol-backend-incident-types-continue.md`
- `mobile/docs/01-MOBILE_BACKEND_V2_ADOPTION.md` (the mobile backend-v2 adoption brief)
- The visual PDF references in `mobile/ignoreAssets/`

The app is an offline-first, Persian RTL field tool for reliable incident reporting. Backend authority must be respected for permissions, shifts, vehicles, units/orgs, reference values, idempotency, road snapping, zone validation, the enabled-module set, and the report process. The backend shipped "backend v2" on 2026-09-07 (incident types, org/unit/roles, `accident_process`, module licensing). **The mobile code has adopted backend v2 (§0 below is implemented in code; what remains open are device E2E, media enablement, the map incident layer, and hardening).**

## Status legend

- `[ ]` not started
- `[-]` in progress or blocked
- `[x]` verified complete
- `[?]` requires a product or backend decision

## 0. Backend-v2 adoption (backend shipped 2026-09-07; full brief in `01-MOBILE_BACKEND_V2_ADOPTION.md`)

### Contract sync
- [x] Extend `Session`/`User` + `user.login`/`user.getMe` projections/types to carry `modules: string[]` and `orgModules?: string[]`; persist beside the session; keep `UserLevel` unchanged.
- [x] Extend media types/limits with the `incident` photo category (`file.uploadAccidentImages`); note `other` exists but is not the intended non-accident category.
- [x] Add Persian error branches for the module messages («این ماژول برای این نصب فعال نیست» / «این ماژول برای این سازمان فعال نیست») and the org-membership message («سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید»).

### Incident types (accident / road_breakdown / road_obstacle / other)
- [x] Ungate the خرابی آزادراه / مانع یا خطر در مسیر / سایر tiles in `src/app/incident/index.tsx`; record the chosen `incident_type` on the draft (default `accident`). Route: تصادف → seven-phase wizard, others → `/incident/simple`, org process → `/incident/process` (process-first).
- [x] Draft model + `DRAFT_SCHEMA_VERSION` handling for `incident_type`; mapper/sync emit `incident_type` + `incident_payload` + `incidentSeverityId` only when set; the `draft → queued → syncing → synced/rejected` transition and update-by-uuid correction loop stay shared and unchanged.
- [x] Per-type capture forms for the three non-accident types: `incident_payload` (description/is_hazard/needs_repair/temporary_action/follow_up_required) + reference pickers (`road_defect` multi, `equipment_damage` multi, `incident_severity` single, `position`). No vehicle/people/facility/collision/type-severity phases (server rejects them for non-accident).
- [x] Add `incident_severity` (کم/متوسط/زیاد/بحرانی) to the cache-first reference set; non-accident flows must NOT set the accident `typeId`.
- [x] Client-side Persian validation mirroring the server rules; submit verified against a backend for `BRK-/OBS-/OTH-` prefixes remains a device E2E step.

### Lists and map
- [x] Drafts/Reports render the incident-type label; Reports fetch with the `incidentType` filter.
- [ ] Map tab: render non-accident markers from `nearbyAccidents` (read `incident_type` + `incident_severity_name`) when the incident layer lands (blocked on road `area` geometry / incident-layer features).

### Process wizard (`accident_process`)
- [x] Fetch the active wizard via `accident_process.getForPatrol({ incidentType, get: { process: 1, answers: 1 } })`; the no-membership error and the `{ process: null }` state fall back gracefully (Persian notice + built-in flow). `{process:null}` decision recorded: built-in fallback for all types.
- [x] Render steps/questions (titles/descriptions, resolved `answers` or option lists, single/multi-select, free-text `dynamic`, required validation, progress) on the design system (`/incident/process`). `dto`-target questions are unsupported → built-in fallback with notice.
- [x] Submit mapping: relation-target questions → existing typed relation ids; `dynamic` questions → `accident.dynamic_answers` (value snapshots); always send `process_version`. Relation/path keys derive from the backend question registry (`road_defects` → `roadDefectsIds`, …).
- [x] Offline re-sync: sync worker compares a queued draft's `process_version` with the org's active version and pauses with a Persian notice when it changed (report reopened to complete with the new process).

### Module licensing and media enablement
- [x] Gate module-owned surfaces when `incident_patrol` is positively known-off (install or org) via a central `domain/modules.ts` helper (Ghost exempt; absent/stale `modules` degrade to "treat as enabled"; backend still enforces). Wired: Home shift feed, Reports, incident process fetch.
- [-] Enable media upload (`EXPO_PUBLIC_ACCIDENT_UPLOADS=on`) incl. the `incident` category; verify how non-accident files bind; remove the dormancy caveat in docs. Code path remains dormant until a reachable-backend/device E2E confirms upload + binding; non-accident binding is unresolved (no DTO field to write file ids into). The flag now gates **two** pipelines: the accident wizard's base64 image slots (`uploadAccidentImages`) and the dynamic form's `file` fields (multipart `uploadFile`, §7).

## 1. Project foundation

- [ ] Read the exact Expo SDK 57 documentation before adding native or Expo APIs; follow `mobile/AGENTS.md`.
- [ ] Confirm the supported Android/iOS versions, API base URL, development environment, and test devices.
- [-] Add environment configuration for development, staging, and production API endpoints. Initial `EXPO_PUBLIC_LESAN_URL` / `EXPO_PUBLIC_APP_ENV` loading mirrors the frontend's `LESAN_URL` convention and appends `/lesan`; real endpoint values remain pending.
- [-] Add a typed API client that understands the `{ success, body }` response envelope. Lesan act transport, timeout, token-header handling, and known-offline preflight are present; weak-network policy and device testing remain pending.
- [x] Add a single error translation layer; never render raw backend exceptions. Initial Persian translation for API/network error categories is present (backend-v2 module/org messages pending — see §0).
- [x] Establish the UI/UX redesign foundation per `docs/Design.md`: semantic theme tokens, icon registry, shared `ui/` primitives, light-mode lock.
- [-] Add strict TypeScript models for auth, device, user, shift, vehicle, patrol unit, accident/report, references, announcements, and sync state. Core projections are present; backend-v2 fields (`incident_type`, `incident_payload`, `modules`, media `incident`) and contract review are pending (§0).
- [-] Decide and document the local database/storage solution for structured drafts and queues. Expo SDK 57 `expo-sqlite` is selected; the versioned schema and repository are present; process-kill/restart and migration tests remain pending.
- [ ] Add a stable app-level logging strategy that excludes passwords, tokens, national IDs, and media contents.
- [-] Use the fnm toolchain for checks: Node `v22.22.2`, npm `10.9.7`, pnpm `10.8.0`; verify executable paths before running commands.

## 2. Authentication and local security

- [x] Build the Persian RTL login screen from the PDF reference on the design system: brand block, connectivity pill, icon inputs, danger error banner, loading CTA, forgot-password/support links, live version.
- [x] Use an email input with format validation and an email keyboard.
- [x] Keep the login CTA disabled until both required fields are valid; prevent duplicate submissions with a loading state.
- [x] Require an online connection for first login and show a friendly translated message when unavailable.
- [x] Call `user.login` with `email`, `password`, and device metadata: `device_id`, `fingerprint`, `platform`, `app_version`, and `model`. The response now also carries `modules`/`orgModules` (backend v2) — persist them (§0).
- [x] Store the token and sensitive session data only in platform secure storage (Keychain/Keystore). Never persist the password.
- [-] Persist enough non-sensitive cached identity data to support subsequent offline unlock. Identity cache writes are implemented; authenticated routing and UI restoration remain pending.
- [-] Map backend failures to friendly Persian messages, including inactive account, non-Patrol access, invalid credentials, lockout, offline first login, and revoked device. Known exact messages are mapped; module-off/org-membership branches and dynamic lockout text remain pending (§0).
- [ ] Add optional PIN and biometric unlock, configurable in Settings.
- [ ] Add app-lock behavior after background/device-lock timeout; prefer PIN/biometric over full credentials.
- [ ] Validate the device-scoped token online when connectivity returns and clear local session safely after revocation.
- [-] Handle logout, expired/revoked sessions, app restart, force-close, and device restart without losing local drafts. Service methods exist; UI integration remains pending.
- [ ] Test secure storage and biometric fallback on both platforms.

## 3. App shell and dashboard

- [-] Create authenticated routing that opens Home after login and bypasses Login when a valid local session exists. Restore/redirect wiring exists; full guard coverage remains.
- [x] Implement RTL navigation with five tabs: Reports, Announcements, Home, Map, More; Home central. Custom RTL floating-dock tab bar with raised Home FAB, active pill, unread-count badge.
- [-] Build the Home dashboard using cached data first, then background refresh. Redesigned per `docs/Design.md` §9.2 (identity header, organization card, unit/vehicle strip, status trio, sync row, offline banner, hero CTA, quick grid, offline-map card, pull-to-refresh). Cache-first rendering beyond session identity remains pending.
- [ ] Show officer identity from the user profile as read-only.
- [-] Fetch live operational context from `shift.getActiveShift`, not static user fields. Adapter + initial rendering implemented; deduplicated via in-flight guard + cooldown + one-time restore.
- [-] Show active patrol unit, active vehicle, shift type/time, server-derived shift status, internet status, GPS status, and last sync time. Unit/vehicle strip + status trio + last-sync live.
- [-] Define visible states for active, near-end, ended, out-of-shift, and shift-information-unavailable. Home distinguishes `active`, `no_active_shift`, `unavailable`, `loading`; near-end/ended derivation remains pending.
- [-] Keep incident registration, draft editing, media capture, and GPS usable while offline. Home preserves the entry point offline; complete offline workflow across all incident types remains pending.
- [-] Add the large Register New Incident CTA and offline notice without disabling the action. Hero always tappable; full multi-type + process flow pending.
- [ ] Add the Emergency flow as a distinct confirmation sheet with officer, unit, vehicle, and current location.
- [ ] Decide and implement offline emergency fallback (SMS/call) with the operations team. [?]
- [-] Add draft badge, My Reports, announcements, map shortcut, and More menu entries. Quick grid wired; announcements unread badge on tab/Home; Emergency pending.
- [ ] Keep touch targets at least 44-48dp and use high-contrast status colors suitable for sunlight.

## 4. Connectivity, cache, and synchronization

- [-] Track online, offline, and weak-connection states without blocking field workflows. NetInfo classification + known-offline preflight present; weak-network policy pending.
- [x] Generate one UUID `client_report_uuid` per draft; preserve it for the draft's entire lifecycle.
- [-] Auto-save after every field change, phase transition, media operation, navigation/back action, background event, and app shutdown. SQLite autosave implemented; per-surface flush coverage remains.
- [-] Persist draft data, media references/files, and queue records across force-close, restart, and low battery. SQLite persistence wired; recovery testing pending.
- [x] Model local statuses: `draft`, `queued`, `syncing`, `synced`, `rejected`. Stale-`syncing` recovery after 10 minutes.
- [x] Stop sending `submitted_from` on the correction path. It is declared on the `add` validators **only** (`back/src/accident/add/add.val.ts:28`, `back/src/incident_report/add/add.val.ts:14`), so the worker stamping it into the single payload it sent to whichever act `pickSubmissionAction` chose made every `accident.update` / `incident_report.update` fail with `Expected a value of type 'never'` — superstruct's answer for an unknown key in a strict object. The act is now decided *before* the payload is assembled and the key is removed on `update`; it has to happen in the worker, not in either mapper, because `buildIncidentReportAddSet` stamps it itself. `add` still carries the stamp, which the server's oversight statistics count on (`back/src/incident_report/oversight/pipeline.ts`) — losing it there would be as much a bug as sending it on update. Regression tests assert the *payload* of both update calls, and the pre-existing correction test (which walked past this by counting calls only) now asserts it too. Both new tests were confirmed to fail with the fix removed.
- [-] Implement a retry-safe sync worker with bounded retries, backoff, connectivity triggers, and duplicate suppression. Single-flight worker present (5 attempts, 1/5/15/60 min backoff, uuid idempotency); correction loop via `accident.update` by uuid + `accident.resubmitReport`; edits requeue synced drafts. `incident_type` serialization (§0) and device testing pending.
- [-] Submit complete reports through the idempotent accident add/update acts; do not create a new UUID on retry. Typed wrappers store server `_id`/`report_id`; per-type payloads pending.
- [x] Use `accident.getMyReports` for server history and status/rejection notes. Live list with dual status chips; `incidentType` filter (§0) pending.
- [-] Integrate `getSyncStatus` when useful. The backend act exists (buckets `draft/queued/syncing/synced/rejected`, now `incident_patrol`-gated) and is E2E-verified; mobile wiring remains pending.
- [-] Show queue counts and the last successful sync on Home and the sync page. `/drafts` lists queue state; Home shows last sync only.
- [ ] Send native notifications for successful and failed sync attempts.
- [-] Make sync observable: attempt time, next retry, error category, server report ID, and rejection reason. Drafts screen shows attempts/retry/errors/report id.
- [ ] Define conflict handling for a locally edited report that was already updated on the server. [?]
- [ ] Test interrupted uploads, duplicate requests, airplane mode, app kill, clock changes, and partial failures.
- [x] End an offline submit in a settled «ذخیره شد» state instead of a dead end. The worker returned early when offline **without emitting an event**, so `progress.phase` stayed `planning` and `UploadModal` — which has no terminal state for "the run never began" and receives no `onDismiss` on the four incident screens — rendered a full-screen 0% spinner with no error and **no buttons at all** (on iOS, unescapable). `SyncRunSummary.blocked` now reports `'offline' | 'no_session' | null` and the worker emits a `deferred` event; the reducer folds it into a new `queued` phase (neither `done`, which would claim a report the server never saw, nor `failed`, which would blame the officer for a save that worked), the modal settles it with a neutral badge and the existing «بستن» → drafts board, and `resolveSendOutcome` keeps the queue from advancing past a parked report. Also closes the identical hang when the session cannot be restored and when signal drops mid-run. Verified `pnpm test` 613/613 (+16); on-device airplane-mode submit still pending above.

## 5. Offline maps and incident location

- [x] Fetch and cache the organization's own road, and draw it on the map. The 1:1 `organization.road` relation returns the geometry **inline** (`area`, `origin`, `destination`, `total_length_meters`, `lanes`), so `organization.get` with a nested `road` want-marker is the whole fetch — no new backend act, and nothing depends on `getRoadsGeometry`'s `$geoIntersects` filter, which matches nothing until the geometry is backfilled. Stored per **organization** (not per road) in a new `org_road_geometry` table (migration v5), because a device out of coverage has to answer "which road is this officer's" with no request. Drawn natively as MapLibre `GeoJSONSource` + `Layer` pairs — a casing under a primary stroke, plus a symbol label — so it renders in the style's own loop and pans/zooms with the tiles; no WebView, no canvas, no bridge. `domain/road-overlay.ts` turns the stored geometry into GeoJSON. Both the location picker and the Map tab draw it, from SQLite only. **Blocked for real organizations on the data side:** all ~1490 production roads have no `area`; see `back/prompt/07-backfill-road-area-geometry.md`.
- [ ] Confirm production road geometry is backfilled before relying on snapping or offline linear referencing (~1490 production roads lack `area`).
- [-] Use OpenStreetMap (OSM) as the only map data/base-map direction; verify attribution, tile-provider terms, caching limits, and production suitability. Map data now comes only from the self-hosted vector tile server (`lesan/tiles`) named by `EXPO_PUBLIC_MAP_STYLE_URL`; no third-party tile host is on the critical path, and the app has no OSM fallback. Serving attribution/terms and an HTTPS origin for the self-hosted deployment are still to be settled.
- [x] Choose and integrate an SDK 57-compatible map implementation with a bounded offline vector strategy — native `@maplibre/maplibre-react-native` against the self-hosted ZXY MVT server (maxzoom 14; MapLibre overzooms beyond it), with `OfflineManager` packs: national Iran base z4–10 + opt-in z4–12, and an organization area pack at z13–14. Android-first. Device E2E pending.
- [-] Define offline map package versioning, storage limits, expiration/invalidation, progress, cancellation, resume, and low-storage behavior. Progress/pause/resume/cancel/delete + upgrade path implemented; staleness refresh and a storage-cap setting pending.
- [-] Build the location picker shown in the PDF. Redesigned per `docs/Design.md` §9.3 (pulsing pin, legend chips, accuracy pill, snap banner, grabber sheet, confirm CTA).
- [x] Frame the picker on the officer's organization (`organization.location` + `location_zoom`, cached on the session) when GPS is unavailable, and offer a «مرکز سازمان» recentre in the sheet. Officer GPS still wins on mount; edit mode keeps zoom 17 so re-opening a filed incident doesn't jump to the org's whole territory.
- [x] Show the officer's organization on Home (name, code, centre) and in the location sheet, read from the session so both render offline. Renders «سازمانی ثبت نشده» when `primaryOrganization` is `null` (global/multi-org caller) rather than picking one org arbitrarily.
- [x] One action on the org card, «آماده‌سازی برای کار آفلاین», prepares the device for working without signal: it fetches the organization's forms **and** its road, because an officer presses one button at base rather than one per thing they might need. The halves are deliberately asymmetric — `services/prepare-org-offline.ts` fails the whole preparation if the forms cannot be fetched (the forms are what the officer came for) but treats the road as best-effort, because an organization legitimately has none and that must not be reported as a failure. `road` is a three-state (`stored`/`none`/`failed`) rather than two: the last two lead to opposite actions, and collapsing them leaves the officer unable to tell whether to retry or to stop looking.
- [x] Let the officer download their organization's own forms for offline use from the org card on Home, and serve them first. New `offline_forms` table (migration v4) caches whole `form_definition.getForPatrol` payloads — definition **and** the backend-resolved `options` map, which is what makes the dropdowns work offline — plus the accident `accident_process` wizard. All four read sites now go through `services/offline-forms-service.ts`, which reads SQLite first and never touches the network from a screen; the single button is the only network trigger. Downloads are authoritative (a form the org stopped publishing is pruned) but only prune on a complete run, and a failed `accident_process` check keeps the stored wizard rather than reading as a withdrawal. `resolveIncidentRoute` lost its `online` input — presence in local storage decides. The sync worker now holds a form draft whose `form_version` the org has moved past, exactly as it already did for `process_version`. Both systems cached per the operator's decision. Device E2E pending.
- [x] Capture both `gps_coords` (device position) and incident `location` / `incident_coords` (selected point).
- [-] Show GPS accuracy and permit manual selection when GPS is unavailable, with an explicit warning. Accuracy/warning hints + shared `GpsActionButton` recovery present; threshold tuning and device verification pending.
- [-] Call `road.snapPointToRoad` and display route, direction, kilometer, meter, nearest point, distance, and lanes. Debounced snapping implemented; production `area` geometry still missing.
- [ ] Allow manual direction correction and lane selection from reference data, not hardcoded labels.
- [ ] Show distance from officer to selected point and warn when unusually far away.
- [-] Call `road.validatePointInZone`; warn on out-of-zone selection while preserving confirmability. Zone check runs on confirm (non-blocking); requires an active shift.
- [x] Do not implement satellite imagery or a satellite map mode; OSM only.
- [x] Save the selected location immediately and allow Edit Location later with the previous pin restored.
- [-] Keep the picker fully usable without network and without GPS using cached OSM map data; record the GPS-unavailable condition. Road-geometry caching blocked on the backend `area` backfill.
- [ ] Test OSM map rendering, cache availability, package recovery after restart, and incident selection in airplane mode. Android-only: airplane-mode rendering, force-close resume, upgrade path, cellular auto-pause remain to be device-tested.

## 6. Incident/report form

- [x] Add a report-type/incident entry point after location confirmation. `/incident/index` rebuilt per Design.md §9.4 with iconed type cards; only تصادف was live — §0 (backend v2) unblocks the other three types.
- [-] Build the seven-phase accident wizard with progress, Back/Next, validation, and draft restoration. Shell + all seven phases live (`details.tsx`, `incident-phases.tsx`); remaining polish (per-option icons, date picker) plus the backend-v2 process-driven renderer (§0).
  1. Basic information
  2. Classification
  3. Police and croquis
  4. Involved vehicles
  5. People
  6. Environment and road status
  7. Facility damage
- [-] Keep server-filled metadata read-only while allowing accident date/time correction. Meta card implemented; datetime is Gregorian text — Persian calendar picker pending.
- [-] Load severity, collision type, vehicle type, final status, driver status, injury status, person role, damage severity, lane, weather, lighting, surface, geometry, road defect, equipment damage, police station, croquis, color, brand, and model from backend reference acts. Cache-first loading present. Severity maps to the `type` model (`typeId`); non-accident severity uses the new `incident_severity` model (§0). Police station is a cache-first ListRow picker from `police_station.gets` (manual fallback while seed data missing).
- [-] Add client-side validation that matches backend validators with field-level Persian errors. Pure per-phase validators present for the accident wizard; per-type and process-question validators pending.
- [ ] Enforce conditional rules: injury/fatal requires people; police fields depend on police presence; facility cards depend on facility damage; required vehicle cards complete before sync.
- [x] Generate vehicle cards from a count and capture plate, vehicle, driver, and insurance data.
- [ ] Generate people cards from counts and calculate injured/deceased totals from individual records.
- [-] Capture environmental observations without presenting them as definitive legal causation.
- [-] Generate facility damage cards with asset, severity, quantity/unit, hazard, repair, temporary action, and images.
- [x] Handle the backend constraint that incomplete required vehicle cards cannot be submitted; drafts may remain incomplete locally. Sync blocks with a hint and no attempt penalty.

## 7. Media and file handling

- [-] Request and explain Camera, Microphone, Location, and Notifications permissions at the appropriate workflow point. Camera/library + location flows present; microphone/notifications pending.
- [x] Add image capture/selection, compression, preview, replacement, deletion, and offline persistence. Media sections restyled on the design system.
- [x] Categorize media as plate, insurance, croquis, or damage; owner tags scope to the exact card. Backend v2 adds the `incident` category for non-accident evidence (§0).
- [-] Wait for backend-contract confidence before treating media as synced. The contract is pinned (base64 `set.file.data`, `damage → facility_damage` alias, Patrol ownership, categories incl. `incident`); the mobile pipeline is coded and integrated behind the `EXPO_PUBLIC_ACCIDENT_UPLOADS` flag — now **on** in `.env.development` (it defaults off, and with it off captured assets stay local and their ids reach the server unresolved). Device E2E pending.
- [x] Define file size/type limits, upload retry behavior, and cleanup of abandoned local media. Local cleanup of a deleted draft's folder pending draft deletion.
- [x] Ensure media paths are stable under edit: files live under `Documents/media/<uuid>/` keyed by stable ids.
- [x] Dynamic-form `file` fields capture and upload assets. `FileField` renders camera / gallery / document buttons with thumbnails, remove, and preview, and writes the captured asset ids into the answer tree (top-level and inside repeatable rows). Assets are stored in the `media` table under the `asset` category keyed by the field's instance path, so they survive restart and stay resumable offline. Upload goes through `file.uploadFile` (multipart `file` + `lesan-body`, mirroring the web client) because the field can carry photos, videos and documents — `uploadAccidentImages` is image-only. On sync the writeback does three things: swaps every local id for its server `_id` across the payload, splits each file row into `answer_ids` (server ids) and `answer_names` (filenames, so the review screen shows `photo-1234.jpg` instead of hex), and collects the referenced files as `attachmentsIds` so they join the report's «مستندات» gallery. The backend records the upload `path` on the file doc, which is what the console reads to build the URL. The write-back was being **discarded**: `sync-worker.ts` took only `assetSync.fileIds` from `syncFormAssets` and rebuilt the payload from `workingDraft.data`, so every local id survived into `accident.add`. The gallery still filled in (it is built from `attachmentsIds`, which came from those `fileIds`) while the answers kept reading `asset-1792226098313-i9oxxj` — the asymmetry that made this hard to spot. Fixed by adopting `assetSync.data` as the base. The test that should have caught it could not: the `syncFormAssets` stub echoed `draft.data` back unchanged, so "used `assetSync.data`" and "used `workingDraft.data`" produced an identical payload. The stub now performs a real write-back. Remaining: on-device E2E of the multipart path against a reachable backend, and an E2E check that a file attached *during a correction* reaches the gallery (the `accident.update` act was extended to accept `attachmentsIds` for this).

## 8. Reports, announcements, and More

- [-] Build My Reports with Sent, Under Review, Approved, and Returned for Correction states. Redesigned on primitives: working filters, tone pills, rejection banners, returned-card edit action, skeletons, error banners, EmptyState. Incident-type labels/filter pending (§0).
- [-] Highlight rejection notes and route the officer back to the affected draft. Danger-banner notes with edit action; deep-linking the exact phase pending.
- [-] Build Announcements/Notification Center for control-center messages. Priority pills with icons+tone, unread badge + right-border + bold title, expand chevron, optimistic `markRead`; backend push delivery remains open.
- [-] Build read-only Map for officer location, road routes, km markers, and approved/registered incidents. Officer-location map live; incident layer blocked on road `area` geometry (type-aware `nearbyAccidents` payload is available).
- [-] Build More: profile, shift info, vehicle info, settings, guide, support, about, logout, and device/session info where permitted. Redesigned profile card + iconed rows; device/session details where permitted remain pending.
- [-] Add settings for PIN, biometrics, app lock timeout, notifications, map downloads, and diagnostic information. Rows exist as بهزودی with toast feedback.
- [-] Drafts screen redesigned per Design.md §9.6 with true status tones, report-id rows, attempts/next-retry, error boxes, retry + sync-all, skeletons, pull-to-refresh, focus refresh. Swipe-to-delete remains pending.

## 9. Verification and delivery

- [-] Add unit tests for validators, error translation, status transitions, UUID preservation, and retry decisions. Vitest suite covers accident-form validators, severity→`typeId` mapping, sync rules + correction-path act selection, mapper payload purity, envelope parsing, error translation, media write-back, UUID preservation; backend-v2 branches (incident-type serialization, per-type validators, process answers) pending.
- [ ] Add persistence tests for draft recovery and queue recovery after process termination.
- [ ] Add integration tests for login, token revocation, active shift loading, reference loading, incident idempotency, update permissions, snapping, and zone validation.
- [ ] Test RTL layout, Persian text, numeric input, accessibility labels, keyboard behavior, 44-48dp touch targets, and low-light/sunlight contrast. Design-system QA sweep done statically; on-device sunlight/glove testing open.
- [ ] Test Android and iOS on a real device, including camera, microphone, GPS, biometrics, notifications, and background transitions.
- [ ] Add haptic feedback (adopt `expo-haptics`, SDK-57 check first) and respect reduced-motion for the pin pulse/skeleton loops.
- [ ] Run `npx expo lint`, TypeScript checks, and the vitest suite before each checkpoint.
- [ ] Verify no password/token/PII leakage in logs, local files, screenshots, or error telemetry.
- [ ] Document known backend blockers and obtain explicit sign-off before production release.

## Backend dependencies and prerequisites (current)

- **Deployment prerequisite (new):** a Patrol officer must be assigned to a `unit(type:"Patrol")` with `roles`/`organizations` before `accident_process.getForPatrol` resolves an org — otherwise «سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید». `shift`/`patrol_unit`/`police_station` still work as today for the one-release overlap.
- **Module licensing (new):** the whole patrol surface requires `incident_patrol` enabled at the installation and for the officer's org (Ghost exempt; defaults are enabled). The web module-config page (`front` doc 50) drives this.
- **Organization centre (new):** `user.login`/`user.getMe` return `primaryOrganization` (`{_id, code, name, enName, location, location_zoom}`, or `null`). Mobile caches it on the session — no extra request, so it survives offline unlock. It is `null` for a global (Ghost/Manager) or multi-org caller; that is the answer, not a gap. Seeded for the Ahvaz–Bandar Imam demo org at `Point [48.67056, 31.31823]` / zoom `13`, and `ensureDemoOrganization` backfills an org that predates the field.
- Road `area` geometry backfill for production roads (~1490) — blocks snapping, zone validation, and offline road caching.
- `police_station` seed data with real station polygons.
- Patrol email distribution (login is email-based).
- Device E2E of media upload: the flag is on and the writeback is wired end to end, but no upload has been exercised against a reachable backend from a device yet. Verify a form `file` field's photo and PDF appear in the console's «مستندات» gallery and as a filename (not an id) in the answers list.
- Push delivery (FCM/APNs provider credentials) for announcements and sync-result notifications; `device.push_token` is accepted at device-scoped login.
- Emergency: `emergency.register / gets / get / updateStatus` exist; the mobile Emergency flow and offline SOS fallback remain ops/product decisions.
