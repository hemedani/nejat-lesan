import type { OversightRow } from "./report-sources";

/**
 * Stands in for a value that is genuinely absent, so an empty cell is never
 * ambiguous between "nobody filled this in" and "this column does not apply".
 * An em dash rather than a blank or a literal `null`.
 */
const ABSENT = "—";

/**
 * One cell, before quoting.
 *
 * `labels` maps a raw value to the word the console shows for it — `synced` to
 * «همگام‌شده», `accident` to «تصادف» — so the export reads in the same language as
 * the screen it came from. Keyed by value, as `MODULE_LABELS` and
 * `INCIDENT_TYPE_LABELS` already are. An unmapped value is passed through, which
 * keeps a new status working before its label exists.
 *
 * Pass it only for a column whose values come from an enum. See the note in
 * `reportsToCsv` for what happens when it is passed for one a person typed.
 */
const cell = (
  value: string | number | null | undefined,
  labels?: Record<string, string>,
): string => {
  if (value === null || value === undefined || value === "") return ABSENT;
  const raw = String(value);
  return labels?.[raw] ?? raw;
};

/** RFC 4180: wrap in quotes when the value carries one, and double any quote inside. */
const quote = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const HEADERS = [
  "report_id",
  "source",
  "form",
  "date",
  "sync_status",
  "review_status",
  "review_reason",
  "officer",
  "personnel_code",
  "patrol_unit",
  "road",
  "kilometer",
  "description",
  "app_version",
  "platform",
] as const;

/**
 * Render a page of oversight rows as CSV.
 *
 * The BOM is not optional: without it Excel opens Persian text as mojibake, which
 * makes the export look broken on the machines most likely to receive it.
 */
export const reportsToCsv = (
  rows: OversightRow[],
  labels?: Record<string, string>,
): string => {
  const lines = rows.map((row) =>
    [
      // Only the enum columns are translated. `description`, `review_reason`, the
      // officer's name and the road name are free text a person typed, and a
      // shared labels map keyed by value would rewrite them the moment one of
      // them happened to read like a status word — a description saying
      // "returned" would leave this export as «برگشت برای اصلاح», in an official
      // document, silently. A label that cannot apply is worse than no label.
      cell(row.report_id),
      cell(row.source, labels),
      cell(row.group_title),
      cell(row.sort_at),
      cell(row.sync_status, labels),
      cell(row.review_status, labels),
      cell(row.review_reason),
      cell([row.officer?.first_name, row.officer?.last_name].filter(Boolean).join(" ")),
      cell(row.officer?.personnel_code),
      cell(row.patrol_unit?.name),
      cell(row.road?.name),
      cell(row.kilometer),
      cell(row.description),
      cell(row.submitted_from?.app_version),
      cell(row.submitted_from?.platform, labels),
    ]
      .map(quote)
      .join(","),
  );

  // The header is joined as a line of its own rather than concatenated ahead of
  // the rows: `header + "\n" + rows.join("\n") + "\n"` leaves a stray blank
  // line when `rows` is empty, which a reader opening an empty export sees as a
  // malformed file rather than as "nothing matched".
  return `\uFEFF${[HEADERS.join(","), ...lines].join("\n")}\n`;
};