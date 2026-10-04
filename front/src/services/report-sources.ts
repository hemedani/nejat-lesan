import { gets as getAccidents } from "@/app/actions/accident/gets";
import { getIncidentReports } from "@/app/actions/incident_report/gets";
import { unwrapApiResponse } from "@/utils/api-response";

/**
 * One row in the review console, from either report model.
 *
 * Accidents and non-accident reports are separate collections, but the console
 * reviews both — an organization head should not have to learn that road damage
 * lives somewhere else. `source` says which collection a row came from, and
 * `groupTitle` is the human label a filter pill shows: accidents are always
 * «تصادف», while a non-accident report carries the title of the form it was filed
 * under, snapshotted onto the report when it was created.
 */
export type MergedReport = {
  _id: string;
  source: "accident" | "incident_report";
  /** Stable key for filtering: `accident`, or `incident_report:<title>`. */
  groupKey: string;
  groupTitle: string;
  groupIcon?: string;
  report_id?: string;
  serial?: number;
  reported_at?: string;
  date_of_accident?: string;
  occurred_at?: string;
  sync_status?: SyncStatus;
  rejection_reason?: string;
  review_status?: ReviewStatus;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  location?: { type?: string; coordinates?: number[] };
  kilometer?: number;
  meter?: number;
  travel_direction?: string;
  description?: string;
  /** Snapshotted from the form the report was filed under. */
  form_definition_id?: string;
  form_title?: string;
  form_icon?: string;
  incident_severity?: { _id?: string; name?: string };
  type?: { _id?: string; name?: string };
  collision_type?: { _id?: string; name?: string };
  officer?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    personnel_code?: string;
  };
  patrol_unit?: { _id?: string; code?: string; name?: string };
  vehicle?: { _id?: string; plaque_no?: string };
};

export const ACCIDENT_GROUP_TITLE = "تصادف";
export const ACCIDENT_GROUP_KEY = "accident";

const accidentProjection = {
  _id: 1,
  report_id: 1,
  serial: 1,
  reported_at: 1,
  date_of_accident: 1,
  sync_status: 1,
  rejection_reason: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  location: 1,
  kilometer: 1,
  meter: 1,
  travel_direction: 1,
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 },
  vehicle: { _id: 1, plaque_no: 1 },
  type: { _id: 1, name: 1 },
  collision_type: { _id: 1, name: 1 },
} as const;

const incidentReportProjection = {
  _id: 1,
  report_id: 1,
  serial: 1,
  reported_at: 1,
  occurred_at: 1,
  sync_status: 1,
  rejection_reason: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  location: 1,
  kilometer: 1,
  meter: 1,
  travel_direction: 1,
  description: 1,
  form_definition_id: 1,
  form_title: 1,
  form_icon: 1,
  incident_severity: { _id: 1, name: 1 },
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 },
  vehicle: { _id: 1, plaque_no: 1 },
} as const;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/**
 * Fetch both report collections and merge them newest-first.
 *
 * The two requests are independent, so they run together; a failure on either side
 * still returns whatever the other produced rather than blanking the console. A
 * report collection can be unavailable for reasons that have nothing to do with the
 * other — a module licence, for instance.
 */
export async function fetchMergedReports(options: {
  limit?: number;
  /** Road id, for the org-scoped views. */
  road?: string[];
}): Promise<{ reports: MergedReport[]; partial: boolean }> {
  const limit = options.limit ?? 200;
  const set = {
    page: 1,
    limit,
    ...(options.road?.length ? { road: options.road } : {}),
  };

  const [accidents, reports] = await Promise.allSettled([
    getAccidents({ set, get: accidentProjection as never }),
    getIncidentReports({ set, get: incidentReportProjection as never }),
  ]);

  const merged: MergedReport[] = [];
  let partial = false;

  if (accidents.status === "fulfilled") {
    for (const row of unwrapApiResponse<MergedReport[]>(accidents.value) ?? []) {
      merged.push({
        ...row,
        _id: String(row._id),
        source: "accident",
        groupKey: ACCIDENT_GROUP_KEY,
        groupTitle: ACCIDENT_GROUP_TITLE,
      });
    }
  } else {
    partial = true;
  }

  if (reports.status === "fulfilled") {
    for (const row of unwrapApiResponse<MergedReport[]>(reports.value) ?? []) {
      // A report always stores the title of its form, so a report stays readable
      // after that form is renamed or archived.
      const title = asString(row.form_title) ?? "فرم";
      merged.push({
        ...row,
        _id: String(row._id),
        source: "incident_report",
        groupKey: `${ACCIDENT_GROUP_KEY}:${title}`,
        groupTitle: title,
        groupIcon: asString(row.form_icon),
      });
    }
  } else {
    partial = true;
  }

  merged.sort((a, b) => {
    const left = new Date(a.reported_at ?? a.occurred_at ?? 0).getTime();
    const right = new Date(b.reported_at ?? b.occurred_at ?? 0).getTime();
    return right - left;
  });

  return { reports: merged, partial };
}

/** The distinct groups present in a merged list, accidents first. */
export function reportGroups(
  reports: MergedReport[],
): Array<{ key: string; title: string; icon?: string; count: number }> {
  const seen = new Map<string, { title: string; icon?: string; count: number }>();
  for (const report of reports) {
    const entry = seen.get(report.groupKey) ?? {
      title: report.groupTitle,
      icon: report.groupIcon,
      count: 0,
    };
    entry.count += 1;
    seen.set(report.groupKey, entry);
  }
  return [...seen.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      if (a.key === ACCIDENT_GROUP_KEY) return -1;
      if (b.key === ACCIDENT_GROUP_KEY) return 1;
      return a.title.localeCompare(b.title, "fa");
    });
}

// ---------------------------------------------------------------------------
// Dashboard and review-queue merging
// ---------------------------------------------------------------------------

import type { ReviewStatus, SyncStatus } from "@/types/patrol";

import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { getManagerReports } from "@/app/actions/accident/getManagerReports";
import { getIncidentReporterDashboard } from "@/app/actions/incident_report/getReporterDashboard";
import { getIncidentManagerReports } from "@/app/actions/incident_report/getManagerReports";

const tagAccidents = (rows: MergedReport[]): MergedReport[] =>
  rows.map((row) => ({
    ...row,
    _id: String(row._id),
    source: "accident" as const,
    groupKey: ACCIDENT_GROUP_KEY,
    groupTitle: ACCIDENT_GROUP_TITLE,
  }));

const tagReports = (rows: MergedReport[]): MergedReport[] =>
  rows.map((row) => {
    const title = asString(row.form_title) ?? "فرم";
    return {
      ...row,
      _id: String(row._id),
      source: "incident_report" as const,
      groupKey: `${ACCIDENT_GROUP_KEY}:${title}`,
      groupTitle: title,
      groupIcon: asString(row.form_icon),
    };
  });

const newestFirst = (rows: MergedReport[]): MergedReport[] =>
  [...rows].sort((a, b) => {
    const left = new Date(a.reported_at ?? a.occurred_at ?? 0).getTime();
    const right = new Date(b.reported_at ?? b.occurred_at ?? 0).getTime();
    return right - left;
  });

/**
 * The officer's report list: accidents plus their non-accident reports.
 *
 * Each dashboard act covers one collection, so the console merges both. A failure
 * on one side still shows the other rather than an empty page.
 */
export async function fetchReporterReports(limit = 50): Promise<MergedReport[]> {
  const [accidents, reports] = await Promise.allSettled([
    getReporterDashboard({ set: { page: 1, limit } }),
    getIncidentReporterDashboard({ set: { page: 1, limit } }),
  ]);

  const rows: MergedReport[] = [];
  if (accidents.status === "fulfilled") {
    const body = unwrapApiResponse<{ recentReports?: MergedReport[] }>(
      accidents.value,
    );
    rows.push(...tagAccidents(body?.recentReports ?? []));
  }
  if (reports.status === "fulfilled") {
    const body = unwrapApiResponse<{ recentReports?: MergedReport[] }>(
      reports.value,
    );
    rows.push(...tagReports(body?.recentReports ?? []));
  }
  return newestFirst(rows);
}

/** The same, for an organization head or manager. */
export async function fetchManagerReports(
  set: {
    reviewStatus?: ReviewStatus;
    syncStatus?: SyncStatus;
    userId?: string;
  },
  limit = 100,
): Promise<MergedReport[]> {
  const params = {
    page: 1,
    limit,
    ...(set.reviewStatus ? { reviewStatus: set.reviewStatus } : {}),
    ...(set.syncStatus ? { syncStatus: set.syncStatus } : {}),
    ...(set.userId ? { userId: set.userId } : {}),
  };

  const [accidents, reports] = await Promise.allSettled([
    getManagerReports({ set: params, get: {} }),
    getIncidentManagerReports({ set: params }),
  ]);

  const rows: MergedReport[] = [];
  if (accidents.status === "fulfilled") {
    rows.push(...tagAccidents(unwrapApiResponse<MergedReport[]>(accidents.value) ?? []));
  }
  if (reports.status === "fulfilled") {
    rows.push(...tagReports(unwrapApiResponse<MergedReport[]>(reports.value) ?? []));
  }
  return newestFirst(rows);
}

/**
 * Sync-state buckets across both collections, for the dashboard widget.
 *
 * Without the second source the widget would quietly stop counting every report
 * that is not an accident — the same silent shortfall that motivated the split.
 */
export async function fetchSyncStatus(
  set: { userId?: string } = {},
): Promise<Record<string, number>> {
  const { getSyncStatus: getAccidentSyncStatus } = await import(
    "@/app/actions/accident/getSyncStatus"
  );
  const { getIncidentSyncStatus } = await import(
    "@/app/actions/incident_report/getSyncStatus"
  );

  const [accidents, reports] = await Promise.allSettled([
    getAccidentSyncStatus({ set, get: { _id: 1 } }),
    getIncidentSyncStatus({ set }),
  ]);

  const out: Record<string, number> = {};
  const accumulate = (value: unknown) => {
    const body = (value as { body?: Record<string, unknown[]> })?.body ??
      unwrapApiResponse<Record<string, unknown[]>>(value);
    for (const [status, rows] of Object.entries(body ?? {})) {
      if (!Array.isArray(rows)) continue;
      out[status] = (out[status] ?? 0) + rows.length;
    }
  };
  if (accidents.status === "fulfilled") accumulate(accidents.value);
  if (reports.status === "fulfilled") accumulate(reports.value);
  return out;
}

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
