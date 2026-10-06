"use client";

import type { FormDefinition } from "@forms";
import { getFormDefinitions } from "@/app/actions/form_definition/gets";

/**
 * A form definition plus the identity needed to find it again.
 *
 * The tree itself carries no id — `definition` is just `{schemaVersion, name,
 * pages}` — so the row's `_id` is kept alongside it rather than discarded.
 */
export type OrgFormDefinition = {
  _id: string;
  name?: string;
  icon?: string;
  definition: FormDefinition;
};

/**
 * What one read produced.
 *
 * `failed` is carried rather than inferred from an empty list, because "the
 * organization has no forms" and "the read was refused" are different facts with
 * opposite correct responses: the first is a normal empty filter, the second is a
 * broken control. A cache that resolved both to `[]` would force every caller to
 * guess, and the console's filter bar would silently offer no forms instead of
 * saying it could not load them — the same silent-wrong-answer failure as a
 * swallowed scope error.
 */
export type FormDefinitionsResult = {
  definitions: OrgFormDefinition[];
  failed: boolean;
};

/**
 * One form-definition read per organization per session, shared by every consumer.
 *
 * A report's answers are stored keyed by node key — `form_answers` is the answer
 * tree verbatim, and `dynamic_answers` carries `question_key` as a concrete
 * *instance path* (`vehicles[1].plate`). Neither carries the question's Persian
 * text; that lives in `form_definition.definition.pages[].sections[].nodes[].label`.
 * So rendering a readable answers table needs the definition.
 *
 * It does not need a *new* request. `FORM_DEFINITION_PROJECTION` already asks for
 * `definition: 1` — the whole node tree — because the form builder needs it, and
 * `OrgReportsView` already calls this act to populate the console's filter bar.
 * Anyone who reached a detail page through the console therefore already has the
 * definitions on the wire; this cache is what stops the detail page from asking
 * again.
 *
 * Keyed by organization because the console is org-scoped: two organizations have
 * two different sets of forms and must never see each other's.
 *
 * **A failure never rejects.** Each caller decides what a failure means for it —
 * the filter bar shows its error note, a report's answers section falls back to raw
 * keys — so an unreadable definition degrades one surface instead of turning a
 * report the caller is entitled to read into a red error box.
 *
 * Session-scoped by design: the cache is a module-level `Map`, so it lives as long
 * as the client bundle. A stale cache can show the *current* label for a key, never
 * a wrong value — the answers themselves come from the report, not from here.
 */
const cache = new Map<string, Promise<FormDefinitionsResult>>();

type FormDefinitionRow = {
  _id?: string;
  name?: string;
  icon?: string;
  definition?: FormDefinition;
};

/**
 * Every form definition belonging to one organization.
 *
 * Caches the *promise*, not the resolved value, so several components mounting at
 * once still produce one request rather than a thundering herd.
 */
export function loadOrgFormDefinitions(
  organizationId: string,
): Promise<FormDefinitionsResult> {
  const cached = cache.get(organizationId);
  if (cached) return cached;

  const pending = (async (): Promise<FormDefinitionsResult> => {
    if (!organizationId) return { definitions: [], failed: false };
    try {
      const response = await getFormDefinitions({ set: { organizationId } });
      const envelope = response as { success?: boolean; body?: unknown };
      if (!envelope?.success) return { definitions: [], failed: true };
      return { definitions: toRows(envelope.body), failed: false };
    } catch {
      return { definitions: [], failed: true };
    }
  })();

  cache.set(organizationId, pending);
  return pending;
}

/**
 * Lesan list acts answer with the array directly under `body`; some shapes nest
 * it under `data`. Narrowed here once rather than cast at each call site.
 */
function toRows(body: unknown): OrgFormDefinition[] {
  const list = Array.isArray(body)
    ? body
    : Array.isArray((body as { data?: unknown } | null)?.data)
      ? (body as { data: unknown[] }).data
      : [];

  const out: OrgFormDefinition[] = [];
  for (const entry of list) {
    const row = entry as FormDefinitionRow | null;
    if (row?._id && row.definition) {
      out.push({
        _id: row._id,
        name: row.name,
        icon: row.icon,
        definition: row.definition,
      });
    }
  }
  return out;
}

/**
 * One organization's definitions, indexed by form id.
 *
 * A report names the form it was filed against (`form_definition_id`) and
 * snapshots the version it was answered under (`form_version`). A definition
 * deleted or re-authored since leaves the id unresolvable, so this misses rather
 * than throws — and a miss degrades the answers section to raw keys instead of
 * failing the report.
 */
export async function loadFormDefinitionMap(
  organizationId: string,
): Promise<Map<string, FormDefinition>> {
  const { definitions } = await loadOrgFormDefinitions(organizationId);
  return new Map(definitions.map((row) => [row._id, row.definition]));
}

/** Drop everything. Used by tests. */
export function clearFormDefinitionCache(): void {
  cache.clear();
}