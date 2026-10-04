/**
 * Access-control and tenant-isolation tests for the form engine.
 *
 * Covers the five product requirements:
 *   1. Ghost / Manager / OrgHead can create and activate complex forms
 *   2. every form is bound to exactly one organization
 *   3. a Patrol officer can resolve the active form to render and fill it
 *   4. a Patrol officer sees ONLY their own organization's forms
 *   5. an organization with no form of its own resolves no form (the client then
 *      falls back to the standard default flow)
 *
 * Run: deno test -A test/form-definition-access-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	collision_type,
	coreApp,
	form_definition,
	getAtcsWithServices,
	organization,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import type { FormDefinition } from "@forms";

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
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details,
	});
};

const FORM_GET: Document = {
	_id: 1,
	name: 1,
	status: 1,
	version: 1,
	incident_type: 1,
	definition: 1,
	organization: { _id: 1, name: 1 },
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

type RoleScope = {
	roleId: string;
	name: string;
	scopeType?: "organization" | "unit";
	scopeId?: string;
};

const insertUser = async (
	level: string,
	roles: RoleScope[] = [],
): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `acc_${RUN}_${seq}@test.local`,
			level,
			is_active: true,
			failed_login_attempts: 0,
			roles,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let orgSeq = 0;
const insertOrg = async (name: string): Promise<ObjectId> => {
	orgSeq++;
	const created = await organization.insertOne({
		doc: {
			// `code` is required and uniquely indexed on organization.
			code: `ACC${RUN}-${orgSeq}`,
			name,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertUnit = async (
	name: string,
	orgId: ObjectId,
	officerIds: ObjectId[],
): Promise<ObjectId> => {
	const created = await unit.insertOne({
		doc: {
			name,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: orgId,
				relatedRelations: { units: true },
			},
			officers: { _ids: officerIds },
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

/** A definition exercising nesting, conditions and a reference source. */
const complexDefinition: FormDefinition = {
	schemaVersion: 1,
	name: "فرم پیچیده",
	pages: [
		{
			key: "scene",
			title: "وضعیت صحنه",
			order: 1,
			sections: [{
				key: "sceneSection",
				title: "وضعیت",
				order: 1,
				nodes: [
					{
						kind: "field",
						key: "severity",
						type: "choice_group",
						label: "شدت",
						order: 1,
						requiredWhen: { op: "always" },
						options: {
							kind: "literal",
							items: [{ value: "low", label: "کم" }],
						},
					},
					{
						kind: "field",
						key: "collisionTypeId",
						type: "reference",
						label: "نوع برخورد",
						order: 2,
						options: { kind: "reference", model: "collision_type" },
						binding: { kind: "relation", path: "collision_type" },
					},
				],
			}],
		},
		{
			key: "vehicles",
			title: "وسایل",
			order: 2,
			sections: [{
				key: "vehiclesSection",
				title: "وسایل",
				order: 1,
				nodes: [{
					kind: "repeatable",
					key: "vehicles",
					label: "وسیله",
					order: 1,
					minItems: 1,
					children: [
						{
							kind: "field",
							key: "vehicleType",
							type: "text",
							label: "نوع",
							order: 1,
							requiredWhen: { op: "always" },
						},
						{
							kind: "repeatable",
							key: "passengers",
							label: "سرنشین",
							order: 2,
							children: [{
								kind: "field",
								key: "health",
								type: "choice_group",
								label: "وضعیت",
								order: 1,
								requiredWhen: { op: "always" },
								options: {
									kind: "literal",
									items: [{ value: "ok", label: "سالم" }],
								},
							}],
						},
					],
				}],
			}],
		},
	],
};

let ghostId: ObjectId;
let managerId: ObjectId;
let orgHeadA: ObjectId;
let orgHeadB: ObjectId;
let patrolA: ObjectId;
let patrolNoOrg: ObjectId;
let editorId: ObjectId;
let orgA: ObjectId;
let orgB: ObjectId;
let formAId: ObjectId;
let formBId: ObjectId;

const enableAllModules = async () => {
	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
};

Deno.test("setup fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	editorId = await insertUser("Editor");

	orgA = await insertOrg(`سازمان الف ${RUN}`);
	orgB = await insertOrg(`سازمان ب ${RUN}`);

	// OrgHeads are scoped to a single organization.
	orgHeadA = await insertUser("OrgHead", [
		{
			roleId: String(orgA),
			name: "OrgHead",
			scopeType: "organization",
			scopeId: String(orgA),
		},
	]);
	orgHeadB = await insertUser("OrgHead", [
		{
			roleId: String(orgB),
			name: "OrgHead",
			scopeType: "organization",
			scopeId: String(orgB),
		},
	]);

	// Patrol officers reach their organization through a unit.
	patrolA = await insertUser("Patrol", [
		{
			roleId: String(orgA),
			name: "Patrol",
			scopeType: "organization",
			scopeId: String(orgA),
		},
	]);
	await insertUnit(`واحد گشت الف ${RUN}`, orgA, [patrolA]);

	// A patrol officer who belongs to no unit and holds no scoped role.
	patrolNoOrg = await insertUser("Patrol", []);

	const collision = await collision_type.insertOne({
		doc: {
			name: `برخورد ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	assertExists(collision);

	await enableAllModules();
});

// ---------------------------------------------------------------------------
// Requirement 1 — Ghost / Manager / OrgHead can create complex forms
// ---------------------------------------------------------------------------

Deno.test("R1 — Manager can create a complex form", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم پیچیده ${RUN}`,
			incident_type: "accident",
			definition: complexDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId; status: string; version: number };

	assertEquals(created.status, "draft");
	assertEquals(created.version, 1);
	formAId = created._id;
});

Deno.test("R1 — OrgHead can create a form inside their own organization", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرام سرِ سازمان الف ${RUN}`,
			definition: complexDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, orgHeadA) as { _id: ObjectId };

	assertExists(created._id);
});

Deno.test("R1 — OrgHead cannot create a form in another organization", async () => {
	let error = "";
	try {
		await runAct("form_definition", "add", {
			set: {
				organizationId: String(orgB),
				name: `فرم غیرمجاز ${RUN}`,
				definition: complexDefinition as unknown as Document,
			},
			get: FORM_GET,
		}, orgHeadA);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("دسترسی ندارید"),
		`expected an access error, got: ${error}`,
	);
});

Deno.test("R1 — Editor cannot create a form (create is Manager/OrgHead/UnitHead only)", async () => {
	let error = "";
	try {
		await runAct("form_definition", "add", {
			set: {
				organizationId: String(orgA),
				name: `فرم ویرایشگر ${RUN}`,
				definition: complexDefinition as unknown as Document,
			},
			get: FORM_GET,
		}, editorId);
	} catch {
		error = "denied";
	}
	assertEquals(error, "denied", "Editor must not be able to create forms");
});

Deno.test("R1 — a complex definition survives create → activate", async () => {
	// Nesting, conditions and a reference source must all be accepted.
	const result = await runAct("form_definition", "activate", {
		set: { _id: formAId.toString() },
		get: {},
	}, managerId) as { status: string; version: number };

	assertEquals(result.status, "active");
	assertEquals(result.version, 2);
});

// ---------------------------------------------------------------------------
// Requirement 2 — every form belongs to exactly one organization
// ---------------------------------------------------------------------------

Deno.test("R2 — the stored form carries its organization relation", async () => {
	const stored = await form_definition.findOne({
		filters: { _id: formAId },
		projection: { name: 1, "organization._id": 1 },
	});
	const orgRef = (stored as unknown as { organization?: { _id?: ObjectId } })
		?.organization?._id;
	assertExists(orgRef, "a form must always carry its organization");
	assertEquals(orgRef.toString(), orgA.toString());
});

Deno.test("R2 — add rejects a payload with no organizationId", async () => {
	let error = "";
	try {
		await runAct("form_definition", "add", {
			set: {
				name: `فرم بی‌سازمان ${RUN}`,
				definition: complexDefinition as unknown as Document,
			},
			get: FORM_GET,
		}, managerId);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.length > 0, "organizationId must be mandatory");
});

// ---------------------------------------------------------------------------
// Requirement 4 — tenant isolation
// ---------------------------------------------------------------------------

Deno.test("R4 — a Patrol officer cannot read another org's form by id", async () => {
	// Org B gets its own active form.
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgB),
			name: `فرم سازمان ب ${RUN}`,
			incident_type: "accident",
			definition: complexDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };
	formBId = created._id;
	await runAct("form_definition", "activate", {
		set: { _id: formBId.toString() },
		get: {},
	}, managerId);

	let error = "";
	try {
		const body = await runAct("form_definition", "get", {
			set: { _id: formBId.toString() },
			get: FORM_GET,
		}, patrolA);
		const rows = body as unknown[];
		// Either the act refuses, or it returns nothing for a foreign org.
		error = rows.length === 0 ? "" : "LEAKED";
	} catch {
		error = ""; // refused outright — also acceptable
	}
	assertEquals(error, "", "patrol must not be able to read org B's form");
});

Deno.test("R4 — gets only ever returns the caller's own organization", async () => {
	const rows = (await runAct("form_definition", "gets", {
		set: { page: 1, limit: 50 },
		get: FORM_GET,
	}, patrolA)) as Array<{ organization?: { _id?: ObjectId } }>;

	assert(
		rows.length > 0,
		"the officer should still see their own org's forms",
	);
	for (const row of rows) {
		assertEquals(
			row.organization?._id?.toString(),
			orgA.toString(),
			"a patrol officer must never see another organization's form",
		);
	}
});

Deno.test("R4 — gets refuses an explicit foreign organizationId", async () => {
	let error = "";
	try {
		await runAct("form_definition", "gets", {
			set: { page: 1, limit: 50, organizationId: String(orgB) },
			get: FORM_GET,
		}, patrolA);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("دسترسی ندارید") || error.includes("سازمان"),
		`expected a scope error, got: ${error}`,
	);
});

Deno.test("R4 — count only counts the caller's own organization", async () => {
	const { qty } = await runAct("form_definition", "count", {
		set: {},
		get: {},
	}, patrolA) as { qty: number };

	const orgATotal = await form_definition.countDocument({
		filter: { "organization._id": orgA },
	});
	assertEquals(qty, orgATotal, "count must be scoped to the caller's org");
});

Deno.test("R4 — an OrgHead only sees their own organization", async () => {
	const rows = (await runAct("form_definition", "gets", {
		set: { page: 1, limit: 50 },
		get: FORM_GET,
	}, orgHeadB)) as Array<{ organization?: { _id?: ObjectId } }>;

	for (const row of rows) {
		assertEquals(row.organization?._id?.toString(), orgB.toString());
	}
});

// ---------------------------------------------------------------------------
// Requirement 3 & 5 — Patrol resolves the active form
// ---------------------------------------------------------------------------

Deno.test("R3 — a Patrol officer receives their org's active form with options", async () => {
	const payload = await runAct("form_definition", "getForPatrol", {
		set: { incidentType: "accident" },
		get: { form: 1, options: 1, version: 1 },
	}, patrolA) as {
		form: { name: string; definition: FormDefinition } | null;
		options: Record<string, Array<{ _id: string; name: string }>>;
		version: { version: number };
	};

	assertExists(payload.form, "the officer's org has an active form");
	assertEquals(payload.form.name, `فرم پیچیده ${RUN}`);
	assert(
		payload.options.collision_type?.length,
		"reference options resolved",
	);

	// The nested repeatable must have survived the round-trip.
	const pages = payload.form.definition.pages;
	assertEquals(pages.length, 2);
	const nodes = pages[1].sections![0].nodes!;
	assertEquals(nodes[0].kind, "repeatable");
	assertEquals(nodes[0].key, "vehicles");
});

Deno.test("R5 — an organization with no form resolves form:null, not an error", async () => {
	const emptyOrg = await insertOrg(`سازمان خالی ${RUN}`);
	const officer = await insertUser("Patrol", [
		{
			roleId: String(emptyOrg),
			name: "Patrol",
			scopeType: "organization",
			scopeId: String(emptyOrg),
		},
	]);
	await insertUnit(`واحد خالی ${RUN}`, emptyOrg, [officer]);

	const payload = await runAct("form_definition", "getForPatrol", {
		set: { incidentType: "accident" },
		get: { form: 1, options: 1, version: 1 },
	}, officer) as { form: unknown };

	assertEquals(
		payload.form,
		null,
		"no form means null so the client can fall back to the standard flow",
	);
});

Deno.test("R5 — a Patrol officer with no organization is told to join a unit", async () => {
	let error = "";
	try {
		await runAct("form_definition", "getForPatrol", {
			set: { incidentType: "accident" },
			get: { form: 1, options: 1, version: 1 },
		}, patrolNoOrg);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("سازمان مأمور یافت نشد"),
		`expected the org-resolution error, got: ${error}`,
	);
});

Deno.test("R3 — validate re-runs the same rules the client ran", async () => {
	const remote = await runAct("form_definition", "validate", {
		set: {
			_id: formAId.toString(),
			answers: { severity: "low", vehicles: [{ vehicleType: "سواری" }] },
		},
		get: {},
	}, patrolA) as { errors: unknown[]; canSubmit: boolean };

	assertEquals(remote.canSubmit, true, "a complete report should validate");
	assertEquals(remote.errors.length, 0);
});

Deno.test("R4 — validate cannot probe another org's definition", async () => {
	let error = "";
	try {
		const remote = await runAct("form_definition", "validate", {
			set: { _id: formBId.toString(), answers: {} },
			get: {},
		}, patrolA) as { errors: unknown[] };
		// A scoped lookup finds nothing, so the act reports "not found" rather
		// than returning org B's questions in the error list.
		error = remote.errors.length === 0 ? "" : "LEAKED";
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("یافت نشد") || error === "",
		`validate must not expose a foreign definition, got: ${error}`,
	);
});

Deno.test("R3 — validate blocks an incomplete report", async () => {
	const remote = await runAct("form_definition", "validate", {
		set: { _id: formAId.toString(), answers: {} },
		get: {},
	}, patrolA) as { errors: unknown[]; canSubmit: boolean };

	assertEquals(remote.canSubmit, false);
	assert(remote.errors.length > 0);
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	// patrol_ops_env.ts pins DB_NAME for every suite, so drop THAT database —
	// otherwise this suite leaks rows into the next one that runs.
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	const collections = await db.listCollections().toArray();
	for (const c of collections) await db.collection(c.name).drop();
	await client.close();
});
