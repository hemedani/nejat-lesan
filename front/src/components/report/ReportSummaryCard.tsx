"use client";

import type { ReportDetailDoc, ReportSource } from "@/types/report-detail";
import { Field, MetricTile, Pill } from "@/components/report/kit";

/**
 * The summary rail's top block: four counts, then the facts a reviewer reads
 * before opening anything else.
 *
 * The counts differ by source because the models do. `accident` records
 * `dead_count` / `injured_count` and carries vehicles and people as embedded DTOs;
 * `incident_report` has none of those, and instead carries the three flags that
 * drive a road-damage workflow. Rendering an accident-shaped rail for a
 * non-accident report would show four zeroes, which reads as "nothing happened"
 * rather than "this model does not record that".
 */
export function ReportSummaryCard({
  report,
  source,
}: {
  report: ReportDetailDoc;
  source: ReportSource;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">
        {source === "accident" ? "خلاصه حادثه" : "خلاصه رخداد"}
      </h2>

      {source === "accident" ? (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <MetricTile
              label="فوتی"
              value={report.dead_count ?? 0}
              tone={(report.dead_count ?? 0) > 0 ? "rose" : "neutral"}
            />
            <MetricTile
              label="مجروح"
              value={report.injured_count ?? 0}
              tone={(report.injured_count ?? 0) > 0 ? "amber" : "neutral"}
            />
            <MetricTile label="خودرو" value={report.vehicle_dtos?.length ?? 0} />
            <MetricTile
              label="افراد"
              value={
                (report.people_dtos?.length ?? 0) +
                (report.pedestrian_dtos?.length ?? 0)
              }
            />
          </div>

          <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            <Field
              label="راه"
              value={
                report.road?.name ??
                [report.province?.name, report.city?.name].filter(Boolean).join("، ")
              }
            />
            <Field
              label="کیلومتر"
              value={
                report.kilometer == null
                  ? undefined
                  : `${report.kilometer.toLocaleString("fa-IR")}${
                      report.meter == null ? "" : ` + ${report.meter}`
                    }`
              }
            />
            <Field label="نوع برخورد" value={report.collision_type?.name} />
            <Field label="شدت" value={report.incident_severity?.name} />
            <Field label="نوع رخداد" value={report.type?.name} />
            <Field label="روشنایی" value={report.light_status?.name} />
            <Field
              label="دقت GPS"
              value={
                report.gps_accuracy == null
                  ? undefined
                  : `${report.gps_accuracy.toLocaleString("fa-IR")} متر`
              }
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <RailFlag label="خطر جانی یا تصادف" value={report.is_hazard} />
            <RailFlag label="نیاز به تعمیر" value={report.needs_repair} />
            <RailFlag label="نیاز به پیگیری" value={report.follow_up_required} />
          </div>

          <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            <Field
              label="راه"
              value={
                report.road?.name ??
                [report.province?.name, report.city?.name].filter(Boolean).join("، ")
              }
            />
            <Field
              label="کیلومتر"
              value={
                report.kilometer == null
                  ? undefined
                  : `${report.kilometer.toLocaleString("fa-IR")}${
                      report.meter == null ? "" : ` + ${report.meter}`
                    }`
              }
            />
            <Field label="شدت" value={report.incident_severity?.name} />
            <Field label="موقعیت" value={report.position?.name} />
            <Field label="روشنایی" value={report.light_status?.name} />
            <Field
              label="دقت GPS"
              value={
                report.gps_accuracy == null
                  ? undefined
                  : `${report.gps_accuracy.toLocaleString("fa-IR")} متر`
              }
            />
          </div>
        </>
      )}

      {report.review_status === "returned" && report.review_reason && (
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-2 text-[11px] leading-5 text-amber-100">
          {report.review_reason}
        </p>
      )}
    </section>
  );
}

function RailFlag({ label, value }: { label: string; value?: boolean }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <Pill tone={value ? "amber" : "slate"}>{value ? "بله" : "خیر"}</Pill>
    </div>
  );
}