/**
 * Per-deployment module activation tests.
 *
 * Verifies: default all-on, Ghost-only setModules, hard act gating per module,
 * Ghost bypass, core acts stay open, invalid key rejection, and persistence.
 *
 * Run: deno test -A test/module-config-test.ts
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
import { coreApp, getAtcsWithServices, module_config, user } from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { MODULE_KEYS } from "../src/app_modules/constants.ts";
import {
	ensureModuleConfig,
	getEnabledModuleKeys,
	getModuleConfigRows,
} from "../src/app_modules/moduleConfig.ts";

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
const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			father_name: "پدر",
			mobile: `0916${String(10000000 + seq)}`,
			gender: "Male",
			email: `mod_${RUN}_${seq}@test.local`,
			address: "تهران",
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

const allOn = [
	{ key: "charts", enabled: true },
	{ key: "incident_patrol", enabled: true },
	{ key: "warehouse", enabled: true },
	{ key: "forms", enabled: true },
];

let ghostId: ObjectId;
let managerId: ObjectId;

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	assertEquals(ghostId.toString().length, 24);
});

Deno.test("default: all modules enabled + readable via system.getModules", async () => {
	const result = await runAct(
		"app_modules",
		"getModules",
		{ set: {}, get: { modules: 1 } },
		managerId,
	);
	assertEquals((result as any).modules.length, MODULE_KEYS.length);
	for (const m of (result as any).modules) {
		assertEquals(m.enabled, true);
	}
});

Deno.test("Manager cannot change modules (Ghost-only)", async () => {
	await assertRejects(
		() =>
			runAct(
				"app_modules",
				"setModules",
				{ set: { modules: allOn }, get: { success: 1 } },
				managerId,
			),
		Error,
		"You cant do this",
	);
});

Deno.test("invalid module key is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"app_modules",
				"setModules",
				{
					set: {
						modules: [
							{ key: "bogus" as never, enabled: true },
						],
					},
					get: { success: 1 },
				},
				ghostId,
			),
		Error,
	);
});

Deno.test("a stored doc missing a module key does NOT keep that module off", async () => {
	// سندِ «قدیمی»: تنها سه ماژولی که هنگام نوشتنش وجود داشتند — `forms` نیست.
	// این وضعیت برای هر نصبی رخ می‌دهد که پیش از معرفی ماژولِ تازه پیکربندی شده.
	await module_config.findOneAndUpdate({
		filter: { key: "app_modules" },
		update: {
			$set: {
				modules: [
					{ key: "charts", enabled: true },
					{ key: "incident_patrol", enabled: true },
					{ key: "warehouse", enabled: true },
				],
			},
		},
		projection: { _id: 1 },
	});

	// مسیر بوت: ensureModuleConfig روی سندِ موجود، refreshEnabledSet را صدا می‌زند.
	await ensureModuleConfig();

	assert(
		getEnabledModuleKeys().includes("forms"),
		"کلیدِ غایب در سند نباید ماژول را برای همیشه خاموش کند",
	);

	// UI باید همان را بگوید — گیت و getModuleConfigRows هم‌داستان باشند.
	const rows = await getModuleConfigRows();
	assertEquals(rows.find((r) => r.key === "forms")?.enabled, true);

	// و در عمل: اکشنِ ماژولِ فرم نباید برای Manager رد شود.
	const formResult = await runAct(
		"form_definition",
		"gets",
		{ set: { page: 1, limit: 1 }, get: { _id: 1 } },
		managerId,
	);
	assert(
		Array.isArray((formResult as any).data ?? formResult),
		"form_definition.gets باید باز باشد",
	);

	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: allOn }, get: { success: 1 } },
		ghostId,
	);
});

Deno.test("a partial setModules write never silently disables other modules", async () => {
	// فقط یک ماژول می‌فرستیم (مثل UI که فقط ماژول‌های همان صفحه را می‌فرستد).
	// بقیه باید روشن بمانند و در سند هم ردیف داشته باشند.
	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: [{ key: "charts", enabled: true }] }, get: { success: 1 } },
		ghostId,
	);

	const doc = await module_config.findOne({
		filters: { key: "app_modules" },
		projection: { modules: 1 },
	});
	const stored = (doc as any).modules as Array<{ key: string; enabled: boolean }>;
	assertEquals(
		stored.length,
		MODULE_KEYS.length,
		"سند باید برای هر کلیدِ ماژول ردیف داشته باشد",
	);
	for (const key of MODULE_KEYS) {
		assert(stored.some((m) => m.key === key), `${key} باید در سند ذخیره شود`);
		assert(
			getEnabledModuleKeys().includes(key),
			`${key} نباید با ذخیرهٔ جزئی خاموش شود`,
		);
	}

	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: allOn }, get: { success: 1 } },
		ghostId,
	);
});

Deno.test("disabling warehouse hard-blocks its acts; core stays open; Ghost bypasses", async () => {
	await runAct(
		"app_modules",
		"setModules",
		{
			set: {
				modules: [
					{ key: "charts", enabled: true },
					{ key: "incident_patrol", enabled: true },
					{ key: "warehouse", enabled: false },
				],
			},
			get: { success: 1 },
		},
		ghostId,
	);

	// warehouse act → blocked for Manager
	await assertRejects(
		() =>
			runAct(
				"inventory",
				"gets",
				{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
				managerId,
			),
		Error,
		"ماژول",
	);

	// core act → still open for Manager
	const coreResult = await runAct(
		"unit",
		"gets",
		{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
		managerId,
	);
	assert(Array.isArray(coreResult), "core unit.gets works");

	// Ghost bypasses the gate
	const ghostResult = await runAct(
		"inventory",
		"gets",
		{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
		ghostId,
	);
	assert((ghostResult as any).data !== undefined, "ghost bypasses the gate");

	// persisted in the config doc
	const doc = await module_config.findOne({
		filters: { key: "app_modules" },
		projection: { modules: 1 },
	});
	const warehouseRow = ((doc as any).modules as Array<{ key: string; enabled: boolean }>)
		.find((m) => m.key === "warehouse");
	assertEquals(warehouseRow?.enabled, false);

	// re-enable
	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: allOn }, get: { success: 1 } },
		ghostId,
	);
});

Deno.test("disabling incident_patrol blocks patrol acts but not admin accident CRUD", async () => {
	await runAct(
		"app_modules",
		"setModules",
		{
			set: {
				modules: [
					{ key: "charts", enabled: true },
					{ key: "incident_patrol", enabled: false },
					{ key: "warehouse", enabled: true },
				],
			},
			get: { success: 1 },
		},
		ghostId,
	);

	// patrol-specific act → blocked
	await assertRejects(
		() =>
			runAct(
				"accident",
				"getMyReports",
				{ set: { page: 1, limit: 5 }, get: { _id: 1 } },
				managerId,
			),
		Error,
		"ماژول",
	);

	// core admin accident list → open
	const coreList = await runAct(
		"accident",
		"gets",
		{ set: { page: 1, limit: 1 }, get: { _id: 1 } },
		managerId,
	);
	assert(Array.isArray(coreList), "accident.gets (core) stays open");

	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: allOn }, get: { success: 1 } },
		ghostId,
	);
});

Deno.test("disabling charts blocks analytics acts", async () => {
	await runAct(
		"app_modules",
		"setModules",
		{
			set: {
				modules: [
					{ key: "charts", enabled: false },
					{ key: "incident_patrol", enabled: true },
					{ key: "warehouse", enabled: true },
				],
			},
			get: { success: 1 },
		},
		ghostId,
	);

	await assertRejects(
		() =>
			runAct(
				"accident",
				"temporalCountAnalytics",
				{ set: {}, get: { analytics: 1 } },
				managerId,
			),
		Error,
		"ماژول",
	);

	await runAct(
		"app_modules",
		"setModules",
		{ set: { modules: allOn }, get: { success: 1 } },
		ghostId,
	);
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
