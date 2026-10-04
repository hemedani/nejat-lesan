# 08 — Migration and Current Status

An honest account of what is finished, what is not, and what to do next.

## Summary

| Area | State |
| ---- | ----- |
| Shared engine | **Complete** — 148 tests (incl. icons + snapshot) |
| Backend `form_definition` model | **Complete** — `form_kind`, `icon`, singleton accident index, retired pre-split index |
| Backend acts | **Complete** — 14 acts, org-scoped, publish-time binding/icon validation |
| Access control & tenant isolation | **Complete** — 20 tests |
| Module licensing | **Complete** |
| `incident_report` model + 17 acts | **Complete** — full patrol/review lifecycle + 3 oversight acts |
| `accident` de-polymorphised | **Complete** — no `incident_type`, charts filter-free |
| `synced_at` on both report models | **Complete** — server-owned, written once; 11 tests |
| Organization oversight console | **Complete** — merged list, three stats blocks, bulk review, CSV |
| Shared icon vocabulary | **Complete** — 80 names, validated at activation |
| Frontend builder | **Complete and routed** — `/forms`, `/forms/new`, `/forms/[formId]` |
| Frontend live preview | **Complete** |
| Mobile form picker | **Complete** — 3 inline + overflow, Phosphor icons |
| Mobile bundled default form | **Complete** — offline, submits without `form_definition_id` |
| Mobile sync branching | **Complete** — `targetModelFor` picks model *and* mapper |
| Mobile renderer | **Routed** — `file` and `location` remain placeholders |
| Form submission | **Complete** — typed bindings + `dynamic_answers` + `form_answers` |
| QA form as a definition | **Complete** — 36 acceptance tests |
| `accident_process` migration | **Superseded** — wizard is accidents-only now |

> The old row "Frontend merged report console — accidents + reports from one
> source" was replaced by the two console rows above it. That is not a cosmetic
> rename: the browser-side merge it described (`fetchMergedReports`, two `gets`
> calls) **listed nothing** for an organization head and has been replaced
> server-side. See §2d.

## Verification run

Measured on this working tree, not carried over. Backend suites share one
database and each **drops it**, so they were run one file at a time and totalled
by hand; see the loop below.

| Suite | Result |
| ----- | ------ |
| `shared/form-engine` — `deno test -A test/` | **148 passed, 0 failed** |
| `back` — per-file loop over `test/*-test.ts` (18 files) | **283 passed, 0 failed** |
| `mobile` — `npx vitest run` (22 files) | **244 passed, 0 failed** |
| `front` — `npx tsc --noEmit -p tsconfig.json` / `npx next lint` | clean / no warnings or errors |
| `mobile` — `npx tsc --noEmit` / `npx expo lint` | clean / 0 errors (50 warnings) |
| `front` — `next build` | not re-run in this pass (last green: 125/125 pages) |
| `.workbuddy-ai/tools/audit-frontend-actions.py` | OK — 352 calls → 448 acts, all resolve |
| `.workbuddy-ai/tools/audit-module-acts.py` | OK — 400 acts, 38 patterns resolve |
| `.workbuddy-ai/tools/panel-routing-test.py` | 48 assertions pass |
| `.workbuddy-ai/tools/reports-csv-test.py` | 17 assertions pass |

Per-file backend counts: `incident-report-test` 32, `oversight-list-test` 30,
`patrol-operations-test` 30, `form-definition-schema-test` 29,
`form-definition-test` 26, `oversight-stats-test` 16, `oversight-review-bulk-test`
14, `organization-test` 14, `warehouse-test` 12, `accident-report-shape-test` 11,
`report-sync-timestamp-test` 11, `form-definition-access-test` 20,
`accident-process-test` 8, `module-config-test` 8, `charts-legacy-compat-test` 7,
`org-module-test` 9, `enterprise-auth-test` 4, `normalize-email-test` 2.

```bash
cd shared/form-engine && deno test -A test/
cd back && for f in test/*-test.ts; do deno test -A "$f"; done   # one at a time, see below
cd mobile && npx vitest run
cd front && npx tsc --noEmit -p tsconfig.json
```

> Backend suites share one database and each **drops it** on completion, so run
> them individually rather than as one invocation. The loop above is the
> supported way to get a total.
> `panel-routing-test.py` used to hardcode a managed-runtime Node path that does
> not exist everywhere, so it failed before running an assertion. It now resolves
> `node` from `PATH`.
> **Before believing a backend failure, check for an orphan:** a stale
> `deno test` process from an interrupted run races on the same database and
> produces misleading "Collection … is being dropped" errors.
> `pgrep -fl "deno test"`, kill it, re-run.

## What exists

### Shared engine — `shared/form-engine/`

`types.ts`, `paths.ts`, `rules.ts`, `traverse.ts`, `conditions.ts`,
`validate.ts`, `cascade.ts`, `bindings.ts`, `snapshot.ts`, `icons.ts`,
`index.ts`. Dependency-free, consumed as `@forms` by all three services. See
[01 Overview](./01-overview.md).

`snapshot.ts` holds `buildDynamicAnswers`, which flattens an answer tree into
`dynamic_answers` rows on whichever model the report belongs to.

`icons.ts` holds the **shared icon vocabulary**: 80 Phosphor component names,
grouped for the picker's UI, exported as pure data so no client imports an icon
package from the engine. Web maps them through `@phosphor-icons/react`, mobile
through `phosphor-react-native` (there is no `@phosphor-icons/react-native` on
npm — that is why this is a name list and not a shared component). A form's icon
is a string in the definition, validated at activation against this list, so a
typo is caught before publication rather than rendering as a blank box on one
client.

### Backend

- `back/models/form_definition.ts` — `form_definition` (`form_kind`, `icon`,
  singleton accident index, `applyFormDefinitionMigrations`), `form_response`
- `back/models/incident_report.ts` — the non-accident report model
- `back/src/form_definition/` — 14 acts plus `helpers.ts` (structural validator,
  **derived** bindable relations, reference-model resolution, icon validation,
  org resolution)
- `back/src/incident_report/` — 17 acts, of which 3 are the oversight console
  (`oversight/`)
- Gated behind the `forms` / `incident_patrol` module keys
- Declaration regenerated

`helpers.ts` derives what a form may bind to from the live Lesan schemas
(`getSchemas()[target].mainRelations`) rather than a hand-written list. That
list had already drifted by 16 models between the two clients; deriving it makes
drift impossible instead of merely unlikely.

### Frontend

- `front/src/components/org/forms/` — `FormBuilder.tsx`, `NodeTree.tsx`,
  `FieldEditor.tsx`, `BindingEditor.tsx`, `RuleEditor.tsx`, `LivePreview.tsx`,
  `FormIcon.tsx`, `IconPicker.tsx`, `form-types.ts`, `rule-editor.ts`, plus
  `FormAuthorGuard.tsx`, `FormAuthorHeader.tsx`, `FormList.tsx`
- `front/src/app/forms/` — the authoring routes
- `front/src/app/actions/form_definition/` — server actions, incl.
  `getBindableRelations` and `getReferenceModels`
- `front/src/app/actions/incident_report/` — the report acts, plus
  `getOversightList.ts`, `getOversightStats.ts`, `reviewReports.ts`
- `front/src/components/org/OrgReportsView.tsx` — the console, mounted by all
  three report routes (`/orghead/reports`, `/unit-head/reports`,
  `/org/[orgId]/reports`), plus `OversightFilterBar.tsx`,
  `OversightStatsCards.tsx`, `OversightTable.tsx`, `OversightActionBar.tsx`
- `front/src/services/reports-csv.ts` — `reportsToCsv`, covered by
  `.workbuddy-ai/tools/reports-csv-test.py`
- `front/src/services/report-sources.ts` — accidents + reports behind one
  interface, so the patrol dashboards, employee reports and the sync-status
  widget all read the same shape; also the **types** for the oversight console
  (`OversightRow`, `OversightFilters`, `OversightStats`, `ReviewOutcome`)
- `front/src/utils/panel-nav.ts` — «فرم‌ساز» entries in both role panels
- `ModuleKey` and `MODULE_LABELS` updated for `forms`
- `ModuleConfigClient` `MODULE_KEYS` now includes `forms`, so the module is
  actually toggleable — without it `requiredModule` could never hide or show

### Mobile

- `mobile/src/domain/form-state.ts` — transitions, cascades, persistence, gating
- `mobile/src/domain/form-picker.ts` — 3 inline + overflow, accidents first
- `mobile/src/domain/form-routing.ts` — which screen files the report
- `mobile/src/domain/form-submission.ts` — answers → typed keys + snapshot
- `mobile/src/domain/default-accident-form.ts` — the app's own accident form
- `mobile/src/domain/accident-mapper.ts` — `buildAccidentAddSet` **and**
  `buildIncidentReportAddSet`
- `mobile/src/app/incident/index.tsx` — the form picker entry screen
- `mobile/src/app/incident/form.tsx` — the screen
- `mobile/src/components/form/form-node.tsx`, `form-icon.tsx` — renderer + icons
- `mobile/src/api/form-definition.ts`, `incident-report.ts` — API wrappers
- `mobile/src/services/sync-worker.ts` — branches model *and* mapper per kind
- `shared/form-engine/src/qa-accident-form.ts` — the QA form as a definition
  (`mobile/src/domain/qa-accident-form.ts` is a re-export shim to it)
- `mobile/metro.config.js` — **new and required**

## Wiring: done

### 1. ~~The builder is not routed~~ — **done**

The authoring surface is live at `/forms`, reachable from the OrgHead and
UnitHead sidebars under a «فرم‌ساز» section that only renders when the `forms`
module is on for the organization.

```
front/src/app/forms/layout.tsx          FormAuthorGuard + PanelScopeProvider
front/src/app/forms/page.tsx            the org's definitions
front/src/app/forms/new/page.tsx        builder, no formId
front/src/app/forms/[formId]/page.tsx   builder, existing
front/src/components/org/forms/FormAuthorGuard.tsx    role gate
front/src/components/org/forms/FormAuthorHeader.tsx   chrome + org picker
front/src/components/org/forms/FormList.tsx           list, duplicate, open
```

`/forms` deliberately sits **outside** `/orghead` and `/unit-head`: both roles
author forms but enter from different panels, so the shared surface has its own
guard rather than a duplicated route in each panel. `FormAuthorGuard` admits
Ghost, Manager, OrgHead and UnitHead and redirects anyone else to their own home
panel; `PanelScopeProvider` supplies the organization from `user.roles[]`, with a
picker for Ghost/Manager who hold no org role.

### 2. ~~Mobile routing does not prefer the new form~~ — **done**

`mobile/src/domain/form-routing.ts` owns the precedence as a pure, tested
function, and `incident/index.tsx` calls it:

```ts
resolveIncidentRoute({
  incidentType, online, hasChosenForm, hasRenderableProcess,
});
// '/incident/form' > '/incident/process' > '/incident/details' | '/incident/simple'
```

A form the officer tapped on the entry screen always wins. Only a report with no
chosen form consults the legacy process wizard, which is accidents-only, and then
the standard flow. Both the org form and the org process need the network to
fetch, so an offline device is routed to the standard flow rather than blocked —
incident creation must never require connectivity.

The entry screen is a **form picker**, not a fixed list of incident types, because
an organization can author as many report forms as it needs. `fetchPatrolForms`
loads them, `buildFormPicker` sorts accidents first and then report forms by
title, shows the first three inline and hides the rest behind one button. When
the org has no active accident form, the app's own `DEFAULT_ACCIDENT_FORM` is
appended so an officer is never blocked because an administrator has not finished
setup — and because that form has no backend counterpart, its draft deliberately
submits **without** `form_definition_id`.

`/incident/form` no longer dead-ends either. `empty`, `unsupported` **and** a
transport failure while offline all fall through to the standard flow for the
report's incident type via `standardRouteFor`, and `reports.tsx` sends a returned
report back to `/incident/form` when the draft carries `form_definition_id`.

### 2b. Answers now reach the backend — **done**

The form screen used to save answers to the device and submit nothing. On submit
it now writes them through `formAnswersToDraftData`
(`mobile/src/domain/form-submission.ts`), which produces:

- **typed keys** from `buildBindings`, so a form-filed report populates the same
  relations the analytics queries read;
- **`dynamic_answers`**, via the shared `buildDynamicAnswers`
  (`shared/form-engine/src/snapshot.ts`) — one row per unbound leaf, keyed by
  instance path so `vehicles[1].plate` stays distinguishable from
  `vehicles[0].plate`;
- **local provenance** (`form_answers`, `form_definition_id`, `form_version`).

Which model receives that payload is decided by the report kind, not by what the
payload happens to contain. `sync-worker.ts` calls `targetModelFor` to pick
`accident` or `incident_report` **and** the matching mapper
(`buildAccidentAddSet` / `buildIncidentReportAddSet`). This matters: the two
models declare different relations, so an accident payload sent to the report act
is rejected by the validator, and silently mixing them is exactly the bug the
split removed. `checkProcessVersionFreshness` also skips non-accidents — the
wizard no longer authors them, so there is no version to compare against.

### 2c. Tenant isolation — **fixed**

`form_definition.get`, `gets`, `count` and `validate` originally returned any
organization's data to any authenticated caller: `get` matched on `_id` alone,
and `gets`/`count` only filtered when the caller happened to pass an
`organizationId`. A patrol officer could read a foreign organization's form — a
form encodes that org's internal reporting structure.

All four now scope through `orgFilterFor` → `getAllowedManagerOrgIds`, the same
helper `accident_process.gets` uses. Ghost and Manager keep cross-org reads;
everyone else is pinned to the organizations they belong to, and `validate`
reports «فرم یافت نشد» rather than echoing a foreign definition's questions back
in its error list. Covered by `back/test/form-definition-access-test.ts`.

### 2d. The organization oversight console — **done**

Three acts on `incident_report` (`back/src/incident_report/oversight/`) replace the
browser-side merge that used to back the org console:

| Act | Answers |
| --- | ------- |
| `getOversightList` | one list of accidents **and** non-accident reports, filtered and paginated **server-side** |
| `getOversightStats` | per-officer, per-app-version and aging blocks over the same filter surface |
| `reviewReports` | bulk review with per-row outcomes |

```ts
// back/src/incident_report/oversight/getOversightList/getOversightList.fn.ts:51
const [result] = await coreApp.odm.getCollection("incident_report")
  .aggregate(pipeline).toArray();
```

**One aggregation, not two requests.** `$unionWith` merges `accident` into
`incident_report`; `$facet` counts the total and pages the rows in a single pass.
Two `gets` calls cannot paginate a union coherently — `total` would be wrong and
pages would overlap — and a client-side filter over a capped 200 rows cannot
express "these 52,000 reports, page 4".

**The raw driver is load-bearing.** Lesan's `.aggregation()` appends
`$lookup`/`$unwind`/`$project` stages derived from the client's `get`, **after**
yours. Those stages are anchored on the base collection, so they cannot follow a
`$unionWith` branch, and a generated `$project` after a trailing `$facet` throws
the facet's shape away. The trigger is an ordinary nested relation projection
(`organization: { _id: 1 }`), so the pipeline reads correctly and the answer does
not — easy to reintroduce by "simplifying" a raw-driver act, expensive to debug.
The rule now lives in `back/AGENTS.md` → *Function Implementation Best Practices*,
not only here.

**Filter surface is shared, on purpose.** `getOversightStats` takes the identical
`oversightFilterStruct` as the list. The counts sit directly above the rows that
list returns, so a filter one side honours and the other ignores is a *visible*
disagreement; `oversight-stats-test.ts` asserts reconciliation for every filter.

**Scoping rules, all deliberate.** Org leaders get `getOrgReportBase`, whose
`$or` already matches both app-linked and legacy records — so their
`organizationId` is **ignored**, because narrowing on `organization._id` would AND
with that `$or` and hide every legacy report. (`getReportScope` is the wrong
helper here: it *throws* for org leaders.) A Manager's `organizationId` narrows the
**view**, not permission; the review acts still scope through `getOrgReportBase`.

**Dates are local days** (moment `startOf`/`endOf("day")`), matching the chart
acts. `new Date(dateTo)` is midnight and silently drops the rest of that day.

**Module gate:** automatic through the `incident_report.*` wildcard. Nothing to
register, and nothing to add to a module map.

### 2e. Two defects found and fixed while building it

Neither was visible to the test suite. Both are recorded here because the reasons
generalise.

**1. The org console's report list listed nothing.** Two independent bugs stacked:

- the caller passed a road **id** to a filter that matches road **name**
  (`accident.gets`: `matchConditions["road.name"] = { $in: road }` — Persian
  strings), so the accidents side matched zero rows;
- the non-accident list act scopes through `getReportScope`, which **throws** for
  org leaders, and the caller used `Promise.allSettled`, which swallowed the
  rejection into a `partial: true` flag nobody read.

Result: a successful, empty table — indistinguishable from "this organization has
no reports". Replaced by `getOversightList`, which is one query with one scope and
one filter set. **Still open:** `fetchMergedReports` survives in
`front/src/services/report-sources.ts` and is still called by
`OrgAnalyticsPanel` (the «نمای تحلیلی رخدادها» card on `/orghead` and
`/org/[orgId]`) with `road: [roadId]`, so **that card still shows zero** for an org
head. See §9.

**2. A leftover pre-split unique index capped an organization at one active form.**
`form_definition` carried a unique `{ "organization._id": 1, incident_type: 1 }`
filtered to `status: "active"`. Definitions no longer carry `incident_type`, so
every active form indexed as `incident_type: null` and collided with every other —
capping an organization at **one active form of any kind**, the exact opposite of
"one active accident form, any number of report forms". Fixed by
`applyFormDefinitionMigrations()`, `await`ed in `back/mod.ts` immediately before
`runServer`.

Why no test could catch it: `createIndex` only ever *adds*, so the index survives
any code deploy; and **every suite drops its database**, so the stale index is
never present when a test runs. A test asserting only "ten forms can exist" passes
either way and proves nothing. `form-definition-test.ts` therefore
**recreates** the old index deliberately (`recreatePreSplitIndex`), asserts the
second active form *is* rejected (proving the index really is back), then runs the
migration and asserts ten forms insert.

## What is not done

### 3. `accident_process` is now accidents-only — no migration needed — `resolved`

This item was originally "migrate every org's wizard to `form_definition`". The
model split made that unnecessary. `accident_process` authors accident
registration, so `add`/`update` validate against
`process_authorable_incident_types = ["accident"]` and reject any other value —
a wizard must not be able to author questions for a model that would reject the
answers. The legacy `incident_type` field survives only so existing per-type
documents still read correctly.

Consequences, all deliberate:

- Non-accident registration is `form_definition`'s job, with no per-type ceiling.
- `accident_process` stays registered and keeps working for accidents until it is
  retired on its own schedule. Routing prefers a chosen form, falls back to the
  wizard for accidents, then to the standard flow.
- Retiring it later is now a small, safe cleanup: archive the acts, the
  `ProcessBuilder` UI and `/incident/process`, drop it from `MODULE_KEYS`, and
  update the two tests that reference it. Do not do this before orgs have
  actually moved to an authored accident form — unlike the non-accident case,
  there is no bundled replacement for a *customized* wizard.

### 3b. Activation is not transactional — `low, accepted`

`activate` archives the previous active definition and then activates the new
one, without a transaction. A crash between the two steps can leave an org with
no active accident form. This is mitigated rather than fixed: the client falls
back to its bundled default form (`{ form: null }` is a valid `getForPatrol`
answer), so the consequence is a temporarily generic accident form, not an
inability to file. A real fix means an outbox or a two-phase status, which is
more machinery than the failure warrants.

### 4. `file` and `location` fields are placeholders on mobile — `medium`

`form-node.tsx` renders a hint:

```tsx
{node.type === 'file' ? 'مستندات از بخش رسانه ثبت می‌شود.' : 'موقعیت از بخش نقشه ثبت می‌شود.'}
```

The capture flows already exist (`MediaSection`, `/incident/location`) and are
untouched. What is needed is the definition field binding to them:

- `file` → mount the existing media component, keyed by an owner tag
  (`vehicle:<i>`, `facility:<i>`) as `media-writeback.ts` already supports
- `location` → embed the map picker, or deep-link to the location step and write
  the result back

Also unresolved: the `location` field must keep `gps_coords` (officer) separate
from `incident_coords` (selected), per `mobile/AGENTS.md`.

### 5. Cross-group `select` options are not populated — `low`

`damage_vehicleId` ("vehicle related to this damage") declares an empty literal
option list. The QA prototype builds these options from the vehicle group.

The engine needs a way to derive one field's options from another part of the
answer tree — an `OptionSource` that evaluates against answers rather than
querying a model. Design it before implementing; do not hard-code it into the QA
definition.

### 6. `form_response` has no write act — `low, deliberate**

The model exists and answers are validated and bound, but nothing persists a
response document. Submission flows through `accident.add` / `accident.update`
with bound typed fields, which is why the charts work today.

Worth adding when reporting across forms matters more than the extra write on
every submission.

### 7. No component tests on mobile — `pre-existing`

`mobile/vitest.config.ts` includes `src/**/*.test.ts` only. The `.tsx` renderer
has no component tests. Enabling them needs `jsdom` plus
`@testing-library/react-native`, neither of which is installed.

### 9. The org analytics card still shows zero — `medium, open`

`front/src/components/org/OrgAnalyticsPanel.tsx` (the «نمای تحلیلی رخدادها» card on
`/orghead` and `/org/[orgId]`) still calls `fetchMergedReports({ road: [roadId] })`,
which has both bugs from §2e defect 1: a road **id** sent to a `road.name` filter,
and `incident_report.gets`, whose `getReportScope` throws for org leaders — a
rejection `Promise.allSettled` swallows. The card therefore reports 0 events for
an organization head while `/orghead/reports` lists them correctly.

Not fixed here: this pass is documentation-only. The fix is to point the card at
`getOversightList` (it wants the same population plus a `group_key` breakdown the
row projection already carries) and then delete `fetchMergedReports`, whose only
remaining caller it is.

## Changes to existing code

| File | Change | Why |
| ---- | ------ | ---- |
| `back/src/app_modules/constants.ts` | added `"forms"` **last** | `moduleKeyFor` returns on first match; ordering is load-bearing |
| `back/src/app_modules/moduleConfig.ts` | mapped `form_definition.*`, `form_response.*` | the gate |
| `back/src/form_definition/{get,gets,count,validate}` | organization scoping | tenant isolation |
| `back/test/module-config-test.ts` | `length === 3` → `MODULE_KEYS.length` | a hardcoded module count |
| `back/test/org-module-test.ts` | same, plus `forms` added to `orgSet` | ditto |
| `front/src/types/auth.ts` | added `"forms"` to `ModuleKey` | type parity |
| `front/src/utils/org.ts` | added `forms: "فرم‌ساز پویا"` | module label |
| `back/declarations/selectInp.ts` | regenerated | new acts |
| `front/src/types/declarations/selectInp.ts` | synced copy | parity |
| `mobile/tsconfig.json` | `@forms` path, `allowImportingTsExtensions` | Metro ignores paths; the flag is for `tsc` |
| `front/tsconfig.json` | `@forms` path, `allowImportingTsExtensions` | explicit `.ts` specifiers |
| `mobile/AGENTS.md` | replaced the "no external imports" rule | Metro config now makes it safe |
| `back/models/{accident,incident_report}.ts` | added `synced_at` | per-officer median sync time — not derivable from anything else |
| `back/src/{accident,incident_report}/update/` | stamp `synced_at` on the **first** `synced` transition only | it is a fact about arrival; a correction must not restamp it |
| `back/models/{accident,incident_report}.ts` | two indexes each for the oversight console | `{org._id, createdAt/reported_at}`, `{sync_status, date_of_accident/reported_at}` |
| `back/models/form_definition.ts` | `applyFormDefinitionMigrations()` | drops the pre-split index; `createIndex` cannot (§2e defect 2) |
| `back/mod.ts` | `await applyFormDefinitionMigrations()` before `runServer` | so the first request cannot race the migration |
| `back/test/oversight-{list,stats,review-bulk}-test.ts` | new — 60 tests | the three acts, scope, filters, median, bulk outcomes |
| `back/test/report-sync-timestamp-test.ts` | new — 11 tests | `synced_at` on both models, including forgery attempts |
| `back/test/form-definition-test.ts` | two tests that recreate the pre-split index | a dropped-database suite cannot see a stale index |
| `front/src/app/actions/incident_report/*Oversight*`, `reviewReports` | new server actions | typed against the regenerated declarations, no cast |
| `front/src/services/reports-csv.ts` | new `reportsToCsv` | labels restricted to enum columns; BOM for Excel |
| `front/src/components/patrol/DarkModal.tsx` | extracted from `ReviewActions.tsx`, adopted there | shared by the patrol review UI and the oversight action bar |

Nothing was deleted. `accident_process`, `ProcessBuilder`, and the legacy mobile
screens all still work — routing prefers a chosen form and falls back, so an org
that authored nothing keeps working.

### The accident / incident_report split

The largest change, and the one the form system exists to serve. `accident` used
to be polymorphic: one document carried either a collision or a road report,
selected by `incident_type`. That produced three bugs at once — accident
statistics counted road reports (`user.dashboardStatistic`, `accident.count`,
`getCreatedAtPeriods`, `mapAccidents` all read the whole collection), a single
document could hold accident-only data (vehicle cards, collision type) beside
road-report data, and `form_definition` keyed on `incident_type` so only one form
per category could ever exist.

| File | Change | Why |
| ---- | ------ | --- |
| `back/models/accident.ts` | dropped `incident_type`, `incident_payload`, `incident_severity` | accidents are accidents |
| `back/models/incident_report.ts` | new — `INC-` prefix, form provenance, review lifecycle | non-accident events, unbounded forms |
| `back/src/incident_report/` | 17 acts (was 14), officer attribution + sync state server-enforced | full parity with `accident`, plus the oversight console |
| `back/src/accident/charts/*` (25 acts) | dropped `accidentOnlyFilter` | the filter existed to undo the pollution the split removes |
| `back/models/accident_process.ts` | authorable set narrowed to `["accident"]` | a wizard cannot author for a model that rejects the answers |
| `back/test/incident-types-test.ts` | replaced by `accident-report-shape-test.ts` | the old test asserted the wrong contract |
| `back/test/charts-legacy-compat-test.ts` | rewritten as a structural guard | the old test asserted removed filters |
| `front/src/services/report-sources.ts` | new — accidents + reports behind one interface | the console shows both without branching per panel |
| `mobile/src/services/sync-worker.ts` | branches model and mapper per report kind | the two models declare different relations |

The map is unchanged and intentionally accidents-only: `mapAccidents` is an
accident feature, and road reports do not belong on it.

A category enum was considered for `incident_report` and **rejected**. The form a
report was filed under is its category; a separate field would be a second source
of truth that can disagree with the questions the officer actually answered.

> **One engine bug was fixed along the way.** `buildBindings` and
> `buildFlatAnswers` read a field's value from the nearest scope object, but
> traversal only pushes *repeatable rows* onto the scope — a `group` also nests
> its children (`{ group: { note } }`). A bound field inside a group therefore
> projected nothing, silently dropping typed accident data from a form-filed
> report. Both now resolve `meta.instancePath` instead. See the regression test in
> `bindings_test.ts`.

### 8. No production migration has been run — `medium, external`

The split itself needs no data migration: the development database holds 52,828
accidents, zero non-accident rows, zero `form_definition` documents, and one
accident-only `accident_process`, so nothing needs rewriting. What is *not* done
is verifying that on production, which is unreachable from the development host.
Before deploying:

- confirm `accident` has no documents with `incident_type != "accident"`; if any
  exist, they need moving to `incident_report` (including their
  `incident_payload` → core fields and `incident_severity` → relation);
- confirm no `form_definition` carries `incident_type`/`is_active`;
- the obsolete `{ organization._id, incident_type }` index on `form_definition` is
  dropped **by the app**, not by hand: `applyFormDefinitionMigrations()` runs before
  `runServer` (§2e defect 2). Verify it is gone rather than assuming —
  `db.form_definition.getIndexes()` must not list
  `organization._id_1_incident_type_1`;
- decide what to do with legacy per-type `accident_process` documents, which stay
  readable but are no longer authorable.

Note that a pre-existing `synced_at` cannot be backfilled either: production rows
synced before this change have no arrival instant, and inventing one from
`updatedAt` would fabricate the median. They stay `null`, and
`getOversightStats` reports them as "unknown" rather than as an instant sync.

## Suggested order of work

1. Run the pre-deployment check on production (8).
2. Fix the org analytics card (9) — one card, one call site.
3. Wire `file` / `location` (4) — needed before collecting real evidence.
4. Soak the authoring surface, the picker and the dynamic form on a real device.
5. Author at least one real `incident_report` form per organization that patrols a
   road, so the "unbounded forms" claim is tested rather than assumed.
6. Extract cross-group options (5) once a real form needs them.
7. Retire `accident_process` after a stable soak and authored accident forms.

> Item 2 was added after the oversight console shipped. It is the same defect as
> §2e/1, in the one place that still calls the old merge helper.
