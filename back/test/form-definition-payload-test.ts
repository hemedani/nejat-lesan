/**
 * Client payload contracts for the `form_definition` acts.
 *
 * Why this file exists: `form-definition-test.ts` calls `act.fn(body)` directly,
 * which skips the validator — so every one of its payloads was checked against
 * the *handler*, never against the schema the server actually enforces. That gap
 * let five acts ship with a `get` block that declared the *response* type
 * (`object({})`, `string()`) instead of the codebase idiom `enums([0, 1])`.
 *
 * Both clients send the idiomatic `1`, so opening a form on mobile failed with:
 *
 *     At path: get.form -- Expected an object, but received: 1
 *
 * The payloads below are transcribed from the real call sites. They are asserted
 * against `act.validator` — the same object `serveLesan.ts` passes to
 * `assert`/`create` — so a validator that drifts from a client fails here rather
 * than on an officer's device.
 *
 * Run: deno test -A test/form-definition-payload-test.ts
 */

import "./patrol_ops_env.ts";
import { assert, assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { assert as structAssert, create as structCreate, type Document } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import { getAtcsWithServices } from "../mod.ts";

/** A well-formed 24-hex id, so `objectIdValidation` is satisfied. */
const ID = "507f1f77bcf86cd799439011";

/**
 * Validate exactly the way `serveLesan.ts` does, so this test cannot pass while
 * a real request would fail.
 */
const assertPayload = (
	schema: string,
	actName: string,
	details: { set: Document; get: Document },
) => {
	const act = getAtcsWithServices().main[schema]?.[actName] as
		| { validator: unknown; validationRunType?: string }
		| undefined;
	assert(act, `act ${schema}.${actName} is not registered`);
	if (act.validationRunType === "create") {
		structCreate(details, act.validator as never);
	} else {
		structAssert(details, act.validator as never);
	}
};

type ClientCall = {
	/** Which client makes the call. */
	client: "mobile" | "front";
	/** The call site, so drift is traceable to a file. */
	where: string;
	act: string;
	details: { set: Document; get: Document };
};

/**
 * Every payload a client sends to a `form_definition` act that is NOT a plain
 * `selectStruct` projection — i.e. the ones where a hand-written `get` can drift.
 */
const CLIENT_CALLS: ClientCall[] = [
	{
		client: "mobile",
		where: "mobile/src/api/form-definition.ts · fetchPatrolForm",
		act: "getForPatrol",
		details: {
			set: { formKind: "accident" },
			get: { form: 1, options: 1, version: 1 },
		},
	},
	{
		client: "mobile",
		where: "mobile/src/api/form-definition.ts · fetchPatrolFormById",
		act: "getForPatrol",
		details: {
			set: { definitionId: ID },
			get: { form: 1, options: 1, version: 1 },
		},
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/getForPatrol.ts",
		act: "getForPatrol",
		details: {
			set: { formKind: "accident" },
			get: { form: 1, options: 1, version: 1 },
		},
	},
	{
		client: "mobile",
		where: "mobile/src/api/form-definition.ts · fetchPatrolForms",
		act: "gets",
		details: {
			set: { page: 1, limit: 100, status: "active", form_kind: "accident" },
			get: { _id: 1, name: 1, description: 1, form_kind: 1, icon: 1 },
		},
	},
	{
		client: "mobile",
		where: "mobile/src/api/form-definition.ts · validateFormAnswers",
		act: "validate",
		details: { set: { _id: ID, answers: {} }, get: {} },
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/activate.ts",
		act: "activate",
		details: {
			set: { _id: ID },
			get: { success: 1, version: 1, status: 1, message: 1 },
		},
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/getReferenceModels.ts",
		act: "getReferenceModels",
		details: { set: {}, get: { models: 1 } },
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/getReferenceOptions.ts",
		act: "getReferenceOptions",
		details: { set: { model: "collision_type" }, get: { model: 1, items: 1 } },
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/getBindableRelations.ts",
		act: "getBindableRelations",
		details: { set: {}, get: { formKind: 1, relations: 1 } },
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/count.ts",
		act: "count",
		details: { set: {}, get: { qty: 1 } },
	},
	{
		client: "front",
		where: "front/src/app/actions/form_definition/remove.ts",
		act: "remove",
		details: { set: { _id: ID }, get: { success: 1 } },
	},
];

for (const call of CLIENT_CALLS) {
	Deno.test(`payload: ${call.client} ${call.act} (${call.where})`, () => {
		assertPayload("form_definition", call.act, call.details);
	});
}

/**
 * The regression itself.
 *
 * A `get` field declared as `object({})` / `string()` rejects the `1` that both
 * clients send. This asserts the *shape of the contract* rather than a single
 * call, so re-introducing a response-type declaration fails loudly here.
 */
Deno.test("contract: `get` is a want-marker, so every field accepts 0 and 1", () => {
	const markerFields: Array<{ act: string; fields: string[] }> = [
		{ act: "getForPatrol", fields: ["form", "options", "version"] },
		{ act: "activate", fields: ["success", "version", "status", "message"] },
		{ act: "getReferenceModels", fields: ["models"] },
		{ act: "getReferenceOptions", fields: ["model", "items"] },
		{ act: "getBindableRelations", fields: ["formKind", "relations"] },
		{ act: "validate", fields: ["errors", "warnings", "blockedPages", "canSubmit"] },
	];

	// `set` shapes that satisfy each act, so the failure under test is the `get`.
	const setFor: Record<string, Document> = {
		getForPatrol: {},
		activate: { _id: ID },
		getReferenceModels: {},
		getReferenceOptions: { model: "collision_type" },
		getBindableRelations: {},
		validate: { _id: ID, answers: {} },
	};

	for (const { act, fields } of markerFields) {
		for (const field of fields) {
			for (const value of [0, 1]) {
				assertPayload("form_definition", act, {
					set: setFor[act],
					get: { [field]: value },
				});
			}
		}
	}
});

/**
 * The failure that was reported, kept as an executable record of the bug.
 *
 * `get: { form: {} }` is what the *old* validator demanded; the new one rejects
 * it. Asserting the rejection documents the direction of the fix, so nobody
 * "fixes" a future client by sending objects again.
 */
Deno.test("contract: the old response-typed payload is now rejected", () => {
	let message = "";
	try {
		assertPayload("form_definition", "getForPatrol", {
			set: {},
			get: { form: {}, options: {}, version: {} },
		});
	} catch (error) {
		message = (error as Error).message;
	}
	assert(
		message.includes("get.form"),
		`expected a get.form rejection, got: ${message}`,
	);
	assertEquals(
		message.includes("Expected an object"),
		false,
		"the reported error must not be reproducible",
	);
});
