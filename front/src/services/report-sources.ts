import type { ReviewStatus, SyncStatus } from "@/types/patrol";

/**
 * The console's label for the accident collection.
 *
 * A row in the oversight console comes from either report model — accidents and
 * non-accident reports are separate collections, but a reviewer should not have to
 * learn that road damage lives somewhere else. `OversightRow.source` says which one
 * a row came from, and `group_title` is the human label for it: accidents are always
 * «تصادف», while a non-accident report carries the title of the form it was filed
 * under, snapshotted onto the report when it was created.
 */
export const ACCIDENT_GROUP_TITLE = "تصادف";

// ---------------------------------------------------------------------------
// Oversight console — shapes only
//
// The fetches for these live in `src/app/actions/incident_report/*Oversight*`
// and `reviewReports`, not here: they need `cookies()` and `AppApi()`, both of
// which are server-only, and this module is imported by client components.
// ---------------------------------------------------------------------------

/**
 * One row of `incident_report.getOversightList`.
 *
 * Mirrors the backend's `ROW_PROJECTION` field for field, so the list the
 * oversight console renders is the one the backend actually built rather than
 * two collections merged and filtered in the browser. `sort_at` is precomputed
 * server-side because the two collections disagree about what "when" means —
 * an accident sorts on `date_of_accident`, a report on `occurred_at`/`reported_at`.
 */
export type OversightRow = {
  _id: string;
  source: "accident" | "incident_report";
  sort_at?: string;
  /** `accident`, or a form definition id. */
  group_key?: string;
  group_title?: string;
  group_icon?: string;
  report_id?: string;
  serial?: number;
  sync_status?: SyncStatus;
  rejection_reason?: string;
  review_status?: ReviewStatus;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  location?: { type?: string; coordinates?: number[] };
  kilometer?: number;
  meter?: number;
  description?: string;
  submitted_from?: { app_version?: string; platform?: "ios" | "android" };
  form_definition_id?: string;
  organization?: { _id?: string };
  officer?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    personnel_code?: string;
  };
  patrol_unit?: { _id?: string; name?: string };
  road?: { _id?: string; name?: string };
  type?: { _id?: string; name?: string };
  incident_severity?: { _id?: string; name?: string };
};

/**
 * The console's filter set, in camelCase.
 *
 * `page`/`limit` are the only members `getOversightStats` does not take — a count
 * has no page — and `thresholdHours` is the one only it takes. Everything else is
 * shared, so the statistics sitting above the table always describe the table.
 */
export type OversightFilters = {
  organizationId?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  groupKeys?: string[];
  syncStatus?: SyncStatus[];
  reviewStatus?: ReviewStatus[];
  officerIds?: string[];
  appVersions?: string[];
  unlinkedOnly?: boolean;
  search?: string;
};

/** One row of `incident_report.getOversightStats`'s `byOfficer` block. */
export type OversightOfficerStat = {
  officer_id: string;
  /** True for the catch-all bucket rather than a person. */
  unattributed: boolean;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  total: number;
  queued: number;
  rejected: number;
  returned: number;
  approved: number;
  completed: number;
  first_reported_at?: string | null;
  last_reported_at?: string | null;
  /** Null when no row carried a sync instant — never 0. */
  median_sync_ms: number | null;
};

/** One row of `getOversightStats`'s `byAppVersion` block. */
export type OversightAppVersionStat = {
  app_version: string;
  total: number;
  rejected: number;
  distinct_officers: number;
};

/** How long a report may stall before it counts as stuck. */
export type OversightAgingStat = {
  queued: number;
  under_review: number;
  thresholdHours: number;
};

export type OversightStats = {
  byOfficer: OversightOfficerStat[];
  byAppVersion: OversightAppVersionStat[];
  aging: OversightAgingStat;
};

/**
 * One row of `incident_report.reviewReports`.
 *
 * A batch is never all-or-nothing: the action reports per row so a reviewer sees
 * which of forty reports could not move and why.
 */
export type ReviewOutcome = {
  reportId: string;
  ok: boolean;
  error?: string;
  review_status?: ReviewStatus;
};
