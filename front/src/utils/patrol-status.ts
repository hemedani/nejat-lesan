import type { ReviewAction, ReviewStatus, SyncStatus } from "@/types/patrol";

export const syncStatusMeta: Record<SyncStatus, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "border-slate-500/40 bg-slate-500/10 text-slate-300" },
  queued: { label: "در صف همگام‌سازی", className: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  syncing: { label: "در حال همگام‌سازی", className: "border-blue-400/40 bg-blue-400/10 text-blue-200" },
  synced: { label: "همگام‌سازی‌شده", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  rejected: { label: "ردشده در همگام‌سازی", className: "border-rose-400/40 bg-rose-400/10 text-rose-200" },
};

export const reviewStatusMeta: Record<ReviewStatus, { label: string; className: string }> = {
  submitted: { label: "ارسال‌شده", className: "border-blue-400/40 bg-blue-400/10 text-blue-200" },
  under_review: { label: "در حال بررسی", className: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  returned: { label: "برگشت برای اصلاح", className: "border-orange-400/40 bg-orange-400/10 text-orange-200" },
  approved: { label: "تأییدشده", className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200" },
  completed: { label: "تکمیل‌شده", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
};

export const normalizeReviewStatus = (status?: ReviewStatus): ReviewStatus => status ?? "submitted";

export const availableReviewActions = (status?: ReviewStatus): ReviewAction[] => {
  switch (normalizeReviewStatus(status)) {
    case "submitted": return ["start_review"];
    case "under_review": return ["return", "approve"];
    case "approved": return ["complete"];
    default: return [];
  }
};

export const reviewActionLabels: Record<ReviewAction, string> = {
  start_review: "شروع بررسی",
  return: "برگشت برای اصلاح",
  approve: "تأیید گزارش",
  complete: "تکمیل گزارش",
};
