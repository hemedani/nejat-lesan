/**
 * Warehousing backend tests (Phase 4 — flat catalog + stock).
 *
 * Verifies ware CRUD, inventory upsert, consumption (removeStock),
 * goods_receipt (addStock + auto GR number), transfer, read-only
 * stock_movement, and role scoping.
 *
 * Runs against a local MongoDB using an isolated database
 * (`nejat_patrol_ops_test`) so dev data is never touched.
 *
 * Run: deno test -A test/warehouse-test.ts
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
	goods_receipt as goodsReceipt,
	goods_request,
	inventory,
	organization,
	road,
	stock_movement,
	unit,
	user,
	ware,
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
			mobile: `0914${String(10000000 + seq)}`,
			gender: "Male",
			email: `wh_${RUN}_${seq}@test.local`,
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
	type = "General",
): Promise<ObjectId> => {
	seq++;
	const created = await unit.insertOne({
		doc: {
			code,
			name: `واحد ${code}`,
			type,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: { _ids: orgId, relatedRelations: { units: true } },
			road: { _ids: roadId, relatedRelations: { units: true } },
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertWare = async (
	name: string,
	extra: Record<string, unknown> = {},
): Promise<ObjectId> => {
	seq++;
	const created = await ware.insertOne({
		doc: {
			name,
			ware_type: "تجهیزات ایمنی",
			...extra,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let managerId: ObjectId;
let highwayHead: ObjectId;
let unitHeadA: ObjectId;
let roadR: ObjectId;
let orgA: ObjectId;
let unitA: ObjectId;
let unitB: ObjectId;
let warehouseUnit: ObjectId;
let ware1: ObjectId;
let ware2: ObjectId;

const INV_GET: Document = {
	_id: 1,
	quantity: 1,
	min_quantity: 1,
	max_quantity: 1,
	unit: { _id: 1, name: 1 },
	ware: { _id: 1, name: 1 },
};

Deno.test("seed fixtures", async () => {
	managerId = await insertUser("Manager");
	roadR = await insertRoad(`آزادراه انبار ${RUN}`);
	orgA = await insertOrg(roadR, `ORG-WH-${RUN}`);
	unitA = await insertUnit(orgA, roadR, `UA-${RUN}`);
	unitB = await insertUnit(orgA, roadR, `UB-${RUN}`);
	warehouseUnit = await insertUnit(orgA, roadR, `W-${RUN}`, "Warehouse");
	ware1 = await insertWare("نیوجرسی بتنی", { price: 1200000 });
	ware2 = await insertWare("گاردریل فلزی");
	assertExists(managerId);
	assertExists(ware1);
});

// ---------------------------------------------------------------------------
// 1. Ware catalog CRUD
// ---------------------------------------------------------------------------

Deno.test("ware CRUD + flat taxonomy filter", async () => {
	const created = await runAct(
		"ware",
		"add",
		{
			set: {
				name: `چراغ راهنمایی ${RUN}`,
				ware_type: "علائم و تابلو",
				brand: "تست",
				price: 500000,
				is_active: true,
			},
			get: { _id: 1, name: 1, ware_type: 1, price: 1 },
		},
		managerId,
	);
	assertEquals(created.ware_type, "علائم و تابلو");

	const filtered = await runAct(
		"ware",
		"gets",
		{
			set: { page: 1, limit: 10, ware_type: "علائم و تابلو" },
			get: { _id: 1, name: 1, ware_type: 1 },
		},
		managerId,
	);
	assert(filtered.length >= 1, "filter by ware_type returns results");
	assert(
		filtered.every((w: any) => w.ware_type === "علائم و تابلو"),
		"all rows match the ware_type filter",
	);

	const updated = await runAct(
		"ware",
		"update",
		{
			set: { _id: created._id.toString(), price: 600000 },
			get: { _id: 1, price: 1 },
		},
		managerId,
	);
	assertEquals(updated.price, 600000);
});

// ---------------------------------------------------------------------------
// 2. Inventory add (upsert)
// ---------------------------------------------------------------------------

Deno.test("inventory.add upserts (same unit+ware → one doc, updated)", async () => {
	const first = await runAct(
		"inventory",
		"add",
		{
			set: {
				unitId: unitA.toString(),
				wareId: ware1.toString(),
				quantity: 10,
				min_quantity: 2,
				max_quantity: 50,
			},
			get: INV_GET,
		},
		managerId,
	);
	assertEquals(first.quantity, 10);
	const firstId = first._id.toString();

	const second = await runAct(
		"inventory",
		"add",
		{
			set: {
				unitId: unitA.toString(),
				wareId: ware1.toString(),
				quantity: 25,
			},
			get: INV_GET,
		},
		managerId,
	);
	assertEquals(second._id.toString(), firstId, "same inventory doc");
	assertEquals(second.quantity, 25, "quantity upserted");

	const count = await inventory.countDocument({
		filter: { "unit._id": unitA, "ware._id": ware1 },
	});
	assertEquals(count, 1, "exactly one inventory doc per (unit, ware)");

	// adjustment movement written by the upsert
	const movements = await stock_movement.find({
		filters: { "unit._id": unitA, "ware._id": ware1, reason: "adjustment" },
		projection: { _id: 1, quantity: 1 },
	}).toArray();
	assert(movements.length >= 1, "adjustment movement recorded");
});

// ---------------------------------------------------------------------------
// 3. Goods receipt → addStock
// ---------------------------------------------------------------------------

Deno.test("goods_receipt.add increments inventory, writes movement, auto GR number", async () => {
	const result = await runAct(
		"goods_receipt",
		"add",
		{
			set: {
				receivingUnitId: unitB.toString(),
				received_at: new Date().toISOString(),
				items: [
					{
						ware_id: ware2.toString(),
						ware_name: "گاردریل فلزی",
						quantity_received: 30,
						quantity_accepted: 28,
						quantity_rejected: 2,
						batch_no: "B-001",
					},
				],
			},
			get: { _id: 1, receipt_number: 1, status: 1, items: 1 },
		},
		managerId,
	);
	assert((result.receipt_number as string).startsWith("GR-"), "auto GR number");
	assertEquals(result.status, "partially_rejected");

	const level = await inventory.findOne({
		filters: { "unit._id": unitB, "ware._id": ware2 },
		projection: { quantity: 1 },
	});
	assertEquals((level as any).quantity, 28, "accepted qty added to inventory");

	const grMovement = await stock_movement.find({
		filters: {
			"unit._id": unitB,
			"ware._id": ware2,
			reason: "goods_receipt",
		},
		projection: { _id: 1, quantity: 1, balance_after: 1 },
	}).toArray();
	assert(grMovement.length >= 1, "goods_receipt movement written");
	assertEquals((grMovement[0] as any).quantity, 28);
});

// ---------------------------------------------------------------------------
// 4. Consumption → removeStock
// ---------------------------------------------------------------------------

Deno.test("consumption.add decrements inventory and rejects insufficient stock", async () => {
	// Give unitA some stock of ware2 first.
	await runAct(
		"inventory",
		"add",
		{
			set: { unitId: unitA.toString(), wareId: ware2.toString(), quantity: 5 },
			get: INV_GET,
		},
		managerId,
	);

	const consumption = await runAct(
		"consumption",
		"add",
		{
			set: {
				unitId: unitA.toString(),
				wareId: ware2.toString(),
				quantity: 3,
				reason: "مصرف عملیاتی",
				consumed_for: "تست",
			},
			get: { _id: 1, quantity: 1, unit: { _id: 1 } },
		},
		managerId,
	);
	assertEquals(consumption.quantity, 3);

	const level = await inventory.findOne({
		filters: { "unit._id": unitA, "ware._id": ware2 },
		projection: { quantity: 1 },
	});
	assertEquals((level as any).quantity, 2, "5 - 3 = 2");

	// Insufficient stock must be rejected.
	await assertRejects(
		() =>
			runAct(
				"consumption",
				"add",
				{
					set: {
						unitId: unitA.toString(),
						wareId: ware2.toString(),
						quantity: 99,
					},
					get: { _id: 1 },
				},
				managerId,
			),
		Error,
		"کافی نیست",
	);
});

// ---------------------------------------------------------------------------
// 5. Transfer
// ---------------------------------------------------------------------------

Deno.test("inventory.transfer moves quantity with transfer_out/transfer_in", async () => {
	const before = await inventory.findOne({
		filters: { "unit._id": unitA, "ware._id": ware1 },
		projection: { quantity: 1 },
	});
	assertExists(before);

	await runAct(
		"inventory",
		"transfer",
		{
			set: {
				fromUnitId: unitA.toString(),
				toUnitId: unitB.toString(),
				wareId: ware1.toString(),
				quantity: 5,
			},
			get: {},
		},
		managerId,
	);

	const fromLevel = await inventory.findOne({
		filters: { "unit._id": unitA, "ware._id": ware1 },
		projection: { quantity: 1 },
	});
	assertEquals((fromLevel as any).quantity, 20, "25 - 5 = 20");

	const toLevel = await inventory.findOne({
		filters: { "unit._id": unitB, "ware._id": ware1 },
		projection: { quantity: 1 },
	});
	assertEquals((toLevel as any).quantity, 5, "0 + 5 = 5");

	const out = await stock_movement.find({
		filters: { "unit._id": unitA, "ware._id": ware1, reason: "transfer_out" },
		projection: { _id: 1 },
	}).toArray();
	const inn = await stock_movement.find({
		filters: { "unit._id": unitB, "ware._id": ware1, reason: "transfer_in" },
		projection: { _id: 1 },
	}).toArray();
	assert(out.length >= 1, "transfer_out movement");
	assert(inn.length >= 1, "transfer_in movement");
});

// ---------------------------------------------------------------------------
// 6. stock_movement is read-only
// ---------------------------------------------------------------------------

Deno.test("stock_movement has no add act", async () => {
	await assertRejects(
		() =>
			runAct(
				"stock_movement",
				"add",
				{ set: { quantity: 1 }, get: { _id: 1 } },
				managerId,
			),
		Error,
	);
});

// ---------------------------------------------------------------------------
// 7. Role scoping
// ---------------------------------------------------------------------------

Deno.test("role scoping: UnitHead sees own unit, OrgHead sees org", async () => {
	unitHeadA = await insertUser("Enterprise", {
		roles: [{
			roleId: crypto.randomUUID(),
			name: "UnitHead",
			scopeType: "unit",
			scopeId: unitA.toString(),
		}],
	});
	highwayHead = await insertUser("Enterprise", {
		roles: [{
			roleId: crypto.randomUUID(),
			name: "OrgHead",
			scopeType: "organization",
			scopeId: orgA.toString(),
		}],
	});

	// UnitHead: inventory gets restricted to own unit (verified via ODM read).
	const unitHeadInv = await runAct(
		"inventory",
		"gets",
		{
			set: { page: 1, limit: 50 },
			get: { _id: 1 },
		},
		unitHeadA,
	);
	assert((unitHeadInv as any).data.length >= 1);
	for (const row of (unitHeadInv as any).data) {
		const doc = await inventory.findOne({
			filters: { _id: row._id },
			projection: { "unit._id": 1 },
		});
		assertEquals(
			(doc as any).unit._id.toString(),
			unitA.toString(),
			"UnitHead sees only own unit",
		);
	}

	// OrgHead: sees both units in the org.
	const hhInv = await runAct(
		"inventory",
		"gets",
		{
			set: { page: 1, limit: 50 },
			get: { _id: 1 },
		},
		highwayHead,
	);
	const seenUnits = new Set<string>();
	for (const row of (hhInv as any).data) {
		const doc = await inventory.findOne({
			filters: { _id: row._id },
			projection: { "unit._id": 1 },
		});
		seenUnits.add((doc as any).unit._id.toString());
	}
	assert(seenUnits.has(unitA.toString()), "org head sees unit A");
	assert(seenUnits.has(unitB.toString()), "org head sees unit B");
});

// ---------------------------------------------------------------------------
// 8. JIT cycle (Phase 5): reorder → approve → issue → receive
// ---------------------------------------------------------------------------

Deno.test("JIT: checkReorder creates a request; approve→issue→receive completes the cycle", async () => {
	// Give the warehouse stock of ware2.
	await runAct(
		"goods_receipt",
		"add",
		{
			set: {
				receivingUnitId: warehouseUnit.toString(),
				received_at: new Date().toISOString(),
				items: [
					{
						ware_id: ware2.toString(),
						ware_name: "گاردریل فلزی",
						quantity_received: 50,
						quantity_accepted: 50,
						quantity_rejected: 0,
					},
				],
			},
			get: { _id: 1 },
		},
		managerId,
	);

	// Consuming unit U is below its reorder point (5 <= min 10).
	await runAct(
		"inventory",
		"add",
		{
			set: {
				unitId: unitA.toString(),
				wareId: ware2.toString(),
				quantity: 5,
				min_quantity: 10,
				max_quantity: 40,
			},
			get: INV_GET,
		},
		managerId,
	);

	const scan1 = await runAct(
		"inventory",
		"checkReorder",
		{
			set: { unitId: unitA.toString() },
			get: { created: 1, skipped: 1, rows: 1 },
		},
		managerId,
	);
	assertEquals((scan1 as any).created, 1, "one reorder request created");
	const requestId = ((scan1 as any).rows[0]._id as string);
	const requestedQty = (scan1 as any).rows[0].quantity as number;
	assertEquals(requestedQty, 35, "replenish-to-ceiling 40 - 5");

	// Single-request guard: re-scanning must not create a duplicate.
	const scan2 = await runAct(
		"inventory",
		"checkReorder",
		{
			set: { unitId: unitA.toString() },
			get: { created: 1, skipped: 1 },
		},
		managerId,
	);
	assertEquals((scan2 as any).created, 0, "no duplicate request");
	assertEquals((scan2 as any).skipped, 1, "open request skipped");

	// approve → issued (warehouse stock out) → received (consuming unit stock in)
	const approved = await runAct(
		"goods_request",
		"approve",
		{ set: { _id: requestId }, get: { _id: 1, status: 1 } },
		managerId,
	);
	assertEquals(approved.status, "approved");

	// Attach the warehouse to the request (scan-time request had no warehouse),
	// then issue.
	await goods_request.addRelation({
		filters: { _id: new ObjectId(requestId) },
		relations: {
			warehouse_unit: {
				_ids: warehouseUnit,
				relatedRelations: { warehouse_requests: true },
			},
		},
		projection: { _id: 1 },
	});

	const issued = await runAct(
		"goods_request",
		"issue",
		{ set: { _id: requestId }, get: { _id: 1, status: 1 } },
		managerId,
	);
	assertEquals(issued.status, "issued");

	const whLevel = await inventory.findOne({
		filters: { "unit._id": warehouseUnit, "ware._id": ware2 },
		projection: { quantity: 1 },
	});
	assertEquals((whLevel as any).quantity, 15, "50 - 35 issued from warehouse");

	const received = await runAct(
		"goods_request",
		"receive",
		{ set: { _id: requestId }, get: { _id: 1, status: 1 } },
		managerId,
	);
	assertEquals(received.status, "received");

	const unitLevel = await inventory.findOne({
		filters: { "unit._id": unitA, "ware._id": ware2 },
		projection: { quantity: 1 },
	});
	assertEquals((unitLevel as any).quantity, 40, "5 + 35 received at consuming unit");
});

Deno.test("JIT: goods_receipt cross_dock issues straight to the target unit", async () => {
	// Fresh ware so stock assertions are isolated from earlier tests.
	const crossWare = await insertWare(`نیوجرسی CD ${RUN}`);

	const result = await runAct(
		"goods_receipt",
		"add",
		{
			set: {
				receivingUnitId: warehouseUnit.toString(),
				targetUnitId: unitB.toString(),
				cross_dock: true,
				received_at: new Date().toISOString(),
				items: [
					{
						ware_id: crossWare.toString(),
						ware_name: "نیوجرسی CD",
						quantity_received: 10,
						quantity_accepted: 10,
						quantity_rejected: 0,
					},
				],
			},
			get: { _id: 1, cross_dock: 1 },
		},
		managerId,
	);
	assertEquals(result.cross_dock, true);

	const receiptDoc = await goodsReceipt.findOne({
		filters: { _id: result._id },
		projection: { "target_unit._id": 1 },
	});
	assertEquals(
		(receiptDoc as any).target_unit?._id?.toString(),
		unitB.toString(),
		"receipt carries the target unit relation",
	);

	// Stock lands on the target unit (issue movement), not the warehouse.
	const targetLevel = await inventory.findOne({
		filters: { "unit._id": unitB, "ware._id": crossWare },
		projection: { quantity: 1 },
	});
	assertEquals((targetLevel as any).quantity, 10, "cross-docked qty at target unit");

	const whLevel = await inventory.findOne({
		filters: { "unit._id": warehouseUnit, "ware._id": crossWare },
		projection: { quantity: 1 },
	});
	assertEquals(
		(whLevel as any)?.quantity ?? 0,
		0,
		"cross-docked stock does not rest in the warehouse",
	);
});

Deno.test("JIT: getWarehouseInventory annotates status healthy/due/critical", async () => {
	const result = await runAct(
		"inventory",
		"getWarehouseInventory",
		{ set: { unitId: warehouseUnit.toString() }, get: { rows: 1 } },
		managerId,
	);
	const rows = (result as any).rows as any[];
	assert(rows.length >= 1, "dashboard returns rows");
	for (const row of rows) {
		assert(
			["healthy", "due", "critical"].includes(row.status),
			"row carries a JIT status",
		);
	}
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
