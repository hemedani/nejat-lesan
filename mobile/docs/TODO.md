# TODO - Mobile Patrol App

This is the implementation backlog for the Expo/React Native patrol-officer app. It is based on:

- `back/docs/mobile-patrol-backend-agent-guide.md`
- `back/docs/mobile-patrol-app-requirements.md`
- `back/docs/mobile-patrol-app-requirements-fa.md`
- `back/docs/mobile-patrol-backend-todo.md`
- `back/docs/mobile-patrol-backend-execution-plan.md`
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
- [-] Add strict TypeScript models for auth, device, user, shift, vehicle, patrol unit, accident, road, references, announcements, and sync state. Initial core domain projections are present; remaining projections and backend-contract review are pending.
- [-] Decide and document the local database/storage solution for structured drafts and queues. Expo SDK 57 `expo-sqlite` is selected; the versioned schema and repository are present, while process-kill/restart and migration tests remain pending.
- [ ] Add a stable app-level logging strategy that excludes passwords, tokens, national IDs, and media contents.
- [-] Use the fnm toolchain for checks: Node `v22.22.2`, npm `10.9.7`, pnpm `10.8.0`; verify executable paths before running commands.

## 2. Authentication and local security

- [-] Build the Persian RTL login screen from the PDF reference: logo, title, subtitle, personnel code, password, show/hide control, login CTA, version, support, and password-help link. The first login route is implemented in `src/app/index.tsx`; branding and support destinations remain provisional.
- [x] Restrict personnel code to digits and use a numeric keyboard. Paste disabling remains a platform-specific follow-up.
- [x] Keep the login CTA disabled until both required fields are valid; prevent duplicate submissions with a loading state.
- [x] Require an online connection for first login and show a friendly translated message when unavailable.
- [-] Call `user.mobileLogin` with `personnel_code`, `password`, and device metadata: `device_id`, `fingerprint`, `platform`, `app_version`, and `model`. A declaration-typed session service now constructs the request.
- [-] Store the token and sensitive session data only in platform secure storage (Keychain/Keystore). The SDK 57 `expo-secure-store` adapter and session lifecycle service are present; UI integration and device verification remain pending. Never persist the password.
- [-] Persist enough non-sensitive cached identity data to support subsequent offline unlock. Identity cache writes are implemented; authenticated routing and UI restoration remain pending.
- [-] Map backend failures to friendly Persian messages, including inactive account, non-Patrol access, invalid credentials, lockout, offline first login, and revoked device. Backend validation `body.message` is now surfaced and development diagnostics are logged; specific error categories remain pending.
- [ ] Add optional PIN and biometric unlock, configurable in Settings.
- [ ] Add app-lock behavior after background/device-lock timeout; prefer PIN/biometric over full credentials.
- [ ] Validate the device-scoped token online when connectivity returns and clear local session safely after revocation.
- [-] Handle logout, expired/revoked sessions, app restart, force-close, and device restart without losing local drafts. Service methods for restore, logout, and revoked-session cleanup are present; UI integration remains pending.
- [ ] Test secure storage and biometric fallback on both platforms. Defer all device-level testing until the first login or Home page is implemented.

## 3. App shell and dashboard

- [ ] Create authenticated routing that opens Home after login and bypasses Login when a valid local session exists.
- [-] Implement RTL navigation with five tabs: Reports, Announcements, Home, Map, More; Home is the central primary tab. The first authenticated Home route is implemented; the five-tab shell remains pending.
- [-] Build the Home dashboard using cached data first, then background refresh. SecureStore session identity loads before active-shift refresh; broader dashboard cache rendering remains pending.
- [ ] Show officer identity from the user profile as read-only.
- [-] Fetch live operational context from `shift.getActiveShift`, not static user fields. The declaration-typed adapter and initial Home rendering are implemented.
- [-] Show active patrol unit, active vehicle, shift type/time, server-derived shift status, internet status, GPS status, and last sync time. Home now shows active shift, connectivity, and last successful sync; GPS and richer shift states remain pending.
- [ ] Define visible states for active, near-end, ended, out-of-shift, and shift-information-unavailable.
- [-] Keep incident registration, draft editing, media capture, and GPS usable while offline. Home preserves the registration entry point offline; the complete workflow remains pending.
- [-] Add the large Register New Incident CTA and offline notice without disabling the action. Home now opens an offline-capable draft route; the seven-phase form remains pending.
- [ ] Add the Emergency flow as a distinct confirmation sheet with officer, unit, vehicle, and current location.
- [ ] Decide and implement offline emergency fallback (SMS/call) with the operations team. [?]
- [ ] Add draft badge, My Reports, announcements, map shortcut, pull-to-refresh, and More menu entries.
- [ ] Keep touch targets at least 44-48dp and use high-contrast status colors suitable for sunlight.

## 4. Connectivity, cache, and synchronization

- [-] Track online, offline, and weak-connection states without blocking field workflows. NetInfo classification, subscriptions, and known-offline API preflight are present; device testing and weak-network policy remain pending.
- [x] Generate one UUID `client_report_uuid` when a draft is created; preserve it for the draft's entire lifecycle. The initial draft service creates and persists one UUID.
- [-] Auto-save after every field change, phase transition, media operation, navigation/back action, background event, and app shutdown. Draft creation and initial queue persistence are implemented; form autosave remains pending.
- [-] Persist draft data, media references/files, and queue records across force-close, restart, and low battery. SQLite persistence is wired for these records; recovery testing remains pending.
- [x] Model local statuses: `draft`, `queued`, `syncing`, `synced`, `rejected`. The SQLite queue accepts the defined status model.
- [ ] Implement a retry-safe sync worker with bounded retries, backoff, connectivity triggers, and duplicate suppression.
- [ ] Submit complete reports through the idempotent accident add/update acts; do not create a new UUID on retry.
- [ ] Use `accident.getMyReports` for server history and status/rejection notes.
- [ ] Integrate `getSyncStatus` when the backend endpoint exists. Backend TODO: endpoint is still open.
- [ ] Show queue counts and the last successful sync on Home and the sync page.
- [ ] Send native notifications for successful and failed sync attempts.
- [ ] Make sync observable: attempt time, next retry, error category, server report ID, and rejection reason.
- [ ] Define conflict handling for a locally edited report that was already updated on the server. [?]
- [ ] Test interrupted uploads, duplicate requests, airplane mode, app kill, clock changes, and partial failures.

## 5. Offline maps and incident location

- [ ] Request and cache road geometry through `road.getRoadsGeometry` for the officer's patrol area.
- [ ] Confirm production road geometry is backfilled before relying on snapping or offline linear referencing. Current backend note: 1490 production roads lack `area` geometry.
- [ ] Use OpenStreetMap (OSM) as the only map data/base-map direction; verify attribution, tile-provider terms, caching limits, and production suitability.
- [ ] Choose and integrate an Expo SDK 57-compatible map implementation with a bounded offline OSM tile/download strategy for the officer's patrol area.
- [ ] Define offline map package versioning, storage limits, expiration/invalidation, progress, cancellation, resume, and low-storage behavior.
- [ ] Build the location picker shown in the PDF: officer-location marker, fixed center pin, map pan, current-location control, and bottom summary.
- [ ] Capture both `gps_coords` (device position) and incident `location` / `incident_coords` (selected point).
- [ ] Show GPS accuracy and permit manual selection when GPS is unavailable, with an explicit warning.
- [ ] Call `road.snapPointToRoad` and display route, direction, kilometer, meter, nearest point, distance to road, and lanes.
- [ ] Allow manual direction correction and lane selection from reference data, not hardcoded labels.
- [ ] Show distance from officer to selected point and warn when unusually far away.
- [ ] Call `road.validatePointInZone`; warn on an out-of-zone selection while preserving the product requirement that the officer can confirm it.
- [ ] Do not implement satellite imagery or a satellite map mode; the product uses OSM maps only.
- [ ] Save the selected location immediately and allow Edit Location later with the previous pin restored.
- [ ] Keep the picker fully usable without network and without GPS using cached OSM map data and road geometry; record the GPS-unavailable condition for upload.
- [ ] Test OSM map rendering, cache availability, map-package recovery after app restart, and incident selection in airplane mode on Android and iOS.

## 6. Accident form

- [ ] Add a report type/incident entry point after location confirmation; accident is the first complete workflow.
- [ ] Build a seven-phase wizard with progress, Back/Next, validation, and draft restoration:
  1. Basic information
  2. Classification
  3. Police and croquis
  4. Involved vehicles
  5. People
  6. Environment and road status
  7. Facility damage
- [ ] Keep server-filled metadata read-only: report ID, officer, unit, vehicle, timestamps, coordinates, accuracy, direction, km/meter, and lane; provide Edit Location.
- [ ] Allow correction of the exact accident date/time without changing audit metadata.
- [ ] Load severity, collision type, vehicle type, final status, driver status, injury status, person role, damage severity, lane, weather, lighting, surface, geometry, road defect, equipment damage, police station, croquis, color, brand, and model from backend reference acts.
- [ ] Enforce conditional rules: injury/fatal requires people; police fields depend on police presence; facility cards depend on facility damage; required vehicle cards must be complete before sync.
- [ ] Generate vehicle cards from a count and capture plate, vehicle, driver, and insurance data.
- [ ] Generate people cards from counts and calculate injured/deceased totals from individual records.
- [ ] Capture environmental observations without presenting them as definitive legal causation.
- [ ] Generate facility damage cards with asset, severity, quantity/unit, hazard, repair, temporary action, and images.
- [ ] Add client-side validation that matches backend validators and shows field-level Persian errors.
- [ ] Handle the backend constraint that incomplete required vehicle cards cannot currently be submitted; drafts may remain incomplete locally.

## 7. Media and file handling

- [ ] Request and explain Camera, Microphone, Location, and Notifications permissions at the appropriate workflow point.
- [ ] Add image capture/selection, compression, preview, replacement, deletion, and offline persistence.
- [ ] Categorize media as plate, insurance, croquis, or damage.
- [ ] Wait for the backend categorized upload act and `attachments` wiring before treating media as synced; this is backend Step 11 and remains open.
- [ ] Define file size/type limits, upload retry behavior, and cleanup of abandoned local media.
- [ ] Ensure media paths are stable and never silently disappear when a report is edited.

## 8. Reports, announcements, and More

- [ ] Build My Reports with Sent, Under Review, Approved, and Returned for Correction states.
- [ ] Highlight rejection notes and route the officer back to the affected draft phase.
- [ ] Build Announcements/Notification Center for control-center messages. Backend channel is still open.
- [ ] Build read-only Map for officer location, road routes, km markers, and approved/registered incidents.
- [ ] Build More: profile, shift info, vehicle info, settings, guide, support, about, logout, and device/session information where permitted.
- [ ] Add settings for PIN, biometrics, app lock timeout, notifications, map downloads, and diagnostic information.

## 9. Verification and delivery

- [ ] Add unit tests for validators, error translation, status transitions, UUID preservation, and retry decisions.
- [ ] Add persistence tests for draft recovery and queue recovery after process termination.
- [ ] Add integration tests for login, token revocation, active shift loading, reference loading, accident idempotency, update permissions, snapping, and zone validation.
- [ ] Test RTL layout, Persian text, numeric input, accessibility labels, keyboard behavior, 44-48dp touch targets, and low-light/sunlight contrast.
- [ ] Test Android and iOS on a real device, including camera, microphone, GPS, biometrics, notifications, and background transitions.
- [ ] Run `npx expo lint` and TypeScript checks before each checkpoint.
- [ ] Verify no password/token/PII leakage in logs, local files, screenshots, or error telemetry.
- [ ] Document known backend blockers and obtain explicit sign-off before production release.

## Backend dependencies still open

- `getMe` profile payload with permissions, active shift, unit, and vehicle.
- `getSyncStatus` and the finalized sync-status contract.
- Announcements/notifications channel and push hooks.
- Categorized multi-image upload and accident attachment wiring.
- Road `area` geometry backfill for production roads.
- `Models.md` and response-envelope housekeeping.
- Emergency fallback behavior and operational endpoint.
