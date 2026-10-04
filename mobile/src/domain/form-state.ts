/**
 * Form answer state and persistence.
 *
 * Pure domain logic only: no React, no native modules. That is what makes it
 * unit-testable in the `node` Vitest environment, and it is required by the
 * mobile rule that validation and transitions belong in testable domain logic
 * rather than inside visual components.
 *
 * Draft persistence follows the app's existing shape: the whole answer tree is
 * stored as JSON on the `drafts` row, so an officer's in-progress report
 * survives navigation, backgrounding and device restart. Merges are shallow and
 * never drop unknown keys, so a draft written by a newer app build is not
 * damaged by an older one replaying it.
 */

import {
  applyCascades,
  isNodeVisible,
  validateForm,
  visiblePages,
  walkNodes,
} from '@forms';
import type {
  AnswerTree,
  AnswerValue,
  ContentNode,
  FormDefinition,
  Issue,
  RepeatableNode,
  ValidationResult,
} from '@forms';
import { DEFAULT_SCHEMA_VERSION } from '@forms';

// ---------------------------------------------------------------------------
// Definition normalisation
// ---------------------------------------------------------------------------

/**
 * Coerce a stored or cached definition into the shape the engine expects.
 *
 * A definition cached by an older app build may lack `pages` or carry nodes the
 * current engine does not understand. Normalising here means the renderer never
 * has to defend against a malformed cache, and the schema check below is the one
 * place that decides whether a definition is usable at all.
 */
export const normalizeDefinition = (raw: unknown): FormDefinition => {
  const source = (raw ?? {}) as Partial<FormDefinition>;
  const pages = Array.isArray(source.pages) ? source.pages : [];
  return {
    schemaVersion: typeof source.schemaVersion === 'number'
      ? source.schemaVersion
      : DEFAULT_SCHEMA_VERSION,
    name: typeof source.name === 'string' ? source.name : '',
    pages: pages
      .filter((page) => page && typeof page.key === 'string')
      .map((page, index) => ({
        ...page,
        title: page.title ?? `مرحله ${index + 1}`,
        order: typeof page.order === 'number' ? page.order : index + 1,
        sections: Array.isArray(page.sections) ? page.sections : [],
      })),
  };
};

/**
 * Whether this app build can render a definition.
 *
 * A newer `schema_version` means the tree may contain node kinds we have no
 * renderer for. Showing a partly-correct form would let an officer file a report
 * with missing questions, so an unreadable definition falls back to the built-in
 * flows instead — the same treatment the legacy process wizard gave an
 * unrenderable `dto` question.
 */
export const isDefinitionRenderable = (
  definition: FormDefinition,
  supportedSchemaVersion = DEFAULT_SCHEMA_VERSION,
): boolean =>
  Array.isArray(definition.pages) &&
  definition.pages.length > 0 &&
  (definition.schemaVersion ?? DEFAULT_SCHEMA_VERSION) <= supportedSchemaVersion;

// ---------------------------------------------------------------------------
// Answer tree transitions — every one returns a new tree
// ---------------------------------------------------------------------------

type RowRecord = Record<string, AnswerValue>;

const isRow = (value: unknown): value is RowRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Set a top-level answer. */
export const setAnswer = (
  tree: AnswerTree,
  key: string,
  value: AnswerValue | undefined,
): AnswerTree => {
  const next: AnswerTree = { ...tree };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
};

/** Toggle a value inside a multi-select answer. */
export const toggleMultiAnswer = (
  tree: AnswerTree,
  key: string,
  value: string,
): AnswerTree => {
  const current = tree[key];
  const list = Array.isArray(current) ? (current as string[]) : [];
  return setAnswer(
    tree,
    key,
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
  );
};

/**
 * Set a field's value and apply the cascades it declares.
 *
 * Clearing matters: switching a plate from `ملی` to `موتورسیکلت` leaves a
 * four-part national plate in a field that now expects two digits. Rather than
 * filing a value that no longer means anything, the definition declares which
 * dependents to drop and the engine does it.
 */
export const setFieldAnswer = (
  definition: FormDefinition,
  tree: AnswerTree,
  key: string,
  value: AnswerValue | undefined,
): AnswerTree => {
  // `key` may be an instance path (`vehicles[0].plateType`). Seeding the value
  // through `setAnswer` would then create a top-level property literally named
  // "vehicles[0].plateType", so the write is delegated to the engine's cascade
  // pass, which places it at the correct address.
  //
  // Clearing has no cascade: there is no new value for dependent rules to see,
  // and the engine already treats an unchanged answer as a no-op.
  if (value === undefined) {
    const addressed = splitInstancePath(key);
    return addressed
      ? setRowAnswer(tree, addressed.repeatable, addressed.index, addressed.field, undefined)
      : setAnswer(tree, key, undefined);
  }
  return applyCascades(definition, tree, key, value);
};

/**
 * Split `vehicles[0].plateType` into its repeatable, row index and leaf key.
 *
 * Returns `undefined` for a plain top-level key, which has no row to address.
 */
const splitInstancePath = (
  key: string,
): { repeatable: string; index: number; field: string } | undefined => {
  const match = /^([^.[\]]+)\[(\d+)]\.(.+)$/.exec(key);
  if (!match) return undefined;
  return { repeatable: match[1], index: Number(match[2]), field: match[3] };
};

/** Append an empty row to a repeatable, respecting `maxItems`. */
export const addRow = (
  definition: FormDefinition,
  tree: AnswerTree,
  key: string,
): AnswerTree => {
  const node = findRepeatable(definition, key);
  const current = Array.isArray(tree[key]) ? (tree[key] as RowRecord[]) : [];
  const max = node?.maxItems;
  if (typeof max === 'number' && current.length >= max) return tree;

  const row: RowRecord = {};
  // Seed defaults so a new row starts from the definition, not blank.
  if (node) {
    walkNodes({ schemaVersion: 1, name: '', pages: [fakePage(node)] }, {}, (child) => {
      if (child.kind === 'field' && child.defaultValue !== undefined) {
        row[child.key] = child.defaultValue;
      }
    });
  }
  return { ...tree, [key]: [...current, row] };
};

/** Remove a row, tolerating an index that no longer exists. */
export const removeRow = (
  tree: AnswerTree,
  key: string,
  index: number,
): AnswerTree => {
  const current = Array.isArray(tree[key]) ? (tree[key] as RowRecord[]) : [];
  if (index < 0 || index >= current.length) return tree;
  return { ...tree, [key]: current.filter((_, position) => position !== index) };
};

/** Set a value inside one row of a repeatable. */
export const setRowAnswer = (
  tree: AnswerTree,
  key: string,
  index: number,
  fieldKey: string,
  value: AnswerValue | undefined,
): AnswerTree => {
  const rows = Array.isArray(tree[key]) ? (tree[key] as RowRecord[]) : [];
  if (index < 0 || index >= rows.length) return tree;
  const row = rows[index] ?? {};
  const nextRows = [...rows];
  // Clearing a field removes its key rather than storing `undefined`: "not
  // answered" and "answered empty" differ to the engine's presence rules.
  if (value === undefined) {
    const { [fieldKey]: _dropped, ...kept } = row;
    void _dropped;
    nextRows[index] = kept;
  } else {
    nextRows[index] = { ...row, [fieldKey]: value };
  }
  return { ...tree, [key]: nextRows };
};

/**
 * Nested repeatable addressing.
 *
 * `path` is the chain of repeatable keys interleaved with the row index chosen at
 * each level, so `['vehicles', 1, 'passengers']` means "the passengers of the
 * second vehicle". Taking the index explicitly matters: an earlier draft
 * addressed the *last* row implicitly, so deleting a passenger from the second
 * vehicle silently edited the first.
 */

type Step = string | number;

const childTree = (row: RowRecord, key: string): AnswerTree =>
  ({ [key]: row[key] } as AnswerTree);

/** Add a row to the repeatable named by the last string step of `path`. */
export const addNestedRow = (
  tree: AnswerTree,
  path: Step[],
  value: RowRecord = {},
): AnswerTree => {
  const [head, ...rest] = path;
  if (typeof head !== 'string') return tree;

  if (rest.length === 0) {
    const rows = Array.isArray(tree[head]) ? (tree[head] as RowRecord[]) : [];
    return { ...tree, [head]: [...rows, value] };
  }

  const index = typeof rest[0] === 'number' ? rest[0] : 0;
  const childKey = rest[1];
  if (typeof childKey !== 'string') return tree;

  const rows = Array.isArray(tree[head]) ? (tree[head] as RowRecord[]) : [];
  if (index < 0 || index >= rows.length) return tree;

  const nextRows = [...rows];
  const row = rows[index] ?? {};
  nextRows[index] = {
    ...row,
    [childKey]: addNestedRow(
      { ...childTree(row, childKey) },
      [childKey, ...rest.slice(2)],
      value,
    )[childKey],
  };
  return { ...tree, [head]: nextRows };
};

/** Remove row `index` from the repeatable named by the last step of `path`. */
export const removeNestedRow = (
  tree: AnswerTree,
  path: Step[],
  index: number,
): AnswerTree => {
  const [head, ...rest] = path;
  if (typeof head !== 'string') return tree;

  if (rest.length === 0) return removeRow(tree, head, index);

  const rowIndex = typeof rest[0] === 'number' ? rest[0] : 0;
  const childKey = rest[1];
  if (typeof childKey !== 'string') return tree;

  const rows = Array.isArray(tree[head]) ? (tree[head] as RowRecord[]) : [];
  if (rowIndex < 0 || rowIndex >= rows.length) return tree;

  const nextRows = [...rows];
  const row = rows[rowIndex] ?? {};
  nextRows[rowIndex] = {
    ...row,
    [childKey]: removeNestedRow(
      { ...childTree(row, childKey) },
      [childKey, ...rest.slice(2)],
      index,
    )[childKey],
  };
  return { ...tree, [head]: nextRows };
};

/** Write a leaf value inside the repeatable named by the last step of `path`. */
export const setNestedRowAnswer = (
  tree: AnswerTree,
  path: Step[],
  index: number,
  fieldKey: string,
  value: AnswerValue | undefined,
): AnswerTree => {
  const [head, ...rest] = path;
  if (typeof head !== 'string') return tree;

  if (rest.length === 0) return setRowAnswer(tree, head, index, fieldKey, value);

  const rowIndex = typeof rest[0] === 'number' ? rest[0] : 0;
  const childKey = rest[1];
  if (typeof childKey !== 'string') return tree;

  const rows = Array.isArray(tree[head]) ? (tree[head] as RowRecord[]) : [];
  if (rowIndex < 0 || rowIndex >= rows.length) return tree;

  const nextRows = [...rows];
  const row = rows[rowIndex] ?? {};
  nextRows[rowIndex] = {
    ...row,
    [childKey]: setNestedRowAnswer(
      { ...childTree(row, childKey) },
      [childKey, ...rest.slice(2)],
      index,
      fieldKey,
      value,
    )[childKey],
  };
  return { ...tree, [head]: nextRows };
};

// ---------------------------------------------------------------------------
// Visibility and validation
// ---------------------------------------------------------------------------

/** Pages currently reachable, honouring `visibleWhen`. */
export const reachablePages = (
  definition: FormDefinition,
  tree: AnswerTree,
) => visiblePages(definition, tree);

/**
 * Issues for one page only, so a stepper can show a per-step badge without
 * validating the whole form.
 */
export const validatePage = (
  definition: FormDefinition,
  tree: AnswerTree,
  pageKey: string,
): ValidationResult => {
  const full = validateForm(definition, tree);
  const page = definition.pages.find((candidate) => candidate.key === pageKey);
  const keys = new Set<string>();
  for (const section of page?.sections ?? []) {
    for (const node of section.nodes ?? []) collectKeys(node, keys);
  }
  const inPage = (issue: Issue) => keys.has(issue.nodeKey);

  return {
    errors: full.errors.filter(inPage),
    warnings: full.warnings.filter(inPage),
    blockedPages: full.blockedPages.filter((key) => key === pageKey),
  };
};

/**
 * Whether the officer may leave the current page.
 *
 * Only blocking errors on this page matter: a missing question two steps ahead is
 * not this step's problem, and blocking here would trap the officer in a page
 * they have already filled correctly.
 */
export const canLeavePage = (
  definition: FormDefinition,
  tree: AnswerTree,
  pageKey: string,
): boolean => validatePage(definition, tree, pageKey).errors.length === 0;

/** Full-form validation, for the final submit check. */
export const validateAll = (
  definition: FormDefinition,
  tree: AnswerTree,
): ValidationResult => validateForm(definition, tree);

/** Issues keyed by node, so a field can show its own error inline. */
export const issuesByNode = (
  result: ValidationResult,
): { errors: Map<string, Issue[]>; warnings: Map<string, Issue[]> } => {
  const errors = new Map<string, Issue[]>();
  const warnings = new Map<string, Issue[]>();
  for (const issue of result.errors) {
    errors.set(issue.nodeKey, [...(errors.get(issue.nodeKey) ?? []), issue]);
  }
  for (const issue of result.warnings) {
    warnings.set(issue.nodeKey, [...(warnings.get(issue.nodeKey) ?? []), issue]);
  }
  return { errors, warnings };
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Merge answers onto a saved draft without discarding unknown keys.
 *
 * The mobile rule is explicit that fields a build does not render must not be
 * silently dropped, so this is a shallow merge in both directions: the new
 * answers win for keys they mention, and everything else from the stored draft
 * survives.
 */
export const mergeAnswers = (
  stored: Record<string, unknown> | undefined,
  incoming: AnswerTree,
): AnswerTree => {
  const base: AnswerTree = { ...((stored ?? {}) as AnswerTree) };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    base[key] = value;
  }
  return base;
};

/** Serialize answers for the `drafts.payload_json` column. */
export const serializeAnswers = (tree: AnswerTree): string =>
  JSON.stringify(tree ?? {});

/** Parse stored answers, tolerating corrupt or absent JSON. */
export const parseAnswers = (raw: string | undefined): AnswerTree => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as AnswerTree)
      : {};
  } catch {
    // A corrupt draft must not block incident creation; the officer starts fresh
    // rather than losing the whole screen.
    return {};
  }
};

// ---------------------------------------------------------------------------
// Introspection helpers
// ---------------------------------------------------------------------------

const collectKeys = (node: ContentNode, into: Set<string>): void => {
  into.add(node.key);
  if (node.kind !== 'field') {
    for (const child of node.children) collectKeys(child, into);
  }
};

const findRepeatable = (
  definition: FormDefinition,
  key: string,
): RepeatableNode | undefined => {
  let found: RepeatableNode | undefined;
  for (const page of definition.pages) {
    for (const section of page.sections) {
      const visit = (nodes: ContentNode[]) => {
        for (const node of nodes) {
          if (node.key === key && node.kind === 'repeatable') found = node;
          if (node.kind !== 'field') visit(node.children);
        }
      };
      visit(section.nodes);
    }
  }
  return found;
};

/** Wrap a single container so `walkNodes` can read its children. */
const fakePage = (node: ContentNode) => ({
  key: 'wrapper',
  title: '',
  order: 1,
  sections: [{ key: 'wrapperSection', title: '', order: 1, nodes: [node] }],
});

/** Is a container's child visible given the answers, scoped to one row? */
export const childIsVisible = (
  definition: FormDefinition,
  node: ContentNode,
  tree: AnswerTree,
  scope: AnswerValue[] = [],
): boolean => isNodeVisible(node, tree, scope);