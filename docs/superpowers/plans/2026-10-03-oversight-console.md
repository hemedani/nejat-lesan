# Oversight Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give organization reviewers one filtered, paginated list of accidents and non-accident reports, with bulk review, per-officer and per-app-version oversight, and CSV export.

**Architecture:** One new MongoDB aggregation (`$unionWith` + `$facet`) owned by `incident_report` returns accidents and reports merged, because two separate `gets` acts can never paginate a union coherently. It runs through the **raw** collection driver, not Lesan's `aggregation()`, which auto-appends lookup/project stages that would break the shape. A pure pipeline-builder module keeps the query testable without a database.

**Tech Stack:** Deno + Lesan 0.1.26 (MongoDB 7.0.2 driver), MongoDB aggregation (`$unionWith`, `$facet`, `$addFields`), Superstruct validation, Next.js 15 server actions, React 19.

**Spec:** `docs/superpowers/specs/2026-10-03-oversight-console-design.md`

## Global Constraints

- Backend formatting: tabs, 4-space indent width, 80 line width (`back/deno.json` `fmt`). Frontend: 2-space indent.
- User-facing strings (errors, UI labels, buttons) are Persian.
- **Server-owned columns are never client-writable.** `synced_at`, `review_status`, `reviewed_at`, `completed_at`, `serial`, `report_id`, and the resolved `organization` relation must not appear in any `add`/`update` set schema.
- `organizationId` must never appear in a set schema for `accident.add`, `incident_report.add`, `accident.update`, or `incident_report.update`.
- New acts live under `incident_report` and therefore inherit the `incident_patrol` module gate automatically via the `incident_report.*` wildcard in `INCIDENT_SCHEMAS` (`back/src/app_modules/moduleConfig.ts:78`). Do **not** add them to `INCIDENT_ACCIDENT`.
- Acts that aggregate across collections use `coreApp.odm.getCollection(...).aggregate(...)`. Never `model.aggregation()` for these — it appends lookup/project stages derived from `get`.
- Lesan relation projections use nested objects (`organization: { _id: 1 }`). Dotted paths like `"organization._id"` are rejected at depth 1.
- Single relations take a bare id (`_ids: orgId`); multiple relations take an array (`_ids: [id]`).
- Backend suites share one database and each drops it, so **run test files one at a time**, never as one invocation.
- No new npm dependencies. The frontend has no test runner; frontend pure-function tests use the `.workbuddy-ai/tools/` compile-and-assert convention already established by `panel-routing-test.py`.
- After any backend act change, regenerate declarations and run `python3 .workbuddy-ai/tools/audit-frontend-actions.py`; it must print `OK`.
- Do not commit. The user handles Git.

---

## File Structure

**Backend — new**

| File | Responsibility |
| ---- | -------------- |
| `back/src/incident_report/oversight/filters.ts` | Resolve the caller's scope into a Mongo filter. Pure decision + one org lookup. |
| `back/src/incident_report/oversight/pipeline.ts` | Build the `$unionWith`/`$facet` pipeline from scope + filters. **Pure** — no DB access, fully unit-testable. |
| `back/src/incident_report/oversight/getOversightList/{mod,getOversightList.fn,getOversightList.val}.ts` | The merged list act. |
| `back/src/incident_report/oversight/reviewReports/{mod,reviewReports.fn,reviewReports.val}.ts` | Bulk review with per-id outcomes. |
| `back/src/incident_report/oversight/getOversightStats/{mod,getOversightStats.fn,getOversightStats.val}.ts` | Officer / app-version / aging blocks. |
| `back/src/incident_report/oversight/reviewTransition.ts` | The per-report review transition, extracted from `incident_report/reviewReport/reviewReport.fn.ts` so single and bulk share one state machine. |
| `back/src/incident_report/oversight/mod.ts` | Registers the three acts. |

**Backend — modified**

| File | Change |
| ---- | ------ |
| `back/models/accident.ts` | add optional `synced_at` |
| `back/models/incident_report.ts` | add optional `synced_at` |
| `back/src/accident/update/update.fn.ts` | set `synced_at` on transition to `synced`, once |
| `back/src/incident_report/update/update.fn.ts` | same, plus strip `synced_at` from the body |
| `back/src/incident_report/reviewReport/reviewReport.fn.ts` | delegate to the extracted transition |
| `back/src/incident_report/mod.ts` | register the oversight acts |
| `back/AGENTS.md`, `back/Models.md` | document the three acts, `synced_at`, and the raw-driver rule |

**Frontend — new**

| File | Responsibility |
| ---- | -------------- |
| `front/src/services/reports-csv.ts` | `reportsToCsv(rows): string`. Pure. |
| `front/src/components/org/OversightFilterBar.tsx` | The filter controls. |
| `front/src/components/org/OversightStatsCards.tsx` | Officer / version / aging panels. |
| `front/src/app/actions/incident_report/{getOversightList,reviewReports,getOversightStats}.ts` | Server actions. |

**Frontend — modified**

| File | Change |
| ---- | ------ |
| `front/src/services/report-sources.ts` | add `OversightRow` + `fetchOversightList` |
| `front/src/components/org/OrgReportsView.tsx` | rewrite around the new act |

**Tests**

`back/test/report-sync-timestamp-test.ts`, `back/test/oversight-list-test.ts`,
`back/test/oversight-review-bulk-test.ts`, `back/test/oversight-stats-test.ts`,
`.workbuddy-ai/tools/reports-csv-test.py`.

---

### Task 1: `synced_at` — a factual instant for sync timing

Per-officer "median sync time" is part of the approved oversight value and is not
computable today: there is no timestamp for when a report reached `synced`, and
`updatedAt` keeps moving after later corrections. This adds one optional field and
sets it exactly once.

**Files:**
- Modify: `back/models/accident.ts` (after `rejection_reason`)
- Modify: `back/models/incident_report.ts` (after `rejection_reason`)
- Modify: `back/src/accident/update/update.fn.ts`
- Modify: `back/src/incident_report/update/update.fn.ts`
- Test: `back/test/report-sync-timestamp-test.ts`

**Interfaces:**
- Produces: optional pure field `synced_at: date()` on both models. Server-owned.
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

Create `back/test/report-sync-timestamp-test.ts`. Reuse the harness shape from
`back/test/accident-report-shape-test.ts` — it already has a `runAct` that runs the
act's validator, a `makeToken`, and a `seed fixtures` test enabling all modules.

```ts
/**
 * `synced_at` — the instant a report reached `synced`.
 *
 * It exists because per-officer "median sync time" cannot be derived from
 * anything else: `updatedAt` keeps moving after a correction, and there is no
 * other record of when the control centre actually received a report.
 *
 * The property that matters is that it is written **once**. A second transition
 * to `synced` must not move it, or the median would describe the last correction
 * rather than the submission.
 */

import "./patrol_ops_env.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
  type Document,
  jwt,
  MongoClient,
  ObjectId,
  assert as structAssert,
  create as structCreate,
} from "@deps";
import { accident, coreApp, getAtcsWithServices, incident_report, user } from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
  await jwt.create({ alg: "HS512", typ: "JWT" }, { _id: userId, exp: jwt.getNumericDate(60 * 60) }, jwtTokenKey);

const runAct = async (
  schema: string,
  actName: string,
  details: { set: Document; get: Document },
  userId?: ObjectId,
) => {
  const headers = new Headers();
  if (userId) headers.set("token", await makeToken(userId.toString()));
  coreApp.contextFns.addContexts({ Headers: headers } as never);
  const act = getAtcsWithServices().main[schema][actName];
  assertExists(act, `act ${schema}.${actName} is not registered`);
  for (const pre of act.preAct ?? []) await pre();
  const validated = act.validationRunType === "create"
    ? structCreate(details, act.validator as never)
    : (structAssert(details, act.validator as never), details);
  return await act.fn({ service: "main", model: schema, act: actName, details: validated } as never);
};

/** The failure message the validator produces for an unknown key. */
const rejectionFor = (schema: string, actName: string, set: Document): string => {
  const act = getAtcsWithServices().main[schema][actName];
  assertExists(act);
  try {
    structAssert({ set, get: { _id: 1 } } as Document, act.validator as never);
  } catch (cause) {
    return (cause as Error).message ?? String(cause);
  }
  return "";
};

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;

Deno.test("seed fixtures", async () => {
  ghostId = await user.insertOne({
    doc: {
      first_name: "سرپرست", last_name: "تست", mobile: `0915000${RUN.slice(-4)}`,
      gender: "Male", is_active: true, createdAt: new Date(), updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }).then((r) => r!._id as ObjectId);

  managerId = await user.insertOne({
    doc: {
      first_name: "مدیر", last_name: "تست", mobile: `0915001${RUN.slice(-4)}`,
      gender: "Male", is_active: true, createdAt: new Date(), updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }).then((r) => r!._id as ObjectId);

  patrolId = await user.insertOne({
    doc: {
      first_name: "مأمور", last_name: "تست", mobile: `0915002${RUN.slice(-4)}`,
      gender: "Male", is_active: true, createdAt: new Date(), updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }).then((r) => r!._id as ObjectId);

  const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
  await runAct("app_modules", "setModules", {
    set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
    get: {},
  }, ghostId);
});

const fileAccident = async (uuid: string) =>
  await runAct("accident", "add", {
    set: {
      client_report_uuid: uuid,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      submitted_from: { app_version: "1.4.2", platform: "ios" },
    },
    get: { _id: 1 },
  }, patrolId) as { _id: ObjectId };

const fileReport = async (uuid: string, orgId: ObjectId) =>
  await runAct("incident_report", "add", {
    set: {
      form_definition_id: new ObjectId().toString(),
      client_report_uuid: uuid,
      location: { type: "Point", coordinates: [51.4, 35.7] },
    },
    get: { _id: 1 },
  }, patrolId) as { _id: ObjectId };

Deno.test("synced_at is not set while a report is only queued", async () => {
  const created = await fileAccident(`uuid-${RUN}-queued`);
  const stored = await accident.findOne({
    filters: { _id: created._id },
    projection: { sync_status: 1, synced_at: 1 },
  }) as Record<string, unknown>;
  assertEquals(stored["sync_status"], "queued");
  assertEquals(stored["synced_at"], undefined, "no sync instant before it synced");
});

Deno.test("synced_at is stamped when a manager marks the report synced", async () => {
  const created = await fileAccident(`uuid-${RUN}-synced`);
  await runAct("accident", "update", {
    set: { _id: created._id.toString(), sync_status: "synced" },
    get: { _id: 1 },
  }, managerId);

  const stored = await accident.findOne({
    filters: { _id: created._id },
    projection: { sync_status: 1, synced_at: 1 },
  }) as Record<string, unknown>;
  assertEquals(stored["sync_status"], "synced");
  assert(stored["synced_at"] instanceof Date, "the sync instant is recorded");
});

Deno.test("synced_at is never rewritten by a later synced-to-synced update", async () => {
  const created = await fileAccident(`uuid-${RUN}-twice`);
  await runAct("accident", "update", {
    set: { _id: created._id.toString(), sync_status: "synced" },
    get: { _id: 1 },
  }, managerId);

  const first = await accident.findOne({
    filters: { _id: created._id },
    projection: { synced_at: 1 },
  }) as { synced_at?: Date };
  const original = first.synced_at;

  await runAct("accident", "update", {
    set: { _id: created._id.toString(), sync_status: "synced" },
    get: { _id: 1 },
  }, managerId);

  const second = await accident.findOne({
    filters: { _id: created._id },
    projection: { synced_at: 1 },
  }) as { synced_at?: Date };

  assertEquals(
    second.synced_at?.getTime(),
    original?.getTime(),
    "the instant describes the first sync, not the last correction",
  );
});

Deno.test("a client cannot set synced_at directly", async () => {
  // Server-owned: if this were writable, an officer could forge a sync instant and
  // make the median meaningless.
  const created = await fileAccident(`uuid-${RUN}-forge`);
  const rejection = rejectionFor("accident", "update", {
    _id: created._id.toString(),
    synced_at: new Date().toISOString(),
  });
  assert(
    rejection.includes("synced_at"),
    `expected synced_at to be rejected as a client input, got: ${rejection}`,
  );
});

Deno.test("incident_report records synced_at the same way", async () => {
  const orgId = (await import("../mod.ts")).organization;
  const created = await fileReport(`uuid-${RUN}-report`, new ObjectId());
  await incident_report.findOneAndUpdate({
    filter: { _id: created._id },
    update: { $set: { sync_status: "queued", review_status: "submitted" } },
    projection: { _id: 1 },
  });

  await runAct("incident_report", "update", {
    set: {
      _id: created._id.toString(),
      form_definition_id: new ObjectId().toString(),
      client_report_uuid: `uuid-${RUN}-report`,
      sync_status: "synced",
    },
    get: { _id: 1 },
  }, managerId);

  const stored = await incident_report.findOne({
    filters: { _id: created._id },
    projection: { synced_at: 1 },
  }) as { synced_at?: Date };
  assert(stored.synced_at instanceof Date, "reports record the same instant");
});

Deno.test("cleanup test database", async () => {
  const client = await new MongoClient(
    Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
  ).connect();
  const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
  for (const c of await db.listCollections().toArray()) await db.collection(c.name).drop();
  await client.close();
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd back && deno test -A test/report-sync-timestamp-test.ts`
Expected: FAIL — the `synced_at` assertions fail because no code sets the field yet.

- [ ] **Step 3: Add the field to both models**

In `back/models/accident.ts`, immediately after `rejection_reason`:

```ts
	// The instant this report reached `synced`, written once and never rewritten.
	// Per-officer "median sync time" in the oversight console depends on it, and
	// nothing else records it: `updatedAt` keeps moving after a correction.
	// Server-owned — never a client input.
	synced_at: optional(date()),
```

In `back/models/incident_report.ts`, immediately after `rejection_reason`, the same
block with the same comment.

Also add the aging indexes the console's status filters depend on. In
`back/models/accident.ts`, inside `accidents()`, after the
`{ client_report_uuid: 1 }` index:

```ts
	// Aging and status filters inside the oversight console's union branch.
	coreApp.odm.getCollection("accident").createIndex(
		{ sync_status: 1, date_of_accident: -1 },
		{ name: "sync_dateOfAccident" },
	);
```

And in `back/models/incident_report.ts`, after the
`{ sync_status: 1, "officer._id": 1 }` index:

```ts
	// Aging and status filters for the oversight console.
	collection.createIndex(
		{ sync_status: 1, reported_at: -1 },
		{ name: "sync_reportedAt" },
	);
```

- [ ] **Step 4: Stamp it in `accident.update`**

In `back/src/accident/update/update.fn.ts`, in the Manager/Ghost branch of the sync
transition block, widen the existing projection and remember the current value:

```ts
			const existing = await accident.findOne({
				filters: filter,
				projection: { sync_status: 1, synced_at: 1 },
			});
			if (existing) {
				const currentStatus = existing.sync_status;
				alreadySyncedAt = existing.synced_at as Date | undefined;
```

Declare `let alreadySyncedAt: Date | undefined;` immediately before the
`if (fields.sync_status !== undefined) {` block. Then, where `updateObj` is built:

```ts
	const updateObj: Record<string, unknown> = { updatedAt: new Date() };
	for (const key in fields) {
		if (fields[key] !== undefined) updateObj[key] = fields[key];
	}
	// The sync instant is a fact about the first transition to `synced`. Set it
	// here rather than accepting it as input, so it cannot be forged or rewritten.
	if (fields.sync_status === "synced" && !alreadySyncedAt) {
		updateObj.synced_at = new Date();
	}
```

- [ ] **Step 5: Stamp it in `incident_report.update`**

In `back/src/incident_report/update/update.fn.ts`:

1. Widen the `findOne` projection to `{ _id: 1, sync_status: 1, review_status: 1, synced_at: 1 }`.
2. Add `"synced_at"` to the array of keys deleted from `body_` (defence in depth —
   it is not in the set schema, so this only guards a future edit).
3. After the `updateObj` build loop:

```ts
	// First transition to `synced` records the instant; later corrections leave it.
	if (body_.sync_status === "synced" && !current.synced_at) {
		updateObj.synced_at = new Date();
	}
```

and widen the `current` type to include `synced_at?: Date`.

- [ ] **Step 6: Run the test and confirm it passes**

Run: `cd back && deno test -A test/report-sync-timestamp-test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Run the neighbouring suites**

Run:
```bash
cd back
for f in test/accident-report-shape-test.ts test/incident-report-test.ts; do deno test -A "$f"; done
```
Expected: PASS — `accident.update` changed, so both suites must still be green.

---

### Task 2: `getOversightList` — the merged, filtered, paginated list

Replaces the broken console query. Three modules: scope resolution, a pure
pipeline builder, and the act.

**Files:**
- Create: `back/src/incident_report/oversight/filters.ts`
- Create: `back/src/incident_report/oversight/pipeline.ts`
- Create: `back/src/incident_report/oversight/getOversightList/mod.ts`
- Create: `back/src/incident_report/oversight/getOversightList/getOversightList.fn.ts`
- Create: `back/src/incident_report/oversight/getOversightList/getOversightList.val.ts`
- Create: `back/src/incident_report/oversight/mod.ts`
- Modify: `back/src/incident_report/mod.ts`
- Test: `back/test/oversight-list-test.ts`

**Interfaces:**
- Consumes: `getOrgReportBase`, `isManagerViewer`, `isOrgLeaderLevel` from `back/src/accident/reportScope.ts`; `resolveFilingOrgId` is **not** used here.
- Produces:
  - `OversightFilters` type and `resolveOversightScope(actor, organizationId?) => Promise<Record<string, unknown>>`
  - `buildOversightPipeline({ scope, filters }) => Document[]`
  - `ROW_PROJECTION: Document`
  - act `incident_report.getOversightList({ set }) => { rows, total }`

- [ ] **Step 1: Write the failing pure-pipeline test**

Create `back/test/oversight-list-test.ts`. Start with the pure builder, which needs
no database fixtures:

```ts
/**
 * `getOversightList` — the merged accident + report list the org console uses.
 *
 * Split into two halves on purpose. `buildOversightPipeline` is pure, so the
 * query shape is asserted here without a database. The act half below then proves
 * the scope and pagination behave against real documents.
 */

import "./patrol_ops_env.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, ObjectId } from "@deps";
import { buildOversightPipeline } from "../src/incident_report/oversight/pipeline.ts";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const SCOPE = { "officer.level": "Patrol" };
const NO_FILTERS = { page: 1, limit: 25 };

const findStage = (pipeline: Document[], operator: string) =>
  pipeline.find((stage) => operator in stage) as Record<string, unknown> | undefined;

Deno.test("pipeline unions accident into incident_report", () => {
  const pipeline = buildOversightPipeline({ scope: SCOPE, filters: NO_FILTERS });
  const union = findStage(pipeline, "$unionWith") as { coll: string };
  assertEquals(union.coll, "accident", "accidents are pulled into the report stream");
});

Deno.test("each branch normalizes onto the same sort field before the union", () => {
  // One sort across two collections only works if both branches expose the same
  // field name, which is why sort_at is set inside each branch rather than after.
  const pipeline = buildOversightPipeline({ scope: SCOPE, filters: NO_FILTERS });
  const outerAddFields = pipeline.find((stage) => "$addFields" in stage) as
    | { $addFields: { sort_at: Document } }
    | undefined;
  const union = findStage(pipeline, "$unionWith") as {
    pipeline: Document[];
  };

  assert(outerAddFields?.$addFields.sort_at, "the report branch sets sort_at");
  const accidentAddFields = union.pipeline.find((stage) => "$addFields" in stage) as
    | { $addFields: { sort_at: Document } }
    | undefined;
  assert(accidentAddFields?.$addFields.sort_at, "the accident branch sets sort_at too");
});

Deno.test("scope and the shared filters are ANDed, never merged into one $or", () => {
  // Both the scope and a text search want $or. Merging them would silently drop
  // one, so the top-level match wraps both in $and.
  const pipeline = buildOversightPipeline({
    scope: { "officer.level": "Patrol", $or: [{ "road._id": "r" }] },
    filters: { ...NO_FILTERS, search: "پل" },
  });
  const match = pipeline.find(
    (stage) => "$match" in stage && (stage as { $match: Document }).$match?.$and,
  ) as { $match: { $and: Document[] } } | undefined;

  assertExists(match, "a combined $and match exists");
  assertEquals(match!.$match.$and.length, 2, "scope and filters are both present");
  const orClauses = match!.$match.$and.filter((clause) => "$or" in clause);
  assertEquals(orClauses.length, 2, "both $or groups survive independently");
});

Deno.test("groupKeys decides which side of the union is searched", () => {
  const formId = new ObjectId().toString();

  const reportsOnly = buildOversightPipeline({
    scope: SCOPE,
    filters: { ...NO_FILTERS, groupKeys: [formId] },
  });
  const accidentStage = (findStage(reportsOnly, "$unionWith") as { pipeline: Document[] })
    .pipeline[0] as { $match: Document };
  assertEquals(
    (accidentStage.$match as { _id: Document })._id,
    { $in: [] },
    "an accident form filter matches no accidents, rather than matching all",
  );

  const accidentsOnly = buildOversightPipeline({
    scope: SCOPE,
    filters: { ...NO_FILTERS, groupKeys: ["accident"] },
  });
  const reportStage = accidentsOnly[0] as { $match: Document };
  assertEquals(
    (reportStage.$match as { form_definition_id: Document }).form_definition_id,
    { $in: [] },
    "an accident-only filter matches no reports",
  );
});

Deno.test("no groupKeys leaves both sides open", () => {
  const pipeline = buildOversightPipeline({ scope: SCOPE, filters: NO_FILTERS });
  const reportStage = pipeline[0] as { $match: Document };
  assertEquals(Object.keys(reportStage.$match).length, 0, "no branch filter");
});

Deno.test("date range, status, officer and version filters land on the shared match", () => {
  const pipeline = buildOversightPipeline({
    scope: SCOPE,
    filters: {
      ...NO_FILTERS,
      dateFrom: "2026-09-01",
      dateTo: "2026-10-03",
      syncStatus: ["queued", "rejected"],
      reviewStatus: ["returned"],
      officerIds: [new ObjectId().toString()],
      appVersions: ["1.4.2"],
    },
  });
  const match = (findStage(pipeline, "$match") as { $match: { $and: Document[] } }).$match;
  const shared = match.$and[1] as Record<string, unknown>;

  assert(shared["sync_status"], "sync status filter");
  assert(shared["review_status"], "review status filter");
  assert(shared["officer._id"], "officer filter");
  assert(shared["submitted_from.app_version"], "app version filter");
  const sortAt = shared["sort_at"] as { $gte: Date; $lte: Date };
  assert(sortAt.$gte instanceof Date, "the date range is a real Date, not a string");
  assertEquals(sortAt.$gte.toISOString().slice(0, 10), "2026-09-01");
});

Deno.test("dateTo covers the whole day", () => {
  const pipeline = buildOversightPipeline({
    scope: SCOPE,
    filters: { ...NO_FILTERS, dateFrom: "2026-10-03", dateTo: "2026-10-03" },
  });
  const match = (findStage(pipeline, "$match") as { $match: { $and: Document[] } }).$match;
  const { $lte } = (match.$and[1] as { sort_at: { $lte: Date } }).sort_at;
  assertEquals($lte.toISOString().slice(0, 10), "2026-10-03", "same-day range is not empty");
  assert($lte.getUTCHours() > 0, "the end of the day is included, not midnight");
});

Deno.test("unlinkedOnly excludes linked rows and includes unlinked ones", () => {
  const pipeline = buildOversightPipeline({
    scope: SCOPE,
    filters: { ...NO_FILTERS, unlinkedOnly: true },
  });
  const match = (findStage(pipeline, "$match") as { $match: { $and: Document[] } }).$match;
  const shared = JSON.stringify(match.$and[1]);
  assert(shared.includes("$exists"), "a missing organization is covered");
  assert(shared.includes("organization"), "an explicit null is covered too");
});

Deno.test("pagination is applied inside the rows facet, and total is counted separately", () => {
  const pipeline = buildOversightPipeline({
    scope: SCOPE,
    filters: { page: 3, limit: 25 },
  });
  const facet = findStage(pipeline, "$facet") as {
    $facet: { rows: Document[]; total: Document[] };
  };
  assertEquals(facet.$facet.total, [{ $count: "n" }], "total counts the whole match");
  assertEquals(
    (facet.$facet.rows.find((s) => "$skip" in s) as { $skip: number }).$skip,
    50,
    "page 3 of 25 skips 50",
  );
  assert(facet.$facet.rows.some((s) => "$sort" in s), "sorted before slicing");
});

Deno.test("rows are projected down, so a full officer document is not returned", () => {
  const pipeline = buildOversightPipeline({ scope: SCOPE, filters: NO_FILTERS });
  const facet = findStage(pipeline, "$facet") as { $facet: { rows: Document[] } };
  const project = facet.$facet.rows.find((s) => "$project" in s) as {
    $project: Document;
  };
  assert(project.$project["officer.first_name"], "only the fields the console renders");
  assert(!("officer" in project.$project), "not the whole officer relation");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd back && deno test -A test/oversight-list-test.ts`
Expected: FAIL — cannot resolve `../src/incident_report/oversight/pipeline.ts`.

- [ ] **Step 3: Write the pure pipeline builder**

Create `back/src/incident_report/oversight/pipeline.ts`:

```ts
import { type Document, ObjectId } from "@deps";

/** The filters the oversight console can combine. */
export type OversightFilters = {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  /** `accident`, or one or more `form_definition_id` values. */
  groupKeys?: string[];
  syncStatus?: string[];
  reviewStatus?: string[];
  officerIds?: string[];
  appVersions?: string[];
  unlinkedOnly?: boolean;
  search?: string;
};

/** The synthetic key the accident branch carries, matching the console's grouping. */
export const ACCIDENT_GROUP_KEY = "accident";

/**
 * Only what the console renders. Without this the embedded `officer` and `road`
 * relations would come back whole — each officer's full user document per row.
 */
export const ROW_PROJECTION: Document = {
  _id: 1,
  report_id: 1,
  source: 1,
  sort_at: 1,
  group_key: 1,
  group_title: 1,
  group_icon: 1,
  sync_status: 1,
  rejection_reason: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  location: 1,
  kilometer: 1,
  meter: 1,
  description: 1,
  submitted_from: 1,
  serial: 1,
  "organization._id": 1,
  "officer._id": 1,
  "officer.first_name": 1,
  "officer.last_name": 1,
  "officer.personnel_code": 1,
  "patrol_unit._id": 1,
  "patrol_unit.name": 1,
  "road._id": 1,
  "road.name": 1,
  "form_definition_id": 1,
  "type._id": 1,
  "type.name": 1,
  "incident_severity._id": 1,
  "incident_severity.name": 1,
};

const ids = (values: string[]): ObjectId[] =>
  values.filter((value) => ObjectId.isValid(value)).map((value) => new ObjectId(value));

/** `{ $in: [] }` matches nothing — the sentinel that disables one branch. */
const matchNothing = { _id: { $in: [] as ObjectId[] } };

const REPORT_SHAPE: Document = {
  sort_at: { $ifNull: ["$reported_at", "$createdAt"] },
  source: "incident_report",
  // A report always has a form, but `$toString` on a missing value errors, so the
  // conditional keeps a hand-inserted legacy row from failing the whole pipeline.
  group_key: {
    $cond: [
      { $ifNull: ["$form_definition_id", false] },
      { $toString: "$form_definition_id" },
      null,
    ],
  },
  group_title: { $ifNull: ["$form_title", null] },
  group_icon: { $ifNull: ["$form_icon", null] },
};

const ACCIDENT_SHAPE: Document = {
  sort_at: { $ifNull: ["$date_of_accident", "$createdAt"] },
  source: "accident",
  group_key: ACCIDENT_GROUP_KEY,
  group_title: "تصادف",
  group_icon: null,
};

/** Filters that differ per collection, because the fields differ. */
const branchMatches = (filters: OversightFilters) => {
  const { groupKeys } = filters;
  const reportMatch: Document = {};
  const accidentMatch: Document = {};

  if (groupKeys?.length) {
    const formIds = groupKeys.filter((key) => key !== ACCIDENT_GROUP_KEY);
    const wantsAccidents = groupKeys.includes(ACCIDENT_GROUP_KEY);

    if (formIds.length) {
      reportMatch["form_definition_id"] = { $in: ids(formIds) };
    } else {
      Object.assign(reportMatch, matchNothing);
    }

    if (wantsAccidents) {
      Object.assign(accidentMatch, {});
    } else {
      Object.assign(accidentMatch, matchNothing);
    }
  }

  return { reportMatch, accidentMatch };
};

/** Filters both collections share, applied once after the union. */
const sharedMatch = (filters: OversightFilters): Document => {
  const match: Document = {};

  if (filters.syncStatus?.length) match["sync_status"] = { $in: filters.syncStatus };
  if (filters.reviewStatus?.length) match["review_status"] = { $in: filters.reviewStatus };
  if (filters.officerIds?.length) match["officer._id"] = { $in: ids(filters.officerIds) };
  if (filters.appVersions?.length) {
    match["submitted_from.app_version"] = { $in: filters.appVersions };
  }

  if (filters.dateFrom || filters.dateTo) {
    const range: Document = {};
    if (filters.dateFrom) range.$gte = new Date(filters.dateFrom);
    // A bare `new Date(dateTo)` is midnight, which would silently exclude every
    // report later that same day.
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setUTCHours(23, 59, 59, 999);
      range.$lte = end;
    }
    match["sort_at"] = range;
  }

  if (filters.unlinkedOnly) {
    match.$or = [
      { organization: { $exists: false } },
      { organization: null },
      { "organization._id": { $exists: false } },
      { "organization._id": null },
    ];
  }

  if (filters.search?.trim()) {
    const pattern = { $regex: filters.search.trim(), $options: "i" };
    match.$or = [
      { report_id: pattern },
      { description: pattern },
      { group_title: pattern },
    ];
  }

  return match;
};

/**
 * Build the merged query.
 *
 * `$unionWith` rather than two `gets` acts because pagination of a union cannot be
 * assembled from two independent `page`/`limit` queries — `total` would be wrong
 * and pages would overlap.
 *
 * The scope and the shared filters are combined with `$and`, never merged into one
 * `$or`: both may legitimately contain a `$or`, and a single object cannot hold two
 * keys of the same name.
 */
export const buildOversightPipeline = ({
  scope,
  filters,
}: {
  scope: Document;
  filters: OversightFilters;
}): Document[] => {
  const { reportMatch, accidentMatch } = branchMatches(filters);
  const skip = Math.max(0, (filters.page - 1) * filters.limit);

  return [
    { $match: reportMatch },
    { $addFields: REPORT_SHAPE },
    {
      $unionWith: {
        coll: "accident",
        pipeline: [{ $match: accidentMatch }, { $addFields: ACCIDENT_SHAPE }],
      },
    },
    { $match: { $and: [scope, sharedMatch(filters)] } },
    {
      $facet: {
        rows: [
          { $sort: { sort_at: -1, _id: -1 } },
          { $skip: skip },
          { $limit: filters.limit },
          { $project: ROW_PROJECTION },
        ],
        total: [{ $count: "n" }],
      },
    },
  ];
};
```

- [ ] **Step 4: Run the pure tests and confirm they pass**

Run: `cd back && deno test -A test/oversight-list-test.ts`
Expected: the nine pure tests PASS (the act tests added in Step 5 will fail until the act exists).

- [ ] **Step 5: Add the act-level tests**

Append to `back/test/oversight-list-test.ts` — fixtures plus behavioural cases:

```ts
// ---------------------------------------------------------------------------
// Act behaviour, against real documents
// ---------------------------------------------------------------------------

import {
  assert as structAssert,
  create as structCreate,
  jwt,
  MongoClient,
} from "@deps";
import {
  coreApp,
  getAtcsWithServices,
  organization,
  road,
  unit,
  user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const makeToken = async (userId: string) =>
  await jwt.create(
    { alg: "HS512", typ: "JWT" },
    { _id: userId, exp: jwt.getNumericDate(60 * 60) },
    jwtTokenKey,
  );

const listReports = async (set: Document, userId?: ObjectId) => {
  const headers = new Headers();
  if (userId) headers.set("token", await makeToken(userId.toString()));
  coreApp.contextFns.addContexts({ Headers: headers } as never);
  const act = getAtcsWithServices().main["incident_report"]["getOversightList"];
  assertExists(act, "incident_report.getOversightList is registered");
  for (const pre of act.preAct ?? []) await pre();
  const details = { set, get: {} };
  const validated = act.validationRunType === "create"
    ? structCreate(details as Document, act.validator as never)
    : (structAssert(details as Document, act.validator as never), details);
  return await act.fn({
    service: "main",
    model: "incident_report",
    act: "getOversightList",
    details: validated,
  } as never) as { rows: Array<Record<string, unknown>>; total: number };
};

let ghostId: ObjectId;
let managerId: ObjectId;
let orgA: ObjectId;
let roadA: ObjectId;
let orgHeadA: ObjectId;
let orgB: ObjectId;
let orgHeadB: ObjectId;
let officerA: ObjectId;

let seq = 0;
const orgRole = (orgId: ObjectId, name: string) => ({
  roleId: String(orgId),
  name,
  scopeType: "organization",
  scopeId: String(orgId),
});

const insertUser = async (level: string, roles: Array<Record<string, unknown>> = []) => {
  seq++;
  return (await user.insertOne({
    doc: {
      first_name: `نام${seq}`,
      last_name: `خانوادگی${seq}`,
      mobile: `0915${String(70000000 + seq)}`,
      gender: "Male",
      level,
      is_active: true,
      roles,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;
};

const insertOrg = async (name: string, withRoad: boolean) => {
  seq++;
  const created = (await organization.insertOne({
    doc: {
      code: `OV${RUN}-${seq}`,
      name,
      description: "",
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;

  let roadId: ObjectId | undefined;
  if (withRoad) {
    roadId = (await road.insertOne({
      doc: {
        name: `جاده ${seq}`,
        registrer: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      relations: { organization: { _ids: created } },
      projection: { _id: 1 },
    }))!._id as ObjectId;
  }
  return { orgId: created, roadId };
};

Deno.test("oversight fixtures", async () => {
  ghostId = await insertUser("Ghost");
  managerId = await insertUser("Manager");

  const a = await insertOrg(`سازمان الف ${RUN}`, true);
  orgA = a.orgId;
  roadA = a.roadId as ObjectId;
  orgHeadA = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
  officerA = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
  await unit.insertOne({
    doc: { name: `واحد الف ${RUN}`, createdAt: new Date(), updatedAt: new Date() },
    relations: {
      organization: { _ids: orgA, relatedRelations: { units: true } },
      officers: { _ids: [officerA] },
    },
    projection: { _id: 1 },
  });

  const b = await insertOrg(`سازمان ب ${RUN}`, true);
  orgB = b.orgId;
  orgHeadB = await insertUser("OrgHead", [orgRole(orgB, "OrgHead")]);

  const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
  await listReports({ page: 1, limit: 1 }, ghostId);
  await runModules(ghostId);
});

const runModules = async (id: ObjectId) => {
  const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
  const headers = new Headers();
  headers.set("token", await makeToken(id.toString()));
  coreApp.contextFns.addContexts({ Headers: headers } as never);
  const act = getAtcsWithServices().main["app_modules"]["setModules"];
  assertExists(act);
  for (const pre of act.preAct ?? []) await pre();
  const details = {
    set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
    get: {},
  };
  const validated = structCreate(details as Document, act.validator as never);
  await act.fn({
    service: "main",
    model: "app_modules",
    act: "setModules",
    details: validated,
  } as never);
};

/** An accident linked to an org (as the app would file it). */
const seedLinkedAccident = async (label: string, targetOrg: ObjectId) => {
  const created = (await accident.insertOne({
    doc: {
      seri: ++seq,
      serial: ++seq,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      date_of_accident: new Date(),
      sync_status: "synced",
      review_status: "submitted",
      submitted_from: { app_version: "1.4.2", platform: "ios" },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: {
      organization: { _ids: targetOrg },
      officer: { _ids: officerA },
      road: { _ids: roadA },
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;
  return { _id: created, source: "accident", group_title: label } as Record<string, unknown>;
};

/** An accident with no organization at all — the shape of a legacy row. */
const seedLegacyAccident = async (label: string) => {
  const created = (await accident.insertOne({
    doc: {
      seri: ++seq,
      serial: ++seq,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      date_of_accident: new Date(),
      sync_status: "synced",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: { road: { _ids: roadA } },
    projection: { _id: 1 },
  }))!._id as ObjectId;
  return { _id: created, source: "accident", group_title: label } as Record<string, unknown>;
};

Deno.test("oversight list merges both collections for the caller's organization", async () => {
  const linked = await seedLinkedAccident("linked", orgA);
  const legacy = await seedLegacyAccident("legacy");

  const { rows, total } = await listReports({ page: 1, limit: 50 }, orgHeadA);
  const ids = rows.map((row) => String(row["_id"]));

  assert(ids.includes(String(linked._id)), "an org-linked accident appears");
  assert(
    ids.includes(String(legacy._id)),
    "a legacy accident with no organization still appears, via the road clause",
  );
  assert(total >= 2, "total counts the union, not one collection");
});

Deno.test("oversight list does not leak another organization's reports", async () => {
  const mine = await seedLinkedAccident("mine", orgA);
  await seedLinkedAccident("theirs", orgB);

  const { rows } = await listReports({ page: 1, limit: 50 }, orgHeadA);
  const ids = rows.map((row) => String(row["_id"]));
  assert(ids.includes(String(mine._id)));
  assert(
    rows.every((row) => {
      const org = row["organization"] as { _id?: string } | undefined;
      return !org?._id || String(org._id) === String(orgA);
    }),
    "every returned row belongs to the caller's organization",
  );
});

Deno.test("an org head cannot widen scope by naming another organization", async () => {
  await seedLinkedAccident("mine", orgA);
  await seedLinkedAccident("theirs", orgB);

  const { rows } = await listReports(
    { page: 1, limit: 50, organizationId: String(orgB) },
    orgHeadA,
  );
  const orgs = rows
    .map((row) => (row["organization"] as { _id?: string } | undefined)?._id)
    .filter(Boolean)
    .map(String);
  assert(
    orgs.every((id) => id === String(orgA)),
    "the parameter is ignored; the caller's own scope applies",
  );
});

Deno.test("pagination neither overlaps nor skips across a union", async () => {
  for (let index = 0; index < 6; index++) await seedLinkedAccident(`page-${index}`, orgA);

  const first = await listReports({ page: 1, limit: 3 }, orgHeadA);
  const second = await listReports({ page: 2, limit: 3 }, orgHeadA);

  const firstIds = first.rows.map((row) => String(row["_id"]));
  const secondIds = second.rows.map((row) => String(row["_id"]));
  assertEquals(firstIds.length, 3);
  assertEquals(secondIds.length, 3);
  assert(
    firstIds.every((id) => !secondIds.includes(id)),
    "pages do not repeat a row",
  );
  assertEquals(
    first.total,
    second.total,
    "total is the size of the whole match, not of one page",
  );
});

Deno.test("unlinkedOnly returns only rows with no organization", async () => {
  const linked = await seedLinkedAccident("has-org", orgA);
  const legacy = await seedLegacyAccident("no-org");

  const { rows } = await listReports(
    { page: 1, limit: 50, unlinkedOnly: true },
    orgHeadA,
  );
  const ids = rows.map((row) => String(row["_id"]));

  assert(ids.includes(String(legacy._id)), "the unlinked row is returned");
  assert(!ids.includes(String(linked._id)), "the linked row is excluded");
});

Deno.test("sync status and app version filter the merged list", async () => {
  await seedLinkedAccident("v142", orgA);

  const byVersion = await listReports(
    { page: 1, limit: 50, appVersions: ["1.4.2"] },
    orgHeadA,
  );
  assert(
    byVersion.rows.every((row) =>
      (row["submitted_from"] as { app_version?: string } | undefined)?.app_version ===
        "1.4.2"
    ),
    "only that build comes back",
  );

  const queued = await listReports(
    { page: 1, limit: 50, syncStatus: ["queued"] },
    orgHeadA,
  );
  assert(
    queued.rows.every((row) => row["sync_status"] === "queued"),
    "only queued rows come back",
  );
});

Deno.test("rows carry provenance so the console needs no second request", async () => {
  const linked = await seedLinkedAccident("prov", orgA);
  const { rows } = await listReports({ page: 1, limit: 50 }, orgHeadA);
  const row = rows.find((candidate) => String(candidate["_id"]) === String(linked._id));
  assertExists(row);
  assertEquals(
    (row!["submitted_from"] as { app_version?: string }).app_version,
    "1.4.2",
  );
  assertEquals((row!["officer"] as { _id?: string } | undefined)?._id, String(officerA));
});

Deno.test("cleanup oversight database", async () => {
  const client = await new MongoClient(
    Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
  ).connect();
  const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
  for (const c of await db.listCollections().toArray()) await db.collection(c.name).drop();
  await client.close();
});
```

Add `accident` to the `../mod.ts` import list at the top of the file.

- [ ] **Step 6: Run and confirm the act tests fail**

Run: `cd back && deno test -A test/oversight-list-test.ts`
Expected: FAIL — `incident_report.getOversightList` is not registered.

- [ ] **Step 7: Write the scope resolver**

Create `back/src/incident_report/oversight/filters.ts`:

```ts
import { ObjectId } from "@deps";
import { organization } from "../../../mod.ts";
import type { MyContext } from "@lib";
import {
  getOrgReportBase,
  isManagerViewer,
  isOrgLeaderLevel,
} from "../../accident/reportScope.ts";

type ActorUser = MyContext["user"];

/**
 * The server-enforced scope for the oversight console.
 *
 * Reuses `getOrgReportBase` rather than `getReportScope`, because `getReportScope`
 * handles only Patrol and Manager/Ghost and **throws** for org leaders — which is
 * exactly the audience of this console.
 *
 * `organizationId` is deliberately ignored for org leaders. Narrowing on
 * `organization._id` would AND the filter and hide every legacy record, since those
 * carry no organization at all; the scope's `$or` already matches both populations.
 */
export const resolveOversightScope = async (
  actor: ActorUser,
  organizationId?: string,
): Promise<Record<string, unknown>> => {
  if (isOrgLeaderLevel(actor.level)) {
    return await getOrgReportBase(actor);
  }

  if (isManagerViewer(actor.level)) {
    if (!organizationId || !ObjectId.isValid(organizationId)) {
      return { "officer.level": "Patrol" };
    }
    const org = await organization.findOne({
      filters: { _id: new ObjectId(organizationId) },
      projection: { "road._id": 1 },
    });
    const orgRoadId = (org as { road?: { _id?: ObjectId } })?.road?._id;

    // Same two clauses the org-leader scope uses, so a Manager narrowing to one
    // organization still sees that organization's legacy reports.
    const clauses: Record<string, unknown>[] = [
      { "organization._id": new ObjectId(organizationId) },
    ];
    if (orgRoadId) clauses.push({ "road._id": orgRoadId });
    return { "officer.level": "Patrol", $or: clauses };
  }

  throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
};
```

- [ ] **Step 8: Write the validator**

Create `back/src/incident_report/oversight/getOversightList/getOversightList.val.ts`:

```ts
import { array, boolean, number, object, objectIdValidation, optional, string } from "@deps";

export const getOversightListValidator = () =>
  object({
    set: object({
      organizationId: optional(objectIdValidation),
      page: optional(number()),
      limit: optional(number()),
      dateFrom: optional(string()),
      dateTo: optional(string()),
      /** `accident`, or form definition ids. */
      groupKeys: optional(array(string())),
      sync_status: optional(array(string())),
      review_status: optional(array(string())),
      officerIds: optional(array(objectIdValidation)),
      appVersions: optional(array(string())),
      unlinkedOnly: optional(boolean()),
      search: optional(string()),
    }),
    // Empty on purpose: the projection lives in the pipeline (ROW_PROJECTION), and
    // an empty struct means a client cannot widen it.
    get: object({}),
  });
```

- [ ] **Step 9: Write the act function**

Create `back/src/incident_report/oversight/getOversightList/getOversightList.fn.ts`:

```ts
import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import { resolveOversightScope } from "../filters.ts";
import { buildOversightPipeline } from "../pipeline.ts";

/**
 * One list of everything an organization filed from the patrol app: accidents and
 * non-accident reports together.
 *
 * Runs through the **raw** collection driver on purpose. Lesan's `aggregation()`
 * appends `$lookup`/`$unwind`/`$project` stages derived from the client's `get`,
 * which cannot follow a `$unionWith` branch into a second collection and would
 * corrupt the `$facet` at the end of the pipeline.
 */
export const getOversightListFn: ActFn = async (body) => {
  const set = (body.details.set ?? {}) as Record<string, unknown>;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const page = Math.max(1, Number(set.page ?? 1));
  const limit = Math.min(200, Math.max(1, Number(set.limit ?? 25)));

  const scope = await resolveOversightScope(
    user as never,
    typeof set.organizationId === "string" ? set.organizationId : undefined,
  );

  const pipeline = buildOversightPipeline({
    scope,
    filters: {
      page,
      limit,
      dateFrom: set.dateFrom as string | undefined,
      dateTo: set.dateTo as string | undefined,
      groupKeys: set.groupKeys as string[] | undefined,
      syncStatus: set.sync_status as string[] | undefined,
      reviewStatus: set.review_status as string[] | undefined,
      officerIds: set.officerIds as string[] | undefined,
      appVersions: set.appVersions as string[] | undefined,
      unlinkedOnly: set.unlinkedOnly as boolean | undefined,
      search: set.search as string | undefined,
    },
  });

  const [result] = await coreApp.odm.getCollection("incident_report")
    .aggregate(pipeline)
    .toArray();

  const facet = (result ?? { rows: [], total: [] }) as {
    rows?: Array<Record<string, unknown>>;
    total?: Array<{ n: number }>;
  };

  return {
    rows: facet.rows ?? [],
    total: facet.total?.[0]?.n ?? 0,
  };
};
```

- [ ] **Step 10: Register the act**

Create `back/src/incident_report/oversight/getOversightList/mod.ts`:

```ts
import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { getOversightListFn } from "./getOversightList.fn.ts";
import { getOversightListValidator } from "./getOversightList.val.ts";

export const getOversightListSetup = () =>
  coreApp.acts.setAct({
    schema: "incident_report",
    actName: "getOversightList",
    // No `grantAccess`: the scope depends on the caller's organization, which only
    // the act can resolve. `resolveOversightScope` refuses every other level.
    preAct: [setTokens, setUser],
    validator: getOversightListValidator(),
    fn: getOversightListFn,
  });
```

Create `back/src/incident_report/oversight/mod.ts`:

```ts
import { getOversightListSetup } from "./getOversightList/mod.ts";

/**
 * The oversight console's server surface.
 *
 * These acts live on `incident_report` because that model owns the shared review
 * lifecycle. They inherit the `incident_patrol` module gate automatically through
 * the `incident_report.*` wildcard in `INCIDENT_SCHEMAS`.
 */
export const oversightSetup = () => {
  getOversightListSetup();
};
```

Then in `back/src/incident_report/mod.ts`, call `oversightSetup();` alongside the
other setups and import it.

- [ ] **Step 11: Run the act tests and confirm they pass**

Run: `cd back && deno test -A test/oversight-list-test.ts`
Expected: PASS — all pure and act tests.

- [ ] **Step 12: Run the whole backend suite**

```bash
cd back
rm -rf /tmp/btO && mkdir -p /tmp/btO && i=0; tp=0; tf=0
for f in test/*-test.ts; do i=$((i+1)); deno test -A "$f" > /tmp/btO/$i.log 2>&1
  s=$(sed 's/\x1b\[[0-9;]*m//g' /tmp/btO/$i.log | grep -oE "[0-9]+ passed \| [0-9]+ failed" | tail -1)
  p=$(echo "$s" | grep -oE "^[0-9]+"); fl=$(echo "$s" | grep -oE "[0-9]+ failed" | grep -oE "^[0-9]+")
  tp=$((tp+${p:-0})); tf=$((tf+${fl:-0}))
  [ "${fl:-0}" != "0" ] && echo "FAIL $(basename $f)"
done; echo "passed=$tp failed=$tf"
```
Expected: `failed=0`.

---

### Task 3: `reviewReports` — bulk review with per-row outcomes

Extracts the existing transition so single and bulk cannot drift, then loops it
without short-circuiting.

**Files:**
- Create: `back/src/incident_report/oversight/reviewTransition.ts`
- Create: `back/src/incident_report/oversight/reviewReports/{mod,reviewReports.fn,reviewReports.val}.ts`
- Modify: `back/src/incident_report/reviewReport/reviewReport.fn.ts`
- Modify: `back/src/incident_report/oversight/mod.ts`
- Test: `back/test/oversight-review-bulk-test.ts`

**Interfaces:**
- Consumes: `resolveOversightScope`, `getOrgReportBase`, `isManagerViewer`, `isOrgLeaderLevel`.
- Produces:
  - `applyReviewTransition({ model, reportId, action, reason, actor, scope }) => Promise<{ ok: true; review_status?: string } | { ok: false; error: string }>`
  - act `incident_report.reviewReports({ set: { reportIds, action, reason } }) => { results: Array<{ reportId, ok, error? }> }`

- [ ] **Step 1: Read the existing transition to be extracted**

Run: `cd back && cat src/incident_report/reviewReport/reviewReport.fn.ts`

Note the three guards it enforces — role, reason-required-on-return, and
`sync_status === "synced"` — plus the `transitions` / `actionStatus` tables. The
extracted helper must preserve all of them.

- [ ] **Step 2: Write the failing test**

Create `back/test/oversight-review-bulk-test.ts`:

```ts
/**
 * Bulk review.
 *
 * The property that matters is that a batch is **not** all-or-nothing: the review
 * state machine legitimately refuses some rows (wrong state, not synced, foreign
 * organization), and a reviewer approving forty reports needs to see which three
 * refused and why — not lose the other thirty-seven.
 */

import "./patrol_ops_env.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
  assert as structAssert,
  create as structCreate,
  type Document,
  jwt,
  MongoClient,
  ObjectId,
} from "@deps";
import { accident, coreApp, getAtcsWithServices, incident_report, user } from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
  await jwt.create(
    { alg: "HS512", typ: "JWT" },
    { _id: userId, exp: jwt.getNumericDate(60 * 60) },
    jwtTokenKey,
  );

const callAct = async (
  schema: string,
  actName: string,
  set: Document,
  userId: ObjectId,
) => {
  const headers = new Headers();
  headers.set("token", await makeToken(userId.toString()));
  coreApp.contextFns.addContexts({ Headers: headers } as never);
  const act = getAtcsWithServices().main[schema][actName];
  assertExists(act, `act ${schema}.${actName} is registered`);
  for (const pre of act.preAct ?? []) await pre();
  const details = { set, get: {} };
  const validated = act.validationRunType === "create"
    ? structCreate(details as Document, act.validator as never)
    : (structAssert(details as Document, act.validator as never), details);
  return await act.fn({
    service: "main",
    model: schema,
    act: actName,
    details: validated,
  } as never);
};

const reviewReports = async (set: Document, actor: ObjectId) =>
  await callAct("incident_report", "reviewReports", set, actor) as {
    results: Array<{ reportId: string; ok: boolean; error?: string; review_status?: string }>;
  };

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;
let seq = 0;

const insertUser = async (level: string) => {
  seq++;
  return (await user.insertOne({
    doc: {
      first_name: `نام${seq}`,
      last_name: `خانوادگی${seq}`,
      mobile: `0915${String(80000000 + seq)}`,
      gender: "Male",
      level,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;
};

/** A report already synced and awaiting review. */
const seedSyncedReport = async (label: string) =>
  (await incident_report.insertOne({
    doc: {
      form_definition_id: new ObjectId(),
      form_title: label,
      serial: ++seq,
      report_id: `INC-${RUN}-${seq}`,
      reported_at: new Date(),
      sync_status: "synced",
      review_status: "submitted",
      location: { type: "Point", coordinates: [51.4, 35.7] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: { officer: { _ids: patrolId } },
    projection: { _id: 1 },
  }))!._id as ObjectId;

/** A report still queued — the state machine refuses to review it. */
const seedQueuedReport = async (label: string) =>
  (await incident_report.insertOne({
    doc: {
      form_definition_id: new ObjectId(),
      form_title: label,
      serial: ++seq,
      report_id: `INC-${RUN}-${seq}`,
      reported_at: new Date(),
      sync_status: "queued",
      review_status: "submitted",
      location: { type: "Point", coordinates: [51.4, 35.7] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: { officer: { _ids: patrolId } },
    projection: { _id: 1 },
  }))!._id as ObjectId;

Deno.test("bulk review fixtures", async () => {
  ghostId = await insertUser("Ghost");
  managerId = await insertUser("Manager");
  patrolId = await insertUser("Patrol");

  const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
  await callAct(
    "app_modules",
    "setModules",
    { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
    ghostId,
  );
});

Deno.test("bulk review applies the action to every eligible row", async () => {
  const first = await seedSyncedReport("bulk-a");
  const second = await seedSyncedReport("bulk-b");

  const { results } = await reviewReports(
    { reportIds: [String(first), String(second)], action: "start_review" },
    managerId,
  );

  assertEquals(results.filter((row) => row.ok).length, 2, "both transitioned");
  const stored = await incident_report.find({
    filters: { _id: { $in: [first, second] } },
    projection: { review_status: 1 },
  }).toArray();
  assert(
    stored.every((row) => (row as { review_status?: string }).review_status === "under_review"),
    "both are under review",
  );
});

Deno.test("bulk review reports per-row outcomes instead of failing the batch", async () => {
  const good = await seedSyncedReport("bulk-good");
  const notSynced = await seedQueuedReport("bulk-queued");

  const { results } = await reviewReports(
    { reportIds: [String(good), String(notSynced)], action: "start_review" },
    managerId,
  );

  assertEquals(results.length, 2, "one outcome per requested id");
  const goodResult = results.find((row) => row.reportId === String(good));
  const badResult = results.find((row) => row.reportId === String(notSynced));
  assert(goodResult?.ok, "the eligible row succeeded");
  assert(!badResult?.ok, "the queued row was refused");
  assert(
    (badResult?.error ?? "").includes("همگام"),
    `the refusal explains why: ${badResult?.error}`,
  );
});

Deno.test("bulk return requires a reason for the whole batch", async () => {
  const target = await seedSyncedReport("bulk-reason");
  await reviewReports({ reportIds: [String(target)], action: "start_review" }, managerId);

  let error = "";
  try {
    await reviewReports({ reportIds: [String(target)], action: "return" }, managerId);
  } catch (cause) {
    error = (cause as Error).message;
  }
  assert(error.includes("دلیل"), `expected the reason guard, got: ${error}`);
});

Deno.test("a batch return writes the shared reason onto each row", async () => {
  const first = await seedSyncedReport("bulk-r1");
  const second = await seedSyncedReport("bulk-r2");
  await reviewReports(
    { reportIds: [String(first), String(second)], action: "start_review" },
    managerId,
  );

  await reviewReports(
    { reportIds: [String(first), String(second)], action: "return", reason: "توضیح بیشتر" },
    managerId,
  );

  const stored = await incident_report.find({
    filters: { _id: { $in: [first, second] } },
    projection: { review_status: 1, review_reason: 1 },
  }).toArray();
  assert(
    stored.every((row) => {
      const entry = row as { review_status?: string; review_reason?: string };
      return entry.review_status === "returned" && entry.review_reason === "توضیح بیشتر";
    }),
    "both rows carry the reason and the returned state",
  );
});

Deno.test("a patrol officer cannot bulk review", async () => {
  const target = await seedSyncedReport("bulk-guard");

  let error = "";
  try {
    await reviewReports({ reportIds: [String(target)], action: "approve" }, patrolId);
  } catch (cause) {
    error = (cause as Error).message;
  }
  assert(error.includes("اجازه"), `expected the role guard, got: ${error}`);
});

Deno.test("bulk review reaches accidents as well as reports", async () => {
  const target = (await accident.insertOne({
    doc: {
      seri: ++seq,
      serial: ++seq,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      date_of_accident: new Date(),
      sync_status: "synced",
      review_status: "submitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: { officer: { _ids: patrolId } },
    projection: { _id: 1 },
  }))!._id as ObjectId;

  const { results } = await reviewReports(
    { reportIds: [String(target)], action: "start_review" },
    managerId,
  );
  assert(results[0].ok, "the accident transitioned");

  const stored = await accident.findOne({
    filters: { _id: target },
    projection: { review_status: 1 },
  }) as { review_status?: string };
  assertEquals(stored.review_status, "under_review");
});

Deno.test("cleanup bulk review database", async () => {
  const client = await new MongoClient(
    Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
  ).connect();
  const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
  for (const c of await db.listCollections().toArray()) await db.collection(c.name).drop();
  await client.close();
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `cd back && deno test -A test/oversight-review-bulk-test.ts`
Expected: FAIL — `incident_report.reviewReports` is not registered.

- [ ] **Step 4: Extract the transition into a shared helper**

Create `back/src/incident_report/oversight/reviewTransition.ts`. Copy the
`transitions` and `actionStatus` tables and the per-report body from
`reviewReport.fn.ts` verbatim, changing only the signature and the error returns:

```ts
import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp, incident_report } from "../../../mod.ts";
import { type MyContext } from "@lib";
import {
  getOrgReportBase,
  isManagerViewer,
  isOrgLeaderLevel,
} from "../../accident/reportScope.ts";

/**
 * One review transition, shared by the single-report act and the bulk act.
 *
 * Extracted rather than duplicated so the state machine cannot drift between the
 * two surfaces: a reviewer acting on one row must not get a different answer from
 * the same action applied to forty.
 */

type ActorUser = MyContext["user"];

const transitions: Record<string, string[]> = {
  submitted: ["start_review"],
  under_review: ["return", "approve"],
  approved: ["complete"],
};

const actionStatus: Record<string, string> = {
  start_review: "under_review",
  return: "returned",
  approve: "approved",
  complete: "completed",
};

export type ReviewOutcome =
  | { ok: true; review_status?: string }
  | { ok: false; error: string };

/**
 * Apply one transition to one report on one of the two report models.
 *
 * `model` is resolved by trying `incident_report` first and falling back to
 * `accident`, because both share the same `sync_status` / `review_status` /
 * `review_history` shape and a reviewer acts on a merged list.
 */
export const applyReviewTransition = async ({
  reportId,
  action,
  reason,
  actor,
  scope,
}: {
  reportId: string;
  action: string;
  reason?: string;
  actor: ActorUser;
  scope: Record<string, unknown>;
}): Promise<ReviewOutcome> => {
  if (!isManagerViewer(actor.level) && !isOrgLeaderLevel(actor.level)) {
    return { ok: false, error: "شما اجازه بررسی گزارش‌ها را ندارید" };
  }
  if (action === "return" && !reason?.trim()) {
    return { ok: false, error: "برای برگشت گزارش، ثبت دلیل الزامی است" };
  }
  if (!ObjectId.isValid(reportId)) {
    return { ok: false, error: "شناسه گزارش نامعتبر است" };
  }

  const filters = { _id: new ObjectId(reportId), ...scope };
  const projection = { _id: 1, review_status: 1, sync_status: 1 };

  const report = await incident_report.findOne({
    filters,
    projection,
  });
  const target = report
    ? incident_report
    : (await accident.findOne({ filters, projection })) ? accident : null;

  if (!target) return { ok: false, error: "گزارش یافت نشد یا دسترسی ندارید" };

  const stored = (await target.findOne({
    filters,
    projection,
  })) as unknown as { _id: ObjectId; review_status?: string; sync_status?: string };

  if (stored.sync_status !== "synced") {
    return { ok: false, error: "این گزارش هنوز همگام نشده است و قابل بررسی نیست" };
  }

  const current = (stored.review_status || "submitted") as string;
  const allowed = transitions[current] ?? [];
  if (!allowed.includes(action)) {
    return {
      ok: false,
      error: `انتقال از «${current}» با عملیات «${action}» مجاز نیست`,
    };
  }

  const nextStatus = actionStatus[action];
  const now = new Date();

  await target.findOneAndUpdate({
    filter: { _id: stored._id },
    update: {
      $set: {
        review_status: nextStatus,
        ...(action === "return" ? { review_reason: reason } : {}),
        ...(action === "approve" ? { reviewed_at: now } : {}),
        ...(action === "complete" ? { completed_at: now } : {}),
        updatedAt: now,
      },
      $push: {
        review_history: {
          action: action === "start_review" ? "started_review" : action === "return" ? "returned" : action === "approve" ? "approved" : "completed",
          reason,
          action_at: now,
        },
      },
    },
    projection: { _id: 1 },
  });

  return { ok: true, review_status: nextStatus };
};

/** The scope every review action must run inside. */
export const reviewScopeFor = async (actor: ActorUser): Promise<Record<string, unknown>> =>
  await getOrgReportBase(actor);
```

Adjust the `review_history` entry shape to match what
`reviewReport.fn.ts` currently writes — read it and keep its exact fields,
including the reviewer snapshot.

- [ ] **Step 5: Make `reviewReport` delegate**

In `back/src/incident_report/reviewReport/reviewReport.fn.ts`, replace the body
with a call to the helper, so there is one state machine:

```ts
export const reviewReportFn: ActFn = async (body) => {
  const { reportId, action, reason } = body.details.set;
  const { user } = coreApp.contextFns.getContextModel() as MyContext;

  const outcome = await applyReviewTransition({
    reportId: reportId as string,
    action: action as string,
    reason: reason as string | undefined,
    actor: user as never,
    scope: await reviewScopeFor(user as never),
  });

  if (!outcome.ok) return throwError(outcome.error);
  return await incident_report.findOne({
    filters: { _id: new ObjectId(reportId as string) },
    projection: body.details.get,
  });
};
```

Keep the original imports the file still needs.

- [ ] **Step 6: Write the bulk validator**

Create `back/src/incident_report/oversight/reviewReports/reviewReports.val.ts`:

```ts
import { array, enums, object, objectIdValidation, optional, string } from "@deps";

export const reviewReportsValidator = () =>
  object({
    set: object({
      reportIds: array(objectIdValidation),
      action: enums(["start_review", "return", "approve", "complete"]),
      reason: optional(string()),
    }),
    get: object({}),
  });
```

- [ ] **Step 7: Write the bulk act**

Create `back/src/incident_report/oversight/reviewReports/reviewReports.fn.ts`:

```ts
import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import { applyReviewTransition, reviewScopeFor } from "../reviewTransition.ts";

/**
 * Apply one review action to many reports.
 *
 * Deliberately not all-or-nothing. A mixed batch is the normal case — some rows
 * are not synced, some are in the wrong state — and a reviewer needs the full
 * picture, so each row reports its own outcome and the loop never short-circuits.
 */
export const reviewReportsFn: ActFn = async (body) => {
  const { reportIds, action, reason } = body.details.set as {
    reportIds: string[];
    action: string;
    reason?: string;
  };
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  // Resolve the scope once: it is the same for every row, and re-resolving per row
  // would re-query the organization for each of forty reports.
  const scope = await reviewScopeFor(user as never);

  const results: Array<{
    reportId: string;
    ok: boolean;
    error?: string;
    review_status?: string;
  }> = [];

  for (const reportId of reportIds) {
    const outcome = await applyReviewTransition({
      reportId,
      action,
      reason,
      actor: user as never,
      scope,
    });
    results.push(
      outcome.ok
        ? { reportId, ok: true, review_status: outcome.review_status }
        : { reportId, ok: false, error: outcome.error },
    );
  }

  return { results };
};
```

- [ ] **Step 8: Register it**

Create `reviewReports/mod.ts`:

```ts
import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { reviewReportsFn } from "./reviewReports.fn.ts";
import { reviewReportsValidator } from "./reviewReports.val.ts";

export const reviewReportsSetup = () =>
  coreApp.acts.setAct({
    schema: "incident_report",
    actName: "reviewReports",
    preAct: [setTokens, setUser],
    validator: reviewReportsValidator(),
    fn: reviewReportsFn,
  });
```

Add `reviewReportsSetup()` to `back/src/incident_report/oversight/mod.ts`.

- [ ] **Step 9: Run the bulk tests**

Run: `cd back && deno test -A test/oversight-review-bulk-test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 10: Verify the single-review act still behaves**

Run: `cd back && deno test -A test/incident-report-test.ts`
Expected: PASS — the refactor must not change `reviewReport` behaviour.

---

### Task 4: `getOversightStats` — officer, app version, aging

**Files:**
- Create: `back/src/incident_report/oversight/stats.ts`
- Create: `back/src/incident_report/oversight/getOversightStats/{mod,getOversightStats.fn,getOversightStats.val}.ts`
- Modify: `back/src/incident_report/oversight/mod.ts`
- Test: `back/test/oversight-stats-test.ts`

**Interfaces:**
- Consumes: `resolveOversightScope`, `buildOversightPipeline`'s shapes (reuse `REPORT_SHAPE` / `ACCIDENT_SHAPE` via a shared `UNION_PRELUDE`).
- Produces: act `incident_report.getOversightStats({ set }) => { byOfficer, byAppVersion, aging }`.

- [ ] **Step 1: Export a reusable union prelude**

In `back/src/incident_report/oversight/pipeline.ts`, add:

```ts
/**
 * The union stages on their own, so the stats act aggregates exactly the same
 * population the list shows. If these two drifted, an officer's count would not
 * match the rows a reviewer can see.
 */
export const unionPrelude = (): Document[] => [
  { $match: {} },
  { $addFields: REPORT_SHAPE },
  {
    $unionWith: {
      coll: "accident",
      pipeline: [{ $match: {} }, { $addFields: ACCIDENT_SHAPE }],
    },
  },
];
```

Then refactor `buildOversightPipeline` to spread `unionPrelude()` in place of its
first three stages, keeping its own branch matches:

```ts
  return [
    { $match: reportMatch },
    { $addFields: REPORT_SHAPE },
    { $unionWith: { coll: "accident", pipeline: [{ $match: accidentMatch }, { $addFields: ACCIDENT_SHAPE }] } },
    { $match: { $and: [scope, sharedMatch(filters)] } },
    { $facet: { /* unchanged */ } },
  ];
```

`unionPrelude` is for the stats act's own filter needs; the list keeps its
per-branch `groupKeys` matching, which is why both exist.

- [ ] **Step 2: Write the failing test**

Create `back/test/oversight-stats-test.ts`:

```ts
/**
 * Oversight statistics.
 *
 * Two properties are worth asserting beyond the arithmetic: the officer counts
 * must reconcile with the list's `total` for the same filter (otherwise the
 * dashboard and the table disagree), and records with no app provenance must
 * appear under "—" rather than vanish from the totals.
 */

import "./patrol_ops_env.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
  assert as structAssert,
  create as structCreate,
  type Document,
  jwt,
  MongoClient,
  ObjectId,
} from "@deps";
import { accident, coreApp, getAtcsWithServices, organization, road, unit, user } from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
  await jwt.create({ alg: "HS512", typ: "JWT" }, { _id: userId, exp: jwt.getNumericDate(60 * 60) }, jwtTokenKey);

const callAct = async (schema: string, actName: string, set: Document, userId: ObjectId) => {
  const headers = new Headers();
  headers.set("token", await makeToken(userId.toString()));
  coreApp.contextFns.addContexts({ Headers: headers } as never);
  const act = getAtcsWithServices().main[schema][actName];
  assertExists(act, `act ${schema}.${actName} is registered`);
  for (const pre of act.preAct ?? []) await pre();
  const details = { set, get: {} };
  const validated = act.validationRunType === "create"
    ? structCreate(details as Document, act.validator as never)
    : (structAssert(details as Document, act.validator as never), details);
  return await act.fn({ service: "main", model: schema, act: actName, details: validated } as never);
};

const stats = async (set: Document, actor: ObjectId) =>
  await callAct("incident_report", "getOversightStats", set, actor) as {
    byOfficer: Array<Record<string, unknown>>;
    byAppVersion: Array<Record<string, unknown>>;
    aging: { queued: number; under_review: number; thresholdHours: number };
  };

const listTotal = async (set: Document, actor: ObjectId) =>
  (await callAct("incident_report", "getOversightList", set, actor) as { total: number }).total;

let ghostId: ObjectId;
let managerId: ObjectId;
let orgHeadId: ObjectId;
let orgA: ObjectId;
let roadA: ObjectId;
let officerOne: ObjectId;
let officerTwo: ObjectId;
let seq = 0;

const orgRole = (orgId: ObjectId, name: string) => ({
  roleId: String(orgId),
  name,
  scopeType: "organization",
  scopeId: String(orgId),
});

const insertUser = async (level: string, roles: Array<Record<string, unknown>> = []) => {
  seq++;
  return (await user.insertOne({
    doc: {
      first_name: `نام${seq}`,
      last_name: `خانوادگی${seq}`,
      mobile: `0915${String(90000000 + seq)}`,
      gender: "Male",
      level,
      is_active: true,
      roles,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;
};

Deno.test("stats fixtures", async () => {
  ghostId = await insertUser("Ghost");
  managerId = await insertUser("Manager");
  orgA = (await organization.insertOne({
    doc: {
      code: `ST${RUN}`,
      name: `سازمان ${RUN}`,
      description: "",
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: { _id: 1 },
  }))!._id as ObjectId;

  roadA = (await road.insertOne({
    doc: { name: `جاده ${RUN}`, createdAt: new Date(), updatedAt: new Date() },
    relations: { organization: { _ids: orgA } },
    projection: { _id: 1 },
  }))!._id as ObjectId;

  orgHeadId = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
  officerOne = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
  officerTwo = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
  await unit.insertOne({
    doc: { name: `واحد ${RUN}`, createdAt: new Date(), updatedAt: new Date() },
    relations: {
      organization: { _ids: orgA, relatedRelations: { units: true } },
      officers: { _ids: [officerOne, officerTwo] },
    },
    projection: { _id: 1 },
  });

  const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
  await callAct(
    "app_modules",
    "setModules",
    { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
    ghostId,
  );
});

const seedAccident = async (
  officer: ObjectId,
  options: { version?: string; sync?: string; review?: string; reportedAt?: Date } = {},
) => {
  const reportedAt = options.reportedAt ?? new Date();
  await accident.insertOne({
    doc: {
      seri: ++seq,
      serial: ++seq,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      date_of_accident: reportedAt,
      reported_at: reportedAt,
      sync_status: options.sync ?? "synced",
      review_status: options.review ?? "submitted",
      ...(options.version
        ? { submitted_from: { app_version: options.version, platform: "ios" } }
        : {}),
      createdAt: reportedAt,
      updatedAt: reportedAt,
    },
    relations: {
      organization: { _ids: orgA },
      officer: { _ids: officer },
      road: { _ids: roadA },
    },
    projection: { _id: 1 },
  });
};

Deno.test("officer counts reconcile with the list total", async () => {
  await seedAccident(officerOne, { version: "1.4.2" });
  await seedAccident(officerOne, { version: "1.4.2", sync: "queued", review: "submitted" });
  await seedAccident(officerTwo, { version: "1.5.0" });

  const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
  const sum = byOfficer.reduce((total, row) => total + Number(row["total"] ?? 0), 0);
  const listed = await listTotal({ page: 1, limit: 1, dateFrom: "2026-01-01" }, orgHeadId);

  assertEquals(sum, listed, "the officer table adds up to the list");
  assertEquals(byOfficer.length, 2, "one row per officer");
});

Deno.test("app versions are grouped, with a bucket for records that never came from the app", async () => {
  await seedAccident(officerOne, { version: "1.4.2" });
  await seedAccident(officerOne, { version: "1.4.2", sync: "rejected" });
  await seedAccident(officerTwo);

  const { byAppVersion } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
  const versions = byAppVersion.map((row) => String(row["app_version"]));
  assert(versions.includes("1.4.2"), "the build that filed reports is listed");
  assert(
    versions.includes("—"),
    "a web-created report stays visible instead of vanishing from the totals",
  );

  const first = byAppVersion.find((row) => String(row["app_version"]) === "1.4.2");
  assertEquals(Number(first?.["total"]), 2);
  assertEquals(Number(first?.["rejected"]), 1, "the rejection count is what surfaces a bad build");
});

Deno.test("aging counts what is stuck, split by the state that can stall", async () => {
  const old = new Date(Date.now() - 72 * 60 * 60 * 1000);
  await seedAccident(officerOne, { sync: "queued", review: "submitted", reportedAt: old });
  await seedAccident(officerOne, { sync: "synced", review: "under_review", reportedAt: old });
  await seedAccident(officerOne, { sync: "synced", review: "approved" });

  const { aging } = await stats({ thresholdHours: 24 }, orgHeadId);
  assert(aging.thresholdHours === 24, "the threshold is echoed back");
  assertEquals(aging.queued, 1, "one report queued past the threshold");
  assertEquals(aging.under_review, 1, "one report under review past the threshold");
});

Deno.test("median sync time is absent, not zero, when no instant was recorded", async () => {
  await seedAccident(officerOne, { version: "1.4.2" });

  const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
  const row = byOfficer.find((entry) => String(entry["officer_id"]) === String(officerOne));
  assertEquals(
    row?.["median_sync_ms"],
    null,
    "an unknown duration is null; a zero would read as instantaneous",
  );
});

Deno.test("median sync time is computed from synced_at", async () => {
  const reportedAt = new Date();
  await accident.insertOne({
    doc: {
      seri: ++seq,
      serial: ++seq,
      location: { type: "Point", coordinates: [51.4, 35.7] },
      date_of_accident: reportedAt,
      reported_at: reportedAt,
      sync_status: "synced",
      review_status: "submitted",
      synced_at: new Date(reportedAt.getTime() + 5 * 60 * 1000),
      submitted_from: { app_version: "1.4.2", platform: "ios" },
      createdAt: reportedAt,
      updatedAt: reportedAt,
    },
    relations: {
      organization: { _ids: orgA },
      officer: { _ids: officerTwo },
      road: { _ids: roadA },
    },
    projection: { _id: 1 },
  });

  const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
  const row = byOfficer.find((entry) => String(entry["officer_id"]) === String(officerTwo));
  assertEquals(row?.["median_sync_ms"], 5 * 60 * 1000);
});

Deno.test("cleanup stats database", async () => {
  const client = await new MongoClient(
    Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
  ).connect();
  const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
  for (const c of await db.listCollections().toArray()) await db.collection(c.name).drop();
  await client.close();
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `cd back && deno test -A test/oversight-stats-test.ts`
Expected: FAIL — `incident_report.getOversightStats` is not registered.

- [ ] **Step 4: Write the stats helpers**

Create `back/src/incident_report/oversight/stats.ts`:

```ts
import { type Document } from "@deps";

import { unionPrelude } from "./pipeline.ts";

/** Groups reports that were never filed from the app. */
export const NO_VERSION = "—";

const median = (values: number[]): number | null => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
};

export type OfficerStat = {
  officer_id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  total: number;
  queued: number;
  rejected: number;
  returned: number;
  approved: number;
  completed: number;
  first_reported_at?: Date;
  last_reported_at?: Date;
  /** Null when no row carried `synced_at` — never 0. */
  median_sync_ms: number | null;
};

export type AppVersionStat = {
  app_version: string;
  total: number;
  rejected: number;
  distinct_officers: number;
};

/**
 * Per-officer rows.
 *
 * The median is computed here rather than in the pipeline: an exact median is
 * awkward to express in an aggregation portably, and the population is bounded by
 * the caller's organization and date range. Durations are pushed as an array and
 * reduced in JS; revisit with `$percentile` if a single officer's volume ever
 * makes that array large.
 */
export const officerStatsPipeline = (scope: Document): Document[] => [
  ...unionPrelude(),
  { $match: { $and: [scope] } },
  {
    $group: {
      _id: "$officer._id",
      first_name: { $first: "$officer.first_name" },
      last_name: { $first: "$officer.last_name" },
      personnel_code: { $first: "$officer.personnel_code" },
      total: { $sum: 1 },
      queued: { $sum: { $cond: [{ $eq: ["$sync_status", "queued"] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ["$sync_status", "rejected"] }, 1, 0] } },
      returned: { $sum: { $cond: [{ $eq: ["$review_status", "returned"] }, 1, 0] } },
      approved: { $sum: { $cond: [{ $eq: ["$review_status", "approved"] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ["$review_status", "completed"] }, 1, 0] } },
      first_reported_at: { $min: "$sort_at" },
      last_reported_at: { $max: "$sort_at" },
      durations: {
        $push: {
          $cond: [
            { $and: [{ $ne: ["$synced_at", null] }, { $ne: ["$reported_at", null] }] },
            { $subtract: ["$synced_at", "$reported_at"] },
            "$$REMOVE",
          ],
        },
      },
    },
  },
  { $sort: { last_reported_at: -1 } },
];

/**
 * Per-app-version rows.
 *
 * `NO_VERSION` is `$ifNull` rather than a filter, so records the app never filed
 * stay in the totals instead of quietly reducing them.
 */
export const appVersionStatsPipeline = (scope: Document): Document[] => [
  ...unionPrelude(),
  { $match: { $and: [scope] } },
  {
    $group: {
      _id: { $ifNull: ["$submitted_from.app_version", NO_VERSION] },
      total: { $sum: 1 },
      rejected: { $sum: { $cond: [{ $eq: ["$sync_status", "rejected"] }, 1, 0] } },
      officers: { $addToSet: "$officer._id" },
    },
  },
  { $sort: { total: -1 } },
];

/**
 * How long reports have been sitting in a state that can stall.
 *
 * `queued` ages from when the report was filed; `under_review` ages from when
 * review started, since that is when the clock on a reviewer begins.
 */
export const agingPipeline = (
  scope: Document,
  thresholdHours: number,
  now: Date,
): Document[] => {
  const cutoff = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);
  return [
    ...unionPrelude(),
    { $match: { $and: [scope] } },
    {
      $group: {
        _id: null,
        queued: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$sync_status", "queued"] }, { $lt: ["$sort_at", cutoff] }] },
              1,
              0,
            ],
          },
        },
        under_review: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$review_status", "under_review"] },
                  { $lt: ["$reviewed_at", cutoff] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];
};

export const reduceOfficerStats = (
  rows: Array<Record<string, unknown>>,
): OfficerStat[] =>
  rows.map((row) => ({
    officer_id: String(row["_id"] ?? ""),
    first_name: row["first_name"] as string | undefined,
    last_name: row["last_name"] as string | undefined,
    personnel_code: row["personnel_code"] as string | undefined,
    total: Number(row["total"] ?? 0),
    queued: Number(row["queued"] ?? 0),
    rejected: Number(row["rejected"] ?? 0),
    returned: Number(row["returned"] ?? 0),
    approved: Number(row["approved"] ?? 0),
    completed: Number(row["completed"] ?? 0),
    first_reported_at: row["first_reported_at"] as Date | undefined,
    last_reported_at: row["last_reported_at"] as Date | undefined,
    median_sync_ms: median((row["durations"] as number[] | undefined) ?? []),
  }));

export const reduceAppVersionStats = (
  rows: Array<Record<string, unknown>>,
): AppVersionStat[] =>
  rows.map((row) => ({
    app_version: String(row["_id"] ?? NO_VERSION),
    total: Number(row["total"] ?? 0),
    rejected: Number(row["rejected"] ?? 0),
    distinct_officers: Array.isArray(row["officers"]) ? row["officers"].length : 0,
  }));
```

- [ ] **Step 5: Write the validator and act**

`getOversightStats.val.ts`:

```ts
import { number, object, objectIdValidation, optional, string } from "@deps";

export const getOversightStatsValidator = () =>
  object({
    set: object({
      organizationId: optional(objectIdValidation),
      dateFrom: optional(string()),
      dateTo: optional(string()),
      thresholdHours: optional(number()),
    }),
    get: object({}),
  });
```

`getOversightStats.fn.ts`:

```ts
import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import { resolveOversightScope } from "../filters.ts";
import {
  agingPipeline,
  appVersionStatsPipeline,
  officerStatsPipeline,
  reduceAppVersionStats,
  reduceOfficerStats,
} from "../stats.ts";

const DEFAULT_THRESHOLD_HOURS = 24;

export const getOversightStatsFn: ActFn = async (body) => {
  const set = (body.details.set ?? {}) as Record<string, unknown>;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const scope = await resolveOversightScope(
    user as never,
    typeof set.organizationId === "string" ? set.organizationId : undefined,
  );

  // The date window narrows the report list, so the stats must narrow the same way
  // or the officer table would not reconcile with the rows above it.
  const range = (() => {
    const filter: Record<string, unknown> = {};
    if (set.dateFrom || set.dateTo) {
      const on: Record<string, unknown> = {};
      if (set.dateFrom) on.$gte = new Date(set.dateFrom as string);
      if (set.dateTo) {
        const end = new Date(set.dateTo as string);
        end.setUTCHours(23, 59, 59, 999);
        on.$lte = end;
      }
      filter["sort_at"] = on;
    }
    return filter;
  })();

  const windowed: Document = Object.keys(range).length
    ? { $and: [scope, range] }
    : scope;

  const thresholdHours = Number(set.thresholdHours ?? DEFAULT_THRESHOLD_HOURS);
  const collection = coreApp.odm.getCollection("incident_report");

  const [officerRows, versionRows, agingRows] = await Promise.all([
    collection.aggregate(officerStatsPipeline(windowed)).toArray(),
    collection.aggregate(appVersionStatsPipeline(windowed)).toArray(),
    collection.aggregate(agingPipeline(windowed, thresholdHours, new Date())).toArray(),
  ]);

  const agingRow = (agingRows[0] ?? {}) as Record<string, unknown>;

  return {
    byOfficer: reduceOfficerStats(officerRows as Array<Record<string, unknown>>),
    byAppVersion: reduceAppVersionStats(versionRows as Array<Record<string, unknown>>),
    aging: {
      queued: Number(agingRow["queued"] ?? 0),
      under_review: Number(agingRow["under_review"] ?? 0),
      thresholdHours,
    },
  };
};
```

Register it in `getOversightStats/mod.ts` with `preAct: [setTokens, setUser]`, and
add `getOversightStatsSetup()` to `oversight/mod.ts`.

- [ ] **Step 6: Run the stats tests**

Run: `cd back && deno test -A test/oversight-stats-test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Re-run oversight list, since the pipeline was refactored**

Run: `cd back && deno test -A test/oversight-list-test.ts`
Expected: PASS — `buildOversightPipeline` must be unchanged in behaviour.

---

### Task 5: Frontend data layer, server actions, and the CSV helper

**Files:**
- Create: `front/src/services/reports-csv.ts`
- Create: `front/src/app/actions/incident_report/getOversightList.ts`
- Create: `front/src/app/actions/incident_report/reviewReports.ts`
- Create: `front/src/app/actions/incident_report/getOversightStats.ts`
- Modify: `front/src/services/report-sources.ts`
- Test: `.workbuddy-ai/tools/reports-csv-test.py`

**Interfaces:**
- Consumes: `incident_report.{getOversightList, reviewReports, getOversightStats}` acts (Tasks 2–4) and regenerated declarations.
- Produces:
  - `reportsToCsv(rows: OversightRow[], labels?: Record<string, string>): string`
  - `OversightRow` type, `fetchOversightList(options): Promise<{ rows, total }>`, `fetchOversightStats(...)`, `bulkReviewReports(...)`

- [ ] **Step 1: Write the failing CSV test**

Create `.workbuddy-ai/tools/reports-csv-test.py`, modelled on
`panel-routing-test.py` (compile the TS to a temp dir, run assertions in node —
the frontend has no test runner):

```python
"""Assert the report CSV helper's output.

The frontend has no test runner, so this follows the same shape as
`panel-routing-test.py`: compile the pure helper with the project's own tsc, then
assert on the emitted JavaScript in node. No new dependency.

Usage:
  python3 .workbuddy-ai/tools/reports-csv-test.py
"""

import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path("/Users/syd/work/madani/nejat/lesan")
FRONT = ROOT / "front"
TOOLS = ROOT / ".workbuddy-ai" / "tools"
TSC = FRONT / "node_modules/.bin/tsc"
NODE = pathlib.Path(__import__("shutil").which("node") or "node")

out = pathlib.Path(tempfile.mkdtemp(prefix="reports-csv-"))
try:
    subprocess.run(
        [
            str(TSC), "src/services/reports-csv.ts",
            "--outDir", str(out),
            "--target", "es2020",
            "--module", "esnext",
            "--moduleResolution", "bundler",
            "--skipLibCheck",
            "--noEmitOnError", "false",
        ],
        cwd=FRONT,
        check=False,
        capture_output=True,
        text=True,
    )
    harness = out / "harness.mjs"
    harness.write_text(
        """
import { reportsToCsv } from "./reports-csv.js";

const rows = [
  {
    report_id: "REP-1",
    source: "accident",
    group_title: "تصادف",
    sort_at: "2026-10-01T10:00:00.000Z",
    sync_status: "synced",
    review_status: "submitted",
    officer: { first_name: "علی", last_name: "رضایی", personnel_code: "1234" },
    submitted_from: { app_version: "1.4.2", platform: "ios" },
    description: "خط، و نقل قول \\"دو\"",
  },
  {
    report_id: "INC-2",
    source: "incident_report",
    group_title: "خرابی آسفالت",
    sort_at: "2026-10-02T10:00:00.000Z",
    sync_status: "queued",
    review_status: "submitted",
    officer: { first_name: "سارا", last_name: "محمدی" },
    description: "",
  },
];

const failures = [];
const check = (name, condition, detail = "") => {
  if (!condition) failures.push(name + (detail ? " -> " + detail : ""));
};

const csv = reportsToCsv(rows);
const body = csv.replace(/^\\uFEFF/, "");

check("starts with a UTF-8 BOM so Excel reads Persian", csv.charCodeAt(0) === 0xfeff);
check("has a header row", body.split("\\n")[0].includes("report_id"));
check("has one line per row", body.trim().split("\\n").length === 3, body.trim().split("\\n").length);
check("keeps Persian text intact", body.includes("رضایی") && body.includes("آسفالت"));
check("quotes a field containing a comma", body.includes('"خط، و نقل قول'));
check("escapes an embedded quote by doubling it", body.includes('""دو""'));
check("renders a missing app version as an em dash", body.includes("—"));
check("renders an absent platform as an em dash", body.includes("—"));
check("leaves no trailing separator on a row", !body.split("\\n")[2].endsWith(","));

if (failures.length) {
  console.log("FAILED:");
  for (const failure of failures) console.log("  " + failure);
  console.log("\\n--- csv ---\\n" + body);
  process.exit(1);
}
console.log("all reports-csv assertions pass");
""",
        encoding="utf-8",
    )
    result = subprocess.run(
        [str(NODE), str(harness)], capture_output=True, text=True
    )
    print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    sys.exit(result.returncode)
finally:
    import shutil as _shutil
    _shutil.rmtree(out, ignore_errors=True)
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `python3 .workbuddy-ai/tools/reports-csv-test.py`
Expected: non-zero exit — `src/services/reports-csv.ts` does not exist.

- [ ] **Step 3: Write the CSV helper**

Create `front/src/services/reports-csv.ts`:

```ts
import type { OversightRow } from "./report-sources";

/** Shown when a value is genuinely absent, so an empty cell is never ambiguous. */
const ABSENT = "—";

const cell = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? ABSENT : String(value);

/** RFC 4180: wrap in quotes and double any quote inside. */
const quote = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const HEADERS = [
  "report_id",
  "source",
  "form",
  "date",
  "sync_status",
  "review_status",
  "review_reason",
  "officer",
  "personnel_code",
  "patrol_unit",
  "road",
  "kilometer",
  "description",
  "app_version",
  "platform",
] as const;

/**
 * Render the current filter as CSV.
 *
 * The BOM is not optional: without it Excel opens Persian text as mojibake, which
 * makes the export look broken on the machines most likely to receive it.
 */
export const reportsToCsv = (rows: OversightRow[]): string => {
  const lines = rows.map((row) =>
    [
      cell(row.report_id),
      cell(row.source),
      cell(row.group_title),
      cell(row.sort_at),
      cell(row.sync_status),
      cell(row.review_status),
      cell(row.review_reason),
      cell(
        [row.officer?.first_name, row.officer?.last_name].filter(Boolean).join(" ")
      ),
      cell(row.officer?.personnel_code),
      cell(row.patrol_unit?.name),
      cell(row.road?.name),
      cell(row.kilometer),
      cell(row.description),
      cell(row.submitted_from?.app_version),
      cell(row.submitted_from?.platform),
    ]
      .map(quote)
      .join(","),
  );

  return `﻿${HEADERS.join(",")}\n${lines.join("\n")}\n`;
};
```

- [ ] **Step 4: Run the CSV test and confirm it passes**

Run: `python3 .workbuddy-ai/tools/reports-csv-test.py`
Expected: prints `all reports-csv assertions pass`, exit 0.

- [ ] **Step 5: Regenerate declarations**

Follow the repo's existing flow (`TYPE_GENERATION` at server boot writes
`back/declarations/selectInp.ts`; `front/src/types/declarations/` is the synced
copy). Start the backend once, or run the existing generation path, then confirm:

Run: `grep -c "getOversightList\|reviewReports\|getOversightStats" back/declarations/selectInp.ts`
Expected: a non-zero count.

- [ ] **Step 6: Add the `OversightRow` and `OversightFilters` types**

In `front/src/services/report-sources.ts`, append **types only**. The fetches live
in the server actions, because `cookies()` and `AppApi()` are server-only and this
module is imported by client components:

```ts
/** One row of `incident_report.getOversightList`. */
export type OversightRow = {
  _id: string;
  report_id?: string;
  source: "accident" | "incident_report";
  sort_at?: string;
  group_key?: string;
  group_title?: string;
  group_icon?: string;
  sync_status?: string;
  rejection_reason?: string;
  review_status?: string;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  kilometer?: number;
  description?: string;
  submitted_from?: { app_version?: string; platform?: "ios" | "android" };
  organization?: { _id?: string };
  officer?: { _id?: string; first_name?: string; last_name?: string; personnel_code?: string };
  patrol_unit?: { _id?: string; name?: string };
  road?: { _id?: string; name?: string };
  type?: { _id?: string; name?: string };
  incident_severity?: { _id?: string; name?: string };
};

export type OversightFilters = {
  organizationId?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  groupKeys?: string[];
  syncStatus?: string[];
  reviewStatus?: string[];
  officerIds?: string[];
  appVersions?: string[];
  unlinkedOnly?: boolean;
  search?: string;
};
```

- [ ] **Step 7: Write the three server actions**

`front/src/app/actions/incident_report/getOversightList.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
import type { OversightFilters, OversightRow } from "@/services/report-sources";

type Act = ReqType["main"]["incident_report"]["getOversightList"];

/**
 * The organization's accidents and reports in one list.
 *
 * Filtering and pagination are the backend's job here. The previous console fetched
 * a capped set and filtered in the browser, which is why it silently showed nothing
 * once the road filter stopped matching.
 */
export async function fetchOversightList(filters: OversightFilters): Promise<{
  rows: OversightRow[];
  total: number;
}> {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getOversightList",
      details: {
        set: {
          organizationId: filters.organizationId,
          page: filters.page ?? 1,
          limit: filters.limit ?? 25,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          groupKeys: filters.groupKeys,
          sync_status: filters.syncStatus,
          review_status: filters.reviewStatus,
          officerIds: filters.officerIds,
          appVersions: filters.appVersions,
          unlinkedOnly: filters.unlinkedOnly,
          search: filters.search,
        } as Partial<Act["set"]>,
        get: {} as Act["get"],
      },
    },
    { token: token?.value },
  );

  const body = response as unknown as { success?: boolean; body?: { rows?: OversightRow[]; total?: number } };
  if (!body?.success) return { rows: [], total: 0 };
  return { rows: body.body?.rows ?? [], total: body.body?.total ?? 0 };
}
```

`reviewReports.ts` and `getOversightStats.ts` follow the identical shape, wrapping
`incident_report.reviewReports` and `incident_report.getOversightStats` and
returning `{ results }` and `{ byOfficer, byAppVersion, aging }` respectively.

- [ ] **Step 8: Verify types and lint**

Run:
```bash
cd front
npx tsc --noEmit -p tsconfig.json
npx next lint
```
Expected: clean.

---

### Task 6: The console UI

**Files:**
- Create: `front/src/components/org/OversightFilterBar.tsx`
- Create: `front/src/components/org/OversightStatsCards.tsx`
- Modify: `front/src/components/org/OrgReportsView.tsx`

**Interfaces:**
- Consumes: `fetchOversightList`, `fetchOversightStats`, `bulkReviewReports`, `reportsToCsv`, `OversightRow`, `OversightFilters`, `FormIcon`.
- Produces: the `/orghead/reports`, `/unit-head/reports` and `/org/[orgId]/reports` pages rendering a working oversight console.

- [ ] **Step 1: Write the filter bar**

`front/src/components/org/OversightFilterBar.tsx` — a controlled component that
renders one control per act filter and calls `onChange` with a partial filter.
Reuse the existing `FilterPill` and `Button` components already used by
`OrgReportsView`, and the existing date-input styling, so the console looks like
the rest of the panel rather than a new product surface.

Props:

```ts
{
  value: OversightFilters;
  forms: Array<{ groupKey: string; title: string; icon?: string }>;
  officers: Array<{ _id: string; label: string }>;
  appVersions: string[];
  onChange: (next: OversightFilters) => void;
  onReset: () => void;
}
```

The form list comes from `appVersions`-style options derived from
`getOversightStats().byAppVersion` and a distinct-forms fetch, so the filter can
only offer values that actually exist.

- [ ] **Step 2: Write the stats cards**

`front/src/components/org/OversightStatsCards.tsx` takes
`{ byOfficer, byAppVersion, aging, loading }` and renders three panels: an officer
table (total, queued, returned, rejected, median sync time rendered as `—` when
null), an app-version table (total, rejected, distinct officers), and an aging
panel showing `queued`/`under_review` against the threshold.

Render the median as Persian time (`۵ دقیقه`) via the existing date formatting
helper, and `—` when null — never `0`.

- [ ] **Step 3: Rewrite `OrgReportsView`**

Replace the current implementation, which resolves the org's road and calls
`fetchMergedReports({ road: [roadId] })`, with:

- Filter state in the URL (`useSearchParams`), so a filtered view can be shared or
  bookmarked.
- `useEffect` calling `fetchOversightList` whenever the filter or page changes,
  with a loading state and an error state that shows the backend's Persian message.
- Pagination driven by `total`: page controls, a page size, and an explicit "no
  results" state that distinguishes "no reports match" from "could not load".
- A checkbox column with select-all-on-page, a sticky action bar showing the
  selection count, and approve / return buttons. A return opens a modal requiring
  one shared reason.
- After a bulk action, show a summary listing which rows refused and why, from the
  act's per-id `results`.
- A provenance column showing `submitted_from.app_version` and `platform`, `—` when
  the report was not filed from the app.
- A CSV export button labelled with the number of matching rows, calling
  `reportsToCsv(rows)` and triggering a client-side download.

Keep the existing detail-link behaviour (`detailBase` → `/orghead`,
`/unit-head`, `/org/[orgId]`) and the existing empty/error UI language.

- [ ] **Step 4: Verify types, lint, and build**

Run:
```bash
cd front
npx tsc --noEmit -p tsconfig.json
npx next lint
pnpm build
```
Expected: clean, clean, build succeeds.

- [ ] **Step 5: Run the action audit**

Run: `python3 .workbuddy-ai/tools/audit-frontend-actions.py`
Expected: `OK - every frontend server action resolves to a registered backend act`.

- [ ] **Step 6: Re-run the CSV helper test**

Run: `python3 .workbuddy-ai/tools/reports-csv-test.py`
Expected: passes — the UI task must not have changed the helper's contract.

---

### Task 7: Documentation

**Files:**
- Modify: `back/AGENTS.md`
- Modify: `back/Models.md`
- Modify: `docs/forms/08-migration-and-status.md`
- Modify: `docs/forms/08-migration-and-status-fa.md`

- [ ] **Step 1: Document the three acts and `synced_at` in `back/Models.md`**

Add to the `incident_report` section: the three oversight acts with their scopes,
the `synced_at` field on both models with the reason it is server-owned and
written once, and the note that these acts aggregate through the **raw** collection
driver because Lesan's `aggregation()` appends lookup/project stages.

- [ ] **Step 2: Document the raw-driver rule in `back/AGENTS.md`**

In the function-implementation section, alongside the existing `aggregation`
guidance, add the rule with its reason and the two projections that motivated it
(`organization: { _id: 1 }` nested, not dotted).

- [ ] **Step 3: Update the status docs**

Record the new suites, the two defects fixed, and the counts, in both the English
and Persian status documents.

- [ ] **Step 4: Final verification**

```bash
cd /Users/syd/work/madani/nejat/lesan
(cd shared/form-engine && deno test -A test/)
(cd mobile && npx vitest run && npx tsc --noEmit -p tsconfig.json && pnpm lint)
(cd back && rm -rf /tmp/btFinal && mkdir -p /tmp/btFinal && i=0; tp=0; tf=0
 for f in test/*-test.ts; do i=$((i+1)); deno test -A "$f" > /tmp/btFinal/$i.log 2>&1
  s=$(sed 's/\x1b\[[0-9;]*m//g' /tmp/btFinal/$i.log | grep -oE "[0-9]+ passed \| [0-9]+ failed" | tail -1)
  p=$(echo "$s" | grep -oE "^[0-9]+"); fl=$(echo "$s" | grep -oE "[0-9]+ failed" | grep -oE "^[0-9]+")
  tp=$((tp+${p:-0})); tf=$((tf+${fl:-0})); [ "${fl:-0}" != "0" ] && echo "FAIL $(basename $f)"
 done; echo "backend passed=$tp failed=$tf")
(cd front && npx tsc --noEmit -p tsconfig.json && npx next lint)
python3 .workbuddy-ai/tools/audit-frontend-actions.py
python3 .workbuddy-ai/tools/audit-module-acts.py
python3 .workbuddy-ai/tools/panel-routing-test.py
python3 .workbuddy-ai/tools/reports-csv-test.py
```
Expected: every suite green, every audit `OK`.

---

## Self-Review

**Spec coverage.** Spec 5.1 → Task 1. 5.2 → Task 2. 5.3 → Task 3. 5.4 → Task 4.
5.5 → Tasks 5–6. 5.6 → Task 5. Section 6 indexes → Task 7 documents them; the
index creation itself is included in Task 1's model edits and Task 2's model
edits — **this is a gap**: the spec lists
`{ sync_status: 1, date_of_accident: -1 }` on `accident` and
`{ sync_status: 1, reported_at: -1 }` on `incident_report`, which no task adds.
Fixed below.

Section 7 testing → Tasks 1–5. Section 8 migration → Tasks 1 and 7.

**Gap found and fixed:** index creation is now part of Task 1, Step 3.

**Placeholder scan.** No TBD/TODO. The `reviewTransition.ts` step says to copy the
existing guards verbatim and to match `review_history`'s exact fields — that is a
deliberate instruction to read the file, not a placeholder, because the field list
must match reality rather than my recollection.

**Type consistency.** `OversightFilters` is defined once in
`back/src/incident_report/oversight/pipeline.ts` and mirrored (camelCase) as
`OversightFilters` in `front/src/services/report-sources.ts`; the action maps
`syncStatus → sync_status` and `reviewStatus → review_status` explicitly, which is
the only place the two naming styles meet. `OversightRow` is referenced by
`reportsToCsv` and defined in Task 5 before use. `ROW_PROJECTION` is produced by
Task 2 and consumed only there. `unionPrelude` is produced in Task 4 Step 1 and
consumed by `stats.ts` in the same task.
