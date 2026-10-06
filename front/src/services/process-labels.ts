import type { ContentNode, FormDefinition } from "@forms";
import { qaAccidentFormDefinition } from "@forms";

/**
 * Persian labels for the questions behind `accident.dynamic_answers`.
 *
 * ## Why this file exists
 *
 * A `dynamic_answers` row stores only keys and values:
 *
 *     { step_key: "location", question_key: "direction", value: "اهواز به بندر امام" }
 *     { step_key: "vehiclesPage", question_key: "vehicles[0].driver[0].driver_health" }
 *
 * Neither carries the question's text, so a detail page that renders `question_key`
 * verbatim renders `direction`, `lane`, `vehicles[0].driver[0].driver_health` — English,
 * on a screen written for a Persian-speaking reviewer. On `REP-2026-4423441` those 27
 * rows are the **entire** report body, so this is not a footnote.
 *
 * ## Why the labels are resolvable with no fetch
 *
 * `question_key` is an *instance path* (`buildDynamicAnswers` in the shared engine stores
 * `meta.instancePath`), so every stored key maps back to a node in the form the officer
 * filled in. The patrol app files through `qaAccidentFormDefinition` — the accident form
 * that ships with the shared engine — whose nodes already carry Persian labels
 * («جهت حرکت», «خط / باند», «ساعت وقوع», «وسیله نقلیه»).
 *
 * So the labels are **already in the bundle**: importing the definition costs no request,
 * and the app already depends on this package, so there is no new coupling. Had the keys
 * come from a per-organization `accident_process` instead, resolving them would have
 * needed a fetch — see below for why that is the wrong source anyway.
 *
 * ## Why not `accident_process`
 *
 * It looks like the obvious source — `steps[].title` and `steps[].questions[].question` —
 * and it is the wrong one:
 *
 * 1. Its step `key`s are random uuids (`9bf47855`), while the stored `step_key`s are
 *    authored slugs (`location`, `basics`, `vehiclesPage`). They do not correspond, so
 *    even a perfectly populated process resolves nothing.
 * 2. It is organization-scoped **and per incident type**, so a report from an
 *    organization with no active process has no labels at all.
 * 3. In the live database the single `accident_process` row is authoring-test data —
 *    step titles like «سیب. سیب سشی» — so joining against it would put *garbage* on a
 *    production screen while looking authoritative.
 *
 * Point 3 is the one that decides it: a wrong label is worse than a raw key, because a raw
 * key is visibly a key.
 */

/** One resolved question. */
export type QuestionLabel = {
  /** Persian text of the question. */
  label: string;
  /** Enclosing repeatable's own label — «وسیله نقلیه», «راننده», «عابر پیاده». */
  group?: string;
  /** The form page it sits under, which is what a stored `step_key` names. */
  page?: string;
  /** 0-based row within the nearest enclosing repeatable, parsed off the key. */
  row?: number;
};

const byNodeKey = new Map<string, QuestionLabel>();
const byTemplatedPath = new Map<string, QuestionLabel>();

const definition = qaAccidentFormDefinition as FormDefinition | undefined;

if (definition?.pages?.length) {
  for (const page of definition.pages) {
    for (const section of page.sections ?? []) {
      visit(section.nodes ?? [], page.key, "", []);
    }
  }
}

/**
 * Index every node, structurally.
 *
 * A **structural** walk, not `walkNodes`: that one is answer-driven and visits a
 * repeatable's children only for rows that exist, so indexing against an empty tree left
 * everything under `vehicles[]`, `passengers[]`, `driver[]` and `pedestrians[]` — 12 of
 * this report's 27 rows — unlabelled. Repeatables are recorded in the key as `[]`, so a
 * stored `vehicles[1].plate` and the definition's `vehicles[].plate` differ only by the
 * index, which `labelForQuestion` normalises away.
 */
function visit(
  nodes: ContentNode[],
  pageKey: string,
  prefix: string,
  groups: string[],
): void {
  for (const node of nodes) {
    const path = prefix ? `${prefix}.${node.key}` : node.key;

    if (node.kind === "field") {
      const entry: QuestionLabel = {
        label: node.label || node.key,
        page: pageKey,
        group: groups[groups.length - 1],
      };
      byNodeKey.set(node.key, entry);
      // Last write wins, which is the same rule `findNode` uses: definition keys are
      // generated, so a genuine collision means the form is malformed rather than that
      // either instance is the right one.
      byTemplatedPath.set(path, entry);
      continue;
    }

    const nested = node.kind === "repeatable";
    visit(
      node.children ?? [],
      pageKey,
      nested ? `${path}[]` : path,
      nested ? [...groups, node.label || node.key] : groups,
    );
  }
}

/**
 * The label for a stored `dynamic_answers` key, or `undefined` when the built-in form
 * does not define that question.
 *
 * `undefined` is the honest answer; the caller renders the raw key instead. Three
 * attempts, narrowest first: the exact path, then the same path with every `[n]` turned
 * into `[]`, then the bare leaf key.
 */
export function labelForQuestion(key: string): QuestionLabel | undefined {
  const entry =
    byTemplatedPath.get(key) ??
    byTemplatedPath.get(toTemplate(key)) ??
    byNodeKey.get(leafSegment(key));

  if (!entry) return undefined;

  const row = rowIndexOf(key);
  return row === undefined ? entry : { ...entry, row };
}

/** `vehicles[1].driver[0].driver_health` → `vehicles[].driver[].driver_health`. */
const toTemplate = (path: string): string => path.replace(/\[\d+\]/g, "[]");

/** `vehicles[0].driver[0].driver_health` → `driver_health`. */
const leafSegment = (path: string): string => path.split(".").pop() ?? path;

/**
 * Which row of the nearest enclosing repeatable a key refers to.
 *
 * Taken from the **last** `[n]` before the leaf segment, because that is the innermost
 * repeatable — `vehicles[0].passengers[1].passenger_health` is about passenger 1 of
 * vehicle 0, so «سرنشین ۲» is the useful label, not «وسیله نقلیه ۱».
 */
function rowIndexOf(key: string): number | undefined {
  const dot = key.lastIndexOf(".");
  const prefix = dot === -1 ? "" : key.slice(0, dot);
  const matches = prefix.matchAll(/\[(\d+)\]/g);
  let last: RegExpMatchArray | undefined;
  for (const match of matches) last = match;
  return last ? Number(last[1]) : undefined;
}

/** `vehiclesPage` → «وسایل نقلیه», or `undefined` when the page is unknown. */
export function labelForStep(pageKey: string): string | undefined {
  return definition?.pages?.find((page) => page.key === pageKey)?.title;
}

/** True when the built-in form is available — guards a bundle that dropped it. */
export function hasQuestionLabels(): boolean {
  return byNodeKey.size > 0;
}