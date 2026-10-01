/**
 * @lesan/form-engine — the shared form engine.
 *
 * One pure implementation of a form definition's semantics, consumed by three
 * runtimes: the Deno backend (authoritative validation at submit), the Next.js
 * frontend (builder live preview), and the Expo mobile app (offline rendering
 * and validation).
 *
 * The duplication this avoids is not cosmetic. Mobile must decide what is
 * visible and what is required while the device has no network, and the backend
 * re-decides the same questions when the report arrives. If those two
 * implementations drifted, an officer could fill in a form the server then
 * rejects — or worse, file one it should have blocked.
 *
 * Everything here is dependency-free and side-effect-free so it runs unchanged
 * in Deno, in the browser bundle, and in React Native's JS engine.
 *
 * Typical use:
 *
 * ```ts
 * import { validateForm, visiblePages } from "@lesan/form-engine";
 *
 * const pages = visiblePages(definition, answers);
 * const { errors, warnings } = validateForm(definition, answers);
 * ```
 */

export type {
	AnswerScalar,
	AnswerTree,
	AnswerValue,
	Binding,
	ContentNode,
	FieldNode,
	FieldType,
	FormDefinition,
	GroupNode,
	Issue,
	OptionItem,
	OptionsFilter,
	OptionSource,
	PageNode,
	PlatePart,
	PlatePartKind,
	PlateVariant,
	RepeatableNode,
	Rule,
	SectionNode,
	Validation,
	ValidationResult,
} from "./types.ts";

export { DEFAULT_SCHEMA_VERSION } from "./types.ts";

export { countPath, parsePath, resolvePath, resolveScoped } from "./paths.ts";

export { evalRule, isEmptyAnswer } from "./rules.ts";

export { collectFields, findNode, walkNodes } from "./traverse.ts";
export type { NodeMeta, WalkVisitor } from "./traverse.ts";

export {
	isNodeRequired,
	isNodeVisible,
	resolveOptions,
	visibleNodeKeys,
	visiblePages,
	visibleSections,
} from "./conditions.ts";

export { toLatinNumber, validateForm } from "./validate.ts";

export { applyCascades, pruneHidden } from "./cascade.ts";

export { buildBindings, buildFlatAnswers, relationSetKey } from "./bindings.ts";
