/**
 * `user.cleanupDemoSeed` tests.
 *
 * The behaviour worth protecting is not "it deletes things" — it is the two
 * promises that make running it against a real database safe:
 *
 * 1. **Nothing is deleted without `confirm: true`.** The default call reports
 *    what it *would* remove and leaves every collection untouched.
 * 2. **Pre-existing rows survive a `reference` cleanup.** `user.seedShared`
 *    skips names that already exist, so a row sharing a seeded name carries no
 *    marker and cannot be told apart from a seeded one by name. A name-based
 *    cleanup would destroy it. These tests plant exactly that row and assert it
 *    is still there afterwards.
 *
 * Run: deno test -A test/cleanup-demo-seed-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	air_status,
	coreApp,
	getAtcsWithServices,
	organization,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { MODULE_KEYS } from "../src/app_modules/constants.ts";
import { seedSharedReferenceModels } from "../src/user/cleanupDemoSeed/cleanupDemoSeed.fn.ts";
import { SEED_SHARED_MARKER } from "../src/shared/seedShared/seedShared.fn.ts";

const TEST_DB = "nejat_patrol_ops_test";
const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(3600),
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
	for (const pre of act.preAct ?? []) await pre();
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details,
	});
};

let seq = 0;
const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: "خانوادگی",
			father_name: "پدر",
			mobile: `0918${String(10000000 + seq)}`,
			gender: "Male",
			email: `clean_${level.toLowerCase()}_${RUN}_${seq}@test.local`,
			level,
			address: "-",
			is_active: true,
			failed_login_attempts: 0,
			roles: [],
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const cleanup = (
	set: Document,
	as?: ObjectId,
) => runAct("user", "cleanupDemoSeed", { set, get: {} }, as) as Promise<
	Record<string, any>
>;

const seed = (as: ObjectId) =>
	runAct("user", "seedDemoOrganization", { set: {}, get: {} }, as) as Promise<
		Record<string, any>
	>;

const counts = async () => ({
	org: await count(organization, { code: "AHR" }),
	units: await count(unit, { code: { $regex: "^AHR-" } }),
	users: await count(user, {
		email: { $regex: "@ahvaz-freeway\\.ir$" },
	}),
});

/**
 * Lesan's ODM spells it `countDocument` and takes `{filter}`, not `countDocuments`
 * / `{filters}`. A wrong key silently counts the whole collection, so this
 * wrapper is the only place that shape appears.
 */
const count = (model: any, filter: Document): Promise<number> =>
	model.countDocument({ filter });

let ghostId: ObjectId;
let managerId: ObjectId;

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
	// `seedDemoOrganization` refuses without reference records, by design, so the
	// ordering constraint the plan called out is set up here rather than being
	// rediscovered as a test failure.
	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
});

Deno.test("a Patrol user cannot run cleanup", async () => {
	const patrolId = await insertUser("Patrol");
	await assertRejects(
		() => cleanup({}, patrolId),
		Error,
		"You cant do this",
	);
});

Deno.test("dry run reports without deleting anything", async () => {
	await seed(managerId);
	const before = await counts();
	assert(
		before.org === 1 && before.units === 6 && before.users === 17,
		"seeded",
	);

	// No `confirm` — the guard's whole point.
	const dry = await cleanup({ scope: ["demo"] }, managerId);
	assertEquals(dry.dryRun, true);
	assertEquals(dry.deleted, false);
	// 1 road + the org + 6 units + 17 users + 12 vehicles + 4 forms.
	assertEquals(
		dry.total,
		1 + before.org + before.units + before.users + 12 + 4,
		"counts what it would remove",
	);

	assertEquals(await counts(), before, "nothing was deleted");
});

Deno.test("confirm deletes the demo organization and nothing else", async () => {
	const seeded = await seed(managerId);
	const otherUser = await insertUser("Manager");
	const otherUserId = otherUser.toString();

	const done = await cleanup({ scope: ["demo"], confirm: true }, managerId);
	assertEquals(done.dryRun, false);
	assertEquals(done.deleted, true);
	assert(done.removed.organizations >= 1, "org removed");

	const after = await counts();
	assertEquals(after.org, 0, "demo org gone");
	assertEquals(after.units, 0, "demo units gone");
	assertEquals(after.users, 0, "demo users gone");

	// The operator's own account and the fixture accounts must survive: this act
	// matches on the seed's email domain and `organization.code`, never on
	// "everything", and deleting the caller would make the act unusable.
	assertEquals(
		await count(user, { _id: new ObjectId(otherUserId) }),
		1,
		"an unrelated user survives",
	);
	assertEquals(
		await count(user, { _id: managerId }),
		1,
		"the calling user survives",
	);
	void seeded;
});

Deno.test("a second cleanup finds nothing left to do", async () => {
	const dry = await cleanup({ scope: ["demo"] }, managerId);
	assertEquals(dry.nothingToDo, true, "already clean");
	assertEquals(dry.total, 0);
});

Deno.test("a reference cleanup preserves pre-existing rows that share a seeded name", async () => {
	// The exact hazard: `صاف` is in seedShared's list. Simulate a database where
	// that row already existed before the seed ever ran — unstampable, and
	// indistinguishable from a seeded row by name.
	const PRE_EXISTING = "ردیف دستی — پیش از seedShared";
	await air_status.insertOne({
		doc: {
			name: PRE_EXISTING,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});
	await air_status.insertOne({
		doc: {
			name: "صاف",
			// No `seed` marker: this is the row seedShared SKIPPED.
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});

	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
	const stamped = await count(air_status, {
		seed: SEED_SHARED_MARKER,
	});
	assert(
		stamped > 0,
		"precondition: seedShared stamped some air_status rows",
	);

	const dry = await cleanup({ scope: ["reference"] }, managerId);
	assert(
		dry.preserved.names.includes(`air_status: ${PRE_EXISTING}`),
		"the unrelated row is named as preserved",
	);

	await cleanup({ scope: ["reference"], confirm: true }, managerId);

	assertEquals(
		await count(air_status, { name: PRE_EXISTING }),
		1,
		"an unrelated row sharing the table must survive",
	);
	assertEquals(
		await count(air_status, { name: "صاف" }),
		1,
		"a colliding unstampable name must survive — it was never ours",
	);
	assertEquals(
		await count(air_status, { seed: SEED_SHARED_MARKER }),
		0,
		"stamped rows are gone",
	);
});

Deno.test("the reference model list matches the seed's own", async () => {
	// Guards the duplication: cleanup carries its own list of models, and a model
	// added to the seed but forgotten here would leak rows on every cleanup.
	const seededModels = new Set(seedSharedReferenceModels().map((r) => r.key));
	for (
		const expected of [
			"vehicle_type",
			"air_status",
			"light_status",
			"road_defect",
			"equipment_damage",
			"ware",
		]
	) {
		assert(seededModels.has(expected), `${expected} must be cleanable`);
	}
	assertEquals(seededModels.size, 16, "sixteen reference models");
});

Deno.test("modules scope reports and removes the singleton", async () => {
	const before = await coreApp.odm.getCollection("module_config")
		.countDocuments({ key: "app_modules" });
	assertEquals(before, 1, "precondition: config exists");

	const dry = await cleanup({ scope: ["modules"] }, managerId);
	assertEquals(dry.wouldDelete.moduleConfig, 1);

	await cleanup({ scope: ["modules"], confirm: true }, managerId);
	assertEquals(
		await coreApp.odm.getCollection("module_config")
			.countDocuments({ key: "app_modules" }),
		0,
		"singleton removed; ensureModuleConfig recreates it as all-on at next boot",
	);
});

Deno.test("all expands to the three real scopes", async () => {
	const dry = await cleanup({ scope: ["all"] }, managerId);
	assertEquals(dry.scope.sort(), ["demo", "modules", "reference"]);
});

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(TEST_DB);
	const collections = await db.listCollections().toArray();
	for (const c of collections) {
		await db.collection(c.name).deleteMany({});
	}
	await client.close();
});
