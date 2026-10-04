# Backend task: restore lost `resolveFilingOrgId` and finish registering `form_definition` + `incident_report`

## Symptom

`POST /lesan` from the frontend rejects every `form_definition` call:

```
the wants.model key is incorrect we just have these models: vehicle_type, croquis_type,
..., accident_process, announcement
```

`form_definition`, `form_response` and `incident_report` are all absent from that list.
Consequently the generated TypeScript declarations (`back/declarations/selectInp.ts`) have
no `ReqType["main"]["form_definition"]` key, producing **106 type errors** in
`front/src/app/actions/{form_definition,incident_report}/**`.

## Root cause

Acts are registered by `*Setup()` functions called from `functionsSetup()` in
`back/src/mod.ts`. `back/src/mod.ts` previously imported and called 55 setups but **never
imported or called `formDefinitionSetup`**, so all 14 `form_definition` acts existed on disk
as `coreApp.acts.setAct({ schema: "form_definition", ... })` calls that nothing ever invoked.

**This class of bug is invisible to static analysis** — `audit-module-acts.py` counts
`setAct` occurrences textually, so it reported "402 registered acts / OK" both before and
after the fix. Verify by runtime, not by grep.

## Already applied — do NOT redo

These edits are in the working tree. Verify they exist, then leave them alone:

- `back/src/mod.ts` — imports and calls `formDefinitionSetup()`; contains an explanatory
  comment where `incidentReportSetup()` is deliberately not yet wired.
- `back/models/mod.ts` — `export * from "./incident_report.ts";`
- `back/mod.ts` — `incident_reports` imported, and `export const incident_report = incident_reports();`

`deno check mod.ts` run from inside `back/` currently passes with no errors.

## Task 1 — restore `resolveFilingOrgId` (the real blocker)

`back/src/incident_report/add/add.fn.ts:4` imports it:

```ts
import { resolveFilingOrgId } from "../../accident/reportScope.ts";
```

It **does not exist** in `back/src/accident/reportScope.ts`, and it was never committed:

```
git log --all -S "export const resolveFilingOrgId" -- back/src/accident/reportScope.ts
→ no commits
```

Implement it in `back/src/accident/reportScope.ts` (the current file ends at
`getReportScope`; the original was around lines 147-159, ~13 lines).

### Call site — `back/src/incident_report/add/add.fn.ts:129-138`

```ts
const roadRelation = relations.road as { _ids?: ObjectId } | undefined;
const filingOrgId = await resolveFilingOrgId(
  user as unknown as Parameters<typeof resolveFilingOrgId>[0],
  roadRelation?._ids?.toString() ?? null,
);
if (filingOrgId) {
  relations.organization = { _ids: filingOrgId, relatedRelations: {} };
}
```

So: `async`, takes the actor document plus an optional road id string, returns a truthy org
id or a falsy value.

### Documented semantics — these are quoted from committed comments, treat as authoritative

- `back/src/user/seedDemoOrganization/people.ts:245-249`:
  > `resolveFilingOrgId` (`back/src/accident/reportScope.ts:147-159`) سازمان را فقط وقتی
  > برمی‌گرداند که مجموعه‌ی واحدهای مأمور به یک سازمان برسد — It returns an organization
  > **only when the actor's set of units resolves to a single organization.**
- `back/test/seed-demo-organization-test.ts:530-534`:
  > The invariant the whole feature rests on. `resolveFilingOrgId` resolves an organization
  > only when the actor's unit set yields a single org, so an officer in two units would file
  > reports that no console can attribute — and every other assertion here would still pass.
- `people.ts:249-258`: the reverse single relation `user.unit` is written with an
  unconditional `$set` (`generateUpdateFilter` for a single relation), so adding an officer to
  a second unit silently moves `user.unit` while `unit.officers` still lists them in the first.
  `UnitHead` is exempt — `unit.head`'s reverse (`user.headedUnits`) is many-to-many and two
  headed units is legitimate; heads do not file reports, so the helper is never called for them.
- `docs/11-demo-organization-seed.md:283`: "Every officer belongs to exactly one unit,
  deliberately."
- `back/src/user/cleanupDemoSeed/cleanupDemoSeed.fn.ts:204`: `resolveFilingOrgId` can leave
  the organization empty, and those are exactly the rows cleanup targets.

### Ambiguities — resolve deliberately and say so in your summary

1. Does the `roadId` argument participate in resolution (e.g. prefer the road's owning
   organization), or is it accepted and unused? The call site passes it, so it was intended
   to matter — but no comment states how.
2. Which relation is authoritative for "the actor's units": `user.unit`, `unit.officers`, or
   both? Given the drift described in `people.ts`, reading `unit.officers` and intersecting
   is safer than trusting `user.unit`.
3. Behaviour for `Manager` / `Ghost` levels — return their org, or `null`?
4. Should a genuinely ambiguous multi-org officer `throwError`, or return a falsy value? The
   seed-test comment implies falsy (the report files unattributed), but confirm.

Do not silently pick. If you cannot determine one of these from the code, implement the
safest reading and flag it explicitly.

## Task 2 — wire `incidentReportSetup()`

Once Task 1 compiles, in `back/src/mod.ts` replace the placeholder comment with:

```ts
import { incidentReportSetup } from "./incident_report/mod.ts";
// ...
formDefinitionSetup();
incidentReportSetup();
```

`back/src/incident_report/mod.ts` already exports `incidentReportSetup` and calls 12 act
setups. All frontend-facing act names already exist on the backend — do not add acts:

```
add count get getManagerDashboard getManagerReports getMyReports getOversightList
getOversightStats getReporterDashboard getSyncStatus gets remove resubmitReport
reviewHistory reviewReport reviewReports update
```

## Task 3 — module gating (needs a decision, flag it)

`back/src/app_modules/moduleConfig.ts:78-87` defines:

```ts
const INCIDENT_SCHEMAS = [
  "emergency", "shift", "vehicle", "police_station",
  "patrol_unit", "patrol_operations", "accident_process", "announcement",
];
```

Neither `form_definition` nor `incident_report` is listed, so **their acts are currently
ungated** — any caller with authoring rights reaches them even when `incident_patrol` is off.
Note the frontend already hides the `/forms` nav entry behind `requiredModule:
"incident_patrol"`, so UI and API currently disagree.

Decide and implement one of:

- (a) add `form_definition` and `incident_report` to `INCIDENT_SCHEMAS` (gated), or
- (b) leave ungated deliberately, because authoring is an organizational capability rather
  than a patrol capability, and then the frontend nav gate should be relaxed to match.

Also re-check the `INCIDENT_ACCIDENT` list at lines 67-77 against reality while you are
there — `accident.reviewHistory` was previously registered under the wrong name
(`accident.getReportReviewHistory`), and `incident_report.reviewHistory` / `reviewReports`
will need patterns if you choose (a).

## Task 4 — regenerate and verify declarations

```bash
cd back
TYPE_GENERATION=true deno run -A mod.ts
```

Then verify before copying — `ReqType` is keyed by registered acts, so this is the real proof:

```bash
grep -n "form_definition:" back/declarations/selectInp.ts   # expect >=1
grep -n "incident_report:"  back/declarations/selectInp.ts   # expect >=1
```

`grep -c "form_definition:"` returning **0** is the failure signal — the current file
returns 0. Adjust the pattern to whatever indentation the generated file actually uses.

Only once both are present:

```bash
cp back/declarations/selectInp.ts front/src/types/declarations/
cd front && rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit   # expect 0 errors
```

Never hand-edit `selectInp.ts`; it is generated.

## Verification

```bash
cd back && deno check mod.ts                    # must be clean
cd back && deno task bc-dev                     # must boot
python3 .workbuddy-ai/tools/audit-module-acts.py
python3 .workbuddy-ai/tools/audit-frontend-actions.py
cd front && rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit   # expect 0
```

Then exercise the real flows, because a clean typecheck does not prove registration:

1. `POST /lesan` with `model: "form_definition"`, `act: "gets"` → must not return the
   "wants.model key is incorrect" error.
2. As an OrgHead: `/forms` lists forms; create, edit, activate, duplicate.
3. As a Patrol officer with `incident_report` write access: file a non-accident report. This
   is the path that exercises `resolveFilingOrgId` — confirm the resulting document's
   `organization` relation matches the officer's unit's organization.

## Constraints

- **Deno strips types without checking them.** `deno task bc-dev` will boot successfully even
  with a broken import in an act body, and then throw at runtime on the first request that
  reaches it. A successful boot proves nothing about Task 1 — you must exercise step 3 above.
- Do not change any act's `validator`, `preAct`, `grantAccess` levels, or `set`/`get` shape.
  The frontend already type-checks against the generated declarations; changing a contract
  breaks `front/` silently until regeneration.
- `back/models/form_definition.ts` was recently refactored: `incident_type` →
  `form_kind`, plus an `icon` field. Do not revert that.
- Keep `formDefinitionSetup()` wired and working. It is what unblocked the immediate symptom.