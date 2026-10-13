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
	accident,
	air_status,
	coreApp,
	device,
	file,
	form_definition,
	getAtcsWithServices,
	organization,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { qaAccidentFormDefinition } from "@forms";
import { MODULE_KEYS } from "../src/app_modules/constants.ts";
import { seedSharedReferenceModels } from "../src/user/cleanupDemoSeed/cleanupDemoSeed.fn.ts";
import { SEED_SHARED_MARKER } from "../src/shared/seedShared/seedShared.fn.ts";
import {
	DEMO_EMAIL_DOMAIN,
	DEMO_PASSWORD,
} from "../src/user/seedDemoOrganization/people.ts";
import { DEMO_ORG_CODE } from "../src/user/seedDemoOrganization/org.ts";

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

// ---------------------------------------------------------------------------
// The rebuild order — what an operator actually runs to pick up a form change
// ---------------------------------------------------------------------------

const moduleConfigCount = () =>
	coreApp.odm.getCollection("module_config")
		.countDocuments({ key: "app_modules" });

/** Every `lane` option list in a definition, flattened. */
const laneOptions = (definition: unknown): string[] => {
	const found: string[] = [];
	const walk = (nodes: unknown[]) => {
		for (const raw of nodes) {
			const node = raw as {
				key?: string;
				kind?: string;
				options?: { items?: Array<{ value?: string }> };
				children?: unknown[];
			};
			if (node.key === "lane") {
				for (const item of node.options?.items ?? []) {
					if (item.value) found.push(item.value);
				}
			}
			if (node.kind !== "field" && node.children) walk(node.children);
		}
	};
	const pages = (definition as { pages?: unknown[] } | null)?.pages ?? [];
	for (const page of pages) {
		for (
			const section
				of (page as { sections?: Array<{ nodes?: unknown[] }> })
					.sections ?? []
		) {
			walk(section.nodes ?? []);
		}
	}
	return found;
};

const pageKeys = (definition: unknown): string[] =>
	((definition as { pages?: Array<{ key?: string }> } | null)?.pages ?? [])
		.map((page) => String(page.key));

const accidentForm = async () =>
	await form_definition.findOne({
		filters: { form_kind: "accident" },
		projection: { _id: 1, status: 1, version: 1, definition: 1 },
	}) as unknown as
		| {
			_id: ObjectId;
			status?: string;
			version?: number;
			definition?: unknown;
		}
		| null;

Deno.test("setModules recreates the module singleton that a cleanup removed", async () => {
	// The regression this pins. `setModuleConfig` was a bare `findOneAndUpdate`
	// with no upsert, so once `cleanupDemoSeed` had removed the row — its `modules`
	// scope, included in `all` — the next `app_modules.setModules` died with
	// Lesan's «can not update this doc». That is step 2 of the documented rebuild
	// order, so the whole order was unusable: cleanup left the database in a state
	// the next step could not recover from, and only a server boot could.
	assertEquals(
		await moduleConfigCount(),
		0,
		"precondition: the previous test removed the singleton",
	);

	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);

	assertEquals(await moduleConfigCount(), 1, "setModules recreated it");
	const row = await coreApp.odm.getCollection("module_config")
		.findOne({ key: "app_modules" }) as
			| { modules?: Array<{ key: string; enabled: boolean }> }
			| null;
	assertEquals(
		row?.modules?.length,
		MODULE_KEYS.length,
		"and wrote a row for every module key, not a partial set",
	);
	assertEquals(
		row?.modules?.every((entry) => entry.enabled),
		true,
		"all enabled, as asked",
	);
});

Deno.test("the rebuild order picks up a changed form definition", async () => {
	// What an operator runs after changing `forms.ts`, and the reason this file
	// has to cover it: the seed is create-only, so a stale definition survives any
	// number of re-runs. Only removing the rows first gets the new tree in.
	//
	// `seedShared` has to run here as well as inside the rebuild below: the
	// preceding test's `reference` cleanup removed the stamped rows, and
	// `seedDemoOrganization` refuses to publish a form whose reference model is
	// empty. That is the same ordering constraint the rebuild order encodes.
	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
	await seed(managerId);
	const first = await accidentForm();
	assertEquals(first?.status, "active", "precondition: seeded and active");
	assertEquals(
		laneOptions(first?.definition),
		laneOptions(qaAccidentFormDefinition),
		"precondition: it starts out matching the source",
	);

	// Make the stored tree stale, which is the state this whole procedure exists
	// to recover from.
	const stale = JSON.parse(JSON.stringify(first!.definition)) as {
		pages?: Array<{ sections?: Array<{ nodes?: unknown[] }> }>;
	};
	const bump = (nodes: unknown[]) => {
		for (const raw of nodes) {
			const node = raw as {
				key?: string;
				kind?: string;
				options?: { items?: Array<{ value?: string }> };
				children?: unknown[];
			};
			if (node.key === "lane" && node.options?.items) {
				node.options.items = [...node.options.items, { value: "خط ۳" }];
			}
			if (node.kind !== "field" && node.children) bump(node.children);
		}
	};
	for (const page of stale.pages ?? []) {
		for (const section of page.sections ?? []) bump(section.nodes ?? []);
	}
	await form_definition.findOneAndUpdate({
		filter: { _id: first!._id },
		update: { $set: { definition: stale } } as never,
		projection: { _id: 1 },
	});
	assertEquals(
		laneOptions((await accidentForm())?.definition).includes("خط ۳"),
		true,
		"precondition: the stored tree is now stale",
	);

	// --- the four acts, in the documented order ------------------------------
	await cleanup({ scope: ["all"], confirm: true }, managerId);
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
	await runAct(
		"user",
		"seedDemoOrganization",
		{ set: {}, get: {} },
		managerId,
	);

	const rebuilt = await accidentForm();
	assertEquals(rebuilt?.status, "active", "the rebuilt form is live");
	assertEquals(
		pageKeys(rebuilt?.definition),
		pageKeys(qaAccidentFormDefinition),
		"the rebuilt definition is the current source's, page for page",
	);
	assertEquals(
		laneOptions(rebuilt?.definition),
		laneOptions(qaAccidentFormDefinition),
		"including the lane list the client narrowed to two carriageways",
	);
	assertEquals(
		JSON.stringify(rebuilt?.definition).includes("خط ۳"),
		false,
		"and the stale answer is gone from the stored document entirely",
	);

	// The rebuild leaves exactly one demo org, not a second one beside the first.
	assertEquals(await count(organization, { code: "AHR" }), 1, "one demo org");
});

Deno.test("a demo an officer has actually used can still be cleaned", async () => {
	// The regression this pins, and the state every operator's database is in.
	//
	// `device.owner` and `file.uploader` are both declared `optional: false`, and
	// neither is written by a seed: they appear the first time an officer logs in
	// from the phone, and again when they attach a photo. `removeRelation` refuses
	// a required relation — Lesan answers «please use addRelation to replace it» —
	// so the only legal way to end that link is to delete the document holding it.
	// Before the schema sweep this act died with `please clear below relations
	// status before deletion`, naming `device`: a collection the seed's own list
	// does not mention, so nothing in the operator's mental model connected it to
	// the demo. A demo nobody had touched cleaned up fine; one that had been used
	// could not be cleaned at all — which is exactly when it is needed.
	//
	// The officer is the one from the original report.
	const email = `patrol.nm01.1@${DEMO_EMAIL_DOMAIN}`;
	const login = await runAct("user", "login", {
		set: {
			email,
			password: DEMO_PASSWORD,
			device: {
				device_id: `lesen-test-${RUN}-device`,
				fingerprint: `fingerprint-${RUN}`,
				platform: "android",
				app_version: "1.0.0",
				model: "Test Device",
			},
		},
		get: { token: 1, user: { _id: 1 } },
	}) as { token?: string; user?: { _id: string } };
	assert(login.user?._id, "precondition: the officer can log in");
	const officerId = new ObjectId(login.user!._id);

	const owned = await device.findOne({
		filters: { "owner._id": officerId },
		projection: { _id: 1 },
	}) as unknown as { _id: ObjectId } | null;
	assert(
		owned?._id,
		"precondition: the device-scoped login wrote a device row",
	);

	// The shape `file.uploadFile` writes — the uploader relation is required — with
	// the multipart upload left out.
	const uploaded = await file.insertOne({
		doc: {
			name: `photo-${RUN}.jpg`,
			type: "image/jpeg",
			size: 1024,
			path: "images/photo.jpg",
			category: "other",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			uploader: {
				_ids: officerId,
				relatedRelations: { uploadedAssets: true },
			},
		},
		projection: { _id: 1 },
	});
	const fileId = uploaded!._id as ObjectId;

	const dry = await cleanup({ scope: ["demo"] }, managerId);
	assertEquals(
		dry.wouldDelete.requiredDependents.device,
		1,
		"the dry run names the officer's device",
	);
	assertEquals(
		dry.wouldDelete.requiredDependents.file,
		1,
		"and the photo they attached",
	);

	// The whole point: this used to reject.
	const done = await cleanup({ scope: ["demo"], confirm: true }, managerId);
	assertEquals(done.deleted, true, "the confirming call resolves");
	assertEquals(done.removed.requiredDependents.device, 1, "device counted");
	assertEquals(done.removed.requiredDependents.file, 1, "file counted");

	assertEquals(await count(device, { _id: owned!._id }), 0, "device removed");
	assertEquals(await count(file, { _id: fileId }), 0, "file removed");
	assertEquals(await count(user, { email }), 0, "and so is its owner");
});

/** The demo org and its road, as the seed wrote them. */
const demoOrgWithRoad = async () =>
	await organization.findOne({
		filters: { code: DEMO_ORG_CODE },
		projection: { _id: 1, road: 1 },
	}) as unknown as { _id: ObjectId; road?: { _id?: ObjectId } } | null;

/** A report filed from the app: officer + organization, as the console sees it. */
const seedDemoAccident = async (officer: ObjectId, label: string) => {
	seq++;
	const org = await demoOrgWithRoad();
	assert(org, "precondition: the demo org exists");
	return (await accident.insertOne({
		doc: {
			seri: seq,
			serial: seq,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: new Date(),
			dead_count: 0,
			has_witness: false,
			news_number: 0,
			officer: label,
			injured_count: 0,
			completion_date: new Date(),
			sync_status: "synced",
			review_status: "submitted",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: org!._id },
			officer: { _ids: officer },
			...(org!.road?._id ? { road: { _ids: org!.road._id } } : {}),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;
};

Deno.test("a photo attached to a demo report does not block the cleanup", async () => {
	// The regression that made the act unusable against any demo an officer had
	// actually *reported* with — which is every demo worth cleaning.
	//
	// A photo attached to a report is not just an orphan of the officer: it is
	// embedded in the report's own `attachments`, a denormalised copy Lesan keeps
	// in step. `file.uploader` is required, so the sweep reaches the file, but the
	// sweep ran *before* the reports were deleted, so Lesan's delete guard found
	// the file still listed under `accident.attachments` and refused:
	// «please clear below relations status before deletion», naming an `accident`
	// row the operator had every reason to expect to disappear in this same call.
	const email = `patrol.nm01.1@${DEMO_EMAIL_DOMAIN}`;
	await seed(managerId);

	const login = await runAct("user", "login", {
		set: {
			email,
			password: DEMO_PASSWORD,
			device: {
				device_id: `lesen-test-${RUN}-attached-device`,
				fingerprint: `fingerprint-${RUN}-attached`,
				platform: "android",
				app_version: "1.0.0",
				model: "Test Device",
			},
		},
		get: { user: { _id: 1 } },
	}) as { user?: { _id: string } };
	assert(login.user?._id, "precondition: the officer can log in");
	const officerId = new ObjectId(login.user!._id);

	const accidentId = await seedDemoAccident(officerId, "گزارش با عکس");

	// The shape `file.uploadAccidentImages` writes: uploader required, accident the
	// optional relation the photo is attached through.
	const uploaded = await file.insertOne({
		doc: {
			name: `attached-${RUN}.jpg`,
			type: "image/jpeg",
			size: 2048,
			path: "images/attached.jpg",
			category: "other",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			uploader: {
				_ids: officerId,
				relatedRelations: { uploadedAssets: true },
			},
			accident: {
				_ids: accidentId,
				relatedRelations: { attachments: true },
			},
		},
		projection: { _id: 1 },
	});
	const fileId = uploaded!._id as ObjectId;

	const attached = await accident.findOne({
		filters: { _id: accidentId },
		projection: { attachments: 1 },
	}) as unknown as { attachments?: Array<{ _id?: ObjectId }> } | null;
	assertEquals(
		attached?.attachments?.some((row) =>
			row._id?.toString() === fileId.toString()
		),
		true,
		"precondition: the report holds the photo, the state the guard trips on",
	);

	const done = await cleanup({ scope: ["demo"], confirm: true }, managerId);
	assertEquals(done.deleted, true, "the confirming call resolves");
	assertEquals(
		done.removed.detachedReferences["accident.attachments"],
		1,
		"and reports the link it cut on the report side",
	);

	assertEquals(await count(file, { _id: fileId }), 0, "the photo is gone");
	assertEquals(
		await count(accident, { _id: accidentId }),
		0,
		"and so is the report it was attached to",
	);
	assertEquals(await count(user, { email }), 0, "and the officer");
});

Deno.test("a demo report does not take a stranger's photo with it", async () => {
	// The other direction, and the one that decides the design.
	//
	// A photo attached to a demo report is not necessarily the demo's: the console
	// uploads and attaches too. The file is a required dependent of *its* uploader,
	// so it is only scheduled for deletion when that uploader is ours. When it is
	// not, the link is all that can be cut — and cutting it is the whole point,
	// because `hardCascade: true` would have taken the stranger's photo with the
	// report: Lesan's cascade deletes every document a relation *points at*, not
	// the relation. Deleting the reference is the only reading of this act's
	// promise ("only what the seeds own") that leaves their asset intact.
	await seed(managerId);
	const stranger = await insertUser("Manager");

	const accidentId = await seedDemoAccident(managerId, "گزارش با عکس غریبه");
	const uploaded = await file.insertOne({
		doc: {
			name: `stranger-${RUN}.jpg`,
			type: "image/jpeg",
			size: 4096,
			path: "images/stranger.jpg",
			category: "other",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			uploader: {
				_ids: stranger,
				relatedRelations: { uploadedAssets: true },
			},
			accident: {
				_ids: accidentId,
				relatedRelations: { attachments: true },
			},
		},
		projection: { _id: 1 },
	});
	const fileId = uploaded!._id as ObjectId;

	const done = await cleanup({ scope: ["demo"], confirm: true }, managerId);
	assertEquals(done.deleted, true, "the confirming call resolves");
	// On *this* side of the link, not the report's: the photo is not ours, so it is
	// not in the delete set, and `accident.attachments` therefore points at nothing
	// this act is removing. What does is the report, so the sweep cuts the link from
	// the file — which is what leaves no dangling reference behind on the asset we
	// must not delete.
	assertEquals(
		done.removed.detachedReferences["file.accident"],
		1,
		"and reports the link it cut",
	);

	assertEquals(
		await count(accident, { _id: accidentId }),
		0,
		"the demo report is gone",
	);
	assertEquals(
		await count(file, { _id: fileId }),
		1,
		"but the stranger's photo survives — only the reference was ours",
	);
	assertEquals(
		await count(user, { _id: stranger }),
		1,
		"and so does its owner",
	);
	// A link left pointing at a deleted report would be a dangling reference on
	// somebody else's document, so the sweep cuts this side too. Lesan represents a
	// cleared `single` relation as `{}` rather than removing the field, so the id is
	// what is asked about.
	const survivor = await file.findOne({
		filters: { _id: fileId },
		projection: { accident: 1 },
	}) as unknown as { accident?: { _id?: ObjectId } } | null;
	assertEquals(
		survivor?.accident?._id ?? null,
		null,
		"and it no longer points at the report that is gone",
	);
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
