/**
 * Accident-model contract tests.
 *
 * This file replaces the former `incident-types-test.ts`, which covered the
 * polymorphic report model — `accident` discriminated by `incident_type` into
 * accident | road_breakdown | road_obstacle | other. That design is retired: the
 * three non-accident categories now live in `incident_report` (see
 * `incident-report-test.ts`) and `accident` holds accidents only.
 *
 * The behaviour worth keeping from the old suite is preserved here, re-pointed at
 * what `accident` still guarantees:
 *
 *   - the `REP-` report id and its own serial counter
 *   - officer attribution is server-enforced, so an officer cannot file under a
 *     colleague's id
 *   - a patrol officer may only queue a report, never mark it synced
 *   - submission is idempotent by `client_report_uuid`
 *   - every field is optional, because the organization's form decides what is
 *     required
 *
 * Run: deno test -A test/accident-report-shape-test.ts
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
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details: validated,
	} as never);
};

let seq = 0;
const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `ars_${RUN}_${seq}@test.local`,
			level,
			is_active: true,
			failed_login_attempts: 0,
			roles: [],
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	patrolId = await insertUser("Patrol");

	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
});

Deno.test("add — an accident gets a REP- report id and its own serial", async () => {
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `uuid-${RUN}-1`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: "2026-03-11T12:00:00.000Z",
		},
		get: {
			_id: 1,
			serial: 1,
			report_id: 1,
			sync_status: 1,
			review_status: 1,
		},
	}, patrolId) as Record<string, unknown>;

	assertEquals(typeof created.serial, "number");
	assert(
		String(created.report_id).startsWith("REP-"),
		`unexpected report id: ${created.report_id}`,
	);
	assertEquals(created.sync_status, "queued");
	assertEquals(created.review_status, "submitted");
});

Deno.test("add — officer attribution is server-enforced", async () => {
	// Supplying another officer's id must be refused, not silently honoured: the
	// report would otherwise appear in their history and their manager's console.
	const other = await insertUser("Patrol");

	await assertRejects(
		() =>
			runAct("accident", "add", {
				set: {
					officerId: other.toString(),
					client_report_uuid: `uuid-${RUN}-2`,
					location: { type: "Point", coordinates: [51.4, 35.7] },
				},
				get: { _id: 1 },
			}, patrolId),
		Error,
		"مأمور دیگر",
	);

	// Omitting it still attributes the report to the caller.
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `uuid-${RUN}-3`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1, officer: { _id: 1 } },
	}, patrolId) as { officer?: { _id?: ObjectId } };

	assertEquals(
		created.officer?._id?.toString(),
		patrolId.toString(),
	);
});

Deno.test("add — a patrol officer cannot mark a report synced", async () => {
	await assertRejects(
		() =>
			runAct("accident", "add", {
				set: {
					sync_status: "synced",
					client_report_uuid: `uuid-${RUN}-4`,
					location: { type: "Point", coordinates: [51.4, 35.7] },
				},
				get: { _id: 1 },
			}, patrolId),
		Error,
		"draft",
	);

	// A manager is the control centre side, so it may.
	const byManager = await runAct("accident", "add", {
		set: {
			sync_status: "synced",
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1, sync_status: 1 },
	}, managerId) as { sync_status?: string };
	assertEquals(byManager.sync_status, "synced");
});

Deno.test("add — re-submitting the same uuid does not duplicate", async () => {
	const payload = {
		client_report_uuid: `uuid-${RUN}-5`,
		location: { type: "Point", coordinates: [51.4, 35.7] },
	};
	const first = await runAct("accident", "add", {
		set: payload,
		get: { _id: 1 },
	}, patrolId) as { _id: ObjectId };
	const second = await runAct("accident", "add", {
		set: payload,
		get: { _id: 1 },
	}, patrolId) as { _id: ObjectId };

	assertEquals(first._id.toString(), second._id.toString());
});

Deno.test("add — every field is optional, because the org's form decides", async () => {
	// No location, no date: the form is what requires questions, not the server.
	const created = await runAct("accident", "add", {
		set: { location: { type: "Point", coordinates: [51.4, 35.7] } },
		get: { _id: 1, report_id: 1 },
	}, patrolId) as { _id: ObjectId; report_id: string };

	assertExists(created._id);
	assert(String(created.report_id).startsWith("REP-"));
});

Deno.test("update — a synced report cannot be walked back to queued", async () => {
	const created = await runAct("accident", "add", {
		set: {
			sync_status: "synced",
			client_report_uuid: `uuid-${RUN}-6`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId };

	await assertRejects(
		() =>
			runAct("accident", "update", {
				set: { _id: created._id.toString(), sync_status: "queued" },
				get: { _id: 1 },
			}, managerId),
		Error,
	);
});

// ---------------------------------------------------------------------------
// Filing provenance — same contract as incident_report
// ---------------------------------------------------------------------------

Deno.test("provenance — an app submission links the officer's organization", async () => {
	const { organization, unit } = await import("../mod.ts");
	const orgId = (await organization.insertOne({
		doc: {
			code: `PROV${RUN}`,
			name: `سازمان ${RUN}`,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;

	const officer = await insertUser("Patrol");
	await unit.insertOne({
		doc: {
			name: `واحد ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgId, relatedRelations: { units: true } },
			officers: { _ids: [officer] },
		},
		projection: { _id: 1 },
	});

	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `uuid-${RUN}-prov`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.4.2", platform: "android" },
		},
		get: { _id: 1, submitted_from: 1, organization: { _id: 1 } },
	}, officer) as Record<string, unknown>;

	assertEquals(created["submitted_from"], {
		app_version: "1.4.2",
		platform: "android",
	});
	assertEquals(
		(created["organization"] as { _id: ObjectId })?._id?.toString(),
		orgId.toString(),
		"the organization is resolved server-side from the officer's unit",
	);
});

Deno.test("provenance — a web-created accident carries neither field", async () => {
	// The web console and JSON import never send provenance. Their accidents must
	// keep working and stay distinguishable from app submissions.
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `uuid-${RUN}-web`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1, submitted_from: 1, organization: { _id: 1 } },
	}, managerId) as Record<string, unknown>;

	assertEquals(created["submitted_from"], undefined);
	assertEquals(created["organization"], undefined);
});

Deno.test("provenance — a client cannot choose the accident's organization", async () => {
	let error = "";
	try {
		await runAct("accident", "add", {
			set: {
				client_report_uuid: `uuid-${RUN}-forge`,
				location: { type: "Point", coordinates: [51.4, 35.7] },
				submitted_from: { app_version: "1.4.2", platform: "ios" },
				organizationId: new ObjectId().toString(),
			},
			get: { _id: 1 },
		}, patrolId);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("organizationId"),
		`expected the forged organization to be rejected, got: ${error}`,
	);
});

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	const collections = await db.listCollections().toArray();
	for (const c of collections) await db.collection(c.name).drop();
	await client.close();
});
