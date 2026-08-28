/**
 * Patrol operations backend tests.
 *
 * Runs against a local MongoDB using an isolated database
 * (`nejat_patrol_ops_test`) so dev data is never touched.
 *
 * Run: deno test -A test/patrol-operations-test.ts
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
	patrol_unit,
	police_station,
	shift,
	user,
	vehicle,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const TEST_DB = "nejat_patrol_ops_test";
const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

// The app boots with DB_NAME=nejat_patrol_ops_test (see patrol_ops_env.ts),
// so every model instance is bound to the isolated database.

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

/**
 * Runs an act exactly like the server does:
 * sets a real JWT header context → runs the preAct chain
 * (setTokens → setUser → grantAccess) → validates details with the
 * act's own validator struct → runs the act fn.
 */
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
	// Same validation step the framework runs before calling fn:
	// "create" acts run through create() so struct coercers apply,
	// everything else goes through plain assert().
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

// eslint-disable-next-line
const poly: any = {
	type: "Polygon",
	coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
};
const multiPoly: any = {
	type: "MultiPolygon",
	coordinates: [poly.coordinates],
};

let seq = 0;

const insertUser = async (
	level: string,
	opts: { is_active?: boolean } = {},
): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			father_name: "پدر",
			mobile: `0912000${String(10000 + seq)}`,
			gender: "Male",
			email: `patrol_ops_${RUN}_${seq}@test.local`,
			address: "تهران",
			level,
			is_active: opts.is_active ?? true,
			failed_login_attempts: 0,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertStation = async (): Promise<ObjectId> => {
	seq++;
	const created = await police_station.insertOne({
		doc: {
			name: `کلانتری تست ${RUN} ${seq}`,
			location: poly,
			area: multiPoly,
			code: 900000 + seq,
			is_active: true,
			military_rank: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertUnit = async (is_active = true): Promise<ObjectId> => {
	seq++;
	const created = await patrol_unit.insertOne({
		doc: {
			code: `PU-${RUN}-${seq}`,
			name: `گشت تست ${RUN} ${seq}`,
			is_active,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertVehicle = async (is_active = true): Promise<ObjectId> => {
	seq++;
	const created = await vehicle.insertOne({
		doc: {
			plaque_no: [`${10 + seq}`, "ب222", `ایران${10 + seq}`],
			title: `خودرو تست ${RUN} ${seq}`,
			is_active,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const unitProjection: Document = {
	_id: 1,
	code: 1,
	name: 1,
	is_active: 1,
	police_station: { _id: 1, name: 1, code: 1 },
	officers: {
		_id: 1,
		first_name: 1,
		last_name: 1,
		personnel_code: 1,
		level: 1,
		is_active: 1,
	},
	vehicles: { _id: 1, plaque_no: 1, is_active: 1 },
};

const getUnitDoc = async (unitId: ObjectId) =>
	await patrol_unit.findOne({
		filters: { _id: unitId },
		projection: {
			_id: 1,
			"officers._id": 1,
			"vehicles._id": 1,
			"police_station._id": 1,
		},
	});

// Actors and resources shared across tests (seeded first).
let ghostId: ObjectId;
let managerId: ObjectId;
let patrolA: ObjectId;
let patrolB: ObjectId;
let editorId: ObjectId;
let inactivePatrol: ObjectId;
let station1: ObjectId;
let station2: ObjectId;
let unitActive1: ObjectId;
let unitActive2: ObjectId;
let unitInactive: ObjectId;
let vehicleV1: ObjectId;
let vehicleV2: ObjectId;

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	patrolA = await insertUser("Patrol");
	patrolB = await insertUser("Patrol");
	editorId = await insertUser("Editor");
	inactivePatrol = await insertUser("Patrol", { is_active: false });
	station1 = await insertStation();
	station2 = await insertStation();
	unitActive1 = await insertUnit(true);
	unitActive2 = await insertUnit(true);
	unitInactive = await insertUnit(false);
	vehicleV1 = await insertVehicle(true);
	vehicleV2 = await insertVehicle(true);
	assertExists(ghostId);
});

// ---------------------------------------------------------------------------
// 1. Authorization policy (enforced by the real preAct chain)
// ---------------------------------------------------------------------------

Deno.test("Ghost can manage patrol-unit relations", async () => {
	const result = await runAct(
		"patrol_unit",
		"updateRelations",
		{
			set: {
				_id: unitActive1.toString(),
				officerIds: [patrolA.toString()],
				vehicleIds: [vehicleV1.toString()],
				policeStationId: station1.toString(),
			},
			get: unitProjection,
		},
		ghostId,
	);
	assertEquals(result.officers.length, 1);
	assertEquals(result.officers[0]._id.toString(), patrolA.toString());
	assertEquals(result.vehicles.length, 1);
	assertEquals(result.police_station._id.toString(), station1.toString());
});

Deno.test("Manager may perform operational management (existing policy)", async () => {
	const result = await runAct(
		"patrol_unit",
		"updateRelations",
		{
			set: {
				_id: unitActive2.toString(),
				officerIds: [patrolB.toString()],
				vehicleIds: [vehicleV2.toString()],
			},
			get: unitProjection,
		},
		managerId,
	);
	assertEquals(result.officers[0]._id.toString(), patrolB.toString());
});

Deno.test("patrol_unit.add accepts client-sent date strings (ISO and $D-prefixed)", async () => {
	const created = await runAct(
		"patrol_unit",
		"add",
		{
			set: {
				code: `PU-${RUN}-STR`,
				name: "گشت با تاریخ رشته‌ای",
				is_active: true,
				createdAt: "2026-08-23T12:36:26.025Z",
				updatedAt: "$D2026-08-23T12:36:26.025Z",
			},
			get: { _id: 1, code: 1, name: 1, createdAt: 1, updatedAt: 1 },
		},
		managerId,
	);
	assert(created.createdAt instanceof Date, "createdAt should be a Date");
	assert(created.updatedAt instanceof Date, "updatedAt should be a Date");
	assertEquals(
		created.createdAt.toISOString(),
		"2026-08-23T12:36:26.025Z",
	);
	await patrol_unit.deleteOne({ filter: { _id: created._id } });
});

Deno.test("Patrol is denied management acts", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: { _id: unitActive1.toString(), officerIds: [] },
					get: unitProjection,
				},
				patrolA,
			),
		Error,
		"You cant do this",
	);

	await assertRejects(
		() =>
			runAct(
				"vehicle",
				"gets",
				{ set: { page: 1, limit: 10 }, get: { _id: 1 } },
				patrolA,
			),
		Error,
		"You cant do this",
	);

	await assertRejects(
		() =>
			runAct(
				"patrol_operations",
				"getOperationsSummary",
				{
					set: {},
					get: {
						patrolUsers: { total: 1, active: 1 },
						patrolUnits: { total: 1, active: 1 },
						vehicles: { total: 1, active: 1, assigned: 1 },
						shifts: { active: 1, endedToday: 1 },
					},
				},
				patrolA,
			),
		Error,
		"You cant do this",
	);
});

// ---------------------------------------------------------------------------
// 2. Officer / vehicle validation for relation mutations
// ---------------------------------------------------------------------------

Deno.test("non-Patrol officer cannot be assigned to a unit", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive1.toString(),
						officerIds: [editorId.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"مأمور گشت نیست",
	);
});

Deno.test("inactive officer cannot be assigned to a unit", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive1.toString(),
						officerIds: [inactivePatrol.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"غیرفعال است",
	);
});

Deno.test("inactive vehicle cannot be assigned to a unit", async () => {
	const inactiveVehicle = await insertVehicle(false);
	try {
		await assertRejects(
			() =>
				runAct(
					"patrol_unit",
					"updateRelations",
					{
						set: {
							_id: unitInactive.toString(),
							vehicleIds: [inactiveVehicle.toString()],
						},
						get: unitProjection,
					},
					ghostId,
				),
			Error,
			"غیرفعال است",
		);
	} finally {
		await vehicle.deleteOne({ filter: { _id: inactiveVehicle } });
	}
});

// ---------------------------------------------------------------------------
// 3. Relation add/remove integrity (both directions)
// ---------------------------------------------------------------------------

Deno.test("removing officers/vehicles/station cleans both directions", async () => {
	await runAct(
		"patrol_unit",
		"updateRelations",
		{
			set: {
				_id: unitActive1.toString(),
				removeOfficerIds: [patrolA.toString()],
				removeVehicleIds: [vehicleV1.toString()],
				removePoliceStation: true,
			},
			get: unitProjection,
		},
		ghostId,
	);

	const unit = await getUnitDoc(unitActive1);
	assertExists(unit);
	assert(
		!(unit.officers ?? []).some((o: any) =>
			o._id.toString() === patrolA.toString()
		),
	);
	assert(
		!(unit.vehicles ?? []).some((v: any) =>
			v._id.toString() === vehicleV1.toString()
		),
	);
	assertEquals(unit.police_station?._id, undefined);

	const officerDoc = await user.findOne({
		filters: { _id: patrolA },
		projection: { "patrol_unit._id": 1 },
	});
	assert(!(officerDoc?.patrol_unit as any)?._id);

	const vehicleDoc = await vehicle.findOne({
		filters: { _id: vehicleV1 },
		projection: { "patrol_unit._id": 1 },
	});
	assert(!(vehicleDoc?.patrol_unit as any)?._id);
});

Deno.test("re-adding relations keeps embedded snapshots in sync", async () => {
	await runAct(
		"patrol_unit",
		"updateRelations",
		{
			set: {
				_id: unitActive1.toString(),
				officerIds: [patrolA.toString()],
				vehicleIds: [vehicleV1.toString()],
				policeStationId: station1.toString(),
			},
			get: unitProjection,
		},
		ghostId,
	);
	const officerDoc = await user.findOne({
		filters: { _id: patrolA },
		projection: { "patrol_unit._id": 1 },
	});
	assertEquals(
		(officerDoc?.patrol_unit as any)?._id.toString(),
		unitActive1.toString(),
	);
	const vehicleDoc = await vehicle.findOne({
		filters: { _id: vehicleV1 },
		projection: { "patrol_unit._id": 1 },
	});
	assertEquals(
		(vehicleDoc?.patrol_unit as any)?._id.toString(),
		unitActive1.toString(),
	);
});

Deno.test("cannot remove resources that are not part of the unit", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitInactive.toString(),
						removeOfficerIds: [patrolA.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"عضو این گشت نیستند",
	);
});

Deno.test("relation mutation writes an audit log row", async () => {
	const before = await coreApp.odm.getCollection("operation_log")
		.countDocuments({});
	await runAct(
		"patrol_unit",
		"updateRelations",
		{
			set: {
				_id: unitInactive.toString(),
				policeStationId: station2.toString(),
			},
			get: unitProjection,
		},
		managerId,
	);
	const after = await coreApp.odm.getCollection("operation_log")
		.countDocuments({});
	assertEquals(after, before + 1);
});

// ---------------------------------------------------------------------------
// 4. Exclusive assignment among ACTIVE units
// ---------------------------------------------------------------------------

Deno.test("officer already in another active unit is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive2.toString(),
						officerIds: [patrolA.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"گشت فعال دیگری",
	);
});

Deno.test("vehicle already in another active unit is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive2.toString(),
						vehicleIds: [vehicleV1.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"گشت فعال دیگری",
	);
});

Deno.test("officer of an INACTIVE unit can be re-assigned to an active one", async () => {
	const officerC = await insertUser("Patrol");
	try {
		await runAct(
			"patrol_unit",
			"updateRelations",
			{
				set: {
					_id: unitInactive.toString(),
					officerIds: [officerC.toString()],
				},
				get: unitProjection,
			},
			ghostId,
		);

		await runAct(
			"patrol_unit",
			"updateRelations",
			{
				set: {
					_id: unitActive2.toString(),
					removeOfficerIds: [patrolB.toString()],
				},
				get: unitProjection,
			},
			ghostId,
		);

		const result = await runAct(
			"patrol_unit",
			"updateRelations",
			{
				set: {
					_id: unitActive2.toString(),
					officerIds: [officerC.toString()],
				},
				get: unitProjection,
			},
			ghostId,
		);
		assertEquals(result.officers[0]._id.toString(), officerC.toString());
	} finally {
		await runAct(
			"patrol_unit",
			"updateRelations",
			{
				set: {
					_id: unitActive2.toString(),
					removeOfficerIds: [officerC.toString()],
				},
				get: unitProjection,
			},
			ghostId,
		).catch(() => {});
		await runAct(
			"patrol_unit",
			"updateRelations",
			{
				set: {
					_id: unitActive2.toString(),
					officerIds: [patrolB.toString()],
				},
				get: unitProjection,
			},
			ghostId,
		).catch(() => {});
	}
});

// ---------------------------------------------------------------------------
// 5. Missing resources → clear Persian errors
// ---------------------------------------------------------------------------

Deno.test("missing unit returns Persian error", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: new ObjectId().toString(),
						officerIds: [patrolA.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"گشت یافت نشد",
	);
});

Deno.test("missing police station returns Persian error", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive1.toString(),
						policeStationId: new ObjectId().toString(),
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"کلانتری یافت نشد",
	);
});

Deno.test("add+remove overlap of the same officer is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"patrol_unit",
				"updateRelations",
				{
					set: {
						_id: unitActive1.toString(),
						officerIds: [patrolB.toString()],
						removeOfficerIds: [patrolB.toString()],
					},
					get: unitProjection,
				},
				ghostId,
			),
		Error,
		"هم‌زمان اضافه و حذف",
	);
});

// ---------------------------------------------------------------------------
// 6. Shift assignment rules
// ---------------------------------------------------------------------------

Deno.test("assignShift rejects non-Patrol officers", async () => {
	await assertRejects(
		() =>
			runAct(
				"shift",
				"assignShift",
				{
					set: {
						officerId: editorId.toString(),
						patrolUnitId: unitActive1.toString(),
						shiftType: "صبح",
					},
					get: { _id: 1 },
				},
				managerId,
			),
		Error,
		"«Patrol»",
	);
});

Deno.test("assignShift rejects inactive unit", async () => {
	await assertRejects(
		() =>
			runAct(
				"shift",
				"assignShift",
				{
					set: {
						officerId: patrolB.toString(),
						patrolUnitId: unitInactive.toString(),
						shiftType: "شب",
					},
					get: { _id: 1 },
				},
				managerId,
			),
		Error,
		"گشت غیرفعال است",
	);
});

const shiftFullProjection: Document = {
	_id: 1,
	shift_type: 1,
	status: 1,
	start_at: 1,
	officer: { _id: 1, first_name: 1, last_name: 1 },
	patrol_unit: { _id: 1, name: 1 },
	vehicle: { _id: 1, plaque_no: 1 },
};

Deno.test("assignShift returns officer, unit and vehicle", async () => {
	const created = await runAct(
		"shift",
		"assignShift",
		{
			set: {
				officerId: patrolA.toString(),
				patrolUnitId: unitActive1.toString(),
				vehicleId: vehicleV1.toString(),
				shiftType: "صبح",
			},
			get: shiftFullProjection,
		},
		managerId,
	);
	assertEquals(created.officer._id.toString(), patrolA.toString());
	assertEquals(created.patrol_unit._id.toString(), unitActive1.toString());
	assertEquals(created.vehicle._id.toString(), vehicleV1.toString());
	assertEquals(created.status, "active");
});

Deno.test("duplicate active shift for same officer is rejected", async () => {
	await assertRejects(
		() =>
			runAct(
				"shift",
				"assignShift",
				{
					set: {
						officerId: patrolA.toString(),
						patrolUnitId: unitActive2.toString(),
						shiftType: "عصر",
					},
					get: { _id: 1 },
				},
				managerId,
			),
		Error,
		"شیفت فعال",
	);
});

Deno.test("a vehicle already used in an active shift cannot take another one", async () => {
	await assertRejects(
		() =>
			runAct(
				"shift",
				"assignShift",
				{
					set: {
						officerId: patrolB.toString(),
						patrolUnitId: unitActive2.toString(),
						vehicleId: vehicleV1.toString(),
						shiftType: "شب",
					},
					get: { _id: 1 },
				},
				managerId,
			),
		Error,
		"خودرو در حال حاضر در یک شیفت فعال",
	);
});

// ---------------------------------------------------------------------------
// 7. Operational lists & pagination
// ---------------------------------------------------------------------------

Deno.test("vehicle gets paginates without overlap and filters by unit", async () => {
	const v3 = await insertVehicle(true);
	try {
		const pageOne = await runAct(
			"vehicle",
			"gets",
			{
				set: { page: 1, limit: 2, is_active: true },
				get: {
					_id: 1,
					plaque_no: 1,
					title: 1,
					is_active: 1,
					patrol_unit: { _id: 1, name: 1 },
				},
			},
			managerId,
		);
		const pageTwo = await runAct(
			"vehicle",
			"gets",
			{ set: { page: 2, limit: 2, is_active: true }, get: { _id: 1 } },
			managerId,
		);

		assertEquals(pageOne.length, 2);
		assert(pageTwo.length >= 1);
		const ids = new Set(pageOne.map((v: any) => v._id.toString()));
		for (const v of pageTwo) {
			assert(!ids.has(v._id.toString()), "pagination overlap detected");
		}

		const byUnit = await runAct(
			"vehicle",
			"gets",
			{
				set: {
					page: 1,
					limit: 50,
					patrolUnitId: unitActive1.toString(),
				},
				get: { _id: 1, patrol_unit: { _id: 1 } },
			},
			managerId,
		);
		assert(
			byUnit.some((v: any) => v._id.toString() === vehicleV1.toString()),
		);
		assert(byUnit.every((v: any) => v.active_shift_count !== undefined));
	} finally {
		await vehicle.deleteOne({ filter: { _id: v3 } });
	}
});

Deno.test("patrol_unit gets attaches active_shift_count and embeds relations", async () => {
	const rows = await runAct(
		"patrol_unit",
		"gets",
		{
			set: { page: 1, limit: 50, is_active: true },
			get: {
				_id: 1,
				name: 1,
				officers: { _id: 1, first_name: 1 },
				vehicles: { _id: 1, plaque_no: 1 },
				police_station: { _id: 1, name: 1, code: 1 },
			},
		},
		managerId,
	);
	const unit1 = rows.find((u: any) =>
		u._id.toString() === unitActive1.toString()
	);
	const unit2 = rows.find((u: any) =>
		u._id.toString() === unitActive2.toString()
	);
	assertExists(unit1);
	assertExists(unit2);
	assertEquals(unit1.active_shift_count, 1);
	assertEquals(unit2.active_shift_count, 0);
	assertEquals(unit1.police_station._id.toString(), station1.toString());
});

Deno.test("getPatrolOfficers returns bounded users with active-shift info", async () => {
	const rows = await runAct(
		"user",
		"getPatrolOfficers",
		{
			set: { page: 1, limit: 50 },
			get: {
				_id: 1,
				first_name: 1,
				last_name: 1,
				level: 1,
				is_active: 1,
				personnel_code: 1,
				patrol_unit: { _id: 1, name: 1, code: 1 },
			},
		},
		managerId,
	);
	assert(rows.length >= 3);

	const officerA = rows.find((r: any) =>
		r._id.toString() === patrolA.toString()
	);
	assertExists(officerA);
	assertExists(officerA.active_shift);
	assertEquals(officerA.active_shift.shift_type, "صبح");
	assertEquals(
		officerA.active_shift.patrol_unit._id.toString(),
		unitActive1.toString(),
	);

	const officerB = rows.find((r: any) =>
		r._id.toString() === patrolB.toString()
	);
	assertExists(officerB);
	assertEquals(officerB.active_shift, null);

	// No password or settings leak through the projection.
	for (const row of rows) {
		assertEquals(row.password, undefined);
		assertEquals(row.settings, undefined);
	}
});

Deno.test("getOperationsSummary returns stable operational counts", async () => {
	const summary = await runAct(
		"patrol_operations",
		"getOperationsSummary",
		{
			set: {},
			get: {
				patrolUsers: { total: 1, active: 1 },
				patrolUnits: { total: 1, active: 1 },
				vehicles: { total: 1, active: 1, assigned: 1 },
				shifts: { active: 1, endedToday: 1 },
			},
		},
		ghostId,
	);

	const [patrolTotal, patrolActive] = await Promise.all([
		user.countDocument({ filter: { level: "Patrol" } }),
		user.countDocument({ filter: { level: "Patrol", is_active: true } }),
	]);

	assertEquals(summary.patrolUsers.total, patrolTotal);
	assertEquals(summary.patrolUsers.active, patrolActive);
	assertEquals(summary.patrolUnits.active >= 2, true);
	assertEquals(summary.vehicles.assigned >= 2, true);
	assertEquals(summary.shifts.active >= 1, true);
	assertEquals(typeof summary.shifts.endedToday, "number");
});

// ---------------------------------------------------------------------------
// 8. Vehicle deletion guards
// ---------------------------------------------------------------------------

Deno.test("vehicle in an active shift cannot be deleted", async () => {
	await assertRejects(
		() =>
			runAct(
				"vehicle",
				"remove",
				{ set: { _id: vehicleV1.toString() }, get: { success: 1 } },
				managerId,
			),
		Error,
		"شیفت فعال",
	);
});

Deno.test("after ending the shift the vehicle keeps history; unused vehicles delete cleanly", async () => {
	const activeShift = await shift.findOne({
		filters: { "officer._id": patrolA, status: "active" },
		projection: { _id: 1 },
	});
	assertExists(activeShift);

	// The owning Patrol officer ends their own shift.
	const ended = await runAct(
		"shift",
		"endShift",
		{
			set: { shiftId: (activeShift._id as ObjectId).toString() },
			get: { _id: 1, status: 1, end_at: 1 },
		},
		patrolA,
	);
	assertEquals(ended.status, "ended");
	assertExists(ended.end_at);

	// A vehicle referenced by past (ended) shift records is preserved for audit.
	await assertRejects(
		() =>
			runAct(
				"vehicle",
				"remove",
				{ set: { _id: vehicleV1.toString() }, get: { success: 1 } },
				managerId,
			),
		Error,
		"سوابق عملیاتی",
	);
	const stillThere = await vehicle.findOne({
		filters: { _id: vehicleV1 },
		projection: { _id: 1 },
	});
	assertExists(stillThere);

	// An unused, unassigned vehicle can be deleted cleanly.
	const disposable = await insertVehicle(true);
	await runAct(
		"vehicle",
		"remove",
		{ set: { _id: disposable.toString() }, get: { success: 1 } },
		managerId,
	);
	const gone = await vehicle.findOne({
		filters: { _id: disposable },
		projection: { _id: 1 },
	});
	assertEquals(gone, null);

	await assertRejects(
		() =>
			runAct(
				"vehicle",
				"remove",
				{
					set: { _id: new ObjectId().toString() },
					get: { success: 1 },
				},
				managerId,
			),
		Error,
		"خودرو یافت نشد",
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
