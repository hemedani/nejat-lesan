/**
 * Form validation with two severities.
 *
 * The QA reference app distinguishes `errors()` (block advancing to the next
 * step) from `warnings()` (surface, but never block). That split is preserved
 * exactly, because its cross-checks are advisory by design: "severity is
 * damage-only but a casualty exists" should prompt a second look, not stop a
 * patrol officer from filing at the roadside.
 *
 * The backend runs this same function at submit time, so a tampered or stale
 * client cannot file a report its own definition forbids.
 */

import { isNodeRequired, isNodeVisible, resolveOptions } from "./conditions.ts";
import { evalRule, isEmptyAnswer } from "./rules.ts";
import { walkNodes } from "./traverse.ts";
import type { NodeMeta } from "./traverse.ts";
import type {
	AnswerTree,
	AnswerValue,
	ContentNode,
	FieldNode,
	FormDefinition,
	Issue,
	RepeatableNode,
	ValidationResult,
} from "./types.ts";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Convert Persian/Arabic digits to ASCII for numeric comparison.
 *
 * Officers type "۱۲" on a Persian keypad; comparing it as a string against `12`
 * would silently fail, so numbers are normalised before range checks.
 */
export const toLatinNumber = (value: unknown): number | undefined => {
	if (typeof value === "number") return value;
	if (typeof value !== "string") return undefined;
	let text = value.trim();
	if (text === "") return undefined;
	for (let i = 0; i < PERSIAN_DIGITS.length; i++) {
		text = text.split(PERSIAN_DIGITS[i]).join(String(i));
		text = text.split(ARABIC_DIGITS[i]).join(String(i));
	}
	const parsed = Number(text);
	return Number.isNaN(parsed) ? undefined : parsed;
};

const textLength = (value: unknown): number =>
	typeof value === "string" ? value.trim().length : 0;

const DEFAULT_MESSAGE = "این فیلد الزامی است.";

/**
 * Validate a submitted answer tree against its definition.
 *
 * Hidden nodes are skipped entirely — an invisible field can be neither missing
 * nor invalid, which is what lets the same definition serve several very
 * different field situations.
 */
export const validateForm = (
	definition: FormDefinition,
	answers: AnswerTree,
): ValidationResult => {
	const errors: Issue[] = [];
	const warnings: Issue[] = [];
	const blockedPages = new Set<string>();

	const pageOf: Record<string, string> = {};
	const sectionOf: Record<string, string> = {};
	for (const page of definition.pages ?? []) {
		for (const section of page.sections ?? []) {
			pageOf[section.key] = page.key;
			sectionOf[section.key] = section.key;
		}
	}

	const addError = (
		node: ContentNode,
		path: string,
		message: string,
		pageKey: string,
	) => {
		errors.push({ path, nodeKey: node.key, message, severity: "error" });
		if (pageKey) blockedPages.add(pageKey);
	};

	// `minItems`/`maxItems` describe the whole group, so they must be checked once
	// per group — not once per row. Track which groups have been measured; a
	// nested repeatable is keyed by its path within the parent row.
	const measuredGroups = new Set<string>();

	walkNodes(definition, answers, (node, meta) => {
		const scope = meta.scope;
		const instancePath = meta.instancePath;
		const pageKey = meta.pageKey;

		// Invisible ⇒ neither missing nor invalid.
		if (!isNodeVisible(node, answers, scope)) return;

		if (node.kind === "repeatable") {
			const rows = readRows(node, answers, scope);
			const groupKey = `${node.key}@${meta.path}`;
			if (!measuredGroups.has(groupKey)) {
				measuredGroups.add(groupKey);
				validateRepeatable(
					node,
					rows,
					instancePath,
					pageKey,
					addError,
				);
			}
			return;
		}

		if (node.kind === "group") return;

		const field = node as FieldNode;
		const value = readValue(answers, scope, field.key);

		if (isEmptyAnswer(value as AnswerValue)) {
			if (isNodeRequired(field, answers, scope)) {
				addError(
					field,
					instancePath,
					field.optionalHint ?? missingMessage(field, meta),
					pageKey,
				);
			}
			// Warnings still run on an empty value: the crane check exists precisely
			// to fire when the officer has not requested a crane yet.
			collectWarnings(field, answers, scope, instancePath, warnings);
			return;
		}

		validateValue(field, value, answers, scope, instancePath, addError);
		collectWarnings(field, answers, scope, instancePath, warnings);
	});

	// Section-level and page-level requiredness.
	for (const page of definition.pages ?? []) {
		if (!isNodeVisible(page, answers)) continue;
		const pageErrors: Issue[] = [];
		if (isNodeRequired(page, answers)) {
			const filled = (page.sections ?? []).some((section) =>
				hasAnyContent(section.nodes ?? [], answers)
			);
			if (!filled) {
				pageErrors.push({
					path: page.key,
					nodeKey: page.key,
					message: `${page.title} باید تکمیل شود.`,
					severity: "error",
				});
			}
		}
		for (const section of page.sections ?? []) {
			if (!isNodeVisible(section, answers)) continue;
			if (!isNodeRequired(section, answers)) continue;
			if (hasAnyContent(section.nodes ?? [], answers)) continue;
			pageErrors.push({
				path: section.key,
				nodeKey: section.key,
				message: `${section.title} باید تکمیل شود.`,
				severity: "error",
			});
		}
		errors.push(...pageErrors);
		if (pageErrors.length > 0) blockedPages.add(page.key);
	}

	return { errors, warnings, blockedPages: [...blockedPages] };
};

/**
 * Read the rows belonging to a repeatable, given its scope.
 *
 * `scope` is the chain of enclosing rows. A top-level repeatable's rows sit at
 * the answer root; a nested one's (`vehicles[].passengers`) sit inside the
 * nearest scope object that defines them.
 */
const readRows = (
	node: RepeatableNode,
	answers: AnswerTree,
	scope: unknown[],
): unknown[] => {
	for (let i = scope.length - 1; i >= 0; i--) {
		const candidate = scope[i];
		if (isRecord(candidate) && Array.isArray(candidate[node.key])) {
			return candidate[node.key] as unknown[];
		}
	}
	const atRoot = (answers as Record<string, unknown>)[node.key];
	return Array.isArray(atRoot) ? atRoot : [];
};

const validateRepeatable = (
	node: RepeatableNode,
	rows: unknown[],
	instancePath: string,
	pageKey: string,
	addError: (
		node: ContentNode,
		path: string,
		message: string,
		pageKey: string,
	) => void,
) => {
	const min = node.minItems ?? 0;
	const max = node.maxItems;

	if (rows.length < min) {
		addError(node, instancePath, `حداقل ${min} مورد ثبت کنید.`, pageKey);
	}
	if (typeof max === "number" && rows.length > max) {
		addError(node, instancePath, `حداکثر ${max} مورد ثبت کنید.`, pageKey);
	}
};

/** Read a node's value from the nearest scope object that defines it. */
const readValue = (
	answers: AnswerTree,
	scope: unknown[],
	key: string,
): unknown => {
	for (let i = scope.length - 1; i >= 0; i--) {
		const candidate = scope[i];
		if (isRecord(candidate) && candidate[key] !== undefined) {
			return candidate[key];
		}
	}
	return isRecord(answers) ? answers[key] : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const hasAnyContent = (nodes: ContentNode[], answers: AnswerTree): boolean => {
	for (const node of nodes) {
		const value = (answers as Record<string, unknown>)[node.key];
		if (!isEmptyAnswer(value as never)) return true;
		if (node.kind === "repeatable" && Array.isArray(value)) return true;
	}
	return false;
};

/**
 * Compose the Persian message for a missing required field.
 *
 * Inside a repeatable the officer needs to know *which row* is incomplete, so
 * the message is prefixed with the group's label — matching the QA app's
 * «وسیله ۱: نوع وسیله نقلیه». A custom `optionalHint` on the field always wins.
 */
const missingMessage = (field: FieldNode, meta: NodeMeta): string => {
	const group = meta.repeatable?.label;
	if (!group) {
		return field.label ? `${field.label} الزامی است.` : DEFAULT_MESSAGE;
	}
	return field.label ? `${group}: ${field.label}` : group;
};

const validateValue = (
	field: FieldNode,
	value: unknown,
	answers: AnswerTree,
	scope: unknown[],
	instancePath: string,
	addError: (
		node: ContentNode,
		path: string,
		message: string,
		pageKey: string,
	) => void,
) => {
	const rules = field.validation;
	if (!rules) return;

	// Option membership, against the *currently* narrowed option list so a value
	// that a condition has since invalidated is caught. Evaluating the filter
	// with the live answers is what makes "changing an earlier answer invalidates
	// this one" actually work.
	const options = resolveOptions(field, answers, scope as AnswerValue[]);
	const optionValues = new Set(options.map((option) => option.value));
	if (optionValues.size > 0) {
		const chosen = Array.isArray(value) ? value : [value];
		const invalid = chosen.some(
			(item) => typeof item === "string" && !optionValues.has(item),
		);
		if (invalid) {
			addError(
				field,
				instancePath,
				rules.message ?? "گزینه انتخابی معتبر نیست.",
				"",
			);
			return;
		}
	}

	if (rules.minLength !== undefined || rules.maxLength !== undefined) {
		const length = textLength(value);
		if (
			(rules.minLength !== undefined && length > 0 &&
				length < rules.minLength) ||
			(rules.maxLength !== undefined && length > rules.maxLength)
		) {
			addError(field, instancePath, rules.message ?? DEFAULT_MESSAGE, "");
			return;
		}
	}

	if (rules.min !== undefined || rules.max !== undefined) {
		const numeric = toLatinNumber(
			Array.isArray(value) ? value[0] : value,
		);
		if (
			numeric !== undefined &&
			((rules.min !== undefined && numeric < rules.min) ||
				(rules.max !== undefined && numeric > rules.max))
		) {
			addError(field, instancePath, rules.message ?? DEFAULT_MESSAGE, "");
		}
	}
};

/**
 * Collect advisory cross-item warnings from a field.
 *
 * Warnings are evaluated in the field's own scope so a rule about one vehicle's
 * mobility does not fire on behalf of another.
 */
const collectWarnings = (
	field: FieldNode,
	answers: AnswerTree,
	scope: unknown[],
	instancePath: string,
	warnings: Issue[],
) => {
	const declared = field.validation?.warnings ?? [];
	for (const warning of declared) {
		// A malformed rule must not crash the screen; `evalRule` returns false.
		if (!warning?.rule) continue;
		if (evalRule(warning.rule, answers, scope as AnswerValue[])) {
			warnings.push({
				path: instancePath,
				nodeKey: field.key,
				message: warning.message,
				severity: "warning",
			});
		}
	}
};
