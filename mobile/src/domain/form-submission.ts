import { buildBindings, buildDynamicAnswers, type AnswerTree, type FormDefinition } from '@forms';

/**
 * Turning form answers into draft data the sync worker can submit.
 *
 * A form-filed report has to become a real `accident` document, so the answers
 * leave the form world in three parts:
 *
 * 1. **Typed keys** — `buildBindings` projects every bound field onto the
 *    relation/pure/DTO keys the backend acts and the 34 analytics queries read.
 *    Without this a form-filed report would be invisible to charts.
 * 2. **`dynamic_answers`** — a snapshot of every unbound leaf, so nothing the
 *    officer typed is lost even when it has no typed home.
 * 3. **Local provenance** — the definition id/version plus the answer tree
 *    itself, which stays on the device so a returned report reopens in the same
 *    form at the same page. These keys are deliberately NOT sent upstream: the
 *    backend `accident` model does not declare them, and `accident-mapper` only
 *    forwards keys the model accepts.
 *
 * Mirrors `process-form.ts:processStateToData` for the org process wizard, so
 * both authoring paths produce the same draft shape.
 */
export function formAnswersToDraftData(
  definition: FormDefinition,
  answers: AnswerTree,
  meta: { formId?: string; version?: number },
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    ...buildBindings(definition, answers),
    // The generic tree: resumable offline, and the only lossless copy of the
    // answers. `accident-mapper` ignores unknown keys, so this stays local.
    form_answers: answers,
  };

  const dynamics = buildDynamicAnswers(definition, answers);
  if (dynamics.length > 0) {
    data['dynamic_answers'] = dynamics;
  }

  if (meta.formId) {
    data['form_definition_id'] = meta.formId;
  }
  if (typeof meta.version === 'number' && Number.isFinite(meta.version)) {
    data['form_version'] = meta.version;
  }

  return data;
}

/**
 * Whether a draft was captured through the dynamic form rather than the built-in
 * flows or the org process wizard.
 *
 * `reports.tsx` uses this to send a returned report back to the right editor, so
 * a correction does not drop the officer into a different form than the one they
 * filed.
 */
export function isFormDraftData(data: Record<string, unknown> | undefined | null): boolean {
  return typeof data?.['form_definition_id'] === 'string';
}
