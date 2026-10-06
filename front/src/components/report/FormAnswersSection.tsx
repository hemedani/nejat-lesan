"use client";

import { useEffect, useMemo, useState } from "react";
import { isEmptyAnswer, resolvePath, walkNodes } from "@forms";
import type { AnswerTree, AnswerValue, FieldNode, FormDefinition } from "@forms";
import type { ReportDetailDoc } from "@/types/report-detail";
import { loadFormDefinitionMap } from "@/services/form-definition-cache";
import { PanelCard } from "@/components/patrol/ui";
import { SectionTitle } from "@/components/report/kit";

/**
 * A non-accident report's answers, as the officer's own questions.
 *
 * `incident_report.form_answers` is the answer tree **verbatim** — keyed by node
 * key, repeatable nodes mapped to arrays of row objects. What it does not carry is
 * the Persian text of the questions, which lives only in the form definition.
 * So this walks the definition's tree alongside the answers with the shared
 * engine's `walkNodes`, which yields each field's concrete `instancePath`
 * (`vehicles[1].plate`) and its enclosing repeatable scope.
 *
 * Using the engine's own walker rather than flattening the answer object is what
 * makes a repeatable group readable: a flattened `{vehicles: [...]}` prints as one
 * opaque row, while the walk emits one labelled line per row, prefixed with the
 * group's `itemLabel` and the row number.
 *
 * ## Why the definition is fetched at all, and why it usually is not
 *
 * The labels are not in the report. They are fetched by
 * `loadFormDefinitionMap`, which caches **one** read per organization for the
 * session — and `OrgReportsView` already makes exactly that read to populate the
 * console's filter bar. Arriving here from the console therefore costs nothing.
 * A direct navigation to a detail URL costs one fetch, once.
 *
 * ## Degradation
 *
 * No definition — deleted, re-authored under a new id, or belonging to another
 * organization — and the section falls back to listing the answer tree's own
 * leaves with their raw keys. That is ugly, and it is honest: a fabricated label
 * would be worse than a visible key, because a wrong label reads as authoritative.
 */
export function FormAnswersSection({
  report,
  organizationId,
}: {
  report: ReportDetailDoc;
  organizationId?: string;
}) {
  const [definition, setDefinition] = useState<FormDefinition | undefined>();

  const formDefinitionId = report.form_definition_id;
  useEffect(() => {
    if (!organizationId || !formDefinitionId) return;
    let cancelled = false;
    void loadFormDefinitionMap(organizationId).then((byId) => {
      if (!cancelled) setDefinition(byId.get(formDefinitionId));
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, formDefinitionId]);

  const answers = report.form_answers as AnswerTree | undefined;

  const rows = useMemo(
    () => (definition && answers ? labelledRows(definition, answers) : []),
    [definition, answers],
  );

  const description = report.description?.trim();

  return (
    <PanelCard>
      <SectionTitle count={definition ? rows.length : undefined}>
        پاسخ‌های فرم
      </SectionTitle>

      {description && (
        <p className="mb-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm leading-7 text-slate-200">
          {description}
        </p>
      )}

      {report.temporary_action && (
        <p className="mb-3 rounded-xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs leading-6 text-sky-100">
          اقدام موقت: {report.temporary_action}
        </p>
      )}

      {rows.length > 0 ? (
        <dl className="divide-y divide-white/5">
          {rows.map((row) => (
            <div key={row.path} className="flex flex-wrap gap-x-3 gap-y-1 py-2">
              <dt className="min-w-[9rem] text-xs text-slate-500">
                {row.groupLabel && (
                  <span className="ml-1.5 text-slate-600">{row.groupLabel}</span>
                )}
                {row.label}
              </dt>
              <dd className="flex-1 text-xs leading-6 text-slate-200">{row.text}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <FallbackAnswers answers={answers} hasDefinition={Boolean(definition)} />
      )}
    </PanelCard>
  );
}

type AnswerRow = { path: string; label: string; groupLabel?: string; text: string };

/** One labelled line per answered field, in the order the form asks them. */
function labelledRows(
  definition: FormDefinition,
  answers: AnswerTree,
): AnswerRow[] {
  const rows: AnswerRow[] = [];
  // `walkNodes` visits a field once per *instance*, so a two-row repeatable
  // yields two rows with distinct `instancePath`s — which is the key used here.
  walkNodes(definition, answers, (node, meta) => {
    if (node.kind !== "field") return;
    const field = node as FieldNode;
    const value = resolvePath(answers, meta.instancePath)[0];
    if (value === undefined || isEmptyAnswer(value)) return;

    rows.push({
      path: meta.instancePath,
      label: field.label || field.key,
      groupLabel: groupLabel(meta.repeatable?.label, meta.rowIndex),
      text: readValue(field, value),
    });
  });
  return rows;
}

const groupLabel = (
  label: string | undefined,
  rowIndex: number | undefined,
): string | undefined =>
  label && rowIndex !== undefined ? `${label} ${rowIndex + 1} —` : undefined;

/**
 * An answer as text.
 *
 * A `select` stores its option *value*; the officer saw the option's *label*. The
 * definition carries both, so the label is what gets shown — otherwise a form
 * whose options are ids (`opt_a`, `opt_b`) renders as ids on the review screen.
 */
function readValue(field: FieldNode, value: AnswerValue): string {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => optionLabel(field, item))
      .filter((text): text is string => text.length > 0);
    return items.length ? items.join("، ") : "—";
  }
  if (value !== null && typeof value === "object") {
    // An unexpanded container: every child is empty, so there is nothing to say.
    return "—";
  }
  return optionLabel(field, value);
}

function optionLabel(field: FieldNode, value: AnswerValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "—";
  const raw = String(value);
  if (field.options?.kind === "literal") {
    return field.options.items?.find((item) => item.value === raw)?.label ?? raw;
  }
  // Persian digits. A number is the common case for a `number` field, and
  // `String(1400)` would be the one Latin-numeral value on an otherwise Persian
  // page. Booleans are spelled out rather than stringified: `String(false)` reads
  // as "false" on a Persian screen. A boolean field's options are the literal
  // values «بله»/«خیر», so this only fires if one was stored as a real boolean.
  if (typeof value === "number") return value.toLocaleString("fa-IR");
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  return raw;
}

/**
 * No definition to label against — list the tree's own leaves.
 *
 * Skips containers (an object with no scalar leaves is a group, and printing it as
 * `[object Object]` is noise), and flattens nested repeatables to
 * `key[0].field` so two rows of the same group stay distinguishable.
 */
function FallbackAnswers({
  answers,
  hasDefinition,
}: {
  answers?: AnswerTree;
  hasDefinition: boolean;
}) {
  const rows = useMemo(
    () => (answers ? rawLeaves(answers) : []),
    [answers],
  );

  if (!answers || rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {hasDefinition
          ? "پاسخی برای این گزارش ثبت نشده است."
          : "برای این گزارش پاسخی ثبت نشده یا تعریف فرم در دسترس نیست."}
      </p>
    );
  }

  return (
    <>
      {!hasDefinition && (
        <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-6 text-amber-100">
          تعریف فرم این گزارش در دسترس نیست، بنابراین پاسخ‌ها با کلید خام نمایش داده
          می‌شوند.
        </p>
      )}
      <dl className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.path} className="flex flex-wrap gap-x-3 gap-y-1 py-2">
            <dt className="min-w-[9rem] text-xs text-slate-500" dir="ltr">
              {row.path}
            </dt>
            <dd className="flex-1 text-xs leading-6 text-slate-200">{row.text}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function rawLeaves(tree: AnswerTree, prefix = ""): AnswerRow[] {
  const rows: AnswerRow[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const rowPath = `${path}[${index}]`;
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          rows.push(...rawLeaves(item as AnswerTree, rowPath));
        } else if (item !== null && item !== undefined) {
          rows.push({ path: rowPath, label: key, text: String(item) });
        }
      });
      continue;
    }
    if (value !== null && typeof value === "object") {
      const nested = rawLeaves(value as AnswerTree, path);
      // An object with no scalar leaves is a group node, not an answer.
      if (nested.length > 0) rows.push(...nested);
      continue;
    }
    if (value === null || value === undefined) continue;
    rows.push({ path, label: key, text: String(value) });
  }
  return rows;
}