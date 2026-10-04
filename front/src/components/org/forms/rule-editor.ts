"use client";

/**
 * Rule editor and Persian readback.
 *
 * Org authors are highway staff, not programmers, so a condition must be
 * expressible as "اگر … و … آنگاه" rather than as a boolean expression. This
 * file owns both halves: building the rule tree, and describing it in Persian so
 * the author can check the machine understood them.
 */

import type { OptionItem, Rule } from "@forms";

// ---------------------------------------------------------------------------
// Readback
// ---------------------------------------------------------------------------

const OP_LABELS: Record<string, string> = {
	always: "همیشه",
	and: "و",
	or: "یا",
	not: "نutarی از",
	eq: "برابر با",
	ne: "نابرابر با",
	in: "یکی از",
	nin: "هیچ‌کدام از",
	contains: "شامل",
	gt: "بزرگ‌تر از",
	gte: "بزرگ‌تر یا مساوی",
	lt: "کوچک‌تر از",
	lte: "کوچک‌تر یا مساوی",
	exists: "وجود دارد",
	empty: "خالی است",
	filled: "پر شده است",
	anyIn: "دست‌کم یکی برابر است با",
	everyIn: "همه برابرند با",
	someTrue: "دست‌کم یکی روشن باشد",
	someFalse: "دست‌کم یکی خاموش باشد",
	count: "تعداد",
};

/** Render a value list compactly: «الف، ب و پ». */
const join = (values: unknown[]): string => {
	const parts = values.map((value) =>
		typeof value === "string" ? value : JSON.stringify(value),
	);
	if (parts.length === 0) return "";
	if (parts.length === 1) return parts[0];
	return `${parts.slice(0, -1).join("، ")} و ${parts[parts.length - 1]}`;
};

const pathText = (path: string): string =>
	path.replace(/\[\]/g, " (هر مورد)");

/**
 * Describe a rule in Persian.
 *
 * Returns a single sentence so an author can verify the condition reads the way
 * they meant it. Unknown shapes degrade to a marker rather than throwing — a
 * rule the backend will reject should be visible in the builder, not a crash.
 */
export const describeRule = (rule: Rule | undefined, fieldLabels: Map<string, string>): string => {
	if (!rule || typeof rule !== "object") return "";
	const typed = rule as Rule & Record<string, unknown>;
	const op = typed.op;

	switch (op) {
		case "always":
			return "همیشه";
		case "and":
			return (typed.rules as Rule[] | undefined)?.map((child) => describeRule(child, fieldLabels))
				.filter(Boolean)
				.join(" و ") ?? "";
		case "or":
			return (typed.rules as Rule[] | undefined)?.map((child) => describeRule(child, fieldLabels))
				.filter(Boolean)
				.join(" یا ") ?? "";
		case "not":
			return `نقضِ «${describeRule(typed.rule as Rule, fieldLabels)}»`;

		case "count": {
			const target = fieldLabels.get(String(typed.path ?? "").split(/[.[]/)[0]) ?? pathText(String(typed.path));
			const parts: string[] = [];
			if (typeof typed.gte === "number") parts.push(`دست‌کم ${typed.gte} مورد`);
			if (typeof typed.lte === "number") parts.push(`حداکثر ${typed.lte} مورد`);
			return parts.length > 0
				? `${target} ${join(parts)} داشته باشد`
				: `${target} شمارش شود`;
		}

		default: {
			if (!OP_LABELS[op]) return `(شرط ناشناخته: ${op})`;
			const label = OP_LABELS[op];
			const rawPath = String(typed.path ?? "");
			const target = fieldLabels.get(rawPath.split(/[.[]/)[0]) ?? pathText(rawPath);
			const subject =
				op === "exists" || op === "empty" || op === "filled" || op === "contains"
					? `${target} ${label}`
					: `${target} ${label} ${join(
							Array.isArray(typed.value) ? typed.value : [typed.value],
						)}`;
			return subject;
		}
	}
};

// ---------------------------------------------------------------------------
// Rule construction
// ---------------------------------------------------------------------------

export type RuleLeaf = Extract<Rule, { path: string }>;

/** Every leaf op, grouped for the picker. */
export const LEAF_OPS: Array<{ op: string; label: string; needsValue: boolean }> = [
	{ op: "eq", label: "برابر با", needsValue: true },
	{ op: "ne", label: "نابرابر با", needsValue: true },
	{ op: "in", label: "یکی از این مقادیر", needsValue: true },
	{ op: "nin", label: "هیچ‌کدام از این مقادیر", needsValue: true },
	{ op: "contains", label: "شامل این مقدار", needsValue: true },
	{ op: "anyIn", label: "دست‌کم یک مورد برابر است با", needsValue: true },
	{ op: "everyIn", label: "همه موارد برابرند با", needsValue: true },
	{ op: "gt", label: "بزرگ‌تر از", needsValue: true },
	{ op: "gte", label: "بزرگ‌تر یا مساوی", needsValue: true },
	{ op: "lt", label: "کوچک‌تر از", needsValue: true },
	{ op: "lte", label: "کوچک‌تر یا مساوی", needsValue: true },
	{ op: "filled", label: "پر شده باشد", needsValue: false },
	{ op: "empty", label: "خالی باشد", needsValue: false },
	{ op: "exists", label: "وجود داشته باشد", needsValue: false },
	{ op: "someTrue", label: "دست‌کم یکی روشن باشد", needsValue: false },
	{ op: "someFalse", label: "دست‌کم یکی خاموش باشد", needsValue: false },
	{ op: "count", label: "تعداد موارد", needsValue: false },
];

/** Options a rule path can compare against, when the field has literal options. */
export const valueOptionsForPath = (
	path: string,
	fields: Array<{ key: string; label: string; path: string; items: OptionItem[] }>,
): OptionItem[] => {
	const root = path.split(/[.[]/)[0];
	const match = fields.find((field) => field.key === root);
	return match?.items ?? [];
};

export const makeLeaf = (path: string, op = "eq"): Rule => {
	const entry = LEAF_OPS.find((candidate) => candidate.op === op);
	if (op === "count") return { op: "count", path } as Rule;
	if (entry && !entry.needsValue) return { op, path } as Rule;
	return { op, path, value: "" } as Rule;
};

export const makeGroup = (op: "and" | "or"): Rule => ({
	op,
	rules: [makeLeaf(""), makeLeaf("")],
});

/** Paths referenced anywhere in a rule tree, used to flag dangling references. */
export const rulePaths = (rule: Rule | undefined): string[] => {
	if (!rule || typeof rule !== "object") return [];
	const typed = rule as Rule & Record<string, unknown>;
	if (typed.path) return [String(typed.path)];
	const fromChildren = (typed.rules as Rule[] | undefined)?.flatMap(rulePaths) ?? [];
	if (typed.rule) fromChildren.push(...rulePaths(typed.rule as Rule));
	return fromChildren;
};

/**
 * Flag rule paths that do not resolve to a field in the definition.
 *
 * A dangling path is not fatal — the engine evaluates it as false — but it means
 * the condition silently never fires, which is far worse than an error: the author
 * believes a field is conditional and it is not. So the builder says so.
 */
export const unresolvedRulePaths = (
	rule: Rule | undefined,
	knownPaths: string[],
): string[] => {
	const known = new Set(knownPaths);
	const knownRoots = new Set(knownPaths.map((path) => path.split(/[.[]/)[0]));
	return rulePaths(rule).filter(
		(path) => !known.has(path) && !knownRoots.has(path.split(/[.[]/)[0]),
	);
};