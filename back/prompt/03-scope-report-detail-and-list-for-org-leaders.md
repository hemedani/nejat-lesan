# Backend task: scope the report **detail** and **list** acts for org leaders

Supersedes the scope half of `02-fix-review-history-scope-for-org-leaders.md`. That
document remains correct about `reviewHistory`; this one widens the same fix to the
three acts it explicitly deferred, and adds the tenancy hole nobody has written down.
**Read `02-` first** — it holds the root-cause narrative and the ambiguity list. This
document only adds what came after it.

---

## Symptom

An `OrgHead` opens `/orghead/reports`. The oversight console is populated. They click
**مشاهده** on any row.

The button is not a link. `front/src/components/org/OversightTable.tsx:43` reads:

```ts
export const canOpenReportDetail = (level: string | null): boolean =>
  level === "Manager" || level === "Ghost";
```

`RowLink` (same file, line 53) renders an inert `<span>` instead of a `<Link>` when that
predicate is false, so the row's label and its action cell are both plain text. Nothing
is clickable. The same is true for a `UnitHead` on `/unit-head/reports`.

This is not a cosmetic gate. **The org-head and unit-head oversight consoles cannot open
a single one of their own rows.** Every other row on those pages works — filter, stats,
sort, bulk review — which is what makes the dead link read as a broken button rather than
as a missing feature.

The frontend will flip that predicate to admit org leaders as part of the follow-up work.
**It will not work when it does.** Four independent server-side gates stand in the way,
and each one fails differently.

---

## The four gates

### Gate 1 — `incident_report.get` rejects org leaders at the preAct

`back/src/incident_report/get/mod.ts:14`

```ts
preAct: [
  setTokens,
  setUser,
  grantAccess({ levels: ["Manager", "Patrol"] }),
],
```

`grantAccess` (`back/utils/grantAccess.ts:18-30`) compares `user.level` against that
array and calls `throwError("You cant do this")` on a miss. `OrgHead` and `UnitHead` are
valid entries in `user_level_array` (`back/models/user.ts:88-96`) — they are simply absent
from this list. `get.fn` is never reached.

`back/src/incident_report/gets/mod.ts:13` carries the identical list and the identical
problem.

### Gate 2 — `incident_report.get` then throws anyway

`back/src/incident_report/get/get.fn.ts:20`

```ts
const report = await incident_report.findOne({
  filters: {
    _id: new ObjectId(set._id as string),
    ...getReportScope(user),          // ← throws for org leaders
  },
  projection: get,
});
```

`getReportScope` (`back/src/accident/reportScope.ts:94-109`) handles `Patrol` and
`Manager`/`Ghost`, then falls through to:

```ts
throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
```

So fixing gate 1 alone converts a 403 into a 500. **Both are required.** This is the same
asymmetry `02-` documents for `reviewHistory`: the *list* works because
`back/src/incident_report/oversight/filters.ts:26-28` uses `getOrgReportBase`, and the
*detail* does not.

### Gate 3 — `accident.get` is wide open to every authenticated caller

`back/src/accident/get/mod.ts` has **no `preAct` array at all** — no `setTokens`, no
`setUser`, no `grantAccess`:

```ts
export const getSetup = () =>
  coreApp.acts.setAct({
    schema: "accident",
    fn: getFn,
    actName: "get",
    validator: getValidator(),
  });
```

and `get.fn.ts` matches on `_id` alone:

```ts
return await accident.aggregation({
  pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
  projection: get,
}).toArray();
```

Any caller who can reach the endpoint can read **any** accident in the collection by id —
there is no level check and no tenancy check. `front/src/components/org/OrgIncidentDetailView.tsx:52-54`
relies on this today:

> `accident.get` carries no `grantAccess`. So a refused history yields an empty trail.

That comment is accurate, and it is the reason the accident half of the console is one
step from working while the `incident_report` half is four steps away. It is also, read
plainly, a missing authorization check on a records system.

**This is the one gate where the fix is not a widening.** See Task 3.

### Gate 4 — the frontend never reads `?source=`

Not a server bug, but it decides whether your fix is observable, so it is stated here.

`front/src/utils/report-routes.ts:23`

```ts
export function reportDetailHref(base: string, reportId: string, source: string): string {
  return `${base}/reports/${reportId}?source=${source}`;
}
```

`source` is `"accident"` or `"incident_report"`
(`back/src/incident_report/oversight/pipeline.ts:116,132`). It is written into the URL by
four call sites in `OversightTable` and read by **zero** components — grep `?source` across
`front/src` and the only hits are the builder and three comments explaining why it is
there.

`OrgIncidentDetailView.tsx:43` therefore calls `accident.get` unconditionally:

```ts
const reportResponse = await get(reportId, reportDetailProjection as never);
```

An id from the `incident_report` collection is not in `accident`, so the lookup misses. If
you scope `accident.get` (Task 3) this becomes a clean refusal instead of a silent empty
result — which is the correct behaviour, and worth having.

`front/src/app/actions/incident_report/get.ts` (`getIncidentReport`) **already exists**,
is correctly written, and is imported by no component. The frontend follow-up wires it up
and branches on `?source=`. You do not need to touch it — but do not break its request
shape either (see Constraints).

---

## Task 1 — let org leaders through gates 1 and 2

Two files, one change each, and they must land together.

**`back/src/incident_report/get/mod.ts`** — add the two levels to both acts:

```ts
grantAccess({ levels: ["Manager", "Patrol", "OrgHead", "UnitHead"] }),
```

Apply to `get/mod.ts` and `gets/mod.ts`. Do **not** add `Editor` or `Enterprise` — the
oversight console is not theirs, and `02-`'s caller list below is the record of who these
acts are for.

**`back/src/incident_report/get/get.fn.ts`** — swap the scope helper, exactly as `02-`
describes for `reviewHistory`:

```ts
import { getOrgReportBase } from "../../accident/reportScope.ts";
// ...
const report = await incident_report.findOne({
  filters: {
    _id: new ObjectId(set._id as string),
    ...(await getOrgReportBase(user)),
  },
  projection: get,
});
```

`getOrgReportBase` is `async` and returns a `Promise<Record<string, unknown>>`;
`getReportScope` is sync. Both call sites sit inside an already-`async` fn whose `findOne`
is awaited, so the `await` composes with no restructuring. `get.fn.ts:24`'s existing
`throwError("گزارش یافت نشد یا دسترسی ندارید")` stays — with a real scope in the filter it
is now the *only* way this act can fail, and the frontend maps that string to
«گزارش یافت نشد یا دسترسی ندارید» via `getPatrolErrorMessage`
(`front/src/utils/api-response.ts:31`).

`gets/gets.fn.ts:28` has the same `getReportScope` call and the same fix.

### Do not delete `getReportScope`

It keeps three callers after this change, all legitimately narrower. Confirm and report
this list:

```
back/src/accident/reportScope.ts              (the definition)
back/src/accident/dashboard/dashboard.fn.ts:72
back/src/incident_report/dashboard/dashboard.fn.ts:82
```

Those two dashboards are the Patrol "my reports" surfaces, where an org leader genuinely
has no business. `getReportScope` is not dead code after this task; `02-` said the same
about the review-history change.

---

## Task 2 — `reviewHistory` (carry `02-` forward)

`02-` already specifies this precisely. Re-apply and re-verify it:

- `back/src/accident/reviewHistory/reviewHistory.fn.ts:13`
- `back/src/incident_report/reviewHistory/reviewHistory.fn.ts:20`

`getReportScope(context.user)` → `await getOrgReportBase(context.user)`, imports updated.

**One thing `02-` did not anticipate.** `getOrgReportBase` **throws** when an org leader's
scope resolves to zero roads (`reportScope.ts:62-64`):

```ts
if (!roads?.length) {
  throw new Error("شما دسترسی به گزارش‌های این سازمان ندارید");
}
```

`02-` flagged this as ambiguity #2 and left it open. Resolve it now, and resolve it the
same way in all three places (`get`, `gets`, both `reviewHistory` fns):

**Recommended: let it throw on `get`/`gets`, and return `[]` from `reviewHistory`.**

The reasoning: a *report* request should refuse loudly, because the caller asked for a
specific record and did not get it. A *history* request is a sub-resource of a report the
caller can already see — `OrgIncidentDetailView.tsx:59-67` fetches it separately and
degrades to an empty trail on failure, precisely so an org head is not shown a red error
box for a page they reached by legitimate navigation. An organization with no roads has no
reports, so an empty trail is the truthful answer, not a suppression.

State which you chose and why. If you choose differently, say so loudly — the frontend
degrades gracefully either way, but a silent `[]` where a refusal was expected is harder to
diagnose from a screenshot than a thrown message.

---

## Task 3 — decide what `accident.get` should do (gate 3)

**This is a judgement call and I want your explicit reasoning in the summary, not a
silent choice.** Three options, in the order I recommend them:

### Option A — scope it to `getReportScope`, same as `incident_report.get` (recommended)

```ts
preAct: [setTokens, setUser, grantAccess({ levels: ["Manager", "Patrol", "OrgHead", "UnitHead"] })],
```

and in `get.fn.ts`, add the scope to the `$match`:

```ts
const { user } = coreApp.contextFns.getContextModel() as MyContext;
return await accident.aggregation({
  pipeline: [{ $match: { _id: new ObjectId(_id as string), ...getReportScope(user) } }],
  projection: get,
}).toArray();
```

This makes the two models symmetric, which is the whole point: one console, one detail
route, one set of rules. It also means an OrgHead reads an accident row only when
`getReportScope` allows it — but see the caveat below, because for org leaders
`getReportScope` **throws** rather than returning a scope, so Option A as written would
break the org-head accident rows that currently work. The correct Option A is
`getOrgReportBase` in `get.fn.ts` (awaited, inside the `$match`'s enclosing async fn), not
`getReportScope`.

**Read that again before writing it.** The two helpers are not interchangeable here:
`getReportScope` is sync and throws for org leaders; `getOrgReportBase` is async and
handles all four levels. For a fn that must serve org leaders, `getOrgReportBase` is the
only correct choice.

### Option B — leave `accident.get` open, and document it

Add a comment recording that the act is intentionally un-tenanted, and why. Cheapest, and
it keeps the frontend's accident path exactly as it is today.

I do not recommend this. An unauthorized read of a crash record — with victim names,
national codes, insurance numbers and phone numbers in `vehicle_dtos`/`people_dtos` — is
not a defensible default, and "no `preAct` was written" is not the same as "no `preAct` was
wanted."

### Option C — scope it, and treat this as a security fix with its own note

Same code as Option A, but the summary leads with the exposure rather than with the
console, so it lands in a changelog where a reviewer will read it as a vulnerability fix
rather than a feature tweak.

**Pick A or C — they are the same diff.** The only difference is how you report it. Do
not pick B without saying explicitly that you are accepting the exposure.

### The regression you must check for Option A/C

`accident.get` is called from four frontend surfaces
(`front/src/app/patrol/reports/[id]`, `front/src/app/patrol-manager/reports/[id]`,
`front/src/app/employee/reports/[reportId]`, and `OrgIncidentDetailView`). Verify all four
after the change:

1. **Patrol** on `/patrol/reports/[id]` — `getReportScope`/`getOrgReportBase` both narrow to
   `officer._id`, so a Patrol officer must still read only their own report. **This is the
   highest-risk regression in the whole task**: `accident.get` currently has no scope at
   all, so a Patrol officer can today open *any* accident by id. Adding scope will make
   some of those requests start failing. That is the fix working. Confirm no legitimate
   Patrol flow depended on the hole — in particular check whether
   `/employee/reports/[reportId]` (Patrol-gated, unit-scoped) is ever opened for a report
   the officer did not file, e.g. from a notification or a unit roll-up.
2. **Manager** and **Ghost** — unchanged (`getOrgReportBase` returns
   `{"officer.level": "Patrol"}` for both, matching `getReportScope`).
3. **OrgHead** on `/orghead/reports` — accident rows open; non-accident rows stop
   silently missing and start refusing cleanly.
4. **UnitHead** on `/unit-head/reports` — same.

Also grep for any other caller of `accident.get` outside `front/src` — the API playground,
`qa_docs/`, seed scripts. `backend` is a private service with a `PLAYGROUND` flag
(`back/mod.ts:199`), so a human may have been using the gap to inspect records.

---

## Task 4 — the legacy-road question, answered with data this time

`02-` ambiguity #1 asked whether the org-leader scope still matches the ~52,000 legacy
accidents, and said to verify against the collection rather than trust
`oversight/filters.ts:19-23`.

**That verification is now a prerequisite, not a nice-to-have.** Gates 1 and 2 are being
opened on the strength of `getOrgReportBase` matching the same population the list already
shows. If it does not, this change makes the list and the detail disagree — a row visible
in the console whose detail page refuses — which is a worse bug than the dead button.

Write a script (or run it in the playground) against the live database and report the
counts:

```js
// Rows the org-leader scope would match, split by which clause caught them.
db.accident.aggregate([
  { $match: { "officer.level": "Patrol" } },
  { $group: {
      _id: {
        hasOrg:   { $cond: [{ $ne: [{ $type: "$organization._id" }, "missing"] }, true, false] },
        hasRoad:  { $cond: [{ $ne: [{ $type: "$road._id" },      "missing"] }, true, false] },
      },
      n: { $sum: 1 },
  }},
  { $sort: { n: -1 } },
])
```

The four quadrants, and what each one means for the console:

| `hasOrg` | `hasRoad` | Matches the scope? | Reading |
| --- | --- | --- | --- |
| yes | yes | yes, twice | modern app submission that also has a road |
| yes | no | yes, via `organization._id` | the population the `$or` exists for |
| no | yes | yes, via `road._id` | the legacy catalogue |
| no | no | **no** | invisible to every org leader, forever |

If the fourth quadrant holds a large number, say so in the summary and quantify it. The
comment at `reportScope.ts:66-72` claims the two populations are disjoint; the query tells
you whether they are. If the comment is wrong, **fix the comment** and say why — a wrong
comment here is what made this class of bug survive two review cycles.

Then confirm `getOrgScopedRoadIds` (`reportScope.ts:19-35`) resolves correctly for a
`UnitHead`, not just an `OrgHead`. It reads `organization.road` for every org in
`getScopedOrgIds(user)`, and `getScopedOrgIds`
(`back/src/app_modules/orgScope.ts:25-38`) resolves a `unit`-scoped role by looking up
`unit.organization._id`. Trace that path once, end to end, for a user whose only role is
`{ scopeType: "unit", scopeId: <unitId> }`. A `UnitHead` whose scope resolves to zero orgs
gets the zero-roads throw from Task 2 — that is the failure mode to rule out.

---

## Ambiguities — resolve deliberately, then say so

1. **Unit granularity.** `getOrgReportBase` takes no `unitId`, so a `UnitHead` sees every
   report on their organization's road, not just their unit's. This matches what the list
   already does, which is the important part — the console and the detail page must agree.
   Confirm it is intended rather than an oversight that happens to be consistent. If it is
   an oversight, it is **not this task** — fixing it changes what the list shows, which is
   a product decision.
2. **`Editor` and `Enterprise`.** Excluded, on the grounds that the oversight console is
   not theirs. If either has a legitimate need for `incident_report.get`, raise it — do
   not add them silently.
3. **The `Officer` role.** `"Officer"` is a valid `RoleName` but **not** a valid
   `UserLevel` (`back/models/user.ts:88-96`; the front mirrors this in
   `front/src/types/auth.ts:1`). A user with the Officer *role* still has some
   `UserLevel`, and it is that level which `grantAccess` compares. Confirm no
   `grantAccess` change here accidentally reads roles instead of levels.
4. **Module gating.** These acts inherit the `incident_patrol` gate through the
   `incident_report` wildcard in `INCIDENT_SCHEMAS`
   (`back/src/app_modules/moduleConfig.ts:88`). Confirm your edits do not disturb that
   ordering — `moduleKeyFor` returns on the first match, so an ordering change silently
   changes which gate applies.

Do not silently pick. If you cannot determine one of these from the code, implement the
safest reading and flag it explicitly.

---

## Verification

```bash
cd back
deno check mod.ts                        # must be clean
python3 ../.workbuddy-ai/tools/audit-module-acts.py
python3 ../.workbuddy-ai/tools/audit-get-shapes.py
```

Then exercise the real flows. **A clean typecheck proves nothing about scope**, and a
successful boot proves even less — Deno strips types without checking them, so
`deno task bc-dev` boots happily with a broken import inside an act body and throws on the
first request that reaches it.

The frontend half of the button is still disabled while you work, so drive the acts
directly (playground, or `curl` against `POST /lesan` with a `token` header) rather than
expecting the UI to exercise them:

| # | Caller | Expectation |
| --- | --- | --- |
| 1 | OrgHead, `incident_report.get`, own org's report | returns the document |
| 2 | OrgHead, `incident_report.get`, **another** org's report | `گزارش یافت نشد یا دسترسی ندارید` |
| 3 | UnitHead, same two | same as 1–2 |
| 4 | OrgHead, `incident_report.gets` | returns their scoped list |
| 5 | OrgHead, both `reviewHistory` acts | returns the trail (or `[]` — see Task 2) |
| 6 | Patrol, `accident.get` | own report only; **another officer's report must now fail** |
| 7 | Patrol, `accident.getReportReviewHistory` | own reports only (must not regress) |
| 8 | Manager / Ghost, all of the above | unchanged |
| 9 | Editor / Enterprise, `incident_report.get` | still refused at the gate |
| 10 | OrgHead on a **zero-road** org | the Task 2 answer, consistently across all three acts |

Row 6 is the one that will surprise you: it changes from "succeeds" to "fails". That is
the intended effect of Task 3, not a regression — confirm it, and report it as a
behaviour change so the frontend owner can check surface #4 above.

---

## Constraints

- **Do not change any act's `validator`, `set` shape, or `get` shape.** `front/` type-checks
  against the generated declarations in `front/src/types/declarations/selectInp.ts`; a
  contract change breaks it silently until regeneration. The two projection shapes differ
  per model for a real reason — `accident.get`'s validator is `selectStruct("accident", 2)`
  and `incident_report.get`'s is `selectStruct("incident_report", 1)`, and
  `front/src/app/actions/incident_report/get.ts` documents that `accident.get`'s validator
  accepts `serial` and `collision_type` which `incident_report.get` rejects as unknown
  keys. The frontend builds a separate projection per source. Leave both alone.
- **Do not change `grantAccess` levels on any act other than the four named above**
  (`incident_report.get`, `incident_report.gets`, and — only if you take Option A/C —
  `accident.get`).
- **Do not touch `getOrgReportBase`, `getOrgScopedRoadIds`, `isManagerViewer`,
  `isOrgLeaderLevel`, or `getScopedOrgIds`.** The oversight console, the batch review
  action (`oversight/reviewTransition.ts:113-115` already uses `getOrgReportBase`), the
  remove act, and the demo seed all depend on their current behaviour. Task 2 adapts to
  `getOrgReportBase`'s throw; it does not change `getOrgReportBase`.
- **Do not add a new act.** `getOversightList` already returns `source` per row; the
  frontend branches on it. There is no need for a combined "get either model" act, and
  adding one would give the two collections a second, divergent authorization path.
- If you regenerate declarations, use `TYPE_GENERATION=true deno run -A mod.ts` and copy
  the result to `front/src/types/declarations/`. **Never hand-edit `selectInp.ts`.**
- `front/` is off-limits for this task. The frontend changes are specified in the gate
  descriptions above and are a separate piece of work.

---

## Definition of done

- [ ] `incident_report.get` and `gets` admit `OrgHead` + `UnitHead` at the gate **and**
      resolve scope through `getOrgReportBase` — neither alone.
- [ ] Both `reviewHistory` fns resolve scope through `getOrgReportBase`.
- [ ] `accident.get`'s authorization is decided deliberately, Option A/C implemented
      unless you argued for B in writing.
- [ ] The zero-road case behaves identically across all three acts.
- [ ] The legacy-road quadrants are reported as counts, and `filters.ts:19-23` /
      `reportScope.ts:66-72` are corrected if the data contradicts them.
- [ ] `deno check` clean; both audits clean; all ten verification rows exercised and
      reported.
- [ ] Summary states, in this order: what changed, what an org leader can now do that
      they could not before, **what stopped working that used to** (row 6), and every
      ambiguity you resolved along with your reasoning.
