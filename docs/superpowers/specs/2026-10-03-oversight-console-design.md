# Oversight console — design

Date: 2026-10-03
Status: approach approved (`$unionWith` aggregation, CSV-only export). Section 5.1
(`synced_at`) is a small addition made necessary by a gap found during design, and
is not yet confirmed.

## Context

An organization files two kinds of report from the patrol app: accidents
(`accident`) and non-accident events (`incident_report`, driven by an
organization-authored `form_definition`). Both have the same patrol sync and
managerial review lifecycle, but they live in two collections with almost
disjoint filter surfaces, and the org console that should reconcile them is
currently broken.

The previous change made each app submission record its filing organization and
the app build that submitted it. Those two fields are what make oversight
possible: you can finally ask "which unit filed what, on which build", and spot a
release that started causing rejections.

## Goals

- One org-scoped list of accidents **and** non-accident reports, with real
  server-side filtering and correct pagination.
- Bulk review with per-row outcomes.
- Per-officer and per-app-version oversight, plus an aging view.
- CSV export of whatever the reviewer is currently looking at.

## Non-goals

- Assignment / delegation to another unit or officer. No field exists for it and
  nothing above needs one.
- Dispatch-time workflow (live queues, proximity maps, escalating reminders).
- Printable paperwork, archiving, retention.
- Any change to how a report is *filed*.

## Already landed (settled, not part of this work)

- `accident` and `incident_report` each gained an optional `organization`
  relation and a `submitted_from { app_version, platform }` snapshot. Both are
  written only when the app declares `submitted_from`; the organization is always
  resolved server-side from the session (`resolveFilingOrgId`) and is never
  accepted from a client. Nothing is backfilled — the ~52k existing accidents,
  web-console entries and JSON imports leave both fields empty.
- `applyFormDefinitionMigrations()` retires the pre-split
  `{organization._id, incident_type}` unique index on `form_definition`, which
  capped an organization at one active form of any kind. Awaited in `mod.ts`
  before `runServer`.

## Two defects found while designing this

### 1. The org console report list is broken today

`front/src/components/org/OrgReportsView.tsx` resolves the organization, takes
`organization.road._id`, and calls `fetchMergedReports({ road: [roadId] })`.

- `accident.gets` filters `"road.name": { $in: road }` — **names**, not ids. Road
  names are Persian strings (`بلوار امامزاده حسن`), so an ObjectId string never
  matches. In development, 52,809 of 52,828 accidents carry `road.name`.
- `incident_report.gets` builds its scope from `getReportScope(user)`, which
  handles only `Patrol` and `Manager`/`Ghost` and **throws** for `OrgHead` /
  `UnitHead`. `fetchMergedReports` uses `Promise.allSettled`, so the rejection is
  swallowed into `partial: true`.

Net effect: `/orghead/reports` lists nothing. This work replaces that query path
rather than extending it.

### 2. `incident_type` filtering is also name-based

The new merged act must not reuse the name-based road filter. It filters on
`organization._id` (new app submissions) **OR** `road._id` (legacy records and
web-created entries), which is what `getOrgReportBase` already assembles.

## Design

### 5.1 One small data addition: `synced_at`

Per-officer "median sync time" is part of the oversight value, and it is **not
computable today**: there is no timestamp for when a report reached `synced`, and
`updatedAt` keeps moving after later corrections, so it cannot stand in.

Add an optional pure field `synced_at` to both models, written once in the update
path at the moment `sync_status` transitions to `synced`, and never rewritten
afterwards. It is a factual instant, not a mutable field, so it belongs beside
`sync_status` and `rejection_reason`.

If this is declined, drop `medianSyncMs` from `byOfficer` and keep only the
counts; do **not** substitute `updatedAt`.

### 5.2 `incident_report.getOversightList` — merged, filtered, paginated

Why one new act instead of extending the two existing ones:

- `accident.gets` has ~60 filters and **no** `sync_status` / `review_status`.
- `incident_report.gets` has six.
- Two separate acts can never paginate a *merged* list coherently — you cannot
  compute "page 3 of the union" from two independent `page`/`limit` queries, and
  `total` would be wrong.

So a single aggregation, owned by `incident_report` (it is the model whose
lifecycle this is), starting from `incident_report` and pulling in `accident`
through `$unionWith` (MongoDB 4.4+; this server is 7.0.2).

Request:

```jsonc
{ "set": {
    "organizationId": "…",        // optional for Manager/Ghost; forced for org leaders
    "page": 1, "limit": 25,
    "dateFrom": "2026-09-01", "dateTo": "2026-10-03",
    "groupKeys": ["accident", "<form_definition_id>"],
    "sync_status": ["queued", "rejected"],
    "review_status": ["submitted", "returned"],
    "officerIds": ["…"],
    "appVersions": ["1.4.2"],
    "unlinkedOnly": false,
    "search": "…"
  },
  "get": { "rows": 1, "total": 1 } }
```

Pipeline shape:

```
[ { $match: <incident_report branch scope + filters> },
  { $unionWith: { coll: "accident", pipeline: [ { $match: <accident branch scope + filters> } ] } },
  { $facet: {
      rows:  [ { $sort:  { sort_at: -1, _id: -1 } },
               { $skip }, { $limit }, { $project: … } ],
      total: [ { $count: "n" } ] } } ]
```

Each branch adds a common shape with `$addFields` so one sort and one filter set
serve both:

| Field | accident | incident_report |
| ----- | -------- | --------------- |
| `sort_at` | `date_of_accident` ?? `createdAt` | `reported_at` ?? `createdAt` |
| `source` | `"accident"` | `"incident_report"` |
| `group_key` | `"accident"` | `form_definition_id` |
| `group_title` | `"تصادف"` | `form_title` |
| `group_icon` | null | `form_icon` |

`sort_at` is normalised in each branch *before* the union, which is why the sort
is expressed on a synthetic field rather than on two different ones.

Scoping rules, mirroring the `form_definition` acts:

- `OrgHead` / `UnitHead` — `organizationId` is ignored if it falls outside their
  scope; the scope's organizations are used instead.
- `Manager` / `Ghost` — may pass `organizationId` to narrow, otherwise see all.

The base scope comes from the existing `getOrgReportBase`, whose org-leader branch
is already an `$or` of `road._id` and `organization._id`. That is what keeps all
52k legacy accidents visible — see defect 2 above.

`unlinkedOnly: true` becomes
`{ $or: [ { organization: { $exists: false } }, { organization: null } ] }`,
covering records that never carried the field as well as an explicit null.

Response: `{ rows: [...], total: number }`. `rows` use the same shape as the
frontend's `MergedReport`, plus `submitted_from` and `organization._id`, so the
console can render provenance without a second request.

Access: `OrgHead`, `UnitHead`, `Manager`, `Ghost`. Added to the
`incident_patrol` module map — it is exactly the kind of act that map exists for.

### 5.3 `incident_report.reviewReports` — bulk review

Takes `{ reportIds[], action, reason }`, returns **per-id outcomes**:

```jsonc
{ "results": [ { "reportId": "…", "ok": true },
               { "reportId": "…", "ok": false, "error": "…" } ] }
```

Bulk review must not be all-or-nothing. The state machine
(`submitted → under_review → returned | approved → completed`) legitimately
refuses some rows — wrong state, not synced, foreign organization — and a
reviewer approving 40 reports needs to see which 3 refused and why.

Implementation: extract the per-report body of the existing `reviewReport` into a
shared helper and call it per id, collecting outcomes rather than short-circuiting
on the first failure. A `return` still requires a non-empty `reason`, applied
once to the whole batch.

Because accidents and reports share one state machine but are separate
collections, the act resolves each id's model the way `reviewReport` already does
and applies the same action to both.

### 5.4 `incident_report.getOversightStats`

One act returning three blocks, each computed from the same scope and date range
as the list:

- **`byOfficer`** — per officer: counts by `sync_status` and `review_status`,
  first and last `sort_at`, and `medianSyncMs` from `synced_at − reported_at`.
  The median is computed in the act from a `$group`+`$push` of durations rather
  than in the pipeline, because an exact median in an aggregation is awkward to
  express portably. Bounded by org scope and the date range; revisit with
  `$percentile` if per-officer volumes ever make the intermediate array large.
- **`byAppVersion`** — per `submitted_from.app_version`: total, rejected, and the
  distinct officer count. This is the view that makes the provenance field earn
  its place: a build whose rejected-rate jumps is a release to investigate.
  Records with no `submitted_from` group under `"—"` so web and imported reports
  stay visible rather than silently vanishing from the totals.
- **`aging`** — counts of reports stuck past `thresholdHours`, split into
  `queued` (age from `reported_at`) and `under_review` (age from `reviewed_at`).

### 5.5 Frontend console

`OrgReportsView` is rewritten around the new act:

- **Filter bar** — date range, form (`group_key`), sync status, review status,
  officer, app version, free-text search, and an "unlinked" toggle. Each control
  maps to one act filter; state lives in the URL so a filtered view can be shared.
- **Real pagination** — driven by `total` from the act, replacing
  `slice((page-1)*15, …)` over a client-filtered array.
- **Provenance column** — `submitted_from.app_version` and `platform`, rendered as
  `—` for records the app never filed. Distinguishing "not from the app" from
  "missing data" is the point.
- **Selection and bulk review** — checkbox column, a sticky action bar showing the
  selection count, approve / return, one shared reason for a return, and a results
  summary listing which rows refused and why.
- **Stat cards** — the officer table, app-version table, and aging panel from
  `getOversightStats`.

Shared pieces stay shared: `report-sources.ts` keeps owning the merged `MergedReport`
shape and the Phosphor icon lookup, so the dashboard, unit-head and org views
continue to read one thing.

### 5.6 CSV export

Generated client-side from the rows the act already returned — no new act, since
the merged query is the same one. A pure helper (`reportsToCsv`) so it is
unit-testable without a component.

- UTF-8 **BOM** so Excel opens Persian text correctly rather than as mojibake.
- `,` separator, RFC-4180 quoting.
- Columns: report id, source, form/group title, sort date, sync status, review
  status, reason, officer name, personnel code, patrol unit, road, kilometer,
  description, app version, platform.
- Exports the current filter, not just the visible page, and says so in the
  button label, e.g. "CSV — all N matching reports".

## 6. Indexes

| Model | Index | Why |
| ----- | ----- | ---- |
| `accident` | `{ sync_status: 1, date_of_accident: -1 }` | aging + status filters inside the union branch |
| `accident` | `{ organization._id: 1, createdAt: -1 }` | already added with the provenance work |
| `incident_report` | `{ sync_status: 1, reported_at: -1 }` | aging + status filters |
| `incident_report` | `{ organization._id: 1, reported_at: -1 }` | already added with the provenance work |

Non-unique, so the ~52k records without an organization are unaffected.

## 7. Testing

Backend, per act:

- `getOversightList` — filters combine correctly; `total` equals the row count
  across both collections; pagination does not overlap or skip between pages; a
  legacy accident with no `organization` still appears via the road clause;
  `unlinkedOnly` excludes linked rows and includes unlinked ones; an
  `OrgHead` cannot widen scope by passing another organization's id.
- `reviewReports` — mixed success/failure returns per-id outcomes rather than
  throwing; a batch `return` without a reason is refused wholesale; an id from
  another organization fails without affecting the rest.
- `getOversightStats` — officer counts reconcile with the list's `total` for the
  same filter; `"—"` appears for records without provenance; `medianSyncMs` is
  absent rather than zero when `synced_at` was never set.

Frontend: `reportsToCsv` as a pure function (BOM present, quoting of commas and
quotes, Persian text intact). The console itself is not component-tested —
`jsdom` + testing-library are not installed, and enabling them is its own piece of
work.

## 8. Migration and compatibility

- `synced_at` is optional and never backfilled. Historical reports simply have no
  sync duration, and the stats show `—`.
- No existing record changes. The provenance work already covers the org-link
  side.
- `getOversightList` does not replace or deprecate `accident.gets` /
  `incident_report.gets`; admin crash-report tooling keeps using them. Only the
  console moves.
- Frontend and backend declarations regenerate together; `audit-frontend-actions`
  must pass before this is called done.

## 9. Out of scope

Assignment, dispatch workflow, printable forms, archiving, retention, and
`.xlsx` export.