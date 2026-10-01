/**
 * Conditional evaluation: what is shown, what is required, and which options
 * a field offers right now.
 *
 * These three questions are what the QA team asked for directly — "link fields
 * together so the options for a subsequent field change, or display entirely
 * different fields based on a value selected in a prior field". They all reduce
 * to evaluating a `Rule` against the current answers, so they share one
 * implementation and therefore cannot disagree.
 */

import { evalRule } from "./rules.ts";
import type {
	AnswerTree,
	AnswerValue,
	ContentNode,
	FieldNode,
	OptionItem,
	PageNode,
	SectionNode,
} from "./types.ts";

const RULE_SLOTS = ["visibleWhen", "requiredWhen"] as const;

/**
 * Is this node shown for the current answers?
 *
 * A node with no `visibleWhen` is visible. A rule that fails to evaluate (bad
 * definition) hides the node rather than showing an unusable input.
 */
export const isNodeVisible = (
	node: Pick<ContentNode, "visibleWhen">,
	answers: AnswerTree,
	scope: AnswerValue[] = [],
): boolean => {
	if (!node.visibleWhen) return true;
	return evalRule(node.visibleWhen, answers, scope);
};

/**
 * Must this node be filled in for the form to advance?
 *
 * An invisible node is never required — otherwise a hidden question would block
 * the officer forever, which is the classic conditional-form trap.
 */
export const isNodeRequired = (
	node: Pick<ContentNode, "requiredWhen" | "visibleWhen">,
	answers: AnswerTree,
	scope: AnswerValue[] = [],
): boolean => {
	if (!node.requiredWhen) return false;
	if (!isNodeVisible(node, answers, scope)) return false;
	return evalRule(node.requiredWhen, answers, scope);
};

/**
 * The option list a field should currently offer.
 *
 * Resolution order:
 *  1. no `options` → nothing to choose from
 *  2. `reference` source → empty here; the client merges cached backend options,
 *     so the engine never invents ids it cannot verify
 *  3. `optionsFilter.mode === "static"` → intersect with the fixed value list
 *  4. `optionsFilter.mode === "dynamic"` → show the listed values only while the
 *     rule holds, so a dependent field's options genuinely change with earlier answers
 *
 * A filter that matches nothing yields an empty list, never the full list. A
 * visible "no options" is safer than a dropdown offering now-invalid choices.
 */
export const resolveOptions = (
	node: Pick<FieldNode, "options" | "optionsFilter">,
	answers: AnswerTree,
	scope: AnswerValue[] = [],
): OptionItem[] => {
	const source = node.options;
	if (!source || source.kind !== "literal") return [];
	const items = source.items ?? [];
	const filter = node.optionsFilter;

	if (!filter || filter.mode === "all") return items;

	const allowed = new Set(filter.values);
	const narrowed = items.filter((item) => allowed.has(item.value));
	if (filter.mode === "static") return narrowed;

	return evalRule(filter.rule, answers, scope) ? narrowed : [];
};

/**
 * Pages the officer can currently reach, in declaration order.
 *
 * A hidden page is removed from the wizard entirely rather than rendered as an
 * empty step — that is what makes "different fields for a different value" feel
 * like a different form.
 */
export const visiblePages = (
	definition: { pages?: PageNode[] },
	answers: AnswerTree,
): PageNode[] => {
	const pages = definition.pages ?? [];
	const result: PageNode[] = [];
	for (const page of pages) {
		if (isNodeVisible(page, answers)) result.push(page);
	}
	return result;
};

/** Sections of a page that are currently shown, in declaration order. */
export const visibleSections = (
	page: PageNode,
	answers: AnswerTree,
): SectionNode[] => {
	const sections = page.sections ?? [];
	return sections.filter((section) => isNodeVisible(section, answers));
};

/**
 * Every node key currently visible, including those nested in repeatables.
 *
 * Used by the validator to skip hidden nodes and by the renderer to decide what
 * to mount. Because it uses the same walker as validation, the two always agree
 * on what exists.
 */
export const visibleNodeKeys = (
	definition: { pages?: PageNode[] },
	answers: AnswerTree,
): Set<string> => {
	const keys = new Set<string>();
	const pages = definition.pages ?? [];
	for (const page of pages) {
		if (!isNodeVisible(page, answers)) continue;
		for (const section of page.sections ?? []) {
			if (!isNodeVisible(section, answers)) continue;
			collectVisible(section.nodes ?? [], answers, keys, []);
		}
	}
	return keys;
};

const collectVisible = (
	nodes: ContentNode[],
	answers: AnswerTree,
	keys: Set<string>,
	scope: AnswerValue[],
): void => {
	for (const node of nodes) {
		if (!isNodeVisible(node, answers, scope)) continue;
		keys.add(node.key);
		if (node.kind === "group") {
			collectVisible(node.children, answers, keys, scope);
		} else if (node.kind === "repeatable") {
			// A repeatable's own rows are answer data, not definition nodes, so the
			// children are registered from the definition alone. Rules inside rows
			// are evaluated per instance by the validator.
			collectVisible(node.children, answers, keys, scope);
		}
	}
};

/** Re-exported so callers can reason about emptiness without a second import. */
export { RULE_SLOTS };