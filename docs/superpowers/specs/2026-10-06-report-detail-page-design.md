# Report detail page — design

Date: 2026-10-06
Status: approved. Layout option **ب** (sticky rail + scrolling content), full DTO
cards, per-vehicle "جزئیات بیشتر" toggle, form labels resolved from a shared
definition cache.

## Context

`/orghead/reports` lists an organization's reports. The **مشاهده** button on every
row does nothing.

`front/src/components/org/OversightTable.tsx:43` gates it:

```ts
export const canOpenReportDetail = (level: string | null): boolean =>
  level === "Manager" || level === "Ghost";
```

An `OrgHead` has `userLevel === "OrgHead"`, so `RowLink` renders an inert `<span>`
rather than a `<Link>`. Every other control on that page works, which is why it
reads as a broken button rather than a missing feature.

Behind it were four server gates, now fixed — see
`back/prompt/03-scope-report-detail-and-list-for-org-leaders.md` and the
`back/src/**` diff. Flipping the predicate is now safe. But "flip the predicate" is
not the job: the page behind it is a 114-line skeleton that renders
`report.vehicle_dtos?.length` — a count — and never shows a single vehicle, person
or damage record.

## Goals

- **مشاهده** opens a real detail page for org heads and unit heads, on both
  collections.
- Every field the model holds is rendered, as typed cards — not as a count, not as
  a raw nested dump.
- One page for both sources. The two models are merged in the list, so they must
  be reconciled here too rather than split into two half-identical pages.
- The map is present and correct.
- **One network request** for the common case.

## Non-goals

- Surrounding-accident context on the map. `accident.nearbyAccidents` is
  Patrol/Manager/Ghost only **and** applies no organization scope, so it would
  leak cross-org rows. Out of scope; the console's whole population is 14 rows
  anyway.
- Editing a report. The page is a read surface with the existing review actions.
- Label resolution for `accident.dynamic_answers` (see *Known limitations*).

## Two findings that shaped this

### 1. The console shows 14 rows, not 52,000

`getOrgReportBase` scopes org leaders with `"officer.level": "Patrol"` **and** an
`$or` on `organization._id` / `road._id`. Measured over the live collection:

| `officer.level` | `organization` | `road` | rows |
| --- | --- | --- | --- |
| absent | absent | present | 52,809 |
| absent | absent | absent | 18 |
| Patrol | present | absent | 14 |
| Patrol | absent | absent | 1 |

The legacy catalogue carries a road but **no officer**, so `officer.level: "Patrol"`
excludes it before the `$or` is evaluated and the `road._id` clause matches
nothing. The org console's real population is 14 rows.

This is good news for the detail page: the rows it will render are app-filed, so
`vehicle_dtos` / `people_dtos` are populated. It is bad news for anyone expecting
the org console to be a window onto the back catalogue — that is a separate
product decision (widen `officer.level`, not the `$or`) and is recorded in the
`reportScope.ts` comment rather than fixed here.

### 2. `review_history` is embedded, so the second fetch is unnecessary

`review_history` is an **embedded array** on both models
(`accident.ts:254`, `incident_report.ts:174`) whose `reviewer` is a snapshot
(`{_id, first_name, last_name}`), not a relation. So `get: { review_history: 1 }`
returns the entire trail in the main fetch.

`OrgIncidentDetailView` today fetches it separately through
`accident.getReportReviewHistory`. That split existed only because `accident.get`
carried **no `grantAccess` and no scope** — it always succeeded, so the only thing
that could be refused was the history. Now that `accident.get` resolves scope
through `getOrgReportBase`, a report the caller may not see fails the *main* fetch,
which is the correct answer. There is no longer a "visible report, refused trail"
case to degrade from.

**The second fetch is deleted.** The detail page is one request. This also
invalidates the premise of assertion R7 in `panel-routing-test.py` — see
*Test changes*.

## Architecture

### Source-aware, not source-normalized

`?source=incident_report` is written by `reportDetailHref`
(`utils/report-routes.ts:23`) and read by **zero** components; `OrgIncidentDetailView`
calls `accident.get` unconditionally, so an `incident_report` id misses and renders
an error box. `getIncidentReport` (`app/actions/incident_report/get.ts`) already
exists, correctly written, imported by nothing.

The fix is **one fetch function that branches**, and one page whose sections each
declare which sources they render for. Not a normalizer: the two models' fields do
not map onto each other (`incident_report` has no `attachments`, no `vehicle_dtos`,
no `dead_count`), and an adapter would either invent fields or drop them.

```
OrgIncidentDetailView
├── reportSource (from ?source=, validated)
├── fetchReportDetail(reportId, source)      ← one request, branches by source
├── ReviewActions        (source-aware act)  ← 5th bug, see below
└── ReportDetail         ← shell + sections
    ├── ReportSummaryCard      both
    ├── ReviewActionCard       both
    ├── ReportLocationMap      both
    ├── VehicleSection         accident only
    ├── PeopleSection          accident only
    ├── FacilityDamageSection  accident only
    ├── FormAnswersSection     incident_report only
    ├── AttachmentGallery      accident only
    └── ReviewTimeline         both (from embedded review_history)
```

`ReportDetail` is shared by all four detail routes (`/patrol`, `/patrol-manager`,
`/employee`, `/orghead`+`/unit-head`), so all four get the rebuild. `ResubmitAction`
stays on the Patrol-facing routes only.

### The 5th bug: `ReviewActions` hardcodes the wrong collection

`components/patrol/ReviewActions.tsx:4`:

```ts
import { reviewReport } from "@/app/actions/accident/reviewReport";
```

`reviewIncidentReport` (`app/actions/incident_report/reviewReport.ts`) exists and is
documented for exactly this — "a detail screen that knows the row's kind can offer
the same actions on either **without the buttons silently acting on the wrong
collection**" — and nothing imports it. So on a non-accident row the approve button
today would hit `accident.reviewReport` with an id that is not in `accident`. The
bulk action bar (`OversightActionBar` → `bulkReviewReports`) resolves the model per
row and is correct; only the single-report path is wrong.

`ReviewActions` takes a `source` and dispatches. Org heads get the actions too —
`applyReviewTransition` already resolves scope through `getOrgReportBase` and
`assertReviewBatchAllowed` admits `isOrgLeaderLevel`, and the bulk bar already lets
them review. Denying single-row review would be incoherent.

### Layout — option ب

RTL, so the **sticky rail is on the right** and content scrolls on the left.

| Rail (sticky, 250px) | Content (scrolls) |
| --- | --- |
| `ReportSummaryCard` — 4 metric tiles (fatalities / injured / vehicles / people) + road, km, collision type, severity, light, GPS accuracy | `VehicleSection` — one card per vehicle |
| `ReviewActionCard` — allowed actions + the current status and what comes next | `PeopleSection` — one card per person |
| `ReportLocationMap` — incident marker + officer GPS marker joined by the accuracy span | `FacilityDamageSection` — one card per damaged asset |
| | `FormAnswersSection` — `incident_report` only |
| | `AttachmentGallery` — `accident` only |
| | `ReviewTimeline` — from embedded `review_history` |

Below `lg` the rail becomes the first block in flow and stops being sticky. The
map marker fix (`delete L.Icon.Default.prototype._getIconUrl`) stays in
`ReportLocationMapClient`, which already has it.

### Vehicle cards and the "جزئیات بیشتر" toggle

Each vehicle is one card. **Always visible:** plate, `fault_status`, `final_status`,
driver name. **Behind the toggle:** driver national code, phone, licence type and
number, personal insurer + policy number, body insurer + number + date, vehicle
type and year, passengers, damaged sections.

Rationale: 8 labelled fields per card times two cards is very tall on a 1024px
screen, and the four always-visible fields are the ones a reviewer scans for. A
vehicle with no toggleable fields renders no toggle.

## Data fetching — one request

```
load():
  fetchReportDetail(id, source)      → report (includes embedded review_history)
  if (source === incident_report):
      await primeFormLabels(orgId, report.form_definition_id)   ← cached, usually free
```

### `fetchReportDetail` — `services/report-detail.ts`

Branches on `source` and calls `accident.get` or `incident_report.get`. **Two
response shapes, and this is the trap:** `accident.get`'s fn is
`accident.aggregation(...).toArray()`, so `body` is a **one-element array**;
`incident_report.get`'s fn is `findOne`, so `body` is the **object**. `accident/get.ts`
does not call `asSingleItemResponse`, which is why every current detail page
`unwrapApiResponse<PatrolReport>` on what is really an array and renders an empty
shell. This is a fifth defect in the same family and is fixed here.

Each source gets its own projection — the validators differ by design
(`selectStruct("accident", 2)` vs `selectStruct("incident_report", 1)`), and
`accident.get`'s validator accepts `serial`/`collision_type` which
`incident_report.get` rejects as unknown keys. Both projections name
`review_history: 1` and are merged with a `_id`/`report_id` floor, per the
"never send an empty `get`" rule.

### Form labels — shared cache, no new fetch

`incident_report.form_answers` is the verbatim answer tree keyed by node key, and
`dynamic_answers` stores `question_key` plus an already-resolved `answer_name`.
Neither carries the question's Persian text — that lives in
`form_definition.definition.pages[].sections[].nodes[].label`.

`OrgReportsView:175` **already** calls `getFormDefinitions({organizationId})` to
populate the filter bar, and `FORM_DEFINITION_PROJECTION` already requests
`definition: 1` — the whole node tree. So the labels are already on the wire for
any user who came through the console.

Extract that call into `services/form-definition-cache.ts`: a module-level
`Map<organizationId, Promise<Map<nodeKey, {label, sectionTitle}>>>`, so the list
page and every detail page share one request per organization per session.
Consequences:

- accident detail → **1 request**, no label work at all.
- `incident_report` detail → 1 request, plus at most one form fetch that arriving
  via the console has already paid for.
- Direct navigation to a detail URL → one extra form fetch, once.

**A failed label resolution must never fail the page.** The cache resolves to an
empty map on error and the answers section falls back to showing raw keys, which is
ugly but honest. A missing `form_definition` document (deleted, or an id from
another organization) degrades the same way.

## Known limitations

- **`accident.dynamic_answers` labels are not resolved.** Those keys come from
  `accident_process`, a different model with its own versioning lifecycle. Fetching
  it would be a second definition source for a field the process wizard is being
  retired in favour of. They render under «یادداشت‌های تکمیلی» with the raw
  `question_key` and the answer, and the section says so. Documented rather than
  faked.
- **`AttachmentGallery` may be empty.** `attachments` is populated only by
  `file.uploadAccidentImages`, and `incident_report` has no such field. Files live
  at `<LESAN_URL>/uploads/accidents/<file.name>` — a path **not stored on the
  document**; it is derived from which act wrote them. The section renders nothing
  when there is nothing, rather than a broken-image grid.
- **Unit granularity.** A `UnitHead` sees every report on their organization's road,
  not just their unit's. That is what `getOrgReportBase` does for the list too, so
  the console and the detail page agree. Fixing it is a product decision.

## Test changes

`panel-routing-test.py` R7 currently asserts:

- `canOpenReportDetail` is exported and consulted — **kept**;
- `OrgIncidentDetailView` has **no** `Promise.all` and **has** `setHistory([])`.

The second pair encoded "a refused history must clear the trail rather than fail the
page". That scenario is now unreachable: history is embedded in the main fetch, and
`accident.get` refuses the whole record for a caller who may not see it. R7 is
rewritten to assert the new invariant instead — the detail view makes exactly one
report fetch, and no separate history call exists:

- `getReportReviewHistory` must not appear in `OrgIncidentDetailView`;
- `review_history` must be in both projections;
- `canOpenReportDetail(userLevel)` must still gate `RowLink`.

R6's banned-string list is unchanged.

## Files

**New**

| File | Responsibility |
| --- | --- |
| `services/report-detail.ts` | source-branching fetch; both projections; `review_history: 1` |
| `services/form-definition-cache.ts` | one form fetch per organization; node-key → label map |
| `components/report/ReportSummaryCard.tsx` | metric tiles + key facts |
| `components/report/VehicleSection.tsx` | vehicle cards + the details toggle |
| `components/report/PeopleSection.tsx` | person cards |
| `components/report/FacilityDamageSection.tsx` | damaged-asset cards |
| `components/report/FormAnswersSection.tsx` | `form_answers` with resolved labels |
| `components/report/AttachmentGallery.tsx` | images with a lightbox |
| `components/report/ReviewTimeline.tsx` | the embedded trail, sorted client-side |

**Changed**

| File | Change |
| --- | --- |
| `components/org/OversightTable.tsx` | `canOpenReportDetail` admits org leaders |
| `components/org/OrgIncidentDetailView.tsx` | one fetch, branches on `?source=` |
| `components/patrol/ReportDetail.tsx` | becomes the rail + section shell |
| `components/patrol/ReviewActions.tsx` | takes `source`, dispatches to the right act |
| `services/patrol-projections.ts` | adds `review_history`, per-source projections |
| `components/org/OrgReportsView.tsx` | reads the shared form cache |
| `utils/report-routes.ts` | documents `source` as now-required |
| `../.workbuddy-ai/tools/panel-routing-test.py` | R7 rewritten as above |

`back/` is untouched. The four acts were fixed under prompt 03.

## Verification

```bash
cd front
npx tsc --noEmit                                   # clean
pnpm lint
python3 ../.workbuddy-ai/tools/panel-routing-test.py   # 121+ assertions pass
```

Then, by hand, as an **OrgHead** on `/orghead/reports`:

1. Every row's **مشاهده** is a link. Both sources open — check the URL carries
   `?source=`, and that an `incident_report` row does not 404.
2. The rail stays pinned while the content scrolls; below `lg` it becomes the first
   block in flow.
3. Both map markers render (no broken sprite), joined by the accuracy span.
4. A vehicle's toggle reveals the insurance/licence/passenger fields.
5. Network panel: **one** request for an accident row. For an `incident_report` row
   navigated to from the console, no form request at all.
6. Approve a non-accident row — the state machine must advance it (this is the
   `ReviewActions` bug; the accident act would have silently failed).
7. As **Patrol**, `/patrol/reports/[id]` still opens and **جزئیات بیشتر** (the
   resubmit action) still shows — the narrowing backend change must not have
   regressed it.
8. As **Manager**, `/patrol-manager/reports/[id]` unchanged.