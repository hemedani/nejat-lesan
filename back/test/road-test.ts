/**
 * `road` backend contract tests.
 *
 * Covers the gaps that made a correct frontend form impossible:
 *   - `update` can now write `origin` / `destination` / `lanes` / `provinceId`
 *   - `total_length_meters` is derived from the geometry, not supplied by the client
 *   - `lanes` must reference real `position` documents
 *   - an empty-string value clears a field instead of being silently dropped
 *
 * Runs against a local MongoDB using an isolated database (`nejat_road_test`).
 *
 * Run: deno test -A test/road-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
import { assert as structAssert } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	coreApp,
	getAtcsWithServices,
	position,
	province,
	road,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import {
	DEMO_ROAD_AREA,
	DEMO_ROAD_LENGTH_METERS,
} from "../src/user/seedDemoOrganization/org.ts";
import { multiLineLengthMeters } from "../utils/geo.ts";

const TEST_DB = "nejat_road_test";
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
	structAssert(details, act.validator as never);
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details,
	});
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `راه${seq}`,
			last_name: `آزمون${seq}`,
			father_name: "پدر",
			mobile: `0913${String(20000000 + seq)}`,
			gender: "Male",
			email: `road_${RUN}_${seq}@test.local`,
			address: "تهران",
			level,
			is_active: true,
			failed_login_attempts: 0,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertProvince = async (): Promise<ObjectId> => {
	seq++;
	const created = await province.insertOne({
		doc: {
			name: `استان آزمون ${RUN}`,
			english_name: `Test Province ${RUN}`,
			population: 1000,
			// Not read by this suite, but the model requires both geometries.
			area: {
				type: "MultiPolygon",
				coordinates: [[[[50, 31], [51, 31], [51, 32], [50, 31]]]],
			},
			center_location: { type: "Point", coordinates: [50.5, 31.5] },
			createdAt: new Date(),
			updatedAt: new Date(),
		} as never,
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertPosition = async (name: string): Promise<ObjectId> => {
	seq++;
	const created = await position.insertOne({
		doc: { name, createdAt: new Date(), updatedAt: new Date() },
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const ROAD_GET: Document = {
	_id: 1,
	name: 1,
	area: 1,
	origin: 1,
	destination: 1,
	total_length_meters: 1,
	lanes: 1,
	province: { _id: 1, name: 1 },
	registrer: { _id: 1 },
};

const AREA = {
	type: "MultiLineString",
	coordinates: [[[48.6, 31.3], [48.7, 31.4]]],
};

let managerId: ObjectId;
let provinceId: ObjectId;
let laneA: ObjectId;
let laneB: ObjectId;
let roadId: ObjectId;

Deno.test("seed fixtures", async () => {
	managerId = await insertUser("Manager");
	provinceId = await insertProvince();
	laneA = await insertPosition(`خط ${RUN} یک`);
	laneB = await insertPosition(`خط ${RUN} دو`);
	assertExists(managerId);
});

// ---------------------------------------------------------------------------
// 1. The derived length
// ---------------------------------------------------------------------------

Deno.test("multiLineLengthMeters reproduces the seeded Ahvaz corridor length", () => {
	// The demo seed hard-codes 116342 from this same method. If the method
	// changes, this test is the signal that the constant and `road.snapPointToRoad`
	// are about to disagree with the geometry.
	assertEquals(
		Math.round(multiLineLengthMeters(DEMO_ROAD_AREA.coordinates)),
		DEMO_ROAD_LENGTH_METERS,
	);
});

Deno.test("a single-vertex line has no length rather than NaN", () => {
	assertEquals(multiLineLengthMeters([[[48.6, 31.3]]]), 0);
	assertEquals(multiLineLengthMeters([]), 0);
});

Deno.test("multiLineLengthMeters sums across separate line segments", () => {
	const one = multiLineLengthMeters([[[48.6, 31.3], [48.7, 31.4]]]);
	const two = multiLineLengthMeters([
		[[48.6, 31.3], [48.7, 31.4]],
		[[48.7, 31.4], [48.8, 31.5]],
	]);
	assert(two > one, "a second segment adds length");
});

// ---------------------------------------------------------------------------
// 2. add
// ---------------------------------------------------------------------------

Deno.test("road.add derives total_length_meters from the geometry", async () => {
	const created = await runAct("road", "add", {
		set: {
			name: `جاده آزمون ${RUN}`,
			area: AREA,
			provinceId: provinceId.toString(),
		},
		get: ROAD_GET,
	}, managerId);

	roadId = created._id as ObjectId;
	assertEquals(
		created.total_length_meters,
		Math.round(multiLineLengthMeters(AREA.coordinates as never)),
	);
	assertEquals(created.province._id.toString(), provinceId.toString());
});

Deno.test("road.add refuses a client-supplied total_length_meters", async () => {
	// A hand-typed length can contradict `area`; only the geometry may set it.
	await assertRejects(
		() =>
			runAct("road", "add", {
				set: {
					name: `جاده با طول دستی ${RUN}`,
					area: AREA,
					provinceId: provinceId.toString(),
					total_length_meters: 999999,
				},
				get: ROAD_GET,
			}, managerId),
		Error,
	);
});

Deno.test("road.add accepts origin, destination and lanes", async () => {
	const created = await runAct("road", "add", {
		set: {
			name: `جاده کامل ${RUN}`,
			area: AREA,
			provinceId: provinceId.toString(),
			origin: "اهواز",
			destination: "بندر امام",
			lanes: [
				{ _id: laneA.toString(), name: `خط ${RUN} یک` },
				{ _id: laneB.toString(), name: `خط ${RUN} دو` },
			],
		},
		get: ROAD_GET,
	}, managerId);

	assertEquals(created.origin, "اهواز");
	assertEquals(created.destination, "بندر امام");
	assertEquals((created.lanes as unknown[]).length, 2);
});

Deno.test("road.add rejects lanes pointing at a non-existent position", async () => {
	await assertRejects(
		() =>
			runAct("road", "add", {
				set: {
					name: `جاده با خط متروک ${RUN}`,
					area: AREA,
					provinceId: provinceId.toString(),
					lanes: [{
						_id: new ObjectId().toString(),
						name: "ناموجود",
					}],
				},
				get: ROAD_GET,
			}, managerId),
		Error,
		"موقعیت‌های انتخاب‌شده معتبر نیستند",
	);
});

// ---------------------------------------------------------------------------
// 3. update — the fields it could not write before
// ---------------------------------------------------------------------------

Deno.test("road.update writes origin and destination", async () => {
	const updated = await runAct("road", "update", {
		set: { _id: roadId.toString(), origin: "مبدأ", destination: "مقصد" },
		get: ROAD_GET,
	}, managerId);

	assertEquals(updated.origin, "مبدأ");
	assertEquals(updated.destination, "مقصد");
});

Deno.test("road.update writes lanes", async () => {
	const updated = await runAct("road", "update", {
		set: {
			_id: roadId.toString(),
			lanes: [{ _id: laneA.toString(), name: `خط ${RUN} یک` }],
		},
		get: ROAD_GET,
	}, managerId);

	assertEquals((updated.lanes as unknown[]).length, 1);
});

Deno.test("road.update clears a field with an empty string", async () => {
	// The old `name && (updateObj.name = name)` dropped this silently.
	const updated = await runAct("road", "update", {
		set: { _id: roadId.toString(), origin: "" },
		get: ROAD_GET,
	}, managerId);

	assertEquals(updated.origin, "");
});

Deno.test("road.update leaves untouched fields alone when they are omitted", async () => {
	const before = await road.findOne({
		filters: { _id: roadId },
		projection: { _id: 1, origin: 1, destination: 1, name: 1 },
	}) as unknown as Record<string, unknown>;

	await runAct("road", "update", {
		set: { _id: roadId.toString(), destination: "مقصد تازه" },
		get: ROAD_GET,
	}, managerId);

	const after = await road.findOne({
		filters: { _id: roadId },
		projection: { _id: 1, origin: 1, destination: 1, name: 1 },
	}) as unknown as Record<string, unknown>;

	assertEquals(after.origin, before.origin, "omitted origin survives");
	assertEquals(after.name, before.name, "omitted name survives");
	assertEquals(after.destination, "مقصد تازه");
});

Deno.test("road.update recomputes the length when the geometry changes", async () => {
	const longer = {
		type: "MultiLineString",
		coordinates: [[[48.6, 31.3], [48.9, 31.6]]],
	};
	const updated = await runAct("road", "update", {
		set: { _id: roadId.toString(), area: longer },
		get: ROAD_GET,
	}, managerId);

	assertEquals(
		updated.total_length_meters,
		Math.round(multiLineLengthMeters(longer.coordinates as never)),
	);
});

Deno.test("road.update leaves the length untouched when the geometry is omitted", async () => {
	const before = await road.findOne({
		filters: { _id: roadId },
		projection: { _id: 1, total_length_meters: 1 },
	}) as unknown as { total_length_meters?: number };

	await runAct("road", "update", {
		set: { _id: roadId.toString(), name: `جاده بی‌شکل ${RUN}` },
		get: ROAD_GET,
	}, managerId);

	const after = await road.findOne({
		filters: { _id: roadId },
		projection: { _id: 1, total_length_meters: 1 },
	}) as unknown as { total_length_meters?: number };

	assertEquals(after.total_length_meters, before.total_length_meters);
});

Deno.test("road.update moves the road to another province", async () => {
	const otherProvince = await insertProvince();
	const updated = await runAct("road", "update", {
		set: { _id: roadId.toString(), provinceId: otherProvince.toString() },
		get: ROAD_GET,
	}, managerId);

	assertEquals(updated.province._id.toString(), otherProvince.toString());
});

Deno.test("road.update rejects an unknown position in lanes", async () => {
	await assertRejects(
		() =>
			runAct("road", "update", {
				set: {
					_id: roadId.toString(),
					lanes: [
						{ _id: new ObjectId().toString(), name: "ناموجود" },
						{ _id: laneA.toString(), name: `خط ${RUN} یک` },
					],
				},
				get: ROAD_GET,
			}, managerId),
		Error,
		"موقعیت‌های انتخاب‌شده معتبر نیستند",
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
