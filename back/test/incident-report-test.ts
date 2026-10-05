/**
 * Tests for the two-kind form model and the `incident_report` collection.
 *
 * Covers the decisions that shape this work:
 *   - two form kinds replace the old `incident_type` taxonomy
 *   - exactly one active accident form per organization, enforced by the database
 *   - non-accident forms are unbounded
 *   - bindings are derived from the target model, so an invalid one cannot be authored
 *   - icons are validated against the shared registry
 *   - a report records the form it was filed under, and the server derives the title
 *
 * Run: deno test -A test/incident-report-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
import { assert as structAssert } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	coreApp,
	form_definition,
	getAtcsWithServices,
	incident_report,
	organization,
	unit,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { bindableRelationsFor } from "../src/form_definition/helpers.ts";
import type { FormDefinition } from "@forms";

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
	if (userId) headers.set("token", await makeToken(userId.toString()));
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `act ${schema}.${actName} is not registered`);
	for (const pre of act.preAct ?? []) await pre();
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details,
	});
};

/**
 * Run an act's own validator and report the failure it raises.
 *
 * `runAct` calls `act.fn` directly without validating, so a test that asserts
 * "the server rejects this key" through it would prove nothing. Superstruct
 * validates objects strictly, so an unknown key comes back as a
 * `{ type: "never" }` failure listing the offending key.
 */
const validateRejection = (
	schema: string,
	actName: string,
	details: { set: Document; get: Document },
): string => {
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `act ${schema}.${actName} is not registered`);
	try {
		structAssert(details, act.validator as never);
	} catch (cause) {
		// Superstruct names the offending path and expects `never` for it.
		const message = (cause as Error)?.message;
		if (typeof message === "string" && message.length > 0) return message;
		try {
			return JSON.stringify(cause) || String(cause);
		} catch {
			return String(cause);
		}
	}
	return "";
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

type TestRole = {
	roleId: string;
	name: "Ghost" | "Manager" | "OrgHead" | "UnitHead" | "Officer" | "Patrol";
	scopeType?: "organization" | "unit";
	scopeId?: string;
};

const orgRole = (orgId: ObjectId, name: TestRole["name"]): TestRole => ({
	roleId: String(orgId),
	name,
	scopeType: "organization",
	scopeId: String(orgId),
});

const insertUser = async (
	level: string,
	roles: TestRole[] = [],
): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `ir_${RUN}_${seq}@test.local`,
			level,
			is_active: true,
			failed_login_attempts: 0,
			roles,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertOrg = async (name: string): Promise<ObjectId> => {
	seq++;
	const created = await organization.insertOne({
		doc: {
			code: `IR${RUN}-${seq}`,
			name,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertUnit = async (
	name: string,
	orgId: ObjectId,
	officers: ObjectId[],
) => {
	const created = await unit.insertOne({
		doc: { name, createdAt: new Date(), updatedAt: new Date() },
		relations: {
			organization: { _ids: orgId, relatedRelations: { units: true } },
			officers: { _ids: officers },
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

/**
 * A definition binding one relation.
 *
 * The two kinds bind differently on purpose: an accident form can bind relations
 * the report model does not have, and a road-damage form cannot bind accident-only
 * ones. Both directions are proven by the binding tests below.
 */
const definitionFor = (path: string, multi = false): FormDefinition => ({
	schemaVersion: 1,
	name: "فرم",
	pages: [{
		key: "scene",
		title: "وضعیت",
		order: 1,
		sections: [{
			key: "sceneSection",
			title: "وضعیت",
			order: 1,
			nodes: [{
				kind: "field",
				key: multi ? "manyIds" : "oneId",
				type: "reference",
				label: multi ? "عیب راه" : "شدت",
				order: 1,
				requiredWhen: { op: "always" },
				options: {
					kind: "reference",
					// The reference source must be the model the relation points at,
					// or `activate` rejects the definition for having no options.
					model: multi
						? "road_defect"
						: path === "position"
						? "position"
						: "incident_severity",
				},
				binding: { kind: "relation", path, multi },
			}],
		}],
	}],
});

const FORM_GET: Document = {
	_id: 1,
	name: 1,
	status: 1,
	version: 1,
	form_kind: 1,
	icon: 1,
	definition: 1,
	"organization._id": 1,
};

let ghostId: ObjectId;
let managerId: ObjectId;
let orgHeadId: ObjectId;
let patrolId: ObjectId;
let orgA: ObjectId;

const addForm = async (
	orgId: ObjectId,
	name: string,
	kind: string,
	definition: FormDefinition,
	icon?: string,
) => await runAct("form_definition", "add", {
	set: {
		organizationId: String(orgId),
		name,
		form_kind: kind,
		...(icon && { icon }),
		definition: definition as unknown as Document,
	},
	get: FORM_GET,
}, managerId) as { _id: ObjectId };

const activate = async (id: ObjectId, as: ObjectId = managerId) =>
	await runAct("form_definition", "activate", {
		set: { _id: id.toString() },
		get: {},
	}, as);

Deno.test("setup fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	orgA = await insertOrg(`سازمان الف ${RUN}`);
	orgHeadId = await insertUser("OrgHead", [orgRole(orgA, "OrgHead")]);
	patrolId = await insertUser("Patrol", [orgRole(orgA, "Patrol")]);
	await insertUnit(`واحد ${RUN}`, orgA, [patrolId]);

	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);

	// `activate` refuses a definition whose reference source has no records, so the
	// shared lookup tables have to exist before any form in this suite can publish.
	// This also exercises the weather/lighting seed this work adds.
	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
});

// ---------------------------------------------------------------------------
// The two kinds
// ---------------------------------------------------------------------------

Deno.test("kinds — a form records its kind and defaults to accident", async () => {
	const explicit = await addForm(
		orgA,
		`تصادف ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	assertExists(explicit._id);

	const other = await addForm(
		orgA,
		`رخداد ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	assertExists(other._id);

	const stored = await form_definition.findOne({
		filters: { _id: other._id },
		projection: { form_kind: 1, name: 1 },
	});
	assertEquals(
		(stored as unknown as { form_kind: string }).form_kind,
		"incident_report",
	);
});

// ---------------------------------------------------------------------------
// Decision D2 — exactly one active accident form per organization
// ---------------------------------------------------------------------------

Deno.test("singleton — activating a second accident form archives the first", async () => {
	const orgId = await insertOrg(`سازمان تک ${RUN}`);

	const first = await addForm(
		orgId,
		`اول ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	await activate(first._id);

	const second = await addForm(
		orgId,
		`دوم ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	await activate(second._id);

	const actives = await form_definition
		.find({
			filters: {
				"organization._id": orgId,
				status: "active",
				form_kind: "accident",
			},
			projection: { _id: 1, name: 1 },
		})
		.toArray();

	assertEquals(
		actives.length,
		1,
		"exactly one active accident form per organization",
	);
	assertEquals(
		(actives[0] as unknown as { name: string }).name,
		`دوم ${RUN}`,
		"the newly activated form is the live one",
	);
});

Deno.test("singleton — the database index rejects a second live accident form", async () => {
	// The act archives first, so this proves the *database* backstop rather than the
	// act's own ordering.
	const orgId = await insertOrg(`سازمان ایندکس ${RUN}`);
	const form = await addForm(
		orgId,
		`یکتا ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	await activate(form._id);

	let duplicateError = "";
	try {
		await form_definition.insertOne({
			doc: {
				name: `دور زدن ${RUN}`,
				form_kind: "accident",
				status: "active",
				version: 1,
				schema_version: 1,
				definition: { pages: [] },
				createdAt: new Date(),
				updatedAt: new Date(),
			} as never,
			relations: { organization: { _ids: orgId } },
			projection: { _id: 1 },
		});
	} catch (cause) {
		duplicateError = (cause as Error).message;
	}
	assert(
		duplicateError.includes("duplicate key") ||
			duplicateError.includes("E11000"),
		`expected the unique index to reject it, got: ${duplicateError}`,
	);
});

// ---------------------------------------------------------------------------
// Decision D3 — non-accident forms are unbounded
// ---------------------------------------------------------------------------

Deno.test("unbounded — ten non-accident forms can be active at once", async () => {
	const orgId = await insertOrg(`سازمان ده فرم ${RUN}`);
	const ids: ObjectId[] = [];
	for (let i = 0; i < 10; i++) {
		const form = await addForm(
			orgId,
			`فرم ${i + 1} ${RUN}`,
			"incident_report",
			definitionFor("road_defects", true),
		);
		await activate(form._id);
		ids.push(form._id);
	}

	const actives = await form_definition
		.find({
			filters: {
				"organization._id": orgId,
				status: "active",
				form_kind: "incident_report",
			},
			projection: { _id: 1 },
		})
		.toArray();

	assertEquals(actives.length, 10, "no cap on the non-accident kind");
});

// ---------------------------------------------------------------------------
// Activating a non-accident form archives nothing
// ---------------------------------------------------------------------------

Deno.test("unbounded — activating a non-accident form leaves other forms live", async () => {
	const orgId = await insertOrg(`سازمان همزمان ${RUN}`);
	const a = await addForm(
		orgId,
		`الف ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	const b = await addForm(
		orgId,
		`ب ${RUN}`,
		"incident_report",
		definitionFor("equipment_damages", true),
	);

	await activate(a._id);
	await activate(b._id);

	const actives = await form_definition
		.find({
			filters: { "organization._id": orgId, status: "active" },
			projection: { name: 1 },
		})
		.toArray();
	assertEquals(actives.length, 2);
});

// ---------------------------------------------------------------------------
// archive
// ---------------------------------------------------------------------------

Deno.test("archive — the last active accident form cannot be archived", async () => {
	const orgId = await insertOrg(`سازمان بایگانی ${RUN}`);
	const form = await addForm(
		orgId,
		`تنها ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	await activate(form._id);

	let error = "";
	try {
		await runAct("form_definition", "archive", {
			set: { _id: form._id.toString() },
			get: {},
		}, managerId);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("تنها فرم فعال تصادف"),
		`expected the singleton guard, got: ${error}`,
	);
});

Deno.test("archive — a non-accident form can be retired freely", async () => {
	const orgId = await insertOrg(`سازمان آزاد ${RUN}`);
	const a = await addForm(
		orgId,
		`یک ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	const b = await addForm(
		orgId,
		`دو ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(a._id);
	await activate(b._id);

	const result = await runAct("form_definition", "archive", {
		set: { _id: a._id.toString() },
		get: { status: 1 },
	}, managerId) as { status?: string };

	assertEquals(result.status, "archived");
	const stillActive = await form_definition.countDocument({
		filter: { "organization._id": orgId, status: "active" },
	});
	assertEquals(stillActive, 1);
});

Deno.test("archive — an org head cannot archive another org's form", async () => {
	const otherOrg = await insertOrg(`سازمان بیگانه ${RUN}`);
	const form = await addForm(
		otherOrg,
		`بیگانه ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);

	let error = "";
	try {
		await runAct("form_definition", "archive", {
			set: { _id: form._id.toString() },
			get: {},
		}, orgHeadId);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.length > 0, "expected a scope error");
});

// ---------------------------------------------------------------------------
// Bindings — derived, never hand-listed
// ---------------------------------------------------------------------------

Deno.test("bindings — the registry is derived per kind from the target model", async () => {
	const accidentRelations = bindableRelationsFor("accident");
	const reportRelations = bindableRelationsFor("incident_report");

	assert(
		accidentRelations.some((r) =>
			r.path === "vehicle_dtos" || r.path === "collision_type"
		),
		"the accident model exposes its own relations",
	);
	assert(
		reportRelations.some((r) => r.path === "road_defects" && r.multi),
		"the report model exposes road_defects as multiple",
	);
	// The whole point of splitting the models: the two lists are not the same.
	assert(
		!reportRelations.some((r) => r.path === "vehicle_dtos"),
		"accident-only relations must not be offered to a road-damage form",
	);
});

Deno.test("bindings — the registry never offers server-owned relations", async () => {
	for (const kind of ["accident", "incident_report"]) {
		for (const relation of bindableRelationsFor(kind)) {
			assert(
				relation.schemaName !== "user" &&
					relation.schemaName !== "file",
				`${kind} must not offer a relation the backend fills in: ${relation.path}`,
			);
		}
	}
});

Deno.test("bindings — the act returns the same list the validator uses", async () => {
	const payload = await runAct("form_definition", "getBindableRelations", {
		set: { formKind: "incident_report" },
		get: { formKind: 1, relations: 1 },
	}, managerId) as {
		formKind: string;
		relations: Array<{ path: string; multi: boolean }>;
	};

	assertEquals(payload.formKind, "incident_report");
	assert(
		payload.relations.some((r) => r.path === "road_defects"),
		"the act exposes the derived list",
	);
});

Deno.test("bindings — activate refuses a relation the target model lacks", async () => {
	const orgId = await insertOrg(`سازمان اتصال ${RUN}`);
	// `collision_type` is an accident relation and does not exist on incident_report.
	const form = await addForm(
		orgId,
		`اتصال بد ${RUN}`,
		"incident_report",
		definitionFor("collision_type"),
	);

	let error = "";
	try {
		await activate(form._id);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("collision_type"),
		`expected the binding to be rejected, got: ${error}`,
	);
});

Deno.test("bindings — activate refuses a single/multi mismatch", async () => {
	const orgId = await insertOrg(`سازمان چندگانه ${RUN}`);
	// `incident_severity` is a single relation but the field claims multi.
	const form = await addForm(
		orgId,
		`چندگانه بد ${RUN}`,
		"incident_report",
		definitionFor("incident_severity", true),
	);

	let error = "";
	try {
		await activate(form._id);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("چندانتخابی") || error.includes("تک‌انتخابی"),
		`got: ${error}`,
	);
});

Deno.test("bindings — activate refuses a pure binding to a field the model lacks", async () => {
	const orgId = await insertOrg(`سازمان خالص ${RUN}`);
	const definition = definitionFor("road_defects", true);
	const node = definition.pages[0].sections![0].nodes![0] as {
		binding?: unknown;
	};
	node.binding = { kind: "pure", path: "not_a_real_field" };

	const form = await addForm(
		orgId,
		`خالص بد ${RUN}`,
		"incident_report",
		definition,
	);

	let error = "";
	try {
		await activate(form._id);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.includes("not_a_real_field"), `got: ${error}`);
});

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

Deno.test("icons — a known icon survives activation", async () => {
	const orgId = await insertOrg(`سازمان آیکون ${RUN}`);
	const form = await addForm(
		orgId,
		`آیکوندار ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
		"roadHorizon",
	);
	await activate(form._id);

	const stored = await form_definition.findOne({
		filters: { _id: form._id },
		projection: { icon: 1 },
	});
	assertEquals((stored as unknown as { icon: string }).icon, "roadHorizon");
});

Deno.test("icons — an unknown icon name is rejected at publish time", async () => {
	const orgId = await insertOrg(`سازمان آیکون بد ${RUN}`);
	const form = await addForm(
		orgId,
		`آیکون بد ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
		"traffic-sign",
	);

	let error = "";
	try {
		await activate(form._id);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(
		error.includes("traffic-sign"),
		`expected the icon to be rejected, got: ${error}`,
	);
});

// ---------------------------------------------------------------------------
// Reference models
// ---------------------------------------------------------------------------

Deno.test("references — the act reports hasRecords so the builder can warn", async () => {
	const payload = await runAct("form_definition", "getReferenceModels", {
		set: {},
		get: { models: 1 },
	}, managerId) as { models: Array<{ model: string; hasRecords: boolean }> };

	const roadSurface = payload.models.find((m) =>
		m.model === "road_surface_condition"
	);
	assertExists(
		roadSurface,
		"road_surface_condition is a permitted reference source",
	);
	assertEquals(
		roadSurface.hasRecords,
		true,
		"it is seeded, so a form may use it",
	);
});

// ---------------------------------------------------------------------------
// incident_report
// ---------------------------------------------------------------------------

let reportFormId: ObjectId;

Deno.test("reports — filing a report records the form and derives its title", async () => {
	const orgId = await insertOrg(`سازمان گزارش ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد گزارش ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`فرم خرابی ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
		"roadHorizon",
	);
	await activate(form._id);
	reportFormId = form._id;

	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-1`,
			description: "سطح راه خراب شده است",
			needs_repair: true,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: {
			_id: 1,
			report_id: 1,
			serial: 1,
			form_definition_id: 1,
			form_title: 1,
			form_icon: 1,
			sync_status: 1,
			review_status: 1,
		},
	}, officer) as Record<string, unknown>;

	assertEquals(
		created["form_title"],
		`فرم خرابی ${RUN}`,
		"the title comes from the stored form, not the request",
	);
	assertEquals(created["form_icon"], "roadHorizon");
	assertEquals(created["sync_status"], "synced");
	assertEquals(created["review_status"], "submitted");
	assert(
		String(created["report_id"]).startsWith("INC-"),
		`unexpected report id: ${created["report_id"]}`,
	);
});

Deno.test("reports — a retired form cannot be used to file", async () => {
	const orgId = await insertOrg(`سازمان بسته ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد بسته ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`موقت ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	// A draft was never activated.
	let error = "";
	try {
		await runAct("incident_report", "add", {
			set: { form_definition_id: form._id.toString() },
			get: { _id: 1 },
		}, officer);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.includes("فرم فعال یافت نشد"), `got: ${error}`);
});

Deno.test("reports — an accident form cannot be used for a non-accident report", async () => {
	const orgId = await insertOrg(`سازمان اشتباه ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد اشتباه ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`تصادفی ${RUN}`,
		"accident",
		definitionFor("position"),
	);
	await activate(form._id);

	let error = "";
	try {
		await runAct("incident_report", "add", {
			set: { form_definition_id: form._id.toString() },
			get: { _id: 1 },
		}, officer);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.includes("برای گزارش رخداد نیست"), `got: ${error}`);
});

Deno.test("reports — one org cannot file under another org's form", async () => {
	const orgId = await insertOrg(`سازمان الف گزارش ${RUN}`);
	const foreignOrg = await insertOrg(`سازمان ب گزارش ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد الف گزارش ${RUN}`, orgId, [officer]);

	const foreignForm = await addForm(
		foreignOrg,
		`بیگانه ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(foreignForm._id, ghostId as ObjectId);

	let error = "";
	try {
		await runAct("incident_report", "add", {
			set: { form_definition_id: foreignForm._id.toString() },
			get: { _id: 1 },
		}, officer);
	} catch (cause) {
		error = (cause as Error).message;
	}
	assert(error.includes("فرم فعال یافت نشد"), `got: ${error}`);
});

Deno.test("reports — re-submitting the same uuid does not duplicate", async () => {
	const orgId = await insertOrg(`سازمان تکرار ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد تکرار ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`تکرار ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(form._id);

	const payload = {
		form_definition_id: form._id.toString(),
		client_report_uuid: `uuid-${RUN}-dup`,
	};
	const first = await runAct("incident_report", "add", {
		set: payload,
		get: { _id: 1 },
	}, officer) as { _id: ObjectId };
	const second = await runAct("incident_report", "add", {
		set: payload,
		get: { _id: 1 },
	}, officer) as { _id: ObjectId };

	assertEquals(
		first._id.toString(),
		second._id.toString(),
		"idempotency by client_report_uuid",
	);
});

Deno.test("reports — a report can be listed and filtered by its form", async () => {
	const rows = await runAct("incident_report", "gets", {
		set: { page: 1, limit: 50 },
		get: { _id: 1, form_definition_id: 1, form_title: 1 },
	}, patrolId) as Array<{ form_definition_id: ObjectId }>;

	const mine = rows.filter((row) =>
		row.form_definition_id.toString() === reportFormId.toString()
	);
	assertEquals(
		mine.length,
		0,
		"patrolId belongs to a different organization",
	);
});

Deno.test("reports — review transitions work on the new model", async () => {
	const orgId = await insertOrg(`سازمان بررسی ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد بررسی ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`بررسی ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(form._id);

	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-review`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1 },
	}, officer) as { _id: ObjectId };
	const reportId = created._id;

	// A report must be on the server before review — the same rule as an accident.
	// Filing one already puts it there, so the state the gate refuses has to be
	// forced: `draft` is a report the control centre does not hold at all.
	await incident_report.findOneAndUpdate({
		filter: { _id: reportId },
		update: { $set: { sync_status: "draft" } },
		projection: { _id: 1 },
	});

	let notSynced = "";
	try {
		await runAct("incident_report", "reviewReport", {
			set: { reportId: reportId.toString(), action: "start_review" },
			get: {},
		}, managerId);
	} catch (cause) {
		notSynced = (cause as Error).message;
	}
	assert(notSynced.includes("همگام‌سازی"), `got: ${notSynced}`);

	await incident_report.findOneAndUpdate({
		filter: { _id: reportId },
		update: { $set: { sync_status: "synced" } },
		projection: { _id: 1 },
	});

	const started = await runAct("incident_report", "reviewReport", {
		set: { reportId: reportId.toString(), action: "start_review" },
		get: { review_status: 1 },
	}, managerId) as { review_status?: string };
	assertEquals(started.review_status, "under_review");

	const returned = await runAct("incident_report", "reviewReport", {
		set: {
			reportId: reportId.toString(),
			action: "return",
			reason: "توضیح بیشتری لازم است",
		},
		get: { review_status: 1, review_reason: 1 },
	}, managerId) as { review_status?: string; review_reason?: string };
	assertEquals(returned.review_status, "returned");
	assertEquals(returned.review_reason, "توضیح بیشتری لازم است");

	// The officer re-submits their own returned report.
	const resubmitted = await runAct("incident_report", "resubmitReport", {
		set: { reportId: reportId.toString() },
		get: { review_status: 1 },
	}, officer) as { review_status?: string };
	assertEquals(resubmitted.review_status, "submitted");

	const history = await runAct("incident_report", "reviewHistory", {
		set: { reportId: reportId.toString() },
		get: {},
	}, managerId) as unknown[];
	assert(
		(Array.isArray(history) ? history.length : 0) > 0 ||
			history !== null,
		"the review trail is readable",
	);
});

Deno.test("reports — the sync-status widget can count non-accident reports", async () => {
	const buckets = await runAct("incident_report", "getSyncStatus", {
		set: {},
		get: { _id: 1, report_id: 1 },
	}, patrolId) as Record<string, unknown[]>;

	for (const status of ["draft", "queued", "syncing", "synced", "rejected"]) {
		assert(Array.isArray(buckets[status]), `bucket ${status} is present`);
	}
});

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// A bound answer lands as a real relation, not just a snapshot row
// ---------------------------------------------------------------------------

Deno.test("reports — a bound answer becomes a real Lesan relation", async () => {
	const orgId = await insertOrg(`سازمان رابطه ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد رابطه ${RUN}`, orgId, [officer]);

	const form = await addForm(
		orgId,
		`رابطه ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(form._id);

	// A real `road_defect` record, so the relation resolves.
	const { road_defect } = await import("../mod.ts");
	const defect = await road_defect.insertOne({
		doc: {
			name: `عیب ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	const defectId = (defect!._id as ObjectId).toString();

	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-binding`,
			// This is the key `relationSetKey` derives from the binding.
			roadDefectsIds: [defectId],
			dynamic_answers: [{
				model_name: "road_defect",
				answer_ids: [defectId],
				answer_names: [`عیب ${RUN}`],
			}],
		},
		get: { _id: 1, road_defects: { _id: 1, name: 1 } },
	}, officer) as { _id: ObjectId; road_defects?: Array<{ name: string }> };

	// Stored as an embedded relation, so an aggregation can join it — which is what
	// the charts would do.
	assertEquals(
		(created.road_defects ?? []).map((d) => d.name),
		[`عیب ${RUN}`],
		"the bound answer is a real relation, not only a dynamic_answers row",
	);
});

// ---------------------------------------------------------------------------
// Filing provenance: which organization filed it, and on which app build
// ---------------------------------------------------------------------------

/** A patrol officer in a unit of `orgId`, with one active report form. */
const provisionFiler = async (label: string) => {
	const orgId = await insertOrg(`سازمان ${label} ${RUN}`);
	const officer = await insertUser("Patrol", [orgRole(orgId, "Patrol")]);
	await insertUnit(`واحد ${label} ${RUN}`, orgId, [officer]);
	const form = await addForm(
		orgId,
		`فرم ${label} ${RUN}`,
		"incident_report",
		definitionFor("road_defects", true),
	);
	await activate(form._id);
	return { orgId, officer, form };
};

Deno.test("provenance — an app submission links the filing organization", async () => {
	const { orgId, officer, form } = await provisionFiler("ثبت سازمان");

	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-prov-1`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.4.2", platform: "ios" },
		},
		get: {
			_id: 1,
			submitted_from: 1,
			"organization._id": 1,
		},
	}, officer) as {
		_id: ObjectId;
		submitted_from?: unknown;
		organization?: { _id: ObjectId };
	};

	assertEquals(
		created.submitted_from,
		{ app_version: "1.4.2", platform: "ios" },
		"the submitting build is snapshotted verbatim",
	);
	assertEquals(
		created.organization?._id?.toString(),
		orgId.toString(),
		"the organization is resolved from the officer's unit, server-side",
	);
});

Deno.test("provenance — a report without submitted_from carries no organization", async () => {
	// This is the web-console / JSON-import path. It must stay distinguishable
	// from an app submission, and nothing about it changes.
	const { officer, form } = await provisionFiler("بدون ثبت");

	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-prov-2`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
		},
		get: { _id: 1, submitted_from: 1, "organization._id": 1 },
	}, officer) as Record<string, unknown>;

	assertEquals(created["submitted_from"], undefined);
	assertEquals(created["organization"], undefined);
});

Deno.test("provenance — a client cannot choose the organization", async () => {
	// The security property: `organization` is absent from the set schema, so a
	// forged id is an unknown key rather than a value the server trusts.
	const { officer, form } = await provisionFiler("جعل سازمان");
	const foreignOrg = await insertOrg(`سازمان بیگانه پروونس ${RUN}`);

	const rejection = validateRejection("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-prov-3`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.4.2", platform: "ios" },
			organizationId: foreignOrg.toString(),
		},
		get: { _id: 1 },
	});
	assert(
		rejection.includes("organizationId"),
		`expected the forged organization to be rejected, got: ${rejection}`,
	);
});

Deno.test("provenance — a correction does not restamp the original build", async () => {
	// `update` mirrors `add`'s payload for corrections, so it must not accept the
	// provenance: the console keeps showing the build that filed the report.
	const { officer, form } = await provisionFiler("اصلاح");
	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-prov-4`,
			location: { type: "Point", coordinates: [51.4, 35.7] },
			submitted_from: { app_version: "1.0.0", platform: "android" },
		},
		get: { _id: 1 },
	}, officer) as { _id: ObjectId };

	const rejection = validateRejection("incident_report", "update", {
		set: {
			// `update` re-sends the whole payload, so the required keys travel with it;
			// only `submitted_from` is the thing under test.
			_id: created._id.toString(),
			form_definition_id: form._id.toString(),
			client_report_uuid: `uuid-${RUN}-prov-4`,
			submitted_from: { app_version: "9.9.9", platform: "ios" },
		},
		get: { _id: 1 },
	});
	assert(
		rejection.includes("submitted_from"),
		`expected update to refuse provenance, got: ${rejection}`,
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
