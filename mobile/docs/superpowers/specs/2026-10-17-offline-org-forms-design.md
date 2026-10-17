# Offline organization forms — design

Date: 2026-10-17
Status: approved (approach 1: cache-first with background refresh)

## Problem

An officer on the road with no connection cannot open the forms their organization
authored. Today:

- `/incident/form` fetches `form_definition.getForPatrol` over the network. Offline it
  throws, and `form.tsx:146-151` silently substitutes the **bundled default form** — so
  the officer files a report on a form their organization does not use, with questions
  their own workflow never asked.
- `/incident/process` refuses outright (`process.tsx:96-101`, «بدون اینترنت؛ فرآیند ثبت
  سازمان بارگیری نشد.»).
- The entry screen skips `form_definition.gets` when offline (`index.tsx:156-158`), so
  the picker falls back to the four built-in incident-type tiles.
- There is **no definition cache at all**. The backend-resolved `options` map a dynamic
  form needs for its dropdowns is memory-only (`form.tsx:171`) — the comment at
  `form-node.tsx:404` claiming it is «cached for offline use» describes nothing.

## Decisions

| Question | Decision |
| --- | --- |
| Which form systems | **Both**: `form_definition` (+ shared `@forms` engine) and the legacy `accident_process` |
| Buttons | **One** button that downloads and syncs everything |
| Versions in the cache | **Latest only** — one row per form |
| Stale cache at submit time | **Gate it**, reusing the `accident_process` behaviour at `sync-worker.ts:249-273` |
| Read strategy | **Cache-first**; the network is reached only behind the explicit button |

### Why latest-only is acceptable

A draft snapshots `form_version` / `process_version` at capture time. Keeping only the
newest definition means a draft resumes against a newer tree than the one its answers
were typed into. That is contained by two things already in place:

1. `isDefinitionRenderable` (`domain/form-state.ts`) rejects a structurally incompatible
   tree, so the officer gets «این فرم در نسخه فعلی قابل نمایش نیست» plus a standard-form
   escape rather than a blank wizard.
2. The submit-time gate (below) refuses to send answers shaped by a superseded version.

`form_answers` is stored losslessly, so an answer whose node disappeared is preserved in
the tree rather than dropped — per the invariant against silently discarding fields.

## Architecture

### Storage

Migration **v4** adds `offline_forms`:

```sql
CREATE TABLE IF NOT EXISTS offline_forms (
  scope TEXT NOT NULL,        -- 'form_definition' | 'accident_process'
  form_key TEXT NOT NULL,     -- form_definition: the form _id; accident_process: the incident type
  name TEXT NOT NULL,
  form_kind TEXT,             -- 'accident' | 'incident_report'; null for accident_process
  version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (scope, form_key)
);
```

The DDL is idempotent, so it goes in `BASE_SCHEMA` (fresh installs) *and* in
`STEP_MIGRATIONS[4]` (existing devices) — the same dual placement as `bounds_json`.

`payload_json` holds the **whole** `getForPatrol` result, options map included. A
definition without its options renders empty dropdowns, which is worse than not caching
it at all, so the two are cached as one unit.

SQL accessors live in `storage/local-database.ts` with the rest of the SQL; row parsing
and every decision live in the pure `domain/offline-forms.ts`, because `expo-sqlite`
cannot run under vitest.

### The service — `services/offline-forms-service.ts`

- `loadCachedFormIndex(): Promise<PickerForm[]>` — the entry screen's picker, from cache.
- `loadCachedForm(definitionId)` / `loadCachedFormOfKind(kind)` — the form screen.
- `loadCachedProcess(incidentType)` — the process wizard.
- `offlineFormCacheStatus()` — counts and age for the org card.
- `downloadOrgForms(session)` — the button. Single-flight like `getSyncWorker`.

`downloadOrgForms` fetches `form_definition.gets` (1 call, ids only), then
`getForPatrol` per id (the `gets` projection carries no definition), then
`accident_process.getForPatrol` for `'accident'` — the only type
`resolveIncidentRoute` ever routes to the process wizard, so the other three are not
worth four requests to cache something nothing can open.

**Pruning is authoritative but only on a complete run.** Rows whose key the server no
longer publishes are deleted, because a form withdrawn from an org must not stay
fillable offline. A per-form *transport* failure aborts before the prune, so a dropped
connection mid-download cannot empty a good cache. A `form: null` is a definitive
"this org publishes none", so it prunes rather than aborts.

### Read paths

| Site | Before | After |
| --- | --- | --- |
| `incident/index.tsx` picker | `fetchPatrolForms`, skipped offline | `loadCachedFormIndex()` |
| `incident/index.tsx` `openFormFor` | `fetchPatrolProcess` behind an `online` gate | `loadCachedProcess(type)` |
| `incident/form.tsx` | `fetchPatrolFormById` / `fetchPatrolForm`, bundled fallback on throw | cache first, network second, bundled default last |
| `incident/process.tsx` | hard offline error screen | cache first, network second |
| `sync-worker.ts` | gates `process_version` only | also gates `form_version` |

`resolveIncidentRoute` loses its `online` input: with the process in local storage, its
presence — not the connection — is what decides. `RouteInputs` narrows accordingly.

`resumeRouteFor` needs no change, but its docstring's «there is deliberately no offline
fallback» reason is now wrong and is corrected: the dynamic form resolves its id from the
cache, so a form-filed draft reopens offline.

### The org card

`OrganizationCard` becomes a column: the existing icon + name row, a cache-status line,
then one `Button`. Label switches on state — «دریافت فرم‌ها» when nothing is stored,
«به‌روزرسانی فرم‌ها» once it is. Disabled (not hidden) while offline, so the officer
learns *why* rather than finding a missing control; `loading` during the run.

Hidden entirely when `primaryOrganization` is `null`: the backend resolves the org from
`user.roles`, so a multi-org or global caller has no single org to scope a cache to, and
the card already says «سازمانی ثبت نشده».

## Error handling

| Condition | Behaviour |
| --- | --- |
| Offline, button pressed | Disabled; status line explains |
| `incident_patrol` module off | Button hidden — the backend's Persian message is already surfaced by the entry screen |
| Download fails | Cache untouched, toast carries `translateApiError(error)` |
| Cached row has a corrupt payload | Dropped as «not cached»; the officer gets the standard flow, never a crash |
| Draft's version superseded at submit | Queued with «فرم ثبت سازمان به‌روزرسانی شده است؛ گزارش را باز کنید…», retried in 30 min — identical to the existing process gate |

## Testing

- `domain/offline-forms.test.ts` — row parsing (corrupt JSON, missing version), the
  summary, the prune set, and the changed-version diff.
- `storage/migrations.test.ts` — v4 on an existing device, and present in a fresh install.
- `domain/form-routing.test.ts` — the process wizard is reachable offline; the `online`
  field is gone.
- `domain/sync-rules.test.ts` — the extracted `decideDefinitionFreshness`.
- `services/offline-forms-service.test.ts` — a mid-run transport failure keeps the cache;
  a completed run prunes; a double tap fires one download.

## Out of scope

Warming `references_cache` for the built-in seven-phase wizard. Its own 24 h
fail-then-rethrow policy (`api/references.ts:83-88`) is a separate defect with a separate
screen, and the org forms' dropdowns already arrive inside the cached payload.