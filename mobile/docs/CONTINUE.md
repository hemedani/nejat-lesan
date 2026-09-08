# CONTINUE — Mobile Patrol App

One-page next-task prompt. Full history/logs live in `mobile/docs/TODO_HISTORY/`; the authoritative status backlog is `mobile/docs/TODO.md`; the UI/UX specification is `mobile/docs/Design.md`; the backend-v2 adoption brief (incident types · org/unit · process wizard · module licensing) is `mobile/docs/01-MOBILE_BACKEND_V2_ADOPTION.md`. Backend-side open items are in `back/docs/09-mobile-patrol-backend-incident-types-todo.md` (§8/§36 = mobile handoff) and `back/docs/10-mobile-patrol-backend-incident-types-continue.md`.

---

## Brief history (current state)

Checkpoints 1–10, the 2026-08-25 contract-integration round, GPS-recovery fixes, the offline-map round, the 2026-08-25 UI/UX redesign (Phases 0–7 of `Design.md`), and the police-station picker (2026-08-28) are implemented (`tsc --noEmit`, `pnpm lint`, `pnpm test` all pass; on-device verification and the hardening checkpoints 11/12 remain partial/open):

- **Backend v2 shipped 2026-09-07** (this changes what the app must talk to): the backend now licenses the patrol domain behind the **`incident_patrol`** module (install + per-org layers; `user.login`/`user.getMe` return `modules`/`orgModules`), models each highway as an **`organization`** with a **`unit`** org-chart (patrol units/officers are first-class nodes via `user.roles`; legacy `police_station`/`patrol_unit`/`shift` stay registered for one release), makes `accident` a **polymorphic report** (`incident_type` accident|road_breakdown|road_obstacle|other + `incident_payload` + new `incident_severity` relation + `BRK-/OBS-/OTH-` report prefixes + `incidentType` filters), and adds an org-scoped **`accident_process`** wizard (consumed by the app via `accident_process.getForPatrol`). `file.uploadAccidentImages` gained an `incident` photo category. **The mobile backend-v2 adoption (brief phases A–F) is implemented in code** (see `01-MOBILE_BACKEND_V2_ADOPTION.md`): `modules`/`orgModules` persisted, `incident` media category + limits, module/org error branches, the four incident-type entry tiles with draft serialization, the per-type capture surface (`/incident/simple`), type labels + `incidentType` filter on Reports/Drafts, the process wizard (`/incident/process`, relation/dynamic answers + `process_version`, offline version-change pause), a central module-gating helper (`domain/modules.ts`) wired into Home/Reports/incident, and `{process:null}`/no-membership/`dto`-unsupported fallbacks. **Still open:** device E2E of the four type submissions + process + module-off, media upload enablement (dormant flag) incl. non-accident binding, the map incident layer (road `area`), and hardening.
- **Design system foundation:** semantic tokens in `constants/theme.ts` (`AppTheme`/`Radius`/`Shadow`/`Motion`/`Type`), multi-family icon registry (`constants/icon-map.ts` + `ui/icon.tsx`), 14 shared primitives under `components/ui/` (Button, IconButton, Card/CardHeader, ListRow, ChoiceChip, StatusPill, Badge, Banner, Toast provider, Skeleton set, EmptyState, Section/ScreenHeader, MapControls, StepperHeader, TextField), light-mode locked for v1.
- **Screens redesigned on the system:** login (connectivity pill, icon inputs, error banner), Home dashboard (identity header + avatar initials, unit/vehicle strip, shift/internet/GPS status trio, hero CTA always-on offline, quick-access grid with drafts badge), incident entry (type-selection cards; خرابی/مانع/سایر tiles still «بهزودی» until backend-v2 adoption), location picker (pulsing pin, legend, accuracy pill, snap banner, grabber sheet), 7-phase wizard shell (icon stepper + progress, autosave pill, meta card), form fields/chips/cards, Drafts (true status tones), Reports (working filters, tone pills, rejection banners), Announcements (priority pills, unread badge), More (profile card, logout confirm), map-offline, media sections, GPS recovery button.
- **Pre-redesign core (unchanged):** email/device `user.login`, SecureStore session, five-tab RTL nav, offline-first SQLite drafts/media/queue/reference/map-pack caches, single-flight sync worker with update-by-uuid correction loop + `resubmitReport` chaining, announcements live read-state, accident severity via the `type` model (`typeId`), national Iran offline pack, dormant base64 media-upload pipeline behind `EXPO_PUBLIC_ACCIDENT_UPLOADS`.
- **Police station picker (2026-08-28):** `police_station` joined the cache-first reference set; PhasePolice uses a ListRow picker from `police_station.gets` sending `policeStationId` (manual free-text fallback retained while seed data is missing). Round-trip + mapper tests added; suite 59/59 clean.

---

## Backend-v2 adoption (phases A–F implemented in code — remaining: device/media E2E)

Status 2026-09-07: **phases A–F below are implemented** (`tsc --noEmit`/`pnpm lint`/`pnpm test` green, 86 tests). Remaining: reachable-backend/device E2E for the four type submissions + process wizard + module-off notice + offline queueing, media upload enablement (`EXPO_PUBLIC_ACCIDENT_UPLOADS=on`, incl. `incident` binding), and the type-aware map layer (road `area`). Full phased brief:

Full phased brief: **`mobile/docs/01-MOBILE_BACKEND_V2_ADOPTION.md`**. Condensed checklist (STOP after each phase):

1. **Phase A — contract sync:** store `modules`/`orgModules` from login/getMe; extend media categories with `incident`; translate the module-off («این ماژول برای این نصب فعال نیست» / «…برای این سازمان فعال نیست») and org-membership («سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید») messages.
2. **Phase B — incident-type ungate:** incident entry tiles send the chosen type; draft + mapper + sync serialize `incident_type`/`incident_payload`; queue/correction loop unchanged.
3. **Phase C — per-type forms:** lightweight capture for خرابی آزادراه/مانع یا خطر/سایر (description, road defects, equipment damage, new `incident_severity`, lane; no accident DTO phases); add `incident_severity` to the reference set.
4. **Phase D — lists/map:** type labels + `incidentType` filter on Reports/Drafts; type-aware markers from `nearbyAccidents` when map features land.
5. **Phase E — process wizard:** render `accident_process.getForPatrol` steps/questions; relation answers → typed ids, dynamic answers → `dynamic_answers`, snapshot `process_version`; offline version-change refetch; decide the `process:null` fallback and record it.
6. **Phase F — module UX + media enablement + verification:** gate module-owned surfaces when `incident_patrol` is known-off (Ghost exempt); enable upload (`EXPO_PUBLIC_ACCIDENT_UPLOADS=on`) incl. `incident` category; update docs.

### Outstanding device E2E (post- or mid-migration)
- Offline-map device E2E: base pack airplane-mode render, kill/resume, pause semantics, upgrade, delete.
- Correction-loop device E2E (needs a Manager account): «اصلاح گزارش» → edit → sync → server updated + moved back to `submitted`.
- Redesign pass on real device (Android): Home, location picker, wizard, lists, RTL/a11y.
- Media upload E2E once enabled.

### Out of scope (still blocked)
- Emergency flow — awaiting ops-approved offline SOS policy (online endpoint exists).
- Road/incident overlays — blocked on road `area` geometry backfill; type-aware `nearbyAccidents` data is available once maps land.
- Push notifications (FCM/APNs), haptics, production tile source, PIN/biometric/app-lock.
- Deleting legacy `patrol_unit`/`police_station`/`shift` (backend keeps them one release).

## Exit criteria (backend-v2 adoption session)
- All four incident types register offline-first and sync with correct `report_id` prefixes; non-accident reports never carry accident-only fields.
- Process wizard renders from `accident_process.getForPatrol` (whitelisted answers, multi-select, required validation, `process_version`), with the `process:null`/no-membership states handled gracefully.
- Module-off state shows the Persian notice instead of dead calls; Ghost unaffected.
- `tsc`/`lint`/`test` clean; `pnpm test` extended per phase; results recorded in `TODO_HISTORY/checkpoint-log.md`.

**Working rules, toolchain, declaration sync, and font notes:** `mobile/docs/TODO_HISTORY/working-rules.md`.
