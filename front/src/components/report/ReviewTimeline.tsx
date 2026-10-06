"use client";

import type { ReviewHistoryItem } from "@/types/report-detail";
import { formatJalaliDateTime } from "@/utils/formatters";

const ACTION_LABELS: Record<ReviewHistoryItem["action"], string> = {
  submitted: "ارسال",
  started_review: "شروع بررسی",
  returned: "برگشت برای اصلاح",
  resubmitted: "ارسال مجدد",
  approved: "تأیید",
  completed: "تکمیل",
  reopened: "بازگشایی",
};

const ACTION_TONES: Record<ReviewHistoryItem["action"], string> = {
  submitted: "text-slate-400",
  started_review: "text-sky-300",
  returned: "text-amber-300",
  resubmitted: "text-sky-300",
  approved: "text-emerald-300",
  completed: "text-emerald-300",
  reopened: "text-amber-300",
};

/**
 * The review trail, read from the report document itself.
 *
 * `review_history` is an **embedded array** on both models whose `reviewer` is a
 * snapshot, so the whole trail arrives inside the report fetch — there is no second
 * request, and nothing here can fail independently of the page.
 *
 * The stored order is insertion order, which is chronological but not newest-first.
 * The dedicated `getReportReviewHistory` act sorted by `action_at` descending
 * before returning; losing that act means losing that sort, so it is applied here.
 * A few rows in memory is not worth a network round trip to reorder.
 */
export function ReviewTimeline({
  history,
}: {
  history?: ReviewHistoryItem[];
}) {
  if (!history?.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">سوابق بررسی</h2>
        <p className="text-sm text-slate-500">هنوز اقدامی روی این گزارش ثبت نشده است.</p>
      </section>
    );
  }

  const newestFirst = [...history].sort(
    (a, b) => stamp(b.action_at) - stamp(a.action_at),
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">سوابق بررسی</h2>
      <ol className="space-y-3 border-r border-white/10 pr-3">
        {newestFirst.map((item, index) => (
          <li key={item._id ?? `${item.action}-${index}`} className="relative">
            <span
              className="absolute -right-[1.06rem] top-1.5 h-2 w-2 rounded-full bg-slate-600 ring-4 ring-slate-900"
              aria-hidden
            />
            <p className={`text-xs font-semibold ${ACTION_TONES[item.action]}`}>
              {ACTION_LABELS[item.action]}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {[
                [item.reviewer?.first_name, item.reviewer?.last_name]
                  .filter(Boolean)
                  .join(" "),
                when(item.action_at),
              ]
                .filter(Boolean)
                .join(" — ")}
            </p>
            {item.reason && (
              <p className="mt-1 rounded-lg bg-white/[.03] p-2 text-[11px] leading-5 text-slate-400">
                {item.reason}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A missing or unparseable instant sorts last rather than throwing. */
const stamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const when = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : formatJalaliDateTime(date);
};