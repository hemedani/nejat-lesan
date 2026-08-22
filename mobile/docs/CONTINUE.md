# CONTINUE - Mobile Patrol App

This is the ordered execution plan for the next developer or coding agent. Work in small checkpoints. At each checkpoint, keep the app runnable, run the focused checks, and record the result here before moving on.

## Current state

- Expo SDK `~57.0.15`, React `19.2.3`, React Native `0.86.2`, Expo Router `~57.0.15`.
- The mobile project is still near the starter scaffold under `mobile/src`.
- `mobile/docs` was created with this file and `TODO.md`.
- The PDF assets are image-based design references. Use the Persian requirements documents for exact behavior and use the PDFs for visual composition.
- Backend execution Steps 1-9 are documented as complete and verified against local services.
- Backend Steps 10-11 remain open: sync status/announcements and categorized uploads.
- Do not assume that backend completion means production data is ready: production roads currently have no `area` geometry.

## Working rules

1. Read `mobile/AGENTS.md` and the exact Expo SDK 57 documentation before using a new Expo API.
2. Keep all user-facing copy Persian and the interface RTL. Keep code identifiers and API field names aligned with backend contracts.
3. Treat the server as authoritative for permissions, active shift, vehicle, patrol unit, reference data, report status, road snapping, and zone validation.
4. Cache first, refresh second. Offline must not disable report creation, draft editing, media capture, GPS, or the location picker.
5. Every report draft gets one persistent `client_report_uuid`. Retries reuse it.
6. Keep passwords out of storage and logs. Store tokens only in secure storage.
7. Preserve the `{ success, body }` response envelope and translate errors centrally.
8. Do not mark a checkpoint complete until its focused verification passes.

**Toolchain:** use fnm-managed Node `v22.22.2`, npm `10.9.7`, and pnpm `10.8.0`. Verify `which node`, `node --version`, `which npm`, `npm --version`, `which pnpm`, and `pnpm --version` before checks; avoid stale system/Homebrew Node binaries.

**Declaration sync:** after backend declaration changes, run `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` from the Lesan repository root. Mobile TypeScript reads `back/declarations/selectInp.ts` directly, while the frontend copy keeps the web client synchronized.

**Font:** Estedad weights are bundled in `mobile/assets/fonts` from `/Users/syd/work/katiraei/ziwound/front/public/fonts/Estedad` and loaded at the app shell.

## Checkpoint 0 - Baseline and decisions

**Goal:** establish a known starting point.

- [x] Read `mobile/AGENTS.md`, `mobile/README.md`, package versions, and current routes/components.
- [-] Run the existing app on an emulator or device. Emulator/device launch remains pending.
- [-] Run `npx expo lint` and record baseline failures. With the fnm Node `v22.22.2` / pnpm `v10.8.0` toolchain, lint runs but reports the existing starter error in `src/hooks/use-color-scheme.web.ts` (`react-hooks/set-state-in-effect`).
- [-] Confirm API URL, auth environment, supported platforms, map provider, offline map strategy, local database, and emergency fallback. Supported SDK 57 platform requirements are recorded below; product/backend choices remain open.
- [x] Record decisions in this file under `Decisions`.

**Exit criteria:** starter app launches; baseline lint result is recorded; platform and backend endpoint decisions are explicit.

## Checkpoint 1 - App foundation and contracts

**Goal:** create stable infrastructure before screens.

- [ ] Add environment/config loading.
- [-] Add typed API client, envelope parser, timeout, connectivity-aware requests, and centralized translated errors. The client now uses the mobile-local frontend-compatible `lesanApi({ URL, baseHeaders }).send(...)` helper, derives patrol request types from `back/declarations/selectInp.ts`, and performs known-offline preflight; weak-network policy and device testing remain pending.
- [ ] Add domain types for user/device/shift/vehicle/road/reference/accident/sync.
- [-] Add secure session repository and non-sensitive cache repository. Repository contracts, serialization, and the SDK 57 `expo-secure-store` adapter are present in `mobile/src/storage`; local cache/database selection remains pending.
- [-] Add a connectivity service with online/offline/weak states. Implemented in `mobile/src/services/connectivity.ts` using SDK 57-compatible NetInfo; real-device and weak-network behavior testing remain pending.
- [-] Add a local database abstraction for drafts, media metadata, queue entries, and cached reference data. Expo SDK 57 `expo-sqlite` is selected and implemented in `mobile/src/storage/local-database.ts`; process-kill/restart and migration tests remain pending.

**Progress:** Foundation now includes environment loading, declaration-backed Lesan act transport, timeout/error translation, core patrol domain types, SDK 57 `expo-secure-store` session storage, NetInfo connectivity classification/API preflight, an Expo SQLite repository for drafts/media/queue/reference data, and a SecureStore-backed session lifecycle service. UI integration, migration/recovery checks, and all device-level testing remain pending until the first login or Home page exists.

**Exit criteria:** a mocked request can be parsed; secure session data can be written/read/cleared; a draft record survives app reload; no secret is logged.

## Checkpoint 2 - Authentication and session lifecycle

**Goal:** deliver a secure first-login and subsequent-unlock path.

- [-] Implement the RTL Persian login screen based on the login PDF. The first route is implemented in `mobile/src/app/index.tsx`; branding and support destinations remain provisional.
- [x] Validate numeric-only personnel code and password requirements. Numeric filtering, keyboard type, and the backend minimum password length are implemented; paste disabling remains platform-specific.
- [x] Collect device metadata using SDK 57-compatible APIs.
- [-] Call `user.mobileLogin` and persist token/device/session data securely. The login UI now calls the declaration-typed session service; authenticated navigation remains pending.
- [-] Translate invalid credentials, inactive account, non-Patrol, lockout, offline first-login, and revoked-device responses. Backend validation `body.message` is now surfaced and development failures are logged without request secrets; specific category mapping remains pending.
- [-] Add authenticated route protection, logout, session restoration, and revoked-session cleanup. Login-to-Home navigation, session restore, logout, and revoked-session service methods are present; full protected routing remains pending.
- [ ] Add optional PIN/biometric unlock and background app lock. Defer all device-level testing until the first login or Home page exists.

**Backend contract:** login accepts personnel code, password, and device metadata; returns token, user, permissions, and devices. The JWT is device-scoped and a revoked device must fail on the next request.

**Exit criteria:** first login requires network; a valid prior session opens offline; password is never stored; a revoked device returns to a safe unauthenticated state.

## Checkpoint 3 - Authenticated shell and Home

**Goal:** make the app navigable and operationally truthful.

- [-] Add five-tab RTL navigation with Home centered. The first authenticated Home route is implemented; the five-tab shell remains pending.
- [-] Load cached identity and dashboard data immediately. SecureStore session identity loads before active-shift refresh; broader dashboard cache rendering remains pending.
- [-] Refresh profile and active shift in the background. Home refreshes active shift on startup, manual refresh, and connectivity changes; profile refresh remains pending.
- [-] Use `shift.getActiveShift` for unit, vehicle, and shift context. The declaration-typed adapter and initial Home rendering are implemented.
- [-] Implement connection, GPS, and last-sync status components. Connection and last-sync indicators are present on Home; GPS status remains pending.
- [-] Add Register New Incident, Drafts, My Reports, Announcements, Map, Emergency, and More entry points. Register New Incident now opens the initial draft route; remaining entry points are pending.
- [-] Make offline registration available and visibly explain local saving. The initial draft route creates and persists a local draft without network; the complete workflow remains pending.

**Backend contract:** active shift response embeds patrol unit and vehicle. Do not substitute static user fields.

**Exit criteria:** dashboard is useful with network disabled; cached data appears before refresh; no action needed for incident registration is disabled because of offline state.

## Checkpoint 4 - Draft engine and sync queue

**Goal:** guarantee no data loss and no duplicate server reports.

- [ ] Define draft schema and migration/versioning strategy.
- [x] Generate and persist `client_report_uuid` at draft creation.
- [-] Auto-save changes with debouncing and flush on navigation/background. Initial draft persistence is present; field-level autosave remains pending.
- [x] Implement queue states `draft`, `queued`, `syncing`, `synced`, `rejected`. The local queue schema and status type are present; worker transitions remain pending.
- [ ] Add retry/backoff and connectivity-triggered sync.
- [ ] Submit through idempotent accident add/update; store server `_id`/`report_id` when acknowledged.
- [ ] Add queue screen, retry-now action, rejection reason, and native sync notifications.
- [ ] Use `accident.getMyReports` to reconcile server status.

**Important backend limitation:** `getSyncStatus` is still planned. Keep the client repository ready for it, but do not invent an incompatible endpoint contract.

**Exit criteria:** kill the app during save and during sync; restart it; the draft and queue resume; replaying the same request never creates a second report.

## Checkpoint 5 - Permissions, GPS, and offline road cache

**Goal:** prepare reliable field location behavior.

- [ ] Request Location, Camera, Microphone, and Notifications at the relevant workflow point with Persian explanations.
- [ ] Build road-cache download and invalidation metadata using `road.getRoadsGeometry`.
- [ ] Use OpenStreetMap (OSM) as the only map data/base-map direction; confirm attribution, tile-provider terms, caching limits, and production suitability.
- [ ] Confirm how OSM tiles, road geometry, and offline-map package metadata are stored and bounded to a patrol area.
- [ ] Define download progress, cancellation, resume, expiration/invalidation, and low-storage behavior for offline OSM packages.
- [ ] Add GPS accuracy/availability state and manual-selection fallback.
- [ ] Integrate an Expo SDK 57-compatible OSM map and test Android/iOS rendering; do not add satellite imagery or a satellite mode.

**Backend blocker:** production road records need `area` geometry before `snapPointToRoad` and offline road caching can be relied upon.

**Exit criteria:** permissions can be denied without crashes; cached OSM map data and road data can be queried offline; GPS absence is recorded as a warning rather than blocking draft creation; map packages recover after restart and remain within storage bounds.

## Checkpoint 6 - Incident location picker

**Goal:** create an auditable, editable incident location.

- [ ] Center on the officer's location when available and distinguish officer marker from fixed incident pin.
- [ ] Pan map beneath the fixed center pin and continuously update the summary sheet.
- [ ] Capture officer `gps_coords` and selected incident `location` separately.
- [ ] Call `road.snapPointToRoad` for road, direction, km, meter, nearest point, and lanes.
- [ ] Allow direction correction and lane selection from server reference data.
- [ ] Show accuracy, distance from officer, road-boundary/zone warnings, and manual no-GPS warning.
- [ ] Save the draft on entry and confirmation; restore the pin for Edit Location.

**Exit criteria:** location can be selected and confirmed fully offline from cached OSM map data and road geometry; both coordinate sets and all derived road fields are preserved in the draft; airplane-mode behavior is verified on Android and iOS.

## Checkpoint 7 - Accident form phases 1-3

**Goal:** complete the report identity, classification, police, and croquis sections.

- [ ] Build phase navigation and progress.
- [ ] Render read-only metadata and editable accident date/time.
- [ ] Load severity and collision type from references.
- [ ] Add police-present conditional fields and croquis selection.
- [ ] Add officer cause description.
- [ ] Validate and auto-save every transition.

**Exit criteria:** an incomplete report survives reload and can return to the exact phase/location without data loss.

## Checkpoint 8 - Accident form phases 4-7

**Goal:** capture the full operational accident payload.

- [ ] Add dynamic vehicle cards, driver details, insurance fields, and vehicle final status.
- [ ] Add dynamic people cards and derived injury/death counts.
- [ ] Add weather, lighting, surface, geometry, and road-defect fields.
- [ ] Add facility damage cards with hazard, repair, temporary action, quantity/unit, and media references.
- [ ] Load all reference values from shared acts; do not hardcode lists.
- [ ] Prevent sync of incomplete required vehicle cards while allowing local draft editing.

**Exit criteria:** a complete seven-phase accident maps to the backend schema and passes client validation without losing optional data.

## Checkpoint 9 - Media and categorized uploads

**Goal:** attach reliable evidence to reports.

- [ ] Implement capture/select, preview, compression, replacement, deletion, and local persistence.
- [ ] Keep categories `plate`, `insurance`, `croquis`, and `damage` explicit.
- [ ] Implement upload retry and report-media reconciliation.
- [ ] Integrate the backend categorized upload/attachments contract once Step 11 is complete.

**Exit criteria:** media survives app restart and is neither uploaded twice nor orphaned after a report retry.

## Checkpoint 10 - Reports, announcements, map, and More

**Goal:** complete daily operations around the report workflow.

- [ ] Build My Reports with server statuses and correction navigation.
- [ ] Build announcements and unread state once the backend channel is available.
- [ ] Build read-only OSM map with cached roads and registered incidents; satellite imagery is out of scope.
- [ ] Build profile, shift, vehicle, settings, guide, support, about, device list, and logout screens.
- [ ] Add settings for PIN/biometric, app-lock timeout, notifications, map cache, and diagnostics.

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

## Backend handoff checklist

- [ ] Confirm `getMe` payload or equivalent profile sync contract.
- [ ] Confirm `getSyncStatus` request/response and status ownership.
- [ ] Confirm announcement/notification delivery and read-state contract.
- [ ] Confirm categorized upload/attachment contract and limits.
- [ ] Confirm production road geometry backfill and offline map coverage.
- [ ] Confirm emergency endpoint and offline fallback policy.
- [ ] Confirm all acts preserve `{ success, body }`.

## Decisions

Record decisions here with date, owner, and consequence.

- [-] API base URL and environment strategy: Follow the frontend's `LESAN_URL` convention with Expo's public `EXPO_PUBLIC_LESAN_URL` at build time; the mobile client appends `/lesan`. Use `http://10.0.2.2:1404` for an Android emulator and the computer's LAN IP (not `localhost`) for a physical phone. A legacy `EXPO_PUBLIC_API_URL` fallback remains supported.
- [-] API type source: Use `back/declarations/selectInp.ts` through `@backend/*` for mobile act types. Keep the frontend-compatible runtime adapter local in `mobile/src/api/lesan-api.ts` because Metro cannot resolve runtime imports from the external frontend workspace.
- [-] Local database/storage choice: Expo SDK 57 `expo-sqlite` is selected for structured drafts, media metadata, sync queue records, and cached references. The schema/repository is implemented; migration and process-recovery tests remain pending.
- [-] Map provider and offline tile strategy: OSM-only is decided. Confirm an Expo SDK 57-compatible renderer, an allowed tile provider/caching arrangement, bounded patrol-area downloads, attribution, and offline package lifecycle during Checkpoint 5.
- [-] Emergency online endpoint: Undecided; requires operations approval.
- [-] Emergency offline fallback: Undecided; requires operations approval.
- [-] `getSyncStatus` contract: Backend dependency remains open.
- [-] Announcement delivery strategy: Backend channel remains open.
- [-] Media upload contract: Categorized upload and attachment wiring remain open.
- [x] SDK 57 baseline: Expo SDK `57.0.15` targets React Native `0.86`, React `19.2.3`, Android 7+ / API 36, iOS 16.4+, and Xcode 26.4+ per the versioned Expo documentation.
- [x] Current app shape: Expo Router starter scaffold with two native tabs (`Home`, `Explore`); no patrol workflow or backend integration exists yet.

## Checkpoint log

| Date | Checkpoint | Result | Notes / blockers |
| --- | --- | --- | --- |
| 2026-08-21 | Documentation baseline | Done | Created `mobile/docs/TODO.md` and `mobile/docs/CONTINUE.md`; mobile implementation is still at scaffold stage. |
| 2026-08-21 | Checkpoint 0 | Partial | SDK 57 docs reviewed. With fnm Node `v22.22.2` / pnpm `v10.8.0`, TypeScript and Expo config pass; lint reaches the existing starter `use-color-scheme.web.ts` hook error. No emulator/device launch performed. |
