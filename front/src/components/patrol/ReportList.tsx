"use client";

import Link from "next/link";
import type { PatrolReport } from "@/types/patrol";
import { StatusBadge } from "@/components/patrol/StatusBadge";
import { EmptyState } from "@/components/patrol/ui";
import { INCIDENT_TYPE_LABELS } from "@/utils/org";

export const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })
    : "ثبت نشده";

export const fullName = (user?: { first_name?: string; last_name?: string }) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "نامشخص";

export const incidentTypeTone = (type?: string): string => {
  switch (type) {
    case "accident":
      return "tint-rose border-tint-border bg-tint-soft text-tint-fg";
    case "road_breakdown":
      return "tint-amber border-tint-border bg-tint-soft text-tint-fg";
    case "road_obstacle":
      return "tint-orange border-tint-border bg-tint-soft text-tint-fg";
    case "other":
      return "border-line-strong/25 bg-surface-hover text-fg";
    default:
      return "";
  }
};

/**
 * A row can originate from either the legacy `accident` collection or the
 * dynamic `incident_report` one, so the badge has to say which. The oversight
 * table reads a row from both, hence the shared tone helper.
 */
export const reportSourceTone = (
  source?: "accident" | "incident_report",
): string => {
  switch (source) {
    case "accident":
      return "tint-rose border-tint-border bg-tint-soft text-tint-fg";
    case "incident_report":
      return "tint-blue border-tint-border bg-tint-soft text-tint-fg";
    default:
      return "border-line bg-surface-sunken text-fg-muted";
  }
};

export function IncidentBadge({ report }: { report: PatrolReport }) {
  const type = report.incident_type;
  if (!type) return null;
  const tone = incidentTypeTone(type);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${tone}`}>
        {INCIDENT_TYPE_LABELS[type] || type}
      </span>
      {report.incident_severity?.name && (
        <span className="tint-cyan rounded-full border border-tint-border bg-tint-soft px-2 py-0.5 text-[10px] text-tint-fg">
          شدت: {report.incident_severity.name}
        </span>
      )}
      {report.incident_payload?.description && (
        <span className="max-w-[220px] truncate text-[10px] text-fg-faint">{report.incident_payload.description}</span>
      )}
    </div>
  );
}

const reportLabel = (report: PatrolReport) =>
  report.report_id || `#${report.serial || report._id.slice(-6)}`;

const detailHref = (report: PatrolReport, manager: boolean, base?: string) =>
  `${base ?? (manager ? "/patrol-manager" : "/patrol")}/reports/${report._id}`;

export function ReportList({
  reports,
  manager = false,
  detailBase,
}: {
  reports: PatrolReport[];
  manager?: boolean;
  detailBase?: string;
}) {
  if (!reports.length) {
    return <EmptyState message="گزارشی برای نمایش وجود ندارد." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/65">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-line bg-surface-sunken text-xs text-fg-faint">
            <tr>
              {["گزارش", ...(manager ? ["گزارش‌دهنده", "واحد", "خودرو"] : []), "تاریخ حادثه", "همگام‌سازی", "بررسی", ""].map(
                (heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {reports.map((report) => (
              <tr key={report._id} className="text-fg-muted transition hover:bg-surface-sunken">
                <td className="px-4 py-4">
                  <Link className="font-semibold text-brand-fg hover:underline" href={detailHref(report, manager, detailBase)}>
                    {reportLabel(report)}
                  </Link>
                  <p className="mt-1 text-xs text-fg-faint">{report.type?.name || "نوع ثبت نشده"}</p>
                  <IncidentBadge report={report} />
                </td>
                {manager && (
                  <>
                    <td className="px-4 py-4">
                      {fullName(report.officer)}
                      <p className="text-xs text-fg-faint">{report.officer?.personnel_code || "بدون کد"}</p>
                    </td>
                    <td className="px-4 py-4">{report.patrol_unit?.name || report.patrol_unit?.code || "نامشخص"}</td>
                    <td className="px-4 py-4">{report.vehicle?.plaque_no || "نامشخص"}</td>
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-4">{formatDate(report.date_of_accident)}</td>
                <td className="px-4 py-4">
                  <StatusBadge kind="sync" value={report.sync_status} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge kind="review" value={report.review_status} />
                </td>
                <td className="px-4 py-4">
                  <Link href={detailHref(report, manager, detailBase)} aria-label="مشاهده گزارش" className="text-brand-fg hover:underline">
                    مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line md:hidden">
        {reports.map((report) => (
          <article key={report._id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={detailHref(report, manager, detailBase)} className="font-semibold text-brand-fg">
                  {reportLabel(report)}
                </Link>
                <p className="mt-1 text-xs text-fg-faint">
                  {formatDate(report.date_of_accident)} · {report.type?.name || "نوع ثبت نشده"}
                </p>
                <IncidentBadge report={report} />
              </div>
              <Link href={detailHref(report, manager, detailBase)} className="text-xs text-brand-fg">
                جزئیات
              </Link>
            </div>
            {manager && (
              <p className="text-xs text-fg-muted">
                {fullName(report.officer)} · {report.patrol_unit?.name || "واحد نامشخص"}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <StatusBadge kind="sync" value={report.sync_status} />
              <StatusBadge kind="review" value={report.review_status} />
            </div>
            {report.review_reason && (
              <p className="tint-orange rounded-lg border border-tint-border bg-tint-soft p-2 text-xs leading-5 text-tint-fg">
                {report.review_reason}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
