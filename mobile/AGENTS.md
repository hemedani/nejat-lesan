# LESEN Mobile - React Native / Expo Agent Guide

This directory contains the patrol-officer mobile application for the LESEN traffic and accident-management system. It is a Persian, RTL, offline-first field application built with Expo Router.

## Non-negotiable platform rule

Expo has changed. Read the exact versioned documentation at [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) before using or adding any Expo API, config plugin, native module, permission, background task, notification, camera, microphone, location, biometric, or storage feature.

Confirm that every package supports the versions in `package.json` before installing it. Keep `pnpm-lock.yaml` and `package.json` synchronized. Prefer the Expo-supported package for the installed SDK over an unverified native alternative.

## Project context

- Framework: Expo SDK 57, Expo Router, React 19, React Native 0.86.
- Entry point: `expo-router/entry`.
- Source: `src/app`, `src/components`, `src/constants`, and `src/hooks`.
- Product docs: `mobile/docs/TODO.md` (authoritative backlog), `mobile/docs/CONTINUE.md` (next-task prompt), and `mobile/docs/TODO_HISTORY/` (checkpoint log, decisions, working rules, checkpoint progress).
- Backend contracts: `back/docs/04-mobile-patrol-backend-agent-guide.md` and the related patrol documents in `back/docs`.
- Generated API declarations: `back/declarations/selectInp.ts`; mobile TypeScript aliases this file as `@backend/selectInp`. Keep backend declarations synchronized whenever acts or validators change.
- Declaration synchronization: after backend declaration changes, run `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` from the Lesan repository root. Mobile types read the backend copy directly; the frontend copy keeps the web client synchronized.
- Design references: the PDFs in `mobile/ignoreAssets` and the Persian requirements documents in `back/docs`.

## Product invariants

1. The first login requires an active network connection. A successful prior login must support offline unlock and cached access.
2. Offline mode must never disable incident creation, draft editing, GPS, media capture, or local queueing.
3. Generate exactly one persistent `client_report_uuid` per report draft. Reuse it for every retry and update.
4. Save drafts, media metadata/files, and sync queue entries across navigation, backgrounding, force-close, battery loss, and device restart.
5. The backend is authoritative for permissions, active shift, patrol unit, vehicle, reference values, report status, road snapping, and zone validation.
6. Store tokens and other sensitive session material in secure platform storage. Never store or log passwords.
7. Preserve the backend response envelope `{ success, body }`. The requested data is normally directly in `body`, not `body.data`.
8. The mobile authentication token is sent in the `token` header without a `Bearer` prefix.

## Architecture rules

- Keep route screens thin. Put reusable behavior in hooks, repositories, services, or domain modules.
- Use a typed API client with one response parser, timeout policy, connectivity awareness, and translated error handling.
- In development, API failures may be logged with status, error code, and backend details, but never log request bodies, passwords, tokens, national IDs, or media contents. Inspect logs in the Metro terminal; on Android also use `adb logcat` when a device is connected.
- Keep local persistence behind repositories so the storage implementation can change without rewriting screens.
- Use Expo SDK 57 `expo-sqlite` for structured local persistence: drafts, media metadata, sync queue records, and cached references. Use parameterized SQLite APIs and migrations; never build SQL with user input.
- Separate server state, local draft state, session state, connectivity state, and UI state.
- Do not duplicate backend schemas casually. When generated declarations or backend contracts are available, derive client types from them or document the deliberate mobile projection.
- Keep relation and API field names aligned with Lesan contracts, including snake_case fields such as `client_report_uuid`, `gps_coords`, and `sync_status`.
- Keep sync transitions explicit: `draft -> queued -> syncing -> synced` or `rejected`.
- Make retries idempotent, bounded, observable, and resumable. Never create a new report because a request timed out.
- Do not hardcode permissions, active shift information, vehicle context, or shared reference lists.
- Do not silently discard fields that are not currently rendered. Preserve unknown or future-compatible draft data where practical.

## UI and localization

- The application is Persian and RTL by default. Set direction deliberately at the app shell and verify mixed Persian/Latin content.
- Use the Estedad font bundled under `assets/fonts` for Persian and Latin UI text. Keep the source font weights synchronized from `/Users/syd/work/katiraei/ziwound/front/public/fonts/Estedad` when the font package changes.
- Use Persian user-facing labels and friendly translated errors; raw backend errors must not reach the UI.
- Use Persian number formatting where appropriate, while preserving numeric API values and identifiers.
- Personnel code accepts numeric input only, uses a numeric keyboard, and follows the product requirement to disable paste.
- Passwords are hidden by default and have an explicit show/hide control.
- Login is disabled until required fields are valid and must show a loading state that prevents duplicate requests.
- Use touch targets of at least 44-48dp, high contrast, clear status colors, and layouts readable in sunlight.
- Keep the Home tab central in the five-tab RTL navigation: Reports, Announcements, Home, Map, More.
- Do not place shift, vehicle, GPS, or network details on the login screen; those belong to Home.
- Make location selection auditable: distinguish the officer GPS point from the selected incident point and allow later location correction.
- Avoid embedding operational rules only in visual components. Validation and transitions belong in testable domain logic.

## Authentication and security

- Call the unified `user.login` contract with email, password, and device metadata: `device_id`, `fingerprint`, `platform`, `app_version`, and `model`. The device payload yields a device-scoped JWT plus `permissions` in the response; registered devices are read through the `user.devices` reverse relation.
- Store tokens only in Keychain/Keystore-backed secure storage. Do not use AsyncStorage or plain files for tokens, passwords, PINs, or biometric secrets.
- Store only the minimum non-sensitive cache needed for offline unlock and dashboard rendering.
- Support optional PIN/biometric unlock and app-lock timeout without forcing full credentials after every short background transition.
- Treat missing, expired, or revoked device-scoped tokens as a session reset. Preserve local drafts while clearing protected session data.
- `Ghost` and `Patrol` users may use device-scoped mobile login; Ghost is not restricted by the patrol-only login gate.
- Redact tokens, passwords, national IDs, precise personal data, and media contents from logs, crash reports, screenshots, and analytics.
- Request sensitive permissions at the point of need with a clear explanation and handle denial without crashing or blocking draft creation.

## API and backend integration

- Treat `back/declarations/selectInp.ts` as the mobile API type source, including patrol acts such as `login` and `getActiveShift`. Do not manually recreate an act contract when the generated declaration covers it.
- Keep the declaration path in `mobile/tsconfig.json` pointed at the backend checkout. If the backend declaration generator changes its output shape, update the alias and typed adapters together, then run the mobile TypeScript check.
- Use `TypedActRequest` / backend declaration-derived aliases for new API calls. Keep request construction in API/domain modules, not route screens.
- Use the mobile-local `lesanApi` adapter in `src/api/lesan-api.ts` for the compatible typed `send` pattern. It mirrors the frontend generated helper while remaining inside the Metro project boundary; derive request types from the backend declaration while keeping timeout, envelope parsing, and error translation in the mobile client.
- Prefer `callTypedAct` for all implemented acts. Use the generic `callAct` only for a temporarily ungenerated backend contract, and document that exception next to the adapter.
- The mobile `lesanApi` sends the Lesan wire request as a POST body shaped as `{ service?, model, act, details: { set, get } }` to the configured `${LESAN_URL}/lesan` endpoint. Do not turn acts into REST paths or import runtime modules from outside the mobile workspace; Metro cannot resolve those external aliases by default.
- Use the backend's standard `{ success, body }` envelope and check `success` before reading `body`.
- Pass the JWT as `token: actualToken`; do not add `Bearer`.
- Use backend acts for login, active shift, reports, shared references, road geometry, snapping, and zone validation.
- Accident add/update is idempotent by `client_report_uuid`; persist the server `_id` and `report_id` after acknowledgement.
- Use `accident.getMyReports` for the officer's report history and rejection notes.
- Treat `getSyncStatus`, announcements, categorized uploads, emergency operations, and production road geometry as explicit backend dependencies until their contracts are confirmed.
- Do not invent `body.data`, REST paths, refresh-token fields, or reference values based on assumptions. Confirm the backend act and validator first.

## Maps, GPS, and media

- Verify Expo SDK 57 compatibility before selecting a map, offline tile, GPS, camera, microphone, or background package.
- Cache road geometry through `road.getRoadsGeometry` and plan for bounded patrol-area downloads.
- Use `road.snapPointToRoad` for route, direction, kilometer, meter, nearest point, and lane context when data is available.
- Use `road.validatePointInZone` for boundary validation; warn the officer without making offline draft creation impossible.
- When GPS is unavailable, allow manual map selection and record the unavailable-GPS condition for later sync.
- Keep `gps_coords` (officer position) separate from the selected incident `location` / `incident_coords`.
- Categorize evidence as plate, insurance, croquis, or damage. Preserve local media until the server confirms upload.
- Never assume production road snapping works until the backend road `area` geometry has been populated.

## Forms and drafts

- Implement the accident workflow as seven recoverable phases: basic information, classification, police/croquis, vehicles, people, environment/road, and facility damage.
- Auto-save on field change, phase transition, media change, back navigation, backgrounding, and before leaving the workflow.
- Keep server-filled metadata read-only while allowing accident date/time correction and an Edit Location action.
- Load all form options from backend shared models. Do not hardcode vehicle, injury, damage, road, or lane lists.
- Keep incomplete drafts locally even when backend create validation requires complete vehicle cards for sync.
- Make conditional validation explicit: injury/fatal requires people; police and facility fields depend on their switches; counts must agree with generated cards.

## Testing and validation

- Add focused tests for API envelope parsing, error translation, secure session transitions, UUID preservation, draft persistence, queue retries, and status transitions.
- Test login, revoked sessions, active shift loading, reference loading, accident idempotency, report updates, road snapping, and zone validation.
- Test Android and iOS real-device behavior for permissions, camera, microphone, GPS, notifications, biometrics, backgrounding, force-close, and restart.
- Test RTL layout, Persian text, numeric input, paste behavior, accessibility labels, touch targets, and offline workflows.
- Run focused checks after edits, then run `pnpm lint` and the project's TypeScript checks when applicable.
- Do not claim a feature is complete until its offline, retry, recovery, and error states have been tested.

## Development commands

Use the package manager already represented by the mobile workspace:

```bash
pnpm install
pnpm start
pnpm lint
```

Use the project toolchain for every command: Node `v22.22.2`, npm `10.9.7`, and pnpm `10.8.0` managed by fnm. Before running checks in a new session, verify `which node`, `node --version`, `which npm`, `npm --version`, `which pnpm`, and `pnpm --version`; do not use stale system/Homebrew Node binaries.

Use `pnpm start` or platform-specific commands only when explicitly requested. Do not automatically start a development server, emulator, watcher, build, or long-running process.

Before editing, inspect the nearby route/component and its existing patterns. Prefer the smallest atomic change, avoid unrelated cleanup, and remove unused imports, variables, and debug logging introduced by the change. Do not commit, reset, or revert user changes unless explicitly requested.
