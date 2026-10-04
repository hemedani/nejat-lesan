# Backend task: let org leaders open the report detail page

## Symptom

An `OrgHead` or `UnitHead` opens `/orghead/reports`, sees a populated oversight
console, clicks a row, and lands on a red error box. The same happens on
`/unit-head/reports`. A `Manager` and a `Ghost` see the same pages work.

This is the console's primary audience. Not one of them can open a single row.

## Root cause

The **list** and the **detail** resolve their scope through two different helpers,
and only one of them knows about org leaders.

The list works. `back/src/incident_report/oversight/filters.ts:15-17` says so
explicitly:

> Reuses `getOrgReportBase` rather than `getReportScope`, because `getReportScope`
> handles only Patrol and Manager/Ghost and **throws** for org leaders — which is
> exactly the audience of this console.

The detail does not:

- `back/src/accident/reviewHistory/reviewHistory.fn.ts:4` imports `getReportScope`
  and calls it at line 13.
- `back/src/incident_report/reviewHistory/reviewHistory.fn.ts:4` imports
  `getReportScope` and calls it at line 20.

`getReportScope` ends at `back/src/accident/reportScope.ts:92`:

```ts
throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
```

So for an org leader the history lookup rejects. The frontend had both fetches in
one `Promise.all`, which turned that rejection into a failed page rather than a
missing audit trail — the report itself *is* readable, because
`back/src/accident/get/mod.ts` carries no `grantAccess` at all.

## Frontend state, so you know what this unblocks

The frontend has already been adjusted to degrade honestly, in
`front/src/components/org/`:

- `OrgIncidentDetailView.tsx` fetches the review history separately, with a
  recovery branch that clears the trail rather than failing the page.
- `OversightTable.tsx` exports `canOpenReportDetail(level)` and renders the detail
  link **only** for `Manager` and `Ghost`. For an org leader the row's label is
  shown as plain text.

Once this backend fix lands, `canOpenReportDetail` should return `true` for
everyone and the frontend needs no further change. That predicate is the single
place to flip; nothing else in `front/` encodes the restriction.

## Task

In both files, replace `getReportScope(context.user)` with
`await getOrgReportBase(context.user)`:

- `back/src/accident/reviewHistory/reviewHistory.fn.ts`
- `back/src/incident_report/reviewHistory/reviewHistory.fn.ts`

Update each file's import accordingly. `getOrgReportBase` is `async` and takes an
optional `userId`; `getReportScope` is sync and takes the same optional `userId`.
The surrounding `findOne` is already awaited, so each call site becomes:

```ts
const report = await accident.findOne({
  filters: {
    _id: new ObjectId(reportId as string),
    ...(await getOrgReportBase(context.user)),
  },
  projection: { review_history: 1 },
});
```

### Do not delete `getReportScope`

It has other callers, all of which are Patrol/Manager surfaces that legitimately
want the narrower scope. Confirm this list after your change and report it:

```
back/src/accident/reportScope.ts                        (the definition)
back/src/accident/dashboard/dashboard.fn.ts
back/src/incident_report/dashboard/dashboard.fn.ts
back/src/incident_report/get/get.fn.ts
back/src/incident_report/count/count.fn.ts
back/src/incident_report/gets/gets.fn.ts
back/src/incident_report/oversight/filters.ts           (only mentions it in a comment)
```

`incident_report.get` is `grantAccess({ levels: ["Manager", "Patrol"] })` and
`incident_report.gets` likewise, so those two reject an org leader at the gate
before `getReportScope` is ever consulted. **That is a separate gap** — an org
leader who reaches a report *list* still cannot use those two acts directly —
but fixing it is not this task. Note it in your summary and do not widen their
`grantAccess`.

## Ambiguities — resolve deliberately and say so

1. **Legacy rows carry no `organization` relation.** `getOrgReportBase` scopes org
   leaders by `road._id`, resolved from `organization.road`. The ~52,000 existing
   accidents were filed before that relation existed. Confirm whether the org-leader
   scope still matches them, or say explicitly that it does not.
   `oversight/filters.ts:19-23` claims the scope's `$or` matches both populations —
   verify that against the `accident` collection's actual documents rather than
   taking the comment's word for it.
2. **Zero-road organizations throw.** `getOrgReportBase` throws
   `"شما دسترسی به گزارش‌های این سازمان ندارید"` when an org leader's scope resolves
   to no roads. A *history* request should arguably return an empty list instead,
   so the UI degrades rather than errors. Decide, and state which you chose and why.
3. **Unit granularity.** `getOrgReportBase` takes no `unitId`, so a UnitHead sees
   every report on their organization's road, not just their unit's. That matches
   what the list already does, which is the important part — but confirm it is
   intended rather than an oversight that happens to be consistent.

Do not silently pick. If you cannot determine one of these from the code, implement
the safest reading and flag it explicitly.

## Verification

```bash
cd back && deno check mod.ts    # must be clean
python3 .workbuddy-ai/tools/audit-module-acts.py
```

Then exercise the real flows, because a clean typecheck proves nothing about scope:

1. As an **OrgHead**: `/orghead/reports` lists rows; clicking one opens the detail
   page and the review trail renders. This is the case that fails today.
2. As a **UnitHead**: same, via `/unit-head/reports`.
3. As a **Patrol** officer: `accident.getReportReviewHistory` must still return
   only their own reports' history. `getReportScope` narrowed on `officer._id`;
   `getOrgReportBase` narrows on `officer._id` for Patrol as well, so this must not
   regress — confirm it rather than assuming.
4. As a **Manager** and a **Ghost**: behaviour unchanged.

## Constraints

- **Deno strips types without checking them.** `deno task bc-dev` boots
  successfully with a broken import inside an act body and then throws at runtime
  on the first request that reaches it. A successful boot proves nothing about this
  change; step 1 above is the only real evidence.
- Do not change any act's `validator`, `preAct`, `grantAccess` levels, or
  `set`/`get` shape. `front/` type-checks against the generated declarations, so a
  contract change breaks it silently until regeneration.
- Do not touch `getOrgReportBase`, `getOrgScopedRoadIds`, `isManagerViewer` or
  `isOrgLeaderLevel`. The oversight console already depends on their current
  behaviour, and the demo seed (`back/src/user/seedDemoOrganization/`) depends on
  more besides.
- If you regenerate declarations, use `TYPE_GENERATION=true deno run -A mod.ts`
  and copy the result to `front/src/types/declarations/`. Never hand-edit
  `selectInp.ts`; it is generated.
