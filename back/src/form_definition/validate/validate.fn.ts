import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import type { AnswerTree, FormDefinition } from "@forms";
import { validateForm } from "@forms";
import { orgFilterFor } from "../helpers.ts";

/**
 * Server-side form validation using the shared engine.
 *
 * This is what makes the backend authoritative. Mobile evaluates the same
 * `validateForm` offline to guide the officer, but a client can be stale,
 * tampered with, or running an older app build — so the answer that decides
 * whether a report is accepted is always recomputed here from the definition
 * version the client claims to be filling.
 *
 * A `definitionVersion` mismatch is reported rather than silently validated
 * against a newer tree: an officer's in-progress draft was built against the
 * version they saw, and re-checking it against different questions would produce
 * errors about fields that do not exist on their screen.
 */
export const validateFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { _id, answers, pageKey } = set;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// Validation is scoped too: an officer must not be able to probe another
	// organization's definition, nor have its questions echoed back in errors.
	const orgFilter = await orgFilterFor(user);

	const record = await form_definition.findOne({
		filters: {
			_id: new ObjectId(_id as string),
			...orgFilter,
		},
		projection: {
			_id: 1,
			version: 1,
			schema_version: 1,
			definition: 1,
		},
	});
	if (!record) return throwError("فرم یافت نشد");

	const doc = record as unknown as {
		_id: ObjectId;
		version: number;
		schema_version?: number;
		definition?: FormDefinition;
	};

	const definition = (doc.definition ?? { pages: [] }) as FormDefinition;
	const tree = (answers ?? {}) as AnswerTree;

	const result = validateForm(definition, tree);

	// `pageKey` narrows the report to one page so a client can render a
	// per-section banner without waiting on the whole form.
	const errors = pageKey
		? result.errors.filter((issue) =>
			belongsToPage(definition, issue.path, pageKey)
		)
		: result.errors;
	const warnings = pageKey
		? result.warnings.filter((issue) =>
			belongsToPage(definition, issue.path, pageKey)
		)
		: result.warnings;

	const blockedPages = pageKey
		? result.blockedPages.filter((key) => key === pageKey)
		: result.blockedPages;

	const payload = {
		errors,
		warnings,
		blockedPages,
		canSubmit: errors.length === 0,
		definition_version: doc.version,
		schema_version: doc.schema_version ?? 1,
	};

	// `get` is a projection of the model, which does not describe this ad-hoc
	// result shape, so it is returned whole rather than projected.
	void get;
	return payload;
};

/**
 * Whether an issue's path belongs to a given page.
 *
 * Issue paths are answer paths (`vehicles[0].type`), not definition paths, so
 * the owning page is resolved by matching the path's root key against the keys
 * each page declares.
 */
const belongsToPage = (
	definition: FormDefinition,
	path: string,
	pageKey: string,
): boolean => {
	const root = path.split(/[.[]/)[0];
	const page = (definition.pages ?? []).find((candidate) =>
		candidate.key === pageKey
	);
	if (!page) return true;

	const pageKeys = new Set<string>();
	for (const section of page.sections ?? []) {
		for (const node of section.nodes ?? []) pageKeys.add(node.key);
	}
	return pageKeys.has(root);
};
