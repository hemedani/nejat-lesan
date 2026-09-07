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
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
    case "road_breakdown":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "road_obstacle":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "other":
      return "border-slate-400/25 bg-slate-400/10 text-slate-200";
    default:
      return "";
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
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
          شدت: {report.incident_severity.name}
        </span>
      )}
      {report.incident_payload?.description && (
        <span className="max-w-[220px] truncate text-[10px] text-slate-500">{report.incident_payload.description}</span>
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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-white/10 bg-white/[.03] text-xs text-slate-500">
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
          <tbody className="divide-y divide-white/5">
            {reports.map((report) => (
              <tr key={report._id} className="text-slate-300 transition hover:bg-white/[.03]">
                <td className="px-4 py-4">
                  <Link className="font-semibold text-blue-200 hover:text-cyan-200" href={detailHref(report, manager, detailBase)}>
                    {reportLabel(report)}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{report.type?.name || "نوع ثبت نشده"}</p>
                  <IncidentBadge report={report} />
                </td>
                {manager && (
                  <>
                    <td className="px-4 py-4">
                      {fullName(report.officer)}
                      <p className="text-xs text-slate-500">{report.officer?.personnel_code || "بدون کد"}</p>
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
                  <Link href={detailHref(report, manager, detailBase)} aria-label="مشاهده گزارش" className="text-blue-300 hover:text-cyan-200">
                    مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-white/5 md:hidden">
        {reports.map((report) => (
          <article key={report._id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={detailHref(report, manager, detailBase)} className="font-semibold text-blue-200">
                  {reportLabel(report)}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(report.date_of_accident)} · {report.type?.name || "نوع ثبت نشده"}
                </p>
                <IncidentBadge report={report} />
              </div>
              <Link href={detailHref(report, manager, detailBase)} className="text-xs text-blue-300">
                جزئیات
              </Link>
            </div>
            {manager && (
              <p className="text-xs text-slate-400">
                {fullName(report.officer)} · {report.patrol_unit?.name || "واحد نامشخص"}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <StatusBadge kind="sync" value={report.sync_status} />
              <StatusBadge kind="review" value={report.review_status} />
            </div>
            {report.review_reason && (
              <p className="rounded-lg border border-orange-400/20 bg-orange-400/5 p-2 text-xs leading-5 text-orange-100">
                {report.review_reason}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
