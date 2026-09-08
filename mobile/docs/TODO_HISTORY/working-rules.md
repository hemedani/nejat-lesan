# Working Rules — Mobile Patrol App

Operational rules for any developer or coding agent working on the patrol app. Kept in `TODO_HISTORY` so `CONTINUE.md` stays a single-page next-task prompt. Source: the Working rules section previously embedded in `CONTINUE.md`.

## Working rules

1. Read `mobile/AGENTS.md` and the exact Expo SDK 57 documentation before using a new Expo API.
2. Keep all user-facing copy Persian and the interface RTL. Keep code identifiers and API field names aligned with backend contracts.
3. Treat the server as authoritative for permissions, active shift, vehicle, patrol unit, reference data, report status, road snapping, zone validation, **the enabled-module set, and the active report process**.
4. Cache first, refresh second. Offline must not disable report creation, draft editing, media capture, GPS, or the location picker.
5. Every report draft gets one persistent `client_report_uuid`. Retries reuse it.
6. Keep passwords out of storage and logs. Store tokens only in secure storage.
7. Preserve the `{ success, body }` response envelope and translate errors centrally.
8. Do not mark a checkpoint complete until its focused verification passes.
9. Backend v2 (2026-09-07): never send accident-only fields for non-accident `incident_type`s; snapshot `process_version` and map relation/dynamic process answers per `mobile/docs/01-MOBILE_BACKEND_V2_ADOPTION.md`; gate module-owned screens only on a positively-off `modules`/`orgModules` (Ghost exempt; absent arrays degrade to enabled).

## Toolchain

Use fnm-managed Node `v22.22.2`, npm `10.9.7`, and pnpm `10.8.0`. Verify `which node`, `node --version`, `which npm`, `npm --version`, `which pnpm`, and `pnpm --version` before checks; avoid stale system/Homebrew Node binaries.

## Declaration sync

After backend declaration changes, run `cp -rv back/declarations/selectInp.ts front/src/types/declarations/` from the Lesan repository root. Mobile TypeScript reads `back/declarations/selectInp.ts` directly, while the frontend copy keeps the web client synchronized.

## Font

Estedad weights are bundled in `mobile/assets/fonts` from `/Users/syd/work/katiraei/ziwound/front/public/fonts/Estedad` and loaded at the app shell.
