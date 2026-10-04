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
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

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
	return await act.fn(
		{
			service: "main",
			model: schema,
			act: actName,
			details: validated,
		} as never,
	);
};

/** The failure message the validator produces for an unknown key. */
const rejectionFor = (
	schema: string,
	actName: string,
	set: Document,
): string => {
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act);
	try {
		structAssert(
			{ set, get: { _id: 1 } } as Document,
			act.validator as never,
		);
	} catch (cause) {
		return (cause as Error).message ?? String(cause);
	}
	return "";
};

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;
let formId: ObjectId;

Deno.test("seed fixtures", async () => {
	// `level` is what `grantAccess` reads, so every fixture user needs one.
	ghostId = await user.insertOne({
		doc: {
			first_name: "سرپرست",
			last_name: "تست",
			mobile: `0915000${RUN.slice(-4)}`,
			gender: "Male",
			level: "Ghost",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}).then((r) => r!._id as ObjectId);

	managerId = await user.insertOne({
		doc: {
			first_name: "مدیر",
			last_name: "تست",
			mobile: `0915001${RUN.slice(-4)}`,
			gender: "Male",
			level: "Manager",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}).then((r) => r!._id as ObjectId);

	patrolId = await user.insertOne({
		doc: {
			first_name: "مأمور",
			last_name: "تست",
			mobile: `0915002${RUN.slice(-4)}`,
			gender: "Male",
			level: "Patrol",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}).then((r) => r!._id as ObjectId);

	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);

	// `incident_report.add` resolves its form server-side: the id must name a form
	// that exists, is active and is of kind `incident_report`. A random ObjectId
	// would be refused with «فرم فعال یافت نشد».
	const { form_definition, organization } = await import("../mod.ts");
	const orgId = (await organization.insertOne({
		doc: {
			code: `SYNC${RUN}`,
			name: `سازمان ${RUN}`,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;

	formId = (await form_definition.insertOne({
		doc: {
			name: `فرم ${RUN}`,
			status: "active",
			form_kind: "incident_report",
			definition: { schemaVersion: 1, name: `فرم ${RUN}` },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: orgId,
				relatedRelations: { form_definitions: true },
			},
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
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

// `submitted_from` is required by `incident_report.add`'s validator: an incident
// report is always an app submission, so the build that filed it is declared.
const fileReport = async (uuid: string) =>
	await runAct("incident_report", "add", {
		set: {
			form_definition_id: formId.toString(),
			client_report_uuid: uuid,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.4.2", platform: "ios" },
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
	assertEquals(
		stored["synced_at"],
		undefined,
		"no sync instant before it synced",
	);
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

Deno.test("a report created already synced records no sync instant", async () => {
	// A Manager may file a report straight into `synced` — it was typed in at the
	// control centre, so it never "arrived" through the app. The absence is
	// deliberate: the server never observed an arrival, and inventing one would
	// record filing time rather than sync time. Oversight statistics must exclude
	// these rows, never read the missing instant as zero seconds.
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `uuid-${RUN}-born-synced`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			sync_status: "synced",
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId };

	const stored = await accident.findOne({
		filters: { _id: created._id },
		projection: { sync_status: 1, synced_at: 1 },
	}) as Record<string, unknown>;
	assertEquals(stored["sync_status"], "synced");
	assertEquals(
		stored["synced_at"],
		undefined,
		"a record born synced has no observed arrival to record",
	);
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
	assert(
		original instanceof Date,
		"the first sync already recorded an instant",
	);

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
	//
	// The value is a real `Date`, not an ISO string: a string would also be refused
	// by a `date()` struct, so the test would still pass if the key *were* declared
	// — proving nothing about the key being unknown.
	const created = await fileAccident(`uuid-${RUN}-forge`);
	const rejection = rejectionFor("accident", "update", {
		_id: created._id.toString(),
		synced_at: new Date(),
	});
	assert(
		rejection.includes("synced_at"),
		`expected synced_at to be rejected as a client input, got: ${rejection}`,
	);
});

Deno.test("a client cannot set synced_at on an incident report either", () => {
	// The same server-owned rule as an accident, and the oversight statistics read
	// incident_report rows too: a forgeable instant there would poison their median
	// just as much. `incident_report_set_schema` never declares `synced_at`, and the
	// update fn additionally strips it from the body before building the $set.
	//
	// The value is a real `Date`, not an ISO string: a string would also be refused
	// by a `date()` struct, so the test would still pass if the key *were* declared
	// — proving nothing about the key being unknown.
	const rejection = rejectionFor("incident_report", "update", {
		_id: new ObjectId().toString(),
		form_definition_id: formId.toString(),
		synced_at: new Date(),
	});
	assert(
		rejection.includes("synced_at"),
		`expected synced_at to be rejected as a client input, got: ${rejection}`,
	);
});

Deno.test("incident_report records synced_at the same way", async () => {
	const created = await fileReport(`uuid-${RUN}-report`);
	await incident_report.findOneAndUpdate({
		filter: { _id: created._id },
		update: { $set: { sync_status: "queued", review_status: "submitted" } },
		projection: { _id: 1 },
	});

	await runAct("incident_report", "update", {
		set: {
			_id: created._id.toString(),
			form_definition_id: formId.toString(),
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

Deno.test("incident_report's synced_at is never rewritten by a later synced-to-synced update", async () => {
	// The mirror of the accident case above, same strictness: the oversight
	// statistics aggregate incident_report rows too, so a regression here would
	// quietly replace a submission's median with its last correction's.
	const uuid = `uuid-${RUN}-report-twice`;
	const created = await fileReport(uuid);
	await incident_report.findOneAndUpdate({
		filter: { _id: created._id },
		update: { $set: { sync_status: "queued", review_status: "submitted" } },
		projection: { _id: 1 },
	});

	await runAct("incident_report", "update", {
		set: {
			_id: created._id.toString(),
			form_definition_id: formId.toString(),
			client_report_uuid: uuid,
			sync_status: "synced",
		},
		get: { _id: 1 },
	}, managerId);

	const first = await incident_report.findOne({
		filters: { _id: created._id },
		projection: { synced_at: 1 },
	}) as { synced_at?: Date };
	const original = first.synced_at;
	assert(
		original instanceof Date,
		"the first sync already recorded an instant",
	);

	await runAct("incident_report", "update", {
		set: {
			_id: created._id.toString(),
			form_definition_id: formId.toString(),
			client_report_uuid: uuid,
			sync_status: "synced",
		},
		get: { _id: 1 },
	}, managerId);

	const second = await incident_report.findOne({
		filters: { _id: created._id },
		projection: { synced_at: 1 },
	}) as { synced_at?: Date };

	assertEquals(
		second.synced_at?.getTime(),
		original?.getTime(),
		"the instant describes the first sync, not the last correction",
	);
});

Deno.test("an incident report created already synced records no sync instant", async () => {
	// The same hole as an accident, and the same deliberate answer: a Manager may
	// file a report straight into `synced` — it was typed in at the control centre
	// and never arrived through the app — and the absence is deliberate because the
	// server never observed an arrival. Inventing one would record filing time
	// rather than sync time, so the statistics must exclude these rows instead of
	// reading the missing instant as zero seconds.
	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: formId.toString(),
			client_report_uuid: `uuid-${RUN}-report-born-synced`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.4.2", platform: "ios" },
			sync_status: "synced",
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId };

	const stored = await incident_report.findOne({
		filters: { _id: created._id },
		projection: { sync_status: 1, synced_at: 1 },
	}) as Record<string, unknown>;
	assertEquals(stored["sync_status"], "synced");
	assertEquals(
		stored["synced_at"],
		undefined,
		"a report born synced has no observed arrival to record",
	);
});

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	for (const c of await db.listCollections().toArray()) {
		await db.collection(c.name).drop();
	}
	await client.close();
});
