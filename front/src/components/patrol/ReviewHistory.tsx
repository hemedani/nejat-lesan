import type { ReviewHistoryItem } from "@/types/patrol";
import { formatDate, fullName } from "@/components/patrol/ReportList";

const labels: Record<ReviewHistoryItem["action"], string> = { submitted: "ارسال گزارش", started_review: "شروع بررسی", returned: "برگشت برای اصلاح", resubmitted: "ارسال مجدد", approved: "تأیید گزارش", completed: "تکمیل گزارش", reopened: "بازگشایی گزارش" };

export function ReviewHistory({ items }: { items: ReviewHistoryItem[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">سابقه‌ای برای این گزارش ثبت نشده است.</p>;
  return <ol className="space-y-4 border-r border-blue-400/20 pr-5">{items.map((item) => <li key={item._id} className="relative"><span className="absolute -right-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,.7)]" /><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-slate-200">{labels[item.action] || item.action}</p><time className="text-xs text-slate-500">{formatDate(item.action_at)}</time></div><p className="mt-1 text-xs text-slate-500">{fullName(item.reviewer)}</p>{item.reason && <p className="mt-2 rounded-lg border border-white/10 bg-white/[.03] p-3 text-sm leading-6 text-slate-300">{item.reason}</p>}</li>)}</ol>;
}
