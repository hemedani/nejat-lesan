# TODO - Mobile Patrol App

This is the implementation backlog for the Expo/React Native patrol-officer app. It is based on:

- `back/docs/04-mobile-patrol-backend-agent-guide.md`
- `back/docs/02-mobile-patrol-app-requirements.md`
- `back/docs/01-mobile-patrol-app-requirements-fa.md`
- `back/docs/06-mobile-patrol-backend-todo.md`
- `back/docs/05-mobile-patrol-backend-execution-plan.md`
- `back/docs/08-mobile-patrol-backend-handoff.md`
- The visual PDF references in `mobile/ignoreAssets/`

The app is an offline-first, Persian RTL field tool for reliable accident reporting. Backend authority must be respected for permissions, shifts, vehicles, reference values, idempotency, road snapping, and zone validation.

## Status legend

- `[ ]` not started
- `[-]` in progress or blocked
- `[x]` verified complete
- `[?]` requires a product or backend decision

## 1. Project foundation

- [ ] Read the exact Expo SDK 57 documentation before adding native or Expo APIs; follow `mobile/AGENTS.md`.
- [ ] Confirm the supported Android/iOS versions, API base URL, development environment, and test devices.
- [-] Add environment configuration for development, staging, and production API endpoints. Initial `EXPO_PUBLIC_LESAN_URL` / `EXPO_PUBLIC_APP_ENV` loading mirrors the frontend's `LESAN_URL` convention and appends `/lesan`; real endpoint values remain pending.
- [-] Add a typed API client that understands the `{ success, body }` response envelope. Lesan act transport, timeout, token-header handling, and known-offline preflight are present; weak-network policy and device testing remain pending.
- [x] Add a single error translation layer; never render raw backend exceptions. Initial Persian translation for API/network error categories is present.
- [x] Establish the UI/UX redesign foundation per `docs/Design.md`: Refined Teal Ops direction, semantic theme tokens (`AppTheme`, `Radius`, `Shadow`, `Motion`, `Type`), multi-family icon registry (`constants/icon-map.ts` + `ui/icon.tsx`), shared `ui/` primitives (button, card, list-row, chip, status-pill, badge, banner, skeleton, empty-state, toast, section/screen headers, map-controls), and light-mode lock for v1 (fixes white-on-light dark-mode leaks). Screen-by-screen rollout tracked below.
- [-] Add strict TypeScript models for auth, device, user, shift, vehicle, patrol unit, accident, road, references, announcements, and sync state. Initial core domain projections are present; remaining projections and backend-contract review are pending.
- [-] Decide and document the local database/storage solution for structured drafts and queues. Expo SDK 57 `expo-sqlite` is selected; the versioned schema and repository are present, while process-kill/restart and migration tests remain pending.
- [ ] Add a stable app-level logging strategy that excludes passwords, tokens, national IDs, and media contents.
- [-] Use the fnm toolchain for checks: Node `v22.22.2`, npm `10.9.7`, pnpm `10.8.0`; verify executable paths before running commands.

## 2. Authentication and local security

- [-] Build the Persian RTL login screen from the PDF reference: logo, title, subtitle, email, password, show/hide control, login CTA, version, support, and password-help link. Redesigned per `docs/Design.md` §9.1 on the shared `TextField`/`Button`/`Banner` primitives: brand block with سامانه eyebrow + connectivity pill (آنلاین/آفلاین via live subscription), icon inputs with eye toggle and focus ring, danger error banner, lg loading CTA, forgot-password + support links (toast feedback), live app version from `expo-constants`. Branding destination remains provisional; personnel-code-vs-email decision documented in Design.md §10.1.
- [x] Use an email input with format validation and an email keyboard. Paste disabling remains a platform-specific follow-up.
- [x] Keep the login CTA disabled until both required fields are valid; prevent duplicate submissions with a loading state.
- [x] Require an online connection for first login and show a friendly translated message when unavailable.
- [-] Call `user.login` with `email`, `password`, and device metadata: `device_id`, `fingerprint`, `platform`, `app_version`, and `model`. A declaration-typed session service now constructs the request; backend device login permits both `Patrol` and `Ghost` users.
- [-] Store the token and sensitive session data only in platform secure storage (Keychain/Keystore). The SDK 57 `expo-secure-store` adapter and session lifecycle service are present; UI integration and device verification remain pending. Never persist the password.
- [-] Persist enough non-sensitive cached identity data to support subsequent offline unlock. Identity cache writes are implemented; authenticated routing and UI restoration remain pending.
- [-] Map backend failures to friendly Persian messages, including inactive account, non-Patrol access, invalid credentials, lockout, offline first login, and revoked device. Known exact messages are mapped; dynamic lockout text and broader backend category handling remain pending.
- [ ] Add optional PIN and biometric unlock, configurable in Settings.
- [ ] Add app-lock behavior after background/device-lock timeout; prefer PIN/biometric over full credentials.
- [ ] Validate the device-scoped token online when connectivity returns and clear local session safely after revocation.
- [-] Handle logout, expired/revoked sessions, app restart, force-close, and device restart without losing local drafts. Service methods for restore, logout, and revoked-session cleanup are present; UI integration remains pending.
- [ ] Test secure storage and biometric fallback on both platforms. Defer all device-level testing until the first login or Home page is implemented.

## 3. App shell and dashboard

- [ ] Create authenticated routing that opens Home after login and bypasses Login when a valid local session exists.
- [x] Implement RTL navigation with five tabs: Reports, Announcements, Home, Map, More; Home is the central primary tab. Custom RTL tab bar in `patrol-tab-bar.tsx` redesigned as a floating dock (rounded, elevated) with a raised central Home FAB (ring-separated), an active-tab soft pill, press-scale feedback, and a live unread-count badge on the Announcements tab via a shared unread-count store (synced from the announcements screen + refreshed on tab switch); visual polish on real devices pending.
- [-] Build the Home dashboard using cached data first, then background refresh. Redesigned per `docs/Design.md` §9.2: identity header with avatar initials, unit/vehicle strip from active shift, shift/internet/GPS status-card trio, sync row, offline banner, hero Register CTA, quick-access grid (drafts count badge from SQLite), restyled offline-map card, pull-to-refresh; also fixes the bare-whitespace-text-node crash in the old shift card. Status-card trio now centers its pills in-card (equal-height stretch, `alignSelf: center`) and wraps long labels (`بررسی نشده`) inside the card instead of overflowing. Cache-first rendering beyond session identity remains pending.
- [ ] Show officer identity from the user profile as read-only.
- [-] Fetch live operational context from `shift.getActiveShift`, not static user fields. The declaration-typed adapter and initial Home rendering are implemented; automatic refreshes are deduplicated with an in-flight guard, a 60s cooldown, and a one-time session restore (fixes the previous request storm).
- [-] Show active patrol unit, active vehicle, shift type/time, server-derived shift status, internet status, GPS status, and last sync time. Unit/vehicle strip + shift/internet/GPS cards (with accuracy-based دقیق/متوسط/ضعیف tones and tap-to-recover GPS) are live; last-sync row live.
- [-] Define visible states for active, near-end, ended, out-of-shift, and shift-information-unavailable. Home distinguishes `active`, `no_active_shift`, `unavailable`, and `loading` via `use-active-shift`; near-end/ended derivation remains pending.
- [-] Keep incident registration, draft editing, media capture, and GPS usable while offline. Home preserves the registration entry point offline with an explicit offline banner; the complete workflow remains pending.
- [-] Add the large Register New Incident CTA and offline notice without disabling the action. Hero CTA is always tappable and shows the offline notice; the seven-phase form remains pending.
- [ ] Add the Emergency flow as a distinct confirmation sheet with officer, unit, vehicle, and current location.
- [ ] Decide and implement offline emergency fallback (SMS/call) with the operations team. [?]
- [-] Add draft badge, My Reports, announcements, map shortcut, and More menu entries. Quick-access grid tiles wired with drafts count badge; announcements unread badge (Home + tab bar) and Emergency flow remain pending.
- [ ] Keep touch targets at least 44-48dp and use high-contrast status colors suitable for sunlight.

## 4. Connectivity, cache, and synchronization

- [-] Track online, offline, and weak-connection states without blocking field workflows. NetInfo classification, subscriptions, and known-offline API preflight are present; device testing and weak-network policy remain pending.
- [x] Generate one UUID `client_report_uuid` when a draft is created; preserve it for the draft's entire lifecycle. The initial draft service creates and persists one UUID.
- [-] Auto-save after every field change, phase transition, media operation, navigation/back action, background event, and app shutdown. Draft creation and initial queue persistence are implemented; form autosave remains pending.
- [-] Persist draft data, media references/files, and queue records across force-close, restart, and low battery. SQLite persistence is wired for these records; recovery testing remains pending.
- [x] Model local statuses: `draft`, `queued`, `syncing`, `synced`, `rejected`. The SQLite queue accepts the defined status model; stale `syncing` recovers to `queued` after 10 minutes.
- [-] Implement a retry-safe sync worker with bounded retries, backoff, connectivity triggers, and duplicate suppression. Worker implemented in `services/sync-worker.ts` (single-flight, 5 attempts, 1/5/15/60 min backoff, connectivity-triggered, UUID idempotency); correction flow now submits through `accident.update` by uuid for reports with a server record and chains `accident.resubmitReport` for locally flagged «returned» drafts; edited synced drafts are requeued on exit plus reconciled at run start. Device testing pending.
- [-] Submit complete reports through the idempotent accident add/update acts; do not create a new UUID on retry. Typed `submitAccidentReport`/`updateAccidentReportByUuid` wrappers store server `_id`/`report_id`; real submission needs form data.
- [x] Use `accident.getMyReports` for server history and status/rejection notes. Live list with dual status chips in the Reports tab.
- [-] Integrate `getSyncStatus` when the backend endpoint exists. Backend act implemented and E2E-verified per the handoff; mobile wiring remains pending.
- [-] Show queue counts and the last successful sync on Home and the sync page. The `/drafts` screen lists queue state; Home shows last sync only.
- [ ] Send native notifications for successful and failed sync attempts.
- [-] Make sync observable: attempt time, next retry, error category, server report ID, and rejection reason. Drafts screen shows attempts, next retry, errors, and report ID.
- [ ] Define conflict handling for a locally edited report that was already updated on the server. [?]
- [ ] Test interrupted uploads, duplicate requests, airplane mode, app kill, clock changes, and partial failures.

## 5. Offline maps and incident location

- [ ] Request and cache road geometry through `road.getRoadsGeometry` for the officer's patrol area.
- [ ] Confirm production road geometry is backfilled before relying on snapping or offline linear referencing. Current backend note: 1490 production roads lack `area` geometry.
- [-] Use OpenStreetMap (OSM) as the only map data/base-map direction; verify attribution, tile-provider terms, caching limits, and production suitability. Attribution is rendered on every map surface and in the offline screen; pilot uses `tile.openstreetmap.org` via `EXPO_PUBLIC_MAP_TILE_URL` — production must move to a self-hosted tile server (backend follow-up documented).
- [x] Choose and integrate an Expo SDK 57-compatible map implementation with a bounded offline OSM tile/download strategy for the officer's patrol area — extended to a national Iran download per product decision: custom `OsmWebMap` over disk-hosted HTML with local-first `file://` tiles + per-tile network fallback; XYZ mirror under `Documents/mapcache/`; single national pack with base z4–10 (~60–120MB) and opt-in deep z4–12 (~1–2GB) tiers. Android-only target (no iOS build planned). Device E2E pending.
- [-] Define offline map package versioning, storage limits, expiration/invalidation, progress, cancellation, resume, and low-storage behavior. Progress/pause/resume/cancel/delete + upgrade path and byte accounting are implemented; `/map-offline` redesigned per Design.md §9.11 (status pill per pack state, native Alert confirms for upgrade/delete, platform Switch for Wi-Fi-only, Button primitives); staleness-based refresh and a storage-cap setting remain pending.
- [-] Build the location picker shown in the PDF: officer-location marker, fixed center pin, map pan, current-location control, and bottom summary. Redesigned per `docs/Design.md` §9.3: animated pulsing center pin, floating legend chips (محل واقعه / موقعیت شما), GPS accuracy pill on-map, snap-suggestion banner («انتقال به نزدیک‌ترین موقعیت مسیر؟» >20m, never silent), grabber bottom sheet with iconed summary rows (route/direction/km/distance), shared `ScreenHeader`+`MapControls`, confirm CTA with explicit disabled reasons and coordinate footer; visual polish on device pending.
- [x] Capture both `gps_coords` (device position) and incident `location` / `incident_coords` (selected point).
- [-] Show GPS accuracy and permit manual selection when GPS is unavailable, with an explicit warning. Accuracy/distance warnings and no-GPS hints are present; the shared `GpsActionButton` (روشن کردن GPS / permission re-request / retry) recovers on the location picker, Map tab, and Home pill, and the hook auto-detects when location services come back on. Threshold tuning and device verification pending.
- [-] Call `road.snapPointToRoad` and display route, direction, kilometer, meter, nearest point, distance to road, and lanes. Debounced snapping and summary rows implemented; production road `area` geometry still missing.
- [ ] Allow manual direction correction and lane selection from reference data, not hardcoded labels.
- [ ] Show distance from officer to selected point and warn when unusually far away.
- [-] Call `road.validatePointInZone`; warn on an out-of-zone selection while preserving the product requirement that the officer can confirm it. Zone check runs on confirm and stores a non-blocking warning; requires an active shift on the backend.
- [x] Do not implement satellite imagery or a satellite map mode; the product uses OSM maps only.
- [x] Save the selected location immediately and allow Edit Location later with the previous pin restored.
- [-] Keep the picker fully usable without network and without GPS using cached OSM map data and road geometry; record the GPS-unavailable condition for upload. Cached tiles render offline (local-first loading); road-geometry caching remains blocked on the backend `area` backfill. GPS recovery button + auto-detect are in place; on-device airplane-mode test pending.
- [ ] Test OSM map rendering, cache availability, map-package recovery after app restart, and incident selection in airplane mode on Android and iOS. Android-only per product decision: airplane-mode rendering, force-close resume, upgrade path, and cellular auto-pause remain to be tested on a real device.

## 6. Accident form

- [x] Add a report type/incident entry point after location confirmation; accident is the first complete workflow. `/incident/index` rebuilt per Design.md §9.4: iconed type-selection cards (تصادف gated on confirmed location; خرابی/مانع/سایر marked به‌زودی), location summary card with road/km/direction/GPS lines + zone warning banner + اصلاح موقعیت, skeleton loading, raw `client_report_uuid` no longer shown to officers.
- [-] Build a seven-phase wizard with progress, Back/Next, validation, and draft restoration. Redesigned shell per Design.md §9.5: `StepperHeader` with 7 icon dots (done=check/current=filled/upcoming=muted) + animated progress bar, autosave pill (ذخیره شد ✓ / در حال ذخیره…), auto-filled meta card with lock marker + اصلاح موقعیت + road/km rows (UUID removed from UI), warning banner retry for reference loading, EmptyState error screen, Button-based footer with RTL next chevron. Phases 1-3 live in `/incident/details`; phases 4-7 remain pending.
- [-] Restyle form primitives on the design system: `form-fields.tsx` rewritten on tokens — focus rings on inputs, unified `ChipsRow` (selected=primarySoft+check, ≥44dp), severity chips carry icons (خسارتی/جرحی/فوتی), `CardShell` remove is a 40dp danger trash IconButton with delete confirmation, AddButton is an outline Button with add icon; duplicate chip styles removed from `incident-phases.tsx`. Per-option icons for backend reference lists (weather/vehicle types/etc.) land as those phases are polished.
  1. Basic information
  2. Classification
  3. Police and croquis
  4. Involved vehicles
  5. People
  6. Environment and road status
  7. Facility damage
- [-] Keep server-filled metadata read-only while allowing accident date/time correction. Read-only meta card implemented; datetime is a Gregorian text input — Persian calendar picker pending.
- [-] Load severity, collision type, vehicle type, final status, driver status, injury status, person role, damage severity, lane, weather, lighting, surface, geometry, road defect, equipment damage, police station, croquis, color, brand, and model from backend reference acts. `type`, `collision_type`, `croquis_type`, `police_station` load cache-first; remaining lists arrive with phases 4-7. Severity now maps to the backend `type` relation (خسارتی/جرحی/فوتی → `typeId`) with a local-label fallback while references are unavailable. Police station now renders as a cache-first ListRow picker from `police_station.gets` sending `policeStationId` (manual free-text fallback retained while seed data is missing); seeding real stations remains an ops task.
- [x] Add client-side validation that matches backend validators and shows field-level Persian errors. Pure per-phase validators in `domain/accident-form.ts`; phases 1-3 covered.
- [ ] Enforce conditional rules: injury/fatal requires people; police fields depend on police presence; facility cards depend on facility damage; required vehicle cards must be complete before sync.
- [x] Generate vehicle cards from a count and capture plate, vehicle, driver, and insurance data. Add/remove cards with full plate (three parts), vehicle refs, driver block, and both insurances.
- [ ] Generate people cards from counts and calculate injured/deceased totals from individual records.
- [-] Capture environmental observations without presenting them as definitive legal causation. Air/light/surface/road-situation/defects fields are observational picks.
- [-] Generate facility damage cards with asset, severity, quantity/unit, hazard, repair, temporary action, and images. Cards complete except image references (media checkpoint).
- [x] Add client-side validation that matches backend validators and shows field-level Persian errors.
- [x] Handle the backend constraint that incomplete required vehicle cards cannot currently be submitted; drafts may remain incomplete locally. The sync worker blocks submission with a hint and no attempt penalty.

## 7. Media and file handling

- [-] Request and explain Camera, Microphone, Location, and Notifications permissions at the appropriate workflow point. Camera/library permissions are requested on first use with Persian explanations (app.json plugin strings); location is requested from the GPS pill/map; microphone and notifications remain pending.
- [x] Add image capture/selection, compression, preview, replacement, deletion, and offline persistence. Media sections restyled per Design.md §6.9: category icons in section headers, iconed camera/gallery chips, 38dp replace/delete IconButtons, native delete confirmation.
- [x] Categorize media as plate, insurance, croquis, or damage. Categories are enforced by `MediaSection` wiring; owner tags scope media to the exact card.
- [-] Wait for the backend categorized upload act and `attachments` wiring before treating media as synced; this is backend Step 11 and remains open. Backend contract is now pinned (base64 JSON `set.file.data`, `damage → facility_damage` alias, Patrol ownership check); the mobile upload pipeline (`api/media.ts`, `services/media-upload-service.ts`, pure write-back in `domain/media-writeback.ts`) is coded and integrated into the sync worker behind the default-off `EXPO_PUBLIC_ACCIDENT_UPLOADS` flag — enablement and device E2E remain pending.
- [x] Define file size/type limits, upload retry behavior, and cleanup of abandoned local media. Limits and per-file size recording implemented; cleanup of a deleted draft's folder pending draft-deletion feature; upload retry blocked on backend Step 11.
- [x] Ensure media paths are stable and never silently disappear when a report is edited. Files live under `Documents/media/<uuid>/` keyed by stable ids.

## 8. Reports, announcements, and More

- [-] Build My Reports with Sent, Under Review, Approved, and Returned for Correction states. Redesigned per Design.md §9.7 on primitives: filter chips now actually filter client-side (all/submitted/under-review/approved/returned), review pills carry tone+icon per state, rejection notes render as danger banners, returned cards get warning border + soft «اصلاح گزارش» button, skeleton loading, offline-aware error banners, EmptyState with draft shortcut; live `getMyReports` + local-draft matching retained.
- [-] Highlight rejection notes and route the officer back to the affected draft phase. Notes shown as danger banner with edit action into the draft form; deep-linking the exact phase remains pending.
- [-] Build Announcements/Notification Center for control-center messages. Redesigned per Design.md §9.8: priority StatusPills with icons+tone (فوری danger/مهم warning/عادی neutral — fixes the colorless-text bug), unread Badge count + primary right-border + bold title, expand chevron, skeleton loading, offline-aware banners; live `announcement.gets`/optimistic `markRead` with revert retained. Backend push delivery (FCM/APNs) remains open.
- [ ] Build read-only Map for officer location, road routes, km markers, and approved/registered incidents.
- [-] Build More: profile, shift info, vehicle info, settings, guide, support, about, logout, and device/session information where permitted. Redesigned per Design.md §9.10: avatar-initials profile card, iconed ListRow sections (shift/unit/vehicle live via `user.getMe`, retry row on error), system rows where به‌زودی rows give an explanatory toast instead of dead taps, version row, logout behind a confirmation dialog preserving local drafts.
- [-] Add settings for PIN, biometrics, app lock timeout, notifications, map downloads, and diagnostic information. Rows exist as به‌زودی with toast feedback; underlying features tracked in Checkpoints 2/5/11.
- [-] Drafts screen redesigned per Design.md §9.6: true status tones (draft=neutral, queued=info, syncing=primary, synced=success, rejected=danger — fixes the always-green chip), report-id rows replace the raw UUID leak, attempts/next-retry consolidated, error boxes, retry + sync-all Buttons, skeletons, pull-to-refresh, focus-refresh via useFocusEffect. Swipe-to-delete of drafts remains pending.

## 9. Verification and delivery

- [-] Add unit tests for validators, error translation, status transitions, UUID preservation, and retry decisions. Vitest suite (`pnpm test`) covers accident-form validators, severity→typeId mapping, sync-rules outcomes + correction-path act selection, accident-mapper payload purity (no local `severity` leak), envelope parsing, error translation, media write-back, and draft UUID preservation; persistence/integration layers remain pending.
- [ ] Add persistence tests for draft recovery and queue recovery after process termination.
- [ ] Add integration tests for login, token revocation, active shift loading, reference loading, accident idempotency, update permissions, snapping, and zone validation.
- [ ] Test RTL layout, Persian text, numeric input, accessibility labels, keyboard behavior, 44-48dp touch targets, and low-light/sunlight contrast. Design-system QA sweep done statically after the UI redesign: raw hex usage in app/components reduced from ~250 to a handful of intentional press-shades/translucents inside primitives; all interactive primitives enforce ≥44dp with pressed states, RTL row-reverse + mirrored back/chevrons verified per screen. On-device sunlight/glove testing remains open.
- [ ] Test Android and iOS on a real device, including camera, microphone, GPS, biometrics, notifications, and background transitions. Includes the redesigned screens: Home dashboard, login, location picker legend/pin animation, wizard stepper, drafts/reports/announcements lists, map-offline switch/confirms.
- [ ] Add haptic feedback (requires adopting `expo-haptics`, SDK-57 compatibility check first) and respect reduced-motion for the pin pulse/skeleton loops.
- [ ] Run `npx expo lint` and TypeScript checks before each checkpoint.
- [ ] Verify no password/token/PII leakage in logs, local files, screenshots, or error telemetry.
- [ ] Document known backend blockers and obtain explicit sign-off before production release.

## Backend dependencies still open

- `getSyncStatus` — act implemented and E2E-verified on the backend; mobile wiring pending.
- Push delivery (FCM/APNs provider credentials) for announcements and sync-result notifications; `device.push_token` contract is accepted at device-scoped login.
- Emergency: `emergency.register / gets / get / updateStatus` now exist (Patrol registers, Manager triages); the mobile Emergency flow (Checkpoint 11) and the offline SOS fallback policy remain ops/product decisions.
- Road `area` geometry backfill for production roads (~1490 roads) — blocks snapping, zone validation, and offline road caching.
- `police_station` seed data with real station polygons.
- Patrol email distribution (login is email-based).
- Mobile-side enablement + device E2E of media upload behind `EXPO_PUBLIC_ACCIDENT_UPLOADS=on`.
