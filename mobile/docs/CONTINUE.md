# CONTINUE — Mobile Patrol App

One-page next-task prompt. Full history/logs live in `mobile/docs/TODO_HISTORY/`; the authoritative status backlog is `mobile/docs/TODO.md`; the UI/UX specification is `mobile/docs/Design.md`. Backend-side open items are in `back/docs/08-mobile-patrol-backend-handoff.md`.

---

## Brief history (current state)

Checkpoints 1–10, the 2026-08-25 contract-integration round, GPS-recovery fixes, the offline-map round, **and the 2026-08-25 UI/UX redesign (Phases 0–7 of `Design.md`)** are implemented (`tsc --noEmit`, `pnpm lint`, `pnpm test` all pass; on-device verification remains partial):

- **Design system foundation:** semantic tokens in `constants/theme.ts` (`AppTheme`/`Radius`/`Shadow`/`Motion`/`Type`), multi-family icon registry (`constants/icon-map.ts` + `ui/icon.tsx`, every glyph name verified against installed glyph maps), 14 shared primitives under `components/ui/` (Button, IconButton, Card/CardHeader, ListRow, ChoiceChip, StatusPill, Badge, Banner, Toast provider, Skeleton set, EmptyState, Section/ScreenHeader, MapControls, StepperHeader, TextField), light-mode locked for v1 (fixes white-on-light dark-mode leaks).
- **Screens redesigned on the system:** login (connectivity pill, icon inputs, error banner), Home dashboard (identity header + avatar initials, unit/vehicle strip, shift/internet/GPS status trio with accuracy tones, hero CTA always-on offline, quick-access grid with drafts count badge; fixes the bare-whitespace-text-node crash), incident entry (type-selection cards, no UUID leak), location picker (pulsing pin, legend chips, accuracy pill, snap-suggestion banner >20m, grabber sheet with iconed rows, disabled-reason CTA), 7-phase wizard shell (icon stepper + animated progress, autosave pill, lock-marked meta card), form fields/chips/cards (focus rings, unified ChipsRow ≥44dp, severity icons, confirm-protected card removal), Drafts (true status tones), Reports (working filters, tone pills, danger rejection banners), Announcements (priority icon pills fixing the colorless-text bug, unread badge), More (avatar profile card, iconed rows, toast-explained به‌زودی rows, logout confirmation), map-offline (status pill, native confirms, platform Switch), media sections (category icons, 38dp replace/delete buttons, delete confirm), GPS action button (+locate icon). Raw hex usage in app/components reduced ~250 → handful of intentional primitive-internal shades.
- **Pre-redesign core (unchanged):** email/device `user.login`, SecureStore session, five-tab RTL nav, offline-first SQLite drafts/media/queue/reference/map-pack caches, single-flight sync worker with update-by-uuid correction loop + `resubmitReport` chaining, announcements live read-state, severity via `typeId`, national Iran offline pack (base z4–10 / opt-in z4–12), dormant base64 media-upload pipeline behind `EXPO_PUBLIC_ACCIDENT_UPLOADS`.
- **Police station picker (2026-08-28):** `police_station` joined the cache-first reference set (`type`, `collision_type`, `croquis_type`, `police_station`); the PhasePolice manual station text was replaced with a ListRow picker from `police_station.gets` sending `policeStationId` (name kept as display/fallback), with the manual free-text input retained while seed data is missing. Round-trip + mapper tests added; `tsc --noEmit`, `pnpm lint`, `pnpm test` (59/59) clean.

---

## Next task — on-device verification (offline maps + correction loop + redesign)

### 1. Offline map device E2E
- Base pack download completes on Wi-Fi (~4k tiles) → airplane mode → Map tab + location picker pan Iran at z5–z9 with no blank areas inside covered zooms.
- Kill mid-download → relaunch resumes from filesystem recount. Manual pause stays paused; system pause auto-resumes on Wi-Fi. Upgrade to کامل shows the native confirm with size estimate and skips existing tiles. حذف clears bytes + mirror dir.

### 2. Correction-loop device E2E
Returned report → «اصلاح گزارش» → edit → exit → sync → server record updated and moved back to `submitted` with note cleared (needs a Manager account).

### 3. Redesign pass on real device (Android-only target)
- Home: status trio tones, GPS recovery button, pull-to-refresh, offline banner + CTA flow into type-selection cards.
- Location picker: pulsing pin perf, legend/accuracy pill legibility in sunlight, snap «انتقال» banner behavior.
- Wizard: stepper progress animation, chip focus/selection ergonomics, vehicle/person/facility card remove confirmations, autosave pill timing.
- Lists: drafts true-status colors across queue transitions, reports filters, announcements expand/mark-read, More toasts + logout confirm, map-offline Switch + confirms.
- RTL/a11y: Persian labels on TalkBack, 44dp+ targets reachable one-handed, mixed Persian/Latin text integrity.

### 4. ~~Police station picker from `police_station.gets`~~ — Done (2026-08-28)
`police_station` loads cache-first with the reference set; PhasePolice uses a ListRow picker sending `policeStationId`, with the manual free-text fallback kept while seed data is missing. Seeding real station polygons remains an ops task.

### 5. Enable + verify media upload
Flip `EXPO_PUBLIC_ACCIDENT_UPLOADS=on` against a reachable backend; exercise plate/insurance/facility round trip incl. retry-after-failure; then remove the dormancy caveat in docs.

### Out of scope (still blocked)
- Emergency flow — awaiting ops-approved offline SOS policy (online endpoint exists); Home reserves header space only.
- Road/incident overlays — blocked on road `area` geometry backfill; `accident.nearbyAccidents` available once maps land.
- Push notifications — awaiting FCM/APNs provider credentials.
- Haptics — needs `expo-haptics` adoption after an SDK-57 compatibility check.
- Production tile source — self-hosted tile server (backend Docker task); switch is config-only via `EXPO_PUBLIC_MAP_TILE_URL`.

## Exit criteria
- Base Iran pack downloads, survives force-close/resume, renders fully in airplane mode at z≤10.
- Correction loop verified end-to-end on device (update-by-uuid + resubmitReport).
- Redesign verified on device per §3 checklist; no regressions in sync/draft flows.
- lint/tsc/test stay clean; results recorded in `TODO_HISTORY/checkpoint-log.md`.

**Working rules, toolchain, declaration sync, and font notes:** `mobile/docs/TODO_HISTORY/working-rules.md`.
