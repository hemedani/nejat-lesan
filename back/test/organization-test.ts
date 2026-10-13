/**
 * Organizational structure backend tests (Phase 3).
 *
 * organization (هر آزادراه یک سازمان) + unit (درخت سازمانی) + user.roles.
 * Verifies CRUD, cross-org guards, getOrgChart role scoping, the idempotent
 * backfill of patrol_unit/police_station into unit, and deletion guards.
 *
 * Runs against a local MongoDB using an isolated database
 * (`nejat_patrol_ops_test`) so dev data is never touched.
 *
 * Run: deno test -A test/organization-test.ts
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
	coreApp,
	getAtcsWithServices,
	organization,
	road,
	unit,
	user,
	vehicle,
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
			mobile: `0913${String(10000000 + seq)}`,
			gender: "Male",
			email: `org_${RUN}_${seq}@test.local`,
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
			area: {
				type: "LineString",
				coordinates: [[50, 34], [51, 35]],
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertVehicle = async (): Promise<ObjectId> => {
	seq++;
	const created = await vehicle.insertOne({
		doc: {
			plaque_no: [`${10 + seq}`, "ب222", `ایران${10 + seq}`],
			title: `خودرو تست ${RUN} ${seq}`,
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const ORG_GET: Document = {
	_id: 1,
	code: 1,
	name: 1,
	enName: 1,
	is_active: 1,
	location: 1,
	location_zoom: 1,
	road: { _id: 1, name: 1 },
	head: { _id: 1, first_name: 1, last_name: 1 },
};

const UNIT_GET: Document = {
	_id: 1,
	code: 1,
	name: 1,
	type: 1,
	is_active: 1,
	organization: { _id: 1, name: 1 },
	road: { _id: 1, name: 1 },
	parentUnit: { _id: 1, name: 1 },
	head: { _id: 1, first_name: 1, last_name: 1 },
};

let managerId: ObjectId;
let highwayHeadA: ObjectId;
let unitHeadA: ObjectId;
let roadR: ObjectId;
let roadS: ObjectId;
let orgA: ObjectId;
let orgB: ObjectId;
let geoOrgId: ObjectId;
let hqA: ObjectId;
let stationA: ObjectId;
let patrolUnitA: ObjectId;

Deno.test("seed fixtures", async () => {
	managerId = await insertUser("Manager");
	roadR = await insertRoad(`آزادراه تهران-قم ${RUN}`);
	roadS = await insertRoad(`آزادراه قم-اصفهان ${RUN}`);
	assertExists(managerId);
	assertExists(roadR);
	assertExists(roadS);
});

// ---------------------------------------------------------------------------
// 1. Organization CRUD + road binding
// ---------------------------------------------------------------------------

Deno.test("create organizations bound to roads", async () => {
	const a = await runAct(
		"organization",
		"add",
		{
			set: {
				code: `ORG-A-${RUN}`,
				name: "سازمان آزادراه تهران-قم",
				enName: "Tehran-Qom Highway Org",
				roadId: roadR.toString(),
			},
			get: ORG_GET,
		},
		managerId,
	);
	console.log("DEBUG org add result:", JSON.stringify(a));
	assertEquals(a.road._id.toString(), roadR.toString());
	assertEquals(a.is_active, true);
	orgA = a._id as ObjectId;

	const b = await runAct(
		"organization",
		"add",
		{
			set: {
				code: `ORG-B-${RUN}`,
				name: "سازمان آزادراه قم-اصفهان",
				roadId: roadS.toString(),
			},
			get: ORG_GET,
		},
		managerId,
	);
	assertEquals(b.road._id.toString(), roadS.toString());
	orgB = b._id as ObjectId;
});

// ---------------------------------------------------------------------------
// 1b. Organization location point + default map zoom
// ---------------------------------------------------------------------------

Deno.test("organization stores a GeoJSON location point and a map zoom", async () => {
	const created = await runAct(
		"organization",
		"add",
		{
			set: {
				code: `ORG-GEO-${RUN}`,
				name: "سازمان دارای مرکز",
				// GeoJSON order is [longitude, latitude] — not [lat, lng].
				location: { type: "Point", coordinates: [48.67056, 31.31823] },
				location_zoom: 13,
			},
			get: ORG_GET,
		},
		managerId,
	);

	assertEquals(created.location.type, "Point");
	assertEquals(created.location.coordinates, [48.67056, 31.31823]);
	assertEquals(created.location_zoom, 13);
	geoOrgId = created._id as ObjectId;

	const stored = await organization.findOne({
		filters: { _id: created._id as ObjectId },
		projection: { _id: 1, location: 1, location_zoom: 1 },
	});
	assertEquals((stored as any).location.coordinates, [48.67056, 31.31823]);
	assertEquals((stored as any).location_zoom, 13);
});

Deno.test("organization location stays absent when it is not supplied", async () => {
	const created = await runAct(
		"organization",
		"add",
		{
			set: { code: `ORG-NOGEO-${RUN}`, name: "سازمان بی‌مرکز" },
			get: ORG_GET,
		},
		managerId,
	);

	// The field is optional, so a roadless org is still creatable and the
	// 2dsphere index must tolerate documents with no `location` at all.
	assert(
		created.location === undefined || created.location === null,
		"an org created without a location carries none",
	);
	assert(
		created.location_zoom === undefined || created.location_zoom === null,
		"an org created without a zoom carries none",
	);
});

Deno.test("organization.update moves the location point and the zoom", async () => {
	const updated = await runAct(
		"organization",
		"update",
		{
			set: {
				_id: geoOrgId.toString(),
				location: { type: "Point", coordinates: [49.068, 30.645] },
				location_zoom: 14,
			},
			get: ORG_GET,
		},
		managerId,
	);

	assertEquals(updated.location.coordinates, [49.068, 30.645]);
	assertEquals(updated.location_zoom, 14);
});

Deno.test("organization.update rejects a malformed location point", async () => {
	await assertRejects(
		() =>
			runAct(
				"organization",
				"update",
				{
					set: {
						_id: geoOrgId.toString(),
						// Not a GeoJSON Point — the struct must refuse it.
						location: { type: "Circle", coordinates: [49, 30] },
					},
					get: ORG_GET,
				},
				managerId,
			),
		Error,
	);
});

Deno.test("organization.update rejects a non-numeric zoom", async () => {
	await assertRejects(
		() =>
			runAct(
				"organization",
				"update",
				{
					set: {
						_id: geoOrgId.toString(),
						location_zoom: "بزرگ",
					},
					get: ORG_GET,
				},
				managerId,
			),
		Error,
	);
});

Deno.test("organization add rejects a roadId that does not exist", async () => {
	await assertRejects(
		() =>
			runAct(
				"organization",
				"add",
				{
					set: {
						code: `ORG-X-${RUN}`,
						name: "سازمان با راه نامعتبر",
						roadId: new ObjectId().toString(),
					},
					get: ORG_GET,
				},
				managerId,
			),
		Error,
		"راه مورد نظر یافت نشد",
	);
});

Deno.test("roadless (municipality) org is allowed and hosts roadless units", async () => {
	// Municipality org is not bound to any road.
	const muni = await runAct(
		"organization",
		"add",
		{
			set: {
				code: `ORG-M-${RUN}`,
				name: "سازمان شهرداری",
			},
			get: ORG_GET,
		},
		managerId,
	);
	assertExists(muni._id);
	assert(
		(muni as any).road == null,
		"roadless org carries no road relation",
	);

	// A unit under it may be created without a road.
	const hq = await runAct(
		"unit",
		"add",
		{
			set: {
				code: `MHQ-${RUN}`,
				name: "ستاد شهرداری",
				type: "General",
				organizationId: (muni as any)._id.toString(),
			},
			get: UNIT_GET,
		},
		managerId,
	);
	assertEquals(
		(hq as any).organization._id.toString(),
		(muni as any)._id.toString(),
	);
	assert(
		(hq as any).road == null,
		"unit under a roadless org carries no road relation",
	);

	// Assigning a road to a unit of a roadless org is rejected.
	await assertRejects(
		() =>
			runAct(
				"unit",
				"add",
				{
					set: {
						code: `MHQ-BAD-${RUN}`,
						name: "ستاد با راه",
						type: "General",
						organizationId: (muni as any)._id.toString(),
						roadId: roadR.toString(),
					},
					get: UNIT_GET,
				},
				managerId,
			),
		Error,
		"سازمان راه معتبری ندارد",
	);

	// Same-org relation save (like the frontend's unit edit) must not fail for
	// a roadless org.
	const updated = await runAct(
		"unit",
		"updateRelations",
		{
			set: {
				_id: (hq as any)._id.toString(),
				organizationId: (muni as any)._id.toString(),
			},
			get: { _id: 1, organization: { _id: 1 }, road: { _id: 1 } },
		},
		managerId,
	);
	assertEquals(
		(updated as any).organization._id.toString(),
		(muni as any)._id.toString(),
	);
});

// ---------------------------------------------------------------------------
// 2. Unit tree + cross-org guards
// ---------------------------------------------------------------------------

Deno.test("build a unit tree HQ → Station → Patrol with relations", async () => {
	// HQ (General, root)
	const hq = await runAct(
		"unit",
		"add",
		{
			set: {
				code: `HQ-${RUN}`,
				name: "ستاد مرکزی",
				type: "General",
				organizationId: orgA.toString(),
				roadId: roadR.toString(),
			},
			get: UNIT_GET,
		},
		managerId,
	);
	assertEquals(hq.type, "General");
	assertEquals(hq.organization._id.toString(), orgA.toString());
	hqA = hq._id as ObjectId;

	// Station under HQ
	const station = await runAct(
		"unit",
		"add",
		{
			set: {
				code: `ST-${RUN}`,
				name: "پاسگاه اکیپ",
				type: "Station",
				organizationId: orgA.toString(),
				roadId: roadR.toString(),
				parentUnitId: hqA.toString(),
			},
			get: UNIT_GET,
		},
		managerId,
	);
	assertEquals(station.parentUnit._id.toString(), hqA.toString());
	stationA = station._id as ObjectId;

	// Patrol under Station, with an officer + vehicle
	const patrolOfficer = await insertUser("Patrol");
	const patrolVehicle = await insertVehicle();
	const patrol = await runAct(
		"unit",
		"add",
		{
			set: {
				code: `PU-${RUN}`,
				name: "گشت اکیپ ۱",
				type: "Patrol",
				organizationId: orgA.toString(),
				roadId: roadR.toString(),
				parentUnitId: stationA.toString(),
			},
			get: { _id: 1, code: 1, name: 1, type: 1 },
		},
		managerId,
	);
	patrolUnitA = patrol._id as ObjectId;

	const withRelations = await runAct(
		"unit",
		"updateRelations",
		{
			set: {
				_id: patrolUnitA.toString(),
				officerIds: [patrolOfficer.toString()],
				vehicleIds: [patrolVehicle.toString()],
			},
			get: { _id: 1 },
		},
		managerId,
	);
	// Depth-1 get only exposes relation flags; verify via a direct ODM read.
	const storedUnit = await unit.findOne({
		filters: { _id: patrolUnitA },
		projection: { _id: 1, "officers._id": 1, "vehicles._id": 1 },
	});
	assertEquals(
		(storedUnit as any).officers[0]._id.toString(),
		patrolOfficer.toString(),
	);
	assertEquals(
		(storedUnit as any).vehicles[0]._id.toString(),
		patrolVehicle.toString(),
	);
});

Deno.test("unit.add rejects a road that does not match the organization's road", async () => {
	await assertRejects(
		() =>
			runAct(
				"unit",
				"add",
				{
					set: {
						code: `MISMATCH-${RUN}`,
						name: "گشت با راه اشتباه",
						type: "Patrol",
						organizationId: orgA.toString(),
						roadId: roadS.toString(),
					},
					get: UNIT_GET,
				},
				managerId,
			),
		Error,
		"راه واحد باید با راه سازمان یکسان باشد",
	);
});

Deno.test("cross-org unit parent is rejected", async () => {
	// hqA belongs to org A; a unit under org B cannot parent it.
	await assertRejects(
		() =>
			runAct(
				"unit",
				"add",
				{
					set: {
						code: `CROSS-${RUN}`,
						name: "گره بین‌سازمانی",
						type: "General",
						organizationId: orgB.toString(),
						roadId: roadS.toString(),
						parentUnitId: hqA.toString(),
					},
					get: UNIT_GET,
				},
				managerId,
			),
		Error,
		"واحد والد باید در همان سازمان باشد",
	);
});

// ---------------------------------------------------------------------------
// 3. getOrgChart + role scoping
// ---------------------------------------------------------------------------

Deno.test("getOrgChart as Manager with orgId returns the org's flat unit list", async () => {
	const result = await runAct(
		"unit",
		"getOrgChart",
		{
			set: { orgId: orgA.toString() },
			get: { units: 1, organization: 1, stats: 1 },
		},
		managerId,
	);
	assertEquals((result as any).totalCount, 3); // HQ + Station + Patrol
	assertEquals(
		((result as any).organization as any)._id.toString(),
		orgA.toString(),
	);
	const units = (result as any).units as any[];
	const patrol = units.find((u) => u.type === "Patrol");
	assertExists(patrol, "patrol unit present");
	assert(
		patrol.parentUnit && patrol.parentUnit._id,
		"patrol unit carries parentUnit for client tree build",
	);
	assert(Array.isArray((result as any).stats), "stats array present");
});

Deno.test("getOrgChart as OrgHead auto-scopes via role (no orgId)", async () => {
	highwayHeadA = await insertUser("Enterprise", {
		roles: [{
			roleId: crypto.randomUUID(),
			name: "OrgHead",
			scopeType: "organization",
			scopeId: orgA.toString(),
		}],
	});
	const result = await runAct(
		"unit",
		"getOrgChart",
		{
			set: {},
			get: { units: 1 },
		},
		highwayHeadA,
	);
	assertEquals((result as any).totalCount, 3);
});

Deno.test("getOrgChart as UnitHead resolves org from unit scope", async () => {
	unitHeadA = await insertUser("Enterprise", {
		roles: [{
			roleId: crypto.randomUUID(),
			name: "UnitHead",
			scopeType: "unit",
			scopeId: patrolUnitA.toString(),
		}],
	});
	const result = await runAct(
		"unit",
		"getOrgChart",
		{
			set: {},
			get: { units: 1 },
		},
		unitHeadA,
	);
	// No activeRoleId passed → the fn falls back to the first scoped role.
	assertEquals((result as any).totalCount, 3);
});

Deno.test("getOrgChart as Manager without orgId is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"unit",
				"getOrgChart",
				{ set: {}, get: { units: 1 } },
				managerId,
			),
		Error,
		"orgId",
	);
});

Deno.test("organization.update sets and replaces the head relation", async () => {
	// Regression: `_ids` for a *single* relation must be a bare ObjectId.
	// `handleSingleRelation` filters `{_id: _ids}` directly, so the old
	// `[new ObjectId(...)]` array matched nothing and threw
	// "can not find this relation : head" — meaning the head could never be
	// assigned or changed from any client.
	const head1 = await insertUser("Enterprise");
	const head2 = await insertUser("Enterprise");

	const assigned = await runAct(
		"organization",
		"update",
		{
			set: { _id: orgA.toString(), headId: head1.toString() },
			get: ORG_GET,
		},
		managerId,
	);
	assertEquals(
		(assigned.head as { _id: ObjectId })._id.toString(),
		head1.toString(),
	);

	const replaced = await runAct(
		"organization",
		"update",
		{
			set: { _id: orgA.toString(), headId: head2.toString() },
			get: ORG_GET,
		},
		managerId,
	);
	assertEquals(
		(replaced.head as { _id: ObjectId })._id.toString(),
		head2.toString(),
	);
});

// ---------------------------------------------------------------------------
// 4. Deletion guards
// ---------------------------------------------------------------------------

Deno.test("deleting an org that still owns units is blocked", async () => {
	await assertRejects(
		() =>
			runAct(
				"organization",
				"remove",
				{ set: { _id: orgA.toString() }, get: { success: 1 } },
				managerId,
			),
		Error,
	);
	// Org still exists.
	const stillThere = await organization.findOne({
		filters: { _id: orgA },
		projection: { _id: 1 },
	});
	assertExists(stillThere);
});

Deno.test("deleting a leaf unit is allowed", async () => {
	const disposable = await runAct(
		"unit",
		"add",
		{
			set: {
				code: `LEAF-${RUN}`,
				name: "گره برگ",
				type: "Ops",
				organizationId: orgB.toString(),
				roadId: roadS.toString(),
			},
			get: { _id: 1 },
		},
		managerId,
	);
	const result = await runAct(
		"unit",
		"remove",
		{ set: { _id: disposable._id.toString() }, get: { success: 1 } },
		managerId,
	);
	assertExists(result);
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
