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
import {
	accident,
	coreApp,
	getAtcsWithServices,
	incident_report,
	organization,
	road,
	user,
} from "../mod.ts";
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
		results: Array<
			{
				reportId: string;
				ok: boolean;
				error?: string;
				review_status?: string;
			}
		>;
	};

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;
let seq = 0;

const orgRole = (org: ObjectId, name: string) => ({
	roleId: String(org),
	name,
	scopeType: "organization" as const,
	scopeId: String(org),
});

const insertUser = async (
	level: string,
	roles: Array<{
		roleId: string;
		name: string;
		scopeType: "organization";
		scopeId: string;
	}> = [],
) => {
	seq++;
	return (await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(80000000 + seq)}`,
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

/** A report that never reached the server as a filed report — review refuses it. */
const seedUnfiledReport = async (label: string) =>
	(await incident_report.insertOne({
		doc: {
			form_definition_id: new ObjectId(),
			form_title: label,
			serial: ++seq,
			report_id: `INC-${RUN}-${seq}`,
			reported_at: new Date(),
			sync_status: "draft",
			review_status: "submitted",
			location: { type: "Point", coordinates: [51.4, 35.7] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { officer: { _ids: patrolId } },
		projection: { _id: 1 },
	}))!._id as ObjectId;

/**
 * A report the console is holding whose arrival instant was never recorded.
 *
 * `queued` is what every app-filed report used to be born as, and it is still what a
 * row filed before the arrival was stamped looks like — so it has to stay reviewable,
 * or the queue it sits in can never be worked.
 */
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

// ---------------------------------------------------------------------------
// Cross-organization isolation
// ---------------------------------------------------------------------------
//
// The refusal this console exists to prevent is only reachable by an org leader.
// `getOrgReportBase` hands a Manager every patrol report, so a Manager has nothing
// to be refused; an OrgHead is narrowed to their own organization, by
// `organization._id` or by the organization's road. Every fixture below is
// therefore filed the way the app files one — linked to an organization *and*
// sitting on that organization's road — because a fixture with only one of the two
// links could be refused for the wrong reason, and one with neither would be
// refused even with a correct scope.

let orgA: ObjectId;
let roadA: ObjectId;
let orgHeadA: ObjectId;
let orgB: ObjectId;
let roadB: ObjectId;
let officerA: ObjectId;

/**
 * Two organizations, each with its own road, plus organization A's leader.
 *
 * Built on first use rather than in the file's fixtures test, so running a single
 * isolation test with `--filter` still has what it needs.
 */
const ensureIsolationFixtures = async () => {
	if (orgHeadA) return;

	const mkOrg = async (label: string) => {
		seq++;
		// The road is created first: `road` defines no `organization` relation of its
		// own (Lesan auto-creates that reverse from `organization.road`), so the link
		// can only be written from the organization side.
		const roadId = (await road.insertOne({
			doc: {
				name: `جاده ${label} ${RUN}`,
				// `road.area` is required, and an org reaches its reports through
				// `organization.road` rather than through geometry.
				area: {
					type: "MultiLineString",
					coordinates: [[[51.4, 35.7], [51.5, 35.8]]],
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			projection: { _id: 1 },
		}))!._id as ObjectId;
		const orgId = (await organization.insertOne({
			doc: {
				code: `ISO${RUN}-${label}`,
				name: `سازمان ${label} ${RUN}`,
				description: "",
				is_active: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations: { road: { _ids: roadId } },
			projection: { _id: 1 },
		}))!._id as ObjectId;
		return { orgId, roadId };
	};

	const a = await mkOrg("A");
	orgA = a.orgId;
	roadA = a.roadId;
	const b = await mkOrg("B");
	orgB = b.orgId;
	roadB = b.roadId;

	officerA = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	orgHeadA = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
};

/** An app-filed report: synced, awaiting review, linked to an organization. */
const seedOrgReport = async (
	label: string,
	org: ObjectId,
	roadId: ObjectId,
	officer: ObjectId,
) => {
	seq++;
	return (await incident_report.insertOne({
		doc: {
			form_definition_id: new ObjectId(),
			form_title: label,
			serial: seq,
			report_id: `INC-${RUN}-iso-${seq}`,
			reported_at: new Date(),
			sync_status: "synced",
			review_status: "submitted",
			location: { type: "Point", coordinates: [51.4, 35.7] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: org },
			officer: { _ids: officer },
			road: { _ids: roadId },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

/** The accident half of the union, in the same shape as `seedOrgReport`. */
const seedOrgAccident = async (
	org: ObjectId,
	roadId: ObjectId,
	officer: ObjectId,
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
			injured_count: 0,
			completion_date: new Date(),
			sync_status: "synced",
			review_status: "submitted",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: org },
			officer: { _ids: officer },
			road: { _ids: roadId },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

/** Read a row's stored state back, which is what "untouched" has to mean. */
const storedReportStatus = async (id: ObjectId) =>
	((await incident_report.findOne({
		filters: { _id: id },
		projection: { review_status: 1 },
	})) as { review_status?: string } | null)?.review_status;

const storedAccidentStatus = async (id: ObjectId) =>
	((await accident.findOne({
		filters: { _id: id },
		projection: { review_status: 1 },
	})) as { review_status?: string } | null)?.review_status;

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

	assertEquals(
		results.filter((row) => row.ok).length,
		2,
		"both transitioned",
	);
	const stored = await incident_report.find({
		filters: { _id: { $in: [first, second] } },
		projection: { review_status: 1 },
	}).toArray();
	assert(
		stored.every((row) =>
			(row as { review_status?: string }).review_status === "under_review"
		),
		"both are under review",
	);
});

Deno.test(
	"bulk review reports per-row outcomes instead of failing the batch",
	async () => {
		const good = await seedSyncedReport("bulk-good");
		const unfiled = await seedUnfiledReport("bulk-draft");

		const { results } = await reviewReports(
			{
				reportIds: [String(good), String(unfiled)],
				action: "start_review",
			},
			managerId,
		);

		assertEquals(results.length, 2, "one outcome per requested id");
		const goodResult = results.find((row) => row.reportId === String(good));
		const badResult = results.find((row) =>
			row.reportId === String(unfiled)
		);
		assert(goodResult?.ok, "the eligible row succeeded");
		assert(!badResult?.ok, "the unfiled row was refused");
		assert(
			(badResult?.error ?? "").includes("همگام"),
			`the refusal explains why: ${badResult?.error}`,
		);
	},
);

// The exact chain that used to be impossible, filed the way the app files it.
//
// A report from the app was born `queued`; only a Manager could write `synced`; no
// console action did; and the review gate refuses anything but `synced`. So a report
// the console could see could never be moved, and the reviewer was answered with
// «تغییر وضعیت گزارش از submitted امکانپذیر نیست» — the state machine's own message
// for a transition that was never the problem.
Deno.test("an app-filed accident is reviewable without any manual sync step", async () => {
	const uuid = `uuid-${RUN}-chain`;
	await callAct("accident", "add", {
		client_report_uuid: uuid,
		location: { type: "Point", coordinates: [51.4, 35.7] },
		date_of_accident: new Date().toISOString(),
	}, patrolId);

	const row = await accident.findOne({
		filters: { client_report_uuid: uuid },
		projection: { _id: 1, sync_status: 1, review_status: 1 },
	}) as {
		_id: ObjectId;
		sync_status?: string;
		review_status?: string;
	};
	assertEquals(row.sync_status, "synced", "filing the report is the sync");
	assertEquals(row.review_status, "submitted");

	const started = await reviewReports(
		{ reportIds: [String(row._id)], action: "start_review" },
		managerId,
	);
	assert(
		started.results[0].ok,
		`start_review must be accepted: ${started.results[0].error}`,
	);

	const approved = await reviewReports(
		{ reportIds: [String(row._id)], action: "approve" },
		managerId,
	);
	assert(
		approved.results[0].ok,
		`approve must be accepted: ${approved.results[0].error}`,
	);

	const stored = await accident.findOne({
		filters: { _id: row._id },
		projection: { review_status: 1, sync_status: 1 },
	}) as { review_status?: string; sync_status?: string };
	assertEquals(stored.review_status, "approved");
	assertEquals(stored.sync_status, "synced");
});

// The state that used to be the dead end, and is now the acknowledgement.
Deno.test("a queued report is reviewable, and the review acknowledges it", async () => {
	const target = await seedQueuedReport("bulk-ack");

	const { results } = await reviewReports(
		{ reportIds: [String(target)], action: "start_review" },
		managerId,
	);
	assert(
		results[0].ok,
		`a row the console is holding must be reviewable: ${results[0].error}`,
	);

	const stored = await incident_report.findOne({
		filters: { _id: target },
		projection: { review_status: 1, sync_status: 1, synced_at: 1 },
	}) as { review_status?: string; sync_status?: string; synced_at?: Date };

	assertEquals(stored.review_status, "under_review");
	assertEquals(
		stored.sync_status,
		"synced",
		"starting the review is the acknowledgement it was waiting for",
	);
	assert(
		stored.synced_at instanceof Date,
		"and the acknowledgement instant is recorded, once",
	);
});

Deno.test("bulk return requires a reason for the whole batch", async () => {
	const target = await seedSyncedReport("bulk-reason");
	await reviewReports(
		{ reportIds: [String(target)], action: "start_review" },
		managerId,
	);

	let error = "";
	try {
		await reviewReports(
			{ reportIds: [String(target)], action: "return" },
			managerId,
		);
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
		{
			reportIds: [String(first), String(second)],
			action: "return",
			reason: "توضیح بیشتر",
		},
		managerId,
	);

	const stored = await incident_report.find({
		filters: { _id: { $in: [first, second] } },
		projection: { review_status: 1, review_reason: 1 },
	}).toArray();
	assert(
		stored.every((row) => {
			const entry = row as {
				review_status?: string;
				review_reason?: string;
			};
			return entry.review_status === "returned" &&
				entry.review_reason === "توضیح بیشتر";
		}),
		"both rows carry the reason and the returned state",
	);
});

Deno.test("a patrol officer cannot bulk review", async () => {
	const target = await seedSyncedReport("bulk-guard");

	let error = "";
	try {
		await reviewReports(
			{ reportIds: [String(target)], action: "approve" },
			patrolId,
		);
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

// `accident.reviewReport` is the one-report surface of the same machine. It used to
// be a copy of it, and the copy drifted — it kept refusing a `queued` row after the
// shared machine learned to acknowledge one, so the same click answered differently
// depending on which model the row happened to be.
Deno.test("the single accident act runs the shared machine, gate included", async () => {
	const target = (await accident.insertOne({
		doc: {
			seri: ++seq,
			serial: ++seq,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: new Date(),
			sync_status: "queued",
			review_status: "submitted",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { officer: { _ids: patrolId } },
		projection: { _id: 1 },
	}))!._id as ObjectId;

	await callAct("accident", "reviewReport", {
		reportId: String(target),
		action: "start_review",
	}, managerId);

	const stored = await accident.findOne({
		filters: { _id: target },
		projection: { review_status: 1, sync_status: 1 },
	}) as { review_status?: string; sync_status?: string };
	assertEquals(stored.review_status, "under_review");
	assertEquals(
		stored.sync_status,
		"synced",
		"and it acknowledges the arrival the same way the batch does",
	);
});

// The extraction exists so the two surfaces cannot drift, so pin the artefact they
// share: the history entry the transition appends. Compared field by field rather
// than deep-equal, because `action_at` is a real instant and two calls can never
// produce the same one.
Deno.test("bulk and single review leave the same history trail", async () => {
	const single = await seedSyncedReport("hist-single");
	const batched = await seedSyncedReport("hist-batch");

	await callAct("incident_report", "reviewReport", {
		reportId: String(single),
		action: "start_review",
	}, managerId);
	await reviewReports(
		{ reportIds: [String(batched)], action: "start_review" },
		managerId,
	);

	const firstEntry = async (id: ObjectId) =>
		((await incident_report.findOne({
			filters: { _id: id },
			projection: { review_history: 1 },
		})) as { review_history?: Array<Record<string, unknown>> })
			.review_history?.[0];

	const one = await firstEntry(single);
	const many = await firstEntry(batched);
	assertExists(one, "the single act recorded the transition");
	assertExists(many, "the batch act recorded the transition");

	assertEquals(
		Object.keys(many).sort(),
		Object.keys(one).sort(),
		"the batch writes the same fields the single act writes — the reviewer snapshot included",
	);
	assertEquals(many["action"], "started_review", "and the same action label");
	assert(
		"reason" in many,
		"reason is a field of every entry, not only of a return",
	);
	assert(many["action_at"] instanceof Date, "the instant is a real Date");

	const reviewer = many["reviewer"] as {
		_id: unknown;
		first_name: string;
		last_name: string;
	};
	const managerRow = (await user.findOne({
		filters: { _id: managerId },
		projection: { first_name: 1, last_name: 1 },
	})) as { first_name?: string; last_name?: string };
	assertEquals(
		String(reviewer._id),
		String(managerId),
		"the reviewer is the caller",
	);
	assertEquals(reviewer.first_name, managerRow.first_name);
	assertEquals(reviewer.last_name, managerRow.last_name);
});

// A batch is only interesting if the rows in it are not all the same. Here the only
// difference between the two rows is whose organization they belong to, so the
// scope is the only thing that can separate them — which is what makes these the
// tests that would catch a scope dropped out of the per-row read.
Deno.test("an org head cannot review another organization's report", async () => {
	await ensureIsolationFixtures();
	const mine = await seedOrgReport("iso-mine", orgA, roadA, officerA);
	const theirs = await seedOrgReport("iso-theirs", orgB, roadB, officerA);

	const { results } = await reviewReports(
		{ reportIds: [String(mine), String(theirs)], action: "start_review" },
		orgHeadA,
	);

	const mineRow = results.find((row) => row.reportId === String(mine));
	const theirRow = results.find((row) => row.reportId === String(theirs));

	// The leader's own row must succeed, or "theirs was refused" proves nothing —
	// a scope that refused everything would satisfy it.
	assert(mineRow?.ok, "the leader's own organization is reviewed");
	assert(!theirRow?.ok, "another organization's report is refused");
	assert(
		(theirRow?.error ?? "").includes("دسترسی"),
		`the refusal names the scope, got: ${theirRow?.error}`,
	);

	// Stronger than the message: the row is untouched in the database, so a batch
	// that reported a refusal while writing anyway could not pass this.
	assertEquals(await storedReportStatus(theirs), "submitted");
	assertEquals(await storedReportStatus(mine), "under_review");
});

Deno.test("the accident side of the union is scoped the same way", async () => {
	await ensureIsolationFixtures();
	const mine = await seedOrgAccident(orgA, roadA, officerA);
	const theirs = await seedOrgAccident(orgB, roadB, officerA);

	const { results } = await reviewReports(
		{ reportIds: [String(mine), String(theirs)], action: "start_review" },
		orgHeadA,
	);

	assert(results[0].ok, "the leader's own accident is reviewed");
	const theirRow = results.find((row) => row.reportId === String(theirs));
	assert(!theirRow?.ok, "another organization's accident is refused");
	assert(
		(theirRow?.error ?? "").includes("دسترسی"),
		`the refusal names the scope, got: ${theirRow?.error}`,
	);

	assertEquals(await storedAccidentStatus(theirs), "submitted");
	assertEquals(await storedAccidentStatus(mine), "under_review");
});

Deno.test("the single-report act refuses another organization's report too", async () => {
	await ensureIsolationFixtures();
	const theirs = await seedOrgReport("iso-single", orgB, roadB, officerA);

	let error = "";
	try {
		await callAct("incident_report", "reviewReport", {
			reportId: String(theirs),
			action: "start_review",
		}, orgHeadA);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("دسترسی"),
		`expected the scope refusal, got: ${error}`,
	);
	assertEquals(
		await storedReportStatus(theirs),
		"submitted",
		"and the row is untouched, not merely reported as refused",
	);
});

// A malformed id, exactly the shape that slips through the validator: 24 characters,
// none of them hex. `objectIdValidation` is `instance(ObjectId) || size(string(), 24)`
// — length only — so this reaches the act and reaches `new ObjectId`, which throws.
// If that throw escapes, it is not one row's problem any more: it takes the rest of
// the batch with it and hands the caller a driver error instead of a refusal.
const MALFORMED_ID = "z".repeat(24);

/** A driver throw rather than an act refusal — what the id guard exists to prevent. */
const looksLikeDriverError = (message: string) =>
	/BSONError|hex string|Uint8Array/i.test(message);

Deno.test("a malformed id refuses only its own row", async () => {
	const good = await seedSyncedReport("malformed-good");

	// The malformed id goes **first**, so a throw would strand every row after it
	// rather than merely truncating the list.
	const { results } = await reviewReports(
		{ reportIds: [MALFORMED_ID, String(good)], action: "start_review" },
		managerId,
	);

	assertEquals(
		results.length,
		2,
		"one outcome per requested id — the batch did not abort",
	);
	assert(
		results.some((row) => row.reportId === MALFORMED_ID),
		"the outcome is keyed by the id the caller sent, malformed or not",
	);

	const goodRow = results.find((row) => row.reportId === String(good));
	const badRow = results.find((row) => row.reportId === MALFORMED_ID);
	assert(goodRow?.ok, "the valid row still transitions");
	assert(!badRow?.ok, "the malformed row is refused");
	assert(
		(badRow?.error ?? "").includes("نامعتبر"),
		`the refusal is the act's own message, got: ${badRow?.error}`,
	);
	assert(
		!looksLikeDriverError(badRow?.error ?? ""),
		`and not a driver error: ${badRow?.error}`,
	);

	// The batch genuinely finished: the row after the malformed one was written.
	assertEquals(
		await storedReportStatus(good),
		"under_review",
		"the eligible row really was transitioned",
	);
});

Deno.test("the single-report act rejects a malformed id cleanly", async () => {
	let error = "";
	try {
		await callAct("incident_report", "reviewReport", {
			reportId: MALFORMED_ID,
			action: "start_review",
		}, managerId);
	} catch (cause) {
		error = (cause as Error).message;
	}

	assert(error.includes("نامعتبر"), `expected the id refusal, got: ${error}`);
	assert(
		!looksLikeDriverError(error),
		`an act refusal, not a raw BSONError: ${error}`,
	);
});

Deno.test("cleanup bulk review database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	for (const c of await db.listCollections().toArray()) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
