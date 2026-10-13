import type { AttachmentDto } from "@/types/report-detail";

/**
 * Telling a file answer apart from every other answer.
 *
 * ## Why resolution, not recognition
 *
 * A `file` field's answer is a **file id**, not a filename:
 *
 * - `accident.dynamic_answers` rows carry `answer_ids` — `splitAssetAnswerRows`
 *   in the app's `asset-writeback` deliberately puts the ids in that column and
 *   the human-readable names in `answer_names`, describing the split as "joinable"
 *   precisely so a reader can do this.
 * - `incident_report.form_answers` stores a `file` field as an array of the same
 *   server ids, in the tree itself.
 *
 * Neither is recognisable as a path: there is no extension, no prefix, and a
 * `select` answer sitting next to them is a bare literal like `opt_a`. So the
 * test is not "does this look like a file" but "does this resolve against the
 * report's `attachments`". That also means the answer list needs **no form
 * definition** to render a file correctly — which is what lets the
 * no-definition fallback show viewers too instead of raw ObjectIds.
 *
 * ## Why an unresolved id is not an error
 *
 * `resolveAssetIdsInData` leaves a local asset id that never uploaded untouched,
 * by design, so a report can legitimately carry an id no `file` document backs.
 * Rendering that as a link would be a dead link; dropping it would read as
 * "nothing was recorded", which is false. Callers fall back to the answer's own
 * text, which is the same show-don't-hide rule the answer sections already follow
 * for an unlabelled question key.
 */

/** The report's `attachments`, keyed by `_id`, for the join. Built once per report. */
export function attachmentIndex(
  attachments?: AttachmentDto[],
): Map<string, AttachmentDto> {
  const index = new Map<string, AttachmentDto>();
  for (const file of attachments ?? []) {
    // An attachment with no `_id` would be indexed under `undefined` and then
    // match any answer that happened to be missing — skip it instead.
    if (file?._id) index.set(file._id, file);
  }
  return index;
}

/**
 * The files an answer leaf refers to, or `undefined` when it is not a file answer.
 *
 * An array counts only when **every** entry resolves. A half-resolved array is
 * the one case worth being strict about: rendering two of three files as viewers
 * and the third as text splits one evidence set across two notations, which is
 * harder to read than either choice alone.
 */
export function resolveFileAnswer(
  value: unknown,
  index: Map<string, AttachmentDto>,
): AttachmentDto[] | undefined {
  if (!index.size) return undefined;

  const ids = typeof value === "string" ? [value] : Array.isArray(value) ? value : undefined;
  if (!ids?.length) return undefined;

  const files: AttachmentDto[] = [];
  for (const id of ids) {
    if (typeof id !== "string") return undefined;
    const file = index.get(id);
    if (!file) return undefined;
    files.push(file);
  }
  return files;
}