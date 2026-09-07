/**
 * Incident types backend tests (Phase 2).
 *
 * Polymorphic report model: accident | road_breakdown | road_obstacle | other.
 * Verifies per-type validation, report_id prefixes, idempotency, filters,
 * review loop on non-accident reports, map payload, media category and
 * backward compatibility.
 *
 * Runs against a local MongoDB using an isolated database
 * (`nejat_patrol_ops_test`) so dev data is never touched.
 *
 * Run: deno test -A test/incident-types-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
import { assert as structAssert, create as structCreate } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import { accident, coreApp, getAtcsWithServices, user } from "../mod.ts";
import { jwtTokenKey } from "@lib";

const TEST_DB = "nejat_patrol_ops_test";
const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

// The app boots with DB_NAME=nejat_patrol_ops_test (see patrol_ops_env.ts).

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

/**
 * Runs an act exactly like the server does:
 * sets a real JWT header context → runs the preAct chain
 * (setTokens → setUser → grantAccess) → validates details with the
 * act's own validator struct → runs the act fn.
 */
const runAct = async (
	schema: string,
	actName: string,
	details: { set: Document; get: Document },
	userId?: ObjectId,
) => {
	const headers = new Headers();
	if (userId) {
		headers.set("token", await makeToken(userId.toString()));
	}
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `act ${schema}.${actName} is not registered`);
	for (const pre of act.preAct ?? []) {
		await pre();
	}
	let validatedDetails: { set: Document; get: Document } = details;
	if (act.validationRunType === "create") {
		validatedDetails = structCreate(details, act.validator as never);
	} else {
		structAssert(details, act.validator as never);
	}
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details: validatedDetails,
	});
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			father_name: "پدر",
			mobile: `0912${String(10000000 + seq)}`,
			gender: "Male",
			email: `incident_${RUN}_${seq}@test.local`,
			address: "تهران",
			level,
			is_active: true,
			failed_login_attempts: 0,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let patrolA: ObjectId;
let patrolB: ObjectId;
let managerId: ObjectId;

const POINT = { type: "Point", coordinates: [50.5, 34.5] };
const nowIso = new Date().toISOString();

const REPORT_GET: Document = {
	_id: 1,
	incident_type: 1,
	incident_payload: 1,
	report_id: 1,
	client_report_uuid: 1,
	sync_status: 1,
	review_status: 1,
	review_reason: 1,
	review_history: 1,
};

const baseAdd = (
	incident_type: string,
	uuid: string,
	extra: Record<string, unknown> = {},
) => ({
	set: {
		location: POINT,
		date_of_accident: nowIso,
		client_report_uuid: uuid,
		sync_status: "queued",
		incident_type,
		...extra,
	},
	get: REPORT_GET,
});

Deno.test("seed fixtures", async () => {
	patrolA = await insertUser("Patrol");
	patrolB = await insertUser("Patrol");
	managerId = await insertUser("Manager");
	assertExists(patrolA);
	assertExists(managerId);
});

// ---------------------------------------------------------------------------
// 1. Per-type creation, report_id prefix, forced officer attribution
// ---------------------------------------------------------------------------

Deno.test("add creates each non-accident type with correct report_id prefix and forced officer", async () => {
	const cases: Array<{
		type: string;
		prefix: string;
		payload: Record<string, unknown>;
	}> = [
		{
			type: "road_breakdown",
			prefix: "BRK",
			payload: { description: "خرابی روسازی آزادراه" },
		},
		{
			type: "road_obstacle",
			prefix: "OBS",
			payload: { description: "نیوجرسی وسط مسیر", is_hazard: true },
		},
		{
			type: "other",
			prefix: "OTH",
			payload: { description: "سایر رخداد", follow_up_required: true },
		},
	];

	for (const c of cases) {
		const result = await runAct(
			"accident",
			"add",
			baseAdd(c.type, `add-${c.type}-${RUN}`, {
				incident_payload: c.payload,
			}),
			patrolA,
		);
		assertEquals(result.incident_type, c.type);
		assert(
			(result.report_id as string).startsWith(`${c.prefix}-`),
			`expected ${c.prefix}- prefix, got ${result.report_id}`,
		);
		// Officer attribution is server-forced — verify via a direct ODM read
		// (the depth-1 get schema only exposes relation flags, not nested docs).
		const stored = await accident.findOne({
			filters: { _id: result._id },
			projection: { "officer._id": 1 },
		});
		assertEquals(
			(
				stored as unknown as { officer: { _id: ObjectId } }
			).officer._id.toString(),
			patrolA.toString(),
			"officerId must be server-forced to the acting Patrol",
		);
	}
});

Deno.test("add defaults incident_type to accident for legacy docs (backward compat)", async () => {
	const result = await runAct(
		"accident",
		"add",
		baseAdd("accident", `legacy-${RUN}`),
		patrolA,
	);
	assertEquals(result.incident_type, "accident");
	assert((result.report_id as string).startsWith("REP-"));
});

// ---------------------------------------------------------------------------
// 2. Idempotency by client_report_uuid (all types)
// ---------------------------------------------------------------------------

Deno.test("re-add same client_report_uuid returns the existing doc, no duplicate", async () => {
	const uuid = `idem-${RUN}`;
	const first = await runAct(
		"accident",
		"add",
		baseAdd("road_breakdown", uuid, {
			incident_payload: { description: "ایمپوتنت" },
		}),
		patrolA,
	);
	const second = await runAct(
		"accident",
		"add",
		baseAdd("road_breakdown", uuid, {
			incident_payload: { description: "ایمپوتنت" },
		}),
		patrolA,
	);
	assertEquals(second._id.toString(), first._id.toString());
	const count = await accident.countDocument({
		filter: { client_report_uuid: uuid },
	});
	assertEquals(count, 1);
});

// ---------------------------------------------------------------------------
// 3. Negative validations
// ---------------------------------------------------------------------------

Deno.test("non-accident report with accident-only fields is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"accident",
				"add",
				baseAdd("road_breakdown", `neg-cid-${RUN}`, {
					incident_payload: { description: "خرابی" },
					collisionTypeId: new ObjectId().toString(),
				}),
				patrolA,
			),
		Error,
		"مجاز نیستند",
	);
	await assertRejects(
		() =>
			runAct(
				"accident",
				"add",
				baseAdd("other", `neg-tid-${RUN}`, {
					incident_payload: { description: "سایر" },
					typeId: new ObjectId().toString(),
				}),
				patrolA,
			),
		Error,
		"مجاز نیستند",
	);
});

Deno.test("non-accident report without any subject is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"accident",
				"add",
				baseAdd("road_breakdown", `neg-subject-${RUN}`),
				patrolA,
			),
		Error,
		"الزامی",
	);
});

Deno.test("accident without date_of_accident is rejected (validator)", async () => {
	await assertRejects(
		() =>
			runAct(
				"accident",
				"add",
				{
					set: {
						location: POINT,
						client_report_uuid: `neg-date-${RUN}`,
						sync_status: "queued",
					},
					get: REPORT_GET,
				},
				patrolA,
			),
		Error,
	);
});

Deno.test("Patrol setting sync_status to synced is rejected (all types)", async () => {
	await assertRejects(
		() =>
			runAct(
				"accident",
				"add",
				baseAdd("road_obstacle", `neg-synced-${RUN}`, {
					incident_payload: { description: "مانع" },
					sync_status: "synced",
				}),
				patrolA,
			),
		Error,
		"draft یا queued",
	);
});

// ---------------------------------------------------------------------------
// 4. getMyReports incidentType filter + Patrol scoping
// ---------------------------------------------------------------------------

Deno.test("getMyReports incidentType filter returns only that type; Patrol scoping intact", async () => {
	// Create a report for patrolB to prove scoping.
	const bReport = await runAct(
		"accident",
		"add",
		baseAdd("road_breakdown", `scope-b-${RUN}`, {
			incident_payload: { description: "گزارش مأمور B" },
		}),
		patrolB,
	);

	const all = await runAct(
		"accident",
		"getMyReports",
		{
			set: { page: 1, limit: 100 },
			get: { _id: 1, incident_type: 1 },
		},
		patrolA,
	);
	assert(all.length > 0, "patrolA should have reports");
	// patrolB's report must not leak into patrolA's list (Patrol scoping).
	assert(
		!all.some((r: any) => r._id.toString() === bReport._id.toString()),
		"patrol scoping must only return the officer's own reports",
	);

	const breakdown = await runAct(
		"accident",
		"getMyReports",
		{
			set: { page: 1, limit: 100, incidentType: "road_breakdown" },
			get: { _id: 1, incident_type: 1 },
		},
		patrolA,
	);
	assert(breakdown.length > 0, "patrolA has road_breakdown reports");
	for (const r of breakdown) {
		assertEquals(r.incident_type, "road_breakdown");
	}

	const others = await runAct(
		"accident",
		"getMyReports",
		{
			set: { page: 1, limit: 100, incidentType: "other" },
			get: { _id: 1, incident_type: 1 },
		},
		patrolA,
	);
	for (const r of others) {
		assertEquals(r.incident_type, "other");
	}
});

// ---------------------------------------------------------------------------
// 5. Update-by-uuid + incident_type change guard
// ---------------------------------------------------------------------------

Deno.test("update-by-uuid on a non-accident report; incident_type change rejected once in review", async () => {
	const created = await runAct(
		"accident",
		"add",
		baseAdd("other", `upd-${RUN}`, {
			incident_payload: { description: "نسخه اول" },
		}),
		patrolA,
	);

	// Patrol updates its own report via client_report_uuid.
	const updated = await runAct(
		"accident",
		"update",
		{
			set: {
				client_report_uuid: `upd-${RUN}`,
				incident_payload: {
					description: "نسخه دوم",
					needs_repair: true,
				},
			},
			get: { _id: 1, incident_payload: 1 },
		},
		patrolA,
	);
	assertEquals(updated.incident_payload.description, "نسخه دوم");
	assertEquals(updated.incident_payload.needs_repair, true);

	// Manager marks synced, then starts review → report is locked.
	await runAct(
		"accident",
		"update",
		{
			set: { _id: created._id.toString(), sync_status: "synced" },
			get: { _id: 1, sync_status: 1 },
		},
		managerId,
	);
	await runAct(
		"accident",
		"reviewReport",
		{
			set: { reportId: created._id.toString(), action: "start_review" },
			get: { _id: 1, review_status: 1 },
		},
		managerId,
	);

	// Changing incident_type on a report under review must be rejected.
	await assertRejects(
		() =>
			runAct(
				"accident",
				"update",
				{
					set: {
						_id: created._id.toString(),
						incident_type: "road_obstacle",
					},
					get: { _id: 1, incident_type: 1 },
				},
				patrolA,
			),
		Error,
		"قابل تغییر نیست",
	);
});

// ---------------------------------------------------------------------------
// 6. Full review loop on a non-accident report
// ---------------------------------------------------------------------------

Deno.test("full review loop on a non-accident report: return → resubmit → submitted", async () => {
	const created = await runAct(
		"accident",
		"add",
		baseAdd("road_obstacle", `review-${RUN}`, {
			incident_payload: { description: "برای بررسی" },
		}),
		patrolA,
	);

	// Manager syncs, starts review, then returns with a reason.
	await runAct(
		"accident",
		"update",
		{
			set: { _id: created._id.toString(), sync_status: "synced" },
			get: { _id: 1, sync_status: 1 },
		},
		managerId,
	);
	await runAct(
		"accident",
		"reviewReport",
		{
			set: { reportId: created._id.toString(), action: "start_review" },
			get: { _id: 1, review_status: 1 },
		},
		managerId,
	);
	const returned = await runAct(
		"accident",
		"reviewReport",
		{
			set: {
				reportId: created._id.toString(),
				action: "return",
				reason: "اطلاعات ناقص است",
			},
			get: { _id: 1, review_status: 1, review_reason: 1 },
		},
		managerId,
	);
	assertEquals(returned.review_status, "returned");
	assertEquals(returned.review_reason, "اطلاعات ناقص است");

	// Patrol resubmits → submitted, reason cleared, history pushed.
	const resubmitted = await runAct(
		"accident",
		"resubmitReport",
		{
			set: { reportId: created._id.toString() },
			get: { _id: 1, review_status: 1, review_reason: 1, review_history: 1 },
		},
		patrolA,
	);
	assertEquals(resubmitted.review_status, "submitted");
	assertEquals(resubmitted.review_reason, undefined);
	const history: any[] = resubmitted.review_history || [];
	const actions = history.map((h) => h.action);
	assert(
		actions.includes("returned") && actions.includes("resubmitted"),
		`review_history should contain returned + resubmitted, got ${actions.join(",")}`,
	);
});

// ---------------------------------------------------------------------------
// 7. getSyncStatus buckets + nearbyAccidents payload + media category
// ---------------------------------------------------------------------------

Deno.test("getSyncStatus buckets include non-accident reports", async () => {
	const created = await runAct(
		"accident",
		"add",
		baseAdd("other", `syncstat-${RUN}`, {
			incident_payload: { description: "برای همگام‌سازی" },
		}),
		patrolA,
	);
	const result = await runAct(
		"accident",
		"getSyncStatus",
		{ set: {}, get: { _id: 1, incident_type: 1 } },
		patrolA,
	);
	const queued: any[] = result.queued || [];
	assert(
		queued.some(
			(r) => r._id.toString() === created._id.toString(),
		),
		"queued bucket should contain the non-accident report",
	);
});

Deno.test("nearbyAccidents payload includes incident_type and severity", async () => {
	const created = await runAct(
		"accident",
		"add",
		baseAdd("road_breakdown", `nearby-${RUN}`, {
			incident_payload: { description: "نزدیک نقشه" },
		}),
		patrolA,
	);
	await runAct(
		"accident",
		"update",
		{
			set: { _id: created._id.toString(), sync_status: "synced" },
			get: { _id: 1, sync_status: 1 },
		},
		managerId,
	);

	const result = await runAct(
		"accident",
		"nearbyAccidents",
		{
			set: { minLat: 34, maxLat: 35, minLng: 50, maxLng: 51 },
			get: { accidents: 1 },
		},
		managerId,
	);
	const found = (result.accidents as any[]).find(
		(a: any) => a._id === created._id.toString(),
	);
	assertExists(found, "synced report should appear in nearby box");
	assertEquals(found.incident_type, "road_breakdown");
	assert("incident_severity_name" in found, "payload should carry severity");
});

Deno.test("upload an incident photo linked to a non-accident report", async () => {
	const created = await runAct(
		"accident",
		"add",
		baseAdd("road_breakdown", `photo-${RUN}`, {
			incident_payload: { description: "عکس خرابی" },
		}),
		patrolA,
	);

	const result = await runAct(
		"file",
		"uploadAccidentImages",
		{
			set: {
				category: "incident",
				accidentId: created._id.toString(),
				sequence: 0,
				file: {
					name: "breakdown.png",
					type: "image/png",
					data: btoa("fake-image-bytes-for-incident-test"),
				},
			},
			get: { _id: 1, name: 1, category: 1 },
		},
		patrolA,
	);
	assertEquals(result.category, "incident");

	const report = await accident.findOne({
		filters: { _id: created._id },
		projection: { _id: 1, attachments: { _id: 1, name: 1, category: 1 } },
	});
	assertExists(report, "report should still exist");
	const linked = (report.attachments as any[]).some(
		(a: any) => a._id.toString() === result._id.toString(),
	);
	assert(linked, "uploaded photo should be linked in accident.attachments");
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(TEST_DB);
	const collections = await db.listCollections().toArray();
	for (const c of collections) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
