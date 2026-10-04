/**
 * Dynamic form engine backend tests.
 *
 * Covers the `form_definition` acts and, most importantly, the property that
 * makes the whole design work: the backend and the mobile client reach the *same*
 * verdict because both call `validateForm` from @lesan/form-engine. A divergence
 * would let an officer fill in a form the server then rejects, so that agreement
 * is asserted explicitly rather than assumed.
 *
 * Also covers `activate`'s structural validation (unique keys, unknown rule ops,
 * missing reference records), the getForPatrol `allowedIds` stripping that keeps
 * option whitelists off the client, and module gating.
 *
 * Run: deno test -A test/form-definition-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, MongoClient, ObjectId } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	collision_type,
	coreApp,
	form_definition,
	getAtcsWithServices,
	organization,
	road,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { applyFormDefinitionMigrations } from "@model";
import { validateDefinitionStructure } from "../src/form_definition/helpers.ts";
import { validateForm } from "@forms";
import type { AnswerTree, FormDefinition } from "@forms";

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

const insertUser = async (
	level: string,
	roles: Array<{
		roleId: string;
		name: string;
		scopeType?: "organization" | "unit";
		scopeId?: string;
	}> = [],
): Promise<ObjectId> => {
	seq++;
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: `خانوادگی${seq}`,
			mobile: `0915${String(10000000 + seq)}`,
			gender: "Male",
			email: `form_${RUN}_${seq}@test.local`,
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
			// `code` is required and uniquely indexed on organization, so two test
			// organizations cannot both leave it null.
			code: `FD${RUN}-${seq}`,
			name,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { registrer: { _ids: await insertUser("Editor") } },
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let ghostId: ObjectId;
let managerId: ObjectId;
let patrolId: ObjectId;
let orgA: ObjectId;
let collisionId: ObjectId;

const FORM_GET: Document = {
	_id: 1,
	name: 1,
	status: 1,
	version: 1,
	form_kind: 1,
	icon: 1,
	schema_version: 1,
	definition: 1,
	organization: { _id: 1, name: 1 },
};

/**
 * A miniature QA-shaped definition: a conditional page, a nested repeatable with
 * its own nested repeatable, a reference field, and a cross-item warning.
 */
const qaDefinition: FormDefinition = {
	schemaVersion: 1,
	name: "گزارش تصادف",
	pages: [
		{
			key: "scene",
			title: "وضعیت صحنه",
			order: 1,
			sections: [{
				key: "sceneSection",
				title: "وضعیت",
				order: 1,
				nodes: [
					{
						kind: "field",
						key: "severity",
						type: "choice_group",
						label: "شدت تصادف",
						order: 1,
						requiredWhen: { op: "always" },
						options: {
							kind: "literal",
							items: [
								{ value: "خسارتی", label: "خسارتی" },
								{ value: "جرحی", label: "جرحی" },
								{
									value: "فوتی در صحنه",
									label: "فوتی در صحنه",
								},
							],
						},
					},
					{
						kind: "field",
						key: "collisionTypeId",
						type: "reference",
						label: "نوع برخورد",
						order: 2,
						options: {
							kind: "reference",
							model: "collision_type",
							allowedIds: [],
						},
						binding: { kind: "relation", path: "collision_type" },
					},
				],
			}],
		},
		{
			key: "damage",
			title: "آسیب تجهیزات راه",
			order: 2,
			// Only collected when the officer confirms damage.
			visibleWhen: { op: "eq", path: "hasDamage", value: "بله" },
			sections: [{
				key: "damageSection",
				title: "آسیب",
				order: 1,
				nodes: [{
					kind: "repeatable",
					key: "damages",
					label: "آسیب",
					order: 1,
					children: [{
						kind: "field",
						key: "type",
						type: "text",
						label: "نوع تجهیزات",
						order: 1,
					}],
				}],
			}],
		},
	],
};

Deno.test("setup fixtures", async () => {
	ghostId = await insertUser("Ghost");
	managerId = await insertUser("Manager");
	orgA = await insertOrg(`سازمان فرم ${RUN}`);
	patrolId = await insertUser("Patrol", [
		{
			roleId: String(orgA),
			name: "Patrol",
			scopeType: "organization",
			scopeId: String(orgA),
		},
	]);

	const collision = await collision_type.insertOne({
		doc: {
			name: `برخورد ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	collisionId = collision!._id as ObjectId;

	const roadRow = await road.insertOne({
		doc: {
			name: `آزادراه ${RUN}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	assertExists(roadRow);

	// Enable every module for this test database. `form_definition.*` is gated
	// behind the new `forms` key, and the test database starts with an empty
	// module set, so without this every form act would be blocked.
	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: {
			modules: MODULE_KEYS.map((key) => ({ key, enabled: true })),
		},
		get: {},
	}, ghostId);
});

// ---------------------------------------------------------------------------
// Pure definition validation (no DB)
// ---------------------------------------------------------------------------

Deno.test("validateDefinitionStructure — accepts a well-formed definition", () => {
	validateDefinitionStructure(qaDefinition);
});

Deno.test("validateDefinitionStructure — rejects a definition with no pages", () => {
	let message = "";
	try {
		validateDefinitionStructure({ schemaVersion: 1, name: "x", pages: [] });
	} catch (error) {
		message = (error as Error).message;
	}
	assert(
		message.includes("صفحه"),
		`expected a page-count error, got: ${message}`,
	);
});

Deno.test("validateDefinitionStructure — rejects duplicate keys", () => {
	let message = "";
	try {
		validateDefinitionStructure({
			schemaVersion: 1,
			name: "x",
			pages: [{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						{
							kind: "field",
							key: "dup",
							type: "text",
							label: "a",
							order: 1,
						},
						{
							kind: "field",
							key: "dup",
							type: "text",
							label: "b",
							order: 2,
						},
					],
				}],
			}],
		});
	} catch (error) {
		message = (error as Error).message;
	}
	assert(
		message.includes("یکتا"),
		`expected a uniqueness error, got: ${message}`,
	);
});

Deno.test("validateDefinitionStructure — rejects an unknown rule operator", () => {
	let message = "";
	try {
		validateDefinitionStructure({
			schemaVersion: 1,
			name: "x",
			pages: [{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [{
						kind: "field",
						key: "f",
						type: "text",
						label: "f",
						order: 1,
						// Deliberately malformed: an operator the engine does not know.
						visibleWhen: { op: "exec" } as never,
					}],
				}],
			}],
		});
	} catch (error) {
		message = (error as Error).message;
	}
	assert(
		message.includes("عملگر"),
		`expected an operator error, got: ${message}`,
	);
});

Deno.test("validateDefinitionStructure — rejects a path op with no path", () => {
	let message = "";
	try {
		validateDefinitionStructure({
			schemaVersion: 1,
			name: "x",
			pages: [{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [{
						kind: "field",
						key: "f",
						type: "text",
						label: "f",
						order: 1,
						requiredWhen: { op: "always" },
						// Deliberately malformed: a path op with no `path`.
						valueFrom: { op: "eq" } as never,
					}],
				}],
			}],
		});
	} catch (error) {
		message = (error as Error).message;
	}
	assert(message.includes("مسیر"), `expected a path error, got: ${message}`);
});

Deno.test("validateDefinitionStructure — accepts nested repeatables", () => {
	validateDefinitionStructure({
		schemaVersion: 1,
		name: "x",
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [{
					kind: "repeatable",
					key: "vehicles",
					label: "وسایل",
					order: 1,
					children: [{
						kind: "repeatable",
						key: "passengers",
						label: "سرنشینان",
						order: 1,
						children: [{
							kind: "field",
							key: "health",
							type: "text",
							label: "h",
							order: 1,
						}],
					}],
				}],
			}],
		}],
	});
});

// ---------------------------------------------------------------------------
// Engine agreement — the property the whole design rests on
// ---------------------------------------------------------------------------

Deno.test("the validate act agrees with local engine evaluation", async () => {
	// Mobile runs `validateForm` offline; the backend must produce the same
	// verdict, or an officer could file something the server rejects.
	const answers: AnswerTree = {
		severity: "جرحی",
		collisionTypeId: String(collisionId),
	};
	const local = validateForm(qaDefinition, answers);

	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `تطبیق موتور ${RUN}`,
			definition: qaDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId);

	const remote = await runAct("form_definition", "validate", {
		set: {
			_id: (created as { _id: ObjectId })._id.toString(),
			answers: answers as Document,
		},
		get: {},
	}, managerId) as {
		errors: unknown[];
		warnings: unknown[];
		canSubmit: boolean;
	};

	assertEquals(remote.errors.length, local.errors.length);
	assertEquals(remote.warnings.length, local.warnings.length);
	assertEquals(remote.canSubmit, local.errors.length === 0);
});

Deno.test("the validate act blocks an incomplete report", async () => {
	const local = validateForm(qaDefinition, {});
	assert(
		local.errors.length > 0,
		"an empty report should not be submittable",
	);

	const remote = await runAct("form_definition", "validate", {
		set: {
			_id: (await firstDefinitionId()).toString(),
			answers: {},
		},
		get: {},
	}, managerId) as { errors: unknown[]; canSubmit: boolean };

	assert(remote.errors.length > 0, "server must also refuse");
	assertEquals(remote.canSubmit, false);
});

Deno.test("the validate act narrows to a single page", async () => {
	const remote = await runAct("form_definition", "validate", {
		set: {
			_id: (await firstDefinitionId()).toString(),
			answers: { hasDamage: "خیر" },
			pageKey: "scene",
		},
		get: {},
	}, managerId) as { errors: unknown[]; blockedPages: string[] };

	// The missing `severity` belongs to the scene page; blockedPages must name
	// only the page that was asked about.
	assertEquals(remote.blockedPages, ["scene"]);
});

/**
 * A definition with no accident-only bindings, used by the tests that exercise
 * the `incident_report` kind.
 *
 * The QA definition binds `collision_type`, which belongs to the accident model,
 * so `activate` correctly refuses it for a road-damage form. That rejection is
 * the point of the binding check, so tests about kind coexistence need a
 * definition that is genuinely valid for the other kind.
 */
const plainDefinition: FormDefinition = {
	schemaVersion: 1,
	name: "فرم عمومی",
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
				key: "description",
				type: "textarea",
				label: "شرح رخداد",
				order: 1,
				requiredWhen: { op: "always" },
				binding: { kind: "pure", path: "description" },
			}],
		}],
	}],
};

const firstDefinitionId = async (): Promise<ObjectId> => {
	const rows = await form_definition
		.find({
			filters: { "organization._id": new ObjectId(orgA) },
			projection: { _id: 1 },
		})
		.toArray();
	return (rows[0] as unknown as { _id: ObjectId })._id;
};

// ---------------------------------------------------------------------------
// CRUD + activate
// ---------------------------------------------------------------------------

Deno.test("form_definition — add, get, gets, count", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم اصلی ${RUN}`,
			description: "توضیح",
			form_kind: "accident",
			definition: qaDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as {
		_id: ObjectId;
		name: string;
		status: string;
		version: number;
	};

	assertEquals(created.name, `فرم اصلی ${RUN}`);
	assertEquals(created.status, "draft");
	assertEquals(created.version, 1);

	const list = await runAct("form_definition", "gets", {
		set: { organizationId: String(orgA), page: 1, limit: 50 },
		get: FORM_GET,
	}, managerId) as unknown[];
	assert(list.length >= 2, "both definitions should be listed");

	const counted = await runAct("form_definition", "count", {
		set: { organizationId: String(orgA) },
		get: {},
	}, managerId) as { qty: number };
	assert(counted.qty >= 2, "count should match");
});

Deno.test("form_definition — update replaces the definition wholesale", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم قابل ویرایش ${RUN}`,
			definition: qaDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };

	const trimmed: FormDefinition = {
		schemaVersion: 1,
		name: "x",
		pages: [{
			key: "only",
			title: "تنها",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [{
					kind: "field",
					key: "one",
					type: "text",
					label: "یک",
					order: 1,
				}],
			}],
		}],
	};

	const updated = await runAct("form_definition", "update", {
		set: {
			_id: created._id.toString(),
			definition: trimmed as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { definition: FormDefinition };

	// The deleted pages must actually be gone — a deep merge would keep them.
	assertEquals(updated.definition.pages.length, 1);
	assertEquals(updated.definition.pages[0].key, "only");
});

Deno.test("form_definition — activate bumps the version and rejects double activation", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم فعال ${RUN}`,
			form_kind: "incident_report",
			definition: plainDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId; version: number };

	const activated = await runAct("form_definition", "activate", {
		set: { _id: created._id.toString() },
		get: {},
	}, managerId) as { status: string; version: number; message: string };

	assertEquals(activated.status, "active");
	assertEquals(activated.version, created.version + 1);
	assert(
		activated.message.includes("نسخه"),
		"message should name the version",
	);

	let secondError = "";
	try {
		await runAct("form_definition", "activate", {
			set: { _id: created._id.toString() },
			get: {},
		}, managerId);
	} catch (error) {
		secondError = (error as Error).message;
	}
	assert(
		secondError.includes("از قبل فعال"),
		`expected an already-active error, got: ${secondError}`,
	);
});

Deno.test("form_definition — activate refuses a structurally invalid definition", async () => {
	const broken: FormDefinition = {
		schemaVersion: 1,
		name: "broken",
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [
					{
						kind: "field",
						key: "a",
						type: "text",
						label: "a",
						order: 1,
					},
					{
						kind: "field",
						key: "a",
						type: "text",
						label: "b",
						order: 2,
					},
				],
			}],
		}],
	};

	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم خراب ${RUN}`,
			definition: broken as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };

	let error = "";
	try {
		await runAct("form_definition", "activate", {
			set: { _id: created._id.toString() },
			get: {},
		}, managerId);
	} catch (e) {
		error = (e as Error).message;
	}
	assert(
		error.includes("یکتا"),
		`expected a duplicate-key error, got: ${error}`,
	);

	const stillDraft = await form_definition.findOne({
		filters: { _id: created._id },
		projection: { status: 1 },
	});
	assertEquals(
		(stillDraft as unknown as { status: string }).status,
		"draft",
		"a rejected definition must stay a draft",
	);
});

Deno.test("form_definition — an active definition cannot be edited or removed", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم قفل ${RUN}`,
			form_kind: "incident_report",
			definition: plainDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };

	await runAct("form_definition", "activate", {
		set: { _id: created._id.toString() },
		get: {},
	}, managerId);

	for (
		const [actName, set] of [
			["update", { _id: created._id.toString(), name: "تغییر" }],
			["remove", { _id: created._id.toString() }],
		] as const
	) {
		let error = "";
		try {
			await runAct(
				"form_definition",
				actName,
				{ set, get: {} },
				managerId,
			);
		} catch (e) {
			error = (e as Error).message;
		}
		assert(
			error.includes("فعال"),
			`${actName} should refuse an active definition, got: ${error}`,
		);
	}
});

Deno.test("form_definition — duplicate produces an independent draft", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم مبدأ ${RUN}`,
			definition: qaDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };

	const clone = await runAct("form_definition", "duplicate", {
		set: { _id: created._id.toString() },
		get: FORM_GET,
	}, managerId) as { _id: ObjectId; name: string; status: string };

	assert(clone.name.includes("کپی"), "clone name should be marked as a copy");
	assertEquals(clone.status, "draft");
	assert(
		clone._id.toString() !== created._id.toString(),
		"clone has its own id",
	);
});

// ---------------------------------------------------------------------------
// getForPatrol — the runtime path
// ---------------------------------------------------------------------------

Deno.test("form_definition.getForPatrol — resolves reference options and strips allowedIds", async () => {
	const created = await runAct("form_definition", "add", {
		set: {
			organizationId: String(orgA),
			name: `فرم مأمور ${RUN}`,
			form_kind: "accident",
			definition: qaDefinition as unknown as Document,
		},
		get: FORM_GET,
	}, managerId) as { _id: ObjectId };

	await runAct("form_definition", "activate", {
		set: { _id: created._id.toString() },
		get: {},
	}, managerId);

	const payload = await runAct("form_definition", "getForPatrol", {
		set: { formKind: "accident" },
		get: { form: 1, options: 1, version: 1 },
	}, patrolId) as {
		form: { definition: FormDefinition; version?: number } | null;
		options: Record<string, Array<{ _id: string; name: string }>>;
		version: { version: number };
	};

	assertExists(payload.form, "an active definition should be returned");
	assertEquals(payload.version.version, 2, "version 1 add + 1 activate");

	// The reference model resolved into real options.
	const options = payload.options.collision_type ?? [];
	assert(options.length >= 1, "collision_type options should be resolved");
	assertEquals(typeof options[0]._id, "string");

	// The whitelist must not reach the client.
	const serialized = JSON.stringify(payload.form.definition);
	assert(
		!serialized.includes("allowedIds"),
		"allowedIds must be stripped from the patrol payload",
	);
});

Deno.test("form_definition.getForPatrol — returns form:null when the org has no active form", async () => {
	// A fresh organization, so this does not depend on what earlier tests activated.
	// Both kinds are live for orgA by this point, and a shared database is the norm
	// here, so isolation has to come from the organization rather than test order.
	const freshOrg = await insertOrg(`سازمان بدون فرم ${RUN}`);
	const freshPatrol = await insertUser("Patrol", [{
		roleId: String(freshOrg),
		name: "Patrol",
		scopeType: "organization",
		scopeId: String(freshOrg),
	}]);

	const payload = await runAct("form_definition", "getForPatrol", {
		set: { formKind: "accident" },
		get: { form: 1, options: 1, version: 1 },
	}, freshPatrol) as { form: unknown };

	// `form: null` is the signal the app uses to fall back to its bundled default
	// form, so an organization must never be left unable to file a report.
	assertEquals(payload.form, null);
});

Deno.test("form_definition.getForPatrol — an active form is not reused across kinds", async () => {
	// Both kinds have an active form for orgA now. Asking for one must never return
	// the other: that is what keeps an org's accident form from being used to file a
	// road-damage report.
	const asAccident = await runAct("form_definition", "getForPatrol", {
		set: { formKind: "accident" },
		get: { form: 1, options: 1, version: 1 },
	}, patrolId) as { form: { form_kind?: string } | null };

	const asReport = await runAct("form_definition", "getForPatrol", {
		set: { formKind: "incident_report" },
		get: { form: 1, options: 1, version: 1 },
	}, patrolId) as { form: { form_kind?: string } | null };

	assertEquals(asAccident.form?.form_kind, "accident");
	assertEquals(asReport.form?.form_kind, "incident_report");
});

Deno.test("form_definition.getForPatrol — a patrol officer with no org is told so", async () => {
	const orphan = await insertUser("Patrol", []);
	let error = "";
	try {
		await runAct("form_definition", "getForPatrol", {
			set: {},
			get: { form: 1, options: 1, version: 1 },
		}, orphan);
	} catch (e) {
		error = (e as Error).message;
	}
	assert(
		error.includes("سازمان مأمور یافت نشد"),
		`expected the org-resolution error, got: ${error}`,
	);
});

Deno.test("form_definition.getReferenceOptions — rejects a model outside the allow-list", async () => {
	let error = "";
	try {
		await runAct("form_definition", "getReferenceOptions", {
			set: { model: "operation_log" },
			get: {},
		}, managerId);
	} catch (e) {
		error = (e as Error).message;
	}
	assert(
		error.includes("معتبر نیست"),
		`expected an allow-list error, got: ${error}`,
	);
});

Deno.test("form_definition.getReferenceOptions — returns name/id pairs", async () => {
	const payload = await runAct("form_definition", "getReferenceOptions", {
		set: { model: "collision_type", limit: "5" },
		get: {},
	}, managerId) as {
		model: string;
		items: Array<{ _id: string; name: string }>;
	};

	assertEquals(payload.model, "collision_type");
	assert(payload.items.length >= 1);
	assert(
		payload.items.every((item) =>
			typeof item._id === "string" && typeof item.name === "string"
		),
	);
});

// ---------------------------------------------------------------------------
// Module gating
// ---------------------------------------------------------------------------

Deno.test("form_definition acts are gated behind the forms module", async () => {
	const { MSG_MODULE_DEPLOY_DISABLED, MODULE_KEYS } = await import(
		"../src/app_modules/constants.ts"
	);

	assert(MODULE_KEYS.includes("forms"), "the forms module key must exist");

	// Setup turned every module on, so turn `forms` back off to prove the gate
	// actually wraps these acts. Ghost is exempt from the gate, which is why
	// `setModules` still succeeds here.
	await runAct("app_modules", "setModules", {
		set: {
			modules: MODULE_KEYS.map((key) => ({
				key,
				enabled: key !== "forms",
			})),
		},
		get: {},
	}, ghostId);

	const services = getAtcsWithServices().main as Record<
		string,
		Record<string, { fn: (b: unknown) => Promise<unknown> }>
	>;

	// Go through `runAct` so `preAct` populates context.user: the gate exempts
	// Ghost, and a raw `fn` call would reuse whatever context was left behind.
	let message = "";
	try {
		await runAct(
			"form_definition",
			"get",
			{
				set: { _id: "000000000000000000000000" },
				get: { _id: 1, name: 1 },
			},
			managerId,
		);
	} catch (e) {
		message = (e as Error).message;
	}
	assertEquals(message, MSG_MODULE_DEPLOY_DISABLED);

	// Core acts must stay open: licensing the form engine cannot break reports.
	let coreError = "";
	try {
		await runAct(
			"accident",
			"get",
			{ set: { _id: "000000000000000000000000" }, get: { _id: 1 } },
			managerId,
		);
	} catch (e) {
		coreError = (e as Error).message;
	}
	assert(
		!coreError.includes(MSG_MODULE_DEPLOY_DISABLED),
		`accident.get must not be gated, got: ${coreError}`,
	);

	// Restore so the cleanup test and any later run are unaffected.
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The pre-split index migration
// ---------------------------------------------------------------------------

/** A valid organization document: `code` is required and uniquely indexed. */
const insertProbeOrg = async (suffix: string) =>
	await organization.insertOne({
		doc: {
			code: `SPLIT${RUN}-${suffix}`,
			name: `split-probe-${suffix}`,
			description: "",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});

const insertProbeForm = async (
	orgId: ObjectId,
	name: string,
	kind: "accident" | "incident_report",
) => await form_definition.insertOne({
	doc: { name, form_kind: kind, status: "active" },
	relations: { organization: { _ids: orgId } },
	projection: { _id: 1 },
});

/**
 * Recreate the index the model used before the accident/incident_report split.
 *
 * A test that merely asserts "ten forms can exist" cannot catch this regression:
 * every suite drops its database, so the stale index is never present in the
 * first place. It has to be recreated deliberately, and the collection emptied
 * first, because building a unique index over documents that already violate it
 * fails outright.
 */
const recreatePreSplitIndex = async () => {
	await coreApp.odm.getCollection("form_definition").deleteMany({});
	await coreApp.odm.getCollection("form_definition").createIndex(
		{ "organization._id": 1, incident_type: 1 },
		{
			unique: true,
			partialFilterExpression: { status: "active" },
			name: "organization._id_1_incident_type_1",
		},
	);
};

Deno.test("form_definition — the pre-split index caps an org at one active form", async () => {
	await recreatePreSplitIndex();

	const org = await insertProbeOrg("before");
	assertExists(org);
	const orgId = org._id as unknown as ObjectId;

	// First active form succeeds...
	await insertProbeForm(orgId, "first", "incident_report");

	// ...and the second collides on the null `incident_type` key. Nothing here
	// should be unique per *kind*: an organization may hold many report forms.
	let rejected = false;
	try {
		await insertProbeForm(orgId, "second", "incident_report");
	} catch {
		rejected = true;
	}
	assert(
		rejected,
		"the pre-split index should reject the second active form; if this " +
			"fails the index was not recreated and the test proves nothing",
	);
});

Deno.test("form_definition — migration retires the pre-split index and unblocks many forms", async () => {
	await recreatePreSplitIndex();
	await applyFormDefinitionMigrations();

	const indexes = await coreApp.odm.getCollection("form_definition")
		.indexes();
	assert(
		!indexes.some((index) =>
			index.name === "organization._id_1_incident_type_1"
		),
		"the pre-split index should be gone after the migration",
	);

	const org = await insertProbeOrg("after");
	assertExists(org);
	const orgId = org._id as unknown as ObjectId;

	// The product requirement: an organization may hold ten report forms.
	let inserted = 0;
	for (let index = 0; index < 10; index++) {
		await insertProbeForm(orgId, `report-${index}`, "incident_report");
		inserted++;
	}
	assertEquals(
		inserted,
		10,
		"ten active report forms must coexist for one organization",
	);

	// An accident form coexists with all ten report forms...
	await insertProbeForm(orgId, "accident", "accident");

	// ...but a second active accident form is still rejected, because the rule
	// moved to a different index rather than being dropped along with the old one.
	let secondAccidentRejected = false;
	try {
		await insertProbeForm(orgId, "accident-2", "accident");
	} catch {
		secondAccidentRejected = true;
	}
	assert(
		secondAccidentRejected,
		"a second active accident form must still be rejected",
	);
});

Deno.test("cleanup test database", async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(TEST_DB);
	const collections = await db.listCollections().toArray();
	for (const c of collections) await db.collection(c.name).drop();
	await client.close();
});
