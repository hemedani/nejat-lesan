/**
 * Definition schema for the dynamic form engine.
 *
 * This file is TYPES ONLY — no runtime code, no imports. It is consumed by the
 * Deno backend, the Next.js frontend and the Expo mobile app, so it must stay
 * dependency-free.
 *
 * Shape: FormDefinition → pages[] → sections[] → nodes[]
 * where a node is a FieldNode | GroupNode | RepeatableNode.
 */

// ---------------------------------------------------------------------------
// Answer values
// ---------------------------------------------------------------------------

export type AnswerScalar = string | number | boolean | null;
export type AnswerValue =
	| AnswerScalar
	| AnswerValue[]
	| { [key: string]: AnswerValue };

/**
 * The submitted answer tree. Keys are node keys; repeatable nodes map to
 * arrays of objects. Mirrors the definition's node tree minus invisible nodes.
 */
export type AnswerTree = Record<string, AnswerValue>;

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export type Rule =
	| { op: "always" }
	| { op: "and"; rules: Rule[] }
	| { op: "or"; rules: Rule[] }
	| { op: "not"; rule: Rule }
	| {
		op:
			| "eq"
			| "ne"
			| "in"
			| "nin"
			| "contains"
			| "gt"
			| "gte"
			| "lt"
			| "lte"
			| "exists"
			| "empty"
			| "filled";
		path: string;
		value?: unknown;
	}
	| {
		op: "anyIn" | "everyIn" | "someTrue" | "someFalse";
		path: string;
		value?: unknown;
	}
	| { op: "count"; path: string; gte?: number; lte?: number };

/** A rule that narrows an option list rather than returning a boolean. */
export type OptionsFilter =
	| { mode: "all" }
	| { mode: "static"; values: string[] }
	| { mode: "dynamic"; rule: Rule; values: string[] };

// ---------------------------------------------------------------------------
// Options & bindings
// ---------------------------------------------------------------------------

export type OptionItem = {
	value: string;
	label: string;
	/** Visual severity, e.g. fire/explosion choices render red. */
	tone?: "normal" | "warn" | "danger";
	/** Marks a suggested-but-optional choice (QA: "پیشنهادی"). */
	recommended?: boolean;
	symbol?: string;
};

export type OptionSource =
	| { kind: "literal"; items: OptionItem[] }
	| {
		kind: "reference";
		/** Any Lesan model exposing `{ _id, name }`. */
		model: string;
		/** Empty = all records. Whitelists are stripped from client responses. */
		allowedIds?: string[];
	}
	| { kind: "derived"; rule: Rule };

export type Binding =
	| { kind: "relation"; path: string; multi?: boolean }
	| { kind: "dto"; dto: string; field: string; from: string }
	| { kind: "pure"; path: string }
	| { kind: "dynamic" };

export type Validation = {
	min?: number;
	max?: number;
	maxLength?: number;
	minLength?: number;
	pattern?: string;
	/** Persian message shown when the rule fails. */
	message?: string;
	/** Cross-item advisories that never block progress. */
	warnings?: Array<{ rule: Rule; message: string }>;
};

// ---------------------------------------------------------------------------
// Plate (composite Iranian licence plate)
// ---------------------------------------------------------------------------

export type PlatePartKind = "digits" | "letters" | "text" | "select";

export type PlatePart = {
	key: string;
	label: string;
	kind: PlatePartKind;
	/** Fixed length for `digits`. */
	length?: number;
	/** Numeric keypad for `digits`. */
	inputMode?: "numeric" | "text";
	/** Options for `select` parts, e.g. the Persian alphabet. */
	items?: OptionItem[];
};

export type PlateVariant = {
	/** Matches this value on the sibling `plateType` field. */
	when: Rule;
	parts: PlatePart[];
	/** Rendered instead of parts when the plate type is "no plate". */
	notApplicableHint?: string;
};

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export type FieldType =
	| "text"
	| "textarea"
	| "number"
	| "date"
	| "time"
	| "datetime"
	| "select"
	| "multi_select"
	| "boolean"
	| "choice_group"
	| "reference"
	| "plate"
	| "file"
	| "location"
	| "computed";

export type FieldNode = {
	kind: "field";
	key: string;
	type: FieldType;
	label: string;
	description?: string;
	icon?: string;
	placeholder?: string;
	/** Shown when the field is visible but not required. */
	optionalHint?: string;
	order: number;
	defaultValue?: AnswerValue;

	visibleWhen?: Rule;
	requiredWhen?: Rule;
	options?: OptionSource;
	/** Narrows the option list based on other answers. */
	optionsFilter?: OptionsFilter;
	binding?: Binding;
	/** Paths cleared whenever this field's value changes. */
	clearOnChange?: string[];

	validation?: Validation;
	/** Read-only text derived from other answers. */
	valueFrom?: Rule;
	/** Composite plate variants, keyed off a sibling plate-type field. */
	plateVariants?: PlateVariant[];
	/** Marks a field that participates in no binding (pure form data). */
	transient?: boolean;
};

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export type GroupNode = {
	kind: "group";
	key: string;
	label?: string;
	order: number;
	children: ContentNode[];
	visibleWhen?: Rule;
	requiredWhen?: Rule;
};

export type RepeatableNode = {
	kind: "repeatable";
	key: string;
	label: string;
	description?: string;
	order: number;
	minItems?: number;
	maxItems?: number;
	/** Persian template, `{index}` and `{n}` expand to the 1-based row number. */
	itemLabel?: string;
	/** Summary line shown on the collapsed row, e.g. "۲ · سواری · ۱۲ ب ۳۴۵ ایران". */
	itemSummary?: string;
	children: ContentNode[];
	visibleWhen?: Rule;
	requiredWhen?: Rule;
};

export type ContentNode = FieldNode | GroupNode | RepeatableNode;
export type SectionNode = {
	key: string;
	title: string;
	description?: string;
	icon?: string;
	order: number;
	nodes: ContentNode[];
	visibleWhen?: Rule;
	requiredWhen?: Rule;
};
export type PageNode = {
	key: string;
	title: string;
	description?: string;
	icon?: string;
	order: number;
	sections: SectionNode[];
	visibleWhen?: Rule;
	requiredWhen?: Rule;
};

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export type FormDefinition = {
	/** Bumped when the node-tree shape changes incompatibly. */
	schemaVersion: number;
	name: string;
	pages: PageNode[];
};

export const DEFAULT_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export type Issue = {
	/** Dot path into the answer tree; repeatable rows include `[i]`. */
	path: string;
	nodeKey: string;
	message: string;
	severity: "error" | "warning";
};

export type ValidationResult = {
	errors: Issue[];
	warnings: Issue[];
	/** Keys of pages that have at least one blocking error. */
	blockedPages: string[];
};
