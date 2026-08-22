import type { StatusSummary } from "@/types/patrol";
import { reviewStatusMeta, syncStatusMeta } from "@/utils/patrol-status";

export function SummaryMetrics({ summary }: { summary?: StatusSummary }) {
  const sync = Object.keys(syncStatusMeta) as Array<keyof typeof syncStatusMeta>;
  const review = Object.keys(reviewStatusMeta) as Array<keyof typeof reviewStatusMeta>;
  return <div className="space-y-5">
    <div><p className="mb-2 text-xs font-semibold text-slate-500">وضعیت همگام‌سازی</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{sync.map((status) => <Metric key={status} label={syncStatusMeta[status].label} value={summary?.sync?.[status] || 0} accent={syncStatusMeta[status].className} />)}</div></div>
    <div><p className="mb-2 text-xs font-semibold text-slate-500">وضعیت بررسی</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{review.map((status) => <Metric key={status} label={reviewStatusMeta[status].label} value={summary?.review?.[status] || 0} accent={reviewStatusMeta[status].className} />)}</div></div>
  </div>;
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return <div className={`rounded-xl border p-3 ${accent}`}><p className="text-xl font-bold text-white">{value.toLocaleString("fa-IR")}</p><p className="mt-1 text-[11px] leading-5 opacity-80">{label}</p></div>;
}
