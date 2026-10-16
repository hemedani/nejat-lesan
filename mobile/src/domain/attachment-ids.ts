/**
 * Which files the console will be able to show for this report.
 *
 * The gallery is built from the model's `attachments` relation, and that relation is the
 * only route to a file. Anything that reaches the server without going through it is
 * invisible in the panel and eventually reaped as an orphan.
 *
 * Three things can put a file there, and none of them is enough on its own:
 *
 * - `applyServerFileIds` links a plate, insurance or damage photo through its typed card
 *   field. The backend unions those into `attachments` itself.
 * - `file.uploadAccidentImages` links the file directly to the accident — but **only when
 *   the request carried an `accidentId`**, and a report that has not been filed yet has
 *   none. On every new report that link is simply absent.
 * - A croquis sketch or an incident photo has no card field to ride in at all.
 *
 * So the ids are collected and sent explicitly. `accident.add` de-duplicates against the
 * card fields it already gathered (`back/src/accident/add/add.fn.ts:370`), which is what
 * makes sending them twice harmless.
 */
export function mergeAttachmentIds(existing: unknown, incoming: readonly string[]): string[] {
  const current = Array.isArray(existing)
    ? existing.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  const merged = [...current];
  for (const id of incoming) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  return merged;
}

/**
 * Add ids to a draft payload's `attachmentsIds`, leaving the payload untouched when
 * there is nothing to add.
 *
 * The key is absent rather than empty when there is nothing to say: an empty array would
 * clear the relation on an update, and there is a test in `accident-mapper.test.ts`
 * holding the mapper to not sending one.
 */
export function withAttachmentIds(
  data: Record<string, unknown>,
  incoming: readonly string[],
): Record<string, unknown> {
  if (incoming.length === 0) {
    return data;
  }
  return { ...data, attachmentsIds: mergeAttachmentIds(data['attachmentsIds'], incoming) };
}