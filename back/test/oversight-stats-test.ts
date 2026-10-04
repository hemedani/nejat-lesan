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
import {
	accident,
	coreApp,
	getAtcsWithServices,
	incident_report,
	organization,
	road,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import {
	appVersionStatsPipeline,
	officerStatsPipeline,
	reduceAppVersionStats,
	reduceOfficerStats,
	UNATTRIBUTED_OFFICER_ID,
} from "../src/incident_report/oversight/stats.ts";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

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
	return await act.fn(
		{
			service: "main",
			model: schema,
			act: actName,
			details: validated,
		} as never,
	);
};

const stats = async (set: Document, actor: ObjectId) =>
	await callAct("incident_report", "getOversightStats", set, actor) as {
		byOfficer: Array<Record<string, unknown>>;
		byAppVersion: Array<Record<string, unknown>>;
		aging: { queued: number; under_review: number; thresholdHours: number };
	};

const listTotal = async (set: Document, actor: ObjectId) =>
	(await callAct("incident_report", "getOversightList", set, actor) as {
		total: number;
	}).total;

let ghostId: ObjectId;
let managerId: ObjectId;
let orgHeadId: ObjectId;
let orgA: ObjectId;
/** An organization nobody has filed into — the empty population. */
let orgB: ObjectId;
let roadA: ObjectId;
let officerOne: ObjectId;
let officerTwo: ObjectId;
/** Reports for this officer are its own, so its bounds are unambiguous. */
let officerThree: ObjectId;
let seq = 0;

type UserRole = {
	roleId: string;
	name: string;
	scopeType?: "organization" | "unit";
	scopeId?: string;
};

const orgRole = (orgId: ObjectId, name: string): UserRole => ({
	roleId: String(orgId),
	name,
	scopeType: "organization",
	scopeId: String(orgId),
});

const insertUser = async (level: string, roles: UserRole[] = []) => {
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

	// The road is created first: `road` declares no `organization` relation of its
	// own (Lesan generates that reverse from `organization.road`), and only the
	// owning side accepts the link in `insertOne` — so the org carries it.
	roadA = (await road.insertOne({
		doc: {
			name: `جاده ${RUN}`,
			// Required by the model, and the shape the org console's road filter
			// would have to traverse for a road-scoped legacy row.
			area: {
				type: "MultiLineString",
				coordinates: [[[51.4, 35.7], [51.5, 35.8]]],
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;

	orgA = (await organization.insertOne({
		doc: {
			code: `ST${RUN}`,
			name: `سازمان ${RUN}`,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { road: { _ids: roadA } },
		projection: { _id: 1 },
	}))!._id as ObjectId;

	orgB = (await organization.insertOne({
		doc: {
			code: `SB${RUN}`,
			name: `سازمان خالی ${RUN}`,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;

	orgHeadId = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
	officerOne = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	officerTwo = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	officerThree = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	await unit.insertOne({
		doc: {
			code: `SU${RUN}`,
			name: `واحد ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgA, relatedRelations: { units: true } },
			officers: { _ids: [officerOne, officerTwo, officerThree] },
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
	officer: ObjectId | null,
	options: {
		version?: string;
		sync?: "draft" | "queued" | "syncing" | "synced" | "rejected";
		review?:
			| "submitted"
			| "under_review"
			| "returned"
			| "approved"
			| "completed";
		reportedAt?: Date;
		/** When it happened. Defaults to `reportedAt`; separate them to tell them apart. */
		occurredAt?: Date;
		reviewedAt?: Date;
	} = {},
) => {
	const reportedAt = options.reportedAt ?? new Date();
	await accident.insertOne({
		doc: {
			seri: ++seq,
			serial: ++seq,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: options.occurredAt ?? reportedAt,
			reported_at: reportedAt,
			sync_status: options.sync ?? "synced",
			review_status: options.review ?? "submitted",
			...(options.reviewedAt ? { reviewed_at: options.reviewedAt } : {}),
			...(options.version
				? {
					submitted_from: {
						app_version: options.version,
						platform: "ios",
					},
				}
				: {}),
			createdAt: reportedAt,
			updatedAt: reportedAt,
		},
		relations: {
			organization: { _ids: orgA },
			// Omitted rather than null, so the document carries no officer relation at
			// all — the unattributable report, not one naming a deleted officer.
			...(officer ? { officer: { _ids: officer } } : {}),
			road: { _ids: roadA },
		},
		projection: { _id: 1 },
	});
};

Deno.test("officer counts reconcile with the list total", async () => {
	// Deliberately *not* 1.4.2: the app-version test below asserts an exact total
	// for that build, and every test in this file shares one database. Two 1.4.2
	// rows seeded here would make its count four.
	await seedAccident(officerOne, { version: "1.3.0" });
	await seedAccident(officerOne, {
		version: "1.3.0",
		sync: "queued",
		review: "submitted",
	});
	await seedAccident(officerTwo, { version: "1.5.0" });

	const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
	const sum = byOfficer.reduce(
		(total, row) => total + Number(row["total"] ?? 0),
		0,
	);
	const listed = await listTotal({
		page: 1,
		limit: 1,
		dateFrom: "2026-01-01",
	}, orgHeadId);

	assertEquals(sum, listed, "the officer table adds up to the list");
	assertEquals(byOfficer.length, 2, "one row per officer");
});

Deno.test("app versions are grouped, with a bucket for records that never came from the app", async () => {
	await seedAccident(officerOne, { version: "1.4.2" });
	await seedAccident(officerOne, { version: "1.4.2", sync: "rejected" });
	await seedAccident(officerTwo);

	const { byAppVersion } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
	const versions = byAppVersion.map((row) => String(row["app_version"]));
	assert(
		versions.includes("1.4.2"),
		"the build that filed reports is listed",
	);
	assert(
		versions.includes("—"),
		"a web-created report stays visible instead of vanishing from the totals",
	);

	const first = byAppVersion.find((row) =>
		String(row["app_version"]) === "1.4.2"
	);
	assertEquals(Number(first?.["total"]), 2);
	assertEquals(
		Number(first?.["rejected"]),
		1,
		"the rejection count is what surfaces a bad build",
	);
	// One officer filed both, so the build is not two officers' worth of volume —
	// the number the console shows next to the total.
	assertEquals(Number(first?.["distinct_officers"]), 1);

	// The version-less record is counted, not merely mentioned: a bucket that
	// appeared with a total of zero would satisfy the assertion above.
	const none = byAppVersion.find((row) => String(row["app_version"]) === "—");
	assertEquals(
		Number(none?.["total"]),
		1,
		"the web-created record is in the totals",
	);
	assertEquals(Number(none?.["distinct_officers"]), 1);
});

Deno.test("aging counts what is stuck, split by the state that can stall", async () => {
	const old = new Date(Date.now() - 72 * 60 * 60 * 1000);
	const now = new Date();
	// Queued 72h ago: the clock runs from when it was filed, so it is stuck.
	await seedAccident(officerOne, {
		sync: "queued",
		review: "submitted",
		reportedAt: old,
	});
	// In review since 72h ago, recorded: stuck.
	await seedAccident(officerOne, {
		sync: "synced",
		review: "under_review",
		reportedAt: old,
		reviewedAt: old,
	});
	// In review but started just now: inside the threshold, so not stuck.
	await seedAccident(officerOne, {
		sync: "synced",
		review: "under_review",
		reportedAt: old,
		reviewedAt: now,
	});
	// In review with no recorded start at all. Its age is unknown rather than
	// enormous, so it is not reported as stuck — MongoDB compares a missing field
	// as null, which sorts before every date and would count it forever.
	await seedAccident(officerOne, {
		sync: "synced",
		review: "under_review",
		reportedAt: old,
	});
	// Neither stalling state: never counted.
	await seedAccident(officerOne, { sync: "synced", review: "approved" });

	const { aging } = await stats({ thresholdHours: 24 }, orgHeadId);
	assert(aging.thresholdHours === 24, "the threshold is echoed back");
	assertEquals(aging.queued, 1, "one report queued past the threshold");
	assertEquals(
		aging.under_review,
		1,
		"one report under review past the threshold",
	);

	// The queued row the reconciliation test seeded was filed moments ago, so it is
	// not stuck — and widening the threshold past every row's age clears the count,
	// which a hard-coded 24-hour cutoff could not do.
	const wide = await stats({ thresholdHours: 24 * 365 * 100 }, orgHeadId);
	assertEquals(
		wide.aging.queued,
		0,
		"the caller's threshold is the one applied, not a fixed one",
	);
});

Deno.test("median sync time is absent, not zero, when no instant was recorded", async () => {
	await seedAccident(officerOne, { version: "1.4.2" });

	const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
	const row = byOfficer.find((entry) =>
		String(entry["officer_id"]) === String(officerOne)
	);
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
	const row = byOfficer.find((entry) =>
		String(entry["officer_id"]) === String(officerTwo)
	);
	assertEquals(row?.["median_sync_ms"], 5 * 60 * 1000);
});

// The two tests above agree on the answer whether the pipeline pushes a `null`
// placeholder for a record with no sync instant or skips it entirely — a null
// sorts as 0 and, filtered out at the reducer, is indistinguishable from
// absence. Only the intermediate array tells the two apart, and `$$REMOVE` is the
// mechanism the whole "unknown is not zero" property rests on.
Deno.test("the pipeline pushes no placeholder for a record with no sync instant", async () => {
	const rows = await coreApp.odm.getCollection("incident_report")
		.aggregate(officerStatsPipeline({ "officer.level": "Patrol" }, {}))
		.toArray();
	const byOfficer = new Map(
		(rows as Array<Record<string, unknown>>).map((row) => [
			String(row["_id"]),
			row["durations"] as number[] | undefined,
		]),
	);

	assertEquals(
		byOfficer.get(String(officerOne)),
		[],
		"ten records with no sync instant contribute no elements at all",
	);
	assertEquals(
		byOfficer.get(String(officerTwo)),
		[5 * 60 * 1000],
		"the one record that recorded an instant is the only element",
	);
});

Deno.test("an even number of durations averages the two middle ones", async () => {
	// The act-level tests only ever produce zero or one duration, so the even
	// branch of the median is otherwise never exercised.
	const [two, four] = reduceOfficerStats([
		{ _id: "a", durations: [100, 200] },
		{ _id: "b", durations: [400, 100, 300, 200] },
	]);

	assertEquals(two?.["median_sync_ms"], 150);
	assertEquals(four?.["median_sync_ms"], 250);
	assertEquals(
		reduceOfficerStats([{ _id: "c" }])[0]?.["median_sync_ms"],
		null,
		"a row that somehow arrived without the array is unknown, not zero",
	);
});

// The invariant this whole act exists to keep: the counts sit directly above the
// list, so for the filter the reviewer has applied, the officer table must add up
// to that list and no more. A statistics act that accepted only a date range
// would still pass the first test in this file — it reconciles on an unfiltered
// population — while describing reports the reviewer had filtered away.
Deno.test("the officer table reconciles with the list for every filter the list applies", async () => {
	// One row per filter dimension, so each filter below has something to exclude.
	await seedAccident(officerOne, { version: "2.0.0", sync: "synced" });
	await seedAccident(officerTwo, { version: "2.0.0" });
	await seedAccident(officerTwo, {
		version: "2.1.0",
		sync: "queued",
		review: "submitted",
	});
	// The other half of the union: until a non-accident report exists, `groupKeys`
	// and the union's second branch are untested, and every accident-only fixture
	// makes them no-ops that reconcile trivially. `form_definition_id` is a raw ref
	// on the model, so no form definition document has to exist for the ref to
	// read as a group key.
	await incident_report.insertOne({
		doc: {
			form_definition_id: new ObjectId(),
			form_title: `فرم ${RUN}`,
			reported_at: new Date(),
			sync_status: "synced",
			review_status: "submitted",
			submitted_from: { app_version: "2.0.0", platform: "ios" },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgA },
			officer: { _ids: officerOne },
			road: { _ids: roadA },
		},
		projection: { _id: 1 },
	});

	const sumOf = (rows: Array<Record<string, unknown>>) =>
		rows.reduce((total, row) => total + Number(row["total"] ?? 0), 0);

	const cases: Array<[string, Document]> = [
		["syncStatus", { syncStatus: ["queued"] }],
		["appVersions", { appVersions: ["2.0.0"] }],
		["syncStatus + appVersions", {
			syncStatus: ["queued"],
			appVersions: ["2.0.0"],
		}],
		["reviewStatus", { reviewStatus: ["returned"] }],
		["officerIds", { officerIds: [String(officerTwo)] }],
		["groupKeys", { groupKeys: ["accident"] }],
	];

	for (const [label, filter] of cases) {
		const windowed = { dateFrom: "2026-01-01", ...filter };

		const { byOfficer } = await stats(windowed, orgHeadId);
		const sum = sumOf(byOfficer);
		const listed = await listTotal(
			{ page: 1, limit: 1, ...windowed },
			orgHeadId,
		);

		assertEquals(
			sum,
			listed,
			`${label}: the officer table adds up to the list`,
		);
	}

	// Reconciliation alone would also hold if the filters were ignored everywhere
	// at once, so pin that each filter actually narrows the population. A filter
	// that reached the validator but not the aggregation fails exactly here.
	const unfiltered = sumOf(
		(await stats({ dateFrom: "2026-01-01" }, orgHeadId)).byOfficer,
	);
	for (const [label, filter] of cases) {
		const { byOfficer } = await stats(
			{ dateFrom: "2026-01-01", ...filter },
			orgHeadId,
		);
		assert(
			sumOf(byOfficer) < unfiltered,
			`${label}: the filter narrowed the population`,
		);
	}
});

Deno.test("the filters survive a narrowed Manager scope, whose own $or must not be lost", async () => {
	// The Manager scope carries its own `$or` (organization, or the legacy road
	// clause) alongside the console's filters. Combining them by merging the two
	// objects would drop one of the two `$or`s — here, the scope, which would
	// silently widen the counts to every patrol officer in the installation.
	await seedAccident(officerOne, { version: "2.2.0" });
	await seedAccident(officerOne, { version: "2.2.0", sync: "queued" });

	const narrow = {
		organizationId: String(orgA),
		dateFrom: "2026-01-01",
		syncStatus: ["queued"],
		appVersions: ["2.2.0"],
	};
	const { byOfficer } = await stats(narrow, managerId);
	const sum = byOfficer.reduce(
		(total, row) => total + Number(row["total"] ?? 0),
		0,
	);

	assertEquals(
		sum,
		await listTotal({ page: 1, limit: 1, ...narrow }, managerId),
		"a Manager narrowed to one organization sees the same rows as its list",
	);
	assertEquals(
		sum,
		1,
		"only the queued 2.2.0 report is counted, not the org's whole population",
	);
});

Deno.test("app-version totals add up to the list, so the bucket never drops a report", async () => {
	// The "—" bucket is `$ifNull` rather than a filter, which is what keeps the
	// totals total-preserving: dropping version-less rows instead would leave every
	// per-build count correct and the sum short by however many reports the web
	// console created.
	for (
		const filter of [
			{ dateFrom: "2026-01-01" },
			{ dateFrom: "2026-01-01", appVersions: ["2.0.0"] },
			{ dateFrom: "2026-01-01", syncStatus: ["queued"] },
		]
	) {
		const { byAppVersion } = await stats(filter, orgHeadId);
		const sum = byAppVersion.reduce(
			(total, row) => total + Number(row["total"] ?? 0),
			0,
		);

		assertEquals(
			sum,
			await listTotal({ page: 1, limit: 1, ...filter }, orgHeadId),
			`${JSON.stringify(filter)}: the version rows add up to the list`,
		);
	}
});

Deno.test("first and last filed are when the report was filed, not when it happened", async () => {
	// A crash from six weeks ago, filed with the control centre a moment ago —
	// the whole gap between `occurred_at` and `reported_at`. Sorting the officer
	// table on `sort_at` answered "when did this happen", under a name that says
	// "reported".
	// Whole seconds: a Date carries milliseconds the write path does not, so an
	// exact comparison would fail on the rounding rather than on the meaning.
	const filedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
	await seedAccident(officerThree, {
		sync: "queued",
		review: "submitted",
		occurredAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
		reportedAt: filedAt,
	});

	const { byOfficer } = await stats({ dateFrom: "2026-01-01" }, orgHeadId);
	const row = byOfficer.find((entry) =>
		String(entry["officer_id"]) === String(officerThree)
	);

	assertEquals(
		new Date(String(row?.["first_reported_at"])).getTime(),
		filedAt.getTime(),
		"filed at, not when the accident happened",
	);
	assertEquals(
		new Date(String(row?.["last_reported_at"])).getTime(),
		filedAt.getTime(),
	);
});

Deno.test("a crash filed now is not stuck, however long ago it happened", async () => {
	// The same clock as the row above: `aging` has always counted from filed-at, so
	// if `first_reported_at` were occurrence the two panels would disagree — this
	// one saying an officer is three weeks behind, the other saying nothing is.
	const before =
		(await stats({ thresholdHours: 24 }, orgHeadId)).aging.queued;
	await seedAccident(officerThree, {
		sync: "queued",
		review: "submitted",
		occurredAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
	});
	const after = (await stats({ thresholdHours: 24 }, orgHeadId)).aging.queued;

	assertEquals(after, before, "a report filed a moment ago is not yet stuck");
});

Deno.test("a report with no officer is labelled, not dropped, and never given a blank id", async () => {
	// Its own build, so the distinct-officer count is unambiguous: nobody filed it.
	await seedAccident(null, { version: "3.0.0" });

	const collection = coreApp.odm.getCollection("incident_report");
	const scope: Document = { "organization._id": orgA };
	const byOfficer = reduceOfficerStats(
		await collection.aggregate(officerStatsPipeline(scope, {}))
			.toArray() as Array<Record<string, unknown>>,
	);

	const unattributed = byOfficer.find((row) => row.unattributed);
	assertExists(unattributed, "the report still has a row");
	assertEquals(
		unattributed.officer_id,
		UNATTRIBUTED_OFFICER_ID,
		"labelled, rather than an empty string that reads like an id",
	);
	assertEquals(unattributed.total, 1);
	assertEquals(
		byOfficer.filter((row) => row.officer_id === "").length,
		0,
		"no row wears a blank id",
	);
	assertEquals(
		byOfficer.find((row) => row.officer_id === String(officerOne))
			?.unattributed,
		false,
		"a real officer is not flagged",
	);

	// Total-preserving: labelling the row is only honest if its volume is still
	// counted. Dropping it would leave the officer table short of the list. Counted
	// across both halves of the union, since the scope admits accidents and
	// reports alike.
	const inOrg = (await Promise.all(
		["incident_report", "accident"].map((name) =>
			coreApp.odm.getCollection(name)
				.countDocuments({ "organization._id": orgA })
		),
	)).reduce((total, count) => total + count, 0);
	assertEquals(
		byOfficer.reduce((total, row) => total + row.total, 0),
		inOrg,
		"the officer table still accounts for every report in the organization",
	);

	const versions = reduceAppVersionStats(
		await collection.aggregate(appVersionStatsPipeline(scope, {}))
			.toArray() as Array<Record<string, unknown>>,
	);
	assertEquals(
		versions.find((row) => row.app_version === "3.0.0")?.distinct_officers,
		0,
		"a build is not credited with an officer who filed nothing",
	);
});

Deno.test("an empty population returns empty arrays and zero counts", async () => {
	// A freshly created organization, which is what an org head sees the moment
	// their console goes live — the case where a reducer reading `rows[0]` of an
	// empty aggregation would answer `undefined` instead of a zero.
	const narrow = { organizationId: String(orgB) };
	const { byOfficer, byAppVersion, aging } = await stats(narrow, managerId);

	assertEquals(byOfficer, [], "no officer rows, rather than one empty row");
	assertEquals(byAppVersion, [], "not even an empty version bucket");
	assertEquals(aging.queued, 0);
	assertEquals(aging.under_review, 0);
	assertEquals(aging.thresholdHours, 24, "the default is still echoed back");
	assertEquals(
		await listTotal({ page: 1, limit: 1, ...narrow }, managerId),
		0,
		"and the list agrees there is nothing to show",
	);
});

Deno.test("cleanup stats database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	for (const c of await db.listCollections().toArray()) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
