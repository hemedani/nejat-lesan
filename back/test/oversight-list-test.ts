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
import moment from "npm:jalali-moment";
import { buildOversightPipeline } from "../src/incident_report/oversight/pipeline.ts";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const SCOPE = { "officer.level": "Patrol" };
const NO_FILTERS = { page: 1, limit: 25 };

const findStage = (pipeline: Document[], operator: string) =>
	pipeline.find((stage) => operator in stage) as
		| Record<string, unknown>
		| undefined;

/** The `$unionWith` spec itself — `findStage` returns the stage, not its value. */
const findUnionWith = (pipeline: Document[]) =>
	(findStage(pipeline, "$unionWith") as {
		$unionWith: { coll: string; pipeline: Document[] };
	}).$unionWith;

/**
 * The combined `$match` — the one holding `$and: [scope, sharedFilters]`.
 *
 * A plain "first stage containing `$match`" lookup finds the earlier
 * per-collection match instead, so the `$and` is what identifies this stage.
 */
const findCombinedMatch = (pipeline: Document[]) =>
	pipeline.find(
		(stage) =>
			"$match" in stage &&
			Boolean((stage as { $match: Document }).$match?.$and),
	) as { $match: { $and: Document[] } } | undefined;

/**
 * The `$regex` value the built pipeline will hand to MongoDB for a given search
 * term, read off the first `$or` clause of the shared match. Returns `undefined`
 * when the term produced no search filter at all.
 */
const searchRegexFor = (term: string): string | undefined => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: { ...NO_FILTERS, search: term },
	});
	const shared = findCombinedMatch(pipeline)!.$match.$and[1] as Document;

	// `sharedMatch` emits a lone `$or` group as a plain `$or` and two groups as an
	// `$and` of `$or`s, so both shapes have to be unwrapped to reach the clause.
	const groups: Document[][] = shared.$or
		? [shared.$or as Document[]]
		: ((shared.$and ?? []) as Document[]).map(
			(clause: Document) => (clause.$or ?? []) as Document[],
		);

	const clauses = groups.flat();
	const first = clauses.find((clause) => clause.report_id) as
		| Document
		| undefined;
	return (first?.report_id as { $regex?: string } | undefined)?.$regex;
};

Deno.test("pipeline unions accident into incident_report", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: NO_FILTERS,
	});
	const union = findUnionWith(pipeline);
	assertEquals(
		union.coll,
		"accident",
		"accidents are pulled into the report stream",
	);
});

Deno.test("each branch normalizes onto the same sort field before the union", () => {
	// One sort across two collections only works if both branches expose the same
	// field name, which is why sort_at is set inside each branch rather than after.
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: NO_FILTERS,
	});
	const outerAddFields = pipeline.find((stage) => "$addFields" in stage) as
		| { $addFields: { sort_at: Document } }
		| undefined;
	const union = findUnionWith(pipeline);

	// Read the branch expressions as text, not merely as "something is there". An
	// inverted `$ifNull` — occurrence and filing the wrong way round, or one branch
	// reading the other's field — is the whole risk here, and a truthiness check
	// would pass it.
	const asJson = (value: unknown) => JSON.stringify(value);

	assertEquals(
		asJson(outerAddFields?.$addFields.sort_at),
		asJson({
			$ifNull: ["$occurred_at", {
				$ifNull: ["$reported_at", "$createdAt"],
			}],
		}),
		"a report is filed under when it happened, then when it was filed",
	);
	const accidentAddFields = union.pipeline.find((stage) =>
		"$addFields" in stage
	) as
		| { $addFields: { sort_at: Document } }
		| undefined;
	assertEquals(
		asJson(accidentAddFields?.$addFields.sort_at),
		asJson({ $ifNull: ["$date_of_accident", "$createdAt"] }),
		"an accident is filed under when it happened",
	);

	// One date filter over a merged list must mean one thing. If the report branch
	// keyed off `reported_at` while the accident branch keys off
	// `date_of_accident`, the same column would read "when it happened" on one side
	// and "when it was filed" on the other.
	assert(
		asJson(outerAddFields?.$addFields.sort_at).includes("$occurred_at"),
		"the report branch prefers occurrence, matching the accident branch",
	);
});

Deno.test("scope and the shared filters are ANDed, never merged into one $or", () => {
	// Both the scope and a text search want $or. Merging them would silently drop
	// one, so the top-level match wraps both in $and.
	const pipeline = buildOversightPipeline({
		scope: { "officer.level": "Patrol", $or: [{ "road._id": "r" }] },
		filters: { ...NO_FILTERS, search: "پل" },
	});
	const match = findCombinedMatch(pipeline);

	assertExists(match, "a combined $and match exists");
	assertEquals(
		match!.$match.$and.length,
		2,
		"scope and filters are both present",
	);
	const orClauses = match!.$match.$and.filter((clause) => "$or" in clause);
	assertEquals(orClauses.length, 2, "both $or groups survive independently");
});

Deno.test("groupKeys decides which side of the union is searched", () => {
	const formId = new ObjectId().toString();

	const reportsOnly = buildOversightPipeline({
		scope: SCOPE,
		filters: { ...NO_FILTERS, groupKeys: [formId] },
	});
	const accidentStage = findUnionWith(reportsOnly).pipeline[0] as {
		$match: Document;
	};
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
		(reportStage.$match as { form_definition_id: Document })
			.form_definition_id,
		{ $in: [] },
		"an accident-only filter matches no reports",
	);
});

Deno.test("no groupKeys leaves both sides open", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: NO_FILTERS,
	});
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
	const match = findCombinedMatch(pipeline)!.$match;
	const shared = match.$and[1] as Record<string, unknown>;

	assert(shared["sync_status"], "sync status filter");
	assert(shared["review_status"], "review status filter");
	assert(shared["officer._id"], "officer filter");
	assert(shared["submitted_from.app_version"], "app version filter");
	const sortAt = shared["sort_at"] as { $gte: Date; $lte: Date };
	assert(
		sortAt.$gte instanceof Date,
		"the date range is a real Date, not a string",
	);
	// Local midnight, so this cannot be read off `toISOString()` any more: in
	// Tehran the start of 1 September is still 31 August in UTC.
	assertEquals(
		[
			sortAt.$gte.getFullYear(),
			sortAt.$gte.getMonth() + 1,
			sortAt.$gte.getDate(),
		],
		[2026, 9, 1],
		"the range opens at local midnight on the requested day",
	);
	assertEquals(
		[
			sortAt.$lte.getFullYear(),
			sortAt.$lte.getMonth() + 1,
			sortAt.$lte.getDate(),
		],
		[2026, 10, 3],
		"and closes at local midnight on the requested day",
	);
});

Deno.test("the date range is a local day, not a UTC day", () => {
	// Everything else in this repo resolves a from/to pair with moment's
	// `startOf("day")` / `endOf("day")`, which are *local* days. A UTC day is a
	// different question: in Tehran (UTC+3:30) a `2026-10-03` filter built in UTC
	// drops every report filed before 03:30 that morning and keeps the next
	// morning's.
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: {
			...NO_FILTERS,
			dateFrom: "2026-10-03",
			dateTo: "2026-10-03",
		},
	});
	const match = findCombinedMatch(pipeline)!.$match;
	const { $gte, $lte } = (match.$and[1] as {
		sort_at: { $gte: Date; $lte: Date };
	}).sort_at;

	// Pinned to the same library the sibling chart acts use, so "local day" means
	// the repo's definition of it rather than a boundary re-derived here.
	assertEquals(
		$gte.getTime(),
		moment("2026-10-03").startOf("day").toDate().getTime(),
		"the range opens at the start of the local day",
	);
	assertEquals(
		$lte.getTime(),
		moment("2026-10-03").endOf("day").toDate().getTime(),
		"and closes at the end of it",
	);

	// The properties that a UTC day does not have. In Tehran, the UTC end-of-day
	// is 03:29 *the next morning* locally, so both of these fail under UTC.
	assertEquals(
		[
			$lte.getHours(),
			$lte.getMinutes(),
			$lte.getSeconds(),
			$lte.getMilliseconds(),
		],
		[23, 59, 59, 999],
		"the boundary is the last instant of the requested local day",
	);
	assertEquals(
		$lte.getDate(),
		3,
		"and it is still the requested calendar day locally, not the next one",
	);
});

Deno.test("dateTo covers the whole day", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: {
			...NO_FILTERS,
			dateFrom: "2026-10-03",
			dateTo: "2026-10-03",
		},
	});
	const match = findCombinedMatch(pipeline)!.$match;
	const { $gte, $lte } = (match.$and[1] as {
		sort_at: { $gte: Date; $lte: Date };
	}).sort_at;
	assertEquals(
		[$gte.getDate(), $lte.getDate()],
		[3, 3],
		"a same-day range covers one local day, not zero",
	);
	assert(
		$lte.getTime() - $gte.getTime() > 23 * 3600_000,
		"and the end of the day is included, not midnight",
	);
});

Deno.test("unlinkedOnly excludes linked rows and includes unlinked ones", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: { ...NO_FILTERS, unlinkedOnly: true },
	});
	const match = findCombinedMatch(pipeline)!.$match;
	const shared = JSON.stringify(match.$and[1]);
	assert(shared.includes("$exists"), "a missing organization is covered");
	assert(shared.includes("organization"), "an explicit null is covered too");
});

// The search term is whatever the console's search box holds, so it reaches MongoDB
// as a pattern. It must not: `search` is a literal query, and the raw form would let
// one caller inject quantifiers (`(a+)+` is exponential and blocks the collection for
// everybody else) or probe the filter with anchors and alternations. These assert the
// built `$regex`, not a database result, because the property is how the query is
// written.

Deno.test("a search term is matched literally, never as a regex pattern", () => {
	// The exponential case: unescaped, this is a catastrophic-backtracking pattern.
	assertEquals(
		searchRegexFor("(a+)+"),
		"\\(a\\+\\)\\+",
		"quantifiers and groups are neutralised, so no term can be catastrophic",
	);

	// Anchors + alternation would let a caller probe rather than search.
	assertEquals(
		searchRegexFor("^پل$|.*"),
		"\\^پل\\$\\|\\.\\*",
		"anchors and alternation are literal characters, not operators",
	);

	// A character class would otherwise open an arbitrary matcher. Note the `-`
	// inside `[a-z]` comes out *unescaped*: it is only special inside a character
	// class, and escaping `[`/`]` means no class can exist in the output.
	assertEquals(
		searchRegexFor("[a-z]\\d"),
		"\\[a-z\\]\\\\d",
		"a character class and a backslash are literal",
	);
});

Deno.test("every PCRE metacharacter in a search term is escaped", () => {
	// The complete set MongoDB's engine treats specially, in one term.
	const metacharacters = ".*+?^${}()|[]\\";
	const emitted = searchRegexFor(metacharacters);

	assertEquals(
		emitted,
		"\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
		"all fourteen are escaped",
	);

	// The property that actually closes the hole: used as a pattern, the emitted
	// value matches the term the user typed and nothing else — so no term can carry
	// a quantifier, an anchor or an alternation into the engine.
	assert(
		new RegExp(emitted!, "i").test(metacharacters),
		"the emitted pattern matches the term literally",
	);
	assert(
		!new RegExp(emitted!, "i").test("anything at all"),
		"and matches nothing else — it is not a wildcard",
	);
});

Deno.test("Persian text and a hyphenated code survive escaping unchanged", () => {
	// What officers actually type: Persian free text, and a personnel code.
	assertEquals(
		searchRegexFor("پل شهید بهشتی"),
		"پل شهید بهشتی",
		"Persian text is not a metacharacter and is left alone",
	);
	assertEquals(
		searchRegexFor("123-456"),
		"123-456",
		"a hyphen is only special inside a character class, which cannot survive here",
	);
	assertEquals(
		searchRegexFor("۱۲۳-۴۵۶"),
		"۱۲۳-۴۵۶",
		"Persian digits are left alone too",
	);
	// Surrounding whitespace is trimmed before escaping, as it always was.
	assertEquals(searchRegexFor("  123-456  "), "123-456", "still trimmed");
});

Deno.test("an empty or whitespace-only search adds no filter at all", () => {
	// Escaping must not turn "nothing typed" into a pattern — an empty `$regex`
	// would match every row in the union, turning the console's empty state into
	// the full list.
	assertEquals(searchRegexFor(""), undefined, "an empty term adds no $regex");
	assertEquals(searchRegexFor("   "), undefined, "spaces add no $regex");
	assertEquals(
		searchRegexFor("\t\n "),
		undefined,
		"tabs and newlines add no $regex",
	);

	// Sanity: the helper reads a real filter when one exists.
	assertEquals(searchRegexFor("پل"), "پل", "a real term still produces one");
});

Deno.test("pagination is applied inside the rows facet, and total is counted separately", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: { page: 3, limit: 25 },
	});
	const facet = findStage(pipeline, "$facet") as {
		$facet: { rows: Document[]; total: Document[] };
	};
	assertEquals(
		facet.$facet.total,
		[{ $count: "n" }],
		"total counts the whole match",
	);
	assertEquals(
		(facet.$facet.rows.find((s) => "$skip" in s) as { $skip: number })
			.$skip,
		50,
		"page 3 of 25 skips 50",
	);
	assert(
		facet.$facet.rows.some((s) => "$sort" in s),
		"sorted before slicing",
	);
});

Deno.test("rows are projected down, so a full officer document is not returned", () => {
	const pipeline = buildOversightPipeline({
		scope: SCOPE,
		filters: NO_FILTERS,
	});
	const facet = findStage(pipeline, "$facet") as {
		$facet: { rows: Document[] };
	};
	const project = facet.$facet.rows.find((s) => "$project" in s) as {
		$project: Document;
	};
	assert(
		project.$project["officer.first_name"],
		"only the fields the console renders",
	);
	assert(!("officer" in project.$project), "not the whole officer relation");
});
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
import { getOversightListValidator as oversightValidator } from "../src/incident_report/oversight/getOversightList/getOversightList.val.ts";

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
	const act =
		getAtcsWithServices().main["incident_report"]["getOversightList"];
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
let roadB: ObjectId;
let officerA: ObjectId;
let formId: ObjectId;

let seq = 0;
const orgRole = (orgId: ObjectId, name: string) => ({
	roleId: String(orgId),
	name,
	scopeType: "organization" as const,
	scopeId: String(orgId),
});

const insertUser = async (
	level: string,
	roles: Array<{
		roleId: string;
		name: string;
		scopeType?: "organization" | "unit";
		scopeId?: string;
	}> = [],
) => {
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
	// The road is created first: `road` defines no `organization` relation of its
	// own (Lesan auto-creates that reverse from `organization.road`), so the link
	// can only be written from the organization side.
	let roadId: ObjectId | undefined;
	if (withRoad) {
		roadId = (await road.insertOne({
			doc: {
				name: `جاده ${seq}`,
				// `road.area` is required, and the org console reaches its rows
				// through `organization.road` rather than through geometry.
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

	const created = (await organization.insertOne({
		doc: {
			code: `OV${RUN}-${seq}`,
			name,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: roadId ? { road: { _ids: roadId } } : undefined,
		projection: { _id: 1 },
	}))!._id as ObjectId;

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
		doc: {
			code: `OU${RUN}-1`,
			name: `واحد الف ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgA, relatedRelations: { units: true } },
			officers: { _ids: [officerA] },
		},
		projection: { _id: 1 },
	});

	const b = await insertOrg(`سازمان ب ${RUN}`, true);
	orgB = b.orgId;
	roadB = b.roadId as ObjectId;
	await insertUser("OrgHead", [orgRole(orgB, "OrgHead")]);

	// `incident_report.form_definition_id` is a plain field carrying a snapshot of
	// the form, so a report can be stored against a form that later disappears.
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

/**
 * An accident linked to an org (as the app would file it).
 *
 * The road follows the target organization rather than being hard-coded:
 * an accident filed *for* organization B sits on organization B's road, and
 * putting it on A's road would make it legitimately visible to A's console —
 * which is precisely what the leak test below asserts does not happen.
 */
const seedLinkedAccident = async (
	label: string,
	targetOrg: ObjectId,
	targetRoad: ObjectId,
	syncStatus: "draft" | "queued" | "syncing" | "synced" | "rejected" =
		"synced",
	appVersion = "1.4.2",
) => {
	seq++;
	const created = (await accident.insertOne({
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
			sync_status: syncStatus,
			review_status: "submitted",
			submitted_from: { app_version: appVersion, platform: "ios" },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: targetOrg },
			officer: { _ids: officerA },
			road: { _ids: targetRoad },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
	return { _id: created, source: "accident", group_title: label } as Record<
		string,
		unknown
	>;
};

/**
 * An accident with no organization at all — the shape of a legacy row.
 *
 * The road is a parameter because "reachable only by its road" is the property under
 * test: a legacy row on organization B's road must stay invisible to someone scoped
 * to organization A, which a fixture that always used A's road could not show.
 */
const seedLegacyAccident = async (
	label: string,
	targetRoad: ObjectId = roadA,
) => {
	seq++;
	const created = (await accident.insertOne({
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
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		// Real pre-existing accidents carry an officer; only the organization link
		// is missing. A row with no officer at all would fall outside every scope,
		// which would make this fixture prove nothing about the road clause.
		relations: { officer: { _ids: officerA }, road: { _ids: targetRoad } },
		projection: { _id: 1 },
	}))!._id as ObjectId;
	return { _id: created, source: "accident", group_title: label } as Record<
		string,
		unknown
	>;
};

/**
 * A non-accident report, filed under a form.
 *
 * The union's report branch has to normalize a shape the accident branch does not
 * have — `form_definition_id` instead of `date_of_accident`, and a `form_title`
 * snapshot instead of a fixed label — so it needs a real document of its own to be
 * exercised at all. Every accident-only fixture leaves that branch empty.
 */
const seedReport = async (
	label: string,
	targetOrg: ObjectId,
	targetRoad: ObjectId,
) => {
	seq++;
	const created = (await incident_report.insertOne({
		doc: {
			form_definition_id: formId,
			form_title: `فرم ${label}`,
			form_icon: "road",
			serial: seq,
			report_id: `INC-${RUN}-${seq}`,
			reported_at: new Date(),
			description: `شرح ${label}`,
			sync_status: "synced",
			review_status: "submitted",
			submitted_from: { app_version: "1.4.2", platform: "android" },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: targetOrg },
			officer: { _ids: officerA },
			road: { _ids: targetRoad },
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
	return { _id: created, source: "incident_report" } as Record<
		string,
		unknown
	>;
};

// A status typo must be a validation error, not a silently empty list. `array(string())`
// accepted anything, so `syncStatus: ["queue"]` came back as "no reports match" —
// indistinguishable from a real answer, and the sort of thing a supervisor reports as
// "your console is broken".
Deno.test("the act refuses a status that is not in the enum", () => {
	const reject = (set: Document) => {
		try {
			structAssert(
				{ set, get: {} } as Document,
				oversightValidator() as never,
			);
		} catch (cause) {
			return (cause as Error).message ?? String(cause);
		}
		return "";
	};

	const badSync = reject({ syncStatus: ["queue"] });
	assert(
		badSync.includes("queue"),
		`expected syncStatus to be rejected, got: ${badSync}`,
	);

	const badReview = reject({ reviewStatus: ["approved "] });
	assert(
		badReview.includes("approved "),
		`expected reviewStatus to be rejected, got: ${badReview}`,
	);

	// The real values still go through, or the filter is useless.
	assertEquals(reject({ syncStatus: ["queued", "rejected"] }), "");
	assertEquals(reject({ reviewStatus: ["returned"] }), "");
});

Deno.test("a fractional page or limit is floored, not passed to $skip", async () => {
	const skipFor = (page: number, limit: number) => {
		const pipeline = buildOversightPipeline({
			scope: SCOPE,
			filters: { page, limit },
		});
		const facet = findStage(pipeline, "$facet") as {
			$facet: { rows: Document[] };
		};
		return (facet.$facet.rows.find((s) => "$skip" in s) as {
			$skip: number;
		})
			.$skip;
	};

	// `number()` admits these, and `$skip` wants an integer — a fractional offset is
	// a server error rather than a page. The builder's own guarantee is only that
	// the result is integral; the act is what floors `page` before this is reached.
	assertEquals(
		skipFor(2.5, 3),
		4,
		"the arithmetic is floored, not truncated",
	);
	assert(
		Number.isInteger(skipFor(2.5, 3)),
		"$skip is an integer even for a fractional page",
	);
	assert(
		Number.isInteger(skipFor(1.5, 2.5)),
		"and for a fractional limit too",
	);
	assertEquals(skipFor(0, 25), 0, "a page below 1 skips nothing");

	// End to end: the act floors page and limit before either reaches the pipeline,
	// so a fractional `$limit` never reaches MongoDB either.
	const fractional = await listReports(
		{ page: 2.5, limit: 2.5 },
		orgHeadA,
	);
	assert(
		fractional.rows.length <= 2,
		`limit 2.5 behaves as 2, returning ${fractional.rows.length} rows`,
	);
	assert(
		Number.isInteger(fractional.total),
		"and the act still answers normally",
	);

	// The act's floor is the one a client actually feels: page 2.5 has to be the
	// same page as page 2, not an offset of its own.
	const asPage2 = await listReports({ page: 2, limit: 2 }, orgHeadA);
	assertEquals(
		fractional.rows.map((row) => String(row["_id"])),
		asPage2.rows.map((row) => String(row["_id"])),
		"page 2.5 is page 2",
	);
});

Deno.test("a non-accident report and an accident arrive in the same list", async () => {
	const accidentRow = await seedLinkedAccident("mixed-accident", orgA, roadA);
	const reportRow = await seedReport("mixed-report", orgA, roadA);

	const { rows } = await listReports({ page: 1, limit: 50 }, orgHeadA);
	const byId = new Map(rows.map((row) => [String(row["_id"]), row]));

	const accident = byId.get(String(accidentRow._id));
	const report = byId.get(String(reportRow._id));

	assertExists(accident, "the accident is in the list");
	assertExists(report, "the non-accident report is in the same list");

	assertEquals(accident!["source"], "accident");
	assertEquals(report!["source"], "incident_report");
	assertEquals(
		report!["group_title"],
		"فرم mixed-report",
		"a report is grouped under the form it was filed with",
	);
	assertEquals(
		String(report!["group_key"]),
		String(formId),
		"a report's group key is its form definition",
	);
	assertEquals(
		accident!["group_key"],
		"accident",
		"an accident is grouped under the synthetic accident key",
	);
	assert(report!["sort_at"] instanceof Date, "the report is sortable");
	assert(accident!["sort_at"] instanceof Date, "the accident is sortable");
});

Deno.test("oversight list merges both collections for the caller's organization", async () => {
	const linked = await seedLinkedAccident("linked", orgA, roadA);
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
	const mine = await seedLinkedAccident("mine", orgA, roadA);
	await seedLinkedAccident("theirs", orgB, roadB);

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
	await seedLinkedAccident("mine", orgA, roadA);
	await seedLinkedAccident("theirs", orgB, roadB);

	const { rows } = await listReports(
		{ page: 1, limit: 50, organizationId: String(orgB) },
		orgHeadA,
	);
	const orgs = rows
		.map((row) =>
			(row["organization"] as { _id?: string } | undefined)?._id
		)
		.filter(Boolean)
		.map(String);
	assert(
		orgs.every((id) => id === String(orgA)),
		"the parameter is ignored; the caller's own scope applies",
	);
});

Deno.test("pagination neither overlaps nor skips across a union", async () => {
	for (let index = 0; index < 6; index++) {
		await seedLinkedAccident(`page-${index}`, orgA, roadA);
	}

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
		"total is stable across pages, so it is not derived from one",
	);

	// `total` must be the size of the whole match. Both pages happen to hold exactly
	// three rows here, so comparing them proves nothing on its own — `total` could
	// be the page length and still satisfy it. Two further pins:
	//
	//  - it is strictly greater than one page, which a page length cannot be;
	//  - it equals the row count of the same query with the page removed.
	//
	// The expectation is read back from an untruncated query rather than hardcoded,
	// so the test does not depend on what earlier tests happened to seed.
	const untruncated = await listReports({ page: 1, limit: 200 }, orgHeadA);

	assert(
		first.total > firstIds.length,
		`total (${first.total}) is bigger than one page (${firstIds.length})`,
	);
	assertEquals(
		first.total,
		untruncated.rows.length,
		"total equals the number of rows the match holds in all",
	);
});

Deno.test("unlinkedOnly returns only rows with no organization", async () => {
	const linked = await seedLinkedAccident("has-org", orgA, roadA);
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
	// Two distinct builds, and a queued row: every other fixture here is 1.4.2, so
	// with a single build in the database `rows.every(...)` holds whether or not the
	// `appVersions` filter is applied at all — the assertion proves nothing.
	await seedLinkedAccident("v142", orgA, roadA, "synced", "1.4.2");
	const otherBuild = await seedLinkedAccident(
		"v200",
		orgA,
		roadA,
		"synced",
		"2.0.0",
	);
	await seedLinkedAccident("queued", orgA, roadA, "queued");

	const version = (row: Record<string, unknown>) =>
		(row["submitted_from"] as { app_version?: string } | undefined)
			?.app_version;
	const ids = (rows: Array<Record<string, unknown>>) =>
		rows.map((row) => String(row["_id"])).sort();

	// The baseline: every row in scope, so the expectation below is read off real
	// data instead of counting what this test happened to seed.
	const all = await listReports({ page: 1, limit: 200 }, orgHeadA);
	const expectedIds = ids(
		all.rows.filter((row) => version(row) === "1.4.2"),
	);
	const otherIds = ids(all.rows.filter((row) => version(row) === "2.0.0"));

	assert(
		expectedIds.length > 0 && otherIds.length > 0,
		"both builds are in scope, so filtering for one is not vacuous",
	);
	assert(
		otherIds.includes(String(otherBuild._id)),
		"the other build was seeded and is visible before filtering",
	);

	const byVersion = await listReports(
		{ page: 1, limit: 200, appVersions: ["1.4.2"] },
		orgHeadA,
	);
	assert(
		byVersion.rows.every((row) => version(row) === "1.4.2"),
		"only that build comes back",
	);
	assertEquals(
		ids(byVersion.rows),
		expectedIds,
		"the filtered list is exactly the rows carrying that build — same rows, same count",
	);
	assert(
		!ids(byVersion.rows).includes(String(otherBuild._id)),
		"the other build is absent, not merely outnumbered",
	);

	const queued = await listReports(
		{ page: 1, limit: 200, syncStatus: ["queued"] },
		orgHeadA,
	);
	assertEquals(
		ids(queued.rows),
		ids(all.rows.filter((row) => row["sync_status"] === "queued")),
		"only the queued rows come back",
	);
	assert(
		queued.rows.every((row) => row["sync_status"] === "queued"),
		"and every one of them is queued",
	);
});

Deno.test("rows carry provenance so the console needs no second request", async () => {
	const linked = await seedLinkedAccident("prov", orgA, roadA);
	const { rows } = await listReports({ page: 1, limit: 50 }, orgHeadA);
	const row = rows.find((candidate) =>
		String(candidate["_id"]) === String(linked._id)
	);
	assertExists(row);
	assertEquals(
		(row!["submitted_from"] as { app_version?: string }).app_version,
		"1.4.2",
	);
	assertEquals(
		// The raw driver hands back an ObjectId, never a string — compare the two
		// ids as text, the same way every other id in this file is compared.
		String((row!["officer"] as { _id?: unknown } | undefined)?._id),
		String(officerA),
	);
});

// The Manager/Ghost branch of `resolveOversightScope` is the one scope path in this
// act that no test touched: the org-leader branch delegates to the already-shipped
// `getOrgReportBase`, but the Manager narrowing is computed locally in `filters.ts`.
//
// It is not a widening — a Manager already sees every patrol report, so the branch
// only ever *narrows*. What it must not do is narrow wrongly, and the exact bug is
// the one this act exists to prevent: a legacy report carries no `organization`
// field at all, so it is reachable only through its road clause. Narrow on
// `organization._id` alone and every legacy row in that organization disappears.
//
// Organization B's legacy row therefore sits on **B's** road, so "sees legacy by
// road" is distinguishable from "sees all legacy regardless of road".

Deno.test("a Manager with no organizationId sees every organization's reports", async () => {
	const linkedA = await seedLinkedAccident("mgr-linked-a", orgA, roadA);
	const legacyA = await seedLegacyAccident("mgr-legacy-a", roadA);
	const linkedB = await seedLinkedAccident("mgr-linked-b", orgB, roadB);
	const legacyB = await seedLegacyAccident("mgr-legacy-b", roadB);

	const { rows } = await listReports({ page: 1, limit: 200 }, managerId);
	const ids = rows.map((row) => String(row["_id"]));

	for (const row of [linkedA, legacyA, linkedB, legacyB]) {
		assert(
			ids.includes(String(row._id)),
			`an unnarrowed Manager sees ${row._id}`,
		);
	}
});

Deno.test("a Manager narrowed to one organization still sees its legacy reports", async () => {
	const linkedA = await seedLinkedAccident("mgr-n-linked-a", orgA, roadA);
	const legacyA = await seedLegacyAccident("mgr-n-legacy-a", roadA);
	const linkedB = await seedLinkedAccident("mgr-n-linked-b", orgB, roadB);
	const legacyB = await seedLegacyAccident("mgr-n-legacy-b", roadB);

	const { rows } = await listReports(
		{ page: 1, limit: 200, organizationId: String(orgA) },
		managerId,
	);
	const ids = rows.map((row) => String(row["_id"]));

	// The clause the whole branch exists for.
	assert(
		ids.includes(String(legacyA._id)),
		"the organization's legacy report — no `organization` field, reachable only by road",
	);
	assert(ids.includes(String(linkedA._id)), "and its linked report");

	// Narrowing, not widening.
	assert(
		!ids.includes(String(linkedB._id)),
		"another org's linked report is out",
	);
	assert(
		!ids.includes(String(legacyB._id)),
		"and another org's legacy report, even though legacy rows carry no org either",
	);
});

Deno.test("a Ghost sees exactly what a Manager sees, narrowed or not", async () => {
	const linkedA = await seedLinkedAccident("ghost-linked-a", orgA, roadA);
	const legacyA = await seedLegacyAccident("ghost-legacy-a", roadA);
	const linkedB = await seedLinkedAccident("ghost-linked-b", orgB, roadB);

	const openManager = await listReports({ page: 1, limit: 200 }, managerId);
	const openGhost = await listReports({ page: 1, limit: 200 }, ghostId);
	assertEquals(
		openGhost.rows.map((row) => String(row["_id"])).sort(),
		openManager.rows.map((row) => String(row["_id"])).sort(),
		"unnarrowed, Ghost and Manager agree",
	);

	const narrowManager = await listReports(
		{ page: 1, limit: 200, organizationId: String(orgA) },
		managerId,
	);
	const narrowGhost = await listReports(
		{ page: 1, limit: 200, organizationId: String(orgA) },
		ghostId,
	);
	const ghostIds = narrowGhost.rows.map((row) => String(row["_id"]));
	assertEquals(
		ghostIds.sort(),
		narrowManager.rows.map((row) => String(row["_id"])).sort(),
		"narrowed, Ghost and Manager agree",
	);
	assert(
		ghostIds.includes(String(legacyA._id)),
		"and Ghost keeps the legacy row too",
	);
	assert(
		ghostIds.includes(String(linkedA._id)),
		"as well as the organization's linked report",
	);
	assert(
		!ghostIds.includes(String(linkedB._id)),
		"while still excluding org B",
	);
});

Deno.test("cleanup oversight database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	for (const c of await db.listCollections().toArray()) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
