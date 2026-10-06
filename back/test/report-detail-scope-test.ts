/**
 * Scope for the report **detail** and **list** acts, for org leaders and everyone
 * else: `incident_report.get`, `incident_report.gets`, both `reviewHistory` acts,
 * and `accident.get`.
 *
 * Every act is driven through the real registry (`getAtcsWithServices`) with its
 * real `preAct` chain and real validator, so `grantAccess` is genuinely exercised
 * rather than bypassed — the org-leader bug was a `preAct` miss, and calling an
 * act's `fn` directly would not have caught it.
 *
 * The one assertion that matters most is the negative one: a Patrol officer reading
 * another officer's accident now fails. `accident.get` used to carry no `preAct` at
 * all and match on `_id` alone, so that request used to succeed. It is written here
 * as a failure on purpose, so the narrowing cannot be reverted unnoticed.
 */

import "./report_scope_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, ObjectId } from "@deps";
import {
	assert as structAssert,
	create as structCreate,
	jwt,
	MongoClient,
} from "@deps";
import {
	accident,
	coreApp,
	form_definition,
	getAtcsWithServices,
	incident_report,
	organization,
	road,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
let seq = 0;

const makeToken = async (userId: string) =>
	await jwt.create(
		{ alg: "HS512", typ: "JWT" },
		{ _id: userId, exp: jwt.getNumericDate(60 * 60) },
		jwtTokenKey,
	);

type ActKey =
	| ["incident_report", "get"]
	| ["incident_report", "gets"]
	| ["incident_report", "reviewHistory"]
	| ["accident", "get"]
	| ["accident", "getReportReviewHistory"];

/**
 * Invoke an act the way the server does: token → real `preAct` chain → validator →
 * `fn`. Returns the raw result; refusals surface as thrown errors.
 */
const callAct = async (
	[schema, actName]: ActKey,
	details: Document,
	userId?: ObjectId,
) => {
	const headers = new Headers();
	if (userId) headers.set("token", await makeToken(userId.toString()));
	coreApp.contextFns.addContexts({ Headers: headers } as never);

	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `${schema}.${actName} is registered`);
	for (const pre of act.preAct ?? []) await pre();

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

// `accident.get` resolves its projection through an aggregation `$project`, so an
// empty `get` is rejected by MongoDB ("must have at least one field"). Every caller
// sends a real projection; this mirrors one minimally.
const ACCIDENT_GET = { _id: 1 };

const getReport = (id: ObjectId, userId: ObjectId) =>
	callAct(["incident_report", "get"], { set: { _id: String(id) }, get: {} }, userId);

const getAccident = (id: ObjectId, userId: ObjectId) =>
	callAct(
		["accident", "get"],
		{ set: { _id: String(id) }, get: ACCIDENT_GET },
		userId,
	);

const getReportHistory = (id: ObjectId, userId: ObjectId) =>
	callAct(
		["incident_report", "reviewHistory"],
		{ set: { reportId: String(id) }, get: {} },
		userId,
	);

const getAccidentHistory = (id: ObjectId, userId: ObjectId) =>
	callAct(
		["accident", "getReportReviewHistory"],
		{ set: { reportId: String(id) }, get: {} },
		userId,
	);

const listReports = (userId: ObjectId) =>
	callAct(
		["incident_report", "gets"],
		{ set: { page: 1, limit: 200 }, get: {} },
		userId,
	) as Promise<Array<Record<string, unknown>>>;

const NOT_FOUND = "گزارش یافت نشد یا دسترسی ندارید";
const NO_ROAD_ACCESS = "شما دسترسی به گزارش‌های این سازمان ندارید";

const orgRole = (orgId: ObjectId, name: string) => ({
	roleId: String(orgId),
	name,
	scopeType: "organization" as const,
	scopeId: String(orgId),
});

const unitRole = (unitId: ObjectId, name: string) => ({
	roleId: String(unitId),
	name,
	scopeType: "unit" as const,
	scopeId: String(unitId),
});

type SeedRole = {
	name: string;
	roleId: string;
	scopeType?: "organization" | "unit";
	scopeId?: string;
};

const insertUser = async (level: string, roles: SeedRole[] = []) => {
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

/** An organization with a road, which is what every highway is. */
const insertOrg = async (name: string, withRoad = true) => {
	seq++;
	let roadId: ObjectId | undefined;
	if (withRoad) {
		roadId = (await road.insertOne({
			doc: {
				name: `جاده ${seq}`,
				area: {
					type: "MultiLineString",
					coordinates: [[[51.4, 35.7], [51.5, 35.8]]],
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			projection: { _id: 1 },
		}))!._id as ObjectId;
	}
	const orgId = (await organization.insertOne({
		doc: {
			code: `SC${RUN}-${seq}`,
			name,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: roadId ? { road: { _ids: roadId } } : undefined,
		projection: { _id: 1 },
	}))!._id as ObjectId;
	return { orgId, roadId };
};

const reviewTrail = (reviewer: ObjectId) => [
	{
		action: "approved" as const,
		action_at: new Date("2026-01-02T10:00:00Z"),
		reviewer: {
			_id: reviewer,
			first_name: "بازبین",
			last_name: "سیستمی",
		},
	},
	{
		action: "returned" as const,
		action_at: new Date("2026-01-01T10:00:00Z"),
		reviewer: {
			_id: reviewer,
			first_name: "بازبین",
			last_name: "سیستمی",
		},
	},
];

let ghostId: ObjectId;
let managerId: ObjectId;
let editorId: ObjectId;

let orgA: ObjectId;
let roadA: ObjectId;
let orgHeadA: ObjectId;
let unitHeadA: ObjectId;
let officerA1: ObjectId;
let officerA2: ObjectId;

let orgB: ObjectId;
let roadB: ObjectId;

let orgRoadless: ObjectId;
let orgHeadRoadless: ObjectId;

let formId: ObjectId;

/** An accident filed from the app: officer + organization, as the console sees it. */
const seedAccident = async (
	officer: ObjectId,
	targetOrg: ObjectId,
	targetRoad: ObjectId,
	label: string,
) => {
	seq++;
	return (await accident.insertOne({
		doc: {
			seri: seq,
			serial: seq,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: new Date(),
			dead_count: 0,
			has_witness: false,
			news_number: 0,
			officer: `نام${seq}`,
			injured_count: 0,
			completion_date: new Date(),
			sync_status: "synced",
			review_status: "submitted",
			review_history: reviewTrail(officer),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: targetOrg },
			officer: { _ids: officer },
			road: { _ids: targetRoad },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

/**
 * The **real** legacy shape, measured against the production-shaped collection: a
 * `road` and **no officer at all**. 52,809 of 52,842 accidents look like this, which
 * is what makes `"officer.level": "Patrol"` exclude them before the scope's `$or` is
 * evaluated. Seeding a legacy row *with* an officer — as the oversight list test does
 * — would model a population that does not exist and would wrongly suggest the road
 * clause works.
 */
const seedRoadlessOfOfficerAccident = async (targetRoad: ObjectId) => {
	seq++;
	return (await accident.insertOne({
		doc: {
			seri: seq,
			serial: seq,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: new Date(),
			dead_count: 0,
			has_witness: false,
			news_number: 0,
			officer: `نام${seq}`,
			injured_count: 0,
			completion_date: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { road: { _ids: targetRoad } },
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

const seedReport = async (
	officer: ObjectId,
	targetOrg: ObjectId,
	targetRoad: ObjectId,
) => {
	seq++;
	return (await incident_report.insertOne({
		doc: {
			form_definition_id: formId,
			form_title: `فرم ${seq}`,
			form_icon: "road",
			serial: seq,
			report_id: `INC-${RUN}-${seq}`,
			reported_at: new Date(),
			description: `شرح ${seq}`,
			sync_status: "synced",
			review_status: "submitted",
			review_history: reviewTrail(officer),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: targetOrg },
			officer: { _ids: officer },
			road: { _ids: targetRoad },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

const enableAllModules = async (id: ObjectId) => {
	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	const headers = new Headers();
	headers.set("token", await makeToken(id.toString()));
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main["app_modules"]["setModules"];
	assertExists(act);
	for (const pre of act.preAct ?? []) await pre();
	const validated = structCreate({
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	} as Document, act.validator as never);
	await act.fn({
		service: "main",
		model: "app_modules",
		act: "setModules",
		details: validated,
	} as never);
};

let reportA: ObjectId;
let reportB: ObjectId;
let accidentA1: ObjectId;
let accidentA2: ObjectId;
let accidentB: ObjectId;
let legacyAccident: ObjectId;

Deno.test("report scope fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	editorId = await insertUser("Editor");

	const a = await insertOrg(`سازمان الف ${RUN}`);
	orgA = a.orgId;
	roadA = a.roadId as ObjectId;
	orgHeadA = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
	officerA1 = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	officerA2 = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);

	// The unit-scoped path `getScopedOrgIds` has to resolve for a UnitHead.
	const unitA = (await unit.insertOne({
		doc: {
			code: `SU${RUN}-1`,
			name: `واحد الف ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgA, relatedRelations: { units: true } },
			officers: { _ids: [officerA1, officerA2] },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
	unitHeadA = await insertUser("UnitHead", [unitRole(unitA, "UnitHead")]);

	const b = await insertOrg(`سازمان ب ${RUN}`);
	orgB = b.orgId;
	roadB = b.roadId as ObjectId;
	const officerB = await insertUser("Patrol", [orgRole(orgB, "Patrol")]);
	await unit.insertOne({
		doc: {
			code: `SU${RUN}-2`,
			name: `واحد ب ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgB, relatedRelations: { units: true } },
			officers: { _ids: [officerB] },
		},
		projection: { _id: 1 },
	});

	// A roadless organization: the one scope failure `getOrgReportBase` reports by
	// throwing rather than by matching nothing.
	const c = await insertOrg(`سازمان بی‌جاده ${RUN}`, false);
	orgRoadless = c.orgId;
	orgHeadRoadless = await insertUser("OrgHead", [orgRole(orgRoadless, "OrgHead")]);

	formId = (await form_definition.insertOne({
		doc: {
			name: `فرم ${RUN}`,
			status: "active",
			form_kind: "incident_report",
			definition: { schemaVersion: 1, name: `فرم ${RUN}` },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { organization: { _ids: orgA } },
		projection: { _id: 1 },
	}))!._id as ObjectId;

	reportA = await seedReport(officerA1, orgA, roadA);
	reportB = await seedReport(officerB, orgB, roadB);
	accidentA1 = await seedAccident(officerA1, orgA, roadA, "a1");
	accidentA2 = await seedAccident(officerA2, orgA, roadA, "a2");
	accidentB = await seedAccident(officerB, orgB, roadB, "b");
	legacyAccident = await seedRoadlessOfOfficerAccident(roadA);

	await enableAllModules(ghostId);
});

// --- Rows 1–3: the detail act, for both org-leader levels ---------------------

Deno.test("row 1: an OrgHead reads a report from their own organization", async () => {
	const report = await getReport(reportA, orgHeadA) as Record<string, unknown>;
	assertEquals(String(report._id), String(reportA));
});

Deno.test("row 2: an OrgHead is refused a report from another organization", async () => {
	await assertRejects(() => getReport(reportB, orgHeadA), Error, NOT_FOUND);
});

Deno.test("row 3: a UnitHead matches the OrgHead on both", async () => {
	const own = await getReport(reportA, unitHeadA) as Record<string, unknown>;
	assertEquals(String(own._id), String(reportA));
	await assertRejects(() => getReport(reportB, unitHeadA), Error, NOT_FOUND);
});

// --- Row 4: the list ---------------------------------------------------------

Deno.test("row 4: an OrgHead lists exactly their organization's reports", async () => {
	const ids = (await listReports(orgHeadA)).map((row) => String(row._id));
	assert(ids.includes(String(reportA)), "their own organization's report is listed");
	assert(
		!ids.includes(String(reportB)),
		"another organization's report is not",
	);
});

// --- Row 5: both review-history acts -----------------------------------------

Deno.test("row 5: both reviewHistory acts return the trail to an org leader", async () => {
	const reports = await getReportHistory(reportA, orgHeadA) as Array<
		Record<string, unknown>
	>;
	assertEquals(reports.length, 2, "incident_report trail");
	assertEquals(String(reports[0].action), "approved", "newest action first");

	const accidents = await getAccidentHistory(accidentA1, orgHeadA) as Array<
		Record<string, unknown>
	>;
	assertEquals(accidents.length, 2, "accident trail");

	await assertRejects(
		() => getReportHistory(reportB, orgHeadA),
		Error,
		NOT_FOUND,
		"another organization's trail is still refused",
	);
});

// --- Row 6: the narrowing, asserted as a failure ------------------------------

Deno.test("row 6: a Patrol officer reads their own accident, not another's", async () => {
	const own = await getAccident(accidentA1, officerA1) as Array<
		Record<string, unknown>
	>;
	assertEquals(own.length, 1, "their own report opens");
	assertEquals(String(own[0]._id), String(accidentA1));

	// This used to succeed: `accident.get` had no `preAct` and matched `_id` alone.
	const other = await getAccident(accidentA2, officerA1) as Array<
		Record<string, unknown>
	>;
	assertEquals(
		other.length,
		0,
		"another officer's report is now refused — the narrowing working",
	);
});

// --- Row 7: the patrol history act must not regress --------------------------

Deno.test("row 7: a Patrol officer's own history still resolves", async () => {
	const trail = await getAccidentHistory(accidentA1, officerA1) as Array<
		Record<string, unknown>
	>;
	assertEquals(trail.length, 2);
	await assertRejects(
		() => getAccidentHistory(accidentA2, officerA1),
		Error,
		NOT_FOUND,
	);
});

// --- Row 8: Manager and Ghost are unchanged -----------------------------------

Deno.test("row 8: Manager and Ghost keep every patrol report", async () => {
	for (const actor of [managerId, ghostId]) {
		for (const id of [accidentA1, accidentA2, accidentB]) {
			const rows = await getAccident(id, actor) as Array<
				Record<string, unknown>
			>;
			assertEquals(rows.length, 1, `row ${String(id)} for ${String(actor)}`);
		}
		const own = await getReport(reportA, actor) as Record<string, unknown>;
		assertEquals(String(own._id), String(reportA));
	}
});

// --- Row 9: Editor stays refused at the gate ----------------------------------

Deno.test("row 9: an Editor is still refused at the gate", async () => {
	await assertRejects(
		() => getReport(reportA, editorId),
		Error,
		"You cant do this",
	);
	await assertRejects(
		() =>
			callAct(
				["accident", "get"],
				{ set: { _id: String(accidentA1) }, get: ACCIDENT_GET },
				editorId,
			),
		Error,
		"You cant do this",
	);
});

// --- Row 10: the zero-road organization ---------------------------------------

Deno.test("row 10: a zero-road org leader is refused loudly on get/gets", async () => {
	await assertRejects(
		() => getReport(reportA, orgHeadRoadless),
		Error,
		NO_ROAD_ACCESS,
	);
	await assertRejects(
		() => listReports(orgHeadRoadless),
		Error,
		NO_ROAD_ACCESS,
	);
});

Deno.test("row 10: the same zero-road leader gets an empty trail, not an error", async () => {
	// The asymmetry is deliberate and asserted on both sides: a *report* request
	// refuses, a *history* sub-resource degrades to `[]`.
	assertEquals(await getReportHistory(reportA, orgHeadRoadless), []);
	assertEquals(await getAccidentHistory(accidentA1, orgHeadRoadless), []);
});

// --- Task 4: what the org-leader scope actually reaches ----------------------

Deno.test("task 4: the road clause cannot reach a legacy row with no officer", async () => {
	// On organization A's road, so the road clause would match if the scope ever got
	// that far — it does not, because `"officer.level": "Patrol"` excludes the row
	// first. 52,809 of the 52,842 accidents in the live collection have this shape.
	for (const actor of [orgHeadA, unitHeadA, managerId, ghostId]) {
		const rows = await getAccident(legacyAccident, actor) as Array<
			Record<string, unknown>
		>;
		assertEquals(rows.length, 0, `legacy row hidden from ${String(actor)}`);
	}
});

Deno.test("cleanup report scope database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_report_scope_test");
	for (const c of await db.listCollections().toArray()) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
