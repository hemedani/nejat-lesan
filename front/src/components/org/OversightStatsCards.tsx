"use client";

import { PanelCard, PageSkeleton } from "@/components/patrol/ui";
import type {
  OversightAgingStat,
  OversightAppVersionStat,
  OversightOfficerStat,
} from "@/services/report-sources";

const count = (value: number): string => value.toLocaleString("fa-IR");

/**
 * `median_sync_ms` as a person would say it.
 *
 * The act distinguishes "no row carried a sync instant" (`null`) from "the officer
 * synced in under a second", and the panel keeps that distinction: `null` is an em
 * dash and never `۰`, because a zero next to an officer reads as "instantly synced"
 * rather than "we do not know". Below a second is said in words for the same reason
 * — there is no honest zero to print.
 *
 * Past a day the hours are kept, because rounding them away is how 30 hours becomes
 * «۱ روز» — a number the reviewer would then compare against another organization's
 * median and lose on. One rounding, applied to the hours, so «۱ روز و ۲۴ ساعت» cannot
 * be produced either.
 *
 * The same rule one band down: a median under a minute rounds to `۰ دقیقه`, which is
 * the misleading zero this function exists to avoid, so it is said in words instead.
 */
const formatMedianSync = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return "کمتر از یک ثانیه";
  const minutes = ms / 60000;
  if (minutes < 1) return "کمتر از یک دقیقه";
  if (minutes < 60) {
    return `${count(Math.round(minutes))} دقیقه`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${count(hours)} ساعت`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest === 0
    ? `${count(days)} روز`
    : `${count(days)} روز و ${count(rest)} ساعت`;
};

const officerName = (row: OversightOfficerStat): string =>
  row.unattributed
    ? "بدون گزارش‌دهنده"
    : [row.first_name, row.last_name].filter(Boolean).join(" ") || "نامشخص";

const cell = "px-3 py-2.5 text-xs";

/**
 * The three statistic blocks that sit above the oversight table.
 *
 * They describe the same rows the table below shows, because the view hands both
 * acts the same filter object. Anything a reviewer reads here is therefore a count
 * of something they can go and look at — a `queued` figure they cannot find in the
 * table would be worse than no figure at all.
 */
export function OversightStatsCards({
  byOfficer,
  byAppVersion,
  aging,
  loading,
}: {
  byOfficer: OversightOfficerStat[];
  byAppVersion: OversightAppVersionStat[];
  aging: OversightAgingStat;
  loading?: boolean;
}) {
  if (loading) return <PageSkeleton blocks={[120, 120]} />;

  const stuck = aging.queued + aging.under_review;

  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-2">
      <PanelCard title="گزارش‌دهندگان">
        {byOfficer.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            برای این فیلتر گزارشی ثبت نشده است.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-right text-sm">
              <thead className="sticky top-0 bg-slate-900 text-xs text-slate-500">
                <tr>
                  <th className={cell}>گزارش‌دهنده</th>
                  <th className={cell}>کل</th>
                  <th className={cell}>در صف</th>
                  <th className={cell}>ردشده</th>
                  <th className={cell}>برگشتی</th>
                  <th className={cell}>میانهٔ همگام‌سازی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {byOfficer.map((row) => (
                  <tr key={row.officer_id} className="text-slate-300">
                    <td className={cell}>
                      <span className={row.unattributed ? "text-slate-400" : undefined}>
                        {officerName(row)}
                      </span>
                      {row.personnel_code && (
                        <span className="block text-[10px] text-slate-500" dir="ltr">
                          {row.personnel_code}
                        </span>
                      )}
                    </td>
                    <td className={cell}>{count(row.total)}</td>
                    <td className={cell}>{row.queued > 0 ? count(row.queued) : "—"}</td>
                    <td className={cell}>{row.rejected > 0 ? count(row.rejected) : "—"}</td>
                    <td className={cell}>{row.returned > 0 ? count(row.returned) : "—"}</td>
                    <td className={`${cell} whitespace-nowrap`}>
                      {formatMedianSync(row.median_sync_ms)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>

      <div className="space-y-4">
        <PanelCard title="نسخهٔ اپلیکیشن">
          {byAppVersion.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              برای این فیلتر گزارشی ثبت نشده است.
            </p>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className={cell}>نسخه</th>
                  <th className={cell}>کل</th>
                  <th className={cell}>ردشده</th>
                  <th className={cell}>مأموران متمایز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {byAppVersion.map((row) => (
                  <tr key={row.app_version} className="text-slate-300">
                    <td className={`${cell} font-medium`} dir={row.app_version === "—" ? "rtl" : "ltr"}>
                      {row.app_version === "—" ? "خارج از اپلیکیشن" : row.app_version}
                    </td>
                    <td className={cell}>{count(row.total)}</td>
                    <td className={cell}>{row.rejected > 0 ? count(row.rejected) : "—"}</td>
                    <td className={cell}>{count(row.distinct_officers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PanelCard>

        <PanelCard title="گزارش‌های معطل">
          <p className="mb-3 text-xs text-slate-500">
            بیش از{" "}
            <span className="text-slate-300">{count(aging.thresholdHours)} ساعت</span> در این
            وضعیت مانده‌اند:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <AgingTile label="در صف همگام‌سازی" value={aging.queued} />
            <AgingTile label="در حال بررسی" value={aging.under_review} />
          </div>
          {stuck === 0 && (
            <p className="mt-3 text-xs text-emerald-200">
              هیچ گزارشی بیش از این مدت معطل نمانده است.
            </p>
          )}
        </PanelCard>
      </div>
    </div>
  );
}

function AgingTile({ label, value }: { label: string; value: number }) {
  const stalled = value > 0;
  return (
    <div
      className={`rounded-xl border p-3 ${
        stalled
          ? "border-amber-400/25 bg-amber-400/10"
          : "border-white/10 bg-white/[.02]"
      }`}
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${stalled ? "text-amber-100" : "text-slate-400"}`}>
        {count(value)}
      </p>
    </div>
  );
}