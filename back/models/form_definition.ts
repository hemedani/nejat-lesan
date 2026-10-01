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
import { process_incident_type_emums } from "./accident_process.ts";

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
export const form_definition_pure = {
	name: string(),
	description: optional(string()),
	status: defaulted(form_definition_status_emums, "draft"),
	version: defaulted(number(), 1), // bumped on every activate
	is_active: defaulted(boolean(), false),
	// absent = applies to every incident type
	incident_type: optional(process_incident_type_emums),
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
	const model = coreApp.odm.newModel(
		"form_definition",
		form_definition_pure,
		form_definition_relations,
	);

	// One active definition per (organization, incident_type). The activate act
	// enforces this in software with Persian messages; this index makes it a
	// database guarantee.
	coreApp.odm.getCollection("form_definition").createIndex(
		{ "organization._id": 1, incident_type: 1 },
		{
			unique: true,
			partialFilterExpression: { status: "active" },
		},
	);

	return model;
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
