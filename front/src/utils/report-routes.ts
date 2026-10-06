import type { ReportSource } from "@/types/report-detail";

/**
 * The report-detail URL, wherever the console is hosted, and the reader for the
 * one parameter it carries.
 *
 * `OversightTable` is shared by the org-head and unit-head panels, so it cannot
 * know which one it is rendering into — it is handed a `detailBase` and appends
 * to it. That made it a URL builder living inside a component, which is the one
 * shape the route-builder invariant is meant to exclude: a template literal with
 * `${base}` cannot be caught by grepping for a literal path, so it would have
 * survived every check while still being the string that decides where a click
 * lands.
 *
 * `?source=` carries the kind because nothing in the id says which collection the
 * row came from: both halves of the console link into the same `[reportId]` route,
 * and the detail view resolves the id through that model's own act. It is in the
 * URL rather than in component state so a reload, a bookmark and a link shared
 * with a colleague all open the same record, and it is written for accidents too
 * — an explicit value is one a reader can check, where an absent one is an
 * assumption.
 *
 * `base` is a panel *root* (`orgRoutes.dashboard()`, `unitHeadRoutes.dashboard()`),
 * not the reports page.
 */
export function reportDetailHref(
  base: string,
  reportId: string,
  source: ReportSource,
): string {
  return `${base}/reports/${reportId}?source=${source}`;
}

/**
 * Read a `?source=` value back.
 *
 * Sits beside the builder that writes it because the pair is one contract: a
 * value `reportDetailHref` can produce and `parseReportSource` cannot read would
 * make a report unreachable, not merely untidy.
 *
 * Defaults to `accident`, which is the safe direction — the legacy `accident`
 * collection holds the overwhelming majority of reports, so a hand-typed or
 * bookmarked URL with no parameter opens a report rather than erroring. An
 * *unrecognised* value falls back the same way rather than being trusted: this
 * parameter decides which collection gets queried, so a string that arrived from
 * anywhere but `reportDetailHref` must not become one, and a typo must not turn
 * into an opaque backend validation error.
 */
export function parseReportSource(
  raw: string | null | undefined,
): ReportSource {
  return raw === "incident_report" ? "incident_report" : "accident";
}