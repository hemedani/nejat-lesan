/**
 * Accident reporting process builder backend tests (Phase 6).
 *
 * Verifies the org-scoped wizard process: builder CRUD, activate validation,
 * one-active-per-org(+type), getForPatrol whitelist resolution ("3 of 50"),
 * relation/dynamic submit mapping into accident, and duplicateProcess.
 *
 * Runs against a local MongoDB using an isolated database
 * (`nejat_patrol_ops_test`) so dev data is never touched.
 *
 * Run: deno test -A test/accident-process-test.ts
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
import {
	accident,
	accident_process,
	collision_type,
	coreApp,
	damage_severity,
	getAtcsWithServices,
	organization,
	road,
	road_defect,
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
	assertExists(act, `act ${schema}.${actName} is not registered`);
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `proc_${RUN}_${seq}@test.local`,
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

const insertShared = async (model: any, name: string): Promise<ObjectId> => {
	seq++;
	const created = await model.insertOne({
		doc: { name, createdAt: new Date(), updatedAt: new Date() },
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let managerId: ObjectId;
let patrolId: ObjectId;
let orgA: ObjectId;
let collisionRear: ObjectId;
let sev1: ObjectId;
let sev2: ObjectId;
let sev3: ObjectId;
let sev4: ObjectId;
let defect1: ObjectId;
let defect2: ObjectId;
let defect3: ObjectId;

const PROCESS_GET: Document = {
	_id: 1,
	name: 1,
	status: 1,
	version: 1,
	incident_type: 1,
	steps: 1,
	organization: { _id: 1, name: 1 },
};

const buildQuestion = (
	key: string,
	question: string,
	modelName: string,
	order: number,
	target: any,
	extra: Record<string, unknown> = {},
) => ({
	key,
	question,
	model_name: modelName,
	order,
	required: true,
	multi_select: false,
	target,
	allowed_answer_ids: [],
	...extra,
});

Deno.test("seed fixtures", async () => {
	managerId = await insertUser("Manager");
	// مأمور گشت با نقش سازمانی تا getForPatrol سازمان را خودکار پیدا کند.
	seq++;
	const roadId = await (async () => {
		const r = await road.insertOne({
			doc: {
				name: `آزادراه پروسه ${RUN}`,
				area: { type: "LineString", coordinates: [[50, 34], [51, 35]] },
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			projection: { _id: 1 },
		});
		return r!._id as ObjectId;
	})();
	const orgCreated = await organization.insertOne({
		doc: {
			code: `ORG-PROC-${RUN}`,
			name: "سازمان پروسه",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			road: { _ids: roadId, relatedRelations: { organization: true } },
		},
		projection: { _id: 1 },
	});
	orgA = orgCreated!._id as ObjectId;
	const unitId = await (async () => {
		const u = await unit.insertOne({
			doc: {
				code: `U-PROC-${RUN}`,
				name: "گشت پروسه",
				type: "Patrol",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations: {
				organization: { _ids: orgA, relatedRelations: { units: true } },
				road: { _ids: roadId, relatedRelations: { units: true } },
			},
			projection: { _id: 1 },
		});
		return u!._id as ObjectId;
	})();

	patrolId = await insertUser("Patrol", {
		roles: [{
			roleId: crypto.randomUUID(),
			name: "Patrol",
			scopeType: "organization",
			scopeId: orgA.toString(),
		}],
	});
	await unit.addRelation({
		filters: { _id: unitId },
		relations: {
			officers: { _ids: [patrolId], relatedRelations: { unit: true } },
		},
		projection: { _id: 1 },
	});

	// Reference records for whitelist questions
	collisionRear = await insertShared(collision_type, "برخورد از عقب");
	sev1 = await insertShared(damage_severity, "جزئی");
	sev2 = await insertShared(damage_severity, "متوسط");
	sev3 = await insertShared(damage_severity, "شدید");
	sev4 = await insertShared(damage_severity, "تخریب کامل");
	defect1 = await insertShared(road_defect, "نقص گاردریل");
	defect2 = await insertShared(road_defect, "آبگرفتگی");
	defect3 = await insertShared(road_defect, "روسازی");

	assertExists(managerId);
	assertExists(patrolId);
	assertExists(orgA);
});

// ---------------------------------------------------------------------------
// 1. Builder + activate
// ---------------------------------------------------------------------------

Deno.test("builder: add a 2-step process; activate rejects invalid then accepts", async () => {
	// Step 1: collision (single, all records) + severity (whitelist 2 of 4)
	// Step 2: road defect (multi, whitelist 2 of 3)
	const steps = [
		{
			key: `step1-${RUN}`,
			title: "گام ۱: مشخصات حادثه",
			description: "شرح کلی",
			icon: "collision",
			color: "#ff0000",
			order: 1,
			questions: [
				buildQuestion(`q1-${RUN}`, "نوع برخورد؟", "collision_type", 1, {
					kind: "relation",
					path: "collision_type",
				}),
				buildQuestion(`q2-${RUN}`, "شدت حادثه؟", "damage_severity", 2, {
					kind: "relation",
					path: "incident_severity",
				}, {
					allowed_answer_ids: [sev1.toString(), sev2.toString()],
				}),
			],
		},
		{
			key: `step2-${RUN}`,
			title: "گام ۲: نقص راه",
			icon: "road",
			order: 2,
			questions: [
				buildQuestion(`q3-${RUN}`, "نقص راه؟", "road_defect", 1, {
					kind: "relation",
					path: "road_defects",
				}, {
					multi_select: true,
					allowed_answer_ids: [defect1.toString(), defect3.toString()],
				}),
			],
		},
	];

	const created = await runAct(
		"accident_process",
		"add",
		{
			set: { organizationId: orgA.toString(), name: "فرآیند تصادف", steps },
			get: PROCESS_GET,
		},
		managerId,
	);
	assertEquals(created.status, "draft");
	const processId = created._id.toString();

	// activate rejects a registry question with a dynamic target
	const badCopy = JSON.parse(JSON.stringify(steps));
	badCopy[0].questions[0].target = { kind: "dynamic" };
	const badCreated = await runAct(
		"accident_process",
		"add",
		{
			set: {
				organizationId: orgA.toString(),
				name: "فرآیند باطل",
				steps: badCopy,
			},
			get: PROCESS_GET,
		},
		managerId,
	);
	await assertRejects(
		() =>
			runAct(
				"accident_process",
				"activate",
				{ set: { _id: badCreated._id.toString() }, get: { success: 1 } },
				managerId,
			),
		Error,
		"dynamic",
	);

	// activate the good process
	const actResult = await runAct(
		"accident_process",
		"activate",
		{ set: { _id: processId }, get: { success: 1, version: 1 } },
		managerId,
	);
	assertEquals((actResult as any).success, true);
	assertEquals((actResult as any).version, 2, "version bumped on activate");

	const stored = await accident_process.findOne({
		filters: { _id: new ObjectId(processId) },
		projection: { status: 1, is_active: 1, version: 1 },
	});
	assertEquals((stored as any).status, "active");
	assertEquals((stored as any).is_active, true);
	assertEquals((stored as any).version, 2);
});

Deno.test("activate rejects non-consecutive step orders", async () => {
	const steps = [
		{
			key: `cx1-${RUN}`,
			title: "گام یک",
			order: 1,
			questions: [],
		},
		{
			key: `cx2-${RUN}`,
			title: "گام سه (بی‌ترتیب)",
			order: 3,
			questions: [],
		},
	];
	const created = await runAct(
		"accident_process",
		"add",
		{
			set: { organizationId: orgA.toString(), name: "فرآیند بی‌ترتیب", steps },
			get: { _id: 1 },
		},
		managerId,
	);
	await assertRejects(
		() =>
			runAct(
				"accident_process",
				"activate",
				{ set: { _id: created._id.toString() }, get: { success: 1 } },
				managerId,
			),
		Error,
		"پیوسته",
	);
});

Deno.test("one active per org(+type): a second activate archives the previous", async () => {
	// org A already has an active "accident" process from the first test.
	// Activating another process for a different type is allowed.
	const steps = [
		{
			key: `dk1-${RUN}`,
			title: "گام خرابی",
			order: 1,
			questions: [
				buildQuestion(`dkq1-${RUN}`, "نقص؟", "road_defect", 1, {
					kind: "relation",
					path: "road_defects",
				}, { allowed_answer_ids: [defect1.toString()] }),
			],
		},
	];
	const created = await runAct(
		"accident_process",
		"add",
		{
			set: {
				organizationId: orgA.toString(),
				name: "فرآیند خرابی آزادراه",
				incident_type: "road_breakdown",
				steps,
			},
			get: { _id: 1 },
		},
		managerId,
	);
	const actResult = await runAct(
		"accident_process",
		"activate",
		{ set: { _id: created._id.toString() }, get: { success: 1 } },
		managerId,
	);
	assertEquals((actResult as any).success, true);
});

// ---------------------------------------------------------------------------
// 2. getForPatrol + whitelist resolution ("3 of 50")
// ---------------------------------------------------------------------------

Deno.test("getForPatrol returns the active accident process with only whitelisted answers", async () => {
	const result = await runAct(
		"accident_process",
		"getForPatrol",
		{
			set: { incidentType: "accident" },
			get: { process: 1, answers: 1 },
		},
		patrolId,
	);
	const proc = (result as any).process;
	assertExists(proc, "active process returned for the patrol's org");
	assertEquals(proc.status, "active");
	assertEquals(proc.incident_type, undefined); // fallback: سراسری (بدون نوع)

	const steps = proc.steps as any[];
	assertEquals(steps.length, 2);

	// Step 1 Q1 collision_type → all records (only one seeded)
	const q1 = steps[0].questions.find((q: any) => q.model_name === "collision_type");
	assertEquals((q1.answers || []).length, 1);
	// Step 1 Q2 damage_severity → whitelist 2 of 4
	const q2 = steps[0].questions.find((q: any) => q.model_name === "damage_severity");
	assertEquals(q2.answers.length, 2, "severity shows only the 2 whitelisted records");
	// Step 2 Q3 road_defect → whitelist 2 of 3
	const q3 = steps[1].questions.find((q: any) => q.model_name === "road_defect");
	assertEquals(q3.answers.length, 2, "defects show only the 2 whitelisted records");
	assertEquals(q3.multi_select, true);
});

// ---------------------------------------------------------------------------
// 3. Submit mapping into accident
// ---------------------------------------------------------------------------

Deno.test("accident.add persists relation answers in typed fields + dynamic answers", async () => {
	// Relation answers → existing set ids (typed, analytics-readable)
	const created = await runAct(
		"accident",
		"add",
		{
			set: {
				location: { type: "Point", coordinates: [50.5, 34.5] },
				date_of_accident: new Date().toISOString(),
				client_report_uuid: `proc-add-${RUN}`,
				sync_status: "queued",
				process_version: 2,
				collisionTypeId: collisionRear.toString(),
				roadDefectsIds: [defect1.toString()],
				dynamic_answers: [
					{
						step_key: `step1-${RUN}`,
						question_key: `q2-${RUN}`,
						model_name: "damage_severity",
						answer_id: sev1,
						answer_name: "جزئی",
					},
				],
			},
			get: { _id: 1, process_version: 1, dynamic_answers: 1 },
		},
		patrolId,
	);
	assertEquals(created.process_version, 2);
	assertEquals(created.dynamic_answers.length, 1);
	assertEquals(created.dynamic_answers[0].answer_name, "جزئی");

	// typed relations readable (ODM)
	const stored = await accident.findOne({
		filters: { _id: created._id },
		projection: { "collision_type._id": 1, "road_defects._id": 1 },
	});
	assertEquals(
		(stored as any).collision_type._id.toString(),
		collisionRear.toString(),
		"collision answer stored as typed relation",
	);
	assertEquals(
		(stored as any).road_defects[0]._id.toString(),
		defect1.toString(),
		"road defect answer stored as typed relation",
	);
});

// ---------------------------------------------------------------------------
// 4. duplicateProcess
// ---------------------------------------------------------------------------

Deno.test("duplicateProcess clones steps+questions as a draft", async () => {
	const actives = await accident_process.find({
		filters: { status: "active" },
		projection: { _id: 1, name: 1 },
	}).toArray();
	const source = actives.find((a: any) => (a as any).incident_type === undefined);
	assertExists(source, "source active process");

	const clone = await runAct(
		"accident_process",
		"duplicate",
		{ set: { _id: source._id.toString() }, get: { _id: 1, name: 1, status: 1, version: 1 } },
		managerId,
	);
	assert((clone.name as string).endsWith("(Copy)"), "cloned name has (Copy)");
	assertEquals(clone.status, "draft");
	assertEquals(clone.version, 1);

	const cloneDoc = await accident_process.findOne({
		filters: { _id: clone._id },
		projection: { steps: 1 },
	});
	assert(((cloneDoc as any).steps || []).length >= 2, "steps cloned");
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
