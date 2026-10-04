import { type ActFn, ObjectId } from "@deps";
import * as models from "../../../mod.ts";
import { coreApp, form_definition, unit } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import type { FormDefinition } from "@forms";
import {
	collectReferenceModels,
	getReferenceModel,
	resolveUserOrgId,
} from "../helpers.ts";

/** Hard cap on options per reference model, mirroring the legacy `getForPatrol`. */
const OPTION_LIMIT = 500;

const PROJECTION = {
	_id: 1,
	name: 1,
	description: 1,
	status: 1,
	version: 1,
	form_kind: 1,
	icon: 1,
	schema_version: 1,
	definition: 1,
};

type ReferenceOption = { _id: string; name: string };

/**
 * Resolve every `reference` option source in the definition into
 * `{ model: [{ _id, name }] }`, honouring each field's `allowedIds` whitelist.
 *
 * Doing this server-side is deliberate. The legacy `getForPatrol` stripped
 * `allowed_answer_ids` from its response so a client could not read the
 * whitelist; the same applies here — a narrowed option list has to be computed
 * where the model can be queried, because the officer's device may be offline
 * and cannot enumerate a reference model at all.
 */
const resolveReferenceOptions = async (
	definition: FormDefinition,
): Promise<Record<string, ReferenceOption[]>> => {
	const modelNames = collectReferenceModels(definition);
	const options: Record<string, ReferenceOption[]> = {};
	if (modelNames.length === 0) return options;

	// One query per model, so a form referencing the same model twice is free.
	await Promise.all(
		modelNames.map(async (model) => {
			const target = getReferenceModel(models, model);
			if (!target) return;
			const rows = await target
				.find({
					filters: {},
					projection: { _id: 1, name: 1 },
				})
				.sort({ name: 1 })
				.limit(OPTION_LIMIT)
				.toArray();
			options[model] = (rows as Array<{ _id: ObjectId; name: string }>)
				.map((row) => ({ _id: row._id.toString(), name: row.name }));
		}),
	);

	return options;
};

/**
 * Hand the mobile client an active definition plus the option lists its
 * `reference` fields need.
 *
 * `allowedIds` whitelists are stripped from the returned definition: a client
 * must not be able to enumerate which subset of a reference model is in play.
 * The narrowed list it receives in `options` is the only view it gets.
 */
export const getForPatrolFn: ActFn = async (body) => {
	const { set } = body.details;
	const { formKind, orgId, definitionId } = set;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// --- resolve the caller's organization ---
	let targetOrgId: string | null = null;

	if (user.level === "Ghost" || user.level === "Manager") {
		if (!orgId) return throwError("سازمان مورد نظر مشخص نشده است");
		targetOrgId = orgId as string;
	} else {
		for (const role of user.roles ?? []) {
			if (role.scopeType === "organization" && role.scopeId) {
				targetOrgId = role.scopeId as string;
				break;
			}
		}
		if (!targetOrgId) {
			const unitRole = (user.roles ?? []).find(
				(role) => role.scopeType === "unit" && role.scopeId,
			);
			if (unitRole?.scopeId) {
				const unitDoc = await unit.findOne({
					filters: { _id: new ObjectId(unitRole.scopeId as string) },
					projection: { "organization._id": 1 },
				});
				const resolved = (unitDoc as unknown as {
					organization?: { _id?: ObjectId };
				})?.organization?._id;
				targetOrgId = resolved ? resolved.toString() : null;
			}
		}
		if (!targetOrgId) {
			targetOrgId = await resolveUserOrgId(user._id);
		}
	}

	if (!targetOrgId) {
		return throwError(
			"سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید",
		);
	}

	// --- resolve the definition ---
	const orgFilter = { "organization._id": new ObjectId(targetOrgId) };

	// An explicit definitionId lets the builder preview a draft that is not yet
	// active; otherwise the org's active definition for this incident type wins.
	if (definitionId) {
		const draft = await form_definition.findOne({
			filters: {
				_id: new ObjectId(definitionId as string),
				...orgFilter,
			},
			projection: PROJECTION,
		});
		if (!draft) return throwError("فرم یافت نشد");
		return await respond(draft);
	}

	const filters: Record<string, unknown> = {
		...orgFilter,
		status: "active",
	};
	if (formKind) {
		// A document with no `form_kind` predates the field, and the model defaults
		// that to accident — so an accident lookup must still match it. `null`
		// covers both an explicit null and a missing key in a unique-sparse style
		// comparison, which is what Mongo treats them as for this purpose.
		filters.form_kind = { $in: [formKind, null] };
	}

	// Newest first so a caller that omits `formKind` still gets a stable answer
	// instead of whichever document the scan happens to surface.
	const active = await form_definition
		.findOne({
			filters,
			projection: PROJECTION,
			options: { sort: { _id: -1 } },
		});

	if (!active) return { form: null, options: {}, version: { version: 0 } };

	return await respond(active);
};

const respond = async (record: unknown) => {
	const doc = record as {
		_id: ObjectId;
		name: string;
		description?: string;
		version: number;
		schema_version: number;
		form_kind?: string;
		icon?: string;
		definition: FormDefinition;
	};

	const options = await resolveReferenceOptions(
		doc.definition ?? { pages: [] },
	);

	// A deep clone before stripping: the ODM may hand back the cached document.
	const definition = JSON.parse(
		JSON.stringify(doc.definition ?? { pages: [] }),
	) as FormDefinition;
	stripWhitelists(definition);

	return {
		form: {
			_id: doc._id.toString(),
			name: doc.name,
			...(doc.description && { description: doc.description }),
			form_kind: doc.form_kind ?? "accident",
			...(doc.icon && { icon: doc.icon }),
			schema_version: doc.schema_version ?? 1,
			definition,
		},
		options,
		version: { version: doc.version },
	};
};

/** Remove `allowedIds` from every reference option source, in place. */
const stripWhitelists = (definition: FormDefinition): void => {
	const visit = (nodes: unknown[] | undefined) => {
		if (!Array.isArray(nodes)) return;
		for (const raw of nodes) {
			if (typeof raw !== "object" || raw === null) continue;
			const node = raw as Record<string, unknown>;
			const options = node.options as Record<string, unknown> | undefined;
			if (options?.kind === "reference") delete options.allowedIds;
			visit(node.children as unknown[] | undefined);
		}
	};
	for (const page of definition.pages ?? []) {
		for (const section of page.sections ?? []) visit(section.nodes);
	}
};
