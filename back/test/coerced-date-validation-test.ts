/**
 * Coerced date fields must survive validation on **every** act that declares them.
 *
 * `date()` accepts only a real `Date`, and JSON carries no `Date`, so the wire
 * value has to be turned into one *by validation*. Superstruct only runs
 * coercers through `create(value, Struct)`; `assert(value, Struct)` skips them.
 * Lesan picks between the two from `validationRunType` (`serveLesan.runAct`), so
 * an act whose validator declares `coerce(date(), string(), …)` but which does
 * not set `validationRunType: "create"` hands the raw string to `date()` and
 * rejects the request — which is how a patrol officer's correction of an
 * existing report failed while a brand-new report submitted fine.
 *
 * What is proven here:
 *   - the structural invariant: no act may hold a coerced date and run on
 *     `assert`. This is what protects the *next* date field somebody adds.
 *   - the behaviour, per act: a wire string is accepted and stored as a real
 *     `Date`, a `Date`-range query still finds it, and omitting the field
 *     leaves the stored value untouched.
 *
 * Run: deno test -A test/coerced-date-validation-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
	coerce,
	date,
	type Document,
	jwt,
	MongoClient,
	ObjectId,
	string as structString,
} from "@deps";
import { assert as structAssert, create as structCreate } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	accident,
	coreApp,
	getAtcsWithServices,
	incident_report,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

/**
 * Run an act the way `serveLesan` does: pre-acts, then whichever validation
 * branch `validationRunType` selects, then the body. Calling `act.fn` alone
 * would skip validation and prove nothing about the bug under test.
 */
const runAct = async (
	schema: string,
	actName: string,
	details: { set: Document; get: Document },
	userId: ObjectId,
) => {
	const headers = new Headers();
	headers.set("token", await makeToken(userId.toString()));
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `act ${schema}.${actName} is not registered`);
	for (const pre of act.preAct ?? []) await pre();
	const validated = act.validationRunType === "create"
		? structCreate(details, act.validator as never)
		: (structAssert(details, act.validator as never), details);
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details: validated,
	} as never);
};

// ---------------------------------------------------------------------------
// Structural invariant
// ---------------------------------------------------------------------------

/**
 * `coerce(struct, refiner, coercer)` builds a coercer whose body calls
 * `is(value, condition)`; no other combinator produces that call. Reading the
 * function's source is the only way to tell a real coercer from the identity
 * `coercer` every struct already carries, because superstruct does not expose
 * one. `defaulted()` is a `coerce()`, so `createdAt`/`updatedAt` are found too —
 * which is correct, they are coerced dates as well.
 */
const COERCER_MARKER = "is(value, condition)";

const coercesDate = (node: unknown): boolean => {
	const candidate = node as { coercer?: unknown; type?: unknown } | null;
	return typeof candidate?.coercer === "function" &&
		candidate.type === "date" &&
		String(candidate.coercer).includes(COERCER_MARKER);
};

/** Every `set.<path>` in a validator whose value is coerced into a `Date`. */
const coercedDatePaths = (node: unknown, path = "", found: string[] = []) => {
	if (!node || typeof node !== "object") return found;
	if (Array.isArray(node)) {
		node.forEach((child, i) =>
			coercedDatePaths(child, `${path}[${i}]`, found)
		);
		return found;
	}
	if (coercesDate(node)) found.push(path);
	const schema = (node as { schema?: unknown }).schema;
	if (!schema) return found;
	if (Array.isArray(schema)) {
		schema.forEach((child, i) =>
			coercedDatePaths(child, `${path}[${i}]`, found)
		);
	} else if (
		typeof schema === "object" &&
		typeof (schema as { type?: unknown }).type === "string"
	) {
		coercedDatePaths(schema, `${path}[]`, found);
	} else if (typeof schema === "object") {
		for (const key of Object.keys(schema)) {
			coercedDatePaths(
				(schema as Record<string, unknown>)[key],
				path ? `${path}.${key}` : key,
				found,
			);
		}
	}
	return found;
};

Deno.test("the coercer marker really marks a coerced date", () => {
	// If superstruct ever renames that call this whole guard silently stops
	// detecting anything, so assert the detector against a known struct first.
	assert(coercesDate(coerce(date(), structString(), (v) => new Date(v))));
	assert(!coercesDate(date()));
	assert(!coercesDate(structString()));
});

Deno.test("no act may coerce a date and still run on assert", () => {
	const offenders: string[] = [];
	const acts = getAtcsWithServices().main as Record<
		string,
		Record<string, { validator?: unknown; validationRunType?: string }>
	>;
	for (const [schema, schemaActs] of Object.entries(acts)) {
		for (const [actName, act] of Object.entries(schemaActs)) {
			const paths = coercedDatePaths(act.validator);
			if (paths.length === 0) continue;
			if (act.validationRunType !== "create") {
				offenders.push(
					`${schema}.${actName} coerces [${
						paths.join(", ")
					}] but runs on "${act.validationRunType ?? "assert"}"`,
				);
			}
		}
	}
	assertEquals(
		offenders,
		[],
		`acts that reject wire date strings:\n${offenders.join("\n")}`,
	);
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

const insertUser = async (level: string): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `cd_${RUN}_${seq}@test.local`,
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

let ghostId: ObjectId;
let managerId: ObjectId;

Deno.test("seed fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
});

/** The `date_of_accident` an `add` will store, so `update` has something to replace. */
const ORIGINAL_DATE = "2026-03-11T12:00:00.000Z";

const addAccident = async (uuid: string) =>
	await runAct("accident", "add", {
		set: {
			client_report_uuid: uuid,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			date_of_accident: ORIGINAL_DATE,
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId };

const readAccident = async (_id: ObjectId) =>
	await accident.findOne({
		filters: { _id },
		projection: {
			date_of_accident: 1,
			completion_date: 1,
			police_arrival_time: 1,
			vehicle_dtos: 1,
		},
	}) as {
		date_of_accident?: Date;
		completion_date?: Date;
		police_arrival_time?: Date;
		vehicle_dtos?: { insurance_date?: Date; body_insurance_date?: Date }[];
	};

// ---------------------------------------------------------------------------
// accident.update
// ---------------------------------------------------------------------------

Deno.test("accident.update — a date-only string is accepted and stored as a Date", async () => {
	const created = await addAccident(`uuid-${RUN}-date-only`);

	const updated = await runAct("accident", "update", {
		set: {
			_id: created._id.toString(),
			date_of_accident: "2026-10-17",
		},
		get: { _id: 1, date_of_accident: 1 },
	}, managerId) as { _id?: ObjectId; date_of_accident?: Date };

	assertExists(updated._id);

	const stored = await readAccident(created._id);
	// A `Date` in the driver, not the literal "2026-10-17" the client sent: a
	// string stored here would pass validation and silently break every
	// date-range query and the reports timeline.
	assert(
		stored.date_of_accident instanceof Date,
		`date_of_accident stored as ${typeof stored.date_of_accident}: ${
			String(stored.date_of_accident)
		}`,
	);
	assertEquals(
		(stored.date_of_accident as Date).toISOString(),
		new Date("2026-10-17T00:00:00.000Z").toISOString(),
	);
});

Deno.test("accident.update — a datetime string is accepted too", async () => {
	const created = await addAccident(`uuid-${RUN}-datetime`);

	await runAct("accident", "update", {
		set: {
			_id: created._id.toString(),
			date_of_accident: "2026-10-17T10:30",
		},
		get: { _id: 1 },
	}, managerId);

	const stored = await readAccident(created._id);
	assert(stored.date_of_accident instanceof Date);
	assertEquals(
		(stored.date_of_accident as Date).toISOString(),
		new Date("2026-10-17T10:30").toISOString(),
	);
});

Deno.test("accident.update — the remaining top-level dates are coerced", async () => {
	const created = await addAccident(`uuid-${RUN}-others`);

	await runAct("accident", "update", {
		set: {
			_id: created._id.toString(),
			completion_date: "2026-10-17",
			police_arrival_time: "2026-10-17T08:15",
		},
		get: { _id: 1 },
	}, managerId);

	const stored = await readAccident(created._id);
	assert(
		stored.completion_date instanceof Date,
		`completion_date stored as ${typeof stored.completion_date}`,
	);
	assert(
		stored.police_arrival_time instanceof Date,
		`police_arrival_time stored as ${typeof stored.police_arrival_time}`,
	);
});

Deno.test("accident.update — dates nested in vehicle_dtos are coerced", async () => {
	// Nested DTO coercion is the easy one to get wrong, so it is exercised
	// separately rather than assumed to follow the top level.
	const created = await addAccident(`uuid-${RUN}-dto`);

	await runAct("accident", "update", {
		set: {
			_id: created._id.toString(),
			vehicle_dtos: [{
				plaque_no: ["۱۲", "ب", "۳۴۵"],
				insurance_date: "2025-08-01",
				body_insurance_date: "2026-02-03T00:00",
			}],
		},
		get: { _id: 1 },
	}, managerId);

	const stored = await readAccident(created._id);
	const vehicle = stored.vehicle_dtos?.[0];
	assertExists(vehicle);
	assert(
		vehicle.insurance_date instanceof Date,
		`insurance_date stored as ${typeof vehicle.insurance_date}`,
	);
	assert(
		vehicle.body_insurance_date instanceof Date,
		`body_insurance_date stored as ${typeof vehicle.body_insurance_date}`,
	);
});

Deno.test("accident.update — a stored date still answers a date-range query", async () => {
	// The check that catches a half-fix: validation passed, but the value went
	// in as a string, so `$gte`/`$lte` on a Date field no longer match it.
	const created = await addAccident(`uuid-${RUN}-query`);
	await runAct("accident", "update", {
		set: { _id: created._id.toString(), date_of_accident: "2026-10-17" },
		get: { _id: 1 },
	}, managerId);

	const inside = await runAct("accident", "gets", {
		set: {
			dateOfAccidentFrom: "2026-10-01",
			dateOfAccidentTo: "2026-10-31",
			page: 1,
			limit: 100,
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId }[];

	assert(
		inside.some((row) => String(row._id) === String(created._id)),
		"the corrected report is missing from its own date range",
	);

	const outside = await runAct("accident", "gets", {
		set: {
			dateOfAccidentFrom: "2026-11-01",
			dateOfAccidentTo: "2026-11-30",
			page: 1,
			limit: 100,
		},
		get: { _id: 1 },
	}, managerId) as { _id: ObjectId }[];

	assert(
		!outside.some((row) => String(row._id) === String(created._id)),
		"a Date range matched a date the report does not have",
	);
});

Deno.test("accident.update — omitting every date leaves the stored dates alone", async () => {
	// `create()` also fills `defaulted(...)`. No shared set schema carries a
	// default today, and this is what keeps it that way: moving `update` onto the
	// create path must not start overwriting values the client did not send.
	const created = await addAccident(`uuid-${RUN}-untouched`);
	const before = await readAccident(created._id);

	await runAct("accident", "update", {
		set: { _id: created._id.toString(), dead_count: 2 },
		get: { _id: 1, dead_count: 1 },
	}, managerId);

	const after = await readAccident(created._id);
	assertEquals(after.date_of_accident, before.date_of_accident);
	assertEquals(after.vehicle_dtos, before.vehicle_dtos);
});

Deno.test("accident.add still coerces a wire date", async () => {
	// `add` was already on the create path; this is the control that shows the
	// change to `update` did not disturb it.
	const created = await addAccident(`uuid-${RUN}-add`);

	const stored = await readAccident(created._id);
	assert(
		stored.date_of_accident instanceof Date,
		`date_of_accident stored as ${typeof stored.date_of_accident}`,
	);
	assertEquals(
		(stored.date_of_accident as Date).toISOString(),
		new Date(ORIGINAL_DATE).toISOString(),
	);
});

// ---------------------------------------------------------------------------
// incident_report.update
// ---------------------------------------------------------------------------

Deno.test("incident_report.update — occurred_at is accepted and stored as a Date", async () => {
	const seeded = await incident_report.insertOne({
		doc: {
			form_definition_id: new ObjectId(),
			occurred_at: new Date("2026-03-11T12:00:00.000Z"),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});

	await runAct("incident_report", "update", {
		set: {
			_id: seeded!._id.toString(),
			// Required by the set schema, stripped by the act body: `update` is a
			// correction of an existing report and does not re-file it under a form.
			form_definition_id: new ObjectId().toString(),
			occurred_at: "2026-10-17",
		},
		get: { _id: 1, occurred_at: 1 },
	}, managerId);

	const stored = await incident_report.findOne({
		filters: { _id: seeded!._id as ObjectId },
		projection: { occurred_at: 1 },
	}) as { occurred_at?: Date };

	assert(
		stored.occurred_at instanceof Date,
		`occurred_at stored as ${typeof stored.occurred_at}: ${
			String(stored.occurred_at)
		}`,
	);
	assertEquals(
		(stored.occurred_at as Date).toISOString(),
		new Date("2026-10-17T00:00:00.000Z").toISOString(),
	);
});

// ---------------------------------------------------------------------------
// user.registerUser
// ---------------------------------------------------------------------------

Deno.test("user.registerUser — birth_date is accepted and stored as a Date", async () => {
	const email = `reg_${RUN}@test.co`;
	await runAct("user", "registerUser", {
		set: {
			first_name: "کاربر",
			last_name: "آزمایشی",
			father_name: "پدر",
			mobile: "09151234567",
			gender: "Male",
			email,
			password: "password123",
			birth_date: "1990-04-02",
		},
		get: { _id: 1 },
	}, managerId);

	const stored = await user.findOne({
		filters: { email },
		projection: { birth_date: 1 },
	}) as { birth_date?: Date };

	assert(
		stored.birth_date instanceof Date,
		`birth_date stored as ${typeof stored.birth_date}`,
	);
	assertEquals(
		(stored.birth_date as Date).toISOString(),
		new Date("1990-04-02T00:00:00.000Z").toISOString(),
	);
});

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	const collections = await db.listCollections().toArray();
	for (const c of collections) await db.collection(c.name).drop();
	await client.close();
});
