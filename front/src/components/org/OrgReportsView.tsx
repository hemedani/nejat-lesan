"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchOversightList } from "@/app/actions/incident_report/getOversightList";
import { fetchOversightStats } from "@/app/actions/incident_report/getOversightStats";
import { loadOrgFormDefinitions } from "@/services/form-definition-cache";
import { getPatrolErrorMessage } from "@/utils/api-response";
import type {
  OversightFilters,
  OversightRow,
  OversightStats,
} from "@/services/report-sources";
import type { SyncStatus, ReviewStatus } from "@/types/patrol";
import { OversightFilterBar } from "@/components/org/OversightFilterBar";
import { OversightStatsCards } from "@/components/org/OversightStatsCards";
import { OversightTable } from "@/components/org/OversightTable";
import { OversightActionBar } from "@/components/org/OversightActionBar";
import { PageSkeleton, RetryErrorBox, EmptyState } from "@/components/patrol/ui";

const PAGE_SIZE = 25;

/** How long a report may sit in the queue before the ageing card calls it stuck. */
const STUCK_THRESHOLD_HOURS = 24;

const EMPTY_STATS: OversightStats = {
  byOfficer: [],
  byAppVersion: [],
  aging: { queued: 0, under_review: 0, thresholdHours: STUCK_THRESHOLD_HOURS },
};

/**
 * The oversight console, hosted on the reports route.
 *
 * This component used to resolve the organization's road and call
 * `accident.gets({ road: [roadId] })`, but that act filters on `road.**name**`
 * (Persian strings) — an ObjectId never matched, so all three routes rendered an
 * empty list. It also capped at one page and filtered in the browser, which cannot
 * express "these 52,000 reports, page 4".
 *
 * It now hosts the console built alongside it: `incident_report.getOversightList`
 * merges accidents and non-accident reports server-side, pages and filters in Mongo,
 * and `getOversightStats` describes exactly the rows above the table. The route and
 * its nav entry are unchanged; only the host was missing.
 */
export function OrgReportsView({
  orgId,
  detailBase,
  heading,
  subtitle,
}: {
  orgId: string;
  /**
   * Route prefix the report rows link into — `orgRoutes.dashboard()` or
   * `unitHeadRoutes.dashboard()`, i.e. the panel *root*, not the reports page.
   * `OversightTable` appends `/reports/<id>` itself.
   *
   * Required, and deliberately not defaulted. It used to fall back to
   * `/org/${orgId}`, which meant a caller that forgot it silently navigated out
   * of the panel; that fallback is the reason the back button on
   * `/orghead/reports/[id]` pointed at the legacy workspace.
   */
  detailBase: string;
  heading?: string;
  subtitle?: string;
}) {
  return (
    <Suspense fallback={<PageSkeleton blocks={[120, 160, 260]} />}>
      <OrgReportsConsole
        orgId={orgId}
        detailBase={detailBase}
        heading={heading}
        subtitle={subtitle}
      />
    </Suspense>
  );
}

function OrgReportsConsole({
  orgId,
  detailBase,
  heading,
  subtitle,
}: {
  orgId: string;
  detailBase: string;
  heading?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<OversightRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<OversightStats>(EMPTY_STATS);
  const [forms, setForms] = useState<
    Array<{ groupKey: string; title: string; icon?: string }>
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formsError, setFormsError] = useState(false);

  const filter = useMemo(() => parseFilter(searchParams, orgId), [searchParams, orgId]);
  const page = filter.page ?? 1;

  const push = useCallback(
    (next: OversightFilters) => {
      const params = new URLSearchParams();
      params.set("page", String(next.page ?? 1));
      for (const [key, value] of Object.entries(next)) {
        if (key === "page" || key === "organizationId") continue;
        if (Array.isArray(value)) {
          if (value.length > 0) params.set(key, value.join(","));
        } else if (value !== undefined && value !== "" && value !== false) {
          params.set(key, String(value));
        }
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOversightList(filter);
      setRows(result.rows);
      setTotal(result.total);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(
        await fetchOversightStats({
          ...filter,
          thresholdHours: STUCK_THRESHOLD_HOURS,
        }),
      );
    } catch {
      // The table is the source of truth. A failed statistics panel must not blank
      // it, so the cards fall back to zeroes rather than replacing the view.
    } finally {
      setStatsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // The filter bar's form list is the one option set with no console act behind it,
  // so it is read straight from the definitions this organization authored. Its
  // failure is a footnote only — every other control still works without it.
  //
  // Through the shared cache rather than the act directly, because a report detail
  // page needs the same definitions to label a non-accident report's answers.
  // `loadOrgFormDefinitions` caches one read per organization for the session, so
  // the second surface costs nothing.
  useEffect(() => {
    let cancelled = false;
    void loadOrgFormDefinitions(orgId).then(({ definitions, failed }) => {
      if (cancelled) return;
      setForms(
        definitions.map((form) => ({
          groupKey: form._id,
          title: form.name ?? form._id,
          icon: form.icon,
        })),
      );
      setFormsError(failed);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // A new page or filter invalidates the selection: the ids on screen are gone.
  useEffect(() => {
    setSelected([]);
  }, [filter]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadStats()]);
  }, [load, loadStats]);

  const changeFilter = useCallback(
    (next: OversightFilters) => push({ ...next, page: 1 }),
    [push],
  );

  const officers = useMemo(
    () =>
      stats.byOfficer
        .filter((stat) => !stat.unattributed && stat.officer_id)
        .map((stat) => ({
          _id: stat.officer_id,
          label: [stat.first_name, stat.last_name]
            .filter(Boolean)
            .join(" ") || stat.personnel_code || stat.officer_id,
        })),
    [stats.byOfficer],
  );

  const appVersions = useMemo(
    () =>
      stats.byAppVersion
        .map((stat) => stat.app_version)
        .filter((version): version is string => Boolean(version)),
    [stats.byAppVersion],
  );

  const pageIds = useMemo(() => rows.map((row) => row._id), [rows]);

  const toggle = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }, []);

  const togglePage = useCallback(() => {
    setSelected((current) => {
      const allSelected = pageIds.every((id) => current.includes(id));
      return allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])];
    });
  }, [pageIds]);

  /**
   * How an id reads, for rows the reviewer selected but that are no longer on the
   * page — the action bar labels its confirmation from this, so an id it cannot
   * name is one it cannot safely act on.
   */
  const labelFor = useCallback(
    (id: string) => {
      const row = rows.find((candidate) => candidate._id === id);
      if (!row) return id;
      return row.report_id || row.serial?.toString() || id;
    },
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const headingText = heading || "گزارش‌های رخداد";
  const subtitleText =
    subtitle ||
    "تصادف‌ها و گزارش‌های رخداد ثبت‌شده در این سازمان، با فیلتر و بازبینی گروهی.";

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">گزارش‌های رخداد</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{headingText}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitleText}</p>
        </div>
      </div>

      <OversightStatsCards
        byOfficer={stats.byOfficer}
        byAppVersion={stats.byAppVersion}
        aging={stats.aging}
        loading={statsLoading}
      />

      <OversightFilterBar
        value={filter}
        forms={forms}
        officers={officers}
        appVersions={appVersions}
        onChange={changeFilter}
        onReset={() => push({ page: 1 })}
        formsError={formsError}
      />

      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton blocks={[260]} />
      ) : rows.length === 0 ? (
        <EmptyState message="گزارشی با این فیلتر یافت نشد." />
      ) : (
        <>
          <OversightTable
            rows={rows}
            detailBase={detailBase}
            selected={selected}
            onToggle={toggle}
            onTogglePage={togglePage}
          />

          {total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => push({ ...filter, page: page - 1 })}
                className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                صفحه قبل
              </button>
              <span className="text-xs text-slate-500">
                صفحه {page.toLocaleString("fa-IR")} از{" "}
                {totalPages.toLocaleString("fa-IR")} ·{" "}
                {total.toLocaleString("fa-IR")} گزارش
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => push({ ...filter, page: page + 1 })}
                className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                صفحه بعد
              </button>
            </div>
          )}
        </>
      )}

      <OversightActionBar
        selected={selected}
        presentedIds={new Set(pageIds)}
        filter={filter}
        total={total}
        labelFor={labelFor}
        onSelectionChange={setSelected}
        onRefresh={refresh}
      />
    </div>
  );
}

/** URL query → the console's filter object. `organizationId` is never read from the URL. */
function parseFilter(
  searchParams: { get(key: string): string | null },
  orgId: string,
): OversightFilters {
  const list = (key: string): string[] | undefined => {
    const raw = searchParams.get(key);
    if (!raw) return undefined;
    const values = raw.split(",").filter(Boolean);
    return values.length > 0 ? values : undefined;
  };

  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);

  return {
    organizationId: orgId,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: PAGE_SIZE,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    groupKeys: list("groupKeys"),
    syncStatus: list("syncStatus") as SyncStatus[] | undefined,
    reviewStatus: list("reviewStatus") as ReviewStatus[] | undefined,
    officerIds: list("officerIds"),
    appVersions: list("appVersions"),
    unlinkedOnly: searchParams.get("unlinkedOnly") === "true" || undefined,
    search: searchParams.get("search") || undefined,
  };
}