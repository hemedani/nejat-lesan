/**
 * The rule evaluator.
 *
 * This is the single most important function in the engine. The backend runs it
 * to validate a submission, mobile runs it to render and validate offline, and
 * the web builder runs it to preview conditions live. Any disagreement between
 * those three is a correctness bug, so this file must stay pure and
 * dependency-free.
 *
 * Design rules:
 *  - Never throw. A malformed rule evaluates to `false` so a bad definition
 *    cannot crash an officer's field screen.
 *  - "Any match wins" for comparisons over an iterated path, because a rule
 *    reading `vehicles[].type` is asking "does any vehicle have this type?".
 *  - Empty groups are meaningful: `anyIn`/`someTrue` are false over nothing,
 *    while `everyIn` is true (nothing violates the constraint).
 */

import { countPath, resolvePath, resolveScoped } from "./paths.ts";
import type { AnswerTree, AnswerValue, Rule } from "./types.ts";

const isRecord = (value: unknown): value is Record<string, AnswerValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** An answer counts as empty when absent, blank, or an empty collection. */
export const isEmptyAnswer = (value: AnswerValue | undefined): boolean => {
	if (value === undefined || value === null) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	if (isRecord(value)) return Object.keys(value).length === 0;
	return false;
};

const toNumber = (value: AnswerValue | undefined): number | undefined => {
	if (typeof value === "number") return value;
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}
	return undefined;
};

const asList = (value: unknown): AnswerValue[] => {
	if (Array.isArray(value)) return value as AnswerValue[];
	if (value === undefined || value === null) return [];
	return [value as AnswerValue];
};

/** Flatten resolved values one level so array answers yield their members. */
const flatten = (values: AnswerValue[]): AnswerValue[] =>
	values.flatMap((value) => Array.isArray(value) ? value : [value]);

const looseEquals = (left: AnswerValue, right: unknown): boolean => {
	if (left === right) return true;
	// Persian forms of yes/no arrive from both chips and text inputs.
	if (typeof left === "string" && typeof right === "string") {
		return left.trim() === right.trim();
	}
	if (typeof left === "boolean" || typeof right === "boolean") {
		return Boolean(left) === Boolean(right);
	}
	const leftNumber = toNumber(left);
	const rightNumber = toNumber(right as AnswerValue | undefined);
	if (leftNumber !== undefined && rightNumber !== undefined) {
		return leftNumber === rightNumber;
	}
	return false;
};

/**
 * Evaluate a rule against an answer tree.
 *
 * `scope` is the repeatable-row stack when evaluating rules inside a nested
 * group; omit it for top-level evaluation.
 */
export const evalRule = (
	rule: Rule | undefined,
	answers: AnswerTree,
	scope: AnswerValue[] = [],
): boolean => {
	if (!rule || typeof rule !== "object") return false;

	switch (rule.op) {
		case "always":
			return true;

		case "and":
			return asList((rule as { rules?: Rule[] }).rules).every((child) =>
				evalRule(child as Rule, answers, scope)
			);

		case "or":
			return asList((rule as { rules?: Rule[] }).rules).some((child) =>
				evalRule(child as Rule, answers, scope)
			);

		case "not":
			// Negating a malformed child yields `true` (double negation of `false`).
			return !evalRule((rule as { rule?: Rule }).rule, answers, scope);

		case "eq":
			return resolvePathOf(rule, answers, scope)
				.some((value) => looseEquals(value, rule.value));

		case "ne":
			// "Not equal" means no resolved value equals the target, so an
			// unanswered field counts as "not equal".
			return !resolvePathOf(rule, answers, scope)
				.some((value) => looseEquals(value, rule.value));

		case "in":
			return resolvePathOf(rule, answers, scope).some((value) =>
				asList(rule.value).some((candidate) => looseEquals(value, candidate))
			);

		case "nin":
			return !resolvePathOf(rule, answers, scope).some((value) =>
				asList(rule.value).some((candidate) => looseEquals(value, candidate))
			);

		case "contains":
			return flatten(resolvePathOf(rule, answers, scope)).some((value) => {
				if (Array.isArray(value)) {
					return value.some((item) => looseEquals(item, rule.value));
				}
				if (typeof value === "string" && typeof rule.value === "string") {
					return value.includes(rule.value);
				}
				return false;
			});

		case "gt":
		case "gte":
		case "lt":
		case "lte":
			return compareNumbers(rule, answers, scope);

		case "exists":
			return resolvePathOf(rule, answers, scope).length > 0;

		case "empty":
			return resolvePathOf(rule, answers, scope)
				.every((value) => isEmptyAnswer(value));

		case "filled":
			return resolvePathOf(rule, answers, scope)
				.some((value) => !isEmptyAnswer(value));

		case "anyIn":
			return flatten(resolvePathOf(rule, answers, scope)).some((value) =>
				asList(rule.value).some((candidate) => looseEquals(value, candidate))
			);

		case "everyIn":
			// Vacuously true over an empty group: nothing violates the constraint.
			return flatten(resolvePathOf(rule, answers, scope))
				.every((value) =>
					asList(rule.value).some((candidate) => looseEquals(value, candidate))
				);

		case "someTrue":
			return flatten(resolvePathOf(rule, answers, scope))
				.some((value) => value === true || value === "true");

		case "someFalse":
			return flatten(resolvePathOf(rule, answers, scope))
				.some((value) => value === false || value === "false");

		case "count": {
			const path = (rule as { path?: string }).path;
			if (typeof path !== "string" || path === "") return false;
			const total = scope.length > 0
				? countScoped(path, answers, scope)
				: countPath(answers, path);
			const min = (rule as { gte?: number }).gte;
			const max = (rule as { lte?: number }).lte;
			if (min === undefined && max === undefined) return false;
			if (min !== undefined && total < min) return false;
			if (max !== undefined && total > max) return false;
			return true;
		}

		default:
			// Unknown op from a newer client or a hand-edited definition.
			return false;
	}
};

const resolvePathOf = (
	rule: Rule,
	answers: AnswerTree,
	scope: AnswerValue[],
): AnswerValue[] => {
	const path = (rule as { path?: string }).path;
	if (typeof path !== "string" || path === "") return [];
	return scope.length > 0
		? resolveScoped(answers, path, scope)
		: resolvePath(answers, path);
};

const compareNumbers = (
	rule: Rule,
	answers: AnswerTree,
	scope: AnswerValue[],
): boolean => {
	const target = toNumber(
		(rule as { value?: AnswerValue }).value as AnswerValue | undefined,
	);
	if (target === undefined) return false;
	return resolvePathOf(rule, answers, scope).some((value) => {
		const actual = toNumber(value);
		if (actual === undefined) return false;
		switch (rule.op) {
			case "gt":
				return actual > target;
			case "gte":
				return actual >= target;
			case "lt":
				return actual < target;
			case "lte":
				return actual <= target;
			default:
				return false;
		}
	});
};

const countScoped = (
	path: string,
	answers: AnswerTree,
	scope: AnswerValue[],
): number => {
	// Inside a row, `count` targets the row's own groups (e.g. its passengers).
	const resolved = resolveScoped(answers, `${path}[]`, scope);
	return resolved.length;
};