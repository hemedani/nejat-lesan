/**
 * Cascade clears.
 *
 * When a controlling answer changes, dependent answers can become meaningless.
 * The clearest case is the QA form's licence plate: choosing `ملی` then switching
 * to `موتورسیکلت` leaves a four-part national plate sitting in a field that now
 * expects a two-part motorbike plate. Rather than silently keeping a value that
 * no longer means anything — or blanking the user's work on every keystroke — the
 * engine clears only what the definition declares as dependent.
 *
 * Clearing is *declarative*, driven by each field's `clearOnChange`, and is
 * applied at the caller's chosen moment (on blur, on selection) rather than on
 * every keystroke.
 */

import { findNode } from "./traverse.ts";
import type { AnswerTree, AnswerValue, FormDefinition } from "./types.ts";

const isRecord = (value: unknown): value is Record<string, AnswerValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Remove a key at a concrete instance path, immutably. */
const clearAtInstancePath = (
	tree: AnswerTree,
	segments: string[],
): AnswerTree => {
	if (segments.length === 0) return tree;

	const [head, ...rest] = segments;
	const listMatch = /^([^[]*)\[(\d+)\]$/.exec(head);

	// Descend into one row of a repeatable, e.g. `vehicles[1]`.
	if (listMatch) {
		const [, key, indexText] = listMatch;
		const index = Number(indexText);
		const rows = isRecord(tree) ? tree[key] : undefined;
		if (!Array.isArray(rows) || index >= rows.length) return tree;

		const row = rows[index];
		if (!isRecord(row)) return tree;

		const nextRows = [...rows];
		if (rest.length === 0) {
			// Dropping the row's own key entirely.
			const { [key]: _removed, ...remaining } = row;
			void _removed;
			nextRows[index] = remaining as AnswerValue;
		} else {
			nextRows[index] = clearAtInstancePath(
				row as AnswerTree,
				rest,
			) as AnswerValue;
		}
		return { ...tree, [key]: nextRows };
	}

	// Plain key, e.g. `plateType`.
	if (!isRecord(tree) || !(head in tree)) return tree;

	if (rest.length === 0) {
		const { [head]: _removed, ...remaining } = tree;
		void _removed;
		return remaining as AnswerTree;
	}

	const child = tree[head];
	if (!isRecord(child)) return tree;
	return {
		...tree,
		[head]: clearAtInstancePath(child as AnswerTree, rest),
	};
};

/**
 * Split an instance path into segments, keeping list indices attached.
 *
 * `vehicles[0].plateType` → `["vehicles[0]", "plateType"]`
 */
const toSegments = (path: string): string[] =>
	path.split(".").filter((segment) => segment.length > 0);

/** Read the value at a concrete instance path, e.g. `vehicles[0].plateType`. */
const readAtInstancePath = (
	tree: AnswerTree,
	path: string,
): AnswerValue | undefined => {
	let current: unknown = tree;
	for (const segment of toSegments(path)) {
		const match = /^([^[]*)\[(\d+)\]$/.exec(segment);
		if (match) {
			if (!isRecord(current)) return undefined;
			const rows = current[match[1]];
			if (!Array.isArray(rows)) return undefined;
			current = rows[Number(match[2])];
			continue;
		}
		if (!isRecord(current)) return undefined;
		current = current[segment];
	}
	return current as AnswerValue | undefined;
};

/**
 * Strip `[i]` suffixes to get the definition-level path.
 *
 * `vehicles[0].plateType` → `vehicles.plateType`
 */
const rootKeyOf = (path: string): string => path.replace(/\[\d+\]/g, "");

/**
 * The row prefix a change happened in, as a trailing-dot-ready string.
 *
 * `plateType` → ""                 (top level)
 * `vehicles[0].plateType` → "vehicles[0]."
 * `vehicles[0].passengers[1].health` → "vehicles[0].passengers[1]."
 *
 * The prefix is the changed path minus its final key segment, so it must be
 * computed on the raw (still-indexed) path rather than the definition key.
 */
const rowPrefixOf = (path: string): string => {
	const lastDot = path.lastIndexOf(".");
	return lastDot === -1 ? "" : path.slice(0, lastDot + 1);
};

/**
 * Set a leaf value at a concrete instance path, immutably.
 *
 * Only the final segment is written; intermediate segments are walked as
 * containers. So `setAtInstancePath(tree, "vehicles[0].plateType", "ملی")` sets
 * `plateType` on the first vehicle and returns new objects only along that path.
 */
const setAtInstancePath = (
	tree: AnswerTree,
	path: string,
	value: AnswerValue | undefined,
): AnswerTree => {
	const segments = toSegments(path);
	if (segments.length === 0) return tree;
	const [head, ...rest] = segments;

	const listMatch = /^([^[]*)\[(\d+)\]$/.exec(head);
	if (listMatch) {
		const [, key, indexText] = listMatch;
		const index = Number(indexText);
		const rows = isRecord(tree) ? tree[key] : undefined;
		if (!Array.isArray(rows) || index >= rows.length) return tree;
		const row = rows[index];
		if (!isRecord(row)) return tree;

		const nextRows = [...rows];
		nextRows[index] = (rest.length === 0 ? value : setAtInstancePath(
			row as AnswerTree,
			rest.join("."),
			value,
		)) as AnswerValue;
		return { ...tree, [key]: nextRows };
	}

	if (rest.length === 0) return { ...tree, [head]: value } as AnswerTree;

	const child = isRecord(tree) ? tree[head] : undefined;
	if (!isRecord(child)) return tree;
	return {
		...tree,
		[head]: setAtInstancePath(child as AnswerTree, rest.join("."), value),
	};
};

/**
 * Apply the cascade for one changed field.
 *
 * Returns a new answer tree with dependent values removed. Never mutates the
 * input, because React state and the mobile draft both rely on identity checks
 * to decide whether to re-render or re-persist.
 *
 * Cascades are transitive (a → b → c clears both) and cycle-safe: a definition
 * that declares `a → b → a` terminates rather than looping forever.
 */
export const applyCascades = (
	definition: FormDefinition,
	tree: AnswerTree,
	changedPath: string,
	newValue: AnswerValue | undefined,
): AnswerTree => {
	const changedRoot = rootKeyOf(changedPath);

	// Re-selecting the same option must not wipe the dependent value: the officer
	// tapping an already-chosen plate type should keep the parts they entered.
	// Compare at the changed instance path, which may be `vehicles[0].plateType`.
	if (readAtInstancePath(tree, changedPath) === newValue) return tree;

	const changedNode = findNode(definition, changedRoot);
	if (!changedNode || changedNode.kind !== "field") {
		// No cascade declared, or the changed node is a container: still record
		// the new value, which the caller does separately.
		return tree;
	}

	// Seed with the new value so the caller's value is not undone by this pass.
	// `changedPath` may be row-scoped (`vehicles[0].plateType`), in which case the
	// new value is written into that row rather than at the answer root.
	let next: AnswerTree = setAtInstancePath(tree, changedPath, newValue);

	// `clearOnChange` paths are written relative to the changed field — a `plate`
	// declared on a vehicle's `plateType` means that row's plate, not the top
	// level. Anchor them to the changed node's row prefix.
	const rowPrefix = rowPrefixOf(changedPath);

	const targets = (changedNode.clearOnChange ?? []).filter(
		(target) => typeof target === "string" && target.length > 0,
	);
	if (targets.length === 0) return next;

	// Breadth-first over the dependency graph, with a visited set as the cycle
	// guard. Order does not matter for clearing, so BFS is fine and cheap.
	const visited = new Set<string>([changedRoot]);
	const queue = [...targets];

	while (queue.length > 0) {
		const target = queue.shift() as string;
		if (visited.has(target)) continue;
		visited.add(target);

		// `target` is relative to the changed row; expand it into every concrete
		// instance so a cascade clears all rows of a top-level group, or just the
		// one row when the change happened inside a repeatable.
		const anchored = `${rowPrefix}${target}`;
		for (const instancePath of expandInstancePaths(next, anchored)) {
			next = clearAtInstancePath(next, toSegments(instancePath));
		}

		const node = findNode(definition, rootKeyOf(target));
		if (node && node.kind === "field") {
			for (const nested of node.clearOnChange ?? []) {
				if (!visited.has(nested)) queue.push(nested);
			}
		}
	}

	return next;
};

/**
 * Expand a definition path into every concrete instance path present.
 *
 * `vehicles[].plate` becomes `vehicles[0].plate`, `vehicles[1].plate`, … based
 * on the current answer tree, so a cascade inside a repeatable clears every row
 * rather than only the first.
 */
const expandInstancePaths = (
	tree: AnswerTree,
	template: string,
): string[] => {
	const segments = template.split(".").filter(Boolean);

	let prefixes: string[][] = [[]];
	for (const segment of segments) {
		const listMatch = /^([^[]*)\[(\d+)\]$/.exec(segment);
		if (!listMatch) {
			prefixes = prefixes.map((prefix) => [...prefix, segment]);
			continue;
		}
		// `name[]` means "every row of this group"; `name[2]` is already concrete
		// and passes straight through.
		const digits = listMatch[2];
		if (digits !== "") {
			prefixes = prefixes.map((prefix) => [...prefix, segment]);
			continue;
		}
		const next: string[][] = [];
		for (const prefix of prefixes) {
			for (const index of indexesFor(tree, prefix, listMatch[1])) {
				next.push([...prefix, `${listMatch[1]}[${index}]`]);
			}
		}
		prefixes = next;
	}

	return prefixes.map((segments) => segments.join("."));
};

/**
 * Read the indexes of `key`'s array at a concrete prefix path.
 *
 * An empty result means "this group has no rows yet", which correctly skips a
 * cascade rather than clearing something that does not exist.
 */
const indexesFor = (
	tree: AnswerTree,
	prefix: string[],
	key: string,
): number[] => {
	let current: unknown = tree;
	for (const segment of prefix) {
		const match = /^([^[]*)\[(\d+)\]$/.exec(segment);
		if (!match) return [];
		if (!isRecord(current)) return [];
		const rows = current[match[1]];
		if (!Array.isArray(rows)) return [];
		current = rows[Number(match[2])];
	}
	if (!isRecord(current)) return [];
	const rows = current[key];
	return Array.isArray(rows) ? rows.map((_, index) => index) : [];
};

/**
 * Drop answers for nodes that are no longer visible.
 *
 * Called before persisting a draft so a field hidden by a changed answer does
 * not linger and reappear if the officer flips the switch back. Unknown keys are
 * preserved — the mobile app is required not to discard fields it does not
 * recognise, so forward-compatible data survives a schema change.
 */
export const pruneHidden = (
	definition: FormDefinition,
	tree: AnswerTree,
	isVisible: (key: string) => boolean,
): AnswerTree => {
	const next: AnswerTree = { ...tree };
	for (const key of Object.keys(tree)) {
		if (isVisible(key)) continue;
		delete (next as Record<string, AnswerValue>)[key];
	}
	return next;
};
