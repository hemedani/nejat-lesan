"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { reportDetailHref } from "@/utils/report-routes";

import { FormIcon } from "@/components/org/forms/FormIcon";
import { StatusBadge } from "@/components/patrol/StatusBadge";
import { formatDate, fullName, reportSourceTone } from "@/components/patrol/ReportList";
import type { OversightRow } from "@/services/report-sources";

const cell = "px-4 py-4";

/** How a row names itself, everywhere in the console. Exported so the action bar's
 *  refusal summary and the view's id→label map say the same thing as the table. */
export const reportLabel = (row: OversightRow): string =>
  row.report_id || (row.serial ? `#${row.serial}` : `#${row._id.slice(-6)}`);

/**
 * Where a row's detail page is.
 *
 * `?source=` carries the kind because nothing in the id says which collection it came
 * from: both halves of the console link into the same `[reportId]` route, and the
 * detail view resolves the id through that model's own act. It is in the URL rather
 * than in component state so a reload, a bookmark and a link shared with a colleague
 * all open the same record, and it is written for accidents too — an explicit value
 * is one a reader can check, where an absent one is an assumption.
 */
/**
 * Whether this viewer may open a report's detail page.
 *
 * The oversight *list* is scoped by `resolveOversightScope`, which handles org
 * leaders through `getOrgReportBase`. The *detail* fetch is not:
 * `accident.getReportReviewHistory` uses `getReportScope`, which throws for
 * OrgHead/UnitHead. Offering an org leader a link that cannot resolve is worse
 * than showing the row's label as plain text.
 *
 * One predicate rather than an inline level check at each of the four call
 * sites. `back/prompt/02-fix-review-history-scope-for-org-leaders.md` is the
 * server-side fix; when it lands this returns `true` for everyone.
 */
export const canOpenReportDetail = (level: string | null): boolean =>
  level === "Manager" || level === "Ghost";

/**
 * A row's identifier, linked when the viewer can open it and inert when not.
 *
 * Wrapping the decision here rather than at four call sites means the fallback
 * cannot be forgotten: every surface that would have shown a dead link now shows
 * the same label in the same place, just not clickable.
 */
function RowLink({
  row,
  base,
  className,
  title,
  children,
}: {
  row: OversightRow;
  base: string;
  className: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { userLevel } = useAuth();
  if (!canOpenReportDetail(userLevel)) {
    return (
      <span className={`${className} cursor-default text-slate-400`} title={title}>
        {children}
      </span>
    );
  }
  return (
    <Link href={reportDetailHref(base, row._id, row.source)} className={className} title={title}>
      {children}
    </Link>
  );
}

/** Exported for the CSV export's `platform` column, which must not re-invent it. */
export const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "اندروید",
};

/**
 * Where a report came from: the build of the app it was filed on.
 *
 * An em dash for a report the app did not file — the ~52,000 existing accidents,
 * the web console's own entries — and a different one for an app submission whose
 * version was never recorded. Those are different failures and the column exists to
 * tell them apart: the first means "no provenance to ask for", the second means the
 * app filed it and lost the stamp.
 */
function Provenance({ row }: { row: OversightRow }) {
  const submitted = row.submitted_from;
  const note = !submitted
    ? "خارج از اپلیکیشن"
    : !submitted.app_version
      ? "نسخهٔ اپ ثبت نشده"
      : null;

  return (
    <div className="whitespace-nowrap">
      <p className="text-xs text-slate-200" dir={submitted?.app_version ? "ltr" : "rtl"}>
        {submitted?.app_version ?? "—"}
      </p>
      <p className="text-[10px] text-slate-500">
        {note ?? (submitted?.platform ? PLATFORM_LABELS[submitted.platform] ?? "—" : "—")}
      </p>
    </div>
  );
}

/**
 * The oversight table.
 *
 * Selection lives in the parent rather than here, and the parent drops it on every
 * change of the presented rows — its own filter and page controls, a `Link` push, the
 * browser's back/forward — so what is ticked is always what is on screen, and the
 * header "select all on this page" is honest about its scope rather than promising a
 * cross-page selection the console no longer keeps.
 */
export function OversightTable({
  rows,
  detailBase,
  selected,
  onToggle,
  onTogglePage,
}: {
  rows: OversightRow[];
  detailBase: string;
  selected: string[];
  onToggle: (id: string) => void;
  onTogglePage: () => void;
}) {
  const selectedOnPage = rows.filter((row) => selected.includes(row._id)).length;
  const allOnPageSelected = rows.length > 0 && selectedOnPage === rows.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-white/10 bg-white/[.03] text-xs text-slate-500">
            <tr>
              <th scope="col" className={`${cell} w-10`}>
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  aria-label="انتخاب همهٔ گزارش‌های این صفحه"
                  checked={allOnPageSelected}
                  onChange={onTogglePage}
                />
              </th>
              {["گزارش", "گزارش‌دهنده", "تاریخ", "همگام‌سازی", "بررسی", "ثبت از اپ", ""].map(
                (heading) => (
                  <th key={heading} scope="col" className={`${cell} font-medium`}>
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr
                key={row._id}
                className={`text-slate-300 transition hover:bg-white/[.03] ${
                  selected.includes(row._id) ? "bg-blue-400/5" : ""
                }`}
              >
                <td className={cell}>
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    aria-label={`انتخاب گزارش ${reportLabel(row)}`}
                    checked={selected.includes(row._id)}
                    onChange={() => onToggle(row._id)}
                  />
                </td>
                <td className={cell}>
                  <RowLink
                    row={row}
                    base={detailBase}
                    className="font-semibold text-blue-200 hover:text-cyan-200"
                  >
                    {reportLabel(row)}
                  </RowLink>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                        reportSourceTone(row.source)
                      }`}
                    >
                      <FormIcon name={row.group_icon} size={11} />
                      {row.group_title ?? "فرم"}
                    </span>
                    {row.incident_severity?.name && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
                        شدت: {row.incident_severity.name}
                      </span>
                    )}
                  </div>
                  {row.description && (
                    <p className="mt-1 max-w-[260px] truncate text-[10px] text-slate-500">
                      {row.description}
                    </p>
                  )}
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  {fullName(row.officer)}
                  <p className="text-xs text-slate-500" dir="ltr">
                    {row.officer?.personnel_code ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">{row.patrol_unit?.name ?? "—"}</p>
                </td>
                <td className={`${cell} whitespace-nowrap`}>{formatDate(row.sort_at)}</td>
                <td className={cell}>
                  <StatusBadge kind="sync" value={row.sync_status} />
                  {row.rejection_reason && (
                    <p className="mt-1 max-w-[180px] truncate text-[10px] text-rose-200">
                      {row.rejection_reason}
                    </p>
                  )}
                </td>
                <td className={cell}>
                  <StatusBadge kind="review" value={row.review_status} />
                  {row.review_reason && (
                    <p className="mt-1 max-w-[180px] truncate text-[10px] text-orange-200">
                      {row.review_reason}
                    </p>
                  )}
                </td>
                <td className={cell}>
                  <Provenance row={row} />
                </td>
                <td className={cell}>
                  <RowLink
                    row={row}
                    base={detailBase}
                    title="مشاهده گزارش"
                    className="whitespace-nowrap text-xs text-blue-300 hover:text-cyan-200"
                  >
                    مشاهده
                  </RowLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => (
          <article key={row._id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <RowLink
                  row={row}
                  base={detailBase}
                  className="font-semibold text-blue-200"
                >
                  {reportLabel(row)}
                </RowLink>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(row.sort_at)} · {row.group_title ?? "فرم"}
                </p>
              </div>
              <input
                type="checkbox"
                className="mt-1 accent-blue-500"
                aria-label={`انتخاب گزارش ${reportLabel(row)}`}
                checked={selected.includes(row._id)}
                onChange={() => onToggle(row._id)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                  reportSourceTone(row.source)
                }`}
              >
                <FormIcon name={row.group_icon} size={11} />
                {row.group_title ?? "فرم"}
              </span>
              <StatusBadge kind="sync" value={row.sync_status} />
              <StatusBadge kind="review" value={row.review_status} />
            </div>
            <p className="text-xs text-slate-400">
              {fullName(row.officer)} · {row.patrol_unit?.name ?? "واحد نامشخص"}
            </p>
            <Provenance row={row} />
            {row.review_reason && (
              <p className="rounded-lg border border-orange-400/20 bg-orange-400/5 p-2 text-xs leading-5 text-orange-100">
                {row.review_reason}
              </p>
            )}
            <RowLink row={row} base={detailBase} className="text-xs text-blue-300">
              جزئیات
            </RowLink>
          </article>
        ))}
      </div>
    </div>
  );
}