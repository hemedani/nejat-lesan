/**
 * Path addressing for the answer tree.
 *
 * Paths address values inside the submitted answer tree. Segments:
 *   `key`      read the named property
 *   `key[]`    iterate every element of the array at `key`
 *   `key[3]`   read a single element by index
 *
 * Multiple `[]` segments iterate recursively, which is what lets a rule reach
 * `vehicles[].passengers[].health` — a nested repeatable group — without any
 * code.
 *
 * All three runtimes (Deno, Next, Expo) must agree on these semantics exactly,
 * because mobile evaluates rules offline and the backend re-evaluates them at
 * submit time. Keep this file dependency-free.
 */

import type { AnswerTree, AnswerValue } from "./types.ts";

type Segment =
	| { kind: "key"; name: string }
	| { kind: "iterate" }
	| { kind: "index"; index: number };

const SEGMENT_RE = /\[(\d*)\]/g;

/** Split "vehicles[0].passengers[].health" into its segments. */
export const parsePath = (path: string): Segment[] => {
	const segments: Segment[] = [];
	for (const part of path.split(".")) {
		if (!part) continue;
		const brackets: Segment[] = [];
		let name = part;
		let match: RegExpExecArray | null;
		SEGMENT_RE.lastIndex = 0;
		while ((match = SEGMENT_RE.exec(part)) !== null) {
			const digits = match[1];
			if (digits === "") {
				brackets.push({ kind: "iterate" });
			} else {
				const index = Number(digits);
				if (Number.isInteger(index) && index >= 0) {
					brackets.push({ kind: "index", index });
				}
			}
			name = name.replace(`[${digits}]`, "");
		}
		// The property name always precedes its own bracket segments:
		// "vehicles[]" must read vehicles, then iterate — not the reverse.
		if (name) segments.push({ kind: "key", name });
		segments.push(...brackets);
	}
	return segments;
};

const isRecord = (value: unknown): value is Record<string, AnswerValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Resolve a path to every matching value.
 *
 * Returns an array even for a single match, so callers never branch on shape.
 * An unmatched path returns `[]` — never `undefined` — which is what makes
 * `anyIn` over an empty repeatable group correctly evaluate to false.
 */
export const resolvePath = (
	tree: AnswerTree | AnswerValue,
	path: string,
): AnswerValue[] => resolveFrom([tree], parsePath(path));

/**
 * Resolve a path relative to a scope stack, used when evaluating rules inside a
 * repeatable row. The scope holds the enclosing row objects, innermost last.
 *
 * A rule inside vehicle row 1 reading `type` resolves against that row only.
 * An absolute path such as `severity` still reaches the top-level tree, because
 * the scope objects simply have no such key.
 */
export const resolveScoped = (
	tree: AnswerTree,
	path: string,
	scope: AnswerValue[],
): AnswerValue[] => {
	if (scope.length === 0) return resolvePath(tree, path);
	const scopeChain = [...scope, tree];
	const segments = parsePath(path);

	// A leading bare key that exists on a scope object is treated as row-relative;
	// otherwise resolution falls back to the tree so sibling fields stay reachable.
	const first = segments[0];
	if (first && first.kind === "key") {
		for (let i = scopeChain.length - 1; i >= 0; i--) {
			const candidate = scopeChain[i];
			if (isRecord(candidate) && candidate[first.name] !== undefined) {
				return resolveFrom([scopeChain[i]], segments);
			}
		}
	}
	return resolveFrom(scopeChain, segments);
};

/** Walk `roots` through `segments`, collecting one value per terminal leaf. */
const resolveFrom = (
	roots: AnswerValue[],
	segments: Segment[],
): AnswerValue[] => {
	let current = roots;
	for (const segment of segments) {
		if (current.length === 0) return [];
		if (segment.kind === "key") {
			current = current
				.map((value) =>
					isRecord(value) ? value[segment.name] : undefined
				)
				.filter((value): value is AnswerValue => value !== undefined);
		} else if (segment.kind === "iterate") {
			current = current.flatMap((value) =>
				Array.isArray(value) ? value : []
			) as AnswerValue[];
		} else {
			current = current
				.map((value) =>
					Array.isArray(value) ? value[segment.index] : undefined
				)
				.filter((value): value is AnswerValue => value !== undefined);
		}
	}
	return current;
};

/**
 * Count the elements a path points at.
 *
 * `countPath(tree, "vehicles")` is 2; `countPath(tree, "vehicles[].passengers[]")`
 * is the total passenger count across every vehicle. The final `[]` is implied,
 * so callers write the path they use for `anyIn`.
 */
export const countPath = (
	tree: AnswerTree | AnswerValue,
	path: string,
): number => {
	const segments = parsePath(path);
	const last = segments[segments.length - 1];
	const alreadyIterating = last?.kind === "iterate";
	const target = alreadyIterating
		? segments
		: [...segments, { kind: "iterate" as const }];
	return resolveFrom([tree], target).length;
};
