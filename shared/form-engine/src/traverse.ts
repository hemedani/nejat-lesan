/**
 * Definition-tree traversal.
 *
 * Every consumer needs the same walk: which fields exist, where they sit, and
 * what the answer tree says about them right now. The renderer, the validator,
 * the builder preview and the cascade-clear pass all build on this, so they can
 * never disagree about the shape of a form.
 *
 * A walker visits a node once per *instance* — a field inside a repeatable with
 * three rows is visited three times, once per row, each with that row's scope.
 * That is what makes rules inside nested groups evaluate against their own row.
 */

import type {
	AnswerTree,
	AnswerValue,
	ContentNode,
	FormDefinition,
	PageNode,
	RepeatableNode,
} from "./types.ts";

export type NodeMeta = {
	/** Nesting level; repeatable items increase it. */
	depth: number;
	/** Dot path from the answer root, e.g. `vehicles[].passengers[].health`. */
	path: string;
	/** Concrete path of this instance, e.g. `vehicles[0].passengers[1].health`. */
	instancePath: string;
	pageKey: string;
	sectionKey?: string;
	/** Enclosing repeatable row objects, outermost first. */
	scope: AnswerValue[];
	/** The row this node belongs to, when inside a repeatable. */
	scopeValue?: AnswerValue;
	/** Index of the row within its repeatable. */
	rowIndex?: number;
	/** The nearest enclosing repeatable. */
	repeatable?: RepeatableNode;
};

export type WalkVisitor = (
	node: ContentNode,
	meta: NodeMeta,
) => boolean | void;

const isRecord = (value: unknown): value is Record<string, AnswerValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Sort by `order`, preserving declaration order for equal orders.
 *
 * Builders write sequential `order` values, but hand-authored fixtures often
 * leave them at 0 — sorting alphabetically in that case would silently reorder
 * a form the author laid out on purpose.
 */
const byOrder = <T extends { order?: number }>(list: T[]): T[] =>
	list
		.map((item, index) => ({ item, index }))
		.sort((a, b) =>
			(a.item.order ?? 0) - (b.item.order ?? 0) || a.index - b.index
		)
		.map(({ item }) => item);

/**
 * Walk every content node in the definition, once per concrete instance.
 *
 * Returning `false` from the visitor stops that node's subtree from being
 * walked; returning `undefined` continues. Traversal is depth-first in `order`.
 */
export const walkNodes = (
	definition: FormDefinition,
	answers: AnswerTree,
	visit: WalkVisitor,
): void => {
	const pages = byOrder(definition.pages ?? []);
	for (const page of pages) {
		walkPage(page, answers, visit);
	}
};

const walkPage = (
	page: PageNode,
	answers: AnswerTree,
	visit: WalkVisitor,
) => {
	const sections = byOrder(page.sections ?? []);
	for (const section of sections) {
		const nodes = byOrder(section.nodes ?? []);
		for (const node of nodes) {
			if (
				!walkNode(node, answers, visit, {
					depth: 0,
					path: node.key,
					instancePath: node.key,
					pageKey: page.key,
					sectionKey: section.key,
					scope: [],
				})
			) return;
		}
	}
};

const walkNode = (
	node: ContentNode,
	answers: AnswerTree,
	visit: WalkVisitor,
	meta: NodeMeta,
): boolean => {
	if (visit(node, meta) === false) return false;

	if (node.kind === "group") {
		const children = byOrder(node.children);
		for (const child of children) {
			const childMeta: NodeMeta = {
				...meta,
				depth: meta.depth,
				path: `${meta.path}.${child.key}`,
				instancePath: `${meta.instancePath}.${child.key}`,
			};
			if (!walkNode(child, answers, visit, childMeta)) return false;
		}
		return true;
	}

	if (node.kind === "repeatable") {
		walkRepeatable(node, answers, visit, meta);
	}
	return true;
};

const walkRepeatable = (
	node: RepeatableNode,
	answers: AnswerTree,
	visit: WalkVisitor,
	meta: NodeMeta,
) => {
	// A nested repeatable's rows live inside its parent row, not at the answer
	// root: `vehicles[].passengers` is `answers.vehicles[i].passengers`. Reading
	// from the root would silently skip every nested group, so search the scope
	// chain innermost-first and fall back to the root.
	const rowFrom = (key: string): AnswerValue | undefined => {
		for (let i = meta.scope.length - 1; i >= 0; i--) {
			const candidate = meta.scope[i];
			if (isRecord(candidate) && candidate[key] !== undefined) {
				return candidate[key];
			}
		}
		return isRecord(answers) ? answers[key] : undefined;
	};

	const raw = rowFrom(node.key);
	let rows: AnswerValue[] = Array.isArray(raw) ? raw : [];

	// `maxItems` caps what the walker inspects so an over-filled answer cannot
	// silently skip validation of the tail.
	if (typeof node.maxItems === "number" && node.maxItems >= 0) {
		rows = rows.slice(0, node.maxItems);
	}

	const children = byOrder(node.children);

	// A `for…of` loop, not `forEach`: returning false from the visitor must stop
	// the whole walk, including remaining rows and siblings.
	for (let index = 0; index < rows.length; index++) {
		const row = rows[index];
		const childMeta: NodeMeta = {
			...meta,
			depth: meta.depth + 1,
			path: `${meta.path}[]`,
			instancePath: `${meta.instancePath}[${index}]`,
			scope: [...meta.scope, row],
			scopeValue: row,
			rowIndex: index,
			repeatable: node,
		};
		for (const child of children) {
			const grandMeta: NodeMeta = {
				...childMeta,
				depth: childMeta.depth,
				path: `${childMeta.path}.${child.key}`,
				instancePath: `${childMeta.instancePath}.${child.key}`,
			};
			if (!walkNode(child, answers, visit, grandMeta)) return;
		}
	}
};

/**
 * Collect every field node instance, without any filtering.
 *
 * Convenience over `walkNodes` for callers that only need the flat list.
 */
export const collectFields = (
	definition: FormDefinition,
	answers: AnswerTree,
): Array<{ node: ContentNode; meta: NodeMeta }> => {
	const out: Array<{ node: ContentNode; meta: NodeMeta }> = [];
	walkNodes(definition, answers, (node, meta) => {
		out.push({ node, meta });
	});
	return out;
};

/** Find a node by key anywhere in the definition, first match wins. */
export const findNode = (
	definition: FormDefinition,
	key: string,
): ContentNode | undefined => {
	for (const page of definition.pages ?? []) {
		for (const section of page.sections ?? []) {
			const found = findInNodes(section.nodes ?? [], key);
			if (found) return found;
		}
	}
	return undefined;
};

const findInNodes = (
	nodes: ContentNode[],
	key: string,
): ContentNode | undefined => {
	// A dotted path descends: "vehicles.plateType" is `plateType` inside the
	// `vehicles` group. Repeatable levels are transparent, since their rows are
	// answer data rather than definition nodes.
	const [head, ...rest] = key.split(".").filter(Boolean);
	for (const node of nodes) {
		if (node.key === head) {
			if (rest.length === 0) return node;
			if (node.kind === "group" || node.kind === "repeatable") {
				const found = findInNodes(node.children, rest.join("."));
				if (found) return found;
			}
			return undefined;
		}
		if (node.kind === "group" || node.kind === "repeatable") {
			const found = findInNodes(node.children, key);
			if (found) return found;
		}
	}
	return undefined;
};
