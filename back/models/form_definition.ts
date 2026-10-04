import { coreApp } from "../mod.ts";
import {
	any as anyStruct,
	array,
	boolean,
	defaulted,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	record,
	refine,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const form_definition_status_array = [
	"draft",
	"active",
	"archived",
] as const;
export const form_definition_status_emums = enums(form_definition_status_array);

/**
 * Bumped when the node-tree shape changes incompatibly. Mobile keeps a cached
 * definition and refuses to render one it does not understand rather than showing
 * a half-correct form.
 */
export const FORM_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Rule tree — mirrors the `Rule` union in @lesan/form-engine
// ---------------------------------------------------------------------------

/**
 * `rules`/`rule`/`value` are typed loosely on purpose. A rule's `value` is
 * genuinely heterogeneous (string, number, boolean, array) depending on the op,
 * and `rules` recurses. The *semantics* of a rule — valid op, resolvable paths,
 * known field keys — are checked in `activate`, which produces Persian messages
 * an org admin can act on; a rigid struct check here would only reject the shape.
 */
export const form_rule_struct = object({
	op: string(),
	rules: optional(array(record(string(), anyStruct()))),
	rule: optional(record(string(), anyStruct())),
	path: optional(string()),
	value: optional(anyStruct()),
	gte: optional(number()),
	lte: optional(number()),
});

// ---------------------------------------------------------------------------
// Options, bindings, validation
// ---------------------------------------------------------------------------

export const form_option_item_struct = object({
	value: string(),
	label: string(),
	tone: optional(enums(["normal", "warn", "danger"])),
	recommended: optional(boolean()),
	symbol: optional(string()),
});

export const form_option_source_struct = object({
	kind: enums(["literal", "reference", "derived"]),
	items: optional(array(form_option_item_struct)),
	// reference source: any Lesan model exposing `{ _id, name }`
	model: optional(string()),
	allowedIds: optional(array(objectIdValidation)),
	rule: optional(form_rule_struct),
});

export const form_binding_struct = object({
	kind: enums(["relation", "dto", "pure", "dynamic"]),
	path: optional(string()),
	multi: optional(boolean()),
	dto: optional(string()),
	field: optional(string()),
	from: optional(string()),
});

export const form_warning_struct = object({
	rule: form_rule_struct,
	message: string(),
});

export const form_validation_struct = object({
	min: optional(number()),
	max: optional(number()),
	minLength: optional(number()),
	maxLength: optional(number()),
	pattern: optional(string()),
	message: optional(string()),
	// Advisory cross-item checks: surfaced to the officer, never blocking.
	warnings: optional(array(form_warning_struct)),
});

// ---------------------------------------------------------------------------
// Plate (composite Iranian licence plate)
// ---------------------------------------------------------------------------

export const form_plate_part_struct = object({
	key: string(),
	label: string(),
	kind: enums(["digits", "letters", "text", "select"]),
	length: optional(number()),
	inputMode: optional(enums(["numeric", "text"])),
	items: optional(array(form_option_item_struct)),
});

export const form_plate_variant_struct = object({
	when: form_rule_struct,
	// At least one part: a variant with no parts would render an empty plate
	// control for the officer with nothing to enter.
	parts: refine(
		array(form_plate_part_struct),
		"at_least_one_plate_part",
		(parts) => parts.length > 0,
	),
	notApplicableHint: optional(string()),
});

// ---------------------------------------------------------------------------
// Content nodes — recursive
// ---------------------------------------------------------------------------

/**
 * A node in the definition tree: a field, a group, or a repeatable group.
 *
 * `children` is a `record(string, any)` rather than a recursive struct on
 * purpose. Superstruct cannot express a self-referential `object()` here —
 * building one recurses until the stack overflows, because `entries()` captures
 * the child struct eagerly. So the envelope is validated here and the semantics
 * (unique keys, legal kinds, resolvable rule paths) are validated in `activate`
 * by walking the tree, which is also where Persian, actionable errors come from.
 *
 * `optional()` is used throughout rather than `defaulted()`: `defaulted` only
 * fills defaults under `create()` (the `add` act's `validationRunType`), while
 * `update` runs a plain `assert`, so a defaulted field would validate on add and
 * fail on update with the same document.
 */
export const form_content_node_struct = object({
	kind: enums(["field", "group", "repeatable"]),
	key: string(),
	label: optional(string()),
	order: optional(number()),
	visibleWhen: optional(form_rule_struct),
	requiredWhen: optional(form_rule_struct),
	// field-only. Constrained to the engine's known types: an unrecognised type
	// would render as a blank input in the field, so a typo must fail at
	// authoring time rather than silently produce an unusable question.
	type: optional(enums([
		"text",
		"textarea",
		"number",
		"date",
		"time",
		"datetime",
		"select",
		"multi_select",
		"boolean",
		"choice_group",
		"reference",
		"plate",
		"file",
		"location",
		"computed",
	])),
	description: optional(string()),
	icon: optional(string()),
	placeholder: optional(string()),
	optionalHint: optional(string()),
	defaultValue: optional(anyStruct()),
	options: optional(form_option_source_struct),
	optionsFilter: optional(
		object({
			mode: enums(["all", "static", "dynamic"]),
			values: optional(array(string())),
			rule: optional(form_rule_struct),
		}),
	),
	binding: optional(form_binding_struct),
	clearOnChange: optional(array(string())),
	validation: optional(form_validation_struct),
	valueFrom: optional(form_rule_struct),
	plateVariants: optional(array(form_plate_variant_struct)),
	transient: optional(boolean()),
	// group / repeatable
	minItems: optional(number()),
	maxItems: optional(number()),
	itemLabel: optional(string()),
	itemSummary: optional(string()),
	children: optional(array(record(string(), anyStruct()))),
});

export const form_section_struct = object({
	key: string(),
	title: string(),
	description: optional(string()),
	icon: optional(string()),
	order: optional(number()),
	nodes: optional(array(form_content_node_struct)),
	visibleWhen: optional(form_rule_struct),
	requiredWhen: optional(form_rule_struct),
});

export const form_page_struct = object({
	key: string(),
	title: string(),
	description: optional(string()),
	icon: optional(string()),
	order: optional(number()),
	sections: optional(array(form_section_struct)),
	visibleWhen: optional(form_rule_struct),
	requiredWhen: optional(form_rule_struct),
});

export const form_definition_struct = object({
	schemaVersion: optional(number()),
	name: optional(string()),
	pages: optional(array(form_page_struct)),
});

// ---------------------------------------------------------------------------
// FormDefinition
// ---------------------------------------------------------------------------

/**
 * FormDefinition — a general-purpose, org-scoped form definition consumed by the
 * web builder, the web renderer and the mobile app.
 *
 * Replaces `accident_process`, which could only express choice questions whose
 * answers came from one of ten hardcoded lookup models. A definition here can
 * express any field type, conditional visibility, conditional requiredness,
 * narrowed option lists, and arbitrarily nested repeatable groups.
 */
/**
 * The kinds of form a definition can be.
 *
 * This replaces the older `incident_type` taxonomy. `incident_type` named a
 * category of *accident*; these name which model the answers are stored in, so
 * the same question shape can mean different things for an accident form than
 * for a road-damage form — which is the point of splitting the models.
 */
export const form_definition_kind_array = [
	"accident",
	"incident_report",
] as const;
export const form_definition_kind_emums = enums(form_definition_kind_array);

/**
 * Which model each kind's answers live in.
 *
 * `checkBindings` resolves an answer's target through this, so an invalid
 * binding cannot be authored: a form declares relations, and whether a relation
 * is bindable at all is a property of the model its answers are stored in.
 */
export const FORM_KIND_TARGET_MODEL = {
	accident: "accident",
	incident_report: "incident_report",
} as const;

export const form_definition_pure = {
	name: string(),
	description: optional(string()),
	status: defaulted(form_definition_status_emums, "draft"),
	version: defaulted(number(), 1), // bumped on every activate
	// Which model this form's answers are stored in. Absent on documents written
	// before the split, and the model defaults it to `accident` — which is what
	// those documents meant.
	form_kind: defaulted(form_definition_kind_emums, "accident"),
	// Phosphor base name, validated against FORM_ICON_NAMES at activate time. It
	// lives beside the definition tree rather than inside it because the mobile
	// picker needs one icon per form without walking nine pages of nodes.
	icon: optional(string()),
	schema_version: defaulted(number(), FORM_SCHEMA_VERSION),
	definition: form_definition_struct,
	...createUpdateAt,
};

export const form_definition_relations = {
	organization: {
		schemaName: "organization",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			form_definitions: {
				type: "multiple" as RelationDataType,
				limit: 20,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const form_definitions = () => {
	// Indexes are NOT created here. `newModel`'s factory runs during
	// `functionsSetup`, which fires before `runServer`, and `createIndex` returns a
	// promise nobody awaits — so a build that fails takes the process down with an
	// unhandled rejection before any migration gets a chance to run. That is
	// exactly how the retired `{organization._id, incident_type}` index used to
	// crash the boot on any organization holding two active forms. Creation now
	// lives in `ensureFormDefinitionIndexes()`, awaited in `mod.ts`.
	const model = coreApp.odm.newModel(
		"form_definition",
		form_definition_pure,
		form_definition_relations,
	);

	return model;
};

/** Both index specs this collection is meant to carry. */
const FORM_DEFINITION_INDEXES: Array<{
	name: string;
	keys: Record<string, 1>;
	options?: Record<string, unknown>;
}> = [
	{
		// The one-active-accident-form guarantee, as a database constraint rather
		// than only `activateFn`'s software check. `form_kind` rather than the
		// retired `incident_type`, and partial so report forms — which are
		// deliberately unbounded — are excluded from the index entirely.
		name: "organization._id_1",
		keys: { "organization._id": 1 },
		options: {
			unique: true,
			partialFilterExpression: {
				status: "active",
				form_kind: "accident",
			},
		},
	},
	{
		// Serves every listing that filters an organization's forms by kind.
		name: "org_form_kind_status",
		keys: { "organization._id": 1, form_kind: 1, status: 1 },
	},
];

/**
 * Create this collection's indexes, awaited before the server accepts traffic.
 *
 * Idempotent — `createIndex` is a no-op when the spec already matches — and it
 * swallows its own failures, because an index that cannot be built must not stop
 * the process from serving. The worst case is a missing uniqueness guarantee
 * until an operator builds it by hand; the acts' own validation still applies.
 *
 * A unique index built over documents that already violate it fails outright, so
 * this can legitimately fail on a database holding two active accident forms for
 * one organization. That is worth surfacing rather than crashing on, hence the
 * catch.
 */
export const ensureFormDefinitionIndexes = async (): Promise<void> => {
	const collection = coreApp.odm.getCollection("form_definition");

	for (const { name, keys, options } of FORM_DEFINITION_INDEXES) {
		try {
			await collection.createIndex(keys, { name, ...(options ?? {}) });
		} catch {
			// See the doc comment: a failed index build is degraded enforcement,
			// not a reason to refuse to boot.
		}
	}
};

// ---------------------------------------------------------------------------
// FormResponse
// ---------------------------------------------------------------------------

export const form_issue_struct = object({
	path: string(),
	node_key: string(),
	message: string(),
	severity: enums(["error", "warning"]),
});

/**
 * FormResponse — one officer's answers to one definition version.
 *
 * `answers` keeps the full nested tree as submitted, so arbitrarily deep
 * repeatable groups survive intact. `flat_answers` is a flattened projection of
 * the same data, so a report can be found and aggregated without a bespoke
 * pipeline per form.
 *
 * `form_definition_id` is a raw ObjectId rather than a relation: a report must
 * stay readable after its definition is deleted (orphan resilience, per
 * back/AGENTS.md). The `organization` relation carries the live join for tenancy.
 */
export const form_response_pure = {
	form_definition_id: objectIdValidation,
	definition_version: number(),
	// correlates with accident.client_report_uuid for idempotent retries
	client_report_uuid: optional(string()),
	answers: optional(record(string(), anyStruct())),
	flat_answers: optional(
		array(
			object({
				field_key: string(),
				path: optional(string()),
				value: optional(string()),
				values: optional(array(string())),
			}),
		),
	),
	errors: optional(array(form_issue_struct)),
	warnings: optional(array(form_issue_struct)),
	...createUpdateAt,
};

export const form_response_relations = {
	organization: {
		schemaName: "organization",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			form_responses: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "createdAt",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	definition: {
		schemaName: "form_definition",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			responses: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "createdAt",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	officer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
	accident: {
		schemaName: "accident",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const form_responses = () =>
	coreApp.odm.newModel(
		"form_response",
		form_response_pure,
		form_response_relations,
	);

/**
 * The index the model carried before the accident/incident_report split, when
 * forms were keyed by `incident_type`.
 */
const LEGACY_FORM_KIND_INDEX = "organization._id_1_incident_type_1";

/**
 * Drop the pre-split unique index, which capped an organization at **one active
 * form of any kind**.
 *
 * Form definitions no longer carry `incident_type`; `form_kind` replaced it. So
 * every active form indexed as `incident_type: null` and collided, and the
 * partial filter (`{status: "active"}`) matched report forms too — the index
 * was simultaneously too strict and, via its build failure on existing data,
 * capable of taking the process down.
 *
 * Idempotent, and it swallows its own failure so a drop that cannot happen
 * cannot stop the process from serving. The uniqueness guarantee is not lost:
 * `ensureFormDefinitionIndexes()` builds `{organization._id}` unique filtered to
 * `{status: "active", form_kind: "accident"}`, which enforces the
 * one-active-accident-form rule and ignores report forms entirely.
 */
export const applyFormDefinitionMigrations = async (): Promise<void> => {
	const collection = coreApp.odm.getCollection("form_definition");

	try {
		const indexes = await collection.indexes();
		if (indexes.some((index) => index.name === LEGACY_FORM_KIND_INDEX)) {
			await collection.dropIndex(LEGACY_FORM_KIND_INDEX);
		}
	} catch {
		// See the doc comment: a failed drop leaves the old cap in place until an
		// operator removes it by hand, and the new indexes are created regardless.
	}
};
