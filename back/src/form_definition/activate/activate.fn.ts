import { type ActFn, ObjectId } from "@deps";
import * as models from "../../../mod.ts";
import { coreApp, form_definition } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";
import { type FormDefinition } from "@forms";
import {
	checkBindings,
	checkIcons,
	checkReferenceModels,
	validateDefinitionStructure,
} from "../helpers.ts";

/** Normalise a stored definition into the shape the shared engine expects. */
const withDefaults = (definition?: FormDefinition): FormDefinition => ({
	schemaVersion: definition?.schemaVersion ?? 1,
	name: definition?.name ?? "",
	pages: definition?.pages ?? [],
});

/**
 * Publish a definition for field use.
 *
 * This is the gate between "the builder saved a draft" and "an officer can be
 * asked these questions". It is the only place a definition's *semantics* are
 * checked, so it re-runs the shared engine's structural rules here rather than
 * trusting the web builder — the builder is a convenience, not the authority.
 */
export const activateFn: ActFn = async (body) => {
	const { set: { _id } } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const record = await form_definition.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			status: 1,
			version: 1,
			form_kind: 1,
			icon: 1,
			definition: 1,
			"organization._id": 1,
		},
	});
	if (!record) return throwError("فرم یافت نشد");

	const form = record as unknown as {
		status: string;
		version: number;
		form_kind?: string;
		icon?: string;
		definition?: FormDefinition;
		organization?: { _id?: ObjectId };
	};

	if (form.status === "active") return throwError("فرم از قبل فعال است");

	const orgId = form.organization?._id;
	if (!orgId) return throwError("فرم سازمان معتبری ندارد");
	await assertOrgInActorScope(user, orgId.toString());

	// Structure first: a broken rule tree is worth reporting before a database
	// round-trip for every reference model.
	// The stored tree omits `schemaVersion`/`name` (both optional on the model,
	// mirrored by the model's own defaults), so they are filled in here.
	const definition = withDefaults(form.definition);
	try {
		validateDefinitionStructure(definition);
	} catch (error) {
		return throwError((error as Error).message);
	}

	// Then the reference sources: a field pointing at a model with no records
	// would render an empty dropdown in the field.
	const modelErrors = await checkReferenceModels(definition, models);
	if (modelErrors.length > 0) return throwError(modelErrors[0]);

	// Icons render as nothing on a device if the name is unknown, and an icon the
	// web app can draw but the phone cannot is worse than no icon at all.
	const iconErrors = checkIcons(definition, form.icon);
	if (iconErrors.length > 0) return throwError(iconErrors[0]);

	// A binding that names a relation the target model does not have would be
	// dropped silently on submit. Catching it here means the author finds out at
	// publish time rather than an officer loses the answer.
	const kind = (form.form_kind ?? "accident") as string;
	const bindingErrors = await checkBindings(definition, kind);
	if (bindingErrors.length > 0) return throwError(bindingErrors[0]);

	// One active accident definition per organization; for the other kind, many
	// may be active at once so nothing is archived.
	//
	// Accident also clears an active document whose `form_kind` is absent: that
	// document predates the field and means accident, so leaving it live would
	// give the organization two live accident forms. That does NOT trip the
	// partial index — its `partialFilterExpression` requires `form_kind:"accident"`,
	// so a null-kind document is excluded from the index entirely. The real
	// reason is `getForPatrol`, which matches `{$in: [kind, null]}` and would then
	// return one of the two live accident forms — deterministically, but
	// arbitrarily as to which: it sorts `{_id: -1}`, so the newer form wins for
	// reasons of insertion order rather than because it is the right one.
	//
	// Only `form_kind === "accident"` enforces a singleton, so only it archives
	// anything. A `{$ne: kind}` filter here looks equivalent but is not: it
	// matches every active form whose kind is *something else*, so it archived in
	// both directions — activating a report form killed the live accident form,
	// and activating an accident form killed the live report forms. Report forms
	// are unbounded (see the model doc), so they archive nothing at all.
	const existingActives = kind === "accident"
		? await form_definition
			.find({
				filters: {
					"organization._id": orgId,
					_id: { $ne: new ObjectId(_id as string) },
					status: "active",
					form_kind: { $in: ["accident", null] },
				},
				projection: { _id: 1 },
			})
			.toArray()
		: [];
	for (
		const previous of existingActives as unknown as Array<{ _id: ObjectId }>
	) {
		await form_definition.findOneAndUpdate({
			filter: { _id: previous._id },
			update: {
				$set: {
					status: "archived",
					updatedAt: new Date(),
				},
			},
			projection: { _id: 1 },
		});
	}

	const now = new Date();
	const nextVersion = (form.version ?? 1) + 1;
	const updated = await form_definition.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: {
				status: "active",
				version: nextVersion,
				updatedAt: now,
			},
		},
		projection: { _id: 1, status: 1, version: 1 },
	});

	const updatedDoc = updated as unknown as {
		status?: string;
		version?: number;
	} | null;

	return {
		success: true,
		status: updatedDoc?.status,
		version: updatedDoc?.version,
		message: `فرم فعال شد (نسخه ${nextVersion})`,
	};
};
