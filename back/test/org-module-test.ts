/**
 * Per-organization module activation tests.
 *
 * Verifies: per-org default (inherit), Ghost-only org setModules, org-scoped
 * blocking (incl. explicit unitId/orgId blocking a Manager), Ghost bypass,
 * org getModules (deployment/modules/effective), and getMe orgModules.
 *
 * Run: deno test -A test/org-module-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
import { assert as structAssert, create as structCreate } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	coreApp,
	getAtcsWithServices,
	organization,
	road,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const TEST_DB = "nejat_patrol_ops_test";
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
	if (userId) {
		headers.set("token", await makeToken(userId.toString()));
	}
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main[schema][actName];
	assert(act, `act ${schema}.${actName} is not registered`);
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

let seq = 0;

const insertUser = async (
	level: string,
	opts: {
		roles?: Array<{
			roleId: string;
			name: string;
			scopeType?: "organization" | "unit";
			scopeId?: string;
		}>;
	} = {},
): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			father_name: "پدر",
			mobile: `0917${String(10000000 + seq)}`,
			gender: "Male",
			email: `orgmod_${RUN}_${seq}@test.local`,
			address: "تهران",
			level,
			is_active: true,
			failed_login_attempts: 0,
			roles: opts.roles ?? [],
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertRoad = async (name: string): Promise<ObjectId> => {
	seq++;
	const created = await road.insertOne({
		doc: {
			name,
			area: { type: "LineString", coordinates: [[50, 34], [51, 35]] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertOrg = async (roadId: ObjectId, code: string): Promise<ObjectId> => {
	seq++;
	const created = await organization.insertOne({
		doc: {
			code,
			name: `سازمان ${code}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			road: { _ids: roadId, relatedRelations: { organization: true } },
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertUnit = async (
	orgId: ObjectId,
	roadId: ObjectId,
	code: string,
	officerId?: ObjectId,
): Promise<ObjectId> => {
	seq++;
	const created = await unit.insertOne({
		doc: {
			code,
			name: `واحد ${code}`,
			type: "Patrol",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgId, relatedRelations: { units: true } },
			road: { _ids: roadId, relatedRelations: { units: true } },
			...(officerId && {
				officers: { _ids: [officerId], relatedRelations: { unit: true } },
			}),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const orgRole = (orgId: ObjectId, name = "OrgHead") => [{
	roleId: crypto.randomUUID(),
	name,
	scopeType: "organization" as const,
	scopeId: orgId.toString(),
}];

let ghostId: ObjectId;
let managerId: ObjectId;
let orgA: ObjectId;
let orgB: ObjectId;
let unitA: ObjectId;
let unitB: ObjectId;
let actorA: ObjectId;
let actorB: ObjectId;
let officerA: ObjectId;
let roadR: ObjectId;
let roadS: ObjectId;

const orgSet = (orgId: ObjectId, warehouse: boolean, incident = true, charts = true) => [
	{ key: "charts", enabled: charts },
	{ key: "incident_patrol", enabled: incident },
	{ key: "warehouse", enabled: warehouse },
];

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	roadR = await insertRoad(`جاده A ${RUN}`);
	roadS = await insertRoad(`جاده B ${RUN}`);
	orgA = await insertOrg(roadR, `ORG-A-${RUN}`);
	orgB = await insertOrg(roadS, `ORG-B-${RUN}`);
	officerA = await insertUser("Patrol");
	actorA = await insertUser("Enterprise", { roles: orgRole(orgA) });
	actorB = await insertUser("Enterprise", { roles: orgRole(orgB) });
	unitA = await insertUnit(orgA, roadR, `UA-${RUN}`, officerA);
	unitB = await insertUnit(orgB, roadS, `UB-${RUN}`);
	assertEquals(orgA.toString().length, 24);
});

Deno.test("default: every org inherits (all modules on)", async () => {
	const res = await runAct(
		"organization",
		"getModules",
		{ set: { organizationId: orgA.toString() }, get: { deployment: 1, modules: 1, effective: 1 } },
		managerId,
	);
	assertEquals((res as any).effective.length, 3);
	assertEquals((res as any).modules.length, 3);
	for (const m of (res as any).modules) assertEquals(m.enabled, true);
});

Deno.test("Ghost sets orgA warehouse OFF; read reflects effective", async () => {
	await runAct(
		"organization",
		"setModules",
		{ set: { organizationId: orgA.toString(), modules: orgSet(orgA, false) }, get: { success: 1 } },
		ghostId,
	);
	const res = await runAct(
		"organization",
		"getModules",
		{ set: { organizationId: orgA.toString() }, get: { effective: 1, modules: 1 } },
		managerId,
	);
	assertEquals((res as any).effective.sort(), ["charts", "incident_patrol"]);
	assertEquals(
		(res as any).modules.find((m: any) => m.key === "warehouse").enabled,
		false,
	);
});

Deno.test("org-scoped actor of orgA blocked on warehouse; orgB actor allowed", async () => {
	await assertRejects(
		() =>
			runAct(
				"inventory",
				"gets",
				{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
				actorA,
			),
		Error,
		"سازمان",
	);
	const b = await runAct(
		"inventory",
		"gets",
		{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
		actorB,
	);
	assert((b as any).data !== undefined, "orgB actor works");
});

Deno.test("explicit unitId of a module-off org blocks even a Manager; Ghost bypasses", async () => {
	// orgA warehouse is OFF → Manager passing orgA's unit must be blocked.
	await assertRejects(
		() =>
			runAct(
				"inventory",
				"gets",
				{ set: { page: 1, limit: 5, unitId: unitA.toString() }, get: { _id: 1 } },
				managerId,
			),
		Error,
		"سازمان",
	);
	// orgB warehouse is ON → same Manager passing orgB's unit works.
	const ok = await runAct(
		"inventory",
		"gets",
		{ set: { page: 1, limit: 5, unitId: unitB.toString() }, get: { _id: 1 } },
		managerId,
	);
	assert((ok as any).data !== undefined, "manager unit in enabled org works");

	// Ghost bypasses entirely
	const ghost = await runAct(
		"inventory",
		"gets",
		{ set: { page: 1, limit: 5, unitId: unitA.toString() }, get: { _id: 1 } },
		ghostId,
	);
	assert((ghost as any).data !== undefined, "ghost bypasses");
});

Deno.test("Manager cannot set org modules (Ghost-only); invalid key rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"organization",
				"setModules",
				{
					set: { organizationId: orgA.toString(), modules: orgSet(orgA, true) },
					get: { success: 1 },
				},
				managerId,
			),
		Error,
		"You cant do this",
	);
	await assertRejects(
		() =>
			runAct(
				"organization",
				"setModules",
				{
					set: {
						organizationId: orgA.toString(),
						modules: [{ key: "bogus" as never, enabled: true }],
					},
					get: { success: 1 },
				},
				ghostId,
			),
		Error,
	);
});

Deno.test("getMe of an org officer reflects orgModules (warehouse missing)", async () => {
	const res = await runAct(
		"user",
		"getMe",
		{ set: {}, get: { _id: 1 } },
		officerA,
	);
	const modules: string[] = (res as any).modules || [];
	const orgModules: string[] = (res as any).orgModules || [];
	assertEquals(modules.length, 3, "deployment modules present");
	assert(!orgModules.includes("warehouse"), "officer orgModules exclude warehouse");
	assert(orgModules.includes("charts"), "officer orgModules include charts");
	assert(orgModules.includes("incident_patrol"), "incident on for orgA");
});

Deno.test("re-enable orgA warehouse; effective is all three again", async () => {
	await runAct(
		"organization",
		"setModules",
		{ set: { organizationId: orgA.toString(), modules: orgSet(orgA, true) }, get: { success: 1 } },
		ghostId,
	);
	const res = await runAct(
		"organization",
		"getModules",
		{ set: { organizationId: orgA.toString() }, get: { effective: 1 } },
		managerId,
	);
	assertEquals((res as any).effective.length, 3);
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
